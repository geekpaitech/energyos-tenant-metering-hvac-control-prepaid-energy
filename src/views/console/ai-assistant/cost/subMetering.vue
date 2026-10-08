<template>
  <div class="page-wrap" @click="closeCtx" @contextmenu.prevent="onGlobalCtx">
    <el-empty v-if="!canView" :description="$t('subMeteringPage.emptyNoViewPermission')" />
    <template v-else>

    <!-- ── 左侧拓扑画布 ── -->
    <div class="tree-panel">
      <div class="tree-toolbar">
        <div class="toolbar-left">
          <el-input v-model="keyword" :placeholder="$t('subMeteringPage.phSearchKeyword')" size="small" clearable prefix-icon="el-icon-search"
            style="width:200px" @input="onKeywordInput" @clear="onKeywordInput" @keyup.enter.native="onKeywordInput" />
          <!-- 日期查询移到搜索框右侧 -->
          <div class="toolbar-date-group">
            <el-date-picker v-model="dateRange" type="daterange" size="small" range-separator="-"
              :start-placeholder="$t('subMeteringPage.phDateStart')" :end-placeholder="$t('subMeteringPage.phDateEnd')" value-format="yyyy-MM-dd" :clearable="false"
              :picker-options="datePickerOptions" style="width:240px" @change="onDateChange" />
          </div>
        </div>
        <div class="toolbar-right">
          <el-button size="small" icon="el-icon-refresh-left" :disabled="!canUndo || !canControl" :title="$t('subMeteringPage.titleUndo')"
            @click="undo">{{ $t('subMeteringPage.btnUndo') }}</el-button>
          <el-button size="small" icon="el-icon-refresh" :loading="treeLoading" :title="$t('subMeteringPage.titleRefresh')"
            @click="refreshTree">{{ $t('subMeteringPage.btnRefresh') }}</el-button>
          <!-- <el-button v-if="canControl" type="primary" size="small" icon="el-icon-plus" @click="showLayerDialog = true">层级设置</el-button> -->
          <el-button size="small" icon="el-icon-share" @click="$message.info($t('subMeteringPage.msgSankeyDev'))">{{ $t('subMeteringPage.btnSankey') }}</el-button>
        </div>
      </div>

      <div class="tree-canvas" ref="treeCanvas" @wheel.prevent="onWheel" @mousedown="onCanvasMouseDown"
        @touchstart.prevent="onPanStartTouch" @touchmove.prevent="onPanMoveTouch" @touchend="onPanEnd">
        <!-- 缩放指示器 -->
        <div class="zoom-indicator">
          <button class="zoom-btn" :title="$t('subMeteringPage.titleZoomOut')" @click.stop="zoomOut">－</button>
          <span class="zoom-val">{{ Math.round(scale * 100) }}%</span>
          <button class="zoom-btn" :title="$t('subMeteringPage.titleZoomIn')" @click.stop="zoomIn">＋</button>
          <span class="zi-sep" />
          <button class="zoom-btn reset-btn" :title="$t('subMeteringPage.titleResetView')" @click.stop="resetView">⊙</button>
        </div>

        <div class="tree-inner" :style="canvasStyle" ref="treeInner">
          <!-- 骨架屏 -->
          <div v-if="treeLoading" class="tree-skeleton">
            <div class="skel-root" />
            <div class="skel-hline" />
            <div class="skel-children">
              <div v-for="i in 3" :key="i" class="skel-node" :style="{ animationDelay: i * 0.1 + 's' }" />
            </div>
          </div>

          <!-- 拓扑树 -->
          <transition name="tree-fade">
            <tree-node v-if="!treeLoading && tree && tree.id" :node="tree" :selected-id="selectedId"
              :is-dragging="!!dragging" @select="onSelect" @contextmenu="onCtx" @drag-node="onDragNode"
              @drag-end="onDragEnd" @drop-node="onDropNode" @sort-node="onSortNode"
              @start-canvas-drag="onRootPanStart" />
          </transition>

          <!-- 空状态 -->
          <div v-if="!treeLoading && (!tree || !tree.id)" class="tree-empty">
            <i class="el-icon-connection" />
            <p>{{ $t('subMeteringPage.emptyNoTopology') }}</p>
            <el-button v-if="canControl" type="primary" size="small" @click="showLayerDialog = true">
              {{ $t('subMeteringPage.btnCreateRoot') }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 右侧详情面板 ── -->
    <transition name="panel-slide">
      <div class="detail-panel" v-if="selected">
        <div class="detail-head">
          <div class="head-left">
            <span class="node-type-tag" :class="nodeTypeTagClass">
              <i :class="nodeTypeIcon" />{{ nodeTypeLabel }}
            </span>
            <div class="head-title" :title="$displayBizHybrid(selected.name, 200)">{{ $displayBizHybrid(selected.name) }}</div>
            <div class="head-date-range" v-if="dateRange && dateRange[0]">
              <i class="el-icon-date" /> {{ dateRange[0] }} {{ $t('subMeteringPage.dateRangeTo') }} {{ dateRange[1] }}
            </div>
          </div>
          <button class="close-btn" :title="$t('subMeteringPage.titleClosePanel')" @click="closePanel">
            <i class="el-icon-close" />
          </button>
        </div>

        <div class="detail-body" ref="detailBody" v-loading="detailLoading">

          <!-- ══════════════════════════════════════════
               分类 / 根节点详情（重新设计）
               ══════════════════════════════════════════ -->
          <template v-if="isGroupNode">

            <!-- 总用能大卡片 -->
            <div class="energy-hero-card" v-if="selected.totalEnergy != null">
              <div class="ehc-bg-decoration" />
              <div class="ehc-left">
                <div class="ehc-icon">
                  <img :src="meterIcon" class="ehc-meter-img" :alt="$t('subMeteringPage.altMeter')" />
                </div>
                <div class="ehc-info">
                  <div class="ehc-label">{{ $t('subMeteringPage.ehcLabelTotalEnergy') }}</div>
                  <div class="ehc-date">{{ dateRange[0] }} ~ {{ dateRange[1] }}</div>
                </div>
              </div>
              <div class="ehc-right">
                <div class="ehc-value">{{ fmtNum(selected.totalEnergy) }}</div>
                <div class="ehc-unit">kWh</div>
              </div>
            </div>

            <!-- 子节点用能排行 -->
            <div class="section-card" v-if="selectedChildren.length">
              <div class="sc-header">
                <span class="sc-title"><i class="el-icon-data-analysis" /> {{ $t('subMeteringPage.childEnergyTitle') }}</span>
                <span class="sc-count">{{ $t('subMeteringPage.childCountLabel', { n: selectedChildren.length }) }}</span>
              </div>
              <div class="sc-body">
                <!-- 按 value/totalEnergy 降序显示 -->
                <div v-for="(child, i) in sortedChildren" :key="child.id" class="child-energy-row"
                  :class="{ 'cer-border': i > 0 }" @click="onSelect(child)">
                  <div class="cer-rank" :class="rankClass(i)">{{ i + 1 }}</div>
                  <div class="cer-icon">
                    <img :src="meterIcon" class="cer-meter-img" :alt="$t('subMeteringPage.altMeter')" />
                  </div>

                  <!-- 双电源：展开主备两行 -->
                  <template v-if="child.type === NODE_TYPES.DEVICE_DUAL">
                    <div class="cer-info">
                      <div class="cer-dual-row">
                        <span class="cer-dual-label primary">{{ $t('subMeteringPage.labelPrimaryShort') }}</span>
                        <div class="cer-dual-detail">
                          <span class="cer-name cer-dual-name" :title="$displayBizHybrid(child.name, 200)">{{ $displayBizHybrid(child.name) }}</span>
                          <span class="cer-serial">{{ child.serial || '—' }}</span>
                        </div>
                      </div>
                      <div class="cer-dual-row">
                        <span class="cer-dual-label backup">{{ $t('subMeteringPage.labelBackupShort') }}</span>
                        <div class="cer-dual-detail">
                          <span class="cer-name cer-dual-name" :title="$displayBizHybrid(child.name2, 200)">{{ $displayBizHybrid(child.name2) || '—' }}</span>
                          <span class="cer-serial">{{ child.serial2 || '—' }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="cer-right">
                      <div class="cer-dual-val-row">
                        <span class="cer-value" v-if="child.value != null">{{ fmtNum(child.value) }}</span>
                        <span class="cer-value cer-na" v-else>—</span>
                        <span class="cer-unit">kWh</span>
                      </div>
                      <div class="cer-dual-val-row">
                        <span class="cer-value" v-if="child.value2 != null">{{ fmtNum(child.value2) }}</span>
                        <span class="cer-value cer-na" v-else>—</span>
                        <span class="cer-unit">kWh</span>
                      </div>
                    </div>
                  </template>

                  <!-- 普通节点 -->
                  <template v-else>
                    <div class="cer-info">
                      <div class="cer-name" :title="$displayBizHybrid(child.name, 200)">{{ $displayBizHybrid(child.name) }}</div>
                      <div class="cer-serial" v-if="isDeviceNode(child)">{{ child.serial || '—' }}</div>
                      <div class="cer-serial" v-else>{{ $t('subMeteringPage.labelCategoryNode') }}</div>
                    </div>
                    <div class="cer-right">
                      <div class="cer-value" v-if="childEnergyVal(child) != null">
                        {{ fmtNum(childEnergyVal(child)) }}
                        <span class="cer-unit">kWh</span>
                      </div>
                      <div class="cer-value cer-na" v-else>—</div>
                      <div class="cer-ratio-wrap" v-if="child.ratio">
                        <div class="cer-ratio-bar">
                          <div class="cer-ratio-fill" :style="{ width: child.ratio }" :class="rankBarClass(i)" />
                        </div>
                        <span class="cer-ratio-text">{{ child.ratio }}</span>
                      </div>
                    </div>
                  </template>

                  <i class="el-icon-arrow-right cer-arr" />
                </div>
              </div>
            </div>

            <!-- 空子节点提示 -->
            <div v-if="!selectedChildren.length" class="empty-children-tip">
              <i class="el-icon-inbox" />
              <span>{{ $t('subMeteringPage.emptyNoChildren') }}</span>
            </div>

            <!-- 日电量图表 -->
            <div class="chart-card" v-if="selected.showChart">
              <div class="chart-card-header">
                <div class="cch-left">
                  <i class="el-icon-trend-charts cch-icon" />
                  <span class="cch-title">{{ $t('subMeteringPage.chartDailyTrend') }}</span>
                  <span class="cch-unit">{{ $t('subMeteringPage.chartUnitKwh') }}</span>
                </div>
                <div class="legend-row">
                  <span v-for="l in chartLegends" :key="l.name" class="legend-item">
                    <i class="ldot" :style="{ background: l.color }" />{{ l.name }}
                  </span>
                </div>
              </div>
              <!-- 横向滚动容器 -->
              <div class="chart-scroll-wrap">
                <div ref="chartEl" class="chart-canvas" :style="{ width: chartScrollWidth + 'px' }" />
              </div>
              <!-- 无数据提示 -->
              <div v-if="!categoryDailyEnergyList.length && !detailLoading" class="chart-empty">
                <i class="el-icon-data-line" />
                <span>{{ $t('subMeteringPage.emptyNoDailyData') }}</span>
              </div>
            </div>

            <!-- 统计摘要（若后端返回了统计字段则展示） -->
            <div class="stats-row" v-if="hasCategoryStats">
              <div class="stat-item" v-if="selected.peakEnergy != null">
                <div class="si-label">{{ $t('subMeteringPage.statPeakDaily') }}</div>
                <div class="si-val">{{ fmtNum(selected.peakEnergy) }}<span class="si-unit">kWh</span></div>
              </div>
              <div class="stat-item" v-if="selected.avgEnergy != null">
                <div class="si-label">{{ $t('subMeteringPage.statAvgDaily') }}</div>
                <div class="si-val">{{ fmtNum(selected.avgEnergy) }}<span class="si-unit">kWh</span></div>
              </div>
              <div class="stat-item" v-if="selected.lossRate != null">
                <div class="si-label">{{ $t('subMeteringPage.statLossRate') }}</div>
                <div class="si-val" :class="lossRateColorClass(selected.lossRate)">
                  {{ selected.lossRate }}<span class="si-unit">%</span>
                </div>
              </div>
              <div class="stat-item" v-if="selected.deviceCount != null">
                <div class="si-label">{{ $t('subMeteringPage.statDeviceCount') }}</div>
                <div class="si-val">{{ selected.deviceCount }}<span class="si-unit">{{ $t('subMeteringPage.unitDevice') }}</span></div>
              </div>
            </div>

          </template>

          <!-- ══════════════════════════════════════════
               设备节点详情
               ══════════════════════════════════════════ -->
          <template v-else>

            <!-- 上级电表 -->
            <template v-if="parentDeviceNode">
              <div class="section-lbl upstream-lbl">
                <i class="el-icon-upload2" /> {{ $t('subMeteringPage.sectionUpstreamMeter') }}
              </div>

              <!-- 父是双电源 -->
              <template v-if="parentDeviceNode.type === NODE_TYPES.DEVICE_DUAL">
                <div class="flow-card">
                  <div class="flow-item dual-parent-hd">
                    <div class="dual-child-tag">
                      <i class="el-icon-connection" /> {{ $t('subMeteringPage.labelDualPowerNode') }}
                    </div>
                    <span class="view-link" style="margin-left:auto"
                      @click.stop="onSelect(parentDeviceNode)">{{ $t('subMeteringPage.linkViewDetail') }}</span>
                  </div>
                  <div class="flow-item flow-item--border" @click="onSelect(parentDeviceNode)">
                    <div class="item-icon dev-icon-wrap">
                      <img :src="meterIcon" class="meter-img" :alt="$t('subMeteringPage.altMainMeter')" />
                    </div>
                    <div class="item-info">
                      <div class="source-label primary">{{ $t('subMeteringPage.labelMainMeter') }}</div>
                      <div class="item-name">{{ $displayBizHybrid(parentDeviceNode.name) }}</div>
                      <div class="item-serial">
                        {{ parentDeviceNode.serial || '—' }}
                        <span class="view-link" @click.stop="onViewInfo(parentDeviceNode.name)">{{ $t('subMeteringPage.linkView') }}</span>
                      </div>
                    </div>
                    <div class="item-right">
                      <div v-if="parentDeviceNode.value != null" class="item-val">
                        {{ fmtNum(parentDeviceNode.value) }}<span class="u">kWh</span>
                      </div>
                    </div>
                    <i class="el-icon-arrow-right item-arr" />
                  </div>
                  <div class="flow-item flow-item--border" @click="onSelect(parentDeviceNode)">
                    <div class="item-icon dev-icon-wrap">
                      <img :src="meterIcon" class="meter-img" :alt="$t('subMeteringPage.altBackupMeter')" />
                    </div>
                    <div class="item-info">
                      <div class="source-label backup">{{ $t('subMeteringPage.labelBackupMeter') }}</div>
                      <div class="item-name">{{ $displayBizHybrid(parentDeviceNode.name2 || parentDeviceNode.name) }}</div>
                      <div class="item-serial">
                        {{ parentDeviceNode.serial2 || '—' }}
                        <span class="view-link"
                          @click.stop="onViewInfo(parentDeviceNode.name2 || parentDeviceNode.name)">{{ $t('subMeteringPage.linkView') }}</span>
                      </div>
                    </div>
                    <div class="item-right">
                      <div v-if="parentDeviceNode.value2 != null" class="item-val">
                        {{ fmtNum(parentDeviceNode.value2) }}<span class="u">kWh</span>
                      </div>
                    </div>
                    <i class="el-icon-arrow-right item-arr" />
                  </div>
                </div>
              </template>

              <!-- 父是普通设备 -->
              <template v-else>
                <div class="flow-card">
                  <div class="flow-item" @click="onSelect(parentDeviceNode)">
                    <div class="item-icon dev-icon-wrap">
                      <img :src="meterIcon" class="meter-img" :alt="$t('subMeteringPage.altMeter')" />
                    </div>
                    <div class="item-info">
                      <div class="item-name">{{ $displayBizHybrid(parentDeviceNode.name) }}</div>
                      <div class="item-serial">
                        {{ parentDeviceNode.serial || '—' }}
                        <span class="view-link" @click.stop="onViewInfo(parentDeviceNode.name)">{{ $t('subMeteringPage.linkView') }}</span>
                      </div>
                    </div>
                    <div class="item-right">
                      <div v-if="parentDeviceNode.value != null" class="item-val">
                        {{ fmtNum(parentDeviceNode.value) }}<span class="u">kWh</span>
                      </div>
                      <div v-if="parentDeviceNode.ratio" class="item-ratio">
                        {{ $t('subMeteringPage.ratioPrefix') }} {{ parentDeviceNode.ratio }}
                      </div>
                    </div>
                    <i class="el-icon-arrow-right item-arr" />
                  </div>
                </div>
              </template>
            </template>

            <!-- 上→当前 连线 + 线损 -->
            <div v-if="parentDeviceNode || parentLossRate" class="flow-connector"
              :class="lossConnectorClass(parentLossRate)">
              <div class="fc-line" />
              <div v-if="parentLossRate" class="fc-loss-badge" :class="lossRateColorClass(parentLossRate)">
                <i :class="parseFloat(parentLossRate) > 20
                  ? 'el-icon-warning-outline'
                  : 'el-icon-check'" />
                {{ $t('subMeteringPage.labelLossRateInline') }} <b>{{ parentLossRate }}</b>
              </div>
              <div class="fc-arrow" />
            </div>

            <!-- 当前节点卡 -->
            <div class="current-card">
              <div class="current-card-tag">{{ $t('subMeteringPage.tagCurrentNode') }}</div>

              <!-- 单表 -->
              <template v-if="selected.type !== NODE_TYPES.DEVICE_DUAL">
                <div class="current-row">
                  <div class="item-icon dev-icon-wrap">
                    <img :src="meterIcon" class="meter-img" :alt="$t('subMeteringPage.altMeter')" />
                  </div>
                  <div class="item-info">
                    <div class="item-name big">{{ $displayBizHybrid(selected.name) }}</div>
                    <div class="item-serial">
                      {{ selected.serial || '—' }}
                      <span class="view-link" @click.stop="onViewInfo(selected.name)">{{ $t('subMeteringPage.linkView') }}</span>
                    </div>
                  </div>
                  <div v-if="selected.value != null || selected.totalEnergy != null || selected.power != null"
                    class="cur-metrics">
                    <div v-if="selected.value != null" class="cur-val">
                      <span class="cur-num">{{ fmtNum(selected.value) }}</span>
                      <span class="cur-unit">kWh</span>
                    </div>
                    <div v-if="selected.totalEnergy != null" class="cur-total">
                      {{ $t('subMeteringPage.labelTotalEnergy', { v: fmtNum(selected.totalEnergy) }) }}
                    </div>
                    <div v-if="selected.power != null" class="cur-power">
                      <i class="el-icon-lightning" />{{ $t('subMeteringPage.labelRealtimePower', { v: fmtNum(selected.power) }) }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- 双电源 -->
              <template v-else>
                <div class="dual-tag"><i class="el-icon-connection" /> {{ $t('subMeteringPage.labelDualPowerNode') }}</div>
                <div class="current-row">
                  <div class="item-icon dev-icon-wrap">
                    <img :src="meterIcon" class="meter-img" :alt="$t('subMeteringPage.altMainMeter')" />
                  </div>
                  <div class="item-info">
                    <span class="source-label primary">{{ $t('subMeteringPage.labelMainMeter') }}</span>
                    <div class="item-name">{{ $displayBizHybrid(selected.name) }}</div>
                    <div class="item-serial">
                      {{ selected.serial || '—' }}
                      <span class="view-link" @click.stop="onViewInfo(selected.name)">{{ $t('subMeteringPage.linkView') }}</span>
                    </div>
                  </div>
                  <div v-if="selected.value != null || selected.power != null" class="cur-metrics">
                    <div v-if="selected.value != null" class="cur-val">
                      <span class="cur-num">{{ fmtNum(selected.value) }}</span>
                      <span class="cur-unit">kWh</span>
                    </div>
                    <div v-if="selected.power != null" class="cur-power">
                      <i class="el-icon-lightning" />{{ $t('subMeteringPage.labelRealtimePower', { v: fmtNum(selected.power) }) }}
                    </div>
                  </div>
                </div>
                <div class="dual-sep"><span>{{ $t('subMeteringPage.dualSepBackup') }}</span></div>
                <div class="current-row">
                  <div class="item-icon dev-icon-wrap">
                    <img :src="meterIcon" class="meter-img" :alt="$t('subMeteringPage.altBackupMeter')" />
                  </div>
                  <div class="item-info">
                    <span class="source-label backup">{{ $t('subMeteringPage.labelBackupMeter') }}</span>
                    <div class="item-name">{{ $displayBizHybrid(selected.name2 || selected.name) }}</div>
                    <div class="item-serial">
                      {{ selected.serial2 || '—' }}
                      <span class="view-link"
                        @click.stop="onViewInfo(selected.name2 || selected.name)">{{ $t('subMeteringPage.linkView') }}</span>
                    </div>
                  </div>
                  <div v-if="selected.value2 != null || selected.power2 != null" class="cur-metrics">
                    <div v-if="selected.value2 != null" class="cur-val">
                      <span class="cur-num">{{ fmtNum(selected.value2) }}</span>
                      <span class="cur-unit">kWh</span>
                    </div>
                    <div v-if="selected.power2 != null" class="cur-power">
                      <i class="el-icon-lightning" />{{ $t('subMeteringPage.labelRealtimePower', { v: fmtNum(selected.power2) }) }}
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- 当前→下级 连线 + 线损 -->
            <div v-if="selectedChildren.length || selected.lossRate" class="flow-connector"
              :class="lossConnectorClass(selected.lossRate)">
              <div class="fc-line" />
              <div v-if="selected.lossRate" class="fc-loss-badge" :class="lossRateColorClass(selected.lossRate)">
                <i :class="parseFloat(selected.lossRate) > 20
                  ? 'el-icon-warning-outline'
                  : 'el-icon-check'" />
                {{ $t('subMeteringPage.labelLossRateInline') }} <b>{{ selected.lossRate }}</b>
              </div>
              <div class="fc-arrow" />
            </div>

            <!-- 下级电表 -->
            <template v-if="selectedChildren.length">
              <div class="section-lbl downstream-lbl">
                <i class="el-icon-download" /> {{ $t('subMeteringPage.sectionDownstreamMeter') }}
              </div>
              <div class="flow-card">
                <template v-for="(child, i) in selectedChildren">
                  <template v-if="child.type === NODE_TYPES.DEVICE_DUAL">
                    <div :key="child.id + '_dh'" class="flow-item dual-child-header"
                      :class="{ 'flow-item--border': i > 0 }" @click="onSelect(child)">
                      <div class="dual-child-tag">
                        <i class="el-icon-connection" /> {{ $t('subMeteringPage.labelDualPower') }}
                      </div>
                    </div>
                    <div :key="child.id + '_p'" class="flow-item flow-item--border" @click="onSelect(child)">
                      <div class="item-icon dev-icon-wrap">
                        <img :src="meterIcon" class="meter-img" :alt="$t('subMeteringPage.altMainMeter')" />
                      </div>
                      <div class="item-info">
                        <div class="source-label primary">{{ $t('subMeteringPage.labelMainMeter') }}</div>
                        <div class="item-name">{{ $displayBizHybrid(child.name) }}</div>
                        <div class="item-serial">
                          {{ child.serial || '—' }}
                          <span class="view-link" @click.stop="onViewInfo(child.name)">{{ $t('subMeteringPage.linkView') }}</span>
                        </div>
                      </div>
                      <div class="item-right">
                        <div v-if="child.value != null" class="item-val">
                          {{ fmtNum(child.value) }}<span class="u">kWh</span>
                        </div>
                      </div>
                      <i class="el-icon-arrow-right item-arr" />
                    </div>
                    <div :key="child.id + '_b'" class="flow-item flow-item--border" @click="onSelect(child)">
                      <div class="item-icon dev-icon-wrap">
                        <img :src="meterIcon" class="meter-img" :alt="$t('subMeteringPage.altBackupMeter')" />
                      </div>
                      <div class="item-info">
                        <div class="source-label backup">{{ $t('subMeteringPage.labelBackupMeter') }}</div>
                        <div class="item-name">{{ $displayBizHybrid(child.name2 || child.name) }}</div>
                        <div class="item-serial">
                          {{ child.serial2 || '—' }}
                          <span class="view-link"
                            @click.stop="onViewInfo(child.name2 || child.name)">{{ $t('subMeteringPage.linkView') }}</span>
                        </div>
                      </div>
                      <div class="item-right">
                        <div v-if="child.value2 != null" class="item-val">
                          {{ fmtNum(child.value2) }}<span class="u">kWh</span>
                        </div>
                      </div>
                      <i class="el-icon-arrow-right item-arr" />
                    </div>
                  </template>

                  <div v-else :key="child.id" class="flow-item" :class="{ 'flow-item--border': i > 0 }"
                    @click="onSelect(child)">
                    <div class="item-icon dev-icon-wrap">
                      <img :src="meterIcon" class="meter-img" :alt="$t('subMeteringPage.altMeter')" />
                    </div>
                    <div class="item-info">
                      <div class="item-name">{{ $displayBizHybrid(child.name) }}</div>
                      <div class="item-serial">
                        {{ child.serial || '—' }}
                        <span class="view-link" @click.stop="onViewInfo(child.name)">{{ $t('subMeteringPage.linkView') }}</span>
                      </div>
                    </div>
                    <div class="item-right">
                      <div v-if="child.value != null" class="item-val">
                        {{ fmtNum(child.value) }}<span class="u">kWh</span>
                      </div>
                      <div v-if="child.ratio" class="item-ratio">{{ $t('subMeteringPage.ratioPrefix') }} {{ child.ratio }}</div>
                    </div>
                    <i class="el-icon-arrow-right item-arr" />
                  </div>
                </template>
              </div>
            </template>

          </template>
        </div>
      </div>
    </transition>

    <!-- ── 右键菜单 ── -->
    <transition name="ctx-fade">
      <ul v-if="ctx.show" class="ctx-menu" :style="{ left: ctx.x + 'px', top: ctx.y + 'px' }" @click.stop>
        <li v-for="(it, idx) in ctx.items" :key="idx" class="ctx-item"
          :class="{ danger: it.danger, 'ctx-divider': it.divider }" @click="it.divider ? null : doCtx(it.action)">
          <i v-if="it.icon && !it.divider" :class="it.icon" />
          <span v-if="!it.divider">{{ it.label }}</span>
        </li>
      </ul>
    </transition>

    <!-- ── 绑定电表弹窗 ── -->
    <el-dialog :title="$t('subMeteringPage.dlgBindMeter')" :visible.sync="meterDlg.show" width="860px" top="6vh" append-to-body @close="resetMeterDlg">
      <el-input v-model="meterDlg.kw" :placeholder="$t('subMeteringPage.phMeterSearch')" prefix-icon="el-icon-search" clearable
        style="margin-bottom:12px" @input="searchMeters" />
      <el-table ref="meterTbl" :data="meterDlg.list" border size="small" v-loading="meterDlg.loading" height="550"
        row-key="meterId" :row-style="meterRowStyle" @selection-change="onMeterSelectionChange">
        <el-table-column type="selection" width="46" align="center" :selectable="singleSelectable" />
        <el-table-column prop="serial" :label="$t('subMeteringPage.colSerial')" min-width="160" show-overflow-tooltip />
        <el-table-column prop="meterName" :label="$t('subMeteringPage.colMeterName')" min-width="200" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span>{{ $displayBizHybrid(row.meterName) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('subMeteringPage.colMeterType')" width="110" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="meterTypeTagType(row.bindType)">
              {{ meterBindLabel(row.bindType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('subMeteringPage.colOnlineStatus')" width="90" align="center">
          <template slot-scope="{ row }">
            <span class="sdot" :class="MeterOnlineStatus[row.onlineStatus]?.class" />
            <span :style="{ color: row.onlineStatus ? '#52c41a' : '#f5a623' }">
              {{ meterOnlineLabel(row.onlineStatus) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dlg-footer">
        <el-pagination small :current-page.sync="meterDlg.page" :page-sizes="[10, 20, 30, 50]"
          :page-size.sync="meterDlg.size" :total="meterDlg.total" layout="total,sizes,prev,pager,next,jumper" />
        <div class="dlg-footer-btns">
          <el-button type="primary" :disabled="!meterDlg.selected.length || !canControl" @click="confirmBind(false)">{{ $t('subMeteringPage.btnConfirmBind') }}</el-button>
          <el-button @click="meterDlg.show = false">{{ $t('subMeteringPage.btnCancel') }}</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- ── 绑定双电源弹窗 ── -->
    <el-dialog :title="$t('subMeteringPage.dlgBindDual')" :visible.sync="dualDlg.show" width="860px" top="6vh" append-to-body
      @close="resetDualDlg">
      <el-alert type="info" show-icon :closable="false" style="margin-bottom:14px"
        :title="$t('subMeteringPage.dualDlgAlert')" />
      <el-input v-model="dualDlg.kw" :placeholder="$t('subMeteringPage.phMeterSearch')" prefix-icon="el-icon-search" clearable
        style="margin-bottom:12px" @input="searchDualMeters" />
      <el-table ref="dualTbl" :data="dualDlg.list" border size="small" v-loading="dualDlg.loading" height="550"
        row-key="meterId" :row-style="meterRowStyle" @selection-change="onDualSelectionChange">
        <el-table-column type="selection" width="46" align="center" :selectable="checkSelectable" />
        <el-table-column prop="serial" :label="$t('subMeteringPage.colSerial')" min-width="160" show-overflow-tooltip />
        <el-table-column prop="meterName" :label="$t('subMeteringPage.colMeterName')" min-width="200" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span>{{ $displayBizHybrid(row.meterName) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('subMeteringPage.colMeterType')" width="110" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="meterTypeTagType(row.bindType)">
              {{ meterBindLabel(row.bindType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('subMeteringPage.colOnlineStatus')" width="90" align="center">
          <template slot-scope="{ row }">
            <span class="sdot" :class="MeterOnlineStatus[row.onlineStatus]?.class" />
            <span :style="{ color: row.onlineStatus ? '#52c41a' : '#f5a623' }">
              {{ meterOnlineLabel(row.onlineStatus) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="dualDlg.selected.length" class="dual-selected-tip">
        <i class="el-icon-info" />
        {{ $t('subMeteringPage.dualSelectedPrefix', { n: dualDlg.selected.length }) }}
        <span v-for="(s, i) in dualDlg.selected" :key="s.meterId" class="dual-selected-tag"
          :class="i === 0 ? 'primary' : 'backup'">
          {{ i === 0 ? $t('subMeteringPage.labelPrimaryShort') : $t('subMeteringPage.labelBackupShort') }} {{ $displayBizHybrid(s.meterName) }}
        </span>
      </div>
      <div slot="footer" class="dlg-footer">
        <el-pagination small :current-page.sync="dualDlg.page" :page-sizes="[10, 20, 30, 50]" :page-size.sync="dualDlg.size"
          :total="dualDlg.total" layout="total,sizes,prev,pager,next,jumper" />
        <div class="dlg-footer-btns">
          <el-button type="primary" :disabled="dualDlg.selected.length !== 2 || !canControl"
            @click="confirmBind(true)">{{ $t('subMeteringPage.btnConfirmBind') }}</el-button>
          <el-button @click="dualDlg.show = false">{{ $t('subMeteringPage.btnCancel') }}</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- ── 层级设置弹窗 ── -->
    <el-dialog :title="$t('subMeteringPage.dlgLayerSettings')" :visible.sync="showLayerDialog" width="500px" append-to-body>
      <el-form label-width="90px" size="small">
        <el-form-item :label="$t('subMeteringPage.formLayerName')">
          <el-input v-model="layerForm.name" :placeholder="$t('subMeteringPage.phLayerName')" maxlength="30" show-word-limit />
        </el-form-item>
      </el-form>
      <div slot="footer" style="display:flex;justify-content:flex-end;gap:8px;">
        <el-button type="primary" :disabled="!layerForm.name.trim() || !canControl" @click="confirmAddLayer">{{ $t('subMeteringPage.btnConfirmAdd') }}</el-button>
        <el-button @click="showLayerDialog = false">{{ $t('subMeteringPage.btnCancel') }}</el-button>
      </div>
    </el-dialog>

    <!-- ── 拖拽提示条 ── -->
    <transition name="drag-tip-fade">
      <div v-if="dragging && canControl" class="drag-tip">
        <i class="el-icon-rank" /> {{ $t('subMeteringPage.draggingMoving') }}<b>{{ $displayBizHybrid(dragging.name) }}</b>
      </div>
    </transition>
    </template>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import TreeNode from './TreeNode.vue'
import { mapGetters } from 'vuex'
import {
  bindNode,
  deleteNode,
  getTree,
  getCategoryDailyEnergy,
  pageSubMeter,
  updateNode,
  updateNodeByParentId
} from '@/api/newSubMetering'
import { MeterBindType, MeterOnlineStatus } from '@/utils/enums/meter'

// ─── 常量 ────────────────────────────────────────────────────────────────────
const NODE_TYPES = Object.freeze({
  ROOT: 'root',
  VIRTUAL_ROOT: 'virtual-root',
  CATEGORY: 'category',
  DEVICE: 'device',
  DEVICE_DUAL: 'device-dual'
})

const CTX_ACTIONS = Object.freeze({
  GLOBAL_ADD_LAYER: 'globalAddLayer',
  ADD_CAT: 'addCat',
  RENAME: 'rename',
  BIND: 'bind',
  BIND_DUAL: 'bindDual',
  DEL: 'del',
  UNBIND: 'unbind'
})

const MAX_HISTORY = 5
const KEYWORD_DELAY = 300
const ZOOM_STEP = 0.08
const ZOOM_MIN = 0.2
const ZOOM_MAX = 2.5

export default {
  name: 'SubMetering',
  components: { TreeNode },

  data () {
    return {
      NODE_TYPES,
      MeterBindType,
      MeterOnlineStatus,

      keyword: '',
      keywordTimer: null,
      dateRange: (() => {
        const now = new Date()
        const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
        const m = now.getMonth() === 0 ? 12 : now.getMonth() // getMonth() 是0-indexed，上月即当前月
        const pad = n => String(n).padStart(2, '0')
        const lastDay = new Date(y, m, 0).getDate() // m月最后一天（利用Date溢出）
        return [`${y}-${pad(m)}-01`, `${y}-${pad(m)}-${pad(lastDay)}`]
      })(),

      selectedId: null,
      selected: null,

      chartIns: null,
      categoryDailyEnergyList: [],

      treeLoading: false,
      detailLoading: false,
      queryLoading: false,
      chartScrollWidth: 372, // 图表内容宽度，随数据量动态计算

      scale: 1,
      tx: 0,
      ty: 0,
      panState: null,

      ctx: {
        show: false,
        x: 0,
        y: 0,
        items: [],
        pendingNode: null
      },

      dragging: null,

      meterDlg: {
        show: false,
        kw: '',
        page: 1,
        size: 20,
        selected: [],
        list: [],
        total: 0,
        loading: false
      },
      dualDlg: {
        show: false,
        kw: '',
        page: 1,
        size: 20,
        selected: [],
        list: [],
        total: 0,
        loading: false
      },

      showLayerDialog: false,
      layerForm: { name: '', parentId: '' },

      tree: null,

      historyStack: [],
      canUndo: false
    }
  },

  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapGetters(['kztMenuNos']),
    hasKztPermission () {
      const allow = new Set((this.kztMenuNos || []).map(v => String(v)))
      return menuNo => allow.has(String(menuNo))
    },
    canControl () {
      return this.hasKztPermission('640080')
    },
    canView () {
      return this.hasKztPermission('640081')
    },

    canvasStyle () {
      return {
        transform: `translate(${this.tx}px,${this.ty}px) scale(${this.scale})`,
        transformOrigin: '0 0',
        cursor: this.panState ? 'grabbing' : 'default'
      }
    },

    meterIcon () { return require('@/assets/images/szwyIcon2.jpg') },
    meterIcon2 () { return require('@/assets/images/szwyIcon1.jpg') },

    isGroupNode () {
      return this.selected &&
        [NODE_TYPES.ROOT, NODE_TYPES.CATEGORY, NODE_TYPES.VIRTUAL_ROOT]
          .includes(this.selected.type)
    },

    parentDeviceNode () {
      if (!this.selected || !this.tree) return null
      if (this.isGroupNode) return null
      const pid = this._findParentId(this.tree, this.selected.id)
      if (pid == null) return null
      const p = this._findNode(this.tree, pid)
      if (!p) return null
      return (p.type === NODE_TYPES.DEVICE || p.type === NODE_TYPES.DEVICE_DUAL) ? p : null
    },

    parentLossRate () {
      if (!this.selected || !this.tree) return null
      if (this.isGroupNode) return null
      const pid = this._findParentId(this.tree, this.selected.id)
      if (pid == null) return null
      const p = this._findNode(this.tree, pid)
      return p ? (p.lossRate || null) : null
    },

    selectedChildren () {
      if (!this.selected) return []
      const fresh = this._findNode(this.tree, this.selected.id)
      return (fresh && fresh.children) ? fresh.children : (this.selected.children || [])
    },

    /** 子节点按用能降序排列（用后端数据，不做计算） */
    sortedChildren () {
      return [...this.selectedChildren].sort((a, b) => {
        const va = this.childEnergyVal(a) ?? -Infinity
        const vb = this.childEnergyVal(b) ?? -Infinity
        return vb - va
      })
    },

    /** 是否有分类统计字段可展示 */
    hasCategoryStats () {
      if (!this.selected) return false
      return (
        this.selected.peakEnergy != null ||
        this.selected.avgEnergy != null ||
        this.selected.lossRate != null ||
        this.selected.deviceCount != null
      )
    },

    nodeTypeTagClass () {
      if (!this.selected) return ''
      return {
        [NODE_TYPES.ROOT]: 'tag-root',
        [NODE_TYPES.CATEGORY]: 'tag-cat',
        [NODE_TYPES.DEVICE_DUAL]: 'tag-dual'
      }[this.selected.type] || 'tag-dev'
    },

    nodeTypeIcon () {
      if (!this.selected) return ''
      return {
        [NODE_TYPES.ROOT]: 'el-icon-office-building',
        [NODE_TYPES.CATEGORY]: 'el-icon-folder',
        [NODE_TYPES.DEVICE_DUAL]: 'el-icon-connection'
      }[this.selected.type] || 'el-icon-cpu'
    },

    nodeTypeLabel () {
      if (!this.selected) return ''
      const t = k => this.$t(`subMeteringPage.${k}`)
      return {
        [NODE_TYPES.ROOT]: t('nodeTypeRoot'),
        [NODE_TYPES.CATEGORY]: t('nodeTypeCategory'),
        [NODE_TYPES.DEVICE_DUAL]: t('nodeTypeDual')
      }[this.selected.type] || t('nodeTypeDevice')
    },

    chartLegends () {
      return [{ name: this.$t('subMeteringPage.chartLegendTotal'), color: '#1890ff' }]
    },

    /** 日期选择器限制：选定起始日后，结束日最多往后1年 */
    datePickerOptions () {
      return {
        onPick: ({ maxDate, minDate }) => {
          this._pickerMinDate = minDate ? minDate.getTime() : null
          if (maxDate) this._pickerMinDate = null
        },
        disabledDate: time => {
          if (this._pickerMinDate) {
            const oneYear = 365 * 24 * 3600 * 1000
            return (
              time.getTime() > this._pickerMinDate + oneYear ||
              time.getTime() < this._pickerMinDate - oneYear
            )
          }
          return false
        }
      }
    }
  },

  mounted () {
    this.resetDetailScroll()
  },

  watch: {
    currentManagerId: {
      handler (val) { if (val && this.canView) this.fetchTree() },
      immediate: true
    },
    canView: {
      handler (val) { if (val && this.currentManagerId) this.fetchTree() },
      immediate: true
    },
    selected (val) {
      if (val) this.resetDetailScroll()
    },
    'meterDlg.page' () { this.loadMeters() },
    'meterDlg.size' () { this.meterDlg.page = 1; this.loadMeters() },
    'dualDlg.page' () { this.loadDualMeters() },
    'dualDlg.size' () { this.dualDlg.page = 1; this.loadDualMeters() },
    '$i18n.locale' () {
      if (this.tree && this.tree.id === 'root-virtual') {
        this.$set(this.tree, 'name', this.$t('subMeteringPage.virtualRootName'))
      }
      if (this.chartIns && this.categoryDailyEnergyList.length) {
        this.$nextTick(() => this.initChart())
      }
    }
  },
  activated () {
    this.resetDetailScroll()
  },

  beforeDestroy () {
    if (this.keywordTimer) clearTimeout(this.keywordTimer)
    if (this.chartIns) this.chartIns.dispose()
    this._unbindPanEvents()
  },

  methods: {
    onViewInfo (name) {
      this.$message.info(
        this.$t('subMeteringPage.msgViewInfo', { name: this.$displayBizHybrid(name || '') })
      )
    },

    meterBindLabel (v) {
      const k = `subMeteringPage.meterBind_${v}`
      return this.$te(k) ? this.$t(k) : (MeterBindType[v]?.label || '-')
    },

    meterOnlineLabel (v) {
      const k = `subMeteringPage.meterOnline_${v}`
      return this.$te(k) ? this.$t(k) : '-'
    },

    _requireControl () {
      if (this.canControl) return true
      this.$message.warning(this.$t('subMeteringPage.msgNoControl'))
      return false
    },

    // ══ 工具 ══════════════════════════════════════════════════════════════════

    fmtNum (v) {
      if (v == null || v === '') return '--'
      return String(v)
    },
    resetDetailScroll () {
      this.$nextTick(() => {
        const main = document.querySelector('.app-main')
        if (main) main.scrollTop = 0
        const el = this.$refs.detailBody
        if (!el) return
        el.scrollTop = 0
        setTimeout(() => {
          if (main) main.scrollTop = 0
          if (el) el.scrollTop = 0
        }, 0)
      })
    },

    /** 取子节点用能值（设备取 value，分类取 totalEnergy），严格后端字段，不计算 */
    childEnergyVal (child) {
      if (this.isDeviceNode(child)) return child.value ?? null
      return child.totalEnergy ?? null
    },

    rankClass (i) {
      if (i === 0) return 'rank-1'
      if (i === 1) return 'rank-2'
      if (i === 2) return 'rank-3'
      return 'rank-n'
    },

    rankBarClass (i) {
      if (i === 0) return 'bar-1'
      if (i === 1) return 'bar-2'
      if (i === 2) return 'bar-3'
      return 'bar-n'
    },

    lossConnectorClass (rate) {
      if (!rate) return 'gray'
      return parseFloat(rate) > 20 ? 'red' : 'green'
    },

    lossRateColorClass (rate) {
      if (!rate) return ''
      return parseFloat(rate) > 20 ? 'red' : 'green'
    },

    isDeviceNode (node) {
      return node.type === NODE_TYPES.DEVICE || node.type === NODE_TYPES.DEVICE_DUAL
    },

    _sameId (a, b) {
      if (a == null || b == null) return false
      return String(a) === String(b)
    },

    _findNode (tree, id) {
      if (!tree) return null
      if (this._sameId(tree.id, id)) return tree
      if (tree.children) {
        for (const c of tree.children) {
          const r = this._findNode(c, id)
          if (r) return r
        }
      }
      return null
    },

    _findParentId (tree, id) {
      if (!tree || id == null) return null
      const stack = [{ node: tree, parentId: null }]
      while (stack.length) {
        const { node, parentId } = stack.pop()
        if (this._sameId(node.id, id)) return parentId
        if (node.children?.length) {
          for (let i = node.children.length - 1; i >= 0; i--) {
            stack.push({ node: node.children[i], parentId: node.id })
          }
        }
      }
      return null
    },

    _isDescendant (node, targetId) {
      if (!node.children) return false
      for (const c of node.children) {
        if (this._sameId(c.id, targetId)) return true
        if (this._isDescendant(c, targetId)) return true
      }
      return false
    },

    // ══ 详情面板 ══════════════════════════════════════════════════════════════

    closePanel () {
      this.selected = null
      this.selectedId = null
      this.categoryDailyEnergyList = []
      if (this.chartIns) { this.chartIns.dispose(); this.chartIns = null }
    },

    async onSelect (node) {
      this.selectedId = node.id
      const fresh = this._findNode(this.tree, node.id)
      this.selected = fresh || node
      this.categoryDailyEnergyList = []

      if (this.selected?.type === NODE_TYPES.CATEGORY ||
        this.selected?.type === NODE_TYPES.ROOT) {
        await this.loadCategoryDailyEnergy()
        this.$nextTick(this.initChart)
        return
      }

      if (this.chartIns) {
        this.chartIns.dispose()
        this.chartIns = null
      }
    },

    // ══ 树数据 ════════════════════════════════════════════════════════════════

    onKeywordInput () {
      if (this.keywordTimer) clearTimeout(this.keywordTimer)
      this.keywordTimer = setTimeout(() => this.fetchTree(), KEYWORD_DELAY)
    },

    refreshTree () {
      if (this.treeLoading) return
      this.fetchTree()
    },

    async fetchTree () {
      if (!this.canView) return
      if (!this.currentManagerId) return
      this.treeLoading = true
      try {
        const newTree = await this._doFetchTree()
        this.tree = newTree
        this._syncSelected()
      } catch (e) {
        console.error('[SubMetering] fetchTree error:', e)
        this.$apiError.notify(e, this.$t('subMeteringPage.msgFetchTreeFail'))
      } finally {
        this.treeLoading = false
      }
    },

    async fetchTreeSilent () {
      if (!this.canView) return
      if (!this.currentManagerId) return
      try {
        const newTree = await this._doFetchTree()
        if (!newTree) {
          this.tree = null
          this._syncSelected()
          return
        }
        if (!this.tree) {
          this.tree = newTree
        } else {
          this._patchTree(this.tree, newTree)
        }
        this._syncSelected()
      } catch (e) {
        console.error('[SubMetering] fetchTreeSilent error:', e)
      }
    },

    async _doFetchTree () {
      const keyword = (this.keyword || '').trim()
      const res = await getTree({
        managerId: this.currentManagerId,
        startDate: this.dateRange[0],
        endDate: this.dateRange[1],
        ...(keyword ? { keyword } : {})
      })
      if (res.code === 200 && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.length === 1
          ? this.transformNode(res.data[0])
          : {
            id: 'root-virtual',
            name: this.$t('subMeteringPage.virtualRootName'),
            type: NODE_TYPES.VIRTUAL_ROOT,
            children: res.data.map((n, i) => this.transformNode(n, i))
          }
      }
      return null
    },

    _patchTree (old, neu) {
      if (!old || !neu) return
      const SKIP = new Set(['id', 'children'])
      for (const k of Object.keys(neu)) {
        if (!SKIP.has(k) && old[k] !== neu[k]) this.$set(old, k, neu[k])
      }
      for (const k of Object.keys(old)) {
        if (!SKIP.has(k) && !(k in neu)) this.$delete(old, k)
      }
      if (!Array.isArray(old.children)) this.$set(old, 'children', [])
      const oc = old.children
      const nc = neu.children || []
      const oldMap = {}
      oc.forEach((c, i) => { oldMap[String(c.id)] = i })
      const result = nc.map(ncItem => {
        const key = String(ncItem.id)
        if (oldMap[key] !== undefined) {
          this._patchTree(oc[oldMap[key]], ncItem)
          return oc[oldMap[key]]
        }
        return ncItem
      })
      oc.splice(0, oc.length)
      if (result.length) result.forEach(r => oc.push(r))
    },

    _syncSelected () {
      if (this.selectedId != null) {
        const next = this._findNode(this.tree, this.selectedId)
        if (next) this.selected = next
        else { this.selected = null; this.selectedId = null }
      }
    },

    transformNode (node, index = 0) {
      const nodeId = String(node.id)
      let type = NODE_TYPES.CATEGORY
      if (node.nodeType === 2) {
        type = (node.meters && node.meters.length === 2)
          ? NODE_TYPES.DEVICE_DUAL
          : NODE_TYPES.DEVICE
      } else {
        type = this._sameId(node.parentId, 0) ? NODE_TYPES.ROOT : NODE_TYPES.CATEGORY
      }
      const n = {
        ...node,
        id: nodeId,
        type,
        sort: node.sort != null ? node.sort : index,
        children: node.children
          ? node.children
            .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
            .map((c, i) => this.transformNode(c, i))
          : []
      }
      if (type === NODE_TYPES.DEVICE && node.meters?.length > 0) {
        const m = node.meters[0]
        n.name = m.meterName || n.name
        n.serial = m.serial
        n.value = m.energy ?? null
        n.power = m.p ?? null // 实时总有功功率
      }
      if (type === NODE_TYPES.DEVICE_DUAL && node.meters?.length === 2) {
        n.dualMeter = node.meters.map(m => ({ ...m, name: m.meterName }))
        n.name = node.meters[0].meterName || n.name
        n.serial = node.meters[0].serial
        n.name2 = node.meters[1].meterName
        n.serial2 = node.meters[1].serial
        n.value = node.meters[0].energy ?? null
        n.value2 = node.meters[1].energy ?? null
        n.power = node.meters[0].p ?? null // 主表实时功率
        n.power2 = node.meters[1].p ?? null // 备表实时功率
      }
      n.showChart = (type === NODE_TYPES.CATEGORY || type === NODE_TYPES.ROOT)
      return n
    },

    // ══ 电表列表 ══════════════════════════════════════════════════════════════

    async loadMeters () {
      if (this.meterDlg.loading) return
      this.meterDlg.loading = true
      try {
        const res = await pageSubMeter({
          managerId: this.currentManagerId,
          page: { current: this.meterDlg.page, size: this.meterDlg.size },
          queryWord: this.meterDlg.kw,
          isBind: 0
        })
        if (res.code === 200) {
          this.meterDlg.list = res.data.dataList || []
          this.meterDlg.total = res.data.total || 0
          this.$nextTick(() => this._restoreMeterSelection())
        }
      } catch (e) {
        console.error('[SubMetering] loadMeters error:', e)
        this.$apiError.notify(e, this.$t('subMeteringPage.msgLoadMeterListFail'))
      } finally {
        this.meterDlg.loading = false
      }
    },

    async loadDualMeters () {
      if (this.dualDlg.loading) return
      this.dualDlg.loading = true
      try {
        const res = await pageSubMeter({
          managerId: this.currentManagerId,
          page: { current: this.dualDlg.page, size: this.dualDlg.size },
          queryWord: this.dualDlg.kw,
          isBind: 0
        })
        if (res.code === 200) {
          this.dualDlg.list = res.data.dataList || []
          this.dualDlg.total = res.data.total || 0
          this.$nextTick(() => this._restoreDualSelection())
        }
      } catch (e) {
        console.error('[SubMetering] loadDualMeters error:', e)
        this.$apiError.notify(e, this.$t('subMeteringPage.msgLoadMeterListFail'))
      } finally {
        this.dualDlg.loading = false
      }
    },

    _restoreMeterSelection () {
      const table = this.$refs.meterTbl
      if (!table || !this.meterDlg.list.length) return
      const selectedIds = new Set(this.meterDlg.selected.map(s => s.meterId))
      this._meterRestoring = true
      this.meterDlg.list.forEach(row => {
        if (selectedIds.has(row.meterId)) {
          table.toggleRowSelection(row, true)
        }
      })
      this._meterRestoring = false
    },

    _restoreDualSelection () {
      const table = this.$refs.dualTbl
      if (!table || !this.dualDlg.list.length) return
      const selectedIds = new Set(this.dualDlg.selected.map(s => s.meterId))
      this._dualRestoring = true
      this.dualDlg.list.forEach(row => {
        if (selectedIds.has(row.meterId)) {
          table.toggleRowSelection(row, true)
        }
      })
      this._dualRestoring = false
    },

    searchMeters () { this.meterDlg.page = 1; this.loadMeters() },
    searchDualMeters () { this.dualDlg.page = 1; this.loadDualMeters() },

    meterTypeTagType (typeKey) {
      const map = { 1: '', 2: 'success', 3: 'warning', 4: 'danger', 5: 'info' }
      return map[typeKey] ?? 'info'
    },

    // ══ 右键菜单 ══════════════════════════════════════════════════════════════

    onGlobalCtx (e) {
      if (!this._requireControl()) return
      if (this.tree && this.tree.id) return
      if (this.ctx.show) { this.closeCtx(); return }
      const { x, y } = this._safeMenuPos(e.clientX, e.clientY, 170, 46)
      this.ctx = {
        show: true,
        x,
        y,
        items: [{ label: this.$t('subMeteringPage.ctxAddRoot'), action: CTX_ACTIONS.GLOBAL_ADD_LAYER, icon: 'el-icon-plus' }],
        pendingNode: null
      }
    },

    onCtx ({ event, node }) {
      if (!this._requireControl()) return
      const items = this._buildCtxItems(node)
      const rowH = 36
      const { x, y } = this._safeMenuPos(
        event.clientX, event.clientY, 172,
        items.filter(i => !i.divider).length * rowH + 10
      )
      this.ctx = { show: true, x, y, items, pendingNode: node }
    },

    _buildCtxItems (node) {
      const TYPE = NODE_TYPES
      const A = CTX_ACTIONS
      if (node.type === TYPE.ROOT) {
        return [
          { label: this.$t('subMeteringPage.ctxAddCategory'), action: A.ADD_CAT, icon: 'el-icon-folder-add' },
          { label: this.$t('subMeteringPage.ctxBindMeter'), action: A.BIND, icon: 'el-icon-link' },
          { label: this.$t('subMeteringPage.ctxBindDual'), action: A.BIND_DUAL, icon: 'el-icon-connection' }
        ]
      }
      if (node.type === TYPE.CATEGORY) {
        return [
          { label: this.$t('subMeteringPage.ctxRename'), action: A.RENAME, icon: 'el-icon-edit' },
          { label: this.$t('subMeteringPage.ctxAddCategory'), action: A.ADD_CAT, icon: 'el-icon-folder-add' },
          { label: this.$t('subMeteringPage.ctxBindMeter'), action: A.BIND, icon: 'el-icon-link' },
          { label: this.$t('subMeteringPage.ctxBindDual'), action: A.BIND_DUAL, icon: 'el-icon-connection' },
          { divider: true },
          { label: this.$t('subMeteringPage.ctxDelete'), action: A.DEL, icon: 'el-icon-delete', danger: true }
        ]
      }
      return [
        { label: this.$t('subMeteringPage.ctxBindMeter'), action: A.BIND, icon: 'el-icon-link' },
        { label: this.$t('subMeteringPage.ctxBindDual'), action: A.BIND_DUAL, icon: 'el-icon-connection' },
        { divider: true },
        { label: this.$t('subMeteringPage.ctxUnbind'), action: A.UNBIND, icon: 'el-icon-scissors', danger: true }
      ]
    },

    _safeMenuPos (cx, cy, menuW, menuH) {
      return {
        x: cx + menuW > window.innerWidth ? cx - menuW : cx,
        y: cy + menuH > window.innerHeight ? cy - menuH : cy
      }
    },

    closeCtx () { this.ctx.show = false },

    doCtx (action) {
      if (!this._requireControl()) return
      const A = CTX_ACTIONS
      const node = this.ctx.pendingNode
      this.closeCtx()
      if (action === A.GLOBAL_ADD_LAYER) { this.showLayerDialog = true; return }
      if (action === A.BIND) { this.meterDlg.show = true; this.$refs.meterTbl?.clearSelection(); this.loadMeters(); return }
      if (action === A.BIND_DUAL) { this.dualDlg.show = true; this.$refs.dualTbl?.clearSelection(); this.loadDualMeters(); return }
      if (action === A.ADD_CAT) { this._doAddCat(node); return }
      if (action === A.RENAME) { this._doRename(node); return }
      if (action === A.DEL || action === A.UNBIND) this._doDelete(node, action === A.DEL)
    },

    _doAddCat (node) {
      this.$prompt(
        this.$t('subMeteringPage.promptAddCatMessage'),
        this.$t('subMeteringPage.promptAddCatTitle'),
        {
          confirmButtonText: this.$t('subMeteringPage.btnOk'),
          cancelButtonText: this.$t('subMeteringPage.btnCancel'),
          inputPattern: /\S+/,
          inputErrorMessage: this.$t('subMeteringPage.inputErrorNameRequired')
        }
      ).then(async ({ value }) => {
        const parentId = (node.type === NODE_TYPES.VIRTUAL_ROOT) ? 0 : node.id
        try {
          const res = await bindNode({
            managerId: this.currentManagerId,
            parentId,
            nodeType: 1,
            nodeName: value,
            sort: (node.children || []).length,
            meterIds: []
          })
          if (res.code === 200) {
            this.$message.success(this.$t('subMeteringPage.msgCreateSuccess', { name: this.$displayBizHybrid(value) }))
            this.fetchTreeSilent()
          } else { this.$message.error(res.msg || this.$t('subMeteringPage.msgCreateFail')) }
        } catch (e) {
          console.error('[SubMetering] addCat error:', e)
          this.$apiError.notify(e, this.$t('subMeteringPage.msgCreateFailRetry'))
        }
      }).catch(() => { })
    },

    _doRename (node) {
      this.$prompt(
        this.$t('subMeteringPage.promptRenameMessage'),
        this.$t('subMeteringPage.promptRenameTitle'),
        {
          confirmButtonText: this.$t('subMeteringPage.btnOk'),
          cancelButtonText: this.$t('subMeteringPage.btnCancel'),
          inputValue: node.name
        }
      ).then(async ({ value }) => {
        if (!value || !value.trim()) return
        try {
          const res = await updateNode({ nodeId: node.id, parentId: node.parentId, newName: value })
          if (res.code === 200) {
            node.name = value
            if (this.selected && this._sameId(this.selected.id, node.id)) this.selected.name = value
            this.$message.success(this.$t('subMeteringPage.msgRenameSuccess'))
          } else { this.$message.error(res.msg || this.$t('subMeteringPage.msgRenameFail')) }
        } catch (e) {
          console.error('[SubMetering] rename error:', e)
          this.$apiError.notify(e, this.$t('subMeteringPage.msgRenameFailRetry'))
        }
      }).catch(() => { })
    },

    _doDelete (node, isDel) {
      this.$confirm(
        isDel
          ? this.$t('subMeteringPage.confirmDeleteWithChildren', { name: this.$displayBizHybrid(node.name, 120) })
          : this.$t('subMeteringPage.confirmUnbind', { name: this.$displayBizHybrid(node.name, 120) }),
        this.$t('subMeteringPage.titleWarning'),
        {
          confirmButtonText: this.$t('subMeteringPage.btnOk'),
          cancelButtonText: this.$t('subMeteringPage.btnCancel'),
          type: 'warning'
        }
      ).then(async () => {
        try {
          const res = await deleteNode(node.id)
          if (res.code === 200) {
            if (this._sameId(this.selectedId, node.id)) this.closePanel()
            this.$message.success(
              isDel ? this.$t('subMeteringPage.msgDeleteSuccess') : this.$t('subMeteringPage.msgUnbindSuccess')
            )
            this.fetchTreeSilent()
          } else {
            this.$message.error(
              res.msg || (isDel ? this.$t('subMeteringPage.msgDeleteFail') : this.$t('subMeteringPage.msgUnbindFail'))
            )
          }
        } catch (e) {
          console.error('[SubMetering] delete error:', e)
          this.$apiError.notify(e, this.$t('subMeteringPage.msgOpFailRetry'))
        }
      }).catch(() => { })
    },

    // ══ 绑定电表 ══════════════════════════════════════════════════════════════

    onMeterSelectionChange (rows) {
      if (this._meterRestoring) return
      // 跨页选择：当前页的选中行替换掉 selected 中同页的旧记录，保留其他页的
      const currentIds = new Set(this.meterDlg.list.map(r => r.meterId))
      this.meterDlg.selected = [
        ...this.meterDlg.selected.filter(s => !currentIds.has(s.meterId)),
        ...rows
      ]
    },

    onDualSelectionChange (rows) {
      if (this._dualRestoring) return
      const currentIds = new Set(this.dualDlg.list.map(r => r.meterId))
      this.dualDlg.selected = [
        ...this.dualDlg.selected.filter(s => !currentIds.has(s.meterId)),
        ...rows
      ]
    },

    checkSelectable (row) {
      if (row?.subId != null && row.subId !== '') return false
      if (this.dualDlg.selected.length >= 2) {
        return this.dualDlg.selected.some(s => s.meterId === row.meterId)
      }
      return true
    },

    singleSelectable (row) {
      return !(row?.subId != null && row.subId !== '')
    },

    meterRowStyle ({ row }) {
      return (row?.subId != null && row.subId !== '')
        ? { color: '#bfbfbf', background: '#fafafa' } : null
    },

    async confirmBind (isDual) {
      if (!this._requireControl()) return
      const tN = this.ctx.pendingNode
      if (isDual) {
        if (this.dualDlg.selected.length !== 2) {
          this.$message.warning(this.$t('subMeteringPage.msgPickTwoMeters'))
          return
        }
        const [p, b] = this.dualDlg.selected
        const parentId = (!tN || tN.type === NODE_TYPES.VIRTUAL_ROOT) ? 0 : tN.id
        try {
          const res = await bindNode({
            managerId: this.currentManagerId,
            parentId,
            nodeType: 2,
            deviceType: 2,
            nodeName: p.meterName,
            sort: (tN?.children || []).length,
            meterIds: [p.meterId, b.meterId]
          })
          if (res.code === 200) {
            this.$message.success(this.$t('subMeteringPage.msgBindDualSuccess'))
            this.dualDlg.show = false
            this.fetchTreeSilent()
          } else { this.$message.error(res.msg || this.$t('subMeteringPage.msgBindFail')) }
        } catch (e) {
          console.error('[SubMetering] bindDual error:', e)
          this.$apiError.notify(e, this.$t('subMeteringPage.msgBindFailRetry'))
        }
      } else {
        const rows = this.meterDlg.selected
        if (!rows.length) { this.$message.warning(this.$t('subMeteringPage.msgPickAtLeastOneMeter')); return }
        const parentId = (!tN || tN.type === NODE_TYPES.VIRTUAL_ROOT) ? 0 : tN.id
        const baseSort = (tN?.children || []).length
        const results = await Promise.allSettled(
          rows.map((row, i) => bindNode({
            managerId: this.currentManagerId,
            parentId,
            nodeType: 2,
            deviceType: 1,
            nodeName: row.meterName,
            sort: baseSort + i,
            meterIds: [row.meterId]
          }))
        )
        const failed = results.filter(r => r.status === 'rejected' || r.value?.code !== 200)
        if (failed.length === 0) {
          this.$message.success(this.$t('subMeteringPage.msgBindManySuccess', { n: rows.length }))
        } else {
          this.$message.warning(
            this.$t('subMeteringPage.msgBindPartial', { ok: rows.length - failed.length, fail: failed.length })
          )
        }
        this.meterDlg.show = false
        this.fetchTreeSilent()
      }
    },

    resetMeterDlg () {
      this.meterDlg.kw = ''
      this.meterDlg.page = 1
      this.meterDlg.selected = []
      this.meterDlg.list = []
      this.$refs.meterTbl?.clearSelection()
    },

    resetDualDlg () {
      this.dualDlg.kw = ''
      this.dualDlg.page = 1
      this.dualDlg.selected = []
      this.dualDlg.list = []
      this.$refs.dualTbl?.clearSelection()
    },

    // ══ 层级设置 ══════════════════════════════════════════════════════════════

    async confirmAddLayer () {
      if (!this._requireControl()) return
      if (!this.layerForm.name.trim()) { this.$message.warning(this.$t('subMeteringPage.msgLayerNameRequired')); return }
      let pid = 0
      if (this.layerForm.parentId !== '' && this.layerForm.parentId != null) {
        const pn = this._findNode(this.tree, this.layerForm.parentId)
        pid = pn?.type === NODE_TYPES.VIRTUAL_ROOT ? 0 : this.layerForm.parentId
      }
      if (pid === 0 && this.tree?.id) {
        this.$message.warning(this.$t('subMeteringPage.msgOnlyOneRoot'))
        return
      }
      try {
        const res = await bindNode({
          managerId: this.currentManagerId,
          parentId: pid,
          nodeType: 1,
          nodeName: this.layerForm.name,
          meterIds: [],
          sort: 0
        })
        if (res.code === 200) {
          this.$message.success(this.$t('subMeteringPage.msgLayerAdded', { name: this.$displayBizHybrid(this.layerForm.name) }))
          this.layerForm = { name: '', parentId: '' }
          this.showLayerDialog = false
          this.fetchTreeSilent()
        } else { this.$message.error(res.msg || this.$t('subMeteringPage.msgAddFail')) }
      } catch (e) {
        console.error('[SubMetering] addLayer error:', e)
        this.$apiError.notify(e, this.$t('subMeteringPage.msgAddFailRetry'))
      }
    },

    // ══ 拖拽 ══════════════════════════════════════════════════════════════════

    onDragNode (node) {
      if (!this._requireControl()) return
      this.dragging = node
    },
    onDragEnd () { this.dragging = null },

    async onDropNode ({ dragId, targetId }) {
      this.dragging = null
      if (!this._requireControl()) return
      if (!this.currentManagerId) return
      const dragNode = this._findNode(this.tree, dragId)
      const targetNode = this._findNode(this.tree, targetId)
      if (!dragNode || !targetNode || this._sameId(dragNode.id, targetNode.id)) return
      if (this._isDescendant(dragNode, targetNode.id)) {
        this.$message.warning(this.$t('subMeteringPage.msgCannotMoveToDescendant'))
        return
      }
      this._pushHistory()
      const dPid = this._findParentId(this.tree, dragId)
      const dParent = dPid != null ? this._findNode(this.tree, dPid) : null
      if (dParent?.children) {
        const idx = dParent.children.findIndex(n => this._sameId(n.id, dragId))
        if (idx !== -1) dParent.children.splice(idx, 1)
      }
      if (!targetNode.children) this.$set(targetNode, 'children', [])
      targetNode.children.push(dragNode)
      try {
        const res = await updateNodeByParentId({
          managerId: this.currentManagerId,
          nodeId: Number(dragNode.id),
          parentId: targetNode.type === NODE_TYPES.VIRTUAL_ROOT ? 0 : Number(targetNode.id),
          newName: dragNode.name,
          sort: targetNode.children.length - 1
        })
        if (res.code === 200) {
          this.$message({ message: this.$t('subMeteringPage.msgMoveSuccess'), type: 'success', duration: 1200 })
        } else {
          this._rollbackHistory()
          this.$message.error(res.msg || this.$t('subMeteringPage.msgMoveFail'))
        }
      } catch (e) {
        this._rollbackHistory()
        this.$apiError.notify(e, this.$t('subMeteringPage.msgMoveFailRetry'))
        console.error('[SubMetering] onDropNode error:', e)
      }
      this.fetchTreeSilent()
    },

    async onSortNode ({ dragId, targetId, position }) {
      this.dragging = null
      if (!this._requireControl()) return
      if (!this.currentManagerId) return
      const dragNode = this._findNode(this.tree, dragId)
      const targetNode = this._findNode(this.tree, targetId)
      if (!dragNode || !targetNode || this._sameId(dragNode.id, targetNode.id)) return
      if (this._isDescendant(dragNode, targetNode.id)) {
        this.$message.warning(this.$t('subMeteringPage.msgCannotMoveToDescendant'))
        return
      }
      this._pushHistory()
      const dPid = this._findParentId(this.tree, dragId)
      const tPid = this._findParentId(this.tree, targetId)
      const isSame = this._sameId(dPid, tPid)
      const tParent = tPid != null ? this._findNode(this.tree, tPid) : this.tree
      if (!tParent?.children) return
      const sibs = tParent.children
      const tIdx = sibs.findIndex(n => this._sameId(n.id, targetId))
      if (tIdx === -1) return
      let insertIdx = position === 'before' ? tIdx : tIdx + 1
      if (isSame) {
        const dIdx = sibs.findIndex(n => this._sameId(n.id, dragId))
        if (dIdx === -1) return
        sibs.splice(dIdx, 1)
        const newTIdx = sibs.findIndex(n => this._sameId(n.id, targetId))
        insertIdx = position === 'before' ? newTIdx : newTIdx + 1
        sibs.splice(insertIdx, 0, dragNode)
        sibs.forEach((n, i) => { n.sort = i })
      } else {
        const dParent = dPid != null ? this._findNode(this.tree, dPid) : this.tree
        if (dParent?.children) {
          const di = dParent.children.findIndex(n => this._sameId(n.id, dragId))
          if (di !== -1) dParent.children.splice(di, 1)
          dParent.children.forEach((n, i) => { n.sort = i })
        }
        sibs.splice(insertIdx, 0, dragNode)
        sibs.forEach((n, i) => { n.sort = i })
      }
      const newPid = tPid != null
        ? (tParent.type === NODE_TYPES.VIRTUAL_ROOT ? 0 : Number(tPid))
        : 0
      try {
        const res = await updateNodeByParentId({
          managerId: this.currentManagerId,
          nodeId: Number(dragNode.id),
          parentId: newPid,
          newName: dragNode.name,
          sort: insertIdx
        })
        if (res.code === 200) {
          this.$message({
            message: isSame ? this.$t('subMeteringPage.msgSortSuccess') : this.$t('subMeteringPage.msgMoveSuccess'),
            type: 'success',
            duration: 1000
          })
        } else {
          this._rollbackHistory()
          this.$message.error(res.msg || this.$t('subMeteringPage.msgOpFail'))
        }
      } catch (e) {
        this._rollbackHistory()
        this.$apiError.notify(e, this.$t('subMeteringPage.msgOpFailRetry2'))
        console.error('[SubMetering] onSortNode error:', e)
      }
      this.fetchTreeSilent()
    },

    // ══ 撤销栈 ════════════════════════════════════════════════════════════════

    _pushHistory () {
      if (!this.tree) return
      try {
        const snap = JSON.parse(JSON.stringify(this.tree))
        this.historyStack.push(snap)
        if (this.historyStack.length > MAX_HISTORY) this.historyStack.shift()
        this.canUndo = true
      } catch (e) { console.warn('[SubMetering] pushHistory failed:', e) }
    },

    _rollbackHistory () {
      const snap = this.historyStack[this.historyStack.length - 1]
      if (snap) {
        try {
          this.tree = JSON.parse(JSON.stringify(snap))
          this._syncSelected()
        } catch (e) { console.warn('[SubMetering] rollbackHistory failed:', e) }
      }
    },

    _flattenTree (node, parentId, result = {}) {
      if (!node || !node.id) return result
      const pid = (node.type === NODE_TYPES.ROOT || node.type === NODE_TYPES.VIRTUAL_ROOT)
        ? 0 : (parentId == null ? 0 : Number(parentId))
      if (node.type !== NODE_TYPES.VIRTUAL_ROOT) {
        result[String(node.id)] = { node, parentId: pid, sort: node.sort ?? 0 }
      }
      if (node.children) {
        node.children.forEach(c =>
          this._flattenTree(c, node.type === NODE_TYPES.VIRTUAL_ROOT ? 0 : node.id, result)
        )
      }
      return result
    },

    async undo () {
      if (!this._requireControl()) return
      if (!this.historyStack.length) {
        this.$message({
          message: this.$t('subMeteringPage.msgUndoNone', { max: MAX_HISTORY }),
          type: 'warning',
          duration: 1800
        })
        return
      }
      const snap = this.historyStack.pop()
      this.canUndo = this.historyStack.length > 0
      const curMap = this._flattenTree(this.tree, 0)
      const snapMap = this._flattenTree(snap, 0)
      const changed = []
      for (const id of Object.keys(snapMap)) {
        const s = snapMap[id]
        const c = curMap[id]
        if (!c) continue
        if (s.parentId !== c.parentId || s.sort !== c.sort) {
          changed.push({ node: s.node, parentId: s.parentId, sort: s.sort })
        }
      }
      this.tree = snap
      this._syncSelected()
      if (!changed.length) return
      this.$message({
        message: this.$t('subMeteringPage.msgUndoSyncing', { n: changed.length }),
        type: 'info',
        duration: 1200
      })
      const results = await Promise.allSettled(
        changed.map(item => updateNodeByParentId({
          managerId: this.currentManagerId,
          nodeId: Number(item.node.id),
          parentId: item.parentId,
          newName: item.node.name,
          sort: item.sort
        }))
      )
      const failCount = results.filter(r => r.status === 'rejected' || r.value?.code !== 200).length
      if (failCount > 0) {
        this.$message.error(
          this.$t('subMeteringPage.msgUndoPartialFail', { fail: failCount, total: changed.length })
        )
      } else {
        this.$message.success(this.$t('subMeteringPage.msgUndoSuccess'))
      }
      this.fetchTreeSilent()
    },

    // ══ 画布缩放 & 平移 ═══════════════════════════════════════════════════════

    zoomIn () { this._zoomAt(ZOOM_STEP, null) },
    zoomOut () { this._zoomAt(-ZOOM_STEP, null) },
    resetView () { this.scale = 1; this.tx = 0; this.ty = 0 },

    _zoomAt (delta, point) {
      const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, this.scale + delta))
      if (newScale === this.scale) return
      if (point) {
        const cv = this.$refs.treeCanvas
        if (cv) {
          const rect = cv.getBoundingClientRect()
          const mx = point.x - rect.left
          const my = point.y - rect.top
          const cx = (mx - this.tx) / this.scale
          const cy = (my - this.ty) / this.scale
          this.scale = newScale
          this.tx = mx - cx * this.scale
          this.ty = my - cy * this.scale
          return
        }
      }
      this.scale = newScale
    },

    onWheel (e) {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      this._zoomAt(delta, { x: e.clientX, y: e.clientY })
    },

    _startPan (cx, cy) {
      this._unbindPanEvents()
      this.panState = { ox: cx - this.tx, oy: cy - this.ty }
      document.addEventListener('mousemove', this._onPanMove)
      document.addEventListener('mouseup', this._onPanUp)
    },

    _onPanMove (e) {
      if (!this.panState) return
      this.tx = e.clientX - this.panState.ox
      this.ty = e.clientY - this.panState.oy
    },

    _onPanUp () {
      this.panState = null
      this._unbindPanEvents()
    },

    _unbindPanEvents () {
      document.removeEventListener('mousemove', this._onPanMove)
      document.removeEventListener('mouseup', this._onPanUp)
    },

    onRootPanStart (e) {
      const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
      const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
      this._startPan(cx, cy)
    },

    onCanvasMouseDown (e) {
      if (e.button !== 0) return
      const INTERACTIVE = [
        '.tn-root', '.tn-cat', '.tn-dev',
        '.col-btn', '.collapsed-badge', '.badge-more',
        'button', 'input', 'a', '[draggable="true"]'
      ].join(',')
      if (e.target.closest(INTERACTIVE)) return
      this._startPan(e.clientX, e.clientY)
    },

    onPanEnd () { this.panState = null; this._unbindPanEvents() },
    onPanStartTouch (e) {
      const t = e.touches?.[0]; if (!t) return
      this._startPan(t.clientX, t.clientY)
    },
    onPanMoveTouch (e) {
      if (!this.panState) return
      const t = e.touches[0]
      this.tx = t.clientX - this.panState.ox
      this.ty = t.clientY - this.panState.oy
    },

    // ══ 图表 ══════════════════════════════════════════════════════════════════

    initChart () {
      const dom = this.$refs.chartEl
      if (!dom) return
      if (this.chartIns) this.chartIns.dispose()

      const rows = Array.isArray(this.categoryDailyEnergyList) ? this.categoryDailyEnergyList : []
      const xData = rows.map(r => r.occurDate)
      const yData = rows.map(r => {
        const n = Number(r.useElec)
        return Number.isFinite(n) ? n : 0
      })

      // 每根柱子占 BAR_SLOT px；left=56 right=24 各留足空间
      const BAR_SLOT = 40
      const GRID_LEFT = 56
      const GRID_RIGHT = 24
      const MIN_WIDTH = 372
      const calcWidth = Math.max(MIN_WIDTH, GRID_LEFT + xData.length * BAR_SLOT + GRID_RIGHT)
      this.chartScrollWidth = calcWidth

      // 等 DOM 宽度更新后再 init，避免 echarts 取到旧尺寸
      this.$nextTick(() => {
        if (this.chartIns) this.chartIns.dispose()
        this.chartIns = echarts.init(dom)
        this.chartIns.setOption({
          grid: { top: 12, right: 24, bottom: 44, left: 56 },
          xAxis: {
            type: 'category',
            data: xData,
            axisLabel: {
              fontSize: 10,
              color: '#999',
              interval: 0,
              rotate: xData.length > 14 ? 40 : 0,
              formatter: v => (typeof v === 'string' && v.length >= 10) ? v.slice(5) : v
            },
            axisLine: { lineStyle: { color: '#e8eaed' } },
            axisTick: { lineStyle: { color: '#e8eaed' } }
          },
          yAxis: {
            type: 'value',
            // 不设 name，避免浮在左上角压标题；单位已在卡片头部"电量（度）"体现
            axisLabel: {
              fontSize: 10,
              color: '#999',
              formatter: v => v >= 10000 ? (v / 10000).toFixed(1) + 'w' : v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v
            },
            splitLine: { lineStyle: { color: '#f5f5f5', type: 'dashed' } }
          },
          tooltip: {
            trigger: 'axis',
            confine: true,
            textStyle: { fontSize: 11 },
            backgroundColor: 'rgba(255,255,255,.97)',
            borderColor: '#e0e6f0',
            borderWidth: 1,
            formatter: params => {
              const p = params[0]
              return `<div style="font-size:11px;color:#666">${p.axisValue}</div>` +
                `<div style="margin-top:4px;font-size:13px;font-weight:700;color:#1677ff">${p.value} <span style="font-size:11px;font-weight:400;color:#aaa">kWh</span></div>`
            }
          },
          series: [{
            name: this.$t('subMeteringPage.chartLegendTotal'),
            type: 'bar',
            barWidth: 20,
            data: yData,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#4096ff' },
                  { offset: 1, color: '#1677ff' }
                ]
              },
              borderRadius: [4, 4, 0, 0]
            },
            emphasis: {
              itemStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: '#69b1ff' },
                    { offset: 1, color: '#1677ff' }
                  ]
                }
              }
            }
          }]
        })
      })
    },

    async loadCategoryDailyEnergy () {
      if (!this.currentManagerId) return
      if (!this.selected) return
      if (![NODE_TYPES.CATEGORY, NODE_TYPES.ROOT].includes(this.selected.type)) return
      this.detailLoading = true
      try {
        const res = await getCategoryDailyEnergy({
          categoryId: Number(this.selected.id),
          startDate: this.dateRange[0],
          endDate: this.dateRange[1]
        })
        if (res.code === 200) {
          this.categoryDailyEnergyList = Array.isArray(res.data) ? res.data : []
        } else {
          this.categoryDailyEnergyList = []
          this.$message.error(res.msg || this.$t('subMeteringPage.msgDailyEnergyFail'))
        }
      } catch (e) {
        this.categoryDailyEnergyList = []
        console.error('[SubMetering] getCategoryDailyEnergy error:', e)
        this.$apiError.notify(e, this.$t('subMeteringPage.msgDailyEnergyFailRetry'))
      } finally {
        this.detailLoading = false
      }
    },

    async onDateChange (val) {
      if (!val || !val[0] || !val[1]) return
      const start = new Date(val[0])
      const end = new Date(val[1])
      const diffDays = (end - start) / (1000 * 60 * 60 * 24)
      if (diffDays > 366) {
        this.$message.warning(this.$t('subMeteringPage.msgDateSpanYear'))
        return
      }
      this.queryLoading = true
      try {
        await this.fetchTree()
        if (this.selected && [NODE_TYPES.CATEGORY, NODE_TYPES.ROOT].includes(this.selected.type)) {
          await this.loadCategoryDailyEnergy()
          this.$nextTick(this.initChart)
        }
      } finally {
        this.queryLoading = false
      }
    },

    async onQuery () {
      // 日期跨度校验：不能超过 1 年（366天）
      if (this.dateRange && this.dateRange[0] && this.dateRange[1]) {
        const start = new Date(this.dateRange[0])
        const end = new Date(this.dateRange[1])
        const diffDays = (end - start) / (1000 * 60 * 60 * 24)
        if (diffDays > 366) {
          this.$message.warning(this.$t('subMeteringPage.msgDateSpanYear'))
          return
        }
      }
      this.queryLoading = true
      try {
        await this.fetchTree()
        if (this.selected &&
          [NODE_TYPES.CATEGORY, NODE_TYPES.ROOT].includes(this.selected.type)) {
          await this.loadCategoryDailyEnergy()
          this.$nextTick(this.initChart)
        }
        this.$message({
          message: this.$t('subMeteringPage.msgQueriedRange', {
            start: this.dateRange[0],
            end: this.dateRange[1]
          }),
          type: 'success',
          duration: 1500
        })
      } finally {
        this.queryLoading = false
      }
    }
  }
}
</script>

<style scoped>
/* ════════════════════════════════════════════════════════
   SubMetering — 生产级样式
   ════════════════════════════════════════════════════════ */

.page-wrap {
  display: flex;
  height: 100vh;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #f0f2f5;
}

/* ── 左侧树面板 ── */
.tree-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #e8eaed;
  overflow: hidden;
}

.tree-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #e8eaed;
  flex-shrink: 0;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.toolbar-date-group {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.toolbar-left>>>.el-input__inner {
  border-radius: 18px;
  background: #f5f7fa;
  border-color: transparent;
  transition: all .2s;
}

.toolbar-left>>>.el-input__inner:focus {
  background: #fff;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, .1);
}

/* ── 画布区域 ── */
.tree-canvas {
  flex: 1;
  overflow: hidden;
  padding: 40px 50px;
  background: #f7f8fa;
  background-image: radial-gradient(circle, #d6dae4 1px, transparent 1px);
  background-size: 20px 20px;
  position: relative;
  user-select: none;
}

.tree-inner {
  display: inline-flex;
  align-items: center;
  min-width: max-content;
  min-height: max-content;
}

/* 缩放指示器 */
.zoom-indicator {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(255, 255, 255, .92);
  border: 1px solid #e0e3e8;
  border-radius: 20px;
  padding: 4px 10px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .08);
  backdrop-filter: blur(4px);
}

.zoom-btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  padding: 2px 5px;
  border-radius: 4px;
  line-height: 1;
  transition: all .15s;
}

.zoom-btn:hover {
  background: #f0f0f0;
  color: #1890ff;
}

.zoom-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.zoom-btn:disabled:hover {
  background: none;
  color: #ccc;
}

.reset-btn {
  font-size: 12px;
}

.zi-sep {
  width: 1px;
  height: 14px;
  background: #e0e3e8;
  margin: 0 4px;
}

.zoom-val {
  min-width: 38px;
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: #555;
}

/* 骨架屏 */
@keyframes shimmer {
  0% {
    background-position: -400px 0
  }

  100% {
    background-position: 400px 0
  }
}

.tree-skeleton {
  display: inline-flex;
  align-items: center;
}

.skel-root,
.skel-node {
  background: linear-gradient(90deg, #ebebeb 25%, #e0e0e0 50%, #ebebeb 75%);
  background-size: 400px 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 8px;
}

.skel-root {
  width: 80px;
  height: 52px;
}

.skel-hline {
  width: 36px;
  height: 2px;
  background: #e0e0e0;
}

.skel-children {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.skel-node {
  width: 160px;
  height: 60px;
}

/* 空状态 */
.tree-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 40px;
  color: #bbb;
}

.tree-empty i {
  font-size: 52px;
  color: #d9d9d9;
}

.tree-empty p {
  font-size: 14px;
  margin: 0;
}

/* ── 右侧详情面板 ── */
.detail-panel {
  width: 400px;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  border-left: 1px solid #e8eaed;
  overflow: hidden;
}

.panel-slide-enter-active {
  transition: all .28s cubic-bezier(.34, 1.5, .64, 1);
}

.panel-slide-leave-active {
  transition: all .18s ease;
}

.panel-slide-enter {
  opacity: 0;
  transform: translateX(32px);
}

.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 16px 12px;
  background: #fff;
  border-bottom: 1px solid #e8eaed;
  flex-shrink: 0;
  gap: 10px;
}

.head-left {
  flex: 1;
  min-width: 0;
}

.node-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  margin-bottom: 5px;
}

.tag-root {
  background: #fff1f0;
  color: #cf1322;
}

.tag-cat {
  background: #fff7e6;
  color: #d46b08;
}

.tag-dev {
  background: #e6f4ff;
  color: #0958d9;
}

.tag-dual {
  background: #f6ffed;
  color: #389e0d;
}

.head-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.head-date-range {
  font-size: 11px;
  color: #aaa;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 3px;
}

.close-btn {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 13px;
  transition: all .15s;
  margin-top: 2px;
}

.close-btn:hover {
  background: #ffe8e8;
  color: #ff4d4f;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-body::-webkit-scrollbar {
  width: 4px;
}

.detail-body::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

/* ══════════════════════════════════════════════════════
   分类节点详情 — 新增样式
   ══════════════════════════════════════════════════════ */

/* 总用能英雄卡片 */
.energy-hero-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1677ff 0%, #0050b3 100%);
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 16px rgba(22, 119, 255, .3);
  flex-shrink: 0;
}

.ehc-bg-decoration {
  position: absolute;
  right: -20px;
  top: -20px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, .06);
  pointer-events: none;
}

.ehc-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ehc-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(255, 255, 255, .18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.ehc-meter-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.ehc-label {
  font-size: 13px;
  color: rgba(255, 255, 255, .8);
  font-weight: 500;
}

.ehc-date {
  font-size: 11px;
  color: rgba(255, 255, 255, .55);
  margin-top: 3px;
}

.ehc-right {
  text-align: right;
  flex-shrink: 0;
}

.ehc-value {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
  letter-spacing: -0.5px;
}

.ehc-unit {
  font-size: 12px;
  color: rgba(255, 255, 255, .65);
  margin-top: 4px;
}

/* 通用 Section 卡片 */
.section-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #ebeef5;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .05);
  flex-shrink: 0;
}

.sc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 9px;
  border-bottom: 1px solid #f5f5f5;
  background: #fafafa;
}

.sc-title {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  display: flex;
  align-items: center;
  gap: 5px;
}

.sc-title i {
  color: #1890ff;
}

.sc-count {
  font-size: 11px;
  color: #aaa;
  background: #f0f0f0;
  padding: 1px 7px;
  border-radius: 8px;
}

.sc-body {
  padding: 0;
}

/* 子节点用能行 */
.child-energy-row {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  gap: 8px;
  cursor: pointer;
  transition: background .13s;
}

.child-energy-row:hover {
  background: #f5f9ff;
}

.cer-border {
  border-top: 1px solid #f5f5f5;
}

.cer-rank {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rank-1 {
  background: #fff7e0;
  color: #d48806;
}

.rank-2 {
  background: #f0f0f0;
  color: #666;
}

.rank-3 {
  background: #fff2e8;
  color: #d4380d;
}

.rank-n {
  background: #f5f5f5;
  color: #bbb;
  font-weight: 500;
}

.cer-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.cer-meter-img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.cer-folder-icon {
  font-size: 14px;
  color: #e6a23c;
}

.cer-info {
  flex: 1;
  min-width: 0;
}

.cer-dual-row {
  display: flex;
  align-items: center;
  gap: 5px;
  line-height: 1.6;
}

.cer-dual-label {
  font-size: 10px;
  font-weight: 600;
  padding: 0 4px;
  border-radius: 3px;
  flex-shrink: 0;
}

.cer-dual-label.primary {
  background: #f0f5ff;
  color: #4a7fcb;
  border: 1px solid #d0dff5;
}

.cer-dual-label.backup {
  background: #f4fbf6;
  color: #4a9a6a;
  border: 1px solid #c0dfcc;
}

.cer-dual-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.cer-dual-name {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cer-dual-val-row {
  display: flex;
  align-items: baseline;
  gap: 2px;
  justify-content: flex-end;
  line-height: 1.6;
}

.cer-name {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cer-serial {
  font-size: 10px;
  color: #aaa;
  margin-top: 1px;
}

.cer-dual-tags {
  display: flex;
  gap: 4px;
  margin-top: 3px;
  flex-wrap: wrap;
}

.cer-dual-tag {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 500;
  white-space: nowrap;
}

.cer-dual-tag.primary {
  background: #f0f5ff;
  color: #4a7fcb;
  border: 1px solid #d0dff5;
}

.cer-dual-tag.backup {
  background: #f4fbf6;
  color: #4a9a6a;
  border: 1px solid #c0dfcc;
}

.cer-right {
  flex-shrink: 0;
  text-align: right;
  min-width: 80px;
}

.cer-value {
  font-size: 13px;
  font-weight: 700;
  color: #303133;
  white-space: nowrap;
}

.cer-unit {
  font-size: 11px;
  font-weight: 400;
  color: #aaa;
  margin-left: 2px;
}

.cer-na {
  color: #ccc;
  font-weight: 400;
}

.cer-ratio-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  justify-content: flex-end;
}

.cer-ratio-bar {
  width: 52px;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.cer-ratio-fill {
  height: 100%;
  border-radius: 2px;
  transition: width .4s ease;
}

.bar-1 {
  background: linear-gradient(90deg, #faad14, #fa8c16);
}

.bar-2 {
  background: linear-gradient(90deg, #36cfc9, #1890ff);
}

.bar-3 {
  background: linear-gradient(90deg, #73d13d, #52c41a);
}

.bar-n {
  background: #d9d9d9;
}

.cer-ratio-text {
  font-size: 10px;
  color: #aaa;
  white-space: nowrap;
  min-width: 30px;
  text-align: right;
}

.cer-arr {
  color: #ccc;
  font-size: 11px;
  flex-shrink: 0;
  margin-left: 2px;
}

/* 空子节点 */
.empty-children-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px;
  color: #ccc;
  font-size: 13px;
  background: #fff;
  border-radius: 10px;
  border: 1px dashed #e8eaed;
}

.empty-children-tip i {
  font-size: 32px;
}

/* 图表卡片 */
.chart-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #ebeef5;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .05);
  flex-shrink: 0;
}

.chart-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 14px 0;
  flex-wrap: wrap;
  gap: 6px;
}

.cch-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cch-icon {
  color: #1890ff;
  font-size: 14px;
}

.cch-title {
  font-size: 12px;
  font-weight: 600;
  color: #555;
}

.cch-unit {
  font-size: 11px;
  color: #bbb;
}

.chart-scroll-wrap {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  /* 自定义滚动条 */
  scrollbar-width: thin;
  scrollbar-color: #d0d7e3 transparent;
}

.chart-scroll-wrap::-webkit-scrollbar {
  height: 5px;
}

.chart-scroll-wrap::-webkit-scrollbar-track {
  background: transparent;
}

.chart-scroll-wrap::-webkit-scrollbar-thumb {
  background: #d0d7e3;
  border-radius: 3px;
}

.chart-scroll-wrap::-webkit-scrollbar-thumb:hover {
  background: #b0bac8;
}

.chart-canvas {
  /* 宽度由 JS 动态设置，高度固定 */
  height: 280px;
  min-width: 100%;
  display: block;
  padding-bottom: 2px;
  box-sizing: border-box;
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 32px;
  color: #ccc;
  font-size: 12px;
}

.chart-empty i {
  font-size: 28px;
}

/* 统计摘要行 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  flex-shrink: 0;
}

.stat-item {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  padding: 12px 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .04);
}

.si-label {
  font-size: 11px;
  color: #999;
  margin-bottom: 5px;
}

.si-val {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.si-unit {
  font-size: 11px;
  font-weight: 400;
  color: #aaa;
  margin-left: 2px;
}

.si-val.green {
  color: #52c41a;
}

.si-val.red {
  color: #f5222d;
}

/* 图例 */
.legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #888;
}

.ldot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* ── 流程连线（设备节点） ── */
.section-lbl {
  font-size: 11px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: .4px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 2px;
}

.upstream-lbl {
  color: #cf1322;
}

.downstream-lbl {
  color: #389e0d;
}

.flow-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #ebeef5;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .05);
}

.flow-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  margin: 2px 0;
}

.fc-line {
  width: 1px;
  height: 18px;
  border-left: 1px solid;
}

.flow-connector.gray .fc-line {
  border-color: #dcdfe6;
}

.flow-connector.green .fc-line {
  border-color: #b7eb8f;
}

.flow-connector.red .fc-line {
  border-color: #ffccc7;
}

.fc-loss-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  border: 1px solid;
}

.fc-loss-badge.green {
  color: #389e0d;
  background: #f6ffed;
  border-color: #b7eb8f;
}

.fc-loss-badge.red {
  color: #cf1322;
  background: #fff1f0;
  border-color: #ffccc7;
}

.fc-loss-badge b {
  font-weight: 700;
}

.fc-arrow {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
}

.flow-connector.gray .fc-arrow {
  border-top: 6px solid #dcdfe6;
}

.flow-connector.green .fc-arrow {
  border-top: 7px solid #52c41a;
}

.flow-connector.red .fc-arrow {
  border-top: 7px solid #ff4d4f;
}

.flow-item,
.list-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  gap: 10px;
  cursor: pointer;
  transition: background .14s;
}

.flow-item:hover,
.list-item:hover {
  background: #f5f9ff;
}

.flow-item--border {
  border-top: 1px solid #f5f5f5;
}

.dual-parent-hd {
  padding: 6px 14px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  cursor: default;
}

.dual-parent-hd:hover {
  background: #fafafa;
}

.dual-child-header {
  padding: 5px 14px 4px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  cursor: pointer;
}

.dual-child-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #8c8c8c;
  font-weight: 500;
  letter-spacing: .3px;
}

.dual-child-tag i {
  font-size: 10px;
  color: #bbb;
}

.item-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
}

.dev-icon-wrap {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
}

.backup-icon {
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
}

.cat-icon-wrap {
  background: #fffbf0;
  border: 1px solid #faecd8;
  color: #e6a23c;
  font-size: 13px;
}

.meter-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, .08));
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: #222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-name.big {
  font-size: 14px;
}

.item-serial {
  font-size: 11px;
  color: #aaa;
  margin-top: 2px;
}

.view-link {
  color: #1890ff;
  cursor: pointer;
  margin-left: 5px;
  font-size: 11px;
}

.view-link:hover {
  text-decoration: underline;
}

.item-right {
  flex-shrink: 0;
  text-align: right;
  min-width: 76px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.item-val {
  font-size: 13px;
  font-weight: 700;
  color: #333;
  white-space: nowrap;
}

.item-val .u {
  font-size: 11px;
  font-weight: 400;
  color: #aaa;
  margin-left: 2px;
}

.item-ratio {
  font-size: 11px;
  color: #aaa;
}

.item-arr {
  color: #ccc;
  font-size: 11px;
  flex-shrink: 0;
}

/* 当前节点卡 */
.current-card {
  background: #f0f9ff;
  border: 1px solid #1890ff;
  border-radius: 10px;
  padding: 12px 14px;
  box-shadow: 0 2px 12px rgba(24, 144, 255, .15);
}

.current-card-tag {
  font-size: 10px;
  font-weight: 600;
  color: #606266;
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 6px;
  display: inline-block;
  margin-bottom: 10px;
  letter-spacing: .5px;
  text-transform: uppercase;
  border: 1px solid #dcdfe6;
}

.current-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cur-metrics {
  flex-shrink: 0;
  text-align: right;
  min-width: 72px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.cur-val {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.cur-num {
  font-size: 16px;
  font-weight: 700;
  color: #1677ff;
  white-space: nowrap;
}

.cur-unit {
  font-size: 11px;
  color: #aaa;
}

.cur-total {
  font-size: 10px;
  color: #bbb;
  white-space: nowrap;
}

.cur-power {
  font-size: 10px;
  color: #52c41a;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 2px;
}

.cur-power .el-icon-lightning {
  font-size: 10px;
}

.dual-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #606266;
  font-weight: 500;
  background: #f4f4f5;
  border: 1px solid #dcdfe6;
  padding: 2px 9px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.dual-sep {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #909399;
  margin: 8px 0;
}

.dual-sep::before,
.dual-sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #ebeef5;
}

.source-label {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 3px;
  letter-spacing: .2px;
}

.source-label.primary {
  background: #f0f5ff;
  color: #4a7fcb;
  border: 1px solid #d0dff5;
}

.source-label.backup {
  background: #f4fbf6;
  color: #4a9a6a;
  border: 1px solid #c0dfcc;
}

/* ── 右键菜单 ── */
.ctx-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, .12), 0 1px 4px rgba(0, 0, 0, .06);
  padding: 4px 0;
  min-width: 158px;
  margin: 0;
  list-style: none;
  border: 1px solid rgba(0, 0, 0, .06);
}

.ctx-item {
  padding: 0 14px;
  height: 36px;
  line-height: 36px;
  font-size: 13px;
  cursor: pointer;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background .12s;
}

.ctx-item i {
  font-size: 13px;
  color: #bbb;
}

.ctx-item:hover {
  background: #f5f7fa;
  color: #1890ff;
}

.ctx-item:hover i {
  color: #1890ff;
}

.ctx-item.danger {
  color: #ff4d4f;
}

.ctx-item.danger i {
  color: #ffccc7;
}

.ctx-item.danger:hover {
  background: #fff1f0;
}

.ctx-divider {
  height: 1px !important;
  padding: 0 !important;
  background: #f0f0f0;
  pointer-events: none;
  margin: 3px 0;
  cursor: default;
}

.ctx-fade-enter-active {
  transition: opacity .15s, transform .15s;
}

.ctx-fade-leave-active {
  transition: opacity .1s;
}

.ctx-fade-enter {
  opacity: 0;
  transform: scale(.95) translateY(-4px);
}

.ctx-fade-leave-to {
  opacity: 0;
}

/* ── 弹窗 ── */
.sdot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}

.sdot.online {
  background: #52c41a;
}

.sdot.offline {
  background: #f5a623;
}

.dlg-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 0 4px;
}

.dlg-footer-btns {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .dlg-footer {
    flex-direction: column;
    align-items: flex-end;
  }
}

.dual-selected-tip {
  margin-top: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: #606266;
  background: #f4f6fb;
  border: 1px solid #dce3f0;
  border-radius: 6px;
  padding: 7px 12px;
}

.dual-selected-tip .el-icon-info {
  color: #1890ff;
}

.dual-selected-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 11px;
  white-space: nowrap;
}

.dual-selected-tag.primary {
  background: #f0f5ff;
  color: #4a7fcb;
  border: 1px solid #d0dff5;
}

.dual-selected-tag.backup {
  background: #f4fbf6;
  color: #4a9a6a;
  border: 1px solid #c0dfcc;
}

/* ── 拖拽提示 ── */
.drag-tip {
  position: fixed;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(24, 144, 255, .9);
  color: #fff;
  padding: 7px 18px;
  border-radius: 20px;
  font-size: 13px;
  z-index: 9999;
  pointer-events: none;
  box-shadow: 0 4px 14px rgba(24, 144, 255, .3);
  display: flex;
  align-items: center;
  gap: 7px;
}

.drag-tip b {
  font-weight: 700;
}

.drag-tip-fade-enter-active {
  transition: all .2s cubic-bezier(.34, 1.5, .64, 1);
}

.drag-tip-fade-leave-active {
  transition: all .15s;
}

.drag-tip-fade-enter,
.drag-tip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

/* 树淡入 */
.tree-fade-enter-active {
  transition: opacity .3s, transform .3s;
}

.tree-fade-leave-active {
  transition: opacity .2s;
}

.tree-fade-enter {
  opacity: 0;
  transform: scale(.98);
}

.tree-fade-leave-to {
  opacity: 0;
}
</style>
