#ifdef GL_ES
precision mediump float;
#endif
uniform float w;
uniform float h;

uniform sampler2D brush; // Brush texture
uniform sampler2D prev; // Previous frame texture
uniform sampler2D wetness;  // Wetness to sample
varying vec2 vUv;

void main() {
  vec4 brushTexel = texture2D(brush, vUv);
  vec4 prevTexel = texture2D(prev, vUv);
  vec4 wetnessTexel = texture2D(wetness, vUv);

  gl_FragColor = mix(prevTexel, brushTexel, brushTexel.a); // based on alpha, if brush alpha is 1.0, use brush color instead

  // if texel is wet, sample from neighbors the mode color
  if (wetnessTexel.r > 0.03) { // convert to ceil(wetnessTexel.r) with mix(a,b,ceil(wetnessTexel.r))
    vec4 neighbor = gl_FragColor;
    for (int i = -1; i <= 1; i++) {
      for (int j = -1; j <= 1; j++) {
        
        // step out one "pixel" (no pixels in shaders, only
        // fragments, we turn i and j into 0->1 range)
        vec2 step = vec2(float(i) / h, float(j) / h);
        vec4 stepBrush = texture2D(brush, vUv + step);
        vec4 stepPrev = texture2D(prev, vUv + step);
        // since we cant sample from other texels the gl_FragColor we're outputting this frame
        // we recreate the merged base color from line 17 here for the surrounding texels
        vec4 recreatedColorForStep = mix(stepPrev, stepBrush, stepBrush.a);
        // neighbor = max(neighbor, recreatedColorForStep);
        // neighbor = mix(recreatedColorForStep, (neighbor + recreatedColorForStep) / vec4(2.0, 2.0, 2.0, 1.0), neighbor.a);
        neighbor = mix(neighbor, recreatedColorForStep, recreatedColorForStep.a);

      }
    }
    gl_FragColor = neighbor;
  }

  // // if texel is wet, sample from neighbors to bleed
  // if (wetnessTexel.r > 0.03) {
  //   vec4 neighbor = texel1;
  //   // for (int i = -1; i <= 1; i++) {
  //   //   for (int j = -1; j <= 1; j++) {
  //   //     // step out one "pixel" (no pixels in shaders, only
  //   //     // fragments, we turn i and j into 0->1 range)
  //   //     vec2 step = vec2(float(i) / h, float(j) / h);
  //   //     // since we cant sample from the texture we're merging this frame
  //   //     // we merge the neighbor texel manually each sample
  //   //     if (texture2D(brush, vUv + step).a > 0.) {
  //   //       neighbor = mix(texture2D(brush, vUv + step), neighbor, .5);
  //   //     } else {
  //   //       neighbor = mix(texture2D(prev, vUv + step), neighbor, .5);
  //   //     }
  //   //   }
  //   // }
  //   gl_FragColor = neighbor;
  // } else {

  //   // add the two textures together
  //   // cap it to 1.0
  //   gl_FragColor = texel2;
  // }
}
