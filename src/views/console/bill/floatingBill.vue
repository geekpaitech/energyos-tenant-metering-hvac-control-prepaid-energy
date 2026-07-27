<template>
  <div class="floating-price-container">
    <!-- 搜索区域 -->
    <div class="search-section">
      <el-card shadow="never" class="search-card">
        <div class="search-toolbar">
          <div class="search-left">
            日期：
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              size="small"
              @change="handleDateChange"
              class="date-picker"
            />
          </div>
          <div class="search-right">
            <el-button
              type="primary"
              icon="el-icon-plus"
              size="small"
              @click="handleCreateFloat"
            >
              浮动电价
            </el-button>
            <el-divider direction="vertical" style="margin: 0 8px"></el-divider>
<el-dropdown trigger="click" @command="handleCommand">
  <el-button size="small" type="text" style="padding: 7px 12px">
    更多操作 <i class="el-icon-arrow-down el-icon--right"></i>
  </el-button>
  <el-dropdown-menu slot="dropdown">
    <el-dropdown-item command="export" icon="el-icon-download">
      导出数据
    </el-dropdown-item>
  </el-dropdown-menu>
</el-dropdown>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-card shadow="never" class="table-card">
        <el-table
          v-loading="loading"
          :data="tableData"
          stripe
          style="width: 100%"
          @selection-change="handleSelectionChange"
          :header-cell-style="{background:'#f5f7fa', color:'#303133', fontWeight:'600'}"
        >
        <el-table-column type="selection" width="55" align="center" />
          <el-table-column prop="rid" label="记录ID" align="center" width="100" />
          <el-table-column prop="floatType" label="浮动类型" align="center" width="120">
            <template slot-scope="scope">
              <el-tag :type="scope.row.floatType === 'GLOBAL' ? 'success' : 'primary'" size="small">
                {{ scope.row.floatType === 'GLOBAL' ? '整体浮动' : '部分浮动' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="userPhone" label="操作人电话" align="center" min-width="130" />
          <el-table-column prop="startDate" label="开始时间" align="center" width="110" />
          <el-table-column prop="endDate" label="结束时间" align="center" width="110" />
          <!-- 修正：按照正确的字段映射显示价格 -->
          <el-table-column label="尖价" align="center" width="90">
            <template slot-scope="scope">
              <span class="price-value">{{ scope.row.powerPeakPrice }}元</span>
            </template>
          </el-table-column>
          <el-table-column label="峰价" align="center" width="90">
            <template slot-scope="scope">
              <span class="price-value">{{ scope.row.powerTopPrice }}元</span>
            </template>
          </el-table-column>
          <el-table-column label="平价" align="center" width="90">
            <template slot-scope="scope">
              <span class="price-value">{{ scope.row.powerFlatPrice }}元</span>
            </template>
          </el-table-column>
          <el-table-column label="谷价" align="center" width="90">
            <template slot-scope="scope">
              <span class="price-value">{{ scope.row.powerValleyPrice }}元</span>
            </template>
          </el-table-column>
          <el-table-column label="总浮动余额" align="center" width="120">
            <template slot-scope="scope">
              <span :class="['balance-value', scope.row.totalFloatBalance >= 0 ? 'positive' : 'negative']">
                {{ scope.row.totalFloatBalance >= 0 ? '+' : '' }}{{ scope.row.totalFloatBalance }}元
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" align="center" min-width="160" />
          <el-table-column label="操作" align="center" width="100" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="mini" @click="handleDetail(scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
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
      </el-card>
    </div>

    <!-- 创建浮动电价抽屉 -->
    <el-drawer
      title="浮动电价"
      :visible.sync="drawerVisible"
      direction="rtl"
      size="80%"
      :wrapper-closable="false"
      custom-class="float-drawer"
    >
      <div class="drawer-content">
        <!-- 左侧租户选择 -->
        <div class="tenant-panel">
          <div class="panel-header">
            <i class="el-icon-user-solid"></i>
            <span>选择租户</span>
          </div>

          <div class="panel-search">
            <el-input
              v-model="tenantFilter"
              placeholder="搜索租户..."
              prefix-icon="el-icon-search"
              size="small"
              clearable
            />
          </div>

          <div class="panel-list">
            <el-checkbox-group v-model="selectedTenantIds">
              <div class="select-all-item">
                <el-checkbox label="all" @change="handleSelectAll">
                  <span class="tenant-name">全部租户</span>
                </el-checkbox>
              </div>
              <el-divider></el-divider>
              <div class="tenant-list-wrapper">
                <div
                  v-for="tenant in filteredTenants"
                  :key="tenant.id"
                  class="tenant-item"
                >
                  <el-checkbox :label="tenant.id">
                    <span class="tenant-name">{{ tenant.name }}</span>
                  </el-checkbox>
                </div>
              </div>
            </el-checkbox-group>
          </div>
        </div>

        <!-- 右侧表单 -->
        <div class="form-panel">
          <!-- 步骤1：基础配置 -->
          <div class="form-card">
            <div class="card-header">
              <span class="card-title">基础配置</span>
            </div>
            <div class="card-body">
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="form-item">
                    <label class="required">时间区间</label>
                    <div class="date-range-input">
                      <el-date-picker
                        v-model="formData.startDate"
                        type="date"
                        placeholder="开始时间"
                        format="yyyy-MM-dd"
                        value-format="yyyy-MM-dd"
                        size="small"
                        style="width: 45%"
                      />
                      <span class="separator">至</span>
                      <el-date-picker
                        v-model="formData.endDate"
                        type="date"
                        placeholder="结束时间"
                        format="yyyy-MM-dd"
                        value-format="yyyy-MM-dd"
                        size="small"
                        style="width: 45%"
                      />
                    </div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="form-item">
                    <label class="required">浮动类型</label>
                    <el-select
                      v-model="formData.floatType"
                      placeholder="请选择浮动类型"
                      size="small"
                      style="width: 100%"
                      @change="handleFloatTypeChange"
                    >
                      <el-option label="部分浮动" value="PART" />
                      <el-option label="整体浮动" value="GLOBAL" />
                    </el-select>
                  </div>
                </el-col>
              </el-row>

              <div class="query-button-wrapper">
                <el-button
                  type="primary"
                  size="medium"
                  icon="el-icon-search"
                  :loading="queryLoading"
                  @click="handleQuery"
                  :disabled="!canQuery"
                >
                  查询用电数据
                </el-button>
                <el-tag v-if="!canQuery" type="info" size="small" class="query-tip">
                  请先选择租户、时间区间和浮动类型
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 步骤2：查询结果 -->
          <div v-if="queryResult.length > 0" class="form-card large-card">
            <div class="card-header">
              <span class="card-title">用电数据统计</span>
              <el-tag type="success" size="small">
                共 {{ queryResult.length }} 条记录
                <span v-if="formData.floatType === 'PART'">
                  ，已选 {{ selectedQueryItems.length }} 条
                </span>
              </el-tag>
            </div>
            <div class="card-body">
              <div class="result-table-wrapper">
                <el-table
                  ref="queryTable"
                  :data="queryResult"
                  size="small"
                  style="width: 100%"
                  :header-cell-style="{background:'#fafafa', color:'#606266'}"
                  @selection-change="handleSelectionChange"
                >
                  <!-- 部分浮动时显示勾选框 -->
                  <el-table-column
                    v-if="formData.floatType === 'PART'"
                    type="selection"
                    width="55"
                    align="center"
                  />

                  <el-table-column prop="tenantName" label="租户名称" min-width="150" />

                  <!-- 部分浮动时显示电表信息 -->
                  <el-table-column
                    v-if="formData.floatType === 'PART'"
                    prop="partName"
                    label="电表名/公摊组名"
                    min-width="150"
                  />
                  <el-table-column
                    v-if="formData.floatType === 'PART'"
                    prop="bindType"
                    label="类型"
                    width="100"
                    align="center"
                  >
                    <template slot-scope="scope">
                      <el-tag
                        :type="getBindTypeTagType(scope.row.bindType)"
                        size="mini"
                      >
                        {{ getBindTypeName(scope.row.bindType) }}
                      </el-tag>
                    </template>
                  </el-table-column>

                  <!-- 修正：按照正确的字段映射显示用电量 -->
                  <el-table-column label="尖电量(kWh)" align="center" width="100">
                    <template slot-scope="scope">
                      <span class="data-value">{{ scope.row.useElecPeak || 0 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="峰电量(kWh)" align="center" width="100">
                    <template slot-scope="scope">
                      <span class="data-value">{{ scope.row.useElecTop || 0 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="平电量(kWh)" align="center" width="100">
                    <template slot-scope="scope">
                      <span class="data-value">{{ scope.row.useElecFlat || 0 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="谷电量(kWh)" align="center" width="100">
                    <template slot-scope="scope">
                      <span class="data-value">{{ scope.row.useElecValley || 0 }}</span>
                    </template>
                  </el-table-column>

                  <el-table-column label="已结金额(元)" align="center" width="120">
                    <template slot-scope="scope">
                      <span class="balance-text">¥{{ scope.row.alreadyBalance || 0 }}</span>
                    </template>
                  </el-table-column>

                  <el-table-column label="目标金额(元)" align="center" width="120">
                    <template slot-scope="scope">
                      <span class="target-balance">¥{{ scope.row.afterBalance || '0.00' }}</span>
                    </template>
                  </el-table-column>

                  <el-table-column label="浮动金额(元)" align="center" width="120">
                    <template slot-scope="scope">
                      <span :class="getFloatBalanceClass(scope.row.floatBalance)">
                        {{ parseFloat(scope.row.floatBalance) > 0 ? '+' : '' }}¥{{ scope.row.floatBalance || '0.00' }}
                      </span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </div>

          <!-- 步骤3：电价设置 -->
          <div v-if="queryResult.length > 0" class="form-card small-card">
            <div class="card-header">
              <span class="card-title">电价浮动设置</span>
            </div>
            <div class="card-body">
              <div class="price-grid-simple">
                <!-- 修正：按照正确的字段映射设置电价 -->
                <div class="price-item">
                  <label class="required">尖时电价</label>
                  <el-input-number
                    v-model="formData.powerPeakPrice"
                    :precision="2"
                    :step="0.01"
                    :min="0"
                    size="small"
                    controls-position="right"
                    placeholder="0.00"
                    @change="calculateBalances"
                  />
                  <span class="price-unit">元/kWh</span>
                </div>

                <div class="price-item">
                  <label class="required">峰时电价</label>
                  <el-input-number
                    v-model="formData.powerTopPrice"
                    :precision="2"
                    :step="0.01"
                    :min="0"
                    size="small"
                    controls-position="right"
                    placeholder="0.00"
                    @change="calculateBalances"
                  />
                  <span class="price-unit">元/kWh</span>
                </div>

                <div class="price-item">
                  <label class="required">平时电价</label>
                  <el-input-number
                    v-model="formData.powerFlatPrice"
                    :precision="2"
                    :step="0.01"
                    :min="0"
                    size="small"
                    controls-position="right"
                    placeholder="0.00"
                    @change="calculateBalances"
                  />
                  <span class="price-unit">元/kWh</span>
                </div>

                <div class="price-item">
                  <label class="required">谷时电价</label>
                  <el-input-number
                    v-model="formData.powerValleyPrice"
                    :precision="2"
                    :step="0.01"
                    :min="0"
                    size="small"
                    controls-position="right"
                    placeholder="0.00"
                    @change="calculateBalances"
                  />
                  <span class="price-unit">元/kWh</span>
                </div>
              </div>

              <el-row :gutter="20" class="other-info">
                <el-col :span="12">
                  <div class="form-item">
                    <label class="required">账单日期</label>
                    <el-date-picker
                      v-model="formData.settleDate"
                      type="date"
                      placeholder="请选择账单日期"
                      format="yyyy-MM-dd"
                      value-format="yyyy-MM-dd"
                      size="small"
                      style="width: 100%"
                    />
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="form-item">
                    <label class="required">备注内容</label>
                    <el-input
                      v-model="formData.remark"
                      type="textarea"
                      :rows="2"
                      placeholder="请输入备注内容"
                      maxlength="200"
                      show-word-limit
                    />
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>
      </div>

      <!-- 抽屉底部 -->
      <div class="drawer-footer">
        <el-button size="medium" @click="drawerVisible = false">取消</el-button>
        <el-button
          type="primary"
          size="medium"
          :loading="submitting"
          @click="handleSubmit"
          :disabled="!canSubmit"
        >
          确定创建
        </el-button>
      </div>
    </el-drawer>

    <!-- 详情抽屉 -->
    <el-drawer
      title="浮动电价详情"
      :visible.sync="detailDrawerVisible"
      direction="rtl"
      size="70%"
      :wrapper-closable="false"
      custom-class="detail-drawer"
    >
      <div class="detail-content" v-loading="detailLoading">
        <!-- 基本信息 -->
        <div class="detail-card">
          <div class="detail-header">
            <span class="detail-title">基本信息</span>
          </div>
          <div class="detail-body">
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="detail-item">
                  <label>记录ID：</label>
                  <span>{{ detailData.floatDto?.rid || '-' }}</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="detail-item">
                  <label>浮动类型：</label>
                  <el-tag :type="detailData.floatDto?.floatType === 'GLOBAL' ? 'success' : 'primary'" size="small">
                    {{ detailData.floatDto?.floatType === 'GLOBAL' ? '整体浮动' : '部分浮动' }}
                  </el-tag>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="detail-item">
                  <label>创建时间：</label>
                  <span>{{ detailData.floatDto?.createTime || '-' }}</span>
                </div>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="detail-item">
                  <label>操作人电话：</label>
                  <span>{{ detailData.floatDto?.userPhone || '-' }}</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="detail-item">
                  <label>时间区间：</label>
                  <span>{{ detailData.floatDto?.startDate || '-' }} 至 {{ detailData.floatDto?.endDate || '-' }}</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="detail-item">
                  <label>总浮动余额：</label>
                  <span :class="['balance-value', detailData.floatDto?.totalFloatBalance >= 0 ? 'positive' : 'negative']">
                    {{ detailData.floatDto?.totalFloatBalance >= 0 ? '+' : '' }}{{ detailData.floatDto?.totalFloatBalance || 0 }}元
                  </span>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>

        <!-- 电价信息 -->
        <div class="detail-card">
          <div class="detail-header">
            <span class="detail-title">目标价格</span>
          </div>
          <div class="detail-body">
            <div class="price-info-grid">
              <!-- 修正：按照正确的字段映射显示电价信息 -->
              <div class="price-info-item">
                <label>尖时电价</label>
                <span class="price-value">{{ detailData.floatDto?.powerPeakPrice || 0 }} 元/kWh</span>
              </div>
              <div class="price-info-item">
                <label>峰时电价</label>
                <span class="price-value">{{ detailData.floatDto?.powerTopPrice || 0 }} 元/kWh</span>
              </div>
              <div class="price-info-item">
                <label>平时电价</label>
                <span class="price-value">{{ detailData.floatDto?.powerFlatPrice || 0 }} 元/kWh</span>
              </div>
              <div class="price-info-item">
                <label>谷时电价</label>
                <span class="price-value">{{ detailData.floatDto?.powerValleyPrice || 0 }} 元/kWh</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 浮动明细 -->
        <div class="detail-card">
          <div class="detail-header">
            <span class="detail-title">浮动明细</span>
            <el-tag type="info" size="small">共 {{ detailData.floatContentDtoList?.length || 0 }} 条记录</el-tag>
          </div>
          <div class="detail-body">
            <el-table
              :data="detailData.floatContentDtoList || []"
              style="width: 100%"
              max-height="400"
              :header-cell-style="{background:'#f5f7fa', color:'#303133'}"
            >
              <el-table-column prop="tenantName" label="租户名称" min-width="150" />
              <el-table-column label="用电量(kWh)" align="center">
                <!-- 修正：详情中也要对应正确的字段 -->
                <el-table-column prop="useElecPeak" label="尖" align="center" width="80" />
                <el-table-column prop="useElecTop" label="峰" align="center" width="80" />
                <el-table-column prop="useElecFlat" label="平" align="center" width="80" />
                <el-table-column prop="useElecValley" label="谷" align="center" width="80" />
              </el-table-column>
              <el-table-column prop="alreadyBalance" label="已结金额" align="center" width="100">
                <template slot-scope="scope">
                  <span>¥{{ scope.row.alreadyBalance || 0 }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="floatBalance" label="浮动金额" align="center" width="100">
                <template slot-scope="scope">
                  <span :class="scope.row.floatBalance >= 0 ? 'text-success' : 'text-danger'">
                    {{ scope.row.floatBalance >= 0 ? '+' : '' }}¥{{ scope.row.floatBalance || 0 }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="afterBalance" label="目标余额" align="center" width="100">
                <template slot-scope="scope">
                  <span>¥{{ scope.row.afterBalance || 0 }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>

      <!-- 详情抽屉底部 -->
      <div class="drawer-footer">
        <el-button size="medium" @click="detailDrawerVisible = false">关闭</el-button>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { floatPageFloat, floatPreQuery, floatDoFloat, tenantPage, queryFloatDetail } from '@/api/floatPrice'
import * as XLSX from 'xlsx'
export default {
  name: 'FloatingPrice',
  data () {
    return {
      dateRange: [],
      queryData: {
        managerId: '',
        startDate: '',
        endDate: '',
        // 价格数组：[尖价, 峰价, 平价, 谷价]
        price: [0, 0, 0, 0]
      },
      tableData: [],
      loading: false,
      queryLoading: false,
      submitting: false,
      pageData: {
        current: 1,
        size: 15,
        total: 0
      },
      drawerVisible: false,
      detailDrawerVisible: false,
      detailLoading: false,
      detailData: {
        floatDto: {},
        floatContentDtoList: []
      },
      tenantList: [],
      tenantFilter: '',
      selectedTenantIds: [],
      selectedQueryItems: [], // 部分浮动时选中的数据项
      formData: {
        startDate: '',
        endDate: '',
        floatType: '',
        // 修正：按照正确的字段映射
        powerPeakPrice: 0, // 尖时电价
        powerTopPrice: 0, // 峰时电价
        powerFlatPrice: 0, // 平时电价
        powerValleyPrice: 0, // 谷时电价
        settleDate: '',
        remark: ''
      },
      queryResult: [],
      selectedData: []
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    filteredTenants () {
      if (!this.tenantFilter) return this.tenantList
      return this.tenantList.filter(tenant =>
        tenant.name.includes(this.tenantFilter) ||
        tenant.id.toString().includes(this.tenantFilter)
      )
    },
    actualSelectedIds () {
      return this.selectedTenantIds.filter(id => id !== 'all')
    },
    canQuery () {
      return this.formData.startDate &&
             this.formData.endDate &&
             this.formData.floatType &&
             this.actualSelectedIds.length > 0
    },
    canSubmit () {
      // 整体浮动时，需要有查询结果
      if (this.formData.floatType === 'GLOBAL') {
        return this.queryResult.length > 0 &&
               this.formData.powerPeakPrice > 0 &&
               this.formData.powerTopPrice > 0 &&
               this.formData.powerFlatPrice > 0 &&
               this.formData.powerValleyPrice > 0 &&
               this.formData.settleDate &&
               this.formData.remark
      }
      // 部分浮动时，需要有选中的项
      return this.selectedQueryItems.length > 0 &&
             this.formData.powerPeakPrice > 0 &&
             this.formData.powerTopPrice > 0 &&
             this.formData.powerFlatPrice > 0 &&
             this.formData.powerValleyPrice > 0 &&
             this.formData.settleDate &&
             this.formData.remark
    }
  },
  watch: {
    currentManagerId: {
      handler (newVal) {
        if (newVal) {
          this.queryData.managerId = newVal
          this.fetchTableData()
        }
      },
      immediate: true
    }
  },
  methods: {
    handleDateChange (dates) {
      if (dates?.length === 2) {
        this.queryData.startDate = dates[0]
        this.queryData.endDate = dates[1]
      } else {
        this.queryData.startDate = ''
        this.queryData.endDate = ''
      }
      this.pageData.current = 1
      this.fetchTableData()
    },

    async fetchTableData () {
      this.loading = true
      try {
        const response = await floatPageFloat({
          managerId: this.queryData.managerId,
          startDate: this.queryData.startDate,
          endDate: this.queryData.endDate,
          page: {
            current: this.pageData.current,
            size: this.pageData.size,
            searchCount: true,
            orders: [{ asc: false, column: 'createTime' }]
          }
        })
        if (response.code === 200) {
          this.tableData = response.data?.dataList || []
          this.pageData.total = response.data?.total || 0
        }
      } catch (error) {
        this.$message.error('获取数据失败')
      } finally {
        this.loading = false
      }
    },

    async fetchTenantList () {
      try {
        const response = await tenantPage({
          id: '',
          managerId: this.currentManagerId,
          labelIds: '',
          balanceStatus: null,
          tenantStatus: 0,
          idList: [],
          page: { current: 1, size: 1000, orders: [{ asc: true, column: 'id' }] }
        })
        if (response.code === 200) {
          this.tenantList = response.data?.dataList || []
        }
      } catch (error) {
        this.$message.error('获取租户列表失败')
      }
    },

    handleSelectAll (checked) {
      if (checked) {
        this.selectedTenantIds = ['all', ...this.tenantList.map(t => t.id)]
      } else {
        this.selectedTenantIds = []
      }
    },

    handleFloatTypeChange () {
      // 切换浮动类型时，清空选中项
      this.selectedQueryItems = []
      // 清空查询结果
      this.queryResult = []
    },

    handleSelectionChange (selection) {
      // 部分浮动时，记录选中的数据项
      this.selectedQueryItems = selection
    },

    async handleCreateFloat () {
      this.drawerVisible = true
      this.resetForm()
      await this.fetchTenantList()
    },

    resetForm () {
      this.formData = {
        startDate: '',
        endDate: '',
        floatType: '',
        powerPeakPrice: 0, // 尖时电价
        powerTopPrice: 0, // 峰时电价
        powerFlatPrice: 0, // 平时电价
        powerValleyPrice: 0, // 谷时电价
        settleDate: '',
        remark: ''
      }
      this.selectedTenantIds = []
      this.queryResult = []
      this.selectedQueryItems = []
      // 重置价格数组
      this.queryData.price = [0, 0, 0, 0]
    },

    async handleQuery () {
      if (!this.canQuery) return

      this.queryLoading = true
      try {
        const response = await floatPreQuery({
          tenantIdList: this.actualSelectedIds,
          startDate: this.formData.startDate,
          endDate: this.formData.endDate,
          floatType: this.formData.floatType
        })
        if (response.code === 200) {
          this.queryResult = response.data || []
          // 初始化计算字段
          this.queryResult.forEach(item => {
            this.$set(item, 'afterBalance', '0.00')
            this.$set(item, 'floatBalance', '0.00')
          })
          // 如果已有电价，立即计算
          if (this.formData.powerPeakPrice || this.formData.powerTopPrice ||
              this.formData.powerFlatPrice || this.formData.powerValleyPrice) {
            this.calculateBalances()
          }
          this.$message.success('查询成功')
        } else {
          this.$message.error(response.msg || '查询失败')
        }
      } catch (error) {
        this.$message.error('查询失败')
      } finally {
        this.queryLoading = false
      }
    },

    // 修正：按照提供的计算逻辑
    calculateBalances () {
      // 更新价格数组 [尖价, 峰价, 平价, 谷价]
      this.queryData.price[0] = this.formData.powerPeakPrice || 0 // 尖价
      this.queryData.price[1] = this.formData.powerTopPrice || 0 // 峰价
      this.queryData.price[2] = this.formData.powerFlatPrice || 0 // 平价
      this.queryData.price[3] = this.formData.powerValleyPrice || 0 // 谷价

      // 按照参考的计算逻辑
      this.queryResult.forEach(item => {
        let electric = 0
        // 尖价 * 尖电量
        electric += this.queryData.price[0] * 1 * (item.useElecPeak || 0)
        // 峰价 * 峰电量
        electric += this.queryData.price[1] * 1 * (item.useElecTop || 0)
        // 平价 * 平电量
        electric += this.queryData.price[2] * 1 * (item.useElecFlat || 0)
        // 谷价 * 谷电量
        electric += this.queryData.price[3] * 1 * (item.useElecValley || 0)

        // 设置目标金额
        this.$set(item, 'afterBalance', electric.toFixed(2))

        // 浮动金额 = 已结金额 - 目标金额
        const floatBalance = (
          (item.alreadyBalance || 0) - parseFloat(electric.toFixed(2))
        ).toFixed(2)
        this.$set(item, 'floatBalance', floatBalance)
      })
    },

    async handleSubmit () {
      if (!this.canSubmit) return

      this.submitting = true
      try {
        // 根据浮动类型决定提交的数据
        let submitList = []

        if (this.formData.floatType === 'GLOBAL') {
          // 整体浮动：提交所有查询结果
          submitList = this.queryResult.map(item => ({
            tenantId: item.tenantId,
            tenantName: item.tenantName,
            useElecPeak: item.useElecPeak || 0, // 尖电量
            useElecTop: item.useElecTop || 0, // 峰电量
            useElecFlat: item.useElecFlat || 0,
            useElecValley: item.useElecValley || 0,
            alreadyBalance: item.alreadyBalance || 0,
            afterBalance: item.afterBalance || '0.00',
            floatBalance: item.floatBalance || '0.00'
          }))
        } else {
          // 部分浮动：只提交选中的项，包含额外字段
          submitList = this.selectedQueryItems.map(item => ({
            tenantId: item.tenantId,
            tenantName: item.tenantName,
            bindType: item.bindType,
            partId: item.partId,
            partName: item.partName,
            useElecPeak: item.useElecPeak || 0, // 尖电量
            useElecTop: item.useElecTop || 0, // 峰电量
            useElecFlat: item.useElecFlat || 0,
            useElecValley: item.useElecValley || 0,
            alreadyBalance: item.alreadyBalance || 0,
            afterBalance: item.afterBalance || '0.00',
            floatBalance: item.floatBalance || '0.00'
          }))
        }

        const response = await floatDoFloat({
          endDate: this.formData.endDate,
          startDate: this.formData.startDate,
          floatType: this.formData.floatType,
          // 修正：按照正确的字段映射提交
          powerPeakPrice: this.formData.powerPeakPrice.toString(), // 尖时电价
          powerTopPrice: this.formData.powerTopPrice.toString(), // 峰时电价
          powerFlatPrice: this.formData.powerFlatPrice.toString(), // 平时电价
          powerValleyPrice: this.formData.powerValleyPrice.toString(), // 谷时电价
          settleDate: this.formData.settleDate,
          remark: this.formData.remark,
          managerId: this.currentManagerId,
          floatList: submitList
        })

        if (response.code === 200) {
          this.$message.success('创建成功')
          this.drawerVisible = false
          this.fetchTableData()
        } else {
          this.$message.error(response.msg || '创建失败')
        }
      } catch (error) {
        this.$message.error('创建失败')
      } finally {
        this.submitting = false
      }
    },

    async handleDetail (row) {
      this.detailDrawerVisible = true
      this.detailLoading = true
      try {
        const response = await queryFloatDetail(row.rid)
        if (response.code === 200) {
          this.detailData = response.data || {}
        } else {
          this.$message.error(response.msg || '获取详情失败')
        }
      } catch (error) {
        this.$message.error('获取详情失败')
      } finally {
        this.detailLoading = false
      }
    },

    // 获取绑定类型名称
    getBindTypeName (bindType) {
      const typeMap = {
        1: '专用表',
        2: '公摊表',
        3: '公式表'
      }
      return typeMap[bindType] || '未知'
    },

    // 获取绑定类型标签颜色
    getBindTypeTagType (bindType) {
      const typeMap = {
        1: 'primary',
        2: 'success',
        3: 'warning'
      }
      return typeMap[bindType] || 'info'
    },

    // 获取浮动金额的样式类
    getFloatBalanceClass (floatBalance) {
      const value = parseFloat(floatBalance) || 0
      if (value > 0) return 'text-success'
      if (value < 0) return 'text-danger'
      return ''
    },

    handleSizeChange (val) {
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchTableData()
    },

    handleCurrentChange (val) {
      this.pageData.current = val
      this.fetchTableData()
    },
    handleCommand (command) {
      switch (command) {
        case 'export':
          this.handleExport()
          break
      }
    },

    // 导出数据
    handleExport () {
      if (this.tableData.length === 0) {
        this.$message.warning('暂无数据可导出')
        return
      }

      try {
        // 确定要导出的数据：优先导出选中数据，无选中则导出当前页
        const exportData = this.selectedData.length > 0 ? this.selectedData : this.tableData

        // 构建导出的表头和数据
        const headers = [
          '记录ID', '浮动类型', '操作人电话', '开始时间', '结束时间',
          '尖价(元)', '峰价(元)', '平价(元)', '谷价(元)', '总浮动余额(元)', '创建时间'
        ]

        const data = exportData.map(row => {
          return [
            row.rid || '',
            row.floatType === 'GLOBAL' ? '整体浮动' : '部分浮动',
            row.userPhone || '',
            row.startDate || '',
            row.endDate || '',
            row.powerPeakPrice || '0',
            row.powerTopPrice || '0',
            row.powerFlatPrice || '0',
            row.powerValleyPrice || '0',
            row.totalFloatBalance || '0',
            row.createTime || ''
          ]
        })

        // 创建工作表数据
        const wsData = [headers, ...data]

        // 创建工作表
        const ws = XLSX.utils.aoa_to_sheet(wsData)

        // 设置列宽
        const colWidths = [
          { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
          { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 20 }
        ]
        ws['!cols'] = colWidths

        // 设置表头样式
        const headerRange = XLSX.utils.decode_range(ws['!ref'])
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
          if (!ws[cellAddress]) continue

          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: '303133' } },
            fill: { fgColor: { rgb: 'F5F7FA' } },
            alignment: { horizontal: 'center', vertical: 'center' }
          }
        }

        // 创建工作簿
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, '浮动电价')

        // 生成文件名
        const fileName = this.generateFileName()

        // 导出文件（使用原生方法）
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

        // 创建下载链接
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.style.display = 'none'

        // 触发下载
        document.body.appendChild(link)
        link.click()

        // 清理
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        // 显示导出信息
        const exportCount = exportData.length
        const isSelectedExport = this.selectedData.length > 0
        this.$message.success(`成功导出${exportCount}条${isSelectedExport ? '选中' : ''}数据！`)
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error('导出失败，请重试')
      }
    },

    // 生成文件名
    generateFileName () {
      const now = new Date()
      const timeStr = now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + '_' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')

      // 如果选择了时间范围，包含时间信息
      if (this.queryData.startDate && this.queryData.endDate) {
        const startDate = this.queryData.startDate.replace(/-/g, '')
        const endDate = this.queryData.endDate.replace(/-/g, '')
        return `浮动电价_${startDate}-${endDate}_${timeStr}.xlsx`
      }

      return `浮动电价_${timeStr}.xlsx`
    },

    // 选择变化
    handleSelectionChange (selection) {
      this.selectedData = selection
    }
  }
}
</script>

<style lang="scss" scoped>
.floating-price-container {
  padding: 16px;
  min-height: calc(100vh - 84px);
}

// 搜索区域样式
.search-section {
  margin-bottom: 24px;

  .search-card {
    border-radius: 8px;
    border: 1px solid #e4e7ed;

    .search-toolbar {
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .search-left {
        .date-picker {
          width: 320px;
        }
      }
    }
  }
}

// 表格区域样式
.table-section {
  .table-card {
    border-radius: 8px;
    border: 1px solid #e4e7ed;

    .price-value {
      font-weight: 500;
      color: #606266;
    }

    .balance-value {
      font-weight: 600;

      &.positive {
        color: #67c23a;
      }

      &.negative {
        color: #f56c6c;
      }
    }

    .pagination-wrapper {
      padding: 20px 0 10px;
      display: flex;
      justify-content: flex-end;
    }
  }
}

// 抽屉样式
::v-deep .float-drawer,
::v-deep .detail-drawer {
  .el-drawer__header {
    padding: 20px;
    border-bottom: 1px solid #e4e7ed;
    margin-bottom: 0;

    > :first-child {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  .el-drawer__body {
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
}

.drawer-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

// 租户面板样式
.tenant-panel {
  width: 280px;
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;

  .panel-header {
    height: 56px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    background: linear-gradient(to bottom, #f8f9fa, #ffffff);
    border-bottom: 1px solid #ebeef5;

    i {
      font-size: 18px;
      margin-right: 8px;
      color: #409eff;
    }

    span {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }
  }

  .panel-search {
    padding: 16px;
    border-bottom: 1px solid #ebeef5;
    background: #fafbfc;
  }

  .panel-list {
    flex: 1;
    overflow: hidden;
    padding: 12px;

    .select-all-item {
      padding: 8px;
      background: #f0f7ff;
      border-radius: 4px;
      margin-bottom: 8px;

      .tenant-name {
        font-weight: 600;
        color: #409eff;
      }
    }

    .el-divider {
      margin: 12px 0;
    }

    .tenant-list-wrapper {
      max-height: calc(100vh - 400px);
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: #f5f7fa;
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: #dcdfe6;
        border-radius: 3px;

        &:hover {
          background: #c0c4cc;
        }
      }
    }

    .tenant-item {
      padding: 6px 8px;
      border-radius: 4px;
      transition: background 0.2s;

      &:hover {
        background: #f5f7fa;
      }

      .tenant-name {
        color: #606266;
      }
    }
  }
}

// 表单面板样式
.form-panel {
  flex: 1;
  padding: 20px;
  background: #f5f7fa;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f7fa;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 4px;

    &:hover {
      background: #c0c4cc;
    }
  }
}

// 表单卡片样式
.form-card {
  background: #ffffff;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  // 大卡片 - 用电数据统计
  &.large-card {
    .card-body {
      padding: 24px;
    }
  }

  // 小卡片 - 电价设置
  &.small-card {
    .card-body {
      padding: 16px 20px;
    }
  }

  .card-header {
    padding: 16px 20px;
    background: linear-gradient(to right, #fafbfc, #ffffff);
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }
  }

  .card-body {
    padding: 24px;
  }
}

// 表单项样式
.form-item {
  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: #606266;
    font-weight: 500;

    &.required::before {
      content: "*";
      color: #f56c6c;
      margin-right: 4px;
    }
  }
}

// 日期区间样式
.date-range-input {
  display: flex;
  align-items: center;
  width: 100%;

  .separator {
    padding: 0 8px;
    color: #c0c4cc;
  }
}

// 查询按钮区域
.query-button-wrapper {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;

  .query-tip {
    margin-left: 8px;
  }
}

// 结果表格样式
.result-table-wrapper {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;

  .data-value {
    color: #409eff;
    font-weight: 500;
  }

  .balance-text {
    color: #606266;
    font-weight: 500;
  }

  .target-balance {
    color: #67c23a;
    font-weight: 600;
  }
}

// 简约电价设置网格
.price-grid-simple {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  .price-item {
    display: flex;
    flex-direction: column;

    label {
      margin-bottom: 8px;
      font-size: 14px;
      color: #606266;
      font-weight: 500;

      &.required::before {
        content: "*";
        color: #f56c6c;
        margin-right: 4px;
      }
    }

    ::v-deep .el-input-number {
      width: 100%;

      .el-input__inner {
        text-align: left;
      }
    }

    .price-unit {
      margin-top: 6px;
      font-size: 12px;
      color: #909399;
    }
  }
}

// 其他信息区域
.other-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e4e7ed;
}

// 详情内容样式
.detail-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f7fa;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 4px;

    &:hover {
      background: #c0c4cc;
    }
  }
}

// 详情卡片
.detail-card {
  background: #ffffff;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
  overflow: hidden;

  .detail-header {
    padding: 16px 20px;
    background: linear-gradient(to right, #fafbfc, #ffffff);
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .detail-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }
  }

  .detail-body {
    padding: 20px;
  }
}

// 详情项
.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;

  label {
    color: #909399;
    font-size: 14px;
    margin-right: 8px;
    flex-shrink: 0;
  }

  span {
    color: #303133;
    font-size: 14px;
  }
}

// 电价信息网格
.price-info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  .price-info-item {
    text-align: center;
    padding: 16px;
    background: #fafbfc;
    border-radius: 6px;

    label {
      display: block;
      color: #909399;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .price-value {
      display: block;
      color: #303133;
      font-size: 16px;
      font-weight: 600;
    }
  }
}

// 文本颜色
.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

// 抽屉底部
.drawer-footer {
  position: sticky;
  bottom: 0;
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
  background: #ffffff;
  text-align: right;
  box-shadow: 0 -2px 12px 0 rgba(0, 0, 0, 0.05);
  z-index: 10;

  .el-button {
    margin-left: 12px;
    min-width: 100px;
  }
}

// 响应式布局
@media screen and (max-width: 1600px) {
  .price-grid-simple {
    grid-template-columns: repeat(2, 1fr);
  }

  .price-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 1200px) {
  .tenant-panel {
    width: 240px;
  }

  .price-grid-simple {
    grid-template-columns: 1fr;
  }

  .price-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
