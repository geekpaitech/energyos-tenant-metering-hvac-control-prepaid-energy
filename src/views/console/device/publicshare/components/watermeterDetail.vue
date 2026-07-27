<template>
  <div class="water-share-detail-container" v-loading="pageLoading">
    <!-- 返回按钮 -->
    <div class="page-header">
      <el-button type="text" icon="el-icon-arrow-left" @click="goBack">返回列表</el-button>
    </div>

    <!-- 基本信息区域 -->
    <el-card class="info-card" shadow="never">
      <div slot="header" class="card-header">
        <span class="header-title"><i class="el-icon-document"></i> 基本信息</span>
        <el-button v-if="canAdd" type="primary" size="small" icon="el-icon-edit" @click="handleModifyShare">修改</el-button>
      </div>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="info-item">
            <span class="label">公摊组编号：</span>
            <span class="value">{{ shareData.id }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <span class="label">公摊组名：</span>
            <span class="value">{{ shareData.name }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <span class="label">总面积：</span>
            <span class="value">{{ totalArea }}㎡</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 租户信息和水表信息 -->
    <el-row :gutter="20" class="content-row">
      <!-- 左侧：租户信息 -->
      <el-col :span="12">
        <el-card class="tenant-card" shadow="never">
          <div slot="header" class="card-header">
            <span class="header-title">租户信息 ({{ tenantList.length }})</span>
            <el-button v-if="canAdd" type="primary" size="small" icon="el-icon-link" @click="handleBindTenant">关联/解绑租户</el-button>
          </div>
          <el-table
            :data="tenantList"
            stripe
            style="width: 100%"
            max-height="500"
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#606266',
              fontWeight: '600',
            }"
          >
            <el-table-column label="租户信息" min-width="180" show-overflow-tooltip>
              <template slot-scope="scope">
                <el-link type="primary" @click="handleTenantDetail(scope.row)">
                  ({{ scope.row.tenantId }}){{ scope.row.tenantName }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column label="实际公摊面积(㎡)" width="140" align="center">
              <template slot-scope="scope">
                <div class="area-cell">
                  <span>{{ scope.row.area }}</span>
                  <i v-if="canAdd" class="el-icon-edit edit-icon" @click="handleEditArea(scope.row)"></i>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="公摊比例" width="100" align="center">
              <template slot-scope="scope">
                {{ totalArea > 0 ? ((scope.row.area / totalArea) * 100).toFixed(4) : 0 }}%
              </template>
            </el-table-column>
          </el-table>
          <div v-if="tenantList.length === 0" class="empty-data">
            <el-empty description="暂无租户数据" :image-size="80" />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：公摊水表 -->
      <el-col :span="12">
        <el-card class="meter-card" shadow="never">
          <div slot="header" class="card-header">
            <span class="header-title">公摊水表 ({{ meterList.length }})</span>
            <el-button v-if="canAdd" type="primary" size="small" icon="el-icon-link" @click="handleBindMeter">关联/解绑水表</el-button>
          </div>
          <div class="meter-list">
            <div v-for="item in meterList" :key="item.id" class="meter-item">
              <div class="meter-icon">
                <i class="el-icon-odometer meter-default-icon"></i>
              </div>
              <div class="meter-info">
                <div class="meter-name">{{ item.meterName || item.name }}</div>
                <div class="meter-id">{{ item.id }}</div>
              </div>
              <div class="meter-status">
                <span :class="['online-status', item.onlineStatus === 1 ? 'online' : 'offline']">
                  <i class="status-dot"></i>
                  {{ item.onlineStatus === 1 ? '在线' : '离线' }}
                </span>
              </div>
              <div class="meter-action">
                <el-button v-if="canAdd" type="text" size="small" icon="el-icon-setting" @click="handleMeterSetting(item)">设置</el-button>
              </div>
            </div>
            <div v-if="meterList.length === 0" class="empty-data">
              <el-empty description="暂无水表数据" :image-size="60" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 修改公摊组弹窗 -->
    <el-dialog
      title="修改水表公摊组"
      :visible.sync="modifyDialog.visible"
      width="450px"
      :close-on-click-modal="false"
    >
      <el-form ref="modifyForm" :model="modifyDialog" :rules="modifyRules" label-width="100px">
        <el-form-item label="公摊组名" prop="name">
          <el-input v-model="modifyDialog.name" placeholder="请输入公摊组名" maxlength="50" show-word-limit />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="modifyDialog.visible = false">取 消</el-button>
        <el-button v-if="canAdd" type="primary" :loading="modifySubmitting" @click="handleModifySubmit">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 关联/解绑租户弹窗 -->
    <el-dialog
      title="关联/解绑租户"
      :visible.sync="tenantBindDialog.visible"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-loading="tenantBindLoading">
        <!-- 已选租户 -->
        <div class="bind-section">
          <div class="section-header">
            <span class="section-title">已选租户</span>
            <el-input
              v-model="tenantBindDialog.selectedSearch"
              placeholder="搜索已选租户"
              size="small"
              class="search-input"
              clearable
              @input="filterSelectedTenant"
            >
              <i slot="prefix" class="el-input__icon el-icon-search"></i>
            </el-input>
          </div>
          <el-table :data="tenantBindDialog.filteredSelectedList" stripe max-height="200" size="small">
            <el-table-column prop="name" label="租户名" min-width="120" show-overflow-tooltip />
            <el-table-column prop="id" label="租户ID" width="100" align="center" />
            <el-table-column label="实际公摊面积" width="120" align="center">
              <template slot-scope="scope">{{ scope.row.publicArea || 0 }}㎡</template>
            </el-table-column>
            <el-table-column v-if="canAdd" label="操作" width="150" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="handleTenantUnbind(scope.row)">解绑</el-button>
                <el-button type="text" size="small" @click="handleTenantModifyArea(scope.row)">修改面积</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="tenantBindDialog.filteredSelectedList.length === 0" class="empty-tip">暂无数据</div>
        </div>

        <!-- 可选租户 -->
        <div class="bind-section" style="margin-top: 20px">
          <div class="section-header">
            <span class="section-title">可选租户</span>
            <el-input
              v-model="tenantBindDialog.selectableSearch"
              placeholder="搜索可选租户"
              size="small"
              class="search-input"
              clearable
              @input="filterSelectableTenant"
            >
              <i slot="prefix" class="el-input__icon el-icon-search"></i>
            </el-input>
          </div>
          <el-table :data="tenantBindDialog.filteredSelectableList" stripe max-height="200" size="small">
            <el-table-column prop="name" label="租户名" min-width="120" show-overflow-tooltip />
            <el-table-column prop="id" label="租户ID" width="100" align="center" />
            <el-table-column label="实际公摊面积" width="120" align="center">
              <template slot-scope="scope">{{ scope.row.publicArea || 0 }}㎡</template>
            </el-table-column>
            <el-table-column v-if="canAdd" label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="handleTenantBind(scope.row)">绑定</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="tenantBindDialog.filteredSelectableList.length === 0" class="empty-tip">暂无数据</div>
        </div>
      </div>
    </el-dialog>

    <!-- 租户操作确认弹窗 -->
    <el-dialog
      :title="tenantOperateDialog.title"
      :visible.sync="tenantOperateDialog.visible"
      width="400px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form label-width="80px">
        <el-form-item label="租户名">{{ tenantOperateDialog.name }}</el-form-item>
        <el-form-item label="租户ID">{{ tenantOperateDialog.id }}</el-form-item>
        <el-form-item label="面积">
          <el-input
            v-if="tenantOperateDialog.type === 'bind' || tenantOperateDialog.isModifyArea"
            v-model="tenantOperateDialog.area"
            placeholder="请输入面积"
          >
            <template slot="append">平方米</template>
          </el-input>
          <span v-else>{{ tenantOperateDialog.area }} 平方米</span>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="tenantOperateDialog.visible = false">取 消</el-button>
        <el-button v-if="canAdd" type="primary" :loading="tenantOperateSubmitting" @click="handleTenantOperateSubmit">确 认</el-button>
      </span>
    </el-dialog>

    <!-- 关联/解绑水表弹窗 -->
    <el-dialog
      title="关联/解绑水表"
      :visible.sync="meterBindDialog.visible"
      width="850px"
      :close-on-click-modal="false"
    >
      <div v-loading="meterBindLoading" class="transfer-wrapper">
        <el-transfer
          v-model="meterBindDialog.selectedIds"
          :data="meterBindDialog.allMeterList"
          :titles="['未绑定水表', '已绑定水表']"
          :props="{ key: 'id', label: 'meterName' }"
          :filter-placeholder="'请输入'"
          filterable
          @change="handleMeterTransferChange"
        />
      </div>
    </el-dialog>

    <!-- 修改面积弹窗 -->
    <el-dialog
      title="修改面积"
      :visible.sync="editAreaDialog.visible"
      width="400px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form label-width="80px">
        <el-form-item label="租户名">{{ editAreaDialog.name }}</el-form-item>
        <el-form-item label="租户ID">{{ editAreaDialog.id }}</el-form-item>
        <el-form-item label="面积">
          <el-input v-model="editAreaDialog.area" placeholder="请输入面积">
            <template slot="append">平方米</template>
          </el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="editAreaDialog.visible = false">取 消</el-button>
        <el-button v-if="canAdd" type="primary" :loading="editAreaSubmitting" @click="handleEditAreaSubmit">确 认</el-button>
      </span>
    </el-dialog>

    <!-- 水表设置弹窗 -->
    <el-dialog
      title="设置水表"
      :visible.sync="meterSettingDialog.visible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="meterSettingForm" :model="meterSettingDialog.data" label-width="100px">
        <el-form-item label="水表编号">
          <div class="form-text">{{ meterSettingDialog.data.id }}</div>
        </el-form-item>
        <el-form-item label="水表序列号">
          <div class="form-text">{{ meterSettingDialog.data.serial }}</div>
        </el-form-item>
        <el-form-item label="水表名称">
          <el-input v-model="meterSettingDialog.data.meterName" clearable placeholder="请输入水表名称" />
        </el-form-item>
        <el-form-item label="水费方案">
          <el-select v-model="meterSettingDialog.data.priceId" placeholder="请选择" clearable style="width: 100%">
            <el-option
              v-for="item in meterSettingDialog.priceList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="meterSettingDialog.visible = false">取 消</el-button>
        <el-button v-if="canAdd" type="primary" :loading="meterSettingSubmitting" @click="handleMeterSettingSubmit">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
// 使用正确的API文件和函数名
import {
  waterShareGetShareDetail,
  waterShareUpdate,
  waterShareGetShareTenantBindEdit,
  waterShareBindShareTenantdata,
  waterShareGetShareWaterBindEdit,
  waterShareBindShareWater
} from '@/api/waterGroup'

export default {
  name: 'WatermeterSharingDetail',
  data () {
    return {
      shareId: '',
      pageLoading: false,
      // 基本信息
      shareData: {
        id: '',
        name: ''
      },
      // 租户列表
      tenantList: [],
      // 水表列表
      meterList: [],
      // 修改公摊组弹窗
      modifyDialog: {
        visible: false,
        id: '',
        name: ''
      },
      modifyRules: {
        name: [{ required: true, message: '请输入公摊组名', trigger: 'blur' }]
      },
      modifySubmitting: false,
      // 租户绑定弹窗
      tenantBindDialog: {
        visible: false,
        selectedList: [],
        selectableList: [],
        filteredSelectedList: [],
        filteredSelectableList: [],
        selectedSearch: '',
        selectableSearch: ''
      },
      tenantBindLoading: false,
      // 租户操作弹窗
      tenantOperateDialog: {
        visible: false,
        title: '',
        type: '',
        name: '',
        id: '',
        area: '',
        isModifyArea: false
      },
      tenantOperateSubmitting: false,
      // 水表绑定弹窗
      meterBindDialog: {
        visible: false,
        allMeterList: [],
        selectedIds: [],
        originalSelectedIds: []
      },
      meterBindLoading: false,
      // 修改面积弹窗
      editAreaDialog: {
        visible: false,
        id: '',
        name: '',
        area: ''
      },
      editAreaSubmitting: false,
      // 水表设置弹窗
      meterSettingDialog: {
        visible: false,
        data: {
          id: '',
          serial: '',
          meterName: '',
          priceId: ''
        },
        priceList: []
      },
      meterSettingSubmitting: false
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapGetters(['kztMenuNos']),
    hasKztPermission () {
      const allow = new Set((this.kztMenuNos || []).map((v) => String(v)))
      return (menuNo) => allow.has(String(menuNo))
    },
    canAdd () {
      return this.hasKztPermission('630050')
    },
    // 总面积
    totalArea () {
      return this.tenantList.reduce((sum, item) => sum + (item.area || 0), 0).toFixed(2)
    }
  },
  created () {
    this.shareId = this.$route.query.id
    if (this.shareId) {
      this.fetchDetailData()
    } else {
      this.$message.error('缺少公摊组ID')
      this.goBack()
    }
  },
  methods: {
    // 返回列表
    goBack () {
      this.$router.go(-1)
    },
    // 获取详情数据
    async fetchDetailData () {
      if (!this.shareId) return

      this.pageLoading = true
      try {
        const res = await waterShareGetShareDetail({ shareId: this.shareId })
        if (res.code === 200 && res.data) {
          this.shareData = res.data.waterShareDto || {}
          this.tenantList = res.data.tenantDtoList || []
          this.meterList = res.data.meterInfoDtoList || []
        } else {
          this.$message.error(res.msg || '获取详情失败')
        }
      } catch (e) {
        console.error('获取详情失败:', e)
        this.$message.error('获取详情失败')
      } finally {
        this.pageLoading = false
      }
    },
    // 打开修改公摊组弹窗
    handleModifyShare () {
      if (!this.canAdd) return
      this.modifyDialog = {
        visible: true,
        id: this.shareData.id,
        name: this.shareData.name
      }
      this.$nextTick(() => {
        this.$refs.modifyForm && this.$refs.modifyForm.clearValidate()
      })
    },
    // 提交修改公摊组
    handleModifySubmit () {
      if (!this.canAdd) return
      this.$refs.modifyForm.validate(async (valid) => {
        if (!valid) return
        this.$confirm('确认修改公摊组信息?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(async () => {
          this.modifySubmitting = true
          try {
            const res = await waterShareUpdate({
              id: this.modifyDialog.id,
              name: this.modifyDialog.name,
              managerId: this.currentManagerId
            })
            if (res.code === 200) {
              this.$message.success(res.msg || '修改成功')
              this.modifyDialog.visible = false
              this.fetchDetailData()
            } else {
              this.$message.error(res.msg || '修改失败')
            }
          } catch (e) {
            this.$message.error('修改失败')
          } finally {
            this.modifySubmitting = false
          }
        }).catch(() => {})
      })
    },
    // 跳转租户详情
    handleTenantDetail (row) {
      this.$router.push({
        path: `/metering/tenant/detail/${row.tenantId}`,
        query: { selectType: 3, deviceType: 3 }
      })
    },
    // ========== 租户绑定相关 ==========
    // 打开租户绑定弹窗
    async handleBindTenant () {
      if (!this.canAdd) return
      this.tenantBindDialog.visible = true
      this.tenantBindLoading = true
      this.tenantBindDialog.selectedSearch = ''
      this.tenantBindDialog.selectableSearch = ''
      try {
        const res = await waterShareGetShareTenantBindEdit({
          managerId: this.currentManagerId,
          shareId: this.shareId
        })
        if (res.code === 200 && res.data) {
          if (res.data.tenantSelectedList && res.data.tenantSelectableList) {
            this.tenantBindDialog.selectedList = res.data.tenantSelectedList || []
            this.tenantBindDialog.selectableList = res.data.tenantSelectableList || []
          } else {
            const allTenants = res.data || []
            const boundIds = this.tenantList.map(t => t.tenantId)
            this.tenantBindDialog.selectedList = allTenants.filter(t => boundIds.includes(t.id))
            this.tenantBindDialog.selectableList = allTenants.filter(t => !boundIds.includes(t.id))
          }
          this.tenantBindDialog.filteredSelectedList = [...this.tenantBindDialog.selectedList]
          this.tenantBindDialog.filteredSelectableList = [...this.tenantBindDialog.selectableList]
        }
      } catch (e) {
        this.$message.error('获取租户绑定信息失败')
      } finally {
        this.tenantBindLoading = false
      }
    },
    // 搜索已选租户
    filterSelectedTenant () {
      const keyword = this.tenantBindDialog.selectedSearch
      this.tenantBindDialog.filteredSelectedList = keyword
        ? this.tenantBindDialog.selectedList.filter(i => i.name.includes(keyword))
        : [...this.tenantBindDialog.selectedList]
    },
    // 搜索可选租户
    filterSelectableTenant () {
      const keyword = this.tenantBindDialog.selectableSearch
      this.tenantBindDialog.filteredSelectableList = keyword
        ? this.tenantBindDialog.selectableList.filter(i => i.name.includes(keyword))
        : [...this.tenantBindDialog.selectableList]
    },
    // 绑定租户
    handleTenantBind (row) {
      if (!this.canAdd) return
      this.tenantOperateDialog = {
        visible: true,
        title: '绑定租户',
        type: 'bind',
        name: row.name,
        id: row.id,
        area: row.publicArea || '',
        isModifyArea: false
      }
    },
    // 解绑租户
    handleTenantUnbind (row) {
      if (!this.canAdd) return
      this.tenantOperateDialog = {
        visible: true,
        title: '解绑租户',
        type: 'unbind',
        name: row.name,
        id: row.id,
        area: row.publicArea,
        isModifyArea: false
      }
    },
    // 修改租户面积（弹窗内）
    handleTenantModifyArea (row) {
      if (!this.canAdd) return
      this.tenantOperateDialog = {
        visible: true,
        title: '修改面积',
        type: 'bind',
        name: row.name,
        id: row.id,
        area: row.publicArea,
        isModifyArea: true
      }
    },
    // 提交租户操作
    async handleTenantOperateSubmit () {
      if (!this.canAdd) return
      this.tenantOperateSubmitting = true
      try {
        const res = await waterShareBindShareTenantdata({
          tenantId: this.tenantOperateDialog.id,
          shareId: this.shareId,
          managerId: this.currentManagerId,
          type: this.tenantOperateDialog.type,
          area: this.tenantOperateDialog.area
        })
        if (res.code === 200) {
          this.$message.success(res.msg || '操作成功')
          this.tenantOperateDialog.visible = false
          this.handleBindTenant()
          this.fetchDetailData()
        } else {
          this.$message.error(res.msg || '操作失败')
        }
      } catch (e) {
        this.$apiError.notify(e, '操作失败')
      } finally {
        this.tenantOperateSubmitting = false
      }
    },
    // 修改面积（详情页表格内）
    handleEditArea (row) {
      if (!this.canAdd) return
      this.editAreaDialog = {
        visible: true,
        id: row.tenantId,
        name: row.tenantName,
        area: row.area
      }
    },
    // 提交修改面积
    async handleEditAreaSubmit () {
      if (!this.canAdd) return
      this.editAreaSubmitting = true
      try {
        const res = await waterShareBindShareTenantdata({
          tenantId: this.editAreaDialog.id,
          shareId: this.shareId,
          managerId: this.currentManagerId,
          type: 'bind',
          area: this.editAreaDialog.area
        })
        if (res.code === 200) {
          this.$message.success(res.msg || '修改成功')
          this.editAreaDialog.visible = false
          this.fetchDetailData()
        } else {
          this.$message.error(res.msg || '修改失败')
        }
      } catch (e) {
        this.$message.error('修改失败')
      } finally {
        this.editAreaSubmitting = false
      }
    },
    // ========== 水表绑定相关 ==========
    // 打开水表绑定弹窗
    async handleBindMeter () {
      if (!this.canAdd) return
      this.meterBindDialog.visible = true
      this.meterBindLoading = true
      try {
        const res = await waterShareGetShareWaterBindEdit({
          managerId: this.currentManagerId,
          shareId: this.shareId
        })
        if (res.code === 200 && res.data) {
          const selectedList = res.data.meterSelectedList || []
          const selectableList = res.data.meterSelectableList || []

          // 合并水表数据
          this.meterBindDialog.allMeterList = [
            ...selectableList,
            ...selectedList
          ]

          // 已绑定的水表ID
          this.meterBindDialog.selectedIds = selectedList.map(item => item.id)
          this.meterBindDialog.originalSelectedIds = [...this.meterBindDialog.selectedIds]
        }
      } catch (e) {
        this.$message.error('获取水表绑定信息失败')
      } finally {
        this.meterBindLoading = false
      }
    },
    // 穿梭框变化事件
    async handleMeterTransferChange (value, direction, movedKeys) {
      if (!this.canAdd) return
      const type = direction === 'right' ? 'bind' : 'unbind'

      for (const meterId of movedKeys) {
        try {
          const res = await waterShareBindShareWater({
            meterId: meterId,
            shareId: this.shareId,
            type: type
          })

          if (res.code === 200) {
            this.$message.success(res.msg || '操作成功')
          } else {
            this.$message.error(res.msg || '操作失败')
            // 操作失败，恢复原状态
            if (type === 'bind') {
              this.meterBindDialog.selectedIds = this.meterBindDialog.selectedIds.filter(id => id !== meterId)
            } else {
              this.meterBindDialog.selectedIds.push(meterId)
            }
          }
        } catch (e) {
          this.$apiError.notify(e, '操作失败')
          if (type === 'bind') {
            this.meterBindDialog.selectedIds = this.meterBindDialog.selectedIds.filter(id => id !== meterId)
          } else {
            this.meterBindDialog.selectedIds.push(meterId)
          }
        }
      }

      // 刷新详情数据
      this.fetchDetailData()
    },
    // 水表设置
    handleMeterSetting (item) {
      if (!this.canAdd) return
      this.meterSettingDialog.visible = true
      this.meterSettingDialog.data = {
        id: item.id,
        serial: item.serial,
        meterName: item.meterName || item.name,
        priceId: item.priceId || ''
      }
      // TODO: 加载水费方案列表
    },
    // 提交水表设置
    async handleMeterSettingSubmit () {
      if (!this.canAdd) return
      this.$confirm('确认修改水表设置?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        this.meterSettingSubmitting = true
        try {
          // TODO: 调用水表设置接口
          this.$message.success('设置成功')
          this.meterSettingDialog.visible = false
          this.fetchDetailData()
        } catch (e) {
          this.$message.error('设置失败')
        } finally {
          this.meterSettingSubmitting = false
        }
      }).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.water-share-detail-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);
}

.page-header {
  margin-bottom: 16px;
}

.info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;

    i {
      margin-right: 8px;
      color: #409eff;
    }
  }
}

.info-item {
  padding: 10px 0;

  .label {
    color: #909399;
    margin-right: 8px;
  }

  .value {
    color: #303133;
    font-weight: 500;
  }
}

.content-row {
  margin-top: 20px;
}

.tenant-card,
.meter-card {
  height: 100%;
  min-height: 400px;
}

.area-cell {
  display: flex;
  align-items: center;
  justify-content: center;

  .edit-icon {
    margin-left: 8px;
    color: #409eff;
    cursor: pointer;

    &:hover {
      color: #66b1ff;
    }
  }
}

.meter-list {
  max-height: 450px;
  overflow-y: auto;
}

.meter-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;

  .meter-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .meter-default-icon {
      font-size: 28px;
      color: #409eff;
    }
  }

  .meter-info {
    flex: 1;
    margin-left: 10px;
    min-width: 0;

    .meter-name {
      font-size: 14px;
      color: #303133;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .meter-id {
      font-size: 12px;
      color: #909399;
    }
  }

  .meter-status {
    margin-right: 10px;
    flex-shrink: 0;
  }

  .meter-action {
    flex-shrink: 0;
  }
}

.online-status {
  display: inline-flex;
  align-items: center;
  font-size: 12px;

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 4px;
  }

  &.online {
    color: #67c23a;
    .status-dot {
      background: #67c23a;
    }
  }

  &.offline {
    color: #909399;
    .status-dot {
      background: #909399;
    }
  }
}

.empty-data {
  padding: 40px 0;
  text-align: center;
}

.empty-tip {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.bind-section {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .section-title {
      font-weight: 600;
      color: #303133;
    }
  }
}

.search-input {
  width: 200px;
}

.transfer-wrapper {
  display: flex;
  justify-content: center;

  ::v-deep .el-transfer {
    .el-transfer-panel {
      width: 320px;

      .el-transfer-panel__header {
        background: #f5f7fa;

        .el-checkbox__label {
          font-size: 14px;
          font-weight: 600;
        }
      }

      .el-transfer-panel__body {
        height: 350px;

        .el-transfer-panel__filter {
          margin: 10px;
        }

        .el-transfer-panel__list {
          height: 280px;
        }
      }
    }

    .el-transfer__buttons {
      padding: 0 20px;
    }
  }
}

.form-text {
  color: #606266;
  line-height: 32px;
}
</style>
