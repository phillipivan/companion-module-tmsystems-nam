import { InstanceBase, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { DEFAULT_PORT, GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { WebSocket } from 'ws'
import { TCPConnection, UDPConnection, WebSocketConnection, RemoteDevice, type WebSocketConstructor } from 'aes70'
import { debounce, type DebouncedFunction, throttle, type ThrottledFunction } from 'es-toolkit'
import { OcaModuleTypes } from './types.js'
import { handleBonjourHost } from './utils.js'
import { OcaHelper } from './OcaHelper.js'

export { UpgradeScripts }

const FEEDBACK_THOTTLE_MS = 30
const RECONNECT_DEBOUNCE = 10000
const KEEPALIVE_INTERVAL = 2
const ROLE_MAP_REFRESH_DEBOUNCE_MS = 1000
const SUBSCRIPTION_PROBE_SETTLE_MS = 500

export default class ModuleInstance extends InstanceBase<OcaModuleTypes> {
	private config!: ModuleConfig // Setup in init()
	private client!: RemoteDevice
	private connection!: TCPConnection | UDPConnection | WebSocket
	public ocaHelper = new OcaHelper()
	private feedbacksToCheck: Set<string> = new Set()
	private controller = new AbortController()
	private throttledCheckFeedbacksById: ThrottledFunction<() => void> = this.createThrottledFeedbackCheck(
		this.controller.signal,
	)
	private debouncedReconnect: DebouncedFunction<() => void> = this.createDebouncedReconnect(this.controller.signal)
	private debouncedRefreshRoleMap: DebouncedFunction<() => void> = this.createDebouncedRoleMapRefresh(
		this.controller.signal,
	)

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
		this.debouncedReconnect = this.createDebouncedReconnect(this.controller.signal)
		this.debouncedRefreshRoleMap = this.createDebouncedRoleMapRefresh(this.controller.signal)
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
		if (this.client) this.client.removeAllEventListeners()
		if (this.connection) this.connection.close()
	}

	private async connect(config: ModuleConfig): Promise<void> {
		// Clean up existing connection and listeners
		this.closeConnection()

		if (config.host === undefined || config.host === '') {
			this.updateStatus(InstanceStatus.BadConfig, `No host`)
			return
		}

		try {
			if (config.protocol === 'ws') this.connection = await this.initWebSocketConnection(config)
			else if (config.protocol === 'udp') this.connection = await this.initUdpConnection(config)
			else this.connection = await this.initTcpConnection(config)

			this.updateStatus(InstanceStatus.Connecting, 'Connection open, setting up remote device...')
		} catch (err) {
			this.log('error', `Connection failed: ${err instanceof Error ? err.message : String(err)}`)
			this.updateStatus(
				InstanceStatus.ConnectionFailure,
				`Connection failed: ${err instanceof Error ? err.message : String(err)}`,
			)

			this.debouncedReconnect()
			return
		}

		this.client = new RemoteDevice(this.connection)

		this.setupClientEventListeners(this.client)

		this.client.set_keepalive_interval(KEEPALIVE_INTERVAL)

		await this.primeSubscriptionSupportProbe(this.client)

		await this.getDeviceInfo(this.client)

		await this.getRoleMap(this.client)
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

			this.debouncedReconnect()
		})

		client.on('close', (error: unknown) => {
			this.log('warn', `Connection closed: ${error instanceof Error ? error.message : String(error)}`)
			this.updateStatus(
				InstanceStatus.Disconnected,
				`Connection closed: ${error instanceof Error ? error.message : String(error)}`,
			)

			this.debouncedReconnect()
		})
	}

	private async getDeviceInfo(client: RemoteDevice): Promise<void> {
		try {
			const product = await client.DeviceManager.GetProduct()
			this.log('info', `Connected to Device:\n${JSON.stringify(product, null, 2)}`)
			this.debouncedReconnect.cancel()
		} catch (err) {
			this.log(
				'debug',
				`GetProduct() not supported by this device: ${err instanceof Error ? err.message : String(err)}`,
			)
		}
	}

	private async getRoleMap(client: RemoteDevice): Promise<void> {
		try {
			const rollMap = await client.get_role_map()
			await this.ocaHelper.loadRoleMap(rollMap)
			this.debouncedReconnect.cancel()
		} catch (err) {
			this.log('error', `get_role_map() failed: ${err instanceof Error ? err.message : String(err)}`)
			if (err instanceof Error) {
				this.log('warn', `Error Name: ${err.name}`)
				if (err.cause) this.log('warn', `Cause: ${JSON.stringify(err.cause, null, 2)}`)
				if (err.stack) this.log('debug', `Stack: ${err.stack}`)
			}
			this.updateStatus(
				InstanceStatus.UnknownError,
				`get_role_map() failed: ${err instanceof Error ? err.message : String(err)}`,
			)

			// No point keeping the connection open if we can't talk to the device
			this.closeConnection()
			this.log('error', `Connection closed. Reconnection will not be attempted (😞). Check device before trying again.`)
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

	private createDebouncedReconnect(signal?: AbortSignal): DebouncedFunction<() => void> {
		return debounce(
			() => {
				this.log('info', `Attempting to reconnect...`)
				void this.connect(this.config)
			},
			RECONNECT_DEBOUNCE,
			{ edges: ['trailing'], signal: signal },
		)
	}

	private createDebouncedRoleMapRefresh(signal?: AbortSignal): DebouncedFunction<() => void> {
		return debounce(
			() => {
				this.log('info', 'Refreshing role map after device tree change')
				void this.getRoleMap(this.client)
			},
			ROLE_MAP_REFRESH_DEBOUNCE_MS,
			{ edges: ['trailing'], signal: signal },
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
