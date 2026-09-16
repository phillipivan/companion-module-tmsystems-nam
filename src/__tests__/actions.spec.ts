import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import type { CompanionActionDefinitions } from '@companion-module/base'
import { OcaMute } from 'aes70/src/controller/ControlClasses.js'
import { OcaMuteState } from 'aes70/src/types/OcaMuteState.js'
import { makeNamFilterParametric } from './fakeControlObjects.js'
import { OcaHelper } from '../OcaHelper.js'
import { UpdateActions, type ActionSchema } from '../actions.js'
import type ModuleInstance from '../main.js'

/**
 * Exercises the generated Set Property action against a real OcaHelper and a
 * real OcaMute, whose stubbed property sync reports values the way aes70 does:
 * State as an OcaMuteState enum instance rather than a number.
 */

type SetPropertyOptions = { objectId: string; property: string }

type LearnCallback = (
	action: { id: string; controlId: string; actionId: string; options: SetPropertyOptions },
	context: { signal: AbortSignal },
) => Promise<Record<string, unknown> | undefined>

/** The parts of a generated action definition these tests use. */
type SetPropertyDefinition = {
	options: { id: string; choices?: { id: string | number }[] }[]
	learn: LearnCallback
}

/**
 * A real OcaMute against a fake device, with GetPropertySync stubbed to resolve
 * instantly and report a writable enum (State) and a writable boolean (Enabled).
 */
function makeMute(ono: number): OcaMute {
	const device = { send_command: vi.fn(), add_subscription: vi.fn(), remove_subscription: vi.fn() }
	const obj = new OcaMute(ono, device as unknown as ConstructorParameters<typeof OcaMute>[1])
	;(obj as unknown as { GetPropertySync: unknown }).GetPropertySync = vi.fn(() => ({
		sync: vi.fn().mockResolvedValue(undefined),
		forEach: vi.fn((cb: (value: unknown, name: string) => void) => {
			cb(OcaMuteState.Muted, 'State')
			cb(true, 'Enabled')
		}),
		Dispose: vi.fn(),
	}))
	return obj
}

describe('Set Property action learn', () => {
	let helper: OcaHelper
	let definition: SetPropertyDefinition

	beforeEach(async () => {
		helper = new OcaHelper()
		const setActionDefinitions: Mock<(definitions: CompanionActionDefinitions<ActionSchema>) => void> = vi.fn()
		const self = { ocaHelper: helper, setActionDefinitions } as unknown as ModuleInstance

		await helper.loadRoleMap(new Map<string, unknown>([['Mute1', makeMute(1)]]))
		await UpdateActions(self)

		const built = setActionDefinitions.mock.lastCall?.[0].set_property_OcaMute
		if (!built) throw new Error('No OcaMute action was defined')
		definition = built as unknown as SetPropertyDefinition

		// Companion subscribes an action before it can be learned, which is what syncs the properties learn reads
		await helper.addActionId('Mute1', 'a1')
	})

	async function learn(property: string): Promise<Record<string, unknown> | undefined> {
		return definition.learn(
			{ id: 'a1', controlId: 'bank:1:1', actionId: 'set_property_OcaMute', options: { objectId: 'Mute1', property } },
			{ signal: new AbortController().signal },
		)
	}

	it('learns an enum property as its numeric value, which is one of the dropdown choice ids', async () => {
		const learned = await learn('State')

		expect(learned).toEqual({ value_State: 1 })
		const choiceIds = definition.options.find((option) => option.id === 'value_State')?.choices?.map((c) => c.id)
		expect(choiceIds).toContain(learned?.value_State)
	})

	it('learns a primitive property as it is', async () => {
		await expect(learn('Enabled')).resolves.toEqual({ value_Enabled: true })
	})
})

describe('Set Property action default property', () => {
	it("defaults to the class's own property rather than an inherited one", async () => {
		const helper = new OcaHelper()
		const setActionDefinitions: Mock<(definitions: CompanionActionDefinitions<ActionSchema>) => void> = vi.fn()
		const self = { ocaHelper: helper, setActionDefinitions } as unknown as ModuleInstance
		await helper.loadRoleMap(new Map<string, unknown>([['MIC/BQ0', makeNamFilterParametric(1)]]))

		await UpdateActions(self)

		const definition = setActionDefinitions.mock.lastCall?.[0].set_property_OcaFilterParametric as unknown as
			SetPropertyDefinition | undefined
		const property = definition?.options.find((option) => option.id === 'property') as { default?: unknown } | undefined
		// Enabled, inherited from OcaWorker, is the first writable property the device reports
		expect(property?.default).toBe('Frequency')
	})
})
