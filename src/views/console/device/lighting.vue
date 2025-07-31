<template>
  <div class="lighting-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">
        <i class="el-icon-sunny"></i>
        智能照明
      </h1>
      <div>
        <el-button type="primary" icon="el-icon-plus" @click="handleAddDevice">
          添加设备
        </el-button>
        <el-button icon="el-icon-setting" @click="handleSystemSettings">
          系统设置
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon blue">
            <i class="el-icon-light"></i>
          </div>
          <el-tag size="small" type="success">正常</el-tag>
        </div>
        <div class="stat-value">{{ stats.totalDevices }}</div>
        <div class="stat-label">设备总数</div>
        <div class="stat-trend up">
          <i class="el-icon-top"></i>
          <span>较上月增加 12%</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon green">
            <i class="el-icon-circle-check"></i>
          </div>
          <el-switch
            v-model="stats.allLightsOn"
            @change="handleAllLightsToggle"
          ></el-switch>
        </div>
        <div class="stat-value">{{ stats.activeLights }}</div>
        <div class="stat-label">开启照明</div>
        <div class="stat-trend">
          <el-progress
            :percentage="lightingRate"
            :show-text="false"
            :stroke-width="6"
          ></el-progress>
          <span style="margin-left: 8px; font-size: 12px"
            >{{ lightingRate }}%</span
          >
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon orange">
            <i class="el-icon-data-line"></i>
          </div>
          <el-tag size="small" :type="powerTrend > 0 ? 'danger' : 'success'">
            {{ powerTrend > 0 ? "上升" : "下降" }} {{ Math.abs(powerTrend) }}%
          </el-tag>
        </div>
        <div class="stat-value">{{ stats.currentPower }}</div>
        <div class="stat-label">当前功率 (kW)</div>
        <div class="stat-trend" :class="powerTrend > 0 ? 'up' : 'down'">
          <i :class="powerTrend > 0 ? 'el-icon-top' : 'el-icon-bottom'"></i>
          <span
            >较昨日{{ powerTrend > 0 ? "增加" : "减少" }}
            {{ Math.abs(powerTrend) }}%</span
          >
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon purple">
            <i class="el-icon-time"></i>
          </div>
          <el-button size="mini" type="text" @click="viewSchedules"
            >查看全部</el-button
          >
        </div>
        <div class="stat-value">{{ stats.schedules }}</div>
        <div class="stat-label">定时任务</div>
        <div class="stat-trend">
          <span style="font-size: 12px; color: #909399">下次执行: 18:30</span>
        </div>
      </div>
    </div>

    <!-- 场景控制 -->
    <div class="control-section">
      <div class="section-header">
        <h2 class="section-title">
          <i class="el-icon-magic-stick"></i>
          场景模式
        </h2>
        <el-button
          size="small"
          type="text"
          icon="el-icon-plus"
          @click="handleAddScene"
        >
          自定义场景
        </el-button>
      </div>
      <div class="scene-grid">
        <div
          v-for="scene in scenes"
          :key="scene.id"
          :class="['scene-card', scene.className]"
          @click="activateScene(scene)"
        >
          <i :class="['scene-icon', scene.icon]"></i>
          <div class="scene-name">{{ scene.name }}</div>
          <div class="scene-desc">{{ scene.description }}</div>
        </div>
      </div>
    </div>

    <!-- 区域控制 -->
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="区域控制" name="areas">
        <div class="control-section" style="box-shadow: none; padding: 0">
          <div class="area-grid">
            <div
              v-for="area in areas"
              :key="area.id"
              :class="['area-card', { active: area.lightsOn > 0 }]"
              @click="selectArea(area)"
            >
              <div class="area-header">
                <div class="area-name">{{ area.name }}</div>
                <div class="area-status">
                  <span
                    :class="['status-dot', { offline: area.online === 0 }]"
                  ></span>
                  <span>{{ area.online }}/{{ area.total }} 在线</span>
                </div>
              </div>
              <div class="area-info">
                <div class="light-count">
                  <span>开启: {{ area.lightsOn }}</span>
                  <span>关闭: {{ area.total - area.lightsOn }}</span>
                </div>
                <el-switch
                  v-model="area.enabled"
                  @change="toggleAreaLights(area)"
                  @click.native.stop
                >
                </el-switch>
              </div>
              <div class="brightness-control">
                <span class="brightness-label">亮度调节</span>
                <el-slider
                  v-model="area.brightness"
                  :show-tooltip="false"
                  @change="adjustAreaBrightness(area)"
                  @click.native.stop
                >
                </el-slider>
                <span
                  style="
                    min-width: 40px;
                    text-align: right;
                    font-size: 13px;
                    color: #606266;
                  "
                >
                  {{ area.brightness }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="设备列表" name="devices">
        <div class="control-section" style="box-shadow: none; padding: 0">
          <div class="device-filters">
            <div
              v-for="filter in deviceFilters"
              :key="filter.value"
              :class="[
                'filter-tag',
                { active: currentFilter === filter.value },
              ]"
              @click="currentFilter = filter.value"
            >
              {{ filter.label }}
              <span v-if="filter.count">({{ filter.count }})</span>
            </div>
          </div>

          <el-table :data="filteredDevices" style="width: 100%">
            <el-table-column type="index" width="50"> </el-table-column>
            <el-table-column prop="id" label="设备编号"></el-table-column>
            <el-table-column prop="id" label="设备编号"></el-table-column>
            <el-table-column prop="name" label="设备名称"></el-table-column>
            <el-table-column prop="area" label="所属区域"></el-table-column>
            <el-table-column prop="type" label="设备类型">
              <template slot-scope="scope">
                <el-tag size="small" :type="getDeviceTypeTag(scope.row.type)">
                  {{ scope.row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="power" label="功率(W)"></el-table-column>
            <el-table-column label="状态" width="80" align="center">
              <template slot-scope="scope">
                <el-switch
                  v-model="scope.row.status"
                  @change="toggleDevice(scope.row)"
                >
                </el-switch>
              </template>
            </el-table-column>
            <el-table-column label="亮度">
              <template slot-scope="scope">
                <el-slider
                  v-model="scope.row.brightness"
                  :disabled="!scope.row.status"
                  @change="adjustDeviceBrightness(scope.row)"
                >
                </el-slider>
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="250">
              <template slot-scope="scope">
                <el-button
                  size="small"
                  type="text"
                  @click="editDevice(scope.row)"
                >
                  编辑
                </el-button>
                <el-button
                  size="small"
                  type="text"
                  @click="viewDeviceHistory(scope.row)"
                >
                  历史
                </el-button>
                <el-button
                  size="small"
                  type="text"
                  style="color: #f56c6c"
                  @click="deleteDevice(scope.row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="定时任务" name="schedules">
        <div class="control-section" style="box-shadow: none; padding: 20px">
          <div class="section-header" style="margin-bottom: 20px; padding: 0">
            <h3 style="font-size: 16px; margin: 0">定时任务列表</h3>
            <el-button
              size="small"
              type="primary"
              icon="el-icon-plus"
              @click="handleAddSchedule"
            >
              新建任务
            </el-button>
          </div>
          <div
            v-for="schedule in scheduleList"
            :key="schedule.id"
            class="schedule-item"
          >
            <div class="schedule-info">
              <div class="schedule-time">{{ schedule.time }}</div>
              <div class="schedule-desc">{{ schedule.description }}</div>
              <div class="schedule-days">
                <span
                  v-for="(active, day) in schedule.days"
                  :key="day"
                  :class="['day-tag', { active }]"
                >
                  {{ day }}
                </span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 16px">
              <el-switch v-model="schedule.enabled"></el-switch>
              <el-button size="small" icon="el-icon-edit" circle></el-button>
              <el-button
                size="small"
                icon="el-icon-delete"
                circle
                type="danger"
              ></el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="能耗分析" name="energy">
        <div class="control-section" style="box-shadow: none; padding: 20px">
          <div class="section-header" style="margin-bottom: 20px; padding: 0px">
            <h3 style="font-size: 16px; margin: 0">能耗趋势</h3>
            <el-date-picker
              v-model="energyDateRange"
              type="daterange"
              size="small"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            >
            </el-date-picker>
          </div>
          <div class="chart-container">
            <!-- 这里可以集成 ECharts 图表 -->
            <div
              style="
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #909399;
              "
            >
              <div style="text-align: center">
                <i
                  class="el-icon-picture"
                  style="font-size: 48px; margin-bottom: 16px; display: block"
                ></i>
                <p>能耗图表区域</p>
              </div>
            </div>
          </div>

          <el-row :gutter="20" style="margin-top: 24px">
            <el-col :span="8">
              <div
                style="
                  text-align: center;
                  padding: 20px;
                  background: #f5f7fa;
                  border-radius: 8px;
                "
              >
                <div style="font-size: 24px; font-weight: bold; color: #303133">
                  2,458
                </div>
                <div style="font-size: 14px; color: #909399; margin-top: 8px">
                  本月用电量 (kWh)
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div
                style="
                  text-align: center;
                  padding: 20px;
                  background: #f5f7fa;
                  border-radius: 8px;
                "
              >
                <div style="font-size: 24px; font-weight: bold; color: #303133">
                  ¥1,836
                </div>
                <div style="font-size: 14px; color: #909399; margin-top: 8px">
                  本月电费
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div
                style="
                  text-align: center;
                  padding: 20px;
                  background: #f5f7fa;
                  border-radius: 8px;
                "
              >
                <div style="font-size: 24px; font-weight: bold; color: #67c23a">
                  -15.2%
                </div>
                <div style="font-size: 14px; color: #909399; margin-top: 8px">
                  环比变化
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 加载遮罩 -->
    <div v-if="loading" class="loading-mask">
      <i class="el-icon-loading"></i>
    </div>
  </div>
</template>

<script>
export default {
  name: "SmartLightingSystem",
  data() {
    return {
      loading: false,
      activeTab: "areas",
      currentFilter: "all",
      energyDateRange: [],
      powerTrend: -8.5,

      // 统计数据
      stats: {
        totalDevices: 186,
        activeLights: 124,
        currentPower: 45.8,
        schedules: 12,
        allLightsOn: true,
      },

      // 场景数据
      scenes: [
        {
          id: 1,
          name: "工作模式",
          description: "明亮舒适的办公照明",
          icon: "el-icon-edit",
          className: "work",
          brightness: 100,
          colorTemp: 5000,
        },
        {
          id: 2,
          name: "休息模式",
          description: "柔和温暖的休息照明",
          icon: "el-icon-coffee",
          className: "rest",
          brightness: 40,
          colorTemp: 3000,
        },
        {
          id: 3,
          name: "会议模式",
          description: "专注清晰的会议照明",
          icon: "el-icon-video-camera",
          className: "meeting",
          brightness: 80,
          colorTemp: 4500,
        },
        {
          id: 4,
          name: "夜间模式",
          description: "节能安全的夜间照明",
          icon: "el-icon-moon",
          className: "night",
          brightness: 20,
          colorTemp: 2700,
        },
      ],

      // 区域数据
      areas: [
        {
          id: 1,
          name: "办公大厅",
          total: 48,
          online: 45,
          lightsOn: 42,
          brightness: 85,
          enabled: true,
        },
        {
          id: 2,
          name: "会议室A",
          total: 24,
          online: 24,
          lightsOn: 0,
          brightness: 0,
          enabled: false,
        },
        {
          id: 3,
          name: "会议室B",
          total: 24,
          online: 23,
          lightsOn: 18,
          brightness: 70,
          enabled: true,
        },
        {
          id: 4,
          name: "走廊过道",
          total: 36,
          online: 36,
          lightsOn: 36,
          brightness: 60,
          enabled: true,
        },
        {
          id: 5,
          name: "休息区",
          total: 18,
          online: 18,
          lightsOn: 12,
          brightness: 40,
          enabled: true,
        },
        {
          id: 6,
          name: "洗手间",
          total: 12,
          online: 12,
          lightsOn: 8,
          brightness: 100,
          enabled: true,
        },
        {
          id: 7,
          name: "储物间",
          total: 8,
          online: 8,
          lightsOn: 0,
          brightness: 0,
          enabled: false,
        },
        {
          id: 8,
          name: "前台接待",
          total: 16,
          online: 16,
          lightsOn: 8,
          brightness: 90,
          enabled: true,
        },
      ],

      // 设备过滤器
      deviceFilters: [
        { label: "全部设备", value: "all", count: 186 },
        { label: "LED灯", value: "led", count: 142 },
        { label: "筒灯", value: "downlight", count: 24 },
        { label: "灯带", value: "strip", count: 12 },
        { label: "射灯", value: "spotlight", count: 8 },
      ],

      // 设备列表
      devices: [
        {
          id: "L001",
          name: "大厅主灯-1",
          area: "办公大厅",
          type: "LED灯",
          power: 48,
          status: true,
          brightness: 85,
        },
        {
          id: "L002",
          name: "大厅主灯-2",
          area: "办公大厅",
          type: "LED灯",
          power: 48,
          status: true,
          brightness: 85,
        },
        {
          id: "L003",
          name: "大厅主灯-3",
          area: "办公大厅",
          type: "LED灯",
          power: 48,
          status: true,
          brightness: 85,
        },
        {
          id: "L004",
          name: "会议室筒灯-1",
          area: "会议室A",
          type: "筒灯",
          power: 24,
          status: false,
          brightness: 0,
        },
        {
          id: "L005",
          name: "会议室筒灯-2",
          area: "会议室A",
          type: "筒灯",
          power: 24,
          status: false,
          brightness: 0,
        },
        {
          id: "L006",
          name: "走廊灯带-1",
          area: "走廊过道",
          type: "灯带",
          power: 36,
          status: true,
          brightness: 60,
        },
        {
          id: "L007",
          name: "走廊灯带-2",
          area: "走廊过道",
          type: "灯带",
          power: 36,
          status: true,
          brightness: 60,
        },
        {
          id: "L008",
          name: "休息区射灯-1",
          area: "休息区",
          type: "射灯",
          power: 18,
          status: true,
          brightness: 40,
        },
        {
          id: "L009",
          name: "前台装饰灯",
          area: "前台接待",
          type: "LED灯",
          power: 32,
          status: true,
          brightness: 90,
        },
        {
          id: "L010",
          name: "洗手间照明",
          area: "洗手间",
          type: "LED灯",
          power: 24,
          status: true,
          brightness: 100,
        },
      ],

      // 定时任务
      scheduleList: [
        {
          id: 1,
          time: "08:00",
          description: "开启办公区域照明",
          days: {
            周一: true,
            周二: true,
            周三: true,
            周四: true,
            周五: true,
            周六: false,
            周日: false,
          },
          enabled: true,
        },
        {
          id: 2,
          time: "18:30",
          description: "关闭非必要区域照明",
          days: {
            周一: true,
            周二: true,
            周三: true,
            周四: true,
            周五: true,
            周六: false,
            周日: false,
          },
          enabled: true,
        },
        {
          id: 3,
          time: "22:00",
          description: "切换至夜间模式",
          days: {
            周一: true,
            周二: true,
            周三: true,
            周四: true,
            周五: true,
            周六: true,
            周日: true,
          },
          enabled: true,
        },
        {
          id: 4,
          time: "12:00",
          description: "午休时段调暗照明",
          days: {
            周一: true,
            周二: true,
            周三: true,
            周四: true,
            周五: true,
            周六: false,
            周日: false,
          },
          enabled: false,
        },
      ],
    };
  },

  computed: {
    lightingRate() {
      return Math.round(
        (this.stats.activeLights / this.stats.totalDevices) * 100
      );
    },

    filteredDevices() {
      if (this.currentFilter === "all") {
        return this.devices;
      }
      const filterMap = {
        led: "LED灯",
        downlight: "筒灯",
        strip: "灯带",
        spotlight: "射灯",
      };
      return this.devices.filter(
        (device) => device.type === filterMap[this.currentFilter]
      );
    },
  },

  methods: {
    // 全部灯光开关
    handleAllLightsToggle(val) {
      this.loading = true;
      setTimeout(() => {
        if (val) {
          this.$message.success("已开启所有照明设备");
          this.stats.activeLights = this.stats.totalDevices;
          this.areas.forEach((area) => {
            area.enabled = true;
            area.lightsOn = area.online;
            area.brightness = 80;
          });
          this.devices.forEach((device) => {
            device.status = true;
            device.brightness = 80;
          });
        } else {
          this.$message.warning("已关闭所有照明设备");
          this.stats.activeLights = 0;
          this.areas.forEach((area) => {
            area.enabled = false;
            area.lightsOn = 0;
            area.brightness = 0;
          });
          this.devices.forEach((device) => {
            device.status = false;
            device.brightness = 0;
          });
        }
        this.loading = false;
      }, 1000);
    },

    // 激活场景
    activateScene(scene) {
      this.$confirm(`确定要切换到${scene.name}吗？`, "场景切换", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "info",
      })
        .then(() => {
          this.loading = true;
          setTimeout(() => {
            // 根据场景调整所有区域的亮度
            this.areas.forEach((area) => {
              if (area.enabled) {
                area.brightness = scene.brightness;
              }
            });
            this.devices.forEach((device) => {
              if (device.status) {
                device.brightness = scene.brightness;
              }
            });
            this.$message.success(`已切换到${scene.name}`);
            this.loading = false;
          }, 1500);
        })
        .catch(() => {});
    },

    // 选择区域
    selectArea(area) {
      this.$message.info(`选中区域: ${area.name}`);
    },

    // 切换区域照明
    toggleAreaLights(area) {
      if (area.enabled) {
        area.lightsOn = area.online;
        area.brightness = 80;
        this.$message.success(`已开启${area.name}照明`);
      } else {
        area.lightsOn = 0;
        area.brightness = 0;
        this.$message.info(`已关闭${area.name}照明`);
      }
      this.updateStats();
    },

    // 调整区域亮度
    adjustAreaBrightness(area) {
      this.$message.success(`${area.name}亮度调整为${area.brightness}%`);
    },

    // 切换设备
    toggleDevice(device) {
      if (device.status) {
        device.brightness = 80;
        this.$message.success(`已开启${device.name}`);
      } else {
        device.brightness = 0;
        this.$message.info(`已关闭${device.name}`);
      }
      this.updateStats();
    },

    // 调整设备亮度
    adjustDeviceBrightness(device) {
      console.log(`${device.name}亮度调整为${device.brightness}%`);
    },

    // 更新统计数据
    updateStats() {
      let activeLights = 0;
      this.areas.forEach((area) => {
        activeLights += area.lightsOn;
      });
      this.stats.activeLights = activeLights;
      this.stats.allLightsOn = activeLights > 0;
    },

    // 添加设备
    handleAddDevice() {
      this.$message.info("添加设备功能待实现");
    },

    // 系统设置
    handleSystemSettings() {
      this.$message.info("系统设置功能待实现");
    },

    // 添加场景
    handleAddScene() {
      this.$message.info("自定义场景功能待实现");
    },

    // 添加定时任务
    handleAddSchedule() {
      this.$message.info("添加定时任务功能待实现");
    },

    // 查看定时任务
    viewSchedules() {
      this.activeTab = "schedules";
    },

    // 编辑设备
    editDevice(device) {
      this.$message.info(`编辑设备: ${device.name}`);
    },

    // 查看设备历史
    viewDeviceHistory(device) {
      this.$message.info(`查看${device.name}的历史记录`);
    },

    // 删除设备
    deleteDevice(device) {
      this.$confirm(`确定要删除设备"${device.name}"吗？`, "删除确认", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$message.success("删除成功");
        })
        .catch(() => {});
    },

    // 获取设备类型标签样式
    getDeviceTypeTag(type) {
      const typeMap = {
        LED灯: "primary",
        筒灯: "success",
        灯带: "warning",
        射灯: "info",
      };
      return typeMap[type] || "info";
    },
  },

  mounted() {
    // 模拟数据加载
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.$message.success("照明系统数据加载完成");
    }, 1000);

    // 设置默认日期范围（最近7天）
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    this.energyDateRange = [start, end];
  },
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 页面容器 */
.lighting-container {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
  min-height: 100vh;
  background: #f5f7fa;
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title i {
  font-size: 28px;
  color: #409eff;
}

/* 统计卡片 */
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-card::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), transparent);
  border-radius: 0 0 0 100%;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.blue {
  background: #e3f2fd;
  color: #2196f3;
}

.stat-icon.green {
  background: #e8f5e9;
  color: #4caf50;
}

.stat-icon.orange {
  background: #fff3e0;
  color: #ff9800;
}

.stat-icon.purple {
  background: #f3e5f5;
  color: #9c27b0;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  margin-top: 12px;
}

.stat-trend.up {
  color: #67c23a;
}

.stat-trend.down {
  color: #f56c6c;
}

/* 控制面板 */
.control-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 区域控制网格 */
.area-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.area-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  background: #fafbfc;
}

.area-card:hover {
  border-color: #409eff;
  background: #f5f7fa;
}

.area-card.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.area-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.area-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.area-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #606266;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #67c23a;
}

.status-dot.offline {
  background: #909399;
}

.area-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.light-count {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #606266;
}

.brightness-control {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.brightness-label {
  font-size: 13px;
  color: #909399;
  min-width: 60px;
}

/* 场景卡片 - 更淡雅的B端风格 */
.scene-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.scene-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  color: #303133;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  position: relative;
  overflow: hidden;
  border: 1px solid #e8e8e8;
}

.scene-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #d0d0d0;
}

.scene-card.work {
  background: #fef8fa;
  border-color: #fde4e8;
}

.scene-card.work:hover {
  background: #fef0f4;
  border-color: #fcccd6;
}

.scene-card.rest {
  background: #f0fafa;
  border-color: #d8f0f0;
}

.scene-card.rest:hover {
  background: #e6f7f7;
  border-color: #c0e8e8;
}

.scene-card.meeting {
  background: #fdf8fe;
  border-color: #f4e4f6;
}

.scene-card.meeting:hover {
  background: #fbf0fc;
  border-color: #eeccf2;
}

.scene-card.night {
  background: #f8fcfe;
  border-color: #e4f0f8;
}

.scene-card.night:hover {
  background: #f0f9ff;
  border-color: #cce4f5;
}

.scene-icon {
  font-size: 32px;
  margin-bottom: 12px;
  color: #606266;
}

.scene-card.work .scene-icon {
  color: #f56c6c;
}

.scene-card.rest .scene-icon {
  color: #409eff;
}

.scene-card.meeting .scene-icon {
  color: #e6a23c;
}

.scene-card.night .scene-icon {
  color: #909399;
}

.scene-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #303133;
}

.scene-desc {
  font-size: 13px;
  color: #909399;
}

/* 设备列表样式 - 增加顶部间距 */
.device-filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding-left: 10px;
  padding-top: 20px; /* 新增：增加内边距 */
  flex-wrap: wrap;
}

.filter-tag {
  padding: 6px 16px;
  background: #f4f6f8;
  border: 1px solid #e4e7ed;
  border-radius: 20px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-tag:hover {
  border-color: #409eff;
  color: #409eff;
}

.filter-tag.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

/* 能耗图表 */
.chart-container {
  height: 300px;
  margin-top: 20px;
}

/* 定时任务样式 - 优化间距 */
.schedule-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px; /* 增加内边距 */
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 16px; /* 增加底部间距 */
  transition: all 0.3s ease;
  background: #fafbfc; /* 添加背景色 */
}

.schedule-item:hover {
  border-color: #409eff;
  background: #f5f7fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.schedule-info {
  flex: 1;
}

.schedule-time {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px; /* 增加间距 */
}

.schedule-desc {
  font-size: 14px;
  color: #606266; /* 调整颜色 */
  margin-bottom: 8px; /* 增加间距 */
}

.schedule-days {
  display: flex;
  gap: 6px; /* 增加间距 */
  margin-top: 10px; /* 增加顶部间距 */
}

.day-tag {
  padding: 4px 10px; /* 增加内边距 */
  background: #f4f6f8;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

.day-tag.active {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}

/* Tab切换优化 - 增加内容区间距 */
::v-deep .el-tabs__content {
  padding-top: 20px; /* 新增：tab内容区顶部间距 */
}

::v-deep .el-tabs__item {
  height: 44px;
  line-height: 44px;
  font-size: 14px;
  font-weight: 500;
}

::v-deep .el-tabs--card > .el-tabs__header {
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 0;
}

/* 表格样式优化 */
::v-deep .el-table {
  margin-top: 20px; /* 新增：表格顶部间距 */
}

::v-deep .el-table th {
  background-color: #fafbfc;
  color: #303133;
  font-weight: 600;
}

::v-deep .el-table td {
  padding: 12px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .lighting-container {
    padding: 12px;
  }

  .stats-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .area-grid {
    grid-template-columns: 1fr;
  }

  .scene-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 加载动画 */
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-mask i {
  font-size: 48px;
  color: #409eff;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 自定义滑块样式 */
::v-deep .el-slider__runway {
  background-color: #e4e7ed !important;
}

::v-deep .el-slider__bar {
  background: #409eff !important;
}

/* 开关样式 */
::v-deep .el-switch.is-checked .el-switch__core {
  background: #409eff !important;
  border-color: #409eff !important;
}
</style>
