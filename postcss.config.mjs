import postcssPresetEnv from 'postcss-preset-env';
import { purgeCSSPlugin } from '@fullhuman/postcss-purgecss';
import calcPlugin from 'postcss-calc';
import autoprefixer from 'autoprefixer';

export default {
    plugins: [
        postcssPresetEnv(),
        calcPlugin(),
        purgeCSSPlugin({
            content: ['./hugo_stats.json'],
            safelist: [
                'hidden',
                'success',
                'error',
                'rotate-0',
                'rotate-1',
                'rotate-2',
                'rotate-3',
                'isobg',
                'iso',
                'iso-face',
                'iso-left',
                'iso-right',
                'iso-top',
                'iso-bottom',
                'iso-back-left',
                'iso-back-right',
            ],
            defaultExtractor: (content) => {
                const els = JSON.parse(content).htmlElements;
                return [
                    ...(els.tags || []),
                    ...(els.classes || []),
                    ...(els.ids || []),
                ];
            },
        }),
        autoprefixer(),
    ],
};
