import { OcaFilterParametric } from 'aes70/src/controller/ControlClasses.js'
import { OcaParametricEQShape } from 'aes70/src/types/OcaParametricEQShape.js'

/**
 * Property names, in order, that a T&M Media NAM (version 3) reported for its
 * OcaFilterParametric objects on 2026-09-16: inherited OcaRoot and OcaWorker properties
 * first, then the class's own. The values are placeholders; the tests using this only
 * depend on the names, their order, and each value's type.
 */
const NAM_FILTER_PARAMETRIC_PROPERTIES: readonly [name: string, value: unknown][] = [
	['ClassVersion', 1],
	['Lockable', false],
	['Role', 'BQ0'],
	['Enabled', true],
	['Ports', []],
	['Owner', 0],
	['Frequency', 1000],
	['Shape', OcaParametricEQShape.PEQ],
	['WidthParameter', 1],
	['InBandGain', 0],
]

/**
 * A real OcaFilterParametric against an inert device, with GetPropertySync stubbed to
 * report the properties the NAM reported, so definitions are built from a realistic mix
 * of inherited and class properties without any network I/O.
 *
 * `extra` adds properties to what it reports, to model another object of the class that
 * implements optional properties the NAM's did not.
 */
export function makeNamFilterParametric(
	ono: number,
	extra: readonly [name: string, value: unknown][] = [],
): OcaFilterParametric {
	const reported = [...NAM_FILTER_PARAMETRIC_PROPERTIES, ...extra]
	const device = {
		send_command: (): undefined => undefined,
		add_subscription: (): undefined => undefined,
		remove_subscription: (): undefined => undefined,
	}
	const obj = new OcaFilterParametric(ono, device as unknown as ConstructorParameters<typeof OcaFilterParametric>[1])
	;(obj as unknown as { GetPropertySync: unknown }).GetPropertySync = () => ({
		sync: async (): Promise<void> => undefined,
		forEach: (cb: (value: unknown, name: string) => void): void => {
			for (const [name, value] of reported) cb(value, name)
		},
		Dispose: (): undefined => undefined,
	})
	return obj
}
