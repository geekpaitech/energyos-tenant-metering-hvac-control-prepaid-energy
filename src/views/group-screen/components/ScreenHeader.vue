<template>
  <header class="ds-header">
    <div class="ds-header__frame" :style="headerFrameStyle">
      <div class="ds-header__overlay">
        <div class="ds-header__nav ds-header__nav--left">
          <div
            class="ds-header__scope-tabs"
            role="tablist"
            aria-label="业态筛选"
            :style="scopeTabsStyle"
          >
            <span class="ds-header__scope-indicator" aria-hidden="true" />
            <button
              v-for="t in scopeTabs"
              :key="t"
              type="button"
              class="ds-header__scope-tab"
              :class="{ on: activeScope === t }"
              role="tab"
              :aria-selected="activeScope === t ? 'true' : 'false'"
              @click="$emit('update:activeScope', t)"
            >{{ t }}</button>
          </div>
        </div>

        <div class="ds-header__title-zone">
          <h1 class="ds-header__title">{{ title }}</h1>
        </div>

        <div class="ds-clock">
          <span class="ds-clock__status"><i aria-hidden="true" />驾驶舱运行中</span>
          <span class="ds-clock__time">{{ clockTime }}</span>
          <span class="ds-clock__date">{{ clockDate }}</span>
        </div>

        <div class="ds-header__nav ds-header__nav--right">
          <div
            class="ds-header__kai-group ds-header__kai-group--compact"
            role="tablist"
            aria-label="时间筛选"
          >
            <button
              v-for="t in timeTabs"
              :key="t"
              type="button"
              class="ds-header__kai-tab"
              :class="{ 'ds-header__kai-tab--on': activeTime === t }"
              role="tab"
              :aria-selected="activeTime === t ? 'true' : 'false'"
              @click="$emit('update:activeTime', t)"
            >{{ t }}</button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { scopeTabs, timeTabs } from '../mock'
import { groupScreenOss } from '../image/oss'

export default {
  name: 'ScreenHeader',
  props: {
    title: { type: String, default: '经开资管物业管理驾驶舱' },
    activeScope: { type: String, default: '全部' },
    activeTime: { type: String, default: '本月' }
  },
  data () {
    return { scopeTabs, timeTabs, clockTime: '', clockDate: '', timer: null }
  },
  computed: {
    headerFrameStyle () {
      return { '--header-frame-image': `url(${groupScreenOss.headerFrame})` }
    },
    scopeTabsStyle () {
      const activeIndex = Math.max(0, scopeTabs.indexOf(this.activeScope))
      return {
        '--scope-width': `${100 / scopeTabs.length}%`,
        '--scope-transform': `translateX(${activeIndex * 100}%)`
      }
    }
  },
  mounted () { this.tick(); this.timer = setInterval(this.tick, 1000) },
  beforeDestroy () { clearInterval(this.timer) },
  methods: {
    tick () {
      const n = new Date()
      const p = v => String(v).padStart(2, '0')
      this.clockTime = `${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`
      const w = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      this.clockDate = `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())} ${w[n.getDay()]}`
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/fonts.scss';
@import '../styles/design-system.scss';

.ds-header {
  position: relative;
  flex: 0 0 $ds-header-h;
  width: 100%;
  height: $ds-header-h;
  min-height: $ds-header-h;
  max-height: $ds-header-h;
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    width: 190px;
    height: 14px;
    z-index: 10;
    pointer-events: none;
    background:
      linear-gradient(90deg, transparent 0 12%, rgba(169, 201, 223, 0.16) 12% 36%, rgba(109, 193, 192, 0.2) 36% 64%, rgba(169, 201, 223, 0.12) 64% 88%, transparent 88%) 0 5px / 100% 1px no-repeat,
      linear-gradient(180deg, #061832 0%, rgba(6, 24, 50, 0.98) 58%, rgba(6, 24, 50, 0) 100%);
    clip-path: polygon(7px 0, 100% 0, calc(100% - 7px) 100%, 0 100%);
    opacity: 0.96;
  }

  &::before {
    left: 298px;
  }

  &::after {
    right: 298px;
    transform: scaleX(-1);
  }
}

.ds-header__frame {
  position: relative;
  width: 100%;
  height: $ds-header-h;
  isolation: isolate;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background-image:
      linear-gradient(rgba(2, 10, 18, 0.02), rgba(2, 10, 18, 0.06)),
      var(--header-frame-image),
      radial-gradient(circle at 50% 28%, rgba(109, 193, 192, 0.12), transparent 56%),
      linear-gradient(
        180deg,
        rgba(25, 44, 74, 0.2) 0%,
        rgba(10, 20, 33, 0.08) 58%,
        rgba(8, 18, 31, 0.01) 100%
      );
    background-repeat: no-repeat, no-repeat, no-repeat, no-repeat;
    background-size: 100% 100%, 100% 100%, auto, auto;
    background-position: center, center 50%, center, center;
    border-radius: 0;
    border: 1px solid rgba(109, 193, 192, 0.22);
    border-top: none;
    filter: saturate(0.72) brightness(1.08) hue-rotate(-8deg);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.055),
      inset 0 -10px 34px rgba(98, 168, 208, 0.08),
      0 10px 32px rgba(2, 8, 16, 0.14),
      0 0 24px rgba(109, 193, 192, 0.1);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 6px;
    height: 1px;
    z-index: 1;
    background: linear-gradient(90deg, transparent, rgba(109, 193, 192, 0.1), rgba(160, 205, 232, 0.48), rgba(109, 193, 192, 0.1), transparent);
    pointer-events: none;
  }
}

.ds-header__overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  line-height: normal;
  pointer-events: none;
}

/* 业态 / 时间：与顶栏通栏闭环，垂直居中偏下（原布局） */
.ds-header__nav {
  position: absolute;
  top: calc(50% + 8px);
  display: flex;
  align-items: center;
  pointer-events: auto;
  z-index: 4;
  transform: translateY(-50%);

  &--left {
    left: 28px;
    width: 304px;
    height: 36px;
    padding: 0;
    border: 1px solid rgba(109, 193, 192, 0.2);
    border-radius: 3px;
    background: rgba(6, 24, 48, 0.78);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.055),
      inset 0 0 14px rgba(109, 193, 192, 0.035),
      0 8px 20px rgba(2, 6, 20, 0.14);
    overflow: hidden;
    box-sizing: border-box;
  }

  /* 时间筛选：与左侧业态筛选同套容器语言，置于时钟左侧 */
  &--right {
    right: 204px;
    width: 216px;
    height: 36px;
    padding: 0;
    border: 1px solid rgba(109, 193, 192, 0.2);
    border-radius: 3px;
    background: rgba(6, 24, 48, 0.78);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.055),
      inset 0 0 14px rgba(109, 193, 192, 0.035),
      0 8px 20px rgba(2, 6, 20, 0.14);
    overflow: hidden;
    box-sizing: border-box;
  }
}

.ds-header__scope-tabs {
  position: relative;
  display: flex;
  align-items: stretch;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.ds-header__scope-indicator {
  position: absolute;
  z-index: 0;
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--scope-width);
  background:
    linear-gradient(180deg, rgba(76, 124, 164, 0.42) 0%, rgba(20, 62, 103, 0.56) 100%),
    radial-gradient(ellipse at 50% 100%, rgba(109, 193, 192, 0.12), transparent 68%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 0 16px rgba(109, 193, 192, 0.08);
  transform: var(--scope-transform);
  transition: transform 0.26s cubic-bezier(0.22, 0.61, 0.36, 1);
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    left: 22%;
    right: 22%;
    bottom: 0;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: $ds-cyan-bright;
    box-shadow: 0 0 7px rgba(109, 193, 192, 0.42);
  }
}

.ds-header__scope-tab {
  position: relative;
  z-index: 1;
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  margin: 0;
  padding: 0 10px;
  border: none;
  border-radius: 0;
  background: transparent;
  color: rgba(219, 226, 236, 0.9);
  font-family: $ds-font-panel;
  font-size: 15px;
  font-weight: 700;
  line-height: 36px;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
  text-shadow: none;
  letter-spacing: 0;
  @include ds-crisp-text;
  transition: color 0.16s ease;

  & + & {
    box-shadow: inset 1px 0 0 ds-ice-a(0.1);
  }

  &:hover:not(.on) {
    color: rgba(240, 248, 255, 0.96);
  }

  &.on {
    color: #f7fbff;
    text-shadow: 0 0 6px rgba(150, 187, 213, 0.18);
  }
}

.ds-header__kai-group {
  display: flex;
  align-items: stretch;
  width: 100%;
  height: 100%;
  gap: 0;
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  overflow: hidden;

  &--compact {
    gap: 0;
  }
}

.ds-header__kai-tab {
  @include ds-crisp-text;
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  padding: 0 8px;
  font-family: $ds-font-panel;
  font-size: 14px;
  font-weight: 600;
  line-height: 34px;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
  border: none;
  background: transparent;
  color: rgba(184, 216, 248, 0.92);

  & + & {
    box-shadow: inset 1px 0 0 ds-ice-a(0.1);
  }

  &:hover:not(.ds-header__kai-tab--on) {
    color: rgba(240, 248, 255, 0.96);
    background: ds-ice-a(0.08);
  }

  &--on {
    color: #ffffff;
    background: linear-gradient(180deg, rgba(98, 168, 208, 0.24) 0%, rgba(16, 64, 128, 0.32) 100%);
    box-shadow: inset 0 -2px 0 $ds-cyan-bright;
  }
}

.ds-header__title-zone {
  position: absolute;
  left: 24%;
  right: 24%;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 3;

  &::before {
    content: '';
    position: absolute;
    left: 5%;
    right: 5%;
    top: 4px;
    bottom: 4px;
    background:
      radial-gradient(ellipse at 50% 50%, rgba(160, 205, 232, 0.24) 0%, rgba(98, 168, 208, 0.1) 42%, transparent 72%);
    filter: blur(1px);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    left: 18%;
    right: 18%;
    bottom: 10px;
    height: 2px;
    border-radius: 2px;
    background: linear-gradient(90deg, transparent, rgba(160, 205, 232, 0.28), rgba(230, 242, 255, 0.7), rgba(160, 205, 232, 0.28), transparent);
    box-shadow: 0 0 16px rgba(109, 193, 192, 0.2);
  }
}

.ds-header__title {
  margin: 0;
  padding: 0;
  font-family: $ds-font-display;
  font-size: 42px;
  font-weight: 400;
  letter-spacing: 4px;
  line-height: 1;
  white-space: nowrap;
  text-align: center;
  color: #ffffff;
  text-shadow:
    0 0 8px rgba(230, 242, 255, 0.28),
    0 0 18px rgba(82, 145, 182, 0.22),
    0 2px 0 rgba(2, 8, 16, 0.18);
  pointer-events: none;
  @include ds-crisp-text;
  transform: translateY(-2px);
}

.ds-clock {
  position: absolute;
  right: 28px;
  top: calc(50% + 8px);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  min-width: 148px;
  padding: 0;
  pointer-events: none;
  z-index: 2;
  transform: translateY(-50%);

  &__status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 1px;
    font-family: $ds-font-panel;
    font-size: 10px;
    line-height: 1;
    color: rgba(109, 193, 192, 0.88);

    i {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: $ds-green;
      box-shadow: 0 0 7px rgba(92, 184, 168, 0.58);
    }
  }

  &__time {
    font-family: $ds-font-num;
    font-size: 18px;
    font-weight: 700;
    color: rgba(230, 242, 255, 0.95);
    font-variant-numeric: tabular-nums;
    line-height: 1;
    letter-spacing: 0;
    text-shadow: none;
    @include ds-crisp-text;
  }

  &__date {
    font-family: $ds-font-panel;
    font-size: 11px;
    color: rgba(170, 187, 210, 0.88);
    white-space: nowrap;
    text-shadow: none;
    @include ds-crisp-text;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ds-header__scope-indicator,
  .ds-header__kai-tab {
    transition: none;
  }
}
</style>
