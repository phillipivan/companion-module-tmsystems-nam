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
	OcaBlockFactory,
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
	OcaEventHandler,
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
	OcaLibrary,
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
} from 'aes70/src/controller/ControlClasses'
import { ObjectBase } from 'aes70/src/controller/object_base'
import EventEmitter from 'events'

export interface DetermineOcaClassEvents {
	ObjectBase: [obj: ObjectBase]
	OcaRoot: [obj: OcaRoot]
	OcaWorker: [obj: OcaWorker]
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
	OcaFloat32Sensor: [obj: OcaFloat32Sensor]
	OcaFloat64Sensor: [obj: OcaFloat64Sensor]
	OcaStringSensor: [obj: OcaStringSensor]
	OcaBitstringSensor: [obj: OcaBitstringSensor]
	OcaUint64Sensor: [obj: OcaUint64Sensor]
	OcaBlock: [obj: OcaBlock]
	OcaBlockFactory: [obj: OcaBlockFactory]
	OcaMatrix: [obj: OcaMatrix]
	OcaAgent: [OcaAgent: OcaAgent]
	OcaGrouper: [obj: OcaGrouper]
	OcaRamper: [obj: OcaRamper]
	OcaNumericObserver: [obj: OcaNumericObserver]
	OcaLibrary: [obj: OcaLibrary]
	OcaPowerSupply: [obj: OcaPowerSupply]
	OcaEventHandler: [obj: OcaEventHandler]
	OcaNumericObserverList: [obj: OcaNumericObserverList]
	OcaMediaClock3: [obj: OcaMediaClock3]
	OcaTimeSource: [obj: OcaTimeSource]
	OcaPhysicalPosition: [obj: OcaPhysicalPosition]
	OcaApplicationNetwork: [obj: OcaApplicationNetwork]
	OcaControlNetwork: [obj: OcaControlNetwork]
	OcaMediaTransportNetwork: [obj: OcaMediaTransportNetwork]
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
	OcaNetworkSignalChannel: [obj: OcaNetworkSignalChannel]
	OcaNetwork: [obj: OcaNetwork]
	OcaMediaClock: [obj: OcaMediaClock]
	OcaStreamNetwork: [obj: OcaStreamNetwork]
	OcaStreamConnector: [obj: OcaStreamConnector]
}

/*
 * Utility class to determine what child class of ObjectBase an OCA Object is. Feed object to determineClass, and an appropriately typed event will be emitted, or use static methods. determineClass will iterate through arrays, and emit all valid child objects.
 */

export class OcaHelper extends EventEmitter<DetermineOcaClassEvents> {
	constructor() {
		super()
	}

	public determineClass(obj: unknown): void {
		if (obj instanceof ObjectBase) {
			if (obj instanceof OcaRoot) {
				if (obj instanceof OcaWorker) {
					this.emit('OcaWorker', obj)
					if (obj instanceof OcaActuator) {
						if (obj instanceof OcaMute) this.emit('OcaMute', obj)
						else if (obj instanceof OcaPolarity) this.emit('OcaPolarity', obj)
						else if (obj instanceof OcaSwitch) this.emit('OcaSwitch', obj)
						else if (obj instanceof OcaGain) this.emit('OcaGain', obj)
						else if (obj instanceof OcaPanBalance) this.emit('OcaPanBalance', obj)
						else if (obj instanceof OcaDelay) {
							if (obj instanceof OcaDelayExtended) this.emit('OcaDelayExtended', obj)
							else this.emit('OcaDelay', obj)
						} else if (obj instanceof OcaFrequencyActuator) this.emit('OcaFrequencyActuator', obj)
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
						else if (obj instanceof OcaBasicActuator) {
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
						} else this.emit('OcaActuator', obj)
					}
					if (obj instanceof OcaSensor) {
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
						if (obj instanceof OcaBasicSensor) {
							if (obj instanceof OcaBooleanSensor) this.emit('OcaBooleanSensor', obj)
							else if (obj instanceof OcaInt8Sensor) this.emit('OcaInt8Sensor', obj)
							else if (obj instanceof OcaInt16Sensor) this.emit('OcaInt16Sensor', obj)
							else if (obj instanceof OcaInt32Sensor) this.emit('OcaInt32Sensor', obj)
							else if (obj instanceof OcaInt64Sensor) this.emit('OcaInt64Sensor', obj)
							else if (obj instanceof OcaUint8Sensor) this.emit('OcaUint8Sensor', obj)
							else if (obj instanceof OcaUint16Sensor) this.emit('OcaUint16Sensor', obj)
							else if (obj instanceof OcaUint32Sensor) this.emit('OcaUint32Sensor', obj)
							else if (obj instanceof OcaFloat32Sensor) this.emit('OcaFloat32Sensor', obj)
							else if (obj instanceof OcaFloat64Sensor) this.emit('OcaFloat64Sensor', obj)
							else if (obj instanceof OcaStringSensor) this.emit('OcaStringSensor', obj)
							else if (obj instanceof OcaBitstringSensor) this.emit('OcaBitstringSensor', obj)
							else if (obj instanceof OcaUint64Sensor) this.emit('OcaUint64Sensor', obj)
							else this.emit('OcaBasicSensor', obj)
						} else this.emit('OcaSensor', obj)
						return
					}

					if (obj instanceof OcaBlock) this.emit('OcaBlock', obj)
					if (obj instanceof OcaBlockFactory) this.emit('OcaBlockFactory', obj)
					if (obj instanceof OcaMatrix) this.emit('OcaMatrix', obj)
					return
				} else if (obj instanceof OcaAgent) this.emit('OcaAgent', obj)
				else if (obj instanceof OcaGrouper) this.emit('OcaGrouper', obj)
				else if (obj instanceof OcaRamper) this.emit('OcaRamper', obj)
				else if (obj instanceof OcaNumericObserver) this.emit('OcaNumericObserver', obj)
				else if (obj instanceof OcaLibrary) this.emit('OcaLibrary', obj)
				else if (obj instanceof OcaPowerSupply) this.emit('OcaPowerSupply', obj)
				else if (obj instanceof OcaEventHandler) this.emit('OcaEventHandler', obj)
				else if (obj instanceof OcaNumericObserverList) this.emit('OcaNumericObserverList', obj)
				else if (obj instanceof OcaMediaClock3) this.emit('OcaMediaClock3', obj)
				else if (obj instanceof OcaTimeSource) this.emit('OcaTimeSource', obj)
				else if (obj instanceof OcaPhysicalPosition) this.emit('OcaPhysicalPosition', obj)
				else if (obj instanceof OcaApplicationNetwork) this.emit('OcaApplicationNetwork', obj)
				else if (obj instanceof OcaControlNetwork) this.emit('OcaControlNetwork', obj)
				else if (obj instanceof OcaMediaTransportNetwork) this.emit('OcaMediaTransportNetwork', obj)
				else if (obj instanceof OcaManager) {
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
				} else if (obj instanceof OcaNetworkSignalChannel) this.emit('OcaNetworkSignalChannel', obj)
				else if (obj instanceof OcaNetwork) this.emit('OcaNetwork', obj)
				else if (obj instanceof OcaMediaClock) this.emit('OcaMediaClock', obj)
				else if (obj instanceof OcaStreamNetwork) this.emit('OcaStreamNetwork', obj)
				else if (obj instanceof OcaStreamConnector) this.emit('OcaStreamConnector', obj)
				else this.emit('OcaRoot', obj)
			} else this.emit('ObjectBase', obj)
		} else if (Array.isArray(obj)) {
			obj.forEach((element) => this.determineClass(element))
		}
	}

	static isOcaActuator(obj: unknown): obj is OcaActuator {
		return obj instanceof OcaActuator && obj.ClassName == 'OcaActuator'
	}

	static isOcaAgent(obj: unknown): obj is OcaAgent {
		return obj instanceof OcaAgent && obj.ClassName == 'OcaAgent'
	}

	static isOcaApplicationNetwork(obj: unknown): obj is OcaApplicationNetwork {
		return obj instanceof OcaApplicationNetwork && obj.ClassName == 'OcaApplicationNetwork'
	}

	static isOcaAudioLevelSensor(obj: unknown): obj is OcaAudioLevelSensor {
		return obj instanceof OcaAudioLevelSensor && obj.ClassName == 'OcaAudioLevelSensor'
	}

	static isOcaAudioProcessingManager(obj: unknown): obj is OcaAudioProcessingManager {
		return obj instanceof OcaAudioProcessingManager && obj.ClassName == 'OcaAudioProcessingManager'
	}

	static isOcaBasicActuator(obj: unknown): obj is OcaBasicActuator {
		return obj instanceof OcaBasicActuator && obj.ClassName == 'OcaBasicActuator'
	}

	static isOcaOcaBasicSensor(obj: unknown): obj is OcaBasicSensor {
		return obj instanceof OcaBasicSensor && obj.ClassName == 'OcaBasicSensor'
	}

	static isOcaBitstringActuator(obj: unknown): obj is OcaBitstringActuator {
		return obj instanceof OcaBitstringActuator && obj.ClassName == 'OcaBitstringActuator'
	}

	static isOcaBitstringSensor(obj: unknown): obj is OcaBitstringSensor {
		return obj instanceof OcaBitstringSensor && obj.ClassName == 'OcaBitstringSensor'
	}

	static isOcaBlock(obj: unknown): obj is OcaBlock {
		return obj instanceof OcaBlock && obj.ClassName == 'OcaBlock'
	}

	static isOcaBlockFactory(obj: unknown): obj is OcaBlockFactory {
		return obj instanceof OcaBlockFactory && obj.ClassName == 'OcaBlockFactory'
	}

	static isOcaBooleanActuator(obj: unknown): obj is OcaBooleanActuator {
		return obj instanceof OcaBooleanActuator && obj.ClassName == 'OcaBooleanActuator'
	}

	static isOcaBooleanSensor(obj: unknown): obj is OcaBooleanSensor {
		return obj instanceof OcaBooleanSensor && obj.ClassName == 'OcaBooleanSensor'
	}

	static isOcaCodingManager(obj: unknown): obj is OcaCodingManager {
		return obj instanceof OcaCodingManager && obj.ClassName == 'OcaCodingManager'
	}

	static isOcaControlNetwork(obj: unknown): obj is OcaControlNetwork {
		return obj instanceof OcaControlNetwork && obj.ClassName == 'OcaControlNetwork'
	}

	static isOcaCurrentSensor(obj: unknown): obj is OcaCurrentSensor {
		return obj instanceof OcaCurrentSensor && obj.ClassName == 'OcaCurrentSensor'
	}

	static isOcaDelay(obj: unknown): obj is OcaDelay {
		return obj instanceof OcaDelay && obj.ClassName == 'OcaDelay'
	}

	static isOcaDelayExtended(obj: unknown): obj is OcaDelayExtended {
		return obj instanceof OcaDelayExtended && obj.ClassName == 'OcaDelayExtended'
	}

	static isOcaDeviceManager(obj: unknown): obj is OcaDeviceManager {
		return obj instanceof OcaDeviceManager && obj.ClassName == 'OcaDeviceManager'
	}

	static isOcaDeviceTimeManager(obj: unknown): obj is OcaDeviceTimeManager {
		return obj instanceof OcaDeviceTimeManager && obj.ClassName == 'OcaDeviceTimeManager'
	}

	static isOcaDiagnosticManager(obj: unknown): obj is OcaDiagnosticManager {
		return obj instanceof OcaDiagnosticManager && obj.ClassName == 'OcaDiagnosticManager'
	}

	static isOcaDynamics(obj: unknown): obj is OcaDynamics {
		return obj instanceof OcaDynamics && obj.ClassName == 'OcaDynamics'
	}

	static isOcaDynamicsCurve(obj: unknown): obj is OcaDynamicsCurve {
		return obj instanceof OcaDynamicsCurve && obj.ClassName == 'OcaDynamicsCurve'
	}

	static isOcaDynamicsDetector(obj: unknown): obj is OcaDynamicsDetector {
		return obj instanceof OcaDynamicsDetector && obj.ClassName == 'OcaDynamicsDetector'
	}

	static isOcaEventHandler(obj: unknown): obj is OcaEventHandler {
		return obj instanceof OcaEventHandler && obj.ClassName == 'OcaEventHandler'
	}

	static isOcaFilterArbitraryCurve(obj: unknown): obj is OcaEventHandler {
		return obj instanceof OcaEventHandler && obj.ClassName == 'OcaFilterArbitraryCurve'
	}

	static isOcaFilterClassical(obj: unknown): obj is OcaFilterClassical {
		return obj instanceof OcaFilterClassical && obj.ClassName == 'OcaFilterClassical'
	}

	static isOcaFilterFIR(obj: unknown): obj is OcaFilterFIR {
		return obj instanceof OcaFilterFIR && obj.ClassName == 'OcaFilterFIR'
	}

	static isOcaFilterParametric(obj: unknown): obj is OcaFilterParametric {
		return obj instanceof OcaFilterParametric && obj.ClassName == 'OcaFilterParametric'
	}

	static isOcaFilterPolynomial(obj: unknown): obj is OcaFilterPolynomial {
		return obj instanceof OcaFilterPolynomial && obj.ClassName == 'OcaFilterPolynomial'
	}

	static isOcaFirmwareManager(obj: unknown): obj is OcaFirmwareManager {
		return obj instanceof OcaFirmwareManager && obj.ClassName == 'OcaFirmwareManager'
	}

	static isOcaFloat32Actuator(obj: unknown): obj is OcaFloat32Actuator {
		return obj instanceof OcaFloat32Actuator && obj.ClassName == 'OcaFloat32Actuator'
	}

	static isOcaFloat32Sensor(obj: unknown): obj is OcaFloat32Sensor {
		return obj instanceof OcaFloat32Sensor && obj.ClassName == 'OcaFloat32Sensor'
	}

	static isOcaFloat64Actuator(obj: unknown): obj is OcaFloat64Actuator {
		return obj instanceof OcaFloat64Actuator && obj.ClassName == 'OcaFloat64Actuator'
	}

	static isOcaFloat64Sensor(obj: unknown): obj is OcaFloat64Sensor {
		return obj instanceof OcaFloat64Sensor && obj.ClassName == 'OcaFloat64Sensor'
	}

	static isOcaFrequencyActuator(obj: unknown): obj is OcaFrequencyActuator {
		return obj instanceof OcaFrequencyActuator && obj.ClassName == 'OcaFrequencyActuator'
	}

	static isOcaFrequencySensor(obj: unknown): obj is OcaFrequencySensor {
		return obj instanceof OcaFrequencySensor && obj.ClassName == 'OcaFrequencySensor'
	}

	static isOcaGain(obj: unknown): obj is OcaGain {
		return obj instanceof OcaGain && obj.ClassName == 'OcaGain'
	}

	static isOcaGainSensor(obj: unknown): obj is OcaGainSensor {
		return obj instanceof OcaGainSensor && obj.ClassName == 'OcaGainSensor'
	}

	static isOcaGrouper(obj: unknown): obj is OcaGrouper {
		return obj instanceof OcaGrouper && obj.ClassName == 'OcaGrouper'
	}

	static isOcaIdentificationActuator(obj: unknown): obj is OcaIdentificationActuator {
		return obj instanceof OcaIdentificationActuator && obj.ClassName == 'OcaIdentificationActuator'
	}

	static isOcaIdentificationSensor(obj: unknown): obj is OcaIdentificationSensor {
		return obj instanceof OcaIdentificationSensor && obj.ClassName == 'OcaIdentificationSensor'
	}

	static isOcaImpedanceSensor(obj: unknown): obj is OcaImpedanceSensor {
		return obj instanceof OcaImpedanceSensor && obj.ClassName == 'OcaImpedanceSensor'
	}

	static isOcaInt16Actuator(obj: unknown): obj is OcaInt16Actuator {
		return obj instanceof OcaInt16Actuator && obj.ClassName == 'OcaInt16Actuator'
	}

	static isOcaInt16Sensor(obj: unknown): obj is OcaInt16Sensor {
		return obj instanceof OcaInt16Sensor && obj.ClassName == 'OcaInt16Sensor'
	}

	static isOcaInt32Actuator(obj: unknown): obj is OcaInt32Actuator {
		return obj instanceof OcaInt32Actuator && obj.ClassName == 'OcaInt32Actuator'
	}

	static isOcaInt32Sensor(obj: unknown): obj is OcaInt32Sensor {
		return obj instanceof OcaInt32Sensor && obj.ClassName == 'OcaInt32Sensor'
	}

	static isOcaInt64Actuator(obj: unknown): obj is OcaInt64Actuator {
		return obj instanceof OcaInt64Actuator && obj.ClassName == 'OcaInt64Actuator'
	}

	static isOcaInt64Sensor(obj: unknown): obj is OcaInt64Sensor {
		return obj instanceof OcaInt64Sensor && obj.ClassName == 'OcaInt64Sensor'
	}

	static isOcaInt8Actuator(obj: unknown): obj is OcaInt8Actuator {
		return obj instanceof OcaInt8Actuator && obj.ClassName == 'OcaInt8Actuator'
	}

	static isOcaInt8Sensor(obj: unknown): obj is OcaInt8Sensor {
		return obj instanceof OcaInt8Sensor && obj.ClassName == 'OcaInt8Sensor'
	}

	static isOcaLevelSensor(obj: unknown): obj is OcaLevelSensor {
		return obj instanceof OcaLevelSensor && obj.ClassName == 'OcaLevelSensor'
	}

	static isOcaLibrary(obj: unknown): obj is OcaLibrary {
		return obj instanceof OcaLibrary && obj.ClassName == 'OcaLibrary'
	}

	static isOcaLibraryManager(obj: unknown): obj is OcaLibraryManager {
		return obj instanceof OcaLibraryManager && obj.ClassName == 'OcaLibraryManager'
	}

	static isOcaManager(obj: unknown): obj is OcaManager {
		return obj instanceof OcaManager && obj.ClassName == 'OcaManager'
	}

	static isOcaMatrix(obj: unknown): obj is OcaMatrix {
		return obj instanceof OcaMatrix && obj.ClassName == 'OcaMatrix'
	}

	static isOcaMediaClock(obj: unknown): obj is OcaMediaClock {
		return obj instanceof OcaMediaClock && obj.ClassName == 'OcaMediaClock'
	}

	static isOcaMediaClock3(obj: unknown): obj is OcaMediaClock3 {
		return obj instanceof OcaMediaClock3 && obj.ClassName == 'OcaMediaClock3'
	}

	static isOcaMediaClockManager(obj: unknown): obj is OcaMediaClock3 {
		return obj instanceof OcaMediaClockManager && obj.ClassName == 'OcaMediaClockManager'
	}

	static isOcaMediaTransportNetwork(obj: unknown): obj is OcaMediaTransportNetwork {
		return obj instanceof OcaMediaTransportNetwork && obj.ClassName == 'OcaMediaTransportNetwork'
	}

	static isOcaMute(obj: unknown): obj is OcaMute {
		return obj instanceof OcaMute && obj.ClassName == 'OcaMute'
	}

	static isOcaNetwork(obj: unknown): obj is OcaNetwork {
		return obj instanceof OcaNetwork && obj.ClassName == 'OcaNetwork'
	}

	static isOcaNetworkManager(obj: unknown): obj is OcaNetworkManager {
		return obj instanceof OcaNetworkManager && obj.ClassName == 'OcaNetworkManager'
	}

	static isOcaNetworkSignalChannel(obj: unknown): obj is OcaNetworkSignalChannel {
		return obj instanceof OcaNetworkSignalChannel && obj.ClassName == 'OcaNetworkSignalChannel'
	}

	static isOcaNumericObserver(obj: unknown): obj is OcaNumericObserver {
		return obj instanceof OcaNumericObserver && obj.ClassName == 'OcaNumericObserver'
	}

	static isOcaNumericObserverList(obj: unknown): obj is OcaNumericObserverList {
		return obj instanceof OcaNumericObserverList && obj.ClassName == 'OcaNumericObserverList'
	}

	static isOcaPanBalance(obj: unknown): obj is OcaPanBalance {
		return obj instanceof OcaPanBalance && obj.ClassName == 'OcaPanBalance'
	}

	static isOcaPhysicalPosition(obj: unknown): obj is OcaPhysicalPosition {
		return obj instanceof OcaPhysicalPosition && obj.ClassName == 'OcaPhysicalPosition'
	}

	static isOcaPolarity(obj: unknown): obj is OcaPolarity {
		return obj instanceof OcaPolarity && obj.ClassName == 'OcaPolarity'
	}

	static isOcaPowerManager(obj: unknown): obj is OcaPowerManager {
		return obj instanceof OcaPowerManager && obj.ClassName == 'OcaPowerManager'
	}

	static isOcaPowerSupply(obj: unknown): obj is OcaPowerSupply {
		return obj instanceof OcaPowerSupply && obj.ClassName == 'OcaPowerSupply'
	}

	static isOcaRamper(obj: unknown): obj is OcaRamper {
		return obj instanceof OcaRamper && obj.ClassName == 'OcaRamper'
	}

	static isOcaRoot(obj: unknown): obj is OcaRoot {
		return obj instanceof OcaRoot && obj.ClassName == 'OcaRoot'
	}

	static isOcaSecurityManager(obj: unknown): obj is OcaSecurityManager {
		return obj instanceof OcaSecurityManager && obj.ClassName == 'OcaSecurityManager'
	}

	static isOcaSensor(obj: unknown): obj is OcaSensor {
		return obj instanceof OcaSensor && obj.ClassName == 'OcaSensor'
	}

	static isOcaSignalGenerator(obj: unknown): obj is OcaSignalGenerator {
		return obj instanceof OcaSignalGenerator && obj.ClassName == 'OcaSignalGenerator'
	}

	static isOcaSignalInput(obj: unknown): obj is OcaSignalInput {
		return obj instanceof OcaSignalInput && obj.ClassName == 'OcaSignalInput'
	}

	static isOcaSignalOutput(obj: unknown): obj is OcaSignalOutput {
		return obj instanceof OcaSignalOutput && obj.ClassName == 'OcaSignalOutput'
	}

	static isOcaStreamConnector(obj: unknown): obj is OcaStreamConnector {
		return obj instanceof OcaStreamConnector && obj.ClassName == 'OcaStreamConnector'
	}

	static isOcaStreamNetwork(obj: unknown): obj is OcaStreamNetwork {
		return obj instanceof OcaStreamNetwork && obj.ClassName == 'OcaStreamNetwork'
	}

	static isOcaStringActuator(obj: unknown): obj is OcaStringActuator {
		return obj instanceof OcaStringActuator && obj.ClassName == 'OcaStringActuator'
	}

	static isOcaStringSensor(obj: unknown): obj is OcaStringSensor {
		return obj instanceof OcaStringSensor && obj.ClassName == 'OcaStringSensor'
	}

	static isOcaSubscriptionManager(obj: unknown): obj is OcaSubscriptionManager {
		return obj instanceof OcaSubscriptionManager && obj.ClassName == 'OcaSubscriptionManager'
	}

	static isOcaSummingPoint(obj: unknown): obj is OcaSummingPoint {
		return obj instanceof OcaSummingPoint && obj.ClassName == 'OcaSummingPoint'
	}

	static isOcaSwitch(obj: unknown): obj is OcaSwitch {
		return obj instanceof OcaSwitch && obj.ClassName == 'OcaSwitch'
	}
	static isOcaTaskManager(obj: unknown): obj is OcaTaskManager {
		return obj instanceof OcaTaskManager && obj.ClassName == 'OcaTaskManager'
	}

	static isOcaTemperatureActuator(obj: unknown): obj is OcaTemperatureActuator {
		return obj instanceof OcaTemperatureActuator && obj.ClassName == 'OcaTemperatureActuator'
	}

	static isOcaTemperatureSensor(obj: unknown): obj is OcaTemperatureSensor {
		return obj instanceof OcaTemperatureSensor && obj.ClassName == 'OcaTemperatureSensor'
	}

	static isOcaTimeIntervalSensor(obj: unknown): obj is OcaTimeIntervalSensor {
		return obj instanceof OcaTimeIntervalSensor && obj.ClassName == 'OcaTimeIntervalSensor'
	}

	static isOcaTimeSource(obj: unknown): obj is OcaTimeSource {
		return obj instanceof OcaTimeSource && obj.ClassName == 'OcaTimeSource'
	}

	static isOcaUint16Actuator(obj: unknown): obj is OcaUint16Actuator {
		return obj instanceof OcaUint16Actuator && obj.ClassName == 'OcaUint16Actuator'
	}

	static isOcaUint16Sensor(obj: unknown): obj is OcaUint16Sensor {
		return obj instanceof OcaUint16Sensor && obj.ClassName == 'OcaUint16Sensor'
	}

	static isOcaUint32Actuator(obj: unknown): obj is OcaUint32Actuator {
		return obj instanceof OcaUint32Actuator && obj.ClassName == 'OcaUint32Actuator'
	}

	static isOcaUint32Sensor(obj: unknown): obj is OcaUint32Sensor {
		return obj instanceof OcaUint32Sensor && obj.ClassName == 'OcaUint32Sensor'
	}

	static isOcaUint64Actuator(obj: unknown): obj is OcaUint64Actuator {
		return obj instanceof OcaUint64Actuator && obj.ClassName == 'OcaUint64Actuator'
	}

	static isOcaUint64Sensor(obj: unknown): obj is OcaUint64Sensor {
		return obj instanceof OcaUint64Sensor && obj.ClassName == 'OcaUint64Sensor'
	}

	static isOcaUint8Actuator(obj: unknown): obj is OcaUint8Actuator {
		return obj instanceof OcaUint8Actuator && obj.ClassName == 'OcaUint8Actuator'
	}

	static isOcaUint8Sensor(obj: unknown): obj is OcaUint8Sensor {
		return obj instanceof OcaUint8Sensor && obj.ClassName == 'OcaUint8Sensor'
	}

	static isOcaVoltageSensor(obj: unknown): obj is OcaVoltageSensor {
		return obj instanceof OcaVoltageSensor && obj.ClassName == 'OcaVoltageSensor'
	}

	static isOcaWorker(obj: unknown): obj is OcaWorker {
		return obj instanceof OcaWorker && obj.ClassName == 'OcaWorker'
	}

	static isObjectBase(obj: unknown): obj is ObjectBase {
		return obj instanceof ObjectBase && obj.ClassName == 'ObjectBase'
	}
}
