import { describe, it, expect } from 'vitest'
import {
	OcaFilterParametric,
	OcaGain,
	OcaInt64Actuator,
	OcaMute,
	OcaStringActuator,
	OcaSwitch,
} from 'aes70/src/controller/ControlClasses.js'
import { settablePropertiesOf, type SettableProperty } from '../aes70Properties.js'

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
		expect(filter).not.toHaveProperty('InBandGain')
		expect(filter).toMatchObject({ Frequency: 'number', WidthParameter: 'number' })
	})
})
