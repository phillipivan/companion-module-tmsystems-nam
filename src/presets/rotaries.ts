import type {
	CompanionLayeredButtonPresetDefinition,
	CompanionPresetDefinitions,
	CompanionPresetGroup,
	SomePresetActionEntry,
} from '@companion-module/base'
import type ModuleInstance from '../main.js'
import type { PropertyDescription } from '../OcaHelper.js'
import type { OcaModuleTypes } from '../types.js'
import { OCA_CLASS_NAMES } from '../consts/aes70-constants.js'
import { ocaClassNameToLabel } from '../utils.js'
import {
	classGroups,
	dialElement,
	dialScale,
	DEFAULT_STEPS,
	DIAL_COLORS,
	INTEGER_STEPS,
	KILOHERTZ,
	OCTAVE_STEPS,
	labelElements,
	numberWithUnit,
	stepVariables,
	steppedValue,
	templateText,
	VALUE_DECIMAL_PLACES,
	type DialKind,
	type StepMode,
	type UnitStep,
} from './consts.js'
import type { DialScheme } from '../composites.js'

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
	/** Linear unless it says otherwise; a frequency steps by a fraction of an octave. */
	readonly stepMode?: StepMode
	/** The step a dial starts with, or for an octave dial the divisions of an octave. */
	readonly stepSize: number
	/** An octave dial's divisions while held; a linear one divides its step by FINE_STEP_DIVISOR. */
	readonly fineStepSize?: number
	/** Whether holding the dial takes a smaller step. */
	readonly fine: boolean
	/**
	 * A string list property naming each value, from 0, shown on the button in place of the value
	 * when the device has it. It also caps the value at the last name: the NAM reports a switch's
	 * max as its number of positions, one past the last.
	 */
	readonly names?: string
	/**
	 * The dial arc drawn behind the button's text, showing where the value sits in its range: `value`
	 * fills up from the minimum, `pan` fills out from the midpoint either way. Left out for no arc.
	 */
	readonly dial?: DialKind
	/** The dial arc's colour, where the property has a conventional one. Otherwise it is drawn plain. */
	readonly dialColor?: number
	/** A centred dial's colour below zero, where it should differ from the one above. */
	readonly dialColorBelow?: number
	/** A centred dial's colour at zero, which the arc blends from out to each end. */
	readonly dialColorZero?: number
	/** A value dial's colour scheme. The spectrum ignores `dialColor`. */
	readonly dialScheme?: DialScheme
	/** A larger unit the label switches to once the value is big enough, such as Hz to kHz. */
	readonly unitStep?: UnitStep
	/** Decimal places on the label, where the property wants fewer than VALUE_DECIMAL_PLACES. */
	readonly decimalPlaces?: number
	/**
	 * The unit shown after the value on the button, where the class has one its objects always report in.
	 * Left out where the value is bare, such as a switch position, or where the device chooses the unit.
	 */
	readonly unit?: string
}

/** Every rotary shows a dial; only a few have a colour their property is conventionally drawn in. */
const VALUE_DIAL = { dial: 'value' } as const

export const ROTARY_CLASSES: readonly RotaryClass[] = [
	{
		className: OCA_CLASS_NAMES.OcaGain,
		property: 'Gain',
		...DEFAULT_STEPS,
		// Cut and boost either side of unity, like a filter's InBandGain, so the arc reads against 0 dB
		dial: 'centred',
		dialColor: DIAL_COLORS.gain,
		dialColorBelow: DIAL_COLORS.cut,
		dialColorZero: DIAL_COLORS.unity,
		unit: 'dB',
		// A tenth of a dB is as fine as a gain is ever read
		decimalPlaces: 1,
	},
	{
		className: OCA_CLASS_NAMES.OcaPanBalance,
		property: 'Position',
		...DEFAULT_STEPS,
		dial: 'centred',
		dialColor: DIAL_COLORS.pan,
	},
	{ className: OCA_CLASS_NAMES.OcaDelay, property: 'DelayTime', ...DEFAULT_STEPS, ...VALUE_DIAL },
	// Its own DelayValue is a value and unit, which actions can't set; DelayTime is inherited from OcaDelay
	{ className: OCA_CLASS_NAMES.OcaDelayExtended, property: 'DelayTime', ...DEFAULT_STEPS, ...VALUE_DIAL },
	// A frequency steps by a fraction of an octave rather than a fixed number of hertz
	{
		className: OCA_CLASS_NAMES.OcaFrequencyActuator,
		property: 'Frequency',
		...OCTAVE_STEPS,
		...VALUE_DIAL,
		// Red low to violet high, like the spectrum a frequency is named for
		dialScheme: 'spectrum',
		dialColor: DIAL_COLORS.frequency,
		unit: 'Hz',
		unitStep: KILOHERTZ,
	},
	// Positions are whole numbers, one step apart
	{
		className: OCA_CLASS_NAMES.OcaSwitch,
		property: 'Position',
		stepSize: 1,
		fine: false,
		names: 'PositionNames',
		...VALUE_DIAL,
	},
	{ className: OCA_CLASS_NAMES.OcaInt8Actuator, property: 'Setting', ...INTEGER_STEPS, ...VALUE_DIAL },
	{ className: OCA_CLASS_NAMES.OcaInt16Actuator, property: 'Setting', ...INTEGER_STEPS, ...VALUE_DIAL },
	{ className: OCA_CLASS_NAMES.OcaInt32Actuator, property: 'Setting', ...INTEGER_STEPS, ...VALUE_DIAL },
	{ className: OCA_CLASS_NAMES.OcaUint8Actuator, property: 'Setting', ...INTEGER_STEPS, ...VALUE_DIAL },
	{ className: OCA_CLASS_NAMES.OcaUint16Actuator, property: 'Setting', ...INTEGER_STEPS, ...VALUE_DIAL },
	{ className: OCA_CLASS_NAMES.OcaUint32Actuator, property: 'Setting', ...INTEGER_STEPS, ...VALUE_DIAL },
	{ className: OCA_CLASS_NAMES.OcaFloat32Actuator, property: 'Setting', ...DEFAULT_STEPS, ...VALUE_DIAL },
	{ className: OCA_CLASS_NAMES.OcaFloat64Actuator, property: 'Setting', ...DEFAULT_STEPS, ...VALUE_DIAL },
]

/**
 * An expression for a rotary's label: the object's role path, `(Rotary)`, then `value` once it is
 * known. Companion's renderer turns the two characters `\n` into a line break, which is how a
 * raw template literal gets one.
 */
function rotaryLabel(
	rolePath: string,
	value: string,
	names?: string,
	unit?: string,
	step?: UnitStep,
	places = VALUE_DECIMAL_PLACES,
): string {
	const number = numberWithUnit(value, places, unit, step)
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
	// The last name's index, while the names are a non-empty array, since the NAM reports a switch's max
	// as its number of positions, one past the last. The dial uses it too, so its arc is full at the last
	// position rather than stopping short of the end.
	const cappedMax = names ? `(arrayIncludes(${names}, ${names}[0]) ? length(${names}) - 1 : ${max})` : max
	const setTo = (expression: string): SomePresetActionEntry<OcaModuleTypes> => ({
		actionId: `set_property_${className}`,
		options: { objectId: rolePath, property, [`value_${property}`]: { isExpression: true, value: expression } },
	})
	const elements = labelElements({
		isExpression: true,
		value: rotaryLabel(rolePath, value, names, rotary.unit, rotary.unitStep, rotary.decimalPlaces),
	})
	// Between the background and the label, so the arc is drawn behind the text
	if (rotary.dial) {
		elements.splice(
			1,
			0,
			dialElement(
				rotary.dial,
				rotary.dialColor ?? DIAL_COLORS.plain,
				dialScale(rotary, value),
				dialScale(rotary, min),
				dialScale(rotary, cappedMax),
				rotary.dialColorBelow,
				rotary.dialColorZero,
				rotary.dialScheme,
			),
		)
	}
	return {
		type: 'layered',
		name: `${ocaClassNameToLabel(className)} - ${rolePath}`,
		elements,
		steps: [
			{
				down: [],
				up: [],
				rotate_left: [setTo(`max(${min}, ${steppedValue(rotary, value, 'down')})`)],
				// Both limits where there are names, so a device reporting more names than positions still clamps
				rotate_right: [setTo(`min(${names ? `${max}, ${cappedMax}` : max}, ${steppedValue(rotary, value, 'up')})`)],
			},
		],
		feedbacks: [],
		localVariables: [
			...stepVariables(rotary),
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

/** One group per rotary class the device has, each holding a dial for every object of it. */
export async function getRotaryGroups(
	self: ModuleInstance,
	presets: CompanionPresetDefinitions<OcaModuleTypes>,
): Promise<CompanionPresetGroup<OcaModuleTypes>[]> {
	return classGroups(self, 'rotary', 'write', ROTARY_CLASSES, rotaryPreset, presets)
}
