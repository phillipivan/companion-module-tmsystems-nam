import type {
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeResult,
	CompanionStaticUpgradeScript,
	CompanionUpgradeContext,
} from '@companion-module/base'
import type { ModuleConfig } from './config.js'

export const UpgradeScripts: CompanionStaticUpgradeScript<ModuleConfig>[] = [
	/*
	 * Place your upgrade scripts here
	 * Remember that once it has been added it cannot be removed!
	 */

	/**
	 * `batchCommands` was added after the fact. Existing connections have no
	 * stored value for it, so write it explicitly rather than leaving it
	 * undefined. `true` is what they were already doing — it maps to the
	 * library's own per-transport batch defaults — so this upgrade preserves
	 * existing behaviour rather than changing it.
	 */
	function setBatchCommandsDefault(
		_context: CompanionUpgradeContext<ModuleConfig>,
		props: CompanionStaticUpgradeProps<ModuleConfig, undefined>,
	): CompanionStaticUpgradeResult<ModuleConfig, undefined> {
		const config = props.config
		if (!config || config.batchCommands !== undefined) {
			return { updatedConfig: null, updatedActions: [], updatedFeedbacks: [] }
		}
		return {
			updatedConfig: { ...config, batchCommands: true },
			updatedActions: [],
			updatedFeedbacks: [],
		}
	},
]
