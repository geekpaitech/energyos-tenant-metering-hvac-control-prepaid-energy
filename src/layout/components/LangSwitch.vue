<template>
  <div
    class="lang-switch openapi-container"
    role="button"
    tabindex="0"
    :title="$t('layout.langSwitchTitle')"
    @click="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
  >
    <span class="lang-switch-inner" :class="{ 'is-en': isEn }">
      <span class="lang-globe" aria-hidden="true">🌐</span>
      <span class="lang-pair">
        <span class="lang-cn" :class="{ muted: isEn }">{{ $t('layout.langShortZh') }}</span>
        <span class="lang-slash">/</span>
        <span class="lang-en" :class="{ muted: !isEn }">{{ $t('layout.langShortEn') }}</span>
      </span>
    </span>
  </div>
</template>

<script>
import { setLocale } from '@/i18n'

export default {
  name: 'LangSwitch',
  computed: {
    isEn () {
      return this.$i18n.locale === 'en'
    }
  },
  methods: {
    toggle () {
      const next = this.isEn ? 'zh-CN' : 'en'
      setLocale(next)
    }
  }
}
</script>

<style lang="scss" scoped>
.lang-switch {
  cursor: pointer;
  user-select: none;
}
.lang-switch-inner {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 13px;
  color: #606266;
  border: 1px solid transparent;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  &:hover {
    color: #409eff;
    border-color: #dcdfe6;
    background: #f5f7fa;
  }
}
.lang-globe {
  font-size: 15px;
  line-height: 1;
}
.lang-pair {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.lang-slash {
  font-weight: 400;
  color: #c0c4cc;
  font-size: 11px;
  margin: 0 1px;
}
.lang-cn,
.lang-en {
  min-width: 1.2em;
  text-align: center;
  transition: color 0.15s, opacity 0.15s;
}
.lang-cn:not(.muted),
.lang-en:not(.muted) {
  color: #409eff;
}
.muted {
  color: #909399;
  font-weight: 500;
  opacity: 0.75;
}
</style>
