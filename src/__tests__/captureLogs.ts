import { vi, type Mock } from 'vitest'

type LoggingSink = NonNullable<typeof globalThis.COMPANION_LOGGER>

export interface CapturedLogs {
	/** Every message logged at `warn` since capture started, in order. */
	warnings(): string[]
	/** Put back whatever sink was installed before. */
	restore(): void
}

/**
 * Route every `createModuleLogger` logger into a mock until `restore()`. base looks the sink
 * up on every message, so this also catches loggers created when their module was imported.
 */
export function captureLogs(): CapturedLogs {
	const previous = globalThis.COMPANION_LOGGER
	const sink: Mock<LoggingSink> = vi.fn()
	globalThis.COMPANION_LOGGER = sink
	return {
		warnings: () => sink.mock.calls.filter(([, level]) => level === 'warn').map(([, , message]) => message),
		restore: () => {
			globalThis.COMPANION_LOGGER = previous
		},
	}
}
