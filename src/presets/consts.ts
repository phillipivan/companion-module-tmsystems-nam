import {
	combineRgb,
	createModuleLogger,
	type CompanionGraphicsElementValue,
	type CompanionLayeredButtonPresetDefinition,
	type CompanionPresetDefinitions,
	type CompanionPresetFeedbackStyleOverride,
	type CompanionPresetGroup,
	type SomeButtonGraphicsElement,
} from '@companion-module/base'
import type ModuleInstance from '../main.js'
import type { PropertyDescription } from '../OcaHelper.js'
import type { OcaModuleTypes } from '../types.js'
import type { OcaClassName } from '../consts/aes70-constants.js'
import { ocaClassNameToLabel } from '../utils.js'
import { CompositeElementId, type CompositeElementSchema } from '../composites.js'

export const logger = createModuleLogger('OCA Presets')

/** The colours a toggle's button changes to while the property has its active value. */
export interface ActiveColors {
	readonly background: number
	/** The label's colour, when white won't do. */
	readonly text?: number
}

/** Ids of the button's elements, which the feedback's style overrides refer to. */
const BACKGROUND_ID = 'background'
const LABEL_ID = 'label'
export const METER_ID = 'meter'
const DIAL_ID = 'dial'

/** The two dial arcs a rotary can carry, and the composite element each is drawn with. */
export type DialKind = 'value' | 'centred' | 'width'

const DIAL_ELEMENTS = {
	value: { id: CompositeElementId.Dial, name: 'Value Dial' },
	centred: { id: CompositeElementId.CentredDial, name: 'Centred Dial' },
	width: { id: CompositeElementId.WidthDial, name: 'Width Dial' },
} as const satisfies Record<DialKind, { id: CompositeElementId; name: string }>

/** Dial arc colours, all darker than the elements' own defaults so they sit behind white text. */
export const DIAL_COLORS = {
	/** For a class that doesn't pick its own, where the property has no conventional colour. */
	plain: combineRgb(182, 182, 182),
	gain: combineRgb(0, 153, 0),
	centred: combineRgb(204, 204, 0),
} as const

/** In Companion's text element units, used as given. A simple preset's `size` is in older units and gets scaled. */
const LABEL_FONT_SIZE = 22

/**
 * White `text` on black. The text fills the button unless `textHeight` is given, which keeps it clear of
 * whatever is below, such as a meter along the bottom edge.
 */
export function labelElements(
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
export function activeOverrides(colors: ActiveColors): CompanionPresetFeedbackStyleOverride[] {
	const overrides = [{ elementId: BACKGROUND_ID, color: colors.background }]
	if (colors.text !== undefined) overrides.push({ elementId: LABEL_ID, color: colors.text })
	return overrides.map(({ elementId, color }) => ({
		elementId,
		elementProperty: 'color',
		// Wrapped, though the type allows a plain value: Companion 5.1 drops overrides that aren't
		override: { isExpression: false, value: color },
	}))
}

/** What `step_size` is divided by while the dial is held, for fine control. */
export const FINE_STEP_DIVISOR = 10

/** A step of 1, or a tenth of that while held. */
export const DEFAULT_STEPS = { stepSize: 1, fine: true } as const

/**
 * A step of 10, so the fine step is still a whole number. A fractional step would be truncated when
 * aes70 encodes the integer, so a step_size that isn't a multiple of 10 makes fine mode uneven.
 */
export const INTEGER_STEPS = { stepSize: FINE_STEP_DIVISOR, fine: true } as const

/** A rotary's label shows its value to at most this many decimal places, hiding float32 noise such as -2.4000000953674316. */
export const VALUE_DECIMAL_PLACES = 3

/**
 * `text` as literal text in an expression's template literal. Companion reads template text raw,
 * without escapes, so text holding a character that would end or interpolate it goes in as a
 * quoted string instead.
 */
export function templateText(text: string): string {
	return /[`$\\]/.test(text) ? '${' + JSON.stringify(text) + '}' : text
}

/** A dial arc showing where `value` sits between `min` and `max`, for a button to draw behind its text. */
export function dialElement(
	kind: DialKind,
	color: number,
	value: string,
	min: string,
	max: string,
): SomeButtonGraphicsElement<CompositeElementSchema> {
	// Every dial takes the same options; the switch is so each carries its element's own id as a literal
	const options = {
		level: { isExpression: true as const, value },
		min: { isExpression: true as const, value: min },
		max: { isExpression: true as const, value: max },
		color,
	}
	const { name } = DIAL_ELEMENTS[kind]
	switch (kind) {
		case 'centred':
			return { type: 'composite', id: DIAL_ID, name, elementId: CompositeElementId.CentredDial, options }
		case 'width':
			return { type: 'composite', id: DIAL_ID, name, elementId: CompositeElementId.WidthDial, options }
		default:
			return { type: 'composite', id: DIAL_ID, name, elementId: CompositeElementId.Dial, options }
	}
}

/** An expression rounding `value` to `places` decimal places. Callers guard it with `isNumber`. */
function rounded(value: string, places: number): string {
	const scale = 10 ** places
	return `round(${value} * ${scale}) / ${scale}`
}

/**
 * An expression showing `value` to `places` decimal places, followed by `unit` where there is one, and
 * showing nothing at all until the value is a number.
 *
 * The unit is joined on in a nested template literal, since Companion's `+` adds numbers rather than
 * joining strings. Keeping it inside the guard means an unread value leaves the line empty rather than
 * showing a bare unit or "$NA dB".
 */
export function numberWithUnit(value: string, places: number, unit?: string): string {
	const shown = unit === undefined ? rounded(value, places) : '`${' + rounded(value, places) + '} ' + unit + '`'
	return `isNumber(${value}) ? ${shown} : ''`
}

/**
 * One group of presets per class in `classes` that the device has, named after the class, with a
 * preset built by `build` for each of its objects. Each preset is added to `presets`.
 *
 * `access` is what the presets do with the property: a button that sets one needs a class whose objects
 * accept writes, while a meter only reads.
 */
export async function classGroups<T extends { readonly className: OcaClassName; readonly property: string }>(
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
