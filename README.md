# Canvas File Format
A simple file format for storing canvas commands to later be generated. Supports most of the canvas API.

## Usage
```typescript
import applyCFF from "./applyCFF.js";
applyCFF(ctx, file, resetCanvas = false, scale = 1);
```
Applies the file to the ctx, scaled by a factor of scale.
### Node.JS use
This requires polyfilling Path2D and CanvasRenderingContext2D.
```typescript
// Get polyfills
import { createCanvas, CanvasRenderingContext2D } from "canvas";
import { Path2D, applyPath2DToCanvasRenderingContext } from "path2d";
// Apply polyfills
globalThis.Path2D = Path2D as any;
applyPath2DToCanvasRenderingContext(CanvasRenderingContext2D as any);
// Create a canvas context
const canvas = createCanvas(1000, 1000);
const ctx = canvas.getContext("2d");
// NOTE: The "reset" command is not polyfilled.
applyCFF(ctx as any, ...);
```
