import { describe, it, expect, afterEach } from 'vitest'
import { WebSocketServer, WebSocket } from 'ws'
import { WebSocketConnection, RemoteDevice, type WebSocketConstructor } from 'aes70'
import { FakeOcaDeviceRouter, registerGetProduct, registerMinimalRoleMap } from './fakeOcaDevice.js'

/**
 * Exercises the WebSocket transport path exactly as src/main.ts uses it
 * (WebSocketConnection.connect -> new RemoteDevice -> set_keepalive_interval
 * -> GetProduct() -> get_role_map()), against a local fake device speaking
 * just enough real OCP.1 to satisfy that sequence. There is no real
 * WebSocket AES70 device available to test against, so this is the
 * base-level coverage for that path: it can't catch every real-device
 * quirk, but it proves our WebSocket connection setup and the library's
 * WebSocket transport actually interoperate end-to-end, byte for byte.
 */
describe('WebSocket connection (fake local device)', () => {
	let server: WebSocketServer | undefined
	let connection: WebSocketConnection | undefined

	afterEach(async () => {
		connection?.close()
		await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()))
		server = undefined
		connection = undefined
	})

	it('connects, fetches GetProduct(), and walks a minimal role map over WebSocket', async () => {
		const router = new FakeOcaDeviceRouter()
		registerGetProduct(router, {
			Name: 'Fake Device',
			ModelID: 'FAKE-1',
			RevisionLevel: '1.0',
			BrandName: 'Test Brand',
			UUID: 'urn:uuid:fake-ws-device',
			Description: 'Fake WebSocket device for local tests',
		})
		registerMinimalRoleMap(router, [{ ono: 4000, classIdDotted: '1.1.1.5', classVersion: 3, role: 'Gain1' }])

		server = new WebSocketServer({ host: '127.0.0.1', port: 0 })
		server.on('connection', (ws) => {
			ws.on('message', (data: Buffer) => {
				const buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
				const replies = router.handle(buf)
				for (const reply of replies) ws.send(Buffer.from(reply))
			})
		})
		await new Promise<void>((resolve) => server?.once('listening', resolve))
		const address = server.address()
		if (typeof address === 'string' || address === null) throw new Error('Expected an AddressInfo.')
		const port = address.port

		connection = await WebSocketConnection.connect(
			{ url: `ws://127.0.0.1:${port}` },
			WebSocket as unknown as WebSocketConstructor,
		)

		const client = new RemoteDevice(connection)
		client.set_keepalive_interval(2)

		const product = await client.DeviceManager.GetProduct()
		expect(product.Name).toBe('Fake Device')
		expect(product.ModelID).toBe('FAKE-1')

		const roleMap = await client.get_role_map()
		expect(Array.from(roleMap.keys())).toEqual(['Gain1'])
	}, 10000)
})
