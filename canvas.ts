type angleMode = 'rad' | 'deg' | 'turn';

function applyStyles(
	ctx: CanvasRenderingContext2D,
	fillStyle: any,
	lineWidth: any,
	strokeStyle: any,
	lineCap: any = 'butt',
	lineJoin: any = 'miter',
	miterLimit: any = 10,
	lineDash: any = [],
	lineDashOffset: any = 0
) {
	ctx.fillStyle = fillStyle;
	ctx.lineWidth = lineWidth;
	ctx.strokeStyle = strokeStyle;
	ctx.lineCap = lineCap;
	ctx.lineJoin = lineJoin;
	ctx.miterLimit = miterLimit;
	ctx.setLineDash(lineDash);
	ctx.lineDashOffset = lineDashOffset;
}

function toRadians(value: number, mode: angleMode): number {
	if(mode === 'deg') {
		return (value * Math.PI) / 180;
	}
	if(mode === 'turn') {
		return value * 2 * Math.PI;
	}
	else return value
}


export default function execute(
	canvas: HTMLCanvasElement,
	text: string,
	resetCanvas: boolean = true
) {
	const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as any;
	if(ctx) {
	let fillStyle = 'black';
	let strokeStyle = 'black';
	let lineWidth = 1;
	let lineCap = 'butt';
	let lineJoin = 'miter';
	let miterLimit = 10;
	let lineDash: number[] = [];
	let lineDashOffset = 0;
	applyStyles(
		ctx,
		fillStyle,
		lineWidth,
		strokeStyle,
		lineCap,
		lineJoin,
		miterLimit,
		lineDash,
		lineDashOffset
	);

	let inPath = false,
		inGroup = false;
	let angleMode: angleMode = "rad";
	const lines = text.split('\n');
	if (resetCanvas) {
		lines.unshift('clear'); // Ensure the canvas is cleared before processing
	}
	function speedApplyStyles() {
		applyStyles(
			ctx,
			fillStyle,
			lineWidth,
			strokeStyle,
			lineCap,
			lineJoin,
			miterLimit,
			lineDash,
			lineDashOffset
		);
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
				.replace('bezier', '')
				.replace('quadratic', '')
				.replace('curve', '')
				.trim()
				.split(' ');
			if (content.startsWith('skip') && parts.length === 2) {
				ctx.moveTo(...(parts.map((a) => parseFloat(a)) as [number, number]));
			} else if (parts.length === 2) {
				ctx.lineTo(...(parts.map((a) => parseFloat(a)) as [number, number]));
			} else if (parts.length === 4) {
				ctx.quadraticCurveTo(
					...(parts.map((a) => parseFloat(a)) as [number, number, number, number])
				);
			} else if (parts.length === 6) {
				ctx.bezierCurveTo(
					...(parts.map((a) => parseFloat(a)) as [number, number, number, number, number, number])
				);
			}
			continue;
		} else if (content.startsWith('}') && inGroup) {
			inGroup = false; // End of a group block
			ctx.restore(); // Restore the previous state
			ctx.closePath(); // Close the current path
			ctx.beginPath(); // Start a new path
			continue;
		}

		if (content.startsWith('return'))
			break; // Stop processing on 'return'
		// Canvas Metadata Manipulation
		else if (content.startsWith('height ')) {
			const height = parseInt(content.replace('height', ''));
			canvas.height = height;
		} else if (content.startsWith('width ')) {
			const width = parseInt(content.replace('width', ''));
			canvas.width = width;
			speedApplyStyles();
		}

		// Canvas Style Manipulation
		if (content.startsWith('fill style ')) {
			fillStyle = content.replace('fill style', '').trim();
			speedApplyStyles();
		}
		if (content.startsWith('stroke style ')) {
			strokeStyle = content.replace('stroke style', '').trim();
			speedApplyStyles();
		}
		if (content.startsWith('stroke width ')) {
			lineWidth = parseFloat(content.replace('stroke width', '').trim());
			speedApplyStyles();
		}
		if (content.startsWith('line cap ')) {
			lineCap = content.replace('line cap', '').trim();
			speedApplyStyles();
		} else if (content.startsWith('line join ')) {
			lineJoin = content.replace('line join', '').trim();
			speedApplyStyles();
		} else if (content.startsWith('miter limit ')) {
			miterLimit = parseFloat(content.replace('miter limit', '').trim());
			speedApplyStyles();
		} else if (content.startsWith('dash ')) {
			lineDash = content.replace('dash', '').trim().split(' ').map(parseFloat);
			speedApplyStyles();
		} else if (content.startsWith('dash offset ')) {
			lineDashOffset = parseFloat(content.replace('dash offset', '').trim());
			speedApplyStyles();
		} else if (content == 'begin path') {
			ctx.beginPath();
		} else if (content == 'close path') {
			ctx.closePath();
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
				ctx.rect(...(parts.map((a) => parseFloat(a)) as [number, number, number, number]));
			}
		} else if (content.startsWith('round rect ')) {
			const parts = content.replace('round rect', '').trim().split(' ');
			if (parts.length === 5) {
				ctx.roundRect(
					...(parts.map((a) => parseFloat(a)) as [number, number, number, number, number])
				);
			}
		} else if (content.startsWith('stroke rect ')) {
			const parts = content.replace('stroke rect', '').trim().split(' ');
			if (parts.length === 4) {
				ctx.strokeRect(...(parts.map((a) => parseFloat(a)) as [number, number, number, number]));
			}
		} else if (content.startsWith('fill rect ')) {
			const parts = content.replace('fill rect', '').trim().split(' ');
			if (parts.length === 4) {
				ctx.fillRect(...(parts.map((a) => parseFloat(a)) as [number, number, number, number]));
			}
		}
		
		// Ellipses
		if (content.startsWith('arc ')) {
			const parts = content.replace('arc', '').trim().split(' ');
			if (parts.length === 5 || parts.length === 6) {
				ctx.arc(
					parseFloat(parts[0]),
					parseFloat(parts[1]),
					parseFloat(parts[2]),
					toRadians(parseFloat(parts[3]), angleMode),
					toRadians(parseFloat(parts[4]), angleMode),
					parts.length === 6 ? parts[5] === 'true' : false
				);
			}
		} else if (content.startsWith('ellipse ')) {
			const parts = content.replace('ellipse', '').trim().split(' ');
			if (parts.length === 7 || parts.length === 8) {
				ctx.ellipse(
					parseFloat(parts[0]),
					parseFloat(parts[1]),
					parseFloat(parts[2]),
					parseFloat(parts[3]),
					toRadians(parseFloat(parts[4]), angleMode),
					toRadians(parseFloat(parts[5]), angleMode),
					toRadians(parseFloat(parts[6]), angleMode),
					parts.length === 8 ? parts[7] === 'true' : false
				);
			}
		} else if (content.startsWith('circle ')) {
			const parts = content.replace('circle', '').trim().split(' ').map(Number);
			if (parts.length === 3) {
				ctx.arc(parts[0], parts[1], parts[2], 0, Math.PI * 2);
			}
		}

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
					...(parts.map((a) => parseFloat(a)) as [number, number, number, number])
				);
			if (parts.length == 6)
				ctx.bezierCurveTo(
					...(parts.map((a) => parseFloat(a)) as [number, number, number, number, number, number])
				);
		}
		if (content.startsWith('line to ')) {
			const parts = content.replace('line to', '').trim().split(' ');
			if (parts.length == 2) ctx.lineTo(...(parts.map((a) => parseFloat(a)) as [number, number]));
		}
		if (content.startsWith('move to ')) {
			const parts = content.replace('move to', '').trim().split(' ');
			if (parts.length == 2) ctx.moveTo(...(parts.map((a) => parseFloat(a)) as [number, number]));
		}

		// Drawing Functions
		if (content == 'fill') {
			ctx.fill();
		} else if (content == 'stroke') {
			ctx.stroke();
		} else if (content.startsWith('clear rect ')) {
			const parts = content.replace('clear rect', '').trim().split(' ');
			if (parts.length === 4) {
				ctx.clearRect(...(parts.map((a) => parseFloat(a)) as [number, number, number, number]));
			}
		} else if (content == 'clear') {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
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
