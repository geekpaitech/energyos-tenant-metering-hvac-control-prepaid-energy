<template>
  <div class="sub-panel">
    <div class="sub-panel__head">
      <span class="sub-panel__dot" />
      <span class="sub-panel__title">{{ title }}</span>
      <span v-if="tag" class="sub-panel__tag">{{ tag }}</span>
    </div>
    <div class="sub-panel__body">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'SubPanel',
  props: {
    title: { type: String, required: true },
    tag: { type: String, default: '' }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

.sub-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 50% 0%, rgba(82, 145, 182, 0.018), transparent 58%),
    linear-gradient(180deg, rgba(16, 40, 72, 0.9) 0%, rgba(8, 27, 54, 0.96) 100%);
  border: 1px solid rgba(82, 145, 182, 0.22);
  border-radius: 8px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    inset 0 0 12px rgba(82, 145, 182, 0.024);

  &__head {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    background: linear-gradient(90deg, rgba(39, 76, 112, 0.42) 0%, rgba(16, 42, 76, 0.32) 100%);
    border-bottom: 1px solid rgba(82, 145, 182, 0.18);
    flex-shrink: 0;
  }

  &__dot {
    width: 4px;
    height: 4px;
    background: $ds-cyan-bright;
    transform: rotate(45deg);
    box-shadow: 0 0 4px rgba(109, 193, 192, 0.18);
  }

  &__title {
    font-size: 12px;
    font-weight: 600;
    color: rgba(230, 242, 255, 0.94);
  }

  &__tag {
    margin-left: auto;
    font-size: 9px;
    color: $ds-screen-muted;
    padding: 0 4px;
    border: 1px solid $ds-border-soft;
    border-radius: 999px;
  }

  &__body {
    flex: 1;
    min-height: 0;
    padding: 4px 6px 6px;
  }
}
</style>
