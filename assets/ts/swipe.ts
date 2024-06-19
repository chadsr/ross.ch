interface SwipeFunc {
    side: number
}

export default class SwipeNav {
    private swipeElement: HTMLElement
    private startX: number
    private startY: number
    private swipeFunc: SwipeFunc

    constructor(elementId: string, swipeFunc: SwipeFunc) {
        this.swipeElement = document.getElementById(elementId)
        this.startX = 0
        this.startY = 0
        this.swipeFunc = swipeFunc

        this.swipeElement.addEventListener(
            'touchstart',
            this.touchStart.bind(this),
            false
        )
        this.swipeElement.addEventListener(
            'touchmove',
            this.touchMove.bind(this),
            false
        )
        this.swipeElement.addEventListener(
            'touchend',
            this.touchEnd.bind(this),
            false
        )
    }

    private touchStart(event: TouchEvent) {
        const touch = event.changedTouches[0]
        this.startX = touch.pageX
        this.startY = touch.pageY
        // event.preventDefault()
    }

    private touchMove(event: TouchEvent) {
        event.preventDefault()
    }

    private touchEnd(event: TouchEvent) {
        // const touch = event.changedTouches[0]
        event.preventDefault()
    }
}
