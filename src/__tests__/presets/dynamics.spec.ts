import { describe, it, expect, beforeEach } from 'vitest'
import { OcaDynamics, type OcaRoot } from 'aes70/src/controller/ControlClasses.js'
import { OcaDynamicsFunction } from 'aes70/src/types/OcaDynamicsFunction.js'
import { OcaLevelDetectionLaw } from 'aes70/src/types/OcaLevelDetectionLaw.js'
import { DYNAMICS_CLASSES } from '../../presets/dynamics.js'
import { steppedValue } from '../../presets/consts.js'
import { labelOf, makeHarness, makeObject, type PresetEntry, type PresetHarness, type RoleMap } from './helpers.js'

/** A compressor reporting the properties a processor typically implements. */
const dynamics = (ono: number): OcaRoot =>
	makeObject(OcaDynamics, ono, [
		['Enabled', true],
		['Function', OcaDynamicsFunction.Compress],
		['DetectorLaw', OcaLevelDetectionLaw.RMS],
		['Ratio', 4],
		['AttackTime', 0.005],
		['ReleaseTime', 0.25],
		['DynamicGainFloor', -20],
	])

describe('dynamics presets', () => {
	let ctx: PresetHarness

	beforeEach(() => {
		ctx = makeHarness()
	})

	const define = async (roleMap: RoleMap): ReturnType<PresetHarness['define']> => ctx.define(roleMap)

	it('gives a dynamics object its own group, with a button per property it implements', async () => {
		const { structure } = await define([['COMP/1', dynamics(1)]])

		// Only what this object reported, in the table's order; ThresholdPresentationUnits and the rest
		// are absent because it returned no value for them
		expect(structure.find((section) => section.id === 'dynamics')?.definitions).toEqual([
			{
				id: 'dyn_OcaDynamics_COMP/1',
				type: 'simple',
				name: 'COMP/1',
				presets: [
					'dyn_OcaDynamics_COMP/1_Enabled',
					'dyn_OcaDynamics_COMP/1_Function',
					'dyn_OcaDynamics_COMP/1_DetectorLaw',
					'dyn_OcaDynamics_COMP/1_Ratio',
					'dyn_OcaDynamics_COMP/1_AttackTime',
					'dyn_OcaDynamics_COMP/1_ReleaseTime',
					'dyn_OcaDynamics_COMP/1_DynamicGainFloor',
				],
			},
		])
	})

	it('steps a dynamics function through its enum, showing the name', async () => {
		const { presets } = await define([['COMP/1', dynamics(1)]])
		const preset = presets['dyn_OcaDynamics_COMP/1_Function']
		if (preset?.type !== 'layered') throw new Error('No layered Function preset')

		expect(labelOf(preset)).toMatchObject({
			text: { isExpression: true, value: '`COMP/1\\nFunction\\n${$(local:label)}`' },
		})
		// OcaDynamicsFunction runs None(0) to Gate(4), and an enum always steps one at a time
		const turns = [preset.steps[0]?.rotate_left?.[0], preset.steps[0]?.rotate_right?.[0]] as PresetEntry[]
		expect(turns.map((action) => action.options.value_Function)).toEqual([
			{ isExpression: true, value: 'max(0, $(local:value) - 1)' },
			{ isExpression: true, value: 'min(4, $(local:value) + 1)' },
		])
	})

	it('draws the dynamic gain against zero, in dB to a tenth', async () => {
		const { presets } = await define([['COMP/1', dynamics(1)]])
		const preset = presets['dyn_OcaDynamics_COMP/1_DynamicGainFloor']
		if (preset?.type !== 'layered') throw new Error('No layered DynamicGainFloor preset')

		const dial = preset.elements.find((element) => element.id === 'dial')
		if (dial?.type !== 'composite') throw new Error('No dial on DynamicGainFloor')
		// A gain, so it reads against 0 dB like the others: red cut, yellow unity, green boost
		expect(dial.elementId).toBe('centred_dial')
		expect(dial.options).toMatchObject({ color: 0x009900, colorZero: 0xcccc00, colorBelow: 0x990000 })
		expect(labelOf(preset)).toMatchObject({
			text: {
				isExpression: true,
				value:
					"`COMP/1\\nDynamic Gain Floor\\n${isNumber($(local:value).values[0]) ? `${round($(local:value).values[0] * 10) / 10} dB` : ''}`",
			},
		})
	})

	// A fixed step is a leap at 0.5 ms and imperceptible at 500 ms, so these multiply instead
	it('steps the time constants, ratio and slope by proportion rather than a fixed amount', async () => {
		const { presets } = await define([['COMP/1', dynamics(1)]])

		for (const property of ['AttackTime', 'ReleaseTime', 'Ratio']) {
			const preset = presets[`dyn_OcaDynamics_COMP/1_${property}`]
			if (preset?.type !== 'layered') throw new Error(`No layered ${property} preset`)
			// A third of a doubling per detent, a twenty-fourth while held, both tunable per button
			expect(preset.localVariables?.slice(0, 2), property).toEqual([
				{ variableType: 'simple', variableName: 'step_divisions', startupValue: 3 },
				{ variableType: 'simple', variableName: 'step_divisions_fine', startupValue: 24 },
			])
			const right = (preset.steps[0]?.rotate_right?.[0] as PresetEntry | undefined)?.options[`value_${property}`]
			expect(right, property).toMatchObject({ value: expect.stringContaining('pow(2, 1 /') })
		}
	})

	// Colours borrowed from the dials that read the same way: a scale for the times, a proportion
	// for the ratio and slope
	it('colours the time constants like a frequency and the ratio like a pan', async () => {
		const { presets } = await define([['COMP/1', dynamics(1)]])
		const colourOf = (property: string): unknown => {
			const preset = presets[`dyn_OcaDynamics_COMP/1_${property}`]
			if (preset?.type !== 'layered') throw new Error(`No layered ${property} preset`)
			const dial = preset.elements.find((element) => element.id === 'dial')
			if (dial?.type !== 'composite') throw new Error(`No dial on ${property}`)
			return dial.options.color
		}

		expect(colourOf('AttackTime')).toBe(0x66b2ff)
		expect(colourOf('ReleaseTime')).toBe(0x66b2ff)
		expect(colourOf('Ratio')).toBe(0xcccc00)
	})

	// A dynamics time constant lives in milliseconds, so seconds only take over at a whole one
	it('reads the time constants in milliseconds below a second, and seconds above', async () => {
		const { presets } = await define([['COMP/1', dynamics(1)]])
		const preset = presets['dyn_OcaDynamics_COMP/1_AttackTime']
		if (preset?.type !== 'layered') throw new Error('No layered AttackTime preset')
		const text = (labelOf(preset) as { text: { value: string } }).text.value

		// Below a second it divides by a thousandth, which is the same as multiplying by a thousand
		expect(text).toContain('$(local:value).values[0] < 1 ?')
		expect(text).toContain('/ 0.001 * 100) / 100} ms`')
		expect(text).toContain('} s`')
		// Only the label is scaled; the device is still set in seconds, so no divisor reaches the action
		const right = (preset.steps[0]?.rotate_right?.[0] as PresetEntry | undefined)?.options.value_AttackTime
		expect(right).toMatchObject({ value: expect.not.stringContaining('/ 0.001') })
	})

	// Zero times anything is still zero, so a dial sitting there could never leave it
	it('escapes zero, and turns a negative value the way the dial was turned', () => {
		// Any ratio-stepped property will do; the times are the ones that reach near zero in practice
		const attack = DYNAMICS_CLASSES[0]?.properties.find((property) => property.property === 'AttackTime')
		if (attack?.kind !== 'dial') throw new Error('No AttackTime dial')
		const evaluate = (direction: 'up' | 'down', value: number): number => {
			const expression = steppedValue(attack, String(value), direction)
			// The same arithmetic Companion does, with the dial left on its coarse step
			const factor = Math.pow(2, 1 / 3)
			const [grow, shrink] = direction === 'up' ? [factor, 1 / factor] : [1 / factor, factor]
			if (expression.includes('pow(2, 1 /')) {
				if (value >= 0.001) return value * grow
				if (value <= -0.001) return value * shrink
			}
			return direction === 'up' ? 0.001 : -0.001
		}

		// From zero it starts again at the floor rather than staying stuck
		expect(evaluate('up', 0)).toBe(0.001)
		expect(evaluate('down', 0)).toBe(-0.001)
		// Below zero a right turn moves towards zero, which is still the larger number
		expect(evaluate('up', -0.5)).toBeGreaterThan(-0.5)
		expect(evaluate('down', -0.5)).toBeLessThan(-0.5)
		// And above zero the usual way round
		expect(evaluate('up', 0.5)).toBeGreaterThan(0.5)
		expect(evaluate('down', 0.5)).toBeLessThan(0.5)
	})

	// Ratio is already a ratio, so it only gains the ":1" — the two read alike where a device has both
	it('shows the deprecated ratio the same way as the slope', async () => {
		const { presets } = await define([['COMP/1', dynamics(1)]])
		const preset = presets['dyn_OcaDynamics_COMP/1_Ratio']
		if (preset?.type !== 'layered') throw new Error('No layered Ratio preset')
		const text = (labelOf(preset) as { text: { value: string } }).text.value

		expect(text).toContain('}:1`')
		// To a tenth, like the slope
		expect(text).toContain('* 10) / 10}:1`')
		// No slope conversion: this property is the ratio itself
		expect(text).not.toContain('1 - ')
	})

	// A compressor is read in ratios, not the fraction AES70 stores, and 0.5 is exactly 2:1
	it('shows a slope as the compression ratio it stands for', async () => {
		const { presets } = await define([['COMP/1', makeObject(OcaDynamics, 1, [['Slope', 0.5]])]])
		const preset = presets['dyn_OcaDynamics_COMP/1_Slope']
		if (preset?.type !== 'layered') throw new Error('No layered Slope preset')

		expect(labelOf(preset)).toMatchObject({
			text: {
				isExpression: true,
				value:
					"`COMP/1\\nSlope\\n${isNumber($(local:value).values[0]) ? ($(local:value).values[0] >= 1 ? 'Limit' : `${round(1 / (1 - $(local:value).values[0]) * 10) / 10}:1`) : ''}`",
			},
		})
		// A bounded fraction, so it steps a flat part of its range rather than by proportion, and the
		// device is still set in slope: only the label is converted
		expect(preset.localVariables?.[0]).toEqual({
			variableType: 'simple',
			variableName: 'step_size',
			startupValue: 0.05,
		})
		const right = (preset.steps[0]?.rotate_right?.[0] as PresetEntry | undefined)?.options.value_Slope
		expect(right).toMatchObject({ value: expect.not.stringContaining('1 - ') })
	})

	// Threshold is an OcaDBr struct, a value and its reference, which the action has no input for
	it('offers no button for a property the Set Property action cannot set', async () => {
		const { presets } = await define([
			[
				'COMP/1',
				makeObject(OcaDynamics, 1, [
					['Enabled', true],
					['Threshold', { Value: -20, Ref: 0 }],
					['Ratio', 4],
				]),
			],
		])

		expect(Object.keys(presets)).toEqual(['dyn_OcaDynamics_COMP/1_Enabled', 'dyn_OcaDynamics_COMP/1_Ratio'])
	})

	// Pinned because the set was chosen deliberately; Threshold is absent for the reason above
	it('covers the settable properties of a dynamics processor', () => {
		expect(DYNAMICS_CLASSES[0]?.properties.map((property) => property.property)).toEqual([
			'Enabled',
			'Function',
			'DetectorLaw',
			'ThresholdPresentationUnits',
			'Ratio',
			'AttackTime',
			'ReleaseTime',
			'HoldTime',
			'DynamicGainCeiling',
			'DynamicGainFloor',
			'KneeParameter',
			'Slope',
		])
	})
})
