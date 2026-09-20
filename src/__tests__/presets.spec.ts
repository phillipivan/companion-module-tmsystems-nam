import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import type {
	CompanionActionDefinitions,
	CompanionFeedbackDefinitions,
	CompanionPresetDefinitions,
	CompanionPresetSection,
} from '@companion-module/base'
import * as ControlClasses from 'aes70/src/controller/ControlClasses.js'
import {
	OcaAudioLevelSensor,
	OcaBooleanActuator,
	OcaGain,
	OcaIdentificationActuator,
	OcaLevelSensor,
	OcaMute,
	OcaPolarity,
	OcaSwitch,
	type OcaRoot,
} from 'aes70/src/controller/ControlClasses.js'
import { Arguments } from 'aes70/src/controller/arguments.js'
import { OcaInt8 } from 'aes70/src/OCP1/OcaInt8.js'
import { OcaInt16 } from 'aes70/src/OCP1/OcaInt16.js'
import { OcaInt32 } from 'aes70/src/OCP1/OcaInt32.js'
import { OcaUint8 } from 'aes70/src/OCP1/OcaUint8.js'
import { OcaUint16 } from 'aes70/src/OCP1/OcaUint16.js'
import { OcaUint32 } from 'aes70/src/OCP1/OcaUint32.js'
import { OcaMuteState } from 'aes70/src/types/OcaMuteState.js'
import { OcaPolarityState } from 'aes70/src/types/OcaPolarityState.js'
import { OcaHelper } from '../OcaHelper.js'
import { UpdateActions, type ActionSchema } from '../actions.js'
import { UpdateFeedbacks, type FeedbackSchema } from '../feedbacks.js'
import { ROTARY_CLASSES, UpdatePresets } from '../presets.js'
import { UpdateCompositeElements } from '../composites.js'
import { makeNamFilterParametric } from './fakeControlObjects.js'
import type { OcaModuleTypes } from '../types.js'
import type ModuleInstance from '../main.js'

type ControlClass = new (ono: number, device: ConstructorParameters<typeof OcaMute>[1]) => OcaRoot

/**
 * A real aes70 object against an inert device, with GetPropertySync stubbed to report
 * `reported`, so class probes resolve without any network I/O.
 */
function makeObject(Cls: ControlClass, ono: number, reported: [name: string, value: unknown][]): OcaRoot {
	const device = { send_command: vi.fn(), add_subscription: vi.fn(), remove_subscription: vi.fn() }
	const obj = new Cls(ono, device as unknown as ConstructorParameters<ControlClass>[1])
	;(obj as unknown as { GetPropertySync: unknown }).GetPropertySync = () => ({
		sync: async (): Promise<void> => undefined,
		forEach: (cb: (value: unknown, name: string) => void): void => {
			for (const [name, value] of reported) cb(value, name)
		},
		Dispose: (): undefined => undefined,
	})
	return obj
}

const mute = (ono: number): OcaRoot =>
	makeObject(OcaMute, ono, [
		['Enabled', true],
		['State', OcaMuteState.Unmuted],
	])
const polarity = (ono: number): OcaRoot =>
	makeObject(OcaPolarity, ono, [
		['Enabled', true],
		['State', OcaPolarityState.NonInverted],
	])
const booleanActuator = (ono: number): OcaRoot =>
	makeObject(OcaBooleanActuator, ono, [
		['Enabled', true],
		['Setting', false],
	])
const identification = (ono: number): OcaRoot =>
	makeObject(OcaIdentificationActuator, ono, [
		['Enabled', true],
		['Active', false],
	])
const gain = (ono: number): OcaRoot =>
	makeObject(OcaGain, ono, [
		['Enabled', true],
		['Gain', 0],
	])
/** A switch like the NAM's SDCARD/PLAY on 2026-09-20: position 0 of three named ones, though it reports a max of 3. */
const namedSwitch = (ono: number): OcaRoot =>
	makeObject(OcaSwitch, ono, [
		['Enabled', true],
		['Position', 0],
		['PositionNames', ['ON', 'OFF', 'LOOP']],
	])
const switchObject = (ono: number): OcaRoot =>
	makeObject(OcaSwitch, ono, [
		['Enabled', true],
		['Position', 1],
	])
/** Like one of the NAM's 16 OcaLevelSensors, such as CHLEVELS/INS0. Its Reading is read-only. */
const levelSensor = (ono: number): OcaRoot =>
	makeObject(OcaLevelSensor, ono, [
		['Enabled', true],
		['Reading', -42.123456],
	])
const audioLevelSensor = (ono: number): OcaRoot =>
	makeObject(OcaAudioLevelSensor, ono, [
		['Enabled', true],
		['Reading', -12.5],
	])

describe('presets', () => {
	let helper: OcaHelper
	let self: ModuleInstance
	let setPresetDefinitions: Mock<
		(structure: CompanionPresetSection<OcaModuleTypes>[], presets: CompanionPresetDefinitions<OcaModuleTypes>) => void
	>
	let setActionDefinitions: Mock<(definitions: CompanionActionDefinitions<ActionSchema>) => void>
	let setFeedbackDefinitions: Mock<(definitions: CompanionFeedbackDefinitions<FeedbackSchema>) => void>

	beforeEach(() => {
		helper = new OcaHelper()
		setPresetDefinitions = vi.fn()
		setActionDefinitions = vi.fn()
		setFeedbackDefinitions = vi.fn()
		self = {
			ocaHelper: helper,
			setPresetDefinitions,
			setActionDefinitions,
			setFeedbackDefinitions,
		} as unknown as ModuleInstance
	})

	/** Load a role map and define everything, in the order the module does. */
	async function define(roleMap: [path: string, obj: OcaRoot][]): Promise<{
		structure: CompanionPresetSection<OcaModuleTypes>[]
		presets: CompanionPresetDefinitions<OcaModuleTypes>
	}> {
		await helper.loadRoleMap(new Map<string, unknown>(roleMap))
		await UpdateActions(self)
		await UpdateFeedbacks(self)
		await UpdatePresets(self)
		const [structure, presets] = setPresetDefinitions.mock.lastCall ?? []
		if (!structure || !presets) throw new Error('No presets were defined')
		return { structure, presets }
	}

	it('groups one preset per object by class, in role map order, and leaves other classes out', async () => {
		const { structure, presets } = await define([
			['AMP/CH1/MUTE', mute(1)],
			['MIC/GAIN', gain(2)],
			['AMP/CH0/POLARITY', polarity(3)],
			['AMP/CH0/MUTE', mute(4)],
			['MIC/PH', booleanActuator(5)],
			['IDENTIFY', identification(6)],
			['SDCARD/PLAY', switchObject(7)],
			['CHLEVELS/INS0', levelSensor(8)],
			['MIC/BQ0', makeNamFilterParametric(9)],
		])

		expect(structure).toEqual([
			{
				id: 'toggles',
				name: 'Toggles',
				definitions: [
					{
						id: 'toggle_OcaMute',
						type: 'simple',
						name: 'Mute',
						presets: ['toggle_OcaMute_AMP/CH1/MUTE', 'toggle_OcaMute_AMP/CH0/MUTE'],
					},
					{
						id: 'toggle_OcaPolarity',
						type: 'simple',
						name: 'Polarity',
						presets: ['toggle_OcaPolarity_AMP/CH0/POLARITY'],
					},
					{
						id: 'toggle_OcaBooleanActuator',
						type: 'simple',
						name: 'Boolean Actuator',
						presets: ['toggle_OcaBooleanActuator_MIC/PH'],
					},
					{
						id: 'toggle_OcaIdentificationActuator',
						type: 'simple',
						name: 'Identification Actuator',
						presets: ['toggle_OcaIdentificationActuator_IDENTIFY'],
					},
				],
			},
			{
				id: 'rotaries',
				name: 'Rotaries',
				definitions: [
					{ id: 'rotary_OcaGain', type: 'simple', name: 'Gain', presets: ['rotary_OcaGain_MIC/GAIN'] },
					{ id: 'rotary_OcaSwitch', type: 'simple', name: 'Switch', presets: ['rotary_OcaSwitch_SDCARD/PLAY'] },
				],
			},
			{
				id: 'meters',
				name: 'Meters',
				definitions: [
					{
						id: 'meter_OcaLevelSensor',
						type: 'simple',
						name: 'Level Sensor',
						presets: ['meter_OcaLevelSensor_CHLEVELS/INS0'],
					},
				],
			},
		])
		expect(Object.keys(presets)).toEqual([
			'toggle_OcaMute_AMP/CH1/MUTE',
			'toggle_OcaMute_AMP/CH0/MUTE',
			'toggle_OcaPolarity_AMP/CH0/POLARITY',
			'toggle_OcaBooleanActuator_MIC/PH',
			'toggle_OcaIdentificationActuator_IDENTIFY',
			'rotary_OcaGain_MIC/GAIN',
			'rotary_OcaSwitch_SDCARD/PLAY',
			'meter_OcaLevelSensor_CHLEVELS/INS0',
		])
	})

	it('labels a mute button with its object, toggles it with an expression, and turns it red when muted', async () => {
		const { presets } = await define([['AMP/CH0/MUTE', mute(1)]])

		expect(presets['toggle_OcaMute_AMP/CH0/MUTE']).toEqual({
			type: 'layered',
			name: 'Mute - AMP/CH0/MUTE',
			elements: [
				{ type: 'box', id: 'background', name: 'Background', color: 0x000000 },
				{ type: 'text', id: 'label', name: 'Label', text: 'AMP/CH0/MUTE', fontsize: 22, color: 0xffffff },
			],
			steps: [
				{
					down: [
						{
							actionId: 'set_property_OcaMute',
							options: {
								objectId: 'AMP/CH0/MUTE',
								property: 'State',
								// Muted (1) becomes Unmuted (2); anything else, including not yet known, becomes Muted
								value_State: { isExpression: true, value: '$(local:mute) == 1 ? 2 : 1' },
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'internal:checkExpression',
					options: { expression: '$(local:mute) == 1' },
					styleOverrides: [
						{ elementId: 'background', elementProperty: 'color', override: { isExpression: false, value: 0xff0000 } },
					],
				},
			],
			localVariables: [
				{
					variableType: 'feedback',
					variableName: 'mute',
					feedbackId: 'get_property_OcaMute',
					options: { objectId: 'AMP/CH0/MUTE', property: 'State', sync: true, enum_State: false },
				},
			],
		})
	})

	it('toggles polarity back to normal unless it is known to be normal, and turns amber when inverted', async () => {
		const { presets } = await define([['AMP/CH0/POLARITY', polarity(1)]])
		const preset = presets['toggle_OcaPolarity_AMP/CH0/POLARITY']
		if (preset?.type !== 'layered') throw new Error('No layered polarity preset')

		// NonInverted (1) becomes Inverted (2); anything else, including not yet known, becomes NonInverted
		expect(preset.steps[0]?.down).toEqual([
			{
				actionId: 'set_property_OcaPolarity',
				options: {
					objectId: 'AMP/CH0/POLARITY',
					property: 'State',
					value_State: { isExpression: true, value: '$(local:polarity) == 1 ? 2 : 1' },
				},
			},
		])
		expect(preset.feedbacks).toEqual([
			{
				feedbackId: 'internal:checkExpression',
				options: { expression: '$(local:polarity) == 2' },
				styleOverrides: [
					{ elementId: 'background', elementProperty: 'color', override: { isExpression: false, value: 0xffbf00 } },
					{ elementId: 'label', elementProperty: 'color', override: { isExpression: false, value: 0x000000 } },
				],
			},
		])
		expect(preset.localVariables).toEqual([
			{
				variableType: 'feedback',
				variableName: 'polarity',
				feedbackId: 'get_property_OcaPolarity',
				options: { objectId: 'AMP/CH0/POLARITY', property: 'State', sync: true, enum_State: false },
			},
		])
	})

	it('toggles a boolean actuator off unless it is known to be off, and turns green when on', async () => {
		const { presets } = await define([['MIC/PH', booleanActuator(1)]])
		const preset = presets['toggle_OcaBooleanActuator_MIC/PH']
		if (preset?.type !== 'layered') throw new Error('No layered boolean actuator preset')

		expect(preset.elements).toEqual([
			{ type: 'box', id: 'background', name: 'Background', color: 0x000000 },
			{ type: 'text', id: 'label', name: 'Label', text: 'MIC/PH', fontsize: 22, color: 0xffffff },
		])
		// False becomes true; anything else, including not yet known, becomes false
		expect(preset.steps[0]?.down).toEqual([
			{
				actionId: 'set_property_OcaBooleanActuator',
				options: {
					objectId: 'MIC/PH',
					property: 'Setting',
					value_Setting: { isExpression: true, value: '$(local:setting) == false ? true : false' },
				},
			},
		])
		expect(preset.feedbacks).toEqual([
			{
				feedbackId: 'internal:checkExpression',
				options: { expression: '$(local:setting) == true' },
				styleOverrides: [
					{ elementId: 'background', elementProperty: 'color', override: { isExpression: false, value: 0x009900 } },
				],
			},
		])
		// A boolean property's feedback has no Enum option
		expect(preset.localVariables).toEqual([
			{
				variableType: 'feedback',
				variableName: 'setting',
				feedbackId: 'get_property_OcaBooleanActuator',
				options: { objectId: 'MIC/PH', property: 'Setting', sync: true },
			},
		])
	})

	it('toggles identification off unless it is known to be off, and turns blue while identifying', async () => {
		const { presets } = await define([['IDENTIFY', identification(1)]])
		const preset = presets['toggle_OcaIdentificationActuator_IDENTIFY']
		if (preset?.type !== 'layered') throw new Error('No layered identification actuator preset')

		expect(preset.steps[0]?.down).toEqual([
			{
				actionId: 'set_property_OcaIdentificationActuator',
				options: {
					objectId: 'IDENTIFY',
					property: 'Active',
					value_Active: { isExpression: true, value: '$(local:identify) == false ? true : false' },
				},
			},
		])
		expect(preset.feedbacks).toEqual([
			{
				feedbackId: 'internal:checkExpression',
				options: { expression: '$(local:identify) == true' },
				styleOverrides: [
					{ elementId: 'background', elementProperty: 'color', override: { isExpression: false, value: 0x0000ff } },
				],
			},
		])
		expect(preset.localVariables).toEqual([
			{
				variableType: 'feedback',
				variableName: 'identify',
				feedbackId: 'get_property_OcaIdentificationActuator',
				options: { objectId: 'IDENTIFY', property: 'Active', sync: true },
			},
		])
	})

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
				// Between the background and the label, so the arc is drawn behind the text
				{
					type: 'composite',
					id: 'dial',
					name: 'Value Dial',
					elementId: 'dial',
					options: {
						level: { isExpression: true, value: '$(local:range).values[0]' },
						min: { isExpression: true, value: '$(local:range).values[1]' },
						max: { isExpression: true, value: '$(local:range).values[2]' },
						color: 0x009900,
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
							"`MIC/GAIN\\n (Rotary)\\n${isNumber($(local:range).values[0]) ? `${round($(local:range).values[0] * 1000) / 1000} dB` : ''}`",
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

	it('gives a dial only to the rotary classes whose table entry asks for one, always behind the label', async () => {
		const roleMap = ROTARY_CLASSES.map(({ className, property }, i): [string, OcaRoot] => [
			`${className}/1`,
			makeObject(ControlClasses[className] as unknown as ControlClass, i + 1, [
				['Enabled', true],
				[property, 0],
			]),
		])
		const { presets } = await define(roleMap)

		const withDial: string[] = []
		for (const [id, preset] of Object.entries(presets)) {
			if (preset?.type !== 'layered') throw new Error('Expected layered presets')
			const ids = preset.elements.map((element) => element.id)
			if (!ids.includes('dial')) continue
			withDial.push(id)
			// Drawn in order, so the arc goes down before the text that sits over it
			expect(ids, id).toEqual(['background', 'dial', 'label'])
		}
		expect(withDial).toEqual(
			ROTARY_CLASSES.filter((rotary) => rotary.dial).map(({ className }) => `rotary_${className}_${className}/1`),
		)
		expect(withDial).toEqual(['rotary_OcaGain_OcaGain/1'])
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
		}
		expect(ROTARY_CLASSES.filter((rotary) => rotary.unit !== undefined).map((rotary) => rotary.className)).toEqual([
			'OcaGain',
		])
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
		;(helper.getObject('MIC/GAIN') as unknown as { GetGain: unknown }).GetGain = vi
			.fn()
			.mockResolvedValue(new Arguments([0, -2.4000000953674316, 41.5]))

		const feedback = setFeedbackDefinitions.mock.lastCall?.[0].get_property_OcaGain as unknown as {
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
				'min($(local:range).values[2], arrayIncludes($(local:names), $(local:names)[0]) ? length($(local:names)) - 1 : $(local:range).values[2], $(local:range).values[0] + $(local:step_size))',
		})
	})

	it('shows a level sensor reading in dB above a bar along the bottom of the button', async () => {
		const { presets } = await define([['CHLEVELS/INS0', levelSensor(1)]])

		expect(presets['meter_OcaLevelSensor_CHLEVELS/INS0']).toEqual({
			type: 'layered',
			name: 'Level Sensor - CHLEVELS/INS0',
			elements: [
				{ type: 'box', id: 'background', name: 'Background', color: 0x000000 },
				{
					type: 'text',
					id: 'label',
					name: 'Label',
					// The unit is in a nested template literal, since Companion's + adds numbers rather than
					// joining strings. Before the first reading the line is empty, not "$NA dB"
					text: {
						isExpression: true,
						value:
							"`CHLEVELS/INS0\\n${isNumber($(local:level).values[0]) ? `${round($(local:level).values[0] * 10) / 10} dB` : ''}`",
					},
					// Clear of the bar below it
					height: 90,
					fontsize: 22,
					color: 0xffffff,
				},
				{
					type: 'composite',
					id: 'meter',
					name: 'Signal Meter',
					elementId: 'meter',
					// Reading, then the sensor's own limits, all from the one read
					options: {
						level: { isExpression: true, value: '$(local:level).values[0]' },
						min: { isExpression: true, value: '$(local:level).values[1]' },
						max: { isExpression: true, value: '$(local:level).values[2]' },
						position: 'bottom',
						padding: 2,
					},
				},
			],
			// A sensor is read-only, so nothing on the button writes to the device
			steps: [{ down: [], up: [] }],
			feedbacks: [],
			localVariables: [
				{
					variableType: 'feedback',
					variableName: 'level',
					feedbackId: 'get_property_OcaLevelSensor',
					options: { objectId: 'CHLEVELS/INS0', property: 'Reading', sync: false },
				},
			],
		})
	})

	// The label and the bar both index into this shape. aes70 declares GetReading as
	// Arguments<[number, number, number]>, so it decodes like the actuators' getters; what a real sensor
	// puts in those three slots is still unconfirmed, the NAM being away until the week of 2026-09-22
	it("gets a sensor's reading and limits from the Get Property feedback without sync, as { values: [reading, min, max] }", async () => {
		const { presets } = await define([['CHLEVELS/INS0', levelSensor(1)]])
		const preset = presets['meter_OcaLevelSensor_CHLEVELS/INS0']
		if (preset?.type !== 'layered') throw new Error('No layered level sensor preset')
		const level = preset.localVariables?.find((variable) => variable.variableName === 'level') as PresetEntry
		;(helper.getObject('CHLEVELS/INS0') as unknown as { GetReading: unknown }).GetReading = vi
			.fn()
			.mockResolvedValue(new Arguments([-42.123456, -200, 20]))

		const feedback = setFeedbackDefinitions.mock.lastCall?.[0].get_property_OcaLevelSensor as unknown as {
			callback: (event: unknown, context: unknown) => Promise<unknown>
		}
		const result = await feedback.callback(
			{ type: 'value', id: 'fb1', controlId: 'bank:1:1', feedbackId: level.feedbackId, options: level.options },
			{ type: 'feedback', signal: new AbortController().signal },
		)

		expect(result).toEqual({ values: [-42.123456, -200, 20] })
	})

	// Reading has a getter and no setter, so requiring a writable property would leave both classes out
	it('gives both sensor classes meter presets, though their reading can only be read', async () => {
		const { structure, presets } = await define([
			['CHLEVELS/INS0', levelSensor(1)],
			['CHLEVELS/INS1', levelSensor(2)],
			['AMP/CH0/LEVEL', audioLevelSensor(3)],
		])

		expect(structure).toEqual([
			{
				id: 'meters',
				name: 'Meters',
				definitions: [
					{
						id: 'meter_OcaLevelSensor',
						type: 'simple',
						name: 'Level Sensor',
						presets: ['meter_OcaLevelSensor_CHLEVELS/INS0', 'meter_OcaLevelSensor_CHLEVELS/INS1'],
					},
					{
						id: 'meter_OcaAudioLevelSensor',
						type: 'simple',
						// Reading is inherited from OcaLevelSensor
						name: 'Audio Level Sensor',
						presets: ['meter_OcaAudioLevelSensor_AMP/CH0/LEVEL'],
					},
				],
			},
		])
		const audio = presets['meter_OcaAudioLevelSensor_AMP/CH0/LEVEL']
		if (audio?.type !== 'layered') throw new Error('No layered audio level sensor preset')
		expect(audio.localVariables?.at(-1)).toEqual({
			variableType: 'feedback',
			variableName: 'level',
			feedbackId: 'get_property_OcaAudioLevelSensor',
			options: { objectId: 'AMP/CH0/LEVEL', property: 'Reading', sync: false },
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
		const actions = setActionDefinitions.mock.lastCall?.[0] as unknown as Record<string, DefinitionShape>
		const feedbacks = setFeedbackDefinitions.mock.lastCall?.[0] as unknown as Record<string, DefinitionShape>

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

	// A preset option the definition doesn't have is dropped or fails validation when the button runs
	it('only sets options, properties and values that the referenced action and feedback offer', async () => {
		const { presets } = await define([
			['AMP/CH0/MUTE', mute(1)],
			['AMP/CH0/POLARITY', polarity(2)],
			['MIC/PH', booleanActuator(3)],
			['IDENTIFY', identification(4)],
			['MIC/GAIN', gain(5)],
			['SDCARD/PLAY', namedSwitch(6)],
			['CHLEVELS/INS0', levelSensor(7)],
		])
		expect(Object.keys(presets)).toHaveLength(7)
		const actions = setActionDefinitions.mock.lastCall?.[0] as unknown as Record<string, DefinitionShape>
		const feedbacks = setFeedbackDefinitions.mock.lastCall?.[0] as unknown as Record<string, DefinitionShape>
		// An element's options are checked the same way, against the composite the module offers
		const setCompositeElementDefinitions = vi.fn()
		UpdateCompositeElements({ setCompositeElementDefinitions } as unknown as ModuleInstance)
		const composites = setCompositeElementDefinitions.mock.lastCall?.[0] as Record<string, DefinitionShape>

		for (const preset of Object.values(presets)) {
			if (preset?.type !== 'layered') throw new Error('Expected layered presets')
			const presetActions = preset.steps.flatMap((step) => [
				...step.down,
				...(step.rotate_left ?? []),
				...(step.rotate_right ?? []),
			])
			for (const action of presetActions as PresetEntry[]) {
				expectOptionsOffered(actions[action.actionId ?? ''], action.options)
			}
			for (const variable of (preset.localVariables ?? []) as PresetEntry[]) {
				// A simple local variable, such as step_size, has no feedback
				if (variable.feedbackId) expectOptionsOffered(feedbacks[variable.feedbackId], variable.options)
			}
			for (const element of preset.elements) {
				if (element.type !== 'composite') continue
				expectOptionsOffered(composites[element.elementId], element.options)
			}
		}
	})

	// Companion 5.1 keeps an override only when it is an { isExpression, value } wrapper, and applies it by element id
	it("styles only the preset's own elements, with overrides Companion keeps", async () => {
		const { presets } = await define([
			['AMP/CH0/MUTE', mute(1)],
			['AMP/CH0/POLARITY', polarity(2)],
			['MIC/PH', booleanActuator(3)],
			['IDENTIFY', identification(4)],
		])

		for (const preset of Object.values(presets)) {
			if (preset?.type !== 'layered') throw new Error('Expected layered presets')
			const elementIds = preset.elements.map((element) => element.id)
			const overrides = preset.feedbacks.flatMap((feedback) => feedback.styleOverrides)
			expect(overrides.length).toBeGreaterThan(0)
			for (const { elementId, override } of overrides) {
				expect(elementIds).toContain(elementId)
				expect(override).toEqual({ isExpression: false, value: expect.any(Number) })
			}
		}
	})

	it("leaves out a class whose objects don't implement the toggled property", async () => {
		const { structure, presets } = await define([['AMP/CH0/MUTE', makeObject(OcaMute, 1, [['Enabled', true]])]])

		expect(structure).toEqual([])
		expect(presets).toEqual({})
	})

	it('defines no sections when the device has none of the classes', async () => {
		const { structure, presets } = await define([['MIC/BQ0', makeNamFilterParametric(1)]])

		expect(structure).toEqual([])
		expect(presets).toEqual({})
	})
})

/** The preset's text element, found by id rather than position, since a dial sits between it and the background. */
function labelOf(preset: { elements: { id?: string }[] }): unknown {
	const label = preset.elements.find((element) => element.id === 'label')
	expect(label).toBeDefined()
	return label
}

type DefinitionShape = { options: { id: string; choices?: { id: string | number }[] }[] }
type PresetEntry = { actionId?: string; feedbackId?: string; options: Record<string, unknown> }

/** Every option `options` sets exists on `definition`, and every fixed dropdown value is one of its choices. */
function expectOptionsOffered(definition: DefinitionShape | undefined, options: Record<string, unknown>): void {
	expect(definition).toBeDefined()
	for (const [id, value] of Object.entries(options)) {
		const option = definition?.options.find((o) => o.id === id)
		expect(option, `option ${id}`).toBeDefined()
		if (!option?.choices) continue
		if (isExpression(value)) {
			// A toggle expression's two results must both be choices
			const results = /\?\s*(\d+)\s*:\s*(\d+)$/.exec(value.value)?.slice(1).map(Number)
			expect(results, `option ${id} results`).toHaveLength(2)
			expect(option.choices.map((c) => c.id)).toEqual(expect.arrayContaining(results ?? []))
		} else {
			expect(
				option.choices.map((c) => c.id),
				`option ${id}`,
			).toContain(value)
		}
	}
}

function isExpression(value: unknown): value is { isExpression: true; value: string } {
	return typeof value === 'object' && value !== null && (value as { isExpression?: unknown }).isExpression === true
}
