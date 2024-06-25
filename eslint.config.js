import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            'resources/**/*',
            'public/**/*',
            'static/**/*',
            '.wrangler/**/*',
        ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    eslintPluginPrettierRecommended
);
