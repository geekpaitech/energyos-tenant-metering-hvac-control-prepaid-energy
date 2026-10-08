<template>
  <el-drawer
    title="消息详情"
    :visible.sync="detailDrawer.show"
    size="60%"
    @close="closeDialog"
    @open="openDialod"
  >
    <div class="detail-body">
      <el-form label-width="110px" label-position="left">
        <div class="section-title">消息信息</div>
        <div class="info-box">
          <el-form-item label="项目信息">
            {{ detailDrawer.data.managerName ? `(${detailDrawer.data.managerId})${detailDrawer.data.managerName}` : '-' }}
          </el-form-item>
          <el-form-item label="租户信息">
            {{ detailDrawer.data.tenantName ? `(${detailDrawer.data.tenantId})${detailDrawer.data.tenantName}` : '-' }}
          </el-form-item>
          <el-form-item label="日期">
            {{ detailDrawer.data.occurTime }}
          </el-form-item>
        </div>

        <!-- 后台展示 tabbar -->
        <div v-if="detailDrawer.type" class="msg-tabbar">
          <div class="msg-tab" :class="activeName === '0' ? 'msg-tab-on' : 'msg-tab-off'" @click="activeName = '0'">
            微信推送
          </div>
          <div class="msg-tab" :class="activeName === '1' ? 'msg-tab-on' : 'msg-tab-off'" @click="activeName = '1'">
            短信推送
          </div>
        </div>

        <!-- 微信 -->
        <div v-show="activeName === '0'" class="msg">
          <div v-if="content" class="section-title">消息内容</div>
          <div v-if="content" class="info-box">
            <el-row :gutter="20" style="width:100%">
              <el-col :span="24">
                <el-form-item style="margin-bottom:5px">
                  <span style="font-size:16px">{{ content.first }}</span>
                </el-form-item>
                <div v-for="(item, index) in content.content" :key="index" class="content-row">
                  <span>{{ item.label }} :</span>
                  <span>{{ item.value }}</span>
                </div>
                <div class="content-row">
                  <span>备注内容 :</span>
                  <span>{{ content.remark }}</span>
                </div>
              </el-col>
            </el-row>
          </div>

          <div v-if="detailDrawer.type" class="section-title">推送人员</div>
          <el-table v-if="detailDrawer.type" ref="table" :data="tableData" border max-height="22vh">
            <el-table-column label="账号Id">
              <template slot-scope="{ row }">{{ row.userId }}</template>
            </el-table-column>
            <el-table-column label="账号">
              <template slot-scope="{ row }">{{ row.userPhone }}</template>
            </el-table-column>
            <el-table-column label="微信">
              <template slot-scope="{ row }">
                <div v-if="row.wxHeadImgUrl" class="table-url">
                  <img :src="row.wxHeadImgUrl" alt="">
                  <span>{{ row.wxNickname }}</span>
                </div>
                <div v-else>{{ row.wxNickname || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="角色">
              <template slot-scope="{ row }">
                {{ roleTypeRead[row.role] ? roleTypeRead[row.role].label : (row.role || '-') }}
              </template>
            </el-table-column>
            <el-table-column label="状态码">
              <template slot-scope="{ row }">{{ row.errCode }}</template>
            </el-table-column>
            <el-table-column label="发送结果">
              <template slot-scope="{ row }">
                <span v-if="!row.errOmit">{{ row.errMsg }}</span>
                <el-popover v-else placement="bottom-start" trigger="hover" width="310" :content="row.errMsg">
                  <span slot="reference">{{ row.errOmit }}</span>
                </el-popover>
              </template>
            </el-table-column>
            <el-table-column label="服务器错误">
              <template slot-scope="{ row }">
                <span v-if="!row.serveOmit">{{ row.serverError }}</span>
                <el-popover v-else placement="bottom-start" trigger="hover" width="310" :content="row.serverError">
                  <span slot="reference">{{ row.serveOmit }}</span>
                </el-popover>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 短信 -->
        <div v-show="activeName === '1'" class="msg">
          <div v-if="smsContent" class="section-title">消息内容</div>
          <div v-if="smsContent" class="info-box">
            <el-row :gutter="20" style="width:100%">
              <el-col :span="24">
                <div class="content-row">
                  <span>消息内容 :</span>
                  <span>{{ smsContent }}</span>
                </div>
              </el-col>
            </el-row>
          </div>

          <div class="section-title">推送人员</div>
          <el-table ref="table" :data="msmData" border max-height="30vh">
            <el-table-column label="账号Id">
              <template slot-scope="{ row }">{{ row.userId }}</template>
            </el-table-column>
            <el-table-column label="账号" width="120">
              <template slot-scope="{ row }">{{ row.userPhone }}</template>
            </el-table-column>
            <el-table-column label="微信">
              <template slot-scope="{ row }">
                <div v-if="row.wxHeadImgUrl" class="table-url">
                  <img :src="row.wxHeadImgUrl" alt="">
                  <span>{{ row.wxNickname }}</span>
                </div>
                <div v-else>{{ row.wxNickname || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="角色">
              <template slot-scope="{ row }">
                {{ roleTypeRead[row.role] ? roleTypeRead[row.role].label : (row.role || '-') }}
              </template>
            </el-table-column>
            <el-table-column label="发送状态">
              <template slot-scope="{ row }">
                {{ smsSendStatusRead[row.sendStatus] ? smsSendStatusRead[row.sendStatus].label : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="发送时间" width="160">
              <template slot-scope="{ row }">{{ row.sendDate || '-' }}</template>
            </el-table-column>
            <el-table-column label="接收时间" width="160">
              <template slot-scope="{ row }">{{ row.receiveDate || '-' }}</template>
            </el-table-column>
            <el-table-column label="状态码" width="160">
              <template slot-scope="{ row }">{{ row.errCode || '-' }}</template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>
    </div>
  </el-drawer>
</template>

<script>
import { msgQueryMsgDetail } from '@/api/adminPush'

export default {
  name: 'AdminOperationPushMessageDetail',
  props: {
    detailDrawer: {
      type: Object,
      default () {
        return { show: false, data: {}, type: false }
      }
    }
  },
  data () {
    return {
      tableData: [],
      msmData: [],
      content: null,
      smsContent: null,
      activeName: '0',
      roleTypeRead: {
        SYS_ADMIN: { label: '系统管理员', value: 'SYS_ADMIN' },
        SUPER_MANAGER: { label: '超级管理员', value: 'SUPER_MANAGER' },
        SYS_FINANCE: { label: '系统财务', value: 'SYS_FINANCE' },
        MANAGER: { label: '管理方', value: 'MANAGER' },
        MANAGER_FINANCE: { label: '管理方二级权限', value: 'MANAGER_FINANCE' },
        MANAGER_TRIAL: { label: '管理方试用', value: 'MANAGER_TRIAL' },
        CONSTRUCT_DEBUG: { label: '施工调试', value: 'CONSTRUCT_DEBUG' },
        BUSINESS: { label: '商务', value: 'BUSINESS' },
        MA_ADMIN: { label: '运维管理员', value: 'MA_ADMIN' },
        TESTER: { label: '测试', value: 'TESTER' },
        VISITOR: { label: '访客', value: 'VISITOR' }
      },
      smsSendStatusList: [
        { label: '业务服务器请求错误', value: 0 },
        { label: '等待回执', value: 1 },
        { label: '发送失败', value: 2 },
        { label: '发送成功', value: 3 }
      ]
    }
  },
  computed: {
    smsSendStatusRead () {
      const map = {}
      this.smsSendStatusList.forEach(item => {
        map[item.value] = item
      })
      return map
    }
  },
  methods: {
    openDialod () {
      this.getTableData()
    },
    closeDialog () {
      this.detailDrawer.show = false
      this.activeName = '0'
    },
    decodeWxName (wxNickname) {
      if (!wxNickname) return wxNickname
      try {
        const arr = String(wxNickname).split(',')
        let name = decodeURIComponent(escape(String.fromCharCode(...arr)))
        if (name.indexOf(',') !== -1 && name.length > 15) {
          const again = this.decodeWxName(name)
          if (again.indexOf(',') === -1 || again.length < 15) return again
        }
        return name
      } catch (e) {
        return wxNickname
      }
    },
    formatContetn (data) {
      const pushContent = JSON.parse(data)
      const content = { first: '', remark: '', content: [] }
      pushContent.forEach(item => {
        const obj = { label: item.label, value: item.value, key: item.key, num: '' }
        if (item.key.indexOf('keyword') !== -1) {
          obj.num = item.key.replace(/keyword/g, '')
          content.content.push(obj)
        } else if (item.key === 'first') {
          content.first = item.value
        } else if (item.key === 'remark') {
          content.remark = item.value
        }
      })
      content.content = content.content.sort((a, b) => a.num - b.num)
      return content
    },
    async getTableData () {
      const { data } = await msgQueryMsgDetail({ msgRid: this.detailDrawer.data.rid })
      if (data.msgSmsDto && data.msgSmsDto.showContent) {
        this.smsContent = data.msgSmsDto.showContent
      } else {
        this.smsContent = false
      }
      if (data.msgWxDto && data.msgWxDto.showContent) {
        this.content = this.formatContetn(data.msgWxDto.showContent)
      } else {
        this.content = false
      }
      this.tableData = this.reserTableData(data.msgWxDetailDtoList)
      this.msmData = this.reserTableData(data.msgSmsDetailDtoList)
    },
    reserTableData (tableData) {
      const list = tableData || []
      list.forEach(item => {
        if (item.wxNickname) {
          item.wxNickname = this.decodeWxName(item.wxNickname)
        }
        if (item.errMsg && item.errMsg.length > 15 && item.errMsg !== 'ok') {
          item.errOmit = item.errMsg.slice(0, 15) + '...'
        } else {
          item.errOmit = false
        }
        if (!item.serverError) {
          item.serverError = '-'
          item.serveOmit = false
        } else if (item.serverError.length > 15) {
          item.serveOmit = item.serverError.slice(0, 15) + '...'
        } else {
          item.serveOmit = false
        }
      })
      return list
    }
  }
}
</script>

<style lang="scss" scoped>
.detail-body {
  padding: 0 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 20px;
  padding-left: 10px;
  margin: 16px 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  border-left: 4px solid #409eff;
}

.info-box {
  padding: 4px 0;
}

.msg-tabbar {
  display: flex;
  width: 240px;
  border: 1px solid #409eff;
  border-radius: 4px;
  margin: 16px 0 12px;
  overflow: hidden;
}

.msg-tab {
  width: 50%;
  height: 36px;
  line-height: 36px;
  text-align: center;
  font-size: 14px;
  cursor: pointer;
}

.msg-tab-on {
  color: #fff;
  background: #409eff;
}

.msg-tab-off {
  color: #409eff;
  background: #fff;
}

.content-row {
  display: flex;
  margin-bottom: 5px;
  line-height: 1.6;

  span:first-child {
    flex-shrink: 0;
    min-width: 90px;
    color: #606266;
  }
}

.table-url {
  display: flex;
  align-items: center;
  gap: 6px;

  img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }
}
</style>
