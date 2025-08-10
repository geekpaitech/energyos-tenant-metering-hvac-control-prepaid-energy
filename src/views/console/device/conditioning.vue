<template>
  <div class="hvac-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">空调管理</h2>
      </div>
      <div class="header-right">
        <div class="header-stats">
          <div class="stat-badge">
            <span class="stat-dot online"></span>
            <span>在线 {{ stats.online }}/{{ stats.total }}</span>
          </div>
          <div class="stat-badge">
            <span class="stat-dot running"></span>
            <span>运行 {{ stats.running }}</span>
          </div>
        </div>
        <span class="update-time">{{ lastUpdateTime }}</span>
        <button class="btn-icon" @click="refreshData" title="刷新数据">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 功能操作栏 -->
    <div class="action-bar">
      <div class="action-left">
        <!-- 搜索框 -->
        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索设备编号、名称、位置..."
            @input="handleSearch"
          />
          <svg
            class="search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        <!-- 筛选器 -->
        <div class="filter-group">
          <select
            v-model="filterStatus"
            @change="applyFilters"
            class="filter-select"
          >
            <option value="">全部状态</option>
            <option value="online">在线</option>
            <option value="offline">离线</option>
            <option value="running">运行中</option>
            <option value="standby">待机</option>
            <option value="fault">故障</option>
          </select>

          <select
            v-model="filterArea"
            @change="applyFilters"
            class="filter-select"
          >
            <option value="">全部区域</option>
            <option v-for="area in areas" :key="area.id" :value="area.id">
              {{ area.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="action-right">
        <button class="btn-secondary" @click="exportData">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
            />
          </svg>
          导出数据
        </button>
        <button class="btn-secondary" @click="showBatchControl = true">
          批量操作
        </button>
        <button class="btn-primary" @click="showAddDevice = true">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          添加设备
        </button>
      </div>
    </div>

    <!-- 视图切换 -->
    <div class="view-switcher">
      <div class="view-tabs">
        <button
          :class="['view-tab', { active: viewMode === 'card' }]"
          @click="viewMode = 'card'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          卡片视图
        </button>
        <button
          :class="['view-tab', { active: viewMode === 'table' }]"
          @click="viewMode = 'table'"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <rect x="3" y="5" width="18" height="14" rx="1" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="8" y1="5" x2="8" y2="19" />
            <line x1="16" y1="5" x2="16" y2="19" />
          </svg>
          列表视图
        </button>
      </div>

      <div class="pagination-info">共 {{ filteredDevices.length }} 台设备</div>
    </div>

    <!-- 设备卡片视图 -->
    <div v-if="viewMode === 'card'" class="devices-container">
      <div class="devices-grid">
        <div
          v-for="device in paginatedDevices"
          :key="device.id"
          :class="[
            'device-card',
            {
              'is-offline': !device.online,
              'is-fault': device.status === 'fault',
              'is-selected': selectedDevices.includes(device.id),
            },
          ]"
        >
          <!-- 选择框 -->
          <div class="card-selector">
            <input
              type="checkbox"
              :checked="selectedDevices.includes(device.id)"
              @change="toggleDeviceSelection(device.id)"
            />
          </div>

          <!-- 状态标识 -->
          <div class="card-status">
            <span :class="['status-badge', getStatusClass(device)]">
              {{ getStatusText(device) }}
            </span>
            <div class="card-menu">
              <button class="menu-trigger" @click="toggleMenu(device.id)">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              <div v-if="activeMenu === device.id" class="menu-dropdown">
                <button @click="editDevice(device)">编辑</button>
                <button @click="viewDetails(device)" class="detail-link">详情</button>
                <button @click="duplicateDevice(device)">复制</button>
                <button class="danger" @click="confirmDelete(device)">
                  删除
                </button>
              </div>
            </div>
          </div>

          <!-- 设备信息 -->
          <div class="card-body">
            <div class="device-header">
              <div class="device-id">{{ device.id }}</div>
              <div class="device-name">{{ device.name }}</div>
            </div>
            
            <div class="device-location">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {{ device.location }}
            </div>

            <!-- 核心数据 -->
            <div class="temp-display">
              <div class="current-temp">
                <span class="temp-label">室温</span>
                <span class="temp-value">{{ device.currentTemp }}°</span>
              </div>
              <div class="target-temp" v-if="device.power">
                <span class="temp-label">目标</span>
                <span class="temp-value target">{{ device.setTemp }}°</span>
              </div>
            </div>

            <!-- 运行信息 -->
            <div class="device-info">
              <div class="info-item">
                <span class="info-label">模式</span>
                <span class="info-value">{{ modeMap[device.mode] }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">功率</span>
                <span class="info-value">{{ device.powerUsage }}kW</span>
              </div>
            </div>
          </div>

          <!-- 快速控制 -->
          <div class="card-controls">
            <button
              :class="['power-btn', { active: device.power }]"
              @click="togglePower(device)"
              :disabled="!device.online"
              :title="device.power ? '关闭' : '开启'"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" />
              </svg>
            </button>

            <div class="temp-control">
              <button
                @click="adjustTemp(device, -1)"
                :disabled="
                  !device.online || !device.power || device.setTemp <= 16
                "
                class="temp-adjust"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <span class="temp-display-mini">{{ device.setTemp }}°</span>
              <button
                @click="adjustTemp(device, 1)"
                :disabled="
                  !device.online || !device.power || device.setTemp >= 30
                "
                class="temp-adjust"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>

            <button
              class="detail-btn"
              @click="openDeviceDetail(device)"
              :disabled="!device.online"
            >
              控制
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 表格视图 -->
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleAllSelection"
              />
            </th>
            <th @click="sortBy('id')" class="sortable">
              设备编号
              <span class="sort-icon" v-if="sortField === 'id'">
                {{ sortOrder === "asc" ? "↑" : "↓" }}
              </span>
            </th>
            <th>设备名称</th>
            <th>所在位置</th>
            <th @click="sortBy('status')" class="sortable">
              状态
              <span class="sort-icon" v-if="sortField === 'status'">
                {{ sortOrder === "asc" ? "↑" : "↓" }}
              </span>
            </th>
            <th>当前温度</th>
            <th>设定温度</th>
            <th>运行模式</th>
            <th @click="sortBy('powerUsage')" class="sortable">
              功率(kW)
              <span class="sort-icon" v-if="sortField === 'powerUsage'">
                {{ sortOrder === "asc" ? "↑" : "↓" }}
              </span>
            </th>
            <th>最后更新</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="device in paginatedDevices"
            :key="device.id"
            :class="{ selected: selectedDevices.includes(device.id) }"
          >
            <td class="checkbox-col">
              <input
                type="checkbox"
                :checked="selectedDevices.includes(device.id)"
                @change="toggleDeviceSelection(device.id)"
              />
            </td>
            <td class="device-id-col">{{ device.id }}</td>
            <td>{{ device.name }}</td>
            <td>{{ device.location }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(device)]">
                {{ getStatusText(device) }}
              </span>
            </td>
            <td>{{ device.currentTemp }}°C</td>
            <td class="editable">
              <input
                type="number"
                :value="device.setTemp"
                @change="updateSetTemp(device, $event)"
                min="16"
                max="30"
                class="inline-input"
              />
            </td>
            <td>
              <select
                :value="device.mode"
                @change="updateMode(device, $event)"
                class="inline-select"
              >
                <option
                  v-for="mode in modes"
                  :key="mode.value"
                  :value="mode.value"
                >
                  {{ mode.label }}
                </option>
              </select>
            </td>
            <td>{{ device.powerUsage }}</td>
            <td>{{ device.lastUpdate }}</td>
            <td class="action-col">
              <button class="btn-text-small" @click="editDevice(device)">
                编辑
              </button>
              <button
                class="btn-text-small btn-link"
                @click="viewDetails(device)"
              >
                详情
              </button>
              <button
                class="btn-text-small danger"
                @click="confirmDelete(device)"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <button
        class="page-btn"
        @click="currentPage = 1"
        :disabled="currentPage === 1"
      >
        首页
      </button>
      <button
        class="page-btn"
        @click="currentPage--"
        :disabled="currentPage === 1"
      >
        上一页
      </button>

      <div class="page-numbers">
        <button
          v-for="page in displayPages"
          :key="page"
          :class="['page-number', { active: page === currentPage }]"
          @click="currentPage = page"
          v-if="page !== '...'"
        >
          {{ page }}
        </button>
        <span v-else class="page-ellipsis">...</span>
      </div>

      <button
        class="page-btn"
        @click="currentPage++"
        :disabled="currentPage === totalPages"
      >
        下一页
      </button>
      <button
        class="page-btn"
        @click="currentPage = totalPages"
        :disabled="currentPage === totalPages"
      >
        末页
      </button>

      <div class="page-size">
        <span>每页</span>
        <select v-model.number="pageSize" @change="currentPage = 1">
          <option value="12">12</option>
          <option value="24">24</option>
          <option value="36">36</option>
        </select>
        <span>条</span>
      </div>
    </div>

    <!-- 添加/编辑设备弹窗 -->
    <div
      v-if="showAddDevice || showEditDevice"
      class="modal-overlay"
      @click.self="closeDeviceForm"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ showEditDevice ? "编辑设备" : "添加设备" }}</h3>
          <button class="modal-close" @click="closeDeviceForm">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="saveDevice" class="device-form">
            <div class="form-group">
              <label class="required">设备编号</label>
              <input
                type="text"
                v-model="deviceForm.id"
                placeholder="如：AC001"
                required
                :disabled="showEditDevice"
              />
            </div>

            <div class="form-group">
              <label class="required">设备名称</label>
              <input
                type="text"
                v-model="deviceForm.name"
                placeholder="如：中央空调-01"
                required
              />
            </div>

            <!-- 绑定租户折叠框 -->
            <div class="tenant-collapse">
              <div
                class="collapse-header"
                @click="tenantCollapseOpen = !tenantCollapseOpen"
              >
                <span>绑定区域</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  :class="{ 'rotate-90': tenantCollapseOpen }"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>

              <div class="collapse-content" v-show="tenantCollapseOpen">
                <div class="form-row">
                  <div class="form-group">
                    <label class="required">楼栋</label>
                    <select v-model="deviceForm.building" required @change="onBuildingChange">
                      <option value="">请选择</option>
                      <option value="A">中心大厦A栋</option>
                      <option value="B">创新大厦B栋</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="required">楼层区域</label>
                    <select v-model="deviceForm.floorArea" required>
                      <option value="">请选择</option>
                      <option 
                        v-for="area in availableFloorAreas" 
                        :key="area.id" 
                        :value="area.id"
                      >
                        {{ area.name }}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label>房间号</label>
                  <input
                    type="text"
                    v-model="deviceForm.room"
                    placeholder="如：1318室（可选）"
                  />
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>品牌</label>
                <select v-model="deviceForm.brand">
                  <option value="格力">格力</option>
                  <option value="美的">美的</option>
                  <option value="大金">大金</option>
                  <option value="海尔">海尔</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              <div class="form-group">
                <label>型号</label>
                <input
                  type="text"
                  v-model="deviceForm.model"
                  placeholder="设备型号"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>额定功率(kW)</label>
                <input
                  type="number"
                  v-model.number="deviceForm.ratedPower"
                  step="0.1"
                  placeholder="如：3.5"
                />
              </div>

              <div class="form-group">
                <label>安装日期</label>
                <input type="date" v-model="deviceForm.installDate" />
              </div>
            </div>

            <div class="form-group">
              <label>备注</label>
              <textarea
                v-model="deviceForm.remark"
                rows="3"
                placeholder="其他备注信息..."
              ></textarea>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button class="btn-default" @click="closeDeviceForm">取消</button>
          <button class="btn-primary" @click="saveDevice">
            {{ showEditDevice ? "保存修改" : "添加设备" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 批量控制弹窗 -->
    <div
      v-if="showBatchControl"
      class="modal-overlay"
      @click.self="showBatchControl = false"
    >
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3>批量控制 (已选择 {{ selectedDevices.length }} 台设备)</h3>
          <button class="modal-close" @click="showBatchControl = false">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- 快速操作 -->
          <div class="batch-section">
            <h4>快速操作</h4>
            <div class="quick-actions-grid">
              <button
                :class="[
                  'quick-action',
                  {
                    selected: quickActionSelected === 'powerOn',
                    disabled: selectedDevices.length === 0,
                  },
                ]"
                @click="batchAction('powerOn')"
                :disabled="selectedDevices.length === 0"
              >
                <div class="quick-action-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" />
                  </svg>
                </div>
                <span>全部开启</span>
                <div
                  class="action-badge"
                  v-if="quickActionSelected === 'powerOn'"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
              </button>

              <button
                :class="[
                  'quick-action',
                  {
                    selected: quickActionSelected === 'powerOff',
                    disabled: selectedDevices.length === 0,
                  },
                ]"
                @click="batchAction('powerOff')"
                :disabled="selectedDevices.length === 0"
              >
                <div class="quick-action-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M4.93 4.93l14.14 14.14" />
                  </svg>
                </div>
                <span>全部关闭</span>
                <div
                  class="action-badge"
                  v-if="quickActionSelected === 'powerOff'"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
              </button>

              <button
                :class="[
                  'quick-action',
                  {
                    selected: quickActionSelected === 'setTemp_26',
                    disabled: selectedDevices.length === 0,
                  },
                ]"
                @click="batchAction('setTemp', 26)"
                :disabled="selectedDevices.length === 0"
              >
                <div class="quick-action-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"
                    />
                  </svg>
                </div>
                <span>设为26°C</span>
                <div
                  class="action-badge"
                  v-if="quickActionSelected === 'setTemp_26'"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
              </button>

              <button
                :class="[
                  'quick-action',
                  {
                    selected: quickActionSelected === 'setMode_cool',
                    disabled: selectedDevices.length === 0,
                  },
                ]"
                @click="batchAction('setMode', 'cool')"
                :disabled="selectedDevices.length === 0"
              >
                <div class="quick-action-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M22 11h-4l-3 9L9 2l-3 9H2" />
                  </svg>
                </div>
                <span>制冷模式</span>
                <div
                  class="action-badge"
                  v-if="quickActionSelected === 'setMode_cool'"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <!-- 参数设置 -->
          <div class="batch-section">
            <h4>参数设置</h4>
            <div class="batch-form">
              <div class="form-row">
                <div class="form-group">
                  <label>温度设定</label>
                  <div class="input-group">
                    <input
                      type="number"
                      v-model.number="batchSettings.temperature"
                      min="16"
                      max="30"
                    />
                    <span class="input-suffix">°C</span>
                  </div>
                </div>

                <div class="form-group">
                  <label>运行模式</label>
                  <select v-model="batchSettings.mode">
                    <option value="">不修改</option>
                    <option
                      v-for="mode in modes"
                      :key="mode.value"
                      :value="mode.value"
                    >
                      {{ mode.label }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label>风速</label>
                  <select v-model="batchSettings.fanSpeed">
                    <option value="">不修改</option>
                    <option
                      v-for="speed in fanSpeeds"
                      :key="speed.value"
                      :value="speed.value"
                    >
                      {{ speed.label }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- 定时任务 -->
          <div class="batch-section">
            <h4>定时任务</h4>
            <div class="schedule-settings">
              <div class="form-row">
                <div class="form-group">
                  <label>开启时间</label>
                  <input type="time" v-model="schedule.startTime" />
                </div>

                <div class="form-group">
                  <label>关闭时间</label>
                  <input type="time" v-model="schedule.endTime" />
                </div>

                <div class="form-group">
                  <label>重复周期</label>
                  <select v-model="schedule.repeat">
                    <option value="once">单次</option>
                    <option value="daily">每天</option>
                    <option value="weekdays">工作日</option>
                    <option value="custom">自定义</option>
                  </select>
                </div>
              </div>

              <div v-if="schedule.repeat === 'custom'" class="weekday-selector">
                <label
                  v-for="day in weekdays"
                  :key="day.value"
                  class="weekday-checkbox"
                >
                  <input
                    type="checkbox"
                    :value="day.value"
                    v-model="schedule.days"
                  />
                  <span>{{ day.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-default" @click="closeBatchControl">取消</button>
          <button class="btn-primary" @click="applyBatchControl">
            应用设置
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div
      v-if="showDeleteConfirm"
      class="modal-overlay"
      @click.self="showDeleteConfirm = false"
    >
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>确认删除</h3>
        </div>
        <div class="modal-body">
          <p>
            确定要删除设备 <strong>{{ deviceToDelete?.name }}</strong> 吗？
          </p>
          <p class="text-muted">此操作不可恢复，请谨慎操作。</p>
        </div>
        <div class="modal-footer">
          <button class="btn-default" @click="showDeleteConfirm = false">
            取消
          </button>
          <button class="btn-danger" @click="deleteDevice">确认删除</button>
        </div>
      </div>
    </div>

    <!-- 设备详情控制弹窗 -->
    <div
      v-if="showDeviceDetail"
      class="modal-overlay"
      @click.self="closeDeviceDetail"
    >
      <div class="modal-content modal-device-detail">
        <div class="modal-header">
          <div class="device-header-info">
            <h3>{{ currentDevice?.name }}</h3>
            <div class="device-meta">
              <span
                :class="['status-dot', getStatusClass(currentDevice)]"
              ></span>
              <span class="device-location-text">{{
                currentDevice?.location
              }}</span>
            </div>
          </div>
          <button class="modal-close" @click="closeDeviceDetail">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="modal-body device-detail-body">
          <!-- 实时状态卡片 -->
          <div class="status-card">
            <h4>实时状态</h4>
            <div class="status-items">
              <div class="status-item">
                <div class="status-icon temp-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"
                    />
                  </svg>
                </div>
                <div class="status-info">
                  <span class="status-label">室内温度</span>
                  <span class="status-value"
                    >{{ currentDevice?.currentTemp }}°C</span
                  >
                </div>
              </div>

              <div class="status-item">
                <div class="status-icon power-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M22 11h-4l-3 9L9 2l-3 9H2" />
                  </svg>
                </div>
                <div class="status-info">
                  <span class="status-label">功率</span>
                  <span class="status-value"
                    >{{ currentDevice?.powerUsage }}kW</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- 基础控制 -->
          <div class="control-card">
            <h4>基础控制</h4>

            <!-- 电源开关 -->
            <div class="control-row">
              <div class="control-info">
                <span class="control-title">电源</span>
                <span class="control-desc">设备开关控制</span>
              </div>
              <div class="control-action">
                <label class="power-switch">
                  <input
                    type="checkbox"
                    v-model="deviceDetailForm.power"
                    :disabled="!currentDevice?.online"
                  />
                  <span class="power-slider"></span>
                </label>
              </div>
            </div>

            <!-- 温度设置 -->
            <div class="control-row" v-if="deviceDetailForm.power">
              <div class="control-info">
                <span class="control-title">目标温度</span>
                <span class="control-desc"
                  >当前设定 {{ deviceDetailForm.setTemp }}°C</span
                >
              </div>
              <div class="control-action">
                <div class="temp-adjuster">
                  <button
                    class="temp-btn minus"
                    @click="
                      deviceDetailForm.setTemp = Math.max(
                        16,
                        deviceDetailForm.setTemp - 1
                      )
                    "
                    :disabled="deviceDetailForm.setTemp <= 16"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <div class="temp-value">{{ deviceDetailForm.setTemp }}°</div>
                  <button
                    class="temp-btn plus"
                    @click="
                      deviceDetailForm.setTemp = Math.min(
                        30,
                        deviceDetailForm.setTemp + 1
                      )
                    "
                    :disabled="deviceDetailForm.setTemp >= 30"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- 模式选择 -->
            <div class="control-row" v-if="deviceDetailForm.power">
              <div class="control-info">
                <span class="control-title">运行模式</span>
                <span class="control-desc">{{
                  modeMap[deviceDetailForm.mode]
                }}</span>
              </div>
              <div class="control-action">
                <div class="mode-selector">
                  <button
                    v-for="mode in modes"
                    :key="mode.value"
                    :class="[
                      'mode-option',
                      { active: deviceDetailForm.mode === mode.value },
                    ]"
                    @click="deviceDetailForm.mode = mode.value"
                  >
                    {{ mode.label }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 风速设置 -->
            <div class="control-row" v-if="deviceDetailForm.power">
              <div class="control-info">
                <span class="control-title">风速</span>
                <span class="control-desc">{{
                  windMap[deviceDetailForm.fanSpeed]
                }}</span>
              </div>
              <div class="control-action">
                <div class="fan-selector">
                  <button
                    v-for="speed in fanSpeeds"
                    :key="speed.value"
                    :class="[
                      'fan-option',
                      { active: deviceDetailForm.fanSpeed === speed.value },
                    ]"
                    @click="deviceDetailForm.fanSpeed = speed.value"
                  >
                    {{ speed.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 高级设置 -->
          <div class="control-card" v-if="deviceDetailForm.power">
            <h4>高级设置</h4>

            <!-- 摆风设置 -->
            <div class="control-row">
              <div class="control-info">
                <span class="control-title">摆风设置</span>
                <span class="control-desc">自动调节出风方向</span>
              </div>
              <div class="control-action">
                <div class="swing-options">
                  <label class="swing-checkbox">
                    <input type="checkbox" v-model="deviceDetailForm.swingH" />
                    <span class="checkmark"></span>
                    <span class="swing-label">水平</span>
                  </label>
                  <label class="swing-checkbox">
                    <input type="checkbox" v-model="deviceDetailForm.swingV" />
                    <span class="checkmark"></span>
                    <span class="swing-label">垂直</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- 定时设置 -->
            <div class="control-row">
              <div class="control-info">
                <span class="control-title">定时功能</span>
                <span class="control-desc">自动开关机设置</span>
              </div>
              <div class="control-action">
                <div class="timer-settings">
                  <div class="timer-group">
                    <label class="timer-checkbox">
                      <input
                        type="checkbox"
                        v-model="deviceDetailForm.timerOn"
                      />
                      <span class="checkmark"></span>
                      <span class="timer-label">定时开启</span>
                    </label>
                    <input
                      type="time"
                      v-model="deviceDetailForm.timerOnTime"
                      :disabled="!deviceDetailForm.timerOn"
                      class="timer-input"
                    />
                  </div>
                  <div class="timer-group">
                    <label class="timer-checkbox">
                      <input
                        type="checkbox"
                        v-model="deviceDetailForm.timerOff"
                      />
                      <span class="checkmark"></span>
                      <span class="timer-label">定时关闭</span>
                    </label>
                    <input
                      type="time"
                      v-model="deviceDetailForm.timerOffTime"
                      :disabled="!deviceDetailForm.timerOff"
                      class="timer-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-default" @click="closeDeviceDetail">取消</button>
          <button
            class="btn-primary"
            @click="applyDeviceDetail"
            :disabled="!currentDevice?.online"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <polyline points="20,6 9,17 4,12" />
            </svg>
            应用设置
          </button>
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <transition name="toast">
      <div v-if="toast.show" :class="['toast', toast.type]">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: "HvacManagement",

  data() {
    return {
      tenantCollapseOpen: true,
      quickActionSelected: null,
      showDeviceDetail: false,
      
      // 设备详情表单
      deviceDetailForm: {
        power: false,
        setTemp: 24,
        mode: "cool",
        fanSpeed: "auto",
        swingH: false,
        swingV: false,
        timerOn: false,
        timerOff: false,
        timerOnTime: "08:00",
        timerOffTime: "22:00",
      },
      
      // 时间相关
      lastUpdateTime: "",
      updateTimer: null,

      // 视图控制
      viewMode: "card",
      currentPage: 1,
      pageSize: 12,

      // 搜索和筛选
      searchQuery: "",
      filterStatus: "",
      filterArea: "",
      sortField: "",
      sortOrder: "asc",

      // 选择相关
      selectedDevices: [],
      activeMenu: null,

      // 弹窗控制
      showAddDevice: false,
      showEditDevice: false,
      showBatchControl: false,
      showDeleteConfirm: false,

      // 当前操作的设备
      currentDevice: null,
      deviceToDelete: null,

      // 设备表单
      deviceForm: {
        id: "",
        name: "",
        building: "",
        floorArea: "",
        room: "",
        brand: "格力",
        model: "",
        ratedPower: 3.5,
        installDate: "",
        remark: "",
      },

      // 批量设置
      batchSettings: {
        temperature: 26,
        mode: "",
        fanSpeed: "",
      },

      // 定时任务
      schedule: {
        startTime: "08:00",
        endTime: "18:00",
        repeat: "weekdays",
        days: [1, 2, 3, 4, 5],
      },

      // 消息提示
      toast: {
        show: false,
        message: "",
        type: "success",
      },

      // 统计数据
      stats: {
        total: 52,
        online: 48,
        running: 35,
        avgTemp: 24.8,
        totalPower: 126.4,
      },

      // 区域数据 - 基于您的层级结构
      areas: [
        { id: "A", name: "中心大厦A栋" },
        { id: "B", name: "创新大厦B栋" }
      ],

      // 楼层区域映射
      floorAreaMap: {
        A: [
          { id: "A1F", name: "1F展销大厅" },
          { id: "A2F", name: "2F会议接待厅" },
          { id: "A3F", name: "3F市场营销部" },
          { id: "A4F", name: "4F技术研发部" },
          { id: "A5F", name: "5F行政办公室" }
        ],
        B: [
          { id: "BB1", name: "B1地下停车库" },
          { id: "B1F", name: "1F接待大厅" },
          { id: "B2F", name: "2F餐厅食堂" },
          { id: "B3F", name: "3F技术研发" }
        ]
      },

      // 设备列表 - 基于真实区域层级
      devices: [],

      // 映射表
      modeMap: {
        cool: "制冷",
        heat: "制热",
        dry: "除湿",
        fan: "送风",
        auto: "自动",
      },

      windMap: {
        low: "低风",
        mid: "中风",
        high: "高风",
        auto: "自动",
      },

      // 选项列表
      modes: [
        { value: "cool", label: "制冷" },
        { value: "heat", label: "制热" },
        { value: "dry", label: "除湿" },
        { value: "fan", label: "送风" },
        { value: "auto", label: "自动" },
      ],

      fanSpeeds: [
        { value: "low", label: "低速" },
        { value: "mid", label: "中速" },
        { value: "high", label: "高速" },
        { value: "auto", label: "自动" },
      ],

      weekdays: [
        { value: 1, label: "周一" },
        { value: 2, label: "周二" },
        { value: 3, label: "周三" },
        { value: 4, label: "周四" },
        { value: 5, label: "周五" },
        { value: 6, label: "周六" },
        { value: 0, label: "周日" },
      ],
    };
  },

  computed: {
    // 可用的楼层区域
    availableFloorAreas() {
      return this.floorAreaMap[this.deviceForm.building] || []
    },

    // 过滤后的设备列表
    filteredDevices() {
      let result = [...this.devices];

      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(
          (device) =>
            device.id.toLowerCase().includes(query) ||
            device.name.toLowerCase().includes(query) ||
            device.location.toLowerCase().includes(query)
        );
      }

      // 状态过滤
      if (this.filterStatus) {
        result = result.filter((device) => {
          switch (this.filterStatus) {
            case "online":
              return device.online;
            case "offline":
              return !device.online;
            case "running":
              return device.status === "running";
            case "standby":
              return device.status === "standby";
            case "fault":
              return device.status === "fault";
            default:
              return true;
          }
        });
      }

      // 区域过滤
      if (this.filterArea) {
        result = result.filter((device) => device.building === this.filterArea);
      }

      // 排序
      if (this.sortField) {
        result.sort((a, b) => {
          let aVal = a[this.sortField];
          let bVal = b[this.sortField];

          if (typeof aVal === "string") {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }

          if (this.sortOrder === "asc") {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
          }
        });
      }

      return result;
    },

    // 分页后的设备列表
    paginatedDevices() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredDevices.slice(start, end);
    },

    // 总页数
    totalPages() {
      return Math.ceil(this.filteredDevices.length / this.pageSize);
    },

    // 显示的页码
    displayPages() {
      const pages = [];
      const total = this.totalPages;
      const current = this.currentPage;

      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        if (current <= 3) {
          for (let i = 1; i <= 5; i++) {
            pages.push(i);
          }
          pages.push("...");
          pages.push(total);
        } else if (current >= total - 2) {
          pages.push(1);
          pages.push("...");
          for (let i = total - 4; i <= total; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push("...");
          for (let i = current - 1; i <= current + 1; i++) {
            pages.push(i);
          }
          pages.push("...");
          pages.push(total);
        }
      }

      return pages;
    },

    // 是否全选
    isAllSelected() {
      return (
        this.paginatedDevices.length > 0 &&
        this.paginatedDevices.every((device) =>
          this.selectedDevices.includes(device.id)
        )
      );
    },
  },

  mounted() {
    this.initializeData();
    this.startAutoUpdate();
    this.startSimulation();

    // 点击外部关闭菜单
    document.addEventListener("click", this.handleClickOutside);
  },

  beforeDestroy() {
    this.stopAutoUpdate();
    document.removeEventListener("click", this.handleClickOutside);
  },

  methods: {
    // 初始化数据
    initializeData() {
      this.updateTime();
      this.generateDevicesData();
      this.updateStats();
    },

    // 根据区域层级生成设备数据
    generateDevicesData() {
      const brands = ["格力", "美的", "大金", "海尔", "三菱"];
      const models = ["KFR-26GW", "KFR-35GW", "KFR-50GW", "FTXS35", "FTXS50"];
      
      let deviceCounter = 1;
      const devices = [];

      // 中心大厦A栋设备
      const aFloorAreas = [
        { id: "A1F", name: "1F展销大厅", count: 8, prefix: "展销" },
        { id: "A2F", name: "2F会议接待厅", count: 6, prefix: "会议" },
        { id: "A3F", name: "3F市场营销部", count: 10, prefix: "营销" },
        { id: "A4F", name: "4F技术研发部", count: 12, prefix: "研发" },
        { id: "A5F", name: "5F行政办公室", count: 8, prefix: "行政" }
      ];

      aFloorAreas.forEach(area => {
        for (let i = 1; i <= area.count; i++) {
          const device = {
            id: `AC${String(deviceCounter).padStart(3, "0")}`,
            name: `${area.prefix}空调-${String(i).padStart(2, "0")}`,
            building: "A",
            floorArea: area.id,
            floorAreaName: area.name,
            room: i <= 4 ? `${area.id.charAt(1)}0${i}` : "",
            location: `中心大厦A栋-${area.name}${i <= 4 ? `-${area.id.charAt(1)}0${i}室` : ''}`,
            online: Math.random() > 0.08,
            power: Math.random() > 0.35,
            status: this.getRandomStatus(),
            currentTemp: Math.floor(Math.random() * 8) + 22,
            setTemp: Math.floor(Math.random() * 6) + 22,
            mode: this.modes[Math.floor(Math.random() * this.modes.length)].value,
            fanSpeed: this.fanSpeeds[Math.floor(Math.random() * this.fanSpeeds.length)].value,
            swingH: Math.random() > 0.5,
            swingV: Math.random() > 0.5,
            powerUsage: (Math.random() * 3.5 + 0.5).toFixed(1),
            brand: brands[Math.floor(Math.random() * brands.length)],
            model: models[Math.floor(Math.random() * models.length)],
            installDate: this.getRandomDate(),
            lastUpdate: this.getRandomTime(),
          };
          
          devices.push(device);
          deviceCounter++;
        }
      });

      // 创新大厦B栋设备
      const bFloorAreas = [
        { id: "BB1", name: "B1地下停车库", count: 4, prefix: "停车" },
        { id: "B1F", name: "1F接待大厅", count: 3, prefix: "接待" },
        { id: "B2F", name: "2F餐厅食堂", count: 5, prefix: "餐厅" },
        { id: "B3F", name: "3F技术研发", count: 6, prefix: "研发" }
      ];

      bFloorAreas.forEach(area => {
        for (let i = 1; i <= area.count; i++) {
          const device = {
            id: `AC${String(deviceCounter).padStart(3, "0")}`,
            name: `${area.prefix}空调-${String(i).padStart(2, "0")}`,
            building: "B",
            floorArea: area.id,
            floorAreaName: area.name,
            room: i <= 3 ? `${area.id}${String(i).padStart(2, "0")}` : "",
            location: `创新大厦B栋-${area.name}${i <= 3 ? `-${area.id}${String(i).padStart(2, "0")}室` : ''}`,
            online: Math.random() > 0.08,
            power: Math.random() > 0.35,
            status: this.getRandomStatus(),
            currentTemp: Math.floor(Math.random() * 8) + 22,
            setTemp: Math.floor(Math.random() * 6) + 22,
            mode: this.modes[Math.floor(Math.random() * this.modes.length)].value,
            fanSpeed: this.fanSpeeds[Math.floor(Math.random() * this.fanSpeeds.length)].value,
            swingH: Math.random() > 0.5,
            swingV: Math.random() > 0.5,
            powerUsage: (Math.random() * 3.5 + 0.5).toFixed(1),
            brand: brands[Math.floor(Math.random() * brands.length)],
            model: models[Math.floor(Math.random() * models.length)],
            installDate: this.getRandomDate(),
            lastUpdate: this.getRandomTime(),
          };
          
          devices.push(device);
          deviceCounter++;
        }
      });

      this.devices = devices;
    },

    // 楼栋选择变化处理
    onBuildingChange() {
      this.deviceForm.floorArea = "";
    },

    // 获取随机状态
    getRandomStatus() {
      const rand = Math.random();
      if (rand < 0.05) return "fault";
      if (rand < 0.2) return "standby";
      if (rand < 0.3) return "offline";
      return "running";
    },

    // 获取随机日期
    getRandomDate() {
      const start = new Date(2023, 0, 1);
      const end = new Date(2024, 0, 1);
      const date = new Date(
        start.getTime() + Math.random() * (end.getTime() - start.getTime())
      );
      return date.toISOString().split("T")[0];
    },

    // 获取随机时间
    getRandomTime() {
      const hours = Math.floor(Math.random() * 24);
      const minutes = Math.floor(Math.random() * 60);
      const seconds = Math.floor(Math.random() * 60);
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`;
    },

    // 更新时间
    updateTime() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      this.lastUpdateTime = `${hours}:${minutes}`;
    },

    // 自动更新
    startAutoUpdate() {
      this.updateTimer = setInterval(() => {
        this.updateTime();
        this.updateDeviceStatus();
      }, 60000);
    },

    stopAutoUpdate() {
      if (this.updateTimer) {
        clearInterval(this.updateTimer);
      }
    },

    // 更新设备状态
    updateDeviceStatus() {
      this.devices.forEach((device) => {
        device.lastUpdate = this.getRandomTime();
      });
    },

    // 开始模拟
    startSimulation() {
      setInterval(() => {
        this.simulateTemperatureChange();
        this.updateStats();
      }, 5000);
    },

    // 模拟温度变化
    simulateTemperatureChange() {
      this.devices.forEach((device) => {
        if (device.online && device.power && device.status === "running") {
          const diff = device.setTemp - device.currentTemp;
          if (Math.abs(diff) > 0.5) {
            const changeRate =
              device.mode === "cool"
                ? -0.3
                : device.mode === "heat"
                ? 0.3
                : diff > 0
                ? 0.2
                : -0.2;

            const speedMultiplier = {
              low: 0.7,
              mid: 1,
              high: 1.3,
              auto: 1,
            };

            const actualChange = changeRate * speedMultiplier[device.fanSpeed];
            device.currentTemp =
              Math.round((device.currentTemp + actualChange) * 10) / 10;

            if (
              (device.mode === "cool" && device.currentTemp < device.setTemp) ||
              (device.mode === "heat" && device.currentTemp > device.setTemp)
            ) {
              device.currentTemp = device.setTemp;
            }
          }
        }
      });
    },

    // 更新统计
    updateStats() {
      const online = this.devices.filter((d) => d.online);
      const running = online.filter((d) => d.power && d.status === "running");

      this.stats.total = this.devices.length;
      this.stats.online = online.length;
      this.stats.running = running.length;

      if (running.length > 0) {
        this.stats.avgTemp = (
          running.reduce((sum, d) => sum + d.currentTemp, 0) / running.length
        ).toFixed(1);
        this.stats.totalPower = running
          .reduce((sum, d) => sum + parseFloat(d.powerUsage), 0)
          .toFixed(1);
      }
    },

    // 刷新数据
    refreshData() {
      this.updateTime();
      this.updateDeviceStatus();
      this.updateStats();
      this.showToast("数据已刷新", "success");
    },

    // 搜索处理
    handleSearch() {
      this.currentPage = 1;
    },

    // 应用筛选
    applyFilters() {
      this.currentPage = 1;
    },

    // 排序
    sortBy(field) {
      if (this.sortField === field) {
        this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
      } else {
        this.sortField = field;
        this.sortOrder = "asc";
      }
    },

    // 查看详情
    viewDetails(device) {
      this.$router.push({
        path: `/device/conditioning/detail/${device.id}`,
        query: { 
          name: device.name,
          building: device.building,
          floorArea: device.floorAreaName,
          deviceId: device.id
        }
      });
    },

    // 设备选择
    toggleDeviceSelection(deviceId) {
      const index = this.selectedDevices.indexOf(deviceId);
      if (index > -1) {
        this.selectedDevices.splice(index, 1);
      } else {
        this.selectedDevices.push(deviceId);
      }
    },

    toggleAllSelection() {
      if (this.isAllSelected) {
        this.paginatedDevices.forEach((device) => {
          const index = this.selectedDevices.indexOf(device.id);
          if (index > -1) {
            this.selectedDevices.splice(index, 1);
          }
        });
      } else {
        this.paginatedDevices.forEach((device) => {
          if (!this.selectedDevices.includes(device.id)) {
            this.selectedDevices.push(device.id);
          }
        });
      }
    },

    // 菜单控制
    toggleMenu(deviceId) {
      if (this.activeMenu === deviceId) {
        this.activeMenu = null;
      } else {
        this.activeMenu = deviceId;
      }
    },

    handleClickOutside(e) {
      if (!e.target.closest(".card-menu")) {
        this.activeMenu = null;
      }
    },

    // 获取状态类名
    getStatusClass(device) {
      if (!device.online) return "offline";
      if (device.status === "fault") return "fault";
      if (device.power) return "running";
      return "standby";
    },

    // 获取状态文本
    getStatusText(device) {
      if (!device.online) return "离线";
      if (device.status === "fault") return "故障";
      if (device.power) return "运行中";
      return "待机";
    },

    // 设备控制
    togglePower(device) {
      device.power = !device.power;
      if (!device.power) {
        device.powerUsage = 0;
        device.status = "standby";
      } else {
        device.powerUsage = this.calculatePower(device);
        device.status = "running";
      }
      this.updateStats();
      this.showToast(
        `设备 ${device.name} 已${device.power ? "开启" : "关闭"}`,
        "success"
      );
    },

    adjustTemp(device, delta) {
      const newTemp = device.setTemp + delta;
      if (newTemp >= 16 && newTemp <= 30) {
        device.setTemp = newTemp;
        if (device.power) {
          device.powerUsage = this.calculatePower(device);
        }
      }
    },

    updateSetTemp(device, event) {
      const value = parseInt(event.target.value);
      if (value >= 16 && value <= 30) {
        device.setTemp = value;
        if (device.power) {
          device.powerUsage = this.calculatePower(device);
        }
      }
    },

    updateMode(device, event) {
      device.mode = event.target.value;
      if (device.power) {
        device.powerUsage = this.calculatePower(device);
      }
    },

    calculatePower(device) {
      const baseMap = { cool: 3, heat: 3.5, dry: 2, fan: 0.5, auto: 2.5 };
      const speedMap = { low: 0.8, mid: 1, high: 1.2, auto: 1 };
      return (baseMap[device.mode] * speedMap[device.fanSpeed]).toFixed(1);
    },

    // 打开设备详情
    openDeviceDetail(device) {
      this.currentDevice = device;
      this.deviceDetailForm = {
        power: device.power,
        setTemp: device.setTemp,
        mode: device.mode,
        fanSpeed: device.fanSpeed,
        swingH: device.swingH,
        swingV: device.swingV,
        timerOn: false,
        timerOff: false,
        timerOnTime: "08:00",
        timerOffTime: "22:00",
      };
      this.showDeviceDetail = true;
    },

    closeDeviceDetail() {
      this.showDeviceDetail = false;
      this.currentDevice = null;
    },

    applyDeviceDetail() {
      if (this.currentDevice) {
        this.currentDevice.power = this.deviceDetailForm.power;
        this.currentDevice.setTemp = this.deviceDetailForm.setTemp;
        this.currentDevice.mode = this.deviceDetailForm.mode;
        this.currentDevice.fanSpeed = this.deviceDetailForm.fanSpeed;
        this.currentDevice.swingH = this.deviceDetailForm.swingH;
        this.currentDevice.swingV = this.deviceDetailForm.swingV;

        if (this.currentDevice.power) {
          this.currentDevice.powerUsage = this.calculatePower(
            this.currentDevice
          );
          this.currentDevice.status = "running";
        } else {
          this.currentDevice.powerUsage = 0;
          this.currentDevice.status = "standby";
        }

        this.updateStats();
        this.showToast(`设备 ${this.currentDevice.name} 设置已更新`, "success");
      }
      this.closeDeviceDetail();
    },

    // 编辑设备
    editDevice(device) {
      this.currentDevice = device;
      this.deviceForm = {
        id: device.id,
        name: device.name,
        building: device.building,
        floorArea: device.floorArea,
        room: device.room,
        brand: device.brand || "格力",
        model: device.model || "",
        ratedPower: 3.5,
        installDate: device.installDate || "",
        remark: "",
      };
      this.showEditDevice = true;
      this.activeMenu = null;
    },

    // 复制设备
    duplicateDevice(device) {
      const newDevice = { ...device };
      const maxId = Math.max(
        ...this.devices.map((d) => parseInt(d.id.replace("AC", "")))
      );
      newDevice.id = `AC${String(maxId + 1).padStart(3, "0")}`;
      newDevice.name = device.name + "-复制";

      this.devices.push(newDevice);
      this.updateStats();
      this.showToast("设备复制成功", "success");
      this.activeMenu = null;
    },

    // 确认删除
    confirmDelete(device) {
      this.deviceToDelete = device;
      this.showDeleteConfirm = true;
      this.activeMenu = null;
    },

    // 删除设备
    deleteDevice() {
      const index = this.devices.findIndex(
        (d) => d.id === this.deviceToDelete.id
      );
      if (index > -1) {
        this.devices.splice(index, 1);
        this.updateStats();
        this.showToast(`设备 ${this.deviceToDelete.name} 已删除`, "success");
      }
      this.showDeleteConfirm = false;
      this.deviceToDelete = null;
    },

    // 保存设备
    saveDevice() {
      if (this.showEditDevice) {
        // 编辑设备
        const device = this.devices.find((d) => d.id === this.deviceForm.id);
        if (device) {
          device.name = this.deviceForm.name;
          device.building = this.deviceForm.building;
          device.floorArea = this.deviceForm.floorArea;
          device.floorAreaName = this.availableFloorAreas.find(a => a.id === this.deviceForm.floorArea)?.name || '';
          device.room = this.deviceForm.room;
          
          // 更新位置信息
          const buildingName = device.building === 'A' ? '中心大厦A栋' : '创新大厦B栋';
          device.location = `${buildingName}-${device.floorAreaName}${device.room ? `-${device.room}室` : ''}`;
          
          device.brand = this.deviceForm.brand;
          device.model = this.deviceForm.model;
          device.installDate = this.deviceForm.installDate;

          this.showToast("设备信息已更新", "success");
        }
      } else {
        // 添加设备
        const floorAreaName = this.availableFloorAreas.find(a => a.id === this.deviceForm.floorArea)?.name || '';
        const buildingName = this.deviceForm.building === 'A' ? '中心大厦A栋' : '创新大厦B栋';
        
        const newDevice = {
          id: this.deviceForm.id,
          name: this.deviceForm.name,
          building: this.deviceForm.building,
          floorArea: this.deviceForm.floorArea,
          floorAreaName: floorAreaName,
          room: this.deviceForm.room,
          location: `${buildingName}-${floorAreaName}${this.deviceForm.room ? `-${this.deviceForm.room}室` : ''}`,
          online: true,
          power: false,
          status: "standby",
          currentTemp: 26,
          setTemp: 24,
          mode: "cool",
          fanSpeed: "auto",
          swingH: false,
          swingV: false,
          powerUsage: 0,
          brand: this.deviceForm.brand,
          model: this.deviceForm.model,
          installDate: this.deviceForm.installDate,
          lastUpdate: this.getRandomTime(),
        };

        this.devices.push(newDevice);
        this.updateStats();
        this.showToast("设备添加成功", "success");
      }

      this.closeDeviceForm();
    },

    // 关闭设备表单
    closeDeviceForm() {
      this.showAddDevice = false;
      this.showEditDevice = false;
      this.currentDevice = null;
      this.deviceForm = {
        id: "",
        name: "",
        building: "",
        floorArea: "",
        room: "",
        brand: "格力",
        model: "",
        ratedPower: 3.5,
        installDate: "",
        remark: "",
      };
    },

    // 批量操作
    batchAction(action, value) {
      this.quickActionSelected = action + (value ? "_" + value : "");

      const selectedDeviceObjects = this.devices.filter((d) =>
        this.selectedDevices.includes(d.id)
      );

      selectedDeviceObjects.forEach((device) => {
        if (device.online) {
          switch (action) {
            case "powerOn":
              device.power = true;
              device.status = "running";
              device.powerUsage = this.calculatePower(device);
              break;
            case "powerOff":
              device.power = false;
              device.status = "standby";
              device.powerUsage = 0;
              break;
            case "setTemp":
              device.setTemp = value;
              break;
            case "setMode":
              device.mode = value;
              if (device.power) {
                device.powerUsage = this.calculatePower(device);
              }
              break;
          }
        }
      });

      this.updateStats();
      this.showToast(
        `已对 ${selectedDeviceObjects.length} 台设备执行操作`,
        "success"
      );

      setTimeout(() => {
        this.quickActionSelected = null;
      }, 3000);
    },

    // 重置快速操作选中状态
    resetQuickActionSelection() {
      this.quickActionSelected = null;
    },

    // 关闭批量控制弹窗
    closeBatchControl() {
      this.showBatchControl = false;
      this.resetQuickActionSelection();
    },

    // 应用批量控制
    applyBatchControl() {
      const selectedDeviceObjects = this.devices.filter((d) =>
        this.selectedDevices.includes(d.id)
      );

      selectedDeviceObjects.forEach((device) => {
        if (device.online) {
          if (this.batchSettings.temperature) {
            device.setTemp = this.batchSettings.temperature;
          }
          if (this.batchSettings.mode) {
            device.mode = this.batchSettings.mode;
          }
          if (this.batchSettings.fanSpeed) {
            device.fanSpeed = this.batchSettings.fanSpeed;
          }
          if (device.power) {
            device.powerUsage = this.calculatePower(device);
          }
        }
      });

      this.updateStats();
      this.showBatchControl = false;
      this.showToast(
        `批量设置已应用到 ${selectedDeviceObjects.length} 台设备`,
        "success"
      );
    },

    // 导出数据
    exportData() {
      const exportData = this.filteredDevices.map((device) => ({
        设备编号: device.id,
        设备名称: device.name,
        所在位置: device.location,
        状态: this.getStatusText(device),
        当前温度: device.currentTemp + "°C",
        设定温度: device.setTemp + "°C",
        运行模式: this.modeMap[device.mode],
        风速: this.windMap[device.fanSpeed],
        功率: device.powerUsage + "kW",
        品牌: device.brand,
        型号: device.model,
        安装日期: device.installDate,
        最后更新: device.lastUpdate,
      }));

      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers.map((header) => row[header]).join(",")
        ),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `空调设备数据_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      link.click();

      this.showToast("数据导出成功", "success");
    },

    // 显示提示消息
    showToast(message, type = "success") {
      this.toast.message = message;
      this.toast.type = type;
      this.toast.show = true;

      setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    },
  },
};
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 基础布局 */
.hvac-management {
  min-height: 100vh;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  color: #1f2329;
}

/* 页面头部 */
.page-header {
  background: #fff;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e6eb;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-stats {
  display: flex;
  gap: 16px;
  padding-right: 16px;
  border-right: 1px solid #e5e6eb;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #646a73;
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.stat-dot.online {
  background: #00b365;
}

.stat-dot.running {
  background: #3370ff;
}

.update-time {
  font-size: 13px;
  color: #8f959e;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #646a73;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f2f3f5;
  color: #1f2329;
}

/* 功能操作栏 */
.action-bar {
  background: #fff;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e6eb;
}

.action-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.action-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 搜索框 */
.search-box {
  position: relative;
  width: 280px;
}

.search-box input {
  width: 100%;
  height: 32px;
  padding: 0 32px 0 12px;
  border: 1px solid #dee0e3;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #3370ff;
  box-shadow: 0 0 0 2px rgba(51, 112, 255, 0.15);
}

.search-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #8f959e;
  pointer-events: none;
}

/* 筛选器 */
.filter-group {
  display: flex;
  gap: 8px;
}

.filter-select {
  height: 32px;
  padding: 0 12px;
  border: 1px solid #dee0e3;
  border-radius: 6px;
  font-size: 13px;
  color: #1f2329;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: #bbbfc4;
}

.filter-select:focus {
  outline: none;
  border-color: #3370ff;
}

/* 按钮样式 */
.btn-primary {
  height: 32px;
  padding: 0 16px;
  background: #3370ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #2860e1;
}

.btn-primary:active {
  background: #1e4fc9;
}

.btn-secondary {
  height: 32px;
  padding: 0 16px;
  background: #fff;
  color: #1f2329;
  border: 1px solid #dee0e3;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f2f3f5;
  border-color: #bbbfc4;
}

.btn-default {
  height: 36px;
  padding: 0 20px;
  background: #fff;
  color: #1f2329;
  border: 1px solid #dee0e3;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-default:hover {
  background: #f2f3f5;
  border-color: #bbbfc4;
}

.btn-danger {
  height: 36px;
  padding: 0 20px;
  background: #f54a45;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #dc3e3a;
}

.btn-text-small {
  background: none;
  border: none;
  color: #646a73;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-text-small:hover {
  background: #f2f3f5;
  color: #1f2329;
}

.btn-text-small.danger {
  color: #f54a45;
}

.btn-text-small.btn-link {
  color: #3370ff;
}

.btn-text-small.btn-link:hover {
  background: #f0f7ff;
  color: #2860e1;
}

/* 视图切换 */
.view-switcher {
  background: #fff;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-tabs {
  display: flex;
  gap: 4px;
}

.view-tab {
  height: 28px;
  padding: 0 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  color: #646a73;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.view-tab:hover {
  background: #f2f3f5;
  color: #1f2329;
}

.view-tab.active {
  background: #e8f0ff;
  color: #3370ff;
}

.pagination-info {
  font-size: 13px;
  color: #8f959e;
}

/* 设备容器 */
.devices-container {
  padding: 20px 24px;
  min-height: calc(100vh - 260px);
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

/* 优化后的设备卡片 */
.device-card {
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  border: 1px solid #e5e6eb;
  position: relative;
  transition: all 0.2s;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.device-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.device-card.is-offline {
  opacity: 0.6;
}

.device-card.is-fault {
  border-color: #ffece8;
  background: #fffbfa;
}

.device-card.is-selected {
  border-color: #3370ff;
  background: #f7f9ff;
}

.card-selector {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
}

.card-selector input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.card-status {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 10px;
  height: 20px;
}

.status-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
}

.status-badge.running {
  background: #e8f0ff;
  color: #3370ff;
}

.status-badge.standby {
  background: #f2f3f5;
  color: #646a73;
}

.status-badge.offline {
  background: #f2f3f5;
  color: #8f959e;
}

.status-badge.fault {
  background: #ffece8;
  color: #f54a45;
}

.card-menu {
  position: relative;
  margin-left: 8px;
}

.menu-trigger {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #8f959e;
  transition: all 0.2s;
}

.menu-trigger:hover {
  background: #f2f3f5;
  color: #1f2329;
}

.menu-dropdown {
  position: absolute;
  right: 0;
  top: 24px;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  min-width: 100px;
  z-index: 100;
}

.menu-dropdown button {
  width: 100%;
  padding: 6px 10px;
  background: none;
  border: none;
  text-align: left;
  font-size: 12px;
  color: #1f2329;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-dropdown button:hover {
  background: #f2f3f5;
}

.menu-dropdown button.danger {
  color: #f54a45;
}

.menu-dropdown button.detail-link {
  color: #3370ff;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.device-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.device-id {
  font-size: 10px;
  color: #8f959e;
  font-weight: 500;
}

.device-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2329;
  line-height: 1.2;
}

.device-location {
  font-size: 11px;
  color: #646a73;
  display: flex;
  align-items: center;
  gap: 3px;
  margin-bottom: 6px;
}

.temp-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 6px;
  margin-bottom: 6px;
}

.current-temp,
.target-temp {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.temp-label {
  font-size: 10px;
  color: #8f959e;
  font-weight: 500;
}

.temp-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
}

.temp-value.target {
  color: #3370ff;
}

.device-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.info-label {
  font-size: 10px;
  color: #8f959e;
  font-weight: 500;
}

.info-value {
  font-size: 12px;
  font-weight: 500;
  color: #1f2329;
}

.card-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f1f3;
  margin-top: auto;
}

.power-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #dee0e3;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #8f959e;
  transition: all 0.2s;
  flex-shrink: 0;
}

.power-btn:hover:not(:disabled) {
  border-color: #3370ff;
  color: #3370ff;
}

.power-btn.active {
  background: #3370ff;
  border-color: #3370ff;
  color: #fff;
}

.power-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.temp-control {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: center;
}

.temp-adjust {
  width: 20px;
  height: 20px;
  border: 1px solid #dee0e3;
  background: #fff;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #646a73;
  transition: all 0.2s;
}

.temp-adjust:hover:not(:disabled) {
  border-color: #3370ff;
  color: #3370ff;
}

.temp-adjust:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.temp-display-mini {
  font-size: 13px;
  font-weight: 600;
  color: #1f2329;
  min-width: 28px;
  text-align: center;
}

.detail-btn {
  padding: 4px 8px;
  background: #fff;
  border: 1px solid #dee0e3;
  border-radius: 4px;
  font-size: 11px;
  color: #1f2329;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.detail-btn:hover:not(:disabled) {
  background: #f2f3f5;
  border-color: #bbbfc4;
}

.detail-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 表格视图 */
.table-container {
  padding: 20px 24px;
  background: #fff;
  margin: 20px 24px;
  border-radius: 8px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #f7f8fa;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 500;
  color: #646a73;
  border-bottom: 1px solid #e5e6eb;
}

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.data-table th.sortable:hover {
  color: #1f2329;
}

.sort-icon {
  margin-left: 4px;
  color: #3370ff;
}

.data-table tbody tr {
  border-bottom: 1px solid #f0f1f3;
  transition: all 0.2s;
}

.data-table tbody tr:hover {
  background: #fafbfc;
}

.data-table tbody tr.selected {
  background: #f7f9ff;
}

.data-table td {
  padding: 12px 16px;
  font-size: 13px;
  color: #1f2329;
}

.checkbox-col {
  width: 40px;
}

.device-id-col {
  font-weight: 500;
}

.inline-input,
.inline-select {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #dee0e3;
  border-radius: 4px;
  font-size: 13px;
}

.inline-input:focus,
.inline-select:focus {
  outline: none;
  border-color: #3370ff;
}

/* 分页 */
.pagination {
  background: #fff;
  padding: 16px 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-top: 1px solid #e5e6eb;
}

.page-btn {
  height: 32px;
  padding: 0 12px;
  background: #fff;
  border: 1px solid #dee0e3;
  border-radius: 6px;
  font-size: 13px;
  color: #1f2329;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f2f3f5;
  border-color: #bbbfc4;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  width: 32px;
  height: 32px;
  border: 1px solid #dee0e3;
  background: #fff;
  border-radius: 6px;
  font-size: 13px;
  color: #1f2329;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.page-number:hover {
  background: #f2f3f5;
  border-color: #bbbfc4;
}

.page-number.active {
  background: #3370ff;
  border-color: #3370ff;
  color: #fff;
}

.page-ellipsis {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8f959e;
}

.page-size {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid #e5e6eb;
}

.page-size select {
  padding: 4px 8px;
  border: 1px solid #dee0e3;
  border-radius: 4px;
  font-size: 13px;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 520px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.modal-content.modal-large {
  max-width: 720px;
}

.modal-content.modal-small {
  max-width: 400px;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e6eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 500;
  color: #1f2329;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #8f959e;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f2f3f5;
  color: #1f2329;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e6eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 表单样式 */
.device-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #1f2329;
}

.form-group label.required::after {
  content: " *";
  color: #f54a45;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 8px 12px;
  border: 1px solid #dee0e3;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3370ff;
  box-shadow: 0 0 0 2px rgba(51, 112, 255, 0.15);
}

.form-group input:disabled {
  background: #f7f8fa;
  color: #8f959e;
  cursor: not-allowed;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: flex;
  gap: 16px;
}

/* 租户折叠框样式 */
.tenant-collapse {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 16px;
  overflow: hidden;
}

.collapse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.collapse-header:hover {
  background-color: #f1f3f5;
}

.collapse-header svg {
  transition: transform 0.3s ease;
}

.collapse-header .rotate-90 {
  transform: rotate(90deg);
}

.collapse-content {
  padding: 16px;
  background-color: #fff;
  border-top: 1px solid #e0e0e0;
}

.collapse-content .form-group {
  margin-bottom: 12px;
}

.collapse-content .form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.collapse-content .form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

/* 批量控制样式 */
.batch-section {
  margin-bottom: 32px;
}

.batch-section:last-child {
  margin-bottom: 0;
}

.batch-section h4 {
  font-size: 14px;
  font-weight: 500;
  color: #1f2329;
  margin-bottom: 16px;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.quick-action {
  position: relative;
  padding: 20px 16px;
  background: #fff;
  border: 2px solid #e5e6eb;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.quick-action:hover:not(:disabled) {
  background: #f7f9ff;
  border-color: #3370ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(51, 112, 255, 0.15);
}

.quick-action.selected {
  background: linear-gradient(135deg, #e8f0ff 0%, #f7f9ff 100%);
  border-color: #3370ff;
  color: #3370ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(51, 112, 255, 0.25);
}

.quick-action.selected::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3370ff, #2860e1);
}

.quick-action:disabled,
.quick-action.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.quick-action:disabled:hover,
.quick-action.disabled:hover {
  background: #fff;
  border-color: #e5e6eb;
  transform: none;
  box-shadow: none;
}

.quick-action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f7f8fa;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.quick-action:hover .quick-action-icon {
  background: rgba(51, 112, 255, 0.1);
  color: #3370ff;
}

.quick-action.selected .quick-action-icon {
  background: rgba(51, 112, 255, 0.15);
  color: #3370ff;
}

.quick-action span {
  font-size: 14px;
  font-weight: 500;
  color: #1f2329;
  transition: all 0.3s ease;
}

.quick-action:hover span {
  color: #3370ff;
}

.quick-action.selected span {
  color: #3370ff;
  font-weight: 600;
}

.action-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: #3370ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: badgeAppear 0.3s ease;
}

@keyframes badgeAppear {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.batch-form {
  background: #f7f8fa;
  padding: 16px;
  border-radius: 8px;
}

.input-group {
  display: flex;
  align-items: center;
}

.input-suffix {
  margin-left: 8px;
  color: #8f959e;
}

.schedule-settings {
  background: #f7f8fa;
  padding: 16px;
  border-radius: 8px;
}

.weekday-selector {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.weekday-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #dee0e3;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.weekday-checkbox:hover {
  border-color: #3370ff;
}

.weekday-checkbox input:checked + span {
  color: #3370ff;
}

/* 设备详情弹窗样式 */
.modal-device-detail {
  max-width: 520px;
  width: 90%;
}

.device-header-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 8px;
}

.device-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-location-text {
  font-size: 13px;
  color: #646a73;
}

.device-detail-body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.status-card {
  background: linear-gradient(135deg, #f7f9ff 0%, #e8f0ff 100%);
  border: 1px solid #e0e9ff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.status-card h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-card h4::before {
  content: "";
  width: 4px;
  height: 16px;
  background: #3370ff;
  border-radius: 2px;
}

.status-items {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.8);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(51, 112, 255, 0.1);
}

.status-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.temp-icon {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
}

.power-icon {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
  color: white;
}

.status-info {
  flex: 1;
}

.status-label {
  display: block;
  font-size: 12px;
  color: #646a73;
  margin-bottom: 4px;
}

.status-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
}

.control-card {
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.control-card:last-child {
  margin-bottom: 0;
}

.control-card h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f1f3;
}

.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f7f8fa;
}

.control-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.control-info {
  flex: 1;
}

.control-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1f2329;
  margin-bottom: 4px;
}

.control-desc {
  display: block;
  font-size: 12px;
  color: #8f959e;
}

.control-action {
  flex-shrink: 0;
  margin-left: 20px;
}

.power-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 28px;
  cursor: pointer;
}

.power-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.power-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #dee0e3;
  border-radius: 14px;
  transition: all 0.3s ease;
}

.power-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.power-switch input:checked + .power-slider {
  background: #3370ff;
}

.power-switch input:checked + .power-slider:before {
  transform: translateX(20px);
}

.power-switch input:disabled + .power-slider {
  opacity: 0.4;
  cursor: not-allowed;
}

.temp-adjuster {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f7f8fa;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e5e6eb;
}

.temp-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #fff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #646a73;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.temp-btn:hover:not(:disabled) {
  background: #3370ff;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(51, 112, 255, 0.3);
}

.temp-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.temp-value {
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
  min-width: 48px;
  text-align: center;
}

.mode-selector {
  display: flex;
  gap: 6px;
}

.mode-option {
  padding: 8px 12px;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  font-size: 12px;
  color: #646a73;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.mode-option:hover {
  background: #e8f0ff;
  border-color: #3370ff;
  color: #3370ff;
}

.mode-option.active {
  background: #3370ff;
  border-color: #3370ff;
  color: white;
  font-weight: 500;
}

.fan-selector {
  display: flex;
  gap: 6px;
}

.fan-option {
  padding: 8px 12px;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  font-size: 12px;
  color: #646a73;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.fan-option:hover {
  background: #e8f0ff;
  border-color: #3370ff;
  color: #3370ff;
}

.fan-option.active {
  background: #3370ff;
  border-color: #3370ff;
  color: white;
  font-weight: 500;
}

.swing-options {
  display: flex;
  gap: 16px;
}

.swing-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #1f2329;
}

.swing-checkbox input {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid #dee0e3;
  border-radius: 4px;
  background: #fff;
  position: relative;
  transition: all 0.2s;
}

.swing-checkbox input:checked + .checkmark {
  background: #3370ff;
  border-color: #3370ff;
}

.swing-checkbox input:checked + .checkmark:after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.swing-label {
  font-size: 13px;
  font-weight: 500;
}

.timer-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 200px;
}

.timer-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: #f7f8fa;
  border-radius: 6px;
}

.timer-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #1f2329;
}

.timer-checkbox input {
  display: none;
}

.timer-label {
  font-size: 13px;
  font-weight: 500;
}

.timer-input {
  padding: 6px 10px;
  border: 1px solid #dee0e3;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  color: #1f2329;
  font-weight: 500;
}

.timer-input:focus {
  outline: none;
  border-color: #3370ff;
  box-shadow: 0 0 0 2px rgba(51, 112, 255, 0.15);
}

.timer-input:disabled {
  background: #f7f8fa;
  color: #8f959e;
  cursor: not-allowed;
}

/* 消息提示 */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  z-index: 2000;
  max-width: 300px;
}

.toast.success {
  background: #00b365;
}

.toast.error {
  background: #f54a45;
}

.toast.warning {
  background: #ff9500;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.text-muted {
  color: #8f959e;
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .devices-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
  
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hvac-management {
    padding: 12px;
  }

  .action-bar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .devices-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions-grid {
    grid-template-columns: 1fr;
  }

  .modal-device-detail {
    width: 95%;
    max-width: none;
  }

  .status-items {
    grid-template-columns: 1fr;
  }

  .control-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .control-action {
    margin-left: 0;
  }

  .mode-selector,
  .fan-selector {
    flex-wrap: wrap;
  }

  .timer-settings {
    min-width: auto;
  }

  .timer-group {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
}
</style>