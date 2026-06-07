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
import type { PropertySync, OcaRootProperties } from '../types/aes70.js'
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
	readonly className: string
	/** Action IDs associated with this object (e.g. OSC/MIDI command IDs). */
	readonly actionIds: Set<string>
	/** Feedback IDs associated with this object (e.g. subscription keys). */
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
 * helper.on('OcaGain', (obj) => {
 *   obj.GetGain().then(([gain]) => console.log('Gain:', gain))
 * })
 * ```
 *
 * ### Querying by class
 * ```ts
 * const gainPaths = helper.getByClass('OcaGain')  // Set<string>
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
	private _classIndex: Map<string, Set<string>> = new Map()

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
	private _resolveClassName(obj: ObjectBase): string {
		if (!(obj instanceof OcaRoot)) return 'ObjectBase'

		if (obj instanceof OcaWorker) {
			if (obj instanceof OcaActuator) return this._resolveActuatorName(obj)
			if (obj instanceof OcaSensor) return this._resolveSensorName(obj)
			if (obj instanceof OcaBlock) return 'OcaBlock'
			if (obj instanceof OcaBlockFactoryAgent) return 'OcaBlockFactory'
			if (obj instanceof OcaMatrix) return 'OcaMatrix'
			return 'OcaWorker'
		}
		if (obj instanceof OcaAgent) return this._resolveAgentName(obj)
		if (obj instanceof OcaManager) return this._resolveManagerName(obj)
		if (obj instanceof OcaMediaTransportNetwork) return 'OcaMediaTransportNetwork'
		if (obj instanceof OcaControlNetwork) return 'OcaControlNetwork'
		if (obj instanceof OcaApplicationNetwork) return 'OcaApplicationNetwork'
		if (obj instanceof OcaNetworkSignalChannel) return 'OcaNetworkSignalChannel'
		if (obj instanceof OcaStreamConnector) return 'OcaStreamConnector'
		if (obj instanceof OcaStreamNetwork) return 'OcaStreamNetwork'
		if (obj instanceof OcaNetwork) return 'OcaNetwork'
		if (obj instanceof OcaMediaClock) return 'OcaMediaClock'
		return 'OcaRoot'
	}

	private _resolveActuatorName(obj: OcaActuator): string {
		if (obj instanceof OcaMute) return 'OcaMute'
		if (obj instanceof OcaPolarity) return 'OcaPolarity'
		if (obj instanceof OcaSwitch) return 'OcaSwitch'
		if (obj instanceof OcaGain) return 'OcaGain'
		if (obj instanceof OcaPanBalance) return 'OcaPanBalance'
		if (obj instanceof OcaDelayExtended) return 'OcaDelayExtended'
		if (obj instanceof OcaDelay) return 'OcaDelay'
		if (obj instanceof OcaFrequencyActuator) return 'OcaFrequencyActuator'
		if (obj instanceof OcaFilterClassical) return 'OcaFilterClassical'
		if (obj instanceof OcaFilterParametric) return 'OcaFilterParametric'
		if (obj instanceof OcaFilterPolynomial) return 'OcaFilterPolynomial'
		if (obj instanceof OcaFilterFIR) return 'OcaFilterFIR'
		if (obj instanceof OcaFilterArbitraryCurve) return 'OcaFilterArbitraryCurve'
		if (obj instanceof OcaDynamics) return 'OcaDynamics'
		if (obj instanceof OcaDynamicsDetector) return 'OcaDynamicsDetector'
		if (obj instanceof OcaDynamicsCurve) return 'OcaDynamicsCurve'
		if (obj instanceof OcaSignalGenerator) return 'OcaSignalGenerator'
		if (obj instanceof OcaSignalInput) return 'OcaSignalInput'
		if (obj instanceof OcaSignalOutput) return 'OcaSignalOutput'
		if (obj instanceof OcaTemperatureActuator) return 'OcaTemperatureActuator'
		if (obj instanceof OcaIdentificationActuator) return 'OcaIdentificationActuator'
		if (obj instanceof OcaSummingPoint) return 'OcaSummingPoint'
		if (obj instanceof OcaBasicActuator) {
			if (obj instanceof OcaBooleanActuator) return 'OcaBooleanActuator'
			if (obj instanceof OcaInt8Actuator) return 'OcaInt8Actuator'
			if (obj instanceof OcaInt16Actuator) return 'OcaInt16Actuator'
			if (obj instanceof OcaInt32Actuator) return 'OcaInt32Actuator'
			if (obj instanceof OcaInt64Actuator) return 'OcaInt64Actuator'
			if (obj instanceof OcaUint8Actuator) return 'OcaUint8Actuator'
			if (obj instanceof OcaUint16Actuator) return 'OcaUint16Actuator'
			if (obj instanceof OcaUint32Actuator) return 'OcaUint32Actuator'
			if (obj instanceof OcaUint64Actuator) return 'OcaUint64Actuator'
			if (obj instanceof OcaFloat32Actuator) return 'OcaFloat32Actuator'
			if (obj instanceof OcaFloat64Actuator) return 'OcaFloat64Actuator'
			if (obj instanceof OcaStringActuator) return 'OcaStringActuator'
			if (obj instanceof OcaBitstringActuator) return 'OcaBitstringActuator'
			return 'OcaBasicActuator'
		}
		return 'OcaActuator'
	}

	private _resolveSensorName(obj: OcaSensor): string {
		if (obj instanceof OcaLevelSensor) {
			if (obj instanceof OcaAudioLevelSensor) return 'OcaAudioLevelSensor'
			return 'OcaLevelSensor'
		}
		if (obj instanceof OcaTimeIntervalSensor) return 'OcaTimeIntervalSensor'
		if (obj instanceof OcaFrequencySensor) return 'OcaFrequencySensor'
		if (obj instanceof OcaTemperatureSensor) return 'OcaTemperatureSensor'
		if (obj instanceof OcaIdentificationSensor) return 'OcaIdentificationSensor'
		if (obj instanceof OcaVoltageSensor) return 'OcaVoltageSensor'
		if (obj instanceof OcaCurrentSensor) return 'OcaCurrentSensor'
		if (obj instanceof OcaImpedanceSensor) return 'OcaImpedanceSensor'
		if (obj instanceof OcaGainSensor) return 'OcaGainSensor'
		if (obj instanceof OcaBasicSensor) {
			if (obj instanceof OcaBooleanSensor) return 'OcaBooleanSensor'
			if (obj instanceof OcaInt8Sensor) return 'OcaInt8Sensor'
			if (obj instanceof OcaInt16Sensor) return 'OcaInt16Sensor'
			if (obj instanceof OcaInt32Sensor) return 'OcaInt32Sensor'
			if (obj instanceof OcaInt64Sensor) return 'OcaInt64Sensor'
			if (obj instanceof OcaUint8Sensor) return 'OcaUint8Sensor'
			if (obj instanceof OcaUint16Sensor) return 'OcaUint16Sensor'
			if (obj instanceof OcaUint32Sensor) return 'OcaUint32Sensor'
			if (obj instanceof OcaUint64Sensor) return 'OcaUint64Sensor'
			if (obj instanceof OcaFloat32Sensor) return 'OcaFloat32Sensor'
			if (obj instanceof OcaFloat64Sensor) return 'OcaFloat64Sensor'
			if (obj instanceof OcaStringSensor) return 'OcaStringSensor'
			if (obj instanceof OcaBitstringSensor) return 'OcaBitstringSensor'
			return 'OcaBasicSensor'
		}
		return 'OcaSensor'
	}

	private _resolveAgentName(obj: OcaAgent): string {
		if (obj instanceof OcaGrouper) return 'OcaGrouper'
		if (obj instanceof OcaNumericObserverList) return 'OcaNumericObserverList'
		if (obj instanceof OcaNumericObserver) return 'OcaNumericObserver'
		if (obj instanceof OcaRamper) return 'OcaRamper'
		if (obj instanceof OcaPowerSupply) return 'OcaPowerSupply'
		if (obj instanceof OcaMediaClock3) return 'OcaMediaClock3'
		if (obj instanceof OcaTimeSource) return 'OcaTimeSource'
		if (obj instanceof OcaPhysicalPosition) return 'OcaPhysicalPosition'
		return 'OcaAgent'
	}

	private _resolveManagerName(obj: OcaManager): string {
		if (obj instanceof OcaDeviceManager) return 'OcaDeviceManager'
		if (obj instanceof OcaSecurityManager) return 'OcaSecurityManager'
		if (obj instanceof OcaFirmwareManager) return 'OcaFirmwareManager'
		if (obj instanceof OcaSubscriptionManager) return 'OcaSubscriptionManager'
		if (obj instanceof OcaPowerManager) return 'OcaPowerManager'
		if (obj instanceof OcaNetworkManager) return 'OcaNetworkManager'
		if (obj instanceof OcaMediaClockManager) return 'OcaMediaClockManager'
		if (obj instanceof OcaLibraryManager) return 'OcaLibraryManager'
		if (obj instanceof OcaAudioProcessingManager) return 'OcaAudioProcessingManager'
		if (obj instanceof OcaDeviceTimeManager) return 'OcaDeviceTimeManager'
		if (obj instanceof OcaTaskManager) return 'OcaTaskManager'
		if (obj instanceof OcaCodingManager) return 'OcaCodingManager'
		if (obj instanceof OcaDiagnosticManager) return 'OcaDiagnosticManager'
		return 'OcaManager'
	}

	// -------------------------------------------------------------------------
	// Private emit helpers (determineClass delegates here)
	// -------------------------------------------------------------------------

	private _emitActuator(obj: OcaActuator): void {
		if (obj instanceof OcaMute) this.emit('OcaMute', obj)
		else if (obj instanceof OcaPolarity) this.emit('OcaPolarity', obj)
		else if (obj instanceof OcaSwitch) this.emit('OcaSwitch', obj)
		else if (obj instanceof OcaGain) this.emit('OcaGain', obj)
		else if (obj instanceof OcaPanBalance) this.emit('OcaPanBalance', obj)
		else if (obj instanceof OcaDelayExtended) this.emit('OcaDelayExtended', obj)
		else if (obj instanceof OcaDelay) this.emit('OcaDelay', obj)
		else if (obj instanceof OcaFrequencyActuator) this.emit('OcaFrequencyActuator', obj)
		else if (obj instanceof OcaFilterClassical) this.emit('OcaFilterClassical', obj)
		else if (obj instanceof OcaFilterParametric) this.emit('OcaFilterParametric', obj)
		else if (obj instanceof OcaFilterPolynomial) this.emit('OcaFilterPolynomial', obj)
		else if (obj instanceof OcaFilterFIR) this.emit('OcaFilterFIR', obj)
		else if (obj instanceof OcaFilterArbitraryCurve) this.emit('OcaFilterArbitraryCurve', obj)
		else if (obj instanceof OcaDynamics) this.emit('OcaDynamics', obj)
		else if (obj instanceof OcaDynamicsDetector) this.emit('OcaDynamicsDetector', obj)
		else if (obj instanceof OcaDynamicsCurve) this.emit('OcaDynamicsCurve', obj)
		else if (obj instanceof OcaSignalGenerator) this.emit('OcaSignalGenerator', obj)
		else if (obj instanceof OcaSignalInput) this.emit('OcaSignalInput', obj)
		else if (obj instanceof OcaSignalOutput) this.emit('OcaSignalOutput', obj)
		else if (obj instanceof OcaTemperatureActuator) this.emit('OcaTemperatureActuator', obj)
		else if (obj instanceof OcaIdentificationActuator) this.emit('OcaIdentificationActuator', obj)
		else if (obj instanceof OcaSummingPoint) this.emit('OcaSummingPoint', obj)
		else if (obj instanceof OcaBasicActuator) this._emitBasicActuator(obj)
		else this.emit('OcaActuator', obj)
	}

	private _emitBasicActuator(obj: OcaBasicActuator): void {
		if (obj instanceof OcaBooleanActuator) this.emit('OcaBooleanActuator', obj)
		else if (obj instanceof OcaInt8Actuator) this.emit('OcaInt8Actuator', obj)
		else if (obj instanceof OcaInt16Actuator) this.emit('OcaInt16Actuator', obj)
		else if (obj instanceof OcaInt32Actuator) this.emit('OcaInt32Actuator', obj)
		else if (obj instanceof OcaInt64Actuator) this.emit('OcaInt64Actuator', obj)
		else if (obj instanceof OcaUint8Actuator) this.emit('OcaUint8Actuator', obj)
		else if (obj instanceof OcaUint16Actuator) this.emit('OcaUint16Actuator', obj)
		else if (obj instanceof OcaUint32Actuator) this.emit('OcaUint32Actuator', obj)
		else if (obj instanceof OcaUint64Actuator) this.emit('OcaUint64Actuator', obj)
		else if (obj instanceof OcaFloat32Actuator) this.emit('OcaFloat32Actuator', obj)
		else if (obj instanceof OcaFloat64Actuator) this.emit('OcaFloat64Actuator', obj)
		else if (obj instanceof OcaStringActuator) this.emit('OcaStringActuator', obj)
		else if (obj instanceof OcaBitstringActuator) this.emit('OcaBitstringActuator', obj)
		else this.emit('OcaBasicActuator', obj)
	}

	private _emitSensor(obj: OcaSensor): void {
		if (obj instanceof OcaLevelSensor) {
			if (obj instanceof OcaAudioLevelSensor) this.emit('OcaAudioLevelSensor', obj)
			else this.emit('OcaLevelSensor', obj)
		} else if (obj instanceof OcaTimeIntervalSensor) this.emit('OcaTimeIntervalSensor', obj)
		else if (obj instanceof OcaFrequencySensor) this.emit('OcaFrequencySensor', obj)
		else if (obj instanceof OcaTemperatureSensor) this.emit('OcaTemperatureSensor', obj)
		else if (obj instanceof OcaIdentificationSensor) this.emit('OcaIdentificationSensor', obj)
		else if (obj instanceof OcaVoltageSensor) this.emit('OcaVoltageSensor', obj)
		else if (obj instanceof OcaCurrentSensor) this.emit('OcaCurrentSensor', obj)
		else if (obj instanceof OcaImpedanceSensor) this.emit('OcaImpedanceSensor', obj)
		else if (obj instanceof OcaGainSensor) this.emit('OcaGainSensor', obj)
		else if (obj instanceof OcaBasicSensor) this._emitBasicSensor(obj)
		else this.emit('OcaSensor', obj)
	}

	private _emitBasicSensor(obj: OcaBasicSensor): void {
		if (obj instanceof OcaBooleanSensor) this.emit('OcaBooleanSensor', obj)
		else if (obj instanceof OcaInt8Sensor) this.emit('OcaInt8Sensor', obj)
		else if (obj instanceof OcaInt16Sensor) this.emit('OcaInt16Sensor', obj)
		else if (obj instanceof OcaInt32Sensor) this.emit('OcaInt32Sensor', obj)
		else if (obj instanceof OcaInt64Sensor) this.emit('OcaInt64Sensor', obj)
		else if (obj instanceof OcaUint8Sensor) this.emit('OcaUint8Sensor', obj)
		else if (obj instanceof OcaUint16Sensor) this.emit('OcaUint16Sensor', obj)
		else if (obj instanceof OcaUint32Sensor) this.emit('OcaUint32Sensor', obj)
		else if (obj instanceof OcaUint64Sensor) this.emit('OcaUint64Sensor', obj)
		else if (obj instanceof OcaFloat32Sensor) this.emit('OcaFloat32Sensor', obj)
		else if (obj instanceof OcaFloat64Sensor) this.emit('OcaFloat64Sensor', obj)
		else if (obj instanceof OcaStringSensor) this.emit('OcaStringSensor', obj)
		else if (obj instanceof OcaBitstringSensor) this.emit('OcaBitstringSensor', obj)
		else this.emit('OcaBasicSensor', obj)
	}

	private _emitAgent(obj: OcaAgent): void {
		if (obj instanceof OcaGrouper) this.emit('OcaGrouper', obj)
		else if (obj instanceof OcaNumericObserverList) this.emit('OcaNumericObserverList', obj)
		else if (obj instanceof OcaNumericObserver) this.emit('OcaNumericObserver', obj)
		else if (obj instanceof OcaRamper) this.emit('OcaRamper', obj)
		else if (obj instanceof OcaPowerSupply) this.emit('OcaPowerSupply', obj)
		else if (obj instanceof OcaMediaClock3) this.emit('OcaMediaClock3', obj)
		else if (obj instanceof OcaTimeSource) this.emit('OcaTimeSource', obj)
		else if (obj instanceof OcaPhysicalPosition) this.emit('OcaPhysicalPosition', obj)
		else this.emit('OcaAgent', obj)
	}

	private _emitManager(obj: OcaManager): void {
		if (obj instanceof OcaDeviceManager) this.emit('OcaDeviceManager', obj)
		else if (obj instanceof OcaSecurityManager) this.emit('OcaSecurityManager', obj)
		else if (obj instanceof OcaFirmwareManager) this.emit('OcaFirmwareManager', obj)
		else if (obj instanceof OcaSubscriptionManager) this.emit('OcaSubscriptionManager', obj)
		else if (obj instanceof OcaPowerManager) this.emit('OcaPowerManager', obj)
		else if (obj instanceof OcaNetworkManager) this.emit('OcaNetworkManager', obj)
		else if (obj instanceof OcaMediaClockManager) this.emit('OcaMediaClockManager', obj)
		else if (obj instanceof OcaLibraryManager) this.emit('OcaLibraryManager', obj)
		else if (obj instanceof OcaAudioProcessingManager) this.emit('OcaAudioProcessingManager', obj)
		else if (obj instanceof OcaDeviceTimeManager) this.emit('OcaDeviceTimeManager', obj)
		else if (obj instanceof OcaTaskManager) this.emit('OcaTaskManager', obj)
		else if (obj instanceof OcaCodingManager) this.emit('OcaCodingManager', obj)
		else if (obj instanceof OcaDiagnosticManager) this.emit('OcaDiagnosticManager', obj)
		else this.emit('OcaManager', obj)
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
	public getByClass(className: string): ReadonlySet<string> {
		return this._classIndex.get(className) ?? new Set()
	}

	/**
	 * Return every class name that has at least one registered object,
	 * in insertion order.
	 */
	public getClassNames(): string[] {
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
	public getClassIndex(): Record<string, string[]> {
		const out: Record<string, string[]> = {}
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
	public getClassName(rolePath: string): string | undefined {
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
		return obj instanceof ObjectBase && obj.ClassName === 'ObjectBase'
	}
	static isOcaRoot(obj: unknown): obj is OcaRoot {
		return obj instanceof OcaRoot && obj.ClassName === 'OcaRoot'
	}
	static isOcaWorker(obj: unknown): obj is OcaWorker {
		return obj instanceof OcaWorker && obj.ClassName === 'OcaWorker'
	}
	static isOcaActuator(obj: unknown): obj is OcaActuator {
		return obj instanceof OcaActuator && obj.ClassName === 'OcaActuator'
	}
	static isOcaMute(obj: unknown): obj is OcaMute {
		return obj instanceof OcaMute && obj.ClassName === 'OcaMute'
	}
	static isOcaPolarity(obj: unknown): obj is OcaPolarity {
		return obj instanceof OcaPolarity && obj.ClassName === 'OcaPolarity'
	}
	static isOcaSwitch(obj: unknown): obj is OcaSwitch {
		return obj instanceof OcaSwitch && obj.ClassName === 'OcaSwitch'
	}
	static isOcaGain(obj: unknown): obj is OcaGain {
		return obj instanceof OcaGain && obj.ClassName === 'OcaGain'
	}
	static isOcaPanBalance(obj: unknown): obj is OcaPanBalance {
		return obj instanceof OcaPanBalance && obj.ClassName === 'OcaPanBalance'
	}
	static isOcaDelay(obj: unknown): obj is OcaDelay {
		return obj instanceof OcaDelay && obj.ClassName === 'OcaDelay'
	}
	static isOcaDelayExtended(obj: unknown): obj is OcaDelayExtended {
		return obj instanceof OcaDelayExtended && obj.ClassName === 'OcaDelayExtended'
	}
	static isOcaFrequencyActuator(obj: unknown): obj is OcaFrequencyActuator {
		return obj instanceof OcaFrequencyActuator && obj.ClassName === 'OcaFrequencyActuator'
	}
	static isOcaFilterClassical(obj: unknown): obj is OcaFilterClassical {
		return obj instanceof OcaFilterClassical && obj.ClassName === 'OcaFilterClassical'
	}
	static isOcaFilterParametric(obj: unknown): obj is OcaFilterParametric {
		return obj instanceof OcaFilterParametric && obj.ClassName === 'OcaFilterParametric'
	}
	static isOcaFilterPolynomial(obj: unknown): obj is OcaFilterPolynomial {
		return obj instanceof OcaFilterPolynomial && obj.ClassName === 'OcaFilterPolynomial'
	}
	static isOcaFilterFIR(obj: unknown): obj is OcaFilterFIR {
		return obj instanceof OcaFilterFIR && obj.ClassName === 'OcaFilterFIR'
	}
	static isOcaFilterArbitraryCurve(obj: unknown): obj is OcaFilterArbitraryCurve {
		return obj instanceof OcaFilterArbitraryCurve && obj.ClassName === 'OcaFilterArbitraryCurve'
	}
	static isOcaDynamics(obj: unknown): obj is OcaDynamics {
		return obj instanceof OcaDynamics && obj.ClassName === 'OcaDynamics'
	}
	static isOcaDynamicsDetector(obj: unknown): obj is OcaDynamicsDetector {
		return obj instanceof OcaDynamicsDetector && obj.ClassName === 'OcaDynamicsDetector'
	}
	static isOcaDynamicsCurve(obj: unknown): obj is OcaDynamicsCurve {
		return obj instanceof OcaDynamicsCurve && obj.ClassName === 'OcaDynamicsCurve'
	}
	static isOcaSignalGenerator(obj: unknown): obj is OcaSignalGenerator {
		return obj instanceof OcaSignalGenerator && obj.ClassName === 'OcaSignalGenerator'
	}
	static isOcaSignalInput(obj: unknown): obj is OcaSignalInput {
		return obj instanceof OcaSignalInput && obj.ClassName === 'OcaSignalInput'
	}
	static isOcaSignalOutput(obj: unknown): obj is OcaSignalOutput {
		return obj instanceof OcaSignalOutput && obj.ClassName === 'OcaSignalOutput'
	}
	static isOcaTemperatureActuator(obj: unknown): obj is OcaTemperatureActuator {
		return obj instanceof OcaTemperatureActuator && obj.ClassName === 'OcaTemperatureActuator'
	}
	static isOcaIdentificationActuator(obj: unknown): obj is OcaIdentificationActuator {
		return obj instanceof OcaIdentificationActuator && obj.ClassName === 'OcaIdentificationActuator'
	}
	static isOcaSummingPoint(obj: unknown): obj is OcaSummingPoint {
		return obj instanceof OcaSummingPoint && obj.ClassName === 'OcaSummingPoint'
	}
	static isOcaBasicActuator(obj: unknown): obj is OcaBasicActuator {
		return obj instanceof OcaBasicActuator && obj.ClassName === 'OcaBasicActuator'
	}
	static isOcaBooleanActuator(obj: unknown): obj is OcaBooleanActuator {
		return obj instanceof OcaBooleanActuator && obj.ClassName === 'OcaBooleanActuator'
	}
	static isOcaInt8Actuator(obj: unknown): obj is OcaInt8Actuator {
		return obj instanceof OcaInt8Actuator && obj.ClassName === 'OcaInt8Actuator'
	}
	static isOcaInt16Actuator(obj: unknown): obj is OcaInt16Actuator {
		return obj instanceof OcaInt16Actuator && obj.ClassName === 'OcaInt16Actuator'
	}
	static isOcaInt32Actuator(obj: unknown): obj is OcaInt32Actuator {
		return obj instanceof OcaInt32Actuator && obj.ClassName === 'OcaInt32Actuator'
	}
	static isOcaInt64Actuator(obj: unknown): obj is OcaInt64Actuator {
		return obj instanceof OcaInt64Actuator && obj.ClassName === 'OcaInt64Actuator'
	}
	static isOcaUint8Actuator(obj: unknown): obj is OcaUint8Actuator {
		return obj instanceof OcaUint8Actuator && obj.ClassName === 'OcaUint8Actuator'
	}
	static isOcaUint16Actuator(obj: unknown): obj is OcaUint16Actuator {
		return obj instanceof OcaUint16Actuator && obj.ClassName === 'OcaUint16Actuator'
	}
	static isOcaUint32Actuator(obj: unknown): obj is OcaUint32Actuator {
		return obj instanceof OcaUint32Actuator && obj.ClassName === 'OcaUint32Actuator'
	}
	static isOcaUint64Actuator(obj: unknown): obj is OcaUint64Actuator {
		return obj instanceof OcaUint64Actuator && obj.ClassName === 'OcaUint64Actuator'
	}
	static isOcaFloat32Actuator(obj: unknown): obj is OcaFloat32Actuator {
		return obj instanceof OcaFloat32Actuator && obj.ClassName === 'OcaFloat32Actuator'
	}
	static isOcaFloat64Actuator(obj: unknown): obj is OcaFloat64Actuator {
		return obj instanceof OcaFloat64Actuator && obj.ClassName === 'OcaFloat64Actuator'
	}
	static isOcaStringActuator(obj: unknown): obj is OcaStringActuator {
		return obj instanceof OcaStringActuator && obj.ClassName === 'OcaStringActuator'
	}
	static isOcaBitstringActuator(obj: unknown): obj is OcaBitstringActuator {
		return obj instanceof OcaBitstringActuator && obj.ClassName === 'OcaBitstringActuator'
	}
	static isOcaSensor(obj: unknown): obj is OcaSensor {
		return obj instanceof OcaSensor && obj.ClassName === 'OcaSensor'
	}
	static isOcaLevelSensor(obj: unknown): obj is OcaLevelSensor {
		return obj instanceof OcaLevelSensor && obj.ClassName === 'OcaLevelSensor'
	}
	static isOcaAudioLevelSensor(obj: unknown): obj is OcaAudioLevelSensor {
		return obj instanceof OcaAudioLevelSensor && obj.ClassName === 'OcaAudioLevelSensor'
	}
	static isOcaTimeIntervalSensor(obj: unknown): obj is OcaTimeIntervalSensor {
		return obj instanceof OcaTimeIntervalSensor && obj.ClassName === 'OcaTimeIntervalSensor'
	}
	static isOcaFrequencySensor(obj: unknown): obj is OcaFrequencySensor {
		return obj instanceof OcaFrequencySensor && obj.ClassName === 'OcaFrequencySensor'
	}
	static isOcaTemperatureSensor(obj: unknown): obj is OcaTemperatureSensor {
		return obj instanceof OcaTemperatureSensor && obj.ClassName === 'OcaTemperatureSensor'
	}
	static isOcaIdentificationSensor(obj: unknown): obj is OcaIdentificationSensor {
		return obj instanceof OcaIdentificationSensor && obj.ClassName === 'OcaIdentificationSensor'
	}
	static isOcaVoltageSensor(obj: unknown): obj is OcaVoltageSensor {
		return obj instanceof OcaVoltageSensor && obj.ClassName === 'OcaVoltageSensor'
	}
	static isOcaCurrentSensor(obj: unknown): obj is OcaCurrentSensor {
		return obj instanceof OcaCurrentSensor && obj.ClassName === 'OcaCurrentSensor'
	}
	static isOcaImpedanceSensor(obj: unknown): obj is OcaImpedanceSensor {
		return obj instanceof OcaImpedanceSensor && obj.ClassName === 'OcaImpedanceSensor'
	}
	static isOcaGainSensor(obj: unknown): obj is OcaGainSensor {
		return obj instanceof OcaGainSensor && obj.ClassName === 'OcaGainSensor'
	}
	static isOcaBasicSensor(obj: unknown): obj is OcaBasicSensor {
		return obj instanceof OcaBasicSensor && obj.ClassName === 'OcaBasicSensor'
	}
	static isOcaBooleanSensor(obj: unknown): obj is OcaBooleanSensor {
		return obj instanceof OcaBooleanSensor && obj.ClassName === 'OcaBooleanSensor'
	}
	static isOcaInt8Sensor(obj: unknown): obj is OcaInt8Sensor {
		return obj instanceof OcaInt8Sensor && obj.ClassName === 'OcaInt8Sensor'
	}
	static isOcaInt16Sensor(obj: unknown): obj is OcaInt16Sensor {
		return obj instanceof OcaInt16Sensor && obj.ClassName === 'OcaInt16Sensor'
	}
	static isOcaInt32Sensor(obj: unknown): obj is OcaInt32Sensor {
		return obj instanceof OcaInt32Sensor && obj.ClassName === 'OcaInt32Sensor'
	}
	static isOcaInt64Sensor(obj: unknown): obj is OcaInt64Sensor {
		return obj instanceof OcaInt64Sensor && obj.ClassName === 'OcaInt64Sensor'
	}
	static isOcaUint8Sensor(obj: unknown): obj is OcaUint8Sensor {
		return obj instanceof OcaUint8Sensor && obj.ClassName === 'OcaUint8Sensor'
	}
	static isOcaUint16Sensor(obj: unknown): obj is OcaUint16Sensor {
		return obj instanceof OcaUint16Sensor && obj.ClassName === 'OcaUint16Sensor'
	}
	static isOcaUint32Sensor(obj: unknown): obj is OcaUint32Sensor {
		return obj instanceof OcaUint32Sensor && obj.ClassName === 'OcaUint32Sensor'
	}
	static isOcaUint64Sensor(obj: unknown): obj is OcaUint64Sensor {
		return obj instanceof OcaUint64Sensor && obj.ClassName === 'OcaUint64Sensor'
	}
	static isOcaFloat32Sensor(obj: unknown): obj is OcaFloat32Sensor {
		return obj instanceof OcaFloat32Sensor && obj.ClassName === 'OcaFloat32Sensor'
	}
	static isOcaFloat64Sensor(obj: unknown): obj is OcaFloat64Sensor {
		return obj instanceof OcaFloat64Sensor && obj.ClassName === 'OcaFloat64Sensor'
	}
	static isOcaStringSensor(obj: unknown): obj is OcaStringSensor {
		return obj instanceof OcaStringSensor && obj.ClassName === 'OcaStringSensor'
	}
	static isOcaBitstringSensor(obj: unknown): obj is OcaBitstringSensor {
		return obj instanceof OcaBitstringSensor && obj.ClassName === 'OcaBitstringSensor'
	}
	static isOcaBlock(obj: unknown): obj is OcaBlock {
		return obj instanceof OcaBlock && obj.ClassName === 'OcaBlock'
	}
	static isOcaBlockFactory(obj: unknown): obj is OcaBlockFactoryAgent {
		return obj instanceof OcaBlockFactoryAgent && obj.ClassName === 'OcaBlockFactory'
	}
	static isOcaMatrix(obj: unknown): obj is OcaMatrix {
		return obj instanceof OcaMatrix && obj.ClassName === 'OcaMatrix'
	}
	static isOcaAgent(obj: unknown): obj is OcaAgent {
		return obj instanceof OcaAgent && obj.ClassName === 'OcaAgent'
	}
	static isOcaGrouper(obj: unknown): obj is OcaGrouper {
		return obj instanceof OcaGrouper && obj.ClassName === 'OcaGrouper'
	}
	static isOcaRamper(obj: unknown): obj is OcaRamper {
		return obj instanceof OcaRamper && obj.ClassName === 'OcaRamper'
	}
	static isOcaNumericObserver(obj: unknown): obj is OcaNumericObserver {
		return obj instanceof OcaNumericObserver && obj.ClassName === 'OcaNumericObserver'
	}
	static isOcaNumericObserverList(obj: unknown): obj is OcaNumericObserverList {
		return obj instanceof OcaNumericObserverList && obj.ClassName === 'OcaNumericObserverList'
	}
	static isOcaPowerSupply(obj: unknown): obj is OcaPowerSupply {
		return obj instanceof OcaPowerSupply && obj.ClassName === 'OcaPowerSupply'
	}
	static isOcaMediaClock3(obj: unknown): obj is OcaMediaClock3 {
		return obj instanceof OcaMediaClock3 && obj.ClassName === 'OcaMediaClock3'
	}
	static isOcaTimeSource(obj: unknown): obj is OcaTimeSource {
		return obj instanceof OcaTimeSource && obj.ClassName === 'OcaTimeSource'
	}
	static isOcaPhysicalPosition(obj: unknown): obj is OcaPhysicalPosition {
		return obj instanceof OcaPhysicalPosition && obj.ClassName === 'OcaPhysicalPosition'
	}
	static isOcaApplicationNetwork(obj: unknown): obj is OcaApplicationNetwork {
		return obj instanceof OcaApplicationNetwork && obj.ClassName === 'OcaApplicationNetwork'
	}
	static isOcaControlNetwork(obj: unknown): obj is OcaControlNetwork {
		return obj instanceof OcaControlNetwork && obj.ClassName === 'OcaControlNetwork'
	}
	static isOcaMediaTransportNetwork(obj: unknown): obj is OcaMediaTransportNetwork {
		return obj instanceof OcaMediaTransportNetwork && obj.ClassName === 'OcaMediaTransportNetwork'
	}
	static isOcaManager(obj: unknown): obj is OcaManager {
		return obj instanceof OcaManager && obj.ClassName === 'OcaManager'
	}
	static isOcaDeviceManager(obj: unknown): obj is OcaDeviceManager {
		return obj instanceof OcaDeviceManager && obj.ClassName === 'OcaDeviceManager'
	}
	static isOcaSecurityManager(obj: unknown): obj is OcaSecurityManager {
		return obj instanceof OcaSecurityManager && obj.ClassName === 'OcaSecurityManager'
	}
	static isOcaFirmwareManager(obj: unknown): obj is OcaFirmwareManager {
		return obj instanceof OcaFirmwareManager && obj.ClassName === 'OcaFirmwareManager'
	}
	static isOcaSubscriptionManager(obj: unknown): obj is OcaSubscriptionManager {
		return obj instanceof OcaSubscriptionManager && obj.ClassName === 'OcaSubscriptionManager'
	}
	static isOcaPowerManager(obj: unknown): obj is OcaPowerManager {
		return obj instanceof OcaPowerManager && obj.ClassName === 'OcaPowerManager'
	}
	static isOcaNetworkManager(obj: unknown): obj is OcaNetworkManager {
		return obj instanceof OcaNetworkManager && obj.ClassName === 'OcaNetworkManager'
	}
	static isOcaMediaClockManager(obj: unknown): obj is OcaMediaClockManager {
		return obj instanceof OcaMediaClockManager && obj.ClassName === 'OcaMediaClockManager'
	}
	static isOcaLibraryManager(obj: unknown): obj is OcaLibraryManager {
		return obj instanceof OcaLibraryManager && obj.ClassName === 'OcaLibraryManager'
	}
	static isOcaAudioProcessingManager(obj: unknown): obj is OcaAudioProcessingManager {
		return obj instanceof OcaAudioProcessingManager && obj.ClassName === 'OcaAudioProcessingManager'
	}
	static isOcaDeviceTimeManager(obj: unknown): obj is OcaDeviceTimeManager {
		return obj instanceof OcaDeviceTimeManager && obj.ClassName === 'OcaDeviceTimeManager'
	}
	static isOcaTaskManager(obj: unknown): obj is OcaTaskManager {
		return obj instanceof OcaTaskManager && obj.ClassName === 'OcaTaskManager'
	}
	static isOcaCodingManager(obj: unknown): obj is OcaCodingManager {
		return obj instanceof OcaCodingManager && obj.ClassName === 'OcaCodingManager'
	}
	static isOcaDiagnosticManager(obj: unknown): obj is OcaDiagnosticManager {
		return obj instanceof OcaDiagnosticManager && obj.ClassName === 'OcaDiagnosticManager'
	}
	static isOcaNetworkSignalChannel(obj: unknown): obj is OcaNetworkSignalChannel {
		return obj instanceof OcaNetworkSignalChannel && obj.ClassName === 'OcaNetworkSignalChannel'
	}
	static isOcaNetwork(obj: unknown): obj is OcaNetwork {
		return obj instanceof OcaNetwork && obj.ClassName === 'OcaNetwork'
	}
	static isOcaMediaClock(obj: unknown): obj is OcaMediaClock {
		return obj instanceof OcaMediaClock && obj.ClassName === 'OcaMediaClock'
	}
	static isOcaStreamNetwork(obj: unknown): obj is OcaStreamNetwork {
		return obj instanceof OcaStreamNetwork && obj.ClassName === 'OcaStreamNetwork'
	}
	static isOcaStreamConnector(obj: unknown): obj is OcaStreamConnector {
		return obj instanceof OcaStreamConnector && obj.ClassName === 'OcaStreamConnector'
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
