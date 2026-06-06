import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const baseConfig = await generateEslintConfig({
	enableTypescript: true,
	ignores: ['**/tests/*'],
})

const customConfig = [
	...baseConfig,

	{
		rules: {
			//'@typescript-eslint/no-unsafe-enum-comparison': 'off',
			// misconfiguration of ts or something?
			'n/no-missing-import': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			// 'm/no-unpublished-import': 'off',
			//'@typescript-eslint/no-unused-expressions': 'off',
			//'@typescript-eslint/no-floating-promises': 'off',
		},
	},
]

export default customConfig
