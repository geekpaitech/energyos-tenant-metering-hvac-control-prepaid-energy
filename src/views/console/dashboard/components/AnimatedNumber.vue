<template>
  <span :class="['animated-number', { 'is-bumping': bumping }]" aria-live="polite">
    {{ displayText }}
  </span>
</template>

<script>
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

export default {
  name: 'AnimatedNumber',
  props: {
    value: { type: [Number, String], default: null },
    duration: { type: Number, default: 850 },
    digits: { type: Number, default: 0 },
    locale: { type: String, default: 'zh-CN' },
    useGrouping: { type: Boolean, default: true },
    minimumFractionDigits: { type: Number, default: null },
    maximumFractionDigits: { type: Number, default: null },
    prefix: { type: String, default: '' },
    suffix: { type: String, default: '' },
    /** 当 value 无法解析为数字时，直接展示原文本 */
    fallbackText: { type: String, default: '--' }
  },
  data () {
    return {
      rafId: null,
      startTs: 0,
      from: null,
      to: null,
      current: null,
      bumping: false,
      bumpTimer: null
    }
  },
  computed: {
    parsedTo () {
      if (typeof this.value === 'number') return Number.isFinite(this.value) ? this.value : null
      if (this.value == null) return null
      const s = String(this.value).trim()
      if (!s) return null
      // 允许传入带千分位的字符串
      const normalized = s.replace(/,/g, '')
      const n = Number(normalized)
      return Number.isFinite(n) ? n : null
    },
    displayText () {
      // 非数字：展示原值或 fallback
      if (this.current == null || !Number.isFinite(this.current)) {
        const raw = this.value == null ? '' : String(this.value)
        const text = raw && raw.trim() ? raw : this.fallbackText
        return `${this.prefix}${text}${this.suffix}`
      }

      const minFD = this.minimumFractionDigits != null ? this.minimumFractionDigits : Math.max(0, this.digits)
      const maxFD = this.maximumFractionDigits != null ? this.maximumFractionDigits : Math.max(0, this.digits)
      const opts = {
        useGrouping: this.useGrouping,
        minimumFractionDigits: minFD,
        maximumFractionDigits: maxFD
      }
      return `${this.prefix}${Number(this.current).toLocaleString(this.locale, opts)}${this.suffix}`
    }
  },
  watch: {
    parsedTo: {
      handler (next) {
        this.animateTo(next)
      },
      immediate: true
    }
  },
  beforeDestroy () {
    if (this.rafId) cancelAnimationFrame(this.rafId)
    if (this.bumpTimer) clearTimeout(this.bumpTimer)
  },
  methods: {
    animateTo (next) {
      if (next == null) {
        this.from = null
        this.to = null
        this.current = null
        return
      }

      const prev = (this.to != null ? this.to : this.current)
      // 避免“刷新先变 0 再跳到目标值”的闪烁：没有历史值时直接从目标值开始，仅做高亮动效
      const from = (prev == null || !Number.isFinite(prev)) ? next : Number(prev)
      const to = Number(next)

      // 值没变也触发一下“生命力”反馈（避免频繁闪烁，做短暂轻微 bump）
      if (Number.isFinite(from) && Number.isFinite(to) && from === to) {
        this.current = to
        this.kickBump()
        return
      }

      this.from = from
      this.to = to
      this.current = from
      this.startTs = 0
      if (this.rafId) cancelAnimationFrame(this.rafId)
      this.kickBump()

      const step = (ts) => {
        if (!this.startTs) this.startTs = ts
        const elapsed = ts - this.startTs
        const t = Math.min(1, Math.max(0, elapsed / Math.max(120, this.duration)))
        const p = easeOutCubic(t)
        const v = this.from + (this.to - this.from) * p
        this.current = v
        if (t < 1) {
          this.rafId = requestAnimationFrame(step)
        } else {
          this.current = this.to
          this.rafId = null
        }
      }

      this.rafId = requestAnimationFrame(step)
    },
    kickBump () {
      this.bumping = false
      if (this.bumpTimer) clearTimeout(this.bumpTimer)
      // 下一帧再置 true，确保动画可重复触发
      this.$nextTick(() => {
        this.bumping = true
        this.bumpTimer = setTimeout(() => {
          this.bumping = false
          this.bumpTimer = null
        }, 520)
      })
    }
  }
}
</script>

<style scoped>
.animated-number {
  display: inline-block;
  will-change: transform, filter, text-shadow;
  transform-origin: 50% 80%;
}

.animated-number.is-bumping {
  animation: num-bump 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
  text-shadow:
    0 0 14px rgba(59, 130, 246, 0.22),
    0 0 28px rgba(99, 102, 241, 0.22);
  filter: saturate(1.18) contrast(1.05);
}

@keyframes num-bump {
  0%   { transform: translateY(0) scale(1); }
  22%  { transform: translateY(-2px) scale(1.05); }
  60%  { transform: translateY(0) scale(0.995); }
  100% { transform: translateY(0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .animated-number.is-bumping {
    animation: none;
  }
}
</style>
<template>
  <span class="an" :class="{ 'is-ready': entered }">
    <span class="an__value">{{ displayText }}</span>
    <span v-if="entered" class="an__sheen" aria-hidden="true"></span>
  </span>
</template>

<script>
export default {
  name: 'AnimatedNumber',
  props: {
    value: { type: [Number, String], default: null },
    format: { type: Function, default: null },
    duration: { type: Number, default: 900 },
    decimals: { type: Number, default: null },
    useGrouping: { type: Boolean, default: true },
    locale: { type: String, default: 'zh-CN' }
  },
  data () {
    return {
      entered: false,
      rafId: 0,
      startAt: 0,
      from: 0,
      to: 0,
      current: 0,
      hasAnimatedOnce: false
    }
  },
  computed: {
    numericTo () {
      const n = Number(this.value)
      return Number.isFinite(n) ? n : null
    },
    displayText () {
      if (!this.entered || this.numericTo == null) {
        if (typeof this.value === 'string' && this.value) return this.value
        if (this.numericTo == null) return '--'
      }
      const n = this.entered ? this.current : this.numericTo
      if (typeof this.format === 'function') return this.format(n)
      const opts = {}
      if (typeof this.decimals === 'number') {
        opts.minimumFractionDigits = this.decimals
        opts.maximumFractionDigits = this.decimals
      }
      if (!this.useGrouping) opts.useGrouping = false
      return Number(n).toLocaleString(this.locale, opts)
    }
  },
  watch: {
    numericTo: {
      handler (n) {
        if (n == null) return
        // 只在首次拿到有效数字时做一次“进入动画”，避免频繁刷新造成跳动
        if (!this.hasAnimatedOnce) {
          this.animateTo(n)
          this.hasAnimatedOnce = true
        } else {
          this.current = n
        }
      },
      immediate: true
    }
  },
  beforeDestroy () {
    if (this.rafId) cancelAnimationFrame(this.rafId)
  },
  methods: {
    easeOutCubic (t) {
      return 1 - Math.pow(1 - t, 3)
    },
    animateTo (n) {
      if (this.rafId) cancelAnimationFrame(this.rafId)
      this.to = n
      this.from = 0
      this.current = 0
      this.startAt = performance.now()
      this.entered = true

      const tick = (now) => {
        const t = Math.min(1, (now - this.startAt) / Math.max(120, this.duration))
        const p = this.easeOutCubic(t)
        this.current = this.from + (this.to - this.from) * p
        if (t < 1) {
          this.rafId = requestAnimationFrame(tick)
        } else {
          this.current = this.to
          this.rafId = 0
        }
      }
      this.rafId = requestAnimationFrame(tick)
    }
  }
}
</script>

<style scoped>
.an {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  min-width: 0;
}

.an__value {
  position: relative;
  z-index: 1;
  will-change: transform, filter;
  transform: translateY(0);
}

.an.is-ready .an__value {
  animation: anPop 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.an__sheen {
  position: absolute;
  inset: -6px -10px;
  border-radius: 999px;
  background: linear-gradient(105deg, transparent 20%, rgba(99, 102, 241, 0.18) 45%, transparent 70%);
  filter: blur(8px);
  opacity: 0;
  animation: anSheen 900ms 180ms ease-out both;
  pointer-events: none;
}

@keyframes anPop {
  0%   { opacity: 0; transform: translateY(6px) scale(0.985); filter: blur(1px); }
  55%  { opacity: 1; transform: translateY(-1px) scale(1.01); filter: blur(0); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}

@keyframes anSheen {
  0%   { opacity: 0; transform: translateX(-12%); }
  30%  { opacity: 1; }
  100% { opacity: 0; transform: translateX(12%); }
}
</style>
