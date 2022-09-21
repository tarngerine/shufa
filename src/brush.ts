import * as THREE from "three";
import PERLIN from "./perlin";
import { createRT, MouseInfo } from "./utils";

const DEFAULT_SIZE = 50;
const TRAIL_LENGTH = 5;
const TRAIL_RESAMPLE_SPACING = 5;
const INSTANCE_COUNT = 200; // enough to support a quick stroke across screen, todo: calculate this based on window diameter/spacing

const material = new THREE.MeshBasicMaterial({
  color: 0x8055fd, // brush color
});
const materialYellow = new THREE.MeshBasicMaterial({
  color: 0xebf46d, // brush color
});

const dummyObject = new THREE.Object3D(); // Used to apply transformations to and get matrix from so we don't have to do too much matrix stuff

export function setupBrush(mouse: MouseInfo): {
  mesh: THREE.Mesh;
  line: THREE.Line;
  update: () => void;
  render: (
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera
  ) => THREE.Texture;
} {
  const brush = new THREE.Shape();
  brush.setFromPoints(genBrush([mouse.position.x, mouse.position.y]));
  const geometry = new THREE.ShapeGeometry(brush);
  const mesh = new THREE.InstancedMesh(geometry, material, INSTANCE_COUNT);
  mesh.visible = false;

  // We use a trail to interpolate gaps between sampling frames for a smooth brush stroke
  let trail: THREE.Vector2[] = [];
  const trailSpeed: THREE.Vector2[] = []; // keep a history of mouse speed to derive brush dynamics (e.g. size, opacity)
  const line = createLine();
  line.visible = false; // DEBUG
  let needsReset = false;

  // Set up its own scene to render into to create a texture for merge shader layer
  const scene = new THREE.Scene();
  scene.background = null;
  scene.add(mesh);
  const rt = createRT();

  let betweenTrailTimer = 0;
  let flipMaterial = false;
  // Runs once a frame, generates a new brush shape and maintains trail
  function update() {
    // Swap material on mouseup
    if (mouse.isUp && flipMaterial) {
      const nextMaterial =
        mesh.material === material ? materialYellow : material;
      mesh.material.dispose();
      mesh.material = nextMaterial;
      mesh.material.needsUpdate = true;
      flipMaterial = false;
    }
    // Update brush based on mouse)
    if (mouse.isDown) {
      betweenTrailTimer++;
      if (betweenTrailTimer < 5) return;
      flipMaterial = true;
      betweenTrailTimer = 0;
      needsReset = true;
      mesh.visible = true;
      // Update the shared brush mesh geometry this frame
      mesh.geometry.setFromPoints(
        genBrush([mouse.position.x, mouse.position.y]) // mouse position only for perlin offset, we apply matrix transform to each instance below
      );

      // Add latest mouse position to trail
      // trail.push(new THREE.Vector2(mouse.position.x, mouse.position.y));
      trail = [
        new THREE.Vector2(
          mouse.position.x + (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50 + mouse.position.y
        ),
      ];
      trailSpeed.push(mouse.velocity);
      if (trail.length > TRAIL_LENGTH) trail.shift();

      const resampled = resampleLineBySpacing(trail, TRAIL_RESAMPLE_SPACING);
      line.geometry.setFromPoints(resampled); // DEBUG

      // Render brush at each resampled trail point with an instance of mesh
      resampled.forEach((point, i) => {
        if (i < mesh.count) {
          dummyObject.position.set(point.x, point.y, 0);
          dummyObject.rotation.set(0, 0, (i / resampled.length) * Math.PI * 2); // rotate brush instance to make it look more varied
          dummyObject.updateMatrix();
          mesh.setMatrixAt(i, dummyObject.matrix);
        }
      });
      mesh.instanceMatrix.needsUpdate = true;
    } else {
      mesh.visible = false;

      if (needsReset) {
        trail.length = 0; // Clear trail
        // Move meshes offscreen so next brush stroke start it doesnt keep the previous stroke's instance positions
        for (let i = 0; i < mesh.count; i++) {
          dummyObject.position.set(-DEFAULT_SIZE, -DEFAULT_SIZE, 0); // offscreen
          dummyObject.updateMatrix();
          mesh.setMatrixAt(i, dummyObject.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        needsReset = false;
      }
    }
  }

  // renders the brush to a texture
  function render(
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera
  ): THREE.Texture {
    update();
    // render brush to brush scene
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    return rt.texture;
  }

  return { line, mesh, update, render };
}

function createLine() {
  const material = new THREE.LineBasicMaterial({
    color: 0xff0000,
  });

  const geometry = new THREE.BufferGeometry().setFromPoints([]);

  const line = new THREE.Line(geometry, material);
  return line;
}

// generate new array of Vector2 points for brush
export function genBrush(
  perlinOffset: [number, number], // the brush shape is generated at 0,0 but we still need some way to vary the perlin noise
  size = DEFAULT_SIZE
): THREE.Vector2[] {
  const points = [];
  // create COUNT points for circle
  const COUNT = 8;

  for (let i = 0; i < COUNT; i++) {
    const angle = (i / COUNT) * Math.PI * 2;
    points.push([size * Math.cos(angle), size * Math.sin(angle)]);
  }

  // To make a semi-realistic brush base we recursively add midpoints and offset by noise
  // instead of ending with a super spikey result we get a nicer brush shape
  const RECURSE = 4;
  const OFFSET = size / 2; // how much to offset each midpoint by (will be multiplied by perlin noise 0 - 1)
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
      // we use perlin noise based on mouse position it's like textured paper:
      // texture varies across the canvas but in the same spot it's always the same
      // offset it by noise * OFFSET
      const middleOffset = [
        middle[0] +
          PERLIN.get(middle[0] + perlinOffset[0], middle[1] + perlinOffset[1]) *
            OFFSET,
        middle[1] +
          PERLIN.get(middle[1] * perlinOffset[1], middle[0] + perlinOffset[0]) *
            OFFSET,
      ]; // we flip the perlin noise x/y bc otherwise it's always offset in the same direction and looks bad

      // insert new midpoint into points
      points.splice(i, 0, middleOffset);
    }
  }
  return points.map((pt) => new THREE.Vector2(pt[0], pt[1]));
}

// Given an line as an array of Vector2 points and a spacing in pixels, create a new line of n points with the spacing
function resampleLineBySpacing(line: THREE.Vector2[], spacing: number) {
  // immediately start drawing even if we have just started sampling the line
  if (line.length === 1) return [line[0], line[0]];
  const newLine: THREE.Vector2[] = [];
  for (let i = 0; i < line.length - 1; i++) {
    const start = line[i];
    const end = line[i + 1];
    const distance = start.distanceTo(end);
    const numPoints = Math.ceil(distance / spacing);
    for (let j = 0; j < numPoints; j++) {
      const t = j / numPoints;
      newLine.push(new THREE.Vector2().copy(start).lerp(end, t));
    }
  }
  return newLine;
}
