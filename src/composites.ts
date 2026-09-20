import {
	combineRgb,
	type ButtonGraphicsGaugeElement,
	type CompanionGraphicsCompositeElementDefinitions,
	type DropdownChoice,
	type SomeCompanionFeedbackInputField,
} from '@companion-module/base'
import type ModuleInstance from './main.js'

/**
 * Composite graphics elements this module offers for layered buttons. The meter is modelled on the one in
 * companion-module-turtleav-mineola, itself modelled on the `vumeter` composite in
 * companion-module-glensound-divine, with the same bar thickness, end inset and edge padding, so meters from
 * the three modules line up on a page.
 *
 * Unlike those, an AES70 sensor reads in whatever unit its class is defined in, over whatever span the device
 * chooses, so the meter's ends are options rather than fixed at -60..0 dB, and the colour stops are placed
 * across whatever range it is given.
 */
export enum CompositeElementId {
	Meter = 'meter',
	Dial = 'dial',
	PanDial = 'pan_dial',
}

export const MeterPosition = ['left', 'right', 'top', 'bottom'] as const
export type MeterPosition = (typeof MeterPosition)[number]

const POSITION_CHOICES = [
	{ id: 'left', label: 'Left' },
	{ id: 'right', label: 'Right' },
	{ id: 'top', label: 'Top' },
	{ id: 'bottom', label: 'Bottom' },
] as const satisfies DropdownChoice<MeterPosition>[]

/** How a meter is coloured: the audio metering scale, or one colour of the user's choosing. */
export const MeterScheme = ['meter', 'custom'] as const
export type MeterScheme = (typeof MeterScheme)[number]

const SCHEME_CHOICES = [
	{ id: 'meter', label: 'Audio metering' },
	{ id: 'custom', label: 'Single colour' },
] as const satisfies DropdownChoice<MeterScheme>[]

export type CompositeElementSchema = {
	[CompositeElementId.Meter]: {
		options: {
			level: number
			min: number
			max: number
			position: MeterPosition
			padding: number
			scheme: MeterScheme
			color: number
		}
	}
	[CompositeElementId.Dial]: {
		options: { level: number; min: number; max: number; color: number }
	}
	[CompositeElementId.PanDial]: {
		options: { level: number; min: number; max: number; color: number }
	}
}

/** Percentage of the button taken up by the short axis of the bar */
export const METER_THICKNESS = 8
/** Percentage inset at each end of the bar's long axis */
const METER_INSET = 6
const METER_LENGTH = 100 - METER_INSET * 2
/** Default distance of the bar from the edge of the button, as a percentage */
export const METER_PADDING = 2

/** The ends of the bar a meter gets until it is told otherwise, in dB: a full scale audio meter. */
export const METER_DEFAULT_MIN = -60
export const METER_DEFAULT_MAX = 0

/** The single colour a meter is drawn in when it isn't using the metering scale. */
export const METER_DEFAULT_COLOR = combineRgb(0, 204, 0)

/**
 * How much of its colour the unfilled part of the bar keeps, 0 - 100. At 100 it matches the fill and a silent
 * meter looks full scale; Companion's own default is 70.
 */
const METER_TRACK_AMOUNT = 20

/**
 * Colour stops, each a fraction of the way from the meter's min to its max, so the splits follow whatever
 * range the meter is given. Every stop is a gradient, so the gauge blends each colour into the next; the
 * last, red, has nothing to blend into and runs solid from 0.9 to the top of the bar.
 *
 * The fractions are where mineola's fixed stops fall on its -60..0 dB meter, so a meter left on the default
 * range is coloured identically to one of its.
 */
export const METER_STOPS = [
	{ at: 0, color: combineRgb(0, 100, 0) }, // dark green, -60 dB on the default range
	{ at: 1 / 3, color: combineRgb(0, 204, 0) }, // green, -40 dB
	{ at: 2 / 3, color: combineRgb(255, 255, 0) }, // yellow, -20 dB
	{ at: 0.8, color: combineRgb(255, 191, 0) }, // amber, -12 dB
	{ at: 0.9, color: combineRgb(255, 0, 0) }, // red, -6 dB
] as const

/**
 * The dial's arc, as positions on a clock face. Companion measures a ring gauge's angles in degrees
 * clockwise from 12 o'clock, so an hour is 30 degrees. Running from 8 round through 12 to 4 sweeps 240
 * degrees and leaves the bottom 120 undrawn, which is where a knob's pointer never goes.
 */
const CLOCK_HOUR_DEGREES = 30
const DIAL_START_HOUR = 8
const DIAL_END_HOUR = 4

/** How thick the ring is, as a percentage of its radius. Companion allows 1 to 50. */
const DIAL_RING_WIDTH = 15

/**
 * How far the ring is held back from each edge of the button, as a percentage. At 0 the ring touches the
 * edge at 12, 3, 6 and 9 o'clock, since its radius is half the shorter side.
 */
const DIAL_PADDING = 5
const DIAL_DIAMETER = 100 - DIAL_PADDING * 2

/** How much colour the untravelled part of the arc keeps, so the dial still reads as one. */
const DIAL_TRACK_AMOUNT = 20

/**
 * How long the pan dial's marker bead is along the arc, as a percentage of the ring's thickness, so at 100
 * it is as long as the ring is thick and reads as a dot rather than a hairline. Companion's own default, 15,
 * would come out under a pixel and be clamped to one.
 */
const DIAL_MARKER_WIDTH = 100

/** `hour` on a clock face as a gauge angle. */
function clockAngle(hour: number): number {
	return (hour % 12) * CLOCK_HOUR_DEGREES
}

const POSITION = `$(options:position)`
const PADDING = `$(options:padding)`
const MIN = `$(options:min)`
const MAX = `$(options:max)`
const COLOR = `$(options:color)`
const IS_VERTICAL = `(${POSITION} == 'left' || ${POSITION} == 'right')`
const IS_METERING = `$(options:scheme) == '${SCHEME_CHOICES[0].id}'`

/** Where `stop` sits on a bar running from the meter's min to its max. */
function stopValue(at: number): string {
	if (at === 0) return MIN
	return `${MIN} + (${MAX} - ${MIN}) * ${at}`
}

/** Halfway between the dial's ends, which a pan dial fills out from. */
const MIDPOINT = `(${MIN} + ${MAX}) / 2`

/** The options both dials take, differing only in what their ends mean and their colour. */
function dialOptions(
	minimumTooltip: string,
	defaultColor: number,
): SomeCompanionFeedbackInputField<keyof CompositeElementSchema[CompositeElementId.Dial]['options']>[] {
	return [
		{
			type: 'number',
			label: 'Value',
			id: 'level',
			tooltip: 'Set this to the property value, e.g. $(local:range).values[0]',
			min: Number.MIN_SAFE_INTEGER,
			max: Number.MAX_SAFE_INTEGER,
			default: 0,
		},
		{
			type: 'number',
			label: 'Minimum',
			id: 'min',
			tooltip: minimumTooltip,
			min: Number.MIN_SAFE_INTEGER,
			max: Number.MAX_SAFE_INTEGER,
			default: 0,
		},
		{
			type: 'number',
			label: 'Maximum',
			id: 'max',
			tooltip: 'The value at the full end of the arc',
			min: Number.MIN_SAFE_INTEGER,
			max: Number.MAX_SAFE_INTEGER,
			default: 100,
		},
		{ type: 'colorpicker', label: 'Colour', id: 'color', default: defaultColor, returnType: 'number' },
	]
}

/**
 * The ring both dials are drawn with. `centred` fills out from the midpoint of the range rather than up
 * from the minimum, so a value above centre runs clockwise towards the DIAL_END_HOUR end of the arc and one
 * below runs anticlockwise towards DIAL_START_HOUR. 12 o'clock is halfway along, so that is where it starts.
 *
 * A centred dial also carries a marker bead. The renderer draws that at the value whether or not there is
 * any fill (`LayeredRenderer.ts:794`), which is what leaves a dot at 12 o'clock when the value sits exactly
 * at the midpoint and the fill is empty.
 */
function dialGauge(centred: boolean): ButtonGraphicsGaugeElement {
	return {
		type: 'gauge',
		name: centred ? 'Pan Dial' : 'Dial',
		// The renderer centres the ring and takes its radius from the shorter side, so a square
		// inset from every edge stays circular, scales with whatever it is drawn on, and keeps
		// clear of the button's edges
		x: DIAL_PADDING,
		y: DIAL_PADDING,
		width: DIAL_DIAMETER,
		height: DIAL_DIAMETER,
		orientation: 'ring',
		startAngle: clockAngle(DIAL_START_HOUR),
		endAngle: clockAngle(DIAL_END_HOUR),
		ringWidth: DIAL_RING_WIDTH,
		roundedEnds: true,
		min: { isExpression: true, value: MIN },
		max: { isExpression: true, value: MAX },
		value: { isExpression: true, value: '$(options:level)' },
		fillEnabled: true,
		// One colour over the whole arc, rather than a scale, so the single stop is all it needs
		multiColour: false,
		stops: [
			{ value: { isExpression: true, value: MIN }, color: { isExpression: true, value: COLOR }, gradient: false },
		],
		// The untravelled part of the arc stays faintly visible, so the dial reads as a dial
		trackStyle: 'dimmed',
		trackAmount: DIAL_TRACK_AMOUNT,
		...(centred
			? {
					origin: { isExpression: true, value: MIDPOINT },
					markerEnabled: true,
					markerColor: { isExpression: true, value: COLOR },
					markerWidth: DIAL_MARKER_WIDTH,
				}
			: {}),
	}
}

export function UpdateCompositeElements(self: ModuleInstance): void {
	const compositeElements: CompanionGraphicsCompositeElementDefinitions<CompositeElementSchema> = {
		[CompositeElementId.Meter]: {
			type: 'composite',
			name: 'Signal Meter',
			description:
				'A bargraph meter for a sensor reading. Feed it a level, e.g. a local variable driven by a Get Property feedback, and the ends of the range it should draw',
			options: [
				{
					type: 'number',
					label: 'Level',
					id: 'level',
					tooltip: 'Set this to a sensor reading, e.g. $(local:level)',
					min: Number.MIN_SAFE_INTEGER,
					max: Number.MAX_SAFE_INTEGER,
					default: METER_DEFAULT_MIN,
				},
				{
					type: 'number',
					label: 'Minimum',
					id: 'min',
					tooltip: 'The reading at the empty end of the bar',
					min: Number.MIN_SAFE_INTEGER,
					max: Number.MAX_SAFE_INTEGER,
					default: METER_DEFAULT_MIN,
				},
				{
					type: 'number',
					label: 'Maximum',
					id: 'max',
					tooltip: 'The reading at the full end of the bar',
					min: Number.MIN_SAFE_INTEGER,
					max: Number.MAX_SAFE_INTEGER,
					default: METER_DEFAULT_MAX,
				},
				{
					type: 'dropdown',
					label: 'Position',
					id: 'position',
					choices: POSITION_CHOICES,
					default: POSITION_CHOICES[3].id,
				},
				{
					type: 'number',
					label: 'Padding',
					id: 'padding',
					tooltip: 'Distance from the edge of the button, as a percentage',
					min: 0,
					max: 40,
					default: METER_PADDING,
				},
				{
					type: 'dropdown',
					label: 'Colours',
					id: 'scheme',
					tooltip:
						'The metering scale runs green to red across the range; a single colour suits a reading that is not a signal level',
					choices: SCHEME_CHOICES,
					default: SCHEME_CHOICES[0].id,
				},
				{
					type: 'colorpicker',
					label: 'Colour',
					id: 'color',
					tooltip: 'Used when Colours is set to a single colour',
					default: METER_DEFAULT_COLOR,
					returnType: 'number',
				},
			],
			elements: [
				{
					type: 'gauge',
					name: 'Meter',
					x: {
						isExpression: true,
						value: `${POSITION} == 'left' ? ${PADDING} : (${POSITION} == 'right' ? 100 - ${PADDING} - ${METER_THICKNESS} : ${METER_INSET})`,
					},
					y: {
						isExpression: true,
						value: `${POSITION} == 'top' ? ${PADDING} : (${POSITION} == 'bottom' ? 100 - ${PADDING} - ${METER_THICKNESS} : ${METER_INSET})`,
					},
					width: { isExpression: true, value: `${IS_VERTICAL} ? ${METER_THICKNESS} : ${METER_LENGTH}` },
					height: { isExpression: true, value: `${IS_VERTICAL} ? ${METER_LENGTH} : ${METER_THICKNESS}` },
					orientation: { isExpression: true, value: `${IS_VERTICAL} ? 'vertical' : 'horizontal'` },
					min: { isExpression: true, value: MIN },
					max: { isExpression: true, value: MAX },
					value: { isExpression: true, value: '$(options:level)' },
					fillEnabled: true,
					// Only the metering scale blends between its stops; a single colour is flat
					multiColour: { isExpression: true, value: IS_METERING },
					trackStyle: 'dimmed',
					trackAmount: METER_TRACK_AMOUNT,
					// The stops stay in place for either scheme. On a single colour they all resolve to it,
					// so whichever one the reading falls in, and whatever blending happens, the bar is that colour
					stops: METER_STOPS.map((stop) => ({
						value: { isExpression: true, value: stopValue(stop.at) },
						color: { isExpression: true, value: `${IS_METERING} ? ${stop.color} : ${COLOR}` },
						gradient: true,
					})),
				},
			],
		},
		[CompositeElementId.Dial]: {
			type: 'composite',
			name: 'Value Dial',
			description: `A knob-style arc running from ${DIAL_START_HOUR} o'clock up round to ${DIAL_END_HOUR}, filling from the minimum as the value rises. Feed it a value and the ends of its range, e.g. from a Get Property feedback`,
			options: dialOptions('The value at the empty end of the arc', combineRgb(0, 204, 0)),
			elements: [dialGauge(false)],
		},
		[CompositeElementId.PanDial]: {
			type: 'composite',
			name: 'Pan Dial',
			description: `A knob-style arc centred at 12 o'clock, filling clockwise towards ${DIAL_END_HOUR} o'clock above the midpoint of its range and anticlockwise towards ${DIAL_START_HOUR} below it, with a dot marking the position`,
			options: dialOptions('The value at the anticlockwise end of the arc', combineRgb(255, 255, 0)),
			elements: [dialGauge(true)],
		},
	}

	self.setCompositeElementDefinitions(compositeElements)
}
