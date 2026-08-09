import { defineConfig, globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

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
    eslintConfigPrettier,
);
