<template>
  <transition name="energy-detail-fade">
    <section
      v-if="visible"
      class="energy-detail-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="energy-detail-title"
      @click.self="$emit('close')"
    >
      <div class="energy-detail-panel">
        <header class="energy-detail-head">
          <div class="energy-detail-head__title">
            <span class="energy-detail-head__icon" aria-hidden="true">
              <i class="el-icon-data-analysis" />
            </span>
            <div>
              <h2 id="energy-detail-title">项目用能明细汇总</h2>
              <p>四个管理方独立取数，点击项目或组成项可进入业务报表溯源</p>
            </div>
          </div>

          <div class="energy-detail-head__actions">
            <div class="energy-resource-tabs" role="tablist" aria-label="能源类型">
              <button
                v-for="item in resourceOptions"
                :key="item.value"
                type="button"
                role="tab"
                :aria-selected="activeResource === item.value ? 'true' : 'false'"
                :class="{ 'is-active': activeResource === item.value }"
                @click="changeResource(item.value)"
              >
                <i :class="item.icon" aria-hidden="true" />
                {{ item.label }}
              </button>
            </div>
            <button type="button" class="energy-detail-close" aria-label="关闭用能明细" @click="$emit('close')">
              <i class="el-icon-close" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div class="energy-detail-filter">
          <div class="energy-detail-filter__item">
            <span>统计周期</span>
            <strong>{{ activeTime }}</strong>
          </div>
          <div class="energy-detail-filter__item energy-detail-filter__item--wide">
            <span>统计区间</span>
            <strong>{{ rangeText }}</strong>
          </div>
          <div class="energy-detail-filter__formula">
            <i class="el-icon-info" aria-hidden="true" />
            {{ resourceLabel }}总量 = 租户{{ resourceShortLabel }} + 公区{{ resourceShortLabel }}
          </div>
        </div>

        <div class="energy-detail-body" :aria-busy="loading ? 'true' : 'false'">
          <div v-if="isApartmentScope && !loading" class="energy-detail-empty">当前业态暂无项目用能明细数据</div>
          <template v-else>
          <div class="energy-project-grid">
            <article
              v-for="project in projects"
              :key="project.managerId"
              class="energy-project-card"
              :class="[
                `energy-project-card--${project.tone}`,
                { 'is-unavailable': !project.available }
              ]"
            >
              <header class="energy-project-card__head">
                <span class="energy-project-card__icon" aria-hidden="true">
                  <i :class="project.icon" />
                </span>
                <div>
                  <small>管理方</small>
                  <b :title="project.name">{{ project.name }}</b>
                </div>
              </header>

              <button
                type="button"
                class="energy-project-main"
                :disabled="loading || !project.available"
                :aria-label="`查看${project.name}${resourceLabel}报表`"
                @click="drilldown(project, null)"
              >
                <span>{{ projectTotalLabel }}</span>
                <div>
                  <strong>{{ formatValue(project.total) }}</strong>
                  <em>{{ resourceUnit }}</em>
                </div>
              <small>查看明细 <i class="el-icon-right" aria-hidden="true" /></small>
              </button>

              <div class="energy-project-split">
                <button
                  type="button"
                  :class="{ 'is-focused': focusTenantType === 0 }"
                  :disabled="loading || !project.available"
                  @click="drilldown(project, 0)"
              >
                <span>租户{{ resourceShortLabel }}（{{ resourceUnit }}）</span>
                <b>{{ formatValue(project.tenant) }}</b>
              </button>
                <span class="energy-project-split__operator">+</span>
                <button
                  type="button"
                  :class="{ 'is-focused': focusTenantType === 1 }"
                  :disabled="loading || !project.available"
                  @click="drilldown(project, 1)"
              >
                <span>公区{{ resourceShortLabel }}（{{ resourceUnit }}）</span>
                <b>{{ formatValue(project.publicArea) }}</b>
              </button>
              </div>

              <p v-if="!loading && !project.available" class="energy-project-card__error">
                {{ project.error || '数据暂不可用' }}
              </p>
            </article>
          </div>

          <footer class="energy-group-total" :class="{ 'is-incomplete': !complete && !loading }">
            <div class="energy-group-total__main">
              <span>集团{{ projectTotalLabel }}</span>
              <div>
                <strong>{{ loading ? '--' : formatValue(groupTotal) }}</strong>
                <i>{{ resourceUnit }}</i>
              </div>
            </div>
            <span class="energy-group-total__equals">=</span>
            <div class="energy-group-total__formula">
              <template v-for="(project, index) in projects">
                <span v-if="index" :key="`${project.managerId}-plus`" class="energy-group-total__plus">+</span>
                <button
                  :key="project.managerId"
                  type="button"
                  :disabled="loading || !project.available"
                  :class="`is-${project.tone}`"
                @click="drilldown(project, null)"
              >
                  <span class="energy-group-total__value">
                    <b>{{ formatValue(project.total) }}</b>
                    <i>{{ resourceUnit }}</i>
                  </span>
                  <small>{{ project.name }}</small>
                </button>
              </template>
            </div>
            <p v-if="!loading && !complete">存在项目数据异常，集团合计暂不计算，避免将异常数据当作 0。</p>
          </footer>

          </template>

          <transition name="energy-loading-fade">
            <div v-if="loading" class="energy-detail-loading" role="status" aria-live="polite">
              <div class="energy-detail-loading__content">
                <i class="el-icon-loading" aria-hidden="true" />
                <strong>正在汇总{{ projectCountText }}项目用能数据</strong>
                <span>{{ rangeText }}</span>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </section>
  </transition>
</template>

<script>
import {
  GROUP_ENERGY_MANAGERS,
  getGroupEnergyDateRange,
  queryGroupEnergyOverview
} from '@/api/groupEnergyOverview'
import { getManagersByScope } from '../utils/screenQuery'

function emptyProjects (scope) {
  const managers = scope ? getManagersByScope(scope) : GROUP_ENERGY_MANAGERS
  return managers.map(m => ({
    ...m,
    tenant: null,
    publicArea: null,
    total: null,
    available: true
  }))
}

export default {
  name: 'EnergyDrilldownPanel',
  props: {
    visible: { type: Boolean, default: false },
    activeTime: { type: String, default: '本月' },
    activeScope: { type: String, default: '全部' },
    initialResource: { type: String, default: 'electricity' },
    initialTenantType: { type: Number, default: null }
  },
  data () {
    return {
      resourceOptions: [
        { value: 'electricity', label: '用电', icon: 'el-icon-lightning' },
        { value: 'water', label: '用水', icon: 'el-icon-water-cup' }
      ],
      activeResource: this.initialResource,
      focusTenantType: this.initialTenantType,
      projects: emptyProjects(this.activeScope),
      groupTotal: null,
      complete: true,
      loading: false,
      requestId: 0,
      range: getGroupEnergyDateRange(this.activeTime)
    }
  },
  computed: {
    isApartmentScope () {
      return this.activeScope === '公寓'
    },
    projectCountText () {
      const count = getManagersByScope(this.activeScope).length
      const map = { 1: '一个', 2: '两个', 3: '三个', 4: '四个' }
      return map[count] || `${count}个`
    },
    resourceLabel () {
      return this.activeResource === 'water' ? '用水' : '用电'
    },
    resourceShortLabel () {
      return this.activeResource === 'water' ? '用水' : '用电'
    },
    projectTotalLabel () {
      return `总${this.resourceLabel}`
    },
    resourceUnit () {
      return this.activeResource === 'water' ? 'm³' : 'kWh'
    },
    rangeText () {
      return `${this.range.startDate} 至 ${this.range.endDate}`
    }
  },
  watch: {
    visible (value) {
      if (!value) return
      this.activeResource = this.initialResource === 'water' ? 'water' : 'electricity'
      this.focusTenantType = this.initialTenantType
      this.fetchData()
    },
    activeTime () {
      if (this.visible) this.fetchData()
    },
    initialResource (value) {
      if (!this.visible) return
      const resource = value === 'water' ? 'water' : 'electricity'
      if (resource !== this.activeResource) {
        this.activeResource = resource
        this.fetchData()
      }
    },
    initialTenantType (value) {
      if (this.visible) {
        this.focusTenantType = value === 0 || value === 1 ? value : null
      }
    }
  },
  mounted () {
    window.addEventListener('keydown', this.handleKeydown)
  },
  beforeDestroy () {
    window.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    handleKeydown (event) {
      if (this.visible && event.key === 'Escape') this.$emit('close')
    },
    formatValue (value) {
      if (value == null || value === '' || !Number.isFinite(Number(value))) return '--'
      return Number(value).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    },
    changeResource (resource) {
      if (resource === this.activeResource) return
      this.activeResource = resource
      this.focusTenantType = null
      this.fetchData()
    },
    async fetchData () {
      const requestId = ++this.requestId
      this.loading = true
      this.range = getGroupEnergyDateRange(this.activeTime)
      this.projects = emptyProjects(this.activeScope)
      this.groupTotal = null
      this.complete = true

      // 公寓业态：无项目，不发起请求
      if (this.isApartmentScope) {
        this.loading = false
        return
      }

      try {
        const result = await queryGroupEnergyOverview({
          period: this.activeTime,
          resource: this.activeResource
        })
        if (requestId !== this.requestId) return
        // 按业态过滤项目
        const scopeManagerIds = new Set(
          getManagersByScope(this.activeScope).map(m => m.managerId)
        )
        const filteredProjects = (result.projects || []).filter(
          p => scopeManagerIds.has(p.managerId)
        )
        this.range = result.range
        this.projects = filteredProjects
        // 集团合计基于过滤后的项目重新计算
        this.groupTotal = filteredProjects.reduce((sum, p) => {
          const v = Number(p.total)
          return sum + (Number.isFinite(v) ? v : 0)
        }, 0)
        this.complete = filteredProjects.length > 0 && filteredProjects.every(p => p.available !== false)
      } catch (error) {
        if (requestId !== this.requestId) return
        this.range = getGroupEnergyDateRange(this.activeTime)
        this.projects = emptyProjects(this.activeScope).map(project => ({
          ...project,
          available: false,
          error: '数据获取失败'
        }))
        this.complete = false
      } finally {
        if (requestId === this.requestId) this.loading = false
      }
    },
    resolveManager (project) {
      const managerList = this.$store.state.manager.managerList || []
      return managerList.find(
        manager => String(manager.managerId) === String(project.managerId)
      ) || {
        managerId: project.managerId,
        managerName: project.name,
        name: project.name
      }
    },
    drilldown (project, tenantType) {
      if (this.loading || !project.available) return
      const manager = this.resolveManager(project)
      this.$store.commit('manager/SET_CURRENT_MANAGER_ID', manager.managerId)
      this.$store.commit('manager/SET_CURRENT_MANAGER', manager)

      const query = {
        managerId: String(project.managerId),
        startDate: this.range.startDate,
        endDate: this.range.endDate,
        source: 'group-property-screen'
      }
      if (tenantType === 0 || tenantType === 1) {
        query.tenantType = String(tenantType)
      }

      const route = this.$router.resolve({
        path: this.activeResource === 'water'
          ? '/energy/water-report'
          : '/energy/electricity-report',
        query
      })
      const reportWindow = window.open(route.href, 'group-energy-report')
      if (reportWindow) {
        reportWindow.focus()
      } else if (this.$message) {
        this.$message.warning('浏览器已拦截报表窗口，请允许弹出窗口后重试')
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

.energy-detail-layer {
  position: absolute !important;
  z-index: 80 !important;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px 170px 80px;
  box-sizing: border-box;
  background: rgba(2, 11, 27, 0.68);
  backdrop-filter: blur(2px) saturate(0.9);
}

.energy-detail-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 1160px;
  height: 680px;
  min-width: 0;
  min-height: 0;
  padding: 20px 22px;
  border: 1px solid rgba(83, 181, 226, 0.82);
  border-radius: 12px;
  background:
    radial-gradient(circle at 50% 0%, rgba(39, 126, 182, 0.2), transparent 44%),
    linear-gradient(180deg, #0b2a4a 0%, #071b35 100%);
  box-shadow:
    0 26px 76px rgba(0, 5, 18, 0.64),
    0 0 0 5px rgba(19, 95, 148, 0.22),
    inset 0 1px 0 rgba(205, 239, 255, 0.12);
  overflow: hidden;
  box-sizing: border-box;
}

.energy-detail-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 58px;
  padding: 0 0 16px;
  border-bottom: 1px solid rgba(101, 190, 229, 0.34);

  &__title {
    display: flex;
    align-items: center;
    gap: 13px;
    min-width: 0;
  }

  &__icon {
    display: grid;
    place-items: center;
    flex: 0 0 42px;
    width: 42px;
    height: 42px;
    border: 1px solid rgba(104, 202, 234, 0.58);
    border-radius: 9px;
    background: #0d385a;
    color: #8ee5f2;
    box-shadow: inset 0 0 18px rgba(66, 184, 222, 0.12);
    font-size: 23px;
  }

  h2 {
    margin: 0;
    color: #f4fbff;
    font-family: $ds-font-title;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: 1px;
    text-shadow: 0 0 14px rgba(106, 208, 238, 0.16);
  }

  p {
    margin: 5px 0 0;
    color: rgba(211, 231, 244, 0.76);
    font-size: 12px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.energy-resource-tabs {
  display: flex;
  height: 36px;
  padding: 3px;
  border: 1px solid rgba(78, 157, 205, 0.46);
  border-radius: 7px;
  background: #071f3a;
  box-sizing: border-box;

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 78px;
    padding: 0 17px;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: rgba(220, 237, 248, 0.84);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;

    &:hover,
    &:focus-visible {
      color: #fff;
      outline: none;
    }

    &.is-active {
      background: linear-gradient(180deg, #2e7fac 0%, #205f8c 100%);
      color: #fff;
      box-shadow: 0 2px 10px rgba(15, 123, 180, 0.28);
    }
  }
}

.energy-detail-close {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid rgba(78, 157, 205, 0.46);
  border-radius: 7px;
  background: #071f3a;
  color: rgba(235, 244, 250, 0.88);
  font-size: 17px;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: rgba(111, 210, 239, 0.78);
    background: #123d5f;
    color: #fff;
    outline: none;
  }
}

.energy-detail-filter {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
  margin: 12px 0 14px;
  padding: 7px 11px;
  border: 1px solid rgba(72, 157, 203, 0.42);
  border-radius: 8px;
  background: rgba(7, 31, 58, 0.92);
  box-shadow: inset 0 1px 0 rgba(180, 229, 250, 0.04);
  box-sizing: border-box;

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 34px;
    padding: 0 12px;
    border-right: 1px solid rgba(91, 168, 211, 0.24);

    &--wide {
      min-width: 280px;
    }

    span {
      color: rgba(201, 225, 240, 0.76);
      font-size: 12px;
    }

    strong {
      color: #f2f9ff;
      font-size: 14px;
      font-weight: 600;
    }
  }

  &__formula {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-left: auto;
    padding-right: 6px;
    color: #9bd8e8;
    font-size: 13px;
    white-space: nowrap;
  }
}

.energy-detail-body {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.energy-project-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 13px;
}

.energy-project-card {
  --project-color: #5fc6f2;
  --project-rgb: 95, 198, 242;
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 15px;
  border: 1px solid rgba(var(--project-rgb), 0.48);
  border-top-width: 3px;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(14, 48, 81, 0.98), rgba(7, 29, 56, 0.99));
  box-shadow:
    0 10px 24px rgba(0, 9, 24, 0.32),
    inset 0 1px 0 rgba(193, 235, 255, 0.06);
  box-sizing: border-box;
  overflow: hidden;

  &--green {
    --project-color: #55d3ac;
    --project-rgb: 85, 211, 172;
  }

  &--gold {
    --project-color: #f0b64b;
    --project-rgb: 240, 182, 75;
  }

  &--steel {
    --project-color: #9bc9dc;
    --project-rgb: 155, 201, 220;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;

    > div {
      min-width: 0;
    }

    small,
    b {
      display: block;
    }

    small {
      margin-bottom: 3px;
      color: rgba(204, 226, 240, 0.72);
      font-size: 10px;
      letter-spacing: 1px;
    }

    b {
      color: #f4faff;
      font-size: 16px;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &__icon {
    display: grid;
    place-items: center;
    flex: 0 0 38px;
    width: 38px;
    height: 38px;
    border: 1px solid rgba(var(--project-rgb), 0.5);
    border-radius: 50%;
    background: rgba(var(--project-rgb), 0.14);
    box-shadow: inset 0 0 14px rgba(var(--project-rgb), 0.1);
    color: var(--project-color);
    font-size: 20px;
  }

  &.is-unavailable {
    filter: saturate(0.5);
  }
}

.energy-project-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  flex: 1;
  min-height: 112px;
  margin: 13px 0 11px;
  padding: 12px 13px;
  border: 1px solid rgba(var(--project-rgb), 0.26);
  border-radius: 8px;
  background: linear-gradient(180deg, #0b2b4b 0%, #071f3b 100%);
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    border-color: rgba(var(--project-rgb), 0.65);
    background: #103a5b;
    box-shadow: inset 0 0 20px rgba(var(--project-rgb), 0.06);
    outline: none;
  }

  > span {
    margin-top: auto;
    color: rgba(214, 233, 244, 0.82);
    font-size: 12px;
  }

  > div {
    display: flex;
    align-items: baseline;
    gap: 5px;
    max-width: 100%;
    margin-top: 8px;
  }

  strong {
    max-width: 100%;
    color: var(--project-color);
    font-size: 27px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: 0.2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  em {
    color: rgba(220, 236, 246, 0.8);
    font-size: 11px;
    font-style: normal;
  }

  small {
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    gap: 4px;
    min-height: 27px;
    margin-top: auto;
    padding-top: 9px;
    border-top: 1px solid rgba(var(--project-rgb), 0.18);
    color: rgba(var(--project-rgb), 0.96);
    font-size: 11px;
  }
}

.energy-project-split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 12px minmax(0, 1fr);
  align-items: center;
  gap: 4px;

  button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    min-width: 0;
    height: 59px;
    padding: 8px 9px;
    border: 1px solid rgba(89, 158, 202, 0.25);
    border-radius: 7px;
    background: #092744;
    color: inherit;
    text-align: left;
    cursor: pointer;

    &:hover:not(:disabled),
    &:focus-visible:not(:disabled),
    &.is-focused {
      border-color: rgba(var(--project-rgb), 0.58);
      background: rgba(var(--project-rgb), 0.12);
      outline: none;
    }

    span {
      color: rgba(205, 226, 240, 0.78);
      font-size: 10px;
    }

    b {
      max-width: 100%;
      margin-top: 5px;
      color: #f2f8fd;
      font-size: 13px;
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &__operator {
    color: rgba(183, 217, 237, 0.68);
    font-size: 16px;
    text-align: center;
  }
}

.energy-project-card__error {
  position: absolute;
  z-index: 3;
  left: 15px;
  right: 15px;
  bottom: 78px;
  margin: 0;
  padding: 7px;
  border: 1px solid rgba(205, 111, 111, 0.34);
  border-radius: 6px;
  background: #40212e;
  color: #f1b3b3;
  font-size: 11px;
  text-align: center;
}

.energy-group-total {
  position: relative;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 220px 30px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 91px;
  margin-top: 13px;
  padding: 11px 15px;
  border: 1px solid rgba(74, 171, 216, 0.52);
  border-radius: 9px;
  background: linear-gradient(180deg, #0d3152 0%, #071f3c 100%);
  box-shadow: inset 0 1px 0 rgba(171, 226, 249, 0.05);
  box-sizing: border-box;

  &__main {
    span {
      display: block;
      margin-bottom: 5px;
      color: rgba(220, 236, 246, 0.92);
      font-size: 14px;
      font-weight: 600;
    }

    > div {
      display: flex;
      align-items: baseline;
      gap: 5px;
    }

    strong {
      color: #69c7ed;
      font-size: 28px;
      line-height: 1;
    }

    i {
      color: rgba(198, 218, 233, 0.72);
      font-size: 11px;
      font-style: normal;
    }
  }

  &__equals {
    color: #72c4e7;
    font-size: 26px;
    text-align: center;
  }

  &__formula {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 13px minmax(0, 1fr) 13px minmax(0, 1fr) 13px minmax(0, 1fr);
    align-items: center;
    gap: 4px;

    button {
      min-width: 0;
      height: 54px;
      padding: 6px 7px;
      border: 1px solid rgba(101, 167, 213, 0.35);
      border-radius: 6px;
      background: rgba(101, 167, 213, 0.08);
        color: #5fc6f2;
      cursor: pointer;

      &.is-green {
        border-color: rgba(85, 211, 172, 0.35);
        background: rgba(85, 211, 172, 0.08);
        color: #55d3ac;
      }

      &.is-gold {
        border-color: rgba(240, 182, 75, 0.35);
        background: rgba(240, 182, 75, 0.08);
        color: #f0b64b;
      }

      &.is-steel {
        border-color: rgba(155, 201, 220, 0.35);
        background: rgba(155, 201, 220, 0.08);
        color: #9bc9dc;
      }

      &:hover:not(:disabled),
      &:focus-visible:not(:disabled) {
        border-color: currentColor;
        outline: none;
      }

      b,
      small {
        display: block;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      b {
        font-size: 15px;
      }

      small {
        margin-top: 5px;
        color: rgba(211, 230, 242, 0.74);
        font-size: 9px;
      }
    }
  }

  &__value {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 3px;
    max-width: 100%;

    b {
      min-width: 0;
    }

    i {
      flex-shrink: 0;
      color: rgba(202, 226, 240, 0.68);
      font-size: 8px;
      font-style: normal;
    }
  }

  &__plus {
    color: rgba(188, 220, 238, 0.7);
    font-size: 18px;
    text-align: center;
  }

  > p {
    position: absolute;
    left: 15px;
    bottom: -17px;
    margin: 0;
    color: #efb1b1;
    font-size: 10px;
  }

  &.is-incomplete .energy-group-total__main strong {
    color: rgba(177, 202, 223, 0.65);
  }
}

.energy-detail-loading {
  position: absolute;
  z-index: 10;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgba(3, 20, 39, 0.86);
  backdrop-filter: blur(2px);

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 250px;
    padding: 26px 34px;
    border: 1px solid rgba(82, 181, 222, 0.56);
    border-radius: 10px;
    background: linear-gradient(180deg, #0e3859 0%, #082745 100%);
    box-shadow:
      0 16px 42px rgba(0, 6, 20, 0.48),
      inset 0 1px 0 rgba(197, 237, 255, 0.08);

    > i {
      color: #79d7ec;
      font-size: 32px;
    }

    strong {
      margin-top: 13px;
      color: #f4faff;
      font-size: 15px;
      font-weight: 600;
    }

    span {
      margin-top: 7px;
      color: rgba(204, 228, 241, 0.72);
      font-size: 11px;
    }
  }
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.56;
}

.energy-detail-fade-enter-active,
.energy-detail-fade-leave-active,
.energy-loading-fade-enter-active,
.energy-loading-fade-leave-active {
  transition: opacity 0.18s ease;
}

.energy-detail-fade-enter,
.energy-detail-fade-leave-to,
.energy-loading-fade-enter,
.energy-loading-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .energy-detail-fade-enter-active,
  .energy-detail-fade-leave-active,
  .energy-loading-fade-enter-active,
  .energy-loading-fade-leave-active {
    transition: none;
  }
}
</style>
