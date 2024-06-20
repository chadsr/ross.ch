import postcssPresetEnv from 'postcss-preset-env'
import purgeCSSPlugin from '@fullhuman/postcss-purgecss'

export default {
    plugins: [
        postcssPresetEnv({ browsers: 'last 2 versions' }),
        purgeCSSPlugin({
            content: ['./hugo_stats.json'],
            safelist: [
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
                let els = JSON.parse(content).htmlElements
                return els.tags.concat(els.classes, els.ids)
            },
        }),
    ],
}
