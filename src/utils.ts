import { ModuleConfig } from './config.js'
import { createModuleLogger } from '@companion-module/base'

const utilsLogger = createModuleLogger('Generic OCA Utils')

export function handleBonjourHost(config: ModuleConfig): ModuleConfig {
	if (config.bonjourHost) {
		config.host = config.bonjourHost.split(':')[0]
		config.port = Number.parseInt(config.bonjourHost.split(':')[1]) || 65000
		config.protocol = 'tcp' // Bonjour only supports TCP
		utilsLogger.info(`Bonjour device selected: ${config.host}:${config.port}`)
	}
	return config
}
