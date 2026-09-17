import { describe, it, expect, vi, afterEach } from 'vitest'
import { WebSocketServer, WebSocket } from 'ws'
import { WebSocketConnection, RemoteDevice, type WebSocketConstructor } from 'aes70'
import { OcaGain } from 'aes70/src/controller/ControlClasses.js'
import { FakeOcaDeviceRouter, OcaStatus } from './fakeOcaDevice.js'

/**
 * main.ts used to fire a throwaway subscribe and wait 500ms after connecting, to work
 * around a race in older aes70. aes70 probes AddSubscription2 support on the first
 * subscribe of a session. Subscribes made while that probe was in flight used to wait on
 * it with no fallback of their own, so on a device without AddSubscription2 they were
 * silently dropped. aes70 2.0.20 makes them wait for the probe's result and fall back to
 * AddSubscription.
 *
 * The workaround is gone, so this pins aes70's behaviour: an aes70 change that brings the
 * race back fails here, rather than silently losing feedback updates on such devices.
 */

const SUBSCRIPTION_MANAGER_ONO = 4
/** OcaSubscriptionManager method ids, as level and index. */
const ADD_SUBSCRIPTION = [3, 1] as const
const ADD_SUBSCRIPTION_2 = [3, 8] as const

describe('aes70 subscriptions on a device without AddSubscription2', () => {
	let server: WebSocketServer | undefined
	let connection: WebSocketConnection | undefined

	afterEach(async () => {
		connection?.close()
		await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()))
		server = undefined
		connection = undefined
	})

	it('falls back to AddSubscription for every subscribe made while support is still being probed', async () => {
		const router = new FakeOcaDeviceRouter({ unhandledStatus: OcaStatus.NotImplemented })
		let addSubscription2Requests = 0
		let addSubscriptionRequests = 0
		router.registerMethod(SUBSCRIPTION_MANAGER_ONO, ...ADD_SUBSCRIPTION_2, () => {
			addSubscription2Requests++
			return { status: OcaStatus.NotImplemented, encoders: [], values: [] }
		})
		router.registerMethod(SUBSCRIPTION_MANAGER_ONO, ...ADD_SUBSCRIPTION, () => {
			addSubscriptionRequests++
			return { encoders: [], values: [] }
		})

		server = new WebSocketServer({ host: '127.0.0.1', port: 0 })
		server.on('connection', (ws) => {
			ws.on('message', (data: Buffer) => {
				const buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
				for (const reply of router.handle(buf)) ws.send(Buffer.from(reply))
			})
		})
		await new Promise<void>((resolve) => server?.once('listening', resolve))
		const address = server.address()
		if (typeof address === 'string' || address === null) throw new Error('Expected an AddressInfo.')
		connection = await WebSocketConnection.connect(
			{ url: `ws://127.0.0.1:${address.port}` },
			WebSocket as unknown as WebSocketConstructor,
		)
		const device = new RemoteDevice(connection)

		// A burst of subscribes in one tick, as loading a role map and registering buttons produces
		const failures: unknown[] = []
		for (const ono of [5000, 5001, 5002]) {
			new OcaGain(ono, device).OnPropertyChanged.subscribe(
				() => undefined,
				(err: unknown) => failures.push(err),
			)
		}

		await vi.waitFor(() => expect(addSubscriptionRequests).toBe(3), { timeout: 2000, interval: 10 })
		expect(addSubscription2Requests).toBe(1)
		expect(failures).toEqual([])
	})
})
