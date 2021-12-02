const SVG_NAMESPACE_URI = 'http://www.w3.org/2000/svg';
const CLASS_ISO_TOP = 'iso-top';
const CLASS_ISO_LEFT = 'iso-left';
const CLASS_ISO_RIGHT = 'iso-right';
const CLASS_ISO_BACK_RIGHT = 'iso-back-right';
const CLASS_ISO_BACK_LEFT = 'iso-back-left';
const CLASS_ISO_BOTTOM = 'iso-bottom';

export default class EscherCubes {
    // renderEscherCubes(outer container id, svg container id, x offset from origin, y offset from origin, cube edge length in px, inner angle of cube)
    static render(
        containerId: string,
        svgId: string,
        xOffset: number,
        yOffset: number,
        cubeSize: number,
        innerAngle: number,
        sidePaddingPx: number,
        renderHiddenSides = false,
    ): void {
        // Attempt to fetch the svg if it exists already
        const existing = document.getElementById(svgId);
        const parent = existing?.parentNode;
        if (!parent) {
            throw new Error(`could not get parent container of ID: ${svgId}`);
        }

        parent.removeChild(existing); // delete it if it already exists, because we are going to re-render it

        // Render svg container
        const parentSVG = document.createElementNS(SVG_NAMESPACE_URI, 'svg');
        parentSVG.setAttribute('id', svgId);
        parentSVG.classList.add(svgId);

        // Get the container and append the svgId to it
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`could not get container by ID: ${containerId}`);
        }

        const containerPosition = container.getBoundingClientRect();
        container.append(parentSVG);

        const xCount = Math.ceil(containerPosition.width / cubeSize);
        const yCount = Math.ceil(containerPosition.height / cubeSize);

        let odd = true;
        for (let y = 0; y < yCount; y++) {
            for (let x = 0; x < xCount; x++) {
                const zPos = y * 1.5 + yOffset;

                let xPos = x;
                switch (odd) {
                    case true:
                        xPos = x + xOffset;
                        break;

                    case false:
                        xPos = x - 0.5 + xOffset;
                        break;
                }

                const yPos = xPos;
                this.renderIsometricCube(
                    parentSVG,
                    cubeSize,
                    innerAngle,
                    xPos,
                    yPos,
                    zPos,
                    sidePaddingPx,
                    renderHiddenSides,
                );
            }
            odd = !odd;
        }
    }

    // renderIsometricCube(parent SVG element, length of cube edges in px, inner angle of cube, x position, y position, z position, bool to render hidden sides of cube)
    static renderIsometricCube(
        parentSVG: SVGElement,
        cubeSize: number,
        innerAngle: number,
        xPos: number,
        yPos: number,
        zPos: number,
        sidePaddingPx: number,
        renderHiddenSides: boolean,
    ): void {
        const outerAngle = 90 - innerAngle; // Calculate the outer angle by subtracting the inner angle from 90 degrees
        const sineInner = this.sineOf(innerAngle);
        const sineOuter = this.sineOf(outerAngle);

        const sides = [];

        if (renderHiddenSides === true) {
            sides.push(
                [
                    CLASS_ISO_BACK_RIGHT,
                    sineInner +
                        ' ' +
                        sineOuter +
                        ' ' +
                        0 +
                        ' ' +
                        1 +
                        ' ' +
                        this.sineRule(cubeSize, innerAngle) +
                        ' ' +
                        0,
                ],
                [CLASS_ISO_BACK_LEFT, sineInner + ' ' + -sineOuter + ' ' + 0 + ' ' + 1 + ' ' + 0 + ' ' + cubeSize / 2],
                [
                    CLASS_ISO_BOTTOM,
                    sineInner + ' ' + -sineOuter + ' ' + sineInner + ' ' + sineOuter + ' ' + 0 + ' ' + cubeSize * 1.5,
                ],
            );
        }

        sides.push(
            [
                CLASS_ISO_TOP,
                sineInner + ' ' + -sineOuter + ' ' + sineInner + ' ' + sineOuter + ' ' + 0 + ' ' + cubeSize / 2,
            ],
            [CLASS_ISO_LEFT, sineInner + ' ' + sineOuter + ' ' + 0 + ' ' + 1 + ' ' + 0 + ' ' + cubeSize / 2],
            [
                CLASS_ISO_RIGHT,
                sineInner +
                    ' ' +
                    -sineOuter +
                    ' ' +
                    0 +
                    ' ' +
                    1 +
                    ' ' +
                    this.sineRule(cubeSize, innerAngle) +
                    ' ' +
                    cubeSize,
            ],
        );

        const iso = document.createElementNS(SVG_NAMESPACE_URI, 'g');
        iso.setAttribute('class', 'iso');
        iso.setAttribute(
            'transform',
            'translate(' +
                this.calcX(cubeSize, innerAngle, xPos, yPos) +
                ',' +
                this.calcY(cubeSize, xPos, yPos, zPos) +
                ')',
        );

        for (const [className, transform] of sides) {
            const side = document.createElementNS(SVG_NAMESPACE_URI, 'rect');
            side.setAttribute('x', '0');
            side.setAttribute('y', '0');
            side.setAttribute('width', cubeSize.toString());
            side.setAttribute('height', cubeSize.toString());
            side.setAttribute('class', className);
            side.setAttribute('transform', 'matrix(' + transform + ')');

            iso.appendChild(side);
        }

        parentSVG.append(iso);
    }

    static calcX(size: number, innerAngle: number, x: number, y: number): number {
        const sineInner = this.sineOf(innerAngle);
        return x * sineInner * size + y * sineInner * size;
    }

    static calcY(size: number, x: number, y: number, z: number): number {
        return x * (size / 2) - (y * size) / 2 - -z * size;
    }

    static sineOf(deg: number): number {
        const denom = 180 / deg;
        return Math.sin(Math.PI / denom);
    }

    static sineRule(len: number, deg: number): number {
        return this.sineOf(deg) * (len / this.sineOf(90));
    }
}
