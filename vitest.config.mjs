import { createRequire } from 'node:module';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';

const cjsRequire = createRequire(import.meta.url);

export default {
    plugins: [cloudflareTest({ wrangler: { configPath: './wrangler.jsonc' } })],
    resolve: {
        alias: {
            uuid: cjsRequire.resolve('uuid'),
        },
    },
    test: {
        coverage: {
            // you can include other reporters, but 'json-summary' is required, json is recommended
            reporter: ['json-summary', 'json'],
            // If you want a coverage reports even if your tests are failing, include the reportOnFailure option
            reportOnFailure: true,
            // https://github.com/cloudflare/workers-sdk/issues/5266
            provider: 'istanbul',
        },
    },
};
