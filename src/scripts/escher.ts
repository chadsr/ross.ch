export default class EscherCubes {
  // renderEscherCubes(outer container id, svg container id, x offset from origin, y offset from origin, cube edge length in px, inner angle of cube)
  static render ( containerId: string, svgId: string, xOffset: number, yOffset: number, cubeSize: number, innerAngle: number ) {
    // Attempt to fetch the svg if it exists already
    const existing = document.getElementById( svgId );
    if ( existing ) {
      existing.parentNode.removeChild( existing ); // delete it if it already exists, because we are going to re-render it
    }

    // Render svg container
    const parentSVG = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
    parentSVG.setAttribute( 'id', svgId );

    // Get the container and append the svgId to it
    const container = document.getElementById( containerId );
    const containerPosition = container.getBoundingClientRect();
    container.append( parentSVG );

    const xCount = Math.ceil( containerPosition.width / cubeSize );
    const yCount = Math.ceil( containerPosition.height / cubeSize );

    let odd = true;
    for ( let y = 0; y < yCount; y++ ) {
      for ( let x = 0; x < xCount; x++ ) {
        const zPos = ( y * 1.5 ) + yOffset;

        let xPos;
        switch ( odd ) {
          case true:
            xPos = x + xOffset;
            break;

          case false:
            xPos = x - 0.5 + xOffset;

          default:
            break;
        }

        const yPos = xPos;
        this.renderIsometricCube( parentSVG, cubeSize, innerAngle, xPos, yPos, zPos, false );
      }
      odd = !odd;
    }
  }

  // renderIsometricCube(parent SVG element, length of cube edges in px, inner angle of cube, x position, y position, z position, bool to render hidden sides of cube)
  static renderIsometricCube ( parentSVG, cubeSize, innerAngle, x, y, z, renderHiddenSides ) {
    const outerAngle = 90 - innerAngle; // Calculate the outer angle by subtracting the inner angle from 90 degrees
    const sineInner = this.sineOf( innerAngle );
    const sineOuter = this.sineOf( outerAngle );

    const sides = [
      [ 'iso-top', sineInner + ' ' + -sineOuter + ' ' + sineInner + ' ' + sineOuter + ' ' + 0 + ' ' + ( cubeSize / 2 ) ],
      [ 'iso-left', sineInner + ' ' + sineOuter + ' ' + 0 + ' ' + 1 + ' ' + 0 + ' ' + ( cubeSize / 2 ) ],
      [ 'iso-right', sineInner + ' ' + -sineOuter + ' ' + 0 + ' ' + 1 + ' ' + this.sineRule( cubeSize, innerAngle ) + ' ' + cubeSize ]
    ];

    if ( renderHiddenSides == true ) {
      sides.push(
        [ 'iso-back-right', sineInner + ' ' + sineOuter + ' ' + 0 + ' ' + 1 + ' ' + this.sineRule( cubeSize, innerAngle ) + ' ' + 0 ],
        [ 'iso-back-left', sineInner + ' ' + -sineOuter + ' ' + 0 + ' ' + 1 + ' ' + 0 + ' ' + ( cubeSize / 2 ) ],
        [ 'iso-bottom', sineInner + ' ' + -sineOuter + ' ' + sineInner + ' ' + sineOuter + ' ' + 0 + ' ' + ( cubeSize * 1.5 ) ]
      );
    }

    const iso = document.createElementNS( 'http://www.w3.org/2000/svg', 'g' );
    iso.setAttribute( 'class', 'iso' );
    iso.setAttribute( 'transform', 'translate(' + this.calcX( cubeSize, innerAngle, x, y, z ) + ',' + this.calcY( cubeSize, x, y, z ) + ')' );

    for ( let i = 0; i < sides.length; i++ ) {
      const side = document.createElementNS( 'http://www.w3.org/2000/svg', 'rect' );
      side.setAttribute( 'x', '0' );
      side.setAttribute( 'y', '0' );
      side.setAttribute( 'width', cubeSize );
      side.setAttribute( 'height', cubeSize );
      side.setAttribute( 'class', sides[ i ][ 0 ] );
      side.setAttribute( 'transform', 'matrix(' + sides[ i ][ 1 ] + ')' );

      iso.appendChild( side );
    }
    parentSVG.append( iso );
  }

  static calcX ( size, innerAngle, x, y, z ) {
    const sineInner = this.sineOf( innerAngle );
    return ( x * sineInner * size ) + ( y * sineInner * size );
  }

  static calcY ( size, x, y, z ) {
    return ( x * ( size / 2 ) ) - ( y * size / 2 ) - ( -z * size );
  }

  static sineOf ( deg ) {
    const denom = 180 / deg;
    return Math.sin( Math.PI / denom );
  }

  static sineRule ( len, deg ) {
    return this.sineOf( deg ) * ( len / this.sineOf( 90 ) );
  }
}
