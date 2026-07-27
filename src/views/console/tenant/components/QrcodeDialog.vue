<template>
  <el-dialog
    :title="$t('tenantDialogs.qrcode.title')"
    :visible.sync="dialogVisible"
    width="500px"
    center
    :close-on-click-modal="false"
    @close="handleClose"
    class="custom-dialog qrcode-dialog"
  >
    <div class="qrcode-container">
      <div class="qrcode-wrapper">
        <div v-if="!qrcodeGenerated" class="qrcode-loading">
          <i class="el-icon-loading"></i>
          <p>{{ $t('tenantDialogs.qrcode.loading') }}</p>
        </div>

        <div v-show="qrcodeGenerated" class="qrcode-content-wrapper">
          <div class="qrcode-label">
            <div class="label-row">
              <span class="label-key">{{ $t('tenantListPage.qrCanvasLabelTenantId') }}</span>
              <span class="label-value">{{ tenantData.id }}</span>
            </div>
            <div class="label-row">
              <span class="label-key">{{ $t('tenantListPage.qrCanvasLabelTenantName') }}</span>
              <span class="label-value">{{ displayTenantName }}</span>
            </div>
          </div>

          <div ref="qrcodeContainer" class="qrcode-content"></div>

          <div class="qrcode-footer">
            <p>{{ $t('tenantListPage.qrCanvasScanHint') }}</p>
          </div>
        </div>
      </div>

      <div class="qrcode-tips">
        <p class="primary-tip">{{ $t('tenantDialogs.qrcode.bindTipPrimary') }}</p>
        <p class="secondary-tip">{{ $t('tenantDialogs.qrcode.bindTipLink') }}{{ qrcodeValue }}</p>
        <p v-if="qrcodeValue" class="qrcode-url">
          <el-button
            type="text"
            size="small"
            icon="el-icon-document-copy"
            @click="handleCopyUrl"
          >
            {{ $t('tenantDialogs.qrcode.copyLink') }}
          </el-button>
        </p>
      </div>
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button type="primary" icon="el-icon-download" @click="handleDownload">
        {{ $t('tenantDialogs.qrcode.download') }}
      </el-button>
      <el-button @click="dialogVisible = false">{{ $t('tenantDialogs.qrcode.close') }}</el-button>
    </span>
  </el-dialog>
</template>

<script>
import QRCode from 'qrcodejs2'

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
  data () {
    return {
      qrcodeInstance: null,
      qrcodeGenerated: false,
      qrcodeValue: ''
    }
  },
  computed: {
    dialogVisible: {
      get () {
        return this.visible
      },
      set (val) {
        this.$emit('update:visible', val)
      }
    },
    displayTenantName () {
      const raw = (this.tenantData.name || '').trim()
      if (!raw) return this.$t('tenantListPage.unnamed')
      return this.$displayBizHybrid(raw)
    }
  },
  watch: {
    visible (val) {
      if (val && this.tenantData.id) {
        this.$nextTick(() => {
          setTimeout(() => {
            this.generateQrcode()
          }, 100)
        })
      }
    }
  },
  methods: {
    generateQrcode () {
      if (this.qrcodeInstance) {
        this.$refs.qrcodeContainer.innerHTML = ''
        this.qrcodeInstance = null
      }

      this.qrcodeGenerated = false

      this.qrcodeValue = `https://example.com/wx/ebc/?tenantId=${this.tenantData.id}`

      this.$nextTick(() => {
        try {
          this.qrcodeInstance = new QRCode(this.$refs.qrcodeContainer, {
            text: this.qrcodeValue,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
          })

          this.qrcodeGenerated = true
        } catch (error) {
          console.error('生成二维码失败:', error)
          this.$apiError.notify(error, this.$t('tenantDialogs.qrcode.msgGenFail'))
          this.qrcodeGenerated = false
        }
      })
    },

    handleCopyUrl () {
      const input = document.createElement('input')
      input.value = this.qrcodeValue
      document.body.appendChild(input)
      input.select()

      try {
        document.execCommand('copy')
        this.$message.success(this.$t('tenantDialogs.qrcode.msgCopyOk'))
      } catch (error) {
        this.$apiError.notify(error, this.$t('tenantDialogs.qrcode.msgCopyFail'))
      }

      document.body.removeChild(input)
    },

    canvasDisplayName () {
      const raw = (this.tenantData.name || '').trim()
      if (!raw) return this.$t('tenantListPage.unnamed')
      return this.$displayBizHybrid(raw, 80)
    },

    safeFileNamePart () {
      return String(this.canvasDisplayName())
        .replace(/[/\\?%*:|"<>]/g, '_')
        .replace(/\s+/g, '_')
    },

    handleDownload () {
      try {
        const canvas = this.$refs.qrcodeContainer.querySelector('canvas')
        if (!canvas) {
          this.$message.error(this.$t('tenantDialogs.qrcode.msgNotReady'))
          return
        }

        const newCanvas = document.createElement('canvas')
        const ctx = newCanvas.getContext('2d')

        const padding = 30
        const qrSize = 200
        const topHeight = 80
        const bottomHeight = 40

        newCanvas.width = qrSize + padding * 2
        newCanvas.height = qrSize + topHeight + bottomHeight + padding * 2

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height)

        const topY = padding

        ctx.fillStyle = '#f6f8fb'
        ctx.fillRect(padding, topY, qrSize, topHeight)

        ctx.strokeStyle = '#e4e7ed'
        ctx.lineWidth = 1
        ctx.strokeRect(padding, topY, qrSize, topHeight)

        ctx.fillStyle = '#606266'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(this.$t('tenantListPage.qrCanvasLabelTenantId'), padding + 15, topY + 25)

        ctx.fillStyle = '#303133'
        ctx.font = 'bold 16px Arial'
        ctx.fillText(String(this.tenantData.id), padding + 80, topY + 25)

        ctx.fillStyle = '#606266'
        ctx.font = 'bold 14px Arial'
        ctx.fillText(this.$t('tenantListPage.qrCanvasLabelTenantName'), padding + 15, topY + 55)

        ctx.fillStyle = '#303133'
        ctx.font = 'bold 16px Arial'
        const maxNameWidth = qrSize - 95
        let tenantName = this.canvasDisplayName()
        let nameWidth = ctx.measureText(tenantName).width

        if (nameWidth > maxNameWidth) {
          while (nameWidth > maxNameWidth && tenantName.length > 0) {
            tenantName = tenantName.slice(0, -1)
            nameWidth = ctx.measureText(tenantName + '...').width
          }
          tenantName += '...'
        }

        ctx.fillText(tenantName, padding + 80, topY + 55)

        const qrY = topY + topHeight + 15
        ctx.drawImage(canvas, padding, qrY)

        ctx.strokeStyle = '#e4e7ed'
        ctx.lineWidth = 2
        ctx.strokeRect(padding - 1, qrY - 1, qrSize + 2, qrSize + 2)

        const bottomY = qrY + qrSize + 20
        ctx.fillStyle = '#909399'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(this.$t('tenantListPage.qrCanvasScanHint'), newCanvas.width / 2, bottomY)

        newCanvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          const fileName = `${this.$t('tenantListPage.qrcodeDownloadPrefix')}${this.tenantData.id}-${this.safeFileNamePart()}.png`

          link.href = url
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)

          this.$message.success(this.$t('tenantDialogs.qrcode.msgDownloadOk'))
        })
      } catch (error) {
        console.error('下载失败:', error)
        this.$apiError.notify(error, this.$t('tenantDialogs.qrcode.msgDownloadFail'))
      }
    },

    handleClose () {
      if (this.qrcodeInstance) {
        this.$refs.qrcodeContainer.innerHTML = ''
        this.qrcodeInstance = null
      }
      this.qrcodeGenerated = false
      this.qrcodeValue = ''
    }
  }
}
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

    .qrcode-content-wrapper {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      overflow: hidden;
      display: inline-block;

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
