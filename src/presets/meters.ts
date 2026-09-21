import type {
	CompanionLayeredButtonPresetDefinition,
	CompanionPresetDefinitions,
	CompanionPresetGroup,
} from '@companion-module/base'
import type ModuleInstance from '../main.js'
import type { OcaModuleTypes } from '../types.js'
import { OCA_CLASS_NAMES } from '../consts/aes70-constants.js'
import { ocaClassNameToLabel } from '../utils.js'
import { CompositeElementId, METER_DEFAULT_COLOR, METER_PADDING, METER_THICKNESS } from '../composites.js'
import { classGroups, DIAL_COLORS, labelElements, METER_ID, numberWithUnit, templateText } from './consts.js'

/** The classes with meter presets. Add a class here and to METER_CLASSES to give it presets. */
export type MeterClassName =
	| typeof OCA_CLASS_NAMES.OcaLevelSensor
	| typeof OCA_CLASS_NAMES.OcaAudioLevelSensor
	| typeof OCA_CLASS_NAMES.OcaTimeIntervalSensor
	| typeof OCA_CLASS_NAMES.OcaFrequencySensor
	| typeof OCA_CLASS_NAMES.OcaTemperatureSensor
	| typeof OCA_CLASS_NAMES.OcaVoltageSensor
	| typeof OCA_CLASS_NAMES.OcaCurrentSensor
	| typeof OCA_CLASS_NAMES.OcaImpedanceSensor
	| typeof OCA_CLASS_NAMES.OcaGainSensor
	| typeof OCA_CLASS_NAMES.OcaInt8Sensor
	| typeof OCA_CLASS_NAMES.OcaInt16Sensor
	| typeof OCA_CLASS_NAMES.OcaInt32Sensor
	| typeof OCA_CLASS_NAMES.OcaInt64Sensor
	| typeof OCA_CLASS_NAMES.OcaUint8Sensor
	| typeof OCA_CLASS_NAMES.OcaUint16Sensor
	| typeof OCA_CLASS_NAMES.OcaUint32Sensor
	| typeof OCA_CLASS_NAMES.OcaUint64Sensor
	| typeof OCA_CLASS_NAMES.OcaFloat32Sensor
	| typeof OCA_CLASS_NAMES.OcaFloat64Sensor

/** A class whose objects each get a button showing a reading, as a number and as a bar. */
export interface MeterClass {
	readonly className: MeterClassName
	/** The number property read. */
	readonly property: string
	/** The unit shown after the reading, where the class is defined in one. */
	readonly unit?: string
	/**
	 * The single colour the bar is drawn in. Left out by the signal level classes, which keep the audio
	 * metering scale: green through to red is about headroom, and says nothing useful about a voltage.
	 */
	readonly color?: number
}

/** A reading that isn't a signal level is drawn plainly, in the same grey as a rotary's dial. */
const METER_PLAIN = { color: DIAL_COLORS.plain } as const

export const METER_CLASSES: readonly MeterClass[] = [
	{ className: OCA_CLASS_NAMES.OcaLevelSensor, property: 'Reading', unit: 'dB' },
	// Reading is inherited from OcaLevelSensor. Its own Law is which averaging algorithm produced the
	// reading, not a level, so it isn't what the meter shows
	{ className: OCA_CLASS_NAMES.OcaAudioLevelSensor, property: 'Reading', unit: 'dB' },
	// Units follow AES70's SI convention for each class. Only the temperature one is stated outright in
	// aes70's own typings ("Units of measure are Celsius"); the rest are the unit the class is named for
	{ className: OCA_CLASS_NAMES.OcaTimeIntervalSensor, property: 'Reading', unit: 's', ...METER_PLAIN },
	{ className: OCA_CLASS_NAMES.OcaFrequencySensor, property: 'Reading', unit: 'Hz', ...METER_PLAIN },
	{ className: OCA_CLASS_NAMES.OcaTemperatureSensor, property: 'Reading', unit: '°C', ...METER_PLAIN },
	{ className: OCA_CLASS_NAMES.OcaVoltageSensor, property: 'Reading', unit: 'V', ...METER_PLAIN },
	{ className: OCA_CLASS_NAMES.OcaCurrentSensor, property: 'Reading', unit: 'A', ...METER_PLAIN },
	// aes70 describes the reading as a magnitude and a phase, but only the magnitude comes back as Reading
	{ className: OCA_CLASS_NAMES.OcaImpedanceSensor, property: 'Reading', unit: 'Ω', ...METER_PLAIN },
	// A dynamics element's instantaneous gain, so metering colours would read as headroom it isn't
	{ className: OCA_CLASS_NAMES.OcaGainSensor, property: 'Reading', unit: 'dB', ...METER_PLAIN },
	// The bare number classes carry no unit: what they measure is up to the device
	{ className: OCA_CLASS_NAMES.OcaInt8Sensor, property: 'Reading', ...METER_PLAIN },
	{ className: OCA_CLASS_NAMES.OcaInt16Sensor, property: 'Reading', ...METER_PLAIN },
	{ className: OCA_CLASS_NAMES.OcaInt32Sensor, property: 'Reading', ...METER_PLAIN },
	// aes70 decodes a 64-bit reading as a number within the safe range and a BigInt beyond it. Companion's
	// isNumber accepts either, so the label and bar still work, with the precision loss that implies
	{ className: OCA_CLASS_NAMES.OcaInt64Sensor, property: 'Reading', ...METER_PLAIN },
	{ className: OCA_CLASS_NAMES.OcaUint8Sensor, property: 'Reading', ...METER_PLAIN },
	{ className: OCA_CLASS_NAMES.OcaUint16Sensor, property: 'Reading', ...METER_PLAIN },
	{ className: OCA_CLASS_NAMES.OcaUint32Sensor, property: 'Reading', ...METER_PLAIN },
	{ className: OCA_CLASS_NAMES.OcaUint64Sensor, property: 'Reading', ...METER_PLAIN },
	{ className: OCA_CLASS_NAMES.OcaFloat32Sensor, property: 'Reading', ...METER_PLAIN },
	{ className: OCA_CLASS_NAMES.OcaFloat64Sensor, property: 'Reading', ...METER_PLAIN },
]

/**
 * A meter's reading is live and changes constantly, so it is shown to fewer places than a value the user
 * set: at VALUE_DECIMAL_PLACES the last digits would be unreadable noise.
 */
const METER_DECIMAL_PLACES = 1

/** The button's local variable, holding the getter's reading and limits together. */
const METER_LEVEL_VARIABLE = 'level'

/** An expression for a meter's label: the object's role path, then its reading below, once it is known. */
function meterLabel(rolePath: string, value: string, unit?: string): string {
	return '`' + templateText(rolePath) + '\\n${' + numberWithUnit(value, METER_DECIMAL_PLACES, unit) + '}`'
}

/**
 * A button for the object at `rolePath` showing its reading as a number and as a bar along the bottom edge.
 * Nothing here writes to the device, so the button has no actions.
 *
 * The bar runs between the sensor's own limits, which the getter returns alongside the reading, so all
 * three come from one read and the colour stops follow whatever range the device reports. Until that read
 * arrives none of them is a number, and the bar has nothing to draw.
 *
 * A class that names a colour is drawn in it; the signal level classes name none and keep the metering scale.
 */
function meterPreset(meter: MeterClass, rolePath: string): CompanionLayeredButtonPresetDefinition<OcaModuleTypes> {
	const { className, property, color } = meter
	// Without sync the getter's result arrives whole, as { values: [reading, min, max] }
	const [level, min, max] = [0, 1, 2].map((index) => `$(local:${METER_LEVEL_VARIABLE}).values[${index}]`)
	return {
		type: 'layered',
		name: `${ocaClassNameToLabel(className)} - ${rolePath}`,
		elements: [
			// The label stops above the bar, so a long role path never runs under it
			...labelElements(
				{ isExpression: true, value: meterLabel(rolePath, level, meter.unit) },
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
					scheme: color === undefined ? 'meter' : 'custom',
					color: color ?? METER_DEFAULT_COLOR,
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

/** One group per sensor class the device has, each holding a meter for every object of it. */
export async function getMeterGroups(
	self: ModuleInstance,
	presets: CompanionPresetDefinitions<OcaModuleTypes>,
): Promise<CompanionPresetGroup<OcaModuleTypes>[]> {
	return classGroups(self, 'meter', 'read', METER_CLASSES, meterPreset, presets)
}
