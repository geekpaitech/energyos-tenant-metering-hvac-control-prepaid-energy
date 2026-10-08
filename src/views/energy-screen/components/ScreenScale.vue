<template>
  <div ref="wrapper" class="energy-scale">
    <div class="energy-scale__inner" :style="innerStyle">
      <slot />
    </div>
  </div>
</template>

<script>
const DESIGN_WIDTH = 1920
const DESIGN_HEIGHT = 1080

export default {
  name: 'EnergyScreenScale',
  data () {
    return {
      scale: 1,
      canvasWidth: DESIGN_WIDTH,
      canvasHeight: DESIGN_HEIGHT
    }
  },
  computed: {
    innerStyle () {
      return {
        width: `${this.canvasWidth}px`,
        height: `${this.canvasHeight}px`,
        '--energy-canvas-width': `${this.canvasWidth}px`,
        '--energy-canvas-height': `${this.canvasHeight}px`,
        transform: `scale(${this.scale})`,
        transformOrigin: '0 0'
      }
    }
  },
  mounted () {
    this.updateScale()
    window.addEventListener('resize', this.updateScale)
    document.addEventListener('fullscreenchange', this.updateScale)
    this._raf = requestAnimationFrame(() => {
      this.updateScale()
      requestAnimationFrame(this.updateScale)
    })
    if (typeof ResizeObserver !== 'undefined') {
      this._observer = new ResizeObserver(this.updateScale)
      this._observer.observe(this.$refs.wrapper)
    }
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.updateScale)
    document.removeEventListener('fullscreenchange', this.updateScale)
    if (this._raf) cancelAnimationFrame(this._raf)
    if (this._observer) this._observer.disconnect()
  },
  methods: {
    updateScale () {
      const width = window.innerWidth
      const height = window.innerHeight
      if (!width || !height) return
      const widthScale = width / DESIGN_WIDTH
      const heightScale = height / DESIGN_HEIGHT

      // Keep one uniform scale so text and icons never deform. Any viewport space
      // beyond the 16:9 design is absorbed by the logical canvas in that axis.
      this.scale = Math.min(widthScale, heightScale)
      this.canvasWidth = Math.max(DESIGN_WIDTH, width / this.scale)
      this.canvasHeight = Math.max(DESIGN_HEIGHT, height / this.scale)
      this.$emit('scale-change', this.scale)
    }
  }
}
</script>
