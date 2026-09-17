import type { OcaDeviceManager } from 'aes70/src/controller/ControlClasses.js'
import { abortable } from './utils.js'

/**
 * The device identity offered as variables, by variable id, with each variable's name.
 * Every one of these comes from an OcaDeviceManager getter, and AES70 makes all of them
 * optional: a T&M Media NAM, for one, answers the version, serial number, device name and
 * model description, and refuses the rest as NotImplemented.
 */
export const DEVICE_INFO_VARIABLES = {
	oca_version: 'AES70 version',
	device_name: 'Device name',
	device_role: 'Device role',
	serial_number: 'Serial number',
	user_inventory_code: 'User inventory code',
	device_revision_id: 'Device revision',
	model_manufacturer: 'Model manufacturer',
	model_name: 'Model name',
	model_version: 'Model version',
	manufacturer_name: 'Manufacturer',
	manufacturer_website: 'Manufacturer website',
	manufacturer_business_contact: 'Manufacturer business contact',
	manufacturer_technical_contact: 'Manufacturer technical contact',
	product_name: 'Product name',
	product_model_id: 'Product model ID',
	product_revision_level: 'Product revision',
	product_brand_name: 'Product brand',
	product_uuid: 'Product UUID',
	product_description: 'Product description',
} as const

export type DeviceInfoVariableId = keyof typeof DEVICE_INFO_VARIABLES

/** The identity a device returned. A field it didn't return is absent, never empty. */
export type DeviceInfo = { [K in DeviceInfoVariableId]?: string | number }

export type DeviceInfoSource = Pick<
	OcaDeviceManager,
	| 'GetOcaVersion'
	| 'GetDeviceName'
	| 'GetDeviceRole'
	| 'GetSerialNumber'
	| 'GetUserInventoryCode'
	| 'GetDeviceRevisionID'
	| 'GetModelDescription'
	| 'GetManufacturer'
	| 'GetProduct'
>

const READS: readonly ((deviceManager: DeviceInfoSource) => Promise<DeviceInfo>)[] = [
	async (dm) => ({ oca_version: await dm.GetOcaVersion() }),
	async (dm) => ({ device_name: await dm.GetDeviceName() }),
	async (dm) => ({ device_role: await dm.GetDeviceRole() }),
	async (dm) => ({ serial_number: await dm.GetSerialNumber() }),
	async (dm) => ({ user_inventory_code: await dm.GetUserInventoryCode() }),
	async (dm) => ({ device_revision_id: await dm.GetDeviceRevisionID() }),
	async (dm) => {
		const model = await dm.GetModelDescription()
		return { model_manufacturer: model.Manufacturer, model_name: model.Name, model_version: model.Version }
	},
	async (dm) => {
		// OrganizationID is left out: it is a byte string, not text
		const manufacturer = await dm.GetManufacturer()
		return {
			manufacturer_name: manufacturer.Name,
			manufacturer_website: manufacturer.Website,
			manufacturer_business_contact: manufacturer.BusinessContact,
			manufacturer_technical_contact: manufacturer.TechnicalContact,
		}
	},
	async (dm) => {
		const product = await dm.GetProduct()
		return {
			product_name: product.Name,
			product_model_id: product.ModelID,
			product_revision_level: product.RevisionLevel,
			product_brand_name: product.BrandName,
			product_uuid: product.UUID,
			product_description: product.Description,
		}
	},
]

/**
 * Read everything the device will say about itself, all at once. A getter the device
 * refuses, and an empty string it returns, just leave that field out. Rejects only when
 * `signal` aborts.
 */
export async function readDeviceInfo(deviceManager: DeviceInfoSource, signal?: AbortSignal): Promise<DeviceInfo> {
	const results = await abortable(Promise.allSettled(READS.map(async (read) => read(deviceManager))), signal)

	const info: DeviceInfo = {}
	for (const result of results) {
		if (result.status !== 'fulfilled') continue
		for (const [id, value] of Object.entries(result.value) as [DeviceInfoVariableId, string | number | undefined][]) {
			if (value === undefined || value === '') continue
			info[id] = value
		}
	}
	return info
}
