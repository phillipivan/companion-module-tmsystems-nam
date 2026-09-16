import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { BackoffScheduler, ConnectTimeoutError, connectWithTimeout } from '../reconnect.js'

describe('connectWithTimeout', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	const fakeConnection = (): { close: Mock<() => void> } => ({ close: vi.fn() })
	const never = async <T>(): Promise<T> => new Promise<T>(() => undefined)
	const flushMicrotasks = async (): Promise<void> => {
		for (let i = 0; i < 10; i++) await Promise.resolve()
	}

	it('resolves with the connection when it opens in time, and leaves it open', async () => {
		const connection = fakeConnection()

		await expect(connectWithTimeout(async () => connection, 1000)).resolves.toBe(connection)
		await vi.advanceTimersByTimeAsync(2000)

		expect(connection.close).not.toHaveBeenCalled()
	})

	it('rejects with a ConnectTimeoutError once the timeout passes, aborting the signal given to the transport', async () => {
		let transportSignal: AbortSignal | undefined
		const result = connectWithTimeout(async (signal) => {
			transportSignal = signal
			return never<{ close(): void }>()
		}, 1000)
		const rejected = expect(result).rejects.toThrow(new ConnectTimeoutError(1000))

		await vi.advanceTimersByTimeAsync(1000)

		await rejected
		expect(transportSignal?.aborted).toBe(true)
	})

	it('closes a connection that opens after it gave up', async () => {
		const connection = fakeConnection()
		let open: ((c: typeof connection) => void) | undefined
		const result = connectWithTimeout(async () => new Promise<typeof connection>((resolve) => (open = resolve)), 1000)
		const rejected = expect(result).rejects.toBeInstanceOf(ConnectTimeoutError)
		await vi.advanceTimersByTimeAsync(1000)
		await rejected

		open?.(connection)
		await flushMicrotasks()

		expect(connection.close).toHaveBeenCalledTimes(1)
	})

	it('rejects with the abort reason as soon as its signal aborts, aborting the signal given to the transport', async () => {
		const attempt = new AbortController()
		let transportSignal: AbortSignal | undefined
		const result = connectWithTimeout(
			async (signal) => {
				transportSignal = signal
				return never<{ close(): void }>()
			},
			1000,
			attempt.signal,
		)
		const reason = new Error('superseded')

		attempt.abort(reason)

		await expect(result).rejects.toBe(reason)
		expect(transportSignal?.aborted).toBe(true)
	})

	it('does not start connecting when its signal has already aborted', async () => {
		const attempt = new AbortController()
		attempt.abort(new Error('destroyed'))
		const open = vi.fn(async () => fakeConnection())

		await expect(connectWithTimeout(open, 1000, attempt.signal)).rejects.toThrow('destroyed')
		expect(open).not.toHaveBeenCalled()
	})
})

const options = { initialDelayMs: 100, maxDelayMs: 1000 }

describe('BackoffScheduler', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('runs the callback once the delay has elapsed', () => {
		const callback = vi.fn()
		const scheduler = new BackoffScheduler(callback, options)

		expect(scheduler.schedule()).toBe(100)
		expect(scheduler.pending).toBe(true)
		vi.advanceTimersByTime(99)
		expect(callback).not.toHaveBeenCalled()
		vi.advanceTimersByTime(1)
		expect(callback).toHaveBeenCalledTimes(1)
		expect(scheduler.pending).toBe(false)
	})

	it('doubles the delay with each attempt, up to the ceiling', () => {
		const scheduler = new BackoffScheduler(vi.fn(), options)

		const delays: (number | undefined)[] = []
		for (let i = 0; i < 6; i++) {
			delays.push(scheduler.schedule())
			vi.runAllTimers()
		}

		expect(delays).toEqual([100, 200, 400, 800, 1000, 1000])
		expect(scheduler.attempts).toBe(6)
	})

	it('coalesces schedule() calls while an attempt is pending', () => {
		// A dropped connection reports error, then close, then rejects in-flight requests
		const callback = vi.fn()
		const scheduler = new BackoffScheduler(callback, options)

		expect(scheduler.schedule()).toBe(100)
		expect(scheduler.schedule()).toBeUndefined()
		expect(scheduler.schedule()).toBeUndefined()
		vi.runAllTimers()

		expect(callback).toHaveBeenCalledTimes(1)
		expect(scheduler.attempts).toBe(1)
	})

	it('cancel() drops the pending attempt but keeps the backoff', () => {
		const callback = vi.fn()
		const scheduler = new BackoffScheduler(callback, options)

		scheduler.schedule()
		scheduler.cancel()
		vi.runAllTimers()

		expect(callback).not.toHaveBeenCalled()
		expect(scheduler.schedule()).toBe(200)
	})

	it('reset() drops the pending attempt and starts over from the initial delay', () => {
		const callback = vi.fn()
		const scheduler = new BackoffScheduler(callback, options)

		scheduler.schedule()
		vi.runAllTimers()
		scheduler.schedule()
		scheduler.reset()
		vi.runAllTimers()

		expect(callback).toHaveBeenCalledTimes(1)
		expect(scheduler.attempts).toBe(0)
		expect(scheduler.schedule()).toBe(100)
	})

	it('drops the pending attempt and refuses new ones once its signal aborts', () => {
		const callback = vi.fn()
		const controller = new AbortController()
		const scheduler = new BackoffScheduler(callback, options, controller.signal)

		scheduler.schedule()
		controller.abort()
		vi.runAllTimers()

		expect(callback).not.toHaveBeenCalled()
		expect(scheduler.schedule()).toBeUndefined()
		expect(scheduler.pending).toBe(false)
	})
})
