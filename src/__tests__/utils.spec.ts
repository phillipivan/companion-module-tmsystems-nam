import { describe, it, expect } from 'vitest'
import type { PropertyDescription } from '../OcaHelper.js'
import { abortable, defaultPropertyName } from '../utils.js'

describe('abortable', () => {
	it('settles as the promise does when there is no signal, or it never aborts', async () => {
		await expect(abortable(Promise.resolve(1), undefined)).resolves.toBe(1)
		await expect(abortable(Promise.resolve(2), new AbortController().signal)).resolves.toBe(2)
		await expect(abortable(Promise.reject(new Error('failed')), new AbortController().signal)).rejects.toThrow('failed')
	})

	it('rejects with the reason as soon as the signal aborts, without waiting on the promise', async () => {
		const controller = new AbortController()
		const waiting = abortable(new Promise(() => undefined), controller.signal)

		controller.abort(new Error('gave up'))

		await expect(waiting).rejects.toThrow('gave up')
	})

	it('rejects straight away for a signal already aborted, and ignores the abandoned promise failing later', async () => {
		const controller = new AbortController()
		controller.abort(new Error('already aborted'))
		let failLater: ((err: Error) => void) | undefined
		const abandoned = new Promise<void>((_, reject) => (failLater = reject))

		await expect(abortable(abandoned, controller.signal)).rejects.toThrow('already aborted')

		// Must not surface as an unhandled rejection
		failLater?.(new Error('late failure'))
		await new Promise((resolve) => setTimeout(resolve, 10))
	})
})

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
