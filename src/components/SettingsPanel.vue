<template>
  <div class="settings-panel">
    <!-- 设置按钮 -->
    <div class="settings-trigger" @click="visible = true">
      <div class="trigger-icon">
        <i class="el-icon-setting"></i>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <el-dialog
      :visible.sync="visible"
      width="420px"
      :before-close="handleClose"
      :show-close="false"
      custom-class="modern-settings-dialog"
    >
      <div class="dialog-wrapper">
        <!-- 头部 -->
        <div class="dialog-header">
          <div class="header-content">
            <div class="header-icon">
              <i class="el-icon-setting"></i>
            </div>
            <div class="header-text">
              <h3 class="dialog-title">个性化设置</h3>
              <p class="dialog-subtitle">自定义您的使用体验</p>
            </div>
          </div>
          <button class="close-btn" @click="visible = false">
            <i class="el-icon-close"></i>
          </button>
        </div>

        <!-- 设置内容 -->
        <div class="dialog-body">
          <!-- 字体大小设置 -->
          <div class="setting-card">
            <div class="card-header">
              <div class="card-icon font-icon">Aa</div>
              <div class="card-info">
                <h4 class="card-title">字体大小</h4>
                <p class="card-desc">调整文字显示大小</p>
              </div>
            </div>
            <div class="card-content">
              <div class="size-selector">
                <div 
                  v-for="size in fontSizes"
                  :key="size.value"
                  :class="['size-option', { active: previewFontSize === size.value }]"
                  @click="selectFontSize(size.value)"
                >
                  <div class="size-circle">
                    <span class="size-text" :style="{ fontSize: size.demo }">A</span>
                  </div>
                  <span class="size-label">{{ size.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 主题设置 -->
          <div class="setting-card">
            <div class="card-header">
              <div class="card-icon theme-icon">
                <i class="el-icon-picture"></i>
              </div>
              <div class="card-info">
                <h4 class="card-title">外观主题</h4>
                <p class="card-desc">选择您喜欢的颜色风格</p>
              </div>
            </div>
            <div class="card-content">
              <div class="theme-grid">
                <div 
                  v-for="theme in themes"
                  :key="theme.value"
                  :class="['theme-card', { active: previewTheme === theme.value }]"
                  @click="selectTheme(theme.value)"
                >
                  <div class="theme-preview">
                    <div class="preview-header" :style="{ backgroundColor: theme.color }"></div>
                    <div class="preview-body">
                      <div class="preview-line"></div>
                      <div class="preview-line short"></div>
                    </div>
                  </div>
                  <div class="theme-info">
                    <h5 class="theme-name">{{ theme.name }}</h5>
                    <p class="theme-desc">{{ theme.desc }}</p>
                  </div>
                  <div class="theme-check" v-if="previewTheme === theme.value">
                    <i class="el-icon-check"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="dialog-footer">
          <button class="action-btn reset-btn" @click="resetSettings">
            <i class="el-icon-refresh-left"></i>
            重置默认
          </button>
          <div class="main-actions">
            <button class="action-btn cancel-btn" @click="visible = false">
              取消
            </button>
            <button class="action-btn apply-btn" @click="applyChanges">
              <i class="el-icon-check"></i>
              应用设置
            </button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ModernSettingsPanel',
  data() {
    return {
      visible: false,
      
      // 当前设置
      currentFontSize: localStorage.getItem('app_font_size') || 'medium',
      currentTheme: localStorage.getItem('app_theme') || 'teal',
      
      // 预览设置
      previewFontSize: localStorage.getItem('app_font_size') || 'medium',
      previewTheme: localStorage.getItem('app_theme') || 'teal',
      
      // 字体选项
      fontSizes: [
        { label: '紧凑', value: 'small', demo: '12px' },
        { label: '标准', value: 'medium', demo: '14px' },
        { label: '舒适', value: 'large', demo: '16px' }
      ],
      
      // 主题选项
      themes: [
        { 
          name: '清新青绿', 
          value: 'teal', 
          desc: '护眼自然', 
          color: '#26a69a',
          gradient: 'linear-gradient(135deg, #26a69a 0%, #4db6ac 100%)'
        },
        { 
          name: '商务灰白', 
          value: 'white', 
          desc: '专业质感', 
          color: '#3b82f6',
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
        },
        { 
          name: '深邃暗夜', 
          value: 'dark', 
          desc: '护眼暗黑', 
          color: '#6366f1',
          gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
        }
      ]
    }
  },
  
  methods: {
    // 选择字体大小
    selectFontSize(size) {
      this.previewFontSize = size
      this.previewChanges()
    },
    
    // 选择主题
    selectTheme(theme) {
      this.previewTheme = theme
      this.previewChanges()
    },
    
    // 应用设置到html元素
    applySettings(fontSize, theme) {
      const html = document.documentElement
      
      // 清理现有class
      html.className = html.className
        .replace(/\bfont-size-\w+\b/g, '')
        .replace(/\btheme-\w+\b/g, '')
        .trim()
      
      // 添加新的class
      html.classList.add(`font-size-${fontSize}`)
      html.classList.add(`theme-${theme}`)
    },
    
    // 预览更改
    previewChanges() {
      this.applySettings(this.previewFontSize, this.previewTheme)
    },
    
    // 应用更改
    applyChanges() {
      this.currentFontSize = this.previewFontSize
      this.currentTheme = this.previewTheme
      
      localStorage.setItem('app_font_size', this.currentFontSize)
      localStorage.setItem('app_theme', this.currentTheme)
      
      const themeName = this.themes.find(t => t.value === this.currentTheme).name
      
      this.$message.success(`已应用 ${themeName} 主题设置`)
      this.visible = false
    },
    
    // 取消更改
    cancelChanges() {
      this.previewFontSize = this.currentFontSize
      this.previewTheme = this.currentTheme
      this.applySettings(this.currentFontSize, this.currentTheme)
    },
    
    // 重置设置
    resetSettings() {
      this.previewFontSize = 'medium'
      this.previewTheme = 'teal'
      this.previewChanges()
      this.currentFontSize = 'medium'
      this.currentTheme = 'teal'
      localStorage.setItem('app_font_size', 'medium')
      localStorage.setItem('app_theme', 'teal')
      this.$message.success('已重置为默认设置')
    },
    
    handleClose(done) {
      if (this.previewFontSize !== this.currentFontSize || this.previewTheme !== this.currentTheme) {
        this.cancelChanges()
      }
      done()
    }
  },
  
  mounted() {
    this.applySettings(this.currentFontSize, this.currentTheme)
  },
  
  watch: {
    visible(newVal) {
      if (newVal) {
        // 打开时重置预览为当前设置
        this.previewFontSize = this.currentFontSize
        this.previewTheme = this.currentTheme
      }
    }
  }
}
</script>

<style scoped>
/* 设置触发按钮 */
.settings-trigger {
  position: fixed;
  right: 24px;
  bottom: 100px;
  z-index: 1000;
  cursor: pointer;
}

.trigger-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.trigger-icon::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.settings-trigger:hover .trigger-icon {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

.settings-trigger:hover .trigger-icon::before {
  opacity: 1;
}

.trigger-icon i {
  font-size: 20px;
  color: white;
  z-index: 1;
}

/* 对话框包装器 */
.dialog-wrapper {
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

/* 对话框头部 */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
}

.header-content {
  display: flex;
  align-items: center;
}

.header-icon {
  width: 36px;
  height: 36px;
  background: var(--primary-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: white;
}

.header-icon i {
  font-size: 16px;
}

.header-text {
  flex: 1;
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: var(--text-primary);
}

.dialog-subtitle {
  font-size: 12px;
  margin: 0;
  color: var(--text-secondary);
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--hover-bg);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

/* 对话框主体 */
.dialog-body {
  padding: 20px 24px;
  background: var(--card-bg);
}

/* 设置卡片 */
.setting-card {
  background: var(--bg-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  margin-bottom: 16px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.setting-card:hover {
  border-color: rgba(38, 166, 154, 0.3);
  box-shadow: 0 2px 8px rgba(38, 166, 154, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: var(--card-bg);
}

.card-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-weight: 600;
}

.font-icon {
  background: #ff6b6b;
  color: white;
  font-size: 14px;
}

.theme-icon {
  background: #4ecdc4;
  color: white;
  font-size: 12px;
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.card-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.card-content {
  padding: 16px;
}

/* 字体大小选择器 */
.size-selector {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.size-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.size-circle {
  width: 48px;
  height: 48px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  background: var(--card-bg);
  transition: all 0.2s ease;
}

.size-option.active .size-circle {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.size-option:hover .size-circle {
  border-color: var(--primary-color);
  transform: scale(1.05);
}

.size-text {
  font-weight: 600;
}

.size-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.size-option.active .size-label {
  color: var(--primary-color);
}

/* 主题网格 */
.theme-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.theme-card {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: var(--card-bg);
}

.theme-card:hover {
  border-color: var(--primary-color);
  background: var(--hover-bg);
}

.theme-card.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  background: linear-gradient(135deg, rgba(38, 166, 154, 0.1) 0%, rgba(38, 166, 154, 0.05) 100%);
}

.theme-preview {
  width: 40px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 12px;
  border: 1px solid rgba(0,0,0,0.1);
}

.preview-header {
  height: 12px;
}

.preview-body {
  padding: 4px;
  background: #f8f9fa;
}

.preview-line {
  height: 2px;
  background: #dee2e6;
  border-radius: 1px;
  margin-bottom: 2px;
}

.preview-line.short {
  width: 60%;
}

.theme-info {
  flex: 1;
}

.theme-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.theme-desc {
  font-size: 11px;
  color: var(--text-secondary);
  margin: 0;
}

.theme-check {
  width: 20px;
  height: 20px;
  background: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px 20px;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
}

.main-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 6px;
}

.reset-btn {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.reset-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.cancel-btn {
  background: var(--hover-bg);
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.cancel-btn:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.apply-btn {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.apply-btn:hover {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>