import commands from "./commands.js";
type angleMode = 'rad' | 'deg' | 'turn';
type style = {
	fillStyle: string | CanvasGradient | CanvasPattern;
	strokeStyle: string | CanvasGradient | CanvasPattern;
	lineWidth: number;
	lineCap: CanvasLineCap;
	lineJoin: CanvasLineJoin;
	miterLimit: number;
	lineDash: number[];
	lineDashOffset: number;
	shadow: {
		blur: number;
		color: string;
		offset: [number, number];
	}
}
const baseStyle: style = {
	fillStyle: "black",
	strokeStyle: "black",
	lineWidth: 1,
	lineCap: "butt",
	lineJoin: "miter",
	miterLimit: 10,
	lineDash: [],
	lineDashOffset: 0,
	shadow: {
		blur: 0,
		color: "transparent",
		offset: [0, 0],
	}
}
function applyStyles(
	ctx: canvasContext,
	scale: number,
	style: style = baseStyle
) {
	ctx.fillStyle = style.fillStyle;
	ctx.lineWidth = style.lineWidth * scale;
	ctx.strokeStyle = style.strokeStyle;
	ctx.lineCap = style.lineCap;
	ctx.lineJoin = style.lineJoin;
	ctx.miterLimit = style.miterLimit * scale;
	ctx.setLineDash(style.lineDash.map(v => v * scale));
	ctx.lineDashOffset = style.lineDashOffset * scale;
	ctx.shadowBlur = style.shadow.blur;
	ctx.shadowColor = style.shadow.color;
	ctx.shadowOffsetX = style.shadow.offset[0];
	ctx.shadowOffsetY = style.shadow.offset[1];
}

function toRadians(value: number, mode: angleMode): number {
	if (mode === 'deg') {
		return (value * Math.PI) / 180;
	}
	if (mode === 'turn') {
		return value * 2 * Math.PI;
	}
	else return value
}
type canvasContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
function pathMode(path: string[], scale: number): Path2D {
	let path2d = new Path2D();
	for (let i = 0; i < path.length; i++) {
		const content = path[i].split('//')[0].trim(); // Get content, trim, and remove comments
		const commandText = content.split(' ').map((v, i) => v.trim());
		let command = commandText[0];
		const contents = commandText.slice(1).map((v) => parseFloat(v) * scale);
		if (!isNaN(parseFloat(command))) {
			contents.unshift(parseFloat(command) * scale);
			command = 'line';
		}
		if (command == 'skip' || command == 'move') path2d.moveTo(contents[0], contents[1]);
		else if (command == 'line') path2d.lineTo(contents[0], contents[1]);
		else if (command == 'bezier') path2d.bezierCurveTo(contents[0], contents[1], contents[2], contents[3], contents[4], contents[5]);
		else if (command == 'quadratic') path2d.quadraticCurveTo(contents[0], contents[1], contents[2], contents[3]);
		else if (command == 'arc') path2d.arc(contents[0], contents[1], contents[2], contents[3], contents[4], commandText[6] == 'true');
		else if (command == 'arcTo') path2d.arcTo(contents[0], contents[1], contents[2], contents[3], contents[4]);
		else if (command == 'ellipse') path2d.ellipse(contents[0], contents[1], contents[2], contents[3], contents[4], contents[5], contents[6], commandText[8] == 'true');
		else if (command == 'rect') path2d.rect(contents[0], contents[1], contents[2], contents[3]);
		else if (command == 'round' && commandText[1] == 'rect') path2d.roundRect(contents[1], contents[2], contents[3], contents[4], contents[5]);
		else if (command == 'close') path2d.closePath();
		else console.log(`Path command error ${command}\n${path.join('\n')}`)
	}
	return path2d;
}

function saveContext(ctx: canvasContext, scale: number): style {
	return {
		fillStyle: ctx.fillStyle,
		strokeStyle: ctx.strokeStyle,
		lineWidth: ctx.lineWidth / scale,
		lineCap: ctx.lineCap,
		lineJoin: ctx.lineJoin,
		miterLimit: ctx.miterLimit / scale,
		lineDash: ctx.getLineDash().map(v => v / scale),
		lineDashOffset: ctx.lineDashOffset / scale,
		shadow: {
			blur: ctx.shadowBlur,
			color: ctx.shadowColor,
			offset: [ctx.shadowOffsetX, ctx.shadowOffsetY]
		}
	}
}
/**
 * Apply a canvas file to a canvas context
 * @param ctx The canvas context to apply the file to
 * @param file The file to apply
 * @param scale The scale to apply to the file
 */
export default function applyCFF(
	ctx: canvasContext,
	file: string,
	scale: number = 1
) {
	if (ctx) {
		applyStyles(
			ctx,
			scale
		);

		let groups: style[] = [];
		let angleMode: angleMode = "deg"; // Degrees are nicer to type
		const lines = file.split('\n').map(v => v.split('//')[0].trim());
		for (let i = 0; i < lines.length; i++) {
			const content = lines[i];
			const commandText = content.split(' ').map(v => v.trim());

			/** Word combonations treated as one command */
			const doubles = [['dash', 'offset'], ['reset', 'transformations'], ['transform', 'relative'], ['font', 'caps'], ['font', 'kerning'], ['font', 'stretch']]

			/** Commands that will combine with the next word */
			const wordFilters = ['fill', 'stroke', 'line', 'begin', 'close', 'miter', 'round', 'clear', 'move', 'shadow', 'clip', 'text', 'multi'];
			if (wordFilters.includes(commandText[0]) && commandText.length > 1 || doubles.includes([commandText[0], commandText[1]])) commandText[0] = `${commandText.shift()} ${commandText[0]}`;
			// Skip lines, returns, etc.
			if (!content) continue; // Skip empty lines
			if (content.startsWith('skip to line ')) {
				let value = parseFloat(content.replace('skip to line', '').trim());
				if (value > i) i = value;
			}

			// Groups and Paths
			if (commandText[0] == 'group') {
				groups.push(saveContext(ctx, scale)); // Start of a group block
				ctx.save(); // Save the current state
				ctx.beginPath(); // Start a new path
				continue;
			}
			if (commandText[0] == 'fill path') {
				let index = lines.indexOf('}', i);
				ctx.fill(pathMode(lines.slice(i + 1, index), scale));
				i = index;
				continue;
			} else if (commandText[0] == 'stroke path') {
				let index = lines.indexOf('}', i);
				ctx.stroke(pathMode(lines.slice(i + 1, index), scale));
				i = index;
				continue;
			} else if (commandText[0] == 'multi path') {
				let index = lines.indexOf('}', i);
				let path = pathMode(lines.slice(i + 1, index), scale)
				ctx.fill(path);
				ctx.stroke(path);
				i = index;
				continue;
			} else if (commandText[0] == 'clip path') {
				let index = lines.indexOf('}', i);
				ctx.clip(pathMode(lines.slice(i + 1, index - 1), scale));
				i = index;
				continue;
			} else if (commandText[0] == '}') {
				ctx.restore(); // Restore the previous state
				applyStyles(ctx, scale, groups.pop());
				ctx.beginPath(); // Start a new path
				continue;
			}

			if (commandText[0] == 'return')
				break;

			// Angle Modes
			if (content == 'use radians' || content == 'use rad') {
				angleMode = 'rad';
				continue;
			} else if (content == 'use degrees' || content == 'use deg') {
				angleMode = 'deg';
				continue;
			} else if (content == 'use turns' || content == 'use turn') {
				angleMode = 'turn';
				continue;
			}
			const command = commands[commandText[0] as keyof typeof commands];
			if (command) {
				if (command.avaliblty == 'basic' || command.avaliblty == 'applyStyles') {
					// Valid Command for enviroment
					let args: any[] = [];
					commandText.slice(1).forEach((arg, i, arr) => {
						if (command.args[i] == 'text') {
							args.push(arg);
						} else if (command.args[i] == 'number') {
							args.push(parseFloat(arg));
						} else if (command.args[i] == 'boolean') {
							args.push(arg == 'true');
						} else if (command.args[i] == 'point') {
							args.push(parseFloat(arg) * scale);
						} else if (command.args[i] == 'angle') {
							let angle = arg == 'PI' ? Math.PI : arg.includes('PI') ? parseInt(arg.replace('PI', '')) * Math.PI : parseFloat(arg);
							args.push(toRadians(angle, angleMode));
						} else if (command.args[i] == 'pointArray') {
							args.push(arr.slice(i).map((a) => parseFloat(a) * scale));
						} else if (command.args[i] == 'textArray') {
							args.push(arr.slice(i));
						}
					})
					command.handler(ctx, args as any);
					if (command.avaliblty == 'applyStyles') applyStyles(ctx, scale);
				}
			} else {
				console.error(`Command ${commandText[0]} in line ${i} not found "${content}"`)
			}
		}
	}
}
