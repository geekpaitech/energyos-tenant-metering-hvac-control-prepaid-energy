<template>
  <div class="meter-detail" v-loading="loading">
    <div class="section-header">
      <div class="title-group">
        <span class="section-indicator"></span>
        <h3 class="section-title">最新数据</h3>
        <span class="update-time">更新时间：{{ meterData.createTime || '-' }}</span>
      </div>
    </div>

    <div class="detail-content">
      <!-- 基础信息 -->
      <div class="info-panel">
        <el-descriptions :column="1" size="small" :labelStyle="{ width: '100px', color: '#999' }">
          <el-descriptions-item label="序列号">{{ serial || '-' }}</el-descriptions-item>
          <el-descriptions-item label="ICCID">{{ meterData.imei || '-' }}</el-descriptions-item>
          <el-descriptions-item label="电压变比PT">{{ meterData.pt || '-' }}</el-descriptions-item>
          <el-descriptions-item label="电流变比CT">{{ meterData.ct || '-' }}</el-descriptions-item>
          <el-descriptions-item label="电表规格">{{ meterSpec }}</el-descriptions-item>
          <el-descriptions-item label="在线状态">
            <el-tag :type="meterData.onlineStatus === 1 ? 'success' : 'info'" size="small">
              {{ meterData.onlineStatus === 1 ? '在线' : '离线' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 电力数据表格 -->
      <div class="data-panel" v-if="tableData.length">
        <el-table :data="tableData" border size="small">
          <el-table-column prop="label" label="" width="100" />
          <el-table-column prop="a" label="A" align="center">
            <template #default="{ row }">{{ row.a || '-' }}</template>
          </el-table-column>
          <el-table-column prop="b" label="B" align="center">
            <template #default="{ row }">{{ row.b || '-' }}</template>
          </el-table-column>
          <el-table-column prop="c" label="C" align="center">
            <template #default="{ row }">{{ row.c || '-' }}</template>
          </el-table-column>
          <el-table-column prop="total" label="总计" align="center">
            <template #default="{ row }">{{ row.total || '-' }}</template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
import { getMeterLastDetail } from '@/api/subMetering'

// 电表相位映射
const METER_PHASE_MAP = {
  1: '单相',
  3: '三相'
}

// 电表监测类型映射
const METER_MONITOR_TYPE_MAP = {
  0: '普通电表',
  1: '智能电表',
  2: '多功能电表'
}

export default {
  name: 'MeterDetail',

  props: {
    serial: {
      type: [String, Number],
      default: ''
    }
  },

  data () {
    return {
      loading: false,
      meterData: {},
      tableData: [
        { label: '电压', a: '', b: '', c: '', total: '' },
        { label: '电流', a: '', b: '', c: '', total: '' },
        { label: '有功功率', a: '', b: '', c: '', total: '' },
        { label: '无功功率', a: '', b: '', c: '', total: '' },
        { label: '功率因数', a: '', b: '', c: '', total: '' }
      ]
    }
  },

  computed: {
    meterSpec () {
      const phase = METER_PHASE_MAP[this.meterData.phase] || ''
      const monitorType = METER_MONITOR_TYPE_MAP[this.meterData.monitorType] || ''
      return phase && monitorType ? `${phase}${monitorType}` : '-'
    }
  },

  watch: {
    serial: {
      handler (val) {
        if (val) {
          this.fetchData()
        }
      },
      immediate: true
    }
  },

  methods: {
    async fetchData () {
      this.loading = true
      try {
        const { data } = await getMeterLastDetail({ serial: this.serial })
        this.meterData = data || {}
        this.processTableData(data)
      } catch (error) {
        console.error('获取电表详情失败:', error)
      } finally {
        this.loading = false
      }
    },

    processTableData (data) {
      if (!data) return

      // 电压
      this.tableData[0].a = data.ua
      this.tableData[0].b = data.ub
      this.tableData[0].c = data.uc

      // 电流
      this.tableData[1].a = data.ia
      this.tableData[1].b = data.ib
      this.tableData[1].c = data.ic

      // 有功功率
      this.tableData[2].a = data.pa
      this.tableData[2].b = data.pb
      this.tableData[2].c = data.pc
      this.tableData[2].total = data.p

      // 无功功率
      this.tableData[3].a = data.qa
      this.tableData[3].b = data.qb
      this.tableData[3].c = data.qc
      this.tableData[3].total = data.q

      // 功率因数
      this.tableData[4].a = data.pfa
      this.tableData[4].b = data.pfb
      this.tableData[4].c = data.pfc
      this.tableData[4].total = data.pf
    }
  }
}
</script>

<style lang="scss" scoped>
.meter-detail {
  background: #fff;
  border-radius: 4px;
  padding: 20px;

  .section-header {
    margin-bottom: 16px;

    .title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-indicator {
      width: 4px;
      height: 18px;
      background: #1890ff;
      border-radius: 2px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 500;
      color: #1c1c1c;
      margin: 0;
    }

    .update-time {
      font-size: 13px;
      color: #999;
      margin-left: 8px;
    }
  }

  .detail-content {
    display: flex;
    gap: 40px;

    .info-panel {
      width: 300px;
      flex-shrink: 0;
    }

    .data-panel {
      flex: 1;
    }
  }
}
</style>
