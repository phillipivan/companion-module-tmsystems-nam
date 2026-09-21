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
	DEFAULT_STEPS,
	DIAL_COLORS,
	FINE_STEP_DIVISOR,
	INTEGER_STEPS,
	labelElements,
	logger,
	numberWithUnit,
	templateText,
	VALUE_DECIMAL_PLACES,
	type ActiveColors,
	type DialKind,
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
			readonly stepSize: number
			readonly fine: boolean
			readonly unit?: string
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
			{ property: 'Frequency', kind: 'dial', dial: 'value', unit: 'Hz', ...INTEGER_STEPS },
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
			{ property: 'Frequency', kind: 'dial', dial: 'value', unit: 'Hz', ...INTEGER_STEPS },
			{ property: 'Shape', kind: 'enum' },
			// Narrowest at the minimum, opening out symmetrically as it widens
			{ property: 'WidthParameter', kind: 'dial', dial: 'width', ...DEFAULT_STEPS },
			{ property: 'InBandGain', kind: 'dial', dial: 'centred', unit: 'dB', ...DEFAULT_STEPS },
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
	const { property, stepSize, fine, dial, unit } = entry
	const [value, min, max] = [0, 1, 2].map((index) => `$(local:${EQ_VALUE_VARIABLE}).values[${index}]`)
	const step = fine
		? `($(this:active) ? $(local:step_size) / ${FINE_STEP_DIVISOR} : $(local:step_size))`
		: '$(local:step_size)'
	const elements = labelElements({
		isExpression: true,
		value: eqLabel(rolePath, property, numberWithUnit(value, VALUE_DECIMAL_PLACES, unit)),
	})
	elements.splice(1, 0, dialElement(dial, DIAL_COLORS.plain, value, min, max))
	return {
		type: 'layered',
		name: `${rolePath} - ${ocaClassNameToLabel(property)}`,
		elements,
		steps: [
			{
				down: [],
				up: [],
				rotate_left: [eqSetTo(className, rolePath, property, `max(${min}, ${value} - ${step})`)],
				rotate_right: [eqSetTo(className, rolePath, property, `min(${max}, ${value} + ${step})`)],
			},
		],
		feedbacks: [],
		localVariables: [
			{ variableType: 'simple', variableName: 'step_size', startupValue: stepSize },
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
		const properties = await self.ocaHelper.getClassProperties(eq.className)
		for (const rolePath of rolePaths) {
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
