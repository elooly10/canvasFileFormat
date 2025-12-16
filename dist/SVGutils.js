export function parseTransform(transform) {
    const RE = /(translate|rotate|scale|skewX|skewY|matrix)\s*\(\s*([^)]+)\)/g;
    const commands = [];
    let m;
    while ((m = RE.exec(transform))) {
        const [, cmd, args] = m;
        const nums = args
            .trim()
            .split(/[\s,]+/)
            .map(parseFloat);
        switch (cmd) {
            case "translate":
                commands.push({ type: "translate", values: [nums[0], nums[1]] });
                break;
            case "rotate":
                commands.push({ type: "rotate", values: [nums[0], nums[1], nums[2]] });
                break;
            case "scale":
                commands.push({ type: "scale", values: [nums[0], nums[1]] });
                break;
            case "skewX":
                commands.push({ type: "skewX", values: [nums[0]] });
                break;
            case "skewY":
                commands.push({ type: "skewY", values: [nums[0]] });
                break;
            case "matrix":
                commands.push({
                    type: "matrix",
                    values: [nums[0], nums[1], nums[2], nums[3], nums[4], nums[5]],
                });
                break;
        }
    }
    return commands;
}
function fmt(n) {
    const s = (Math.round(n * 1000) / 1000).toString();
    return s === "-0" ? "0" : s;
}
// Arc to Bezier conversion based on common implementations (e.g. from generic SVG libraries)
// Arc to Bezier conversion based on SVG Implementation Notes
// https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
function arcToBezier(ox, oy, // Start point (x1, y1)
rx, ry, // Radii
rotate, // Rotation in degrees
large, sweep, // Flags
px, py // End point (x2, y2)
) {
    const x1 = ox;
    const y1 = oy;
    const x2 = px;
    const y2 = py;
    // 1. Ensure radii are positive
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    // 2. Convert rotation to radians
    const phi = (rotate % 360) * (Math.PI / 180);
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    // 3. Compute (x1', y1')
    const dx = (x1 - x2) / 2;
    const dy = (y1 - y2) / 2;
    const x1p = cosPhi * dx + sinPhi * dy;
    const y1p = -sinPhi * dx + cosPhi * dy;
    // 4. Correct radii
    const x1pSq = x1p * x1p;
    const y1pSq = y1p * y1p;
    let rxSq = rx * rx;
    let rySq = ry * ry;
    // Check if radii are large enough
    const lambda = x1pSq / rxSq + y1pSq / rySq;
    if (lambda > 1) {
        const sqrtLambda = Math.sqrt(lambda);
        rx *= sqrtLambda;
        ry *= sqrtLambda;
        rxSq = rx * rx;
        rySq = ry * ry;
    }
    // 5. Compute (cx', cy')
    let numerator = rxSq * rySq - rxSq * y1pSq - rySq * x1pSq;
    // Due to precision constraints, numerator can be slightly negative (effectively 0)
    if (numerator < 0)
        numerator = 0;
    const denominator = rxSq * y1pSq + rySq * x1pSq;
    let coef = Math.sqrt(numerator / denominator);
    if (large === sweep)
        coef = -coef;
    const cxp = coef * ((rx * y1p) / ry);
    const cyp = coef * (-(ry * x1p) / rx);
    // 6. Compute (cx, cy)
    const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;
    // 7. Compute angles
    // Angle function: angle between vector (ux, uy) and (vx, vy)
    const angle = (ux, uy, vx, vy) => {
        const dot = ux * vx + uy * vy;
        const len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
        // Clamp for precision
        let val = dot / len;
        if (val < -1)
            val = -1;
        if (val > 1)
            val = 1;
        let ang = Math.acos(val);
        if (ux * vy - uy * vx < 0)
            ang = -ang;
        return ang;
    };
    const startVectorX = (x1p - cxp) / rx;
    const startVectorY = (y1p - cyp) / ry;
    const startAngle = angle(1, 0, startVectorX, startVectorY);
    const endVectorX = (-x1p - cxp) / rx;
    const endVectorY = (-y1p - cyp) / ry;
    let dAngle = angle(startVectorX, startVectorY, endVectorX, endVectorY);
    if (sweep === 0 && dAngle > 0)
        dAngle -= 2 * Math.PI;
    if (sweep === 1 && dAngle < 0)
        dAngle += 2 * Math.PI;
    // 8. Segment and convert to Bezier
    const segments = Math.ceil(Math.abs(dAngle) / (Math.PI / 2));
    const delta = dAngle / segments;
    // alpha in approximate formula `alpha = 4/3 * tan(delta/4)` ? 
    // or `t = 8/3 * sin(delta/4)^2 / sin(delta/2)`
    const t = (8 / 3) * Math.sin(delta / 4) * Math.sin(delta / 4) / Math.sin(delta / 2);
    const points = [];
    let currentAngle = startAngle;
    for (let i = 0; i < segments; i++) {
        const nextAngle = currentAngle + delta;
        const cos1 = Math.cos(currentAngle);
        const sin1 = Math.sin(currentAngle);
        const cos2 = Math.cos(nextAngle);
        const sin2 = Math.sin(nextAngle);
        // Points on unit circle
        // pt1 = (cos1, sin1)
        // pt2 = (cos2, sin2)
        // Unrotated, unshifted points on ellipse
        const e1x = rx * cos1;
        const e1y = ry * sin1;
        const e2x = rx * cos2;
        const e2y = ry * sin2;
        // Derivatives (scaled by t for control points)
        // d/dtheta (rcos, rsin) = (-rsin, rcos)
        // cp1 = p1 + t * derivative(p1)
        const cp1xB = e1x - t * (rx * sin1); // Check sign. derivative of cos is -sin
        const cp1yB = e1y + t * (ry * cos1); // derivative of sin is cos
        // cp2 = p2 - t * derivative(p2)
        const cp2xB = e2x + t * (rx * sin2); // -t * (-rx*sin) = +t*rx*sin
        const cp2yB = e2y - t * (ry * cos2);
        // Now rotate and translate all points: e2, cp1, cp2
        // Helper to transform
        const tf = (px, py) => {
            return [
                cosPhi * px - sinPhi * py + cx,
                sinPhi * px + cosPhi * py + cy
            ];
        };
        const [cp1x, cp1y] = tf(cp1xB, cp1yB);
        const [cp2x, cp2y] = tf(cp2xB, cp2yB);
        const [x, y] = tf(e2x, e2y); // Target point
        points.push(cp1x, cp1y, cp2x, cp2y, x, y);
        currentAngle = nextAngle;
    }
    return points;
}
export function convertPath(d) {
    const commands = d.match(/[a-df-z][^a-df-z]*/gi) || [];
    const lines = [];
    let currX = 0, currY = 0;
    for (let cmd of commands) {
        const type = cmd[0];
        const tokens = cmd
            .slice(1)
            .trim()
            .split(/[\s,]+/)
            .filter((tok) => /^[0-9.+-eE]+$/.test(tok))
            .map(parseFloat);
        switch (type) {
            case "M":
                currX = tokens[0];
                currY = tokens[1];
                lines.push(`\tskip ${fmt(currX)} ${fmt(currY)}`);
                break;
            case "m":
                currX += tokens[0];
                currY += tokens[1];
                lines.push(`\tskip ${fmt(currX)} ${fmt(currY)}`);
                break;
            case "L":
                currX = tokens[0];
                currY = tokens[1];
                lines.push(`\t${fmt(currX)} ${fmt(currY)}`);
                break;
            case "l":
                currX += tokens[0];
                currY += tokens[1];
                lines.push(`\t${fmt(currX)} ${fmt(currY)}`);
                break;
            case "H":
                currX = tokens[0];
                lines.push(`\t${fmt(currX)} ${fmt(currY)}`);
                break;
            case "V":
                currY = tokens[0];
                lines.push(`\t${fmt(currX)} ${fmt(currY)}`);
                break;
            case "h":
                currX += tokens[0];
                lines.push(`\t${fmt(currX)} ${fmt(currY)}`);
                break;
            case "v":
                currY += tokens[0];
                lines.push(`\t${fmt(currX)} ${fmt(currY)}`);
                break;
            case "C":
                for (let i = 0; i < tokens.length; i += 6) {
                    lines.push(`\tbezier ${fmt(tokens[i])} ${fmt(tokens[i + 1])} ${fmt(tokens[i + 2])} ${fmt(tokens[i + 3])} ${fmt(tokens[i + 4])} ${fmt(tokens[i + 5])}`);
                    currX = tokens[i + 4];
                    currY = tokens[i + 5];
                }
                break;
            case "c":
                for (let i = 0; i < tokens.length; i += 6) {
                    const pts = [
                        tokens[i] + currX, tokens[i + 1] + currY,
                        tokens[i + 2] + currX, tokens[i + 3] + currY,
                        tokens[i + 4] + currX, tokens[i + 5] + currY
                    ];
                    lines.push(`\tbezier ${pts.map(fmt).join(" ")}`);
                    currX = pts[4];
                    currY = pts[5];
                }
                break;
            case "Q":
                for (let i = 0; i < tokens.length; i += 4) {
                    lines.push(`\tquadratic ${fmt(tokens[i])} ${fmt(tokens[i + 1])} ${fmt(tokens[i + 2])} ${fmt(tokens[i + 3])}`);
                    currX = tokens[i + 2];
                    currY = tokens[i + 3];
                }
                break;
            case "q":
                for (let i = 0; i < tokens.length; i += 4) {
                    const pts = [
                        tokens[i] + currX, tokens[i + 1] + currY,
                        tokens[i + 2] + currX, tokens[i + 3] + currY
                    ];
                    lines.push(`\tquadratic ${pts.map(fmt).join(" ")}`);
                    currX = pts[2];
                    currY = pts[3];
                }
                break;
            case "A":
                // rx ry rot large sweep x y
                for (let i = 0; i < tokens.length; i += 7) {
                    const destX = tokens[i + 5];
                    const destY = tokens[i + 6];
                    const pts = arcToBezier(currX, currY, tokens[i], tokens[i + 1], tokens[i + 2], tokens[i + 3], tokens[i + 4], destX, destY);
                    for (let j = 0; j < pts.length; j += 6) {
                        lines.push(`\tbezier ${pts.slice(j, j + 6).map(fmt).join(" ")}`);
                    }
                    currX = destX;
                    currY = destY;
                }
                break;
            case "a":
                for (let i = 0; i < tokens.length; i += 7) {
                    const destX = currX + tokens[i + 5];
                    const destY = currY + tokens[i + 6];
                    const pts = arcToBezier(currX, currY, tokens[i], tokens[i + 1], tokens[i + 2], tokens[i + 3], tokens[i + 4], destX, destY);
                    for (let j = 0; j < pts.length; j += 6) {
                        lines.push(`\tbezier ${pts.slice(j, j + 6).map(fmt).join(" ")}`);
                    }
                    currX = destX;
                    currY = destY;
                }
                break;
            case "Z":
            case "z":
                lines.push("}");
                return lines;
            default:
                console.warn(`Unsupported <path> command: ${type}`);
        }
    }
    lines.push("}"); // Close path
    return lines;
}
