<template>
  <div class="lock-management">
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <div class="left-section">
        <h2 class="page-title">智能门锁管理</h2>
      </div>
      <div class="right-section">
        <el-button size="small" @click="showBatchControl = true">批量控制</el-button>
        <el-button size="small" @click="showTempPassword = true">临时密码</el-button>
        <el-button type="primary" size="small" @click="showAddDialog = true">
          <i class="el-icon-plus"></i> 添加设备
        </el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧楼层导航 -->
      <div class="building-nav">
        <div class="nav-header">
          <span>楼栋导航</span>
          <el-input
            v-model="searchText"
            size="mini"
            placeholder="搜索房间"
            prefix-icon="el-icon-search"
          />
        </div>
        <div class="building-list">
          <div
            v-for="building in buildingStats"
            :key="building.name"
            :class="['building-item', { active: selectedBuilding === building.name }]"
            @click="selectBuilding(building.name)"
          >
            <div class="building-name">{{ building.name }}</div>
            <div class="building-stats">
              <span class="stat-item">
                <i class="el-icon-circle-check"></i> {{ building.online }}
              </span>
              <span class="stat-item warning" v-if="building.alarm > 0">
                <i class="el-icon-warning-outline"></i> {{ building.alarm }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="content-area">
        <!-- 切换视图 -->
        <div class="view-switch">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="panel">面板视图</el-radio-button>
            <el-radio-button label="table">列表视图</el-radio-button>
            <el-radio-button label="floor">楼层平面</el-radio-button>
          </el-radio-group>
          <div class="filter-group">
            <el-select v-model="filterType" size="small" placeholder="设备类型" clearable>
              <el-option label="密码锁" value="password" />
              <el-option label="指纹锁" value="fingerprint" />
              <el-option label="人脸识别" value="face" />
              <el-option label="门禁卡" value="card" />
            </el-select>
            <el-select v-model="filterStatus" size="small" placeholder="设备状态" clearable>
              <el-option label="正常" value="online" />
              <el-option label="离线" value="offline" />
              <el-option label="告警" value="alarm" />
              <el-option label="低电量" value="lowBattery" />
            </el-select>
          </div>
        </div>

        <!-- 面板视图 -->
        <div v-if="viewMode === 'panel'" class="panel-view">
          <div
            v-for="lock in displayLocks"
            :key="lock.lockId"
            :class="['lock-card', lock.status, { selected: selectedLock && selectedLock.lockId === lock.lockId }]"
            @click="selectLock(lock)"
          >
            <div class="card-header">
              <span class="room-number">{{ lock.roomNumber }}</span>
              <el-dropdown trigger="click" @command="handleQuickAction($event, lock)">
                <i class="el-icon-more action-icon"></i>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="unlock">
                    <i class="el-icon-unlock"></i> 远程开锁
                  </el-dropdown-item>
                  <el-dropdown-item command="tempPass">
                    <i class="el-icon-key"></i> 生成临时密码
                  </el-dropdown-item>
                  <el-dropdown-item command="alarm">
                    <i class="el-icon-bell"></i> 点亮报警
                  </el-dropdown-item>
                  <el-dropdown-item command="logs" divided>
                    <i class="el-icon-document"></i> 开锁记录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
            <div class="card-body">
              <div class="lock-type">
                <i :class="getLockIcon(lock.type)"></i>
                <span>{{ getLockTypeName(lock.type) }}</span>
              </div>
              <div class="status-info">
                <span :class="['status-indicator', lock.status]"></span>
                <span class="status-text">{{ getStatusName(lock.status) }}</span>
              </div>
            </div>
            <div class="card-footer">
              <div class="info-item">
                <i class="el-icon-battery-line"></i>
                <span :style="{ color: getBatteryColor(lock.battery) }">{{ lock.battery }}%</span>
              </div>
              <div class="info-item">
                <i class="el-icon-time"></i>
                <span>{{ formatTime(lock.lastAccess) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-else-if="viewMode === 'table'" class="table-view">
          <el-table :data="displayLocks" @row-click="selectLock" height="calc(100vh - 200px)">
            <el-table-column type="selection" width="55" />
            <el-table-column prop="roomNumber" label="房间号" />
            <el-table-column prop="location" label="详细位置" min-width="180" />
            <el-table-column prop="type" label="类型">
              <template slot-scope="scope">
                <span class="type-badge">{{ getLockTypeName(scope.row.type) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
              <template slot-scope="scope">
                <div class="status-cell">
                  <span :class="['status-dot', scope.row.status]"></span>
                  {{ getStatusName(scope.row.status) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="battery" label="电量">
              <template slot-scope="scope">
                <el-progress
                  :percentage="scope.row.battery"
                  :color="getBatteryColor(scope.row.battery)"
                  :stroke-width="4"
                />
              </template>
            </el-table-column>
            <el-table-column prop="todayAccess" label="今日访问" align="center" />
            <el-table-column label="快捷操作" fixed="right" width="240">
              <template slot-scope="scope">
                <div class="table-actions">
                  <el-button size="mini" type="text" @click.stop="remoteUnlock(scope.row)">开锁</el-button>
                  <el-divider direction="vertical"></el-divider>
                  <el-button size="mini" type="text" @click.stop="generateTempPass(scope.row)">临时密码</el-button>
                  <el-divider direction="vertical"></el-divider>
                  <el-button size="mini" type="text" @click.stop="viewLogs(scope.row)">记录</el-button>
                  <el-divider direction="vertical"></el-divider>
                  <el-button size="mini" type="text" @click.stop="triggerAlarm(scope.row)">点亮报警</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 楼层平面视图 -->
        <div v-else-if="viewMode === 'floor'" class="floor-view">
          <div class="floor-selector">
            <el-radio-group v-model="selectedFloor" size="small">
              <el-radio-button v-for="floor in floors" :key="floor" :label="floor">
                {{ floor }}
              </el-radio-button>
            </el-radio-group>
          </div>
          <div class="floor-map">
            <div class="floor-grid">
              <div
                v-for="room in floorRooms"
                :key="room.lockId"
                :class="['room-block', room.status, { selected: selectedLock && selectedLock.lockId === room.lockId }]"
                @click="selectLock(room)"
              >
                <div class="room-num">{{ room.roomNumber }}</div>
                <i :class="getLockIcon(room.type)"></i>
                <div class="room-status">
                  <span :class="['status-light', room.status]"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧详情面板 -->
      <transition name="slide-right">
        <div v-if="selectedLock" class="detail-panel">
          <div class="panel-header">
            <h3>{{ selectedLock.location }}</h3>
            <i class="el-icon-close" @click="selectedLock = null"></i>
          </div>
          <div class="panel-content">
            <div class="info-section">
              <h4>设备信息</h4>
              <div class="info-row">
                <span class="label">设备编号</span>
                <span class="value">{{ selectedLock.lockId }}</span>
              </div>
              <div class="info-row">
                <span class="label">设备类型</span>
                <span class="value">{{ getLockTypeName(selectedLock.type) }}</span>
              </div>
              <div class="info-row">
                <span class="label">当前状态</span>
                <span class="value">
                  <span :class="['status-dot', selectedLock.status]"></span>
                  {{ getStatusName(selectedLock.status) }}
                </span>
              </div>
              <div class="info-row">
                <span class="label">电池电量</span>
                <span class="value">
                  <el-progress
                    :percentage="selectedLock.battery"
                    :color="getBatteryColor(selectedLock.battery)"
                  />
                </span>
              </div>
            </div>

            <div class="action-section">
              <h4>设备控制</h4>
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-button class="control-btn" @click="remoteUnlock(selectedLock)">
                    <i class="el-icon-unlock"></i>
                    远程开锁
                  </el-button>
                </el-col>
                <el-col :span="12">
                  <el-button class="control-btn" @click="generateTempPass(selectedLock)">
                    <i class="el-icon-key"></i>
                    临时密码
                  </el-button>
                </el-col>
                <el-col :span="12">
                  <el-button class="control-btn" @click="triggerAlarm(selectedLock)">
                    <i class="el-icon-bell"></i>
                    点亮报警
                  </el-button>
                </el-col>
                <el-col :span="12">
                  <el-button class="control-btn" @click="viewLogs(selectedLock)">
                    <i class="el-icon-document"></i>
                    开锁记录
                  </el-button>
                </el-col>
              </el-row>
            </div>

            <div class="stats-section">
              <h4>使用统计</h4>
              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-num">{{ selectedLock.todayAccess }}</div>
                  <div class="stat-label">今日开锁</div>
                </div>
                <div class="stat-box">
                  <div class="stat-num">{{ selectedLock.weekAccess }}</div>
                  <div class="stat-label">本周开锁</div>
                </div>
                <div class="stat-box">
                  <div class="stat-num">{{ selectedLock.authUsers }}</div>
                  <div class="stat-label">授权用户</div>
                </div>
              </div>
            </div>

            <div class="recent-section">
              <h4>最近访问</h4>
              <div class="access-list">
                <div v-for="(access, idx) in recentAccess" :key="idx" class="access-item">
                  <div class="access-user">{{ access.user }}</div>
                  <div class="access-time">{{ access.time }}</div>
                  <div class="access-method">{{ access.method }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 临时密码弹窗 -->
    <el-dialog
      title="生成临时密码"
      :visible.sync="showTempPassword"
      width="500px"
      class="temp-pass-dialog"
    >
      <el-form :model="tempPassForm" label-width="100px">
        <el-form-item label="选择门锁">
          <el-select v-model="tempPassForm.lockId" placeholder="请选择门锁" style="width: 100%">
            <el-option
              v-for="lock in locks"
              :key="lock.lockId"
              :label="lock.location"
              :value="lock.lockId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker
            v-model="tempPassForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="使用次数">
          <el-input-number v-model="tempPassForm.times" :min="1" :max="10" />
          <span style="margin-left: 10px; color: #909399;">次</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="tempPassForm.remark" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <div v-if="generatedPassword" class="password-display">
        <div class="password-label">生成的临时密码：</div>
        <div class="password-value">{{ generatedPassword }}</div>
        <el-button size="small" @click="copyPassword">复制密码</el-button>
      </div>
      <span slot="footer">
        <el-button @click="showTempPassword = false">取消</el-button>
        <el-button type="primary" @click="confirmGeneratePass">生成密码</el-button>
      </span>
    </el-dialog>

    <!-- 开锁记录弹窗 -->
    <el-dialog
      title="开锁记录"
      :visible.sync="showLogsDialog"
      width="800px"
      class="logs-dialog"
    >
      <div class="logs-filter">
        <el-date-picker
          v-model="logsDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
        />
        <el-select v-model="logsMethod" placeholder="开锁方式" size="small" clearable>
          <el-option label="密码" value="password" />
          <el-option label="指纹" value="fingerprint" />
          <el-option label="人脸" value="face" />
          <el-option label="门禁卡" value="card" />
          <el-option label="远程" value="remote" />
        </el-select>
      </div>
      <el-table :data="lockLogs" height="400">
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="user" label="用户" />
        <el-table-column prop="method" label="开锁方式" width="100">
          <template slot-scope="scope">
            <el-tag size="small" :type="getMethodTagType(scope.row.method)">
              {{ scope.row.method }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="result" label="结果" width="80">
          <template slot-scope="scope">
            <span :style="{ color: scope.row.result === '成功' ? '#67C23A' : '#F56C6C' }">
              {{ scope.row.result }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'LockManagement',
  data() {
    return {
      searchText: '',
      selectedBuilding: 'A栋',
      selectedFloor: '1F',
      viewMode: 'panel',
      filterType: '',
      filterStatus: '',
      selectedLock: null,
      showTempPassword: false,
      showLogsDialog: false,
      showBatchControl: false,
      showAddDialog: false,
      generatedPassword: '',
      logsDateRange: [],
      logsMethod: '',
      tempPassForm: {
        lockId: '',
        dateRange: [],
        times: 1,
        remark: ''
      },
      locks: [],
      lockLogs: [],
      recentAccess: [],
      buildingStats: [],
      floors: ['B1', '1F', '2F', '3F', '4F', '5F']
    }
  },
  computed: {
    displayLocks() {
      let result = this.locks.filter(lock => {
        if (this.selectedBuilding && !lock.location.includes(this.selectedBuilding)) {
          return false
        }
        if (this.filterType && lock.type !== this.filterType) {
          return false
        }
        if (this.filterStatus && lock.status !== this.filterStatus) {
          return false
        }
        if (this.searchText && !lock.location.toLowerCase().includes(this.searchText.toLowerCase())) {
          return false
        }
        return true
      })
      return result
    },
    floorRooms() {
      return this.displayLocks.filter(lock => 
        lock.location.includes(this.selectedFloor)
      )
    }
  },
  mounted() {
    this.initData()
  },
  methods: {
    initData() {
      // 生成模拟数据
      const buildings = ['A栋', 'B栋', 'C栋', 'D栋', 'E栋']
      const types = ['password', 'fingerprint', 'face', 'card']
      const statuses = ['online', 'online', 'online', 'offline', 'alarm', 'lowBattery']
      
      let lockId = 1
      buildings.forEach(building => {
        const buildingStat = {
          name: building,
          online: 0,
          offline: 0,
          alarm: 0
        }
        
        this.floors.forEach(floor => {
          const roomCount = floor === 'B1' ? 5 : 10
          for (let i = 1; i <= roomCount; i++) {
            const roomNumber = floor === 'B1' ? `B${i}` : `${floor.replace('F', '')}${String(i).padStart(2, '0')}`
            const status = statuses[Math.floor(Math.random() * statuses.length)]
            
            const lock = {
              lockId: `DL${String(lockId++).padStart(6, '0')}`,
              roomNumber: roomNumber,
              location: `${building}-${floor}-${roomNumber}室`,
              type: types[Math.floor(Math.random() * types.length)],
              status: status,
              battery: status === 'lowBattery' ? Math.floor(Math.random() * 20) + 10 : Math.floor(Math.random() * 40) + 60,
              lastAccess: new Date(Date.now() - Math.random() * 86400000),
              todayAccess: Math.floor(Math.random() * 30),
              weekAccess: Math.floor(Math.random() * 150),
              authUsers: Math.floor(Math.random() * 10) + 5
            }
            
            this.locks.push(lock)
            
            if (status === 'online') buildingStat.online++
            else if (status === 'offline') buildingStat.offline++
            else if (status === 'alarm') buildingStat.alarm++
          }
        })
        
        this.buildingStats.push(buildingStat)
      })
      
      // 生成最近访问记录
      this.recentAccess = [
        { user: '张三', time: '10:23', method: '指纹' },
        { user: '李四', time: '09:45', method: '密码' },
        { user: '王五', time: '08:30', method: '人脸' }
      ]
    },
    
    selectBuilding(building) {
      this.selectedBuilding = building
    },
    
    selectLock(lock) {
      this.selectedLock = lock
    },
    
    handleQuickAction(command, lock) {
      switch(command) {
        case 'unlock':
          this.remoteUnlock(lock)
          break
        case 'tempPass':
          this.generateTempPass(lock)
          break
        case 'alarm':
          this.triggerAlarm(lock)
          break
        case 'logs':
          this.viewLogs(lock)
          break
      }
    },
    
    remoteUnlock(lock) {
      this.$confirm(`确定要远程开启 ${lock.location} 的门锁吗？`, '远程开锁确认', {
        confirmButtonText: '确定开锁',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('开锁指令已发送')
      })
    },
    
    generateTempPass(lock) {
      this.tempPassForm.lockId = lock.lockId
      this.showTempPassword = true
    },
    
    confirmGeneratePass() {
      this.generatedPassword = Math.random().toString().slice(2, 8)
      this.$message.success('临时密码已生成')
    },
    
    copyPassword() {
      navigator.clipboard.writeText(this.generatedPassword)
      this.$message.success('密码已复制到剪贴板')
    },
    
    triggerAlarm(lock) {
      this.$confirm(`确定要点亮 ${lock.location} 的报警灯吗？`, '点亮报警', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(() => {
        // 更新设备状态为告警
        const index = this.locks.findIndex(l => l.lockId === lock.lockId)
        if (index !== -1) {
          this.$set(this.locks[index], 'status', 'alarm')
        }
        this.$message.success('报警灯已点亮')
        this.updateStats()
      })
    },
    
    viewLogs(lock) {
      this.showLogsDialog = true
      // 生成模拟日志
      this.lockLogs = Array.from({ length: 20 }, (_, i) => ({
        time: new Date(Date.now() - i * 3600000).toLocaleString('zh-CN'),
        user: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)],
        method: ['密码', '指纹', '人脸', '门禁卡', '远程'][Math.floor(Math.random() * 5)],
        result: Math.random() > 0.9 ? '失败' : '成功',
        remark: Math.random() > 0.8 ? '多次尝试' : ''
      }))
    },
    
    getLockIcon(type) {
      const iconMap = {
        password: 'el-icon-lock',
        fingerprint: 'el-icon-thumb',
        face: 'el-icon-user',
        card: 'el-icon-bank-card'
      }
      return iconMap[type] || 'el-icon-lock'
    },
    
    getLockTypeName(type) {
      const typeMap = {
        password: '密码锁',
        fingerprint: '指纹锁',
        face: '人脸锁',
        card: '门禁卡'
      }
      return typeMap[type] || type
    },
    
    getStatusName(status) {
      const statusMap = {
        online: '正常',
        offline: '离线',
        alarm: '告警',
        lowBattery: '低电量'
      }
      return statusMap[status] || status
    },
    
    getBatteryColor(battery) {
      if (battery > 60) return '#67C23A'
      if (battery > 30) return '#E6A23C'
      return '#F56C6C'
    },
    
    formatTime(time) {
      const now = new Date()
      const diff = now - time
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
      return time.toLocaleDateString('zh-CN')
    },
    
    getMethodTagType(method) {
      const typeMap = {
        '密码': '',
        '指纹': 'success',
        '人脸': 'warning',
        '门禁卡': 'info',
        '远程': 'danger'
      }
      return typeMap[method] || ''
    }
  }
}
</script>

<style scoped>
.lock-management {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

/* 顶部栏 */
.top-bar {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 500;
  color: #1f2329;
  margin: 0;
}

.alert-badge {
  margin-left: 8px;
}

.right-section {
  display: flex;
  gap: 12px;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧楼层导航 */
.building-nav {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.nav-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.nav-header span {
  font-size: 14px;
  font-weight: 500;
  color: #1f2329;
  display: block;
  margin-bottom: 12px;
}

.building-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.building-item {
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.building-item:hover {
  background: #f5f5f5;
}

.building-item.active {
  background: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.building-name {
  font-size: 14px;
  color: #1f2329;
  font-weight: 500;
  margin-bottom: 4px;
}

.building-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #8f959e;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-item i {
  font-size: 12px;
}

.stat-item.warning {
  color: #faad14;
}

/* 内容区域 */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}

.view-switch {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-group {
  display: flex;
  gap: 12px;
}

/* 面板视图 */
.panel-view {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  overflow-y: auto;
  padding: 4px;
  align-content: start;
}

.lock-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e8e8e8;
  position: relative;
  height: fit-content;
}

.lock-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.lock-card.alarm {
  border-color: #ff7875;
  background: #fff2f0;
}

.lock-card.lowBattery {
  border-color: #faad14;
  background: #fffbe6;
}

.lock-card.offline {
  opacity: 0.7;
  background: #fafafa;
}

.lock-card.selected {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
}

.lock-card.selected.alarm {
  border-color: #ff7875;
  box-shadow: 0 4px 12px rgba(255, 120, 117, 0.15);
}

.lock-card.selected.lowBattery {
  border-color: #faad14;
  box-shadow: 0 4px 12px rgba(250, 173, 20, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.room-number {
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
}

.action-icon {
  color: #8f959e;
  cursor: pointer;
  padding: 4px;
}

.action-icon:hover {
  color: #1890ff;
}

.card-body {
  margin-bottom: 16px;
}

.lock-type {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #646a73;
  font-size: 13px;
}

.lock-type i {
  font-size: 16px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-indicator.online {
  background: #52c41a;
}

.status-indicator.offline {
  background: #d9d9d9;
}

.status-indicator.alarm {
  background: #ff4d4f;
  animation: pulse 2s infinite;
}

.status-indicator.lowBattery {
  background: #faad14;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.status-text {
  color: #8f959e;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #8f959e;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-item i {
  font-size: 14px;
}

/* 表格视图 */
.table-view {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.table-view .el-table {
  flex: 1;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-dot.online {
  background: #52c41a;
}

.status-dot.offline {
  background: #d9d9d9;
}

.status-dot.alarm {
  background: #ff4d4f;
}

.type-badge {
  font-size: 12px;
  color: #646a73;
}

/* 楼层平面视图 */
.floor-view {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.floor-selector {
  margin-bottom: 16px;
}

.floor-map {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  overflow: auto;
}

.floor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 120px));
  gap: 12px;
  justify-content: start;
}

.room-block {
  width: 100px;
  height: 100px;
  background: #f5f7fa;
  border: 2px solid #e1e4e8;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.room-block:hover {
  background: #e6f7ff;
  border-color: #1890ff;
}

.room-block.alarm {
  background: #fff2f0;
  border-color: #ff7875;
}

.room-block.alarm {
  background: #fff2f0;
  border-color: #ff7875;
}

.room-block.lowBattery {
  background: #fffbe6;
  border-color: #faad14;
}

.room-block.offline {
  opacity: 0.6;
}

.room-block.selected {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.room-block.selected.alarm {
  border-color: #ff7875;
  box-shadow: 0 2px 8px rgba(255, 120, 117, 0.2);
}

.room-block.selected.lowBattery {
  border-color: #faad14;
  box-shadow: 0 2px 8px rgba(250, 173, 20, 0.2);
}

.room-num {
  font-size: 13px;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 4px;
}

.room-block i {
  font-size: 20px;
  color: #8f959e;
  margin-bottom: 4px;
}

.room-status {
  position: absolute;
  top: 8px;
  right: 8px;
}

.status-light {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: block;
}

.status-light.online {
  background: #52c41a;
}

.status-light.offline {
  background: #d9d9d9;
}

.status-light.alarm {
  background: #ff4d4f;
  animation: pulse 2s infinite;
}

/* 右侧详情面板 */
.detail-panel {
  width: 320px;
  background: #fff;
  border-left: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 500;
  color: #1f2329;
  margin: 0;
}

.panel-header i {
  cursor: pointer;
  color: #8f959e;
  padding: 4px;
}

.panel-header i:hover {
  color: #646a73;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.info-section,
.action-section,
.stats-section,
.recent-section {
  margin-bottom: 24px;
}

.info-section h4,
.action-section h4,
.stats-section h4,
.recent-section h4 {
  font-size: 14px;
  font-weight: 500;
  color: #1f2329;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
}

.info-row .label {
  color: #8f959e;
}

.info-row .value {
  color: #1f2329;
  font-weight: 500;
}

.control-btn {
  width: 100%;
  height: 60px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 13px;
}

.control-btn i {
  font-size: 18px;
  margin-bottom: 2px;
}

.action-btn i {
  font-size: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-box {
  text-align: center;
  padding: 12px 8px;
  background: #f5f7fa;
  border-radius: 6px;
}

.stat-num {
  font-size: 20px;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #8f959e;
}

.access-list {
  font-size: 13px;
}

.access-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.access-item:last-child {
  border-bottom: none;
}

.access-user {
  color: #1f2329;
  font-weight: 500;
}

.access-time {
  color: #8f959e;
}

.access-method {
  color: #646a73;
}

/* 弹窗样式 */
.temp-pass-dialog .password-display {
  margin-top: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
  text-align: center;
}

.password-label {
  font-size: 14px;
  color: #8f959e;
  margin-bottom: 8px;
}

.password-value {
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 12px;
  letter-spacing: 4px;
}

.logs-dialog .logs-filter {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

/* 过渡动画 */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter,
.slide-right-leave-to {
  transform: translateX(100%);
}

/* 响应式 */
@media (max-width: 1200px) {
  .panel-view {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .building-nav {
    width: 200px;
  }
  
  .detail-panel {
    width: 280px;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
}
</style>