export interface BackoffOptions {
	/** Delay before the first attempt. */
	readonly initialDelayMs: number
	/** Ceiling the doubling delay stops at. */
	readonly maxDelayMs: number
}

/**
 * Reconnecting after the connection fails or the device refuses the initial
 * role map. A host that is down, or isn't an AES70 device at all, backs off to
 * one attempt every 5 minutes, while a transient failure still recovers
 * without anyone having to touch the config.
 */
export const RECONNECT_BACKOFF: BackoffOptions = { initialDelayMs: 10_000, maxDelayMs: 300_000 }

/**
 * Retrying a role map refresh after a tree change, on a connection that is
 * still up. The device has already served a role map, so a refusal here is
 * most likely it being busy mid-restructure: start sooner and cap lower.
 */
export const ROLE_MAP_REFRESH_BACKOFF: BackoffOptions = { initialDelayMs: 2_000, maxDelayMs: 60_000 }

/**
 * How long a connection may take to open before the attempt is abandoned. Without it
 * a TCP connect to a host that has gone away sits in SYN_SENT until the OS gives up,
 * 75s on macOS.
 */
export const CONNECT_TIMEOUT_MS = 5_000

/**
 * Keepalive interval requested from the device, in seconds. aes70 closes the
 * connection once nothing has been received for three intervals.
 */
export const KEEPALIVE_INTERVAL_S = 2

export class ConnectTimeoutError extends Error {
	constructor(timeoutMs: number) {
		super(`Timed out after ${timeoutMs / 1000}s`)
		this.name = 'ConnectTimeoutError'
	}
}

/**
 * Open a connection, giving up once `timeoutMs` has passed or `signal` aborts,
 * whichever comes first, and rejecting with that reason.
 *
 * `open` is handed a signal that aborts in either case, for the transport to act
 * on. aes70's TCP and UDP connects take one and stop at once. Its WebSocket connect
 * has no way to, so a connection that opens after giving up is closed here rather
 * than leaked.
 *
 * Deliberately not built on AbortSignal.any(): on Node 26 a composite signal holds
 * its sources weakly and only checks them when read, so an abort can be lost to
 * garbage collection. See connect() in main.ts.
 */
export async function connectWithTimeout<T extends { close(): void }>(
	open: (signal: AbortSignal) => Promise<T>,
	timeoutMs: number,
	signal?: AbortSignal,
): Promise<T> {
	const controller = new AbortController()
	const onAbort = (): void => controller.abort(signal?.reason)
	const timer = setTimeout(() => controller.abort(new ConnectTimeoutError(timeoutMs)), timeoutMs)
	signal?.addEventListener('abort', onAbort, { once: true })
	if (signal?.aborted) onAbort()

	let pending: Promise<T> | undefined
	let gaveUp = false
	try {
		return await new Promise<T>((resolve, reject) => {
			const giveUp = (): void => {
				gaveUp = true
				reject(controller.signal.reason as Error)
			}
			if (controller.signal.aborted) {
				giveUp()
				return
			}
			controller.signal.addEventListener('abort', giveUp, { once: true })
			pending = open(controller.signal)
			pending.then((connection) => {
				controller.signal.removeEventListener('abort', giveUp)
				resolve(connection)
			}, reject)
		})
	} finally {
		clearTimeout(timer)
		signal?.removeEventListener('abort', onAbort)
		if (gaveUp) {
			pending?.then(
				(connection) => connection.close(),
				() => undefined,
			)
		}
	}
}

/**
 * Runs a callback after a delay that doubles with each attempt, up to a
 * ceiling, until `reset()` starts it over.
 *
 * Only one attempt is ever pending: `schedule()` while one is waiting is a
 * no-op. That matters because a dropped connection reports itself several
 * times over — aes70 emits `error`, then `close`, then rejects every request
 * in flight — and each of those reaches a call site that schedules a retry.
 */
export class BackoffScheduler {
	private attemptCount = 0
	private timer: NodeJS.Timeout | undefined

	constructor(
		private readonly callback: () => void,
		private readonly options: BackoffOptions,
		private readonly signal?: AbortSignal,
	) {
		signal?.addEventListener('abort', () => this.cancel(), { once: true })
	}

	/** Attempts scheduled since construction or the last `reset()`. */
	public get attempts(): number {
		return this.attemptCount
	}

	public get pending(): boolean {
		return this.timer !== undefined
	}

	/**
	 * Schedule the next attempt.
	 *
	 * @returns The delay used, or `undefined` when nothing was scheduled because
	 * an attempt is already pending or the signal has aborted.
	 */
	public schedule(): number | undefined {
		if (this.signal?.aborted || this.timer !== undefined) return undefined
		const delay = Math.min(this.options.initialDelayMs * 2 ** this.attemptCount, this.options.maxDelayMs)
		this.attemptCount++
		this.timer = setTimeout(() => {
			this.timer = undefined
			this.callback()
		}, delay)
		return delay
	}

	/** Drop the pending attempt, if any, keeping the backoff where it is. */
	public cancel(): void {
		clearTimeout(this.timer)
		this.timer = undefined
	}

	/** Drop the pending attempt, if any, and start the backoff over from the initial delay. */
	public reset(): void {
		this.cancel()
		this.attemptCount = 0
	}
}
