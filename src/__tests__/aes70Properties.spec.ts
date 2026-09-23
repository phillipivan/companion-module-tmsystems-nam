import { describe, it, expect } from 'vitest'
import {
	OcaDynamics,
	OcaFilterParametric,
	OcaGain,
	OcaInt64Actuator,
	OcaMute,
	OcaSignalGenerator,
	OcaStringActuator,
	OcaSwitch,
} from 'aes70/src/controller/ControlClasses.js'
import { methodPairFor, settablePropertiesOf, structFieldFor, type SettableProperty } from '../aes70Properties.js'

/**
 * Built against real aes70 classes. Input types come from aes70's encoders, an
 * implementation detail of the library, so these tests are what catch an aes70
 * upgrade that changes them.
 */

const inertDevice = {
	send_command: (): undefined => undefined,
	add_subscription: (): undefined => undefined,
	remove_subscription: (): undefined => undefined,
} as unknown as ConstructorParameters<typeof OcaGain>[1]

function kindsByName(props: SettableProperty[]): Record<string, SettableProperty['kind']> {
	return Object.fromEntries(props.map((prop) => [prop.name, prop.kind]))
}

describe('settablePropertiesOf', () => {
	it('types primitive properties from their aes70 encoders, inherited ones first', () => {
		expect(settablePropertiesOf(new OcaGain(1, inertDevice))).toEqual([
			{ name: 'Enabled', kind: 'boolean' },
			{ name: 'Label', kind: 'string' },
			{ name: 'Latency', kind: 'number' },
			{ name: 'Gain', kind: 'number' },
		])
	})

	it('types an enum property with every member of its enum', () => {
		expect(settablePropertiesOf(new OcaMute(1, inertDevice)).find((prop) => prop.name === 'State')).toEqual({
			name: 'State',
			kind: 'enum',
			enumValues: { Muted: 1, Unmuted: 2 },
		})

		const shape = settablePropertiesOf(new OcaFilterParametric(1, inertDevice)).find((prop) => prop.name === 'Shape')
		expect(shape?.kind).toBe('enum')
		expect(shape?.kind === 'enum' ? Object.keys(shape.enumValues) : []).toHaveLength(13)
	})

	it('types integer and string class properties', () => {
		expect(kindsByName(settablePropertiesOf(new OcaSwitch(1, inertDevice)))).toMatchObject({ Position: 'number' })
		expect(kindsByName(settablePropertiesOf(new OcaStringActuator(1, inertDevice)))).toMatchObject({
			Setting: 'string',
		})
	})

	it('leaves out properties no input can represent: structured types and 64-bit integers', () => {
		expect(kindsByName(settablePropertiesOf(new OcaGain(1, inertDevice)))).not.toHaveProperty('PortClockMap')
		expect(kindsByName(settablePropertiesOf(new OcaSwitch(1, inertDevice)))).not.toHaveProperty('PositionNames')
		expect(kindsByName(settablePropertiesOf(new OcaInt64Actuator(1, inertDevice)))).not.toHaveProperty('Setting')
	})

	it('leaves out properties aes70 has no setter for', () => {
		const filter = kindsByName(settablePropertiesOf(new OcaFilterParametric(1, inertDevice)))

		expect(filter).not.toHaveProperty('Role')
		expect(filter).toMatchObject({ Frequency: 'number', WidthParameter: 'number' })
	})

	// aes70 names this one's setter SetInbandGain, after the property's alias rather than the property.
	// Looking only for Set<property> made it look read-only, so the action offered no way to set it
	it("includes a property whose setter aes70 named after the property's alias", () => {
		const filter = kindsByName(settablePropertiesOf(new OcaFilterParametric(1, inertDevice)))

		expect(filter).toMatchObject({ InBandGain: 'number' })
	})
})

describe('methodPairFor', () => {
	const make = <T>(Cls: new (ono: number, dev: unknown) => T): T => new Cls(1, inertDevice)

	// AES70 calls Generating read-only; Start() and Stop() are how a device is told to run
	it('names the pair of methods a generator starts and stops with', () => {
		const generator = make(OcaSignalGenerator)

		expect(generator).not.toHaveProperty('SetGenerating')
		expect(methodPairFor(generator, 'Generating')).toEqual({ on: 'Start', off: 'Stop' })
		// So the action offers it a checkbox like any other boolean
		expect(kindsByName(settablePropertiesOf(generator))).toMatchObject({ Generating: 'boolean' })
	})

	it('claims nothing for a property with a real setter, or a class without the methods', () => {
		expect(methodPairFor(make(OcaSignalGenerator), 'Level')).toBeUndefined()
		expect(methodPairFor(make(OcaFilterParametric), 'Generating')).toBeUndefined()
	})
})

describe('structFieldFor', () => {
	const make = <T>(Cls: new (ono: number, dev: unknown) => T): T => new Cls(1, inertDevice)

	// A dynamics threshold is an OcaDBr: the level is what a button sets, the reference is the device's
	it('names the field of a struct property a button sets', () => {
		const dynamics = make(OcaDynamics)

		expect(structFieldFor(dynamics, 'Threshold')).toEqual({ field: 'Value', kind: 'number' })
		// So the action offers it a number input rather than leaving it out as an unsupported type
		expect(kindsByName(settablePropertiesOf(dynamics))).toMatchObject({ Threshold: 'number' })
	})

	it('claims nothing for a plain property or a struct it has no entry for', () => {
		expect(structFieldFor(make(OcaDynamics), 'Ratio')).toBeUndefined()
		expect(structFieldFor(make(OcaFilterParametric), 'Threshold')).toBeUndefined()
	})
})
