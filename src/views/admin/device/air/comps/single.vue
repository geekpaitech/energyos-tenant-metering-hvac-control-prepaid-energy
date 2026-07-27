<template>
  <el-dialog
    :title="singleDialog.type ? '编辑' : '单个新增'"
    :visible.sync="singleDialog.show"
    width="900px"
    append-to-body
    :close-on-click-modal="false"
    @open="initDialog"
    @close="closeDialog"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <div class="form-grid">
        <el-form-item label="归属项目" prop="managerId">
          <el-select
            v-model="form.managerId"
            filterable
            clearable
            :disabled="singleDialog.type"
            placeholder="请选择"
            style="width: 100%"
            @change="changeManager"
          >
            <el-option v-for="item in managerOptions" :key="item.id" :label="item.unite" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="网关内部ID" prop="indoorUnitId">
          <el-input v-model="form.indoorUnitId" :disabled="singleDialog.type" placeholder="请输入" />
        </el-form-item>

        <el-form-item label="设备名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="设备类型" prop="type">
          <el-select v-model="form.type" clearable placeholder="请选择" style="width: 100%">
            <el-option v-for="item in airDeviceType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="选择网关" prop="gatewayId">
          <el-select
            v-model="form.gatewayId"
            filterable
            clearable
            :disabled="!form.managerId || singleDialog.type"
            placeholder="请选择"
            style="width: 100%"
            @change="changeGateway"
          >
            <el-option v-for="item in gatewayList" :key="item.id" :label="item.unite" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="公摊类型" prop="bindType">
          <el-select v-model="form.bindType" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in airBindType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <div class="full-line" />

        <el-form-item label="计费方式" prop="billingMode">
          <el-select v-model="form.billingMode" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in airBillingMode" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="盘管系数" prop="coilCoef">
          <el-input v-model="form.coilCoef" placeholder="请输入" />
        </el-form-item>

        <el-form-item label="风机耗电" prop="fanPower">
          <el-input v-model="form.fanPower" placeholder="请输入" />
        </el-form-item>
        <div />

        <el-form-item class="full-width" label="风速系数" prop="highCoef">
          <div class="coef-grid">
            <el-input v-model="form.highCoef" placeholder="请输入"><template slot="suffix">高档</template></el-input>
            <el-input v-model="form.medCoef" placeholder="请输入"><template slot="suffix">中档</template></el-input>
            <el-input v-model="form.lowCoef" placeholder="请输入"><template slot="suffix">低档</template></el-input>
            <el-input v-model="form.autoCoef" placeholder="请输入"><template slot="suffix">自动</template></el-input>
          </div>
        </el-form-item>

        <el-form-item class="full-width" label="模式系数" prop="coolCoef">
          <div class="coef-grid">
            <el-input v-model="form.coolCoef" placeholder="请输入"><template slot="suffix">制冷</template></el-input>
            <el-input v-model="form.heatCoef" placeholder="请输入"><template slot="suffix">制热</template></el-input>
            <el-input v-model="form.dehumCoef" placeholder="请输入"><template slot="suffix">除湿</template></el-input>
            <el-input v-model="form.fanCoef" placeholder="请输入"><template slot="suffix">送风</template></el-input>
          </div>
        </el-form-item>

        <el-form-item class="full-width" label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入" />
        </el-form-item>
      </div>
    </el-form>
    <span slot="footer">
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" @click="onSubmit">保存</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { mapState } from 'vuex'
import {
  adminManagerGetManagerListByUser,
  airInfoCreateAir,
  airInfoUpdateAir,
  airGatewayListAirGateWay
} from '@/api/adminapi'

const defaultForm = () => ({
  managerId: '',
  indoorUnitId: '',
  name: '',
  type: '',
  gatewayId: '',
  priceId: '',
  addr: '',
  meterId: '',
  bindType: '',
  billingMode: '',
  coilCoef: '',
  fanPower: '',
  highCoef: '',
  medCoef: '',
  lowCoef: '',
  autoCoef: '',
  coolCoef: '',
  heatCoef: '',
  dehumCoef: '',
  fanCoef: '',
  remark: ''
})

export default {
  props: {
    singleDialog: {
      type: Object,
      default: () => ({ show: false, type: false, data: {} })
    }
  },
  data () {
    return {
      form: defaultForm(),
      managerOptions: [],
      gatewayList: [],
      rules: {
        managerId: [{ required: true, message: '请选择归属项目', trigger: 'change' }],
        indoorUnitId: [{ required: true, message: '网关内部ID不能为空', trigger: 'blur' }],
        name: [{ required: true, message: '设备名称不能为空', trigger: 'blur' }],
        type: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
        gatewayId: [{ required: true, message: '请选择网关', trigger: 'change' }],
        bindType: [{ required: true, message: '请选择公摊类型', trigger: 'change' }],
        billingMode: [{ required: true, message: '请选择计费方式', trigger: 'change' }],
        coilCoef: [{ required: true, message: '盘管系数不能为空', trigger: 'blur' }],
        fanPower: [{ required: true, message: '风机耗电不能为空', trigger: 'blur' }],
        highCoef: [{ required: true, message: '风速系数不能为空', trigger: 'blur' }],
        coolCoef: [{ required: true, message: '模式系数不能为空', trigger: 'blur' }]
      }
    }
  },
  computed: {
    ...mapState({
      airDeviceType: state => state.adminAirEnum.airDeviceType,
      airBindType: state => state.adminAirEnum.airBindType,
      airBillingMode: state => state.adminAirEnum.airBillingMode
    })
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
    async loadGatewayList () {
      if (!this.form.managerId) return
      const res = await airGatewayListAirGateWay({ managerId: this.form.managerId })
      const list = Array.isArray(res.data) ? res.data : []
      this.gatewayList = list.map(item => ({
        ...item,
        unite: `(${item.id})${item.name}`
      }))
    },
    async changeManager (val) {
      if (!val) {
        this.gatewayList = []
        this.form.gatewayId = ''
        this.form.meterId = ''
        this.form.priceId = ''
        this.form.addr = ''
        return
      }
      await this.loadGatewayList()
    },
    changeGateway (val) {
      if (!val) {
        this.form.meterId = ''
        this.form.priceId = ''
        this.form.addr = ''
        return
      }
      const data = this.gatewayList.find(item => item.id === val)
      if (!data) return
      this.form.meterId = data.meterId
      this.form.priceId = data.priceId
      this.form.addr = data.addr
    },
    async onSubmit () {
      this.$refs.formRef.validate(async valid => {
        if (!valid) return
        const confirmed = await this.$confirm(`确认${this.singleDialog.type ? '编辑' : '新增'}空调?`, '提示', { type: 'warning' }).catch(() => false)
        if (!confirmed) return
        const payload = { ...this.form }
        if (this.singleDialog.type) {
          payload.id = this.singleDialog.data.id
          await airInfoUpdateAir(payload)
        } else {
          await airInfoCreateAir(payload)
        }
        this.$message.success('操作成功')
        this.$emit('search')
        this.closeDialog()
      })
    },
    async initDialog () {
      await this.loadManagerOptions()
      this.form = defaultForm()
      this.gatewayList = []
      if (this.singleDialog.type && this.singleDialog.data) {
        this.form = { ...defaultForm(), ...this.singleDialog.data }
      }
      if (this.form.managerId) {
        await this.loadGatewayList()
      }
      this.$nextTick(() => this.$refs.formRef && this.$refs.formRef.clearValidate())
    },
    closeDialog () {
      this.singleDialog.show = false
    }
  }
}
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
}
.full-width {
  grid-column: 1 / -1;
}
.full-line {
  grid-column: 1 / -1;
  height: 1px;
  background: #ebeef5;
  margin: 6px 0 16px;
}
.coef-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
</style>
