import debounce from "lodash.debounce";
import * as THREE from "three";
import { setupMouse, setupOrthoScene } from "./utils";
import fragment from "./shaders/fragment.glsl";
import vertex from "./shaders/vertex.glsl";
import "./style.css";
import { setupBrush } from "./brush";

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const { scene, camera, renderer } = setupOrthoScene();
const mouse = setupMouse(renderer);

// const material = new THREE.MeshBasicMaterial({
//   color: 0x0000ff,
//   depthWrite: false,
//   side: THREE.DoubleSide,
// });
// import { CopyShader } from "./shader";
const brush = setupBrush(mouse);
scene.add(brush.mesh);

const buffer = new THREE.WebGLRenderTarget(sizes.width, sizes.height);
const plane = new THREE.PlaneGeometry(sizes.width, sizes.height);
const bufferMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    texture1: {
      value: buffer.texture,
    },
    u_time: { value: 0 },
  },
  vertexShader: vertex,
  fragmentShader: fragment,
});
bufferMaterial.needsUpdate = true;
// const bufferMaterial = new THREE.MeshBasicMaterial({
//   map: buffer.texture,
//   // side: THREE.DoubleSide,
// });
const bufferMesh = new THREE.Mesh(plane, bufferMaterial);
bufferMesh.translateX(sizes.width / 2);
bufferMesh.translateY(sizes.height / 2);
bufferMesh.translateZ(-1); // Move slightly behind brush
bufferMesh.scale.x = 0.5;
bufferMesh.scale.y = 0.5;
bufferMesh.rotation.z = Math.PI;
bufferMesh.rotation.y = Math.PI;
scene.add(bufferMesh);

const render = () => {
  brush.update();

  bufferMesh.material.uniforms.u_time.value += 0.1;
  renderer.render(scene, camera);
  renderer.setRenderTarget(buffer);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  window.requestAnimationFrame(render);
};

render();

// import * as dat from "dat.gui";
// const gui = new dat.GUI();
// // const debugObject = {
// //   color: "#FF00CC",
// // };
// // gui
// //   .addColor(debugObject, "color")
// //   .name("Color")
// //   .onChange(() => {
// //     cubeMaterial.color = new THREE.Color(debugObject.color);
// //   });

// if (import.meta.env.PROD) {
//   gui.hide();
//   window.showGUI = () => gui.show();
// }

// Setup resizers
window.addEventListener("resize", debounce(onResize, 100));
function onResize(): void {
  sizes.height = window.innerHeight;
  sizes.width = window.innerWidth;

  // camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
