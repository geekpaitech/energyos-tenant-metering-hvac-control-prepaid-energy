<template>
    <el-dialog
      title="租户缴费二维码"
      :visible.sync="dialogVisible"
      width="400px"
      center
      class="custom-dialog qrcode-dialog"
    >
      <div class="qrcode-container">
        <div class="qrcode-info">
          <h3>{{ tenantData.name }}</h3>
          <p>租户编号：{{ tenantData.id }}</p>
          <p v-if="tenantData.phoneList && tenantData.phoneList[0]">
            联系电话：{{ formatPhoneList(tenantData.phoneList) }}
          </p>
        </div>
        
        <div class="qrcode-wrapper">
          <!-- 如果有实际的二维码组件，可以在这里使用 -->
          <!-- <qrcode-vue :value="qrcodeValue" :size="180" level="M" /> -->
          
          <!-- 临时占位 -->
          <div class="qrcode-placeholder">
            <i class="el-icon-s-grid"></i>
            <p>二维码</p>
          </div>
        </div>
        
        <div class="qrcode-tips">
          <p>请租户扫描此二维码进行缴费</p>
          <p>二维码包含租户ID：{{ tenantData.id }}</p>
        </div>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleDownload">下载二维码</el-button>
        <el-button @click="dialogVisible = false">关 闭</el-button>
      </span>
    </el-dialog>
  </template>
  
  <script>
  // 如果需要使用实际的二维码生成库，可以安装并导入
  // import QrcodeVue from 'qrcode.vue'
  
  export default {
    name: 'QrcodeDialog',
    // components: {
    //   QrcodeVue
    // },
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      tenantData: {
        type: Object,
        default: () => ({})
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
      // 二维码内容
      qrcodeValue() {
        // 这里应该根据实际业务生成二维码内容
        // 例如：包含租户ID的支付链接
        return `https://pay.example.com/tenant/${this.tenantData.id}`
      }
    },
    methods: {
      // 格式化电话列表
      formatPhoneList(phoneList) {
        if (!phoneList || phoneList.length === 0) return '-'
        return phoneList.filter(phone => phone).join('、') || '-'
      },
      
      // 下载二维码
      handleDownload() {
        // 实现二维码下载功能
        // 如果使用了实际的二维码组件，可以通过canvas获取图片并下载
        this.$message.info('二维码下载功能开发中...')
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .qrcode-dialog {
    ::v-deep .el-dialog__body {
      padding: 30px 20px;
    }
  }
  
  .qrcode-container {
    text-align: center;
    
    .qrcode-info {
      margin-bottom: 20px;
      
      h3 {
        font-size: 18px;
        color: #303133;
        margin-bottom: 12px;
        font-weight: 500;
      }
      
      p {
        color: #606266;
        margin: 6px 0;
        font-size: 14px;
      }
    }
    
    .qrcode-wrapper {
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }
    
    .qrcode-placeholder {
      width: 180px;
      height: 180px;
      border: 1px solid #dcdfe6;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      background: #f5f7fa;
      
      i {
        font-size: 48px;
        color: #c0c4cc;
        margin-bottom: 8px;
      }
      
      p {
        color: #909399;
        font-size: 14px;
        margin: 0;
      }
    }
    
    .qrcode-tips {
      margin-top: 20px;
      
      p {
        color: #909399;
        font-size: 13px;
        margin: 4px 0;
        
        &:first-child {
          color: #606266;
          font-size: 14px;
        }
      }
    }
  }
  </style>