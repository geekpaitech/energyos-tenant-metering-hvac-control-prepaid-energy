<template>
  <el-dialog
    :close-on-click-modal="false"
    :visible.sync="editDialog.show"
    width="600px"
    title="修改数据"
    @close="closeDialog"
    @open="initDialog"
  >
    <!-- 表头 -->
    <div class="edit-row header-row">
      <div class="edit-col" />
      <div class="edit-col">总费用/元</div>
      <div class="edit-col">总用量</div>
      <div class="edit-col edit-col-action" />
    </div>

    <!-- 首条读数 -->
    <div v-if="chanegSelect === 1" class="edit-row">
      <div class="edit-col">首条读数</div>
      <div class="edit-col" />
      <div class="edit-col">
        <el-input v-model="queryData.firstRecordPowerAll" placeholder="总用量" />
      </div>
      <div class="edit-col edit-col-action-two">
        <el-button type="text" icon="el-icon-check" style="color:#67c23a" @click="subChange" />
        <el-button type="text" icon="el-icon-close" style="color:#f56c6c" @click="changeData(false)" />
      </div>
    </div>
    <div v-else class="edit-row">
      <div class="edit-col">首条读数</div>
      <div class="edit-col" />
      <div class="edit-col">{{ queryData.firstRecordPowerAll }}</div>
      <div class="edit-col edit-col-action">
        <el-button type="text" icon="el-icon-edit" @click="changeData(1)" />
      </div>
    </div>

    <!-- 最新结账数据 -->
    <div v-if="chanegSelect === 2" class="edit-row">
      <div class="edit-col">最新结账数据</div>
      <div class="edit-col" />
      <div class="edit-col">
        <el-input v-model="queryData.lastSettleRecordPowerAll" placeholder="总用量" />
      </div>
      <div class="edit-col edit-col-action-two">
        <el-button type="text" icon="el-icon-check" style="color:#67c23a" @click="subChange" />
        <el-button type="text" icon="el-icon-close" style="color:#f56c6c" @click="changeData(false)" />
      </div>
    </div>
    <div v-else class="edit-row">
      <div class="edit-col">最新结账数据</div>
      <div class="edit-col" />
      <div class="edit-col">{{ queryData.lastSettleRecordPowerAll }}</div>
      <div class="edit-col edit-col-action">
        <el-button type="text" icon="el-icon-edit" @click="changeData(2)" />
      </div>
    </div>

    <!-- 抄表数据（只读） -->
    <div class="edit-row">
      <div class="edit-col">抄表数据</div>
      <div class="edit-col">{{ queryData.settleBalance }}</div>
      <div class="edit-col">{{ queryData.settlePowerAll }}</div>
      <div class="edit-col edit-col-action" />
    </div>

    <!-- 平台已结算 -->
    <div v-if="chanegSelect === 3" class="edit-row">
      <div class="edit-col">平台已结算</div>
      <div class="edit-col">
        <el-input v-model="queryData.yetSettleBalance" placeholder="总费用" />
      </div>
      <div class="edit-col">
        <el-input v-model="queryData.yetSettlePowerAll" placeholder="总用量" />
      </div>
      <div class="edit-col edit-col-action-two">
        <el-button type="text" icon="el-icon-check" style="color:#67c23a" @click="subChange" />
        <el-button type="text" icon="el-icon-close" style="color:#f56c6c" @click="changeData(false)" />
      </div>
    </div>
    <div v-else class="edit-row">
      <div class="edit-col">平台已结算</div>
      <div class="edit-col">{{ queryData.yetSettleBalance }}</div>
      <div class="edit-col">{{ queryData.yetSettlePowerAll }}</div>
      <div class="edit-col edit-col-action">
        <el-button type="text" icon="el-icon-edit" @click="changeData(3)" />
      </div>
    </div>

    <!-- 补单数据（只读） -->
    <div class="edit-row bottom-row">
      <div class="edit-col">补单数据</div>
      <div class="edit-col">{{ queryData.repairBalance }}</div>
      <div class="edit-col">{{ queryData.repairPowerAll }}</div>
      <div class="edit-col edit-col-action" />
    </div>

    <span slot="footer">
      <el-button @click="closeDialog">取 消</el-button>
      <el-button type="primary" @click="onSubmit">确 认</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { settleToolsCalSettleMeterRepair, settleToolsUpdateSettleMeterRepair } from '@/api/adminDb'

export default {
  name: 'BatchCreateEditWater',
  props: {
    editDialog: {
      type: Object,
      default () {
        return { show: false, data: {} }
      },
      required: true
    }
  },
  data () {
    return {
      template: {},
      queryData: {},
      chanegSelect: false
    }
  },
  methods: {
    changeData (val) {
      if (this.chanegSelect && val) {
        this.queryData = JSON.parse(JSON.stringify(this.template))
      }
      if (!val) {
        this.queryData = JSON.parse(JSON.stringify(this.template))
      }
      this.chanegSelect = val
    },
    async subChange () {
      try {
        await this.$confirm('确认修改数据', '提示', { type: 'warning' })
        const { data } = await settleToolsCalSettleMeterRepair(this.queryData)
        this.chanegSelect = false
        this.queryData = JSON.parse(JSON.stringify(data))
        this.template = JSON.parse(JSON.stringify(data))
      } catch (e) { /* cancelled */ }
    },
    async onSubmit () {
      try {
        await this.$confirm('确认保存补单数据?', '提示', { type: 'warning' })
        const { msg } = await settleToolsUpdateSettleMeterRepair(this.queryData)
        this.$message.success(msg)
        this.closeDialog()
        this.$emit('search')
      } catch (e) { /* cancelled */ }
    },
    initDialog () {
      this.queryData = JSON.parse(JSON.stringify(this.editDialog.data))
      this.template = JSON.parse(JSON.stringify(this.editDialog.data))
    },
    closeDialog () {
      this.chanegSelect = false
      this.editDialog.show = false
    }
  }
}
</script>

<style lang="scss" scoped>
.edit-row {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  color: #303133;
}

.header-row {
  font-weight: 600;
  color: #606266;
}

.bottom-row {
  border: 1px solid #dcdfe6;
  padding: 10px;
}

.edit-col {
  margin: 0 10px;
  width: calc(100% / 4);
  display: flex;
  justify-content: center;
  align-items: center;
  word-break: break-all;
  text-align: center;
}

.edit-col-action {
  width: 20px !important;
  margin: 0;
}

.edit-col-action-two {
  width: 40px !important;
  margin: 0;
}
</style>
