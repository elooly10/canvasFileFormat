type SVGTransformCommand = {
    type: "translate";
    values: [number, number?];
} | {
    type: "rotate";
    values: [number, number?, number?];
} | {
    type: "scale";
    values: [number, number?];
} | {
    type: "skewX";
    values: [number];
} | {
    type: "skewY";
    values: [number];
} | {
    type: "matrix";
    values: [number, number, number, number, number, number];
};
export declare function parseTransform(transform: string): SVGTransformCommand[];
export declare function convertPath(d: string): string[];
export {};
