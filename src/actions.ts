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
import { enumChoices, enumExpressionDescription, isAes70Enum } from './enums.js'
import { settablePropertiesOf, type SettableProperty } from './aes70Properties.js'

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

/** The value input for a settable property, visible only while that property is selected. */
function valueInputFor(prop: SettableProperty): SomeCompanionActionInputField<keyof SetPropertyOptions> {
	const id = `value_${prop.name}` as const
	const label = ocaClassNameToLabel(prop.name)
	const isVisibleExpression = `$(options:property) == '${prop.name}'`

	switch (prop.kind) {
		case 'boolean':
			return { type: 'checkbox', id, label, default: true, isVisibleExpression }
		case 'string':
			return { type: 'textinput', id, label, default: '', useVariables: true, isVisibleExpression }
		case 'number':
			return {
				type: 'number',
				id,
				label,
				default: 0,
				min: -Number.MAX_VALUE,
				max: Number.MAX_VALUE,
				isVisibleExpression,
			}
		case 'enum': {
			const choices = enumChoices(prop.enumValues)
			return {
				type: 'dropdown',
				id,
				label,
				default: choices[0]?.id ?? 0,
				choices,
				allowCustom: false,
				isVisibleExpression,
				expressionDescription: enumExpressionDescription(prop.enumValues),
			}
		}
		default: {
			const _exhaustive: never = prop
			throw new Error(`Unhandled property kind: ${JSON.stringify(_exhaustive)}`)
		}
	}
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
		const [samplePath] = self.ocaHelper.getByClass(className)
		const sample = samplePath === undefined ? undefined : self.ocaHelper.getEntry(samplePath)
		if (!sample) continue

		// Value inputs follow aes70's class definition, so they stay the same however many properties are
		// discovered on the device, and every action has a stored value for each of them from creation
		const settable = settablePropertiesOf(sample.obj)
		const settableNames = new Set(settable.map((prop) => prop.name))
		// The Property dropdown offers only what objects of the class are known to implement
		const offered = (await self.ocaHelper.getClassProperties(className)).filter((prop) => settableNames.has(prop.name))
		if (offered.length === 0) {
			logger.debug(`Skipping action definition for class ${className}: no settable properties known to be implemented`)
			continue
		}
		logger.debug(
			`Class ${className} has ${objectChoices.length} objects, and ${offered.length} of its ${settable.length} settable properties are known to be implemented`,
		)

		const propertyChoices: DropdownChoice<string>[] = makePropChoices(offered)
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
			{
				type: 'dropdown',
				id: 'property',
				label: 'Property',
				choices: propertyChoices,
				// Choices come from the device at runtime; this is the class's own property among them
				default: defaultPropertyName(offered) ?? '',
				disableAutoExpression: true,
			},
			...settable.map(valueInputFor),
		]

		const actionDefinition: CompanionActionDefinition<SetPropertyActionSchema> = {
			name: `${ocaClassNameToLabel(className)} - Set Property`,
			options: options,
			optionsToMonitorForSubscribe: ['objectId'],
			// Companion re-sends every action whenever definitions change, which they do as properties are
			// discovered. Unsubscribing first would drop an object's only registration and read all of its
			// properties from the device again each time. addActionId moves a registration when the object changes.
			skipUnsubscribeOnOptionsChange: true,
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
