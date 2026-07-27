<template>
    <div class="table-page-container">
      <!-- 搜索区域 -->
      <div class="search-container">
        <el-card class="search-card" shadow="never">
          <el-form
            :model="queryData"
            ref="searchForm"
            class="search-form compact-form"
            label-position="left"
            label-width="80px"
          >
            <!-- 基础筛选 - 动态渲染 -->
            <el-row :gutter="16" class="search-row">
              <el-col
                v-for="field in displayBasicFields"
                :key="field.prop"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="6"
              >
                <el-form-item
                  :label="field.label"
                  :prop="field.prop"
                  class="compact-form-item"
                >
                  <!-- 输入框 -->
                  <el-input
                    v-if="field.type === 'input'"
                    v-model="queryData[field.prop]"
                    placeholder="请输入"
                    clearable
                    size="small"
                  />
                  <!-- 选择框 -->
                  <el-select
                    v-else-if="field.type === 'select'"
                    v-model="queryData[field.prop]"
                    placeholder="请选择"
                    clearable
                    size="small"
                    style="width: 100%"
                  >
                    <!-- 订单状态选项 -->
                    <template v-if="field.prop === 'orderStatus'">
                      <el-option label="全部" value="" />
                      <el-option label="充电中" value="1" />
                      <el-option label="已完成" value="2" />
                      <el-option label="已取消" value="3" />
                      <el-option label="异常结束" value="4" />
                    </template>
                    <!-- 支付状态选项 -->
                    <template v-else-if="field.prop === 'payStatus'">
                      <el-option label="全部" value="" />
                      <el-option label="未支付" value="0" />
                      <el-option label="已支付" value="1" />
                      <el-option label="支付失败" value="2" />
                      <el-option label="已退款" value="3" />
                    </template>
                    <!-- 充电桩选项 -->
                    <template v-else-if="field.prop === 'chargingPileId'">
                      <el-option label="全部" value="" />
                      <el-option
                        v-for="pile in chargingPileList"
                        :key="pile.id"
                        :label="`${pile.serial}(${pile.name})`"
                        :value="pile.id"
                      >
                        <span style="font-size: 12px"
                          >{{ pile.serial }}({{ pile.name }})</span
                        >
                      </el-option>
                    </template>
                  </el-select>
                  <!-- 日期选择器 -->
                  <el-date-picker
                    v-else-if="field.type === 'daterange'"
                    v-model="queryData[field.prop]"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    size="small"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 高级筛选 - 只在需要时显示 -->
            <el-collapse-transition v-if="needAdvancedSearch">
              <el-row :gutter="16" v-show="showAdvanced" class="search-row">
                <el-col
                  v-for="field in displayAdvancedFields"
                  :key="field.prop"
                  :xs="24"
                  :sm="12"
                  :md="8"
                  :lg="6"
                >
                  <el-form-item
                    :label="field.label"
                    :prop="field.prop"
                    class="compact-form-item"
                  >
                    <!-- 选择框 -->
                    <el-select
                      v-model="queryData[field.prop]"
                      placeholder="请选择"
                      clearable
                      size="small"
                      style="width: 100%"
                      :filterable="field.prop === 'tenantId'"
                    >
                      <!-- 租户选项 -->
                      <template v-if="field.prop === 'tenantId'">
                        <el-option label="全部" value="" />
                        <el-option
                          v-for="tenant in tenantList"
                          :key="tenant.tenantId"
                          :label="`${tenant.tenantId}(${tenant.tenantName})`"
                          :value="tenant.tenantId"
                        >
                          <span style="font-size: 12px"
                            >{{ tenant.tenantId }}({{ tenant.tenantName }})</span
                          >
                        </el-option>
                      </template>
                      <!-- 支付方式选项 -->
                      <template v-else-if="field.prop === 'payType'">
                        <el-option label="全部" value="" />
                        <el-option label="账户余额" value="1" />
                        <el-option label="微信支付" value="2" />
                        <el-option label="支付宝" value="3" />
                        <el-option label="充电卡" value="4" />
                      </template>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-collapse-transition>

            <!-- 操作按钮行 - 更合理的布局 -->
            <div class="form-actions compact-actions">
              <div class="action-left">

              </div>
              <div class="action-right">
                <el-button
                  type="primary"
                  icon="el-icon-search"
                  size="small"
                  @click="handleSearch"
                >
                  查询
                </el-button>
                <el-button
                  icon="el-icon-refresh"
                  size="small"
                  @click="handleReset"
                >
                  重置
                </el-button>
                <el-button
                  v-if="needAdvancedSearch"
                  type="text"
                  size="small"
                  @click="showAdvanced = !showAdvanced"
                  style="padding: 7px 8px"
                >
                  <i class="el-icon-s-operation" style="margin-right: 4px"></i>
                  高级筛选
                  <i
                    :class="
                      showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'
                    "
                    style="margin-left: 2px"
                  ></i>
                </el-button>
                <el-divider
                  v-if="needAdvancedSearch"
                  direction="vertical"
                  style="margin: 0 8px"
                ></el-divider>
                <el-dropdown trigger="click" @command="handleCommand">
                  <el-button size="small" type="text" style="padding: 7px 12px">
                    更多操作 <i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="export" icon="el-icon-download">
                      导出数据
                    </el-dropdown-item>
                    <el-dropdown-item command="import" icon="el-icon-upload2">
                      导入数据
                    </el-dropdown-item>
                    <el-dropdown-item
                      command="batch"
                      icon="el-icon-s-operation"
                      divided
                    >
                      批量操作
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </div>
            </div>
          </el-form>
        </el-card>
      </div>

      <!-- 数据表格区域 -->
      <div class="table-container">
        <div class="table-card" shadow="never">
          <!-- 表格工具栏 -->
          <div class="table-toolbar" v-if="selectedData.length > 0">
            <div class="toolbar-left">
              <span class="selection-info">
                已选择 <span class="count">{{ selectedData.length }}</span> 条数据
              </span>
            </div>
          </div>

          <!-- 数据表格 -->
          <el-table
            v-loading="loading"
            :data="tableData"
            :max-height="tableMaxHeight"
            stripe
            style="width: 100%"
            class="custom-table"
            @selection-change="handleSelectionChange"
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#606266',
              fontWeight: '600',
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
                <!-- 订单号 - 添加图标和跳转链接 -->
                <template v-if="col.key === 'orderNo'">
                  <el-link type="primary" @click="handleOrderDetail(scope.row)">
                    <i class="iconfont icon-daikaipiao" style="margin-right: 4px;"></i>
                    {{ scope.row.orderNo || "-" }}
                  </el-link>
                </template>

                <!-- 充电桩信息 -->
                <template v-else-if="col.key === 'chargingPileInfo'">
                  <div  @click="handlePileDetail(scope.row)">
                    {{ scope.row.chargingPileInfo || "-" }}
                  </div>
                </template>

                <!-- 订单状态 -->
                <template v-else-if="col.key === 'orderStatusLabel'">
                  <span v-if="scope.row.orderStatus == 1" style="color: #E6A23C;">充电中</span>
                  <span v-else-if="scope.row.orderStatus == 2" style="color: #67C23A;">已完成</span>
                  <span v-else-if="scope.row.orderStatus == 3" style="color: #909399;">已取消</span>
                  <span v-else-if="scope.row.orderStatus == 4" style="color: #F56C6C;">异常结束</span>
                  <span v-else>-</span>
                </template>

                <!-- 支付状态 -->
                <template v-else-if="col.key === 'payStatusLabel'">
                  <span v-if="scope.row.payStatus == 0" style="color: #E6A23C;">未支付</span>
                  <span v-else-if="scope.row.payStatus == 1" style="color: #67C23A;">已支付</span>
                  <span v-else-if="scope.row.payStatus == 2" style="color: #F56C6C;">支付失败</span>
                  <span v-else-if="scope.row.payStatus == 3" style="color: #909399;">已退款</span>
                  <span v-else>-</span>
                </template>

                <!-- 租户信息 -->
                <template v-else-if="col.key === 'tenantInfo'">
                  <el-link
                    v-if="scope.row.tenantId"
                    type="primary"
                    @click="handleTenantClick(scope.row)"
                  >
                    <i class="el-icon-user"></i>
                    {{ scope.row.tenantInfo }}
                  </el-link>
                  <span v-else class="text-muted">游客用户</span>
                </template>

                <!-- 支付方式 -->
                <template v-else-if="col.key === 'payTypeLabel'">
                  <span v-if="scope.row.payType == 1">账户余额</span>
                  <span v-else-if="scope.row.payType == 2">微信支付</span>
                  <span v-else-if="scope.row.payType == 3">支付宝</span>
                  <span v-else-if="scope.row.payType == 4">充电卡</span>
                  <span v-else>-</span>
                </template>

                <!-- 金额相关 -->
                <template v-else-if="col.key === 'totalAmount' || col.key === 'electricityFee' || col.key === 'serviceFee'">
                  <span class="amount-text">
                    {{
                      scope.row[col.key] !== null &&
                      scope.row[col.key] !== undefined
                        ? "¥" + parseFloat(scope.row[col.key]).toFixed(2)
                        : "-"
                    }}
                  </span>
                </template>

                <!-- 充电量 -->
                <template v-else-if="col.key === 'chargeAmount'">
                  <span class="charge-text">
                    {{
                      scope.row.chargeAmount !== null &&
                      scope.row.chargeAmount !== undefined
                        ? scope.row.chargeAmount + "kWh"
                        : "-"
                    }}
                  </span>
                </template>

                <!-- 充电时长 -->
                <template v-else-if="col.key === 'chargeDuration'">
                  <span>
                    {{
                      scope.row.chargeDuration !== null &&
                      scope.row.chargeDuration !== undefined
                        ? formatDuration(scope.row.chargeDuration)
                        : "-"
                    }}
                  </span>
                </template>

                <!-- 默认显示 -->
                <template v-else>
                  {{ scope.row[col.key] || "-" }}
                </template>
              </template>
            </el-table-column>

            <!-- 操作列 -->
            <el-table-column
              label="操作"
              width="120"
              fixed="right"
              align="center"
            >
              <template slot-scope="scope">
                <div style="display: flex; align-items: center; justify-content: center; gap: 2px; white-space: nowrap;">
                  <el-button
                    type="text"
                    size="mini"
                    icon="el-icon-view"
                    @click="handleOrderDetail(scope.row)"
                    style="padding: 1px 2px; font-size: 11px; min-width: auto;"
                  >
                    详情
                  </el-button>

                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          :current-page="pageData.current"
          :page-sizes="[15, 30, 60, 100]"
          :page-size="pageData.size"
          :total="pageData.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <!-- 编辑弹窗 -->
      <el-dialog
        :title="editForm.id ? '编辑订单' : '新增订单'"
        :visible.sync="dialogVisible"
        width="680px"
        :close-on-click-modal="false"
        class="custom-dialog"
      >
        <el-form
          ref="editForm"
          :model="editForm"
          :rules="rules"
          label-width="100px"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="充电桩" prop="chargingPileId">
                <el-select
                  v-model="editForm.chargingPileId"
                  placeholder="请选择充电桩"
                  style="width: 100%"
                  filterable
                >
                  <el-option
                    v-for="pile in chargingPileList"
                    :key="pile.id"
                    :label="`${pile.serial}(${pile.name})`"
                    :value="pile.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="充电枪口" prop="gunNo">
                <el-select
                  v-model="editForm.gunNo"
                  placeholder="请选择充电枪口"
                  style="width: 100%"
                >
                  <el-option label="1号枪" value="1" />
                  <el-option label="2号枪" value="2" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="租户" prop="tenantId">
                <el-select
                  v-model="editForm.tenantId"
                  placeholder="请选择租户(可留空)"
                  style="width: 100%"
                  filterable
                  clearable
                >
                  <el-option
                    v-for="tenant in tenantList"
                    :key="tenant.tenantId"
                    :label="`${tenant.tenantId}(${tenant.tenantName})`"
                    :value="tenant.tenantId"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="支付方式" prop="payType">
                <el-select
                  v-model="editForm.payType"
                  placeholder="请选择支付方式"
                  style="width: 100%"
                >
                  <el-option label="账户余额" value="1" />
                  <el-option label="微信支付" value="2" />
                  <el-option label="支付宝" value="3" />
                  <el-option label="充电卡" value="4" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="预计充电量" prop="plannedAmount">
                <el-input-number
                  v-model="editForm.plannedAmount"
                  :min="0"
                  :precision="2"
                  placeholder="请输入预计充电量"
                  style="width: 100%"
                />
                <span style="margin-left: 8px; color: #909399;">kWh</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预计金额" prop="plannedAmount">
                <el-input-number
                  v-model="editForm.plannedFee"
                  :min="0"
                  :precision="2"
                  placeholder="请输入预计金额"
                  style="width: 100%"
                />
                <span style="margin-left: 8px; color: #909399;">元</span>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSave">
            {{ submitting ? "保存中..." : "确 定" }}
          </el-button>
        </span>
      </el-dialog>
    </div>
  </template>

<script>
// 模拟API方法
const mockApi = {
  // 获取订单列表
  getOrderList: (params) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = []
        for (let i = 1; i <= 15; i++) {
          mockData.push({
            id: i,
            orderNo: `CD${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(i).padStart(6, '0')}`,
            chargingPileId: Math.floor(Math.random() * 5) + 1,
            chargingPileInfo: `CP${String(Math.floor(Math.random() * 5) + 1).padStart(3, '0')}(${['中心A座', '创新大B栋', '科技楼C区', '办公楼D座', '研发楼E栋'][Math.floor(Math.random() * 5)]}充电桩)`,
            gunNo: Math.floor(Math.random() * 2) + 1,
            tenantId: Math.random() > 0.3 ? `T${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}` : null,
            tenantInfo: Math.random() > 0.3 ? `T${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}(${['asue', '夜曲sin', '子非鱼', 'iiio', 'fcc'][Math.floor(Math.random() * 5)]})` : null,
            orderStatus: Math.floor(Math.random() * 4) + 1,
            payStatus: Math.floor(Math.random() * 4),
            payType: Math.floor(Math.random() * 4) + 1,
            chargeAmount: (Math.random() * 50 + 5).toFixed(2),
            chargeDuration: Math.floor(Math.random() * 300) + 30, // 分钟
            totalAmount: (Math.random() * 100 + 20).toFixed(2),
            electricityFee: (Math.random() * 80 + 15).toFixed(2),
            serviceFee: (Math.random() * 20 + 5).toFixed(2),
            startTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString(),
            endTime: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString() : null,
            createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString()
          })
        }
        resolve({
          code: 200,
          data: {
            dataList: mockData,
            total: 150
          }
        })
      }, 500)
    })
  },

  // 获取充电桩列表
  getChargingPileList: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = []
        for (let i = 1; i <= 20; i++) {
          mockData.push({
            id: i,
            serial: `CP${String(i).padStart(3, '0')}`,
            name: `${['中大天A座', '创新大B栋', '科技楼C区', '办公楼D座', '研发楼E栋'][Math.floor(Math.random() * 5)]}充电桩`
          })
        }
        resolve({
          code: 200,
          data: mockData
        })
      }, 300)
    })
  },

  // 获取租户列表
  getTenantList: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = []
        for (let i = 1; i <= 50; i++) {
          mockData.push({
            tenantId: `T${String(i).padStart(3, '0')}`,
            tenantName: `${['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'][Math.floor(Math.random() * 8)]}${['科技', '贸易', '实业', '文化', '教育'][Math.floor(Math.random() * 5)]}公司`
          })
        }
        resolve({
          code: 200,
          data: mockData
        })
      }, 300)
    })
  }
}

export default {
  name: 'ChargingOrderManagement',
  data () {
    return {
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 10,
        paginationHeight: 68
      },
      // 查询参数
      queryData: {
        orderNo: '',
        chargingPileId: '',
        tenantId: '',
        orderStatus: '',
        payStatus: '',
        payType: '',
        dateRange: [],
        managerId: ''
      },
      // 搜索字段配置
      searchFields: {
        basic: [
          { prop: 'orderNo', label: '订单号', type: 'input' },
          { prop: 'chargingPileId', label: '站点', type: 'select' },
          { prop: 'orderStatus', label: '订单状态', type: 'select' },
          { prop: 'payStatus', label: '支付状态', type: 'select' }
        ],
        advanced: [
          { prop: 'tenantId', label: '租户', type: 'select' },
          { prop: 'payType', label: '支付方式', type: 'select' },
          { prop: 'dateRange', label: '创建时间', type: 'daterange' }
        ]
      },
      // 租户列表数据
      tenantList: [],
      // 充电桩列表数据
      chargingPileList: [],
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
        size: 15,
        total: 0
      },
      // 选中的数据
      selectedData: [],
      // 编辑弹窗
      dialogVisible: false,
      // 编辑表单
      editForm: {
        id: '',
        chargingPileId: '',
        gunNo: '',
        tenantId: '',
        payType: '',
        plannedAmount: null,
        plannedFee: null,
        managerId: ''
      },
      // 表单验证规则
      rules: {
        chargingPileId: [
          { required: true, message: '请选择充电桩', trigger: 'change' }
        ],
        gunNo: [
          { required: true, message: '请选择充电枪口', trigger: 'change' }
        ],
        payType: [
          { required: true, message: '请选择支付方式', trigger: 'change' }
        ]
      },
      // 表格列配置
      tableKey: [
        {
          label: '订单号',
          key: 'orderNo',
          width: '180',
          checked: true,
          disabled: true
        },
        {
          label: '站点',
          key: 'chargingPileInfo',
          width: '200',
          checked: true,
          disabled: true
        },
        {
          label: '充电枪口',
          key: 'gunNo',
          width: '100',
          checked: true
        },
        {
          label: '租户信息',
          key: 'tenantInfo',
          width: '180',
          checked: true
        },
        {
          label: '订单状态',
          key: 'orderStatusLabel',
          width: '120',
          checked: true
        },
        {
          label: '支付状态',
          key: 'payStatusLabel',
          width: '120',
          checked: true
        },
        {
          label: '支付方式',
          key: 'payTypeLabel',
          width: '120',
          checked: true
        },
        {
          label: '充电量',
          key: 'chargeAmount',
          width: '120',
          checked: true
        },
        {
          label: '充电时长',
          key: 'chargeDuration',
          width: '120',
          checked: true
        },
        {
          label: '总金额',
          key: 'totalAmount',
          width: '120',
          checked: true
        },
        {
          label: '电费',
          key: 'electricityFee',
          width: '100',
          checked: true
        },
        {
          label: '服务费',
          key: 'serviceFee',
          width: '100',
          checked: true
        },
        {
          label: '开始时间',
          key: 'startTime',
          width: '160',
          checked: true
        },
        {
          label: '结束时间',
          key: 'endTime',
          width: '160',
          checked: true
        },
        {
          label: '创建时间',
          key: 'createTime',
          width: '160',
          checked: true
        }
      ]
    }
  },
  computed: {
    dataLength () {
      return this.tableData.length
    },
    // 计算需要显示的列
    displayColumns () {
      return this.tableKey.filter((col) => col.checked !== false)
    },
    // 判断是否需要显示高级筛选按钮
    needAdvancedSearch () {
      const totalFields =
          this.searchFields.basic.length + this.searchFields.advanced.length
      return totalFields > 5
    },
    // 获取实际显示的基础搜索字段
    displayBasicFields () {
      if (!this.needAdvancedSearch) {
        return [...this.searchFields.basic, ...this.searchFields.advanced]
      }
      return this.searchFields.basic
    },
    // 获取高级搜索字段
    displayAdvancedFields () {
      return this.searchFields.advanced
    },
    // 动态计算表格高度
    dynamicTableHeight () {
      const dataLength = this.tableData.length

      if (dataLength === 0) {
        return this.tableHeightConfig.minHeight
      }

      if (dataLength <= this.tableHeightConfig.maxRows) {
        return (
          this.tableHeightConfig.headerHeight +
            dataLength * this.tableHeightConfig.rowHeight
        )
      }

      return (
        this.tableHeightConfig.headerHeight +
          this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      )
    },
    tableMaxHeight () {
      return (
        this.tableHeightConfig.headerHeight +
          this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      )
    }
  },
  mounted () {
    this.queryData.managerId = 'MANAGER001' // 模拟管理员ID
    this.fetchTableData()
    this.getTenantList()
    this.getChargingPileList()
  },

  methods: {
    // 格式化充电时长
    formatDuration (minutes) {
      if (!minutes) return '-'
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      if (hours > 0) {
        return `${hours}小时${mins}分钟`
      }
      return `${mins}分钟`
    },

    // 获取租户列表
    async getTenantList () {
      try {
        const response = await mockApi.getTenantList()
        if (response.code === 200) {
          this.tenantList = response.data || []
        }
      } catch (error) {
        console.error('获取租户列表失败:', error)
        this.tenantList = []
      }
    },

    // 获取充电桩列表
    async getChargingPileList () {
      try {
        const response = await mockApi.getChargingPileList()
        if (response.code === 200) {
          this.chargingPileList = response.data || []
        }
      } catch (error) {
        console.error('获取充电桩列表失败:', error)
        this.chargingPileList = []
      }
    },

    // 获取订单列表数据
    async fetchTableData () {
      this.loading = true
      try {
        const params = {
          orderNo: this.queryData.orderNo,
          chargingPileId: this.queryData.chargingPileId,
          tenantId: this.queryData.tenantId,
          orderStatus: this.queryData.orderStatus,
          payStatus: this.queryData.payStatus,
          payType: this.queryData.payType,
          managerId: this.queryData.managerId,
          page: {
            current: this.pageData.current,
            size: this.pageData.size,
            orders: [{ asc: false, column: 'createTime' }]
          }
        }

        const response = await mockApi.getOrderList(params)

        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || []
          this.pageData.total = response.data.total || 0
        } else {
          this.$message.error(response.msg || '获取数据失败')
        }
      } catch (error) {
        this.$message.error('获取订单数据失败')
        console.error('获取订单数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    // 查询
    handleSearch () {
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 重置
    handleReset () {
      this.queryData = {
        orderNo: '',
        chargingPileId: '',
        tenantId: '',
        orderStatus: '',
        payStatus: '',
        payType: '',
        dateRange: [],
        managerId: 'MANAGER001'
      }
      this.showAdvanced = false
      this.handleSearch()
    },

    // 处理顶部下拉命令
    handleCommand (command) {
      switch (command) {
        case 'export':
          this.handleExport()
          break
        case 'import':
          this.$message.info('导入功能开发中...')
          break
        case 'batch':
          this.$message.info('批量操作功能开发中...')
          break
      }
    },

    // 新增订单
    handleAdd () {
      this.editForm = {
        id: '',
        chargingPileId: '',
        gunNo: '',
        tenantId: '',
        payType: '',
        plannedAmount: null,
        plannedFee: null,
        managerId: 'MANAGER001'
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate()
      })
    },

    // 保存
    async handleSave () {
      this.$refs.editForm.validate(async (valid) => {
        if (valid) {
          this.submitting = true
          try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1000))
            this.$message.success('操作成功')
            this.dialogVisible = false
            this.fetchTableData()
          } catch (error) {
            this.$apiError.notify(error, '操作失败')
            console.error('保存失败:', error)
          } finally {
            this.submitting = false
          }
        }
      })
    },

    // 订单详情
    handleOrderDetail (row) {
      this.$message.info(`查看订单详情: ${row.orderNo}`)
      // this.$router.push({
      //   path: `/application/charging-management/order/detail/${row.id}`,
      //   query: { orderNo: row.orderNo }
      // });
    },

    // 充电桩详情
    handlePileDetail (row) {
      this.$message.info(`查看充电桩详情: ${row.chargingPileInfo}`)
      // this.$router.push({
      //   path: `/device/charging/detail/${row.chargingPileId}`,
      //   query: { name: row.chargingPileInfo }
      // });
    },

    // 租户点击
    handleTenantClick (row) {
      this.$message.info(`查看租户详情: ${row.tenantInfo}`)
      // this.$router.push({
      //   path: "/application/tenant/detail",
      //   query: { id: row.tenantId }
      // });
    },

    // 停止充电
    async handleStopCharge (row) {
      try {
        await this.$confirm(
            `确定要停止订单"${row.orderNo}"的充电吗？`,
            '提示',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            }
        )

        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500))
        this.$message.success('停止充电成功')
        this.fetchTableData()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('停止充电失败')
          console.error('操作失败:', error)
        }
      }
    },

    // 支付
    async handlePayment (row) {
      try {
        await this.$confirm(
            `确定要为订单"${row.orderNo}"发起支付吗？`,
            '提示',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'info'
            }
        )

        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500))
        this.$message.success('支付成功')
        this.fetchTableData()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('支付失败')
          console.error('操作失败:', error)
        }
      }
    },

    // 打印
    handlePrint (row) {
      this.$message.info(`打印订单: ${row.orderNo}`)
    },

    // 导出数据
    handleExport () {
      if (this.selectedData.length === 0) {
        this.$message.warning('请先选择要导出的数据')
        return
      }
      this.$message.info('导出功能开发中...')
    },

    // 选择变化
    handleSelectionChange (selection) {
      this.selectedData = selection
    },

    // 分页大小变化
    handleSizeChange (val) {
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 当前页变化
    handleCurrentChange (val) {
      this.pageData.current = val
      this.fetchTableData()
    }
  }
}
</script>

  <style lang="scss" scoped>
  // 引入表格页面公共样式
  @import "@/assets/styles/table-page.scss";

  // 额外样式
  .amount-text {
    color: #e6a23c;
    font-weight: 500;
  }

  .charge-text {
    color: #67c23a;
    font-weight: 500;
  }

  .option-with-dot {
    display: flex;
    align-items: center;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;

    &.online {
      background-color: #67c23a;
    }

    &.offline {
      background-color: #f56c6c;
    }
  }

  .text-muted {
    color: #909399;
  }
  </style>
