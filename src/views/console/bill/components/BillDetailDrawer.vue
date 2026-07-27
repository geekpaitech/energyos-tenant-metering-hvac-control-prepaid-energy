<template>
  <el-drawer class="drawer bill-detail-drawer" :visible.sync="detailDrawer.show" size="60%" :before-close="handleClose"
    @open="handleOpen">
    <div slot="title" class="drawer-title-slot">
      <span>账单详情</span>
    </div>

    <div v-loading="loading" class="drawer_content">
      <!-- 租户信息 -->
      <div class="detail-section">
        <div class="info-grid">
          <div class="info-row">
            <div class="info-item">
              <span class="label">租户：</span>
              <span class="value">{{ formatValue(`(${billInfo.tenantId})${billInfo.tenantName}`) }}</span>
            </div>
            <div class="info-item">
              <span class="label">账单流水号：</span>
              <span class="value">{{ formatValue(billInfo.rid) }}</span>
            </div>
            <div class="info-item">
              <span class="label">账单日期：</span>
              <span class="value">{{ formatValue(billInfo.occurDate) }}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <span class="label">费用类型：</span>
              <span class="value">{{ getBillTypeLabel(billInfo.useType) }}</span>
            </div>
            <div class="info-item">
              <span class="label">账单类型：</span>
              <span class="value">
                <el-tag :type="getSettleWayType(billInfo.settleWay)" size="small">
                  {{ getSettleWayLabel(billInfo.settleWay) }}
                </el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="label">缴费状态：</span>
              <span class="value">
                <el-tag :type="billInfo.payStatus == 1 ? 'success' : 'info'" size="small">
                  {{ billInfo.payStatus == 1 ? '已缴费' : '未缴费' }}
                </el-tag>
              </span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <span class="label">抵扣金支付(元)：</span>
              <span class="value">{{ formatMoney(billInfo.discountAmt) }}</span>
            </div>
            <div class="info-item">
              <span class="label">现金支付(元)：</span>
              <span class="value">{{ formatMoney(billInfo.realAmt) }}</span>
            </div>
            <div class="info-item">
              <span class="label">账单金额(元)：</span>
              <span class="value amount-highlight">{{ formatMoney(billInfo.balance) }}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <span class="label">缴费账户：</span>
              <span class="value">{{ formatValue(billInfo.payAccount, payAccountDefaultLabel) }}</span>
            </div>
            <div class="info-item">
              <span class="label">开票状态：</span>
              <span class="value">
                <el-tag :type="getInvoiceStatusType(billInfo.status)" size="small">
                  {{ getInvoiceStatusLabel(billInfo.status) }}
                </el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="label">缴费时间：</span>
              <span class="value">{{ formatValue(billInfo.payTime) }}</span>
            </div>
          </div>
          <!-- 水费账单新增用水量字段 -->
          <div class="info-row" v-if="isWaterBill">
            <div class="info-item">
              <span class="label">用水量(m³)：</span>
              <span class="value">{{ formatNumber(billInfo.consumption) }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间：</span>
              <span class="value">{{ formatValue(billInfo.createTime) }}</span>
            </div>
            <div class="info-item"></div>
          </div>
          <div class="info-row" v-else>
            <div class="info-item">
              <span class="label">创建时间：</span>
              <span class="value">{{ formatValue(billInfo.createTime) }}</span>
            </div>
            <div class="info-item"></div>
            <div class="info-item"></div>
          </div>
          <div class="info-row">
            <div class="info-item full-width">
              <span class="label">备注：</span>
              <span class="value">{{ formatValue(billInfo.remark) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 手动扣款和分摊账单只显示租户信息 -->
      <template v-if="isSimpleBill">
        <el-empty description="此类型账单无明细数据" />
      </template>

      <!-- 水费明细 -->
      <template v-if="isWaterBill">
        <!-- 用水明细（原专用水表明细） -->
        <div v-if="waterPrivateList && waterPrivateList.length > 0" class="detail-section">
          <div class="section-header">
            <div class="section-title">
              <span>用水明细</span>
            </div>
          </div>
          <el-table :data="waterPrivateList" border stripe max-height="300" class="detail-table">
            <el-table-column prop="occurDate" label="账单日期" width="120" align="center" />
            <el-table-column prop="waterId" label="水表编号" width="150" align="center" />
            <el-table-column prop="waterName" label="水表名称" min-width="150" />
            <el-table-column label="用水量(m³)" width="150" align="right">
              <template slot-scope="scope">
                <div class="value-with-action">
                  <span>{{ formatNumber(scope.row.consumption) }}</span>
                  <el-button type="text" size="mini" class="inline-view-btn" @click="handleViewDetail(scope.row)">
                    查看
                  </el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="账单金额(元)" width="120" align="right">
              <template slot-scope="scope">
                <span class="amount-text">{{ formatMoney(scope.row.balance) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 公摊组水表明细（隐藏标题） -->
        <div v-if="waterShareList && waterShareList.length > 0" class="detail-section share-section">
          <el-table :data="waterShareList" border stripe max-height="300" class="detail-table">
            <el-table-column prop="occurDate" label="账单日期" width="120" align="center" />
            <el-table-column prop="shareId" label="公摊组编号" width="150" align="center" />
            <el-table-column prop="shareName" label="公摊组名称" min-width="150" />
            <el-table-column prop="shareConsumption" label="用水量(吨)" width="120" align="right">
              <template slot-scope="scope">
                {{ formatNumber(scope.row.shareConsumption) }}
              </template>
            </el-table-column>
            <el-table-column label="分摊费用(元)" width="120" align="right">
              <template slot-scope="scope">
                <span class="amount-text">{{ formatMoney(scope.row.shareBalance) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>

      <!-- 电费明细 -->
      <template v-if="isElectricBill && !isFloatBill">
        <!-- 室内用电明细 -->
        <div v-if="electricPrivateList && electricPrivateList.length > 0" class="detail-section">
          <div class="section-header">
            <div class="section-title">
              <span>室内用电明细</span>
            </div>
            <div class="section-subtitle">
              小计：<span class="amount-highlight">{{ formatMoney(electricPrivateSum) }}</span>
            </div>
          </div>
          <el-table :data="electricPrivateList" border stripe max-height="300" class="detail-table">
            <el-table-column prop="serial" label="电表序列号" width="150" align="center" />
            <el-table-column prop="meterName" label="电表名称" min-width="150" />
            <el-table-column label="总电量(度)" width="150" align="right">
              <template slot-scope="scope">
                <div class="value-with-action">
                  <span>{{ formatNumber(scope.row.useElec) }}</span>
                  <el-button type="text" size="mini" class="inline-view-btn" @click="handleViewDetail(scope.row)">
                    查看
                  </el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="账单金额(元)" width="130" align="right">
              <template slot-scope="scope">
                <span class="amount-text">{{ formatMoney(scope.row.balance) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 公摊用电明细（隐藏标题） -->
        <div v-if="electricShareList && electricShareList.length > 0" class="detail-section share-section">
          <el-table :data="electricShareList" border stripe max-height="300" class="detail-table">
            <el-table-column prop="shareId" label="公摊组编号" width="150" align="center" />
            <el-table-column label="公摊组名称" min-width="150">
              <template slot-scope="scope">
                <span>{{ scope.row.shareName }}</span>
                <el-tag v-if="scope.row.shareType" size="mini"
                  :type="scope.row.shareType === 'ENERGY' ? 'success' : ''" style="margin-left: 5px;">
                  {{ getShareTypeLabel(scope.row.shareType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="公摊组用电量(度)" width="140" align="right">
              <template slot-scope="scope">
                {{ formatNumber(scope.row.totalUseElec) }}
              </template>
            </el-table-column>
            <el-table-column
              v-if="isNanduPlazaManager"
              label="公摊组系统用电量(度)"
              width="160"
              align="right"
            >
              <template slot-scope="scope">
                {{ formatNumber(scope.row.totalSysElec) }}
              </template>
            </el-table-column>
            <el-table-column label="分摊比例" width="100" align="center">
              <template slot-scope="scope">
                {{ calculateRatio(scope.row.shareArea, scope.row.totalArea) }}
              </template>
            </el-table-column>
            <el-table-column label="分摊电量(度)" width="120" align="right">
              <template slot-scope="scope">
                {{ formatNumber(scope.row.shareUseElec) }}
              </template>
            </el-table-column>
            <el-table-column
              v-if="isNanduPlazaManager"
              label="系统分摊电量(度)"
              width="150"
              align="right"
            >
              <template slot-scope="scope">
                {{ formatNumber(scope.row.shareSysElec) }}
              </template>
            </el-table-column>
            <el-table-column label="账单金额(元)" width="130" align="right">
              <template slot-scope="scope">
                <span class="amount-text">{{ formatMoney(scope.row.shareBalance || scope.row.shareServiceBalance)
                }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 空调用电明细 -->
        <div v-if="airPrivateList && airPrivateList.length > 0" class="detail-section">
          <div class="section-header">
            <div class="section-title">
              <span>空调用电明细</span>
            </div>
            <div class="section-subtitle">
              小计：<span class="amount-highlight">{{ formatMoney(airPrivateSum) }}</span>
            </div>
          </div>
          <el-table :data="airPrivateList" border stripe max-height="300" class="detail-table">
            <el-table-column prop="indoorUnitId" label="序列号" width="150" align="center" />
            <el-table-column prop="airName" label="空调名称" min-width="150" />
            <el-table-column label="总电量(度)" width="150" align="right">
              <template slot-scope="scope">
                <div class="value-with-action">
                  <span>{{ formatNumber(scope.row.useElec) }}</span>
                  <el-button type="text" size="mini" class="inline-view-btn" @click="handleViewDetail(scope.row)">
                    查看
                  </el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              v-if="isNanduPlazaManager"
              label="系统总电量(度)"
              width="150"
              align="right"
            >
              <template slot-scope="scope">
                <div class="value-with-action">
                  <span>{{ formatNumber(scope.row.sysElec) }}</span>
                  <el-button type="text" size="mini" class="inline-view-btn" @click="handleViewDetail(scope.row)">
                    查看
                  </el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="账单金额(元)" width="130" align="right">
              <template slot-scope="scope">
                <span class="amount-text">{{ formatMoney(scope.row.balance) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 空调公摊明细（隐藏标题） -->
        <div v-if="airShareList && airShareList.length > 0" class="detail-section share-section">
          <el-table :data="airShareList" border stripe max-height="300" class="detail-table">
            <el-table-column prop="shareId" label="公摊组编号" width="150" align="center" />
            <el-table-column prop="shareName" label="公摊组名称" min-width="150" />
            <el-table-column label="公摊组用电量(度)" width="140" align="right">
              <template slot-scope="scope">
                {{ formatNumber(scope.row.totalUseElec) }}
              </template>
            </el-table-column>
            <el-table-column
              v-if="isNanduPlazaManager"
              label="系统公摊组用电量(度)"
              width="160"
              align="right"
            >
              <template slot-scope="scope">
                {{ formatNumber(scope.row.totalSysElec) }}
              </template>
            </el-table-column>
            <el-table-column label="分摊比例" width="100" align="center">
              <template slot-scope="scope">
                {{ calculateRatio(scope.row.shareArea, scope.row.totalArea) }}
              </template>
            </el-table-column>
            <el-table-column label="分摊电量(度)" width="120" align="right">
              <template slot-scope="scope">
                {{ formatNumber(scope.row.shareUseElec) }}
              </template>
            </el-table-column>
            <el-table-column
              v-if="isNanduPlazaManager"
              label="系统分摊电量(度)"
              width="150"
              align="right"
            >
              <template slot-scope="scope">
                {{ formatNumber(scope.row.shareSysElec) }}
              </template>
            </el-table-column>
            <el-table-column label="账单金额(元)" width="130" align="right">
              <template slot-scope="scope">
                <span class="amount-text">{{ formatMoney(scope.row.shareBalance) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>

      <!-- 浮动电价明细 -->
      <template v-if="isFloatBill">
        <div class="detail-section">
          <div class="section-header">
            <div class="section-title">
              <i class="el-icon-data-line"></i>
              <span>浮动电价明细</span>
            </div>
          </div>

          <div v-show="floatDto.floatType == 'PART'" class="drawer-table">
            <el-table
              v-if="floatList && floatList.length"
              ref="table"
              v-loading="loading"
              :span-method="arraySpanMethod"
              :data="floatList"
              highlight-current-row
              border stripe max-height="400"
              class="detail-table"
            >
              <el-table-column label="租户名" width="180">
                <template slot-scope="scope">
                  {{ scope.row.tenantName }}
                </template>
              </el-table-column>
              <el-table-column label="记录Id">
                <template slot-scope="scope">
                  {{ scope.row.rid }}
                </template>
              </el-table-column>
              <el-table-column
                label="类型"
                width="100"
              >
                <template slot-scope="scope">
                  <div
                    v-if="scope.row.bindType == MeterBindType[0].value"
                    class="table-url"
                  >
                    专用表
                  </div>
                  <div
                    v-else-if="scope.row.bindType == MeterBindType[1].value"
                    class="table-url"
                  >
                    公摊组
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                label="电表Id/公摊组Id"
                width="130"
              >
                <template slot-scope="scope">
                  {{ scope.row.partId }}
                </template>
              </el-table-column>
              <el-table-column
                label="电表名/公摊组名"
                width="130"
              >
                <template slot-scope="scope">
                  {{ scope.row.partName }}
                </template>
              </el-table-column>
              <el-table-column label="电量（尖/峰/平/谷）" width="200">
                <template slot-scope="scope">
                  {{ scope.row.useElecPeak }}/ {{ scope.row.useElecTop }}/
                  {{ scope.row.useElecFlat }}/
                  {{ scope.row.useElecValley }}
                </template>
              </el-table-column>
              <el-table-column label="电价浮动（尖/峰/平/谷）" width="200">
                <template slot-scope="scope">
                  {{ scope.row.powerPeakPrice }}/ {{ scope.row.powerTopPrice }}/
                  {{ scope.row.powerFlatPrice }}/
                  {{ scope.row.powerValleyPrice }}
                </template>
              </el-table-column>
              <el-table-column label="已结金额" width="120">
                <template slot-scope="scope">
                  ￥{{ formatMoney(scope.row.alreadyBalance) }}
                </template>
              </el-table-column>
              <el-table-column label="目标金额" width="120">
                <template slot-scope="scope">
                  ￥{{ formatMoney(scope.row.afterBalance) }}
                </template>
              </el-table-column>
              <el-table-column label="浮动金额" width="110">
                <template slot-scope="scope">
                  ￥{{ formatMoney(scope.row.floatBalance) }}
                </template>
              </el-table-column>
              <el-table-column label="合计" width="120">
                <template slot-scope="scope">
                  ￥{{ formatMoney(floatDto[scope.row.tenantId]) }}
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无数据" />
          </div>

          <div v-show="floatDto.floatType != 'PART'" class="drawer-table">
            <el-table
              v-if="floatList && floatList.length"
              v-loading="loading"
              :data="floatList"
              highlight-current-row
              border stripe max-height="400"
              class="detail-table"
            >
              <el-table-column label="租户名">
                <template slot-scope="scope">
                  {{ scope.row.tenantName }}
                </template>
              </el-table-column>
              <el-table-column label="记录Id">
                <template slot-scope="scope">
                  {{ scope.row.rid }}
                </template>
              </el-table-column>
              <el-table-column label="电量（尖/峰/平/谷）" width="200">
                <template slot-scope="scope">
                  {{ scope.row.useElecPeak }}/ {{ scope.row.useElecTop }}/
                  {{ scope.row.useElecFlat }}/
                  {{ scope.row.useElecValley }}
                </template>
              </el-table-column>
              <el-table-column label="电价浮动（尖/峰/平/谷）" width="200">
                <template slot-scope="scope">
                  {{ floatDto.powerPeakPrice }}/ {{ floatDto.powerTopPrice }}/
                  {{ floatDto.powerFlatPrice }}/
                  {{ floatDto.powerValleyPrice }}
                </template>
              </el-table-column>
              <el-table-column label="已结金额">
                <template slot-scope="scope">
                  ￥{{ formatMoney(scope.row.alreadyBalance) }}
                </template>
              </el-table-column>
              <el-table-column label="目标金额">
                <template slot-scope="scope">
                  ￥{{ formatMoney(scope.row.afterBalance) }}
                </template>
              </el-table-column>
              <el-table-column label="浮动金额">
                <template slot-scope="scope">
                  ￥{{ formatMoney(scope.row.floatBalance) }}
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无数据" />
          </div>
        </div>
      </template>
    </div>
  </el-drawer>
</template>

<script>
import {
  settleGetTenantDailyBill,
  settleListTenantPrivateSettleDetail,
  listTenantPublicSettleDetail,
  settleListTenantSettleDetail,
  settleListTenantAirPrivateSettleDetail,
  settleListTenantAirPublicSettleDetail,
  waterGetTenantWaterSettleDetail,
  floatQueryFloatDetail
} from '@/api/billDetailApi'
import { mapGetters } from 'vuex'

export default {
  name: 'BillDetailDrawer',
  props: {
    detailDrawer: {
      type: Object,
      default () {
        return {
          show: false,
          id: '',
          tenantId: '',
          settleWay: '',
          useType: '',
          floatId: ''
        }
      }
    }
  },
  data () {
    return {
      loading: false,
      billInfo: {},

      // 水费相关
      waterPrivateList: [],
      waterShareList: [],

      // 电费相关
      electricPrivateList: [],
      electricShareList: [],
      electricPrivateSum: 0,

      // 空调相关
      airPrivateList: [],
      airShareList: [],
      airPrivateSum: 0,

      // 浮动电价相关
      floatList: [],
      floatDto: {},
      floatType: '',
      formatting: {},

      MeterBindType: [
        { value: 1, label: '专用表' },
        { value: 2, label: '公摊组' }
      ],
      // 公摊方式选项
      shareTypeOptions: [
        { label: '面积占比', value: 'AREA' },
        { label: '能耗占比', value: 'ENERGY' }
      ]
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId', 'isAirSysElecManager']),
    /** 系统电量扩展列（由 getAirSysElecCoefKeys 白名单决定，如南都广场） */
    isNanduPlazaManager () {
      return this.isAirSysElecManager(this.currentManagerId)
    },
    // 是否是简单账单（手动扣款1、分摊结算4、租户充值10）
    isSimpleBill () {
      const settleWay = this.detailDrawer.settleWay
      return settleWay == 1 || settleWay == 4 || settleWay == 10
    },
    // 是否是水费账单
    isWaterBill () {
      return this.detailDrawer.useType == 0 && !this.isSimpleBill
    },
    // 是否是电费账单
    isElectricBill () {
      return this.detailDrawer.useType == 2 && !this.isSimpleBill
    },
    // 是否是浮动电价
    isFloatBill () {
      return this.detailDrawer.settleWay == 3
    },
    payAccountDefaultLabel () {
      const useType = (this.billInfo.useType === null || this.billInfo.useType === undefined)
        ? this.detailDrawer.useType
        : this.billInfo.useType
      if (String(useType) === '0') return '水费专户'
      if (String(useType) === '2') return '电费专户'
      return '--'
    }
  },
  methods: {
    handleClose () {
      this.detailDrawer.show = false
      this.resetData()
    },

    handleOpen () {
      console.log('打开详情抽屉，参数：', this.detailDrawer)
      this.loadBillDetail()
    },
    // 获取公摊方式标签
    getShareTypeLabel (type) {
      const item = this.shareTypeOptions.find((i) => i.value === type)
      return item ? item.label : '--'
    },

    resetData () {
      this.billInfo = {}
      this.waterPrivateList = []
      this.waterShareList = []
      this.electricPrivateList = []
      this.electricShareList = []
      this.electricPrivateSum = 0
      this.airPrivateList = []
      this.airShareList = []
      this.airPrivateSum = 0
      this.floatList = []
      this.floatDto = {}
      this.floatType = ''
      this.formatting = {}
    },

    async loadBillDetail () {
      this.loading = true
      try {
        await this.getBillInfo()

        if (this.isSimpleBill) {
          return
        }

        if (this.isWaterBill) {
          await this.getWaterDetail()
        } else if (this.isFloatBill) {
          await this.getFloatDetail()
        } else if (this.isElectricBill) {
          if (this.detailDrawer.useType == 7) {
            await this.getServiceDetail()
          } else {
            await this.getElectricDetail()
            await this.getAirDetail()
          }
        }
      } catch (error) {
        console.error('加载账单详情失败:', error)
        this.$message.error('加载账单详情失败')
      } finally {
        this.loading = false
      }
    },

    async getBillInfo () {
      console.log('调用 getBillInfo，参数：', { settleTenantId: this.detailDrawer.id })
      const { data } = await settleGetTenantDailyBill({
        settleTenantId: this.detailDrawer.id
      })
      console.log('getBillInfo 返回数据：', data)
      this.billInfo = data || {}
    },

    async getWaterDetail () {
      const { data } = await waterGetTenantWaterSettleDetail({
        settleTenantId: this.detailDrawer.id
      })
      this.waterPrivateList = data.privateSettleList || []
      this.waterShareList = data.shareSettleList || []
    },

    async getElectricDetail () {
      const { data: privateData } = await settleListTenantPrivateSettleDetail({
        settleTenantId: this.detailDrawer.id
      })
      this.electricPrivateList = privateData || []
      this.electricPrivateSum = this.electricPrivateList.reduce((sum, item) => sum + (parseFloat(item.balance) || 0), 0)

      const { data: shareData } = await listTenantPublicSettleDetail({
        settleTenantId: this.detailDrawer.id
      })
      this.electricShareList = shareData || []
    },

    async getServiceDetail () {
      const { data } = await settleListTenantSettleDetail({
        settleTenantId: this.detailDrawer.id
      })
      this.electricPrivateList = data.privateSettleList || []
      this.electricShareList = data.publicSettleList || []
      this.electricPrivateSum = this.electricPrivateList.reduce((sum, item) => sum + (parseFloat(item.balance) || 0), 0)
      this.electricPrivateSum += this.electricShareList.reduce((sum, item) => sum + (parseFloat(item.shareServiceBalance) || 0), 0)
    },

    async getAirDetail () {
      const { data: privateData } = await settleListTenantAirPrivateSettleDetail({
        settleTenantId: this.detailDrawer.id
      })
      this.airPrivateList = privateData || []
      this.airPrivateSum = this.airPrivateList.reduce((sum, item) => sum + (parseFloat(item.balance) || 0), 0)

      const { data: shareData } = await settleListTenantAirPublicSettleDetail({
        settleTenantId: this.detailDrawer.id
      })
      this.airShareList = shareData || []
      this.airPrivateSum += this.airShareList.reduce((sum, item) => sum + (parseFloat(item.shareBalance) || 0), 0)
    },

    async getFloatDetail () {
      const { data } = await floatQueryFloatDetail({
        rid: this.detailDrawer.floatId
      })

      this.floatDto = data.floatDto || {}
      this.floatType = this.floatDto.floatType

      const floatContentDtoList = data.floatContentDtoList || []

      const filterData = floatContentDtoList.filter(item =>
        item.tenantId == this.detailDrawer.tenantId
      )

      // 计算合计金额
      const totalAmount = filterData.reduce((sum, item) => {
        return sum + (parseFloat(item.floatBalance) || 0)
      }, 0)
      this.$set(this.floatDto, this.detailDrawer.tenantId, totalAmount)

      filterData.forEach(item => {
        if (this.formatting[item.tenantId]) {
          this.formatting[item.tenantId]++
          item.showTenantId = false
        } else {
          this.formatting[item.tenantId] = 1
          item.showTenantId = true
        }
      })

      this.floatList = filterData
    },

    arraySpanMethod ({ row, column, rowIndex, columnIndex }) {
      if ((columnIndex === 0 || columnIndex === 10) && this.floatType === 'PART') {
        if (row.showTenantId) {
          return {
            rowspan: this.formatting[row.tenantId],
            colspan: 1
          }
        } else {
          return {
            rowspan: 0,
            colspan: 0
          }
        }
      }
    },

    handleViewDetail (row) {
      if (this.isWaterBill) {
        this.handleViewWaterReport(row)
      } else if (this.isElectricBill && !this.isFloatBill) {
        if (row.serial || row.meterName) {
          this.handleViewElectricReport(row)
        } else if (row.indoorUnitId || row.airName) {
          this.handleViewAirReport(row)
        }
      }
    },

    handleViewElectricReport (row) {
      this.$router.push({
        path: '/energy/equipmentPower',
        query: {
          tenantId: this.detailDrawer.tenantId,
          serial: row.serial || '',
          startDate: this.billInfo.occurDate,
          endDate: this.billInfo.occurDate
        }
      })
    },

    handleViewAirReport (row) {
      this.$router.push({
        path: '/energy/charging-sankey',
        query: {
          tenantId: this.detailDrawer.tenantId,
          airId: row.airId || '',
          startDate: this.billInfo.occurDate,
          endDate: this.billInfo.occurDate
        }
      })
    },

    handleViewWaterReport (row) {
      this.$router.push({
        path: '/energy/charging-water',
        query: {
          waterId: row.waterId || '',
          startDate: this.billInfo.occurDate,
          endDate: this.billInfo.occurDate
        }
      })
    },

    formatValue (value, defaultValue = '--') {
      if (value === null || value === undefined || value === '') {
        return defaultValue
      }
      return value
    },

    formatMoney (amount) {
      if (!amount || amount === 0) return '0.00'
      return parseFloat(amount).toFixed(2)
    },

    formatNumber (num) {
      if (!num || num === 0) return '0'
      return parseFloat(num).toFixed(2)
    },

    calculateRatio (shareArea, totalArea) {
      if (!totalArea || totalArea === 0 || !shareArea) return '0%'
      const ratio = (shareArea / totalArea) * 100
      return ratio.toFixed(2) + '%'
    },

    getBillTypeLabel (type) {
      const labelMap = {
        0: '水费',
        2: '电费',
        7: '服务费'
      }
      return labelMap[String(type)] || '其他'
    },

    getSettleWayLabel (way) {
      const labelMap = {
        0: '普通结算',
        1: '手动扣款',
        2: '系统补单',
        3: '浮动电价',
        4: '分摊结算',
        5: '设备扣款',
        10: '租户充值'
      }
      return labelMap[way] || '--'
    },

    getSettleWayType (way) {
      const typeMap = {
        0: 'primary',
        1: 'success',
        2: 'warning',
        3: 'danger',
        4: 'info',
        5: 'info',
        10: 'success'
      }
      return typeMap[way] || ''
    },

    getInvoiceStatusLabel (status) {
      const labelMap = {
        0: '未开票',
        1: '审核中',
        2: '已开票',
        3: '已拒绝'
      }
      return labelMap[status] || '--'
    },

    getInvoiceStatusType (status) {
      const typeMap = {
        0: 'info',
        1: 'warning',
        2: 'success',
        3: 'danger'
      }
      return typeMap[status] || ''
    }
  }
}
</script>

<style lang="scss" scoped>
.bill-detail-drawer {
  ::v-deep .el-drawer__header {
    margin-bottom: 20px;
    padding: 20px;
    border-bottom: 1px solid #e8e8e8;
  }

  .drawer-title-slot {
    font-size: 16px;
    font-weight: 600;
    color: #1f2329;
  }

  .drawer_content {
    padding: 0 20px 20px;
    height: calc(100% - 70px);
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #dcdfe6;
      border-radius: 3px;

      &:hover {
        background-color: #c0c4cc;
      }
    }
  }

  .detail-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    &.share-section {
      margin-top: 30px;
      margin-bottom: 24px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f0f2f5;

      .section-title {
        display: flex;
        align-items: center;
        font-size: 15px;
        font-weight: 600;
        color: #1f2329;

        i {
          margin-right: 8px;
          font-size: 18px;
          color: #409eff;
        }
      }

      .section-subtitle {
        font-size: 14px;
        color: #606266;

        .amount-highlight {
          color: #f56c6c;
          font-weight: 600;
          font-size: 16px;
        }
      }
    }
  }

  .info-grid {
    .info-row {
      display: flex;
      gap: 20px;
      margin-bottom: 10px;

      &:last-child {
        margin-bottom: 0;
      }

      .info-item {
        flex: 1;
        display: flex;
        padding: 6px 0;
        min-width: 0;

        &.full-width {
          flex: none;
          width: 100%;
        }

        .label {
          flex-shrink: 0;
          color: #606266;
          font-size: 14px;
          white-space: nowrap;
          margin-right: 4px;
        }

        .value {
          flex: 1;
          color: #1f2329;
          font-size: 14px;
          word-break: break-all;

          &.primary {
            color: #409eff;
            font-weight: 500;
          }

          &.amount-highlight {
            color: #f56c6c;
            font-weight: 600;
            font-size: 15px;
          }

          .status-dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            margin-right: 6px;
          }
        }
      }
    }
  }

  .detail-table {
    ::v-deep .el-table__header {
      th {
        background-color: #f5f7fa;
        color: #1f2329;
        font-weight: 600;
      }
    }

    .amount-text {
      color: #f56c6c;
      font-weight: 500;
    }

    // 数值与操作按钮组合样式
    .value-with-action {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;

      .inline-view-btn {
        padding: 0;
        font-size: 16px;
        color: #409eff;
        transition: all 0.2s;

        &:hover {
          color: #66b1ff;
          transform: scale(1.15);
        }

        ::v-deep i {
          font-size: 16px;
        }
      }
    }
  }
}
</style>
