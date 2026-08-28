import { describe, it, expect } from 'vitest'
import type { CompanionStaticUpgradeProps, CompanionUpgradeContext } from '@companion-module/base'
import { UpgradeScripts } from '../upgrades.js'
import type { ModuleConfig } from '../config.js'

function runUpgrades(config: ModuleConfig | null): ModuleConfig | null {
	let current = config
	for (const script of UpgradeScripts) {
		const context = { currentConfig: current } as CompanionUpgradeContext<ModuleConfig>
		const props: CompanionStaticUpgradeProps<ModuleConfig, undefined> = {
			config: current,
			secrets: null,
			actions: [],
			feedbacks: [],
		}
		const result = script(context, props)
		if (result.updatedConfig) current = result.updatedConfig
	}
	return current
}

const baseConfig: ModuleConfig = { host: '192.168.1.10', port: 65000, protocol: 'tcp' }

describe('upgrade scripts', () => {
	// true preserves the behaviour existing connections already had: it maps to
	// the library's own per-transport batch defaults, so adding the option
	// changes nothing until someone deliberately turns it off.
	it('backfills batchCommands to true when an existing config has no value for it', () => {
		const upgraded = runUpgrades({ ...baseConfig })

		expect(upgraded?.batchCommands).toBe(true)
	})

	it('preserves an explicit batchCommands: true rather than overwriting it', () => {
		const upgraded = runUpgrades({ ...baseConfig, batchCommands: true })

		expect(upgraded?.batchCommands).toBe(true)
	})

	it('leaves an explicit batchCommands: false alone', () => {
		const upgraded = runUpgrades({ ...baseConfig, batchCommands: false })

		expect(upgraded?.batchCommands).toBe(false)
	})

	it('leaves every other config field untouched', () => {
		const upgraded = runUpgrades({ ...baseConfig, bonjourHost: 'device._oca._tcp.local.' })

		expect(upgraded).toMatchObject({
			host: '192.168.1.10',
			port: 65000,
			protocol: 'tcp',
			bonjourHost: 'device._oca._tcp.local.',
		})
	})

	it('does not throw on a null config', () => {
		expect(() => runUpgrades(null)).not.toThrow()
		expect(runUpgrades(null)).toBeNull()
	})
})
