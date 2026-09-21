import {
	combineRgb,
	type CompanionLayeredButtonPresetDefinition,
	type CompanionPresetDefinitions,
	type CompanionPresetGroup,
	type SomePresetActionEntry,
} from '@companion-module/base'
import type ModuleInstance from '../main.js'
import type { OcaModuleTypes } from '../types.js'
import { OCA_CLASS_NAMES } from '../consts/aes70-constants.js'
import { ocaClassNameToLabel } from '../utils.js'
import type { EnumValues } from '../enums.js'
import {
	activeOverrides,
	dialElement,
	dialScale,
	DEFAULT_STEPS,
	DIAL_COLORS,
	OCTAVE_STEPS,
	labelElements,
	logger,
	numberWithUnit,
	stepVariables,
	steppedValue,
	templateText,
	VALUE_DECIMAL_PLACES,
	type ActiveColors,
	type DialKind,
	type StepMode,
} from './consts.js'

/** The filter classes with a preset group each. The curve classes are left out: FIR, polynomial and
 * arbitrary-curve filters are described by coefficient lists rather than the handful of settable
 * numbers a button can step. */
export type EqClassName = typeof OCA_CLASS_NAMES.OcaFilterClassical | typeof OCA_CLASS_NAMES.OcaFilterParametric

/**
 * One of a filter's properties, and the button it gets. A `dial` steps a number and draws its arc, an
 * `enum` steps between a property's named values and shows the name, and a `toggle` flips a boolean.
 */
export type EqProperty =
	| { readonly property: string; readonly kind: 'toggle'; readonly activeColors: ActiveColors }
	| { readonly property: string; readonly kind: 'enum' }
	| {
			readonly property: string
			readonly kind: 'dial'
			readonly dial: DialKind
			/** Linear unless it says otherwise; a frequency steps by a fraction of an octave. */
			readonly stepMode?: StepMode
			/** The step it starts with, or for an octave dial the divisions of an octave. */
			readonly stepSize: number
			/** An octave dial's divisions while held; a linear one divides its step by FINE_STEP_DIVISOR. */
			readonly fineStepSize?: number
			readonly fine: boolean
			readonly unit?: string
			/** The arc's colour, where the property has a conventional one. Otherwise it is drawn plain. */
			readonly color?: number
			/** A centred dial's colour below zero, where it should differ from the one above. */
			readonly colorBelow?: number
	  }

export interface EqClass {
	readonly className: EqClassName
	readonly properties: readonly EqProperty[]
}

/** Enabled turns green when the filter is in circuit, like the other boolean toggles. */
const EQ_ENABLED = {
	property: 'Enabled',
	kind: 'toggle',
	activeColors: { background: combineRgb(0, 153, 0) },
} as const satisfies EqProperty

export const EQ_CLASSES: readonly EqClass[] = [
	{
		className: OCA_CLASS_NAMES.OcaFilterClassical,
		properties: [
			EQ_ENABLED,
			{
				property: 'Frequency',
				kind: 'dial',
				dial: 'value',
				unit: 'Hz',
				color: DIAL_COLORS.frequency,
				...OCTAVE_STEPS,
			},
			{ property: 'Passband', kind: 'enum' },
			{ property: 'Shape', kind: 'enum' },
			// Filter orders are small whole numbers, so a step of 10 would jump past every one of them
			{ property: 'Order', kind: 'dial', dial: 'value', stepSize: 1, fine: false },
			{ property: 'Parameter', kind: 'dial', dial: 'centred', ...DEFAULT_STEPS },
		],
	},
	{
		className: OCA_CLASS_NAMES.OcaFilterParametric,
		properties: [
			EQ_ENABLED,
			{
				property: 'Frequency',
				kind: 'dial',
				dial: 'value',
				unit: 'Hz',
				color: DIAL_COLORS.frequency,
				...OCTAVE_STEPS,
			},
			{ property: 'Shape', kind: 'enum' },
			// Narrowest at the minimum, opening out symmetrically as it widens. A quarter per detent,
			// since a whole one covers most of a filter's usable width range in a few turns
			{
				property: 'WidthParameter',
				kind: 'dial',
				dial: 'width',
				color: DIAL_COLORS.width,
				stepSize: 0.25,
				fine: true,
			},
			// A gain, so it gets the same green as the Gain rotaries rather than the plain grey, and the
			// same grey below unity so a cut reads differently from a boost
			{
				property: 'InBandGain',
				kind: 'dial',
				dial: 'centred',
				unit: 'dB',
				color: DIAL_COLORS.gain,
				colorBelow: DIAL_COLORS.cut,
				...DEFAULT_STEPS,
			},
			{ property: 'ShapeParameter', kind: 'dial', dial: 'value', ...DEFAULT_STEPS },
		],
	},
]

/** The button's local variables: the property's value, and an enum's name for it. */
const EQ_VALUE_VARIABLE = 'value'
const EQ_LABEL_VARIABLE = 'label'

/**
 * An expression for a filter button's label: the object, the property, then its value once known.
 * One button covers one property, so the object is repeated on each rather than left to the group name,
 * which is lost as soon as the button is on a page.
 */
function eqLabel(rolePath: string, property: string, value?: string): string {
	const lines = '`' + templateText(rolePath) + '\\n' + templateText(ocaClassNameToLabel(property))
	return value === undefined ? lines + '`' : lines + '\\n${' + value + '}`'
}

/** Sets `property` on the object at `rolePath` to whatever `expression` works out to. */
function eqSetTo(
	className: EqClassName,
	rolePath: string,
	property: string,
	expression: string,
): SomePresetActionEntry<OcaModuleTypes> {
	return {
		actionId: `set_property_${className}`,
		options: { objectId: rolePath, property, [`value_${property}`]: { isExpression: true, value: expression } },
	}
}

/** A button that flips a filter's boolean property, colouring itself while it is on. */
function eqTogglePreset(
	className: EqClassName,
	rolePath: string,
	entry: Extract<EqProperty, { kind: 'toggle' }>,
): CompanionLayeredButtonPresetDefinition<OcaModuleTypes> {
	const { property } = entry
	const current = `$(local:${EQ_VALUE_VARIABLE})`
	return {
		type: 'layered',
		name: `${rolePath} - ${ocaClassNameToLabel(property)}`,
		elements: labelElements({ isExpression: true, value: eqLabel(rolePath, property) }),
		// Before the state is known a press turns the filter off, the safer way round
		steps: [{ down: [eqSetTo(className, rolePath, property, `${current} == false ? true : false`)], up: [] }],
		feedbacks: [
			{
				feedbackId: 'internal:checkExpression',
				options: { expression: `${current} == true` },
				styleOverrides: activeOverrides(entry.activeColors),
			},
		],
		localVariables: [
			{
				variableType: 'feedback',
				variableName: EQ_VALUE_VARIABLE,
				feedbackId: `get_property_${className}`,
				options: { objectId: rolePath, property, sync: true },
			},
		],
	}
}

/**
 * A button that steps a filter's enum property one named value at a time, showing the name.
 *
 * The getter returns the value alone, with no limits after it, so the ends come from the enum aes70
 * defines rather than from the device. Two variables read the same property: one raw, to step from, and
 * one as its name, to show. The arc is only there to say where in the list the value sits.
 */
function eqEnumPreset(
	className: EqClassName,
	rolePath: string,
	property: string,
	values: EnumValues,
): CompanionLayeredButtonPresetDefinition<OcaModuleTypes> {
	const ids = Object.values(values)
	const [first, last] = [Math.min(...ids), Math.max(...ids)]
	const current = `$(local:${EQ_VALUE_VARIABLE})`
	const elements = labelElements({
		isExpression: true,
		value: eqLabel(rolePath, property, `$(local:${EQ_LABEL_VARIABLE})`),
	})
	elements.splice(1, 0, dialElement('value', DIAL_COLORS.plain, current, String(first), String(last)))
	const propertyOption = { objectId: rolePath, property, sync: true }
	return {
		type: 'layered',
		name: `${rolePath} - ${ocaClassNameToLabel(property)}`,
		elements,
		steps: [
			{
				down: [],
				up: [],
				rotate_left: [eqSetTo(className, rolePath, property, `max(${first}, ${current} - 1)`)],
				rotate_right: [eqSetTo(className, rolePath, property, `min(${last}, ${current} + 1)`)],
			},
		],
		feedbacks: [],
		localVariables: [
			{
				variableType: 'feedback',
				variableName: EQ_VALUE_VARIABLE,
				feedbackId: `get_property_${className}`,
				// The raw value, so the steps are arithmetic on the enum's numbers
				options: { ...propertyOption, [`enum_${property}`]: false },
			},
			{
				variableType: 'feedback',
				variableName: EQ_LABEL_VARIABLE,
				feedbackId: `get_property_${className}`,
				options: { ...propertyOption, [`enum_${property}`]: true },
			},
		],
	}
}

/**
 * A button that steps a filter's number property, with an arc showing where it sits between the limits
 * the getter returns alongside it. Turning and fine mode work as they do on a rotary preset.
 */
function eqDialPreset(
	className: EqClassName,
	rolePath: string,
	entry: Extract<EqProperty, { kind: 'dial' }>,
): CompanionLayeredButtonPresetDefinition<OcaModuleTypes> {
	const { property, dial, unit, color, colorBelow } = entry
	const [value, min, max] = [0, 1, 2].map((index) => `$(local:${EQ_VALUE_VARIABLE}).values[${index}]`)
	const elements = labelElements({
		isExpression: true,
		value: eqLabel(rolePath, property, numberWithUnit(value, VALUE_DECIMAL_PLACES, unit)),
	})
	elements.splice(
		1,
		0,
		dialElement(
			dial,
			color ?? DIAL_COLORS.plain,
			dialScale(entry, value),
			dialScale(entry, min),
			dialScale(entry, max),
			colorBelow,
		),
	)
	return {
		type: 'layered',
		name: `${rolePath} - ${ocaClassNameToLabel(property)}`,
		elements,
		steps: [
			{
				down: [],
				up: [],
				rotate_left: [eqSetTo(className, rolePath, property, `max(${min}, ${steppedValue(entry, value, 'down')})`)],
				rotate_right: [eqSetTo(className, rolePath, property, `min(${max}, ${steppedValue(entry, value, 'up')})`)],
			},
		],
		feedbacks: [],
		localVariables: [
			...stepVariables(entry),
			{
				variableType: 'feedback',
				variableName: EQ_VALUE_VARIABLE,
				feedbackId: `get_property_${className}`,
				// Without sync the getter's result arrives whole, as { values: [value, min, max] }
				options: { objectId: rolePath, property, sync: false },
			},
		],
	}
}

/**
 * One group per filter object the device has, named after the object, holding a button for each of its
 * properties the device will let us set. Unlike the other sections, which group by class, a filter's
 * properties belong together: one object is one band, and its buttons are laid out side by side.
 */
export async function getEqualiserGroups(
	self: ModuleInstance,
	presets: CompanionPresetDefinitions<OcaModuleTypes>,
): Promise<CompanionPresetGroup<OcaModuleTypes>[]> {
	const groups: CompanionPresetGroup<OcaModuleTypes>[] = []
	for (const eq of EQ_CLASSES) {
		const rolePaths = [...self.ocaHelper.getByClass(eq.className)]
		if (rolePaths.length === 0) continue
		for (const rolePath of rolePaths) {
			// This object's own properties, not the class's: bands of one filter class differ in what
			// they implement, and a button for a property this one lacks is refused when pressed
			const properties = await self.ocaHelper.getObjectProperties(rolePath)
			const ids: string[] = []
			for (const entry of eq.properties) {
				// The Set Property action only offers a property the device has shown it implements
				const described = properties.find((prop) => prop.name === entry.property && prop.write)
				if (!described) continue
				// An enum button steps between the values aes70 defines, so it needs to know them
				if (entry.kind === 'enum' && !described.enumValues) continue
				const id = `eq_${eq.className}_${rolePath}_${entry.property}`
				presets[id] =
					entry.kind === 'toggle'
						? eqTogglePreset(eq.className, rolePath, entry)
						: entry.kind === 'enum'
							? eqEnumPreset(eq.className, rolePath, entry.property, described.enumValues ?? {})
							: eqDialPreset(eq.className, rolePath, entry)
				ids.push(id)
			}
			if (ids.length === 0) {
				logger.debug(`Skipping ${rolePath} equaliser presets, since it implements none of its settable properties`)
				continue
			}
			groups.push({ id: `eq_${eq.className}_${rolePath}`, type: 'simple', name: rolePath, presets: ids })
		}
	}
	return groups
}
