<template>
  <el-drawer
    title="屏蔽名单"
    :close-on-click-modal="false"
    :visible.sync="shieldDialog.show"
    size="60%"
    @open="initDialog"
    @close="closeDialog"
  >
    <div v-loading="loading" class="shield-body">
      <div class="section-card">
        <el-form @submit.native.prevent>
          <el-row :gutter="10">
            <el-col :span="13">
              <el-form-item label="未屏蔽列表">
                <el-input
                  v-model="leftInput"
                  clearable
                  placeholder="请输入需要搜索的账号"
                  @keyup.enter.native="dimSearchMeter"
                >
                  <i
                    slot="suffix"
                    class="el-icon-search el-input__icon"
                    @click="dimSearchMeter"
                  />
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <el-table ref="table" :data="unBindData" border max-height="30vh">
          <el-table-column label="用户名">
            <template slot-scope="{ row }">{{ row.name }}</template>
          </el-table-column>
          <el-table-column label="手机号">
            <template slot-scope="{ row }">{{ row.phone }}</template>
          </el-table-column>
          <el-table-column label="设置" width="100" align="center">
            <template slot-scope="{ row }">
              <el-button type="text" @click="operation(row, true)">添加</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="section-card">
        <el-form>
          <el-form-item label="已屏蔽列表" />
        </el-form>

        <el-table ref="table" :data="bindData" border max-height="30vh">
          <el-table-column label="用户名">
            <template slot-scope="{ row }">{{ row.name }}</template>
          </el-table-column>
          <el-table-column label="手机号">
            <template slot-scope="{ row }">{{ row.phone }}</template>
          </el-table-column>
          <el-table-column label="设置" width="100" align="center">
            <template slot-scope="{ row }">
              <el-button type="text" @click="operation(row, false)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </el-drawer>
</template>

<script>
import { msgGetMsgFilterUser, msgGetUserList, msgUpdateMsgFilterUser } from '@/api/adminPush'

export default {
  name: 'AdminOperationConfigMessageShield',
  props: {
    shieldDialog: {
      type: Object,
      default () {
        return { show: false, code: '' }
      }
    }
  },
  data () {
    return {
      loading: false,
      bindData: [],
      unBindData: [],
      leftInput: ''
    }
  },
  methods: {
    dimSearchMeter () {
      const val = this.leftInput
      if (val && val.length === 11) {
        this.getMsgGetUserList(val)
      }
    },
    operation (val, type) {
      const id = val.userId
      const ids = this.bindData.map(item => item.userId)
      const index = ids.indexOf(id)
      if (type) {
        if (index !== -1) {
          this.$message.error('该账号已屏蔽')
          return
        }
        ids.push(id)
      } else {
        ids.splice(index, 1)
      }
      this.onSubmit(ids)
    },
    async onSubmit (select) {
      try {
        await this.$confirm('确认操作？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await msgUpdateMsgFilterUser(this.shieldDialog.code, select)
        this.$message.success('操作成功')
        this.leftInput = ''
        this.unBindData = []
        this.initDialog()
      } catch (e) {
        this.initDialog()
      }
    },
    async getMsgGetUserList (val) {
      const { data } = await msgGetUserList({ phone: val })
      this.unBindData = data || []
    },
    async getMsgGetMsgFilterUser () {
      const { data } = await msgGetMsgFilterUser({ code: this.shieldDialog.code })
      this.bindData = data || []
    },
    closeDialog () {
      this.$emit('search')
      this.leftInput = ''
      this.unBindData = []
      this.shieldDialog.show = false
    },
    async initDialog () {
      this.loading = true
      try {
        await this.getMsgGetMsgFilterUser()
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.shield-body {
  padding: 0 20px;
}

.section-card {
  padding: 10px 0;
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  border-radius: 6px;

  ::v-deep .el-form {
    padding: 0 20px;
  }
}
</style>
