<template>
  <div class="admin-meter-monitor-page">
    <div class="page-header">
      <el-button type="text" icon="el-icon-arrow-left" @click="$router.push('/admin/device/meter')">返回电表列表</el-button>
    </div>
    <MeterDetail ref="MeterDetail" />
    <el-card class="query-card" shadow="never">
      <div class="section-label">数据查询</div>
      <el-form label-position="top" class="query-form" @submit.native.prevent>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="序列号">
              <el-input v-model="queryData.serial" clearable placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="10">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="queryData.timeRange"
                type="datetimerange"
                style="width:100%"
                  value-format="yyyy-MM-dd HH:mm:ss"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  :picker-options="pickerOptions"
                  :editable="false"
                />
              </el-form-item>
            </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="电力数据">
              <el-select
                v-model="queryData.elecSelect"
                clearable
                multiple
                collapse-tags
                placeholder="请选择"
                style="width:100%"
                @change="changeElec"
              >
                <el-option v-for="item in elecRead" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="selectType === 1" :xs="24" :sm="12" :md="6">
            <el-form-item label="业务事件">
              <el-select
                v-model="queryData.businessBar"
                clearable
                multiple
                collapse-tags
                placeholder="请选择"
                style="width:100%"
                @change="changBusiness"
              >
                  <el-option
                    v-for="item in businessRead"
                    :key="item.value"
                    :label="`${item.label}${
                      item.isData ? '（' + item.isData + '）' : ''
                    }`"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
        </el-row>
        <div class="query-actions">
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
          <el-button v-if="selectType === 2" icon="el-icon-download" @click="btnExport">导出</el-button>
        </div>
      </el-form>
      <div class="chart-area">
        <ElectricChart v-if="queryData.elecSelect.length" ref="ElectricChart" />
        <div
          v-if="queryData.businessBar.length || queryData.elecSelect.length"
          class="class-tabbar"
        >
          <div
            v-if="queryData.businessBar.length"
            :class="selectType === 1 ? 'class-onbar' : 'class-bar'"
            @click="changeBar(1)"
          >
            业务事件
          </div>
          <div
            v-if="queryData.elecSelect.length"
            :class="selectType === 2 ? 'class-onbar' : 'class-bar'"
            @click="changeBar(2)"
          >
            电力数据
          </div>
        </div>
        <div v-show="selectType === 1" class="class-table">
          <Business
            v-show="queryData.businessBar.length"
            ref="Business"
            :query-data="queryData"
            :business-read="businessRead"
          />
        </div>
        <div v-if="selectType === 2" class="class-table">
          <Electric ref="Electric" :table-data="elecData" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import moment from 'moment'
import Business from './comps/business.vue'
import Electric from './comps/electric.vue'
import MeterDetail from './comps/meterDetail.vue'
import ElectricChart from './comps/electricChart.vue'
import { meterLiveGetMeterRecordList } from '@/api/adminDb'
export default {
  components: {
    ElectricChart,
    Electric,
    Business,
    MeterDetail
  },
  props: {
    workId: {
      type: [String, Number],
      default () {
        return ''
      }
    }
  },
  data () {
    return {
      id: '',
      queryData: {
        serial: '',
        businessBar: [2, 3, 4, 5, 6, 7, 8, 9, 10],
        elecSelect: ['i'],
        timeRange: [
          moment().format('YYYY-MM-DD') + ' 00:00:00',
          moment().format('YYYY-MM-DD') + ' 23:59:59'
        ]
      },
      // 导航
      selectType: 1,
      // 业务事件类型
      businessRead: [
        {
          label: '电表绑定类型修改',
          value: 2,
          isData: false
        },
        {
          label: '电表充值',
          value: 3,
          isData: false
        },
        {
          label: '电表启停',
          value: 4,
          isData: false
        },
        {
          label: '电表付费模式',
          value: 5,
          isData: false
        },
        {
          label: '电表上下线',
          value: 6,
          isData: false
        },
        {
          label: '电表调价',
          value: 7,
          isData: false
        },
        {
          label: '电表结算',
          value: 8,
          isData: false
        },
        {
          label: '电表分合闸',
          value: 9,
          isData: false
        },
        {
          label: '电表绑定',
          value: 10,
          isData: false
        },
        {
          label: '电表解绑',
          value: 11,
          isData: false
        },
        {
          label: '电表创建',
          value: 12,
          isData: false
        },
        {
          label: '电表CT值变更',
          value: 14,
          isData: false
        },
        {
          label: '电表余额大于0',
          value: 15,
          isData: false
        },
        {
          label: 'pt变更报警记录',
          value: 16,
          isData: false
        },
        {
          label: '电价修复',
          value: 17,
          isData: false
        }
      ],
      // 选中数据
      selectBusiness: [],

      // 电力数据
      // 枚举
      elecRead: [
        {
          label: '余额',
          value: 'balance'
        },
        {
          label: '电压变比',
          value: 'pt'
        },
        {
          label: '电流变比',
          value: 'ct'
        },
        {
          label: '累计电量',
          value: 'powerAll'
        },
        {
          label: '电压',
          value: 'u'
        },
        {
          label: '电流',
          value: 'i'
        },
        {
          label: '有功功率',
          value: 'p'
        },
        {
          label: '无功功率',
          value: 'q'
        },
        {
          label: '功率因数',
          value: 'pf'
        }
      ],
      elecLable: {},
      // 数据
      elecData: [],

      // 时间范围
      pickerRange7: 3600 * 1000 * 24 * 7, // 可选择日期范围（7天）
      pickerRange60: 3600 * 1000 * 24 * 62, // 可选择日期范围（30天）
      pickerMinDate: '', // 起始时间
      pickerOptions: {
        onPick: ({ maxDate, minDate }) => {
          if (minDate && this.pickerMinDate) {
            this.pickerMinDate = null // 选完一次重置
          } else if (minDate) {
            this.pickerMinDate = minDate.getTime()
          }
        },
        disabledDate: (time) => {
          const maxRange = this.queryData.elecSelect.length
            ? this.pickerRange7
            : this.pickerRange60
          if (this.pickerMinDate) {
            // 限制从选中起点 ± maxRange 范围
            return (
              time.getTime() > this.pickerMinDate + maxRange ||
              time.getTime() < this.pickerMinDate - maxRange
            )
          }

          // 默认限制为当前日期前后 maxRange 范围（可选）
          return false
        }
      },

      // 监听优化
      watch: {
        data: [],
        serial: ''
      },

      // 优化
      optimize: {
        serial: '',
        timeRange: [
          moment().format('YYYY-MM-DD') + ' 00:00:00',
          moment().format('YYYY-MM-DD') + ' 23:59:59'
        ]
      }
    }
  },
  computed: {},
  watch: {
    workId (id) {
      if (id) {
        // 客服工作台
        this.queryData.serial = id
        this.id = id
        this.optimize = JSON.parse(JSON.stringify(this.queryData))
        this.onSearch()
      }
    }
  },
  created () {
    // 图展示用label
    this.elecLable = {}
    this.elecRead.forEach((item) => {
      this.elecLable[item.value] = item.label
    })

    if (
      this.$route.query.id &&
      !this.workId &&
      this.$route.query.type == 1
    ) {
      // 设备列表
      this.queryData.serial = this.$route.query.id
      this.id = this.$route.query.id
    } else if (this.workId) {
      // 电表监控
      this.queryData.serial = this.workId
      this.id = this.workId
    } else {
      // 菜单进入
      this.id = null
    }
    if (this.queryData.serial) {
      this.changBusiness(this.queryData.businessBar)
    }
  },
  mounted () {
    this.optimize = JSON.parse(JSON.stringify(this.queryData))
    if (this.queryData.serial) {
      this.onSearch()
    }
  },
  methods: {
    // 电力数据筛选
    changeElec (val) {
      if (val.length) {
        this.queryData.timeRange = [
          moment().format('YYYY-MM-DD') + ' 00:00:00',
          moment().format('YYYY-MM-DD') + ' 23:59:59'
        ]
      }
    },
    onSearch () {
      if (!this.queryData.serial) {
        this.$message.warning('请输入序列号')
        return
      }

      if (!this.queryData.timeRange) {
        this.$message.warning('请选择查询时间')
        return
      }

      // 验证日期范围
      if (this.queryData.timeRange && this.queryData.timeRange.length === 2) {
        const startDate = moment(this.queryData.timeRange[0])
        const endDate = moment(this.queryData.timeRange[1])
        const daysDiff = endDate.diff(startDate, 'days')
        const maxDays = this.queryData.elecSelect.length ? 7 : 62
        if (daysDiff > maxDays) {
          this.$message.warning(`日期范围不能超过${this.queryData.elecSelect.length ? 7 : 62}天`)
          this.queryData.timeRange = [
            moment().format('YYYY-MM-DD') + ' 00:00:00',
            moment().format('YYYY-MM-DD') + ' 23:59:59'
          ]
          return
        }
      }

      // 电表详情数据
      this.$refs.MeterDetail.onSearch(this.queryData.serial)

      // 筛选条件都为空
      if (
        !this.queryData.elecSelect.length &&
        !this.queryData.businessBar.length
      ) {
        return
      }

      /* loading */;

      // 有选择但是选中数据为空
      if (this.selectBusiness.length === 0) {
        this.changBusiness(this.queryData.businessBar)
      }

      if (this.selectType === 1 || this.workId) { // 业务事件 || 客服工作台
        this.getElecData(true)
        this.getBusinessData()
      } else if (this.selectType == 2) {
        this.getElecData(true)
      }
    },
    // 修改业务事件
    changBusiness (val) {
      this.selectBusiness = this.businessRead.filter((item) => {
        if (val.indexOf(item.value) != -1) {
          return item
        }
      })
    },
    // 优化运行
    setOptimize () {
      let is = false

      // 判断条件
      if (
        this.optimize.serial == this.queryData.serial &&
        JSON.stringify(this.queryData.timeRange) ==
          JSON.stringify(this.optimize.timeRange)
      ) {
        is = true
      }

      // 判断电力数据有无第一次请求
      if (is && this.selectType == 2 && this.elecData.length == 0) {
        is = false
      }

      return is
    },
    // 切换bar
    changeBar (val) {
      if (!this.queryData.serial) {
        this.$message.warning('请输入序列号')
        return
      }

      if (this.selectType === val) {
        return
      }

      this.selectType = val
      // 判断是否需要重新获取数据
      const is = this.setOptimize()

      if (is) {

      } else if (val === 2) {
        this.getElecData(false)
        this.optimize = JSON.parse(JSON.stringify(this.queryData))
      }
    },
    // 获取业务事件数据
    getBusinessData () {
      console.log(this.queryData.businessBar.length, 'this.queryData.businessBar.length')
      if (this.queryData.businessBar.length) {
        this.$refs.Business.returnData(this.selectBusiness)
      }
    },
    // 获取电力数据
    async getElecData (is) {
      if (!this.queryData.elecSelect.length) {
        return
      }
      /* loading */;
      const qeury = {
        endTime: this.queryData.timeRange ? this.queryData.timeRange[1] : '',
        startTime: this.queryData.timeRange ? this.queryData.timeRange[0] : '',
        serial: this.queryData.serial
      }
      const { data } = await meterLiveGetMeterRecordList(qeury)
      this.elecData = data
      this.$nextTick(() => {
        /* loaded */;
      })

      // 是否重置电力数据图
      if (is) {
        this.setElecData(data)
      }
    },
    // 重置电力数据图
    async setElecData (data) {
      const timeArr = []
      let seriesData = []
      const dataObj = {
        balance: [],
        pt: [],
        ct: [],
        powerAll: [],
        u: [],
        i: [],
        p: [],
        q: [],
        pf: []
      }
      data.forEach((item) => {
        timeArr.push(item.occurTime)
        this.queryData.elecSelect.forEach((itm) => {
          if (itm == 'u') {
            dataObj[itm].push((item.ua + item.ub + item.uc).toFixed(2))
          } else if (itm == 'i') {
            dataObj[itm].push((item.ia + item.ib + item.ic).toFixed(2))
          } else {
            dataObj[itm].push(item[itm])
          }
        })
      })

      seriesData = this.queryData.elecSelect.map((item) => {
        const data = dataObj[item]
        // 统一时间
        if (this.queryData.timeRange[0] !== timeArr[0]) {
          data.unshift('')
        }
        if (this.queryData.timeRange[1] !== timeArr[timeArr.length - 1]) {
          data.push('')
        }
        return {
          name: this.elecLable[item],
          data: data,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: {
            width: 1
          },
          showSymbol: false,
          markPoint: {
            data: [
              { type: 'max', name: '最大值' },
              { type: 'min', name: '最小值' }
            ]
          }
        }
      })

      // 统一时间
      if (this.queryData.timeRange[0] !== timeArr[0]) {
        timeArr.unshift(this.queryData.timeRange[0])
      }
      if (this.queryData.timeRange[1] !== timeArr[timeArr.length - 1]) {
        timeArr.push(this.queryData.timeRange[1])
      }
      this.$refs.ElectricChart.getElectricData(seriesData, timeArr)
    },
    btnExport () {
      this.$refs.Electric.btnExport()
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-meter-monitor-page {
  padding: 16px 20px 24px;
  min-height: calc(100vh - 100px);
  background: #f0f2f5;
}

.page-header {
  margin-bottom: 12px;
}

.query-card {
  border: none;
  border-radius: 8px;
  margin-top: 0;

  ::v-deep .el-card__body {
    padding: 24px;
  }
}

.section-label {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.query-form {
  ::v-deep .el-form-item {
    margin-bottom: 0;
  }
  ::v-deep .el-form-item__label {
    padding-bottom: 6px;
    line-height: 1.4;
    font-size: 13px;
    color: #606266;
  }
}

.query-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.chart-area {
  margin-top: 20px;
}

.class-tabbar {
  display: flex;
  gap: 24px;
  margin: 20px 0 16px;
  padding-bottom: 0;
  border-bottom: 1px solid #ebeef5;

  .class-bar,
  .class-onbar {
    cursor: pointer;
    padding: 0 4px 12px;
    font-size: 14px;
    color: #606266;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color 0.2s;
  }

  .class-onbar {
    color: #409eff;
    font-weight: 600;
    border-bottom-color: #409eff;
  }
}

.class-table {
  min-height: 200px;
}
</style>
