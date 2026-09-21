import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OcaMute } from 'aes70/src/controller/ControlClasses.js'
import { UpdateCompositeElements } from '../../composites.js'
import {
	booleanActuator,
	expectOptionsOffered,
	gain,
	identification,
	levelSensor,
	makeHarness,
	makeObject,
	mute,
	namedSwitch,
	polarity,
	stringActuator,
	switchObject,
	type DefinitionShape,
	type PresetEntry,
	type PresetHarness,
	type RoleMap,
} from './helpers.js'

describe('preset structure', () => {
	let ctx: PresetHarness

	beforeEach(() => {
		ctx = makeHarness()
	})

	const define = async (roleMap: RoleMap): ReturnType<PresetHarness['define']> => ctx.define(roleMap)

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
			['GENERAL/PASSWORD', stringActuator(9)],
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
		const actions = ctx.setActionDefinitions.mock.lastCall?.[0] as unknown as Record<string, DefinitionShape>
		const feedbacks = ctx.setFeedbackDefinitions.mock.lastCall?.[0] as unknown as Record<string, DefinitionShape>
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
		const { structure, presets } = await define([['GENERAL/PASSWORD', stringActuator(1)]])

		expect(structure).toEqual([])
		expect(presets).toEqual({})
	})
})
