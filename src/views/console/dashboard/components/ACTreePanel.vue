<template>
  <div class="ac-tree-panel" style="cursor: pointer;" @click="handlePanelClick">
    <div class="panel-header">
      <div class="header-left">
        <div class="icon-box">
          <img class="icon-img" src="../image/tp.png" alt="空调系统拓扑" />
        </div>
        <div class="title-box">
          <h3>空调系统拓扑</h3>
          <p>选择楼栋查看内机状态</p>
        </div>
      </div>
      <div class="header-right">
        <span class="status-text">
          <span class="running">{{ totalRunning }}</span>
          <span class="total">/{{ totalUnits }}</span>
        </span>
        <el-button size="mini" class="remote-btn" @click="$emit('open-remote')">
          <img class="remote-icon-img" src="../image/yk.png" alt="" />
          <span>遥控</span>
        </el-button>
      </div>
    </div>

    <div class="panel-body" v-loading="loading">
      <!-- System Selector -->
      <div class="system-selector">
        <el-dropdown trigger="click" @command="selectSystem">
          <div class="selector-trigger">
            <div class="system-info">
              <div :class="['system-icon', selectedSystem.status === 'running' ? 'active' : '']">
                <img class="system-icon-img" src="../image/ac.png" alt="" />
              </div>
              <div class="system-detail">
                <span class="system-name">{{ selectedSystem.name }}</span>
                <div class="system-meta">
                  <span :class="['status-dot', selectedSystem.status]"></span>
                  <span class="status-text">{{ statusText(selectedSystem.status) }}</span>
                  <span class="divider">·</span>
                  <span>负载 {{ selectedSystem.load }}%</span>
                </div>
              </div>
            </div>
            <i class="el-icon-arrow-down arrow-icon"></i>
          </div>
          <el-dropdown-menu slot="dropdown" class="system-dropdown">
            <el-dropdown-item
              v-for="system in systems"
              :key="system.id"
              :command="system"
              :class="{ active: selectedSystem.id === system.id }"
            >
              <div class="dropdown-item">
                <div :class="['system-icon', system.status === 'running' ? 'active' : '']">
                  <img class="system-icon-img" src="../image/ac.png" alt="" />
                </div>
                <div class="system-detail">
                  <span class="system-name">{{ system.name }}</span>
                  <span class="system-count">
                    {{ system.units.filter(u => u.status === 'running').length }}/{{ system.units.length }} 台运行 · 负载 {{ system.load }}%
                  </span>
                </div>
                <i v-if="selectedSystem.id === system.id" class="el-icon-check check-icon"></i>
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>

      <!-- Load Progress -->
      <div v-if="selectedSystem.load > 0" class="load-progress">
        <div class="progress-header">
          <span>系统负载</span>
          <span>{{ selectedSystem.load }}%</span>
        </div>
        <div class="progress-bar">
          <div
            :class="['progress-fill', loadColor]"
            :style="{ width: selectedSystem.load + '%' }"
          ></div>
        </div>
      </div>

      <!-- Indoor Units List -->
      <div class="units-list">
        <div
          v-for="unit in selectedSystem.units"
          :key="unit.id"
          class="unit-item"
        >
          <span :class="['status-dot', unit.status, unit.status === 'running' ? 'pulse' : '']"></span>
          <div class="mode-icon">
            <img class="mode-icon-img" src="../image/ac.png" alt="" />
          </div>
          <div class="unit-info">
            <div class="unit-header">
              <span class="unit-name">{{ unit.name }}</span>
              <span v-if="unit.floor && unit.floor !== '--'" class="unit-floor">{{ unit.floor }}</span>
            </div>
            <span :class="['unit-status', unit.status]">{{ statusText(unit.status) }}</span>
          </div>
          <div class="unit-temp">
            <div class="current-temp">
              <i class="el-icon-thermometer"></i>
              <span>{{ unit.temp != null ? unit.temp : '--' }}°</span>
            </div>
            <div class="set-temp">设 {{ unit.setTemp != null ? unit.setTemp : '--' }}°</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { isDemoManager } from '@/api/newDashboard'
import { pageAirGateWay, airInfoListAirInfo } from '@/api/airCondition'

export default {
  name: 'ACTreePanel',
  data () {
    return {
      loading: false,
      selectedSystem: { id: '', name: '-', building: '-', status: 'standby', load: 0, units: [] },
      systems: []
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    totalRunning () {
      return this.systems.reduce((sum, s) => sum + s.units.filter(u => u.status === 'running').length, 0)
    },
    totalUnits () {
      return this.systems.reduce((sum, s) => sum + s.units.length, 0)
    },
    loadColor () {
      const load = this.selectedSystem && typeof this.selectedSystem.load === 'number' ? this.selectedSystem.load : 0
      if (load > 80) return 'high'
      if (load > 50) return 'medium'
      return 'low'
    }
  },
  watch: {
    currentManagerId: {
      immediate: true,
      handler () {
        this.fetchSystems()
      }
    }
  },
  methods: {
    selectSystem (system) {
      this.selectedSystem = system
    },
    statusText (status) {
      const map = { running: '运行中', standby: '待机', offline: '离线' }
      return map[status] || '未知'
    },
    getNumber (val) {
      if (val === null || val === undefined || val === '') return null
      const n = Number(val)
      return Number.isFinite(n) ? n : null
    },
    parseAirList (airList) {
      if (Array.isArray(airList)) return airList
      if (!airList) return []
      if (typeof airList === 'string') {
        try {
          const parsed = JSON.parse(airList)
          return Array.isArray(parsed) ? parsed : []
        } catch (e) {
          return []
        }
      }
      return []
    },
    extractFloor (name) {
      if (!name) return '--'
      const s = String(name)
      const m1 = s.match(/(\d+)\s*F/i)
      if (m1 && m1[1]) return `${m1[1]}F`
      const m2 = s.match(/(\d+)\s*层/)
      if (m2 && m2[1]) return `${m2[1]}F`
      return '--'
    },
    isOfflineUnit (item) {
      return !!(item && (item.state === 1 || item.faultCode === 'LOST'))
    },
    toUnitStatus (item) {
      if (this.isOfflineUnit(item)) return 'offline'
      return item && item.powerStatus === 1 ? 'running' : 'standby'
    },
    makeMockSystems () {
      return [
        {
          id: 'SYS-A',
          name: 'A座中央空调',
          building: 'A座',
          status: 'running',
          load: 78,
          units: [
            { id: 'A-301', name: '301会议室', type: 'indoor', status: 'running', temp: 24.5, setTemp: 24, mode: 'cool', floor: '3F' },
            { id: 'A-302', name: '302办公室', type: 'indoor', status: 'running', temp: 25.2, setTemp: 25, mode: 'cool', floor: '3F' },
            { id: 'A-303', name: '303办公室', type: 'indoor', status: 'standby', temp: 26, setTemp: 26, mode: 'fan', floor: '3F' },
            { id: 'A-401', name: '401大厅', type: 'indoor', status: 'running', temp: 23.8, setTemp: 23, mode: 'cool', floor: '4F' },
            { id: 'A-402', name: '402会议室', type: 'indoor', status: 'running', temp: 24.2, setTemp: 24, mode: 'cool', floor: '4F' },
            { id: 'A-501', name: '501办公区', type: 'indoor', status: 'running', temp: 24.8, setTemp: 25, mode: 'cool', floor: '5F' }
          ]
        },
        {
          id: 'SYS-B',
          name: 'B座中央空调',
          building: 'B座',
          status: 'running',
          load: 65,
          units: [
            { id: 'B-201', name: '201大厅', type: 'indoor', status: 'running', temp: 24.8, setTemp: 25, mode: 'cool', floor: '2F' },
            { id: 'B-202', name: '202办公室', type: 'indoor', status: 'running', temp: 25.5, setTemp: 25, mode: 'cool', floor: '2F' },
            { id: 'B-301', name: '301会议室', type: 'indoor', status: 'standby', temp: 26.5, setTemp: 26, mode: 'fan', floor: '3F' },
            { id: 'B-302', name: '302办公区', type: 'indoor', status: 'running', temp: 24.5, setTemp: 24, mode: 'cool', floor: '3F' }
          ]
        },
        {
          id: 'SYS-C',
          name: 'C座中央空调',
          building: 'C座',
          status: 'standby',
          load: 0,
          units: [
            { id: 'C-101', name: '101餐厅', type: 'indoor', status: 'standby', temp: 26, setTemp: 25, mode: 'fan', floor: '1F' },
            { id: 'C-102', name: '102厨房', type: 'indoor', status: 'offline', temp: 28, setTemp: 24, mode: 'cool', floor: '1F' }
          ]
        }
      ]
    },
    async fetchSystems () {
      if (!this.currentManagerId) {
        this.systems = []
        this.selectedSystem = { id: '', name: '-', building: '-', status: 'standby', load: 0, units: [] }
        return
      }

      this.loading = true
      try {
        if (isDemoManager(this.currentManagerId)) {
          const mock = this.makeMockSystems()
          this.systems = mock
          this.selectedSystem = mock[0] || { id: '', name: '-', building: '-', status: 'standby', load: 0, units: [] }
          return
        }

        const [outdoorRes, indoorRes] = await Promise.all([
          pageAirGateWay({
            managerId: this.currentManagerId,
            page: { current: 1, size: 1000 }
          }),
          airInfoListAirInfo({ managerId: this.currentManagerId })
        ])

        const outdoorList = (outdoorRes && outdoorRes.code === 200 && outdoorRes.data)
          ? (outdoorRes.data.dataList || outdoorRes.data.records || [])
          : []
        const indoorList = (indoorRes && indoorRes.code === 200 && indoorRes.data)
          ? indoorRes.data
          : []

        const indoorById = new Map()
        indoorList.forEach(i => {
          if (i && i.id != null) indoorById.set(String(i.id), i)
        })

        const systems = outdoorList.map((g, index) => {
          const rawAirList = this.parseAirList(g && g.airList)
          const units = rawAirList.map((air, idx) => {
            const refId = air && air.id != null ? String(air.id) : null
            const full = refId && indoorById.has(refId) ? indoorById.get(refId) : null
            const source = full || air || {}
            const name = source.name || source.indoorUnitId || source.addr || '--'
            const temp = this.getNumber(source.roomTemperature)
            const setTemp = this.getNumber(source.targetTemperature)
            const floor = source.floor || this.extractFloor(name)
            return {
              id: source.id != null ? String(source.id) : `unit_${index}_${idx}`,
              name,
              type: 'indoor',
              status: this.toUnitStatus(source),
              temp,
              setTemp,
              mode: source.operationMode,
              floor
            }
          })

          const runningCount = units.filter(u => u.status === 'running').length
          const unitCount = units.length
          const load = unitCount ? Math.round((runningCount / unitCount) * 100) : 0

          const gatewayOnline = g && (g.onlineStatus === 0 || g.onlineStatus === '0')
          const status = !gatewayOnline
            ? 'offline'
            : (runningCount > 0 ? 'running' : 'standby')

          return {
            id: (g && (g.id || g.addr)) ? String(g.id || g.addr) : `SYS_${index}`,
            name: (g && (g.name || g.addr)) ? String(g.name || g.addr) : '--',
            building: g && g.addr ? String(g.addr) : '-',
            status,
            load,
            units
          }
        })

        this.systems = systems
        this.selectedSystem = systems[0] || { id: '', name: '-', building: '-', status: 'standby', load: 0, units: [] }
      } catch (e) {
        this.systems = []
        this.selectedSystem = { id: '', name: '-', building: '-', status: 'standby', load: 0, units: [] }
        if (this.$message) this.$message.error('获取空调系统失败')
        console.error(e)
      } finally {
        this.loading = false
      }
    },
    handlePanelClick (e) {
      if (e.target.closest('.remote-btn') || e.target.closest('.system-selector')) return
      this.$router.push({ path: '/device/conditioning', query: { tab: 'outdoor' } })
    }
  }
}
</script>

<style lang="scss" scoped>
.ac-tree-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #F1F5F9;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .icon-box {
    width: 32px;
    height: 32px;
    background: #EEF2F7;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(226, 232, 240, 0.9);

    .icon-img {
      width: 18px;
      height: 18px;
      object-fit: contain;
      display: block;
      opacity: 0.9;
    }
  }

  .title-box {
    h3 {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
    }

    p {
      font-size: 10px;
      color: #94A3B8;
      margin: 2px 0 0;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;

    .status-text {
      font-size: 12px;

      .running {
        color: #10B981;
        font-weight: 600;
      }

      .total {
        color: #94A3B8;
      }
    }
  }

  ::v-deep .remote-btn {
    flex-shrink: 0;
    white-space: nowrap;
  }

  ::v-deep .remote-btn > span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .remote-icon-img {
    width: 14px;
    height: 14px;
    object-fit: contain;
    display: block;
  }
}

.panel-body {
  flex: 1;
  overflow: auto;
  padding: 12px 16px;
}

.system-selector {
  margin-bottom: 12px;

  ::v-deep .el-dropdown {
    width: 100%;
  }

  .selector-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    cursor: pointer;

    &:hover {
      background: #F1F5F9;
    }

    .system-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .system-icon {
      width: 32px;
      height: 32px;
      background: #E2E8F0;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(226, 232, 240, 0.9);

      .system-icon-img {
        width: 14px;
        height: 14px;
        object-fit: contain;
        display: block;
        opacity: 0.9;
      }

      &.active {
        background: rgba(14, 165, 233, 0.10);
      }
    }

    .system-detail {
      .system-name {
        font-size: 13px;
        font-weight: 500;
        color: #1E293B;
        display: block;
      }

      .system-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: #64748B;
        margin-top: 2px;

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;

          &.running { background: #10B981; }
          &.standby { background: #F59E0B; }
          &.offline { background: #94A3B8; }
        }

        .divider {
          color: #CBD5E1;
        }
      }
    }

    .arrow-icon {
      font-size: 12px;
      color: #94A3B8;
    }
  }
}

::v-deep .system-dropdown {
  .el-dropdown-menu__item {
    padding: 10px 16px;
    line-height: normal;

    &.active {
      background: #F0FDFA;
    }
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;

    .system-icon {
      width: 28px;
      height: 28px;
      background: #E2E8F0;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid rgba(226, 232, 240, 0.9);

      .system-icon-img {
        width: 14px;
        height: 14px;
        object-fit: contain;
        display: block;
        opacity: 0.9;
      }

      &.active {
        background: rgba(14, 165, 233, 0.10);
      }
    }

    .system-detail {
      flex: 1;
      min-width: 0;

      .system-name {
        font-size: 13px;
        font-weight: 500;
        color: #1E293B;
        display: block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .system-count {
        font-size: 11px;
        color: #64748B;
        display: block;
      }
    }

    .check-icon {
      font-size: 14px;
      color: #0891B2;
    }
  }
}

.load-progress {
  margin-bottom: 12px;

  .progress-header {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #64748B;
    margin-bottom: 4px;
  }

  .progress-bar {
    height: 5px;
    background: #E2E8F0;
    border-radius: 3px;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;

      &.high { background: #EF4444; }
      &.medium { background: #F59E0B; }
      &.low { background: #10B981; }
    }
  }
}

.units-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.unit-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: white;
  border: 1px solid #F1F5F9;
  border-radius: 10px;

  &:hover {
    border-color: #22D3EE;
    box-shadow: 0 2px 8px rgba(34, 211, 238, 0.1);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &.running {
      background: #10B981;
      &.pulse {
        animation: pulse 1.5s ease-in-out infinite;
      }
    }
    &.standby { background: #F59E0B; }
    &.offline { background: #94A3B8; }
  }

  .mode-icon {
    width: 26px;
    height: 26px;
    background: #F8FAFC;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    border: 1px solid rgba(226, 232, 240, 0.9);
  }

  .mode-icon-img {
    width: 14px;
    height: 14px;
    object-fit: contain;
    display: block;
    opacity: 0.9;
  }

  .unit-info {
    flex: 1;
    min-width: 0;

    .unit-header {
      display: flex;
      align-items: center;
      gap: 6px;

      .unit-name {
        font-size: 12px;
        font-weight: 500;
        color: #1E293B;
      }

      .unit-floor {
        font-size: 9px;
        padding: 1px 6px;
        background: #F1F5F9;
        border-radius: 4px;
        color: #64748B;
      }
    }

    .unit-status {
      font-size: 10px;
      margin-top: 2px;

      &.running { color: #10B981; }
      &.standby { color: #F59E0B; }
      &.offline { color: #94A3B8; }
    }
  }

  .unit-temp {
    text-align: right;
    flex-shrink: 0;

    .current-temp {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 12px;
      font-weight: 500;
      color: #1E293B;

      i {
        font-size: 12px;
        color: #F87171;
      }
    }

    .set-temp {
      font-size: 10px;
      color: #94A3B8;
      margin-top: 1px;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
