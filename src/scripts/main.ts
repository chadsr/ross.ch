// Stylesheets
import '../stylesheets/style.scss';
import '../stylesheets/media.scss';

// node packages
import 'hammerjs';

// local function imports
import ContactForm from './contact';
import EscherCubes from './escher';

// Key event codes
const LEFT_ARROW = 'ArrowLeft';
const RIGHT_ARROW = 'ArrowRight';

const CUBE_ID = 'content-cube';
const CONTACT_FORM_ID = 'contact-form';

// Freaky Escher stuff
const BG_Y_OFFSET = -0.5; // Offset from y origin for the background rendering (so cube starts halfway offscreen)
const BG_CONTAINER_Id = 'background';
const SVG_ID = 'isobg';
const INNER_ANGLE = 60;
const NUM_CUBES_Y = 8; // The number of cubes that will be rendered on the y axis (This dictates their size)
const ISO_PADDING = 1;

const MIN_SIDE = 0;
const MAX_SIDE = 3;
// The currently facing side of the content-cube
let currentSide = MIN_SIDE;

let windowHeight = window.innerHeight;

declare global {
    interface Window {
        webkit: Webkit;
    }

    interface Webkit {
        messageHandlers?: unknown;
    }
}
document.addEventListener('DOMContentLoaded', function () {
    // Remove the class controlling styles when javascript is disabled
    document.body.classList.remove('nojs-styles');

    if (
        (<Window>window.webkit && <Window>window.webkit.messageHandlers) ||
        (navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1)
    ) {
        // add webkit class, so fix is applied
        const cube = document.getElementById(CUBE_ID);
        if (cube) {
            cube.classList.add('webkit');
        }
    }

    const swipe = new Hammer(document.body, {
        recognizers: [[Hammer.Swipe, { enable: true }]],
    });

    swipe.on('swipeleft', function () {
        rotateTo(currentSide + 1);
    });

    swipe.on('swiperight', function () {
        rotateTo(currentSide - 1);
    });

    // Register contact form submit event
    const contactForm = <HTMLFormElement>document.getElementById(CONTACT_FORM_ID);
    const contactHandler = new ContactForm(CONTACT_FORM_ID);
    contactForm.addEventListener('submit', function (e) {
        contactHandler.submit(e);
    });

    const captchaRefreshButton = <HTMLSpanElement>document.getElementById('captcha-refresh-btn');
    captchaRefreshButton.addEventListener('click', function () {
        const csrfElem = <HTMLInputElement>document.getElementById('csrf');

        if (csrfElem) {
            contactHandler.refreshCaptcha(csrfElem.value);
        }
    });

    // Menu cube rotate events
    const aboutButton = <HTMLLIElement>document.getElementById('about-btn');
    aboutButton.addEventListener('mousedown', function () {
        rotateTo(0);
    });

    const projectsButton = <HTMLLIElement>document.getElementById('projects-btn');
    projectsButton.addEventListener('mousedown', function () {
        rotateTo(1);
    });

    const blogButton = <HTMLLIElement>document.getElementById('blog-btn');
    blogButton.addEventListener('mousedown', function () {
        rotateTo(2);
    });

    const contactButton = <HTMLLIElement>document.getElementById('contact-btn');
    contactButton.addEventListener('mousedown', function () {
        rotateTo(3);
    });

    renderBackground();
});

document.addEventListener('keydown', function (event) {
    const activeElement = <HTMLElement>document.activeElement;
    const inputs = ['input', 'select', 'button', 'textarea'];

    // Only allow keypresses to rotate when active element is not an input element
    if (activeElement && inputs.indexOf(activeElement.tagName.toLowerCase()) == -1) {
        if (event.key === LEFT_ARROW) {
            rotateTo(currentSide - 1);
        } else if (event.key === RIGHT_ARROW) {
            rotateTo(currentSide + 1);
        }
    }
});

window.addEventListener('resize', function () {
    // Background is dependent on window height, so re-render if window height changes
    if (this.innerHeight !== windowHeight) {
        windowHeight = this.innerHeight;
        renderBackground();
    }
});

function renderBackground() {
    const isoCubeSize = window.innerHeight / NUM_CUBES_Y;
    EscherCubes.render(BG_CONTAINER_Id, SVG_ID, 0, BG_Y_OFFSET, isoCubeSize, INNER_ANGLE, ISO_PADDING, true);
}

function rotateTo(side: number) {
    if (side == MAX_SIDE + 1) {
        side = MIN_SIDE;
    } else if (side == MIN_SIDE - 1) {
        side = MAX_SIDE;
    }

    if (side !== currentSide && side >= MIN_SIDE && side <= MAX_SIDE) {
        const nav = document.getElementById('nav');
        const cube = document.getElementById(CUBE_ID);

        if (nav && cube) {
            const navList = nav.getElementsByTagName('ul')[0];
            const navListElements = navList.getElementsByTagName('li');

            // remove any active focused element
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

            const currentClass = cube.className.match(/(?:^|)rotate-([\d]+)/)[0];
            const focusFace = cube.querySelector(`.face-${side}`);

            const selected = nav.querySelector('.selected');

            if (selected && focusFace) {
                // Remove the 'selected' class from the currently selected list element
                selected.classList.remove('selected');

                // Remove the focus class from the old focused cube face
                const oldFocusFace = cube.querySelector('.focus');

                if (oldFocusFace) {
                    oldFocusFace.classList.remove('focus');

                    // Add classes to menu and cube face to indicate focus
                    navListElements[side].classList.add('selected');
                    focusFace.classList.add('focus');

                    const classes = cube.className.match(/(?:^|)rotate-([\d]+)/);

                    if (classes) {
                        const currentClass = classes[0];

                        // Replace the existing class with one matching the newly focused side (While preserving any other classes)
                        cube.className = cube.className.replace(currentClass, `rotate-${side}`);

                        currentSide = side;
                    }
                }
            }
        }
    }
}
