<template>
    <el-drawer
      class="custom-drawer"
      :visible.sync="visible"
      size="60%"
      :before-close="handleClose"
    >
      <!-- 标题插槽 -->
      <div slot="title" class="drawer-header">
        <i class="el-icon-document"></i>
        <span>审核详情</span>
      </div>
  
      <!-- 内容区域 -->
      <div class="drawer-content" v-loading="loading">
        <!-- 审核信息 -->
        <div class="content-section">
          <div class="section-header">
            <i class="el-icon-info"></i>
            <span class="section-title">审核信息</span>
          </div>
          <div class="section-body">
            <el-table
              v-if="auditTableData.length"
              :data="auditTableData"
              style="width: 100%"
              max-height="300"
              :header-cell-style="{
                background: '#f5f7fa',
                color: '#606266',
                fontWeight: '600',
              }"
            >
              <el-table-column prop="managerName" label="项目名称" width="260" />
              <el-table-column prop="createTime" label="结算日期" width="160" />
              <el-table-column prop="occurDate" label="账单日期" width="120" />
              <el-table-column prop="updateTime" label="提现日期" width="160">
                <template slot-scope="scope">
                  {{ scope.row.updateTime || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="withdAmount" label="结算金额" width="120">
                <template slot-scope="scope">
                  ￥{{ formatAmount(scope.row.withdAmount) }}
                </template>
              </el-table-column>
              <el-table-column prop="interestRateAmt" label="手续费" width="120">
                <template slot-scope="scope">
                  ￥{{ formatAmount(scope.row.interestRateAmt) }}
                </template>
              </el-table-column>
              <el-table-column prop="balance" label="提现金额" width="120">
                <template slot-scope="scope">
                  ￥{{ formatAmount(scope.row.balance) }}
                </template>
              </el-table-column>
              <el-table-column prop="withdType" label="提现方式">
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.withdType === 0" size="small">
                   日结提现
                  </el-tag>
                  <el-tag v-else-if="scope.row.withdType === 1" size="small" type="warning">
                    余额提现
                  </el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="payType" label="资金类型">
                <template slot-scope="scope">
                  {{ getDepositTypeLabel(scope.row.payType) }}
                </template>
              </el-table-column>
            </el-table>
            <div v-else class="empty-table">
              <i class="el-icon-folder-opened"></i>
              <p>暂无数据</p>
            </div>
          </div>
        </div>
  
        <!-- 提现汇总 -->
        <div class="content-section">
          <div class="section-header">
            <i class="el-icon-s-data"></i>
            <span class="section-title">提现汇总</span>
            <div class="header-actions">
              <el-button
                v-if="!isWithdTypeOne"
                type="primary"
                size="small"
                icon="el-icon-download"
                @click="handleExportStatistics"
                :loading="exportLoading.statistics"
              >
                统计导出
              </el-button>
              <el-button
                type="primary"
                size="small"
                icon="el-icon-download"
                @click="handleExportDetail"
                :loading="exportLoading.detail"
              >
                明细导出
              </el-button>
              <el-button
                type="primary"
                size="small"
                icon="el-icon-download"
                @click="handleExportHandFee"
                :loading="exportLoading.handFee"
              >
                手续费导出
              </el-button>
            </div>
          </div>
          <div class="section-body">
            <el-table
              v-if="summaryData.length"
              :data="summaryData"
              style="width: 100%"
              :header-cell-style="{
                background: '#f5f7fa',
                color: '#606266',
                fontWeight: '600',
              }"
            >
              <el-table-column prop="totalSettleAmt" label="结算金额" width="120">
                <template slot-scope="scope">
                  ￥{{ formatAmount(scope.row.totalSettleAmt) }}
                </template>
              </el-table-column>
              <el-table-column prop="realSettleAmt" label="实际结算金额" width="120">
                <template slot-scope="scope">
                  ￥{{ formatAmount(scope.row.realSettleAmt) }}
                </template>
              </el-table-column>
              <el-table-column prop="totalHandFeeAmt" label="手续费" width="120">
                <template slot-scope="scope">
                  ￥{{ formatAmount(scope.row.totalHandFeeAmt) }}
                </template>
              </el-table-column>
              <el-table-column prop="totalWithdAmt" label="提现金额" width="120">
                <template slot-scope="scope">
                  ￥{{ formatAmount(scope.row.totalWithdAmt) }}
                </template>
              </el-table-column>
              <el-table-column
                v-if="summaryData[0] && summaryData[0]['voucherAmt'] !== undefined"
                prop="voucherAmt"
                label="手续费抵用金额"
                width="140"
              >
                <template slot-scope="scope">
                  ￥{{ formatAmount(scope.row.voucherAmt) }}
                </template>
              </el-table-column>
              <el-table-column prop="payeeName" label="收款账户名称" width="240" />
              <el-table-column prop="openBank" label="开户行" width="200" />
              <el-table-column prop="bankNumber" label="银行账号" width="200" />
            </el-table>
            <div v-else class="empty-table">
              <i class="el-icon-folder-opened"></i>
              <p>暂无数据</p>
            </div>
          </div>
        </div>
  
        <!-- 费用统计 -->
        <div class="content-section" v-if="costStatistics.length">
          <div class="section-header">
            <i class="el-icon-s-marketing"></i>
            <span class="section-title">费用统计</span>
          </div>
          <div class="section-body">
            <div class="cost-statistics">
              <div v-for="(item, index) in costStatistics" :key="index" class="cost-item">
                <span class="cost-label">{{ item.costName }}：</span>
                <span class="cost-value">￥{{ formatAmount(item.amt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </template>
  
  <script>
  // 导入API
  import {
    capitalSelectWithdApplyList,
    capitalWithdAuditSumy,
    capitalExportWithdApplyDetails,
    capitalExportWithdApplyUnified,
    capitalQueryWithdApplyResult,
    capitalQueryWithdApplyUnifiedResult
  } from '@/api/withdraw'
  
  import { getManagerById } from '@/api/manager'
  
  // 导入枚举
  import {
    WithdType,
    DepositType,
    getEnumLabel
  } from '@/utils/enums/withdraw'
  
  import Cookies from 'js-cookie'
  
  export default {
    name: 'WithdrawDetail',
    props: {
      detailDrawer: {
        type: Object,
        default() {
          return {
            show: false,
            id: '',
            managerId: '',
            rid: '',
            data: {}
          }
        }
      }
    },
    data() {
      return {
        visible: false,
        loading: false,
        auditTableData: [],
        summaryData: [],
        costStatistics: [],
        managerData: {},
        exportLoading: {
          statistics: false,
          detail: false,
          handFee: false
        },
        exportTaskId: null,
        checkExportTimer: null
      }
    },
    computed: {
      isWithdTypeOne() {
        return this.managerData.withdType === 1
      },
      getDepositTypeLabel() {
        return (value) => getEnumLabel(DepositType, value)
      }
    },
    watch: {
      'detailDrawer.show': {
        handler(val) {
          this.visible = val
          // 当弹窗显示时，调用获取数据的方法
          if (val) {
            console.log('弹窗打开，准备获取数据')
            console.log('传入参数：', this.detailDrawer)
            this.$nextTick(() => {
              this.handleOpen()
            })
          }
        },
        immediate: true
      },
      visible(val) {
        if (!val) {
          this.$emit('close')
        }
      }
    },
    beforeDestroy() {
      // 清理定时器
      if (this.checkExportTimer) {
        clearInterval(this.checkExportTimer)
        this.checkExportTimer = null
      }
    },
    methods: {
      // 打开弹窗
      async handleOpen() {
        this.loading = true
        try {
          // 并行请求接口数据
          await Promise.all([
            this.fetchAuditData(),
            this.fetchSummaryData(),
            this.fetchManagerData()
          ])
          // 处理费用统计（非异步）
          this.fetchCostStatistics()
        } catch (error) {
          console.error('获取详情数据失败:', error)
          this.$message.error('获取详情数据失败')
        } finally {
          this.loading = false
        }
      },
  
      // 关闭弹窗
      handleClose() {
        this.visible = false
      },
  
      // 获取审核信息数据
      async fetchAuditData() {
        try {
          const response = await capitalSelectWithdApplyList({
            withdApplyIds: this.detailDrawer.id
          })
          
          if (response.code === 200 && response.data) {
            this.auditTableData = response.data
          } else {
            this.auditTableData = []
          }
        } catch (error) {
          console.error('获取审核信息失败:', error)
          this.auditTableData = []
        }
      },
  
      // 获取提现汇总数据
      async fetchSummaryData() {
        try {
          const params = {
            withdApplyIds: this.detailDrawer.id,
            managerId: this.detailDrawer.managerId,
            auditSumyId: this.detailDrawer.rid
          }
          
          const response = await capitalWithdAuditSumy(params)
          
          if (response.code === 200 && response.data) {
            const data = response.data
            this.summaryData = [{
              bankNumber: data.bankNumber || '-',
              managerName: data.managerName || '-',
              openBank: data.openBank || '-',
              payeeName: data.payeeName || '-',
              realSettleAmt: data.realSettleAmt,
              totalHandFeeAmt: data.totalHandFeeAmt,
              totalSettleAmt: data.totalSettleAmt,
              billOpenBank: data.billOpenBank,
              totalWithdAmt: data.totalWithdAmt,
              transferStatus: data.transferStatus,
              voucherAmt: data.voucherAmt
            }]
          } else {
            this.summaryData = []
          }
        } catch (error) {
          console.error('获取提现汇总失败:', error)
          this.summaryData = []
        }
      },
  
      // 获取管理方数据
      async fetchManagerData() {
        try {
          const response = await getManagerById({ 
            id: this.detailDrawer.managerId 
          })
          
          if (response.code === 200 && response.data) {
            this.managerData = response.data
          } else {
            this.managerData = {}
          }
        } catch (error) {
          console.error('获取管理方信息失败:', error)
          this.managerData = {}
        }
      },
  
      // 获取费用统计
      async fetchCostStatistics() {
        const data = this.detailDrawer.data
        
        if (!data) {
          this.costStatistics = []
          return
        }
        
        const costMap = {
          elecAmt: '供电:电费',
          waterAmt: '供水:水费',
          serviceAmt: '技术服务费',
          elecVouchAmt: '抵扣金额'
        }
        
        const statistics = []
        for (const key in costMap) {
          if (data[key] !== undefined && data[key] !== null) {
            statistics.push({
              costName: costMap[key],
              amt: data[key]
            })
          }
        }
        
        this.costStatistics = statistics
      },
  
      // 格式化金额
      formatAmount(amount) {
        if (amount === null || amount === undefined) return '0.00'
        return parseFloat(amount).toFixed(2)
      },
  
      // 统计导出
      async handleExportStatistics() {
        if (this.exportLoading.statistics) return
        
        this.exportLoading.statistics = true
        try {
          const params = {
            managerId: this.detailDrawer.managerId,
            withdApplyIds: this.detailDrawer.id,
            auditSumyId: this.detailDrawer.rid
          }
          
          const response = await capitalExportWithdApplyUnified(params)
          
          if (response.code === 200) {
            this.$message.success('导出任务已提交，请稍后...')
            // 轮询检查导出结果
            this.checkExportResult('statistics', response.data)
          } else {
            this.$message.error(response.msg || '导出失败')
          }
        } catch (error) {
          console.error('统计导出失败:', error)
          this.$message.error('统计导出失败')
        } finally {
          setTimeout(() => {
            this.exportLoading.statistics = false
          }, 3000)
        }
      },
  
      // 明细导出
      async handleExportDetail() {
        if (this.exportLoading.detail) return
        
        this.exportLoading.detail = true
        try {
          const params = {
            managerId: this.detailDrawer.managerId,
            withdApplyIds: this.detailDrawer.id,
            auditSumyId: this.detailDrawer.rid
          }
          
          const response = await capitalExportWithdApplyDetails(params)
          
          if (response.code === 200) {
            this.$message.success('导出任务已提交，请稍后...')
            // 轮询检查导出结果
            this.checkExportResult('detail', response.data)
          } else {
            this.$message.error(response.msg || '导出失败')
          }
        } catch (error) {
          console.error('明细导出失败:', error)
          this.$message.error('明细导出失败')
        } finally {
          setTimeout(() => {
            this.exportLoading.detail = false
          }, 3000)
        }
      },
  
      // 手续费导出
      async handleExportHandFee() {
        if (this.exportLoading.handFee) return
        
        this.exportLoading.handFee = true
        try {
          // 手续费导出使用明细导出接口，但处理方式不同
          const params = {
            managerId: this.detailDrawer.managerId,
            withdApplyIds: this.detailDrawer.id,
            auditSumyId: this.detailDrawer.rid,
            exportType: 'handFee' // 标记为手续费导出
          }
          
          const response = await capitalExportWithdApplyDetails(params)
          
          if (response.code === 200) {
            this.$message.success('导出任务已提交，请稍后...')
            // 轮询检查导出结果
            this.checkExportResult('handFee', response.data)
          } else {
            this.$message.error(response.msg || '导出失败')
          }
        } catch (error) {
          console.error('手续费导出失败:', error)
          this.$message.error('手续费导出失败')
        } finally {
          setTimeout(() => {
            this.exportLoading.handFee = false
          }, 3000)
        }
      },
  
      // 检查导出结果
      checkExportResult(type, taskId) {
        if (!taskId) return
        
        let checkCount = 0
        const maxCheckCount = 30 // 最多检查30次，每次间隔2秒，共60秒
        
        this.checkExportTimer = setInterval(async () => {
          checkCount++
          
          try {
            let response
            if (type === 'statistics') {
              response = await capitalQueryWithdApplyUnifiedResult({ taskId })
            } else {
              response = await capitalQueryWithdApplyResult({ taskId })
            }
            
            if (response.code === 200 && response.data) {
              if (response.data.status === 'completed' && response.data.downloadUrl) {
                // 导出完成，下载文件
                this.downloadFile(response.data.downloadUrl, type)
                clearInterval(this.checkExportTimer)
                this.checkExportTimer = null
              } else if (response.data.status === 'failed') {
                // 导出失败
                this.$message.error('导出失败，请重试')
                clearInterval(this.checkExportTimer)
                this.checkExportTimer = null
              }
            }
          } catch (error) {
            console.error('检查导出结果失败:', error)
          }
          
          // 超过最大检查次数
          if (checkCount >= maxCheckCount) {
            clearInterval(this.checkExportTimer)
            this.checkExportTimer = null
            this.$message.warning('导出超时，请稍后重试')
          }
        }, 2000)
      },
  
      // 下载文件
      downloadFile(url, type) {
        const link = document.createElement('a')
        link.href = url
        link.target = '_blank'
        
        // 设置文件名
        const typeMap = {
          statistics: '提现统计',
          detail: '提现明细',
          handFee: '手续费明细'
        }
        const timestamp = new Date().getTime()
        link.download = `${typeMap[type]}_${timestamp}.xlsx`
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        this.$message.success('导出成功')
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .custom-drawer {
    ::v-deep .el-drawer__header {
      padding: 20px;
      border-bottom: 1px solid #e8e8e8;
      margin-bottom: 0;
    }
    
    ::v-deep .el-drawer__body {
      padding: 0;
    }
  }
  
  .drawer-header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    
    i {
      margin-right: 10px;
      font-size: 20px;
      color: #409EFF;
    }
  }
  
  .drawer-content {
    padding: 20px;
    height: calc(100vh - 80px);
    overflow-y: auto;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #c0c4cc;
      border-radius: 3px;
      
      &:hover {
        background: #909399;
      }
    }
  }
  
  .content-section {
    margin-bottom: 24px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #f5f7fa;
    border-radius: 4px 4px 0 0;
    border: 1px solid #e8e8e8;
    border-bottom: none;
    
    i {
      margin-right: 8px;
      font-size: 16px;
      color: #409EFF;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      flex: 1;
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .section-body {
    border: 1px solid #e8e8e8;
    border-radius: 0 0 4px 4px;
    background: #fff;
    
    .el-table {
      border-radius: 0 0 4px 4px;
    }
  }
  
  .empty-table {
    padding: 40px 0;
    text-align: center;
    color: #909399;
    
    i {
      font-size: 36px;
      margin-bottom: 12px;
    }
    
    p {
      font-size: 14px;
    }
  }
  
  .cost-statistics {
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    
    .cost-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background: #f5f7fa;
      border-radius: 4px;
      
      .cost-label {
        font-size: 14px;
        color: #606266;
        margin-right: 8px;
      }
      
      .cost-value {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        font-family: 'Helvetica Neue', Arial, sans-serif;
      }
    }
  }
  
  // 按钮加载状态样式
  .el-button {
    &.is-loading {
      opacity: 0.6;
      pointer-events: none;
    }
  }
  </style>