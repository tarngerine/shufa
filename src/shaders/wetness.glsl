#ifdef GL_ES
precision mediump float;
#endif
const float WETNESS_STEP = 1. / 255.; // 256 steps of wetness
uniform float w;
uniform float h;
uniform float time;

uniform sampler2D brush;
uniform sampler2D prev; // Previous frame texture
varying vec2 vUv;

// Pseudo random
float rand(vec2 pos) {
  return fract(sin(pos.x + pos.y * 700. + time * .8) * 43758.5453);
}

void main() {
  // Current texel values sampled from brush and previous frame
  vec4 brushTexel = texture2D(brush, vUv);
  vec4 texel = texture2D(prev, vUv);

  // Dry all previous frame texels by 3/4 of a step
  texel.r -= WETNESS_STEP;

  // Add wetness from brush
  if (brushTexel.a > 0.) {   // if brushTexel is not empty
    texel.r += WETNESS_STEP; // increase wetness by 1 step
  }

  // Dilate wetness from previous frame
  vec4 maxNeighbor = vec4(0.);
  bool go = rand(vUv) > .9;
  if (go) {
    for (int i = -1; i <= 1; i++) {
      for (int j = -1; j <= 1; j++) {
        vec2 step = vec2(float(i) / h, float(j) / h);
        maxNeighbor = max(maxNeighbor, texture2D(prev, vUv + step));
        maxNeighbor = max(maxNeighbor, texture2D(brush, vUv + step));
      }
    }
  }

  // gl_FragColor = texel;
  gl_FragColor = vec4(max(texel.r, maxNeighbor.r), 0., 0., 0.);
  // if (vUv.x > .5) {
  //   gl_FragColor = vec4(0.);
  // } else {
  //   gl_FragColor = vec4(1.);
  // }
}