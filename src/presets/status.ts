import {
	combineRgb,
	type CompanionLayeredButtonPresetDefinition,
	type CompanionPresetDefinitions,
	type CompanionPresetGroup,
} from '@companion-module/base'
import type ModuleInstance from '../main.js'
import type { OcaModuleTypes } from '../types.js'
import { OCA_CLASS_NAMES } from '../consts/aes70-constants.js'
import { ocaClassNameToLabel } from '../utils.js'
import { activeOverrides, classGroups, labelElements, type ActiveColors } from './consts.js'

/** The classes with status presets. Add a class here and to STATUS_CLASSES to give it presets. */
export type StatusClassName = typeof OCA_CLASS_NAMES.OcaBooleanSensor

/** A class whose objects each get a button that lights while a boolean reading is true. */
export interface StatusClass {
	readonly className: StatusClassName
	/** The boolean property shown. */
	readonly property: string
	readonly activeColors: ActiveColors
}

export const STATUS_CLASSES: readonly StatusClass[] = [
	// Amber rather than a toggle's green: a generic sensor's true can be good or bad news. On the NAM, 20 of
	// its 41 are fault flags (AMP/CH0/ERROC and the like), which green would show as all well
	{
		className: OCA_CLASS_NAMES.OcaBooleanSensor,
		property: 'Reading',
		// White text is unreadable on amber
		activeColors: { background: combineRgb(255, 191, 0), text: combineRgb(0, 0, 0) },
	},
]

/** The button's local variable, holding the reading from a Get Property feedback. */
const STATUS_VARIABLE = 'reading'

/**
 * A button for the object at `rolePath`, labelled with its role path, that lights while the reading is
 * true. A sensor is read-only, so the button has no actions. Until the reading is known it stays unlit.
 */
function statusPreset(status: StatusClass, rolePath: string): CompanionLayeredButtonPresetDefinition<OcaModuleTypes> {
	const { className, property } = status
	return {
		type: 'layered',
		name: `${ocaClassNameToLabel(className)} - ${rolePath}`,
		elements: labelElements(rolePath),
		steps: [{ down: [], up: [] }],
		feedbacks: [
			{
				feedbackId: 'internal:checkExpression',
				options: { expression: `$(local:${STATUS_VARIABLE}) == true` },
				styleOverrides: activeOverrides(status.activeColors),
			},
		],
		localVariables: [
			{
				variableType: 'feedback',
				variableName: STATUS_VARIABLE,
				feedbackId: `get_property_${className}`,
				options: { objectId: rolePath, property, sync: true },
			},
		],
	}
}

/** One group per status class the device has, each holding a button for every object of it. */
export async function getStatusGroups(
	self: ModuleInstance,
	presets: CompanionPresetDefinitions<OcaModuleTypes>,
): Promise<CompanionPresetGroup<OcaModuleTypes>[]> {
	return classGroups(self, 'status', 'read', STATUS_CLASSES, statusPreset, presets)
}
