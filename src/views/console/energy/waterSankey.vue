<template>
  <div class="water-sankey-dashboard">
    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-form :inline="true" class="filter-form">
        <el-form-item :label="$t('waterSankey.filterQueryDate')">
          <el-date-picker
            v-model="queryParams.queryDate"
            type="date"
            :placeholder="$t('waterSankey.phPickDate')"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            :picker-options="datePickerOptions"
            @change="handleDateChange"
          />
        </el-form-item>

        <el-form-item :label="$t('waterSankey.filterTenantScope')">
          <el-select
            v-model="queryParams.tenantIdList"
            multiple
            collapse-tags
            :collapse-tags-tooltip="true"
            filterable
            :placeholder="$t('waterSankey.phTenant')"
            class="tenant-selector"
            :loading="tenantLoading"
            @change="handleTenantChange"
          >
            <el-option
              v-for="tenant in tenantList"
              :key="tenant.tenantId"
              :label="tenantOptionLabel(tenant)"
              :value="tenant.tenantId"
            >
              <span class="tenant-option">
                <span class="tenant-name">{{ $displayBizHybrid(tenant.name) }}</span>
                <span class="tenant-code" v-if="tenant.code">{{ tenant.code }}</span>
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery" :loading="loading">
            {{ $t('waterSankey.btnQuery') }}
          </el-button>
          <el-button @click="handleReset">{{ $t('waterSankey.btnReset') }}</el-button>
          <el-button v-if="tenantList.length > 0" @click="handleSelectAll">
            {{ isAllSelected ? $t('waterSankey.btnDeselectAll') : $t('waterSankey.btnSelectAll') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据概览卡片 -->
    <div class="overview-cards" v-if="!loading">
      <div class="overview-card">
        <div class="card-header">
          <span class="card-title">{{ $t('waterSankey.cardTotalWater') }}</span>
          <el-tooltip :content="$t('waterSankey.cardTotalWaterTip')" placement="top">
            <i class="el-icon-question"></i>
          </el-tooltip>
        </div>
        <div class="card-value">
          <span class="value-number">--</span>
          <span class="value-unit">m³</span>
        </div>
        <div class="card-footer">
          <span class="sub-info">{{ $t('waterSankey.comingSoon') }}</span>
        </div>
      </div>

      <div class="overview-card">
        <div class="card-header">
          <span class="card-title">{{ $t('waterSankey.cardTenantCount') }}</span>
        </div>
        <div class="card-value">
          <span class="value-number">{{ activeTenantsCount }}</span>
          <span class="value-unit">{{ $t('waterSankey.unitTenants') }}</span>
        </div>
        <div class="card-footer">
          <span class="sub-info">{{ $t('waterSankey.selectedTenants') }}</span>
        </div>
      </div>

      <div class="overview-card">
        <div class="card-header">
          <span class="card-title">{{ $t('waterSankey.cardAvgWater') }}</span>
        </div>
        <div class="card-value">
          <span class="value-number">--</span>
          <span class="value-unit">{{ $t('waterSankey.unitM3PerTenant') }}</span>
        </div>
        <div class="card-footer">
          <span class="sub-info">{{ $t('waterSankey.comingSoon') }}</span>
        </div>
      </div>

      <div class="overview-card">
        <div class="card-header">
          <span class="card-title">{{ $t('waterSankey.cardDistribution') }}</span>
        </div>
        <div class="card-value">
          <div class="distribution-placeholder">
            <span class="placeholder-text">{{ $t('waterSankey.dataInDevelopment') }}</span>
          </div>
        </div>
        <div class="card-footer">
          <span class="sub-info">{{ $t('waterSankey.byTypeDistribution') }}</span>
        </div>
      </div>
    </div>

    <!-- 主图表区域 -->
    <div class="chart-container" v-loading="loading" :element-loading-text="$t('waterSankey.loading')">
      <div class="chart-header" v-if="!loading">
        <div class="chart-title-group">
          <h2 class="chart-title">{{ $t('waterSankey.chartTitle') }}</h2>
          <p class="chart-subtitle">{{ $t('waterSankey.chartSubtitle', { date: queryParams.queryDate }) }}</p>
        </div>
        <div class="chart-tools">
          <div class="chart-tips">
            <i class="el-icon-info"></i>
            <span>{{ $t('waterSankey.tipDeveloping') }}</span>
          </div>
        </div>
      </div>

      <!-- 空状态展示 -->
      <div class="chart-empty-state" v-if="!loading">
        <div class="empty-content">
          <svg class="empty-icon" viewBox="0 0 64 41" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(0 1)" fill="none" fill-rule="evenodd">
              <ellipse fill="#F5F5F5" cx="32" cy="33" rx="32" ry="7"></ellipse>
              <g fill-rule="nonzero" stroke="#D9D9D9">
                <path d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z"></path>
                <path d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z" fill="#FAFAFA"></path>
              </g>
            </g>
          </svg>
          <h3 class="empty-title">{{ $t('waterSankey.emptyTitle') }}</h3>
          <p class="empty-description">{{ $t('waterSankey.emptyDescription') }}</p>
          <div class="empty-features">
            <div class="feature-item">
              <i class="el-icon-check"></i>
              <span>{{ $t('waterSankey.featureFlow') }}</span>
            </div>
            <div class="feature-item">
              <i class="el-icon-check"></i>
              <span>{{ $t('waterSankey.featureDevice') }}</span>
            </div>
            <div class="feature-item">
              <i class="el-icon-check"></i>
              <span>{{ $t('waterSankey.featureCompare') }}</span>
            </div>
          </div>
          <el-button type="primary" plain disabled class="coming-soon-btn">
            {{ $t('waterSankey.btnComingSoon') }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getSimpleTenantList } from '@/api/useReport'
import moment from 'moment'

export default {
  name: 'WaterSankeyChart',

  data () {
    return {
      queryParams: {
        queryDate: moment().subtract(1, 'days').format('YYYY-MM-DD'),
        tenantIdList: []
      },
      tenantList: [],
      tenantLoading: false,
      loading: false
    }
  },

  computed: {
    ...mapGetters('manager', ['currentManagerId']),

    datePickerOptions () {
      const t = (k) => this.$t(`waterSankey.${k}`)
      return {
        disabledDate (time) {
          return time.getTime() > Date.now()
        },
        shortcuts: [{
          text: t('pickerYesterday'),
          onClick (picker) {
            picker.$emit('pick', moment().subtract(1, 'days').toDate())
          }
        }, {
          text: t('pickerDayBefore'),
          onClick (picker) {
            picker.$emit('pick', moment().subtract(2, 'days').toDate())
          }
        }, {
          text: t('pickerMondayThisWeek'),
          onClick (picker) {
            picker.$emit('pick', moment().startOf('week').add(1, 'days').toDate())
          }
        }, {
          text: t('pickerLastMonday'),
          onClick (picker) {
            picker.$emit('pick', moment().startOf('week').subtract(6, 'days').toDate())
          }
        }]
      }
    },

    isAllSelected () {
      return this.tenantList.length > 0 &&
             this.queryParams.tenantIdList.length === this.tenantList.length
    },

    activeTenantsCount () {
      return this.queryParams.tenantIdList.length
    }
  },

  watch: {
    currentManagerId: {
      handler (val) {
        if (val) {
          this.initializeData()
        }
      },
      immediate: true
    }
  },

  mounted () {
    // 初始化
  },

  beforeDestroy () {
    // 清理
  },

  methods: {
    tenantOptionLabel (tenant) {
      return this.$displayBizHybrid(tenant.name)
    },

    async initializeData () {
      await this.getTenantList()
      if (this.tenantList.length > 0) {
        this.queryParams.tenantIdList = this.tenantList.map(item => item.tenantId)
      }
    },

    async getTenantList () {
      this.tenantLoading = true
      try {
        const { data } = await getSimpleTenantList({
          managerId: this.currentManagerId,
          tenantStatus: 0
        })
        this.tenantList = data || []
      } catch (error) {
        this.$apiError.notify(error, this.$t('waterSankey.msgTenantListFail'))
        console.error('获取租户列表失败:', error)
      } finally {
        this.tenantLoading = false
      }
    },

    handleSelectAll () {
      if (this.isAllSelected) {
        this.queryParams.tenantIdList = []
      } else {
        this.queryParams.tenantIdList = this.tenantList.map(item => item.tenantId)
      }
    },

    handleQuery () {
      if (!this.queryParams.queryDate) {
        this.$message.warning(this.$t('waterSankey.msgPickDate'))
        return
      }

      if (this.queryParams.tenantIdList.length === 0) {
        this.$message.warning(this.$t('waterSankey.msgPickTenant'))
        return
      }

      // 模拟加载
      this.loading = true
      setTimeout(() => {
        this.loading = false
        this.$message.info(this.$t('waterSankey.msgFeatureDeveloping'))
      }, 800)
    },

    handleDateChange () {
      // 日期改变处理
    },

    handleTenantChange () {
      // 租户改变处理
    },

    handleReset () {
      this.queryParams.queryDate = moment().subtract(1, 'days').format('YYYY-MM-DD')
      this.queryParams.tenantIdList = this.tenantList.map(item => item.tenantId)
    }
  }
}
</script>

<style lang="scss" scoped>
.water-sankey-dashboard {
  padding: 0;
  background: #f5f6f8;
  min-height: 100vh;
}

// 筛选区域
.filter-section {
  background: #fff;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-form {
  .el-form-item {
    margin-bottom: 0;
    margin-right: 24px;

    &:last-child {
      margin-right: 0;
    }
  }

  ::v-deep .el-form-item__label {
    font-size: 13px;
    color: #666;
    font-weight: normal;
  }
}

.tenant-selector {
  width: 320px;
}

.tenant-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .tenant-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tenant-code {
    font-size: 12px;
    color: #999;
    margin-left: 12px;
  }
}

// 数据概览卡片
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: #e8e8e8;
  margin-top: 1px;
}

.overview-card {
  background: #fff;
  padding: 20px 24px;

  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .card-title {
      font-size: 13px;
      color: #666;
      font-weight: normal;
    }

    .el-icon-question {
      font-size: 14px;
      color: #bfbfbf;
      margin-left: 6px;
      cursor: pointer;

      &:hover {
        color: #1890ff;
      }
    }
  }

  .card-value {
    display: flex;
    align-items: baseline;
    margin-bottom: 8px;

    .value-number {
      font-size: 28px;
      font-weight: 500;
      color: #1c1c1c;
      line-height: 1;
    }

    .value-unit {
      font-size: 14px;
      color: #8c8c8c;
      margin-left: 6px;
    }
  }

  .card-footer {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #8c8c8c;

    .sub-info {
      color: #999;
    }
  }

  .distribution-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    background: #f5f5f5;
    border-radius: 4px;

    .placeholder-text {
      font-size: 12px;
      color: #bfbfbf;
    }
  }
}

// 图表容器
.chart-container {
  background: #fff;
  margin: 24px;
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  min-height: 600px;
}

.chart-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title-group {
  .chart-title {
    font-size: 16px;
    font-weight: 500;
    color: #1c1c1c;
    margin: 0 0 4px 0;
  }

  .chart-subtitle {
    font-size: 13px;
    color: #8c8c8c;
    margin: 0;
  }
}

.chart-tools {
  display: flex;
  align-items: center;

  .chart-tips {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #faad14;
    padding: 6px 12px;
    background: #fffbe6;
    border: 1px solid #ffe58f;
    border-radius: 4px;

    .el-icon-info {
      font-size: 14px;
    }
  }
}

// 空状态
.chart-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  padding: 60px 24px;
}

.empty-content {
  text-align: center;
  max-width: 480px;
}

.empty-icon {
  width: 160px;
  height: auto;
  margin: 0 auto 24px;
  opacity: 0.8;
}

.empty-title {
  font-size: 20px;
  font-weight: 500;
  color: #1c1c1c;
  margin: 0 0 12px 0;
}

.empty-description {
  font-size: 14px;
  color: #8c8c8c;
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.empty-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;

  .el-icon-check {
    color: #52c41a;
    font-size: 16px;
    font-weight: bold;
  }
}

.coming-soon-btn {
  min-width: 120px;

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

// Element UI 组件样式覆盖
::v-deep {
  .el-select {
    .el-input__inner {
      font-size: 13px;
    }
  }

  .el-date-editor {
    .el-input__inner {
      font-size: 13px;
    }

    &.el-input {
      width: 160px;
    }
  }

  .el-button {
    font-size: 13px;

    &--primary {
      background: #1890ff;
      border-color: #1890ff;

      &:hover:not(.is-disabled) {
        background: #40a9ff;
        border-color: #40a9ff;
      }
    }

    &--default {
      &:hover {
        color: #1890ff;
        border-color: #1890ff;
      }
    }
  }

  .el-loading-mask {
    background-color: rgba(255, 255, 255, 0.95);
  }

  .el-loading-spinner {
    .el-loading-text {
      color: #666;
      font-size: 13px;
    }
  }
}

// 响应式设计
@media (max-width: 1680px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1280px) {
  .filter-form {
    .el-form-item {
      margin-bottom: 12px;
    }
  }

  .tenant-selector {
    width: 280px;
  }

  .chart-container {
    min-height: 500px;
  }
}

@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }

  .chart-container {
    margin: 12px;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .empty-icon {
    width: 120px;
  }

  .empty-title {
    font-size: 18px;
  }

  .empty-description {
    font-size: 13px;
  }
}
</style>
