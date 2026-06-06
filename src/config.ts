import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export type ModuleConfig = {
	bonjourHost?: string
	host: string
	port: number
	protocol: 'tcp' | 'udp' | 'ws'
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'bonjour-device',
			id: 'bonjourHost',
			label: 'Device',
			width: 6,
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Host',
			width: 8,
			regex: Regex.HOSTNAME,
			isVisibleExpression: `!$(options:bonjourHost)`,
		},
		{
			type: 'dropdown',
			id: 'protocol',
			label: 'Protocol',
			width: 4,
			choices: [
				{ id: 'tcp', label: 'TCP' },
				{ id: 'udp', label: 'UDP' },
				{ id: 'ws', label: 'WebSocket' },
			],
			default: 'tcp',
			isVisibleExpression: `!$(options:bonjourHost)`,
		},
	]
}
