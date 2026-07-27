<template>
  <div class="sub-metering-page">
    <!-- 左侧分项树 -->
    <div class="tree-panel">
      <div class="panel-header">
        <h3 class="panel-title">分项</h3>
        <el-button type="text" icon="el-icon-setting" @click="goToSetting">
          设置
        </el-button>
      </div>

      <div class="tree-search">
        <el-input
          v-model="filterText"
          placeholder="请输入检索内容"
          prefix-icon="el-icon-search"
          clearable
          size="small"
        />
      </div>

      <div class="tree-content" v-loading="treeLoading">
        <el-tree
          ref="treeRef"
          :data="treeData"
          :props="treeProps"
          :load="loadNode"
          lazy
          node-key="id"
          highlight-current
          :current-node-key="currentNodeId"
          :expand-on-click-node="false"
          default-expand-all
          :filter-node-method="filterNode"
          @node-click="handleNodeClick"
        >
          <template #default="{ node, data }">
            <div class="tree-node-content">
              <el-tooltip :content="node.label" placement="right" :disabled="node.label.length < 10">
                <div class="node-inner">
                  <i :class="getNodeIcon(data)" class="node-icon"></i>
                  <span class="node-label">{{ node.label }}</span>
                  <template v-if="!data.subType">
                    <span class="node-count">
                      【<i class="el-icon-office-building count-icon"></i>
                      <span>{{ data.totalMainMeterCount || 0 }}</span>
                      <i class="el-icon-document count-icon" style="margin-left: 6px;"></i>
                      <span>{{ data.totalSubMeterCount || 0 }}</span>】
                    </span>
                  </template>
                </div>
              </el-tooltip>
            </div>
          </template>
        </el-tree>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="content-panel">
      <!-- 切换栏 -->
      <div class="content-header">
        <div class="tab-switch">
          <el-radio-group v-model="activeTab" size="medium" @change="handleTabChange">
            <el-radio-button label="report">用能报表</el-radio-button>
            <el-radio-button label="monitor" :disabled="!checkedNode.subType">实时监测</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 用能报表筛选条件 -->
        <div class="filter-bar" v-if="activeTab === 'report'">
          <div class="time-shortcuts">
            <el-button
              :type="timeType === 'week' ? 'primary' : 'default'"
              size="small"
              @click="handleTimeShortcut('week')"
            >
              近一周
            </el-button>
            <el-button
              :type="timeType === 'month' ? 'primary' : 'default'"
              size="small"
              @click="handleTimeShortcut('month')"
            >
              近一月
            </el-button>
          </div>

          <div class="time-picker">
            <el-date-picker
              v-model="timeRange"
              type="daterange"
              size="small"
              value-format="yyyy-MM-dd"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              :picker-options="pickerOptions"
              @change="handleTimeRangeChange"
            />
            <el-button type="primary" size="small" @click="handleQuery">查询</el-button>
          </div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-body">
        <!-- 用能报表 -->
        <TopStatistic
          v-if="activeTab === 'report'"
          ref="topStatisticRef"
          :time-range="timeRange"
          :checked-node="checkedNode"
          :trigger="queryTrigger"
        />

        <!-- 实时监测 -->
        <Ammeter
          v-if="activeTab === 'monitor' && checkedNode.subType"
          :serial="checkedNode.serial"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import { getSubTree } from '@/api/subMetering'
import TopStatistic from './components/TopStatistic.vue'
import Ammeter from './components/Ammeter.vue'

// 节点图标配置
const NODE_ICONS = {
  folder: 'el-icon-folder',
  main: 'el-icon-office-building',
  sub: 'el-icon-document'
}

export default {
  name: 'SubMetering',

  components: {
    TopStatistic,
    Ammeter
  },

  data () {
    return {
      // 树相关
      filterText: '',
      treeData: [],
      treeLoading: false,
      currentNodeId: '',
      checkedNode: {},
      treeProps: {
        label: 'name',
        children: 'zones',
        isLeaf: 'leaf'
      },

      // Tab切换
      activeTab: 'report',

      // 时间筛选
      timeType: 'week',
      timeRange: [
        moment().subtract(7, 'days').format('YYYY-MM-DD'),
        moment().subtract(1, 'days').format('YYYY-MM-DD')
      ],
      queryTrigger: 0,

      // 日期选择器配置
      pickerMinDate: '',
      isRestart: false,
      pickerOptions: {
        disabledDate: (time) => {
          if (this.pickerMinDate !== '') {
            const range = 60 * 24 * 3600 * 1000
            const minTime = this.pickerMinDate - range
            const maxTime = this.pickerMinDate + range
            return time.getTime() < minTime || time.getTime() > maxTime || time.getTime() > (Date.now() - 24 * 3600 * 1000)
          }
          return time.getTime() > (Date.now() - 24 * 3600 * 1000)
        },
        onPick: ({ maxDate, minDate }) => {
          this.isRestart = false
          this.pickerMinDate = minDate.getTime()
          if (maxDate) {
            this.pickerMinDate = ''
          }
        }
      }
    }
  },

  computed: {
    ...mapGetters('manager', ['currentManagerId'])
  },

  watch: {
    filterText (val) {
      this.$refs.treeRef?.filter(val)
    },

    currentManagerId: {
      handler (val) {
        if (val) {
          this.initData()
        }
      },
      immediate: true
    }
  },

  methods: {
    // 初始化数据
    async initData () {
      await this.getTreeData()
    },

    // 获取分项树数据
    async getTreeData () {
      this.treeLoading = true
      try {
        const { data } = await getSubTree({ managerId: this.currentManagerId })
        this.treeData = data || []

        if (this.treeData.length > 0) {
          this.checkedNode = this.treeData[0]
          this.currentNodeId = this.treeData[0].id

          this.$nextTick(() => {
            this.$refs.treeRef?.setCurrentKey(this.currentNodeId)
          })

          this.queryTrigger++
        }
      } catch (error) {
        this.$message.error('获取分项数据失败')
        console.error('获取分项树失败:', error)
      } finally {
        this.treeLoading = false
      }
    },

    // 树节点懒加载
    loadNode (node, resolve) {
      if (node.level === 0) {
        return resolve(this.treeData)
      }

      if (node.data.subType) {
        return resolve([])
      }

      const { subTreeList = [], mainMeterList = [], subMeterList = [] } = node.data

      if (!subTreeList.length && !mainMeterList.length && !subMeterList.length) {
        return resolve([])
      }

      // 处理电表数据
      const processedMainList = mainMeterList.map(item => ({
        ...item,
        name: item.meterName,
        id: item.meterId,
        leaf: true
      }))

      const processedSubList = subMeterList.map(item => ({
        ...item,
        name: item.meterName,
        id: item.meterId,
        leaf: true
      }))

      resolve([...processedMainList, ...processedSubList, ...subTreeList])
    },

    // 树节点过滤
    filterNode (value, data) {
      if (!value) return true
      return data.name?.includes(value)
    },

    // 节点点击
    handleNodeClick (data) {
      this.checkedNode = data
      this.currentNodeId = data.id

      // 如果点击的不是电表节点，切换到用能报表
      if (!data.subType) {
        this.activeTab = 'report'
      }

      this.queryTrigger++
    },

    // 获取节点图标
    getNodeIcon (data) {
      if (data.subType === 'MAIN') return NODE_ICONS.main
      if (data.subType === 'SUB') return NODE_ICONS.sub
      return NODE_ICONS.folder
    },

    // Tab切换
    handleTabChange (val) {
      if (val === 'monitor' && !this.checkedNode.subType) {
        this.$message.warning('请选择电表节点')
        this.activeTab = 'report'
      }
    },

    // 时间快捷选择
    handleTimeShortcut (type) {
      this.timeType = type

      const shortcuts = {
        week: [
          moment().subtract(7, 'days').format('YYYY-MM-DD'),
          moment().subtract(1, 'days').format('YYYY-MM-DD')
        ],
        month: [
          moment().subtract(30, 'days').format('YYYY-MM-DD'),
          moment().subtract(1, 'days').format('YYYY-MM-DD')
        ]
      }

      this.timeRange = shortcuts[type]
      this.queryTrigger++
    },

    // 时间范围变化
    handleTimeRangeChange (val) {
      if (!val) {
        this.timeType = ''
        return
      }

      const weekRange = [
        moment().subtract(7, 'days').format('YYYY-MM-DD'),
        moment().subtract(1, 'days').format('YYYY-MM-DD')
      ].join(',')

      const monthRange = [
        moment().subtract(30, 'days').format('YYYY-MM-DD'),
        moment().subtract(1, 'days').format('YYYY-MM-DD')
      ].join(',')

      const currentRange = val.join(',')

      if (currentRange === weekRange) {
        this.timeType = 'week'
      } else if (currentRange === monthRange) {
        this.timeType = 'month'
      } else {
        this.timeType = ''
      }
    },

    // 查询
    handleQuery () {
      this.queryTrigger++
    },

    // 跳转设置页
    goToSetting () {
      this.$router.push({
        path: '/energy/sub-metering/detail/' + this.currentManagerId
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.sub-metering-page {
  display: flex;
  height: calc(100vh - 120px);
  background: #f5f6f8;
  gap: 16px;
  padding: 16px;
}

// 左侧树面板
.tree-panel {
  width: 320px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 4px;
  display: flex;
  flex-direction: column;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;

    .panel-title {
      font-size: 16px;
      font-weight: 500;
      color: #1c1c1c;
      margin: 0;
    }
  }

  .tree-search {
    padding: 12px 16px;
  }

  .tree-content {
    flex: 1;
    overflow: auto;
    padding: 0 8px 16px;
  }
}

// 树节点样式
.tree-node-content {
  flex: 1;
  overflow: hidden;

  .node-inner {
    display: flex;
    align-items: center;
    width: 100%;
  }

  .node-icon {
    font-size: 16px;
    margin-right: 6px;
    flex-shrink: 0;
    color: #409EFF;
  }

  .node-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .node-count {
    display: inline-flex;
    align-items: center;
    margin-left: 4px;
    font-size: 12px;
    color: #999;
    flex-shrink: 0;

    .count-icon {
      font-size: 14px;
      margin: 0 2px;
      color: #909399;
    }
  }
}

// 右侧内容面板
.content-panel {
  flex: 1;
  background: #fff;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .content-header {
    padding: 16px 24px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .filter-bar {
    display: flex;
    align-items: center;
    gap: 16px;

    .time-shortcuts {
      display: flex;
      gap: 8px;
    }

    .time-picker {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .content-body {
    flex: 1;
    overflow: auto;
    padding: 24px;
  }
}

// Element UI 样式覆盖
::v-deep {
  .el-tree-node__content {
    height: 32px;
  }

  .el-tree-node__expand-icon {
    font-size: 14px;
  }

  .el-radio-button__inner {
    padding: 8px 20px;
  }
}
</style>
