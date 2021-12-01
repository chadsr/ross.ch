import { resolve } from 'path';

export default {
    // Source files
    src: resolve(__dirname, '../src'),

    scripts: resolve(__dirname, '../src/scripts'),

    views: resolve(__dirname, '../src/views'),

    partials: resolve(__dirname, '../src/views/partials'),

    images: resolve(__dirname, '../src/assets/images'),

    public: resolve(__dirname, '../public'),

    // Production build files
    build: resolve(__dirname, '../dist'),

    buildPublic: resolve(__dirname, '../dist/public'),

    buildSrc: resolve(__dirname, '../dist/src'),
};
