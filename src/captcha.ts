import { createCanvas } from 'canvas';
import * as random from 'randomatic';

import { Captcha, Colour } from './interfaces';

// Uses values from https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-procedure to calculate the luminance of an RGB colour
function getColourLuminance(colour: Colour) {
    const colourArray = [colour.red, colour.green, colour.blue];
    let colourFactor = 0;

    for (let i = 0; i < colourArray.length; i++) {
        colourFactor = colourArray[i] / 255;
        if (colourFactor <= 0.03928) {
            colourFactor = colourFactor / 12.92;
        } else {
            colourFactor = Math.pow((colourFactor + 0.055) / 1.055, 2.4);
        }
        colourArray[i] = colourFactor;
    }

    return colourArray[0] * 0.2126 + colourArray[1] * 0.7152 + colourArray[2] * 0.0722 + 0.05;
}

// Uses values from https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-procedure to calculate the contrast ratio between two RGB colours
function getLuminanceContrast(luminanceOne: number, luminanceTwo: number): number {
    const brightestLuminance = Math.max(luminanceOne, luminanceTwo);
    const darkestLuminance = Math.min(luminanceOne, luminanceTwo);

    return (brightestLuminance + 0.05) / (darkestLuminance + 0.05);
}

function getRandomColour(): Colour {
    // Generate a random RGB colour from one random number
    const rand = Math.round(0xffffff * Math.random());
    const colour: Colour = {
        red: rand >> 16,
        green: (rand >> 8) & 255,
        blue: rand & 255,
    };

    return colour;
}

export async function generateCaptcha(
    length: number,
    fontSize: number,
    backgroundColour: Colour,
    minContrastRatio: number,
    pattern = 'A0',
    font = 'Courier New',
): Promise<Captcha> {
    const canvasWidth = Math.ceil(fontSize * length);
    const canvas = createCanvas(canvasWidth, fontSize);
    const ctx = canvas.getContext('2d');

    // Paint the background colour
    ctx.fillStyle = `rgb(${backgroundColour.red},${backgroundColour.green},${backgroundColour.blue})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set the font
    ctx.font = `${fontSize}px ${font}`;

    // Generate a random string to use, following the given pattern and length
    const captchaString: string = random(pattern, length);

    // Generate each character in a random colour, with acceptable contrast ratio to the background colour
    const backgroundLuminance = getColourLuminance(backgroundColour);
    for (let i = 0; i < length; i++) {
        const char = captchaString.charAt(i);
        let contrastRatio = 0;
        let randomColour: Colour;

        // TODO: Figure out a more heuristic method of generating a high contrast colour instead of brute-forcing
        while (contrastRatio <= minContrastRatio) {
            randomColour = getRandomColour();
            const randomColourLuminance = getColourLuminance(randomColour);
            contrastRatio = getLuminanceContrast(backgroundLuminance, randomColourLuminance);
        }

        ctx.fillStyle = `rgb(${randomColour.red},${randomColour.green},${randomColour.blue})`;
        ctx.fillText(char, i * fontSize, fontSize - 1);
    }

    const pngStream = canvas.createPNGStream();
    let pngData = 'data:image/png;base64,';

    return new Promise((resolve, reject) => {
        pngStream.on('readable', function () {
            pngData += pngStream.read().toString('base64');
        });
        pngStream.on('error', function (error) {
            reject(error);
        });

        pngStream.on('end', function () {
            const captcha: Captcha = {
                string: captchaString,
                base64: pngData,
            };

            resolve(captcha);
        });
    });
}
