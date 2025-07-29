<template>
  <div class="meter-management-container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-card class="search-card" shadow="never">
        <el-form :model="queryData" ref="searchForm" class="search-form">
          <!-- 基础筛选 -->
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="电表序列号" prop="serial">
                <el-input 
                  v-model="queryData.serial" 
                  placeholder="请输入电表序列号"
                  clearable
                  prefix-icon="el-icon-search"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="电表名称" prop="meterName">
                <el-input 
                  v-model="queryData.meterName" 
                  placeholder="请输入电表名称"
                  clearable
                  prefix-icon="el-icon-search"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="项目名称/编号" prop="managerId">
                <el-input 
                  v-model="queryData.managerId" 
                  placeholder="项目名称或编号"
                  clearable
                  prefix-icon="el-icon-office-building"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="已绑租户" prop="bindId">
                <el-input 
                  v-model="queryData.bindId" 
                  placeholder="租户名称或编码"
                  clearable
                  prefix-icon="el-icon-user"
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- 高级筛选 -->
          <el-collapse-transition>
            <el-row :gutter="20" v-show="showAdvanced">
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label="在线状态" prop="onlineStatus">
                  <el-select 
                    v-model="queryData.onlineStatus" 
                    placeholder="请选择"
                    clearable
                    style="width: 100%"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="在线" value="1">
                      <span class="option-with-dot">
                        <span class="status-dot online"></span>
                        在线
                      </span>
                    </el-option>
                    <el-option label="离线" value="0">
                      <span class="option-with-dot">
                        <span class="status-dot offline"></span>
                        离线
                      </span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label="电表类型" prop="bindType">
                  <el-select 
                    v-model="queryData.bindType" 
                    placeholder="请选择"
                    clearable
                    style="width: 100%"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="专用表" value="1" />
                    <el-option label="公摊表" value="2" />
                    <el-option label="公式表" value="3" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label="分合闸状态" prop="switchStatus">
                  <el-select 
                    v-model="queryData.switchStatus" 
                    placeholder="请选择"
                    clearable
                    style="width: 100%"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="分闸" value="0" />
                    <el-option label="合闸" value="1" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label="设备编号" prop="id">
                  <el-input 
                    v-model="queryData.id" 
                    placeholder="请输入设备编号"
                    clearable
                    prefix-icon="el-icon-search"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-transition>
          
          <!-- 操作按钮行 -->
          <el-row>
            <el-col :span="24">
              <div class="form-actions">
                <div class="action-left">
                  <el-button type="primary" icon="el-icon-search" @click="handleSearch">
                    查询
                  </el-button>
                  <el-button icon="el-icon-refresh" @click="handleReset">
                    重置
                  </el-button>
                </div>
                <div class="action-right">
                  <el-button type="primary" icon="el-icon-plus" @click="handleAdd">
                    新增电表
                  </el-button>
                  <el-dropdown trigger="click" @command="handleCommand">
                    <el-button icon="el-icon-more">
                      更多操作 <i class="el-icon-arrow-down el-icon--right"></i>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item command="export" icon="el-icon-download">
                        导出数据
                      </el-dropdown-item>
                      <el-dropdown-item command="switch" icon="el-icon-sort">
                        高级筛选
                      </el-dropdown-item>
                
                    </el-dropdown-menu>
                  </el-dropdown>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
    </div>

    <!-- 数据表格区域 -->
    <div class="table-container">
      <el-card class="table-card" shadow="never">
        <!-- 表格工具栏 -->
        <div class="table-toolbar">
          <div class="toolbar-left">
            <span class="selection-info" v-if="selectedData.length > 0">
              已选择 <span class="count">{{ selectedData.length }}</span> 条数据
            </span>
          </div>
          <div class="toolbar-right">
            <el-tooltip content="刷新数据" placement="top">
              <el-button 
                icon="el-icon-refresh" 
                circle 
                size="small"
                @click="fetchTableData"
              />
            </el-tooltip>
            <el-tooltip content="表格设置" placement="top">
              <el-button 
                icon="el-icon-setting" 
                circle 
                size="small"
                @click="handleTableSetting"
              />
            </el-tooltip>
          </div>
        </div>

        <!-- 数据表格 -->
        <el-table
          v-loading="loading"
          :data="tableData"
          border
          stripe
          style="width: 100%"
          class="custom-table"
          @selection-change="handleSelectionChange"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: '600'
          }"
        >
          <el-table-column type="selection" width="55" align="center" />
          
          <!-- 按照tableKey配置显示列 -->
          <el-table-column 
            v-for="col in displayColumns" 
            :key="col.key"
            :prop="col.key" 
            :label="col.label" 
            :width="col.width"
            :min-width="col.minWidth"
            :align="col.align || 'center'"
            :show-overflow-tooltip="true"
          >
            <template slot-scope="scope">
              <!-- 设备名称 -->
              <template v-if="col.key === 'meterName'">
                <el-link type="primary" @click="handleMonitor(scope.row)">
                  <i class="el-icon-monitor"></i>
                  {{ scope.row.meterName || '-' }}
                </el-link>
              </template>
              
              <!-- 电表类型 -->
              <template v-else-if="col.key === 'bindTypeLabel'">
                <el-tag 
                  v-if="scope.row.bindType == 1" 
                  type="primary" 
                  size="small"
                  effect="plain"
                >
                  专用表
                </el-tag>
                <el-tag 
                  v-else-if="scope.row.bindType == 2" 
                  type="warning" 
                  size="small"
                  effect="plain"
                >
                  公摊表
                </el-tag>
                <el-tag 
                  v-else-if="scope.row.bindType == 3" 
                  type="info" 
                  size="small"
                  effect="plain"
                >
                  公式表
                </el-tag>
                <span v-else>-</span>
              </template>
              
              <!-- 归属项目 -->
              <template v-else-if="col.key === 'managerName'">
                <el-link type="primary" @click="handleProjectClick(scope.row)">
                  <i class="el-icon-office-building"></i>
                  {{ scope.row.managerName || '-' }}
                </el-link>
              </template>
              
              <!-- 已绑租户 -->
              <template v-else-if="col.key === 'bindName'">
                <el-link v-if="scope.row.bindId" type="primary" @click="handleTenantClick(scope.row)">
                  <i class="el-icon-user"></i>
                  {{ scope.row.bindName }}
                </el-link>
                <span v-else class="text-muted">未绑定</span>
              </template>
              
              <!-- 付费模式 -->
              <template v-else-if="col.key === 'logicPayTypeLabel'">
                <el-tag 
                  v-if="scope.row.logicPayType == 0" 
                  type="success" 
                  size="small"
                >
                  预付费
                </el-tag>
                <el-tag 
                  v-else-if="scope.row.logicPayType == 1" 
                  type="primary" 
                  size="small"
                >
                  强控
                </el-tag>
                <span v-else>-</span>
              </template>
              
              <!-- 分合闸状态 -->
              <template v-else-if="col.key === 'switchStatusLabel'">
                <div class="switch-status">
                  <i 
                    :class="scope.row.switchStatus == 1 ? 'el-icon-switch-button' : 'el-icon-turn-off'"
                    :style="{color: scope.row.switchStatus == 1 ? '#67C23A' : '#909399'}"
                  ></i>
                  {{ scope.row.switchStatus == 1 ? '合闸' : '分闸' }}
                </div>
              </template>
              
              <!-- 在线状态 -->
              <template v-else-if="col.key === 'onlineStatusStatus'">
                <div class="status-wrapper">
                  <span :class="['status-dot', scope.row.onlineStatus == 1 ? 'online' : 'offline']"></span>
                  <span>{{ scope.row.onlineStatus == 1 ? '在线' : '离线' }}</span>
                </div>
              </template>
              
              <!-- 余额 -->
              <template v-else-if="col.key === 'balance'">
                <span class="balance-text">
                  {{ scope.row.balance !== null && scope.row.balance !== undefined ? '¥' + parseFloat(scope.row.balance).toFixed(2) : '-' }}
                </span>
              </template>
              
              <!-- 默认显示 -->
              <template v-else>
                {{ scope.row[col.key] || '-' }}
              </template>
            </template>
          </el-table-column>
          
          <!-- 操作列 -->
          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template slot-scope="scope">
              <div class="table-actions-group">
                <el-button 
                  type="text" 
                  size="small" 
                  icon="el-icon-setting"
                  @click="handleEdit(scope.row)"
                >
                  设置
                </el-button>
                <el-divider direction="vertical"></el-divider>
                <el-dropdown trigger="click" @command="handleTableCommand($event, scope.row)">
                  <el-button type="text" size="small">
                    更多
                    <i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item 
                      :command="scope.row.switchStatus == 1 ? 'switch-off' : 'switch-on'"
                      :icon="scope.row.switchStatus == 1 ? 'el-icon-turn-off' : 'el-icon-switch-button'"
                    >
                      {{ scope.row.switchStatus == 1 ? '分闸' : '合闸' }}
                    </el-dropdown-item>
                    <el-dropdown-item command="monitor" icon="el-icon-monitor">
                      电表监控
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            :current-page="pageData.current"
            :page-sizes="[20, 30, 50, 100]"
            :page-size="pageData.size"
            :total="pageData.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog
      :title="editForm.id ? '编辑电表' : '新增电表'"
      :visible.sync="dialogVisible"
      width="680px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <el-form ref="editForm" :model="editForm" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="序列号" prop="serial">
              <el-input 
                v-model="editForm.serial" 
                placeholder="请输入序列号" 
                :disabled="!!editForm.id"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="IMEI" prop="imei">
              <el-input v-model="editForm.imei" placeholder="请输入IMEI" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="电表名称" prop="meterName">
              <el-input v-model="editForm.meterName" placeholder="请输入电表名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电表类型" prop="bindType">
              <el-select v-model="editForm.bindType" placeholder="请选择电表类型" style="width: 100%">
                <el-option 
                  v-for="(item, key) in MeterBindType" 
                  :key="key" 
                  :label="item.label" 
                  :value="item.value" 
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="付费模式" prop="logicPayType">
              <el-select v-model="editForm.logicPayType" placeholder="请选择付费模式" style="width: 100%">
                <el-option 
                  v-for="(item, key) in MeterPayType" 
                  :key="key" 
                  :label="item.label" 
                  :value="item.value" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电表相位" prop="phase">
              <el-select v-model="editForm.phase" placeholder="请选择电表相位" style="width: 100%">
                <el-option 
                  v-for="(item, key) in MeterPhase" 
                  :key="key" 
                  :label="item.label" 
                  :value="item.value" 
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="CT" prop="ct">
              <el-input-number 
                v-model="editForm.ct" 
                :min="1" 
                placeholder="请输入CT值" 
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="PT" prop="pt">
              <el-input-number 
                v-model="editForm.pt" 
                :min="1" 
                placeholder="请输入PT值" 
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSave">
          {{ submitting ? '保存中...' : '确 定' }}
        </el-button>
      </span>
    </el-dialog>

    <!-- 修改预付费模式弹窗 -->
    <el-dialog
      title="操作确认"
      :visible.sync="payTypeDialog.visible"
      width="420px"
      :close-on-click-modal="false"
      class="confirm-dialog"
    >
      <div class="confirm-content">
        <i class="el-icon-warning warning-icon"></i>
        <div class="confirm-text">
          <p>该电表为预付费模式，需要先修改为强控模式才能进行分合闸操作。</p>
          <p>是否立即修改？</p>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="payTypeDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="handleUpdatePayType">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
// 导入API
import {
  meterPageMeterInfoByAdmin,
  meterAddMeter,
  meterUpdateMeterBase,
  tenantDoMeterSwitchOffOn,
  meterUpdateLogicPayType
} from '@/api/meter'

// 导入枚举
import { 
  MeterBindType, 
  MeterPayType, 
  MeterSwitchStatus, 
  MeterOnlineStatus,
  MeterPhase,
  MeterMonitorType,
  getEnumLabel,
  getEnumItem
} from '@/utils/enums/meter'

import { mapGetters } from 'vuex'

export default {
  name: 'MeterManagement',
  data() {
    return {
      // 查询参数
      queryData: {
        bindId: '',
        bindType: '',
        id: '',
        managerId: '',
        meterName: '',
        onlineStatus: '',
        serial: '',
        switchStatus: ''
      },
      // 表格数据
      tableData: [],
      // 加载状态
      loading: false,
      submitting: false,
      // 是否显示高级筛选
      showAdvanced: false,
      // 分页数据
      pageData: {
        current: 1,
        size: 20,
        total: 0
      },
      // 选中的数据
      selectedData: [],
      // 编辑弹窗
      dialogVisible: false,
      // 编辑表单
      editForm: {
        id: '',
        serial: '',
        imei: '',
        meterName: '',
        bindType: '',
        logicPayType: '',
        ct: 1,
        pt: 1,
        phase: '',
        managerId: ''
      },
      // 表单验证规则
      rules: {
        serial: [
          { required: true, message: '请输入序列号', trigger: 'blur' }
        ],
        meterName: [
          { required: true, message: '请输入电表名称', trigger: 'blur' }
        ],
        bindType: [
          { required: true, message: '请选择电表类型', trigger: 'change' }
        ],
        logicPayType: [
          { required: true, message: '请选择付费模式', trigger: 'change' }
        ],
        phase: [
          { required: true, message: '请选择电表相位', trigger: 'change' }
        ]
      },
      // 预付费修改弹窗
      payTypeDialog: {
        visible: false,
        row: null,
        switchType: null
      },
      // 枚举数据
      MeterBindType,
      MeterPayType,
      MeterSwitchStatus,
      MeterOnlineStatus,
      MeterPhase,
      MeterMonitorType,
      // 表格列配置
      tableKey: [
        {
          label: '序列号',
          key: 'serial',
          width: '150',
          checked: true,
          disabled: true
        },
        {
          label: '设备编号',
          key: 'id',
          checked: true,
          width: '120'
        },
        {
          label: '设备名称',
          key: 'meterName',
          width: '200',
          checked: true,
          click: true,
          disabled: true,
          id: 630040
        },
        {
          label: '电表类型',
          key: 'bindTypeLabel',
          checked: true,
          width: '150'
        },
        {
          label: '归属项目',
          key: 'managerName',
          minWidth: '260',
          click: true,
          checked: true,
          disabled: true,
          id: 610011
        },
        {
          label: '项目编号',
          key: 'managerId',
          width: '120'
        },
        {
          label: '已绑租户',
          key: 'bindName',
          click: true,
          checked: true,
          width: '280',
          id: 610022
        },
        {
          label: '付费模式',
          checked: true,
          key: 'logicPayTypeLabel',
          width: '120'
        },
        {
          label: '分合闸状态',
          checked: true,
          key: 'switchStatusLabel',
          width: '140'
        },
        {
          label: '电表相位',
          checked: true,
          key: 'monitorType',
          width: '120'
        },
        {
          label: '创建时间',
          checked: true,
          key: 'createTime',
          width: '180'
        },
        {
          label: 'CT',
          key: 'ct',
          width: '120'
        },
        {
          label: 'PT',
          key: 'pt',
          width: '120'
        },
        {
          label: '余额',
          key: 'balance',
          width: '140'
        },
        {
          label: 'P',
          key: 'p',
          width: '120'
        },
        {
          label: 'Pa',
          key: 'pa',
          width: '120'
        },
        {
          label: 'Pb',
          key: 'pb',
          width: '120'
        },
        {
          label: 'Pc',
          key: 'pc',
          width: '120'
        },
        {
          label: '在线状态',
          checked: true,
          key: 'onlineStatusStatus',
          width: '120',
          type: 'status'
        },
        {
          label: '最新数据时间',
          key: 'syncTime',
          width: '160'
        }
      ]
    }
  },
  computed: {
    ...mapGetters("manager", ["currentManagerId"]),
    // 计算需要显示的列
    displayColumns() {
      return this.tableKey.filter(col => col.checked !== false)
    }
  },
  watch: {
    currentManagerId: {
      handler(newVal) {
        if (newVal) {
          this.queryData.managerId = newVal
          this.fetchTableData()
        }
      },
      immediate: true,
    },
  },
  mounted() {
    // 页面加载时会通过 watch 自动获取数据
  },
  methods: {
    // 获取电表列表数据
    async fetchTableData() {
      this.loading = true
      try {
        const params = {
          bindId: this.queryData.bindId,
          bindType: this.queryData.bindType,
          id: this.queryData.id,
          managerId: this.queryData.managerId,
          meterName: this.queryData.meterName,
          onlineStatus: this.queryData.onlineStatus,
          page: {
            current: this.pageData.current,
            size: this.pageData.size,
            orders: [{ asc: false, column: 'createTime' }]
          },
          serial: this.queryData.serial,
          switchStatus: this.queryData.switchStatus
        }
        
        const response = await meterPageMeterInfoByAdmin(params)
        
        if (response.code === 200 && response.data) {
          this.tableData = this.formatTableData(response.data.dataList || [])
          this.pageData.total = response.data.total || 0
        } else {
          this.$message.error(response.msg || '获取数据失败')
        }
      } catch (error) {
        this.$message.error('获取电表数据失败')
        console.error('获取电表数据失败:', error)
      } finally {
        this.loading = false
      }
    },
    
    // 格式化表格数据
    formatTableData(data) {
      return data.map(item => {
        // 已绑租户处理
        const bindName = item.bindName 
          ? `${item.bindId}(${item.bindName})` 
          : '-'
        
        // 电表类型标签
        const bindTypeLabel = getEnumLabel(MeterBindType, item.bindType)
        
        // 付费模式标签
        const logicPayTypeLabel = getEnumLabel(MeterPayType, item.logicPayType)
        
        // 分合闸状态标签
        const switchStatusLabel = getEnumLabel(MeterSwitchStatus, item.switchStatus)
        
        // 在线状态 - 返回完整对象
        const onlineStatusStatus = getEnumItem(MeterOnlineStatus, item.onlineStatus) || {
          label: '-',
          class: ''
        }
        
        // 电表相位 - 组合相位和监测类型
        let monitorType = '-'
        if (item.monitorType) {
          const monitorTypeLabel = getEnumLabel(MeterMonitorType, item.monitorType)
          const phaseLabel = getEnumLabel(MeterPhase, item.phase)
          if (phaseLabel && phaseLabel !== '-') {
            monitorType = phaseLabel + monitorTypeLabel
          } else {
            monitorType = monitorTypeLabel
          }
        }
        
        return {
          ...item,
          bindName,
          bindTypeLabel,
          logicPayTypeLabel,
          switchStatusLabel,
          onlineStatusStatus,
          monitorType
        }
      })
    },
    
    // 查询
    handleSearch() {
      this.pageData.current = 1
      this.fetchTableData()
    },
    
    // 重置
    handleReset() {
      this.queryData = {
        bindId: '',
        bindType: '',
        id: '',
        managerId: this.currentManagerId || '',
        meterName: '',
        onlineStatus: '',
        serial: '',
        switchStatus: ''
      }
      this.showAdvanced = false
      this.handleSearch()
    },
    
    // 处理顶部下拉命令
    handleCommand(command) {
      switch(command) {
        case 'export':
          this.handleExport()
          break
        case 'switch':
          this.handleBatchSwitch()
          break
        case 'manual1':
          this.handleManualBill(1)
          break
        case 'manual2':
          this.handleManualBill(2)
          break
      }
    },
    
    // 处理表格下拉命令
    handleTableCommand(command, row) {
      switch(command) {
        case 'switch-on':
          this.handleSwitch(row, 1)
          break
        case 'switch-off':
          this.handleSwitch(row, 0)
          break
        case 'monitor':
          this.handleMonitor(row)
          break
      }
    },
    
    // 新增电表
    handleAdd() {
      this.editForm = {
        id: '',
        serial: '',
        imei: '',
        meterName: '',
        bindType: '',
        logicPayType: '',
        ct: 1,
        pt: 1,
        phase: '',
        managerId: this.currentManagerId || ''
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate()
      })
    },
    
    // 编辑电表
    handleEdit(row) {
      this.editForm = {
        id: row.id,
        serial: row.serial,
        imei: row.imei || '',
        meterName: row.meterName,
        bindType: row.bindType,
        logicPayType: row.logicPayType,
        ct: row.ct || 1,
        pt: row.pt || 1,
        phase: row.phase,
        managerId: row.managerId
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate()
      })
    },
    
    // 保存
    async handleSave() {
      this.$refs.editForm.validate(async (valid) => {
        if (valid) {
          this.submitting = true
          try {
            let response
            if (this.editForm.id) {
              // 编辑
              response = await meterUpdateMeterBase(this.editForm)
            } else {
              // 新增
              response = await meterAddMeter(this.editForm)
            }
            
            if (response.code === 200) {
              this.$message.success(this.editForm.id ? '修改成功' : '新增成功')
              this.dialogVisible = false
              this.fetchTableData()
            } else {
              this.$message.error(response.msg || '操作失败')
            }
          } catch (error) {
            this.$message.error('操作失败')
            console.error('保存失败:', error)
          } finally {
            this.submitting = false
          }
        }
      })
    },
    
    // 分合闸操作
    async handleSwitch(row, type) {
      // 如果是预付费模式，需要先修改为强控
      if (row.logicPayType === 0 || row.logicPayType === '0') {
        this.payTypeDialog = {
          visible: true,
          row: row,
          switchType: type
        }
        return
      }
      
      const typeText = type === 1 ? '合闸' : '分闸'
      
      try {
        await this.$confirm(`确定要对电表"${row.meterName}"执行${typeText}操作吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const response = await tenantDoMeterSwitchOffOn({
          meterId: row.id,
          type: type
        })
        
        if (response.code === 200) {
          this.$message.success(`${typeText}操作成功`)
          this.fetchTableData()
        } else {
          this.$message.error(response.msg || `${typeText}操作失败`)
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(`${typeText}操作失败`)
          console.error('操作失败:', error)
        }
      }
    },
    
    // 修改付费类型
    async handleUpdatePayType() {
      try {
        const response = await meterUpdateLogicPayType({
          meterId: this.payTypeDialog.row.id,
          logicPayType: 1 // 改为强控
        })
        
        if (response.code === 200) {
          this.$message.success('付费模式修改成功')
          this.payTypeDialog.visible = false
          
          // 修改成功后执行分合闸操作
          setTimeout(() => {
            this.handleSwitch(this.payTypeDialog.row, this.payTypeDialog.switchType)
          }, 500)
        } else {
          this.$message.error(response.msg || '修改失败')
        }
      } catch (error) {
        this.$message.error('修改付费模式失败')
        console.error('修改失败:', error)
      }
    },
    
    // 电表监控
    handleMonitor(row) {
      this.$router.push({
        path: '/mt-ammeterIncident',
        query: { id: row.serial, type: 1 }
      })
    },
    
    // 项目点击
    handleProjectClick(row) {
      this.$router.push({
        path: '/project-maintain-detail',
        query: { id: row.managerId }
      })
    },
    
    // 租户点击
    handleTenantClick(row) {
      this.$router.push({ 
        path: '/project-tenement-detail', 
        query: { id: row.bindId, managerId: row.managerId }
      })
    },
    
    // 手动账单
    handleManualBill(type) {
      this.$router.push({ 
        path: '/mt-orderTool', 
        query: { type }
      })
    },
    
    
    handleBatchSwitch() {
      this.showAdvanced = !this.showAdvanced
    },
    
    // 导出数据
    handleExport() {
      if (this.selectedData.length === 0) {
        this.$message.warning('请先选择要导出的数据')
        return
      }
      this.$message.info('导出功能开发中...')
    },
    
    // 表格设置
    handleTableSetting() {
      this.$message.info('表格设置功能开发中...')
    },
    
    // 选择变化
    handleSelectionChange(selection) {
      this.selectedData = selection
    },
    
    // 分页大小变化
    handleSizeChange(val) {
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchTableData()
    },
    
    // 当前页变化
    handleCurrentChange(val) {
      this.pageData.current = val
      this.fetchTableData()
    }
  }
}
</script>

<style lang="scss" scoped>
.meter-management-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 16px;
  
  // 搜索区域
  .search-container {
    margin-bottom: 16px;
    
    .search-card {
      ::v-deep .el-card__body {
        padding: 20px;
      }
      
      .search-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        
        .search-title {
          font-size: 16px;
          font-weight: 500;
          color: #303133;
          
          i {
            margin-right: 6px;
            color: #409EFF;
          }
        }
        
        .search-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
      }
      
      .search-form {
        ::v-deep .el-form-item {
          margin-bottom: 16px;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          .el-form-item__label {
            font-weight: 400;
            color: #606266;
          }
        }
        
        // 操作按钮行样式
        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #ebeef5;
          
          .action-left {
            display: flex;
            gap: 12px;
          }
          
          .action-right {
            display: flex;
            gap: 12px;
          }
        }
      }
    }
  }
  
  // 表格区域
  .table-container {
    .table-card {
      ::v-deep .el-card__body {
        padding: 0;
      }
      
      .table-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #ebeef5;
        
        .toolbar-left {
          .selection-info {
            font-size: 14px;
            color: #606266;
            
            .count {
              color: #409EFF;
              font-weight: 600;
              margin: 0 4px;
            }
          }
        }
        
        .toolbar-right {
          display: flex;
          gap: 8px;
        }
      }
      
      .custom-table {
        ::v-deep {
          .el-table__header-wrapper {
            .el-table__header {
              th {
                background-color: #f5f7fa;
                color: #606266;
                font-weight: 600;
                font-size: 14px;
              }
            }
          }
          
          .el-table__body-wrapper {
            .el-table__row {
              &:hover {
                background-color: #f5f7fa;
              }
              
              td {
                padding: 12px 0;
                font-size: 14px;
              }
            }
          }
        }
        
        // 状态样式
        .status-wrapper {
          display: inline-flex;
          align-items: center;
          
          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 6px;
            flex-shrink: 0;
            
            &.online {
              background-color: #67C23A;
              box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
            }
            
            &.offline {
              background-color: #F56C6C;
              box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
            }
          }
        }
        
        .switch-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          
          i {
            font-size: 16px;
          }
        }
        
        .balance-text {
          color: #F56C6C;
          font-weight: 500;
        }
        
        .text-muted {
          color: #909399;
        }
        
        .table-actions-group {
          display: flex;
          align-items: center;
          justify-content: center;
          
          .el-divider--vertical {
            height: 12px;
            margin: 0 8px;
          }
        }
      }
      
      .pagination-container {
        padding: 20px;
        display: flex;
        justify-content: flex-end;
        border-top: 1px solid #ebeef5;
      }
    }
  }
  
  // 选项样式
  .option-with-dot {
    display: inline-flex;
    align-items: center;
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;
      
      &.online {
        background-color: #67C23A;
      }
      
      &.offline {
        background-color: #F56C6C;
      }
    }
  }
  
  // 自定义对话框
  .custom-dialog {
    ::v-deep {
      .el-dialog__header {
        padding: 20px;
        border-bottom: 1px solid #ebeef5;
        
        .el-dialog__title {
          font-size: 18px;
          font-weight: 500;
          color: #303133;
        }
      }
      
      .el-dialog__body {
        padding: 20px;
      }
      
      .el-dialog__footer {
        padding: 20px;
        border-top: 1px solid #ebeef5;
      }
    }
  }
  
  // 确认对话框
  .confirm-dialog {
    ::v-deep .el-dialog__body {
      padding: 30px 20px;
    }
    
    .confirm-content {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      
      .warning-icon {
        font-size: 24px;
        color: #E6A23C;
        flex-shrink: 0;
        margin-top: 2px;
      }
      
      .confirm-text {
        flex: 1;
        
        p {
          margin: 0 0 12px 0;
          font-size: 14px;
          line-height: 1.6;
          color: #606266;
          
          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .meter-management-container {
    padding: 8px;
    
    .search-container {
      .search-form {
        .form-actions {
          flex-direction: column;
          gap: 12px;
          
          .action-left,
          .action-right {
            width: 100%;
            
            .el-button {
              width: 48%;
            }
          }
        }
      }
    }
    
    .table-container {
      .table-toolbar {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        
        .toolbar-right {
          align-self: flex-end;
        }
      }
    }
  }
}
</style>