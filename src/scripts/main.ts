// Stylesheets/#
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

// Needs a long debounce to cover for slow CSS transitions
const DEBOUNCE_MS = 2000;

const CUBE_ID = 'content-cube';
const CUBE_WRAPPER_ID = 'content-cube-wrapper';
const MAIN_CONTENT_ID = 'content';
const CONTACT_FORM_ID = 'contact-form';

// Freaky Escher stuff
const BG_Y_OFFSET = -0.5; // Offset from y origin for the background rendering (so cube starts halfway offscreen)
const BG_CONTAINER_Id = 'background';
const SVG_ID = 'isobg';
const INNER_ANGLE = 60;
const NUM_CUBES_Y = 5; // The number of cubes that will be rendered on the y axis (This dictates their size)

const MIN_SIDE = 0;
const MAX_SIDE = 3;
// The currently facing side of the content-cube
let currentSide = MIN_SIDE;

let isSafari; // We need to apply a hack to safari, to fix 3d transforms, so this is used based on the browser's useragent

document.addEventListener('DOMContentLoaded', function () {
    // Remove the class controlling styles when javascript is disabled
    document.body.classList.remove('nojs-styles');

    isSafari = navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;

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
        const csrfToken: string = contactForm.elements['_csrf'].value;
        contactHandler.refreshCaptcha(csrfToken);
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

    const ethAddress = <HTMLTextAreaElement>document.getElementById('eth-addr');
    ethAddress.addEventListener('click', function () {
        this.focus();
        this.select();
    });

    const btcAddress = <HTMLTextAreaElement>document.getElementById('btc-addr');
    btcAddress.addEventListener('click', function () {
        this.focus();
        this.select();
    });

    // Trigger the resize event, so the cube can center on page load
    window.dispatchEvent(new Event('resize'));
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

// The cube should be rendering at the exact same size and the style sheet states. Some browser LIKE SAFARI, act differently on transform-origin and screw this up.
// This is therefore a Safari/IOS hack to correct the size of the cube
function fixTranslateZ() {
    // Get the computed CSS size (width since it's a cube) of the cube
    const cube = <HTMLDivElement>document.getElementById(CUBE_ID);
    const cubeStyles = getComputedStyle(cube);

    // Apply this value to the translateZ function of the cube's wrapper container
    const cubeWrapper = document.getElementById(CUBE_WRAPPER_ID);
    cubeWrapper.style.transform = `translateZ(-${cubeStyles.width})`;
}

function debounce(func, time: number) {
    time = time || 100; // 100 by default if no param
    let timer;
    return function (event) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(func, time, event);
    };
}

window.addEventListener(
    'resize',
    debounce(function () {
        if (isSafari) {
            fixTranslateZ();
        }

        const cube = document.getElementById(CUBE_ID);
        const cubeHeight = parseInt(getComputedStyle(cube).height, 10); // Get an int value from the style height string

        const mainContent = document.getElementById(MAIN_CONTENT_ID);
        const mainContentPosition = mainContent.getBoundingClientRect();
        const header = document.querySelector('header');
        const headerPosition = header.getBoundingClientRect();
        const footer = document.querySelector('footer');
        const footerPosition = footer.getBoundingClientRect();

        // calculate the distance from the top needed in order to center the cube and apply it as the 'top' attribute of the cube
        cube.style.top = `${Math.round(
            (mainContentPosition.height + headerPosition.height - footerPosition.height - cubeHeight) / 2,
        )}px`;

        renderBackground();
    }, DEBOUNCE_MS),
);

function renderBackground() {
    const cubeSize = window.innerHeight / NUM_CUBES_Y;
    EscherCubes.render(BG_CONTAINER_Id, SVG_ID, 0, BG_Y_OFFSET, cubeSize, INNER_ANGLE);
}

function hideSwipeIndicator() {
    const swipeIndicator = document.getElementById('swipe-indicator');

    if (swipeIndicator.classList.contains('swiped') !== true) {
        swipeIndicator.classList.add('swiped');
    }
}

function rotateTo(side: number) {
    if (side !== currentSide && side >= MIN_SIDE && side <= MAX_SIDE) {
        currentSide = side;
        const nav = document.getElementById('nav');
        const navList = nav.getElementsByTagName('ul')[0];
        const navListElements = navList.getElementsByTagName('li');

        // Remove the 'selected' class from the currently selected list element
        const selected = nav.querySelector('.selected');
        selected.classList.remove('selected');

        const cube = document.getElementById(CUBE_ID);
        // Remove the focus class from the old focused cube face
        const focusSide = cube.querySelector('.focus');
        focusSide.classList.remove('focus');

        // Add classes to menu and cube face to indicate focus
        navListElements[side].classList.add('selected');
        const faces = cube.children;
        faces[side].classList.add('focus');

        // Construct a regex to match any existing classname from the rotate classes (A little overkill)
        const re = new RegExp(`rotate-[${MIN_SIDE}-${MAX_SIDE}]`, 'g');
        // Replace the existing class with one matching the newly focused side (While preserving any other classes)
        cube.className = cube.className.replace(re, `rotate-${side}`);

        // hide the swipe indicator, if not already since user managed to switch pages
        hideSwipeIndicator();

        return true;
    }

    return false;
}
