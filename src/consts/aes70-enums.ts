import type { DropdownChoice } from '@companion-module/base'
import { type OcaClassName } from './aes70-constants.js'
import { ocaClassNameToLabel } from '../utils.js'

// Helper Functions

export function isEnumValue<E extends Record<string, string | number>>(
	value: string | number,
	enumObj: E,
): value is E[keyof E] {
	return Object.values(enumObj).includes(value)
}

export function isNumericEnumValue<E extends Record<string, string | number>>(
	value: unknown,
	enumObj: E,
): value is Extract<E[keyof E], number> {
	return typeof value === 'number' && Object.values(enumObj).some((v) => typeof v === 'number' && v === value)
}

/**
 * Converts a TypeScript numeric enum into Companion DropdownChoice[] format.
 * - `id` is the enum's numeric value
 * - `label` is the enum member's name, passed through ocaClassNameToLabel()
 */
export function enumToDropdownChoices<E extends Record<string, string | number>>(enumObj: E): DropdownChoice<number>[] {
	return Object.keys(enumObj)
		.filter((key) => typeof enumObj[key as keyof E] === 'number')
		.map((key) => ({
			id: enumObj[key as keyof E] as number,
			label: ocaClassNameToLabel(key),
		}))
}

export type EnumValue<E extends Record<string, string | number>> = Extract<E[keyof E], number>

// Auto-generated from txt

export enum OcaActionObjectSearchResultFlags {
	ONo = 1,
	ClassIdentification = 2,
	ContainerPath = 4,
	Role = 8,
	Label = 16,
}

export enum OcaApplicationNetworkCommand {
	None = 0,
	Prepare = 1,
	Start = 2,
}

export enum OcaApplicationNetworkState {
	Unknown = 0,
	NotReady = 1,
	Readying = 2,
}

export enum OcaBaseDataType {
	None = 0,
	OcaBoolean = 1,
	OcaInt8 = 2,
	OcaInt16 = 3,
	OcaInt32 = 4,
	OcaInt64 = 5,
	OcaUint8 = 6,
	OcaUint16 = 7,
	OcaUint32 = 8,
	OcaUint64 = 9,
	OcaFloat32 = 10,
	OcaFloat64 = 11,
	OcaString = 12,
	OcaBitstring = 13,
	OcaBlob = 14,
	OcaBlobFixedLen = 15,
	OcaBit = 16,
}

export enum OcaBlockConfigurability {
	ActionObjects = 1,
	SignalPaths = 2,
	DatasetObjects = 4,
}

export enum OcaClassicalFilterShape {
	Butterworth = 1,
	Bessel = 2,
	Chebyshev = 3,
	LinkwitzRiley = 4,
}

export enum OcaComponent {
	BootLoader = 0,
}

export enum OcaDelayUnit {
	Time = 1,
	Distance = 2,
	Samples = 3,
	Microseconds = 4,
	Milliseconds = 5,
	Centimeters = 6,
	Inches = 7,
	Feet = 8,
}

export enum OcaDeviceGenericState {
	NormalOperation = 0,
	Initializaing = 1,
	Updating = 2,
	Fault = 3,
	ExpansionBase = 128,
}

export enum OcaDeviceState {
	Operational = 1,
	Disabled = 2,
	Error = 4,
	Initializing = 8,
	Updating = 16,
}

export enum OcaDynamicsFunction {
	None = 0,
	Compress = 1,
	Limit = 2,
	Expand = 3,
	Gate = 4,
}

export enum OcaExecutableType {
	Undefined = 0,
	Program = 1,
	Commandset = 2,
}

export enum OcaFilterPassband {
	HiPass = 1,
	LowPass = 2,
	BandPass = 3,
	BandReject = 4,
	AllPass = 5,
}

export enum OcaGenericEndState {
	CompletedNormally = 1,
	CompletedAbnormally = 2,
	Interrupted = 3,
	Failed = 4,
}

export enum OcaGrouperMode {
	Hierarchical = 1,
	PeerToPeer = 2,
}

export enum OcaGrouperStatusChangeType {
	citizenAdded = 1,
	citizenDeleted = 2,
	citizenConnectionLost = 3,
	citizenConnectionReEstablished = 4,
	citizenError = 5,
	enrollment = 6,
	unEnrollment = 7,
}

export enum OcaIODirection {
	Input = 1,
	Output = 2,
}

export enum OcaIP4AutoconfigMode {
	None = 0,
	DHCP = 1,
	LINKLOCAL = 3,
}

export enum OcaIP6AutoconfigMode {
	NONE = 0,
	SLAAC = 1,
}

export enum OcaIntervalBounds {
	MinOmitted = 1,
	MaxOmitted = 2,
	MinInclusive = 4,
	MaxInclusive = 8,
}

export enum OcaJobDisposition {
	RunStarted = 1,
	ItemDeleted = 2,
}

export enum OcaLevelDetectionLaw {
	None = 0,
	RMS = 1,
	Peak = 2,
}

export enum OcaLevelMeterLaw {
	VU = 1,
	StandardVU = 2,
	PPM1 = 3,
	PPM2 = 4,
	LKFS = 5,
	RMS = 6,
	Peak = 7,
	ProprietaryValueBase = 128,
}

export enum OcaLockState {
	NoLock = 0,
	LockNoWrite = 1,
	LockNoReadWrite = 2,
}

export enum OcaManagerDefaultObjectNumbers {
	DeviceManager = 1,
	SecurityManager = 2,
	FirmwareManager = 3,
	SubscriptionManager = 4,
	PowerManager = 5,
	NetworkManager = 6,
	MediaClockManager = 7,
	LibraryManager = 8,
	AudioProcessingManager = 9,
	DeviceTimeManager = 10,
	TaskManager = 11,
	CodingManager = 12,
	DiagnosticManager = 13,
	LockManager = 14,
}

export enum OcaMediaAccessMode {
	None = 0,
	Play = 1,
	Record = 2,
}

export enum OcaMediaClockAvailability {
	Unavailable = 0,
	Available = 1,
}

export enum OcaMediaClockLockState {
	Undefined = 0,
	Locked = 1,
	Synchronizing = 2,
	FreeRun = 3,
	Stopped = 4,
}

export enum OcaMediaClockType {
	None = 0,
	Internal = 1,
	Network = 2,
	External = 3,
}

export enum OcaMediaConnectorCommand {
	None = 0,
	Start = 1,
	Pause = 2,
}

export enum OcaMediaConnectorElement {
	PinMap = 1,
	Connection = 2,
	Coding = 4,
	AlignmentLevel = 8,
	AlignmentGain = 16,
}

export enum OcaMediaConnectorState {
	Stopped = 0,
	SettingUp = 1,
	Running = 2,
	Paused = 3,
	Fault = 4,
}

export enum OcaMediaFrameFormat {
	Undefined = 0,
	RTP = 1,
	AAF = 2,
	ExtensionPoint = 65,
}

export enum OcaMediaPlayOption {
	Normal = 0,
	Autoclose = 1,
	RepeatInterval = 2,
}

export enum OcaMediaRecorderPlayerState {
	Idle = 0,
	Stopped = 1,
	Seeking = 2,
	Recording = 3,
	Playing = 4,
}

export enum OcaMediaStreamCastMode {
	Unknown = 0,
	Unicast = 1,
	Multicast = 2,
}

export enum OcaMediaStreamEndpointCommand {
	None = 0,
	SetReady = 1,
	Connect = 2,
	ConnectAndStart = 3,
	Disconnect = 4,
	StopAndDisconnect = 5,
	Start = 6,
	Stop = 7,
}

export enum OcaMediaStreamEndpointState {
	Unknown = 0,
	NotReady = 1,
	Ready = 2,
	Connected = 3,
	Running = 4,
	ErrorHalt = 5,
}

export enum OcaMediaStreamModeCapabilityDirection {
	Input = 1,
	Output = 2,
}

export enum OcaMediaTrackFunction {
	PlayInPlayMode = 1,
	PlayInRecordMode = 2,
	RecordInRecordMode = 4,
}

export enum OcaMediaTransportSessionState {
	Unconfigured = 1,
	Configured = 2,
	ConnectedNotStreaming = 3,
	ConnectedStreaming = 4,
	Error = 5,
}

export enum OcaMediaVolumePositionType {
	Samples = 0,
	Seconds = 1,
}

export enum OcaMuteState {
	Muted = 1,
	Unmuted = 2,
}

export enum OcaNetworkAdvertisingService {
	DNSSD = 0,
	NMOS = 2,
	ExpansionBase = 128,
}

export enum OcaNetworkControlProtocol {
	None = 0,
	OCP01 = 1,
	OCP02 = 2,
	OCP03 = 3,
}

export enum OcaNetworkInterfaceCommand {
	Start = 0,
	Stop = 1,
	Restart = 2,
}

export enum OcaNetworkInterfaceState {
	NotReady = 0,
	Ready = 1,
	Fault = 2,
}

export enum OcaNetworkLinkType {
	None = 0,
	EthernetWired = 1,
	EthernetWireless = 2,
	USB = 3,
	SerialP2P = 4,
}

export enum OcaNetworkMediaProtocol {
	None = 0,
	AV3 = 1,
	AVBTP = 2,
	Dante = 3,
	Cobranet = 4,
	AES67 = 5,
	SMPTEAudio = 6,
	LiveWire = 7,
	ExtensionPoint = 65,
}

export enum OcaNetworkMediaSourceOrSink {
	None = 0,
	Source = 1,
	Sink = 2,
}

export enum OcaNetworkSignalChannelStatus {
	NotConnected = 0,
	Connected = 1,
	Muted = 2,
}

export enum OcaNetworkStatus {
	Unknown = 0,
	Ready = 1,
	StartingUp = 2,
	Stopped = 3,
}

export enum OcaNotificationDeliveryMode {
	Normal = 1,
	Lightweight = 2,
	// Reliable = 1,
	// Fast = 2,
}

export enum OcaObserverState {
	NotTriggered = 0,
	Triggered = 1,
}

export enum OcaParameterMask {
	Par1 = 1,
	Par2 = 2,
	Par3 = 4,
	Par4 = 8,
	Par5 = 16,
	Par6 = 32,
	Par7 = 64,
	Par8 = 128,
	Par9 = 256,
	Par10 = 512,
	Par11 = 1024,
	Par12 = 2048,
	Par13 = 4096,
	Par14 = 8192,
	Par15 = 16384,
	Par16 = 32768,
}

export enum OcaParametricEQShape {
	None = 0,
	PEQ = 1,
	LowShelv = 2,
	HighShelv = 3,
	LowPass = 4,
	HighPass = 5,
	BandPass = 6,
	AllPass = 7,
	Notch = 8,
	ToneControlLowFixed = 9,
	ToneControlLowSliding = 10,
	ToneControlHighFixed = 11,
	ToneControlHighSliding = 12,
}

export enum OcaPolarityState {
	NonInverted = 1,
	Inverted = 2,
}

export enum OcaPositionCoordinateSystem {
	Robotic = 1,
	ItuAudioObjectBasedPolar = 2,
	ItuAudioObjectBasedCartesian = 3,
	ItuAudioSceneBasedPolar = 4,
	ItuAudioSceneBasedCartesian = 5,
	NAV = 6,
	ProprietaryBase = 128,
}

export enum OcaPositionDescriptorFieldFlags {
	Field1 = 1,
	Field2 = 2,
	Field3 = 4,
	Field4 = 8,
	Field5 = 16,
	Field6 = 32,
}

export enum OcaPowerState {
	None = 0,
	Working = 1,
	Standby = 2,
	Off = 3,
}

export enum OcaPowerSupplyLocation {
	Unspecified = 1,
	Internal = 2,
	External = 3,
}

export enum OcaPowerSupplyState {
	Off = 0,
	Unavailable = 1,
	Available = 2,
	Active = 3,
}

export enum OcaPowerSupplyType {
	None = 0,
	Mains = 1,
	Battery = 2,
	Phantom = 3,
	Solar = 4,
}

export enum OcaPresentationUnit {
	dBu = 0,
	dBV = 1,
	V = 2,
}

export enum OcaProgramRunMode {
	ExecutionOrder = 1,
	RollbackOnError = 2,
}

export enum OcaPropertyChangeType {
	CurrentChanged = 1,
	MinChanged = 2,
	MaxChanged = 3,
	ItemAdded = 4,
	ItemChanged = 5,
	ItemDeleted = 6,
}

export enum OcaRamperCommand {
	Enable = 1,
	Start = 2,
	Halt = 3,
}

export enum OcaRamperInterpolationLaw {
	Linear = 1,
	ReverseLinear = 2,
	Sine = 3,
	Exponential = 4,
}

export enum OcaRamperState {
	NotInitialized = 1,
	Initialized = 2,
	Scheduled = 3,
	Enabled = 4,
	Ramping = 5,
}

export enum OcaRelationalOperator {
	None = 0,
	Equality = 1,
	Inequality = 2,
	GreaterThan = 3,
	GreaterThanOrEqual = 4,
	LessThan = 5,
	LessThanOrEqual = 6,
}

export enum OcaResetCause {
	PowerOn = 0,
	InternalError = 1,
	Upgrade = 2,
	ExternalRequest = 3,
	Unknown = 255,
}

export enum OcaSamplingRateConverterType {
	None = 0,
	Synchronous = 1,
	Asynchronous = 2,
}

export enum OcaSecurityType {
	None = 0,
	Default = 1,
}

export enum OcaSensorReadingState {
	Unknown = 0,
	Valid = 1,
	Underrange = 2,
	Overrange = 3,
	Error = 4,
}

export enum OcaStatus {
	OK = 0,
	ProtocolVersionError = 1,
	DeviceError = 2,
	Locked = 3,
	BadFormat = 4,
	BadONo = 5,
	ParameterError = 6,
	ParameterOutOfRange = 7,
	NotImplemented = 8,
	InvalidRequest = 9,
	ProcessingFailed = 10,
	BadMethod = 11,
	PartiallySucceeded = 12,
	Timeout = 13,
	BufferOverflow = 14,
	PermissionDenied = 15,
	OutOfMemory = 16,
	Busy = 17,
}

export enum OcaStreamConnectorStatus {
	NotAvailable = 0,
	Idle = 1,
	Connected = 2,
	Paused = 3,
}

export enum OcaStreamStatus {
	NotConnected = 0,
	Connected = 1,
	Paused = 2,
}

export enum OcaStreamType {
	None = 0,
	Unicast = 1,
	Multicast = 2,
}

export enum OcaStringComparisonType {
	Exact = 0,
	Substring = 1,
	Contains = 2,
	ExactCaseInsensitive = 3,
	SubstringCaseInsensitive = 4,
	ContainsCaseInsensitive = 5,
}

export enum OcaSubscriptionManagerState {
	Normal = 1,
	EventsDisabled = 2,
}

export enum OcaSweepType {
	Linear = 1,
	Logarithmic = 2,
	None = 0,
}

export enum OcaTaskCommand {
	None = 0,
	Prepare = 1,
	Start = 3,
	Stop = 4,
	Abort = 5,
	Disable = 6,
	Clear = 7,
}

export enum OcaTaskGenericState {
	None = 0,
	Idle = 1,
	Ready = 2,
	Running = 3,
	Ended = 4,
}

export enum OcaTaskManagerState {
	None = 0,
	Enabled = 1,
	Disabled = 2,
}

export enum OcaTaskSchedulerState {
	Unknown = 0,
	Running = 1,
	Paused = 2,
	Draining = 3,
	Stopped = 4,
}

export enum OcaTaskState {
	None = 0,
	NotPrepared = 1,
	Disabled = 2,
	Enabled = 3,
	Running = 4,
	Completed = 5,
	Failed = 6,
	Stopped = 7,
	Aborted = 8,
}

export enum OcaTimeDeliveryMechanism {
	Undefined = 0,
	Local = 1,
	Private = 2,
	NTP = 3,
	SNTP = 4,
	IEEE8021AS = 8,
	StreamEndpoint = 9,
	AES11 = 11,
	TerrestrialRadio = 12,
	GPS = 13,
	Galileo = 14,
	GLONASS = 15,
	Beidou = 16,
	INRSS = 17,
	ExpansionBase = 128,
	// None = 1,
	IEEE1588v1 = 5,
	IEEE1588v2 = 6,
}

export enum OcaTimeMode {
	Absolute = 1,
	Relative = 2,
}

export enum OcaTimeReferenceType {
	Undefined = 0,
	Local = 1,
	Private = 2,
	TAI = 3,
	ExpansionBase = 128,
}

export enum OcaTimeSourceAvailability {
	Unavailable = 0,
	Available = 1,
}

export enum OcaTimeSourceSyncStatus {
	Undefined = 0,
	Unsynchronized = 1,
	Synchronizing = 2,
	Synchronized = 3,
}

export enum OcaUnitOfMeasure {
	Ampere = 4,
	DegreeCelsius = 2,
	Hertz = 1,
	None = 0,
	Ohm = 5,
	Volt = 3,
}

export enum OcaWaveformType {
	None = 0,
	DC = 1,
	Sine = 2,
	Square = 3,
	Impulse = 4,
	NoisePink = 5,
	NoiseWhite = 6,
	PolarityTest = 7,
}
/**
 * Maps (className, propertyName) → enum object.
 * Only properties whose runtime type is 'number' (i.e. numeric enums) are included,
 * since enumToDropdownChoices only handles numeric
 */
const PROPERTY_ENUM_MAP: Partial<
	Record<OcaClassName, Partial<Record<string, Record<string, string | number> | undefined>>>
> = {
	OcaMute: {
		State: OcaMuteState,
	},
	OcaPolarity: {
		State: OcaPolarityState,
	},
	OcaDelay: {
		DelayTime: undefined, // number, no enum
	},
	OcaDelayExtended: {
		DelayValue: undefined,
		DelayUnit: OcaDelayUnit,
	},
	OcaFilterClassical: {
		Shape: OcaClassicalFilterShape,
		Passband: OcaFilterPassband,
	},
	OcaFilterParametric: {
		Shape: OcaParametricEQShape,
	},
	OcaDynamics: {
		Function: OcaDynamicsFunction,
	},
	OcaDynamicsDetector: {
		Law: OcaLevelDetectionLaw,
	},
	OcaSignalGenerator: {
		Waveform: OcaWaveformType,
		SweepType: OcaSweepType,
	},
	OcaAudioLevelSensor: {
		Law: OcaLevelMeterLaw,
	},
	OcaSensor: {
		ReadingState: OcaSensorReadingState,
	},
	OcaGrouper: {
		Mode: OcaGrouperMode,
	},
	OcaRamper: {
		State: OcaRamperState,
		InterpolationLaw: OcaRamperInterpolationLaw,
	},
	OcaNumericObserver: {
		State: OcaObserverState,
		Operator: OcaRelationalOperator,
	},
	OcaNumericObserverList: {
		State: OcaObserverState,
		Operator: OcaRelationalOperator,
	},
	OcaPowerSupply: {
		Type: OcaPowerSupplyType,
		State: OcaPowerSupplyState,
		Location: OcaPowerSupplyLocation,
	},
	OcaMediaClock3: {
		Availability: OcaMediaClockAvailability,
		LockState: OcaMediaClockLockState,
	},
	OcaTimeSource: {
		Availability: OcaTimeSourceAvailability,
		Protocol: undefined, // OcaTimeProtocol is a struct, not a numeric enum
		SyncStatus: OcaTimeSourceSyncStatus,
	},
	OcaApplicationNetwork: {
		State: OcaApplicationNetworkState,
		ErrorCode: undefined,
	},
	OcaDeviceManager: {
		State: OcaDeviceState,
		ResetCause: OcaResetCause,
	},
	OcaPowerManager: {
		State: OcaPowerState,
	},
	OcaTaskManager: {
		State: OcaTaskManagerState,
	},
	// Legacy v1 classes
	OcaNetwork: {
		LinkType: OcaNetworkLinkType,
		MediaProtocol: OcaNetworkMediaProtocol,
		ControlProtocol: OcaNetworkControlProtocol,
		Status: OcaNetworkStatus,
	},
	OcaMediaClock: {
		Type: OcaMediaClockType,
		Availability: OcaMediaClockAvailability,
		LockState: OcaMediaClockLockState,
	},
	OcaStreamConnector: {
		Status: OcaStreamConnectorStatus,
	},
	OcaNetworkSignalChannel: {
		Status: OcaNetworkSignalChannelStatus,
	},
}

/**
 * Returns DropdownChoice<number>[] for the enum backing a class property,
 * or undefined if no enum mapping exists for that class+property combination.
 */
export function getPropertyEnumChoices(
	className: OcaClassName,
	propertyName: string,
): DropdownChoice<number>[] | undefined {
	const classMap = PROPERTY_ENUM_MAP[className]
	if (!classMap) return undefined
	if (!(propertyName in classMap)) return undefined
	const enumObj = classMap[propertyName]
	if (!enumObj) return undefined
	return enumToDropdownChoices(enumObj)
}
