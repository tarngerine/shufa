import debounce from "lodash.debounce";
import * as THREE from "three";
import { createDataTexture, setupMouse, setupOrthoScene } from "./utils";
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

const material = new THREE.MeshBasicMaterial({
  color: 0x0000ff,
  side: THREE.DoubleSide,
});
// import { CopyShader } from "./shader";
const brush = setupBrush(mouse);
scene.add(brush.mesh);

// const buffer = new THREE.WebGLRenderTarget(sizes.width, sizes.height);
const plane = new THREE.PlaneGeometry(sizes.width, sizes.height);
// const bufferMaterial = new THREE.RawShaderMaterial({
//   uniforms: {
//     texture1: {
//       value: buffer.texture,
//     },
//     u_time: { value: 0 },
//   },
//   vertexShader: vertex,
//   fragmentShader: fragment,
// });
const bufferMaterial = new THREE.MeshBasicMaterial({
  map: null,
  side: THREE.DoubleSide,
});
bufferMaterial.needsUpdate = true;
const bufferMesh = new THREE.Mesh(plane, bufferMaterial);
bufferMesh.translateX(sizes.width / 2);
bufferMesh.translateY(sizes.height / 2);
// bufferMesh.translateZ(-1); // Move slightly behind brush
// bufferMesh.scale.x = 0.5;
// bufferMesh.scale.y = 0.5;
bufferMesh.rotation.z = Math.PI;
bufferMesh.rotation.y = Math.PI;
scene.add(bufferMesh);

// Set up two textures for paper
// one is previous and one is next
// start as empty datatextures
// they have a shader that accepts previous texture and next texture
// and adds them together

// Set up 2 RenderTargets with blank DataTexture
// rt1 > blank
// rt2 > blank
const options = {
  format: THREE.RGBAFormat,
};
const rt1 = new THREE.WebGLRenderTarget(sizes.width, sizes.height, options);
const rt2 = new THREE.WebGLRenderTarget(sizes.width, sizes.height, options);

// const tex = new THREE.DataTexture(
//   new Float32Array(sizes.width * sizes.height * 4),
//   sizes.width,
//   sizes.height,
//   THREE.RGBAFormat,
//   THREE.FloatType
// );
const tex = createDataTexture(sizes);
tex.needsUpdate = true;
tex.flipY = false;
rt1.texture = tex.clone();
rt2.texture = tex;

// Shader material that merges two textures
const mergeMaterial = new THREE.RawShaderMaterial({
  side: THREE.DoubleSide,
  uniforms: {
    texture1: {
      value: rt1.texture,
    },
    texture2: {
      value: rt2.texture,
    },
  },
  vertexShader: vertex,
  fragmentShader: `
    #ifdef GL_ES
    precision mediump float;
    #endif
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    varying vec2 vUv;
    void main() {
      vec4 texel1 = texture2D(texture1, vUv);
      vec4 texel2 = texture2D(texture2, vUv);
      // add the two textures together
      gl_FragColor = min(texel1 + texel2, 1.0);
    }
  `,
});
const mergeMesh = new THREE.Mesh(new THREE.PlaneGeometry(), mergeMaterial);
mergeMesh.scale.set(sizes.width, sizes.height, 1);
mergeMesh.position.set(sizes.width / 2, sizes.height / 2, 1);
mergeMesh.rotation.z = Math.PI;
mergeMesh.rotation.y = Math.PI;
const mergeScene = new THREE.Scene();
mergeScene.add(mergeMesh);

// add brush to brush scene and RT
const brushScene = new THREE.Scene();
brushScene.add(brush.mesh);
const brushRT = new THREE.WebGLRenderTarget(sizes.width, sizes.height, options);

// render loop:
// render to rt1
// rt1 texture -> prevtexture
// prevtexture as uniform -> rt2 with shader
// switch rt1 with rt2
const mergeRT = {
  prev: rt1,
  next: rt2,
};

const render = () => {
  brush.update();
  // bufferMesh.material.uniforms.u_time.value += 0.1;
  // renderer.setRenderTarget(buffer);
  // renderer.render(scene, camera);

  // render brush to brush scene
  renderer.setRenderTarget(brushRT);
  renderer.render(brushScene, camera);
  // get brushRT as texture, and previous RT as texture
  mergeMaterial.uniforms.texture1.value = brushRT.texture;
  mergeMaterial.uniforms.texture2.value = mergeRT.prev.texture;
  // render the next merge RT with shader
  renderer.setRenderTarget(mergeRT.next);
  renderer.render(mergeScene, camera);

  // preview the newly rendered next RT's texture in base scene
  const latestTexture = mergeRT.next.texture;
  bufferMesh.material.map = latestTexture;
  bufferMesh.material.needsUpdate = true;
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);

  // Swap mergeRTs
  const temp = mergeRT.prev;
  mergeRT.prev = mergeRT.next;
  mergeRT.next = temp;

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
