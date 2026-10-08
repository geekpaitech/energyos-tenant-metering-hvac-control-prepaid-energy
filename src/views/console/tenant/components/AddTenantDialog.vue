<template>
  <el-dialog
    :title="dialogTitle"
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
      :label-width="dialogLabelWidth"
      size="small"
    >
      <!-- 基本信息卡片 -->
      <div class="form-section">
        <div class="section-header">
          <span>{{ $t('tenantDialogs.add.sectionBasic') }}</span>
        </div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('tenantDialogs.add.labelName')" prop="name">
              <el-select
                v-if="mysoftEnabled"
                v-model="form.name"
                filterable
                allow-create
                clearable
                :loading="renterLoading"
                :placeholder="$t('tenantDialogs.add.phSelectName')"
                class="mysoft-field"
              >
                <el-option
                  v-for="item in renterOptions"
                  :key="item.renterId || item.renterName"
                  :label="renterOptionLabel(item)"
                  :value="item.renterName"
                />
              </el-select>
              <el-input
                v-else
                v-model="form.name"
                :placeholder="$t('tenantDialogs.add.phName')"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('tenantDialogs.add.labelArea')" prop="publicArea">
              <el-input
                v-model="form.publicArea"
                :placeholder="$t('tenantDialogs.add.phArea')"
              >
                <template slot="append">m²</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="mysoftEnabled" :gutter="16" style="margin-top: 8px;">
          <el-col :span="12">
            <el-form-item :label="$t('tenantDialogs.add.labelResources')" prop="selectedResourceGUIDs">
              <el-select
                v-model="selectedResourceGUIDs"
                multiple
                filterable
                collapse-tags
                :loading="resourceLoading"
                :placeholder="$t('tenantDialogs.add.phResources')"
                class="mysoft-field resource-select"
              >
                <el-option
                  v-for="item in resourceOptions"
                  :key="item.resourceGUID"
                  :label="resourceOptionLabel(item)"
                  :value="item.resourceGUID"
                  :disabled="isResourceBound(item)"
                >
                  <span
                    class="resource-option-label"
                    :title="resourceOptionTitle(item)"
                  >{{ resourceOptionLabel(item) }}</span>
                  <span v-if="isResourceBound(item)" class="resource-bound-tag">
                    {{ $t('tenantDialogs.add.resourceBound') }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" style="margin-top: 8px;">
          <el-col :span="24">
            <el-form-item :label="$t('tenantDialogs.add.labelTenantType')" prop="tenantType" required>
              <el-radio-group v-model="form.tenantType" size="small">
                <el-radio :label="0">{{ $t('tenantDialogs.add.tenantType0') }}</el-radio>
                <el-radio :label="1">{{ $t('tenantDialogs.add.tenantType1') }}</el-radio>
                <el-radio :label="2">{{ $t('tenantDialogs.add.tenantType2') }}</el-radio>
                <el-radio :label="3">{{ $t('tenantDialogs.add.tenantType3') }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item :label="$t('tenantDialogs.add.labelPayType')" prop="payType">
              <el-radio-group v-model="form.payType" size="small">
                <el-radio :label="0">{{ $t('tenantDialogs.add.payTypePrepaid') }}</el-radio>
                <el-radio :label="1">{{ $t('tenantDialogs.add.payTypePostpaid') }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="form.payType === 1" :gutter="16">
          <el-col :span="24">
            <el-form-item :label="$t('tenantDialogs.add.labelPostPayComment')" prop="postPayComment">
              <el-input
                v-model="form.postPayComment"
                type="textarea"
                :rows="3"
                maxlength="200"
                show-word-limit
                :placeholder="$t('tenantDialogs.add.phPostPayComment')"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 收费设置卡片 -->
      <div class="form-section">
        <div class="section-header">
          <span>{{ $t('tenantDialogs.add.sectionFee') }}</span>
        </div>

        <!-- 收电费 -->
        <div class="fee-box">
          <div class="fee-title">
            <span class="fee-label">{{ $t('tenantDialogs.add.collectMeter') }}</span>
            <el-radio-group v-model="form.meterStatus" size="small">
              <el-radio :label="1">{{ $t('tenantDialogs.add.yes') }}</el-radio>
              <el-radio :label="0">{{ $t('tenantDialogs.add.no') }}</el-radio>
            </el-radio-group>
          </div>

          <transition name="el-zoom-in-top">
            <el-row v-show="form.meterStatus === 1" :gutter="16" class="fee-fields">
              <el-col :span="8">
                <el-form-item :label="$t('tenantDialogs.add.alarm1')">
                  <el-input
                    v-model="form.meterAccount.alarmBalance1"
                    :placeholder="$t('tenantDialogs.add.phAmount')"
                    type="number"
                  >
                    <template slot="append">{{ $t('tenantDialogs.add.yuan') }}</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="$t('tenantDialogs.add.alarm2')">
                  <el-input
                    v-model="form.meterAccount.alarmBalance2"
                    :placeholder="$t('tenantDialogs.add.phAmount')"
                    type="number"
                  >
                    <template slot="append">{{ $t('tenantDialogs.add.yuan') }}</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="$t('tenantDialogs.add.overdraw')">
                  <el-input
                    v-model="form.meterAccount.overdraw"
                    :placeholder="$t('tenantDialogs.add.phAmount')"
                    type="number"
                  >
                    <template slot="append">{{ $t('tenantDialogs.add.yuan') }}</template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </transition>
        </div>

        <!-- 收水费 -->
        <div class="fee-box">
          <div class="fee-title">
            <span class="fee-label">{{ $t('tenantDialogs.add.collectWater') }}</span>
            <el-radio-group v-model="form.waterStatus" size="small">
              <el-radio :label="1">{{ $t('tenantDialogs.add.yes') }}</el-radio>
              <el-radio :label="0">{{ $t('tenantDialogs.add.no') }}</el-radio>
            </el-radio-group>
          </div>

          <transition name="el-zoom-in-top">
            <el-row v-show="form.waterStatus === 1" :gutter="16" class="fee-fields">
              <el-col :span="8">
                <el-form-item :label="$t('tenantDialogs.add.alarm1')">
                  <el-input
                    v-model="form.waterAccount.alarmBalance1"
                    :placeholder="$t('tenantDialogs.add.phAmount')"
                    type="number"
                  >
                    <template slot="append">{{ $t('tenantDialogs.add.yuan') }}</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="$t('tenantDialogs.add.alarm2')">
                  <el-input
                    v-model="form.waterAccount.alarmBalance2"
                    :placeholder="$t('tenantDialogs.add.phAmount')"
                    type="number"
                  >
                    <template slot="append">{{ $t('tenantDialogs.add.yuan') }}</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="$t('tenantDialogs.add.overdraw')">
                  <el-input
                    v-model="form.waterAccount.overdraw"
                    :placeholder="$t('tenantDialogs.add.phAmount')"
                    type="number"
                  >
                    <template slot="append">{{ $t('tenantDialogs.add.yuan') }}</template>
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
          <span>{{ $t('tenantDialogs.add.sectionContact') }}</span>
        </div>

        <div
          v-for="(phone, index) in form.phoneList"
          :key="index"
          class="phone-item"
        >
          <el-form-item
            :label="$t('tenantDialogs.add.phoneLabel', { n: index + 1 })"
            :prop="`phoneList.${index}`"
            :rules="phoneRules"
          >
            <el-input
              v-model="form.phoneList[index]"
              :placeholder="$t('tenantDialogs.add.phPhone')"
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

        <div class="add-phone-btn">
          <el-button
            type="text"
            icon="el-icon-circle-plus-outline"
            @click="addPhone"
          >
            {{ $t('tenantDialogs.add.addPhone') }}
          </el-button>
        </div>
      </div>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false" size="medium">{{ $t('tenantDialogs.add.cancel') }}</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
        size="medium"
      >
        {{ submitting ? $t('tenantDialogs.add.saving') : $t('tenantDialogs.add.confirm') }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import {
  tenantAdd,
  tenantUpdate,
  mingYuanRenterPage,
  mingYuanResourcePage
} from '@/api/tenant'

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
    },
    mysoftEnabled: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      submitting: false,
      renterLoading: false,
      resourceLoading: false,
      renterOptions: [],
      resourceOptions: [],
      selectedResourceGUIDs: [],
      form: {
        id: '',
        name: '',
        publicArea: '',
        phoneList: [''],
        logoUrl: '',
        managerId: '',
        resourceList: [],
        tenantType: 0, // 租户类型：0-租户，1-公区，2-其他（默认租户）
        payType: 0, // 付费模式：0-预付费，1-后付费（默认预付费）
        postPayComment: '', // 后付费备注（仅后付费时填写）
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
      defaultLogo: 'https://wu-cloud.oss-cn-shanghai.aliyuncs.com/web-file/wu-logo.png'
    }
  },
  computed: {
    dialogTitle () {
      return this.isEdit
        ? this.$t('tenantDialogs.add.titleEdit')
        : this.$t('tenantDialogs.add.titleCreate')
    },
    dialogLabelWidth () {
      return this.$i18n.locale === 'en' ? '128px' : '100px'
    },
    rules () {
      const nameTrigger = this.mysoftEnabled ? 'change' : 'blur'
      const nameRules = [
        {
          required: true,
          message: this.$t('tenantDialogs.add.ruleNameRequired'),
          trigger: nameTrigger
        },
        { max: 50, message: this.$t('tenantDialogs.add.ruleNameMax'), trigger: nameTrigger }
      ]

      return {
        name: nameRules,
        publicArea: [
          { required: true, message: this.$t('tenantDialogs.add.ruleAreaRequired'), trigger: 'blur' }
        ],
        tenantType: [
          { required: true, message: this.$t('tenantDialogs.add.ruleTenantTypeRequired'), trigger: 'change' }
        ],
        postPayComment: [
          { validator: this.validatePostPayComment, trigger: 'blur' }
        ]
      }
    },
    phoneRules () {
      return [{ validator: this.validatePhoneRule, trigger: 'blur' }]
    },
    dialogVisible: {
      get () {
        return this.visible
      },
      set (val) {
        this.$emit('update:visible', val)
      }
    },
    isEdit () {
      return !!this.form.id
    }
  },
  watch: {
    visible (val) {
      if (val) {
        this.initForm()
        if (this.mysoftEnabled) {
          this.loadMysoftOptions()
        }
      }
    }
  },
  methods: {
    validatePhoneRule (rule, value, callback) {
      if (!value) {
        callback()
        return
      }
      const phoneReg = /^1[3-9]\d{9}$/
      if (!phoneReg.test(value)) {
        callback(new Error(this.$t('tenantDialogs.add.rulePhone')))
      } else {
        callback()
      }
    },

    // 后付费备注校验（仅后付费时必填）
    validatePostPayComment (rule, value, callback) {
      if (this.form.payType === 1 && !String(value || '').trim()) {
        callback(new Error(this.$t('tenantDialogs.add.rulePostPayCommentRequired')))
      } else {
        callback()
      }
    },

    // 初始化表单
    initForm () {
      if (this.tenantData && this.tenantData.id) {
        const resourceList = Array.isArray(this.tenantData.resourceList)
          ? this.tenantData.resourceList.map(item => ({ ...item }))
          : []
        // 编辑模式
        this.form = {
          ...this.tenantData,
          phoneList: this.tenantData.phoneList && this.tenantData.phoneList.length > 0
            ? this.tenantData.phoneList
            : [''],
          managerId: this.managerId,
          resourceList,
          meterStatus: this.tenantData.meterStatus !== undefined
            ? this.tenantData.meterStatus
            : 1,
          waterStatus: this.tenantData.waterStatus !== undefined
            ? this.tenantData.waterStatus
            : 0,
          tenantType: this.tenantData.tenantType !== undefined
            ? this.tenantData.tenantType
            : 0,
          payType: this.tenantData.payType !== undefined
            ? this.tenantData.payType
            : 0,
          postPayComment: this.tenantData.postPayComment || '',
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
          resourceList: [],
          tenantType: 0, // 默认租户
          payType: 0, // 默认预付费
          postPayComment: '',
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

      this.selectedResourceGUIDs = this.form.resourceList
        .map(item => item && item.resourceGUID)
        .filter(Boolean)

      this.$nextTick(() => {
        this.$refs.tenantForm && this.$refs.tenantForm.clearValidate()
      })
    },

    async loadMysoftOptions () {
      await Promise.all([
        this.fetchRenterOptions(),
        this.fetchResourceOptions()
      ])
    },

    async fetchRenterOptions () {
      this.renterLoading = true
      try {
        const response = await mingYuanRenterPage({
          managerId: this.managerId,
          pageIndex: 0,
          pageSize: 2000
        })
        if (response.code === 200) {
          const items = response.data && Array.isArray(response.data.items)
            ? response.data.items
            : []
          this.renterOptions = [...items]
          if (
            this.form.name &&
            !this.renterOptions.some(item => item.renterName === this.form.name)
          ) {
            this.renterOptions.unshift({
              renterId: `existing-${this.form.name}`,
              renterName: this.form.name
            })
          }
        }
      } catch (error) {
        console.error('获取明源客户列表失败:', error)
        this.$message.error(this.$t('tenantDialogs.add.msgRenterLoadFail'))
      } finally {
        this.renterLoading = false
      }
    },

    async fetchResourceOptions () {
      this.resourceLoading = true
      try {
        const data = {
          keyword: '',
          managerId: this.managerId,
          pageIndex: 0,
          pageSize: 2000
        }
        if (this.isEdit) {
          data.tenantId = this.form.id
        }
        const response = await mingYuanResourcePage(data)
        if (response.code === 200) {
          const items = response.data && Array.isArray(response.data.items)
            ? response.data.items
            : []
          const optionMap = new Map(items.map(item => [item.resourceGUID, { ...item }]))
          this.form.resourceList.forEach(item => {
            if (item && item.resourceGUID) {
              optionMap.set(item.resourceGUID, {
                ...item,
                ...optionMap.get(item.resourceGUID),
                isBound: 0
              })
            }
          })
          this.resourceOptions = Array.from(optionMap.values())
        }
      } catch (error) {
        console.error('获取明源资源列表失败:', error)
        this.$message.error(this.$t('tenantDialogs.add.msgResourceLoadFail'))
      } finally {
        this.resourceLoading = false
      }
    },

    renterOptionLabel (item) {
      return item.renterName || '-'
    },

    resourceOptionLabel (item) {
      return item.resourceName || item.resourceNo || item.resourceFullName || item.resourceGUID
    },

    resourceOptionTitle (item) {
      if (!this.isResourceBound(item)) return this.resourceOptionLabel(item)
      return this.$t('tenantDialogs.add.resourceBoundBy', {
        name: item.boundTenantName || '-'
      })
    },

    isResourceBound (item) {
      return Number(item && item.isBound) === 1
    },

    buildResourceList () {
      const existingMap = new Map(
        this.form.resourceList
          .filter(item => item && item.resourceGUID)
          .map(item => [item.resourceGUID, item])
      )
      const optionMap = new Map(
        this.resourceOptions
          .filter(item => item && item.resourceGUID)
          .map(item => [item.resourceGUID, item])
      )

      return this.selectedResourceGUIDs.map(resourceGUID => {
        const existing = existingMap.get(resourceGUID) || {}
        const resource = optionMap.get(resourceGUID) || {}
        const dto = {
          buildingName: resource.buildingName || existing.buildingName || '',
          floorName: resource.floorName || existing.floorName || '',
          managerId: this.managerId,
          resourceGUID,
          resourceName: resource.resourceName || existing.resourceName || resource.resourceFullName || ''
        }
        if (this.isEdit) {
          dto.tenantId = this.form.id
        }
        if (existing.id !== undefined && existing.id !== null) {
          dto.id = existing.id
        }
        return dto
      })
    },

    // 添加手机号
    addPhone () {
      this.form.phoneList.push('')
    },

    // 删除手机号
    removePhone (index) {
      this.form.phoneList.splice(index, 1)
    },

    // 关闭弹窗
    handleClose () {
      this.form = {
        id: '',
        name: '',
        publicArea: '',
        phoneList: [''],
        logoUrl: '',
        managerId: '',
        resourceList: [],
        tenantType: 0,
        payType: 0,
        postPayComment: '',
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
      this.renterOptions = []
      this.resourceOptions = []
      this.selectedResourceGUIDs = []
    },

    // 提交表单
    async handleSubmit () {
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
                overdraw: parseAmount(this.form.meterAccount.overdraw)
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
                overdraw: parseAmount(this.form.waterAccount.overdraw)
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
              tenantType: this.form.tenantType, // 租户类型
              payType: this.form.payType, // 付费模式
              postPayComment: this.form.payType === 1 ? this.form.postPayComment : '', // 后付费备注（仅后付费时传）
              meterStatus: this.form.meterStatus, // 电费开关在外层
              waterStatus: this.form.waterStatus, // 水费开关在外层
              meterAccountDto: meterAccountDto,
              waterAccountDto: waterAccountDto
            }

            if (this.mysoftEnabled) {
              params.resourceList = this.buildResourceList()
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
              this.$message.success(this.isEdit ? this.$t('tenantDialogs.add.msgEditOk') : this.$t('tenantDialogs.add.msgCreateOk'))
              this.$emit('success')
              this.dialogVisible = false
            }
          } catch (error) {
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

.mysoft-field {
  width: 100%;
}

.resource-select {
  ::v-deep .el-select__tags {
    display: flex;
    flex-wrap: nowrap;
    max-width: calc(100% - 34px) !important;
    overflow: hidden;
  }

  ::v-deep .el-tag:first-child {
    display: inline-flex;
    min-width: 0;
    max-width: calc(100% - 48px);
    align-items: center;
  }

  ::v-deep .el-select__tags-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  ::v-deep .el-tag__close {
    flex-shrink: 0;
  }
}

.resource-option-label {
  display: inline-block;
  max-width: calc(100% - 70px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.resource-bound-tag {
  float: right;
  color: #c0c4cc;
  font-size: 12px;
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
      width: 80px !important;
    }

    ::v-deep .el-form-item__content {
      margin-left: 80px !important;
    }

    ::v-deep .el-input-group__append {
      min-width: 36px;
      padding: 0 10px;
      text-align: center;
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
