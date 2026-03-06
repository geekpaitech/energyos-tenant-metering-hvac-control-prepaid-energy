<template>
  <el-dialog
    :title="isEdit ? '编辑租户' : '新增租户'"
    :visible.sync="dialogVisible"
    width="800px"
    :close-on-click-modal="false"
    class="tenant-dialog"
    @close="handleClose"
  >
    <el-form
      ref="tenantForm"
      :model="form"
      :rules="rules"
      label-width="100px"
      size="small"
    >
      <!-- 基本信息卡片 -->
      <div class="form-section">
        <div class="section-header">
          <span>基本信息</span>
        </div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="租户名称" prop="name">
              <el-input 
                v-model="form.name" 
                placeholder="请输入租户名称"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="租占面积" prop="publicArea">
              <el-input 
                v-model="form.publicArea" 
                placeholder="请输入租占面积"
              >
                <template slot="append">m²</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 收费设置卡片 -->
      <div class="form-section">
        <div class="section-header">
          <span>收费设置</span>
        </div>

        <!-- 收电费 -->
        <div class="fee-box">
          <div class="fee-title">
            <span class="fee-label">收电费</span>
            <el-radio-group v-model="form.meterStatus" size="small">
              <el-radio :label="1">是</el-radio>
              <el-radio :label="0">否</el-radio>
            </el-radio-group>
          </div>

          <transition name="el-zoom-in-top">
            <el-row v-show="form.meterStatus === 1" :gutter="16" class="fee-fields">
              <el-col :span="8">
                <el-form-item label="预警金额1">
                  <el-input
                    v-model="form.meterAccount.alarmBalance1"
                    placeholder="0.00"
                    type="number"
                  >
                    <template slot="append">元</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="预警金额2">
                  <el-input
                    v-model="form.meterAccount.alarmBalance2"
                    placeholder="0.00"
                    type="number"
                  >
                    <template slot="append">元</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="透支金额">
                  <el-input
                    v-model="form.meterAccount.overdraw"
                    placeholder="0.00"
                    type="number"
                  >
                    <template slot="append">元</template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </transition>
        </div>

        <!-- 收水费 -->
        <div class="fee-box">
          <div class="fee-title">
            <span class="fee-label">收水费</span>
            <el-radio-group v-model="form.waterStatus" size="small">
              <el-radio :label="1">是</el-radio>
              <el-radio :label="0">否</el-radio>
            </el-radio-group>
          </div>

          <transition name="el-zoom-in-top">
            <el-row v-show="form.waterStatus === 1" :gutter="16" class="fee-fields">
              <el-col :span="8">
                <el-form-item label="预警金额1">
                  <el-input
                    v-model="form.waterAccount.alarmBalance1"
                    placeholder="0.00"
                    type="number"
                  >
                    <template slot="append">元</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="预警金额2">
                  <el-input
                    v-model="form.waterAccount.alarmBalance2"
                    placeholder="0.00"
                    type="number"
                  >
                    <template slot="append">元</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="透支金额">
                  <el-input
                    v-model="form.waterAccount.overdraw"
                    placeholder="0.00"
                    type="number"
                  >
                    <template slot="append">元</template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </transition>
        </div>
      </div>

      <!-- 联系方式卡片 -->
      <div class="form-section">
        <div class="section-header">
          <span>联系方式</span>
        </div>

        <div
          v-for="(phone, index) in form.phoneList"
          :key="index"
          class="phone-item"
        >
          <el-form-item
            :label="`手机号${index + 1}`"
            :prop="`phoneList.${index}`"
            :rules="phoneRules"
          >
            <el-input 
              v-model="form.phoneList[index]" 
              placeholder="请输入手机号"
              maxlength="11"
            >
              <template v-if="form.phoneList.length > 1" slot="suffix">
                <i 
                  class="el-icon-close delete-phone-icon" 
                  @click="removePhone(index)"
                ></i>
              </template>
            </el-input>
          </el-form-item>
        </div>

        <div v-if="form.phoneList.length < 5" class="add-phone-btn">
          <el-button
            type="text"
            icon="el-icon-circle-plus-outline"
            @click="addPhone"
          >
            添加手机号
          </el-button>
        </div>
      </div>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false" size="medium">取 消</el-button>
      <el-button 
        type="primary" 
        :loading="submitting" 
        @click="handleSubmit"
        size="medium"
      >
        {{ submitting ? '保存中...' : '确 定' }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { tenantAdd, tenantUpdate } from '@/api/tenant'

export default {
  name: 'AddTenantDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    tenantData: {
      type: Object,
      default: () => ({})
    },
    labelList: {
      type: Array,
      default: () => []
    },
    managerId: {
      type: [String, Number],
      default: ''
    }
  },
  data() {
    const validatePhone = (rule, value, callback) => {
      if (!value) {
        callback()
        return
      }
      const phoneReg = /^1[3-9]\d{9}$/
      if (!phoneReg.test(value)) {
        callback(new Error('请输入正确的手机号'))
      } else {
        callback()
      }
    }

    return {
      submitting: false,
      form: {
        id: '',
        name: '',
        publicArea: '',
        phoneList: [''],
        logoUrl: '',
        managerId: '',
        meterStatus: 1, // 电费开关：0-关闭，1-开启（默认开启）
        waterStatus: 0, // 水费开关：0-关闭，1-开启（默认关闭）
        // 电费账户对象
        meterAccount: {
          alarmBalance1: '',
          alarmBalance2: '',
          overdraw: ''
        },
        // 水费账户对象
        waterAccount: {
          alarmBalance1: '',
          alarmBalance2: '',
          overdraw: ''
        }
      },
      rules: {
        name: [
          { required: true, message: '请输入租户名称', trigger: 'blur' },
          { max: 50, message: '租户名称不能超过50个字符', trigger: 'blur' }
        ],
        publicArea: [
          { required: true, message: '请输入租占面积', trigger: 'blur' }
        ]
      },
      phoneRules: [
        { validator: validatePhone, trigger: 'blur' }
      ],
      defaultLogo: 'https://ebc-cloud.oss-cn-shanghai.aliyuncs.com/ebc-img/618daafe525f79a3cf4bf80ef1424fc2_202509081044.png'
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    isEdit() {
      return !!this.form.id
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.initForm()
      }
    }
  },
  methods: {
    // 初始化表单
    initForm() {
      if (this.tenantData && this.tenantData.id) {
        // 编辑模式
        this.form = {
          ...this.tenantData,
          phoneList: this.tenantData.phoneList && this.tenantData.phoneList.length > 0
            ? this.tenantData.phoneList
            : [''],
          managerId: this.managerId,
          meterStatus: this.tenantData.meterStatus !== undefined 
            ? this.tenantData.meterStatus 
            : 1,
          waterStatus: this.tenantData.waterStatus !== undefined 
            ? this.tenantData.waterStatus 
            : 0,
          // 电费账户
          meterAccount: {
            alarmBalance1: this.tenantData.meterAccountDto?.alarmBalance1 || '',
            alarmBalance2: this.tenantData.meterAccountDto?.alarmBalance2 || '',
            overdraw: this.tenantData.meterAccountDto?.overdraw || ''
          },
          // 水费账户
          waterAccount: {
            alarmBalance1: this.tenantData.waterAccountDto?.alarmBalance1 || '',
            alarmBalance2: this.tenantData.waterAccountDto?.alarmBalance2 || '',
            overdraw: this.tenantData.waterAccountDto?.overdraw || ''
          }
        }
      } else {
        // 新增模式
        this.form = {
          id: '',
          name: '',
          publicArea: '',
          phoneList: [''],
          logoUrl: '',
          managerId: this.managerId,
          meterStatus: 1, // 默认开启电费
          waterStatus: 0, // 默认关闭水费
          meterAccount: {
            alarmBalance1: '',
            alarmBalance2: '',
            overdraw: ''
          },
          waterAccount: {
            alarmBalance1: '',
            alarmBalance2: '',
            overdraw: ''
          }
        }
      }
      
      this.$nextTick(() => {
        this.$refs.tenantForm && this.$refs.tenantForm.clearValidate()
      })
    },
    
    // 添加手机号
    addPhone() {
      if (this.form.phoneList.length >= 5) {
        this.$message.warning('最多只能添加5个手机号')
        return
      }
      this.form.phoneList.push('')
    },

    // 删除手机号
    removePhone(index) {
      this.form.phoneList.splice(index, 1)
    },
    
    // 关闭弹窗
    handleClose() {
      this.form = {
        id: '',
        name: '',
        publicArea: '',
        phoneList: [''],
        logoUrl: '',
        managerId: '',
        meterStatus: 1,
        waterStatus: 0,
        meterAccount: {
          alarmBalance1: '',
          alarmBalance2: '',
          overdraw: ''
        },
        waterAccount: {
          alarmBalance1: '',
          alarmBalance2: '',
          overdraw: ''
        }
      }
    },
    
    // 提交表单
    async handleSubmit() {
      this.$refs.tenantForm.validate(async (valid) => {
        if (valid) {
          this.submitting = true
          
          try {
            // 设置默认logo
            if (!this.form.logoUrl) {
              this.form.logoUrl = this.defaultLogo
            }

            // 过滤空手机号
            const phoneList = this.form.phoneList.filter(phone => phone)

            // 金额转换函数：转换为数字，空值返回 0
            const parseAmount = (val) => {
              if (!val && val !== 0) return 0
              const num = parseFloat(val)
              return isNaN(num) ? 0 : num
            }

            // 构建电费账户对象（只有开启时才传）
            let meterAccountDto = null
            if (this.form.meterStatus === 1) {
              meterAccountDto = {
                bizType: 1, // 1-电费（固定）
                alarmBalance1: parseAmount(this.form.meterAccount.alarmBalance1),
                alarmBalance2: parseAmount(this.form.meterAccount.alarmBalance2),
                overdraw: parseAmount(this.form.meterAccount.overdraw),
              }
              
              // 编辑模式需要传 tenantId
              if (this.isEdit) {
                meterAccountDto.tenantId = this.form.id
              }
            }

            // 构建水费账户对象（只有开启时才传）
            let waterAccountDto = null
            if (this.form.waterStatus === 1) {
              waterAccountDto = {
                bizType: 2, // 2-水费（固定）
                alarmBalance1: parseAmount(this.form.waterAccount.alarmBalance1),
                alarmBalance2: parseAmount(this.form.waterAccount.alarmBalance2),
                overdraw: parseAmount(this.form.waterAccount.overdraw),
              }
              
              // 编辑模式需要传 tenantId
              if (this.isEdit) {
                waterAccountDto.tenantId = this.form.id
              }
            }
            
            // 构建请求参数
            const params = {
              name: this.form.name,
              publicArea: this.form.publicArea,
              phoneList: phoneList,
              logoUrl: this.form.logoUrl,
              managerId: this.managerId,
              meterStatus: this.form.meterStatus, // 电费开关在外层
              waterStatus: this.form.waterStatus, // 水费开关在外层
              meterAccountDto: meterAccountDto,
              waterAccountDto: waterAccountDto
            }

            // 编辑模式需要传 id
            if (this.isEdit) {
              params.id = this.form.id
            }

            console.log('提交参数:', params)
            
            let response
            if (this.isEdit) {
              response = await tenantUpdate(params)
            } else {
              response = await tenantAdd(params)
            }
            
            if (response.code === 200) {
              this.$message.success(this.isEdit ? '修改成功' : '新增成功')
              this.$emit('success')
              this.dialogVisible = false
            } else {
              this.$message.error(response.msg || '操作失败')
            }
          } catch (error) {
            this.$message.error('操作失败')
            console.error('保存失败:', error)
          } finally {
            this.submitting = false
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.tenant-dialog {
  ::v-deep .el-dialog__body {
    padding: 20px 24px;
    max-height: 70vh;
    overflow-y: auto;
  }
}

// 表单区块
.form-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #e8eaec;

  .section-header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }

  // 表单项间距
  ::v-deep .el-form-item {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

// 收费设置盒子
.fee-box {
  margin-bottom: 16px;
  padding: 16px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;

  &:last-child {
    margin-bottom: 0;
  }

  .fee-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .fee-label {
      font-size: 14px;
      font-weight: 600;
      color: #606266;
    }

    ::v-deep .el-radio-group {
      .el-radio {
        margin-right: 20px;
        
        .el-radio__input.is-checked .el-radio__inner {
          border-color: #409eff;
          background: #409eff;
        }
        
        .el-radio__input.is-checked + .el-radio__label {
          color: #606266;
        }
      }
    }
  }

  .fee-fields {
    ::v-deep .el-form-item__label {
      font-size: 13px;
    }
  }
}

// 手机号区域
.phone-item {
  margin-bottom: 10px;
  
  .delete-phone-icon {
    cursor: pointer;
    color: #f56c6c;
    font-size: 14px;
    padding: 0 8px;
    
    &:hover {
      color: #f78989;
    }
  }
}

.add-phone-btn {
  text-align: center;
  padding-top: 8px;

  .el-button {
    color: #409eff;
  }
}

// 去掉所有蓝色下划线
::v-deep {
  .el-input__inner:focus {
    border-color: #409eff;
    box-shadow: none;
  }
  
  .el-link {
    text-decoration: none !important;
    
    &:hover {
      text-decoration: none !important;
    }
  }

  .el-button--text {
    text-decoration: none !important;
    
    &:hover {
      text-decoration: none !important;
    }
  }
  
  a {
    text-decoration: none !important;
  }

  // 隐藏 number 输入框的上下箭头
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  input[type="number"] {
    -moz-appearance: textfield;
  }
}

// 底部按钮
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;

  .el-button {
    min-width: 100px;
  }
}

// 滚动条美化
.tenant-dialog ::v-deep .el-dialog__body::-webkit-scrollbar {
  width: 6px;
}

.tenant-dialog ::v-deep .el-dialog__body::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;

  &:hover {
    background: #c0c4cc;
  }
}

// 过渡动画
.el-zoom-in-top-enter-active,
.el-zoom-in-top-leave-active {
  transition: all 0.3s ease;
}

.el-zoom-in-top-enter,
.el-zoom-in-top-leave-to {
  opacity: 0;
  transform: scaleY(0);
}
</style>