import {
	type CompanionActionDefinition,
	type CompanionActionDefinitions,
	//type CompanionOptionValues,
	createModuleLogger,
	DropdownChoice,
	type SomeCompanionActionInputField,
} from '@companion-module/base'
import type ModuleInstance from './main.js'
import { ocaClassNameToLabel, excitementEmoji, makePropChoices } from './utils.js'
import { type OcaClassName, OCA_CLASS_NAMES } from './consts/aes70-constants.js'

type SetPropertyActionKey = `set_property_${OcaClassName}`

type SetPropertyOptions = {
	objectId: string
	property: string
} & {
	[K in `value_${string}`]: string | number | boolean
}

type SetPropertyAction = {
	options: SetPropertyOptions
}

export type ActionSchema = {
	[K in SetPropertyActionKey]: SetPropertyAction
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
		const writableProps = properties.filter(
			(p) => p.write && (p.type === 'boolean' || p.type == 'string' || p.type == 'number'),
		)
		if (writableProps.length === 0) {
			logger.debug(
				`Skipping action definition for class ${className} since it has no writable properties of a supported type`,
			)
			continue
		}
		logger.debug(
			`Class ${className} has ${objectChoices.length} objects and ${writableProps.length} writable properties of supported types`,
		)
		const options: SomeCompanionActionInputField<keyof SetPropertyOptions>[] = [
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
		const propertyChoices: DropdownChoice<string>[] = makePropChoices(writableProps)
		const propertyOptions: SomeCompanionActionInputField<keyof SetPropertyOptions>[] = []
		writableProps.forEach((prop) => {
			const inputId = `value_${prop.name}` as const
			const label = ocaClassNameToLabel(prop.name)
			if (prop.type === 'boolean') {
				propertyOptions.push({
					type: 'checkbox',
					id: inputId,
					label: label,
					default: true,
					isVisibleExpression: `$(options:property) == '${prop.name}'`,
				})
			} else if (prop.type === 'string') {
				propertyOptions.push({
					type: 'textinput',
					id: inputId,
					label: label,
					default: '',
					useVariables: true,
					isVisibleExpression: `$(options:property) == '${prop.name}'`,
				})
			} else if (prop.type === 'number') {
				propertyOptions.push({
					type: 'number',
					id: inputId,
					label: label,
					default: 0,
					min: -Number.MAX_VALUE, // Since each control object can declare its own acceptable input range, don't try and enforce it here
					max: Number.MAX_VALUE,
					isVisibleExpression: `$(options:property) == '${prop.name}'`,
				})
			}
			//propertyChoices.push({ id: prop.name, label: label })
		})

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
				const objectId = action.options.objectId
				if (objectId) {
					await self.ocaHelper.addActionId(objectId, action.id)
				}
			},
			unsubscribe: (action) => {
				self.ocaHelper.removeActionId(action.id)
			},
			learn: async (action) => {
				const objectId = action.options.objectId
				const property = action.options.property
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
				const objectId = action.options.objectId
				const property = action.options.property
				const value = action.options[`value_${property}`]

				const entry = self.ocaHelper.getEntry(objectId)
				if (!entry) {
					throw new Error(`No entry found for objectId ${objectId}. Aborting action ${action.id}`)
				}
				const setterName = `Set${property}`
				const setter = (entry.obj as unknown as Record<string, unknown>)[setterName]
				if (typeof setter !== 'function') {
					throw new Error(`No setter '${setterName}' found on object at '${objectId}'. Aborting action ${action.id}`)
				}
				await (setter as (v: boolean | string | number) => Promise<void>).call(entry.obj, value)
			},
		}
		actionDefinitions[`set_property_${className}`] = actionDefinition
	}

	const actionCount = Object.keys(actionDefinitions).length
	logger.info(`Completed action definitions: ${actionCount} actions defined (${excitementEmoji(actionCount)})`)

	self.setActionDefinitions(completeActionSchema(actionDefinitions))
}
