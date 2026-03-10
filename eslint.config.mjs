import { defineConfig, globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig(
    [
        globalIgnores([
            'resources/**/*',
            'public/**/*',
            'static/**/*',
            'dist/**/*',
            '.wrangler/**/*',
        ]),
    ],
    eslint.configs.recommended,
    tseslint.configs.recommended,
    eslintPluginPrettierRecommended,
);
