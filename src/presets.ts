import {
	combineRgb,
	createModuleLogger,
	type CompanionLayeredButtonPresetDefinition,
	type CompanionPresetDefinitions,
	type CompanionPresetFeedbackStyleOverride,
	type CompanionPresetGroup,
	type CompanionPresetSection,
	type SomeButtonGraphicsElement,
} from '@companion-module/base'
import { OcaMuteState } from 'aes70/src/types/OcaMuteState.js'
import { OcaPolarityState } from 'aes70/src/types/OcaPolarityState.js'
import type ModuleInstance from './main.js'
import type { OcaModuleTypes } from './types.js'
import { OCA_CLASS_NAMES } from './consts/aes70-constants.js'
import { excitementEmoji, ocaClassNameToLabel } from './utils.js'

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

/** The colours a toggle's button changes to while the property has its active value. */
export interface ActiveColors {
	readonly background: number
	/** The label's colour, when white won't do. */
	readonly text?: number
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

/** Ids of the button's elements, which the feedback's style overrides refer to. */
const BACKGROUND_ID = 'background'
const LABEL_ID = 'label'

/** In Companion's text element units, used as given. A simple preset's `size` is in older units and gets scaled. */
const LABEL_FONT_SIZE = 22

/** White text, the object's role path, on black. */
function toggleElements(rolePath: string): SomeButtonGraphicsElement[] {
	return [
		{ type: 'box', id: BACKGROUND_ID, name: 'Background', color: combineRgb(0, 0, 0) },
		{
			type: 'text',
			id: LABEL_ID,
			name: 'Label',
			text: rolePath,
			fontsize: LABEL_FONT_SIZE,
			color: combineRgb(255, 255, 255),
		},
	]
}

/** Overrides turning the button to `colors`. */
function activeOverrides(colors: ActiveColors): CompanionPresetFeedbackStyleOverride[] {
	const overrides = [{ elementId: BACKGROUND_ID, color: colors.background }]
	if (colors.text !== undefined) overrides.push({ elementId: LABEL_ID, color: colors.text })
	return overrides.map(({ elementId, color }) => ({
		elementId,
		elementProperty: 'color',
		// Wrapped, though the type allows a plain value: Companion 5.1 drops overrides that aren't
		override: { isExpression: false, value: color },
	}))
}

/** A button for the object at `rolePath`, labelled with its role path, that toggles the property and shows its state. */
function togglePreset(toggle: ToggleClass, rolePath: string): CompanionLayeredButtonPresetDefinition<OcaModuleTypes> {
	const { className, property, variableName, safeValue, otherValue } = toggle
	const current = `$(local:${variableName})`
	return {
		type: 'layered',
		name: `${ocaClassNameToLabel(className)} - ${rolePath}`,
		elements: toggleElements(rolePath),
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

/**
 * Define a toggle button preset for every object of each class in `TOGGLE_CLASSES`, grouped
 * by class. Call after the actions and feedbacks are defined, since the presets use them.
 */
export async function UpdatePresets(self: ModuleInstance): Promise<void> {
	const logger = createModuleLogger('OCA Presets')
	const presets: CompanionPresetDefinitions<OcaModuleTypes> = {}
	const groups: CompanionPresetGroup<OcaModuleTypes>[] = []

	for (const toggle of TOGGLE_CLASSES) {
		const rolePaths = [...self.ocaHelper.getByClass(toggle.className)]
		if (rolePaths.length === 0) continue
		// The Set Property action only offers the property when the device has shown it implements it
		const properties = await self.ocaHelper.getClassProperties(toggle.className)
		if (!properties.some((prop) => prop.name === toggle.property && prop.write)) {
			logger.debug(`Skipping ${toggle.className} presets, since its objects don't implement ${toggle.property}`)
			continue
		}

		const ids = rolePaths.map((rolePath) => {
			const id = `toggle_${toggle.className}_${rolePath}`
			presets[id] = togglePreset(toggle, rolePath)
			return id
		})
		groups.push({
			id: `toggle_${toggle.className}`,
			type: 'simple',
			name: ocaClassNameToLabel(toggle.className),
			presets: ids,
		})
	}

	const structure: CompanionPresetSection<OcaModuleTypes>[] =
		groups.length > 0 ? [{ id: 'toggles', name: 'Toggles', definitions: groups }] : []

	const presetCount = Object.keys(presets).length
	logger.info(`Completed preset definitions: ${presetCount} presets defined (${excitementEmoji(presetCount)})`)
	self.setPresetDefinitions(structure, presets)
}
