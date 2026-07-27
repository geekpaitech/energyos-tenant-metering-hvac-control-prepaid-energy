<template>
  <div class="air-share-detail-container" v-loading="pageLoading">
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
            <span class="label">公摊方式：</span>
            <span class="value">{{ getShareTypeLabel(shareData.shareType) }}</span>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top: 10px" v-if="shareData.shareType !== 'ENERGY'">
        <el-col :span="8">
          <div class="info-item">
            <span class="label">总面积：</span>
            <span class="value">{{ totalArea }}㎡</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 公摊设备和公摊租户 -->
    <el-row :gutter="20" class="content-row">
      <!-- 左侧：公摊设备 -->
      <el-col :span="12">
        <el-card class="device-card" shadow="never">
          <div slot="header" class="card-header">
            <span class="header-title">公摊设备 ({{ airList.length }})</span>
            <el-button v-if="canAdd" type="primary" size="small" icon="el-icon-link" @click="handleBindAir">关联/解绑空调</el-button>
          </div>
          <el-table
            :data="airList"
            stripe
            style="width: 100%"
            max-height="500"
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#606266',
              fontWeight: '600',
            }"
          >
            <el-table-column prop="indoorUnitId" label="序列号" width="140" show-overflow-tooltip />
            <el-table-column prop="id" label="设备编号" width="120" align="center" />
            <el-table-column prop="name" label="设备名称" min-width="150" show-overflow-tooltip>
              <template slot-scope="scope">
                <span style="color: #111827;">{{ scope.row.name || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="在线状态" width="100" align="center">
              <template slot-scope="scope">
                <span :class="['online-status', scope.row.state === 0 ? 'online' : 'offline']">
                  <i class="status-dot"></i>
                  {{ scope.row.state === 0 ? '在线' : '离线' }}
                </span>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="airList.length === 0" class="empty-data">
            <el-empty description="暂无设备数据" :image-size="80" />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：公摊租户 -->
      <el-col :span="12">
        <el-card class="tenant-card" shadow="never">
          <div slot="header" class="card-header">
            <span class="header-title">公摊租户 ({{ tenantList.length }})</span>
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
            <el-table-column
              v-if="shareData.shareType !== 'ENERGY'"
              label="实际公摊面积(㎡)"
              width="140"
              align="center"
            >
              <template slot-scope="scope">
                <div class="area-cell">
                  <span>{{ scope.row.area }}</span>
                  <i v-if="canAdd" class="el-icon-edit edit-icon" @click="handleEditArea(scope.row)"></i>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              v-if="shareData.shareType !== 'ENERGY'"
              label="分摊比例"
              width="100"
              align="center"
            >
              <template slot-scope="scope">
                {{ totalArea > 0 ? ((scope.row.area / totalArea) * 100).toFixed(2) : 0 }}%
              </template>
            </el-table-column>
          </el-table>
          <div v-if="tenantList.length === 0" class="empty-data">
            <el-empty description="暂无租户数据" :image-size="80" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 修改公摊组弹窗 -->
    <el-dialog
      title="修改空调公摊组"
      :visible.sync="modifyDialog.visible"
      width="450px"
      :close-on-click-modal="false"
    >
      <el-form ref="modifyForm" :model="modifyDialog" :rules="modifyRules" label-width="100px">
        <el-form-item label="公摊组名" prop="name">
          <el-input v-model="modifyDialog.name" placeholder="请输入公摊组名" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="公摊方式" prop="shareType">
          <el-select v-model="modifyDialog.shareType" placeholder="请选择公摊方式" style="width: 100%">
            <el-option
              v-for="item in shareTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
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
            <el-table-column v-if="shareData.shareType !== 'ENERGY'" label="实际公摊面积" width="120" align="center">
              <template slot-scope="scope">{{ scope.row.publicArea || 0 }}㎡</template>
            </el-table-column>
            <el-table-column v-if="canAdd" label="操作" width="160" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="handleTenantUnbind(scope.row)">解绑</el-button>
                <el-button v-if="shareData.shareType !== 'ENERGY'" type="text" size="small" @click="handleTenantModifyArea(scope.row)">修改面积</el-button>
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
            <el-table-column v-if="shareData.shareType !== 'ENERGY'" label="实际公摊面积" width="120" align="center">
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
        <el-form-item v-if="shareData.shareType !== 'ENERGY'" label="面积">
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

    <!-- 关联/解绑空调弹窗 -->
    <el-dialog
      title="关联/解绑空调"
      :visible.sync="airBindDialog.visible"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-loading="airBindLoading">
        <!-- 已选空调 -->
        <div class="bind-section">
          <div class="section-header">
            <span class="section-title">已选空调</span>
            <el-input
              v-model="airBindDialog.selectedSearch"
              placeholder="搜索已选空调"
              size="small"
              class="search-input"
              clearable
              @input="filterSelectedAir"
            >
              <i slot="prefix" class="el-input__icon el-icon-search"></i>
            </el-input>
          </div>
          <el-table :data="airBindDialog.filteredSelectedList" stripe max-height="200" size="small">
            <el-table-column prop="indoorUnitId" label="序列号" width="140" show-overflow-tooltip />
            <el-table-column prop="id" label="设备编号" width="120" align="center" />
            <el-table-column prop="name" label="设备名称" min-width="150" show-overflow-tooltip />
            <el-table-column label="在线状态" width="100" align="center">
              <template slot-scope="scope">
                <span :class="['online-status', scope.row.state === 0 ? 'online' : 'offline']">
                  <i class="status-dot"></i>
                  {{ scope.row.state === 0 ? '在线' : '离线' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column v-if="canAdd" label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="handleAirUnbind(scope.row)">解绑</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="airBindDialog.filteredSelectedList.length === 0" class="empty-tip">暂无数据</div>
        </div>

        <!-- 可选空调 -->
        <div class="bind-section" style="margin-top: 20px">
          <div class="section-header">
            <span class="section-title">可选空调</span>
            <el-input
              v-model="airBindDialog.selectableSearch"
              placeholder="搜索可选空调"
              size="small"
              class="search-input"
              clearable
              @input="filterSelectableAir"
            >
              <i slot="prefix" class="el-input__icon el-icon-search"></i>
            </el-input>
          </div>
          <el-table :data="airBindDialog.filteredSelectableList" stripe max-height="200" size="small">
            <el-table-column prop="indoorUnitId" label="序列号" width="140" show-overflow-tooltip />
            <el-table-column prop="id" label="设备编号" width="120" align="center" />
            <el-table-column prop="name" label="设备名称" min-width="150" show-overflow-tooltip />
            <el-table-column label="在线状态" width="100" align="center">
              <template slot-scope="scope">
                <span :class="['online-status', scope.row.state === 0 ? 'online' : 'offline']">
                  <i class="status-dot"></i>
                  {{ scope.row.state === 0 ? '在线' : '离线' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column v-if="canAdd" label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="handleAirBind(scope.row)">绑定</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="airBindDialog.filteredSelectableList.length === 0" class="empty-tip">暂无数据</div>
        </div>
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
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  airShareGetDetail,
  airShareUpdate,
  airShareGetTenantBindEdit,
  airShareBindTenant,
  airShareGetAirBindEdit
} from '@/api/airGroup'

export default {
  name: 'ConditioningSharingDetail',
  data () {
    return {
      shareId: '',
      pageLoading: false,
      // 基本信息
      shareData: {
        id: '',
        name: '',
        shareType: ''
      },
      // 租户列表
      tenantList: [],
      // 空调列表
      airList: [],
      // 公摊方式选项
      shareTypeOptions: [
        { label: '面积占比', value: 'AREA' },
        { label: '能耗占比', value: 'ENERGY' }
      ],
      // 修改公摊组弹窗
      modifyDialog: {
        visible: false,
        id: '',
        name: '',
        shareType: ''
      },
      modifyRules: {
        name: [{ required: true, message: '请输入公摊组名', trigger: 'blur' }],
        shareType: [{ required: true, message: '请选择公摊方式', trigger: 'change' }]
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
      // 空调绑定弹窗
      airBindDialog: {
        visible: false,
        selectedList: [],
        selectableList: [],
        filteredSelectedList: [],
        filteredSelectableList: [],
        selectedSearch: '',
        selectableSearch: ''
      },
      airBindLoading: false,
      // 修改面积弹窗
      editAreaDialog: {
        visible: false,
        id: '',
        name: '',
        area: ''
      },
      editAreaSubmitting: false
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
      return this.hasKztPermission('630060')
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
    // 获取公摊方式标签
    getShareTypeLabel (type) {
      const item = this.shareTypeOptions.find(i => i.value === type)
      return item ? item.label : '-'
    },
    // 获取详情数据
    async fetchDetailData () {
      this.pageLoading = true
      try {
        const res = await airShareGetDetail({ shareId: this.shareId })
        if (res.code === 200 && res.data) {
          this.shareData = res.data.shareDto || {}
          this.tenantList = res.data.tenantDtoList || []
          this.airList = res.data.airInfoDtoList || []
        } else {
          this.$message.error(res.msg || '获取详情失败')
        }
      } catch (e) {
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
        name: this.shareData.name,
        shareType: this.shareData.shareType
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
        this.$confirm('分摊组保存成功后，次日结算时生效。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(async () => {
          this.modifySubmitting = true
          try {
            const res = await airShareUpdate({
              id: this.modifyDialog.id,
              name: this.modifyDialog.name,
              shareType: this.modifyDialog.shareType,
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
    // 跳转空调详情
    handleAirDetail (row) {
      this.$router.push({
        path: `/device/conditioning/detail/${row.id}`
      })
    },
    // 跳转租户详情
    handleTenantDetail (row) {
      this.$router.push({
        path: `/metering/tenant/detail/${row.tenantId}`,
        query: { selectType: 3, deviceType: 8 }
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
        const res = await airShareGetTenantBindEdit({
          managerId: this.currentManagerId,
          shareId: this.shareId
        })
        if (res.code === 200 && res.data) {
          // 根据接口返回结构处理数据
          if (res.data.tenantSelectedList && res.data.tenantSelectableList) {
            // 新接口结构
            this.tenantBindDialog.selectedList = res.data.tenantSelectedList || []
            this.tenantBindDialog.selectableList = res.data.tenantSelectableList || []
          } else {
            // 老接口结构 - 返回的是全量数据，需要根据已绑定的租户ID过滤
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
        const res = await airShareBindTenant({
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
        const res = await airShareBindTenant({
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
    // ========== 空调关联/解绑：与 anjineng-ui-ebc equally/list/page/air/detail 一致——无 bindShareAir，保存走 airShare/update（body 含 airIds + airShareTenants）==========
    /**
     * 组装空调公摊「整单保存」body（与 ebc detail onSubmit 中 airShareUpdate 入参一致）
     * @param {number[]} airIds 当前应绑定的空调设备 id 列表
     */
    buildAirShareDeviceSavePayload (airIds) {
      const dto = { ...(this.shareData || {}) }
      const tenants = (this.tenantList || []).map((row) => ({
        tenantId: row.tenantId,
        tenantName: row.tenantName,
        area: row.area != null ? Number(row.area) : 0
      }))
      const ids = [...new Set((airIds || []).map((id) => Number(id)).filter((id) => !Number.isNaN(id)))]
      return {
        ...dto,
        managerId: this.currentManagerId || dto.managerId,
        airIds: ids,
        airShareTenants: tenants,
        airCount: ids.length,
        tenantCount: tenants.length
      }
    },
    async persistAirShareAirIds (airIds) {
      const res = await airShareUpdate(this.buildAirShareDeviceSavePayload(airIds))
      if (res.code !== 200) {
        const err = new Error(res.msg || '保存失败')
        err.msg = res.msg
        throw err
      }
      this.$message.success(res.msg || '保存成功')
      await this.fetchDetailData()
      await this.handleBindAir()
    },
    applyAirBindEditData (payload) {
      if (!payload) {
        this.airBindDialog.selectedList = []
        this.airBindDialog.selectableList = []
        return
      }
      if (Array.isArray(payload.airSelectedList) && Array.isArray(payload.airSelectableList)) {
        this.airBindDialog.selectedList = payload.airSelectedList || []
        this.airBindDialog.selectableList = payload.airSelectableList || []
        return
      }
      const allAirs = Array.isArray(payload) ? payload : []
      const boundIds = this.airList.map((a) => a.id)
      this.airBindDialog.selectedList = allAirs.filter((a) => boundIds.includes(a.id))
      this.airBindDialog.selectableList = allAirs.filter((a) => !boundIds.includes(a.id))
    },
    // 打开空调绑定弹窗
    async handleBindAir () {
      if (!this.canAdd) return
      this.airBindDialog.visible = true
      this.airBindLoading = true
      this.airBindDialog.selectedSearch = ''
      this.airBindDialog.selectableSearch = ''
      try {
        const res = await airShareGetAirBindEdit({
          managerId: this.currentManagerId,
          shareId: this.shareId
        })
        if (res.code !== 200) {
          const err = new Error(res.msg || '获取空调绑定信息失败')
          err.msg = res.msg
          throw err
        }
        this.applyAirBindEditData(res.data)
        this.airBindDialog.filteredSelectedList = [...this.airBindDialog.selectedList]
        this.airBindDialog.filteredSelectableList = [...this.airBindDialog.selectableList]
      } catch (e) {
        this.$message.error(e.msg || e.message || '获取空调绑定信息失败')
      } finally {
        this.airBindLoading = false
      }
    },
    // 搜索已选空调
    filterSelectedAir () {
      const keyword = this.airBindDialog.selectedSearch
      this.airBindDialog.filteredSelectedList = keyword
        ? this.airBindDialog.selectedList.filter(i => i.name.includes(keyword))
        : [...this.airBindDialog.selectedList]
    },
    // 搜索可选空调
    filterSelectableAir () {
      const keyword = this.airBindDialog.selectableSearch
      this.airBindDialog.filteredSelectableList = keyword
        ? this.airBindDialog.selectableList.filter(i => i.name.includes(keyword))
        : [...this.airBindDialog.selectableList]
    },
    // 绑定空调（与 ebc：改本地 airIds 后 airShareUpdate，无独立 bindShareAir）
    async handleAirBind (row) {
      if (!this.canAdd) return
      try {
        await this.$confirm('分摊组保存成功后，次日结算时生效。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch (e) {
        if (e === 'cancel') return
      }
      const nextIds = [...new Set([...this.airList.map((a) => a.id), row.id])]
      try {
        await this.persistAirShareAirIds(nextIds)
      } catch (e) {
        this.$message.error(e.msg || e.message || '绑定失败')
      }
    },
    // 解绑空调
    async handleAirUnbind (row) {
      if (!this.canAdd) return
      try {
        await this.$confirm('确认解绑该空调? 保存后次日结算时生效。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch (e) {
        if (e === 'cancel') return
      }
      const nextIds = this.airList.map((a) => a.id).filter((id) => id !== row.id)
      try {
        await this.persistAirShareAirIds(nextIds)
      } catch (e) {
        this.$message.error(e.msg || e.message || '解绑失败')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.air-share-detail-container {
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

.device-card,
.tenant-card {
  height: 100%;
  min-height: 400px;
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
</style>
