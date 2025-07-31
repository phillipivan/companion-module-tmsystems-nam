import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
//import { TCPConnection } from 'aes70/src/controller/tcp_connection.js'
//import { DeviceTree, RemoteDevice } from 'aes70/src/controller/remote_device.js'
import { TCPConnection, RemoteDevice, DeviceTree } from 'aes70'

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	config!: ModuleConfig // Setup in init()
	client!: RemoteDevice
	connection!: TCPConnection

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config

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
		this.config = config
		process.title = this.label
		this.connect(config).catch(() => {})
	}

	async connect(config: ModuleConfig): Promise<void> {
		if (this.client) this.client.removeAllEventListeners()
		if (this.connection) this.connection.close()
		if (config.host === undefined || config.host === '') {
			this.updateStatus(InstanceStatus.BadConfig, `No host`)
			return
		}
		this.connection = await TCPConnection.connect({
			host: config.host,
			port: config.port ?? 65000,
		})
		this.client = new RemoteDevice(this.connection)
		this.client.on('error', (error: unknown) => {
			console.log(error)
		})
		this.client.on('close', (error: unknown) => {
			console.log(error)
		})

		this.client.set_keepalive_interval(1)
		console.log('Device name:', await this.client.DeviceManager.GetModelDescription())
		const tree = await this.client.get_device_tree()
		const rec = async (a: DeviceTree) => {
			for (let i = 0; i < a.length; i++) {
				const obj = a[i]

				if (Array.isArray(obj)) {
					// children
					await rec(obj)
				} else {
					// @ts-expect-error node type may not have a value property
					console.log('Type: %s', obj.constructor.ClassName)
					this.log('info', JSON.stringify(obj))
					console.log('Properties:')
					// @ts-expect-error node type may not have a value property
					const properties = obj.GetPropertySync()

					// fetch the values of all properties from the device.
					await properties.sync()

					properties.forEach((value: any, name: any) => {
						if (value !== undefined) console.log('  %s: %o', name, value)
					})

					// unsubscribe all event handlers
					properties.Dispose()
				}
			}
		}

		await rec(tree)
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

runEntrypoint(ModuleInstance, UpgradeScripts)
