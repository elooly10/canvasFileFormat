import fs from "fs/promises";
import path from "path";
import { createCanvas, CanvasRenderingContext2D } from "canvas";
import fromSVG from "./fromSVG.js";
import applyCFF from "./applyCFF.js";
import { JSDOM } from "jsdom";
import { Path2D, applyPath2DToCanvasRenderingContext } from "path2d";
async function processDirectory(inputDir, outputDir) {
    globalThis.Path2D = Path2D;
    // globalThis.CanvasRenderingContext2D = CanvasRenderingContext2D as any;
    applyPath2DToCanvasRenderingContext(CanvasRenderingContext2D);
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    // Read all file names
    const files = await fs.readdir(inputDir);
    // Process each file
    await Promise.all(files.map(async (filename) => {
        const { name, ext } = path.parse(filename);
        if (filename.includes("DS_Store"))
            return;
        try {
            const filePath = path.join(inputDir, filename);
            const stats = await fs.stat(filePath);
            if (!stats.isFile()) {
                // skip sub-directories
                return;
            }
            // Read file contents
            let content;
            if (ext == ".svg") {
                const file = (await fs.readFile(filePath)).toString();
                const dom = new JSDOM(file, { contentType: "image/svg+xml" });
                const doc = dom.window.document;
                content = fromSVG(doc);
                // Write out content as <filename>.canvas
                const canvasFileName = name + ".canvas";
                const outPath = path.join(outputDir, canvasFileName);
                await fs.writeFile(outPath, content);
            }
            else
                content = (await fs.readFile(filePath)).toString();
            // Create a new Canvas
            const canvas = createCanvas(1000, 1000);
            const ctx = canvas.getContext("2d");
            ctx.reset = () => ctx.rect(0, 0, canvas.width, canvas.height);
            // Use canvas
            applyCFF(ctx, content, false, 2);
            // Convert canvas to PNG buffer
            const buffer = canvas.toBuffer("image/png");
            // Write out image as <filename>.png
            const outFileName = name + ".png";
            const outPath = path.join(outputDir, outFileName);
            await fs.writeFile(outPath, buffer);
            console.log(`Processed ${filename}.`);
        }
        catch (error) {
            console.error(`\x1b[31m${filename} occurred error ${error}\x1b[0m`);
        }
    }));
    console.log("All files processed.");
}
// Example usage:
(async () => {
    try {
        const inputDir = path.resolve("tests");
        const outputDir = path.resolve("tests/output");
        await processDirectory(inputDir, outputDir);
    }
    catch (err) {
        console.error(err);
    }
})();
