import { createCanvas } from 'canvas';
import * as random from 'randomatic';

import { Captcha, Colour } from './interfaces';

export function getRandomColour (): Colour {
    // Generate a random RGB colour from one random number
    const rand = Math.round( 0xffffff * Math.random() );
    const colour: Colour = {
        red: rand >> 16,
        green: rand >> 8 & 255,
        blue: rand & 255,
    };

    return colour;
}
export async function getCaptcha ( length: number, fontSize: number, pattern = 'A0', font = 'Courier New' ): Promise<Captcha> {
    const canvasWidth = Math.ceil( fontSize * length );
    const canvas = createCanvas( canvasWidth, fontSize );
    const ctx = canvas.getContext( '2d' );

    ctx.font = `${fontSize}px ${font}`;

    const captchaString: string = random( pattern, length );

    // Generate a character in a random colour
    for ( let i = 0; i < length; i++ ) {
        const char = captchaString.charAt( i );
        const randomColour = getRandomColour();
        ctx.fillStyle = `rgb(${randomColour.red},${randomColour.green},${randomColour.blue})`;
        ctx.fillText( char, i * fontSize, fontSize - 1 );
    }

    const pngStream = canvas.createPNGStream();
    let pngData = 'data:image/png;base64,';

    return new Promise( ( resolve, reject ) => {
        pngStream.on( 'readable', function () {
            pngData += pngStream.read().toString( 'base64' );
        } );
        pngStream.on( 'error', function ( error ) {
            reject( error );
        } );

        pngStream.on( 'end', function () {
            const captcha: Captcha = {
                string: captchaString,
                base64: pngData,
            };

            resolve( captcha );
        } );
    } );
}