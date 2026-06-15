import { createModuleLogger } from '@companion-module/base'
import type ModuleInstance from './main.js'

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const logger = createModuleLogger('OCA Variables')
	logger.debug('Updating variables... there are none 😀')
	self.setVariableDefinitions({})
}
