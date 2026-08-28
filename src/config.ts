import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export const DEFAULT_PORT = 65000

export type ModuleConfig = {
	bonjourHost?: string
	host: string
	port: number
	protocol: 'tcp' | 'udp' | 'ws'
	batchCommands?: boolean
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
			type: 'number',
			id: 'port',
			label: 'Port',
			width: 4,
			min: 1,
			max: 65535,
			default: DEFAULT_PORT,
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
		{
			type: 'checkbox',
			id: 'batchCommands',
			label: 'Batch commands',
			tooltip:
				'Combine multiple commands into a single OCP.1 message (spec-legal and faster, especially while enumerating the device). Some devices only accept one command per message and will desync and drop the connection — if the device logs invalid message length errors, or the connection drops shortly after connecting, turn this off.',
			width: 4,
			default: true,
		},
	]
}
