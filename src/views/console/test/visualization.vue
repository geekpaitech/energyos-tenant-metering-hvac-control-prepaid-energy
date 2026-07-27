<template>
  <div class="visualization">
    <div v-if="!enableVisualization" class="empty-page">
      <i class="el-icon-data-analysis empty-icon"></i>
      <div class="empty-title">暂无数据</div>
      <div class="empty-desc">楼层可视化数据暂未接入</div>
    </div>
    <div v-else class="tj-Container">
      <div class="floor-name">{{ floorName }}</div>
      <div class="base-data">
        <div class="base-data-item">
          <div class="base-title">
            <div class="note"></div>
            <div class="txt">设备统计</div>
          </div>
          <div class="base-content w-1">
            <div class="b-i">
              <div class="label-1">空调</div>
              <div class="label-2">
                <span class="txt">15</span>
                <span class="unit">台</span>
              </div>
            </div>
            <div class="b-i">
              <div class="label-1">电表</div>
              <div class="label-2">
                <span class="txt">8</span>
                <span class="unit">台</span>
              </div>
            </div>
            <div class="b-i">
              <div class="label-1">水表</div>
              <div class="label-2">
                <span class="txt">5</span>
                <span class="unit">台</span>
              </div>
            </div>
            <div class="b-i">
              <div class="label-1">照明</div>
              <div class="label-2">
                <span class="txt">29</span>
                <span class="unit">台</span>
              </div>
            </div>
            <div class="b-i">
              <div class="label-1">门锁</div>
              <div class="label-2">
                <span class="txt">8</span>
                <span class="unit">台</span>
              </div>
            </div>
            <div class="b-i">
              <div class="label-1">租户</div>
              <div class="label-2">
                <span class="txt">6</span>
                <span class="unit">台</span>
              </div>
            </div>
          </div>
        </div>
        <div class="base-data-item">
          <div class="base-title">
            <div class="note"></div>
            <div class="txt">用能统计</div>
          </div>
          <div class="base-content w-2">
            <div class="b-i">
              <div class="label-1">今日用电量</div>
              <div class="label-2">
                <span class="txt">15</span>
                <span class="unit">台</span>
              </div>
            </div>
            <div class="b-i">
              <div class="label-1">今日用水量</div>
              <div class="label-2">
                <span class="txt">8</span>
                <span class="unit">台</span>
              </div>
            </div>
          </div>
        </div>
        <div class="base-data-item">
          <div class="base-title">
            <div class="note"></div>
            <div class="txt">故障统计</div>
          </div>
          <div class="base-content w-3">
            <div class="b-i">
              <div class="label-1">空调</div>
              <div class="label-2">
                <span class="txt txt-red">1</span>
                <span class="unit">台</span>
              </div>
            </div>
            <div class="b-i">
              <div class="label-1">电表</div>
              <div class="label-2">
                <span class="txt txt-red">2</span>
                <span class="unit">台</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <device-distribute></device-distribute>
    </div>
  </div>
</template>
<script>
import deviceDistribute from './comps/deviceDistribute'
import { mapGetters } from 'vuex'
export default {
  components: {
    deviceDistribute
  },
  data () {
    return {
      enableVisualization: false,
      treeData: [{
        id: 1,
        label: '一级 1',
        children: [{
          id: 4,
          label: '二级 1-1',
          children: [{
            id: 9,
            label: '三级 1-1-1'
          }, {
            id: 10,
            label: '三级 1-1-2'
          }]
        }]
      }, {
        id: 2,
        label: '一级 2',
        children: [{
          id: 5,
          label: '二级 2-1'
        }, {
          id: 6,
          label: '二级 2-2'
        }]
      }, {
        id: 3,
        label: '一级 3',
        children: [{
          id: 7,
          label: '二级 3-1'
        }, {
          id: 8,
          label: '二级 3-2'
        }]
      }],
      defaultTreeProps: {
        children: 'children',
        label: 'label'
      },
      expandAllStatus: true,
      floorName: ''
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId', 'currentManager'])
  },
  watch: {
    currentManagerId: {
      handler (newVal) {
        if (newVal) {
        }
      },
      immediate: true
    }
  },
  mounted () {
  },
  methods: {
    filterNode (value, data) {
      if (!value) return true
      return data.label.indexOf(value) !== -1
    },
    toggleExpandAll () {
      this.expandAllStatus = !this.expandAllStatus
      this.$refs.tree.store._getAllNodes().forEach(node => {
        node.expanded = this.expandAllStatus
      })
    },
    handleNodeClick (data) {
      this.floorName = data.label
    }
  }
}
</script>
<style lang="scss" scoped>
.visualization {
  height: 100%;
  padding: 16px;
  display: flex;
  .empty-page {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.12);
  }
  .empty-icon {
    font-size: 64px;
    color: #c0c4cc;
    margin-bottom: 12px;
  }
  .empty-title {
    font-size: 16px;
    color: #303133;
    margin-bottom: 6px;
  }
  .empty-desc {
    font-size: 13px;
    color: #909399;
  }
  .tj-Container {
    margin-top: 20px;
    box-sizing: border-box;
    background-color: #fff;
    width: calc(100vw - 340px);
    .floor-name {
      font-size: 20px;
      color: #000000;
      line-height: 22px;
      margin-bottom: 17px;
    }
    .base-data {
      margin-bottom: 30px;
      display: flex;
      .base-data-item {
        margin-right: 26px;
        &:last-child {
          margin-right: 0;
        }
        .base-title {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          .note {
            background-color: #0170FE;
            height: 15px;
            width: 2px;
            margin-right: 4px;
          }
          .txt {
            color: #000000;
            font-size: 16px;
          }
        }
        .base-content {
          height: 96px;
          &.w-1 {
            width: 519px;
          }
          &.w-2 {
            width: 257px;
          }
          &.w-3 {
            width: 187px;
          }
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          background: linear-gradient( 180deg, #F7F8FD 0%, #FFFFFF 100%);
          border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.12);
          .b-i {
            .label-1 {
              margin-bottom: 4px;
              color: #666666;
              font-size: 14px;
            }
            .label-2 {
              .txt {
                color: #333333;
                font-size: 24px;
                font-weight: bold;
              }
              .unit {
                margin-left: 4px;
                font-size: 14px;
                color: #666666;
              }
            }
          }
        }
      }
    }
  }
}
.txt-red {
  color: #FF383C !important;
}
</style>
