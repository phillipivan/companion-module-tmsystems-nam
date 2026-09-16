import { describe, it, expect } from 'vitest'
import { OcaMuteState } from 'aes70/src/types/OcaMuteState.js'
import { OcaParametricEQShape } from 'aes70/src/types/OcaParametricEQShape.js'
import { OcaModelDescription } from 'aes70/src/types/OcaModelDescription.js'
import { enumChoices, enumExpressionDescription, enumValuesOf, isAes70Enum, type Aes70EnumValue } from '../enums.js'

/**
 * Built against real aes70 enums. `isEnum` and the static `values()` exist only at
 * runtime, not in aes70's typings, so these tests are what catch an aes70 upgrade
 * that changes them.
 */

/** Narrows an aes70 enum constant, whose typings lack isEnum and name, the way the module does at runtime. */
function asEnum(value: unknown): Aes70EnumValue {
	if (!isAes70Enum(value)) throw new Error('Not an aes70 enum value')
	return value
}

/** An aes70 enum value for a number the enum does not define, as a device might report. */
function outsideTheEnum(value: number): unknown {
	return new (OcaParametricEQShape as unknown as new (value: number) => unknown)(value)
}

describe('aes70 enum support', () => {
	it('recognises an aes70 enum value', () => {
		expect(isAes70Enum(OcaMuteState.Muted)).toBe(true)
	})

	it('does not take other objects with toString or a numeric valueOf for enums', () => {
		const others: unknown[] = [
			new OcaModelDescription('T&M Media', 'NAM', '3'),
			new Date(),
			Object(2),
			[1, 2],
			2,
			'Muted',
			null,
			undefined,
		]
		for (const value of others) expect(isAes70Enum(value)).toBe(false)
	})

	it('reads the whole enum from any one of its values', () => {
		expect(enumValuesOf(asEnum(OcaMuteState.Unmuted))).toEqual({ Muted: 1, Unmuted: 2 })
	})

	it('still recognises a value outside the enum, which has no name', () => {
		const value = asEnum(outsideTheEnum(200))

		expect(value.name).toBeUndefined()
		expect(value.valueOf()).toBe(200)
		expect(enumValuesOf(value)).toEqual(enumValuesOf(asEnum(OcaParametricEQShape.PEQ)))
	})

	it('builds dropdown choices with the numeric value as id and a spaced label', () => {
		const choices = enumChoices(enumValuesOf(asEnum(OcaParametricEQShape.PEQ)))

		expect(choices).toHaveLength(13)
		expect(choices).toContainEqual({ id: 2, label: 'Low Shelv' })
		expect(choices).toContainEqual({ id: 9, label: 'Tone Control Low Fixed' })
	})

	it('describes a long contiguous enum as a range, and otherwise lists its values', () => {
		expect(enumExpressionDescription(enumValuesOf(asEnum(OcaParametricEQShape.PEQ)))).toBe('Accepted values: 0 - 12')
		expect(enumExpressionDescription(enumValuesOf(asEnum(OcaMuteState.Muted)))).toBe('Accepted values: 1 | 2')
	})
})
