<template>
  <transition name="collection-detail-fade">
    <section
      v-if="visible"
      class="collection-detail-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="collection-detail-title"
      @click.self="$emit('close')"
    >
      <div class="collection-detail-panel">
        <header class="collection-detail-head">
          <div class="collection-detail-head__title">
            <span class="collection-detail-head__icon" aria-hidden="true">
              <i class="el-icon-s-finance" />
            </span>
            <div>
              <h2 id="collection-detail-title">项目水电收缴明细汇总</h2>
              <p>{{ projectCountText }}管理方独立取数，点击项目可进入账单统计溯源</p>
            </div>
          </div>
          <button
            type="button"
            class="collection-detail-close"
            aria-label="关闭水电收缴明细"
            @click="$emit('close')"
          >
            <i class="el-icon-close" aria-hidden="true" />
          </button>
        </header>

        <div class="collection-detail-filter">
          <div class="collection-detail-filter__item">
            <span>统计周期</span>
            <strong>{{ activeTime }}</strong>
          </div>
          <div class="collection-detail-filter__item collection-detail-filter__item--wide">
            <span>统计区间</span>
            <strong>{{ rangeText }}</strong>
          </div>
          <div class="collection-detail-filter__formula">
            <i class="el-icon-info" aria-hidden="true" />
            水电收缴率 = 水电已收金额 ÷ 水电应收金额
          </div>
        </div>

        <div class="collection-detail-body" :aria-busy="loading ? 'true' : 'false'">
          <div v-if="isApartmentScope && !loading" class="collection-detail-empty">当前业态暂无水电收缴明细数据</div>
          <template v-else>
          <div class="collection-project-grid">
            <article
              v-for="project in projects"
              :key="project.managerId"
              class="collection-project-card"
              :class="[
                `collection-project-card--${project.tone}`,
                { 'is-unavailable': !project.available }
              ]"
            >
              <header class="collection-project-card__head">
                <span class="collection-project-card__icon" aria-hidden="true">
                  <i :class="project.icon" />
                </span>
                <div>
                  <small>管理方</small>
                  <b :title="project.name">{{ project.name }}</b>
                </div>
              </header>

              <button
                type="button"
                class="collection-project-main"
                :disabled="loading || !project.available"
                :aria-label="`查看${project.name}账单统计`"
                @click="drilldown(project)"
              >
                <span class="collection-project-main__label">水电收缴率</span>
                <div class="collection-project-main__value">
                  <strong>{{ formatRate(project.rate) }}</strong>
                  <em v-if="formatRate(project.rate) !== '--'">%</em>
                </div>
                <div class="collection-project-main__track" aria-hidden="true">
                  <i :style="{ width: rateWidth(project.rate) }" />
                </div>
                <small>查看账单统计 <i class="el-icon-right" aria-hidden="true" /></small>
              </button>

              <dl class="collection-project-money">
                <div>
                  <dt>应收金额</dt>
                  <dd>¥{{ formatMoney(project.receivable) }}</dd>
                </div>
                <div>
                  <dt>已收金额</dt>
                  <dd>¥{{ formatMoney(project.collected) }}</dd>
                </div>
                <div>
                  <dt>未收金额</dt>
                  <dd>¥{{ formatMoney(project.uncollected) }}</dd>
                </div>
              </dl>

              <p v-if="!loading && !project.available" class="collection-project-card__error">
                {{ project.error || '数据暂不可用' }}
              </p>
            </article>
          </div>

          <footer class="collection-group-total" :class="{ 'is-incomplete': !complete && !loading }">
            <div class="collection-group-total__rate">
              <span>集团水电收缴率</span>
              <div>
                <strong>{{ loading ? '--' : formatRate(groupSummary.rate) }}</strong>
                <i v-if="!loading && formatRate(groupSummary.rate) !== '--'">%</i>
              </div>
            </div>
            <span class="collection-group-total__divider" aria-hidden="true" />
            <div class="collection-group-total__money">
              <div>
                <span>水电应收合计</span>
                <b>¥{{ loading ? '--' : formatMoney(groupSummary.receivable) }}</b>
              </div>
              <span class="collection-group-total__operator">−</span>
              <div>
                <span>水电已收合计</span>
                <b>¥{{ loading ? '--' : formatMoney(groupSummary.collected) }}</b>
              </div>
              <span class="collection-group-total__operator">=</span>
              <div>
                <span>水电未收合计</span>
                <b>¥{{ loading ? '--' : formatMoney(groupSummary.uncollected) }}</b>
              </div>
            </div>
            <p v-if="!loading && !complete">存在项目数据异常，集团合计暂不计算，避免将异常数据当作 0。</p>
          </footer>

          </template>

          <transition name="collection-loading-fade">
            <div v-if="loading" class="collection-detail-loading" role="status" aria-live="polite">
              <div class="collection-detail-loading__content">
                <i class="el-icon-loading" aria-hidden="true" />
                <strong>正在汇总{{ projectCountText }}项目水电收缴数据</strong>
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
  getGroupEnergyDateRange
} from '@/api/groupEnergyOverview'
import { queryGroupBillCollection } from '@/api/groupBillCollection'
import { getManagersByScope } from '../utils/screenQuery'

function emptyProjects (scope) {
  const managers = scope ? getManagersByScope(scope) : GROUP_ENERGY_MANAGERS
  return managers.map(m => ({
    ...m,
    receivable: null,
    collected: null,
    uncollected: null,
    rate: null,
    available: true
  }))
}

function emptySummary () {
  return {
    receivable: null,
    collected: null,
    uncollected: null,
    rate: null
  }
}

export default {
  name: 'CollectionDrilldownPanel',
  props: {
    visible: { type: Boolean, default: false },
    activeTime: { type: String, default: '本月' },
    activeScope: { type: String, default: '全部' }
  },
  data () {
    return {
      projects: emptyProjects(this.activeScope),
      groupSummary: emptySummary(),
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
    rangeText () {
      return `${this.range.startDate} 至 ${this.range.endDate}`
    }
  },
  watch: {
    visible (value) {
      if (value) this.fetchData()
    },
    activeTime () {
      if (this.visible) this.fetchData()
    },
    activeScope () {
      if (this.visible) this.fetchData()
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
    formatMoney (value) {
      if (value == null || value === '' || !Number.isFinite(Number(value))) return '--'
      return Number(value).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    },
    formatRate (value) {
      if (value == null || value === '' || !Number.isFinite(Number(value))) return '--'
      return Number(value).toLocaleString('zh-CN', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })
    },
    rateWidth (value) {
      if (value == null || value === '' || !Number.isFinite(Number(value))) return '0%'
      return `${Math.min(100, Math.max(0, Number(value)))}%`
    },
    async fetchData () {
      const requestId = ++this.requestId
      this.loading = true
      this.range = getGroupEnergyDateRange(this.activeTime)
      this.projects = emptyProjects(this.activeScope)
      this.groupSummary = emptySummary()
      this.complete = true

      // 公寓业态：无项目，不发起请求
      if (this.isApartmentScope) {
        this.loading = false
        return
      }

      try {
        const result = await queryGroupBillCollection({ period: this.activeTime })
        if (requestId !== this.requestId) return
        this.range = result.range
        // 按业态过滤项目
        const scopeManagerIds = new Set(
          getManagersByScope(this.activeScope).map(m => m.managerId)
        )
        const filteredProjects = (result.projects || []).filter(
          p => scopeManagerIds.has(p.managerId)
        )
        this.projects = filteredProjects
        this.complete = filteredProjects.length > 0 && filteredProjects.every(p => p.available !== false)
        // 集团合计基于过滤后的项目重新计算
        if (filteredProjects.length > 0 && filteredProjects.every(p => p.available !== false)) {
          this.groupSummary = {
            receivable: filteredProjects.reduce((sum, p) => {
              const v = Number(p.receivable)
              return sum + (Number.isFinite(v) ? v : 0)
            }, 0),
            collected: filteredProjects.reduce((sum, p) => {
              const v = Number(p.collected)
              return sum + (Number.isFinite(v) ? v : 0)
            }, 0),
            uncollected: filteredProjects.reduce((sum, p) => {
              const v = Number(p.uncollected)
              return sum + (Number.isFinite(v) ? v : 0)
            }, 0),
            rate: null
          }
          // 重新计算集团收缴率
          const totalReceivable = this.groupSummary.receivable
          if (totalReceivable > 0) {
            this.groupSummary.rate = (this.groupSummary.collected / totalReceivable) * 100
          }
        }
      } catch (error) {
        if (requestId !== this.requestId) return
        this.projects = emptyProjects(this.activeScope).map(project => ({
          ...project,
          available: false,
          error: '数据获取失败'
        }))
        this.groupSummary = emptySummary()
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
    drilldown (project) {
      if (this.loading || !project.available) return
      const manager = this.resolveManager(project)
      this.$store.commit('manager/SET_CURRENT_MANAGER_ID', manager.managerId)
      this.$store.commit('manager/SET_CURRENT_MANAGER', manager)

      const route = this.$router.resolve({
        path: '/metering/bill/floating-price-tenant',
        query: {
          fromDashboard: '1',
          managerId: String(project.managerId),
          tenantType: '0',
          startDate: this.range.startDate,
          endDate: this.range.endDate,
          source: 'group-property-screen'
        }
      })
      const reportWindow = window.open(route.href, 'group-bill-statistics')
      if (reportWindow) {
        reportWindow.focus()
      } else if (this.$message) {
        this.$message.warning('浏览器已拦截账单统计窗口，请允许弹出窗口后重试')
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

.collection-detail-layer {
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

.collection-detail-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 1160px;
  height: 680px;
  min-width: 0;
  min-height: 0;
  padding: 20px 22px;
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid rgba(83, 181, 226, 0.82);
  border-radius: 12px;
  background:
    radial-gradient(circle at 50% 0%, rgba(39, 126, 182, 0.2), transparent 44%),
    linear-gradient(180deg, #0b2a4a 0%, #071b35 100%);
  box-shadow:
    0 26px 76px rgba(0, 5, 18, 0.64),
    0 0 0 5px rgba(19, 95, 148, 0.22),
    inset 0 1px 0 rgba(205, 239, 255, 0.12);
}

.collection-detail-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding-bottom: 16px;
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
  }

  p {
    margin: 5px 0 0;
    color: rgba(211, 231, 244, 0.76);
    font-size: 12px;
  }
}

.collection-detail-close {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid rgba(107, 190, 226, 0.36);
  border-radius: 8px;
  background: rgba(8, 37, 64, 0.76);
  color: #a9c9dc;
  font-size: 19px;
  cursor: pointer;
  transition: 160ms ease;

  &:hover {
    border-color: rgba(127, 219, 244, 0.72);
    background: rgba(20, 72, 105, 0.9);
    color: #fff;
  }
}

.collection-detail-filter {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  min-height: 52px;
  margin-top: 12px;
  padding: 0 16px;
  border: 1px solid rgba(67, 150, 197, 0.34);
  border-radius: 9px;
  background: rgba(5, 28, 52, 0.5);

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-right: 18px;

    & + & {
      padding-left: 18px;
      border-left: 1px solid rgba(86, 160, 199, 0.22);
    }

    span {
      color: rgba(183, 211, 227, 0.7);
      font-size: 12px;
    }

    strong {
      color: #f2f9fd;
      font-size: 14px;
    }

    &--wide {
      min-width: 280px;
    }
  }

  &__formula {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-left: auto;
    color: #acd6e8;
    font-size: 12px;

    i {
      color: #81d6ec;
    }
  }
}

.collection-detail-body {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  padding-top: 14px;
}

.collection-detail-empty {
  display: grid;
  place-items: center;
  flex: 1;
  min-height: 400px;
  color: rgba(184, 213, 228, 0.72);
  font-size: 16px;
  letter-spacing: 0.5px;
}

.collection-project-grid {
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.collection-project-card {
  --tone: #62bee6;
  --tone-rgb: 98, 190, 230;
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 14px;
  overflow: hidden;
  border: 1px solid rgba(var(--tone-rgb), 0.46);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(var(--tone-rgb), 0.1), transparent 40%),
    rgba(8, 39, 67, 0.78);
  box-shadow: inset 0 1px 0 rgba(220, 245, 255, 0.05);

  &--green {
    --tone: #55c7a2;
    --tone-rgb: 85, 199, 162;
  }

  &--gold {
    --tone: #d8ae54;
    --tone-rgb: 216, 174, 84;
  }

  &--steel {
    --tone: #82aec3;
    --tone-rgb: 130, 174, 195;
  }

  &.is-unavailable {
    filter: saturate(0.45);
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    height: 42px;

    > div {
      min-width: 0;
    }

    small {
      display: block;
      margin-bottom: 3px;
      color: rgba(181, 208, 224, 0.64);
      font-size: 10px;
    }

    b {
      display: block;
      overflow: hidden;
      color: #f4fbff;
      font-size: 16px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__icon {
    display: grid;
    place-items: center;
    flex: 0 0 36px;
    width: 36px;
    height: 36px;
    border: 1px solid rgba(var(--tone-rgb), 0.45);
    border-radius: 50%;
    background: rgba(var(--tone-rgb), 0.13);
    color: var(--tone);
    font-size: 18px;
  }

  &__error {
    position: absolute;
    inset: 70px 14px auto;
    z-index: 2;
    margin: 0;
    padding: 8px;
    border-radius: 6px;
    background: rgba(87, 27, 36, 0.9);
    color: #ffd1d1;
    font-size: 11px;
    text-align: center;
  }
}

.collection-project-main {
  display: flex;
  align-items: stretch;
  min-height: 145px;
  margin-top: 12px;
  padding: 15px 15px 12px;
  flex-direction: column;
  border: 1px solid rgba(76, 159, 199, 0.22);
  border-radius: 8px;
  background: rgba(4, 28, 51, 0.48);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: 160ms ease;

  &:not(:disabled):hover {
    border-color: rgba(var(--tone-rgb), 0.64);
    background: rgba(var(--tone-rgb), 0.09);
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: default;
  }

  &__label {
    color: rgba(203, 226, 239, 0.76);
    font-size: 12px;
  }

  &__value {
    margin-top: 5px;
    color: var(--tone);

    strong {
      font-size: 34px;
      line-height: 1.1;
      letter-spacing: 0.5px;
    }

    em {
      margin-left: 3px;
      font-size: 14px;
      font-style: normal;
    }
  }

  &__track {
    height: 5px;
    margin-top: 13px;
    overflow: hidden;
    border-radius: 3px;
    background: rgba(96, 165, 198, 0.15);

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--tone);
      box-shadow: 0 0 8px rgba(var(--tone-rgb), 0.5);
      transition: width 300ms ease;
    }
  }

  > small {
    margin-top: auto;
    padding-top: 12px;
    color: var(--tone);
    font-size: 11px;
    text-align: right;
  }
}

.collection-project-money {
  display: grid;
  margin: 10px 0 0;
  gap: 7px;

  > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 0;
    min-height: 35px;
    padding: 0 10px;
    border: 1px solid rgba(79, 150, 188, 0.18);
    border-radius: 6px;
    background: rgba(5, 30, 53, 0.42);
  }

  dt {
    color: rgba(189, 215, 230, 0.72);
    font-size: 11px;
  }

  dd {
    margin: 0 0 0 8px;
    overflow: hidden;
    color: #eaf7fd;
    font-size: 13px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.collection-group-total {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  min-height: 86px;
  margin-top: 12px;
  padding: 0 16px;
  border: 1px solid rgba(71, 164, 211, 0.48);
  border-radius: 9px;
  background:
    linear-gradient(90deg, rgba(18, 80, 117, 0.23), transparent 52%),
    rgba(5, 29, 52, 0.65);

  &__rate {
    flex: 0 0 228px;

    > span {
      color: #c3deeb;
      font-size: 12px;
      font-weight: 600;
    }

    > div {
      margin-top: 4px;
      color: #7bd8ec;
    }

    strong {
      font-size: 29px;
      line-height: 1;
    }

    i {
      margin-left: 3px;
      font-size: 13px;
      font-style: normal;
    }
  }

  &__divider {
    width: 1px;
    height: 46px;
    margin-right: 24px;
    background: rgba(100, 180, 217, 0.25);
  }

  &__money {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    gap: 14px;

    > div {
      flex: 1;
      min-width: 0;
    }

    span {
      display: block;
      color: rgba(188, 215, 230, 0.7);
      font-size: 11px;
    }

    b {
      display: block;
      margin-top: 5px;
      overflow: hidden;
      color: #f2f9fd;
      font-size: 16px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__operator {
    flex: 0 0 auto;
    color: #75bad8 !important;
    font-size: 20px !important;
  }

  > p {
    position: absolute;
    right: 16px;
    bottom: 4px;
    margin: 0;
    color: #f4bd72;
    font-size: 10px;
  }

  &.is-incomplete {
    border-color: rgba(218, 165, 88, 0.52);
  }
}

.collection-detail-loading {
  position: absolute;
  z-index: 6;
  inset: 14px 0 0;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgba(4, 23, 42, 0.78);
  backdrop-filter: blur(3px);

  &__content {
    display: flex;
    align-items: center;
    flex-direction: column;
    color: #e9f8ff;

    > i {
      color: #70d7ef;
      font-size: 36px;
    }

    strong {
      margin-top: 14px;
      font-size: 15px;
      letter-spacing: 0.5px;
    }

    span {
      margin-top: 7px;
      color: rgba(185, 216, 231, 0.7);
      font-size: 11px;
    }
  }
}

.collection-detail-fade-enter-active,
.collection-detail-fade-leave-active,
.collection-loading-fade-enter-active,
.collection-loading-fade-leave-active {
  transition: opacity 180ms ease;
}

.collection-detail-fade-enter,
.collection-detail-fade-leave-to,
.collection-loading-fade-enter,
.collection-loading-fade-leave-to {
  opacity: 0;
}
</style>
