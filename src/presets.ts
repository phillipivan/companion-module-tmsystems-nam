import type { CompanionPresetDefinitions, CompanionPresetSection } from '@companion-module/base'
import type ModuleInstance from './main.js'
import type { OcaModuleTypes } from './types.js'
import { excitementEmoji } from './utils.js'
import { logger } from './presets/consts.js'
import { getToggleGroups } from './presets/toggles.js'
import { getRotaryGroups } from './presets/rotaries.js'
import { getMeterGroups } from './presets/meters.js'
import { getEqualiserGroups } from './presets/equalisers.js'

/**
 * Define a section of presets per category, each building its own groups and adding its buttons to the
 * one `presets` map. A section with nothing in it is left out, so a device only offers what it has.
 * Call after the actions and feedbacks are defined, since the presets use them.
 *
 * Add a category by writing its file under `presets/` and listing its getter here.
 */
export async function UpdatePresets(self: ModuleInstance): Promise<void> {
	const presets: CompanionPresetDefinitions<OcaModuleTypes> = {}
	const sections: CompanionPresetSection<OcaModuleTypes>[] = [
		{ id: 'toggles', name: 'Toggles', definitions: await getToggleGroups(self, presets) },
		{ id: 'rotaries', name: 'Rotaries', definitions: await getRotaryGroups(self, presets) },
		{ id: 'meters', name: 'Meters', definitions: await getMeterGroups(self, presets) },
		{ id: 'equalisers', name: 'Equalisers', definitions: await getEqualiserGroups(self, presets) },
	]

	const presetCount = Object.keys(presets).length
	logger.info(`Completed preset definitions: ${presetCount} presets defined (${excitementEmoji(presetCount / 10)})`)
	self.setPresetDefinitions(
		sections.filter((section) => section.definitions.length > 0),
		presets,
	)
}
