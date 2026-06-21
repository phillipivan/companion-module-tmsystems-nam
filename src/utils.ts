import { ModuleConfig } from './config.js'
import { createModuleLogger } from '@companion-module/base'
import type { DropdownChoice, JsonValue, JsonObject } from '@companion-module/base'
import type { PropertyDescription } from './OcaHelper.js'

const utilsLogger = createModuleLogger('Generic OCA Utils')

export function handleBonjourHost(config: ModuleConfig): ModuleConfig {
	if (config.bonjourHost) {
		config.host = config.bonjourHost.split(':')[0]
		config.port = Number.parseInt(config.bonjourHost.split(':')[1]) || 65000
		config.protocol = 'tcp' // Bonjour only supports TCP
		utilsLogger.info(`Bonjour device selected: ${config.host}:${config.port}`)
	}
	return config
}

/**
 * Strip leading 'Oca', insert white space prior to captical letters.
 * 'OcaLevelSensor' becomes 'Level Sensor'
 * @param className
 * @returns
 */

export function ocaClassNameToLabel(className: string): string {
	return (
		className
			.replace(/^Oca/, '')
			// 1. Space between lowercase/number and an uppercase letter (e.g., 'FilterFIR' -> 'Filter FIR')
			.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
			// 2. Space before the last uppercase letter in a block *only* if followed by a lowercase letter (e.g., 'IDReader' -> 'ID Reader')
			.replace(/([A-Z]+)(?=[A-Z][a-z])/g, '$1 ')
			.trim()
	)
}

export interface MakeSafeJsonOptions {
	/**
	 * If true, Promise values will be awaited and their resolved values
	 * serialized recursively.
	 *
	 * If false (default), Promise values are omitted from objects and become
	 * null in arrays/root.
	 */
	awaitPromises?: boolean

	/**
	 * Optional hook that can intercept serialization.
	 */
	visitor?: MakeSafeJsonVisitor
}

export type MakeSafeJsonVisitorResult =
	| { action: 'continue' }
	| { action: 'omit' }
	| { action: 'replace'; value: JsonValue }

export type MakeSafeJsonVisitor = (
	path: readonly (string | number)[],
	value: unknown,
) => MakeSafeJsonVisitorResult | Promise<MakeSafeJsonVisitorResult>

const OMIT = Symbol('makeSafeJson.omit')

export async function makeSafeJsonValue(data: unknown, options: MakeSafeJsonOptions = {}): Promise<JsonValue> {
	const { awaitPromises = false, visitor } = options

	const seen = new WeakSet<object>()

	async function visit(
		value: unknown,
		path: readonly (string | number)[],
		location: 'root' | 'object' | 'array',
	): Promise<JsonValue | typeof OMIT> {
		if (visitor) {
			const result = await visitor(path, value)

			switch (result.action) {
				case 'replace':
					return result.value

				case 'omit':
					return location === 'array' || location === 'root' ? null : OMIT

				case 'continue':
					break

				default: {
					const exhaustive: never = result
					return exhaustive
				}
			}
		}

		// null / undefined
		if (value == null) {
			return null
		}

		// primitives
		switch (typeof value) {
			case 'string':
			case 'number':
			case 'boolean':
				return value

			case 'bigint':
				return value.toString()

			case 'function':
			case 'symbol':
				return location === 'array' || location === 'root' ? null : OMIT
		}

		// Promise
		if (value instanceof Promise) {
			if (!awaitPromises) {
				return location === 'array' || location === 'root' ? null : OMIT
			}

			try {
				const resolved = await value

				return visit(resolved, path, location)
			} catch {
				return null
			}
		}

		// Boxed primitives
		if (value instanceof Number || value instanceof String || value instanceof Boolean) {
			return visit(value.valueOf(), path, location)
		}

		// Date
		if (value instanceof Date) {
			return value.toISOString()
		}

		// Error
		if (value instanceof Error) {
			const out: JsonObject = {
				name: value.name,
				message: value.message,
			}

			if (typeof value.stack === 'string') {
				out.stack = value.stack
			}

			return out
		}

		// Buffer (Node.js)
		if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
			return [...value]
		}

		// ArrayBuffer
		if (value instanceof ArrayBuffer) {
			return [...new Uint8Array(value)]
		}

		// Typed arrays / DataView
		if (ArrayBuffer.isView(value)) {
			return Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
		}

		// Set
		if (value instanceof Set) {
			const out: JsonValue[] = []

			let index = 0

			for (const item of value) {
				const converted = await visit(item, [...path, index], 'array')

				out.push(converted === OMIT ? null : converted)

				index++
			}

			return out
		}

		// Map
		if (value instanceof Map) {
			const out: JsonObject = {}

			for (const [key, mapValue] of value) {
				const converted = await visit(mapValue, [...path, String(key)], 'object')

				if (converted !== OMIT) {
					out[String(key)] = converted
				}
			}

			return out
		}

		// Array
		if (Array.isArray(value)) {
			const out: JsonValue[] = []

			for (let i = 0; i < value.length; i++) {
				const converted = await visit(value[i], [...path, i], 'array')

				out.push(converted === OMIT ? null : converted)
			}

			return out
		}

		// Object / class instance
		if (typeof value === 'object') {
			if (seen.has(value)) {
				return null
			}

			seen.add(value)

			const out: JsonObject = {}

			for (const key of Reflect.ownKeys(value)) {
				if (typeof key !== 'string') {
					continue
				}

				const descriptor = Object.getOwnPropertyDescriptor(value, key)

				if (!descriptor) {
					continue
				}

				let propertyValue: unknown

				try {
					if ('get' in descriptor && descriptor.get) {
						propertyValue = descriptor.get.call(value)
					} else {
						propertyValue = (value as Record<string, unknown>)[key]
					}
				} catch {
					continue
				}

				const converted = await visit(propertyValue, [...path, key], 'object')

				if (converted !== OMIT) {
					out[key] = converted
				}
			}

			return out
		}

		// Fallback for anything exotic
		return null
	}

	const result = await visit(data, [], 'root')

	return result === OMIT ? null : result
}

export function unwrapValue(obj: JsonValue): JsonValue {
	if (
		typeof obj === 'object' &&
		obj !== null &&
		!Array.isArray(obj) &&
		Object.keys(obj).length === 1 &&
		Object.prototype.hasOwnProperty.call(obj, 'value')
	) {
		return (obj as { value: JsonValue }).value
	} else if (
		typeof obj === 'object' &&
		obj !== null &&
		!Array.isArray(obj) &&
		Object.keys(obj).length === 1 &&
		Object.prototype.hasOwnProperty.call(obj, 'values')
	) {
		return (obj as { values: JsonValue }).values
	}
	return obj
}

export function excitementEmoji(level: number): string {
	if (level < 1) return '😭'
	if (level < 10) return '😐'
	if (level < 20) return '🙂'
	if (level < 30) return '😊'
	if (level < 40) return '😄'
	if (level < 50) return '😃'
	if (level < 60) return '😁'
	if (level < 70) return '🤩'
	if (level < 80) return '🥳'
	if (level < 90) return '🤯'
	return '🚀'
}

export function makePropChoices(props: PropertyDescription[]): DropdownChoice<string>[] {
	const propertyChoices: DropdownChoice<string>[] = []
	props.forEach((prop) => {
		propertyChoices.push({ id: prop.name, label: ocaClassNameToLabel(prop.name) })
	})
	return propertyChoices
}

/**
 * Converts a TypeScript numeric enum into Companion DropdownChoice[] format.
 * - `id` is the enum's numeric value
 * - `label` is the enum member's name, passed through ocaClassNameToLabel()
 */
export function enumToDropdownChoices<E extends Record<string, string | number>>(enumObj: E): DropdownChoice<number>[] {
	return Object.keys(enumObj)
		.filter((key) => typeof enumObj[key as keyof E] === 'number')
		.map((key) => ({
			id: enumObj[key as keyof E] as number,
			label: ocaClassNameToLabel(key),
		}))
}
