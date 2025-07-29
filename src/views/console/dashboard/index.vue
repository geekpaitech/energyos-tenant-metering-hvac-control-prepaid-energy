<template>
  <div class="oa-dashboard">
    <!-- 统计卡片区域 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon alarm">
          <i class="icon-alarm"></i>
        </div>
        <div class="stat-content">
          <h3>设备报警</h3>
          <p class="stat-number">12</p>
          <span class="stat-label">待处理报警</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon offline">
          <i class="icon-offline"></i>
        </div>
        <div class="stat-content">
          <h3>设备离线</h3>
          <p class="stat-number">8</p>
          <span class="stat-label">离线设备数</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon finance">
          <i class="icon-finance"></i>
        </div>
        <div class="stat-content">
          <h3>财务审核</h3>
          <p class="stat-number">25</p>
          <span class="stat-label">待审核单据</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon tenant">
          <i class="icon-tenant"></i>
        </div>
        <div class="stat-content">
          <h3>租户管理</h3>
          <p class="stat-number">156</p>
          <span class="stat-label">活跃租户</span>
        </div>
      </div>

      <div class="revenue-card">
        <div class="revenue-icon">¥</div>
        <div class="revenue-content">
          <h3>本月收费</h3>
          <div class="revenue-amount">268,580</div>
          <span class="revenue-growth">+12.5% 较上月</span>
        </div>
        <div class="revenue-chart">
          <svg viewBox="0 0 100 40">
            <path d="M0,30 Q25,10 50,20 T100,15" stroke="white" stroke-width="2" fill="none" opacity="0.8"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧内容 -->
      <div class="left-content">
        <!-- 系统通知 -->
        <div class="notification-section">
          <div class="section-header">
            <h3>
              <i class="icon-notification"></i>
              系统通知
              <span class="count">8项</span>
            </h3>
            <i class="icon-arrow-right"></i>
          </div>
          
          <div class="notification-list">
            <div class="notification-item urgent">
              <div class="notification-icon">
                <i class="icon-recharge"></i>
              </div>
              <div class="notification-content">
                <div class="notification-title">租户充值成功通知</div>
                <div class="notification-desc">A栋201租户充值1000元，余额2580元</div>
                <div class="notification-time">5分钟前</div>
              </div>
            </div>
            
            <div class="notification-item warning">
              <div class="notification-icon">
                <i class="icon-debt"></i>
              </div>
              <div class="notification-content">
                <div class="notification-title">设备月租服务费欠费通知</div>
                <div class="notification-desc">B栋305电表月租费欠费320元，请及时处理</div>
                <div class="notification-time">15分钟前</div>
              </div>
            </div>

            <div class="notification-item info">
              <div class="notification-icon">
                <i class="icon-invoice"></i>
              </div>
              <div class="notification-content">
                <div class="notification-title">发票额度欠费管理方通知</div>
                <div class="notification-desc">发票额度不足，当前余额850元</div>
                <div class="notification-time">30分钟前</div>
              </div>
            </div>

            <div class="notification-item success">
              <div class="notification-icon">
                <i class="icon-audit"></i>
              </div>
              <div class="notification-content">
                <div class="notification-title">汽车充电提现审核通过通知</div>
                <div class="notification-desc">提现申请1580元已审核通过</div>
                <div class="notification-time">1小时前</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 设备监控和财务管理 -->
        <div class="monitor-section">
          <div class="monitor-column">
            <div class="section-header">
              <h3>
                <i class="icon-monitor"></i>
                设备监控
              </h3>
              <i class="icon-arrow-right"></i>
            </div>
            
            <div class="monitor-list">
              <div class="monitor-item alarm">
                <div class="monitor-status"></div>
                <div class="monitor-content">
                  <span class="monitor-title">电表功率超限</span>
                  <span class="monitor-desc">A栋301 - 功率15.2KW</span>
                </div>
                <span class="monitor-time">刚刚</span>
              </div>
              
              <div class="monitor-item alarm">
                <div class="monitor-status"></div>
                <div class="monitor-content">
                  <span class="monitor-title">电表分闸告警</span>
                  <span class="monitor-desc">C栋108 - 自动分闸</span>
                </div>
                <span class="monitor-time">2分钟前</span>
              </div>

              <div class="monitor-item success">
                <div class="monitor-status"></div>
                <div class="monitor-content">
                  <span class="monitor-title">电表合闸通知成功</span>
                  <span class="monitor-desc">B栋205 - 用户合闸</span>
                </div>
                <span class="monitor-time">5分钟前</span>
              </div>

              <div class="monitor-item warning">
                <div class="monitor-status"></div>
                <div class="monitor-content">
                  <span class="monitor-title">设备离线告警</span>
                  <span class="monitor-desc">D栋水表012 - 通信异常</span>
                </div>
                <span class="monitor-time">10分钟前</span>
              </div>
            </div>
          </div>

          <div class="finance-column">
            <div class="section-header">
              <h3>
                <i class="icon-finance-manage"></i>
                财务管理
              </h3>
              <i class="icon-arrow-right"></i>
            </div>
            
            <div class="finance-list">
              <div class="finance-item">
                <div class="finance-type pending">充值审核</div>
                <div class="finance-content">
                  <span class="finance-title">管理方充值成功通知</span>
                  <span class="finance-amount">+50,000元</span>
                </div>
              </div>
              
              <div class="finance-item">
                <div class="finance-type processing">提现审核</div>
                <div class="finance-content">
                  <span class="finance-title">租户提现申请</span>
                  <span class="finance-amount">-2,800元</span>
                </div>
              </div>

              <div class="finance-item">
                <div class="finance-type completed">缴费确认</div>
                <div class="finance-content">
                  <span class="finance-title">电费批量收取</span>
                  <span class="finance-amount">+15,680元</span>
                </div>
              </div>

              <div class="finance-item">
                <div class="finance-type pending">发票审核</div>
                <div class="finance-content">
                  <span class="finance-title">月度发票申请</span>
                  <span class="finance-amount">8,950元</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 租户管理 -->
        <div class="tenant-section">
          <div class="section-header">
            <h3>租户管理</h3>
            <i class="icon-more"></i>
          </div>
          
          <div class="tenant-list">
            <div class="tenant-item">
              <div class="tenant-avatar">A301</div>
              <div class="tenant-info">
                <h4>张三 - A栋301室</h4>
                <p>电表：正常 | 水表：正常 | 余额：1,250元</p>
              </div>
              <div class="tenant-status normal">正常</div>
            </div>
            
            <div class="tenant-item">
              <div class="tenant-avatar debt">B205</div>
              <div class="tenant-info">
                <h4>李四 - B栋205室</h4>
                <p>电表：欠费 | 水表：正常 | 余额：-50元</p>
              </div>
              <div class="tenant-status debt">欠费</div>
            </div>

            <div class="tenant-item">
              <div class="tenant-avatar offline">C108</div>
              <div class="tenant-info">
                <h4>王五 - C栋108室</h4>
                <p>电表：离线 | 水表：正常 | 余额：580元</p>
              </div>
              <div class="tenant-status offline">设备异常</div>
            </div>
          </div>
        </div>

        <!-- 数据统计 -->
        <div class="stats-section">
          <div class="stats-card">
            <div class="stats-illustration">
              <i class="icon-chart"></i>
            </div>
            <div class="stats-content">
              <h4>收费统计</h4>
              <div class="stats-chart">
                <div class="chart-bar" style="height: 60%"></div>
                <div class="chart-bar" style="height: 80%"></div>
                <div class="chart-bar" style="height: 45%"></div>
                <div class="chart-bar" style="height: 90%"></div>
                <div class="chart-bar" style="height: 70%"></div>
              </div>
            </div>
          </div>
          
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-content">
                <span class="activity-text">今日电费收取完成，共收取156户，金额32,580元</span>
                <div class="activity-stats">
                  <span><i class="icon-view"></i> 查看详情</span>
                </div>
              </div>
            </div>
            
            <div class="activity-item">
              <div class="activity-content">
                <span class="activity-text">水费账单已生成，涉及租户210户，预计收费28,960元</span>
                <div class="activity-stats">
                  <span><i class="icon-view"></i> 查看详情</span>
                </div>
              </div>
            </div>
            
            <div class="activity-item">
              <div class="activity-content">
                <span class="activity-text">设备巡检完成，发现异常设备8台，已安排维修</span>
                <div class="activity-stats">
                  <span><i class="icon-view"></i> 查看详情</span>
                </div>
              </div>
            </div>

            <div class="activity-item">
              <div class="activity-content">
                <span class="activity-text">月度财务报表生成，收费率98.5%，较上月提升2.1%</span>
                <div class="activity-stats">
                  <span><i class="icon-view"></i> 查看详情</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧边栏 -->
      <div class="right-sidebar">
        <!-- 今日概览 -->
        <div class="today-overview">
          <div class="overview-header">
            <h3>今日概览</h3>
            <div class="date-info">
              <span>2024年4月15日</span>
            </div>
          </div>
          
          <div class="overview-stats">
            <div class="overview-item">
              <div class="overview-number">1,258</div>
              <div class="overview-label">在线设备</div>
            </div>
            <div class="overview-item">
              <div class="overview-number">8</div>
              <div class="overview-label">离线设备</div>
            </div>
            <div class="overview-item">
              <div class="overview-number">32,580</div>
              <div class="overview-label">今日收费(元)</div>
            </div>
            <div class="overview-item">
              <div class="overview-number">12</div>
              <div class="overview-label">待处理报警</div>
            </div>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="quick-actions">
          <div class="actions-header">
            <h3>快速操作</h3>
          </div>
          
          <div class="actions-grid">
            <div class="action-item">
              <div class="action-icon recharge">
                <i class="icon-recharge"></i>
              </div>
              <span class="action-name">租户充值</span>
            </div>
            
            <div class="action-item">
              <div class="action-icon bill">
                <i class="icon-bill"></i>
              </div>
              <span class="action-name">生成账单</span>
            </div>
            
            <div class="action-item">
              <div class="action-icon device">
                <i class="icon-device"></i>
              </div>
              <span class="action-name">设备管理</span>
            </div>
            
            <div class="action-item">
              <div class="action-icon report">
                <i class="icon-report"></i>
              </div>
              <span class="action-name">数据报表</span>
            </div>

            <div class="action-item">
              <div class="action-icon maintenance">
                <i class="icon-maintenance"></i>
              </div>
              <span class="action-name">设备维护</span>
            </div>

            <div class="action-item">
              <div class="action-icon audit">
                <i class="icon-audit"></i>
              </div>
              <span class="action-name">财务审核</span>
            </div>
          </div>
        </div>

        <!-- 设备状态 -->
        <div class="device-status">
          <div class="status-header">
            <h3>设备状态</h3>
          </div>
          
          <div class="status-list">
            <div class="status-item">
              <div class="status-indicator normal"></div>
              <div class="status-content">
                <div class="status-title">A栋电表组</div>
                <div class="status-desc">32台在线 / 2台离线</div>
              </div>
            </div>
            
            <div class="status-item">
              <div class="status-indicator warning"></div>
              <div class="status-content">
                <div class="status-title">B栋水表组</div>
                <div class="status-desc">28台在线 / 4台离线</div>
              </div>
            </div>
            
            <div class="status-item">
              <div class="status-indicator normal"></div>
              <div class="status-content">
                <div class="status-title">C栋电表组</div>
                <div class="status-desc">45台在线 / 1台离线</div>
              </div>
            </div>
            
            <div class="status-item">
              <div class="status-indicator alarm"></div>
              <div class="status-content">
                <div class="status-title">D栋综合组</div>
                <div class="status-desc">30台在线 / 8台异常</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 系统信息 -->
        <div class="system-info">
          <div class="info-header">
            <h3>系统信息</h3>
          </div>
          
          <div class="info-content">
            <div class="info-item">
              <span class="info-label">系统版本</span>
              <span class="info-value">v2.3.1</span>
            </div>
            <div class="info-item">
              <span class="info-label">在线用户</span>
              <span class="info-value">156人</span>
            </div>
            <div class="info-item">
              <span class="info-label">数据更新</span>
              <span class="info-value">2分钟前</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MeterOADashboard',
  data() {
    return {
      currentDate: new Date(),
      notifications: [
        {
          id: 1,
          title: '租户充值成功通知',
          desc: 'A栋201租户充值1000元，余额2580元',
          time: '5分钟前',
          type: 'urgent'
        },
        {
          id: 2,
          title: '设备月租服务费欠费通知',
          desc: 'B栋305电表月租费欠费320元，请及时处理',
          time: '15分钟前',
          type: 'warning'
        }
      ],
      deviceAlerts: [
        {
          id: 1,
          title: '电表功率超限',
          location: 'A栋301',
          value: '功率15.2KW',
          time: '刚刚',
          type: 'alarm'
        },
        {
          id: 2,
          title: '电表分闸告警',
          location: 'C栋108',
          value: '自动分闸',
          time: '2分钟前',
          type: 'alarm'
        }
      ],
      tenants: [
        {
          id: 1,
          name: '张三',
          room: 'A栋301室',
          electric: '正常',
          water: '正常',
          balance: 1250,
          status: 'normal'
        },
        {
          id: 2,
          name: '李四',
          room: 'B栋205室',
          electric: '欠费',
          water: '正常',
          balance: -50,
          status: 'debt'
        }
      ]
    }
  },
  
  methods: {
    handleNotificationClick(notification) {
      console.log('Notification clicked:', notification);
    },
    
    handleDeviceClick(device) {
      console.log('Device clicked:', device);
    },
    
    handleTenantClick(tenant) {
      console.log('Tenant clicked:', tenant);
    },

    handleQuickAction(action) {
      console.log('Quick action:', action);
    }
  }
}
</script>
<style lang="scss" scoped>
.oa-dashboard {
  background: #f5f6fa;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
  padding: 24px;
  
  // 统计卡片区域
  .stats-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr) 1.5fr;
    gap: 20px;
    margin-bottom: 24px;
    
    .stat-card {
      background: white;
      border-radius: 8px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      border: 1px solid #e5e7eb;
      transition: box-shadow 0.2s ease;
      
      &:hover {
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      
      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &.alarm {
          background: #fef2f2;
          color: #dc2626;
        }
        
        &.offline {
          background: #fef3c7;
          color: #d97706;
        }
        
        &.finance {
          background: #eff6ff;
          color: #2563eb;
        }
        
        &.tenant {
          background: #f0f9ff;
          color: #0284c7;
        }
        
        i {
          font-size: 20px;
        }
      }
      
      .stat-content {
        h3 {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          margin: 0 0 4px 0;
        }
        
        .stat-number {
          font-size: 28px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 2px 0;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 12px;
          color: #9ca3af;
        }
      }
    }
    
    .revenue-card {
      background: #374151;
      border-radius: 8px;
      padding: 24px;
      color: white;
      position: relative;
      overflow: hidden;
      border: 1px solid #4b5563;
      
      .revenue-icon {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #e5e7eb;
      }
      
      .revenue-content {
        h3 {
          font-size: 14px;
          margin: 0 0 8px 0;
          color: #d1d5db;
          font-weight: 500;
        }
        
        .revenue-amount {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 4px;
          color: white;
        }
        
        .revenue-growth {
          font-size: 12px;
          color: #10b981;
          font-weight: 500;
        }
      }
      
      .revenue-chart {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 100px;
        height: 40px;
        opacity: 0.2;
      }
    }
  }
  
  // 主要内容区域
  .main-content {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
    
    .left-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
      
      // 系统通知
      .notification-section {
        background: white;
        border-radius: 8px;
        padding: 24px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        border: 1px solid #e5e7eb;
        
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          
          h3 {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin: 0;
            
            i {
              font-size: 16px;
              color: #6b7280;
            }
            
            .count {
              background: #374151;
              color: white;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 500;
            }
          }
          
          i.icon-arrow-right {
            color: #9ca3af;
            cursor: pointer;
            transition: color 0.2s ease;
            
            &:hover {
              color: #6b7280;
            }
          }
        }
        
        .notification-list {
          .notification-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px 0;
            border-bottom: 1px solid #f3f4f6;
            cursor: pointer;
            transition: background-color 0.2s ease;
            border-radius: 6px;
            margin: 0 -12px;
            padding: 16px 12px;
            
            &:hover {
              background: #f9fafb;
            }
            
            &:last-child {
              border-bottom: none;
            }
            
            .notification-icon {
              width: 36px;
              height: 36px;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              
              i {
                font-size: 16px;
              }
            }
            
            &.urgent .notification-icon {
              background: #dcfce7;
              color: #16a34a;
            }
            
            &.warning .notification-icon {
              background: #fef3c7;
              color: #d97706;
            }
            
            &.info .notification-icon {
              background: #eff6ff;
              color: #2563eb;
            }
            
            &.success .notification-icon {
              background: #f0f9ff;
              color: #0284c7;
            }
            
            .notification-content {
              flex: 1;
              
              .notification-title {
                font-size: 14px;
                font-weight: 500;
                color: #111827;
                margin-bottom: 4px;
              }
              
              .notification-desc {
                font-size: 13px;
                color: #6b7280;
                line-height: 1.4;
                margin-bottom: 4px;
              }
              
              .notification-time {
                font-size: 12px;
                color: #9ca3af;
              }
            }
          }
        }
      }
      
      // 设备监控和财务管理
      .monitor-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        
        .monitor-column, .finance-column {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          border: 1px solid #e5e7eb;
          
          .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            
            h3 {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 16px;
              font-weight: 600;
              color: #111827;
              margin: 0;
              
              i {
                font-size: 16px;
                color: #6b7280;
              }
            }
            
            i.icon-arrow-right {
              color: #9ca3af;
              cursor: pointer;
              transition: color 0.2s ease;
              
              &:hover {
                color: #6b7280;
              }
            }
          }
          
          .monitor-list {
            .monitor-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 12px 0;
              border-bottom: 1px solid #f9fafb;
              cursor: pointer;
              transition: background-color 0.2s ease;
              border-radius: 4px;
              margin: 0 -8px;
              padding: 12px 8px;
              
              &:hover {
                background: #f9fafb;
              }
              
              &:last-child {
                border-bottom: none;
              }
              
              .monitor-status {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                flex-shrink: 0;
              }
              
              &.alarm .monitor-status {
                background: #dc2626;
              }
              
              &.warning .monitor-status {
                background: #d97706;
              }
              
              &.success .monitor-status {
                background: #16a34a;
              }
              
              .monitor-content {
                flex: 1;
                
                .monitor-title {
                  display: block;
                  font-size: 13px;
                  font-weight: 500;
                  color: #111827;
                  margin-bottom: 2px;
                }
                
                .monitor-desc {
                  font-size: 12px;
                  color: #6b7280;
                }
              }
              
              .monitor-time {
                font-size: 11px;
                color: #9ca3af;
              }
            }
          }
          
          .finance-list {
            .finance-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 12px 0;
              border-bottom: 1px solid #f9fafb;
              cursor: pointer;
              transition: background-color 0.2s ease;
              border-radius: 4px;
              margin: 0 -8px;
              padding: 12px 8px;
              
              &:hover {
                background: #f9fafb;
              }
              
              &:last-child {
                border-bottom: none;
              }
              
              .finance-type {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
                flex-shrink: 0;
                border: 1px solid;
                
                &.pending {
                  background: #fffbeb;
                  color: #d97706;
                  border-color: #fed7aa;
                }
                
                &.processing {
                  background: #eff6ff;
                  color: #2563eb;
                  border-color: #bfdbfe;
                }
                
                &.completed {
                  background: #f0fdf4;
                  color: #16a34a;
                  border-color: #bbf7d0;
                }
              }
              
              .finance-content {
                flex: 1;
                
                .finance-title {
                  display: block;
                  font-size: 13px;
                  color: #111827;
                  margin-bottom: 2px;
                  font-weight: 500;
                }
                
                .finance-amount {
                  font-size: 12px;
                  font-weight: 600;
                  color: #16a34a;
                }
              }
            }
          }
        }
      }
      
      // 租户管理
      .tenant-section {
        background: white;
        border-radius: 8px;
        padding: 24px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        border: 1px solid #e5e7eb;
        
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          
          h3 {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }
          
          i {
            color: #9ca3af;
            cursor: pointer;
            transition: color 0.2s ease;
            
            &:hover {
              color: #6b7280;
            }
          }
        }
        
        .tenant-list {
          .tenant-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 0;
            border-bottom: 1px solid #f3f4f6;
            cursor: pointer;
            transition: background-color 0.2s ease;
            border-radius: 6px;
            margin: 0 -12px;
            padding: 16px 12px;
            
            &:hover {
              background: #f9fafb;
            }
            
            &:last-child {
              border-bottom: none;
            }
            
            .tenant-avatar {
              width: 44px;
              height: 44px;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 600;
              color: white;
              background: #6b7280;
              
              &.debt {
                background: #dc2626;
              }
              
              &.offline {
                background: #d97706;
              }
            }
            
            .tenant-info {
              flex: 1;
              
              h4 {
                font-size: 14px;
                font-weight: 500;
                color: #111827;
                margin: 0 0 4px 0;
              }
              
              p {
                font-size: 12px;
                color: #6b7280;
                margin: 0;
              }
            }
            
            .tenant-status {
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 500;
              border: 1px solid;
              
              &.normal {
                background: #f0fdf4;
                color: #16a34a;
                border-color: #bbf7d0;
              }
              
              &.debt {
                background: #fef2f2;
                color: #dc2626;
                border-color: #fecaca;
              }
              
              &.offline {
                background: #fffbeb;
                color: #d97706;
                border-color: #fed7aa;
              }
            }
          }
        }
      }
      
      // 数据统计
      .stats-section {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 24px;
        
        .stats-card {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          border: 1px solid #e5e7eb;
          text-align: center;
          
          .stats-illustration {
            margin-bottom: 16px;
            
            i {
              font-size: 40px;
              color: #6b7280;
            }
          }
          
          h4 {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 16px 0;
          }
          
          .stats-chart {
            display: flex;
            align-items: flex-end;
            justify-content: center;
            gap: 6px;
            height: 80px;
            
            .chart-bar {
              width: 12px;
              background: #6b7280;
              border-radius: 2px;
              transition: background-color 0.2s ease;
              
              &:hover {
                background: #374151;
              }
            }
          }
        }
        
        .activity-list {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          border: 1px solid #e5e7eb;
          
          .activity-item {
            padding: 16px 0;
            border-bottom: 1px solid #f3f4f6;
            cursor: pointer;
            transition: background-color 0.2s ease;
            border-radius: 4px;
            margin: 0 -12px;
            padding: 16px 12px;
            
            &:hover {
              background: #f9fafb;
            }
            
            &:last-child {
              border-bottom: none;
            }
            
            .activity-content {
              .activity-text {
                display: block;
                font-size: 13px;
                color: #111827;
                line-height: 1.5;
                margin-bottom: 8px;
              }
              
              .activity-stats {
                span {
                  display: flex;
                  align-items: center;
                  gap: 4px;
                  font-size: 12px;
                  color: #6b7280;
                  cursor: pointer;
                  transition: color 0.2s ease;
                  
                  &:hover {
                    color: #374151;
                  }
                  
                  i {
                    font-size: 12px;
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // 右侧边栏
    .right-sidebar {
      display: flex;
      flex-direction: column;
      gap: 24px;
      
      // 今日概览
      .today-overview {
        background: white;
        border-radius: 8px;
        padding: 24px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        border: 1px solid #e5e7eb;
        
        .overview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          
          h3 {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }
          
          .date-info {
            span {
              font-size: 12px;
              color: #6b7280;
            }
          }
        }
        
        .overview-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          
          .overview-item {
            text-align: center;
            padding: 16px;
            background: #f9fafb;
            border-radius: 6px;
            border: 1px solid #f3f4f6;
            transition: border-color 0.2s ease;
            
            &:hover {
              border-color: #e5e7eb;
            }
            
            .overview-number {
              font-size: 20px;
              font-weight: 600;
              color: #111827;
              margin-bottom: 4px;
            }
            
            .overview-label {
              font-size: 11px;
              color: #6b7280;
              font-weight: 500;
            }
          }
        }
      }
      
      // 快速操作
      .quick-actions {
        background: white;
        border-radius: 8px;
        padding: 24px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        border: 1px solid #e5e7eb;
        
        .actions-header {
          margin-bottom: 20px;
          
          h3 {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }
        }
        
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          
          .action-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid #f3f4f6;
            
            &:hover {
              border-color: #e5e7eb;
              background: #f9fafb;
            }
            
            .action-icon {
              width: 36px;
              height: 36px;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 8px;
              
              &.recharge {
                background: #f0fdf4;
                color: #16a34a;
              }
              
              &.bill {
                background: #eff6ff;
                color: #2563eb;
              }
              
              &.device {
                background: #fffbeb;
                color: #d97706;
              }
              
              &.report {
                background: #f8fafc;
                color: #64748b;
              }
              
              &.maintenance {
                background: #fef2f2;
                color: #dc2626;
              }
              
              &.audit {
                background: #f0f9ff;
                color: #0284c7;
              }
              
              i {
                font-size: 16px;
              }
            }
            
            .action-name {
              font-size: 12px;
              color: #111827;
              text-align: center;
              font-weight: 500;
            }
          }
        }
      }
      
      // 设备状态
      .device-status {
        background: white;
        border-radius: 8px;
        padding: 24px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        border: 1px solid #e5e7eb;
        
        .status-header {
          margin-bottom: 20px;
          
          h3 {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }
        }
        
        .status-list {
          .status-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
            cursor: pointer;
            transition: background-color 0.2s ease;
            border-radius: 4px;
            margin: 0 -8px;
            padding: 12px 8px;
            
            &:hover {
              background: #f9fafb;
            }
            
            &:last-child {
              border-bottom: none;
            }
            
            .status-indicator {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              
              &.normal {
                background: #16a34a;
              }
              
              &.warning {
                background: #d97706;
              }
              
              &.alarm {
                background: #dc2626;
              }
            }
            
            .status-content {
              .status-title {
                font-size: 13px;
                font-weight: 500;
                color: #111827;
                margin-bottom: 2px;
              }
              
              .status-desc {
                font-size: 12px;
                color: #6b7280;
              }
            }
          }
        }
      }
      
      // 系统信息
      .system-info {
        background: white;
        border-radius: 8px;
        padding: 24px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        border: 1px solid #e5e7eb;
        
        .info-header {
          margin-bottom: 20px;
          
          h3 {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }
        }
        
        .info-content {
          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            
            .info-label {
              font-size: 12px;
              color: #6b7280;
            }
            
            .info-value {
              font-size: 12px;
              color: #111827;
              font-weight: 500;
            }
          }
        }
      }
    }
  }
}

// 图标占位 - 预留位置，暂不显示
.icon-alarm::before,
.icon-offline::before,
.icon-finance::before,
.icon-tenant::before,
.icon-notification::before,
.icon-arrow-right::before,
.icon-recharge::before,
.icon-debt::before,
.icon-invoice::before,
.icon-audit::before,
.icon-monitor::before,
.icon-finance-manage::before,
.icon-more::before,
.icon-chart::before,
.icon-view::before,
.icon-bill::before,
.icon-device::before,
.icon-report::before,
.icon-maintenance::before {
  content: '';
}

// 响应式设计
@media (max-width: 1200px) {
  .oa-dashboard {
    .main-content {
      grid-template-columns: 1fr;
      
      .right-sidebar {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
        
        .today-overview {
          grid-column: 1 / -1;
        }
      }
    }
    
    .stats-cards {
      grid-template-columns: repeat(3, 1fr) 1.5fr;
      
      .stat-card:nth-child(4) {
        display: none;
      }
    }
  }
}

@media (max-width: 768px) {
  .oa-dashboard {
    padding: 16px;
    
    .stats-cards {
      grid-template-columns: 1fr;
      gap: 16px;
      
      .revenue-card {
        order: -1;
      }
    }
    
    .main-content {
      gap: 20px;
      
      .left-content {
        gap: 20px;
        
        .monitor-section {
          grid-template-columns: 1fr;
        }
        
        .stats-section {
          grid-template-columns: 1fr;
        }
      }
      
      .right-sidebar {
        grid-template-columns: 1fr;
        gap: 20px;
        
        .actions-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .oa-dashboard {
    padding: 12px;
    
    .stats-cards {
      gap: 12px;
    }
    
    .main-content {
      gap: 16px;
      
      .left-content {
        gap: 16px;
      }
      
      .right-sidebar {
        gap: 16px;
        
        .actions-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    }
  }
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .oa-dashboard {
    background: #0f172a;
    
    .stat-card,
    .notification-section,
    .monitor-column,
    .finance-column,
    .tenant-section,
    .stats-card,
    .activity-list,
    .today-overview,
    .quick-actions,
    .device-status,
    .system-info {
      background: #1e293b;
      border-color: #334155;
      color: #f1f5f9;
    }
    
    .revenue-card {
      background: #334155;
      border-color: #475569;
    }
    
    h3, h4,
    .notification-title,
    .monitor-title,
    .finance-title,
    .status-title,
    .activity-text,
    .stat-number,
    .overview-number {
      color: #f1f5f9;
    }
    
    .notification-desc,
    .monitor-desc,
    .status-desc,
    .info-label,
    .stat-label,
    .overview-label {
      color: #94a3b8;
    }
    
    .overview-item {
      background: #334155;
      border-color: #475569;
    }
  }
}

// 打印样式
@media print {
  .oa-dashboard {
    background: white;
    padding: 0;
    
    .revenue-card .revenue-chart,
    .stats-chart {
      display: none;
    }
    
    .main-content {
      grid-template-columns: 1fr;
    }
    
    .stats-cards {
      grid-template-columns: repeat(4, 1fr);
    }
  }
}

// 无障碍访问增强
.oa-dashboard {
  *:focus {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
    border-radius: 4px;
  }
  
  .action-item,
  .notification-item,
  .tenant-item,
  .status-item,
  .monitor-item,
  .finance-item {
    min-height: 44px;
  }
  
  // 键盘导航支持
  .action-item:focus,
  .notification-item:focus,
  .tenant-item:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
}

// 加载状态
.oa-dashboard {
  .loading {
    position: relative;
    opacity: 0.6;
    pointer-events: none;
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 16px;
      height: 16px;
      margin: -8px 0 0 -8px;
      border: 2px solid #e5e7eb;
      border-top: 2px solid #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      z-index: 1000;
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
}

// 状态消息
.oa-dashboard {
  .error-message {
    background: #fef2f2;
    color: #991b1b;
    padding: 12px 16px;
    border-radius: 6px;
    border: 1px solid #fecaca;
    font-size: 14px;
    margin: 12px 0;
  }

  .success-message {
    background: #f0fdf4;
    color: #166534;
    padding: 12px 16px;
    border-radius: 6px;
    border: 1px solid #bbf7d0;
    font-size: 14px;
    margin: 12px 0;
  }
  
  .warning-message {
    background: #fffbeb;
    color: #92400e;
    padding: 12px 16px;
    border-radius: 6px;
    border: 1px solid #fed7aa;
    font-size: 14px;
    margin: 12px 0;
  }
}

// 空状态样式
.oa-dashboard {
  .empty-state {
    text-align: center;
    padding: 48px 24px;
    color: #6b7280;
    
    .empty-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 16px;
      background: #f3f4f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
      font-size: 24px;
    }
    
    .empty-text {
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 16px;
    }
    
    .empty-action {
      button {
        background: #2563eb;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background-color 0.2s ease;
        
        &:hover {
          background: #1d4ed8;
        }
        
        &:focus {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }
      }
    }
  }
}

// 自定义滚动条
.oa-dashboard {
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
    
    &:hover {
      background: #94a3b8;
    }
  }
}

// 选择文本样式
.oa-dashboard {
  ::selection {
    background: #dbeafe;
    color: #1e40af;
  }

  ::-moz-selection {
    background: #dbeafe;
    color: #1e40af;
  }
}

// 微交互增强
.oa-dashboard {
  .stat-card,
  .notification-item,
  .tenant-item,
  .action-item,
  .status-item,
  .monitor-item,
  .finance-item,
  .activity-item {
    &:active {
      transform: translateY(1px);
    }
  }
  
  // 数据可视化增强
  .chart-bar {
    &:nth-child(1) { background: #64748b; }
    &:nth-child(2) { background: #475569; }
    &:nth-child(3) { background: #64748b; }
    &:nth-child(4) { background: #374151; }
    &:nth-child(5) { background: #64748b; }
  }
}

// 表格样式增强
.oa-dashboard {
  .data-table {
    width: 100%;
    border-collapse: collapse;
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    td {
      font-size: 14px;
      color: #111827;
    }
    
    tbody tr:hover {
      background: #f9fafb;
    }
  }
}

// 工具提示样式
.oa-dashboard {
  [data-tooltip] {
    position: relative;
    
    &:hover::after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: #111827;
      color: white;
      padding: 6px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 1000;
      margin-bottom: 4px;
      
      &::before {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: #111827;
      }
    }
  }
}

// 动画减少偏好
@media (prefers-reduced-motion: reduce) {
  .oa-dashboard * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// 高对比度支持
@media (prefers-contrast: high) {
  .oa-dashboard {
    .stat-card,
    .notification-item,
    .tenant-item,
    .action-item {
      border: 2px solid #000;
    }
    
    .status-indicator {
      border: 1px solid #000;
    }
  }
}
</style>