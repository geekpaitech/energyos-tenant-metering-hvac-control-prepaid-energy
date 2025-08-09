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
                  :placeholder="field.placeholder || '请输入'"
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
                  <!-- 楼层选项 -->
                  <template v-if="field.prop === 'floor'">
                    <el-option label="全部楼层" value="" />
                    <el-option label="B1层" value="B1" />
                    <el-option label="B2层" value="B2" />
                    <el-option label="B3层" value="B3" />
                  </template>
                  <!-- 区域选项 -->
                  <template v-else-if="field.prop === 'area'">
                    <el-option label="全部区域" value="" />
                    <el-option label="A区" value="A" />
                    <el-option label="B区" value="B" />
                    <el-option label="C区" value="C" />
                    <el-option label="VIP区" value="VIP" />
                    <el-option label="充电区" value="CHARGE" />
                  </template>
                  <!-- 车位类型选项 -->
                  <template v-else-if="field.prop === 'parkingType'">
                    <el-option label="全部类型" value="" />
                    <el-option label="普通车位" value="normal" />
                    <el-option label="VIP车位" value="vip" />
                    <el-option label="充电车位" value="charging" />
                    <el-option label="无障碍车位" value="disabled" />
                  </template>
                  <!-- 设备状态选项 -->
                  <template v-else-if="field.prop === 'deviceStatus'">
                    <el-option label="全部状态" value="" />
                    <el-option label="在线" value="online">
                      <span class="option-with-dot">
                        <span class="status-dot online"></span>
                        在线
                      </span>
                    </el-option>
                    <el-option label="离线" value="offline">
                      <span class="option-with-dot">
                        <span class="status-dot offline"></span>
                        离线
                      </span>
                    </el-option>
                    <el-option label="故障" value="fault">
                      <span class="option-with-dot">
                        <span class="status-dot fault"></span>
                        故障
                      </span>
                    </el-option>
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
                  >
                    <!-- 占用状态选项 -->
                    <template v-if="field.prop === 'occupiedStatus'">
                      <el-option label="全部状态" value="" />
                      <el-option label="空闲" value="0" />
                      <el-option label="占用" value="1" />
                    </template>
                    <!-- 车位锁状态选项 -->
                    <template v-else-if="field.prop === 'lockStatus'">
                      <el-option label="全部状态" value="" />
                      <el-option label="解锁" value="0" />
                      <el-option label="锁定" value="1" />
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
                新增车位
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
              <!-- 车位编号 -->
              <template v-if="col.key === 'parkingCode'">
                <el-link type="primary" @click="handleMonitor(scope.row)">
                  <i class="el-icon-monitor"></i>
                  {{ scope.row.parkingCode || "-" }}
                </el-link>
              </template>

              <!-- 位置信息 -->
              <template v-else-if="col.key === 'locationInfo'">
                <div class="location-info">
                  <span>{{ scope.row.floor }}层-{{ scope.row.area }}区</span>
                  <span class="location-desc">{{ scope.row.locationDesc }}</span>
                </div>
              </template>

              <!-- 车位类型 -->
              <template v-else-if="col.key === 'parkingTypeLabel'">
                <el-tag
                  :type="getParkingTypeTag(scope.row.parkingType)"
                  size="small"
                  effect="plain"
                >
                  {{ getParkingTypeText(scope.row.parkingType) }}
                </el-tag>
              </template>

              <!-- 地磁传感器信息 -->
              <template v-else-if="col.key === 'magneticSensor'">
                <div v-if="scope.row.magneticSensor" class="device-card">
                  <div class="device-header">
                    <span class="device-title">地磁传感器</span>
                    <el-tag
                      :type="scope.row.magneticSensor.status === 'online' ? 'success' : 
                             scope.row.magneticSensor.status === 'offline' ? 'info' : 'warning'"
                      size="mini"
                    >
                      {{ getStatusText(scope.row.magneticSensor.status) }}
                    </el-tag>
                  </div>
                  <div class="device-content">
                    <div class="device-item">
                      <span class="device-label">ID:</span>
                      <span class="device-value">{{ scope.row.magneticSensor.deviceId }}</span>
                    </div>
                    <div class="device-item">
                      <span class="device-label">MAC:</span>
                      <span class="device-value">{{ scope.row.magneticSensor.mac }}</span>
                    </div>

                  </div>
                </div>
                <div v-else class="no-device">未绑定设备</div>
              </template>

              <!-- 车位锁信息 -->
              <template v-else-if="col.key === 'parkingLock'">
                <div v-if="scope.row.parkingLock" class="device-card">
                  <div class="device-header">
                    <span class="device-title">车位锁</span>
                    <el-tag
                      :type="scope.row.parkingLock.status === 'online' ? 'success' : 
                             scope.row.parkingLock.status === 'offline' ? 'info' : 'warning'"
                      size="mini"
                    >
                      {{ getStatusText(scope.row.parkingLock.status) }}
                    </el-tag>
                  </div>
                  <div class="device-content">
                    <div class="device-item">
                      <span class="device-label">ID:</span>
                      <span class="device-value">{{ scope.row.parkingLock.deviceId }}</span>
                    </div>
                    <div class="device-item">
                      <span class="device-label">状态:</span>
                      <el-tag
                        :type="scope.row.parkingLock.locked ? 'warning' : 'success'"
                        size="mini"
                      >
                        <i :class="scope.row.parkingLock.locked ? 'el-icon-lock' : 'el-icon-unlock'"></i>
                        {{ scope.row.parkingLock.locked ? '锁定' : '解锁' }}
                      </el-tag>
                    </div>
                  </div>
                </div>
                <div v-else class="no-device">未绑定设备</div>
              </template>

              <!-- 摄像头信息 -->
              <template v-else-if="col.key === 'camera'">
                <div v-if="scope.row.camera" class="device-card">
                  <div class="device-header">
                    <span class="device-title">摄像头</span>
                    <el-tag
                      :type="scope.row.camera.status === 'online' ? 'success' : 
                             scope.row.camera.status === 'offline' ? 'info' : 'warning'"
                      size="mini"
                    >
                      {{ getStatusText(scope.row.camera.status) }}
                    </el-tag>
                  </div>
                  <div class="device-content">
                    <div class="device-item">
                      <span class="device-label">ID:</span>
                      <span class="device-value">{{ scope.row.camera.deviceId }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="no-device">未绑定设备</div>
              </template>

              <!-- 占用状态 -->
              <template v-else-if="col.key === 'occupiedStatus'">
                <div class="status-wrapper">
                  <el-tag
                    v-if="scope.row.magneticSensor && scope.row.magneticSensor.occupied"
                    type="danger"
                    size="small"
                  >
                    占用
                  </el-tag>
                  <el-tag v-else type="success" size="small">
                    空闲
                  </el-tag>
                </div>
              </template>

              <!-- 当前车辆信息 -->
              <template v-else-if="col.key === 'currentVehicle'">
                <div v-if="scope.row.currentVehicle" class="vehicle-info">
                  <div class="plate-number">
                    {{ scope.row.currentVehicle.plateNumber }}
                  </div>
                  <div class="park-duration">
                    停车{{ scope.row.currentVehicle.duration }}小时
                  </div>
                </div>
                <span v-else class="text-muted">-</span>
              </template>

              <!-- 设备状态 -->
              <template v-else-if="col.key === 'deviceStatus'">
                <div class="status-wrapper">
                  <span
                    :class="[
                      'status-dot',
                      scope.row.magneticSensor ? scope.row.magneticSensor.status : 'offline',
                    ]"
                  ></span>
                  <span>{{
                    scope.row.magneticSensor 
                      ? getStatusText(scope.row.magneticSensor.status)
                      : '离线'
                  }}</span>
                </div>
              </template>

              <!-- 最后更新时间 -->
              <template v-else-if="col.key === 'lastUpdate'">
                <span class="update-time">{{ scope.row.lastUpdate || "-" }}</span>
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
            width="200"
            fixed="right"
            align="center"
          >
            <template slot-scope="scope">
              <div class="table-actions-group">
                <el-button
                  type="text"
                  size="small"
                  icon="el-icon-setting"
                  @click="handleEdit(scope.row)"
                >
                  编辑
                </el-button>
                <el-divider direction="vertical"></el-divider>
                <el-dropdown
                  trigger="click"
                  @command="handleTableCommand($event, scope.row)"
                >
                  <el-button type="text" size="small">
                    更多
                    <i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="bind-device" icon="el-icon-connection">
                      绑定设备
                    </el-dropdown-item>
                    <el-dropdown-item command="control" icon="el-icon-s-operation">
                      远程控制
                    </el-dropdown-item>
                    <el-dropdown-item command="history" icon="el-icon-document">
                      历史数据
                    </el-dropdown-item>
                    <el-dropdown-item command="maintenance" icon="el-icon-s-tools">
                      维护记录
                    </el-dropdown-item>
                    <el-dropdown-item
                      command="delete"
                      icon="el-icon-delete"
                      divided
                      style="color: #f56c6c"
                    >
                      删除车位
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
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

    <!-- 添加/编辑车位对话框 -->
    <el-dialog
      :title="editForm.id ? '编辑车位' : '新增车位'"
      :visible.sync="dialogVisible"
      width="800px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <el-form
        :model="editForm"
        :rules="editRules"
        ref="editForm"
        label-width="120px"
      >
        <el-tabs v-model="activeTab">
          <!-- 基础信息标签页 -->
          <el-tab-pane label="基础信息" name="basic">
            <el-row :gutter="20" style="margin-top:10px">
              <el-col :span="12">
                <el-form-item label="车位编号" prop="parkingCode">
                  <el-input
                    v-model="editForm.parkingCode"
                    placeholder="请输入编号，如：001"
                    :disabled="!!editForm.id"
                  >
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="车位类型" prop="parkingType">
                  <el-select
                    v-model="editForm.parkingType"
                    placeholder="请选择车位类型"
                    style="width: 100%"
                  >
                    <el-option label="普通车位" value="normal"></el-option>
                    <el-option label="VIP车位" value="vip"></el-option>
                    <el-option label="充电车位" value="charging"></el-option>
                    <el-option label="无障碍车位" value="disabled"></el-option>
                    <el-option label="货车位" value="truck"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top:20px">
              <el-col :span="8">
                <el-form-item label="所在楼层" prop="floor">
                  <el-select
                    v-model="editForm.floor"
                    placeholder="请选择楼层"
                    style="width: 100%"
                  >
                    <el-option label="B1层" value="B1"></el-option>
                    <el-option label="B2层" value="B2"></el-option>
                    <el-option label="B3层" value="B3"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="所在区域" prop="area">
                  <el-select
                    v-model="editForm.area"
                    placeholder="请选择区域"
                    style="width: 100%"
                  >
                    <el-option label="A区" value="A"></el-option>
                    <el-option label="B区" value="B"></el-option>
                    <el-option label="C区" value="C"></el-option>
                    <el-option label="VIP区" value="VIP"></el-option>
                    <el-option label="充电区" value="CHARGE"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="状态" prop="enabled">
                  <el-switch
                    v-model="editForm.enabled"
                    active-text="启用"
                    inactive-text="禁用"
                  ></el-switch>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="位置描述" prop="locationDesc" style="margin-top:20px">
              <el-input
                v-model="editForm.locationDesc"
                type="textarea"
                rows="2"
                placeholder="如：靠近B1层东侧电梯厅，第3排第5个车位"
              ></el-input>
            </el-form-item>

            <el-form-item label="GPS坐标">
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-input
                    v-model="editForm.longitude"
                    placeholder="经度"
                  ></el-input>
                </el-col>
                <el-col :span="12">
                  <el-input
                    v-model="editForm.latitude"
                    placeholder="纬度"
                  ></el-input>
                </el-col>
              </el-row>
            </el-form-item>
          </el-tab-pane>

          <!-- 设备绑定标签页 -->
          <el-tab-pane label="设备绑定" name="device">
            <el-alert
              title="设备绑定说明"
              type="info"
              description="请选择或输入已在系统中注册的设备ID进行绑定。绑定后，系统将自动接收设备上报的数据。"
              show-icon
              :closable="false"
              style="margin-bottom: 20px"
            >
            </el-alert>

            <!-- 地磁传感器绑定 -->
            <el-form-item label="地磁传感器">
              <el-row :gutter="10">
                <el-col :span="16">
                  <el-select
                    v-model="editForm.magneticSensorId"
                    filterable
                    placeholder="选择或输入设备ID"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="device in availableMagneticSensors"
                      :key="device.id"
                      :label="`${device.deviceId} - ${device.name}`"
                      :value="device.deviceId"
                    >
                      <span style="float: left">{{ device.deviceId }}</span>
                      <span
                        style="float: right; color: #8492a6; font-size: 13px"
                        >{{ device.name }}</span
                      >
                    </el-option>
                  </el-select>
                </el-col>
                <el-col :span="8">
                  <el-button @click="scanDevice('magnetic')"
                    >扫描设备</el-button
                  >
                </el-col>
              </el-row>
            </el-form-item>

            <!-- 车位锁绑定 -->
            <el-form-item label="车位锁">
              <el-row :gutter="10">
                <el-col :span="16">
                  <el-select
                    v-model="editForm.parkingLockId"
                    filterable
                    placeholder="选择或输入设备ID"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="device in availableParkingLocks"
                      :key="device.id"
                      :label="`${device.deviceId} - ${device.name}`"
                      :value="device.deviceId"
                    >
                      <span style="float: left">{{ device.deviceId }}</span>
                      <span
                        style="float: right; color: #8492a6; font-size: 13px"
                        >{{ device.name }}</span
                      >
                    </el-option>
                  </el-select>
                </el-col>
                <el-col :span="8">
                  <el-button @click="scanDevice('lock')">扫描设备</el-button>
                </el-col>
              </el-row>
            </el-form-item>

            <!-- 摄像头绑定 -->
            <el-form-item label="摄像头">
              <el-row :gutter="10">
                <el-col :span="16">
                  <el-select
                    v-model="editForm.cameraId"
                    filterable
                    placeholder="选择或输入设备ID"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="device in availableCameras"
                      :key="device.id"
                      :label="`${device.deviceId} - ${device.name}`"
                      :value="device.deviceId"
                    >
                      <span style="float: left">{{ device.deviceId }}</span>
                      <span
                        style="float: right; color: #8492a6; font-size: 13px"
                        >{{ device.name }}</span
                      >
                    </el-option>
                  </el-select>
                </el-col>
                <el-col :span="8">
                  <el-button @click="scanDevice('camera')">扫描设备</el-button>
                </el-col>
              </el-row>
            </el-form-item>
          </el-tab-pane>

          <!-- 高级配置标签页 -->
          <el-tab-pane label="高级配置" name="advanced">
            <el-form-item label="数据采集频率">
              <el-radio-group v-model="editForm.collectFrequency">
                <el-radio label="realtime">实时</el-radio>
                <el-radio label="1min">1分钟</el-radio>
                <el-radio label="5min">5分钟</el-radio>
                <el-radio label="10min">10分钟</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="告警规则">
              <el-checkbox-group v-model="editForm.alarmRules">
                <el-checkbox label="offline">设备离线告警</el-checkbox>
                <el-checkbox label="longPark"
                  >长时间停车告警（超过24小时）</el-checkbox
                >
                <el-checkbox label="abnormal">异常占用告警</el-checkbox>
                <el-checkbox label="lowBattery">设备低电量告警</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="预约设置">
              <el-switch
                v-model="editForm.reservable"
                active-text="可预约"
                inactive-text="不可预约"
              ></el-switch>
            </el-form-item>

            <el-form-item
              label="收费标准"
              v-if="editForm.parkingType !== 'vip'"
            >
              <el-input
                v-model="editForm.hourlyRate"
                placeholder="元/小时"
                style="width: 200px"
              >
                <template slot="append">元/小时</template>
              </el-input>
            </el-form-item>

            <el-form-item label="备注">
              <el-input
                v-model="editForm.remark"
                type="textarea"
                rows="3"
                placeholder="其他备注信息"
              ></el-input>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleSave"
          :loading="submitting"
          >保存</el-button
        >
      </div>
    </el-dialog>

    <!-- 设备绑定对话框 -->
    <el-dialog 
      title="绑定设备" 
      :visible.sync="bindDialogVisible" 
      width="600px"
      class="custom-dialog"
    >
      <div class="bind-device-container">
        <el-alert
          :title="`当前车位: ${currentParking.parkingCode}`"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
        </el-alert>

        <el-form label-width="100px">
          <el-form-item label="设备类型">
            <el-radio-group v-model="bindDeviceType">
              <el-radio label="magnetic">地磁传感器</el-radio>
              <el-radio label="lock">车位锁</el-radio>
              <el-radio label="camera">摄像头</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="设备选择">
            <el-select
              v-model="selectedDeviceId"
              filterable
              placeholder="请选择设备"
              style="width: 100%"
            >
              <el-option
                v-for="device in getAvailableDevices(bindDeviceType)"
                :key="device.id"
                :label="`${device.deviceId} - ${device.name} (${device.status})`"
                :value="device.deviceId"
              >
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="设备信息" v-if="selectedDeviceInfo">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="设备ID">{{
                selectedDeviceInfo.deviceId
              }}</el-descriptions-item>
              <el-descriptions-item label="设备名称">{{
                selectedDeviceInfo.name
              }}</el-descriptions-item>
              <el-descriptions-item label="MAC地址">{{
                selectedDeviceInfo.mac
              }}</el-descriptions-item>
              <el-descriptions-item label="固件版本">{{
                selectedDeviceInfo.firmware
              }}</el-descriptions-item>
              <el-descriptions-item label="当前状态">
                <el-tag
                  :type="
                    selectedDeviceInfo.status === 'online'
                      ? 'success'
                      : 'danger'
                  "
                  size="small"
                >
                  {{ selectedDeviceInfo.status }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer">
        <el-button @click="bindDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBindDevice"
          >确认绑定</el-button
        >
      </div>
    </el-dialog>

    <!-- 远程控制对话框 -->
    <el-dialog
      title="远程控制"
      :visible.sync="controlDialogVisible"
      width="500px"
      class="custom-dialog"
    >
      <div v-if="currentParking" class="control-container">
        <el-descriptions
          :column="1"
          border
          size="small"
          style="margin-bottom: 20px"
        >
          <el-descriptions-item label="车位编号">{{
            currentParking.parkingCode
          }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            {{
              currentParking.magneticSensor &&
              currentParking.magneticSensor.occupied
                ? "占用"
                : "空闲"
            }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentParking.parkingLock" class="control-section">
          <h4>车位锁控制</h4>
          <el-button-group>
            <el-button
              type="primary"
              icon="el-icon-unlock"
              @click="controlLock('up')"
              >升起</el-button
            >
            <el-button
              type="warning"
              icon="el-icon-lock"
              @click="controlLock('down')"
              >降下</el-button
            >
          </el-button-group>
          <div class="control-status">
            当前状态: {{ currentParking.parkingLock.locked ? "锁定" : "解锁" }}
          </div>
        </div>

        <div v-if="currentParking.camera" class="control-section">
          <h4>摄像头控制</h4>
          <el-button icon="el-icon-camera" @click="captureImage"
            >抓拍图像</el-button
          >
          <el-button icon="el-icon-video-camera" @click="viewLiveStream"
            >实时画面</el-button
          >
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "ParkingDeviceManagement",
  data() {
    return {
      // 表格高度配置
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 10,
        paginationHeight: 68,
      },
      
      // 查询参数
      queryData: {
        parkingCode: "",
        meterName: "", // 保持兼容性，实际对应车位名称
        floor: "",
        area: "",
        parkingType: "",
        deviceStatus: "",
        occupiedStatus: "",
        lockStatus: "",
      },

      // 搜索字段配置
      searchFields: {
        basic: [
          { prop: "parkingCode", label: "车位编号", type: "input", placeholder: "请输入车位编号" },
          { prop: "meterName", label: "车位名称", type: "input", placeholder: "请输入车位名称" },
          { prop: "floor", label: "楼层", type: "select" },
          { prop: "area", label: "区域", type: "select" },
          { prop: "parkingType", label: "车位类型", type: "select" },
        ],
        advanced: [
          { prop: "deviceStatus", label: "设备状态", type: "select" },
          { prop: "occupiedStatus", label: "占用状态", type: "select" },
          { prop: "lockStatus", label: "车位锁", type: "select" },
        ],
      },

      // 表格数据
      tableData: [],
      allData: [], // 所有数据
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
      
      // 对话框控制
      dialogVisible: false,
      bindDialogVisible: false,
      controlDialogVisible: false,
      activeTab: "basic",
      
      // 当前操作的车位
      currentParking: {},
      
      // 编辑表单
      editForm: {
        id: "",
        parkingCode: "",
        parkingType: "normal",
        floor: "B2",
        area: "A",
        enabled: true,
        locationDesc: "",
        longitude: "",
        latitude: "",
        magneticSensorId: "",
        parkingLockId: "",
        cameraId: "",
        collectFrequency: "1min",
        alarmRules: ["offline", "longPark"],
        reservable: false,
        hourlyRate: "",
        remark: "",
      },
      
      // 表单验证规则
      editRules: {
        parkingCode: [
          { required: true, message: "请输入车位编号", trigger: "blur" },
          {
            pattern: /^[A-Z0-9\-]+$/,
            message: "车位编号只能包含大写字母、数字和横线",
            trigger: "blur",
          },
        ],
        parkingType: [
          { required: true, message: "请选择车位类型", trigger: "change" },
        ],
        floor: [{ required: true, message: "请选择楼层", trigger: "change" }],
        area: [{ required: true, message: "请选择区域", trigger: "change" }],
      },
      
      // 设备绑定相关
      bindDeviceType: "magnetic",
      selectedDeviceId: "",
      selectedDeviceInfo: null,
      
      // 可用设备列表
      availableMagneticSensors: [],
      availableParkingLocks: [],
      availableCameras: [],
      
      // 表格列配置
      tableKey: [
        {
          label: "车位编号",
          key: "parkingCode",
          width: "150",
          checked: true,
          disabled: true,
        },
        {
          label: "位置信息",
          key: "locationInfo",
          width: "160",
          checked: true,
        },
        {
          label: "车位类型",
          key: "parkingTypeLabel",
          width: "120",
          checked: true,
        },
        {
          label: "地磁传感器",
          key: "magneticSensor",
          width: "200",
          checked: true,
        },
        {
          label: "车位锁",
          key: "parkingLock",
          width: "180",
          checked: true,
        },
        {
          label: "摄像头",
          key: "camera",
          width: "160",
          checked: true,
        },
        {
          label: "占用状态",
          key: "occupiedStatus",
          width: "100",
          checked: true,
        },
        {
          label: "当前车辆",
          key: "currentVehicle",
          width: "140",
          checked: true,
        },
        {
          label: "设备状态",
          key: "deviceStatus",
          width: "120",
          checked: true,
        },
        {
          label: "最后更新",
          key: "lastUpdate",
          width: "160",
          checked: true,
        },
      ],
      
      // 自动刷新定时器
      refreshTimer: null,
    };
  },

  computed: {
    // 计算需要显示的列
    displayColumns() {
      return this.tableKey.filter((col) => col.checked !== false);
    },
    
    // 判断是否需要显示高级筛选按钮
    needAdvancedSearch() {
      const totalFields = this.searchFields.basic.length + this.searchFields.advanced.length;
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
    
    // 根据筛选条件过滤数据
    filteredData() {
      let data = [...this.allData];

      // 搜索过滤
      if (this.queryData.parkingCode) {
        data = data.filter(item =>
          item.parkingCode.toLowerCase().includes(this.queryData.parkingCode.toLowerCase())
        );
      }

      if (this.queryData.meterName) {
        data = data.filter(item =>
          (item.meterName || '').toLowerCase().includes(this.queryData.meterName.toLowerCase())
        );
      }

      // 楼层过滤
      if (this.queryData.floor) {
        data = data.filter(item => item.floor === this.queryData.floor);
      }

      // 区域过滤
      if (this.queryData.area) {
        data = data.filter(item => item.area === this.queryData.area);
      }

      // 类型过滤
      if (this.queryData.parkingType) {
        data = data.filter(item => item.parkingType === this.queryData.parkingType);
      }

      // 设备状态过滤
      if (this.queryData.deviceStatus) {
        data = data.filter(item =>
          item.magneticSensor && item.magneticSensor.status === this.queryData.deviceStatus
        );
      }

      // 占用状态过滤
      if (this.queryData.occupiedStatus) {
        const isOccupied = this.queryData.occupiedStatus === "1";
        data = data.filter(item =>
          item.magneticSensor && item.magneticSensor.occupied === isOccupied
        );
      }

      // 车位锁状态过滤
      if (this.queryData.lockStatus) {
        const isLocked = this.queryData.lockStatus === "1";
        data = data.filter(item =>
          item.parkingLock && item.parkingLock.locked === isLocked
        );
      }

      return data;
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

  watch: {
    selectedDeviceId(val) {
      if (val) {
        const devices = this.getAvailableDevices(this.bindDeviceType);
        this.selectedDeviceInfo = devices.find((d) => d.deviceId === val);
      } else {
        this.selectedDeviceInfo = null;
      }
    },

    // 监听筛选条件变化，更新分页数据
    filteredData: {
      handler(newData) {
        this.pageData.total = newData.length;
        this.updateTableData();
      },
      immediate: true,
    },

    "pageData.current"() {
      this.updateTableData();
    },

    "pageData.size"() {
      this.pageData.current = 1;
      this.updateTableData();
    },
  },

  created() {
    this.initData();
    this.loadAvailableDevices();
    this.startAutoRefresh();
  },

  beforeDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  },

  methods: {
    // 初始化数据
    initData() {
      this.loading = true;
      setTimeout(() => {
        this.generateMockData();
        this.loading = false;
      }, 500);
    },

    // 生成模拟数据
    generateMockData() {
      const floors = ["B1", "B2"];
      const areas = ["A", "B", "VIP", "CHARGE"];
      const types = ["normal", "vip", "charging", "disabled"];
      const statuses = ["online", "offline", "fault"];

      const data = [];
      let id = 1;

      for (let f = 0; f < floors.length; f++) {
        for (let a = 0; a < areas.length; a++) {
          for (let i = 1; i <= 4; i++) {
            const floor = floors[f];
            const area = areas[a];
            const hasLock = area === "VIP" || Math.random() > 0.7;
            const hasCamera = area === "VIP" || area === "CHARGE" || Math.random() > 0.8;
            const isOccupied = Math.random() > 0.4;
            const deviceStatus = Math.random() > 0.8 ? "offline" : Math.random() > 0.9 ? "fault" : "online";

            data.push({
              id: id++,
              parkingCode: `${floor}-${area}-${String(i).padStart(3, "0")}`,
              meterName: `车位${floor}-${area}-${String(i).padStart(3, "0")}`,
              floor: floor,
              area: area,
              locationDesc: `第${Math.ceil(i / 2)}排第${((i - 1) % 2) + 1}个`,
              parkingType: area === "VIP" ? "vip" : area === "CHARGE" ? "charging" : types[Math.floor(Math.random() * 2)],
              magneticSensor: {
                deviceId: `MAG-${floor}${area}${String(i).padStart(3, "0")}`,
                mac: this.generateMAC(),
                status: deviceStatus,
                occupied: isOccupied,
                battery: Math.floor(Math.random() * 100),
                signal: Math.floor(Math.random() * 100),
              },
              parkingLock: hasLock ? {
                deviceId: `LOCK-${floor}${area}${String(i).padStart(3, "0")}`,
                status: deviceStatus,
                locked: !isOccupied && Math.random() > 0.5,
              } : null,
              camera: hasCamera ? {
                deviceId: `CAM-${floor}${area}${String(i).padStart(2, "0")}`,
                status: deviceStatus,
              } : null,
              currentVehicle: isOccupied ? {
                plateNumber: this.generatePlateNumber(),
                duration: (Math.random() * 24).toFixed(1),
                entryTime: this.generateEntryTime(),
              } : null,
              lastUpdate: this.formatDateTime(new Date(Date.now() - Math.random() * 3600000)),
            });
          }
        }
      }

      this.allData = data;
      this.pageData.total = data.length;
    },

    // 更新表格显示数据（分页）
    updateTableData() {
      const start = (this.pageData.current - 1) * this.pageData.size;
      const end = start + this.pageData.size;
      this.tableData = this.filteredData.slice(start, end);
    },

    // 加载可用设备列表
    loadAvailableDevices() {
      for (let i = 1; i <= 10; i++) {
        this.availableMagneticSensors.push({
          id: i,
          deviceId: `MAG-NEW-${String(i).padStart(4, "0")}`,
          name: `地磁传感器${i}`,
          mac: this.generateMAC(),
          status: "online",
          firmware: "v2.1.0",
        });
      }

      for (let i = 1; i <= 8; i++) {
        this.availableParkingLocks.push({
          id: i,
          deviceId: `LOCK-NEW-${String(i).padStart(4, "0")}`,
          name: `智能车位锁${i}`,
          mac: this.generateMAC(),
          status: "online",
          firmware: "v1.5.0",
        });
      }

      for (let i = 1; i <= 5; i++) {
        this.availableCameras.push({
          id: i,
          deviceId: `CAM-NEW-${String(i).padStart(4, "0")}`,
          name: `高清摄像头${i}`,
          mac: this.generateMAC(),
          status: "online",
          firmware: "v3.0.0",
        });
      }
    },

    // 搜索处理
    handleSearch() {
      this.pageData.current = 1;
      this.updateTableData();
      this.$message.success("搜索完成");
    },

    // 重置筛选
    handleReset() {
      this.queryData = {
        parkingCode: "",
        meterName: "",
        floor: "",
        area: "",
        parkingType: "",
        deviceStatus: "",
        occupiedStatus: "",
        lockStatus: "",
      };
      this.showAdvanced = false;
      this.pageData.current = 1;
      this.updateTableData();
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

    // 处理表格下拉命令
    handleTableCommand(command, row) {
      switch (command) {
        case "bind-device":
          this.handleBindDevice(row);
          break;
        case "control":
          this.handleControl(row);
          break;
        case "history":
          this.handleHistory(row);
          break;
        case "maintenance":
          this.handleMaintenance(row);
          break;
        case "delete":
          this.handleDelete(row);
          break;
      }
    },

    // 新增车位
    handleAdd() {
      this.editForm = {
        id: "",
        parkingCode: "",
        parkingType: "normal",
        floor: "B2",
        area: "A",
        enabled: true,
        locationDesc: "",
        longitude: "",
        latitude: "",
        magneticSensorId: "",
        parkingLockId: "",
        cameraId: "",
        collectFrequency: "1min",
        alarmRules: ["offline", "longPark"],
        reservable: false,
        hourlyRate: "",
        remark: "",
      };
      this.activeTab = "basic";
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate();
      });
    },

    // 编辑车位
    handleEdit(row) {
      this.currentParking = row;
      this.editForm = {
        id: row.id,
        parkingCode: row.parkingCode.split('-')[2] || row.parkingCode, // 只取编号部分
        parkingType: row.parkingType,
        floor: row.floor,
        area: row.area,
        enabled: true,
        locationDesc: row.locationDesc,
        magneticSensorId: row.magneticSensor ? row.magneticSensor.deviceId : "",
        parkingLockId: row.parkingLock ? row.parkingLock.deviceId : "",
        cameraId: row.camera ? row.camera.deviceId : "",
        collectFrequency: "1min",
        alarmRules: ["offline", "longPark"],
        reservable: row.parkingType === "vip",
        hourlyRate: "5",
        remark: "",
      };
      this.activeTab = "basic";
      this.dialogVisible = true;
    },

    // 保存车位数据
    handleSave() {
      this.$refs.editForm.validate((valid) => {
        if (valid) {
          this.submitting = true;
          setTimeout(() => {
            if (this.editForm.id) {
              // 更新现有车位
              const index = this.allData.findIndex(item => item.id === this.editForm.id);
              if (index > -1) {
                // 生成完整的车位编号
                const fullParkingCode = `${this.editForm.floor}-${this.editForm.area}-${this.editForm.parkingCode.padStart(3, '0')}`;
                
                Object.assign(this.allData[index], {
                  parkingCode: fullParkingCode,
                  meterName: `车位${fullParkingCode}`,
                  floor: this.editForm.floor,
                  area: this.editForm.area,
                  locationDesc: this.editForm.locationDesc,
                  parkingType: this.editForm.parkingType,
                  lastUpdate: this.formatDateTime(new Date()),
                });
              }
              this.$message.success("车位信息更新成功");
            } else {
              // 添加新车位
              // 生成完整的车位编号
              const fullParkingCode = `${this.editForm.floor}-${this.editForm.area}-${this.editForm.parkingCode.padStart(3, '0')}`;
              
              const newParking = {
                id: this.allData.length + 1,
                parkingCode: fullParkingCode,
                meterName: `车位${fullParkingCode}`,
                floor: this.editForm.floor,
                area: this.editForm.area,
                locationDesc: this.editForm.locationDesc,
                parkingType: this.editForm.parkingType,
                magneticSensor: this.editForm.magneticSensorId ? {
                  deviceId: this.editForm.magneticSensorId,
                  mac: this.generateMAC(),
                  status: "online",
                  occupied: false,
                  battery: 100,
                  signal: 100,
                } : null,
                parkingLock: this.editForm.parkingLockId ? {
                  deviceId: this.editForm.parkingLockId,
                  status: "online",
                  locked: false,
                } : null,
                camera: this.editForm.cameraId ? {
                  deviceId: this.editForm.cameraId,
                  status: "online",
                } : null,
                currentVehicle: null,
                lastUpdate: this.formatDateTime(new Date()),
              };
              
              this.allData.unshift(newParking);
              this.$message.success(`车位 ${fullParkingCode} 添加成功`);
            }
            
            this.submitting = false;
            this.dialogVisible = false;
            this.updateTableData();
          }, 1000);
        }
      });
    },

    // 绑定设备
    handleBindDevice(row) {
      this.currentParking = row;
      this.bindDeviceType = "magnetic";
      this.selectedDeviceId = "";
      this.selectedDeviceInfo = null;
      this.bindDialogVisible = true;
    },

    // 远程控制
    handleControl(row) {
      this.currentParking = row;
      this.controlDialogVisible = true;
    },

    // 历史数据
    handleHistory(row) {
      this.$message.info(`查看车位 ${row.parkingCode} 的历史数据`);
    },

    // 维护记录
    handleMaintenance(row) {
      this.$message.info(`查看车位 ${row.parkingCode} 的维护记录`);
    },

    // 删除车位
    handleDelete(row) {
      this.$confirm(
        `确定要删除车位 ${row.parkingCode} 吗？删除后相关设备绑定关系也将解除。`,
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      ).then(() => {
        const index = this.allData.findIndex((item) => item.id === row.id);
        if (index > -1) {
          this.allData.splice(index, 1);
          this.$message.success("删除成功");
          this.updateTableData();
        }
      }).catch(() => {});
    },

    // 电表监控（保持兼容性）
    handleMonitor(row) {
      this.$router.push({
      path: `/device/parking/detail/${row.id}`,
      query: { 
        name: row.meterName,
        serial: row.serial,
        deviceId: row.id
      }
    });
    },

    // 导出数据
    handleExport() {
      if (this.selectedData.length === 0) {
        this.$message.warning("请先选择要导出的数据");
        return;
      }
      this.$message.success("正在导出数据...");
    },

    // 扫描设备
    scanDevice(type) {
      this.$message.info(
        `正在扫描${
          type === "magnetic" ? "地磁传感器" : type === "lock" ? "车位锁" : "摄像头"
        }...`
      );
      setTimeout(() => {
        this.$message.success("扫描完成，请在下拉列表中选择设备");
      }, 1500);
    },

    // 控制车位锁
    controlLock(action) {
      this.$message.info(`正在${action === "up" ? "升起" : "降下"}车位锁...`);
      setTimeout(() => {
        if (this.currentParking.parkingLock) {
          this.currentParking.parkingLock.locked = action === "down";
          this.$message.success(`车位锁已${action === "up" ? "升起" : "降下"}`);
        }
      }, 1000);
    },

    // 抓拍图像
    captureImage() {
      this.$message.info("正在抓拍图像...");
      setTimeout(() => {
        this.$message.success("图像抓拍成功");
      }, 800);
    },

    // 查看实时画面
    viewLiveStream() {
      this.$message.info("正在连接摄像头...");
    },

    // 获取可用设备列表
    getAvailableDevices(type) {
      switch (type) {
        case "magnetic":
          return this.availableMagneticSensors;
        case "lock":
          return this.availableParkingLocks;
        case "camera":
          return this.availableCameras;
        default:
          return [];
      }
    },

    // 确认绑定设备
    confirmBindDevice() {
      if (!this.selectedDeviceId) {
        this.$message.warning("请选择要绑定的设备");
        return;
      }
      this.$message.success(`设备 ${this.selectedDeviceId} 绑定成功`);
      this.bindDialogVisible = false;
    },

    // 选择变化
    handleSelectionChange(selection) {
      this.selectedData = selection;
    },

    // 分页大小变化
    handleSizeChange(val) {
      this.pageData.size = val;
      this.pageData.current = 1;
      this.updateTableData();
    },

    // 当前页变化
    handleCurrentChange(val) {
      this.pageData.current = val;
      this.updateTableData();
    },

    // 辅助方法
    generateMAC() {
      const hex = "0123456789ABCDEF";
      let mac = "";
      for (let i = 0; i < 6; i++) {
        if (i > 0) mac += ":";
        mac += hex[Math.floor(Math.random() * 16)];
        mac += hex[Math.floor(Math.random() * 16)];
      }
      return mac;
    },

    generatePlateNumber() {
      const provinces = ["京", "沪", "粤", "苏", "浙", "鲁", "川", "渝"];
      const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
      const province = provinces[Math.floor(Math.random() * provinces.length)];
      const letter = letters[Math.floor(Math.random() * letters.length)];
      const numbers = Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, "0");
      return `${province}${letter}·${numbers}`;
    },

    generateEntryTime() {
      const now = new Date();
      const hoursAgo = Math.floor(Math.random() * 24);
      return new Date(now - hoursAgo * 3600000);
    },

    formatDateTime(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    getParkingTypeTag(type) {
      const map = {
        normal: "",
        vip: "warning",
        charging: "success",
        disabled: "info",
        truck: "primary",
      };
      return map[type] || "";
    },

    getParkingTypeText(type) {
      const map = {
        normal: "普通",
        vip: "VIP",
        charging: "充电",
        disabled: "无障碍",
        truck: "货车位",
      };
      return map[type] || type;
    },

    getStatusText(status) {
      const map = {
        online: "在线",
        offline: "离线",
        fault: "故障",
      };
      return map[status] || status;
    },

    // 自动刷新（优化后，只更新少量数据）
    startAutoRefresh() {
      this.refreshTimer = setInterval(() => {
        // 只随机更新1-2个车位状态
        const updateCount = Math.floor(Math.random() * 2) + 1;
        const indices = [];

        // 随机选择要更新的车位
        for (let i = 0; i < updateCount; i++) {
          const randomIndex = Math.floor(Math.random() * this.allData.length);
          if (!indices.includes(randomIndex)) {
            indices.push(randomIndex);
          }
        }

        // 更新选中的车位
        indices.forEach((index) => {
          const item = this.allData[index];
          if (item.magneticSensor) {
            item.magneticSensor.occupied = !item.magneticSensor.occupied;
            if (item.magneticSensor.occupied) {
              item.currentVehicle = {
                plateNumber: this.generatePlateNumber(),
                duration: "0.1",
                entryTime: new Date(),
              };
            } else {
              item.currentVehicle = null;
            }
            item.lastUpdate = this.formatDateTime(new Date());
          }
        });

        // 更新当前页显示
        this.updateTableData();
      }, 10000); // 10秒刷新一次
    },
  },
};
</script>

<style lang="scss" scoped>
// 引入表格页面公共样式
@import "@/assets/styles/table-page.scss";

// 设备卡片样式
.device-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 8px;
  margin: 2px 0;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.device-title {
  font-size: 12px;
  font-weight: 600;
  color: #495057;
}

.device-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.device-label {
  color: #6c757d;
  font-weight: 500;
  min-width: 30px;
}

.device-value {
  color: #212529;
  font-family: "SF Mono", Monaco, "Courier New", monospace;
  font-size: 10px;
}

.no-device {
  color: #6c757d;
  font-size: 12px;
  text-align: center;
  padding: 8px;
  font-style: italic;
}
.location-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  span:first-child {
    font-weight: 500;
    color: #111827;
    font-size: 13px;
  }
}

.location-desc {
  font-size: 12px;
  color: #6b7280;
}

.device-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0;
}

.device-id {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  font-family: "SF Mono", Monaco, "Courier New", monospace;
}

.device-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.device-mac {
  font-size: 11px;
  color: #9ca3af;
  font-family: "SF Mono", Monaco, "Courier New", monospace;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  
  &.online {
    background: #10b981;
  }
  
  &.offline {
    background: #9ca3af;
  }
  
  &.fault {
    background: #f59e0b;
  }
}

.option-with-dot {
  display: flex;
  align-items: center;
  gap: 6px;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.plate-number {
  font-weight: 600;
  color: #2563eb;
  font-size: 13px;
}

.park-duration {
  font-size: 11px;
  color: #6b7280;
}

.update-time {
  font-size: 12px;
  color: #6b7280;
  font-family: "SF Mono", Monaco, "Courier New", monospace;
}

.status-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.text-muted {
  color: #9ca3af;
  font-size: 12px;
}

.control-container {
  padding: 16px;
}

.control-section {
  margin-top: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  
  h4 {
    margin: 0 0 12px 0;
    color: #111827;
    font-size: 14px;
    font-weight: 600;
  }
}

.control-status {
  margin-top: 8px;
  padding: 6px 10px;
  background: #ffffff;
  border-radius: 4px;
  font-size: 12px;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.bind-device-container {
  padding: 16px;
}

// 响应式设计
@media (max-width: 768px) {
  .table-page-container {
    padding: 8px;
  }
}
</style>