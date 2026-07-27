<template>
  <div class="sphere" :style="{ width: size + 'px', height: size + 'px' }">
    <canvas ref="canvas"></canvas>
    <div class="rim rim-a" aria-hidden="true"></div>
    <div class="rim rim-b" aria-hidden="true"></div>
    <div class="core" aria-hidden="true"></div>
    <div class="scan" aria-hidden="true"></div>
    <div class="orbit orbit-a" aria-hidden="true"></div>
    <div class="orbit orbit-b" aria-hidden="true"></div>
  </div>
</template>

<script>
export default {
  name: 'FlowSphere',
  props: {
    size: {
      type: Number,
      default: 80
    }
  },
  data () {
    return {
      ctx: null,
      dpr: 1,
      rafId: null,
      t0: 0,
      noiseCanvas: null,
      noiseCtx: null
    }
  },
  mounted () {
    this.init()
  },
  beforeDestroy () {
    if (this.rafId) cancelAnimationFrame(this.rafId)
  },
  methods: {
    init () {
      const c = this.$refs.canvas
      this.dpr = window.devicePixelRatio || 1
      c.width = Math.floor(this.size * this.dpr)
      c.height = Math.floor(this.size * this.dpr)
      this.ctx = c.getContext('2d')
      this.ctx.scale(this.dpr, this.dpr)
      this.t0 = performance.now()
      this.noiseCanvas = document.createElement('canvas')
      this.noiseCanvas.width = 96
      this.noiseCanvas.height = 96
      this.noiseCtx = this.noiseCanvas.getContext('2d')
      const loop = () => {
        this.draw()
        this.rafId = requestAnimationFrame(loop)
      }
      loop()
    },
    hash (x, y) {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
      return s - Math.floor(s)
    },
    smoothstep (t) {
      return t * t * (3 - 2 * t)
    },
    valueNoise (x, y) {
      const xi = Math.floor(x)
      const yi = Math.floor(y)
      const xf = x - xi
      const yf = y - yi
      const h00 = this.hash(xi, yi)
      const h10 = this.hash(xi + 1, yi)
      const h01 = this.hash(xi, yi + 1)
      const h11 = this.hash(xi + 1, yi + 1)
      const u = this.smoothstep(xf)
      const v = this.smoothstep(yf)
      const a = h00 + (h10 - h00) * u
      const b = h01 + (h11 - h01) * u
      return a + (b - a) * v
    },
    fbm (x, y, t, vx, vy) {
      let sum = 0
      let amp = 1
      let freq = 1
      for (let i = 0; i < 3; i++) {
        sum += this.valueNoise(x * freq + vx * t, y * freq + vy * t) * amp
        amp *= 0.5
        freq *= 2
      }
      return sum
    },
    draw () {
      const ctx = this.ctx
      const w = this.size
      const h = this.size
      if (!ctx) return
      const now = performance.now()
      const t = (now - this.t0) / 1000
      const nctx = this.noiseCtx
      const nw = this.noiseCanvas.width
      const nh = this.noiseCanvas.height
      const img = nctx.createImageData(nw, nh)
      const data = img.data
      const cx = nw / 2
      const cy = nh / 2
      const r0 = Math.min(cx, cy) - 1
      const breath = 0.9 + 0.1 * Math.sin(t * 0.6)
      for (let yy = 0; yy < nh; yy++) {
        for (let xx = 0; xx < nw; xx++) {
          const dx = xx - cx
          const dy = yy - cy
          const rr = Math.sqrt(dx * dx + dy * dy)
          const idx = (yy * nw + xx) * 4
          if (rr > r0) {
            data[idx + 3] = 0
            continue
          }
          const nx = xx / nw
          const ny = yy / nh
          const n1 = this.fbm(nx * 3, ny * 3, t * 0.12, 0.06, 0.04)
          const n2 = this.fbm(nx * 3.2 + 7, ny * 3.2 + 3, t * 0.10, -0.05, 0.03)
          const blueI = Math.max(0, Math.min(1, n1))
          const orangeI = Math.max(0, Math.min(1, n2))
          const shade = Math.sqrt(Math.max(0, 1 - (rr / r0) * (rr / r0)))
          const baseR = 8
          const baseG = 12
          const baseB = 20
          const bR = 80
          const bG = 160
          const bB = 255
          const oR = 255
          const oG = 170
          const oB = 90
          let r = baseR * breath + bR * blueI * 0.55 + oR * orangeI * 0.35
          let g = baseG * breath + bG * blueI * 0.55 + oG * orangeI * 0.35
          let b = baseB * breath + bB * blueI * 0.55 + oB * orangeI * 0.35
          r = Math.min(255, r * (0.6 + 0.4 * shade))
          g = Math.min(255, g * (0.6 + 0.4 * shade))
          b = Math.min(255, b * (0.6 + 0.4 * shade))
          data[idx] = r
          data[idx + 1] = g
          data[idx + 2] = b
          data[idx + 3] = 255
        }
      }
      nctx.putImageData(img, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(this.noiseCanvas, 0, 0, w, h)
      const gloss = ctx.createRadialGradient(w * 0.38, h * 0.32, 0, w * 0.38, h * 0.32, w * 0.36)
      gloss.addColorStop(0, 'rgba(255,255,255,0.05)')
      gloss.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = gloss
      ctx.fillRect(0, 0, w, h)
    }
  }
}
</script>

<style scoped>
.sphere {
  position: relative;
  display: inline-block;
  border-radius: 50%;
  overflow: hidden;
  box-shadow:
    0 0 18px rgba(80, 160, 255, 0.28),
    0 0 26px rgba(80, 160, 255, 0.18);
}
canvas {
  width: 100%;
  height: 100%;
  display: block;
}
.core {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 52%, rgba(90,180,255,0.18), transparent 40%),
    radial-gradient(circle at 48% 48%, rgba(0,120,255,0.12), transparent 52%),
    radial-gradient(circle at 55% 60%, rgba(255,180,100,0.10), transparent 56%);
  mix-blend-mode: screen;
  animation: corePulse 7.5s ease-in-out infinite;
}
.scan {
  position: absolute;
  inset: -8%;
  border-radius: 50%;
  pointer-events: none;
  background:
    linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(180,220,255,0.12) 50%, rgba(255,255,255,0) 70%);
  transform: rotate(12deg);
  filter: blur(6px);
  mix-blend-mode: screen;
  animation: scanMove 8s linear infinite;
}
.orbit {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(2px);
  mix-blend-mode: screen;
  mask:
    radial-gradient(closest-side, transparent 58%, black 66%, black 74%, transparent 80%);
}
.orbit-a {
  background:
    conic-gradient(
      from 30deg,
      rgba(120,200,255,0) 0%,
      rgba(120,200,255,0.9) 10%,
      rgba(90,160,255,0.85) 13%,
      rgba(160,120,255,0.75) 18%,
      rgba(255,180,110,0.85) 24%,
      rgba(255,150,90,0.85) 28%,
      rgba(120,200,255,0.9) 34%,
      rgba(120,200,255,0) 36%,
      transparent 100%
    );
  animation: orbitRotateA 22s linear infinite;
}
.orbit-b {
  background:
    conic-gradient(
      from 210deg,
      rgba(255,170,90,0) 0%,
      rgba(255,170,90,0.85) 8%,
      rgba(255,210,120,0.75) 12%,
      rgba(120,200,255,0.85) 18%,
      rgba(80,160,255,0.85) 22%,
      rgba(140,120,255,0.70) 26%,
      rgba(255,170,90,0.85) 30%,
      rgba(255,170,90,0) 32%,
      transparent 100%
    );
  animation: orbitRotateB 28s linear infinite reverse;
  opacity: 0.9;
}
.rim {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(8px);
  mix-blend-mode: screen;
  animation: rimPulse 6s ease-in-out infinite;
  mask:
    radial-gradient(closest-side, transparent 60%, black 66%, black 78%, transparent 82%);
}
.rim-a {
  background:
    conic-gradient(
      from 0deg,
      rgba(80,160,255,0.0) 0%,
      rgba(80,160,255,0.85) 8%,
      rgba(140,120,255,0.75) 14%,
      rgba(255,210,120,0.85) 22%,
      rgba(255,170,90,0.90) 28%,
      rgba(255,140,90,0.75) 34%,
      rgba(120,200,255,0.80) 44%,
      rgba(80,160,255,0.85) 52%,
      rgba(140,120,255,0.75) 60%,
      rgba(255,210,120,0.85) 68%,
      rgba(255,170,90,0.90) 76%,
      rgba(120,200,255,0.80) 84%,
      rgba(80,160,255,0.85) 92%,
      rgba(80,160,255,0.0) 100%
    );
  transform-origin: center;
  animation: rimRotateA 18s linear infinite, rimPulse 8s ease-in-out infinite;
}
.rim-b {
  background:
    conic-gradient(
      from 180deg,
      rgba(255,170,90,0.0) 0%,
      rgba(255,170,90,0.80) 10%,
      rgba(255,210,120,0.70) 18%,
      rgba(120,200,255,0.80) 28%,
      rgba(80,160,255,0.85) 36%,
      rgba(140,120,255,0.70) 44%,
      rgba(255,170,90,0.85) 56%,
      rgba(255,210,120,0.80) 64%,
      rgba(120,200,255,0.80) 74%,
      rgba(80,160,255,0.85) 84%,
      rgba(255,170,90,0.70) 92%,
      rgba(255,170,90,0.0) 100%
    );
  transform-origin: center;
  animation: rimRotateB 26s linear infinite reverse, rimPulse 10s ease-in-out infinite;
  opacity: 0.85;
}
@keyframes corePulse {
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.02); opacity: 1; }
  100% { transform: scale(1); opacity: 0.9; }
}
@keyframes scanMove {
  0% { transform: translateX(-10%) rotate(12deg); opacity: 0.85; }
  50% { transform: translateX(10%) rotate(12deg); opacity: 1; }
  100% { transform: translateX(-10%) rotate(12deg); opacity: 0.85; }
}
@keyframes orbitRotateA {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes orbitRotateB {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes rimRotateA {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes rimRotateB {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes rimPulse {
  0% { filter: blur(8px) brightness(1); opacity: 0.9; }
  50% { filter: blur(10px) brightness(1.08); opacity: 1; }
  100% { filter: blur(8px) brightness(1); opacity: 0.9; }
}
</style>
