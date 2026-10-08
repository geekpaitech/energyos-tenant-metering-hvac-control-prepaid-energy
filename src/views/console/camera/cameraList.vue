<template>
  <div class="table-page-container">
    <!-- 查询盒子 -->
    <div class="search-box">
      <el-form
        :model="queryData"
        ref="searchForm"
        class="search-form"
        size="small"
        @submit.native.prevent
        @keyup.enter.native="handleSearch"
      >
        <div class="search-main-grid">
          <div class="field-item">
            <el-input
              v-model="queryData.algorithmName"
              placeholder="算法名称"
              clearable
              size="small"
              style="width: 100%"
            />
          </div>
          <div class="field-item">
            <el-input
              v-model="queryData.cameraName"
              placeholder="摄像头名称"
              clearable
              size="small"
              style="width: 100%"
            />
          </div>
          <div class="field-item">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              value-format="yyyy-MM-dd"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
              style="width: 100%"
            />
          </div>
          <div class="field-item">
            <el-select
              v-model="queryData.pushStatus"
              placeholder="推送状态"
              clearable
              size="small"
              style="width: 100%"
            >
              <el-option label="未推送" :value="0" />
              <el-option label="已推送" :value="1" />
            </el-select>
          </div>
          <div class="search-actions">
            <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">查询</el-button>
            <el-button size="small" icon="el-icon-refresh-left" @click="handleReset">重置</el-button>
          </div>
        </div>
      </el-form>
    </div>

    <!-- 内容盒子 -->
    <div class="content-box">
      <div class="content-toolbar">
        <div class="toolbar-left">
          <span class="section-title">
            <span class="title-bar" />
            摄像头列表
          </span>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        size="small"
        style="width: 100%"
      >
        <el-table-column prop="snowflakeId" label="AI流水号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="alarmTime" label="报警时间" width="170" />
        <el-table-column prop="cameraName" label="摄像头名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="algorithmName" label="算法名称" min-width="120" show-overflow-tooltip />
        <el-table-column label="报警等级" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="degreeTagType(row.degree)" size="mini" effect="plain">{{ row.degree || '--' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="在线状态" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="row.onlineStatus === 1 ? 'success' : 'info'" size="mini" effect="plain">
              {{ row.onlineStatus === 1 ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="推送状态" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="row.pushStatus === 1 ? 'success' : 'info'" size="mini" effect="plain">
              {{ row.pushStatus === 1 ? '已推送' : '未推送' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="报警截图" width="120" align="center">
          <template slot-scope="{ row }">
            <el-image
              v-if="row.alarmPicUrl"
              :src="row.alarmPicUrl"
              :preview-src-list="previewSrcList"
              :initial-index="getPreviewIndex(row)"
              fit="cover"
              style="width: 60px; height: 40px; border-radius: 4px"
            />
            <span v-else>--</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container compact-pagination">
        <el-pagination
          background
          :current-page="pageData.current"
          :page-size="pageData.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pageData.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import { queryCameraAlarmPage } from '@/api/cameraAlarm'

// 生成默认查询时间范围（本月 1 日到今天）
function getDefaultDateRange () {
  return [
    moment().startOf('month').format('YYYY-MM-DD'),
    moment().format('YYYY-MM-DD')
  ]
}

export default {
  name: 'CameraAlarmList',
  data () {
    return {
      loading: false,
      requestId: 0,
      tableData: [],
      dateRange: getDefaultDateRange(),
      queryData: {
        algorithmName: '',
        cameraName: '',
        pushStatus: null
      },
      pageData: {
        current: 1,
        size: 10,
        total: 0
      }
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    previewSrcList () {
      return this.tableData
        .filter(item => item.alarmPicUrl)
        .map(item => item.alarmPicUrl)
    }
  },
  created () {
    this.fetchList()
  },
  watch: {
    currentManagerId (newVal, oldVal) {
      if (String(newVal || '') === String(oldVal || '')) return
      this.pageData.current = 1
      this.tableData = []
      this.pageData.total = 0
      this.fetchList()
    }
  },
  methods: {
    async fetchList () {
      const requestId = ++this.requestId
      const managerId = Number(this.currentManagerId)
      if (!Number.isFinite(managerId) || managerId <= 0) {
        this.tableData = []
        this.pageData.total = 0
        this.loading = false
        return
      }

      this.loading = true
      try {
        const params = {
          algorithmName: this.queryData.algorithmName || null,
          cameraName: this.queryData.cameraName || null,
          startDate: this.dateRange && this.dateRange.length === 2 ? this.dateRange[0] : null,
          endDate: this.dateRange && this.dateRange.length === 2 ? this.dateRange[1] : null,
          pushStatus: this.queryData.pushStatus,
          managerId,
          firstPermissionMaId: managerId,
          page: {
            current: this.pageData.current,
            size: this.pageData.size,
            orders: [{ asc: false, column: 'alarmTime' }]
          }
        }
        const response = await queryCameraAlarmPage(params)
        if (requestId !== this.requestId) return
        if (response && response.code === 200 && response.data) {
          this.tableData = response.data.dataList || []
          this.pageData.total = response.data.total || 0
        } else {
          this.tableData = []
          this.pageData.total = 0
        }
      } catch (e) {
        if (requestId !== this.requestId) return
        console.error('查询AI报警记录失败:', e)
        this.tableData = []
        this.pageData.total = 0
      } finally {
        if (requestId === this.requestId) {
          this.loading = false
        }
      }
    },
    handleSearch () {
      this.pageData.current = 1
      this.fetchList()
    },
    handleReset () {
      this.queryData = {
        algorithmName: '',
        cameraName: '',
        pushStatus: null
      }
      this.dateRange = getDefaultDateRange()
      this.pageData.current = 1
      this.fetchList()
    },
    handleSizeChange (size) {
      this.pageData.size = size
      this.pageData.current = 1
      this.fetchList()
    },
    handleCurrentChange (page) {
      this.pageData.current = page
      this.fetchList()
    },
    getPreviewIndex (row) {
      return this.previewSrcList.indexOf(row.alarmPicUrl)
    },
    degreeTagType (degree) {
      if (!degree) return 'info'
      const text = String(degree).toLowerCase()
      if (['高', 'high', '1', '严重', 'critical', 'danger'].includes(text)) return 'danger'
      if (['中', 'medium', '2', '警告', 'warning'].includes(text)) return 'warning'
      return 'info'
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/table-page.scss';

.table-page-container {
  padding: 16px;
  background: #f0f2f5;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.search-box {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.search-form {
  margin: 0;

  .search-main-grid {
    width: 100%;
    display: grid;
    align-items: center;
    grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
    gap: 10px;
  }

  .field-item {
    width: 100%;
    min-width: 0;

    ::v-deep .el-input,
    ::v-deep .el-select {
      width: 100%;
      display: block;
    }

    ::v-deep .el-input__inner,
    ::v-deep .el-select .el-input__inner,
    ::v-deep .el-date-editor .el-input__inner {
      height: 32px;
      line-height: 32px;
      border-radius: 6px;
      border-color: #e4e7ed;
      font-size: 13px;

      &::placeholder {
        color: #c0c4cc;
      }
    }
  }

  .search-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    white-space: nowrap;
    justify-self: end;
    line-height: 1;

    ::v-deep .el-button + .el-button {
      margin-left: 0 !important;
    }

    ::v-deep .el-button {
      height: 32px;
      padding: 0 14px;
      font-size: 13px;
      border-radius: 6px;
    }

    ::v-deep .el-button--primary {
      background: #1677ff;
      border-color: #1677ff;

      &:hover {
        background: #4096ff;
        border-color: #4096ff;
      }
    }
  }
}

.content-box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  flex: 1;
  padding: 16px 16px 10px;
}

.content-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 8px;

  .toolbar-left {
    .section-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #111827;

      .title-bar {
        width: 3px;
        height: 16px;
        background: #1677ff;
        border-radius: 2px;
        flex-shrink: 0;
      }
    }
  }
}
</style>
