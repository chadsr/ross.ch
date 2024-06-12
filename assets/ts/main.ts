// local function imports
import EscherCubes from './escher'

// Key event codes
const LEFT_ARROW = 'ArrowLeft'
const RIGHT_ARROW = 'ArrowRight'

const CUBE_ID = 'content-cube'

// Freaky Escher stuff
const BG_Y_OFFSET = -0.5 // Offset from y origin for the background rendering (so cube starts halfway offscreen)
const BG_CONTAINER_Id = 'background'
const SVG_ID = 'isobg'
const INNER_ANGLE = 60
const NUM_CUBES_Y = 8 // The number of cubes that will be rendered on the y axis (This dictates their size)
const ISO_PADDING = 1

const MIN_SIDE = 0
const MAX_SIDE = 3
// The currently facing side of the content-cube
let currentSide = MIN_SIDE

let windowHeight = window.innerHeight

declare global {
    interface Window {
        webkit?: Webkit
    }

    interface Webkit {
        messageHandlers?: unknown
    }
}
document.addEventListener('DOMContentLoaded', function () {
    if (
        (<Window>window.webkit && <Window>window.webkit.messageHandlers) ||
        (navigator.userAgent.indexOf('Safari') !== -1 &&
            navigator.userAgent.indexOf('Chrome') === -1)
    ) {
        // store the current cube size
        document.getElementById(CUBE_ID).classList.add('webkit')
    }

    // Menu cube rotate events
    const aboutButton = <HTMLLIElement>document.getElementById('about-btn')
    aboutButton.addEventListener('mousedown', function () {
        rotateTo(0)
    })

    const projectsButton = <HTMLLIElement>(
        document.getElementById('projects-btn')
    )
    projectsButton.addEventListener('mousedown', function () {
        rotateTo(1)
    })

    const blogButton = <HTMLLIElement>document.getElementById('blog-btn')
    blogButton.addEventListener('mousedown', function () {
        rotateTo(2)
    })

    const contactButton = <HTMLLIElement>document.getElementById('contact-btn')
    contactButton.addEventListener('mousedown', function () {
        rotateTo(3)
    })

    renderBackground()
})

document.addEventListener('keydown', function (event) {
    const activeElement = <HTMLElement>document.activeElement
    const inputs = ['input', 'select', 'button', 'textarea']

    // Only allow keypresses to rotate when active element is not an input element
    if (
        activeElement &&
        inputs.indexOf(activeElement.tagName.toLowerCase()) == -1
    ) {
        if (event.key === LEFT_ARROW) {
            rotateTo(currentSide - 1)
        } else if (event.key === RIGHT_ARROW) {
            rotateTo(currentSide + 1)
        }
    }
})

window.addEventListener('resize', function () {
    // Background is dependent on window height, so re-render if window height changes
    if (this.innerHeight !== windowHeight) {
        windowHeight = this.innerHeight
        renderBackground()
    }
})

function renderBackground() {
    const isoCubeSize = window.innerHeight / NUM_CUBES_Y
    EscherCubes.render(
        BG_CONTAINER_Id,
        SVG_ID,
        0,
        BG_Y_OFFSET,
        isoCubeSize,
        INNER_ANGLE,
        ISO_PADDING,
        true
    )
}

function rotateTo(side: number) {
    if (side == MAX_SIDE + 1) {
        side = MIN_SIDE
    } else if (side == MIN_SIDE - 1) {
        side = MAX_SIDE
    }

    if (side !== currentSide && side >= MIN_SIDE && side <= MAX_SIDE) {
        const nav = document.getElementById('nav')
        const navList = nav.getElementsByTagName('ul')[0]
        const navListElements = navList.getElementsByTagName('li')

        // Remove the 'selected' class from the currently selected list element
        const selected = nav.querySelector('.selected')
        selected.classList.remove('selected')

        const cube = document.getElementById(CUBE_ID)
        // Remove the focus class from the old focused cube face
        const oldFocusFace = cube.querySelector('.focus')
        oldFocusFace.classList.remove('focus')

        // Add classes to menu and cube face to indicate focus
        navListElements[side].classList.add('selected')
        const focusFace = cube.querySelector(`.face-${side}`)
        focusFace.classList.add('focus')

        // remove any active focused element
        if (document.activeElement instanceof HTMLElement)
            document.activeElement.blur()

        const currentClass = cube.className.match(/(?:^|)rotate-([\d]+)/)[0]

        // Replace the existing class with one matching the newly focused side (While preserving any other classes)
        cube.className = cube.className.replace(currentClass, `rotate-${side}`)

        currentSide = side

        return true
    }

    return false
}
