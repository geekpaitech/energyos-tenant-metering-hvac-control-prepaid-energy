<template>
  <span class="rnt" aria-live="polite">
    <span
      v-for="(c, i) in renderChars"
      :key="i"
      :class="['rnt-char', isDigit(c) ? 'is-digit' : 'is-static', c === ' ' ? 'is-space' : '']"
    >
      <span v-if="!isDigit(c)" class="static">{{ c }}</span>
      <span v-else class="digit-window">
        <span class="digit-strip" :style="digitStyle(i)">
          <span v-for="(n, idx) in stripDigits" :key="`${n}-${idx}`" class="digit">{{ n }}</span>
        </span>
      </span>
    </span>
  </span>
</template>

<script>
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

export default {
  name: 'RollingNumberText',
  props: {
    text: { type: String, default: '--' },
    duration: { type: Number, default: 520 }
  },
  data () {
    return {
      prevText: '',
      positions: [] // 每一位 digit 的“滚动位置”（可以大于 0..9）
    }
  },
  computed: {
    stripDigits () {
      // 两圈，方便继续往下滚（避免回弹）
      return DIGITS.concat(DIGITS)
    },
    renderChars () {
      const next = (this.text == null ? '' : String(this.text))
      const prev = (this.prevText == null ? '' : String(this.prevText))
      const len = Math.max(next.length, prev.length)
      const padLeft = (s) => String(s).padStart(len, ' ')
      return padLeft(next).split('')
    }
  },
  watch: {
    text: {
      handler (next) {
        this.applyNextText(next)
      },
      immediate: true
    }
  },
  beforeDestroy () {
    // no-op
  },
  methods: {
    isDigit (c) {
      return c >= '0' && c <= '9'
    },
    applyNextText (nextRaw) {
      const next = (nextRaw == null ? '' : String(nextRaw))
      const prev = (this.prevText == null ? '' : String(this.prevText))
      const len = Math.max(next.length, prev.length)
      const padLeft = (s) => String(s).padStart(len, ' ')
      const nextChars = padLeft(next).split('')
      const prevChars = padLeft(prev).split('')

      // 初始化/扩容
      if (!Array.isArray(this.positions) || this.positions.length !== len) {
        this.positions = Array.from({ length: len }, (_, i) => {
          const c = prevChars[i]
          return this.isDigit(c) ? Number(c) : 0
        })
      }

      // 计算每位滚动：只对“数字位”做滚动
      nextChars.forEach((c, i) => {
        if (!this.isDigit(c)) return
        const target = Number(c)
        const currentPos = Number(this.positions[i] || 0)
        const currentDigit = ((currentPos % 10) + 10) % 10

        if (currentDigit === target) {
          // 数字没变，不动
          return
        }

        // 统一“向下滚动”到目标位（0..9 的正向步进）
        const step = (target - currentDigit + 10) % 10
        const nextPos = currentPos + (step === 0 ? 10 : step)
        this.$set(this.positions, i, nextPos)
      })

      this.prevText = next
    },
    digitStyle (i) {
      const pos = Number(this.positions[i] || 0)
      const y = -pos * 1.15 // 1.15em line-height
      return {
        transform: `translateY(${y}em)`,
        transitionDuration: `${this.duration}ms`
      }
    }
  }
}
</script>

<style scoped>
.rnt {
  display: inline-flex;
  align-items: baseline;
}

.rnt-char {
  display: inline-flex;
  align-items: baseline;
}

.rnt-char.is-space {
  width: 0.4ch;
}

.static {
  display: inline-block;
}

.digit-window {
  display: inline-block;
  height: 1.15em;
  overflow: hidden;
  vertical-align: baseline;
}

.digit-strip {
  display: flex;
  flex-direction: column;
  will-change: transform;
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

.digit {
  height: 1.15em;
  line-height: 1.15em;
  display: block;
}

@media (prefers-reduced-motion: reduce) {
  .digit-strip {
    transition: none !important;
  }
}
</style>
