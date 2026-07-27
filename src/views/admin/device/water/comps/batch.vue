<template>
  <el-dialog
    title="批量导入水表"
    :close-on-click-modal="false"
    :visible.sync="batchDialog.show"
    width="480px"
    @open="initDialog"
    @close="closeDialog"
  >
    <el-form label-width="100px" size="small">
      <el-form-item label="选择项目" required>
        <el-select
          v-model="queryData.managerId"
          filterable
          clearable
          placeholder="项目名称"
          style="width:100%"
        >
          <el-option v-for="item in managerNames" :key="item.id" :label="item.unite" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="接入渠道" required>
        <el-select v-model="queryData.waterType" clearable placeholder="请选择" style="width:100%">
          <el-option v-for="item in waterChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="选择文件" required>
        <AdminOssUpload
          ref="upload"
          upload-type="xlsx"
          :limit="1"
          oss-prefix="admin/water-import/"
          @uploadSuccess="onFileUploaded"
          @removeUpload="onFileRemoved"
        />
        <p v-if="queryData.bindList.length" class="parse-hint">
          已解析 {{ queryData.bindList.length }} 条记录，确认后将提交导入
        </p>
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button @click="closeDialog">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="onSubmit">确 认</el-button>
    </span>
  </el-dialog>
</template>

<script>
import * as XLSX from 'xlsx'
import AdminOssUpload from '@/components/AdminOssUpload'
import { adminWaterAddMeterBatch } from '@/api/adminWater'
import { WaterChannelType } from '@/utils/enums/water'

const BIND_TYPE = [1, 2, 3, '1', '2', '3']
const SWITCH = ['是', '否']

export default {
  components: { AdminOssUpload },
  props: {
    batchDialog: {
      type: Object,
      default: () => ({ show: false })
    },
    managerNames: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      submitting: false,
      queryData: {
        managerId: '',
        waterType: '',
        bindList: []
      }
    }
  },
  computed: {
    waterChannelOptions () {
      return Object.values(WaterChannelType)
    }
  },
  methods: {
    initDialog () {
      this.queryData.bindList = []
    },
    onFileRemoved () {
      this.queryData.bindList = []
    },
    async onFileUploaded (res) {
      if (!res?.file) return
      try {
        const list = await this.parseExcel(res.file)
        this.queryData.bindList = list
      } catch (e) {
        this.$message.error(e?.message || '解析 Excel 失败')
        this.$refs.upload?.clearUpload()
        this.queryData.bindList = []
      }
    },
    parseExcel (file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsBinaryString(file)
        reader.onload = (ev) => {
          try {
            const worker = XLSX.read(ev.target.result, { type: 'binary' })
            const rows = XLSX.utils.sheet_to_json(worker.Sheets[worker.SheetNames[0]])
            const arr = []
            for (let i = 0; i < rows.length; i++) {
              const item = rows[i]
              const keys = { serial: null, waterName: null, bindType: null, withSwitch: null, errorDesc: '' }
              for (const key in item) {
                if (key.indexOf('序列号') !== -1) keys.serial = item[key]
                else if (key.indexOf('名称') !== -1) keys.waterName = String(item[key])
                else if (key.indexOf('类型') !== -1) {
                  keys.bindType = item[key]
                  if (BIND_TYPE.indexOf(item[key]) === -1) {
                    reject(new Error(`设备类型填写错误 “${item[key]}”`))
                    this.$refs.upload?.clearUpload()
                    return
                  }
                } else if (key.indexOf('阀控') !== -1) {
                  keys.withSwitch = item[key] === '是'
                  if (SWITCH.indexOf(item[key]) === -1) {
                    reject(new Error(`是否支持阀控填写错误 “${item[key]}”`))
                    this.$refs.upload?.clearUpload()
                    return
                  }
                }
              }
              arr.push(keys)
            }
            if (!arr.length) reject(new Error('Excel 中无有效数据'))
            else resolve(arr)
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = () => reject(new Error('读取文件失败'))
      })
    },
    async onSubmit () {
      if (!this.queryData.managerId) {
        this.$message.warning('请选择项目')
        return
      }
      if (!this.queryData.waterType) {
        this.$message.warning('请选择接入渠道')
        return
      }
      if (!this.queryData.bindList.length) {
        this.$message.warning('请先上传并解析 Excel 文件')
        return
      }
      try {
        await this.$confirm('确认上传并批量导入水表？', '提示', { type: 'warning' })
      } catch (e) {
        return
      }
      this.submitting = true
      try {
        const params = {
          waterType: this.queryData.waterType,
          managerId: this.queryData.managerId
        }
        const { msg, data } = await adminWaterAddMeterBatch(params, this.queryData.bindList)
        if (data && data.length) this.errExport(data)
        this.$message.success(msg || '导入完成')
        this.$emit('search')
        this.closeDialog()
      } catch (e) {
        this.$message.error(e?.message || '导入失败')
      } finally {
        this.submitting = false
      }
    },
    errExport (data) {
      const tableList = [{
        A: '水表序列号',
        B: '水表名称',
        C: '水表类型',
        D: '是否支持阀控',
        E: '错误信息'
      }]
      data.forEach((item) => {
        tableList.push({
          A: item.serial,
          B: item.waterName,
          C: item.bindType,
          D: item.withSwitch === true ? '是' : item.withSwitch === false ? '否' : '',
          E: item.errorDesc
        })
      })
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(tableList, { skipHeader: true })
      ws['!cols'] = [{ width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 30 }]
      XLSX.utils.book_append_sheet(wb, ws, 'file')
      XLSX.writeFile(wb, '导出失败信息.xlsx')
    },
    closeDialog () {
      this.queryData.managerId = ''
      this.queryData.waterType = ''
      this.queryData.bindList = []
      this.$refs.upload?.clearUpload()
      this.batchDialog.show = false
    }
  }
}
</script>

<style scoped>
.parse-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #67c23a;
}
</style>
