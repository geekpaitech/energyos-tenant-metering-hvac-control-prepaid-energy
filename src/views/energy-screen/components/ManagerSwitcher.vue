<template>
  <div
    ref="switcher"
    class="energy-manager-switcher"
    :class="{ 'is-open': open, 'is-loading': loading, 'is-disabled': !canSwitch }"
    @click.stop
  >
    <button
      class="energy-manager-switcher__trigger"
      type="button"
      :disabled="!canSwitch || loading"
      :aria-expanded="String(open)"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span class="energy-manager-switcher__icon"><energy-icon name="building" /></span>
      <span class="energy-manager-switcher__copy">
        <small>管理方</small>
        <strong :title="currentName">{{ currentName }}</strong>
      </span>
      <span v-if="loading" class="energy-manager-switcher__loading" aria-label="数据加载中" />
      <span v-else-if="canSwitch" class="energy-manager-switcher__caret" aria-hidden="true" />
    </button>

    <transition name="energy-manager-menu">
      <div v-if="open" class="energy-manager-switcher__menu" role="listbox" aria-label="选择管理方">
        <div class="energy-manager-switcher__menu-title">切换管理方</div>
        <div class="energy-manager-switcher__options">
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
    loading: { type: Boolean, default: false }
  },
  data () {
    return { open: false }
  },
  computed: {
    currentManager () {
      return this.managers.find(manager => String(manager.managerId) === String(this.currentManagerId)) || null
    },
    currentName () {
      return this.currentManager ? this.managerName(this.currentManager) : '未选择管理方'
    },
    canSwitch () {
      return this.managers.length > 1
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
      return manager.managerName || manager.name || '未命名管理方'
    },
    isCurrent (manager) {
      return String(manager.managerId) === String(this.currentManagerId)
    },
    toggle () {
      if (!this.canSwitch || this.loading) return
      this.open = !this.open
    },
    close () {
      this.open = false
    },
    onKeydown (event) {
      if (event.key === 'Escape') this.close()
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
