<template>
  <el-dialog
    :visible.sync="visibleProxy"
    width="520px"
    :show-close="false"
    :close-on-click-modal="true"
    :modal="true"
    append-to-body
    modal-class="remote-modal-overlay"
    custom-class="remote-modal"
  >
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="icon-box">
            <img class="header-icon-img" :src="headerIcon" alt="" />
          </div>
          <div class="title-box">
            <h3>空调遥控器</h3>
            <p>远程控制 · 实时监控</p>
          </div>
        </div>
        <i class="el-icon-close close-btn" @click="handleClose"></i>
      </div>

      <!-- Device Selector -->
      <div class="device-selector">
        <i class="el-icon-arrow-left nav-btn" @click="prevDevice"></i>
        <div class="device-info">
          <p class="device-name">{{ selectedDevice.name }}</p>
          <p class="device-meta">{{ deviceMetaText }}</p>
        </div>
        <i class="el-icon-arrow-right nav-btn" @click="nextDevice"></i>
      </div>

      <!-- Device Dots -->
      <div class="device-dots">
        <span
          v-for="(_, idx) in devices"
          :key="idx"
          :class="['dot', { active: idx === deviceIndex }]"
        ></span>
      </div>

      <!-- Main Control -->
      <div class="control-area">
        <!-- Left: Temperature Display -->
        <div class="temp-display">
          <div class="temp-screen">
            <div class="screen-header">
              <div class="screen-left-icons">
                <img class="screen-state-icon" :src="screenStatusIcon" alt="" />
                <img v-if="screenModeIconSrc" class="screen-mode-icon" :src="screenModeIconSrc" alt="" />
                <i v-else-if="screenModeElIcon" :class="screenModeElIcon"></i>
              </div>
              <div class="screen-icons">
                <i v-if="false" class="el-icon-time timer-icon"></i>
                <i v-if="false" class="el-icon-refresh swing-icon"></i>
              </div>
            </div>
            <div class="temp-value">{{ setTempText }}</div>
            <div class="room-temp">室温 {{ roomTempText }}</div>
          </div>

          <!-- Mode Buttons -->
          <div class="mode-buttons">
            <button
              v-for="mode in modes"
              :key="mode.key"
              :class="['mode-btn', { active: selectedDevice.operationMode === mode.key && selectedDevice.isOn }]"
              :disabled="!canControl"
              @click="setMode(mode.key)"
            >
              <template v-if="mode.key === 2">
                <img class="mode-icon-img" :src="acIcons.refrigeration" alt="" />
              </template>
              <template v-else-if="mode.key === 4">
                <img class="mode-icon-img" :src="acIcons.speed" alt="" />
              </template>
              <template v-else-if="mode.key === 8">
                <img class="mode-icon-img" :src="acIcons.gz" alt="" />
              </template>
              <template v-else>
                <i :class="mode.icon"></i>
              </template>
            </button>
          </div>

          <!-- Temp Controls -->
          <div class="temp-controls">
            <button class="temp-btn" :disabled="!canControl" @click="changeTemp(-1)">
              <i class="el-icon-minus"></i>
            </button>
            <span class="temp-label">温度</span>
            <button class="temp-btn" :disabled="!canControl" @click="changeTemp(1)">
              <i class="el-icon-plus"></i>
            </button>
          </div>

          <!-- Power Button -->
          <button
            :class="['power-btn', selectedDevice.isOn ? 'off' : 'on']"
            :disabled="!canTogglePower"
            @click="togglePower"
          >
            {{ hasDevices ? (selectedDevice.isOn ? '关机' : '开机') : '--' }}
          </button>
        </div>

        <!-- Right: Settings -->
        <div class="settings-area">
          <!-- Fan Speed -->
          <div class="setting-group">
            <p class="setting-label">
              <img class="label-icon-img" :src="acIcons.speed" alt="" />
              <span>风速调节</span>
            </p>
            <div class="fan-speeds">
              <button
                v-for="speed in fanSpeeds"
                :key="speed.key"
                :class="['speed-btn', { active: selectedDevice.fanSpeed === speed.key && selectedDevice.isOn }]"
                :disabled="!canControl"
                @click="setFanSpeed(speed.key)"
              >
                {{ speed.label }}
              </button>
            </div>
          </div>

          <!-- Function Settings -->
          <div class="setting-group">
            <p class="setting-label">功能设置</p>
            <div class="function-buttons">
              <button
                :class="['func-btn']"
                disabled
                @click="toggleSwing"
              >
                <i class="el-icon-refresh"></i> 摆风 --
              </button>
              <button
                :class="['func-btn']"
                disabled
                @click="toggleTimer"
              >
                <i class="el-icon-time"></i> 定时 --
              </button>
            </div>
          </div>

          <!-- Status Info -->
          <div class="status-info">
            <div class="status-row">
              <div class="status-item">
                <span class="status-label">状态</span>
                <span :class="['status-value', statusClass]">
                  {{ statusText }}
                </span>
              </div>
              <div class="status-item">
                <span class="status-label">模式</span>
                <span class="status-value">{{ modeText }}</span>
              </div>
            </div>
            <div class="status-row">
              <div class="status-item">
                <span class="status-label">风速</span>
                <span class="status-value">{{ fanSpeedText }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">设温</span>
                <span class="status-value">{{ targetTempValueText }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { airInfoControlAir, airInfoPageAir } from '@/api/airCondition'
import { mapGetters, mapState } from 'vuex'

export default {
  name: 'RemoteModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      deviceIndex: 0,
      devices: [],
      loading: false,
      emptyDevice: {
        id: null,
        name: '--',
        addr: null,
        gatewayId: null,
        indoorUnitId: null,
        state: null,
        powerStatus: null,
        operationMode: null,
        targetTemperature: null,
        roomTemperature: null,
        fanSpeed: null,
        isOn: false,
        runtime: '--',
        todayEnergy: '--'
      },
      modes: [
        { key: 2, icon: 'el-icon-snowflake' },
        { key: 1, icon: 'el-icon-sunny' },
        { key: 4, icon: 'el-icon-wind-power' },
        { key: 8, icon: 'el-icon-water-cup' }
      ],
      fanSpeeds: [
        { key: 1, label: '低风' },
        { key: 2, label: '中风' },
        { key: 3, label: '高风' },
        { key: 0, label: '自动' }
      ]
    }
  },
  watch: {
    visible (val) {
      if (val) {
        this.fetchDevices()
      }
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapState('enumData', ['operationMode', 'fanSpeed']),
    enums () {
      return {
        operationMode: this.operationMode || [
          { value: 0, label: '自动' },
          { value: 1, label: '制热' },
          { value: 2, label: '制冷' },
          { value: 4, label: '送风' },
          { value: 8, label: '除湿' }
        ],
        fanSpeed: this.fanSpeed || [
          { value: 0, label: '自动' },
          { value: 1, label: '低风' },
          { value: 2, label: '中风' },
          { value: 3, label: '高风' }
        ]
      }
    },
    visibleProxy: {
      get () {
        return this.visible
      },
      set (val) {
        this.$emit('update:visible', val)
      }
    },
    selectedDevice () {
      return this.devices[this.deviceIndex] || this.emptyDevice
    },
    hasDevices () {
      return this.devices.length > 0
    },
    targetTempDisplayText () {
      if (!this.hasDevices) return '--'
      const v = this.selectedDevice.targetTemperature
      if (v === null || v === undefined || v === '') return '--'
      return `${v}℃`
    },
    roomTempDisplayText () {
      if (!this.hasDevices) return '--'
      const v = this.selectedDevice.roomTemperature
      if (v === null || v === undefined || v === '') return '--'
      return `${v}℃`
    },
    deviceMetaText () {
      return `设置温度 ${this.targetTempDisplayText} · 室温 ${this.roomTempDisplayText}`
    },
    targetTempValueText () {
      if (!this.hasDevices) return '--'
      const v = this.selectedDevice.targetTemperature
      if (v === null || v === undefined || v === '') return '--'
      return `${v} ℃`
    },
    setTempText () {
      if (!this.hasDevices) return '--'
      if (this.isOffline || !this.selectedDevice.isOn) return '--'
      const v = this.selectedDevice.targetTemperature
      if (v === null || v === undefined || v === '') return '--'
      return `${v}°`
    },
    roomTempText () {
      if (!this.hasDevices) return '--'
      const v = this.selectedDevice.roomTemperature
      if (v === null || v === undefined || v === '') return '--'
      return `${v}°`
    },
    statusText () {
      if (!this.hasDevices) return '--'
      return this.selectedDevice.isOn ? '运行中' : '已关闭'
    },
    statusClass () {
      if (!this.hasDevices) return 'stopped'
      return this.selectedDevice.isOn ? 'running' : 'stopped'
    },
    modeText () {
      if (!this.hasDevices) return '--'
      const enumArray = this.enums.operationMode || []
      const enumItem = enumArray.find(e => e.value === this.selectedDevice.operationMode)
      return enumItem ? enumItem.label : '--'
    },
    fanSpeedText () {
      if (!this.hasDevices) return '--'
      const enumArray = this.enums.fanSpeed || []
      const enumItem = enumArray.find(e => e.value === this.selectedDevice.fanSpeed)
      return enumItem ? enumItem.label : '--'
    },
    acIcons () {
      return {
        standby: require('@/assets/ac/standby.png'),
        offline: require('@/assets/ac/offline.png'),
        speed: require('@/assets/ac/speed.png'),
        run: require('@/assets/ac/run.png'),
        refrigeration: require('@/assets/ac/refrigeration.png'),
        gz: require('@/assets/ac/gz.png')
      }
    },
    isOffline () {
      const d = this.selectedDevice || {}
      return d.status === 'offline' || d.offline === true || d.isOffline === true || d.state === 1
    },
    canTogglePower () {
      return this.hasDevices && !this.isOffline
    },
    canControl () {
      return this.hasDevices && !this.isOffline && this.selectedDevice.isOn
    },
    screenStatusIcon () {
      if (!this.selectedDevice) return this.acIcons.standby
      if (this.isOffline) return this.acIcons.offline
      if (!this.selectedDevice.isOn) return this.acIcons.standby
      return this.acIcons.run
    },
    screenModeIconSrc () {
      if (!this.selectedDevice || this.isOffline || !this.selectedDevice.isOn) return null
      if (this.selectedDevice.operationMode === 2) return this.acIcons.refrigeration
      if (this.selectedDevice.operationMode === 4) return this.acIcons.speed
      if (this.selectedDevice.operationMode === 8) return this.acIcons.gz
      return null
    },
    screenModeElIcon () {
      if (!this.selectedDevice || this.isOffline || !this.selectedDevice.isOn) return null
      if (this.selectedDevice.operationMode === 1) return 'el-icon-sunny screen-mode-el heat'
      return null
    },
    headerIcon () {
      if (!this.selectedDevice) return this.acIcons.standby
      if (this.isOffline) return this.acIcons.offline
      if (!this.selectedDevice.isOn) return this.acIcons.standby
      return this.screenModeIconSrc || this.acIcons.run
    }
  },
  methods: {
    handleClose () {
      this.visibleProxy = false
    },
    prevDevice () {
      if (!this.hasDevices) return
      this.deviceIndex = this.deviceIndex === 0 ? this.devices.length - 1 : this.deviceIndex - 1
    },
    nextDevice () {
      if (!this.hasDevices) return
      this.deviceIndex = this.deviceIndex === this.devices.length - 1 ? 0 : this.deviceIndex + 1
    },
    buildQuery () {
      return {
        managerId: this.currentManagerId,
        page: {
          current: 1,
          size: 5,
          orders: [{
            asc: false,
            column: 'createTime'
          }]
        }
      }
    },
    async fetchDevices () {
      if (!this.currentManagerId) {
        this.devices = []
        this.deviceIndex = 0
        return
      }

      this.loading = true
      try {
        const response = await airInfoPageAir(this.buildQuery())
        if (response.code !== 200) {
          throw new Error(response.msg || '获取空调列表失败')
        }
        const dataList = (response.data && response.data.dataList) ? response.data.dataList : []
        this.devices = (dataList || []).map(d => this.normalizeDevice(d))
        this.deviceIndex = 0
      } catch (e) {
        this.devices = []
        this.deviceIndex = 0
        this.$apiError.notify(e, '获取空调列表失败')
      } finally {
        this.loading = false
      }
    },
    normalizeDevice (raw) {
      const id = raw && (raw.id || raw.airId) ? (raw.id || raw.airId) : null
      const powerStatus = raw && raw.powerStatus !== null && raw.powerStatus !== undefined ? raw.powerStatus : 0
      const operationMode = raw && raw.operationMode !== null && raw.operationMode !== undefined ? raw.operationMode : null
      const fanSpeed = raw && raw.fanSpeed !== null && raw.fanSpeed !== undefined ? raw.fanSpeed : null
      const targetTemperature = raw && raw.targetTemperature !== null && raw.targetTemperature !== undefined ? raw.targetTemperature : null
      const roomTemperature = raw && raw.roomTemperature !== null && raw.roomTemperature !== undefined ? raw.roomTemperature : null
      const state = raw && raw.state !== null && raw.state !== undefined ? raw.state : 0

      return {
        ...raw,
        id,
        name: raw && raw.name ? raw.name : '--',
        state,
        powerStatus,
        operationMode,
        fanSpeed,
        targetTemperature,
        roomTemperature,
        isOn: powerStatus === 1,
        runtime: null,
        todayEnergy: null
      }
    },
    async controlSelected (type, value) {
      if (!this.hasDevices) return
      const item = this.selectedDevice
      if (item.state === 1) {
        this.$message.warning('设备离线，无法控制')
        return
      }
      if (item.powerStatus === 0 && type !== 'power') {
        this.$message.warning('设备未开机，请先开机后再进行其他操作')
        return
      }

      const params = {
        addr: item.addr,
        airId: item.id,
        gatewayId: item.gatewayId,
        indoorUnitId: item.indoorUnitId,
        powerStatus: item.powerStatus ?? 0,
        operationMode: item.operationMode ?? 2,
        targetTemperature: item.targetTemperature ?? 24,
        fanSpeed: item.fanSpeed ?? 0
      }

      switch (type) {
        case 'power':
          params.powerStatus = params.powerStatus === 1 ? 0 : 1
          break
        case 'mode':
          params.operationMode = parseInt(value)
          break
        case 'fan':
          params.fanSpeed = parseInt(value)
          break
        case 'temp':
          const newTemp = (params.targetTemperature || 24) + value
          if (newTemp < 16) {
            this.$message.warning('最低温度不能低于16℃')
            return
          }
          if (newTemp > 31) {
            this.$message.warning('最高温度不能高于31℃')
            return
          }
          params.targetTemperature = newTemp
          break
      }

      try {
        const response = await airInfoControlAir(params)
        if (response.code === 200) {
          this.$message.success(response.msg || '控制成功')
          const id = item.id
          await this.fetchDevices()
          const idx = this.devices.findIndex(d => d.id === id)
          this.deviceIndex = idx >= 0 ? idx : 0
        } else {
          this.$message.error(response.msg || '控制失败')
        }
      } catch (error) {
        this.$message.error('控制失败')
      }
    },
    setMode (mode) {
      this.controlSelected('mode', mode)
    },
    setFanSpeed (speed) {
      this.controlSelected('fan', speed)
    },
    changeTemp (delta) {
      this.controlSelected('temp', delta)
    },
    togglePower () {
      this.controlSelected('power')
    },
    toggleSwing () {

    },
    toggleTimer () {

    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .remote-modal-overlay {
  background: rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(2px);
}

::v-deep .remote-modal {
  position: fixed !important;
  right: 24px !important;
  bottom: 24px !important;
  top: auto !important;
  left: auto !important;
  transform: none !important;
  margin: 0 !important;
  margin-top: 0 !important;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
  max-width: calc(100vw - 48px) !important;

  .el-dialog__header {
    display: none;
  }

  .el-dialog__body {
    padding: 10px;
    background: linear-gradient(180deg, #F8FAFC 0%, #E2E8F0 100%);
  }
}

.modal-content {
  background: #FFFFFF;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.45);
  box-shadow:
    0 10px 28px rgba(15, 23, 42, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(90deg, #06B6D4 0%, #0EA5E9 100%);

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .icon-box {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.18);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    .header-icon-img {
      width: 18px;
      height: 18px;
      object-fit: contain;
      display: block;
      filter: brightness(0) saturate(100%) invert(100%);
      opacity: 0.92;
    }
  }

  .title-box {
    h3 {
      font-size: 14px;
      font-weight: 600;
      color: white;
      margin: 0;
    }

    p {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.7);
      margin: 2px 0 0;
    }
  }

  .close-btn {
    font-size: 18px;
    color: white;
    cursor: pointer;
    padding: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }
  }
}

.device-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #F1F5F9;

  .nav-btn {
    font-size: 18px;
    color: #64748B;
    cursor: pointer;
    padding: 8px;

    &:hover {
      background: #F8FAFC;
      border-radius: 8px;
    }
  }

  .device-info {
    text-align: center;

    .device-name {
      font-size: 14px;
      font-weight: 600;
      color: #1E293B;
      margin: 0 0 4px;
    }

    .device-meta {
      font-size: 10px;
      color: #94A3B8;
      margin: 0;
    }
  }
}

.device-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F1F5F9;

  .dot {
    width: 6px;
    height: 6px;
    background: #E2E8F0;
    border-radius: 50%;

    &.active {
      background: #0EA5E9;
    }
  }
}

.control-area {
  display: flex;
  gap: 14px;
  padding: 14px;
  background: transparent;
}

.temp-display {
  width: 164px;
  flex-shrink: 0;
  padding: 10px;
  border-radius: 20px;
  border: 1px solid #CBD5E1;
  background: linear-gradient(180deg, #F8FAFC 0%, #E2E8F0 100%);
  position: relative;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    inset 0 -12px 18px rgba(15, 23, 42, 0.06),
    0 10px 24px rgba(15, 23, 42, 0.10);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
    pointer-events: none;
  }

  .temp-screen {
    background: linear-gradient(180deg, #0F172A 0%, #1F2937 100%);
    border-radius: 14px;
    padding: 12px;
    margin-bottom: 12px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 10px 18px rgba(15, 23, 42, 0.20);

    .screen-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .screen-left-icons {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .screen-state-icon,
      .screen-mode-icon {
        width: 14px;
        height: 14px;
        object-fit: contain;
        display: block;
      }

      .screen-mode-el {
        font-size: 14px;

        &.heat { color: #F87171; }
        &.dry { color: #60A5FA; }
      }

      .screen-icons {
        display: flex;
        gap: 4px;

        .timer-icon { color: #FBBF24; }
        .swing-icon { color: #22D3EE; }
      }
    }

    .temp-value {
      font-size: 34px;
      font-weight: 800;
      color: white;
      text-align: center;
      font-family: 'JetBrains Mono', monospace;
    }

    .room-temp {
      font-size: 10px;
      color: #94A3B8;
      text-align: center;
      margin-top: 4px;
    }
  }

  .mode-buttons {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    margin-bottom: 10px;

    .mode-btn {
      height: 28px;
      border: 1px solid rgba(226, 232, 240, 0.95);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      .mode-icon-img {
        width: 14px;
        height: 14px;
        object-fit: contain;
        display: block;
      }

      i {
        font-size: 12px;
        color: #64748B;
      }

      &.active {
        background: #06B6D4;
        border-color: #06B6D4;

        i { color: white; }
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .temp-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    .temp-btn {
      width: 30px;
      height: 30px;
      border: 1px solid rgba(226, 232, 240, 0.95);
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 6px 14px rgba(15, 23, 42, 0.10);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 10px;
        color: #475569;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .temp-label {
      font-size: 11px;
      color: #64748B;
    }
  }

  .power-btn {
    width: 100%;
    height: 36px;
    border: none;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    color: white;
    cursor: pointer;

    &.on {
      background: #10B981;
    }

    &.off {
      background: #EF4444;
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }
}

.settings-area {
  flex: 1;
  background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);

  .setting-group {
    margin-bottom: 14px;

    .setting-label {
      font-size: 11px;
      color: #64748B;
      margin: 0 0 6px;
      display: flex;
      align-items: center;
      gap: 6px;

      .label-icon-img {
        width: 12px;
        height: 12px;
        object-fit: contain;
        display: block;
      }
    }

    .fan-speeds {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;

      .speed-btn {
        height: 32px;
        border: 1px solid #E2E8F0;
        border-radius: 999px;
        background: #FFFFFF;
        font-size: 12px;
        color: #475569;
        cursor: pointer;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);

        &.active {
          background: #0EA5E9;
          border-color: #0EA5E9;
          color: white;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .function-buttons {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;

      .func-btn {
        height: 36px;
        border: 1px solid #E2E8F0;
        border-radius: 12px;
        background: #FFFFFF;
        font-size: 12px;
        color: #475569;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);

        i {
          font-size: 12px;
        }

        &.active {
          background: rgba(14, 165, 233, 0.12);
          border-color: rgba(14, 165, 233, 0.45);
          color: #0284C7;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }

  .status-info {
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(226, 232, 240, 0.9);
    border-radius: 12px;
    padding: 12px;

    .status-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 6px;

      .status-label {
        font-size: 10px;
        color: #64748B;
      }

      .status-value {
        font-size: 10px;
        font-weight: 500;
        color: #1E293B;

        &.running {
          color: #10B981;
        }

        &.stopped {
          color: #94A3B8;
        }
      }
    }
  }
}
</style>
