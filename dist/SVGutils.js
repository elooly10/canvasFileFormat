export function parseTransform(transform) {
    // Match transformation commands
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
                // rotate(angle [cx cy])
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
                lines.push(`\tskip ${currX} ${currY}`);
                break;
            case "m":
                currX += tokens[0];
                currY += tokens[1];
                lines.push(`\tskip ${currX} ${currY}`);
                break;
            case "L":
                currX = tokens[0];
                currY = tokens[1];
                lines.push(`\t${currX} ${currY}`);
                break;
            case "l":
                currX += tokens[0];
                currY += tokens[1];
                lines.push(`\t${currX} ${currY}`);
                break;
            case "H":
                currX = tokens[0];
                lines.push(`\t${currX} ${currY}`);
                break;
            case "V":
                currY = tokens[0];
                lines.push(`\t${currX} ${currY}`);
                break;
            case "h":
                currX += tokens[0];
                lines.push(`\t${currX} ${currY}`);
                break;
            case "v":
                currY += tokens[0];
                lines.push(`\t${currX} ${currY}`);
                break;
            case "C":
                lines.push(`\tbezier ${tokens.join(" ")}`);
                currX = tokens[4];
                currY = tokens[5];
                break;
            case "c":
                lines.push(`\tbezier ${[
                    tokens[0] + currX,
                    tokens[1] + currY,
                    tokens[2] + currX,
                    tokens[3] + currY,
                    tokens[4] + currX,
                    tokens[5] + currY,
                ].join(" ")}`);
                currX += tokens[4];
                currY += tokens[5];
                break;
            case "Q":
                lines.push(`\tquadratic ${tokens.join(" ")}`);
                currX = tokens[2];
                currY = tokens[3];
                break;
            case "q":
                lines.push(`\tquadratic ${[
                    tokens[0] + currX,
                    tokens[1] + currY,
                    tokens[2] + currX,
                    tokens[3] + currY,
                ].join(" ")}`);
                currX += tokens[2];
                currY += tokens[3];
                break;
            case "A":
                // absolute arc: rx ry xAxisRotation largeArcFlag sweepFlag x y
                {
                    const [rx, ry, xRot, largeArc, sweep, x, y] = tokens;
                    // Ignores most params
                    const radius = (rx + ry) / 2;
                    lines.push(`\tarc ${currX} ${currY} ${x} ${y} ${radius}`);
                    currX = x;
                    currY = y;
                }
                break;
            case "a":
                // relative arc: rx ry xAxisRotation largeArcFlag sweepFlag dx dy
                {
                    const [rx, ry, xRot, largeArc, sweep, dx, dy] = tokens;
                    const x = currX + dx;
                    const y = currY + dy;
                    const radius = (rx + ry) / 2;
                    lines.push(`\tarc ${currX} ${currY} ${x} ${y} ${radius}`);
                    currX = x;
                    currY = y;
                }
                break;
            case "Z":
            case "z":
                lines.push("}");
                return lines;
            default:
                console.warn(`\x1b[93mUnsupported <path> command: ${type}\x1b[0m`);
        }
    }
    lines.push("}");
    return lines;
}
