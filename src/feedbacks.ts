import { type CompanionFeedbackDefinitions, createModuleLogger } from '@companion-module/base'
import type ModuleInstance from './main.js'

export type FeedbackSchema = Record<string, never>

export function UpdateFeedbacks(self: ModuleInstance): void {
	const feedbackDefinitions: Partial<CompanionFeedbackDefinitions<FeedbackSchema>> = {}
	const logger = createModuleLogger('OCA Feedbacks')
	logger.debug('Updating feedbacks')
	self.setFeedbackDefinitions(feedbackDefinitions)
}
