<template>
  <span :class="['num-fx', { 'is-hit': hit }]" aria-live="polite">{{ text }}</span>
</template>

<script>
export default {
  name: 'NumberFxText',
  props: {
    text: { type: String, default: '--' }
  },
  data () {
    return {
      hit: false,
      timer: null
    }
  },
  watch: {
    text: {
      handler () {
        this.pulse()
      },
      immediate: true
    }
  },
  beforeDestroy () {
    if (this.timer) clearTimeout(this.timer)
  },
  methods: {
    pulse () {
      this.hit = false
      if (this.timer) clearTimeout(this.timer)
      this.$nextTick(() => {
        this.hit = true
        this.timer = setTimeout(() => {
          this.hit = false
          this.timer = null
        }, 650)
      })
    }
  }
}
</script>

<style scoped>
.num-fx {
  display: inline-block;
  transform-origin: 50% 80%;
  will-change: transform, filter, text-shadow;
}

.num-fx.is-hit {
  animation: numfx-pop 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
  text-shadow:
    0 0 10px rgba(59, 130, 246, 0.22),
    0 0 26px rgba(99, 102, 241, 0.18);
  filter: saturate(1.22) contrast(1.08);
}

@keyframes numfx-pop {
  0%   { transform: translateY(0) scale(1); }
  18%  { transform: translateY(-3px) scale(1.06); }
  48%  { transform: translateY(0) scale(0.995); }
  100% { transform: translateY(0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .num-fx.is-hit { animation: none; }
}
</style>
