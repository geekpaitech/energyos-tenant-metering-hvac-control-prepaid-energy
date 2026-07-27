<template>
  <div v-loading="loading">
    <BusinessCharts ref="BusinessCharts" />
    <div class="tabbar">
      <div
        v-for="item in tabbar"
        :key="item.value"
        :class="bar === item.value ? 'onlist' : 'list'"
        style="position: relative"
        @click="changeBar(item)"
      >
        {{ item.label }}
        <div
          v-show="item.isData"
          style="position: absolute; right: 0; top: 0"
          class="dian-red"
        />
      </div>
    </div>
    <div v-if="tableData.length" class="tableBox">
      <!-- 电表绑定类型修改 -->
      <el-table v-if="bar === 2" :data="tableData">
        <el-table-column prop="occurTime" label="时间" width="160">
          <template slot-scope="scope">
            {{ scope.row.occurTime }}
          </template>
        </el-table-column>
        <el-table-column label="绑定类型">
          <template slot-scope="scope">
            {{
              MeterBindTypeRead[scope.row.bindType]
                ? MeterBindTypeRead[scope.row.bindType].label
                : "-"
            }}
          </template>
        </el-table-column>
        <el-table-column prop="userId" label="操作账号ID">
          <template slot-scope="scope">
            <span class="">
              {{ scope.row.userId }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="userPhone" label="操作人账号">
          <template slot-scope="scope">
            <el-tooltip placement="top">
              <div slot="content">
                <div>用户名称:{{ scope.row.userName }}</div>
                <div>账号(手机号):{{ scope.row.userPhone }}</div>
                <div>角色:{{ scope.row.roleName }}</div>
                <div class="table-url">
                  微信昵称:
                  <img :src="scope.row.wxHeadImgUrl" alt="">
                  {{ scope.row.wxNickname }}
                </div>
              </div>
              <span class="interaction">{{ scope.row.userPhone }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <!-- 电表充值 -->
      <el-table v-else-if="bar === 3" :data="tableData">
        <el-table-column prop="createTime" label="时间" width="160">
          <template slot-scope="scope">
            {{ scope.row.createTime }}
          </template>
        </el-table-column>
        <el-table-column label="充值金额(元)" width="130">
          <template slot-scope="scope">
            <span v-money="scope.row.chargeMoney" />
          </template>
        </el-table-column>
        <el-table-column label="充值类型">
          <template slot-scope="scope">
            {{
              MeterChargeTypeRead[scope.row.chargeType]
                ? MeterChargeTypeRead[scope.row.chargeType].label
                : "-"
            }}
          </template>
        </el-table-column>
        <el-table-column prop="occurDate" label="结算日期" width="140">
          <template slot-scope="scope">
            {{ scope.row.occurDate }}
          </template>
        </el-table-column>
        <el-table-column prop="occurTime" label="结算时间" width="180">
          <template slot-scope="scope">
            {{ scope.row.occurTime || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="返回详情">
          <template slot-scope="scope">
            <el-popover
              placement="top-start"
              width="300"
              trigger="hover"
              :content="scope.row.retDetail"
            >
              <span slot="reference" class="interaction">查看</span>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="下发详情">
          <template slot-scope="scope">
            <el-popover
              placement="top-start"
              width="300"
              trigger="hover"
              :content="scope.row.sendDetail"
            >
              <span slot="reference" class="interaction">查看</span>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="服务器异常" width="100">
          <template slot-scope="scope">
            <el-popover
              placement="top-start"
              width="300"
              trigger="hover"
              :content="scope.row.serverError ? scope.row.serverError : '-'"
            >
              <span slot="reference" class="interaction">查看</span>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="起始">
          <template slot-scope="scope">
            <el-popover
              placement="top-start"
              width="300"
              trigger="hover"
              :content="scope.row.startRecord ? scope.row.startRecord : '-'"
            >
              <span slot="reference" class="interaction">查看</span>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column prop="syncTime" label="数据同步时间" width="140">
          <template slot-scope="scope">
            {{ scope.row.syncTime || "-" }}
          </template>
        </el-table-column>
      </el-table>
      <!-- 电表启停 -->
      <el-table v-else-if="bar === 4" :data="tableData">
        <el-table-column prop="occurTime" label="时间" width="160">
          <template slot-scope="scope">
            {{ scope.row.createTime }}
          </template>
        </el-table-column>
        <el-table-column prop="recordId" label="id">
          <template slot-scope="scope">
            {{ scope.row.recordId }}
          </template>
        </el-table-column>
        <el-table-column label="操作类型">
          <template slot-scope="scope">
            {{ scope.row.enableType ? "启用" : "停用" }}
          </template>
        </el-table-column>
        <el-table-column prop="userId" label="操作账号id">
          <template slot-scope="scope">
            {{ scope.row.userId }}
          </template>
        </el-table-column>
        <el-table-column prop="userPhone" label="操作人账号">
          <template slot-scope="scope">
            <el-tooltip placement="top">
              <div slot="content">
                <div>用户名称:{{ scope.row.userName }}</div>
                <div>账号(手机号):{{ scope.row.userPhone }}</div>
                <div>角色:{{ scope.row.roleName }}</div>
                <div class="table-url">
                  微信昵称:
                  <img :src="scope.row.wxHeadImgUrl" alt="">
                  {{ scope.row.wxNickname }}
                </div>
              </div>
              <span class="interaction">{{ scope.row.userPhone }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <!-- 电表付费模式修改 -->
      <el-table v-else-if="bar === 5" :data="tableData">
        <el-table-column prop="occurTime" label="时间" width="160">
          <template slot-scope="scope">
            {{ scope.row.occurTime }}
          </template>
        </el-table-column>
        <el-table-column label="修改方式">
          <template slot-scope="scope">
            {{
              MeterPayType[scope.row.logicPayType]
                ? MeterPayType[scope.row.logicPayType].label
                : "-"
            }}
          </template>
        </el-table-column>
        <el-table-column prop="userId" label="操作账号ID">
          <template slot-scope="scope">
            {{ scope.row.userId }}
          </template>
        </el-table-column>
        <el-table-column prop="userPhone" label="操作人账号">
          <template slot-scope="scope">
            <el-tooltip placement="top">
              <div slot="content">
                <div>用户名称:{{ scope.row.userName }}</div>
                <div>账号(手机号):{{ scope.row.userPhone }}</div>
                <div>角色:{{ scope.row.roleName }}</div>
                <div class="table-url">
                  微信昵称:
                  <img :src="scope.row.wxHeadImgUrl" alt="">
                  {{ scope.row.wxNickname }}
                </div>
              </div>
              <span class="interaction">{{ scope.row.userPhone }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <!-- 查询电表上下线 -->
      <el-table v-else-if="bar === 6" :data="tableData">
        <el-table-column prop="occurTime" label="时间" width="160">
          <template slot-scope="scope">
            {{ scope.row.occurTime }}
          </template>
        </el-table-column>
        <el-table-column label="上下线类型" width="130">
          <template slot-scope="scope">
            <div
              v-if="MeterOnlineStatus[scope.row.onOffType]"
              class="class-state"
            >
              <div :class="MeterOnlineStatus[scope.row.onOffType].class" />
              {{ MeterOnlineStatus[scope.row.onOffType].label }}
            </div>
            <div v-else>-</div>
          </template>
        </el-table-column>
        <el-table-column label="上报频率">
          <template slot-scope="scope">
            {{ scope.row.period || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="新号强度">
          <template slot-scope="scope">
            {{ scope.row.signal || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="sim卡号" width="180">
          <template slot-scope="scope">
            {{ scope.row.simCardNo || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="version1">
          <template slot-scope="scope">
            {{ scope.row.version1 || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="version2">
          <template slot-scope="scope">
            {{ scope.row.version2 || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="version3">
          <template slot-scope="scope">
            {{ scope.row.version3 || "-" }}
          </template>
        </el-table-column>
      </el-table>
      <!-- 查询电表调价 -->
      <el-table v-else-if="bar === 7" :data="tableData">
        <el-table-column prop="occurTime" label="时间" width="160">
          <template slot-scope="scope">
            {{ scope.row.occurTime }}
          </template>
        </el-table-column>
        <el-table-column prop="priceId" label="方案ID">
          <template slot-scope="scope">
            {{ scope.row.priceId }}
          </template>
        </el-table-column>
        <el-table-column prop="priceName" label="方案名称">
          <template slot-scope="scope">
            {{ scope.row.priceName }}
          </template>
        </el-table-column>
        <el-table-column prop="powerPeakPrice" label="尖电价">
          <template slot-scope="scope">
            {{ scope.row.powerPeakPrice }}
          </template>
        </el-table-column>
        <el-table-column prop="powerTopPrice" label="峰电价">
          <template slot-scope="scope">
            {{ scope.row.powerTopPrice }}
          </template>
        </el-table-column>
        <el-table-column prop="powerFlatPrice" label="平电价">
          <template slot-scope="scope">
            {{ scope.row.powerFlatPrice }}
          </template>
        </el-table-column>
        <el-table-column prop="powerValleyPrice" label="谷电价">
          <template slot-scope="scope">
            {{ scope.row.powerValleyPrice }}
          </template>
        </el-table-column>
        <el-table-column label="改价结果">
          <template slot-scope="scope">
            {{ scope.row.result == "SUCCESS" ? "成功" : "失败" }}
          </template>
        </el-table-column>
        <el-table-column label="结果描述">
          <template slot-scope="scope">
            <el-popover
              placement="top-start"
              width="300"
              trigger="hover"
              :content="scope.row.resultDesc"
            >
              <span slot="reference" class="interaction">查看</span>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="重试时间">
          <template slot-scope="scope">
            {{ scope.row.retryTime || "-" }}
          </template>
        </el-table-column>
      </el-table>
      <!-- 查询电表结算 -->
      <el-table v-else-if="bar === 8" :data="tableData">
        <el-table-column prop="createTime" label="时间" width="160">
          <template slot-scope="scope">
            {{ scope.row.createTime || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="occurDate" label="结算日期" width="120">
          <template slot-scope="scope">
            {{ scope.row.occurDate }}
          </template>
        </el-table-column>
        <el-table-column prop="occurTime" label="结算时间" width="160">
          <template slot-scope="scope">
            {{ scope.row.occurTime }}
          </template>
        </el-table-column>
        <el-table-column label="结算金额(元)" width="140">
          <template slot-scope="scope">
            <span v-money="scope.row.balance" />
          </template>
        </el-table-column>
        <el-table-column label="区间结算处理的充值下发ID" width="190">
          <template slot-scope="scope">
            {{ scope.row.calMeterChargeIds || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="结算起始" width="130">
          <template slot-scope="scope">
            <el-popover
              placement="top-start"
              width="300"
              trigger="hover"
              :content="scope.row.startRecord"
            >
              <span slot="reference" class="interaction">查看</span>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column width="130" label="结算结束">
          <template slot-scope="scope">
            <el-popover
              placement="top-start"
              width="300"
              trigger="hover"
              :content="scope.row.endRecord"
            >
              <span slot="reference" class="interaction">查看</span>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column
          prop="meterChargeId"
          width="150"
          label="本次结算充值下发ID"
        >
          <template slot-scope="scope">
            {{ scope.row.meterChargeId || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="useElec" width="140" label="总用电量（kWh）">
          <template slot-scope="scope">
            {{ scope.row.useElec }}
          </template>
        </el-table-column>
        <el-table-column prop="useElecPeak" width="140" label="尖用电量（kWh）">
          <template slot-scope="scope">
            {{ scope.row.useElecPeak }}
          </template>
        </el-table-column>
        <el-table-column prop="useElecTop" width="140" label="峰用电量（kWh）">
          <template slot-scope="scope">
            {{ scope.row.useElecTop }}
          </template>
        </el-table-column>
        <el-table-column prop="useElecFlat" width="140" label="平用电量（kWh）">
          <template slot-scope="scope">
            {{ scope.row.useElecFlat }}
          </template>
        </el-table-column>
        <el-table-column
          prop="useElecValley"
          width="140"
          label="谷用电量（kWh）"
        >
          <template slot-scope="scope">
            {{ scope.row.useElecValley }}
          </template>
        </el-table-column>
        <el-table-column label="用量类型">
          <template slot-scope="scope">
            {{
              MeterUseTypeRead[scope.row.useType]
                ? MeterUseTypeRead[scope.row.useType].label
                : "-"
            }}
          </template>
        </el-table-column>
        <el-table-column prop="serviceBalance" label="服务费">
          <template slot-scope="scope">
            {{ scope.row.serviceBalance }}
          </template>
        </el-table-column>
        <el-table-column prop="servicePeak" label="尖服务费">
          <template slot-scope="scope">
            {{ scope.row.servicePeak }}
          </template>
        </el-table-column>
        <el-table-column prop="serviceTop" label="峰服务费">
          <template slot-scope="scope">
            {{ scope.row.serviceTop }}
          </template>
        </el-table-column>
        <el-table-column prop="serviceFlat	" label="平服务费">
          <template slot-scope="scope">
            {{ scope.row.serviceFlat }}
          </template>
        </el-table-column>
        <el-table-column prop="serviceValley" label="谷服务费">
          <template slot-scope="scope">
            {{ scope.row.serviceValley }}
          </template>
        </el-table-column>
      </el-table>
      <!-- 查询电表分合闸 -->
      <el-table v-else-if="bar === 9" :data="tableData">
        <el-table-column prop="occurTime" label="时间" width="160">
          <template slot-scope="scope">
            {{ scope.row.occurTime || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="bindType" label="绑定类型" width="120">
          <template slot-scope="scope">
            {{
              MeterBindTypeRead[scope.row.bindType]
                ? MeterBindTypeRead[scope.row.bindType].label
                : "-"
            }}
          </template>
        </el-table-column>
        <el-table-column label="服务器错误" width="120">
          <template slot-scope="scope">
            {{ scope.row.serverError || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="请求内容" width="120">
          <template slot-scope="scope">
            <el-popover
              placement="top-start"
              width="300"
              trigger="hover"
              :content="scope.row.switchReq"
            >
              <span slot="reference" class="interaction">查看</span>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="响应内容" width="120">
          <template slot-scope="scope">
            <el-popover
              placement="top-start"
              width="300"
              trigger="hover"
              :content="scope.row.switchResp"
            >
              <span slot="reference" class="interaction">查看</span>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="操作结果">
          <template slot-scope="scope">
            {{ scope.row.switchRet === "SUCCESS" ? "成功" : "失败" }}
          </template>
        </el-table-column>
        <el-table-column label="合闸状态">
          <template slot-scope="scope">
            <div
              v-if="MeterSwitchStatusRead[scope.row.switchStatus]"
              :class="MeterSwitchStatusRead[scope.row.switchStatus].class"
            >
              {{ MeterSwitchStatusRead[scope.row.switchStatus].label }}
            </div>
            <div v-else>-</div>
          </template>
        </el-table-column>
        <el-table-column prop="tenantBalance" label="租户余额(元)" width="120">
          <template slot-scope="scope">
            <span v-money="scope.row.tenantBalance" />
          </template>
        </el-table-column>
        <el-table-column prop="tenantOverdraw" label="租户透支额度" width="130">
          <template slot-scope="scope">
            <span v-money="scope.row.tenantOverdraw" />
          </template>
        </el-table-column>
        <el-table-column prop="userId" label="操作人Id">
          <template slot-scope="scope">
            {{ scope.row.userId }}
          </template>
        </el-table-column>
        <el-table-column prop="userPhone" label="操作人账号" width="150">
          <template slot-scope="scope">
            <el-tooltip placement="top">
              <div slot="content">
                <div>用户名称:{{ scope.row.userName }}</div>
                <div>账号(手机号):{{ scope.row.userPhone }}</div>
                <div>角色:{{ scope.row.roleName }}</div>
                <div class="table-url">
                  微信昵称:
                  <img :src="scope.row.wxHeadImgUrl" alt="">
                  {{ scope.row.wxNickname }}
                </div>
              </div>
              <span class="interaction">{{ scope.row.userPhone }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <!-- 查询电表绑定 -->
      <el-table v-else-if="bar === 10" :data="tableData">
        <el-table-column prop="occurTime" label="时间" width="160">
          <template slot-scope="scope">
            {{ scope.row.occurTime }}
          </template>
        </el-table-column>
        <el-table-column prop="bindId" label="绑定ID">
          <template slot-scope="scope">
            {{ scope.row.bindId }}
          </template>
        </el-table-column>
        <el-table-column prop="bindName" label="绑定名称">
          <template slot-scope="scope">
            {{ scope.row.bindName }}
          </template>
        </el-table-column>
        <el-table-column prop="userId" label="操作人Id">
          <template slot-scope="scope">
            {{ scope.row.userId }}
          </template>
        </el-table-column>
        <el-table-column prop="userPhone" label="操作人账号">
          <template slot-scope="scope">
            <el-tooltip placement="top">
              <div slot="content">
                <div>用户名称:{{ scope.row.userName }}</div>
                <div>账号(手机号):{{ scope.row.userPhone }}</div>
                <div>角色:{{ scope.row.roleName }}</div>
                <div class="table-url">
                  微信昵称:
                  <img :src="scope.row.wxHeadImgUrl" alt="">
                  {{ scope.row.wxNickname }}
                </div>
              </div>
              <span class="interaction">{{ scope.row.userPhone }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="bindType" label="绑定类型">
          <template slot-scope="scope">
            {{
              MeterBindTypeRead[scope.row.bindType]
                ? MeterBindTypeRead[scope.row.bindType].label
                : "-"
            }}
          </template>
        </el-table-column>
      </el-table>
      <!-- 查询电表解绑 -->
      <el-table v-else-if="bar === 11" :data="tableData">
        <el-table-column prop="occurTime" label="时间">
          <template slot-scope="scope">
            {{ scope.row.occurTime }}
          </template>
        </el-table-column>
        <el-table-column prop="userId" label="操作人Id">
          <template slot-scope="scope">
            {{ scope.row.userId }}
          </template>
        </el-table-column>
        <el-table-column prop="userPhone" label="操作人账号">
          <template slot-scope="scope">
            <el-tooltip placement="top">
              <div slot="content">
                <div>用户名称:{{ scope.row.userName }}</div>
                <div>账号(手机号):{{ scope.row.userPhone }}</div>
                <div>角色:{{ scope.row.roleName }}</div>
                <div class="table-url">
                  微信昵称:
                  <img :src="scope.row.wxHeadImgUrl" alt="">
                  {{ scope.row.wxNickname }}
                </div>
              </div>
              <span class="interaction">{{ scope.row.userPhone }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="bindType" label="绑定类型">
          <template slot-scope="scope">
            {{
              MeterBindTypeRead[scope.row.bindType]
                ? MeterBindTypeRead[scope.row.bindType].label
                : "-"
            }}
          </template>
        </el-table-column>
      </el-table>
      <!-- 查询电表创建 -->
      <el-table v-else-if="bar === 12" :data="tableData">
        <el-table-column prop="occurTime" label="时间">
          <template slot-scope="scope">
            {{ scope.row.occurTime }}
          </template>
        </el-table-column>
        <el-table-column prop="userId" label="操作Id">
          <template slot-scope="scope">
            {{ scope.row.userId }}
          </template>
        </el-table-column>
        <el-table-column prop="userPhone" label="操作人账号">
          <template slot-scope="scope">
            <el-tooltip placement="top">
              <div slot="content">
                <div>用户名称:{{ scope.row.userName }}</div>
                <div>账号(手机号):{{ scope.row.userPhone }}</div>
                <div>角色:{{ scope.row.roleName }}</div>
                <div class="table-url">
                  微信昵称:
                  <img :src="scope.row.wxHeadImgUrl" alt="">
                  {{ scope.row.wxNickname }}
                </div>
              </div>
              <span class="interaction">{{ scope.row.userPhone }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="bindType" label="绑定类型">
          <template slot-scope="scope">
            {{
              MeterBindTypeRead[scope.row.bindType]
                ? MeterBindTypeRead[scope.row.bindType].label
                : "-"
            }}
          </template>
        </el-table-column>
      </el-table>
      <!-- 查询电表心跳 -->
      <el-table v-else-if="bar === 13" :data="tableData">
        <el-table-column prop="occurTime" label="时间">
          <template slot-scope="scope">
            {{ scope.row.occurTime }}
          </template>
        </el-table-column>
        <el-table-column prop="remote" label="设备地址">
          <template slot-scope="scope">
            {{ scope.row.remote }}
          </template>
        </el-table-column>
      </el-table>
      <!-- 查询电表CT值变更 -->
      <el-table v-else-if="bar === 14" :data="tableData">
        <el-table-column prop="occurTime" label="时间">
          <template slot-scope="scope">
            {{ scope.row.occurTime }}
          </template>
        </el-table-column>
        <el-table-column label="原CT值">
          <template slot-scope="scope">
            {{ scope.row.oldCT }}
          </template>
        </el-table-column>
        <el-table-column label="新CT值">
          <template slot-scope="scope">
            {{ scope.row.newCT }}
          </template>
        </el-table-column>
      </el-table>
      <!-- 查询电表余额大于0 -->
      <el-table v-else-if="bar === 15" :data="tableData">
        <el-table-column prop="occurTime" label="时间">
          <template slot-scope="scope">
            {{ scope.row.occurTime }}
          </template>
        </el-table-column>
        <el-table-column label="电表余额">
          <template slot-scope="scope">
            {{ scope.row.meterBalance }}
          </template>
        </el-table-column>
      </el-table>
      <!-- pt变更报警记录 -->
      <el-table v-else-if="bar === 16" :data="tableData">
        <el-table-column label="时间">
          <template slot-scope="scope">
            {{ scope.row.occurTime }}
          </template>
        </el-table-column>
        <el-table-column label="原PT值">
          <template slot-scope="scope">
            {{ scope.row.oldPT }}
          </template>
        </el-table-column>
        <el-table-column label="新PT值">
          <template slot-scope="scope">
            {{ scope.row.newPT }}
          </template>
        </el-table-column>
      </el-table>
      <!-- 电价修复 -->
      <el-table v-else-if="bar === 17" :data="tableData">
        <el-table-column label="开始时间" width="180">
          <template slot-scope="scope">
            {{ scope.row.createTime }}
          </template>
        </el-table-column>
        <el-table-column label="处理时间" width="180">
          <template slot-scope="scope">
            {{ scope.row.occurTime }}
          </template>
        </el-table-column>
        <el-table-column label="事件源（事件源Id）" width="180">
          <template slot-scope="scope">
            <div v-if="MeterPriceSourceRead[scope.row.source]">
              {{
                MeterPriceSourceRead[scope.row.source].label +
                  "(" +
                  scope.row.sourceId +
                  ")"
              }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="重试次数" width="100">
          <template slot-scope="scope">
            {{ scope.row.retryCount }}
          </template>
        </el-table-column>
        <el-table-column label="处理结果" width="100">
          <template slot-scope="scope">
            {{ scope.row.result }}
          </template>
        </el-table-column>
        <el-table-column label="处理说明" width="100">
          <template slot-scope="scope">
            <el-popover
              placement="top-start"
              width="300"
              trigger="hover"
              :content="scope.row.reason"
            >
              <span slot="reference" class="interaction">查看</span>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="电价Id">
          <template slot-scope="scope">
            {{ scope.row.priceId }}
          </template>
        </el-table-column>
        <el-table-column label="价格(尖/峰/平/谷)" width="220">
          <template slot-scope="scope">
            {{
              scope.row.powerPeakPrice +
                "/" +
                scope.row.powerTopPrice +
                "/" +
                scope.row.powerFlatPrice +
                "/" +
                scope.row.powerValleyPrice
            }}
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-empty v-else description="暂无数据" />
  </div>
</template>

<script>
import BusinessCharts from './businessChart.vue'
import {
  meterLiveGetMeterBindTypeList,
  meterLiveGetMeterChargeList,
  meterLiveGetMeterEnableList,
  meterLiveGetMeterLogicPayTypeList,
  meterLiveGetMeterOnOffLineList,
  meterLiveGetMeterPriceModifyList,
  meterLiveGetMeterSettleList,
  meterLiveGetMeterSwitchList,
  meterLiveGetMeterBindList,
  meterLiveGetMeterCreateList,
  meterLiveGetMeterHeartbeatList,
  meterLiveGetMeterCtList,
  meterLiveGetMeterBalanceOverZoneList,
  meterLiveGetMeterPtList,
  meterLiveGetMeterPriceRepairList
  , userBaseInfoByPhone
} from '@/api/adminDb'
import {
  MeterBindType,
  MeterChargeType,
  MeterUseType,
  MeterPayType,
  MeterOnlineStatus,
  MeterBindTypeRead,
  MeterUseTypeRead,
  MeterSwitchStatusRead,
  MeterChargeTypeRead,
  MeterPriceSourceRead,
  RoleTypeRead
} from '../monitorEnums'

export default {
  components: {
    BusinessCharts
  },
  computed: {
    managerId () {
      return this.$store.state.manager?.currentManagerId || ''
    },
    loading () {
      return false
    },
    theme () {
      return 'light'
    },
    MeterBindType () { return MeterBindType },
    MeterChargeType () { return MeterChargeType },
    MeterUseType () { return MeterUseType },
    MeterPayType () { return MeterPayType },
    MeterOnlineStatus () { return MeterOnlineStatus }
  },
  props: {
    queryData: {
      type: Object,
      default () {
        return {
          id: '',
          serial: '',
          timeRange: ['', '']
        }
      }
    },
    businessRead: {
      type: Array
    }
  },
  data () {
    return {
      bar: 2,
      tableData: [],

      tabbar: [],
      businessLable: {},

      // 是否是切换tabbar
      isReturn: false,

      MeterUseTypeRead,
      MeterBindTypeRead,
      MeterSwitchStatusRead,
      MeterChargeTypeRead,
      MeterPriceSourceRead,
      RoleTypeRead,

      // 图表
      isChart: false,

      query: {
        endTime: '',
        startTime: this.queryData.timeRange[0],
        serial: this.queryData.serial
      }
    }
  },
  created () {},
  methods: {
    async changeBar (item) {
      if (!item.isData) {
        this.$message.warning(`暂无${item.label}数据`)
        return
      }

      if (this.bar === item.value) {
        return
      }

      this.bar = item.value
      if (item.tableData && item.tableData.length) {
        if (item.tableData[0].userPhone) {
          // 查询用户信息
          this.tableData = await this.getUserData(item.tableData, item.value)
        } else {
          // 已有数据不用调用接口
          this.tableData = item.tableData
        }
        return
      }
      this.onSearch()
    },
    onSearch () {
      // 筛选条件
      this.query = {
        endTime: this.queryData.timeRange[1],
        startTime: this.queryData.timeRange[0],
        serial: this.queryData.serial
      }

      const bar = this.bar
      if (!this.query.serial) {
        this.$message.warning('请输入电表序列号')
        return
      }
      this.isReturn = true
      /* loading */
      if (bar === 2) {
        this.getMeterBindTypeList(2)
      } else if (bar === 3) {
        this.getMeterChargeList(3)
      } else if (bar === 4) {
        this.getGetMeterEnableList(4)
      } else if (bar === 5) {
        this.getMeterLogicPayTypeList(5)
      } else if (bar === 6) {
        this.getMeterOnOffLineList(6)
      } else if (bar === 7) {
        this.getLiveGetMeterPriceModifyList(7)
      } else if (bar === 8) {
        this.getMeterSettleList(8)
      } else if (bar === 9) {
        this.getMeterSwitchList(9)
      } else if (bar === 10) {
        this.getMeterLiveGetMeterBindList(10)
      } else if (bar === 11) {
        this.getMeterLiveGetMeterUnBindList(11)
      } else if (bar === 12) {
        this.getMeterLiveGetMeterCreateList(12)
      } else if (bar === 13) {
        this.getMeterLiveGetMeterHeartbeatList(13)
      } else if (bar === 14) {
        this.getMeterLiveGetMeterCtList(14)
      } else if (bar === 15) {
        this.getMeterLiveGetMeterBalanceOverZoneList(15)
      } else if (bar === 16) {
        this.getMeterLiveGetMeterPtList(16)
      } else if (bar === 17) {
        this.getMeterLiveGetMeterPriceRepairList(17)
      }
    },
    // 图表数据
    returnData (bars) {
      console.log(bars, 'bars')
      // 筛选条件
      this.query = {
        endTime: this.queryData.timeRange[1],
        startTime: this.queryData.timeRange[0],
        serial: this.queryData.serial
      }
      if (!this.queryData.serial) {
        this.$message.warning('请输入电表序列号')
        return
      }
      this.tabbar = bars
      this.businessLable = {}
      this.businessRead.forEach(item => {
        this.businessLable[item.value] = item.label
      })
      const bar = this.tabbar.find(item => item.isData)
      this.bar = bar ? bar.value : 2
      const requestObj = {
        2: this.getMeterBindTypeList(2),
        3: this.getMeterChargeList(3),
        4: this.getGetMeterEnableList(4),
        5: this.getMeterLogicPayTypeList(5),
        6: this.getMeterOnOffLineList(6),
        7: this.getLiveGetMeterPriceModifyList(7),
        8: this.getMeterSettleList(8),
        9: this.getMeterSwitchList(9),
        10: this.getMeterLiveGetMeterBindList(10),
        11: this.getMeterLiveGetMeterUnBindList(11),
        12: this.getMeterLiveGetMeterCreateList(12),
        // 13: this.getMeterLiveGetMeterHeartbeatList(13),
        14: this.getMeterLiveGetMeterCtList(14),
        15: this.getMeterLiveGetMeterBalanceOverZoneList(15),
        16: this.getMeterLiveGetMeterPtList(16),
        17: this.getMeterLiveGetMeterPriceRepairList(17)
      }

      if (bars.length) {
        const requestData = bars.map(item => requestObj[item.value])
        const lengthData = []
        let num = 0
        Promise.all(requestData).then(res => {
          const returnData = []
          res.forEach(item => {
            if (item) {
              // 给予表单数据
              if (item.id === this.bar) {
                this.tableData = item.data
              }
              if (item.data.length) {
                lengthData.push(item.name)
                const color = this.domColor()
                item.data.forEach(itm => {
                  returnData.push([
                    itm.createTime || itm.occurTime, // 时间
                    num, // echart高度
                    item.name,
                    itm,
                    color // 颜色
                  ])
                })
                num += 1
              }
            }
          })

          this.$refs.BusinessCharts.getOptionData(returnData, lengthData, [
            this.query.startTime,
            this.query.endTime
          ])
        })
      }
    },
    // 随机生成点颜色
    domColor () {
      const r = Math.floor(Math.random() * 256)
      const g = Math.floor(Math.random() * 256)
      const b = Math.floor(Math.random() * 256)
      return `rgb(${r},${g},${b})`
    },
    // 账号信息
    async getUserData (tableData, val) {
      const query = tableData.map(item => item.userPhone)
      if (query.length === 0 || this.bar != val) {
        return tableData
      }
      const { data } = await userBaseInfoByPhone(query)
      const mapData = []
      await tableData.forEach(async item => {
        const obj = data[item.userPhone]
        if (obj) {
          item.roleName = obj.role && this.RoleTypeRead[obj.role]
            ? this.RoleTypeRead[obj.role].label
            : '-'
          item.userName = obj.name
          item.wxHeadImgUrl = obj.wxHeadImgUrl
          if (obj.wxNickname) {
            item.wxNickname = await this.$store.dispatch('methods/decodeWxName', obj.wxNickname)
          }
        }
        mapData.push(item)
      })

      return mapData
    },
    // 电表绑定类型修改
    async getMeterBindTypeList (val) {
      const { data } = await meterLiveGetMeterBindTypeList(this.query)
      const map = await this.getUserData(data, val)
      return this.haveDataDisplay(val, this.businessLable[val], map)
    },
    // 查询电表充值
    async getMeterChargeList (val) {
      const { data } = await meterLiveGetMeterChargeList(this.query)
      return this.haveDataDisplay(val, this.businessLable[val], data)
    },
    // 查询电表启停
    async getGetMeterEnableList (val) {
      const { data } = await meterLiveGetMeterEnableList(this.query)
      const map = await this.getUserData(data, val)
      return this.haveDataDisplay(val, this.businessLable[val], map)
    },
    // 查询电表付费模式修改
    async getMeterLogicPayTypeList (val) {
      const { data } = await meterLiveGetMeterLogicPayTypeList(this.query)
      const map = await this.getUserData(data, val)
      return this.haveDataDisplay(val, this.businessLable[val], map)
    },
    // 查询电表上下线
    async getMeterOnOffLineList (val) {
      const { data } = await meterLiveGetMeterOnOffLineList(this.query)

      return this.haveDataDisplay(val, this.businessLable[val], data)
    },
    // 查询电表调价
    async getLiveGetMeterPriceModifyList (val) {
      const { data } = await meterLiveGetMeterPriceModifyList(this.query)

      return this.haveDataDisplay(val, this.businessLable[val], data)
    },
    // 查询电表结算
    async getMeterSettleList (val) {
      const { data } = await meterLiveGetMeterSettleList(this.query)

      return this.haveDataDisplay(val, this.businessLable[val], data)
    },
    // 查询电表分合闸
    async getMeterSwitchList (val) {
      const { data } = await meterLiveGetMeterSwitchList(this.query)
      const map = await this.getUserData(data, val)
      return this.haveDataDisplay(val, this.businessLable[val], map)
    },
    // 查询电表绑定
    async getMeterLiveGetMeterBindList (val) {
      const query = { ...this.query, modifyType: 5 }
      const { data } = await meterLiveGetMeterBindList(query)
      const map = await this.getUserData(data, val)
      return this.haveDataDisplay(val, this.businessLable[val], map)
    },
    // 查询电表解绑
    async getMeterLiveGetMeterUnBindList (val) {
      const query = { ...this.query, modifyType: 6 }
      const { data } = await meterLiveGetMeterBindList(query)
      const map = await this.getUserData(data, val)
      return this.haveDataDisplay(val, this.businessLable[val], map)
    },
    // 查询电表创建
    async getMeterLiveGetMeterCreateList (val) {
      const { data } = await meterLiveGetMeterCreateList(this.query)
      const map = await this.getUserData(data, val)
      return this.haveDataDisplay(val, this.businessLable[val], map)
    },
    // 查询电表心跳
    async getMeterLiveGetMeterHeartbeatList (val) {
      const { data } = await meterLiveGetMeterHeartbeatList(this.query)

      return this.haveDataDisplay(val, this.businessLable[val], data)
    },
    // 查询电表CT值变更记录
    async getMeterLiveGetMeterCtList (val) {
      const { data } = await meterLiveGetMeterCtList(this.query)

      return this.haveDataDisplay(val, this.businessLable[val], data)
    },
    // 查询电表余额大于零记录
    async getMeterLiveGetMeterBalanceOverZoneList (val) {
      const { data } = await meterLiveGetMeterBalanceOverZoneList(this.query)

      return this.haveDataDisplay(val, this.businessLable[val], data)
    },
    // pt变更报警记录
    async getMeterLiveGetMeterPtList (val) {
      const { data } = await meterLiveGetMeterPtList(this.query)

      return this.haveDataDisplay(val, this.businessLable[val], data)
    },
    // 电价修复
    async getMeterLiveGetMeterPriceRepairList (val) {
      const { data } = await meterLiveGetMeterPriceRepairList(this.query)
      return this.haveDataDisplay(val, this.businessLable[val], data)
    },
    // 数据处理
    haveDataDisplay (id, name, data) {
      /* loaded */;

      const INDEX = this.businessRead.findIndex(item => item.value === id)
      if (INDEX < 0) return
      if (data.length) {
        this.businessRead[INDEX].isData = data.length
        this.businessRead[INDEX].tableData = data
      } else {
        this.businessRead[INDEX].isData = false
      }

      if (this.isReturn) {
        // tabbar 切换只请求一个接口
        this.tableData = data
      } else {
        // 请求所有接口
        return {
          name,
          data,
          id
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.tabbar {
  width: 100%;
  display: flex;
  overflow-x: scroll;
  .list,
  .onlist {
    width: auto;
    height: 40px;
    white-space: nowrap;
    line-height: 30px;
    margin-right: 20px;
    padding-left: 10px;
    padding-right: 14px;
    border-bottom: 2px solid transparent;
    text-align: center;
    color: var(--font-0);
    cursor: pointer;
  }
  .onlist {
    border-color: var(--fun-1);
  }
}
.tableBox {
  width: 100%;
  overflow: hidden;
  height: 70vh;
  overflow-y: scroll;
}

.dian-red {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f56c6c;
  box-shadow: 0 0 0 1px #fff;
}
</style>
