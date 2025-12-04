import * as utils from "./SVGutils.js"
type Line = string;
type Styles = {
  fill: string | null;
  stroke: string | null;
  lineWidth: number;
};


function resetStyles(): Styles {
  return {
    fill: "none",
    stroke: "none",
    lineWidth: 1,
  };
}
let lastStyles: Styles = resetStyles(); // The styles of the last element in the list
let groupStyles: Styles = resetStyles(); // The default styles, applied by the parent
let ignoreStyles = true; // Ignore the styles currently present and do not add fill / stroke calls.
let inGroup = false;
function getStyles(el: Element): Styles {
  const fill = el.getAttribute("fill")?.length
    ? el.getAttribute("fill")
    : groupStyles.fill;
  const stroke = el.getAttribute("stroke")?.length
    ? el.getAttribute("stroke")
    : groupStyles.stroke;
  const lineWidth = el.getAttribute("stroke-width")
    ? parseFloat(el.getAttribute("stroke-width") ?? "0")
    : groupStyles.lineWidth;
  return { fill, stroke, lineWidth };
}
function emitStyles(el: Element) {
  const out: Line[] = [];
  const outInit: Line[] = applyStyles();
  const { fill, stroke, lineWidth } = getStyles(el);
  if (fill != lastStyles.fill) {
    if (fill != "none") out.push(`fill style ${fill}`);
    lastStyles.fill = fill;
  }
  if (stroke != lastStyles.stroke) {
    if (stroke != "none") out.push(`stroke style ${stroke}`);
    lastStyles.stroke = stroke;
  }
  if (lineWidth != lastStyles.lineWidth && stroke != "none") {
    if (lineWidth != 0) out.push(`stroke width ${lineWidth}`);
    lastStyles.lineWidth = lineWidth;
  }
  if (el.tagName.toLowerCase() != "g") {
    outInit.push(``, `begin path`);
    out.unshift(...outInit);
  }
  return out;
}
function applyStyles() {
  const out: Line[] = [];
  if (!ignoreStyles) {
    if (lastStyles.fill != "none") out.push(`fill`);
    if (lastStyles.stroke != "none" && lastStyles.lineWidth != 0)
      out.push(`stroke`);
  }
  return out;
}
function convertElement(el: Element): Line[] {
  const tag = el.tagName.toLowerCase();
  const out: Line[] = [];
  let groupNested = inGroup; // If we find ourselves in a group, are we already in one?

  // 1) Handle transformations
  const transform = el.getAttribute("transform");
  if (transform) {
    const commands = utils.parseTransform(transform);
    for (let c of commands) {
      switch (c.type) {
        case "translate":
          // E/F translation
          out.push(`transform 1 0 0 1 ${c.values[0]} ${c.values[1] || 0}`);
          break;
        case "rotate":
          // rotate(angle, cx?, cy?)
          if (c.values[1] != null && c.values[2] != null) {
            // translate(cx,cy) then rotate(angle) then translate(-cx,-cy)
            out.push(`transform 1 0 0 1 ${c.values[1]} ${c.values[2]}`);
            out.push(`rotate ${c.values[0]}`);
            out.push(`transform 1 0 0 1 ${-c.values[1]} ${-c.values[2]}`);
          } else {
            out.push(`rotate ${c.values[0]}`);
          }
          break;
        case "scale":
          const sx = c.values[0];
          const sy = c.values[1] ?? sx;
          out.push(`scale ${sx} ${sy}`);
          break;
        case "skewX":
          // matrix(1, 0, tan(angle), 1, 0, 0)
          const kx = Math.tan((c.values[0] * Math.PI) / 180);
          out.push(`transform 1 0 ${kx} 1 0 0`);
          break;
        case "skewY":
          const ky = Math.tan((c.values[0] * Math.PI) / 180);
          out.push(`transform 1 ${ky} 0 1 0 0`);
          break;
        case "matrix":
          // direct
          out.push(`transform ${c.values.join(" ")}`);
          break;
      }
    }
  }

  // 2) Style
  if (el.tagName.toLowerCase() == "g") {
    // Don't style groups like normal
    out.push(...applyStyles());
    out.push("group {");
    inGroup = true;
    ignoreStyles = true;
    out.push(...emitStyles(el).map((v) => `\t${v}`));
  } else out.push(...emitStyles(el));
  ignoreStyles = false; // No reason to ignore these styles

  // 3) Identify element to draw
  switch (tag) {
    case "rect":
      {
        const x = +el.getAttribute("x")! || 0;
        const y = +el.getAttribute("y")! || 0;
        const w = +el.getAttribute("width")! || 0;
        const h = +el.getAttribute("height")! || 0;
        const round =
          (parseFloat(el.getAttribute("rx") || "0") +
            parseFloat(el.getAttribute("ry") || "0")) /
          2;
        if (round > 0) {
          out.push(`round rect ${x} ${y} ${w} ${h} ${round}`);
        } else {
          out.push(`rect ${x} ${y} ${w} ${h}`);
        }
      }
      break;

    case "circle":
      {
        const cx = +el.getAttribute("cx")! || 0;
        const cy = +el.getAttribute("cy")! || 0;
        const r = +el.getAttribute("r")! || 0;
        out.push(`circle ${cx} ${cy} ${r}`);
      }
      break;

    case "ellipse":
      {
        const cx = +el.getAttribute("cx")! || 0;
        const cy = +el.getAttribute("cy")! || 0;
        const rx = +el.getAttribute("rx")! || 0;
        const ry = +el.getAttribute("ry")! || 0;
        out.push(`ellipse ${cx} ${cy} ${rx} ${ry}`);
      }
      break;

    case "path":
      out.push("path {");
      const d = el.getAttribute("d") || "";
      out.push(...utils.convertPath(d));
      break;
    case "line":
      {
        const x1 = parseFloat(el.getAttribute("x1") || "0");
        const y1 = parseFloat(el.getAttribute("y1") || "0");
        const x2 = parseFloat(el.getAttribute("x2") || "0");
        const y2 = parseFloat(el.getAttribute("y2") || "0");
        out.push(`move to ${x1} ${y1}`);
        out.push(`line to ${x2} ${y2}`);
      }
      break;
    case "polyline":
    case "polygon": {
      out.push(``);
      const pts = (el.getAttribute("points") || "")
        .trim()
        .split(/[\s,]+/)
        .map(parseFloat)
        .filter((n) => !isNaN(n));
      if (pts.length >= 2) {
        out.push(`move to ${pts[0]} ${pts[1]}`);
        for (let i = 2; i + 1 < pts.length; i += 2) {
          out.push(`line to ${pts[i]} ${pts[i + 1]}`);
        }
        if (tag === "polygon") {
          out.push(`line to ${pts[0]} ${pts[1]}`);
        }
      }
      out.push(``);
      break;
    }
    case "g":
      let parentGroupStyles = groupStyles;
      groupStyles = getStyles(el);
      for (let i = 0; i < el.children.length; i++) {
        out.push(...convertElement(el.children[i]).map((v) => `\t${v}`));
      }
      if (!groupNested) {
        inGroup = false;
        out.push(...applyStyles().map((v) => `\t${v}`));
        groupStyles = resetStyles();
        ignoreStyles = true;
      } else {
        groupStyles = parentGroupStyles;
      }
      out.push("}");
      break;
    default:
      console.warn(`\x1b[93mUnsupported tag: ${tag}\x1b[0m`);
      return out;
  }
  return out;
}

export default function fromSVG(svgText: string, doc: Document | null = null): string {
  if (!doc) {
    // in a browser
    doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  }
  const svg = doc.documentElement;

  const lines: Line[] = [];
  // Set up canvas size if provided
  if (svg.hasAttribute("width"))
    lines.push(`width ${+(svg.getAttribute("width") as any)}`);
  if (svg.hasAttribute("height"))
    lines.push(`height ${+(svg.getAttribute("height") as any)}`);

  // Walk children
  for (let i = 0; i < svg.children.length; i++) {
    lines.push(...convertElement(svg.children[i]));
  }

  // Apply fills and strokes still left over
  lines.push(...applyStyles());

  return lines.join("\n");
}
