<template>
  <div class="energy-period-switcher" role="radiogroup" aria-label="时间粒度">
    <button
      v-for="item in options"
      :key="item.value"
      type="button"
      class="energy-period-switcher__btn"
      :class="{ 'is-active': item.value === value }"
      role="radio"
      :aria-checked="String(item.value === value)"
      @click="select(item.value)"
    >{{ item.label }}</button>
  </div>
</template>

<script>
/**
 * 右上角时间粒度切换器：日 / 月 / 年
 * Props:
 *  - value: 当前激活项（'day' | 'month' | 'year'）
 *  - options: 自定义选项，默认 ['day','month','year'] -> ['日','月','年']
 */
export default {
  name: 'EnergyPeriodSwitcher',
  props: {
    value: { type: String, default: 'day' },
    options: {
      type: Array,
      default: () => [
        { value: 'day', label: '日' },
        { value: 'month', label: '月' },
        { value: 'year', label: '年' }
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
