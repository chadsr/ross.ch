// local function imports
import SwipeNav from './swipe';
import EscherCubes from './escher';
import { FormMessage } from './contact';

// Key event codes
const LEFT_ARROW = 'ArrowLeft';
const RIGHT_ARROW = 'ArrowRight';

const CONTACT_FORM_ID = 'contact-form';
const CONTACT_FORM_API_ID = 'contact-form-encrypted';
const CONTACT_FORM_BUTTON = 'contact-submit';
const CUBE_ID = 'content-cube';
const FORM_WORKER_ID = 'form-worker';

const FORM_RESET_TIMEOUT = 3000;
const SWIPE_NAVIGATION_THRESHOLD = 50;

const SUCCESS_MESSAGE = 'Success!';

// Freaky Escher stuff
const BG_Y_OFFSET = -0.5; // Offset from y origin for the background rendering (so cube starts halfway offscreen)
const BG_CONTAINER_Id = 'background';
const SVG_ID = 'isobg';
const INNER_ANGLE = 60;
const NUM_CUBES_Y = 12; // The number of cubes that will be rendered on the y axis (This dictates their size)
const ISO_PADDING = 1;

const NAV_MAPPING = {
    'nav-about': 0,
    'nav-work': 1,
    'nav-thoughts': 2,
    'nav-contact': 3,
};

const CLASS_ROTATE_PREFIX = 'rotate-';
const MIN_SIDE = 0;
const MAX_SIDE = 3;
// The currently facing side of the content-cube
let currentSide = MIN_SIDE;

let windowHeight = window.innerHeight;

let formWorker: Worker | undefined = undefined;

declare global {
    interface Window {
        webkit?: Webkit;
    }

    interface Webkit {
        messageHandlers?: unknown;
    }
}

function renderBackground() {
    const isoCubeSize = window.innerHeight / NUM_CUBES_Y;
    EscherCubes.render(
        BG_CONTAINER_Id,
        SVG_ID,
        0,
        BG_Y_OFFSET,
        isoCubeSize,
        INNER_ANGLE,
        ISO_PADDING,
        true
    );
}

function rotateTo(side: number) {
    if (side == MAX_SIDE + 1) {
        side = MIN_SIDE;
    } else if (side == MIN_SIDE - 1) {
        side = MAX_SIDE;
    }

    if (side !== currentSide && side >= MIN_SIDE && side <= MAX_SIDE) {
        const nav = document.getElementById('nav');
        if (nav) {
            const navList = nav.getElementsByTagName('ul')[0];
            const navListElements = navList.getElementsByTagName('li');

            // Remove the 'selected' class from the currently selected list element
            const selected = nav.querySelector('.selected');
            if (selected) {
                selected.classList.remove('selected');
            }

            // Add the 'selected' class to the newly selected list element
            navListElements[side].classList.add('selected');
        }

        const cube = document.getElementById(CUBE_ID);
        if (cube) {
            // Remove the focus class from the old focused cube face
            const oldFocusFace = cube.querySelector('.focus');
            if (oldFocusFace) {
                oldFocusFace.classList.remove('focus');
            }

            // Add classes to cube face to indicate focus
            const focusFace = cube.querySelector(`.face-${side}`);
            if (focusFace) {
                focusFace.classList.add('focus');
            }

            // remove any active focused element
            if (document.activeElement instanceof HTMLElement)
                document.activeElement.blur();

            // Remove the old focus class and add the focus class to the new focused cube face
            cube.classList.remove(`${CLASS_ROTATE_PREFIX}${currentSide}`);
            cube.classList.add(`${CLASS_ROTATE_PREFIX}${side}`);
        }

        currentSide = side;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const cube = document.getElementById(CUBE_ID);
    if (cube) {
        new SwipeNav(
            CUBE_ID,
            SWIPE_NAVIGATION_THRESHOLD,
            MIN_SIDE,
            MAX_SIDE,
            rotateTo
        );

        if (
            (window.webkit && window.webkit.messageHandlers) ||
            (navigator.userAgent.indexOf('Safari') !== -1 &&
                navigator.userAgent.indexOf('Chrome') === -1)
        ) {
            cube.classList.add('webkit');
        }
    }
    // Menu cube rotate events
    for (const [navId, rotateValue] of Object.entries(NAV_MAPPING)) {
        const navButton = document.getElementById(navId);
        if (navButton) {
            navButton.addEventListener('mousedown', function () {
                rotateTo(rotateValue);
            });
        }
    }

    renderBackground();

    const contactForm = <HTMLFormElement>(
        document.getElementById(CONTACT_FORM_ID)
    );

    if (contactForm) {
        const contactFormBtn = <HTMLButtonElement>(
            document.getElementById(CONTACT_FORM_BUTTON)
        );
        if (window.Worker) {
            const formWorkerScript = document.getElementById(
                FORM_WORKER_ID
            ) as HTMLScriptElement;

            if (formWorkerScript) {
                const workerPath = formWorkerScript.getAttribute('src');
                if (workerPath) {
                    formWorker = new Worker(workerPath);

                    contactForm.addEventListener('submit', (submitEvent) => {
                        submitEvent.preventDefault();

                        if (formWorker) {
                            const formMessage: FormMessage = {
                                name: contactForm.fullName.value.toString(),
                                email: contactForm.email.value.toString(),
                                message: contactForm.message.value.toString(),
                            };

                            formWorker.postMessage(formMessage);
                        }
                    });

                    // Listen for the worker to send an encrypted message back
                    formWorker.addEventListener(
                        'message',
                        (event: MessageEvent) => {
                            const encryptedMessage = event.data as string;

                            // Send the encrypted message to the API endpoint via a hidden form
                            const apiForm = <HTMLFormElement>(
                                document.getElementById(CONTACT_FORM_API_ID)
                            );
                            apiForm.message.value = encryptedMessage;
                            apiForm.addEventListener(
                                'submit',
                                (submitEvent) => {
                                    submitEvent.preventDefault();
                                }
                            );
                            apiForm.submit();

                            // Give the user a success message and reset the form after a timeout
                            const submitBtnText = contactFormBtn.innerText;
                            contactFormBtn.classList.add('success');
                            contactFormBtn.innerText = SUCCESS_MESSAGE;

                            setTimeout(() => {
                                contactFormBtn.classList.remove('success');
                                contactFormBtn.innerText = submitBtnText;
                            }, FORM_RESET_TIMEOUT);
                            contactForm.reset();
                        }
                    );
                }
            }
        } else {
            // TODO: form handling without web worker
        }
    }
});

document.addEventListener('keydown', (event: KeyboardEvent) => {
    const activeElement = document.activeElement;
    const inputs = ['input', 'select', 'button', 'textarea'];

    // Only allow keypresses to rotate when active element is not an input element
    if (
        activeElement &&
        inputs.indexOf(activeElement.tagName.toLowerCase()) == -1
    ) {
        if (event.key === LEFT_ARROW) {
            if (currentSide > MIN_SIDE) {
                rotateTo(currentSide - 1);
            }
        } else if (event.key === RIGHT_ARROW) {
            if (currentSide < MAX_SIDE) {
                rotateTo(currentSide + 1);
            }
        }
    }
});

window.addEventListener('resize', function () {
    // Background is dependent on window height, so re-render if window height changes
    if (this.innerHeight !== windowHeight) {
        this.setTimeout(() => {
            // Re-render the background after a delay to allow for the browser to finish resizing the window
            windowHeight = this.innerHeight;
            renderBackground();
        }, 100);
    }
});
