import { describe, it, expect, beforeEach } from 'vitest'
import { OcaFilterParametric, type OcaRoot } from 'aes70/src/controller/ControlClasses.js'
import { UpdatePresets } from '../../presets.js'
import { makeNamFilterParametric } from '../fakeControlObjects.js'
import { labelOf, makeHarness, makeObject, type PresetEntry, type PresetHarness, type RoleMap } from './helpers.js'

/**
 * A band that returns nothing for Enabled or Shape, as a Sonance DSP's
 * Slot2/DSP/Zones/1/Equalizer/Band2 did on 2026-09-21 while its siblings implemented both.
 */
const partialFilter = (ono: number): OcaRoot =>
	makeObject(OcaFilterParametric, ono, [
		['Frequency', 1000],
		['WidthParameter', 1],
		['InBandGain', 0],
	])

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
		// A third of an octave per detent, a twenty-fourth while the dial is held, both tunable per button
		expect(preset.localVariables?.slice(0, 2)).toEqual([
			{ variableType: 'simple', variableName: 'octave_divisions', startupValue: 3 },
			{ variableType: 'simple', variableName: 'octave_divisions_fine', startupValue: 24 },
		])
		// Multiplied, not added, so a detent is the same interval at 30 Hz as at 16 kHz
		const turns = [preset.steps[0]?.rotate_left?.[0], preset.steps[0]?.rotate_right?.[0]] as PresetEntry[]
		expect(turns.map((action) => action.options.value_Frequency)).toEqual([
			{
				isExpression: true,
				value:
					'max($(local:value).values[1], $(local:value).values[0] * pow(2, -1 / ($(this:active) ? $(local:octave_divisions_fine) : $(local:octave_divisions))))',
			},
			{
				isExpression: true,
				value:
					'min($(local:value).values[2], $(local:value).values[0] * pow(2, 1 / ($(this:active) ? $(local:octave_divisions_fine) : $(local:octave_divisions))))',
			},
		])
	})

	// The device refuses a property its object doesn't implement, so a button for one is dead on arrival.
	// Objects of a class differ in what they implement, and the class's set is the union across them
	it('builds each band from its own properties, not from what its class implements between them', async () => {
		const { structure } = await define([
			['MIC/BQ0', makeNamFilterParametric(1)],
			['MIC/BQ1', partialFilter(2)],
		])
		const groups = structure.find((section) => section.id === 'equalisers')?.definitions
		const presetsOf = (name: string): string[] => {
			const group = groups?.find((candidate) => candidate.name === name)
			if (!group || group.type !== 'simple') throw new Error(`No group for ${name}`)
			return group.presets.map((id) => id.split('_').at(-1) ?? '')
		}

		expect(presetsOf('MIC/BQ0')).toEqual(['Enabled', 'Frequency', 'Shape', 'WidthParameter', 'InBandGain'])
		// No Enabled or Shape button, though its sibling has both
		expect(presetsOf('MIC/BQ1')).toEqual(['Frequency', 'WidthParameter', 'InBandGain'])
	})

	// The device serves Shape's value but refuses to set it, so nothing before the first press can tell.
	// Once it has refused, a rebuild drops the button rather than leaving one that always errors
	it('drops a button for a property the object has refused to set', async () => {
		const roleMap: RoleMap = [['MIC/BQ0', makeNamFilterParametric(1)]]
		const before = await define(roleMap)
		expect(Object.keys(before.presets)).toContain('eq_OcaFilterParametric_MIC/BQ0_Shape')

		ctx.helper.markWriteRefused('MIC/BQ0', 'Shape')
		await UpdatePresets(ctx.self)
		const [, presets] = ctx.setPresetDefinitions.mock.lastCall ?? []

		expect(Object.keys(presets ?? {})).not.toContain('eq_OcaFilterParametric_MIC/BQ0_Shape')
		// The rest of the band still works
		expect(Object.keys(presets ?? {})).toContain('eq_OcaFilterParametric_MIC/BQ0_Frequency')
	})

	// Linearly, the top octave of a 20 Hz - 20 kHz range would take half the arc and the bottom
	// octave under a tenth of a degree. Logged, every octave takes the same length of it
	it('draws the frequency arc logarithmically, in light blue', async () => {
		const { presets } = await define([['MIC/BQ0', makeNamFilterParametric(1)]])
		const preset = presets['eq_OcaFilterParametric_MIC/BQ0_Frequency']
		if (preset?.type !== 'layered') throw new Error('No layered Frequency preset')
		const dial = preset.elements.find((element) => element.id === 'dial')
		if (dial?.type !== 'composite') throw new Error('No dial on the Frequency preset')

		// The floor keeps the log finite if a device reports zero as its minimum
		expect(dial.options).toMatchObject({
			level: { isExpression: true, value: 'log(max(0.001, $(local:value).values[0]))' },
			min: { isExpression: true, value: 'log(max(0.001, $(local:value).values[1]))' },
			max: { isExpression: true, value: 'log(max(0.001, $(local:value).values[2]))' },
			color: 0x66b2ff,
		})
		// Only the arc is scaled; the text still reads in hertz
		expect(labelOf(preset)).toMatchObject({ text: { value: expect.stringContaining('} Hz`') } })
	})

	// A linear property keeps its plain value, so the scaling only follows octave stepping
	it('leaves a non-frequency arc unscaled', async () => {
		const { presets } = await define([['MIC/BQ0', makeNamFilterParametric(1)]])
		const preset = presets['eq_OcaFilterParametric_MIC/BQ0_InBandGain']
		if (preset?.type !== 'layered') throw new Error('No layered InBandGain preset')
		const dial = preset.elements.find((element) => element.id === 'dial')
		if (dial?.type !== 'composite') throw new Error('No dial on the InBandGain preset')

		expect(dial.options).toMatchObject({ level: { isExpression: true, value: '$(local:value).values[0]' } })
	})
})
