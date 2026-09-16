import { describe, it, expect } from 'vitest'
import type { PropertyDescription } from '../OcaHelper.js'
import { defaultPropertyName } from '../utils.js'

function prop(name: string, level: number): PropertyDescription {
	return { name, level, type: 'number', read: true, write: true }
}

describe('defaultPropertyName', () => {
	it("picks the class's own property over inherited framework ones", () => {
		// The order an OcaFilterParametric on a real device reports them in: inherited first
		const props = [
			prop('ClassVersion', 1),
			prop('Lockable', 1),
			prop('Role', 1),
			prop('Enabled', 2),
			prop('Frequency', 4),
			prop('Shape', 4),
		]

		expect(defaultPropertyName(props)).toBe('Frequency')
	})

	it("falls back to the deepest level present when none of the class's own properties are", () => {
		expect(defaultPropertyName([prop('Role', 1), prop('Enabled', 2)])).toBe('Enabled')
	})

	it('has no default when there are no properties', () => {
		expect(defaultPropertyName([])).toBeUndefined()
	})
})
