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

/** The gauge the meter is made of. */
function meterGauge(): Record<string, unknown> {
	const { meter } = defineElements()
	const gauge = meter.elements.find((element) => element.type === 'gauge')
	if (!gauge) throw new Error('The meter has no gauge')
	return gauge
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

	// So a meter left on the defaults matches one from companion-module-turtleav-mineola, whose stops are fixed there
	it('puts the stops at mineola’s dB levels when left on the default range', () => {
		const levels = METER_STOPS.map((stop) => METER_DEFAULT_MIN + (METER_DEFAULT_MAX - METER_DEFAULT_MIN) * stop.at)

		expect(levels).toHaveLength(5)
		for (const [index, expected] of [-60, -40, -20, -12, -6].entries()) {
			expect(levels[index], `stop ${index}`).toBeCloseTo(expected, 10)
		}
	})
})
