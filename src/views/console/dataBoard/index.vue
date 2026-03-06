<template>
  <div class="dashboard-wrapper">
    <div class="dashboard">
      <!-- 主内容区 -->
      <div class="main-content">
        <!-- 左侧区域 -->
        <div class="left-section">
          <!-- 上部:设备状态 + 桑基图 -->
          <div class="charts-row">
            <!-- 设备状态区域(含设备概览) -->
            <div class="chart-box device-box">
              <div class="chart-title">
                <span>设备运行状态</span>
                <div class="legend-dots">
                  <span class="dot-item"><i class="dot excellent"></i>优秀</span>
                  <span class="dot-item"><i class="dot good"></i>良好</span>
                  <span class="dot-item"><i class="dot warning"></i>预警</span>
                </div>
              </div>
              <div class="device-radar-wrap">
                <div ref="radarChart" class="radar-chart"></div>
                <div class="device-stats">
                  <div class="device-ring-box">
                    <svg viewBox="0 0 36 36" class="ring-svg">
                      <circle cx="18" cy="18" r="15.5" class="ring-track" />
                      <circle cx="18" cy="18" r="15.5" class="ring-progress"
                        :stroke-dasharray="`${onlineRate * 0.974} 97.4`" />
                    </svg>
                    <div class="ring-inner">
                      <span class="ring-value">{{ Math.round(onlineRate) }}</span>
                      <span class="ring-unit">%</span>
                    </div>
                  </div>
                  <div class="device-info">
                    <div class="device-total">
                      <animated-number :value="totalMeterCount" />
                      <span>台</span>
                    </div>
                    <div class="device-detail">
                      <span><i class="dot private"></i>专用 {{ meterData?.privateMeter || 0 }}</span>
                      <span><i class="dot public"></i>公用 {{ meterData?.publicMeter || 0 }}</span>
                    </div>
                    <div class="device-status">
                      <span class="online">在线 {{ meterData?.onlineMeter || 0 }}</span>
                      <span class="offline">离线 {{ offlineCount }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 桑基图区域 -->
            <div class="chart-box sankey-box">
              <div class="chart-title">
                <span>
                  租户用电分布
                  <em class="date-tag">昨日</em>
                </span>
                <a class="view-link" @click="$router.push('/energy/electricity-sankey')">
                  查看详情
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              <!-- 图表区域 - 关键修改 -->
              <div class="chart-area-wrapper" v-loading="sankeyLoading">
                <!-- 使用 v-show 而不是 v-if,避免 DOM 销毁 -->
                <div 
                  ref="sankeyChart" 
                  class="chart-area"
                  v-show="!shouldShowEmpty"
                ></div>
                
                <!-- 空状态提示 -->
                <div v-show="shouldShowEmpty" class="chart-empty">
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" />
                  </svg>
                  <span>暂无用电数据</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 下部:趋势分析 -->
          <div class="trend-section">
            <div class="trend-header">
              <div class="trend-actions">
                <div class="legend-btns">
                  <button class="legend-btn" :class="{ inactive: !vis.elecUsage }" @click="toggle('elecUsage')">
                    <span class="legend-line elec"></span>用电量
                  </button>
                  <button class="legend-btn" :class="{ inactive: !vis.waterUsage }" @click="toggle('waterUsage')">
                    <span class="legend-line water"></span>用水量
                  </button>
                  <button class="legend-btn" :class="{ inactive: !vis.elecIncome }" @click="toggle('elecIncome')">
                    <span class="legend-bar elec"></span>电费
                  </button>
                  <button class="legend-btn" :class="{ inactive: !vis.waterIncome }" @click="toggle('waterIncome')">
                    <span class="legend-bar water"></span>水费
                  </button>
                </div>
                <div class="period-switch">
                  <button :class="{ active: datePeriod === 'day' }" @click="setPeriod('day')">近七天</button>
                  <button :class="{ active: datePeriod === 'month' }" @click="setPeriod('month')">近半年</button>
                </div>
              </div>
            </div>

            <!-- 统计指标 -->
            <div class="stat-tags">
              <div class="stat-tag elec-usage">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
                </svg>
                <span class="tag-value"><animated-number :value="currentStats.elecUsage"
                    :format="v => v.toFixed(1)" /></span>
                <span class="tag-unit">kWh</span>
                <span class="tag-change" :class="getChangeClass(currentStats.elecUsageChange)">
                  {{ formatChange(currentStats.elecUsageChange) }}
                </span>
                <span class="tag-label">{{ periodLabel }}用电</span>
              </div>

              <div class="stat-tag elec-fee">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 5l6 8 6-8" />
                  <path d="M12 13v8" />
                  <path d="M7 13h10" />
                  <path d="M7 17h10" />
                </svg>
                <span class="tag-value"><animated-number :value="currentStats.elecIncome"
                    :format="v => v.toFixed(0)" /></span>
                <span class="tag-unit">元</span>
                <span class="tag-change" :class="getChangeClass(currentStats.elecIncomeChange)">
                  {{ formatChange(currentStats.elecIncomeChange) }}
                </span>
                <span class="tag-label">{{ periodLabel }}电费</span>
              </div>

              <div class="stat-tag water-usage">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
                <span class="tag-value"><animated-number :value="currentStats.waterUsage"
                    :format="v => v.toFixed(1)" /></span>
                <span class="tag-unit">m³</span>
                <span class="tag-change" :class="getChangeClass(currentStats.waterUsageChange)">
                  {{ formatChange(currentStats.waterUsageChange) }}
                </span>
                <span class="tag-label">{{ periodLabel }}用水</span>
              </div>

              <div class="stat-tag water-fee">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 5l6 8 6-8" />
                  <path d="M12 13v8" />
                  <path d="M7 13h10" />
                  <path d="M7 17h10" />
                </svg>
                <span class="tag-value"><animated-number :value="currentStats.waterIncome"
                    :format="v => v.toFixed(0)" /></span>
                <span class="tag-unit">元</span>
                <span class="tag-change" :class="getChangeClass(currentStats.waterIncomeChange)">
                  {{ formatChange(currentStats.waterIncomeChange) }}
                </span>
                <span class="tag-label">{{ periodLabel }}水费</span>
              </div>
            </div>

            <div ref="mainChart" class="trend-chart"></div>
          </div>
        </div>

        <!-- 右侧列表 -->
        <div class="right-section">
          <!-- 欠费排名 -->
          <div class="list-panel debt-panel">
            <div class="panel-title">
              <span class="title-icon coral">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              租户欠费排名
              <span class="title-badge warn" v-if="debtList.length">{{ debtList.length }}</span>
            </div>
            <div class="list-content">
              <div class="list-row" v-for="(item, idx) in debtList" :key="'d' + idx" @click="goDetail(item)">
                <span class="row-rank" :class="{ top: idx < 3 }">{{ idx + 1 }}</span>
                <span class="row-name">{{ item.tenantName }}</span>
                <span class="row-value coral">{{ item.tenantBalance.toFixed(2) }}</span>
                <button class="remind-btn" @click.stop="remind(item)">催缴</button>
              </div>
              <div v-if="!debtList.length" class="list-empty ok">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                暂无欠费租户
              </div>
            </div>
          </div>

          <!-- 功率排名 -->
          <div class="list-panel power-panel">
            <div class="panel-title">
              <span class="title-icon teal">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
                </svg>
              </span>
              本月功率排名
              <span class="title-badge">{{ tenantRanking.length }}</span>
            </div>
            <div class="list-content">
              <div class="list-row" v-for="(item, idx) in tenantRanking" :key="'p' + idx" @click="goDetail(item)">
                <span class="row-rank" :class="getRankClass(idx)">{{ idx + 1 }}</span>
                <span class="row-name">{{ item.tenantName }}</span>
                <span class="row-value teal">{{ item.p }}<small>kW</small></span>
              </div>
              <div v-if="!tenantRanking.length" class="list-empty">暂无数据</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { mapGetters } from "vuex";
import {
  getTenantPList,
  getTenantStatusList,
  getMeterOverview,
  getElecStatistics,
} from "@/api/dashboard";
import { getSimpleTenantList } from "@/api/useReport";
import request from "@/utils/request";
import moment from "moment";

// 桑基图API
function queryTenantSankey(data) {
  return request({
    url: "/api/ebc-content/useReport/queryTenantSankey",
    method: "POST",
    headers: {
      userDeviceType: "PC",
      "Content-Type": "application/json",
    },
    data,
  });
}

// 桑基图配色
const SANKEY_COLORS = [
  "#5B8FF9",
  "#61DDAA",
  "#F6BD16",
  "#7262FD",
  "#78D3F8",
  "#9661BC",
  "#F6903D",
  "#008685",
];

const AnimatedNumber = {
  props: {
    value: { type: Number, default: 0 },
    format: { type: Function, default: (v) => Math.round(v).toLocaleString() },
  },
  data: () => ({ current: 0 }),
  watch: {
    value: {
      handler() {
        this.run();
      },
      immediate: true,
    },
  },
  methods: {
    run() {
      const start = performance.now();
      const from = this.current;
      const to = this.value;
      const duration = 800;
      const step = () => {
        const t = Math.min((performance.now() - start) / duration, 1);
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        this.current = from + (to - from) * ease;
        if (t < 1) requestAnimationFrame(step);
      };
      step();
    },
  },
  render(h) {
    return h("span", this.format(this.current));
  },
};

export default {
  name: "Dashboard",
  components: { AnimatedNumber },
  data: () => ({
    datePeriod: "day",
    tenantRanking: [],
    meterData: null,
    debtList: [],
    compareData: {
      dates: [],
      elecUsage: [],
      waterUsage: [],
      elecIncome: [],
      waterIncome: [],
    },
    vis: {
      elecUsage: true,
      waterUsage: true,
      elecIncome: true,
      waterIncome: true,
    },
    charts: {},
    sankeyLoading: false,
    sankeyData: null,
    tenantList: [],
    maxDisplayTenants: 6,
  }),
  computed: {
    ...mapGetters("manager", ["currentManagerId"]),
    totalMeterCount() {
      return (this.meterData?.privateMeter || 0) + (this.meterData?.publicMeter || 0);
    },
    onlineRate() {
      return this.totalMeterCount
        ? ((this.meterData?.onlineMeter || 0) / this.totalMeterCount) * 100
        : 0;
    },
    offlineCount() {
      return this.totalMeterCount - (this.meterData?.onlineMeter || 0);
    },
    periodLabel() {
      return this.datePeriod === "day" ? "昨日" : "本月";
    },
    currentStats() {
      const { elecUsage, waterUsage, elecIncome, waterIncome } = this.compareData;
      const lastIndex = elecUsage.length - 1;
      const prevIndex = lastIndex - 1;

      const calcChange = (current, previous) => {
        if (!previous || previous === 0) return 0;
        return ((current - previous) / previous) * 100;
      };

      return {
        elecUsage: lastIndex >= 0 ? elecUsage[lastIndex] : 0,
        waterUsage: lastIndex >= 0 ? waterUsage[lastIndex] : 0,
        elecIncome: lastIndex >= 0 ? elecIncome[lastIndex] : 0,
        waterIncome: lastIndex >= 0 ? waterIncome[lastIndex] : 0,
        elecUsageChange: prevIndex >= 0 ? calcChange(elecUsage[lastIndex], elecUsage[prevIndex]) : 0,
        waterUsageChange: prevIndex >= 0 ? calcChange(waterUsage[lastIndex], waterUsage[prevIndex]) : 0,
        elecIncomeChange: prevIndex >= 0 ? calcChange(elecIncome[lastIndex], elecIncome[prevIndex]) : 0,
        waterIncomeChange: prevIndex >= 0 ? calcChange(waterIncome[lastIndex], waterIncome[prevIndex]) : 0,
      };
    },
    // ✅ 关键:判断是否显示空状态
    shouldShowEmpty() {
      return !this.sankeyLoading && (!this.sankeyData || !this.sankeyData.links || this.sankeyData.links.length === 0);
    },
  },
  watch: {
    currentManagerId: {
      handler(newVal, oldVal) {
        if (newVal && newVal !== oldVal) {
          console.log('管理方切换:', oldVal, '->', newVal);

          // 清空所有数据
          this.tenantList = [];
          this.sankeyData = null;
          this.tenantRanking = [];
          this.meterData = null;
          this.debtList = [];

          // 销毁所有图表
          Object.values(this.charts).forEach((c) => c?.dispose?.());
          this.charts = {};

          // 重新初始化
          this.init();
        }
      },
      immediate: true,
    },
  },
  mounted() {
    window.addEventListener("resize", this.resize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resize);
    Object.values(this.charts).forEach((c) => c?.dispose?.());
  },
  methods: {
    async init() {
      await Promise.all([
        this.loadRanking(),
        this.loadMeter(),
        this.loadDebt(),
        this.loadCompare(),
        this.loadTenantList(),
      ]);
      this.$nextTick(() => {
        this.initRadarChart();
      });
    },

    async loadTenantList() {
      // 先清空数据
      this.tenantList = [];
      this.sankeyData = null;
      this.sankeyLoading = true;

      // ✅ 关键:先销毁旧图表
      if (this.charts.sankey) {
        this.charts.sankey.dispose();
        this.charts.sankey = null;
      }

      try {
        const { data } = await getSimpleTenantList({
          managerId: this.currentManagerId,
          tenantStatus: 0,
        });
        this.tenantList = data || [];

        // 等待 DOM 更新
        await this.$nextTick();
        await this.loadSankeyData();
      } catch (error) {
        console.error("获取租户列表失败:", error);
        this.tenantList = [];
        this.sankeyData = null;
      } finally {
        this.sankeyLoading = false;
      }
    },

    async loadSankeyData() {
      // 如果没有租户,直接设置为 null
      if (!this.tenantList.length) {
        this.sankeyData = null;
        
        // ✅ 确保销毁图表
        if (this.charts.sankey) {
          this.charts.sankey.dispose();
          this.charts.sankey = null;
        }
        
        console.log('无租户数据,显示空状态');
        return;
      }

      try {
        const params = {
          managerId: this.currentManagerId,
          tenantIdList: this.tenantList.map((item) => item.tenantId),
          queryDate: moment().subtract(1, "days").format("YYYY-MM-DD"),
        };

        const response = await queryTenantSankey(params);
        const data = response.data || response;
        const processedData = this.processSankeyData(data);

        // ✅ 关键:先销毁旧图表再设置新数据
        if (this.charts.sankey) {
          console.log('销毁旧桑基图实例');
          this.charts.sankey.dispose();
          this.charts.sankey = null;
        }

        // 检查处理后的数据
        if (!processedData || !processedData.links || processedData.links.length === 0) {
          console.log('处理后无数据,显示空状态');
          this.sankeyData = null;
        } else {
          console.log('有数据,准备绘制桑基图');
          this.sankeyData = processedData;
        }

        // 等待数据更新
        await this.$nextTick();
        await this.$nextTick(); // 双重确保
        
        // 绘制图表
        this.drawSankeyChart();

      } catch (error) {
        console.error("获取桑基图数据失败:", error);
        this.sankeyData = null;
        if (this.charts.sankey) {
          this.charts.sankey.dispose();
          this.charts.sankey = null;
        }
      }
    },

    // 三层桑基图:园区总用电 -> 专用/公摊 -> 租户
    processSankeyData(data) {
      if (!data) return null;

      const nodes = [];
      const links = [];

      const totalNodeName = data.managerName || "园区总用电";
      const privateTotalElec = data.privateTotalElec || 0;
      const shareTotalElec = data.shareTotalElec || 0;

      // 第一层:园区总用电
      nodes.push({
        name: totalNodeName,
        itemStyle: { color: "#1890ff" },
      });

      // 第二层:专用设备、公摊设备
      if (privateTotalElec > 0) {
        nodes.push({
          name: "专用设备",
          itemStyle: { color: "#52c41a" },
        });
        links.push({
          source: totalNodeName,
          target: "专用设备",
          value: privateTotalElec,
        });
      }

      if (shareTotalElec > 0) {
        nodes.push({
          name: "公摊设备",
          itemStyle: { color: "#faad14" },
        });
        links.push({
          source: totalNodeName,
          target: "公摊设备",
          value: shareTotalElec,
        });
      }

      // 收集租户用电数据
      const tenantPrivateMap = new Map();
      const tenantShareMap = new Map();

      if (data.tenantInfoDtoList && Array.isArray(data.tenantInfoDtoList)) {
        data.tenantInfoDtoList.forEach((tenant) => {
          tenantPrivateMap.set(tenant.tenantId, {
            tenantId: tenant.tenantId,
            tenantName: tenant.tenantName,
            totalElec: 0,
          });
          tenantShareMap.set(tenant.tenantId, {
            tenantId: tenant.tenantId,
            tenantName: tenant.tenantName,
            totalElec: 0,
          });
        });
      }

      // 统计专用设备用电
      if (data.meterUseDtoList && Array.isArray(data.meterUseDtoList)) {
        data.meterUseDtoList.forEach((meter) => {
          if (meter.bindType === 1 && meter.bindId) {
            const tenantData = tenantPrivateMap.get(meter.bindId);
            if (tenantData) {
              tenantData.totalElec += meter.meterElec || 0;
            }
          }
        });
      }

      // 统计公摊用电
      if (data.shareUseDtoList && Array.isArray(data.shareUseDtoList)) {
        data.shareUseDtoList.forEach((share) => {
          if (share.shareTenantDtoList && Array.isArray(share.shareTenantDtoList)) {
            share.shareTenantDtoList.forEach((tenantShare) => {
              const tenantData = tenantShareMap.get(tenantShare.tenantId);
              if (tenantData && tenantShare.tenantShareElec > 0) {
                tenantData.totalElec += tenantShare.tenantShareElec;
              }
            });
          }
        });
      }

      // 第三层:租户节点(专用部分)
      let privateArray = Array.from(tenantPrivateMap.values())
        .filter((t) => t.totalElec > 0)
        .sort((a, b) => b.totalElec - a.totalElec);

      let displayPrivate = privateArray;
      let othersPrivateElec = 0;

      if (privateArray.length > this.maxDisplayTenants) {
        displayPrivate = privateArray.slice(0, this.maxDisplayTenants - 1);
        const others = privateArray.slice(this.maxDisplayTenants - 1);
        othersPrivateElec = others.reduce((sum, t) => sum + t.totalElec, 0);
      }

      displayPrivate.forEach((tenant, index) => {
        const color = SANKEY_COLORS[index % SANKEY_COLORS.length];
        const nodeName = tenant.tenantName;

        if (!nodes.find(n => n.name === nodeName)) {
          nodes.push({
            name: nodeName,
            itemStyle: { color },
          });
        }

        links.push({
          source: "专用设备",
          target: nodeName,
          value: tenant.totalElec,
        });
      });

      if (othersPrivateElec > 0) {
        if (!nodes.find(n => n.name === "其他租户")) {
          nodes.push({
            name: "其他租户",
            itemStyle: { color: "#c0c4cc" },
          });
        }
        links.push({
          source: "专用设备",
          target: "其他租户",
          value: othersPrivateElec,
        });
      }

      // 第三层:租户节点(公摊部分)
      let shareArray = Array.from(tenantShareMap.values())
        .filter((t) => t.totalElec > 0)
        .sort((a, b) => b.totalElec - a.totalElec);

      if (shareTotalElec > 0 && shareArray.length > 0) {
        let displayShare = shareArray;
        let othersShareElec = 0;

        if (shareArray.length > this.maxDisplayTenants) {
          displayShare = shareArray.slice(0, this.maxDisplayTenants - 1);
          const others = shareArray.slice(this.maxDisplayTenants - 1);
          othersShareElec = others.reduce((sum, t) => sum + t.totalElec, 0);
        }

        displayShare.forEach((tenant, index) => {
          const color = SANKEY_COLORS[index % SANKEY_COLORS.length];
          const nodeName = tenant.tenantName;

          if (!nodes.find(n => n.name === nodeName)) {
            nodes.push({
              name: nodeName,
              itemStyle: { color },
            });
          }

          links.push({
            source: "公摊设备",
            target: nodeName,
            value: tenant.totalElec,
          });
        });

        if (othersShareElec > 0) {
          if (!nodes.find(n => n.name === "其他租户")) {
            nodes.push({
              name: "其他租户",
              itemStyle: { color: "#c0c4cc" },
            });
          }
          links.push({
            source: "公摊设备",
            target: "其他租户",
            value: othersShareElec,
          });
        }
      }

      if (links.length === 0) {
        return null;
      }

      return { nodes, links };
    },

    initRadarChart() {
      const el = this.$refs.radarChart;
      if (!el) return;
      if (this.charts.radar) this.charts.radar.dispose();

      const chart = echarts.init(el);
      this.charts.radar = chart;

      const option = {
        backgroundColor: "transparent",
        radar: {
          indicator: [
            { name: "运行效率", max: 100 },
            { name: "响应速度", max: 100 },
            { name: "稳定性", max: 100 },
            { name: "能效比", max: 100 },
            { name: "安全性", max: 100 },
          ],
          center: ["50%", "50%"],
          radius: "70%",
          axisName: {
            color: "#6b7280",
            fontSize: 11,
          },
          splitLine: {
            lineStyle: { color: "#e5e7eb" },
          },
          splitArea: {
            show: true,
            areaStyle: { color: ["#fafafa", "#f5f5f5"] },
          },
          axisLine: {
            lineStyle: { color: "#d1d5db" },
          },
        },
        series: [
          {
            type: "radar",
            data: [
              {
                value: [92, 88, 95, 85, 96],
                name: "优秀",
                itemStyle: { color: "#67c23a" },
                areaStyle: { color: "rgba(103, 194, 58, 0.15)" },
                lineStyle: { width: 2 },
              },
              {
                value: [78, 75, 80, 72, 85],
                name: "良好",
                itemStyle: { color: "#409eff" },
                areaStyle: { color: "rgba(64, 158, 255, 0.15)" },
                lineStyle: { width: 2 },
              },
              {
                value: [55, 50, 58, 48, 60],
                name: "预警",
                itemStyle: { color: "#e6a23c" },
                areaStyle: { color: "rgba(230, 162, 60, 0.15)" },
                lineStyle: { width: 2 },
              },
            ],
          },
        ],
      };

      chart.setOption(option);
    },

    drawSankeyChart() {
      // ✅ 延迟执行,确保 DOM 完全准备好
      this.$nextTick(() => {
        const el = this.$refs.sankeyChart;
        
        // 如果没有数据,不需要初始化图表
        if (!this.sankeyData || !this.sankeyData.links || !this.sankeyData.links.length) {
          console.log('桑基图无数据,跳过绘制');
          // ✅ 确保图表被销毁
          if (this.charts.sankey) {
            this.charts.sankey.dispose();
            this.charts.sankey = null;
          }
          return;
        }

        if (!el) {
          console.warn('桑基图容器不存在');
          return;
        }

        // ✅ 检查容器是否可见
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          console.warn('桑基图容器尺寸为0,延迟初始化');
          setTimeout(() => this.drawSankeyChart(), 100);
          return;
        }

        // ✅ 再次确保旧图表被销毁
        if (this.charts.sankey) {
          console.log('绘制前销毁旧图表');
          this.charts.sankey.dispose();
          this.charts.sankey = null;
        }

        try {
          console.log('开始初始化桑基图, 容器尺寸:', rect.width, 'x', rect.height);
          const chart = echarts.init(el);
          this.charts.sankey = chart;

          const option = {
            backgroundColor: "transparent",
            tooltip: {
              trigger: "item",
              backgroundColor: "rgba(255, 255, 255, 0.96)",
              borderColor: "#eee",
              borderWidth: 1,
              padding: [10, 14],
              textStyle: { color: "#333", fontSize: 12 },
              formatter: (params) => {
                if (params.dataType === "node") {
                  return `<b>${params.name}</b><br/>${(params.value || 0).toFixed(2)} kWh`;
                }
                return `${params.data.source} → ${params.data.target}<br/>${(params.value || 0).toFixed(2)} kWh`;
              },
            },
            series: [
              {
                type: "sankey",
                layout: "none",
                emphasis: { focus: "adjacency" },
                data: this.sankeyData.nodes,
                links: this.sankeyData.links,
                left: 20,
                top: 15,
                right: 100,
                bottom: 15,
                nodeWidth: 16,
                nodeGap: 14,
                draggable: false,
                lineStyle: {
                  color: "gradient",
                  opacity: 0.5,
                  curveness: 0.5,
                },
                label: {
                  show: true,
                  position: "right",
                  fontSize: 12,
                  color: "#555",
                  formatter: (params) => {
                    const name = params.name;
                    return name.length > 8 ? name.slice(0, 8) + "…" : name;
                  },
                },
                itemStyle: { borderWidth: 0 },
              },
            ],
          };

          chart.setOption(option);
          console.log('桑基图渲染成功');
        } catch (error) {
          console.error('桑基图初始化失败:', error);
          if (this.charts.sankey) {
            this.charts.sankey.dispose();
            this.charts.sankey = null;
          }
        }
      });
    },

    async loadRanking() {
      const res = await getTenantPList({
        managerId: this.currentManagerId,
      }).catch(() => ({}));
      if (res.code === 200) this.tenantRanking = res.data || [];
    },

    async loadMeter() {
      const res = await getMeterOverview({
        managerId: this.currentManagerId,
      }).catch(() => ({}));
      if (res.code === 200) this.meterData = res.data || {};
    },

    async loadDebt() {
      const res = await getTenantStatusList({
        managerId: this.currentManagerId,
      }).catch(() => ({}));
      if (res.code === 200) {
         console.log(res,'res')
        // 兼容处理：如果 data 直接是数组则使用 data，否则尝试获取 tenantStatusList
        const list = Array.isArray(res.data) ? res.data : (res.data?.tenantStatusList || []);
        this.debtList = list
          .filter((i) => i.tenantBalance < 0)
          .sort((a, b) => a.tenantBalance - b.tenantBalance);
      }
      // console.log(this.debtList ,'this.debtList ')
    },

    async loadCompare() {
      const type = this.datePeriod === "day" ? 2 : 3;
      const [e, w] = await Promise.all([
        getElecStatistics({ type, useType: 1, managerId: this.currentManagerId }),
        getElecStatistics({ type, useType: 2, managerId: this.currentManagerId }),
      ]).catch(() => [{}, {}]);

      const sort = (arr) => [...(arr || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
      const elec = e.code === 200 ? sort(e.data) : [];
      const water = w.code === 200 ? sort(w.data) : [];

      const limit = this.datePeriod === "day" ? 7 : 6;
      const sliceElec = elec.slice(-limit);
      const sliceWater = water.slice(-limit);
      const base = sliceElec.length >= sliceWater.length ? sliceElec : sliceWater;

      this.compareData = {
        dates: base.map((i) => this.fmtDate(i.date)),
        elecUsage: sliceElec.map((i) => +(i.useElec || 0)),
        waterUsage: sliceWater.map((i) => +(i.useElec || 0)),
        elecIncome: sliceElec.map((i) => +(i.balance || 0)),
        waterIncome: sliceWater.map((i) => +(i.balance || 0)),
      };

      this.$nextTick(() => this.drawMain());
    },

    fmtDate(s) {
      const d = new Date(s);
      return this.datePeriod === "month"
        ? `${d.getMonth() + 1}月`
        : `${d.getMonth() + 1}/${d.getDate()}`;
    },

    drawMain() {
      const el = this.$refs.mainChart;
      if (!el) return;
      if (this.charts.main) this.charts.main.dispose();
      const chart = echarts.init(el);
      this.charts.main = chart;

      const { dates, elecUsage, waterUsage, elecIncome, waterIncome } = this.compareData;
      const v = this.vis;

      chart.setOption({
        tooltip: {
          trigger: "axis",
          backgroundColor: "#fff",
          borderColor: "#e5eaef",
          borderWidth: 1,
          padding: [10, 14],
          textStyle: { color: "#455a64", fontSize: 12 },
          extraCssText: "box-shadow: 0 4px 12px rgba(0,0,0,0.08);",
          formatter: (p) => {
            let s = `<div style="font-weight:500;margin-bottom:6px;color:#37474f">${p[0].axisValue}</div>`;
            p.forEach((i) => {
              const u = i.seriesName.includes("用电") ? "kWh" : i.seriesName.includes("用水") ? "m³" : "元";
              s += `<div style="display:flex;justify-content:space-between;gap:20px;margin:3px 0">
                <span style="color:#78909c">${i.marker} ${i.seriesName}</span>
                <b style="color:#37474f">${i.value.toFixed(2)} ${u}</b>
              </div>`;
            });
            return s;
          },
        },
        grid: { left: 50, right: 50, top: 16, bottom: 32 },
        xAxis: {
          type: "category",
          data: dates,
          axisLine: { lineStyle: { color: "#e5eaef" } },
          axisTick: { show: false },
          axisLabel: { color: "#90a4ae", fontSize: 11, margin: 10 },
        },
        yAxis: [
          {
            type: "value",
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: "#90a4ae", fontSize: 10 },
            splitLine: { lineStyle: { color: "#f0f4f7" } },
          },
          {
            type: "value",
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: "#90a4ae", fontSize: 10 },
            splitLine: { show: false },
          },
        ],
        series: [
          {
            name: "用电量",
            type: "line",
            yAxisIndex: 0,
            data: v.elecUsage ? elecUsage : [],
            smooth: 0.4,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: { width: 2.5, color: "#4db6ac" },
            itemStyle: { color: "#4db6ac", borderColor: "#fff", borderWidth: 2 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(77,182,172,0.2)" },
                { offset: 1, color: "rgba(77,182,172,0)" },
              ]),
            },
          },
          {
            name: "用水量",
            type: "line",
            yAxisIndex: 0,
            data: v.waterUsage ? waterUsage : [],
            smooth: 0.4,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: { width: 2.5, color: "#64b5f6" },
            itemStyle: { color: "#64b5f6", borderColor: "#fff", borderWidth: 2 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(100,181,246,0.2)" },
                { offset: 1, color: "rgba(100,181,246,0)" },
              ]),
            },
          },
          {
            name: "电费",
            type: "bar",
            yAxisIndex: 1,
            data: v.elecIncome ? elecIncome : [],
            barWidth: "28%",
            barMaxWidth: 24,
            barGap: "15%",
            itemStyle: {
              color: "rgba(77,182,172,0.45)",
              borderRadius: [4, 4, 0, 0],
            },
          },
          {
            name: "水费",
            type: "bar",
            yAxisIndex: 1,
            data: v.waterIncome ? waterIncome : [],
            barWidth: "28%",
            barMaxWidth: 24,
            itemStyle: {
              color: "rgba(100,181,246,0.45)",
              borderRadius: [4, 4, 0, 0],
            },
          },
        ],
      });
    },

    toggle(key) {
      this.vis[key] = !this.vis[key];
      this.drawMain();
    },

    async setPeriod(p) {
      if (this.datePeriod === p) return;
      this.datePeriod = p;
      await this.loadCompare();
    },

    getRankClass(idx) {
      if (idx === 0) return "gold";
      if (idx === 1) return "silver";
      if (idx === 2) return "bronze";
      return "";
    },

    getChangeClass(change) {
      if (change > 0) return "up";
      if (change < 0) return "down";
      return "neutral";
    },

    formatChange(change) {
      if (change === 0) return "-";
      const abs = Math.abs(change);
      const arrow = change > 0 ? "↑" : "↓";
      return `${arrow}${abs.toFixed(1)}%`;
    },

    goDetail(item) {
      this.$router.push({ name: "TenantDetail", params: { id: item.tenantId } });
    },

    remind(item) {
      this.$message.info(`已向 ${item.tenantName} 发送催缴通知`);
    },

    resize() {
      Object.values(this.charts).forEach((c) => c?.resize?.());
    },
  },
};
</script>

<style scoped>
/* ===== CSS Variables ===== */
.dashboard-wrapper {
  --bg: #f5f7fa;
  --card: #ffffff;
  --border: #e5eaef;
  --text-1: #37474f;
  --text-2: #607d8b;
  --text-3: #90a4ae;
  --teal: #4db6ac;
  --blue: #64b5f6;
  --coral: #e57373;
  --success: #66bb6a;
  --danger: #ef5350;

  width: 100%;
  height: 100%;
  overflow: hidden;
}

.dashboard {
  width: 100%;
  height: 100%;
  padding: 16px;
  background: var(--bg);
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  overflow: hidden;
}

/* ===== 主内容区 ===== */
.main-content {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 16px;
  overflow: hidden;
}

/* ===== 左侧区域 ===== */
.left-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

.charts-row {
  display: grid;
  grid-template-columns: 0.7fr 1.3fr;
  gap: 16px;
  height: 220px;
  flex-shrink: 0;
}

.chart-box {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chart-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.chart-title>span {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-1);
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-tag {
  font-style: normal;
  font-size: 10px;
  font-weight: 500;
  color: var(--teal);
  background: rgba(77, 182, 172, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.legend-dots {
  display: flex;
  gap: 10px;
}

.dot-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text-3);
}

.dot-item .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot-item .dot.excellent {
  background: #67c23a;
}

.dot-item .dot.good {
  background: #409eff;
}

.dot-item .dot.warning {
  background: #e6a23c;
}

.view-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--teal);
  cursor: pointer;
  transition: color 0.2s;
}

.view-link:hover {
  color: #26a69a;
}

.device-radar-wrap {
  flex: 1;
  display: flex;
  gap: 14px;
  min-height: 0;
}

.radar-chart {
  flex: 1.1;
  min-width: 0;
}

.device-stats {
  flex: 0.9;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 10px;
}

.device-ring-box {
  width: 56px;
  height: 56px;
  position: relative;
  flex-shrink: 0;
}

.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-track {
  fill: none;
  stroke: #e8eaed;
  stroke-width: 5;
}

.ring-progress {
  fill: none;
  stroke: var(--teal);
  stroke-width: 5;
  stroke-linecap: round;
  transition: stroke-dasharray 0.8s ease;
}

.ring-inner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  padding-top: 18px;
}

.ring-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
  line-height: 1;
}

.ring-unit {
  font-size: 9px;
  color: var(--text-3);
  margin-left: 1px;
}

.device-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  width: 100%;
}

.device-total {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-1);
}

.device-total span {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-2);
}

.device-detail {
  display: flex;
  gap: 10px;
}

.device-detail span {
  font-size: 10px;
  color: var(--text-3);
  display: flex;
  align-items: center;
  gap: 3px;
}

.device-detail .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.device-detail .dot.private {
  background: #b0bec5;
}

.device-detail .dot.public {
  background: var(--teal);
}

.device-status {
  display: flex;
  gap: 8px;
}

.device-status span {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 4px;
}

.device-status .online {
  background: rgba(77, 182, 172, 0.12);
  color: var(--teal);
}

.device-status .offline {
  background: rgba(176, 190, 197, 0.15);
  color: #78909c;
}

/* ✅ 桑基图样式 - 关键修改 */
.chart-area-wrapper {
  flex: 1;
  min-height: 0;
  position: relative;
}

.chart-area {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  gap: 10px;
  z-index: 1;
  background: transparent;
}

.chart-empty svg {
  opacity: 0.4;
}

.chart-empty span {
  font-size: 13px;
}

/* 下部趋势区域 */
.trend-section {
  flex: 1;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.trend-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.trend-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.legend-btns {
  display: flex;
  gap: 4px;
}

.legend-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.15s ease;
}

.legend-btn:hover {
  background: #f0f4f7;
}

.legend-btn.inactive {
  opacity: 0.35;
}

.legend-line {
  width: 14px;
  height: 2px;
  border-radius: 1px;
}

.legend-line.elec {
  background: var(--teal);
}

.legend-line.water {
  background: var(--blue);
}

.legend-bar {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.legend-bar.elec {
  background: rgba(77, 182, 172, 0.5);
}

.legend-bar.water {
  background: rgba(100, 181, 246, 0.5);
}

.period-switch {
  display: flex;
  background: #f0f4f7;
  border-radius: 8px;
  padding: 3px;
}

.period-switch button {
  padding: 6px 14px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.15s ease;
}

.period-switch button:hover {
  color: var(--text-1);
}

.period-switch button.active {
  background: var(--card);
  color: var(--text-1);
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.stat-tags {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.stat-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #f0f2f5;
}

.stat-tag svg {
  flex-shrink: 0;
}

.stat-tag.elec-usage svg {
  color: var(--teal);
}

.stat-tag.elec-fee svg {
  color: #26a69a;
}

.stat-tag.water-usage svg {
  color: var(--blue);
}

.stat-tag.water-fee svg {
  color: #42a5f5;
}

.tag-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
}

.tag-unit {
  font-size: 11px;
  color: var(--text-3);
  margin-right: 6px;
}

.tag-change {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 5px;
  border-radius: 4px;
}

.tag-change.up {
  color: var(--danger);
  background: rgba(239, 83, 80, 0.1);
}

.tag-change.down {
  color: var(--success);
  background: rgba(102, 187, 106, 0.1);
}

.tag-change.neutral {
  color: var(--text-3);
}

.tag-label {
  font-size: 11px;
  color: var(--text-3);
  margin-left: 4px;
}

.trend-chart {
  flex: 1;
  min-height: 0;
}

/* ===== 右侧列表 ===== */
.right-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

.list-panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-1);
  margin-bottom: 12px;
  flex-shrink: 0;
}

.title-icon {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-icon.teal {
  background: rgba(77, 182, 172, 0.12);
  color: var(--teal);
}

.title-icon.coral {
  background: rgba(229, 115, 115, 0.12);
  color: var(--coral);
}

.title-badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
  background: #ecf0f3;
  color: var(--text-2);
}

.title-badge.warn {
  background: rgba(229, 115, 115, 0.12);
  color: var(--coral);
}

.list-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  margin: 0 -4px;
  padding: 0 4px;
}

.list-content::-webkit-scrollbar {
  width: 4px;
}

.list-content::-webkit-scrollbar-track {
  background: transparent;
}

.list-content::-webkit-scrollbar-thumb {
  background: #dfe4e8;
  border-radius: 2px;
}

.list-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.list-row:hover {
  background: #f5f7fa;
}

.debt-panel .list-row:hover {
  background: #fef5f5;
}

.row-rank {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #ecf0f3;
  color: var(--text-2);
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.row-rank.gold {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  color: #f9a825;
}

.row-rank.silver {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  color: #757575;
}

.row-rank.bronze {
  background: linear-gradient(135deg, #fbe9e7 0%, #ffccbc 100%);
  color: #e64a19;
}

.row-rank.top {
  background: #ffebee;
  color: var(--coral);
}

.row-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-value {
  font-size: 13px;
  font-weight: 500;
}

.row-value.teal {
  color: var(--teal);
}

.row-value.coral {
  color: var(--coral);
}

.row-value small {
  font-weight: 400;
  color: var(--text-3);
  margin-left: 2px;
  font-size: 11px;
}

.remind-btn {
  padding: 5px 12px;
  background: var(--teal);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.remind-btn:hover {
  background: #26a69a;
}

.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-3);
  font-size: 13px;
  gap: 8px;
}

.list-empty.ok {
  color: var(--teal);
}

.list-empty.ok svg {
  width: 28px;
  height: 28px;
  opacity: 0.5;
}


/* ========================
     响应式媒体查询
  ======================== */

/* 超大屏 (≥2560px) */
@media (min-width: 2560px) {
  .dashboard {
    padding: 24px;
  }

  .main-content {
    grid-template-columns: 1fr 400px;
    gap: 24px;
  }

  .left-section {
    gap: 24px;
  }

  .charts-row {
    grid-template-columns: 0.9fr 1.1fr;
    height: 300px;
    gap: 24px;
  }

  .chart-box {
    padding: 20px 24px;
    border-radius: 16px;
  }

  .chart-title>span {
    font-size: 16px;
  }

  .device-radar-wrap {
    gap: 18px;
  }

  .device-stats {
    min-width: 160px;
    padding: 14px;
    gap: 12px;
  }

  .device-ring-box {
    width: 72px;
    height: 72px;
  }

  .ring-inner {
    padding-top: 24px;
  }

  .ring-value {
    font-size: 19px;
  }

  .ring-unit {
    font-size: 10px;
  }

  .device-total {
    font-size: 26px;
  }

  .device-total span {
    font-size: 13px;
  }

  .device-detail {
    gap: 12px;
  }

  .device-detail span {
    font-size: 11px;
  }

  .device-status {
    gap: 10px;
  }

  .device-status span {
    font-size: 11px;
    padding: 3px 10px;
  }

  .trend-section {
    padding: 20px 24px;
    border-radius: 16px;
  }

  .stat-tags {
    gap: 18px;
    margin-bottom: 16px;
  }

  .stat-tag {
    padding: 10px 18px;
    gap: 8px;
  }

  .tag-value {
    font-size: 20px;
  }

  .tag-unit {
    font-size: 12px;
  }

  .period-switch button {
    padding: 8px 18px;
    font-size: 13px;
  }

  .right-section {
    gap: 24px;
  }

  .list-panel {
    padding: 18px 20px;
    border-radius: 16px;
  }

  .panel-title {
    font-size: 16px;
  }

  .list-row {
    padding: 12px;
  }

  .row-rank {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .row-name,
  .row-value {
    font-size: 14px;
  }
}

/* 大屏 (1920px-2559px) */
@media (min-width: 1920px) and (max-width: 2559px) {
  .dashboard {
    padding: 20px;
  }

  .main-content {
    grid-template-columns: 1fr 360px;
    gap: 20px;
  }

  .left-section {
    gap: 20px;
  }

  .charts-row {
    grid-template-columns: 0.9fr 1.1fr;
    height: 260px;
    gap: 20px;
  }

  .chart-box {
    padding: 18px 22px;
    border-radius: 14px;
  }

  .chart-title>span {
    font-size: 15px;
  }

  .device-radar-wrap {
    gap: 16px;
  }

  .device-stats {
    min-width: 140px;
    padding: 12px;
    gap: 10px;
  }

  .device-ring-box {
    width: 64px;
    height: 64px;
  }

  .ring-inner {
    padding-top: 21px;
  }

  .ring-value {
    font-size: 17px;
  }

  .device-total {
    font-size: 24px;
  }

  .device-total span {
    font-size: 12px;
  }

  .device-detail span {
    font-size: 11px;
  }

  .device-status span {
    font-size: 10px;
    padding: 3px 9px;
  }

  .trend-section {
    padding: 18px 22px;
    border-radius: 14px;
  }

  .stat-tags {
    gap: 16px;
    margin-bottom: 14px;
  }

  .stat-tag {
    padding: 9px 16px;
  }

  .tag-value {
    font-size: 18px;
  }

  .right-section {
    gap: 20px;
  }

  .list-panel {
    padding: 16px 18px;
    border-radius: 14px;
  }

  .panel-title {
    font-size: 15px;
  }
}

/* 中大屏 (1680px-1919px) */
@media (min-width: 1680px) and (max-width: 1919px) {
  .dashboard {
    padding: 18px;
  }

  .main-content {
    grid-template-columns: 1fr 320px;
    gap: 18px;
  }

  .left-section {
    gap: 18px;
  }

  .charts-row {
    grid-template-columns: 0.9fr 1.1fr;
    height: 240px;
    gap: 18px;
  }

  .chart-box {
    padding: 16px 20px;
  }

  .device-radar-wrap {
    gap: 14px;
  }

  .device-stats {
    min-width: 130px;
    padding: 10px;
  }

  .device-ring-box {
    width: 60px;
    height: 60px;
  }

  .ring-inner {
    padding-top: 20px;
  }

  .ring-value {
    font-size: 16px;
  }

  .device-total {
    font-size: 22px;
  }

  .trend-section {
    padding: 16px 20px;
  }

  .stat-tags {
    gap: 14px;
  }

  .stat-tag {
    padding: 8px 14px;
  }

  .tag-value {
    font-size: 17px;
  }
}

/* 标准屏 (1440px-1679px) - 使用默认值 */

/* 中小屏 (1366px-1439px) */
@media (min-width: 1366px) and (max-width: 1439px) {
  .dashboard {
    padding: 14px;
  }

  .main-content {
    grid-template-columns: 1fr 260px;
    gap: 14px;
  }

  .left-section {
    gap: 14px;
  }

  .charts-row {
    grid-template-columns: 0.9fr 1.1fr;
    height: 200px;
    gap: 14px;
  }

  .chart-box {
    padding: 12px 16px;
    border-radius: 10px;
  }

  .chart-title {
    margin-bottom: 8px;
  }

  .chart-title>span {
    font-size: 13px;
    gap: 6px;
  }

  .date-tag {
    font-size: 9px;
    padding: 2px 6px;
  }

  .dot-item {
    font-size: 9px;
    gap: 3px;
  }

  .view-link {
    font-size: 11px;
  }

  .device-radar-wrap {
    gap: 12px;
  }

  .device-stats {
    min-width: 110px;
    padding: 8px;
    gap: 7px;
    border-radius: 8px;
  }

  .device-ring-box {
    width: 50px;
    height: 50px;
  }

  .ring-inner {
    padding-top: 16px;
  }

  .ring-value {
    font-size: 13px;
  }

  .ring-unit {
    font-size: 8px;
  }

  .device-total {
    font-size: 17px;
  }

  .device-total span {
    font-size: 10px;
  }

  .device-detail {
    gap: 7px;
  }

  .device-detail span {
    font-size: 9px;
  }

  .device-status {
    gap: 6px;
  }

  .device-status span {
    font-size: 9px;
    padding: 2px 6px;
  }

  .trend-section {
    padding: 12px 16px;
    border-radius: 10px;
  }

  .trend-header {
    margin-bottom: 8px;
  }

  .legend-btn {
    padding: 4px 8px;
    font-size: 10px;
    gap: 4px;
  }

  .legend-line {
    width: 12px;
  }

  .legend-bar {
    width: 7px;
    height: 7px;
  }

  .period-switch {
    padding: 2px;
    border-radius: 6px;
  }

  .period-switch button {
    padding: 5px 12px;
    font-size: 11px;
  }

  .stat-tags {
    gap: 10px;
    margin-bottom: 10px;
  }

  .stat-tag {
    padding: 6px 12px;
    gap: 5px;
    border-radius: 6px;
  }

  .stat-tag svg {
    width: 12px;
    height: 12px;
  }

  .tag-value {
    font-size: 14px;
  }

  .tag-unit {
    font-size: 10px;
    margin-right: 4px;
  }

  .tag-change {
    font-size: 9px;
    padding: 1px 4px;
  }

  .tag-label {
    font-size: 10px;
    margin-left: 2px;
  }

  .right-section {
    gap: 14px;
  }

  .list-panel {
    padding: 12px 14px;
    border-radius: 10px;
  }

  .panel-title {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .title-icon {
    width: 24px;
    height: 24px;
  }

  .title-icon svg {
    width: 12px;
    height: 12px;
  }

  .list-row {
    padding: 8px;
    gap: 8px;
  }

  .row-rank {
    width: 22px;
    height: 22px;
    font-size: 10px;
  }

  .row-name,
  .row-value {
    font-size: 12px;
  }

  .remind-btn {
    padding: 4px 10px;
    font-size: 10px;
  }
}

/* 小屏 (1280px-1365px) */
@media (min-width: 1280px) and (max-width: 1365px) {
  .dashboard {
    padding: 12px;
  }

  .main-content {
    grid-template-columns: 1fr 240px;
    gap: 12px;
  }

  .left-section {
    gap: 12px;
  }

  .charts-row {
    grid-template-columns: 0.9fr 1.1fr;
    height: 180px;
    gap: 12px;
  }

  .chart-box {
    padding: 10px 14px;
    border-radius: 8px;
  }

  .chart-title {
    margin-bottom: 6px;
  }

  .chart-title>span {
    font-size: 12px;
    gap: 5px;
  }

  .date-tag {
    font-size: 8px;
    padding: 1px 5px;
  }

  .legend-dots {
    gap: 6px;
  }

  .dot-item {
    font-size: 8px;
    gap: 2px;
  }

  .dot-item .dot {
    width: 5px;
    height: 5px;
  }

  .view-link {
    font-size: 10px;
  }

  .device-radar-wrap {
    gap: 10px;
  }

  .device-stats {
    min-width: 95px;
    padding: 6px;
    gap: 5px;
    border-radius: 6px;
  }

  .device-ring-box {
    width: 44px;
    height: 44px;
  }

  .ring-inner {
    padding-top: 14px;
  }

  .ring-value {
    font-size: 11px;
  }

  .ring-unit {
    font-size: 7px;
  }

  .device-total {
    font-size: 15px;
  }

  .device-total span {
    font-size: 9px;
  }

  .device-detail {
    gap: 5px;
  }

  .device-detail span {
    font-size: 8px;
    gap: 2px;
  }

  .device-detail .dot {
    width: 4px;
    height: 4px;
  }

  .device-status {
    gap: 4px;
  }

  .device-status span {
    font-size: 8px;
    padding: 1px 5px;
    border-radius: 3px;
  }

  .chart-empty svg {
    width: 28px;
    height: 28px;
  }

  .chart-empty span {
    font-size: 11px;
  }

  .trend-section {
    padding: 10px 14px;
    border-radius: 8px;
  }

  .trend-header {
    margin-bottom: 6px;
  }

  .trend-actions {
    gap: 12px;
  }

  .legend-btns {
    gap: 2px;
  }

  .legend-btn {
    padding: 3px 6px;
    font-size: 9px;
    gap: 3px;
    border-radius: 4px;
  }

  .legend-line {
    width: 10px;
  }

  .legend-bar {
    width: 6px;
    height: 6px;
  }

  .period-switch button {
    padding: 4px 10px;
    font-size: 10px;
  }

  .stat-tags {
    gap: 8px;
    margin-bottom: 8px;
  }

  .stat-tag {
    padding: 5px 10px;
    gap: 4px;
    border-radius: 5px;
  }

  .stat-tag svg {
    width: 11px;
    height: 11px;
  }

  .tag-value {
    font-size: 13px;
  }

  .tag-unit {
    font-size: 9px;
    margin-right: 3px;
  }

  .tag-change {
    font-size: 8px;
    padding: 1px 3px;
    border-radius: 3px;
  }

  .tag-label {
    font-size: 9px;
  }

  .right-section {
    gap: 12px;
  }

  .list-panel {
    padding: 10px 12px;
    border-radius: 8px;
  }

  .panel-title {
    font-size: 12px;
    margin-bottom: 8px;
    gap: 6px;
  }

  .title-icon {
    width: 22px;
    height: 22px;
    border-radius: 6px;
  }

  .title-icon svg {
    width: 11px;
    height: 11px;
  }

  .title-badge {
    font-size: 10px;
    padding: 1px 6px;
  }

  .list-row {
    padding: 6px;
    gap: 6px;
  }

  .row-rank {
    width: 20px;
    height: 20px;
    font-size: 9px;
    border-radius: 5px;
  }

  .row-name,
  .row-value {
    font-size: 11px;
  }

  .row-value small {
    font-size: 9px;
  }

  .remind-btn {
    padding: 3px 8px;
    font-size: 9px;
    border-radius: 5px;
  }

  .list-empty {
    font-size: 11px;
    gap: 6px;
  }

  .list-empty.ok svg {
    width: 24px;
    height: 24px;
  }
}

/* 超小屏 (<1280px) */
@media (max-width: 1279px) {
  .dashboard {
    padding: 10px;
  }

  .main-content {
    grid-template-columns: 1fr 210px;
    gap: 10px;
  }

  .left-section {
    gap: 10px;
  }

  .charts-row {
    grid-template-columns: 0.9fr 1.1fr;
    height: 160px;
    gap: 10px;
  }

  .chart-box {
    padding: 8px 12px;
    border-radius: 6px;
  }

  .chart-title>span {
    font-size: 11px;
  }

  .device-stats {
    min-width: 85px;
    padding: 4px;
  }

  .device-ring-box {
    width: 38px;
    height: 38px;
  }

  .ring-inner {
    padding-top: 11px;
  }

  .ring-value {
    font-size: 10px;
  }

  .device-total {
    font-size: 13px;
  }

  .trend-section {
    padding: 8px 12px;
    border-radius: 6px;
  }

  .stat-tags {
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
  }

  .stat-tag {
    padding: 4px 8px;
  }

  .tag-value {
    font-size: 12px;
  }

  .legend-btn {
    padding: 2px 5px;
    font-size: 8px;
  }

  .period-switch button {
    padding: 3px 8px;
    font-size: 9px;
  }

  .list-panel {
    padding: 8px 10px;
    border-radius: 6px;
  }

  .panel-title {
    font-size: 11px;
    margin-bottom: 6px;
  }

  .list-row {
    padding: 5px;
    gap: 5px;
  }

  .row-rank {
    width: 18px;
    height: 18px;
    font-size: 8px;
  }

  .row-name,
  .row-value {
    font-size: 10px;
  }

  .remind-btn {
    padding: 2px 6px;
    font-size: 8px;
  }
}

/* 移动端隐藏 */
@media (max-width: 768px) {
  .dashboard {
    display: none;
  }

  .dashboard-wrapper::after {
    content: "请使用更大的屏幕访问此页面";
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 16px;
    color: var(--text-2);
  }
}
</style>