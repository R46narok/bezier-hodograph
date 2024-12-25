let controlPoints = [];
let isAddingControlPoints = false;
let isDragging = false;
let draggedPointIndex = -1;

/**
 * Computes the de Casteljau's algorithm for a given set of control points and a parameter t.
 * This algorithm is used to compute the intermediate points of a Bézier curve.
 *
 * @param {Array} points - Array of control points (each point is an object with x and y properties).
 * @param {number} t - A parameter (between 0 and 1) to determine the intermediate points.
 * @return {Array} allPoints - A 2D array representing all intermediate points at each level of de Casteljau's algorithm.
 */
function deCasteljau(points, t) {
    let newPoints = points.slice();
    let allPoints = [newPoints.slice()];
    while (newPoints.length > 1) {
        let tempPoints = [];
        for (let i = 0; i < newPoints.length - 1; i++) {
            let x = (1 - t) * newPoints[i].x + t * newPoints[i + 1].x;
            let y = (1 - t) * newPoints[i].y + t * newPoints[i + 1].y;
            tempPoints.push({ x: x, y: y });
        }
        newPoints = tempPoints;
        allPoints.push(newPoints.slice());
    }
    return allPoints;
}

/**
 * Draws the intermediate points and Bézier curve on the canvas.
 *
 * @param {CanvasRenderingContext2D} ctx - The 2D drawing context of the canvas.
 * @param {Array} allPoints - Array of all intermediate points.
 * @param {Array} finalPoints - Array of final points that form the Bézier curve.
 * @param {boolean} drawFinal - Whether to draw the final Bézier curve.
 */
function drawIntermediatePoints(ctx, allPoints, finalPoints, drawFinal) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.beginPath();
    ctx.moveTo(allPoints[0][0].x, allPoints[0][0].y);
    for (let i = 1; i < allPoints[0].length; i++) {
        ctx.lineTo(allPoints[0][i].x, allPoints[0][i].y);
    }
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();

    ctx.fillStyle = 'black';
    for (let i = 0; i < allPoints[0].length; i++) {
        ctx.beginPath();
        ctx.arc(allPoints[0][i].x, allPoints[0][i].y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }

    if (!drawFinal) {
        for (let i = 1; i < allPoints.length; i++) {
            ctx.beginPath();
            ctx.moveTo(allPoints[i][0].x, allPoints[i][0].y);
            for (let j = 1; j < allPoints[i].length; j++) {
                ctx.lineTo(allPoints[i][j].x, allPoints[i][j].y);
            }
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.stroke();
        }
    }

    if (finalPoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(finalPoints[0].x, finalPoints[0].y);
        for (let i = 1; i < finalPoints.length; i++) {
            ctx.lineTo(finalPoints[i].x, finalPoints[i].y);
        }
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.stroke();
    }
}

/**
 * Computes the derivative of a Bézier curve at the control points.
 *
 * @return {Array} derivativePoints - Array of derivative vectors (each vector is an object with x and y properties).
 */
function bezierCurveDerivative() {
    let derivativePoints = [];
    for (let i = 0; i < controlPoints.length - 1; i++) {
        let dx = controlPoints[i + 1].x - controlPoints[i].x;
        let dy = controlPoints[i + 1].y - controlPoints[i].y;
        derivativePoints.push({ x: dx, y: dy });
    }
    return derivativePoints;
}

/**
 * Draws an arrowhead from a given point to another point on the canvas.
 *
 * @param {CanvasRenderingContext2D} ctx - The 2D drawing context of the canvas.
 * @param {number} fromX - The x-coordinate of the start of the arrow.
 * @param {number} fromY - The y-coordinate of the start of the arrow.
 * @param {number} toX - The x-coordinate of the end of the arrow.
 * @param {number} toY - The y-coordinate of the end of the arrow.
 */
function drawArrowhead(ctx, fromX, fromY, toX, toY) {
    const headLength = 10; // length of head in pixels
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
}

/**
 * Draws the derivative vectors (tangent vectors) on the canvas.
 *
 * @param {CanvasRenderingContext2D} ctx - The 2D drawing context of the canvas.
 * @param {Array} derivativeVectors - Array of derivative vectors.
 * @param {number} centerX - The x-coordinate of the center (for positioning the vectors).
 * @param {number} centerY - The y-coordinate of the center (for positioning the vectors).
 */
function drawDerivativeVectors(ctx, derivativeVectors, centerX, centerY) {
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    derivativeVectors.forEach(vector => {
        const toX = centerX + vector.x;
        const toY = centerY + vector.y;
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(toX, toY);
        drawArrowhead(ctx, centerX, centerY, toX, toY);
    });
    ctx.stroke();
}

/**
 * Animates the drawing of the Bézier curve and its derivative vectors.
 * The function uses `requestAnimationFrame` to animate the curve over time.
 *
 * @param {CanvasRenderingContext2D} ctx - The 2D drawing context of the canvas for the Bézier curve.
 * @param {Array} points - The array of control points for the Bézier curve.
 * @param {number} steps - The number of steps for the animation (higher for smoother animation).
 * @param {Array} derivativeVectors - The derivative vectors to animate along with the Bézier curve.
 * @param {number} centerX - The x-coordinate of the center.
 * @param {number} centerY - The y-coordinate of the center.
 */
function animateBezierCurve(ctx, points, steps, derivativeVectors, centerX, centerY) {
    let t = 0;
    let finalPoints = [];
    function animate() {
        if (t > 1) {
            if (derivativeVectors) {
                let translatedVectors = derivativeVectors.map(vector => {
                    return { x: vector.x + centerX, y: vector.y + centerY };
                });

                drawIntermediatePoints(ctx, [translatedVectors], finalPoints, true);
                drawDerivativeVectors(ctx, derivativeVectors, centerX, centerY);
            } else {
                drawIntermediatePoints(ctx, [controlPoints], finalPoints, true);
            }

            return;
        }
        let allPoints = deCasteljau(points, t);
        finalPoints.push(allPoints[allPoints.length - 1][0]);
        drawIntermediatePoints(ctx, allPoints, finalPoints, false);

        let tracingPoint = allPoints[allPoints.length - 1][0];
        ctx.beginPath();
        ctx.arc(tracingPoint.x, tracingPoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'green';
        ctx.fill();

        if (derivativeVectors) {
            drawDerivativeVectors(ctx, derivativeVectors, centerX, centerY);
        }

        t += 1 / steps;
        requestAnimationFrame(animate);
    }
    animate();
}

/**
 * Resets both the main canvas and the derivative canvas, clearing their content and resetting control points.
 *
 * @param {CanvasRenderingContext2D} ctx - The 2D drawing context of the main canvas.
 * @param {CanvasRenderingContext2D} derivativeCtx - The 2D drawing context of the derivative canvas.
 */
function resetCanvas(ctx, derivativeCtx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    derivativeCtx.clearRect(0, 0, derivativeCtx.canvas.width, derivativeCtx.canvas.height);
    controlPoints = [];
}

/**
 * Initializes event listeners for the canvas and buttons upon window load.
 * Allows users to add control points, drag points, and animate Bézier curves.
 */
window.onload = function() {
    const canvas = document.getElementById('bezierCanvas');
    const ctx = canvas.getContext('2d');
    const derivativeCanvas = document.getElementById('derivativeCanvas');
    const derivativeCtx = derivativeCanvas.getContext('2d');

    canvas.addEventListener('click', function(event) {
        if (isAddingControlPoints) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            controlPoints.push({ x: x, y: y });
            drawIntermediatePoints(ctx, [controlPoints], []);
        }
    });

    canvas.addEventListener('mousedown', function(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        for (let i = 0; i < controlPoints.length; i++) {
            const point = controlPoints[i];
            const dx = point.x - x;
            const dy = point.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < 5) {
                isDragging = true;
                draggedPointIndex = i;
                break;
            }
        }
    });

    canvas.addEventListener('mousemove', function(event) {
        if (isDragging) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            controlPoints[draggedPointIndex] = { x: x, y: y };
            let finalPoints = [];
            for (let i = 0; i <= 150; i++) {
                let t = i / 150;
                let allPoints = deCasteljau(controlPoints, t);
                finalPoints.push(allPoints[allPoints.length - 1][0]);
            }
            drawIntermediatePoints(ctx, [controlPoints], finalPoints, true);

            let derivativeVectors = bezierCurveDerivative();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            let translatedVectors = derivativeVectors.map(vector => {
                return { x: vector.x + centerX, y: vector.y + centerY };
            });

            finalPoints = [];
            for (let i = 0; i <= 150; i++) {
                let t = i / 150;
                let allPoints = deCasteljau(translatedVectors, t);
                finalPoints.push(allPoints[allPoints.length - 1][0]);
            }

            drawIntermediatePoints(derivativeCtx, [translatedVectors], finalPoints, true);
            drawDerivativeVectors(derivativeCtx, derivativeVectors, centerX, centerY);
        }
    });

    canvas.addEventListener('mouseup', function() {
        isDragging = false;
        draggedPointIndex = -1;
    });

    document.getElementById('controlPointsButton').addEventListener('click', function() {
        isAddingControlPoints = true;
    });

    document.getElementById('bezierCurveButton').addEventListener('click', function() {
        isAddingControlPoints = false;
        animateBezierCurve(ctx, controlPoints, 150);

        let derivativeVectors = bezierCurveDerivative();
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        let translatedVectors = derivativeVectors.map(vector => {
            return { x: vector.x + centerX, y: vector.y + centerY };
        });

        animateBezierCurve(derivativeCtx, translatedVectors, 150, derivativeVectors, centerX, centerY);
    });

    document.getElementById('resetButton').addEventListener('click', function() {
        isAddingControlPoints = false;
        resetCanvas(ctx, derivativeCtx);
    });
};
