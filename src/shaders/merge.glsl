#ifdef GL_ES
precision mediump float;
#endif
uniform sampler2D texture1; // Brush texture
uniform sampler2D texture2; // Previous frame texture
varying vec2 vUv;
void main() {
  vec4 texel1 = texture2D(texture1, vUv);
  vec4 texel2 = texture2D(texture2, vUv);
  // add the two textures together
  // only add 50% of the brush texture
  gl_FragColor = min(texel1 + texel2, 1.0);
}