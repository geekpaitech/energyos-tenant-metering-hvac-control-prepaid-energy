<template>
  <div
    ref="switcher"
    class="energy-manager-switcher"
    :class="{ 'is-open': open, 'is-loading': loading }"
    @click.stop
  >
    <button
      class="energy-manager-switcher__trigger"
      type="button"
      :disabled="loading"
      :aria-expanded="String(open)"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span class="energy-manager-switcher__icon"><energy-icon name="building" /></span>
      <span class="energy-manager-switcher__copy">
        <small>{{ activeLabel }}</small>
        <strong :title="displayName">{{ displayName }}</strong>
      </span>
      <span v-if="loading" class="energy-manager-switcher__loading" aria-label="数据加载中" />
      <span v-else class="energy-manager-switcher__caret" aria-hidden="true" />
    </button>

    <transition name="energy-manager-menu">
      <div v-if="open" class="energy-manager-switcher__menu" role="listbox" :aria-label="menuAriaLabel">
        <div class="energy-manager-switcher__menu-title">{{ menuTitle }}</div>
        <div class="energy-manager-switcher__options">
          <button
            class="energy-manager-switcher__option"
            :class="{ 'is-current': isGroup }"
            type="button"
            role="option"
            :aria-selected="String(isGroup)"
            @click="selectGroup"
          >
            <span class="energy-manager-switcher__dot" />
            <span class="energy-manager-switcher__option-copy">
              <b>集团：{{ groupFallback }}</b>
            </span>
            <span v-if="isGroup" class="energy-manager-switcher__check">✓</span>
          </button>
          <button
            v-for="manager in managers"
            :key="manager.managerId"
            class="energy-manager-switcher__option"
            :class="{ 'is-current': isCurrent(manager) }"
            type="button"
            role="option"
            :aria-selected="String(isCurrent(manager))"
            @click="select(manager)"
          >
            <span class="energy-manager-switcher__dot" />
            <span class="energy-manager-switcher__option-copy">
              <b :title="managerName(manager)">{{ managerName(manager) }}</b>
              <small v-if="manager.address" :title="manager.address">{{ manager.address }}</small>
            </span>
            <span v-if="isCurrent(manager)" class="energy-manager-switcher__check">✓</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import EnergyIcon from './EnergyIcon.vue'

export default {
  name: 'EnergyManagerSwitcher',
  components: { EnergyIcon },
  props: {
    managers: { type: Array, default: () => [] },
    currentManagerId: { type: [String, Number], default: null },
    loading: { type: Boolean, default: false },
    /** 触发按钮小标签：默认 "项目"；显示集团模式时传 "集团" */
    label: { type: String, default: '项目' },
    /** 显示集团文案，当没有选择具体项目（未匹配 managers）时显示 */
    groupFallback: { type: String, default: '经开资管' },
    /** 下拉菜单标题 */
    menuTitle: { type: String, default: '切换项目' },
    /** 下拉菜单 aria-label */
    menuAriaLabel: { type: String, default: '选择项目' }
  },
  data () {
    return { open: false }
  },
  computed: {
    currentManager () {
      return this.managers.find(manager => String(manager.managerId) === String(this.currentManagerId)) || null
    },
    /** 是否处于"集团"展示模式（未匹配管理方或显式传入 groupFallback） */
    isGroup () {
      return !this.currentManager
    },
    displayName () {
      return this.currentManager ? this.managerName(this.currentManager) : this.groupFallback
    },
    /** 集团模式下小标签显示"集团"，管理方模式下显示 prop.label */
    activeLabel () {
      return this.isGroup ? '集团' : this.label
    },
    canSwitch () {
      return this.managers.length > 0
    }
  },
  watch: {
    currentManagerId () {
      this.open = false
    },
    loading (value) {
      if (value) this.open = false
    }
  },
  mounted () {
    document.addEventListener('click', this.close)
    document.addEventListener('keydown', this.onKeydown)
  },
  beforeDestroy () {
    document.removeEventListener('click', this.close)
    document.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    managerName (manager) {
      return manager.managerName || manager.name || '未命名项目'
    },
    isCurrent (manager) {
      return String(manager.managerId) === String(this.currentManagerId)
    },
    toggle () {
      if (this.loading) return
      this.open = !this.open
    },
    close () {
      this.open = false
    },
    onKeydown (event) {
      if (event.key === 'Escape') this.close()
    },
    selectGroup () {
      if (this.isGroup) {
        this.close()
        return
      }
      this.$emit('change', null)
      this.close()
    },
    select (manager) {
      if (this.isCurrent(manager)) {
        this.close()
        return
      }
      this.$emit('change', manager.managerId)
      this.close()
    }
  }
}
</script>
