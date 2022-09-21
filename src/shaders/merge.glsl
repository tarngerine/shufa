#ifdef GL_ES
precision mediump float;
#endif
uniform float w;
uniform float h;
uniform float time;

uniform sampler2D brush; // Brush texture
uniform sampler2D brush2; // Brush texture
uniform sampler2D prev; // Previous frame texture
uniform sampler2D wetness;  // Wetness to sample
varying vec2 vUv;

// Pseudo random
float rand(vec2 pos) {
  return fract(sin(pos.x + pos.y * 700. + time * .8) * 43758.5453);
}

void main() {
  vec4 brushTexel = texture2D(brush, vUv);
  vec4 brush2Texel = texture2D(brush2, vUv);
  vec4 prevTexel = texture2D(prev, vUv);
  vec4 wetnessTexel = texture2D(wetness, vUv);

  gl_FragColor = mix(mix(prevTexel, brushTexel, brushTexel.a), brush2Texel, brush2Texel.a); // based on alpha, if brush alpha is 1.0, use brush color instead

  // if texel is wet, sample from neighbors the mode color
  if (wetnessTexel.r > 0.03) { // convert to ceil(wetnessTexel.r) with mix(a,b,ceil(wetnessTexel.r))
    vec4 neighbor = gl_FragColor;
    // vec4 neighbor = vec4(0.);
    // for (int i = -1; i <= 1; i++) {
    //   for (int j = -1; j <= 1; j++) {

    //     // step out one "pixel" (no pixels in shaders, only
    //     // fragments, we turn i and j into 0->1 range)
    //     vec2 step = vec2(float(i) / w, float(j) / h);
    //     vec4 stepBrush = texture2D(brush, vUv + step);
    //     vec4 stepPrev = texture2D(prev, vUv + step);
    //     // since we cant sample from other texels the gl_FragColor we're outputting this frame
    //     // we recreate the merged base color from line 17 here for the surrounding texels
    //     vec4 recreatedColorForStep = mix(stepPrev, stepBrush, stepBrush.a);
    //     // neighbor = max(neighbor, recreatedColorForStep);
    //     // neighbor = mix(recreatedColorForStep, (neighbor + recreatedColorForStep) / vec4(2.0, 2.0, 2.0, 1.0), neighbor.a); // this one freaks out and gets the staticy effect
    //     neighbor = mix(neighbor, recreatedColorForStep, recreatedColorForStep.a); // this grows properly but when they intersect it freaks out
    //     // neighbor = mix(neighbor, recreatedColorForStep, rand(vUv + step));

    //     // why is everything drifting down to the left... because its a for loop where the final step is always 1,1
    //   }
    // }

    // step out in a random direction
    vec2 step = vec2((rand(vUv) - .5) / (w/2.), (rand(vUv) - .5) / (h / 2.));
    vec4 stepBrush = texture2D(brush, vUv + step);
    vec4 stepPrev = texture2D(prev, vUv + step);
    vec4 recreatedColorForStep = mix(stepPrev, stepBrush, stepBrush.a);
    // neighbor = mix(neighbor, recreatedColorForStep, recreatedColorForStep.a);
    neighbor = mix(recreatedColorForStep, neighbor, neighbor.a);
    // neighbor = mix(neighbor, stepPrev, rand(vUv));
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
