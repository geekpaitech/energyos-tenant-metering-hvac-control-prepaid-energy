<template>
  <div class="hvac-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="page-title">空调管理</h2>
      <div class="header-actions">
        <span class="update-time">更新时间：{{ lastUpdateTime }}</span>
        <button class="btn-text" @click="refreshData">
          <i class="iconfont icon-refresh"></i>
          刷新
        </button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-label">设备总数</span>
        <span class="stat-value">{{ stats.total }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">在线设备</span>
        <span class="stat-value success">{{ stats.online }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">运行中</span>
        <span class="stat-value primary">{{ stats.running }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">平均温度</span>
        <span class="stat-value">{{ stats.avgTemp }}°C</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">总功率</span>
        <span class="stat-value">{{ stats.totalPower }}kW</span>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <div class="filter-tabs">
          <span 
            v-for="area in areas" 
            :key="area.id"
            :class="['filter-tab', { active: currentArea === area.id }]"
            @click="currentArea = area.id"
          >
            {{ area.name }}
          </span>
        </div>
      </div>
      <div class="filter-right">
        <button class="btn-primary" @click="showBatchControl = true">批量控制</button>
      </div>
    </div>

    <!-- 设备列表容器 -->
    <div class="devices-wrapper">
      <div class="devices-scroll">
        <div class="devices-grid">
          <div 
            v-for="device in currentDevices" 
            :key="device.id"
            :class="['device-item', { offline: !device.online }]"
          >
            <!-- 设备头部 -->
            <div class="device-header">
              <span class="device-name">{{ device.name }}</span>
              <span :class="['status-dot', device.online ? 'online' : 'offline']"></span>
            </div>
            
            <!-- 温度显示区 -->
            <div class="temp-display">
              <div class="temp-current">
                <span class="temp-num">{{ device.currentTemp }}</span>
                <span class="temp-unit">°C</span>
              </div>
              <div class="temp-set">
                <span class="temp-label">当前室温</span>
                <span class="temp-divider">|</span>
                <span class="temp-label">设定 {{ device.setTemp }}°C</span>
              </div>
            </div>
            
            <!-- 模式和状态 -->
            <div class="device-status">
              <span class="mode-label">{{ modeMap[device.mode] }}</span>
              <span class="wind-label">{{ windMap[device.fanSpeed] }}</span>
            </div>
            
            <!-- 控制区 -->
            <div class="device-controls">
              <!-- 电源开关 -->
              <div class="power-switch">
                <label class="switch-control">
                  <input 
                    type="checkbox" 
                    :checked="device.power"
                    @change="togglePower(device)"
                    :disabled="!device.online"
                  >
                  <span class="switch-slider"></span>
                </label>
              </div>
              
              <!-- 快捷操作 -->
              <div class="quick-actions">
                <button 
                  class="icon-btn" 
                  @click="adjustTemp(device, -1)"
                  :disabled="!device.online || !device.power || device.setTemp <= 16"
                  title="降低温度"
                >
                  <i class="iconfont icon-minus"></i>
                </button>
                <button 
                  class="icon-btn" 
                  @click="adjustTemp(device, 1)"
                  :disabled="!device.online || !device.power || device.setTemp >= 30"
                  title="升高温度"
                >
                  <i class="iconfont icon-plus"></i>
                </button>
                <button 
                  class="icon-btn"
                  @click="openDeviceDetail(device)"
                  :disabled="!device.online"
                  title="更多设置"
                >
                  <i class="iconfont icon-setting"></i>
                </button>
              </div>
            </div>
            
            <!-- 底部信息 -->
            <div class="device-info">
              <span class="info-text">{{ device.location }}</span>
              <span class="info-text" v-if="device.power">{{ device.powerUsage }}kW</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量控制弹窗 -->
    <div v-if="showBatchControl" class="modal-mask" @click.self="showBatchControl = false">
      <div class="modal-container">
        <div class="modal-header">
          <h3>批量控制</h3>
          <button class="close-btn" @click="showBatchControl = false">
            <i class="iconfont icon-close"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="batch-section">
            <h4>快速操作</h4>
            <div class="batch-actions">
              <button class="action-btn" @click="batchAction('powerOn')">
                <i class="iconfont icon-power"></i>
                全部开启
              </button>
              <button class="action-btn" @click="batchAction('powerOff')">
                <i class="iconfont icon-poweroff"></i>
                全部关闭
              </button>
              <button class="action-btn" @click="batchAction('setTemp', 26)">
                <i class="iconfont icon-temp"></i>
                设为26°C
              </button>
              <button class="action-btn" @click="batchAction('setMode', 'cool')">
                <i class="iconfont icon-snow"></i>
                制冷模式
              </button>
            </div>
          </div>
          
          <div class="batch-section">
            <h4>定时设置</h4>
            <div class="schedule-form">
              <div class="form-row">
                <label>开启时间</label>
                <input type="time" v-model="schedule.startTime" class="time-input">
              </div>
              <div class="form-row">
                <label>关闭时间</label>
                <input type="time" v-model="schedule.endTime" class="time-input">
              </div>
              <div class="form-row">
                <label>重复</label>
                <div class="weekdays">
                  <span 
                    v-for="day in weekdays" 
                    :key="day.value"
                    :class="['weekday', { selected: schedule.days.includes(day.value) }]"
                    @click="toggleWeekday(day.value)"
                  >
                    {{ day.label }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="batch-section">
            <h4>场景模式</h4>
            <div class="scene-grid">
              <div 
                v-for="scene in scenes" 
                :key="scene.id"
                :class="['scene-card', { active: selectedScene === scene.id }]"
                @click="applyScene(scene)"
              >
                <span>{{ scene.name }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-default" @click="showBatchControl = false">取消</button>
          <button class="btn-primary" @click="saveBatchSettings">确定</button>
        </div>
      </div>
    </div>

    <!-- 设备详情弹窗 -->
    <div v-if="showDeviceDetail" class="modal-mask" @click.self="showDeviceDetail = false">
      <div class="modal-container detail-modal">
        <div class="modal-header">
          <h3>{{ currentDevice.name }} - 详细设置</h3>
          <button class="close-btn" @click="showDeviceDetail = false">
            <i class="iconfont icon-close"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <div class="detail-info">
              <div class="info-row">
                <span class="info-label">当前室温：</span>
                <span class="info-value">{{ currentDevice.currentTemp }}°C</span>
              </div>
              <div class="info-row">
                <span class="info-label">设定温度：</span>
                <span class="info-value primary">{{ tempDeviceSettings.setTemp }}°C</span>
              </div>
            </div>
            
            <div class="detail-row">
              <label>温度设定</label>
              <div class="temp-adjuster">
                <button @click="detailAdjustTemp(-1)" :disabled="tempDeviceSettings.setTemp <= 16">-</button>
                <input type="number" v-model="tempDeviceSettings.setTemp" min="16" max="30">
                <button @click="detailAdjustTemp(1)" :disabled="tempDeviceSettings.setTemp >= 30">+</button>
              </div>
            </div>
            
            <div class="detail-row">
              <label>运行模式</label>
              <div class="mode-selector">
                <span 
                  v-for="mode in modes" 
                  :key="mode.value"
                  :class="['mode-option', { active: tempDeviceSettings.mode === mode.value }]"
                  @click="tempDeviceSettings.mode = mode.value"
                >
                  {{ mode.label }}
                </span>
              </div>
            </div>
            
            <div class="detail-row">
              <label>风速设置</label>
              <div class="wind-selector">
                <span 
                  v-for="speed in fanSpeeds" 
                  :key="speed.value"
                  :class="['wind-option', { active: tempDeviceSettings.fanSpeed === speed.value }]"
                  @click="tempDeviceSettings.fanSpeed = speed.value"
                >
                  {{ speed.label }}
                </span>
              </div>
            </div>
            
            <div class="detail-row">
              <label>扫风设置</label>
              <div class="swing-options">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="tempDeviceSettings.swingH">
                  <span>水平扫风</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="tempDeviceSettings.swingV">
                  <span>垂直扫风</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-default" @click="showDeviceDetail = false">取消</button>
          <button class="btn-primary" @click="saveDeviceSettings">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HvacManagement',
  data() {
    return {
      lastUpdateTime: '',
      currentArea: 'all',
      showBatchControl: false,
      showDeviceDetail: false,
      currentDevice: {},
      tempDeviceSettings: {}, // 临时存储设备设置
      selectedScene: null, // 当前选中的场景
      
      stats: {
        total: 48,
        online: 45,
        running: 32,
        avgTemp: 24.5,
        totalPower: 89.6
      },
      
      areas: [
        { id: 'all', name: '全部' },
        { id: 'A', name: 'A栋' },
        { id: 'B', name: 'B栋' },
        { id: 'C', name: 'C栋' },
        { id: 'D', name: 'D栋' }
      ],
      
      devices: [
        {
          id: 'AC001',
          name: '13-24-1318-2',
          area: 'A',
          location: 'A栋-13层-1318室',
          online: true,
          power: true,
          currentTemp: 26,
          setTemp: 24,
          mode: 'cool',
          fanSpeed: 'mid',
          swingH: false,
          swingV: false,
          powerUsage: 2.8
        },
        {
          id: 'AC002',
          name: '13-24-1319-1',
          area: 'A',
          location: 'A栋-13层-1319室',
          online: true,
          power: true,
          currentTemp: 25,
          setTemp: 23,
          mode: 'cool',
          fanSpeed: 'high',
          swingH: true,
          swingV: false,
          powerUsage: 3.2
        },
        {
          id: 'AC006',
          name: '15-12-1513-2',
          area: 'B',
          location: 'B栋-15层-1513室',
          online: true,
          power: true,
          currentTemp: 24,
          setTemp: 25,
          mode: 'dry',
          fanSpeed: 'low',
          swingH: false,
          swingV: false,
          powerUsage: 1.8
        },
        {
          id: 'AC007',
          name: '16-08-1608-1',
          area: 'B',
          location: 'B栋-16层-1608室',
          online: true,
          power: true,
          currentTemp: 22,
          setTemp: 22,
          mode: 'cool',
          fanSpeed: 'high',
          swingH: true,
          swingV: false,
          powerUsage: 3.5
        },
        {
          id: 'AC008',
          name: '17-05-1705-1',
          area: 'C',
          location: 'C栋-17层-1705室',
          online: true,
          power: false,
          currentTemp: 28,
          setTemp: 26,
          mode: 'fan',
          fanSpeed: 'mid',
          swingH: false,
          swingV: false,
          powerUsage: 0
        },
        {
          id: 'AC009',
          name: '18-03-1803-2',
          area: 'C',
          location: 'C栋-18层-1803室',
          online: true,
          power: true,
          currentTemp: 25,
          setTemp: 24,
          mode: 'cool',
          fanSpeed: 'mid',
          swingH: false,
          swingV: true,
          powerUsage: 2.9
        },
        {
          id: 'AC010',
          name: '19-11-1911-1',
          area: 'D',
          location: 'D栋-19层-1911室',
          online: true,
          power: true,
          currentTemp: 23,
          setTemp: 23,
          mode: 'cool',
          fanSpeed: 'auto',
          swingH: true,
          swingV: true,
          powerUsage: 2.6
        }
      ],
      
      modeMap: {
        cool: '制冷',
        heat: '制热',
        dry: '除湿',
        fan: '送风'
      },
      
      windMap: {
        low: '低风',
        mid: '中风',
        high: '高风',
        auto: '自动'
      },
      
      modes: [
        { value: 'cool', label: '制冷' },
        { value: 'heat', label: '制热' },
        { value: 'dry', label: '除湿' },
        { value: 'fan', label: '送风' }
      ],
      
      fanSpeeds: [
        { value: 'low', label: '低速' },
        { value: 'mid', label: '中速' },
        { value: 'high', label: '高速' },
        { value: 'auto', label: '自动' }
      ],
      
      weekdays: [
        { value: 1, label: '一' },
        { value: 2, label: '二' },
        { value: 3, label: '三' },
        { value: 4, label: '四' },
        { value: 5, label: '五' },
        { value: 6, label: '六' },
        { value: 0, label: '日' }
      ],
      
      schedule: {
        startTime: '08:00',
        endTime: '18:00',
        days: [1, 2, 3, 4, 5]
      },
      
      scenes: [
        { 
          id: 'work', 
          name: '办公模式',
          settings: { temp: 24, mode: 'cool', fanSpeed: 'mid' }
        },
        { 
          id: 'meeting', 
          name: '会议模式',
          settings: { temp: 22, mode: 'cool', fanSpeed: 'high' }
        },
        { 
          id: 'save', 
          name: '节能模式',
          settings: { temp: 26, mode: 'cool', fanSpeed: 'auto' }
        },
        { 
          id: 'comfort', 
          name: '舒适模式',
          settings: { temp: 23, mode: 'cool', fanSpeed: 'low' }
        }
      ]
    }
  },
  
  computed: {
    currentDevices() {
      if (this.currentArea === 'all') {
        return this.devices
      }
      return this.devices.filter(d => d.area === this.currentArea)
    }
  },
  
  mounted() {
    this.updateTime()
    setInterval(this.updateTime, 60000)
    
    // 模拟温度变化
    setInterval(() => {
      this.devices.forEach(device => {
        if (device.online && device.power) {
          const diff = device.setTemp - device.currentTemp
          if (Math.abs(diff) > 0.5) {
            // 制冷/制热速度不同
            const changeRate = device.mode === 'cool' ? -0.3 : 
                             device.mode === 'heat' ? 0.3 : 
                             diff > 0 ? 0.2 : -0.2
            
            // 根据风速调整变化速度
            const speedMultiplier = {
              low: 0.7,
              mid: 1,
              high: 1.3,
              auto: 1
            }
            
            const actualChange = changeRate * speedMultiplier[device.fanSpeed]
            device.currentTemp = Math.round((device.currentTemp + actualChange) * 10) / 10
            
            // 确保不会超过设定温度
            if ((device.mode === 'cool' && device.currentTemp < device.setTemp) ||
                (device.mode === 'heat' && device.currentTemp > device.setTemp)) {
              device.currentTemp = device.setTemp
            }
          }
        }
      })
      this.updateStats()
    }, 5000)
  },
  
  methods: {
    updateTime() {
      const now = new Date()
      this.lastUpdateTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    },
    
    refreshData() {
      this.updateTime()
      // 实际项目中这里调用API
      console.log('刷新数据')
    },
    
    togglePower(device) {
      device.power = !device.power
      if (!device.power) {
        device.powerUsage = 0
      } else {
        device.powerUsage = this.calculatePower(device)
        // 开机时当前温度逐渐变化到设定温度
        if (device.currentTemp !== device.setTemp) {
          // 温度会逐渐变化，这里不立即改变
        }
      }
      this.updateStats()
    },
    
    adjustTemp(device, delta) {
      const newTemp = device.setTemp + delta
      if (newTemp >= 16 && newTemp <= 30) {
        device.setTemp = newTemp
        if (device.power) {
          device.powerUsage = this.calculatePower(device)
        }
      }
    },
    
    openDeviceDetail(device) {
      this.currentDevice = device
      // 创建临时设置对象
      this.tempDeviceSettings = {
        setTemp: device.setTemp,
        mode: device.mode,
        fanSpeed: device.fanSpeed,
        swingH: device.swingH,
        swingV: device.swingV
      }
      this.showDeviceDetail = true
    },
    
    detailAdjustTemp(delta) {
      const newTemp = this.tempDeviceSettings.setTemp + delta
      if (newTemp >= 16 && newTemp <= 30) {
        this.tempDeviceSettings.setTemp = newTemp
      }
    },
    
    saveDeviceSettings() {
      // 保存设置到实际设备
      Object.assign(this.currentDevice, this.tempDeviceSettings)
      if (this.currentDevice.power) {
        this.currentDevice.powerUsage = this.calculatePower(this.currentDevice)
      }
      this.showDeviceDetail = false
      this.updateStats()
    },
    
    calculatePower(device) {
      const baseMap = { cool: 3, heat: 3.5, dry: 2, fan: 0.5 }
      const speedMap = { low: 0.8, mid: 1, high: 1.2, auto: 1 }
      return (baseMap[device.mode] * speedMap[device.fanSpeed]).toFixed(1)
    },
    
    updateStats() {
      const online = this.devices.filter(d => d.online)
      const running = online.filter(d => d.power)
      
      this.stats.online = online.length
      this.stats.running = running.length
      this.stats.totalPower = running.reduce((sum, d) => sum + parseFloat(d.powerUsage), 0).toFixed(1)
      
      if (running.length > 0) {
        this.stats.avgTemp = (running.reduce((sum, d) => sum + d.currentTemp, 0) / running.length).toFixed(1)
      }
    },
    
    toggleWeekday(day) {
      const index = this.schedule.days.indexOf(day)
      if (index > -1) {
        this.schedule.days.splice(index, 1)
      } else {
        this.schedule.days.push(day)
      }
    },
    
    batchAction(action, value) {
      this.currentDevices.forEach(device => {
        if (device.online) {
          switch(action) {
            case 'powerOn':
              device.power = true
              device.powerUsage = this.calculatePower(device)
              break
            case 'powerOff':
              device.power = false
              device.powerUsage = 0
              break
            case 'setTemp':
              device.setTemp = value
              break
            case 'setMode':
              device.mode = value
              if (device.power) {
                device.powerUsage = this.calculatePower(device)
              }
              break
          }
        }
      })
      this.updateStats()
    },
    
    applyScene(scene) {
      this.selectedScene = scene.id
      
      // 应用场景设置到当前区域的所有在线设备
      this.currentDevices.forEach(device => {
        if (device.online) {
          device.power = true
          device.setTemp = scene.settings.temp
          device.mode = scene.settings.mode
          device.fanSpeed = scene.settings.fanSpeed
          device.powerUsage = this.calculatePower(device)
        }
      })
      
      this.updateStats()
      console.log('应用场景:', scene.name)
    },
    
    saveBatchSettings() {
      console.log('保存批量设置')
      this.showBatchControl = false
      this.selectedScene = null // 重置选中的场景
    }
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

/* 基础样式 */
.hvac-management {
  min-height: 100vh;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
}

/* 页面头部 */
.page-header {
  background: #fff;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 500;
  color: #000;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.update-time {
  font-size: 14px;
  color: #999;
}

.btn-text {
  background: none;
  border: none;
  color: #1890ff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-text:hover {
  background-color: #e6f7ff;
}

/* 统计信息行 */
.stats-row {
  background: #fff;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #e8e8e8;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.stat-value {
  font-size: 24px;
  font-weight: 500;
  color: #000;
}

.stat-value.success {
  color: #52c41a;
}

.stat-value.primary {
  color: #1890ff;
}

/* 筛选栏 */
.filter-bar {
  background: #fff;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-tabs {
  display: flex;
  gap: 24px;
}

.filter-tab {
  font-size: 14px;
  color: #666;
  cursor: pointer;
  padding-bottom: 2px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.filter-tab:hover {
  color: #1890ff;
}

.filter-tab.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
}

.btn-primary {
  background: #1890ff;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background: #40a9ff;
}

/* 设备列表 */
.devices-wrapper {
  padding: 16px 24px;
  height: calc(100vh - 250px);
}

.devices-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.devices-scroll::-webkit-scrollbar {
  width: 6px;
}

.devices-scroll::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 3px;
}

.devices-scroll::-webkit-scrollbar-thumb {
  background: #bfbfbf;
  border-radius: 3px;
}

.devices-scroll::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* 设备卡片 */
.device-item {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  border: 1px solid #e8e8e8;
  transition: all 0.2s;
}

.device-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.device-item.offline {
  opacity: 0.6;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.device-name {
  font-size: 14px;
  font-weight: 500;
  color: #000;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: #52c41a;
}

.status-dot.offline {
  background: #d9d9d9;
}

/* 温度显示 */
.temp-display {
  text-align: center;
  margin-bottom: 12px;
}

.temp-current {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 4px;
}

.temp-num {
  font-size: 32px;
  font-weight: 300;
  color: #000;
}

.temp-unit {
  font-size: 16px;
  color: #666;
  margin-left: 2px;
}

.temp-set {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 8px;
}

.temp-label {
  color: #666;
}

.temp-divider {
  color: #d9d9d9;
}

/* 设备状态 */
.device-status {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.mode-label,
.wind-label {
  font-size: 12px;
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 2px;
  color: #666;
}

/* 控制区域 */
.device-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

/* 开关样式 */
.switch-control {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.switch-control input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #bfbfbf;
  transition: .3s;
  border-radius: 20px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .switch-slider {
  background-color: #1890ff;
}

input:checked + .switch-slider:before {
  transform: translateX(20px);
}

input:disabled + .switch-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 快捷操作按钮 */
.quick-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.icon-btn:hover:not(:disabled) {
  border-color: #1890ff;
  color: #1890ff;
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 设备信息 */
.device-info {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.info-text {
  font-size: 12px;
  color: #999;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: #fff;
  border-radius: 4px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.detail-modal {
  max-width: 480px;
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 500;
  color: #000;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #666;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 批量控制内容 */
.batch-section {
  margin-bottom: 24px;
}

.batch-section:last-child {
  margin-bottom: 0;
}

.batch-section h4 {
  font-size: 14px;
  font-weight: 500;
  color: #000;
  margin: 0 0 12px 0;
}

.batch-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-btn {
  padding: 12px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
  background: #e6f7ff;
}

/* 定时设置 */
.schedule-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.form-row label {
  width: 80px;
  font-size: 14px;
  color: #666;
}

.time-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.weekdays {
  display: flex;
  gap: 8px;
}

.weekday {
  width: 32px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.weekday:hover {
  border-color: #1890ff;
}

.weekday.selected {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

/* 场景模式 */
.scene-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.scene-card {
  padding: 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.scene-card:hover {
  border-color: #1890ff;
  background: #e6f7ff;
}

.scene-card.active {
  background: #1890ff;
  border-color: #1890ff;
}

.scene-card.active span {
  color: #fff;
}

.scene-card span {
  font-size: 14px;
  color: #666;
}

/* 设备详情 */
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-info {
  background: #f5f6f8;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-row:first-child {
  padding-top: 0;
}

.info-row:last-child {
  padding-bottom: 0;
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 18px;
  font-weight: 500;
  color: #000;
}

.info-value.primary {
  color: #1890ff;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-row label {
  width: 80px;
  font-size: 14px;
  color: #666;
}

.temp-adjuster {
  display: flex;
  align-items: center;
  gap: 8px;
}

.temp-adjuster button {
  width: 32px;
  height: 32px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  color: #666;
  transition: all 0.2s;
}

.temp-adjuster button:hover:not(:disabled) {
  border-color: #1890ff;
  color: #1890ff;
}

.temp-adjuster button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.temp-adjuster input {
  width: 80px;
  text-align: center;
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 16px;
}

.mode-selector,
.wind-selector {
  display: flex;
  gap: 8px;
}

.mode-option,
.wind-option {
  padding: 6px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-option:hover,
.wind-option:hover {
  border-color: #1890ff;
}

.mode-option.active,
.wind-option.active {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.swing-options {
  display: flex;
  gap: 24px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 按钮样式 */
.btn-default {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-default:hover {
  border-color: #1890ff;
  color: #1890ff;
}

/* 图标字体（模拟） */
.iconfont {
  font-style: normal;
  -webkit-font-smoothing: antialiased;
}

.icon-refresh:before { content: "⟲"; }
.icon-minus:before { content: "−"; }
.icon-plus:before { content: "+"; }
.icon-setting:before { content: "⚙"; }
.icon-close:before { content: "×"; font-size: 20px; }
.icon-power:before { content: "◉"; }
.icon-poweroff:before { content: "◯"; }
.icon-temp:before { content: "°"; }
.icon-snow:before { content: "❄"; }

/* 响应式适配 */
@media (max-width: 1400px) {
  .devices-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .devices-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-value {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .devices-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-row {
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .batch-actions {
    grid-template-columns: 1fr;
  }
  
  .scene-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>