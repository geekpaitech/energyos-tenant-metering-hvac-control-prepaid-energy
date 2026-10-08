<template>
  <el-dialog
    :close-on-click-modal="false"
    :visible.sync="editDialog.show"
    width="450px"
    :title="editDialog.type ? '修改推文' : '新增推文'"
    @open="initDialog"
    @close="closeDialog"
  >
    <el-form label-width="95px">
      <el-form-item label="标题">
        <el-input v-model="queryData.title" clearable placeholder="请输入标题" />
      </el-form-item>
      <el-form-item label="发布时间">
        <el-date-picker
          v-model="queryData.publishTime"
          type="datetime"
          format="yyyy-MM-dd HH:mm:ss"
          value-format="yyyy-MM-dd HH:mm:ss"
          placeholder="选择日期时间"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="展示状态">
        <el-switch
          v-model="queryData.showStatus"
          :active-color="switchColor.active"
          :inactive-color="switchColor.inactive"
        />
      </el-form-item>
      <el-form-item label="地址">
        <el-input v-model="queryData.url" clearable placeholder="请输入地址" />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="closeDialog">取 消</el-button>
      <el-button type="primary" @click="onSubmit">确 认</el-button>
    </div>
  </el-dialog>
</template>

<script>
import {
  publishArticleAddPublishArticle,
  publishArticleUpdatePublishArticle
} from '@/api/adminPush'

export default {
  name: 'AdminOperationPushTextEdit',
  props: {
    editDialog: {
      type: Object,
      default () {
        return { show: false, type: false, data: {} }
      },
      required: true
    }
  },
  data () {
    return {
      queryData: {
        title: '',
        publishTime: '',
        showStatus: false,
        url: ''
      },
      switchColor: {
        active: '#47B881',
        inactive: '#C9CDD4'
      }
    }
  },
  methods: {
    initDialog () {
      if (this.editDialog.type) {
        for (var key in this.queryData) {
          this.queryData[key] = this.editDialog.data[key]
        }
      }
    },
    closeDialog () {
      this.queryData.title = ''
      this.queryData.publishTime = ''
      this.queryData.showStatus = false
      this.queryData.url = ''
      this.editDialog.show = false
    },
    async onSubmit () {
      try {
        await this.$confirm(
          `确认${this.editDialog.type ? '修改' : '新增'}推文？`,
          '提示',
          { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
        )
        if (this.editDialog.type) {
          this.queryData.id = this.editDialog.data.id
          const { msg } = await publishArticleUpdatePublishArticle(this.queryData)
          this.$message.success(msg)
        } else {
          const { msg } = await publishArticleAddPublishArticle(this.queryData)
          this.$message.success(msg)
        }
        this.$emit('search')
        this.closeDialog()
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
