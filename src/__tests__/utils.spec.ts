import { describe, it, expect } from 'vitest'
import { Arguments } from 'aes70/src/controller/arguments.js'
import { OcaModelDescription } from 'aes70/src/types/OcaModelDescription.js'
import { OcaMuteState } from 'aes70/src/types/OcaMuteState.js'
import { OcaStatus } from 'aes70/src/types/OcaStatus.js'
import { RemoteError } from 'aes70/src/controller/remote_error.js'
import { OcaFilterParametric, OcaLevelSensor } from 'aes70/src/controller/ControlClasses.js'
import type { PropertyDescription } from '../OcaHelper.js'
import type { ModuleConfig } from '../config.js'
import {
	abortable,
	accessorName,
	defaultPropertyName,
	excitementEmoji,
	handleBonjourHost,
	isNotImplemented,
	makePropChoices,
	makeSafeJsonValue,
	ocaClassNameToLabel,
	unwrapValue,
	type MakeSafeJsonVisitor,
} from '../utils.js'

describe('handleBonjourHost', () => {
	const manual: ModuleConfig = { host: '10.0.0.5', port: 1234, protocol: 'udp', batchCommands: true }

	it('takes the host and port from the selected Bonjour device, and forces TCP', () => {
		const config = handleBonjourHost({ ...manual, bonjourHost: '192.168.1.10:65001' })

		expect(config).toMatchObject({ host: '192.168.1.10', port: 65001, protocol: 'tcp' })
	})

	it('falls back to the default AES70 port when the Bonjour address has none or an unusable one', () => {
		expect(handleBonjourHost({ ...manual, bonjourHost: '192.168.1.10' }).port).toBe(65000)
		expect(handleBonjourHost({ ...manual, bonjourHost: '192.168.1.10:abc' }).port).toBe(65000)
	})

	it('leaves a manually configured connection alone when no Bonjour device is selected', () => {
		expect(handleBonjourHost({ ...manual })).toEqual(manual)
		expect(handleBonjourHost({ ...manual, bonjourHost: '' })).toMatchObject({
			host: '10.0.0.5',
			port: 1234,
			protocol: 'udp',
		})
	})
})

describe('ocaClassNameToLabel', () => {
	it.each([
		['OcaLevelSensor', 'Level Sensor'],
		['OcaBlockFactory', 'Block Factory'],
		['OcaUint16Actuator', 'Uint16 Actuator'],
		['OcaFilterFIR', 'Filter FIR'],
		['IDReader', 'ID Reader'],
		['ClassID', 'Class ID'],
		['InBandGain', 'In Band Gain'],
		['PPM1', 'PPM1'],
	])('labels %s as "%s"', (name, label) => {
		expect(ocaClassNameToLabel(name)).toBe(label)
	})

	it('only strips a leading Oca', () => {
		expect(ocaClassNameToLabel('LocalOcaThing')).toBe('Local Oca Thing')
	})
})

describe('makeSafeJsonValue', () => {
	it('passes JSON primitives through, and turns null and undefined into null', async () => {
		expect(await makeSafeJsonValue({ s: 'text', n: -6.5, b: false, nothing: null, missing: undefined })).toEqual({
			s: 'text',
			n: -6.5,
			b: false,
			nothing: null,
			missing: null,
		})
		expect(await makeSafeJsonValue(undefined)).toBeNull()
	})

	it('turns a bigint, such as a 64-bit property value, into a string', async () => {
		expect(await makeSafeJsonValue(9007199254740993n)).toBe('9007199254740993')
	})

	it('drops functions and symbols from objects, and makes them null in arrays and at the root', async () => {
		const fn = (): void => undefined
		expect(await makeSafeJsonValue({ keep: 1, fn, sym: Symbol('s') })).toEqual({ keep: 1 })
		expect(await makeSafeJsonValue([fn, Symbol('s')])).toEqual([null, null])
		expect(await makeSafeJsonValue(fn)).toBeNull()
	})

	it('skips promises by default, and awaits them when asked', async () => {
		expect(await makeSafeJsonValue({ pending: Promise.resolve(1), keep: 2 })).toEqual({ keep: 2 })
		expect(await makeSafeJsonValue([Promise.resolve(1)])).toEqual([null])

		expect(await makeSafeJsonValue({ later: Promise.resolve({ gain: -6 }) }, { awaitPromises: true })).toEqual({
			later: { gain: -6 },
		})
		expect(await makeSafeJsonValue(Promise.reject(new Error('refused')), { awaitPromises: true })).toBeNull()
	})

	it('unboxes boxed primitives', async () => {
		expect(await makeSafeJsonValue([Object(2), Object('text'), Object(true)])).toEqual([2, 'text', true])
	})

	it('turns a Date into an ISO string, and an Error into its name, message and stack', async () => {
		expect(await makeSafeJsonValue(new Date('2026-09-17T10:00:00Z'))).toBe('2026-09-17T10:00:00.000Z')

		const error = new RangeError('out of range')
		expect(await makeSafeJsonValue(error)).toEqual({ name: 'RangeError', message: 'out of range', stack: error.stack })
	})

	it('turns byte buffers into arrays of byte values', async () => {
		expect(await makeSafeJsonValue(Buffer.from([1, 2, 255]))).toEqual([1, 2, 255])
		expect(await makeSafeJsonValue(new Uint8Array([3, 4]).buffer)).toEqual([3, 4])
		expect(await makeSafeJsonValue(new Uint8Array([5, 6]))).toEqual([5, 6])
	})

	it('turns a typed array into its element values, not its raw bytes', async () => {
		expect(await makeSafeJsonValue(new Float32Array([1.5, -6]))).toEqual([1.5, -6])
		expect(await makeSafeJsonValue(new Int16Array([-2, 300]))).toEqual([-2, 300])
		// Like any other bigint
		expect(await makeSafeJsonValue(new BigInt64Array([1099511627776n]))).toEqual(['1099511627776'])
	})

	it('turns a DataView, which has no element type, into its bytes', async () => {
		expect(await makeSafeJsonValue(new DataView(new Uint8Array([7, 8, 9]).buffer, 1))).toEqual([8, 9])
	})

	it('turns a Set into an array, and a Map into an object with string keys', async () => {
		expect(await makeSafeJsonValue(new Set(['a', 'b']))).toEqual(['a', 'b'])
		expect(
			await makeSafeJsonValue(
				new Map<unknown, unknown>([
					[1, 'one'],
					['two', 2],
				]),
			),
		).toEqual({ '1': 'one', two: 2 })
	})

	it('serialises aes70 values as the feedback reads them: getter results, structs and enums', async () => {
		expect(await makeSafeJsonValue(new Arguments([-6, -70, 20]))).toEqual({ values: [-6, -70, 20] })
		expect(await makeSafeJsonValue(new OcaModelDescription('T&M Media', 'NAM', '3'))).toEqual({
			Manufacturer: 'T&M Media',
			Name: 'NAM',
			Version: '3',
		})
		expect(await makeSafeJsonValue(OcaMuteState.Unmuted)).toEqual({ value: 2 })
	})

	it('skips a property whose getter throws', async () => {
		const value = { keep: 1 }
		Object.defineProperty(value, 'broken', {
			enumerable: true,
			get: () => {
				throw new Error('not readable')
			},
		})

		expect(await makeSafeJsonValue(value)).toEqual({ keep: 1 })
	})

	it('turns a reference back to an object already being serialised into null', async () => {
		const node: Record<string, unknown> = { name: 'root' }
		node.self = node

		expect(await makeSafeJsonValue(node)).toEqual({ name: 'root', self: null })
	})

	describe('visitor', () => {
		it('can replace a value, with the path to it', async () => {
			const paths: (string | number)[][] = []
			const result = await makeSafeJsonValue(
				{ gain: -6, nested: { gain: -3 } },
				{
					visitor: (path, value) => {
						paths.push([...path])
						return path.at(-1) === 'gain' ? { action: 'replace', value: `${String(value)} dB` } : { action: 'continue' }
					},
				},
			)

			expect(result).toEqual({ gain: '-6 dB', nested: { gain: '-3 dB' } })
			expect(paths).toContainEqual(['nested', 'gain'])
		})

		it('can omit a value: dropped from objects, null in arrays and at the root', async () => {
			const omitWhere =
				(test: (key: string | number | undefined) => boolean): MakeSafeJsonVisitor =>
				(path) =>
					test(path.at(-1)) ? { action: 'omit' } : { action: 'continue' }

			expect(
				await makeSafeJsonValue({ keep: 1, secret: 2 }, { visitor: omitWhere((key) => key === 'secret') }),
			).toEqual({
				keep: 1,
			})
			expect(await makeSafeJsonValue(['a', 'b', 'c'], { visitor: omitWhere((key) => key === 1) })).toEqual([
				'a',
				null,
				'c',
			])
			expect(await makeSafeJsonValue('anything', { visitor: omitWhere(() => true) })).toBeNull()
		})
	})
})

describe('unwrapValue', () => {
	it('unwraps an object holding only a value, as an aes70 enum serialises', () => {
		expect(unwrapValue({ value: 2 })).toBe(2)
	})

	it('unwraps an object holding only values, as aes70 getter results serialise', () => {
		expect(unwrapValue({ values: [-6, -70, 20] })).toEqual([-6, -70, 20])
	})

	it('leaves anything else unchanged', () => {
		expect(unwrapValue({ value: 1, min: 0 })).toEqual({ value: 1, min: 0 })
		expect(unwrapValue({ other: 1 })).toEqual({ other: 1 })
		expect(unwrapValue([{ value: 1 }])).toEqual([{ value: 1 }])
		expect(unwrapValue(null)).toBeNull()
		expect(unwrapValue('text')).toBe('text')
	})
})

describe('excitementEmoji', () => {
	it.each([
		[0, '😭'],
		[1, '😐'],
		[9, '😐'],
		[10, '🙂'],
		[45, '😃'],
		[89, '🤯'],
		[90, '🚀'],
		[500, '🚀'],
	])('picks the band for %i definitions', (count, emoji) => {
		expect(excitementEmoji(count)).toBe(emoji)
	})
})

describe('makePropChoices', () => {
	it('offers each property by name, labelled for display', () => {
		const props: PropertyDescription[] = [
			{ name: 'Frequency', type: 'number', read: true, write: true, level: 4 },
			{ name: 'InBandGain', type: 'number', read: true, write: false, level: 4 },
		]

		expect(makePropChoices(props)).toEqual([
			{ id: 'Frequency', label: 'Frequency' },
			{ id: 'InBandGain', label: 'In Band Gain' },
		])
	})
})

describe('abortable', () => {
	it('settles as the promise does when there is no signal, or it never aborts', async () => {
		await expect(abortable(Promise.resolve(1), undefined)).resolves.toBe(1)
		await expect(abortable(Promise.resolve(2), new AbortController().signal)).resolves.toBe(2)
		await expect(abortable(Promise.reject(new Error('failed')), new AbortController().signal)).rejects.toThrow('failed')
	})

	it('rejects with the reason as soon as the signal aborts, without waiting on the promise', async () => {
		const controller = new AbortController()
		const waiting = abortable(new Promise(() => undefined), controller.signal)

		controller.abort(new Error('gave up'))

		await expect(waiting).rejects.toThrow('gave up')
	})

	it('rejects straight away for a signal already aborted, and ignores the abandoned promise failing later', async () => {
		const controller = new AbortController()
		controller.abort(new Error('already aborted'))
		let failLater: ((err: Error) => void) | undefined
		const abandoned = new Promise<void>((_, reject) => (failLater = reject))

		await expect(abortable(abandoned, controller.signal)).rejects.toThrow('already aborted')

		// Must not surface as an unhandled rejection
		failLater?.(new Error('late failure'))
		await new Promise((resolve) => setTimeout(resolve, 10))
	})
})

function prop(name: string, level: number): PropertyDescription {
	return { name, level, type: 'number', read: true, write: true }
}

describe('defaultPropertyName', () => {
	it("picks the class's own property over inherited framework ones", () => {
		// The order an OcaFilterParametric on a real device reports them in: inherited first
		const props = [
			prop('ClassVersion', 1),
			prop('Lockable', 1),
			prop('Role', 1),
			prop('Enabled', 2),
			prop('Frequency', 4),
			prop('Shape', 4),
		]

		expect(defaultPropertyName(props)).toBe('Frequency')
	})

	it("falls back to the deepest level present when none of the class's own properties are", () => {
		expect(defaultPropertyName([prop('Role', 1), prop('Enabled', 2)])).toBe('Enabled')
	})

	it('has no default when there are no properties', () => {
		expect(defaultPropertyName([])).toBeUndefined()
	})
})

describe('isNotImplemented', () => {
	it('is true only for a device refusing a call as not implemented', () => {
		expect(isNotImplemented(new RemoteError(OcaStatus.NotImplemented, undefined))).toBe(true)
		expect(isNotImplemented(new RemoteError(OcaStatus.DeviceError, undefined))).toBe(false)
		expect(isNotImplemented(new Error('Call failed with OcaStatus NotImplemented'))).toBe(false)
		expect(isNotImplemented(undefined)).toBe(false)
	})
})

describe('accessorName', () => {
	const device = {
		send_command: (): undefined => undefined,
		add_subscription: (): undefined => undefined,
		remove_subscription: (): undefined => undefined,
	}
	const make = <T>(Cls: new (ono: number, dev: unknown) => T): T => new Cls(1, device)

	it('names the getter and setter after the property', () => {
		const filter = make(OcaFilterParametric)

		expect(accessorName(filter, 'Get', 'Frequency')).toBe('GetFrequency')
		expect(accessorName(filter, 'Set', 'Frequency')).toBe('SetFrequency')
	})

	// aes70 spells these two after the property's alias, differing only in case, so guessing
	// Set<property> makes a settable property look read-only
	it("falls back to a property's alias where aes70 named the accessor after that instead", () => {
		const filter = make(OcaFilterParametric)

		expect(filter).not.toHaveProperty('SetInBandGain')
		expect(accessorName(filter, 'Get', 'InBandGain')).toBe('GetInbandGain')
		expect(accessorName(filter, 'Set', 'InBandGain')).toBe('SetInbandGain')
	})

	it('has no setter for a property that is only ever read', () => {
		const sensor = make(OcaLevelSensor)

		expect(accessorName(sensor, 'Get', 'Reading')).toBe('GetReading')
		expect(accessorName(sensor, 'Set', 'Reading')).toBeUndefined()
	})

	it('has nothing for an unknown property, or an object with no accessors at all', () => {
		expect(accessorName(make(OcaFilterParametric), 'Get', 'NotAProperty')).toBeUndefined()
		expect(accessorName({}, 'Set', 'Frequency')).toBeUndefined()
	})
})
