import {
	type CompanionValueFeedbackDefinition,
	type CompanionFeedbackDefinitions,
	createModuleLogger,
	type DropdownChoice,
	SomeCompanionFeedbackInputField,
} from '@companion-module/base'
import type ModuleInstance from './main.js'
import { ocaClassNameToLabel, makeSafeJsonValue, unwrapValue } from './utils.js'
import { type OcaClassName, OCA_CLASS_NAMES } from './consts/aes70-constants.js'

type GetPropertyFeedbackKey = `get_property_${OcaClassName}`

type GetPropertyOptions = {
	objectId: string
	property: string
	sync: boolean
}

type GetPropertyFeedback = {
	type: 'value'
	options: GetPropertyOptions
}

export type FeedbackSchema = {
	[K in GetPropertyFeedbackKey]: GetPropertyFeedback
}

function completeFeedbackSchema(
	partial: Partial<CompanionFeedbackDefinitions<FeedbackSchema>>,
): CompanionFeedbackDefinitions<FeedbackSchema> {
	const schema = {} as Partial<CompanionFeedbackDefinitions<FeedbackSchema>>
	for (const className of Object.values(OCA_CLASS_NAMES)) {
		const key: GetPropertyFeedbackKey = `get_property_${className}`
		schema[key] = partial[key] // undefined when not built for this class
	}
	return schema as CompanionFeedbackDefinitions<FeedbackSchema>
}

export async function UpdateFeedbacks(self: ModuleInstance): Promise<void> {
	const feedbackDefinitions: Partial<CompanionFeedbackDefinitions<FeedbackSchema>> = {}
	const logger = createModuleLogger('OCA Feedbacks')
	logger.debug('Updating feedbacks')
	const classes = self.ocaHelper.getClassNames()

	for (const className of classes) {
		const objectChoices = self.ocaHelper.getChoicesByClass(className)
		const properties = await self.ocaHelper.getClassProperties(className)

		if (properties.filter((p) => p.read).length === 0) {
			logger.debug(`Skipping feedback definition for class ${className} since it has no readable properties`)
			continue
		}

		logger.debug(
			`Class ${className} has ${objectChoices.length} objects and ${properties.filter((p) => p.read).length} readable properties`,
		)
		const options: SomeCompanionFeedbackInputField<keyof GetPropertyOptions>[] = [
			{
				type: 'dropdown',
				id: 'objectId',
				label: 'Control Object',
				choices: objectChoices,
				default: objectChoices[0]?.id,
				allowCustom: false,
				allowInvalidValues: false,
			},
		]
		const propertyChoices: DropdownChoice[] = []
		properties.forEach((prop) => {
			if (prop.read) propertyChoices.push({ id: prop.name, label: ocaClassNameToLabel(prop.name) })
		})
		if (propertyChoices.length == 0) {
			logger.debug(`No valid properties for ${className} skipping feedback definition`)
			continue
		}
		options.push({
			type: 'dropdown',
			id: 'property',
			label: 'Property',
			choices: propertyChoices,
			default: propertyChoices[0]?.id,
			disableAutoExpression: false,
		})
		options.push({
			type: 'checkbox',
			id: 'sync',
			label: 'Use Property Sync',
			default: true,
			description: 'May return complex data structure when false',
		})
		const feedbackDefinition: CompanionValueFeedbackDefinition<GetPropertyOptions> = {
			name: `${ocaClassNameToLabel(className)} - Get Property`,
			type: 'value',
			options: options,
			callback: async (feedback) => {
				const objectId = feedback.options.objectId
				const oldId = feedback.previousOptions?.objectId
				if (objectId !== oldId) {
					await self.ocaHelper.addFeedbackId(objectId, feedback.id)
				}
				const property = feedback.options.property
				const sync = feedback.options.sync
				const entry = self.ocaHelper.getEntry(objectId)
				if (!entry) {
					logger.warn(`No entry found for objectId ${objectId}. Aborting feedback check ${feedback.id}`)
					return null
				}
				if (sync) {
					let propValue: any = undefined
					entry.properties?.forEach((value, name) => {
						if (name === property && value !== undefined) {
							propValue = value
						}
					})
					if (propValue !== undefined) return unwrapValue(await makeSafeJsonValue(propValue, { awaitPromises: true }))

					// If properties sync check failed
					logger.debug(`property: ${property} not found in entry.properties, trying async getter`)
				}

				const getterName = `Get${property}`
				const getter = (entry.obj as unknown as Record<string, unknown>)[getterName]
				if (typeof getter !== 'function') {
					logger.warn(
						`No getter '${getterName}' found on object at '${objectId}'. Aborting feedback check ${feedback.id}`,
					)
					return null
				}
				const result = await (getter as () => Promise<unknown>).call(entry.obj)
				return await makeSafeJsonValue(result, { awaitPromises: true })
			},
			unsubscribe: async (feedback) => {
				self.ocaHelper.removeFeedbackId(feedback.id)
			},
		}
		feedbackDefinitions[`get_property_${className}`] = feedbackDefinition
	}

	logger.info(`Completed feedback definitions: ${Object.keys(feedbackDefinitions).length} feedbacks defined`)

	self.setFeedbackDefinitions(completeFeedbackSchema(feedbackDefinitions))
}
