<template>
  <el-drawer
    :visible.sync="visible"
    :before-close="handleClose"
    size="60%"
    :destroy-on-close="true"
    class="air-detail-drawer"
  >
    <!-- 抽屉标题 -->
    <div slot="title" class="drawer-title">
      <span>详情</span>
    </div>

    <!-- 抽屉内容 -->
    <div v-loading="pageLoading" class="drawer-content">
      <!-- 顶部信息区 -->
      <div class="top-section">
        <!-- 左侧：基本信息 -->
        <div class="left-info">
          <!-- 设备名称和状态标签 -->
          <div class="device-header">
            <h2 class="device-name">{{ deviceInfo.name || "--" }}</h2>
            <div class="status-tags">
              <el-tag
                size="small"
                :type="deviceInfo.state == 0 ? 'success' : 'danger'"
              >
                {{ deviceInfo.state == 0 ? "在线" : "离线" }}
              </el-tag>
              <el-tag
                size="small"
                :type="deviceInfo.powerStatus == 1 ? 'success' : 'info'"
              >
                {{ deviceInfo.powerStatus == 1 ? "开机" : "关机" }}
              </el-tag>
              <el-tag size="small" type="warning">
                {{ deviceInfo.typeLabel || "--" }}
              </el-tag>
            </div>
          </div>

          <!-- 信息两列布局 -->
          <div class="info-grid">
            <div class="info-row">
              <div class="info-item">
                <span class="label">设备序列号:</span>
                <span class="value">{{ deviceInfo.indoorUnitId || "--" }}</span>
              </div>
              <div class="info-item">
                <span class="label">创建时间:</span>
                <span class="value">{{ deviceInfo.createTime || "--" }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="label">编号:</span>
                <span class="value">{{ deviceInfo.id || "--" }}</span>
              </div>
              <div class="info-item">
                <span class="label">数据更新:</span>
                <span class="value">{{ lastUpdateTime }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="label">设备类型:</span>
                <span class="value">{{ deviceInfo.typeLabel || "--" }}</span>
              </div>
              <div class="info-item">
                <span class="label">所属网关:</span>
                <span class="value">{{ deviceInfo.addr || "--" }}</span>
              </div>
            </div>
            <!-- <div class="info-row">
              <div class="info-item full-width">
                <span class="label">归属项目:</span>
                <span class="value">{{ deviceInfo.managerData || "--" }}</span>
              </div>
            </div> -->
          </div>
        </div>

        <!-- 右侧：已绑信息 + 操作按钮 -->
        <div class="right-info">
          <!-- 操作按钮 -->
          <div class="action-buttons">
            <el-button
              size="small"
              :type="deviceInfo.powerStatus == 1 ? 'danger' : 'success'"
              plain
              :disabled="deviceInfo.state !== 0"
              @click="handlePowerToggle"
            >
              {{ deviceInfo.powerStatus == 1 ? "关机" : "开机" }}
            </el-button>
            <el-button size="small" plain @click="handleEdit">编辑</el-button>
          </div>

          <!-- 已绑信息卡片 -->
          <div class="bind-card">
            <h4 class="bind-title">已绑信息</h4>
            <div class="bind-content">
              <!-- 绑定信息 -->
              <div
                v-if="deviceInfo.bindId && deviceInfo.bindData"
                class="bind-info"
              >
                <div class="bind-header">
                  <el-tag
                    size="small"
                    :type="deviceInfo.bindType == 1 ? 'primary' : 'warning'"
                  >
                    {{ deviceInfo.bindType == 1 ? "专用" : "公摊" }}
                  </el-tag>
                  <span class="bind-text">{{ deviceInfo.bindData }}</span>
                </div>
              </div>
              <div v-else class="no-bind">暂无绑定信息</div>

              <!-- 计量电表 -->
              <div
                v-if="deviceInfo.meterData && deviceInfo.meterData.length"
                class="meter-section"
              >
                <div class="meter-name">计量电表</div>
                <div class="meter-detail">
                  <span
                    v-for="(meter, index) in deviceInfo.meterData"
                    :key="meter.id"
                  >
                    <el-link type="primary" style="margin-right: 8px" @click="handleMeterClick(meter.serial)">{{
                      meter.serial
                    }}</el-link>
                  </span>
                </div>
              </div>
              <div v-else class="meter-section">
                <div class="no-meter">暂无计量电表</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 实时指标卡片 -->
      <div class="metrics-cards">
        <div class="metric-card">
          <div class="metric-label">设置温度/℃</div>
          <div class="metric-value">
            {{
              deviceInfo.targetTemperature !== null
                ? deviceInfo.targetTemperature
                : "--"
            }}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">室内温度/℃</div>
          <div class="metric-value">
            {{
              deviceInfo.roomTemperature !== null
                ? deviceInfo.roomTemperature
                : "--"
            }}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">运行模式</div>
          <div class="metric-value" style="font-size: 22px">
            {{ deviceInfo.operationModeLabel || "--" }}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">风速档位</div>
          <div class="metric-value" style="font-size: 22px">
            {{ deviceInfo.fanSpeedLabel || "--" }}
          </div>
        </div>
      </div>



      <!-- 控制历史 -->
      <div class="chart-section">
        <div class="section-header">
          <h4>控制历史</h4>
          <div class="chart-controls">
            <el-button-group class="view-toggle">
              <el-button
                size="small"
                :type="viewMode === 'table' ? 'primary' : ''"
                @click="viewMode = 'table'"
              >
                表格
              </el-button>
              <el-button
                size="small"
                :type="viewMode === 'chart' ? 'primary' : ''"
                @click="viewMode = 'chart'"
                style="margin-left: 10px"
              >
                图表
              </el-button>
            </el-button-group>
          </div>
        </div>

        <!-- 表格视图 -->
        <div v-show="viewMode === 'table'" class="table-view">
          <!-- 控制历史表格 -->
          <el-table
            v-if="controlHistory.length > 0"
            v-loading="historyLoading"
            :data="controlHistory"
            height="350"
            style="width: 100%"
          >
            <el-table-column prop="occurTime" label="操作时间" />
            <el-table-column label="操作来源">
              <template slot-scope="scope">
                {{ scope.row.ctrType == 1 ? "设备上报" : "用户下发" }}
              </template>
            </el-table-column>
            <el-table-column label="操作类型">
              <template slot-scope="scope">
                {{ getLogTypeLabel(scope.row.setType) }}
              </template>
            </el-table-column>
            <el-table-column prop="setValLable" label="操作内容" />
            <el-table-column label="操作结果">
              <template slot-scope="scope">
                <el-tag
                  :type="scope.row.res == 1 ? 'success' : 'danger'"
                  size="small"
                >
                  {{ scope.row.res == 1 ? "成功" : "失败" }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div v-else-if="!historyLoading" class="empty-state">
            <i class="el-icon-document"></i>
            <p>暂无控制历史</p>
          </div>
        </div>

        <!-- 图表视图 -->
        <div v-show="viewMode === 'chart'" class="chart-view">
          <div
            v-if="controlHistory.length > 0"
            v-loading="historyLoading"
            ref="historyChart"
            class="history-chart"
          ></div>
          <div v-else-if="!historyLoading" class="empty-state">
            <i class="el-icon-data-line"></i>
            <p>暂无控制历史</p>
          </div>
        </div>
      </div>

      <!-- 设备用能统计 -->
      <div class="usage-section">
        <div class="section-header">
          <h4>设备用能统计</h4>
          <div style="display: flex; align-items: center;">
            <el-date-picker
              v-model="energyDateRange"
              type="daterange"
              size="small"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
              @change="handleEnergyDateChange"
              style="width: 300px"
            />
            <el-button type="text" @click="goToDetailReport" style="margin-left: 10px">
              查看详细报表 >
            </el-button>
          </div>
        </div>

        <el-table
          v-if="energyData.length > 0"
          v-loading="energyLoading"
          :data="energyData"
          style="width: 100%"
          size="small"
          border
          max-height="400"
        >
          <el-table-column
            prop="occurDate"
            label="日期"
            width="120"
            fixed="left"
            align="center"
          />
          <el-table-column label="高风速" align="center">
            <el-table-column label="时长(小时)" width="90" align="center">
              <template slot-scope="scope">
                {{ scope.row.highSpeedTime || "0.00" }}
              </template>
            </el-table-column>
            <el-table-column label="电量(度)" width="80" align="center">
              <template slot-scope="scope">
                {{ scope.row.highSpeedElec || "0.00" }}
              </template>
            </el-table-column>
          </el-table-column>
          <el-table-column label="中风速" align="center">
            <el-table-column label="时长(小时)" width="90" align="center">
              <template slot-scope="scope">
                {{ scope.row.midSpeedTime || "0.00" }}
              </template>
            </el-table-column>
            <el-table-column label="电量(度)" width="80" align="center">
              <template slot-scope="scope">
                {{ scope.row.midSpeedElec || "0.00" }}
              </template>
            </el-table-column>
          </el-table-column>
          <el-table-column label="低风速" align="center">
            <el-table-column label="时长(小时)" width="90" align="center">
              <template slot-scope="scope">
                {{ scope.row.lowSpeedTime || "0.00" }}
              </template>
            </el-table-column>
            <el-table-column label="电量(度)" width="80" align="center">
              <template slot-scope="scope">
                {{ scope.row.lowSpeedElec || "0.00" }}
              </template>
            </el-table-column>
          </el-table-column>
          <el-table-column label="自动风" align="center">
            <el-table-column label="时长(小时)" width="90" align="center">
              <template slot-scope="scope">
                {{ scope.row.autoSpeedTime || "0.00" }}
              </template>
            </el-table-column>
            <el-table-column label="电量(度)" width="80" align="center">
              <template slot-scope="scope">
                {{ scope.row.autoSpeedElec || "0.00" }}
              </template>
            </el-table-column>
          </el-table-column>
          <el-table-column
            label="总时长(h)"
            width="100"
            align="center"
            fixed="right"
          >
            <template slot-scope="scope">
              <span style="font-weight: 600; color: #303133">{{
                scope.row.totalTime || "0.00"
              }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="总电量(度)"
            width="100"
            align="center"
            fixed="right"
          >
            <template slot-scope="scope">
              <span style="font-weight: 600; color: #303133">{{
                scope.row.totalElec || "0.00"
              }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div v-else class="empty-state">
          <i class="el-icon-document"></i>
          <p>暂无用能统计数据</p>
        </div>
      </div>

      <!-- 关系图 -->
      <div class="chart-section relation-section">
        <div class="section-header">
          <h4>关系图</h4>
        </div>
        <div 
          v-if="hasRelationData"
          class="chart-scroll-wrapper" 
          style="height: 350px; overflow-y: auto; overflow-x: hidden; border: 1px solid #EBEEF5;"
        >
          <div
            ref="relationChart"
            :style="{ width: '100%', height: chartHeight + 'px', background: '#fff' }"
          ></div>
        </div>
        <div v-else class="empty-state" style="height: 350px;">
          <i class="el-icon-connection"></i>
          <p>暂无关联设备</p>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script>
import moment from "moment";
import {
  airControlLogPageAirGateWay,
  airInfoQueryAirUseStatis,
  airInfoControlAir,
} from "@/api/airCondition";
import { mapState } from "vuex";

export default {
  name: "AirDetailDrawer",

  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    deviceId: {
      type: [String, Number],
      default: "",
    },
    rowData: {
      type: Object,
      default: () => ({}),
    },
  },

  data() {
    return {
      pageLoading: false,
      historyLoading: false,
      energyLoading: false,

      deviceInfo: {},
      lastUpdateTime: "",

      viewMode: "table",

      controlHistory: [],
      energyData: [],
      energyDateRange: [],

      historyChart: null,
      relationChart: null,
      chartHeight: 400,
    };
  },

  computed: {
    ...mapState("enumData", [
      "airlogType",
      "powerStatus",
      "operationMode",
      "fanSpeed",
      "lockPowerStatus",
      "lockOperationMode",
      "lockFanSpeed",
    ]),

    hasRelationData() {
      const { serial, airList } = this.deviceInfo;
      const hasMeter = !!serial;
      let hasAir = false;
      try {
        if (Array.isArray(airList)) {
          hasAir = airList.length > 0;
        } else if (typeof airList === "string") {
          const parsed = JSON.parse(airList);
          hasAir = parsed && parsed.length > 0;
        }
      } catch (e) {
        hasAir = false;
      }
      return hasMeter || hasAir;
    },

    enums() {
      return {
        airlogType: this.airlogType || [
          { value: 1, label: "开关" },
          { value: 2, label: "模式" },
          { value: 3, label: "锁定" },
        ],
        powerStatus: this.powerStatus || [
          { value: 0, label: "关闭" },
          { value: 1, label: "开启" },
        ],
        operationMode: this.operationMode || [
          { value: 0, label: "自动" },
          { value: 1, label: "制热" },
          { value: 2, label: "制冷" },
          { value: 4, label: "送风" },
          { value: 8, label: "除湿" },
        ],
        fanSpeed: this.fanSpeed || [
          { value: 0, label: "自动" },
          { value: 1, label: "低风" },
          { value: 2, label: "中风" },
          { value: 3, label: "高风" },
        ],
        lockPowerStatus: this.lockPowerStatus || [
          { value: 0, label: "不锁定" },
          { value: 128, label: "关机" },
          { value: 129, label: "开机" },
        ],
        lockOperationMode: this.lockOperationMode || [
          { value: 0, label: "不锁定" },
          { value: 128, label: "自动" },
          { value: 129, label: "制热" },
          { value: 130, label: "制冷" },
          { value: 132, label: "送风" },
          { value: 136, label: "除湿" },
        ],
        lockFanSpeed: this.lockFanSpeed || [
          { value: 0, label: "不锁定" },
          { value: 128, label: "自动" },
          { value: 129, label: "低风" },
          { value: 130, label: "中风" },
          { value: 131, label: "高风" },
        ],
      };
    },
  },

  watch: {
    visible(val) {
      if (val) {
        this.loadData();
      } else {
        this.resetData();
      }
    },
    viewMode(val) {
      if (val === "chart" && this.controlHistory.length > 0) {
        this.$nextTick(() => {
          this.renderChart();
        });
      }
    },
  },

  beforeDestroy() {
    if (this.historyChart) {
      this.historyChart.dispose();
    }
    if (this.relationChart) {
      this.relationChart.dispose();
      this.relationChart = null;
    }
  },

  methods: {
    async loadData() {
      this.pageLoading = true;

      try {
        if (this.rowData && this.rowData.id) {
          this.deviceInfo = { ...this.rowData };
          // 初始化关系图
          this.$nextTick(() => {
            this.initRelationChart();
          });
        }

        // 设置默认时间范围（最近7天）
        this.energyDateRange = [
          moment().subtract(7, "days").format("YYYY-MM-DD"),
          moment().format("YYYY-MM-DD"),
        ];

        // 更新最后更新时间
        this.lastUpdateTime = moment().format("YYYY-MM-DD HH:mm:ss");

        await Promise.all([this.loadControlHistory(), this.loadEnergyData()]);
      } catch (error) {
        console.error("加载数据失败:", error);
        this.$message.error("加载数据失败");
      } finally {
        this.pageLoading = false;
      }
    },

    async loadControlHistory() {
      this.historyLoading = true;
      try {
        const response = await airControlLogPageAirGateWay({
          airId: this.deviceInfo.id,
          page: {
            current: 1,
            size: 50,
          },
        });

        if (response.code === 200 && response.data) {
          const dataList = response.data.dataList || [];
          this.controlHistory = dataList.map((item) =>
            this.formatLogData(item)
          );
        }
      } catch (error) {
        console.error("加载控制历史失败:", error);
      } finally {
        this.historyLoading = false;
      }
    },

    formatLogData(item) {
      if (item.setType == 1) {
        const statusItem = this.enums.powerStatus.find(
          (e) => e.value == item.setVal
        );
        item.setValLable = statusItem ? statusItem.label : "-";
      } else if (item.setType == 2) {
        const modeItem = this.enums.operationMode.find(
          (e) => e.value == item.setVal
        );
        item.setValLable = modeItem ? modeItem.label : "-";
      } else if (
        item.setType == 3 &&
        item.setVal &&
        item.setVal.indexOf("-") !== -1
      ) {
        const arr = item.setVal.split("-");
        const strArr = [];
        arr.forEach((val, index) => {
          if (val != 0) {
            if (index === 0) {
              const lockPowerItem = this.enums.lockPowerStatus.find(
                (e) => e.value == val
              );
              if (lockPowerItem) strArr.push(lockPowerItem.label);
            } else if (index === 1) {
              const lockModeItem = this.enums.lockOperationMode.find(
                (e) => e.value == val
              );
              if (lockModeItem) strArr.push(lockModeItem.label);
            } else if (index === 2) {
              const lockFanItem = this.enums.lockFanSpeed.find(
                (e) => e.value == val
              );
              if (lockFanItem) strArr.push(lockFanItem.label);
            } else if (index === 3 || index === 4) {
              strArr.push(val);
            }
          }
        });
        item.setValLable = strArr.length ? strArr.join("-") : "解锁";
      } else {
        item.setValLable = item.setVal || "-";
      }
      return item;
    },

    async loadEnergyData() {
      if (!this.energyDateRange || this.energyDateRange.length !== 2) {
        return;
      }

      this.energyLoading = true;
      try {
        const response = await airInfoQueryAirUseStatis({
          airId: this.deviceInfo.id,
          startDate: this.energyDateRange[0],
          endDate: this.energyDateRange[1],
        });

        if (response.code === 200 && response.data) {
          const time = 60 * 60;
          this.energyData = (response.data || []).map((item) => {
            item.highSpeedTime = item.highSpeedTime
              ? (item.highSpeedTime / time).toFixed(2)
              : "0.00";
            item.midSpeedTime = item.midSpeedTime
              ? (item.midSpeedTime / time).toFixed(2)
              : "0.00";
            item.lowSpeedTime = item.lowSpeedTime
              ? (item.lowSpeedTime / time).toFixed(2)
              : "0.00";
            item.autoSpeedTime = item.autoSpeedTime
              ? (item.autoSpeedTime / time).toFixed(2)
              : "0.00";
            item.totalTime = item.totalTime
              ? (item.totalTime / time).toFixed(2)
              : "0.00";
            item.highSpeedElec = item.highSpeedElec || "0.00";
            item.midSpeedElec = item.midSpeedElec || "0.00";
            item.lowSpeedElec = item.lowSpeedElec || "0.00";
            item.autoSpeedElec = item.autoSpeedElec || "0.00";
            item.totalElec = item.totalElec || "0.00";
            return item;
          });
        }
      } catch (error) {
        console.error("加载用能数据失败:", error);
      } finally {
        this.energyLoading = false;
      }
    },

    handleEnergyDateChange() {
      this.loadEnergyData();
    },

    initRelationChart() {
      // 如果没有数据，直接销毁图表并返回
      if (!this.hasRelationData) {
        if (this.relationChart) {
          this.relationChart.dispose();
          this.relationChart = null;
        }
        return;
      }

      const { gatewayName, serial, airList, id } = this.deviceInfo;
      const nodes = [];
      const links = [];

      // 数据预处理
      const meterList = serial ? serial.split(",") : [];
      let airs = [];
      try {
        if (Array.isArray(airList)) {
          airs = airList;
        } else if (typeof airList === "string") {
          airs = JSON.parse(airList);
        }
      } catch (e) {
        console.warn("解析空调列表失败:", e);
        airs = [];
      }

      // 计算动态高度
      const maxNodes = Math.max(meterList.length, airs.length, 1);
      const minHeight = 350; // 适配容器高度
      const nodeHeight = 50; // 缩小节点间距
      this.chartHeight = Math.max(minHeight, maxNodes * nodeHeight + 60);

      this.$nextTick(() => {
        // 延时确保DOM渲染完成(抽屉动画结束)
        setTimeout(() => {
          if (!this.$refs.relationChart) return;
          
          if (this.relationChart) {
             this.relationChart.dispose();
          }
          this.relationChart = this.$echarts.init(this.$refs.relationChart);

          // 画布尺寸配置
          const width = this.$refs.relationChart.offsetWidth;
          const height = this.chartHeight;
          const centerX = width / 2;
          const centerY = height / 2;
          const leftX = 120; // 左侧电表X坐标(增加间距适配长字符)
          const rightX = width - 120; // 右侧空调X坐标

          // 自动滚动到中间位置
          try {
            const scrollWrapper = this.$refs.relationChart.parentElement;
            if (scrollWrapper) {
              const scrollTop = centerY - scrollWrapper.clientHeight / 2;
              if (scrollTop > 0) {
                scrollWrapper.scrollTop = scrollTop;
              }
            }
          } catch (e) {
            console.warn("自动滚动失败", e);
          }

          // 样式配置
          const activeColor = "#409EFF"; // 激活色(蓝)
          const normalColor = "#F4F4F5"; // 普通色(灰)
          const activeTextColor = "#fff";
          const normalTextColor = "#606266";
          const borderColor = "#DCDFE6";
          
          // 节点通用样式
          const symbolSize = [140, 32]; // 增加宽度适配长字符
          const borderRadius = 8; // 圆角

          // 1. 中间节点 (网关)
          const centerName = gatewayName || "--";
          nodes.push({
            name: centerName,
            x: centerX,
            y: centerY,
            value: "外机系统",
            itemStyle: {
              color: activeColor,
              borderColor: activeColor,
              borderRadius: borderRadius,
            },
            label: {
              color: activeTextColor,
            },
            symbol: "rect",
          });

          // 2. 左侧节点 (电表)
          const meterCount = meterList.length;
          meterList.forEach((m, index) => {
            const y =
              meterCount === 1
                ? centerY
                : (height / (meterCount + 1)) * (index + 1);

            nodes.push({
              name: m || "--",
              x: leftX,
              y: y,
              value: "电表",
              itemStyle: {
                color: normalColor,
                borderColor: borderColor,
                borderWidth: 1,
                borderRadius: borderRadius,
              },
              label: {
                color: normalTextColor,
              },
              symbol: "rect",
            });

            // 连线：电表 -> 网关
            links.push({
              source: m || "--",
              target: centerName,
              lineStyle: {
                curveness: 0.1, // 减小曲率
              },
            });
          });

          // 3. 右侧节点 (空调)
          const airCount = airs.length;
          airs.forEach((air, index) => {
            const airName = air.name || "--";
            const isActive = air.id == id;
            const y =
              airCount === 1 ? centerY : (height / (airCount + 1)) * (index + 1);
            const nodeId = `air_${air.id || index}`;

            nodes.push({
              name: nodeId,
              x: rightX,
              y: y,
              value: "内机系统 " + airName,
              itemStyle: {
                color: isActive ? activeColor : normalColor,
                borderColor: isActive ? activeColor : borderColor,
                borderWidth: 1,
                borderRadius: borderRadius,
              },
              label: {
                show: true,
                formatter: "内机系统 " + airName,
                color: isActive ? activeTextColor : normalTextColor,
              },
              symbol: "rect",
              raw: air,
            });

            // 连线：网关 -> 空调
            links.push({
              source: centerName,
              target: nodeId,
              lineStyle: {
                curveness: 0.1, // 减小曲率
              },
            });
          });

          const option = {
            title: { show: false },
            tooltip: {
              trigger: "item",
              formatter: (params) => {
                if (params.dataType === "edge") return "";
                return params.data.value || params.name;
              },
            },
            animationDurationUpdate: 1500,
            animationEasingUpdate: "quinticInOut",
            series: [
              {
                type: "graph",
                layout: "none",
                symbol: "rect", // 改为矩形
                symbolSize: symbolSize, // 缩小后的尺寸
                roam: true,
                label: {
                  show: true,
                  fontSize: 12,
                },
                edgeSymbol: ["none", "none"],
                edgeSymbolSize: [4, 10],
                edgeLabel: { fontSize: 20 },
                data: nodes,
                links: links,
                lineStyle: {
                  opacity: 0.9,
                  width: 1,
                  curveness: 0.1, // 全局默认曲率
                  color: "#909399",
                },
              },
            ],
          };

          this.relationChart.setOption(option);
        }, 100);
      });
    },

    handleMeterClick(serial) {
    if (!serial) {
      this.$message.warning('电表序列号无效');
      return;
    }
    
    // 跳转到电表管理页面，并通过路由参数传递序列号
    this.$router.push({
      path: '/device/electricity', // 根据你的实际路由路径调整
      query: {
        serial: serial,
        autoSearch: 'true' // 标记需要自动搜索
      }
    });
  },
    renderChart() {
      if (!this.$refs.historyChart || this.controlHistory.length === 0) return;

      if (!this.historyChart) {
        this.historyChart = this.$echarts.init(this.$refs.historyChart);
      }

      // 统计操作类型分布
      const typeCount = {};
      this.controlHistory.forEach((item) => {
        const label = this.getLogTypeLabel(item.setType);
        typeCount[label] = (typeCount[label] || 0) + 1;
      });

      const option = {
        tooltip: {
          trigger: "item",
          formatter: "{b}: {c} ({d}%)",
        },
        legend: {
          orient: "vertical",
          left: "left",
        },
        series: [
          {
            name: "操作类型",
            type: "pie",
            radius: "50%",
            data: Object.keys(typeCount).map((key) => ({
              name: key,
              value: typeCount[key],
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
      };

      this.historyChart.setOption(option);
    },

    getLogTypeLabel(type) {
      const logTypeItem = this.enums.airlogType.find((e) => e.value === type);
      return logTypeItem ? logTypeItem.label : "-";
    },

    async handlePowerToggle() {
      if (this.deviceInfo.state !== 0) {
        this.$message.warning("设备离线，无法控制");
        return;
      }

      try {
        const newStatus = this.deviceInfo.powerStatus === 1 ? 0 : 1;
        await this.$confirm(
          `确定要${newStatus === 1 ? "开机" : "关机"}吗？`,
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        const response = await airInfoControlAir({
          addr: this.deviceInfo.addr,
          airId: this.deviceInfo.id,
          gatewayId: this.deviceInfo.gatewayId,
          indoorUnitId: this.deviceInfo.indoorUnitId,
          powerStatus: newStatus,
          operationMode: this.deviceInfo.operationMode,
          targetTemperature: this.deviceInfo.targetTemperature,
          fanSpeed: this.deviceInfo.fanSpeed,
        });

        if (response.code === 200) {
          this.$message.success(response.msg || "操作成功");
          this.deviceInfo.powerStatus = newStatus;
          this.$emit("refresh");
        } else {
          this.$message.error(response.msg || "操作失败");
        }
      } catch (error) {
        if (error !== "cancel") {
          this.$message.error("操作失败");
        }
      }
    },

    goToDetailReport() {
      const [startDate, endDate] = this.energyDateRange || [];
      this.$router.push({
        path: "/energy/charging-sankey",
        query: {
          startDate: startDate,
          endDate: endDate,
          airId: this.deviceInfo.id,
          deviceName: this.deviceInfo.name,
        },
      });
      this.handleClose();
    },

    handleEdit() {
      this.$emit("edit", this.deviceInfo);
    },

    handleClose() {
      this.$emit("update:visible", false);
    },

    resetData() {
      this.deviceInfo = {};
      this.controlHistory = [];
      this.energyData = [];
      this.viewMode = "table";
      this.lastUpdateTime = "";

      if (this.historyChart) {
        this.historyChart.dispose();
        this.historyChart = null;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.air-detail-drawer {
  ::v-deep .el-drawer__header {
    margin-bottom: 0;
    padding: 20px;
    border-bottom: 1px solid #e8e8e8;
  }

  .drawer-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }

  .drawer-content {
    padding: 20px;
    height: calc(100vh - 80px);
    overflow-y: auto;
  }

  .top-section {
    display: flex;
    gap: 20px;
    margin-bottom: 24px;
    background: #f5f7fa;
    padding: 20px;
    border-radius: 8px;
  }

  .left-info {
    flex: 1;

    .device-header {
      margin-bottom: 20px;

      .device-name {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }

      .status-tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
    }

    .info-grid {
      .info-row {
        display: flex;
        gap: 40px;
        margin-bottom: 12px;

        .info-item {
          flex: 1;
          display: flex;
          font-size: 14px;
          gap: 0;

          &.full-width {
            flex: 2;
          }

          .label {
            color: #909399;
            flex-shrink: 0;
          }

          .value {
            color: #303133;
          }
        }
      }
    }
  }

  .right-info {
    width: 360px;
    flex-shrink: 0;

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 16px;
    }

    .bind-card {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      padding: 16px;

      .bind-title {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .bind-content {
        .bind-info {
          margin-bottom: 16px;

          .bind-header {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;

            .bind-text {
              font-size: 14px;
              color: #303133;
              font-weight: 500;
            }
          }
        }

        .no-bind {
          color: #909399;
          text-align: center;
          padding: 12px;
          font-size: 14px;
        }

        .meter-section {
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;

          .meter-name {
            margin-bottom: 12px;
            font-size: 14px;
            color: #303133;
            font-weight: 500;
          }

          .meter-detail {
            font-size: 13px;
            color: #606266;
          }

          .no-meter {
            color: #909399;
            text-align: center;
            padding: 12px;
            font-size: 14px;
          }
        }
      }
    }
  }

  .metrics-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;

    .metric-card {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      padding: 20px;
      text-align: center;

      .metric-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 12px;
      }

      .metric-value {
        font-size: 28px;
        font-weight: 400;
        color: #303133;
      }
    }
  }

  .chart-section,
  .usage-section {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 24px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h4 {
        margin: 0;
        font-size: 16px;
        color: #303133;
        font-weight: 600;
      }

      .chart-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }

    .table-view,
    .chart-view {
      min-height: 350px;
    }

    .history-chart {
      height: 350px;
      width: 100%;
    }
  }

  .empty-state {
    height: 350px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #fafafa;
    border: 1px dashed #d9d9d9;
    border-radius: 8px;
    color: #909399;

    i {
      font-size: 48px;
      margin-bottom: 16px;
      color: #c0c4cc;
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  ::v-deep .el-table {
    th {
      background: #fafafa;
      color: #333;
      font-weight: 600;
    }

    .cell {
      padding: 0 8px;
    }

    .el-table__body-wrapper {
      overflow-x: auto !important;

      &::-webkit-scrollbar {
        height: 8px;
      }

      &::-webkit-scrollbar-thumb {
        background: #d9d9d9;
        border-radius: 4px;

        &:hover {
          background: #bfbfbf;
        }
      }
    }
  }

  @media (max-width: 1400px) {
    .top-section {
      flex-direction: column;
    }

    .right-info {
      width: 100%;
    }
  }

  @media (max-width: 768px) {
    .drawer-content {
      padding: 12px;
    }

    .metrics-cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
</style>
