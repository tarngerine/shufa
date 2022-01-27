#ifdef GL_ES
precision mediump float;
#endif
uniform float w;
uniform float h;

uniform sampler2D texture1; // Brush texture
uniform sampler2D texture2; // Previous frame texture
varying vec2 vUv;
void main() {
  vec4 texel1 = texture2D(texture1, vUv) / vec4(2); // reduce brush intensity
  vec4 texel2 = texture2D(texture2, vUv);

  vec4 maxNeighbor = vec4(0., 0., 0., 0.);
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      vec2 step = vec2(float(i) / h, float(j) / h);
      maxNeighbor = max(maxNeighbor, texture2D(texture2, vUv + step));
    }
  }

  // add the two textures together
  // cap it to 1.0
  // sample the max neighbor if it's greater
  gl_FragColor = max(min(texel1 + texel2, 1.0), maxNeighbor);
}