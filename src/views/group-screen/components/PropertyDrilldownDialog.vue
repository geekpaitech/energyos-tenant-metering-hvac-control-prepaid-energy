<template>
  <transition name="trace-dialog-fade">
    <section
      v-if="visible"
      class="trace-dialog-layer"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @click.self="close"
    >
      <div class="trace-dialog">
        <header class="trace-dialog__header">
          <div class="trace-dialog__heading">
            <span class="trace-dialog__icon" aria-hidden="true"><i :class="meta.icon" /></span>
            <div>
              <div class="trace-dialog__title-line">
                <h2 :id="titleId">{{ meta.title }}</h2>
              </div>
              <p>{{ meta.description }}</p>
            </div>
          </div>
          <div class="trace-dialog__header-actions">
            <el-dropdown
              v-if="detailType === 'provider'"
              trigger="click"
              placement="bottom-end"
              :disabled="loading || exporting"
              @command="handleExportCommand"
            >
              <button type="button" class="trace-btn trace-btn--export" :disabled="loading || exporting">
                <i :class="exporting ? 'el-icon-loading' : 'el-icon-download'" aria-hidden="true" />
                {{ exporting ? '导出中' : '导出' }}
                <i class="el-icon-arrow-down el-icon--right" aria-hidden="true" />
              </button>
              <el-dropdown-menu slot="dropdown" class="property-drilldown-export-menu">
                <el-dropdown-item command="current">导出本页</el-dropdown-item>
                <el-dropdown-item command="all">导出全部</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <button type="button" class="trace-dialog__close" aria-label="关闭详情弹窗" @click="close">
              <i class="el-icon-close" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div v-if="showProjectFilters" class="trace-filter">
          <!-- 详情弹窗不重复展示时间：普通模块继承大屏右上角周期，仓库固定查询年初至今天。 -->
          <template v-if="showProjectFilters">
            <div class="trace-filter__field">
              <label>项目类型</label>
              <el-select
                v-model="filters.projectType"
                size="small"
                popper-class="property-drilldown-select"
                placeholder="全部类型"
              >
                <el-option label="全部类型" value="" />
                <el-option v-for="item in projectTypes" :key="item" :label="item" :value="item" />
              </el-select>
            </div>
            <div class="trace-filter__field trace-filter__field--project">
              <label>项目名称</label>
              <el-select
                v-model="filters.projectName"
                size="small"
                filterable
                allow-create
                default-first-option
                clearable
                popper-class="property-drilldown-select"
                placeholder="请选择或输入项目名称"
              >
                <el-option
                  v-for="item in availableProjectNames"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </div>
            <div v-if="showOrderStatusFilter" class="trace-filter__field">
              <label>工单状态</label>
              <el-select
                v-model="filters.orderStatus"
                size="small"
                clearable
                popper-class="property-drilldown-select"
                placeholder="全部状态"
              >
                <el-option label="待提交" :value="1" />
                <el-option label="待派单" :value="2" />
                <el-option label="实施中" :value="3" />
                <el-option label="已完成" :value="4" />
                <el-option label="已关闭" :value="5" />
                <el-option label="非正常关闭" :value="6" />
              </el-select>
            </div>
          </template>
          <div class="trace-filter__actions">
            <a
              v-if="businessSystemUrl"
              class="trace-btn trace-btn--business"
              :href="businessSystemUrl"
              target="_blank"
              rel="noopener noreferrer"
              title="在新标签页打开业务系统"
            >
              <i class="el-icon-link" aria-hidden="true" />
              进入业务系统
            </a>
            <button v-if="showProjectFilters" type="button" class="trace-btn trace-btn--primary" @click="search">查询</button>
            <button v-if="showProjectFilters" type="button" class="trace-btn" @click="resetFilters">重置</button>
            <el-dropdown
              v-if="canExport"
              trigger="click"
              placement="bottom-end"
              :disabled="loading || exporting"
              @command="handleExportCommand"
            >
              <button type="button" class="trace-btn trace-btn--export" :disabled="loading || exporting">
                <i :class="exporting ? 'el-icon-loading' : 'el-icon-download'" aria-hidden="true" />
                {{ exporting ? '导出中' : '导出' }}
                <i class="el-icon-arrow-down el-icon--right" aria-hidden="true" />
              </button>
              <el-dropdown-menu slot="dropdown" class="property-drilldown-export-menu">
                <el-dropdown-item command="current">导出本页</el-dropdown-item>
                <el-dropdown-item command="all">导出全部</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>

        <div class="trace-dialog__body" :aria-busy="loading ? 'true' : 'false'">
          <section v-if="detailType === 'provider'" class="trace-content">
            <div class="trace-summary trace-summary--single">
              <div class="trace-summary__item">
                <span>评价记录</span>
                <strong>{{ formatCount(page.total) }}</strong>
                <small>条</small>
              </div>
              <p>展示供应商类型、评分、评级及评价时间，数据以当前查询周期为准。</p>
            </div>
            <div class="trace-table trace-table--provider">
              <div class="trace-table__head">
                <span>序号</span><span class="is-name-header">供应商名称</span><span>供应商类型</span><span>评分</span><span>评级</span><span>评价时间</span>
              </div>
              <div v-if="!loading && !page.items.length" class="trace-empty">暂无供应商评价数据</div>
              <div v-for="(row, index) in page.items" :key="row.id" class="trace-table__row">
                <span>{{ rowNumber(index) }}</span>
                <span class="is-name" :title="row.name">{{ row.name }}</span>
                <span>{{ row.type }}</span>
                <span class="is-number">{{ formatNumber(row.score, 1) }}</span>
                <span><i class="trace-grade" :class="gradeClass(row.level)">{{ row.level }}</i></span>
                <span>{{ formatDateTime(row.evaluationTime) }}</span>
              </div>
            </div>
          </section>

          <section v-else-if="detailType === 'closure'" class="trace-content">
            <div class="trace-summary">
              <div class="trace-summary__item trace-summary__item--rate">
                <span>巡检工单闭环率</span>
                <strong>{{ formatNumber(summary.totalRate, 2) }}</strong>
                <small v-if="summary.totalRate != null">%</small>
              </div>
              <p>闭环率 = 已完成任务工单数 ÷ 总任务工单数。分类单元格按“已完成 / 总任务”展示。</p>
            </div>
            <div class="trace-table-scroll">
              <div class="trace-table trace-table--closure">
                <div class="trace-table__head">
                  <span>序号</span><span class="is-name-header">项目名称</span><span>闭环率</span><span>三关一闭</span><span>保安巡逻</span><span>保洁巡逻</span><span>设备维保</span><span>设备巡检</span>
                </div>
                <div v-if="!loading && !page.items.length" class="trace-empty">暂无巡检工单闭环数据</div>
                <div v-for="(row, index) in page.items" :key="row.id" class="trace-table__row">
                  <span>{{ rowNumber(index) }}</span>
                  <span class="is-name" :title="row.projectName">{{ row.projectName }}</span>
                  <span class="is-rate">{{ formatNumber(row.projectRate, 2) }}<i v-if="row.projectRate != null">%</i></span>
                  <span>{{ formatPair(row.threeClose) }}</span>
                  <span>{{ formatCombinedPair(row.securityPatrol, row.safetyPatrol) }}</span>
                  <span>{{ formatPair(row.cleaningPatrol) }}</span>
                  <span>{{ formatPair(row.equipmentMaintenance) }}</span>
                  <span>{{ formatCombinedPair(row.equipmentInspection, row.engineeringPatrol) }}</span>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="detailType === 'serviceOrder' || detailType === 'maintenance'" class="trace-content">
            <div class="trace-summary trace-summary--metrics">
              <div class="trace-summary__item">
                <span>{{ detailType === 'serviceOrder' ? '工单总数' : '计划总数' }}</span>
                <strong>{{ formatCount(summary.total) }}</strong><small v-if="summary.total != null">项</small>
              </div>
              <div class="trace-summary__item">
                <span>完成数</span><strong>{{ formatCount(summary.completed) }}</strong><small v-if="summary.completed != null">项</small>
              </div>
              <div class="trace-summary__item trace-summary__item--rate">
                <span>完成率</span><strong>{{ formatNumber(summary.rate, 2) }}</strong><small v-if="summary.rate != null">%</small>
              </div>
              <div v-if="detailType === 'serviceOrder'" class="trace-category-summary">
                <span v-for="item in orderCategories" :key="item.id"><i>{{ item.name }}</i><b>{{ formatCount(item.total) }}</b></span>
              </div>
            </div>
            <div class="trace-table trace-table--project-stat">
              <div class="trace-table__head">
                <span>序号</span><span class="is-name-header">项目名称</span><span>{{ detailType === 'serviceOrder' ? '工单总数' : '计划总数' }}</span><span>完成数</span><span>完成率</span>
              </div>
              <div v-if="!loading && !page.items.length" class="trace-empty">暂无{{ detailType === 'serviceOrder' ? '工单' : '维保计划' }}数据</div>
              <div v-for="(row, index) in page.items" :key="row.id" class="trace-table__row">
                <span>{{ rowNumber(index) }}</span>
                <span class="is-name" :title="row.projectName">{{ row.projectName }}</span>
                <span class="is-number">{{ formatCount(row.total) }}</span>
                <span class="is-number">{{ formatCount(row.completed) }}</span>
                <span class="is-rate">{{ formatNumber(row.rate, 2) }}<i v-if="row.rate != null">%</i></span>
              </div>
            </div>
          </section>

          <section v-else-if="detailType === 'satisfaction'" class="trace-content">
            <div class="trace-summary trace-summary--metrics">
              <div class="trace-summary__item"><span>维修工单</span><strong>{{ formatCount(summary.consultationTotal) }}</strong><small v-if="summary.consultationTotal != null">项</small></div>
              <div class="trace-summary__item"><span>投诉工单</span><strong>{{ formatCount(summary.complaintTotal) }}</strong><small v-if="summary.complaintTotal != null">项</small></div>
              <div class="trace-summary__item trace-summary__item--rate"><span>服务满意度</span><strong>{{ formatNumber(summary.satisfactionRate, 2) }}</strong><small v-if="summary.satisfactionRate != null">%</small></div>
              <p>满意度评价明细按当前统计周期及项目条件查询。</p>
            </div>
            <div class="trace-table-scroll trace-table-scroll--satisfaction trace-screen-scrollbar">
              <div class="trace-table trace-table--satisfaction">
                <div class="trace-table__head"><span>序号</span><span class="is-name-header">项目名称</span><span>工单类型</span><span class="is-content-header">工单内容</span><span>受理人</span><span>处理人</span><span>服务评分</span></div>
                <div v-if="!loading && !page.items.length" class="trace-empty">暂无满意度评价数据</div>
                <div v-for="(row, index) in page.items" :key="row.id" class="trace-table__row trace-table__row--tall">
                  <span>{{ rowNumber(index) }}</span><span class="is-name" :title="row.projectName">{{ row.projectName }}</span>
                  <span :title="row.category">{{ row.category }}</span>
                  <span class="is-multiline" :title="row.content">{{ compactText(row.content) }}</span>
                  <span>{{ row.acceptUserName }}</span><span>{{ row.responsibleUserName }}</span>
                  <span class="trace-stars" :title="formatStarLabel(row.starLevel)">{{ formatStars(row.starLevel) }}</span>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="detailType === 'rectification'" class="trace-content">
            <div class="trace-summary trace-summary--metrics trace-summary--rectification">
              <div class="trace-summary__item"><span>整改总数</span><strong>{{ formatCount(summary.total) }}</strong><small v-if="summary.total != null">项</small></div>
              <div class="trace-summary__item"><span>已整改</span><strong>{{ formatCount(summary.completed) }}</strong><small v-if="summary.completed != null">项</small></div>
              <div class="trace-summary__item trace-summary__item--warning"><span>待整改</span><strong>{{ formatCount(summary.pending) }}</strong><small v-if="summary.pending != null">项</small></div>
            </div>
            <div class="trace-table trace-table--rectification trace-screen-scrollbar">
              <div class="trace-table__head"><span>序号</span><span class="is-name-header">项目名称</span><span>工单内容</span><span>受理人</span><span>处理人</span><span>整改状态</span></div>
              <div v-if="!loading && !page.items.length" class="trace-empty">暂无待整改工单数据</div>
              <div v-for="(row, index) in page.items" :key="row.id" class="trace-table__row trace-table__row--tall">
                <span>{{ rowNumber(index) }}</span><span class="is-name" :title="row.projectName">{{ row.projectName }}</span>
                <span class="is-multiline" :title="row.content">{{ compactText(row.content) }}</span>
                <span>{{ row.acceptUserName }}</span><span>{{ row.responsibleUserName }}</span><span class="trace-status">{{ row.status }}</span>
              </div>
            </div>
          </section>

          <section v-else-if="detailType === 'hazard'" class="trace-content">
            <div class="trace-summary">
              <div class="trace-summary__item trace-summary__item--warning">
                <span>隐患未整改数</span>
                <strong>{{ formatCount(summary.total) }}</strong>
                <small v-if="summary.total != null">项</small>
              </div>
              <p>口径为物业品质与安全整改中，处于待派单或实施中的未完成工单。</p>
            </div>
            <div class="trace-table trace-table--hazard trace-screen-scrollbar">
              <div class="trace-table__head">
                <span>序号</span><span class="is-name-header">项目名称</span><span>工单内容</span><span>受理人</span><span>处理人</span><span>处理时限</span><span>最新处理汇报</span>
              </div>
              <div v-if="!loading && !page.items.length" class="trace-empty">暂无未整改工单数据</div>
              <div v-for="(row, index) in page.items" :key="row.id" class="trace-table__row trace-table__row--tall">
                <span>{{ rowNumber(index) }}</span>
                <span class="is-name" :title="row.projectName">{{ row.projectName }}</span>
                <span class="is-multiline" :title="row.content">{{ compactText(row.content) }}</span>
                <span>{{ row.acceptUserName }}</span>
                <span>{{ row.responsibleUserName }}</span>
                <span>{{ formatDateTime(row.deadline) }}</span>
                <span class="is-multiline" :title="row.result">{{ compactText(row.result) }}</span>
              </div>
            </div>
          </section>

          <section v-else-if="detailType === 'videoAi'" class="trace-content">
            <div class="trace-summary trace-summary--single">
              <div class="trace-summary__item">
                <span>工单总数</span>
                <strong>{{ formatCount(page.total) }}</strong>
                <small>项</small>
              </div>
              <p>展示视频 AI 风控告警关联工单。</p>
            </div>
            <div class="trace-table-scroll trace-table-scroll--video-ai trace-screen-scrollbar">
              <div class="trace-table trace-table--video-ai">
                <div class="trace-table__head">
                  <span>序号</span><span>报警图片</span><span>工单编号</span><span class="is-name-header">项目名称</span><span>工单类别</span><span>任务内容</span><span>受理人</span><span>责任人</span><span>处理时限</span><span>工单状态</span>
                </div>
                <div v-if="!loading && !page.items.length" class="trace-empty">暂无视频 AI 风控工单数据</div>
                <div v-for="(row, index) in page.items" :key="row.id" class="trace-table__row trace-table__row--video-ai">
                  <span>{{ rowNumber(index) }}</span>
                  <span
                    class="trace-alarm-picture"
                    :class="{ 'is-clickable': row.alarmPicUrl }"
                    :role="row.alarmPicUrl ? 'button' : null"
                    :tabindex="row.alarmPicUrl ? 0 : null"
                    :aria-label="row.alarmPicUrl ? `查看第${rowNumber(index)}条报警图片` : null"
                    @click="openAlarmPreview(row)"
                    @keydown.enter="openAlarmPreview(row)"
                    @keydown.space.prevent="openAlarmPreview(row)"
                  >
                    <img v-if="row.alarmPicUrl" :src="row.alarmPicUrl" alt="报警截图">
                    <i v-else>暂无图片</i>
                  </span>
                  <span :title="row.code">{{ row.code }}</span>
                  <span class="is-name" :title="row.projectName">{{ row.projectName }}</span>
                  <span :title="row.category">{{ row.category }}</span>
                  <span class="is-multiline" :title="row.content">{{ compactText(row.content) }}</span>
                  <span>{{ row.acceptUserName }}</span>
                  <span>{{ row.responsibleUserName }}</span>
                  <span>{{ formatDateTime(row.deadline) }}</span>
                  <span><i class="trace-order-status" :class="orderStatusClass(row.orderStatus)">{{ orderStatusText(row.orderStatus) }}</i></span>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="detailType === 'warehouse'" class="trace-content">
            <div class="trace-summary trace-summary--warehouse">
              <div class="trace-summary__item">
                <span>物料总量</span><strong>{{ formatCount(summary.materialCount) }}</strong><small v-if="summary.materialCount != null">件</small>
              </div>
              <div class="trace-summary__item">
                <span>物料类别</span><strong>{{ formatCount(summary.categoryCount) }}</strong><small v-if="summary.categoryCount != null">类</small>
              </div>
              <div class="trace-summary__item trace-summary__item--money">
                <span>库存总价值</span><strong>{{ formatMoney(summary.totalValue) }}</strong><small v-if="summary.totalValue != null">元</small>
              </div>
              <p>库存总价值按物料库存数量与物料均价汇总。</p>
            </div>
            <div class="trace-tabs" role="tablist" aria-label="仓库详情类型">
              <button type="button" :class="{ 'is-active': warehouseTab === 'project' }" @click="warehouseTab = 'project'">项目物料价值</button>
              <button type="button" :class="{ 'is-active': warehouseTab === 'category' }" @click="warehouseTab = 'category'">类别价值占比</button>
            </div>
            <div v-if="warehouseTab === 'project'" class="trace-table trace-table--warehouse trace-screen-scrollbar">
              <div class="trace-table__head"><span>序号</span><span class="is-name-header">项目名称</span><span>库存数量</span><span>物料价值总额（元）</span></div>
              <div v-if="!loading && !page.items.length" class="trace-empty">暂无项目物料价值数据</div>
              <div v-for="(row, index) in page.items" :key="row.id" class="trace-table__row">
                <span>{{ rowNumber(index) }}</span><span class="is-name">{{ row.projectName }}</span><span class="is-number">{{ formatCount(row.inventoryQty) }}</span><span class="is-number">{{ formatMoney(row.totalPrice) }}</span>
              </div>
            </div>
            <div v-else class="warehouse-category-view trace-screen-scrollbar">
              <div v-if="!loading && !categories.length" class="trace-empty">暂无类别价值占比数据</div>
              <div v-for="(row, index) in categories" :key="row.id" class="warehouse-category-row">
                <span class="warehouse-category-row__index">{{ index + 1 }}</span>
                <span class="warehouse-category-row__name">{{ row.name }}</span>
                <span class="warehouse-category-row__bar"><i :style="{ width: categoryWidth(row.percentage) }" /></span>
                <strong>{{ formatNumber(row.percentage, 2) }}<i v-if="row.percentage != null">%</i></strong>
                <em>¥{{ formatMoney(row.amount) }}</em>
              </div>
            </div>
          </section>

          <div v-if="errorMessage && !loading" class="trace-error">
            <i class="el-icon-warning-outline" aria-hidden="true" />
            <span>{{ errorMessage }}</span>
            <button type="button" @click="fetchData">重新加载</button>
          </div>
          <div v-if="loading" class="trace-loading" role="status" aria-live="polite">
            <i class="el-icon-loading" aria-hidden="true" /><span>详情数据加载中…</span>
          </div>
        </div>

        <footer v-if="showPagination" class="trace-dialog__footer">
          <span>共 {{ page.total }} 条</span>
          <el-pagination
            background
            popper-class="property-drilldown-pagination"
            layout="sizes, prev, pager, next"
            :current-page="page.pageIndex + 1"
            :page-size="page.pageSize"
            :page-sizes="[5, 10, 20, 50]"
            :total="page.total"
            @size-change="changePageSize"
            @current-change="changePage"
          />
        </footer>
      </div>

      <div
        v-if="alarmPreviewVisible"
        class="alarm-preview-layer"
        role="dialog"
        aria-modal="true"
        aria-label="报警图片查看"
        @click.self="closeAlarmPreview"
      >
        <button type="button" class="alarm-preview__close" aria-label="关闭图片查看" @click="closeAlarmPreview">
          <i class="el-icon-close" aria-hidden="true" />
        </button>
        <button
          v-if="alarmPreviewImages.length > 1"
          type="button"
          class="alarm-preview__arrow alarm-preview__arrow--left"
          aria-label="查看上一张"
          @click="previousAlarmImage"
        ><i class="el-icon-arrow-left" aria-hidden="true" /></button>
        <div class="alarm-preview__content">
          <img :src="currentAlarmImage.url" :alt="currentAlarmImage.label">
          <p>{{ currentAlarmImage.label }}</p>
          <span v-if="alarmPreviewImages.length > 1">{{ alarmPreviewIndex + 1 }} / {{ alarmPreviewImages.length }}</span>
        </div>
        <button
          v-if="alarmPreviewImages.length > 1"
          type="button"
          class="alarm-preview__arrow alarm-preview__arrow--right"
          aria-label="查看下一张"
          @click="nextAlarmImage"
        ><i class="el-icon-arrow-right" aria-hidden="true" /></button>
      </div>
    </section>
  </transition>
</template>

<script>
import {
  queryProviderEvaluationDetails,
  queryInspectionClosureSummary,
  queryInspectionClosureDetails,
  queryHazardSummary,
  queryHazardDetails,
  queryWarehouseSummary,
  queryWarehouseProjectDetails,
  queryWarehouseCategoryRatios,
  queryServiceWorkOrderSummary,
  queryServiceWorkOrderDetails,
  queryServiceWorkOrderCategories,
  queryMaintenanceSummary,
  queryMaintenanceDetails,
  queryTenantServiceSummary,
  querySatisfactionDetails,
  queryRectificationSummary,
  queryPendingRectificationDetails,
  queryVideoAiRiskControlWorkOrderDetails
} from '@/api/groupPropertyMingYuan'
import { buildMingYuanQuery, buildMingYuanWarehouseQuery } from '../utils/mingYuanQuery'
import { MINGYUAN_PROJECT_TYPES, getMingYuanProjectNames } from '../config/mingYuanProjects'
import * as XLSX from 'xlsx'

const DETAIL_EXPORT_PAGE_SIZE = 500
const DETAIL_EXPORT_LIMIT = 2000
const BUSINESS_SYSTEM_URLS = Object.freeze({
  warehouse: 'https://yewu.wzjkzg.com/std/10487201/08dc6dd7-7c5f-4ff8-8c7b-500aa2d9e0b3?nav_code=14178&sub_nav_code=14183',
  maintenance: 'https://yewu.wzjkzg.com/std/10487401/08dc75ab-61d9-4339-8a81-1b868788b20f?nav_code=14178&sub_nav_code=14195',
  serviceOrder: 'https://yewu.wzjkzg.com/std/10487301/08dc8147-c180-4bdd-8471-afd8a39a74ac?nav_code=14178&sub_nav_code=14206'
})
const EXPORTABLE_DETAIL_TYPES = Object.freeze([
  'provider',
  'closure',
  'hazard',
  'warehouse',
  'serviceOrder',
  'maintenance',
  'satisfaction',
  'rectification',
  'videoAi'
])

const META = Object.freeze({
  provider: {
    title: '供应商评价明细',
    description: '查看供应商评分、评级及评价时间',
    icon: 'el-icon-s-custom'
  },
  closure: {
    title: '巡检工单闭环明细',
    description: '按项目核对各类巡逻与设备维护任务完成情况',
    icon: 'el-icon-document-checked'
  },
  hazard: {
    title: '隐患未整改明细',
    description: '查看物业品质与安全整改未完成工单',
    icon: 'el-icon-warning-outline'
  },
  warehouse: {
    title: '仓库物料明细',
    description: '查看项目库存价值与物料类别价值构成',
    icon: 'el-icon-box'
  },
  serviceOrder: {
    title: '服务工单明细',
    description: '按项目追溯服务工单总量、完成量及完成率',
    icon: 'el-icon-s-order'
  },
  maintenance: {
    title: '维保计划明细',
    description: '按项目查看维保计划任务及完成情况',
    icon: 'el-icon-setting'
  },
  satisfaction: {
    title: '租户服务满意度明细',
    description: '查看维修、投诉及工单服务评价记录',
    icon: 'el-icon-star-off'
  },
  rectification: {
    title: '待整改明细',
    description: '查看品质与安全整改中尚未完成的工单',
    icon: 'el-icon-document'
  },
  videoAi: {
    title: '视频AI风控工单明细',
    description: '查看告警图片及关联工单的处理进度与责任信息',
    icon: 'el-icon-video-camera'
  }
})

function emptyPage (pageSize = 10) {
  return { total: 0, pageIndex: 0, pageSize, pages: 0, items: [] }
}

function reflect (promise) {
  return promise.then(value => ({ value }), error => ({ error }))
}

export default {
  name: 'PropertyDrilldownDialog',
  props: {
    visible: { type: Boolean, default: false },
    detailType: { type: String, default: 'provider' },
    activeScope: { type: String, default: '全部' },
    activeTime: { type: String, default: '本月' }
  },
  data () {
    return {
      projectTypes: [...MINGYUAN_PROJECT_TYPES],
      filters: { projectType: '', projectName: '', orderStatus: '' },
      page: emptyPage(),
      summary: {},
      categories: [],
      orderCategories: [],
      warehouseTab: 'project',
      loading: false,
      exporting: false,
      errorMessage: '',
      requestId: 0,
      alarmPreviewVisible: false,
      alarmPreviewIndex: 0
    }
  },
  computed: {
    meta () {
      return META[this.detailType] || META.provider
    },
    titleId () {
      return `property-trace-title-${this.detailType}`
    },
    showProjectFilters () {
      return this.detailType !== 'provider'
    },
    showOrderStatusFilter () {
      return this.detailType === 'videoAi'
    },
    showPagination () {
      return this.detailType !== 'warehouse' || this.warehouseTab === 'project'
    },
    canExport () {
      return EXPORTABLE_DETAIL_TYPES.includes(this.detailType)
    },
    businessSystemUrl () {
      return BUSINESS_SYSTEM_URLS[this.detailType] || ''
    },
    availableProjectNames () {
      return getMingYuanProjectNames(this.filters.projectType)
    },
    alarmPreviewImages () {
      return this.page.items
        .filter(row => row.alarmPicUrl)
        .map(row => ({
          id: row.id,
          url: row.alarmPicUrl,
          label: `${row.projectName} · ${row.code}`
        }))
    },
    currentAlarmImage () {
      return this.alarmPreviewImages[this.alarmPreviewIndex] || { url: '', label: '报警图片' }
    }
  },
  watch: {
    'filters.projectType' () {
      if (this.filters.projectName && !this.availableProjectNames.includes(this.filters.projectName)) {
        this.filters.projectName = ''
      }
    },
    visible (value) {
      if (value) this.initialize()
    },
    detailType () {
      if (this.visible) this.initialize()
    },
    activeScope () {
      if (this.visible) this.initialize()
    },
    activeTime () {
      // 仓库接口与时间无关，右上角时间切换时不重复请求仓库数据。
      if (this.visible && this.detailType !== 'warehouse') this.initialize()
    }
  },
  mounted () {
    window.addEventListener('keydown', this.handleKeydown)
  },
  beforeDestroy () {
    window.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    initialProjectType () {
      return this.activeScope === '全部' ? '' : this.activeScope
    },
    initialize () {
      this.filters = {
        projectType: this.initialProjectType(),
        projectName: '',
        orderStatus: ''
      }
      this.closeAlarmPreview()
      this.page = emptyPage()
      this.summary = {}
      this.categories = []
      this.orderCategories = []
      this.warehouseTab = 'project'
      this.fetchData()
    },
    requestParams () {
      if (this.detailType === 'warehouse') {
        // 仓库固定查询当年年初至今天，不继承右上角时间；其余筛选只传业态、项目和分页。
        return buildMingYuanWarehouseQuery({
          scope: this.activeScope,
          projectType: this.filters.projectType,
          projectName: this.filters.projectName,
          pageIndex: this.page.pageIndex,
          pageSize: this.page.pageSize
        })
      }
      // 其他明源详情仍继承大屏右上角的时间周期与业态。
      return buildMingYuanQuery({
        scope: this.activeScope,
        period: this.activeTime,
        projectType: this.filters.projectType,
        projectName: this.filters.projectName,
        orderStatus: this.detailType === 'videoAi' ? this.filters.orderStatus : '',
        pageIndex: this.page.pageIndex,
        pageSize: this.page.pageSize
      })
    },
    nonPagedParams (params) {
      const result = { ...params }
      delete result.pageIndex
      delete result.pageSize
      return result
    },
    applyPartialResults (results, assignments) {
      if (results.every(result => result.error)) {
        throw results.find(result => result.error).error
      }
      results.forEach((result, index) => {
        assignments[index](result.value)
        if (result.error) console.error(`[group-screen] ${this.detailType} partial query failed`, result.error)
      })
    },
    async fetchData () {
      const requestId = ++this.requestId
      this.loading = true
      this.errorMessage = ''
      const params = this.requestParams()
      const nonPagedParams = this.nonPagedParams(params)
      try {
        if (this.detailType === 'provider') {
          const page = await queryProviderEvaluationDetails(params)
          if (requestId !== this.requestId) return
          this.page = page
          this.summary = {}
        } else if (this.detailType === 'closure') {
          const results = await Promise.all([
            reflect(queryInspectionClosureSummary(nonPagedParams)),
            reflect(queryInspectionClosureDetails(params))
          ])
          if (requestId !== this.requestId) return
          this.applyPartialResults(results, [
            summary => { this.summary = summary || {} },
            page => { this.page = page || emptyPage(this.page.pageSize) }
          ])
        } else if (this.detailType === 'hazard') {
          const results = await Promise.all([
            reflect(queryHazardSummary(nonPagedParams)),
            reflect(queryHazardDetails(params))
          ])
          if (requestId !== this.requestId) return
          this.applyPartialResults(results, [
            summary => { this.summary = summary || {} },
            page => { this.page = page || emptyPage(this.page.pageSize) }
          ])
        } else if (this.detailType === 'warehouse') {
          const results = await Promise.all([
            reflect(queryWarehouseSummary(nonPagedParams)),
            reflect(queryWarehouseProjectDetails(params)),
            reflect(queryWarehouseCategoryRatios(nonPagedParams))
          ])
          if (requestId !== this.requestId) return
          this.applyPartialResults(results, [
            summary => { this.summary = summary || {} },
            page => { this.page = page || emptyPage(this.page.pageSize) },
            categories => { this.categories = categories || [] }
          ])
        } else if (this.detailType === 'serviceOrder') {
          const results = await Promise.all([
            reflect(queryServiceWorkOrderSummary(nonPagedParams)),
            reflect(queryServiceWorkOrderDetails(params)),
            reflect(queryServiceWorkOrderCategories(nonPagedParams))
          ])
          if (requestId !== this.requestId) return
          this.applyPartialResults(results, [
            summary => { this.summary = summary || {} },
            page => { this.page = page || emptyPage(this.page.pageSize) },
            categories => { this.orderCategories = categories || [] }
          ])
        } else if (this.detailType === 'maintenance') {
          const results = await Promise.all([
            reflect(queryMaintenanceSummary(nonPagedParams)),
            reflect(queryMaintenanceDetails(params))
          ])
          if (requestId !== this.requestId) return
          this.applyPartialResults(results, [
            summary => { this.summary = summary || {} },
            page => { this.page = page || emptyPage(this.page.pageSize) }
          ])
        } else if (this.detailType === 'satisfaction') {
          const results = await Promise.all([
            reflect(queryTenantServiceSummary(nonPagedParams)),
            reflect(querySatisfactionDetails(params))
          ])
          if (requestId !== this.requestId) return
          this.applyPartialResults(results, [
            summary => { this.summary = summary || {} },
            page => { this.page = page || emptyPage(this.page.pageSize) }
          ])
        } else if (this.detailType === 'rectification') {
          const results = await Promise.all([
            reflect(queryRectificationSummary(nonPagedParams)),
            reflect(queryPendingRectificationDetails(params))
          ])
          if (requestId !== this.requestId) return
          this.applyPartialResults(results, [
            summary => { this.summary = summary || {} },
            page => { this.page = page || emptyPage(this.page.pageSize) }
          ])
        } else if (this.detailType === 'videoAi') {
          const page = await queryVideoAiRiskControlWorkOrderDetails(params)
          if (requestId !== this.requestId) return
          this.page = page || emptyPage(this.page.pageSize)
          this.summary = {}
        }
      } catch (error) {
        if (requestId !== this.requestId) return
        this.summary = {}
        this.page = emptyPage(this.page.pageSize)
        this.categories = []
        this.orderCategories = []
        this.errorMessage = error && error.message ? error.message : '详情数据获取失败'
      } finally {
        if (requestId === this.requestId) this.loading = false
      }
    },
    search () {
      this.page.pageIndex = 0
      this.fetchData()
    },
    resetFilters () {
      this.filters = {
        projectType: this.initialProjectType(),
        projectName: '',
        orderStatus: ''
      }
      this.page.pageIndex = 0
      this.fetchData()
    },
    changePage (currentPage) {
      this.page.pageIndex = Math.max(0, Number(currentPage) - 1)
      this.fetchData()
    },
    changePageSize (pageSize) {
      this.page.pageSize = Number(pageSize) || 10
      this.page.pageIndex = 0
      this.fetchData()
    },
    handleExportCommand (command) {
      if (command === 'current') this.exportCurrentPage()
      if (command === 'all') this.exportAllRows()
    },
    exportCurrentPage () {
      const source = this.detailType === 'warehouse' && this.warehouseTab === 'category'
        ? this.categories
        : this.page.items
      const rows = this.filterExportRows(source)
      if (!rows.length) {
        this.$message.warning('当前页暂无可导出的数据')
        return
      }
      try {
        const startIndex = this.detailType === 'warehouse' && this.warehouseTab === 'category'
          ? 0
          : this.page.pageIndex * this.page.pageSize
        this.buildExportWorkbook(
          rows,
          '本页',
          startIndex
        )
        this.$message.success(`已导出本页 ${rows.length} 条数据`)
      } catch (error) {
        console.error(`[group-screen] ${this.detailType} current page export failed`, error)
        this.$message.error(`${this.exportTitle()}导出失败，请稍后重试`)
      }
    },
    async exportAllRows () {
      if (this.exporting) return
      this.exporting = true
      try {
        const rows = this.filterExportRows(await this.fetchAllExportRows())
          .slice(0, DETAIL_EXPORT_LIMIT)
        if (!rows.length) {
          this.$message.warning('当前查询条件下暂无可导出的数据')
          return
        }
        this.buildExportWorkbook(rows, '全部')
        this.$message.success(`已导出全部 ${rows.length} 条数据`)
      } catch (error) {
        console.error(`[group-screen] ${this.detailType} all rows export failed`, error)
        this.$message.error(`${this.exportTitle()}导出失败，请稍后重试`)
      } finally {
        this.exporting = false
      }
    },
    async fetchAllExportRows () {
      const params = this.nonPagedParams(this.requestParams())
      if (this.detailType === 'warehouse' && this.warehouseTab === 'category') {
        return queryWarehouseCategoryRatios(params)
      }

      const query = this.exportPageQuery()
      if (!query) return []
      const firstPage = await query({
        ...params,
        pageIndex: 0,
        pageSize: DETAIL_EXPORT_PAGE_SIZE
      })
      const rows = [...firstPage.items]
      const pageSize = Math.max(1, Number(firstPage.pageSize) || DETAIL_EXPORT_PAGE_SIZE)
      const pageCount = Math.max(
        Number(firstPage.pages) || 0,
        Math.ceil((Number(firstPage.total) || rows.length) / pageSize)
      )
      const exportPageCount = Math.min(
        pageCount,
        Math.ceil(DETAIL_EXPORT_LIMIT / pageSize)
      )

      for (let pageIndex = 1; pageIndex < exportPageCount && rows.length < DETAIL_EXPORT_LIMIT; pageIndex += 1) {
        const page = await query({
          ...params,
          pageIndex,
          pageSize: DETAIL_EXPORT_PAGE_SIZE
        })
        rows.push(...page.items)
      }
      return rows.slice(0, DETAIL_EXPORT_LIMIT)
    },
    exportPageQuery () {
      return {
        provider: queryProviderEvaluationDetails,
        closure: queryInspectionClosureDetails,
        hazard: queryHazardDetails,
        warehouse: queryWarehouseProjectDetails,
        serviceOrder: queryServiceWorkOrderDetails,
        maintenance: queryMaintenanceDetails,
        satisfaction: querySatisfactionDetails,
        rectification: queryPendingRectificationDetails,
        videoAi: queryVideoAiRiskControlWorkOrderDetails
      }[this.detailType]
    },
    filterExportRows (rows) {
      const normalizedRows = Array.isArray(rows) ? rows : []
      if (this.detailType !== 'rectification') return normalizedRows
      return normalizedRows.filter(row => {
        const status = String(row && row.status != null ? row.status : '')
          .replace(/\s+/g, '')
          .trim()
        return status === '待整改'
      })
    },
    exportColumns () {
      const percent = value => value == null ? '--' : `${this.formatNumber(value, 2)}%`
      const columns = {
        provider: [
          { label: '供应商名称', width: 24, value: row => row.name },
          { label: '供应商类型', width: 22, value: row => row.type },
          { label: '评分', width: 12, value: row => this.formatNumber(row.score, 1) },
          { label: '评级', width: 12, value: row => row.level },
          { label: '评价时间', width: 22, value: row => this.formatDateTime(row.evaluationTime) }
        ],
        closure: [
          { label: '项目名称', width: 24, value: row => row.projectName },
          { label: '闭环率', width: 14, value: row => percent(row.projectRate) },
          { label: '三关一闭', width: 16, value: row => this.formatPair(row.threeClose) },
          { label: '保安巡逻', width: 24, value: row => this.formatCombinedPair(row.securityPatrol, row.safetyPatrol) },
          { label: '保洁巡逻', width: 16, value: row => this.formatPair(row.cleaningPatrol) },
          { label: '设备维保', width: 16, value: row => this.formatPair(row.equipmentMaintenance) },
          { label: '设备巡检', width: 24, value: row => this.formatCombinedPair(row.equipmentInspection, row.engineeringPatrol) }
        ],
        hazard: [
          { label: '项目名称', width: 24, value: row => row.projectName },
          { label: '工单内容', width: 48, value: row => this.compactText(row.content) },
          { label: '受理人', width: 16, value: row => row.acceptUserName },
          { label: '处理人', width: 16, value: row => row.responsibleUserName },
          { label: '处理时限', width: 22, value: row => this.formatDateTime(row.deadline) },
          { label: '最新处理汇报', width: 48, value: row => this.compactText(row.result) }
        ],
        warehouseProject: [
          { label: '项目名称', width: 24, value: row => row.projectName },
          { label: '库存数量', width: 16, value: row => this.formatCount(row.inventoryQty) },
          { label: '物料价值总额（元）', width: 22, value: row => this.formatMoney(row.totalPrice) }
        ],
        warehouseCategory: [
          { label: '物料类别', width: 24, value: row => row.name },
          { label: '价值占比', width: 16, value: row => percent(row.percentage) },
          { label: '金额（元）', width: 20, value: row => this.formatMoney(row.amount) }
        ],
        serviceOrder: [
          { label: '项目名称', width: 24, value: row => row.projectName },
          { label: '工单总数', width: 16, value: row => this.formatCount(row.total) },
          { label: '完成数', width: 16, value: row => this.formatCount(row.completed) },
          { label: '完成率', width: 14, value: row => percent(row.rate) }
        ],
        maintenance: [
          { label: '项目名称', width: 24, value: row => row.projectName },
          { label: '计划总数', width: 16, value: row => this.formatCount(row.total) },
          { label: '完成数', width: 16, value: row => this.formatCount(row.completed) },
          { label: '完成率', width: 14, value: row => percent(row.rate) }
        ],
        satisfaction: [
          { label: '项目名称', width: 24, value: row => row.projectName },
          { label: '工单类型', width: 18, value: row => row.category },
          { label: '工单内容', width: 48, value: row => this.compactText(row.content) },
          { label: '受理人', width: 16, value: row => row.acceptUserName },
          { label: '处理人', width: 16, value: row => row.responsibleUserName },
          { label: '服务评分', width: 18, value: row => this.formatStars(row.starLevel) }
        ],
        rectification: [
          { label: '项目名称', width: 24, value: row => row.projectName },
          { label: '工单内容', width: 48, value: row => this.compactText(row.content) },
          { label: '受理人', width: 16, value: row => row.acceptUserName },
          { label: '处理人', width: 16, value: row => row.responsibleUserName },
          { label: '整改状态', width: 14, value: row => row.status }
        ],
        videoAi: [
          {
            label: '报警图片',
            width: 48,
            value: row => row.alarmPicUrl
              ? this.exportHyperlinkCell(row.alarmPicUrl)
              : '--'
          },
          { label: '工单编号', width: 24, value: row => row.code },
          { label: '项目名称', width: 24, value: row => row.projectName },
          { label: '工单类别', width: 18, value: row => row.category },
          { label: '任务内容', width: 48, value: row => this.compactText(row.content) },
          { label: '受理人', width: 16, value: row => row.acceptUserName },
          { label: '责任人', width: 16, value: row => row.responsibleUserName },
          { label: '处理时限', width: 22, value: row => this.formatDateTime(row.deadline) },
          { label: '工单状态', width: 16, value: row => this.orderStatusText(row.orderStatus) }
        ]
      }
      if (this.detailType === 'warehouse') {
        return this.warehouseTab === 'category' ? columns.warehouseCategory : columns.warehouseProject
      }
      return columns[this.detailType] || []
    },
    exportHyperlinkCell (url) {
      const value = String(url || '')
      const formulaValue = value.replace(/"/g, '""')
      return {
        t: 'str',
        v: value,
        f: `HYPERLINK("${formulaValue}","${formulaValue}")`,
        l: { Target: value, Tooltip: '查看报警图片' }
      }
    },
    buildExportWorkbook (rows, rangeLabel, startIndex = 0) {
      const columns = this.exportColumns()
      const headers = ['序号', ...columns.map(column => column.label)]
      const data = rows.map((row, index) => [
        startIndex + index + 1,
        ...columns.map(column => column.value(row))
      ])
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...data])
      sheet['!cols'] = [{ wch: 8 }, ...columns.map(column => ({ wch: column.width }))]
      const workbook = XLSX.utils.book_new()
      const title = this.exportTitle()
      XLSX.utils.book_append_sheet(workbook, sheet, title.slice(0, 31))
      XLSX.writeFile(workbook, `${title}_${rangeLabel}_${this.exportTimestamp()}.xlsx`)
    },
    exportTitle () {
      if (this.detailType === 'warehouse' && this.warehouseTab === 'category') return '仓库物料类别价值占比'
      if (this.detailType === 'warehouse') return '仓库项目物料价值明细'
      return this.meta.title
    },
    exportTimestamp () {
      const now = new Date()
      const pad = value => String(value).padStart(2, '0')
      return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    },
    close () {
      this.requestId += 1
      this.loading = false
      this.closeAlarmPreview()
      this.$emit('close')
    },
    handleKeydown (event) {
      if (!this.visible) return
      if (this.alarmPreviewVisible && event.key === 'ArrowLeft') {
        event.preventDefault()
        this.previousAlarmImage()
      } else if (this.alarmPreviewVisible && event.key === 'ArrowRight') {
        event.preventDefault()
        this.nextAlarmImage()
      } else if (this.alarmPreviewVisible && event.key === 'Escape') {
        this.closeAlarmPreview()
      } else if (event.key === 'Escape') {
        this.close()
      }
    },
    rowNumber (index) {
      return this.page.pageIndex * this.page.pageSize + index + 1
    },
    formatCount (value) {
      if (value == null || value === '' || !Number.isFinite(Number(value))) return '--'
      return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 0 })
    },
    formatNumber (value, digits = 2) {
      if (value == null || value === '' || !Number.isFinite(Number(value))) return '--'
      return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: digits })
    },
    formatMoney (value) {
      if (value == null || value === '' || !Number.isFinite(Number(value))) return '--'
      return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    formatPair (pair) {
      if (!Array.isArray(pair) || pair.length < 2 || pair[0] == null || pair[1] == null) return '--'
      return `${this.formatCount(pair[0])} / ${this.formatCount(pair[1])}`
    },
    formatCombinedPair (...pairs) {
      const sumAt = index => pairs.reduce((sum, pair) => {
        const value = Array.isArray(pair) ? Number(pair[index]) : 0
        return sum + (Number.isFinite(value) ? value : 0)
      }, 0)
      return this.formatPair([sumAt(0), sumAt(1)])
    },
    formatDateTime (value) {
      if (!value) return '--'
      return String(value).replace('T', ' ').slice(0, 19)
    },
    compactText (value) {
      return value ? String(value).replace(/\s+/g, ' ').trim() : '--'
    },
    formatStars (value) {
      if (value == null || value === '') return '--'
      const numeric = Number(value)
      if (!Number.isFinite(numeric)) return String(value)
      const count = Math.max(0, Math.min(5, Math.round(numeric)))
      return count ? `${'★'.repeat(count)}${'☆'.repeat(5 - count)}` : '0 星'
    },
    formatStarLabel (value) {
      if (value == null || value === '') return '暂无评分'
      return Number.isFinite(Number(value)) ? `${Number(value)} 星` : String(value)
    },
    gradeClass (level) {
      const normalized = String(level || '').toLowerCase()
      return ['a', 'b', 'c', 'd', 'e'].includes(normalized) ? `is-${normalized}` : ''
    },
    categoryWidth (value) {
      if (value == null || !Number.isFinite(Number(value))) return '0%'
      return `${Math.max(0, Math.min(100, Number(value)))}%`
    },
    openAlarmPreview (row) {
      if (!row || !row.alarmPicUrl) return
      const index = this.alarmPreviewImages.findIndex(item => item.id === row.id)
      this.alarmPreviewIndex = Math.max(0, index)
      this.alarmPreviewVisible = true
    },
    closeAlarmPreview () {
      this.alarmPreviewVisible = false
      this.alarmPreviewIndex = 0
    },
    previousAlarmImage () {
      const length = this.alarmPreviewImages.length
      if (length <= 1) return
      this.alarmPreviewIndex = (this.alarmPreviewIndex - 1 + length) % length
    },
    nextAlarmImage () {
      const length = this.alarmPreviewImages.length
      if (length <= 1) return
      this.alarmPreviewIndex = (this.alarmPreviewIndex + 1) % length
    },
    orderStatusText (value) {
      return {
        1: '待提交',
        2: '待派单',
        3: '实施中',
        4: '已完成',
        5: '已关闭',
        6: '非正常关闭'
      }[Number(value)] || '--'
    },
    orderStatusClass (value) {
      const status = Number(value)
      if (status === 4 || status === 5) return 'is-completed'
      if (status === 6) return 'is-abnormal'
      if (status === 3) return 'is-processing'
      return 'is-pending'
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

.trace-dialog-layer {
  position: absolute !important;
  z-index: 86 !important;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 92px 120px 54px;
  box-sizing: border-box;
  background: rgba(3, 13, 28, 0.72);
  backdrop-filter: blur(2px);
}

.trace-dialog {
  display: flex;
  flex-direction: column;
  width: 1320px;
  height: 760px;
  min-width: 0;
  min-height: 0;
  padding: 0 22px 16px;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid rgba(104, 165, 202, 0.54);
  border-radius: 10px;
  background: #0b223d;
  box-shadow: 0 24px 64px rgba(0, 7, 20, 0.55);
  color: #edf5fb;
}

.trace-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 78px;
  border-bottom: 1px solid rgba(113, 166, 199, 0.24);
}

.trace-dialog__heading {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;

  h2 {
    margin: 0;
    color: #f4f8fc;
    font-size: 21px;
    font-weight: 600;
    letter-spacing: 0.4px;
  }

  p {
    margin: 5px 0 0;
    color: rgba(199, 218, 232, 0.72);
    font-size: 12px;
  }
}

.trace-dialog__icon {
  display: grid;
  place-items: center;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(107, 174, 210, 0.4);
  border-radius: 8px;
  background: #102f4e;
  color: #8cc9e4;
  font-size: 20px;
}

.trace-dialog__title-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.trace-dialog__header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.trace-dialog__close {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid rgba(112, 164, 196, 0.32);
  border-radius: 7px;
  background: #0c2945;
  color: #c4d8e5;
  font-size: 17px;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: rgba(130, 194, 224, 0.68);
    color: #fff;
    outline: none;
  }
}

.trace-filter {
  display: flex;
  align-items: flex-end;
  flex: 0 0 72px;
  gap: 18px;
  padding: 12px 14px;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(113, 166, 199, 0.16);
  background: rgba(6, 27, 49, 0.46);
}

.trace-filter__field {
  display: flex;
  flex-direction: column;
  flex: 0 0 150px;
  gap: 5px;
  width: 150px;

  label {
    color: rgba(202, 220, 233, 0.76);
    font-size: 11px;
    white-space: nowrap;
  }

  &--project { flex-basis: 200px; width: 200px; }

  ::v-deep .el-input__inner,
  ::v-deep .el-range-input {
    color: #e8f0f6;
  }

  ::v-deep .el-input__inner,
  ::v-deep .el-range-editor.el-input__inner {
    border-color: rgba(104, 158, 190, 0.32);
    background: #0b2946;
  }

  ::v-deep .el-range-separator,
  ::v-deep .el-input__icon {
    color: rgba(191, 214, 229, 0.72);
  }
}

.trace-filter__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.trace-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 32px;
  padding: 0 17px;
  border: 1px solid rgba(111, 164, 197, 0.34);
  border-radius: 5px;
  background: #102c48;
  color: #c9dce8;
  font-family: inherit;
  font-size: 12px;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;

  &:hover { border-color: rgba(125, 190, 220, 0.62); color: #fff; }
  &--primary { border-color: #407da2; background: #2f6f96; color: #fff; }
  &--export { border-color: #4a8baa; background: #174b68; color: #e8f5fb; }
  &--business { margin-right: 8px; border-color: #4e8bb0; background: #123d5c; color: #e5f4fb; }
  &:disabled { border-color: rgba(111, 164, 197, 0.2); color: rgba(201, 220, 232, 0.45); cursor: not-allowed; }
}

.trace-dialog__body {
  position: relative;
  flex: 1;
  min-height: 0;
  padding-top: 12px;
  overflow: hidden;
}

.trace-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.trace-summary {
  display: flex;
  align-items: center;
  flex: 0 0 62px;
  gap: 18px;
  padding: 8px 15px;
  box-sizing: border-box;
  border: 1px solid rgba(104, 158, 190, 0.2);
  border-radius: 7px;
  background: #0c2945;

  > p {
    margin: 0;
    color: rgba(199, 218, 232, 0.7);
    font-size: 12px;
  }

  &--single .trace-summary__item { min-width: 150px; }
  &--warehouse { gap: 22px; }
  &--warehouse .trace-summary__item { padding-right: 30px; }
  &--warehouse > p { margin-left: auto; }
  &--metrics { gap: 22px; }
  &--metrics .trace-summary__item { padding-right: 30px; }
  &--metrics > p { margin-left: auto; }
}

.trace-summary__item {
  display: flex;
  align-items: baseline;
  min-width: 166px;
  padding-right: 18px;
  border-right: 1px solid rgba(112, 164, 196, 0.2);

  span { margin-right: 12px; color: rgba(199, 218, 232, 0.76); font-size: 12px; }
  strong { color: #eaf4fa; font-family: $ds-font-num; font-size: 22px; font-weight: 600; }
  small { margin-left: 3px; color: rgba(189, 211, 226, 0.7); font-size: 10px; }
  &--rate strong { color: #80c6df; }
  &--warning strong { color: #d6ad73; }
  &--money { min-width: 235px; }
}

.trace-category-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;

  > span {
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
    color: rgba(196, 216, 229, 0.68);
    font-size: 10px;
    white-space: nowrap;
  }

  i { font-style: normal; }
  b { color: #dcecf5; font-family: $ds-font-num; font-size: 13px; }
}

.trace-table,
.trace-table-scroll {
  flex: 1;
  min-height: 0;
  margin-top: 10px;
  overflow: auto;
  border: 1px solid rgba(104, 158, 190, 0.18);
  border-radius: 7px;
  background: #091f37;

  &::-webkit-scrollbar { width: 8px; height: 8px; }
  &::-webkit-scrollbar-track { background: #0a2139; }
  &::-webkit-scrollbar-thumb { border: 2px solid #0a2139; border-radius: 8px; background: #315776; }
  &::-webkit-scrollbar-corner { background: #0a2139; }
}

.trace-table-scroll .trace-table {
  min-width: 1200px;
  margin-top: 0;
  border: 0;
  border-radius: 0;
}

.trace-table__head,
.trace-table__row {
  display: grid;
  align-items: center;
  min-height: 42px;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(105, 155, 185, 0.12);

  > span {
    min-width: 0;
    padding: 0 10px;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.trace-table__head {
  position: sticky;
  z-index: 2;
  top: 0;
  min-height: 40px;
  background: #12314e;
  color: rgba(210, 226, 237, 0.88);
  font-size: 12px;
  font-weight: 600;

  .is-name-header,
  .is-content-header { text-align: left; }
}

.trace-table__row {
  color: rgba(231, 240, 246, 0.9);
  font-size: 12px;

  &:nth-child(odd) { background: rgba(23, 55, 82, 0.2); }
  &:last-child { border-bottom: 0; }
  &--tall { min-height: 58px; }

  .is-name { text-align: left; color: #eef6fb; font-weight: 500; }
  .is-number { color: #dcecf5; font-family: $ds-font-num; font-weight: 600; }
  .is-rate { color: #80c6df; font-family: $ds-font-num; font-weight: 600; }
  .is-rate i { margin-left: 2px; font-size: 10px; font-style: normal; }
  .is-multiline { display: -webkit-box; white-space: normal; text-align: left; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
}

.trace-table--provider .trace-table__head,
.trace-table--provider .trace-table__row {
  grid-template-columns: 58px minmax(210px, 1.5fr) minmax(130px, 0.85fr) 90px 82px 170px;
}

.trace-table--closure .trace-table__head,
.trace-table--closure .trace-table__row {
  grid-template-columns: 54px minmax(150px, 1.2fr) 80px minmax(100px, 0.8fr) minmax(168px, 1.25fr) minmax(108px, 0.8fr) minmax(108px, 0.8fr) minmax(178px, 1.3fr);
}

.trace-table--hazard .trace-table__head,
.trace-table--hazard .trace-table__row {
  grid-template-columns: 54px 150px minmax(270px, 1.5fr) 82px 82px 152px minmax(190px, 1fr);
}

.trace-table--warehouse .trace-table__head,
.trace-table--warehouse .trace-table__row {
  grid-template-columns: 80px minmax(260px, 1.5fr) minmax(180px, 1fr) minmax(220px, 1fr);
}

.trace-table--project-stat .trace-table__head,
.trace-table--project-stat .trace-table__row {
  grid-template-columns: 80px minmax(280px, 1.6fr) repeat(3, minmax(150px, 1fr));
}

.trace-table--satisfaction .trace-table__head,
.trace-table--satisfaction .trace-table__row {
  grid-template-columns: 58px 170px 130px minmax(350px, 1.7fr) 105px 105px 130px;
}

.trace-table-scroll--satisfaction > .trace-table--satisfaction {
  min-width: 1120px;
  min-height: 100%;
  overflow: visible;
}

.trace-table--rectification .trace-table__head,
.trace-table--rectification .trace-table__row {
  grid-template-columns: 58px 170px minmax(350px, 1.7fr) 105px 105px 150px;
}

.trace-table-scroll .trace-table--video-ai {
  min-width: 1580px;
}

.trace-table--video-ai .trace-table__head,
.trace-table--video-ai .trace-table__row {
  grid-template-columns: 54px 104px 160px 155px 125px minmax(210px, 1fr) 96px 96px 160px 106px;
}

.trace-screen-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #3d6e8c #0a2139;

  &::-webkit-scrollbar { width: 10px; height: 10px; }
  &::-webkit-scrollbar-track { background: #0a2139; }
  &::-webkit-scrollbar-thumb {
    border: 2px solid #0a2139;
    border-radius: 8px;
    background: #3d6e8c;
  }
  &::-webkit-scrollbar-thumb:hover { background: #4d83a2; }
  &::-webkit-scrollbar-corner { background: #0a2139; }
}

.trace-table-scroll--video-ai > .trace-table--video-ai {
  min-height: 100%;
  overflow: visible;
}

.trace-table__row--video-ai {
  min-height: 68px;
}

.trace-alarm-picture {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;

  img {
    width: 78px;
    height: 50px;
    border: 1px solid rgba(111, 169, 199, 0.28);
    border-radius: 4px;
    object-fit: cover;
    background: #071a2c;
  }

  i {
    color: rgba(190, 211, 225, 0.46);
    font-size: 11px;
    font-style: normal;
  }

  &.is-clickable {
    cursor: zoom-in;

    img { transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease; }

    &:hover img,
    &:focus-visible img {
      border-color: rgba(119, 197, 228, 0.76);
      box-shadow: 0 0 0 2px rgba(87, 170, 204, 0.16);
      transform: scale(1.03);
    }

    &:focus-visible { outline: none; }
  }
}

.trace-order-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 62px;
  height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  box-sizing: border-box;
  background: rgba(122, 158, 180, 0.13);
  color: #c7d9e4;
  font-size: 11px;
  font-style: normal;
  font-weight: 600;

  &.is-completed { background: rgba(77, 166, 142, 0.14); color: #78c5b0; }
  &.is-processing { background: rgba(74, 147, 190, 0.17); color: #83c1de; }
  &.is-pending { background: rgba(190, 154, 94, 0.14); color: #d4b477; }
  &.is-abnormal { background: rgba(184, 95, 95, 0.16); color: #d69292; }
}

.alarm-preview-layer {
  position: absolute;
  z-index: 20;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 10, 22, 0.92);
  backdrop-filter: blur(4px);
}

.alarm-preview__content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(74vw, 1380px);
  height: min(76vh, 760px);

  img {
    max-width: 100%;
    max-height: 100%;
    border: 1px solid rgba(111, 177, 207, 0.44);
    border-radius: 7px;
    object-fit: contain;
    background: #061729;
    box-shadow: 0 22px 60px rgba(0, 5, 15, 0.62);
  }

  p,
  span {
    position: absolute;
    bottom: -34px;
    margin: 0;
    color: rgba(218, 234, 243, 0.82);
    font-size: 13px;
  }

  p { left: 0; }
  span { right: 0; font-family: $ds-font-num; }
}

.alarm-preview__close,
.alarm-preview__arrow {
  position: absolute;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(112, 174, 205, 0.4);
  background: #102f4e;
  color: #d9e9f2;
  cursor: pointer;

  &:hover,
  &:focus-visible { border-color: rgba(128, 207, 235, 0.78); background: #174363; color: #fff; outline: none; }
}

.alarm-preview__close {
  top: 34px;
  right: 42px;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  font-size: 19px;
}

.alarm-preview__arrow {
  z-index: 2;
  top: 50%;
  width: 48px;
  height: 68px;
  border-radius: 8px;
  transform: translateY(-50%);
  font-size: 24px;

  &--left { left: 42px; }
  &--right { right: 42px; }
}

.trace-stars {
  color: #d8b36f;
  font-family: $ds-font-num;
  letter-spacing: 2px;
}

.trace-status {
  color: #d6ad73;
  font-weight: 600;
}

.trace-grade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 22px;
  border-radius: 4px;
  background: rgba(120, 151, 174, 0.16);
  color: #c5d6e1;
  font-style: normal;
  font-weight: 600;
  &.is-a { background: rgba(88, 172, 151, 0.16); color: #7cc6b3; }
  &.is-b { background: rgba(82, 145, 182, 0.18); color: #8cc4df; }
  &.is-c { background: rgba(190, 161, 102, 0.16); color: #d2b579; }
  &.is-d,
  &.is-e { background: rgba(184, 104, 104, 0.16); color: #d59a9a; }
}

.trace-tabs {
  display: flex;
  flex: 0 0 42px;
  align-items: flex-end;
  gap: 22px;
  padding-left: 4px;
  border-bottom: 1px solid rgba(104, 158, 190, 0.18);

  button {
    height: 34px;
    padding: 0 4px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: rgba(191, 211, 224, 0.68);
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
    &.is-active { border-bottom-color: #68a9ca; color: #edf6fb; }
  }
}

.warehouse-category-view {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  margin-top: 10px;
  padding: 4px 18px;
  overflow: auto;
  border: 1px solid rgba(104, 158, 190, 0.18);
  border-radius: 7px;
  background: #091f37;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: #0a2139; }
  &::-webkit-scrollbar-thumb { border: 2px solid #0a2139; border-radius: 8px; background: #315776; }
}

.warehouse-category-row {
  display: grid;
  align-items: center;
  flex: 1 0 52px;
  grid-template-columns: 46px 180px minmax(240px, 1fr) 90px 170px;
  gap: 14px;
  border-bottom: 1px solid rgba(105, 155, 185, 0.12);
  font-size: 12px;
  &:last-child { border-bottom: 0; }
  &__index { color: rgba(188, 209, 222, 0.58); text-align: center; }
  &__name { color: #edf5fa; }
  &__bar { height: 7px; overflow: hidden; border-radius: 999px; background: rgba(92, 132, 158, 0.2); }
  &__bar i { display: block; height: 100%; border-radius: inherit; background: #5e9fc1; }
  strong { color: #83bfd9; font-family: $ds-font-num; text-align: right; }
  strong i { margin-left: 2px; font-size: 10px; font-style: normal; }
  em { color: #dceaf2; font-family: $ds-font-num; font-style: normal; text-align: right; }
}

.trace-empty {
  display: grid;
  place-items: center;
  min-height: 180px;
  color: rgba(190, 211, 225, 0.55);
  font-size: 13px;
}

.trace-loading,
.trace-error {
  position: absolute;
  z-index: 5;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  background: rgba(7, 27, 48, 0.82);
  color: #c8dce8;
  font-size: 13px;
}

.trace-error {
  flex-direction: column;
  color: #d9b184;
  i { font-size: 22px; }
  button { padding: 5px 14px; border: 1px solid rgba(119, 173, 203, 0.4); border-radius: 4px; background: #12334f; color: #e7f0f6; cursor: pointer; }
}

.trace-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 48px;
  color: rgba(193, 213, 226, 0.66);
  font-size: 11px;

  ::v-deep .el-pagination.is-background .btn-next,
  ::v-deep .el-pagination.is-background .btn-prev,
  ::v-deep .el-pagination.is-background .el-pager li {
    background: #102d49;
    color: #c8dae6;
  }
  ::v-deep .el-pagination.is-background .el-pager li:not(.disabled).active { background: #39789e; color: #fff; }
  ::v-deep .el-input__inner { border-color: rgba(104, 158, 190, 0.3); background: #0c2945; color: #dce9f1; }
}

.trace-dialog-fade-enter-active,
.trace-dialog-fade-leave-active { transition: opacity 0.2s ease; }
.trace-dialog-fade-enter,
.trace-dialog-fade-leave-to { opacity: 0; }
</style>

<!-- Element UI 的内部节点及挂载到 body 的下拉层需要非 scoped 样式；类名前缀仅服务本大屏详情弹窗。 -->
<style lang="scss">
.group-screen .trace-dialog-layer {
  .trace-filter {
    .trace-filter__field > .el-date-editor,
    .trace-filter__field > .el-select,
    .trace-filter__field > .el-input {
      width: 100% !important;
      min-width: 0 !important;
      box-sizing: border-box;
    }

    .el-input__inner,
    .el-range-editor.el-input__inner {
      border-color: rgba(104, 158, 190, 0.42) !important;
      background-color: #0b2946 !important;
      color: #dceaf3 !important;
      box-shadow: none !important;
    }

    .el-input__inner::placeholder,
    .el-range-input::placeholder {
      color: rgba(177, 203, 220, 0.48) !important;
    }

    .el-range-input {
      background-color: transparent !important;
      color: #dceaf3 !important;
    }

    .el-range-separator,
    .el-input__icon,
    .el-range__icon,
    .el-range__close-icon {
      color: rgba(177, 207, 224, 0.72) !important;
    }

    .el-input.is-focus .el-input__inner,
    .el-range-editor.is-active,
    .el-range-editor.is-active:hover {
      border-color: #4f91b6 !important;
    }
  }

  .trace-dialog__footer .el-pagination {
    color: rgba(199, 218, 231, 0.75);

    .btn-prev,
    .btn-next,
    .el-pager li,
    .el-select .el-input__inner {
      border: 1px solid rgba(103, 158, 190, 0.3) !important;
      background-color: #0e2b47 !important;
      color: #c9dbe7 !important;
      box-shadow: none !important;
    }

    .el-pager li:not(.disabled):hover,
    .btn-prev:not(:disabled):hover,
    .btn-next:not(:disabled):hover {
      border-color: rgba(108, 184, 218, 0.68) !important;
      color: #f2f8fc !important;
    }

    .el-pager li:not(.disabled).active {
      border-color: #4d93bd !important;
      background-color: #347ba5 !important;
      color: #fff !important;
    }

    button:disabled,
    .el-pager li.disabled {
      border-color: rgba(91, 132, 158, 0.18) !important;
      background-color: #0a223a !important;
      color: rgba(173, 197, 212, 0.38) !important;
    }

    .el-select .el-input .el-select__caret {
      color: rgba(177, 207, 224, 0.66) !important;
    }
  }
}

.property-drilldown-picker,
.property-drilldown-select,
.property-drilldown-pagination,
.property-drilldown-export-menu {
  border-color: rgba(104, 158, 190, 0.45) !important;
  background: #0d2945 !important;
  color: #dceaf3 !important;
  box-shadow: 0 14px 34px rgba(1, 10, 23, 0.48) !important;
}

.property-drilldown-select,
.property-drilldown-pagination {
  .el-select-dropdown__item { color: rgba(216, 232, 241, 0.86); }
  .el-select-dropdown__item.hover,
  .el-select-dropdown__item:hover { background-color: #163b5a; }
  .el-select-dropdown__item.selected { color: #86c8e5; }
  .popper__arrow::after { border-bottom-color: #0d2945 !important; }
}

.property-drilldown-export-menu {
  padding: 5px 0 !important;

  .el-dropdown-menu__item {
    color: rgba(216, 232, 241, 0.88);
    line-height: 34px;
  }

  .el-dropdown-menu__item:not(.is-disabled):hover,
  .el-dropdown-menu__item:focus {
    background-color: #163b5a;
    color: #8ed1ed;
  }

  .popper__arrow::after { border-bottom-color: #0d2945 !important; }
}

.property-drilldown-picker {
  .el-picker-panel__body-wrapper,
  .el-picker-panel__body,
  .el-date-range-picker__content,
  .el-time-panel,
  .el-time-panel__content::after,
  .el-time-panel__content::before { background: #0d2945 !important; }

  .el-date-range-picker__content.is-left { border-right-color: rgba(104, 158, 190, 0.2); }
  .el-date-range-picker__header,
  .el-date-table th,
  .el-date-table td.available,
  .el-time-spinner__item { color: rgba(216, 232, 241, 0.86); }
  .el-date-table th { border-bottom-color: rgba(104, 158, 190, 0.18); }
  .el-date-table td.in-range div,
  .el-date-table td.in-range div:hover { background-color: #163b5a; }
  .el-date-table td.start-date span,
  .el-date-table td.end-date span { background-color: #347ba5; }
  .el-time-spinner__item:hover:not(.disabled):not(.active) { background: #163b5a; }
  .el-time-spinner__item.active:not(.disabled) { color: #83c5e2; }
  .el-time-panel__footer { border-top-color: rgba(104, 158, 190, 0.2); }
  .el-picker-panel__footer {
    border-top-color: rgba(104, 158, 190, 0.2);
    background: #0d2945;
  }
  .el-button.is-plain {
    border-color: rgba(104, 158, 190, 0.36);
    background: #123451;
    color: #dceaf3;
  }
  .popper__arrow::after { border-bottom-color: #0d2945 !important; }
}
</style>
