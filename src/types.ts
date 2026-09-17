// import type { InstanceBase } from '@companion-module/base'
import type { ModuleConfig } from './config.js'
import type { ActionSchema } from './actions.js'
import type { FeedbackSchema } from './feedbacks.js'
import type { VariablesSchema } from './variables.js'

export interface OcaModuleTypes {
	config: ModuleConfig
	secrets: undefined
	actions: ActionSchema
	feedbacks: FeedbackSchema
	variables: VariablesSchema
}
