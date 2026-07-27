<template>
  <div
    class="ds-panel"
    :class="{
      'ds-panel--tier-core': tier === 'core',
      'ds-panel--tier-secondary': tier === 'secondary',
      'ds-panel--tier-tertiary': tier === 'tertiary',
      'ds-panel--highlight': highlight && tier === 'core'
    }"
    :style="panelStyle"
  >
    <div v-if="title" class="ds-panel__head">
      <i class="ds-panel__bar" aria-hidden="true" />
      <span v-if="titleIcon" class="ds-panel__ic" :class="'ic-' + titleIcon">
        <svg viewBox="0 0 20 20"><path :d="iconPaths[titleIcon]" fill="currentColor" /></svg>
      </span>
      <span class="ds-panel__title-wrap">
        <span class="ds-panel__title">{{ title }}</span>
      </span>
      <span v-if="tag" class="ds-panel__tag">{{ tag }}</span>
    </div>
    <div class="ds-panel__body"><slot /></div>
  </div>
</template>

<script>
import { groupScreenOss } from '../image/oss'

const iconPaths = {
  device: 'M10 2l7 3v5c0 4.5-3 7.74-7 9-4-1.26-7-4.5-7-9V5l7-3z',
  warehouse: 'M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2 0v10h8V5H6zm2 2h4v2H8V7zm0 4h4v2H8v-2z'
}

export default {
  name: 'PanelBox',
  props: {
    title: String,
    tag: String,
    highlight: { type: Boolean, default: false },
    tier: {
      type: String,
      default: 'secondary',
      validator: v => ['core', 'secondary', 'tertiary'].includes(v)
    }
  },
  data: () => ({ iconPaths }),
  computed: {
    panelStyle () {
      const tertiary = this.tier === 'tertiary'
      return {
        '--panel-head-image': `url(${groupScreenOss.titleStripMain})`,
        '--panel-title-frame-image': `url(${groupScreenOss.panelTitleFrame})`,
        '--panel-title-icon-image': `url(${groupScreenOss.panelTitleIcon})`,
        '--panel-head-image-size': '100% 100%',
        '--panel-body-sheen': tertiary ? '0.006' : '0.01',
        '--panel-body-glow': tertiary ? '0.008' : '0.014',
        '--panel-head-image-opacity': tertiary ? '0.18' : '0.26',
        '--panel-head-image-filter': 'brightness(0.98) saturate(0.78) hue-rotate(-8deg)',
        '--panel-head-background': tertiary
          ? 'linear-gradient(90deg, rgba(66, 108, 148, 0.46) 0%, rgba(30, 66, 104, 0.4) 46%, rgba(12, 31, 58, 0.2) 100%)'
          : 'linear-gradient(90deg, rgba(76, 124, 164, 0.56) 0%, rgba(38, 78, 116, 0.48) 46%, rgba(13, 33, 62, 0.22) 100%)',
        '--panel-head-bottom-line': 'linear-gradient(90deg, rgba(118, 163, 203, 0.42) 0%, rgba(82, 145, 182, 0.2) 42%, transparent 92%)'
      }
    },
    titleIcon () {
      return ''
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/fonts.scss';
@import '../styles/design-system.scss';

.ds-panel {
  position: relative;
  height: 100%;
  overflow: hidden;
  @include ds-glass;
  border-radius: $ds-panel-radius;
  border-color: rgba(82, 145, 182, 0.32);
  transition: box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease;
  --panel-body-sheen: 0.012;
  --panel-body-glow: 0.015;
  --panel-head-image-opacity: 0.14;
  --panel-head-image-filter: brightness(1.18) saturate(1.02);
  --panel-shell-glow: 0.012;
  --panel-shell-border: rgba(170, 210, 239, 0.08);
  --panel-shell-overlay: none;
  --panel-shell-overlay-opacity: 0;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: $ds-panel-radius;
  background:
      linear-gradient(180deg, rgba(255, 255, 255, var(--panel-body-sheen)) 0%, transparent 26%),
      radial-gradient(circle at 50% 0%, rgba(82, 145, 182, var(--panel-body-glow)) 0%, transparent 54%);
    pointer-events: none;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: $ds-panel-radius;
    background: transparent;
    opacity: 1;
    box-shadow:
      inset 0 0 0 1px rgba(118, 163, 203, 0.069),
      inset 0 1px 0 rgba(255, 255, 255, 0.025),
      inset 0 0 16px rgba(82, 145, 182, 0.014),
      0 0 10px rgba(82, 145, 182, 0.025);
    pointer-events: none;
    z-index: 3;
  }

  > .ds-panel__head::before {
    opacity: var(--panel-head-image-opacity);
  }
}

.ds-panel__head {
  position: relative;
  display: flex;
  align-items: center;
  min-height: $ds-panel-head-h;
  height: $ds-panel-head-h;
  box-sizing: border-box;
  padding: 0 18px 0 16px;
  overflow: visible;
  background: var(--panel-head-background, linear-gradient(90deg, rgba(76, 124, 164, 0.48) 0%, rgba(38, 78, 116, 0.42) 42%, rgba(12, 31, 58, 0.18) 100%));
  z-index: 2;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--panel-head-image) left center / var(--panel-head-image-size, 100% 100%) no-repeat;
    opacity: var(--panel-head-image-opacity);
    filter: var(--panel-head-image-filter);
    mix-blend-mode: normal;
    pointer-events: none;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    left: 12px;
    top: 50%;
    width: 28px;
    height: 12px;
    transform: translateY(-50%);
    background: var(--panel-title-frame-image) left center / contain no-repeat;
    opacity: 0.46;
    pointer-events: none;
    z-index: 0;
  }

  border-bottom: 1px solid rgba(82, 145, 182, 0.28);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    inset 0 -1px 0 rgba(82, 145, 182, 0.1);

  > * {
    position: relative;
    z-index: 1;
  }
}

.ds-panel__head::before {
  box-shadow: inset 0 -1px 0 rgba(82, 145, 182, 0.18);
}

.ds-panel__head::after {
  filter: saturate(0.72) brightness(1.08) hue-rotate(-5deg);
}

.ds-panel__bar {
  width: 8px;
  height: 12px;
  margin-right: 10px;
  flex-shrink: 0;
  border-radius: 2px;
  background: var(--panel-title-icon-image) center / contain no-repeat;
  opacity: 0.88;
  filter: drop-shadow(0 0 3px rgba(150, 187, 213, 0.18));
}

.ds-panel__ic {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;

  svg {
    width: 16px;
    height: 16px;
  }

  &.ic-device {
    color: $ds-cyan;
    filter: drop-shadow(0 0 3px rgba(109, 193, 192, 0.12));
  }
}

.ds-panel__title-wrap {
  display: inline-flex;
  align-items: center;
  height: 100%;
}

.ds-panel__title {
  @include ds-panel-module-title(21px);
  white-space: nowrap;
}

.ds-panel__tag {
  margin-left: 12px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(174, 198, 226, 0.76);
  padding: 0 9px;
  line-height: 20px;
  border: 1px solid rgba(109, 193, 192, 0.08);
  border-radius: 999px;
  background: rgba(12, 34, 62, 0.18);
}

.ds-panel__body {
  position: relative;
  height: calc(100% - #{$ds-panel-head-h});
  padding: $ds-panel-body-pad;
  box-sizing: border-box;
  overflow: hidden;
  z-index: 2;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
  background:
      radial-gradient(circle at 22% 24%, rgba(82, 145, 182, 0.018), transparent 58%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.008) 0%, transparent 32%);
    opacity: 1;
    pointer-events: none;
    z-index: 0;
  }

  > * { position: relative; z-index: 1; }
}

.ds-panel--tier-secondary {
  background: linear-gradient(180deg, rgba(16, 36, 68, 0.94) 0%, rgba(8, 27, 54, 0.97) 100%);
  border: 1px solid rgba(82, 145, 182, 0.34);
  box-shadow:
    0 8px 16px rgba(2, 8, 16, 0.125),
    inset 0 1px 0 rgba(255, 255, 255, 0.025),
    inset 0 0 16px rgba(82, 145, 182, 0.015),
    0 0 6px rgba(82, 145, 182, 0.017);

  .ds-panel__head {
    background: linear-gradient(90deg, rgba(76, 124, 164, 0.48) 0%, rgba(38, 78, 116, 0.42) 42%, rgba(12, 31, 58, 0.16) 100%);
  }

  --panel-head-image-opacity: 0.22;
  --panel-head-image-filter: brightness(0.96) saturate(0.78) hue-rotate(-8deg);
  --panel-shell-border: rgba(82, 145, 182, 0.14);
  --panel-shell-glow: 0.01;

  .ds-panel__title {
    @include ds-panel-module-title(21px);
  }

  --panel-body-sheen: 0.006;
  --panel-body-glow: 0.006;
}

.ds-panel--tier-core {
  background:
    radial-gradient(circle at 50% 0%, rgba(82, 145, 182, 0.035), transparent 48%),
    linear-gradient(180deg, rgba(18, 44, 76, 0.96) 0%, rgba(9, 30, 58, 0.98) 100%);
  border-color: rgba(118, 163, 203, 0.4);
  box-shadow:
    0 9px 18px rgba(2, 8, 16, 0.139),
    inset 0 1px 0 rgba(255, 255, 255, 0.028),
    inset 0 0 18px rgba(82, 145, 182, 0.025),
    0 0 7px rgba(82, 145, 182, 0.022);

  .ds-panel__head {
    background: linear-gradient(90deg, rgba(82, 133, 174, 0.58) 0%, rgba(42, 82, 120, 0.5) 42%, rgba(13, 33, 62, 0.18) 100%);
  }

  --panel-head-image-opacity: 0.28;
  --panel-head-image-filter: brightness(0.98) saturate(0.78) hue-rotate(-8deg);
  --panel-shell-border: rgba(118, 163, 203, 0.2);
  --panel-shell-glow: 0.012;

  .ds-panel__title {
    @include ds-panel-module-title(21px);
    text-shadow: 0 0 6px rgba(150, 187, 213, 0.2);
  }

  --panel-body-sheen: 0.008;
  --panel-body-glow: 0.008;
}

.ds-panel--tier-tertiary {
  background: linear-gradient(180deg, rgba(15, 35, 66, 0.9) 0%, rgba(8, 27, 54, 0.95) 100%);
  border: 1px solid rgba(82, 145, 182, 0.26);
  box-shadow:
    0 10px 22px rgba(2, 8, 16, 0.097),
    inset 0 1px 0 rgba(255, 255, 255, 0.019),
    0 0 8px rgba(82, 145, 182, 0.021);

  .ds-panel__head {
    background: linear-gradient(90deg, rgba(62, 104, 144, 0.38) 0%, rgba(28, 63, 100, 0.36) 42%, rgba(12, 31, 58, 0.14) 100%);
  }

  --panel-head-image-opacity: 0.18;
  --panel-head-image-filter: brightness(0.96) saturate(0.78) hue-rotate(-8deg);
  --panel-shell-border: rgba(82, 145, 182, 0.12);
  --panel-shell-glow: 0.006;

  .ds-panel__title {
    @include ds-panel-module-title(21px);
    color: rgba(248, 251, 255, 0.98);
  }

  --panel-body-sheen: 0.008;
  --panel-body-glow: 0.012;
}

.ds-panel--highlight {
  &::before {
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.012) 0%, transparent 30%),
      radial-gradient(circle at 50% 0%, rgba(82, 145, 182, 0.026) 0%, transparent 58%);
  }

  .ds-panel__title {
    @include ds-panel-module-title(21px);
    color: rgba(248, 251, 255, 1);
  }
}

</style>
