import { describe, it, expect, afterEach } from 'vitest'
import * as dgram from 'node:dgram'
import { UDPConnection, RemoteDevice } from 'aes70'
import { FakeOcaDeviceRouter, registerGetProduct, registerMinimalRoleMap } from './fakeOcaDevice.js'

/**
 * Exercises the UDP transport path exactly as src/main.ts uses it
 * (UDPConnection.connect -> new RemoteDevice -> set_keepalive_interval ->
 * GetProduct() -> get_role_map()), against a local fake device speaking
 * just enough real OCP.1 to satisfy that sequence. There is no real UDP
 * AES70 device available to test against, so this is the base-level
 * coverage for that path: it can't catch every real-device quirk, but it
 * proves our UDP connection setup and the library's UDP transport actually
 * interoperate end-to-end, byte for byte.
 */
describe('UDP connection (fake local device)', () => {
	let socket: dgram.Socket | undefined
	let connection: UDPConnection | undefined

	afterEach(() => {
		connection?.close()
		socket?.close()
		connection = undefined
		socket = undefined
	})

	it('connects, fetches GetProduct(), and walks a minimal role map over UDP', async () => {
		const router = new FakeOcaDeviceRouter()
		registerGetProduct(router, {
			Name: 'Fake Device',
			ModelID: 'FAKE-1',
			RevisionLevel: '1.0',
			BrandName: 'Test Brand',
			UUID: 'urn:uuid:fake-udp-device',
			Description: 'Fake UDP device for local tests',
		})
		registerMinimalRoleMap(router, [{ ono: 4000, classIdDotted: '1.1.1.5', classVersion: 3, role: 'Gain1' }])

		socket = dgram.createSocket('udp4')
		socket.on('message', (msg, rinfo) => {
			const buf = msg.buffer.slice(msg.byteOffset, msg.byteOffset + msg.byteLength)
			const replies = router.handle(buf)
			for (const reply of replies) {
				socket?.send(Buffer.from(reply), rinfo.port, rinfo.address)
			}
		})
		await new Promise<void>((resolve) => socket?.bind(0, '127.0.0.1', resolve))
		const port = socket.address().port

		connection = await Promise.race([
			UDPConnection.connect({ host: '127.0.0.1', port }),
			new Promise<never>((_, reject) => setTimeout(() => reject(new Error('UDP connect timed out')), 3000)),
		])

		const client = new RemoteDevice(connection)
		client.set_keepalive_interval(2)

		const product = await client.DeviceManager.GetProduct()
		expect(product.Name).toBe('Fake Device')
		expect(product.ModelID).toBe('FAKE-1')

		const roleMap = await client.get_role_map()
		expect(Array.from(roleMap.keys())).toEqual(['Gain1'])
	}, 10000)
})
