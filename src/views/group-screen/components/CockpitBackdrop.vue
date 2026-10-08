<template>
  <div class="cockpit-bg" aria-hidden="true">
    <div class="cockpit-bg__image" :style="bgImageStyle" />
    <div class="cockpit-bg__shade"></div>
    <div class="cockpit-bg__core-light"></div>
    <div class="cockpit-bg__deck"></div>
    <div class="cockpit-bg__grid"></div>
    <div class="cockpit-bg__corners">
      <i class="cockpit-bg__corner cockpit-bg__corner--tl"></i>
      <i class="cockpit-bg__corner cockpit-bg__corner--tr"></i>
      <i class="cockpit-bg__corner cockpit-bg__corner--bl"></i>
      <i class="cockpit-bg__corner cockpit-bg__corner--br"></i>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CockpitBackdrop',
  computed: {
    bgImageStyle () {
      return {
        backgroundImage: 'url(https://wu-cloud.oss-cn-shanghai.aliyuncs.com/web-file/cock.png)'
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

.cockpit-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;

  &__image {
    position: absolute;
    inset: 0;
    background-position: center center;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    filter: saturate(0.76) brightness(0.96) hue-rotate(-7deg);
    opacity: 0.9;
  }

  &__shade {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 50% 16%, rgba(98, 168, 208, 0.08) 0%, rgba(98, 168, 208, 0.035) 36%, transparent 62%),
      radial-gradient(ellipse at 50% 78%, rgba(82, 145, 182, 0.08) 0%, rgba(82, 145, 182, 0.035) 30%, transparent 58%),
      linear-gradient(180deg, rgba(5, 23, 52, 0.08) 0%, rgba(5, 23, 52, 0.16) 100%);
    pointer-events: none;
  }

  &__core-light {
    position: absolute;
    left: 24%;
    right: 24%;
    top: 205px;
    bottom: 112px;
    background:
      radial-gradient(ellipse at 50% 45%, rgba(160, 205, 232, 0.08) 0%, rgba(98, 168, 208, 0.04) 34%, transparent 68%),
      radial-gradient(ellipse at 50% 92%, rgba(82, 145, 182, 0.09) 0%, rgba(82, 145, 182, 0.04) 24%, transparent 62%);
    opacity: 0.72;
    mix-blend-mode: screen;
  }

  &__deck {
    position: absolute;
    left: 18%;
    right: 18%;
    bottom: 0;
    height: 255px;
    background:
      radial-gradient(ellipse at 50% 66%, rgba(82, 145, 182, 0.12) 0%, rgba(82, 145, 182, 0.05) 26%, transparent 58%),
      linear-gradient(180deg, transparent 0%, rgba(9, 42, 76, 0.1) 74%, rgba(82, 145, 182, 0.04) 100%);
    opacity: 0.62;
    mix-blend-mode: screen;
  }

  &__grid {
    position: absolute;
    inset: 0;
    opacity: 0.055;
    background-image:
      linear-gradient(180deg, rgba(109, 193, 192, 0.08) 0, rgba(109, 193, 192, 0.08) 1px, transparent 1px, transparent 36px),
      linear-gradient(90deg, rgba(98, 168, 208, 0.06) 0, rgba(98, 168, 208, 0.06) 1px, transparent 1px, transparent 36px);
    background-size: 36px 36px, 36px 36px;
    pointer-events: none;
  }

  &__corners {
    position: absolute;
    inset: 14px;
    z-index: 1;
  }

  &__corner {
    position: absolute;
    width: 42px;
    height: 42px;
    border-color: rgba(109, 193, 192, 0.26);
    border-style: solid;
    border-width: 0;

    &--tl { top: 0; left: 0; border-top-width: 1px; border-left-width: 1px; }
    &--tr { top: 0; right: 0; border-top-width: 1px; border-right-width: 1px; }
    &--bl { bottom: 0; left: 0; border-bottom-width: 1px; border-left-width: 1px; }
    &--br { bottom: 0; right: 0; border-bottom-width: 1px; border-right-width: 1px; }
  }
}
</style>
