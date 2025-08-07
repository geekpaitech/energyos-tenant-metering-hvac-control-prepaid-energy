<template>
  <div class="parking-device-management">
    <!-- 系统头部 -->
    <div class="page-header">
      <div class="header-content">
        <h2>
          <i class="el-icon-s-grid"></i>
          车位设备管理
        </h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>物联中台</el-breadcrumb-item>
          <el-breadcrumb-item>设备管理</el-breadcrumb-item>
          <el-breadcrumb-item>车位设备</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-label">设备总数</span>
          <span class="stat-value">{{ totalDevices }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">在线设备</span>
          <span class="stat-value online">{{ onlineDevices }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">离线设备</span>
          <span class="stat-value offline">{{ offlineDevices }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">故障告警</span>
          <span class="stat-value warning">{{ faultDevices }}</span>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索车位编号、设备ID、MAC地址"
          prefix-icon="el-icon-search"
          clearable
          style="width: 300px"
        >
        </el-input>
        <el-select
          v-model="filterFloor"
          placeholder="选择楼层"
          clearable
          style="width: 120px"
        >
          <el-option label="全部楼层" value=""></el-option>
          <el-option label="B1层" value="B1"></el-option>
          <el-option label="B2层" value="B2"></el-option>
          <el-option label="B3层" value="B3"></el-option>
        </el-select>
        <el-select
          v-model="filterArea"
          placeholder="选择区域"
          clearable
          style="width: 120px"
        >
          <el-option label="全部区域" value=""></el-option>
          <el-option label="A区" value="A"></el-option>
          <el-option label="B区" value="B"></el-option>
          <el-option label="C区" value="C"></el-option>
          <el-option label="VIP区" value="VIP"></el-option>
          <el-option label="充电区" value="CHARGE"></el-option>
        </el-select>
        <el-select
          v-model="filterType"
          placeholder="车位类型"
          clearable
          style="width: 120px"
        >
          <el-option label="全部类型" value=""></el-option>
          <el-option label="普通车位" value="normal"></el-option>
          <el-option label="VIP车位" value="vip"></el-option>
          <el-option label="充电车位" value="charging"></el-option>
          <el-option label="无障碍车位" value="disabled"></el-option>
        </el-select>
        <el-select
          v-model="filterStatus"
          placeholder="设备状态"
          clearable
          style="width: 120px"
        >
          <el-option label="全部状态" value=""></el-option>
          <el-option label="在线" value="online"></el-option>
          <el-option label="离线" value="offline"></el-option>
          <el-option label="故障" value="fault"></el-option>
        </el-select>
        <el-button type="primary" icon="el-icon-search" @click="handleSearch"
          >查询</el-button
        >
        <el-button icon="el-icon-refresh" @click="resetFilter">重置</el-button>
      </div>
      <div class="filter-right">
        <el-button type="primary" icon="el-icon-plus" @click="handleAddParking"
          >添加车位</el-button
        >
        <el-button icon="el-icon-upload2" @click="handleBatchImport"
          >批量导入</el-button
        >
        <el-button icon="el-icon-download" @click="handleExport"
          >导出数据</el-button
        >
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="parkingCode" label="车位编号" width="120" fixed>
          <template slot-scope="scope">
            <el-tag size="small">{{ scope.row.parkingCode }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="位置信息" width="150">
          <template slot-scope="scope">
            <div class="location-info">
              <span>{{ scope.row.floor }}层-{{ scope.row.area }}区</span>
              <span class="location-desc">{{ scope.row.locationDesc }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="parkingType" label="车位类型" width="100">
          <template slot-scope="scope">
            <el-tag
              :type="getParkingTypeTag(scope.row.parkingType)"
              size="small"
            >
              {{ getParkingTypeText(scope.row.parkingType) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 地磁传感器信息 -->
        <el-table-column label="地磁传感器" width="200">
          <template slot-scope="scope">
            <div v-if="scope.row.magneticSensor" class="device-info">
              <div class="device-id">
                ID: {{ scope.row.magneticSensor.deviceId }}
              </div>
              <div class="device-status">
                <span
                  :class="['status-dot', scope.row.magneticSensor.status]"
                ></span>
                <span>{{
                  getStatusText(scope.row.magneticSensor.status)
                }}</span>
                <el-tag
                  v-if="scope.row.magneticSensor.occupied"
                  type="danger"
                  size="mini"
                  >占用</el-tag
                >
                <el-tag v-else type="success" size="mini">空闲</el-tag>
              </div>
              <div class="device-mac">
                MAC: {{ scope.row.magneticSensor.mac }}
              </div>
            </div>
            <span v-else class="no-device">未绑定</span>
          </template>
        </el-table-column>

        <!-- 车位锁信息 -->
        <el-table-column label="车位锁" width="180">
          <template slot-scope="scope">
            <div v-if="scope.row.parkingLock" class="device-info">
              <div class="device-id">
                ID: {{ scope.row.parkingLock.deviceId }}
              </div>
              <div class="device-status">
                <span
                  :class="['status-dot', scope.row.parkingLock.status]"
                ></span>
                <span>{{ getStatusText(scope.row.parkingLock.status) }}</span>
                <el-tag
                  v-if="scope.row.parkingLock.locked"
                  type="warning"
                  size="mini"
                >
                  <i class="el-icon-lock"></i> 锁定
                </el-tag>
                <el-tag v-else type="success" size="mini">
                  <i class="el-icon-unlock"></i> 解锁
                </el-tag>
              </div>
            </div>
            <span v-else class="no-device">未绑定</span>
          </template>
        </el-table-column>

        <!-- 摄像头信息 -->
        <el-table-column label="摄像头" width="160">
          <template slot-scope="scope">
            <div v-if="scope.row.camera" class="device-info">
              <div class="device-id">ID: {{ scope.row.camera.deviceId }}</div>
              <div class="device-status">
                <span :class="['status-dot', scope.row.camera.status]"></span>
                <span>{{ getStatusText(scope.row.camera.status) }}</span>
              </div>
            </div>
            <span v-else class="no-device">未绑定</span>
          </template>
        </el-table-column>

        <!-- 当前车辆信息 -->
        <el-table-column label="当前车辆" width="140">
          <template slot-scope="scope">
            <div v-if="scope.row.currentVehicle" class="vehicle-info">
              <div class="plate-number">
                {{ scope.row.currentVehicle.plateNumber }}
              </div>
              <div class="park-duration">
                停车{{ scope.row.currentVehicle.duration }}小时
              </div>
            </div>
            <span v-else class="no-vehicle">-</span>
          </template>
        </el-table-column>

        <!-- 数据更新时间 -->
        <el-table-column prop="lastUpdate" label="最后更新" width="160">
          <template slot-scope="scope">
            <span class="update-time">{{ scope.row.lastUpdate }}</span>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="text" @click="handleEdit(scope.row)"
              >编辑</el-button
            >
            <el-button
              size="mini"
              type="text"
              @click="handleBindDevice(scope.row)"
              >绑定设备</el-button
            >
            <el-dropdown trigger="click" style="margin-left: 10px">
              <el-button size="mini" type="text">
                更多<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item @click.native="handleControl(scope.row)"
                  >远程控制</el-dropdown-item
                >
                <el-dropdown-item @click.native="handleHistory(scope.row)"
                  >历史数据</el-dropdown-item
                >
                <el-dropdown-item @click.native="handleMaintenance(scope.row)"
                  >维护记录</el-dropdown-item
                >
                <el-dropdown-item
                  divided
                  @click.native="handleDelete(scope.row)"
                  >删除车位</el-dropdown-item
                >
              </el-dropdown-menu>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        style="margin-top: 20px; text-align: right"
      >
      </el-pagination>
    </div>

    <!-- 添加/编辑车位对话框 -->
    <el-dialog
      :title="editMode ? '编辑车位' : '添加车位'"
      :visible.sync="parkingDialogVisible"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="parkingForm"
        :rules="parkingRules"
        ref="parkingForm"
        label-width="120px"
      >
        <el-tabs v-model="activeTab">
          <!-- 基础信息标签页 -->
          <el-tab-pane label="基础信息" name="basic">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="车位编号" prop="parkingCode">
                  <el-input
                    v-model="parkingForm.parkingCode"
                    placeholder="如: B2-A-001"
                    :disabled="editMode"
                  >
                    <template slot="prepend">
                      <el-select
                        v-model="parkingForm.codePrefix"
                        placeholder="前缀"
                        style="width: 80px"
                        :disabled="editMode"
                      >
                        <el-option label="B1" value="B1"></el-option>
                        <el-option label="B2" value="B2"></el-option>
                        <el-option label="B3" value="B3"></el-option>
                      </el-select>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="车位类型" prop="parkingType">
                  <el-select
                    v-model="parkingForm.parkingType"
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

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="所在楼层" prop="floor">
                  <el-select
                    v-model="parkingForm.floor"
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
                    v-model="parkingForm.area"
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
                    v-model="parkingForm.enabled"
                    active-text="启用"
                    inactive-text="禁用"
                  ></el-switch>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="位置描述" prop="locationDesc">
              <el-input
                v-model="parkingForm.locationDesc"
                type="textarea"
                rows="2"
                placeholder="如：靠近B1层东侧电梯厅，第3排第5个车位"
              ></el-input>
            </el-form-item>

            <el-form-item label="GPS坐标">
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-input
                    v-model="parkingForm.longitude"
                    placeholder="经度"
                  ></el-input>
                </el-col>
                <el-col :span="12">
                  <el-input
                    v-model="parkingForm.latitude"
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
                    v-model="parkingForm.magneticSensorId"
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
              <div v-if="parkingForm.magneticSensorId" class="device-preview">
                <i class="el-icon-success"></i>
                已选择: {{ parkingForm.magneticSensorId }}
                <el-button
                  type="text"
                  size="small"
                  @click="testDevice('magnetic')"
                  >测试连接</el-button
                >
              </div>
            </el-form-item>

            <!-- 车位锁绑定 -->
            <el-form-item label="车位锁">
              <el-row :gutter="10">
                <el-col :span="16">
                  <el-select
                    v-model="parkingForm.parkingLockId"
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
              <div v-if="parkingForm.parkingLockId" class="device-preview">
                <i class="el-icon-success"></i>
                已选择: {{ parkingForm.parkingLockId }}
                <el-button type="text" size="small" @click="testDevice('lock')"
                  >测试升降</el-button
                >
              </div>
            </el-form-item>

            <!-- 摄像头绑定 -->
            <el-form-item label="摄像头">
              <el-row :gutter="10">
                <el-col :span="16">
                  <el-select
                    v-model="parkingForm.cameraId"
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
              <div v-if="parkingForm.cameraId" class="device-preview">
                <i class="el-icon-success"></i>
                已选择: {{ parkingForm.cameraId }}
                <el-button
                  type="text"
                  size="small"
                  @click="testDevice('camera')"
                  >预览画面</el-button
                >
              </div>
            </el-form-item>

            <!-- 充电桩绑定（仅充电车位显示） -->
            <el-form-item
              label="充电桩"
              v-if="parkingForm.parkingType === 'charging'"
            >
              <el-row :gutter="10">
                <el-col :span="16">
                  <el-select
                    v-model="parkingForm.chargingPileId"
                    filterable
                    placeholder="选择或输入设备ID"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="device in availableChargingPiles"
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
                  <el-button @click="scanDevice('charging')"
                    >扫描设备</el-button
                  >
                </el-col>
              </el-row>
            </el-form-item>
          </el-tab-pane>

          <!-- 高级配置标签页 -->
          <el-tab-pane label="高级配置" name="advanced">
            <el-form-item label="数据采集频率">
              <el-radio-group v-model="parkingForm.collectFrequency">
                <el-radio label="realtime">实时</el-radio>
                <el-radio label="1min">1分钟</el-radio>
                <el-radio label="5min">5分钟</el-radio>
                <el-radio label="10min">10分钟</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="告警规则">
              <el-checkbox-group v-model="parkingForm.alarmRules">
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
                v-model="parkingForm.reservable"
                active-text="可预约"
                inactive-text="不可预约"
              ></el-switch>
            </el-form-item>

            <el-form-item
              label="收费标准"
              v-if="parkingForm.parkingType !== 'vip'"
            >
              <el-input
                v-model="parkingForm.hourlyRate"
                placeholder="元/小时"
                style="width: 200px"
              >
                <template slot="append">元/小时</template>
              </el-input>
            </el-form-item>

            <el-form-item label="备注">
              <el-input
                v-model="parkingForm.remark"
                type="textarea"
                rows="3"
                placeholder="其他备注信息"
              ></el-input>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="parkingDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="saveParkingData"
          :loading="saveLoading"
          >保存</el-button
        >
      </div>
    </el-dialog>

    <!-- 设备绑定对话框 -->
    <el-dialog title="绑定设备" :visible.sync="bindDialogVisible" width="600px">
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
      // 统计数据
      totalDevices: 0,
      onlineDevices: 0,
      offlineDevices: 0,
      faultDevices: 0,

      // 搜索和筛选
      searchQuery: "",
      filterFloor: "",
      filterArea: "",
      filterType: "",
      filterStatus: "",

      // 表格数据
      allData: [], // 所有数据
      tableData: [], // 当前页显示的数据
      loading: false,
      multipleSelection: [],

      // 分页
      currentPage: 1,
      pageSize: 10,
      total: 0,

      // 对话框控制
      parkingDialogVisible: false,
      bindDialogVisible: false,
      controlDialogVisible: false,
      editMode: false,
      saveLoading: false,
      activeTab: "basic",

      // 当前操作的车位
      currentParking: {},

      // 表单数据
      parkingForm: {
        parkingCode: "",
        codePrefix: "B2",
        parkingType: "charging",
        floor: "B2",
        area: "A",
        enabled: true,
        locationDesc: "",
        longitude: "",
        latitude: "",
        magneticSensorId: "",
        parkingLockId: "",
        cameraId: "",
        chargingPileId: "",
        collectFrequency: "1min",
        alarmRules: ["offline", "longPark"],
        reservable: false,
        hourlyRate: "",
        remark: "",
      },

      // 表单验证规则
      parkingRules: {
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
      availableChargingPiles: [],

      // 自动刷新定时器
      refreshTimer: null,
    };
  },

  computed: {
    // 根据筛选条件过滤数据
    filteredData() {
      let data = [...this.allData];

      // 搜索过滤
      if (this.searchQuery) {
        data = data.filter(
          (item) =>
            item.parkingCode
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase()) ||
            (item.currentVehicle &&
              item.currentVehicle.plateNumber.includes(this.searchQuery))
        );
      }

      // 楼层过滤
      if (this.filterFloor) {
        data = data.filter((item) => item.floor === this.filterFloor);
      }

      // 区域过滤
      if (this.filterArea) {
        data = data.filter((item) => item.area === this.filterArea);
      }

      // 类型过滤
      if (this.filterType) {
        data = data.filter((item) => item.parkingType === this.filterType);
      }

      // 状态过滤
      if (this.filterStatus) {
        data = data.filter(
          (item) =>
            item.magneticSensor &&
            item.magneticSensor.status === this.filterStatus
        );
      }

      return data;
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
        this.total = newData.length;
        this.updateTableData();
      },
      immediate: true,
    },

    currentPage() {
      this.updateTableData();
    },

    pageSize() {
      this.currentPage = 1;
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
      // 模拟异步加载
      setTimeout(() => {
        this.generateMockData();
        this.updateStatistics();
        this.loading = false;
      }, 500);
    },

    // 生成模拟数据（减少到32条）
    generateMockData() {
      const floors = ["B1", "B2"];
      const areas = ["A", "B", "VIP", "CHARGE"];
      const types = ["normal", "vip", "charging", "disabled"];
      const statuses = ["online", "offline", "fault"];

      const data = [];
      let id = 1;

      // 生成32条模拟数据
      for (let f = 0; f < floors.length; f++) {
        for (let a = 0; a < areas.length; a++) {
          for (let i = 1; i <= 4; i++) {
            const floor = floors[f];
            const area = areas[a];
            const hasLock = area === "VIP" || Math.random() > 0.7;
            const hasCamera =
              area === "VIP" || area === "CHARGE" || Math.random() > 0.8;
            const isOccupied = Math.random() > 0.4;
            const deviceStatus =
              Math.random() > 0.8
                ? "offline"
                : Math.random() > 0.9
                ? "fault"
                : "online";

            data.push({
              id: id++,
              parkingCode: `${floor}-${area}-${String(i).padStart(3, "0")}`,
              floor: floor,
              area: area,
              locationDesc: `第${Math.ceil(i / 2)}排第${((i - 1) % 2) + 1}个`,
              parkingType:
                area === "VIP"
                  ? "vip"
                  : area === "CHARGE"
                  ? "charging"
                  : types[Math.floor(Math.random() * 2)],
              magneticSensor: {
                deviceId: `MAG-${floor}${area}${String(i).padStart(3, "0")}`,
                mac: this.generateMAC(),
                status: deviceStatus,
                occupied: isOccupied,
                battery: Math.floor(Math.random() * 100),
                signal: Math.floor(Math.random() * 100),
              },
              parkingLock: hasLock
                ? {
                    deviceId: `LOCK-${floor}${area}${String(i).padStart(
                      3,
                      "0"
                    )}`,
                    status: deviceStatus,
                    locked: !isOccupied && Math.random() > 0.5,
                  }
                : null,
              camera: hasCamera
                ? {
                    deviceId: `CAM-${floor}${area}${String(i).padStart(
                      2,
                      "0"
                    )}`,
                    status: deviceStatus,
                  }
                : null,
              currentVehicle: isOccupied
                ? {
                    plateNumber: this.generatePlateNumber(),
                    duration: (Math.random() * 24).toFixed(1),
                    entryTime: this.generateEntryTime(),
                  }
                : null,
              lastUpdate: this.formatDateTime(
                new Date(Date.now() - Math.random() * 3600000)
              ),
            });
          }
        }
      }

      this.allData = data;
      this.total = data.length;
    },

    // 更新表格显示数据（分页）
    updateTableData() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      this.tableData = this.filteredData.slice(start, end);
    },

    // 加载可用设备列表
    loadAvailableDevices() {
      // 模拟加载可绑定的设备（减少数量）
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

      for (let i = 1; i <= 4; i++) {
        this.availableChargingPiles.push({
          id: i,
          deviceId: `CHARGE-NEW-${String(i).padStart(4, "0")}`,
          name: `充电桩${i}`,
          mac: this.generateMAC(),
          status: "online",
          firmware: "v2.0.0",
        });
      }
    },

    // 更新统计数据
    updateStatistics() {
      this.totalDevices = this.allData.length;
      this.onlineDevices = 0;
      this.offlineDevices = 0;
      this.faultDevices = 0;

      this.allData.forEach((item) => {
        if (item.magneticSensor) {
          if (item.magneticSensor.status === "online") this.onlineDevices++;
          else if (item.magneticSensor.status === "offline")
            this.offlineDevices++;
          else if (item.magneticSensor.status === "fault") this.faultDevices++;
        }
      });
    },

    // 搜索处理
    handleSearch() {
      this.currentPage = 1;
      this.updateTableData();
      this.$message.success("搜索完成");
    },

    // 重置筛选
    resetFilter() {
      this.searchQuery = "";
      this.filterFloor = "";
      this.filterArea = "";
      this.filterType = "";
      this.filterStatus = "";
      this.currentPage = 1;
      this.updateTableData();
    },

    // 添加车位
    handleAddParking() {
      this.editMode = false;
      this.resetForm();
      
      this.activeTab = "basic";
      this.parkingDialogVisible = true;
    },

    // 编辑车位
    handleEdit(row) {
      this.editMode = true;
      this.currentParking = row;
      // 填充表单数据
      this.parkingForm = {
        parkingCode: row.parkingCode,
        codePrefix: row.floor,
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
      this.parkingDialogVisible = true;
    },

    // 查看详情
    handleView(row) {
      this.$message.info(`查看车位 ${row.parkingCode} 的详细信息`);
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
      )
        .then(() => {
          // 从allData中删除
          const index = this.allData.findIndex((item) => item.id === row.id);
          if (index > -1) {
            this.allData.splice(index, 1);
            this.$message.success("删除成功");
            this.updateStatistics();
            this.updateTableData();
          }
        })
        .catch(() => {});
    },

    // 批量导入
    handleBatchImport() {
      this.$message.info("打开批量导入对话框");
    },

    // 导出数据
    handleExport() {
      this.$message.success("正在导出数据...");
    },

    // 保存车位数据
    saveParkingData() {
  this.$refs.parkingForm.validate((valid) => {
    if (valid) {
      this.saveLoading = true;
      // 模拟保存
      setTimeout(() => {
        if (this.editMode) {
          // 更新现有车位
          const index = this.allData.findIndex(
            (item) => item.id === this.currentParking.id
          );
          if (index > -1) {
            // 编辑模式下，如果修改了楼层，需要更新车位编号
            const updatedParkingCode = this.parkingForm.parkingCode.includes('-') 
              ? this.parkingForm.parkingCode 
              : `${this.parkingForm.floor}-${this.parkingForm.area}-${this.parkingForm.parkingCode}`;
            
            Object.assign(this.allData[index], {
              parkingCode: updatedParkingCode,
              floor: this.parkingForm.floor,
              area: this.parkingForm.area,
              locationDesc: this.parkingForm.locationDesc,
              parkingType: this.parkingForm.parkingType,
              lastUpdate: this.formatDateTime(new Date()),
            });
          }
          this.$message.success("车位信息更新成功");
        } else {
          // 添加新车位到列表
          // 组合完整的车位编号
          let fullParkingCode;
          
          // 检查用户输入的 parkingCode 是否已包含完整格式
          if (this.parkingForm.parkingCode.includes('-')) {
            // 如果用户输入了完整格式（如 A-001），则添加前缀
            fullParkingCode = `${this.parkingForm.codePrefix}-${this.parkingForm.parkingCode}`;
          } else {
            // 如果用户只输入了编号（如 001），则组合完整格式
            fullParkingCode = `${this.parkingForm.codePrefix}-${this.parkingForm.area}-${this.parkingForm.parkingCode}`;
          }
          
          const newParking = {
            id: this.allData.length + 1,
            parkingCode: fullParkingCode,
            floor: this.parkingForm.floor,  // 使用表单中选择的楼层
            area: this.parkingForm.area,    // 使用表单中选择的区域
            locationDesc: this.parkingForm.locationDesc,
            parkingType: this.parkingForm.parkingType,
            magneticSensor: this.parkingForm.magneticSensorId
              ? {
                  deviceId: this.parkingForm.magneticSensorId,
                  mac: this.generateMAC(),
                  status: "online",
                  occupied: false,
                  battery: 100,
                  signal: 100,
                }
              : null,
            parkingLock: this.parkingForm.parkingLockId
              ? {
                  deviceId: this.parkingForm.parkingLockId,
                  status: "online",
                  locked: false,
                }
              : null,
            camera: this.parkingForm.cameraId
              ? {
                  deviceId: this.parkingForm.cameraId,
                  status: "online",
                }
              : null,
            currentVehicle: null,
            lastUpdate: this.formatDateTime(new Date()),
          };
          
          // 添加到数据列表的开头
          this.allData.unshift(newParking);
          this.$message.success(`车位 ${fullParkingCode} 添加成功`);
        }
        
        this.saveLoading = false;
        this.parkingDialogVisible = false;
        this.updateStatistics();
        this.updateTableData();
        
        // 重置表单
        if (!this.editMode) {
          this.resetForm();
        }
      }, 1000);
    }
  });
},

    // 扫描设备
    scanDevice(type) {
      this.$message.info(
        `正在扫描${
          type === "magnetic"
            ? "地磁传感器"
            : type === "lock"
            ? "车位锁"
            : "摄像头"
        }...`
      );
      // 模拟扫描过程
      setTimeout(() => {
        this.$message.success("扫描完成，请在下拉列表中选择设备");
      }, 1500);
    },

    // 测试设备
    testDevice(type) {
      const deviceName =
        type === "magnetic"
          ? "地磁传感器"
          : type === "lock"
          ? "车位锁"
          : "摄像头";
      this.$message.info(`正在测试${deviceName}连接...`);
      setTimeout(() => {
        this.$message.success(`${deviceName}连接正常`);
      }, 1000);
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
        case "charging":
          return this.availableChargingPiles;
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
      };
      return map[type] || "";
    },

    getParkingTypeText(type) {
      const map = {
        normal: "普通",
        vip: "VIP",
        charging: "充电",
        disabled: "无障碍",
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

    resetForm() {
      this.parkingForm = {
        codePrefix: "B2", 
        parkingCode: "",
        floor: "B2", 
        parkingType: "charging",
        area: "A",
        enabled: true,
        locationDesc: "",
        longitude: "",
        latitude: "",
        magneticSensorId: "",
        parkingLockId: "",
        cameraId: "",
        chargingPileId: "",
        collectFrequency: "1min",
        alarmRules: ["offline", "longPark"],
        reservable: false,
        hourlyRate: "",
        remark: "",
      };
      if (this.$refs.parkingForm) {
        this.$refs.parkingForm.clearValidate();
      }
    },

    // 表格选择
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },

    // 分页处理
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
      this.updateTableData();
    },

    handleCurrentChange(val) {
      this.currentPage = val;
      this.updateTableData();
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
      }, 10000); // 改为10秒刷新一次
    },
  },
};
</script>
<style scoped>
/* 整体容器 */
.parking-device-management {
  min-height: 100vh;
  background: #f8fafc;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Microsoft YaHei", sans-serif;
}

/* 页面头部 */
.page-header {
  background: #ffffff;
  border-radius: 8px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-content h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.header-content h2 i {
  font-size: 24px;
  color: #3b82f6;
}

/* 面包屑导航 */
.el-breadcrumb {
  font-size: 14px;
}

.el-breadcrumb ::v-deep .el-breadcrumb__inner {
  color: #6b7280 !important;
  font-weight: 400;
}

.el-breadcrumb ::v-deep .el-breadcrumb__inner:hover {
  color: #3b82f6 !important;
}

.el-breadcrumb ::v-deep .el-breadcrumb__separator {
  color: #d1d5db !important;
  font-weight: 400;
}

/* 统计卡片 */
.header-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.2s ease;
}

.stat-item:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 400;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.stat-value.online {
  color: #10b981;
}

.stat-value.offline {
  color: #6b7280;
}

.stat-value.warning {
  color: #f59e0b;
}

/* 筛选栏 */
.filter-bar {
  background: #ffffff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 输入框样式 */
.filter-bar ::v-deep .el-input__inner {
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #111827;
  height: 32px;
  border-radius: 6px;
  font-size: 14px;
}

.filter-bar ::v-deep .el-input__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
}

.filter-bar ::v-deep .el-input__inner::placeholder {
  color: #9ca3af;
}

.filter-bar ::v-deep .el-input__prefix,
.filter-bar ::v-deep .el-input__suffix {
  color: #6b7280;
}

/* 下拉框样式 */
.filter-bar ::v-deep .el-select .el-input__inner {
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #111827;
  font-size: 14px;
}

/* 按钮样式 */
.filter-bar ::v-deep .el-button {
  height: 32px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  padding: 0 12px;
}

.filter-bar ::v-deep .el-button--primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

.filter-bar ::v-deep .el-button--primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.filter-bar ::v-deep .el-button--default {
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.filter-bar ::v-deep .el-button--default:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #111827;
}

/* 表格容器 */
.table-container {
  background: #ffffff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

/* 表格样式 */
.table-container ::v-deep .el-table {
  font-size: 14px;
}

.table-container ::v-deep .el-table::before {
  background-color: #e5e7eb;
}

.table-container ::v-deep .el-table thead {
  color: #374151;
}

.table-container ::v-deep .el-table th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  font-size: 13px;
  padding: 10px 0;
  border-bottom: 1px solid #e5e7eb;
}

.table-container ::v-deep .el-table th.el-table__cell {
  background: #f9fafb;
}

.table-container ::v-deep .el-table tr {
  background: #ffffff;
}

.table-container
  ::v-deep
  .el-table--striped
  .el-table__body
  tr.el-table__row--striped
  td.el-table__cell {
  background: #f9fafb;
}

.table-container ::v-deep .el-table__row:hover > td.el-table__cell {
  background: #f3f4f6 !important;
}

.table-container ::v-deep .el-table td {
  color: #111827;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.table-container ::v-deep .el-table__empty-text {
  color: #6b7280;
}

.table-container ::v-deep .el-table__body-wrapper {
  overflow-x: auto;
}

/* 位置信息 */
.location-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.location-info span:first-child {
  font-weight: 500;
  color: #111827;
  font-size: 13px;
}

.location-desc {
  font-size: 12px;
  color: #6b7280;
}

/* 设备信息 */
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

/* 状态指示器 */
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.online {
  background: #10b981;
}

.status-dot.offline {
  background: #9ca3af;
}

.status-dot.fault {
  background: #f59e0b;
}

/* 无设备提示 */
.no-device {
  color: #9ca3af;
  font-size: 12px;
}

/* 车辆信息 */
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

.no-vehicle {
  color: #d1d5db;
  font-size: 12px;
}

/* 更新时间 */
.update-time {
  font-size: 12px;
  color: #6b7280;
  font-family: "SF Mono", Monaco, "Courier New", monospace;
}

/* 标签样式 */
.table-container ::v-deep .el-tag {
  border-radius: 4px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 500;
  height: 20px;
  line-height: 18px;
}

.table-container ::v-deep .el-tag--small {
  height: 20px;
}

.table-container ::v-deep .el-tag--mini {
  height: 18px;
  padding: 0 4px;
}

.table-container ::v-deep .el-tag--success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.table-container ::v-deep .el-tag--danger {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.table-container ::v-deep .el-tag--warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.table-container ::v-deep .el-tag--info {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.table-container ::v-deep .el-tag i {
  font-size: 10px;
}

/* 操作按钮 */
.table-container ::v-deep .el-button--text {
  color: #3b82f6;
  padding: 2px 4px;
  font-size: 13px;
}

.table-container ::v-deep .el-button--text:hover {
  color: #2563eb;
}

/* 下拉菜单 */
.el-dropdown-menu {
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.el-dropdown-menu__item {
  font-size: 13px;
  color: #374151;
  padding: 6px 16px;
}

.el-dropdown-menu__item:hover {
  background: #f3f4f6;
  color: #111827;
}

.el-dropdown-menu__item--divided::before {
  background: #e5e7eb;
}

/* 分页器 */
.table-container ::v-deep .el-pagination {
  padding: 12px 0 0;
}

.table-container ::v-deep .el-pagination__total {
  color: #6b7280;
  font-size: 13px;
}

.table-container ::v-deep .el-pager li {
  background: #ffffff;
  color: #374151;
  border: 1px solid #e5e7eb;
  font-size: 13px;
  min-width: 28px;
  height: 28px;
  line-height: 26px;
}

.table-container ::v-deep .el-pager li:hover {
  color: #3b82f6;
}

.table-container ::v-deep .el-pager li.active {
  background: #3b82f6;
  color: #ffffff;
  border-color: #3b82f6;
}

.table-container ::v-deep .el-pagination__sizes .el-input__inner {
  font-size: 13px;
  border: 1px solid #e5e7eb;
}

.table-container ::v-deep .el-pagination__jump .el-input__inner {
  font-size: 13px;
  border: 1px solid #e5e7eb;
}

.table-container ::v-deep .el-pagination .btn-prev,
.table-container ::v-deep .el-pagination .btn-next {
  background: #ffffff;
  color: #374151;
  border: 1px solid #e5e7eb;
  font-size: 13px;
  height: 28px;
  line-height: 26px;
}

.table-container ::v-deep .el-pagination .btn-prev:hover,
.table-container ::v-deep .el-pagination .btn-next:hover {
  color: #3b82f6;
}

/* 对话框样式 */
.el-dialog__wrapper ::v-deep .el-dialog {
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.el-dialog__wrapper ::v-deep .el-dialog__header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.el-dialog__wrapper ::v-deep .el-dialog__title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.el-dialog__wrapper ::v-deep .el-dialog__close {
  font-size: 18px;
}

.el-dialog__wrapper ::v-deep .el-dialog__body {
  padding: 20px;
}

.el-dialog__wrapper ::v-deep .el-dialog__footer {
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
}

/* 表单样式 */
.el-form ::v-deep .el-form-item__label {
  color: #374151;
  font-size: 13px;
  font-weight: 500;
}

.el-form ::v-deep .el-input__inner {
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.el-form ::v-deep .el-input__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
}

.el-form ::v-deep .el-input-group__prepend {
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-right: 0;
  color: #374151;
}

.el-form ::v-deep .el-textarea__inner {
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: inherit;
}

.el-form ::v-deep .el-textarea__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
}

/* 选择器样式 */
.el-form ::v-deep .el-select .el-input__inner {
  font-size: 14px;
}

.el-select-dropdown {
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.el-select-dropdown__item {
  font-size: 13px;
  color: #374151;
  padding: 8px 12px;
}

.el-select-dropdown__item:hover {
  background: #f3f4f6;
}

.el-select-dropdown__item.selected {
  color: #3b82f6;
  font-weight: 500;
}

/* 标签页样式 */
.el-tabs ::v-deep .el-tabs__header {
  margin-bottom: 16px;
}

.el-tabs ::v-deep .el-tabs__nav-wrap::after {
  background: #e5e7eb;
}

.el-tabs ::v-deep .el-tabs__item {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  padding: 0 16px;
  height: 36px;
  line-height: 36px;
}

.el-tabs ::v-deep .el-tabs__item:hover {
  color: #374151;
}

.el-tabs ::v-deep .el-tabs__item.is-active {
  color: #3b82f6;
}

.el-tabs ::v-deep .el-tabs__active-bar {
  background: #3b82f6;
  height: 2px;
}

/* 开关样式 */
.el-form ::v-deep .el-switch__core {
  height: 20px;
  width: 40px;
}

.el-form ::v-deep .el-switch__core::after {
  height: 16px;
  width: 16px;
}

.el-form ::v-deep .el-switch.is-checked .el-switch__core {
  background: #3b82f6;
  border-color: #3b82f6;
}

/* 单选框和复选框 */
.el-form ::v-deep .el-radio__label,
.el-form ::v-deep .el-checkbox__label {
  color: #374151;
  font-size: 14px;
  font-weight: 400;
}

.el-form ::v-deep .el-radio__input.is-checked .el-radio__inner {
  background: #3b82f6;
  border-color: #3b82f6;
}

.el-form ::v-deep .el-checkbox__input.is-checked .el-checkbox__inner {
  background: #3b82f6;
  border-color: #3b82f6;
}

.el-form ::v-deep .el-radio-group {
  display: flex;
  gap: 16px;
}

.el-form ::v-deep .el-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

/* 警告框样式 */
.el-alert {
  border-radius: 6px;
  padding: 8px 12px;
}

.el-alert--info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.el-alert__title {
  font-size: 13px;
  color: #1e40af;
}

.el-alert__description {
  font-size: 12px;
  color: #3730a3;
  margin-top: 4px;
}

/* 描述列表 */
.el-descriptions ::v-deep .el-descriptions__label {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 500;
  font-size: 13px;
}

.el-descriptions ::v-deep .el-descriptions__content {
  color: #111827;
  font-size: 13px;
}

.el-descriptions ::v-deep .el-descriptions__cell {
  padding: 8px 12px;
}

/* 设备预览 */
.device-preview {
  margin-top: 8px;
  padding: 6px 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 4px;
  font-size: 12px;
  color: #14532d;
  display: flex;
  align-items: center;
  gap: 6px;
}

.device-preview i {
  font-size: 14px;
  color: #16a34a;
}

.device-preview .el-button--text {
  margin-left: auto;
  font-size: 12px;
}

/* 控制容器 */
.control-container {
  padding: 16px;
}

.control-section {
  margin-top: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.control-section h4 {
  margin: 0 0 12px 0;
  color: #111827;
  font-size: 14px;
  font-weight: 600;
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

/* 按钮组 */
.el-button-group {
  display: inline-flex;
}

.el-button-group .el-button {
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.el-button-group .el-button:first-child {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.el-button-group .el-button:last-child {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: 0;
}

.el-button-group .el-button:not(:first-child):not(:last-child) {
  border-radius: 0;
  border-left: 0;
}

/* 绑定设备容器 */
.bind-device-container {
  padding: 16px;
}

/* Loading样式 */
.el-loading-mask {
  background: rgba(255, 255, 255, 0.9);
}

.el-loading-spinner .path {
  stroke: #3b82f6;
}

.el-loading-spinner .el-loading-text {
  color: #374151;
  font-size: 13px;
}

/* 对话框遮罩 */
.v-modal {
  background: rgba(0, 0, 0, 0.3);
}

/* 响应式设计 */
@media (max-width: 1440px) {
  .header-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    gap: 12px;
  }

  .filter-left,
  .filter-right {
    width: 100%;
    flex-wrap: wrap;
  }

  .header-stats {
    grid-template-columns: 1fr;
  }

  .parking-device-management {
    padding: 8px;
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 性能优化 - 减少动画 */
* {
  animation-duration: 0.2s !important;
  transition-duration: 0.2s !important;
}

/* 提升表格性能 */
.el-table__body-wrapper {
  overflow-y: auto;
  max-height: calc(100vh - 400px);
}

.el-table__fixed {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

.el-table__fixed-right {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}
</style>
