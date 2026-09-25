import {
	combineRgb,
	createModuleLogger,
	type CompanionPresetLocalVariable,
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
import { CompositeElementId, type CompositeElementSchema, type DialScheme } from '../composites.js'

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

/** Colours more than one kind of dial uses, named once so the sharing is on purpose. */
const DIAL_BLUE = combineRgb(102, 178, 255)
const DIAL_YELLOW = combineRgb(204, 204, 0)

/** Dial arc colours, mostly darker than the elements' own defaults so they sit behind white text. */
export const DIAL_COLORS = {
	/** For a class that doesn't pick its own, where the property has no conventional colour. */
	plain: combineRgb(182, 182, 182),
	gain: combineRgb(0, 153, 0),
	/** A gain below unity, so a cut reads as taking something away rather than adding it. */
	cut: combineRgb(153, 0, 0),
	/** Unity gain, which a gain dial blends out from: red down to a cut, green up to a boost. */
	unity: DIAL_YELLOW,
	pan: DIAL_YELLOW,
	/** A dynamics ratio or slope, sharing the pan dial's yellow. */
	ratio: DIAL_YELLOW,
	/** Amber rather than the pan dial's yellow, so the two read apart where a device has both. */
	width: combineRgb(204, 153, 0),
	frequency: DIAL_BLUE,
	/** A dynamics time constant, sharing the frequency dial's blue. */
	time: DIAL_BLUE,
	/** A delay time, pale pink so it reads apart from the dynamics times' blue. */
	delay: combineRgb(255, 192, 255),
} as const

/** In Companion's text element units, used as given. A simple preset's `size` is in older units and gets scaled. */
const LABEL_FONT_SIZE = 22

/**
 * Smaller, for a button naming a property as well as its value. A property name runs long — "Dynamic
 * Gain Floor" — and at the usual size the two lines crowd each other.
 */
export const PROPERTY_LABEL_FONT_SIZE = 18

/**
 * White `text` on black. The text fills the button unless `textHeight` is given, which keeps it clear of
 * whatever is below, such as a meter along the bottom edge, and takes the usual size unless a button
 * has more to say than most.
 */
export function labelElements(
	text: CompanionGraphicsElementValue<string>,
	textHeight?: number,
	fontsize: number = LABEL_FONT_SIZE,
): SomeButtonGraphicsElement<CompositeElementSchema>[] {
	return [
		{ type: 'box', id: BACKGROUND_ID, name: 'Background', color: combineRgb(0, 0, 0) },
		{
			type: 'text',
			id: LABEL_ID,
			name: 'Label',
			text,
			...(textHeight === undefined ? {} : { height: textHeight }),
			fontsize,
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

/**
 * How a turn moves the value: by a fixed amount, by a ratio of it, which multiplies instead of
 * adding, or by a share of the range the device reports. Anything read on a scale rather than a count
 * wants a ratio, so a detent is the same proportional change wherever it lands. A fixed step is a leap
 * at the bottom of such a range and imperceptible at the top: 1 ms on a 0.5 ms attack against 1 ms on
 * a 500 ms one.
 *
 * A ratio step is sized in divisions of a doubling, so 3 is a factor of 2^(1/3), about 1.26. On a
 * frequency that is the familiar third of an octave; on a time it lands on the 1, 1.25, 1.6, 2, 2.5
 * series that time constants are usually marked in.
 *
 * A range step is sized in divisions of the span between the limits, for a property whose units and
 * limits vary from one device to the next, so no fixed step suits them all. A filter's width is Q on
 * one and octaves on another, and a step fine enough for one is a crawl or a leap on the other.
 */
export type StepMode = 'linear' | 'ratio' | 'range'

/**
 * A dial's tuning variables: a step size, the divisions of a doubling a ratio step takes, or the
 * divisions of the device's range a range step takes.
 */
const STEP_SIZE_VARIABLE = 'step_size'
const DIVISIONS_VARIABLE = 'step_divisions'
const DIVISIONS_FINE_VARIABLE = 'step_divisions_fine'
const RANGE_DIVISIONS_VARIABLE = 'range_divisions'

/**
 * Where a ratio step starts from when the value is too near zero to multiply: zero times anything is
 * still zero, so a dial sitting there could never leave it.
 */
const RATIO_FLOOR = 0.001

/** A third of a doubling per detent, a twenty-fourth while the dial is held. */
export const RATIO_STEPS = { stepMode: 'ratio', stepSize: 3, fineStepSize: 24, fine: true } as const

/** A 25th of the device's range per detent, a 250th while the dial is held. */
export const RANGE_STEPS = { stepMode: 'range', stepSize: 25, fine: true } as const

/** What a dial's table entry says about its steps. */
export interface StepSettings {
	/** Linear unless it says otherwise. */
	readonly stepMode?: StepMode
	/**
	 * The step, or the divisions of a doubling each detent takes on a ratio dial, or the divisions of
	 * the device's range on a range dial.
	 */
	readonly stepSize: number
	/**
	 * A ratio dial's divisions while held. A linear dial divides its step by FINE_STEP_DIVISOR, and a
	 * range dial multiplies its divisions by it.
	 */
	readonly fineStepSize?: number
	/** Whether holding the dial takes a smaller step. */
	readonly fine: boolean
}

/** The local variables that tune `steps`, for the button to carry. */
export function stepVariables(steps: StepSettings): CompanionPresetLocalVariable<OcaModuleTypes['feedbacks']>[] {
	if (steps.stepMode === 'ratio') {
		return [
			{ variableType: 'simple', variableName: DIVISIONS_VARIABLE, startupValue: steps.stepSize },
			{
				variableType: 'simple',
				variableName: DIVISIONS_FINE_VARIABLE,
				startupValue: steps.fineStepSize ?? steps.stepSize,
			},
		]
	}
	if (steps.stepMode === 'range') {
		return [{ variableType: 'simple', variableName: RANGE_DIVISIONS_VARIABLE, startupValue: steps.stepSize }]
	}
	return [{ variableType: 'simple', variableName: STEP_SIZE_VARIABLE, startupValue: steps.stepSize }]
}

/**
 * An expression moving `value` one detent `direction`, before the caller clamps it to the property's
 * limits, `min` and `max`. An octave dial multiplies by `2 ^ (±1/divisions)`, which is exact both
 * ways: stepping up and back down again returns the value it started from, where a rounded ratio
 * would drift. A range dial adds or takes away `(max - min) / divisions`, worked out afresh on every
 * turn from the limits read alongside the value.
 */
export function steppedValue(
	steps: StepSettings,
	value: string,
	direction: 'up' | 'down',
	min: string,
	max: string,
): string {
	if (steps.stepMode === 'ratio') {
		const divisions = steps.fine
			? `($(this:active) ? $(local:${DIVISIONS_FINE_VARIABLE}) : $(local:${DIVISIONS_VARIABLE}))`
			: `$(local:${DIVISIONS_VARIABLE})`
		const factor = `pow(2, 1 / ${divisions})`
		// A turn always moves the value the way it was turned, whatever its sign. Multiplying suits a
		// positive value; below zero the same factor would run the wrong way, so it divides instead,
		// and either way a value too near zero to multiply starts again from the floor.
		const [grow, shrink] = direction === 'up' ? [`* ${factor}`, `/ ${factor}`] : [`/ ${factor}`, `* ${factor}`]
		const escape = direction === 'up' ? RATIO_FLOOR : -RATIO_FLOOR
		return (
			`${value} >= ${RATIO_FLOOR} ? ${value} ${grow} : ` +
			`(${value} <= ${-RATIO_FLOOR} ? ${value} ${shrink} : ${escape})`
		)
	}
	if (steps.stepMode === 'range') {
		const divisions = steps.fine
			? `($(this:active) ? $(local:${RANGE_DIVISIONS_VARIABLE}) * ${FINE_STEP_DIVISOR} : $(local:${RANGE_DIVISIONS_VARIABLE}))`
			: `$(local:${RANGE_DIVISIONS_VARIABLE})`
		return `${value} ${direction === 'up' ? '+' : '-'} (${max} - ${min}) / ${divisions}`
	}
	const size = steps.fine
		? `($(this:active) ? $(local:${STEP_SIZE_VARIABLE}) / ${FINE_STEP_DIVISOR} : $(local:${STEP_SIZE_VARIABLE}))`
		: `$(local:${STEP_SIZE_VARIABLE})`
	return `${value} ${direction === 'up' ? '+' : '-'} ${size}`
}

/**
 * The smallest value a logarithmic dial will take the log of, so a device reporting zero as its
 * minimum gives a very negative number rather than -Infinity, which would leave the arc undrawable.
 */
const LOG_FLOOR = 0.001

/**
 * `value` on the scale the dial is drawn against. A dial that steps by ratio is drawn logarithmically,
 * so every doubling takes the same length of arc; on a linear one the top doubling would fill half the
 * dial and everything below it would be squeezed into the first few degrees.
 *
 * Only the arc is scaled. The button's text still reads in the property's own units. A value at or
 * below zero has no logarithm, so the floor pins it to the bottom of the arc rather than leaving it
 * undrawable — see the note on negative values in steppedValue.
 */
export function dialScale(steps: StepSettings, value: string): string {
	return steps.stepMode === 'ratio' ? `log(max(${LOG_FLOOR}, ${value}))` : value
}

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
	/** A centred dial's colour below zero. The same as `color` unless a class asks for its own. */
	colorBelow?: number,
	/** A centred dial's colour at zero, which it blends from out to each end. Defaults to `color`. */
	colorZero?: number,
	/** A value dial's colour scheme: one colour, or the spectrum across its range. */
	scheme?: DialScheme,
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
			return {
				type: 'composite',
				id: DIAL_ID,
				name,
				elementId: CompositeElementId.CentredDial,
				options: { ...options, colorZero: colorZero ?? color, colorBelow: colorBelow ?? color },
			}
		case 'width':
			return { type: 'composite', id: DIAL_ID, name, elementId: CompositeElementId.WidthDial, options }
		default:
			return {
				type: 'composite',
				id: DIAL_ID,
				name,
				elementId: CompositeElementId.Dial,
				options: { ...options, scheme: scheme ?? 'single' },
			}
	}
}

/** An expression rounding `value` to `places` decimal places. Callers guard it with `isNumber`. */
export function rounded(value: string, places: number): string {
	if (places === 0) return `round(${value})`
	const scale = 10 ** places
	return `round(${value} * ${scale}) / ${scale}`
}

/**
 * Another unit a value switches to on one side of a threshold, so a reading stays legible across a
 * range that spans decades: a frequency reads 583 Hz down low and 1.83 kHz rather than 1830 Hz
 * further up, and a time reads 5 ms rather than 0.005 s. Or the same unit to more places, where a
 * step at the bottom of the range is smaller than the last place shown.
 */
export interface UnitStep {
	/** The value at which the other unit takes over. */
	readonly at: number
	/** Whether it takes over below that value rather than at or above it. */
	readonly whenBelow?: boolean
	/** What the value is divided by, so a smaller unit divides by a fraction. Left out where the unit is the same. */
	readonly divisor?: number
	/** Left out where only the places change, keeping the value's own unit, or its lack of one. */
	readonly unit?: string
	/** Decimal places for this unit, which rarely wants as many as the one it replaces. */
	readonly places: number
}

/** Hertz become kilohertz at a thousand, to two decimal places. */
export const KILOHERTZ: UnitStep = { at: 1000, divisor: 1000, unit: 'kHz', places: 2 }

/**
 * Hertz keep a decimal place below a hundred. A fine detent is a 24th of an octave, about 3%, which
 * down there is less than a hertz: in whole hertz, successive detents would read the same.
 */
export const LOW_HERTZ: UnitStep = { at: 100, whenBelow: true, places: 1 }

/**
 * How a frequency reads: whole hertz from a hundred to a thousand, a tenth of one below that, and
 * kilohertz above. Any finer is float32 noise or a ratio step's leftover, not anything a listener
 * would set or hear.
 */
export const HERTZ = { unit: 'Hz', unitSteps: [KILOHERTZ, LOW_HERTZ], decimalPlaces: 0 } as const

/** Milliseconds, to however many places keep the reading to three digits. */
const threeDigitMilliseconds = (below: number, places: number): UnitStep => ({
	at: below,
	whenBelow: true,
	divisor: 0.001,
	unit: 'ms',
	places,
})

/**
 * How a time reads: to three significant digits, in seconds from one up and milliseconds below it, so
 * 2.45 s, 12.3 s and 123 s, then 123 ms, 15.2 ms and 2.72 ms. Dynamics time constants live almost
 * entirely below a second, where 5 ms reads better than 0.005 s. The steps are checked in order, so the
 * thresholds above run from the top down and those below from the bottom up.
 */
export const SECONDS = {
	unit: 's',
	unitSteps: [
		{ at: 100, places: 0 },
		{ at: 10, places: 1 },
		threeDigitMilliseconds(0.01, 2),
		threeDigitMilliseconds(0.1, 1),
		threeDigitMilliseconds(1, 0),
	],
	decimalPlaces: 2,
} as const satisfies { unit: string; unitSteps: readonly UnitStep[]; decimalPlaces: number }

/**
 * An expression showing `value` to `places` decimal places, followed by `unit` where there is one, and
 * showing nothing at all until the value is a number. Each of `steps` switches to its own unit and
 * places on the far side of its threshold, checked in order, so the first that applies wins.
 *
 * The unit is joined on in a nested template literal, since Companion's `+` adds numbers rather than
 * joining strings. Keeping it inside the guard means an unread value leaves the line empty rather than
 * showing a bare unit or "$NA dB".
 */
export function numberWithUnit(value: string, places: number, unit?: string, steps: readonly UnitStep[] = []): string {
	const shown = (places: number, unit?: string, scaled = value): string =>
		unit === undefined ? rounded(scaled, places) : '`${' + rounded(scaled, places) + '} ' + unit + '`'

	// Built from the last step back, so each one's otherwise branch holds the steps after it
	const labelled = steps.reduceRight(
		(otherwise, step) => {
			const scaled = step.divisor === undefined ? value : `${value} / ${step.divisor}`
			const applies = `${value} ${step.whenBelow ? '<' : '>='} ${step.at}`
			return `(${applies} ? ${shown(step.places, step.unit ?? unit, scaled)} : ${otherwise})`
		},
		shown(places, unit),
	)
	return `isNumber(${value}) ? ${labelled} : ''`
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
