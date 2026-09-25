import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as ControlClasses from 'aes70/src/controller/ControlClasses.js'
import { type OcaRoot } from 'aes70/src/controller/ControlClasses.js'
import { Arguments } from 'aes70/src/controller/arguments.js'
import { OcaInt8 } from 'aes70/src/OCP1/OcaInt8.js'
import { OcaInt16 } from 'aes70/src/OCP1/OcaInt16.js'
import { OcaInt32 } from 'aes70/src/OCP1/OcaInt32.js'
import { OcaUint8 } from 'aes70/src/OCP1/OcaUint8.js'
import { OcaUint16 } from 'aes70/src/OCP1/OcaUint16.js'
import { OcaUint32 } from 'aes70/src/OCP1/OcaUint32.js'
import { ROTARY_CLASSES } from '../../presets/rotaries.js'
import {
	expectOptionsOffered,
	gain,
	labelOf,
	makeHarness,
	makeObject,
	namedSwitch,
	switchObject,
	type ControlClass,
	type DefinitionShape,
	type PresetEntry,
	type PresetHarness,
	type RoleMap,
} from './helpers.js'

describe('rotary presets', () => {
	let ctx: PresetHarness

	beforeEach(() => {
		ctx = makeHarness()
	})

	const define = async (roleMap: RoleMap): ReturnType<PresetHarness['define']> => ctx.define(roleMap)

	it('steps a gain down and up by step_size within its limits, on a dial labelled with its object', async () => {
		const { presets } = await define([['MIC/GAIN', gain(1)]])

		const setGain = (value: string): unknown => ({
			actionId: 'set_property_OcaGain',
			options: { objectId: 'MIC/GAIN', property: 'Gain', value_Gain: { isExpression: true, value } },
		})
		expect(presets['rotary_OcaGain_MIC/GAIN']).toEqual({
			type: 'layered',
			name: 'Gain - MIC/GAIN',
			elements: [
				{ type: 'box', id: 'background', name: 'Background', color: 0x000000 },
				// Between the background and the label, so the arc is drawn behind the text.
				// Centred, so the arc grows either side of 0 dB rather than up from the device's floor
				{
					type: 'composite',
					id: 'dial',
					name: 'Centred Dial',
					elementId: 'centred_dial',
					options: {
						level: { isExpression: true, value: '$(local:range).values[0]' },
						min: { isExpression: true, value: '$(local:range).values[1]' },
						max: { isExpression: true, value: '$(local:range).values[2]' },
						color: 0x009900,
						// Red below unity, so a cut reads differently from a boost
						colorBelow: 0x990000,
						// Yellow at unity, which the arc blends out from: red down to a cut, green up to a boost
						colorZero: 0xcccc00,
					},
				},
				{
					type: 'text',
					id: 'label',
					name: 'Label',
					// The two characters \n, which Companion's renderer turns into a line break; the value once
					// known, with the class's unit after it
					text: {
						isExpression: true,
						value:
							"`MIC/GAIN\\n (Rotary)\\n${isNumber($(local:range).values[0]) ? `${round($(local:range).values[0] * 10) / 10} dB` : ''}`",
					},
					fontsize: 22,
					color: 0xffffff,
				},
			],
			steps: [
				{
					down: [],
					up: [],
					// range holds [value, min, max]; until it is known the result is NaN, which Companion won't send.
					// A tenth of step_size while the dial is held.
					rotate_left: [
						setGain(
							'max($(local:range).values[1], $(local:range).values[0] - ($(this:active) ? $(local:step_size) / 10 : $(local:step_size)))',
						),
					],
					rotate_right: [
						setGain(
							'min($(local:range).values[2], $(local:range).values[0] + ($(this:active) ? $(local:step_size) / 10 : $(local:step_size)))',
						),
					],
				},
			],
			feedbacks: [],
			localVariables: [
				{ variableType: 'simple', variableName: 'step_size', startupValue: 1 },
				{
					variableType: 'feedback',
					variableName: 'range',
					feedbackId: 'get_property_OcaGain',
					options: { objectId: 'MIC/GAIN', property: 'Gain', sync: false },
				},
			],
		})
	})

	it('gives every rotary a dial behind its label, drawn with the element its table entry names', async () => {
		const roleMap = ROTARY_CLASSES.map(({ className, property }, i): [string, OcaRoot] => [
			`${className}/1`,
			makeObject(ControlClasses[className] as unknown as ControlClass, i + 1, [
				['Enabled', true],
				[property, 0],
			]),
		])
		const { presets } = await define(roleMap)

		for (const rotary of ROTARY_CLASSES) {
			const id = `rotary_${rotary.className}_${rotary.className}/1`
			const preset = presets[id]
			if (preset?.type !== 'layered') throw new Error(`No layered ${rotary.className} preset`)
			// Drawn in order, so the arc goes down before the text that sits over it
			expect(
				preset.elements.map((element) => element.id),
				id,
			).toEqual(['background', 'dial', 'label'])

			const dial = preset.elements.find((element) => element.id === 'dial')
			if (dial?.type !== 'composite') throw new Error(`No dial on ${id}`)
			expect(dial.elementId, id).toBe(
				rotary.dial === 'centred' ? 'centred_dial' : rotary.dial === 'width' ? 'width_dial' : 'dial',
			)
			// A class that names no colour is drawn in the plain grey
			expect(dial.options.color, id).toBe(rotary.dialColor ?? 0xb6b6b6)
		}
		// Only those whose property has a conventional colour choose one
		expect(ROTARY_CLASSES.filter((rotary) => rotary.dialColor !== undefined).map((rotary) => rotary.className)).toEqual(
			['OcaGain', 'OcaPanBalance', 'OcaDelay', 'OcaDelayExtended', 'OcaFrequencyActuator'],
		)
	})

	it('puts a unit after the value only on the rotary classes whose table entry names one', async () => {
		const roleMap = ROTARY_CLASSES.map(({ className, property }, i): [string, OcaRoot] => [
			`${className}/1`,
			makeObject(ControlClasses[className] as unknown as ControlClass, i + 1, [
				['Enabled', true],
				[property, 0],
			]),
		])
		const { presets } = await define(roleMap)

		for (const rotary of ROTARY_CLASSES) {
			const preset = presets[`rotary_${rotary.className}_${rotary.className}/1`]
			if (preset?.type !== 'layered') throw new Error(`No layered ${rotary.className} preset`)
			const text = (labelOf(preset) as { text: { value: string } }).text.value
			// Inside the isNumber guard, so an unread value shows nothing rather than a bare unit
			if (rotary.unit === undefined) expect(text, rotary.className).not.toContain('} ')
			else expect(text, rotary.className).toContain(`} ${rotary.unit}\``)
			// A class with a larger unit shows that one instead once the value reaches it
			for (const step of rotary.unitSteps ?? [])
				expect(text, rotary.className).toContain(`} ${step.unit ?? rotary.unit}\``)
		}
		expect(ROTARY_CLASSES.filter((rotary) => rotary.unit !== undefined).map((rotary) => rotary.className)).toEqual([
			'OcaGain',
			'OcaFrequencyActuator',
		])
	})

	// A fraction of a hertz is noise from float32 or a ratio step, except below a hundred, where a fine detent is less than one
	it('labels a frequency to a tenth of a hertz below 100 Hz, in whole hertz to 1 kHz, and to two places in kHz above', async () => {
		const { presets } = await define([
			[
				'OcaFrequencyActuator/1',
				makeObject(ControlClasses.OcaFrequencyActuator, 1, [
					['Enabled', true],
					['Frequency', 1000],
				]),
			],
		])
		const preset = presets['rotary_OcaFrequencyActuator_OcaFrequencyActuator/1']
		if (preset?.type !== 'layered') throw new Error('No layered frequency preset')

		expect(labelOf(preset)).toMatchObject({
			text: {
				isExpression: true,
				value:
					"`OcaFrequencyActuator/1\\n (Rotary)\\n${isNumber($(local:range).values[0]) ? ($(local:range).values[0] >= 1000 ? `${round($(local:range).values[0] / 1000 * 100) / 100} kHz` : ($(local:range).values[0] < 100 ? `${round($(local:range).values[0] * 10) / 10} Hz` : `${round($(local:range).values[0])} Hz`)) : ''}`",
			},
		})
	})

	// The NAM on 2026-09-25: AMP/CH0/DLY reported 0-2.5 s and AES/CH0/VOXT 0.002-0.02 s, so a fixed step of 1
	// was 40% of the one and the whole of the other. A 25th is 0.1 s and 0.72 ms
	it('steps a delay by a 25th of the range the device reports, a 250th while held, on a pink dial', async () => {
		const { presets } = await define([
			[
				'AMP/CH0/DLY',
				makeObject(ControlClasses.OcaDelay, 1, [
					['Enabled', true],
					['DelayTime', 0],
				]),
			],
		])
		const preset = presets['rotary_OcaDelay_AMP/CH0/DLY']
		if (preset?.type !== 'layered') throw new Error('No layered delay preset')

		expect(preset.localVariables?.[0]).toEqual({
			variableType: 'simple',
			variableName: 'range_divisions',
			startupValue: 25,
		})
		const turns = [preset.steps[0]?.rotate_left?.[0], preset.steps[0]?.rotate_right?.[0]] as PresetEntry[]
		expect(turns.map((action) => action.options.value_DelayTime)).toEqual([
			{
				isExpression: true,
				value:
					'max($(local:range).values[1], $(local:range).values[0] - ($(local:range).values[2] - $(local:range).values[1]) / ($(this:active) ? $(local:range_divisions) * 10 : $(local:range_divisions)))',
			},
			{
				isExpression: true,
				value:
					'min($(local:range).values[2], $(local:range).values[0] + ($(local:range).values[2] - $(local:range).values[1]) / ($(this:active) ? $(local:range_divisions) * 10 : $(local:range_divisions)))',
			},
		])
		const dial = preset.elements.find((element) => element.id === 'dial')
		if (dial?.type !== 'composite') throw new Error('No dial on the delay preset')
		expect(dial.options.color).toBe(0xffc0ff)
	})

	// Companion reads template literal text raw, so these would otherwise end the literal or interpolate
	it("puts a role path that would break the label's template literal in as a quoted string", async () => {
		const { presets } = await define([['we`ird$(x)', gain(1)]])
		const preset = presets['rotary_OcaGain_we`ird$(x)']
		if (preset?.type !== 'layered') throw new Error('No layered gain preset')

		expect(labelOf(preset)).toMatchObject({
			text: { isExpression: true, value: expect.stringMatching(/^`\$\{"we`ird\$\(x\)"\}\\n \(Rotary\)\\n\$\{/) },
		})
	})

	// The limits expressions index into this shape, so it is pinned here as well as wherever the feedback is tested
	it("gets a rotary's value and limits from the Get Property feedback without sync, as { values: [value, min, max] }", async () => {
		const { presets } = await define([['MIC/GAIN', gain(1)]])
		const preset = presets['rotary_OcaGain_MIC/GAIN']
		if (preset?.type !== 'layered') throw new Error('No layered gain preset')
		const range = preset.localVariables?.find((variable) => variable.variableName === 'range') as PresetEntry
		// The getter's reply as aes70 decodes it, from the NAM's MIC/GAIN on 2026-09-19
		;(ctx.helper.getObject('MIC/GAIN') as unknown as { GetGain: unknown }).GetGain = vi
			.fn()
			.mockResolvedValue(new Arguments([0, -2.4000000953674316, 41.5]))

		const feedback = ctx.setFeedbackDefinitions.mock.lastCall?.[0].get_property_OcaGain as unknown as {
			callback: (event: unknown, context: unknown) => Promise<unknown>
		}
		const result = await feedback.callback(
			{ type: 'value', id: 'fb1', controlId: 'bank:1:1', feedbackId: range.feedbackId, options: range.options },
			{ type: 'feedback', signal: new AbortController().signal },
		)

		expect(result).toEqual({ values: [0, -2.4000000953674316, 41.5] })
	})

	it('steps a switch without position names a whole position per detent, with no fine mode', async () => {
		const { presets } = await define([['SDCARD/PLAY', switchObject(1)]])
		const preset = presets['rotary_OcaSwitch_SDCARD/PLAY']
		if (preset?.type !== 'layered') throw new Error('No layered switch preset')

		const turnValues = preset.steps.flatMap((step) =>
			[...(step.rotate_left ?? []), ...(step.rotate_right ?? [])].map(
				(action) => (action as PresetEntry).options.value_Position,
			),
		)
		expect(turnValues).toEqual([
			{ isExpression: true, value: 'max($(local:range).values[1], $(local:range).values[0] - $(local:step_size))' },
			{ isExpression: true, value: 'min($(local:range).values[2], $(local:range).values[0] + $(local:step_size))' },
		])
		expect(preset.localVariables?.[0]).toEqual({ variableType: 'simple', variableName: 'step_size', startupValue: 1 })
	})

	it('shows a switch position by name, and stops at the last named position', async () => {
		const { presets } = await define([['SDCARD/PLAY', namedSwitch(1)]])
		const preset = presets['rotary_OcaSwitch_SDCARD/PLAY']
		if (preset?.type !== 'layered') throw new Error('No layered switch preset')

		expect(preset.localVariables?.at(-1)).toEqual({
			variableType: 'feedback',
			variableName: 'names',
			feedbackId: 'get_property_OcaSwitch',
			options: { objectId: 'SDCARD/PLAY', property: 'PositionNames', sync: true },
		})
		// The name while the names are an array holding one for this position, otherwise the number as before
		expect(labelOf(preset)).toMatchObject({
			text: {
				isExpression: true,
				value:
					"`SDCARD/PLAY\\n (Rotary)\\n${arrayIncludes($(local:names), $(local:names)[$(local:range).values[0]]) ? $(local:names)[$(local:range).values[0]] : isNumber($(local:range).values[0]) ? round($(local:range).values[0] * 1000) / 1000 : ''}`",
			},
		})
		// The NAM reports max as the number of positions, one past the last
		const rightTurn = (preset.steps[0]?.rotate_right?.[0] as PresetEntry | undefined)?.options.value_Position
		expect(rightTurn).toEqual({
			isExpression: true,
			value:
				'min($(local:range).values[2], (arrayIncludes($(local:names), $(local:names)[0]) ? length($(local:names)) - 1 : $(local:range).values[2]), $(local:range).values[0] + $(local:step_size))',
		})
	})

	// aes70 truncates a fractional integer when it encodes it, so a fine step below 1 would be uneven
	it('starts every integer dial with fine mode at a step of 10 or a multiple, so the fine step is whole', () => {
		const integerEncoders = new Set<unknown>([OcaInt8, OcaInt16, OcaInt32, OcaUint8, OcaUint16, OcaUint32])
		const checked: string[] = []
		for (const [i, rotary] of ROTARY_CLASSES.entries()) {
			const obj = makeObject(ControlClasses[rotary.className], i + 1, [])
			const encoder = obj.get_properties().find_property(rotary.property)?.type?.[0]
			if (!integerEncoders.has(encoder) || !rotary.fine) continue
			expect(rotary.stepSize % 10, rotary.className).toBe(0)
			checked.push(rotary.className)
		}
		expect(checked).toEqual([
			'OcaInt8Actuator',
			'OcaInt16Actuator',
			'OcaInt32Actuator',
			'OcaUint8Actuator',
			'OcaUint16Actuator',
			'OcaUint32Actuator',
		])
	})

	it('gives every rotary class a group whose presets its action and feedback can serve', async () => {
		const roleMap = ROTARY_CLASSES.map(({ className, property }, i): [string, OcaRoot] => [
			`${className}/1`,
			makeObject(ControlClasses[className] as unknown as ControlClass, i + 1, [
				['Enabled', true],
				[property, 0],
			]),
		])
		const { structure, presets } = await define(roleMap)
		const actions = ctx.setActionDefinitions.mock.lastCall?.[0] as unknown as Record<string, DefinitionShape>
		const feedbacks = ctx.setFeedbackDefinitions.mock.lastCall?.[0] as unknown as Record<string, DefinitionShape>

		// A property name aes70 doesn't have would leave its class without a group
		expect(structure.find((section) => section.id === 'rotaries')?.definitions).toEqual(
			ROTARY_CLASSES.map(({ className }) => expect.objectContaining({ id: `rotary_${className}` })),
		)
		for (const preset of Object.values(presets)) {
			if (preset?.type !== 'layered') throw new Error('Expected layered presets')
			const turns = preset.steps.flatMap((step) => [...(step.rotate_left ?? []), ...(step.rotate_right ?? [])])
			expect(turns).toHaveLength(2)
			for (const action of turns as PresetEntry[]) expectOptionsOffered(actions[action.actionId ?? ''], action.options)
			for (const variable of (preset.localVariables ?? []) as PresetEntry[]) {
				if (variable.feedbackId) expectOptionsOffered(feedbacks[variable.feedbackId], variable.options)
			}
		}
	})
})
