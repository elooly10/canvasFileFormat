type angleMode = 'rad' | 'deg' | 'turn';
const fillStyle = "black";
const strokeStyle = "black";
const lineWidth = 1;
const lineCap: CanvasLineCap = "butt";
const lineJoin: CanvasLineJoin = "miter";
const miterLimit = 10;
const lineDash: number[] = [];
const lineDashOffset = 0;

function applyStyles(
	ctx: canvasContext,
	scale: number
) {
	ctx.fillStyle = fillStyle;
	ctx.lineWidth = lineWidth * scale;
	ctx.strokeStyle = strokeStyle;
	ctx.lineCap = lineCap;
	ctx.lineJoin = lineJoin;
	ctx.miterLimit = miterLimit * scale;
	ctx.setLineDash(lineDash.map(v => v * scale));
	ctx.lineDashOffset = lineDashOffset * scale;
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

type canvasElement = HTMLCanvasElement | OffscreenCanvas
type canvasContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
export default function applyCFF(
	canvas: canvasElement | canvasContext,
	text: string,
	resetCanvas: boolean = true,
	scale: number = 1
) {
	const canvasElementMode = !!(canvas as canvasElement).getContext
	const ctx: canvasContext = canvasElementMode? (canvas as canvasElement).getContext('2d')! as canvasContext: canvas as canvasContext;
	if (ctx) {
		applyStyles(
			ctx,
			scale
		);

		let inPath = false,
			inGroup = false;
		let angleMode: angleMode = "deg"; // While rad is more common, it can't be typed
		const lines = text.split('\n');
		if (resetCanvas) {
			lines.unshift('reset'); // Ensure the canvas is cleared before processing
		}
		for (let i = 0; i < lines.length; i++) {
			const content = lines[i].split('//')[0].trim(); // Get content, trim, and remove comments
			// Skip lines, returns, etc.
			if (!content) continue; // Skip empty lines
			if (content.startsWith('skip to line ')) {
				let value = parseFloat(content.replace('skip to line', '').trim());
				if (value > i) i = value;
			}

			// Groups and Paths
			if (content.startsWith('group {')) {
				inGroup = true; // Start of a group block
				ctx.save(); // Save the current state
				ctx.beginPath(); // Start a new path
				continue;
			}
			if (content.startsWith('path {')) inPath = true; // Start of a path block
			if (inPath) {
				if (content == '}') {
					inPath = false; // End of a path block
				}

				const parts = content
					.replace('skip', '')
					.replace('arc', '')
					.replace('bezier', '')
					.replace('quadratic', '')
					.replace('curve', '')
					.trim()
					.split(' ');
				if (content.startsWith('skip') && parts.length === 2) ctx.moveTo(...(parts.map((a) => parseFloat(a) * scale) as [number, number]));
				else if (parts.length === 2) {
					ctx.lineTo(...(parts.map((a) => parseFloat(a) * scale) as [number, number]));
				} else if (parts.length === 4) {
					ctx.quadraticCurveTo(
						...(parts.map((a) => parseFloat(a) * scale) as [number, number, number, number])
					);
				}
				else if (parts.length === 5) {
					ctx.arcTo(...(parts.map((a) => parseFloat(a) * scale) as [number, number, number, number, number]));
				} else if (parts.length === 6) {
					ctx.bezierCurveTo(
						...(parts.map((a) => parseFloat(a) * scale) as [number, number, number, number, number, number])
					);
				}
				continue;
			} else if (content.startsWith('}') && inGroup) {
				inGroup = false; // End group block
				ctx.restore(); // Restore the previous state
				ctx.beginPath(); // Start a new path
				continue;
			}

			if (content.startsWith('return'))
				break; // Stop processing on 'return'

			// Canvas Metadata Manipulation
			else if (content.startsWith('height ') && canvasElementMode) {
				const height = parseInt(content.replace('height', ''));
				(canvas as canvasElement).height = height * scale;
			} else if (content.startsWith('width ') && canvasElementMode) {
				const width = parseInt(content.replace('width', ''));
				(canvas as canvasElement).width = width * scale;
			}

			// Canvas Style Manipulation
			if (content.startsWith('fill style ')) {
				ctx.fillStyle = content.replace('fill style', '').trim();

			}
			if (content.startsWith('stroke style ')) {
				ctx.strokeStyle = content.replace('stroke style', '').trim();

			}
			if (content.startsWith('stroke width ')) {
				ctx.lineWidth = parseFloat(content.replace('stroke width', '').trim()) * scale;
			}
			if (content.startsWith('line cap ')) {
				ctx.lineCap = content.replace('line cap', '').trim() as CanvasLineCap;

			} else if (content.startsWith('line join ')) {
				ctx.lineJoin = content.replace('line join', '').trim() as CanvasLineJoin;

			} else if (content.startsWith('miter limit ')) {
				ctx.miterLimit = parseFloat(content.replace('miter limit', '').trim()) * scale;

			} else if (content.startsWith('dash ')) {
				ctx.setLineDash(content.replace('dash', '').trim().split(' ').map((v) => parseFloat(v) * 2));

			} else if (content.startsWith('dash offset ')) {
				ctx.lineDashOffset = parseFloat(content.replace('dash offset', '').trim()) * scale;

			}

			// Handle paths, save, restore, etc.
			if (content == 'begin path') {
				ctx.beginPath();
			} else if (content == 'close path') {
				ctx.closePath();
			} else if (content == 'save') {
				ctx.save()
			} else if (content == 'restore') {
				ctx.restore()
			} else if (content == 'reset' && (ctx as any).reset) {
				(ctx as any).reset();
				applyStyles(ctx, scale);
			} else if (content == 'reset' && !(ctx as any).reset && canvasElementMode) {
				ctx.clearRect(0, 0, (canvas as canvasElement).width, (canvas as canvasElement).height);
				applyStyles(ctx, scale);
			}

			// Transformations
			if (content == 'reset transformations') {
				ctx.resetTransform()
			} else if (content.startsWith('rotate')) {
				const value = content.replace("rotate", "").trim();
				const radians = toRadians(parseFloat(value), angleMode)
				ctx.rotate(radians);
			} else if (content.startsWith("scale ")) {
				const parts = content.replace("scale", "").trim().split(" ");
				if (parts.length === 6) {
					ctx.scale(
						...(parts.map((a) => parseFloat(a)) as [
							number,
							number,
						])
					);
				}
			} else if (content.startsWith("transform ")) {
				const parts = content.replace("transform", "").trim().split(" ");
				if (parts.length === 6) {
					ctx.setTransform(
						...(parts.map((a, i) => parseFloat(a) * (i > 3 ? scale : 1)) as [
							number,
							number,
							number,
							number,
							number,
							number
						])
					);
				}
			} else if (content.startsWith("transform relative ")) {
				const parts = content.replace("transform relative", "").trim().split(" ");
				if (parts.length === 6) {
					ctx.transform(
						...(parts.map((a, i) => parseFloat(a) * (i > 3 ? scale : 1)) as [
							number,
							number,
							number,
							number,
							number,
							number
						])
					);
				}
			}

			// Angle Modes
			if (content == 'use radians' || content == 'use rad') {
				angleMode = 'rad';
			} else if (content == 'use degrees' || content == 'use deg') {
				angleMode = 'deg';
			} else if (content == 'use turns' || content == 'use turn') {
				angleMode = 'turn';
			}

			// Rectangles
			if (content.startsWith('rect ')) {
				const parts = content.replace('rect', '').trim().split(' ');
				if (parts.length === 4) {
					ctx.rect(...(parts.map((a) => parseFloat(a) * scale) as [number, number, number, number]));
				}
			} else if (content.startsWith('round rect ')) {
				const parts = content.replace('round rect', '').trim().split(' ');
				if (parts.length === 5) {
					ctx.roundRect(
						...(parts.map((a) => parseFloat(a) * scale) as [number, number, number, number, number])
					);
				}
			} else if (content.startsWith('stroke rect ')) {
				const parts = content.replace('stroke rect', '').trim().split(' ');
				if (parts.length === 4) {
					ctx.strokeRect(...(parts.map((a) => parseFloat(a) * scale) as [number, number, number, number]));
				}
			} else if (content.startsWith('fill rect ')) {
				const parts = content.replace('fill rect', '').trim().split(' ');
				if (parts.length === 4) {
					ctx.fillRect(...(parts.map((a) => parseFloat(a) * scale) as [number, number, number, number]));
				}
			}

			// Ellipses
			if (content.startsWith('arc ')) {
				const parts = content.replace('arc', '').trim().split(' ');
				if (parts.length === 5 || parts.length === 6) {
					ctx.arc(
						parseFloat(parts[0]) * scale,
						parseFloat(parts[1]) * scale,
						parseFloat(parts[2]) * scale,
						toRadians(parseFloat(parts[3]), angleMode),
						toRadians(parseFloat(parts[4]), angleMode),
						parts.length === 6 ? parts[5] === "true" : false
					);
				}
			} else if (content.startsWith('ellipse ')) {
				const parts = content.replace('ellipse', '').trim().split(' ');
				if (parts.length === 7 || parts.length === 8) {
					ctx.ellipse(
						parseFloat(parts[0]) * scale,
						parseFloat(parts[1]) * scale,
						parseFloat(parts[2]) * scale,
						parseFloat(parts[3]) * scale,
						toRadians(parseFloat(parts[4]), angleMode),
						toRadians(parseFloat(parts[5]), angleMode),
						toRadians(parseFloat(parts[6]), angleMode),
						parts.length === 8 ? parts[7] === "true" : false
					);
				} 
				if (parts.length === 4) {
					ctx.ellipse(
						parseFloat(parts[0]) * scale,
						parseFloat(parts[1]) * scale,
						parseFloat(parts[2]) * scale,
						parseFloat(parts[3]) * scale,
						0,
						0,
						Math.PI * 2
					);
				} 
			} else if (content.startsWith('circle ')) {
					const parts = content.replace('circle', '').trim().split(' ').map(Number);
					if (parts.length === 3) {
						ctx.arc(
							parts[0] * scale,
							parts[1] * scale,
							parts[2] * scale,
							0,
							Math.PI * 2
						);
					}
				}

				// Lines
				if (
					content.startsWith('curve to ') ||
					content.startsWith('bezier to ') ||
					content.startsWith('quadratic to ')
				) {
					const parts = content
						.replace('curve to', '')
						.replace('bezier to', '')
						.replace('quadratic to', '')
						.trim()
						.split(' ');
					if (parts.length == 4)
						ctx.quadraticCurveTo(
							...(parts.map((a) => parseFloat(a) * scale) as [number, number, number, number])
						);
					if (parts.length == 6)
						ctx.bezierCurveTo(
							...(parts.map((a) => parseFloat(a) * scale) as [number, number, number, number, number, number])
						);
				}
				else if (content.startsWith('line to ')) {
					const parts = content.replace('line to', '').trim().split(' ');
					if (parts.length == 2) ctx.lineTo(...(parts.map((a) => parseFloat(a) * scale) as [number, number]));
				}
				else if (content.startsWith('move to ')) {
					const parts = content.replace('move to', '').trim().split(' ');
					if (parts.length == 2) ctx.moveTo(...(parts.map((a) => parseFloat(a) * scale) as [number, number]));
				}
				else if (content.startsWith('arc to ')) {
					const parts = content.replace('arc to', '').trim().split(' ');
					if (parts.length == 5) ctx.arcTo(...(parts.map((a) => parseFloat(a) * scale) as [number, number, number, number, number]));
				}

				// Drawing Functions
				if (content == 'fill') {
					ctx.fill();
				} else if (content == 'stroke') {
					ctx.stroke();
				} else if (content.startsWith('clear rect ')) {
					const parts = content.replace('clear rect', '').trim().split(' ');
					if (parts.length === 4) {
						ctx.clearRect(...(parts.map((a) => parseFloat(a) * scale) as [number, number, number, number]));
					}
				} else if (content == 'clear' && canvasElementMode) {
					ctx.clearRect(0, 0, (canvas as canvasElement).width, (canvas as canvasElement).height);
				}

				/* 
					To add: 
					- Text
					- Gradients (and patterns?)
					- Clipping paths?
					- Shadows
					- Proper support for save and restore when using groups
				*/
			}
		}
	}
