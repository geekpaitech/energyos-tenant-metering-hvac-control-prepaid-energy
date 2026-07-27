<template>
  <div v-loading="loading" style="margin-top:20px" class="class-newTable">
    <!-- 总览 -->
    <el-table
      v-if="tableData.length"
      ref="table"
      :data="tableData"
      height="40vh"
      border
    >
      <el-table-column fixed="left" prop="occurTime" label="时间" width="160" />
      <el-table-column prop="meterId" label="电表ID" />
      <el-table-column prop="serial" label="序列号" width="140" />
      <el-table-column width="140" label="电表名称">
        <template slot-scope="scope">
          {{ scope.row.metername || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="addr" label="通讯地址" />
      <el-table-column prop="remote" width="160" label="网络地址" />
      <el-table-column prop="allowCount" label="允许此时" />
      <el-table-column prop="chargeCount" label="购电次数" />
      <el-table-column label="费控开关">
        <template slot-scope="scope">
          <div
            v-if="MeterSwitchStatusRead[scope.row.feeSwitch]"
            :class="MeterSwitchStatusRead[scope.row.feeSwitch].class"
          >
            {{ MeterSwitchStatusRead[scope.row.feeSwitch].label }}
          </div>
          <div v-else>
            -
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="loadControlCount" label="负控次数" />
      <el-table-column label="付费方式">
        <template slot-scope="scope">
          {{
            MeterPayType[scope.row.payType]
              ? MeterPayType[scope.row.payType].label
              : "-"
          }}
        </template>
      </el-table-column>
      <el-table-column prop="msgId" width="100" label="消息内的id" />
      <el-table-column prop="meterSerial" label="回路编号" />
      <el-table-column label="合闸状态">
        <template slot-scope="scope">
          <div
            v-if="MeterSwitchStatusRead[scope.row.switchStatus]"
            :class="MeterSwitchStatusRead[scope.row.switchStatus].class"
          >
            {{ MeterSwitchStatusRead[scope.row.switchStatus].label }}
          </div>
          <div v-else>
            -
          </div>
        </template>
      </el-table-column>
      <el-table-column label="变比" align="center">
        <el-table-column prop="pt" label="电压PT" width="80" />
        <el-table-column prop="ct" label="电流CT" width="80" />
      </el-table-column>
      <el-table-column label="余额(元)" width="120">
        <template slot-scope="scope">
          <span v-money="scope.row.balance" />
        </template>
      </el-table-column>
      <el-table-column label="电量(kWh)" align="center">
        <el-table-column label="总" width="80">
          <template slot-scope="scope">
            {{ scope.row.powerAll }}
          </template>
        </el-table-column>
        <el-table-column label="尖" width="80">
          <template slot-scope="scope">
            {{ scope.row.powerPeak }}
          </template>
        </el-table-column>
        <el-table-column label="峰" width="80">
          <template slot-scope="scope">
            {{ scope.row.powerTop }}
          </template>
        </el-table-column>
        <el-table-column label="平" width="80">
          <template slot-scope="scope">
            {{ scope.row.powerFlat }}
          </template>
        </el-table-column>
        <el-table-column label="谷" width="80">
          <template slot-scope="scope">
            {{ scope.row.powerValley }}
          </template>
        </el-table-column>
      </el-table-column>
      <el-table-column label="电压" align="center">
        <el-table-column prop="ua" label="Ua" width="65" />
        <el-table-column prop="ub" label="Ub" width="65" />
        <el-table-column prop="uc" label="Uc" width="65" />
      </el-table-column>
      <el-table-column label="电流" align="center">
        <el-table-column prop="ia" label="Ia" width="65" />
        <el-table-column prop="ib" label="Ib" width="65" />
        <el-table-column prop="ic" label="Ic" width="65" />
      </el-table-column>
      <el-table-column label="功率因数PF" align="center">
        <el-table-column prop="pf" label="PF总" width="65" />
        <el-table-column prop="pfa" label="PFa" width="65" />
        <el-table-column prop="pfb" label="PFb" width="65" />
        <el-table-column prop="pfc" label="PFc" width="65" />
      </el-table-column>
      <el-table-column label="功率P" align="center">
        <el-table-column prop="p" label="P总" width="65" />
        <el-table-column prop="pa" label="Pa" width="65" />
        <el-table-column prop="pb" label="Pb" width="65" />
        <el-table-column prop="pc" label="Pc" width="65" />
      </el-table-column>
      <el-table-column label="无功功率Q" align="center">
        <el-table-column prop="q" label="Q总" width="65" />
        <el-table-column prop="qa" label="Qa" width="65" />
        <el-table-column prop="qb" label="Qb" width="65" />
        <el-table-column prop="qc" label="Qc" width="65" />
      </el-table-column>
    </el-table>
    <el-empty v-else description="暂无数据" />
  </div>
</template>

<script>
import { MeterPayType, MeterSwitchStatusRead } from '../monitorEnums'
export default {
  computed: {
    loading () { return false }
  },
  props: {
    tableData: {
      type: Array,
      default () {
        return []
      }
    }
  },
  data () {
    return {
      MeterPayType,
      MeterSwitchStatusRead
    }
  },
  methods: {
    // 导出
    btnExport () {
      const ele = this.$refs.table.$el
      var fix = document.querySelector('.el-table__fixed')

      const params = {
        ele,
        name: '电力数据.xlsx',
        data: this.tableData,
        fix
      }

      this.$store.dispatch('export/export', params)
    }
  }
}
</script>

<style lang="scss" scoped>
.title{
  width: 100%;
  border-left: 4px solid var(--fun-1);
  height: 20px;
  padding-left: 10px;
  font-size: 16px;
  line-height: 20px;
  margin-bottom: 20px;
}</style>
