<template>
  <div>
    <MeterDetail ref="MeterDetail" :serial="queryData.serial" />
    <div class="detail ebc-container" style="margin-top:20px">
      <div class="title">
        <span>监测曲线</span>
      </div>
      <div class="class-form">
        <el-form>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="时间">
                <el-date-picker
                  v-model="queryData.timeRange"
                  class="anjineng-input el-dark class-select"
                  type="datetimerange"
                  value-format="yyyy-MM-dd HH:mm:ss"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  :picker-options="pickerOptions"
                />
              </el-form-item>
            </el-col>
            <el-col :span="10">
              <el-form-item label="电力数据">
                <el-select
                  v-model="queryData.elecSelect"
                  clearable
                  multiple
                  collapse-tags
                  placeholder="请选择"
                  class="class-select"
                  @change="changeElec"
                >
                  <el-option
                    v-for="item in elecRead"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <div class="form-search">
                <el-button type="primary" icon="el-icon-search" size="small" @click="onSearch">查询</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div>
        <ElectricChart v-if="queryData.elecSelect.length" ref="ElectricChart" />
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import MeterDetail from './MeterDetail.vue'
import ElectricChart from './ElectricChart.vue'
import { getMeterRecordList } from '@/api/subMetering'

export default {
  name: 'Ammeter',
  components: {
    ElectricChart,
    MeterDetail
  },
  props: {
    serial: {
      type: [String, Number],
      default () {
        return ''
      }
    }
  },
  data () {
    return {
      queryData: {
        serial: '',
        elecSelect: ['i'],
        timeRange: [
          moment().format('YYYY-MM-DD') + ' 00:00:00',
          moment().format('YYYY-MM-DD') + ' 23:59:59'
        ]
      },
      elecRead: [
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
      elecData: [],
      pickerRange7: 3600 * 1000 * 24 * 7,
      pickerMinDate: '',
      pickerOptions: {
        onPick: ({ maxDate, minDate }) => {
          if (minDate && this.pickerMinDate) {
            this.pickerMinDate = null
          } else if (minDate) {
            this.pickerMinDate = minDate.getTime()
          }
        },
        disabledDate: (time) => {
          if (this.pickerMinDate) {
            const range = this.pickerRange7
            return (
              time.getTime() > this.pickerMinDate + range ||
              time.getTime() < this.pickerMinDate - range
            )
          }
          return false
        }
      }
    }
  },
  watch: {
    serial: {
      handler: function (val, oldVal) {
        if (val && val !== oldVal) {
          this.queryData.serial = val
          this.onSearch()
        }
      },
      immediate: true
    }
  },
  created () {
    this.elecLable = {}
    this.elecRead.forEach(item => {
      this.elecLable[item.value] = item.label
    })
  },
  methods: {
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
      this.getElecData()
    },
    async getElecData () {
      try {
        const query = {
          endTime: this.queryData.timeRange ? this.queryData.timeRange[1] : '',
          startTime: this.queryData.timeRange ? this.queryData.timeRange[0] : '',
          serial: this.queryData.serial
        }
        const { data } = await getMeterRecordList(query)
        this.elecData = data || []
        this.setElecData(data || [])
      } catch (error) {
        this.$message.error('获取电力数据失败')
      }
    },
    async setElecData (data) {
      const timeArr = []
      let seriesData = []
      const dataObj = {
        u: [],
        i: [],
        p: [],
        q: [],
        pf: []
      }
      data.forEach(item => {
        timeArr.push(item.occurTime)
        this.queryData.elecSelect.forEach(itm => {
          if (itm === 'u') {
            dataObj[itm].push(((item.ua || 0) + (item.ub || 0) + (item.uc || 0)).toFixed(2))
          } else if (itm === 'i') {
            dataObj[itm].push(((item.ia || 0) + (item.ib || 0) + (item.ic || 0)).toFixed(2))
          } else {
            dataObj[itm].push(item[itm] || 0)
          }
        })
      })

      seriesData = this.queryData.elecSelect.map(item => {
        const itemData = [...dataObj[item]]
        if (this.queryData.timeRange[0] !== timeArr[0]) {
          itemData.unshift('')
        }
        if (this.queryData.timeRange[1] !== timeArr[timeArr.length - 1]) {
          itemData.push('')
        }
        return {
          name: this.elecLable[item],
          data: itemData,
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

      const xAxisData = [...timeArr]
      if (this.queryData.timeRange[0] !== timeArr[0]) {
        xAxisData.unshift(this.queryData.timeRange[0])
      }
      if (this.queryData.timeRange[1] !== timeArr[timeArr.length - 1]) {
        xAxisData.push(this.queryData.timeRange[1])
      }

      if (this.$refs.ElectricChart) {
        this.$refs.ElectricChart.getElectricData(seriesData, xAxisData)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.detail {
  width: 100%;
  padding: 20px;
  .title {
    width: 100%;
    display: flex;
    align-items: center;
    height: 20px;
    line-height: 20px;
    border-left: 5px solid var(--fun-1);
    margin-bottom: 10px;
    span:nth-of-type(1) {
      font-size: 18px;
      margin-left: 10px;
    }
    span:nth-of-type(2) {
      color: var(--font-3);
      margin-left: 10px;
    }
  }
}
</style>
