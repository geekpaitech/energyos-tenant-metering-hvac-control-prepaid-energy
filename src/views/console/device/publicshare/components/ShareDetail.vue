<template>
  <div class="share-detail-container" v-loading="pageLoading">
    <!-- 返回按钮 -->
    <div class="page-header">
      <el-button type="text" icon="el-icon-arrow-left" @click="goBack">返回列表</el-button>
    </div>

    <!-- 公摊信息区域 -->
    <el-card class="info-card" shadow="never">
      <div slot="header" class="card-header">
        <span class="header-title"><i class="el-icon-document"></i> 公摊信息</span>
        <el-button type="primary" size="small" icon="el-icon-edit" @click="handleModifyShare">修改</el-button>
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

    <!-- 租户信息和设备信息 -->
    <el-row :gutter="20" class="content-row">
      <!-- 左侧：租户信息 -->
      <el-col :span="14">
        <el-card class="tenant-card" shadow="never">
          <div slot="header" class="card-header">
            <span class="header-title">租户信息</span>
            <el-button type="primary" size="small" icon="el-icon-link" @click="handleBindTenant">关联/解绑租户</el-button>
          </div>
          <el-table :data="tenantList" stripe style="width: 100%" max-height="500" :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: '600',
          }">
            <el-table-column prop="tenantName" label="租户名" min-width="150" show-overflow-tooltip />
            <el-table-column prop="tenantId" label="租户ID" width="120" align="center" />
            <el-table-column label="实际公摊面积" width="130" align="center">
              <template slot-scope="scope">{{ scope.row.area }}㎡</template>
            </el-table-column>
            <el-table-column label="公摊比例" width="120" align="center">
              <template slot-scope="scope">{{
                totalArea > 0
                  ? ((scope.row.area / totalArea) * 100).toFixed(4)
                  : 0
              }}%</template>
            </el-table-column>
            <!-- <el-table-column label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button
                  type="text"
                  size="small"
                  @click="handleTenantDetail(scope.row)"
                  >详情</el-button
                >
              </template>
            </el-table-column> -->
          </el-table>
          <div v-if="tenantList.length === 0" class="empty-data">
            <el-empty description="暂无租户数据" :image-size="80" />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：设备信息 -->
      <el-col :span="10">
        <el-card class="meter-card" shadow="never">
          <div slot="header" class="card-header">
            <div class="tab-header">
              <span :class="['tab-item', { active: currentTab === 1 }]" @click="changeTab(1)">加法设备({{ addMeterCount
              }})</span>
              <span :class="['tab-item', { active: currentTab === -1 }]" @click="changeTab(-1)">减法设备({{ subMeterCount
              }})</span>
            </div>
            <el-button type="primary" size="small" icon="el-icon-link" @click="handleBindMeter">关联/解绑电表</el-button>
          </div>
          <div class="meter-list">
            <div v-for="item in filteredMeterList" :key="item.id" class="meter-item">
              <div class="meter-icon">
                <i class="el-icon-cpu meter-default-icon"></i>
              </div>
              <div class="meter-info">
                <div class="meter-name">{{ item.meterName }}</div>
                <div class="meter-id">{{ item.id }}</div>
              </div>
              <div class="meter-status">
                <el-tag :type="item.switchStatus === 1 ? 'success' : 'danger'" size="small">{{ item.switchStatus === 1 ?
                  "合闸"
                  : "分闸" }}</el-tag>
                <span :class="[
                  'online-status',
                  item.onlineStatus === 1 ? 'online' : 'offline',
                ]">
                  <i class="status-dot"></i>{{ item.onlineStatus === 1 ? "在线" : "离线" }}
                </span>
              </div>
              <div class="meter-action">
                <el-button type="text" size="small" icon="el-icon-setting"
                  @click="handleMeterSetting(item)">设置</el-button>
              </div>
            </div>
            <div v-if="filteredMeterList.length === 0" class="empty-data">
              <el-empty description="暂无设备数据" :image-size="60" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 修改公摊组弹窗 -->
    <el-dialog title="修改电表公摊组" :visible.sync="modifyDialog.visible" width="450px" :close-on-click-modal="false">
      <el-form ref="modifyForm" :model="modifyDialog" :rules="modifyRules" label-width="100px">
        <el-form-item label="公摊组名" prop="name">
          <el-input v-model="modifyDialog.name" placeholder="请输入公摊组名" maxlength="50" show-word-limit />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="modifyDialog.visible = false">取 消</el-button>
        <el-button type="primary" :loading="modifySubmitting" @click="handleModifySubmit">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 关联/解绑租户弹窗 -->
    <el-dialog title="关联/解绑租户" :visible.sync="tenantBindDialog.visible" width="900px" :close-on-click-modal="false">
      <div v-loading="tenantBindLoading">
        <div class="bind-section">
          <div class="section-header">
            <span>已选租户</span>
            <el-input v-model="tenantBindDialog.selectedSearch" placeholder="搜索已选租户" size="small" class="search-input"
              clearable @input="filterSelectedTenant">
              <i slot="prefix" class="el-input__icon el-icon-search"></i>
            </el-input>
          </div>
          <el-table :data="tenantBindDialog.filteredSelectedList" stripe max-height="200" size="small">
            <el-table-column prop="name" label="租户名" min-width="80" show-overflow-tooltip />
            <el-table-column prop="id" label="租户ID" width="100" align="center" />
            <el-table-column label="实际公摊面积" width="120" align="center">
              <template slot-scope="scope">{{ scope.row.publicArea }}㎡</template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="handleTenantUnbind(scope.row)">解绑</el-button>
                <el-button type="text" size="small" @click="handleTenantModifyArea(scope.row)">修改面积</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="tenantBindDialog.filteredSelectedList.length === 0" class="empty-tip">
            暂无数据
          </div>
        </div>
        <div class="bind-section" style="margin-top: 20px">
          <div class="section-header">
            <span>可选租户</span>
            <el-input v-model="tenantBindDialog.selectableSearch" placeholder="搜索可选租户" size="small" class="search-input"
              clearable @input="filterSelectableTenant">
              <i slot="prefix" class="el-input__icon el-icon-search"></i>
            </el-input>
          </div>
          <el-table :data="tenantBindDialog.filteredSelectableList" stripe max-height="200" size="small">
            <el-table-column prop="name" label="租户名" min-width="120" show-overflow-tooltip />
            <el-table-column prop="id" label="租户ID" width="100" align="center" />
            <el-table-column label="实际公摊面积" width="120" align="center">
              <template slot-scope="scope">{{ scope.row.publicArea }}㎡</template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="handleTenantBind(scope.row)">绑定</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="tenantBindDialog.filteredSelectableList.length === 0" class="empty-tip">
            暂无数据
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 租户操作确认弹窗 -->
    <el-dialog :title="tenantOperateDialog.title" :visible.sync="tenantOperateDialog.visible" width="400px"
      :close-on-click-modal="false" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="租户名">{{
          tenantOperateDialog.name
        }}</el-form-item>
        <el-form-item label="租户ID">{{ tenantOperateDialog.id }}</el-form-item>
        <el-form-item label="面积">
          <el-input v-if="tenantOperateDialog.type === 'bind'" v-model="tenantOperateDialog.area" placeholder="请输入面积">
            <template slot="append">平方米</template>
          </el-input>
          <span v-else>{{ tenantOperateDialog.area }} 平方米</span>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="tenantOperateDialog.visible = false">取 消</el-button>
        <el-button type="primary" :loading="tenantOperateSubmitting" @click="handleTenantOperateSubmit">确 认</el-button>
      </span>
    </el-dialog>

    <!-- 关联/解绑电表弹窗 - 使用穿梭框 -->
    <el-dialog title="关联/解绑电表" :visible.sync="meterBindDialog.visible" width="850px" :close-on-click-modal="false"
      custom-class="meter-bind-dialog">
      <div v-loading="meterBindLoading" class="transfer-wrapper">
        <el-transfer v-model="meterBindDialog.selectedIds" :data="meterBindDialog.allMeterList"
          :titles="['未绑定电表', '已绑定电表']" :props="{ key: 'id', label: 'meterName' }" :filter-placeholder="'请输入'" filterable
          @change="handleMeterTransferChange" />
      </div>
    </el-dialog>

    <!-- 电表设置弹窗 -->
    <el-dialog title="设置电表" :visible.sync="meterSettingDialog.visible" width="550px" :close-on-click-modal="false"
      @open="initMeterSettingDialog">
      <el-form ref="meterSettingForm" :model="meterSettingDialog.data" label-width="100px" class="meter-setting-form">
        <el-form-item label="电表编号">
          <div class="form-text">{{ meterSettingDialog.data.id }}</div>
        </el-form-item>
        <el-form-item label="变比">
          <div class="form-text">{{ meterSettingDialog.data.ct || "-" }}</div>
        </el-form-item>
        <el-form-item label="电表序列号">
          <div class="form-text">{{ meterSettingDialog.data.serial }}</div>
        </el-form-item>
        <el-form-item label="电表名称">
          <el-input v-model="meterSettingDialog.data.meterName" clearable placeholder="请输入电表名称" />
        </el-form-item>
        <el-form-item label="电表规格">
          <el-select v-model="meterSettingDialog.data.monitorType" clearable placeholder="请选择" style="width: 100%">
            <el-option v-for="item in meterSettingDialog.monitorTypeOptions" :key="item.value" :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="电表类型">
          <el-select v-model="meterSettingDialog.data.bindType" placeholder="请选择" clearable style="width: 100%">
            <el-option v-for="item in MeterBindType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="电费方案">
          <el-select v-model="meterSettingDialog.data.priceId" placeholder="请选择" clearable style="width: 100%">
            <el-option v-for="item in meterSettingDialog.priceList" :key="item.id" :label="item.name"
              :value="item.id" />
          </el-select>
          <div v-if="meterSettingDialog.priceRead[meterSettingDialog.data.priceId]" class="price-info">
            尖：{{
              meterSettingDialog.priceRead[meterSettingDialog.data.priceId]
                .powerPeakPrice
            }}, 峰：{{
              meterSettingDialog.priceRead[meterSettingDialog.data.priceId]
                .powerTopPrice
            }}, 平：{{
              meterSettingDialog.priceRead[meterSettingDialog.data.priceId]
                .powerFlatPrice
            }}, 谷：{{
              meterSettingDialog.priceRead[meterSettingDialog.data.priceId]
                .powerValleyPrice
            }}
          </div>
        </el-form-item>
        <el-form-item label="服务费方案">
          <el-select v-model="meterSettingDialog.data.serviceId" placeholder="请选择" clearable style="width: 100%">
            <el-option v-for="item in meterSettingDialog.serviceList" :key="item.id" :label="item.name"
              :value="item.id" />
          </el-select>
          <div v-if="
            meterSettingDialog.serviceRead[meterSettingDialog.data.serviceId]
          " class="price-info">
            尖：{{
              meterSettingDialog.serviceRead[meterSettingDialog.data.serviceId]
                .powerPeakPrice
            }}, 峰：{{
              meterSettingDialog.serviceRead[meterSettingDialog.data.serviceId]
                .powerTopPrice
            }}, 平：{{
              meterSettingDialog.serviceRead[meterSettingDialog.data.serviceId]
                .powerFlatPrice
            }}, 谷：{{
              meterSettingDialog.serviceRead[meterSettingDialog.data.serviceId]
                .powerValleyPrice
            }}
          </div>
        </el-form-item>
        <el-form-item label="付费模式">
          <el-select v-model="meterSettingDialog.data.logicPayType" placeholder="请选择" clearable style="width: 100%">
            <el-option v-for="item in MeterPayTypeDetail" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="负载限制">
          <el-switch v-model="meterSettingDialog.data.overloadSwitch" active-color="#13ce66" inactive-color="#ff4949" />
        </el-form-item>
        <el-form-item v-show="meterSettingDialog.data.overloadSwitch" label="限制功率">
          <el-input v-model="meterSettingDialog.data.overloadP" placeholder="请输入限制功率">
            <template slot="suffix"><span class="input-unit">kW</span></template>
          </el-input>
        </el-form-item>
        <el-form-item v-show="meterSettingDialog.data.overloadSwitch" label="跳闸周期">
          <el-select v-model="meterSettingDialog.data.overloadTime" placeholder="请选择" clearable style="width: 100%">
            <el-option v-for="item in timeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="meterSettingDialog.visible = false">取 消</el-button>
        <el-button type="primary" :loading="meterSettingSubmitting" @click="handleMeterSettingSubmit">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import {
  shareGetShareDetail,
  shareUpdate,
  shareGetShareTenantBindEdit,
  shareBindShareTenant,
  shareGetShareMeterBindEdit,
  shareBindShareMeter,
  getMeterPriceList,
  meterUpdateMeterBase,
} from "@/api/electricityShare";

export default {
  name: "ElectricityShareDetail",
  data() {
    return {
      shareId: "",
      pageLoading: false,
      shareData: { id: "", name: "", area: 0 },
      tenantList: [],
      meterList: [],
      currentTab: 1,
      modifyDialog: { visible: false, name: "", id: "" },
      modifyRules: {
        name: [{ required: true, message: "请输入公摊组名", trigger: "blur" }],
      },
      modifySubmitting: false,
      tenantBindDialog: {
        visible: false,
        selectedList: [],
        selectableList: [],
        filteredSelectedList: [],
        filteredSelectableList: [],
        selectedSearch: "",
        selectableSearch: "",
      },
      tenantBindLoading: false,
      tenantOperateDialog: {
        visible: false,
        title: "",
        type: "",
        name: "",
        id: "",
        area: "",
      },
      tenantOperateSubmitting: false,
      // 电表绑定弹窗 - 穿梭框
      meterBindDialog: {
        visible: false,
        allMeterList: [],
        selectedIds: [],
        originalSelectedIds: [],
      },
      meterBindLoading: false,
      // 电表设置弹窗
      meterSettingDialog: {
        visible: false,
        data: {
          id: "",
          ct: "",
          serial: "",
          meterName: "",
          monitorType: "",
          bindType: "",
          priceId: "",
          serviceId: "",
          logicPayType: "",
          overloadSwitch: false,
          overloadP: "",
          overloadTime: "",
          managerId: "",
          phase: "",
        },
        priceList: [],
        serviceList: [],
        priceRead: {},
        serviceRead: {},
        monitorTypeOptions: [],
      },
      meterSettingSubmitting: false,
      // 枚举定义
      MeterBindType: [
        { value: 1, label: "专用表" },
        { value: 2, label: "公摊表" },
        { value: 3, label: "公式表" },
      ],
      MeterPayTypeDetail: [
        { value: 0, label: "预付费（欠费跳闸）" },
        { value: 1, label: "强控（欠费不跳闸）" },
      ],
      MeterMonitorType: [
        { value: 1, label: "一次" },
        { value: 2, label: "二次" },
      ],
      timeTypeOptions: [
        { value: "10", label: "10分钟" },
        { value: "15", label: "15分钟" },
        { value: "20", label: "20分钟" },
        { value: "25", label: "25分钟" },
        { value: "30", label: "30分钟" },
      ],
    };
  },
  computed: {
    ...mapGetters("manager", ["currentManagerId"]),
    totalArea() {
      return this.tenantList
        .reduce((sum, i) => sum + (i.area || 0), 0)
        .toFixed(2);
    },
    addMeterCount() {
      return this.meterList.filter(
        (m) => m.coefficient === 1 || m.coefficient === 1.0
      ).length;
    },
    subMeterCount() {
      return this.meterList.filter(
        (m) => m.coefficient === -1 || m.coefficient === -1.0
      ).length;
    },
    filteredMeterList() {
      return this.meterList.filter((m) =>
        this.currentTab === 1
          ? m.coefficient === 1 || m.coefficient === 1.0
          : m.coefficient === -1 || m.coefficient === -1.0
      );
    },
  },
  created() {
    this.shareId = this.$route.query.id;
    if (this.shareId) this.fetchDetailData();
    else {
      this.$message.error("缺少公摊组ID");
      this.goBack();
    }
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    async fetchDetailData() {
      this.pageLoading = true;
      try {
        const res = await shareGetShareDetail({ shareId: this.shareId });
        if (res.code === 200 && res.data) {
          this.shareData = res.data.shareDto || {};
          this.tenantList = res.data.tenantDtoList || [];
          this.meterList = res.data.meterInfoDtoList || [];
        } else this.$message.error(res.msg || "获取详情失败");
      } catch (e) {
        this.$message.error("获取详情失败");
      } finally {
        this.pageLoading = false;
      }
    },
    handleModifyShare() {
      this.modifyDialog = {
        visible: true,
        name: this.shareData.name,
        id: this.shareData.id,
      };
    },
    async handleModifySubmit() {
      this.$refs.modifyForm.validate(async (valid) => {
        if (!valid) return;
        this.modifySubmitting = true;
        try {
          const res = await shareUpdate({
            id: this.modifyDialog.id,
            name: this.modifyDialog.name,
            managerId: this.currentManagerId,
            area: 1,
          });
          if (res.code === 200) {
            this.$message.success(res.msg || "修改成功");
            this.modifyDialog.visible = false;
            this.fetchDetailData();
          } else this.$message.error(res.msg || "修改失败");
        } catch (e) {
          this.$message.error("修改失败");
        } finally {
          this.modifySubmitting = false;
        }
      });
    },
    changeTab(tab) {
      this.currentTab = tab;
    },
    handleTenantDetail(row) {
      this.$router.push({
        path: "/control-tenement-detail",
        query: { id: row.tenantId, selectType: 3, deviceType: 1 },
      });
    },
    async handleBindTenant() {
      this.tenantBindDialog.visible = true;
      this.tenantBindLoading = true;
      this.tenantBindDialog.selectedSearch = "";
      this.tenantBindDialog.selectableSearch = "";
      try {
        const res = await shareGetShareTenantBindEdit({
          managerId: this.currentManagerId,
          shareId: this.shareId,
        });
        if (res.code === 200 && res.data) {
          this.tenantBindDialog.selectedList =
            res.data.tenantSelectedList || [];
          this.tenantBindDialog.selectableList =
            res.data.tenantSelectableList || [];
          this.tenantBindDialog.filteredSelectedList = [
            ...this.tenantBindDialog.selectedList,
          ];
          this.tenantBindDialog.filteredSelectableList = [
            ...this.tenantBindDialog.selectableList,
          ];
        }
      } catch (e) {
        this.$message.error("获取租户绑定信息失败");
      } finally {
        this.tenantBindLoading = false;
      }
    },
    filterSelectedTenant() {
      const k = this.tenantBindDialog.selectedSearch;
      this.tenantBindDialog.filteredSelectedList = k
        ? this.tenantBindDialog.selectedList.filter((i) => i.name.includes(k))
        : [...this.tenantBindDialog.selectedList];
    },
    filterSelectableTenant() {
      const k = this.tenantBindDialog.selectableSearch;
      this.tenantBindDialog.filteredSelectableList = k
        ? this.tenantBindDialog.selectableList.filter((i) => i.name.includes(k))
        : [...this.tenantBindDialog.selectableList];
    },
    handleTenantBind(row) {
      this.tenantOperateDialog = {
        visible: true,
        title: "绑定操作",
        type: "bind",
        name: row.name,
        id: row.id,
        area: row.publicArea || "",
      };
    },
    handleTenantUnbind(row) {
      this.tenantOperateDialog = {
        visible: true,
        title: "解绑操作",
        type: "unbind",
        name: row.name,
        id: row.id,
        area: row.publicArea,
      };
    },
    handleTenantModifyArea(row) {
      this.tenantOperateDialog = {
        visible: true,
        title: "修改面积",
        type: "bind",
        name: row.name,
        id: row.id,
        area: row.publicArea,
      };
    },
    async handleTenantOperateSubmit() {
      this.tenantOperateSubmitting = true;
      try {
        const res = await shareBindShareTenant({
          tenantId: this.tenantOperateDialog.id,
          shareId: this.shareId,
          managerId: this.currentManagerId,
          type: this.tenantOperateDialog.type,
          area: this.tenantOperateDialog.area,
        });
        if (res.code === 200) {
          this.$message.success(res.msg || "操作成功");
          this.tenantOperateDialog.visible = false;
          this.handleBindTenant();
          this.fetchDetailData();
        } else this.$message.error(res.msg || "操作失败");
      } catch (e) {
        this.$message.error("操作失败");
      } finally {
        this.tenantOperateSubmitting = false;
      }
    },
    // 打开电表绑定弹窗 - 穿梭框
    async handleBindMeter() {
      this.meterBindDialog.visible = true;
      this.meterBindLoading = true;
      try {
        const res = await shareGetShareMeterBindEdit({
          managerId: this.currentManagerId,
          shareId: this.shareId,
        });
        if (res.code === 200 && res.data) {
          const selectedList = res.data.meterSelectedList || [];
          const selectableList = res.data.meterSelectableList || [];

          // ⭐ 关键修改1：从已选列表中过滤出当前类型的电表
          const filteredSelected = selectedList.filter(
            item => item.coefficient === this.currentTab || item.coefficient === parseFloat(this.currentTab)
          );

          // ⭐ 关键修改2：从已选列表中过滤出【其他类型】的电表
          // 这些电表已经绑定到另一个类型（加法/减法），不应该出现在可选列表中
          const otherTypeSelectedIds = selectedList
            .filter(item =>
              item.coefficient !== this.currentTab &&
              item.coefficient !== parseFloat(this.currentTab)
            )
            .map(item => item.id);

          // ⭐ 关键修改3：过滤可选列表，排除已绑定到其他类型的电表
          const filteredSelectable = selectableList.filter(
            item => !otherTypeSelectedIds.includes(item.id)
          );

          // 合并电表数据（过滤后的可选列表 + 当前类型的已选列表）
          this.meterBindDialog.allMeterList = [
            ...filteredSelectable,  // 使用过滤后的可选列表
            ...filteredSelected,
          ];

          // 已绑定的电表ID
          this.meterBindDialog.selectedIds = filteredSelected.map(
            (item) => item.id
          );

          // 保存原始已绑定ID
          this.meterBindDialog.originalSelectedIds = [
            ...this.meterBindDialog.selectedIds,
          ];
        }
      } catch (e) {
        this.$message.error("获取电表绑定信息失败");
      } finally {
        this.meterBindLoading = false;
      }
    },
    // 穿梭框变化事件
    async handleMeterTransferChange(value, direction, movedKeys) {
      const type = direction === "right" ? "bind" : "unbind";

      for (const meterId of movedKeys) {
        try {
          const res = await shareBindShareMeter({
            meterId: meterId,
            shareId: this.shareId,
            coefficient: this.currentTab, // ⭐ 添加 coefficient 参数，使用当前tab值
            type: type,
          });

          if (res.code === 200) {
            this.$message.success(res.msg || "操作成功");
          } else {
            this.$message.error(res.msg || "操作失败");
            // 操作失败，恢复原状态
            if (type === "bind") {
              this.meterBindDialog.selectedIds =
                this.meterBindDialog.selectedIds.filter((id) => id !== meterId);
            } else {
              this.meterBindDialog.selectedIds.push(meterId);
            }
          }
        } catch (e) {
          this.$message.error("操作失败");
          // 操作失败，恢复原状态
          if (type === "bind") {
            this.meterBindDialog.selectedIds =
              this.meterBindDialog.selectedIds.filter((id) => id !== meterId);
          } else {
            this.meterBindDialog.selectedIds.push(meterId);
          }
        }
      }

      // 刷新详情数据
      this.fetchDetailData();
    },
    // 打开电表设置弹窗
    handleMeterSetting(item) {
      this.meterSettingDialog.visible = true;
      this.meterSettingDialog.data = {
        id: item.id,
        ct: item.ct,
        serial: item.serial,
        meterName: item.meterName,
        monitorType: item.monitorType,
        bindType: item.bindType,
        priceId:
          item.priceId || (item.meterPriceDto ? item.meterPriceDto.id : ""),
        serviceId: item.serviceId || "",
        logicPayType: item.logicPayType,
        overloadSwitch: item.overloadSwitch || false,
        overloadP: item.overloadP || "",
        overloadTime: item.overloadTime || "",
        managerId: item.managerId || this.currentManagerId,
        phase: item.phase,
      };
    },
    // 初始化电表设置弹窗
    async initMeterSettingDialog() {
      const phase = this.meterSettingDialog.data.phase;
      const baseOptions = JSON.parse(JSON.stringify(this.MeterMonitorType));
      if (phase) {
        if (phase == 5) {
          this.meterSettingDialog.monitorTypeOptions = baseOptions.map(
            (item) => {
              item.label = "三相" + item.label;
              return item;
            }
          );
        } else {
          this.meterSettingDialog.monitorTypeOptions = baseOptions.filter(
            (item) => {
              if (item.value == 1) {
                item.label = "单相" + item.label;
                return item;
              }
            }
          );
        }
      } else {
        this.meterSettingDialog.monitorTypeOptions = baseOptions;
      }
      // 并行加载电费方案和服务费方案
      await Promise.all([
        this.loadMeterPriceList(),
        this.loadServicePriceList(),
      ]);
    },
    // 加载电费方案列表
    async loadMeterPriceList() {
      try {
        const res = await getMeterPriceList({
          managerId: this.meterSettingDialog.data.managerId,
          priceType: 1,
        });
        if (res.code === 200 && res.data) {
          this.meterSettingDialog.priceRead = {};
          this.meterSettingDialog.priceList = res.data.map((item) => {
            this.meterSettingDialog.priceRead[item.id] = item;
            return { name: item.name, id: item.id };
          });
        }
      } catch (e) {
        console.error("加载电费方案失败", e);
      }
    },
    // 加载服务费方案列表
    async loadServicePriceList() {
      try {
        const res = await getMeterPriceList({
          managerId: this.meterSettingDialog.data.managerId,
          priceType: 2,
        });
        if (res.code === 200 && res.data) {
          this.meterSettingDialog.serviceRead = {};
          this.meterSettingDialog.serviceList = res.data.map((item) => {
            this.meterSettingDialog.serviceRead[item.id] = item;
            return { name: item.name, id: item.id };
          });
        }
      } catch (e) {
        console.error("加载服务费方案失败", e);
      }
    },
    // 提交电表设置
    async handleMeterSettingSubmit() {
      const data = this.meterSettingDialog.data;
      if (data.overloadSwitch) {
        const reg =
          /(^[1-9]([0-9]+)?(\.[0-9]{1,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/;
        if (!reg.test(data.overloadP)) {
          this.$message.error("限制功率必须为正数且至多两位小数");
          return;
        }
      }
      this.$confirm("确认修改电表?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          this.meterSettingSubmitting = true;
          try {
            const submitData = { ...data };
            if (!submitData.overloadSwitch) {
              submitData.overloadP = "";
              submitData.overloadTime = "";
            }
            const res = await meterUpdateMeterBase(submitData);
            if (res.code === 200) {
              this.$message.success(res.msg || "修改成功");
              this.meterSettingDialog.visible = false;
              this.fetchDetailData();
            } else {
              this.$message.error(res.msg || "修改失败");
            }
          } catch (e) {
            this.$message.error("修改失败");
          } finally {
            this.meterSettingSubmitting = false;
          }
        })
        .catch(() => { });
    },
    getMeterBindTypeLabel(type) {
      const item = this.MeterBindType.find((i) => i.value === type);
      return item ? item.label : "-";
    },
  },
};
</script>

<style lang="scss" scoped>
.share-detail-container {
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

.tab-header {
  display: flex;
  gap: 20px;

  .tab-item {
    cursor: pointer;
    padding: 4px 0;
    border-bottom: 2px solid transparent;
    color: #606266;

    &.active {
      color: #409eff;
      border-color: #409eff;
    }

    &:hover {
      color: #409eff;
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
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: 10px;
    flex-shrink: 0;

    .online-status {
      display: flex;
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
  }

  .meter-action {
    flex-shrink: 0;
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

    span {
      font-weight: 600;
      color: #303133;
    }
  }
}

// 搜索框样式
.search-input {
  width: 200px;
}

.online-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;

  &.online {
    background: #67c23a;
  }

  &.offline {
    background: #909399;
  }
}

// 穿梭框样式
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

          .el-input__inner {
            border-radius: 4px;
          }
        }

        .el-transfer-panel__list {
          height: 280px;

          .el-checkbox__label {
            display: flex;
            align-items: center;
          }
        }
      }
    }

    .el-transfer__buttons {
      padding: 0 20px;
    }
  }
}

// 电表设置弹窗样式
.meter-setting-form {
  .el-form-item {
    margin-bottom: 18px;
  }

  .form-text {
    color: #606266;
    line-height: 32px;
  }

  .price-info {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
    line-height: 1.5;
  }

  .input-unit {
    color: #909399;
    padding-right: 10px;
  }
}
</style>
