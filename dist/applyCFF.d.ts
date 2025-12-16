type canvasContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
/**
 * Apply a canvas file to a canvas context
 * @param ctx The canvas context to apply the file to
 * @param file The file to apply
 * @param resetCanvas Whether to reset the canvas before applying the file
 * @param scale The scale to apply to the file
 */
export default function applyCFF(ctx: canvasContext, file: string, resetCanvas?: boolean, scale?: number): void;
export {};
