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
                    <!-- 空调设备选项 -->
                    <template v-if="field.prop === 'deviceId'">
                      <el-option label="全部" value="" />
                      <el-option
                        v-for="device in deviceList"
                        :key="device.id"
                        :label="`${device.id}(${device.name})`"
                        :value="device.id"
                      >
                        <span style="font-size: 12px"
                          >{{ device.id }}({{ device.name }})</span
                        >
                      </el-option>
                    </template>
                    <!-- 封锁模式选项 -->
                    <template v-else-if="field.prop === 'lockMode'">
                      <el-option label="全部" value="" />
                      <el-option label="时间封锁" value="1">
                        <span class="option-with-dot">
                          <span class="status-dot time-lock"></span>
                          时间封锁
                        </span>
                      </el-option>
                      <el-option label="温度封锁" value="2">
                        <span class="option-with-dot">
                          <span class="status-dot temp-lock"></span>
                          温度封锁
                        </span>
                      </el-option>
                      <el-option label="功率封锁" value="3">
                        <span class="option-with-dot">
                          <span class="status-dot power-lock"></span>
                          功率封锁
                        </span>
                      </el-option>
                    </template>
                    <!-- 指令状态选项 -->
                    <template v-else-if="field.prop === 'commandStatus'">
                      <el-option label="全部" value="" />
                      <el-option label="待执行" value="0">
                        <span class="option-with-dot">
                          <span class="status-dot pending"></span>
                          待执行
                        </span>
                      </el-option>
                      <el-option label="执行中" value="1">
                        <span class="option-with-dot">
                          <span class="status-dot executing"></span>
                          执行中
                        </span>
                      </el-option>
                      <el-option label="已完成" value="2">
                        <span class="option-with-dot">
                          <span class="status-dot completed"></span>
                          已完成
                        </span>
                      </el-option>
                      <el-option label="已失败" value="3">
                        <span class="option-with-dot">
                          <span class="status-dot failed"></span>
                          已失败
                        </span>
                      </el-option>
                    </template>
                    <!-- 动作类型选项 -->
                    <template v-else-if="field.prop === 'actionType'">
                      <el-option label="全部" value="" />
                      <el-option label="开启" value="1" />
                      <el-option label="关闭" value="2" />
                      <el-option label="调温" value="3" />
                      <el-option label="调模式" value="4" />
                      <el-option label="调风速" value="5" />
                    </template>
                  </el-select>
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
                      :filterable="field.prop === 'deviceId'"
                    >
                      <!-- 空调设备选项 -->
                      <template v-if="field.prop === 'deviceId'">
                        <el-option label="全部" value="" />
                        <el-option
                          v-for="device in deviceList"
                          :key="device.id"
                          :label="`${device.id}(${device.name})`"
                          :value="device.id"
                        >
                          <span style="font-size: 12px"
                            >{{ device.id }}({{ device.name }})</span
                          >
                        </el-option>
                      </template>
                      <!-- 指令状态选项 -->
                      <template v-else-if="field.prop === 'commandStatus'">
                        <el-option label="全部" value="" />
                        <el-option label="待执行" value="0">
                          <span class="option-with-dot">
                            <span class="status-dot pending"></span>
                            待执行
                          </span>
                        </el-option>
                        <el-option label="执行中" value="1">
                          <span class="option-with-dot">
                            <span class="status-dot executing"></span>
                            执行中
                          </span>
                        </el-option>
                        <el-option label="已完成" value="2">
                          <span class="option-with-dot">
                            <span class="status-dot completed"></span>
                            已完成
                          </span>
                        </el-option>
                        <el-option label="已失败" value="3">
                          <span class="option-with-dot">
                            <span class="status-dot failed"></span>
                            已失败
                          </span>
                        </el-option>
                      </template>
                      <!-- 动作类型选项 -->
                      <template v-else-if="field.prop === 'actionType'">
                        <el-option label="全部" value="" />
                        <el-option label="开启" value="1" />
                        <el-option label="关闭" value="2" />
                        <el-option label="调温" value="3" />
                        <el-option label="调模式" value="4" />
                        <el-option label="调风速" value="5" />
                      </template>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-collapse-transition>
  
            <!-- 操作按钮行 - 更合理的布局 -->
            <div class="form-actions compact-actions">
              <div class="action-left">
                <el-button
                  type="primary"
                  icon="el-icon-plus"
                  size="small"
                  @click="handleAdd"
                >
                  创建任务
                </el-button>
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
                <!-- 定时编号 - 添加图标和跳转链接 -->
                <template v-if="col.key === 'scheduleId'">
                  <el-link type="primary" @click="handleView(scope.row)">
                    <i class="iconfont icon-kongtiao" style="margin-right: 4px;"></i>
                    {{ scope.row.scheduleId || "-" }}
                  </el-link>
                </template>
  
                <!-- 空调设备 - 黑色文字，不可点击 -->
                <template v-else-if="col.key === 'deviceName'">
                  <span style="color: #000;">
                    {{ scope.row.deviceName || "-" }}
                  </span>
                </template>
  
                <!-- 封锁模式 -->
                <template v-else-if="col.key === 'lockModeLabel'">
                  <el-tag
                    v-if="scope.row.lockMode == 1"
                    type="primary"
                    size="small"
                    effect="plain"
                  >
                    时间封锁
                  </el-tag>
                  <el-tag
                    v-else-if="scope.row.lockMode == 2"
                    type="warning"
                    size="small"
                    effect="plain"
                  >
                    温度封锁
                  </el-tag>
                  <el-tag
                    v-else-if="scope.row.lockMode == 3"
                    type="info"
                    size="small"
                    effect="plain"
                  >
                    功率封锁
                  </el-tag>
                  <span v-else>-</span>
                </template>
  
                <!-- 动作类型 -->
                <template v-else-if="col.key === 'actionTypeLabel'">
                  <el-tag
                    v-if="scope.row.actionType == 1"
                    type="success"
                    size="small"
                  >
                    开启
                  </el-tag>
                  <el-tag
                    v-else-if="scope.row.actionType == 2"
                    type="danger"
                    size="small"
                  >
                    关闭
                  </el-tag>
                  <el-tag
                    v-else-if="scope.row.actionType == 3"
                    type="primary"
                    size="small"
                  >
                    调温
                  </el-tag>
                  <el-tag
                    v-else-if="scope.row.actionType == 4"
                    type="warning"
                    size="small"
                  >
                    调模式
                  </el-tag>
                  <el-tag
                    v-else-if="scope.row.actionType == 5"
                    type="info"
                    size="small"
                  >
                    调风速
                  </el-tag>
                  <span v-else>-</span>
                </template>
  
                <!-- 指令状态 -->
                <template v-else-if="col.key === 'commandStatusLabel'">
                  <div class="status-wrapper">
                    <span
                      :class="[
                        'status-dot',
                        scope.row.commandStatus == 0 ? 'pending' :
                        scope.row.commandStatus == 1 ? 'executing' :
                        scope.row.commandStatus == 2 ? 'completed' : 'failed'
                      ]"
                    ></span>
                    <span>{{
                      scope.row.commandStatus == 0 ? "待执行" :
                      scope.row.commandStatus == 1 ? "执行中" :
                      scope.row.commandStatus == 2 ? "已完成" : "已失败"
                    }}</span>
                  </div>
                </template>
  
                <!-- 目标温度 -->
                <template v-else-if="col.key === 'targetTemp'">
                  <span v-if="scope.row.targetTemp" class="temp-text">
                    {{ scope.row.targetTemp }}°C
                  </span>
                  <span v-else>-</span>
                </template>
  
                <!-- 执行时间 -->
                <template v-else-if="col.key === 'executeTime'">
                  <span>{{ scope.row.executeTime || "-" }}</span>
                </template>
  
                <!-- 创建时间 -->
                <template v-else-if="col.key === 'createTime'">
                  <span>{{ generateRandomTime() }}</span>
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
              width="180"
              fixed="right"
              align="center"
            >
              <template slot-scope="scope">
                <div style="display: flex; align-items: center; justify-content: center; gap: 2px; white-space: nowrap;">
                  <el-button
                    type="text"
                    size="mini"
                    :icon="scope.row.commandStatus == 0 ? 'el-icon-video-play' : 'el-icon-video-pause'"
                    @click="handleExecute(scope.row)"
                    :style="{
                      color: scope.row.commandStatus == 0 ? '#67C23A' : '#F56C6C',
                      padding: '1px 2px',
                      fontSize: '11px',
                      minWidth: 'auto'
                    }"
                  >
                    {{ scope.row.commandStatus == 0 ? "执行" : "停止" }}
                  </el-button>
                  <span style="color: #DCDFE6; font-size: 10px;">|</span>
                  <el-button
                    type="text"
                    size="mini"
                    icon="el-icon-view"
                    @click="handleView(scope.row)"
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
        :title="editForm.id ? '编辑定时' : '新增定时'"
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
              <el-form-item label="定时名称" prop="scheduleName">
                <el-input
                  v-model="editForm.scheduleName"
                  placeholder="请输入定时名称"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="空调设备" prop="deviceId">
                <el-select
                  v-model="editForm.deviceId"
                  placeholder="请选择空调设备"
                  style="width: 100%"
                  filterable
                >
                  <el-option
                    v-for="device in deviceList"
                    :key="device.id"
                    :label="`${device.id}(${device.name})`"
                    :value="device.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="封锁模式" prop="lockMode">
                <el-select
                  v-model="editForm.lockMode"
                  placeholder="请选择封锁模式"
                  style="width: 100%"
                >
                  <el-option label="时间封锁" value="1" />
                  <el-option label="温度封锁" value="2" />
                  <el-option label="功率封锁" value="3" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="动作类型" prop="actionType">
                <el-select
                  v-model="editForm.actionType"
                  placeholder="请选择动作类型"
                  style="width: 100%"
                >
                  <el-option label="开启" value="1" />
                  <el-option label="关闭" value="2" />
                  <el-option label="调温" value="3" />
                  <el-option label="调模式" value="4" />
                  <el-option label="调风速" value="5" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="目标温度" prop="targetTemp">
                <el-input-number
                  v-model="editForm.targetTemp"
                  :min="16"
                  :max="30"
                  placeholder="请输入目标温度"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="执行时间" prop="executeTime">
                <el-date-picker
                  v-model="editForm.executeTime"
                  type="datetime"
                  placeholder="选择执行时间"
                  style="width: 100%"
                  format="yyyy-MM-dd HH:mm:ss"
                  value-format="yyyy-MM-dd HH:mm:ss"
                />
              </el-form-item>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="备注" prop="remark">
                <el-input
                  v-model="editForm.remark"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入备注信息"
                />
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
  import { mapGetters } from "vuex";
  
  export default {
    name: "ConditioningSchedule",
    data() {
      return {
        tableHeightConfig: {
          headerHeight: 48, // 表头高度
          rowHeight: 47, // 每行高度
          minHeight: 200, // 最小高度
          maxRows: 10, // 最大显示行数（超过9行显示滚动条）
          paginationHeight: 68, // 分页高度
        },
        // 查询参数
        queryData: {
          scheduleId: "",
          deviceId: "",
          deviceName: "",
          lockMode: "",
          actionType: "",
          commandStatus: "",
        },
        // 搜索字段配置
        searchFields: {
          basic: [
            { prop: "scheduleId", label: "定时编号", type: "input" },
            { prop: "deviceName", label: "空调设备", type: "input" },
            { prop: "lockMode", label: "封锁模式", type: "select" },
          ],
          advanced: [
            { prop: "deviceId", label: "设备编号", type: "select" },
            { prop: "actionType", label: "动作类型", type: "select" },
            { prop: "commandStatus", label: "指令状态", type: "select" },
          ],
        },
        // 空调设备列表数据
        deviceList: [],
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
          total: 0,
        },
        // 选中的数据
        selectedData: [],
        // 编辑弹窗
        dialogVisible: false,
        // 编辑表单
        editForm: {
          id: "",
          scheduleName: "",
          deviceId: "",
          lockMode: "",
          actionType: "",
          targetTemp: 26,
          executeTime: "",
          remark: "",
        },
        // 表单验证规则
        rules: {
          scheduleName: [
            { required: true, message: "请输入定时名称", trigger: "blur" },
          ],
          deviceId: [
            { required: true, message: "请选择空调设备", trigger: "change" },
          ],
          lockMode: [
            { required: true, message: "请选择封锁模式", trigger: "change" },
          ],
          actionType: [
            { required: true, message: "请选择动作类型", trigger: "change" },
          ],
          executeTime: [
            { required: true, message: "请选择执行时间", trigger: "change" },
          ],
        },
        // 表格列配置
        tableKey: [
          {
            label: "定时编号",
            key: "scheduleId",
            width: "150",
            checked: true,
            disabled: true,
          },
          {
            label: "空调设备",
            key: "deviceName",
            width: "200",
            checked: true,
            disabled: true,
          },
          {
            label: "封锁模式",
            key: "lockModeLabel",
            checked: true,
            width: "120",
          },
          {
            label: "动作类型",
            key: "actionTypeLabel",
            checked: true,
            width: "120",
          },
          {
            label: "目标温度",
            key: "targetTemp",
            width: "120",
            checked: true,
          },
          {
            label: "执行时间",
            key: "executeTime",
            width: "180",
            checked: true,
          },
          {
            label: "指令状态",
            checked: true,
            key: "commandStatusLabel",
            width: "120",
            type: "status",
          },
          {
            label: "创建时间",
            key: "createTime",
            width: "180",
            checked: true,
          },
          {
            label: "备注",
            key: "remark",
            width: "200",
          },
        ],
      };
    },
    computed: {
      ...mapGetters("manager", ["currentManagerId"]),
      dataLength() {
        return this.tableData.length;
      },
      // 计算需要显示的列
      displayColumns() {
        return this.tableKey.filter((col) => col.checked !== false);
      },
      // 判断是否需要显示高级筛选按钮
      needAdvancedSearch() {
        // 当总搜索字段数量大于5个时显示高级筛选
        const totalFields =
          this.searchFields.basic.length + this.searchFields.advanced.length;
        return totalFields > 5;
      },
      // 获取实际显示的基础搜索字段
      displayBasicFields() {
        // 如果不需要高级筛选，显示所有字段
        if (!this.needAdvancedSearch) {
          return [...this.searchFields.basic, ...this.searchFields.advanced];
        }
        // 否则只显示基础字段
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
  
        // 数据 <= 9条：显示实际行数高度
        if (dataLength <= this.tableHeightConfig.maxRows) {
          return (
            this.tableHeightConfig.headerHeight +
            dataLength * this.tableHeightConfig.rowHeight
          );
        }
  
        // 数据 > 9条：固定显示9行高度 + 内部滚动
        return (
          this.tableHeightConfig.headerHeight +
          this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
        );
      },
      tableMaxHeight() {
        // 始终返回最大高度（9行 + 表头）
        return (
          this.tableHeightConfig.headerHeight +
          this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
        );
      },
    },
    watch: {
      currentManagerId: {
        handler(newVal) {
          if (newVal) {
            this.fetchTableData();
            this.getDeviceList();
          }
        },
        immediate: true,
      },
    },
  
    mounted() {
      this.initializeData();
    },
  
    methods: {
      // 初始化数据
      initializeData() {
        this.generateDeviceList();
        this.generateTableData();
      },
  
      // 生成随机时间 - 今天半小时内的随机时间
      generateRandomTime() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // 生成今天0点到现在的随机时间
        const maxTime = now.getTime();
        const minTime = today.getTime();
        
        // 随机时间在半小时内
        const halfHour = 30 * 60 * 1000; // 30分钟的毫秒数
        const randomTime = maxTime - Math.random() * halfHour;
        
        const randomDate = new Date(randomTime);
        
        // 格式化为 YYYY-MM-DD HH:mm:ss
        const year = randomDate.getFullYear();
        const month = String(randomDate.getMonth() + 1).padStart(2, '0');
        const day = String(randomDate.getDate()).padStart(2, '0');
        const hours = String(randomDate.getHours()).padStart(2, '0');
        const minutes = String(randomDate.getMinutes()).padStart(2, '0');
        const seconds = String(randomDate.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      },
  
      // 生成随机执行时间
      generateRandomExecuteTime() {
        const now = new Date();
        const futureTime = new Date(now.getTime() + Math.random() * 24 * 60 * 60 * 1000); // 未来24小时内
        
        const year = futureTime.getFullYear();
        const month = String(futureTime.getMonth() + 1).padStart(2, '0');
        const day = String(futureTime.getDate()).padStart(2, '0');
        const hours = String(futureTime.getHours()).padStart(2, '0');
        const minutes = String(futureTime.getMinutes()).padStart(2, '0');
        const seconds = String(futureTime.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      },
  
      // 生成设备列表数据
      generateDeviceList() {
        const devices = [];
        let deviceCounter = 1;
        
        // A栋设备
        const aFloorAreas = [
          { name: "1F展销大厅", count: 8, prefix: "展销" },
          { name: "2F会议接待厅", count: 6, prefix: "会议" },
          { name: "3F市场营销部", count: 10, prefix: "营销" },
          { name: "4F技术研发部", count: 12, prefix: "研发" },
          { name: "5F行政办公室", count: 8, prefix: "行政" }
        ];
        
        aFloorAreas.forEach(area => {
          for (let i = 1; i <= area.count; i++) {
            devices.push({
              id: `AC${String(deviceCounter).padStart(3, "0")}`,
              name: `${area.prefix}空调-${String(i).padStart(2, "0")}`,
              location: `中心大厦A栋-${area.name}`,
            });
            deviceCounter++;
          }
        });
        
        // B栋设备
        const bFloorAreas = [
          { name: "B1地下停车库", count: 4, prefix: "停车" },
          { name: "1F接待大厅", count: 3, prefix: "接待" },
          { name: "2F餐厅食堂", count: 5, prefix: "餐厅" },
          { name: "3F技术研发", count: 6, prefix: "研发" }
        ];
        
        bFloorAreas.forEach(area => {
          for (let i = 1; i <= area.count; i++) {
            devices.push({
              id: `AC${String(deviceCounter).padStart(3, "0")}`,
              name: `${area.prefix}空调-${String(i).padStart(2, "0")}`,
              location: `创新大厦B栋-${area.name}`,
            });
            deviceCounter++;
          }
        });
        
        this.deviceList = devices;
      },
  
      // 生成表格数据
      generateTableData() {
        const data = [];
        const lockModes = ["1", "2", "3"];
        const actionTypes = ["1", "2", "3", "4", "5"];
        const commandStatuses = ["0", "1", "2", "3"];
        const scheduleNames = [
          "办公时间自动开启", "下班时间自动关闭", "午休调温", "夜间节能模式", 
          "早晨预热", "会议室专用", "高温保护", "节能运行", "定时通风", "温度调节"
        ];
        
        for (let i = 1; i <= 32; i++) {
          const device = this.deviceList[Math.floor(Math.random() * this.deviceList.length)];
          const lockMode = lockModes[Math.floor(Math.random() * lockModes.length)];
          const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
          const commandStatus = commandStatuses[Math.floor(Math.random() * commandStatuses.length)];
          
          data.push({
            id: i,
            scheduleId: `SCH${String(i).padStart(4, "0")}`,
            scheduleName: scheduleNames[Math.floor(Math.random() * scheduleNames.length)],
            deviceId: device.id,
            deviceName: device.name,
            deviceLocation: device.location,
            lockMode: lockMode,
            lockModeLabel: this.getLockModeLabel(lockMode),
            actionType: actionType,
            actionTypeLabel: this.getActionTypeLabel(actionType),
            targetTemp: actionType === "3" ? Math.floor(Math.random() * 10) + 20 : null,
            executeTime: this.generateRandomExecuteTime(),
            commandStatus: commandStatus,
            commandStatusLabel: this.getCommandStatusLabel(commandStatus),
            createTime: this.generateRandomTime(),
            remark: Math.random() > 0.7 ? "自动生成的定时任务" : "",
          });
        }
        
        this.tableData = data;
        this.pageData.total = data.length;
      },
  
      // 获取封锁模式标签
      getLockModeLabel(mode) {
        const map = {
          "1": "时间封锁",
          "2": "温度封锁", 
          "3": "功率封锁"
        };
        return map[mode] || "-";
      },
  
      // 获取动作类型标签
      getActionTypeLabel(type) {
        const map = {
          "1": "开启",
          "2": "关闭",
          "3": "调温",
          "4": "调模式",
          "5": "调风速"
        };
        return map[type] || "-";
      },
  
      // 获取指令状态标签
      getCommandStatusLabel(status) {
        const map = {
          "0": "待执行",
          "1": "执行中",
          "2": "已完成", 
          "3": "已失败"
        };
        return map[status] || "-";
      },
  
      // 获取设备列表
      getDeviceList() {
        // 模拟API调用，实际项目中替换为真实API
        this.generateDeviceList();
      },
  
      // 获取定时列表数据
      fetchTableData() {
        this.loading = true;
        
        // 模拟API调用
        setTimeout(() => {
          let filteredData = [...this.tableData];
          
          // 应用筛选条件
          if (this.queryData.scheduleId) {
            filteredData = filteredData.filter(item => 
              item.scheduleId.toLowerCase().includes(this.queryData.scheduleId.toLowerCase())
            );
          }
          if (this.queryData.deviceName) {
            filteredData = filteredData.filter(item => 
              item.deviceName.toLowerCase().includes(this.queryData.deviceName.toLowerCase())
            );
          }
          if (this.queryData.lockMode) {
            filteredData = filteredData.filter(item => item.lockMode === this.queryData.lockMode);
          }
          if (this.queryData.actionType) {
            filteredData = filteredData.filter(item => item.actionType === this.queryData.actionType);
          }
          if (this.queryData.commandStatus) {
            filteredData = filteredData.filter(item => item.commandStatus === this.queryData.commandStatus);
          }
          if (this.queryData.deviceId) {
            filteredData = filteredData.filter(item => item.deviceId === this.queryData.deviceId);
          }
          
          // 分页处理
          const start = (this.pageData.current - 1) * this.pageData.size;
          const end = start + this.pageData.size;
          this.tableData = filteredData.slice(start, end);
          this.pageData.total = filteredData.length;
          
          this.loading = false;
        }, 500);
      },
  
      // 查询
      handleSearch() {
        this.pageData.current = 1;
        this.fetchTableData();
      },
  
      // 重置
      handleReset() {
        this.queryData = {
          scheduleId: "",
          deviceId: "",
          deviceName: "",
          lockMode: "",
          actionType: "",
          commandStatus: "",
        };
        this.showAdvanced = false;
        this.generateTableData(); // 重新生成完整数据
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
  
      // 新增定时
      handleAdd() {
        this.editForm = {
          id: "",
          scheduleName: "",
          deviceId: "",
          lockMode: "",
          actionType: "",
          targetTemp: 26,
          executeTime: "",
          remark: "",
        };
        this.dialogVisible = true;
        this.$nextTick(() => {
          this.$refs.editForm && this.$refs.editForm.clearValidate();
        });
      },
  
      // 编辑定时
      handleEdit(row) {
        this.editForm = {
          id: row.id,
          scheduleName: row.scheduleName,
          deviceId: row.deviceId,
          lockMode: row.lockMode,
          actionType: row.actionType,
          targetTemp: row.targetTemp || 26,
          executeTime: row.executeTime,
          remark: row.remark || "",
        };
        this.dialogVisible = true;
        this.$nextTick(() => {
          this.$refs.editForm && this.$refs.editForm.clearValidate();
        });
      },
  
      // 保存
      handleSave() {
        this.$refs.editForm.validate((valid) => {
          if (valid) {
            this.submitting = true;
            
            // 模拟API调用
            setTimeout(() => {
              this.$message.success(this.editForm.id ? "修改成功" : "新增成功");
              this.dialogVisible = false;
              this.submitting = false;
              // 刷新数据
              this.generateTableData();
            }, 1000);
          }
        });
      },
  
      // 执行/停止操作
      handleExecute(row) {
        const action = row.commandStatus == 0 ? "执行" : "停止";
        this.$message.info(`${action}定时任务功能开发中...`);
      },
  
      // 查看详情
      handleView(row) {
        this.$message.info("查看详情功能开发中...");
      },
  
      // 删除定时
      handleDelete(row) {
        this.$message.info("删除定时任务功能开发中...");
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
  
  // 自定义状态点样式
  .status-dot {
    &.pending {
      background: #909399;
    }
    &.executing {
      background: #3370ff;
    }
    &.completed {
      background: #67c23a;
    }
    &.failed {
      background: #f56c6c;
    }
    &.time-lock {
      background: #3370ff;
    }
    &.temp-lock {
      background: #e6a23c;
    }
    &.power-lock {
      background: #909399;
    }
  }
  
  .temp-text {
    color: #e6a23c;
    font-weight: 500;
  }
  </style>