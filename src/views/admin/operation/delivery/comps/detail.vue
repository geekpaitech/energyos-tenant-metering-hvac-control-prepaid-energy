<template>
  <el-drawer
    :visible.sync="detailDrawer.show"
    direction="rtl"
    :before-close="closeDialog"
    size="60%"
  >
    <div slot="title" class="drawer-title">
      <span class="title-bar" />
      <span>{{ detailDrawer.data.label }}</span>
    </div>
    <div class="drawer-content">
      <!-- 离线监测 -->
      <el-table
        v-show="detailDrawer.data.index == 0"
        :data="detailDrawer.data.data"
        height="78vh"
        border
        highlight-current-row
      >
        <el-table-column label="电表名称" min-width="160">
          <template slot-scope="{ row }">{{ row.meterName }}</template>
        </el-table-column>
        <el-table-column label="序列号" width="150">
          <template slot-scope="{ row }">{{ row.meterSerial }}</template>
        </el-table-column>
        <el-table-column label="最近在线时间" width="170">
          <template slot-scope="{ row }">{{ row.occurTime || '-' }}</template>
        </el-table-column>
        <el-table-column label="离线时长" min-width="130">
          <template slot-scope="{ row }">{{ row.offlineTxt || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template slot-scope="{ row }">
            <el-button type="text" @click="toMonitor(row)">电表监控</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 电表余额大于0 -->
      <el-table
        v-show="detailDrawer.data.index == 1"
        :data="detailDrawer.data.data"
        height="78vh"
        border
        highlight-current-row
      >
        <el-table-column label="电表名称" min-width="160">
          <template slot-scope="{ row }">{{ row.meterName }}</template>
        </el-table-column>
        <el-table-column label="序列号" width="150">
          <template slot-scope="{ row }">{{ row.meterSerial }}</template>
        </el-table-column>
        <el-table-column label="数据上报时间" width="170">
          <template slot-scope="{ row }">{{ row.occurTime || '-' }}</template>
        </el-table-column>
        <el-table-column label="余额(元)" width="130">
          <template slot-scope="{ row }">
            {{ row.balance != null ? '¥' + Number(row.balance).toFixed(2) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template slot-scope="{ row }">
            <el-button type="text" @click="toMonitor(row)">电表监控</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 电表功率总和不一致 -->
      <el-table
        v-show="detailDrawer.data.index == 2"
        :data="detailDrawer.data.data"
        height="78vh"
        border
        highlight-current-row
      >
        <el-table-column label="电表名称" width="180">
          <template slot-scope="{ row }">{{ row.meterName }}</template>
        </el-table-column>
        <el-table-column label="序列号" width="140">
          <template slot-scope="{ row }">{{ row.meterSerial }}</template>
        </el-table-column>
        <el-table-column label="数据上报时间" width="160">
          <template slot-scope="{ row }">{{ row.occurTime || '-' }}</template>
        </el-table-column>
        <el-table-column label="A相功率" width="90">
          <template slot-scope="{ row }">{{ row.pa }}</template>
        </el-table-column>
        <el-table-column label="B相功率" width="90">
          <template slot-scope="{ row }">{{ row.pb }}</template>
        </el-table-column>
        <el-table-column label="C相功率" width="90">
          <template slot-scope="{ row }">{{ row.pc }}</template>
        </el-table-column>
        <el-table-column label="计算总功率" width="100">
          <template slot-scope="{ row }">{{ row.sumPaPbPc }}</template>
        </el-table-column>
        <el-table-column label="上报总功率" width="100">
          <template slot-scope="{ row }">{{ row.p }}</template>
        </el-table-column>
        <el-table-column label="功率差值" width="90">
          <template slot-scope="{ row }">{{ row.diffP }}</template>
        </el-table-column>
        <el-table-column label="异常相位" min-width="100">
          <template slot-scope="{ row }">{{ row.errorPhase }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template slot-scope="{ row }">
            <el-button type="text" @click="toMonitor(row)">电表监控</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 电压缺相 -->
      <el-table
        v-show="detailDrawer.data.index == 3"
        :data="detailDrawer.data.data"
        height="78vh"
        border
        highlight-current-row
      >
        <el-table-column label="电表名称" min-width="160">
          <template slot-scope="{ row }">{{ row.meterName }}</template>
        </el-table-column>
        <el-table-column label="序列号" width="160">
          <template slot-scope="{ row }">{{ row.meterSerial }}</template>
        </el-table-column>
        <el-table-column label="A相电压" width="120">
          <template slot-scope="{ row }">{{ row.ua }}</template>
        </el-table-column>
        <el-table-column label="B相电压" width="120">
          <template slot-scope="{ row }">{{ row.ub }}</template>
        </el-table-column>
        <el-table-column label="C相电压" width="120">
          <template slot-scope="{ row }">{{ row.uc }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template slot-scope="{ row }">
            <el-button type="text" @click="toMonitor(row)">电表监控</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-drawer>
</template>

<script>
export default {
  name: 'DeliveryDetail',
  props: {
    detailDrawer: {
      type: Object,
      default: () => ({
        show: false,
        data: { data: [], num: 0, label: '' }
      })
    }
  },
  methods: {
    closeDialog () {
      this.detailDrawer.show = false
    },
    toMonitor (item) {
      this.$router.push({
        path: '/admin/device/meter/monitor',
        query: { id: item.meterSerial, type: '1' }
      })
    }
  }
}
</script>

<style scoped>
.drawer-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.title-bar {
  width: 4px;
  height: 18px;
  background: #409eff;
  border-radius: 2px;
}

.drawer-content {
  padding: 0 10px;
}
</style>
