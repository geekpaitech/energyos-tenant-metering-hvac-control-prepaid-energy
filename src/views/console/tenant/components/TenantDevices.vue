<template>
  <div class="tenant-devices">
    <!-- 设备类型卡片（横向滚动） -->
    <div class="device-type-cards-wrapper">
      <div class="device-type-cards">
        <!-- 智能电表 -->
        <div class="device-type-card" :class="{ active: activeDeviceType === 'electric' }"
          @click="handleDeviceTypeClick('electric')">
          <div class="card-icon">
            <i class="icon iconfont icon-dianbiao" style="font-size: 26px;"></i>
          </div>
          <div class="card-info">
            <div class="card-title">智能电表</div>
            <div class="card-stats">
              专用 {{ electricMeterCount }} 公摊组 {{ electricGroupCount }}
            </div>
          </div>
        </div>

        <!-- 智能水表 -->
        <div class="device-type-card" :class="{ active: activeDeviceType === 'water' }"
          @click="handleDeviceTypeClick('water')">
          <div class="card-icon">
            <i class="icon iconfont icon-shuibiao" style="font-size: 26px;"></i>
          </div>
          <div class="card-info">
            <div class="card-title">智能水表</div>
            <div class="card-stats">
              专用 {{ waterMeterCount }} 公摊组 {{ waterGroupCount }}
            </div>
          </div>
        </div>

        <!-- 空调 -->
        <div class="device-type-card" :class="{ active: activeDeviceType === 'aircon' }"
          @click="handleDeviceTypeClick('aircon')">
          <div class="card-icon">
            <i class="icon iconfont icon-kongtiao" style="font-size: 26px;"></i>
          </div>
          <div class="card-info">
            <div class="card-title">空调</div>
            <div class="card-stats">专用 {{ airConditionerCount }} 公摊组 {{ airShareGroupCount }}</div>
          </div>
        </div>

        <!-- 照明 -->
        <div class="device-type-card" :class="{ active: activeDeviceType === 'lighting' }"
          @click="handleDeviceTypeClick('lighting')">
          <div class="card-icon">
            <i class="icon iconfont icon-zhaoming1" style="font-size: 26px;"></i>
          </div>
          <div class="card-info">
            <div class="card-title">照明</div>
            <div class="card-stats">灯组 -- 灯 --</div>
          </div>
        </div>

        <!-- 智能门锁 -->
        <div class="device-type-card" :class="{ active: activeDeviceType === 'doorlock' }"
          @click="handleDeviceTypeClick('doorlock')">
          <div class="card-icon">
            <i class="icon iconfont icon-fangjian" style="font-size: 26px;"></i>
          </div>
          <div class="card-info">
            <div class="card-title">智能门锁</div>
            <div class="card-stats">--</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 设备内容区域 -->
    <div class="device-content-area">
      <!-- 智能电表内容 -->
      <template v-if="activeDeviceType === 'electric'">
        <!-- 专用电表 -->
        <div class="device-section">
          <div class="section-header">
            <h4 class="section-title">专用电表</h4>
            <el-button type="primary" size="small" @click="handleBindDevice('electric')">
              绑定/解绑电表
            </el-button>
          </div>

          <div class="table-wrapper limited-height">
            <el-table :data="electricMeters" v-loading="electricLoading" border size="small" :max-height="320"
              key="electric-meters-table" class="device-table" :header-cell-style="{
                background: '#f5f7fa',
                color: '#606266',
                fontWeight: '600',
              }">
              <!-- 序列号 - 黑色可复制 -->
              <el-table-column prop="serial" label="序列号" width="180" align="left">
                <template slot-scope="scope">
                  <span class="serial-copy" @click="handleCopySerial(scope.row.serial)">
                    {{ scope.row.serial || "--" }}
                  </span>
                </template>
              </el-table-column>

              <!-- 设备名称 - 蓝色链接 -->
              <el-table-column prop="meterName" label="设备名称" min-width="120" align="left" show-overflow-tooltip>
                <template slot-scope="scope">
                  <el-link type="primary" @click="handleMeterMonitor(scope.row)">
                    {{ scope.row.meterName || "--" }}
                  </el-link>
                </template>
              </el-table-column>

              <!-- 类型 - 居中 -->
              <el-table-column prop="bindType" label="类型" width="90" align="center">
                <template slot-scope="scope">
                  <el-tag size="mini" :type="scope.row.bindType == 2 ? 'warning' : 'success'">
                    {{ scope.row.bindType == 2 ? '公摊' : '专用' }}
                  </el-tag>
                </template>
              </el-table-column>

              <!-- 付费模式 - 居中 -->
              <el-table-column prop="logicPayType" label="付费模式" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.logicPayType == 0" type="success" size="mini">
                    预付费
                  </el-tag>
                  <el-tag v-else-if="scope.row.logicPayType == 1" type="primary" size="mini">
                    强控
                  </el-tag>
                  <span v-else>--</span>
                </template>
              </el-table-column>

              <!-- 分合闸状态 - 居中 -->
              <el-table-column prop="switchStatus" label="分合闸状态" width="110" align="center">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.switchStatus == 1 ? 'success' : 'info'" size="mini" effect="plain">
                    {{ scope.row.switchStatus == 1 ? "合闸" : "分闸" }}
                  </el-tag>
                </template>
              </el-table-column>

              <!-- 在线状态 - 居中 -->
              <el-table-column prop="onlineStatus" label="在线状态" width="100" align="center">
                <template slot-scope="scope">
                  <div class="status-wrapper">
                    <span :class="['status-dot', scope.row.onlineStatus == 1 ? 'online' : 'offline']"></span>
                    {{ scope.row.onlineStatus == 1 ? "在线" : "离线" }}
                  </div>
                </template>
              </el-table-column>

              <!-- 最新数据时间 -->
              <el-table-column prop="syncTime" label="最新数据时间" width="160" align="center">
                <template slot-scope="scope">
                  {{ formatDate(scope.row.syncTime) }}
                </template>
              </el-table-column>

              <!-- 操作 - 居中 -->
              <el-table-column label="操作" width="140" align="center" fixed="right">
                <template slot-scope="scope">
                  <div class="operation-cell">
                    <!-- 分闸/合闸 - 统一蓝色 -->
                    <el-button type="text" size="mini"
                      @click="handleSwitch(scope.row, scope.row.switchStatus == 1 ? 0 : 1)" class="op-btn primary-btn">
                      <i :class="scope.row.switchStatus == 1 ? 'el-icon-switch-button' : 'el-icon-open'"></i>
                      {{ scope.row.switchStatus == 1 ? "分闸" : "合闸" }}
                    </el-button>

                    <!-- <span class="op-divider">|</span> -->

                    <el-button type="text" size="mini" @click="handleMeterMonitor(scope.row)"
                      class="op-btn primary-btn">
                      详情
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 电表公摊组 -->
        <div class="device-section">
          <div class="section-header">
            <h4 class="section-title">公摊组</h4>
            <el-button type="primary" size="small" @click="handleBindDevice('electricGroup')">
              绑定/解绑公摊组
            </el-button>
          </div>

          <div class="table-wrapper">
            <el-table :data="electricGroups" v-loading="electricGroupLoading" border size="small"
              key="electric-groups-table">
              <el-table-column prop="id" label="公摊组编号" min-width="130" align="center" />
              <el-table-column prop="name" label="公摊组名称" min-width="180" show-overflow-tooltip />
              <el-table-column prop="shareType" label="公摊方式" width="100" align="center">
                <template slot-scope="scope">
                  {{ getShareTypeLabel(scope.row.shareType) }}
                </template>
              </el-table-column>
              <el-table-column prop="deviceCount" label="公摊设备" width="90" align="center">
                <template slot-scope="scope">{{ scope.row.deviceCount || "--" }}</template>
              </el-table-column>
              <el-table-column prop="tenantCount" label="公摊租户" width="90" align="center">
                <template slot-scope="scope">{{ scope.row.tenantCount || "--" }}</template>
              </el-table-column>
              <el-table-column prop="createTime" label="更新时间" width="150" align="center">
                <template slot-scope="scope">
                  {{ formatDate(scope.row.createTime) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </template>

      <!-- 智能水表内容 -->
      <template v-else-if="activeDeviceType === 'water'">
        <!-- 专用水表 -->
        <div class="device-section">
          <div class="section-header">
            <h4 class="section-title">专用水表</h4>
            <el-button type="primary" size="small" @click="handleBindDevice('water')">
              绑定/解绑水表
            </el-button>
          </div>

          <div class="table-wrapper limited-height">
            <el-table :data="waterMeters" v-loading="waterLoading" border size="small" :max-height="320"
              key="water-meters-table" class="device-table" :header-cell-style="{
                background: '#f5f7fa',
                color: '#606266',
                fontWeight: '600',
              }">
              <!-- 序列号 - 黑色可复制 -->
              <el-table-column prop="serial" label="序列号" width="180" align="left">
                <template slot-scope="scope">
                  <span class="serial-copy" @click="handleCopySerial(scope.row.serial)">
                    {{ scope.row.serial || "--" }}
                  </span>
                </template>
              </el-table-column>

              <!-- 设备名称 - 蓝色链接 -->
              <el-table-column prop="waterName" label="设备名称" min-width="180" align="left" show-overflow-tooltip>
                <template slot-scope="scope">
                  <el-link type="primary" @click="handleWaterMonitor(scope.row)">
                    {{ scope.row.waterName || "--" }}
                  </el-link>
                </template>
              </el-table-column>

              <!-- 类型 - 居中 -->
              <el-table-column prop="bindType" label="类型" width="90" align="center">
                <template slot-scope="scope">
                  <el-tag size="mini" type="success">专用</el-tag>
                </template>
              </el-table-column>

              <!-- 水价 - 居中 -->
              <el-table-column prop="waterPriceDto" label="水价" width="120" align="center">
                <template slot-scope="scope">
                  <span v-if="scope.row.waterPriceDto">
                    ¥{{ scope.row.waterPriceDto.price }}/m³
                  </span>
                  <span v-else>--</span>
                </template>
              </el-table-column>

              <!-- 结算方式 - 居中 -->
              <el-table-column prop="settleRate" label="结算方式" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.settleRate === 1 ? 'success' : 'danger'" size="mini" effect="plain">
                    {{ scope.row.settleRate === 1 ? '+ 加算' : '- 减算' }}
                  </el-tag>
                </template>
              </el-table-column>

              <!-- 绑定时间 - 居中 -->
              <el-table-column prop="createTime" label="绑定时间" width="160" align="center">
                <template slot-scope="scope">
                  {{ formatDate(scope.row.createTime) }}
                </template>
              </el-table-column>

              <!-- 操作 - 居中 -->
              <el-table-column label="操作" width="80" align="center" fixed="right">
                <template slot-scope="scope">
                  <el-button type="text" size="mini" @click="handleWaterMonitor(scope.row)" class="op-btn primary-btn">
                    详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 水表公摊组 -->
        <div class="device-section">
          <div class="section-header">
            <h4 class="section-title">公摊组</h4>
            <el-button type="primary" size="small" @click="handleBindDevice('waterGroup')">
              绑定/解绑公摊组
            </el-button>
          </div>

          <div class="table-wrapper">
            <el-table :data="waterGroups" v-loading="waterGroupLoading" border size="small" key="water-groups-table">
              <el-table-column prop="id" label="公摊组编号" min-width="130" align="center" />
              <el-table-column prop="name" label="公摊组名称" min-width="180" show-overflow-tooltip />
              <el-table-column prop="area" label="公摊面积" width="100" align="center">
                <template slot-scope="scope">
                  {{ scope.row.area || "--" }}㎡
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" width="150" align="center">
                <template slot-scope="scope">
                  {{ formatDate(scope.row.createTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="updateTime" label="更新时间" width="150" align="center">
                <template slot-scope="scope">
                  {{ formatDate(scope.row.updateTime) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </template>

      <!-- 空调内容 -->
      <template v-else-if="activeDeviceType === 'aircon'">
        <!-- 专用空调 -->
        <div class="device-section">
          <div class="section-header">
            <h4 class="section-title">专用空调</h4>
            <el-button type="primary" size="small" @click="handleBindDevice('aircon')">
              绑定/解绑空调
            </el-button>
          </div>

          <div class="table-wrapper limited-height">
            <el-table :data="airConditioners" v-loading="airLoading" border size="small" :max-height="320"
              key="air-conditioners-table" class="device-table" :header-cell-style="{
                background: '#f5f7fa',
                color: '#606266',
                fontWeight: '600',
              }">
              <!-- 序列号 - 黑色可复制 -->
              <el-table-column prop="indoorUnitId" label="序列号" width="180" align="left">
                <template slot-scope="scope">
                  <span class="serial-copy" @click="handleCopySerial(scope.row.indoorUnitId)">
                    {{ scope.row.indoorUnitId || "--" }}
                  </span>
                </template>
              </el-table-column>

              <!-- 设备名称 - 蓝色链接 -->
              <el-table-column prop="name" label="设备名称" min-width="180" align="left" show-overflow-tooltip>
                <template slot-scope="scope">
                  <el-link type="primary" @click="handleAirMonitor(scope.row)">
                    {{ scope.row.name || "--" }}
                  </el-link>
                </template>
              </el-table-column>

              <!-- 类型 - 居中 -->
              <el-table-column prop="bindType" label="类型" width="90" align="center">
                <template slot-scope="scope">
                  <el-tag size="mini" :type="scope.row.bindType == 2 ? 'warning' : 'success'">
                    {{ scope.row.bindType == 2 ? '公摊' : '专用' }}
                  </el-tag>
                </template>
              </el-table-column>

              <!-- 在线状态 - 居中 -->
              <el-table-column prop="state" label="在线状态" width="100" align="center">
                <template slot-scope="scope">
                  <div class="status-wrapper">
                    <span :class="['status-dot', scope.row.state === 0 ? 'online' : 'offline']"></span>
                    {{ scope.row.state === 0 ? "在线" : "离线" }}
                  </div>
                </template>
              </el-table-column>

              <!-- 开关状态 - 居中 -->
              <el-table-column prop="powerStatus" label="开关状态" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.powerStatus === 1 ? 'success' : 'info'" size="mini" effect="plain">
                    {{ scope.row.powerStatus === 1 ? "开启" : "关闭" }}
                  </el-tag>
                </template>
              </el-table-column>

              <!-- 运行模式 - 居中 -->
              <el-table-column prop="operationMode" label="运行模式" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag :type="getOperationModeType(scope.row.operationMode)" size="mini" effect="plain">
                    {{ getOperationModeLabel(scope.row.operationMode) }}
                  </el-tag>
                </template>
              </el-table-column>

              <!-- 设定温度 - 居中 -->
              <el-table-column prop="targetTemperature" label="设定温度" width="100" align="center">
                <template slot-scope="scope">
                  <span>{{ scope.row.targetTemperature || "--" }}°C</span>
                </template>
              </el-table-column>

              <!-- 室内温度 - 居中 -->
              <el-table-column prop="roomTemperature" label="室内温度" width="100" align="center">
                <template slot-scope="scope">
                  <span>{{ scope.row.roomTemperature || "--" }}°C</span>
                </template>
              </el-table-column>

              <!-- 操作 - 居中 -->
              <el-table-column label="操作" width="80" align="center" fixed="right">
                <template slot-scope="scope">
                  <el-button type="text" size="mini" @click="handleAirMonitor(scope.row)" class="op-btn primary-btn">
                    详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 空调公摊组 -->
        <div class="device-section">
          <div class="section-header">
            <h4 class="section-title">公摊组</h4>
            <el-button type="primary" size="small" @click="handleBindDevice('airGroup')">
              绑定/解绑公摊组
            </el-button>
          </div>

          <div class="table-wrapper">
            <el-table :data="airShareGroups" v-loading="airShareLoading" border size="small"
              key="air-share-groups-table">
              <el-table-column prop="id" label="公摊组编号" min-width="130" align="center" />
              <el-table-column prop="name" label="公摊组名称" min-width="180" show-overflow-tooltip />
              <el-table-column prop="shareType" label="公摊方式" width="100" align="center">
                <template slot-scope="scope">
                  {{ getAirShareTypeLabel(scope.row.shareType) }}
                </template>
              </el-table-column>
              <el-table-column prop="area" label="实际公摊面积" width="120" align="center">
                <template slot-scope="scope">
                  <div v-if="scope.row.shareType === 'ENERGY'">-</div>
                  <div v-else>{{ scope.row.area }}㎡</div>
                </template>
              </el-table-column>
              <el-table-column prop="airCount" label="公摊设备" width="90" align="center">
                <template slot-scope="scope">{{ scope.row.airCount || "--" }}</template>
              </el-table-column>
              <el-table-column prop="tenantCount" label="公摊租户" width="90" align="center">
                <template slot-scope="scope">{{ scope.row.tenantCount || "--" }}</template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" width="150" align="center">
                <template slot-scope="scope">
                  {{ formatDate(scope.row.createTime) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </template>

      <!-- 其他设备类型 - 暂未开放 -->
      <template v-else>
        <div class="empty-wrapper">
          <el-empty description="暂未开放" :image-size="100" />
        </div>
      </template>
    </div>

    <!-- 设备关联/解绑抽屉 -->
    <el-drawer :title="dialogTitle" :visible.sync="bindDrawerVisible" size="550px" @close="handleDrawerClose">
      <div class="drawer-content" v-loading="drawerLoading">
        <!-- 电表管理 -->
        <template v-if="currentDeviceType === 'electric'">
          <div class="section-title">已绑定电表</div>
          <el-input v-model="boundMeterSearchQuery" placeholder="请输入电表名称或序列号搜索" size="small" clearable
            style="margin-bottom: 12px;"></el-input>
          <div class="meter-list">
            <div v-for="meter in filteredSelectedMeters" :key="meter.id" class="meter-item selected">
              <div class="meter-info">
                <div class="meter-name">{{ meter.meterName }}</div>
                <div class="meter-serial">编号: {{ meter.serial }}</div>
                <div class="meter-status">
                  <el-tag :type="meter.onlineStatus === 1 ? 'success' : 'danger'" size="mini">
                    {{ meter.onlineStatus === 1 ? "在线" : "离线" }}
                  </el-tag>
                  <span class="balance">余额: ¥{{ formatBalance(meter.balance) }}</span>
                </div>
              </div>
              <el-button type="danger" size="mini" @click="handleMeterUnbind(meter)" :loading="meter.unbinding">
                解绑
              </el-button>
            </div>
            <el-empty v-if="selectedMeters.length === 0" description="暂无已绑定的电表" :image-size="60" />
          </div>

          <div class="section-title">可选电表</div>
          <el-input v-model="meterSearchQuery" placeholder="请输入电表名称或序列号搜索" size="small" clearable
            style="margin-bottom: 12px;"></el-input>
          <div class="meter-list">
            <div v-for="meter in filteredSelectableMeters" :key="meter.id" class="meter-item selectable">
              <div class="meter-info">
                <div class="meter-name">{{ meter.meterName }}</div>
                <div class="meter-serial">编号: {{ meter.serial }}</div>
                <div class="meter-status">
                  <el-tag :type="meter.onlineStatus === 1 ? 'success' : 'danger'" size="mini">
                    {{ meter.onlineStatus === 1 ? "在线" : "离线" }}
                  </el-tag>
                  <span class="balance">余额: ¥{{ formatBalance(meter.balance) }}</span>
                </div>
              </div>
              <el-button type="primary" size="mini" @click="handleMeterBind(meter)" :loading="meter.binding">
                绑定
              </el-button>
            </div>
            <el-empty v-if="selectableMeters.length === 0" description="暂无可绑定的电表" :image-size="60" />
          </div>
        </template>

        <!-- 电表公摊组管理 -->
        <template v-if="currentDeviceType === 'electricGroup'">
          <div class="section-title">已绑定公摊组</div>
          <el-input v-model="boundShareSearchQuery" placeholder="请输入公摊组名称搜索" size="small" clearable
            style="margin-bottom: 12px;"></el-input>
          <div class="share-list">
            <div v-for="share in filteredSelectedShares" :key="share.id" class="share-item selected">
              <div class="share-info">
                <div class="share-name">{{ share.name }}</div>
                <div class="share-details">
                  <span class="share-area">面积: {{ share.area }}㎡</span>
                  <el-tag :type="getShareTypeTag(share.shareType)" size="mini">
                    {{ getShareTypeLabel(share.shareType) }}
                  </el-tag>
                </div>
              </div>
              <el-button type="danger" size="mini" @click="handleShareUnbind(share)" :loading="share.unbinding">
                解绑
              </el-button>
            </div>
            <el-empty v-if="selectedShares.length === 0" description="暂无已绑定的公摊组" :image-size="60" />
          </div>

          <div class="section-title">可选公摊组</div>
          <el-input v-model="shareSearchQuery" placeholder="请输入公摊组名称搜索" size="small" clearable
            style="margin-bottom: 12px;"></el-input>
          <div class="share-list">
            <div v-for="share in filteredSelectableShares" :key="share.id" class="share-item selectable">
              <div class="share-info">
                <div class="share-name">{{ share.name }}</div>
                <div class="share-details">
                  <div class="share-area-input">
                    <span>公摊面积:</span>
                    <el-input-number v-model="shareAreaInput[share.id]" :min="0" :precision="2" size="mini"
                      placeholder="请输入" style="width: 100px; margin-left: 8px" />
                    <span style="margin-left: 4px">㎡</span>
                  </div>
                  <el-tag :type="getShareTypeTag(share.shareType)" size="mini">
                    {{ getShareTypeLabel(share.shareType) }}
                  </el-tag>
                </div>
              </div>
              <el-button type="primary" size="mini" @click="handleShareBind(share)" :loading="share.binding"
                :disabled="!shareAreaInput[share.id] || shareAreaInput[share.id] <= 0">
                绑定
              </el-button>
            </div>
            <el-empty v-if="selectableShares.length === 0" description="暂无可绑定的公摊组" :image-size="60" />
          </div>
        </template>

        <!-- 水表管理 -->
        <template v-if="currentDeviceType === 'water'">
          <div class="section-title">已绑定水表</div>
          <el-input v-model="boundWaterSearchQuery" placeholder="请输入水表名称或序列号搜索" size="small" clearable
            style="margin-bottom: 12px;"></el-input>
          <div class="water-list">
            <div v-for="water in filteredSelectedWaters" :key="water.id" class="water-item selected">
              <div class="water-info">
                <div class="water-name">{{ water.waterName }}</div>
                <div class="water-serial">编号: {{ water.serial }}</div>
                <div class="water-details">
                  <el-tag :type="water.bindType == 1 ? 'primary' : water.bindType == 2 ? 'warning' : 'info'"
                    size="mini">
                    {{ water.bindType == 1 ? "专用表" : water.bindType == 2 ? "公摊表" : "公式表" }}
                  </el-tag>
                  <span v-if="water.waterPriceDto" class="price">
                    {{ water.waterPriceDto.name }} (¥{{ water.waterPriceDto.price }}/m³)
                  </span>
                  <span v-else class="price">未设置价格</span>
                  <el-tag :type="water.settleRate === 1 ? 'success' : 'danger'" size="mini" style="margin-left: 8px">
                    {{ water.settleRate === 1 ? "+ 加算" : "- 减算" }}
                  </el-tag>
                </div>
              </div>
              <el-button type="danger" size="mini" @click="handleWaterUnbind(water)" :loading="water.unbinding">
                解绑
              </el-button>
            </div>
            <el-empty v-if="selectedWaters.length === 0" description="暂无已绑定的水表" :image-size="60" />
          </div>

          <div class="section-title">可选水表</div>
          <el-input v-model="waterSearchQuery" placeholder="请输入水表名称或序列号搜索" size="small" clearable
            style="margin-bottom: 12px;"></el-input>
          <div class="water-list">
            <div v-for="water in filteredSelectableWaters" :key="water.id" class="water-item selectable">
              <div class="water-info">
                <div class="water-name">{{ water.waterName }}</div>
                <div class="water-serial">编号: {{ water.serial }}</div>
                <div class="water-details">
                  <el-tag :type="water.bindType == 1 ? 'primary' : water.bindType == 2 ? 'warning' : 'info'"
                    size="mini">
                    {{ water.bindType == 1 ? "专用表" : water.bindType == 2 ? "公摊表" : "公式表" }}
                  </el-tag>
                  <span v-if="water.waterPriceDto" class="price">
                    {{ water.waterPriceDto.name }} (¥{{ water.waterPriceDto.price }}/m³)
                  </span>
                  <span v-else class="price">未设置价格</span>
                </div>
                <div class="settle-rate-input">
                  <span>结算方式:</span>
                  <el-select v-model="waterSettleRates[water.id]" size="mini" style="width: 90px; margin-left: 8px"
                    placeholder="选择">
                    <el-option label="+ 加算" :value="1" />
                    <el-option label="- 减算" :value="-1" />
                  </el-select>
                </div>
              </div>
              <el-button type="primary" size="mini" @click="handleWaterBind(water)" :loading="water.binding"
                :disabled="!waterSettleRates[water.id]">
                绑定
              </el-button>
            </div>
            <el-empty v-if="selectableWaters.length === 0" description="暂无可绑定的水表" :image-size="60" />
          </div>
        </template>

        <!-- 水表公摊组管理 -->
        <template v-if="currentDeviceType === 'waterGroup'">
          <div class="section-title">已绑定水表公摊组</div>
          <el-input v-model="boundWaterShareSearchQuery" placeholder="请输入公摊组名称搜索" size="small" clearable
            style="margin-bottom: 12px;"></el-input>
          <div class="water-share-list">
            <div v-for="share in filteredSelectedWaterShares" :key="share.id" class="water-share-item selected">
              <div class="water-share-info">
                <div class="water-share-name">{{ share.name }}</div>
                <div class="water-share-details">
                  <span class="water-share-area">面积: {{ share.area }}㎡</span>
                  <div class="water-share-time">创建时间: {{ formatDate(share.createTime) }}</div>
                </div>
              </div>
              <el-button type="danger" size="mini" @click="handleWaterShareUnbind(share)" :loading="share.unbinding">
                解绑
              </el-button>
            </div>
            <el-empty v-if="selectedWaterShares.length === 0" description="暂无已绑定的水表公摊组" :image-size="60" />
          </div>

          <div class="section-title">可选水表公摊组</div>
          <el-input v-model="waterShareSearchQuery" placeholder="请输入公摊组名称搜索" size="small" clearable
            style="margin-bottom: 12px;"></el-input>
          <div class="water-share-list">
            <div v-for="share in filteredSelectableWaterShares" :key="share.id" class="water-share-item selectable">
              <div class="water-share-info">
                <div class="water-share-name">{{ share.name }}</div>
                <div class="water-share-details">
                  <div class="water-share-area-input">
                    <span>公摊面积:</span>
                    <el-input-number v-model="waterShareAreaInput[share.id]" :min="0" :precision="2" size="mini"
                      placeholder="请输入" style="width: 100px; margin-left: 8px" />
                    <span style="margin-left: 4px">㎡</span>
                  </div>
                  <div class="water-share-time">创建时间: {{ formatDate(share.createTime) }}</div>
                </div>
              </div>
              <el-button type="primary" size="mini" @click="handleWaterShareBind(share)" :loading="share.binding"
                :disabled="!waterShareAreaInput[share.id] || waterShareAreaInput[share.id] <= 0">
                绑定
              </el-button>
            </div>
            <el-empty v-if="selectableWaterShares.length === 0" description="暂无可绑定的水表公摊组" :image-size="60" />
          </div>
        </template>

        <!-- 空调管理 -->
        <template v-if="currentDeviceType === 'aircon'">
          <div class="section-title">已绑定空调</div>
          <el-input v-model="boundAirSearchQuery" placeholder="请输入空调名称或序列号搜索" size="small" clearable
            style="margin-bottom: 12px;"></el-input>
          <div class="air-list">
            <div v-for="air in filteredSelectedAirs" :key="air.id" class="air-item selected">
              <div class="air-info">
                <div class="air-name">{{ air.name }}</div>
                <div class="air-serial">编号: {{ air.indoorUnitId }}</div>
                <div class="air-status">
                  <el-tag :type="air.state === 0 ? 'success' : 'danger'" size="mini">
                    {{ air.state === 0 ? "在线" : "离线" }}
                  </el-tag>
                  <span class="air-mode">{{ getOperationModeLabel(air.operationMode) }}</span>
                </div>
              </div>
              <el-button type="danger" size="mini" @click="handleAirUnbind(air)" :loading="air.unbinding">
                解绑
              </el-button>
            </div>
            <el-empty v-if="selectedAirs.length === 0" description="暂无已绑定的空调" :image-size="60" />
          </div>

          <div class="section-title">可选空调</div>
          <el-input v-model="airSearchQuery" placeholder="请输入空调名称或序列号搜索" size="small" clearable
            style="margin-bottom: 12px;"></el-input>
          <div class="air-list">
            <div v-for="air in filteredSelectableAirs" :key="air.id" class="air-item selectable">
              <div class="air-info">
                <div class="air-name">{{ air.name }}</div>
                <div class="air-serial">编号: {{ air.indoorUnitId }}</div>
                <div class="air-status">
                  <el-tag :type="air.state === 0 ? 'success' : 'danger'" size="mini">
                    {{ air.state === 0 ? "在线" : "离线" }}
                  </el-tag>
                  <span class="air-mode">{{ getOperationModeLabel(air.operationMode) }}</span>
                </div>
              </div>
              <el-button type="primary" size="mini" @click="handleAirBind(air)" :loading="air.binding">
                绑定
              </el-button>
            </div>
            <el-empty v-if="selectableAirs.length === 0" description="暂无可绑定的空调" :image-size="60" />
          </div>
        </template>

        <!-- 空调公摊组管理 -->
        <template v-if="currentDeviceType === 'airGroup'">
          <div class="section-title">已绑定公摊组</div>
          <el-input v-model="boundAirShareSearchQuery" placeholder="请输入公摊组名称搜索" size="small" clearable
            style="margin-bottom: 12px;"></el-input>
          <div class="air-share-list">
            <div v-for="share in filteredSelectedAirShares" :key="share.id" class="air-share-item selected">
              <div class="air-share-info">
                <div class="air-share-name">{{ share.name }}</div>
                <div class="air-share-details">
                  <span v-if="share.shareType !== 'ENERGY'" class="air-share-area">面积: {{ share.area }}㎡</span>
                  <el-tag :type="getAirShareTypeTag(share.shareType)" size="mini">
                    {{ getAirShareTypeLabel(share.shareType) }}
                  </el-tag>
                </div>
              </div>
              <el-button type="danger" size="mini" @click="handleAirShareUnbind(share)" :loading="share.unbinding">
                解绑
              </el-button>
            </div>
            <el-empty v-if="selectedAirShares.length === 0" description="暂无已绑定的公摊组" :image-size="60" />
          </div>

          <div class="section-title">可选公摊组</div>
          <el-input v-model="airShareSearchQuery" placeholder="请输入公摊组名称搜索" size="small" clearable
            style="margin-bottom: 12px;"></el-input>
          <div class="air-share-list">
            <div v-for="share in filteredSelectableAirShares" :key="share.id" class="air-share-item selectable">
              <div class="air-share-info">
                <div class="air-share-name">{{ share.name }}</div>
                <div class="air-share-details">
                  <div v-if="share.shareType !== 'ENERGY'" class="air-share-area-input">
                    <span>公摊面积:</span>
                    <el-input-number v-model="airShareAreaInput[share.id]" :min="0" :precision="2" size="mini"
                      placeholder="请输入" style="width: 100px; margin-left: 8px" />
                    <span style="margin-left: 4px">㎡</span>
                  </div>
                  <el-tag :type="getAirShareTypeTag(share.shareType)" size="mini">
                    {{ getAirShareTypeLabel(share.shareType) }}
                  </el-tag>
                </div>
              </div>
              <el-button type="primary" size="mini" @click="handleAirShareBind(share)" :loading="share.binding"
                :disabled="share.shareType !== 'ENERGY' && (!airShareAreaInput[share.id] || airShareAreaInput[share.id] <= 0)">
                绑定
              </el-button>
            </div>
            <el-empty v-if="selectableAirShares.length === 0" description="暂无可绑定的公摊组" :image-size="60" />
          </div>
        </template>
      </div>
    </el-drawer>
    <meter-detail-drawer :visible.sync="meterDetailDrawer.visible" :meter-id="meterDetailDrawer.meterId"
      :serial="meterDetailDrawer.serial" />

    <!-- 水表详情抽屉 -->
    <water-detail-drawer :visible.sync="waterDetailDrawer.visible" :water-id="waterDetailDrawer.waterId"
      :serial="waterDetailDrawer.serial" />

    <!-- 空调详情抽屉 -->
    <air-detail-drawer :visible.sync="airDetailDrawer.visible" :device-id="airDetailDrawer.deviceId"
      :row-data="airDetailDrawer.rowData" @edit="handleAirEdit" @refresh="fetchAirConditioners" />

    <!-- 添加编辑弹窗 -->
    <el-dialog title="编辑空调" :visible.sync="airEditDialog.visible" width="600px" :close-on-click-modal="false">
      <el-form ref="airEditForm" :model="airEditForm" label-width="120px">
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="airEditForm.name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备类型" prop="type">
          <el-select v-model="airEditForm.type" placeholder="请选择设备类型" style="width: 100%">
            <el-option label="多联机" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="公摊类型" prop="bindType">
          <el-select v-model="airEditForm.bindType" placeholder="请选择公摊类型" style="width: 100%">
            <el-option label="专用" :value="1" />
            <el-option label="公摊" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="airEditForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="airEditDialog.visible = false">取 消</el-button>
        <el-button type="primary" :loading="airEditDialog.submitting" @click="handleAirEditSave">
          确 定
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  getTenantElectricMeters,
  getTenantMeterBindEdit,
  bindTenantMeter,
  getTenantElectricGroups,
  getTenantShareBindEdit,
  bindShareTenant,
  getTenantWaterBindEdit,
  bindTenantWater,
  getTenantWaterGroups,
  getTenantWaterShareBindEdit,
  bindWaterShareTenant,
  getTenantAirConditioners,
  getTenantAirBindEdit,
  bindTenantAir,
  getTenantAirShareGroups,
  getTenantAirShareBindEdit,
  bindAirShareTenant,
} from "@/api/tenantDetail";

// 导入分闸合闸API
import {
  tenantDoMeterSwitchOffOn,
  meterUpdateLogicPayType
} from "@/api/meter";
import { airInfoUpdateAir } from "@/api/airCondition";
import MeterDetailDrawer from '@/views/console/device/electricity/detail.vue'
import WaterDetailDrawer from '@/views/console/device/watermeter/detail.vue'
import AirDetailDrawer from '@/views/console/device/conditioning/drawer.vue'
export default {
  name: "TenantDevices",

  components: {
    MeterDetailDrawer,
    WaterDetailDrawer,
    AirDetailDrawer,
  },
  props: {
    tenantId: {
      type: [String, Number],
      required: true,
    },
    managerId: {
      type: [String, Number],
      default: "",
    },
  },
  data() {
    return {
      // 空调编辑弹窗
      airEditDialog: {
        visible: false,
        submitting: false,
      },
      airEditForm: {
        id: null,
        indoorUnitId: '',
        name: '',
        type: 1,
        bindType: 1,
        remark: '',
      },
      meterDetailDrawer: {
        visible: false,
        meterId: '',
        serial: ''
      },
      waterDetailDrawer: {
        visible: false,
        waterId: '',
        serial: ''
      },
      airDetailDrawer: {
        visible: false,
        deviceId: '',      // ✅ 改为 deviceId
        rowData: null
      },
      // 搜索关键词
      meterSearchQuery: "",
      boundMeterSearchQuery: "",
      shareSearchQuery: "",
      boundShareSearchQuery: "",
      waterSearchQuery: "",
      boundWaterSearchQuery: "",
      waterShareSearchQuery: "",
      boundWaterShareSearchQuery: "",
      airSearchQuery: "",
      boundAirSearchQuery: "",
      airShareSearchQuery: "",
      boundAirShareSearchQuery: "",

      // 设备类型
      activeDeviceType: "electric", // electric | water | aircon | lighting | doorlock

      // 设备数量（用于卡片显示）
      electricMeterCount: 0,
      electricGroupCount: 0,
      waterMeterCount: 0,
      waterGroupCount: 0,
      airConditionerCount: 0,
      airShareGroupCount: 0,

      // 设备列表
      electricMeters: [],
      electricGroups: [],
      waterMeters: [],
      waterGroups: [],
      airConditioners: [],
      airShareGroups: [],

      // 加载状态
      electricLoading: false,
      electricGroupLoading: false,
      waterLoading: false,
      waterGroupLoading: false,
      airLoading: false,
      airShareLoading: false,

      // 抽屉状态
      bindDrawerVisible: false,
      currentDeviceType: "",
      drawerLoading: false,

      // 电表绑定数据
      selectedMeters: [],
      selectableMeters: [],

      // 电表公摊组绑定数据
      selectedShares: [],
      selectableShares: [],
      shareAreaInput: {},

      // 水表绑定数据
      selectedWaters: [],
      selectableWaters: [],
      waterSettleRates: {},

      // 水表公摊组绑定数据
      selectedWaterShares: [],
      selectableWaterShares: [],
      waterShareAreaInput: {},

      // 空调绑定数据
      selectedAirs: [],
      selectableAirs: [],

      // 空调公摊组绑定数据
      selectedAirShares: [],
      selectableAirShares: [],
      airShareAreaInput: {},
    };
  },
  computed: {
    dialogTitle() {
      const typeMap = {
        electric: "电表关联/解绑",
        electricGroup: "电表公摊组关联/解绑",
        water: "水表关联/解绑",
        waterGroup: "水表公摊组关联/解绑",
        aircon: "空调关联/解绑",
        airGroup: "空调公摊组关联/解绑",
      };
      return typeMap[this.currentDeviceType] || "关联设备";
    },
    // 过滤已绑定电表
    filteredSelectedMeters() {
      if (!this.boundMeterSearchQuery) return this.selectedMeters;
      const query = this.boundMeterSearchQuery.toLowerCase();
      return this.selectedMeters.filter(meter => 
        (meter.meterName && meter.meterName.toLowerCase().includes(query)) ||
        (meter.serial && meter.serial.toLowerCase().includes(query))
      );
    },
    // 过滤可选电表
    filteredSelectableMeters() {
      if (!this.meterSearchQuery) return this.selectableMeters;
      const query = this.meterSearchQuery.toLowerCase();
      return this.selectableMeters.filter(meter => 
        (meter.meterName && meter.meterName.toLowerCase().includes(query)) ||
        (meter.serial && meter.serial.toLowerCase().includes(query))
      );
    },
    // 过滤已绑定电表公摊组
    filteredSelectedShares() {
      if (!this.boundShareSearchQuery) return this.selectedShares;
      const query = this.boundShareSearchQuery.toLowerCase();
      return this.selectedShares.filter(share => 
        (share.name && share.name.toLowerCase().includes(query))
      );
    },
    // 过滤可选电表公摊组
    filteredSelectableShares() {
      if (!this.shareSearchQuery) return this.selectableShares;
      const query = this.shareSearchQuery.toLowerCase();
      return this.selectableShares.filter(share => 
        (share.name && share.name.toLowerCase().includes(query))
      );
    },
    // 过滤已绑定水表
    filteredSelectedWaters() {
      if (!this.boundWaterSearchQuery) return this.selectedWaters;
      const query = this.boundWaterSearchQuery.toLowerCase();
      return this.selectedWaters.filter(water => 
        (water.waterName && water.waterName.toLowerCase().includes(query)) ||
        (water.serial && water.serial.toLowerCase().includes(query))
      );
    },
    // 过滤可选水表
    filteredSelectableWaters() {
      if (!this.waterSearchQuery) return this.selectableWaters;
      const query = this.waterSearchQuery.toLowerCase();
      return this.selectableWaters.filter(water => 
        (water.waterName && water.waterName.toLowerCase().includes(query)) ||
        (water.serial && water.serial.toLowerCase().includes(query))
      );
    },
    // 过滤已绑定水表公摊组
    filteredSelectedWaterShares() {
      if (!this.boundWaterShareSearchQuery) return this.selectedWaterShares;
      const query = this.boundWaterShareSearchQuery.toLowerCase();
      return this.selectedWaterShares.filter(share => 
        (share.name && share.name.toLowerCase().includes(query))
      );
    },
    // 过滤可选水表公摊组
    filteredSelectableWaterShares() {
      if (!this.waterShareSearchQuery) return this.selectableWaterShares;
      const query = this.waterShareSearchQuery.toLowerCase();
      return this.selectableWaterShares.filter(share => 
        (share.name && share.name.toLowerCase().includes(query))
      );
    },
    // 过滤已绑定空调
    filteredSelectedAirs() {
      if (!this.boundAirSearchQuery) return this.selectedAirs;
      const query = this.boundAirSearchQuery.toLowerCase();
      return this.selectedAirs.filter(air => 
        (air.name && air.name.toLowerCase().includes(query)) ||
        (air.indoorUnitId && air.indoorUnitId.toLowerCase().includes(query))
      );
    },
    // 过滤可选空调
    filteredSelectableAirs() {
      if (!this.airSearchQuery) return this.selectableAirs;
      const query = this.airSearchQuery.toLowerCase();
      return this.selectableAirs.filter(air => 
        (air.name && air.name.toLowerCase().includes(query)) ||
        (air.indoorUnitId && air.indoorUnitId.toLowerCase().includes(query))
      );
    },
    // 过滤已绑定空调公摊组
    filteredSelectedAirShares() {
      if (!this.boundAirShareSearchQuery) return this.selectedAirShares;
      const query = this.boundAirShareSearchQuery.toLowerCase();
      return this.selectedAirShares.filter(share => 
        (share.name && share.name.toLowerCase().includes(query))
      );
    },
    // 过滤可选空调公摊组
    filteredSelectableAirShares() {
      if (!this.airShareSearchQuery) return this.selectableAirShares;
      const query = this.airShareSearchQuery.toLowerCase();
      return this.selectableAirShares.filter(share => 
        (share.name && share.name.toLowerCase().includes(query))
      );
    },
  },
  mounted() {
    // 初始化时加载所有设备数据
    this.initAllDeviceData();
  },
  methods: {
    // ==================== 初始化加载所有设备数据 ====================
    async initAllDeviceData() {
      // 并行加载所有设备类型的数据，用于显示正确的设备数量
      await Promise.all([
        this.fetchElectricMeters(),
        this.fetchElectricGroups(),
        this.fetchWaterMeters(),
        this.fetchWaterGroups(),
        this.fetchAirConditioners(),
        this.fetchAirShareGroups(),
      ]);
    },

    formatAirData(item) {
      // 格式化绑定信息
      if (item.bindType == 2) {
        item.bindData = item.bindId ? String(item.bindId) : '';
      } else if (item.bindType == 1) {
        item.bindData = item.tenantName
          ? `${item.bindId || ''}(${item.tenantName})`
          : (item.bindId ? String(item.bindId) : '');
      } else {
        item.bindData = '';
      }

      // 格式化设备类型
      const typeMap = { 1: '多联机' };
      item.typeLabel = typeMap[item.type] || '未知';

      // 格式化运行模式
      const operationModeMap = {
        0: '自动', 1: '制热', 2: '制冷', 4: '送风', 8: '除湿'
      };
      item.operationModeLabel = operationModeMap[item.operationMode] || '--';

      // 格式化风速
      const fanSpeedMap = {
        0: '自动', 1: '低风', 2: '中风', 3: '高风'
      };
      item.fanSpeedLabel = fanSpeedMap[item.fanSpeed] || '--';

      // 判断是否锁定
      item.isLock = !!(
        item.lockFanSpeed ||
        item.lockOperationMode ||
        item.lockPowerStatus ||
        item.minTemperature ||
        item.maxTemperature
      );

      // ⬇️⬇️⬇️ 关键修改:将 meterId 和 serial 转换为 meterData 数组 ⬇️⬇️⬇️
      // 确保 meterId 和 serial 是字符串
      if (item.meterId !== undefined && item.meterId !== null) {
        item.meterId = String(item.meterId);
      }

      if (item.serial !== undefined && item.serial !== null) {
        item.serial = String(item.serial);
      }

      // 转换为 meterData 数组格式(drawer.vue 期望的格式)
      if (item.serial && item.meterId) {
        item.meterData = [{
          id: item.meterId,
          serial: item.serial
        }];
      } else {
        item.meterData = [];
      }

      return item;
    },

    // ==================== 设备类型切换 ====================
    async handleDeviceTypeClick(deviceType) {
      if (deviceType === "lighting" || deviceType === "doorlock") {
        this.$message.info("该功能暂未开放");
        return;
      }

      // 如果点击的是当前已激活的类型，不做处理
      if (this.activeDeviceType === deviceType) {
        return;
      }

      this.activeDeviceType = deviceType;

      // 根据设备类型重新加载数据
      try {
        switch (deviceType) {
          case 'electric':
            // 清空数据，显示加载状态
            this.electricMeters = [];
            this.electricGroups = [];
            this.electricLoading = true;
            this.electricGroupLoading = true;

            await Promise.all([
              this.fetchElectricMeters(),
              this.fetchElectricGroups()
            ]);
            break;

          case 'water':
            this.waterMeters = [];
            this.waterGroups = [];
            this.waterLoading = true;
            this.waterGroupLoading = true;

            await Promise.all([
              this.fetchWaterMeters(),
              this.fetchWaterGroups()
            ]);
            break;

          case 'aircon':
            this.airConditioners = [];
            this.airShareGroups = [];
            this.airLoading = true;
            this.airShareLoading = true;

            await Promise.all([
              this.fetchAirConditioners(),
              this.fetchAirShareGroups()
            ]);
            break;
        }
      } catch (error) {
        console.error('加载设备数据失败:', error);
        this.$message.error('加载数据失败，请重试');
      }
    },

    handleAirEdit(air) {
      this.airEditForm = {
        id: air.id,
        indoorUnitId: air.indoorUnitId || '',
        name: air.name || '',
        type: air.type || 1,
        bindType: air.bindType || 1,
        remark: air.remark || '',
      };
      this.airEditDialog.visible = true;
    },
    async handleAirEditSave() {
      this.airEditDialog.submitting = true;
      try {
        const response = await airInfoUpdateAir(this.airEditForm);

        if (response.code === 200) {
          this.$message.success("编辑成功");
          this.airEditDialog.visible = false;

          // 刷新列表
          await this.fetchAirConditioners();

          // 如果详情抽屉打开,更新详情
          if (this.airDetailDrawer.visible) {
            const updatedAir = this.airConditioners.find(a => a.id === this.airEditForm.id);
            if (updatedAir) {
              this.airDetailDrawer.rowData = updatedAir;
            }
          }
        } else {
          this.$message.error(response.msg || "编辑失败");
        }
      } catch (error) {
        console.error("编辑空调失败:", error);
        this.$message.error("编辑失败");
      } finally {
        this.airEditDialog.submitting = false;
      }
    },
    // ==================== 复制序列号 ====================
    handleCopySerial(serial) {
      if (!serial || serial === '-' || serial === '--') {
        this.$message.warning('无可复制内容');
        return;
      }

      const input = document.createElement('input');
      input.value = serial;
      document.body.appendChild(input);
      input.select();

      try {
        document.execCommand('copy');
        this.$message.success('序列号已复制');
      } catch (err) {
        this.$message.error('复制失败');
      }

      document.body.removeChild(input);
    },

    // ==================== 公摊类型转换工具方法 ====================

    // 获取公摊类型标签文本
    getShareTypeLabel(shareType) {
      const typeStr = String(shareType).toUpperCase();

      if (typeStr === 'AREA') {
        return '面积占比';
      } else if (typeStr === 'ENERGY') {
        return '能耗占比';
      }

      return '未知';
    },

    // 获取公摊类型标签颜色
    getShareTypeTag(shareType) {
      const typeStr = String(shareType).toUpperCase();

      if (typeStr === 'AREA') {
        return 'primary';  // 面积占比 - 蓝色
      } else if (typeStr === 'ENERGY') {
        return 'success';  // 能耗占比 - 绿色
      }

      return 'info';
    },

    // 获取空调公摊类型标签文本
    getAirShareTypeLabel(shareType) {
      const typeStr = String(shareType).toUpperCase();
      if (typeStr === 'AREA') {
        return '面积占比';
      } else if (typeStr === 'ENERGY') {
        return '能耗占比';
      }
      return '未知';
    },

    // 获取空调公摊类型标签颜色
    getAirShareTypeTag(shareType) {
      const typeStr = String(shareType).toUpperCase();
      if (typeStr === 'AREA') {
        return 'primary';  // 面积分摊 - 蓝色
      } else if (typeStr === 'ENERGY') {
        return 'success';  // 用能分摊 - 绿色
      }
      return 'info';
    },

    // ==================== 电表相关方法 ====================

    // 获取专用电表列表
    async fetchElectricMeters() {
      this.electricLoading = true;
      try {
        const params = {
          bindType: 1,
          bindId: this.tenantId,
          managerId: this.managerId,
          page: {
            size: 100,
            current: 1,
          },
        };

        const response = await getTenantElectricMeters(params);
        if (response.code === 200) {
          this.electricMeters = response.data.dataList || [];
          this.electricMeterCount = this.electricMeters.length;
          this.$emit("update-device-count", {
            electricMeterCount: this.electricMeterCount,
          });
        }
      } catch (error) {
        console.error("获取专用电表列表失败:", error);
        this.$message.error("获取专用电表列表失败");
      } finally {
        this.electricLoading = false;
      }
    },

    // 获取电表公摊组列表
    async fetchElectricGroups() {
      this.electricGroupLoading = true;
      try {
        const params = {
          tenantId: this.tenantId,
        };

        const response = await getTenantElectricGroups(params);
        if (response.code === 200) {
          this.electricGroups = response.data || [];
          this.electricGroupCount = this.electricGroups.length;
          this.$emit("update-device-count", {
            electricGroupCount: this.electricGroupCount,
          });
        }
      } catch (error) {
        console.error("获取电表公摊组列表失败:", error);
        this.$message.error("获取电表公摊组列表失败");
      } finally {
        this.electricGroupLoading = false;
      }
    },

    // 电表监控 - 跳转详情
    handleMeterMonitor(meter) {
      this.meterDetailDrawer = {
        visible: true,
        meterId: meter.id,
        serial: meter.serial
      }
    },

    // 分合闸操作
    async handleSwitch(row, type) {
      // 如果是预付费模式，需要先修改为强控
      if (row.logicPayType === 0 || row.logicPayType === "0") {
        try {
          await this.$confirm(
            '该电表为预付费模式，需要先修改为强控模式才能进行分合闸操作。是否立即修改？',
            '提示',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning',
            }
          );

          // 修改为强控模式
          const updateResponse = await meterUpdateLogicPayType({
            meterId: row.id,
            logicPayType: 1, // 改为强控
          });

          if (updateResponse.code === 200) {
            this.$message.success("付费模式修改成功");
            // 刷新数据后执行分合闸
            await this.fetchElectricMeters();

            // 延迟执行分合闸操作
            setTimeout(() => {
              this.executeSwitchOperation(row, type);
            }, 500);
          } else {
            this.$message.error(updateResponse.msg || "修改付费模式失败");
          }
        } catch (error) {
          if (error !== "cancel") {
            this.$message.error("修改付费模式失败");
            console.error("修改失败:", error);
          }
        }
        return;
      }

      // 直接执行分合闸操作
      this.executeSwitchOperation(row, type);
    },

    // 执行分合闸操作
    async executeSwitchOperation(row, type) {
      const typeText = type === 1 ? "合闸" : "分闸";

      try {
        await this.$confirm(
          `确定要对电表"${row.meterName}"执行${typeText}操作吗？`,
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        const response = await tenantDoMeterSwitchOffOn({
          meterId: row.id,
          switchStatus: type,
          verifyCode: '',
          verifyPhone: ''
        });

        if (response.code === 200) {
          this.$message.success(`${typeText}操作成功`);
          await this.fetchElectricMeters();
        } else {
          this.$message.error(response.msg || `${typeText}操作失败`);
        }
      } catch (error) {
        if (error !== "cancel") {
          this.$message.error(`${typeText}操作失败`);
          console.error("操作失败:", error);
        }
      }
    },

    // ==================== 水表相关方法 ====================

    // 获取专用水表列表
    async fetchWaterMeters() {
      this.waterLoading = true;
      try {
        const params = {
          managerId: this.managerId,
          tenantId: this.tenantId,
        };

        const response = await getTenantWaterBindEdit(params);
        if (response.code === 200) {
          this.waterMeters = response.data.selectedList || [];
          this.waterMeterCount = this.waterMeters.length;
          this.$emit("update-device-count", {
            waterMeterCount: this.waterMeterCount,
          });
        }
      } catch (error) {
        console.error("获取专用水表列表失败:", error);
        this.$message.error("获取专用水表列表失败");
      } finally {
        this.waterLoading = false;
      }
    },

    // 获取水表公摊组列表
    async fetchWaterGroups() {
      this.waterGroupLoading = true;
      try {
        const params = {
          tenantId: this.tenantId,
        };

        const response = await getTenantWaterGroups(params);
        if (response.code === 200) {
          this.waterGroups = response.data || [];
          this.waterGroupCount = this.waterGroups.length;
          this.$emit("update-device-count", {
            waterGroupCount: this.waterGroupCount,
          });
        }
      } catch (error) {
        console.error("获取水表公摊组列表失败:", error);
        this.$message.error("获取水表公摊组列表失败");
      } finally {
        this.waterGroupLoading = false;
      }
    },

    // 水表监控 - 跳转详情
    handleWaterMonitor(water) {
      this.waterDetailDrawer = {
        visible: true,
        waterId: water.id,
        serial: water.serial
      }
    },

    // ==================== 空调相关方法 ====================

    // 获取专用空调列表
    async fetchAirConditioners() {
      this.airLoading = true;
      try {
        const params = {
          bindId: String(this.tenantId),
          bindType: 1,
          managerId: this.managerId,
          page: {
            size: 100,
            current: 1,
          },
        };

        const response = await getTenantAirConditioners(params);
        if (response.code === 200) {
          // ✅ 添加这一行:格式化每条数据
          this.airConditioners = (response.data.dataList || []).map(item =>
            this.formatAirData(item)
          );

          this.airConditionerCount = this.airConditioners.length;
          this.$emit("update-device-count", {
            airConditionerCount: this.airConditionerCount,
          });
        }
      } catch (error) {
        console.error("获取专用空调列表失败:", error);
        this.$message.error("获取专用空调列表失败");
      } finally {
        this.airLoading = false;
      }
    },

    // 获取空调公摊组列表
    async fetchAirShareGroups() {
      this.airShareLoading = true;
      try {
        const params = {
          tenantId: this.tenantId,
        };

        const response = await getTenantAirShareGroups(params);
        if (response.code === 200) {
          this.airShareGroups = response.data || [];
          this.airShareGroupCount = this.airShareGroups.length;
          this.$emit("update-device-count", {
            airShareGroupCount: this.airShareGroupCount,
          });
        }
      } catch (error) {
        console.error("获取空调公摊组列表失败:", error);
        this.$message.error("获取空调公摊组列表失败");
      } finally {
        this.airShareLoading = false;
      }
    },

    // 空调监控 - 跳转详情
    // 空调监控 - 跳转详情
    handleAirMonitor(air) {
      console.log('🔍 完整空调数据:', air);
      console.log('🔍 meterId:', air.meterId, 'typeof:', typeof air.meterId);
      console.log('🔍 serial:', air.serial, 'typeof:', typeof air.serial);
      console.log('🔍 bindData:', air.bindData);

      this.airDetailDrawer = {
        visible: true,
        deviceId: air.id,
        rowData: air
      };

      // ⬇️⬇️⬇️ 添加延迟检查 ⬇️⬇️⬇️
      setTimeout(() => {
        console.log('🔍 500ms后检查 - airDetailDrawer.rowData:', this.airDetailDrawer.rowData);
        console.log('🔍 500ms后检查 - rowData.meterId:', this.airDetailDrawer.rowData?.meterId);
        console.log('🔍 500ms后检查 - rowData.serial:', this.airDetailDrawer.rowData?.serial);
      }, 500);
    },

    // 获取空调运行模式标签
    getOperationModeLabel(mode) {
      const modeMap = {
        0: '自动',
        1: '制热',
        2: '制冷',
        4: '送风',
        8: '除湿',
      };
      return modeMap[mode] || '--';
    },

    // 获取空调运行模式标签类型
    getOperationModeType(mode) {
      const typeMap = {
        0: 'info',      // 自动 - 灰色
        1: 'danger',    // 制热 - 红色
        2: 'primary',   // 制冷 - 蓝色
        4: 'success',   // 送风 - 绿色
        8: 'warning',   // 除湿 - 橙色
      };
      return typeMap[mode] || 'info';
    },

    // ==================== 设备绑定/解绑相关方法 ====================

    // 打开绑定设备抽屉
    async handleBindDevice(deviceType) {
      this.currentDeviceType = deviceType;
      this.bindDrawerVisible = true;

      // 重置搜索关键词
      this.meterSearchQuery = "";
      this.boundMeterSearchQuery = "";
      this.shareSearchQuery = "";
      this.boundShareSearchQuery = "";
      this.waterSearchQuery = "";
      this.boundWaterSearchQuery = "";
      this.waterShareSearchQuery = "";
      this.boundWaterShareSearchQuery = "";
      this.airSearchQuery = "";
      this.boundAirSearchQuery = "";
      this.airShareSearchQuery = "";
      this.boundAirShareSearchQuery = "";

      if (deviceType === "electric") {
        await this.loadMeterBindData();
      } else if (deviceType === "electricGroup") {
        await this.loadShareBindData();
      } else if (deviceType === "water") {
        await this.loadWaterBindData();
      } else if (deviceType === "waterGroup") {
        await this.loadWaterShareBindData();
      } else if (deviceType === "aircon") {
        await this.loadAirBindData();
      } else if (deviceType === "airGroup") {
        await this.loadAirShareBindData();
      }
    },

    // 加载电表绑定数据
    async loadMeterBindData() {
      this.drawerLoading = true;
      try {
        const params = {
          managerId: this.managerId,
          tenantId: this.tenantId,
        };

        const response = await getTenantMeterBindEdit(params);
        if (response.code === 200) {
          this.selectedMeters = response.data.meterSelectedList || [];
          this.selectableMeters = response.data.meterSelectableList || [];
        }
      } catch (error) {
        console.error("获取电表绑定数据失败:", error);
        this.$message.error("获取电表绑定数据失败");
      } finally {
        this.drawerLoading = false;
      }
    },

    // 绑定电表
    async handleMeterBind(meter) {
      try {
        this.$set(meter, "binding", true);

        const params = {
          meterId: meter.id,
          tenantId: this.tenantId,
          type: "bind",
        };

        const response = await bindTenantMeter(params);
        if (response.code === 200) {
          this.$message.success("绑定成功");
          await this.loadMeterBindData();
          await this.fetchElectricMeters();
        } else {
          this.$message.error(response.msg || "绑定失败");
        }
      } catch (error) {
        console.error("绑定电表失败:", error);
        this.$message.error("绑定电表失败");
      } finally {
        this.$set(meter, "binding", false);
      }
    },

    // 解绑电表
    async handleMeterUnbind(meter) {
      try {
        await this.$confirm(`确定要解绑电表 ${meter.meterName} 吗？`, "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });

        this.$set(meter, "unbinding", true);

        const params = {
          meterId: meter.id,
          tenantId: this.tenantId,
          type: "unbind",
        };

        const response = await bindTenantMeter(params);
        if (response.code === 200) {
          this.$message.success("解绑成功");
          await this.loadMeterBindData();
          await this.fetchElectricMeters();
        } else {
          this.$message.error(response.msg || "解绑失败");
        }
      } catch (error) {
        if (error !== "cancel") {
          console.error("解绑电表失败:", error);
          this.$message.error("解绑电表失败");
        }
      } finally {
        this.$set(meter, "unbinding", false);
      }
    },

    // 加载公摊组绑定数据
    async loadShareBindData() {
      this.drawerLoading = true;
      this.shareAreaInput = {};
      try {
        const params = {
          managerId: this.managerId,
          tenantId: this.tenantId,
        };

        const response = await getTenantShareBindEdit(params);
        if (response.code === 200) {
          this.selectedShares = response.data.shareSelectedList || [];
          this.selectableShares = response.data.shareSelectableList || [];

          this.selectableShares.forEach((share) => {
            this.$set(this.shareAreaInput, share.id, null);
          });
        }
      } catch (error) {
        console.error("获取公摊组绑定数据失败:", error);
        this.$message.error("获取公摊组绑定数据失败");
      } finally {
        this.drawerLoading = false;
      }
    },

    // 绑定公摊组
    async handleShareBind(share) {
      const area = this.shareAreaInput[share.id];
      if (!area || area <= 0) {
        this.$message.warning("请输入有效的公摊面积");
        return;
      }

      try {
        this.$set(share, "binding", true);

        const params = {
          tenantId: this.tenantId,
          managerId: this.managerId,
          type: "bind",
          area: area,
          shareType: share.shareType,
          shareId: share.id,
        };

        const response = await bindShareTenant(params);
        if (response.code === 200) {
          this.$message.success("绑定成功");
          await this.loadShareBindData();
          await this.fetchElectricGroups();
        } else {
          this.$message.error(response.msg || "绑定失败");
        }
      } catch (error) {
        console.error("绑定公摊组失败:", error);
        this.$message.error("绑定公摊组失败");
      } finally {
        this.$set(share, "binding", false);
      }
    },

    // 解绑公摊组
    async handleShareUnbind(share) {
      try {
        await this.$confirm(`确定要解绑公摊组 ${share.name} 吗？`, "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });

        this.$set(share, "unbinding", true);

        const params = {
          tenantId: this.tenantId,
          managerId: this.managerId,
          type: "unbind",
          area: share.area,
          shareType: share.shareType,
          shareId: share.id,
        };

        const response = await bindShareTenant(params);
        if (response.code === 200) {
          this.$message.success("解绑成功");
          await this.loadShareBindData();
          await this.fetchElectricGroups();
        } else {
          this.$message.error(response.msg || "解绑失败");
        }
      } catch (error) {
        if (error !== "cancel") {
          console.error("解绑公摊组失败:", error);
          this.$message.error("解绑公摊组失败");
        }
      } finally {
        this.$set(share, "unbinding", false);
      }
    },

    // 加载水表绑定数据
    async loadWaterBindData() {
      this.drawerLoading = true;
      this.waterSettleRates = {};
      try {
        const params = {
          managerId: this.managerId,
          tenantId: this.tenantId,
        };

        const response = await getTenantWaterBindEdit(params);
        if (response.code === 200) {
          this.selectedWaters = response.data.selectedList || [];
          this.selectableWaters = response.data.selectableList || [];

          this.selectableWaters.forEach((water) => {
            this.$set(this.waterSettleRates, water.id, 1);
          });
        }
      } catch (error) {
        console.error("获取水表绑定数据失败:", error);
        this.$message.error("获取水表绑定数据失败");
      } finally {
        this.drawerLoading = false;
      }
    },

    // 绑定水表
    async handleWaterBind(water) {
      try {
        this.$set(water, "binding", true);

        const params = {
          waterId: water.id,
          settleRate: this.waterSettleRates[water.id] || 1,
          type: "bind",
          tenantId: this.tenantId,
        };

        const response = await bindTenantWater(params);
        if (response.code === 200) {
          this.$message.success("绑定成功");
          await this.loadWaterBindData();
          await this.fetchWaterMeters();
        } else {
          this.$message.error(response.msg || "绑定失败");
        }
      } catch (error) {
        console.error("绑定水表失败:", error);
        this.$message.error("绑定水表失败");
      } finally {
        this.$set(water, "binding", false);
      }
    },

    // 解绑水表
    async handleWaterUnbind(water) {
      try {
        await this.$confirm(`确定要解绑水表 ${water.waterName} 吗？`, "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });

        this.$set(water, "unbinding", true);

        const params = {
          waterId: water.id,
          settleRate: water.settleRate || 1,
          type: "unbind",
          tenantId: this.tenantId,
        };

        const response = await bindTenantWater(params);
        if (response.code === 200) {
          this.$message.success("解绑成功");
          await this.loadWaterBindData();
          await this.fetchWaterMeters();
        } else {
          this.$message.error(response.msg || "解绑失败");
        }
      } catch (error) {
        if (error !== "cancel") {
          console.error("解绑水表失败:", error);
          this.$message.error("解绑水表失败");
        }
      } finally {
        this.$set(water, "unbinding", false);
      }
    },

    // 加载水表公摊组绑定数据
    async loadWaterShareBindData() {
      this.drawerLoading = true;
      this.waterShareAreaInput = {};
      try {
        const params = {
          managerId: this.managerId,
          tenantId: this.tenantId,
        };

        const response = await getTenantWaterShareBindEdit(params);
        if (response.code === 200) {
          this.selectedWaterShares = response.data.shareSelectedList || [];
          this.selectableWaterShares = response.data.shareSelectableList || [];

          this.selectableWaterShares.forEach((share) => {
            this.$set(this.waterShareAreaInput, share.id, null);
          });
        }
      } catch (error) {
        console.error("获取水表公摊组绑定数据失败:", error);
        this.$message.error("获取水表公摊组绑定数据失败");
      } finally {
        this.drawerLoading = false;
      }
    },

    // 绑定水表公摊组
    async handleWaterShareBind(share) {
      const area = this.waterShareAreaInput[share.id];
      if (!area || area <= 0) {
        this.$message.warning("请输入有效的公摊面积");
        return;
      }

      try {
        this.$set(share, "binding", true);

        const params = {
          tenantId: this.tenantId,
          managerId: this.managerId,
          type: "bind",
          area: area,
          shareId: share.id,
        };

        const response = await bindWaterShareTenant(params);
        if (response.code === 200) {
          this.$message.success("绑定成功");
          await this.loadWaterShareBindData();
          await this.fetchWaterGroups();
        } else {
          this.$message.error(response.msg || "绑定失败");
        }
      } catch (error) {
        console.error("绑定水表公摊组失败:", error);
        this.$message.error("绑定水表公摊组失败");
      } finally {
        this.$set(share, "binding", false);
      }
    },

    // 解绑水表公摊组
    async handleWaterShareUnbind(share) {
      try {
        await this.$confirm(`确定要解绑水表公摊组 ${share.name} 吗？`, "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });

        this.$set(share, "unbinding", true);

        const params = {
          tenantId: this.tenantId,
          managerId: this.managerId,
          type: "unbind",
          area: share.area,
          shareId: share.id,
        };

        const response = await bindWaterShareTenant(params);
        if (response.code === 200) {
          this.$message.success("解绑成功");
          await this.loadWaterShareBindData();
          await this.fetchWaterGroups();
        } else {
          this.$message.error(response.msg || "解绑失败");
        }
      } catch (error) {
        if (error !== "cancel") {
          console.error("解绑水表公摊组失败:", error);
          this.$message.error("解绑水表公摊组失败");
        }
      } finally {
        this.$set(share, "unbinding", false);
      }
    },

    // 加载空调绑定数据
    async loadAirBindData() {
      this.drawerLoading = true;
      try {
        const params = {
          managerId: this.managerId,
          tenantId: this.tenantId,
        };

        const response = await getTenantAirBindEdit(params);
        if (response.code === 200) {
          this.selectedAirs = response.data.airSelectedList || [];
          this.selectableAirs = response.data.airSelectableList || [];
        }
      } catch (error) {
        console.error("获取空调绑定数据失败:", error);
        this.$message.error("获取空调绑定数据失败");
      } finally {
        this.drawerLoading = false;
      }
    },

    // 绑定空调
    async handleAirBind(air) {
      try {
        this.$set(air, "binding", true);

        const params = {
          airId: air.id,
          tenantId: this.tenantId,
          type: "bind",
        };

        const response = await bindTenantAir(params);
        if (response.code === 200) {
          this.$message.success("绑定成功");
          await this.loadAirBindData();
          await this.fetchAirConditioners();
        } else {
          this.$message.error(response.msg || "绑定失败");
        }
      } catch (error) {
        console.error("绑定空调失败:", error);
        this.$message.error("绑定空调失败");
      } finally {
        this.$set(air, "binding", false);
      }
    },

    // 解绑空调
    async handleAirUnbind(air) {
      try {
        await this.$confirm(`确定要解绑空调 ${air.name} 吗？`, "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });

        this.$set(air, "unbinding", true);

        const params = {
          airId: air.id,
          tenantId: this.tenantId,
          type: "unbind",
        };

        const response = await bindTenantAir(params);
        if (response.code === 200) {
          this.$message.success("解绑成功");
          await this.loadAirBindData();
          await this.fetchAirConditioners();
        } else {
          this.$message.error(response.msg || "解绑失败");
        }
      } catch (error) {
        if (error !== "cancel") {
          console.error("解绑空调失败:", error);
          this.$message.error("解绑空调失败");
        }
      } finally {
        this.$set(air, "unbinding", false);
      }
    },

    // 加载空调公摊组绑定数据
    async loadAirShareBindData() {
      this.drawerLoading = true;
      this.airShareAreaInput = {};
      try {
        const params = {
          managerId: this.managerId,
          tenantId: this.tenantId,
        };

        const response = await getTenantAirShareBindEdit(params);
        if (response.code === 200) {
          this.selectedAirShares = response.data.shareSelectedList || [];
          this.selectableAirShares = response.data.shareSelectableList || [];

          this.selectableAirShares.forEach((share) => {
            // 用能分摊不需要输入面积，默认设置为0
            this.$set(this.airShareAreaInput, share.id, share.shareType === 'ENERGY' ? 0 : null);
          });
        }
      } catch (error) {
        console.error("获取空调公摊组绑定数据失败:", error);
        this.$message.error("获取空调公摊组绑定数据失败");
      } finally {
        this.drawerLoading = false;
      }
    },

    // 绑定空调公摊组
    async handleAirShareBind(share) {
      // 用能分摊不需要面积，面积分摊需要面积
      let area = 0;
      if (share.shareType === 'ENERGY') {
        area = 0; // 用能分摊面积设为0
      } else {
        area = this.airShareAreaInput[share.id];
        if (!area || area <= 0) {
          this.$message.warning("请输入有效的公摊面积");
          return;
        }
      }

      try {
        this.$set(share, "binding", true);

        const params = {
          tenantId: this.tenantId,
          managerId: this.managerId,
          type: "bind",
          area: area,
          shareType: share.shareType,
          shareId: share.id,
        };

        const response = await bindAirShareTenant(params);
        if (response.code === 200) {
          this.$message.success("绑定成功");
          await this.loadAirShareBindData();
          await this.fetchAirShareGroups();
        } else {
          this.$message.error(response.msg || "绑定失败");
        }
      } catch (error) {
        console.error("绑定空调公摊组失败:", error);
        this.$message.error("绑定空调公摊组失败");
      } finally {
        this.$set(share, "binding", false);
      }
    },

    // 解绑空调公摊组
    async handleAirShareUnbind(share) {
      try {
        await this.$confirm(`确定要解绑空调公摊组 ${share.name} 吗？`, "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });

        this.$set(share, "unbinding", true);

        const params = {
          tenantId: this.tenantId,
          managerId: this.managerId,
          type: "unbind",
          area: share.area || 0,
          shareType: share.shareType,
          shareId: share.id,
        };

        const response = await bindAirShareTenant(params);
        if (response.code === 200) {
          this.$message.success("解绑成功");
          await this.loadAirShareBindData();
          await this.fetchAirShareGroups();
        } else {
          this.$message.error(response.msg || "解绑失败");
        }
      } catch (error) {
        if (error !== "cancel") {
          console.error("解绑空调公摊组失败:", error);
          this.$message.error("解绑空调公摊组失败");
        }
      } finally {
        this.$set(share, "unbinding", false);
      }
    },

    // 抽屉关闭 - 清空所有绑定数据
    handleDrawerClose() {
      this.bindDrawerVisible = false;
      this.currentDeviceType = "";

      // 清空电表相关数据
      this.selectedMeters = [];
      this.selectableMeters = [];
      this.selectedShares = [];
      this.selectableShares = [];
      this.shareAreaInput = {};

      // 清空水表相关数据
      this.selectedWaters = [];
      this.selectableWaters = [];
      this.waterSettleRates = {};
      this.selectedWaterShares = [];
      this.selectableWaterShares = [];
      this.waterShareAreaInput = {};

      // 清空空调相关数据
      this.selectedAirs = [];
      this.selectableAirs = [];
      this.selectedAirShares = [];
      this.selectableAirShares = [];
      this.airShareAreaInput = {};

      // 清空搜索关键词
      this.meterSearchQuery = "";
      this.shareSearchQuery = "";
      this.waterSearchQuery = "";
      this.waterShareSearchQuery = "";
      this.airSearchQuery = "";
      this.airShareSearchQuery = "";
    },

    // ==================== 工具方法 ====================

    // 格式化余额
    formatBalance(balance) {
      if (balance === null || balance === undefined) return "0.00";
      return Number(balance).toFixed(2);
    },

    // 格式化日期
    formatDate(date) {
      if (!date) return "--";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "--";
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(
        2,
        "0"
      )} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    },
  },
};
</script>
<style lang="scss" scoped>
// ==================== 变量定义 ====================
$primary-color: #409eff;
$primary-light: #66b1ff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;
$info-color: #909399;
$text-primary: #303133;
$text-regular: #606266;
$text-secondary: #909399;
$border-color: #dcdfe6;
$border-light: #e4e7ed;
$bg-color: #f5f7fa;

// ==================== 租户设备组件 ====================
.tenant-devices {
  height: 100%;
  display: flex;
  flex-direction: column;

  // 设备类型卡片容器
  .device-type-cards-wrapper {
    margin-bottom: 24px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    scrollbar-color: rgba(193, 196, 205, 0.5) transparent;
    flex-shrink: 0;
    padding-bottom: 0;
    background: transparent;
    box-shadow: none !important;

    &::-webkit-scrollbar {
      height: 6px;
      background: transparent;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
      border-radius: 0;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(193, 196, 205, 0.5);
      border-radius: 3px;

      &:hover {
        background: rgba(166, 169, 176, 0.7);
      }
    }
  }

  .device-type-cards {
    display: flex;
    gap: 16px;
    min-width: max-content;
    padding: 0 0 8px 0;
    background: transparent;
    margin-top: 2px;

    .device-type-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      min-width: 200px;
      background: white;
      border: 2px solid $border-light;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      flex-shrink: 0;
      box-shadow: none;
      position: relative;
      z-index: 1;

      &:hover {
        border-color: $primary-light;
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
        transform: translateY(-2px);
        z-index: 2;
      }

      &.active {
        border-color: $primary-color;
        background: linear-gradient(135deg, #f0f8ff 0%, #e6f4ff 100%);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
        z-index: 2;

        .card-icon {
          background: $primary-color;
          color: white;
        }
      }

      .card-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        background: $bg-color;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: $primary-color;
        flex-shrink: 0;
        transition: all 0.3s ease;
      }

      .card-info {
        flex: 1;
        min-width: 0;

        .card-title {
          font-size: 15px;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 4px;
          white-space: nowrap;
        }

        .card-stats {
          font-size: 13px;
          color: $text-secondary;
          white-space: nowrap;
        }
      }
    }
  }

  // 设备内容区域
  .device-content-area {
    flex: 1;
    min-height: 0;
    padding-bottom: 24px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow-y: auto;

    .device-section {
      margin-bottom: 32px;
      flex-shrink: 0;

      &:last-child {
        margin-bottom: 0;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 12px;

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: $text-primary;
          margin: 0;
          position: relative;
          padding-left: 12px;

          &::before {
            content: "";
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 16px;
            background: $primary-color;
            border-radius: 2px;
          }
        }
      }

      // 表格容器
      .table-wrapper {
        &.limited-height {
          ::v-deep .el-table {
            .el-table__body-wrapper {
              max-height: 400px;
              overflow-y: auto;
            }
          }
        }

        // ==================== 设备表格样式 ====================
        ::v-deep .device-table {
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #f0f0f0 !important;

          // 表头样式
          .el-table__header-wrapper {
            th {
              background: #fafbfc;
              color: $text-primary;
              font-weight: 600;
              font-size: 13px;
              padding: 12px 0;
              border-right: 1px solid #f0f0f0 !important;
              border-bottom: 1px solid #f0f0f0 !important;
            }
          }

          // 表体样式
          .el-table__body {
            tr {
              &:hover>td {
                background: #f5f7fa !important;
              }
            }

            td {
              padding: 12px 0;
              font-size: 13px;
              color: $text-regular;
              border-right: 1px solid #f5f5f5 !important;
              border-bottom: 1px solid #f5f5f5 !important;
            }
          }

          // 固定列阴影优化
          .el-table__fixed,
          .el-table__fixed-right {
            &::before {
              background-color: transparent !important;
            }
          }

          .el-table__fixed-right-patch {
            border-bottom: 1px solid #f0f0f0 !important;
            background-color: #fafbfc !important;
          }

          // 序列号可复制样式
          .serial-copy {
            color: #000;
            cursor: pointer;
            user-select: none;
            display: inline-block;
            position: relative;
            transition: all 0.2s ease;

            &:hover {
              color: $primary-color;

              &::after {
                content: "点击复制";
                position: absolute;
                left: 50%;
                bottom: 100%;
                transform: translateX(-50%);
                padding: 4px 8px;
                background: rgba(0, 0, 0, 0.75);
                color: #fff;
                font-size: 12px;
                white-space: nowrap;
                border-radius: 4px;
                margin-bottom: 4px;
                pointer-events: none;
                z-index: 10;
              }
            }

            &:active {
              color: #3a8ee6;
            }
          }

          // 在线状态点
          .status-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }

          .status-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;

            &.online {
              background: $success-color;
              box-shadow: 0 0 4px rgba(103, 194, 58, 0.5);
            }

            &.offline {
              background: $danger-color;
              box-shadow: 0 0 4px rgba(245, 108, 108, 0.5);
            }
          }

          // 操作列样式
          .operation-cell {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            white-space: nowrap;

            .op-btn {
              padding: 0;
              margin: 0;
              font-size: 12px;
              line-height: 1;
              border: none;
              background: none;
              flex-shrink: 0;

              &.primary-btn {
                color: $primary-color;

                &:hover {
                  color: $primary-light;
                }

                &:active {
                  color: #3a8ee6;
                }
              }
            }

            .op-divider {
              display: inline-block;
              margin: 0 8px;
              color: #dcdfe6;
              font-size: 12px;
              flex-shrink: 0;
            }
          }
        }

        // 公摊组表格保持原样
        ::v-deep .el-table:not(.device-table) {
          border-radius: 8px;
          overflow: hidden;

          .el-table__header {
            th {
              background: #fafbfc;
              color: $text-primary;
              font-weight: 600;
              font-size: 13px;
              padding: 12px 0;
            }
          }

          .el-table__body {
            tr {
              &:hover>td {
                background: #f5f7fa !important;
              }
            }

            td {
              padding: 12px 0;
              font-size: 13px;
              color: $text-regular;
            }
          }
        }

        ::v-deep .el-empty {
          padding: 40px 0 0 0;
        }
      }
    }

    .empty-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      margin: 0;
    }
  }
}

// ==================== 抽屉内容样式 ====================
.drawer-content {
  padding: 20px;
  height: 100%;
  overflow-y: auto;

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid $primary-color;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 40px;
      height: 2px;
      background: $primary-color;
    }
  }

  // ==================== 电表列表样式 ====================
  .meter-list {
    margin-bottom: 32px;

    .meter-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 8px;
      border: 1px solid $border-light;
      background: white;
      transition: all 0.3s ease;

      &.selected {
        border-color: $success-color;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f7fa 100%);
      }

      &.selectable {
        border-color: $primary-color;
        background: linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%);
      }

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .meter-info {
        flex: 1;
        margin-right: 16px;

        .meter-name {
          font-size: 15px;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 6px;
          word-break: break-all;
        }

        .meter-serial {
          font-size: 13px;
          color: $text-secondary;
          margin-bottom: 8px;
        }

        .meter-status {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;

          .balance {
            font-size: 13px;
            color: $text-regular;
          }
        }
      }

      ::v-deep .el-button {
        border-radius: 4px;
        font-size: 12px;
        min-width: 60px;
        flex-shrink: 0;
      }
    }

    .el-empty {
      padding: 20px 0;
    }
  }

  // ==================== 电表公摊组列表样式 ====================
  .share-list {
    margin-bottom: 32px;

    .share-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 8px;
      border: 1px solid $border-light;
      background: white;
      transition: all 0.3s ease;

      &.selected {
        border-color: $success-color;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f7fa 100%);
      }

      &.selectable {
        border-color: $primary-color;
        background: linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%);
      }

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .share-info {
        flex: 1;
        margin-right: 16px;

        .share-name {
          font-size: 15px;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 6px;
          word-break: break-all;
        }

        .share-details {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;

          .share-area {
            font-size: 13px;
            color: $text-regular;
          }

          .share-area-input {
            display: flex;
            align-items: center;
            font-size: 13px;
            color: $text-regular;
            margin-bottom: 8px;
            gap: 4px;
          }
        }
      }

      ::v-deep .el-button {
        border-radius: 4px;
        font-size: 12px;
        min-width: 60px;
        flex-shrink: 0;
      }
    }

    .el-empty {
      padding: 20px 0;
    }
  }

  // ==================== 水表列表样式 ====================
  .water-list {
    margin-bottom: 32px;

    .water-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 8px;
      border: 1px solid $border-light;
      background: white;
      transition: all 0.3s ease;

      &.selected {
        border-color: $success-color;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f7fa 100%);
      }

      &.selectable {
        border-color: $primary-color;
        background: linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%);
      }

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .water-info {
        flex: 1;
        margin-right: 16px;

        .water-name {
          font-size: 15px;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 6px;
          word-break: break-all;
        }

        .water-serial {
          font-size: 13px;
          color: $text-secondary;
          margin-bottom: 8px;
        }

        .water-details {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;

          .price {
            font-size: 13px;
            color: $text-regular;
          }

          .settle-rate-input {
            display: flex;
            align-items: center;
            font-size: 13px;
            color: $text-regular;
            margin-top: 8px;
            gap: 4px;
            width: 100%;
          }
        }
      }

      ::v-deep .el-button {
        border-radius: 4px;
        font-size: 12px;
        min-width: 60px;
        flex-shrink: 0;
      }
    }

    .el-empty {
      padding: 20px 0;
    }
  }

  // ==================== 水表公摊组列表样式 ====================
  .water-share-list {
    margin-bottom: 32px;

    .water-share-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 8px;
      border: 1px solid $border-light;
      background: white;
      transition: all 0.3s ease;

      &.selected {
        border-color: $success-color;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f7fa 100%);
      }

      &.selectable {
        border-color: $primary-color;
        background: linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%);
      }

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .water-share-info {
        flex: 1;
        margin-right: 16px;

        .water-share-name {
          font-size: 15px;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 6px;
          word-break: break-all;
        }

        .water-share-details {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .water-share-area {
            font-size: 13px;
            color: $text-regular;
          }

          .water-share-area-input {
            display: flex;
            align-items: center;
            font-size: 13px;
            color: $text-regular;
            gap: 4px;
          }

          .water-share-time {
            font-size: 12px;
            color: $text-secondary;
          }
        }
      }

      ::v-deep .el-button {
        border-radius: 4px;
        font-size: 12px;
        min-width: 60px;
        flex-shrink: 0;
      }
    }

    .el-empty {
      padding: 20px 0;
    }
  }

  // ==================== 空调列表样式 ====================
  .air-list {
    margin-bottom: 32px;

    .air-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 8px;
      border: 1px solid $border-light;
      background: white;
      transition: all 0.3s ease;

      &.selected {
        border-color: $success-color;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f7fa 100%);
      }

      &.selectable {
        border-color: $primary-color;
        background: linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%);
      }

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .air-info {
        flex: 1;
        margin-right: 16px;

        .air-name {
          font-size: 15px;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 6px;
          word-break: break-all;
        }

        .air-serial {
          font-size: 13px;
          color: $text-secondary;
          margin-bottom: 8px;
        }

        .air-status {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;

          .air-mode {
            font-size: 13px;
            color: $text-regular;
          }
        }
      }

      ::v-deep .el-button {
        border-radius: 4px;
        font-size: 12px;
        min-width: 60px;
        flex-shrink: 0;
      }
    }

    .el-empty {
      padding: 20px 0;
    }
  }

  // ==================== 空调公摊组列表样式 ====================
  .air-share-list {
    margin-bottom: 32px;

    .air-share-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 8px;
      border: 1px solid $border-light;
      background: white;
      transition: all 0.3s ease;

      &.selected {
        border-color: $success-color;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f7fa 100%);
      }

      &.selectable {
        border-color: $primary-color;
        background: linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%);
      }

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .air-share-info {
        flex: 1;
        margin-right: 16px;

        .air-share-name {
          font-size: 15px;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 6px;
          word-break: break-all;
        }

        .air-share-details {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;

          .air-share-area {
            font-size: 13px;
            color: $text-regular;
          }

          .air-share-area-input {
            display: flex;
            align-items: center;
            font-size: 13px;
            color: $text-regular;
            margin-bottom: 8px;
            gap: 4px;
          }
        }
      }

      ::v-deep .el-button {
        border-radius: 4px;
        font-size: 12px;
        min-width: 60px;
        flex-shrink: 0;
      }
    }

    .el-empty {
      padding: 20px 0;
    }
  }
}

// ==================== 响应式设计 ====================
@media (max-width: 768px) {
  .tenant-devices {
    .device-type-cards {
      .device-type-card {
        min-width: 180px;
      }
    }
  }

  .drawer-content {
    padding: 16px;

    .meter-list,
    .share-list,
    .water-list,
    .water-share-list,
    .air-list,
    .air-share-list {

      .meter-item,
      .share-item,
      .water-item,
      .water-share-item,
      .air-item,
      .air-share-item {
        flex-direction: column;
        gap: 12px;

        .meter-info,
        .share-info,
        .water-info,
        .water-share-info,
        .air-info,
        .air-share-info {
          margin-right: 0;
        }

        ::v-deep .el-button {
          align-self: flex-end;
        }
      }
    }
  }
}
</style>