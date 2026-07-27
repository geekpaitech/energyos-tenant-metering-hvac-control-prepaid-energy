<template>
  <div class="alert-panel">
    <div class="panel-header">
      <div class="header-left">
        <div class="icon-box alert">
          <i class="el-icon-warning"></i>
        </div>
        <div class="title-box">
          <h3>实时告警</h3>
          <p>最近异常事件</p>
        </div>
      </div>
      <el-tag size="mini" type="info">{{ displayAlerts.length }} 条</el-tag>
    </div>

    <div class="panel-body">
      <div v-if="displayAlerts.length" class="alert-list">
        <div
          v-for="(alert, index) in displayAlerts"
          :key="alert.id"
          class="alert-item"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div :class="['alert-level', alert.level]">
            <i :class="levelIcon(alert.level)"></i>
          </div>
          <div class="alert-content">
            <div class="alert-header">
              <span class="alert-title">{{ alert.title }}</span>
              <el-tag size="mini" :type="levelType(alert.level)">{{ levelText(alert.level) }}</el-tag>
            </div>
            <p class="alert-desc">{{ alert.description }}</p>
            <div class="alert-meta">
              <span class="alert-device">
                <i class="el-icon-location"></i>
                {{ alert.device }}
              </span>
              <span class="alert-time">{{ alert.time }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="alert-empty">
        <div class="empty-icon">
          <i class="el-icon-circle-check"></i>
        </div>
        <div class="empty-text">暂无报警</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { isDemoManager } from '@/api/newDashboard'

export default {
  name: 'AlertPanel',
  data () {
    return {
      alerts: [
        {
          id: 1,
          title: '数据同步延迟提醒',
          description: '昨日用能汇总存在约 1 分钟延迟，属正常波动',
          device: '数据中心 · 汇总任务',
          level: 'info',
          time: '3分钟前'
        },
        {
          id: 2,
          title: '费率配置校验提示',
          description: '发现 1 个项目当月费率未配置，已沿用上月策略',
          device: '计费中心 · 费率校验',
          level: 'info',
          time: '9分钟前'
        },
        {
          id: 3,
          title: '核查联状态待确认',
          description: '本月核查联对比数据可能存在缺口，请在成本管理中核对上传状态',
          device: '成本管理 · 核查联',
          level: 'warning',
          time: '18分钟前'
        },
        {
          id: 4,
          title: '结算任务轻微抖动',
          description: '结算队列出现短暂积压，已自动恢复',
          device: '结算引擎 · 队列',
          level: 'info',
          time: '44分钟前'
        }
      ]
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    displayAlerts () {
      if (!this.currentManagerId) return []
      return isDemoManager(this.currentManagerId) ? this.alerts : []
    }
  },
  methods: {
    levelIcon (level) {
      const map = {
        danger: 'el-icon-error',
        warning: 'el-icon-warning',
        info: 'el-icon-info'
      }
      return map[level] || 'el-icon-info'
    },
    levelType (level) {
      const map = {
        danger: 'danger',
        warning: 'warning',
        info: 'info'
      }
      return map[level] || 'info'
    },
    levelText (level) {
      const map = {
        danger: '严重',
        warning: '警告',
        info: '提示'
      }
      return map[level] || '提示'
    }
  }
}
</script>

<style lang="scss" scoped>
.alert-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #F1F5F9;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .icon-box {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.alert {
      background: #FFE4E6;

      i {
        color: #E11D48;
      }
    }

    i {
      font-size: 16px;
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

.panel-body {
  flex: 1;
  overflow: auto;
  padding: 12px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #94A3B8;
  user-select: none;

  .empty-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F1F5F9;

    i {
      font-size: 18px;
      color: #10B981;
    }
  }

  .empty-text {
    font-size: 12px;
  }
}

.alert-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: white;
  border: 1px solid #F1F5F9;
  border-radius: 10px;
  animation: fadeInUp 0.3s ease-out forwards;
  opacity: 0;
  transform: translateY(10px);

  &:hover {
    border-color: #E2E8F0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-level {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.danger {
    background: #FFE4E6;
    i { color: #E11D48; }
  }

  &.warning {
    background: #FEF3C7;
    i { color: #D97706; }
  }

  &.info {
    background: #E0F2FE;
    i { color: #0284C7; }
  }

  i {
    font-size: 14px;
  }
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;

  .alert-title {
    font-size: 12px;
    font-weight: 500;
    color: #1E293B;
  }
}

.alert-desc {
  font-size: 11px;
  color: #64748B;
  margin: 0 0 6px;
  line-height: 1.4;
}

.alert-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .alert-device {
    font-size: 10px;
    color: #94A3B8;
    display: flex;
    align-items: center;
    gap: 4px;

    i {
      font-size: 10px;
    }
  }

  .alert-time {
    font-size: 10px;
    color: #CBD5E1;
  }
}
</style>
