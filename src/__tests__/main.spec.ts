import { describe, it, expect, vi, afterEach, type Mock } from 'vitest'
import { WebSocketServer, type WebSocket } from 'ws'
import type * as CompanionBase from '@companion-module/base'
import { InstanceStatus } from '@companion-module/base'
import type * as Reconnect from '../reconnect.js'
import ModuleInstance from '../main.js'
import { FakeOcaDeviceRouter, OcaStatus, registerGetProduct, registerMinimalRoleMap } from './fakeOcaDevice.js'

/**
 * Drives ModuleInstance's connection recovery end to end, against a fake
 * device over a real local WebSocket. InstanceBase is swapped for a stub,
 * since there is no Companion host to talk to, and the backoff delays are
 * shrunk so retries land within the test timeout.
 */

vi.mock('@companion-module/base', async (importOriginal) => {
	const actual = await importOriginal<typeof CompanionBase>()
	class FakeInstanceBase {
		readonly id = 'test'
		readonly label = 'test'
		log = vi.fn()
		updateStatus = vi.fn()
		setActionDefinitions = vi.fn()
		setFeedbackDefinitions = vi.fn()
		setVariableDefinitions = vi.fn()
		subscribeActions = vi.fn()
		checkAllFeedbacks = vi.fn()
		checkFeedbacksById = vi.fn()
	}
	return { ...actual, InstanceBase: FakeInstanceBase }
})

vi.mock('../reconnect.js', async (importOriginal) => {
	const actual = await importOriginal<typeof Reconnect>()
	return {
		...actual,
		RECONNECT_BACKOFF: { initialDelayMs: 50, maxDelayMs: 200 },
		ROLE_MAP_REFRESH_BACKOFF: { initialDelayMs: 50, maxDelayMs: 200 },
	}
})

interface FakeDevice {
	readonly port: number
	/** Connections accepted since start. */
	connections: number
	/** Connections currently open. */
	readonly openConnections: number
	/** Root GetActionObjects requests received, i.e. role map walks started. */
	roleMapRequests: number
	/** Refuse this many upcoming role map walks with ProcessingFailed. */
	refuseRoleMap: number
	/** Drop the socket, unanswered, on this many upcoming role map walks. */
	dropOnRoleMap: number
	close(): Promise<void>
}

async function startFakeDevice(): Promise<FakeDevice> {
	// Answer what the fake doesn't model (the subscription probe) as a real device would
	const router = new FakeOcaDeviceRouter({ unhandledStatus: OcaStatus.NotImplemented })
	const sockets = new Set<WebSocket>()
	let dropPending = false

	const server = new WebSocketServer({ host: '127.0.0.1', port: 0 })
	await new Promise<void>((resolve) => server.once('listening', resolve))
	const address = server.address()
	if (typeof address === 'string' || address === null) throw new Error('Expected an AddressInfo.')

	const device: FakeDevice = {
		port: address.port,
		connections: 0,
		get openConnections() {
			return sockets.size
		},
		roleMapRequests: 0,
		refuseRoleMap: 0,
		dropOnRoleMap: 0,
		close: async () => {
			for (const ws of sockets) ws.terminate()
			await new Promise<void>((resolve) => server.close(() => resolve()))
		},
	}

	registerGetProduct(router, {
		Name: 'Fake Device',
		ModelID: 'FAKE-1',
		RevisionLevel: '1.0',
		BrandName: 'Test Brand',
		UUID: 'urn:uuid:fake-main-device',
		Description: 'Fake device for ModuleInstance tests',
	})
	// No members, so loading the map sends no property reads or subscriptions the fake would have to model
	registerMinimalRoleMap(router, [], () => {
		device.roleMapRequests++
		if (device.dropOnRoleMap > 0) {
			device.dropOnRoleMap--
			dropPending = true
		}
		if (device.refuseRoleMap > 0) {
			device.refuseRoleMap--
			return OcaStatus.ProcessingFailed
		}
		return OcaStatus.OK
	})

	server.on('connection', (ws) => {
		device.connections++
		sockets.add(ws)
		ws.on('close', () => sockets.delete(ws))
		ws.on('message', (data: Buffer) => {
			const buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
			const replies = router.handle(buf)
			if (dropPending) {
				dropPending = false
				ws.terminate()
				return
			}
			for (const reply of replies) ws.send(Buffer.from(reply))
		})
	})

	return device
}

/** The stubbed updateStatus, reached through the stub rather than as an unbound method of ModuleInstance. */
function updateStatusOf(instance: ModuleInstance): Mock<ModuleInstance['updateStatus']> {
	return (instance as unknown as { updateStatus: Mock<ModuleInstance['updateStatus']> }).updateStatus
}

function statusesOf(instance: ModuleInstance): InstanceStatus[] {
	return updateStatusOf(instance).mock.calls.map(([status]) => status)
}

async function waitForOk(instance: ModuleInstance): Promise<void> {
	await vi.waitFor(() => expect(updateStatusOf(instance)).toHaveBeenLastCalledWith(InstanceStatus.Ok), {
		timeout: 5000,
		interval: 20,
	})
}

describe('ModuleInstance connection recovery (fake local device)', () => {
	let device: FakeDevice | undefined
	let instance: ModuleInstance | undefined

	afterEach(async () => {
		await instance?.destroy()
		await device?.close()
		instance = undefined
		device = undefined
	})

	async function connect(fake: FakeDevice): Promise<ModuleInstance> {
		const inst = new ModuleInstance({})
		await inst.init({ host: '127.0.0.1', port: fake.port, protocol: 'ws', batchCommands: true })
		return inst
	}

	it('reconnects after the device refuses the initial role map, rather than giving up', async () => {
		device = await startFakeDevice()
		device.refuseRoleMap = 1

		instance = await connect(device)
		await waitForOk(instance)

		expect(device.roleMapRequests).toBe(2)
		expect(device.connections).toBe(2)
		expect(statusesOf(instance)).toContain(InstanceStatus.ConnectionFailure)
	}, 10000)

	it('retries a refused role map refresh on the same connection, keeping it open', async () => {
		device = await startFakeDevice()
		instance = await connect(device)
		await waitForOk(instance)
		expect(device.roleMapRequests).toBe(1)

		device.refuseRoleMap = 1
		instance.ocaHelper.emit('tree:changed', 'Root')

		// Refused refresh, then the retry
		await vi.waitFor(() => expect(device?.roleMapRequests).toBe(3), { timeout: 5000, interval: 20 })
		await waitForOk(instance)

		expect(device.connections).toBe(1)
		expect(device.openConnections).toBe(1)
		expect(statusesOf(instance)).not.toContain(InstanceStatus.ConnectionFailure)
	}, 10000)

	it('schedules a single reconnect when the connection drops mid role map load', async () => {
		device = await startFakeDevice()
		device.dropOnRoleMap = 1

		instance = await connect(device)
		await waitForOk(instance)

		// Outlast the longest backoff delay, so a duplicate reconnect would have happened by now
		await new Promise((resolve) => setTimeout(resolve, 400))

		expect(device.connections).toBe(2)
		expect(device.openConnections).toBe(1)
		expect(device.roleMapRequests).toBe(2)
	}, 10000)
})
