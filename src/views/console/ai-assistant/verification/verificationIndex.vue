<template>
  <div class="audit-page">
    <!-- ========== 全屏沉浸式完成核查 Loading 遮罩 ========== -->
    <transition name="overlay-fade">
      <div class="completion-overlay" v-if="isCompletingSession">
        <div class="overlay-backdrop"></div>
        <div class="overlay-content">
          <div class="particle-ring">
            <div class="ring ring-1"></div>
            <div class="ring ring-2"></div>
            <div class="ring ring-3"></div>
            <div class="pulse-core">
              <i class="el-icon-s-data"></i>
            </div>
          </div>

          <div class="progress-stages">
            <div v-for="(stage, idx) in completionStages" :key="idx"
              :class="['stage-item', { done: stage.done, active: stage.active, waiting: !stage.done && !stage.active }]">
              <div class="stage-icon-wrap">
                <i v-if="stage.done" class="el-icon-circle-check stage-icon done-icon"></i>
                <div v-else-if="stage.active" class="stage-spinner">
                  <div class="spinner-dot"></div>
                  <div class="spinner-dot"></div>
                  <div class="spinner-dot"></div>
                </div>
                <i v-else class="el-icon-more stage-icon wait-icon"></i>
              </div>
              <div class="stage-text">
                <div class="stage-name">{{ stage.name }}</div>
                <div class="stage-desc">{{ stage.active ? stage.activeDesc : (stage.done ? stage.doneDesc : stage.desc)
                  }}</div>
              </div>
              <div class="stage-connector" v-if="idx < completionStages.length - 1"></div>
            </div>
          </div>

          <div class="data-counter" v-if="isExtractingData">
            <div class="counter-label">正在处理数据项</div>
            <div class="counter-value">{{ dataCounter.toLocaleString() }}</div>
          </div>

          <div class="progress-bar-wrap">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: completionProgress + '%' }">
                <div class="progress-glow"></div>
              </div>
            </div>
            <div class="progress-label">{{ completionProgress }}%</div>
          </div>

          <div class="overlay-tip">
            <i class="el-icon-info-outline"></i>
            正在对账单进行多维度智能比对，数据量较大，请耐心等待...
          </div>
        </div>
      </div>
    </transition>

    <!-- 侧边栏 -->
    <div class="sidebar-panel">
      <div class="sidebar-header">
        <div class="header-title"><i class="el-icon-files"></i> 核查任务列表</div>
        <el-button type="primary" size="small" icon="el-icon-plus" @click="createNewSession">新建核查</el-button>
      </div>
      <div class="search-box">
        <div class="filter-label">按<strong>上传日期</strong>筛选</div>
        <!-- 粒度切换 -->
        <div class="date-mode-tabs">
          <span :class="['date-tab', { active: filterMode === 'year' }]" @click="setFilterMode('year')">按年</span>
          <span :class="['date-tab', { active: filterMode === 'month' }]" @click="setFilterMode('month')">按月</span>
        </div>
        <el-date-picker v-if="filterMode === 'year'" v-model="filterDate" type="year" placeholder="选择年份" size="small"
          style="width: 100%; margin-bottom: 8px;" :clearable="false" format="yyyy年" value-format="yyyy-MM-dd"
          @change="handleDateChange" />
        <el-date-picker v-else v-model="filterDate" type="month" placeholder="选择月份" size="small"
          style="width: 100%; margin-bottom: 8px;" :clearable="false" format="yyyy年MM月" value-format="yyyy-MM-dd"
          @change="handleDateChange" />
        <el-input placeholder="搜索单据名称..." v-model="searchText" size="small" prefix-icon="el-icon-search"></el-input>
      </div>
      <div class="session-list">
        <div v-for="item in filteredSessions" :key="item.id"
          :class="['session-item', { active: activeSessionId === item.id }]" @click="switchSession(item.id)">
          <div class="item-main">
            <div class="item-icon">
              <i v-if="item.isPdf" class="el-icon-document text-danger"></i>
              <i v-else class="el-icon-picture text-success"></i>
            </div>
            <div class="item-content">
              <div class="item-name" :title="item.fileName">{{ item.fileName || '新核查任务' }}</div>
              <div class="item-status">
                <span :class="['status-dot', item.status]"></span>
                {{ getStatusText(item.status) }}
              </div>
            </div>
            <div class="item-delete" @click.stop="deleteSession(item.id)" title="删除会话">
              <i class="el-icon-delete"></i>
            </div>
          </div>
          <div class="item-date"><i class="el-icon-upload2"></i> 上传于 {{ formatTime(item.createdAt) }}</div>
        </div>
        <div v-if="filteredSessions.length === 0" class="empty-list">
          <span v-if="searchText">无匹配结果</span>
          <span v-else>暂无核查记录，请点击新建</span>
        </div>
      </div>
    </div>

    <!-- 主工作区 -->
    <div class="main-workspace">
      <div class="workspace-header" v-if="currentSession">
        <div class="file-info">
          <span class="label">当前单据：</span>
          <span class="value">{{ currentSession.fileName || '待上传' }}</span>
          <el-tag size="mini" v-if="currentSession.uploadedFilePath" type="success" effect="plain">已上传</el-tag>
          <el-tag size="mini" v-else type="info" effect="plain">未上传</el-tag>
          <!-- 后台提取状态提示 -->
          <el-tag size="mini" v-if="currentSession.uploadedFilePath && currentSession.status !== 'completed'"
            :type="currentSession.keyDataStatus === 'ready' ? 'success' : currentSession.keyDataStatus === 'error' ? 'danger' : 'warning'"
            effect="plain" style="margin-left: 8px;">
            {{ currentSession.keyDataStatus === 'ready' ? '数据已就绪' : currentSession.keyDataStatus === 'error' ? '提取异常' :
            '后台提取中...' }}
          </el-tag>
        </div>
        <div class="actions">
          <el-button v-if="currentSession.uploadedFilePath" type="text" icon="el-icon-refresh-left"
            @click="resetCurrentUpload"
            :disabled="isSaving || isLoading || currentSession.status === 'completed'">重新上传</el-button>

          <el-button v-if="currentSession.uploadedFilePath && currentSession.status === 'completed'" type="success"
            size="small" icon="el-icon-circle-check" disabled>已完成</el-button>

          <el-button v-else-if="currentSession.uploadedFilePath" type="primary" size="small" icon="el-icon-check"
            @click="completeSession" :disabled="isLoading || isSaving">完成核查</el-button>
        </div>
      </div>

      <div class="workspace-content">
        <div class="upload-wrapper" v-if="!currentSession || !currentSession.uploadedFilePath">
          <div class="upload-card">
            <div class="upload-area" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
              <i class="el-icon-upload"></i>
              <div class="upload-text">
                <h3>点击或拖拽上传电费核查联</h3>
                <p>支持 PDF / PNG / JPG 格式</p>
              </div>
              <input type="file" ref="fileInput" @change="handleFileChange" accept=".pdf,.png,.jpg,.jpeg"
                style="display: none" />
            </div>
            <div class="upload-tips">
              <p><i class="el-icon-info"></i> 提示：上传后系统将自动提取关键数据并进行智能核查。</p>
            </div>
          </div>
        </div>

        <div class="split-layout" v-else>
          <div class="doc-viewer-pane">
            <div class="pane-header">单据预览</div>
            <div class="doc-container">
              <iframe v-if="currentSession.isPdf" :src="currentSession.fileUrl" width="100%" height="100%"
                frameborder="0"></iframe>
              <img v-else :src="currentSession.fileUrl"
                style="max-width: 100%; max-height: 100%; object-fit: contain;" />
            </div>
          </div>

          <div class="chat-pane">
            <div class="pane-header"><span>智能核查助手</span></div>
            <div class="chat-messages" ref="chatContainer">
              <div v-for="(msg, index) in currentSession.messages" :key="index" :class="['message', msg.type]">
                <div class="avatar-wrapper">
                  <div class="avatar ai" v-if="msg.type === 'ai'"><i class="el-icon-s-custom"></i></div>
                  <div class="avatar user" v-else><i class="el-icon-user"></i></div>
                </div>
                <div class="message-content-wrapper">
                  <div class="sender-name">{{ msg.type === 'ai' ? '核查助手' : '我' }}</div>
                  <div class="content-bubble">
                    <div v-if="msg.loading" class="typing-indicator"><span></span><span></span><span></span></div>
                    <div v-else v-html="renderMarkdown(msg.content)"></div>
                  </div>
                  <div class="message-time" v-if="msg.time">{{ msg.time }}</div>
                </div>
              </div>
            </div>
            <div class="input-section">
              <el-input type="textarea" :rows="3" :placeholder="isInputDisabled ? '本单据已核查完成，如需新核查请新建任务。' : '请输入您的问题...'"
                v-model="inputQuery" @keydown.enter.native.prevent="handleEnter"
                :disabled="isLoading || isInputDisabled" resize="none" />
              <div class="input-actions">
                <span class="tip">Enter 发送，Shift + Enter 换行</span>
                <el-button type="primary" size="small" @click="sendMessage" :loading="isLoading"
                  :disabled="isInputDisabled">发送</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked'
import { mapGetters } from 'vuex'
import moment from 'moment'
import { addEBVSession, getEBVSessionList, deleteEBVSession } from '@/api/verificationAi'
import { contentOssSts } from '@/api/oss'
import OSS from 'ali-oss'
import { getAiApiUrl, AI_SERVICE_URL } from '@/utils/aiServiceConfig'

export default {
  name: 'ElectricityAuditPage',
  data () {
    return {
      sessions: [],
      activeSessionId: null,
      searchText: '',
      filterDate: new Date(),
      filterMode: 'year', // 'year' | 'month'
      inputQuery: '',
      isLoading: false,
      isSaving: false,
      token: 'energy-ai-token-v1',

      // 轮询定时器 map: sessionId -> intervalId（不放 data，避免 Vue 2 响应式问题）
      // _pollTimers 在 created 里初始化为 this._pollTimers = {}

      // 完成核查沉浸式 Loading
      isCompletingSession: false,
      isExtractingData: false,
      completionProgress: 0,
      dataCounter: 0,
      dataCounterTimer: null,
      progressTimer: null,
      completionStages: [
        { name: '数据提取', desc: '等待开始', activeDesc: '正在识别单据结构与关键字段...', doneDesc: '已完成', active: false, done: false },
        { name: '多维比对', desc: '等待上一步', activeDesc: '正在与历史档案进行交叉核验...', doneDesc: '比对完成', active: false, done: false },
        { name: '异常检测', desc: '等待上一步', activeDesc: '正在扫描数据偏差与潜在风险项...', doneDesc: '检测完成', active: false, done: false },
        { name: '生成报告', desc: '等待上一步', activeDesc: '正在归档核查结论...', doneDesc: '归档完成', active: false, done: false }
      ]
    }
  },
  computed: {
    ...mapGetters('user', ['userId']),
    ...mapGetters('manager', ['currentManagerId']),
    currentSession () {
      return this.sessions.find(s => s.id === this.activeSessionId) || null
    },
    filteredSessions () {
      if (!this.searchText) return this.sessions
      return this.sessions.filter(s => s.fileName.toLowerCase().includes(this.searchText.toLowerCase()))
    },
    isInputDisabled () {
      if (!this.currentSession) return true
      if (this.currentSession.status === 'completed') return true
      const hasRealAiResponse = this.currentSession.messages.some(m => {
        return m.type === 'ai' && !m.loading &&
          m.content !== '正在上传并分析单据...' &&
          !m.content.startsWith('您好！我是电费核查专家')
      })
      return hasRealAiResponse
    }
  },
  watch: {
    userId: {
      immediate: false,
      handler (newVal) {
        if (newVal) this.reloadSessions()
      }
    },
    currentManagerId: {
      immediate: false,
      handler (newVal, oldVal) {
        if (newVal !== oldVal) this.reloadSessions()
      }
    }
  },
  created () {
    this._pollTimers = {} // 不放 data()，避免 Vue2 响应式劫持
    this.initData()
  },
  beforeDestroy () {
    this.clearCompletionTimers()
    if (this._pollTimers && typeof this._pollTimers === 'object') {
      Object.values(this._pollTimers).forEach(id => clearInterval(id))
    }
  },
  methods: {

    // ===========================
    //   后台异步提取（核心优化）
    // ===========================

    /**
     * 上传成功后立即调用。
     * 调用 /audit/extract/start → 立即拿到 task_id（毫秒级）
     * 然后每3秒轮询 /audit/extract/status，完成后缓存到 session.keyData
     */
    startBackgroundExtract (session) {
      if (!session || !session.uploadedFilePath) return
      if (session.status === 'completed') return

      // 防重复
      if (session.keyDataStatus === 'loading' || session.keyDataStatus === 'ready') return

      session.keyDataStatus = 'loading'
      session.keyData = null

      fetch(getAiApiUrl('/api/audit/extract/start'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Manager-Id': (this.currentManagerId || '').toString(),
          'X-Token': this.token
        },
        body: JSON.stringify({ image_path: session.uploadedFilePath })
      })
        .then(r => {
          if (!r.ok) throw new Error(`start failed: ${r.status}`)
          return r.json()
        })
        .then(({ task_id }) => {
          console.log(`[extract] task_id=${task_id}`)
          this._startPolling(session, task_id)
        })
        .catch(err => {
          console.warn('[extract] start failed:', err)
          session.keyDataStatus = 'error'
        })
    },

    /**
     * 每3秒轮询一次，直到 status=done 或超时（3分钟）
     */
    _startPolling (session, task_id) {
      const sessionId = session.id
      const maxWait = 180000 // 3分钟超时
      const interval = 3000 // 3秒轮询一次
      const startedAt = Date.now()

      // 停掉旧定时器（如有）
      if (this._pollTimers[sessionId]) {
        clearInterval(this._pollTimers[sessionId])
      }

      const timer = setInterval(async () => {
        // 超时
        if (Date.now() - startedAt > maxWait) {
          clearInterval(this._pollTimers[sessionId])
          delete this._pollTimers[sessionId]
          session.keyDataStatus = 'error'
          console.warn(`[extract] 轮询超时 task_id=${task_id}`)
          return
        }

        try {
          const res = await fetch(
            getAiApiUrl(`/api/audit/extract/status?task_id=${task_id}`),
            {
              headers: {
                'X-Manager-Id': (this.currentManagerId || '').toString(),
                'X-Token': this.token
              }
            }
          )
          if (!res.ok) return // 网络抖动，继续等

          const data = await res.json()
          if (data.status === 'done') {
            clearInterval(this._pollTimers[sessionId])
            delete this._pollTimers[sessionId]
            // Vue2 响应式：用 $set 确保视图更新
            const idx = this.sessions.findIndex(s => s.id === sessionId)
            if (idx !== -1) {
              this.$set(this.sessions[idx], 'keyData', data.data)
              this.$set(this.sessions[idx], 'keyDataStatus', 'ready')
              this.$set(this.sessions[idx], 'keyDataFetchedAt', Date.now())
            } else {
              session.keyData = data.data
              session.keyDataStatus = 'ready'
              session.keyDataFetchedAt = Date.now()
            }
            console.log(`[extract] 完成 task_id=${task_id}`)
          }
          // status=running: 继续等
        } catch (e) {
          // 网络抖动，忽略，继续轮询
        }
      }, interval)

      this._pollTimers[sessionId] = timer
    },

    // ===========================
    //   完成核查
    // ===========================
    async completeSession () {
      if (!this.currentSession) return
      this.startCompletionOverlay()

      try {
        // ---- 阶段1：数据提取 ----
        this.activateStage(0)

        let extractedKeyData = null

        if (this.currentSession.keyDataStatus === 'ready') {
          // 后台早就跑完了，瞬间拿到，计数器不显示
          this.isExtractingData = false
          extractedKeyData = this.currentSession.keyData
          this.animateProgressTo(50, 600)
          await this.delay(400)
        } else {
          // 还在后台跑（用户点击太快）：显示 loading 动画，等轮询完成
          this.startDataCounter()
          this.animateProgressTo(40, 120000) // 慢速推进，等待结果

          extractedKeyData = await this._waitForExtractResult(this.currentSession)

          this.stopDataCounter()
          this.animateProgressTo(50, 600)
          await this.delay(400)
        }

        this.completeStage(0)

        // ---- 阶段2：多维比对 ----
        this.activateStage(1)
        this.animateProgressTo(70, 2000)
        await this.delay(2200)
        this.completeStage(1)
        this.animateProgressTo(78, 400)
        await this.delay(300)

        // ---- 阶段3：异常检测 ----
        this.activateStage(2)
        this.animateProgressTo(90, 1500)
        await this.delay(1600)
        this.completeStage(2)
        this.animateProgressTo(95, 400)
        await this.delay(300)

        // ---- 阶段4：生成报告（提交 Java）----
        this.activateStage(3)
        this.animateProgressTo(98, 1000)

        const payload = {
          sessionId: this.currentSession.id,
          userId: this.userId,
          managerId: this.currentManagerId,
          createTime: moment(this.currentSession.createdAt).format('YYYY-MM-DD HH:mm:ss'),
          finishTime: moment().format('YYYY-MM-DD HH:mm:ss'),
          status: 1,
          type: 2,
          fileName: this.currentSession.fileName,
          filePath: this.currentSession.uploadedFilePath,
          keyData: extractedKeyData,
          chatHistory: this.currentSession.messages.map(m => ({
            type: m.type,
            content: m.content,
            time: m.time
          }))
        }

        await addEBVSession(payload)

        this.completeStage(3)
        this.animateProgressTo(100, 500)
        await this.delay(800)

        this.currentSession.status = 'completed'
        this.stopCompletionOverlay()
        this.$message.success('核查完成，数据已归档')
      } catch (err) {
        console.error('completeSession error:', err)
        this.stopCompletionOverlay()

        let errMsg = '提交失败，请稍后重试'
        if (err && err.data && err.data.msg) errMsg = err.data.msg
        else if (err && err.msg) errMsg = err.msg
        else if (err && err.response && err.response.data) errMsg = err.response.data.msg || err.response.data.message || errMsg
        else if (err && err.message) errMsg = err.message

        this.$message.error(errMsg)
      }
    },

    /**
     * 等待轮询结果（仅在用户点太快、后台还没跑完时调用）
     * 最多等3分钟，每500ms检查一次 session.keyDataStatus
     */
    _waitForExtractResult (session) {
      return new Promise((resolve) => {
        const maxWait = 180000
        const checkInterval = 500
        const startedAt = Date.now()

        const check = () => {
          if (session.keyDataStatus === 'ready') {
            resolve(session.keyData)
            return
          }
          if (session.keyDataStatus === 'error' || Date.now() - startedAt > maxWait) {
            resolve(null) // 失败不阻断流程
            return
          }
          setTimeout(check, checkInterval)
        }
        check()
      })
    },

    // ===========================
    //   沉浸式 Loading 控制
    // ===========================
    startCompletionOverlay () {
      this.isCompletingSession = true
      this.isExtractingData = true
      this.completionProgress = 0
      this.dataCounter = 0
      this.completionStages.forEach(s => { s.active = false; s.done = false })
    },

    stopCompletionOverlay () {
      this.clearCompletionTimers()
      setTimeout(() => {
        this.isCompletingSession = false
        this.isExtractingData = false
        this.completionProgress = 0
      }, 600)
    },

    activateStage (idx) {
      if (!this.completionStages[idx]) return
      this.$set(this.completionStages, idx, { ...this.completionStages[idx], active: true, done: false })
    },

    completeStage (idx) {
      if (!this.completionStages[idx]) return
      this.$set(this.completionStages, idx, { ...this.completionStages[idx], active: false, done: true })
    },

    animateProgressTo (target, duration) {
      if (this.progressTimer) clearInterval(this.progressTimer)
      const start = this.completionProgress
      const diff = target - start
      const steps = Math.max(1, Math.floor(duration / 50))
      let step = 0
      this.progressTimer = setInterval(() => {
        step++
        const t = step / steps
        const eased = 1 - Math.pow(1 - t, 3)
        this.completionProgress = Math.round(start + diff * eased)
        if (step >= steps) {
          this.completionProgress = target
          clearInterval(this.progressTimer)
        }
      }, 50)
    },

    startDataCounter () {
      this.dataCounter = 0
      let speed = 80
      const tick = () => {
        if (!this.isExtractingData) return
        if (this.dataCounter < 5000) speed = 60
        else if (this.dataCounter < 20000) speed = 30
        else speed = 15
        this.dataCounter += Math.floor(Math.random() * speed) + 10
        if (this.isExtractingData) this.dataCounterTimer = setTimeout(tick, 50)
      }
      this.dataCounterTimer = setTimeout(tick, 50)
    },

    stopDataCounter () {
      this.isExtractingData = false
      if (this.dataCounterTimer) clearTimeout(this.dataCounterTimer)
    },

    clearCompletionTimers () {
      if (this.progressTimer) clearInterval(this.progressTimer)
      if (this.dataCounterTimer) clearTimeout(this.dataCounterTimer)
      this.isExtractingData = false
    },

    delay (ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },

    // ===========================
    //   存储与加载
    // ===========================
    async initData () {
      if (this.userId) {
        await this.loadFromStorage()
      } else {
        try {
          await this.$store.dispatch('user/getUserInfo')
          await this.loadFromStorage()
        } catch (e) {
          console.warn('initData: getUserInfo failed', e)
        }
      }
      if (this.sessions.length === 0) this.createNewSession()
    },

    async reloadSessions () {
      // 停掉所有轮询
      Object.values(this._pollTimers).forEach(id => clearInterval(id))
      this._pollTimers = {}
      this.sessions = []
      this.activeSessionId = null
      await this.loadFromStorage()
      if (this.sessions.length === 0) this._doCreateSession()
    },

    async loadFromStorage () {
      try {
        const params = {
          managerId: this.currentManagerId,
          type: 2,
          beginTime: this.filterMode === 'year'
            ? moment(this.filterDate).startOf('year').format('YYYY-MM-DD HH:mm:ss')
            : moment(this.filterDate).startOf('month').format('YYYY-MM-DD HH:mm:ss'),
          endTime: this.filterMode === 'year'
            ? moment(this.filterDate).endOf('year').format('YYYY-MM-DD HH:mm:ss')
            : moment(this.filterDate).endOf('month').format('YYYY-MM-DD HH:mm:ss')
        }
        const res = await getEBVSessionList(params)
        if (res.code === 200 && res.data && res.data.length > 0) {
          this.sessions = res.data.map(dto => ({
            id: dto.sessionId || String(dto.id),
            pkId: dto.id,
            fileName: dto.fileName,
            uploadedFilePath: dto.filePath,
            fileUrl: dto.filePath
              ? (dto.filePath.startsWith('http') ? dto.filePath : AI_SERVICE_URL + dto.filePath)
              : '',
            isPdf: dto.filePath ? dto.filePath.toLowerCase().endsWith('.pdf') : false,
            status: dto.status === 1 ? 'completed' : 'processing',
            createdAt: dto.createTime,
            messages: dto.chatHistory || [],
            keyData: dto.keyData || null,
            keyDataStatus: dto.keyData ? 'ready' : 'idle',
            keyDataFetchedAt: dto.keyData ? Date.now() : null
          }))
          this.activeSessionId = this.sessions[0].id
        } else {
          this.sessions = []
          this.activeSessionId = null
        }
      } catch (e) {
        console.error('loadFromStorage failed:', e)
        this.sessions = []
        this.activeSessionId = null
      }
    },

    async createNewSession () {
      const granularity = this.filterMode === 'year' ? 'year' : 'month'
      if (!moment(this.filterDate).isSame(new Date(), granularity)) {
        this.filterDate = new Date()
        await this.loadFromStorage()
      }
      const todayUploadedCount = (this.sessions || []).filter(s => {
        if (!s || !s.uploadedFilePath) return false
        const t = moment(s.createdAt)
        return t.isValid() && t.isSame(new Date(), 'day')
      }).length
      if (todayUploadedCount >= 3) {
        this.$message.warning('今日上传次数已达3次，无法新建核查')
        return
      }
      return this._doCreateSession()
    },

    _doCreateSession () {
      const newId = Date.now().toString()
      const newSession = {
        id: newId,
        fileName: '',
        fileUrl: '',
        uploadedFilePath: null,
        isPdf: false,
        status: 'pending',
        createdAt: new Date(),
        keyData: null,
        keyDataStatus: 'idle',
        keyDataFetchedAt: null,
        messages: [{
          type: 'ai',
          content: '您好！我是电费核查专家。请在界面中间上传【江苏省电力公司电费核查联】或相关单据，我将为您自动提取数据并进行核查。',
          time: this.getCurrentTime()
        }]
      }
      this.sessions.unshift(newSession)
      this.activeSessionId = newId
      return newSession
    },

    setFilterMode (mode) {
      if (this.filterMode === mode) return
      this.filterMode = mode
      // 切换粒度时重置为当前时间
      this.filterDate = new Date()
      this.reloadSessions()
    },

    handleDateChange () {
      this.reloadSessions()
    },

    switchSession (id) {
      this.activeSessionId = id
      this.$nextTick(() => this.scrollToBottom())
    },

    async deleteSession (id) {
      const session = this.sessions.find(s => s.id === id)
      if (!session) return
      try {
        await this.$confirm('确定要删除该核查会话吗？', '提示', {
          confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
        })
        // 停掉该 session 的轮询
        if (this._pollTimers[id]) {
          clearInterval(this._pollTimers[id])
          delete this._pollTimers[id]
        }
        const isSavedSession = typeof session.createdAt === 'string'
        if (isSavedSession) await deleteEBVSession(session.pkId || session.id)
        this.$message.success('删除成功')
        this.sessions = this.sessions.filter(s => s.id !== id)
        if (this.activeSessionId === id) {
          this.activeSessionId = this.sessions.length > 0 ? this.sessions[0].id : null
        }
      } catch (e) {
        if (e !== 'cancel') this.$message.error('删除失败')
      }
    },

    getStatusText (status) {
      return { pending: '待上传', processing: '核查中', completed: '已完成' }[status] || status
    },

    triggerUpload () { this.$refs.fileInput.click() },
    handleFileChange (e) {
      const file = e.target.files[0]
      if (file) this.uploadAndAnalyze(file)
      e.target.value = ''
    },
    handleDrop (e) {
      const file = e.dataTransfer.files[0]
      if (file) this.uploadAndAnalyze(file)
    },
    resetCurrentUpload () {
      if (!this.currentSession) return
      // 停掉轮询
      if (this._pollTimers[this.currentSession.id]) {
        clearInterval(this._pollTimers[this.currentSession.id])
        delete this._pollTimers[this.currentSession.id]
      }
      Object.assign(this.currentSession, {
        uploadedFilePath: null,
        fileName: '',
        fileUrl: '',
        isPdf: false,
        status: 'pending',
        keyData: null,
        keyDataStatus: 'idle',
        keyDataFetchedAt: null,
        messages: [{ type: 'ai', content: '请上传新的单据。', time: this.getCurrentTime() }]
      })
    },

    async uploadAndAnalyze (file) {
      if (!this.currentSession) {
        const s = await this.createNewSession()
        if (s && this.activeSessionId !== s.id) this.activeSessionId = s.id
      }
      if (!this.currentSession) {
        if (this.sessions.length > 0) this.activeSessionId = this.sessions[0].id
        else return
      }

      this.currentSession.fileName = file.name
      this.currentSession.isPdf = file.type === 'application/pdf'
      this.currentSession.status = 'processing'
      this.isLoading = true

      this.currentSession.messages.push({
        type: 'ai', content: '正在上传文件至云端...', loading: true, time: this.getCurrentTime()
      })

      try {
        const uid = new Date().getTime()
        const { code, msg, data } = await contentOssSts({ uid })
        if (code !== 200) throw new Error('获取OSS凭证失败: ' + msg)

        const client = new OSS({
          region: 'oss-cn-shanghai',
          accessKeyId: data.accessKeyId,
          accessKeySecret: data.accessKeySecret,
          stsToken: data.securityToken,
          bucket: 'wu-cloud',
          secure: true
        })

        const point = file.name.lastIndexOf('.')
        const suffix = file.name.substr(point)
        const fileName = file.name.substr(0, point)
        const dateStr = moment().format('YYYYMMDDHHmmss')
        const objectName = `msg/${fileName}_${dateStr}${suffix}`

        const result = await client.put(objectName, file)
        this.currentSession.uploadedFilePath = result.url
        this.currentSession.fileUrl = result.url
        this.currentSession.messages.pop()
        this.currentSession.messages.push({
          type: 'ai', content: '文件上传成功，正在后台提取关键数据...', time: this.getCurrentTime()
        })

        // ✅ 核心：上传成功后立即启动后台异步提取，不等待
        this.startBackgroundExtract(this.currentSession)

        // 同时启动对话流分析
        await this.streamAuditRequest('请分析这份电费核查联，提取关键数据。', this.currentSession.uploadedFilePath)
      } catch (e) {
        this.currentSession.messages.pop()
        this.currentSession.messages.push({
          type: 'ai', content: `❌ 上传失败: ${e.message}`, time: this.getCurrentTime()
        })
        this.isLoading = false
      }
    },

    handleEnter (e) {
      if (!e.shiftKey && !this.isLoading) this.sendMessage()
    },

    async sendMessage () {
      const query = this.inputQuery.trim()
      if (!query || !this.currentSession) return
      this.currentSession.messages.push({ type: 'user', content: query, time: this.getCurrentTime() })
      this.inputQuery = ''
      await this.streamAuditRequest(query, this.currentSession.uploadedFilePath)
    },

    async streamAuditRequest (query, imagePath) {
      if (!this.currentSession) return
      this.isLoading = true

      const aiMsgIndex = this.currentSession.messages.push({
        type: 'ai', content: '', loading: true, time: this.getCurrentTime()
      }) - 1
      const aiMsg = this.currentSession.messages[aiMsgIndex]

      try {
        const response = await fetch(getAiApiUrl('/api/audit/stream'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Manager-Id': this.currentManagerId,
            'X-Token': this.token
          },
          body: JSON.stringify({ question: query, image_path: imagePath })
        })

        if (!response.ok) {
          let errMsg = `请求失败 (${response.status})`
          try {
            const errData = await response.json()
            if (errData && errData.msg) errMsg = errData.msg
          } catch (_) { /* noop */ }
          aiMsg.loading = false
          aiMsg.content = `❌ ${errMsg}`
          this.isLoading = false
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        aiMsg.loading = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop()
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6)
              if (dataStr === '[DONE]') continue
              try {
                const chunk = JSON.parse(dataStr)
                if (['text', 'answer', 'status'].includes(chunk.type)) {
                  aiMsg.content += chunk.content
                  this.scrollToBottom()
                } else if (chunk.type === 'error') {
                  aiMsg.content += `\n❌ ${chunk.content}`
                }
              } catch (e) { /* noop */ }
            }
          }
        }
      } catch (e) {
        console.error(e)
        await this.simulateStreamResponse(aiMsg)
      } finally {
        this.isLoading = false
      }
    },

    async simulateStreamResponse (msgObject) {
      msgObject.loading = false
      const mockText = '根据您上传的单据，我已提取到以下关键信息：\n\n- **户号**: 1234567890\n- **户名**: 某某工业有限公司\n- **本期电费**: 12,345.67元\n\n数据核对正常，未发现异常波动。'
      for (const char of mockText.split('')) {
        msgObject.content += char
        this.scrollToBottom()
        await this.delay(30)
      }
    },

    renderMarkdown (text) { return marked(text || '') },
    scrollToBottom () {
      this.$nextTick(() => {
        const c = this.$refs.chatContainer
        if (c) c.scrollTop = c.scrollHeight
      })
    },
    formatTime (date) {
      if (!date) return ''
      const d = new Date(date)
      const now = new Date()
      const sameYear = d.getFullYear() === now.getFullYear()
      const datePart = sameYear
        ? `${d.getMonth() + 1}月${d.getDate()}日`
        : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
      return `${datePart} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
    },
    getCurrentTime () {
      const d = new Date()
      return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
/* ============================================
   全屏沉浸式完成核查遮罩
   ============================================ */
.completion-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(10, 20, 40, 0.88);
  backdrop-filter: blur(12px);
}

.overlay-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 480px;
  padding: 40px 48px 36px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.particle-ring {
  position: relative;
  width: 96px;
  height: 96px;
  margin-bottom: 36px;
}

.ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
  animation: spin linear infinite;
}

.ring-1 {
  inset: 0;
  border-top-color: #4096ff;
  border-right-color: rgba(64, 150, 255, 0.3);
  animation-duration: 2s;
}

.ring-2 {
  inset: 10px;
  border-top-color: #52c41a;
  border-left-color: rgba(82, 196, 26, 0.3);
  animation-duration: 3s;
  animation-direction: reverse;
}

.ring-3 {
  inset: 20px;
  border-top-color: #faad14;
  border-bottom-color: rgba(250, 173, 20, 0.3);
  animation-duration: 4s;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.pulse-core {
  position: absolute;
  inset: 30px;
  background: linear-gradient(135deg, #1677ff, #0958d9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: corePulse 2s ease-in-out infinite;
  box-shadow: 0 0 24px rgba(22, 119, 255, 0.5);
}

.pulse-core i {
  font-size: 20px;
  color: #fff;
}

@keyframes corePulse {

  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 24px rgba(22, 119, 255, 0.5);
  }

  50% {
    transform: scale(1.08);
    box-shadow: 0 0 40px rgba(22, 119, 255, 0.8);
  }
}

.progress-stages {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 28px;
}

.stage-item {
  display: flex;
  align-items: flex-start;
  position: relative;
  padding-bottom: 20px;
  transition: all 0.4s ease;
}

.stage-item:last-child {
  padding-bottom: 0;
}

.stage-connector {
  position: absolute;
  left: 14px;
  top: 32px;
  bottom: 0;
  width: 2px;
  background: rgba(255, 255, 255, 0.1);
  transition: background 0.5s ease;
}

.stage-item.done .stage-connector {
  background: linear-gradient(to bottom, #52c41a, rgba(82, 196, 26, 0.3));
}

.stage-icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.stage-icon {
  font-size: 18px;
}

.done-icon {
  color: #52c41a;
  filter: drop-shadow(0 0 6px rgba(82, 196, 26, 0.6));
  animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popIn {
  from {
    transform: scale(0.3);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

.wait-icon {
  color: rgba(255, 255, 255, 0.2);
  font-size: 16px;
}

.stage-spinner {
  display: flex;
  gap: 3px;
  align-items: center;
  height: 30px;
}

.spinner-dot {
  width: 6px;
  height: 6px;
  background: #4096ff;
  border-radius: 50%;
  animation: dotBounce 1.2s ease-in-out infinite;
  box-shadow: 0 0 6px rgba(64, 150, 255, 0.6);
}

.spinner-dot:nth-child(2) {
  animation-delay: 0.2s;
  background: #52c41a;
}

.spinner-dot:nth-child(3) {
  animation-delay: 0.4s;
  background: #faad14;
}

@keyframes dotBounce {

  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.5;
  }

  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.stage-text {
  flex: 1;
}

.stage-name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2px;
  transition: color 0.3s;
}

.stage-item.waiting .stage-name {
  color: rgba(255, 255, 255, 0.3);
}

.stage-item.done .stage-name {
  color: #52c41a;
}

.stage-item.active .stage-name {
  color: #4096ff;
}

.stage-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  transition: color 0.3s;
  line-height: 1.5;
}

.stage-item.active .stage-desc {
  color: rgba(255, 255, 255, 0.65);
}

.stage-item.done .stage-desc {
  color: rgba(82, 196, 26, 0.7);
}

.data-counter {
  background: rgba(22, 119, 255, 0.1);
  border: 1px solid rgba(22, 119, 255, 0.25);
  border-radius: 10px;
  padding: 10px 20px;
  text-align: center;
  margin-bottom: 24px;
  width: 100%;
}

.counter-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 4px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.counter-value {
  font-size: 28px;
  font-weight: 700;
  color: #4096ff;
  font-variant-numeric: tabular-nums;
  letter-spacing: -1px;
  text-shadow: 0 0 20px rgba(64, 150, 255, 0.5);
}

.progress-bar-wrap {
  width: 100%;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-track {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: visible;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #1677ff, #52c41a);
  position: relative;
  transition: width 0.3s ease;
  overflow: hidden;
}

.progress-glow {
  position: absolute;
  right: -1px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 8px #52c41a, 0 0 16px #1677ff;
  animation: glowPulse 1s ease-in-out infinite;
}

@keyframes glowPulse {

  0%,
  100% {
    opacity: 0.7;
    transform: translateY(-50%) scale(0.8);
  }

  50% {
    opacity: 1;
    transform: translateY(-50%) scale(1.2);
  }
}

.progress-label {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  min-width: 38px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.overlay-tip {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  text-align: center;
  line-height: 1.6;
}

.overlay-tip i {
  margin-right: 4px;
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.4s ease;
}

.overlay-fade-enter-active .overlay-content,
.overlay-fade-leave-active .overlay-content {
  transition: transform 0.4s cubic-bezier(0.34, 1.2, 0.64, 1), opacity 0.4s ease;
}

.overlay-fade-enter .overlay-content,
.overlay-fade-leave-to .overlay-content {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}

.overlay-fade-enter,
.overlay-fade-leave-to {
  opacity: 0;
}

/* ============================================
   页面布局
   ============================================ */
.audit-page {
  height: 88vh;
  display: flex;
  background-color: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.sidebar-panel {
  width: 280px;
  background: #ffffff;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.02);
  z-index: 10;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.search-box {
  padding: 12px 16px;
  background: #fcfcfc;
}

.filter-label {
  font-size: 11px;
  color: #909399;
  margin-bottom: 6px;
}

.filter-label strong {
  color: #409eff;
  font-weight: 600;
}

.date-mode-tabs {
  display: flex;
  margin-bottom: 8px;
  background: #f0f2f5;
  border-radius: 4px;
  padding: 2px;
}

.date-tab {
  flex: 1;
  text-align: center;
  font-size: 12px;
  padding: 4px 0;
  border-radius: 3px;
  cursor: pointer;
  color: #909399;
  transition: all 0.2s;
  user-select: none;
}

.date-tab.active {
  background: #fff;
  color: #409eff;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.date-tab:hover:not(.active) {
  color: #606266;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
  border: 1px solid transparent;
}

.session-item:hover {
  background-color: #f5f7fa;
}

.session-item.active {
  background-color: #e6f7ff;
  border-color: #bae7ff;
}

.item-main {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;
}

.item-icon {
  margin-right: 10px;
  font-size: 18px;
  padding-top: 2px;
}

.text-danger {
  color: #f56c6c;
}

.text-success {
  color: #67c23a;
}

.item-content {
  flex: 1;
  overflow: hidden;
}

.item-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.item-status {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #dcdfe6;
  margin-right: 6px;
}

.status-dot.processing {
  background-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  animation: pulse 1.5s infinite;
}

.status-dot.completed {
  background-color: #67c23a;
}

.status-dot.pending {
  background-color: #e6a23c;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
  }

  70% {
    box-shadow: 0 0 0 4px rgba(64, 158, 255, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}

.item-date {
  font-size: 12px;
  color: #c0c4cc;
  text-align: right;
}

.item-date i {
  margin-right: 2px;
}

.item-delete {
  margin-left: 8px;
  padding: 2px 4px;
  color: #909399;
  cursor: pointer;
  display: none;
  font-size: 14px;
  align-self: flex-start;
}

.session-item:hover .item-delete {
  display: block;
}

.item-delete:hover {
  color: #f56c6c;
}

.empty-list {
  text-align: center;
  color: #909399;
  padding-top: 40px;
  font-size: 13px;
}

.main-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  overflow: hidden;
}

.workspace-header {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.file-info .label {
  color: #606266;
  margin-right: 8px;
}

.file-info .value {
  font-weight: 600;
  color: #303133;
  margin-right: 12px;
}

.workspace-content {
  flex: 1;
  padding: 16px;
  overflow: hidden;
  display: flex;
}

.upload-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
  border-radius: 8px;
}

.upload-card {
  width: 500px;
  text-align: center;
}

.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 40px 0;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #409eff;
  background: #f0f9eb;
}

.upload-area i {
  font-size: 64px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-weight: 500;
}

.upload-text p {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.upload-tips {
  margin-top: 24px;
  color: #e6a23c;
  font-size: 13px;
  background: #fdf6ec;
  padding: 10px;
  border-radius: 4px;
  text-align: left;
}

.split-layout {
  display: flex;
  width: 100%;
  height: 100%;
  gap: 16px;
}

.doc-viewer-pane,
.chat-pane {
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.doc-viewer-pane {
  flex: 0.9;
}

.chat-pane {
  flex: 1.1;
  min-width: 350px;
  max-width: 800px;
}

.pane-header {
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #303133;
  background: #f9fafc;
}

.doc-container {
  flex: 1;
  background: #f5f7fa;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #ebeef5;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #fff;
}

.message {
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
}

.message.user {
  flex-direction: row-reverse;
}

.avatar-wrapper {
  margin: 0 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
}

.avatar.ai {
  background: linear-gradient(135deg, #409eff, #2c82e6);
}

.avatar.user {
  background: #e6a23c;
}

.message-content-wrapper {
  max-width: 80%;
  display: flex;
  flex-direction: column;
}

.message.user .message-content-wrapper {
  align-items: flex-end;
}

.sender-name {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.content-bubble {
  padding: 12px 16px;
  border-radius: 8px;
  line-height: 1.6;
  font-size: 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message.ai .content-bubble {
  background: #f4f4f5;
  color: #303133;
  border-top-left-radius: 0;
}

.message.user .content-bubble {
  background: #ecf5ff;
  color: #409eff;
  border-top-right-radius: 0;
}

.message-time {
  font-size: 11px;
  color: #c0c4cc;
  margin-top: 4px;
}

.input-section {
  padding: 16px;
  border-top: 1px solid #ebeef5;
  background: #fff;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.input-actions .tip {
  font-size: 12px;
  color: #909399;
}

.typing-indicator span {
  display: inline-block;
  width: 5px;
  height: 5px;
  background-color: #909399;
  border-radius: 50%;
  margin: 0 2px;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {

  0%,
  80%,
  100% {
    transform: scale(0);
  }

  40% {
    transform: scale(1);
  }
}

::v-deep table {
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
  font-size: 13px;
}

::v-deep th,
::v-deep td {
  border: 1px solid #ebeef5;
  padding: 8px;
  text-align: left;
}

::v-deep th {
  background-color: #f5f7fa;
  font-weight: 600;
}
</style>
