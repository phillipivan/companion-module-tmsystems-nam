import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import type {
	CompanionActionDefinitions,
	CompanionFeedbackDefinitions,
	CompanionPresetDefinitions,
	CompanionPresetSection,
} from '@companion-module/base'
import {
	OcaBooleanActuator,
	OcaGain,
	OcaIdentificationActuator,
	OcaMute,
	OcaPolarity,
} from 'aes70/src/controller/ControlClasses.js'
import { OcaMuteState } from 'aes70/src/types/OcaMuteState.js'
import { OcaPolarityState } from 'aes70/src/types/OcaPolarityState.js'
import { OcaHelper } from '../OcaHelper.js'
import { UpdateActions, type ActionSchema } from '../actions.js'
import { UpdateFeedbacks, type FeedbackSchema } from '../feedbacks.js'
import { UpdatePresets } from '../presets.js'
import type { OcaModuleTypes } from '../types.js'
import type ModuleInstance from '../main.js'

type ControlClass =
	typeof OcaMute | typeof OcaPolarity | typeof OcaBooleanActuator | typeof OcaIdentificationActuator | typeof OcaGain

/**
 * A real aes70 object against an inert device, with GetPropertySync stubbed to report
 * `reported`, so class probes resolve without any network I/O.
 */
function makeObject(
	Cls: ControlClass,
	ono: number,
	reported: [name: string, value: unknown][],
): InstanceType<ControlClass> {
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

const mute = (ono: number): InstanceType<ControlClass> =>
	makeObject(OcaMute, ono, [
		['Enabled', true],
		['State', OcaMuteState.Unmuted],
	])
const polarity = (ono: number): InstanceType<ControlClass> =>
	makeObject(OcaPolarity, ono, [
		['Enabled', true],
		['State', OcaPolarityState.NonInverted],
	])
const booleanActuator = (ono: number): InstanceType<ControlClass> =>
	makeObject(OcaBooleanActuator, ono, [
		['Enabled', true],
		['Setting', false],
	])
const identification = (ono: number): InstanceType<ControlClass> =>
	makeObject(OcaIdentificationActuator, ono, [
		['Enabled', true],
		['Active', false],
	])
const gain = (ono: number): InstanceType<ControlClass> =>
	makeObject(OcaGain, ono, [
		['Enabled', true],
		['Gain', 0],
	])

describe('toggle presets', () => {
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
	async function define(roleMap: [path: string, obj: InstanceType<ControlClass>][]): Promise<{
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
		])
		expect(Object.keys(presets)).toEqual([
			'toggle_OcaMute_AMP/CH1/MUTE',
			'toggle_OcaMute_AMP/CH0/MUTE',
			'toggle_OcaPolarity_AMP/CH0/POLARITY',
			'toggle_OcaBooleanActuator_MIC/PH',
			'toggle_OcaIdentificationActuator_IDENTIFY',
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

	// A preset option the definition doesn't have is dropped or fails validation when the button runs
	it('only sets options, properties and values that the referenced action and feedback offer', async () => {
		const { presets } = await define([
			['AMP/CH0/MUTE', mute(1)],
			['AMP/CH0/POLARITY', polarity(2)],
			['MIC/PH', booleanActuator(3)],
			['IDENTIFY', identification(4)],
		])
		expect(Object.keys(presets)).toHaveLength(4)
		const actions = setActionDefinitions.mock.lastCall?.[0] as unknown as Record<string, DefinitionShape>
		const feedbacks = setFeedbackDefinitions.mock.lastCall?.[0] as unknown as Record<string, DefinitionShape>

		for (const preset of Object.values(presets)) {
			if (preset?.type !== 'layered') throw new Error('Expected layered presets')
			for (const action of preset.steps.flatMap((step) => step.down) as PresetEntry[]) {
				expectOptionsOffered(actions[action.actionId ?? ''], action.options)
			}
			for (const variable of (preset.localVariables ?? []) as PresetEntry[]) {
				expectOptionsOffered(feedbacks[variable.feedbackId ?? ''], variable.options)
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
		const { structure, presets } = await define([['MIC/GAIN', gain(1)]])

		expect(structure).toEqual([])
		expect(presets).toEqual({})
	})
})

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
