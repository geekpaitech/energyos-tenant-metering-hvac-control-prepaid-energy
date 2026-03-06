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
                    <!-- 车辆类型选项 -->
                    <template v-if="field.prop === 'vehicleType'">
                      <el-option label="全部" value="" />
                      <el-option label="小型车" value="small" />
                      <el-option label="中型车" value="medium" />
                      <el-option label="大型车" value="large" />
                      <el-option label="新能源车" value="electric" />
                    </template>
                    <!-- 停车状态选项 -->
                    <template v-else-if="field.prop === 'parkingStatus'">
                      <el-option label="全部" value="" />
                      <el-option label="停车中" value="parking" />
                      <el-option label="已离场" value="left" />
                      <el-option label="超时" value="overtime" />
                    </template>
                    <!-- 停车区域选项 -->
                    <template v-else-if="field.prop === 'parkingArea'">
                      <el-option label="全部" value="" />
                      <el-option
                        v-for="area in parkingAreas"
                        :key="area.areaCode"
                        :label="area.areaName"
                        :value="area.areaCode"
                      />
                    </template>
                    <!-- 计费类型选项 -->
                    <template v-else-if="field.prop === 'feeType'">
                      <el-option label="全部" value="" />
                      <el-option label="临时停车" value="temporary" />
                      <el-option label="月租停车" value="monthly" />
                      <el-option label="免费停车" value="free" />
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
                <el-button
                  type="primary"
                  icon="el-icon-plus"
                  size="small"
                  @click="handleAdd"
                >
                  新增计费记录
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
                <!-- 车牌号 -->
                <template v-if="col.key === 'plateNumber'">
                  <span style="color: #409EFF; cursor: pointer; font-weight: 500;" @click="handleVehicleDetail(scope.row)">
                    {{ scope.row.plateNumber || "-" }}
                  </span>
                </template>
  
                <!-- 车辆类型 -->
                <template v-else-if="col.key === 'vehicleTypeLabel'">
                  <el-tag
                    :type="getVehicleTypeTagType(scope.row.vehicleType)"
                    size="small"
                  >
                    {{ getVehicleTypeLabel(scope.row.vehicleType) }}
                  </el-tag>
                </template>
  
                <!-- 停车区域 -->
                <template v-else-if="col.key === 'parkingAreaName'">
                  <span style="color: #000;" @click="handleAreaDetail(scope.row)">
                    {{ scope.row.parkingAreaName || "-" }}
                  </span>
                </template>
  
                <!-- 停车状态 -->
                <template v-else-if="col.key === 'parkingStatusLabel'">
                  <el-tag
                    :type="getParkingStatusTagType(scope.row.parkingStatus)"
                    size="small"
                  >
                    {{ getParkingStatusLabel(scope.row.parkingStatus) }}
                  </el-tag>
                </template>
  
                <!-- 计费类型 -->
                <template v-else-if="col.key === 'feeTypeLabel'">
                  <el-tag
                    :type="getFeeTypeTagType(scope.row.feeType)"
                    size="small"
                    effect="plain"
                  >
                    {{ getFeeTypeLabel(scope.row.feeType) }}
                  </el-tag>
                </template>
  
                <!-- 停车费用显示 -->
                <template v-else-if="col.key === 'totalFee'">
                  <span class="fee-text" style="color: #E6A23C; font-weight: 500;">
                    {{ scope.row.totalFee ? '¥' + parseFloat(scope.row.totalFee).toFixed(2) : '-' }}
                  </span>
                </template>
  
                <!-- 停车时长 -->
                <template v-else-if="col.key === 'parkingDuration'">
                  <span style="color: #67C23A; font-weight: 500;">
                    {{ scope.row.parkingDuration || '-' }}
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
              width="160"
              fixed="right"
              align="center"
            >
              <template slot-scope="scope">
                <el-button
                  type="text"
                  size="mini"
                  icon="el-icon-view"
                  @click="handleDetail(scope.row)"
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
  
      <!-- 编辑弹窗 -->
      <el-dialog
        :title="editForm.id ? '编辑计费记录' : '新增计费记录'"
        :visible.sync="dialogVisible"
        width="800px"
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
              <el-form-item label="车牌号" prop="plateNumber">
                <el-input
                  v-model="editForm.plateNumber"
                  placeholder="请输入车牌号"
                  :disabled="!!editForm.id"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="车辆类型" prop="vehicleType">
                <el-select
                  v-model="editForm.vehicleType"
                  placeholder="请选择车辆类型"
                  style="width: 100%"
                >
                  <el-option label="小型车" value="small" />
                  <el-option label="中型车" value="medium" />
                  <el-option label="大型车" value="large" />
                  <el-option label="新能源车" value="electric" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="停车区域" prop="parkingArea">
                <el-select
                  v-model="editForm.parkingArea"
                  placeholder="请选择停车区域"
                  style="width: 100%"
                >
                  <el-option
                    v-for="area in parkingAreas"
                    :key="area.areaCode"
                    :label="area.areaName"
                    :value="area.areaCode"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="计费类型" prop="feeType">
                <el-select
                  v-model="editForm.feeType"
                  placeholder="请选择计费类型"
                  style="width: 100%"
                >
                  <el-option label="临时停车" value="temporary" />
                  <el-option label="月租停车" value="monthly" />
                  <el-option label="免费停车" value="free" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="入场时间" prop="entryTime">
                <el-date-picker
                  v-model="editForm.entryTime"
                  type="datetime"
                  placeholder="选择入场时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="出场时间" prop="exitTime">
                <el-date-picker
                  v-model="editForm.exitTime"
                  type="datetime"
                  placeholder="选择出场时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="停车费用" prop="totalFee">
                <el-input-number
                  v-model="editForm.totalFee"
                  :precision="2"
                  placeholder="请输入停车费用"
                  style="width: 100%"
                />
                <span style="margin-left: 8px; color: #909399;">元</span>
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
  
      <!-- 详情弹窗 -->
      <el-dialog
        title="停车计费详情"
        :visible.sync="detailDialogVisible"
        width="900px"
        :close-on-click-modal="false"
        class="custom-dialog"
      >
        <div class="detail-content" v-if="detailData">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>车牌号：</label>
                <span>{{ detailData.plateNumber }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>车辆类型：</label>
                <span>{{ getVehicleTypeLabel(detailData.vehicleType) }}</span>
              </div>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>停车区域：</label>
                <span>{{ detailData.parkingAreaName }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>车位编号：</label>
                <span>{{ detailData.spaceNumber }}</span>
              </div>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>入场时间：</label>
                <span>{{ detailData.entryTime }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>出场时间：</label>
                <span>{{ detailData.exitTime || '未出场' }}</span>
              </div>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-item">
                <label>停车时长：</label>
                <span class="duration-value">{{ detailData.parkingDuration }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>计费类型：</label>
                <span class="fee-type-value">{{ getFeeTypeLabel(detailData.feeType) }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>停车费用：</label>
                <span class="fee-value">¥{{ parseFloat(detailData.totalFee).toFixed(2) }}</span>
              </div>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>停车状态：</label>
                <span>{{ getParkingStatusLabel(detailData.parkingStatus) }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>创建时间：</label>
                <span>{{ detailData.createTime }}</span>
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
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </el-dialog>
    </div>
  </template>
  
  <script>
  // 模拟API方法
  const mockApi = {
    // 获取停车计费记录列表
    getParkingFeeList: (params) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockData = [];
          const vehicleTypes = ['small', 'medium', 'large', 'electric'];
          const parkingStatuses = ['parking', 'left', 'overtime'];
          const feeTypes = ['temporary', 'monthly', 'free'];
          
          // 停车区域数据
          const parkingAreas = [
            { areaCode: 'CA_B1', areaName: '中心大厦A栋-地下一层', building: '中心大厦A栋', floor: 'B1' },
            { areaCode: 'CA_B2', areaName: '中心大厦A栋-地下二层', building: '中心大厦A栋', floor: 'B2' },
            { areaCode: 'CB_B1', areaName: '创新大厦B栋-地下停车库', building: '创新大厦B栋', floor: 'B1' },
            { areaCode: 'OUTDOOR_01', areaName: '室外停车场-A区', building: '室外停车场', floor: '地面' },
            { areaCode: 'OUTDOOR_02', areaName: '室外停车场-B区', building: '室外停车场', floor: '地面' },
            { areaCode: 'VIP_01', areaName: 'VIP停车区', building: '中心大厦A栋', floor: '1F' },
          ];
          
          // 生成真实车牌号
          const provinces = ['京', '沪', '粤', '苏', '浙', '鲁', '豫', '川', '湘', '鄂'];
          const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
          const numbers = '0123456789';
          
          for (let i = 1; i <= 20; i++) {
            const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
            const parkingStatus = parkingStatuses[Math.floor(Math.random() * parkingStatuses.length)];
            const feeType = feeTypes[Math.floor(Math.random() * feeTypes.length)];
            const area = parkingAreas[Math.floor(Math.random() * parkingAreas.length)];
            
            // 生成车牌号
            const province = provinces[Math.floor(Math.random() * provinces.length)];
            const cityLetter = letters[Math.floor(Math.random() * letters.length)];
            let plateNumber = province + cityLetter;
            for (let j = 0; j < 5; j++) {
              if (Math.random() > 0.5) {
                plateNumber += numbers[Math.floor(Math.random() * numbers.length)];
              } else {
                plateNumber += letters[Math.floor(Math.random() * letters.length)];
              }
            }
            
            // 计算停车时长和费用
            const entryTime = new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000);
            const exitTime = parkingStatus === 'parking' ? null : new Date(entryTime.getTime() + Math.random() * 24 * 60 * 60 * 1000);
            const durationHours = exitTime ? (exitTime - entryTime) / (1000 * 60 * 60) : (Date.now() - entryTime) / (1000 * 60 * 60);
            const duration = `${Math.floor(durationHours)}小时${Math.floor((durationHours % 1) * 60)}分钟`;
            
            let totalFee = 0;
            if (feeType === 'temporary') {
              totalFee = Math.max(5, Math.floor(durationHours) * 8); // 临时停车8元/小时，最低5元
            } else if (feeType === 'monthly') {
              totalFee = 300; // 月租300元
            } else {
              totalFee = 0; // 免费停车
            }
            
            mockData.push({
              id: i,
              plateNumber: plateNumber,
              vehicleType: vehicleType,
              parkingArea: area.areaCode,
              parkingAreaName: area.areaName,
              building: area.building,
              floor: area.floor,
              spaceNumber: `${area.areaCode}-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
              parkingStatus: parkingStatus,
              feeType: feeType,
              entryTime: entryTime.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              }),
              exitTime: exitTime ? exitTime.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              }) : null,
              parkingDuration: duration,
              totalFee: totalFee.toFixed(2),
              createTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              }),
              remark: Math.random() > 0.7 ? `${area.areaName}正常停车` : '',
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
  
    // 获取停车区域列表
    getParkingAreas: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const parkingAreas = [
            { areaCode: 'CA_B1', areaName: '中心大厦A栋-地下一层', building: '中心大厦A栋', floor: 'B1' },
            { areaCode: 'CA_B2', areaName: '中心大厦A栋-地下二层', building: '中心大厦A栋', floor: 'B2' },
            { areaCode: 'CB_B1', areaName: '创新大厦B栋-地下停车库', building: '创新大厦B栋', floor: 'B1' },
            { areaCode: 'OUTDOOR_01', areaName: '室外停车场-A区', building: '室外停车场', floor: '地面' },
            { areaCode: 'OUTDOOR_02', areaName: '室外停车场-B区', building: '室外停车场', floor: '地面' },
            { areaCode: 'VIP_01', areaName: 'VIP停车区', building: '中心大厦A栋', floor: '1F' },
          ];
          
          resolve({
            code: 200,
            data: parkingAreas
          });
        }, 300);
      });
    }
  };
  
  export default {
    name: "ParkingFee",
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
          plateNumber: "",
          vehicleType: "",
          parkingArea: "",
          parkingStatus: "",
          feeType: "",
          entryTimeRange: "",
        },
        // 搜索字段配置
        searchFields: {
          basic: [
            { prop: "plateNumber", label: "车牌号", type: "input" },
            { prop: "vehicleType", label: "车辆类型", type: "select" },
            { prop: "parkingStatus", label: "停车状态", type: "select" },
            { prop: "feeType", label: "计费类型", type: "select" },
            { prop: "entryTimeRange", label: "入场时间", type: "daterange" },
          ],
          advanced: [],
        },
        // 停车区域列表数据
        parkingAreas: [],
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
        detailDialogVisible: false,
        // 编辑表单
        editForm: {
          id: "",
          plateNumber: "",
          vehicleType: "",
          parkingArea: "",
          feeType: "",
          entryTime: "",
          exitTime: "",
          totalFee: null,
          remark: "",
        },
        // 详情数据
        detailData: null,
        // 表单验证规则
        rules: {
          plateNumber: [
            { required: true, message: "请输入车牌号", trigger: "blur" },
            { pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1}$/, message: "请输入正确的车牌号格式", trigger: "blur" },
          ],
          vehicleType: [
            { required: true, message: "请选择车辆类型", trigger: "change" },
          ],
          parkingArea: [
            { required: true, message: "请选择停车区域", trigger: "change" },
          ],
          feeType: [
            { required: true, message: "请选择计费类型", trigger: "change" },
          ],
          entryTime: [
            { required: true, message: "请选择入场时间", trigger: "change" },
          ],
        },
        // 表格列配置
        tableKey: [
          {
            label: "车牌号",
            key: "plateNumber",
            checked: true,
            disabled: true,
          },
          {
            label: "车辆类型",
            key: "vehicleTypeLabel",
            checked: true,
          },
          {
            label: "停车区域",
            key: "parkingAreaName",
            checked: true,
          },
          {
            label: "车位编号",
            key: "spaceNumber",
            checked: true,
          },
          {
            label: "入场时间",
            key: "entryTime",
            checked: true,
          },
          {
            label: "停车时长",
            key: "parkingDuration",
            checked: true,
          },
          {
            label: "计费类型",
            key: "feeTypeLabel",
            checked: true,
          },
          {
            label: "停车费用",
            key: "totalFee",
            checked: true,
          },
          {
            label: "停车状态",
            key: "parkingStatusLabel",
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
      this.getParkingAreas();
    },
  
    methods: {
      // 获取车辆类型标签类型
      getVehicleTypeTagType(type) {
        const typeMap = {
          'small': 'primary',
          'medium': 'success',
          'large': 'warning',
          'electric': 'info'
        };
        return typeMap[type] || 'info';
      },
  
      // 获取车辆类型标签文本
      getVehicleTypeLabel(type) {
        const typeMap = {
          'small': '小型车',
          'medium': '中型车',
          'large': '大型车',
          'electric': '新能源车'
        };
        return typeMap[type] || type;
      },
  
      // 获取停车状态标签类型
      getParkingStatusTagType(status) {
        const statusMap = {
          'parking': 'success',
          'left': 'info',
          'overtime': 'danger'
        };
        return statusMap[status] || 'info';
      },
  
      // 获取停车状态标签文本
      getParkingStatusLabel(status) {
        const statusMap = {
          'parking': '停车中',
          'left': '已离场',
          'overtime': '超时'
        };
        return statusMap[status] || status;
      },
  
      // 获取计费类型标签类型
      getFeeTypeTagType(type) {
        const typeMap = {
          'temporary': 'warning',
          'monthly': 'success',
          'free': 'info'
        };
        return typeMap[type] || 'info';
      },
  
      // 获取计费类型标签文本
      getFeeTypeLabel(type) {
        const typeMap = {
          'temporary': '临时停车',
          'monthly': '月租停车',
          'free': '免费停车'
        };
        return typeMap[type] || type;
      },
  
      // 获取停车区域列表
      async getParkingAreas() {
        try {
          const response = await mockApi.getParkingAreas();
          if (response.code === 200) {
            this.parkingAreas = response.data || [];
          }
        } catch (error) {
          console.error("获取停车区域列表失败:", error);
          this.parkingAreas = [];
        }
      },
  
      // 获取停车计费记录列表数据
      async fetchTableData() {
        this.loading = true;
        try {
          const params = {
            plateNumber: this.queryData.plateNumber,
            vehicleType: this.queryData.vehicleType,
            parkingArea: this.queryData.parkingArea,
            parkingStatus: this.queryData.parkingStatus,
            feeType: this.queryData.feeType,
            entryTimeRange: this.queryData.entryTimeRange,
            page: {
              current: this.pageData.current,
              size: this.pageData.size,
              orders: [{ asc: false, column: "entryTime" }],
            },
          };
  
          const response = await mockApi.getParkingFeeList(params);
  
          if (response.code === 200 && response.data) {
            this.tableData = response.data.dataList || [];
            this.pageData.total = response.data.total || 0;
          } else {
            this.$message.error(response.msg || "获取数据失败");
          }
        } catch (error) {
          this.$message.error("获取停车计费数据失败");
          console.error("获取停车计费数据失败:", error);
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
          plateNumber: "",
          vehicleType: "",
          parkingArea: "",
          parkingStatus: "",
          feeType: "",
          entryTimeRange: "",
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
  
      // 新增计费记录
      handleAdd() {
        this.editForm = {
          id: "",
          plateNumber: "",
          vehicleType: "",
          parkingArea: "",
          feeType: "",
          entryTime: "",
          exitTime: "",
          totalFee: null,
          remark: "",
        };
        this.dialogVisible = true;
        this.$nextTick(() => {
          this.$refs.editForm && this.$refs.editForm.clearValidate();
        });
      },
  
      // 编辑计费记录
      handleEdit(row) {
        this.editForm = {
          id: row.id,
          plateNumber: row.plateNumber,
          vehicleType: row.vehicleType,
          parkingArea: row.parkingArea,
          feeType: row.feeType,
          entryTime: new Date(row.entryTime),
          exitTime: row.exitTime ? new Date(row.exitTime) : null,
          totalFee: parseFloat(row.totalFee),
          remark: row.remark,
        };
        this.dialogVisible = true;
        this.$nextTick(() => {
          this.$refs.editForm && this.$refs.editForm.clearValidate();
        });
      },
  
      // 保存
      async handleSave() {
        this.$refs.editForm.validate(async (valid) => {
          if (valid) {
            this.submitting = true;
            try {
              // 模拟API调用
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              this.$message.success(this.editForm.id ? "修改成功" : "新增成功");
              this.dialogVisible = false;
              this.fetchTableData();
            } catch (error) {
              this.$message.error("操作失败");
              console.error("保存失败:", error);
            } finally {
              this.submitting = false;
            }
          }
        });
      },
  
      // 查看详情
      handleDetail(row) {
        this.detailData = row;
        this.detailDialogVisible = true;
      },
  
      // 删除计费记录
      handleDelete(row) {
        this.$confirm(`确定要删除车牌号"${row.plateNumber}"的计费记录吗？`, '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          // 模拟API调用
          setTimeout(() => {
            this.$message.success('删除成功');
            this.fetchTableData();
          }, 300);
        }).catch(() => {
          // 用户取消操作
        });
      },
  
      // 车辆详情
      handleVehicleDetail(row) {
        this.$message.info(`查看车辆详情: ${row.plateNumber}`);
      },
  
      // 区域详情
      handleAreaDetail(row) {
        this.$message.info(`查看停车区域详情: ${row.parkingAreaName}`);
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
  .fee-text {
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
      
      .duration-value {
        color: #67C23A;
        font-weight: 500;
      }
      
      .fee-type-value {
        color: #E6A23C;
        font-weight: 500;
      }
      
      .fee-value {
        color: #F56C6C;
        font-weight: 500;
        font-size: 16px;
      }
    }
  }
  
  .text-danger {
    color: #F56C6C !important;
  }
  
  .text-muted {
    color: #909399;
  }
  </style>