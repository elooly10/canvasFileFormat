import * as utils from "./SVGutils.js";

type Line = string;

interface Styles {
  fill: string;
  stroke: string;
  lineWidth: number;
  lineCap: string;
  lineJoin: string;
  miterLimit: number;
  lineDash: number[];
  lineDashOffset: number;
}

const defaultStyles: Styles = {
  fill: "none",
  stroke: "none",
  lineWidth: 1,
  lineCap: "butt",
  lineJoin: "miter",
  miterLimit: 10,
  lineDash: [],
  lineDashOffset: 0,
};

// Returns a new style object merging parent styles with element attributes
function resolveStyles(el: Element, parentStyles: Styles): Styles {
  const getAttr = (name: string) => el.getAttribute(name);
  const getStyle = (name: string, fallback: string | number) => {
    const val = getAttr(name);
    return val !== null && val !== "" ? val : fallback;
  };

  // Helper for numeric parsing
  const getNum = (name: string, fallback: number) => {
    const val = getAttr(name);
    if (val === null || val === "") return fallback;
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  };

  // Helper for dash array parsing
  const getDash = (name: string, fallback: number[]) => {
    const val = getAttr(name);
    if (!val) return fallback;
    if (val === "none") return [];
    return val
      .split(/[\s,]+/)
      .map(parseFloat)
      .filter((n) => !isNaN(n));
  };

  return {
    fill: getStyle("fill", parentStyles.fill) as string,
    stroke: getStyle("stroke", parentStyles.stroke) as string,
    lineWidth: getNum("stroke-width", parentStyles.lineWidth),
    lineCap: getStyle("stroke-linecap", parentStyles.lineCap) as string,
    lineJoin: getStyle("stroke-linejoin", parentStyles.lineJoin) as string,
    miterLimit: getNum("stroke-miterlimit", parentStyles.miterLimit),
    lineDash: getDash("stroke-dasharray", parentStyles.lineDash),
    lineDashOffset: getNum("stroke-dashoffset", parentStyles.lineDashOffset),
  };
}

function fmtNum(n: number): string {
  // Round to 3 decimal places to save space and avoid -0
  const s = (Math.round(n * 1000) / 1000).toString();
  return s === "-0" ? "0" : s;
}

function convertElement(
  el: Element,
  parentStyles: Styles,
  state: { lastEmittedStyles: Styles }
): Line[] {
  const tag = el.tagName.toLowerCase();
  const out: Line[] = [];

  // 1) Transformations
  const transform = el.getAttribute("transform");
  if (transform) {
    const commands = utils.parseTransform(transform);
    for (let c of commands) {
      switch (c.type) {
        case "translate":
          out.push(`transform 1 0 0 1 ${fmtNum(c.values[0])} ${fmtNum(c.values[1] || 0)}`);
          break;
        case "rotate":
          if (c.values.length === 3) {
            // rotate(angle, cx, cy) -> translate(cx, cy) rotate(angle) translate(-cx, -cy)
            const [angle, cx, cy] = c.values as [number, number, number];
            out.push(`transform 1 0 0 1 ${fmtNum(cx)} ${fmtNum(cy)}`);
            out.push(`rotate ${fmtNum(angle)}`);
            out.push(`transform 1 0 0 1 ${fmtNum(-cx)} ${fmtNum(-cy)}`);
          } else {
            out.push(`rotate ${fmtNum(c.values[0])}`);
          }
          break;
        case "scale":
          const sx = c.values[0];
          const sy = c.values[1] ?? sx;
          out.push(`scale ${fmtNum(sx)} ${fmtNum(sy)}`);
          break;
        case "skewX":
          const kx = Math.tan((c.values[0] * Math.PI) / 180);
          out.push(`transform 1 0 ${fmtNum(kx)} 1 0 0`);
          break;
        case "skewY":
          const ky = Math.tan((c.values[0] * Math.PI) / 180);
          out.push(`transform 1 ${fmtNum(ky)} 0 1 0 0`);
          break;
        case "matrix":
          out.push(`transform ${c.values.map(fmtNum).join(" ")}`);
          break;
      }
    }
  }

  // 2) Resolve styles for this element
  const styles = resolveStyles(el, parentStyles);

  // Opacity handling
  const opacity = parseFloat(el.getAttribute("opacity") || "1");
  if (opacity !== 1) {
    out.push(`global alpha ${opacity}`);
  }

  // Group handling
  if (tag === "g") {
    out.push("group {");
    // Note: Groups pass their styles down.
    // If a group has `fill="red"`, children inherit it.
    for (let i = 0; i < el.children.length; i++) {
      out.push(...convertElement(el.children[i], styles, state).map(v => `\t${v}`));
    }
    out.push("}");
  } else {
    // It's a shape. Emit styles difference.
    emitStyleChanges(out, state.lastEmittedStyles, styles);
    // Update state
    state.lastEmittedStyles = { ...styles };
    out.push(`begin path`)
    // 3) Geometry
    switch (tag) {
      case "rect": {
        const x = +el.getAttribute("x")! || 0;
        const y = +el.getAttribute("y")! || 0;
        const w = +el.getAttribute("width")! || 0;
        const h = +el.getAttribute("height")! || 0;
        const rxRaw = el.getAttribute("rx");
        const ryRaw = el.getAttribute("ry");
        let rx = rxRaw ? parseFloat(rxRaw) : 0;
        let ry = ryRaw ? parseFloat(ryRaw) : 0;

        // Logic for rx/ry defaults if one is missing
        if (rxRaw && !ryRaw) ry = rx;
        if (ryRaw && !rxRaw) rx = ry;

        // If both are present, we ideally want `roundRect` which takes radii.
        // SVG `rx` and `ry` can be different (elliptical corners).
        // Canvas `roundRect` supports `[all-corners]`, or specific.
        // If rx != ry, canvas `roundRect` needs a DOMPointInit or weirdness? 
        // Actually `roundRect` in modern canvas supports `{x: ..., y:...}` radii?
        // `applyCFF` only implements `round rect x y w h r` (single scalar radius).
        // So we averaging or picking one.
        const r = (rx + ry) / 2;

        if (r > 0) {
          out.push(`round rect ${x} ${y} ${w} ${h} ${r}`);
        } else {
          out.push(`rect ${x} ${y} ${w} ${h}`);
        }
        break;
      }
      case "circle": {
        const cx = +el.getAttribute("cx")! || 0;
        const cy = +el.getAttribute("cy")! || 0;
        const r = +el.getAttribute("r")! || 0;
        out.push(`circle ${cx} ${cy} ${r}`);
        break;
      }
      case "ellipse": {
        const cx = +el.getAttribute("cx")! || 0;
        const cy = +el.getAttribute("cy")! || 0;
        const rx = +el.getAttribute("rx")! || 0;
        const ry = +el.getAttribute("ry")! || 0;
        out.push(`ellipse ${cx} ${cy} ${rx} ${ry}`);
        break;
      }
      case "line": {
        const x1 = +el.getAttribute("x1")! || 0;
        const y1 = +el.getAttribute("y1")! || 0;
        const x2 = +el.getAttribute("x2")! || 0;
        const y2 = +el.getAttribute("y2")! || 0;
        out.push(`move to ${x1} ${y1}`);
        out.push(`line to ${x2} ${y2}`);
        break;
      }
      case "polyline":
      case "polygon": {
        out.push(``); // spacer
        const points = (el.getAttribute("points") || "")
          .trim()
          .split(/[\s,]+/)
          .map(parseFloat)
          .filter(n => !isNaN(n));

        if (points.length >= 2) {
          out.push(`move to ${points[0]} ${points[1]}`);
          for (let i = 2; i < points.length; i += 2) {
            out.push(`line to ${points[i]} ${points[i + 1]}`);
          }
          if (tag === "polygon") {
            out.push("close path");
          }
        }
        break;
      }
      case "text": {
        const x = +el.getAttribute("x")! || 0;
        const y = +el.getAttribute("y")! || 0;
        const text = el.textContent || "";
        if (styles.fill !== "none") {
          out.push(`fill text ${x} ${y} ${text}`);
        }
        if (styles.stroke !== "none") {
          out.push(`stroke text ${x} ${y} ${text}`);
        }
        break;
      }
      case "path": {
        if (styles.fill !== "none") {
          out.push("fill path {");
        } else if (styles.stroke !== "none") {
          out.push("stroke path {");
        }
        const d = el.getAttribute("d") || "";
        out.push(...utils.convertPath(d));
        break;
      }
      default:
        // Structural tags like defs are ignored
        if (!["defs", "mask", "clippath", "symbol", "use", "title", "desc"].includes(tag)) {
          console.warn(`Unsupported tag: ${tag}`);
        }
    }

    // Draw command
    if (!["defs", "mask", "clippath", "symbol", "use", "title", "desc", "path", "text"].includes(tag)) {
      if (styles.fill !== "none") out.push("fill");
      // Only stroke if width > 0 and stroke is not none
      if (styles.stroke !== "none" && styles.lineWidth > 0) out.push("stroke");
    }
  }

  // Wrap in group if we had transforms or opacity to restore context
  if ((transform || opacity !== 1)) {
    const inner = [...out];
    out.length = 0;
    out.push("group {");
    out.push(...inner.map(l => `\t${l}`));
    out.push("}");
    if (transform) out.push("reset transformations");
  }

  return out;
}

function emitStyleChanges(out: Line[], oldS: Styles, newS: Styles) {
  if (newS.fill !== oldS.fill) {
    if (newS.fill !== "none") out.push(`fill style ${newS.fill}`);
  }

  if (newS.stroke !== oldS.stroke) {
    if (newS.stroke !== "none") out.push(`stroke style ${newS.stroke}`);
  }

  // Always emit lineWidth if it changes, even if stroke is none, to be safe? 
  // Optimization: only if stroke is not none? 
  // Code says: `if (stroke != "none" && lineWidth != 0) out.push("stroke")`
  // Layout logic: set styles, then draw.
  if (newS.lineWidth !== oldS.lineWidth)
    out.push(`stroke width ${newS.lineWidth}`);

  if (newS.lineCap !== oldS.lineCap)
    out.push(`line cap ${newS.lineCap}`);

  if (newS.lineJoin !== oldS.lineJoin)
    out.push(`line join ${newS.lineJoin}`);

  if (newS.miterLimit !== oldS.miterLimit)
    out.push(`miter limit ${newS.miterLimit}`);

  // Dash array comparison
  // Compare arrays by value
  const dashChanged = newS.lineDash.length !== oldS.lineDash.length || newS.lineDash.some((v, i) => v !== oldS.lineDash[i]);
  if (dashChanged) {
    if (newS.lineDash.length === 0) out.push(`dash 0`); // Odd way to reset? applyCFF uses: `ctx.setLineDash(...)`
    // applyCFF: `content.startsWith('dash ')` -> `parts.map`
    // If I send "dash " it might be empty parts?
    else out.push(`dash ${newS.lineDash.join(" ")}`);
  }

  if (newS.lineDashOffset !== oldS.lineDashOffset)
    out.push(`dash offset ${newS.lineDashOffset}`);
}

export default function fromSVG(svg: string | Document): string {
  if (typeof svg === 'string') {
    if (typeof DOMParser !== 'undefined') {
      svg = new DOMParser().parseFromString(svg, "image/svg+xml");
    } else {
      throw new Error("No DOMParser available");
    }
  }
  const svgElem = svg.documentElement;
  const lines: Line[] = [];

  if (svgElem.hasAttribute("width"))
    lines.push(`width ${parseFloat(svgElem.getAttribute("width")!)}`);
  if (svgElem.hasAttribute("height"))
    lines.push(`height ${parseFloat(svgElem.getAttribute("height")!)}`);

  const state = {
    lastEmittedStyles: { ...defaultStyles }
  };

  for (let i = 0; i < svgElem.children.length; i++) {
    lines.push(...convertElement(svgElem.children[i], defaultStyles, state));
  }

  return lines.join("\n");
}
