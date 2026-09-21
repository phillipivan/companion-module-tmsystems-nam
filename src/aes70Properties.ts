import { OcaBoolean } from 'aes70/src/OCP1/OcaBoolean.js'
import { OcaString } from 'aes70/src/OCP1/OcaString.js'
import { OcaInt8 } from 'aes70/src/OCP1/OcaInt8.js'
import { OcaInt16 } from 'aes70/src/OCP1/OcaInt16.js'
import { OcaInt32 } from 'aes70/src/OCP1/OcaInt32.js'
import { OcaUint8 } from 'aes70/src/OCP1/OcaUint8.js'
import { OcaUint16 } from 'aes70/src/OCP1/OcaUint16.js'
import { OcaUint32 } from 'aes70/src/OCP1/OcaUint32.js'
import { OcaFloat32 } from 'aes70/src/OCP1/OcaFloat32.js'
import { OcaFloat64 } from 'aes70/src/OCP1/OcaFloat64.js'
import type { OcaRoot } from 'aes70/src/controller/ControlClasses.js'
import { enumValuesOf, isAes70Enum, type EnumValues } from './enums.js'
import { accessorName } from './utils.js'

/*
 * The settable properties of an aes70 control class, typed from aes70's own class
 * definition rather than from a value read off the device.
 *
 * The action's value inputs are built from these, so they stay the same however many
 * properties are discovered on the device. That matters because Companion stores a
 * default for every option when an action is created, and nothing for an option added
 * to the definition afterwards: such an option would reach the action as `false`, as an
 * empty string, or fail validation, instead of the default the editor shows.
 *
 * Types come from each property's encoder in aes70: the primitive encoders by identity,
 * and an enum by the member values its encoder exposes. Both are aes70 implementation
 * details, so aes70Properties.spec.ts pins them against real aes70 classes.
 */

export type SettableProperty =
	| { readonly name: string; readonly kind: 'boolean' | 'string' | 'number' }
	| { readonly name: string; readonly kind: 'enum'; readonly enumValues: EnumValues }

export type SettableKind = SettableProperty['kind']

/**
 * Encoders that map to a simple input. OcaInt64 and OcaUint64 are deliberately absent:
 * they decode to a bigint, which a number input cannot represent.
 */
const PRIMITIVE_KINDS = new Map<unknown, 'boolean' | 'string' | 'number'>([
	[OcaBoolean, 'boolean'],
	[OcaString, 'string'],
	[OcaInt8, 'number'],
	[OcaInt16, 'number'],
	[OcaInt32, 'number'],
	[OcaUint8, 'number'],
	[OcaUint16, 'number'],
	[OcaUint32, 'number'],
	[OcaFloat32, 'number'],
	[OcaFloat64, 'number'],
])

/** The enum an encoder encodes, found through the member values it exposes, or `undefined`. */
function enumValuesOfEncoder(encoder: object): EnumValues | undefined {
	for (const name of Object.getOwnPropertyNames(encoder)) {
		let member: unknown
		try {
			member = (encoder as Record<string, unknown>)[name]
		} catch {
			continue
		}
		if (isAes70Enum(member)) return enumValuesOf(member)
	}
	return undefined
}

/**
 * Every property of `obj`'s class that aes70 can set and an action can offer an input
 * for, in aes70's declaration order, inherited ones first. Properties without a setter,
 * 64-bit integers and structured types are left out.
 */
export function settablePropertiesOf(obj: OcaRoot): SettableProperty[] {
	const settable: SettableProperty[] = []
	obj.get_properties().forEach((property) => {
		// Not `Set${name}`: a few of aes70's setters are named after one of the property's aliases
		if (accessorName(obj, 'Set', property.name) === undefined) return
		const encoder = property.type?.[0]
		if (typeof encoder !== 'object' || encoder === null) return

		const primitive = PRIMITIVE_KINDS.get(encoder)
		if (primitive) {
			settable.push({ name: property.name, kind: primitive })
			return
		}
		const enumValues = enumValuesOfEncoder(encoder)
		if (enumValues) settable.push({ name: property.name, kind: 'enum', enumValues })
	})
	return settable
}
