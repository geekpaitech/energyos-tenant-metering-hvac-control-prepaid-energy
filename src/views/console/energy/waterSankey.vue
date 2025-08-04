<template>
    <div class="water-detail-dashboard">
      <!-- 顶部操作栏 -->
      <div class="dashboard-header">
        <div class="header-left">
          <h1 class="dashboard-title">
            用水明细
          </h1>
        </div>
        
        <div class="header-right">
          <button class="export-btn" @click="handleExport">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            导出明细
          </button>
        </div>
      </div>
  
      <!-- 筛选器 -->
      <div class="filter-container">
        <div class="filter-item date-filter">
          <label class="filter-label">统计时间</label>
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :picker-options="pickerOptions"
            class="custom-date-picker"
            @change="handleDateRangeChange"
          />
        </div>
        
        <div class="filter-item tenant-filter">
          <label class="filter-label">选择租户</label>
          <el-select
            v-model="queryParams.tenantIds"
            multiple
            collapse-tags
            filterable
            placeholder="请选择租户"
            class="custom-select"
            :loading="tenantLoading"
          >
            <el-option
              v-for="tenant in tenantList"
              :key="tenant.tenantId"
              :label="tenant.name"
              :value="tenant.tenantId"
            />
          </el-select>
        </div>
        
        <div class="filter-actions">
          <button class="search-btn" @click="handleSearch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            查询
          </button>
          <button class="reset-btn" @click="handleReset">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 4v6h6M23 20v-6h-6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            重置
          </button>
          <button
          class="reset-btn"
          @click="toggleSelectAll"
          :disabled="tenantLoading || tenantList.length === 0"
        >
          {{ isAllSelected ? "取消全选" : "全选" }}
        </button>
        </div>
      </div>
  
      <!-- 数据统计卡片 -->
      <div class="stats-cards" v-if="tableData.length > 0">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-label">总用水量</div>
            <div class="stat-value">{{ formatNumber(totalStats.totalWater) }} <span class="unit">吨</span></div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-label">总水费</div>
            <div class="stat-value">¥{{ formatNumber(totalStats.totalAmount) }}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-label">租户数量</div>
            <div class="stat-value">{{ queryParams.tenantIds.length }} <span class="unit">个</span></div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-label">平均单价</div>
            <div class="stat-value">¥{{ avgUnitPrice }} <span class="unit">/吨</span></div>
          </div>
        </div>
      </div>
  
      <!-- 主内容区 -->
      <div class="main-content" v-loading="loading" :element-loading-text="loadingText">
        <!-- 明细表格 -->
        <div class="table-section">
          <div class="section-header">
            <h2 class="section-title">用水明细数据</h2>
            <div class="table-info" v-if="tableData.length > 0">
              共 {{ tableData.length }} 条记录
            </div>
          </div>
          
          <div class="detail-table" v-if="tableData.length > 0">
            <div class="table-header">
              <div class="header-cell">租户名称</div>
              <div class="header-cell numeric">用水量(吨)</div>
              <div class="header-cell numeric">水费(元)</div>
            </div>
            
            <div class="table-body">
              <div 
                v-for="(row, index) in paginatedData" 
                :key="`${row.tenantId}-${index}`"
                class="table-row"
              >
                <div class="table-cell tenant-name">{{ row.tenantName || '-' }}</div>
                <div class="table-cell numeric water-amount">{{ formatNumber(row.useWater) }}</div>
                <div class="table-cell numeric amount">¥{{ formatNumber(row.useAmount) }}</div>
              </div>
            </div>
            
            <div class="table-footer">
              <div class="footer-cell">合计</div>
              <div class="footer-cell numeric water-amount">{{ formatNumber(totalStats.totalWater) }}</div>
              <div class="footer-cell numeric amount">¥{{ formatNumber(totalStats.totalAmount) }}</div>
            </div>
          </div>
          
          <!-- 分页 -->
          <div class="pagination-container" v-if="tableData.length > pageSize">
            <el-pagination
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              :current-page="currentPage"
              :page-sizes="[20, 50, 100, 200]"
              :page-size="pageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="tableData.length"
              background
            />
          </div>
          
          <div class="empty-state" v-else-if="!loading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
              <path d="M8 14s.5 2 4 2 4-2 4-2"/>
            </svg>
            <p>暂无用水明细数据</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { mapGetters } from 'vuex'
  import { 
    getSimpleTenantList, 
    queryTenantWaterUse 
  } from '@/api/useReport'
  import moment from 'moment'
  
  export default {
    name: 'WaterDetail',
    data() {
      return {
        queryParams: {
          dateRange: [],
          tenantIds: []
        },
        tenantList: [],
        tenantLoading: false,
        loading: false,
        loadingText: '数据加载中...',
        tableData: [],
        currentPage: 1,
        pageSize: 20,
        pickerOptions: {
          shortcuts: [{
            text: '最近一周',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
              picker.$emit('pick', [start, end])
            }
          }, {
            text: '最近一个月',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
              picker.$emit('pick', [start, end])
            }
          }, {
            text: '最近三个月',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
              picker.$emit('pick', [start, end])
            }
          }],
          disabledDate(time) {
            return time.getTime() > Date.now()
          }
        }
      }
    },
    computed: {
      ...mapGetters('manager', ['currentManagerId']),
      totalStats() {
        const stats = {
          totalWater: 0,
          totalAmount: 0,
          deviceCount: new Set()
        }
        
        this.tableData.forEach(item => {
          stats.totalWater += Number(item.useWater) || 0
          stats.totalAmount += Number(item.useAmount) || 0
          if (item.meterCode) {
            stats.deviceCount.add(item.meterCode)
          }
        })
        
        return {
          ...stats,
          deviceCount: stats.deviceCount.size
        }
      },
      avgUnitPrice() {
        if (this.totalStats.totalWater === 0) return '0.00'
        return (this.totalStats.totalAmount / this.totalStats.totalWater).toFixed(2)
      },
      paginatedData() {
        const start = (this.currentPage - 1) * this.pageSize
        const end = start + this.pageSize
        return this.tableData.slice(start, end)
      },
      isAllSelected() {
      return (
        this.tenantList.length > 0 &&
        this.queryParams.tenantIds.length === this.tenantList.length
      );
    },
    },
    watch: {
      currentManagerId: {
        handler(val) {
          if (val) {
            this.initializeData()
          }
        },
        immediate: true
      }
    },
    methods: {
      toggleSelectAll() {
      if (this.tenantLoading || this.tenantList.length === 0) return;

      if (this.isAllSelected) {
        this.queryParams.tenantIds = [];
      } else {
        this.queryParams.tenantIds = this.tenantList.map(
          (item) => item.tenantId
        );
      }
    },
      async initializeData() {
        this.setDefaultDateRange()
        await this.getTenantList()
        if (this.tenantList.length > 0) {
          this.queryParams.tenantIds = this.tenantList.map(item => item.tenantId)
        }
        this.handleSearch()
      },
      
      setDefaultDateRange() {
        this.queryParams.dateRange = [
          moment().subtract(30, 'days').format('YYYY-MM-DD'),
          moment().format('YYYY-MM-DD')
        ]
      },
      
      async getTenantList() {
        this.tenantLoading = true
        try {
          const { data } = await getSimpleTenantList({
            managerId: this.currentManagerId,
            tenantStatus: 0
          })
          this.tenantList = data || []
        } catch (error) {
          this.$message.error('获取租户列表失败')
          console.error('获取租户列表失败:', error)
        } finally {
          this.tenantLoading = false
        }
      },
      
      async handleSearch() {
        if (!this.queryParams.dateRange || this.queryParams.dateRange.length !== 2) {
          this.$message.warning('请选择统计时间')
          return
        }
        
        if (this.queryParams.tenantIds.length === 0) {
          this.$message.warning('请选择租户')
          return
        }
        
        this.loading = true
        this.currentPage = 1
        
        try {
          const startDate = this.queryParams.dateRange[0]
          const endDate = this.queryParams.dateRange[1]
          
          const params = {
            managerId: this.currentManagerId,
            startDate,
            endDate,
            dataType: 1,
            useType: 0,
            tenantIdList: this.queryParams.tenantIds
          }
          
          const { data } = await queryTenantWaterUse(params)
          
          // 直接使用返回的数据，因为接口返回的是扁平化的数组
          if (data && data.length > 0) {
            // 处理每条数据，确保字段正确
            this.tableData = data.map(item => ({
              tenantId: item.tenantId,
              tenantName: item.tenantName || '-',
              useWater: item.waterUse || item.useWater || 0,  // 注意：接口返回的是waterUse
              useAmount: item.useAmount || 0,
              logoUrl: item.logoUrl || ''
            }))
            
            // 调试信息
            console.log('处理后的数据：', this.tableData)
            console.log('第一条数据tenantId：', this.tableData[0]?.tenantId)
            this.$nextTick(() => {
              console.log('统计信息：', this.totalStats)
            })
          } else {
            this.tableData = []
          }
        } catch (error) {
          this.$message.error('获取数据失败')
          console.error('获取数据失败:', error)
        } finally {
          this.loading = false
        }
      },
      
      handleReset() {
        this.setDefaultDateRange()
        if (this.tenantList.length > 0) {
          this.queryParams.tenantIds = this.tenantList.map(item => item.tenantId)
        }
        this.currentPage = 1
        this.handleSearch()
      },
      
      handleExport() {
        this.$message.info('导出功能开发中...')
      },
      
      handleDateRangeChange(val) {
        if (val && val.length === 2) {
          const [start, end] = val
          const startDate = new Date(start)
          const endDate = new Date(end)
          const diffDays = Math.floor((endDate - startDate) / (24 * 3600 * 1000))
          
          if (diffDays > 90) {
            this.$message.warning('最多只能选择3个月的数据')
            const newEndDate = new Date(startDate.getTime() + 90 * 24 * 3600 * 1000)
            this.queryParams.dateRange = [
              start,
              moment(newEndDate).format('YYYY-MM-DD')
            ]
          }
        }
      },
      
      handleSizeChange(val) {
        this.pageSize = val
        this.currentPage = 1
      },
      
      handleCurrentChange(val) {
        this.currentPage = val
      },
      
      formatNumber(num) {
        if (!num && num !== 0) return '0.00'
        return Number(num).toFixed(2)
      },
      
      getSettleWayLabel(settleWay) {
        const settleWayMap = {
          1: '预付费',
          2: '后付费',
          3: '月结'
        }
        return settleWayMap[settleWay] || '-'
      },
      
      getSettleWayClass(settleWay) {
        const classMap = {
          1: 'prepay',
          2: 'postpay',
          3: 'monthly'
        }
        return classMap[settleWay] || ''
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .water-detail-dashboard {
    min-height: 100vh;
    background: #f8f9fa;
    padding: 24px;
  }
  
  // 顶部操作栏
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    background: white;
    padding: 20px 24px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
  
  .header-left {
    display: flex;
    align-items: center;
  }
  
  .dashboard-title {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }
  
  .export-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    
    svg {
      width: 18px;
      height: 18px;
    }
    
    &:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
  }
  
  // 筛选器
  .filter-container {
    background: white;
    padding: 20px 24px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    margin-bottom: 24px;
    display: flex;
    align-items: flex-end;
    gap: 24px;
  }
  
  .filter-item {
    flex: 1;
    
    &.date-filter {
      max-width: 320px;
    }
    
    &.tenant-filter {
      max-width: 360px;
    }
  }
  
  .filter-label {
    display: block;
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .filter-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .search-btn,
  .reset-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
  
  .search-btn {
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
      transform: translateY(-1px);
    }
  }
  
  .reset-btn {
    background: #f3f4f6;
    color: #6b7280;
    
    &:hover {
      background: #e5e7eb;
      color: #374151;
    }
  }
  
  // 统计卡片
  .stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }
  
  .stat-card {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 16px;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }
  }
  
  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    svg {
      width: 28px;
      height: 28px;
    }
    
    &.water-icon {
      background: #dbeafe;
      color: #3b82f6;
    }
    
    &.amount-icon {
      background: #fce7f3;
      color: #ec4899;
    }
    
    &.tenant-icon {
      background: #fef3c7;
      color: #f59e0b;
    }
    
    &.avg-icon {
      background: #d1fae5;
      color: #10b981;
    }
  }
  
  .stat-content {
    flex: 1;
  }
  
  .stat-label {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 4px;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    
    .unit {
      font-size: 14px;
      color: #6b7280;
      font-weight: 400;
    }
  }
  
  // 主内容区
  .main-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    overflow: hidden;
  }
  
  // 表格区域
  .table-section {
    padding: 24px;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }
  
  .table-info {
    font-size: 14px;
    color: #6b7280;
  }
  
  // 明细表格
  .detail-table {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .table-header {
    display: grid;
    grid-template-columns: 1fr 200px 200px;
    background: #f9fafb;
    font-weight: 600;
    color: #374151;
    font-size: 14px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .header-cell {
    padding: 16px 24px;
    display: flex;
    align-items: center;
    
    &.numeric {
      justify-content: flex-end;
    }
  }
  
  .table-body {
    max-height: 600px;
    overflow-y: auto;
  }
  
  .table-row {
    display: grid;
    grid-template-columns: 1fr 200px 200px;
    border-bottom: 1px solid #f3f4f6;
    transition: background 0.2s;
    
    &:hover {
      background: #f9fafb;
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .table-cell {
    padding: 16px 24px;
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #374151;
    
    &.numeric {
      justify-content: flex-end;
      font-family: 'SF Mono', Monaco, Consolas, monospace;
    }
    
    &.amount {
      color: #dc2626;
      font-weight: 600;
    }
    
    &.water-amount {
      color: #2563eb;
      font-weight: 600;
    }
    
    &.tenant-name {
      color: #1f2937;
      font-weight: 500;
    }
    
    &.device-name {
      color: #4b5563;
    }
    
    &.device-code {
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      font-size: 13px;
      color: #6b7280;
    }
  }
  
  .settle-tag {
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    
    &.prepay {
      background: #d1fae5;
      color: #065f46;
    }
    
    &.postpay {
      background: #fed7aa;
      color: #92400e;
    }
    
    &.monthly {
      background: #dbeafe;
      color: #1e40af;
    }
  }
  
  // 表格底部合计行
  .table-footer {
    display: grid;
    grid-template-columns: 1fr 200px 200px;
    background: #f3f4f6;
    font-weight: 600;
    color: #1a1a1a;
    border-top: 2px solid #e5e7eb;
  }
  
  .footer-cell {
    padding: 16px 24px;
    display: flex;
    align-items: center;
    font-size: 14px;
    
    &.numeric {
      justify-content: flex-end;
      font-family: 'SF Mono', Monaco, Consolas, monospace;
    }
    
    &.amount {
      color: #dc2626;
    }
    
    &.water-amount {
      color: #2563eb;
    }
  }
  
  // 分页
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
  
  // 空状态
  .empty-state {
    padding: 80px 0;
    text-align: center;
    
    svg {
      width: 64px;
      height: 64px;
      color: #e5e7eb;
      margin-bottom: 16px;
    }
    
    p {
      font-size: 14px;
      color: #9ca3af;
      margin: 0;
    }
  }
  
  // Element UI 样式覆盖
  ::v-deep .custom-date-picker {
    width: 100%;
    
    .el-input__inner {
      height: 40px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      
      &:hover {
        border-color: #d1d5db;
      }
      
      &:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }
  }
  
  ::v-deep .custom-select {
    width: 100%;
    
    .el-input__inner {
      height: 40px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      
      &:hover {
        border-color: #d1d5db;
      }
      
      &:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }
    
    .el-tag {
      background: #eff6ff;
      color: #3b82f6;
      border: none;
    }
  }
  
  ::v-deep .el-pagination {
    &.is-background {
      .btn-prev, .btn-next {
        background: #f3f4f6;
        
        &:hover {
          color: #3b82f6;
        }
      }
      
      .el-pager li {
        background: #f3f4f6;
        
        &:hover {
          color: #3b82f6;
        }
        
        &.active {
          background: #3b82f6;
          color: white;
        }
      }
    }
  }
  
  // 响应式设计
  @media (max-width: 1280px) {
    .stats-cards {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .table-header,
    .table-row {
      overflow-x: auto;
      min-width: 1000px;
    }
    
    .detail-table {
      overflow-x: auto;
    }
  }
  
  @media (max-width: 768px) {
    .water-detail-dashboard {
      padding: 16px;
    }
    
    .dashboard-header {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
    }
    
    .filter-container {
      flex-direction: column;
      gap: 16px;
    }
    
    .filter-item {
      max-width: 100% !important;
    }
    
    .filter-actions {
      width: 100%;
      justify-content: space-between;
    }
    
    .stats-cards {
      grid-template-columns: 1fr;
    }
    
    .stat-card {
      padding: 16px;
    }
    
    .stat-icon {
      width: 48px;
      height: 48px;
      
      svg {
        width: 24px;
        height: 24px;
      }
    }
    
    .table-section {
      padding: 16px;
    }
    
    .section-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }
  }
  </style>