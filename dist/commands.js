function createCommands(commands) {
    return commands;
}
export default createCommands({
    'height': {
        args: ['point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.canvas.height = args[0];
        }
    },
    'width': {
        args: ['point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.canvas.width = args[0];
        }
    },
    'fill': {
        args: [],
        avaliblty: 'basic',
        handler: (ctx) => {
            ctx.fill();
        }
    },
    'stroke': {
        args: [],
        avaliblty: 'basic',
        handler: (ctx) => {
            ctx.stroke();
        }
    },
    'fill style': {
        args: ['text'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.fillStyle = args[0];
        }
    },
    'stroke style': {
        args: ['text'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.strokeStyle = args[0];
        }
    },
    'stroke width': {
        args: ['point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.lineWidth = args[0];
        }
    },
    'line cap': {
        args: ['text'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.lineCap = args[0];
        }
    },
    'line join': {
        args: ['text'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.lineJoin = args[0];
        }
    },
    'miter limit': {
        args: ['point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.miterLimit = args[0];
        }
    },
    'dash': {
        args: ['pointArray'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.setLineDash(args[0]);
        }
    },
    'dash offset': {
        args: ['point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.lineDashOffset = args[0];
        }
    },
    'begin path': {
        args: [],
        avaliblty: 'basic',
        handler: (ctx) => {
            ctx.beginPath();
        }
    },
    'close path': {
        args: [],
        avaliblty: 'basic',
        handler: (ctx) => {
            ctx.closePath();
        }
    },
    'save': {
        args: [],
        avaliblty: 'basic',
        handler: (ctx) => {
            ctx.save();
        }
    },
    'restore': {
        args: [],
        avaliblty: 'basic',
        handler: (ctx) => {
            ctx.restore();
        }
    },
    'reset': {
        args: [],
        avaliblty: 'basic',
        handler: (ctx) => {
            ctx.reset();
        }
    },
    'clear': {
        args: [],
        avaliblty: 'basic',
        handler: (ctx) => {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    },
    'reset transformations': {
        args: [],
        avaliblty: 'basic',
        handler: (ctx) => {
            ctx.resetTransform();
        }
    },
    'rotate': {
        args: ['angle'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.rotate(args[0]);
        }
    },
    'scale': {
        args: ['point', 'point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.scale(args[0], args[1]);
        }
    },
    'transform': {
        args: ['point', 'point', 'point', 'point', 'point', 'point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.transform(...args);
        }
    },
    'rect': {
        args: ['point', 'point', 'point', 'point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.rect(args[0], args[1], args[2], args[3]);
        }
    },
    'round rect': {
        args: ['point', 'point', 'point', 'point', 'point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.roundRect(args[0], args[1], args[2], args[3], args[4]);
        }
    },
    'stroke rect': {
        args: ['point', 'point', 'point', 'point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.strokeRect(args[0], args[1], args[2], args[3]);
        }
    },
    'fill rect': {
        args: ['point', 'point', 'point', 'point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.fillRect(args[0], args[1], args[2], args[3]);
        }
    },
    'clear rect': {
        args: ['point', 'point', 'point', 'point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.clearRect(args[0], args[1], args[2], args[3]);
        }
    },
    'ellipse': {
        args: ['point', 'point', 'point', 'point', 'angle', 'angle', 'angle', 'boolean'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.ellipse(args[0], args[1], args[2], args[3], args[4] ?? 0, args[5] ?? 0, args[6] ?? Math.PI * 2, args[7]);
        }
    },
    'arc': {
        args: ['point', 'point', 'point', 'angle', 'angle', 'boolean'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.arc(args[0], args[1], args[2], args[3], args[4], args[5]);
        }
    },
    'circle': {
        args: ['point', 'point', 'point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.arc(args[0], args[1], args[2], 0, Math.PI * 2);
        }
    },
    'curve': {
        args: ['point', 'point', 'point', 'point', 'point', 'point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.bezierCurveTo(args[0], args[1], args[2], args[3], args[4], args[5]);
        }
    },
    'quadratic': {
        args: ['point', 'point', 'point', 'point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.quadraticCurveTo(args[0], args[1], args[2], args[3]);
        }
    },
    'line to': {
        args: ['point', 'point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.lineTo(args[0], args[1]);
        }
    },
    'move to': {
        args: ['point', 'point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.moveTo(args[0], args[1]);
        }
    },
    'arc to': {
        args: ['point', 'point', 'point', 'point', 'point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.arcTo(args[0], args[1], args[2], args[3], args[4]);
        }
    },
    'fill text': {
        args: ['text', 'point', 'point', 'point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.fillText(args[0], args[1], args[2], args[3]);
        }
    },
    'stroke text': {
        args: ['text', 'point', 'point', 'point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.strokeText(args[0], args[1], args[2], args[3]);
        }
    },
    'text align': {
        args: ['text'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.textAlign = args[0];
        }
    },
    'text baseline': {
        args: ['text'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.textBaseline = args[0];
        }
    },
    'text direction': {
        args: ['text'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.direction = args[0];
        }
    },
    'font': {
        args: ['textArray'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.font = args[0].join(' ');
        }
    },
    'font kerning': {
        args: ['text'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.fontKerning = args[0];
        }
    },
    'font stretch': {
        args: ['text'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.fontStretch = args[0];
        }
    },
    'font caps': {
        args: ['text'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.fontVariantCaps = args[0];
        }
    },
    'fill linear': {
        args: ['point', 'point', 'point', 'point', 'textArray'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            const gradient = ctx.createLinearGradient(args[0], args[1], args[2], args[3]);
            // Add color stops
            let stopSize = 1 / (args[4].length - 1);
            for (let i = 0; i < args[4].length; i++) {
                gradient.addColorStop(i * stopSize, args[4][i]);
            }
            ctx.fillStyle = gradient;
        }
    },
    'stroke linear': {
        args: ['point', 'point', 'point', 'point', 'textArray'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            const gradient = ctx.createLinearGradient(args[0], args[1], args[2], args[3]);
            // Add color stops
            let stopSize = 1 / (args[4].length - 1);
            for (let i = 0; i < args[4].length; i++) {
                gradient.addColorStop(i * stopSize, args[4][i]);
            }
            ctx.strokeStyle = gradient;
        }
    },
    'fill radial': {
        args: ['point', 'point', 'point', 'textArray'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            const gradient = ctx.createRadialGradient(args[0], args[1], 0, args[0], args[1], args[2]);
            // Add color stops
            let stopSize = 1 / (args[3].length - 1);
            for (let i = 0; i < args[3].length; i++) {
                gradient.addColorStop(i * stopSize, args[3][i]);
            }
            ctx.fillStyle = gradient;
        }
    },
    'stroke radial': {
        args: ['point', 'point', 'point', 'textArray'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            const gradient = ctx.createRadialGradient(args[0], args[1], 0, args[0], args[1], args[2]);
            // Add color stops
            let stopSize = 1 / (args[3].length - 1);
            for (let i = 0; i < args[3].length; i++) {
                gradient.addColorStop(i * stopSize, args[3][i]);
            }
            ctx.strokeStyle = gradient;
        }
    },
    'fill conic': {
        args: ['point', 'point', 'point', 'textArray'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            const gradient = ctx.createConicGradient(args[0], args[1], args[2]);
            // Add color stops
            let stopSize = 1 / (args[3].length - 1);
            for (let i = 0; i < args[3].length; i++) {
                gradient.addColorStop(i * stopSize, args[3][i]);
            }
            ;
            ctx.fillStyle = gradient;
        }
    },
    'stroke conic': {
        args: ['point', 'point', 'point', 'textArray'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            const gradient = ctx.createConicGradient(args[0], args[1], args[2]);
            // Add color stops
            let stopSize = 1 / (args[3].length - 1);
            for (let i = 0; i < args[3].length; i++) {
                gradient.addColorStop(i * stopSize, args[3][i]);
            }
            ctx.strokeStyle = gradient;
        }
    },
    'shadow blur': {
        args: ['point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.shadowBlur = args[0];
        }
    },
    'shadow color': {
        args: ['text'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.shadowColor = args[0];
        }
    },
    'shadow offset': {
        args: ['point', 'point'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.shadowOffsetX = args[0];
            ctx.shadowOffsetY = args[1];
        }
    },
    'alpha': {
        args: ['number'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.globalAlpha = args[0];
        }
    },
    'composite': {
        args: ['text'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.globalCompositeOperation = args[0];
        }
    },
    'filter': {
        args: ['textArray'],
        avaliblty: 'basic',
        handler: (ctx, args) => {
            ctx.filter = args[0].join(' ');
        }
    },
});
