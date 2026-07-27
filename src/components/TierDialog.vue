<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="dialogVisible"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <el-form
      ref="tierForm"
      :model="formData"
      :rules="formRules"
      :label-width="formLabelWidth"
      label-position="left"
    >
      <!-- 上级层级显示（仅在添加子层级时显示） -->
      <el-form-item v-if="isAddChild" :label="$t('tierDialogPage.formParentTier')">
        <el-input
          :value="$displayBizHybrid(parentTierName || '')"
          disabled
          :placeholder="$t('tierDialogPage.phParentTier')"
        />
      </el-form-item>

      <el-form-item :label="$t('tierDialogPage.formTierName')" prop="name">
        <el-input
          v-model="formData.name"
          :placeholder="$t('tierDialogPage.phTierName')"
          clearable
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">{{ $t('tierDialogPage.btnCancel') }}</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        {{ type === 'edit' ? $t('tierDialogPage.btnModify') : $t('tierDialogPage.btnAdd') }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  tierAddTenantTier,
  tierUpdateTenantTier
} from '@/api/tier'

export default {
  name: 'TierDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'add' // 'add' | 'edit' | 'addChild'
    },
    data: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
      submitting: false,

      formData: {
        name: '',
        parentId: 0
      }
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),

    dialogVisible: {
      get () {
        return this.visible
      },
      set (val) {
        this.$emit('update:visible', val)
      }
    },

    formLabelWidth () {
      return this.$i18n.locale === 'en' ? '110px' : '80px'
    },

    formRules () {
      return {
        name: [
          { required: true, message: this.$t('tierDialogPage.ruleNameRequired'), trigger: 'blur' },
          { min: 1, max: 50, message: this.$t('tierDialogPage.ruleNameLen'), trigger: 'blur' }
        ]
      }
    },

    dialogTitle () {
      if (this.type === 'edit') return this.$t('tierDialogPage.dialogTitleEdit')
      if (this.type === 'addChild') return this.$t('tierDialogPage.dialogTitleAddChild')
      return this.$t('tierDialogPage.dialogTitleAdd')
    },

    // 是否是添加子层级
    isAddChild () {
      return this.type === 'addChild'
    },

    // 父级层级名称
    parentTierName () {
      return this.data ? this.data.name : ''
    }
  },
  watch: {
    visible: {
      handler (newVal) {
        if (newVal) {
          this.initDialog()
        } else {
          this.resetForm()
        }
      },
      immediate: true
    }
  },
  methods: {
    // 初始化对话框
    initDialog () {
      if (this.type === 'edit' && this.data) {
        // 编辑模式
        this.formData = {
          id: this.data.id,
          name: this.data.name,
          parentId: this.data.parentId || 0,
          level: this.data.level || 1
        }
      } else if (this.type === 'addChild' && this.data) {
        // 添加子层级模式
        this.formData = {
          name: '',
          parentId: this.data.id,
          level: (this.data.level || 0) + 1
        }
      } else {
        // 添加顶级层级模式
        this.formData = {
          name: '',
          parentId: 0,
          level: 1
        }
      }
    },

    // 重置表单
    resetForm () {
      this.formData = {
        name: '',
        parentId: 0,
        level: 1
      }

      if (this.$refs.tierForm) {
        this.$refs.tierForm.clearValidate()
      }
    },

    // 关闭对话框
    handleClose () {
      this.dialogVisible = false
    },

    // 提交表单
    handleSubmit () {
      this.$refs.tierForm.validate(async (valid) => {
        if (!valid) return

        if (this.type === 'edit') {
          await this.updateTier()
        } else {
          await this.addTier()
        }
      })
    },

    // 新增层级
    async addTier () {
      try {
        this.submitting = true

        const params = {
          managerId: this.currentManagerId,
          name: this.formData.name,
          parentId: this.formData.parentId,
          level: this.formData.level
        }

        const response = await tierAddTenantTier(params)

        if (response.code === 200) {
          this.$message.success(response.msg || this.$t('tierDialogPage.msgAddOk'))
          this.handleClose()
          this.$emit('success')
        } else {
          this.$message.error(response.msg || this.$t('tierDialogPage.msgAddFail'))
        }
      } catch (error) {
        console.error('新增层级失败:', error)
        this.$apiError.notify(error, this.$t('tierDialogPage.msgAddErr'))
      } finally {
        this.submitting = false
      }
    },

    // 更新层级
    async updateTier () {
      try {
        this.submitting = true

        const params = {
          id: this.formData.id,
          name: this.formData.name,
          parentId: this.formData.parentId,
          level: this.formData.level
        }

        const response = await tierUpdateTenantTier(params)

        if (response.code === 200) {
          this.$message.success(response.msg || this.$t('tierDialogPage.msgUpdateOk'))
          this.handleClose()
          this.$emit('success')
        } else {
          this.$message.error(response.msg || this.$t('tierDialogPage.msgUpdateFail'))
        }
      } catch (error) {
        console.error('更新层级失败:', error)
        this.$apiError.notify(error, this.$t('tierDialogPage.msgUpdateErr'))
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog-footer {
  text-align: right;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
}

:deep(.el-input.is-disabled .el-input__inner) {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #c0c4cc;
}
</style>
