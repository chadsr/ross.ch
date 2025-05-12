import { FleekConfig } from '@fleek-platform/cli';

export default {
    sites: [
        {
            slug: 'some-kite-broad',
            distDir: 'public',
            buildCommand: 'npm run build',
        },
    ],
} satisfies FleekConfig;
