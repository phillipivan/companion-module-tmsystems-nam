import { combineRgb, type CompanionPresetDefinitions, type CompanionPresetGroup } from '@companion-module/base'
import type ModuleInstance from '../main.js'
import type { OcaModuleTypes } from '../types.js'
import { OCA_CLASS_NAMES } from '../consts/aes70-constants.js'
import { DEFAULT_STEPS, DIAL_COLORS, HERTZ, RANGE_STEPS, RATIO_STEPS } from './consts.js'
import { objectGroups, type ObjectClass, type ObjectProperty } from './objectButtons.js'

/** The filter classes with a preset group each. The curve classes are left out: FIR, polynomial and
 * arbitrary-curve filters are described by coefficient lists rather than the handful of settable
 * numbers a button can step. */
export type EqClassName = typeof OCA_CLASS_NAMES.OcaFilterClassical | typeof OCA_CLASS_NAMES.OcaFilterParametric

/**
 * One of a filter's properties, and the button it gets. A `dial` steps a number and draws its arc, an
 * `enum` steps between a property's named values and shows the name, and a `toggle` flips a boolean.
 */
/** Enabled turns green when the filter is in circuit, like the other boolean toggles. */
const EQ_ENABLED = {
	property: 'Enabled',
	kind: 'toggle',
	activeColors: { background: combineRgb(0, 153, 0) },
} as const satisfies ObjectProperty

export const EQ_CLASSES: readonly ObjectClass<EqClassName>[] = [
	{
		className: OCA_CLASS_NAMES.OcaFilterClassical,
		properties: [
			EQ_ENABLED,
			{
				property: 'Frequency',
				kind: 'dial',
				dial: 'value',
				...HERTZ,
				color: DIAL_COLORS.frequency,
				// Red low to violet high, like the spectrum a frequency is named for
				scheme: 'spectrum',
				...RATIO_STEPS,
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
				...HERTZ,
				color: DIAL_COLORS.frequency,
				// Red low to violet high, like the spectrum a frequency is named for
				scheme: 'spectrum',
				...RATIO_STEPS,
			},
			{ property: 'Shape', kind: 'enum' },
			// Narrowest at the minimum, opening out symmetrically as it widens. Stepped by a share of the
			// device's range, since width is Q on some devices and octaves on others, with limits to match
			{
				property: 'WidthParameter',
				label: 'Width',
				kind: 'dial',
				dial: 'width',
				color: DIAL_COLORS.width,
				...RANGE_STEPS,
				// Two places, where a fine detent on the NAM is 0.064, then one from 10 up
				decimalPlaces: 2,
				unitSteps: [{ at: 10, places: 1 }],
			},
			// A gain, so it gets the same green as the Gain rotaries rather than the plain grey, and the
			// same grey below unity so a cut reads differently from a boost
			{
				property: 'InBandGain',
				label: 'Gain',
				kind: 'dial',
				dial: 'centred',
				unit: 'dB',
				color: DIAL_COLORS.gain,
				colorBelow: DIAL_COLORS.cut,
				colorZero: DIAL_COLORS.unity,
				// A tenth of a dB is as fine as a gain is ever read
				decimalPlaces: 1,
				...DEFAULT_STEPS,
			},
			{ property: 'ShapeParameter', kind: 'dial', dial: 'value', ...DEFAULT_STEPS },
		],
	},
]

/**
 * One group per filter object the device has, named after the object, holding a button for each of its
 * properties the device will let us set. Unlike the class-grouped sections, a filter's properties
 * belong together: one object is one band, and its buttons are laid out side by side.
 */
export async function getEqualiserGroups(
	self: ModuleInstance,
	presets: CompanionPresetDefinitions<OcaModuleTypes>,
): Promise<CompanionPresetGroup<OcaModuleTypes>[]> {
	return objectGroups(self, 'eq', EQ_CLASSES, presets)
}
