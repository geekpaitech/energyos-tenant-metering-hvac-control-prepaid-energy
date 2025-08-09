<template>
  <div class="charging-station-page">
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <div class="page-title">
        <i class="el-icon-s-grid"></i>
        <span>充电桩设备管理</span>
      </div>
      <div class="action-buttons">
        <el-button icon="el-icon-download" plain>导出数据</el-button>
        <el-button icon="el-icon-refresh" @click="refreshData">刷新</el-button>
        <el-button type="primary" icon="el-icon-plus" @click="showAddDialog">添加设备</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon blue">
          <i class="el-icon-s-data"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.total }}</div>
          <div class="stat-label">设备总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <i class="el-icon-circle-check"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.online }}</div>
          <div class="stat-label">在线设备</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <i class="el-icon-loading"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.charging }}</div>
          <div class="stat-label">充电中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">
          <i class="el-icon-warning"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.fault }}</div>
          <div class="stat-label">故障设备</div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 筛选区域 -->
      <div class="filter-bar">
        <div class="filter-left">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索设备编号、名称"
            prefix-icon="el-icon-search"
            clearable
            @clear="handleSearch"
            @keyup.enter.native="handleSearch">
          </el-input>
          <el-select v-model="searchForm.status" placeholder="设备状态" clearable @change="handleSearch">
            <el-option label="在线" value="online"></el-option>
            <el-option label="充电中" value="charging"></el-option>
            <el-option label="离线" value="offline"></el-option>
            <el-option label="故障" value="fault"></el-option>
          </el-select>
          <el-select v-model="searchForm.type" placeholder="设备类型" clearable @change="handleSearch">
            <el-option label="直流快充" value="dc_fast"></el-option>
            <el-option label="交流慢充" value="ac_slow"></el-option>
            <el-option label="超级快充" value="super_fast"></el-option>
          </el-select>
          <el-button icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh-left" @click="resetSearch">重置</el-button>
        </div>
        <div class="filter-right">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="card">
              <i class="el-icon-s-grid"></i> 卡片
            </el-radio-button>
            <el-radio-button label="table">
              <i class="el-icon-s-operation"></i> 表格
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'" class="card-view">
        <div class="device-card" v-for="device in deviceList" :key="device.id">
          <div class="card-status" :class="'status-' + device.status"></div>
          <div class="card-header">
            <div class="device-icon" :class="'icon-' + device.status">
              <i class="el-icon-s-platform"></i>
            </div>
            <div class="device-info">
              <div class="device-name">{{ device.deviceName }}</div>
              <div class="device-code">{{ device.deviceCode }}</div>
            </div>
            <el-dropdown trigger="click" @command="handleCommand($event, device)">
              <el-button type="text" icon="el-icon-more"></el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="edit" icon="el-icon-edit">编辑</el-dropdown-item>
                <el-dropdown-item command="detail" icon="el-icon-view">详情</el-dropdown-item>
                <el-dropdown-item command="delete" icon="el-icon-delete" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
          
          <div class="card-body">
            <div class="info-row">
              <span class="info-label">设备类型</span>
              <span class="info-value">{{ getTypeName(device.type) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">额定功率</span>
              <span class="info-value">{{ device.power }} kW</span>
            </div>
            <div class="info-row">
              <span class="info-label">所属站点</span>
              <span class="info-value">{{ device.stationName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">当前状态</span>
              <el-tag :type="getStatusTag(device.status)" size="small">
                {{ getStatusName(device.status) }}
              </el-tag>
            </div>
          </div>
          
          <div class="card-footer">
            <div class="stat-item">
              <div class="stat-num">{{ device.todayCharge || 0 }}</div>
              <div class="stat-text">今日充电</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-num">{{ device.totalCharge || 0 }}</div>
              <div class="stat-text">累计次数</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 表格视图 -->
      <div v-if="viewMode === 'table'" class="table-view">
        <el-table
          :data="deviceList"
          stripe
          v-loading="loading"
          :header-cell-style="{background:'#f8f9fa', color:'#606266'}"
          class="device-table">
          
          <el-table-column type="selection" width="50" fixed="left"></el-table-column>
          
          <el-table-column 
            label="设备编号" 
            prop="deviceCode" 
            min-width="120"
            show-overflow-tooltip>
            <template slot-scope="scope">
              <span class="code-text">{{ scope.row.deviceCode }}</span>
            </template>
          </el-table-column>
          
          <el-table-column 
            label="设备名称" 
            prop="deviceName" 
            min-width="160"
            show-overflow-tooltip>
          </el-table-column>
          
          <el-table-column 
            label="设备类型" 
            min-width="110"
            align="center">
            <template slot-scope="scope">
              <el-tag :type="getTypeTag(scope.row.type)" size="mini" effect="plain">
                {{ getTypeName(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column 
            label="功率" 
            prop="power" 
            min-width="90" 
            align="center">
            <template slot-scope="scope">
              <span class="power-text">{{ scope.row.power }}kW</span>
            </template>
          </el-table-column>
          
          <el-table-column 
            label="所属站点" 
            prop="stationName" 
            min-width="130"
            show-overflow-tooltip>
          </el-table-column>
          
          <el-table-column 
            label="状态" 
            min-width="100" 
            align="center">
            <template slot-scope="scope">
              <el-badge :is-dot="scope.row.status === 'charging'" class="status-badge">
                <el-tag :type="getStatusTag(scope.row.status)" size="small">
                  {{ getStatusName(scope.row.status) }}
                </el-tag>
              </el-badge>
            </template>
          </el-table-column>
          
          <el-table-column 
            label="今日充电" 
            prop="todayCharge" 
            min-width="90" 
            align="center">
            <template slot-scope="scope">
              <span class="number-text">{{ scope.row.todayCharge || 0 }}</span>
            </template>
          </el-table-column>
          
          <el-table-column 
            label="累计次数" 
            prop="totalCharge" 
            min-width="90" 
            align="center">
            <template slot-scope="scope">
              <span class="number-text">{{ scope.row.totalCharge || 0 }}</span>
            </template>
          </el-table-column>
          
          <el-table-column 
            label="添加时间" 
            prop="createTime" 
            min-width="160"
            show-overflow-tooltip>
          </el-table-column>
          
          <!-- 操作列优化：自适应宽度 -->
          <el-table-column 
            label="操作" 
            min-width="200" 
            fixed="right"
            class-name="table-operation-column">
            <template slot-scope="scope">
              <!-- 大屏显示：按钮组 -->
              <div class="operation-buttons">
                <el-button 
                  type="text" 
                  size="small"
                  icon="el-icon-edit" 
                  @click="handleEdit(scope.row)"
                  class="operation-btn">
                  编辑
                </el-button>
                <el-button 
                  type="text" 
                  size="small"
                  icon="el-icon-view" 
                  @click="handleDetail(scope.row)"
                  class="operation-btn">
                  详情
                </el-button>
              </div>
              
              <!-- 小屏显示：下拉菜单 -->
              <div class="operation-dropdown">
                <el-dropdown trigger="click" @command="handleCommand($event, scope.row)">
                  <el-button type="text" icon="el-icon-more"></el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="edit" icon="el-icon-edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="detail" icon="el-icon-view">详情</el-dropdown-item>
                    <el-dropdown-item command="delete" icon="el-icon-delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="pagination.currentPage"
            :page-sizes="[10, 20, 30, 50]"
            :page-size="pagination.pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total">
          </el-pagination>
        </div>
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="650px"
      :close-on-click-modal="false">
      <el-form :model="deviceForm" :rules="rules" ref="deviceForm" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备编号" prop="deviceCode">
              <el-input v-model="deviceForm.deviceCode" placeholder="请输入设备编号"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="deviceName">
              <el-input v-model="deviceForm.deviceName" placeholder="请输入设备名称"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备类型" prop="type">
              <el-select v-model="deviceForm.type" placeholder="请选择" style="width: 100%">
                <el-option label="直流快充" value="dc_fast"></el-option>
                <el-option label="交流慢充" value="ac_slow"></el-option>
                <el-option label="超级快充" value="super_fast"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="额定功率(kW)" prop="power">
              <el-input-number v-model="deviceForm.power" :min="0" :max="500" style="width: 100%"></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属站点" prop="stationId">
              <el-select v-model="deviceForm.stationId" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="station in stationList"
                  :key="station.id"
                  :label="station.name"
                  :value="station.id">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备IP" prop="ipAddress">
              <el-input v-model="deviceForm.ipAddress" placeholder="例：192.168.1.100"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="设备位置" prop="location">
          <el-input v-model="deviceForm.location" placeholder="请输入设备安装位置"></el-input>
        </el-form-item>
        
        <el-form-item label="备注信息">
          <el-input
            type="textarea"
            v-model="deviceForm.remark"
            :rows="3"
            placeholder="请输入备注信息">
          </el-input>
        </el-form-item>
      </el-form>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ChargingStationManagement',
  data() {
    return {
      // 视图模式
      viewMode: 'table', // 默认改为表格视图以便查看效果
      // 搜索表单
      searchForm: {
        keyword: '',
        status: '',
        type: ''
      },
      // 设备表单
      deviceForm: {
        deviceCode: '',
        deviceName: '',
        type: '',
        power: 60,
        stationId: '',
        ipAddress: '',
        location: '',
        remark: ''
      },
      // 表单验证规则
      rules: {
        deviceCode: [
          { required: true, message: '请输入设备编号', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        deviceName: [
          { required: true, message: '请输入设备名称', trigger: 'blur' }
        ],
        type: [
          { required: true, message: '请选择设备类型', trigger: 'change' }
        ],
        power: [
          { required: true, message: '请输入功率', trigger: 'blur' }
        ],
        stationId: [
          { required: true, message: '请选择所属站点', trigger: 'change' }
        ],
        ipAddress: [
          { required: true, message: '请输入设备IP地址', trigger: 'blur' },
          { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: '请输入正确的IP地址', trigger: 'blur' }
        ],
        location: [
          { required: true, message: '请输入设备位置', trigger: 'blur' }
        ]
      },
      // 统计数据
      statistics: {
        total: 45,
        online: 28,
        charging: 12,
        fault: 3
      },
      // 设备列表
      deviceList: [],
      // 站点列表
      stationList: [
        { id: 1, name: '东城充电站' },
        { id: 2, name: '西城充电站' },
        { id: 3, name: '南城充电站' },
        { id: 4, name: '北城充电站' },
        { id: 5, name: '中心充电站' }
      ],
      // 分页
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      loading: false,
      dialogVisible: false,
      dialogTitle: '添加设备',
      editingId: null
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    // 加载数据
    loadData() {
      this.loading = true
      setTimeout(() => {
        // 生成更多测试数据以便查看表格效果
        this.deviceList = [
          {
            id: 1,
            deviceCode: 'DC001',
            deviceName: '1号直流充电桩',
            type: 'dc_fast',
            power: 120,
            stationName: '东城充电站',
            status: 'charging',
            todayCharge: 8,
            totalCharge: 1247,
            createTime: '2024-03-01 10:00:00'
          },
          {
            id: 2,
            deviceCode: 'AC002',
            deviceName: '2号交流充电桩',
            type: 'ac_slow',
            power: 7,
            stationName: '西城充电站',
            status: 'online',
            todayCharge: 3,
            totalCharge: 856,
            createTime: '2024-03-02 14:30:00'
          },
          {
            id: 3,
            deviceCode: 'SF003',
            deviceName: '3号超级快充桩',
            type: 'super_fast',
            power: 250,
            stationName: '中心充电站',
            status: 'online',
            todayCharge: 12,
            totalCharge: 2103,
            createTime: '2024-03-03 09:15:00'
          },
          {
            id: 4,
            deviceCode: 'AC004',
            deviceName: '4号交流充电桩',
            type: 'ac_slow',
            power: 11,
            stationName: '北城充电站',
            status: 'fault',
            todayCharge: 0,
            totalCharge: 643,
            createTime: '2024-03-04 16:45:00'
          },
          {
            id: 5,
            deviceCode: 'DC005',
            deviceName: '5号直流充电桩',
            type: 'dc_fast',
            power: 60,
            stationName: '南城充电站',
            status: 'offline',
            todayCharge: 0,
            totalCharge: 1892,
            createTime: '2024-03-05 11:20:00'
          },
          {
            id: 6,
            deviceCode: 'SF006',
            deviceName: '6号超级快充桩',
            type: 'super_fast',
            power: 350,
            stationName: '东城充电站',
            status: 'charging',
            todayCharge: 15,
            totalCharge: 3421,
            createTime: '2024-03-06 08:30:00'
          },
          {
            id: 7,
            deviceCode: 'DC007',
            deviceName: '7号直流充电桩设备名称较长测试',
            type: 'dc_fast',
            power: 80,
            stationName: '东城充电站南区',
            status: 'online',
            todayCharge: 5,
            totalCharge: 987,
            createTime: '2024-03-07 12:00:00'
          },
          {
            id: 8,
            deviceCode: 'AC008',
            deviceName: '8号交流充电桩',
            type: 'ac_slow',
            power: 22,
            stationName: '西城充电站',
            status: 'charging',
            todayCharge: 2,
            totalCharge: 456,
            createTime: '2024-03-08 15:30:00'
          }
        ]
        this.pagination.total = 45
        this.loading = false
      }, 800)
    },
    // 搜索
    handleSearch() {
      this.pagination.currentPage = 1
      this.loadData()
    },
    // 重置搜索
    resetSearch() {
      this.searchForm = {
        keyword: '',
        status: '',
        type: ''
      }
      this.handleSearch()
    },
    // 刷新数据
    refreshData() {
      this.$message.success('数据已刷新')
      this.loadData()
    },
    // 显示添加对话框
    showAddDialog() {
      this.dialogTitle = '添加设备'
      this.editingId = null
      this.deviceForm = {
        deviceCode: '',
        deviceName: '',
        type: '',
        power: 60,
        stationId: '',
        ipAddress: '',
        location: '',
        remark: ''
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.deviceForm && this.$refs.deviceForm.clearValidate()
      })
    },
    // 编辑
    handleEdit(row) {
      this.dialogTitle = '编辑设备'
      this.editingId = row.id
      this.deviceForm = {
        deviceCode: row.deviceCode,
        deviceName: row.deviceName,
        type: row.type,
        power: row.power,
        stationId: 1,
        ipAddress: '192.168.1.100',
        location: 'A区B座3层',
        remark: ''
      }
      this.dialogVisible = true
    },
    // 查看详情
    handleDetail(row) {
      this.$router.push({
      path: `/device/charging/detail/${row.id}`,
      query: { 
        name: row.meterName,
        serial: row.serial,
        deviceId: row.id
      }
    });
    },
    // 删除
    handleDelete(row) {
      this.$confirm('确定要删除设备 "' + row.deviceName + '" 吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('删除成功')
        this.loadData()
      }).catch(() => {})
    },
    // 提交表单
    handleSubmit() {
      this.$refs.deviceForm.validate((valid) => {
        if (valid) {
          const message = this.editingId ? '修改成功' : '添加成功'
          this.$message.success(message)
          this.dialogVisible = false
          this.loadData()
        }
      })
    },
    // 下拉菜单命令
    handleCommand(command, device) {
      switch(command) {
        case 'edit':
          this.handleEdit(device)
          break
        case 'detail':
          this.handleDetail(device)
          break
        case 'delete':
          this.handleDelete(device)
          break
      }
    },
    // 分页
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.loadData()
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.loadData()
    },
    // 获取类型标签
    getTypeTag(type) {
      const map = {
        'dc_fast': '',
        'ac_slow': 'success',
        'super_fast': 'warning'
      }
      return map[type] || 'info'
    },
    // 获取类型名称
    getTypeName(type) {
      const map = {
        'dc_fast': '直流快充',
        'ac_slow': '交流慢充',
        'super_fast': '超级快充'
      }
      return map[type] || '未知'
    },
    // 获取状态标签
    getStatusTag(status) {
      const map = {
        'online': 'success',
        'charging': '',
        'offline': 'info',
        'fault': 'danger'
      }
      return map[status] || 'info'
    },
    // 获取状态名称
    getStatusName(status) {
      const map = {
        'online': '在线',
        'charging': '充电中',
        'offline': '离线',
        'fault': '故障'
      }
      return map[status] || '未知'
    }
  }
}
</script>

<style scoped>
.charging-station-page {
  min-height: 100vh;
  background: #f0f2f5;
  padding: 24px;
}

/* 顶部操作栏 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
  color: #1f2329;
}

.page-title i {
  margin-right: 10px;
  color: #4e5969;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.03);
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
}

.stat-icon.blue {
  background: #e6f4ff;
  color: #1890ff;
}

.stat-icon.green {
  background: #f6ffed;
  color: #52c41a;
}

.stat-icon.orange {
  background: #fff7e6;
  color: #fa8c16;
}

.stat-icon.red {
  background: #fff1f0;
  color: #ff4d4f;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1f2329;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #86909c;
  margin-top: 4px;
}

/* 主内容区 */
.main-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.03);
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e6eb;
}

.filter-left {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-left .el-input {
  width: 200px;
}

.filter-left .el-select {
  width: 120px;
}

/* 卡片视图 */
.card-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.device-card {
  background: white;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  position: relative;
}

.device-card:hover {
  box-shadow: 0 6px 24px rgba(0,0,0,0.1);
  transform: translateY(-4px);
}

.card-status {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.card-status.status-online { background: #52c41a; }
.card-status.status-charging { 
  background: linear-gradient(90deg, #1890ff 0%, #52c41a 100%);
  animation: pulse 2s infinite;
}
.card-status.status-offline { background: #d9d9d9; }
.card-status.status-fault { background: #ff4d4f; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.card-header {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f1f3;
}

.device-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 12px;
}

.device-icon.icon-online {
  background: #f6ffed;
  color: #52c41a;
}

.device-icon.icon-charging {
  background: #e6f4ff;
  color: #1890ff;
}

.device-icon.icon-offline {
  background: #fafafa;
  color: #d9d9d9;
}

.device-icon.icon-fault {
  background: #fff1f0;
  color: #ff4d4f;
}

.device-info {
  flex: 1;
}

.device-name {
  font-size: 16px;
  font-weight: 500;
  color: #1f2329;
  margin-bottom: 4px;
}

.device-code {
  font-size: 12px;
  color: #86909c;
  font-family: 'Monaco', monospace;
}

.card-body {
  padding: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 13px;
  color: #86909c;
}

.info-value {
  font-size: 14px;
  color: #1f2329;
  font-weight: 500;
}

.card-footer {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: #fafbfc;
  border-top: 1px solid #f0f1f3;
}

.card-footer .stat-item {
  flex: 1;
  text-align: center;
}

.card-footer .stat-num {
  font-size: 20px;
  font-weight: 600;
  color: #1f2329;
}

.card-footer .stat-text {
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: #e5e6eb;
}

/* 表格视图 - 核心优化部分 */
.table-view {
  min-height: 400px;
  overflow-x: auto;
}

/* 自适应表格容器 */
.device-table {
  min-width: 100%;
}

/* 表格操作列样式优化 */
.table-operation-column {
  min-width: 200px !important;
}

/* 操作按钮容器 - 默认显示按钮组 */
.operation-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: flex-start;
}

/* 操作按钮样式优化 */
.operation-btn {
  padding: 5px 8px !important;
  margin: 0 !important;
  white-space: nowrap;
  font-size: 13px !important;
  line-height: 1.2 !important;
}

/* 下拉菜单默认隐藏 */
.operation-dropdown {
  display: none;
}

/* 表格内容样式 */
.code-text {
  font-family: 'Monaco', monospace;
  color: #1890ff;
  font-weight: 500;
}

.power-text {
  font-weight: 600;
  color: #52c41a;
}

.number-text {
  font-weight: 500;
  color: #1f2329;
}

.status-badge .el-badge__content {
  background: #52c41a;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.danger-btn {
  color: #ff4d4f !important;
}

.danger-btn:hover {
  color: #ff7875 !important;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e6eb;
}

/* 对话框样式 */
.el-dialog__header {
  padding: 20px;
  border-bottom: 1px solid #e5e6eb;
}

.el-dialog__body {
  padding: 24px;
}

.el-dialog__footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e6eb;
}

/* Element UI 样式覆盖 */
.el-button--primary {
  background: #1890ff;
  border-color: #1890ff;
}

.el-button--primary:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

.el-input__inner {
  border-radius: 4px;
}

.el-select .el-input__inner {
  border-radius: 4px;
}

.el-table th {
  font-weight: 500;
}

.el-table td {
  color: #4e5969;
}

.el-table tr:hover > td {
  background: #fafbfc !important;
}

/* 修复表格列宽度 */
.el-table .cell {
  padding: 0 12px;
  line-height: 23px;
}

/* 防止表格内容溢出 */
.el-table td.el-table__cell {
  word-break: break-word;
}

.el-tag {
  border-radius: 4px;
}

.el-tag--small {
  padding: 0 8px;
  height: 22px;
  line-height: 20px;
}

.el-dropdown-menu__item {
  font-size: 13px;
}

.el-dropdown-menu__item i {
  margin-right: 8px;
}

/* 响应式设计 - 关键优化 */

/* 大屏幕 (>1440px) */
@media (min-width: 1441px) {
  .operation-buttons {
    gap: 12px;
  }
  
  .operation-btn {
    padding: 6px 12px !important;
  }
}

/* 中等屏幕 (1200px - 1440px) */
@media (max-width: 1440px) and (min-width: 1201px) {
  .operation-buttons {
    gap: 6px;
  }
  
  .operation-btn {
    padding: 4px 8px !important;
    font-size: 12px !important;
  }
  
  .operation-btn i {
    margin-right: 2px !important;
  }
}

/* 平板横屏 (992px - 1200px) */
@media (max-width: 1200px) and (min-width: 993px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  /* 表格操作按钮紧凑模式 */
  .operation-buttons {
    gap: 4px;
  }
  
  .operation-btn {
    padding: 3px 6px !important;
    font-size: 12px !important;
  }
  
  /* 只显示图标 */
  .operation-btn span {
    display: none;
  }
  
  .operation-btn i {
    margin-right: 0 !important;
  }
}

/* 平板竖屏 (768px - 992px) */
@media (max-width: 992px) and (min-width: 769px) {
  /* 隐藏按钮组，显示下拉菜单 */
  .operation-buttons {
    display: none !important;
  }
  
  .operation-dropdown {
    display: block !important;
  }
  
  /* 调整表格列最小宽度 */
  .table-operation-column {
    min-width: 80px !important;
  }
}

/* 手机端 (<768px) */
@media (max-width: 768px) {
  .charging-station-page {
    padding: 16px;
  }
  
  .top-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .filter-bar {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .filter-left {
    flex-wrap: wrap;
    width: 100%;
  }
  
  .filter-left .el-input,
  .filter-left .el-select {
    width: 100%;
  }
  
  .card-view {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .action-buttons .el-button {
    flex: 1;
    min-width: 80px;
  }
  
  /* 表格在移动端使用下拉菜单 */
  .operation-buttons {
    display: none !important;
  }
  
  .operation-dropdown {
    display: block !important;
  }
  
  .table-operation-column {
    min-width: 60px !important;
  }
  
  /* 移动端表格横向滚动 */
  .el-table {
    font-size: 12px;
  }
  
  .el-table .cell {
    padding: 0 8px;
  }
  
  /* 分页器响应式 */
  .pagination-wrapper {
    overflow-x: auto;
  }
  
  .el-pagination {
    white-space: nowrap;
  }
}

/* 超小屏幕 (<480px) */
@media (max-width: 480px) {
  .page-title {
    font-size: 18px;
  }
  
  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .action-buttons .el-button {
    width: 100%;
    margin: 0 0 8px 0 !important;
  }
  
  /* 对话框适配 */
  .el-dialog {
    width: 95% !important;
    margin: 10px auto !important;
  }
  
  .el-dialog .el-row {
    display: block;
  }
  
  .el-dialog .el-col {
    width: 100%;
    margin-bottom: 16px;
  }
}

/* 加载动画 */
.el-loading-mask {
  background-color: rgba(255, 255, 255, 0.95);
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 表格固定列阴影效果 */
.el-table__fixed-right {
  box-shadow: -2px 0 6px rgba(0,0,0,0.05);
}

.el-table__fixed {
  box-shadow: 2px 0 6px rgba(0,0,0,0.05);
}

/* 优化表格悬浮效果 */
.el-table tbody tr:hover > td {
  background-color: #f5f7fa !important;
}

/* 确保操作按钮不换行 */
.el-table .el-button--text {
  white-space: nowrap;
}

/* 防止表格内容被挤压 */
.el-table th > .cell,
.el-table td > .cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 有 show-overflow-tooltip 的列允许换行 */
.el-table .el-tooltip {
  max-width: 300px;
  word-break: break-word;
  white-space: normal;
}
</style>