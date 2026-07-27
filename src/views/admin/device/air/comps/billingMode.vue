<template>
  <el-dialog title="设置计费方式" :visible.sync="billingDialog.show" width="800px" :close-on-click-modal="false" append-to-body @open="initDialog">
    <el-form ref="formRef" :model="form" label-width="90px">
      <div style="margin-bottom: 12px;">项目：({{ billingDialog.data.managerId }}){{ billingDialog.data.managerName }}；本次设置设备共计{{ billingDialog.data.ids.length }}台</div>
      <el-form-item label="计费方式">
        <el-select v-model="form.billingMode" style="width: 100%">
          <el-option v-for="item in airBillingMode" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="盘管系数"><el-input v-model="form.coilCoef" /></el-form-item>
      <el-form-item label="风机耗电"><el-input v-model="form.fanPower" /></el-form-item>
      <el-form-item label="高档系数"><el-input v-model="form.highCoef" /></el-form-item>
      <el-form-item label="中档系数"><el-input v-model="form.medCoef" /></el-form-item>
      <el-form-item label="低档系数"><el-input v-model="form.lowCoef" /></el-form-item>
      <el-form-item label="自动系数"><el-input v-model="form.autoCoef" /></el-form-item>
      <el-form-item label="制冷系数"><el-input v-model="form.coolCoef" /></el-form-item>
      <el-form-item label="制热系数"><el-input v-model="form.heatCoef" /></el-form-item>
      <el-form-item label="除湿系数"><el-input v-model="form.dehumCoef" /></el-form-item>
      <el-form-item label="送风系数"><el-input v-model="form.fanCoef" /></el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="billingDialog.show = false">取消</el-button>
      <el-button type="primary" @click="onSubmit">保存</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { mapState } from 'vuex'
import { airInfoUpdateBillingMode } from '@/api/adminapi'

export default {
  props: { billingDialog: { type: Object, required: true } },
  data () {
    return {
      form: {
        airIds: [],
        managerId: '',
        billingMode: '',
        coilCoef: '',
        coolCoef: '',
        dehumCoef: '',
        fanCoef: '',
        fanPower: '',
        heatCoef: '',
        highCoef: '',
        lowCoef: '',
        medCoef: '',
        autoCoef: ''
      }
    }
  },
  computed: {
    ...mapState({
      airBillingMode: state => state.adminAirEnum.airBillingMode
    })
  },
  methods: {
    initDialog () {
      this.form.airIds = this.billingDialog.data.ids || []
      this.form.managerId = this.billingDialog.data.managerId || ''
    },
    async onSubmit () {
      const res = await airInfoUpdateBillingMode(this.form)
      this.$message.success(res.msg || '保存成功')
      this.billingDialog.show = false
      this.$emit('search')
    }
  }
}
</script>
