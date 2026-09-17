import { describe, it, expect } from 'vitest'
import { OcaModelDescription } from 'aes70/src/types/OcaModelDescription.js'
import { OcaProduct } from 'aes70/src/types/OcaProduct.js'
import { OcaManufacturer } from 'aes70/src/types/OcaManufacturer.js'
import { readDeviceInfo, type DeviceInfoSource } from '../deviceInfo.js'

/** What aes70 rejects with for a getter the device doesn't implement. */
const notImplemented = async (): Promise<never> => {
	throw new Error('Call failed with OcaStatus NotImplemented')
}

/** A device manager answering nothing, as a base for fakes to override. */
const refusesEverything: DeviceInfoSource = {
	GetOcaVersion: notImplemented,
	GetDeviceName: notImplemented,
	GetDeviceRole: notImplemented,
	GetSerialNumber: notImplemented,
	GetUserInventoryCode: notImplemented,
	GetDeviceRevisionID: notImplemented,
	GetModelDescription: notImplemented,
	GetManufacturer: notImplemented,
	GetProduct: notImplemented,
}

/**
 * Captured from a T&M Media NAM (model version 3, serial 2c87d6) on 2026-09-17, in normal
 * operation over TCP. Every other device manager getter was refused with NotImplemented.
 */
const namDeviceManager: DeviceInfoSource = {
	...refusesEverything,
	GetOcaVersion: async () => 2,
	GetSerialNumber: async () => '2c87d6',
	GetDeviceName: async () => 'NAM-2c87d6',
	GetModelDescription: async () => new OcaModelDescription('T&M Media', 'NAM', '3'),
}

describe('readDeviceInfo', () => {
	it('keeps what a T&M Media NAM answers, leaving out what it refuses', async () => {
		expect(await readDeviceInfo(namDeviceManager)).toEqual({
			oca_version: 2,
			device_name: 'NAM-2c87d6',
			serial_number: '2c87d6',
			model_manufacturer: 'T&M Media',
			model_name: 'NAM',
			model_version: '3',
		})
	})

	it('includes product and manufacturer details from a device that returns them', async () => {
		const info = await readDeviceInfo({
			...refusesEverything,
			GetProduct: async () =>
				new OcaProduct('Amp', 'AMP-4', '1.2', 'Example Audio', 'urn:uuid:1234', 'Four channel amplifier'),
			GetManufacturer: async () =>
				new OcaManufacturer(
					'Example Audio',
					new Uint8Array([1, 2, 3]),
					'https://example.com',
					'sales@example.com',
					'support@example.com',
				),
		})

		expect(info).toEqual({
			manufacturer_name: 'Example Audio',
			manufacturer_website: 'https://example.com',
			manufacturer_business_contact: 'sales@example.com',
			manufacturer_technical_contact: 'support@example.com',
			product_name: 'Amp',
			product_model_id: 'AMP-4',
			product_revision_level: '1.2',
			product_brand_name: 'Example Audio',
			product_uuid: 'urn:uuid:1234',
			product_description: 'Four channel amplifier',
		})
	})

	it('leaves out empty strings, which are not a value to offer', async () => {
		const info = await readDeviceInfo({
			...namDeviceManager,
			GetUserInventoryCode: async () => '',
			GetModelDescription: async () => new OcaModelDescription('T&M Media', 'NAM', ''),
		})

		expect(info).not.toHaveProperty('user_inventory_code')
		expect(info).not.toHaveProperty('model_version')
		expect(info).toMatchObject({ model_manufacturer: 'T&M Media', model_name: 'NAM' })
	})

	it('returns nothing for a device that answers none of it', async () => {
		expect(await readDeviceInfo(refusesEverything)).toEqual({})
	})

	it('stops waiting when its signal aborts', async () => {
		const controller = new AbortController()
		const reading = readDeviceInfo(
			{ ...refusesEverything, GetDeviceName: async () => new Promise<string>(() => undefined) },
			controller.signal,
		)

		controller.abort(new Error('superseded'))

		await expect(reading).rejects.toThrow('superseded')
	})
})
