<template>
  <el-dialog
    title="二维码"
    :visible.sync="dialogVisible"
    width="500px"
    center
    :close-on-click-modal="false"
    @close="handleClose"
    class="custom-dialog qrcode-dialog"
  >
    <div class="qrcode-container">
      <!-- 租户信息 -->
      <!-- <div class="qrcode-info">
        <h3>{{ tenantData.name }}</h3>
        <p>租户编号：{{ tenantData.id }}</p>
        <p v-if="tenantData.phoneList && tenantData.phoneList[0]">
          联系电话：{{ formatPhoneList(tenantData.phoneList) }}
        </p>
        <p v-if="tenantData.balance !== undefined" class="balance-info">
          账户余额：<span :class="getBalanceClass(tenantData.balance)">¥{{ formatBalance(tenantData.balance) }}</span>
        </p>
      </div> -->
      
      <!-- 二维码展示区 -->
      <div class="qrcode-wrapper">
        <!-- 加载中状态 -->
        <div v-if="!qrcodeGenerated" class="qrcode-loading">
          <i class="el-icon-loading"></i>
          <p>生成二维码中...</p>
        </div>
        
        <!-- 二维码容器 - 包含租户信息 -->
        <div v-show="qrcodeGenerated" class="qrcode-content-wrapper">
          <!-- 租户信息标签 -->
          <div class="qrcode-label">
            <div class="label-row">
              <span class="label-key">租户ID:</span>
              <span class="label-value">{{ tenantData.id }}</span>
            </div>
            <div class="label-row">
              <span class="label-key">租户名:</span>
              <span class="label-value">{{ tenantData.name }}</span>
            </div>
          </div>
          
          <!-- 二维码 -->
          <div ref="qrcodeContainer" class="qrcode-content"></div>
          
          <!-- 扫码提示 -->
          <div class="qrcode-footer">
            <p>请扫码绑定</p>
          </div>
        </div>
      </div>
      
      <!-- 提示信息 -->
      <div class="qrcode-tips">
        <p class="primary-tip">请租户扫描此二维码进行绑定</p>
        <p class="secondary-tip">链接：{{ qrcodeValue }}</p>
        <p v-if="qrcodeValue" class="qrcode-url">
          <el-button 
            type="text" 
            size="small" 
            icon="el-icon-document-copy"
            @click="handleCopyUrl"
          >
            复制链接
          </el-button>
        </p>
      </div>
    </div>
    
    <span slot="footer" class="dialog-footer">
      <el-button type="primary" icon="el-icon-download" @click="handleDownload">
        下载二维码
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </span>
  </el-dialog>
</template>

<script>
import QRCode from 'qrcodejs2';

export default {
  name: 'QrcodeDialog',
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
  data() {
    return {
      qrcodeInstance: null,
      qrcodeGenerated: false,
      qrcodeValue: ''
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit('update:visible', val);
      }
    }
  },
  watch: {
    visible(val) {
      if (val && this.tenantData.id) {
        // 延迟生成二维码，确保DOM已渲染
        this.$nextTick(() => {
          setTimeout(() => {
            this.generateQrcode();
          }, 100);
        });
      }
    }
  },
  methods: {
    // 生成二维码
    generateQrcode() {
      // 清除之前的二维码
      if (this.qrcodeInstance) {
        this.$refs.qrcodeContainer.innerHTML = '';
        this.qrcodeInstance = null;
      }
      
      this.qrcodeGenerated = false;

      // 构建二维码URL - 使用新的URL格式
      this.qrcodeValue = `https://geekpartytech.com/wx/ebc/?tenantId=${this.tenantData.id}`;

      // 生成二维码
      this.$nextTick(() => {
        try {
          this.qrcodeInstance = new QRCode(this.$refs.qrcodeContainer, {
            text: this.qrcodeValue,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H // 高容错率
          });
          
          this.qrcodeGenerated = true;
          console.log('二维码生成成功:', this.qrcodeValue);
        } catch (error) {
          console.error('生成二维码失败:', error);
          this.$message.error('生成二维码失败，请重试');
          this.qrcodeGenerated = false;
        }
      });
    },

    // 格式化电话列表
    formatPhoneList(phoneList) {
      if (!phoneList || phoneList.length === 0) return '-';
      return phoneList.filter(phone => phone).join('、') || '-';
    },

    // 格式化余额
    formatBalance(balance) {
      return (balance || 0).toFixed(2);
    },

    // 获取余额样式类
    getBalanceClass(balance) {
      if (balance < 0) return 'balance-danger';
      if (balance < 100) return 'balance-warning';
      return 'balance-success';
    },

    // 复制链接
    handleCopyUrl() {
      const input = document.createElement('input');
      input.value = this.qrcodeValue;
      document.body.appendChild(input);
      input.select();
      
      try {
        document.execCommand('copy');
        this.$message.success('链接已复制到剪贴板');
      } catch (error) {
        this.$message.error('复制失败，请手动复制');
      }
      
      document.body.removeChild(input);
    },
    
    // 下载二维码 - 包含租户信息
    handleDownload() {
      try {
        const canvas = this.$refs.qrcodeContainer.querySelector('canvas');
        if (!canvas) {
          this.$message.error('二维码尚未生成，请稍候');
          return;
        }

        // 创建新canvas，包含租户信息
        const newCanvas = document.createElement('canvas');
        const ctx = newCanvas.getContext('2d');
        
        // 设置画布尺寸 (二维码 + 上下文字区域 + 边距)
        const padding = 30;
        const qrSize = 200;
        const topHeight = 80; // 顶部信息区高度
        const bottomHeight = 40; // 底部提示区高度
        
        newCanvas.width = qrSize + padding * 2;
        newCanvas.height = qrSize + topHeight + bottomHeight + padding * 2;

        // 填充白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

        // 绘制顶部租户信息区域
        const topY = padding;
        
        // 绘制背景色
        ctx.fillStyle = '#f6f8fb';
        ctx.fillRect(padding, topY, qrSize, topHeight);
        
        // 绘制边框
        ctx.strokeStyle = '#e4e7ed';
        ctx.lineWidth = 1;
        ctx.strokeRect(padding, topY, qrSize, topHeight);
        
        // 绘制租户ID
        ctx.fillStyle = '#606266';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('租户ID:', padding + 15, topY + 25);
        
        ctx.fillStyle = '#303133';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(String(this.tenantData.id), padding + 80, topY + 25);
        
        // 绘制租户名称
        ctx.fillStyle = '#606266';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('租户名:', padding + 15, topY + 55);
        
        ctx.fillStyle = '#303133';
        ctx.font = 'bold 16px Arial';
        // 截断过长的名称
        const maxNameWidth = qrSize - 95;
        let tenantName = this.tenantData.name || '未命名';
        let nameWidth = ctx.measureText(tenantName).width;
        
        if (nameWidth > maxNameWidth) {
          while (nameWidth > maxNameWidth && tenantName.length > 0) {
            tenantName = tenantName.slice(0, -1);
            nameWidth = ctx.measureText(tenantName + '...').width;
          }
          tenantName += '...';
        }
        
        ctx.fillText(tenantName, padding + 80, topY + 55);

        // 绘制二维码（居中）
        const qrY = topY + topHeight + 15;
        ctx.drawImage(canvas, padding, qrY);
        
        // 绘制二维码边框
        ctx.strokeStyle = '#e4e7ed';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding - 1, qrY - 1, qrSize + 2, qrSize + 2);

        // 绘制底部提示文字
        const bottomY = qrY + qrSize + 20;
        ctx.fillStyle = '#909399';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('请扫码绑定', newCanvas.width / 2, bottomY);

        // 转换为图片并下载
        newCanvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const fileName = `租户二维码-${this.tenantData.id}-${this.tenantData.name || '未命名'}.png`;
          
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          this.$message.success('二维码下载成功');
        });
      } catch (error) {
        console.error('下载失败:', error);
        this.$message.error('下载失败，请重试');
      }
    },

    // 关闭弹窗
    handleClose() {
      // 清理二维码实例
      if (this.qrcodeInstance) {
        this.$refs.qrcodeContainer.innerHTML = '';
        this.qrcodeInstance = null;
      }
      this.qrcodeGenerated = false;
      this.qrcodeValue = '';
    }
  }
};
</script>

<style lang="scss" scoped>
.qrcode-dialog {
  ::v-deep .el-dialog__body {
    padding: 30px 20px;
  }

  ::v-deep .el-dialog__header {
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 15px;
  }
}

.qrcode-container {
  text-align: center;
  
  // 租户信息区域
  .qrcode-info {
    margin-bottom: 24px;
    padding: 16px;
    background: linear-gradient(135deg, #f6f8fb 0%, #fff 100%);
    border-radius: 8px;
    
    h3 {
      font-size: 18px;
      color: #303133;
      margin: 0 0 12px 0;
      font-weight: 600;
    }
    
    p {
      color: #606266;
      margin: 8px 0;
      font-size: 14px;
      line-height: 1.6;

      &.balance-info {
        font-weight: 500;
        margin-top: 12px;
        
        .balance-success {
          color: #67c23a;
          font-weight: 600;
        }
        
        .balance-warning {
          color: #e6a23c;
          font-weight: 600;
        }
        
        .balance-danger {
          color: #f56c6c;
          font-weight: 600;
        }
      }
    }
  }
  
  // 二维码展示区域
  .qrcode-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 24px 0;
    min-height: 360px;
    background: #fafbfc;
    border-radius: 12px;
    padding: 20px;
    border: 2px dashed #e4e7ed;

    // 加载中状态
    .qrcode-loading {
      text-align: center;
      color: #909399;
      
      i {
        font-size: 36px;
        margin-bottom: 12px;
        display: block;
      }
      
      p {
        margin: 0;
        font-size: 14px;
      }
    }

    // 二维码内容包装器 - 包含标签、二维码、底部文字
    .qrcode-content-wrapper {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      overflow: hidden;
      display: inline-block;

      // 顶部标签区域
      .qrcode-label {
        background: linear-gradient(135deg, #f6f8fb 0%, #fff 100%);
        padding: 16px 20px;
        border-bottom: 1px solid #e4e7ed;

        .label-row {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin: 6px 0;
          font-size: 14px;

          .label-key {
            color: #606266;
            font-weight: 600;
            min-width: 70px;
            text-align: left;
          }

          .label-value {
            color: #303133;
            font-weight: 700;
            margin-left: 8px;
            flex: 1;
            text-align: left;
          }
        }
      }

      // 二维码内容
      .qrcode-content {
        padding: 20px;
        background: white;
        display: flex;
        justify-content: center;
        align-items: center;

        ::v-deep canvas {
          display: block;
          border-radius: 4px;
          border: 2px solid #f0f0f0;
        }
      }

      // 底部提示
      .qrcode-footer {
        background: linear-gradient(135deg, #fff 0%, #f6f8fb 100%);
        padding: 12px;
        border-top: 1px solid #e4e7ed;

        p {
          margin: 0;
          color: #909399;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.5px;
        }
      }
    }
  }
  
  // 提示信息
  .qrcode-tips {
    margin-top: 24px;
    padding: 16px;
    background: #ecf5ff;
    border-radius: 8px;
    border-left: 4px solid #409eff;
    
    p {
      margin: 6px 0;
      
      &.primary-tip {
        color: #303133;
        font-size: 14px;
        font-weight: 500;
      }
      
      &.secondary-tip {
        color: #606266;
        font-size: 12px;
        word-break: break-all;
      }

      &.qrcode-url {
        margin-top: 12px;
        
        .el-button {
          color: #409eff;
          font-size: 13px;
          padding: 0;
          
          &:hover {
            color: #66b1ff;
          }
        }
      }
    }
  }
}

// 底部按钮
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;

  .el-button {
    min-width: 100px;
  }
}
</style>