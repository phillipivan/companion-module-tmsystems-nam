import { describe, it, expect, vi, afterEach, type Mock } from 'vitest'
import v8 from 'node:v8'
import vm from 'node:vm'
import { WebSocketServer, type WebSocket } from 'ws'
import type * as CompanionBase from '@companion-module/base'
import { InstanceStatus } from '@companion-module/base'
import type * as Reconnect from '../reconnect.js'
import ModuleInstance from '../main.js'
import type { ModuleConfig } from '../config.js'
import { FakeOcaDeviceRouter, OcaStatus, registerGetProduct, registerMinimalRoleMap } from './fakeOcaDevice.js'

/**
 * Drives ModuleInstance's connection lifecycle end to end, against a fake
 * device over a real local WebSocket. InstanceBase is swapped for a stub,
 * since there is no Companion host to talk to, and the connection timings are
 * shrunk so retries and timeouts land within the test timeout.
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
		setPresetDefinitions = vi.fn()
		setVariableDefinitions = vi.fn()
		setVariableValues = vi.fn()
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
		CONNECT_TIMEOUT_MS: 2000,
		// aes70 closes the connection after three silent intervals, 1.5s here
		KEEPALIVE_INTERVAL_S: 0.5,
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
	/** Hold the WebSocket handshake of upcoming connections for these delays, in arrival order. */
	readonly handshakeDelaysMs: number[]
	/** While true, answer nothing, keepalives included, but keep connections open. */
	silent: boolean
	/** Hold each reply to a message received while this is set, for this long. */
	replyDelayMs: number
	close(): Promise<void>
}

async function startFakeDevice(): Promise<FakeDevice> {
	// Answer anything the fake doesn't model as a real device would: NotImplemented
	const router = new FakeOcaDeviceRouter({ unhandledStatus: OcaStatus.NotImplemented })
	const sockets = new Set<WebSocket>()
	const handshakeDelaysMs: number[] = []
	let dropPending = false

	const server = new WebSocketServer({
		host: '127.0.0.1',
		port: 0,
		verifyClient: (_info: unknown, done: (result: boolean) => void) => {
			setTimeout(() => done(true), handshakeDelaysMs.shift() ?? 0)
		},
	})
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
		handshakeDelaysMs,
		silent: false,
		replyDelayMs: 0,
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
			if (device.silent) return
			const buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
			const replies = router.handle(buf)
			if (dropPending) {
				dropPending = false
				ws.terminate()
				return
			}
			const send = (): void => {
				if (ws.readyState !== ws.OPEN) return
				for (const reply of replies) ws.send(Buffer.from(reply))
			}
			if (device.replyDelayMs > 0) setTimeout(send, device.replyDelayMs)
			else send()
		})
	})

	return device
}

function configFor(device: FakeDevice): ModuleConfig {
	return { host: '127.0.0.1', port: device.port, protocol: 'ws', batchCommands: true }
}

async function sleep(ms: number): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, ms))
}

/** The stubbed updateStatus, reached through the stub rather than as an unbound method of ModuleInstance. */
function updateStatusOf(instance: ModuleInstance): Mock<ModuleInstance['updateStatus']> {
	return (instance as unknown as { updateStatus: Mock<ModuleInstance['updateStatus']> }).updateStatus
}

/** The stubbed log, reached the same way. */
function logOf(instance: ModuleInstance): Mock<ModuleInstance['log']> {
	return (instance as unknown as { log: Mock<ModuleInstance['log']> }).log
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

describe('ModuleInstance connection lifecycle (fake local device)', () => {
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
		await inst.init(configFor(fake))
		return inst
	}

	it('defines variables only for the device information the device returns', async () => {
		// The fake device answers GetProduct, and refuses every other device manager getter
		device = await startFakeDevice()
		const inst = await connect(device)
		instance = inst
		await waitForOk(inst)
		const stub = inst as unknown as { setVariableDefinitions: Mock; setVariableValues: Mock }

		expect(Object.keys(stub.setVariableDefinitions.mock.lastCall?.[0] as object)).toEqual([
			'product_name',
			'product_model_id',
			'product_revision_level',
			'product_brand_name',
			'product_uuid',
			'product_description',
		])
		expect(stub.setVariableValues).toHaveBeenLastCalledWith(
			expect.objectContaining({ product_name: 'Fake Device', product_model_id: 'FAKE-1' }),
		)
	}, 10000)

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
		await sleep(400)

		expect(device.connections).toBe(2)
		expect(device.openConnections).toBe(1)
		expect(device.roleMapRequests).toBe(2)
	}, 10000)

	it('closes a connection that finishes opening after a newer connect() superseded it', async () => {
		device = await startFakeDevice()
		// Hold the first handshake, so the attempt started second opens first
		device.handshakeDelaysMs.push(300)

		const inst = await connect(device)
		instance = inst
		await inst.configUpdated(configFor(device))
		await waitForOk(inst)
		// The held handshake has completed by now; give the superseded attempt's close time to land
		await sleep(400)

		expect(device.connections).toBe(2)
		expect(device.openConnections).toBe(1)
		expect(device.roleMapRequests).toBe(1)
	}, 10000)

	it('closes a superseded connection even if garbage collection runs before it finishes opening', async () => {
		// Node 26's AbortSignal.any() holds its sources weakly and only checks them when read, so a
		// composite over controllers that were aborted, replaced and collected reads as not aborted.
		// Seen against a real device: an attempt pending through a cable pull adopted its connection.
		v8.setFlagsFromString('--expose-gc')
		const gc = vm.runInNewContext('gc') as () => void

		device = await startFakeDevice()
		device.handshakeDelaysMs.push(600)

		const inst = await connect(device)
		instance = inst
		await inst.configUpdated(configFor(device))
		// The superseding controllers are now unreferenced; collect them while the first handshake is held
		await sleep(200)
		gc()
		gc()
		await waitForOk(inst)
		await sleep(700)

		expect(device.connections).toBe(2)
		expect(device.openConnections).toBe(1)
		expect(device.roleMapRequests).toBe(1)
	}, 10000)

	it('abandons a connection that does not open within the connect timeout, and closes it if it opens later', async () => {
		device = await startFakeDevice()
		// Longer than the 2s connect timeout set above
		device.handshakeDelaysMs.push(3000)

		const inst = await connect(device)
		instance = inst
		await waitForOk(inst)
		// The abandoned handshake completes after the retry has connected
		await vi.waitFor(() => expect(device?.connections).toBe(2), { timeout: 5000, interval: 20 })
		await sleep(300)

		expect(updateStatusOf(inst)).toHaveBeenCalledWith(
			InstanceStatus.ConnectionFailure,
			'Connection failed: Timed out after 2s',
		)
		expect(device.openConnections).toBe(1)
		expect(device.roleMapRequests).toBe(1)
	}, 10000)

	it('logs the close and its reason when the device stops responding, then recovers', async () => {
		device = await startFakeDevice()
		const inst = await connect(device)
		instance = inst
		await waitForOk(inst)

		const connectionClosed = vi.spyOn(inst.ocaHelper, 'connectionClosed')

		device.silent = true
		await vi.waitFor(() => expect(statusesOf(inst)).toContain(InstanceStatus.Disconnected), {
			timeout: 8000,
			interval: 20,
		})
		device.silent = false

		// So property syncs cut short by the close stop being waited on
		expect(connectionClosed).toHaveBeenCalled()

		const messages = logOf(inst).mock.calls.map(([, message]) => message)
		expect(messages).toContain('Connection closed')
		expect(messages).toContain('Connection error: Connection has timed out.')
		expect(messages).not.toContain('Connection closed: undefined')
		await waitForOk(inst)
	}, 15000)

	it('rebuilds action and feedback definitions once for a burst of property discoveries', async () => {
		device = await startFakeDevice()
		const inst = await connect(device)
		instance = inst
		await waitForOk(inst)
		const stub = inst as unknown as { setActionDefinitions: Mock; setFeedbackDefinitions: Mock }
		// Let the definitions set on connect land before counting
		await sleep(700)
		const actionDefinitionsSet = stub.setActionDefinitions.mock.calls.length
		const feedbackDefinitionsSet = stub.setFeedbackDefinitions.mock.calls.length

		// Saved buttons registering after connect report discoveries in a burst
		inst.ocaHelper.emit('properties:discovered', 'OcaGain')
		inst.ocaHelper.emit('properties:discovered', 'OcaMute')
		inst.ocaHelper.emit('properties:discovered', 'OcaGain')
		await sleep(900)

		expect(stub.setActionDefinitions).toHaveBeenCalledTimes(actionDefinitionsSet + 1)
		expect(stub.setFeedbackDefinitions).toHaveBeenCalledTimes(feedbackDefinitionsSet + 1)
	}, 10000)

	it('logs a failed definitions build rather than leaving the rejection unhandled', async () => {
		device = await startFakeDevice()
		const inst = await connect(device)
		instance = inst
		await waitForOk(inst)
		await sleep(700)
		const unhandled = vi.fn()
		process.on('unhandledRejection', unhandled)
		try {
			// Building definitions reads properties from the device, which can fail
			vi.spyOn(inst as unknown as { updateActions: () => Promise<void> }, 'updateActions').mockRejectedValue(
				new Error('device refused a property read'),
			)

			inst.ocaHelper.emit('properties:discovered', 'OcaGain')
			await sleep(900)

			expect(logOf(inst)).toHaveBeenCalledWith(
				'error',
				'Failed to build action and feedback definitions: device refused a property read',
			)
			expect(unhandled).not.toHaveBeenCalled()
		} finally {
			process.off('unhandledRejection', unhandled)
		}
	}, 10000)

	it('closes a connection that finishes opening after destroy()', async () => {
		device = await startFakeDevice()
		device.handshakeDelaysMs.push(300)

		const inst = await connect(device)
		instance = inst
		await inst.destroy()
		// Well past the held handshake, when a surviving attempt would already have walked the role map
		await sleep(1000)

		expect(device.connections).toBe(1)
		expect(device.openConnections).toBe(0)
		expect(device.roleMapRequests).toBe(0)
	}, 10000)

	it('stands down an attempt superseded after adopting its connection, leaving the newer one alone', async () => {
		device = await startFakeDevice()
		// Hold the device's replies, so the first attempt is still setting up the connection it adopted
		device.replyDelayMs = 300
		const inst = await connect(device)
		instance = inst
		// The first attempt has adopted its connection and is waiting on the device
		await vi.waitFor(
			() =>
				expect(updateStatusOf(inst)).toHaveBeenCalledWith(
					InstanceStatus.Connecting,
					'Connection open, setting up remote device...',
				),
			{ timeout: 5000, interval: 5 },
		)

		await inst.configUpdated(configFor(device))
		// The newer attempt's messages arrive after this, so only the first attempt's replies were held
		device.replyDelayMs = 0
		await waitForOk(inst)
		// Outlast the longest backoff delay, so a reconnect caused by the stale attempt would have happened
		await sleep(400)

		expect(device.connections).toBe(2)
		expect(device.openConnections).toBe(1)
		expect(device.roleMapRequests).toBe(1)
	}, 10000)
})
