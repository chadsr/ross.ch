import postForm, { AxiosError } from 'axios';

// local function imports
import SwipeNav, { ISwipeFunc } from './swipe';
import EscherCubes from './escher';
import { FormMessage } from './contact';

const API_CONTACT = '/api/contact';

// Key event codes
const LEFT_ARROW = 'ArrowLeft';
const RIGHT_ARROW = 'ArrowRight';

const ELEMENTS_ROTATE_DISABLED = [
    'input',
    'select',
    'button',
    'textarea',
    'label',
];

const CONTACT_FORM_ID = 'contact-form';
const CONTACT_FORM_API_ID = 'contact-form-encrypted';
const CONTACT_FORM_BUTTON = 'contact-submit';
const CUBE_ID = 'content-cube';
const FORM_WORKER_ID = 'form-worker';

const FORM_RESET_TIMEOUT = 4000;
const SWIPE_NAVIGATION_THRESHOLD = 100;

const CLASS_SUCCESS = 'success';
const CLASS_ERROR = 'error';
const ERROR_MESSAGE_PREFIX = 'Error!';

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

let formButtonText = '';
let formWorker: Worker | undefined = undefined;

declare global {
    interface Window {
        webkit?: Webkit;
    }

    interface Webkit {
        messageHandlers?: unknown;
    }
}

/**
 * Interface for the ContactForm type. This defines the structure of the contact form fields.
 */
interface ContactForm extends HTMLFormElement {
    fullName: HTMLInputElement;
    email: HTMLInputElement;
    message: HTMLTextAreaElement;
}

/**
 * This function renders the Escher-inspired background using the EscherCubes module.
 *
 * @summary Render the Escher-inspired background.
 */
const renderBackground = () => {
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
};

/**
 * Rotates the content cube to a specified side.
 *
 * @param {number} side - The index of the side to rotate to (0-3).
 */
const rotateTo: ISwipeFunc = (side: number) => {
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
};

/**
 * Shows a status message on a form button for a specified amount of time.
 *
 * @param {string} message The message to display
 * @param {string} statusClass The CSS class to apply to the form button (e.g. 'success' or 'error')
 * @param {HTMLButtonElement} formButtonElement The HTML button element to update
 * @param {number} timeoutMs The time in milliseconds to keep the message displayed before resetting it
 */
const showStatusMessage = (
    message: string,
    statusClass: string,
    formButtonElement: HTMLButtonElement,
    timeoutMs: number
) => {
    const buttonText = formButtonText;

    formButtonElement.classList.add(statusClass);
    formButtonElement.innerText = message;

    setTimeout(() => {
        formButtonElement.classList.remove(statusClass);
        formButtonElement.innerText = buttonText;
    }, timeoutMs);
};

document.addEventListener('DOMContentLoaded', function () {
    const cube = document.getElementById(CUBE_ID);
    if (cube) {
        if (
            (window.webkit && window.webkit.messageHandlers) ||
            (navigator.userAgent.indexOf('Safari') !== -1 &&
                navigator.userAgent.indexOf('Chrome') === -1)
        ) {
            // Enable fix for iOS Safari not supporting CSS transforms on 3D elements
            cube.classList.add('webkit');
        }

        new SwipeNav(
            CUBE_ID,
            SWIPE_NAVIGATION_THRESHOLD,
            ELEMENTS_ROTATE_DISABLED,
            currentSide,
            MIN_SIDE,
            MAX_SIDE,
            rotateTo
        );
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

    const contactForm = <ContactForm>document.getElementById(CONTACT_FORM_ID);
    if (contactForm) {
        const contactFormBtn = <HTMLButtonElement>(
            document.getElementById(CONTACT_FORM_BUTTON)
        );
        formButtonText = contactFormBtn.innerText;

        if (window.Worker) {
            const formWorkerScript = document.getElementById(
                FORM_WORKER_ID
            ) as HTMLScriptElement;

            if (formWorkerScript) {
                const workerPath = formWorkerScript.getAttribute('src');
                if (workerPath) {
                    formWorker = new Worker(workerPath);

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

                            postForm(API_CONTACT, apiForm)
                                .then((response) => {
                                    if (response.status === 200) {
                                        const responseData =
                                            response.data as ResponseData;

                                        // Give the user a success message and reset the form after a timeout
                                        showStatusMessage(
                                            responseData.message,
                                            CLASS_SUCCESS,
                                            contactFormBtn,
                                            FORM_RESET_TIMEOUT
                                        );
                                        contactForm.reset();
                                    } else {
                                        throw new Error(response.data);
                                    }
                                })
                                .catch((error: AxiosError) => {
                                    let errorMessage: string = error.name;
                                    if (error.response) {
                                        const responseData = error.response
                                            .data as ResponseData;
                                        errorMessage = JSON.stringify(
                                            responseData.message
                                        );
                                    }

                                    showStatusMessage(
                                        `${ERROR_MESSAGE_PREFIX} ${errorMessage}`,
                                        CLASS_ERROR,
                                        contactFormBtn,
                                        FORM_RESET_TIMEOUT
                                    );
                                    // don't reset the form on error, so the user can try again
                                });
                        }
                    );

                    contactForm.addEventListener('submit', (submitEvent) => {
                        submitEvent.preventDefault();

                        if (
                            contactForm.fullName.value &&
                            contactForm.email.value &&
                            contactForm.message.value
                        ) {
                            if (formWorker) {
                                const formMessage: FormMessage = {
                                    name: contactForm.fullName.value,
                                    email: contactForm.email.value,
                                    message: contactForm.message.value,
                                };

                                formWorker.postMessage(formMessage);
                            }
                        }
                    });
                }
            }
        } else {
            // TODO: form handling without web worker
        }
    }
});

/**
 * Handles keyboard events to rotate the cube.
 *
 * This function checks if the active element is not an input element and then
 * handles left and right arrow key presses. The `rotateTo` function is called
 * with the new side number as a parameter.
 *
 * @param {KeyboardEvent} event - The keyboard event object.
 */
document.addEventListener('keydown', (event: KeyboardEvent) => {
    const activeElement = document.activeElement;

    // Only allow keypresses to rotate when active element is not an input element
    if (
        activeElement &&
        ELEMENTS_ROTATE_DISABLED.indexOf(activeElement.tagName.toLowerCase()) ==
            -1
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

/**
 * Handles window resize events.
 *
 * This function re-renders the background after a delay to allow for the browser
 * to finish resizing the window. It checks if the new window height is different
 * from the previous one before re-rendering the background.
 *
 * @param {Event} event - The window resize event object.
 */
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
