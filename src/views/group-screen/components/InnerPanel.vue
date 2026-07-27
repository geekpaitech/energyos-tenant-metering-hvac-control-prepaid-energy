<template>
  <div
    class="inner-panel"
    :class="[
      { 'inner-panel--box': boxed },
      accent ? `inner-panel--${accent}` : ''
    ]"
    :style="panelStyle"
  >
    <div class="inner-panel__head" :class="{ 'inner-panel__head--img': iconSrc }">
      <i v-if="iconSrc" class="inner-panel__icon inner-panel__icon--img">
        <img :src="iconSrc" alt="" />
      </i>
      <i v-else-if="icon" class="inner-panel__icon" v-html="icons[icon]" />
      <i v-else class="inner-panel__bar" />
      <span class="inner-panel__title-wrap">
        <span class="inner-panel__title">{{ title }}</span>
        <span v-if="tag" class="inner-panel__tag-text">（{{ tag }}）</span>
      </span>
      <span class="inner-panel__extra"><slot name="extra" /></span>
    </div>
    <div class="inner-panel__body"><slot /></div>
  </div>
</template>

<script>
import { groupScreenOss } from '../image/oss'

const icons = {
  chart: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 14h12V2H2v12zm2-2h2V8H4v4zm3 0h2V5H7v7zm3 0h2V6h-2v6z"/></svg>',
  warn: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L1 15h14L8 1zm0 4l4 7H4l4-7zm-1 2v3h2V7H7zm0 4v1h2v-1H7z"/></svg>',
  rank: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 2h10v2H3V2zm0 4h4v8H3V6zm6 0h4v5H9V6z"/></svg>',
  rect: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></svg>',
  parking: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.5 2.5h9l1 3.5v6.5a1 1 0 01-1 1h-.8a1 1 0 01-1-.9V11H5.8v.6a1 1 0 01-1 .9H4a1 1 0 01-1-1V6l.5-3.5zm1.4 2L4 7.5h8l-.9-3H4.9zM5.2 9.2a.9.9 0 110 1.8.9.9 0 010-1.8zm5.6 0a.9.9 0 110 1.8.9.9 0 010-1.8z"/></svg>',
  service: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M14.5 4.8a1 1 0 00-1.4 0l-.9.9-2.2-2.2.9-.9a1 1 0 10-1.4-1.4l-.9.9L6.3 1.6a3 3 0 00-4.2 4.2l6.9 6.9a3 3 0 004.2-4.2l-.9-.9 2.2-2.2.9.9a1 1 0 001.4 0l1.2-1.2z"/></svg>'
}

export default {
  name: 'InnerPanel',
  props: {
    title: String,
    tag: { type: String, default: '' },
    icon: { type: String, default: '' },
    iconSrc: { type: String, default: '' },
    boxed: { type: Boolean, default: true },
    accent: { type: String, default: '' }
  },
  data: () => ({ icons }),
  computed: {
    panelStyle () {
      return {
        '--inner-head-image': `url(${groupScreenOss.titleStripSub})`,
        '--panel-title-icon-image': `url(${groupScreenOss.panelTitleIcon})`
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

.inner-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.inner-panel--box {
  @include ds-subcard();
  border-radius: $ds-card-radius;
  box-shadow:
    $ds-card-shadow,
    inset 0 0 0 1px rgba(109, 193, 192, 0.055);
}

.inner-panel--leaderboard {
  &::before { display: none; }
}

.inner-panel__head {
  @include ds-inner-head-bar;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--inner-head-image) left center / 100% 100% no-repeat;
    opacity: 0.14;
    filter: brightness(0.96) saturate(0.78) hue-rotate(-8deg);
    mix-blend-mode: normal;
    pointer-events: none;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  &--img {
    gap: 8px;
    padding-left: 14px;
  }
}

.inner-panel__icon {
  width: 15px;
  height: 15px;
  color: rgba(230, 242, 255, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  filter: none;

  ::v-deep svg {
    width: 16px;
    height: 16px;
  }

  &--img {
    width: 26px;
    height: 26px;
    margin-right: -2px;
    filter: none;
    animation: none;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      transform: scale(1.1);
      transform-origin: center;
      mix-blend-mode: normal;
      opacity: 0.9;
      filter: none;
    }
  }
}

.inner-panel__bar {
  width: 8px;
  height: 12px;
  border-radius: 2px;
  background: var(--panel-title-icon-image) center / contain no-repeat;
  opacity: 0.86;
  filter: drop-shadow(0 0 3px rgba(150, 187, 213, 0.16));
  flex-shrink: 0;
}

.inner-panel__title-wrap {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
}

.inner-panel__title {
  @include ds-module-subtitle(15px);
  flex-shrink: 0;
}

.inner-panel__tag-text {
  font-size: 12px;
  color: rgba(170, 198, 224, 0.72);
  font-weight: 500;
  flex-shrink: 0;
}

.inner-panel__extra {
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding-left: 8px;
}

.inner-panel__body {
  flex: 1;
  min-height: 0;
  padding: $ds-inner-body-pad;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 0%, rgba(82, 145, 182, 0.012), transparent 52%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.006) 0%, transparent 32%);
}
</style>
