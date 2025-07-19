export function parseTransform(transform) {
    // Match transformation commands
    const RE = /(translate|rotate|scale|skewX|skewY|matrix)\s*\(\s*([^)]+)\)/g;
    const commands = [];
    let m;
    while ((m = RE.exec(transform))) {
        const [, cmd, args] = m;
        console.log(cmd, "\t", args);
        const nums = args
            .trim()
            .split(/[\s,]+/)
            .map(parseFloat);
        console.log(nums);
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
        const coords = cmd
            .slice(1)
            .trim()
            .split(/[\s,]+/)
            .filter((tok) => /^[0-9.+-eE]+$/.test(tok))
            .map(parseFloat);
        switch (type) {
            case "M":
                currX = coords[0];
                currY = coords[1];
                lines.push(`\tskip ${currX} ${currY}`);
                break;
            case "m":
                currX += coords[0];
                currY += coords[1];
                lines.push(`\tskip ${currX} ${currY}`);
                break;
            case "L":
                currX = coords[0];
                currY = coords[1];
                lines.push(`\t${currX} ${currY}`);
                break;
            case "l":
                currX += coords[0];
                currY += coords[1];
                lines.push(`\t${currX} ${currY}`);
                break;
            case "H":
                currX = coords[0];
                lines.push(`\t${currX} ${currY}`);
                break;
            case "V":
                currY = coords[0];
                lines.push(`\t${currX} ${currY}`);
                break;
            case "h":
                currX += coords[0];
                lines.push(`\t${currX} ${currY}`);
                break;
            case "v":
                currY += coords[0];
                lines.push(`\t${currX} ${currY}`);
                break;
            case "C":
                lines.push(`\tbezier ${coords.join(" ")}`);
                currX = coords[4];
                currY = coords[5];
                break;
            case "c":
                lines.push(`\tbezier ${[
                    coords[0] + currX,
                    coords[1] + currY,
                    coords[2] + currX,
                    coords[3] + currY,
                    coords[4] + currX,
                    coords[5] + currY,
                ].join(" ")}`);
                currX += coords[4];
                currY += coords[5];
                break;
            case "Q":
                lines.push(`\tquadratic ${coords.join(" ")}`);
                currX = coords[2];
                currY = coords[3];
                break;
            case "q":
                lines.push(`\tquadratic ${[
                    coords[0] + currX,
                    coords[1] + currY,
                    coords[2] + currX,
                    coords[3] + currY,
                ].join(" ")}`);
                currX += coords[2];
                currY += coords[3];
                break;
            case "Z":
            case "z":
                lines.push("}");
                return lines;
            default:
                console.warn(`\x1b[93mUnsupported <path> element: ${type}\x1b[0m`);
        }
    }
    lines.push("}");
    return lines;
}
