// defaults
// https://medium.com/@leannewerner/shadermaterial-vs-rawshadermaterial-f1f0def5722
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
attribute vec2 uv;
attribute vec3 position;
attribute vec3 normal;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}