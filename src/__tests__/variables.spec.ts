import { describe, it, expect, vi } from 'vitest'
import type ModuleInstance from '../main.js'
import type { DeviceInfo } from '../deviceInfo.js'
import { UpdateVariableDefinitions } from '../variables.js'

function fakeInstance(deviceInfo: DeviceInfo): {
	self: ModuleInstance
	setVariableDefinitions: ReturnType<typeof vi.fn>
	setVariableValues: ReturnType<typeof vi.fn>
} {
	const setVariableDefinitions = vi.fn()
	const setVariableValues = vi.fn()
	const self = { deviceInfo, setVariableDefinitions, setVariableValues } as unknown as ModuleInstance
	return { self, setVariableDefinitions, setVariableValues }
}

describe('UpdateVariableDefinitions', () => {
	it('defines a variable only for each piece of identity the device returned, and sets its value', () => {
		// What a T&M Media NAM returns: it refuses the product, manufacturer and the rest
		const nam: DeviceInfo = {
			oca_version: 2,
			device_name: 'NAM-2c87d6',
			serial_number: '2c87d6',
			model_manufacturer: 'T&M Media',
			model_name: 'NAM',
			model_version: '3',
		}
		const { self, setVariableDefinitions, setVariableValues } = fakeInstance(nam)

		UpdateVariableDefinitions(self)

		expect(setVariableDefinitions).toHaveBeenCalledExactlyOnceWith({
			oca_version: { name: 'AES70 version' },
			device_name: { name: 'Device name' },
			serial_number: { name: 'Serial number' },
			model_manufacturer: { name: 'Model manufacturer' },
			model_name: { name: 'Model name' },
			model_version: { name: 'Model version' },
		})
		expect(setVariableValues).toHaveBeenCalledExactlyOnceWith(nam)
	})

	it('defines no variables when the device returned nothing', () => {
		const { self, setVariableDefinitions } = fakeInstance({})

		UpdateVariableDefinitions(self)

		expect(setVariableDefinitions).toHaveBeenCalledExactlyOnceWith({})
	})
})
