import { InstanceBase, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { WebSocket } from 'ws'
import { TCPConnection, UDPConnection, WebSocketConnection, RemoteDevice } from 'aes70'
import { OcaModuleTypes } from './types.js'
import { handleBonjourHost } from './utils.js'
import { OcaHelper } from './OcaHelper.js'

export { UpgradeScripts }

export default class ModuleInstance extends InstanceBase<OcaModuleTypes> {
	config!: ModuleConfig // Setup in init()
	private client!: RemoteDevice
	private connection!: TCPConnection | UDPConnection | WebSocket
	public ocaHelper = new OcaHelper()

	constructor(internal: unknown) {
		super(internal)
	}

	public async init(config: ModuleConfig): Promise<void> {
		this.config = handleBonjourHost(config)

		this.updateStatus(InstanceStatus.Connecting)

		this.ocaHelper.on('map:loaded', (roleMap) => {
			this.log('info', `Role map loaded: ${roleMap.size} entries`)
			this.ocaHelper.getClassNames().forEach((className) => {
				this.log('info', `Class: ${className} (${this.ocaHelper.getByClass(className).size} objects)`)
			})
			this.updateStatus(InstanceStatus.Ok)

			// Set action and feedback defintions now that we know what controlclasses the device has
			this.updateCompanionBits()
		})

		this.ocaHelper.on('ids:orphaned', (orphanedIds) => {
			this.log(
				'warn',
				`Orphaned IDs detected: ${orphanedIds.length} Action or Feedback IDs have no associated object\n${orphanedIds.join(', ')}`,
			)
		})

		void this.configUpdated(config)
	}
	// When module gets deleted
	public async destroy(): Promise<void> {
		this.log('debug', `destroy ${this.id}:${this.label}`)
		if (this.client) this.client.removeAllEventListeners()
		if (this.connection) this.connection.close()
	}

	public async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = handleBonjourHost(config)

		void this.connect(config)
	}

	private updateCompanionBits(): void {
		this.log('debug', 'Updating Companion bits')
		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
	}

	private async connect(config: ModuleConfig): Promise<void> {
		// Clean up existing connection and listeners
		if (this.client) this.client.removeAllEventListeners()
		if (this.connection) this.connection.close()

		if (config.host === undefined || config.host === '') {
			this.updateStatus(InstanceStatus.BadConfig, `No host`)
			return
		}

		if (config.protocol === 'ws') this.connection = await this.initWebSocketConnection(config)
		else if (config.protocol === 'udp') this.connection = await this.initUdpConnection(config)
		else this.connection = await this.initTcpConnection(config)
		this.updateStatus(InstanceStatus.Connecting, 'Connected to device, loading role map...')

		this.client = new RemoteDevice(this.connection)

		this.client.on('error', (error: unknown) => {
			this.log('error', `Connection error: ${error instanceof Error ? error.message : String(error)}`)
			this.updateStatus(
				InstanceStatus.ConnectionFailure,
				`Connection error: ${error instanceof Error ? error.message : String(error)}`,
			)

			// TO DO: Implement retry logic with backoff
		})

		this.client.on('close', (error: unknown) => {
			this.log('warn', `Connection closed: ${error instanceof Error ? error.message : String(error)}`)
			this.updateStatus(
				InstanceStatus.Disconnected,
				`Connection closed: ${error instanceof Error ? error.message : String(error)}`,
			)
		})

		this.client.set_keepalive_interval(5)
		this.log('info', `Connected to Device:\n${JSON.stringify(await this.client.DeviceManager.GetProduct(), null, 2)}`)
		const rollMap = await this.client.get_role_map()
		this.ocaHelper.loadRoleMap(rollMap)
	}

	private async initTcpConnection(config: ModuleConfig): Promise<TCPConnection> {
		return TCPConnection.connect({
			host: config.host,
			port: config.port || 65000,
		})
	}

	private async initUdpConnection(config: ModuleConfig): Promise<UDPConnection> {
		return UDPConnection.connect({
			host: config.host,
			port: config.port || 65000,
		})
	}

	private async initWebSocketConnection(config: ModuleConfig): Promise<WebSocketConnection> {
		return WebSocketConnection.connect({ url: `ws://${config.host}:${config.port || 65000}` })
	}

	// Return config fields for web config
	public getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	private updateActions(): void {
		UpdateActions(this)
	}

	private updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	private updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}
}
