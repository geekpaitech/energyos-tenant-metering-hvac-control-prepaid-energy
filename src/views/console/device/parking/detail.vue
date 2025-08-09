<template>
    <div class="parking-detail-container">
      <!-- 顶部标题栏 -->
      <div class="page-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/device' }">设备管理</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ path: '/device/parking' }">车位管理</el-breadcrumb-item>
            <el-breadcrumb-item>车位详情</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-button size="small" @click="handleRefresh">刷新</el-button>
          <el-button type="primary" size="small" @click="exportData">导出</el-button>
        </div>
      </div>
  
      <!-- 主内容区 -->
      <div class="main-content">
        <!-- 基本信息卡片 -->
        <div class="info-card base-info">
          <div class="card-title">
            <span class="title-text">车位基本信息</span>
            <el-tag :type="parkingInfo.status === 'occupied' ? 'danger' : 'success'" size="small">
              {{ statusText }}
            </el-tag>
          </div>
          <div class="card-content">
            <div class="info-row">
              <div class="info-col">
                <label>车位编号</label>
                <span class="value">{{ parkingInfo.code }}</span>
              </div>
              <div class="info-col">
                <label>所属区域</label>
                <span class="value">{{ parkingInfo.area }}</span>
              </div>
              <div class="info-col">
                <label>车位类型</label>
                <span class="value">{{ parkingInfo.type }}</span>
              </div>
              <div class="info-col">
                <label>当前车辆</label>
                <span class="value primary">{{ parkingInfo.currentVehicle || '--' }}</span>
              </div>
              <div class="info-col">
                <label>入场时间</label>
                <span class="value">{{ parkingInfo.entryTime || '--' }}</span>
              </div>
              <div class="info-col">
                <label>停放时长</label>
                <span class="value warning">{{ parkingDurationText }}</span>
              </div>
            </div>
          </div>
        </div>
  
        <el-row :gutter="16">
          <!-- 左侧主要信息 -->
          <el-col :span="16">
            <!-- 设备信息 -->
            <div class="info-card">
              <div class="card-title">
                <span class="title-text">关联设备信息</span>
                <div class="title-extra">
                  <span class="status-indicator" :class="{ online: deviceInfo.online }"></span>
                  <span class="status-text">{{ deviceInfo.online ? '在线' : '离线' }}</span>
                </div>
              </div>
              <div class="card-content">
                <div class="info-row">
                  <div class="info-col">
                    <label>地锁设备</label>
                    <span class="value">{{ deviceInfo.lockId }}</span>
                  </div>
                  <div class="info-col">
                    <label>传感器编号</label>
                    <span class="value">{{ deviceInfo.sensorId }}</span>
                  </div>
                  <div class="info-col">
                    <label>最后通信</label>
                    <span class="value">{{ deviceInfo.lastCommunication }}</span>
                  </div>
                  <div class="info-col">
                    <label>设备型号</label>
                    <span class="value">{{ deviceInfo.model }}</span>
                  </div>
                  <div class="info-col">
                    <label>固件版本</label>
                    <span class="value">{{ deviceInfo.firmware }}</span>
                  </div>
                  <div class="info-col">
                    <label>信号强度</label>
                    <span class="value">
                      <el-progress 
                        :percentage="deviceInfo.signal" 
                        :color="signalColor"
                        :stroke-width="4"
                        :show-text="false"
                        style="width: 60px; display: inline-block; vertical-align: middle;"
                      ></el-progress>
                      <span style="margin-left: 8px;">{{ deviceInfo.signal }}%</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- 远程控制 -->
            <div class="info-card">
              <div class="card-title">
                <span class="title-text">远程控制</span>
                <el-button type="danger" size="mini" plain @click="handleEmergencyRelease">紧急释放</el-button>
              </div>
              <div class="card-content">
                <div class="control-row">
                  <div class="control-item">
                    <span class="control-label">地锁控制</span>
                    <el-switch
                      v-model="controlState.lockState"
                      active-text="升起"
                      inactive-text="降下"
                      @change="handleLockControl"
                    ></el-switch>
                  </div>
                  <div class="control-item">
                    <span class="control-label">照明控制</span>
                    <el-switch
                      v-model="controlState.lightState"
                      active-text="开启"
                      inactive-text="关闭"
                      @change="handleLightControl"
                    ></el-switch>
                  </div>
                  <div class="control-item">
                    <span class="control-label">预约状态</span>
                    <el-switch
                      v-model="controlState.reserveState"
                      active-text="可预约"
                      inactive-text="禁止预约"
                      @change="handleReserveControl"
                    ></el-switch>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- 实时监控 -->
            <div class="info-card">
              <div class="card-title">
                <span class="title-text">实时监控</span>
                <span class="update-time">{{ monitorInfo.updateTime }}</span>
              </div>
              <div class="card-content">
                <div class="monitor-wrapper">
                  <div class="monitor-screen">
                    <img v-if="monitorImage" :src="monitorImage" alt="监控画面" />
                    <div v-else class="monitor-empty">
                      <i class="el-icon-video-camera"></i>
                      <p>暂无监控画面</p>
                    </div>
                  </div>
                  <div class="monitor-info">
                    <span class="info-label">摄像头编号：</span>
                    <span class="info-value">{{ monitorInfo.cameraId }}</span>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- 使用记录 -->
            <div class="info-card">
              <div class="card-title">
                <span class="title-text">最近使用记录</span>
                <el-button type="text" size="small" @click="showMoreRecords">
                  查看更多<i class="el-icon-arrow-right"></i>
                </el-button>
              </div>
              <div class="card-content no-padding">
                <el-table 
                  :data="usageRecords" 
                  style="width: 100%"
                  stripe
                >
                  <el-table-column prop="vehicleNo" label="车牌号" width="110"></el-table-column>
                  <el-table-column prop="entryTime" label="入场时间" width="160"></el-table-column>
                  <el-table-column prop="exitTime" label="离场时间" width="160">
                    <template slot-scope="scope">
                      <span>{{ scope.row.exitTime || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="duration" label="停放时长"></el-table-column>
                  <el-table-column prop="fee" label="费用(元)" align="right">
                    <template slot-scope="scope">
                      <span class="fee-text">¥{{ scope.row.fee }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态" width="80" align="center">
                    <template slot-scope="scope">
                      <el-tag 
                        :type="scope.row.status === '使用中' ? 'warning' : 'success'" 
                        size="mini"
                      >
                        {{ scope.row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-col>
  
          <!-- 右侧统计信息 -->
          <el-col :span="8">
            <!-- 统计概览 -->
            <div class="info-card">
              <div class="card-title">
                <span class="title-text">统计数据</span>
              </div>
              <div class="card-content">
                <div class="stat-grid">
                  <div class="stat-item">
                    <div class="stat-value">{{ statistics.todayUsage }}</div>
                    <div class="stat-label">今日使用</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ statistics.monthlyRate }}%</div>
                    <div class="stat-label">本月使用率</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value primary">¥{{ statistics.monthlyIncome }}</div>
                    <div class="stat-label">本月收入</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ statistics.avgDuration }}h</div>
                    <div class="stat-label">平均停放</div>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- 费用计算 -->
            <div class="info-card">
              <div class="card-title">
                <span class="title-text">费用计算</span>
              </div>
              <div class="card-content">
                <div class="fee-detail">
                  <div class="fee-item">
                    <span class="fee-label">计费标准</span>
                    <span class="fee-value">¥5.00/小时</span>
                  </div>
                  <div class="fee-item">
                    <span class="fee-label">已停时长</span>
                    <span class="fee-value">{{ parkingDurationText }}</span>
                  </div>
                  <div class="fee-item">
                    <span class="fee-label">当前费用</span>
                    <span class="fee-value primary">¥{{ currentFee }}</span>
                  </div>
                  <div class="fee-item">
                    <span class="fee-label">封顶费用</span>
                    <span class="fee-value">¥50.00/天</span>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- 操作记录 -->
            <div class="info-card">
              <div class="card-title">
                <span class="title-text">操作记录</span>
                <el-button type="text" size="small">更多</el-button>
              </div>
              <div class="card-content">
                <div class="log-timeline">
                  <div class="log-item" v-for="(log, index) in operationLogs" :key="index">
                    <div class="log-time">{{ log.time }}</div>
                    <div class="log-content">
                      <div class="log-title">{{ log.action }}</div>
                      <div class="log-desc">{{ log.operator }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- 设备告警 -->
            <div class="info-card">
              <div class="card-title">
                <span class="title-text">设备告警</span>
                <el-badge :value="alerts.length" class="item" v-if="alerts.length > 0">
                  <el-button size="mini" type="text">查看</el-button>
                </el-badge>
              </div>
              <div class="card-content">
                <div v-if="alerts.length > 0" class="alert-list">
                  <div class="alert-item" v-for="(alert, index) in alerts" :key="index">
                    <el-tag :type="alert.level" size="mini">{{ alert.type }}</el-tag>
                    <span class="alert-msg">{{ alert.message }}</span>
                    <span class="alert-time">{{ alert.time }}</span>
                  </div>
                </div>
                <div v-else class="empty-state">
                  <i class="el-icon-success"></i>
                  <p>暂无告警信息</p>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ParkingDetail',
    data() {
      return {
        // 车位基本信息
        parkingInfo: {
          code: 'B2-A-015',
          area: 'B2层A区',
          type: '标准车位',
          status: 'occupied',
          currentVehicle: '浙A88888',
          entryTime: '2024-01-15 08:30:45',
          duration: 375 // 分钟
        },
        
        // 设备信息
        deviceInfo: {
          lockId: 'LK-2024-0815',
          sensorId: 'PS-2024-0815',
          online: true,
          lastCommunication: '2024-01-15 14:25:30',
          model: 'PL-X100',
          firmware: 'v2.3.1',
          signal: 85
        },
        
        // 监控信息
        monitorInfo: {
          cameraId: 'CAM-B2-015',
          updateTime: '实时更新'
        },
        monitorImage: '', // 监控画面URL
        
        // 控制状态
        controlState: {
          lockState: true,
          lightState: false,
          reserveState: true
        },
        
        // 使用记录
        usageRecords: [
          {
            vehicleNo: '浙A88888',
            entryTime: '2024-01-15 08:30:45',
            exitTime: '',
            duration: '6小时15分',
            fee: '30.00',
            status: '使用中'
          },
          {
            vehicleNo: '浙B12345',
            entryTime: '2024-01-14 14:20:10',
            exitTime: '2024-01-14 18:45:30',
            duration: '4小时25分',
            fee: '22.00',
            status: '已完成'
          },
          {
            vehicleNo: '浙A66666',
            entryTime: '2024-01-14 09:15:20',
            exitTime: '2024-01-14 12:30:45',
            duration: '3小时15分',
            fee: '16.00',
            status: '已完成'
          }
        ],
        
        // 统计数据
        statistics: {
          todayUsage: 5,
          monthlyRate: 78,
          monthlyIncome: '3,250',
          avgDuration: 3.5
        },
        
        // 操作日志
        operationLogs: [
          {
            time: '14:25',
            action: '地锁升起',
            operator: '系统自动'
          },
          {
            time: '08:30',
            action: '车辆入场',
            operator: '系统自动'
          },
          {
            time: '08:15',
            action: '预约释放',
            operator: '操作员:张三'
          }
        ],
        
        // 告警信息
        alerts: [],
        
        // 定时器
        timer: null
      }
    },
    
    computed: {
      statusText() {
        const statusMap = {
          'occupied': '使用中',
          'available': '空闲',
          'reserved': '已预约',
          'maintenance': '维护中'
        }
        return statusMap[this.parkingInfo.status] || '未知'
      },
      
      parkingDurationText() {
        if (!this.parkingInfo.duration) return '--'
        const hours = Math.floor(this.parkingInfo.duration / 60)
        const minutes = this.parkingInfo.duration % 60
        return `${hours}小时${minutes}分钟`
      },
      
      currentFee() {
        if (!this.parkingInfo.duration) return '0.00'
        const hours = Math.ceil(this.parkingInfo.duration / 60)
        const fee = Math.min(hours * 5, 50) // 5元/小时，封顶50元
        return fee.toFixed(2)
      },
      
      signalColor() {
        const signal = this.deviceInfo.signal
        if (signal >= 80) return '#52C41A'
        if (signal >= 60) return '#FAAD14'
        return '#FF4D4F'
      }
    },
    
    mounted() {
      this.initData()
      this.startTimer()
    },
    
    beforeDestroy() {
      this.clearTimer()
    },
    
    methods: {
      initData() {
        this.fetchParkingDetail()
        this.fetchDeviceStatus()
        this.fetchUsageRecords()
      },
      
      fetchParkingDetail() {
        console.log('获取车位详情')
      },
      
      fetchDeviceStatus() {
        console.log('获取设备状态')
      },
      
      fetchUsageRecords() {
        console.log('获取使用记录')
      },
      
      startTimer() {
        this.timer = setInterval(() => {
          if (this.parkingInfo.status === 'occupied') {
            this.parkingInfo.duration++
          }
        }, 60000)
      },
      
      clearTimer() {
        if (this.timer) {
          clearInterval(this.timer)
          this.timer = null
        }
      },
      
      handleRefresh() {
        this.$message.success('数据已刷新')
        this.initData()
      },
      
      exportData() {
        this.$message.success('正在导出...')
      },
      
      handleLockControl(val) {
        const action = val ? '升起' : '降下'
        this.$confirm(`确认${action}地锁？`, '操作确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$message.success(`地锁已${action}`)
        }).catch(() => {
          this.controlState.lockState = !val
        })
      },
      
      handleLightControl(val) {
        const action = val ? '开启' : '关闭'
        this.$message.success(`照明已${action}`)
      },
      
      handleReserveControl(val) {
        const action = val ? '开放' : '关闭'
        this.$message.success(`预约已${action}`)
      },
      
      handleEmergencyRelease() {
        this.$confirm('确认执行紧急释放？', '紧急操作', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$message.success('紧急释放成功')
          this.parkingInfo.status = 'available'
          this.parkingInfo.currentVehicle = ''
          this.controlState.lockState = false
        })
      },
      
      showMoreRecords() {
        this.$router.push('/parking/records/' + this.parkingInfo.code)
      }
    }
  }
  </script>
  
  <style scoped>
  /* 容器 */
  .parking-detail-container {
    min-height: 100vh;
    background: #F5F6FA;
  }
  
  /* 顶部标题栏 */
  .page-header {
    background: #FFFFFF;
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #E8E8E8;
  }
  
  .header-left {
    flex: 1;
  }
  
  .header-right {
    display: flex;
    gap: 8px;
  }
  
  /* 主内容区 */
  .main-content {
    padding: 16px;
  }
  
  /* 信息卡片 */
  .info-card {
    background: #FFFFFF;
    border-radius: 4px;
    margin-bottom: 16px;
    border: 1px solid #E8E8E8;
  }
  
  .info-card.base-info {
    margin-bottom: 16px;
  }
  
  .card-title {
    padding: 12px 16px;
    border-bottom: 1px solid #F0F0F0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .title-text {
    font-size: 14px;
    font-weight: 500;
    color: #262626;
  }
  
  .title-extra {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #BFBFBF;
  }
  
  .status-indicator.online {
    background: #52C41A;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .status-text {
    font-size: 12px;
    color: #8C8C8C;
  }
  
  .update-time {
    font-size: 12px;
    color: #8C8C8C;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .card-content.no-padding {
    padding: 0;
  }
  
  /* 信息行列 */
  .info-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  
  .info-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .info-col label {
    font-size: 12px;
    color: #8C8C8C;
  }
  
  .info-col .value {
    font-size: 14px;
    color: #262626;
  }
  
  .info-col .value.primary {
    color: #1890FF;
    font-weight: 500;
  }
  
  .info-col .value.warning {
    color: #FA8C16;
  }
  
  /* 控制区域 */
  .control-row {
    display: flex;
    gap: 40px;
  }
  
  .control-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .control-label {
    font-size: 14px;
    color: #595959;
  }
  
  /* 监控区域 */
  .monitor-wrapper {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .monitor-screen {
    width: 100%;
    height: 280px;
    background: #FAFAFA;
    border: 1px solid #E8E8E8;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .monitor-screen img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .monitor-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #BFBFBF;
  }
  
  .monitor-empty i {
    font-size: 48px;
    margin-bottom: 8px;
  }
  
  .monitor-empty p {
    font-size: 14px;
  }
  
  .monitor-info {
    font-size: 13px;
  }
  
  .info-label {
    color: #8C8C8C;
  }
  
  .info-value {
    color: #262626;
  }
  
  /* 统计网格 */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .stat-item {
    text-align: center;
    padding: 12px;
    background: #FAFAFA;
    border-radius: 4px;
  }
  
  .stat-value {
    font-size: 20px;
    font-weight: 500;
    color: #262626;
    margin-bottom: 4px;
  }
  
  .stat-value.primary {
    color: #1890FF;
  }
  
  .stat-label {
    font-size: 12px;
    color: #8C8C8C;
  }
  
  /* 费用详情 */
  .fee-detail {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .fee-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #F0F0F0;
  }
  
  .fee-item:last-child {
    border-bottom: none;
  }
  
  .fee-label {
    font-size: 13px;
    color: #8C8C8C;
  }
  
  .fee-value {
    font-size: 14px;
    color: #262626;
    font-weight: 500;
  }
  
  .fee-value.primary {
    color: #1890FF;
    font-size: 16px;
  }
  
  .fee-text {
    color: #1890FF;
    font-weight: 500;
  }
  
  /* 操作日志 */
  .log-timeline {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .log-item {
    display: flex;
    gap: 12px;
    padding-left: 20px;
    position: relative;
  }
  
  .log-item::before {
    content: '';
    position: absolute;
    left: 6px;
    top: 6px;
    width: 6px;
    height: 6px;
    background: #1890FF;
    border-radius: 50%;
  }
  
  .log-item::after {
    content: '';
    position: absolute;
    left: 8px;
    top: 14px;
    bottom: -12px;
    width: 2px;
    background: #F0F0F0;
  }
  
  .log-item:last-child::after {
    display: none;
  }
  
  .log-time {
    font-size: 12px;
    color: #8C8C8C;
    min-width: 40px;
  }
  
  .log-content {
    flex: 1;
  }
  
  .log-title {
    font-size: 13px;
    color: #262626;
    margin-bottom: 2px;
  }
  
  .log-desc {
    font-size: 12px;
    color: #8C8C8C;
  }
  
  /* 告警列表 */
  .alert-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .alert-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    background: #FAFAFA;
    border-radius: 4px;
  }
  
  .alert-msg {
    font-size: 13px;
    color: #595959;
    margin-top: 4px;
  }
  
  .alert-time {
    font-size: 12px;
    color: #BFBFBF;
  }
  
  /* 空状态 */
  .empty-state {
    text-align: center;
    padding: 24px;
    color: #BFBFBF;
  }
  
  .empty-state i {
    font-size: 32px;
    margin-bottom: 8px;
    color: #52C41A;
  }
  
  .empty-state p {
    font-size: 13px;
    margin: 0;
  }
  
  /* Element UI 样式调整 */
  ::v-deep .el-breadcrumb {
    font-size: 14px;
  }
  
  ::v-deep .el-breadcrumb__inner {
    color: #8C8C8C;
  }
  
  ::v-deep .el-breadcrumb__inner.is-link {
    color: #595959;
  }
  
  ::v-deep .el-breadcrumb__inner.is-link:hover {
    color: #1890FF;
  }
  
  ::v-deep .el-table th {
    background: #FAFAFA;
    color: #262626;
    font-weight: normal;
    font-size: 13px;
  }
  
  ::v-deep .el-table td {
    font-size: 13px;
    color: #595959;
  }
  
  ::v-deep .el-table--striped .el-table__body tr.el-table__row--striped td {
    background: #FAFAFA;
  }
  
  ::v-deep .el-button--primary {
    background: #1890FF;
    border-color: #1890FF;
  }
  
  ::v-deep .el-button--primary:hover {
    background: #40A9FF;
    border-color: #40A9FF;
  }
  
  ::v-deep .el-switch__core {
    height: 20px;
    width: 40px;
  }
  
  ::v-deep .el-switch__button {
    width: 16px;
    height: 16px;
  }
  
  ::v-deep .el-tag {
    border: none;
  }
  
  ::v-deep .el-tag--success {
    background: #F6FFED;
    color: #52C41A;
  }
  
  ::v-deep .el-tag--warning {
    background: #FFFBE6;
    color: #FAAD14;
  }
  
  ::v-deep .el-tag--danger {
    background: #FFF1F0;
    color: #FF4D4F;
  }
  
  ::v-deep .el-tag--info {
    background: #F0F0F0;
    color: #8C8C8C;
  }
  
  ::v-deep .el-progress-bar__outer {
    background: #F0F0F0;
  }
  
  /* 响应式设计 */
  @media (max-width: 1440px) {
    .info-row {
      grid-template-columns: repeat(3, 1fr);
    }
    
    .stat-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (max-width: 1024px) {
    .info-row {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .control-row {
      flex-direction: column;
      gap: 16px;
    }
  }
  </style>