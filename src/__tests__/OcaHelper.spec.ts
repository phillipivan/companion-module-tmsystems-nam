import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OcaHelper } from '../OcaHelper.js'
import { OCA_CLASS_NAMES } from '../consts/aes70-constants.js'
import {
	OcaGain,
	OcaMute,
	OcaBooleanActuator,
	OcaAudioLevelSensor,
	OcaLevelSensor,
	OcaBlock,
	OcaBlockFactoryAgent,
	OcaMatrix,
	OcaGrouper,
	OcaDeviceManager,
	OcaControlNetwork,
	OcaApplicationNetwork,
	OcaMediaTransportNetwork,
	OcaNetwork,
	OcaMediaClock,
	OcaStreamNetwork,
	OcaStreamConnector,
	OcaNetworkSignalChannel,
	OcaRoot,
} from 'aes70/src/controller/ControlClasses.js'
import { ObjectBase } from 'aes70/src/controller/object_base.js'

// ---------------------------------------------------------------------------
// Test helpers — build real aes70 control-class instances backed by a fake
// device, so `instanceof` chains and ClassName resolution behave exactly as
// they would against a live device, without any network I/O.
// ---------------------------------------------------------------------------

interface FakeDevice {
	send_command: ReturnType<typeof vi.fn>
	add_subscription: ReturnType<typeof vi.fn>
	remove_subscription: ReturnType<typeof vi.fn>
}

function fakeDevice(): FakeDevice {
	return {
		send_command: vi.fn(),
		add_subscription: vi.fn(),
		remove_subscription: vi.fn(),
	}
}

interface FakePropertySync {
	sync: ReturnType<typeof vi.fn>
	forEach: ReturnType<typeof vi.fn>
	Dispose: ReturnType<typeof vi.fn>
}

function makeFakePropertySync(): FakePropertySync {
	return {
		sync: vi.fn().mockResolvedValue(undefined),
		forEach: vi.fn(),
		Dispose: vi.fn(),
	}
}

interface Rig {
	getPropertySync: ReturnType<typeof vi.fn>
	propertySync: FakePropertySync
}

const rigByObject = new WeakMap<ObjectBase, Rig>()

/**
 * Instantiate a real aes70 control class against a fake device, and stub
 * GetPropertySync() so property-sync calls resolve instantly without
 * hitting the (nonexistent) network device. Use `rigOf()` to get at the
 * mocked GetPropertySync()/PropertySync for a given object.
 */
function makeObj<T extends ObjectBase>(
	Cls: new (ono: number, device: any) => T,
	ono: number,
	device: FakeDevice = fakeDevice(),
): T {
	const obj = new Cls(ono, device)
	const propertySync = makeFakePropertySync()
	const getPropertySync = vi.fn(() => propertySync)
	;(obj as unknown as { GetPropertySync: unknown }).GetPropertySync = getPropertySync
	rigByObject.set(obj, { getPropertySync, propertySync })
	return obj
}

function rigOf(obj: ObjectBase): Rig {
	const rig = rigByObject.get(obj)
	if (!rig) throw new Error('Object was not created via makeObj()')
	return rig
}

/** A non-OcaRoot ObjectBase, for testing the "not an OCA control object" paths. */
function makePlainObjectBase(ono: number): ObjectBase {
	return new ObjectBase(ono, fakeDevice() as any)
}

// ---------------------------------------------------------------------------
// determineClass / class-dispatch
// ---------------------------------------------------------------------------

describe('determineClass', () => {
	let helper: OcaHelper
	let events: string[]

	beforeEach(() => {
		helper = new OcaHelper()
		events = []
		// Record every event name this helper ever emits, across the whole
		// DetermineOcaClassEvents map, without needing per-test listeners.
		const originalEmit = helper.emit.bind(helper) as (...args: unknown[]) => boolean
		vi.spyOn(helper, 'emit').mockImplementation((eventName: string | symbol, ...args: unknown[]) => {
			events.push(String(eventName))
			return originalEmit(eventName, ...args)
		})
	})

	it('emits OcaWorker plus the exact class for a direct actuator subclass', () => {
		helper.determineClass(makeObj(OcaGain, 1))
		expect(events).toEqual(['OcaWorker', 'OcaGain'])
	})

	it('emits the exact class for a different direct actuator subclass', () => {
		helper.determineClass(makeObj(OcaMute, 1))
		expect(events).toEqual(['OcaWorker', 'OcaMute'])
	})

	it('emits only the most-derived event for a basic-actuator subtype, not OcaBasicActuator/OcaActuator', () => {
		helper.determineClass(makeObj(OcaBooleanActuator, 1))
		expect(events).toEqual(['OcaWorker', 'OcaBooleanActuator'])
	})

	it('emits only the most-derived event for a nested sensor subtype, not OcaLevelSensor/OcaSensor', () => {
		helper.determineClass(makeObj(OcaAudioLevelSensor, 1))
		expect(events).toEqual(['OcaWorker', 'OcaAudioLevelSensor'])
	})

	it('emits OcaLevelSensor (not OcaAudioLevelSensor) for the non-audio level sensor', () => {
		helper.determineClass(makeObj(OcaLevelSensor, 1))
		expect(events).toEqual(['OcaWorker', 'OcaLevelSensor'])
	})

	it.each([
		['OcaBlock', OcaBlock],
		['OcaMatrix', OcaMatrix],
	] as const)('emits OcaWorker plus %s for structural worker classes', (eventName, Cls) => {
		helper.determineClass(makeObj<ObjectBase>(Cls, 1))
		expect(events).toEqual(['OcaWorker', eventName])
	})

	// OcaNetworkSignalChannel extends OcaWorker in aes70.js, so it goes
	// through the OcaWorker branch (which always emits 'OcaWorker' first)
	// before its own dedicated event.
	it('emits OcaWorker plus OcaNetworkSignalChannel for the deprecated v1 network signal channel class', () => {
		helper.determineClass(makeObj(OcaNetworkSignalChannel, 1))
		expect(events).toEqual(['OcaWorker', 'OcaNetworkSignalChannel'])
	})

	it('emits only the exact class for an agent, with no generic OcaAgent/OcaWorker event', () => {
		helper.determineClass(makeObj(OcaGrouper, 1))
		expect(events).toEqual(['OcaGrouper'])
	})

	// OcaBlockFactoryAgent, OcaStreamConnector, OcaStreamNetwork, OcaNetwork
	// and OcaMediaClock all extend OcaAgent (not OcaWorker/OcaRoot directly)
	// in aes70.js, so — like OcaGrouper above — they get only their own
	// dedicated event, with no generic 'OcaAgent' alongside it.
	it.each([
		['OcaBlockFactory', OcaBlockFactoryAgent],
		['OcaStreamConnector', OcaStreamConnector],
		['OcaStreamNetwork', OcaStreamNetwork],
		['OcaNetwork', OcaNetwork],
		['OcaMediaClock', OcaMediaClock],
	] as const)('emits only %s for deprecated v1 classes that are actually OcaAgent subclasses', (eventName, Cls) => {
		helper.determineClass(makeObj<ObjectBase>(Cls, 1))
		expect(events).toEqual([eventName])
	})

	it('emits only the exact class for a manager, with no generic OcaManager event', () => {
		helper.determineClass(makeObj(OcaDeviceManager, 1))
		expect(events).toEqual(['OcaDeviceManager'])
	})

	it.each([
		['OcaControlNetwork', OcaControlNetwork],
		['OcaApplicationNetwork', OcaApplicationNetwork],
		['OcaMediaTransportNetwork', OcaMediaTransportNetwork],
	] as const)('emits %s for network classes', (eventName, Cls) => {
		helper.determineClass(makeObj<ObjectBase>(Cls, 1))
		expect(events).toEqual([eventName])
	})

	it('falls back to OcaRoot for an unrecognised OcaRoot subclass', () => {
		helper.determineClass(makeObj(OcaRoot, 1))
		expect(events).toEqual(['OcaRoot'])
	})

	it('emits ObjectBase for a non-OcaRoot ObjectBase', () => {
		helper.determineClass(makePlainObjectBase(1))
		expect(events).toEqual(['ObjectBase'])
	})

	it('emits nothing for values that are not an ObjectBase', () => {
		helper.determineClass({ not: 'an object base' })
		helper.determineClass(null)
		helper.determineClass(42)
		expect(events).toEqual([])
	})

	it('recurses into arrays, processing every element', () => {
		helper.determineClass([makeObj(OcaGain, 1), makeObj(OcaMute, 2)])
		expect(events).toEqual(['OcaWorker', 'OcaGain', 'OcaWorker', 'OcaMute'])
	})
})

// ---------------------------------------------------------------------------
// loadRoleMap
// ---------------------------------------------------------------------------

describe('loadRoleMap', () => {
	let helper: OcaHelper

	beforeEach(() => {
		helper = new OcaHelper()
	})

	it('registers only OcaRoot instances and filters out other objects', async () => {
		const gain = makeObj(OcaGain, 1)
		const notRoot = makePlainObjectBase(2)
		await helper.loadRoleMap(
			new Map<string, unknown>([
				['Faders/1', gain],
				['NotARoot/1', notRoot],
			]),
		)

		expect(helper.getRolePaths()).toEqual(['Faders/1'])
		expect(helper.hasPath('NotARoot/1')).toBe(false)
	})

	it('builds the class index and emits map:loaded with the filtered role map', async () => {
		const listener = vi.fn()
		helper.on('map:loaded', listener)

		const gain = makeObj(OcaGain, 1)
		const mute = makeObj(OcaMute, 2)
		await helper.loadRoleMap(
			new Map<string, unknown>([
				['Faders/Gain', gain],
				['Faders/Mute', mute],
			]),
		)

		expect(helper.getByClass(OCA_CLASS_NAMES.OcaGain)).toEqual(new Set(['Faders/Gain']))
		expect(helper.getByClass(OCA_CLASS_NAMES.OcaMute)).toEqual(new Set(['Faders/Mute']))
		expect(listener).toHaveBeenCalledTimes(1)
		const [passedMap] = listener.mock.calls[0]
		expect(Array.from(passedMap.keys())).toEqual(['Faders/Gain', 'Faders/Mute'])
	})

	it('migrates action/feedback IDs for role paths that survive a reload', async () => {
		await helper.loadRoleMap(new Map<string, unknown>([['Faders/1', makeObj(OcaGain, 1)]]))
		await helper.addActionId('Faders/1', 'action-1')
		await helper.addFeedbackId('Faders/1', 'feedback-1')

		await helper.loadRoleMap(new Map<string, unknown>([['Faders/1', makeObj(OcaGain, 1)]]))

		expect(helper.resolveActionId('action-1')).toBe('Faders/1')
		expect(helper.resolveFeedbackId('feedback-1')).toBe('Faders/1')
		expect(helper.getEntry('Faders/1')?.actionIds.has('action-1')).toBe(true)
		expect(helper.getEntry('Faders/1')?.feedbackIds.has('feedback-1')).toBe(true)
	})

	it('disposes the old property sync and re-syncs the new object for a migrated path on reload', async () => {
		await helper.loadRoleMap(new Map<string, unknown>([['Faders/1', makeObj(OcaGain, 1)]]))
		await helper.addActionId('Faders/1', 'action-1')
		const oldProps = helper.getEntry('Faders/1')?.properties as unknown as FakePropertySync
		expect(oldProps).toBeDefined()

		const newGain = makeObj(OcaGain, 1)
		const { getPropertySync: newGetPropertySync } = rigOf(newGain)
		await helper.loadRoleMap(new Map<string, unknown>([['Faders/1', newGain]]))

		expect(oldProps.Dispose).toHaveBeenCalledTimes(1)
		expect(newGetPropertySync).toHaveBeenCalledTimes(1)
		expect(helper.getEntry('Faders/1')?.properties).toBeDefined()
		expect(helper.getEntry('Faders/1')?.properties).not.toBe(oldProps)
	})

	it('disposes property sync for orphaned paths that held IDs on reload', async () => {
		await helper.loadRoleMap(new Map<string, unknown>([['Faders/1', makeObj(OcaGain, 1)]]))
		await helper.addActionId('Faders/1', 'action-1')
		const oldProps = helper.getEntry('Faders/1')?.properties as unknown as FakePropertySync

		await helper.loadRoleMap(new Map<string, unknown>())

		expect(oldProps.Dispose).toHaveBeenCalledTimes(1)
	})

	it('emits ids:orphaned only for removed paths that actually held IDs', async () => {
		await helper.loadRoleMap(
			new Map<string, unknown>([
				['Faders/1', makeObj(OcaGain, 1)],
				['Faders/2', makeObj(OcaGain, 2)],
			]),
		)
		await helper.addActionId('Faders/2', 'action-2')

		const orphanedListener = vi.fn()
		helper.on('ids:orphaned', orphanedListener)

		// Reload without Faders/2 (had an ID) or Faders/3 (never existed).
		await helper.loadRoleMap(new Map<string, unknown>([['Faders/1', makeObj(OcaGain, 1)]]))

		expect(orphanedListener).toHaveBeenCalledExactlyOnceWith(['Faders/2'])
		expect(helper.resolveActionId('action-2')).toBeUndefined()
	})

	it('does not emit ids:orphaned when no removed path held any IDs', async () => {
		await helper.loadRoleMap(
			new Map<string, unknown>([
				['Faders/1', makeObj(OcaGain, 1)],
				['Faders/2', makeObj(OcaGain, 2)],
			]),
		)

		const orphanedListener = vi.fn()
		helper.on('ids:orphaned', orphanedListener)

		await helper.loadRoleMap(new Map<string, unknown>([['Faders/1', makeObj(OcaGain, 1)]]))

		expect(orphanedListener).not.toHaveBeenCalled()
	})
})

// ---------------------------------------------------------------------------
// OcaBlock membership-change notifications ('tree:changed')
// ---------------------------------------------------------------------------

describe('tree:changed notifications', () => {
	let helper: OcaHelper

	beforeEach(() => {
		helper = new OcaHelper()
	})

	it('subscribes to OnMembersChanged for a registered OcaBlock and emits tree:changed with its role path when it fires', async () => {
		const block = makeObj(OcaBlock, 1)
		const subscribeSpy = vi.spyOn(block.OnMembersChanged, 'subscribe')

		await helper.loadRoleMap(new Map<string, unknown>([['Groups/1', block]]))

		expect(subscribeSpy).toHaveBeenCalledTimes(1)
		const handler = subscribeSpy.mock.calls[0][0] as () => void

		const listener = vi.fn()
		helper.on('tree:changed', listener)
		handler()

		expect(listener).toHaveBeenCalledExactlyOnceWith('Groups/1')
	})

	it('does not treat non-block objects as having members to watch', async () => {
		const gain = makeObj(OcaGain, 1)
		await helper.loadRoleMap(new Map<string, unknown>([['Faders/1', gain]]))

		const listener = vi.fn()
		helper.on('tree:changed', listener)
		;(gain as unknown as { OnPropertyChanged: { emit: (args: unknown[]) => void } }).OnPropertyChanged.emit([])

		expect(listener).not.toHaveBeenCalled()
	})

	it('unsubscribes the old block and subscribes the new one when a role path is reloaded with a different instance', async () => {
		const blockV1 = makeObj(OcaBlock, 1)
		const unsubscribeSpy = vi.spyOn(blockV1.OnMembersChanged, 'unsubscribe')
		await helper.loadRoleMap(new Map<string, unknown>([['Groups/1', blockV1]]))

		const blockV2 = makeObj(OcaBlock, 1)
		const subscribeSpyV2 = vi.spyOn(blockV2.OnMembersChanged, 'subscribe')
		await helper.loadRoleMap(new Map<string, unknown>([['Groups/1', blockV2]]))

		expect(unsubscribeSpy).toHaveBeenCalledTimes(1)
		expect(subscribeSpyV2).toHaveBeenCalledTimes(1)
	})

	it('unsubscribes a block that is no longer present in a reloaded map', async () => {
		const block = makeObj(OcaBlock, 1)
		const unsubscribeSpy = vi.spyOn(block.OnMembersChanged, 'unsubscribe')
		await helper.loadRoleMap(new Map<string, unknown>([['Groups/1', block]]))

		await helper.loadRoleMap(new Map<string, unknown>())

		expect(unsubscribeSpy).toHaveBeenCalledTimes(1)
	})
})

// ---------------------------------------------------------------------------
// Class-index / registry query API
// ---------------------------------------------------------------------------

describe('class index and registry queries', () => {
	let helper: OcaHelper

	beforeEach(async () => {
		helper = new OcaHelper()
		await helper.loadRoleMap(
			new Map<string, unknown>([
				['Faders/1', makeObj(OcaGain, 1)],
				['Faders/2', makeObj(OcaGain, 2)],
				['Mutes/1', makeObj(OcaMute, 3)],
			]),
		)
	})

	it('getByClass returns an empty set (not undefined) for a class with no members', () => {
		expect(helper.getByClass(OCA_CLASS_NAMES.OcaSwitch)).toEqual(new Set())
	})

	it('getChoicesByClass formats role paths as dropdown choices', () => {
		expect(helper.getChoicesByClass(OCA_CLASS_NAMES.OcaMute)).toEqual([{ id: 'Mutes/1', label: 'Mutes/1' }])
	})

	it('hasClass reflects whether any object of that class is registered', () => {
		expect(helper.hasClass(OCA_CLASS_NAMES.OcaGain)).toBe(true)
		expect(helper.hasClass(OCA_CLASS_NAMES.OcaSwitch)).toBe(false)
	})

	it('getClassNames lists every class with at least one member', () => {
		expect(helper.getClassNames().sort()).toEqual([OCA_CLASS_NAMES.OcaGain, OCA_CLASS_NAMES.OcaMute].sort())
	})

	it('getClassIndex snapshots the index as a plain object of arrays', () => {
		expect(helper.getClassIndex()).toEqual({
			[OCA_CLASS_NAMES.OcaGain]: ['Faders/1', 'Faders/2'],
			[OCA_CLASS_NAMES.OcaMute]: ['Mutes/1'],
		})
	})

	it('getEntry/getObject/getClassName return data for known paths and undefined for unknown ones', () => {
		expect(helper.getClassName('Mutes/1')).toBe(OCA_CLASS_NAMES.OcaMute)
		expect(helper.getObject('Mutes/1')).toBeDefined()
		expect(helper.getEntry('Mutes/1')?.className).toBe(OCA_CLASS_NAMES.OcaMute)

		expect(helper.getClassName('Nope')).toBeUndefined()
		expect(helper.getObject('Nope')).toBeUndefined()
		expect(helper.getEntry('Nope')).toBeUndefined()
	})

	it('getTypedObject returns the object only when the guard matches', () => {
		const isOcaGain = (obj: unknown): obj is OcaGain => OcaHelper.isOcaGain(obj)
		expect(helper.getTypedObject('Faders/1', isOcaGain)).toBeDefined()
		expect(helper.getTypedObject('Mutes/1', isOcaGain)).toBeUndefined()
		expect(helper.getTypedObject('Nope', isOcaGain)).toBeUndefined()
	})

	it('getRolePaths and hasPath reflect the registered paths', () => {
		expect(helper.getRolePaths()).toEqual(['Faders/1', 'Faders/2', 'Mutes/1'])
		expect(helper.hasPath('Faders/1')).toBe(true)
		expect(helper.hasPath('Nope')).toBe(false)
	})
})

// ---------------------------------------------------------------------------
// Action ID / feedback ID registries
// ---------------------------------------------------------------------------

describe('action IDs', () => {
	let helper: OcaHelper

	beforeEach(async () => {
		helper = new OcaHelper()
		await helper.loadRoleMap(
			new Map<string, unknown>([
				['Faders/1', makeObj(OcaGain, 1)],
				['Faders/2', makeObj(OcaGain, 2)],
			]),
		)
	})

	it('rejects when the role path is not registered', async () => {
		await expect(helper.addActionId('Nope', 'a1')).rejects.toThrow(/not registered/)
	})

	it('syncs properties only on the first ID registered to a path', async () => {
		const { getPropertySync } = rigOf(helper.getObject('Faders/1') as ObjectBase)

		await helper.addActionId('Faders/1', 'a1')
		expect(getPropertySync).toHaveBeenCalledTimes(1)
		expect(helper.getEntry('Faders/1')?.properties).toBeDefined()

		await helper.addActionId('Faders/1', 'a2')
		expect(getPropertySync).toHaveBeenCalledTimes(1)
		expect(helper.getEntry('Faders/1')?.actionIds).toEqual(new Set(['a1', 'a2']))
	})

	it('resolveActionId, getObjectByActionId and hasActionId reflect registrations', async () => {
		await helper.addActionId('Faders/1', 'a1')

		expect(helper.resolveActionId('a1')).toBe('Faders/1')
		expect(helper.getObjectByActionId('a1')).toBe(helper.getObject('Faders/1'))
		expect(helper.hasActionId('a1')).toBe(true)

		expect(helper.resolveActionId('missing')).toBeUndefined()
		expect(helper.getObjectByActionId('missing')).toBeUndefined()
		expect(helper.hasActionId('missing')).toBe(false)
	})

	it('reassigns an ID already registered to a different path, disposing the old path if emptied', async () => {
		await helper.addActionId('Faders/1', 'a1')
		const propsBefore = helper.getEntry('Faders/1')?.properties as unknown as FakePropertySync

		await helper.addActionId('Faders/2', 'a1')

		expect(helper.resolveActionId('a1')).toBe('Faders/2')
		expect(helper.getEntry('Faders/1')?.actionIds.has('a1')).toBe(false)
		expect(propsBefore.Dispose).toHaveBeenCalledTimes(1)
		expect(helper.getEntry('Faders/1')?.properties).toBeUndefined()
	})

	it('removeActionId returns false for an unknown ID and true when it removes a known one', async () => {
		expect(helper.removeActionId('missing')).toBe(false)

		await helper.addActionId('Faders/1', 'a1')
		const props = helper.getEntry('Faders/1')?.properties as unknown as FakePropertySync

		expect(helper.removeActionId('a1')).toBe(true)
		expect(helper.hasActionId('a1')).toBe(false)
		expect(props.Dispose).toHaveBeenCalledTimes(1)
		expect(helper.getEntry('Faders/1')?.properties).toBeUndefined()
	})

	it('does not dispose properties while a feedback ID still holds the sync open', async () => {
		await helper.addActionId('Faders/1', 'a1')
		await helper.addFeedbackId('Faders/1', 'f1')
		const props = helper.getEntry('Faders/1')?.properties as unknown as FakePropertySync

		helper.removeActionId('a1')

		expect(props.Dispose).not.toHaveBeenCalled()
		expect(helper.getEntry('Faders/1')?.properties).toBeDefined()
	})

	it('clearActionIds removes every action ID for a path and disposes if no feedback IDs remain', async () => {
		await helper.addActionId('Faders/1', 'a1')
		await helper.addActionId('Faders/1', 'a2')
		const props = helper.getEntry('Faders/1')?.properties as unknown as FakePropertySync

		helper.clearActionIds('Faders/1')

		expect(helper.getEntry('Faders/1')?.actionIds.size).toBe(0)
		expect(helper.resolveActionId('a1')).toBeUndefined()
		expect(helper.resolveActionId('a2')).toBeUndefined()
		expect(props.Dispose).toHaveBeenCalledTimes(1)
	})

	it('does not sync properties when GetPropertySync().sync() rejects, but still registers the ID', async () => {
		const { propertySync } = rigOf(helper.getObject('Faders/1') as ObjectBase)
		propertySync.sync.mockRejectedValueOnce(new Error('boom'))

		await expect(helper.addActionId('Faders/1', 'a1')).resolves.toBeUndefined()

		expect(helper.hasActionId('a1')).toBe(true)
		expect(helper.getEntry('Faders/1')?.properties).toBeUndefined()
	})
})

describe('feedback IDs', () => {
	let helper: OcaHelper

	beforeEach(async () => {
		helper = new OcaHelper()
		await helper.loadRoleMap(
			new Map<string, unknown>([
				['Faders/1', makeObj(OcaGain, 1)],
				['Faders/2', makeObj(OcaGain, 2)],
			]),
		)
	})

	it('rejects when the role path is not registered', async () => {
		await expect(helper.addFeedbackId('Nope', 'f1')).rejects.toThrow(/not registered/)
	})

	it('resolveFeedbackId, getObjectByFeedbackId and hasFeedbackId reflect registrations', async () => {
		await helper.addFeedbackId('Faders/1', 'f1')

		expect(helper.resolveFeedbackId('f1')).toBe('Faders/1')
		expect(helper.getObjectByFeedbackId('f1')).toBe(helper.getObject('Faders/1'))
		expect(helper.hasFeedbackId('f1')).toBe(true)
	})

	it('reassigns a feedback ID already registered to a different path', async () => {
		await helper.addFeedbackId('Faders/1', 'f1')
		await helper.addFeedbackId('Faders/2', 'f1')

		expect(helper.resolveFeedbackId('f1')).toBe('Faders/2')
		expect(helper.getEntry('Faders/1')?.feedbackIds.has('f1')).toBe(false)
	})

	it('removeFeedbackId returns false for an unknown ID and true when it removes a known one', async () => {
		expect(helper.removeFeedbackId('missing')).toBe(false)

		await helper.addFeedbackId('Faders/1', 'f1')
		expect(helper.removeFeedbackId('f1')).toBe(true)
		expect(helper.hasFeedbackId('f1')).toBe(false)
	})

	it('clearFeedbackIds removes every feedback ID for a path and disposes if no action IDs remain', async () => {
		await helper.addFeedbackId('Faders/1', 'f1')
		const props = helper.getEntry('Faders/1')?.properties as unknown as FakePropertySync

		helper.clearFeedbackIds('Faders/1')

		expect(helper.getEntry('Faders/1')?.feedbackIds.size).toBe(0)
		expect(props.Dispose).toHaveBeenCalledTimes(1)
	})

	it('property:change fires with the set of feedback IDs when the object notifies a property change', async () => {
		await helper.addFeedbackId('Faders/1', 'f1')
		await helper.addFeedbackId('Faders/1', 'f2')

		const listener = vi.fn()
		helper.on('property:change', listener)

		const obj = helper.getObject('Faders/1') as unknown as { OnPropertyChanged: { emit: (args: unknown[]) => void } }
		obj.OnPropertyChanged.emit([])

		expect(listener).toHaveBeenCalledExactlyOnceWith(new Set(['f1', 'f2']))
	})
})

describe('clearAllIds', () => {
	it('clears both action and feedback IDs for a path and disposes the property sync', async () => {
		const helper = new OcaHelper()
		await helper.loadRoleMap(new Map<string, unknown>([['Faders/1', makeObj(OcaGain, 1)]]))

		await helper.addActionId('Faders/1', 'a1')
		await helper.addFeedbackId('Faders/1', 'f1')
		const props = helper.getEntry('Faders/1')?.properties as unknown as FakePropertySync

		helper.clearAllIds('Faders/1')

		expect(helper.resolveActionId('a1')).toBeUndefined()
		expect(helper.resolveFeedbackId('f1')).toBeUndefined()
		expect(helper.getEntry('Faders/1')?.actionIds.size).toBe(0)
		expect(helper.getEntry('Faders/1')?.feedbackIds.size).toBe(0)
		expect(props.Dispose).toHaveBeenCalledTimes(1)
	})

	it('is a no-op for an unregistered path', () => {
		const helper = new OcaHelper()
		expect(() => helper.clearAllIds('Nope')).not.toThrow()
	})
})

// ---------------------------------------------------------------------------
// getClassProperties
// ---------------------------------------------------------------------------

describe('getClassProperties', () => {
	it('returns [] for a class with no registered members', async () => {
		const helper = new OcaHelper()
		await expect(helper.getClassProperties(OCA_CLASS_NAMES.OcaGain)).resolves.toEqual([])
	})

	it('describes properties, excluding ClassID and undefined values, deriving write from Set<Name> presence', async () => {
		const helper = new OcaHelper()
		const gain = makeObj(OcaGain, 1)
		await helper.loadRoleMap(new Map<string, unknown>([['Faders/1', gain]]))

		const { propertySync } = rigOf(gain)
		propertySync.forEach.mockImplementation((cb: (value: unknown, name: string) => void) => {
			cb('1.1.1.5', 'ClassID')
			cb(1, 'ObjectNumber') // no SetObjectNumber -> not writable
			cb(-3.5, 'Gain') // OcaGain has SetGain -> writable
			cb(undefined, 'Ignored')
		})

		const props = await helper.getClassProperties(OCA_CLASS_NAMES.OcaGain)

		expect(props).toEqual([
			{ name: 'ObjectNumber', type: 'number', read: true, write: false },
			{ name: 'Gain', type: 'number', read: true, write: true },
		])
	})

	it('disposes the temporary property sync when the object has no registered action/feedback IDs', async () => {
		const helper = new OcaHelper()
		const gain = makeObj(OcaGain, 1)
		await helper.loadRoleMap(new Map<string, unknown>([['Faders/1', gain]]))
		const { propertySync } = rigOf(gain)

		await helper.getClassProperties(OCA_CLASS_NAMES.OcaGain)

		expect(propertySync.Dispose).toHaveBeenCalledTimes(1)
	})

	it('leaves the property sync open when the object already has registered IDs', async () => {
		const helper = new OcaHelper()
		const gain = makeObj(OcaGain, 1)
		await helper.loadRoleMap(new Map<string, unknown>([['Faders/1', gain]]))
		await helper.addActionId('Faders/1', 'a1')
		const { propertySync } = rigOf(gain)
		propertySync.Dispose.mockClear()

		await helper.getClassProperties(OCA_CLASS_NAMES.OcaGain)

		expect(propertySync.Dispose).not.toHaveBeenCalled()
	})
})

// ---------------------------------------------------------------------------
// Static type guards
// ---------------------------------------------------------------------------

describe('static type guards', () => {
	it('match only their exact class, not a shared base class', () => {
		const gain = makeObj(OcaGain, 1)
		const mute = makeObj(OcaMute, 2)

		expect(OcaHelper.isOcaGain(gain)).toBe(true)
		expect(OcaHelper.isOcaGain(mute)).toBe(false)
		expect(OcaHelper.isOcaMute(mute)).toBe(true)

		// Both are OcaActuator subclasses, but the exact-class guard for the
		// abstract base should reject concrete subclasses.
		expect(OcaHelper.isOcaActuator(gain)).toBe(false)
	})

	it('distinguishes nested sensor subtypes', () => {
		const audioLevel = makeObj(OcaAudioLevelSensor, 1)
		const level = makeObj(OcaLevelSensor, 2)

		expect(OcaHelper.isOcaAudioLevelSensor(audioLevel)).toBe(true)
		expect(OcaHelper.isOcaLevelSensor(audioLevel)).toBe(false)
		expect(OcaHelper.isOcaLevelSensor(level)).toBe(true)
	})

	it('rejects values of an unrelated type', () => {
		expect(OcaHelper.isOcaGain({})).toBe(false)
		expect(OcaHelper.isOcaGain(null)).toBe(false)
		expect(OcaHelper.isOcaGain(undefined)).toBe(false)
	})

	describe('isValidClassName', () => {
		it('accepts every known class name and rejects unknown strings', () => {
			expect(OcaHelper.isValidClassName('OcaGain')).toBe(true)
			expect(OcaHelper.isValidClassName('NotARealClass')).toBe(false)
		})
	})
})

// ---------------------------------------------------------------------------
// Class ID conversion
// ---------------------------------------------------------------------------

describe('classIdToBinary / classIdToDotted', () => {
	it('converts a dotted class ID to its binary string form and back', () => {
		const dotted = '1.2.33'
		const binary = OcaHelper.classIdToBinary(dotted)

		expect(binary).toBe('!')
		expect(OcaHelper.classIdToDotted(binary)).toBe(dotted)
	})

	it('treats the empty string as its own round trip', () => {
		expect(OcaHelper.classIdToBinary('')).toBe('')
		expect(OcaHelper.classIdToDotted('')).toBe('')
	})
})
