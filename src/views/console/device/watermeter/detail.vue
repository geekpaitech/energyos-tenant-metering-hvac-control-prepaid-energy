<template>
  <el-drawer :visible.sync="visible" :before-close="handleClose" size="60%" :destroy-on-close="true"
    class="water-detail-drawer">
    <!-- 抽屉标题 -->
    <div slot="title" class="drawer-title">
      <span>水表详情</span>
    </div>

    <!-- 抽屉内容 -->
    <div v-loading="pageLoading" class="drawer-content">
      <!-- 顶部信息区 -->
      <div class="top-section">
        <!-- 左侧：基本信息 -->
        <div class="left-info">
          <!-- 水表名称和状态标签 -->
          <div class="water-header">
            <h2 class="water-name">{{ waterInfo.waterName || '--' }}</h2>
            <div class="status-tags">
              <el-tag v-if="waterInfo.withSwitch" size="small" :type="waterInfo.switchStatus == 1 ? 'success' : 'info'">
                {{ waterInfo.switchStatus == 1 ? '开阀' : '关阀' }}
              </el-tag>
              <el-tag size="small" type="warning">
                {{ getBindTypeLabel(waterInfo.bindType) }}
              </el-tag>
            </div>
          </div>

          <!-- 信息两列布局 -->
          <div class="info-grid">
            <div class="info-row">
              <div class="info-item">
                <span class="label">设备号：</span>
                <span class="value">{{ waterInfo.serial || '--' }}</span>
              </div>
              <div class="info-item">
                <span class="label">创建时间：</span>
                <span class="value">{{ waterInfo.createTime || '--' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="label">编号：</span>
                <span class="value">{{ waterInfo.id || '--' }}</span>
              </div>
              <div class="info-item">
                <span class="label">数据更新：</span>
                <span class="value">{{ waterInfo.updateTime || '--' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="label">规格型号：</span>
                <span class="value">{{ waterInfo.waterModel || '--' }}</span>
              </div>
              <div class="info-item">
                <span class="label">安装位置：</span>
                <span class="value">--</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item full-width">
                <span class="label">支持阀控：</span>
                <span class="value">{{ waterInfo.withSwitch ? '支持' : '不支持' }}</span>
              </div>
            </div>
            <div class="info-row" v-if="waterInfo.withSwitch">
              <div class="info-item full-width">
                <span class="label">付费模式：</span>
                <span class="value">{{ getPayTypeLabel(waterInfo.logicPayType) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：已绑信息 + 操作按钮 -->
        <div class="right-info">
          <!-- 操作按钮 -->
          <div class="action-buttons" v-if="waterInfo.withSwitch">
            <el-button size="small" type="danger" plain v-if="waterInfo.switchStatus == 1" @click="handleSwitch(0)"
              :loading="switchLoading">
              关阀
            </el-button>
            <el-button size="small" type="success" plain v-else @click="handleSwitch(1)" :loading="switchLoading">
              开阀
            </el-button>
            <el-button size="small" plain @click="handleEdit">编辑</el-button>
          </div>
          <div class="action-buttons" v-else>
            <el-button size="small" plain @click="handleEdit">编辑</el-button>
          </div>

          <!-- 已绑信息卡片 -->
          <div class="bind-card">
            <h4 class="bind-title">已绑信息</h4>
            <div class="bind-content">
              <!-- 绑定信息 -->
              <div v-if="waterInfo.waterBindDtoList && waterInfo.waterBindDtoList.length > 0" class="bind-info">
                <div v-for="(bind, index) in waterInfo.waterBindDtoList" :key="index" class="bind-header">
                  <!-- <el-tag size="small" type="info">
                    {{ getBindTypeLabel(waterInfo.bindType) }}
                  </el-tag> -->
                  <span class="bind-text">({{ bind.bindId }}){{ bind.bindName }}</span>
                </div>
              </div>
              <div v-else class="no-bind">暂无绑定信息</div>

              <!-- 水价方案 -->
              <div v-if="waterInfo.waterPriceDto" class="price-section">
                <div class="price-name">水费方案：{{ waterInfo.waterPriceDto.name }}</div>
                <div class="price-detail">
                  <span>{{ waterInfo.waterPriceDto.price }}元/吨</span>
                </div>
              </div>
              <div v-else class="price-section">
                <div class="no-price">暂无水价方案</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 近期用水统计 -->
      <div class="usage-section">
        <div class="section-header">
          <h4>近期用水统计</h4>
          <el-button type="text" @click="goToDetailReport">
            查看详细报表 >
          </el-button>
        </div>

        <el-table 
          v-if="usageData.length > 0" 
          v-loading="usageLoading" 
          :data="usageData" 
          max-height="400"
          style="width: 100%"
          :header-cell-style="{
            background: '#fafafa',
            color: '#333',
            fontWeight: '600'
          }">
          <el-table-column prop="occurDate" label="时间" min-width="120" align="center" />
          <el-table-column prop="endRead" label="抄表读数(m³)" min-width="130" align="right">
            <template slot-scope="scope">
              {{ scope.row.endRead || '--' }}
            </template>
          </el-table-column>
          <el-table-column prop="consumption" label="用水量(m³)" min-width="120" align="right">
            <template slot-scope="scope">
              {{ scope.row.consumption || '--' }}
            </template>
          </el-table-column>
          <el-table-column prop="balance" label="水费(元)" min-width="110" align="right">
            <template slot-scope="scope">
              {{ scope.row.balance || '--' }}
            </template>
          </el-table-column>
        </el-table>

        <div v-else-if="!usageLoading" class="empty-state">
          <i class="el-icon-document"></i>
          <p>暂无用水统计数据</p>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog title="编辑水表" :visible.sync="editDialog.visible" width="600px" append-to-body>
      <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="110px">
        <el-form-item label="水表名称" prop="waterName">
          <el-input v-model="editForm.waterName" />
        </el-form-item>
        <el-form-item label="水表类型" prop="bindType">
          <el-select v-model="editForm.bindType" style="width: 100%">
            <el-option label="专用表" :value="1" />
            <el-option label="公摊表" :value="2" />
            <el-option label="公式表" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="接入渠道" prop="waterType">
          <el-select v-model="editForm.waterType" style="width: 100%">
            <el-option label="智慧物联-南硕" value="ZHWL_NS" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备型号">
          <el-input v-model="editForm.waterModel" />
        </el-form-item>
        <el-form-item label="是否支持阀控">
          <el-select v-model="editForm.withSwitch" style="width: 100%">
            <el-option label="支持" :value="true" />
            <el-option label="不支持" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="付费模式" v-if="editForm.withSwitch">
          <el-select v-model="editForm.logicPayType" style="width: 100%">
            <el-option label="预付费" :value="0" />
            <el-option label="强控" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="计费方案">
          <el-select v-model="editForm.priceId" style="width: 100%" clearable>
            <el-option v-for="price in priceList" :key="price.id" :label="`${price.name} (¥${price.price}/吨)`"
              :value="price.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="editDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveEdit">确定</el-button>
      </span>
    </el-dialog>
  </el-drawer>
</template>

<script>
import moment from 'moment';
import {
  waterPageWater,
  waterDoWaterSwitch,
  waterUpdateWater
} from '@/api/water';
import { waterPriceListPrice } from '@/api/waterPrice';
import { queryTenantWaterUseStatis } from '@/api/useReport';
import { mapGetters } from "vuex";

export default {
  name: 'WaterDetailDrawer',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    waterId: {
      type: [String, Number],
      default: ''
    },
    serial: {
      type: String,
      default: ''
    },
    rowData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      pageLoading: false,
      usageLoading: false,
      switchLoading: false,
      submitting: false,

      waterInfo: {},
      usageData: [],

      editDialog: {
        visible: false
      },
      editForm: {},
      editRules: {
        waterName: [{ required: true, message: '请输入水表名称', trigger: 'blur' }],
        bindType: [{ required: true, message: '请选择水表类型', trigger: 'change' }],
        waterType: [{ required: true, message: '请选择接入渠道', trigger: 'change' }]
      },

      priceList: []
    };
  },
  computed: {
    ...mapGetters("manager", ["currentManagerId"])
  },
  watch: {
    visible(val) {
      if (val) {
        this.loadData();
      } else {
        this.resetData();
      }
    }
  },
  methods: {
    async loadData() {
      this.pageLoading = true;
      try {
        if (this.rowData && this.rowData.id) {
          this.waterInfo = { ...this.rowData };
        } else {
          await this.getWaterInfo();
        }

        await Promise.all([
          this.getUsageData(),
          this.loadPriceList()
        ]);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        this.pageLoading = false;
      }
    },

    async getWaterInfo() {
      try {
        const params = {
          serial: this.serial,
          page: { size: 1, current: 1 }
        };
        const response = await waterPageWater(params);
        if (response.code === 200 && response.data && response.data.dataList.length > 0) {
          this.waterInfo = response.data.dataList[0];
        }
      } catch (error) {
        console.error('获取水表信息失败:', error);
      }
    },

    async loadPriceList() {
      try {
        const managerId = this.waterInfo.managerId;
        if (managerId) {
          const response = await waterPriceListPrice({ managerId });
          if (response.code === 200 && response.data) {
            this.priceList = response.data || [];
          }
        }
      } catch (error) {
        console.error('获取水价方案失败:', error);
      }
    },

   async getUsageData() {
  this.usageLoading = true;
  try {
    // 提取租户ID列表
    let tenantIdList = [];
    if (this.waterInfo.waterBindDtoList && this.waterInfo.waterBindDtoList.length > 0) {
      tenantIdList = this.waterInfo.waterBindDtoList.map(item => item.bindId);
    }

    if (tenantIdList.length === 0) {
      this.usageData = [];
      return;
    }

    const params = {
      startDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
      endDate: moment().format('YYYY-MM-DD'),
      dataType: 2,  // 水表
      useType: 0,
      tenantIdList: tenantIdList,
      managerId: this.currentManagerId
    };

    const response = await queryTenantWaterUseStatis(params);

    if (response.code === 200 && response.data) {
      // 提取当前水表的数据
      const detailData = [];
      if (response.data && response.data.length > 0) {
        response.data.forEach(item => {
          if (item.deviceUseDtoList && item.deviceUseDtoList.length > 0) {
            // 用 waterId 匹配当前水表
            const currentDeviceData = item.deviceUseDtoList.filter(
              device => device.waterId == this.waterId
            );

            // 将匹配的数据加入结果
            detailData.push(...currentDeviceData.map(device => ({
              occurDate: item.occurDate,
              endRead: device.endRead,
              consumption: device.consumption,
              balance: device.balance
            })));
          }
        });
      }
      // 倒序排序：最新日期在前
      this.usageData = detailData.sort((a, b) => {
        return new Date(b.occurDate) - new Date(a.occurDate);
      });
    } else {
      this.usageData = [];
    }
  } catch (error) {
    console.error('加载用水统计失败:', error);
    this.usageData = [];
  } finally {
    this.usageLoading = false;
  }
},

    async handleSwitch(targetStatus) {
      if (!this.waterInfo.withSwitch) {
        this.$message.warning('该水表不支持阀控操作');
        return;
      }

      const actionText = targetStatus == 1 ? '开阀' : '关阀';

      try {
        await this.$confirm(`确定要执行${actionText}操作吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });

        this.switchLoading = true;
        const response = await waterDoWaterSwitch({
          waterId: this.waterId,
          type: targetStatus
        });

        if (response.code === 200) {
          this.$message.success(`${actionText}操作成功`);
          this.getWaterInfo();
          this.$emit('refresh');
        } else {
          this.$message.error(response.msg || `${actionText}操作失败`);
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(`${actionText}操作失败`);
        }
      } finally {
        this.switchLoading = false;
      }
    },

    handleEdit() {
      this.editForm = {
        id: this.waterInfo.id,
        serial: this.waterInfo.serial,
        waterName: this.waterInfo.waterName,
        bindType: this.waterInfo.bindType,
        waterType: this.waterInfo.waterType,
        waterModel: this.waterInfo.waterModel,
        withSwitch: this.waterInfo.withSwitch,
        logicPayType: this.waterInfo.logicPayType,
        managerId: this.waterInfo.managerId,
        priceId: this.waterInfo.priceId
      };
      this.editDialog.visible = true;
    },

    async saveEdit() {
      try {
        await this.$refs.editForm.validate();

        this.submitting = true;
        const response = await waterUpdateWater(this.editForm);

        if (response.code === 200) {
          this.$message.success('修改成功');
          this.editDialog.visible = false;
          this.getWaterInfo();
          this.$emit('refresh');
        } else {
          this.$message.error(response.msg || '修改失败');
        }
      } catch (error) {
        if (error !== false) {
          this.$message.error('修改失败');
        }
      } finally {
        this.submitting = false;
      }
    },

goToDetailReport() {
  // 跳转到设备用水页面，携带水表ID和日期参数
  this.$router.push({
    path: '/energy/charging-water',
    query: {
      waterId: this.waterInfo.id || this.waterId,
     startDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
      endDate: moment().format('YYYY-MM-DD')
    }
  });
  this.handleClose();
},

    handleClose() {
      this.$emit('update:visible', false);
    },

    resetData() {
      this.waterInfo = {};
      this.usageData = [];
      this.priceList = [];
    },

    getBindTypeLabel(type) {
      const map = { 1: '专用表', 2: '公摊表', 3: '公式表' };
      return map[type] || '--';
    },

    getPayTypeLabel(type) {
      const map = { 0: '预付费', 1: '强控' };
      return map[type] || '--';
    }
  }
};
</script>

<style lang="scss" scoped>
.water-detail-drawer {
  ::v-deep .el-drawer__header {
    margin-bottom: 0;
    padding: 20px;
    border-bottom: 1px solid #e8e8e8;
  }

  .drawer-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }

  .drawer-content {
    padding: 20px;
    height: calc(100vh - 80px);
    overflow-y: auto;
  }

  .top-section {
    display: flex;
    gap: 20px;
    margin-bottom: 24px;
    background: #f5f7fa;
    padding: 20px;
    border-radius: 8px;
  }

  .left-info {
    flex: 1;

    .water-header {
      margin-bottom: 20px;

      .water-name {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }

      .status-tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
    }

    .info-grid {
      .info-row {
        display: flex;
        gap: 40px;
        margin-bottom: 12px;

       .info-item {
  flex: 1;
  display: flex;
  font-size: 14px;
  gap: 0; // 设置间距为0

  &.full-width {
    flex: 2;
  }

  .label {
    color: #909399;
    flex-shrink: 0; // 防止label被压缩
  }

  .value {
    color: #303133;
  }
}
      }
    }
  }

  .right-info {
    width: 360px;
    flex-shrink: 0;

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 16px;
    }

    .bind-card {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      padding: 16px;

      .bind-title {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .bind-content {
        .bind-info {
          margin-bottom: 16px;

          .bind-header {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 8px;

            .bind-text {
              font-size: 14px;
              color: #303133;
              font-weight: 500;
            }
          }
        }

        .no-bind {
          color: #909399;
          text-align: center;
          padding: 12px;
          font-size: 14px;
        }

        .price-section {
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;

          .price-name {
            margin-bottom: 8px;
            font-size: 14px;
            color: #303133;
            font-weight: 500;
          }

          .price-detail {
            font-size: 13px;
            color: #606266;
          }

          .no-price {
            color: #909399;
            text-align: center;
            padding: 12px;
            font-size: 14px;
          }
        }
      }
    }
  }

  .usage-section {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 24px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h4 {
        margin: 0;
        font-size: 16px;
        color: #303133;
        font-weight: 600;
      }
    }
  }

  .empty-state {
    height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #fafafa;
    border: 1px dashed #d9d9d9;
    border-radius: 8px;
    color: #909399;

    i {
      font-size: 48px;
      margin-bottom: 16px;
      color: #c0c4cc;
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  ::v-deep .el-table {
    th {
      background: #fafafa;
      color: #333;
      font-weight: 600;
    }

    .cell {
      padding: 0 8px;
    }
  }

  @media (max-width: 1400px) {
    .top-section {
      flex-direction: column;
    }

    .right-info {
      width: 100%;
    }
  }
}
</style>