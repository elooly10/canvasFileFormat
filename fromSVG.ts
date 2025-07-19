import { JSDOM } from "jsdom"

type Line = string;

function convertPath(d: string): Line[] {
	const commands = d.match(/[a-df-z][^a-df-z]*/gi) || [];
	const lines: Line[] = [];
	let currX = 0,
		currY = 0;

	for (let cmd of commands) {
		const type = cmd[0];
		const coords = cmd
			.slice(1)
			.trim()
			.split(/[\s,]+/)
			.filter((tok) => /^[0-9.+-eE]+$/.test(tok))
			.map(parseFloat);

		switch (type) {
      case "M":
        currX = coords[0];
        currY = coords[1];
        lines.push(`\tskip ${currX} ${currY}`);
        break;

      case "m":
        currX += coords[0];
        currY += coords[1];
        lines.push(`\tskip ${currX} ${currY}`);
        break;

      case "L":
        currX = coords[0];
        currY = coords[1];
        lines.push(`\t${currX} ${currY}`);
        break;

      case "l":
        currX += coords[0];
        currY += coords[1];
        lines.push(`\t${currX} ${currY}`);
        break;

      case "H":
        currX = coords[0];
        lines.push(`\t${currX} ${currY}`);
        break;

      case "V":
        currY = coords[0];
        lines.push(`\t${currX} ${currY}`);
        break;

      case "h":
        currX += coords[0];
        lines.push(`\t${currX} ${currY}`);
        break;

      case "v":
        currY += coords[0];
        lines.push(`\t${currX} ${currY}`);
        break;

      case "C":
        lines.push(`\tbezier ${coords.join(" ")}`);
        currX = coords[4];
        currY = coords[5];
        break;

      case "c":
        lines.push(
          `\tbezier ${[
            coords[0] + currX,
            coords[1] + currY,
            coords[2] + currX,
            coords[3] + currY,
            coords[4] + currX,
            coords[5] + currY,
          ].join(" ")}`
        );
        currX += coords[4];
        currY += coords[5];
        break;

      case "Q":
        lines.push(`\tquadratic ${coords.join(" ")}`);
        currX = coords[2];
        currY = coords[3];
        break;

      case "q":
        lines.push(
          `\tquadratic ${[
            coords[0] + currX,
            coords[1] + currY,
            coords[2] + currX,
            coords[3] + currY,
          ].join(" ")}`
        );
        currX += coords[2];
        currY += coords[3];
        break;
      case "Z":
      case "z":
        lines.push("}");
        return lines;

      default:
        console.warn(`Unhandled path command: ${type}`);
    }
	}
    lines.push('}')
	return lines;
}

function emitStyles(el: Element): {style: Line[], fill: boolean, stroke: boolean} {
	const out: Line[] = [];
	const fill = el.getAttribute('fill');
	const stroke = el.getAttribute('stroke');
	const sw = el.getAttribute('stroke-width');

	if (fill && fill !== 'none') {
		out.push(`fill style ${fill}`);
	} else {
		// if you want to explicitly clear fill, you could do:
		// out.push(`fill style transparent`)
	}

	if (stroke && stroke !== 'none') {
		out.push(`stroke style ${stroke}`);
		if (sw) {
			out.push(`stroke width ${parseFloat(sw)}`);
		}
	}

	return {
		style: out,
		fill: !!(fill && fill !== 'none'),
		stroke: !!(stroke && stroke !== 'none')
	};
}

function convertElement(el: Element): Line[] {
	const tag = el.tagName.toLowerCase();
	const out: Line[] = [];

	// 1) Pull out styles right before the shape
	out.push('') // Extra spacing
    out.push('begin path');
	let pathStyles = emitStyles(el)
    out.push(...pathStyles.style)
	// 2) Begin a path if needed
	let needsPath = false;
	switch (tag) {
    case "rect":
      needsPath = true;
      {
        const x = +el.getAttribute("x")! || 0;
        const y = +el.getAttribute("y")! || 0;
        const w = +el.getAttribute("width")! || 0;
        const h = +el.getAttribute("height")! || 0;
		const round =
      (parseFloat(el.getAttribute("rx") || "0") +
      parseFloat(el.getAttribute("ry") || "0")) / 2;
		// if rx>0, emit a roundRect, otherwise a normal rect
		if (round > 0) {
			out.push(`\tround rect ${x} ${y} ${w} ${h} ${round}`);
		} else {
			out.push(`\trect ${x} ${y} ${w} ${h}`);
		}

      }
      break;

    case "circle":
      needsPath = true;
      {
        const cx = +el.getAttribute("cx")! || 0;
        const cy = +el.getAttribute("cy")! || 0;
        const r = +el.getAttribute("r")! || 0;
        // `circle` in your DSL just emits an arc under the hood
        out.push(`circle ${cx} ${cy} ${r}`);
      }
      break;

    case "ellipse":
      needsPath = true;
      {
        const cx = +el.getAttribute("cx")! || 0;
        const cy = +el.getAttribute("cy")! || 0;
        const rx = +el.getAttribute("rx")! || 0;
        const ry = +el.getAttribute("ry")! || 0;
        out.push(`ellipse ${cx} ${cy} ${rx} ${ry} 0 0 360`);
      }
      break;

    case "path":
      needsPath = true;
      out.push("path {");
      const d = el.getAttribute("d") || "";
      out.push(...convertPath(d));
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
      break;
    }
    case "g":
      out.push("group {");
      if (pathStyles.fill) out.push("\tfill style " + el.getAttribute("fill"));
      if (pathStyles.stroke)
        out.push("\tstroke style " + el.getAttribute("fill"));
      for (let i = 0; i < el.children.length; i++) {
        out.push(...convertElement(el.children[i]).map((v) => `\t${v}`));
      }
      break;
    default:
      console.warn(`Unsupported tag: ${tag}`);
      return out;
  }

	// 3) Finally emit fill/stroke commands for that path
	if(pathStyles.fill) out.push('fill');
	if(pathStyles.stroke) out.push('stroke');


	if(tag == "g") out.push("}"); // Close the group.
	return out;
}

export default function toCanvas(svgText: string): string {
	let doc: Document;
	if (typeof DOMParser !== "undefined") {
		// in a browser
		doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
	} else {
		// in Node
		const dom = new JSDOM(svgText, { contentType: "image/svg+xml" });
		doc = dom.window.document;
	}
	const svg = doc.documentElement;

	const lines: Line[] = [];
	// Set up canvas size if provided
	if (svg.hasAttribute('width')) lines.push(`width ${+(svg.getAttribute('width') as any)}`);
	if (svg.hasAttribute('height')) lines.push(`height ${+(svg.getAttribute('height') as any)}`);

	// Walk children
	for (let i = 0; i < svg.children.length; i++) {
		lines.push(...convertElement(svg.children[i]));
	}

	return lines.join('\n');
}
