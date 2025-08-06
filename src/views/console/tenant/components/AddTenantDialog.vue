<template>
    <el-dialog
      :title="isEdit ? '编辑租户' : '新增租户'"
      :visible.sync="dialogVisible"
      width="600px"
      :close-on-click-modal="false"
      class="custom-dialog"
      @close="handleClose"
    >
      <el-form
        ref="tenantForm"
        :model="form"
        :rules="rules"
        label-width="110px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="租户名" prop="name">
              <el-input 
                v-model="form.name" 
                placeholder="请输入租户名"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公摊面积" prop="publicArea">
              <el-input 
                v-model="form.publicArea" 
                placeholder="请输入公摊面积"
              >
                <template slot="suffix">m²</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
  
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话1">
              <el-input 
                v-model="form.phoneList[0]" 
                placeholder="请输入联系电话"
                maxlength="11"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话2">
              <el-input 
                v-model="form.phoneList[1]" 
                placeholder="请输入联系电话"
                maxlength="11"
              />
            </el-form-item>
          </el-col>
        </el-row>
  
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预警金额1" prop="alarmBalance1">
              <el-input-number
                v-model="form.alarmBalance1"
                :min="0"
                :precision="2"
                placeholder="请输入预警金额"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预警金额2" prop="alarmBalance2">
              <el-input-number
                v-model="form.alarmBalance2"
                :min="0"
                :precision="2"
                placeholder="请输入预警金额"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
  
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="银行账户">
              <el-input 
                v-model="form.bankNumber" 
                placeholder="请输入银行账户"
                maxlength="30"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="银行行号">
              <el-input 
                v-model="form.payeeBankNo" 
                placeholder="请输入银行行号"
                maxlength="20"
              />
            </el-form-item>
          </el-col>
        </el-row>
  
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="打款人姓名">
              <el-input 
                v-model="form.payeeName" 
                placeholder="请输入打款人姓名"
                maxlength="30"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标签">
              <el-select
                v-model="form.labelIds"
                multiple
                placeholder="请选择标签"
                style="width: 100%"
              >
                <el-option
                  v-for="item in labelList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
  
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="透支金额">
              <el-input-number
                v-model="form.overdraw"
                :min="0"
                :precision="2"
                placeholder="请输入透支金额"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="租户logo">
              <el-upload
                class="avatar-uploader"
                action=""
                :show-file-list="false"
                :before-upload="beforeUpload"
                :http-request="handleUpload"
              >
                <img v-if="form.logoUrl" :src="form.logoUrl" class="avatar">
                <i v-else class="el-icon-plus avatar-uploader-icon"></i>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
  
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ submitting ? '保存中...' : '确 定' }}
        </el-button>
      </span>
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
        type: String,
        default: ''
      }
    },
    data() {
      return {
        submitting: false,
        form: {
          id: '',
          name: '',
          publicArea: '',
          phoneList: ['', ''],
          alarmBalance1: null,
          alarmBalance2: null,
          bankNumber: '',
          payeeBankNo: '',
          payeeName: '',
          labelIds: [],
          overdraw: null,
          logoUrl: '',
          managerId: ''
        },
        rules: {
          name: [
            { required: true, message: '请输入租户名', trigger: 'blur' },
            { max: 50, message: '租户名不能超过50个字符', trigger: 'blur' }
          ],
          publicArea: [
            { required: true, message: '请输入公摊面积', trigger: 'blur' }
          ]
        },
        // 默认logo
        defaultLogo: 'https://ebc-cloud.oss-cn-shanghai.aliyuncs.com/ebc-img/logo_202204181749.jpg'
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
            phoneList: this.tenantData.phoneList || ['', ''],
            labelIds: this.tenantData.labelList ? 
              this.tenantData.labelList.map(item => item.id) : [],
            managerId: this.managerId
          }
        } else {
          // 新增模式
          this.form = {
            id: '',
            name: '',
            publicArea: '',
            phoneList: ['', ''],
            alarmBalance1: null,
            alarmBalance2: null,
            bankNumber: '',
            payeeBankNo: '',
            payeeName: '',
            labelIds: [],
            overdraw: null,
            logoUrl: '',
            managerId: this.managerId
          }
        }
        
        this.$nextTick(() => {
          this.$refs.tenantForm && this.$refs.tenantForm.clearValidate()
        })
      },
      
      // 关闭弹窗
      handleClose() {
        this.form = {
          id: '',
          name: '',
          publicArea: '',
          phoneList: ['', ''],
          alarmBalance1: null,
          alarmBalance2: null,
          bankNumber: '',
          payeeBankNo: '',
          payeeName: '',
          labelIds: [],
          overdraw: null,
          logoUrl: '',
          managerId: ''
        }
      },
      
      // 上传前检查
      beforeUpload(file) {
        const isImage = file.type.indexOf('image/') === 0
        const isLt2M = file.size / 1024 / 1024 < 2
        
        if (!isImage) {
          this.$message.error('只能上传图片文件!')
        }
        if (!isLt2M) {
          this.$message.error('上传图片大小不能超过 2MB!')
        }
        return isImage && isLt2M
      },
      
      // 自定义上传
      handleUpload(params) {
        // 这里应该调用实际的上传接口
        // 暂时使用FileReader模拟
        const reader = new FileReader()
        reader.onload = (e) => {
          this.form.logoUrl = e.target.result
        }
        reader.readAsDataURL(params.file)
      },
      
      // 提交表单
      async handleSubmit() {
        this.$refs.tenantForm.validate(async (valid) => {
          if (valid) {
            this.submitting = true
            
            try {
              // 处理标签数据
              const labelList = this.form.labelIds.map(id => {
                const label = this.labelList.find(item => item.id === id)
                return label || { id }
              })
              
              // 设置默认logo
              if (!this.form.logoUrl) {
                this.form.logoUrl = this.defaultLogo
              }
              
              const params = {
                ...this.form,
                labelList,
                labelIds: this.form.labelIds.join(',')
              }
              
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
  .avatar-uploader {
    ::v-deep .el-upload {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      width: 80px;
      height: 80px;
      
      &:hover {
        border-color: #409EFF;
      }
    }
  }
  
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 80px;
    height: 80px;
    line-height: 80px;
    text-align: center;
  }
  
  .avatar {
    width: 80px;
    height: 80px;
    display: block;
    object-fit: cover;
  }
  </style>