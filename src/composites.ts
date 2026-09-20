import {
	combineRgb,
	type CompanionGraphicsCompositeElementDefinitions,
	type DropdownChoice,
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
}

export const MeterPosition = ['left', 'right', 'top', 'bottom'] as const
export type MeterPosition = (typeof MeterPosition)[number]

const POSITION_CHOICES = [
	{ id: 'left', label: 'Left' },
	{ id: 'right', label: 'Right' },
	{ id: 'top', label: 'Top' },
	{ id: 'bottom', label: 'Bottom' },
] as const satisfies DropdownChoice<MeterPosition>[]

export type CompositeElementSchema = {
	[CompositeElementId.Meter]: {
		options: { level: number; min: number; max: number; position: MeterPosition; padding: number }
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

const POSITION = `$(options:position)`
const PADDING = `$(options:padding)`
const MIN = `$(options:min)`
const MAX = `$(options:max)`
const IS_VERTICAL = `(${POSITION} == 'left' || ${POSITION} == 'right')`

/** Where `stop` sits on a bar running from the meter's min to its max. */
function stopValue(at: number): string {
	if (at === 0) return MIN
	return `${MIN} + (${MAX} - ${MIN}) * ${at}`
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
					multiColour: true,
					trackStyle: 'dimmed',
					trackAmount: METER_TRACK_AMOUNT,
					stops: METER_STOPS.map((stop) => ({
						value: { isExpression: true, value: stopValue(stop.at) },
						color: stop.color,
						gradient: true,
					})),
				},
			],
		},
	}

	self.setCompositeElementDefinitions(compositeElements)
}
