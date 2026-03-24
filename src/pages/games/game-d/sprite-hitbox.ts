/**
 * Analyze sprite image alpha channel to generate a simplified polygon hitbox.
 * Runs once per sprite at load time.
 */

type Point = { x: number; y: number };

/**
 * Load an image and extract a polygon outline from non-transparent pixels.
 * Returns vertices normalized to [0..1] range relative to image dimensions,
 * centered around (0,0) so it can be scaled to any sprite size.
 */
export async function generateHitboxFromImage(src: string, sampleRows?: number): Promise<Point[]> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context");
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);

  return extractOutline(imageData, img.width, img.height, sampleRows ?? 16);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Scan rows of the image and find left/right edges of non-transparent pixels.
 * Returns a simplified polygon (centered around 0,0, normalized to [-0.5..0.5]).
 */
function extractOutline(data: ImageData, w: number, h: number, sampleRows: number): Point[] {
  const alphaThreshold = 30;
  const leftEdges: Point[] = [];
  const rightEdges: Point[] = [];

  // Sample evenly spaced rows
  for (let i = 0; i < sampleRows; i++) {
    const y = Math.floor((i / (sampleRows - 1)) * (h - 1));
    let leftX = -1;
    let rightX = -1;

    for (let x = 0; x < w; x++) {
      const alpha = data.data[(y * w + x) * 4 + 3];
      if (alpha > alphaThreshold) {
        if (leftX === -1) leftX = x;
        rightX = x;
      }
    }

    if (leftX !== -1) {
      // Normalize to [-0.5, 0.5] range centered on origin
      leftEdges.push({ x: leftX / w - 0.5, y: y / h - 0.5 });
      rightEdges.push({ x: rightX / w - 0.5, y: y / h - 0.5 });
    }
  }

  if (leftEdges.length === 0) {
    // Fallback: full rect
    return [
      { x: -0.5, y: -0.5 },
      { x: 0.5, y: -0.5 },
      { x: 0.5, y: 0.5 },
      { x: -0.5, y: 0.5 },
    ];
  }

  // Build polygon: left edges top-to-bottom, then right edges bottom-to-top
  const polygon = [...leftEdges, ...rightEdges.reverse()];

  return simplifyPolygon(polygon, 0.02);
}

/**
 * Douglas-Peucker polygon simplification.
 */
function simplifyPolygon(points: Point[], epsilon: number): Point[] {
  if (points.length <= 3) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPolygon(points.slice(0, maxIdx + 1), epsilon);
    const right = simplifyPolygon(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [first, last];
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ex = point.x - lineStart.x;
    const ey = point.y - lineStart.y;
    return Math.sqrt(ex * ex + ey * ey);
  }
  const num = Math.abs(
    dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x,
  );
  return num / Math.sqrt(lenSq);
}

/**
 * Scale normalized polygon to actual sprite pixel dimensions.
 * anchor: "center" (default) or "bot" to adjust Y offset for bottom-anchored sprites.
 */
export function scaleHitbox(
  normalizedPoints: Point[],
  width: number,
  height: number,
  anchor: "center" | "bot" = "center",
): Point[] {
  const yOffset = anchor === "bot" ? -0.5 : 0;
  return normalizedPoints.map((p) => ({
    x: p.x * width,
    y: (p.y + yOffset) * height,
  }));
}
