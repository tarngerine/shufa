import * as THREE from "three";
import PERLIN from "./perlin";
import { MouseInfo } from "./utils";

const DEFAULT_SIZE = 25;

const material = new THREE.MeshBasicMaterial({
  color: 0x0000ff,
});

export function setupBrush(mouse: MouseInfo): {
  mesh: THREE.Mesh;
  update: () => void;
} {
  const brush = new THREE.Shape();
  brush.setFromPoints(genBrush([0, 0]));
  const geometry = new THREE.ShapeGeometry(brush);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;

  function update() {
    // Update brush based on mouse
    if (mouse.isDown) {
      mesh.visible = true;
    } else {
      mesh.visible = false;
    }
    mesh.geometry.setFromPoints(genBrush([mouse.position.x, mouse.position.y]));
  }
  return { mesh, update };
}

// generate new array of Vector2 points for brush
export function genBrush(
  center: [number, number],
  size = DEFAULT_SIZE
): THREE.Vector2[] {
  const points = [];
  // create COUNT points for circle
  const COUNT = 8;

  const cx = center[0];
  const cy = center[1];

  for (let i = 0; i < COUNT; i++) {
    const angle = (i / COUNT) * Math.PI * 2;
    points.push([cx + size * Math.cos(angle), cy + size * Math.sin(angle)]);
  }

  // To make a semi-realistic brush base we recursively add midpoints and offset by noise
  // instead of ending with a super spikey result we get a nicer brush shape
  const RECURSE = 3;
  const OFFSET = size / 5; // how much to offset each midpoint by (will be multiplied by perlin noise 0 - 1)
  for (let depth = 0; depth < RECURSE; depth++) {
    for (let i = points.length - 1; i >= 0; i--) {
      // we start from the end so we can insert with i easily without the new points mutating the current point index
      const point = points[i];
      // get mid point between current and previous
      const previous = points[(points.length + i - 1) % points.length];
      const middle = [
        previous[0] + (point[0] - previous[0]) / 2,
        previous[1] + (point[1] - previous[1]) / 2,
      ];
      // offset it by noise * OFFSET
      const middleOffset = [
        middle[0] + PERLIN.get(middle[0], middle[1]) * OFFSET,
        middle[1] + PERLIN.get(middle[1], middle[0]) * OFFSET,
      ]; // we flip the perlin noise x/y bc otherwise it's always offset in the same direction and looks bad

      // insert new midpoint into points
      points.splice(i, 0, middleOffset);
    }
  }
  return points.map((pt) => new THREE.Vector2(pt[0], pt[1]));
}
