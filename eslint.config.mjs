import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const baseConfig = await generateEslintConfig({
	enableTypescript: true,
	ignores: ['**/tests/*', 'vitest.config.ts'],
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
	{
		files: ['src/**/*.spec.ts'],
		rules: {
			'n/no-unpublished-import': 'off',
		},
	},
]

export default customConfig
