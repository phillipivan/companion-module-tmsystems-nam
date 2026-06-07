import {
	OcaActuator,
	OcaAgent,
	OcaApplicationNetwork,
	OcaAudioLevelSensor,
	OcaAudioProcessingManager,
	OcaBasicActuator,
	OcaBasicSensor,
	OcaBitstringActuator,
	OcaBitstringSensor,
	OcaBlock,
	OcaBlockFactoryAgent,
	OcaBooleanActuator,
	OcaBooleanSensor,
	OcaCodingManager,
	OcaControlNetwork,
	OcaCurrentSensor,
	OcaDelay,
	OcaDelayExtended,
	OcaDeviceManager,
	OcaDeviceTimeManager,
	OcaDiagnosticManager,
	OcaDynamics,
	OcaDynamicsCurve,
	OcaDynamicsDetector,
	OcaFilterArbitraryCurve,
	OcaFilterClassical,
	OcaFilterFIR,
	OcaFilterParametric,
	OcaFilterPolynomial,
	OcaFirmwareManager,
	OcaFloat32Actuator,
	OcaFloat32Sensor,
	OcaFloat64Actuator,
	OcaFloat64Sensor,
	OcaFrequencyActuator,
	OcaFrequencySensor,
	OcaGain,
	OcaGainSensor,
	OcaGrouper,
	OcaIdentificationActuator,
	OcaIdentificationSensor,
	OcaImpedanceSensor,
	OcaInt16Actuator,
	OcaInt16Sensor,
	OcaInt32Actuator,
	OcaInt32Sensor,
	OcaInt64Actuator,
	OcaInt64Sensor,
	OcaInt8Actuator,
	OcaInt8Sensor,
	OcaLevelSensor,
	OcaLibraryManager,
	OcaManager,
	OcaMatrix,
	OcaMediaClock,
	OcaMediaClock3,
	OcaMediaClockManager,
	OcaMediaTransportNetwork,
	OcaMute,
	OcaNetwork,
	OcaNetworkManager,
	OcaNetworkSignalChannel,
	OcaNumericObserver,
	OcaNumericObserverList,
	OcaPanBalance,
	OcaPhysicalPosition,
	OcaPolarity,
	OcaPowerManager,
	OcaPowerSupply,
	OcaRamper,
	OcaRoot,
	OcaSecurityManager,
	OcaSensor,
	OcaSignalGenerator,
	OcaSignalInput,
	OcaSignalOutput,
	OcaStreamConnector,
	OcaStreamNetwork,
	OcaStringActuator,
	OcaStringSensor,
	OcaSubscriptionManager,
	OcaSummingPoint,
	OcaSwitch,
	OcaTaskManager,
	OcaTemperatureActuator,
	OcaTemperatureSensor,
	OcaTimeIntervalSensor,
	OcaTimeSource,
	OcaUint16Actuator,
	OcaUint16Sensor,
	OcaUint32Actuator,
	OcaUint32Sensor,
	OcaUint64Actuator,
	OcaUint64Sensor,
	OcaUint8Actuator,
	OcaUint8Sensor,
	OcaVoltageSensor,
	OcaWorker,
} from 'aes70/src/controller/ControlClasses.js'
import { ObjectBase } from 'aes70/src/controller/object_base.js'
import type { PropertySync, OcaRootProperties, OcaClassName } from '../types/aes70.js'
import { OCA_CLASS_NAMES } from '../types/aes70.js'
import { createModuleLogger } from '@companion-module/base'
import EventEmitter from 'events'

// ---------------------------------------------------------------------------
// Event map
// ---------------------------------------------------------------------------

export interface DetermineOcaClassEvents {
	ObjectBase: [obj: ObjectBase]
	OcaRoot: [obj: OcaRoot]
	OcaWorker: [obj: OcaWorker]
	// --- Actuators ---
	OcaActuator: [obj: OcaActuator]
	OcaMute: [obj: OcaMute]
	OcaPolarity: [obj: OcaPolarity]
	OcaSwitch: [obj: OcaSwitch]
	OcaGain: [obj: OcaGain]
	OcaPanBalance: [obj: OcaPanBalance]
	OcaDelay: [obj: OcaDelay]
	OcaDelayExtended: [obj: OcaDelayExtended]
	OcaFrequencyActuator: [obj: OcaFrequencyActuator]
	OcaFilterClassical: [obj: OcaFilterClassical]
	OcaFilterParametric: [obj: OcaFilterParametric]
	OcaFilterPolynomial: [obj: OcaFilterPolynomial]
	OcaFilterFIR: [obj: OcaFilterFIR]
	OcaFilterArbitraryCurve: [obj: OcaFilterArbitraryCurve]
	OcaDynamics: [obj: OcaDynamics]
	OcaDynamicsDetector: [obj: OcaDynamicsDetector]
	OcaDynamicsCurve: [obj: OcaDynamicsCurve]
	OcaSignalGenerator: [obj: OcaSignalGenerator]
	OcaSignalInput: [obj: OcaSignalInput]
	OcaSignalOutput: [obj: OcaSignalOutput]
	OcaTemperatureActuator: [obj: OcaTemperatureActuator]
	OcaIdentificationActuator: [obj: OcaIdentificationActuator]
	OcaSummingPoint: [obj: OcaSummingPoint]
	OcaBasicActuator: [obj: OcaBasicActuator]
	OcaBooleanActuator: [obj: OcaBooleanActuator]
	OcaInt8Actuator: [obj: OcaInt8Actuator]
	OcaInt16Actuator: [obj: OcaInt16Actuator]
	OcaInt32Actuator: [obj: OcaInt32Actuator]
	OcaInt64Actuator: [obj: OcaInt64Actuator]
	OcaUint8Actuator: [obj: OcaUint8Actuator]
	OcaUint16Actuator: [obj: OcaUint16Actuator]
	OcaUint32Actuator: [obj: OcaUint32Actuator]
	OcaUint64Actuator: [obj: OcaUint64Actuator]
	OcaFloat32Actuator: [obj: OcaFloat32Actuator]
	OcaFloat64Actuator: [obj: OcaFloat64Actuator]
	OcaStringActuator: [obj: OcaStringActuator]
	OcaBitstringActuator: [obj: OcaBitstringActuator]
	// --- Sensors ---
	OcaSensor: [obj: OcaSensor]
	OcaLevelSensor: [obj: OcaLevelSensor]
	OcaAudioLevelSensor: [obj: OcaAudioLevelSensor]
	OcaTimeIntervalSensor: [obj: OcaTimeIntervalSensor]
	OcaFrequencySensor: [obj: OcaFrequencySensor]
	OcaTemperatureSensor: [obj: OcaTemperatureSensor]
	OcaIdentificationSensor: [obj: OcaIdentificationSensor]
	OcaVoltageSensor: [obj: OcaVoltageSensor]
	OcaCurrentSensor: [obj: OcaCurrentSensor]
	OcaImpedanceSensor: [obj: OcaImpedanceSensor]
	OcaGainSensor: [obj: OcaGainSensor]
	OcaBasicSensor: [obj: OcaBasicSensor]
	OcaBooleanSensor: [obj: OcaBooleanSensor]
	OcaInt8Sensor: [obj: OcaInt8Sensor]
	OcaInt16Sensor: [obj: OcaInt16Sensor]
	OcaInt32Sensor: [obj: OcaInt32Sensor]
	OcaInt64Sensor: [obj: OcaInt64Sensor]
	OcaUint8Sensor: [obj: OcaUint8Sensor]
	OcaUint16Sensor: [obj: OcaUint16Sensor]
	OcaUint32Sensor: [obj: OcaUint32Sensor]
	OcaUint64Sensor: [obj: OcaUint64Sensor]
	OcaFloat32Sensor: [obj: OcaFloat32Sensor]
	OcaFloat64Sensor: [obj: OcaFloat64Sensor]
	OcaStringSensor: [obj: OcaStringSensor]
	OcaBitstringSensor: [obj: OcaBitstringSensor]
	// --- Workers (structural) ---
	OcaBlock: [obj: OcaBlock]
	OcaBlockFactory: [obj: OcaBlockFactoryAgent]
	OcaMatrix: [obj: OcaMatrix]
	// --- Agents ---
	OcaAgent: [obj: OcaAgent]
	OcaGrouper: [obj: OcaGrouper]
	OcaRamper: [obj: OcaRamper]
	OcaNumericObserver: [obj: OcaNumericObserver]
	OcaNumericObserverList: [obj: OcaNumericObserverList]
	OcaPowerSupply: [obj: OcaPowerSupply]
	OcaMediaClock3: [obj: OcaMediaClock3]
	OcaTimeSource: [obj: OcaTimeSource]
	OcaPhysicalPosition: [obj: OcaPhysicalPosition]
	// --- Networks ---
	OcaApplicationNetwork: [obj: OcaApplicationNetwork]
	OcaControlNetwork: [obj: OcaControlNetwork]
	OcaMediaTransportNetwork: [obj: OcaMediaTransportNetwork]
	// --- Managers ---
	OcaManager: [obj: OcaManager]
	OcaDeviceManager: [obj: OcaDeviceManager]
	OcaSecurityManager: [obj: OcaSecurityManager]
	OcaFirmwareManager: [obj: OcaFirmwareManager]
	OcaSubscriptionManager: [obj: OcaSubscriptionManager]
	OcaPowerManager: [obj: OcaPowerManager]
	OcaNetworkManager: [obj: OcaNetworkManager]
	OcaMediaClockManager: [obj: OcaMediaClockManager]
	OcaLibraryManager: [obj: OcaLibraryManager]
	OcaAudioProcessingManager: [obj: OcaAudioProcessingManager]
	OcaDeviceTimeManager: [obj: OcaDeviceTimeManager]
	OcaTaskManager: [obj: OcaTaskManager]
	OcaCodingManager: [obj: OcaCodingManager]
	OcaDiagnosticManager: [obj: OcaDiagnosticManager]
	// --- Deprecated v1 classes ---
	OcaNetworkSignalChannel: [obj: OcaNetworkSignalChannel]
	OcaNetwork: [obj: OcaNetwork]
	OcaMediaClock: [obj: OcaMediaClock]
	OcaStreamNetwork: [obj: OcaStreamNetwork]
	OcaStreamConnector: [obj: OcaStreamConnector]
}

// ---------------------------------------------------------------------------
// Registry types
// ---------------------------------------------------------------------------

/**
 * The per-object record stored inside OcaHelper for every role path
 * loaded from the device.
 */
export interface ObjectEntry {
	/** The live OCA control object. */
	readonly obj: ObjectBase
	/** The exact OCA class name resolved for this object (e.g. 'OcaGain'). */
	readonly className: OcaClassName
	/** Action IDs associated with this object. */
	readonly actionIds: Set<string>
	/** Feedback IDs associated with this object. */
	readonly feedbackIds: Set<string>
	/**
	 * Active property sync handle. Present when at least one action or feedback
	 * ID is registered; undefined when the object has no registered IDs and
	 * subscriptions have been disposed.
	 */
	properties?: PropertySync<OcaRootProperties>
}

// ---------------------------------------------------------------------------
// OcaHelper
// ---------------------------------------------------------------------------

/**
 * Central registry and class-dispatch helper for AES70 / OCA devices.
 *
 * ### Loading
 * ```ts
 * const helper = new OcaHelper()
 * const roleMap = await device.get_role_map('/')
 * helper.loadRoleMap(roleMap)
 * ```
 *
 * ### Listening for classes
 * ```ts
 * helper.on(OCA_CLASS_NAMES.OcaGain, (obj) => {
 *   obj.GetGain().then(([gain]) => console.log('Gain:', gain))
 * })
 * ```
 *
 * ### Querying by class
 * ```ts
 * const gainPaths = helper.getByClass(OCA_CLASS_NAMES.OcaGain)  // Set<string>
 * for (const path of gainPaths) {
 *   const entry = helper.getEntry(path)!
 *   const gain = entry.obj as OcaGain
 * }
 * ```
 *
 * ### Action / feedback IDs
 * ```ts
 * helper.addActionId('Faders/Master', 'fader-osc-001')
 * helper.addFeedbackId('Faders/Master', 'sub-abc123')
 *
 * // Reverse lookups (O(1))
 * const path = helper.resolveActionId('fader-osc-001')   // 'Faders/Master'
 * const path2 = helper.resolveFeedbackId('sub-abc123')   // 'Faders/Master'
 * ```
 *
 * ### Reloading
 * Calling `loadRoleMap` again performs a clean swap: the previous roleMap,
 * classIndex, and reverse-lookup indexes are all rebuilt. Any action/feedback
 * IDs that were registered against paths that still exist in the new map are
 * preserved; IDs for paths that no longer exist are removed and the
 * `'ids:orphaned'` event is emitted with the affected paths.
 */
export class OcaHelper extends EventEmitter<DetermineOcaClassEvents & OcaHelperInternalEvents> {
	// -------------------------------------------------------------------------
	// Internal state
	// -------------------------------------------------------------------------

	private readonly logger = createModuleLogger('OCA Helper')

	/**
	 * Source of truth: the role-path → OCA object map exactly as returned by
	 * `RemoteDevice.get_role_map()`.
	 */
	private _roleMap: Map<string, ObjectBase> = new Map()

	/**
	 * Class index: OCA class name → set of role paths that have that exact
	 * class.  Built automatically by `loadRoleMap` / `_registerObject`.
	 *
	 * Keys are the most-derived class name resolved by `_resolveClassName`,
	 * e.g. `'OcaGain'`, `'OcaDelayExtended'`, `'OcaDeviceManager'`.
	 */
	private _classIndex: Map<OcaClassName, Set<string>> = new Map()

	/**
	 * Per-object registry: role path → ObjectEntry.
	 * Holds the resolved class name plus the action/feedback ID sets.
	 */
	private _objectRegistry: Map<string, ObjectEntry> = new Map()

	/**
	 * Reverse lookup: actionId → role path.
	 * Kept in sync with every add/remove action call.
	 */
	private _actionIndex: Map<string, string> = new Map()

	/**
	 * Reverse lookup: feedbackId → role path.
	 * Kept in sync with every add/remove feedback call.
	 */
	private _feedbackIndex: Map<string, string> = new Map()

	// -------------------------------------------------------------------------
	// Constructor
	// -------------------------------------------------------------------------

	constructor() {
		super()
	}

	// -------------------------------------------------------------------------
	// Loading
	// -------------------------------------------------------------------------

	/**
	 * Populate the helper from the map returned by
	 * `RemoteDevice.get_role_map(separator)`.
	 *
	 * Safe to call multiple times — a second call rebuilds all indexes.
	 * Existing action/feedback IDs for paths that survive in the new map are
	 * migrated; IDs for paths that no longer exist are dropped and the
	 * `'ids:orphaned'` event fires.
	 *
	 * @param roleMap - The `Map<string, object>` from `get_role_map()`.
	 */
	public loadRoleMap(roleMap: Map<string, unknown>): void {
		// Snapshot existing ID registrations so we can migrate or orphan them
		const previousEntries = new Map(this._objectRegistry)

		// Wipe all indexes
		this._roleMap = new Map()
		this._classIndex = new Map()
		this._objectRegistry = new Map()
		this._actionIndex = new Map()
		this._feedbackIndex = new Map()

		// Populate
		for (const [rolePath, obj] of roleMap) {
			if (!(obj instanceof ObjectBase)) continue
			this._roleMap.set(rolePath, obj)
			this._registerObject(rolePath, obj)
		}

		// Migrate or orphan previous ID registrations
		const orphanedPaths: string[] = []
		for (const [rolePath, previousEntry] of previousEntries) {
			const currentEntry = this._objectRegistry.get(rolePath)
			if (!currentEntry) {
				// Path no longer exists — collect orphaned IDs for the event
				if (previousEntry.actionIds.size > 0 || previousEntry.feedbackIds.size > 0) {
					orphanedPaths.push(rolePath)
				}
				continue
			}
			// Path still exists — restore its IDs
			for (const actionId of previousEntry.actionIds) {
				currentEntry.actionIds.add(actionId)
				this._actionIndex.set(actionId, rolePath)
			}
			for (const feedbackId of previousEntry.feedbackIds) {
				currentEntry.feedbackIds.add(feedbackId)
				this._feedbackIndex.set(feedbackId, rolePath)
			}
		}

		if (orphanedPaths.length > 0) {
			this.emit('ids:orphaned', orphanedPaths)
		}

		this.emit('map:loaded', this._roleMap)
	}

	/**
	 * Register a single object into all internal indexes and emit its typed
	 * class event.  Called by `loadRoleMap` for every entry in the role map.
	 */
	private _registerObject(rolePath: string, obj: ObjectBase): void {
		const className = this._resolveClassName(obj)

		// classIndex
		let classSet = this._classIndex.get(className)
		if (!classSet) {
			classSet = new Set()
			this._classIndex.set(className, classSet)
		}
		classSet.add(rolePath)

		// objectRegistry
		this._objectRegistry.set(rolePath, {
			obj,
			className,
			actionIds: new Set(),
			feedbackIds: new Set(),
		})

		// Emit typed event
		this.determineClass(obj)
	}

	// -------------------------------------------------------------------------
	// Class-dispatch (determineClass)
	// -------------------------------------------------------------------------

	/**
	 * Determine the concrete OCA class of `obj` and emit the corresponding
	 * typed event. If `obj` is an array its elements are processed
	 * recursively, making it safe to pass the tree from
	 * `RemoteDevice.get_device_tree()` directly.
	 *
	 * When called internally by `loadRoleMap` this is how typed events reach
	 * consumers.  You can also call it directly if you receive ad-hoc objects
	 * outside of a role map.
	 */
	public determineClass(obj: unknown): void {
		if (Array.isArray(obj)) {
			for (const element of obj) this.determineClass(element)
			return
		}

		if (!(obj instanceof ObjectBase)) return
		if (!(obj instanceof OcaRoot)) {
			this.emit('ObjectBase', obj)
			return
		}

		if (obj instanceof OcaWorker) {
			this.emit('OcaWorker', obj)
			if (obj instanceof OcaActuator) {
				this._emitActuator(obj)
				return
			}
			if (obj instanceof OcaSensor) {
				this._emitSensor(obj)
				return
			}
			if (obj instanceof OcaBlock) {
				this.emit('OcaBlock', obj)
				return
			}
			if (obj instanceof OcaBlockFactoryAgent) {
				this.emit('OcaBlockFactory', obj)
				return
			}
			if (obj instanceof OcaMatrix) {
				this.emit('OcaMatrix', obj)
				return
			}
			return
		}

		if (obj instanceof OcaAgent) {
			this._emitAgent(obj)
			return
		}
		if (obj instanceof OcaManager) {
			this._emitManager(obj)
			return
		}

		if (obj instanceof OcaMediaTransportNetwork) {
			this.emit('OcaMediaTransportNetwork', obj)
			return
		}
		if (obj instanceof OcaControlNetwork) {
			this.emit('OcaControlNetwork', obj)
			return
		}
		if (obj instanceof OcaApplicationNetwork) {
			this.emit('OcaApplicationNetwork', obj)
			return
		}

		if (obj instanceof OcaNetworkSignalChannel) {
			this.emit('OcaNetworkSignalChannel', obj)
			return
		}
		if (obj instanceof OcaStreamConnector) {
			this.emit('OcaStreamConnector', obj)
			return
		}
		if (obj instanceof OcaStreamNetwork) {
			this.emit('OcaStreamNetwork', obj)
			return
		}
		if (obj instanceof OcaNetwork) {
			this.emit('OcaNetwork', obj)
			return
		}
		if (obj instanceof OcaMediaClock) {
			this.emit('OcaMediaClock', obj)
			return
		}

		this.emit('OcaRoot', obj)
	}

	// -------------------------------------------------------------------------
	// Class-name resolver (mirrors determineClass without emitting)
	// -------------------------------------------------------------------------

	/**
	 * Resolve the most-derived known class name for `obj` without emitting
	 * any event.  Falls back to `'ObjectBase'` for unrecognised objects.
	 */
	private _resolveClassName(obj: ObjectBase): OcaClassName {
		if (!(obj instanceof OcaRoot)) return OCA_CLASS_NAMES.ObjectBase

		if (obj instanceof OcaWorker) {
			if (obj instanceof OcaActuator) return this._resolveActuatorName(obj)
			if (obj instanceof OcaSensor) return this._resolveSensorName(obj)
			if (obj instanceof OcaBlock) return OCA_CLASS_NAMES.OcaBlock
			if (obj instanceof OcaBlockFactoryAgent) return OCA_CLASS_NAMES.OcaBlockFactory
			if (obj instanceof OcaMatrix) return OCA_CLASS_NAMES.OcaMatrix
			return OCA_CLASS_NAMES.OcaWorker
		}
		if (obj instanceof OcaAgent) return this._resolveAgentName(obj)
		if (obj instanceof OcaManager) return this._resolveManagerName(obj)
		if (obj instanceof OcaMediaTransportNetwork) return OCA_CLASS_NAMES.OcaMediaTransportNetwork
		if (obj instanceof OcaControlNetwork) return OCA_CLASS_NAMES.OcaControlNetwork
		if (obj instanceof OcaApplicationNetwork) return OCA_CLASS_NAMES.OcaApplicationNetwork
		if (obj instanceof OcaNetworkSignalChannel) return OCA_CLASS_NAMES.OcaNetworkSignalChannel
		if (obj instanceof OcaStreamConnector) return OCA_CLASS_NAMES.OcaStreamConnector
		if (obj instanceof OcaStreamNetwork) return OCA_CLASS_NAMES.OcaStreamNetwork
		if (obj instanceof OcaNetwork) return OCA_CLASS_NAMES.OcaNetwork
		if (obj instanceof OcaMediaClock) return OCA_CLASS_NAMES.OcaMediaClock
		return OCA_CLASS_NAMES.OcaRoot
	}

	private _resolveActuatorName(obj: OcaActuator): OcaClassName {
		if (obj instanceof OcaMute) return OCA_CLASS_NAMES.OcaMute
		if (obj instanceof OcaPolarity) return OCA_CLASS_NAMES.OcaPolarity
		if (obj instanceof OcaSwitch) return OCA_CLASS_NAMES.OcaSwitch
		if (obj instanceof OcaGain) return OCA_CLASS_NAMES.OcaGain
		if (obj instanceof OcaPanBalance) return OCA_CLASS_NAMES.OcaPanBalance
		if (obj instanceof OcaDelayExtended) return OCA_CLASS_NAMES.OcaDelayExtended
		if (obj instanceof OcaDelay) return OCA_CLASS_NAMES.OcaDelay
		if (obj instanceof OcaFrequencyActuator) return OCA_CLASS_NAMES.OcaFrequencyActuator
		if (obj instanceof OcaFilterClassical) return OCA_CLASS_NAMES.OcaFilterClassical
		if (obj instanceof OcaFilterParametric) return OCA_CLASS_NAMES.OcaFilterParametric
		if (obj instanceof OcaFilterPolynomial) return OCA_CLASS_NAMES.OcaFilterPolynomial
		if (obj instanceof OcaFilterFIR) return OCA_CLASS_NAMES.OcaFilterFIR
		if (obj instanceof OcaFilterArbitraryCurve) return OCA_CLASS_NAMES.OcaFilterArbitraryCurve
		if (obj instanceof OcaDynamics) return OCA_CLASS_NAMES.OcaDynamics
		if (obj instanceof OcaDynamicsDetector) return OCA_CLASS_NAMES.OcaDynamicsDetector
		if (obj instanceof OcaDynamicsCurve) return 'OcaDynamicsCurve'
		if (obj instanceof OcaSignalGenerator) return 'OcaSignalGenerator'
		if (obj instanceof OcaSignalInput) return OCA_CLASS_NAMES.OcaSignalInput
		if (obj instanceof OcaSignalOutput) return OCA_CLASS_NAMES.OcaSignalOutput
		if (obj instanceof OcaTemperatureActuator) return OCA_CLASS_NAMES.OcaTemperatureActuator
		if (obj instanceof OcaIdentificationActuator) return OCA_CLASS_NAMES.OcaIdentificationActuator
		if (obj instanceof OcaSummingPoint) return OCA_CLASS_NAMES.OcaSummingPoint
		if (obj instanceof OcaBasicActuator) {
			if (obj instanceof OcaBooleanActuator) return OCA_CLASS_NAMES.OcaBooleanActuator
			if (obj instanceof OcaInt8Actuator) return OCA_CLASS_NAMES.OcaInt8Actuator
			if (obj instanceof OcaInt16Actuator) return OCA_CLASS_NAMES.OcaInt16Actuator
			if (obj instanceof OcaInt32Actuator) return OCA_CLASS_NAMES.OcaInt32Actuator
			if (obj instanceof OcaInt64Actuator) return OCA_CLASS_NAMES.OcaInt64Actuator
			if (obj instanceof OcaUint8Actuator) return OCA_CLASS_NAMES.OcaUint8Actuator
			if (obj instanceof OcaUint16Actuator) return OCA_CLASS_NAMES.OcaUint16Actuator
			if (obj instanceof OcaUint32Actuator) return OCA_CLASS_NAMES.OcaUint32Actuator
			if (obj instanceof OcaUint64Actuator) return OCA_CLASS_NAMES.OcaUint64Actuator
			if (obj instanceof OcaFloat32Actuator) return OCA_CLASS_NAMES.OcaFloat32Actuator
			if (obj instanceof OcaFloat64Actuator) return OCA_CLASS_NAMES.OcaFloat64Actuator
			if (obj instanceof OcaStringActuator) return OCA_CLASS_NAMES.OcaStringActuator
			if (obj instanceof OcaBitstringActuator) return OCA_CLASS_NAMES.OcaBitstringActuator
			return OCA_CLASS_NAMES.OcaBasicActuator
		}
		return OCA_CLASS_NAMES.OcaActuator
	}

	private _resolveSensorName(obj: OcaSensor): OcaClassName {
		if (obj instanceof OcaLevelSensor) {
			if (obj instanceof OcaAudioLevelSensor) return OCA_CLASS_NAMES.OcaAudioLevelSensor
			return OCA_CLASS_NAMES.OcaLevelSensor
		}
		if (obj instanceof OcaTimeIntervalSensor) return OCA_CLASS_NAMES.OcaTimeIntervalSensor
		if (obj instanceof OcaFrequencySensor) return OCA_CLASS_NAMES.OcaFrequencySensor
		if (obj instanceof OcaTemperatureSensor) return OCA_CLASS_NAMES.OcaTemperatureSensor
		if (obj instanceof OcaIdentificationSensor) return OCA_CLASS_NAMES.OcaIdentificationSensor
		if (obj instanceof OcaVoltageSensor) return OCA_CLASS_NAMES.OcaVoltageSensor
		if (obj instanceof OcaCurrentSensor) return OCA_CLASS_NAMES.OcaCurrentSensor
		if (obj instanceof OcaImpedanceSensor) return OCA_CLASS_NAMES.OcaImpedanceSensor
		if (obj instanceof OcaGainSensor) return OCA_CLASS_NAMES.OcaGainSensor
		if (obj instanceof OcaBasicSensor) {
			if (obj instanceof OcaBooleanSensor) return OCA_CLASS_NAMES.OcaBooleanSensor
			if (obj instanceof OcaInt8Sensor) return OCA_CLASS_NAMES.OcaInt8Sensor
			if (obj instanceof OcaInt16Sensor) return OCA_CLASS_NAMES.OcaInt16Sensor
			if (obj instanceof OcaInt32Sensor) return OCA_CLASS_NAMES.OcaInt32Sensor
			if (obj instanceof OcaInt64Sensor) return OCA_CLASS_NAMES.OcaInt64Sensor
			if (obj instanceof OcaUint8Sensor) return OCA_CLASS_NAMES.OcaUint8Sensor
			if (obj instanceof OcaUint16Sensor) return OCA_CLASS_NAMES.OcaUint16Sensor
			if (obj instanceof OcaUint32Sensor) return OCA_CLASS_NAMES.OcaUint32Sensor
			if (obj instanceof OcaUint64Sensor) return OCA_CLASS_NAMES.OcaUint64Sensor
			if (obj instanceof OcaFloat32Sensor) return OCA_CLASS_NAMES.OcaFloat32Sensor
			if (obj instanceof OcaFloat64Sensor) return OCA_CLASS_NAMES.OcaFloat64Sensor
			if (obj instanceof OcaStringSensor) return OCA_CLASS_NAMES.OcaStringSensor
			if (obj instanceof OcaBitstringSensor) return OCA_CLASS_NAMES.OcaBitstringSensor
			return OCA_CLASS_NAMES.OcaBasicSensor
		}
		return OCA_CLASS_NAMES.OcaSensor
	}

	private _resolveAgentName(obj: OcaAgent): OcaClassName {
		if (obj instanceof OcaGrouper) return OCA_CLASS_NAMES.OcaGrouper
		if (obj instanceof OcaNumericObserverList) return OCA_CLASS_NAMES.OcaNumericObserverList
		if (obj instanceof OcaNumericObserver) return OCA_CLASS_NAMES.OcaNumericObserver
		if (obj instanceof OcaRamper) return OCA_CLASS_NAMES.OcaRamper
		if (obj instanceof OcaPowerSupply) return OCA_CLASS_NAMES.OcaPowerSupply
		if (obj instanceof OcaMediaClock3) return OCA_CLASS_NAMES.OcaMediaClock3
		if (obj instanceof OcaTimeSource) return OCA_CLASS_NAMES.OcaTimeSource
		if (obj instanceof OcaPhysicalPosition) return OCA_CLASS_NAMES.OcaPhysicalPosition
		return OCA_CLASS_NAMES.OcaAgent
	}

	private _resolveManagerName(obj: OcaManager): OcaClassName {
		if (obj instanceof OcaDeviceManager) return OCA_CLASS_NAMES.OcaDeviceManager
		if (obj instanceof OcaSecurityManager) return OCA_CLASS_NAMES.OcaSecurityManager
		if (obj instanceof OcaFirmwareManager) return OCA_CLASS_NAMES.OcaFirmwareManager
		if (obj instanceof OcaSubscriptionManager) return OCA_CLASS_NAMES.OcaSubscriptionManager
		if (obj instanceof OcaPowerManager) return OCA_CLASS_NAMES.OcaPowerManager
		if (obj instanceof OcaNetworkManager) return OCA_CLASS_NAMES.OcaNetworkManager
		if (obj instanceof OcaMediaClockManager) return OCA_CLASS_NAMES.OcaMediaClockManager
		if (obj instanceof OcaLibraryManager) return OCA_CLASS_NAMES.OcaLibraryManager
		if (obj instanceof OcaAudioProcessingManager) return OCA_CLASS_NAMES.OcaAudioProcessingManager
		if (obj instanceof OcaDeviceTimeManager) return OCA_CLASS_NAMES.OcaDeviceTimeManager
		if (obj instanceof OcaTaskManager) return OCA_CLASS_NAMES.OcaTaskManager
		if (obj instanceof OcaCodingManager) return OCA_CLASS_NAMES.OcaCodingManager
		if (obj instanceof OcaDiagnosticManager) return OCA_CLASS_NAMES.OcaDiagnosticManager
		return OCA_CLASS_NAMES.OcaManager
	}

	// -------------------------------------------------------------------------
	// Private emit helpers (determineClass delegates here)
	// -------------------------------------------------------------------------

	private _emitActuator(obj: OcaActuator): void {
		if (obj instanceof OcaMute) this.emit(OCA_CLASS_NAMES.OcaMute, obj)
		else if (obj instanceof OcaPolarity) this.emit(OCA_CLASS_NAMES.OcaPolarity, obj)
		else if (obj instanceof OcaSwitch) this.emit(OCA_CLASS_NAMES.OcaSwitch, obj)
		else if (obj instanceof OcaGain) this.emit(OCA_CLASS_NAMES.OcaGain, obj)
		else if (obj instanceof OcaPanBalance) this.emit(OCA_CLASS_NAMES.OcaPanBalance, obj)
		else if (obj instanceof OcaDelayExtended) this.emit(OCA_CLASS_NAMES.OcaDelayExtended, obj)
		else if (obj instanceof OcaDelay) this.emit(OCA_CLASS_NAMES.OcaDelay, obj)
		else if (obj instanceof OcaFrequencyActuator) this.emit(OCA_CLASS_NAMES.OcaFrequencyActuator, obj)
		else if (obj instanceof OcaFilterClassical) this.emit(OCA_CLASS_NAMES.OcaFilterClassical, obj)
		else if (obj instanceof OcaFilterParametric) this.emit(OCA_CLASS_NAMES.OcaFilterParametric, obj)
		else if (obj instanceof OcaFilterPolynomial) this.emit(OCA_CLASS_NAMES.OcaFilterPolynomial, obj)
		else if (obj instanceof OcaFilterFIR) this.emit(OCA_CLASS_NAMES.OcaFilterFIR, obj)
		else if (obj instanceof OcaFilterArbitraryCurve) this.emit(OCA_CLASS_NAMES.OcaFilterArbitraryCurve, obj)
		else if (obj instanceof OcaDynamics) this.emit(OCA_CLASS_NAMES.OcaDynamics, obj)
		else if (obj instanceof OcaDynamicsDetector) this.emit(OCA_CLASS_NAMES.OcaDynamicsDetector, obj)
		else if (obj instanceof OcaDynamicsCurve) this.emit(OCA_CLASS_NAMES.OcaDynamicsCurve, obj)
		else if (obj instanceof OcaSignalGenerator) this.emit(OCA_CLASS_NAMES.OcaSignalGenerator, obj)
		else if (obj instanceof OcaSignalInput) this.emit(OCA_CLASS_NAMES.OcaSignalInput, obj)
		else if (obj instanceof OcaSignalOutput) this.emit(OCA_CLASS_NAMES.OcaSignalOutput, obj)
		else if (obj instanceof OcaTemperatureActuator) this.emit(OCA_CLASS_NAMES.OcaTemperatureActuator, obj)
		else if (obj instanceof OcaIdentificationActuator) this.emit(OCA_CLASS_NAMES.OcaIdentificationActuator, obj)
		else if (obj instanceof OcaSummingPoint) this.emit(OCA_CLASS_NAMES.OcaSummingPoint, obj)
		else if (obj instanceof OcaBasicActuator) this._emitBasicActuator(obj)
		else this.emit(OCA_CLASS_NAMES.OcaActuator, obj)
	}

	private _emitBasicActuator(obj: OcaBasicActuator): void {
		if (obj instanceof OcaBooleanActuator) this.emit(OCA_CLASS_NAMES.OcaBooleanActuator, obj)
		else if (obj instanceof OcaInt8Actuator) this.emit(OCA_CLASS_NAMES.OcaInt8Actuator, obj)
		else if (obj instanceof OcaInt16Actuator) this.emit(OCA_CLASS_NAMES.OcaInt16Actuator, obj)
		else if (obj instanceof OcaInt32Actuator) this.emit(OCA_CLASS_NAMES.OcaInt32Actuator, obj)
		else if (obj instanceof OcaInt64Actuator) this.emit(OCA_CLASS_NAMES.OcaInt64Actuator, obj)
		else if (obj instanceof OcaUint8Actuator) this.emit(OCA_CLASS_NAMES.OcaUint8Actuator, obj)
		else if (obj instanceof OcaUint16Actuator) this.emit(OCA_CLASS_NAMES.OcaUint16Actuator, obj)
		else if (obj instanceof OcaUint32Actuator) this.emit(OCA_CLASS_NAMES.OcaUint32Actuator, obj)
		else if (obj instanceof OcaUint64Actuator) this.emit(OCA_CLASS_NAMES.OcaUint64Actuator, obj)
		else if (obj instanceof OcaFloat32Actuator) this.emit(OCA_CLASS_NAMES.OcaFloat32Actuator, obj)
		else if (obj instanceof OcaFloat64Actuator) this.emit(OCA_CLASS_NAMES.OcaFloat64Actuator, obj)
		else if (obj instanceof OcaStringActuator) this.emit(OCA_CLASS_NAMES.OcaStringActuator, obj)
		else if (obj instanceof OcaBitstringActuator) this.emit(OCA_CLASS_NAMES.OcaBitstringActuator, obj)
		else this.emit(OCA_CLASS_NAMES.OcaBasicActuator, obj)
	}

	private _emitSensor(obj: OcaSensor): void {
		if (obj instanceof OcaLevelSensor) {
			if (obj instanceof OcaAudioLevelSensor) this.emit(OCA_CLASS_NAMES.OcaAudioLevelSensor, obj)
			else this.emit(OCA_CLASS_NAMES.OcaLevelSensor, obj)
		} else if (obj instanceof OcaTimeIntervalSensor) this.emit(OCA_CLASS_NAMES.OcaTimeIntervalSensor, obj)
		else if (obj instanceof OcaFrequencySensor) this.emit(OCA_CLASS_NAMES.OcaFrequencySensor, obj)
		else if (obj instanceof OcaTemperatureSensor) this.emit(OCA_CLASS_NAMES.OcaTemperatureSensor, obj)
		else if (obj instanceof OcaIdentificationSensor) this.emit(OCA_CLASS_NAMES.OcaIdentificationSensor, obj)
		else if (obj instanceof OcaVoltageSensor) this.emit(OCA_CLASS_NAMES.OcaVoltageSensor, obj)
		else if (obj instanceof OcaCurrentSensor) this.emit(OCA_CLASS_NAMES.OcaCurrentSensor, obj)
		else if (obj instanceof OcaImpedanceSensor) this.emit(OCA_CLASS_NAMES.OcaImpedanceSensor, obj)
		else if (obj instanceof OcaGainSensor) this.emit(OCA_CLASS_NAMES.OcaGainSensor, obj)
		else if (obj instanceof OcaBasicSensor) this._emitBasicSensor(obj)
		else this.emit(OCA_CLASS_NAMES.OcaSensor, obj)
	}

	private _emitBasicSensor(obj: OcaBasicSensor): void {
		if (obj instanceof OcaBooleanSensor) this.emit(OCA_CLASS_NAMES.OcaBooleanSensor, obj)
		else if (obj instanceof OcaInt8Sensor) this.emit(OCA_CLASS_NAMES.OcaInt8Sensor, obj)
		else if (obj instanceof OcaInt16Sensor) this.emit(OCA_CLASS_NAMES.OcaInt16Sensor, obj)
		else if (obj instanceof OcaInt32Sensor) this.emit(OCA_CLASS_NAMES.OcaInt32Sensor, obj)
		else if (obj instanceof OcaInt64Sensor) this.emit(OCA_CLASS_NAMES.OcaInt64Sensor, obj)
		else if (obj instanceof OcaUint8Sensor) this.emit(OCA_CLASS_NAMES.OcaUint8Sensor, obj)
		else if (obj instanceof OcaUint16Sensor) this.emit(OCA_CLASS_NAMES.OcaUint16Sensor, obj)
		else if (obj instanceof OcaUint32Sensor) this.emit(OCA_CLASS_NAMES.OcaUint32Sensor, obj)
		else if (obj instanceof OcaUint64Sensor) this.emit(OCA_CLASS_NAMES.OcaUint64Sensor, obj)
		else if (obj instanceof OcaFloat32Sensor) this.emit(OCA_CLASS_NAMES.OcaFloat32Sensor, obj)
		else if (obj instanceof OcaFloat64Sensor) this.emit(OCA_CLASS_NAMES.OcaFloat64Sensor, obj)
		else if (obj instanceof OcaStringSensor) this.emit(OCA_CLASS_NAMES.OcaStringSensor, obj)
		else if (obj instanceof OcaBitstringSensor) this.emit(OCA_CLASS_NAMES.OcaBitstringSensor, obj)
		else this.emit(OCA_CLASS_NAMES.OcaBasicSensor, obj)
	}

	private _emitAgent(obj: OcaAgent): void {
		if (obj instanceof OcaGrouper) this.emit(OCA_CLASS_NAMES.OcaGrouper, obj)
		else if (obj instanceof OcaNumericObserverList) this.emit(OCA_CLASS_NAMES.OcaNumericObserverList, obj)
		else if (obj instanceof OcaNumericObserver) this.emit(OCA_CLASS_NAMES.OcaNumericObserver, obj)
		else if (obj instanceof OcaRamper) this.emit(OCA_CLASS_NAMES.OcaRamper, obj)
		else if (obj instanceof OcaPowerSupply) this.emit(OCA_CLASS_NAMES.OcaPowerSupply, obj)
		else if (obj instanceof OcaMediaClock3) this.emit(OCA_CLASS_NAMES.OcaMediaClock3, obj)
		else if (obj instanceof OcaTimeSource) this.emit(OCA_CLASS_NAMES.OcaTimeSource, obj)
		else if (obj instanceof OcaPhysicalPosition) this.emit(OCA_CLASS_NAMES.OcaPhysicalPosition, obj)
		else this.emit(OCA_CLASS_NAMES.OcaAgent, obj)
	}

	private _emitManager(obj: OcaManager): void {
		if (obj instanceof OcaDeviceManager) this.emit(OCA_CLASS_NAMES.OcaDeviceManager, obj)
		else if (obj instanceof OcaSecurityManager) this.emit(OCA_CLASS_NAMES.OcaSecurityManager, obj)
		else if (obj instanceof OcaFirmwareManager) this.emit(OCA_CLASS_NAMES.OcaFirmwareManager, obj)
		else if (obj instanceof OcaSubscriptionManager) this.emit(OCA_CLASS_NAMES.OcaSubscriptionManager, obj)
		else if (obj instanceof OcaPowerManager) this.emit(OCA_CLASS_NAMES.OcaPowerManager, obj)
		else if (obj instanceof OcaNetworkManager) this.emit(OCA_CLASS_NAMES.OcaNetworkManager, obj)
		else if (obj instanceof OcaMediaClockManager) this.emit(OCA_CLASS_NAMES.OcaMediaClockManager, obj)
		else if (obj instanceof OcaLibraryManager) this.emit(OCA_CLASS_NAMES.OcaLibraryManager, obj)
		else if (obj instanceof OcaAudioProcessingManager) this.emit(OCA_CLASS_NAMES.OcaAudioProcessingManager, obj)
		else if (obj instanceof OcaDeviceTimeManager) this.emit(OCA_CLASS_NAMES.OcaDeviceTimeManager, obj)
		else if (obj instanceof OcaTaskManager) this.emit(OCA_CLASS_NAMES.OcaTaskManager, obj)
		else if (obj instanceof OcaCodingManager) this.emit(OCA_CLASS_NAMES.OcaCodingManager, obj)
		else if (obj instanceof OcaDiagnosticManager) this.emit(OCA_CLASS_NAMES.OcaDiagnosticManager, obj)
		else this.emit(OCA_CLASS_NAMES.OcaManager, obj)
	}

	// -------------------------------------------------------------------------
	// Public query API — class index
	// -------------------------------------------------------------------------

	/**
	 * Return the set of role paths for all objects of a given OCA class name.
	 *
	 * Returns an empty set (not undefined) when the class has no members,
	 * so callers can always safely iterate.
	 *
	 * @example
	 * ```ts
	 * for (const path of helper.getByClass('OcaGain')) {
	 *   const entry = helper.getEntry(path)!
	 * }
	 * ```
	 */
	public getByClass(className: OcaClassName): ReadonlySet<string> {
		return this._classIndex.get(className) ?? new Set()
	}

	/**
	 * True if there is at least one object of the given class name in the current
	 * role map.
	 */

	public hasClass(className: OcaClassName): boolean {
		const size = this._classIndex.get(className)?.size ?? 0
		return size > 0
	}

	/**
	 * Return every class name that has at least one registered object,
	 * in insertion order.
	 */
	public getClassNames(): OcaClassName[] {
		return Array.from(this._classIndex.keys())
	}

	/**
	 * Return a snapshot of the full class index as a plain object — useful
	 * for serialisation or debugging.
	 *
	 * ```ts
	 * { OcaGain: ['Faders/Master', 'Faders/Ch1'], OcaMute: [...] }
	 * ```
	 */
	public getClassIndex(): Partial<Record<OcaClassName, string[]>> {
		const out: Partial<Record<OcaClassName, string[]>> = {}
		for (const [cls, paths] of this._classIndex) {
			out[cls] = Array.from(paths)
		}
		return out
	}

	// -------------------------------------------------------------------------
	// Public query API — object registry
	// -------------------------------------------------------------------------

	/**
	 * Return the ObjectEntry for a role path, or `undefined` if the path is
	 * not in the current role map.
	 */
	public getEntry(rolePath: string): ObjectEntry | undefined {
		return this._objectRegistry.get(rolePath)
	}

	/**
	 * Return the live OCA object for a role path, or `undefined`.
	 */
	public getObject(rolePath: string): ObjectBase | undefined {
		return this._objectRegistry.get(rolePath)?.obj
	}

	/**
	 * Return the resolved class name for a role path, or `undefined`.
	 */
	public getClassName(rolePath: string): OcaClassName | undefined {
		return this._objectRegistry.get(rolePath)?.className
	}

	/**
	 * Retrieve a control object by role path with a specific type, using one of
	 * the static type-guard methods as the guard function.
	 * Returns `undefined` if the path is not registered or the guard does not match.
	 *
	 * @example
	 * ```ts
	 * const gain = helper.getTypedObject('Faders/Master', OcaHelper.isOcaGain)
	 * // gain is OcaGain | undefined
	 * ```
	 */
	public getTypedObject<T extends ObjectBase>(rolePath: string, guard: (obj: unknown) => obj is T): T | undefined {
		const obj = this._objectRegistry.get(rolePath)?.obj
		if (obj === undefined) return undefined
		return guard(obj) ? obj : undefined
	}

	/**
	 * Return all registered role paths in insertion order.
	 */
	public getRolePaths(): string[] {
		return Array.from(this._objectRegistry.keys())
	}

	/**
	 * True if the role path is currently registered.
	 */
	public hasPath(rolePath: string): boolean {
		return this._objectRegistry.has(rolePath)
	}

	// -------------------------------------------------------------------------
	// Public API — action IDs
	// -------------------------------------------------------------------------

	/**
	 * Associate an action ID with a role path.
	 *
	 * An action ID is any opaque string your application uses to route
	 * incoming commands to an OCA object — e.g. an OSC address, a MIDI
	 * binding key, or a custom protocol ID.
	 *
	 * Throws if the role path is not in the current map.
	 * If the action ID is already registered to a different path, a warning is
	 * logged, the previous assignment is cleaned up, and the ID is moved to the
	 * new path. If the previous path loses its last ID as a result, its
	 * property subscriptions are disposed.
	 *
	 * If this is the first ID registered to the target path, `GetPropertySync`
	 * is called and awaited so that property values are fetched and subscribed.
	 *
	 * @param rolePath - Role path as returned by `get_role_map`.
	 * @param actionId - Opaque identifier string.
	 */
	public async addActionId(rolePath: string, actionId: string): Promise<void> {
		const entry = this._requireEntry(rolePath)
		const isFirst = !this._hasAnyIds(entry)

		const existing = this._actionIndex.get(actionId)
		if (existing !== undefined && existing !== rolePath) {
			this.logger.warn(`Action ID "${actionId}" was registered to "${existing}" — reassigning to "${rolePath}".`)
			const previousEntry = this._objectRegistry.get(existing)
			if (previousEntry) {
				previousEntry.actionIds.delete(actionId)
				if (!this._hasAnyIds(previousEntry)) this._disposeProperties(previousEntry)
			}
		}

		entry.actionIds.add(actionId)
		this._actionIndex.set(actionId, rolePath)

		if (isFirst) await this._syncProperties(entry)
	}

	/**
	 * Remove an action ID, looking up its registered path via the reverse index.
	 * Returns `true` if the ID was present and removed, `false` otherwise.
	 * If this was the last ID on the entry, property subscriptions are disposed.
	 */
	public removeActionId(actionId: string): boolean {
		const rolePath = this._actionIndex.get(actionId)
		if (rolePath === undefined) return false
		this._actionIndex.delete(actionId)
		const entry = this._objectRegistry.get(rolePath)
		if (!entry) {
			this.logger.warn(
				`removeActionId: reverse index pointed to "${rolePath}" for action ID "${actionId}" but no registry entry exists. This is an internal inconsistency.`,
			)
			return false
		}
		entry.actionIds.delete(actionId)
		if (!this._hasAnyIds(entry)) this._disposeProperties(entry)
		return true
	}

	/**
	 * Remove all action IDs from a role path, cleaning up the reverse index.
	 * If no feedback IDs remain either, property subscriptions are disposed.
	 */
	public clearActionIds(rolePath: string): void {
		const entry = this._objectRegistry.get(rolePath)
		if (!entry) return
		for (const id of entry.actionIds) this._actionIndex.delete(id)
		entry.actionIds.clear()
		if (!this._hasAnyIds(entry)) this._disposeProperties(entry)
	}

	/**
	 * Resolve an action ID back to its role path in O(1).
	 * Returns `undefined` if the ID is not registered.
	 */
	public resolveActionId(actionId: string): string | undefined {
		return this._actionIndex.get(actionId)
	}

	/**
	 * Return the OCA object associated with an action ID, or `undefined`.
	 * Convenience shorthand for `getObject(resolveActionId(id)!)`.
	 */
	public getObjectByActionId(actionId: string): ObjectBase | undefined {
		const path = this._actionIndex.get(actionId)
		return path !== undefined ? this.getObject(path) : undefined
	}

	/**
	 * True if an action ID is currently registered (to any path).
	 */
	public hasActionId(actionId: string): boolean {
		return this._actionIndex.has(actionId)
	}

	// -------------------------------------------------------------------------
	// Public API — feedback IDs
	// -------------------------------------------------------------------------

	/**
	 * Associate a feedback ID with a role path.
	 *
	 * A feedback ID is any opaque string your application uses to map
	 * incoming notifications back to an OCA object — e.g. a subscription
	 * handle, a WebSocket correlation ID, or a polling timer key.
	 *
	 * Throws if the role path is not in the current map.
	 * If the feedback ID is already registered to a different path, a warning is
	 * logged, the previous assignment is cleaned up, and the ID is moved to the
	 * new path. If the previous path loses its last ID as a result, its
	 * property subscriptions are disposed.
	 *
	 * If this is the first ID registered to the target path, `GetPropertySync`
	 * is called and awaited so that property values are fetched and subscribed.
	 *
	 * @param rolePath   - Role path as returned by `get_role_map`.
	 * @param feedbackId - Opaque identifier string.
	 */
	public async addFeedbackId(rolePath: string, feedbackId: string): Promise<void> {
		const entry = this._requireEntry(rolePath)
		const isFirst = !this._hasAnyIds(entry)

		const existing = this._feedbackIndex.get(feedbackId)
		if (existing !== undefined && existing !== rolePath) {
			this.logger.warn(`Feedback ID "${feedbackId}" was registered to "${existing}" — reassigning to "${rolePath}".`)
			const previousEntry = this._objectRegistry.get(existing)
			if (previousEntry) {
				previousEntry.feedbackIds.delete(feedbackId)
				if (!this._hasAnyIds(previousEntry)) this._disposeProperties(previousEntry)
			}
		}

		entry.feedbackIds.add(feedbackId)
		this._feedbackIndex.set(feedbackId, rolePath)

		if (isFirst) await this._syncProperties(entry)
	}

	/**
	 * Remove a feedback ID, looking up its registered path via the reverse index.
	 * Returns `true` if the ID was present and removed, `false` otherwise.
	 * If this was the last ID on the entry, property subscriptions are disposed.
	 */
	public removeFeedbackId(feedbackId: string): boolean {
		const rolePath = this._feedbackIndex.get(feedbackId)
		if (rolePath === undefined) return false
		this._feedbackIndex.delete(feedbackId)
		const entry = this._objectRegistry.get(rolePath)
		if (!entry) {
			this.logger.warn(
				`removeFeedbackId: reverse index pointed to "${rolePath}" for feedback ID "${feedbackId}" but no registry entry exists. This is an internal inconsistency.`,
			)
			return false
		}
		entry.feedbackIds.delete(feedbackId)
		if (!this._hasAnyIds(entry)) this._disposeProperties(entry)
		return true
	}

	/**
	 * Remove all feedback IDs from a role path, cleaning up the reverse index.
	 * If no action IDs remain either, property subscriptions are disposed.
	 */
	public clearFeedbackIds(rolePath: string): void {
		const entry = this._objectRegistry.get(rolePath)
		if (!entry) return
		for (const id of entry.feedbackIds) this._feedbackIndex.delete(id)
		entry.feedbackIds.clear()
		if (!this._hasAnyIds(entry)) this._disposeProperties(entry)
	}

	/**
	 * Resolve a feedback ID back to its role path in O(1).
	 * Returns `undefined` if the ID is not registered.
	 */
	public resolveFeedbackId(feedbackId: string): string | undefined {
		return this._feedbackIndex.get(feedbackId)
	}

	/**
	 * Return the OCA object associated with a feedback ID, or `undefined`.
	 */
	public getObjectByFeedbackId(feedbackId: string): ObjectBase | undefined {
		const path = this._feedbackIndex.get(feedbackId)
		return path !== undefined ? this.getObject(path) : undefined
	}

	/**
	 * True if a feedback ID is currently registered (to any path).
	 */
	public hasFeedbackId(feedbackId: string): boolean {
		return this._feedbackIndex.has(feedbackId)
	}

	// -------------------------------------------------------------------------
	// Convenience — clear all IDs for a path
	// -------------------------------------------------------------------------

	/**
	 * Clear both action IDs and feedback IDs for a role path, disposing
	 * property subscriptions if both sets become empty.
	 */
	public clearAllIds(rolePath: string): void {
		const entry = this._objectRegistry.get(rolePath)
		if (!entry) return
		for (const id of entry.actionIds) this._actionIndex.delete(id)
		entry.actionIds.clear()
		for (const id of entry.feedbackIds) this._feedbackIndex.delete(id)
		entry.feedbackIds.clear()
		this._disposeProperties(entry)
	}

	// -------------------------------------------------------------------------
	// Internal helpers
	// -------------------------------------------------------------------------

	/** True when the entry has at least one action ID or feedback ID. */
	private _hasAnyIds(entry: ObjectEntry): boolean {
		return entry.actionIds.size > 0 || entry.feedbackIds.size > 0
	}

	/**
	 * Call GetPropertySync on the entry's object, await sync(), and store the
	 * result so property values are live and subscribed.
	 * Safe to call even if properties are already synced (no-op in that case).
	 */
	private async _syncProperties(entry: ObjectEntry): Promise<void> {
		if (entry.properties !== undefined) return
		try {
			const properties = entry.obj.GetPropertySync()
			await properties.sync()
			entry.properties = properties
		} catch (err) {
			this.logger.warn(`Failed to sync properties for "${entry.className}" (ONo ${entry.obj.ObjectNumber}): ${err}`)
		}
	}

	/**
	 * Dispose the entry's property subscriptions and clear the reference.
	 * Safe to call when properties are already undefined (no-op).
	 */
	private _disposeProperties(entry: ObjectEntry): void {
		if (entry.properties === undefined) return
		entry.properties.Dispose()
		entry.properties = undefined
	}

	private _requireEntry(rolePath: string): ObjectEntry {
		const entry = this._objectRegistry.get(rolePath)
		if (!entry) {
			throw new Error(`Role path "${rolePath}" is not registered. ` + `Call loadRoleMap() before adding IDs.`)
		}
		return entry
	}

	// -------------------------------------------------------------------------
	// Static type-guard methods
	// -------------------------------------------------------------------------

	static isObjectBase(obj: unknown): obj is ObjectBase {
		return obj instanceof ObjectBase && obj.ClassName === OCA_CLASS_NAMES.ObjectBase
	}
	static isOcaRoot(obj: unknown): obj is OcaRoot {
		return obj instanceof OcaRoot && obj.ClassName === OCA_CLASS_NAMES.OcaRoot
	}
	static isOcaWorker(obj: unknown): obj is OcaWorker {
		return obj instanceof OcaWorker && obj.ClassName === OCA_CLASS_NAMES.OcaWorker
	}
	static isOcaActuator(obj: unknown): obj is OcaActuator {
		return obj instanceof OcaActuator && obj.ClassName === OCA_CLASS_NAMES.OcaActuator
	}
	static isOcaMute(obj: unknown): obj is OcaMute {
		return obj instanceof OcaMute && obj.ClassName === OCA_CLASS_NAMES.OcaMute
	}
	static isOcaPolarity(obj: unknown): obj is OcaPolarity {
		return obj instanceof OcaPolarity && obj.ClassName === OCA_CLASS_NAMES.OcaPolarity
	}
	static isOcaSwitch(obj: unknown): obj is OcaSwitch {
		return obj instanceof OcaSwitch && obj.ClassName === OCA_CLASS_NAMES.OcaSwitch
	}
	static isOcaGain(obj: unknown): obj is OcaGain {
		return obj instanceof OcaGain && obj.ClassName === OCA_CLASS_NAMES.OcaGain
	}
	static isOcaPanBalance(obj: unknown): obj is OcaPanBalance {
		return obj instanceof OcaPanBalance && obj.ClassName === OCA_CLASS_NAMES.OcaPanBalance
	}
	static isOcaDelay(obj: unknown): obj is OcaDelay {
		return obj instanceof OcaDelay && obj.ClassName === OCA_CLASS_NAMES.OcaDelay
	}
	static isOcaDelayExtended(obj: unknown): obj is OcaDelayExtended {
		return obj instanceof OcaDelayExtended && obj.ClassName === OCA_CLASS_NAMES.OcaDelayExtended
	}
	static isOcaFrequencyActuator(obj: unknown): obj is OcaFrequencyActuator {
		return obj instanceof OcaFrequencyActuator && obj.ClassName === OCA_CLASS_NAMES.OcaFrequencyActuator
	}
	static isOcaFilterClassical(obj: unknown): obj is OcaFilterClassical {
		return obj instanceof OcaFilterClassical && obj.ClassName === OCA_CLASS_NAMES.OcaFilterClassical
	}
	static isOcaFilterParametric(obj: unknown): obj is OcaFilterParametric {
		return obj instanceof OcaFilterParametric && obj.ClassName === OCA_CLASS_NAMES.OcaFilterParametric
	}
	static isOcaFilterPolynomial(obj: unknown): obj is OcaFilterPolynomial {
		return obj instanceof OcaFilterPolynomial && obj.ClassName === OCA_CLASS_NAMES.OcaFilterPolynomial
	}
	static isOcaFilterFIR(obj: unknown): obj is OcaFilterFIR {
		return obj instanceof OcaFilterFIR && obj.ClassName === OCA_CLASS_NAMES.OcaFilterFIR
	}
	static isOcaFilterArbitraryCurve(obj: unknown): obj is OcaFilterArbitraryCurve {
		return obj instanceof OcaFilterArbitraryCurve && obj.ClassName === OCA_CLASS_NAMES.OcaFilterArbitraryCurve
	}
	static isOcaDynamics(obj: unknown): obj is OcaDynamics {
		return obj instanceof OcaDynamics && obj.ClassName === OCA_CLASS_NAMES.OcaDynamics
	}
	static isOcaDynamicsDetector(obj: unknown): obj is OcaDynamicsDetector {
		return obj instanceof OcaDynamicsDetector && obj.ClassName === OCA_CLASS_NAMES.OcaDynamicsDetector
	}
	static isOcaDynamicsCurve(obj: unknown): obj is OcaDynamicsCurve {
		return obj instanceof OcaDynamicsCurve && obj.ClassName === OCA_CLASS_NAMES.OcaDynamicsCurve
	}
	static isOcaSignalGenerator(obj: unknown): obj is OcaSignalGenerator {
		return obj instanceof OcaSignalGenerator && obj.ClassName === OCA_CLASS_NAMES.OcaSignalGenerator
	}
	static isOcaSignalInput(obj: unknown): obj is OcaSignalInput {
		return obj instanceof OcaSignalInput && obj.ClassName === OCA_CLASS_NAMES.OcaSignalInput
	}
	static isOcaSignalOutput(obj: unknown): obj is OcaSignalOutput {
		return obj instanceof OcaSignalOutput && obj.ClassName === OCA_CLASS_NAMES.OcaSignalOutput
	}
	static isOcaTemperatureActuator(obj: unknown): obj is OcaTemperatureActuator {
		return obj instanceof OcaTemperatureActuator && obj.ClassName === OCA_CLASS_NAMES.OcaTemperatureActuator
	}
	static isOcaIdentificationActuator(obj: unknown): obj is OcaIdentificationActuator {
		return obj instanceof OcaIdentificationActuator && obj.ClassName === OCA_CLASS_NAMES.OcaIdentificationActuator
	}
	static isOcaSummingPoint(obj: unknown): obj is OcaSummingPoint {
		return obj instanceof OcaSummingPoint && obj.ClassName === OCA_CLASS_NAMES.OcaSummingPoint
	}
	static isOcaBasicActuator(obj: unknown): obj is OcaBasicActuator {
		return obj instanceof OcaBasicActuator && obj.ClassName === OCA_CLASS_NAMES.OcaBasicActuator
	}
	static isOcaBooleanActuator(obj: unknown): obj is OcaBooleanActuator {
		return obj instanceof OcaBooleanActuator && obj.ClassName === OCA_CLASS_NAMES.OcaBooleanActuator
	}
	static isOcaInt8Actuator(obj: unknown): obj is OcaInt8Actuator {
		return obj instanceof OcaInt8Actuator && obj.ClassName === OCA_CLASS_NAMES.OcaInt8Actuator
	}
	static isOcaInt16Actuator(obj: unknown): obj is OcaInt16Actuator {
		return obj instanceof OcaInt16Actuator && obj.ClassName === OCA_CLASS_NAMES.OcaInt16Actuator
	}
	static isOcaInt32Actuator(obj: unknown): obj is OcaInt32Actuator {
		return obj instanceof OcaInt32Actuator && obj.ClassName === OCA_CLASS_NAMES.OcaInt32Actuator
	}
	static isOcaInt64Actuator(obj: unknown): obj is OcaInt64Actuator {
		return obj instanceof OcaInt64Actuator && obj.ClassName === OCA_CLASS_NAMES.OcaInt64Actuator
	}
	static isOcaUint8Actuator(obj: unknown): obj is OcaUint8Actuator {
		return obj instanceof OcaUint8Actuator && obj.ClassName === OCA_CLASS_NAMES.OcaUint8Actuator
	}
	static isOcaUint16Actuator(obj: unknown): obj is OcaUint16Actuator {
		return obj instanceof OcaUint16Actuator && obj.ClassName === OCA_CLASS_NAMES.OcaUint16Actuator
	}
	static isOcaUint32Actuator(obj: unknown): obj is OcaUint32Actuator {
		return obj instanceof OcaUint32Actuator && obj.ClassName === OCA_CLASS_NAMES.OcaUint32Actuator
	}
	static isOcaUint64Actuator(obj: unknown): obj is OcaUint64Actuator {
		return obj instanceof OcaUint64Actuator && obj.ClassName === OCA_CLASS_NAMES.OcaUint64Actuator
	}
	static isOcaFloat32Actuator(obj: unknown): obj is OcaFloat32Actuator {
		return obj instanceof OcaFloat32Actuator && obj.ClassName === OCA_CLASS_NAMES.OcaFloat32Actuator
	}
	static isOcaFloat64Actuator(obj: unknown): obj is OcaFloat64Actuator {
		return obj instanceof OcaFloat64Actuator && obj.ClassName === OCA_CLASS_NAMES.OcaFloat64Actuator
	}
	static isOcaStringActuator(obj: unknown): obj is OcaStringActuator {
		return obj instanceof OcaStringActuator && obj.ClassName === OCA_CLASS_NAMES.OcaStringActuator
	}
	static isOcaBitstringActuator(obj: unknown): obj is OcaBitstringActuator {
		return obj instanceof OcaBitstringActuator && obj.ClassName === OCA_CLASS_NAMES.OcaBitstringActuator
	}
	static isOcaSensor(obj: unknown): obj is OcaSensor {
		return obj instanceof OcaSensor && obj.ClassName === OCA_CLASS_NAMES.OcaSensor
	}
	static isOcaLevelSensor(obj: unknown): obj is OcaLevelSensor {
		return obj instanceof OcaLevelSensor && obj.ClassName === OCA_CLASS_NAMES.OcaLevelSensor
	}
	static isOcaAudioLevelSensor(obj: unknown): obj is OcaAudioLevelSensor {
		return obj instanceof OcaAudioLevelSensor && obj.ClassName === OCA_CLASS_NAMES.OcaAudioLevelSensor
	}
	static isOcaTimeIntervalSensor(obj: unknown): obj is OcaTimeIntervalSensor {
		return obj instanceof OcaTimeIntervalSensor && obj.ClassName === OCA_CLASS_NAMES.OcaTimeIntervalSensor
	}
	static isOcaFrequencySensor(obj: unknown): obj is OcaFrequencySensor {
		return obj instanceof OcaFrequencySensor && obj.ClassName === OCA_CLASS_NAMES.OcaFrequencySensor
	}
	static isOcaTemperatureSensor(obj: unknown): obj is OcaTemperatureSensor {
		return obj instanceof OcaTemperatureSensor && obj.ClassName === OCA_CLASS_NAMES.OcaTemperatureSensor
	}
	static isOcaIdentificationSensor(obj: unknown): obj is OcaIdentificationSensor {
		return obj instanceof OcaIdentificationSensor && obj.ClassName === OCA_CLASS_NAMES.OcaIdentificationSensor
	}
	static isOcaVoltageSensor(obj: unknown): obj is OcaVoltageSensor {
		return obj instanceof OcaVoltageSensor && obj.ClassName === OCA_CLASS_NAMES.OcaVoltageSensor
	}
	static isOcaCurrentSensor(obj: unknown): obj is OcaCurrentSensor {
		return obj instanceof OcaCurrentSensor && obj.ClassName === OCA_CLASS_NAMES.OcaCurrentSensor
	}
	static isOcaImpedanceSensor(obj: unknown): obj is OcaImpedanceSensor {
		return obj instanceof OcaImpedanceSensor && obj.ClassName === OCA_CLASS_NAMES.OcaImpedanceSensor
	}
	static isOcaGainSensor(obj: unknown): obj is OcaGainSensor {
		return obj instanceof OcaGainSensor && obj.ClassName === OCA_CLASS_NAMES.OcaGainSensor
	}
	static isOcaBasicSensor(obj: unknown): obj is OcaBasicSensor {
		return obj instanceof OcaBasicSensor && obj.ClassName === OCA_CLASS_NAMES.OcaBasicSensor
	}
	static isOcaBooleanSensor(obj: unknown): obj is OcaBooleanSensor {
		return obj instanceof OcaBooleanSensor && obj.ClassName === OCA_CLASS_NAMES.OcaBooleanSensor
	}
	static isOcaInt8Sensor(obj: unknown): obj is OcaInt8Sensor {
		return obj instanceof OcaInt8Sensor && obj.ClassName === OCA_CLASS_NAMES.OcaInt8Sensor
	}
	static isOcaInt16Sensor(obj: unknown): obj is OcaInt16Sensor {
		return obj instanceof OcaInt16Sensor && obj.ClassName === OCA_CLASS_NAMES.OcaInt16Sensor
	}
	static isOcaInt32Sensor(obj: unknown): obj is OcaInt32Sensor {
		return obj instanceof OcaInt32Sensor && obj.ClassName === OCA_CLASS_NAMES.OcaInt32Sensor
	}
	static isOcaInt64Sensor(obj: unknown): obj is OcaInt64Sensor {
		return obj instanceof OcaInt64Sensor && obj.ClassName === OCA_CLASS_NAMES.OcaInt64Sensor
	}
	static isOcaUint8Sensor(obj: unknown): obj is OcaUint8Sensor {
		return obj instanceof OcaUint8Sensor && obj.ClassName === OCA_CLASS_NAMES.OcaUint8Sensor
	}
	static isOcaUint16Sensor(obj: unknown): obj is OcaUint16Sensor {
		return obj instanceof OcaUint16Sensor && obj.ClassName === OCA_CLASS_NAMES.OcaUint16Sensor
	}
	static isOcaUint32Sensor(obj: unknown): obj is OcaUint32Sensor {
		return obj instanceof OcaUint32Sensor && obj.ClassName === OCA_CLASS_NAMES.OcaUint32Sensor
	}
	static isOcaUint64Sensor(obj: unknown): obj is OcaUint64Sensor {
		return obj instanceof OcaUint64Sensor && obj.ClassName === OCA_CLASS_NAMES.OcaUint64Sensor
	}
	static isOcaFloat32Sensor(obj: unknown): obj is OcaFloat32Sensor {
		return obj instanceof OcaFloat32Sensor && obj.ClassName === OCA_CLASS_NAMES.OcaFloat32Sensor
	}
	static isOcaFloat64Sensor(obj: unknown): obj is OcaFloat64Sensor {
		return obj instanceof OcaFloat64Sensor && obj.ClassName === OCA_CLASS_NAMES.OcaFloat64Sensor
	}
	static isOcaStringSensor(obj: unknown): obj is OcaStringSensor {
		return obj instanceof OcaStringSensor && obj.ClassName === OCA_CLASS_NAMES.OcaStringSensor
	}
	static isOcaBitstringSensor(obj: unknown): obj is OcaBitstringSensor {
		return obj instanceof OcaBitstringSensor && obj.ClassName === OCA_CLASS_NAMES.OcaBitstringSensor
	}
	static isOcaBlock(obj: unknown): obj is OcaBlock {
		return obj instanceof OcaBlock && obj.ClassName === OCA_CLASS_NAMES.OcaBlock
	}
	static isOcaBlockFactory(obj: unknown): obj is OcaBlockFactoryAgent {
		return obj instanceof OcaBlockFactoryAgent && obj.ClassName === OCA_CLASS_NAMES.OcaBlockFactory
	}
	static isOcaMatrix(obj: unknown): obj is OcaMatrix {
		return obj instanceof OcaMatrix && obj.ClassName === OCA_CLASS_NAMES.OcaMatrix
	}
	static isOcaAgent(obj: unknown): obj is OcaAgent {
		return obj instanceof OcaAgent && obj.ClassName === OCA_CLASS_NAMES.OcaAgent
	}
	static isOcaGrouper(obj: unknown): obj is OcaGrouper {
		return obj instanceof OcaGrouper && obj.ClassName === OCA_CLASS_NAMES.OcaGrouper
	}
	static isOcaRamper(obj: unknown): obj is OcaRamper {
		return obj instanceof OcaRamper && obj.ClassName === OCA_CLASS_NAMES.OcaRamper
	}
	static isOcaNumericObserver(obj: unknown): obj is OcaNumericObserver {
		return obj instanceof OcaNumericObserver && obj.ClassName === OCA_CLASS_NAMES.OcaNumericObserver
	}
	static isOcaNumericObserverList(obj: unknown): obj is OcaNumericObserverList {
		return obj instanceof OcaNumericObserverList && obj.ClassName === OCA_CLASS_NAMES.OcaNumericObserverList
	}
	static isOcaPowerSupply(obj: unknown): obj is OcaPowerSupply {
		return obj instanceof OcaPowerSupply && obj.ClassName === OCA_CLASS_NAMES.OcaPowerSupply
	}
	static isOcaMediaClock3(obj: unknown): obj is OcaMediaClock3 {
		return obj instanceof OcaMediaClock3 && obj.ClassName === OCA_CLASS_NAMES.OcaMediaClock3
	}
	static isOcaTimeSource(obj: unknown): obj is OcaTimeSource {
		return obj instanceof OcaTimeSource && obj.ClassName === OCA_CLASS_NAMES.OcaTimeSource
	}
	static isOcaPhysicalPosition(obj: unknown): obj is OcaPhysicalPosition {
		return obj instanceof OcaPhysicalPosition && obj.ClassName === OCA_CLASS_NAMES.OcaPhysicalPosition
	}
	static isOcaApplicationNetwork(obj: unknown): obj is OcaApplicationNetwork {
		return obj instanceof OcaApplicationNetwork && obj.ClassName === OCA_CLASS_NAMES.OcaApplicationNetwork
	}
	static isOcaControlNetwork(obj: unknown): obj is OcaControlNetwork {
		return obj instanceof OcaControlNetwork && obj.ClassName === OCA_CLASS_NAMES.OcaControlNetwork
	}
	static isOcaMediaTransportNetwork(obj: unknown): obj is OcaMediaTransportNetwork {
		return obj instanceof OcaMediaTransportNetwork && obj.ClassName === OCA_CLASS_NAMES.OcaMediaTransportNetwork
	}
	static isOcaManager(obj: unknown): obj is OcaManager {
		return obj instanceof OcaManager && obj.ClassName === OCA_CLASS_NAMES.OcaManager
	}
	static isOcaDeviceManager(obj: unknown): obj is OcaDeviceManager {
		return obj instanceof OcaDeviceManager && obj.ClassName === OCA_CLASS_NAMES.OcaDeviceManager
	}
	static isOcaSecurityManager(obj: unknown): obj is OcaSecurityManager {
		return obj instanceof OcaSecurityManager && obj.ClassName === OCA_CLASS_NAMES.OcaSecurityManager
	}
	static isOcaFirmwareManager(obj: unknown): obj is OcaFirmwareManager {
		return obj instanceof OcaFirmwareManager && obj.ClassName === OCA_CLASS_NAMES.OcaFirmwareManager
	}
	static isOcaSubscriptionManager(obj: unknown): obj is OcaSubscriptionManager {
		return obj instanceof OcaSubscriptionManager && obj.ClassName === OCA_CLASS_NAMES.OcaSubscriptionManager
	}
	static isOcaPowerManager(obj: unknown): obj is OcaPowerManager {
		return obj instanceof OcaPowerManager && obj.ClassName === OCA_CLASS_NAMES.OcaPowerManager
	}
	static isOcaNetworkManager(obj: unknown): obj is OcaNetworkManager {
		return obj instanceof OcaNetworkManager && obj.ClassName === OCA_CLASS_NAMES.OcaNetworkManager
	}
	static isOcaMediaClockManager(obj: unknown): obj is OcaMediaClockManager {
		return obj instanceof OcaMediaClockManager && obj.ClassName === OCA_CLASS_NAMES.OcaMediaClockManager
	}
	static isOcaLibraryManager(obj: unknown): obj is OcaLibraryManager {
		return obj instanceof OcaLibraryManager && obj.ClassName === OCA_CLASS_NAMES.OcaLibraryManager
	}
	static isOcaAudioProcessingManager(obj: unknown): obj is OcaAudioProcessingManager {
		return obj instanceof OcaAudioProcessingManager && obj.ClassName === OCA_CLASS_NAMES.OcaAudioProcessingManager
	}
	static isOcaDeviceTimeManager(obj: unknown): obj is OcaDeviceTimeManager {
		return obj instanceof OcaDeviceTimeManager && obj.ClassName === OCA_CLASS_NAMES.OcaDeviceTimeManager
	}
	static isOcaTaskManager(obj: unknown): obj is OcaTaskManager {
		return obj instanceof OcaTaskManager && obj.ClassName === OCA_CLASS_NAMES.OcaTaskManager
	}
	static isOcaCodingManager(obj: unknown): obj is OcaCodingManager {
		return obj instanceof OcaCodingManager && obj.ClassName === OCA_CLASS_NAMES.OcaCodingManager
	}
	static isOcaDiagnosticManager(obj: unknown): obj is OcaDiagnosticManager {
		return obj instanceof OcaDiagnosticManager && obj.ClassName === OCA_CLASS_NAMES.OcaDiagnosticManager
	}
	static isOcaNetworkSignalChannel(obj: unknown): obj is OcaNetworkSignalChannel {
		return obj instanceof OcaNetworkSignalChannel && obj.ClassName === OCA_CLASS_NAMES.OcaNetworkSignalChannel
	}
	static isOcaNetwork(obj: unknown): obj is OcaNetwork {
		return obj instanceof OcaNetwork && obj.ClassName === OCA_CLASS_NAMES.OcaNetwork
	}
	static isOcaMediaClock(obj: unknown): obj is OcaMediaClock {
		return obj instanceof OcaMediaClock && obj.ClassName === OCA_CLASS_NAMES.OcaMediaClock
	}
	static isOcaStreamNetwork(obj: unknown): obj is OcaStreamNetwork {
		return obj instanceof OcaStreamNetwork && obj.ClassName === OCA_CLASS_NAMES.OcaStreamNetwork
	}
	static isOcaStreamConnector(obj: unknown): obj is OcaStreamConnector {
		return obj instanceof OcaStreamConnector && obj.ClassName === OCA_CLASS_NAMES.OcaStreamConnector
	}

	// -------------------------------------------------------------------------
	// Static type-guard method — class name validation
	// -------------------------------------------------------------------------
	static isValidClassName(name: string): name is OcaClassName {
		const names = Object.values(OCA_CLASS_NAMES) as string[]
		return names.includes(name)
	}
}

// ---------------------------------------------------------------------------
// Internal event map (lifecycle / error events on OcaHelper itself)
// ---------------------------------------------------------------------------

interface OcaHelperInternalEvents {
	/** Fired after loadRoleMap() completes successfully. */
	'map:loaded': [roleMap: Map<string, ObjectBase>]
	/**
	 * Fired when loadRoleMap() is called again and some previously-registered
	 * action/feedback IDs belonged to role paths that no longer exist in the
	 * new map.  Those IDs have been dropped.
	 */
	'ids:orphaned': [rolePaths: string[]]
}
