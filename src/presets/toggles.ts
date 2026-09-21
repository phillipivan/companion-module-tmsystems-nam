import {
	combineRgb,
	type CompanionLayeredButtonPresetDefinition,
	type CompanionPresetDefinitions,
	type CompanionPresetGroup,
} from '@companion-module/base'
import { OcaMuteState } from 'aes70/src/types/OcaMuteState.js'
import { OcaPolarityState } from 'aes70/src/types/OcaPolarityState.js'
import type ModuleInstance from '../main.js'
import type { OcaModuleTypes } from '../types.js'
import { OCA_CLASS_NAMES } from '../consts/aes70-constants.js'
import { ocaClassNameToLabel } from '../utils.js'
import { activeOverrides, classGroups, labelElements, type ActiveColors } from './consts.js'

/** The classes with toggle presets. Add a class here and to TOGGLE_CLASSES to give it presets. */
export type ToggleClassName =
	| typeof OCA_CLASS_NAMES.OcaMute
	| typeof OCA_CLASS_NAMES.OcaPolarity
	| typeof OCA_CLASS_NAMES.OcaBooleanActuator
	| typeof OCA_CLASS_NAMES.OcaIdentificationActuator

/** The two values a toggle moves between, and the one it highlights. */
interface ToggleValues<T extends number | boolean> {
	/**
	 * What a press sets, unless the property already has this value, when it sets `otherValue`.
	 * It is also what a press sets before the current value is known, so it should be the safer one.
	 */
	readonly safeValue: T
	readonly otherValue: T
	/** The value shown with `activeColors`. */
	readonly activeValue: T
}

/**
 * A class whose objects each get a button that toggles a property between two values, and
 * highlights one of them. The property is an enum, toggled by its numeric values, or a boolean.
 */
export type ToggleClass = {
	readonly className: ToggleClassName
	/** The property toggled. */
	readonly property: string
	/** The button's local variable, holding the property's current value from a Get Property feedback. */
	readonly variableName: string
	readonly activeColors: ActiveColors
} & (({ readonly kind: 'enum' } & ToggleValues<number>) | ({ readonly kind: 'boolean' } & ToggleValues<boolean>))

export const TOGGLE_CLASSES: readonly ToggleClass[] = [
	{
		className: OCA_CLASS_NAMES.OcaMute,
		property: 'State',
		variableName: 'mute',
		kind: 'enum',
		safeValue: OcaMuteState.Muted.valueOf(),
		otherValue: OcaMuteState.Unmuted.valueOf(),
		activeValue: OcaMuteState.Muted.valueOf(),
		activeColors: { background: combineRgb(255, 0, 0) },
	},
	{
		className: OCA_CLASS_NAMES.OcaPolarity,
		property: 'State',
		variableName: 'polarity',
		kind: 'enum',
		safeValue: OcaPolarityState.NonInverted.valueOf(),
		otherValue: OcaPolarityState.Inverted.valueOf(),
		activeValue: OcaPolarityState.Inverted.valueOf(),
		// White text is unreadable on amber
		activeColors: { background: combineRgb(255, 191, 0), text: combineRgb(0, 0, 0) },
	},
	{
		className: OCA_CLASS_NAMES.OcaBooleanActuator,
		property: 'Setting',
		variableName: 'setting',
		kind: 'boolean',
		safeValue: false,
		otherValue: true,
		activeValue: true,
		activeColors: { background: combineRgb(0, 153, 0) },
	},
	{
		className: OCA_CLASS_NAMES.OcaIdentificationActuator,
		property: 'Active',
		variableName: 'identify',
		kind: 'boolean',
		safeValue: false,
		otherValue: true,
		activeValue: true,
		activeColors: { background: combineRgb(0, 0, 255) },
	},
]

/** A button for the object at `rolePath`, labelled with its role path, that toggles the property and shows its state. */
function togglePreset(toggle: ToggleClass, rolePath: string): CompanionLayeredButtonPresetDefinition<OcaModuleTypes> {
	const { className, property, variableName, safeValue, otherValue } = toggle
	const current = `$(local:${variableName})`
	return {
		type: 'layered',
		name: `${ocaClassNameToLabel(className)} - ${rolePath}`,
		elements: labelElements(rolePath),
		steps: [
			{
				down: [
					{
						actionId: `set_property_${className}`,
						options: {
							objectId: rolePath,
							property,
							[`value_${property}`]: {
								isExpression: true,
								value: `${current} == ${safeValue} ? ${otherValue} : ${safeValue}`,
							},
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'internal:checkExpression',
				options: { expression: `${current} == ${toggle.activeValue}` },
				styleOverrides: activeOverrides(toggle.activeColors),
			},
		],
		localVariables: [
			{
				variableType: 'feedback',
				variableName,
				feedbackId: `get_property_${className}`,
				options: {
					objectId: rolePath,
					property,
					sync: true,
					// An enum's raw value, not its label, so the expressions compare numbers
					...(toggle.kind === 'enum' ? { [`enum_${property}`]: false } : {}),
				},
			},
		],
	}
}

/** One group per toggle class the device has, each holding a button for every object of it. */
export async function getToggleGroups(
	self: ModuleInstance,
	presets: CompanionPresetDefinitions<OcaModuleTypes>,
): Promise<CompanionPresetGroup<OcaModuleTypes>[]> {
	return classGroups(self, 'toggle', 'write', TOGGLE_CLASSES, togglePreset, presets)
}
