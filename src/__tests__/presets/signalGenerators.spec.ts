import { describe, it, expect, beforeEach } from 'vitest'
import { OcaSignalGenerator, type OcaRoot } from 'aes70/src/controller/ControlClasses.js'
import { OcaWaveformType } from 'aes70/src/types/OcaWaveformType.js'
import { OcaSweepType } from 'aes70/src/types/OcaSweepType.js'
import { SIGNAL_GENERATOR_CLASSES } from '../../presets/signalGenerators.js'
import { labelOf, makeHarness, makeObject, type PresetEntry, type PresetHarness, type RoleMap } from './helpers.js'

/** A generator reporting everything its class can set. */
const generator = (ono: number): OcaRoot =>
	makeObject(OcaSignalGenerator, ono, [
		['Enabled', true],
		['Waveform', OcaWaveformType.Sine],
		['Level', -20],
		['Frequency1', 1000],
		['Frequency2', 20000],
		['SweepType', OcaSweepType.Logarithmic],
		['SweepTime', 0.5],
		['SweepRepeat', false],
		// Read-only in AES70, but Start() and Stop() set it
		['Generating', true],
	])

describe('signal generator presets', () => {
	let ctx: PresetHarness

	beforeEach(() => {
		ctx = makeHarness()
	})

	const define = async (roleMap: RoleMap): ReturnType<PresetHarness['define']> => ctx.define(roleMap)

	it('gives a generator its own group, with a button per property it can set', async () => {
		const { structure } = await define([['GEN/1', generator(1)]])

		expect(structure.find((section) => section.id === 'signalGenerators')?.definitions).toEqual([
			{
				id: 'gen_OcaSignalGenerator_GEN/1',
				type: 'simple',
				name: 'GEN/1',
				presets: [
					'gen_OcaSignalGenerator_GEN/1_Enabled',
					'gen_OcaSignalGenerator_GEN/1_Generating',
					'gen_OcaSignalGenerator_GEN/1_Waveform',
					'gen_OcaSignalGenerator_GEN/1_Level',
					'gen_OcaSignalGenerator_GEN/1_Frequency1',
					'gen_OcaSignalGenerator_GEN/1_Frequency2',
					'gen_OcaSignalGenerator_GEN/1_SweepType',
					'gen_OcaSignalGenerator_GEN/1_SweepTime',
					'gen_OcaSignalGenerator_GEN/1_SweepRepeat',
				],
			},
		])
	})

	// The same treatment the equaliser's Frequency gets, so the two read alike
	it('draws both frequencies as spectrum dials, stepped and scaled by the octave', async () => {
		const { presets } = await define([['GEN/1', generator(1)]])

		for (const property of ['Frequency1', 'Frequency2']) {
			const preset = presets[`gen_OcaSignalGenerator_GEN/1_${property}`]
			if (preset?.type !== 'layered') throw new Error(`No layered ${property} preset`)
			const dial = preset.elements.find((element) => element.id === 'dial')
			if (dial?.type !== 'composite') throw new Error(`No dial on ${property}`)

			expect(dial.elementId, property).toBe('dial')
			expect(dial.options.scheme, property).toBe('spectrum')
			// Logged, so every octave takes the same length of arc
			expect(dial.options.level, property).toEqual({
				isExpression: true,
				value: 'log(max(0.001, $(local:value).values[0]))',
			})
			expect(preset.localVariables?.slice(0, 2), property).toEqual([
				{ variableType: 'simple', variableName: 'step_divisions', startupValue: 3 },
				{ variableType: 'simple', variableName: 'step_divisions_fine', startupValue: 24 },
			])
			// A tenth of a hertz below a hundred, whole hertz up to a thousand, kilohertz above it
			const text = (labelOf(preset) as { text: { value: string } }).text.value
			expect(text, property).toContain(
				'$(local:value).values[0] < 100 ? `${round($(local:value).values[0] * 10) / 10} Hz`',
			)
			expect(text, property).toContain('`${round($(local:value).values[0])} Hz`')
			expect(text, property).toContain('} kHz`')
		}
	})

	it('reads the level against zero in dB, like the other gains', async () => {
		const { presets } = await define([['GEN/1', generator(1)]])
		const preset = presets['gen_OcaSignalGenerator_GEN/1_Level']
		if (preset?.type !== 'layered') throw new Error('No layered Level preset')
		const dial = preset.elements.find((element) => element.id === 'dial')
		if (dial?.type !== 'composite') throw new Error('No dial on Level')

		expect(dial.elementId).toBe('centred_dial')
		expect(dial.options).toMatchObject({ color: 0x009900, colorZero: 0xcccc00, colorBelow: 0x990000 })
		// A tenth of a dB, as the other gains are
		expect((labelOf(preset) as { text: { value: string } }).text.value).toContain('* 10) / 10} dB`')
	})

	it('times a sweep to three digits in seconds or milliseconds, stepped by ratio', async () => {
		const { presets } = await define([['GEN/1', generator(1)]])
		const preset = presets['gen_OcaSignalGenerator_GEN/1_SweepTime']
		if (preset?.type !== 'layered') throw new Error('No layered SweepTime preset')
		const dial = preset.elements.find((element) => element.id === 'dial')
		if (dial?.type !== 'composite') throw new Error('No dial on SweepTime')

		// The same blue as a dynamics time constant
		expect(dial.options.color).toBe(0x66b2ff)
		// Three digits, as the delays and dynamics times read
		const v = '$(local:value).values[0]'
		const label = (labelOf(preset) as { text: { value: string } }).text.value
		expect(label).toContain(`${v} >= 10 ? \`\${round(${v} * 10) / 10} s\``)
		expect(label).toContain(`${v} < 0.1 ? \`\${round(${v} / 0.001 * 10) / 10} ms\``)
		const right = (preset.steps[0]?.rotate_right?.[0] as PresetEntry | undefined)?.options.value_SweepTime
		expect(right).toMatchObject({ value: expect.stringContaining('pow(2, 1 /') })
	})

	it('steps the waveform and sweep type through their enums, showing the name', async () => {
		const { presets } = await define([['GEN/1', generator(1)]])

		// OcaWaveformType runs None(0) to PolarityTest(7), OcaSweepType Linear(0) to None(2)
		for (const [property, last] of [
			['Waveform', 7],
			['SweepType', 2],
		] as const) {
			const preset = presets[`gen_OcaSignalGenerator_GEN/1_${property}`]
			if (preset?.type !== 'layered') throw new Error(`No layered ${property} preset`)
			expect(labelOf(preset), property).toMatchObject({
				text: {
					isExpression: true,
					value: `\`${property === 'Waveform' ? 'Waveform' : 'Sweep Type'}\\n\${$(local:label)}\``,
				},
			})
			expect(preset.localVariables?.[0], property).toEqual({
				variableType: 'simple',
				variableName: 'max_value',
				startupValue: last,
			})
			const turns = [preset.steps[0]?.rotate_left?.[0], preset.steps[0]?.rotate_right?.[0]] as PresetEntry[]
			expect(
				turns.map((action) => action.options[`value_${property}`]),
				property,
			).toEqual([
				{ isExpression: true, value: 'max(0, $(local:value) - 1)' },
				{ isExpression: true, value: 'min($(local:max_value), $(local:value) + 1)' },
			])
		}
	})

	it('flips both of its booleans, turning green when on', async () => {
		const { presets } = await define([['GEN/1', generator(1)]])

		for (const property of ['Enabled', 'SweepRepeat', 'Generating']) {
			const preset = presets[`gen_OcaSignalGenerator_GEN/1_${property}`]
			if (preset?.type !== 'layered') throw new Error(`No layered ${property} preset`)
			expect(preset.feedbacks, property).toEqual([
				{
					feedbackId: 'internal:checkExpression',
					options: { expression: '$(local:value) == true' },
					styleOverrides: [
						{ elementId: 'background', elementProperty: 'color', override: { isExpression: false, value: 0x009900 } },
					],
				},
			])
		}
	})

	// Pinned because the set was chosen deliberately
	it('covers the settable properties of a signal generator', () => {
		expect(SIGNAL_GENERATOR_CLASSES[0]?.properties.map((property) => property.property)).toEqual([
			'Enabled',
			'Generating',
			'Waveform',
			'Level',
			'Frequency1',
			'Frequency2',
			'SweepType',
			'SweepTime',
			'SweepRepeat',
		])
	})
})
