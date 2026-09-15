import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import type { CompanionFeedbackDefinitions, CompanionFeedbackValueEvent } from '@companion-module/base'
import { OcaGain } from 'aes70/src/controller/ControlClasses.js'
import { OcaHelper } from '../OcaHelper.js'
import { UpdateFeedbacks, type FeedbackSchema } from '../feedbacks.js'
import type ModuleInstance from '../main.js'

/**
 * Exercises the generated Get Property feedback's registration against a real
 * OcaHelper, passing `previousOptions` the way the Companion module host does.
 * The host sets it to the options from before the last time Companion sent the
 * feedback, and Companion re-sends every feedback on each setFeedbackDefinitions,
 * which this module calls on every role map load. So after any reload a
 * feedback's previousOptions equal its current options.
 */

type GetPropertyOptions = { objectId: string; property: string; sync: boolean }

type ValueFeedbackCallback = (
	feedback: CompanionFeedbackValueEvent<GetPropertyOptions>,
	context: { type: 'feedback'; signal: AbortSignal },
) => Promise<unknown>

const GAIN_1: GetPropertyOptions = { objectId: 'Gain1', property: 'Gain', sync: true }
const GAIN_2: GetPropertyOptions = { objectId: 'Gain2', property: 'Gain', sync: true }
const MISSING: GetPropertyOptions = { objectId: 'Missing', property: 'Gain', sync: true }

/** Value the stubbed property sync reports for Gain. */
const GAIN_VALUE = -6

/**
 * A real OcaGain against a fake device, with GetPropertySync stubbed to resolve
 * instantly and report a single Gain property.
 */
function makeGain(ono: number): OcaGain {
	const device = { send_command: vi.fn(), add_subscription: vi.fn(), remove_subscription: vi.fn() }
	const obj = new OcaGain(ono, device as unknown as ConstructorParameters<typeof OcaGain>[1])
	;(obj as unknown as { GetPropertySync: unknown }).GetPropertySync = vi.fn(() => ({
		sync: vi.fn().mockResolvedValue(undefined),
		forEach: vi.fn((cb: (value: unknown, name: string) => void) => cb(GAIN_VALUE, 'Gain')),
		Dispose: vi.fn(),
	}))
	return obj
}

describe('Get Property feedback registration', () => {
	let helper: OcaHelper
	let setFeedbackDefinitions: Mock<(definitions: CompanionFeedbackDefinitions<FeedbackSchema>) => void>
	let self: ModuleInstance

	beforeEach(() => {
		helper = new OcaHelper()
		setFeedbackDefinitions = vi.fn()
		self = { ocaHelper: helper, setFeedbackDefinitions } as unknown as ModuleInstance
	})

	/** Load a role map of OcaGain objects and rebuild the feedback definitions, as the module does on map:loaded. */
	async function loadRoleMap(paths: string[]): Promise<void> {
		await helper.loadRoleMap(new Map<string, unknown>(paths.map((path, i) => [path, makeGain(i + 1)])))
		await UpdateFeedbacks(self)
	}

	/** Run feedback fb1's callback from the most recently set definitions. */
	async function check(options: GetPropertyOptions, previousOptions: GetPropertyOptions | null): Promise<unknown> {
		const definition = setFeedbackDefinitions.mock.lastCall?.[0].get_property_OcaGain
		if (!definition) throw new Error('No OcaGain feedback was defined')
		return (definition as unknown as { callback: ValueFeedbackCallback }).callback(
			{
				type: 'value',
				id: 'fb1',
				controlId: 'bank:1:1',
				feedbackId: 'get_property_OcaGain',
				options,
				previousOptions,
			},
			{ type: 'feedback', signal: new AbortController().signal },
		)
	}

	it('re-registers when its object drops out of the role map and comes back', async () => {
		await loadRoleMap(['Gain1', 'Gain2'])
		expect(await check(GAIN_1, null)).toBe(GAIN_VALUE)
		expect(helper.resolveFeedbackId('fb1')).toBe('Gain1')

		// The reload drops the registration, and Companion re-sends the feedback
		await loadRoleMap(['Gain2'])
		expect(helper.resolveFeedbackId('fb1')).toBeUndefined()
		await expect(check(GAIN_1, GAIN_1)).resolves.toBeNull()

		await loadRoleMap(['Gain1', 'Gain2'])
		expect(await check(GAIN_1, GAIN_1)).toBe(GAIN_VALUE)
		expect(helper.resolveFeedbackId('fb1')).toBe('Gain1')
		expect(helper.getEntry('Gain1')?.properties).toBeDefined()
	})

	it('registers an object that only appears after the feedback was first checked', async () => {
		await loadRoleMap(['Gain2'])
		await expect(check(GAIN_1, null)).resolves.toBeNull()

		await loadRoleMap(['Gain1', 'Gain2'])
		expect(await check(GAIN_1, GAIN_1)).toBe(GAIN_VALUE)
		expect(helper.resolveFeedbackId('fb1')).toBe('Gain1')
		expect(helper.getEntry('Gain1')?.properties).toBeDefined()
	})

	it('moves its registration when the control object changes', async () => {
		await loadRoleMap(['Gain1', 'Gain2'])
		await check(GAIN_1, null)

		await check(GAIN_2, GAIN_1)

		expect(helper.resolveFeedbackId('fb1')).toBe('Gain2')
		expect(helper.getEntry('Gain1')?.feedbackIds.has('fb1')).toBe(false)
	})

	it('drops its registration when pointed at an object the device does not have', async () => {
		await loadRoleMap(['Gain1'])
		await check(GAIN_1, null)

		await expect(check(MISSING, GAIN_1)).resolves.toBeNull()

		expect(helper.hasFeedbackId('fb1')).toBe(false)
		expect(helper.getEntry('Gain1')?.feedbackIds.has('fb1')).toBe(false)
	})

	it('registers once, not on every check', async () => {
		await loadRoleMap(['Gain1'])
		const addFeedbackId = vi.spyOn(helper, 'addFeedbackId')

		await check(GAIN_1, null)
		await check(GAIN_1, GAIN_1)
		await check(GAIN_1, GAIN_1)

		expect(addFeedbackId).toHaveBeenCalledTimes(1)
	})
})
