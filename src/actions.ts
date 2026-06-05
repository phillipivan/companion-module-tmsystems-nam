import { type CompanionActionDefinitions, createModuleLogger } from '@companion-module/base'
import type ModuleInstance from './main.js'

export type ActionSchema = Record<string, never>

export function UpdateActions(self: ModuleInstance): void {
	const actionDefinitions: Partial<CompanionActionDefinitions<ActionSchema>> = {}
	const logger = createModuleLogger('Oca_Actions')
	logger.debug('Updating actions')
	self.setActionDefinitions(actionDefinitions)
}
