import { combineRgb, type CompanionPresetDefinitions, type CompanionPresetGroup } from '@companion-module/base'
import type ModuleInstance from '../main.js'
import type { OcaModuleTypes } from '../types.js'
import { OCA_CLASS_NAMES } from '../consts/aes70-constants.js'
import { DEFAULT_STEPS, DIAL_COLORS, MILLISECONDS, RATIO_STEPS, rounded } from './consts.js'
import { objectGroups, type ObjectClass, type ObjectProperty } from './objectButtons.js'

/**
 * The dynamics classes with a preset group each. OcaDynamics is the processor itself; its detector
 * and curve companions describe how it measures and shapes, and are left for now.
 */
export type DynamicsClassName = typeof OCA_CLASS_NAMES.OcaDynamics

/** A gain is read to a tenth of a dB; finer than that is noise on a button. */
const GAIN_DECIMALS = 1

/** A compression ratio to a tenth, so 2.7:1 rather than 2.6666666666666665:1. */
const RATIO_DECIMALS = 1

/**
 * A time constant, a ratio and a slope are all read on a scale rather than counted, so they step by
 * proportion: a third of a doubling per detent, which on a time lands near the 1, 1.25, 1.6, 2, 2.5
 * series they are usually marked in. A fixed step would be a leap at 0.5 ms and nothing at 500 ms.
 */
const SCALED_STEPS = RATIO_STEPS

/** A ratio written the way a compressor is marked, to a tenth: 2:1, 4:1, 2.7:1. */
function ratioText(ratio: string): string {
	return '`${' + rounded(ratio, RATIO_DECIMALS) + '}:1`'
}

/** A property already held as a ratio, so only the `:1` is added. */
function asRatio(value: string): string {
	return `isNumber(${value}) ? ${ratioText(value)} : ''`
}

/**
 * A slope shown as the compression ratio it stands for. AES70 stores the slope as a fraction, where
 * `slope = 1 - 1 / ratio`, so 0.5 is 2:1 and 0.75 is 4:1 — but a compressor is read in ratios, not
 * fractions. At a slope of 1 the ratio is infinite, which is what a limiter is.
 */
function slopeAsRatio(value: string): string {
	return `isNumber(${value}) ? (${value} >= 1 ? 'Limit' : ${ratioText(`1 / (1 - ${value})`)}) : ''`
}

export const DYNAMICS_CLASSES: readonly ObjectClass<DynamicsClassName>[] = [
	{
		className: OCA_CLASS_NAMES.OcaDynamics,
		properties: [
			{ property: 'Enabled', kind: 'toggle', activeColors: { background: combineRgb(0, 153, 0) } },
			{ property: 'Function', kind: 'enum' },
			{ property: 'DetectorLaw', kind: 'enum' },
			{ property: 'ThresholdPresentationUnits', kind: 'enum' },
			// An OcaDBr: a level and the reference it is measured from. The button reads and sets the
			// level, and aes70Properties carries the reference through untouched
			{
				property: 'Threshold',
				kind: 'dial',
				dial: 'centred',
				field: 'Value',
				unit: 'dB',
				decimalPlaces: GAIN_DECIMALS,
				color: DIAL_COLORS.gain,
				colorZero: DIAL_COLORS.unity,
				colorBelow: DIAL_COLORS.cut,
				...DEFAULT_STEPS,
			},
			// Deprecated in AES70 in favour of Slope, but still implemented by devices, and shown the
			// same way so the two read alike where a device has both
			{
				property: 'Ratio',
				kind: 'dial',
				dial: 'value',
				color: DIAL_COLORS.ratio,
				displayAs: asRatio,
				...SCALED_STEPS,
			},
			{
				property: 'AttackTime',
				kind: 'dial',
				dial: 'value',
				unit: 's',
				unitSteps: [MILLISECONDS],
				color: DIAL_COLORS.time,
				...SCALED_STEPS,
			},
			{
				property: 'ReleaseTime',
				kind: 'dial',
				dial: 'value',
				unit: 's',
				unitSteps: [MILLISECONDS],
				color: DIAL_COLORS.time,
				...SCALED_STEPS,
			},
			{
				property: 'HoldTime',
				kind: 'dial',
				dial: 'value',
				unit: 's',
				unitSteps: [MILLISECONDS],
				color: DIAL_COLORS.time,
				...SCALED_STEPS,
			},
			// The two ends of the gain the processor may apply, so they read against 0 dB like any gain
			{
				property: 'DynamicGainCeiling',
				kind: 'dial',
				dial: 'centred',
				unit: 'dB',
				decimalPlaces: GAIN_DECIMALS,
				color: DIAL_COLORS.gain,
				colorZero: DIAL_COLORS.unity,
				colorBelow: DIAL_COLORS.cut,
				...DEFAULT_STEPS,
			},
			{
				property: 'DynamicGainFloor',
				kind: 'dial',
				dial: 'centred',
				unit: 'dB',
				decimalPlaces: GAIN_DECIMALS,
				color: DIAL_COLORS.gain,
				colorZero: DIAL_COLORS.unity,
				colorBelow: DIAL_COLORS.cut,
				...DEFAULT_STEPS,
			},
			{ property: 'KneeParameter', kind: 'dial', dial: 'value', ...DEFAULT_STEPS },
			// Slope replaces the deprecated Ratio, and is a bounded fraction rather than a count: a
			// Sonance DSP reports 0 to 1, where 0.5 is 2:1 and 1 is limiting. So it steps a flat part of
			// that range, not by proportion — a ratio step spends a dozen detents crawling out of zero.
			{
				property: 'Slope',
				kind: 'dial',
				dial: 'value',
				color: DIAL_COLORS.ratio,
				stepSize: 0.05,
				fine: true,
				displayAs: slopeAsRatio,
			},
		] satisfies readonly ObjectProperty[],
	},
]

/**
 * One group per dynamics object the device has, named after the object, holding a button for each of
 * its properties the device will let us set. Grouped by object like the equalisers: one object is one
 * compressor or gate, and its buttons are laid out side by side.
 */
export async function getDynamicsGroups(
	self: ModuleInstance,
	presets: CompanionPresetDefinitions<OcaModuleTypes>,
): Promise<CompanionPresetGroup<OcaModuleTypes>[]> {
	return objectGroups(self, 'dyn', DYNAMICS_CLASSES, presets)
}
