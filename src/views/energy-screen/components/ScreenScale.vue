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
      canvasHeight: DESIGN_HEIGHT,
      offsetX: 0
    }
  },
  computed: {
    innerStyle () {
      return {
        width: `${DESIGN_WIDTH}px`,
        height: `${this.canvasHeight}px`,
        '--energy-canvas-height': `${this.canvasHeight}px`,
        transform: `translate3d(${this.offsetX}px, 0, 0) scale(${this.scale})`,
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

      // Preserve the design geometry. Taller viewports (for example 1440x900)
      // receive extra logical canvas height instead of a second, distorting scale.
      this.scale = Math.min(widthScale, heightScale)
      this.canvasHeight = Math.max(DESIGN_HEIGHT, height / this.scale)
      this.offsetX = Math.max(0, (width - (DESIGN_WIDTH * this.scale)) / 2)
      this.$emit('scale-change', this.scale)
    }
  }
}
</script>
