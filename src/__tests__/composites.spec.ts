import { describe, it, expect, vi, type Mock } from 'vitest'
import type { CompanionGraphicsCompositeElementDefinitions } from '@companion-module/base'
import {
	CompositeElementId,
	METER_DEFAULT_MAX,
	METER_DEFAULT_MIN,
	METER_STOPS,
	UpdateCompositeElements,
	type CompositeElementSchema,
} from '../composites.js'
import type ModuleInstance from '../main.js'

type Definitions = CompanionGraphicsCompositeElementDefinitions<CompositeElementSchema>

function defineElements(): { definitions: Definitions; meter: NonNullable<Definitions[CompositeElementId.Meter]> } {
	const setCompositeElementDefinitions: Mock<(definitions: Definitions) => void> = vi.fn()
	UpdateCompositeElements({ setCompositeElementDefinitions } as unknown as ModuleInstance)
	const definitions = setCompositeElementDefinitions.mock.lastCall?.[0]
	if (!definitions) throw new Error('No composite elements were defined')
	const meter = definitions[CompositeElementId.Meter]
	if (!meter) throw new Error('No meter element was defined')
	return { definitions, meter }
}

/** The gauge one of the composites is made of. */
function gaugeOf(id: CompositeElementId): Record<string, unknown> {
	const { definitions } = defineElements()
	const gauge = definitions[id]?.elements.find((element) => element.type === 'gauge')
	if (!gauge) throw new Error(`${id} has no gauge`)
	return gauge
}

const meterGauge = (): Record<string, unknown> => gaugeOf(CompositeElementId.Meter)

/**
 * Where a point on a ring gauge's arc sits on a clock face, by Companion's maths
 * (`LayeredRenderer.ts:596-620`): angles are degrees clockwise from 12 o'clock, and the arc runs
 * clockwise from `startAngle` for `sweep` degrees.
 */
function clockPosition(degrees: number): number {
	const hour = (degrees / 30) % 12
	return ((hour % 12) + 12) % 12 || 12
}

/** The arc's clockwise span, the way the renderer derives it; a span of 0 would mean a full circle. */
function sweepDegrees(start: number, end: number): number {
	return (((end - start) % 360) + 360) % 360 || 360
}

describe('composite elements', () => {
	it('offers a meter taking a level and the two ends of the range it draws', () => {
		const { meter } = defineElements()

		expect(meter.options.map((option) => option.id)).toEqual(['level', 'min', 'max', 'position', 'padding'])
		// A reading is in whatever unit its class is defined in, so nothing here is limited to a dB range
		for (const id of ['level', 'min', 'max']) {
			const option = meter.options.find((o) => o.id === id)
			expect(option, id).toMatchObject({ type: 'number', min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER })
		}
		expect(meter.options.find((o) => o.id === 'position')).toMatchObject({ default: 'bottom' })
	})

	it('draws the bar between the given ends, from the given level', () => {
		const gauge = meterGauge()

		expect(gauge.min).toEqual({ isExpression: true, value: '$(options:min)' })
		expect(gauge.max).toEqual({ isExpression: true, value: '$(options:max)' })
		expect(gauge.value).toEqual({ isExpression: true, value: '$(options:level)' })
	})

	it('spaces its colour stops across the range, rather than at fixed levels', () => {
		const gauge = meterGauge()

		expect((gauge.stops as { value: unknown }[]).map((stop) => stop.value)).toEqual([
			// The bottom of the bar, wherever that is
			{ isExpression: true, value: '$(options:min)' },
			{ isExpression: true, value: '$(options:min) + ($(options:max) - $(options:min)) * 0.3333333333333333' },
			{ isExpression: true, value: '$(options:min) + ($(options:max) - $(options:min)) * 0.6666666666666666' },
			{ isExpression: true, value: '$(options:min) + ($(options:max) - $(options:min)) * 0.8' },
			{ isExpression: true, value: '$(options:min) + ($(options:max) - $(options:min)) * 0.9' },
		])
		// Every stop blends into the next, so the bar is a gradient rather than five bands
		expect((gauge.stops as { gradient: unknown }[]).every((stop) => stop.gradient === true)).toBe(true)
	})

	it("draws the dial as an arc from 8 o'clock round through 12 to 4, leaving the bottom undrawn", () => {
		const gauge = gaugeOf(CompositeElementId.Dial)
		const start = gauge.startAngle as number
		const end = gauge.endAngle as number

		expect(gauge.orientation).toBe('ring')
		expect(clockPosition(start)).toBe(8)
		expect(clockPosition(end)).toBe(4)
		// Clockwise from 8 up through 12 and down to 4, so the bottom 120 degrees is never drawn
		expect(sweepDegrees(start, end)).toBe(240)
		// Halfway along the arc is straight up
		expect(clockPosition(start + sweepDegrees(start, end) / 2)).toBe(12)
	})

	it('fills the dial from the given value and range, in one colour defaulting to green', () => {
		const { definitions } = defineElements()
		const dial = definitions[CompositeElementId.Dial]
		if (!dial) throw new Error('No dial element was defined')
		const gauge = gaugeOf(CompositeElementId.Dial)

		expect(dial.options.map((option) => option.id)).toEqual(['level', 'min', 'max', 'color'])
		expect(dial.options.find((o) => o.id === 'color')).toMatchObject({ type: 'colorpicker', default: 0x00cc00 })
		expect(gauge.value).toEqual({ isExpression: true, value: '$(options:level)' })
		expect(gauge.min).toEqual({ isExpression: true, value: '$(options:min)' })
		expect(gauge.max).toEqual({ isExpression: true, value: '$(options:max)' })
		// One stop, whose colour is the chosen one, since multiColour off paints the fill in the active stop
		expect(gauge.multiColour).toBe(false)
		expect(gauge.stops).toEqual([
			{
				value: { isExpression: true, value: '$(options:min)' },
				color: { isExpression: true, value: '$(options:color)' },
				gradient: false,
			},
		])
	})

	// The renderer centres a ring and takes its radius from the shorter side, so a centred square keeps it round
	it('insets the dial from every edge, so it scales with the button without touching its sides', () => {
		const gauge = gaugeOf(CompositeElementId.Dial)
		const { x, y, width, height } = gauge as Record<string, number>

		// Square, so the ring is a circle rather than sitting inside an ellipse
		expect(width).toBe(height)
		// Centred, so the gap is the same at 12, 3, 6 and 9 o'clock
		expect(x).toBe(y)
		expect(x).toBeGreaterThan(0)
		expect(x + width).toBe(100 - x)
	})

	// So a meter left on the defaults matches one from companion-module-turtleav-mineola, whose stops are fixed there
	it('puts the stops at mineola’s dB levels when left on the default range', () => {
		const levels = METER_STOPS.map((stop) => METER_DEFAULT_MIN + (METER_DEFAULT_MAX - METER_DEFAULT_MIN) * stop.at)

		expect(levels).toHaveLength(5)
		for (const [index, expected] of [-60, -40, -20, -12, -6].entries()) {
			expect(levels[index], `stop ${index}`).toBeCloseTo(expected, 10)
		}
	})
})
