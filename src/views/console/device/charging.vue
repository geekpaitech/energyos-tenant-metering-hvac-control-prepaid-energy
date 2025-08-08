<template>
  <div class="charging-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">充电桩管理</h2>
      </div>
      <div class="header-right">
        <div class="header-stats">
          <div class="stat-badge">
            <span class="stat-dot online"></span>
            <span>在线 {{ stats.online }}/{{ stats.total }}</span>
          </div>
          <div class="stat-badge">
            <span class="stat-dot charging"></span>
            <span>充电中 {{ stats.charging }}</span>
          </div>
        </div>
        <span class="update-time">{{ lastUpdateTime }}</span>
        <button class="btn-icon" @click="refreshData" title="刷新数据">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
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
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>

        <!-- 筛选器 -->
        <div class="filter-group">
          <select v-model="filterStatus" @change="applyFilters" class="filter-select">
            <option value="">全部状态</option>
            <option value="online">在线</option>
            <option value="offline">离线</option>
            <option value="charging">充电中</option>
            <option value="idle">空闲</option>
            <option value="fault">故障</option>
            <option value="maintenance">维护中</option>
          </select>

          <select v-model="filterType" @change="applyFilters" class="filter-select">
            <option value="">全部类型</option>
            <option value="dc_fast">直流快充</option>
            <option value="dc_slow">直流慢充</option>
            <option value="ac">交流充电</option>
          </select>

          <select v-model="filterArea" @change="applyFilters" class="filter-select">
            <option value="">全部区域</option>
            <option v-for="area in areas" :key="area.id" :value="area.id">
              {{ area.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="action-right">
        <button class="btn-secondary" @click="exportData">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          导出数据
        </button>
        <button class="btn-secondary" @click="showBatchControl = true">
          批量操作
        </button>
        <button class="btn-primary" @click="showAddDevice = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          添加充电桩
        </button>
      </div>
    </div>

    <!-- 视图切换 -->
    <div class="view-switcher">
      <div class="view-tabs">
        <button :class="['view-tab', { active: viewMode === 'card' }]" @click="viewMode = 'card'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
          </svg>
          卡片视图
        </button>
        <button :class="['view-tab', { active: viewMode === 'table' }]" @click="viewMode = 'table'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="5" width="18" height="14" rx="1"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="8" y1="5" x2="8" y2="19"/>
            <line x1="16" y1="5" x2="16" y2="19"/>
          </svg>
          列表视图
        </button>
      </div>
      <div class="pagination-info">共 {{ filteredDevices.length }} 台充电桩</div>
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
              'is-charging': device.status === 'charging',
              'is-self-operated': device.isSelfOperated,
            },
          ]"
        >
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="card-checkbox">
              <input
                type="checkbox"
                :checked="selectedDevices.includes(device.id)"
                @change="toggleDeviceSelection(device.id)"
              />
            </div>
            
            <div class="card-status">
              <span :class="['status-indicator', getStatusClass(device)]">
                {{ getStatusText(device) }}
              </span>
            </div>

            <div class="card-menu">
              <button class="menu-btn" @click="toggleMenu(device.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
              <div v-if="activeMenu === device.id" class="menu-dropdown">
                <button @click="editDevice(device)">编辑</button>
                <button @click="viewHistory(device)">使用记录</button>
                <button @click="duplicateDevice(device)">复制</button>
                <button class="danger" @click="confirmDelete(device)">删除</button>
              </div>
            </div>
          </div>

          <!-- 设备基本信息 -->
          <div class="card-content">
            <div class="device-info">
              <div class="device-id">#{{ device.id }}</div>
              <div class="device-name">{{ device.name }}</div>
              <div class="device-location">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ device.location }}
              </div>
            </div>

            <!-- 设备属性 -->
            <div class="device-attrs">
              <div class="attr-row">
                <div class="attr-item">
                  <span class="attr-label">类型</span>
                  <span :class="['attr-value', 'type-' + device.type]">
                    {{ typeMap[device.type] }}
                  </span>
                </div>
                <div class="attr-item">
                  <span class="attr-label">功率</span>
                  <span class="attr-value">{{ device.maxPower }}kW</span>
                </div>
              </div>
              <div class="attr-row">
                <div class="attr-item">
                  <span class="attr-label">协议</span>
                  <span class="attr-value">{{ device.protocol || 'OCPP 1.6' }}</span>
                </div>
                <div class="attr-item">
                  <span class="attr-label">运营</span>
                  <span :class="['attr-value', device.isSelfOperated ? 'self-operated' : 'partner']">
                    {{ device.isSelfOperated ? '自营' : '合作' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 实时数据 -->
            <div class="realtime-data">
              <div class="data-grid">
                <div class="data-item">
                  <div class="data-label">当前功率</div>
                  <div class="data-value primary">{{ device.currentPower }}kW</div>
                </div>
                <div class="data-item">
                  <div class="data-label">电压</div>
                  <div class="data-value">{{ device.voltage }}V</div>
                </div>
                <div class="data-item">
                  <div class="data-label">电流</div>
                  <div class="data-value">{{ device.current }}A</div>
                </div>
                <div class="data-item">
                  <div class="data-label">利用率</div>
                  <div class="data-value">{{ device.utilizationRate }}%</div>
                </div>
              </div>

              <!-- 充电时长 -->
              <div v-if="device.status === 'charging'" class="charging-duration">
                <div class="duration-indicator">
                  <div class="pulse-dot"></div>
                  <span>充电时长：{{ device.chargingTime }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 卡片底部 -->
          <div class="card-footer">
            <div class="footer-info">
              <div class="temp-status" :class="getTempStatusClass(device.temperature)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/>
                </svg>
                {{ device.temperature }}°C
              </div>
              <div class="last-update">{{ device.lastUpdate }}</div>
            </div>
            
            <div class="footer-actions">
              <button
                :class="['power-btn', { active: device.power && device.online }]"
                @click="togglePower(device)"
                :disabled="!device.online || device.status === 'maintenance'"
                :title="device.power ? '停用' : '启用'"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10"/>
                </svg>
              </button>
              
              <button
                class="control-btn"
                @click="openDeviceDetail(device)"
                :disabled="!device.online"
              >
                控制
              </button>
            </div>
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
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>设备名称</th>
            <th>所在位置</th>
            <th>类型</th>
            <th>协议</th>
            <th>运营模式</th>
            <th @click="sortBy('status')" class="sortable">
              状态
              <span class="sort-icon" v-if="sortField === 'status'">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>最大功率</th>
            <th>当前功率</th>
            <th>输出电压</th>
            <th>输出电流</th>
            <th @click="sortBy('utilizationRate')" class="sortable">
              利用率
              <span class="sort-icon" v-if="sortField === 'utilizationRate'">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
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
              <span :class="['type-badge', device.type]">
                {{ typeMap[device.type] }}
              </span>
            </td>
            <td>{{ device.protocol || 'OCPP 1.6' }}</td>
            <td>
              <span v-if="device.isSelfOperated" class="operation-badge self">自营</span>
              <span v-else class="operation-badge partner">合作</span>
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(device)]">
                {{ getStatusText(device) }}
              </span>
            </td>
            <td>{{ device.maxPower }}kW</td>
            <td>{{ device.currentPower }}kW</td>
            <td>{{ device.voltage }}V</td>
            <td>{{ device.current }}A</td>
            <td>{{ device.utilizationRate }}%</td>
            <td>{{ device.lastUpdate }}</td>
            <td class="action-col">
              <button class="btn-text-small" @click="editDevice(device)">编辑</button>
              <button class="btn-text-small danger" @click="confirmDelete(device)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <button class="page-btn" @click="currentPage = 1" :disabled="currentPage === 1">
        首页
      </button>
      <button class="page-btn" @click="currentPage--" :disabled="currentPage === 1">
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

      <button class="page-btn" @click="currentPage++" :disabled="currentPage === totalPages">
        下一页
      </button>
      <button class="page-btn" @click="currentPage = totalPages" :disabled="currentPage === totalPages">
        末页
      </button>

      <div class="page-size">
        <span>每页</span>
        <select v-model.number="pageSize" @change="currentPage = 1">
          <option value="8">8</option>
          <option value="24">24</option>
          <option value="36">36</option>
        </select>
        <span>条</span>
      </div>
    </div>

    <!-- 添加/编辑充电桩弹窗 -->
    <div
      v-if="showAddDevice || showEditDevice"
      class="modal-overlay"
      @click.self="closeDeviceForm"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ showEditDevice ? '编辑充电桩' : '添加充电桩' }}</h3>
          <button class="modal-close" @click="closeDeviceForm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
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
                placeholder="如：CP001"
                required
                :disabled="showEditDevice"
              />
            </div>

            <div class="form-group">
              <label class="required">设备名称</label>
              <input
                type="text"
                v-model="deviceForm.name"
                placeholder="如：A区-01号桩"
                required
              />
            </div>

            <!-- 基础配置折叠框 -->
            <div class="config-collapse">
              <div class="collapse-header" @click="configCollapseOpen = !configCollapseOpen">
                <span>基础配置</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  :class="{ 'rotate-90': configCollapseOpen }"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>

              <div class="collapse-content" v-show="configCollapseOpen">
                <div class="form-row">
                  <div class="form-group">
                    <label class="required">充电桩类型</label>
                    <select v-model="deviceForm.type" required>
                      <option value="">请选择</option>
                      <option value="dc_fast">直流快充</option>
                      <option value="dc_slow">直流慢充</option>
                      <option value="ac">交流充电</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="required">最大功率(kW)</label>
                    <input
                      type="number"
                      v-model.number="deviceForm.maxPower"
                      placeholder="如：60"
                      required
                      step="0.1"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="required">通信协议</label>
                    <select v-model="deviceForm.protocol" required>
                      <option value="">请选择协议</option>
                      <option value="OCPP 1.6">OCPP 1.6</option>
                      <option value="OCPP 2.0">OCPP 2.0</option>
                      <option value="CHAdeMO">CHAdeMO</option>
                      <option value="CCS">CCS</option>
                      <option value="GB/T">GB/T</option>
                      <option value="Tesla">Tesla专用</option>
                      <option value="Modbus">Modbus</option>
                      <option value="自定义">自定义协议</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="required">运营模式</label>
                    <div class="radio-group">
                      <label class="radio-item">
                        <input type="radio" v-model="deviceForm.isSelfOperated" :value="true" />
                        <span class="radio-mark"></span>
                        <span class="radio-label">自营</span>
                      </label>
                      <label class="radio-item">
                        <input type="radio" v-model="deviceForm.isSelfOperated" :value="false" />
                        <span class="radio-mark"></span>
                        <span class="radio-label">合作运营</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>额定电压(V)</label>
                    <input
                      type="number"
                      v-model.number="deviceForm.ratedVoltage"
                      placeholder="如：380"
                    />
                  </div>

                  <div class="form-group">
                    <label>额定电流(A)</label>
                    <input
                      type="number"
                      v-model.number="deviceForm.ratedCurrent"
                      placeholder="如：160"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label>接口数量</label>
                  <select v-model.number="deviceForm.portCount">
                    <option :value="1">1个接口</option>
                    <option :value="2">2个接口</option>
                    <option :value="4">4个接口</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 位置信息折叠框 -->
            <div class="location-collapse">
              <div class="collapse-header" @click="locationCollapseOpen = !locationCollapseOpen">
                <span>位置信息</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  :class="{ 'rotate-90': locationCollapseOpen }"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>

              <div class="collapse-content" v-show="locationCollapseOpen">
                <div class="form-row">
                  <div class="form-group">
                    <label class="required">所属区域</label>
                    <select v-model="deviceForm.area" required>
                      <option value="">请选择</option>
                      <option v-for="area in areas" :key="area.id" :value="area.id">
                        {{ area.name }}
                      </option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="required">停车位编号</label>
                    <input
                      type="text"
                      v-model="deviceForm.parkingSpot"
                      placeholder="如：A01"
                      required
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label>详细地址</label>
                  <textarea
                    v-model="deviceForm.address"
                    rows="2"
                    placeholder="如：地下停车场A区第1排第1个车位"
                  ></textarea>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>品牌</label>
                <select v-model="deviceForm.brand">
                  <option value="特来电">特来电</option>
                  <option value="星星充电">星星充电</option>
                  <option value="国家电网">国家电网</option>
                  <option value="小鹏充电">小鹏充电</option>
                  <option value="蔚来">蔚来</option>
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
                <label>安装日期</label>
                <input type="date" v-model="deviceForm.installDate" />
              </div>

              <div class="form-group">
                <label>维护周期(天)</label>
                <input
                  type="number"
                  v-model.number="deviceForm.maintenanceCycle"
                  placeholder="如：90"
                />
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
            {{ showEditDevice ? '保存修改' : '添加充电桩' }}
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
          <h3>批量控制 (已选择 {{ selectedDevices.length }} 台充电桩)</h3>
          <button class="modal-close" @click="showBatchControl = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
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
                    selected: quickActionSelected === 'enable',
                    disabled: selectedDevices.length === 0,
                  },
                ]"
                @click="batchAction('enable')"
                :disabled="selectedDevices.length === 0"
              >
                <div class="quick-action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10"/>
                  </svg>
                </div>
                <span>启用充电桩</span>
                <div class="action-badge" v-if="quickActionSelected === 'enable'">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
              </button>

              <button
                :class="[
                  'quick-action',
                  {
                    selected: quickActionSelected === 'disable',
                    disabled: selectedDevices.length === 0,
                  },
                ]"
                @click="batchAction('disable')"
                :disabled="selectedDevices.length === 0"
              >
                <div class="quick-action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M4.93 4.93l14.14 14.14"/>
                  </svg>
                </div>
                <span>停用充电桩</span>
                <div class="action-badge" v-if="quickActionSelected === 'disable'">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
              </button>

              <button
                :class="[
                  'quick-action',
                  {
                    selected: quickActionSelected === 'maintenance',
                    disabled: selectedDevices.length === 0,
                  },
                ]"
                @click="batchAction('maintenance')"
                :disabled="selectedDevices.length === 0"
              >
                <div class="quick-action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14.5 2H9a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                <span>进入维护</span>
                <div class="action-badge" v-if="quickActionSelected === 'maintenance'">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
              </button>

              <button
                :class="[
                  'quick-action',
                  {
                    selected: quickActionSelected === 'reset',
                    disabled: selectedDevices.length === 0,
                  },
                ]"
                @click="batchAction('reset')"
                :disabled="selectedDevices.length === 0"
              >
                <div class="quick-action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M23 4v6h-6M1 20v-6h6"/>
                    <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/>
                  </svg>
                </div>
                <span>重启设备</span>
                <div class="action-badge" v-if="quickActionSelected === 'reset'">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20,6 9,17 4,12"/>
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
                  <label>最大输出功率</label>
                  <div class="input-group">
                    <input
                      type="number"
                      v-model.number="batchSettings.maxPower"
                      step="0.1"
                      placeholder="不修改"
                    />
                    <span class="input-suffix">kW</span>
                  </div>
                </div>

                <div class="form-group">
                  <label>输出电压</label>
                  <div class="input-group">
                    <input
                      type="number"
                      v-model.number="batchSettings.voltage"
                      placeholder="不修改"
                    />
                    <span class="input-suffix">V</span>
                  </div>
                </div>

                <div class="form-group">
                  <label>最大电流</label>
                  <div class="input-group">
                    <input
                      type="number"
                      v-model.number="batchSettings.maxCurrent"
                      placeholder="不修改"
                    />
                    <span class="input-suffix">A</span>
                  </div>
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
                  <label>启用时间</label>
                  <input type="time" v-model="schedule.enableTime" />
                </div>

                <div class="form-group">
                  <label>停用时间</label>
                  <input type="time" v-model="schedule.disableTime" />
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
                <label v-for="day in weekdays" :key="day.value" class="weekday-checkbox">
                  <input type="checkbox" :value="day.value" v-model="schedule.days" />
                  <span>{{ day.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-default" @click="showBatchControl = false">取消</button>
          <button class="btn-primary" @click="applyBatchControl">应用设置</button>
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
              <span :class="['status-dot', getStatusClass(currentDevice)]"></span>
              <span class="device-location-text">{{ currentDevice?.location }}</span>
            </div>
          </div>
          <button class="modal-close" @click="closeDeviceDetail">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body device-detail-body">
          <!-- 实时状态卡片 -->
          <div class="status-card">
            <h4>实时状态</h4>
            <div class="status-items">
              <div class="status-item">
                <div class="status-icon power-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 11h-4l-3 9L9 2l-3 9H2"/>
                  </svg>
                </div>
                <div class="status-info">
                  <span class="status-label">当前功率</span>
                  <span class="status-value">{{ currentDevice?.currentPower }}kW</span>
                </div>
              </div>

              <div class="status-item">
                <div class="status-icon voltage-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/>
                  </svg>
                </div>
                <div class="status-info">
                  <span class="status-label">输出电压</span>
                  <span class="status-value">{{ currentDevice?.voltage }}V</span>
                </div>
              </div>

              <div class="status-item">
                <div class="status-icon current-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 11h-4l-3 9L9 2l-3 9H2"/>
                  </svg>
                </div>
                <div class="status-info">
                  <span class="status-label">输出电流</span>
                  <span class="status-value">{{ currentDevice?.current }}A</span>
                </div>
              </div>

              <div class="status-item">
                <div class="status-icon efficiency-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                <div class="status-info">
                  <span class="status-label">利用率</span>
                  <span class="status-value">{{ currentDevice?.utilizationRate }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 基础控制 -->
          <div class="control-card">
            <h4>基础控制</h4>

            <!-- 设备开关 -->
            <div class="control-row">
              <div class="control-info">
                <span class="control-title">设备状态</span>
                <span class="control-desc">充电桩开启/关闭控制</span>
              </div>
              <div class="control-action">
                <label class="power-switch">
                  <input
                    type="checkbox"
                    v-model="deviceDetailForm.power"
                    :disabled="!currentDevice?.online || currentDevice?.status === 'maintenance'"
                  />
                  <span class="power-slider"></span>
                </label>
              </div>
            </div>

            <!-- 功率设置 -->
            <div class="control-row" v-if="deviceDetailForm.power">
              <div class="control-info">
                <span class="control-title">输出功率限制</span>
                <span class="control-desc">当前限制 {{ deviceDetailForm.maxPower }}kW</span>
              </div>
              <div class="control-action">
                <div class="power-adjuster">
                  <button
                    class="power-btn minus"
                    @click="deviceDetailForm.maxPower = Math.max(1, deviceDetailForm.maxPower - 5)"
                    :disabled="deviceDetailForm.maxPower <= 1"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                  <div class="power-value">{{ deviceDetailForm.maxPower }}kW</div>
                  <button
                    class="power-btn plus"
                    @click="deviceDetailForm.maxPower = Math.min(currentDevice?.ratedPower || 60, deviceDetailForm.maxPower + 5)"
                    :disabled="deviceDetailForm.maxPower >= (currentDevice?.ratedPower || 60)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- 预约充电 -->
            <div class="control-row" v-if="deviceDetailForm.power">
              <div class="control-info">
                <span class="control-title">预约充电</span>
                <span class="control-desc">设置预约充电时间段</span>
              </div>
              <div class="control-action">
                <div class="reservation-settings">
                  <label class="reservation-checkbox">
                    <input type="checkbox" v-model="deviceDetailForm.reservation" />
                    <span class="checkmark"></span>
                    <span class="reservation-label">启用预约</span>
                  </label>
                  <div v-if="deviceDetailForm.reservation" class="time-range">
                    <input
                      type="time"
                      v-model="deviceDetailForm.reservationStart"
                      class="time-input"
                    />
                    <span>-</span>
                    <input
                      type="time"
                      v-model="deviceDetailForm.reservationEnd"
                      class="time-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 高级设置 -->
          <div class="control-card" v-if="deviceDetailForm.power">
            <h4>高级设置</h4>

            <!-- 充电模式 -->
            <div class="control-row">
              <div class="control-info">
                <span class="control-title">充电模式</span>
                <span class="control-desc">{{ chargingModeMap[deviceDetailForm.chargingMode] }}</span>
              </div>
              <div class="control-action">
                <div class="mode-selector">
                  <button
                    v-for="mode in chargingModes"
                    :key="mode.value"
                    :class="[
                      'mode-option',
                      { active: deviceDetailForm.chargingMode === mode.value },
                    ]"
                    @click="deviceDetailForm.chargingMode = mode.value"
                  >
                    {{ mode.label }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 保护设置 -->
            <div class="control-row">
              <div class="control-info">
                <span class="control-title">安全保护</span>
                <span class="control-desc">过压过流保护设置</span>
              </div>
              <div class="control-action">
                <div class="protection-options">
                  <label class="protection-checkbox">
                    <input type="checkbox" v-model="deviceDetailForm.overVoltageProtection" />
                    <span class="checkmark"></span>
                    <span class="protection-label">过压保护</span>
                  </label>
                  <label class="protection-checkbox">
                    <input type="checkbox" v-model="deviceDetailForm.overCurrentProtection" />
                    <span class="checkmark"></span>
                    <span class="protection-label">过流保护</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- 温度监控 -->
            <div class="control-row">
              <div class="control-info">
                <span class="control-title">温度监控</span>
                <span class="control-desc">当前设备温度: {{ currentDevice?.temperature || 35 }}°C</span>
              </div>
              <div class="control-action">
                <div class="temp-monitor">
                  <div class="temp-status" :class="getTempStatusClass(currentDevice?.temperature || 35)">
                    {{ getTempStatusText(currentDevice?.temperature || 35) }}
                  </div>
                  <button
                    class="temp-alert-btn"
                    :class="{ active: deviceDetailForm.tempAlert }"
                    @click="deviceDetailForm.tempAlert = !deviceDetailForm.tempAlert"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <circle cx="12" cy="17.5" r="0.5"/>
                    </svg>
                    高温告警
                  </button>
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
            :disabled="!currentDevice?.online || currentDevice?.status === 'maintenance'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
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
          <p>确定要删除充电桩 <strong>{{ deviceToDelete?.name }}</strong> 吗？</p>
          <p class="text-muted">此操作不可恢复，请谨慎操作。</p>
        </div>
        <div class="modal-footer">
          <button class="btn-default" @click="showDeleteConfirm = false">取消</button>
          <button class="btn-danger" @click="deleteDevice">确认删除</button>
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
  name: "ChargingManagement",

  data() {
    return {
      configCollapseOpen: true, // 基础配置折叠框
      locationCollapseOpen: true, // 位置信息折叠框
      quickActionSelected: null, // 记录当前选中的快速操作
      showDeviceDetail: false,

      // 设备详情表单
      deviceDetailForm: {
        power: false,
        maxPower: 60,
        chargingMode: "auto",
        reservation: false,
        reservationStart: "08:00",
        reservationEnd: "18:00",
        overVoltageProtection: true,
        overCurrentProtection: true,
        tempAlert: true,
      },

      // 时间相关
      lastUpdateTime: "",
      updateTimer: null,

      // 视图控制
      viewMode: "card", // card | table
      currentPage: 1,
      pageSize: 8,

      // 搜索和筛选
      searchQuery: "",
      filterStatus: "",
      filterType: "",
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
        type: "dc_fast",
        protocol: "OCPP 1.6", // 新增：通信协议
        isSelfOperated: true, // 新增：是否自营
        maxPower: 60,
        ratedVoltage: 380,
        ratedCurrent: 160,
        portCount: 1,
        area: "",
        parkingSpot: "",
        address: "",
        brand: "特来电",
        model: "",
        installDate: "",
        maintenanceCycle: 90,
        remark: "",
      },

      // 批量设置
      batchSettings: {
        maxPower: null,
        voltage: null,
        maxCurrent: null,
      },

      // 定时任务
      schedule: {
        enableTime: "06:00",
        disableTime: "22:00",
        repeat: "weekdays",
        days: [1, 2, 3, 4, 5],
      },

      // 消息提示
      toast: {
        show: false,
        message: "",
        type: "success", // success | error | warning
      },

      // 统计数据
      stats: {
        total: 20,
        online: 18,
        charging: 12,
        totalPower: 720,
        avgUtilization: 75,
      },

      // 区域数据
      areas: [
        { id: "A", name: "A区停车场", spots: 50 },
        { id: "B", name: "B区停车场", spots: 40 },
        { id: "C", name: "C区停车场", spots: 30 },
        { id: "D", name: "地下停车场", spots: 80 },
        { id: "E", name: "访客停车区", spots: 20 },
      ],

      // 充电桩列表
      devices: [
        {
          id: "CP001",
          name: "A区-01号桩",
          type: "dc_fast",
          protocol: "OCPP 1.6",
          isSelfOperated: true,
          area: "A",
          parkingSpot: "A01",
          location: "A区停车场-A01车位",
          online: true,
          power: true,
          status: "charging",
          maxPower: 60,
          currentPower: 45.8,
          voltage: 380,
          current: 120,
          utilizationRate: 85,
          chargingTime: "1小时32分",
          temperature: 42,
          ratedVoltage: 380,
          ratedCurrent: 160,
          portCount: 1,
          brand: "特来电",
          model: "TEL-DC60-A1",
          installDate: "2023-03-15",
          lastUpdate: "10:23:45",
        },
        {
          id: "CP002",
          name: "A区-02号桩",
          type: "dc_fast",
          protocol: "OCPP 2.0",
          isSelfOperated: true,
          area: "A",
          parkingSpot: "A02",
          location: "A区停车场-A02车位",
          online: true,
          power: true,
          status: "charging",
          maxPower: 60,
          currentPower: 52.3,
          voltage: 375,
          current: 139,
          utilizationRate: 92,
          chargingTime: "45分钟",
          temperature: 39,
          ratedVoltage: 380,
          ratedCurrent: 160,
          portCount: 1,
          brand: "星星充电",
          model: "XX-DC60-B2",
          installDate: "2023-03-15",
          lastUpdate: "10:22:12",
        },
        {
          id: "CP003",
          name: "A区-03号桩",
          type: "dc_slow",
          protocol: "CHAdeMO",
          isSelfOperated: false,
          area: "A",
          parkingSpot: "A03",
          location: "A区停车场-A03车位",
          online: true,
          power: true,
          status: "idle",
          maxPower: 30,
          currentPower: 0,
          voltage: 220,
          current: 0,
          utilizationRate: 65,
          chargingTime: "0分钟",
          temperature: 28,
          ratedVoltage: 220,
          ratedCurrent: 136,
          portCount: 1,
          brand: "国家电网",
          model: "SGCC-DC30-C1",
          installDate: "2023-04-20",
          lastUpdate: "10:21:33",
        },
        {
          id: "CP004",
          name: "A区-04号桩",
          type: "ac",
          protocol: "GB/T",
          isSelfOperated: false,
          area: "A",
          parkingSpot: "A04",
          location: "A区停车场-A04车位",
          online: false,
          power: false,
          status: "offline",
          maxPower: 7,
          currentPower: 0,
          voltage: 0,
          current: 0,
          utilizationRate: 45,
          chargingTime: "0分钟",
          temperature: 25,
          ratedVoltage: 220,
          ratedCurrent: 32,
          portCount: 1,
          brand: "小鹏充电",
          model: "XP-AC7-D1",
          installDate: "2023-03-15",
          lastUpdate: "09:45:21",
        },
        {
          id: "CP005",
          name: "B区-01号桩",
          type: "dc_fast",
          protocol: "CCS",
          isSelfOperated: true,
          area: "B",
          parkingSpot: "B01",
          location: "B区停车场-B01车位",
          online: true,
          power: true,
          status: "charging",
          maxPower: 120,
          currentPower: 98.5,
          voltage: 750,
          current: 131,
          utilizationRate: 88,
          chargingTime: "2小时15分",
          temperature: 48,
          ratedVoltage: 750,
          ratedCurrent: 160,
          portCount: 2,
          brand: "蔚来",
          model: "NIO-SC120-E1",
          installDate: "2023-05-10",
          lastUpdate: "10:24:01",
        },
        {
          id: "CP006",
          name: "B区-02号桩",
          type: "dc_fast",
          protocol: "OCPP 1.6",
          isSelfOperated: true,
          area: "B",
          parkingSpot: "B02",
          location: "B区停车场-B02车位",
          online: true,
          power: true,
          status: "fault",
          maxPower: 60,
          currentPower: 0,
          voltage: 0,
          current: 0,
          utilizationRate: 75,
          chargingTime: "0分钟",
          temperature: 55,
          ratedVoltage: 380,
          ratedCurrent: 160,
          portCount: 1,
          brand: "特来电",
          model: "TEL-DC60-A2",
          installDate: "2023-05-10",
          lastUpdate: "10:20:15",
        },
        {
          id: "CP007",
          name: "B区-03号桩",
          type: "ac",
          protocol: "GB/T",
          isSelfOperated: false,
          area: "B",
          parkingSpot: "B03",
          location: "B区停车场-B03车位",
          online: true,
          power: true,
          status: "charging",
          maxPower: 11,
          currentPower: 8.5,
          voltage: 220,
          current: 38,
          utilizationRate: 72,
          chargingTime: "4小时12分",
          temperature: 35,
          ratedVoltage: 220,
          ratedCurrent: 50,
          portCount: 1,
          brand: "星星充电",
          model: "XX-AC11-F1",
          installDate: "2023-06-01",
          lastUpdate: "10:23:58",
        },
        {
          id: "CP008",
          name: "C区-01号桩",
          type: "dc_slow",
          protocol: "Modbus",
          isSelfOperated: true,
          area: "C",
          parkingSpot: "C01",
          location: "C区停车场-C01车位",
          online: true,
          power: true,
          status: "charging",
          maxPower: 30,
          currentPower: 28.2,
          voltage: 380,
          current: 74,
          utilizationRate: 68,
          chargingTime: "3小时28分",
          temperature: 41,
          ratedVoltage: 380,
          ratedCurrent: 80,
          portCount: 1,
          brand: "国家电网",
          model: "SGCC-DC30-C2",
          installDate: "2023-06-01",
          lastUpdate: "10:24:12",
        },
      ],

      // 映射表
      typeMap: {
        dc_fast: "直流快充",
        dc_slow: "直流慢充",
        ac: "交流充电",
      },

      statusMap: {
        online: "在线",
        offline: "离线",
        charging: "充电中",
        idle: "空闲",
        fault: "故障",
        maintenance: "维护中",
      },

      chargingModeMap: {
        auto: "自动模式",
        fast: "快充模式",
        slow: "慢充模式",
        schedule: "定时充电",
      },

      // 选项列表
      chargingModes: [
        { value: "auto", label: "自动" },
        { value: "fast", label: "快充" },
        { value: "slow", label: "慢充" },
        { value: "schedule", label: "定时" },
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
            case "charging":
              return device.status === "charging";
            case "idle":
              return device.status === "idle";
            case "fault":
              return device.status === "fault";
            case "maintenance":
              return device.status === "maintenance";
            default:
              return true;
          }
        });
      }

      // 类型过滤
      if (this.filterType) {
        result = result.filter((device) => device.type === this.filterType);
      }

      // 区域过滤
      if (this.filterArea) {
        result = result.filter((device) => device.area === this.filterArea);
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
      this.updateStats();
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
        this.simulateChargingData();
        this.updateStats();
      }, 5000);
    },

    // 模拟充电数据变化
    simulateChargingData() {
      this.devices.forEach((device) => {
        if (device.online && device.power && device.status === "charging") {
          // 模拟功率波动 ±5%
          const basePower = device.maxPower * 0.8;
          const variation = (Math.random() - 0.5) * 0.1 * basePower;
          device.currentPower = Math.max(0, Math.min(device.maxPower, basePower + variation));
          device.currentPower = Math.round(device.currentPower * 10) / 10;

          // 根据功率计算电流
          if (device.voltage > 0) {
            device.current = Math.round((device.currentPower * 1000) / device.voltage);
          }

          // 模拟温度变化
          if (device.currentPower > device.maxPower * 0.7) {
            device.temperature = Math.min(65, device.temperature + Math.random() * 2);
          } else {
            device.temperature = Math.max(25, device.temperature - Math.random());
          }
          device.temperature = Math.round(device.temperature);

          // 更新利用率
          device.utilizationRate = Math.min(100, device.utilizationRate + Math.random() * 2 - 1);
          device.utilizationRate = Math.round(device.utilizationRate);
        } else if (device.status === "idle") {
          device.currentPower = 0;
          device.current = 0;
          device.temperature = Math.max(25, device.temperature - Math.random() * 0.5);
          device.temperature = Math.round(device.temperature);
        }
      });
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

    // 更新统计
    updateStats() {
      const online = this.devices.filter((d) => d.online);
      const charging = online.filter((d) => d.status === "charging");

      this.stats.total = this.devices.length;
      this.stats.online = online.length;
      this.stats.charging = charging.length;

      if (charging.length > 0) {
        this.stats.totalPower = charging
          .reduce((sum, d) => sum + d.currentPower, 0)
          .toFixed(1);
        this.stats.avgUtilization = Math.round(
          charging.reduce((sum, d) => sum + d.utilizationRate, 0) / charging.length
        );
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
      if (device.status === "charging") return "charging";
      if (device.status === "maintenance") return "maintenance";
      return "idle";
    },

    // 获取状态文本
    getStatusText(device) {
      if (!device.online) return "离线";
      return this.statusMap[device.status] || "未知";
    },

    // 获取详细状态
    getDetailedStatus(device) {
      if (!device.online) return "设备离线";
      if (device.status === "charging") return `充电中 ${device.chargingTime}`;
      if (device.status === "fault") return "设备故障";
      if (device.status === "maintenance") return "维护中";
      return "空闲待机";
    },

    // 设备控制
    togglePower(device) {
      if (device.status === "maintenance") {
        this.showToast("设备维护中，无法操作", "warning");
        return;
      }

      device.power = !device.power;
      if (!device.power) {
        device.currentPower = 0;
        device.current = 0;
        device.status = "idle";
      } else {
        device.status = "idle";
      }
      this.updateStats();
      this.showToast(
        `充电桩 ${device.name} 已${device.power ? "启用" : "停用"}`,
        "success"
      );
    },

    // 打开设备详情
    openDeviceDetail(device) {
      this.currentDevice = device;
      this.deviceDetailForm = {
        power: device.power,
        maxPower: device.maxPower,
        chargingMode: "auto",
        reservation: false,
        reservationStart: "08:00",
        reservationEnd: "18:00",
        overVoltageProtection: true,
        overCurrentProtection: true,
        tempAlert: true,
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
        this.currentDevice.maxPower = this.deviceDetailForm.maxPower;

        // 更新状态
        if (this.currentDevice.power) {
          if (this.currentDevice.status === "idle") {
            // 可以保持空闲状态或根据需要改为其他状态
          }
        } else {
          this.currentDevice.currentPower = 0;
          this.currentDevice.current = 0;
          this.currentDevice.status = "idle";
        }

        this.updateStats();
        this.showToast(`充电桩 ${this.currentDevice.name} 设置已更新`, "success");
      }
      this.closeDeviceDetail();
    },

    // 温度状态
    getTempStatusClass(temp) {
      if (temp >= 50) return "hot";
      if (temp >= 40) return "warm";
      return "normal";
    },

    getTempStatusText(temp) {
      if (temp >= 50) return "高温";
      if (temp >= 40) return "正常";
      return "正常";
    },

    // 编辑设备
    editDevice(device) {
      this.currentDevice = device;
      this.deviceForm = {
        id: device.id,
        name: device.name,
        type: device.type,
        protocol: device.protocol || "OCPP 1.6",
        isSelfOperated: device.isSelfOperated,
        maxPower: device.maxPower,
        ratedVoltage: device.ratedVoltage,
        ratedCurrent: device.ratedCurrent,
        portCount: device.portCount,
        area: device.area,
        parkingSpot: device.parkingSpot,
        address: device.location,
        brand: device.brand || "特来电",
        model: device.model || "",
        installDate: device.installDate || "",
        maintenanceCycle: 90,
        remark: "",
      };
      this.showEditDevice = true;
      this.activeMenu = null;
    },

    // 复制设备
    duplicateDevice(device) {
      const newDevice = { ...device };
      const maxId = Math.max(
        ...this.devices.map((d) => parseInt(d.id.replace("CP", "")))
      );
      newDevice.id = `CP${String(maxId + 1).padStart(3, "0")}`;
      newDevice.name = device.name + "-复制";

      this.devices.push(newDevice);
      this.updateStats();
      this.showToast("充电桩复制成功", "success");
      this.activeMenu = null;
    },

    // 查看历史记录
    viewHistory(device) {
      console.log("查看使用记录", device);
      this.showToast("使用记录功能开发中", "warning");
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
        this.showToast(`充电桩 ${this.deviceToDelete.name} 已删除`, "success");
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
          device.type = this.deviceForm.type;
          device.protocol = this.deviceForm.protocol;
          device.isSelfOperated = this.deviceForm.isSelfOperated;
          device.maxPower = this.deviceForm.maxPower;
          device.ratedVoltage = this.deviceForm.ratedVoltage;
          device.ratedCurrent = this.deviceForm.ratedCurrent;
          device.portCount = this.deviceForm.portCount;
          device.area = this.deviceForm.area;
          device.parkingSpot = this.deviceForm.parkingSpot;
          device.location = `${
            this.areas.find((a) => a.id === this.deviceForm.area)?.name
          }-${this.deviceForm.parkingSpot}车位`;
          device.brand = this.deviceForm.brand;
          device.model = this.deviceForm.model;
          device.installDate = this.deviceForm.installDate;

          this.showToast("充电桩信息已更新", "success");
        }
      } else {
        // 添加设备
        const newDevice = {
          id: this.deviceForm.id,
          name: this.deviceForm.name,
          type: this.deviceForm.type,
          protocol: this.deviceForm.protocol,
          isSelfOperated: this.deviceForm.isSelfOperated,
          area: this.deviceForm.area,
          parkingSpot: this.deviceForm.parkingSpot,
          location: `${
            this.areas.find((a) => a.id === this.deviceForm.area)?.name
          }-${this.deviceForm.parkingSpot}车位`,
          online: true,
          power: false,
          status: "idle",
          maxPower: this.deviceForm.maxPower,
          currentPower: 0,
          voltage: this.deviceForm.ratedVoltage,
          current: 0,
          utilizationRate: 0,
          chargingTime: "0分钟",
          temperature: 25,
          ratedVoltage: this.deviceForm.ratedVoltage,
          ratedCurrent: this.deviceForm.ratedCurrent,
          portCount: this.deviceForm.portCount,
          brand: this.deviceForm.brand,
          model: this.deviceForm.model,
          installDate: this.deviceForm.installDate,
          lastUpdate: this.getRandomTime(),
        };

        this.devices.push(newDevice);
        this.updateStats();
        this.showToast("充电桩添加成功", "success");
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
        type: "dc_fast",
        protocol: "OCPP 1.6",
        isSelfOperated: true,
        maxPower: 60,
        ratedVoltage: 380,
        ratedCurrent: 160,
        portCount: 1,
        area: "",
        parkingSpot: "",
        address: "",
        brand: "特来电",
        model: "",
        installDate: "",
        maintenanceCycle: 90,
        remark: "",
      };
    },

    // 批量操作
    batchAction(action) {
      // 设置选中状态
      this.quickActionSelected = action;

      const selectedDeviceObjects = this.devices.filter((d) =>
        this.selectedDevices.includes(d.id)
      );

      selectedDeviceObjects.forEach((device) => {
        if (device.online) {
          switch (action) {
            case "enable":
              device.power = true;
              if (device.status !== "fault" && device.status !== "maintenance") {
                device.status = "idle";
              }
              break;
            case "disable":
              device.power = false;
              device.currentPower = 0;
              device.current = 0;
              device.status = "idle";
              break;
            case "maintenance":
              device.power = false;
              device.currentPower = 0;
              device.current = 0;
              device.status = "maintenance";
              break;
            case "reset":
              if (device.status !== "maintenance") {
                device.status = "idle";
                device.currentPower = 0;
                device.current = 0;
              }
              break;
          }
        }
      });

      this.updateStats();
      this.showToast(
        `已对 ${selectedDeviceObjects.length} 台充电桩执行操作`,
        "success"
      );

      // 3秒后清除选中状态
      setTimeout(() => {
        this.quickActionSelected = null;
      }, 3000);
    },

    // 应用批量控制
    applyBatchControl() {
      const selectedDeviceObjects = this.devices.filter((d) =>
        this.selectedDevices.includes(d.id)
      );

      selectedDeviceObjects.forEach((device) => {
        if (device.online && device.status !== "maintenance") {
          if (this.batchSettings.maxPower) {
            device.maxPower = this.batchSettings.maxPower;
          }
          if (this.batchSettings.voltage) {
            device.voltage = this.batchSettings.voltage;
          }
          if (this.batchSettings.maxCurrent) {
            device.ratedCurrent = this.batchSettings.maxCurrent;
          }
        }
      });

      this.updateStats();
      this.showBatchControl = false;
      this.showToast(
        `批量设置已应用到 ${selectedDeviceObjects.length} 台充电桩`,
        "success"
      );
    },

    // 导出数据
    exportData() {
      // 准备导出数据
      const exportData = this.filteredDevices.map((device) => ({
        设备编号: device.id,
        设备名称: device.name,
        所在位置: device.location,
        设备类型: this.typeMap[device.type],
        通信协议: device.protocol,
        运营模式: device.isSelfOperated ? "自营" : "合作运营",
        状态: this.getStatusText(device),
        最大功率: device.maxPower + "kW",
        当前功率: device.currentPower + "kW",
        输出电压: device.voltage + "V",
        输出电流: device.current + "A",
        利用率: device.utilizationRate + "%",
        设备温度: device.temperature + "°C",
        品牌: device.brand,
        型号: device.model,
        安装日期: device.installDate,
        最后更新: device.lastUpdate,
      }));

      // 转换为CSV格式
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers.map((header) => row[header]).join(",")
        ),
      ].join("\n");

      // 创建下载
      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `充电桩设备数据_${
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
.charging-management {
  min-height: 100vh;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  color: #1f2329;
  background: #f5f7fa;
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
  border-radius: 8px 8px 0 0;
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
  background: #52c41a;
}

.stat-dot.charging {
  background: #ff7875;
  animation: charging-pulse 2s infinite;
}

@keyframes charging-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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
  color: #3370ff;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-text-small:hover {
  background: #f2f3f5;
}

.btn-text-small.danger {
  color: #f54a45;
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
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

/* 设备卡片 - 重新设计 */
.device-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eaecf0;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.05), 0 1px 2px rgba(16, 24, 40, 0.05);
}

.device-card:hover {
  box-shadow: 0 4px 16px rgba(16, 24, 40, 0.08), 0 2px 6px rgba(16, 24, 40, 0.08);
  transform: translateY(-2px);
  border-color: #d0d5dd;
}

.device-card.is-offline {
  opacity: 0.6;
  border-color: #f2f4f7;
}

.device-card.is-fault {
  border-color: #fed7d7;
  box-shadow: 0 1px 3px rgba(239, 68, 68, 0.1);
}

.device-card.is-selected {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1), 0 1px 3px rgba(16, 24, 40, 0.05);
}

.device-card.is-charging::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
}

/* 卡片头部 */
.card-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #6366f1;
}

.status-indicator {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.status-indicator.charging {
  background: #d1fae5;
  color: #065f46;
}

.status-indicator.idle {
  background: #f3f4f6;
  color: #374151;
}

.status-indicator.offline {
  background: #f3f4f6;
  color: #6b7280;
}

.status-indicator.fault {
  background: #fee2e2;
  color: #991b1b;
}

.status-indicator.maintenance {
  background: #dbeafe;
  color: #1e40af;
}

.card-menu {
  position: relative;
}

.menu-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.menu-btn:hover {
  background: #f9fafb;
  color: #374151;
}

.menu-dropdown {
  position: absolute;
  right: 0;
  top: 32px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 140px;
  z-index: 100;
  overflow: hidden;
}

.menu-dropdown button {
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  text-align: left;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-dropdown button:hover {
  background: #f9fafb;
}

.menu-dropdown button.danger {
  color: #dc2626;
}

.menu-dropdown button.danger:hover {
  background: #fef2f2;
}

/* 卡片内容 */
.card-content {
  padding: 20px;
}

.device-info {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.device-id {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
  font-weight: 500;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.device-name {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
  line-height: 1.3;
}

.device-location {
  font-size: 13px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.device-location svg {
  color: #94a3b8;
}

/* 设备属性网格 */
.device-attrs {
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.attr-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
}

.attr-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.attr-value {
  font-size: 14px;
  color: #0f172a;
  font-weight: 700;
}

.attr-value.type-dc_fast {
  color: #059669;
}

.attr-value.type-dc_slow {
  color: #2563eb;
}

.attr-value.type-ac {
  color: #d97706;
}

.attr-value.self-operated {
  color: #059669;
}

.attr-value.partner {
  color: #2563eb;
}

/* 实时数据网格 */
.realtime-data {
  margin-bottom: 20px;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.data-item {
  text-align: center;
  padding: 12px 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.data-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.data-value {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  font-feature-settings: 'tnum';
}

.data-value.primary {
  color: #059669;
}

/* 充电时长 */
.charging-duration {
  margin-top: 16px;
  padding: 12px 16px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
}

.duration-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: #065f46;
  font-weight: 600;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

/* 卡片底部 */
.card-footer {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f5f9;
  background: #fafbfc;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.temp-status {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
}

.temp-status.normal {
  background: #dcfce7;
  color: #166534;
}

.temp-status.warm {
  background: #fed7aa;
  color: #9a3412;
}

.temp-status.hot {
  background: #fecaca;
  color: #991b1b;
}

.last-update {
  font-size: 11px;
  color: #64748b;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 充电桩专用开关按钮 */
.power-btn {
  position: relative;
  width: 48px;
  height: 28px;
  background: #e2e8f0;
  border: 2px solid #cbd5e1;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 2px;
}

.power-btn:hover:not(:disabled) {
  border-color: #94a3b8;
  box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.2);
}

.power-btn.active {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: #059669;
  justify-content: flex-end;
}

.power-btn.active:hover {
  border-color: #047857;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
}

.power-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.power-btn::before {
  content: "";
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.power-btn.active::before {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 控制按钮 */
.control-btn {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #111827;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .device-attrs {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .data-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .footer-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .device-attrs {
    grid-template-columns: 1fr;
  }
  
  .data-grid {
    grid-template-columns: 1fr;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .footer-actions {
    justify-content: center;
  }
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
  background: #fafbfc;
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

.action-col {
  text-align: right;
}

.type-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.type-badge.dc_fast {
  background: #f6ffed;
  color: #52c41a;
}

.type-badge.dc_slow {
  background: #e6f7ff;
  color: #1890ff;
}

.type-badge.ac {
  background: #fff7e6;
  color: #fa8c16;
}

.operation-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.operation-badge.self {
  background: #f6ffed;
  color: #52c41a;
}

.operation-badge.partner {
  background: #e6f7ff;
  color: #1890ff;
}

.status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.status-badge.charging {
  background: #f6ffed;
  color: #52c41a;
}

.status-badge.idle {
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

.status-badge.maintenance {
  background: #e8f4ff;
  color: #1890ff;
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

/* 弹窗 */
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

.modal-content.modal-device-detail {
  max-width: 560px;
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

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.charging {
  background: #52c41a;
}

.status-dot.idle {
  background: #8c8c8c;
}

.status-dot.offline {
  background: #d9d9d9;
}

.status-dot.fault {
  background: #f54a45;
}

.status-dot.maintenance {
  background: #1890ff;
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

.device-detail-body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
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

/* 单选按钮组 */
.radio-group {
  display: flex;
  gap: 16px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #1f2329;
}

.radio-item input[type="radio"] {
  display: none;
}

.radio-mark {
  width: 16px;
  height: 16px;
  border: 2px solid #dee0e3;
  border-radius: 50%;
  background: #fff;
  position: relative;
  transition: all 0.2s;
}

.radio-item input[type="radio"]:checked + .radio-mark {
  border-color: #3370ff;
  background: #3370ff;
}

.radio-item input[type="radio"]:checked + .radio-mark::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: #fff;
  border-radius: 50%;
}

.radio-label {
  font-size: 14px;
  font-weight: 500;
}

/* 折叠框样式 */
.config-collapse,
.location-collapse {
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

/* 批量控制 */
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
  gap: 16px;
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  font-weight: 600;
}

.weekday-checkbox:has(input:checked) {
  background: #e8f0ff;
  border-color: #3370ff;
  box-shadow: 0 2px 4px rgba(51, 112, 255, 0.1);
}

/* 设备详情控制 */
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

.power-icon {
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  color: white;
}

.voltage-icon {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
  color: white;
}

.current-icon {
  background: linear-gradient(135deg, #a8edea, #fed6e3);
  color: #333;
}

.efficiency-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
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

/* 控制卡片 */
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

/* 电源开关 */
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

/* 功率调节器 */
.power-adjuster {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f7f8fa;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e5e6eb;
}

.power-btn.minus,
.power-btn.plus {
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

.power-btn.minus:hover:not(:disabled),
.power-btn.plus:hover:not(:disabled) {
  background: #3370ff;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(51, 112, 255, 0.3);
}

.power-btn.minus:disabled,
.power-btn.plus:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.power-value {
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
  min-width: 60px;
  text-align: center;
}

/* 模式选择器 */
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

/* 预约充电设置 */
.reservation-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 200px;
}

.reservation-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #1f2329;
}

.reservation-checkbox input {
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

.reservation-checkbox input:checked + .checkmark {
  background: #3370ff;
  border-color: #3370ff;
}

.reservation-checkbox input:checked + .checkmark:after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.reservation-label {
  font-size: 13px;
  font-weight: 500;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.time-input {
  padding: 6px 10px;
  border: 1px solid #dee0e3;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  color: #1f2329;
  font-weight: 500;
}

.time-input:focus {
  outline: none;
  border-color: #3370ff;
  box-shadow: 0 0 0 2px rgba(51, 112, 255, 0.15);
}

/* 保护选项 */
.protection-options {
  display: flex;
  gap: 16px;
}

.protection-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #1f2329;
}

.protection-checkbox input {
  display: none;
}

.protection-label {
  font-size: 13px;
  font-weight: 500;
}

/* 温度监控 */
.temp-monitor {
  display: flex;
  align-items: center;
  gap: 12px;
}

.temp-status {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.temp-status.normal {
  background: #f6ffed;
  color: #52c41a;
}

.temp-status.warm {
  background: #fff7e6;
  color: #fa8c16;
}

.temp-status.hot {
  background: #fff2f0;
  color: #f5222d;
}

.temp-alert-btn {
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #dee0e3;
  border-radius: 6px;
  font-size: 12px;
  color: #646a73;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.temp-alert-btn:hover {
  background: #fff7e6;
  border-color: #fa8c16;
  color: #fa8c16;
}

.temp-alert-btn.active {
  background: #fff7e6;
  border-color: #fa8c16;
  color: #fa8c16;
}

/* 消息提示 */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 2000;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast.success {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.toast.error {
  background: #fff2f0;
  color: #f5222d;
  border: 1px solid #ffccc7;
}

.toast.warning {
  background: #fffbe6;
  color: #d48806;
  border: 1px solid #ffe58f;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.text-muted {
  color: #8f959e;
  font-size: 13px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .devices-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .quick-action {
    padding: 16px 12px;
    gap: 8px;
  }

  .quick-action-icon {
    width: 40px;
    height: 40px;
  }

  .quick-action span {
    font-size: 13px;
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

  .mode-selector {
    flex-wrap: wrap;
  }

  .modal-device-detail {
    width: 95%;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }

  .filter-group {
    flex-direction: column;
    gap: 8px;
  }

  .search-box {
    width: 100%;
  }

  .action-bar {
    flex-direction: column;
    gap: 12px;
  }

  .action-left,
  .action-right {
    width: 100%;
    justify-content: space-between;
  }

  .header-stats {
    flex-direction: column;
    gap: 4px;
  }

  .data-grid {
    grid-template-columns: 1fr;
  }

  .attr-row {
    flex-direction: column;
    gap: 8px;
  }
}
</style>