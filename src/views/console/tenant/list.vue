<template>
    <div class="table-page-container">
      <!-- 搜索区域 -->
      <div class="search-container">
        <el-card class="search-card" shadow="never">
          <el-form
            :model="queryData"
            ref="searchForm"
            class="search-form compact-form"
            label-position="left"
            label-width="80px"
          >
            <!-- 基础筛选 -->
            <el-row :gutter="16" class="search-row">
              <el-col
                v-for="field in displayBasicFields"
                :key="field.prop"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="6"
              >
                <el-form-item
                  :label="field.label"
                  :prop="field.prop"
                  class="compact-form-item"
                >
                  <!-- 输入框 -->
                  <el-input
                    v-if="field.type === 'input'"
                    v-model="queryData[field.prop]"
                    placeholder="请输入"
                    clearable
                    size="small"
                  />
                  <!-- 选择框 -->
                  <el-select
                    v-else-if="field.type === 'select'"
                    v-model="queryData[field.prop]"
                    placeholder="请选择"
                    clearable
                    size="small"
                    style="width: 100%"
                  >
                    <!-- 标签选项 -->
                    <template v-if="field.prop === 'tags'">
                      <el-option label="全部" value="" />
                      <el-option label="VIP客户" value="VIP" />
                      <el-option label="普通客户" value="NORMAL" />
                      <el-option label="欠费用户" value="ARREARS" />
                      <el-option label="新用户" value="NEW" />
                    </template>
                    <!-- 余额状态选项 -->
                    <template v-else-if="field.prop === 'balanceStatus'">
                      <el-option label="全部" value="" />
                      <el-option label="余额充足" value="SUFFICIENT" />
                      <el-option label="余额不足" value="INSUFFICIENT" />
                      <el-option label="余额为零" value="ZERO" />
                      <el-option label="欠费" value="ARREARS" />
                    </template>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
  
            <!-- 操作按钮行 -->
            <div class="form-actions compact-actions">
              <div class="action-left">
                <el-button
                  type="primary"
                  icon="el-icon-plus"
                  size="small"
                  @click="handleAdd"
                >
                  新增租户
                </el-button>
              </div>
              <div class="action-right">
                <el-button
                  type="primary"
                  icon="el-icon-search"
                  size="small"
                  @click="handleSearch"
                >
                  查询
                </el-button>
                <el-button
                  icon="el-icon-refresh"
                  size="small"
                  @click="handleReset"
                >
                  重置
                </el-button>
                <el-divider direction="vertical" style="margin: 0 8px"></el-divider>
                <!-- 视图切换按钮组 -->
                <el-button-group class="view-toggle">
                  <el-button
                    :type="viewType === 'table' ? 'primary' : ''"
                    size="small"
                    @click="viewType = 'table'"
                  >
                    <i class="el-icon-s-grid"></i>
                    表格
                  </el-button>
                  <el-button
                    :type="viewType === 'card' ? 'primary' : ''"
                    size="small"
                    @click="viewType = 'card'"
                  >
                    <i class="el-icon-menu"></i>
                    卡片
                  </el-button>
                </el-button-group>
                <el-divider direction="vertical" style="margin: 0 8px"></el-divider>
                <el-dropdown trigger="click" @command="handleCommand">
                  <el-button size="small" type="text" style="padding: 7px 12px">
                    更多操作 <i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="export" icon="el-icon-download">
                      导出数据
                    </el-dropdown-item>
                    <el-dropdown-item command="import" icon="el-icon-upload2">
                      导入数据
                    </el-dropdown-item>
                    <el-dropdown-item
                      command="batch"
                      icon="el-icon-s-operation"
                      divided
                    >
                      批量操作
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </div>
            </div>
          </el-form>
        </el-card>
      </div>
  
      <!-- 表格视图 -->
      <div class="table-container" v-if="viewType === 'table'">
        <div class="table-card" shadow="never">
          <!-- 表格工具栏 -->
          <div class="table-toolbar" v-if="selectedData.length > 0">
            <div class="toolbar-left">
              <span class="selection-info">
                已选择 <span class="count">{{ selectedData.length }}</span> 条数据
              </span>
            </div>
          </div>
  
          <!-- 数据表格 -->
          <el-table
            :height="dataLength > 9 ? dynamicTableHeight : null"
            v-loading="loading"
            :data="tableData"
            stripe
            style="width: 100%"
            class="custom-table"
            @selection-change="handleSelectionChange"
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#606266',
              fontWeight: '600',
            }"
          >
            <el-table-column type="selection" width="55" align="center" />
  
            <!-- 租户编号 -->
            <el-table-column
              prop="tenantId"
              label="租户编号"
              width="120"
              align="center"
            />
  
            <!-- 租户姓名 -->
            <el-table-column
              prop="tenantName"
              label="租户姓名"
              width="150"
              align="center"
            >
              <template slot-scope="scope">
                <el-link type="primary" @click="handleDetail(scope.row)">
                  <i class="el-icon-user"></i>
                  {{ scope.row.tenantName }}
                </el-link>
              </template>
            </el-table-column>
  
            <!-- 联系电话 -->
            <el-table-column
              prop="phone"
              label="联系电话"
              width="130"
              align="center"
            />
  
            <!-- 房间信息 -->
            <el-table-column
              prop="roomInfo"
              label="房间信息"
              width="200"
              align="center"
            />
  
            <!-- 标签 -->
            <el-table-column
              prop="tags"
              label="标签"
              width="120"
              align="center"
            >
              <template slot-scope="scope">
                <el-tag
                  v-if="scope.row.tags === 'VIP'"
                  type="warning"
                  size="small"
                  effect="plain"
                >
                  VIP客户
                </el-tag>
                <el-tag
                  v-else-if="scope.row.tags === 'NORMAL'"
                  type="primary"
                  size="small"
                  effect="plain"
                >
                  普通客户
                </el-tag>
                <el-tag
                  v-else-if="scope.row.tags === 'ARREARS'"
                  type="danger"
                  size="small"
                  effect="plain"
                >
                  欠费用户
                </el-tag>
                <el-tag
                  v-else-if="scope.row.tags === 'NEW'"
                  type="success"
                  size="small"
                  effect="plain"
                >
                  新用户
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
  
            <!-- 账户余额 -->
            <el-table-column
              prop="balance"
              label="账户余额"
              width="120"
              align="center"
            >
              <template slot-scope="scope">
                <span
                  :style="{
                    color: scope.row.balance < 0 ? '#F56C6C' : scope.row.balance < 50 ? '#E6A23C' : '#67C23A'
                  }"
                >
                  ¥{{ scope.row.balance.toFixed(2) }}
                </span>
              </template>
            </el-table-column>
  
            <!-- 余额状态 -->
            <el-table-column
              prop="balanceStatus"
              label="余额状态"
              width="100"
              align="center"
            >
              <template slot-scope="scope">
                <el-tag
                  :type="getBalanceStatusType(scope.row.balanceStatus)"
                  size="small"
                >
                  {{ getBalanceStatusLabel(scope.row.balanceStatus) }}
                </el-tag>
              </template>
            </el-table-column>
  
            <!-- 创建时间 -->
            <el-table-column
              prop="createTime"
              label="创建时间"
              width="180"
              align="center"
            />
  
            <!-- 操作列 -->
            <el-table-column
              label="操作"
              width="280"
              fixed="right"
              align="center"
            >
              <template slot-scope="scope">
                <div class="table-actions-group">
                  <el-button
                    type="text"
                    size="small"
                    icon="el-icon-view"
                    @click="handleDetail(scope.row)"
                  >
                    详情
                  </el-button>
                  <el-divider direction="vertical"></el-divider>
                  <el-button
                    type="text"
                    size="small"
                    icon="el-icon-message"
                    @click="handleUrge(scope.row)"
                  >
                    催缴
                  </el-button>
                  <el-divider direction="vertical"></el-divider>
                  <el-dropdown
                    trigger="click"
                    @command="handleTableCommand($event, scope.row)"
                  >
                    <el-button type="text" size="small">
                      更多
                      <i class="el-icon-arrow-down el-icon--right"></i>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item command="recharge" icon="el-icon-plus">
                        手动充值
                      </el-dropdown-item>
                      <el-dropdown-item command="deduct" icon="el-icon-minus">
                        手动扣款
                      </el-dropdown-item>
                      <el-dropdown-item command="qrcode" icon="el-icon-s-grid" divided>
                        查看二维码
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </el-dropdown>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
  
      <!-- 卡片视图 -->
      <div class="card-container" v-else>
        <div class="card-grid" v-loading="loading">
          <div
            v-for="item in tableData"
            :key="item.tenantId"
            class="tenant-card"
            @click="handleDetail(item)"
          >
            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="tenant-basic-info">
                <div class="tenant-avatar">
                  <i class="el-icon-user-solid"></i>
                </div>
                <div class="tenant-info">
                  <h3 class="tenant-name">{{ item.tenantName }}</h3>
                  <p class="tenant-id">编号：{{ item.tenantId }}</p>
                </div>
              </div>
              <div class="tenant-tags">
                <el-tag
                  v-if="item.tags === 'VIP'"
                  type="warning"
                  size="mini"
                  effect="dark"
                >
                  VIP
                </el-tag>
                <el-tag
                  v-else-if="item.tags === 'NORMAL'"
                  type="primary"
                  size="mini"
                  effect="dark"
                >
                  普通
                </el-tag>
                <el-tag
                  v-else-if="item.tags === 'ARREARS'"
                  type="danger"
                  size="mini"
                  effect="dark"
                >
                  欠费
                </el-tag>
                <el-tag
                  v-else-if="item.tags === 'NEW'"
                  type="success"
                  size="mini"
                  effect="dark"
                >
                  新用户
                </el-tag>
              </div>
            </div>
  
            <!-- 卡片内容 -->
            <div class="card-content">
              <!-- 联系信息 -->
              <div class="info-row">
                <div class="info-item">
                  <i class="el-icon-phone info-icon"></i>
                  <span class="info-label">电话：</span>
                  <span class="info-value">{{ item.phone }}</span>
                </div>
              </div>
              
              <!-- 房间信息 -->
              <div class="info-row">
                <div class="info-item">
                  <i class="el-icon-office-building info-icon"></i>
                  <span class="info-label">房间：</span>
                  <span class="info-value">{{ item.roomInfo }}</span>
                </div>
              </div>
  
              <!-- 余额信息 -->
              <div class="balance-section">
                <div class="balance-info">
                  <span class="balance-label">账户余额</span>
                  <span 
                    class="balance-amount"
                    :style="{
                      color: item.balance < 0 ? '#F56C6C' : item.balance < 50 ? '#E6A23C' : '#67C23A'
                    }"
                  >
                    ¥{{ item.balance.toFixed(2) }}
                  </span>
                </div>
                <el-tag
                  :type="getBalanceStatusType(item.balanceStatus)"
                  size="small"
                  class="balance-status"
                >
                  {{ getBalanceStatusLabel(item.balanceStatus) }}
                </el-tag>
              </div>
  
              <!-- 时间信息 -->
              <div class="time-info">
                <span class="create-time">创建时间：{{ item.createTime }}</span>
              </div>
            </div>
  
            <!-- 卡片底部操作按钮 -->
            <div class="card-actions">
              <el-button
                size="mini"
                type="primary"
                icon="el-icon-view"
                @click.stop="handleDetail(item)"
              >
                详情
              </el-button>
              <el-button
                size="mini"
                type="warning"
                icon="el-icon-message"
                @click.stop="handleUrge(item)"
              >
                催缴
              </el-button>
              <el-dropdown
                trigger="click"
                @command="handleTableCommand($event, item)"
                @click.native.stop
              >
                <el-button size="mini" type="info">
                  更多<i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="recharge" icon="el-icon-plus">
                    手动充值
                  </el-dropdown-item>
                  <el-dropdown-item command="deduct" icon="el-icon-minus">
                    手动扣款
                  </el-dropdown-item>
                  <el-dropdown-item command="qrcode" icon="el-icon-s-grid" divided>
                    查看二维码
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          :current-page="pageData.current"
          :page-sizes="[15, 30, 60, 100]"
          :page-size="pageData.size"
          :total="pageData.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
  
      <!-- 手动充值弹窗 -->
      <el-dialog
        title="手动充值"
        :visible.sync="rechargeVisible"
        width="500px"
        :close-on-click-modal="false"
      >
        <el-form ref="rechargeForm" :model="rechargeForm" :rules="rechargeRules" label-width="100px">
          <el-form-item label="租户姓名">
            <el-input v-model="currentTenant.tenantName" disabled />
          </el-form-item>
          <el-form-item label="充值金额" prop="amount">
            <el-input-number
              v-model="rechargeForm.amount"
              :min="0.01"
              :max="9999"
              :precision="2"
              placeholder="请输入充值金额"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="充值备注" prop="remark">
            <el-input
              v-model="rechargeForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入充值备注"
            />
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="rechargeVisible = false">取 消</el-button>
          <el-button type="primary" @click="handleRechargeSubmit">确 定</el-button>
        </span>
      </el-dialog>
  
      <!-- 手动扣款弹窗 -->
      <el-dialog
        title="手动扣款"
        :visible.sync="deductVisible"
        width="500px"
        :close-on-click-modal="false"
      >
        <el-form ref="deductForm" :model="deductForm" :rules="deductRules" label-width="100px">
          <el-form-item label="租户姓名">
            <el-input v-model="currentTenant.tenantName" disabled />
          </el-form-item>
          <el-form-item label="当前余额">
            <el-input :value="'¥' + currentTenant.balance?.toFixed(2)" disabled />
          </el-form-item>
          <el-form-item label="扣款金额" prop="amount">
            <el-input-number
              v-model="deductForm.amount"
              :min="0.01"
              :max="currentTenant.balance || 0"
              :precision="2"
              placeholder="请输入扣款金额"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="扣款原因" prop="reason">
            <el-input
              v-model="deductForm.reason"
              type="textarea"
              :rows="3"
              placeholder="请输入扣款原因"
            />
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="deductVisible = false">取 消</el-button>
          <el-button type="primary" @click="handleDeductSubmit">确 定</el-button>
        </span>
      </el-dialog>
  
      <!-- 二维码查看弹窗 -->
      <el-dialog
        title="租户缴费二维码"
        :visible.sync="qrcodeVisible"
        width="400px"
        center
      >
        <div class="qrcode-container">
          <div class="qrcode-info">
            <h3>{{ currentTenant.tenantName }}</h3>
            <p>租户编号：{{ currentTenant.tenantId }}</p>
            <p>房间：{{ currentTenant.roomInfo }}</p>
          </div>
          <div class="qrcode-image">
            <!-- 这里可以集成真实的二维码生成库 -->
            <div class="mock-qrcode">
              <i class="el-icon-s-grid"></i>
              <p>二维码</p>
            </div>
          </div>
          <div class="qrcode-tips">
            <p>请租户扫描此二维码进行缴费</p>
          </div>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button type="primary" @click="qrcodeVisible = false">关 闭</el-button>
        </span>
      </el-dialog>
    </div>
  </template>
  
  <script>
  export default {
    name: "TenantManagement",
    data() {
      return {
        // 视图类型：table 表格 / card 卡片
        viewType: 'table',
        
        // 查询参数
        queryData: {
          tenantName: "",
          phone: "",
          tags: "",
          balanceStatus: "",
        },
        
        // 搜索字段配置
        searchFields: {
          basic: [
            { prop: "tenantName", label: "租户姓名", type: "input" },
            { prop: "phone", label: "联系电话", type: "input" },
            { prop: "tags", label: "标签", type: "select" },
            { prop: "balanceStatus", label: "余额状态", type: "select" },
          ],
          advanced: []
        },
        
        // 表格高度配置
        tableHeightConfig: {
          headerHeight: 48,
          rowHeight: 47,
          minHeight: 200,
          maxRows: 10,
          paginationHeight: 68,
        },
        
        // 表格数据
        tableData: [],
        loading: false,
        selectedData: [],
        
        // 分页数据
        pageData: {
          current: 1,
          size: 15,
          total: 0,
        },
        
        // 弹窗状态
        rechargeVisible: false,
        deductVisible: false,
        qrcodeVisible: false,
        
        // 当前操作的租户
        currentTenant: {},
        
        // 充值表单
        rechargeForm: {
          amount: null,
          remark: ""
        },
        rechargeRules: {
          amount: [
            { required: true, message: "请输入充值金额", trigger: "blur" },
            { type: "number", min: 0.01, message: "充值金额不能小于0.01元", trigger: "blur" }
          ],
          remark: [
            { required: true, message: "请输入充值备注", trigger: "blur" }
          ]
        },
        
        // 扣款表单
        deductForm: {
          amount: null,
          reason: ""
        },
        deductRules: {
          amount: [
            { required: true, message: "请输入扣款金额", trigger: "blur" },
            { type: "number", min: 0.01, message: "扣款金额不能小于0.01元", trigger: "blur" }
          ],
          reason: [
            { required: true, message: "请输入扣款原因", trigger: "blur" }
          ]
        }
      };
    },
    
    computed: {
      displayBasicFields() {
        return this.searchFields.basic;
      },
      
      dataLength() {
        return this.tableData.length;
      },
      
      dynamicTableHeight() {
        const dataLength = this.tableData.length;
        if (dataLength === 0) {
          return this.tableHeightConfig.minHeight;
        }
        if (dataLength <= this.tableHeightConfig.maxRows) {
          return (
            this.tableHeightConfig.headerHeight +
            dataLength * this.tableHeightConfig.rowHeight
          );
        }
        return (
          this.tableHeightConfig.headerHeight +
          this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
        );
      }
    },
    
    mounted() {
      this.fetchTableData();
    },
    
    methods: {
      // 获取模拟数据
      fetchTableData() {
        this.loading = true;
        
        // 模拟API调用
        setTimeout(() => {
          const mockData = [
            {
              tenantId: "T20250001",
              tenantName: "张三",
              phone: "13800138001",
              roomInfo: "A座-101室",
              tags: "VIP",
              balance: 156.80,
              balanceStatus: "SUFFICIENT",
              createTime: "2024-12-01 10:30:00"
            },
            {
              tenantId: "T20250002", 
              tenantName: "李四",
              phone: "13800138002",
              roomInfo: "A座-102室",
              tags: "NORMAL",
              balance: 25.30,
              balanceStatus: "INSUFFICIENT",
              createTime: "2024-12-02 14:20:00"
            },
            {
              tenantId: "T20250003",
              tenantName: "王五",
              phone: "13800138003", 
              roomInfo: "B座-201室",
              tags: "ARREARS",
              balance: -50.00,
              balanceStatus: "ARREARS",
              createTime: "2024-11-28 09:15:00"
            },
            {
              tenantId: "T20250004",
              tenantName: "赵六",
              phone: "13800138004",
              roomInfo: "B座-202室", 
              tags: "NEW",
              balance: 0,
              balanceStatus: "ZERO",
              createTime: "2024-12-05 16:45:00"
            },
            {
              tenantId: "T20250005",
              tenantName: "孙七",
              phone: "13800138005",
              roomInfo: "C座-301室",
              tags: "VIP", 
              balance: 890.50,
              balanceStatus: "SUFFICIENT",
              createTime: "2024-11-25 11:00:00"
            },
            {
              tenantId: "T20250006",
              tenantName: "周八",
              phone: "13800138006",
              roomInfo: "C座-302室",
              tags: "NORMAL",
              balance: 78.90,
              balanceStatus: "SUFFICIENT", 
              createTime: "2024-12-03 13:25:00"
            }
          ];
          
          this.tableData = mockData;
          this.pageData.total = mockData.length;
          this.loading = false;
        }, 500);
      },
      
      // 获取余额状态标签
      getBalanceStatusLabel(status) {
        const statusMap = {
          'SUFFICIENT': '充足',
          'INSUFFICIENT': '不足', 
          'ZERO': '为零',
          'ARREARS': '欠费'
        };
        return statusMap[status] || '未知';
      },
      
      // 获取余额状态类型
      getBalanceStatusType(status) {
        const typeMap = {
          'SUFFICIENT': 'success',
          'INSUFFICIENT': 'warning',
          'ZERO': 'info', 
          'ARREARS': 'danger'
        };
        return typeMap[status] || 'info';
      },
      
      // 查询
      handleSearch() {
        this.pageData.current = 1;
        this.fetchTableData();
      },
      
      // 重置
      handleReset() {
        this.queryData = {
          tenantName: "",
          phone: "",
          tags: "",
          balanceStatus: "",
        };
        this.handleSearch();
      },
      
      // 新增租户
      handleAdd() {
        this.$message.info("新增租户功能开发中...");
      },
      
      // 查看详情
      handleDetail(row) {
        this.$message.info(`查看租户 ${row.tenantName} 的详情`);
      },
      
      // 催缴
      handleUrge(row) {
        this.$confirm(`确定要向租户 ${row.tenantName} 发送催缴通知吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }).then(() => {
          this.$message.success('催缴通知发送成功！');
        }).catch(() => {
          this.$message.info('已取消催缴');
        });
      },
      
      // 手动充值
      handleRecharge(row) {
        this.currentTenant = row;
        this.rechargeForm = {
          amount: null,
          remark: ""
        };
        this.rechargeVisible = true;
        this.$nextTick(() => {
          this.$refs.rechargeForm && this.$refs.rechargeForm.clearValidate();
        });
      },
      
      // 充值提交
      handleRechargeSubmit() {
        this.$refs.rechargeForm.validate((valid) => {
          if (valid) {
            this.$confirm(`确定要为租户 ${this.currentTenant.tenantName} 充值 ¥${this.rechargeForm.amount} 吗？`, '确认充值', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning',
            }).then(() => {
              // 模拟充值操作
              setTimeout(() => {
                this.$message.success('充值成功！');
                this.rechargeVisible = false;
                this.fetchTableData(); // 刷新数据
              }, 1000);
            });
          }
        });
      },
      
      // 手动扣款
      handleDeduct(row) {
        this.currentTenant = row;
        this.deductForm = {
          amount: null,
          reason: ""
        };
        this.deductVisible = true;
        this.$nextTick(() => {
          this.$refs.deductForm && this.$refs.deductForm.clearValidate();
        });
      },
      
      // 扣款提交
      handleDeductSubmit() {
        this.$refs.deductForm.validate((valid) => {
          if (valid) {
            this.$confirm(`确定要为租户 ${this.currentTenant.tenantName} 扣款 ¥${this.deductForm.amount} 吗？`, '确认扣款', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning',
            }).then(() => {
              // 模拟扣款操作
              setTimeout(() => {
                this.$message.success('扣款成功！');
                this.deductVisible = false;
                this.fetchTableData(); // 刷新数据
              }, 1000);
            });
          }
        });
      },
      
      // 查看二维码
      handleQrcode(row) {
        this.currentTenant = row;
        this.qrcodeVisible = true;
      },
      
      // 处理下拉命令
      handleCommand(command) {
        switch (command) {
          case "export":
            this.$message.info("导出功能开发中...");
            break;
          case "import":
            this.$message.info("导入功能开发中...");
            break;
          case "batch":
            this.$message.info("批量操作功能开发中...");
            break;
        }
      },
      
      // 处理表格下拉命令
      handleTableCommand(command, row) {
        switch (command) {
          case "recharge":
            this.handleRecharge(row);
            break;
          case "deduct":
            this.handleDeduct(row);
            break;
          case "qrcode":
            this.handleQrcode(row);
            break;
        }
      },
      
      // 选择变化
      handleSelectionChange(selection) {
        this.selectedData = selection;
      },
      
      // 分页大小变化
      handleSizeChange(val) {
        this.pageData.size = val;
        this.pageData.current = 1;
        this.fetchTableData();
      },
      
      // 当前页变化
      handleCurrentChange(val) {
        this.pageData.current = val;
        this.fetchTableData();
      }
    }
  };
  </script>
  
  <style lang="scss" scoped>
  // 引入表格页面公共样式
  @import "@/assets/styles/table-page.scss";
  
  // 视图切换按钮样式
  .view-toggle {
    .el-button {
      padding: 7px 12px;
      
      &.is-active,
      &.el-button--primary {
        background-color: #409eff;
        border-color: #409eff;
        color: #fff;
      }
    }
  }
  
  // 卡片视图样式
  .card-container {
    margin-top: 16px;
    
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
      padding: 20px;
      background: #fff;
      border-radius: 6px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    }
  }
  
  // 租户卡片样式
  .tenant-card {
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.06);
    
    &:hover {
      border-color: #409eff;
      box-shadow: 0 4px 20px 0 rgba(64, 158, 255, 0.15);
      transform: translateY(-2px);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      
      .tenant-basic-info {
        display: flex;
        align-items: center;
        
        .tenant-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          
          i {
            font-size: 24px;
            color: #fff;
          }
        }
        
        .tenant-info {
          .tenant-name {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
            margin: 0 0 4px 0;
            line-height: 1.2;
          }
          
          .tenant-id {
            font-size: 12px;
            color: #909399;
            margin: 0;
            line-height: 1.2;
          }
        }
      }
      
      .tenant-tags {
        flex-shrink: 0;
      }
    }
    
    .card-content {
      .info-row {
        margin-bottom: 12px;
        
        .info-item {
          display: flex;
          align-items: center;
          font-size: 13px;
          
          .info-icon {
            font-size: 14px;
            color: #909399;
            margin-right: 6px;
            width: 14px;
          }
          
          .info-label {
            color: #606266;
            margin-right: 4px;
          }
          
          .info-value {
            color: #303133;
            font-weight: 500;
          }
        }
      }
      
      .balance-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8f9fa;
        border-radius: 8px;
        padding: 12px;
        margin: 16px 0;
        
        .balance-info {
          display: flex;
          flex-direction: column;
          
          .balance-label {
            font-size: 12px;
            color: #909399;
            margin-bottom: 4px;
          }
          
          .balance-amount {
            font-size: 18px;
            font-weight: 600;
          }
        }
        
        .balance-status {
          flex-shrink: 0;
        }
      }
      
      .time-info {
        .create-time {
          font-size: 12px;
          color: #909399;
        }
      }
    }
    
    .card-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f0f2f5;
      
      .el-button {
        flex: 1;
        margin-right: 8px;
        
        &:last-child {
          margin-right: 0;
        }
      }
    }
  }
  
  // 二维码弹窗样式
  .qrcode-container {
    text-align: center;
    
    .qrcode-info {
      margin-bottom: 20px;
      
      h3 {
        color: #303133;
        margin-bottom: 8px;
      }
      
      p {
        color: #606266;
        margin: 4px 0;
        font-size: 14px;
      }
    }
    
    .qrcode-image {
      margin: 20px 0;
      
      .mock-qrcode {
        width: 200px;
        height: 200px;
        border: 2px dashed #dcdfe6;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background: #fafafa;
        
        i {
          font-size: 48px;
          color: #909399;
          margin-bottom: 8px;
        }
        
        p {
          color: #909399;
          font-size: 14px;
          margin: 0;
        }
      }
    }
    
    .qrcode-tips {
      p {
        color: #909399;
        font-size: 13px;
        margin: 0;
      }
    }
  }
  
  // 响应式设计
  @media (max-width: 768px) {
    .card-container {
      .card-grid {
        grid-template-columns: 1fr;
        padding: 16px;
        gap: 16px;
      }
    }
    
    .tenant-card {
      padding: 16px;
      
      .card-header {
        .tenant-basic-info {
          .tenant-avatar {
            width: 40px;
            height: 40px;
            
            i {
              font-size: 20px;
            }
          }
          
          .tenant-info {
            .tenant-name {
              font-size: 14px;
            }
          }
        }
      }
      
      .card-content {
        .balance-section {
          padding: 10px;
          
          .balance-info {
            .balance-amount {
              font-size: 16px;
            }
          }
        }
      }
    }
  }
  
  // 表格操作按钮组样式优化
  .table-actions-group {
    display: flex;
    align-items: center;
    justify-content: center;
    
    .el-button + .el-divider {
      margin: 0 8px;
    }
  }
  </style>