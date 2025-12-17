# Canvas File Format
A simple file format for storing canvas commands to later be generated. Supports most of the canvas API.

## Installation
```bash
npm install canvasff
```

## Usage
```typescript
import applyCFF from "canvasff";
applyCFF(ctx, file, scale = 1);
```
Applies the file to the ctx, scaled by a factor of scale (a scale of 2 produces a image twice as wide and twice as tall).
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

## File format
This is the spec for the file format. Each line is in the format of `command arg1 arg2...`, and commands are seperated by line. Comments are denoted with `//`, and work similar to JS. Angles default to degrees, but can be changed with `use rad` or `use turns` (`use deg` resets to degrees). The text PI appearing next to a number (e.g. 12PI) will be converted to 12 * Pi.

### Basic Commands
See MDN for more details on how the canvas uses these commands, most of them directly translate to a CanvasRenderingContext2D method.
| Command | Arguments | Description |
| :--- | :--- | :--- 
| `height` | `point` | Sets the canvas height. |
| `width` | `point` | Sets the canvas width. |
| `fill` | - | Fills the current path. |
| `stroke` | - | Strokes the current path. |
| `fill style` | `text` | Sets the style used when filling shapes (color, gradient, or pattern). |
| `stroke style` | `text` | Sets the style used for strokes. |
| `stroke width` | `point` | Sets the line width. |
| `line cap` | `text` | Sets the appearance of the ends of lines (`butt`, `round`, `square`). |
| `line join` | `text` | Sets the appearance of line corners (`round`, `bevel`, `miter`). |
| `miter limit` | `point` | Sets the limit for miter joins. |
| `dash` | `pointArray` | Sets the line dash pattern. |
| `dash offset` | `point` | Sets the phase of the line dash pattern. |
| `begin path` | - | Starts a new path. |
| `close path` | - | Closes the current path. |
| `save` | - | Saves the current state of the canvas. |
| `restore` | - | Restores the most recently saved canvas state. |
| `reset` | - | Resets the canvas context to its default state. |
| `clear` | - | Clears the entire canvas. |
| `clear rect` | `point`, `point`, `point`, `point` | Clears a rectangular section of the canvas. |
| `rect` | `point`, `point`, `point`, `point` | Adds a rectangle to the current path. |
| `round rect` | `point`, `point`, `point`, `point`, `point` | Adds a rounded rectangle to the current path. |
| `stroke rect` | `point`, `point`, `point`, `point` | Paints a rectangle which has a starting point at (x, y) and has a w and h. |
| `fill rect` | `point`, `point`, `point`, `point` | Fills a rectangle. |
| `ellipse` | `point`, `point`, `point`, `point`, `angle`, `angle`, `angle`, `boolean` | Adds an elliptical arc to the current path. |
| `arc` | `point`, `point`, `point`, `angle`, `angle`, `boolean` | Adds a circular arc to the current path. |
| `circle` | `point`, `point`, `point` | Adds a circle to the current path. |
| `curve` | `point`, `point`, `point`, `point`, `point`, `point` | Adds a cubic Bézier curve to the current path. |
| `quadratic` | `point`, `point`, `point`, `point` | Adds a quadratic Bézier curve to the current path. |
| `line to` | `point`, `point` | Connects the last point to the specified point. |
| `move to` | `point`, `point` | Moves the starting point of a new sub-path. |
| `arc to` | `point`, `point`, `point`, `point`, `point` | Adds a circular arc to the current path, using control points and radius. |

### Text Commands
| Command | Arguments | Description |
| :--- | :--- | :--- 
| `fill text` | `text`, `point`, `point`, `point` | Fills a given text at the given (x,y) position. |
| `stroke text` | `text`, `point`, `point`, `point` | Strokes a given text at the given (x,y) position. |
| `text align` | `text` | Sets the alignment for text. |
| `text baseline` | `text` | Sets the baseline alignment for text. |
| `text direction` | `text` | Sets the directionality of the text. |
| `font` | `textArray` | Sets the font properties. |
| `font kerning` | `text` | Sets the font kerning. Doesn't work in Safari. |
| `font stretch` | `text` | Sets the font stretch. Doesn't work in Safari. |
| `font caps` | `text` | Sets the font variant caps. Doesn't work in Safari. |

### Other Commands
| Command | Arguments | Description |
| :--- | :--- | :--- 
| `reset transformations` | - | Resets the current transformation matrix to the identity matrix. |
| `rotate` | `angle` | Rotates the canvas context. |
| `scale` | `point`, `point` | Scales the canvas units by x and y. |
| `transform` | `point`, `point`, `point`, `point`, `point`, `point` | Multiplies the current transformation matrix. |
| `transform relative` | `number`, `number`, `number`, `point`, `point`, `point` | Multiplies the current transformation matrix. |
| `fill linear` | `point`, `point`, `point`, `point`, `textArray` | Sets a linear gradient for filling. Each item in the textArray is a color stop spaced evenly (2 items -> stops at 0% and 100%, 3 items -> stops at 0%, 50%, and 100%) |
| `stroke linear` | `point`, `point`, `point`, `point`, `textArray` | Sets a linear gradient for stroking. Each item in the textArray is a color stop spaced evenly (2 items -> stops at 0% and 100%, 3 items -> stops at 0%, 50%, and 100%) |
| `fill radial` | `point`, `point`, `point`, `textArray` | Sets a radial gradient for filling. Each item in the textArray is a color stop spaced evenly (2 items -> stops at 0% and 100%, 3 items -> stops at 0%, 50%, and 100%) |
| `stroke radial` | `point`, `point`, `point`, `textArray` | Sets a radial gradient for stroking. Each item in the textArray is a color stop spaced evenly (2 items -> stops at 0% and 100%, 3 items -> stops at 0%, 50%, and 100%) |
| `fill conic` | `point`, `point`, `point`, `textArray` | Sets a conic gradient for filling. Each item in the textArray is a color stop spaced evenly (2 items -> stops at 0% and 100%, 3 items -> stops at 0%, 50%, and 100%) |
| `stroke conic` | `point`, `point`, `point`, `textArray` | Sets a conic gradient for stroking. Each item in the textArray is a color stop spaced evenly (2 items -> stops at 0% and 100%, 3 items -> stops at 0%, 50%, and 100%) |
| `shadow blur` | `point` | Sets the amount of blur for shadows. |
| `shadow color` | `text` | Sets the color of shadows. |
| `shadow offset` | `point`, `point` | Sets the distance that shadows will be offset. |
| `alpha` | `number` | Sets the global alpha value. |
| `composite` | `text` | Sets the global composite operation. |
| `filter` | `textArray` | Sets the filter effects (e.g. blur). Not supported in Safari. |
### Path Mode
Path mode is a special mode that creates a `Path2D`. This is opened with `fill path {`, `stroke path {`, `clip path {`, and `multi path {` (to both fill and stroke), and is closed with `}`. It only supports the following commands:
| Command | Arguments | Description |
| :--- | :--- | :--- 
| `move to` | `point`, `point` | Moves the starting point of a new sub-path. |
| `line to` | `point`, `point` | Connects the last point to the specified point. |
| `arc to` | `point`, `point`, `point`, `point`, `point` | Adds a circular arc to the current path, using control points and radius. |
| `arc` | `point`, `point`, `point`, `angle`, `angle`, `boolean` | Adds a circular arc to the current path. |
| `circle` | `point`, `point`, `point` | Adds a circle to the current path. |
| `curve` | `point`, `point`, `point`, `point`, `point`, `point` | Adds a cubic Bézier curve to the current path. |
| `quadratic` | `point`, `point`, `point`, `point` | Adds a quadratic Bézier curve to the current path. |
| `rect` | `point`, `point`, `point`, `point` | Adds a rectangle to the current path. |
| `round rect` | `point`, `point`, `point`, `point`, `point` | Adds a rounded rectangle to the current path. |
| `close` | - | Closes the current path. |
### Groups
Groups can be used to structure commands together and will revert to the previous styles after the group is closed. Groups are opened with `group {` and closed with `}`. Groups can be nested but this does not work perfectly.

## fromSVG
Takes a document of an svg or just the svg as a string and returns a canvas file. Does not work well, but can provide a basis at least.

## Contributing
Contributions are welcome! Please submit a pull request. The tests can be ran with `npm run test` and build into the tests/output folder. 

## License
This is licensed under the MIT license.