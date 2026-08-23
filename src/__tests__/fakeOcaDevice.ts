import { decodeMessage } from 'aes70/src/OCP1/decode_message.js'
import { encodeMessage } from 'aes70/src/OCP1/encode_message.js'
import { Response } from 'aes70/src/OCP1/response.js'
import { KeepAlive } from 'aes70/src/OCP1/keepalive.js'
import { EncodedArguments, type OcpEncoder } from 'aes70/src/OCP1/encoded_arguments.js'
import { OcaString } from 'aes70/src/OCP1/OcaString.js'
import { OcaProduct } from 'aes70/src/OCP1/OcaProduct.js'
import { OcaObjectIdentification } from 'aes70/src/OCP1/OcaObjectIdentification.js'
import { OcaList } from 'aes70/src/OCP1/OcaList.js'

/**
 * Minimal fake AES70/OCP.1 device used to give the UDP and WebSocket
 * transport paths a local, hardware-free round trip to test against — the
 * `aes70` package ships a client only, no device/server side. This router
 * reuses the library's own PDU encode/decode primitives (see
 * types/aes70-ocp1.d.ts) rather than hand-rolling the wire format, and
 * implements only the handful of Command targets that
 * `RemoteDevice.DeviceManager.GetProduct()` and `RemoteDevice.get_role_map()`
 * actually send, per remote_device.js.
 */

const ROOT_BLOCK_ONO = 100
const DEVICE_MANAGER_ONO = 1

const MESSAGE_TYPE_COMMAND = 0
const MESSAGE_TYPE_COMMAND_RRQ = 1
const MESSAGE_TYPE_KEEPALIVE = 4

interface DecodedPdu {
	readonly messageType: number
	readonly handle: number
	readonly target: number
	readonly method_level: number
	readonly method_index: number
}

export interface FakeCommandResponse {
	readonly encoders: OcpEncoder[]
	readonly values: unknown[]
}

export type FakeCommandHandler = () => FakeCommandResponse

/** Converts a dotted OCA class ID (e.g. '1.1.1.5') to its OCP.1 binary form. */
export function classId(dotted: string): string {
	return dotted
		.split('.')
		.map((n) => String.fromCharCode(parseInt(n, 10)))
		.join('')
}

export class FakeOcaDeviceRouter {
	private readonly handlers = new Map<string, FakeCommandHandler>()

	registerMethod(ono: number, level: number, index: number, handler: FakeCommandHandler): void {
		this.handlers.set(`${ono}:${level}:${index}`, handler)
	}

	/** Decodes one raw incoming message buffer, returning zero or more raw reply buffers. */
	handle(buf: ArrayBuffer): ArrayBuffer[] {
		const view = new DataView(buf)
		const pdus: unknown[] = []
		decodeMessage(view, 0, pdus)

		const replies: ArrayBuffer[] = []
		for (const raw of pdus) {
			const pdu = raw as DecodedPdu

			if (pdu.messageType === MESSAGE_TYPE_KEEPALIVE) {
				replies.push(encodeMessage(new KeepAlive(1000)))
				continue
			}
			if (pdu.messageType !== MESSAGE_TYPE_COMMAND && pdu.messageType !== MESSAGE_TYPE_COMMAND_RRQ) continue

			const key = `${pdu.target}:${pdu.method_level}:${pdu.method_index}`
			const handler = this.handlers.get(key)
			if (!handler) {
				throw new Error(`FakeOcaDeviceRouter: no handler registered for target:level:index "${key}"`)
			}

			const { encoders, values } = handler()
			const params = encoders.length > 0 ? new EncodedArguments(encoders, values) : null
			const response = new Response(pdu.handle, 0, encoders.length, params)
			replies.push(encodeMessage(response))
		}
		return replies
	}
}

export interface FakeRoleMapMember {
	readonly ono: number
	readonly classIdDotted: string
	readonly classVersion: number
	readonly role: string
}

/**
 * Registers the minimal command set for a root block containing the given
 * leaf members, matching the walk `RemoteDevice.get_device_tree()` performs:
 * one `GetActionObjects` on the (hardcoded, ONo 100) root block, then one
 * `GetRole` per returned member. See remote_device.js / tree_to_rolemap.js.
 */
export function registerMinimalRoleMap(router: FakeOcaDeviceRouter, members: FakeRoleMapMember[]): void {
	router.registerMethod(ROOT_BLOCK_ONO, 3, 5 /* OcaBlock.GetActionObjects */, () => ({
		encoders: [OcaList(OcaObjectIdentification)],
		values: [
			members.map((m) => ({
				ONo: m.ono,
				ClassIdentification: { ClassID: classId(m.classIdDotted), ClassVersion: m.classVersion },
			})),
		],
	}))

	for (const member of members) {
		router.registerMethod(member.ono, 1, 5 /* OcaRoot.GetRole */, () => ({
			encoders: [OcaString],
			values: [member.role],
		}))
	}
}

export interface FakeProduct {
	readonly Name: string
	readonly ModelID: string
	readonly RevisionLevel: string
	readonly BrandName: string
	readonly UUID: string
	readonly Description: string
}

/** Registers DeviceManager.GetProduct() (ONo 1, level 3, index 22). */
export function registerGetProduct(router: FakeOcaDeviceRouter, product: FakeProduct): void {
	router.registerMethod(DEVICE_MANAGER_ONO, 3, 22 /* OcaDeviceManager.GetProduct */, () => ({
		encoders: [OcaProduct],
		values: [product],
	}))
}
