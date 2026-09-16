import {
	type CompanionActionDefinition,
	type CompanionActionDefinitions,
	type CompanionActionSchema,
	createModuleLogger,
	DropdownChoice,
	type SomeCompanionActionInputField,
} from '@companion-module/base'
import type ModuleInstance from './main.js'
import { ocaClassNameToLabel, excitementEmoji, makePropChoices, defaultPropertyName } from './utils.js'
import { type OcaClassName, OCA_CLASS_NAMES } from './consts/aes70-constants.js'
import type { JavaScriptType, PropertyDescription } from './OcaHelper.js'
import { enumChoices, enumExpressionDescription, isAes70Enum } from './enums.js'

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

type SetPropertyActionSchema = CompanionActionSchema<SetPropertyOptions, void>

export type ActionSchema = {
	[K in SetPropertyActionKey]: SetPropertyAction
}

export type SupportedPropertyType = 'string' | 'number' | 'boolean' | 'object'

function isSupportedPropertyType(type: JavaScriptType): type is SupportedPropertyType {
	return type === 'boolean' || type === 'string' || type === 'number' || type == 'object'
}

/**
 * The option value to learn from a property's current value, or `undefined` when
 * there is no input it could be learned into. aes70 represents enum values as
 * Enum instances, whereas the enum dropdown's choice ids are their numeric values.
 */
function toLearnedValue(value: unknown): boolean | string | number | undefined {
	if (typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number') return value
	if (isAes70Enum(value)) return value.valueOf()
	return undefined
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
			(p): p is PropertyDescription & { type: SupportedPropertyType } => p.write && isSupportedPropertyType(p.type),
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
		const propertyOptions: SomeCompanionActionInputField<keyof SetPropertyOptions>[] = []
		const definedProps: (PropertyDescription & {
			type: SupportedPropertyType
		})[] = []
		writableProps.forEach((prop) => {
			const inputId = `value_${prop.name}` as const
			const label = ocaClassNameToLabel(prop.name)
			const visibleExpr = `$(options:property) == '${prop.name}'`
			switch (prop.type) {
				case 'boolean':
					propertyOptions.push({
						type: 'checkbox',
						id: inputId,
						label,
						default: true,
						isVisibleExpression: visibleExpr,
					})
					definedProps.push(prop)
					break
				case 'string':
					propertyOptions.push({
						type: 'textinput',
						id: inputId,
						label,
						default: '',
						useVariables: true,
						isVisibleExpression: visibleExpr,
					})
					definedProps.push(prop)
					break
				case 'number':
					propertyOptions.push({
						type: 'number',
						id: inputId,
						label,
						default: 0,
						min: -Number.MAX_VALUE,
						max: Number.MAX_VALUE,
						isVisibleExpression: visibleExpr,
					})
					definedProps.push(prop)
					break
				case 'object': {
					const choices = prop.enumValues ? enumChoices(prop.enumValues) : []
					if (prop.enumValues && choices.length > 0) {
						propertyOptions.push({
							type: 'dropdown',
							id: inputId,
							label,
							default: choices[0]?.id ?? 0,
							choices,
							allowCustom: false,
							isVisibleExpression: visibleExpr,
							expressionDescription: enumExpressionDescription(prop.enumValues),
						})
						definedProps.push(prop)
					}
					// An object-typed property that isn't an enum is a struct or other complex
					// type, which can't be represented as a simple input, so it is skipped
					break
				}
				default: {
					const _exhaustive: never = prop.type
					throw new Error(`Unhandled property type: ${_exhaustive}`)
				}
			}
		})

		const propertyChoices: DropdownChoice<string>[] = makePropChoices(definedProps)
		options.push({
			type: 'dropdown',
			id: 'property',
			label: 'Property',
			choices: propertyChoices,
			// Choices come from the device at runtime; this is the class's own property among them
			default: defaultPropertyName(definedProps) ?? '',
			disableAutoExpression: true,
		})
		propertyOptions.forEach((prop) => options.push(prop))
		const actionDefinition: CompanionActionDefinition<SetPropertyActionSchema> = {
			name: `${ocaClassNameToLabel(className)} - Set Property`,
			options: options,
			optionsToMonitorForSubscribe: ['objectId'],
			skipUnsubscribeOnOptionsChange: false,
			hasResult: false,
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
					if (name === property) propValue = toLearnedValue(value)
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
