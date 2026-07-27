<template>
  <el-dialog
    title="批量获取"
    :visible.sync="batchDialog.show"
    width="450px"
    append-to-body
    :close-on-click-modal="false"
    @open="initDialog"
    @close="closeDialog"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="获取项目" prop="managerId">
        <el-select v-model="form.managerId" filterable clearable placeholder="请选择" style="width: 100%" @change="changeManager">
          <el-option v-for="item in managerOptions" :key="item.id" :label="item.unite" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.managerId" label="选择网关">
        <el-select v-model="form.gatewayId" filterable clearable placeholder="请选择" style="width: 100%">
          <el-option v-for="item in gatewayList" :key="item.id" :label="item.unite" :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>

    <span slot="footer">
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" :loading="loading" @click="onSubmit">确认</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { adminManagerGetManagerListByUser, airInfoBatchBindAirInfo, airGatewayListAirGateWay } from '@/api/adminapi'

export default {
  props: {
    batchDialog: {
      type: Object,
      default: () => ({ show: false, data: {} })
    }
  },
  data () {
    return {
      loading: false,
      form: {
        managerId: '',
        gatewayId: ''
      },
      managerOptions: [],
      gatewayList: [],
      rules: {
        managerId: [{ required: true, message: '请选择项目', trigger: 'change' }]
      }
    }
  },
  methods: {
    async loadManagerOptions () {
      const res = await adminManagerGetManagerListByUser()
      const list = Array.isArray(res.data) ? res.data : []
      this.managerOptions = list.map(item => {
        const id = item.managerId || item.id
        const name = item.managerName || item.name
        return { ...item, id, unite: `(${id})${name}` }
      })
    },
    async changeManager (val) {
      this.form.gatewayId = ''
      if (!val) {
        this.gatewayList = []
        return
      }
      const res = await airGatewayListAirGateWay({ managerId: val })
      const list = Array.isArray(res.data) ? res.data : []
      this.gatewayList = list.map(item => ({ ...item, unite: `(${item.id})${item.name}` }))
      if (this.gatewayList.length === 0) this.$message.warning('项目下暂无网关')
    },
    async onSubmit () {
      this.$refs.formRef.validate(async valid => {
        if (!valid) return
        const ok = await this.$confirm('确认获取?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).catch(() => false)
        if (!ok) return
        this.loading = true
        try {
          // 与老项目保持一致：airInfoBatchBindAirInfo 返回结构的 data.data 为台数
          const { data: { data: count } = { data: 0 } } = await airInfoBatchBindAirInfo({ gatewayId: this.form.gatewayId })
          this.$alert(`本次成功获取空调设备${count}台，请及时补充空调计费方式参数!`, '操作成功', {
            confirmButtonText: '确定',
            callback: () => {
              this.$emit('search')
              this.closeDialog()
            }
          })
        } finally {
          this.loading = false
        }
      })
    },
    async initDialog () {
      await this.loadManagerOptions()
    },
    closeDialog () {
      this.form.managerId = ''
      this.form.gatewayId = ''
      this.gatewayList = []
      this.batchDialog.show = false
    }
  }
}
</script>
