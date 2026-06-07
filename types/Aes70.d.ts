import {} from 'aes70/src/controller/object_base'
import {} from 'aes70/src/controller/ControlClasses'

/**
 * Extended type declarations for aes70.js (AES70-2018 / OCA)
 *
 * These declarations augment the existing `aes70` module with complete
 * method, property-event, and data-type signatures derived from the
 * AES70.js documentation at https://docs.deuso.de/AES70.js/
 *
 * Usage – place next to your tsconfig and set:
 *   "typeRoots": ["./node_modules/@types", "."]
 * or add a triple-slash reference:
 *   /// <reference path="./aes70.d.ts" />
 */

// ---------------------------------------------------------------------------
// Primitive / shared AES70 data types
// ---------------------------------------------------------------------------

/** Opaque OCA class ID (array of uint16 segments). */
export interface OcaClassID {
	readonly Fields: number[]
}

/** OCA class identification (ID + version). */
export interface OcaClassIdentification {
	readonly ClassID: OcaClassID
	readonly ClassVersion: number
}

/** OCA port identifier. */
export interface OcaPortID {
	readonly Mode: OcaPortMode
	readonly Index: number
}

/** OCA port descriptor. */
export interface OcaPort {
	readonly Owner: number
	readonly ID: OcaPortID
	readonly Name: string
}

/** OCA signal path. */
export interface OcaSignalPath {
	readonly SourcePort: OcaPort
	readonly SinkPort: OcaPort
}

/** OCA object identification. */
export interface OcaObjectIdentification {
	readonly ONo: number
	readonly ClassIdentification: OcaClassIdentification
}

/** OCA block member. */
export interface OcaBlockMember {
	readonly MemberObjectIdentification: OcaObjectIdentification
	readonly ContainerObjectNumber: number
}

/** OCA model description. */
export interface OcaModelDescription {
	readonly Manufacturer: string
	readonly Name: string
	readonly Version: string
}

/** OCA model GUID. */
export interface OcaModelGUID {
	readonly Reserved: number
	readonly MfrCode: number[]
	readonly ModelCode: number[]
}

/** OCA version. */
export interface OcaVersion {
	readonly Major: number
	readonly Minor: number
	readonly Build: number
	readonly Component: OcaComponent
}

/** OCA manager descriptor. */
export interface OcaManagerDescriptor {
	readonly ObjectNumber: number
	readonly Name: string
	readonly ClassID: OcaClassID
	readonly ClassVersion: number
}

/** OCA media clock rate. */
export interface OcaMediaClockRate {
	readonly NominalRate: number
	readonly Timeoutmsec: number
	readonly Accuracy: number
}

/** OCA delay value (number + unit). */
export interface OcaDelayValue {
	readonly DelayValue: number
	readonly DelayUnit: OcaDelayUnit
}

/** OCA transfer function (arrays of coefficients). */
export interface OcaTransferFunction {
	readonly Numerator: number[]
	readonly Denominator: number[]
}

/** OCA impedance (magnitude + phase). */
export interface OcaImpedance {
	readonly Magnitude: number
	readonly Phase: number
}

/** OCA position descriptor. */
export interface OcaPositionDescriptor {
	readonly CoordinateSystem: OcaPositionCoordinateSystem
	readonly FieldFlags: number
	readonly Values: number[]
}

/** OCA PTP timestamp. */
export interface OcaTimePTP {
	readonly Negative: boolean
	readonly Seconds: number
	readonly Nanoseconds: number
}

/** OCA object path (address + object number). */
export interface OcaOPath {
	readonly HostID: Uint8Array
	readonly ONo: number
}

/** OCA network system interface descriptor. */
export interface OcaNetworkSystemInterfaceDescriptor {
	readonly SystemInterfaceParameters: Uint8Array
	readonly MyNetworkAddress: Uint8Array
}

/** OCA network statistics. */
export interface OcaNetworkStatistics {
	readonly rxPacketErrors: number
	readonly txPacketErrors: number
}

/** OCA stream connector identification. */
export interface OcaStreamConnectorIdentification {
	readonly HostID: Uint8Array
	readonly NetworkAddress: Uint8Array
	readonly NodeID: Uint8Array
	readonly StreamConnectorID: number
	readonly StreamType: OcaStreamType
}

/** OCA stream. */
export interface OcaStream {
	readonly Connection: OcaMediaConnection
	readonly Priority: number
	readonly Index: number
}

/** OCA media connection. */
export interface OcaMediaConnection {
	readonly Secure: boolean
	readonly StreamParameters: Uint8Array
	readonly StreamCastMode: OcaMediaStreamCastMode
	readonly StreamChannelCount: number
}

/** OCA media coding. */
export interface OcaMediaCoding {
	readonly CodingSchemeID: number
	readonly CodecParameters: string
	readonly ClockONo: number
}

/** OCA media source connector. */
export interface OcaMediaSourceConnector {
	readonly IDInternal: number
	readonly IDExternal: string
	readonly Connection: OcaMediaConnection
	readonly AvailableCodings: OcaMediaCoding[]
	readonly PinCount: number
	readonly ChannelPinMap: Map<number, number>
	readonly AlignmentLevel: number
	readonly CurrentCoding: OcaMediaCoding
}

/** OCA media sink connector. */
export interface OcaMediaSinkConnector {
	readonly IDInternal: number
	readonly IDExternal: string
	readonly Connection: OcaMediaConnection
	readonly AvailableCodings: OcaMediaCoding[]
	readonly PinCount: number
	readonly ChannelPinMap: Map<number, number>
	readonly AlignmentLevel: number
	readonly AlignmentGain: number
	readonly CurrentCoding: OcaMediaCoding
}

/** OCA media connector status. */
export interface OcaMediaConnectorStatus {
	readonly ConnectorID: number
	readonly State: OcaMediaConnectorState
	readonly ErrorCode: number
}

/** OCA grouperGroup. */
export interface OcaGrouperGroup {
	readonly Index: number
	readonly ProxyONo: number
}

/** OCA grouper citizen. */
export interface OcaGrouperCitizen {
	readonly Index: number
	readonly ObjectPath: OcaOPath
	readonly Online: boolean
}

/** OCA grouper enrollment. */
export interface OcaGrouperEnrollment {
	readonly GroupIndex: number
	readonly CitizenIndex: number
}

/** OCA library volume identifier. */
export interface OcaLibVolIdentifier {
	readonly Library: number
	readonly ID: number
}

/** OCA library volume metadata. */
export interface OcaLibVolMetadata {
	readonly Name: string
	readonly VolType: OcaLibVolType
	readonly Access: OcaLibAccess
	readonly Version: number
	readonly Creator: string
	readonly DateCreated: string
}

/** OCA library volume. */
export interface OcaLibVol {
	readonly Metadata: OcaLibVolMetadata
	readonly Data: unknown
}

/** OCA library identifier. */
export interface OcaLibraryIdentifier {
	readonly ID: number
	readonly Type: OcaLibVolType
}

/** OCA library param-set assignment. */
export interface OcaLibParamSetAssignment {
	readonly ParamSetLibVolIdentifier: OcaLibVolIdentifier
	readonly TargetBlockONo: number
}

/** OCA task. */
export interface OcaTask {
	readonly ID: number
	readonly Label: string
	readonly ProgramID: OcaLibVolIdentifier
	readonly GroupID: number
	readonly TimeMode: OcaTimeMode
	readonly TimeSourceONo: number
	readonly StartTime: OcaTimePTP
	readonly Duration: number
	readonly ApplicationSpecificParameters: Uint8Array
}

/** OCA task status. */
export interface OcaTaskStatus {
	readonly ID: number
	readonly State: OcaTaskState
	readonly ErrorCode: number
}

/** OCA numeric observer observation event data. */
export interface OcaObservationEventData {
	readonly Reading: number
}

/** OCA pilot tone detector spec. */
export interface OcaPilotToneDetectorSpec {
	readonly Threshold: number
	readonly Frequency: number
	readonly PollInterval: number
}

/** OCA object search result. */
export interface OcaObjectSearchResult {
	readonly ONo: number
	readonly ClassIdentification: OcaClassIdentification
	readonly ContainerPath: number[]
	readonly Role: string
	readonly Label: string
}

// ---------------------------------------------------------------------------
// Enum types (implemented as classes with valueOf()/toString() per the docs)
// ---------------------------------------------------------------------------

export type OcaPortMode = { valueOf(): number; toString(): string }
export type OcaComponent = { valueOf(): number; toString(): string }
export type OcaDelayUnit = { valueOf(): number; toString(): string }
export type OcaMuteState = { valueOf(): number; toString(): string }
export type OcaPolarityState = { valueOf(): number; toString(): string }
export type OcaSensorReadingState = { valueOf(): number; toString(): string }
export type OcaLevelMeterLaw = { valueOf(): number; toString(): string }
export type OcaClassicalFilterShape = { valueOf(): number; toString(): string }
export type OcaFilterPassband = { valueOf(): number; toString(): string }
export type OcaParametricEQShape = { valueOf(): number; toString(): string }
export type OcaDynamicsFunction = { valueOf(): number; toString(): string }
export type OcaLevelDetectionLaw = { valueOf(): number; toString(): string }
export type OcaWaveformType = { valueOf(): number; toString(): string }
export type OcaSweepType = { valueOf(): number; toString(): string }
export type OcaNetworkLinkType = { valueOf(): number; toString(): string }
export type OcaNetworkControlProtocol = { valueOf(): number; toString(): string }
export type OcaNetworkMediaProtocol = { valueOf(): number; toString(): string }
export type OcaNetworkStatus = { valueOf(): number; toString(): string }
export type OcaNetworkMediaSourceOrSink = { valueOf(): number; toString(): string }
export type OcaNetworkSignalChannelStatus = { valueOf(): number; toString(): string }
export type OcaStreamConnectorStatus = { valueOf(): number; toString(): string }
export type OcaStreamStatus = { valueOf(): number; toString(): string }
export type OcaStreamType = { valueOf(): number; toString(): string }
export type OcaMediaStreamCastMode = { valueOf(): number; toString(): string }
export type OcaMediaConnectorState = { valueOf(): number; toString(): string }
export type OcaMediaConnectorCommand = { valueOf(): number; toString(): string }
export type OcaMediaConnectorElement = { valueOf(): number; toString(): string }
export type OcaMediaClockType = { valueOf(): number; toString(): string }
export type OcaMediaClockAvailability = { valueOf(): number; toString(): string }
export type OcaMediaClockLockState = { valueOf(): number; toString(): string }
export type OcaTimeProtocol = { valueOf(): number; toString(): string }
export type OcaTimeReferenceType = { valueOf(): number; toString(): string }
export type OcaTimeMode = { valueOf(): number; toString(): string }
export type OcaTimeSourceAvailability = { valueOf(): number; toString(): string }
export type OcaTimeSourceSyncStatus = { valueOf(): number; toString(): string }
export type OcaPositionCoordinateSystem = { valueOf(): number; toString(): string }
export type OcaGrouperMode = { valueOf(): number; toString(): string }
export type OcaGrouperStatusChangeType = { valueOf(): number; toString(): string }
export type OcaLibAccess = { valueOf(): number; toString(): string }
export type OcaLibVolType = { valueOf(): number; toString(): string }
export type OcaLibVolStandardTypeID = { valueOf(): number; toString(): string }
export type OcaRamperCommand = { valueOf(): number; toString(): string }
export type OcaRamperState = { valueOf(): number; toString(): string }
export type OcaRamperInterpolationLaw = { valueOf(): number; toString(): string }
export type OcaRelationalOperator = { valueOf(): number; toString(): string }
export type OcaObserverState = { valueOf(): number; toString(): string }
export type OcaTaskCommand = { valueOf(): number; toString(): string }
export type OcaTaskState = { valueOf(): number; toString(): string }
export type OcaTaskManagerState = { valueOf(): number; toString(): string }
export type OcaPowerState = { valueOf(): number; toString(): string }
export type OcaPowerSupplyType = { valueOf(): number; toString(): string }
export type OcaPowerSupplyLocation = { valueOf(): number; toString(): string }
export type OcaPowerSupplyState = { valueOf(): number; toString(): string }
export type OcaDeviceState = { valueOf(): number; toString(): string }
export type OcaResetCause = { valueOf(): number; toString(): string }
export type OcaBaseDataType = { valueOf(): number; toString(): string }
export type OcaStringComparisonType = { valueOf(): number; toString(): string }
export type OcaApplicationNetworkCommand = { valueOf(): number; toString(): string }
export type OcaApplicationNetworkState = { valueOf(): number; toString(): string }
export type OcaNotificationDeliveryMode = { valueOf(): number; toString(): string }
export type OcaSubscriptionManagerState = { valueOf(): number; toString(): string }
export type OcaPresentationUnit = { valueOf(): number; toString(): string }
export type OcaPropertyChangeType = { valueOf(): number; toString(): string }
export type OcaObjectSearchResultFlags = { valueOf(): number; toString(): string }

// ---------------------------------------------------------------------------
// Event / PropertyEvent helpers
// ---------------------------------------------------------------------------

export interface Event<T = void> {
	subscribe(callback: T extends void ? () => void : (value: T) => void): void
	unsubscribe(callback: T extends void ? () => void : (value: T) => void): void
	/** Alias with a typo kept from the original docs. */
	Dipose(): void
}

export interface PropertyEvent<T> extends Event<T> {}

// ---------------------------------------------------------------------------
// Arguments – multi-return helper
// ---------------------------------------------------------------------------

export interface Arguments<T extends unknown[]> {
	readonly length: number
	item(n: number): T[number]
}

// ---------------------------------------------------------------------------
// Oca class names – for type-safe class checks and casts
// ---------------------------------------------------------------------------

export const OCA_CLASS_NAMES = {
	ObjectBase: 'ObjectBase',
	OcaRoot: 'OcaRoot',
	OcaWorker: 'OcaWorker',
	OcaActuator: 'OcaActuator',
	OcaMute: 'OcaMute',
	OcaPolarity: 'OcaPolarity',
	OcaSwitch: 'OcaSwitch',
	OcaGain: 'OcaGain',
	OcaPanBalance: 'OcaPanBalance',
	OcaDelay: 'OcaDelay',
	OcaDelayExtended: 'OcaDelayExtended',
	OcaFrequencyActuator: 'OcaFrequencyActuator',
	OcaFilterClassical: 'OcaFilterClassical',
	OcaFilterParametric: 'OcaFilterParametric',
	OcaFilterPolynomial: 'OcaFilterPolynomial',
	OcaFilterFIR: 'OcaFilterFIR',
	OcaFilterArbitraryCurve: 'OcaFilterArbitraryCurve',
	OcaDynamics: 'OcaDynamics',
	OcaDynamicsDetector: 'OcaDynamicsDetector',
	OcaDynamicsCurve: 'OcaDynamicsCurve',
	OcaSignalGenerator: 'OcaSignalGenerator',
	OcaSignalInput: 'OcaSignalInput',
	OcaSignalOutput: 'OcaSignalOutput',
	OcaTemperatureActuator: 'OcaTemperatureActuator',
	OcaIdentificationActuator: 'OcaIdentificationActuator',
	OcaSummingPoint: 'OcaSummingPoint',
	OcaBasicActuator: 'OcaBasicActuator',
	OcaBooleanActuator: 'OcaBooleanActuator',
	OcaInt8Actuator: 'OcaInt8Actuator',
	OcaInt16Actuator: 'OcaInt16Actuator',
	OcaInt32Actuator: 'OcaInt32Actuator',
	OcaInt64Actuator: 'OcaInt64Actuator',
	OcaUint8Actuator: 'OcaUint8Actuator',
	OcaUint16Actuator: 'OcaUint16Actuator',
	OcaUint32Actuator: 'OcaUint32Actuator',
	OcaUint64Actuator: 'OcaUint64Actuator',
	OcaFloat32Actuator: 'OcaFloat32Actuator',
	OcaFloat64Actuator: 'OcaFloat64Actuator',
	OcaStringActuator: 'OcaStringActuator',
	OcaBitstringActuator: 'OcaBitstringActuator',
	OcaSensor: 'OcaSensor',
	OcaLevelSensor: 'OcaLevelSensor',
	OcaAudioLevelSensor: 'OcaAudioLevelSensor',
	OcaTimeIntervalSensor: 'OcaTimeIntervalSensor',
	OcaFrequencySensor: 'OcaFrequencySensor',
	OcaTemperatureSensor: 'OcaTemperatureSensor',
	OcaIdentificationSensor: 'OcaIdentificationSensor',
	OcaVoltageSensor: 'OcaVoltageSensor',
	OcaCurrentSensor: 'OcaCurrentSensor',
	OcaImpedanceSensor: 'OcaImpedanceSensor',
	OcaGainSensor: 'OcaGainSensor',
	OcaBasicSensor: 'OcaBasicSensor',
	OcaBooleanSensor: 'OcaBooleanSensor',
	OcaInt8Sensor: 'OcaInt8Sensor',
	OcaInt16Sensor: 'OcaInt16Sensor',
	OcaInt32Sensor: 'OcaInt32Sensor',
	OcaInt64Sensor: 'OcaInt64Sensor',
	OcaUint8Sensor: 'OcaUint8Sensor',
	OcaUint16Sensor: 'OcaUint16Sensor',
	OcaUint32Sensor: 'OcaUint32Sensor',
	OcaUint64Sensor: 'OcaUint64Sensor',
	OcaFloat32Sensor: 'OcaFloat32Sensor',
	OcaFloat64Sensor: 'OcaFloat64Sensor',
	OcaStringSensor: 'OcaStringSensor',
	OcaBitstringSensor: 'OcaBitstringSensor',
	OcaBlock: 'OcaBlock',
	OcaBlockFactory: 'OcaBlockFactory',
	OcaMatrix: 'OcaMatrix',
	OcaAgent: 'OcaAgent',
	OcaGrouper: 'OcaGrouper',
	OcaRamper: 'OcaRamper',
	OcaNumericObserver: 'OcaNumericObserver',
	OcaNumericObserverList: 'OcaNumericObserverList',
	OcaPowerSupply: 'OcaPowerSupply',
	OcaMediaClock3: 'OcaMediaClock3',
	OcaTimeSource: 'OcaTimeSource',
	OcaPhysicalPosition: 'OcaPhysicalPosition',
	OcaApplicationNetwork: 'OcaApplicationNetwork',
	OcaControlNetwork: 'OcaControlNetwork',
	OcaMediaTransportNetwork: 'OcaMediaTransportNetwork',
	OcaManager: 'OcaManager',
	OcaDeviceManager: 'OcaDeviceManager',
	OcaSecurityManager: 'OcaSecurityManager',
	OcaFirmwareManager: 'OcaFirmwareManager',
	OcaSubscriptionManager: 'OcaSubscriptionManager',
	OcaPowerManager: 'OcaPowerManager',
	OcaNetworkManager: 'OcaNetworkManager',
	OcaMediaClockManager: 'OcaMediaClockManager',
	OcaLibraryManager: 'OcaLibraryManager',
	OcaAudioProcessingManager: 'OcaAudioProcessingManager',
	OcaDeviceTimeManager: 'OcaDeviceTimeManager',
	OcaTaskManager: 'OcaTaskManager',
	OcaCodingManager: 'OcaCodingManager',
	OcaDiagnosticManager: 'OcaDiagnosticManager',
	OcaNetworkSignalChannel: 'OcaNetworkSignalChannel',
	OcaNetwork: 'OcaNetwork',
	OcaMediaClock: 'OcaMediaClock',
	OcaStreamNetwork: 'OcaStreamNetwork',
	OcaStreamConnector: 'OcaStreamConnector',
} as const

export type OcaClassName = (typeof OCA_CLASS_NAMES)[keyof typeof OCA_CLASS_NAMES]

// ---------------------------------------------------------------------------
// Property map interfaces — returned by GetPropertySync() on each class.
// Each interface extends its parent so the full inherited set is available.
// ---------------------------------------------------------------------------

// Base

export interface OcaRootProperties {
	[key: string]: unknown
	ClassID: OcaClassID
	ClassVersion: number
	ObjectNumber: number
	Lockable: boolean
	Role: string
}

export interface OcaWorkerProperties extends OcaRootProperties {
	Enabled: boolean
	Label: string
	Owner: number
	Latency: number
	Ports: OcaPort[]
}

// Actuators

export interface OcaActuatorProperties extends OcaWorkerProperties {}

export interface OcaMuteProperties extends OcaActuatorProperties {
	State: OcaMuteState
}

export interface OcaPolarityProperties extends OcaActuatorProperties {
	State: OcaPolarityState
}

export interface OcaSwitchProperties extends OcaActuatorProperties {
	Position: number
	PositionNames: string[]
	PositionEnableds: boolean[]
}

export interface OcaGainProperties extends OcaActuatorProperties {
	Gain: number
}

export interface OcaPanBalanceProperties extends OcaActuatorProperties {
	Position: number
	Midpoint: number
}

export interface OcaDelayProperties extends OcaActuatorProperties {
	DelayTime: number
}

export interface OcaDelayExtendedProperties extends OcaDelayProperties {
	DelayValue: OcaDelayValue
}

export interface OcaFrequencyActuatorProperties extends OcaActuatorProperties {
	Frequency: number
}

export interface OcaFilterClassicalProperties extends OcaActuatorProperties {
	Frequency: number
	Passband: OcaFilterPassband
	Shape: OcaClassicalFilterShape
	Order: number
	Parameter: number
}

export interface OcaFilterParametricProperties extends OcaActuatorProperties {
	Frequency: number
	Shape: OcaParametricEQShape
	WidthParameter: number
	InBandGain: number
	ShapeParameter: number
}

export interface OcaFilterPolynomialProperties extends OcaActuatorProperties {
	A: number[]
	B: number[]
	SampleRate: number
}

export interface OcaFilterFIRProperties extends OcaActuatorProperties {
	Length: number
	Coefficients: number[]
	SampleRate: number
}

export interface OcaFilterArbitraryCurveProperties extends OcaActuatorProperties {
	TransferFunction: OcaTransferFunction
	SampleRate: number
	TFMinLength: number
	TFMaxLength: number
}

export interface OcaDynamicsProperties extends OcaActuatorProperties {
	Function: OcaDynamicsFunction
	Ratio: number
	Threshold: number
	ThresholdPresentationUnits: OcaPresentationUnit
	DetectorLaw: OcaLevelDetectionLaw
	AttackTime: number
	ReleaseTime: number
	HoldTime: number
	DynamicGainFloor: number
	DynamicGainCeiling: number
	KneeLower: number
	KneeUpper: number
	DynamicGain: number
}

export interface OcaDynamicsDetectorProperties extends OcaActuatorProperties {
	Law: OcaLevelDetectionLaw
	AttackTime: number
	ReleaseTime: number
	HoldTime: number
}

export interface OcaDynamicsCurveProperties extends OcaActuatorProperties {
	NSegments: number
	Threshold: number[]
	Slope: number[]
	KneeParameter: number[]
	DynamicGainFloor: number
	DynamicGainCeiling: number
}

export interface OcaSignalGeneratorProperties extends OcaActuatorProperties {
	Frequency1: number
	Frequency2: number
	Level: number
	Waveform: OcaWaveformType
	SweepType: OcaSweepType
	SweepTime: number
	SweepRepeat: boolean
	Generating: boolean
}

export interface OcaSignalInputProperties extends OcaActuatorProperties {}
export interface OcaSignalOutputProperties extends OcaActuatorProperties {}

export interface OcaTemperatureActuatorProperties extends OcaActuatorProperties {
	Temperature: number
}

export interface OcaIdentificationActuatorProperties extends OcaActuatorProperties {
	Active: boolean
}

export interface OcaSummingPointProperties extends OcaActuatorProperties {}

export interface OcaBasicActuatorProperties extends OcaActuatorProperties {}

export interface OcaBooleanActuatorProperties extends OcaBasicActuatorProperties {
	Setting: boolean
}

export interface OcaInt8ActuatorProperties extends OcaBasicActuatorProperties {
	Setting: number
}

export interface OcaInt16ActuatorProperties extends OcaBasicActuatorProperties {
	Setting: number
}

export interface OcaInt32ActuatorProperties extends OcaBasicActuatorProperties {
	Setting: number
}

export interface OcaInt64ActuatorProperties extends OcaBasicActuatorProperties {
	Setting: number
}

export interface OcaUint8ActuatorProperties extends OcaBasicActuatorProperties {
	Setting: number
}

export interface OcaUint16ActuatorProperties extends OcaBasicActuatorProperties {
	Setting: number
}

export interface OcaUint32ActuatorProperties extends OcaBasicActuatorProperties {
	Setting: number
}

export interface OcaUint64ActuatorProperties extends OcaBasicActuatorProperties {
	Setting: number
}

export interface OcaFloat32ActuatorProperties extends OcaBasicActuatorProperties {
	Setting: number
}

export interface OcaFloat64ActuatorProperties extends OcaBasicActuatorProperties {
	Setting: number
}

export interface OcaStringActuatorProperties extends OcaBasicActuatorProperties {
	Setting: string
	MaxLen: number
}

export interface OcaBitstringActuatorProperties extends OcaBasicActuatorProperties {
	NrBits: number
}

// Sensors

export interface OcaSensorProperties extends OcaWorkerProperties {
	ReadingState: OcaSensorReadingState
}

export interface OcaLevelSensorProperties extends OcaSensorProperties {
	Reading: number
}

export interface OcaAudioLevelSensorProperties extends OcaLevelSensorProperties {
	Law: OcaLevelMeterLaw
}

export interface OcaTimeIntervalSensorProperties extends OcaSensorProperties {
	Reading: number
}

export interface OcaFrequencySensorProperties extends OcaSensorProperties {
	Reading: number
}

export interface OcaTemperatureSensorProperties extends OcaSensorProperties {
	Reading: number
}

export interface OcaIdentificationSensorProperties extends OcaSensorProperties {}

export interface OcaVoltageSensorProperties extends OcaSensorProperties {
	Reading: number
}

export interface OcaCurrentSensorProperties extends OcaSensorProperties {
	Reading: number
}

export interface OcaImpedanceSensorProperties extends OcaSensorProperties {
	Reading: OcaImpedance
}

export interface OcaGainSensorProperties extends OcaSensorProperties {
	Reading: number
}

export interface OcaBasicSensorProperties extends OcaSensorProperties {}

export interface OcaBooleanSensorProperties extends OcaBasicSensorProperties {
	Reading: boolean
}

export interface OcaInt8SensorProperties extends OcaBasicSensorProperties {
	Reading: number
}

export interface OcaInt16SensorProperties extends OcaBasicSensorProperties {
	Reading: number
}

export interface OcaInt32SensorProperties extends OcaBasicSensorProperties {
	Reading: number
}

export interface OcaInt64SensorProperties extends OcaBasicSensorProperties {
	Reading: number
}

export interface OcaUint8SensorProperties extends OcaBasicSensorProperties {
	Reading: number
}

export interface OcaUint16SensorProperties extends OcaBasicSensorProperties {
	Reading: number
}

export interface OcaUint32SensorProperties extends OcaBasicSensorProperties {
	Reading: number
}

export interface OcaUint64SensorProperties extends OcaBasicSensorProperties {
	Reading: number
}

export interface OcaFloat32SensorProperties extends OcaBasicSensorProperties {
	Reading: number
}

export interface OcaFloat64SensorProperties extends OcaBasicSensorProperties {
	Reading: number
}

export interface OcaStringSensorProperties extends OcaBasicSensorProperties {
	Reading: string
}

export interface OcaBitstringSensorProperties extends OcaBasicSensorProperties {
	NrBits: number
}

// Structural workers

export interface OcaBlockProperties extends OcaWorkerProperties {
	Type: number
	Members: OcaObjectIdentification[]
	SignalPaths: Map<number, OcaSignalPath>
	MostRecentParamSetIdentifier: OcaLibVolIdentifier
	GlobalType: OcaGlobalTypeIdentifier
	ONoMap: Map<number, number>
}

export interface OcaBlockFactoryProperties extends OcaWorkerProperties {}

export interface OcaMatrixProperties extends OcaWorkerProperties {
	X: number
	Y: number
	xSize: number
	ySize: number
	Members: number[][]
	Proxy: number
	PortsPerRow: number
	PortsPerColumn: number
}

// Agents

export interface OcaAgentProperties extends OcaRootProperties {
	Label: string
	Owner: number
}

export interface OcaGrouperProperties extends OcaAgentProperties {
	Mode: OcaGrouperMode
}

export interface OcaRamperProperties extends OcaAgentProperties {
	State: OcaRamperState
	RampedProperty: OcaProperty
	TimeMode: OcaTimeMode
	StartTime: OcaTimePTP
	Duration: number
	InterpolationLaw: OcaRamperInterpolationLaw
	Goal: number
}

export interface OcaNumericObserverProperties extends OcaAgentProperties {
	State: OcaObserverState
	ObservedProperty: OcaProperty
	Threshold: number
	Operator: OcaRelationalOperator
	Twosided: boolean
	Hysteresis: number
	Period: number
}

export interface OcaNumericObserverListProperties extends OcaAgentProperties {
	State: OcaObserverState
	ObservedProperties: OcaProperty[]
	Threshold: number
	Operator: OcaRelationalOperator
	Twosided: boolean
	Hysteresis: number
	Period: number
}

export interface OcaPowerSupplyProperties extends OcaAgentProperties {
	Type: OcaPowerSupplyType
	ModelInfo: string
	State: OcaPowerSupplyState
	Charging: boolean
	LoadFractionAvailable: number
	StorageFractionAvailable: number
	Location: OcaPowerSupplyLocation
}

export interface OcaMediaClock3Properties extends OcaAgentProperties {
	Availability: OcaMediaClockAvailability
	TimeSourceONo: number
	Offset: OcaTimePTP
	CurrentRate: OcaMediaClockRate
	SupportedRates: Map<number, OcaMediaClockRate[]>
}

export interface OcaTimeSourceProperties extends OcaAgentProperties {
	Availability: OcaTimeSourceAvailability
	Protocol: OcaTimeProtocol
	Parameters: string
	ReferenceType: OcaTimeReferenceType
	ReferenceID: string
	SyncStatus: OcaTimeSourceSyncStatus
}

export interface OcaPhysicalPositionProperties extends OcaAgentProperties {
	CoordinateSystem: OcaPositionCoordinateSystem
	PositionDescriptorFieldFlags: number
	Position: OcaPositionDescriptor
}

// Networks (ApplicationNetwork branch)

export interface OcaApplicationNetworkProperties extends OcaRootProperties {
	Label: string
	Owner: number
	ServiceID: Uint8Array
	SystemInterfaces: OcaNetworkSystemInterfaceDescriptor[]
	State: OcaApplicationNetworkState
	ErrorCode: number
}

export interface OcaControlNetworkProperties extends OcaApplicationNetworkProperties {
	Protocol: OcaNetworkControlProtocol
}

export interface OcaMediaTransportNetworkProperties extends OcaApplicationNetworkProperties {
	Protocol: OcaNetworkMediaProtocol
	Ports: OcaPort[]
	MaxSourceConnectors: number
	MaxSinkConnectors: number
	MaxPinsPerConnector: number
	AlignmentLevel: number
	AlignmentGain: number
}

// Managers

export interface OcaManagerProperties extends OcaRootProperties {}

export interface OcaDeviceManagerProperties extends OcaManagerProperties {
	OcaVersion: number
	ModelGUID: OcaModelGUID
	SerialNumber: string
	DeviceName: string
	SoftwareVersion: OcaVersion[]
	DeviceRole: string
	UserInventoryCode: string
	Enabled: boolean
	State: OcaDeviceState
	Busy: boolean
	ResetCause: OcaResetCause
	Message: string
	Managers: OcaManagerDescriptor[]
	DeviceRevisionID: string
}

export interface OcaSecurityManagerProperties extends OcaManagerProperties {
	SecureControlData: boolean
}

export interface OcaFirmwareManagerProperties extends OcaManagerProperties {
	ComponentVersions: OcaVersion[]
}

export interface OcaSubscriptionManagerProperties extends OcaManagerProperties {
	State: OcaSubscriptionManagerState
}

export interface OcaPowerManagerProperties extends OcaManagerProperties {
	State: OcaPowerState
	PowerSupplies: number[]
	ActivePowerSupplies: number[]
	AutoState: boolean
	TargetState: OcaPowerState
}

export interface OcaNetworkManagerProperties extends OcaManagerProperties {
	Networks: number[]
	StreamNetworks: number[]
	ControlNetworks: number[]
	MediaTransportNetworks: number[]
}

export interface OcaMediaClockManagerProperties extends OcaManagerProperties {
	Clocks: number[]
	Clock3s: number[]
}

export interface OcaLibraryManagerProperties extends OcaManagerProperties {
	Libraries: OcaLibraryIdentifier[]
}

export interface OcaAudioProcessingManagerProperties extends OcaManagerProperties {}

export interface OcaDeviceTimeManagerProperties extends OcaManagerProperties {
	TimeSources: number[]
	CurrentDeviceTimeSource: number
}

export interface OcaTaskManagerProperties extends OcaManagerProperties {
	State: OcaTaskManagerState
	Tasks: Map<number, OcaTask>
}

export interface OcaCodingManagerProperties extends OcaManagerProperties {
	AvailableEncodingSchemes: Map<number, string>
	AvailableDecodingSchemes: Map<number, string>
}

export interface OcaDiagnosticManagerProperties extends OcaManagerProperties {}

// Deprecated v1 classes

export interface OcaNetworkProperties extends OcaRootProperties {
	LinkType: OcaNetworkLinkType
	IdAdvertised: Uint8Array
	ControlProtocol: OcaNetworkControlProtocol
	MediaProtocol: OcaNetworkMediaProtocol
	Status: OcaNetworkStatus
	Statistics: OcaNetworkStatistics
	SystemInterfaces: OcaNetworkSystemInterfaceDescriptor[]
}

export interface OcaMediaClockProperties extends OcaRootProperties {
	Type: OcaMediaClockType
	DomainID: number
	SupportedRates: OcaMediaClockRate[]
	Rate: OcaMediaClockRate
	LockState: OcaMediaClockLockState
}

export interface OcaStreamNetworkProperties extends OcaRootProperties {
	ControlProtocol: OcaNetworkControlProtocol
	IdAdvertised: Uint8Array
	LinkType: OcaNetworkLinkType
	MediaProtocol: OcaNetworkMediaProtocol
	SignalChannelsSink: number[]
	SignalChannelsSource: number[]
	Statistics: OcaNetworkStatistics
	Status: OcaNetworkStatus
	StreamConnectors: number[]
	SystemInterfaces: OcaNetworkSystemInterfaceDescriptor[]
}

export interface OcaStreamConnectorProperties extends OcaRootProperties {
	IDAdvertised: OcaStreamConnectorIdentification
	OwnerNetwork: number
	Pins: Map<number, number>
	Status: OcaStreamConnectorStatus
	Streams: Map<number, OcaStream>
}

export interface OcaNetworkSignalChannelProperties extends OcaRootProperties {
	ConnectorPins: Map<number, number>
	IDAdvertised: Uint8Array
	Network: number
	RemoteChannelID: Uint8Array
	SourceOrSink: OcaNetworkMediaSourceOrSink
	Status: OcaNetworkSignalChannelStatus
}

// ---------------------------------------------------------------------------
// Module augmentation
// ---------------------------------------------------------------------------

declare module 'aes70/src/controller/object_base' {
	interface ObjectBase {
		readonly ClassName: string
		readonly ClassID: OcaClassID
		readonly ClassVersion: number
		readonly ObjectNumber: number

		GetPropertyID(name: string): OcaPropertyID
		GetPropertyName(id: OcaPropertyID): string
		GetPropertySync(): PropertySync<Record<string, unknown>>
		get_properties(): Properties
	}
}

export interface OcaPropertyID {
	readonly DefLevel: number
	readonly PropIndex: number
}

/** Returned by GetPropertySync(). */
export interface PropertySync<T extends OcaRootProperties = OcaRootProperties> {
	sync(): Promise<void>
	forEach<K extends keyof T & string>(callback: (value: T[K], name: K) => void): void
	Dispose(): void
}

/** Returned by get_properties(). */
export interface Properties {
	forEach(callback: (value: unknown, name: string) => void): void
	Dispose(): void
}

declare module 'aes70/src/controller/ControlClasses' {
	// -------------------------------------------------------------------------
	// OcaRoot
	// -------------------------------------------------------------------------
	interface OcaRoot {
		GetPropertySync(): PropertySync<OcaRootProperties>
		/** Read-only local property: ClassID. */
		readonly ClassID: OcaClassID
		/** Read-only local property: ClassVersion. */
		readonly ClassVersion: number
		/** Read-only local property: ObjectNumber. */
		readonly ObjectNumber: number
		/** Read-only local property: Lockable. */
		readonly Lockable: boolean
		/** Read-only local property: Role. */
		readonly Role: string

		/** General property-changed event. */
		readonly OnPropertyChanged: PropertyEvent<unknown>

		GetClassIdentification(): Promise<OcaClassIdentification>
		GetLockable(): Promise<boolean>
		GetRole(): Promise<string>
		LockReadonly(): Promise<void>
		LockTotal(): Promise<void>
		Unlock(): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaWorker
	// -------------------------------------------------------------------------
	interface OcaWorker {
		GetPropertySync(): PropertySync<OcaWorkerProperties>
		readonly OnEnabledChanged: PropertyEvent<boolean>
		readonly OnLabelChanged: PropertyEvent<string>
		readonly OnLatencyChanged: PropertyEvent<number>
		readonly OnOwnerChanged: PropertyEvent<number>
		readonly OnPortsChanged: PropertyEvent<OcaPort[]>

		AddPort(Label: string, Mode: OcaPortMode): Promise<OcaPortID>
		DeletePort(ID: OcaPortID): Promise<void>
		GetEnabled(): Promise<boolean>
		GetLabel(): Promise<string>
		GetLatency(): Promise<number>
		GetOwner(): Promise<number>
		/** Returns [NamePath, ONoPath]. */
		GetPath(): Promise<Arguments<[string[], number[]]>>
		GetPortName(PortID: OcaPortID): Promise<string>
		GetPorts(): Promise<OcaPort[]>
		SetEnabled(enabled: boolean): Promise<void>
		SetLabel(label: string): Promise<void>
		SetLatency(latency: number): Promise<void>
		SetPortName(PortID: OcaPortID, Name: string): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaSensor
	// -------------------------------------------------------------------------
	interface OcaSensor {
		GetPropertySync(): PropertySync<OcaSensorProperties>
		readonly OnReadingStateChanged: PropertyEvent<OcaSensorReadingState>
		GetReadingState(): Promise<OcaSensorReadingState>
	}

	// -------------------------------------------------------------------------
	// OcaLevelSensor
	// -------------------------------------------------------------------------
	interface OcaLevelSensor {
		GetPropertySync(): PropertySync<OcaLevelSensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}

	// -------------------------------------------------------------------------
	// OcaAudioLevelSensor
	// -------------------------------------------------------------------------
	interface OcaAudioLevelSensor {
		GetPropertySync(): PropertySync<OcaAudioLevelSensorProperties>
		readonly OnLawChanged: PropertyEvent<OcaLevelMeterLaw>
		GetLaw(): Promise<OcaLevelMeterLaw>
		SetLaw(Law: OcaLevelMeterLaw): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaTimeIntervalSensor
	// -------------------------------------------------------------------------
	interface OcaTimeIntervalSensor {
		GetPropertySync(): PropertySync<OcaTimeIntervalSensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}

	// -------------------------------------------------------------------------
	// OcaFrequencySensor
	// -------------------------------------------------------------------------
	interface OcaFrequencySensor {
		GetPropertySync(): PropertySync<OcaFrequencySensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}

	// -------------------------------------------------------------------------
	// OcaTemperatureSensor
	// -------------------------------------------------------------------------
	interface OcaTemperatureSensor {
		GetPropertySync(): PropertySync<OcaTemperatureSensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}

	// -------------------------------------------------------------------------
	// OcaVoltageSensor
	// -------------------------------------------------------------------------
	interface OcaVoltageSensor {
		GetPropertySync(): PropertySync<OcaVoltageSensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}

	// -------------------------------------------------------------------------
	// OcaCurrentSensor
	// -------------------------------------------------------------------------
	interface OcaCurrentSensor {
		GetPropertySync(): PropertySync<OcaCurrentSensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}

	// -------------------------------------------------------------------------
	// OcaImpedanceSensor
	// -------------------------------------------------------------------------
	interface OcaImpedanceSensor {
		GetPropertySync(): PropertySync<OcaImpedanceSensorProperties>
		readonly OnReadingChanged: PropertyEvent<OcaImpedance>
		GetReading(): Promise<Arguments<[OcaImpedance, OcaImpedance, OcaImpedance]>>
	}

	// -------------------------------------------------------------------------
	// OcaGainSensor
	// -------------------------------------------------------------------------
	interface OcaGainSensor {
		GetPropertySync(): PropertySync<OcaGainSensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}

	// -------------------------------------------------------------------------
	// Basic sensors (boolean, int, uint, float)
	// -------------------------------------------------------------------------
	interface OcaBooleanSensor {
		GetPropertySync(): PropertySync<OcaBooleanSensorProperties>
		readonly OnReadingChanged: PropertyEvent<boolean>
		GetReading(): Promise<boolean>
	}

	interface OcaInt8Sensor {
		GetPropertySync(): PropertySync<OcaInt8SensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}
	interface OcaInt16Sensor {
		GetPropertySync(): PropertySync<OcaInt16SensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}
	interface OcaInt32Sensor {
		GetPropertySync(): PropertySync<OcaInt32SensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}
	interface OcaInt64Sensor {
		GetPropertySync(): PropertySync<OcaInt64SensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}
	interface OcaUint8Sensor {
		GetPropertySync(): PropertySync<OcaUint8SensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}
	interface OcaUint16Sensor {
		GetPropertySync(): PropertySync<OcaUint16SensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}
	interface OcaUint32Sensor {
		GetPropertySync(): PropertySync<OcaUint32SensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}
	interface OcaUint64Sensor {
		GetPropertySync(): PropertySync<OcaUint64SensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}
	interface OcaFloat32Sensor {
		GetPropertySync(): PropertySync<OcaFloat32SensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}
	interface OcaFloat64Sensor {
		GetPropertySync(): PropertySync<OcaFloat64SensorProperties>
		readonly OnReadingChanged: PropertyEvent<number>
		GetReading(): Promise<Arguments<[number, number, number]>>
	}
	interface OcaStringSensor {
		GetPropertySync(): PropertySync<OcaStringSensorProperties>
		readonly OnReadingChanged: PropertyEvent<string>
		GetReading(): Promise<Arguments<[string, number]>>
	}
	interface OcaBitstringSensor {
		GetPropertySync(): PropertySync<OcaBitstringSensorProperties>
		readonly OnReadingChanged: PropertyEvent<number[]>
		GetNrBits(): Promise<number>
		GetBit(bitNr: number): Promise<number>
	}

	// -------------------------------------------------------------------------
	// OcaIdentificationSensor
	// -------------------------------------------------------------------------
	interface OcaIdentificationSensor {
		GetPropertySync(): PropertySync<OcaIdentificationSensorProperties>
		readonly OnStarted: Event
	}

	// -------------------------------------------------------------------------
	// OcaActuator (base — no methods beyond OcaWorker)
	// -------------------------------------------------------------------------
	interface OcaActuator {
		GetPropertySync(): PropertySync<OcaActuatorProperties>
	}

	// -------------------------------------------------------------------------
	// OcaBasicActuator (base — no methods beyond OcaActuator)
	// -------------------------------------------------------------------------
	interface OcaBasicActuator {
		GetPropertySync(): PropertySync<OcaBasicActuatorProperties>
	}

	// -------------------------------------------------------------------------
	// OcaBasicSensor (base — no methods beyond OcaSensor)
	// -------------------------------------------------------------------------
	interface OcaBasicSensor {
		GetPropertySync(): PropertySync<OcaBasicSensorProperties>
	}

	// -------------------------------------------------------------------------
	// OcaSignalInput / OcaSignalOutput / OcaSummingPoint
	// -------------------------------------------------------------------------
	interface OcaSignalInput {
		GetPropertySync(): PropertySync<OcaSignalInputProperties>
	}

	interface OcaSignalOutput {
		GetPropertySync(): PropertySync<OcaSignalOutputProperties>
	}

	interface OcaSummingPoint {
		GetPropertySync(): PropertySync<OcaSummingPointProperties>
	}

	// -------------------------------------------------------------------------
	// OcaBlockFactory
	// -------------------------------------------------------------------------
	interface OcaBlockFactoryAgent {
		GetPropertySync(): PropertySync<OcaBlockFactoryProperties>
	}

	// -------------------------------------------------------------------------
	// OcaMute
	// -------------------------------------------------------------------------
	interface OcaMute {
		GetPropertySync(): PropertySync<OcaMuteProperties>
		readonly OnStateChanged: PropertyEvent<OcaMuteState>
		GetState(): Promise<OcaMuteState>
		SetState(state: OcaMuteState): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaPolarity
	// -------------------------------------------------------------------------
	interface OcaPolarity {
		GetPropertySync(): PropertySync<OcaPolarityProperties>
		readonly OnStateChanged: PropertyEvent<OcaPolarityState>
		GetState(): Promise<OcaPolarityState>
		SetState(state: OcaPolarityState): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaSwitch
	// -------------------------------------------------------------------------
	interface OcaSwitch {
		GetPropertySync(): PropertySync<OcaSwitchProperties>
		readonly OnPositionChanged: PropertyEvent<number>
		readonly OnPositionNamesChanged: PropertyEvent<string[]>
		readonly OnPositionEnabledsChanged: PropertyEvent<boolean[]>
		GetPosition(): Promise<Arguments<[number, number, number]>>
		SetPosition(position: number): Promise<void>
		GetPositionName(Index: number): Promise<string>
		SetPositionName(Index: number, Name: string): Promise<void>
		GetPositionNames(): Promise<string[]>
		SetPositionNames(Names: string[]): Promise<void>
		GetPositionEnabled(Index: number): Promise<boolean>
		SetPositionEnabled(Index: number, enabled: boolean): Promise<void>
		GetPositionEnableds(): Promise<boolean[]>
		SetPositionEnableds(Enableds: boolean[]): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaGain
	// -------------------------------------------------------------------------
	interface OcaGain {
		GetPropertySync(): PropertySync<OcaGainProperties>
		readonly OnGainChanged: PropertyEvent<number>
		/** Returns [Gain, minGain, maxGain]. */
		GetGain(): Promise<Arguments<[number, number, number]>>
		SetGain(Gain: number): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaPanBalance
	// -------------------------------------------------------------------------
	interface OcaPanBalance {
		GetPropertySync(): PropertySync<OcaPanBalanceProperties>
		readonly OnPositionChanged: PropertyEvent<number>
		readonly OnMidpointChanged: PropertyEvent<number>
		/** Returns [Position, minPosition, maxPosition]. */
		GetPosition(): Promise<Arguments<[number, number, number]>>
		SetPosition(Position: number): Promise<void>
		GetMidpoint(): Promise<Arguments<[number, number, number]>>
		SetMidpoint(Midpoint: number): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaDelay
	// -------------------------------------------------------------------------
	interface OcaDelay {
		GetPropertySync(): PropertySync<OcaDelayProperties>
		readonly OnDelayTimeChanged: PropertyEvent<number>
		/** Returns [DelayTime, minDelayTime, maxDelayTime]. */
		GetDelayTime(): Promise<Arguments<[number, number, number]>>
		SetDelayTime(DelayTime: number): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaDelayExtended
	// -------------------------------------------------------------------------
	interface OcaDelayExtended {
		GetPropertySync(): PropertySync<OcaDelayExtendedProperties>
		readonly OnDelayValueChanged: PropertyEvent<OcaDelayValue>
		/** Returns [DelayValue, minDelayValue, maxDelayValue]. */
		GetDelayValue(): Promise<Arguments<[OcaDelayValue, OcaDelayValue, OcaDelayValue]>>
		SetDelayValue(DelayValue: OcaDelayValue): Promise<void>
		ConvertDelay(Value: OcaDelayValue, UnitToConvertTo: OcaDelayUnit): Promise<OcaDelayValue>
	}

	// -------------------------------------------------------------------------
	// OcaFrequencyActuator
	// -------------------------------------------------------------------------
	interface OcaFrequencyActuator {
		GetPropertySync(): PropertySync<OcaFrequencyActuatorProperties>
		readonly OnFrequencyChanged: PropertyEvent<number>
		GetFrequency(): Promise<Arguments<[number, number, number]>>
		SetFrequency(Frequency: number): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaFilterClassical
	// -------------------------------------------------------------------------
	interface OcaFilterClassical {
		GetPropertySync(): PropertySync<OcaFilterClassicalProperties>
		readonly OnFrequencyChanged: PropertyEvent<number>
		readonly OnPassbandChanged: PropertyEvent<OcaFilterPassband>
		readonly OnShapeChanged: PropertyEvent<OcaClassicalFilterShape>
		readonly OnOrderChanged: PropertyEvent<number>
		readonly OnParameterChanged: PropertyEvent<number>
		GetFrequency(): Promise<Arguments<[number, number, number]>>
		SetFrequency(Frequency: number): Promise<void>
		GetPassband(): Promise<OcaFilterPassband>
		SetPassband(Passband: OcaFilterPassband): Promise<void>
		GetShape(): Promise<OcaClassicalFilterShape>
		SetShape(Shape: OcaClassicalFilterShape): Promise<void>
		GetOrder(): Promise<Arguments<[number, number, number]>>
		SetOrder(Order: number): Promise<void>
		GetParameter(): Promise<Arguments<[number, number, number]>>
		SetParameter(Parameter: number): Promise<void>
		SetMultiple(
			Mask: number,
			Frequency: number,
			Passband: OcaFilterPassband,
			Shape: OcaClassicalFilterShape,
			Order: number,
			Parameter: number,
		): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaFilterParametric
	// -------------------------------------------------------------------------
	interface OcaFilterParametric {
		GetPropertySync(): PropertySync<OcaFilterParametricProperties>
		readonly OnFrequencyChanged: PropertyEvent<number>
		readonly OnShapeChanged: PropertyEvent<OcaParametricEQShape>
		readonly OnWidthParameterChanged: PropertyEvent<number>
		readonly OnInBandGainChanged: PropertyEvent<number>
		readonly OnShapeParameterChanged: PropertyEvent<number>
		GetFrequency(): Promise<Arguments<[number, number, number]>>
		SetFrequency(Frequency: number): Promise<void>
		GetShape(): Promise<OcaParametricEQShape>
		SetShape(Shape: OcaParametricEQShape): Promise<void>
		GetWidthParameter(): Promise<Arguments<[number, number, number]>>
		SetWidthParameter(WidthParameter: number): Promise<void>
		GetInBandGain(): Promise<Arguments<[number, number, number]>>
		SetInBandgain(inBandGain: number): Promise<void>
		GetShapeParameter(): Promise<Arguments<[number, number, number]>>
		SetShapeParameter(ShapeParameter: number): Promise<void>
		SetMultiple(
			Mask: number,
			Frequency: number,
			Shape: OcaParametricEQShape,
			WidthParameter: number,
			InBandGain: number,
			ShapeParameter: number,
		): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaFilterPolynomial
	// -------------------------------------------------------------------------
	interface OcaFilterPolynomial {
		GetPropertySync(): PropertySync<OcaFilterPolynomialProperties>
		readonly OnAChanged: PropertyEvent<number[]>
		readonly OnBChanged: PropertyEvent<number[]>
		readonly OnSampleRateChanged: PropertyEvent<number>
		GetCoefficients(): Promise<Arguments<[number[], number[], number, number]>>
		SetCoefficients(A: number[], B: number[], SampleRate: number): Promise<void>
		GetSampleRate(): Promise<Arguments<[number, number, number]>>
		SetSampleRate(SampleRate: number): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaFilterFIR
	// -------------------------------------------------------------------------
	interface OcaFilterFIR {
		GetPropertySync(): PropertySync<OcaFilterFIRProperties>
		readonly OnLengthChanged: PropertyEvent<number>
		readonly OnCoefficientsChanged: PropertyEvent<number[]>
		readonly OnSampleRateChanged: PropertyEvent<number>
		GetLength(): Promise<Arguments<[number, number, number]>>
		GetCoefficients(): Promise<number[]>
		SetCoefficients(Coefficients: number[]): Promise<void>
		GetSampleRate(): Promise<Arguments<[number, number, number]>>
		SetSampleRate(SampleRate: number): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaFilterArbitraryCurve
	// -------------------------------------------------------------------------
	interface OcaFilterArbitraryCurve {
		GetPropertySync(): PropertySync<OcaFilterArbitraryCurveProperties>
		readonly OnTransferFunctionChanged: PropertyEvent<OcaTransferFunction>
		readonly OnSampleRateChanged: PropertyEvent<number>
		readonly OnTFMinLengthChanged: PropertyEvent<number>
		readonly OnTFMaxLengthChanged: PropertyEvent<number>
		GetTransferFunction(): Promise<OcaTransferFunction>
		SetTransferFunction(TransferFunction: OcaTransferFunction): Promise<void>
		GetSampleRate(): Promise<Arguments<[number, number, number]>>
		SetSampleRate(SampleRate: number): Promise<void>
		GetTFMinLength(): Promise<number>
		GetTFMaxLength(): Promise<number>
	}

	// -------------------------------------------------------------------------
	// OcaDynamics
	// -------------------------------------------------------------------------
	interface OcaDynamics {
		GetPropertySync(): PropertySync<OcaDynamicsProperties>
		readonly OnFunctionChanged: PropertyEvent<OcaDynamicsFunction>
		readonly OnRatioChanged: PropertyEvent<number>
		readonly OnThresholdChanged: PropertyEvent<number>
		readonly OnThresholdPresentationUnitsChanged: PropertyEvent<OcaPresentationUnit>
		readonly OnDetectorLawChanged: PropertyEvent<OcaLevelDetectionLaw>
		readonly OnAttackTimeChanged: PropertyEvent<number>
		readonly OnReleaseTimeChanged: PropertyEvent<number>
		readonly OnHoldTimeChanged: PropertyEvent<number>
		readonly OnDynamicGainFloorChanged: PropertyEvent<number>
		readonly OnDynamicGainCeilingChanged: PropertyEvent<number>
		readonly OnKneeLowerChanged: PropertyEvent<number>
		readonly OnKneeUpperChanged: PropertyEvent<number>
		readonly OnDynamicGainChanged: PropertyEvent<number>
		GetFunction(): Promise<OcaDynamicsFunction>
		SetFunction(Func: OcaDynamicsFunction): Promise<void>
		GetRatio(): Promise<Arguments<[number, number, number]>>
		SetRatio(Ratio: number): Promise<void>
		GetThreshold(): Promise<Arguments<[number, number, number]>>
		SetThreshold(Threshold: number, PresentationUnits: OcaPresentationUnit): Promise<void>
		GetThresholdPresentationUnits(): Promise<OcaPresentationUnit>
		SetThresholdPresentationUnits(Units: OcaPresentationUnit): Promise<void>
		GetDetectorLaw(): Promise<OcaLevelDetectionLaw>
		SetDetectorLaw(Law: OcaLevelDetectionLaw): Promise<void>
		GetAttackTime(): Promise<Arguments<[number, number, number]>>
		SetAttackTime(AttackTime: number): Promise<void>
		GetReleaseTime(): Promise<Arguments<[number, number, number]>>
		SetReleaseTime(ReleaseTime: number): Promise<void>
		GetHoldTime(): Promise<Arguments<[number, number, number]>>
		SetHoldTime(HoldTime: number): Promise<void>
		GetDynamicGainFloor(): Promise<Arguments<[number, number, number]>>
		SetDynamicGainFloor(Ceiling: number): Promise<void>
		GetDynamicGainCeiling(): Promise<Arguments<[number, number, number]>>
		SetDynamicGainCeiling(Ceiling: number): Promise<void>
		GetKneeLower(): Promise<Arguments<[number, number, number]>>
		SetKneeLower(KneeLower: number): Promise<void>
		GetKneeUpper(): Promise<Arguments<[number, number, number]>>
		SetKneeUpper(KneeUpper: number): Promise<void>
		GetDynamicGain(): Promise<Arguments<[number, number, number]>>
		SetMultiple(
			Mask: number,
			Function: OcaDynamicsFunction,
			Ratio: number,
			Threshold: number,
			ThresholdPresentationUnits: OcaPresentationUnit,
			DetectorLaw: OcaLevelDetectionLaw,
			AttackTime: number,
			ReleaseTime: number,
			HoldTime: number,
			DynamicGainFloor: number,
			DynamicGainCeiling: number,
			KneeLower: number,
			KneeUpper: number,
		): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaDynamicsDetector
	// -------------------------------------------------------------------------
	interface OcaDynamicsDetector {
		GetPropertySync(): PropertySync<OcaDynamicsDetectorProperties>
		readonly OnLawChanged: PropertyEvent<OcaLevelDetectionLaw>
		readonly OnAttackTimeChanged: PropertyEvent<number>
		readonly OnReleaseTimeChanged: PropertyEvent<number>
		readonly OnHoldTimeChanged: PropertyEvent<number>
		GetLaw(): Promise<OcaLevelDetectionLaw>
		SetLaw(Law: OcaLevelDetectionLaw): Promise<void>
		GetAttackTime(): Promise<Arguments<[number, number, number]>>
		SetAttackTime(AttackTime: number): Promise<void>
		GetReleaseTime(): Promise<Arguments<[number, number, number]>>
		SetReleaseTime(ReleaseTime: number): Promise<void>
		GetHoldTime(): Promise<Arguments<[number, number, number]>>
		SetHoldTime(HoldTime: number): Promise<void>
		SetMultiple(
			Mask: number,
			Law: OcaLevelDetectionLaw,
			AttackTime: number,
			ReleaseTime: number,
			HoldTime: number,
		): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaDynamicsCurve
	// -------------------------------------------------------------------------
	interface OcaDynamicsCurve {
		GetPropertySync(): PropertySync<OcaDynamicsCurveProperties>
		readonly OnNSegmentsChanged: PropertyEvent<number>
		readonly OnThresholdChanged: PropertyEvent<number[]>
		readonly OnSlopeChanged: PropertyEvent<number[]>
		readonly OnKneeParameterChanged: PropertyEvent<number[]>
		readonly OnDynamicGainFloorChanged: PropertyEvent<number>
		readonly OnDynamicGainCeilingChanged: PropertyEvent<number>
		GetNSegments(): Promise<Arguments<[number, number, number]>>
		SetNSegments(Depth: number): Promise<void>
		GetThreshold(): Promise<Arguments<[number[], number, number]>>
		SetThreshold(Threshold: number[]): Promise<void>
		GetSlope(): Promise<Arguments<[number[], number, number]>>
		SetSlope(Slope: number[]): Promise<void>
		GetKneeParameter(): Promise<Arguments<[number[], number, number]>>
		SetKneeParameter(KneeParameter: number[]): Promise<void>
		GetDynamicGainFloor(): Promise<Arguments<[number, number, number]>>
		SetDynamicGainFloor(Limit: number): Promise<void>
		GetDynamicGainCeiling(): Promise<Arguments<[number, number, number]>>
		SetDynamicGainCeiling(Limit: number): Promise<void>
		SetMultiple(
			Mask: number,
			NSegments: number,
			Threshold: number[],
			Slope: number[],
			KneeParameter: number[],
			DynamicGainFloor: number,
			DynamicGainCeiling: number,
		): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaSignalGenerator
	// -------------------------------------------------------------------------
	interface OcaSignalGenerator {
		GetPropertySync(): PropertySync<OcaSignalGeneratorProperties>
		readonly OnFrequency1Changed: PropertyEvent<number>
		readonly OnFrequency2Changed: PropertyEvent<number>
		readonly OnLevelChanged: PropertyEvent<number>
		readonly OnWaveformChanged: PropertyEvent<OcaWaveformType>
		readonly OnSweepTypeChanged: PropertyEvent<OcaSweepType>
		readonly OnSweepTimeChanged: PropertyEvent<number>
		readonly OnSweepRepeatChanged: PropertyEvent<boolean>
		readonly OnGeneratingChanged: PropertyEvent<boolean>
		GetFrequency1(): Promise<Arguments<[number, number, number]>>
		SetFrequency1(frequency: number): Promise<void>
		GetFrequency2(): Promise<Arguments<[number, number, number]>>
		SetFrequency2(frequency: number): Promise<void>
		GetLevel(): Promise<Arguments<[number, number, number]>>
		SetLevel(Level: number): Promise<void>
		GetWaveform(): Promise<OcaWaveformType>
		SetWaveform(Waveform: OcaWaveformType): Promise<void>
		GetSweepType(): Promise<OcaSweepType>
		SetSweepType(SweepType: OcaSweepType): Promise<void>
		GetSweepTime(): Promise<Arguments<[number, number, number]>>
		SetSweepTime(SweepTime: number): Promise<void>
		GetSweepRepeat(): Promise<boolean>
		SetSweepRepeat(SweepRepeat: boolean): Promise<void>
		GetGenerating(): Promise<boolean>
		Start(): Promise<void>
		Stop(): Promise<void>
		SetMultiple(
			Mask: number,
			Frequency1: number,
			Frequency2: number,
			Level: number,
			Waveform: OcaWaveformType,
			SweepType: OcaSweepType,
			SweepTime: number,
			SweepRepeat: boolean,
			Generating: boolean,
		): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaTemperatureActuator
	// -------------------------------------------------------------------------
	interface OcaTemperatureActuator {
		GetPropertySync(): PropertySync<OcaTemperatureActuatorProperties>
		readonly OnTemperatureChanged: PropertyEvent<number>
		GetTemperature(): Promise<Arguments<[number, number, number]>>
		SetTemperature(temperature: number): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaIdentificationActuator
	// -------------------------------------------------------------------------
	interface OcaIdentificationActuator {
		GetPropertySync(): PropertySync<OcaIdentificationActuatorProperties>
		readonly OnActiveChanged: PropertyEvent<boolean>
		GetActive(): Promise<boolean>
		SetActive(active: boolean): Promise<void>
	}

	// -------------------------------------------------------------------------
	// Basic actuators
	// -------------------------------------------------------------------------
	interface OcaBooleanActuator {
		GetPropertySync(): PropertySync<OcaBooleanActuatorProperties>
		readonly OnSettingChanged: PropertyEvent<boolean>
		GetSetting(): Promise<boolean>
		SetSetting(Setting: boolean): Promise<void>
	}

	interface OcaInt8Actuator {
		GetPropertySync(): PropertySync<OcaInt8ActuatorProperties>
		readonly OnSettingChanged: PropertyEvent<number>
		GetSetting(): Promise<Arguments<[number, number, number]>>
		SetSetting(Setting: number): Promise<void>
	}
	interface OcaInt16Actuator {
		GetPropertySync(): PropertySync<OcaInt16ActuatorProperties>
		readonly OnSettingChanged: PropertyEvent<number>
		GetSetting(): Promise<Arguments<[number, number, number]>>
		SetSetting(Setting: number): Promise<void>
	}
	interface OcaInt32Actuator {
		GetPropertySync(): PropertySync<OcaInt32ActuatorProperties>
		readonly OnSettingChanged: PropertyEvent<number>
		GetSetting(): Promise<Arguments<[number, number, number]>>
		SetSetting(Setting: number): Promise<void>
	}
	interface OcaInt64Actuator {
		GetPropertySync(): PropertySync<OcaInt64ActuatorProperties>
		readonly OnSettingChanged: PropertyEvent<number>
		GetSetting(): Promise<Arguments<[number, number, number]>>
		SetSetting(Setting: number): Promise<void>
	}
	interface OcaUint8Actuator {
		GetPropertySync(): PropertySync<OcaUint8ActuatorProperties>
		readonly OnSettingChanged: PropertyEvent<number>
		GetSetting(): Promise<Arguments<[number, number, number]>>
		SetSetting(Setting: number): Promise<void>
	}
	interface OcaUint16Actuator {
		GetPropertySync(): PropertySync<OcaUint16ActuatorProperties>
		readonly OnSettingChanged: PropertyEvent<number>
		GetSetting(): Promise<Arguments<[number, number, number]>>
		SetSetting(Setting: number): Promise<void>
	}
	interface OcaUint32Actuator {
		GetPropertySync(): PropertySync<OcaUint32ActuatorProperties>
		readonly OnSettingChanged: PropertyEvent<number>
		GetSetting(): Promise<Arguments<[number, number, number]>>
		SetSetting(Setting: number): Promise<void>
	}
	interface OcaUint64Actuator {
		GetPropertySync(): PropertySync<OcaUint64ActuatorProperties>
		readonly OnSettingChanged: PropertyEvent<number>
		GetSetting(): Promise<Arguments<[number, number, number]>>
		SetSetting(Setting: number): Promise<void>
	}
	interface OcaFloat32Actuator {
		GetPropertySync(): PropertySync<OcaFloat32ActuatorProperties>
		readonly OnSettingChanged: PropertyEvent<number>
		GetSetting(): Promise<Arguments<[number, number, number]>>
		SetSetting(Setting: number): Promise<void>
	}
	interface OcaFloat64Actuator {
		GetPropertySync(): PropertySync<OcaFloat64ActuatorProperties>
		readonly OnSettingChanged: PropertyEvent<number>
		GetSetting(): Promise<Arguments<[number, number, number]>>
		SetSetting(Setting: number): Promise<void>
	}
	interface OcaStringActuator {
		GetPropertySync(): PropertySync<OcaStringActuatorProperties>
		readonly OnSettingChanged: PropertyEvent<string>
		GetMaxLen(): Promise<number>
		GetSetting(): Promise<string>
		SetSetting(Setting: string): Promise<void>
	}
	interface OcaBitstringActuator {
		GetPropertySync(): PropertySync<OcaBitstringActuatorProperties>
		readonly OnSettingChanged: PropertyEvent<number[]>
		GetNrBits(): Promise<number>
		GetBit(bitNr: number): Promise<number>
		SetBit(bitNr: number, Value: number): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaBlock
	// -------------------------------------------------------------------------
	interface OcaBlock {
		GetPropertySync(): PropertySync<OcaBlockProperties>
		readonly OnMembersChanged: PropertyEvent<OcaObjectIdentification[]>
		readonly OnSignalPathsChanged: PropertyEvent<Map<number, OcaSignalPath>>
		readonly OnMostRecentParamSetIdentifierChanged: PropertyEvent<OcaLibVolIdentifier>
		readonly OnGlobalTypeChanged: PropertyEvent<OcaGlobalTypeIdentifier>
		readonly OnONoMapChanged: PropertyEvent<Map<number, number>>

		GetType(): Promise<number>
		ConstructMember(ClassID: number, ConstructionParameters: unknown[]): Promise<number>
		ConstructMemberUsingFactory(FactoryONo: number): Promise<number>
		DeleteMember(ObjectNumber: number): Promise<void>
		GetMembers(): Promise<OcaObjectIdentification[]>
		GetMembersRecursive(): Promise<OcaBlockMember[]>
		AddSignalPath(Path: OcaSignalPath): Promise<number>
		DeleteSignalPath(Index: number): Promise<void>
		GetSignalPaths(): Promise<Map<number, OcaSignalPath>>
		GetSignalPathsRecursive(): Promise<Map<number, OcaSignalPath>>
		GetMostRecentParamSetIdentifier(): Promise<OcaLibVolIdentifier>
		ApplyParamSet(): Promise<OcaLibVolIdentifier>
		GetCurrentParamSetData(): Promise<OcaLibVol>
		StoreCurrentParamSetData(LibVolIdentifier: OcaLibVolIdentifier): Promise<void>
		GetGlobalType(): Promise<OcaGlobalTypeIdentifier>
		GetONoMap(): Promise<Map<number, number>>
		FindObjectsByRole(
			SearchName: string,
			NameComparisonType: OcaStringComparisonType,
			SearchClassID: OcaClassID,
			ResultFlags: OcaObjectSearchResultFlags,
		): Promise<OcaObjectSearchResult[]>
		FindObjectsByRoleRecursive(
			SearchName: string,
			NameComparisonType: OcaStringComparisonType,
			SearchClassID: OcaClassID,
			ResultFlags: OcaObjectSearchResultFlags,
		): Promise<OcaObjectSearchResult[]>
		FindObjectsByLabelRecursive(
			SearchName: string,
			NameComparisonType: OcaStringComparisonType,
			SearchClassID: OcaClassID,
			ResultFlags: OcaObjectSearchResultFlags,
		): Promise<OcaObjectSearchResult[]>
		FindObjectsByPath(SearchPath: string[], ResultFlags: OcaObjectSearchResultFlags): Promise<OcaObjectSearchResult[]>
	}

	/** OcaGlobalTypeIdentifier as used by OcaBlock. */
	interface OcaGlobalTypeIdentifier {
		readonly Authority: OcaClassAuthorityID
		readonly ID: number
	}

	interface OcaClassAuthorityID {
		readonly Sentinel: number
		readonly OrganizationID: number[]
	}

	// -------------------------------------------------------------------------
	// OcaMatrix
	// -------------------------------------------------------------------------
	interface OcaMatrix {
		GetPropertySync(): PropertySync<OcaMatrixProperties>
		readonly OnXSizeChanged: PropertyEvent<number>
		readonly OnYSizeChanged: PropertyEvent<number>
		readonly OnMembersChanged: PropertyEvent<number[][]>
		readonly OnProxyChanged: PropertyEvent<number>
		readonly OnPortsPerRowChanged: PropertyEvent<number>
		readonly OnPortsPerColumnChanged: PropertyEvent<number>

		GetCurrentXY(): Promise<Arguments<[number, number]>>
		SetCurrentXY(x: number, y: number): Promise<void>
		GetSize(): Promise<Arguments<[number, number, number, number, number, number]>>
		SetSize(xSize: number, ySize: number): Promise<void>
		GetMembers(): Promise<number[][]>
		GetMembersRecursive(): Promise<OcaBlockMember[]>
		AddSignalPath(Path: OcaSignalPath): Promise<number>
		DeleteSignalPath(Index: number): Promise<void>
		GetSignalPaths(): Promise<Map<number, OcaSignalPath>>
		GetSignalPathsRecursive(): Promise<Map<number, OcaSignalPath>>
		GetProxy(): Promise<number>
		SetProxy(ONo: number): Promise<void>
		GetPortsPerRow(): Promise<number>
		SetPortsPerRow(Ports: number): Promise<void>
		GetPortsPerColumn(): Promise<number>
		SetPortsPerColumn(Ports: number): Promise<void>
		SetCurrentXYLock(x: number, y: number): Promise<void>
		UnlockCurrentXY(): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaAgent
	// -------------------------------------------------------------------------
	interface OcaAgent {
		GetPropertySync(): PropertySync<OcaAgentProperties>
		readonly OnLabelChanged: PropertyEvent<string>
		readonly OnOwnerChanged: PropertyEvent<number>
		GetLabel(): Promise<string>
		SetLabel(Label: string): Promise<void>
		GetOwner(): Promise<number>
		GetPath(): Promise<Arguments<[string[], number[]]>>
	}

	// -------------------------------------------------------------------------
	// OcaGrouper
	// -------------------------------------------------------------------------
	interface OcaGrouper {
		GetPropertySync(): PropertySync<OcaGrouperProperties>
		readonly OnModeChanged: PropertyEvent<OcaGrouperMode>
		readonly OnEnrollmentChanged: PropertyEvent<OcaGrouperEnrollment>
		AddGroup(Label: string): Promise<Arguments<[number, number]>>
		DeleteGroup(Index: number): Promise<void>
		GetGroupCount(): Promise<number>
		GetGroup(Index: number): Promise<OcaGrouperGroup>
		GetGroups(): Promise<OcaGrouperGroup[]>
		AddCitizen(Citizen: OcaGrouperCitizen, Index: number): Promise<number>
		DeleteCitizen(Index: number): Promise<void>
		GetCitizenCount(): Promise<number>
		GetCitizen(Index: number): Promise<OcaGrouperCitizen>
		GetCitizens(): Promise<OcaGrouperCitizen[]>
		GetEnrollment(Enrollment: OcaGrouperEnrollment): Promise<boolean>
		SetEnrollment(Enrollment: OcaGrouperEnrollment, IsMember: boolean): Promise<void>
		GetGroupMemberList(Index: number): Promise<OcaGrouperCitizen[]>
		GetActuatorOrSensor(): Promise<boolean>
		SetActuatorOrSensor(ActuatorOrSensor: boolean): Promise<void>
		GetMode(): Promise<OcaGrouperMode>
		SetMode(mode: OcaGrouperMode): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaRamper
	// -------------------------------------------------------------------------
	interface OcaRamper {
		GetPropertySync(): PropertySync<OcaRamperProperties>
		readonly OnStateChanged: PropertyEvent<OcaRamperState>
		readonly OnGoalChanged: PropertyEvent<number>
		readonly OnDurationChanged: PropertyEvent<number>
		readonly OnInterpolationLawChanged: PropertyEvent<OcaRamperInterpolationLaw>

		Control(Command: OcaRamperCommand): Promise<void>
		GetState(): Promise<OcaRamperState>
		GetRampedProperty(): Promise<OcaProperty>
		SetRampedProperty(Prop: OcaProperty): Promise<void>
		GetTimeMode(): Promise<OcaTimeMode>
		SetTimeMode(TimeMode: OcaTimeMode): Promise<void>
		GetStartTime(): Promise<OcaTimePTP>
		SetStartTime(TimeMode: OcaTimePTP): Promise<void>
		GetDuration(): Promise<Arguments<[number, number, number]>>
		SetDuration(Duration: number): Promise<void>
		GetInterpolationLaw(): Promise<OcaRamperInterpolationLaw>
		SetInterpolationLaw(Law: OcaRamperInterpolationLaw): Promise<void>
		GetGoal(): Promise<number>
		SetGoal(Goal: number): Promise<void>
	}

	interface OcaProperty {
		readonly ENo: number
		readonly ID: OcaPropertyID
	}

	// -------------------------------------------------------------------------
	// OcaNumericObserver
	// -------------------------------------------------------------------------
	interface OcaNumericObserver {
		GetPropertySync(): PropertySync<OcaNumericObserverProperties>
		readonly OnObservationChanged: Event
		readonly OnStateChanged: PropertyEvent<OcaObserverState>
		readonly OnObservedPropertyChanged: PropertyEvent<OcaProperty>
		readonly OnThresholdChanged: PropertyEvent<number>
		readonly OnOperatorChanged: PropertyEvent<OcaRelationalOperator>
		readonly OnTwosidedChanged: PropertyEvent<boolean>
		readonly OnHysteresisChanged: PropertyEvent<number>
		readonly OnPeriodChanged: PropertyEvent<number>

		GetState(): Promise<OcaObserverState>
		GetObservedProperty(): Promise<OcaProperty>
		SetObservedProperty(property: OcaProperty): Promise<void>
		GetThreshold(): Promise<number>
		SetThreshold(Threshold: number): Promise<void>
		GetOperator(): Promise<OcaRelationalOperator>
		SetOperator(Operator: OcaRelationalOperator): Promise<void>
		GetTwosided(): Promise<boolean>
		SetTwosided(Twosided: boolean): Promise<void>
		GetHysteresis(): Promise<number>
		SetHysteresis(Hysteresis: number): Promise<void>
		GetPeriod(): Promise<number>
		SetPeriod(Period: number): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaNumericObserverList
	// -------------------------------------------------------------------------
	interface OcaNumericObserverList {
		GetPropertySync(): PropertySync<OcaNumericObserverListProperties>
		readonly OnObservationChanged: Event
		readonly OnStateChanged: PropertyEvent<OcaObserverState>
		readonly OnObservedPropertiesChanged: PropertyEvent<OcaProperty[]>
		readonly OnThresholdChanged: PropertyEvent<number>
		readonly OnOperatorChanged: PropertyEvent<OcaRelationalOperator>
		readonly OnTwosidedChanged: PropertyEvent<boolean>
		readonly OnHysteresisChanged: PropertyEvent<number>
		readonly OnPeriodChanged: PropertyEvent<number>

		GetState(): Promise<OcaObserverState>
		GetObservedProperties(): Promise<OcaProperty[]>
		SetObservedProperties(properties: OcaProperty[]): Promise<void>
		GetThreshold(): Promise<number>
		SetThreshold(Threshold: number): Promise<void>
		GetOperator(): Promise<OcaRelationalOperator>
		SetOperator(Operator: OcaRelationalOperator): Promise<void>
		GetTwosided(): Promise<boolean>
		SetTwosided(Twosided: boolean): Promise<void>
		GetHysteresis(): Promise<number>
		SetHysteresis(Hysteresis: number): Promise<void>
		GetPeriod(): Promise<number>
		SetPeriod(Period: number): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaPowerSupply
	// -------------------------------------------------------------------------
	interface OcaPowerSupply {
		GetPropertySync(): PropertySync<OcaPowerSupplyProperties>
		readonly OnTypeChanged: PropertyEvent<OcaPowerSupplyType>
		readonly OnModelInfoChanged: PropertyEvent<string>
		readonly OnStateChanged: PropertyEvent<OcaPowerSupplyState>
		readonly OnChargingChanged: PropertyEvent<boolean>
		readonly OnLoadFractionAvailableChanged: PropertyEvent<number>
		readonly OnStorageFractionAvailableChanged: PropertyEvent<number>
		readonly OnLocationChanged: PropertyEvent<OcaPowerSupplyLocation>

		GetType(): Promise<OcaPowerSupplyType>
		GetModelInfo(): Promise<string>
		GetState(): Promise<OcaPowerSupplyState>
		GetCharging(): Promise<boolean>
		GetLoadFractionAvailable(): Promise<number>
		GetStorageFractionAvailable(): Promise<number>
		GetLocation(): Promise<OcaPowerSupplyLocation>
	}

	// -------------------------------------------------------------------------
	// OcaMediaClock3
	// -------------------------------------------------------------------------
	interface OcaMediaClock3 {
		GetPropertySync(): PropertySync<OcaMediaClock3Properties>
		readonly OnAvailabilityChanged: PropertyEvent<OcaMediaClockAvailability>
		readonly OnTimeSourceONoChanged: PropertyEvent<number>
		readonly OnOffsetChanged: PropertyEvent<OcaTimePTP>
		readonly OnCurrentRateChanged: PropertyEvent<OcaMediaClockRate>
		readonly OnSupportedRatesChanged: PropertyEvent<Map<number, OcaMediaClockRate[]>>

		GetAvailability(): Promise<OcaMediaClockAvailability>
		SetAvailability(Availability: OcaMediaClockAvailability): Promise<void>
		GetCurrentRate(): Promise<Arguments<[OcaMediaClockRate, number]>>
		SetCurrentRate(Rate: OcaMediaClockRate, TimeSourceONo: number): Promise<void>
		GetOffset(): Promise<OcaTimePTP>
		SetOffset(Offset: OcaTimePTP): Promise<void>
		GetSupportedRates(): Promise<Map<number, OcaMediaClockRate[]>>
	}

	// -------------------------------------------------------------------------
	// OcaTimeSource
	// -------------------------------------------------------------------------
	interface OcaTimeSource {
		GetPropertySync(): PropertySync<OcaTimeSourceProperties>
		readonly OnAvailabilityChanged: PropertyEvent<OcaTimeSourceAvailability>
		readonly OnProtocolChanged: PropertyEvent<OcaTimeProtocol>
		readonly OnParametersChanged: PropertyEvent<string>
		readonly OnReferenceTypeChanged: PropertyEvent<OcaTimeReferenceType>
		readonly OnReferenceIDChanged: PropertyEvent<string>
		readonly OnSyncStatusChanged: PropertyEvent<OcaTimeSourceSyncStatus>

		GetAvailability(): Promise<OcaTimeSourceAvailability>
		GetProtocol(): Promise<OcaTimeProtocol>
		SetProtocol(Protocol: OcaTimeProtocol): Promise<void>
		GetParameters(): Promise<string>
		SetParameters(Parameters: string): Promise<void>
		GetReferenceType(): Promise<OcaTimeReferenceType>
		SetReferenceType(ReferenceType: OcaTimeReferenceType): Promise<void>
		GetReferenceID(): Promise<string>
		SetReferenceID(ID: string): Promise<void>
		GetSyncStatus(): Promise<OcaTimeSourceSyncStatus>
		Reset(): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaPhysicalPosition
	// -------------------------------------------------------------------------
	interface OcaPhysicalPosition {
		GetPropertySync(): PropertySync<OcaPhysicalPositionProperties>
		readonly OnCoordinateSystemChanged: PropertyEvent<OcaPositionCoordinateSystem>
		readonly OnPositionDescriptorFieldFlagsChanged: PropertyEvent<number>
		readonly OnPositionChanged: PropertyEvent<OcaPositionDescriptor>
		GetCoordinateSystem(): Promise<OcaPositionCoordinateSystem>
		GetPositionDescriptorFieldFlags(): Promise<number>
		GetPosition(): Promise<Arguments<[OcaPositionDescriptor, OcaPositionDescriptor, OcaPositionDescriptor]>>
		SetPosition(Position: OcaPositionDescriptor): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaApplicationNetwork
	// -------------------------------------------------------------------------
	interface OcaApplicationNetwork {
		GetPropertySync(): PropertySync<OcaApplicationNetworkProperties>
		readonly OnLabelChanged: PropertyEvent<string>
		readonly OnOwnerChanged: PropertyEvent<number>
		readonly OnServiceIDChanged: PropertyEvent<Uint8Array>
		readonly OnSystemInterfacesChanged: PropertyEvent<OcaNetworkSystemInterfaceDescriptor[]>
		readonly OnStateChanged: PropertyEvent<OcaApplicationNetworkState>
		readonly OnErrorCodeChanged: PropertyEvent<number>

		GetLabel(): Promise<string>
		SetLabel(Label: string): Promise<void>
		GetOwner(): Promise<number>
		GetServiceID(): Promise<Uint8Array>
		SetServiceID(ServiceID: Uint8Array): Promise<void>
		GetSystemInterfaces(): Promise<OcaNetworkSystemInterfaceDescriptor[]>
		SetSystemInterfaces(Descriptors: OcaNetworkSystemInterfaceDescriptor[]): Promise<void>
		GetState(): Promise<OcaApplicationNetworkState>
		GetErrorCode(): Promise<number>
		Control(Command: OcaApplicationNetworkCommand): Promise<void>
		GetPath(): Promise<Arguments<[string[], number[]]>>
	}

	// -------------------------------------------------------------------------
	// OcaControlNetwork
	// -------------------------------------------------------------------------
	interface OcaControlNetwork {
		GetPropertySync(): PropertySync<OcaControlNetworkProperties>
		readonly OnProtocolChanged: PropertyEvent<OcaNetworkControlProtocol>
		GetProtocol(): Promise<OcaNetworkControlProtocol>
		SetProtocol(Protocol: OcaNetworkControlProtocol): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaMediaTransportNetwork
	// -------------------------------------------------------------------------
	interface OcaMediaTransportNetwork {
		GetPropertySync(): PropertySync<OcaMediaTransportNetworkProperties>
		readonly OnProtocolChanged: PropertyEvent<OcaNetworkMediaProtocol>
		readonly OnPortsChanged: PropertyEvent<OcaPort[]>
		readonly OnMaxSourceConnectorsChanged: PropertyEvent<number>
		readonly OnMaxSinkConnectorsChanged: PropertyEvent<number>
		readonly OnMaxPinsPerConnectorChanged: PropertyEvent<number>
		readonly OnAlignmentLevelChanged: PropertyEvent<number>
		readonly OnAlignmentGainChanged: PropertyEvent<number>

		GetProtocol(): Promise<OcaNetworkMediaProtocol>
		GetPorts(): Promise<OcaPort[]>
		GetPortName(PortID: OcaPortID): Promise<string>
		SetPortName(PortID: OcaPortID, Name: string): Promise<void>
		GetMaxSourceConnectors(): Promise<number>
		GetMaxSinkConnectors(): Promise<number>
		GetMaxPinsPerConnector(): Promise<number>
		GetAlignmentLevel(): Promise<Arguments<[number, number, number]>>
		GetAlignmentGain(): Promise<Arguments<[number, number, number]>>
		EnsureSendingChannel(
			Connector: OcaMediaSourceConnector,
			AlignmentLevel: number,
			AlignmentGain: number,
		): Promise<OcaMediaSourceConnector>
		EnsureReceivingChannel(
			Connector: OcaMediaSinkConnector,
			AlignmentLevel: number,
			AlignmentGain: number,
		): Promise<OcaMediaSinkConnector>
		AddSourceConnector(
			Connector: OcaMediaSourceConnector,
			InitialStatus: OcaMediaConnectorState,
		): Promise<OcaMediaSourceConnector>
		AddSinkConnector(
			InitialStatus: OcaMediaConnectorState,
			Connector: OcaMediaSinkConnector,
		): Promise<OcaMediaSinkConnector>
		ControlConnector(ConnectorID: number, Command: OcaMediaConnectorCommand): Promise<void>
		SetSourceConnectorPinMap(ConnectorID: number, ChannelPinMap: Map<number, number>): Promise<void>
		SetSinkConnectorPinMap(ConnectorID: number, ChannelPinMap: Map<number, number>): Promise<void>
		SetConnectorConnection(ConnectorID: number, Connection: OcaMediaConnection): Promise<void>
		SetConnectorCoding(ConnectorID: number, Coding: OcaMediaCoding): Promise<void>
		DeleteConnector(ID: number): Promise<void>
		GetSourceConnector(ID: number): Promise<OcaMediaSourceConnector>
		GetSourceConnectors(): Promise<OcaMediaSourceConnector[]>
		GetSinkConnector(ID: number): Promise<OcaMediaSinkConnector>
		GetSinkConnectors(): Promise<OcaMediaSinkConnector[]>
		GetConnectorsStatuses(): Promise<OcaMediaConnectorStatus[]>
		GetConnectorStatus(ID: number): Promise<OcaMediaConnectorStatus>
	}

	// -------------------------------------------------------------------------
	// OcaManager (base)
	// -------------------------------------------------------------------------
	interface OcaManager {
		GetPropertySync(): PropertySync<OcaManagerProperties>
		// No additional methods beyond OcaRoot; sub-managers add their own.
	}

	// -------------------------------------------------------------------------
	// OcaDeviceManager
	// -------------------------------------------------------------------------
	interface OcaDeviceManager {
		GetPropertySync(): PropertySync<OcaDeviceManagerProperties>
		readonly OnModelGUIDChanged: PropertyEvent<OcaModelGUID>
		readonly OnSerialNumberChanged: PropertyEvent<string>
		readonly OnDeviceNameChanged: PropertyEvent<string>
		readonly OnSoftwareVersionChanged: PropertyEvent<OcaVersion[]>
		readonly OnDeviceRoleChanged: PropertyEvent<string>
		readonly OnUserInventoryCodeChanged: PropertyEvent<string>
		readonly OnEnabledChanged: PropertyEvent<boolean>
		readonly OnStateChanged: PropertyEvent<OcaDeviceState>
		readonly OnBusyChanged: PropertyEvent<boolean>
		readonly OnResetCauseChanged: PropertyEvent<OcaResetCause>
		readonly OnMessageChanged: PropertyEvent<string>
		readonly OnManagersChanged: PropertyEvent<OcaManagerDescriptor[]>
		readonly OnDeviceRevisionIDChanged: PropertyEvent<string>

		GetOcaVersion(): Promise<number>
		GetModelGUID(): Promise<OcaModelGUID>
		GetSerialNumber(): Promise<string>
		GetDeviceName(): Promise<string>
		SetDeviceName(Name: string): Promise<void>
		GetModelDescription(): Promise<OcaModelDescription>
		GetDeviceRole(): Promise<string>
		SetDeviceRole(Name: string): Promise<void>
		GetUserInventoryCode(): Promise<string>
		SetUserInventoryCode(Code: string): Promise<void>
		GetEnabled(): Promise<boolean>
		SetEnabled(enabled: boolean): Promise<void>
		GetState(): Promise<OcaDeviceState>
		SetResetKey(Key: Uint8Array, Address: Uint8Array): Promise<void>
		GetResetCause(): Promise<OcaResetCause>
		ClearResetCause(): Promise<void>
		GetMessage(): Promise<string>
		SetMessage(Message: string): Promise<void>
		GetManagers(): Promise<OcaManagerDescriptor[]>
		GetDeviceRevisionID(): Promise<string>
	}

	// -------------------------------------------------------------------------
	// OcaSecurityManager
	// -------------------------------------------------------------------------
	interface OcaSecurityManager {
		GetPropertySync(): PropertySync<OcaSecurityManagerProperties>
		readonly OnSecureControlDataChanged: PropertyEvent<boolean>
		EnableControlSecurity(): Promise<void>
		DisableControlSecurity(): Promise<void>
		ChangePreSharedKey(Identity: string, NewKey: Uint8Array): Promise<void>
		AddPreSharedKey(Identity: string, Key: Uint8Array): Promise<void>
		DeletePreSharedKey(Identity: string): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaFirmwareManager
	// -------------------------------------------------------------------------
	interface OcaFirmwareManager {
		GetPropertySync(): PropertySync<OcaFirmwareManagerProperties>
		readonly OnComponentVersionsChanged: PropertyEvent<OcaVersion[]>
		GetComponentVersions(): Promise<OcaVersion[]>
		StartUpdateProcess(): Promise<void>
		BeginActiveImageUpdate(Component: OcaComponent): Promise<void>
		AddImageData(Id: number, imageData: Uint8Array): Promise<void>
		VerifyImage(VerifyData: Uint8Array): Promise<void>
		EndActiveImageUpdate(): Promise<void>
		BeginPassiveComponentUpdate(
			Component: OcaComponent,
			ServerAddress: Uint8Array,
			UpdateFileName: string,
		): Promise<void>
		EndUpdateProcess(): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaSubscriptionManager
	// -------------------------------------------------------------------------
	interface OcaSubscriptionManager {
		GetPropertySync(): PropertySync<OcaSubscriptionManagerProperties>
		readonly OnStateChanged: PropertyEvent<OcaSubscriptionManagerState>
		RemoveSubscription(Event: OcaEventData, Subscriber: OcaMethod): Promise<void>
		DisableNotifications(): Promise<void>
		ReEnableNotifications(): Promise<void>
		AddPropertyChangeSubscription(
			Emitter: number,
			Property: OcaPropertyID,
			Subscriber: OcaMethod,
			SubscriberContext: Uint8Array,
			NotificationDeliveryMode: OcaNotificationDeliveryMode,
			DestinationInformation: Uint8Array,
		): Promise<void>
		RemovePropertyChangeSubscription(Emitter: number, Property: OcaPropertyID, Subscriber: OcaMethod): Promise<void>
		GetMaximumSubscriberContextLength(): Promise<number>
	}

	interface OcaEventData {
		readonly EmitterONo: number
		readonly EventID: OcaEventID
	}
	interface OcaEventID {
		readonly DefLevel: number
		readonly EventIndex: number
	}
	interface OcaMethod {
		readonly ONo: number
		readonly MethodID: OcaMethodID
	}
	interface OcaMethodID {
		readonly DefLevel: number
		readonly MethodIndex: number
	}

	// -------------------------------------------------------------------------
	// OcaPowerManager
	// -------------------------------------------------------------------------
	interface OcaPowerManager {
		GetPropertySync(): PropertySync<OcaPowerManagerProperties>
		readonly OnStateChanged: PropertyEvent<OcaPowerState>
		readonly OnPowerSuppliesChanged: PropertyEvent<number[]>
		readonly OnActivePowerSuppliesChanged: PropertyEvent<number[]>
		readonly OnAutoStateChanged: PropertyEvent<boolean>
		readonly OnTargetStateChanged: PropertyEvent<OcaPowerState>

		GetState(): Promise<OcaPowerState>
		SetState(State: OcaPowerState): Promise<void>
		GetPowerSupplies(): Promise<number[]>
		GetActivePowerSupplies(): Promise<number[]>
		ExchangePowerSupply(oldPsu: number, newPsu: number, powerOffOld: boolean): Promise<void>
		GetAutoState(): Promise<boolean>
	}

	// -------------------------------------------------------------------------
	// OcaNetworkManager
	// -------------------------------------------------------------------------
	interface OcaNetworkManager {
		GetPropertySync(): PropertySync<OcaNetworkManagerProperties>
		readonly OnNetworksChanged: PropertyEvent<number[]>
		readonly OnStreamNetworksChanged: PropertyEvent<number[]>
		readonly OnControlNetworksChanged: PropertyEvent<number[]>
		readonly OnMediaTransportNetworksChanged: PropertyEvent<number[]>

		GetNetworks(): Promise<number[]>
		GetStreamNetworks(): Promise<number[]>
		GetControlNetworks(): Promise<number[]>
		GetMediaTransportNetworks(): Promise<number[]>
	}

	// -------------------------------------------------------------------------
	// OcaMediaClockManager
	// -------------------------------------------------------------------------
	interface OcaMediaClockManager {
		GetPropertySync(): PropertySync<OcaMediaClockManagerProperties>
		readonly OnClocksChanged: PropertyEvent<number[]>
		readonly OnClock3sChanged: PropertyEvent<number[]>
		GetClocks(): Promise<number[]>
		GetMediaClockTypesSupported(): Promise<OcaMediaClockType[]>
		GetClock3s(): Promise<number[]>
	}

	// -------------------------------------------------------------------------
	// OcaLibraryManager
	// -------------------------------------------------------------------------
	interface OcaLibraryManager {
		GetPropertySync(): PropertySync<OcaLibraryManagerProperties>
		readonly OnLibrariesChanged: PropertyEvent<OcaLibraryIdentifier[]>
		AddLibrary(Type: OcaLibVolType): Promise<number>
		DeleteLibrary(ONo: number): Promise<void>
		GetLibraryCount(Type: OcaLibVolType): Promise<number>
		GetLibraryList(Type: OcaLibVolType): Promise<OcaLibraryIdentifier[]>
		GetCurrentParamSetLibrary(): Promise<number>
		SetCurrentParamSetLibrary(ONo: number): Promise<void>
		ApplyParamSet(ID: OcaLibVolIdentifier): Promise<OcaLibVolIdentifier>
		GetCurrentParamSetData(): Promise<OcaLibVol>
		StoreCurrentParamSetData(LibVolIdentifier: OcaLibVolIdentifier): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaAudioProcessingManager
	// -------------------------------------------------------------------------
	interface OcaAudioProcessingManager {
		GetPropertySync(): PropertySync<OcaAudioProcessingManagerProperties>
		// No additional methods defined in standard.
	}

	// -------------------------------------------------------------------------
	// OcaDeviceTimeManager
	// -------------------------------------------------------------------------
	interface OcaDeviceTimeManager {
		GetPropertySync(): PropertySync<OcaDeviceTimeManagerProperties>
		readonly OnTimeSourcesChanged: PropertyEvent<number[]>
		readonly OnCurrentDeviceTimeSourceChanged: PropertyEvent<number>
		GetDeviceTimeNTP(): Promise<number>
		SetDeviceTimeNTP(DeviceTime: number): Promise<void>
		GetTimeSources(): Promise<number[]>
		GetCurrentDeviceTimeSource(): Promise<number>
		SetCurrentDeviceTimeSource(ONo: number): Promise<void>
		GetDeviceTimePTP(): Promise<OcaTimePTP>
		SetDeviceTimePTP(DeviceTime: OcaTimePTP): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaTaskManager
	// -------------------------------------------------------------------------
	interface OcaTaskManager {
		GetPropertySync(): PropertySync<OcaTaskManagerProperties>
		readonly OnStateChanged: PropertyEvent<OcaTaskManagerState>
		readonly OnTasksChanged: PropertyEvent<Map<number, OcaTask>>

		Enable(Enable: boolean): Promise<void>
		ControlAllTasks(Command: OcaTaskCommand, ApplicationTaskParameter: Uint8Array): Promise<void>
		ControlTaskGroup(GroupID: number, Command: OcaTaskCommand, ApplicationTaskParameter: Uint8Array): Promise<void>
		ControlTask(TaskID: number, Command: OcaTaskCommand, ApplicationTaskParameter: Uint8Array): Promise<void>
		GetState(): Promise<OcaTaskManagerState>
		GetTaskStatuses(): Promise<OcaTaskStatus[]>
		GetTaskStatus(TaskID: number): Promise<OcaTaskStatus>
		AddTask(Task: OcaTask): Promise<OcaTask>
		GetTasks(): Promise<Map<number, OcaTask>>
		GetTask(ID: number): Promise<OcaTask>
		SetTask(ID: number, Task: OcaTask): Promise<void>
		DeleteTask(ID: number): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaCodingManager
	// -------------------------------------------------------------------------
	interface OcaCodingManager {
		GetPropertySync(): PropertySync<OcaCodingManagerProperties>
		readonly OnAvailableEncodingSchemes: PropertyEvent<Map<number, string>>
		readonly OnAvailableDecodingSchemes: PropertyEvent<Map<number, string>>
		GetAvailableEncodingSchemes(): Promise<Map<number, string>>
		GetAvailableDecodingSchemes(): Promise<Map<number, string>>
	}

	// -------------------------------------------------------------------------
	// OcaDiagnosticManager
	// -------------------------------------------------------------------------
	interface OcaDiagnosticManager {
		GetPropertySync(): PropertySync<OcaDiagnosticManagerProperties>
		GetLockStatus(): Promise<string>
	}

	// -------------------------------------------------------------------------
	// OcaNetwork (deprecated v1 class)
	// -------------------------------------------------------------------------
	interface OcaNetwork {
		GetPropertySync(): PropertySync<OcaNetworkProperties>
		readonly OnLinkTypeChanged: PropertyEvent<OcaNetworkLinkType>
		readonly OnIdAdvertisedChanged: PropertyEvent<Uint8Array>
		readonly OnControlProtocolChanged: PropertyEvent<OcaNetworkControlProtocol>
		readonly OnMediaProtocolChanged: PropertyEvent<OcaNetworkMediaProtocol>
		readonly OnStatusChanged: PropertyEvent<OcaNetworkStatus>
		readonly OnStatisticsChanged: PropertyEvent<OcaNetworkStatistics>
		readonly OnSystemInterfacesChanged: PropertyEvent<OcaNetworkSystemInterfaceDescriptor[]>

		GetLinkType(): Promise<OcaNetworkLinkType>
		GetIdAdvertised(): Promise<Uint8Array>
		SetIdAdvertised(Name: Uint8Array): Promise<void>
		GetControlProtocol(): Promise<OcaNetworkControlProtocol>
		GetMediaProtocol(): Promise<OcaNetworkMediaProtocol>
		GetStatus(): Promise<OcaNetworkStatus>
		GetStatistics(): Promise<OcaNetworkStatistics>
		ResetStatistics(): Promise<void>
		GetSystemInterfaces(): Promise<OcaNetworkSystemInterfaceDescriptor[]>
		SetSystemInterfaces(Interfaces: OcaNetworkSystemInterfaceDescriptor[]): Promise<void>
		GetMediaPorts(): Promise<OcaPort[]>
		Startup(): Promise<void>
		Shutdown(): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaMediaClock (deprecated v1 class)
	// -------------------------------------------------------------------------
	interface OcaMediaClock {
		GetPropertySync(): PropertySync<OcaMediaClockProperties>
		readonly OnTypeChanged: PropertyEvent<OcaMediaClockType>
		readonly OnDomainIDChanged: PropertyEvent<number>
		readonly OnRatesChanged: PropertyEvent<OcaMediaClockRate[]>
		readonly OnLockStateChanged: PropertyEvent<OcaMediaClockLockState>

		GetType(): Promise<OcaMediaClockType>
		SetType(Type: OcaMediaClockType): Promise<void>
		GetDomainID(): Promise<Arguments<[number, number, number]>>
		SetDomainID(ID: number): Promise<void>
		GetSupportedRates(): Promise<OcaMediaClockRate[]>
		GetRate(): Promise<Arguments<[OcaMediaClockRate, OcaMediaClockRate[]]>>
		SetRate(Rate: OcaMediaClockRate): Promise<void>
		GetLockState(): Promise<OcaMediaClockLockState>
	}

	// -------------------------------------------------------------------------
	// OcaStreamNetwork (deprecated v1 class)
	// -------------------------------------------------------------------------
	interface OcaStreamNetwork {
		GetPropertySync(): PropertySync<OcaStreamNetworkProperties>
		readonly OnControlProtocolChanged: PropertyEvent<OcaNetworkControlProtocol>
		readonly OnIdAdvertisedChanged: PropertyEvent<Uint8Array>
		readonly OnLinkTypeChanged: PropertyEvent<OcaNetworkLinkType>
		readonly OnMediaProtocolChanged: PropertyEvent<OcaNetworkMediaProtocol>
		readonly OnSignalChannelsSinkChanged: PropertyEvent<number[]>
		readonly OnSignalChannelsSourceChanged: PropertyEvent<number[]>
		readonly OnStatisticsChanged: PropertyEvent<OcaNetworkStatistics>
		readonly OnStatusChanged: PropertyEvent<OcaNetworkStatus>
		readonly OnStreamConnectorsChanged: PropertyEvent<number[]>
		readonly OnSystemInterfacesChanged: PropertyEvent<OcaNetworkSystemInterfaceDescriptor[]>

		GetControlProtocol(): Promise<OcaNetworkControlProtocol>
		GetIdAdvertised(): Promise<Uint8Array>
		SetIdAdvertised(Name: Uint8Array): Promise<void>
		GetLinkType(): Promise<OcaNetworkLinkType>
		GetMediaProtocol(): Promise<OcaNetworkMediaProtocol>
		GetSignalChannelsSink(): Promise<number[]>
		GetSignalChannelsSource(): Promise<number[]>
		GetStatistics(): Promise<OcaNetworkStatistics>
		ResetStatistics(): Promise<void>
		GetStatus(): Promise<OcaNetworkStatus>
		GetStreamConnectors(): Promise<number[]>
		GetSystemInterfaces(): Promise<OcaNetworkSystemInterfaceDescriptor[]>
		SetSystemInterfaces(Interfaces: OcaNetworkSystemInterfaceDescriptor[]): Promise<void>
		Startup(): Promise<void>
		Shutdown(): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaStreamConnector (deprecated v1 class)
	// -------------------------------------------------------------------------
	interface OcaStreamConnector {
		GetPropertySync(): PropertySync<OcaStreamConnectorProperties>
		readonly OnIDAdvertisedChanged: PropertyEvent<OcaStreamConnectorIdentification>
		readonly OnOwnerNetworkChanged: PropertyEvent<number>
		readonly OnPinsChanged: PropertyEvent<Map<number, number>>
		readonly OnStatusChanged: PropertyEvent<OcaStreamConnectorStatus>
		readonly OnStreamsChanged: PropertyEvent<Map<number, OcaStream>>

		ConnectStream(Stream: OcaStream): Promise<number>
		DisconnectStream(StreamID: number): Promise<void>
		GetIDAdvertised(): Promise<OcaStreamConnectorIdentification>
		SetIDAdvertised(IDAdvertised: OcaStreamConnectorIdentification): Promise<void>
		GetOwnerNetwork(): Promise<number>
		SetOwnerNetwork(Network: number): Promise<void>
		GetPins(): Promise<Map<number, number>>
		GetStatus(): Promise<OcaStreamConnectorStatus>
		GetStreams(): Promise<Map<number, OcaStream>>
		SetSourceOrSink(SourceOrSink: OcaNetworkMediaSourceOrSink): Promise<void>
	}

	// -------------------------------------------------------------------------
	// OcaNetworkSignalChannel (deprecated v1 class)
	// -------------------------------------------------------------------------
	interface OcaNetworkSignalChannel {
		GetPropertySync(): PropertySync<OcaNetworkSignalChannelProperties>
		readonly OnConnectorPinChanged: PropertyEvent<Map<number, number>>
		readonly OnIDAdvertisedChanged: PropertyEvent<Uint8Array>
		readonly OnNetworkChanged: PropertyEvent<number>
		readonly OnRemoteChannelIDChanged: PropertyEvent<Uint8Array>
		readonly OnSourceOrSinkChanged: PropertyEvent<OcaNetworkMediaSourceOrSink>
		readonly OnStatusChanged: PropertyEvent<OcaNetworkSignalChannelStatus>

		AddToConnector(Connector: number, Index: number): Promise<void>
		GetConnectorPins(): Promise<Map<number, number>>
		GetIDAdvertised(): Promise<Uint8Array>
		SetIDAdvertised(IDAdvertised: Uint8Array): Promise<void>
		GetNetwork(): Promise<number>
		SetNetwork(Network: number): Promise<void>
		GetRemoteChannelID(): Promise<Uint8Array>
		SetRemoteChannelID(RemoteChannelID: Uint8Array): Promise<void>
		GetSourceOrSink(): Promise<OcaNetworkMediaSourceOrSink>
		SetSourceOrSink(SourceOrSink: OcaNetworkMediaSourceOrSink): Promise<void>
		GetStatus(): Promise<OcaNetworkSignalChannelStatus>
		RemoveFromConnector(Connector: number): Promise<void>
	}
}
