<template>
  <article class="energy-panel" :class="variant ? `energy-panel--${variant}` : ''">
    <header class="energy-panel__header">
      <h2><slot name="title">{{ title }}</slot><span v-if="period" class="panel-period">{{ period }}</span></h2>
      <slot name="meta" />
    </header>
    <div class="energy-panel__content">
      <slot />
    </div>
  </article>
</template>

<script>
export default {
  name: 'EnergyPanel',
  props: {
    title: { type: String, required: true },
    period: { type: String, default: '' },
    variant: { type: String, default: '' }
  }
}
</script>
