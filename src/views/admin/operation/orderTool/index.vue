<template>
  <div class="admin-operation-page">
    <el-card class="panel-card tab-card" shadow="never">
      <div class="order-tool-tabs">
        <div
          :class="selectType === 0 ? 'tab-active' : 'tab-item'"
          @click="changeBar(0)"
        >
          批量补单
        </div>
        <div
          :class="selectType === 1 ? 'tab-active' : 'tab-item'"
          @click="changeBar(1)"
        >
          查询
        </div>
        <div
          :class="selectType === 2 ? 'tab-active' : 'tab-item'"
          @click="changeBar(2)"
        >
          补单
        </div>
      </div>
    </el-card>
    <div>
      <BatchCreate v-if="selectType === 0" />
      <Calibration v-else-if="selectType === 1" />
      <Createbill v-else-if="selectType === 2" />
    </div>
  </div>
</template>

<script>
import Calibration from './page/calibration/index.vue'
import Createbill from './page/createbill/index.vue'
import BatchCreate from '../batchCreate/index.vue'

export default {
  name: 'AdminOperationOrderTool',
  components: {
    Calibration,
    Createbill,
    BatchCreate
  },
  data () {
    return {
      selectType: 0
    }
  },
  created () {
    if (this.$route.query['type']) {
      this.selectType = Number(this.$route.query['type'])
    }
  },
  methods: {
    changeBar (id) {
      this.selectType = id
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-operation-page {
  padding: 16px 20px 24px;
  min-height: calc(100vh - 100px);
  background: #f0f2f5;
}
.panel-card {
  border: none;
  border-radius: 8px;
  margin-bottom: 16px;

  ::v-deep .el-card__body {
    padding: 20px 24px;
  }
}
.tab-card {
  ::v-deep .el-card__body {
    padding: 12px 24px;
  }
}
.order-tool-tabs {
  display: flex;
  align-items: center;
  width: 360px;
  border: 1px solid #409eff;
  border-radius: 4px;
  overflow: hidden;

  .tab-item, .tab-active {
    width: 33.33%;
    height: 38px;
    line-height: 38px;
    font-size: 14px;
    text-align: center;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .tab-item {
    color: #409eff;
    background: #fff;
  }
  .tab-active {
    color: #fff;
    background: #409eff;
  }
}
</style>
