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
                    <!-- 空调类型选项 -->
                    <template v-if="field.prop === 'deviceType'">
                      <el-option label="全部" value="" />
                      <el-option label="中央空调" value="central" />
                      <el-option label="分体空调" value="split" />
                      <el-option label="风管机" value="duct" />
                    </template>
                    <!-- 运行状态选项 -->
                    <template v-else-if="field.prop === 'runStatus'">
                      <el-option label="全部" value="" />
                      <el-option label="运行中" value="running" />
                      <el-option label="已停止" value="stopped" />
                      <el-option label="故障" value="fault" />
                    </template>
                    <!-- 租户选项 -->
                    <template v-else-if="field.prop === 'tenantId'">
                      <el-option label="全部" value="" />
                      <el-option
                        v-for="tenant in tenantList"
                        :key="tenant.tenantId"
                        :label="`${tenant.tenantName}`"
                        :value="tenant.tenantId"
                      />
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
                <!-- 高级筛选内容为空 -->
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
                <!-- 设备名称 -->
                <template v-if="col.key === 'deviceName'">
                  <span style="color: #409EFF; cursor: pointer; font-weight: 500;" @click="handleDeviceDetail(scope.row)">
                    {{ scope.row.deviceName || "-" }}
                  </span>
                </template>
  
                <!-- 设备类型 -->
                <template v-else-if="col.key === 'deviceTypeLabel'">
                  <el-tag
                    :type="getDeviceTypeTagType(scope.row.deviceType)"
                    size="small"
                  >
                    {{ getDeviceTypeLabel(scope.row.deviceType) }}
                  </el-tag>
                </template>
  
                <!-- 租户信息 -->
                <template v-else-if="col.key === 'tenantInfo'">
                  <span style="color: #000;" @click="handleTenantClick(scope.row)">
                    {{ scope.row.tenantInfo || "-" }}
                  </span>
                </template>
  
                <!-- 运行状态 -->
                <template v-else-if="col.key === 'runStatusLabel'">
                  <el-tag
                    :type="getRunStatusTagType(scope.row.runStatus)"
                    size="small"
                  >
                    {{ getRunStatusLabel(scope.row.runStatus) }}
                  </el-tag>
                </template>
  
                <!-- 运行时长显示 -->
                <template v-else-if="col.key === 'totalRuntime'">
                  <span class="runtime-text" style="color: #67C23A; font-weight: 500;">
                    {{ scope.row.totalRuntime ? scope.row.totalRuntime + 'h' : '-' }}
                  </span>
                </template>
  
                <!-- 本月运行时长 -->
                <template v-else-if="col.key === 'monthlyRuntime'">
                  <span style="color: #E6A23C; font-weight: 500;">
                    {{ scope.row.monthlyRuntime ? scope.row.monthlyRuntime + 'h' : '-' }}
                  </span>
                </template>
  
                <!-- 运行效率 -->
                <template v-else-if="col.key === 'efficiency'">
                  <span :style="{ color: getEfficiencyColor(scope.row.efficiency), fontWeight: '500' }">
                    {{ scope.row.efficiency ? scope.row.efficiency + '%' : '-' }}
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
                <el-button
                  type="text"
                  size="mini"
                  icon="el-icon-view"
                  @click="handleRuntimeDetail(scope.row)"
                  style="padding: 1px 2px; font-size: 11px; min-width: auto;"
                >
                  详情
                </el-button>
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
  
      <!-- 详情弹窗 -->
      <el-dialog
        title="运行时间记录详情"
        :visible.sync="dialogVisible"
        width="900px"
        :close-on-click-modal="false"
        class="custom-dialog"
      >
        <div class="detail-content" v-if="detailData">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>设备名称：</label>
                <span>{{ detailData.deviceName }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>设备编号：</label>
                <span>{{ detailData.deviceCode }}</span>
              </div>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>设备类型：</label>
                <span>{{ getDeviceTypeLabel(detailData.deviceType) }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>所属租户：</label>
                <span>{{ detailData.tenantInfo }}</span>
              </div>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>当前状态：</label>
                <span>{{ getRunStatusLabel(detailData.runStatus) }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>记录时间：</label>
                <span>{{ detailData.recordTime }}</span>
              </div>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-item">
                <label>累计运行：</label>
                <span class="runtime-value">{{ detailData.totalRuntime }}h</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>本月运行：</label>
                <span class="monthly-value">{{ detailData.monthlyRuntime }}h</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>运行效率：</label>
                <span class="efficiency-value" :style="{ color: getEfficiencyColor(detailData.efficiency) }">{{ detailData.efficiency }}%</span>
              </div>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>启动次数：</label>
                <span>{{ detailData.startCount }}次</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>平均单次运行：</label>
                <span>{{ detailData.avgRuntime }}h</span>
              </div>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="24">
              <div class="detail-item">
                <label>备注信息：</label>
                <span>{{ detailData.remark || '无' }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
        </span>
      </el-dialog>
    </div>
  </template>
  
  <script>
  // 模拟API方法
  const mockApi = {
    // 获取运行时间记录列表
    getRuntimeList: (params) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockData = [];
          const deviceTypes = ['central', 'split', 'duct'];
          const runStatuses = ['running', 'stopped', 'fault'];
          
          // 按照办公楼层级结构的租户数据
          const buildingTenants = [
            // 中心大厦A栋
            { tenantId: 'CA_1F_001', tenantName: '中心大厦A栋-1F展览大厅', buildingName: '中心大厦A栋', floor: '1F', roomName: '展览大厅' },
            { tenantId: 'CA_2F_001', tenantName: '中心大厦A栋-2F会议接待厅', buildingName: '中心大厦A栋', floor: '2F', roomName: '会议接待厅' },
            { tenantId: 'CA_3F_001', tenantName: '中心大厦A栋-3F市场营销部', buildingName: '中心大厦A栋', floor: '3F', roomName: '市场营销部' },
            { tenantId: 'CA_4F_001', tenantName: '中心大厦A栋-4F技术研发部', buildingName: '中心大厦A栋', floor: '4F', roomName: '技术研发部' },
            { tenantId: 'CA_5F_001', tenantName: '中心大厦A栋-5F行政办公室', buildingName: '中心大厦A栋', floor: '5F', roomName: '行政办公室' },
            
            // 创新大厦B栋
            { tenantId: 'CB_B1_001', tenantName: '创新大厦B栋-B1地下停车库', buildingName: '创新大厦B栋', floor: 'B1', roomName: '地下停车库' },
            { tenantId: 'CB_1F_001', tenantName: '创新大厦B栋-1F接待大厅', buildingName: '创新大厦B栋', floor: '1F', roomName: '接待大厅' },
            { tenantId: 'CB_2F_001', tenantName: '创新大厦B栋-2F餐厅食堂', buildingName: '创新大厦B栋', floor: '2F', roomName: '餐厅食堂' },
            { tenantId: 'CB_3F_001', tenantName: '创新大厦B栋-3F技术研发室', buildingName: '创新大厦B栋', floor: '3F', roomName: '技术研发室' },
          ];
          
          // 设备品牌和型号
          const deviceBrands = ['格力', '美的', '海尔', '大金', '三菱', '约克', '开利', '特灵'];
          const deviceModels = ['GMV-H120WL/A', 'MDV-450W/DSN1', 'KFR-72LW/10TAA21AU1', 'VRV-A系列', 'MSZ-FH09NA'];
          
          for (let i = 1; i <= 20; i++) {
            const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
            const runStatus = runStatuses[Math.floor(Math.random() * runStatuses.length)];
            const tenant = buildingTenants[Math.floor(Math.random() * buildingTenants.length)];
            const brand = deviceBrands[Math.floor(Math.random() * deviceBrands.length)];
            const model = deviceModels[Math.floor(Math.random() * deviceModels.length)];
            
            const totalRuntime = (Math.random() * 2000 + 500).toFixed(1);
            const monthlyRuntime = (Math.random() * 200 + 50).toFixed(1);
            const startCount = Math.floor(Math.random() * 150 + 20);
            const avgRuntime = (totalRuntime / startCount).toFixed(1);
            const efficiency = Math.floor(Math.random() * 30 + 70); // 70-100%
            
            mockData.push({
              id: i,
              deviceName: `${brand}-${model}-${tenant.floor}-${String(i).padStart(2, '0')}`,
              deviceCode: `HVAC${new Date().getFullYear()}${String(i).padStart(6, '0')}`,
              deviceType: deviceType,
              tenantId: tenant.tenantId,
              tenantInfo: tenant.tenantName,
              buildingName: tenant.buildingName,
              floor: tenant.floor,
              roomName: tenant.roomName,
              runStatus: runStatus,
              recordTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              }),
              totalRuntime: totalRuntime,
              monthlyRuntime: monthlyRuntime,
              startCount: startCount,
              avgRuntime: avgRuntime,
              efficiency: efficiency,
              remark: Math.random() > 0.8 ? `${tenant.roomName}空调${runStatus === 'running' ? '正常运行中' : runStatus === 'stopped' ? '已按时停机' : '检测到异常，需要维护'}` : '',
            });
          }
          resolve({
            code: 200,
            data: {
              dataList: mockData,
              total: 300
            }
          });
        }, 500);
      });
    },
  
    // 获取租户列表
    getTenantList: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // 按照真实的办公楼层级结构模拟租户数据
          const buildingTenants = [
            // 中心大厦A栋
            { tenantId: 'CA_1F_001', tenantName: '中心大厦A栋-1F展览大厅', buildingName: '中心大厦A栋', floor: '1F', roomName: '展览大厅' },
            { tenantId: 'CA_2F_001', tenantName: '中心大厦A栋-2F会议接待厅', buildingName: '中心大厦A栋', floor: '2F', roomName: '会议接待厅' },
            { tenantId: 'CA_3F_001', tenantName: '中心大厦A栋-3F市场营销部', buildingName: '中心大厦A栋', floor: '3F', roomName: '市场营销部' },
            { tenantId: 'CA_4F_001', tenantName: '中心大厦A栋-4F技术研发部', buildingName: '中心大厦A栋', floor: '4F', roomName: '技术研发部' },
            { tenantId: 'CA_5F_001', tenantName: '中心大厦A栋-5F行政办公室', buildingName: '中心大厦A栋', floor: '5F', roomName: '行政办公室' },
            
            // 创新大厦B栋
            { tenantId: 'CB_B1_001', tenantName: '创新大厦B栋-B1地下停车库', buildingName: '创新大厦B栋', floor: 'B1', roomName: '地下停车库' },
            { tenantId: 'CB_1F_001', tenantName: '创新大厦B栋-1F接待大厅', buildingName: '创新大厦B栋', floor: '1F', roomName: '接待大厅' },
            { tenantId: 'CB_2F_001', tenantName: '创新大厦B栋-2F餐厅食堂', buildingName: '创新大厦B栋', floor: '2F', roomName: '餐厅食堂' },
            { tenantId: 'CB_3F_001', tenantName: '创新大厦B栋-3F技术研发室', buildingName: '创新大厦B栋', floor: '3F', roomName: '技术研发室' },
          ];
          
          resolve({
            code: 200,
            data: buildingTenants
          });
        }, 300);
      });
    }
  };
  
  export default {
    name: "ConditioningRuntime",
    data() {
      return {
        tableHeightConfig: {
          headerHeight: 48,
          rowHeight: 47,
          minHeight: 200,
          maxRows: 10,
          paginationHeight: 68,
        },
        // 查询参数
        queryData: {
          deviceName: "",
          deviceType: "",
          tenantId: "",
          runStatus: "",
          recordTimeRange: "",
        },
        // 搜索字段配置
        searchFields: {
          basic: [
            { prop: "deviceName", label: "设备名称", type: "input" },
            { prop: "deviceType", label: "设备类型", type: "select" },
            { prop: "tenantId", label: "所属租户", type: "select" },
            { prop: "runStatus", label: "运行状态", type: "select" },
            { prop: "recordTimeRange", label: "记录时间", type: "daterange" },
          ],
          advanced: [],
        },
        // 租户列表数据
        tenantList: [],
        // 表格数据
        tableData: [],
        // 加载状态
        loading: false,
        // 是否显示高级筛选
        showAdvanced: false,
        // 分页数据
        pageData: {
          current: 1,
          size: 15,
          total: 0,
        },
        // 选中的数据
        selectedData: [],
        // 详情弹窗
        dialogVisible: false,
        detailData: null,
        // 表格列配置
        tableKey: [
          {
            label: "设备名称",
            key: "deviceName",
            checked: true,
            disabled: true,
          },
          {
            label: "设备编号",
            key: "deviceCode",
            checked: true,
          },
          {
            label: "设备类型",
            key: "deviceTypeLabel",
            checked: true,
          },
          {
            label: "所属租户",
            key: "tenantInfo",
            checked: true,
          },
          {
            label: "运行状态",
            key: "runStatusLabel",
            checked: true,
          },
          {
            label: "累计运行",
            key: "totalRuntime",
            checked: true,
          },
          {
            label: "本月运行",
            key: "monthlyRuntime",
            checked: true,
          },
          {
            label: "运行效率",
            key: "efficiency",
            checked: true,
          },
          {
            label: "记录时间",
            key: "recordTime",
            checked: true,
          },
        ],
      };
    },
    computed: {
      dataLength() {
        return this.tableData.length;
      },
      // 计算需要显示的列
      displayColumns() {
        return this.tableKey.filter((col) => col.checked !== false);
      },
      // 判断是否需要显示高级筛选按钮
      needAdvancedSearch() {
        const totalFields =
          this.searchFields.basic.length + this.searchFields.advanced.length;
        return totalFields > 5;
      },
      // 获取实际显示的基础搜索字段
      displayBasicFields() {
        if (!this.needAdvancedSearch) {
          return [...this.searchFields.basic, ...this.searchFields.advanced];
        }
        return this.searchFields.basic;
      },
      // 获取高级搜索字段
      displayAdvancedFields() {
        return this.searchFields.advanced;
      },
      // 动态计算表格高度
      dynamicTableHeight() {
        const dataLength = this.tableData.length;
  
        if (dataLength === 0) {
          return this.tableHeightConfig.minHeight;
        }
  
        if (dataLength <= this.tableHeightConfig.maxRows) {
          return (
            this.tableHeightConfig.headerHeight +
            dataLength * this.tableHeightConfig.rowHeight
          );
        }
  
        return (
          this.tableHeightConfig.headerHeight +
          this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
        );
      },
      tableMaxHeight() {
        return (
          this.tableHeightConfig.headerHeight +
          this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
        );
      },
    },
    mounted() {
      this.fetchTableData();
      this.getTenantList();
    },
  
    methods: {
      // 获取设备类型标签类型
      getDeviceTypeTagType(type) {
        const typeMap = {
          'central': 'primary',
          'split': 'success',
          'duct': 'warning'
        };
        return typeMap[type] || 'info';
      },
  
      // 获取设备类型标签文本
      getDeviceTypeLabel(type) {
        const typeMap = {
          'central': '中央空调',
          'split': '分体空调',
          'duct': '风管机'
        };
        return typeMap[type] || type;
      },
  
      // 获取运行状态标签类型
      getRunStatusTagType(status) {
        const statusMap = {
          'running': 'success',
          'stopped': 'info',
          'fault': 'danger'
        };
        return statusMap[status] || 'info';
      },
  
      // 获取运行状态标签文本
      getRunStatusLabel(status) {
        const statusMap = {
          'running': '运行中',
          'stopped': '已停止',
          'fault': '故障'
        };
        return statusMap[status] || status;
      },
  
      // 获取效率颜色
      getEfficiencyColor(efficiency) {
        if (efficiency >= 90) return '#67C23A'; // 绿色
        if (efficiency >= 80) return '#E6A23C'; // 橙色
        if (efficiency >= 70) return '#F56C6C'; // 红色
        return '#909399'; // 灰色
      },
  
      // 获取租户列表
      async getTenantList() {
        try {
          const response = await mockApi.getTenantList();
          if (response.code === 200) {
            this.tenantList = response.data || [];
          }
        } catch (error) {
          console.error("获取租户列表失败:", error);
          this.tenantList = [];
        }
      },
  
      // 获取运行时间记录列表数据
      async fetchTableData() {
        this.loading = true;
        try {
          const params = {
            deviceName: this.queryData.deviceName,
            deviceType: this.queryData.deviceType,
            tenantId: this.queryData.tenantId,
            runStatus: this.queryData.runStatus,
            recordTimeRange: this.queryData.recordTimeRange,
            page: {
              current: this.pageData.current,
              size: this.pageData.size,
              orders: [{ asc: false, column: "recordTime" }],
            },
          };
  
          const response = await mockApi.getRuntimeList(params);
  
          if (response.code === 200 && response.data) {
            this.tableData = response.data.dataList || [];
            this.pageData.total = response.data.total || 0;
          } else {
            this.$message.error(response.msg || "获取数据失败");
          }
        } catch (error) {
          this.$message.error("获取运行时间记录数据失败");
          console.error("获取运行时间记录数据失败:", error);
        } finally {
          this.loading = false;
        }
      },
  
      // 查询
      handleSearch() {
        this.pageData.current = 1;
        this.fetchTableData();
      },
  
      // 重置
      handleReset() {
        this.queryData = {
          deviceName: "",
          deviceType: "",
          tenantId: "",
          runStatus: "",
          recordTimeRange: "",
        };
        this.showAdvanced = false;
        this.handleSearch();
      },
  
      // 处理顶部下拉命令
      handleCommand(command) {
        switch (command) {
          case "export":
            this.handleExport();
            break;
          case "import":
            this.$message.info("导入功能开发中...");
            break;
          case "batch":
            this.$message.info("批量操作功能开发中...");
            break;
        }
      },
  
      // 运行时间记录详情
      handleRuntimeDetail(row) {
        this.detailData = row;
        this.dialogVisible = true;
      },
  
      // 设备详情
      handleDeviceDetail(row) {
        this.$message.info(`查看设备详情: ${row.deviceName}`);
        // this.$router.push({
        //   path: `/device/conditioning/detail/${row.deviceId}`,
        //   query: { deviceName: row.deviceName }
        // });
      },
  
      // 租户点击
      handleTenantClick(row) {
        this.$message.info(`查看租户详情: ${row.tenantInfo}`);
        // this.$router.push({
        //   path: "/application/tenant/detail",
        //   query: { id: row.tenantId }
        // });
      },
  
      // 导出数据
      handleExport() {
        if (this.selectedData.length === 0) {
          this.$message.warning("请先选择要导出的数据");
          return;
        }
        this.$message.info("导出功能开发中...");
      },
  
      // 选择变化
      handleSelectionChange(selection) {
        this.selectedData = selection;
      },
  
      // 分页大小变化
      handleSizeChange(val) {
        this.pageData.size = val;
        this.pageData.current = 1;
        this.fetchTableData();
      },
  
      // 当前页变化
      handleCurrentChange(val) {
        this.pageData.current = val;
        this.fetchTableData();
      },
    },
  };
  </script>
  
  <style lang="scss" scoped>
  // 引入表格页面公共样式
  @import "@/assets/styles/table-page.scss";
  
  // 额外样式
  .runtime-text {
    font-weight: 500;
  }
  
  .detail-content {
    .detail-item {
      margin-bottom: 16px;
      line-height: 32px;
      
      label {
        font-weight: 600;
        color: #606266;
        display: inline-block;
        width: 100px;
      }
      
      span {
        color: #303133;
      }
      
      .runtime-value {
        color: #67C23A;
        font-weight: 500;
      }
      
      .monthly-value {
        color: #E6A23C;
        font-weight: 500;
      }
      
      .efficiency-value {
        font-weight: 500;
      }
    }
  }
  
  .text-muted {
    color: #909399;
  }
  </style>