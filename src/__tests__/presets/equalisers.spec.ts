import { describe, it, expect, beforeEach } from 'vitest'
import { makeNamFilterParametric } from '../fakeControlObjects.js'
import { labelOf, makeHarness, type PresetEntry, type PresetHarness, type RoleMap } from './helpers.js'

describe('equaliser presets', () => {
	let ctx: PresetHarness

	beforeEach(() => {
		ctx = makeHarness()
	})

	const define = async (roleMap: RoleMap): ReturnType<PresetHarness['define']> => ctx.define(roleMap)

	it('gives a filter object its own group, named after it, with a button per settable property', async () => {
		const { structure, presets } = await define([
			['MIC/BQ0', makeNamFilterParametric(1)],
			['MIC/BQ1', makeNamFilterParametric(2)],
		])

		// A group per object rather than per class, since one filter object is one band
		expect(structure.find((section) => section.id === 'equalisers')?.definitions).toEqual([
			{
				id: 'eq_OcaFilterParametric_MIC/BQ0',
				type: 'simple',
				name: 'MIC/BQ0',
				// ShapeParameter is absent: the NAM's filters don't report it, so no button is built for it
				presets: [
					'eq_OcaFilterParametric_MIC/BQ0_Enabled',
					'eq_OcaFilterParametric_MIC/BQ0_Frequency',
					'eq_OcaFilterParametric_MIC/BQ0_Shape',
					'eq_OcaFilterParametric_MIC/BQ0_WidthParameter',
					'eq_OcaFilterParametric_MIC/BQ0_InBandGain',
				],
			},
			expect.objectContaining({ id: 'eq_OcaFilterParametric_MIC/BQ1', name: 'MIC/BQ1' }),
		])
		// Each button names its object and its property, since the group name is lost once it is on a page
		const enabled = presets['eq_OcaFilterParametric_MIC/BQ0_Enabled']
		if (enabled?.type !== 'layered') throw new Error('No layered Enabled preset')
		expect(labelOf(enabled)).toMatchObject({ text: { isExpression: true, value: '`MIC/BQ0\\nEnabled`' } })
		// Green while the filter is in circuit, and a press turns it off first when the state isn't known
		expect(enabled.feedbacks).toEqual([
			{
				feedbackId: 'internal:checkExpression',
				options: { expression: '$(local:value) == true' },
				styleOverrides: [
					{ elementId: 'background', elementProperty: 'color', override: { isExpression: false, value: 0x009900 } },
				],
			},
		])
		expect((enabled.steps[0]?.down?.[0] as PresetEntry | undefined)?.options.value_Enabled).toEqual({
			isExpression: true,
			value: '$(local:value) == false ? true : false',
		})
	})

	it('steps a filter shape through its enum, showing the name and how far along it is', async () => {
		const { presets } = await define([['MIC/BQ0', makeNamFilterParametric(1)]])
		const preset = presets['eq_OcaFilterParametric_MIC/BQ0_Shape']
		if (preset?.type !== 'layered') throw new Error('No layered Shape preset')

		// The name, from the second variable, rather than the raw number the steps work on
		expect(labelOf(preset)).toMatchObject({
			text: { isExpression: true, value: '`MIC/BQ0\\nShape\\n${$(local:label)}`' },
		})
		expect(preset.localVariables).toEqual([
			{
				variableType: 'feedback',
				variableName: 'value',
				feedbackId: 'get_property_OcaFilterParametric',
				options: { objectId: 'MIC/BQ0', property: 'Shape', sync: true, enum_Shape: false },
			},
			{
				variableType: 'feedback',
				variableName: 'label',
				feedbackId: 'get_property_OcaFilterParametric',
				options: { objectId: 'MIC/BQ0', property: 'Shape', sync: true, enum_Shape: true },
			},
		])
		// OcaParametricEQShape runs 0 to 12, and the getter returns no limits, so the ends come from the enum
		const turns = [preset.steps[0]?.rotate_left?.[0], preset.steps[0]?.rotate_right?.[0]] as PresetEntry[]
		expect(turns.map((action) => action.options.value_Shape)).toEqual([
			{ isExpression: true, value: 'max(0, $(local:value) - 1)' },
			{ isExpression: true, value: 'min(12, $(local:value) + 1)' },
		])
		// A plain grey arc, only there to show where in the list the value sits
		const dial = preset.elements.find((element) => element.id === 'dial')
		if (dial?.type !== 'composite') throw new Error('No dial on the Shape preset')
		expect(dial.elementId).toBe('dial')
		expect(dial.options).toMatchObject({
			level: { isExpression: true, value: '$(local:value)' },
			min: { isExpression: true, value: '0' },
			max: { isExpression: true, value: '12' },
			color: 0xb6b6b6,
		})
	})

	it('draws a filter’s cut-and-boost from zero and its width out from the middle', async () => {
		const { presets } = await define([['MIC/BQ0', makeNamFilterParametric(1)]])

		const dialOf = (property: string): { elementId: string; options: Record<string, unknown> } => {
			const preset = presets[`eq_OcaFilterParametric_MIC/BQ0_${property}`]
			if (preset?.type !== 'layered') throw new Error(`No layered ${property} preset`)
			const dial = preset.elements.find((element) => element.id === 'dial')
			if (dial?.type !== 'composite') throw new Error(`No dial on ${property}`)
			return dial
		}
		// Gain cuts and boosts either side of zero; width only ever opens out from the middle
		expect(dialOf('InBandGain').elementId).toBe('centred_dial')
		expect(dialOf('WidthParameter').elementId).toBe('width_dial')
		// Frequency is a plain level, filling from the bottom of the device's range
		expect(dialOf('Frequency').elementId).toBe('dial')
		// All three take the value and its limits from the one unsynced read
		expect(dialOf('InBandGain').options).toMatchObject({
			level: { isExpression: true, value: '$(local:value).values[0]' },
			min: { isExpression: true, value: '$(local:value).values[1]' },
			max: { isExpression: true, value: '$(local:value).values[2]' },
		})
	})

	it('labels a filter’s numbers with their unit and steps them within the device’s limits', async () => {
		const { presets } = await define([['MIC/BQ0', makeNamFilterParametric(1)]])
		const preset = presets['eq_OcaFilterParametric_MIC/BQ0_Frequency']
		if (preset?.type !== 'layered') throw new Error('No layered Frequency preset')

		expect(labelOf(preset)).toMatchObject({
			text: {
				isExpression: true,
				value:
					"`MIC/BQ0\\nFrequency\\n${isNumber($(local:value).values[0]) ? `${round($(local:value).values[0] * 1000) / 1000} Hz` : ''}`",
			},
		})
		// A step of 10 Hz, a whole 1 Hz in fine mode while the dial is held
		expect(preset.localVariables?.[0]).toEqual({ variableType: 'simple', variableName: 'step_size', startupValue: 10 })
		const turns = [preset.steps[0]?.rotate_left?.[0], preset.steps[0]?.rotate_right?.[0]] as PresetEntry[]
		expect(turns.map((action) => action.options.value_Frequency)).toEqual([
			{
				isExpression: true,
				value:
					'max($(local:value).values[1], $(local:value).values[0] - ($(this:active) ? $(local:step_size) / 10 : $(local:step_size)))',
			},
			{
				isExpression: true,
				value:
					'min($(local:value).values[2], $(local:value).values[0] + ($(this:active) ? $(local:step_size) / 10 : $(local:step_size)))',
			},
		])
	})
})
