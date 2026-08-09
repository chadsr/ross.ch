import * as prettierPluginGoTemplate from '@htnabe/prettier-plugin-go-template';

/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
    trailingComma: 'all',
    tabWidth: 4,
    semi: true,
    singleQuote: true,
    plugins: [prettierPluginGoTemplate],
    overrides: [
        {
            files: ['*.html'],
            options: {
                parser: 'go-template',
            },
        },
    ],
};

export default config;
