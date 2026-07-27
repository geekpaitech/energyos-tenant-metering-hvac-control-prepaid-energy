<template>
  <transition name="screen-loading-fade">
    <div v-if="visible" class="screen-loading" role="status" aria-live="polite" aria-label="数据加载中">
      <div class="screen-loading__grid" aria-hidden="true" />
      <div class="screen-loading__halo" aria-hidden="true" />
      <div class="screen-loading__box">
        <div class="screen-loading__ring" aria-hidden="true">
          <i class="screen-loading__ring-orbit" />
          <i class="screen-loading__ring-core" />
        </div>
        <div class="screen-loading__title">经开资管物业管理驾驶舱</div>
        <div class="screen-loading__bar" aria-hidden="true"><i /></div>
        <div class="screen-loading__text">{{ text }}</div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'ScreenLoading',
  props: {
    visible: { type: Boolean, default: false },
    text: { type: String, default: '数据加载中，请稍候…' }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/fonts.scss';
@import '../styles/design-system.scss';

.screen-loading {
  position: absolute;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 50% 38%, rgba(98, 168, 208, 0.1) 0%, transparent 58%),
    linear-gradient(180deg, rgba(5, 23, 52, 0.97) 0%, rgba(4, 15, 36, 0.98) 100%);
  overflow: hidden;

  &__grid {
    position: absolute;
    inset: 0;
    background:
      repeating-linear-gradient(0deg, rgba(109, 193, 192, 0.05) 0 1px, transparent 1px 56px),
      repeating-linear-gradient(90deg, rgba(109, 193, 192, 0.05) 0 1px, transparent 1px 56px);
    mask-image: radial-gradient(ellipse at 50% 46%, #000 0%, transparent 72%);
    pointer-events: none;
  }

  &__halo {
    position: absolute;
    left: 50%;
    top: 46%;
    width: 560px;
    height: 560px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(109, 193, 192, 0.12) 0%, rgba(98, 168, 208, 0.05) 42%, transparent 68%);
    pointer-events: none;
    animation: screen-loading-breathe 2.6s ease-in-out infinite;
  }

  &__box {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateY(-4%);
  }

  &__ring {
    position: relative;
    width: 76px;
    height: 76px;
    margin-bottom: 26px;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 1px solid rgba(109, 193, 192, 0.16);
    }
  }

  &__ring-orbit {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px solid transparent;
    border-top-color: rgba(122, 214, 212, 0.92);
    border-right-color: rgba(98, 168, 208, 0.36);
    animation: screen-loading-spin 1.1s linear infinite;
  }

  &__ring-core {
    position: absolute;
    inset: 22px;
    border-radius: 50%;
    background: radial-gradient(circle at 42% 36%, rgba(122, 214, 212, 0.5), rgba(18, 52, 86, 0.4) 72%);
    box-shadow:
      0 0 18px rgba(109, 193, 192, 0.32),
      inset 0 0 10px rgba(230, 242, 255, 0.14);
    animation: screen-loading-breathe 1.6s ease-in-out infinite;
  }

  &__title {
    font-family: $ds-font-display;
    font-size: 32px;
    font-weight: 400;
    letter-spacing: 5px;
    line-height: 1;
    color: #ffffff;
    text-shadow:
      0 0 10px rgba(230, 242, 255, 0.3),
      0 0 24px rgba(82, 145, 182, 0.24);
    @include ds-crisp-text;
  }

  &__bar {
    position: relative;
    width: 240px;
    height: 3px;
    margin: 22px 0 14px;
    border-radius: 999px;
    background: rgba(16, 44, 78, 0.72);
    box-shadow: inset 0 0 0 1px rgba(108, 142, 172, 0.16);
    overflow: hidden;

    i {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 38%;
      border-radius: 999px;
      background: linear-gradient(90deg, transparent, rgba(122, 214, 212, 0.95), rgba(230, 242, 255, 0.95));
      box-shadow: 0 0 12px rgba(109, 193, 192, 0.5);
      animation: screen-loading-slide 1.4s ease-in-out infinite;
    }
  }

  &__text {
    font-family: $ds-font-panel;
    font-size: 14px;
    letter-spacing: 2px;
    color: rgba(203, 222, 241, 0.78);
    @include ds-crisp-text;
  }
}

.screen-loading-fade-enter-active,
.screen-loading-fade-leave-active {
  transition: opacity 0.38s ease;
}
.screen-loading-fade-enter,
.screen-loading-fade-leave-to {
  opacity: 0;
}

@keyframes screen-loading-spin {
  to { transform: rotate(360deg); }
}

@keyframes screen-loading-slide {
  0% { transform: translateX(-110%); }
  100% { transform: translateX(370%); }
}

@keyframes screen-loading-breathe {
  0%, 100% { opacity: 0.65; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .screen-loading__ring-orbit,
  .screen-loading__ring-core,
  .screen-loading__halo,
  .screen-loading__bar i {
    animation: none;
  }
}
</style>
