# Canvas File Format
A simple file format for storing canvas commands to later be generated. Supports most of the canvas API.

## Usage
```javascript
import applyCFF from "./applyCFF.js";
applyCFF(ctx, file, resetCanvas = false, scale = 1);
```
Applies the file to the ctx, scaled by a factor of scale.
### Node.JS use
This requires polyfilling Path2D and CanvasRenderingContext2D.
```javascript
// Get polyfills
import { createCanvas, CanvasRenderingContext2D } from "canvas";
import { Path2D, applyPath2DToCanvasRenderingContext } from "path2d";
// Apply polyfills
globalThis.Path2D = Path2D as any;
applyPath2DToCanvasRenderingContext(CanvasRenderingContext2D as any);
// Create a canvas context
const canvas = createCanvas(1000, 1000);
const ctx = canvas.getContext("2d") as any;
// Rough polyfill for ctx.reset (used in "reset" command)
ctx.reset = () => ctx.rect(0, 0, canvas.width, canvas.height);

// Use canvas
applyCFF(ctx, ...);
```
