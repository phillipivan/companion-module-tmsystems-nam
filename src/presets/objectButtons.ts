import type {
	CompanionLayeredButtonPresetDefinition,
	CompanionPresetDefinitions,
	CompanionPresetGroup,
	SomePresetActionEntry,
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
	DIAL_COLORS,
	labelElements,
	logger,
	numberWithUnit,
	PROPERTY_LABEL_FONT_SIZE,
	stepVariables,
	steppedValue,
	templateText,
	VALUE_DECIMAL_PLACES,
	type ActiveColors,
	type DialKind,
	type StepMode,
	type UnitStep,
} from './consts.js'
import type { DialScheme } from '../composites.js'

/*
 * Buttons for the individual properties of one control object, rather than one button per object.
 *
 * Classes like a filter or a dynamics processor carry a handful of settable properties that belong
 * together: one object is one band, or one compressor. Both sections therefore group by object and
 * give each property its own button, and share everything here bar their own table of classes.
 */

/**
 * The classes whose objects get a button per property. Kept narrow on purpose: it resolves into the
 * action and feedback ids, and TypeScript gives up on a template literal over the whole class list.
 */
export type ObjectClassName =
	| typeof OCA_CLASS_NAMES.OcaFilterClassical
	| typeof OCA_CLASS_NAMES.OcaFilterParametric
	| typeof OCA_CLASS_NAMES.OcaDynamics
	| typeof OCA_CLASS_NAMES.OcaSignalGenerator

export type ObjectProperty =
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
			/** A centred dial's colour at zero, which the arc blends from out to each end. */
			readonly colorZero?: number
			/** A value dial's colour scheme. The spectrum ignores `color`. */
			readonly scheme?: DialScheme
			/** Other units the label switches to past a threshold, such as Hz to kHz, checked in order. */
			readonly unitSteps?: readonly UnitStep[]
			/** Decimal places on the label, where the property wants fewer than VALUE_DECIMAL_PLACES. */
			readonly decimalPlaces?: number
			/**
			 * Rewrites what the button shows, where the stored number isn't what an engineer reads: a
			 * dynamics slope is set as a fraction but read as the compression ratio it stands for.
			 * Takes the expression for the value and returns the expression for the line, and only
			 * changes the label — the dial and the action still work in the property's own units.
			 */
			readonly displayAs?: (value: string) => string
			/**
			 * The field of a struct property the button reads, where the getter returns a struct rather
			 * than a bare number: a dynamics threshold arrives as a level and the reference it is
			 * measured from. The limits still come back as plain numbers beside it.
			 */
			readonly field?: string
	  }

export interface ObjectClass<TName extends ObjectClassName = ObjectClassName> {
	readonly className: TName
	readonly properties: readonly ObjectProperty[]
}

const VALUE_VARIABLE = 'value'
const LABEL_VARIABLE = 'label'

/**
 * An expression for the button's label: the property as the dropdowns name it, then its value once
 * known. The object is left off — a whole group of these belongs to one object, and repeating its
 * role path on every button crowded them without saying anything the group didn't.
 */
function objectLabel(property: string, value?: string): string {
	const label = '`' + templateText(ocaClassNameToLabel(property))
	return value === undefined ? label + '`' : label + '\\n${' + value + '}`'
}

/** Sets `property` on the object at `rolePath` to whatever `expression` works out to. */
function setTo(
	className: ObjectClassName,
	rolePath: string,
	property: string,
	expression: string,
): SomePresetActionEntry<OcaModuleTypes> {
	return {
		actionId: `set_property_${className}`,
		options: { objectId: rolePath, property, [`value_${property}`]: { isExpression: true, value: expression } },
	}
}

/** A button that flips an object's boolean property, colouring itself while it is on. */
function togglePreset(
	className: ObjectClassName,
	rolePath: string,
	entry: Extract<ObjectProperty, { kind: 'toggle' }>,
): CompanionLayeredButtonPresetDefinition<OcaModuleTypes> {
	const { property } = entry
	const current = `$(local:${VALUE_VARIABLE})`
	return {
		type: 'layered',
		name: `${rolePath} - ${ocaClassNameToLabel(property)}`,
		elements: labelElements({ isExpression: true, value: objectLabel(property) }, undefined, PROPERTY_LABEL_FONT_SIZE),
		// Before the state is known a press turns the filter off, the safer way round
		steps: [{ down: [setTo(className, rolePath, property, `${current} == false ? true : false`)], up: [] }],
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
				variableName: VALUE_VARIABLE,
				feedbackId: `get_property_${className}`,
				options: { objectId: rolePath, property, sync: true },
			},
		],
	}
}

/**
 * A button that steps an object's enum property one named value at a time, showing the name.
 *
 * The getter returns the value alone, with no limits after it, so the ends come from the enum aes70
 * defines rather than from the device. Two variables read the same property: one raw, to step from, and
 * one as its name, to show. The arc is only there to say where in the list the value sits.
 */
function enumPreset(
	className: ObjectClassName,
	rolePath: string,
	property: string,
	values: EnumValues,
): CompanionLayeredButtonPresetDefinition<OcaModuleTypes> {
	const ids = Object.values(values)
	const [first, last] = [Math.min(...ids), Math.max(...ids)]
	const current = `$(local:${VALUE_VARIABLE})`
	const elements = labelElements(
		{ isExpression: true, value: objectLabel(property, `$(local:${LABEL_VARIABLE})`) },
		undefined,
		PROPERTY_LABEL_FONT_SIZE,
	)
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
				rotate_left: [setTo(className, rolePath, property, `max(${first}, ${current} - 1)`)],
				rotate_right: [setTo(className, rolePath, property, `min(${last}, ${current} + 1)`)],
			},
		],
		feedbacks: [],
		localVariables: [
			{
				variableType: 'feedback',
				variableName: VALUE_VARIABLE,
				feedbackId: `get_property_${className}`,
				// The raw value, so the steps are arithmetic on the enum's numbers
				options: { ...propertyOption, [`enum_${property}`]: false },
			},
			{
				variableType: 'feedback',
				variableName: LABEL_VARIABLE,
				feedbackId: `get_property_${className}`,
				options: { ...propertyOption, [`enum_${property}`]: true },
			},
		],
	}
}

/**
 * A button that steps an object's number property, with an arc showing where it sits between the limits
 * the getter returns alongside it. Turning and fine mode work as they do on a rotary preset.
 */
function dialPreset(
	className: ObjectClassName,
	rolePath: string,
	entry: Extract<ObjectProperty, { kind: 'dial' }>,
): CompanionLayeredButtonPresetDefinition<OcaModuleTypes> {
	const { property, dial, unit, color, colorBelow, colorZero, scheme } = entry
	const [reading, min, max] = [0, 1, 2].map((index) => `$(local:${VALUE_VARIABLE}).values[${index}]`)
	const value = entry.field === undefined ? reading : `${reading}.${entry.field}`
	const elements = labelElements(
		{
			isExpression: true,
			value: objectLabel(
				property,
				entry.displayAs?.(value) ??
					numberWithUnit(value, entry.decimalPlaces ?? VALUE_DECIMAL_PLACES, unit, entry.unitSteps),
			),
		},
		undefined,
		PROPERTY_LABEL_FONT_SIZE,
	)
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
			colorZero,
			scheme,
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
				rotate_left: [setTo(className, rolePath, property, `max(${min}, ${steppedValue(entry, value, 'down')})`)],
				rotate_right: [setTo(className, rolePath, property, `min(${max}, ${steppedValue(entry, value, 'up')})`)],
			},
		],
		feedbacks: [],
		localVariables: [
			...stepVariables(entry),
			{
				variableType: 'feedback',
				variableName: VALUE_VARIABLE,
				feedbackId: `get_property_${className}`,
				// Without sync the getter's result arrives whole, as { values: [value, min, max] }
				options: { objectId: rolePath, property, sync: false },
			},
		],
	}
}

/**
 * One group per object of each class in `classes`, named after the object, holding a button for each
 * of its properties the device will let us set. Each preset is added to `presets`.
 *
 * `kind` prefixes the ids, keeping one section's groups apart from another's.
 */
export async function objectGroups<TName extends ObjectClassName>(
	self: ModuleInstance,
	kind: string,
	classes: readonly ObjectClass<TName>[],
	presets: CompanionPresetDefinitions<OcaModuleTypes>,
): Promise<CompanionPresetGroup<OcaModuleTypes>[]> {
	const groups: CompanionPresetGroup<OcaModuleTypes>[] = []
	for (const entry of classes) {
		const rolePaths = [...self.ocaHelper.getByClass(entry.className)]
		if (rolePaths.length === 0) continue
		for (const rolePath of rolePaths) {
			// This object's own properties, not the class's: objects of one class differ in what they
			// implement, and a button for a property this one lacks is refused when pressed
			const properties = await self.ocaHelper.getObjectProperties(rolePath)
			const ids: string[] = []
			for (const property of entry.properties) {
				// The Set Property action only offers a property the device has shown it implements
				const described = properties.find((prop) => prop.name === property.property && prop.write)
				if (!described) continue
				// An enum button steps between the values aes70 defines, so it needs to know them
				if (property.kind === 'enum' && !described.enumValues) continue
				const id = `${kind}_${entry.className}_${rolePath}_${property.property}`
				presets[id] =
					property.kind === 'toggle'
						? togglePreset(entry.className, rolePath, property)
						: property.kind === 'enum'
							? enumPreset(entry.className, rolePath, property.property, described.enumValues ?? {})
							: dialPreset(entry.className, rolePath, property)
				ids.push(id)
			}
			if (ids.length === 0) {
				logger.debug(`Skipping ${rolePath} ${kind} presets, since it implements none of its settable properties`)
				continue
			}
			groups.push({ id: `${kind}_${entry.className}_${rolePath}`, type: 'simple', name: rolePath, presets: ids })
		}
	}
	return groups
}
