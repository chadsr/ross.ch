import axios, { AxiosError } from 'axios';

// local function imports
import SwipeNav, { ISwipeFunc } from './swipe';
import EscherCubes from './escher';
import { FormMessage } from './contact';
import { FORM_WORKER_TARGET } from './formWorker';
import { FormWorkerData, RequestContact, ResponseData } from './interfaces';

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
const CONTACT_FORM_BUTTON = 'contact-submit';
const CUBE_ID = 'content-cube';
const FORM_WORKER_ID = 'form-worker';

const FORM_RESET_TIMEOUT = 4000;
const SWIPE_NAVIGATION_THRESHOLD = 100;

const CLASS_NOJS = 'nojs';
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

const MIN_SIDE = 0;
const MAX_SIDE = 3;
// The currently facing side of the content-cube
let currentSide = MIN_SIDE;

let windowHeight = window.innerHeight;

const CONTACT_BUTTON_TEXT = 'Submit';
let formWorker: Worker | undefined = undefined;

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
        true,
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
            const navLists = nav.getElementsByTagName('ul');
            if (navLists.length !== 1)
                throw new Error('Expected only 1 navigation list');

            const navListElements = navLists[0].getElementsByTagName('li');

            // get the radio input element for the given side index
            const menuRadioArr =
                navListElements[side].getElementsByClassName('nav-radio');

            if (menuRadioArr.length !== 1) {
                throw new Error(
                    `Expected 1 menu radio element, but got ${menuRadioArr.length}`,
                );
            }

            const menuRadioElement = menuRadioArr[0];
            if (menuRadioElement instanceof HTMLInputElement) {
                menuRadioElement.checked = true;
            } else {
                throw new Error(
                    'Expected nav-radio element to be HTMLInputElement',
                );
            }

            currentSide = side;

            // remove any active focused element
            if (document.activeElement instanceof HTMLElement)
                document.activeElement.blur();
        }
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
    timeoutMs: number,
) => {
    formButtonElement.classList.add(statusClass);
    formButtonElement.innerText = message;

    setTimeout(() => {
        formButtonElement.classList.remove(statusClass);
        formButtonElement.innerText = CONTACT_BUTTON_TEXT;
    }, timeoutMs);
};

document.addEventListener('DOMContentLoaded', function () {
    Array.from(document.getElementsByClassName(CLASS_NOJS)).forEach(
        (nojsElement) => nojsElement.classList.add('hidden'),
    );

    const cube = document.getElementById(CUBE_ID);
    if (cube) {
        new SwipeNav(
            CUBE_ID,
            SWIPE_NAVIGATION_THRESHOLD,
            ELEMENTS_ROTATE_DISABLED,
            currentSide,
            MIN_SIDE,
            MAX_SIDE,
            rotateTo,
        );
    }

    renderBackground();

    const contactForm = <ContactForm>document.getElementById(CONTACT_FORM_ID);
    if (contactForm) {
        const contactFieldset = contactForm.querySelector('fieldset');
        const contactFormBtn = document.getElementById(CONTACT_FORM_BUTTON);

        if (
            contactFormBtn &&
            contactFormBtn instanceof HTMLButtonElement &&
            contactFieldset
        ) {
            if (window.Worker) {
                const formWorkerScript = document.getElementById(
                    FORM_WORKER_ID,
                ) as HTMLScriptElement;

                const workerPath = formWorkerScript.getAttribute('src');
                if (workerPath) {
                    formWorker = new Worker(workerPath);

                    // If we have a functional worker, enable the form fieldset
                    contactFieldset.disabled = false;

                    // Listen for the worker to send an encrypted message back
                    formWorker.onmessage = (event: MessageEvent) => {
                        const encryptedMessage = event.data as string;
                        const contactData: RequestContact = {
                            message: encryptedMessage,
                        };

                        axios
                            .post(API_CONTACT, contactData)
                            .then((response) => {
                                if (response.status === 200) {
                                    const responseData =
                                        response.data as ResponseData;

                                    // Give the user a success message and reset the form after a timeout
                                    showStatusMessage(
                                        responseData.message,
                                        CLASS_SUCCESS,
                                        contactFormBtn,
                                        FORM_RESET_TIMEOUT,
                                    );
                                    contactForm.reset();
                                } else {
                                    throw new Error(response.data);
                                }
                            })
                            .catch((error: AxiosError) => {
                                let errorMessage: string = '';

                                if (
                                    error.response &&
                                    error.response.data &&
                                    error.response.status < 500 &&
                                    error.response.status != 404
                                ) {
                                    const responseData = error.response
                                        .data as ResponseData;
                                    errorMessage = JSON.stringify(
                                        responseData.message,
                                    );
                                } else {
                                    errorMessage =
                                        'Server issue. Please try again later.';
                                }

                                showStatusMessage(
                                    `${ERROR_MESSAGE_PREFIX} ${errorMessage}`,
                                    CLASS_ERROR,
                                    contactFormBtn,
                                    FORM_RESET_TIMEOUT,
                                );
                                // don't reset the form on error, so the user can try again
                            });

                        if (contactFieldset) {
                            contactFieldset.disabled = false;
                            contactFormBtn.disabled = false;
                        }
                    };

                    contactForm.addEventListener('submit', (submitEvent) => {
                        submitEvent.preventDefault();

                        if (contactFieldset) {
                            contactFieldset.disabled = true;
                            contactFormBtn.disabled = true;
                        }

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

                                const formWorkerData: FormWorkerData = {
                                    data: formMessage,
                                    target: FORM_WORKER_TARGET,
                                };

                                formWorker.postMessage(formWorkerData);
                            }
                        }

                        return false;
                    });
                } else {
                    // TODO: form handling without web worker
                }
            }
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
