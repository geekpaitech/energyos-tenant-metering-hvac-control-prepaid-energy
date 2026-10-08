<template>
  <transition name="device-overview-fade">
    <section
      v-if="visible"
      class="device-overview-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-overview-title"
      @click.self="$emit('close')"
    >
      <div class="device-overview-panel">
        <header class="device-overview-head">
          <div class="device-overview-head__title">
            <span class="device-overview-head__icon" aria-hidden="true">
              <i class="el-icon-monitor" />
            </span>
            <div>
              <h2 id="device-overview-title">项目设备在线概览</h2>
              <p>四个管理方电表、水表及空调内机接入情况</p>
            </div>
          </div>
          <button
            type="button"
            class="device-overview-close"
            aria-label="关闭设备在线概览"
            @click="$emit('close')"
          >
            <i class="el-icon-close" aria-hidden="true" />
          </button>
        </header>

        <div class="device-overview-filter">
          <div>
            <span>数据日期</span>
            <strong>{{ overviewDate }}</strong>
          </div>
          <div class="device-overview-filter__formula">
            <i class="el-icon-info" aria-hidden="true" />
            在线率 =（设备总数 − 离线设备数）÷ 设备总数
          </div>
        </div>

        <div class="device-project-list">
          <div v-if="isApartmentScope" class="device-overview-empty">当前业态暂无设备在线数据</div>
          <template v-else>
          <button
            v-for="project in projects"
            :key="project.managerId"
            type="button"
            class="device-project-row"
            :class="[
              `device-project-row--${project.tone}`,
              { 'is-unavailable': !project.available }
            ]"
            :disabled="!project.available"
            :aria-label="project.available ? `进入${project.name}系统首页` : `${project.name}设备数据不可用`"
            @click="drilldown(project)"
          >
            <div class="device-project-row__manager">
              <span class="device-project-row__manager-icon" aria-hidden="true">
                <i :class="project.icon" />
              </span>
              <div>
                <small>管理方</small>
                <strong :title="project.name">{{ project.name }}</strong>
              </div>
              <span class="device-project-row__rate">
                <small>在线率</small>
                <b>{{ formatRate(project.rate) }}<i v-if="formatRate(project.rate) !== '--'">%</i></b>
              </span>
            </div>

            <div class="device-project-row__metrics">
              <div
                v-for="(device, index) in displayDevices(project)"
                :key="device.key"
                class="device-metric"
                :class="`device-metric--${index}`"
              >
                <span class="device-metric__icon" aria-hidden="true">
                  <i :class="device.icon" />
                </span>
                <div class="device-metric__content">
                  <span>{{ device.label }}</span>
                  <strong>{{ formatCount(device.total) }}</strong>
                  <div class="device-metric__status">
                    <span class="device-metric__offline">
                      <i aria-hidden="true" />
                      离线 {{ formatCount(device.offline) }}
                    </span>
                    <span v-if="device.key === 'electricity'" class="device-metric__breakdown">
                      <em>其中</em>
                      <b class="device-metric__abnormal">异常 {{ formatCount(device.abnormalOffline) }}</b>
                      <b class="device-metric__normal">正常 {{ formatCount(device.normalOffline) }}</b>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <span v-if="!project.available" class="device-project-row__error">
              {{ project.error || '数据暂不可用' }}
            </span>
          </button>
          </template>
        </div>

        <footer class="device-overview-total" :class="{ 'is-incomplete': !complete }">
          <div>
            <span>集团设备在线率</span>
            <strong>{{ formatRate(summary.rate) }}<i v-if="formatRate(summary.rate) !== '--'">%</i></strong>
          </div>
          <span class="device-overview-total__divider" aria-hidden="true" />
          <dl>
            <div>
              <dt>设备总数</dt>
              <dd>{{ formatCount(summary.total) }}<small v-if="formatCount(summary.total) !== '--'"> 台</small></dd>
            </div>
            <div>
              <dt>在线设备</dt>
              <dd>{{ formatCount(summary.online) }}<small v-if="formatCount(summary.online) !== '--'"> 台</small></dd>
            </div>
            <div>
              <dt>离线设备</dt>
              <dd class="is-offline">{{ formatCount(summary.offline) }}<small v-if="formatCount(summary.offline) !== '--'"> 台</small></dd>
            </div>
          </dl>
          <p v-if="!complete">存在项目数据异常，集团在线率暂不计算，避免将异常数据当作 0。</p>
        </footer>
      </div>
    </section>
  </transition>
</template>

<script>
import { GROUP_ENERGY_MANAGERS } from '@/api/groupEnergyOverview'
import { getManagersByScope } from '../utils/screenQuery'

const EMPTY_DEVICES = Object.freeze([
  { key: 'electricity', label: '电表台数（台）', icon: 'iconfont icon-dianbiao5', total: null, offline: null, abnormalOffline: null, normalOffline: null },
  { key: 'water', label: '水表台数（台）', icon: 'iconfont icon-shuibiaoguohu-', total: null, offline: null },
  { key: 'air', label: '空调内机（台）', icon: 'iconfont icon-kongtiao1', total: null, offline: null }
])

function unavailableProjects () {
  return GROUP_ENERGY_MANAGERS.map(manager => ({
    ...manager,
    devices: EMPTY_DEVICES.map(item => ({ ...item })),
    rate: null,
    available: false,
    error: '数据获取失败'
  }))
}

export default {
  name: 'DeviceOverviewPanel',
  props: {
    visible: { type: Boolean, default: false },
    activeScope: { type: String, default: '全部' },
    overview: { type: Object, default: null }
  },
  computed: {
    isApartmentScope () {
      return this.activeScope === '公寓'
    },
    projects () {
      const raw = this.overview && Array.isArray(this.overview.projects)
        ? this.overview.projects
        : unavailableProjects()
      // 按业态过滤
      if (!this.overview) return raw
      const scopeIds = new Set(
        getManagersByScope(this.activeScope).map(m => m.managerId)
      )
      return raw.filter(p => scopeIds.has(p.managerId))
    },
    complete () {
      if (!this.overview) return false
      return this.projects.length > 0 && this.projects.every(p => p.available !== false)
    },
    overviewDate () {
      return (this.overview && this.overview.date) || '--'
    },
    summary () {
      if (!this.overview) {
        return { total: null, online: null, offline: null, rate: null }
      }
      const projects = this.projects
      if (!projects.length) {
        return { total: null, online: null, offline: null, rate: null }
      }
      let total = 0
      let offline = 0
      projects.forEach(p => {
        (p.devices || []).forEach(d => {
          const t = Number(d.total)
          const o = Number(d.offline)
          if (Number.isFinite(t)) total += t
          if (Number.isFinite(o)) offline += o
        })
      })
      const online = Math.max(0, total - offline)
      const rate = total > 0 ? (online / total) * 100 : null
      return { total, online, offline, rate }
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
    displayDevices (project) {
      return Array.isArray(project.devices) && project.devices.length
        ? project.devices.slice(0, 3)
        : EMPTY_DEVICES
    },
    formatCount (value) {
      if (value == null || value === '' || !Number.isFinite(Number(value))) return '--'
      return Math.max(0, Math.round(Number(value))).toLocaleString('zh-CN')
    },
    formatRate (value) {
      if (value == null || value === '' || !Number.isFinite(Number(value))) return '--'
      return Number(value).toLocaleString('zh-CN', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })
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
      if (!project.available) return
      const manager = this.resolveManager(project)
      this.$store.commit('manager/SET_CURRENT_MANAGER_ID', manager.managerId)
      this.$store.commit('manager/SET_CURRENT_MANAGER', manager)

      const route = this.$router.resolve({
        path: '/metering/dashboard',
        query: {
          managerId: String(project.managerId),
          source: 'group-property-screen',
          _r: String(Date.now())
        }
      })
      const dashboardWindow = window.open(route.href, 'group-metering-dashboard')
      if (dashboardWindow) {
        dashboardWindow.focus()
      } else if (this.$message) {
        this.$message.warning('浏览器已拦截系统首页窗口，请允许弹出窗口后重试')
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

.device-overview-layer {
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

.device-overview-panel {
  display: flex;
  width: 1160px;
  height: 680px;
  padding: 20px 22px;
  overflow: hidden;
  flex-direction: column;
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

.device-overview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  min-height: 58px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(101, 190, 229, 0.34);

  &__title {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 13px;

    > span {
      display: grid;
      place-items: center;
      flex: 0 0 42px;
      width: 42px;
      height: 42px;
      border: 1px solid rgba(104, 202, 234, 0.58);
      border-radius: 9px;
      background: #0d385a;
      color: #8ee5f2;
      font-size: 22px;
    }
  }

  h2 {
    margin: 0;
    color: #f4fbff;
    font-family: $ds-font-title;
    font-size: 24px;
    line-height: 1.2;
    letter-spacing: 1px;
  }

  p {
    margin: 5px 0 0;
    color: rgba(211, 231, 244, 0.76);
    font-size: 12px;
  }
}

.device-overview-close {
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

  &:hover,
  &:focus-visible {
    border-color: rgba(127, 219, 244, 0.72);
    color: #fff;
    outline: none;
  }
}

.device-overview-filter {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  min-height: 48px;
  margin-top: 12px;
  padding: 0 16px;
  border: 1px solid rgba(67, 150, 197, 0.34);
  border-radius: 9px;
  background: rgba(5, 28, 52, 0.5);

  > div:first-child {
    display: flex;
    align-items: center;
    gap: 10px;

    span {
      color: rgba(183, 211, 227, 0.7);
      font-size: 12px;
    }

    strong {
      color: #f2f9fd;
      font-size: 14px;
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

.device-project-list {
  display: grid;
  flex: 1;
  min-height: 0;
  margin-top: 12px;
  grid-template-rows: repeat(4, minmax(0, 1fr));
  gap: 9px;
}

.device-project-row {
  --tone: #73b6d1;
  --tone-rgb: 115, 182, 209;
  position: relative;
  display: grid;
  min-width: 0;
  padding: 10px 14px;
  grid-template-columns: 275px minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  overflow: hidden;
  border: 1px solid rgba(var(--tone-rgb), 0.35);
  border-radius: 9px;
  background:
    linear-gradient(90deg, rgba(var(--tone-rgb), 0.1), transparent 44%),
    rgba(7, 35, 61, 0.76);
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: 160ms ease;

  &--green {
    --tone: #73b6d1;
    --tone-rgb: 115, 182, 209;
  }

  &--gold {
    --tone: #73b6d1;
    --tone-rgb: 115, 182, 209;
  }

  &--steel {
    --tone: #73b6d1;
    --tone-rgb: 115, 182, 209;
  }

  &:not(:disabled):hover,
  &:not(:disabled):focus-visible {
    border-color: rgba(var(--tone-rgb), 0.68);
    background:
      linear-gradient(90deg, rgba(var(--tone-rgb), 0.16), transparent 52%),
      rgba(10, 43, 73, 0.9);
    transform: translateX(2px);
    outline: none;
  }

  &.is-unavailable {
    cursor: default;
    filter: saturate(0.4);
  }

  &__manager {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 11px;

    > div {
      min-width: 0;
    }

    > div small {
      display: block;
      margin-bottom: 3px;
      color: rgba(181, 208, 224, 0.64);
      font-size: 10px;
    }

    > div strong {
      display: block;
      overflow: hidden;
      color: #f4fbff;
      font-size: 16px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__manager-icon {
    display: grid;
    place-items: center;
    flex: 0 0 38px;
    width: 38px;
    height: 38px;
    border: 1px solid rgba(var(--tone-rgb), 0.45);
    border-radius: 50%;
    background: rgba(var(--tone-rgb), 0.13);
    color: var(--tone);
    font-size: 18px;
  }

  &__rate {
    display: flex;
    align-items: flex-end;
    margin-left: auto;
    flex-direction: column;

    small {
      color: rgba(181, 208, 224, 0.62);
      font-size: 10px;
    }

    b {
      margin-top: 3px;
      color: var(--tone);
      font-family: $ds-font-num;
      font-size: 21px;
      line-height: 1;
    }

    i {
      margin-left: 2px;
      font-size: 11px;
      font-style: normal;
    }
  }

  &__metrics {
    display: grid;
    min-width: 0;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  &__error {
    position: absolute;
    right: 15px;
    bottom: 3px;
    margin: 0;
    color: #f3b1b1;
    font-size: 10px;
  }
}

.device-metric {
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 66px;
  padding: 7px 12px;
  gap: 10px;
  border: 1px solid rgba(87, 164, 202, 0.2);
  border-radius: 8px;
  background: rgba(5, 28, 51, 0.52);

  &__icon {
    display: grid;
    place-items: center;
    flex: 0 0 42px;
    width: 42px;
    height: 42px;
    border: 1px solid rgba(94, 159, 198, 0.46);
    border-radius: 50%;
    background: rgba(58, 119, 157, 0.14);
    color: #72b9da;
    font-size: 20px;
  }

  &--1 &__icon {
    border-color: rgba(88, 181, 190, 0.46);
    background: rgba(52, 139, 151, 0.13);
    color: #75c4ca;
  }

  &--2 &__icon {
    border-color: rgba(122, 165, 189, 0.46);
    background: rgba(88, 133, 158, 0.13);
    color: #8fb8ca;
  }

  &__content {
    min-width: 0;

    > span {
      display: block;
      overflow: hidden;
      color: rgba(192, 215, 229, 0.75);
      font-size: 11px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    > strong {
      display: block;
      margin-top: 1px;
      color: #eff8ff;
      font-family: $ds-font-num;
      font-size: 22px;
      line-height: 1.1;
    }

  }

  &__status {
    display: flex;
    align-items: center;
    min-width: 0;
    margin-top: 2px;
    gap: 12px;

    > span {
      display: flex;
      align-items: center;
      font-size: 10px;
      white-space: nowrap;
    }

    i {
      flex: 0 0 5px;
      width: 5px;
      height: 5px;
      margin-right: 4px;
      border-radius: 50%;
      background: currentColor;
    }
  }

  &__breakdown {
    position: relative;
    gap: 6px;
    padding-left: 10px;

    &::before {
      content: '';
      position: absolute;
      top: 1px;
      bottom: 1px;
      left: 0;
      width: 1px;
      background: rgba(158, 190, 211, 0.22);
    }

    em {
      color: rgba(174, 198, 214, 0.58);
      font-style: normal;
    }

    b {
      font-weight: 500;
    }
  }

  &__offline {
    color: #f17982;
  }

  &__abnormal {
    color: #e8bd62;
  }

  &__normal {
    color: #8fb8ca;
  }
}

.device-overview-total {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  min-height: 72px;
  margin-top: 11px;
  padding: 0 18px;
  border: 1px solid rgba(71, 164, 211, 0.48);
  border-radius: 9px;
  background:
    linear-gradient(90deg, rgba(18, 80, 117, 0.23), transparent 52%),
    rgba(5, 29, 52, 0.65);

  > div:first-child {
    flex: 0 0 225px;

    > span {
      display: block;
      color: #c3deeb;
      font-size: 12px;
    }

    strong {
      display: block;
      margin-top: 3px;
      color: #7bd8ec;
      font-family: $ds-font-num;
      font-size: 27px;
      line-height: 1;
    }

    i {
      margin-left: 3px;
      font-size: 12px;
      font-style: normal;
    }
  }

  &__divider {
    width: 1px;
    height: 40px;
    background: rgba(100, 180, 217, 0.25);
  }

  dl {
    display: grid;
    flex: 1;
    margin: 0 0 0 24px;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;

    div {
      min-width: 0;
    }

    dt {
      color: rgba(188, 215, 230, 0.7);
      font-size: 11px;
    }

    dd {
      margin: 4px 0 0;
      color: #f2f9fd;
      font-family: $ds-font-num;
      font-size: 18px;
      font-weight: 700;

      &.is-offline {
        color: #ef8990;
      }

      small {
        font-family: inherit;
        font-size: 10px;
        font-weight: 500;
      }
    }
  }

  > p {
    position: absolute;
    right: 18px;
    bottom: 3px;
    margin: 0;
    color: #f4bd72;
    font-size: 10px;
  }

  &.is-incomplete {
    border-color: rgba(218, 165, 88, 0.52);
  }
}

.device-overview-fade-enter-active,
.device-overview-fade-leave-active {
  transition: opacity 180ms ease;
}

.device-overview-fade-enter,
.device-overview-fade-leave-to {
  opacity: 0;
}
</style>
