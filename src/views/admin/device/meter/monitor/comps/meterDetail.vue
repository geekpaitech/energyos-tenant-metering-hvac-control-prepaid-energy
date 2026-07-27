<template>
  <div class="meter-detail-page">
    <!-- 设备概览 -->
    <el-card class="detail-card overview-card" shadow="never">
      <div class="overview-header">
        <div class="overview-title-block">
          <h2 class="meter-title">{{ infoData.meterName || infoData.serial || '-' }}</h2>
          <div class="tag-row">
            <el-tag v-if="payTypeLabel" size="small" :type="infoData.logicPayType == 1 ? 'primary' : 'success'" effect="plain">
              {{ payTypeLabel }}
            </el-tag>
            <el-tag v-if="switchLabel" size="small" :type="infoData.switchStatus == 1 ? 'success' : 'info'" effect="plain">
              {{ switchLabel }}
            </el-tag>
            <el-tag v-if="onlineLabel" size="small" :type="infoData.onlineStatus == 1 ? 'success' : 'danger'" effect="plain">
              {{ onlineLabel }}
            </el-tag>
            <el-tag v-if="bindTypeLabel" size="small" effect="plain">{{ bindTypeLabel }}</el-tag>
          </div>
        </div>
        <div class="overview-actions">
          <el-button type="primary" size="small" @click="onMeterVerify">
            {{ infoData.switchStatus == 0 ? '合闸' : '分闸' }}
          </el-button>
          <el-button size="small" @click="onEditMeter">设置</el-button>
          <el-button size="small" @click="onTest(false)">充值测试</el-button>
          <el-button size="small" @click="onTest(true)">余额清零</el-button>
        </div>
      </div>

      <el-row :gutter="24" class="overview-body">
        <el-col :xs="24" :lg="14">
          <div class="info-section">
            <div class="section-label">基本信息</div>
            <el-descriptions :column="2" border size="medium" class="info-desc">
              <el-descriptions-item label="归属项目">{{ infoData.managerName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="绑定租户">{{ infoData.tenantName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="序列号">{{ infoData.serial || '-' }}</el-descriptions-item>
              <el-descriptions-item label="编号">{{ infoData.id || '-' }}</el-descriptions-item>
              <el-descriptions-item label="电费方案">
                <span>{{ infoData.priceName || '-' }}</span>
                <el-popover
                  v-if="infoData.priceName"
                  placement="top"
                  width="280"
                  trigger="hover"
                  :content="priceTip"
                >
                  <i slot="reference" class="el-icon-warning-outline tip-icon" />
                </el-popover>
              </el-descriptions-item>
              <el-descriptions-item label="服务费方案">
                <span>{{ infoData.servicePriceName || '-' }}</span>
                <el-popover
                  v-if="infoData.servicePriceName"
                  placement="top"
                  width="280"
                  trigger="hover"
                  :content="servicePriceTip"
                >
                  <i slot="reference" class="el-icon-warning-outline tip-icon" />
                </el-popover>
              </el-descriptions-item>
              <el-descriptions-item label="负载限制" :span="2">
                {{ infoData.overloadSwitch ? '开' : '关' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-col>

        <el-col :xs="24" :lg="10">
          <div class="balance-section">
            <div class="balance-card">
              <img class="meter-img" src="@/assets/images/szwyIcon2.jpg" alt="电表">
              <div class="balance-body">
                <span class="balance-label">账户余额</span>
                <span class="balance-value">¥ {{ listData.balance != null ? listData.balance : 0 }}</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 最新数据 -->
    <el-card class="detail-card data-card" shadow="never">
      <div class="section-head">
        <span class="section-label">最新数据</span>
        <span class="section-sub">更新时间：{{ listData.createTime || '-' }}</span>
      </div>

      <el-row :gutter="24">
        <el-col :xs="24" :md="10">
          <el-descriptions :column="1" border size="medium" class="telemetry-desc">
            <el-descriptions-item label="ICCID">{{ listData.imei || '-' }}</el-descriptions-item>
            <el-descriptions-item label="电表付费模式">{{ listPayTypeLabel }}</el-descriptions-item>
            <el-descriptions-item label="费控开关">{{ feeSwitchLabel }}</el-descriptions-item>
            <el-descriptions-item label="电压变比 PT">{{ listData.pt != null ? listData.pt : '-' }}</el-descriptions-item>
            <el-descriptions-item label="电流变比 CT">{{ listData.ct != null ? listData.ct : '-' }}</el-descriptions-item>
            <el-descriptions-item label="购电次数">{{ listData.chargeCount != null ? listData.chargeCount : '-' }}</el-descriptions-item>
            <el-descriptions-item label="电表规格">{{ meterSpecLabel }}</el-descriptions-item>
            <el-descriptions-item label="网络地址">{{ listData.remote || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-col>

        <el-col :xs="24" :md="14">
          <div class="tables-wrap">
            <el-table :data="powerData" border size="small" class="data-table">
              <el-table-column prop="powerPeak" label="尖电量" align="center" />
              <el-table-column prop="powerTop" label="峰电量" align="center" />
              <el-table-column prop="powerFlat" label="平电量" align="center" />
              <el-table-column prop="powerValley" label="谷电量" align="center" />
              <el-table-column prop="powerAll" label="总电量" align="center" />
            </el-table>
            <el-table :data="tableData" border size="small" class="data-table phase-table">
              <el-table-column prop="label" label="" width="100" align="center" />
              <el-table-column prop="a" label="A" align="center" min-width="80" />
              <el-table-column prop="b" label="B" align="center" min-width="80" />
              <el-table-column prop="c" label="C" align="center" min-width="80" />
              <el-table-column prop="total" label="总计" align="center" min-width="80" />
            </el-table>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <MeterVerify :verify-dialog="verifyDialog" @search="onSearch(false)" />
    <LogicEdit :logic-dialog="logicDialog" @search="onSearch(false)" />
    <EditMeter :edit-dialog="editMeterDialog" @search="onSearch(false)" />
  </div>
</template>

<script>
import {
  customerWorkbenchQueryMeterDetail,
  customerWorkbenchQueryMeterLastDetail,
  meterZeroBalance,
  meterChargeTest
} from '@/api/adminDb'
import MeterVerify from '../../comps/verify.vue'
import LogicEdit from '../../comps/logicPayType.vue'
import EditMeter from '../../comps/edit.vue'
import { MeterBindTypeRead } from '../monitorEnums'
import {
  formatLogicPayTypeLabel,
  formatSwitchStatusLabel,
  formatOnlineStatusLabel,
  formatBindTypeLabel,
  formatMeterSpecLabel
} from '../../utils'

export default {
  components: { MeterVerify, EditMeter, LogicEdit },
  data () {
    return {
      serial: '',
      infoData: {},
      listData: {},
      MeterBindTypeRead,
      powerData: [{ powerPeak: 0, powerTop: 0, powerFlat: 0, powerValley: 0, powerAll: 0 }],
      tableData: [
        { label: '电压', a: '-', b: '-', c: '-', total: '-' },
        { label: '电流', a: '-', b: '-', c: '-', total: '-' },
        { label: '有功功率', a: '-', b: '-', c: '-', total: '-' },
        { label: '无功功率', a: '-', b: '-', c: '-', total: '-' },
        { label: '功率因数', a: '-', b: '-', c: '-', total: '-' }
      ],
      verifyDialog: { show: false, type: true, meterId: '', meterName: '' },
      logicDialog: { show: false, data: {} },
      editMeterDialog: { show: false, type: true, data: {} }
    }
  },
  computed: {
    payTypeLabel () {
      const label = formatLogicPayTypeLabel(this.infoData.logicPayType)
      return label === '-' ? '' : label
    },
    switchLabel () {
      const label = formatSwitchStatusLabel(this.infoData.switchStatus)
      return label === '-' ? '' : label
    },
    onlineLabel () {
      const label = formatOnlineStatusLabel(this.infoData.onlineStatus)
      return label === '-' ? '' : label
    },
    bindTypeLabel () {
      return MeterBindTypeRead[this.infoData.bindType]?.label || formatBindTypeLabel(this.infoData.bindType)
    },
    listPayTypeLabel () {
      return formatLogicPayTypeLabel(this.infoData.logicPayType)
    },
    feeSwitchLabel () {
      return formatSwitchStatusLabel(this.listData.feeSwitch)
    },
    meterSpecLabel () {
      return formatMeterSpecLabel(this.listData.phase, this.listData.monitorType)
    },
    priceTip () {
      const d = this.infoData
      return `尖:${d.powerPeakPrice || '-'} / 峰:${d.powerTopPrice || '-'} / 平:${d.powerFlatPrice || '-'} / 谷:${d.powerValleyPrice || '-'}`
    },
    servicePriceTip () {
      const d = this.infoData
      return `尖:${d.servicePeakPrice || '-'} / 峰:${d.serviceTopPrice || '-'} / 平:${d.serviceFlatPrice || '-'} / 谷:${d.serviceValleyPrice || '-'}`
    }
  },
  methods: {
    onSearch (serial) {
      if (serial) this.serial = serial
      this.getInfoData()
      this.getlistData()
    },
    async getInfoData () {
      const { data } = await customerWorkbenchQueryMeterDetail({ serial: this.serial })
      this.infoData = data || {}
    },
    async getlistData () {
      const { data } = await customerWorkbenchQueryMeterLastDetail({ serial: this.serial })
      if (!data) return
      Object.keys(this.powerData[0]).forEach(key => {
        this.powerData[0][key] = data[key]
      })
      const rows = [
        { keys: ['ua', 'ub', 'uc'], total: null },
        { keys: ['ia', 'ib', 'ic'], total: null },
        { keys: ['pa', 'pb', 'pc'], total: 'p' },
        { keys: ['qa', 'qb', 'qc'], total: 'q' },
        { keys: ['pfa', 'pfb', 'pfc'], total: 'pf' }
      ]
      this.tableData = this.tableData.map((row, index) => {
        const cfg = rows[index]
        return {
          label: row.label,
          a: data[cfg.keys[0]] != null ? data[cfg.keys[0]] : '-',
          b: data[cfg.keys[1]] != null ? data[cfg.keys[1]] : '-',
          c: data[cfg.keys[2]] != null ? data[cfg.keys[2]] : '-',
          total: cfg.total && data[cfg.total] != null ? data[cfg.total] : (cfg.total ? '-' : '-')
        }
      })
      this.listData = data
    },
    onTest (is) {
      const data = this.infoData
      this.$confirm(`是否${is ? '进行清零测试' : '进行充值测试'}`, '提示', { type: 'warning' })
        .then(async () => {
          const { msg } = is
            ? await meterZeroBalance({ meterId: data.id })
            : await meterChargeTest({ meterId: data.id })
          this.$message.success(msg || '操作成功')
          this.onSearch(false)
        })
        .catch(() => {})
    },
    onMeterVerify () {
      const item = this.infoData
      if (item.logicPayType === 0 || item.logicPayType === '0') {
        this.logicDialog.show = true
        this.logicDialog.data = item
      } else {
        this.verifyDialog.show = true
        this.verifyDialog.type = item.switchStatus == 0 ? 1 : 0
        this.verifyDialog.meterId = item.id
        this.verifyDialog.meterName = item.meterName
      }
    },
    onEditMeter () {
      this.editMeterDialog.data = { ...this.infoData }
      this.editMeterDialog.type = true
      this.editMeterDialog.show = true
    }
  }
}
</script>

<style lang="scss" scoped>
.meter-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card {
  border: none;
  border-radius: 8px;

  ::v-deep .el-card__body {
    padding: 24px;
  }
}

.overview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.meter-title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  word-break: break-all;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.overview-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  flex-shrink: 0;
}

.section-label {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 14px;
}

.section-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.section-sub {
  font-size: 13px;
  color: #909399;
}

.info-desc,
.telemetry-desc {
  ::v-deep .el-descriptions-item__label {
    width: 110px;
    min-width: 110px;
    background: #fafafa;
    color: #606266;
    font-weight: 500;
  }
  ::v-deep .el-descriptions-item__content {
    color: #303133;
    word-break: break-all;
  }
}

.balance-section {
  height: 100%;
  display: flex;
  align-items: stretch;
}

.balance-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px;
  background: linear-gradient(180deg, #f8fafc 0%, #f0f5ff 100%);
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.meter-img {
  width: 100px;
  height: 100px;
  object-fit: contain;
  margin-bottom: 20px;
}

.balance-body {
  width: 100%;
  text-align: center;
  padding: 16px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.balance-label {
  display: block;
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.balance-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.tip-icon {
  margin-left: 6px;
  color: #909399;
  cursor: pointer;
  vertical-align: middle;
}

.tables-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.data-table {
  width: 100%;

  ::v-deep .el-table__cell {
    padding: 10px 0;
  }
}

@media (max-width: 1200px) {
  .overview-body .balance-section {
    margin-top: 8px;
  }
}
</style>
