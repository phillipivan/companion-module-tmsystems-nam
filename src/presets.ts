import {
	combineRgb,
	createModuleLogger,
	type CompanionGraphicsElementValue,
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
import type { PropertyDescription } from './OcaHelper.js'
import type { OcaModuleTypes } from './types.js'
import { OCA_CLASS_NAMES, type OcaClassName } from './consts/aes70-constants.js'
import { excitementEmoji, ocaClassNameToLabel } from './utils.js'
import { CompositeElementId, type CompositeElementSchema, METER_PADDING, METER_THICKNESS } from './composites.js'

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
const METER_ID = 'meter'

/** In Companion's text element units, used as given. A simple preset's `size` is in older units and gets scaled. */
const LABEL_FONT_SIZE = 22

/**
 * White `text` on black. The text fills the button unless `textHeight` is given, which keeps it clear of
 * whatever is below, such as a meter along the bottom edge.
 */
function labelElements(
	text: CompanionGraphicsElementValue<string>,
	textHeight?: number,
): SomeButtonGraphicsElement<CompositeElementSchema>[] {
	return [
		{ type: 'box', id: BACKGROUND_ID, name: 'Background', color: combineRgb(0, 0, 0) },
		{
			type: 'text',
			id: LABEL_ID,
			name: 'Label',
			text,
			...(textHeight === undefined ? {} : { height: textHeight }),
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
	| typeof OCA_CLASS_NAMES.OcaDelayExtended
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
	/** The `step_size` a dial starts with. */
	readonly stepSize: number
	/** Whether holding the dial divides the step by FINE_STEP_DIVISOR. */
	readonly fine: boolean
	/**
	 * A string list property naming each value, from 0, shown on the button in place of the value
	 * when the device has it. It also caps the value at the last name: the NAM reports a switch's
	 * max as its number of positions, one past the last.
	 */
	readonly names?: string
}

/** What `step_size` is divided by while the dial is held, for fine control. */
const FINE_STEP_DIVISOR = 10

/** A step of 1, or a tenth of that while held. */
const DEFAULT_STEPS = { stepSize: 1, fine: true } as const

/**
 * A step of 10, so the fine step is still a whole number. A fractional step would be truncated when
 * aes70 encodes the integer, so a step_size that isn't a multiple of 10 makes fine mode uneven.
 */
const INTEGER_STEPS = { stepSize: FINE_STEP_DIVISOR, fine: true } as const

export const ROTARY_CLASSES: readonly RotaryClass[] = [
	{ className: OCA_CLASS_NAMES.OcaGain, property: 'Gain', ...DEFAULT_STEPS },
	{ className: OCA_CLASS_NAMES.OcaPanBalance, property: 'Position', ...DEFAULT_STEPS },
	{ className: OCA_CLASS_NAMES.OcaDelay, property: 'DelayTime', ...DEFAULT_STEPS },
	// Its own DelayValue is a value and unit, which actions can't set; DelayTime is inherited from OcaDelay
	{ className: OCA_CLASS_NAMES.OcaDelayExtended, property: 'DelayTime', ...DEFAULT_STEPS },
	{ className: OCA_CLASS_NAMES.OcaFrequencyActuator, property: 'Frequency', ...INTEGER_STEPS },
	// Positions are whole numbers, one step apart
	{ className: OCA_CLASS_NAMES.OcaSwitch, property: 'Position', stepSize: 1, fine: false, names: 'PositionNames' },
	{ className: OCA_CLASS_NAMES.OcaInt8Actuator, property: 'Setting', ...INTEGER_STEPS },
	{ className: OCA_CLASS_NAMES.OcaInt16Actuator, property: 'Setting', ...INTEGER_STEPS },
	{ className: OCA_CLASS_NAMES.OcaInt32Actuator, property: 'Setting', ...INTEGER_STEPS },
	{ className: OCA_CLASS_NAMES.OcaUint8Actuator, property: 'Setting', ...INTEGER_STEPS },
	{ className: OCA_CLASS_NAMES.OcaUint16Actuator, property: 'Setting', ...INTEGER_STEPS },
	{ className: OCA_CLASS_NAMES.OcaUint32Actuator, property: 'Setting', ...INTEGER_STEPS },
	{ className: OCA_CLASS_NAMES.OcaFloat32Actuator, property: 'Setting', ...DEFAULT_STEPS },
	{ className: OCA_CLASS_NAMES.OcaFloat64Actuator, property: 'Setting', ...DEFAULT_STEPS },
]

/** A rotary's label shows its value to at most this many decimal places, hiding float32 noise such as -2.4000000953674316. */
const VALUE_DECIMAL_PLACES = 3

/**
 * `text` as literal text in an expression's template literal. Companion reads template text raw,
 * without escapes, so text holding a character that would end or interpolate it goes in as a
 * quoted string instead.
 */
function templateText(text: string): string {
	return /[`$\\]/.test(text) ? '${' + JSON.stringify(text) + '}' : text
}

/** An expression rounding `value` to `places` decimal places. Callers guard it with `isNumber`. */
function rounded(value: string, places: number): string {
	const scale = 10 ** places
	return `round(${value} * ${scale}) / ${scale}`
}

/**
 * An expression for a rotary's label: the object's role path, `(Rotary)`, then `value` once it is
 * known. Companion's renderer turns the two characters `\n` into a line break, which is how a
 * raw template literal gets one.
 */
function rotaryLabel(rolePath: string, value: string, names?: string): string {
	const number = `isNumber(${value}) ? ${rounded(value, VALUE_DECIMAL_PLACES)} : ''`
	// Only an array holding that name: a variable not known yet can read as the string $NA, which indexing picks apart
	const shown = names ? `arrayIncludes(${names}, ${names}[${value}]) ? ${names}[${value}] : ${number}` : number
	return '`' + templateText(rolePath) + '\\n (Rotary)\\n${' + shown + '}`'
}

/**
 * A dial for the object at `rolePath` that subtracts `step_size` from the property on a left turn
 * and adds it on a right turn, within the property's limits. For a class with fine mode, a turn
 * while the dial is held steps by a tenth of `step_size`.
 *
 * Holding switches by the button's pressed state, `$(this:active)`, rather than by button steps: a
 * preset can't change step on press, since Companion only auto-progresses on release and presets
 * can't use its Set current step action.
 *
 * `range` holds the getter's result, which the Get Property feedback returns without sync as
 * `{ values: [value, min, max] }`: every class in ROTARY_CLASSES has a getter returning its limits
 * after the value. Value and limits come from the same read, rechecked whenever the property changes.
 * The clamp also keeps an integer from wrapping round: aes70 encodes -1 as a Uint16 as 65535. Until
 * the read arrives, a turn's value isn't a number, so Companion skips the action rather than sending anything.
 */
function rotaryPreset(
	rotary: RotaryClass,
	rolePath: string,
	properties: readonly PropertyDescription[],
): CompanionLayeredButtonPresetDefinition<OcaModuleTypes> {
	const { className, property } = rotary
	const [value, min, max] = [0, 1, 2].map((index) => `$(local:range).values[${index}]`)
	// Only when the device has shown it implements the names, so their feedback doesn't fail on every check
	const namesProperty = properties.some((prop) => prop.name === rotary.names && prop.read) ? rotary.names : undefined
	const names = namesProperty ? '$(local:names)' : undefined
	// The last name's index, while the names are a non-empty array
	const lastNamed = names ? `arrayIncludes(${names}, ${names}[0]) ? length(${names}) - 1 : ${max}, ` : ''
	const step = rotary.fine
		? `($(this:active) ? $(local:step_size) / ${FINE_STEP_DIVISOR} : $(local:step_size))`
		: '$(local:step_size)'
	const setTo = (expression: string): SomePresetActionEntry<OcaModuleTypes> => ({
		actionId: `set_property_${className}`,
		options: { objectId: rolePath, property, [`value_${property}`]: { isExpression: true, value: expression } },
	})
	return {
		type: 'layered',
		name: `${ocaClassNameToLabel(className)} - ${rolePath}`,
		elements: labelElements({ isExpression: true, value: rotaryLabel(rolePath, value, names) }),
		steps: [
			{
				down: [],
				up: [],
				rotate_left: [setTo(`max(${min}, ${value} - ${step})`)],
				rotate_right: [setTo(`min(${max}, ${lastNamed}${value} + ${step})`)],
			},
		],
		feedbacks: [],
		localVariables: [
			{ variableType: 'simple', variableName: 'step_size', startupValue: rotary.stepSize },
			{
				variableType: 'feedback',
				variableName: 'range',
				feedbackId: `get_property_${className}`,
				options: { objectId: rolePath, property, sync: false },
			},
			...(namesProperty
				? [
						{
							variableType: 'feedback' as const,
							variableName: 'names',
							feedbackId: `get_property_${className}` as const,
							options: { objectId: rolePath, property: namesProperty, sync: true },
						},
					]
				: []),
		],
	}
}

/** The classes with meter presets. Add a class here and to METER_CLASSES to give it presets. */
export type MeterClassName = typeof OCA_CLASS_NAMES.OcaLevelSensor | typeof OCA_CLASS_NAMES.OcaAudioLevelSensor

/** A class whose objects each get a button showing a reading, as a number and as a bar. */
export interface MeterClass {
	readonly className: MeterClassName
	/** The number property read. */
	readonly property: string
}

export const METER_CLASSES: readonly MeterClass[] = [
	{ className: OCA_CLASS_NAMES.OcaLevelSensor, property: 'Reading' },
	// Reading is inherited from OcaLevelSensor. Its own Law is which averaging algorithm produced the
	// reading, not a level, so it isn't what the meter shows
	{ className: OCA_CLASS_NAMES.OcaAudioLevelSensor, property: 'Reading' },
]

/**
 * A meter's reading is live and changes constantly, so it is shown to fewer places than a value the user
 * set: at VALUE_DECIMAL_PLACES the last digits would be unreadable noise.
 */
const METER_DECIMAL_PLACES = 1

/** The button's local variable, holding the getter's reading and limits together. */
const METER_LEVEL_VARIABLE = 'level'

/**
 * An expression for a meter's label: the object's role path, then its reading in dB below, once it is known.
 * The unit hangs off the reading in a nested template literal, since Companion's `+` adds numbers rather
 * than joining strings, and a reading that hasn't arrived leaves the line empty rather than reading "$NA dB".
 */
function meterLabel(rolePath: string, value: string): string {
	const reading = '`${' + rounded(value, METER_DECIMAL_PLACES) + '} dB`'
	return '`' + templateText(rolePath) + '\\n${isNumber(' + value + ') ? ' + reading + " : ''}`"
}

/**
 * A button for the object at `rolePath` showing its reading as a number and as a bar along the bottom edge.
 * Nothing here writes to the device, so the button has no actions.
 *
 * The bar runs between the sensor's own limits, which the getter returns alongside the reading, so all
 * three come from one read and the colour stops follow whatever range the device reports. Until that read
 * arrives none of them is a number, and the bar has nothing to draw.
 */
function meterPreset(meter: MeterClass, rolePath: string): CompanionLayeredButtonPresetDefinition<OcaModuleTypes> {
	const { className, property } = meter
	// Without sync the getter's result arrives whole, as { values: [reading, min, max] }
	const [level, min, max] = [0, 1, 2].map((index) => `$(local:${METER_LEVEL_VARIABLE}).values[${index}]`)
	return {
		type: 'layered',
		name: `${ocaClassNameToLabel(className)} - ${rolePath}`,
		elements: [
			// The label stops above the bar, so a long role path never runs under it
			...labelElements(
				{ isExpression: true, value: meterLabel(rolePath, level) },
				100 - METER_PADDING - METER_THICKNESS,
			),
			{
				type: 'composite',
				id: METER_ID,
				name: 'Signal Meter',
				elementId: CompositeElementId.Meter,
				options: {
					level: { isExpression: true, value: level },
					min: { isExpression: true, value: min },
					max: { isExpression: true, value: max },
					position: 'bottom',
					padding: METER_PADDING,
				},
			},
		],
		steps: [{ down: [], up: [] }],
		feedbacks: [],
		localVariables: [
			{
				variableType: 'feedback',
				variableName: METER_LEVEL_VARIABLE,
				feedbackId: `get_property_${className}`,
				options: { objectId: rolePath, property, sync: false },
			},
		],
	}
}

const logger = createModuleLogger('OCA Presets')

/**
 * One group of presets per class in `classes` that the device has, named after the class, with a
 * preset built by `build` for each of its objects. Each preset is added to `presets`.
 *
 * `access` is what the presets do with the property: a button that sets one needs a class whose objects
 * accept writes, while a meter only reads.
 */
async function classGroups<T extends { readonly className: OcaClassName; readonly property: string }>(
	self: ModuleInstance,
	kind: string,
	access: 'read' | 'write',
	classes: readonly T[],
	build: (
		entry: T,
		rolePath: string,
		properties: readonly PropertyDescription[],
	) => CompanionLayeredButtonPresetDefinition<OcaModuleTypes>,
	presets: CompanionPresetDefinitions<OcaModuleTypes>,
): Promise<CompanionPresetGroup<OcaModuleTypes>[]> {
	const groups: CompanionPresetGroup<OcaModuleTypes>[] = []
	for (const entry of classes) {
		const rolePaths = [...self.ocaHelper.getByClass(entry.className)]
		if (rolePaths.length === 0) continue
		// The action and feedback definitions only offer the property when the device has shown it implements it
		const properties = await self.ocaHelper.getClassProperties(entry.className)
		if (!properties.some((prop) => prop.name === entry.property && prop[access])) {
			logger.debug(
				`Skipping ${entry.className} ${kind} presets, since its objects don't implement ${entry.property} for ${access}`,
			)
			continue
		}

		const ids = rolePaths.map((rolePath) => {
			const id = `${kind}_${entry.className}_${rolePath}`
			presets[id] = build(entry, rolePath, properties)
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
 * Define presets for every object of the classes in `TOGGLE_CLASSES`, `ROTARY_CLASSES` and
 * `METER_CLASSES`, in a section each, grouped by class. Call after the actions and feedbacks are
 * defined, since the presets use them.
 */
export async function UpdatePresets(self: ModuleInstance): Promise<void> {
	const presets: CompanionPresetDefinitions<OcaModuleTypes> = {}
	const sections: CompanionPresetSection<OcaModuleTypes>[] = [
		{
			id: 'toggles',
			name: 'Toggles',
			definitions: await classGroups(self, 'toggle', 'write', TOGGLE_CLASSES, togglePreset, presets),
		},
		{
			id: 'rotaries',
			name: 'Rotaries',
			definitions: await classGroups(self, 'rotary', 'write', ROTARY_CLASSES, rotaryPreset, presets),
		},
		{
			id: 'meters',
			name: 'Meters',
			definitions: await classGroups(self, 'meter', 'read', METER_CLASSES, meterPreset, presets),
		},
	]

	const presetCount = Object.keys(presets).length
	logger.info(`Completed preset definitions: ${presetCount} presets defined (${excitementEmoji(presetCount)})`)
	self.setPresetDefinitions(
		sections.filter((section) => section.definitions.length > 0),
		presets,
	)
}
