import {
	type CompanionActionDefinition,
	type CompanionActionDefinitions,
	//type CompanionOptionValues,
	createModuleLogger,
	DropdownChoice,
	type SomeCompanionActionInputField,
} from '@companion-module/base'
import type ModuleInstance from './main.js'
import { ocaClassNameToLabel } from './utils.js'
import { type OcaClassName, OCA_CLASS_NAMES } from './consts/aes70-constants.js'

type SetPropertyActionKey = `set_property_${OcaClassName}`
// Produces: "set_property_OcaGain" | "set_property_OcaMute" | "set_property_OcaDelay" | ...

type SetPropertyOptions = {
	objectId: string
	property: string
	[key: string]: string | number | boolean
}

type SetPropertyAction = {
	options: SetPropertyOptions
}

export type ActionSchema = {
	[K in SetPropertyActionKey]: SetPropertyAction
}

export function isCompleteActionDefinition(
	def: Partial<CompanionActionDefinition<SetPropertyOptions>>,
): def is CompanionActionDefinition<SetPropertyOptions> {
	return typeof def.name === 'string' && Array.isArray(def.options) && typeof def.callback === 'function'
}

function completeActionSchema(
	partial: Partial<CompanionActionDefinitions<ActionSchema>>,
): CompanionActionDefinitions<ActionSchema> {
	const schema = {} as Partial<CompanionActionDefinitions<ActionSchema>>
	for (const className of Object.values(OCA_CLASS_NAMES)) {
		const key: SetPropertyActionKey = `set_property_${className}`
		schema[key] = partial[key] // undefined when not built for this class
	}
	return schema as CompanionActionDefinitions<ActionSchema>
}

export async function UpdateActions(self: ModuleInstance): Promise<void> {
	const actionDefinitions: Partial<CompanionActionDefinitions<ActionSchema>> = {}
	const logger = createModuleLogger('OCA Actions')
	logger.debug('Updating actions')
	const classes = self.ocaHelper.getClassNames()

	for (const className of classes) {
		const objectChoices = self.ocaHelper.getChoicesByClass(className)
		const properties = await self.ocaHelper.getClassProperties(className)

		if (properties.filter((p) => p.write).length === 0) {
			logger.debug(`Skipping action definition for class ${className} since it has no writable properties`)
			continue
		} else
			logger.debug(
				`Class ${className} has ${objectChoices.length} objects and ${properties.filter((p) => p.write).length} writable properties`,
			)
		const options: SomeCompanionActionInputField<string>[] = [
			{
				type: 'dropdown',
				id: 'objectId',
				label: 'Object',
				choices: objectChoices,
				default: objectChoices[0]?.id,
			},
		]
		const propertyChoices: DropdownChoice[] = []
		const propertyOptions: SomeCompanionActionInputField[] = []
		properties.forEach((prop) => {
			if (prop.write) {
				if (prop.type === 'boolean') {
					propertyOptions.push({
						type: 'checkbox',
						id: `value_${prop.name}`,
						label: ocaClassNameToLabel(prop.name),
						default: true,
						isVisibleExpression: `$(options:property) == '${prop.name}'`,
					})
					propertyChoices.push({ id: prop.name, label: ocaClassNameToLabel(prop.name) })
				} else if (prop.type === 'string') {
					propertyOptions.push({
						type: 'textinput',
						id: `value_${prop.name}`,
						label: ocaClassNameToLabel(prop.name),
						default: '',
						isVisibleExpression: `$(options:property) == '${prop.name}'`,
					})
					propertyChoices.push({ id: prop.name, label: ocaClassNameToLabel(prop.name) })
				} else if (prop.type === 'number') {
					propertyOptions.push({
						type: 'number',
						id: `value_${prop.name}`,
						label: ocaClassNameToLabel(prop.name),
						default: 0,
						min: 0, // needs to change
						max: 100, // needs to change
						isVisibleExpression: `$(options:property) == '${prop.name}'`,
					})
					propertyChoices.push({ id: prop.name, label: ocaClassNameToLabel(prop.name) })
				}
			}
		})
		if (propertyChoices.length == 0) {
			logger.debug(`No valid properties for ${className} skipping action definition`)
			continue
		}
		options.push({
			type: 'dropdown',
			id: 'property',
			label: 'Property',
			choices: propertyChoices,
			default: propertyChoices[0]?.id,
			disableAutoExpression: true,
		})
		propertyOptions.forEach((prop) => options.push(prop))
		const actionDefinition: CompanionActionDefinition<SetPropertyOptions> = {
			name: `${ocaClassNameToLabel(className)} - Set Property`,
			options: options,
			optionsToMonitorForSubscribe: ['objectId'],
			skipUnsubscribeOnOptionsChange: false,
			subscribe: async (action) => {
				const objectId = String(action.options.objectId)
				if (objectId) {
					await self.ocaHelper.addActionId(objectId, action.id)
				}
			},
			unsubscribe: (action) => {
				self.ocaHelper.removeActionId(action.id)
			},
			learn: async (action) => {
				const objectId = String(action.options.objectId)
				const property = String(action.options.property)
				logger.debug(`Learning action for objectId ${objectId} and property ${property}`)
				const entry = self.ocaHelper.getEntry(objectId)
				if (!entry) {
					logger.warn(`No entry found for objectId ${objectId}`)
					return undefined
				}
				// PropertySync does not support index access — iterate to find the value
				let propValue: boolean | string | number | undefined
				entry.properties?.forEach((value, name) => {
					if (
						name === property &&
						(typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number')
					) {
						propValue = value
					}
				})
				if (propValue === undefined) {
					logger.warn(`Property ${property} not found or has unsupported type on entry with objectId ${objectId}`)
					return undefined
				}
				return { [`value_${property}`]: propValue }
			},
			callback: async (action) => {
				const objectId = String(action.options.objectId)
				const property = String(action.options.property)
				const valueOption = action.options[`value_${property}`]
				let value: boolean | string | number
				if (typeof valueOption === 'boolean' || typeof valueOption === 'string' || typeof valueOption === 'number') {
					value = valueOption
				} else {
					logger.warn(`Unsupported value type for property ${property}: ${typeof valueOption}`)
					return
				}
				const entry = self.ocaHelper.getEntry(objectId)
				if (!entry) {
					logger.warn(`No entry found for objectId ${objectId}`)
					return
				}
				const setterName = `Set${property}`
				const setter = (entry.obj as unknown as Record<string, unknown>)[setterName]
				if (typeof setter !== 'function') {
					logger.warn(`No setter '${setterName}' found on object at '${objectId}'`)
					return
				}
				await (setter as (v: boolean | string | number) => Promise<void>).call(entry.obj, value)
			},
		}
		actionDefinitions[`set_property_${className}`] = actionDefinition
	}

	logger.info(`Completed action definitions: ${Object.keys(actionDefinitions).length} actions defined`)

	self.setActionDefinitions(completeActionSchema(actionDefinitions))
}
