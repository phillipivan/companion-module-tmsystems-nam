import {
	combineRgb,
	createModuleLogger,
	type CompanionLayeredButtonPresetDefinition,
	type CompanionPresetDefinitions,
	type CompanionPresetFeedbackStyleOverride,
	type CompanionPresetGroup,
	type CompanionPresetSection,
	type SomeButtonGraphicsElement,
	type SomePresetActionEntry,
} from '@companion-module/base'
import { OcaMuteState } from 'aes70/src/types/OcaMuteState.js'
import { OcaPolarityState } from 'aes70/src/types/OcaPolarityState.js'
import type ModuleInstance from './main.js'
import type { OcaModuleTypes } from './types.js'
import { OCA_CLASS_NAMES, type OcaClassName } from './consts/aes70-constants.js'
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

/** White `text` on black. */
function labelElements(text: string): SomeButtonGraphicsElement[] {
	return [
		{ type: 'box', id: BACKGROUND_ID, name: 'Background', color: combineRgb(0, 0, 0) },
		{
			type: 'text',
			id: LABEL_ID,
			name: 'Label',
			text,
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

/** The classes with rotary presets. Add a class here and to ROTARY_CLASSES to give it presets. */
export type RotaryClassName =
	| typeof OCA_CLASS_NAMES.OcaGain
	| typeof OCA_CLASS_NAMES.OcaPanBalance
	| typeof OCA_CLASS_NAMES.OcaDelay
	| typeof OCA_CLASS_NAMES.OcaFrequencyActuator
	| typeof OCA_CLASS_NAMES.OcaSwitch
	| typeof OCA_CLASS_NAMES.OcaInt8Actuator
	| typeof OCA_CLASS_NAMES.OcaInt16Actuator
	| typeof OCA_CLASS_NAMES.OcaInt32Actuator
	| typeof OCA_CLASS_NAMES.OcaUint8Actuator
	| typeof OCA_CLASS_NAMES.OcaUint16Actuator
	| typeof OCA_CLASS_NAMES.OcaUint32Actuator
	| typeof OCA_CLASS_NAMES.OcaFloat32Actuator
	| typeof OCA_CLASS_NAMES.OcaFloat64Actuator

/**
 * A class whose objects each get a dial that steps a number property down and up. The property's
 * getter must return its limits along with it, as `[value, min, max]`: the steps are clamped to them.
 */
export interface RotaryClass {
	readonly className: RotaryClassName
	/** The number property stepped. */
	readonly property: string
}

export const ROTARY_CLASSES: readonly RotaryClass[] = [
	{ className: OCA_CLASS_NAMES.OcaGain, property: 'Gain' },
	{ className: OCA_CLASS_NAMES.OcaPanBalance, property: 'Position' },
	{ className: OCA_CLASS_NAMES.OcaDelay, property: 'DelayTime' },
	{ className: OCA_CLASS_NAMES.OcaFrequencyActuator, property: 'Frequency' },
	{ className: OCA_CLASS_NAMES.OcaSwitch, property: 'Position' },
	{ className: OCA_CLASS_NAMES.OcaInt8Actuator, property: 'Setting' },
	{ className: OCA_CLASS_NAMES.OcaInt16Actuator, property: 'Setting' },
	{ className: OCA_CLASS_NAMES.OcaInt32Actuator, property: 'Setting' },
	{ className: OCA_CLASS_NAMES.OcaUint8Actuator, property: 'Setting' },
	{ className: OCA_CLASS_NAMES.OcaUint16Actuator, property: 'Setting' },
	{ className: OCA_CLASS_NAMES.OcaUint32Actuator, property: 'Setting' },
	{ className: OCA_CLASS_NAMES.OcaFloat32Actuator, property: 'Setting' },
	{ className: OCA_CLASS_NAMES.OcaFloat64Actuator, property: 'Setting' },
]

/** The `step_size` a rotary starts with. */
const ROTARY_STEP_SIZE = 1

/** What `step_size` is divided by while the dial is held, for fine control. */
const FINE_STEP_DIVISOR = 10

/**
 * A dial for the object at `rolePath` that subtracts `step_size` from the property on a left turn
 * and adds it on a right turn, within the property's limits. While the dial is held, a turn steps
 * by a tenth of `step_size`.
 *
 * Holding switches by the button's pressed state, `$(this:active)`, rather than by button steps: a
 * preset can't change step on press, since Companion only auto-progresses on release and presets
 * can't use its Set current step action.
 *
 * `value` holds the current value, from the property sync. `range` holds the getter's result, which
 * the Get Property feedback returns without sync as `{ values: [value, min, max] }`. The clamp also
 * keeps an integer from wrapping round: aes70 encodes -1 as a Uint16 as 65535. Until both are known,
 * a turn's value isn't a number, so Companion skips the action rather than sending anything.
 */
function rotaryPreset(rotary: RotaryClass, rolePath: string): CompanionLayeredButtonPresetDefinition<OcaModuleTypes> {
	const { className, property } = rotary
	const value = '$(local:value)'
	const step = `($(this:active) ? $(local:step_size) / ${FINE_STEP_DIVISOR} : $(local:step_size))`
	const limits = '$(local:range).values'
	const setTo = (expression: string): SomePresetActionEntry<OcaModuleTypes> => ({
		actionId: `set_property_${className}`,
		options: { objectId: rolePath, property, [`value_${property}`]: { isExpression: true, value: expression } },
	})
	const feedbackOptions = { objectId: rolePath, property }
	return {
		type: 'layered',
		name: `${ocaClassNameToLabel(className)} - ${rolePath}`,
		elements: labelElements(`${rolePath}\n (Rotary)`),
		steps: [
			{
				down: [],
				up: [],
				rotate_left: [setTo(`max(${limits}[1], ${value} - ${step})`)],
				rotate_right: [setTo(`min(${limits}[2], ${value} + ${step})`)],
			},
		],
		feedbacks: [],
		localVariables: [
			{ variableType: 'simple', variableName: 'step_size', startupValue: ROTARY_STEP_SIZE },
			{
				variableType: 'feedback',
				variableName: 'value',
				feedbackId: `get_property_${className}`,
				options: { ...feedbackOptions, sync: true },
			},
			{
				variableType: 'feedback',
				variableName: 'range',
				feedbackId: `get_property_${className}`,
				options: { ...feedbackOptions, sync: false },
			},
		],
	}
}

const logger = createModuleLogger('OCA Presets')

/**
 * One group of presets per class in `classes` that the device has, named after the class, with a
 * preset built by `build` for each of its objects. Each preset is added to `presets`.
 */
async function classGroups<T extends { readonly className: OcaClassName; readonly property: string }>(
	self: ModuleInstance,
	kind: string,
	classes: readonly T[],
	build: (entry: T, rolePath: string) => CompanionLayeredButtonPresetDefinition<OcaModuleTypes>,
	presets: CompanionPresetDefinitions<OcaModuleTypes>,
): Promise<CompanionPresetGroup<OcaModuleTypes>[]> {
	const groups: CompanionPresetGroup<OcaModuleTypes>[] = []
	for (const entry of classes) {
		const rolePaths = [...self.ocaHelper.getByClass(entry.className)]
		if (rolePaths.length === 0) continue
		// The Set Property action only offers the property when the device has shown it implements it
		const properties = await self.ocaHelper.getClassProperties(entry.className)
		if (!properties.some((prop) => prop.name === entry.property && prop.write)) {
			logger.debug(`Skipping ${entry.className} ${kind} presets, since its objects don't implement ${entry.property}`)
			continue
		}

		const ids = rolePaths.map((rolePath) => {
			const id = `${kind}_${entry.className}_${rolePath}`
			presets[id] = build(entry, rolePath)
			return id
		})
		groups.push({
			id: `${kind}_${entry.className}`,
			type: 'simple',
			name: ocaClassNameToLabel(entry.className),
			presets: ids,
		})
	}
	return groups
}

/**
 * Define presets for every object of the classes in `TOGGLE_CLASSES` and `ROTARY_CLASSES`, in a
 * section each, grouped by class. Call after the actions and feedbacks are defined, since the
 * presets use them.
 */
export async function UpdatePresets(self: ModuleInstance): Promise<void> {
	const presets: CompanionPresetDefinitions<OcaModuleTypes> = {}
	const sections: CompanionPresetSection<OcaModuleTypes>[] = [
		{
			id: 'toggles',
			name: 'Toggles',
			definitions: await classGroups(self, 'toggle', TOGGLE_CLASSES, togglePreset, presets),
		},
		{
			id: 'rotaries',
			name: 'Rotaries',
			definitions: await classGroups(self, 'rotary', ROTARY_CLASSES, rotaryPreset, presets),
		},
	]

	const presetCount = Object.keys(presets).length
	logger.info(`Completed preset definitions: ${presetCount} presets defined (${excitementEmoji(presetCount)})`)
	self.setPresetDefinitions(
		sections.filter((section) => section.definitions.length > 0),
		presets,
	)
}
