<template>
  <el-dialog
    :close-on-click-modal="false"
    :visible.sync="editDialog.show"
    width="720px"
    :title="editDialog.type ? '修改权限' : '新增权限'"
    @close="closeDialog"
    @open="initDialog"
  >
    <div v-loading="innerLoading">
      <el-form label-width="90px">
        <el-form-item label="权限名">
          <el-input v-model="queryData.name" clearable placeholder="请输入" />
        </el-form-item>
        <el-form-item label="appKey">
          <span v-if="editDialog.type">{{ queryData.appKey }}</span>
          <el-input v-else v-model="queryData.appKey" placeholder="请输入">
            <i slot="suffix" class="el-icon-refresh input-icon" @click="getWebRandom32('appKey')" />
          </el-input>
        </el-form-item>
        <el-form-item label="appSecret">
          <el-input v-model="queryData.appSecret" placeholder="请输入">
            <i slot="suffix" class="el-icon-refresh input-icon" @click="getWebRandom32('appSecret')" />
          </el-input>
        </el-form-item>
        <el-form-item label="权限类型">
          <el-select
            v-model="queryData.permissionList"
            filterable
            multiple
            collapse-tags
            clearable
            placeholder="请选择"
            style="width:100%"
          >
            <el-option
              v-for="item in PermissionTypeList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="项目权限">
          <el-select
            v-model="selectManager"
            filterable
            multiple
            collapse-tags
            clearable
            placeholder="请选择"
            style="width:100%"
            @change="changeManager"
          >
            <el-option
              v-for="item in managerNames"
              :key="item.id"
              :label="item.label"
              :value="item.id + '_' + item.label"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="selectManager.length" label="租户权限">
          <el-select
            v-model="selectTenant"
            multiple
            filterable
            collapse-tags
            clearable
            placeholder="请选择"
            style="width:100%"
            @change="changeTenant"
          >
            <el-option
              v-for="item in tenantNamesList"
              :key="item.value2"
              :label="item.unite"
              :value="item.value2"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <div v-if="queryData.managerList.length" style="margin:20px 0">
        <el-table
          :data="queryData.managerList"
          row-key="managerId"
          :expand-row-keys="expandRowKeys"
          border
          max-height="30vh"
        >
          <el-table-column v-if="queryData.tenantList.length" type="expand">
            <template slot-scope="props">
              <div
                v-for="item in getTenantsByManager(props.row.managerId)"
                :key="item.tenantId"
                class="tenant-row"
              >
                <span class="tenant-field">租户ID: {{ item.tenantId }}</span>
                <span class="tenant-field">租户名称: {{ item.tenantName }}</span>
                <i class="el-icon-close input-icon" @click="onDelete(item, false)" />
              </div>
            </template>
          </el-table-column>
          <el-table-column property="managerId" width="100" label="项目ID" />
          <el-table-column property="managerName" label="项目名称" />
          <el-table-column label="操作" width="80" align="center">
            <template slot-scope="scope">
              <i class="el-icon-close input-icon" @click="onDelete(scope.row, true)" />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <span slot="footer">
      <el-button @click="closeDialog">取 消</el-button>
      <el-button type="primary" @click="onSubmit">确 认</el-button>
    </span>
  </el-dialog>
</template>

<script>
import {
  webRandom32,
  webUpdateAuth,
  webAddAuth,
  adminDbGetManagerListByUser,
  adminDbGetSimpleTenantList
} from '@/api/adminDb'
import { mapManagerOptions, mapTenantOptions } from '@/views/admin/device/meter/utils'

const PermissionTypeList = [
  { value: '1', label: '读取' },
  { value: '2', label: '写入' },
  { value: '3', label: '管理' }
]

export default {
  name: 'OpenApiEdit',
  props: {
    editDialog: {
      type: Object,
      default: () => ({ show: false, type: false, data: {} })
    }
  },
  data () {
    return {
      PermissionTypeList,
      queryData: {
        name: '',
        id: '',
        appKey: '',
        appSecret: '',
        managerList: [],
        tenantList: [],
        permissionList: []
      },
      innerLoading: false,
      selectManager: [],
      selectTenant: [],
      managerNames: [],
      tenantNamesObj: {},
      tenantNamesList: [],
      expandRowKeys: [],
      setTimer: null
    }
  },
  created () {
    this.loadManagers()
  },
  beforeDestroy () {
    clearTimeout(this.setTimer)
  },
  methods: {
    getTenantsByManager (managerId) {
      return (this.queryData.tenantList || []).filter(item => item.managerId === managerId)
    },
    async loadManagers () {
      try {
        const { data } = await adminDbGetManagerListByUser()
        const list = Array.isArray(data) ? data : (data?.dataList || data?.list || [])
        this.managerNames = mapManagerOptions(list)
      } catch (e) {
        this.managerNames = []
      }
    },
    initDialog () {
      if (this.editDialog.type) {
        this.innerLoading = true
        const d = this.editDialog.data
        this.queryData = {
          name: d.name || '',
          id: d.id || '',
          appKey: d.appKey || '',
          appSecret: d.appSecret || '',
          managerList: [...(d.managerList || [])],
          tenantList: [...(d.tenantList || [])],
          permissionList: [...(d.permissionList || [])]
        }
        ;(this.queryData.managerList || []).forEach(item => {
          this.getTenantList(item.managerId)
          this.selectManager.push(item.managerId + '_' + item.managerName)
        })
        ;(this.queryData.tenantList || []).forEach(item => {
          this.selectTenant.push(item.tenantId + '_' + item.tenantName + '_' + item.managerId)
        })
        this.innerLoading = false
      }
    },
    onDelete (row, isManager) {
      if (isManager) {
        const str = row.managerId + '_' + row.managerName
        const idx = this.selectManager.indexOf(str)
        if (idx !== -1) this.selectManager.splice(idx, 1)
        this.changeManager(this.selectManager)
      } else {
        const str = row.tenantId + '_' + row.tenantName + '_' + row.managerId
        const idx = this.selectTenant.indexOf(str)
        if (idx !== -1) this.selectTenant.splice(idx, 1)
        this.changeTenant(this.selectTenant)
      }
    },
    changeManager (val) {
      const ids = []
      this.queryData.managerList = (val || []).map(item => {
        const arr = item.split('_')
        ids.push(arr[0])
        if (!this.tenantNamesObj[arr[0]]) {
          this.getTenantList(arr[0])
        }
        return { managerId: arr[0], managerName: arr[1] }
      })
      Object.keys(this.tenantNamesObj).forEach(key => {
        if (ids.indexOf(key) === -1) {
          delete this.tenantNamesObj[key]
          this.buildTenantList()
          this.selectTenant = this.selectTenant.filter(item => !item.includes(key + '_'))
          this.changeTenant(this.selectTenant)
        }
      })
    },
    changeTenant (val) {
      if (val) {
        const keys = []
        this.queryData.tenantList = (val || []).map(item => {
          const arr = item.split('_')
          if (!keys.includes(arr[2])) keys.push(arr[2])
          return { tenantId: arr[0], tenantName: arr[1], managerId: arr[2] }
        })
        this.expandRowKeys = keys
      }
    },
    async getTenantList (managerId) {
      try {
        const { data } = await adminDbGetSimpleTenantList({ managerId, tenantStatus: 0 })
        const list = Array.isArray(data) ? data : (data?.dataList || data?.list || [])
        this.tenantNamesObj[managerId] = mapTenantOptions(list).map(item => {
          item.value2 = item.id + '_' + item.unite.split(')')[0].replace('(', '') + '_' + managerId
          return item
        })
        this.buildTenantList()
      } catch (e) {
        this.tenantNamesObj[managerId] = []
        this.buildTenantList()
      }
    },
    buildTenantList () {
      let arr = []
      Object.values(this.tenantNamesObj).forEach(v => { arr = [...arr, ...v] })
      this.tenantNamesList = arr
    },
    async onSubmit () {
      try {
        await this.$confirm(
          '确认' + (this.editDialog.type ? '修改' : '新增') + '权限?',
          '提示',
          { type: 'warning' }
        )
      } catch (e) { return }

      if (this.editDialog.type) {
        const { msg } = await webUpdateAuth(this.queryData)
        this.$message.success(msg || '修改成功')
      } else {
        const { msg } = await webAddAuth(this.queryData)
        this.$message.success(msg || '新增成功')
      }
      this.closeDialog()
      this.$emit('search')
    },
    async getWebRandom32 (key) {
      clearTimeout(this.setTimer)
      this.setTimer = setTimeout(async () => {
        const { code, msg } = await webRandom32()
        if (code === 200 || code === '200') {
          this.queryData[key] = msg
        } else {
          this.$message.success(msg || '获取成功')
        }
      }, 200)
    },
    closeDialog () {
      this.queryData = {
        name: '',
        id: '',
        appKey: '',
        appSecret: '',
        managerList: [],
        tenantList: [],
        permissionList: []
      }
      this.selectManager = []
      this.selectTenant = []
      this.tenantNamesObj = {}
      this.tenantNamesList = []
      this.expandRowKeys = []
      this.editDialog.show = false
    }
  }
}
</script>

<style scoped>
.input-icon {
  font-size: 18px;
  cursor: pointer;
  color: #409eff;
}

.tenant-row {
  display: flex;
  color: #303133;
  padding: 8px 0;
  align-items: center;
}

.tenant-field {
  width: 300px;
}

.tenant-field:first-child {
  width: 240px;
  padding-left: 80px;
}

::v-deep .el-table__expanded-cell {
  background: transparent;
  padding: 0;
  margin: 0;
}
</style>
