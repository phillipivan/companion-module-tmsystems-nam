import { InstanceBase, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { DEFAULT_PORT, GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { WebSocket } from 'ws'
import {
	CloseError,
	TCPConnection,
	UDPConnection,
	WebSocketConnection,
	RemoteDevice,
	type WebSocketConstructor,
} from 'aes70'
import { debounce, type DebouncedFunction, throttle, type ThrottledFunction } from 'es-toolkit'
import { OcaModuleTypes } from './types.js'
import { handleBonjourHost } from './utils.js'
import { OcaHelper } from './OcaHelper.js'
import { BackoffScheduler, RECONNECT_BACKOFF, ROLE_MAP_REFRESH_BACKOFF } from './reconnect.js'

export { UpgradeScripts }

const FEEDBACK_THOTTLE_MS = 30
const KEEPALIVE_INTERVAL = 2
const ROLE_MAP_REFRESH_DEBOUNCE_MS = 1000
const SUBSCRIPTION_PROBE_SETTLE_MS = 500
/** Consecutive failed connection attempts after which the log suggests checking the host is an AES70 device. */
const NOT_AES70_HINT_AFTER_ATTEMPTS = 3

export default class ModuleInstance extends InstanceBase<OcaModuleTypes> {
	private config!: ModuleConfig // Setup in init()
	private client!: RemoteDevice
	private connection!: TCPConnection | UDPConnection | WebSocketConnection
	public ocaHelper = new OcaHelper()
	private feedbacksToCheck: Set<string> = new Set()
	private controller = new AbortController()
	/** Aborted when a newer connect() call supersedes the one in flight. */
	private connectAttempt: AbortController | undefined
	private throttledCheckFeedbacksById: ThrottledFunction<() => void> = this.createThrottledFeedbackCheck(
		this.controller.signal,
	)
	private reconnect: BackoffScheduler = this.createReconnectScheduler(this.controller.signal)
	private debouncedRefreshRoleMap: DebouncedFunction<() => void> = this.createDebouncedRoleMapRefresh(
		this.controller.signal,
	)
	private roleMapRefreshRetry: BackoffScheduler = this.createRoleMapRefreshRetry(this.controller.signal)

	constructor(internal: unknown) {
		super(internal)
	}

	public async init(config: ModuleConfig): Promise<void> {
		this.config = handleBonjourHost(config)

		this.updateStatus(InstanceStatus.Connecting)

		// Setup OcaHelper event listeners they dont need to be reset with every connection
		this.ocaHelper.on('map:loaded', (roleMap) => {
			this.log('info', `Role map loaded: ${roleMap.size} entries`)
			this.ocaHelper.getClassNames().forEach((className) => {
				this.log('info', `Class: ${className} (${this.ocaHelper.getByClass(className).size} objects)`)
			})
			this.updateStatus(InstanceStatus.Ok)

			// Set action and feedback defintions now that we know what controlclasses the device has
			void this.updateCompanionBits()
		})

		this.ocaHelper.on('ids:orphaned', (orphanedIds) => {
			this.log(
				'warn',
				`Orphaned IDs detected: ${orphanedIds.length} Action or Feedback IDs have no associated object\n${orphanedIds.join(', ')}`,
			)
		})
		this.ocaHelper.on('property:change', (feedbackIds) => {
			this.feedbacksToCheck = new Set([...this.feedbacksToCheck, ...feedbackIds])
			this.throttledCheckFeedbacksById()
		})
		this.ocaHelper.on('tree:changed', (rolePath) => {
			this.log('info', `Device tree changed under "${rolePath}" — scheduling role map refresh`)
			this.debouncedRefreshRoleMap()
		})

		void this.configUpdated(config)
	}
	// When module gets deleted
	public async destroy(): Promise<void> {
		this.log('debug', `destroy ${this.id}:${this.label}`)
		this.controller.abort()
		this.closeConnection()
	}

	public async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = handleBonjourHost(config)
		this.controller.abort()
		this.controller = new AbortController()
		this.feedbacksToCheck.clear()
		this.throttledCheckFeedbacksById = this.createThrottledFeedbackCheck(this.controller.signal)
		this.reconnect = this.createReconnectScheduler(this.controller.signal)
		this.debouncedRefreshRoleMap = this.createDebouncedRoleMapRefresh(this.controller.signal)
		this.roleMapRefreshRetry = this.createRoleMapRefreshRetry(this.controller.signal)
		void this.connect(config)
	}

	private async updateCompanionBits(): Promise<void> {
		this.log('debug', 'Updating Companion bits')
		await this.updateActions()
		await this.updateFeedbacks()
		this.updateVariableDefinitions()

		// Make sure all role paths are registered
		this.subscribeActions()
		this.checkAllFeedbacks()
	}

	private closeConnection(): void {
		// A role map refresh only means anything on the connection it was scheduled for
		this.debouncedRefreshRoleMap.cancel()
		this.roleMapRefreshRetry.reset()
		if (this.client) this.client.removeAllEventListeners()
		if (this.connection) this.connection.close()
	}

	/**
	 * Only the most recent call may adopt a connection. Each call supersedes the
	 * attempt still in flight, if any, and a superseded attempt stands down at
	 * its next await: before adopting, it closes the connection it opened, since
	 * closeConnection() ran before that connection existed and nothing else would
	 * close it; after adopting, it just stops, since the newer call's
	 * closeConnection() has already closed its connection, and carrying on would
	 * act on this.connection, which now belongs to the newer attempt. destroy()
	 * and configUpdated() stand it down the same way, via the instance controller.
	 */
	private async connect(config: ModuleConfig): Promise<void> {
		this.connectAttempt?.abort()
		this.connectAttempt = new AbortController()
		const signal = AbortSignal.any([this.controller.signal, this.connectAttempt.signal])

		// Clean up existing connection and listeners
		this.closeConnection()

		if (config.host === undefined || config.host === '') {
			this.updateStatus(InstanceStatus.BadConfig, `No host`)
			return
		}

		let connection: TCPConnection | UDPConnection | WebSocketConnection
		try {
			if (config.protocol === 'ws') connection = await this.initWebSocketConnection(config)
			else if (config.protocol === 'udp') connection = await this.initUdpConnection(config)
			else connection = await this.initTcpConnection(config)
		} catch (err) {
			// A superseded attempt failing is of no consequence
			if (signal.aborted) return
			this.log('error', `Connection failed: ${err instanceof Error ? err.message : String(err)}`)
			this.updateStatus(
				InstanceStatus.ConnectionFailure,
				`Connection failed: ${err instanceof Error ? err.message : String(err)}`,
			)

			this.scheduleReconnect()
			return
		}

		if (signal.aborted) {
			this.log('debug', 'Connection attempt was superseded while opening, closing it')
			connection.close()
			return
		}

		this.connection = connection
		this.updateStatus(InstanceStatus.Connecting, 'Connection open, setting up remote device...')

		const client = new RemoteDevice(connection)
		this.client = client

		this.setupClientEventListeners(client)

		client.set_keepalive_interval(KEEPALIVE_INTERVAL)

		await this.primeSubscriptionSupportProbe(client)
		if (signal.aborted) return

		await this.getDeviceInfo(client, signal)
		if (signal.aborted) return

		await this.getRoleMap(client, signal)
	}

	/**
	 * aes70's RemoteDevice probes AddSubscription2 ("EV2") support on the very
	 * first subscribe() of a session, falling back to the older v1
	 * AddSubscription if the device rejects it — but any subscribe() issued
	 * concurrently with that first probe just awaits the same in-flight
	 * promise with no fallback of its own, so on a device that doesn't
	 * support AddSubscription2 its subscription is silently and permanently
	 * dropped (a race condition in aes70's remote_device.js _doSubscribe).
	 *
	 * loadRoleMap() and checkAllFeedbacks()/subscribeActions() both subscribe
	 * to many objects in a tight synchronous burst right after connecting, so
	 * without this, most of those race the probe and lose. Firing one
	 * throwaway subscribe here first, and giving it time to settle before any
	 * of that bulk subscribing starts, keeps everything after it out of the
	 * race window.
	 */
	private async primeSubscriptionSupportProbe(client: RemoteDevice): Promise<void> {
		try {
			const unsubscribe = client.DeviceManager.OnPropertyChanged.subscribe(
				() => undefined,
				() => undefined,
			)
			await new Promise((resolve) => setTimeout(resolve, SUBSCRIPTION_PROBE_SETTLE_MS))
			unsubscribe()
		} catch (err) {
			this.log(
				'debug',
				`Priming subscription-support probe failed: ${err instanceof Error ? err.message : String(err)}`,
			)
		}
	}

	/**
	 * aes70 batches same-type PDUs into a single OCP.1 message (messageCount > 1)
	 * up to this many bytes. That is spec-legal, but some devices only ever read
	 * one PDU per message and then resync from the wrong stream offset, reporting
	 * a nonsense message length and dropping the connection. A batch size of 0
	 * flushes every PDU as its own message, which those devices accept.
	 *
	 * Returns `undefined` when batching is enabled so the library keeps its own
	 * per-transport default.
	 */
	private batchSizeFor(config: ModuleConfig): number | undefined {
		return config.batchCommands ? undefined : 0
	}

	private async initTcpConnection(config: ModuleConfig): Promise<TCPConnection> {
		this.log('info', `Initializing TCP connection to ${config.host}:${config.port || DEFAULT_PORT}`)
		return TCPConnection.connect({
			host: config.host,
			port: config.port || DEFAULT_PORT,
			batch: this.batchSizeFor(config),
		})
	}

	private async initUdpConnection(config: ModuleConfig): Promise<UDPConnection> {
		this.log('info', `Initializing UDP connection to ${config.host}:${config.port || DEFAULT_PORT}`)
		return UDPConnection.connect({
			host: config.host,
			port: config.port || DEFAULT_PORT,
			batch: this.batchSizeFor(config),
		})
	}

	private async initWebSocketConnection(config: ModuleConfig): Promise<WebSocketConnection> {
		const WsPath = `ws://${config.host}:${config.port || DEFAULT_PORT}`
		this.log('info', `Initializing WebSocket connection to ${WsPath}`)
		return WebSocketConnection.connect(
			{ url: WsPath, batch: this.batchSizeFor(config) },
			WebSocket as unknown as WebSocketConstructor,
		)
	}

	private setupClientEventListeners(client: RemoteDevice): void {
		client.on('error', (error: unknown) => {
			this.log('error', `Connection error: ${error instanceof Error ? error.message : String(error)}`)
			this.updateStatus(
				InstanceStatus.ConnectionFailure,
				`Connection error: ${error instanceof Error ? error.message : String(error)}`,
			)

			this.scheduleReconnect()
		})

		client.on('close', (error: unknown) => {
			this.log('warn', `Connection closed: ${error instanceof Error ? error.message : String(error)}`)
			this.updateStatus(
				InstanceStatus.Disconnected,
				`Connection closed: ${error instanceof Error ? error.message : String(error)}`,
			)

			this.scheduleReconnect()
		})
	}

	private async getDeviceInfo(client: RemoteDevice, signal: AbortSignal): Promise<void> {
		try {
			const product = await client.DeviceManager.GetProduct()
			if (signal.aborted) return
			this.log('info', `Connected to Device:\n${JSON.stringify(product, null, 2)}`)
			this.reconnect.cancel()
		} catch (err) {
			if (signal.aborted) return
			this.log(
				'debug',
				`GetProduct() not supported by this device: ${err instanceof Error ? err.message : String(err)}`,
			)
		}
	}

	/**
	 * Initial role map load on a new connection. If the device refuses it, drop
	 * the connection and reconnect on the backoff rather than giving up: a device
	 * that was briefly unable to answer (booting, busy) then recovers by itself,
	 * and a host that never will is only retried every few minutes.
	 */
	private async getRoleMap(client: RemoteDevice, signal: AbortSignal): Promise<void> {
		try {
			const roleMap = await client.get_role_map()
			// Superseded while walking the device: don't load a map for a connection already closed
			if (signal.aborted) return
			await this.ocaHelper.loadRoleMap(roleMap)
			if (signal.aborted) return
			this.reconnect.reset()
		} catch (err) {
			// Superseded: the failure belongs to a connection already closed, and closing or
			// rescheduling from here would act on the newer attempt's connection
			if (signal.aborted) return
			if (this.isConnectionLost(err)) {
				// The error/close listener has already set the status and scheduled the reconnect
				this.log(
					'debug',
					`get_role_map() interrupted by connection loss: ${err instanceof Error ? err.message : String(err)}`,
				)
				return
			}
			this.log('error', `get_role_map() failed: ${err instanceof Error ? err.message : String(err)}`)
			if (err instanceof Error) {
				this.log('warn', `Error Name: ${err.name}`)
				if (err.cause) this.log('warn', `Cause: ${JSON.stringify(err.cause, null, 2)}`)
				if (err.stack) this.log('debug', `Stack: ${err.stack}`)
			}
			this.updateStatus(
				InstanceStatus.ConnectionFailure,
				`get_role_map() failed: ${err instanceof Error ? err.message : String(err)}`,
			)

			this.closeConnection()
			this.scheduleReconnect()
		}
	}

	/**
	 * Role map reload after the device reported a tree change. The device has
	 * already served a role map on this connection, so a refusal here is most
	 * likely it being busy mid-restructure: keep the current map and the
	 * connection, and retry on the backoff.
	 */
	private async refreshRoleMap(client: RemoteDevice): Promise<void> {
		try {
			const roleMap = await client.get_role_map()
			// Replaced by a reconnect mid-walk, which loads its own role map
			if (client !== this.client) return
			await this.ocaHelper.loadRoleMap(roleMap)
			this.roleMapRefreshRetry.reset()
		} catch (err) {
			if (client !== this.client) return
			const message = err instanceof Error ? err.message : String(err)
			if (this.isConnectionLost(err)) {
				// The error/close listener has already scheduled the reconnect, which loads a fresh role map
				this.log('debug', `Role map refresh interrupted by connection loss: ${message}`)
				return
			}
			const delay = this.roleMapRefreshRetry.schedule()
			this.log(
				'warn',
				`Role map refresh failed: ${message}. Keeping the current role map` +
					(delay === undefined ? '' : `, retrying in ${delay / 1000}s`),
			)
		}
	}

	/**
	 * Tells a request that failed because the connection went away from one the
	 * device answered with an error. aes70 rejects requests in flight at the
	 * close with a CloseError, but ones issued after it fail with a plain error,
	 * so check the connection as well.
	 */
	private isConnectionLost(err: unknown): boolean {
		return err instanceof CloseError || this.connection.is_closed()
	}

	private scheduleReconnect(): void {
		const delay = this.reconnect.schedule()
		// An attempt is already pending, or the instance is being torn down
		if (delay === undefined) return
		this.log('info', `Reconnecting in ${delay / 1000}s`)
		if (this.reconnect.attempts === NOT_AES70_HINT_AFTER_ATTEMPTS) {
			this.log(
				'warn',
				`${NOT_AES70_HINT_AFTER_ATTEMPTS} consecutive connection attempts have failed. Check the device is powered and reachable, and that the host, port and protocol point at its AES70 interface.`,
			)
		}
	}

	private createThrottledFeedbackCheck(signal?: AbortSignal): ThrottledFunction<() => void> {
		return throttle(
			() => {
				if (this.feedbacksToCheck.size === 0) return
				const feedbackIds = Array.from(this.feedbacksToCheck)
				this.checkFeedbacksById(...feedbackIds)
				this.feedbacksToCheck.clear()
			},
			FEEDBACK_THOTTLE_MS,
			{ edges: ['leading', 'trailing'], signal: signal },
		)
	}

	private createReconnectScheduler(signal: AbortSignal): BackoffScheduler {
		return new BackoffScheduler(
			() => {
				this.log('info', `Attempting to reconnect...`)
				void this.connect(this.config)
			},
			RECONNECT_BACKOFF,
			signal,
		)
	}

	private createDebouncedRoleMapRefresh(signal?: AbortSignal): DebouncedFunction<() => void> {
		return debounce(
			() => {
				this.log('info', 'Refreshing role map after device tree change')
				void this.refreshRoleMap(this.client)
			},
			ROLE_MAP_REFRESH_DEBOUNCE_MS,
			{ edges: ['trailing'], signal: signal },
		)
	}

	private createRoleMapRefreshRetry(signal: AbortSignal): BackoffScheduler {
		return new BackoffScheduler(
			() => {
				this.log('info', 'Retrying role map refresh')
				void this.refreshRoleMap(this.client)
			},
			ROLE_MAP_REFRESH_BACKOFF,
			signal,
		)
	}

	// Return config fields for web config
	public getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	private async updateActions(): Promise<void> {
		await UpdateActions(this)
	}

	private async updateFeedbacks(): Promise<void> {
		await UpdateFeedbacks(this)
	}

	private updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}
}
