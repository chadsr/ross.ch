export default class EscherCubes {
    // renderEscherCubes(outer container id, svg container id, x offset from origin, y offset from origin, cube edge length in px, inner angle of cube)
    static render(containerId, svgId, xOffset, yOffset, cubeSize, innerAngle) {
        // Attempt to fetch the svg if it exists already
        var parentSVG = document.getElementById(svgId);
        if (parentSVG) {
            parentSVG.parentNode.removeChild(parentSVG); // delete it if it already exists, because we are going to re-render it
        }

        // Render svg container
        parentSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        parentSVG.setAttribute('id', svgId);

        // Get the container and append the svgId to it
        var container = document.getElementById(containerId);
        var containerPosition = container.getBoundingClientRect();
        container.append(parentSVG);

        var xCount = Math.ceil(containerPosition.width / cubeSize);
        var yCount = Math.ceil(containerPosition.height / cubeSize);

        var odd = true;
        for (var y=0; y < yCount; y++) {
            for (var x=0; x < xCount; x++) {
                var zPos = (y * 1.5) + yOffset;

                switch(odd) {
                    case true:
                    var xPos = x + xOffset;
                    break;

                    case false:
                    var xPos = x - 0.5 + xOffset;

                    default:
                    break;
                }

                var yPos = xPos;
                this.renderIsometricCube(parentSVG, cubeSize, innerAngle, xPos, yPos, zPos, false);
            };
            odd = !odd;
        };
    }

    // renderIsometricCube(parent SVG element, length of cube edges in px, inner angle of cube, x position, y position, z position, bool to render hidden sides of cube)
    static renderIsometricCube(parentSVG, cubeSize, innerAngle, x, y, z, renderHiddenSides) {
        var outerAngle = 90 - innerAngle; // Calculate the outer angle by subtracting the inner angle from 90 degrees
        var sineInner = this.sineOf(innerAngle);
        var sineOuter = this.sineOf(outerAngle);

        var sides = [
            ["iso-top", sineInner + " " + -sineOuter + " " + sineInner + " " + sineOuter + " " + 0 + " " + (cubeSize / 2)],
            ["iso-left", sineInner + " " + sineOuter + " " + 0 + " " + 1 + " " + 0 + " " + (cubeSize / 2)],
            ["iso-right", sineInner + " " + -sineOuter + " " + 0 + " " + 1 + " " + this.sineRule(cubeSize, innerAngle) + " " + cubeSize]
        ];

        if (renderHiddenSides == true) {
            sides.push(
                ["iso-back-right", sineInner + " " + sineOuter + " " + 0 + " " + 1 + " " + this.sineRule(cubeSize, innerAngle) + " " + 0],
                ["iso-back-left", sineInner + " " + -sineOuter + " " + 0 + " " + 1 + " " + 0 + " " + (cubeSize / 2)],
                ["iso-bottom", sineInner + " " + -sineOuter + " " + sineInner + " " + sineOuter + " " + 0 + " " + (cubeSize * 1.5)]
            );
        };

        var iso = document.createElementNS("http://www.w3.org/2000/svg", "g");
        iso.setAttribute('class', 'iso');
        iso.setAttribute('transform', 'translate(' + this.calcX(cubeSize, innerAngle, x, y, z) + ',' + this.calcY(cubeSize, x, y, z) + ')');

        for (var i = 0; i < sides.length; i++) {
            var side = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
            side.setAttribute('x', 0);
            side.setAttribute('y', 0);
            side.setAttribute('width', cubeSize);
            side.setAttribute('height', cubeSize);
            side.setAttribute('class', sides[i][0]);
            side.setAttribute('transform', "matrix(" + sides[i][1] + ")");
            iso.appendChild(side);
        }
        parentSVG.append(iso);
    }

    static calcX(size, innerAngle, x, y, z) {
        var sineInner = this.sineOf(innerAngle);
        return (x * sineInner * size) + (y * sineInner * size);
    }

    static calcY(size, x, y, z) {
        return (x * (size / 2)) - (y * size / 2) - (-z * size);
    }

    static sineOf(deg) {
        var denom = 180 / deg;
        return Math.sin(Math.PI / denom);
    }

    static sineRule(len, deg) {
        return this.sineOf(deg) * (len / this.sineOf(90));
    }
}
