// Functions
function getElementSize (elm) {
    // Returns the width and height of an element, without padding.

    elm = $(elm);

    return {
        w: elm.width(),
        h: elm.height(),
    };
}

function getCanvasSize () {
    // Calculates the size that the canvas should be, based on the size of the canvas.
    // Default is a 16:9 aspect ratio, change this variable to change the ratio.

    const ratio = { x: 16, y: 9 };

    let maxSize = getElementSize(`#container`);

    let width = maxSize.w;
    let height = width / ratio.x * ratio.y;

    if (height > window.innerHeight) {
        height = window.innerHeight * 0.85;
        width = height / ratio.y * ratio.x;
    }

    return {
        w: Math.floor(width),
        h: Math.floor(height),
    };
}

function onResize () {
    // A function that runs on window resize and document load.

    let size = getCanvasSize();

    $(`#canvas`).width(size.w);
    $(`#canvas`).height(size.h);
}

// Bindings
$(document).ready(onResize);
$(window).resize(onResize);