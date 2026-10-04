import { useEffect, useRef, useState } from 'react'

// Dependency-free WebGL "silk" background (inspired by React Bits' Silk).
// Slow, low-contrast folds of light in the product palette. Pauses when off-screen
// or when the tab is hidden, renders a single still frame for reduced-motion users,
// and falls back to the CSS gradient on the parent when WebGL is unavailable.

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uTime;
uniform float uIntensity;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

float silk(vec2 tex, float t) {
  tex.y += 0.03 * sin(8.0 * tex.x - t);
  return 0.6 + 0.4 * sin(5.0 * (tex.x + tex.y + cos(3.0 * tex.x + 5.0 * tex.y) + 0.02 * t)
                        + sin(20.0 * (tex.x + tex.y - 0.1 * t)));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = vec2(uv.x * uRes.x / uRes.y, uv.y) * 0.62;
  float a = 0.5;
  p = mat2(cos(a), -sin(a), sin(a), cos(a)) * p;

  float t = uTime * 0.55;
  float folds = smoothstep(0.3, 1.0, silk(p, t));
  folds = pow(folds, 2.4);

  vec3 base   = vec3(0.031, 0.043, 0.086);
  vec3 blue   = vec3(0.24, 0.42, 0.94);
  vec3 violet = vec3(0.47, 0.36, 0.95);
  vec3 warm   = vec3(0.95, 0.50, 0.36);

  vec3 tint = mix(blue, violet, smoothstep(0.15, 0.75, uv.x));
  tint = mix(tint, warm, smoothstep(0.7, 1.05, uv.x) * smoothstep(0.9, 0.2, uv.y) * 0.5);

  // Keep the left (headline) side calmer; let light gather to the right.
  float mask = smoothstep(0.0, 1.0, uv.x * 0.85 + uv.y * 0.25);
  vec3 col = base + tint * folds * uIntensity * (0.22 + 0.78 * mask) * 0.55;

  // Soft ambient glow, top-right.
  col += violet * 0.09 * uIntensity * exp(-2.6 * distance(uv, vec2(0.88, 1.0)));

  // Settle into the base colour at the bottom edge.
  col = mix(base, col, smoothstep(0.0, 0.35, uv.y));

  // Fine static grain to avoid banding.
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.016;

  gl_FragColor = vec4(col, 1.0);
}
`

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export default function SilkBackground({ intensity = 1, className = '' }) {
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
    if (!gl) return undefined

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
    if (!vs || !fs) return undefined
    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'uRes')
    const uTime = gl.getUniformLocation(program, 'uTime')
    gl.uniform1f(gl.getUniformLocation(program, 'uIntensity'), intensity)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = performance.now() - 8000 // begin mid-motion rather than at t = 0
    let frame = 0
    let visible = true

    const draw = (now) => {
      gl.uniform1f(uTime, (now - start) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const loop = (now) => {
      draw(now)
      frame = visible && !document.hidden ? requestAnimationFrame(loop) : 0
    }
    const play = () => {
      if (reducedMotion) draw(start + 8000)
      else if (!frame) frame = requestAnimationFrame(loop)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      // Always (re)apply: a fresh program (e.g. StrictMode remount) starts with uRes unset.
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uRes, w, h)
      if (reducedMotion || !frame) draw(performance.now())
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) play()
    })
    intersection.observe(canvas)
    const onVisibility = () => !document.hidden && play()
    document.addEventListener('visibilitychange', onVisibility)

    resize()
    play()
    setReady(true)

    return () => {
      cancelAnimationFrame(frame)
      frame = 0
      resizeObserver.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      // Release the context once the canvas has actually left the page (not on a StrictMode remount).
      setTimeout(() => {
        if (!canvas.isConnected) gl.getExtension('WEBGL_lose_context')?.loseContext()
      })
    }
  }, [intensity])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
