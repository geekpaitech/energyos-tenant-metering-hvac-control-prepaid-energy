<template>
    <div class="group-control-page">  
      <div class="control-layout">
        <!-- 左侧控制台 -->
        <div class="control-panel">
          <div class="control-header">
            <h3>群组控制台</h3>
            <div class="selected-info">
              已选择 <span class="selected-count">{{ selectedDevices.length }}</span> 台设备
            </div>
          </div>
  
          <!-- 电源控制 -->
          <div class="control-section">
            <div class="section-header">
              <div class="section-icon power-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10"/>
                </svg>
              </div>
              <h4>电源控制</h4>
            </div>
            <div class="power-controls">
              <button 
                :class="['power-btn', 'power-on', { active: powerMode === 'on' }]"
                @click="setPowerMode('on')"
                :disabled="selectedDevices.length === 0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10"/>
                </svg>
                全部开启
              </button>
              <button 
                :class="['power-btn', 'power-off', { active: powerMode === 'off' }]"
                @click="setPowerMode('off')"
                :disabled="selectedDevices.length === 0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M4.93 4.93l14.14 14.14"/>
                </svg>
                全部关闭
              </button>
            </div>
          </div>
  
          <!-- 温度控制 -->
          <div class="control-section">
            <div class="section-header">
              <div class="section-icon temp-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/>
                </svg>
              </div>
              <h4>温度设定</h4>
            </div>
            <div class="temp-control">
              <div class="temp-display">
                <div class="temp-value">{{ targetTemp }}°C</div>
                <div class="temp-label">目标温度</div>
              </div>
              <div class="temp-controls">
                <button 
                  class="temp-adjust minus"
                  @click="adjustTemp(-1)"
                  :disabled="selectedDevices.length === 0 || targetTemp <= 16"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <div class="temp-range">
                  <input 
                    type="range" 
                    v-model="targetTemp" 
                    min="16" 
                    max="30" 
                    step="1"
                    :disabled="selectedDevices.length === 0"
                    class="temp-slider"
                  />
                  <div class="range-labels">
                    <span>16°</span>
                    <span>30°</span>
                  </div>
                </div>
                <button 
                  class="temp-adjust plus"
                  @click="adjustTemp(1)"
                  :disabled="selectedDevices.length === 0 || targetTemp >= 30"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
  
          <!-- 模式控制 -->
          <div class="control-section">
            <div class="section-header">
              <div class="section-icon mode-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 11h-4l-3 9L9 2l-3 9H2"/>
                </svg>
              </div>
              <h4>运行模式</h4>
            </div>
            <div class="mode-controls">
              <button 
                v-for="mode in modes" 
                :key="mode.value"
                :class="['mode-btn', mode.value, { active: currentMode === mode.value }]"
                @click="setMode(mode.value)"
                :disabled="selectedDevices.length === 0"
              >
                <div class="mode-icon-wrapper">
                  <component :is="getModeIcon(mode.value)"></component>
                </div>
                <span>{{ mode.label }}</span>
              </button>
            </div>
          </div>
  
          <!-- 风速控制 -->
          <div class="control-section">
            <div class="section-header">
              <div class="section-icon wind-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17.7 7.7a2.5 2.5 0 111.8 1.8H2M9.6 4.6A2 2 0 1111 8H2m-2 8h16.5a2.5 2.5 0 11-2.5 2.5"/>
                </svg>
              </div>
              <h4>风速设置</h4>
            </div>
            <div class="wind-controls">
              <button 
                v-for="speed in fanSpeeds" 
                :key="speed.value"
                :class="['wind-btn', speed.value, { active: currentWindSpeed === speed.value }]"
                @click="setWindSpeed(speed.value)"
                :disabled="selectedDevices.length === 0"
              >
                <div class="wind-level">
                  <div v-for="i in getWindLevel(speed.value)" :key="i" class="wind-bar"></div>
                </div>
                <span>{{ speed.label }}</span>
              </button>
            </div>
          </div>
  
          <!-- 应用按钮 -->
          <div class="control-actions">
            <button 
              class="apply-btn"
              @click="applySettings"
              :disabled="selectedDevices.length === 0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
              应用设置 ({{ selectedDevices.length }})
            </button>
          </div>
        </div>
  
        <!-- 右侧设备列表 -->
        <div class="device-list">
          <div class="list-header">
            <div class="header-controls">
              <div class="search-box">
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  placeholder="搜索设备..."
                  @input="handleSearch"
                />
                <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <select v-model="filterArea" @change="applyFilters" class="area-filter">
                <option value="">全部区域</option>
                <option value="A">中心大厦A栋</option>
                <option value="B">创新大厦B栋</option>
              </select>
            </div>
            <div class="selection-controls">
              <button class="select-all-btn" @click="selectAll">
                <input 
                  type="checkbox" 
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                />
                全选
              </button>
              <button class="clear-selection-btn" @click="clearSelection">清空选择</button>
            </div>
          </div>
  
          <div class="device-grid">
            <div 
              v-for="device in filteredDevices" 
              :key="device.id"
              :class="[
                'device-card', 
                { 
                  'selected': selectedDevices.includes(device.id),
                  'offline': !device.online,
                  'fault': device.status === 'fault'
                }
              ]"
              @click="toggleDeviceSelection(device.id)"
            >
              <div class="card-header">
                <div class="device-info">
                  <div class="device-id">{{ device.id }}</div>
                  <div class="device-name">{{ device.name }}</div>
                  <div class="device-location">{{ device.location }}</div>
                </div>
                <div class="device-status">
                  <span :class="['status-dot', getStatusClass(device)]"></span>
                  <span class="status-text">{{ getStatusText(device) }}</span>
                </div>
              </div>
  
              <div class="card-body">
                <div class="temp-info">
                  <div class="current-temp">
                    <span class="temp-value">{{ device.currentTemp }}°</span>
                    <span class="temp-label">当前</span>
                  </div>
                  <div class="target-temp" v-if="device.power">
                    <span class="temp-value">{{ device.setTemp }}°</span>
                    <span class="temp-label">目标</span>
                  </div>
                </div>
  
                <div class="device-controls" v-if="device.power">
                  <div class="control-info">
                    <span class="mode-display">{{ getModeLabel(device.mode) }}</span>
                    <span class="wind-display">{{ getWindLabel(device.fanSpeed) }}</span>
                  </div>
                  <div class="power-indicator running">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                  </div>
                </div>
                
                <div class="device-controls offline-state" v-else>
                  <span class="offline-text">设备待机</span>
                  <div class="power-indicator standby">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                  </div>
                </div>
              </div>
  
              <div class="selection-indicator" v-if="selectedDevices.includes(device.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 成功提示 -->
      <transition name="toast">
        <div v-if="toast.show" :class="['toast', toast.type]">
          {{ toast.message }}
        </div>
      </transition>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ConditioningGroupControl',
    
    data() {
      return {
        // 时间相关
        lastUpdateTime: '',
        updateTimer: null,
        
        // 控制状态
        powerMode: 'on',
        targetTemp: 26,
        currentMode: 'cool',
        currentWindSpeed: 'auto',
        
        // 搜索和筛选
        searchQuery: '',
        filterArea: '',
        
        // 选择状态
        selectedDevices: [],
        
        // 统计数据
        stats: {
          total: 44,
          online: 41,
          running: 28
        },
        
        // 消息提示
        toast: {
          show: false,
          message: '',
          type: 'success'
        },
        
        // 模式选项
        modes: [
          { value: 'cool', label: '制冷' },
          { value: 'heat', label: '制热' },
          { value: 'dry', label: '除湿' },
          { value: 'auto', label: '自动' }
        ],
        
        // 风速选项
        fanSpeeds: [
          { value: 'low', label: '低速' },
          { value: 'mid', label: '中速' },
          { value: 'high', label: '高速' },
          { value: 'auto', label: '自动' }
        ],
        
        // 设备数据
        devices: []
      }
    },
    
    computed: {
      // 过滤后的设备
      filteredDevices() {
        let result = [...this.devices]
        
        // 搜索过滤
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase()
          result = result.filter(device => 
            device.id.toLowerCase().includes(query) ||
            device.name.toLowerCase().includes(query) ||
            device.location.toLowerCase().includes(query)
          )
        }
        
        // 区域过滤
        if (this.filterArea) {
          result = result.filter(device => device.building === this.filterArea)
        }
        
        return result
      },
      
      // 是否全选
      isAllSelected() {
        return this.filteredDevices.length > 0 && 
               this.filteredDevices.every(device => this.selectedDevices.includes(device.id))
      }
    },
    
    mounted() {
      this.initializeData()
      this.startAutoUpdate()
    },
    
    beforeDestroy() {
      this.stopAutoUpdate()
    },
    
    methods: {
      // 初始化数据
      initializeData() {
        this.updateTime()
        this.generateDevicesData()
        this.updateStats()
      },
      
      // 生成设备数据
      generateDevicesData() {
        const devices = []
        let deviceCounter = 1
        
        // A栋设备
        const aFloorAreas = [
          { id: "A1F", name: "1F展销大厅", count: 8, prefix: "展销" },
          { id: "A2F", name: "2F会议接待厅", count: 6, prefix: "会议" },
          { id: "A3F", name: "3F市场营销部", count: 10, prefix: "营销" },
          { id: "A4F", name: "4F技术研发部", count: 12, prefix: "研发" },
          { id: "A5F", name: "5F行政办公室", count: 8, prefix: "行政" }
        ]
        
        aFloorAreas.forEach(area => {
          for (let i = 1; i <= area.count; i++) {
            const device = {
              id: `AC${String(deviceCounter).padStart(3, "0")}`,
              name: `${area.prefix}空调-${String(i).padStart(2, "0")}`,
              building: "A",
              floorArea: area.id,
              location: `中心大厦A栋-${area.name}`,
              online: Math.random() > 0.07,
              power: Math.random() > 0.35,
              status: this.getRandomStatus(),
              currentTemp: Math.floor(Math.random() * 6) + 23,
              setTemp: Math.floor(Math.random() * 6) + 22,
              mode: this.modes[Math.floor(Math.random() * this.modes.length)].value,
              fanSpeed: this.fanSpeeds[Math.floor(Math.random() * this.fanSpeeds.length)].value,
            }
            devices.push(device)
            deviceCounter++
          }
        })
        
        // B栋设备 
        const bFloorAreas = [
          { id: "BB1", name: "B1地下停车库", count: 4, prefix: "停车" },
          { id: "B1F", name: "1F接待大厅", count: 3, prefix: "接待" },
          { id: "B2F", name: "2F餐厅食堂", count: 5, prefix: "餐厅" },
          { id: "B3F", name: "3F技术研发", count: 6, prefix: "研发" }
        ]
        
        bFloorAreas.forEach(area => {
          for (let i = 1; i <= area.count; i++) {
            const device = {
              id: `AC${String(deviceCounter).padStart(3, "0")}`,
              name: `${area.prefix}空调-${String(i).padStart(2, "0")}`,
              building: "B", 
              floorArea: area.id,
              location: `创新大厦B栋-${area.name}`,
              online: Math.random() > 0.07,
              power: Math.random() > 0.35,
              status: this.getRandomStatus(),
              currentTemp: Math.floor(Math.random() * 6) + 23,
              setTemp: Math.floor(Math.random() * 6) + 22,
              mode: this.modes[Math.floor(Math.random() * this.modes.length)].value,
              fanSpeed: this.fanSpeeds[Math.floor(Math.random() * this.fanSpeeds.length)].value,
            }
            devices.push(device)
            deviceCounter++
          }
        })
        
        this.devices = devices
      },
      
      // 获取随机状态
      getRandomStatus() {
        const rand = Math.random()
        if (rand < 0.05) return 'fault'
        if (rand < 0.2) return 'standby'  
        if (rand < 0.3) return 'offline'
        return 'running'
      },
      
      // 更新时间
      updateTime() {
        const now = new Date()
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        this.lastUpdateTime = `${hours}:${minutes}`
      },
      
      // 自动更新
      startAutoUpdate() {
        this.updateTimer = setInterval(() => {
          this.updateTime()
          this.updateStats()
        }, 60000)
      },
      
      stopAutoUpdate() {
        if (this.updateTimer) {
          clearInterval(this.updateTimer)
        }
      },
      
      // 更新统计
      updateStats() {
        const online = this.devices.filter(d => d.online)
        const running = online.filter(d => d.power && d.status === 'running')
        
        this.stats.total = this.devices.length
        this.stats.online = online.length
        this.stats.running = running.length
      },
      
      // 控制方法
      setPowerMode(mode) {
        this.powerMode = mode
      },
      
      adjustTemp(delta) {
        const newTemp = this.targetTemp + delta
        if (newTemp >= 16 && newTemp <= 30) {
          this.targetTemp = newTemp
        }
      },
      
      setMode(mode) {
        this.currentMode = mode
      },
      
      setWindSpeed(speed) {
        this.currentWindSpeed = speed
      },
      
      // 获取模式图标
      getModeIcon(mode) {
        const icons = {
          cool: 'svg',
          heat: 'svg', 
          dry: 'svg',
          auto: 'svg'
        }
        return icons[mode] || 'svg'
      },
      
      // 获取风速等级
      getWindLevel(speed) {
        const levels = {
          low: 1,
          mid: 2, 
          high: 3,
          auto: 2
        }
        return levels[speed] || 1
      },
      
      // 设备选择
      toggleDeviceSelection(deviceId) {
        const index = this.selectedDevices.indexOf(deviceId)
        if (index > -1) {
          this.selectedDevices.splice(index, 1)
        } else {
          this.selectedDevices.push(deviceId)
        }
      },
      
      toggleSelectAll() {
        if (this.isAllSelected) {
          this.selectedDevices = this.selectedDevices.filter(id => 
            !this.filteredDevices.some(device => device.id === id)
          )
        } else {
          this.filteredDevices.forEach(device => {
            if (!this.selectedDevices.includes(device.id)) {
              this.selectedDevices.push(device.id)
            }
          })
        }
      },
      
      selectAll() {
        this.filteredDevices.forEach(device => {
          if (!this.selectedDevices.includes(device.id)) {
            this.selectedDevices.push(device.id)
          }
        })
      },
      
      clearSelection() {
        this.selectedDevices = []
      },
      
      // 状态相关
      getStatusClass(device) {
        if (!device.online) return 'offline'
        if (device.status === 'fault') return 'fault'
        if (device.power) return 'running'
        return 'standby'
      },
      
      getStatusText(device) {
        if (!device.online) return '离线'
        if (device.status === 'fault') return '故障'
        if (device.power) return '运行中'
        return '待机'
      },
      
      getModeLabel(mode) {
        const modeMap = {
          cool: '制冷',
          heat: '制热', 
          dry: '除湿',
          auto: '自动'
        }
        return modeMap[mode] || mode
      },
      
      getWindLabel(speed) {
        const windMap = {
          low: '低速',
          mid: '中速',
          high: '高速', 
          auto: '自动'
        }
        return windMap[speed] || speed
      },
      
      // 搜索和筛选
      handleSearch() {
        // 搜索逻辑已在computed中处理
      },
      
      applyFilters() {
        // 筛选逻辑已在computed中处理
      },
      
      // 应用设置
      applySettings() {
        const selectedCount = this.selectedDevices.length
        this.showToast(`群组设置已应用到 ${selectedCount} 台设备`, 'success')
      },
      
      // 消息提示
      showToast(message, type = 'success') {
        this.toast.message = message
        this.toast.type = type
        this.toast.show = true
        
        setTimeout(() => {
          this.toast.show = false
        }, 3000)
      }
    }
  }
  </script>
  
  <style scoped>
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  .group-control-page {
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  }
  
  /* 页面头部 */
  .page-header {
    background: #fff;
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e5e6eb;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: #1f2329;
  }
  
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
  
  .breadcrumb-item {
    color: #646a73;
  }
  
  .breadcrumb-item.active {
    color: #3370ff;
    font-weight: 500;
  }
  
  .breadcrumb-separator {
    color: #c4c6cc;
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .header-stats {
    display: flex;
    gap: 16px;
    padding-right: 16px;
    border-right: 1px solid #e5e6eb;
  }
  
  .stat-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #646a73;
  }
  
  .stat-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .stat-dot.online {
    background: #00b365;
  }
  
  .stat-dot.running {
    background: #3370ff;
  }
  
  .update-time {
    font-size: 13px;
    color: #8f959e;
  }
  
  /* 主布局 */
  .control-layout {
    display: flex;
    height: calc(100vh - 64px);
  }
  
  /* 左侧控制台 - 调整宽度 */
  .control-panel {
    width: 320px;
    background: #fff;
    border-right: 1px solid #e5e6eb;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  
  /* 控制区块 - 优化内边距 */
  .control-section {
    padding: 20px 16px;
    border-bottom: 1px solid #f0f1f3;
  }
  
  /* 电源控制 - 优化按钮大小 */
  .power-controls {
    display: flex;
    gap: 8px;
  }
  
  .power-btn {
    flex: 1;
    height: 44px;
    border: 2px solid #e5e6eb;
    border-radius: 10px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  /* 温度控制 - 紧凑设计 */
  .temp-display {
    text-align: center;
    padding: 16px;
    background: linear-gradient(135deg, #f8faff, #f0f7ff);
    border-radius: 12px;
    border: 1px solid #e0e9ff;
  }
  
  .temp-value {
    font-size: 28px;
    font-weight: 700;
    color: #3370ff;
    line-height: 1;
  }
  
  .temp-adjust {
    width: 36px;
    height: 36px;
    border: 2px solid #e5e6eb;
    background: #fff;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #646a73;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  
  /* 模式控制 - 优化布局 */
  .mode-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .mode-btn {
    height: 56px;
    border: 2px solid #e5e6eb;
    border-radius: 10px;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #646a73;
  }
  
  .mode-icon-wrapper {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* 风速控制 - 紧凑布局 */
  .wind-controls {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }
  
  .wind-btn {
    height: 48px;
    border: 2px solid #e5e6eb;
    border-radius: 8px;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #646a73;
  }
  
  /* 应用按钮 - 优化大小 */
  .control-actions {
    padding: 16px;
    border-top: 1px solid #f0f1f3;
    margin-top: auto;
  }
  
  .apply-btn {
    width: 100%;
    height: 44px;
    background: linear-gradient(135deg, #3370ff, #2860e1);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(51, 112, 255, 0.3);
  }
  
  /* 设备网格 - 优化卡片大小 */
  .device-grid {
    flex: 1;
    padding: 16px 20px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
    align-content: start;
  }
  
  .device-card {
    background: #fff;
    border: 2px solid #e5e6eb;
    border-radius: 10px;
    padding: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    min-height: 190px;
  }
  
  .power-btn.power-on.active {
    background: #e6f7ff;
    border-color: #00b365;
    color: #00b365;
  }
  
  .power-btn.power-off {
    color: #f54a45;
    border-color: #ffe6e6;
  }
  
  .power-btn.power-off.active {
    background: #ffe6e6;
    border-color: #f54a45;
    color: #f54a45;
  }
  
  /* 温度控制 */
  .temp-control {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .temp-display {
    text-align: center;
    padding: 20px;
    background: linear-gradient(135deg, #f8faff, #f0f7ff);
    border-radius: 16px;
    border: 1px solid #e0e9ff;
  }
  
  .temp-value {
    font-size: 36px;
    font-weight: 700;
    color: #3370ff;
    line-height: 1;
  }
  
  .temp-label {
    font-size: 13px;
    color: #646a73;
    margin-top: 4px;
  }
  
  .temp-controls {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .temp-adjust {
    width: 40px;
    height: 40px;
    border: 2px solid #e5e6eb;
    background: #fff;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #646a73;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  
  .temp-adjust:hover:not(:disabled) {
    border-color: #3370ff;
    color: #3370ff;
    transform: scale(1.05);
  }
  
  .temp-adjust:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }
  
  .temp-range {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .temp-slider {
    width: 100%;
    height: 6px;
    background: #e5e6eb;
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
  }
  
  .temp-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: #3370ff;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(51, 112, 255, 0.3);
  }
  
  .temp-slider:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  .range-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #8f959e;
  }
  
  /* 模式控制 */
  .mode-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .mode-btn {
    height: 64px;
    border: 2px solid #e5e6eb;
    border-radius: 12px;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #646a73;
  }
  
  .mode-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .mode-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }
  
  .mode-btn.active {
    border-color: #3370ff;
    background: #f7f9ff;
    color: #3370ff;
  }
  
  .mode-icon-wrapper {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* 风速控制 */
  .wind-controls {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  
  .wind-btn {
    height: 56px;
    border: 2px solid #e5e6eb;
    border-radius: 10px;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #646a73;
  }
  
  .wind-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .wind-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }
  
  .wind-btn.active {
    border-color: #3370ff;
    background: #f7f9ff;
    color: #3370ff;
  }
  
  .wind-level {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 16px;
  }
  
  .wind-bar {
    width: 3px;
    background: currentColor;
    border-radius: 1px;
  }
  
  .wind-bar:nth-child(1) {
    height: 6px;
  }
  
  .wind-bar:nth-child(2) {
    height: 10px;
  }
  
  .wind-bar:nth-child(3) {
    height: 14px;
  }
  
  /* 应用按钮 */
  .control-actions {
    padding: 24px;
    border-top: 1px solid #f0f1f3;
    margin-top: auto;
  }
  
  .apply-btn {
    width: 100%;
    height: 48px;
    background: linear-gradient(135deg, #3370ff, #2860e1);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(51, 112, 255, 0.3);
  }
  
  .apply-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(51, 112, 255, 0.4);
  }
  
  .apply-btn:disabled {
    background: #bbbfc4;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  /* 右侧设备列表 */
  .device-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .list-header {
    padding: 20px 24px;
    background: #fff;
    border-bottom: 1px solid #e5e6eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .header-controls {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .search-box {
    position: relative;
    width: 240px;
  }
  
  .search-box input {
    width: 100%;
    height: 36px;
    padding: 0 36px 0 12px;
    border: 1px solid #dee0e3;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .search-box input:focus {
    outline: none;
    border-color: #3370ff;
    box-shadow: 0 0 0 2px rgba(51, 112, 255, 0.15);
  }
  
  .search-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #8f959e;
    pointer-events: none;
  }
  
  .area-filter {
    height: 36px;
    padding: 0 12px;
    border: 1px solid #dee0e3;
    border-radius: 8px;
    font-size: 14px;
    color: #1f2329;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .area-filter:focus {
    outline: none;
    border-color: #3370ff;
  }
  
  .selection-controls {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .select-all-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 16px;
    background: #fff;
    border: 1px solid #dee0e3;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .select-all-btn:hover {
    background: #f2f3f5;
    border-color: #bbbfc4;
  }
  
  .clear-selection-btn {
    height: 36px;
    padding: 0 16px;
    background: #fff;
    border: 1px solid #dee0e3;
    border-radius: 8px;
    font-size: 14px;
    color: #f54a45;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .clear-selection-btn:hover {
    background: #fffbfa;
    border-color: #f54a45;
  }
  
  /* 控制台头部 - 优化间距 */
  .control-header {
    padding: 16px 16px;
    border-bottom: 1px solid #f0f1f3;
  }
  
  .control-header h3 {
    font-size: 15px;
    font-weight: 600;
    color: #1f2329;
    margin-bottom: 6px;
  }
  
  .selected-info {
    font-size: 12px;
    color: #646a73;
  }
  
  .selected-count {
    color: #3370ff;
    font-weight: 600;
  }
  
  /* 区块标题 - 紧凑设计 */
  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }
  
  .section-icon {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }
  
  .power-icon {
    background: linear-gradient(135deg, #3370ff, #2860e1);
  }
  
  .temp-icon {
    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  }
  
  .mode-icon {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
  }
  
  .wind-icon {
    background: linear-gradient(135deg, #95a5a6, #7f8c8d);
  }
  
  .section-header h4 {
    font-size: 14px;
    font-weight: 600;
    color: #1f2329;
  }
  
  .device-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
  
  .device-card.selected {
    border-color: #3370ff;
    background: #f7f9ff;
    box-shadow: 0 4px 16px rgba(51, 112, 255, 0.15);
  }
  
  .device-card.offline {
    opacity: 0.6;
  }
  
  .device-card.fault {
    border-color: #f54a45;
    background: #fffbfa;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  
  .device-info .device-id {
    font-size: 11px;
    color: #8f959e;
    font-weight: 500;
    margin-bottom: 2px;
  }
  
  .device-info .device-name {
    font-size: 15px;
    font-weight: 600;
    color: #1f2329;
    margin-bottom: 4px;
  }
  
  .device-info .device-location {
    font-size: 12px;
    color: #646a73;
  }
  
  .device-status {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .status-dot.running {
    background: #00b365;
  }
  
  .status-dot.standby {
    background: #8f959e;
  }
  
  .status-dot.offline {
    background: #bbbfc4;
  }
  
  .status-dot.fault {
    background: #f54a45;
  }
  
  .status-text {
    font-size: 11px;
    color: #646a73;
    font-weight: 500;
  }
  
  .card-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .temp-info {
    display: flex;
    justify-content: space-around;
    padding: 12px;
    background: linear-gradient(135deg, #f8faff, #f0f7ff);
    border-radius: 8px;
  }
  
  .current-temp,
  .target-temp {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  
  .temp-info .temp-value {
    font-size: 18px;
    font-weight: 600;
    color: #1f2329;
  }
  
  .temp-info .temp-label {
    font-size: 10px;
    color: #8f959e;
    font-weight: 500;
  }
  
  .target-temp .temp-value {
    color: #3370ff;
  }
  
  .device-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .control-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .mode-display,
  .wind-display {
    font-size: 12px;
    color: #646a73;
  }
  
  .mode-display {
    font-weight: 500;
  }
  
  .power-indicator {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .power-indicator.running {
    background: #e6f7ff;
    color: #00b365;
  }
  
  .power-indicator.standby {
    background: #f2f3f5;
    color: #8f959e;
  }
  
  .offline-state {
    justify-content: center;
  }
  
  .offline-text {
    font-size: 13px;
    color: #8f959e;
    font-style: italic;
  }
  
  .selection-indicator {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 24px;
    height: 24px;
    background: #3370ff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    animation: scaleIn 0.3s ease;
  }
  
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.5);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  /* 消息提示 */
  .toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    z-index: 2000;
    max-width: 300px;
  }
  
  .toast.success {
    background: #00b365;
  }
  
  .toast.error {
    background: #f54a45;
  }
  
  .toast-enter-active,
  .toast-leave-active {
    transition: all 0.3s ease;
  }
  
  .toast-enter,
  .toast-leave-to {
    opacity: 0;
    transform: translateX(100%);
  }
  
  /* 响应式设计 */
  @media (max-width: 1200px) {
    .control-layout {
      flex-direction: column;
    }
    
    .control-panel {
      width: 100%;
      max-height: 40vh;
    }
    
    .device-grid {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }
  }
  
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      height: auto;
      padding: 16px;
      gap: 12px;
    }
    
    .list-header {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }
    
    .header-controls {
      flex-wrap: wrap;
    }
    
    .search-box {
      width: 100%;
    }
    
    .device-grid {
      grid-template-columns: 1fr;
      padding: 16px;
    }
    
    .mode-controls {
      grid-template-columns: 1fr;
    }
    
    .wind-controls {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  </style>