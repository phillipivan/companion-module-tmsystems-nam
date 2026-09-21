import { describe, it, expect, beforeEach } from 'vitest'
import {
	booleanActuator,
	identification,
	makeHarness,
	mute,
	polarity,
	type PresetHarness,
	type RoleMap,
} from './helpers.js'

describe('toggle presets', () => {
	let ctx: PresetHarness

	beforeEach(() => {
		ctx = makeHarness()
	})

	const define = async (roleMap: RoleMap): ReturnType<PresetHarness['define']> => ctx.define(roleMap)

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
})
