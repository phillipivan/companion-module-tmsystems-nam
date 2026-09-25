import { combineRgb, type CompanionPresetDefinitions, type CompanionPresetGroup } from '@companion-module/base'
import type ModuleInstance from '../main.js'
import type { OcaModuleTypes } from '../types.js'
import { OCA_CLASS_NAMES } from '../consts/aes70-constants.js'
import { DEFAULT_STEPS, DIAL_COLORS, HERTZ, RATIO_STEPS, SECONDS } from './consts.js'
import { objectGroups, type ObjectClass, type ObjectProperty } from './objectButtons.js'

/** The generator classes with a preset group each. */
export type SignalGeneratorClassName = typeof OCA_CLASS_NAMES.OcaSignalGenerator

/** A level is read to a tenth of a dB, as the gains elsewhere are. */
const LEVEL_DECIMALS = 1

/** Enabled and the sweep repeat both read as on or off, and turn green when they are on. */
const TOGGLE_COLORS = { activeColors: { background: combineRgb(0, 153, 0) } } as const

/**
 * A frequency, drawn and stepped as the other frequency dials are: a third of an octave per detent, a
 * logarithmic arc so every octave takes the same length of it, and the spectrum across the range.
 */
const FREQUENCY = {
	kind: 'dial',
	dial: 'value',
	...HERTZ,
	color: DIAL_COLORS.frequency,
	scheme: 'spectrum',
	...RATIO_STEPS,
} as const satisfies Omit<Extract<ObjectProperty, { kind: 'dial' }>, 'property'>

export const SIGNAL_GENERATOR_CLASSES: readonly ObjectClass<SignalGeneratorClassName>[] = [
	{
		className: OCA_CLASS_NAMES.OcaSignalGenerator,
		properties: [
			{ property: 'Enabled', kind: 'toggle', ...TOGGLE_COLORS },
			// AES70 calls this read-only, but Start() and Stop() set it, which aes70Properties declares
			// so it reaches the action, the feedback and this button like any other boolean
			{ property: 'Generating', kind: 'toggle', ...TOGGLE_COLORS },
			{ property: 'Waveform', kind: 'enum' },
			// The output level, so it reads against 0 dB like any other gain
			{
				property: 'Level',
				kind: 'dial',
				dial: 'centred',
				unit: 'dB',
				decimalPlaces: LEVEL_DECIMALS,
				color: DIAL_COLORS.gain,
				colorZero: DIAL_COLORS.unity,
				colorBelow: DIAL_COLORS.cut,
				...DEFAULT_STEPS,
			},
			// The tone, or the two ends of a sweep
			{ property: 'Frequency1', ...FREQUENCY },
			{ property: 'Frequency2', ...FREQUENCY },
			{ property: 'SweepType', kind: 'enum' },
			// A sweep is timed like a dynamics stage: read to three digits in seconds or milliseconds, and stepped by ratio
			{
				property: 'SweepTime',
				kind: 'dial',
				dial: 'value',
				...SECONDS,
				color: DIAL_COLORS.time,
				...RATIO_STEPS,
			},
			{ property: 'SweepRepeat', kind: 'toggle', ...TOGGLE_COLORS },
		] satisfies readonly ObjectProperty[],
	},
]

/**
 * One group per signal generator the device has, named after the object, holding a button for each of
 * its properties the device will let us set. Grouped by object like the equalisers and dynamics: one
 * object is one generator, and its buttons are laid out side by side.
 */
export async function getSignalGeneratorGroups(
	self: ModuleInstance,
	presets: CompanionPresetDefinitions<OcaModuleTypes>,
): Promise<CompanionPresetGroup<OcaModuleTypes>[]> {
	return objectGroups(self, 'gen', SIGNAL_GENERATOR_CLASSES, presets)
}
