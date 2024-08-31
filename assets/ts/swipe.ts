/**
 * Interface that defines a swipe function with an index parameter.
 * The swipe function should accept a single number argument and return void.
 */
export interface ISwipeFunc {
    (index: number): void;
}

export default class SwipeNav {
    private swipeElement: HTMLElement;
    private swipeThreshold: number;
    private disabledElements: Array<string>;
    private startX: number;
    private endX: number;
    private minIndex: number;
    private maxIndex: number;
    private currentIndex: number;
    private swipeFunc: ISwipeFunc;
    /**
     * Initializes the SwipeNav with given properties.
     *
     * @param {string} elementId - The ID of the swipeable element
     * @param {number=} swipeThreshold - The distance (in pixels) that needs to be swiped for an action to occur. Default is 100.
     * @param {number} minIndex - The minimum index that can be accessed in this SwipeNav
     * @param {number} maxIndex - The maximum index that can be accessed in this SwipeNav
     * @param {ISwipeFunc} swipeFunc - The callback function to be called when an action is performed on the SwipeNav.
     */
    constructor(
        elementId: string,
        swipeThreshold: number = 100,
        disabledElements: string[] = [],
        currentIndex: number,
        minIndex: number,
        maxIndex: number,
        swipeFunc: ISwipeFunc,
    ) {
        const swipeElement = document.getElementById(elementId);
        if (swipeElement === null) {
            throw new Error(`${elementId} was not found`);
        }
        this.swipeElement = swipeElement;
        this.swipeThreshold = swipeThreshold;
        this.disabledElements = disabledElements;
        this.startX = 0;
        this.endX = 0;
        this.minIndex = minIndex;
        this.maxIndex = maxIndex;
        this.currentIndex = 0;
        this.swipeFunc = swipeFunc;

        this.swipeElement.addEventListener(
            'touchstart',
            this.touchStart.bind(this),
            false,
        );

        this.swipeElement.addEventListener(
            'touchmove',
            this.touchMove.bind(this),
            false,
        );
        this.swipeElement.addEventListener(
            'touchend',
            this.touchEnd.bind(this),
            false,
        );
    }

    /**
     * Helper function to get the tag name of an HTML element.
     *
     * @param {HTMLElement} element - The HTML element to get the tag name from
     * @returns {string} The tag name of the given element
     */
    private static tagName = (element: HTMLElement): string => {
        return element.tagName.toLowerCase();
    };

    /**
     * Check if the given element is a disabled element for swiping.
     *
     * This function checks if the given element's node name is in the list of DISABLED_ELEMENTS. If it is, returns true; otherwise, returns false.
     *
     * @param {HTMLElement} element The element to check
     * @returns {boolean} Whether the element is disabled or not
     */
    private isDisabledElement = (element: HTMLElement): boolean => {
        if (this.disabledElements.includes(SwipeNav.tagName(element))) {
            return true;
        }
        return false;
    };

    /**
     * The touchstart event handler. It captures the initial position of a swipe gesture and checks if it's an allowed element for swiping.
     *
     * @param {TouchEvent} event - The touch event that triggered this function
     */
    private touchStart = (event: TouchEvent) => {
        const touch = event.targetTouches[0];
        const targetElement = touch.target as HTMLElement;

        if (this.isDisabledElement(targetElement)) {
            this.startX = 0;
        } else {
            this.startX = touch.pageX;
        }
    };

    /**
     * The touchmove event handler. It captures the current position of a swipe gesture and checks if it's an allowed element for swiping.
     *
     * @param {TouchEvent} event - The touch event that triggered this function
     */
    private touchMove = (event: TouchEvent) => {
        const touch = event.targetTouches[0];
        const targetElement = touch.target as HTMLElement;

        if (this.isDisabledElement(targetElement)) {
            this.endX = 0;
        } else {
            this.endX = touch.pageX;
        }
    };

    /**
     * The touchend event handler. It determines whether a swipe action has been performed and, if so, adjusts the current index accordingly.
     *
     * @param none
     */
    private touchEnd = () => {
        // both values should be non-zero
        if (this.endX !== 0 && this.startX !== 0) {
            if (this.endX - this.startX > this.swipeThreshold) {
                // Swipe right
                if (this.currentIndex > this.minIndex) {
                    this.currentIndex -= 1;
                    this.swipeFunc(this.currentIndex);
                }
            } else if (this.startX - this.endX > this.swipeThreshold) {
                // Swipe left
                if (this.currentIndex < this.maxIndex) {
                    this.currentIndex += 1;
                    this.swipeFunc(this.currentIndex);
                }
            }
        }

        this.startX = 0;
        this.endX = 0;
    };
}
