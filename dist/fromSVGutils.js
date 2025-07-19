export function parseTransform(transform) {
    // matches things including translate(10,20) rotate(45) scale(2,3) skewX(10) matrix(a b c d e f)
    const RE = /(translate|rotate|scale|skewX|skewY|matrix)\s*$\s*([^$]+)\)/g;
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
