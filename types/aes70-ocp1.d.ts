/**
 * Minimal ambient type declarations for the low-level OCP.1 wire-protocol
 * primitives in `aes70/src/OCP1/*`. These modules ship no `.d.ts` of their
 * own — this file exists purely so the fake-device test harness
 * (src/__tests__/fakeOcaDevice.ts) can import and use them with type safety.
 */

declare module 'aes70/src/OCP1/encoded_arguments.js' {
	export interface OcpEncoder {
		encodedLength(value: unknown): number
		encodeTo(dataView: DataView, pos: number, value: unknown): number
	}

	export class EncodedArguments {
		constructor(encoders: OcpEncoder[], data: unknown[])
		readonly byteLength: number
		readonly buffer: ArrayBuffer | null
		encodeTo(dataView: DataView, pos: number): number
	}
}

declare module 'aes70/src/OCP1/decode_message.js' {
	/** Decodes into `ret`, returning the new position, or -1 if incomplete. */
	export function decodeMessage(data: DataView, pos: number, ret: unknown[]): number
}

declare module 'aes70/src/OCP1/encode_message.js' {
	export interface EncodablePdu {
		readonly messageType: number
		encoded_length(): number
		encode_to(dst: DataView, pos: number): number
	}

	export function encodeMessage(pdus: EncodablePdu | EncodablePdu[]): ArrayBuffer
}

declare module 'aes70/src/OCP1/response.js' {
	import type { EncodedArguments } from 'aes70/src/OCP1/encoded_arguments.js'

	export class Response {
		constructor(
			handle: number,
			status_code: number,
			param_count: number,
			parameters: EncodedArguments | ArrayBuffer | null,
		)
		readonly messageType: number
		encoded_length(): number
		encode_to(dst: DataView, pos: number): number
	}
}

declare module 'aes70/src/OCP1/keepalive.js' {
	export class KeepAlive {
		/** @param time - Milliseconds. */
		constructor(time: number)
		readonly messageType: number
		readonly time: number
		encoded_length(): number
		encode_to(dst: DataView, pos: number): number
	}
}

declare module 'aes70/src/OCP1/OcaString.js' {
	import type { OcpEncoder } from 'aes70/src/OCP1/encoded_arguments.js'
	export const OcaString: OcpEncoder
}

declare module 'aes70/src/OCP1/OcaProduct.js' {
	import type { OcpEncoder } from 'aes70/src/OCP1/encoded_arguments.js'
	export const OcaProduct: OcpEncoder
}

declare module 'aes70/src/OCP1/OcaObjectIdentification.js' {
	import type { OcpEncoder } from 'aes70/src/OCP1/encoded_arguments.js'
	export const OcaObjectIdentification: OcpEncoder
}

declare module 'aes70/src/OCP1/OcaList.js' {
	import type { OcpEncoder } from 'aes70/src/OCP1/encoded_arguments.js'
	export const OcaList: (type: OcpEncoder) => OcpEncoder
}
