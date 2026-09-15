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
