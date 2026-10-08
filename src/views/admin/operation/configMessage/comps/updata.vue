<template>
  <el-dialog
    :close-on-click-modal="false"
    :visible.sync="dialogData.show"
    width="450px"
    title="修改权限"
    @close="closeDialog"
    @open="initDialog"
  >
    <el-form label-width="auto">
      <el-form-item label="总开关">
        <el-switch
          v-model="queryData.enableSwitch"
          :active-color="switchColor.active"
          :inactive-color="switchColor.inactive"
          :active-value="true"
          :inactive-value="false"
        />
      </el-form-item>
      <el-form-item label="公众号推送">
        <el-switch
          v-model="queryData.wxPushSwitch"
          :active-color="switchColor.active"
          :inactive-color="switchColor.inactive"
          :active-value="true"
          :inactive-value="false"
        />
      </el-form-item>
      <el-form-item label="短信推送">
        <el-switch
          v-model="queryData.smsPushSwitch"
          :active-color="switchColor.active"
          :inactive-color="switchColor.inactive"
          :active-value="true"
          :inactive-value="false"
        />
      </el-form-item>
      <el-form-item label="系统管理员">
        <el-switch
          v-model="queryData.sysAdminSwitch"
          :active-color="switchColor.active"
          :inactive-color="switchColor.inactive"
          :active-value="true"
          :inactive-value="false"
        />
      </el-form-item>
      <el-form-item label="系统财务">
        <el-switch
          v-model="queryData.sysFinanceSwitch"
          :active-color="switchColor.active"
          :inactive-color="switchColor.inactive"
          :active-value="true"
          :inactive-value="false"
        />
      </el-form-item>
      <el-form-item label="项目绑定列表">
        <el-switch
          v-model="queryData.managerSwitch"
          :active-color="switchColor.active"
          :inactive-color="switchColor.inactive"
          :active-value="true"
          :inactive-value="false"
        />
      </el-form-item>
      <el-form-item label="租户绑定列表">
        <el-switch
          v-model="queryData.tenantSwitch"
          :active-color="switchColor.active"
          :inactive-color="switchColor.inactive"
          :active-value="true"
          :inactive-value="false"
        />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="closeDialog">取 消</el-button>
      <el-button type="primary" @click="onSubmit">确 认</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { msgUpdateMsgConfig } from '@/api/adminPush'

export default {
  name: 'AdminOperationConfigMessageUpdata',
  props: {
    dialogData: {
      type: Object,
      default () {
        return { show: false, data: {} }
      },
      required: true
    }
  },
  data () {
    return {
      queryData: {
        sysAdminSwitch: false,
        sysFinanceSwitch: false,
        managerSwitch: false,
        tenantSwitch: false,
        smsPushSwitch: false,
        wxPushSwitch: false,
        enableSwitch: false
      },
      switchColor: {
        active: '#47B881',
        inactive: '#C9CDD4'
      }
    }
  },
  methods: {
    initDialog () {
      for (var key in this.dialogData.data) {
        this.queryData[key] = this.dialogData.data[key]
      }
    },
    closeDialog () {
      this.dialogData.show = false
    },
    async onSubmit () {
      try {
        await this.$confirm('是否更改权限？', '提示', { type: 'warning' })
        const { msg } = await msgUpdateMsgConfig(this.queryData)
        this.$message.success(msg)
        this.closeDialog()
        this.$emit('search')
      } catch (e) { /* cancelled */ }
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog-footer {
  text-align: right;
}
</style>
