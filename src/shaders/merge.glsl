#ifdef GL_ES
precision mediump float;
#endif
uniform float w;
uniform float h;

uniform sampler2D texture1; // Brush texture
uniform sampler2D texture2; // Previous frame texture
uniform sampler2D wetness;  // Wetness to sample
varying vec2 vUv;

void main() {
  vec4 texel1 = texture2D(texture1, vUv) / vec4(10); // reduce brush intensity
  vec4 texel2 = texture2D(texture2, vUv);
  vec4 wetnessTexel = texture2D(wetness, vUv);

  // if texel is wet, sample from neighbors to bleed
  if (wetnessTexel.r > 0.03) {
    vec4 neighbor = vec4(0.);
    for (int i = -1; i <= 1; i++) {
      for (int j = -1; j <= 1; j++) {
        // step out one "pixel" (no pixels in shaders, only
        // fragments, we turn i and j into 0->1 range)
        vec2 step = vec2(float(i) / h, float(j) / h);
        // since we cant sample from the texture we're merging this frame
        // we merge the neighbor texel manually each sample
        vec4 neighborTexel = min(texture2D(texture1, vUv + step) +
                                     texture2D(texture2, vUv + step),
                                 1.0);
        neighbor = max(neighbor, neighborTexel);
      }
    }
    gl_FragColor = neighbor;
  } else {

    // add the two textures together
    // cap it to 1.0
    gl_FragColor = min(texel1 + texel2, 1.0);
  }
}
