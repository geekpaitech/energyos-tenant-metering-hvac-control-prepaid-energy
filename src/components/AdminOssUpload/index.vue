<template>
  <el-upload
    ref="upload"
    action=""
    :http-request="fnUploadRequest"
    :before-remove="beforeRemove"
    :on-remove="handleRemove"
    :limit="limit"
    :on-exceed="onExceed"
    :before-upload="beforeUpload"
    :file-list="fileList"
    :accept="accept"
  >
    <el-button size="small" icon="el-icon-upload2">点击上传</el-button>
    <div slot="tip" class="el-upload__tip upload-tip">
      请上传 {{ uploadType }} 格式文件（上传至 OSS：{{ ossPrefix }}）
    </div>
  </el-upload>
</template>

<script>
import OSS from 'ali-oss'
import moment from 'moment'
import { contentOssSts } from '@/api/oss'

const FILE_TYPES = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel'
}

export default {
  name: 'AdminOssUpload',
  props: {
    uploadType: {
      type: String,
      default: 'xlsx'
    },
    limit: {
      type: Number,
      default: 1
    },
    /** OSS 对象前缀，与项目 wu-cloud 配置一致 */
    ossPrefix: {
      type: String,
      default: 'admin/water-import/'
    }
  },
  data () {
    return {
      fileList: [],
      uploading: false
    }
  },
  computed: {
    accept () {
      if (this.uploadType === 'xlsx') return '.xlsx,.xls'
      return ''
    }
  },
  methods: {
    onExceed () {
      this.$message.warning(`最多上传 ${this.limit} 个文件`)
    },
    beforeUpload (file) {
      const ext = this.uploadType
      const ok = FILE_TYPES[ext] ? file.type === FILE_TYPES[ext] || file.name.endsWith('.' + ext) : true
      if (!ok) {
        this.$message.error(`请上传 ${ext} 格式文件`)
        return false
      }
      return true
    },
    async fnUploadRequest (option) {
      this.uploading = true
      try {
        const uid = option.file.uid || Date.now()
        const { code, msg, data } = await contentOssSts({ uid })
        if (code !== 200) throw new Error(msg || '获取 OSS 凭证失败')

        const client = new OSS({
          region: 'oss-cn-shanghai',
          accessKeyId: data.accessKeyId,
          accessKeySecret: data.accessKeySecret,
          stsToken: data.securityToken,
          bucket: 'wu-cloud',
          secure: true
        })

        const file = option.file
        const point = file.name.lastIndexOf('.')
        const suffix = file.name.substr(point)
        const baseName = file.name.substr(0, point)
        const dateStr = moment().format('YYYYMMDDHHmmss')
        const objectName = `${this.ossPrefix}${baseName}_${dateStr}${suffix}`

        const ret = await client.put(objectName, file, {
          progress (p) {
            option.onProgress({ percent: p * 100 })
          }
        })

        if (ret.res.statusCode === 200) {
          this.fileList = [{ name: file.name, url: ret.url }]
          this.$emit('uploadSuccess', {
            ...ret,
            file,
            filePath: objectName,
            url: ret.url
          })
          option.onSuccess(ret)
        } else {
          throw new Error('上传失败')
        }
      } catch (e) {
        this.$message.error(e?.message || '上传失败')
        option.onError(e)
      } finally {
        this.uploading = false
      }
    },
    beforeRemove () {
      return this.$confirm('确认移除该文件？', '提示', { type: 'warning' }).catch(() => false)
    },
    handleRemove () {
      this.fileList = []
      this.$emit('removeUpload')
    },
    clearUpload () {
      this.fileList = []
      if (this.$refs.upload) this.$refs.upload.clearFiles()
    }
  }
}
</script>

<style scoped>
.upload-tip {
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
  margin-top: 6px;
}
</style>
