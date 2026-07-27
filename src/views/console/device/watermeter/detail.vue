<template>
  <el-drawer
    :visible.sync="visible"
    :before-close="handleClose"
    size="60%"
    :destroy-on-close="true"
    class="water-detail-drawer"
  >
    <div slot="title" class="drawer-title">
      <span>{{ $t('deviceWater.waterDrawerTitle') }}</span>
    </div>

    <div v-loading="pageLoading" class="drawer-content">
      <div class="top-section">
        <div class="left-info">
          <div class="water-header">
            <h2 class="water-name">{{ displayWaterName || '--' }}</h2>
            <div class="status-tags">
              <el-tag
                v-if="waterInfo.withSwitch"
                size="small"
                :type="waterInfo.switchStatus == 1 ? 'success' : 'info'">
                {{ waterInfo.switchStatus == 1 ? $t('deviceWater.valveOpen') : $t('deviceWater.valveClose') }}
              </el-tag>
              <el-tag size="small" type="warning">
                {{ getBindTypeLabel(waterInfo.bindType) }}
              </el-tag>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-row">
              <div class="info-item">
                <span class="label">{{ $t('deviceWater.colDeviceNo') }}：</span>
                <span class="value">{{ waterInfo.serial || '--' }}</span>
              </div>
              <div class="info-item">
                <span class="label">{{ $t('deviceWater.colCreateTime') }}：</span>
                <span class="value">{{ waterInfo.createTime || '--' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="label">{{ $t('deviceWater.waterDrawerColId') }}：</span>
                <span class="value">{{ waterInfo.id || '--' }}</span>
              </div>
              <div class="info-item">
                <span class="label">{{ $t('deviceWater.colUpdateTime') }}：</span>
                <span class="value">{{ waterInfo.updateTime || '--' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="label">{{ $t('deviceWater.waterDrawerColModel') }}：</span>
                <span class="value">{{ waterInfo.waterModel || '--' }}</span>
              </div>
              <div class="info-item">
                <span class="label">{{ $t('deviceWater.waterDrawerColInstallLoc') }}：</span>
                <span class="value">--</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item full-width">
                <span class="label">{{ $t('deviceWater.waterDrawerLabelValveSupport') }}：</span>
                <span class="value">{{ waterInfo.withSwitch ? $t('deviceWater.switchSupportYes') : $t('deviceWater.switchSupportNo') }}</span>
              </div>
            </div>
            <div class="info-row" v-if="waterInfo.withSwitch">
              <div class="info-item full-width">
                <span class="label">{{ $t('deviceWater.colPayMode') }}：</span>
                <span class="value">{{ getPayTypeLabel(waterInfo.logicPayType) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="right-info">
          <div v-if="canEdit" class="action-buttons">
            <template v-if="waterInfo.withSwitch">
              <el-button
                size="small"
                type="danger"
                plain
                v-if="waterInfo.switchStatus == 1"
                @click="handleSwitch(0)"
                :loading="switchLoading">
                {{ $t('deviceWater.valveClose') }}
              </el-button>
              <el-button
                size="small"
                type="success"
                plain
                v-else
                @click="handleSwitch(1)"
                :loading="switchLoading">
                {{ $t('deviceWater.valveOpen') }}
              </el-button>
            </template>
            <el-button size="small" plain @click="handleEdit">{{ $t('deviceWater.opEdit') }}</el-button>
          </div>

          <div class="bind-card">
            <h4 class="bind-title">{{ $t('deviceWater.colBindInfo') }}</h4>
            <div class="bind-content">
              <div v-if="waterInfo.waterBindDtoList && waterInfo.waterBindDtoList.length > 0" class="bind-info">
                <div
                  v-for="(bind, index) in waterInfo.waterBindDtoList"
                  :key="index"
                  class="bind-header">
                  <span class="bind-text">({{ bind.bindId }}){{ $displayBizHybrid(bind.bindName, 200) }}</span>
                </div>
              </div>
              <div v-else class="no-bind">{{ $t('deviceWater.waterDrawerNoBind') }}</div>

              <div v-if="waterInfo.waterPriceDto" class="price-section">
                <div class="price-name">
                  {{ $t('deviceWater.waterDrawerPricePlanLabel') }}：{{ $displayBizHybrid(waterInfo.waterPriceDto.name, 200) }}
                </div>
                <div class="price-detail">
                  {{ $t('deviceWater.waterDrawerPricePerTon', { price: waterInfo.waterPriceDto.price }) }}
                </div>
              </div>
              <div v-else class="price-section">
                <div class="no-price">{{ $t('deviceWater.waterDrawerNoPricePlan') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="usage-section">
        <div class="section-header">
          <h4>{{ $t('deviceWater.waterDrawerSectionUsage') }}</h4>
          <el-button type="text" @click="goToDetailReport">
            {{ $t('deviceWater.waterDrawerLinkFullReport') }} &gt;
          </el-button>
        </div>

        <el-table
          v-if="usageData.length > 0"
          v-loading="usageLoading"
          :data="usageData"
          max-height="400"
          style="width: 100%"
          :header-cell-style="{
            background: '#fafafa',
            color: '#333',
            fontWeight: '600'
          }">
          <el-table-column
            prop="occurDate"
            :label="$t('deviceWater.waterDrawerColTime')"
            min-width="120"
            align="center" />
          <el-table-column
            prop="endRead"
            :label="$t('deviceWater.waterDrawerColEndRead')"
            min-width="130"
            align="right">
            <template slot-scope="scope">
              {{ scope.row.endRead || '--' }}
            </template>
          </el-table-column>
          <el-table-column
            prop="consumption"
            :label="$t('deviceWater.waterDrawerColConsumption')"
            min-width="120"
            align="right">
            <template slot-scope="scope">
              {{ scope.row.consumption || '--' }}
            </template>
          </el-table-column>
          <el-table-column
            prop="balance"
            :label="$t('deviceWater.waterDrawerColWaterFee')"
            min-width="110"
            align="right">
            <template slot-scope="scope">
              {{ scope.row.balance || '--' }}
            </template>
          </el-table-column>
        </el-table>

        <div v-else-if="!usageLoading" class="empty-state">
          <i class="el-icon-document"></i>
          <p>{{ $t('deviceWater.waterDrawerEmptyUsage') }}</p>
        </div>
      </div>
    </div>

    <el-dialog
      :title="$t('deviceWater.dialogEditTitle')"
      :visible.sync="editDialog.visible"
      width="600px"
      append-to-body>
      <el-form ref="editForm" :model="editForm" :rules="editFormRules" :label-width="editDialogLabelWidth">
        <el-form-item :label="$t('deviceWater.labelWaterName')" prop="waterName">
          <el-input v-model="editForm.waterName" />
        </el-form-item>
        <el-form-item :label="$t('deviceWater.labelWaterType')" prop="bindType">
          <el-select v-model="editForm.bindType" style="width: 100%">
            <el-option :label="$t('deviceWater.bindTypeDedicated')" :value="1" />
            <el-option :label="$t('deviceWater.bindTypePublic')" :value="2" />
            <el-option :label="$t('deviceWater.bindTypeFormula')" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('deviceWater.labelAccessChannel')" prop="waterType">
          <el-select v-model="editForm.waterType" style="width: 100%">
            <el-option :label="$t('deviceWater.channelNs')" value="ZHWL_NS" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('deviceWater.labelDeviceModel')">
          <el-input v-model="editForm.waterModel" />
        </el-form-item>
        <el-form-item :label="$t('deviceWater.labelValveSupport')">
          <el-select v-model="editForm.withSwitch" style="width: 100%">
            <el-option :label="$t('deviceWater.switchSupportYes')" :value="true" />
            <el-option :label="$t('deviceWater.switchSupportNo')" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="editForm.withSwitch" :label="$t('deviceWater.labelPayMode')">
          <el-select v-model="editForm.logicPayType" style="width: 100%">
            <el-option :label="$t('deviceWater.prepaid')" :value="0" />
            <el-option :label="$t('deviceWater.prepaidStrong')" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('deviceWater.labelBillingPlan')">
          <el-select v-model="editForm.priceId" style="width: 100%" clearable>
            <el-option
              v-for="price in priceList"
              :key="price.id"
              :label="priceOptionDisplay(price)"
              :value="price.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="editDialog.visible = false">{{ $t('deviceWater.btnCancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="saveEdit">{{ $t('deviceWater.btnConfirm') }}</el-button>
      </span>
    </el-dialog>
  </el-drawer>
</template>

<script>
import moment from 'moment'
import {
  waterPageWater,
  waterDoWaterSwitch,
  waterUpdateWater
} from '@/api/water'
import { waterPriceListPrice } from '@/api/waterPrice'
import { queryTenantWaterUseStatis } from '@/api/useReport'
import { mapGetters } from 'vuex'

export default {
  name: 'WaterDetailDrawer',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    waterId: {
      type: [String, Number],
      default: ''
    },
    serial: {
      type: String,
      default: ''
    },
    rowData: {
      type: Object,
      default: () => ({})
    }
  },
  data () {
    return {
      pageLoading: false,
      usageLoading: false,
      switchLoading: false,
      submitting: false,

      waterInfo: {},
      usageData: [],

      editDialog: {
        visible: false
      },
      editForm: {},

      priceList: []
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    kztMenuNos () {
      const list = this.$store.getters.kztMenuNos
      return Array.isArray(list) ? list : []
    },
    hasKztPermission () {
      const allow = new Set(this.kztMenuNos.map((v) => String(v)))
      return (menuNo) => allow.has(String(menuNo))
    },
    canEdit () {
      return this.hasKztPermission('630021')
    },
    displayWaterName () {
      return this.$displayDynamicName(this.waterInfo.waterName, 200)
    },
    editFormRules () {
      return {
        waterName: [{ required: true, message: this.$t('deviceWater.ruleWaterName'), trigger: 'blur' }],
        bindType: [{ required: true, message: this.$t('deviceWater.ruleBindType'), trigger: 'change' }],
        waterType: [{ required: true, message: this.$t('deviceWater.ruleChannel'), trigger: 'change' }]
      }
    },
    editDialogLabelWidth () {
      return this.$i18n.locale === 'en' ? '132px' : '110px'
    }
  },
  watch: {
    visible (val) {
      if (val) {
        this.loadData()
      } else {
        this.resetData()
      }
    }
  },
  methods: {
    priceOptionDisplay (price) {
      return this.$t('deviceWater.priceOptionLabel', {
        name: this.$displayBizHybrid(price.name, 80),
        price: price.price
      })
    },

    async loadData () {
      this.pageLoading = true
      try {
        if (this.rowData && this.rowData.id) {
          this.waterInfo = { ...this.rowData }
        } else {
          await this.getWaterInfo()
        }

        await Promise.all([
          this.getUsageData(),
          this.loadPriceList()
        ])
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        this.pageLoading = false
      }
    },

    async getWaterInfo () {
      try {
        const params = {
          serial: this.serial,
          page: { size: 1, current: 1 }
        }
        const response = await waterPageWater(params)
        if (response.code === 200 && response.data && response.data.dataList.length > 0) {
          this.waterInfo = response.data.dataList[0]
        }
      } catch (error) {
        console.error('获取水表信息失败:', error)
      }
    },

    async loadPriceList () {
      try {
        const managerId = this.waterInfo.managerId
        if (managerId) {
          const response = await waterPriceListPrice({ managerId })
          if (response.code === 200 && response.data) {
            this.priceList = response.data || []
          }
        }
      } catch (error) {
        console.error('获取水价方案失败:', error)
      }
    },

    async getUsageData () {
      this.usageLoading = true
      try {
        let tenantIdList = []
        if (this.waterInfo.waterBindDtoList && this.waterInfo.waterBindDtoList.length > 0) {
          tenantIdList = this.waterInfo.waterBindDtoList.map(item => item.bindId)
        }

        if (tenantIdList.length === 0) {
          this.usageData = []
          return
        }

        const params = {
          startDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
          endDate: moment().format('YYYY-MM-DD'),
          dataType: 2,
          useType: 0,
          tenantIdList: tenantIdList,
          managerId: this.currentManagerId
        }

        const response = await queryTenantWaterUseStatis(params)

        if (response.code === 200 && response.data) {
          const detailData = []
          if (response.data && response.data.length > 0) {
            response.data.forEach(item => {
              if (item.deviceUseDtoList && item.deviceUseDtoList.length > 0) {
                const currentDeviceData = item.deviceUseDtoList.filter(
                  device => device.waterId == this.waterId
                )

                detailData.push(...currentDeviceData.map(device => ({
                  occurDate: item.occurDate,
                  endRead: device.endRead,
                  consumption: device.consumption,
                  balance: device.balance
                })))
              }
            })
          }
          this.usageData = detailData.sort((a, b) => {
            return new Date(b.occurDate) - new Date(a.occurDate)
          })
        } else {
          this.usageData = []
        }
      } catch (error) {
        console.error('加载用水统计失败:', error)
        this.usageData = []
      } finally {
        this.usageLoading = false
      }
    },

    async handleSwitch (targetStatus) {
      if (!this.canEdit) return
      if (!this.waterInfo.withSwitch) {
        this.$message.warning(this.$t('deviceWater.warnNoValveSupport'))
        return
      }

      const actionLabel = targetStatus == 1
        ? this.$t('deviceWater.valveOpen')
        : this.$t('deviceWater.valveClose')

      try {
        await this.$confirm(
          this.$t('deviceWater.confirmValveMsg', { action: actionLabel }),
          this.$t('deviceWater.confirmTitle'),
          {
            confirmButtonText: this.$t('deviceWater.btnConfirm'),
            cancelButtonText: this.$t('deviceWater.btnCancel'),
            type: 'warning'
          }
        )

        this.switchLoading = true
        const response = await waterDoWaterSwitch({
          waterId: this.waterId,
          type: targetStatus
        })

        if (response.code === 200) {
          this.$message.success(this.$t('deviceWater.successValveAction', { action: actionLabel }))
          this.getWaterInfo()
          this.$emit('refresh')
        } else {
          this.$message.error(response.msg || this.$t('deviceWater.errValveAction', { action: actionLabel }))
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(this.$t('deviceWater.errValveAction', { action: actionLabel }))
        }
      } finally {
        this.switchLoading = false
      }
    },

    handleEdit () {
      if (!this.canEdit) return
      this.editForm = {
        id: this.waterInfo.id,
        serial: this.waterInfo.serial,
        waterName: this.waterInfo.waterName,
        bindType: this.waterInfo.bindType,
        waterType: this.waterInfo.waterType,
        waterModel: this.waterInfo.waterModel,
        withSwitch: this.waterInfo.withSwitch,
        logicPayType: this.waterInfo.logicPayType,
        managerId: this.waterInfo.managerId,
        priceId: this.waterInfo.priceId
      }
      this.editDialog.visible = true
    },

    async saveEdit () {
      if (!this.canEdit) return
      try {
        await this.$refs.editForm.validate()

        this.submitting = true
        const response = await waterUpdateWater(this.editForm)

        if (response.code === 200) {
          this.$message.success(this.$t('deviceWater.successSaveUpdate'))
          this.editDialog.visible = false
          this.getWaterInfo()
          this.$emit('refresh')
        } else {
          this.$message.error(response.msg || this.$t('deviceWater.errUpdate'))
        }
      } catch (error) {
        if (error !== false) {
          this.$message.error(this.$t('deviceWater.errUpdate'))
        }
      } finally {
        this.submitting = false
      }
    },

    goToDetailReport () {
      this.$router.push({
        path: '/energy/charging-water',
        query: {
          waterId: this.waterInfo.id || this.waterId,
          startDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
          endDate: moment().format('YYYY-MM-DD')
        }
      })
      this.handleClose()
    },

    handleClose () {
      this.$emit('update:visible', false)
    },

    resetData () {
      this.waterInfo = {}
      this.usageData = []
      this.priceList = []
    },

    getBindTypeLabel (type) {
      const map = {
        1: 'bindTypeDedicated',
        2: 'bindTypePublic',
        3: 'bindTypeFormula'
      }
      const k = map[type]
      return k ? this.$t(`deviceWater.${k}`) : '--'
    },

    getPayTypeLabel (type) {
      const map = {
        0: 'prepaid',
        1: 'prepaidStrong'
      }
      const k = map[type]
      return k ? this.$t(`deviceWater.${k}`) : '--'
    }
  }
}
</script>

<style lang="scss" scoped>
.water-detail-drawer {
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
    min-width: 0;

    .water-header {
      margin-bottom: 20px;

      .water-name {
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
    flex: 0 1 360px;
    width: 360px;
    min-width: 0;
    max-width: 100%;

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
            margin-bottom: 8px;

            .bind-text {
              font-size: 14px;
              color: #303133;
              font-weight: 500;
              word-break: break-word;
            }
          }
        }

        .no-bind {
          color: #909399;
          text-align: center;
          padding: 12px;
          font-size: 14px;
        }

        .price-section {
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;

          .price-name {
            margin-bottom: 8px;
            font-size: 14px;
            color: #303133;
            font-weight: 500;
            word-break: break-word;
          }

          .price-detail {
            font-size: 13px;
            color: #606266;
          }

          .no-price {
            color: #909399;
            text-align: center;
            padding: 12px;
            font-size: 14px;
          }
        }
      }
    }
  }

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
    }
  }

  .empty-state {
    height: 200px;
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
  }

  @media (max-width: 1400px) {
    .top-section {
      flex-direction: column;
    }

    .right-info {
      width: 100%;
    }
  }
}
</style>
