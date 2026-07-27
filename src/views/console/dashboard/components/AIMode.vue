<template>
  <div class="ai-mode">
    <div class="ai-toolbar">
      <div class="toolbar-left">
        <div class="title">
          <i class="el-icon-chat-dot-round"></i>
          <span>AI能源助手</span>
        </div>
        <el-button size="mini" icon="el-icon-refresh" @click="refreshChart">刷新</el-button>
      </div>
      <div class="toolbar-right">
        <el-button size="small" class="deep-ask-btn" @click="goDeepMode">
          <i class="el-icon-edit-outline"></i>深度问话
        </el-button>
      </div>
    </div>

    <div class="ai-layout">
      <!-- ── 左侧图表区 ── -->
      <div class="chart-area">
        <div class="chart-card">
          <div class="chart-header">
            <div class="header-left">
              <div class="icon-box"><i class="el-icon-magic-stick"></i></div>
              <div class="title-box">
                <h3>{{ currentChart.title }}</h3>
                <p>AI实时分析 · 数据已同步</p>
              </div>
            </div>
            <div class="header-right">
              <el-button-group v-if="currentChart.type === 'trend'">
                <el-button size="mini" :type="datePeriod === 'day' ? 'primary' : 'default'"
                  @click="setPeriod('day')">近七天</el-button>
                <el-button size="mini" :type="datePeriod === 'month' ? 'primary' : 'default'"
                  @click="setPeriod('month')">近半年</el-button>
              </el-button-group>
              <el-tag type="primary"><span class="pulse-dot"></span>AI分析中</el-tag>
            </div>
          </div>
          <div class="chart-body">
            <div ref="chartRef" class="chart-container"></div>
          </div>
        </div>
      </div>

      <!-- ── 右侧聊天区（纯文本）── -->
      <div class="chat-area">
        <div class="chat-card">
          <div class="chat-header">
            <div class="chat-header-left">
              <div class="ai-avatar">
                <div class="avatar-box"><i class="el-icon-chat-dot-round"></i></div>
                <span class="status-dot"></span>
              </div>
              <div class="title-box">
                <h3>AI能源助手</h3>
                <p>智能问答 · 数据分析 · 策略建议</p>
              </div>
            </div>
          </div>

          <div class="chat-body">
            <div class="quick-questions">
              <p>快速提问</p>
              <div class="question-tags">
                <el-tag v-for="(q, i) in quickQuestions" :key="i" size="small" @click="sendQuestion(q)">
                  <i :class="q.icon"></i>{{ q.text }}
                </el-tag>
              </div>
            </div>

            <!-- 纯文本摘要 -->
            <div v-if="rightPanel.visible" class="right-summary">
              <div class="right-summary-header">
                <div class="right-summary-header-left">
                  <i class="el-icon-data-analysis"></i>
                  <span class="right-summary-title">{{ rightPanel.title }}</span>
                </div>
                <div class="right-summary-header-actions">
                  <el-button type="text" size="mini" class="right-summary-action"
                    @click="openRightPanelDetail">详情</el-button>
                  <el-button type="text" size="mini" class="right-summary-action"
                    @click="clearRightPanel">收起</el-button>
                </div>
              </div>
              <div v-if="rightPanelKpis.length" class="right-summary-kpis">
                <div v-for="(k, idx) in rightPanelKpis" :key="idx" class="kpi">
                  <span class="kpi-label">{{ k.label }}</span>
                  <span class="kpi-value">{{ k.value }}</span>
                </div>
              </div>
              <div class="right-summary-text" v-html="formatPreview(rightPanel.text, 6)"></div>
            </div>

            <div ref="messagesRef" class="messages">
              <div v-for="msg in messages" :key="msg.id" :class="['message', msg.role]">
                <div class="avatar">
                  <i :class="msg.role === 'user' ? 'el-icon-user' : 'el-icon-chat-dot-round'"></i>
                </div>
                <div class="content" v-html="formatContent(msg.content)"></div>
              </div>
              <div v-if="isTyping" class="message ai typing">
                <div class="avatar"><i class="el-icon-chat-dot-round"></i></div>
                <div class="content">
                  <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                </div>
              </div>
            </div>
          </div>

          <div class="chat-input">
            <div class="trae-inputbar">
              <div class="bar-left">
                <span class="chip agent"><i class="el-icon-user"></i>Agent</span>
              </div>
              <div class="bar-center">
                <el-input v-model="inputText" placeholder="请输入您的问题…" class="trae-input"
                  @focus="goDeepMode" @click.native="goDeepMode" readonly />
              </div>
              <div class="bar-right">
                <button class="send-btn-circle" :disabled="isTyping" @click="goDeepMode">
                  <i class="el-icon-upload2"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog :visible.sync="rightPanel.dialogVisible" :title="rightPanel.title" width="780px" :append-to-body="false"
      :custom-class="rightPanel.type === 'saving' ? 'saving-dialog' : ''">
      <div v-if="rightPanel.type === 'saving'" class="saving-dialog-body">
        <el-tabs v-model="rightPanel.activeTab">
          <el-tab-pane label="概览" name="overview">
            <div class="saving-kpis">
              <div v-for="(k, idx) in rightPanelKpis" :key="idx" class="kpi">
                <span class="kpi-label">{{ k.label }}</span>
                <span class="kpi-value">{{ k.value }}</span>
              </div>
            </div>
            <div v-if="savingWeekendNote" class="saving-note">{{ savingWeekendNote }}</div>
            <div class="saving-preview" v-html="formatSavingPreview(rightPanel.text, 10)"></div>
          </el-tab-pane>

          <el-tab-pane label="Top5表计" name="top5" lazy>
            <div class="saving-table-wrap">
              <el-table v-if="savingTop5Rows.length" :data="savingTop5Rows" max-height="420" size="small" stripe
                class="saving-table">
                <el-table-column prop="meterName" label="表计" min-width="140" show-overflow-tooltip />
                <el-table-column prop="bindName" label="归属" min-width="160" show-overflow-tooltip />
                <el-table-column prop="online" label="在线" width="70" />
                <el-table-column prop="peakTopKwh" label="尖+峰(kWh)" width="110" align="right" />
                <el-table-column prop="energyCost" label="电能费(¥)" width="110" align="right" />
                <el-table-column prop="shiftCapPct" label="可移上限" width="90" align="right" />
                <el-table-column prop="hint" label="提示" min-width="160" show-overflow-tooltip />
              </el-table>
              <el-empty v-else description="暂无数据" :image-size="80" />
            </div>
          </el-tab-pane>

          <el-tab-pane label="测算" name="calc" lazy>
            <div class="saving-table-wrap">
              <el-table v-if="savingScenarioRows.length" :data="savingScenarioRows" max-height="280" size="small" stripe
                class="saving-table">
                <el-table-column prop="target" label="目标" />
                <el-table-column prop="movableKwh" label="预计可移(kWh)" />
                <el-table-column prop="saving" label="预计节省(¥)"   />
              </el-table>
              <el-empty v-else description="暂无数据" :image-size="80" />
            </div>
          </el-tab-pane>

          <el-tab-pane label="基础问题" name="issues">
            <div class="saving-issues">
              <div class="issue-item">
                <span class="issue-label">离线表计</span>
                <span class="issue-value">{{ savingBasics.offline }} 个</span>
              </div>
              <div class="issue-item">
                <span class="issue-label">余额为负</span>
                <span class="issue-value">{{ savingBasics.negativeBalance }} 个</span>
              </div>
              <div class="issue-item">
                <span class="issue-label">分时电价表</span>
                <span class="issue-value">{{ savingBasics.tou }} 只</span>
              </div>
              <div class="issue-item">
                <span class="issue-label">固定电价表</span>
                <span class="issue-value">{{ savingBasics.fixed }} 只</span>
              </div>
            </div>
            <div class="saving-full" v-html="formatSavingContent(extractSection(rightPanel.text, '需要先处理的基础问题：'))"></div>
          </el-tab-pane>

          <el-tab-pane label="建议" name="actions">
            <div class="saving-full" v-html="formatSavingContent(extractSection(rightPanel.text, '落地建议（按优先级，尽量能执行、能验收）：'))"></div>
          </el-tab-pane>

          <el-tab-pane label="全文" name="full">
            <div class="saving-full" v-html="formatSavingContent(rightPanel.text)"></div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <div v-else class="right-summary-dialog" v-html="formatContent(rightPanel.text)"></div>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import moment from 'moment'
import store from '@/store'
import Cookies from 'js-cookie'
import { getAiApiUrl } from '@/utils/aiServiceConfig'
import { getSimpleTenantList } from '@/api/useReport'
import { getElecStatistics, isDemoManager, queryTenantSankey } from '@/api/newDashboard'

const SANKEY_COLORS = [
  '#5B8FF9',
  '#61DDAA',
  '#F6BD16',
  '#7262FD',
  '#78D3F8',
  '#9661BC',
  '#F6903D',
  '#008685'
]

export default {
  name: 'AIMode',
  computed: {
    currentManagerId () {
      return store.getters['manager/currentManagerId']
    },
    rightPanelKpis () {
      if (!this.rightPanel || !this.rightPanel.visible) return []
      if (this.rightPanel.type !== 'saving') return []
      return this.extractSavingKpis(this.rightPanel.raw, String(this.rightPanel.text || ''))
    },
    savingTop5Rows () {
      if (!this.rightPanel || this.rightPanel.type !== 'saving') return []
      const raw = this.rightPanel.raw || {}
      const items = (raw && raw.top5Meters) ? raw.top5Meters : []
      if (!Array.isArray(items)) return []
      return items.map(x => {
        const curve = (x && x.curve) ? x.curve : {}
        const p10 = Number(curve.p10 || 0)
        const p95 = Number(curve.p95 || 0)
        const night = Number(curve.nightMean || 0)
        const daym = Number(curve.dayMean || 0)
        const hints = []
        if (night > 0 && daym > 0 && night / Math.max(1e-9, daym) > 0.9) hints.push('夜间未明显下降')
        if (p95 > 0 && p10 > 0 && p95 / Math.max(1e-9, p10) > 2.5) hints.push('存在尖峰')
        const online = Number(x.onlineStatus || 0) === 1 ? '在线' : '离线'
        return {
          meterName: String(x.meterName || '-'),
          bindName: String(x.bindName || '-'),
          online,
          peakTopKwh: Number(x.peakTopKwh || 0).toFixed(0),
          energyCost: Number(x.energyCost || 0).toFixed(0),
          shiftCapPct: `${Math.round(Number(x.shiftCap || 0) * 100)}%`,
          hint: hints.length ? hints.join('、') : '—'
        }
      })
    },
    savingScenarioRows () {
      if (!this.rightPanel || this.rightPanel.type !== 'saving') return []
      const raw = this.rightPanel.raw || {}
      const items = raw && Array.isArray(raw.scenarioSavings) ? raw.scenarioSavings : null
      if (items && items.length) {
        return items
          .filter(x => x && Number(x.movable_kwh || 0) > 0)
          .map(x => ({
            target: `${Math.round(Number(x.ratio || 0) * 100)}%`,
            movableKwh: Number(x.movable_kwh || 0).toFixed(2),
            saving: Number(x.saving_amount || 0).toFixed(2)
          }))
      }
      const s = String(this.rightPanel.text || '')
      const lines = s.split(/\r?\n/)
      const out = []
      for (const line of lines) {
        const m = line.match(/目标\s*(\d+)%[\s\S]*?可移≈\s*([0-9,.]+)\s*kWh[\s\S]*?省\s*\**¥\s*([0-9,.]+)\**/)
        if (!m) continue
        out.push({ target: `${m[1]}%`, movableKwh: m[2], saving: m[3] })
      }
      return out
    },
    savingBasics () {
      const raw = (this.rightPanel && this.rightPanel.raw) ? this.rightPanel.raw : {}
      const p = raw && raw.pricePlanCount ? raw.pricePlanCount : {}
      return {
        offline: Number(raw.offlineMeterCount || 0),
        negativeBalance: Number(raw.negativeBalanceMeterCount || 0),
        tou: Number(p.tou || 0),
        fixed: Number(p.fixed || 0)
      }
    },
    savingWeekendNote () {
      const raw = (this.rightPanel && this.rightPanel.raw) ? this.rightPanel.raw : {}
      const w = raw && raw.weekendVsWeekday ? raw.weekendVsWeekday : null
      if (!w || !w.weekendAvgKwh || !w.weekdayAvgKwh) return ''
      const ratio = Number(w.ratioPct || 0)
      const a = Number(w.weekendAvgKwh || 0).toFixed(0)
      const b = Number(w.weekdayAvgKwh || 0).toFixed(0)
      if (w.weekendNoDrop) return `周末用电未明显下降：周末日均≈${a} kWh，工作日日均≈${b} kWh（≈${ratio.toFixed(0)}%），优先排查设备未关闭/夜间常开。`
      return `周末/工作日用电对比：周末日均≈${a} kWh，工作日日均≈${b} kWh（≈${ratio.toFixed(0)}%）。`
    }
  },
  watch: {
    currentManagerId () {
      this.refreshChart()
    }
  },
  data () {
    return {
      chart: null,
      inputText: '',
      isTyping: false,
      messageSeq: 0,
      rightPanel: { visible: false, title: '', text: '', raw: null, type: '', activeTab: 'overview', dialogVisible: false },
      currentChart: { type: 'trend', title: '用电用水统计', data: null },
      datePeriod: 'day',
      messages: [{
        id: '1',
        role: 'ai',
        content: '您好！我是AI能源助手。<br>您可以问我：<br>• 哪个月电费最高？<br>• 哪个租户欠费最多？<br>• 费用构成分析？<br>• 能耗成本流向？<br>• 有哪些异常告警？<br>• 哪里节能潜力最大？'
      }],
      quickQuestions: [
        { icon: 'el-icon-data-line', text: '哪个月电费最高？', type: 'monthly' },
        { icon: 'el-icon-user', text: '哪个租户欠费最多？', type: 'tenant' },
        { icon: 'el-icon-monitor', text: '设备状态监控', type: 'device' },
        { icon: 'el-icon-s-data', text: '本月功率排名', type: 'power' },
        // { icon: 'el-icon-pie-chart', text: '费用构成分析', type: 'cost' },
        { icon: 'el-icon-share', text: '能耗成本流向', type: 'flow' },
        { icon: 'el-icon-warning', text: '有哪些异常告警？', type: 'alert' },
        { icon: 'el-icon-trophy', text: '节能潜力评估', type: 'saving' }
      ],

      chartData: {
        trend: {
          title: '用电用水统计',
          labels: [],
          elecUsage: [],
          waterUsage: [],
          elecIncome: [],
          waterIncome: []
        },
        // 1. 月度电费 ─────────────────────────────────────────────
        monthly: {
          title: '各月电费总览',
          months: [],
          values: []
        },
        // 2. 租户欠费 ─────────────────────────────────────────────
        tenant: {
          title: '租户欠费排行',
          data: [
            { name: 'A座-3F-科技公司', arrear: 12580, months: 2, risk: 'high' },
            { name: 'B座-2F-贸易公司', arrear: 8920, months: 1, risk: 'mid' },
            { name: 'A座-5F-咨询公司', arrear: 6540, months: 1, risk: 'mid' },
            { name: 'C座-1F-餐饮', arrear: 4230, months: 1, risk: 'low' },
            { name: 'B座-4F-律所', arrear: 3890, months: 1, risk: 'low' },
            { name: 'D座-2F-教育', arrear: 2100, months: 1, risk: 'low' }
          ]
        },
        // 3. 费用构成 ─────────────────────────────────────────────
        cost: {
          title: '费用构成分析',
          // 堆叠：电费各分项 + 水费 + 空调费，全年12个月
          months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
          ac: [18200, 14100, 15800, 16200, 19500, 28400, 35600, 38900, 30200, 21300, 17400, 19100],
          lighting: [10500, 9200, 10100, 9800, 10200, 12100, 13800, 14200, 12600, 11200, 10100, 10900],
          power: [9800, 8900, 9200, 7800, 8100, 9600, 11200, 11500, 9800, 9100, 8900, 9600],
          socket: [6700, 6700, 7000, 4700, 3400, 6700, 7900, 7700, 8600, 6900, 6800, 7200],
          water: [4200, 3800, 4100, 4600, 5200, 6100, 7200, 7800, 6500, 5100, 4300, 4600],
          acFee: [8100, 6200, 7400, 7600, 9200, 13800, 18600, 20100, 15200, 9800, 7600, 8900]
        },
        // 5. 成本流向 ─────────────────────────────────────────────
        flow: {
          title: '能耗成本流向',
          nodes: [],
          links: [],
          raw: null
        },
        // 6. 异常告警 ─────────────────────────────────────────────
        alert: {
          title: '异常告警总览',
          list: [
            { id: 'ALT-101', level: 'warning', module: '资金中心', type: '余额异常提醒', desc: '发现 1 户租户余额为负，建议关注欠费风险', time: '今日 10:22', value: 1, valueText: '1户' },
            { id: 'ALT-102', level: 'info', module: '数据中心', type: '数据同步提示', desc: '昨日用能数据已汇总，存在 5~8 分钟延迟', time: '今日 09:10', value: 8, valueText: '延迟8min' },
            { id: 'ALT-103', level: 'info', module: '计费配置', type: '费率配置校验', desc: '发现 2 个项目缺少当月电价策略，已沿用上月配置', time: '今日 08:40', value: 2, valueText: '2项' },
            { id: 'ALT-104', level: 'info', module: '结算中心', type: '结算进度提示', desc: '本月结算已完成 96%，剩余 3 户待对账', time: '今日 08:05', value: 96, valueText: '96%' }
          ]
        },
        // 8. 节能潜力 ──────────────────────────────────────────────
        saving: {
          title: '节能潜力评估',
          items: [
            { name: '空调峰段前移', category: '空调', potential: 18600, difficulty: '低', payback: '即时', color: '#0EA5E9' },
            { name: '照明分区控制', category: '照明', potential: 9200, difficulty: '低', payback: '1个月', color: '#F59E0B' },
            { name: '冷机群控优化', category: '空调', potential: 14800, difficulty: '中', payback: '3个月', color: '#0EA5E9' },
            { name: '动力变频改造', category: '动力', potential: 11200, difficulty: '高', payback: '8个月', color: '#8B5CF6' },
            { name: '插座定时断电', category: '插座', potential: 4800, difficulty: '低', payback: '即时', color: '#10B981' },
            { name: '水泵变频控制', category: '动力', potential: 6600, difficulty: '中', payback: '4个月', color: '#8B5CF6' }
          ]
        }
      }
    }
  },

  mounted () {
    this.init()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) this.chart.dispose()
  },

  methods: {
    async init () {
      await this.refreshTrendData()
      await this.$nextTick()
      this.chart = echarts.init(this.$refs.chartRef)
      this.currentChart = { type: 'trend', title: this.chartData.trend.title, data: this.chartData.trend }
      this.updateChart()
    },
    async setPeriod (p) {
      if (this.datePeriod === p) return
      this.datePeriod = p
      if (this.currentChart && this.currentChart.type === 'trend') {
        await this.refreshTrendData()
        this.currentChart = { type: 'trend', title: this.chartData.trend.title, data: this.chartData.trend }
        this.updateChart()
      }
    },
    makeMockTrend () {
      const now = new Date()
      const addDays = (d) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + d)
      const addMonths = (m) => new Date(now.getFullYear(), now.getMonth() + m, 1)
      if (this.datePeriod === 'day') {
        const labels = Array.from({ length: 7 }).map((_, i) => {
          const d = addDays(-(6 - i))
          const m = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${m}/${day}`
        })
        const elecUsage = [182, 196, 205, 188, 212, 226, 219]
        const waterUsage = [92, 88, 95, 90, 97, 101, 98]
        const elecIncome = [820, 860, 910, 840, 950, 980, 960]
        const waterIncome = [120, 116, 124, 119, 126, 132, 128]
        return { labels, elecUsage, waterUsage, elecIncome, waterIncome }
      } else {
        const labels = Array.from({ length: 6 }).map((_, i) => {
          const d = addMonths(-(5 - i))
          return `${d.getMonth() + 1}月`
        })
        const elecUsage = [5180, 5040, 5360, 5520, 5410, 5680]
        const waterUsage = [2410, 2330, 2460, 2520, 2490, 2580]
        const elecIncome = [23000, 22400, 23800, 24400, 24100, 25200]
        const waterIncome = [3600, 3460, 3720, 3860, 3790, 3950]
        return { labels, elecUsage, waterUsage, elecIncome, waterIncome }
      }
    },
    async refreshTrendData () {
      const managerId = this.currentManagerId
      if (!managerId) {
        this.chartData.trend = { title: '用电用水统计', labels: [], elecUsage: [], waterUsage: [], elecIncome: [], waterIncome: [] }
        return
      }
      if (isDemoManager(managerId)) {
        const mock = this.makeMockTrend()
        this.chartData.trend = { title: '用电用水统计', ...mock }
        return
      }

      const type = this.datePeriod === 'day' ? 2 : 3
      const [e, w] = await Promise.all([
        getElecStatistics({ type, useType: 1, managerId }),
        getElecStatistics({ type, useType: 2, managerId })
      ]).catch(() => [{}, {}])

      const sort = (arr) => [...(arr || [])].sort((a, b) => new Date(a.date) - new Date(b.date))
      const elec = e && e.code === 200 ? sort(e.data) : []
      const water = w && w.code === 200 ? sort(w.data) : []

      const limit = this.datePeriod === 'day' ? 7 : 6
      const sliceElec = elec.slice(-limit)
      const sliceWater = water.slice(-limit)
      const base = sliceElec.length >= sliceWater.length ? sliceElec : sliceWater

      const fmt = (s) => {
        const d = new Date(s)
        if (this.datePeriod === 'month') return `${d.getMonth() + 1}月`
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${m}/${day}`
      }

      this.chartData.trend = {
        title: '用电用水统计',
        labels: base.map(i => fmt(i.date)),
        elecUsage: sliceElec.map(i => +(i.useElec || 0)),
        waterUsage: sliceWater.map(i => +(i.useElec || 0)),
        elecIncome: sliceElec.map(i => +(i.balance || 0)),
        waterIncome: sliceWater.map(i => +(i.balance || 0))
      }
    },
    async refreshMonthlyData () {
      const managerId = this.currentManagerId
      if (!managerId || isDemoManager(managerId)) return
      const res = await getElecStatistics({ type: 3, useType: 1, managerId }).catch(() => ({}))
      const list = (res && res.code === 200 && Array.isArray(res.data)) ? res.data : []
      const sorted = [...list].sort((a, b) => new Date(a.date) - new Date(b.date))
      const last6 = sorted.slice(-6)
      const fmtMonth = (s) => {
        const d = new Date(s)
        if (Number.isNaN(d.getTime())) return String(s || '')
        return `${d.getMonth() + 1}月`
      }
      this.chartData.monthly = {
        title: '各月电费总览',
        months: last6.map(i => fmtMonth(i.date)),
        values: last6.map(i => Number(i.balance || 0))
      }
    },
    async refreshFlowData () {
      const managerId = this.currentManagerId
      const base = { title: '能耗成本流向', nodes: [], links: [], raw: null }
      this.chartData.flow = { ...(this.chartData.flow || base), ...base }
      if (!managerId) return

      try {
        if (isDemoManager(managerId)) {
          const tenantList = [
            { tenantId: 101, tenantName: 'A3号楼·制造车间' },
            { tenantId: 102, tenantName: 'B2号楼·冷链仓' },
            { tenantId: 103, tenantName: '研发中心·实验室' },
            { tenantId: 104, tenantName: '智慧园区·孵化器' }
          ]
          const mock = {
            managerName: '园区总用电',
            privateTotalElec: 6200,
            shareTotalElec: 1800,
            tenantInfoDtoList: tenantList,
            meterUseDtoList: [
              { bindType: 1, bindId: 101, meterElec: 2100 },
              { bindType: 1, bindId: 102, meterElec: 1800 },
              { bindType: 1, bindId: 103, meterElec: 1450 },
              { bindType: 1, bindId: 104, meterElec: 850 }
            ],
            shareUseDtoList: [
              {
                shareTenantDtoList: [
                  { tenantId: 101, tenantShareElec: 420 },
                  { tenantId: 102, tenantShareElec: 380 },
                  { tenantId: 103, tenantShareElec: 320 },
                  { tenantId: 104, tenantShareElec: 280 }
                ]
              }
            ]
          }
          const processed = this.processFlowSankeyData(mock, 6)
          this.chartData.flow = {
            title: '能耗成本流向',
            nodes: processed ? processed.nodes : [],
            links: processed ? processed.links : [],
            raw: mock
          }
          return
        }

        const resTenants = await getSimpleTenantList({ managerId, tenantStatus: 0 }).catch(() => ({}))
        const tenantList = (resTenants && Array.isArray(resTenants.data)) ? resTenants.data : []
        if (!tenantList.length) return

        const res = await queryTenantSankey({
          managerId,
          tenantIdList: tenantList.map(t => t.tenantId),
          queryDate: moment().subtract(1, 'days').format('YYYY-MM-DD')
        }).catch(() => ({}))

        const raw = (res && res.data) ? res.data : res
        const processed = this.processFlowSankeyData(raw, 6)
        this.chartData.flow = {
          title: '能耗成本流向',
          nodes: (processed && processed.nodes) ? processed.nodes : [],
          links: (processed && processed.links) ? processed.links : [],
          raw
        }
      } catch (e) {
        this.chartData.flow = { title: '能耗成本流向', nodes: [], links: [], raw: null }
      }
    },
    processFlowSankeyData (data, maxDisplayTenants = 6) {
      if (!data) return null

      const nodes = []
      const links = []

      const totalNodeName = data.managerName || '园区总用电'
      const privateTotalElec = Number(data.privateTotalElec || 0)
      const shareTotalElec = Number(data.shareTotalElec || 0)

      nodes.push({ name: totalNodeName, itemStyle: { color: '#1890ff' } })

      if (privateTotalElec > 0) {
        nodes.push({ name: '专用设备', itemStyle: { color: '#52c41a' } })
        links.push({ source: totalNodeName, target: '专用设备', value: privateTotalElec })
      }

      if (shareTotalElec > 0) {
        nodes.push({ name: '公摊设备', itemStyle: { color: '#faad14' } })
        links.push({ source: totalNodeName, target: '公摊设备', value: shareTotalElec })
      }

      const tenantPrivateMap = new Map()
      const tenantShareMap = new Map()

      if (data.tenantInfoDtoList && Array.isArray(data.tenantInfoDtoList)) {
        data.tenantInfoDtoList.forEach((tenant) => {
          tenantPrivateMap.set(tenant.tenantId, { tenantId: tenant.tenantId, tenantName: tenant.tenantName, totalElec: 0 })
          tenantShareMap.set(tenant.tenantId, { tenantId: tenant.tenantId, tenantName: tenant.tenantName, totalElec: 0 })
        })
      }

      if (data.meterUseDtoList && Array.isArray(data.meterUseDtoList)) {
        data.meterUseDtoList.forEach((meter) => {
          if (meter.bindType === 1 && meter.bindId) {
            const tenantData = tenantPrivateMap.get(meter.bindId)
            if (tenantData) tenantData.totalElec += Number(meter.meterElec || 0)
          }
        })
      }

      if (data.shareUseDtoList && Array.isArray(data.shareUseDtoList)) {
        data.shareUseDtoList.forEach((share) => {
          if (share.shareTenantDtoList && Array.isArray(share.shareTenantDtoList)) {
            share.shareTenantDtoList.forEach((tenantShare) => {
              const tenantData = tenantShareMap.get(tenantShare.tenantId)
              if (tenantData && Number(tenantShare.tenantShareElec || 0) > 0) tenantData.totalElec += Number(tenantShare.tenantShareElec || 0)
            })
          }
        })
      }

      const privateArray = Array.from(tenantPrivateMap.values())
        .filter(t => t.totalElec > 0)
        .sort((a, b) => b.totalElec - a.totalElec)

      let displayPrivate = privateArray
      let othersPrivateElec = 0
      if (privateArray.length > maxDisplayTenants) {
        displayPrivate = privateArray.slice(0, maxDisplayTenants - 1)
        const others = privateArray.slice(maxDisplayTenants - 1)
        othersPrivateElec = others.reduce((sum, t) => sum + t.totalElec, 0)
      }

      displayPrivate.forEach((tenant, index) => {
        const color = SANKEY_COLORS[index % SANKEY_COLORS.length]
        const nodeName = tenant.tenantName
        if (!nodes.find(n => n.name === nodeName)) nodes.push({ name: nodeName, itemStyle: { color } })
        if (privateTotalElec > 0) links.push({ source: '专用设备', target: nodeName, value: tenant.totalElec })
      })

      if (othersPrivateElec > 0) {
        if (!nodes.find(n => n.name === '其他租户')) nodes.push({ name: '其他租户', itemStyle: { color: '#c0c4cc' } })
        if (privateTotalElec > 0) links.push({ source: '专用设备', target: '其他租户', value: othersPrivateElec })
      }

      const shareArray = Array.from(tenantShareMap.values())
        .filter(t => t.totalElec > 0)
        .sort((a, b) => b.totalElec - a.totalElec)

      if (shareTotalElec > 0 && shareArray.length > 0) {
        let displayShare = shareArray
        let othersShareElec = 0

        if (shareArray.length > maxDisplayTenants) {
          displayShare = shareArray.slice(0, maxDisplayTenants - 1)
          const others = shareArray.slice(maxDisplayTenants - 1)
          othersShareElec = others.reduce((sum, t) => sum + t.totalElec, 0)
        }

        displayShare.forEach((tenant, index) => {
          const color = SANKEY_COLORS[index % SANKEY_COLORS.length]
          const nodeName = tenant.tenantName
          if (!nodes.find(n => n.name === nodeName)) nodes.push({ name: nodeName, itemStyle: { color } })
          links.push({ source: '公摊设备', target: nodeName, value: tenant.totalElec })
        })

        if (othersShareElec > 0) {
          if (!nodes.find(n => n.name === '其他租户')) nodes.push({ name: '其他租户', itemStyle: { color: '#c0c4cc' } })
          links.push({ source: '公摊设备', target: '其他租户', value: othersShareElec })
        }
      }

      if (links.length === 0) return null
      return { nodes, links }
    },
    updateChart () {
      if (!this.chart) return
      this.chart.off('click')
      this.clearRightPanel()
      if (this.currentChart && this.currentChart.option) {
        this.chart.setOption(this.currentChart.option, true)
        return
      }
      const map = {
        trend: this.buildTrendOption,
        monthly: this.buildMonthlyOption,
        tenant: this.buildTenantOption,
        cost: this.buildCostOption,
        flow: this.buildFlowOption,
        alert: this.buildAlertOption,
        saving: this.buildSavingOption
      }
      const fn = map[this.currentChart.type]
      if (fn) this.chart.setOption(fn.call(this), true)
    },

    buildTrendOption () {
      const d = this.chartData.trend
      const labels = d.labels || []
      const option = {
        color: ['#0284C7', '#2DD4BF'],
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#E2E8F0',
          borderWidth: 1,
          textStyle: { color: '#1E293B', fontSize: 11 },
          formatter: (params) => {
            let html = `<div style="font-weight:600;margin-bottom:4px;font-size:12px">${params[0].axisValue}</div>`
            params.forEach(p => {
              const unit = p.seriesName.includes('用电') ? 'kWh' : p.seriesName.includes('用水') ? 'm³' : '元'
              html += `<div style="display:flex;align-items:center;gap:6px;margin-top:3px">
                <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${p.color}"></span>
                <span style="color:#64748B;font-size:11px">${p.seriesName}:</span>
                <span style="font-weight:500;font-size:11px">${Number(p.value || 0).toLocaleString()} ${unit}</span>
              </div>`
            })
            return html
          }
        },
        legend: {
          data: ['用电量', '用水量', '电费', '水费'],
          top: 8,
          right: 10,
          itemGap: 8,
          textStyle: { color: '#64748B', fontSize: 10 },
          itemWidth: 12,
          itemHeight: 6
        },
        grid: {
          left: 46,
          right: 30,
          top: 45,
          bottom: 30
        },
        xAxis: {
          type: 'category',
          data: labels,
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisLabel: { color: '#64748B', fontSize: 10 },
          axisTick: { show: false }
        },
        yAxis: [
          {
            type: 'value',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: '#F1F5F9' } },
            axisLabel: { color: '#64748B', fontSize: 9, formatter: v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v }
          },
          {
            type: 'value',
            axisLine: { show: false },
            splitLine: { show: false },
            axisLabel: { color: '#64748B', fontSize: 9 }
          }
        ],
        series: [
          {
            name: '用电量',
            type: 'line',
            yAxisIndex: 0,
            data: d.elecUsage,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            lineStyle: { width: 2, color: '#0284C7' },
            itemStyle: { color: '#0284C7' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(2, 132, 199, 0.12)' },
                  { offset: 1, color: 'rgba(2, 132, 199, 0)' }
                ]
              }
            }
          },
          {
            name: '用水量',
            type: 'line',
            yAxisIndex: 0,
            data: d.waterUsage,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            lineStyle: { width: 2, color: '#2DD4BF' },
            itemStyle: { color: '#2DD4BF' }
          },
          {
            name: '电费',
            type: 'bar',
            yAxisIndex: 1,
            data: d.elecIncome,
            barWidth: '26%',
            barMaxWidth: 22,
            barGap: '15%',
            itemStyle: {
              color: 'rgba(2, 132, 199, 0.28)',
              borderRadius: [4, 4, 0, 0]
            }
          },
          {
            name: '水费',
            type: 'bar',
            yAxisIndex: 1,
            data: d.waterIncome,
            barWidth: '26%',
            barMaxWidth: 22,
            itemStyle: {
              color: 'rgba(45, 212, 191, 0.26)',
              borderRadius: [4, 4, 0, 0]
            }
          }
        ]
      }

      const elecFeeTotal = (d.elecIncome || []).reduce((a, v) => a + (Number(v) || 0), 0)
      const waterFeeTotal = (d.waterIncome || []).reduce((a, v) => a + (Number(v) || 0), 0)
      this.rightPanel.visible = true
      this.rightPanel.title = '用电用水摘要'
      this.rightPanel.text = `近${this.datePeriod === 'day' ? '7天' : '6个月'}电费合计 <strong>¥${elecFeeTotal.toLocaleString()}</strong>，水费合计 <strong>¥${waterFeeTotal.toLocaleString()}</strong>。`

      return option
    },

    // ①  哪个月电费最高 ─── 柱线组合，预算线 + 超支标记 ──────────
    buildMonthlyOption () {
      const d = this.chartData.monthly
      const values = Array.isArray(d.values) ? d.values : []
      const months = Array.isArray(d.months) ? d.months : []
      if (!values.length || !months.length) {
        this.rightPanel.visible = true
        this.rightPanel.title = '月度电费摘要'
        this.rightPanel.text = '暂无可展示的月度电费数据。'
        return {
          grid: { left: 60, right: 24, top: 56, bottom: 44 },
          xAxis: { type: 'category', data: [] },
          yAxis: { type: 'value' },
          series: []
        }
      }

      const peak = Math.max(...d.values)
      const peakIdx = d.values.indexOf(peak)
      const total = d.values.reduce((a, v) => a + v, 0)
      const avg = total / d.values.length

      this.rightPanel.visible = true
      this.rightPanel.title = '月度电费摘要'
      this.rightPanel.text =
        `<strong>${d.months[peakIdx]}（¥${peak.toLocaleString()}）</strong>为近${d.months.length}个月最高月。<br>` +
        `累计电费 <strong>¥${total.toLocaleString()}</strong>，` +
        `月均 <strong>¥${Number(avg.toFixed(0)).toLocaleString()}</strong>。<br><br>` +
        '建议对高峰月份重点核查空调、照明与动力设备的运行策略。'

      return {
        grid: { left: 60, right: 24, top: 56, bottom: 44 },
        tooltip: {
          trigger: 'axis',
          formatter: params => {
            const i = params[0].dataIndex
            return `<strong>${d.months[i]}</strong><br/>
              电费：¥${d.values[i].toLocaleString()}`
          }
        },
        legend: { data: ['月度电费'], top: 12, textStyle: { color: '#64748B', fontSize: 11 } },
        xAxis: {
          type: 'category',
          data: d.months,
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisLabel: { color: '#64748B', fontSize: 11 }
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#F1F5F9' } },
          axisLabel: { color: '#64748B', fontSize: 11, formatter: v => '¥' + (v / 1000).toFixed(0) + 'k' }
        },
        series: [
          {
            name: '月度电费',
            type: 'bar',
            data: d.values.map((v, i) => ({
              value: v,
              itemStyle: {
                color: i === peakIdx
                  ? {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{ offset: 0, color: '#EF4444' }, { offset: 1, color: 'rgba(239,68,68,0.5)' }]
                  }
                  : {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{ offset: 0, color: '#0EA5E9' }, { offset: 1, color: 'rgba(14,165,233,0.35)' }]
                  },
                borderRadius: [5, 5, 0, 0]
              }
            })),
            barWidth: 32,
            label: {
              show: true,
              position: 'top',
              formatter: p => '¥' + (p.value / 1000).toFixed(1) + 'k',
              color: '#64748B',
              fontSize: 10
            }
          }
        ]
      }
    },

    // ②  哪个租户欠费最多 ─── 气泡+水平条，风险色 ────────────────
    buildTenantOption () {
      const d = this.chartData.tenant
      const riskColor = { high: '#EF4444', mid: '#F59E0B', low: '#10B981' }
      const riskLabel = { high: '高风险', mid: '中风险', low: '低风险' }

      this.rightPanel.visible = true
      this.rightPanel.title = '欠费风险摘要'
      this.rightPanel.text =
        `共 <strong>${d.data.length}</strong> 户存在欠费，合计 <strong>¥${d.data.reduce((a, r) => a + r.arrear, 0).toLocaleString()}</strong>。<br>` +
        `高风险 <strong>${d.data.filter(r => r.risk === 'high').length}</strong> 户，` +
        `中风险 ${d.data.filter(r => r.risk === 'mid').length} 户。<br><br>` +
        '<strong>A座-3F-科技公司</strong>欠费 ¥12,580，已连续 2 个月，建议优先催缴并预警停电。'

      const reversed = [...d.data].reverse()
      return {
        grid: { left: 160, right: 110, top: 16, bottom: 16 },
        tooltip: {
          trigger: 'axis',
          formatter: p => {
            const r = reversed[p[0].dataIndex]
            return `<strong>${r.name}</strong><br/>欠费金额：¥${r.arrear.toLocaleString()}<br/>已欠：${r.months}个月<br/>风险等级：${riskLabel[r.risk]}`
          }
        },
        xAxis: {
          type: 'value',
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#F1F5F9' } },
          axisLabel: { color: '#64748B', fontSize: 10, formatter: v => '¥' + (v / 1000) + 'k' }
        },
        yAxis: {
          type: 'category',
          data: reversed.map(r => r.name),
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisLabel: { color: '#64748B', fontSize: 11 }
        },
        series: [{
          type: 'bar',
          barWidth: 20,
          data: reversed.map(r => ({
            value: r.arrear,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [{ offset: 0, color: riskColor[r.risk] }, { offset: 1, color: riskColor[r.risk] + '55' }]
              },
              borderRadius: [0, 6, 6, 0]
            }
          })),
          label: {
            show: true,
            position: 'right',
            formatter: p => {
              const r = reversed[p.dataIndex]
              return `¥${r.arrear.toLocaleString()}  ${riskLabel[r.risk]}`
            },
            color: '#64748B',
            fontSize: 10
          }
        }]
      }
    },

    // ③  费用构成分析 ─── 多层堆叠面积 ──────────────────────────
    buildCostOption () {
      const d = this.chartData.cost
      const series = [
        { name: '空调用电', data: d.ac, color: '#0EA5E9', alpha: 'rgba(14,165,233,' },
        { name: '照明用电', data: d.lighting, color: '#F59E0B', alpha: 'rgba(245,158,11,' },
        { name: '动力用电', data: d.power, color: '#8B5CF6', alpha: 'rgba(139,92,246,' },
        { name: '插座用电', data: d.socket, color: '#10B981', alpha: 'rgba(16,185,129,' },
        { name: '水费', data: d.water, color: '#06B6D4', alpha: 'rgba(6,182,212,' },
        { name: '空调服务费', data: d.acFee, color: '#F97316', alpha: 'rgba(249,115,22,' }
      ].map(s => ({
        name: s.name,
        type: 'bar',
        stack: 'total',
        data: s.data,
        barMaxWidth: 36,
        itemStyle: { color: s.color },
        emphasis: { focus: 'series' }
      }))

      this.rightPanel.visible = true
      this.rightPanel.title = '费用构成摘要'
      this.rightPanel.text =
        '本月六项合计：电费三项（空调/照明/动力/插座）+ 水费 + 空调服务费。<br>' +
        '空调相关费用（用电+服务费）合计占比约 <strong>56%</strong>，是最大成本块。<br><br>' +
        '夏季（6-8月）费用较冬季高出约 <strong>60%</strong>，建议重点在高峰季进行精细化管控。'

      return {
        grid: { left: 58, right: 20, top: 54, bottom: 44 },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: series.map(s => s.name), top: 10, textStyle: { color: '#64748B', fontSize: 11 } },
        xAxis: {
          type: 'category',
          data: d.months,
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisLabel: { color: '#64748B', fontSize: 11 }
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#F1F5F9' } },
          axisLabel: { color: '#64748B', fontSize: 11, formatter: v => '¥' + (v / 1000).toFixed(0) + 'k' }
        },
        series
      }
    },

    // ④  峰谷电价成本优化 ─── 双线 + 背景色带 + 节省标注 ─────────
    buildTariffOption () {
      const d = this.chartData.tariff
      const lvl = this.strategyLevel / 100
      const baseCost = d.baseLoad.map((v, i) => +(v * d.price[d.period[i]]).toFixed(1))
      const adjLoad = d.baseLoad.map((v, i) => {
        const f = d.period[i] === 'peak' ? 1 - 0.08 * lvl : d.period[i] === 'flat' ? 1 - 0.03 * lvl : 1 - 0.01 * lvl
        return Math.max(v * f, 0)
      })
      const adjCost = adjLoad.map((v, i) => +(v * d.price[d.period[i]]).toFixed(1))
      const saving = baseCost.reduce((a, v, i) => a + v - adjCost[i], 0).toFixed(0)

      this.rightPanel.visible = true
      this.rightPanel.title = '峰谷优化摘要'
      this.rightPanel.text =
        `策略强度 <strong>${this.strategyLevel}%</strong> 下，本月预计节省 <strong>¥${Number(saving).toLocaleString()}</strong>。<br>` +
        `峰段削减 ${(8 * lvl).toFixed(1)}%，平段削减 ${(3 * lvl).toFixed(1)}%。<br><br>` +
        '建议提升至 <strong>80%</strong> 策略强度，配合空调预冷与储能装置可进一步降本。'

      // 峰谷背景带
      const markAreas = []
      d.period.forEach((p, i) => {
        if (p === 'peak') {
          markAreas.push([
            { xAxis: d.days[i], itemStyle: { color: 'rgba(239,68,68,0.07)' } },
            { xAxis: d.days[i] }
          ])
        } else if (p === 'valley') {
          markAreas.push([
            { xAxis: d.days[i], itemStyle: { color: 'rgba(16,185,129,0.07)' } },
            { xAxis: d.days[i] }
          ])
        }
      })

      return {
        grid: { left: 58, right: 24, top: 54, bottom: 44 },
        tooltip: { trigger: 'axis', valueFormatter: v => '¥' + v },
        legend: { data: ['当前电费', '策略后电费'], top: 12, textStyle: { color: '#64748B', fontSize: 11 } },
        xAxis: {
          type: 'category',
          data: d.days,
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisLabel: { color: '#64748B', fontSize: 10, interval: 4 }
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#F1F5F9' } },
          axisLabel: { color: '#64748B', fontSize: 11, formatter: v => '¥' + v }
        },
        series: [
          {
            name: '当前电费',
            type: 'line',
            data: baseCost,
            smooth: true,
            symbol: 'none',
            lineStyle: { width: 2.5, color: '#EF4444' },
            areaStyle: { color: 'rgba(239,68,68,0.08)' },
            markArea: { data: markAreas }
          },
          {
            name: '策略后电费',
            type: 'line',
            data: adjCost,
            smooth: true,
            symbol: 'none',
            lineStyle: { width: 2.5, color: '#10B981' },
            areaStyle: { color: 'rgba(16,185,129,0.08)' }
          }
        ]
      }
    },

    // ⑤  能耗成本流向 ─── 桑基图 ─────────────────────────────────
    buildFlowOption () {
      const d = this.chartData.flow
      const nodes = (d && Array.isArray(d.nodes)) ? d.nodes : []
      const links = (d && Array.isArray(d.links)) ? d.links : []
      const totalNodeName = (nodes[0] && nodes[0].name) ? nodes[0].name : ((d && d.raw && d.raw.managerName) ? d.raw.managerName : '园区总用电')
      const pickValue = (source, target) => {
        const hit = links.find(l => l && l.source === source && l.target === target)
        return Number((hit && hit.value) || 0)
      }
      const privateVal = pickValue(totalNodeName, '专用设备')
      const shareVal = pickValue(totalNodeName, '公摊设备')
      const totalVal = privateVal + shareVal
      const fmt = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
      const tenantLinks = links
        .filter(l => l && (l.source === '专用设备' || l.source === '公摊设备') && l.target && l.target !== '其他租户')
        .sort((a, b) => Number(b.value || 0) - Number(a.value || 0))
      const topTenant = tenantLinks.length ? tenantLinks[0] : null

      this.rightPanel.visible = true
      this.rightPanel.title = '成本流向摘要'
      if (!links.length) {
        this.rightPanel.text = '暂无可展示的流向数据。'
      } else {
        this.rightPanel.text =
          `园区总用电 <strong>${fmt(totalVal)} kWh</strong>（专用 ${fmt(privateVal)}，公摊 ${fmt(shareVal)}）。` +
          (topTenant ? `<br>主要租户：<strong>${topTenant.target}</strong> ${fmt(topTenant.value)} kWh。` : '')
      }

      return {
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#E2E8F0',
          textStyle: { color: '#1E293B', fontSize: 11 },
          formatter: (p) => {
            if (p && p.data && p.data.source) {
              return `${p.data.source} → ${p.data.target}<br/><strong>${fmt(p.data.value)} kWh</strong>`
            }
            return `<strong>${p.name}</strong><br/>${fmt(p.value)} kWh`
          }
        },
        series: [{
          type: 'sankey',
          layout: 'none',
          nodeAlign: 'justify',
          nodeGap: 18,
          nodeWidth: 18,
          draggable: false,
          data: nodes.map(n => ({
            ...n,
            itemStyle: n.itemStyle || {},
            label: {
              color: '#475569',
              fontSize: 11,
              fontWeight: 500,
              width: 96,
              overflow: 'truncate',
              ellipsis: '…'
            }
          })),
          links: links.map(l => ({ ...l, lineStyle: { color: 'source', opacity: 0.26 } })),
          emphasis: { focus: 'adjacency' },
          lineStyle: {
            color: 'gradient',
            opacity: 0.26,
            curveness: 0.45
          },
          left: '2%',
          right: '14%',
          top: '6%',
          bottom: '6%'
        }]
      }
    },

    // ⑥  异常告警 ─── 自定义散点时间轴（严重→警告→信息分层）──────
    buildAlertOption () {
      const d = this.chartData.alert
      const levelMap = { critical: { color: '#EF4444', y: 2, label: '严重' }, warning: { color: '#F59E0B', y: 1, label: '警告' }, info: { color: '#3B82F6', y: 0, label: '信息' } }
      const getName = (a) => (a && (a.module || a.device)) ? String(a.module || a.device) : '-'
      const getValueText = (a) => (a && (a.valueText != null)) ? String(a.valueText) : (a && a.value != null ? String(a.value) : '')
      const getNumericValue = (a) => {
        const v = Number(a && a.value != null ? a.value : 0)
        return Number.isFinite(v) ? v : 0
      }
      const total = Array.isArray(d.list) ? d.list.length : 0
      const criticalCount = (d.list || []).filter(a => a.level === 'critical').length
      const warningCount = (d.list || []).filter(a => a.level === 'warning').length
      const infoCount = (d.list || []).filter(a => a.level === 'info').length

      this.rightPanel.visible = true
      this.rightPanel.title = '告警摘要'
      this.rightPanel.text =
        `当前共 <strong>${total}</strong> 条告警：` +
        `严重 <strong style="color:#EF4444">${criticalCount}</strong> 条，` +
        `警告 <strong style="color:#F59E0B">${warningCount}</strong> 条，` +
        `信息 <strong style="color:#3B82F6">${infoCount}</strong> 条。<br><br>` +
        '告警均为平台侧提示（数据同步、费率校验、结算进度、余额异常），用于帮助运营快速定位问题范围。'

      // 构造散点数据
      const scatterData = d.list.map((a, i) => {
        const lv = levelMap[a.level]
        return {
          value: [i, lv.y, getNumericValue(a)],
          name: getName(a),
          itemStyle: {
            color: lv.color,
            shadowBlur: a.level === 'critical' ? 14 : 6,
            shadowColor: lv.color
          },
          symbolSize: a.level === 'critical' ? 22 : a.level === 'warning' ? 16 : 12
        }
      })

      return {
        grid: { left: 80, right: 24, top: 40, bottom: 60 },
        tooltip: {
          formatter: p => {
            const a = d.list[p.dataIndex]
            const vt = getValueText(a)
            const valueLine = vt ? `<br/>指标：${vt}` : ''
            return `<strong>${getName(a)}</strong><br/>${a.type}${valueLine}<br/>${a.desc}<br/><span style="color:#94A3B8;font-size:11px">${a.time}</span>`
          }
        },
        xAxis: {
          type: 'category',
          data: d.list.map(a => a.id),
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisLabel: { color: '#94A3B8', fontSize: 10 },
          name: '告警编号',
          nameLocation: 'middle',
          nameGap: 36,
          nameTextStyle: { color: '#94A3B8', fontSize: 11 }
        },
        yAxis: {
          type: 'value',
          min: -0.5,
          max: 2.5,
          interval: 1,
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
          axisLabel: {
            color: '#64748B',
            fontSize: 11,
            formatter: v => v === 0 ? '信息' : v === 1 ? '警告' : v === 2 ? '严重' : ''
          }
        },
        series: [{
          type: 'scatter',
          data: scatterData,
          label: {
            show: true,
            position: 'right',
            formatter: p => getName(d.list[p.dataIndex]),
            color: '#64748B',
            fontSize: 10
          }
        }]
      }
    },

    // ⑦  各楼栋能耗排行（补充场景1）── 双轴：用电量柱 + 单位面积能耗线 ─
    buildBuildingOption () {
      const d = this.chartData.building

      this.rightPanel.visible = true
      this.rightPanel.title = '楼栋能耗摘要'
      this.rightPanel.text =
        `<strong>A座</strong>总用电量最高（${d.data[0].kwh.toLocaleString()} kWh），且超出预算 <strong>¥2,800</strong>，建议重点核查。<br>` +
        `单位面积能耗（EIA）最高也是A座（<strong>${d.data[0].eia} kWh/m²</strong>），D、E座表现较优。<br><br>` +
        '建议对A座进行专项节能诊断，重点检查空调运行策略与设备老化情况。'

      return {
        grid: { left: 60, right: 60, top: 54, bottom: 44 },
        tooltip: {
          trigger: 'axis',
          formatter: params => {
            const i = params[0].dataIndex
            const r = d.data[i]
            return `<strong>${r.name}</strong><br/>
              用电量：${r.kwh.toLocaleString()} kWh<br/>
              面积能耗：${r.eia} kWh/m²<br/>
              <span style="color:${r.overBudget ? '#EF4444' : '#10B981'}">${r.overBudget ? '超预算' : '在预算内'}</span>`
          }
        },
        legend: { data: ['月度用电量', '单位面积能耗'], top: 12, textStyle: { color: '#64748B', fontSize: 11 } },
        xAxis: {
          type: 'category',
          data: d.data.map(r => r.name),
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisLabel: { color: '#64748B', fontSize: 12 }
        },
        yAxis: [
          {
            type: 'value',
            name: '用电量 kWh',
            nameTextStyle: { color: '#94A3B8', fontSize: 10 },
            axisLine: { show: false },
            splitLine: { lineStyle: { color: '#F1F5F9' } },
            axisLabel: { color: '#64748B', fontSize: 11, formatter: v => (v / 1000).toFixed(0) + 'k' }
          },
          {
            type: 'value',
            name: 'kWh/m²',
            nameTextStyle: { color: '#94A3B8', fontSize: 10 },
            position: 'right',
            axisLine: { show: false },
            splitLine: { show: false },
            axisLabel: { color: '#64748B', fontSize: 11 }
          }
        ],
        series: [
          {
            name: '月度用电量',
            type: 'bar',
            yAxisIndex: 0,
            barWidth: 48,
            data: d.data.map(r => ({
              value: r.kwh,
              itemStyle: {
                color: r.overBudget
                  ? {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{ offset: 0, color: '#EF4444' }, { offset: 1, color: 'rgba(239,68,68,0.3)' }]
                  }
                  : {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{ offset: 0, color: '#0EA5E9' }, { offset: 1, color: 'rgba(14,165,233,0.3)' }]
                  },
                borderRadius: [6, 6, 0, 0]
              }
            })),
            label: { show: true, position: 'top', formatter: p => (p.value / 1000).toFixed(1) + 'k kWh', color: '#64748B', fontSize: 10 }
          },
          {
            name: '单位面积能耗',
            type: 'line',
            yAxisIndex: 1,
            data: d.data.map(r => r.eia),
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: { color: '#F59E0B', width: 2.5 },
            itemStyle: { color: '#F59E0B', borderWidth: 2, borderColor: '#fff' },
            label: { show: true, position: 'top', formatter: p => p.value + ' kWh/m²', color: '#F59E0B', fontSize: 10 }
          }
        ]
      }
    },

    // ⑧  节能潜力评估（补充场景2）── 气泡矩阵：潜力 × 难度 × 回收期 ──
    buildSavingOption () {
      const d = this.chartData.saving
      const diffMap = { 低: 1, 中: 2, 高: 3 }
      const paybackMap = { 即时: 0.5, '1个月': 1, '3个月': 3, '4个月': 4, '8个月': 8 }

      this.rightPanel.visible = true
      this.rightPanel.title = '节能潜力摘要'
      this.rightPanel.text =
        `共识别 <strong>${d.items.length}</strong> 项节能机会，合计潜力 <strong>¥${d.items.reduce((a, r) => a + r.potential, 0).toLocaleString()}/月</strong>。<br><br>` +
        '🟢 <strong>低难度即时见效</strong>：空调峰段前移（¥18,600）、插座定时断电（¥4,800）、照明分区控制（¥9,200）。<br><br>' +
        '建议优先实施上述三项，预计首月即可回收成本，综合节省约 <strong>¥32,600/月</strong>。'

      return {
        grid: { left: 80, right: 40, top: 54, bottom: 60 },
        tooltip: {
          formatter: p => {
            const r = d.items[p.dataIndex]
            return `<strong>${r.name}</strong><br/>
              节能潜力：¥${r.potential.toLocaleString()}/月<br/>
              实施难度：${r.difficulty}<br/>
              回收周期：${r.payback}<br/>
              类别：${r.category}`
          }
        },
        xAxis: {
          type: 'value',
          min: 0.5,
          max: 3.5,
          interval: 1,
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#F1F5F9' } },
          axisLabel: { color: '#64748B', fontSize: 11, formatter: v => v === 1 ? '低难度' : v === 2 ? '中难度' : v === 3 ? '高难度' : '' },
          name: '实施难度',
          nameLocation: 'middle',
          nameGap: 36,
          nameTextStyle: { color: '#94A3B8', fontSize: 11 }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 9,
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
          axisLabel: { color: '#64748B', fontSize: 11, formatter: v => v + '月' },
          name: '回收周期',
          nameLocation: 'middle',
          nameGap: 46,
          nameTextStyle: { color: '#94A3B8', fontSize: 11 }
        },
        series: [{
          type: 'scatter',
          data: d.items.map(r => ({
            value: [diffMap[r.difficulty], paybackMap[r.payback], r.potential],
            name: r.name,
            itemStyle: {
              color: r.color,
              opacity: 0.82,
              shadowBlur: 12,
              shadowColor: r.color + '66'
            }
          })),
          symbolSize: p => Math.sqrt(p[2]) * 0.38,
          label: {
            show: true,
            position: 'inside',
            formatter: p => d.items[p.dataIndex].name,
            color: '#fff',
            fontSize: 10,
            fontWeight: 600
          },
          emphasis: { scale: true, scaleSize: 6 }
        }]
      }
    },

    // ── 工具方法 ────────────────────────────────────────────────
    formatContent (c) {
      return (c || '')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#7C3AED;">$1</strong>')
    },
    formatSavingContent (c) {
      const raw = String(c || '')
      const withStrong = raw.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#7C3AED;">$1</strong>')
      const lines = withStrong.split(/\r?\n/)
      return lines
        .map(line => {
          const t = String(line || '')
          if (!t.trim()) return '<div class="saving-line saving-line--blank"></div>'
          return `<div class="saving-line">${t}</div>`
        })
        .join('')
    },
    formatPreview (c, maxLines = 6) {
      const raw = String(c || '')
      const lines = raw.split(/\r?\n/).filter(x => x !== '')
      const cut = lines.slice(0, Math.max(1, Number(maxLines) || 6)).join('\n')
      const more = lines.length > Math.max(1, Number(maxLines) || 6)
      const text = more ? (cut + '\n…（点“详情”查看全文）') : cut
      return this.formatContent(text)
    },
    formatSavingPreview (c, maxLines = 6) {
      const raw = String(c || '')
      const lines = raw.split(/\r?\n/).filter(x => x !== '')
      const cut = lines.slice(0, Math.max(1, Number(maxLines) || 6)).join('\n')
      const more = lines.length > Math.max(1, Number(maxLines) || 6)
      const text = more ? (cut + '\n…（点“详情”查看全文）') : cut
      return this.formatSavingContent(text)
    },
    extractSavingKpis (raw, text) {
      const kpis = []
      const r = raw || {}
      if (r.startDate && r.endDate) kpis.push({ label: '区间', value: `${r.startDate} ~ ${r.endDate}` })
      const s = String(text || '')
      const mTotal = s.match(/总用电约\s*([0-9,]+(?:\.\d+)?)\s*kWh/i)
      if (mTotal) kpis.push({ label: '总用电', value: `${mTotal[1]} kWh` })
      const mPeak = s.match(/尖\+峰用电占比约\s*([0-9.]+)%/i)
      if (mPeak) kpis.push({ label: '尖+峰占比', value: `${mPeak[1]}%` })
      const mCost = s.match(/同期电费约\s*¥\s*([0-9,]+(?:\.\d+)?)/i)
      if (mCost) kpis.push({ label: '电费', value: `¥${mCost[1]}` })
      return kpis.slice(0, 4)
    },
    extractSection (text, header) {
      const s = String(text || '')
      const i = s.indexOf(header)
      if (i < 0) return ''
      const tail = s.slice(i + header.length)
      const nextHeaders = ['移峰填谷测算', '尖+峰贡献', '当前实时功率', '落地建议', '需要先处理的基础问题', 'Top5 诊断摘要', '关键结论']
      let cut = tail.length
      for (const h of nextHeaders) {
        const j = tail.indexOf(h)
        if (j >= 0 && j < cut) cut = j
      }
      return header + tail.slice(0, cut).trim()
    },
    clearRightPanel () {
      this.rightPanel.visible = false
      this.rightPanel.title = ''
      this.rightPanel.text = ''
      this.rightPanel.raw = null
      this.rightPanel.type = ''
      this.rightPanel.activeTab = 'overview'
      this.rightPanel.dialogVisible = false
    },
    openRightPanelDetail () {
      this.rightPanel.dialogVisible = true
    },
    handleResize () { this.chart && this.chart.resize() },
    async refreshChart () {
      if (this.currentChart && this.currentChart.type === 'trend') {
        await this.refreshTrendData()
        this.currentChart = { type: 'trend', title: this.chartData.trend.title, data: this.chartData.trend }
      } else if (this.currentChart && this.currentChart.type === 'monthly') {
        await this.refreshMonthlyData()
        this.currentChart = { type: 'monthly', title: this.chartData.monthly.title, data: this.chartData.monthly }
      } else if (this.currentChart && this.currentChart.type === 'flow') {
        await this.refreshFlowData()
        this.currentChart = { type: 'flow', title: this.chartData.flow.title, data: this.chartData.flow }
      }
      this.updateChart()
    },

    async queryDashboardTag (tag, payload = {}) {
      const managerId = store.getters['manager/currentManagerId']
      const token = Cookies.get('Admin-Token') || store.getters.token
      if (!managerId) throw new Error('未选择管理方，请先选择管理方')
      if (!token) throw new Error('未登录，请先登录')

      const url = getAiApiUrl('/api/ai-dashboard/tag')
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Manager-Id': String(managerId),
          'X-Token': token
        },
        body: JSON.stringify({ tag, ...payload })
      })
      const text = await res.text().catch(() => '')
      let data = {}
      try { data = text ? JSON.parse(text) : {} } catch (e) { }

      if (!res.ok) {
        const detail = (data && data.detail) ? JSON.stringify(data.detail) : (text || '')
        throw new Error(`接口请求失败：HTTP ${res.status}，${detail || '无返回信息'}（${url}）`)
      }
      if (!data || data.code !== 200) throw new Error(`接口返回异常：${(data && data.msg) || '查询失败'}（${url}）`)
      return data.data || {}
    },

    sendQuestion (q) {
      this.addMessage('user', q.text)
      this.processAIResponse(q.text, q.type)
    },
    sendMessage () {
      if (!this.inputText.trim()) return
      this.inputText = ''
      this.$router.push('/ai/chat').catch(() => { })
    },
    goDeepMode () { this.$router.push('/ai/chat').catch(() => { }) },
    addMessage (role, content) {
      this.messageSeq = (this.messageSeq || 0) + 1
      this.messages.push({ id: `${Date.now()}-${this.messageSeq}`, role, content })
      this.$nextTick(() => { this.scrollToBottom() })
    },

    async processAIResponse (text, type) {
      this.isTyping = true
      this.$nextTick(() => { this.scrollToBottom() })
      let response = ''
      let chartType = type
      const t = String(text || '').toLowerCase()

      if (!chartType) {
        if (t.includes('设备') || t.includes('在线') || t.includes('离线') || t.includes('表计')) chartType = 'device'
        else if (t.includes('功率') || (t.includes('p') && t.includes('排行'))) chartType = 'power'
        else if (t.includes('月') && (t.includes('最高') || t.includes('电费') || t.includes('趋势'))) chartType = 'monthly'
        else if (t.includes('租户') || t.includes('欠费')) chartType = 'tenant'
        else if (t.includes('费用') || t.includes('构成')) chartType = 'cost'
        else if (t.includes('流向') || t.includes('桑基')) chartType = 'flow'
        else if (t.includes('告警') || t.includes('异常')) chartType = 'alert'
        else if (t.includes('节能') || t.includes('潜力')) chartType = 'saving'
      }

      const apiMap = {
        monthly: { tag: 'monthly_peak_6m', payload: { months: 6 } },
        tenant: { tag: 'tenant_arrears_top', payload: { limit: 8 } },
        device: { tag: 'meter_overview', payload: {} },
        power: { tag: 'tenant_power_top', payload: { limit: 8 } },
        saving: { tag: 'saving_potential_30d', payload: { days: 30 } }
      }

      if (chartType && apiMap[chartType]) {
        try {
          const { tag, payload } = apiMap[chartType]
          const res = await this.queryDashboardTag(tag, payload)
          const answer = String((res && res.answer) || '查询成功。')
          response = answer

          if (res && res.chart && res.chart.option) {
            this.currentChart = { type: chartType, title: res.chart.title || this.currentChart.title, option: res.chart.option }
            this.updateChart()
          } else if (chartType && this.chartData[chartType]) {
            this.currentChart = { type: chartType, title: this.chartData[chartType].title, data: this.chartData[chartType] }
            this.updateChart()
          }

          this.rightPanel.visible = true
          this.rightPanel.title = (res && res.chart && res.chart.title) ? res.chart.title : '分析摘要'
          this.rightPanel.text = response
          this.rightPanel.raw = (res && res.raw) ? res.raw : null
          this.rightPanel.type = chartType || ''
          this.rightPanel.activeTab = 'overview'
        } catch (e) {
          response = `**错误**：${(e && e.message) ? e.message : '请求失败'}`
          this.rightPanel.visible = true
          this.rightPanel.title = '分析失败'
          this.rightPanel.text = response
          this.rightPanel.raw = null
          this.rightPanel.type = chartType || ''
          this.rightPanel.activeTab = 'overview'
        } finally {
          this.addMessage('ai', response)
          this.isTyping = false
          this.$nextTick(() => { this.scrollToBottom() })
        }
        return
      }

      if (chartType === 'monthly') {
        response = '已生成 <strong>月度电费柱线图</strong>。<strong>8月（¥65,400）</strong>为全年峰值，超出预算约¥400。橙色为超预算月份，红色为最高月。'
      } else if (chartType === 'tenant') {
        response = '<strong>A座-3F-科技公司</strong>欠费最多（¥12,580），已连续2个月，属高风险。建议优先催缴并考虑预警停电措施。'
      } else if (chartType === 'cost') {
        response = '已生成 <strong>六项费用堆叠图</strong>（空调/照明/动力/插座用电 + 水费 + 空调服务费）。夏季高峰空调相关费用占比超56%。'
      } else if (chartType === 'flow') {
        response = '已生成 <strong>能源流向桑基图</strong>，展示园区总用电→专用/公摊设备→租户的完整链路。'
      } else if (chartType === 'alert') {
        response = '已生成 <strong>平台异常告警</strong>（非设备级）。当前共 <strong>4条</strong>：信息3条、警告1条，用于展示平台侧数据同步/费率校验/结算进度/余额异常等提示。'
      } else if (chartType === 'saving') {
        response = '已生成 <strong>节能潜力气泡矩阵</strong>（X轴难度 / Y轴回收期 / 气泡大小=潜力金额）。左下角是最优先实施项。'
      } else {
        response = '已理解您的问题。您可以继续询问：<br>• 哪个月电费最高 · 租户欠费排行<br>• 设备状态 · 本月功率排名<br>• 费用构成 · 成本流向<br>• 异常告警 · 节能潜力'
      }

      if (chartType === 'flow') {
        await this.refreshFlowData()
      }
      if (chartType && this.chartData[chartType]) {
        this.currentChart = { type: chartType, title: this.chartData[chartType].title, data: this.chartData[chartType] }
        this.updateChart()
      }
      this.addMessage('ai', response)
      this.isTyping = false
      this.$nextTick(() => { this.scrollToBottom() })
    },

    scrollToBottom () {
      const el = this.$refs.messagesRef
      if (el) el.scrollTop = el.scrollHeight
    }
  }
}
</script>

<style lang="scss" scoped>
.ai-mode {
  height: auto;
  min-height: 0;
  padding-bottom: 8px;
  --card-bg: #FFFFFF;
  --border: #E5E7EB;
  --text-primary: #1E293B;
  --accent: #14B8A6;
}

.ai-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-primary);
    font-weight: 600;

    i {
      color: var(--accent);
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .deep-ask-btn {
    background: transparent;
    color: var(--accent);
    border: 1px solid var(--accent);
    border-radius: 10px;
    height: 32px;
    padding: 0 12px;
    box-shadow: none;

    &:hover {
      background: var(--accent);
      color: #fff;
    }
  }
}

.ai-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

/* ── 左侧 ── */
.chart-area {
  .chart-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    height: 730px;
    display: flex;
    flex-direction: column;
  }

  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid #F1F5F9;
    flex-shrink: 0;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .icon-box {
      width: 36px;
      height: 36px;
      background: #EDE9FE;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 18px;
        color: #7C3AED;
      }
    }

    .title-box {
      h3 {
        font-size: 14px;
        font-weight: 600;
        color: #1E293B;
        margin: 0;
      }

      p {
        font-size: 11px;
        color: #94A3B8;
        margin: 2px 0 0;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;

      .pv-header {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .pv-label {
        font-size: 12px;
        color: #64748B;
        white-space: nowrap;
      }

      .pv-value {
        font-size: 12px;
        color: #1E293B;
        white-space: nowrap;
      }

      .pulse-dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        background: #7C3AED;
        border-radius: 50%;
        margin-right: 6px;
        animation: pulse 1.5s ease-in-out infinite;
      }
    }
  }

  .chart-body {
    flex: 1;
    padding: 12px;
    min-height: 0;
    background-image: radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.2) 1px, transparent 0);
    background-size: 18px 18px;
  }

  .chart-container {
    width: 100%;
    height: 100%;
  }
}

/* ── 右侧 ── */
.chat-area {
  .chat-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    height: 730px;
    display: flex;
    flex-direction: column;
  }

  .chat-header {
    display: flex;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid #F1F5F9;
    flex-shrink: 0;

    .chat-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .ai-avatar {
      position: relative;

      .avatar-box {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #7C3AED, #6D28D9);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 18px;
          color: white;
        }
      }

      .status-dot {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 10px;
        height: 10px;
        background: #10B981;
        border: 2px solid white;
        border-radius: 50%;
        animation: pulse 1.5s ease-in-out infinite;
      }
    }

    .title-box {
      h3 {
        font-size: 14px;
        font-weight: 600;
        color: #1E293B;
        margin: 0;
      }

      p {
        font-size: 11px;
        color: #94A3B8;
        margin: 2px 0 0;
      }
    }
  }

  .chat-body {
    flex: 1;
    overflow: hidden;
    padding: 12px;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .quick-questions {
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #F1F5F9;
    flex-shrink: 0;

    p {
      font-size: 11px;
      color: #64748B;
      margin: 0 0 7px;
    }

    .question-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;

      ::v-deep .el-tag {
        cursor: pointer;

        &:hover {
          background: #EDE9FE;
          border-color: #C4B5FD;
          color: #7C3AED;
        }

        i {
          margin-right: 3px;
          font-size: 10px;
        }
      }
    }
  }

  .right-summary {
    flex-shrink: 0;
    margin-bottom: 10px;
    padding: 11px 13px;
    border-radius: 10px;
    border: 1px solid rgba(124, 58, 237, 0.18);
    background: linear-gradient(135deg, rgba(237, 233, 254, 0.55), rgba(245, 243, 255, 0.92));
    box-shadow: 0 8px 22px rgba(124, 58, 237, 0.10);
  }

  .right-summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 6px;
  }

  .right-summary-header-left {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;

    i {
      color: #7C3AED;
      font-size: 13px;
    }
  }

  .right-summary-title {
    font-size: 12px;
    font-weight: 600;
    color: #4C1D95;
  }

  .right-summary-header-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }

  .right-summary-action {
    padding: 0 6px;
  }

  .right-summary-kpis {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 10px;
    margin: 8px 0 8px;
  }

  .kpi {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(124, 58, 237, 0.10);
  }

  .kpi-label {
    font-size: 11px;
    color: #6B7280;
  }

  .kpi-value {
    font-size: 11px;
    font-weight: 600;
    color: #4C1D95;
  }

  .right-summary-text {
    font-size: 12px;
    line-height: 1.8;
    color: #374151;
  }

  .right-summary-dialog {
    max-height: 60vh;
    overflow: auto;
    font-size: 12px;
    line-height: 1.8;
    color: #374151;
  }

  .saving-dialog-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .saving-kpis {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 10px;
    margin-bottom: 10px;
  }

  .saving-note {
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(124, 58, 237, 0.16);
    background: rgba(255, 255, 255, 0.78);
    color: #4C1D95;
    font-size: 12px;
    line-height: 1.7;
    margin-bottom: 10px;
  }

  .saving-preview {
    font-size: 12px;
    line-height: 1.8;
    color: #374151;
  }

  .saving-full {
    font-size: 12px;
    line-height: 1.9;
    color: #374151;
  }

  .saving-table-wrap {
    border: 1px solid rgba(124, 58, 237, 0.10);
    border-radius: 10px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.85);
  }

  .saving-issues {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 10px;
    margin-bottom: 10px;
  }

  .issue-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.80);
    border: 1px solid rgba(124, 58, 237, 0.10);
  }

  .issue-label {
    font-size: 12px;
    color: #6B7280;
  }

  .issue-value {
    font-size: 12px;
    font-weight: 700;
    color: #4C1D95;
  }

  ::v-deep .saving-dialog .el-dialog__body {
    padding: 12px 16px;
  }

  ::v-deep .saving-dialog .el-tabs__content {
    max-height: 58vh;
    overflow: auto;
    padding-right: 4px;
  }

  ::v-deep .saving-dialog .el-tabs__header {
    margin: 0 0 10px;
  }

  ::v-deep .saving-dialog .el-tabs__item {
    padding: 0 22px !important;
    height: 34px;
    line-height: 34px;
  }

  ::v-deep .saving-dialog .el-tabs__item + .el-tabs__item {
    margin-left: 12px;
  }

  ::v-deep .saving-dialog .saving-line {
    line-height: 1.9;
  }

  ::v-deep .saving-dialog .saving-line + .saving-line {
    margin-top: 6px;
  }

  ::v-deep .saving-dialog .saving-line--blank + .saving-line {
    margin-top: 12px;
  }

  ::v-deep .saving-dialog .el-table th {
    background: #F6F3FF;
    color: #4C1D95;
  }

  ::v-deep .saving-dialog .saving-table {
    border: none;
    font-size: 12px;
  }

  ::v-deep .saving-dialog .saving-table::before {
    height: 0;
  }

  ::v-deep .saving-dialog .saving-table th {
    background: #F6F3FF;
    color: #4C1D95;
    font-weight: 600;
  }

  ::v-deep .saving-dialog .saving-table th,
  ::v-deep .saving-dialog .saving-table td {
    padding: 10px 0;
  }

  ::v-deep .saving-dialog .saving-table .cell {
    padding: 0 12px;
    line-height: 1.6;
  }

  ::v-deep .saving-dialog .saving-table td .cell {
    color: #111827;
  }

  ::v-deep .saving-dialog .saving-table td.is-right .cell,
  ::v-deep .saving-dialog .saving-table th.is-right .cell {
    font-variant-numeric: tabular-nums;
  }

  ::v-deep .saving-dialog-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  ::v-deep .saving-kpis {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 10px;
    margin-bottom: 10px;
  }

  ::v-deep .saving-note {
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(124, 58, 237, 0.16);
    background: rgba(255, 255, 255, 0.78);
    color: #4C1D95;
    font-size: 12px;
    line-height: 1.7;
    margin-bottom: 10px;
  }

  ::v-deep .saving-preview {
    font-size: 12px;
    line-height: 1.8;
    color: #374151;
  }

  ::v-deep .saving-full {
    font-size: 12px;
    line-height: 1.9;
    color: #374151;
  }

  ::v-deep .saving-issues {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 10px;
    margin-bottom: 10px;
  }

  ::v-deep .issue-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.80);
    border: 1px solid rgba(124, 58, 237, 0.10);
  }

  ::v-deep .issue-label {
    font-size: 12px;
    color: #6B7280;
  }

  ::v-deep .issue-value {
    font-size: 12px;
    font-weight: 700;
    color: #4C1D95;
  }

  .messages {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding-right: 4px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .message {
    display: flex;
    gap: 10px;

    &.user {
      flex-direction: row-reverse;

      .avatar {
        background: #E0F2FE;

        i {
          color: #0284C7;
        }
      }

      .content {
        background: #0EA5E9;
        color: white;
        border-radius: 12px 12px 4px 12px;
      }
    }

    &.ai {
      .avatar {
        background: linear-gradient(135deg, #7C3AED, #6D28D9);

        i {
          color: white;
        }
      }

      .content {
        background: #F1F5F9;
        color: #1E293B;
        border-radius: 12px 12px 12px 4px;
      }
    }

    &.typing .content {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 12px 16px;

      .dot {
        width: 6px;
        height: 6px;
        background: #94A3B8;
        border-radius: 50%;
        animation: bounce 1s ease-in-out infinite;

        &:nth-child(2) {
          animation-delay: 0.15s;
        }

        &:nth-child(3) {
          animation-delay: 0.3s;
        }
      }
    }

    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 14px;
      }
    }

    .content {
      max-width: 82%;
      padding: 10px 12px;
      font-size: 12px;
      line-height: 1.65;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
    }
  }

  .chat-input {
    padding: 10px 14px;
    border-top: 1px solid #F1F5F9;
    flex-shrink: 0;
    background: white;
    z-index: 2;
  }

  .trae-inputbar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  }

  .bar-left {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .chip.agent {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 26px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid #E5EAF3;
    background: #F6FAFF;
    color: var(--text-primary);
    font-size: 12px;
  }

  .bar-center {
    flex: 1;
    min-width: 0;
  }

  .trae-input ::v-deep .el-input__inner {
    height: 38px;
    border: none;
    box-shadow: none;
    padding: 0;
    color: var(--text-primary);
    background: transparent;
  }

  .trae-input ::v-deep .el-input__suffix {
    right: 0;
  }

  .bar-right {
    flex-shrink: 0;
  }

  .send-btn-circle {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      background: #0D9488;
    }
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1
  }

  50% {
    opacity: 0.45
  }
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0)
  }

  50% {
    transform: translateY(-4px)
  }
}

@media (max-width:1200px) {
  .ai-layout {
    grid-template-columns: 1fr;
  }

  .chat-area {
    display: none;
  }
}
</style>
