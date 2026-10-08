<template>
  <div class="sub-metering-chart" @click="goToAll">
    <div class="chart-header">
      <div class="header-left">
        <div class="icon-box">
          <img class="icon-img" :src="require('../../image/mind.png')" :alt="$t('dashboard.subMetering.title')" />
        </div>
        <div class="title-box">
          <div class="title-row">
            <h3>{{ $t('dashboard.subMetering.title') }}</h3>
            <span class="demo-tag">{{ $t('dashboard.subMetering.demoTag') }}</span>
          </div>
          <p>{{ $t('dashboard.subMetering.subtitle') }}</p>
        </div>
      </div>
      <div class="header-right">
        <!-- <el-button type="text" class="replay-btn" @click="replayPreview">
          重新演示<i class="el-icon-refresh-right"></i>
        </el-button> -->
        <el-button type="text" class="view-all">
          {{ $t('dashboard.subMetering.goBuild') }}<i class="el-icon-arrow-right"></i>
        </el-button>
      </div>
    </div>

    <!-- 直接让 metering-preview-tree 撑满剩余高度，不做 scale 缩放 -->
    <div class="preview-wrap">
      <metering-preview-tree
        ref="previewTree"
        :model="mockPreviewModel"
        :auto-play="true"
        :col-delay="340"
        :node-stagger="120"
      />
    </div>
  </div>
</template>

<script>
import MeteringPreviewTree from './MeteringPreviewTree.vue'

export default {
  name: 'SubMeteringChart',
  components: { MeteringPreviewTree },

  data () {
    return {
      mockPreviewZh: {
        columns: [
          {
            id: 'c0',
            nodes: [
              { id: 'root', label: '产业园', root: true }
            ]
          },
          {
            id: 'c1',
            nodes: [
              { id: 'tenant', label: '租户' },
              { id: 'public', label: '公区' }
            ]
          },
          {
            id: 'c2',
            nodes: [
              { id: 'drawer1', label: '1-4层照明', tone: 'good' },
              { id: 'drawer2', label: '5-8层照明' }
            ]
          },
          {
            id: 'c3',
            nodes: [
              {
                id: 'sw1',
                label: '1F照明总闸',
                tone: 'good',
                badge: '线损 3.9%',
                badgeTone: 'good'
              },
              { id: 'sw2', label: '2F照明总闸', tone: 'good' },
              { id: 'sw3', label: '3F照明总闸', tone: 'good' }
            ]
          },
          {
            id: 'c4',
            nodes: [
              { id: 'ta', label: '租户A', tone: 'bad' },
              { id: 'tb', label: '租户B', tone: 'bad' },
              {
                id: 'tc',
                label: '租户C',
                tone: 'bad',
                badge: '线损 33.9%',
                badgeTone: 'bad'
              }
            ]
          }
        ],
        edges: [
          { id: 'e1', from: 'root', to: 'tenant' },
          { id: 'e2', from: 'root', to: 'public' },
          { id: 'e3', from: 'tenant', to: 'drawer1' },
          { id: 'e4', from: 'tenant', to: 'drawer2' },
          { id: 'e5', from: 'drawer1', to: 'sw1', tone: 'good' },
          { id: 'e6', from: 'drawer1', to: 'sw2', tone: 'good' },
          { id: 'e7', from: 'drawer1', to: 'sw3', tone: 'good' },
          { id: 'e8', from: 'sw1', to: 'ta', tone: 'bad' },
          { id: 'e9', from: 'sw1', to: 'tb', tone: 'bad' },
          { id: 'e10', from: 'sw1', to: 'tc', tone: 'bad' }
        ]
      }
    }
  },

  computed: {
    mockPreviewModel () {
      if (this.$i18n.locale !== 'en') return this.mockPreviewZh
      const map = (label) => {
        const M = {
          产业园: 'Park',
          租户: 'Tenants',
          公区: 'Public',
          '1-4层照明': 'L1–4 LT',
          '5-8层照明': 'L5–8 LT',
          '1F照明总闸': '1F Main',
          '2F照明总闸': '2F Main',
          '3F照明总闸': '3F Main',
          '线损 3.9%': 'Loss 3.9%',
          租户A: 'T-A',
          租户B: 'T-B',
          租户C: 'T-C',
          '线损 33.9%': 'Loss 33.9%'
        }
        return M[label] || label
      }
      const walk = (node) => {
        if (!node) return node
        const n = { ...node }
        if (n.label) n.label = map(n.label)
        if (n.badge) n.badge = map(n.badge)
        return n
      }
      const src = this.mockPreviewZh
      return {
        columns: src.columns.map((col) => ({
          ...col,
          nodes: col.nodes.map(walk)
        })),
        edges: src.edges
      }
    }
  },

  watch: {
    '$i18n.locale' () {
      this.$nextTick(() => {
        const tree = this.$refs.previewTree
        if (tree && typeof tree.restart === 'function') tree.restart()
      })
    }
  },

  methods: {
    goToAll () {
      this.$router.push({ path: '/power-analysis/energy-overview' })
    },
    replayPreview () {
      this.$refs.previewTree && this.$refs.previewTree.restart()
    }
  }
}
</script>

<style lang="scss" scoped>
.sub-metering-chart {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
}

/* ─── Header ─────────────────────────────────────────────────── */
.chart-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-bottom: 1px solid #F1F5F9;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .demo-tag {
    height: 16px;
    padding: 0 6px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    background: #F8FAFC;
    border: 1px solid rgba(226, 232, 240, 0.9);
    color: #64748B;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .replay-btn,
  .view-all {
    padding: 0;
    font-size: 11px;
    color: #1890ff;
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  .replay-btn {
    color: #64748B;
  }

  .icon-box {
    width: 28px;
    height: 28px;
    background: #EEF2F7;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    .icon-img {
      width: 15px;
      height: 15px;
      object-fit: contain;
      display: block;
    }
  }

  .title-box {
    h3 {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
    }

    p {
      font-size: 10px;
      color: #94A3B8;
      margin: 2px 0 0;
    }
  }
}

/* ─── Preview area ───────────────────────────────────────────── */
// 关键：让预览区撑满剩余高度，不做任何 scale 变换
// MeteringPreviewTree 内部用 flexbox 均分列宽和节点间距
.preview-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;

  // 点状背景
  background-image: radial-gradient(
    circle at 1px 1px,
    rgba(148, 163, 184, 0.32) 1px,
    transparent 0
  );
  background-size: 18px 18px;

  // 把 tree 组件撑满
  > * {
    width: 100%;
    height: 100%;
  }
}
</style>
