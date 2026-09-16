import type { DropdownChoice } from '@companion-module/base'
import { ocaClassNameToLabel } from './utils.js'

/*
 * aes70 enum support, read from the enum values themselves rather than from a table
 * of which class property uses which enum. A value carries its whole enum, so
 * inherited properties, vendor classes, and enums or members added in later aes70
 * releases all work without changes here.
 *
 * `isEnum` and the static `values()` exist on aes70's Enum classes at runtime but not
 * in its typings. enums.spec.ts pins both against real aes70 enums, so an aes70
 * upgrade that changes them fails the tests rather than quietly dropping enum support.
 */

/** Every member of an enum by name, e.g. `{ Muted: 1, Unmuted: 2 }`. */
export type EnumValues = Readonly<Record<string, number>>

/** An aes70 enum value, e.g. `OcaMuteState.Muted`. */
export interface Aes70EnumValue {
	readonly isEnum: true
	/** The member name, or `undefined` for a value outside the enum. */
	readonly name: string | undefined
	valueOf(): number
}

/**
 * True for an aes70 enum value. Checking for `toString` or a numeric `valueOf` would
 * not do: every object has both, and a Date or boxed number has a numeric `valueOf`.
 */
export function isAes70Enum(value: unknown): value is Aes70EnumValue {
	return typeof value === 'object' && value !== null && (value as { isEnum?: unknown }).isEnum === true
}

/**
 * Every member of the enum `value` belongs to. This is the whole enum as aes70 defines
 * it, not the members a particular device or object supports: AES70 has no general way
 * to ask for those, so a device refuses an unsupported value when it is set.
 */
export function enumValuesOf(value: Aes70EnumValue): EnumValues {
	return (value.constructor as unknown as { values(): EnumValues }).values()
}

/** Dropdown choices for an enum: the numeric value as the id, the member name as the label. */
export function enumChoices(values: EnumValues): DropdownChoice<number>[] {
	return Object.entries(values).map(([name, id]) => ({ id, label: ocaClassNameToLabel(name) }))
}

/** Describes the values an expression may produce for an enum option. */
export function enumExpressionDescription(values: EnumValues): string {
	const ids = Object.values(values)
	const min = Math.min(...ids)
	const max = Math.max(...ids)
	const isContiguous = ids.length === max - min + 1

	if (isContiguous && ids.length > 5) {
		return `Accepted values: ${min} - ${max}`
	}
	return `Accepted values: ${ids.join(' | ')}`
}
