// Stylesheets/#
import '../stylesheets/style.sass';
import '../stylesheets/media.sass';

// node packages
import 'hammerjs';

// local function imports
import ContactForm from './contact';
import EscherCubes from './escher';

// Key event codes
const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;

// Needs a long debounce to cover for slow CSS transitions
const DEBOUNCE_MS = 2000;

const CUBE_ID = 'mainCube';
const MAIN_CONTENT_ID = 'content';
const CONTACT_FORM_ID = 'contact-form';

// Freaky Escher stuff
const BG_Y_OFFSET = -0.5; // Offset from y origin for the background rendering (so cube starts halfway offscreen)
const BG_CONTAINER_Id = 'background';
const SVG_ID = 'isobg';
const CUBE_SIZE = 200; // Size of a side in px (if in a 'true' 3d space)
const INNER_ANGLE = 60;

// The currently facing side of the mainCube
let currentSide = 1;

document.addEventListener('DOMContentLoaded', function() {
    // Remove the class controlling styles when javascript is disabled
    document.body.classList.remove('nojs-styles');

    const swipe = new Hammer(document.body, {
        recognizers: [
            [Hammer.Swipe, {enable: true}]
        ]
    });

    swipe.on('swipeleft', function() {
        rotateTo(currentSide + 1);
    });

    swipe.on('swiperight', function() {
        rotateTo(currentSide - 1);
    });

    // Register contact form submit event
    const contactForm = document.getElementById(CONTACT_FORM_ID);
    const contactHandler = new ContactForm(CONTACT_FORM_ID);
    contactForm.addEventListener('submit', function(e) {
        contactHandler.submit(e);
    });

    // Menu cube rotate events
    const aboutButton = document.getElementById('about-btn');
    aboutButton.addEventListener('mousedown', function() {
        rotateTo(1);
    });

    const projectsButton = document.getElementById('projects-btn');
    projectsButton.addEventListener('mousedown', function() {
        rotateTo(2);
    });

    const blogButton = document.getElementById('blog-btn');
    blogButton.addEventListener('mousedown', function() {
        rotateTo(3);
    });

    const contactButton = document.getElementById('contact-btn');
    contactButton.addEventListener('mousedown', function() {
        rotateTo(4);
    });

    // Trigger the resize event, so the cube can center on page load
    window.dispatchEvent(new Event('resize'));
});

document.addEventListener('keydown', function(event) {
    const activeElement = document.activeElement;
    const inputs = ['input', 'select', 'button', 'textarea'];

    // Only allow keypresses to rotate when active element is not an input element
    if (activeElement && inputs.indexOf(activeElement.tagName.toLowerCase()) == -1) {
        if (event.keyCode == LEFT_ARROW) {
        rotateTo(currentSide - 1);
        }
        else if (event.keyCode == RIGHT_ARROW) {
            rotateTo(currentSide + 1);
        }
    }
});

function debounce(func, time) {
    time = time || 100; // 100 by default if no param
    let timer;
    return function(event) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(func, time, event);
    };
}

window.addEventListener('resize', debounce(function(event) {
    const cube = document.getElementById(CUBE_ID);
    const cubePosition = cube.getBoundingClientRect();
    const mainContent = document.getElementById(MAIN_CONTENT_ID);
    const mainContentPosition = mainContent.getBoundingClientRect();
    const header = document.querySelector('header');
    const headerPosition = header.getBoundingClientRect();
    const footer = document.querySelector('footer');
    const footerPosition = footer.getBoundingClientRect();

    cube.style.top = Math.round((mainContentPosition.height + headerPosition.height - footerPosition.height - cubePosition.height) / 2) + 'px';

    renderBackground();
}, DEBOUNCE_MS));

function renderBackground() {
    EscherCubes.render(BG_CONTAINER_Id, SVG_ID, 0, BG_Y_OFFSET, CUBE_SIZE, INNER_ANGLE);
}

function rotateTo(side) {
    let degrees, focus;

    if (side != currentSide) {
        switch (side) {
            case 1:
            degrees = 0;
            focus = 'front';
            break;

            case 2:
            degrees = -90;
            focus = 'right';
            break;

            case 3:
            degrees = -180;
            focus = 'back';
            break;

            case 4:
            degrees = -270;
            focus = 'left';
            break;

            default:
            return false;
        }

        // TODO: cleanup a little
        currentSide = side;
        const nav = document.getElementById('nav');
        const navList = nav.getElementsByTagName('ul')[0];
        const navListElements = navList.getElementsByTagName('li');

        // Remove the 'selected' class from the currently selected list element
        const selected = nav.querySelector('.selected');
        selected.classList.remove('selected');

        const cube = document.getElementById(CUBE_ID);

        // Remove the focus class from the focused cube face
        const focusSide = cube.querySelector('.focus');
        focusSide.classList.remove('focus');

        // Transform the cube by the given degree using CSS Transform
        cube.style.transform = 'rotateY(' + degrees + 'deg)';
        navListElements[side - 1].classList.add('selected');
        cube.querySelector('.' + focus).classList.add('focus');

        return true;
    }

    return false;
}