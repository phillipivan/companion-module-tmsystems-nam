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
	client!: RemoteDevice
	connection!: TCPConnection | UDPConnection | WebSocket
	ocaHelper = new OcaHelper()

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = handleBonjourHost(config)

		this.updateStatus(InstanceStatus.Connecting)

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
		this.configUpdated(config).catch(() => {})
	}
	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
		if (this.client) this.client.removeAllEventListeners()
		if (this.connection) this.connection.close()
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = handleBonjourHost(config)

		this.connect(config).catch(() => {})
	}

	async connect(config: ModuleConfig): Promise<void> {
		if (this.client) this.client.removeAllEventListeners()
		if (this.connection) this.connection.close()
		if (config.host === undefined || config.host === '') {
			this.updateStatus(InstanceStatus.BadConfig, `No host`)
			return
		}
		if (config.protocol === 'ws') this.connection = await this.initWebSocketConnection(config)
		else if (config.protocol === 'udp') this.connection = await this.initUdpConnection(config)
		else this.connection = await this.initTcpConnection(config)
		this.client = new RemoteDevice(this.connection)
		this.client.on('error', (error: unknown) => {
			this.log('error', `Connection error: ${error}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, `Connection error: ${error}`)
			this.ocaHelper.clearAllIds('*') // clear all action/feedback IDs on connection failure
			this.client.removeAllEventListeners()
		})
		this.client.on('close', (error: unknown) => {
			this.log('warn', `Connection closed: ${error}`)
		})

		this.client.set_keepalive_interval(5)
		this.log('info', `Connected to Device:\n${JSON.stringify(await this.client.DeviceManager.GetProduct())}`)
		const rollMap = await this.client.get_role_map()
		this.ocaHelper.loadRoleMap(rollMap)
		this.ocaHelper.getClassNames().forEach((className) => {
			this.log('info', `Class: ${className} (${this.ocaHelper.getByClass(className).size} objects)`)
		})
		this.updateStatus(InstanceStatus.Ok)
	}

	async initTcpConnection(config: ModuleConfig): Promise<TCPConnection> {
		return TCPConnection.connect({
			host: config.host,
			port: config.port || 65000,
		})
	}

	async initUdpConnection(config: ModuleConfig): Promise<UDPConnection> {
		return UDPConnection.connect({
			host: config.host,
			port: config.port || 65000,
		})
	}

	async initWebSocketConnection(config: ModuleConfig): Promise<WebSocketConnection> {
		return WebSocketConnection.connect({ url: `ws://${config.host}:${config.port || 65000}` })
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}
}
