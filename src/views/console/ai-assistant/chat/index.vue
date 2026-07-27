<template>
  <div class="ai-chat-page" v-loading="pageLoading" element-loading-text="正在加载智能对话...">
    <!-- 左侧对话历史 - 简洁版 -->
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <div class="header-title">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>对话历史</span>
        </div>
        <button class="btn-new" @click="createNewChat" title="新建对话">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      <div class="chat-list">
        <div
          v-for="chat in chatHistory"
          :key="chat.id"
          :class="['chat-item', { active: chat.id === currentChatId }]"
          @click="switchChat(chat.id)"
        >
          <div class="chat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="chat-info">
            <div class="chat-title">{{ chat.title }}</div>
            <div class="chat-preview">{{ chat.preview }}</div>
            <div class="chat-time">{{ formatChatTime(chat.time) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧对话区域 - 保持不变 -->
    <div class="chat-main">
      <!-- 顶部 -->
      <div class="chat-header">
        <div class="header-left">
          <div class="avatar-wrapper">
            <img :src="require('@/assets/images/wyy-logo.png')" alt="AI" class="avatar-img">
          </div>
          <div class="header-info">
            <h2>{{ currentChat?.title || 'AI 智能助手' }}</h2>
            <p class="status">
              <span class="status-dot"></span>
              在线服务中
            </p>
          </div>
        </div>

        <div class="header-actions">
          <button class="btn-clear" @click="clearChat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            <span>清空对话</span>
          </button>
        </div>
      </div>

      <!-- 消息区域 -->
      <div class="message-container" ref="messageContainer">
        <!-- 欢迎页面 -->
        <div v-if="messages.length === 0" class="welcome-screen">
          <div class="welcome-icon">
            <img :src="require('@/assets/images/wyy-logo.png')" alt="AI Logo" class="welcome-img">
          </div>
          <h2>您好！我是 AI 智能助手</h2>
          <p>我可以帮您解答关于能源管理、设备控制等问题</p>

          <div class="quick-questions">
            <div
              v-for="(q, index) in quickQuestions"
              :key="index"
              class="quick-btn"
              @click="sendQuickQuestion(q)"
            >
              <svg class="icon-q" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>{{ q }}</span>
              <svg class="icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- 消息列表 -->
        <div v-else class="messages">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="['message-item', msg.type]"
          >
            <!-- AI 消息 -->
            <template v-if="msg.type === 'ai'">
              <div class="avatar ai-avatar">
                <img :src="require('@/assets/images/wyy-logo.png')" alt="AI" class="avatar-img-small">
              </div>
              <div class="message-content">
                <div v-if="msg.loading" class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div v-else class="message-text" v-html="formatContent(msg.content)"></div>
                <div v-if="!msg.loading" class="message-time">{{ formatTime(msg.time) }}</div>
              </div>
            </template>

            <!-- 用户消息 -->
            <template v-else>
              <div class="message-content user-content">
                <div v-if="msg.image" class="message-image" @click="showImagePreview(msg.image)">
                    <img :src="msg.image" alt="Uploaded Image">
                </div>
                <div v-if="msg.isPdf" class="message-file" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); padding: 8px; border-radius: 8px; margin-bottom: 4px;">
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24" color="#e74c3c">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                     </svg>
                     <span style="font-size: 13px;">{{ msg.fileName }}</span>
                </div>
                <div v-if="msg.content" class="message-text">{{ msg.content }}</div>
                <div class="message-time">{{ formatTime(msg.time) }}</div>
              </div>
              <div class="avatar user-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 输入框 -->
      <div class="input-container">
        <!-- 对话上限提示 -->
        <div v-if="isChatLimitReached || isDailyLimitReached" class="limit-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ isDailyLimitReached ? '今日已达提问上限（10条），请明天再试。' : '当前对话已达上限（10条），请新建对话窗继续提问。' }}</span>
        </div>

        <!-- 图片/文件预览区域 -->
        <div v-if="selectedFile" class="image-preview-container">
          <div class="image-preview-item">
            <div v-if="isPdfSelected" class="pdf-preview-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="40" height="40" color="#e74c3c">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span class="pdf-name" style="font-size: 12px; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ selectedFileName }}</span>
            </div>
            <img v-else :src="selectedFilePreview" alt="Preview">

            <button class="btn-remove-file" @click="removeFile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="input-wrapper">
          <!-- 隐藏的文件输入 -->
          <input
            type="file"
            ref="fileInput"
            accept="image/*,.pdf"
            style="display: none"
            @change="handleFileSelect"
          >

          <!-- 上传按钮 -->
          <button class="btn-upload" @click="triggerFileUpload" title="上传图片或PDF">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>

          <textarea
            v-model="inputMessage"
            :rows="1"
            :placeholder="isDailyLimitReached ? '今日已达提问上限，请明天再试。' : (isChatLimitReached ? '当前对话达上限，请新建对话窗。' : '输入您的问题...')"
            :disabled="isLoading || isStreaming || isChatLimitReached || isDailyLimitReached"
            @compositionstart="isComposing = true"
            @compositionend="onCompositionEnd"
            @keydown.enter.exact.prevent="handleEnter"
            @paste="handlePaste"
            @input="autoResize"
            ref="textarea"
          ></textarea>

          <button
            class="btn-send"
            :class="{ loading: isLoading || isStreaming, disabled: (!inputMessage.trim() && !selectedFile) || isChatLimitReached || isDailyLimitReached }"
            :disabled="isLoading || isStreaming || (!inputMessage.trim() && !selectedFile) || isChatLimitReached || isDailyLimitReached"
            @click="sendMessage"
          >
            <svg v-if="!isLoading && !isStreaming" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span v-else class="spinner"></span>
          </button>
        </div>

        <div class="input-hint">
          <span>按 Enter 发送，Shift + Enter 换行</span>
        </div>
      </div>
    </div>

    <!-- 全屏图片预览 Modal -->
    <div v-if="previewImageUrl" class="image-modal" @click="closeImagePreview">
      <div class="modal-content">
        <img :src="previewImageUrl" alt="Full Preview" @click.stop>
        <button class="btn-close-modal" @click="closeImagePreview">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { addUserSessionMsg, getUserSessionMsgList } from '@/api/verificationAi'
import store from '@/store'
import Cookies from 'js-cookie'
import { marked } from 'marked'
import moment from 'moment'
import { getAiApiUrl } from '@/utils/aiServiceConfig'
import { getSimpleTenantList } from '@/api/useReport'

export default {
  name: 'AIAssistantChat',
  data () {
    return {
      inputMessage: '',
      messages: [],
      isLoading: false,
      isStreaming: false, // Track streaming state
      isComposing: false, // Track IME composition state manually
      pageLoading: true, // 页面级 loading
      typingBuffer: '',
      typingTimer: null,
      typingTargetMsg: null,
      typingCharsPerFrame: 8,
      typingLastTs: 0,

      // File Upload
      selectedFile: null,
      selectedFilePreview: null,
      isPdfSelected: false,
      selectedFileName: '',
      uploadedFilePath: null,
      previewImageUrl: null,

      currentChatId: null,
      chatHistory: [],
      tenants: [],
      quickQuestions: [
        '有哪些租户？',
        '查询最近一周的用电情况',
        '查询租户余额',
        '最近30天的用水情况'
      ]
    }
  },
  computed: {
    currentChat () {
      return this.chatHistory.find(c => c.id === this.currentChatId)
    },
    userId () {
      return store.getters['user/userId']
    },
    currentManagerId () {
      return store.getters['manager/currentManagerId']
    },
    chatQuestionCount () {
      const list = Array.isArray(this.messages) ? this.messages : []
      return list.reduce((acc, m) => acc + (m && m.type === 'user' ? 1 : 0), 0)
    },
    todayQuestionCount () {
      const list = Array.isArray(this.chatHistory) ? this.chatHistory : []
      const start = moment().startOf('day')
      const end = moment().endOf('day')
      let count = 0
      for (let i = 0; i < list.length; i++) {
        const chat = list[i]
        const msgs = chat && Array.isArray(chat.messages) ? chat.messages : []
        for (let j = 0; j < msgs.length; j++) {
          const m = msgs[j]
          if (!m || m.type !== 'user') continue
          const t = m.time || m.createTime
          if (!t) continue
          const mt = moment(t)
          if (!mt.isValid()) continue
          if (mt.isBetween(start, end, null, '[]')) count++
        }
      }
      return count
    },
    isDailyLimitReached () {
      return this.todayQuestionCount >= 10
    },
    isChatLimitReached () {
      return this.chatQuestionCount >= 10
    }
  },
  mounted () {
    this.loadSessions()
  },
  activated () {
    this.scrollToBottom()
  },
  watch: {
    userId: {
      handler () {
        this.loadSessions()
      }
    },
    currentManagerId: {
      handler () {
        this.loadSessions()
      }
    }
  },

  // 🔥 清理，防止内存泄漏
  beforeDestroy () {
    if (this.typingTimer) {
      cancelAnimationFrame(this.typingTimer)
      this.typingTimer = null
    }
    this.typingTargetMsg = null
    this.typingBuffer = ''
    this.typingLastTs = 0
    // 清空引用
    this.messages = null
    this.chatHistory = null
  },

  methods: {
    enqueueTyping (targetMsg, text) {
      if (!targetMsg || !text) return
      if (this.typingTargetMsg && this.typingTargetMsg !== targetMsg) {
        this.typingTargetMsg = targetMsg
        this.typingBuffer = ''
        this.typingLastTs = 0
        if (this.typingTimer) {
          cancelAnimationFrame(this.typingTimer)
          this.typingTimer = null
        }
      }
      this.typingTargetMsg = targetMsg
      this.typingBuffer += text
      if (!this.typingTimer) {
        this.typingTimer = requestAnimationFrame(this.flushTyping)
      }
    },
    flushTyping () {
      this.typingTimer = null
      const target = this.typingTargetMsg
      if (!target) {
        this.typingBuffer = ''
        this.typingLastTs = 0
        return
      }
      if (!this.typingBuffer) return

      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
      const dt = this.typingLastTs ? (now - this.typingLastTs) : 16
      this.typingLastTs = now

      const base = Math.max(1, Number(this.typingCharsPerFrame) || 8)
      const len = this.typingBuffer.length
      let n = base
      if (len > 5000) n = Math.max(n, 160)
      else if (len > 2000) n = Math.max(n, 64)
      else if (len > 800) n = Math.max(n, 32)
      else if (len > 300) n = Math.max(n, 16)

      if (dt > 40) n = n * 2
      n = Math.min(240, n)

      const chunk = this.typingBuffer.slice(0, n)
      this.typingBuffer = this.typingBuffer.slice(n)
      target.content += chunk
      this.$nextTick(() => this.scrollToBottom())

      if (this.typingBuffer) {
        this.typingTimer = requestAnimationFrame(this.flushTyping)
      }
    },
    async loadTenants (managerId) {
      if (!managerId) {
        this.tenants = []
        this.quickQuestions = [
          '有哪些租户？',
          '第一个租户绑定了哪些电表？',
          '第二个租户近七天用电',
          '第一个租户近七天用水'
        ]
        return
      }
      try {
        const res = await getSimpleTenantList({ managerId, tenantStatus: 0 }).catch(() => ({}))
        if (res && res.code === 200 && Array.isArray(res.data)) {
          this.tenants = res.data
        } else {
          this.tenants = []
        }
      } catch (e) {
        this.tenants = []
      } finally {
        const firstName = (this.tenants && this.tenants[0] && (this.tenants[0].name || this.tenants[0].tenantName)) || ''
        const secondName = (this.tenants && this.tenants[1] && (this.tenants[1].name || this.tenants[1].tenantName)) || firstName
        this.quickQuestions = [
          '有哪些租户？',
          `${firstName || '第一个租户'}绑定了哪些电表？`,
          `${secondName || '第二个租户'}近七天用电`,
          `${firstName || '第一个租户'}近七天用水`
        ]
      }
    },
    // --- File Handling ---
    triggerFileUpload () {
      this.$refs.fileInput.click()
    },

    handleFileSelect (event) {
      const file = event.target.files[0]
      if (file) this.processFile(file)
      event.target.value = ''
    },

    handlePaste (event) {
      const items = (event.clipboardData || event.originalEvent.clipboardData).items
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile()
          this.processFile(file)
        }
      }
    },

    processFile (file) {
      const isImage = file.type.startsWith('image/')
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

      if (!isImage && !isPdf) {
        alert('请上传图片或PDF文件')
        return
      }
      if (file.size > 10 * 1024 * 1024) { // Increase limit for PDF
        alert('文件大小不能超过 10MB')
        return
      }

      this.selectedFile = file
      this.selectedFileName = file.name

      if (isPdf) {
        this.isPdfSelected = true
        this.selectedFilePreview = null
      } else {
        this.isPdfSelected = false
        const reader = new FileReader()
        reader.onload = (e) => {
          this.selectedFilePreview = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },

    removeFile () {
      this.selectedFile = null
      this.selectedFilePreview = null
      this.isPdfSelected = false
      this.selectedFileName = ''
      this.uploadedFilePath = null
    },

    async uploadFileToServer () {
      if (!this.selectedFile) return null
      const formData = new FormData()
      formData.append('file', this.selectedFile)
      try {
        const res = await fetch(getAiApiUrl('/api/upload'), { method: 'POST', body: formData })
        const data = await res.json()
        return data.file_path || null
      } catch (e) {
        console.error('Upload error:', e)
        return null
      }
    },

    autoResize () {
      const textarea = this.$refs.textarea
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
      }
    },

    createNewChat () {
      if (this.isDailyLimitReached) {
        this.$message.warning('今日智能对话已达到上限（10条），系统会在明日自动重置，请明天再试。')
        return
      }
      const newChat = {
        id: Date.now(),
        title: '新对话',
        preview: '开始新的对话...',
        messages: [],
        time: new Date()
      }
      this.chatHistory.unshift(newChat)

      // 🔥 限制历史记录，防止内存溢出
      if (this.chatHistory.length > 20) {
        this.chatHistory = this.chatHistory.slice(0, 20)
      }

      this.currentChatId = newChat.id
      this.messages = []
    },

    async loadSessions () {
      this.pageLoading = true
      try {
        let userId = store.getters['user/userId']
        const managerId = store.getters['manager/currentManagerId']
        if (!userId) {
          try {
            await this.$store.dispatch('user/getUserInfo')
            userId = store.getters['user/userId']
          } catch (e) {}
        }
        if (!userId || !managerId) {
          if (!this.chatHistory.length) {
            this.createNewChat()
          }
          this.pageLoading = false
          return
        }
        const params = {
          userId,
          managerId,
          type: 1,
          beginTime: moment().startOf('month').format('YYYY-MM-DD HH:mm:ss'),
          endTime: moment().endOf('month').format('YYYY-MM-DD HH:mm:ss')
        }
        const res = await getUserSessionMsgList(params)
        if (res.code === 200 && Array.isArray(res.data)) {
          const list = res.data.map(dto => ({
            id: dto.sessionId || String(dto.id),
            title: dto.fileName || '对话',
            preview: (dto.chatHistory && dto.chatHistory.length) ? (dto.chatHistory[dto.chatHistory.length - 1].content || '') : '',
            messages: dto.chatHistory || [],
            time: dto.createTime
          }))
          this.chatHistory = list
          if (list.length) {
            this.currentChatId = list[0].id
            this.messages = [...list[0].messages]
          } else {
            this.createNewChat()
          }
        } else {
          this.createNewChat()
        }
      } catch (e) {
        this.createNewChat()
      } finally {
        const managerId = store.getters['manager/currentManagerId']
        await this.loadTenants(managerId)
        this.pageLoading = false
        this.scrollToBottom()
      }
    },

    switchChat (chatId) {
      this.currentChatId = chatId
      const chat = this.chatHistory.find(c => c.id === chatId)

      // 🔥 浅拷贝即可，避免深拷贝性能问题
      this.messages = chat ? [...chat.messages] : []

      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },

    onCompositionEnd (e) {
      this.isComposing = false
      // Note: We do NOT trigger send here automatically to avoid accidental sends.
      // User must press Enter explicitly after composition ends.
    },

    handleEnter (e) {
      // Robust check for IME composition
      if (this.isComposing || e.isComposing) return
      this.sendMessage()
    },

    async sendMessage () {
      // 🔥 获取当前管理方 ID
      const managerId = store.getters['manager/currentManagerId']
      // 🔥 获取 Token
      const token = Cookies.get('Admin-Token') || store.getters.token

      if (this.isLoading) return

      if (this.isDailyLimitReached) {
        this.$message.warning('今日智能对话已达到上限（10条），请明天再试。')
        return
      }

      if (this.isChatLimitReached) {
        this.$message.warning('当前对话达上限，请新建对话窗。')
        return
      }

      if (!managerId) {
        this.messages.push({ type: 'ai', content: '**错误**: 未选择管理方，请先选择管理方', time: new Date() })
        return
      }
      if (!token) {
        this.messages.push({ type: 'ai', content: '**错误**: 未登录，请先登录', time: new Date() })
        return
      }

      const question = this.inputMessage.trim()
      // 如果没有文字且没有文件，则不发送
      if (!question && !this.selectedFile) return

      // 添加用户消息
      const userMsg = {
        type: 'user',
        content: question,
        time: new Date()
      }

      // 如果有图片预览，添加到消息中显示 (Optimistic UI)
      if (this.selectedFilePreview) {
        userMsg.image = this.selectedFilePreview
      } else if (this.isPdfSelected) {
        userMsg.isPdf = true
        userMsg.fileName = this.selectedFileName
      }

      this.messages.push(userMsg)

      // 更新对话历史
      if (this.currentChat) {
        this.currentChat.messages = this.messages
        if (this.currentChat.messages.length === 1) {
          const titleText = question || '[图片消息]'
          this.currentChat.title = titleText.slice(0, 20) + (titleText.length > 20 ? '...' : '')
          this.currentChat.preview = titleText.slice(0, 30) + (titleText.length > 30 ? '...' : '')
        }
      }

      // 暂存并清理输入状态，防止重复发送
      const currentFile = this.selectedFile
      this.inputMessage = ''
      this.removeFile() // 清除预览和选中状态

      if (this.$refs.textarea) {
        this.$refs.textarea.style.height = 'auto'
      }
      this.isLoading = true

      this.$nextTick(() => {
        this.scrollToBottom()
      })

      // 创建 AI 消息占位 (Immediately with loading state)
      const aiMsg = {
        type: 'ai',
        content: '',
        loading: true, // Start with loading state
        time: new Date()
      }
      this.messages.push(aiMsg)

      try {
        // 1. 如果有图片，先上传
        let uploadedPath = null
        if (currentFile) {
          // 这里我们需要临时恢复 selectedFile 以供 uploadFileToServer 使用，或者重构 uploadFileToServer
          // 为了简单，我们临时手动构建 FormData 或者直接在这里上传
          const formData = new FormData()
          formData.append('file', currentFile)

          try {
            const res = await fetch(getAiApiUrl('/api/upload'), { method: 'POST', body: formData })
            if (!res.ok) throw new Error('Upload failed')
            const data = await res.json()
            uploadedPath = data.file_path
          } catch (e) {
            console.error('Upload error:', e)
            aiMsg.content = '**错误**: 图片上传失败'
            aiMsg.loading = false
            this.isLoading = false
            return
          }
        }

        // 2. 发送聊天请求
        const response = await fetch(getAiApiUrl('/api/chat/stream'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Manager-Id': String(managerId),
            'X-Token': token
          },
          body: JSON.stringify({
            question: question || (uploadedPath ? '请分析这张图片' : ''), // 如果只有图片没有文字，给个默认提示
            image_path: uploadedPath
          })
        })

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let doneReceived = false

        while (!doneReceived) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          const events = buffer.split(/\r?\n\r?\n/)
          buffer = events.pop()

          for (const evt of events) {
            const lines = evt.split(/\r?\n/)
            let dataPayload = ''

            for (const l of lines) {
              if (l.startsWith('data:')) {
                dataPayload += l.slice(5).replace(/^\s*/, '')
              }
            }

            if (!dataPayload) continue
            if (dataPayload === '[DONE]') {
              doneReceived = true
              break
            }

            try {
              const data = JSON.parse(dataPayload)

              if (data.type === 'text') {
                this.enqueueTyping(aiMsg, data.content)
                if (aiMsg.loading) {
                  aiMsg.loading = false
                  this.isLoading = false
                  this.isStreaming = true
                }
              } else if (data.type === 'status') {
                if (aiMsg.loading) {
                  aiMsg.content = data.content
                  aiMsg.loading = false
                  this.isLoading = false
                  this.isStreaming = true
                }
              } else if (data.type === 'error') {
                aiMsg.content += `\n**错误**: ${data.content}`
                if (aiMsg.loading) {
                  aiMsg.loading = false
                  this.isLoading = false
                  this.isStreaming = true
                }
              }

              await this.$nextTick()
              this.scrollToBottom()
              await new Promise(resolve => requestAnimationFrame(resolve))
            } catch (e) {
              console.error('Parse Error:', e, dataPayload)
            }
          }
        }
      } catch (error) {
        console.error('AI 请求失败:', error)
        aiMsg.loading = false // Ensure loading stops on error
        aiMsg.content += '\n\n(请求失败，请检查网络或后端服务)'
        aiMsg.error = true
      } finally {
        // Safety net: ensure message doesn't get stuck in loading state
        if (aiMsg.loading) {
          aiMsg.loading = false
        }

        this.isLoading = false
        this.isStreaming = false
        await this.saveSessionAfterReply()
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },

    async saveSessionAfterReply () {
      try {
        const userId = store.getters['user/userId']
        const managerId = store.getters['manager/currentManagerId']
        if (!userId || !managerId) return
        const current = this.currentChat || { id: this.currentChatId, time: new Date(), title: '', messages: [] }
        const payload = {
          sessionId: String(current.id),
          userId,
          managerId,
          createTime: moment(current.time || new Date()).format('YYYY-MM-DD HH:mm:ss'),
          finishTime: moment().format('YYYY-MM-DD HH:mm:ss'),
          status: 1,
          type: 1,
          fileName: current.title || '',
          filePath: '',
          keyData: {},
          chatHistory: (this.messages || []).map(m => ({
            type: m.type,
            content: m.content,
            time: m.time
          }))
        }
        await addUserSessionMsg(payload)
      } catch (e) {}
    },

    sendQuickQuestion (question) {
      this.inputMessage = question
      this.sendMessage()
    },

    clearChat () {
      this.$confirm('确定清空当前对话吗？', '提示', {
        type: 'warning'
      }).then(() => {
        // 🔥 清空数组，释放内存
        this.messages.splice(0, this.messages.length)

        if (this.currentChat) {
          this.currentChat.messages = this.messages
          this.currentChat.preview = '对话已清空'
        }
      }).catch(() => {})
    },

    scrollToBottom () {
      this.$nextTick(() => {
        const container = this.$refs.messageContainer
        if (!container) return
        const toBottom = () => { container.scrollTop = container.scrollHeight }
        toBottom()
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(toBottom)
        setTimeout(toBottom, 0)
      })
    },

    formatContent (content) {
      if (!content) return ''
      try {
        return marked.parse(content)
      } catch (e) {
        console.error('Markdown parse error:', e)
        return content
      }
    },

    formatTime (date) {
      if (!date) return ''
      const msgTime = new Date(date)
      return msgTime.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatChatTime (date) {
      if (!date) return ''
      const now = new Date()
      const chatTime = new Date(date)
      const diff = now - chatTime

      if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`
      } else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`
      } else {
        return chatTime.toLocaleDateString('zh-CN', {
          month: '2-digit',
          day: '2-digit'
        })
      }
    },

    showImagePreview (url) {
      this.previewImageUrl = url
    },

    closeImagePreview () {
      this.previewImageUrl = null
    }
  }
}
</script>

<style scoped lang="scss">
// 🔥 优化后的 Design Tokens
$bg-primary: #ffffff;
$bg-sidebar: #fafbfc; // 🔥 更柔和的侧边栏背景
$bg-tertiary: #f1f5f9;
$accent: #2563eb;
$accent-light: #3b82f6;
$text-primary: #18181b;
$text-secondary: #52525b;
$text-tertiary: #a1a1aa;
$border: #e4e4e7;
$border-light: #f4f4f5;
$success: #22c55e;

// Main Layout
.ai-chat-page {
  display: flex;
  height: calc(100vh - 100px);
  background: $bg-primary;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

// 🔥 优化后的左侧边栏 - 更柔和的背景色
.chat-sidebar {
  width: 280px;
  background: $bg-sidebar; // 🔥 使用新的背景色
  border-right: 1px solid $border;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  box-shadow: 2px 0 8px rgba(0,0,0,0.02);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(0,0,0,0.04);
  background: $bg-sidebar; // 🔥 使用新的背景色

  .header-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;

    .icon {
      width: 18px;
      height: 18px;
      color: $accent;
    }
  }

  .btn-new {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: $text-secondary;
    cursor: pointer;
    transition: all 0.2s ease;

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover {
      background: $accent;
      color: white;
    }
  }
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: $border;
    border-radius: 2px;
  }
}

.chat-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 6px;
  border: 1px solid transparent;

  &:hover {
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  &.active {
    background: #ffffff;
    border-color: rgba($accent, 0.2);
    box-shadow: 0 2px 12px rgba($accent, 0.08);

    .chat-icon {
      background: $accent;
      color: white;
      transform: scale(1.05);
    }

    .chat-title {
      color: $accent;
      font-weight: 600;
    }
  }

  .chat-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(0,0,0,0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    svg {
      width: 18px;
      height: 18px;
    }
  }

  .chat-info {
    flex: 1;
    min-width: 0;

    .chat-title {
      font-size: 13px;
      font-weight: 400;
      color: $text-secondary;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }

    .chat-preview {
      font-size: 12px;
      color: $text-tertiary;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }

    .chat-time {
      font-size: 11px;
      color: $text-tertiary;
    }
  }
}

// 右侧样式保持不变
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: $bg-primary;
  min-width: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  background: $bg-primary;
  border-bottom: 1px solid $border;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 14px;

    .avatar-wrapper {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border-radius: 50%;

      .avatar-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .header-info {
      h2 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: $text-primary;
      }

      .status {
        margin: 2px 0 0;
        font-size: 12px;
        color: $text-secondary;
        display: flex;
        align-items: center;
        gap: 6px;

        .status-dot {
          width: 6px;
          height: 6px;
          background: $success;
          border-radius: 50%;
        }
      }
    }
  }

  .header-actions {
    .btn-clear {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: $text-tertiary;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;

      svg {
        width: 14px;
        height: 14px;
      }

      &:hover {
        color: #dc2626;
        background: rgba(#dc2626, 0.06);
      }
    }
  }
}

.message-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: $border;
    border-radius: 3px;
  }
}

.welcome-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;

  .welcome-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    border-radius: 50%;
    box-shadow: 0 8px 24px rgba($accent, 0.12);
    border: 1px solid rgba($accent, 0.1);

    .welcome-img {
      width: 60%;
      height: 60%;
      object-fit: contain;
    }
  }

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: $text-primary;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: $text-secondary;
    margin: 0 0 32px;
  }

  .quick-questions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    width: 100%;
    max-width: 520px;

    .quick-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: $bg-primary;
      border: 1px solid $border;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;

      .icon-q {
        width: 16px;
        height: 16px;
        color: $accent;
        flex-shrink: 0;
      }

      span {
        flex: 1;
        font-size: 13px;
        color: $text-primary;
        text-align: left;
      }

      .icon-arrow {
        width: 14px;
        height: 14px;
        color: $text-tertiary;
        opacity: 0;
        transform: translateX(-4px);
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      &:hover {
        border-color: $accent;
        background: rgba($accent, 0.03);

        .icon-arrow {
          opacity: 1;
          transform: translateX(0);
          color: $accent;
        }
      }
    }
  }
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.message-item {
  display: flex;
  gap: 12px;
  animation: slideIn 0.3s ease-out;

  &.ai {
    justify-content: flex-start;
  }

  &.user {
    justify-content: flex-end;
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.ai-avatar {
      background: transparent;
      border: none;

      .avatar-img-small {
        width: 80%;
        height: 80%;
        object-fit: contain;
      }
    }

    &.user-avatar {
      background: $bg-tertiary;
      border: 1px solid $border;

      svg {
        width: 18px;
        height: 18px;
        color: $text-secondary;
      }
    }
  }

  .message-content {
      max-width: 70%;
      padding: 14px 18px;
      border-radius: 14px;

      .message-image {
        margin-bottom: 8px;
        cursor: pointer;

        img {
            max-width: 200px;
            max-height: 200px;
            border-radius: 8px;
            object-fit: cover;
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.2s;

            &:hover {
                transform: scale(1.02);
            }
        }
      }

      &:not(.user-content) {
        background: $bg-sidebar; // 🔥 使用新的背景色
        border: 1px solid $border-light;
        border-radius: 14px 14px 14px 4px;
      }

    &.user-content {
      background: $accent;
      border-radius: 14px 14px 4px 14px;

      .message-text {
        color: white;
      }

      .message-time {
        color: rgba(255, 255, 255, 0.6);
      }
    }

    .message-text {
      font-size: 14px;
      line-height: 1.6;
      color: $text-primary;
      word-wrap: break-word;

      ::v-deep strong {
        font-weight: 600;
        color: $accent;
      }

      ::v-deep .highlight-number {
        color: $accent;
        font-weight: 600;
        font-family: 'SF Mono', Monaco, monospace;
        background: rgba($accent, 0.08);
        padding: 2px 6px;
        border-radius: 4px;
      }

      /* Markdown Styles */
      ::v-deep p {
        margin: 0.5em 0;
        &:first-child { margin-top: 0; }
        &:last-child { margin-bottom: 0; }
      }

      ::v-deep ul, ::v-deep ol {
        margin: 0.5em 0;
        padding-left: 1.5em;
      }

      ::v-deep li {
        margin: 0.2em 0;
      }

      ::v-deep pre {
        background: #f4f4f5;
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 0.8em 0;
        border: 1px solid $border-light;
      }

      ::v-deep code {
        font-family: 'SF Mono', Monaco, Consolas, monospace;
        background: rgba(0,0,0,0.06);
        padding: 2px 4px;
        border-radius: 4px;
        font-size: 0.9em;
        color: #d63384;
      }

      ::v-deep pre code {
        background: transparent;
        padding: 0;
        color: inherit;
        font-size: 0.85em;
      }

      ::v-deep table {
        border-collapse: collapse;
        width: 100%;
        margin: 0.8em 0;
        font-size: 0.9em;
      }

      ::v-deep th, ::v-deep td {
        border: 1px solid $border;
        padding: 8px 12px;
        text-align: left;
      }

      ::v-deep th {
        background: $bg-tertiary;
        font-weight: 600;
      }

      ::v-deep blockquote {
        margin: 0.8em 0;
        padding-left: 12px;
        border-left: 3px solid $accent;
        color: $text-secondary;
      }
    }

    .message-time {
      margin-top: 6px;
      font-size: 11px;
      color: $text-tertiary;
      text-align: right;
    }
  }

  .typing-indicator {
    display: flex;
    gap: 5px;
    padding: 4px 0;

    span {
      width: 7px;
      height: 7px;
      background: $accent;
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out;

      &:nth-child(2) {
        animation-delay: 0.2s;
      }

      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
}

.input-container {
  padding: 16px 24px;
  background: $bg-primary;
  border-top: 1px solid $border;
  flex-shrink: 0;

  .limit-warning {
    max-width: 800px;
    margin: 0 auto 12px;
    padding: 10px 16px;
    background-color: rgba(255, 149, 0, 0.1);
    border: 1px solid rgba(255, 149, 0, 0.2);
    border-radius: 8px;
    color: #e6a23c;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: fadeIn 0.3s ease;

    svg {
      flex-shrink: 0;
    }
  }

  .input-wrapper {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    max-width: 800px;
    margin: 0 auto;

    textarea {
      flex: 1;
      min-height: 44px;
      max-height: 120px;
      padding: 12px 16px;
      border-radius: 10px;
      border: 1px solid $border;
      background: $bg-sidebar; // 🔥 使用新的背景色
      color: $text-primary;
      font-size: 14px;
      line-height: 1.5;
      resize: none;
      font-family: inherit;

      &::placeholder {
        color: $text-tertiary;
      }

      &:focus {
        outline: none;
        border-color: $accent;
        box-shadow: 0 0 0 3px rgba($accent, 0.1);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .btn-send {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      border: none;
      background: $accent;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;

      svg {
        width: 18px;
        height: 18px;
      }

      &:hover:not(.disabled) {
        background: $accent-light;
      }

      &.disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background: $text-tertiary;
      }

      &.loading {
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      }
    }
  }

  .input-hint {
    text-align: center;
    font-size: 12px;
    color: $text-tertiary;
    margin-top: 8px;
  }
}

// Fullscreen Modal Styles
.image-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(5px);
    animation: fadeIn 0.2s ease;

    .modal-content {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;

        img {
            max-width: 100%;
            max-height: 90vh;
            border-radius: 8px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.2);
        }

        .btn-close-modal {
            position: absolute;
            top: -40px;
            right: -40px;
            background: rgba(255,255,255,0.1);
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: white;
            transition: all 0.2s;

            &:hover {
                background: rgba(255,255,255,0.2);
                transform: rotate(90deg);
            }

            svg {
                width: 24px;
                height: 24px;
            }
        }
    }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-upload {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid $border;
  background: $bg-sidebar;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    color: $accent;
    border-color: $accent;
    background: rgba($accent, 0.05);
  }
}

.image-preview-container {
  max-width: 800px;
  margin: 0 auto 12px;
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px;

  .image-preview-item {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 8px;
    border: 1px solid $border;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .btn-remove-file {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;

      svg {
        width: 12px;
        height: 12px;
      }

      &:hover {
        background: rgba(0, 0, 0, 0.8);
      }
    }
  }
}
</style>

<style>
/* Global Reset for Full Screen App */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>
