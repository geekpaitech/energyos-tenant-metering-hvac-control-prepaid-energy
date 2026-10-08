<template>
  <div class="energy-business-switcher" role="radiogroup" aria-label="业态">
    <span class="energy-business-switcher__label">业态</span>
    <div class="energy-business-switcher__group">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="energy-business-switcher__btn"
        :class="{ 'is-active': option.value === value }"
        role="radio"
        :aria-checked="String(option.value === value)"
        @click="select(option.value)"
      >{{ option.label }}</button>
    </div>
  </div>
</template>

<script>
/**
 * 业态按钮组（segmented control）。
 * 默认选项：全部 / 产业园 / 商办 / 公寓
 *
 * Props:
 *  - value: 当前选中的业态 value
 *  - options: [{ value, label }]
 *
 * Events:
 *  - change(value): 选中某个业态时触发（v-model 也支持）
 */
export default {
  name: 'EnergyBusinessFormatSwitcher',
  props: {
    value: { type: String, default: 'all' },
    options: {
      type: Array,
      default: () => [
        { value: 'all', label: '全部' },
        { value: 'industrial', label: '产业园' },
        { value: 'office', label: '商办' },
        { value: 'apartment', label: '公寓' }
      ]
    }
  },
  methods: {
    select (value) {
      if (value === this.value) return
      this.$emit('change', value)
      this.$emit('input', value)
    }
  }
}
</script>
