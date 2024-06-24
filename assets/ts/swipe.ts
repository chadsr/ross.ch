interface ISwipeFunc {
    (index: number): void;
}

export default class SwipeNav {
    private swipeElement: HTMLElement;
    private swipeThreshold: number;
    private startX: number;
    private endX: number;
    private minIndex: number;
    private maxIndex: number;
    private currentIndex: number;
    private swipeFunc: ISwipeFunc;

    constructor(
        elementId: string,
        swipeThreshold: number = 50,
        minIndex: number,
        maxIndex: number,
        swipeFunc: ISwipeFunc
    ) {
        const swipeElement = document.getElementById(elementId);
        if (swipeElement === null) {
            throw new Error(`${elementId} was not found`);
        }
        this.swipeElement = swipeElement;
        this.swipeThreshold = swipeThreshold;
        this.startX = 0;
        this.endX = 0;
        this.minIndex = minIndex;
        this.maxIndex = maxIndex;
        this.currentIndex = 0;
        this.swipeFunc = swipeFunc;

        this.swipeElement.addEventListener(
            'touchstart',
            this.touchStart.bind(this),
            false
        );

        this.swipeElement.addEventListener(
            'touchmove',
            this.touchMove.bind(this),
            false
        );
        this.swipeElement.addEventListener(
            'touchend',
            this.touchEnd.bind(this),
            false
        );
    }

    private touchStart(event: TouchEvent) {
        const touch = event.targetTouches[0];
        this.startX = touch.pageX;
    }

    private touchMove(event: TouchEvent) {
        const touch = event.targetTouches[0];
        this.endX = touch.pageX;
        event.preventDefault();
    }

    private touchEnd(event: TouchEvent) {
        if (this.endX - this.startX > this.swipeThreshold) {
            // Swipe right
            if (this.currentIndex > 0) {
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

        event.preventDefault();
    }
}
