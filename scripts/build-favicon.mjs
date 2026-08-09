// Renders the SVG favicon to a PNG.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

const SOURCE = 'static/favicon.svg';
const OUT = 'assets/favicon.png';
const WIDTH = 512;

const svg = await readFile(SOURCE);
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
const png = resvg.render().asPng();
await mkdir('assets', { recursive: true });
await writeFile(OUT, png);
