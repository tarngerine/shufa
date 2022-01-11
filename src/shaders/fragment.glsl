// void main() { gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); }
#ifdef GL_ES
precision mediump float;
#endif
uniform float u_time;
uniform sampler2D texture1;
varying vec2 vUv;

vec2 SineWave(vec2 p) {
  // convert Vertex position <-1,+1> to texture coordinate <0,1> and some
  // shrinking so the effect dont overlap screen
  p.x = (0.55 * p.x) + 0.5;
  p.y = (-0.55 * p.y) + 0.5;
  // wave distortion
  float x = sin(50.0 * p.y + 1.0 * p.x + u_time) * 0.04;
  float y = cos(50.0 * p.y + 1.0 * p.x + u_time) * 0.04;
  return vec2(p.x + x, p.y + y);
}

void main() {
  // vec4 texel = texture2D(
  //     texture1, vec2(sin(u_time) * 0.01 + vUv.x, sin(u_time) * 0.01 +
  //     vUv.y));
  vec4 texel = texture2D(texture1, SineWave(vUv));
  gl_FragColor = vec4(1.0 - texel.x, 0.5 - texel.y, 1.0 * texel.z, 1.0);
}
