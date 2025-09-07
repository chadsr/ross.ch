import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
    test: {
        coverage: {
            // you can include other reporters, but 'json-summary' is required, json is recommended
            reporter: ['json-summary', 'json'],
            // If you want a coverage reports even if your tests are failing, include the reportOnFailure option
            reportOnFailure: true,
            // https://github.com/cloudflare/workers-sdk/issues/5266
            provider: 'istanbul',
        },
        poolOptions: {
            workers: {
                wrangler: { configPath: './wrangler.jsonc' },
            },
        },
    },
});
