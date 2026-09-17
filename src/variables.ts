import { createModuleLogger, type CompanionVariableDefinitions } from '@companion-module/base'
import type ModuleInstance from './main.js'
import { DEVICE_INFO_VARIABLES, type DeviceInfo, type DeviceInfoVariableId } from './deviceInfo.js'
import { excitementEmoji } from './utils.js'

/** Every variable is optional: each is only defined when the connected device returned its value. */
export type VariablesSchema = DeviceInfo

/**
 * Define a variable for each piece of identity the connected device returned, and set
 * their values. Anything the device didn't return has no variable at all, rather than
 * an empty one.
 */
export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const logger = createModuleLogger('OCA Variables')
	const info = self.deviceInfo

	const definitions: CompanionVariableDefinitions<VariablesSchema> = {}
	for (const id of Object.keys(DEVICE_INFO_VARIABLES) as DeviceInfoVariableId[]) {
		if (info[id] !== undefined) definitions[id] = { name: DEVICE_INFO_VARIABLES[id] }
	}

	const variableCount = Object.keys(definitions).length

	logger.info(`Defining ${variableCount} device variables (${excitementEmoji(variableCount * 5)})`)
	self.setVariableDefinitions(definitions)
	self.setVariableValues(info)
}
