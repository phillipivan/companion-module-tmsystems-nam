import { describe, it, expect, beforeEach } from 'vitest'
import { STATUS_CLASSES } from '../../presets/status.js'
import { booleanSensor, makeHarness, type PresetHarness, type RoleMap } from './helpers.js'

describe('status presets', () => {
	let ctx: PresetHarness

	beforeEach(() => {
		ctx = makeHarness()
	})

	const define = async (roleMap: RoleMap): ReturnType<PresetHarness['define']> => ctx.define(roleMap)

	it('labels a boolean sensor with its object, and turns it amber while the reading is true', async () => {
		const { presets } = await define([['AMP/CH0/ERROC', booleanSensor(1)]])

		expect(presets['status_OcaBooleanSensor_AMP/CH0/ERROC']).toEqual({
			type: 'layered',
			name: 'Boolean Sensor - AMP/CH0/ERROC',
			elements: [
				{ type: 'box', id: 'background', name: 'Background', color: 0x000000 },
				{ type: 'text', id: 'label', name: 'Label', text: 'AMP/CH0/ERROC', fontsize: 22, color: 0xffffff },
			],
			// A sensor is read-only, so nothing on the button writes to the device
			steps: [{ down: [], up: [] }],
			feedbacks: [
				{
					feedbackId: 'internal:checkExpression',
					options: { expression: '$(local:reading) == true' },
					// Amber with black text, as a polarity toggle is when inverted
					styleOverrides: [
						{ elementId: 'background', elementProperty: 'color', override: { isExpression: false, value: 0xffbf00 } },
						{ elementId: 'label', elementProperty: 'color', override: { isExpression: false, value: 0x000000 } },
					],
				},
			],
			localVariables: [
				{
					variableType: 'feedback',
					variableName: 'reading',
					feedbackId: 'get_property_OcaBooleanSensor',
					options: { objectId: 'AMP/CH0/ERROC', property: 'Reading', sync: true },
				},
			],
		})
	})

	// Reading has a getter and no setter, so a section that required a writable property would be empty
	it('gives boolean sensors their own section, apart from the toggles, though their reading can only be read', async () => {
		const { structure } = await define([
			['AMP/CH0/ERROC', booleanSensor(1)],
			['AES/LOCK', booleanSensor(2)],
		])

		expect(structure).toEqual([
			{
				id: 'status',
				name: 'Status',
				definitions: [
					{
						id: 'status_OcaBooleanSensor',
						type: 'simple',
						name: 'Boolean Sensor',
						presets: ['status_OcaBooleanSensor_AMP/CH0/ERROC', 'status_OcaBooleanSensor_AES/LOCK'],
					},
				],
			},
		])
	})

	it('covers the boolean sensor class', () => {
		expect(STATUS_CLASSES.map((status) => status.className)).toEqual(['OcaBooleanSensor'])
	})
})
