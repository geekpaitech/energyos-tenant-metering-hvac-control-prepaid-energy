<template>
  <div class="electricity-plan-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">服务费方案</h1>
        <p class="page-description">管理服务费计价方案，设置峰谷平尖时段电价</p>
      </div>
      
      <div class="header-actions">
        <button class="action-btn primary" @click="handleAdd">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3.5V12.5M3.5 8H12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          新增方案
        </button>
      </div>
    </div>

    <!-- 数据表格区域 -->
    <div class="table-container" v-loading="loading">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th class="th-id">方案ID</th>
              <th class="th-name">方案名称</th>
              <th class="th-price">尖电价<span class="unit">元/度</span></th>
              <th class="th-price">峰电价<span class="unit">元/度</span></th>
              <th class="th-price">平电价<span class="unit">元/度</span></th>
              <th class="th-price">谷电价<span class="unit">元/度</span></th>
              <th class="th-time">更新时间</th>
              <th class="th-status">状态</th>
              <th class="th-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in tableData" :key="item.id" class="table-row">
              <td class="td-id">#{{ item.id }}</td>
              <td class="td-name">{{ item.name }}</td>
              <td class="td-price price-peak">{{ formatPrice(item.powerPeakPrice) }}</td>
              <td class="td-price price-top">{{ formatPrice(item.powerTopPrice) }}</td>
              <td class="td-price price-flat">{{ formatPrice(item.powerFlatPrice) }}</td>
              <td class="td-price price-valley">{{ formatPrice(item.powerValleyPrice) }}</td>
              <td class="td-time">{{ formatTime(item.updateTime) }}</td>
              <td class="td-status">
                <div class="status-switch" @click="handleStatusChange(item)">
                  <div class="switch-track" :class="{ active: item.enableStatus === 1 }">
                    <div class="switch-thumb"></div>
                  </div>
                  <span class="status-text">{{ item.enableStatus === 1 ? '启用' : '禁用' }}</span>
                </div>
              </td>
              <td class="td-actions">
                <div class="action-group">
                  <button class="action-link" @click="handleEdit(item)">调价</button>
                  <button class="action-link" @click="handleViewLog(item)">日志</button>
                  <button class="action-link" @click="handleBatchBind(item)">批量绑定</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="tableData.length === 0 && !loading" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M24 4L6 14V34L24 44L42 34V14L24 4Z" stroke="#E5E7EB" stroke-width="2"/>
            <path d="M24 22V44M24 22L6 14M24 22L42 14" stroke="#E5E7EB" stroke-width="2"/>
          </svg>
          <p>暂无电表方案数据</p>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="dialogVisible" class="modal-overlay" @click.self="closeDialog">
      <div class="modal-container">
        <div class="modal-header">
          <h2 class="modal-title">{{ isEdit ? '调整电价' : '新增方案' }}</h2>
          <button class="modal-close" @click="closeDialog">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">方案名称</label>
            <input 
              v-model="formData.name" 
              type="text" 
              class="form-input"
              placeholder="请输入方案名称"
              :disabled="isEdit"
            >
          </div>
          
          <div class="price-grid">
            <div class="form-group">
              <label class="form-label">
                <span class="price-dot peak"></span>
                尖电价
              </label>
              <div class="input-group">
                <input 
                  v-model="formData.powerPeakPrice" 
                  type="text" 
                  class="form-input"
                  placeholder="0.00"
                  @input="limitInput($event.target.value, 'powerPeakPrice')"
                >
                <span class="input-suffix">元/度</span>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">
                <span class="price-dot top"></span>
                峰电价
              </label>
              <div class="input-group">
                <input 
                  v-model="formData.powerTopPrice" 
                  type="text" 
                  class="form-input"
                  placeholder="0.00"
                  @input="limitInput($event.target.value, 'powerTopPrice')"
                >
                <span class="input-suffix">元/度</span>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">
                <span class="price-dot flat"></span>
                平电价
              </label>
              <div class="input-group">
                <input 
                  v-model="formData.powerFlatPrice" 
                  type="text" 
                  class="form-input"
                  placeholder="0.00"
                  @input="limitInput($event.target.value, 'powerFlatPrice')"
                >
                <span class="input-suffix">元/度</span>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">
                <span class="price-dot valley"></span>
                谷电价
              </label>
              <div class="input-group">
                <input 
                  v-model="formData.powerValleyPrice" 
                  type="text" 
                  class="form-input"
                  placeholder="0.00"
                  @input="limitInput($event.target.value, 'powerValleyPrice')"
                >
                <span class="input-suffix">元/度</span>
              </div>
            </div>
          </div>
          
          <!-- 修改时需要验证码 -->
          <div v-if="isEdit" class="verification-section">
            <div class="warning-text">
              注：修改方案会同时更改相应电表计费金额
            </div>
            
            <div class="form-group">
              <label class="form-label">绑定手机</label>
              <div class="phone-display">{{ codePhone }}</div>
            </div>
<!--             
            <div class="form-group">
              <label class="form-label">验证码</label>
              <div class="input-group">
                <input 
                  v-model="formData.code" 
                  type="text" 
                  class="form-input"
                  placeholder="请输入验证码"
                  maxlength="6"
                >
                <button 
                  class="code-btn" 
                  :disabled="countDown !== '发送验证码'"
                  @click="getAuthSendSmsCode"
                >
                  {{ countDown }}
                </button>
              </div>
            </div> -->
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeDialog">取消</button>
          <button class="btn-confirm" @click="handleSubmit">确定</button>
        </div>
      </div>
    </div>

    <!-- 批量绑定侧边栏 - 树形结构 -->
    <transition name="slide">
      <div v-if="bindDrawerVisible" class="drawer-overlay" @click.self="closeBind">
        <div class="drawer-container">
          <div class="drawer-header">
            <h2 class="drawer-title">批量绑定电表</h2>
            <button class="drawer-close" @click="closeBind">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          
          <div class="drawer-tabs">
            <button 
              class="tab-item" 
              :class="{ active: activeTab === 0 }"
              @click="switchTab(0)"
            >
              专用电表
            </button>
            <button 
              class="tab-item" 
              :class="{ active: activeTab === 1 }"
              @click="switchTab(1)"
            >
              公摊电表
            </button>
          </div>
          
          <div class="drawer-body">
            <div class="tree-search">
              <input 
                v-model="treeFilter" 
                type="text" 
                class="tree-search-input"
                placeholder="搜索电表名称"
              >
            </div>
            
            <div class="tree-container">
              <!-- 全选节点 -->
              <div class="tree-node root">
                <label class="tree-checkbox">
                  <input 
                    type="checkbox" 
                    :checked="checkAllStatus"
                    @change="handleCheckAll"
                  >
                  <span class="checkbox-icon"></span>
                  <span class="tree-label">全选</span>
                </label>
              </div>
              
              <!-- 树形结构 -->
              <div 
                v-for="group in filteredTreeData" 
                :key="group.id" 
                class="tree-group"
              >
                <!-- 父级节点 -->
                <div class="tree-node parent-node">
                  <div class="parent-row">
                    <!-- 展开按钮（只有公摊组才显示） -->
                    <span 
                      v-if="group.isGroup"
                      class="expand-btn" 
                      @click="toggleExpand(group.id)"
                    >
                      {{ group.expanded ? '▼' : '▶' }}
                    </span>
                    <span v-else class="expand-placeholder"></span>
                    
                    <!-- 复选框和标签 -->
                    <label class="tree-checkbox parent-checkbox">
                      <input 
                        type="checkbox" 
                        :checked="isGroupChecked(group)"
                        @change="handleGroupCheck(group, $event)"
                        :disabled="!group.isGroup && group.disabled"
                      >
                      <span class="checkbox-icon"></span>
                      <span class="tree-label parent-label">
                        {{ group.name }}
                        <span v-if="group.isGroup" class="group-type">(公摊组)</span>
                        <span v-if="!group.isGroup && group.disabled" class="bound-tag">已绑定</span>
                      </span>
                    </label>
                  </div>
                </div>
                
                <!-- 子级电表 - 只在公摊组展开时显示 -->
                <div v-if="group.isGroup && group.expanded" class="tree-children">
                  <div 
                    v-for="meter in group.children" 
                    :key="meter.meterId" 
                    class="tree-node child-node"
                    v-show="!treeFilter || meter.meterName.includes(treeFilter)"
                  >
                    <label class="tree-checkbox child-checkbox">
                      <span class="expand-placeholder"></span>
                      <input 
                        type="checkbox" 
                        :checked="selectedMeterIds.includes(meter.meterId)"
                        :disabled="meter.disabled"
                        @change="handleMeterCheck(meter)"
                      >
                      <span class="checkbox-icon"></span>
                      <span class="tree-label">{{ meter.meterName }}</span>
                      <span v-if="meter.disabled" class="bound-tag">已绑定</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <!-- 空状态 -->
              <div v-if="filteredTreeData.length === 0" class="empty-tree">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4L6 14V34L24 44L42 34V14L24 4Z" stroke="#E5E7EB" stroke-width="2"/>
                </svg>
                <p>{{ treeFilter ? '没有找到匹配的电表' : '暂无电表数据' }}</p>
              </div>
            </div>
          </div>
          
          <div class="drawer-footer">
            <div class="selected-info">
              已选择 {{ selectedMeterIds.length }} 个电表
            </div>
            <button class="btn-confirm" @click="handleBindSubmit">确认绑定</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 调价日志弹窗 -->
    <div v-if="logDialogVisible" class="modal-overlay" @click.self="closeLogDialog">
      <div class="modal-container large">
        <div class="modal-header">
          <h2 class="modal-title">调价日志</h2>
          <button class="modal-close" @click="closeLogDialog">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body" v-loading="logLoading">
          <div v-if="logList.length === 0 && !logLoading" class="empty-log">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L6 14V34L24 44L42 34V14L24 4Z" stroke="#E5E7EB" stroke-width="2"/>
            </svg>
            <p>暂无调价记录</p>
          </div>
          
          <div v-else class="log-list">
            <div v-for="(log, index) in logList" :key="index" class="log-item">
              <div class="log-time">{{ log.createTime }}</div>
              <div class="log-content">
                <div class="log-operator">方案名称：{{ log.operator }}</div>
                <div v-if="log.phone" class="log-phone">操作手机：{{ log.phone }}</div>
                <div class="log-changes">
                  <div class="change-item" v-if="log.peakChange">
                    <span class="change-label">尖电价：</span>
                    <span class="change-value">¥{{ log.oldPeakPrice }}</span>
                  </div>
                  <div class="change-item" v-if="log.topChange">
                    <span class="change-label">峰电价：</span>
                    <span class="change-value">¥{{ log.oldTopPrice }}</span>
                  </div>
                  <div class="change-item" v-if="log.flatChange">
                    <span class="change-label">平电价：</span>
                    <span class="change-value">¥{{ log.oldFlatPrice }}</span>
                  </div>
                  <div class="change-item" v-if="log.valleyChange">
                    <span class="change-label">谷电价：</span>
                    <span class="change-value">¥{{ log.oldValleyPrice }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { 
  meterPriceAdd,
  meterPriceChangeEnableStatus,
  meterPriceList,
  meterPriceUpdate,
  meterPriceQueryPriceMeterEdit,
  meterPriceQueryById,
  meterPriceBatchBindPriceMeter,
  meterPriceLogPageMeterPriceLog,
  authSendSmsCode,
  queryPriceLog 
} from '@/api/meterPrice'

export default {
  name: 'ElectricityPlan',
  data() {
    return {
      loading: false,
      tableData: [],
      
      // 编辑弹窗
      dialogVisible: false,
      isEdit: false,
      formData: {
        id: '',
        name: '',
        code: '1',
        phone: '',
        managerId: '',
        powerPeakPrice: '',
        powerTopPrice: '',
        powerFlatPrice: '',
        powerValleyPrice: '',
        priceType:2
      },
      
      // 验证码相关
      codePhone: '',
      countDown: '发送验证码',
      countDownTimer: null,
      
      // 批量绑定 - 树形结构（修改）
      bindDrawerVisible: false,
      activeTab: 0,
      treeFilter: '',
      selectedMeterIds: [],
      currentPriceId: null,
      treeData: [], // 树形结构数据
      rawMeterData: null, // 原始数据
      
      // 调价日志
      logDialogVisible: false,
      logList: [],
      logLoading: false,
      
      // 表单验证规则
      rules: {
        name: [
          { required: true, message: '方案名称不能为空', trigger: 'blur' }
        ],
        powerPeakPrice: [
          { required: true, message: '尖电价不能为空', trigger: 'blur' }
        ],
        powerTopPrice: [
          { required: true, message: '峰电价不能为空', trigger: 'blur' }
        ],
        powerFlatPrice: [
          { required: true, message: '平电价不能为空', trigger: 'blur' }
        ],
        powerValleyPrice: [
          { required: true, message: '谷电价不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    
    // 从 store 获取用户手机号
    userPhone() {
      return this.$store.state.user.phone || ''
    },
    
    // 手机号掩码显示
    maskedPhone() {
      if (!this.userPhone) return ''
      return this.userPhone.substr(0, 3) + '****' + this.userPhone.substr(7)
    },
    
    // 过滤后的树形数据（新增）
    filteredTreeData() {
      if (!this.treeFilter) {
        return this.treeData
      }
      
      return this.treeData.map(group => ({
        ...group,
        children: group.isGroup ? group.children.filter(meter => 
          meter.meterName.includes(this.treeFilter)
        ) : []
      })).filter(group => {
        if (group.isGroup) {
          return group.name.includes(this.treeFilter) || group.children.length > 0
        } else {
          return group.meterName.includes(this.treeFilter)
        }
      })
    },
    
    // 全选状态检查（修改）
    checkAllStatus() {
      const availableMeters = this.getAllAvailableMeters()
      if (availableMeters.length === 0) return false
      return availableMeters.every(m => this.selectedMeterIds.includes(m.meterId))
    }
  },
  
  watch: {
    currentManagerId: {
      handler(val) {
        if (val) {
          this.initData()
        }
      },
      immediate: true
    }
  },
  
  methods: {
    async initData() {
      this.loadData()
    },
    
    async loadData() {
      this.loading = true
      try {
        const { data } = await meterPriceList({
          managerId: this.currentManagerId,
          priceType: 2
        })
        console.log(JSON.stringify(data))
        this.tableData = data || []
      } catch (error) {
        this.$message.error('获取数据失败')
      } finally {
        this.loading = false
      }
    },
    
    formatPrice(price) {
      return price ? `¥${Number(price).toFixed(2)}` : '-'
    },
    
    formatTime(time) {
      if (!time) return '-'
      return time.replace('T', ' ').substring(0, 16)
    },
    
    handleAdd() {
      this.isEdit = false
      this.formData = {
        name: '',
        powerPeakPrice: '',
        powerTopPrice: '',
        powerFlatPrice: '',
        powerValleyPrice: '',
        managerId: this.currentManagerId,
        priceType: 2
      }
      this.dialogVisible = true
    },
    
    handleEdit(row) {
      this.isEdit = true
      this.formData = { 
        ...row,
        code: '1',
        phone: this.userPhone
      }
      this.codePhone = this.maskedPhone
      this.dialogVisible = true
    },
    
    limitInput(val, field) {
      // 限制输入小数点后4位
      const reg = /^\d+(\.\d{0,4})?$/
      if (val === '' || reg.test(val)) {
        this.formData[field] = val
      } else {
        const match = val.match(/^\d+(\.\d{0,4})?/)
        this.formData[field] = match ? match[0] : ''
      }
    },
    
    async getAuthSendSmsCode() {
      if (this.countDown !== '发送验证码') return
      
      try {
        const { msg } = await authSendSmsCode({
          phone: this.userPhone,
          eventType: 'METER_PRICE_MODIFY'
        })
        this.$message.success(msg || '验证码已发送')
        
        let seconds = 60
        this.countDownTimer = setInterval(() => {
          this.countDown = seconds
          if (seconds === 0) {
            clearInterval(this.countDownTimer)
            this.countDown = '发送验证码'
          } else {
            seconds--
          }
        }, 1000)
      } catch (error) {
        this.$message.error('发送验证码失败')
      }
    },
    
    validateForm() {
      const { powerPeakPrice, powerTopPrice, powerFlatPrice, powerValleyPrice, name } = this.formData
      
      if (!name) {
        this.$message.warning('请输入方案名称')
        return false
      }
      
      if (!powerPeakPrice || !powerTopPrice || !powerFlatPrice || !powerValleyPrice) {
        this.$message.warning('请填写完整的电价信息')
        return false
      }
      
      if (Number(powerPeakPrice) === 0 || Number(powerTopPrice) === 0 || 
          Number(powerFlatPrice) === 0 || Number(powerValleyPrice) === 0) {
        this.$message.warning('电价不可为0')
        return false
      }
      
      // if (this.isEdit && !this.formData.code) {
      //   this.$message.warning('请输入验证码')
      //   return false
      // }
      
      return true
    },
    
    async handleSubmit() {
      if (!this.validateForm()) return
      
      this.$confirm(
        `确认${this.isEdit ? '修改' : '新增'}方案？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const api = this.isEdit ? meterPriceUpdate : meterPriceAdd
          const { msg } = await api(this.formData)
          this.$message.success(msg || '操作成功')
          this.closeDialog()
          this.loadData()
        } catch (error) {
          this.$message.error('操作失败')
        }
      }).catch(() => {})
    },
    
    closeDialog() {
      this.dialogVisible = false
      this.formData = {
        id: '',
        name: '',
        code: '1',
        phone: '',
        managerId: '',
        powerPeakPrice: '',
        powerTopPrice: '',
        powerFlatPrice: '',
        powerValleyPrice: '',
        priceType:2
      }
      this.codePhone = ''
      if (this.countDownTimer) {
        clearInterval(this.countDownTimer)
        this.countDown = '发送验证码'
      }
    },
    
    async handleStatusChange(row) {
      try {
        const status = row.enableStatus === 1 ? 0 : 1
        const { msg } = await meterPriceChangeEnableStatus({
          id: row.id,
          enableStatus: status
        })
        this.$message.success(msg || '操作成功')
        this.loadData()
      } catch (error) {
        this.$message.error('操作失败')
      }
    },
    
    // ================ 树形结构批量绑定功能（新增/修改） ================
    
    async handleBatchBind(row) {
      this.currentPriceId = row.id
      this.bindDrawerVisible = true
      this.activeTab = 0
      this.selectedMeterIds = []
      
      try {
        const { data } = await meterPriceQueryPriceMeterEdit({ 
          priceId: row.id 
        })
        
        if (data) {
          this.rawMeterData = data
          this.buildTreeData(data)
        }
      } catch (error) {
        console.error('获取电表列表失败:', error)
        this.$message.error('获取电表列表失败')
      }
    },
    
    // 构建树形数据结构（修正）
    buildTreeData(data) {
      const currentList = this.activeTab === 0 ? 
        (data.privateMeterList || []) : 
        (data.shareMeterList || [])
      
      // 按bindName分组 - 专用电表和公摊电表都需要分组
      const groupMap = new Map()
      
      currentList.forEach(meter => {
        const groupName = meter.bindName || '未分组'
        const groupId = meter.bindId || 'unbound'
        
        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, {
            id: groupId,
            name: groupName,
            isGroup: true, // 所有分组都标记为 isGroup: true
            expanded: true, // 默认展开
            children: []
          })
        }
        
        // 处理电表状态
        const processedMeter = {
          ...meter,
          disabled: meter.serviceId === this.currentPriceId
        }
        
        groupMap.get(groupId).children.push(processedMeter)
      })
      
      // 转换为数组并排序
      this.treeData = Array.from(groupMap.values()).sort((a, b) => {
        if (a.name === '未分组') return 1
        if (b.name === '未分组') return -1
        return a.name.localeCompare(b.name)
      })
    },
    
    // 切换展开/收起（新增）
    toggleExpand(groupId) {
      const group = this.treeData.find(g => g.id === groupId)
      if (group && group.isGroup) {
        this.$set(group, 'expanded', !group.expanded)
      }
    },
    
    // 检查分组是否全选（修改）
    isGroupChecked(group) {
      if (group.isGroup) {
        const availableChildren = group.children.filter(m => !m.disabled)
        return availableChildren.length > 0 && 
               availableChildren.every(m => this.selectedMeterIds.includes(m.meterId))
      } else {
        // 单个电表
        return !group.disabled && this.selectedMeterIds.includes(group.meterId)
      }
    },
    
    // 处理分组选择（修改）
    handleGroupCheck(group, event) {
      event.stopPropagation()
      const checked = event.target.checked
      
      if (group.isGroup) {
        // 公摊组
        const availableChildren = group.children.filter(m => !m.disabled)
        
        if (checked) {
          const newIds = availableChildren.map(m => m.meterId)
          const currentSet = new Set(this.selectedMeterIds)
          newIds.forEach(id => currentSet.add(id))
          this.selectedMeterIds = Array.from(currentSet)
        } else {
          const removeIds = availableChildren.map(m => m.meterId)
          this.selectedMeterIds = this.selectedMeterIds.filter(id => !removeIds.includes(id))
        }
      } else {
        // 单个电表
        if (group.disabled) return
        
        const index = this.selectedMeterIds.indexOf(group.meterId)
        if (checked && index === -1) {
          this.selectedMeterIds.push(group.meterId)
        } else if (!checked && index > -1) {
          this.selectedMeterIds.splice(index, 1)
        }
      }
    },
    
    // 处理单个电表选择（保持原有逻辑）
    handleMeterCheck(meter) {
      if (meter.disabled) return
      
      const index = this.selectedMeterIds.indexOf(meter.meterId)
      if (index > -1) {
        this.selectedMeterIds.splice(index, 1)
      } else {
        this.selectedMeterIds.push(meter.meterId)
      }
    },
    
    // 处理全选（修改）
    handleCheckAll(event) {
      const checked = event.target.checked
      
      if (checked) {
        const allAvailableIds = []
        this.treeData.forEach(group => {
          if (group.isGroup) {
            group.children.forEach(child => {
              if (!child.disabled) {
                allAvailableIds.push(child.meterId)
              }
            })
          } else if (!group.disabled) {
            allAvailableIds.push(group.meterId)
          }
        })
        this.selectedMeterIds = allAvailableIds
      } else {
        this.selectedMeterIds = []
      }
    },
    
    // 获取所有可用电表（新增）
    getAllAvailableMeters() {
      const availableMeters = []
      this.treeData.forEach(group => {
        if (group.isGroup) {
          availableMeters.push(...group.children.filter(m => !m.disabled))
        } else if (!group.disabled) {
          availableMeters.push(group)
        }
      })
      return availableMeters
    },
    
    // tab 切换（新增）
    switchTab(tabIndex) {
      this.activeTab = tabIndex
      this.treeFilter = ''
      this.selectedMeterIds = []
      
      if (this.rawMeterData) {
        this.buildTreeData(this.rawMeterData)
      }
    },
    
    // 确认绑定（修改逻辑）
    async handleBindSubmit() {
      if (this.selectedMeterIds.length === 0) {
        this.$message.warning('请选择要绑定的电表')
        return
      }
      
      // 筛选出新增的电表（排除已经绑定的）
      const availableMeters = this.getAllAvailableMeters()
      const newMeterIds = this.selectedMeterIds.filter(id => {
        const meter = availableMeters.find(m => m.meterId === id)
        return meter && !meter.disabled
      })
      
      if (newMeterIds.length === 0) {
        this.$message.warning('请选择新的电表进行绑定')
        return
      }
      
      this.$confirm(
        `确认绑定 ${newMeterIds.length} 个电表到该方案？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const { msg } = await meterPriceBatchBindPriceMeter({
            priceId: this.currentPriceId,
            meterIdList: newMeterIds
          })
          this.$message.success(msg || '绑定成功')
          this.closeBind()
        } catch (error) {
          console.error('绑定失败:', error)
          this.$message.error('绑定失败')
        }
      }).catch(() => {})
    },
    
    // 关闭抽屉（修改）
    closeBind() {
      this.bindDrawerVisible = false
      this.selectedMeterIds = []
      this.treeFilter = ''
      this.treeData = []
      this.rawMeterData = null
    },
    
    async handleViewLog(row) {
      this.logDialogVisible = true
      this.logLoading = true
      
      try {
        const { data } = await queryPriceLog({
          meterPriceId: row.id,
          managerId: row.managerId,
        })
        
        // 处理分页日志数据 - 根据实际返回的数据结构
        if (data && data.dataList && data.dataList.length > 0) {
          this.logList = data.dataList.map(log => ({
            createTime: log.occurTime,
            operator: log.meterPriceName,
            peakChange: true,
            oldPeakPrice: log.powerPeakPrice,
            newPeakPrice: log.powerPeakPrice,
            topChange: true,
            oldTopPrice: log.powerTopPrice,
            newTopPrice: log.powerTopPrice,
            flatChange: true,
            oldFlatPrice: log.powerFlatPrice,
            newFlatPrice: log.powerFlatPrice,
            valleyChange: true,
            oldValleyPrice: log.powerValleyPrice,
            newValleyPrice: log.powerValleyPrice,
            phone: log.optUserPhone
          }))
        } else {
          this.logList = []
        }
      } catch (error) {
        console.error('获取日志失败:', error)
        this.$message.error('获取日志失败')
        this.logList = []
      } finally {
        this.logLoading = false
      }
    },
    
    closeLogDialog() {
      this.logDialogVisible = false
      this.logList = []
    }
  }
}
</script>

<style lang="scss" scoped>
.electricity-plan-container {
  min-height: 100vh;
  padding: 16px;
}

// 页面头部
.page-header {
  background: white;
  border-radius: 12px;
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-content {
  .page-title {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 4px 0;
  }
  
  .page-description {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &.primary {
    background: #2563eb;
    color: white;
    
    &:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    }
  }
}

// 表格容器
.table-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  
  thead {
    background: #f9fafb;
    
    tr {
      border-bottom: 2px solid #e5e7eb;
    }
    
    th {
      padding: 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      
      .unit {
        font-weight: 400;
        text-transform: none;
        margin-left: 4px;
      }
      
      &.th-id { width: 80px; }
      &.th-name { width: 200px; }
      &.th-price { width: 120px; text-align: right; }
      &.th-time { width: 180px; }
      &.th-status { width: 120px; }
      &.th-actions { width: 200px; }
    }
  }
  
  tbody {
    .table-row {
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.2s;
      
      &:hover {
        background: #f9fafb;
      }
      
      td {
        padding: 16px;
        font-size: 15px;
        color: #374151;
        
        &.td-id {
          font-family: 'SF Mono', monospace;
          color: #9ca3af;
          font-size: 14px;
        }
        
        &.td-name {
          font-weight: 500;
          color: #1f2937;
        }
        
        &.td-price {
          text-align: right;
          font-family: 'SF Mono', monospace;
          font-weight: 500;
          font-size: 15px;
          
          &.price-peak {
            color: #dc2626; // 红色 - 尖电价
          }
          
          &.price-top {
            color: #f59e0b; // 橙色 - 峰电价
          }
          
          &.price-flat {
            color: #3b82f6; // 蓝色 - 平电价
          }
          
          &.price-valley {
            color: #10b981; // 绿色 - 谷电价
          }
        }
        
        &.td-time {
          color: #6b7280;
          font-size: 14px;
        }
      }
    }
  }
}

// 状态开关
.status-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  .switch-track {
    width: 36px;
    height: 20px;
    background: #e5e7eb;
    border-radius: 10px;
    position: relative;
    transition: all 0.3s;
    
    &.active {
      background: #34d399;
      
      .switch-thumb {
        transform: translateX(16px);
      }
    }
    
    .switch-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      transition: transform 0.3s;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }
  
  .status-text {
    font-size: 12px;
    color: #6b7280;
  }
}

// 操作按钮
.action-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-link {
  font-size: 14px;
  color: #2563eb;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  position: relative;
  transition: color 0.2s;
  
  &:hover {
    color: #1d4ed8;
    
    &::after {
      width: 100%;
    }
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 1px;
    background: currentColor;
    transition: width 0.2s;
  }
}

// 空状态
.empty-state {
  padding: 80px 0;
  text-align: center;
  
  svg {
    margin-bottom: 16px;
  }
  
  p {
    font-size: 14px;
    color: #9ca3af;
    margin: 0;
  }
}

// 弹窗样式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  &.large {
    max-width: 800px;
  }
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .modal-title {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }
  
  .modal-close {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    color: #6b7280;
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    
    &:hover {
      background: #f3f4f6;
      color: #374151;
    }
  }
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  
  button {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  
  .btn-cancel {
    background: #f3f4f6;
    color: #374151;
    
    &:hover {
      background: #e5e7eb;
    }
  }
  
  .btn-confirm {
    background: #2563eb;
    color: white;
    
    &:hover {
      background: #1d4ed8;
    }
  }
}

// 表单样式
.form-group {
  margin-bottom: 20px;
  
  .form-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .form-input {
    width: 100%;
    padding: 10px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    color: #1a1a1a;
    transition: all 0.2s;
    
    &:hover {
      border-color: #d1d5db;
    }
    
    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    
    &:disabled {
      background: #f9fafb;
      color: #9ca3af;
      cursor: not-allowed;
    }
  }
}

.price-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.input-group {
  position: relative;
  
  .input-suffix {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    color: #9ca3af;
    pointer-events: none;
  }
  
  input {
    padding-right: 60px;
  }
}

.price-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  
  &.peak { background: #dc2626; }  // 红色 - 尖电价
  &.top { background: #f59e0b; }   // 橙色 - 峰电价
  &.flat { background: #3b82f6; }  // 蓝色 - 平电价
  &.valley { background: #10b981; } // 绿色 - 谷电价
}

// 验证码区域
.verification-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.warning-text {
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.phone-display {
  font-size: 14px;
  color: #1a1a1a;
  padding: 10px 0;
}

.code-btn {
  position: absolute;
  right: 1px;
  top: 1px;
  bottom: 1px;
  padding: 0 16px;
  background: #f3f4f6;
  border: none;
  border-radius: 0 7px 7px 0;
  color: #2563eb;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
  
  &:hover:not(:disabled) {
    background: #e5e7eb;
    color: #1d4ed8;
  }
  
  &:disabled {
    color: #9ca3af;
    cursor: not-allowed;
  }
}

// 侧边栏样式
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.drawer-container {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 480px;
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.drawer-header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .drawer-title {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }
  
  .drawer-close {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    color: #6b7280;
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    
    &:hover {
      background: #f3f4f6;
      color: #374151;
    }
  }
}

.drawer-tabs {
  padding: 0 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  gap: 24px;
}

.tab-item {
  padding: 16px 0;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
  
  &.active {
    color: #2563eb;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: #2563eb;
    }
  }
  
  &:hover:not(.active) {
    color: #374151;
  }
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.tree-search {
  margin-bottom: 20px;
  
  .tree-search-input {
    width: 100%;
    padding: 10px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  }
}

// 树形结构样式 - 优化版本（新增）
.tree-container {
  .tree-node {
    margin-bottom: 4px;
    
    &.root {
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #f8f9fa;
      border-radius: 6px;
      font-weight: 600;
    }
    
    &.parent-node {
      border: 1px solid #e9ecef;
      border-radius: 6px;
      background: #f8f9fa;
      margin-bottom: 8px;
      
      .parent-row {
        display: flex;
        align-items: center;
        padding: 12px 16px;
      }
    }
  }
  
  .tree-checkbox {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    flex: 1;
    
    &.parent-checkbox {
      .tree-label {
        font-weight: 600;
        color: #1f2937;
        font-size: 15px;
      }
    }
    
    input[type="checkbox"] {
      display: none;
      
      &:checked + .checkbox-icon {
        background: #2563eb;
        border-color: #2563eb;
        
        &::after {
          opacity: 1;
        }
      }
      
      &:disabled + .checkbox-icon {
        background: #f3f4f6;
        border-color: #e5e7eb;
        cursor: not-allowed;
      }
    }
    
    .checkbox-icon {
      width: 18px;
      height: 18px;
      border: 2px solid #d1d5db;
      border-radius: 4px;
      margin-right: 12px;
      position: relative;
      transition: all 0.2s;
      flex-shrink: 0;
      
      &::after {
        content: '';
        position: absolute;
        top: 1px;
        left: 4px;
        width: 5px;
        height: 9px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        opacity: 0;
        transition: opacity 0.2s;
      }
    }
    
    .tree-label {
      font-size: 14px;
      color: #374151;
      flex: 1;
    }
    
    .group-type {
      font-size: 12px;
      color: #999;
      font-weight: normal;
    }
    
    .bound-tag {
      font-size: 12px;
      color: #9ca3af;
      padding: 2px 8px;
      background: #f3f4f6;
      border-radius: 4px;
      margin-left: 8px;
    }
  }
  
  // 子项样式 - 重要的层次区分
  .tree-children {
    padding-left: 24px;
    border-left: 2px solid #e5e7eb;
    margin-left: 32px;
    
    .child-node {
      padding: 8px 16px;
      margin: 4px 0;
      border-radius: 4px;
      transition: background 0.2s;
      
      &:hover {
        background: #f9fafb;
      }
      
      .tree-checkbox {
        .tree-label {
          font-size: 14px;
          color: #6b7280;
        }
      }
    }
  }
}

// 展开按钮样式 - 优化版本（新增）
.expand-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
  color: #6b7280;
  margin-right: 12px;
  transition: all 0.2s;
  flex-shrink: 0;
  
  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
}

.expand-placeholder {
  width: 32px;
  flex-shrink: 0;
}

.drawer-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .selected-info {
    font-size: 14px;
    color: #6b7280;
  }
  
  .btn-confirm {
    padding: 10px 24px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: #1d4ed8;
    }
  }
}

// 空状态
.empty-tree {
  padding: 80px 0;
  text-align: center;
  
  svg {
    margin-bottom: 16px;
  }
  
  p {
    font-size: 14px;
    color: #9ca3af;
    margin: 0;
  }
}

// 日志样式
.log-list {
  .log-item {
    padding: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .log-time {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 12px;
  }
  
  .log-content {
    .log-operator {
      font-size: 14px;
      color: #374151;
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .log-phone {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 12px;
    }
    
    .log-changes {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    
    .change-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      
      .change-label {
        color: #6b7280;
      }
      
      .change-value {
        color: #374151;
        font-weight: 500;
      }
    }
  }
}

.empty-log {
  padding: 80px 0;
  text-align: center;
  
  svg {
    margin-bottom: 16px;
  }
  
  p {
    font-size: 14px;
    color: #9ca3af;
    margin: 0;
  }
}

// 动画
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  
  .drawer-container {
    transition: transform 0.3s ease;
  }
}

.slide-enter,
.slide-leave-to {
  background: rgba(0, 0, 0, 0);
  
  .drawer-container {
    transform: translateX(100%);
  }
}

// 响应式
@media (max-width: 768px) {
  .electricity-plan-container {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
    padding: 20px;
  }
  
  .table-container {
    padding: 16px;
  }
  
  .data-table {
    font-size: 12px;
    
    thead th,
    tbody td {
      padding: 12px 8px;
    }
  }
  
  .modal-container {
    max-width: 95%;
  }
  
  .price-grid {
    grid-template-columns: 1fr;
  }
  
  .drawer-container {
    width: 90vw;
  }
  
  .action-group {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>