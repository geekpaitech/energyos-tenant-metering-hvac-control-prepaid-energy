<template>
  <div class="photovoltaic-page">
    <div class="station-title page-layout">
      <span :class="['online-dot', { offline: !isOnline }]"></span>
      <span class="station-name">{{ stationDisplayName }}</span>
      <span class="station-id">ID：{{ stationSno }}</span>
      <el-button icon="el-icon-refresh" size="mini" plain circle :loading="loading" @click="refreshCharts"></el-button>
    </div>
    <el-row :gutter="16" class="page-layout">
      <el-col :xs="24" :sm="24" :md="24" :lg="18" :xl="18" class="main-col">
        <el-card
          v-loading="runtimeLoading || loading"
          element-loading-text="数据加载中..."
          element-loading-spinner="el-icon-loading"
          element-loading-background="rgba(255, 255, 255, 0.78)"
          class="glass-card topology-card"
          shadow="never"
        >
          <div class="report-time">
            数据上报时间：<strong>{{ reportTimeText }}</strong>
            <span>{{ reportTimeRelative }}</span>
            <span v-if="isEmsRealtimeActive" class="load-bucket-time">
              负载统计时段：<strong>{{ realtimeLoadTimeText }}</strong>
            </span>
          </div>
          <button :class="['topology-toggle', { 'is-table': topologyMode === 'table' }]" type="button" @click="toggleTopologyMode">
            <i :class="topologyMode === 'flow' ? 'el-icon-arrow-right' : 'el-icon-arrow-left'"></i>
          </button>
          <div v-show="topologyMode === 'flow'" class="topology-wrap">
            <svg class="flow-svg" viewBox="0 0 1180 390" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="pvBg" x1="0" x2="1">
                  <stop offset="0%" stop-color="#fff2a9" stop-opacity="0.78" />
                  <stop offset="100%" stop-color="#fffdf7" stop-opacity="0.18" />
                </linearGradient>
                <linearGradient id="gridBg" x1="0" x2="1">
                  <stop offset="0%" stop-color="#ffd6d6" stop-opacity="0.76" />
                  <stop offset="100%" stop-color="#fffafa" stop-opacity="0.18" />
                </linearGradient>
                <linearGradient id="loadBg" x1="0" x2="1">
                  <stop offset="0%" stop-color="#ffe0b7" stop-opacity="0.82" />
                  <stop offset="100%" stop-color="#fff8ee" stop-opacity="0.2" />
                </linearGradient>
                <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#dfe5ef" flood-opacity="0.45" />
                </filter>
              </defs>

              <rect class="node-bg pv-bg" x="70" y="42" width="426" height="100" rx="50" />
              <rect class="node-bg grid-bg" :class="{ 'is-idle': !gridParticipating }" x="690" y="42" width="426" height="100" rx="50" />
              <rect class="node-bg load-bg" x="690" y="282" width="426" height="100" rx="50" />

              <path id="pvPath" :class="['flow-line', 'pv-line', { 'is-idle': !flowActive.pv }]" d="M 496 92 H 570 Q 592 92 592 114 V 198" />
              <path id="gridPath" :class="['flow-line', 'grid-line', { 'is-idle': !flowActive.grid }]" d="M 690 92 H 642 Q 620 92 620 114 V 198" />
              <path id="gridExportPath" d="M 620 198 V 114 Q 620 92 642 92 H 690" fill="none" stroke="none" />
              <path id="loadPath" :class="['flow-line', 'load-line', { 'is-idle': !flowActive.load }]" d="M 606 250 V 314 Q 606 332 628 332 H 690" />

              <g v-show="flowActive.pv" class="motion-arrow pv-arrow">
                <path d="M -9 -8 L 10 0 L -9 8 L -5 0 Z" />
                <animateMotion dur="1.9s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#pvPath" xlink:href="#pvPath" />
                </animateMotion>
              </g>
              <g v-show="flowActive.grid" class="motion-arrow grid-arrow">
                <path d="M -9 -8 L 10 0 L -9 8 L -5 0 Z" />
                <animateMotion dur="2.1s" repeatCount="indefinite" rotate="auto">
                  <mpath :href="gridMotionPath" :xlink:href="gridMotionPath" />
                </animateMotion>
              </g>
              <g v-show="flowActive.load" class="motion-arrow load-arrow">
                <path d="M -9 -8 L 10 0 L -9 8 L -5 0 Z" />
                <animateMotion dur="2s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#loadPath" xlink:href="#loadPath" />
                </animateMotion>
              </g>

              <g class="node-copy">
                <rect x="112" y="58" width="4" height="24" rx="2" fill="#f4c400" />
                <text x="128" y="77" class="node-title">PV</text>
                <text x="112" y="108" class="node-sub">当日发电：</text>
                <text x="192" y="108" class="node-value">{{ pvDaySummaryText }}</text>
              </g>
              <g class="node-copy" :class="{ 'is-idle': !gridParticipating }">
                <rect x="806" y="58" width="4" height="24" rx="2" fill="#ff7b7b" />
                <text x="822" y="77" class="node-title">{{ gridNodeTitle }}</text>
                <text x="806" y="108" class="node-sub">当日买电：</text>
                <text x="886" y="108" class="node-value">{{ gridBuyDayText }}</text>
                <text x="806" y="134" class="node-sub">当日卖电：</text>
                <text x="886" y="134" class="node-value">{{ gridSellDayText }}</text>
              </g>
              <g class="node-copy">
                <rect x="806" y="304" width="4" height="24" rx="2" fill="#ff9d2e" />
                <text x="822" y="323" class="node-title">负载用电</text>
                <text x="806" y="354" class="node-sub">当日用电：</text>
                <text x="886" y="354" class="node-value">{{ loadDayText }}</text>
              </g>

              <g class="circle-node pv-node">
                <circle class="ring-track" cx="449" cy="92" r="47" />
                <circle class="ring-progress" cx="449" cy="92" r="47" transform="rotate(-82 449 92)" :style="{ strokeDasharray: pvRingDasharray }" />
                <foreignObject x="421" y="62" width="56" height="52">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="36" height="34" style="display:block;margin:4px auto 0">
                    <path d="M851.39 379.5c0-90.58-73.69-164.27-164.27-164.27-76.78 0-144.3 54.39-160.54 129.34-0.65 3.01-0.66 5.98-0.3 8.87H166.31c-23.36 0-42.98 16.75-46.65 39.82L64.52 740.32a47.177 47.177 0 0 0 10.73 38.08 47.166 47.166 0 0 0 35.92 16.57h230.66v67.8h-91.74c-14.73 0-26.67 11.94-26.67 26.67 0 14.73 11.94 26.67 26.67 26.67h314.3c14.73 0 26.67-11.94 26.67-26.67 0-14.73-11.94-26.67-26.67-26.67h-91.74v-67.8h230.66a47.19 47.19 0 0 0 35.92-16.56 47.22 47.22 0 0 0 10.74-38.09l-31.71-199.55c75.93-14.7 133.13-82.32 133.13-161.27zM336.2 741.63l4.04-79.92h133.98l4.04 79.92H336.2z m6.73-133.27l3.45-68.3h121.69l3.45 68.3H342.93z m-53.41 0H139.5l10.85-68.3h142.62l-3.45 68.3z m59.56-121.64l4.04-79.92h108.22l4.04 79.92h-116.3z m172.4 53.34h142.63l10.85 68.3H524.93l-3.45-68.3z m-2.69-53.34l-4.04-79.92h128.19l12.7 79.92H518.79zM171.53 406.8h128.18l-4.04 79.92H158.83l12.7-79.92z m-40.51 254.91h155.8l-4.04 79.92H118.32l12.7-79.92z m288.27 201.06h-24.13v-67.8h24.13v67.8z m112.38-121.14l-4.04-79.92h155.81l12.7 79.92H531.67z m178.17-253.65l-15.05-94.71c-3.67-23.07-23.29-39.82-46.64-39.82h-68.8c11.88-49.31 56.76-84.87 107.77-84.87 61.17 0 110.93 49.76 110.93 110.92 0 52.72-37.79 97.89-88.21 108.48z" fill="#f5cf00"/><path d="M851.76 502.01c-10.41-10.42-27.31-10.42-37.71 0-10.42 10.41-10.42 27.3 0 37.71l30.14 30.14c5.2 5.21 12.03 7.81 18.86 7.81 6.82 0 13.65-2.6 18.86-7.81 10.42-10.41 10.42-27.3 0-37.71l-30.15-30.14zM933.4 350.74h-42.62c-14.73 0-26.67 11.94-26.67 26.67s11.94 26.67 26.67 26.67h42.62c14.73 0 26.67-11.94 26.67-26.67s-11.94-26.67-26.67-26.67zM830.27 261.72c6.82 0 13.65-2.6 18.86-7.81l30.14-30.14c10.42-10.41 10.42-27.3 0-37.71-10.41-10.42-27.31-10.42-37.71 0l-30.14 30.14c-10.42 10.41-10.42 27.3 0 37.71 5.2 5.21 12.03 7.81 18.85 7.81zM686.81 203.85c14.73 0 26.67-11.94 26.67-26.67v-42.62c0-14.73-11.94-26.67-26.67-26.67-14.73 0-26.67 11.94-26.67 26.67v42.62c0 14.73 11.94 26.67 26.67 26.67zM525.6 256.55c5.2 5.21 12.03 7.81 18.86 7.81 6.82 0 13.65-2.6 18.86-7.81 10.42-10.41 10.42-27.3 0-37.71l-30.14-30.14c-10.41-10.42-27.31-10.42-37.71 0-10.42 10.41-10.42 27.3 0 37.71l30.13 30.14z" fill="#f5cf00"/>
                  </svg>
                </foreignObject>
                <text x="449" y="119" text-anchor="middle" class="power-text">{{ pvPowerText }}</text>
              </g>
              <g :class="['circle-node', 'grid-node', { 'is-idle': !gridParticipating }]">
                <circle class="ring-track" cx="737" cy="92" r="47" />
                <circle class="ring-progress" cx="737" cy="92" r="47" transform="rotate(-82 737 92)" :style="{ strokeDasharray: gridRingDasharray }" />
                <foreignObject x="709" y="62" width="56" height="52">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1048 1024" width="36" height="34" style="display:block;margin:4px auto 0">
                    <path d="M343.04 1024H79.555048l52.053333-763.928381h159.378286z m-211.309714-48.761905h159.134476l-45.470476-666.404571h-68.266667z" fill="#ff7b7b"/><path d="M0 438.857143h414.47619v48.761905H0z" fill="#ff7b7b"/><path d="M24.380952 365.714286h48.761905v73.142857H24.380952z" fill="#ff7b7b"/><path d="M341.333333 365.714286h48.761905v73.142857h-48.761905z" fill="#ff7b7b"/><path d="M0 975.238095h414.47619v48.761905H0z" fill="#ff7b7b"/><path d="M939.349333 1015.881143h-287.695238L708.85181 0h173.275428z m-236.153904-48.761905h184.58819L836.022857 48.761905h-81.066667z" fill="#ff7b7b"/><path d="M560.761905 170.666667h463.238095v48.761904H560.761905z" fill="#ff7b7b"/><path d="M585.142857 97.52381h48.761905v73.142857h-48.761905z" fill="#ff7b7b"/><path d="M560.761905 975.238095h487.619047v48.761905H560.761905z" fill="#ff7b7b"/><path d="M701.147429 248.003048l34.474666-34.474667 162.377143 162.377143-34.474667 34.474666z" fill="#ff7b7b"/><path d="M128.926476 502.710857l34.718476-34.230857 150.284191 152.405333-34.718476 34.230857z" fill="#ff7b7b"/><path d="M116.004571 808.764952l34.474667-34.474666 183.710476 183.710476-34.474666 34.474667z" fill="#ff7b7b"/><path d="M691.321905 517.607619l157.817905-157.817905 34.474666 34.474667-157.817905 157.817905z" fill="#ff7b7b"/><path d="M106.179048 785.798095l157.817904-157.817905 34.474667 34.474667-157.817905 157.817905z" fill="#ff7b7b"/><path d="M701.147429 516.193524l34.474666-34.474667 180.662857 180.662857-34.474666 34.474667z" fill="#ff7b7b"/><path d="M676.08381 825.417143l173.056-173.056 34.474666 34.474667-173.056 173.056z" fill="#ff7b7b"/><path d="M701.805714 858.160762l33.158096-35.791238 165.522285 153.35619-33.158095 35.766857z" fill="#ff7b7b"/><path d="M949.321143 203.897905l-29.525333-38.814476a695.417905 695.417905 0 0 0 83.334095-72.923429l35.961905 32.914286a729.35619 729.35619 0 0 1-89.770667 78.823619z" fill="#ff7b7b"/><path d="M346.624 409.6q-12.190476 0-24.380952-0.292571l1.194666-48.761905a923.769905 923.769905 0 0 0 382.073905-72.118857l18.822095 45.007238A974.140952 974.140952 0 0 1 346.624 409.6z" fill="#ff7b7b"/><path d="M26.819048 414.744381q-10.532571 0-21.211429-0.268191l1.170286-48.761904a813.056 813.056 0 0 0 581.802666-229.790476l35.986286 32.914285A850.480762 850.480762 0 0 1 26.819048 414.744381z" fill="#ff7b7b"/>
                  </svg>
                </foreignObject>
                <text x="737" y="121" text-anchor="middle" class="power-text">{{ gridPowerText }}</text>
              </g>
              <g class="circle-node inverter-node">
                <circle class="ring-track" cx="606" cy="214" r="43" />
                <foreignObject x="578" y="188" width="56" height="52">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="42" height="40" style="display:block;margin:6px auto 0">
                    <path d="M512 995.566933c267.0592 0 483.566933-216.507733 483.566933-483.566933S779.0592 28.433067 512 28.433067 28.433067 244.9408 28.433067 512 244.9408 995.566933 512 995.566933zM512 1024C229.239467 1024 0 794.760533 0 512 0 229.239467 229.239467 0 512 0c282.760533 0 512 229.239467 512 512 0 282.760533-229.239467 512-512 512zM426.666667 284.433067V256c0-15.701333 12.731733-28.433067 28.433066-28.433067h113.800534c15.701333 0 28.433067 12.731733 28.433066 28.433067v28.433067h56.900267c15.701333 0 28.433067 12.731733 28.433067 28.4672V768c0 15.701333-12.731733 28.433067-28.433067 28.433067h-284.4672A28.433067 28.433067 0 0 1 341.333333 768V312.900267c0-15.701333 12.731733-28.4672 28.433067-28.4672H426.666667z m142.2336 113.800533l-170.666667 170.666667h85.333333L455.099733 682.666667l170.666667-170.666667h-85.333333l28.4672-113.7664z" fill="#ff9d2e"/>
                  </svg>
                </foreignObject>
              </g>
              <g class="circle-node load-node">
                <circle class="ring-track" cx="737" cy="332" r="47" />
                <circle class="ring-progress" cx="737" cy="332" r="47" transform="rotate(-82 737 332)" :style="{ strokeDasharray: loadRingDasharray }" />
                <foreignObject x="709" y="302" width="56" height="52">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="36" height="34" style="display:block;margin:4px auto 0">
                    <path d="M494.492444 705.991111h0.099556v191.744a25.6 25.6 0 0 0 25.685333 25.6h231.253334V693.191111a12.8 12.8 0 0 1 12.8-12.8h89.912889a12.8 12.8 0 0 1 12.8 12.8v230.044445h64.227555c6.812444 0 13.340444-2.702222 18.176-7.495112 4.807111-4.778667 7.509333-11.292444 7.509333-18.076444V705.92h0.113778l-231.338666-230.4L494.492444 705.991111z m167.111112 89.457778a12.8 12.8 0 0 1-12.8 12.8H571.733333a12.8 12.8 0 0 1-12.8-12.8v-89.514667a12.8 12.8 0 0 1 12.8-12.8h77.098667a12.8 12.8 0 0 1 12.8 12.8l-0.028444 89.514667z m326.656-156.359111l-106.851556-111.772445v-73.955555a18.744889 18.744889 0 1 0-37.461333 0v34.773333l-102.670223-107.392a24.177778 24.177778 0 0 0-35.285333 0L450.161778 648.291556a27.022222 27.022222 0 0 0 0 36.977777 24.177778 24.177778 0 0 0 35.271111 0L723.626667 436.152889l229.333333 239.900444a24.177778 24.177778 0 0 0 35.285333 0 27.022222 27.022222 0 0 0 0-36.977777l0.014223 0.014222z m-570.396445 62.976a28.956444 28.956444 0 0 1-21.504-9.102222c-0.298667-0.312889-0.398222-0.739556-0.668444-1.080889l-34.759111 51.811555V597.020444l44.088888 42.666667 14.222223-14.919111-39.296-37.930667h75.619555l68.366222-71.381333-49.009777-183.580444h78.449777v55.466666h82.887112v-117.930666H474.040889v-65.820445h85.489778v-55.466667h-85.489778V99.555556h-51.825778v48.568888H242.616889V99.555556h-51.825778v48.568888H105.244444v55.466667h85.489778v65.891556H28.444444v117.944889h82.901334v-55.466667h78.222222L31.886222 923.235556h60.458667l24.504889-91.904h332.8v-64.170667h-75.505778l43.719111-65.095111z m-28.686222-292.622222l-28.245333 77.454222v-125.297778l28.245333 47.843556z m-20.209778-77.582223h45.511111l1.265778 4.778667-16.782222 45.994667-29.994667-50.773334z m2.716445 190.791111l32.213333-88.248888 52.167111 88.248888h-84.380444z m54.129777-148.280888l26.183111 98.033777-38.300444-64.810666 12.117333-33.223111zM242.616889 203.591111h179.598222v65.891556H242.616889v-65.891556z m53.688889 128.341333l-30.122667 50.801778-17.180444-46.933333 1.038222-3.854222 46.264889-0.014223z m-57.400889 41.656889l12.501333 34.133334-39.168 66.048 26.666667-100.181334z m22.314667 60.871111l32.341333 88.248889h-84.664889l52.323556-88.248889z m24.177777 152.419556l-52.764444 50.872889-34.133333-50.872889h86.897777z m-106.894222 13.511111l36.536889 54.371556-68.650667 66.176 32.113778-120.547556zM134.030222 767.260444l2.048-7.708444 90.652445-87.395556 63.900444 95.104H133.959111h0.071111z m169.969778-23.367111l-59.648-88.746666 59.648-57.486223v146.232889z m0-258.161777l-27.932444-76.231112 27.932444-47.075555v123.306667z" fill="#ff9d2e"/>
                  </svg>
                </foreignObject>
                <text x="737" y="359" text-anchor="middle" class="power-text">{{ loadPowerText }}</text>
              </g>
            </svg>
          </div>
          <div v-show="topologyMode === 'table'" class="topology-table">
            <el-table :data="topologyTableData" border>
              <el-table-column prop="name" label="" min-width="120"></el-table-column>
              <el-table-column prop="power" label="光伏" min-width="120"></el-table-column>
              <el-table-column prop="day" label="当日" min-width="160"></el-table-column>
              <el-table-column prop="month" label="当月" min-width="160"></el-table-column>
              <el-table-column prop="year" label="当年" min-width="160"></el-table-column>
              <el-table-column prop="total" label="累计" min-width="160"></el-table-column>
            </el-table>
          </div>
        </el-card>

        <el-card class="glass-card runtime-card" shadow="never">
          <div slot="header" class="runtime-title">运行数据</div>
          <div
            v-loading="runtimeLoading || loading"
            element-loading-text="数据加载中..."
            element-loading-spinner="el-icon-loading"
            element-loading-background="rgba(255, 255, 255, 0.78)"
            class="runtime-body"
          >
          <div class="runtime-toolbar">
            <div class="date-switch">
              <el-button size="small" icon="el-icon-arrow-left" @click="shiftRuntimeDate(-1)"></el-button>
              <el-date-picker
                :key="runtimeType"
                v-model="pickerValue"
                :type="runtimeType === 'year' ? 'year' : runtimeType === 'month' ? 'month' : 'date'"
                size="small"
                class="runtime-picker"
                :value-format="pickerFormat"
                :clearable="false"
                :append-to-body="true"
                popper-class="photovoltaic-date-picker"
                @change="handlePickerChange"
              />
              <el-button size="small" icon="el-icon-arrow-right" @click="shiftRuntimeDate(1)"></el-button>
            </div>
            <el-tabs v-model="runtimeType" class="runtime-tabs">
              <el-tab-pane label="日" name="day"></el-tab-pane>
              <el-tab-pane label="月" name="month"></el-tab-pane>
              <el-tab-pane label="年" name="year"></el-tab-pane>
            </el-tabs>
            <el-button size="small" class="toolbar-btn" icon="el-icon-s-operation" @click="openDayParamDialog">参数选择</el-button>
            <el-button size="small" class="toolbar-btn" icon="el-icon-download" disabled>导出</el-button>
          </div>

          <el-row :gutter="10" class="runtime-summary">
            <el-col :xs="24" :sm="8" :md="8">
              <div class="donut-panel">
                <div ref="donutChart" class="donut-chart"></div>
                <div class="donut-legend">
                  <p><span class="legend-dot pv"></span>{{ activeRuntime.labelPrefix }}自用 <strong>{{ activeRuntime.selfUse }}</strong></p>
                  <p><span class="legend-dot grid"></span>{{ activeRuntime.labelPrefix }}并网 <strong>{{ activeRuntime.gridSell }}</strong></p>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="16" :md="16">
              <div class="stat-panel">
                <div>
                  <span>{{ activeRuntime.labelPrefix }}发电量(逆变器)</span>
                  <strong>{{ activeRuntime.generation }}</strong>
                </div>
                <div>
                  <span>{{ activeRuntime.labelPrefix }}买电量</span>
                  <strong>{{ activeRuntime.buy }}</strong>
                </div>
              </div>
            </el-col>
          </el-row>

          <div class="income-row">
            <span><strong>{{ activeRuntime.labelPrefix }}收益：</strong>{{ activeRuntime.income }}</span>
            <span><strong>{{ activeRuntime.labelPrefix }}满发小时数：</strong>{{ activeRuntime.fullHours }}</span>
          </div>

          <div ref="trendChart" class="trend-chart"></div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="24" :lg="6" :xl="6" class="side-col">
        <el-card class="glass-card side-card weather-card" shadow="never">
          <div class="side-title">{{ weatherCityText }}</div>
          <div class="weather-grid">
            <div v-for="item in weatherItems" :key="item.label" class="weather-item">
              <span class="weather-icon"><i :class="item.icon"></i></span>
              <div>
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </div>
          <div class="update-time">更新时间：{{ weatherUpdateText }}</div>
        </el-card>

        <el-card class="glass-card side-card station-card" shadow="never">
          <div class="side-title">电站信息</div>
          <div class="station-image-wrap">
            <img :src="stationImageUrl" :alt="stationDisplayName" />
            <span class="station-image-badge">1/1</span>
          </div>
          <el-row :gutter="12" class="station-info">
            <el-col :span="12">
              <p>状态</p>
              <strong><span :class="['online-dot', 'small', { offline: !isOnline }]"></span>{{ stationStateText }}</strong>
            </el-col>
            <el-col :span="12">
              <p>电站名称</p>
              <strong>{{ stationDisplayName }}</strong>
            </el-col>
            <el-col :span="12">
              <p>组件总容量</p>
              <strong>{{ capacityText }}</strong>
            </el-col>
            <el-col :span="12">
              <p>业主</p>
              <strong>{{ ownerText }}</strong>
            </el-col>
            <el-col :span="24">
              <p>电站地址</p>
              <strong class="orange-text">{{ stationAddressText }}</strong>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="glass-card side-card emission-card" shadow="never">
          <div class="side-title">节能减排</div>
          <div class="emission-grid">
            <div v-for="item in emissionItems" :key="item.label" class="emission-item">
              <i :class="item.icon"></i>
              <div>
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="glass-card side-card basic-card" shadow="never">
          <div class="side-title">基本信息</div>
          <div class="basic-list">
            <div v-for="item in basicInfoItems" :key="item.label" class="basic-item">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      :visible.sync="dayParamDialogVisible"
      width="480px"
      custom-class="day-param-dialog"
      append-to-body
      :close-on-click-modal="false"
    >
      <div slot="title" class="day-param-dialog-head">
        <strong>曲线参数</strong>
        <span>选择日视图趋势图展示的监测指标</span>
      </div>
      <div class="day-param-group">
        <div class="day-param-group-title">光伏监测</div>
        <div class="day-param-options">
          <label
            v-for="item in dayChartParamOptions"
            :key="item.key"
            :class="['day-param-option', { 'is-checked': dayChartParamsDraft[item.key] }]"
          >
            <input v-model="dayChartParamsDraft[item.key]" type="checkbox" class="day-param-option-input" />
            <span class="day-param-option-dot" :style="{ background: item.color }"></span>
            <span class="day-param-option-text">
              <strong>{{ item.label }}</strong>
              <em>{{ item.unit }}</em>
            </span>
            <i :class="dayChartParamsDraft[item.key] ? 'el-icon-check' : 'el-icon-plus'"></i>
          </label>
        </div>
      </div>
      <span slot="footer" class="day-param-dialog-footer">
        <el-button size="small" plain @click="resetDayChartParams">恢复默认</el-button>
        <div class="day-param-dialog-actions">
          <el-button size="small" @click="cancelDayChartParams">取消</el-button>
          <el-button size="small" type="primary" class="day-param-confirm" @click="confirmDayChartParams">应用</el-button>
        </div>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  fetchStationDetail,
  fetchStationDayRuntime,
  fetchStationMonthRuntime,
  fetchStationYearRuntime,
  peelPhotovoltaicPayload
} from '@/api/photovoltaic'
import {
  mapStationToEnergyFlow,
  computeEnergyFlowDiagram,
  computeEnergyFlowWithRealLoad,
  mergeEmsLoadIntoDaySlots,
  mapPowerParamToDaySlots,
  mergeMonotonicSlotValues,
  resolveLatestPowerParamLoad,
  markCurrentDaySlotCollecting,
  hasRealLoadData,
  getFlowPathVisibility,
  mapDayRuntimeRecordsToFullDay,
  mapMonthRuntimeRecordsToFullMonth,
  mapYearRuntimeRecordsToFullYear,
  summarizeMonthRuntimeRecords,
  summarizeDayRuntimeRecord,
  findMonthRecordByDay,
  hasRuntimeDayRecordData,
  hasRuntimeSummaryData,
  formatRuntimeEnergyValue,
  formatPreciseNumber,
  formatRecordEnergyAmount,
  isRuntimeChartValue,
  toRuntimeChartValue,
  hasRuntimeChartMetric,
  hasDistinctLoadMetric,
  getRuntimeComboYAxisRange,
  shouldShowDayChartHourLabel,
  formatEnergyWithUnit,
  formatPowerWithUnit,
  formatMoney,
  formatRelativeTime,
  formatDateTime,
  resolveStationReportTimestamp,
  getPeriodSnapshot,
  resolveInverterOnlineStatus
} from '@/utils/energyFlowMapper'

import {
  fetchDailyLoadPower,
  fetchOverviewTrend,
  fetchPowerParam,
  extractCurrentLoadPower,
  expandHourlyToMinuteSlots,
  normalizeTrendValues
} from '@/api/ems'

/** EMS 区域 ID（南都广场） */
const EMS_AREA_ID = ''

/** 电站信息固定封面（OSS 上传，不使用接口 picUrl） */
const STATION_IMAGE_URL = 'https://oss.example.com/web-file/station.png'

const POLL_INTERVAL = 120000 // 120s，避免锦浪 API 429 限流
const EMS_RECENT_WINDOW_MS = 60 * 60 * 1000
const EMS_SETTLE_DELAY_MS = 2 * 60 * 1000
// 锦浪 API 请求限速：确保两次调用间隔 >= MIN_API_GAP_MS
let _lastApiCallTs = 0
const MIN_API_GAP_MS = 2000
function _paceApiCall () {
  const now = Date.now()
  const gap = now - _lastApiCallTs
  if (gap < MIN_API_GAP_MS) {
    return new Promise(resolve => setTimeout(resolve, MIN_API_GAP_MS - gap))
  }
  return Promise.resolve()
}
function _markApiCall () {
  _lastApiCallTs = Date.now()
}

/** 生成 EMS overviewTrend 的 nowTime 参数（YYYY-MM-DD HH:mm:ss） */
function _emsNowTime () {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const COLORS = {
  pv: '#f5cf00',
  orange: '#ff9f32',
  red: '#f56c6c',
  blue: '#2f73c8',
  cyan: '#20aec5'
}

const DEFAULT_DAY_CHART_PARAMS = { power: true, grid: true, load: true }

/**
 * 计算 SVG 环形进度条的 stroke-dasharray 字符串
 * @param {number} ratio 占比 0-1（如 porwerPercent=0.7878）
 * @param {number} r 圆的半径
 * @returns {string} 如 "232.6 62.7" (dash gap)
 */
function buildRingDasharray (ratio, r) {
  const c = 2 * Math.PI * r
  const percent = Number(ratio) || 0
  if (percent <= 0) return `0 ${c.toFixed(1)}`
  const dash = Math.min(percent, 1) * c
  return `${dash.toFixed(1)} ${(c - dash).toFixed(1)}`
}

const DAY_CHART_PARAM_OPTIONS = [
  { key: 'power', label: '光伏', unit: 'kW', color: COLORS.pv },
  { key: 'grid', label: '电网', unit: 'kW', color: COLORS.cyan },
  { key: 'load', label: '负载', unit: 'kW', color: '#ff9944' }
]

const DAY_CHART_LINE = {
  type: 'line',
  smooth: true,
  symbol: 'none',
  showSymbol: false
}

const EMPTY_DIAGRAM = {
  mode: 'pvDirect',
  gridParticipating: false,
  pv: { power: 0, toLoad: 0, toGrid: 0 },
  load: { power: 0, fromPV: 0, fromGrid: 0 },
  grid: { power: 0, toLoad: 0, direction: 0 },
  battery: { power: 0, direction: 0 },
  flows: { pvToLoad: 0, pvToGrid: 0, gridToLoad: 0 },
  arrows: { pvToLoad: false, pvToGrid: false, gridToLoad: false }
}

const EMPTY_ENERGY_FLOW = {
  period: 'day',
  snapshot: { pvEnergy: 0, pvEnergyStr: 'kWh', loadEnergy: 0, loadEnergyStr: 'kWh', gridImport: 0, gridImportStr: 'kWh', gridExport: 0, gridExportStr: 'kWh', income: 0, incomeUnit: '元', fullHours: 0, fullHoursStr: 'h' },
  diagram: EMPTY_DIAGRAM,
  energies: { pvEnergy: 0, loadEnergy: 0, gridImport: 0, gridExport: 0 },
  flows: { pvToLoad: 0, pvToGrid: 0, gridToLoad: 0, batteryToLoad: 0, pvToBattery: 0, batteryToGrid: 0 },
  powers: { pv: 0, load: 0, grid: 0, battery: 0 },
  ratios: { selfUseEnergy: 0, selfUseRatio: 0, gridSellEnergy: 0, gridSellRatio: 0 },
  income: 0,
  incomeUnit: '元',
  fullHours: 0,
  fullHoursStr: 'h'
}

export default {
  name: 'Photovoltaic',
  data () {
    return {
      loading: false,
      runtimeLoading: false,
      stationDetail: {},
      stationList: [],
      currentStationId: '',
      pollTimer: null,
      isPageActive: false,
      dataReady: false,
      detailRequestSeq: 0,
      runtimeRequestSeq: 0,
      chartUpdateTimer: null,
      detailAbortController: null,
      runtimeAbortController: null,
      cachedFlowDiagram: null,
      cachedDayEnergyFlow: null,
      cachedRuntimeEnergyFlow: null,
      topologyMode: 'flow',
      runtimeType: 'day',
      pickerValue: '',
      runtimeDates: {
        day: '',
        month: '',
        year: ''
      },
      runtimeDayRecords: [],
      runtimeMonthRecords: [],
      runtimeYearRecords: [],
      gridDayRule: {},
      dayParamDialogVisible: false,
      dayChartParams: { ...DEFAULT_DAY_CHART_PARAMS },
      dayChartParamsDraft: { ...DEFAULT_DAY_CHART_PARAMS },
      donutChartInstance: null,
      trendChartInstance: null,
      resizeTimer: null,
      // EMS 真实总负载
      emsLoadPower: 0,
      emsLoadDayEnergy: 0,
      emsHourlySlots: [],
      // EMS 最新 5 分钟时隙，仅供顶部实时拓扑使用
      emsRealtimeLoadPower: 0,
      emsRealtimeLoadTime: '',
      // EMS 5 分钟粒度功率参数（替代小时级阶梯数据，仅日视图）
      emsPowerParamSlots: [],
      emsPowerParamDate: '',
      powerParamAbortController: null,
      powerParamRequestSeq: 0,
      realtimePowerAbortController: null,
      emsAbortController: null,
      // EMS overviewTrend 能耗数据（日/月/年 kWh 数组）
      emsTrendDay: [],
      emsTrendDayDate: '',
      emsTrendMonth: [],
      emsTrendYear: [],
    }
  },
  computed: {
    dayChartParamOptions () {
      return DAY_CHART_PARAM_OPTIONS
    },
    runtimePeriodKey () {
      const map = { day: 'day', month: 'month', year: 'year' }
      return map[this.runtimeType] || 'day'
    },
    flowDiagramData () {
      return this.cachedFlowDiagram || EMPTY_DIAGRAM
    },
    isEmsActive () {
      return hasRealLoadData(this.emsLoadPower)
    },
    isEmsRealtimeActive () {
      return hasRealLoadData(this.emsRealtimeLoadPower)
    },
    // EMS 日总负载 kWh：从 overviewTrend dateType=day 累加（getDailyP 是 kW 不能直接求和）
    emsDayLoadKwh () {
      if (!this.emsTrendDay || !this.emsTrendDay.length) return 0
      return this.emsTrendDay.reduce((s, v) => Number.isFinite(v) ? s + v : s, 0)
    },
    dayEnergyFlow () {
      return this.cachedDayEnergyFlow || EMPTY_ENERGY_FLOW
    },
    runtimeEnergyFlow () {
      if (this.cachedRuntimeEnergyFlow && this.cachedRuntimeEnergyFlow._periodKey === this.runtimePeriodKey) {
        return this.cachedRuntimeEnergyFlow
      }
      return mapStationToEnergyFlow(this.stationDetail, { period: this.runtimePeriodKey })
    },
    flowActive () {
      return getFlowPathVisibility(this.flowDiagramData)
    },
    gridParticipating () {
      return Boolean(this.flowDiagramData && this.flowDiagramData.gridParticipating)
    },
    isOnline () {
      const state = this.stationDetail && this.stationDetail.state
      if (state == null || state === '') return false
      return Number(state) === 1
    },
    stationDisplayName () {
      return this.pickDetailText(this.stationDetail && this.stationDetail.stationName)
    },
    stationImageUrl () {
      return STATION_IMAGE_URL
    },
    stationSno () {
      return (this.stationDetail && this.stationDetail.sno) || '--'
    },
    reportTimeText () {
      return formatDateTime(resolveStationReportTimestamp(this.stationDetail))
    },
    reportTimeRelative () {
      return formatRelativeTime(resolveStationReportTimestamp(this.stationDetail))
    },
    realtimeLoadTimeText () {
      return this.emsRealtimeLoadTime
        ? String(this.emsRealtimeLoadTime).slice(11, 16)
        : '--'
    },
    pvPowerText () {
      const unit = (this.stationDetail && this.stationDetail.powerStr) || 'kW'
      return formatPowerWithUnit(this.flowDiagramData.pv.power, unit)
    },
    gridPowerText () {
      if (!this.gridParticipating) return '--'
      const unit = (this.stationDetail && (this.stationDetail.psumStr || this.stationDetail.powerStr)) || 'kW'
      return formatPowerWithUnit(this.flowDiagramData.grid.power, unit)
    },
    gridNodeTitle () {
      if (!this.gridParticipating) return '电网'
      const direction = Number(this.flowDiagramData.grid.direction) || 0
      if (direction > 0) return '电网（买电）'
      if (direction < 0) return '电网（卖电）'
      return '电网'
    },
    gridMotionPath () {
      const direction = Number(this.flowDiagramData.grid.direction) || 0
      return direction < 0 ? '#gridExportPath' : '#gridPath'
    },
    loadPowerText () {
      const power = this.isEmsRealtimeActive ? this.emsRealtimeLoadPower : this.flowDiagramData.load.power
      return formatPowerWithUnit(power, 'kW')
    },
    pvRingDasharray () {
      return buildRingDasharray(this.stationDetail.porwerPercent, 47)
    },
    loadRingDasharray () {
      if (this.isEmsRealtimeActive) {
        const capacity = Number(this.stationDetail.capacity) || 330
        return buildRingDasharray(Math.min(this.emsRealtimeLoadPower / capacity, 1), 47)
      }
      const raw = Number(this.stationDetail.familyLoadPercent) || 0
      return buildRingDasharray(Math.min(raw / 1000, 1), 47)
    },
    gridRingDasharray () {
      if (!this.gridParticipating) return 'none'
      if (this.isEmsRealtimeActive) {
        const capacity = Number(this.stationDetail.capacity) || 330
        const pvPower = Number(this.stationDetail.power) || 0
        const gridPower = Math.abs(this.emsRealtimeLoadPower - pvPower)
        return buildRingDasharray(Math.min(gridPower / capacity, 1), 47)
      }
      const absGrid = Math.abs(Number(this.stationDetail.psum))
      const capacity = Number(this.stationDetail.capacity) || 1
      return buildRingDasharray(Math.min(absGrid / capacity, 1), 47)
    },
    pvDaySummaryText () {
      const snapshot = this.dayEnergyFlow.snapshot
      const energyText = formatEnergyWithUnit(this.dayEnergyFlow.energies.pvEnergy, snapshot.pvEnergyStr)
      const incomeText = formatMoney(this.dayEnergyFlow.income, this.dayEnergyFlow.incomeUnit)
      return `${energyText} ≈ ${incomeText}`
    },
    gridBuyDayText () {
      if (this.isEmsActive) {
        // 推算：总负载 - 光伏 = 买电
        const pvDayKwh = this.dayEnergyFlow.energies.pvEnergy
        const buyKwh = Math.max(this.emsDayLoadKwh - pvDayKwh, 0)
        return formatEnergyWithUnit(buyKwh / 1000, 'MWh')
      }
      // 锦浪兜底（gridPurchasedDayEnergy 恒为 0，无真实电网数据）
      const snapshot = this.dayEnergyFlow.snapshot
      return formatEnergyWithUnit(this.dayEnergyFlow.energies.gridImport, snapshot.gridImportStr)
    },
    gridSellDayText () {
      if (this.isEmsActive) {
        // 推算：光伏 > 总负载时才有卖电，当前场景几乎不可能
        const pvDayKwh = this.dayEnergyFlow.energies.pvEnergy
        const sellKwh = Math.max(pvDayKwh - this.emsDayLoadKwh, 0)
        return formatEnergyWithUnit(sellKwh / 1000, 'MWh')
      }
      // 锦浪兜底（gridSellDayEnergy 恒为 0）
      const snapshot = this.dayEnergyFlow.snapshot
      const energyText = formatEnergyWithUnit(this.dayEnergyFlow.energies.gridExport, snapshot.gridExportStr)
      const sellIncome = this.dayEnergyFlow.energies.gridExport * Number((this.stationDetail && this.stationDetail.price) || 0)
      return `${energyText} ≈ ${formatMoney(sellIncome)}`
    },
    loadDayText () {
      if (this.isEmsActive) {
        return formatEnergyWithUnit(this.emsDayLoadKwh / 1000, 'MWh')
      }
      // 锦浪兜底（familyLoadPower 恒等于 power，自洽假数据）
      const snapshot = this.dayEnergyFlow.snapshot
      return formatEnergyWithUnit(this.dayEnergyFlow.energies.loadEnergy, snapshot.loadEnergyStr)
    },
    topologyTableData () {
      const station = this.stationDetail || {}

      const buildRow = (name, powerValue, powerUnit, period) => {
        // 获取该周期 EMS 总负载 kWh
        const getEmsLoadForPeriod = () => {
          if (period === 'day') return this.emsDayLoadKwh
          if (period === 'month' || period === 'year' || period === 'total') {
            const arr = period === 'month' ? this.emsTrendMonth : this.emsTrendYear
            if (!arr || !arr.length) return 0
            return arr.reduce((s, v) => Number.isFinite(v) ? s + v : s, 0)
          }
          return 0
        }
        const emsLoadKwh = this.isEmsActive ? getEmsLoadForPeriod() : 0

        if (emsLoadKwh > 0) {
          const snapshot = getPeriodSnapshot(station, period)
          const pvKwh = snapshot.pvEnergy
          const buyKwh = Math.max(emsLoadKwh - pvKwh, 0)
          const sellKwh = Math.max(pvKwh - emsLoadKwh, 0)
          if (name === 'PV') {
            const incomeStr = formatMoney(station.price ? pvKwh * Number(station.price) : 0)
            return `${formatEnergyWithUnit(pvKwh / 1000, 'MWh')}≈${incomeStr}`
          } else if (name === '买电') {
            return formatEnergyWithUnit(buyKwh / 1000, 'MWh')
          } else if (name === '卖电') {
            return formatEnergyWithUnit(sellKwh / 1000, 'MWh')
          } else {
            return formatEnergyWithUnit(emsLoadKwh / 1000, 'MWh')
          }
        }

        // 锦浪兜底（getPeriodSnapshot 已归一化为 kWh，用 formatRuntimeEnergyValue 智能选 MWh/kWh）
        const snapshot = getPeriodSnapshot(station, period)
        const flow = mapStationToEnergyFlow(station, { period })
        const pvDisplay = formatRuntimeEnergyValue(snapshot.pvEnergy)
        const pvValue = pvDisplay.unit === 'MWh' ? snapshot.pvEnergy / 1000 : snapshot.pvEnergy
        const loadDisplay = formatRuntimeEnergyValue(snapshot.loadEnergy)
        const loadValue = loadDisplay.unit === 'MWh' ? snapshot.loadEnergy / 1000 : snapshot.loadEnergy
        const gridImportDisplay = formatRuntimeEnergyValue(snapshot.gridImport)
        const gridImportValue = gridImportDisplay.unit === 'MWh' ? snapshot.gridImport / 1000 : snapshot.gridImport
        const gridExportDisplay = formatRuntimeEnergyValue(snapshot.gridExport)
        const gridExportValue = gridExportDisplay.unit === 'MWh' ? snapshot.gridExport / 1000 : snapshot.gridExport
        if (name === 'PV') {
          return `${formatEnergyWithUnit(pvValue, pvDisplay.unit)}≈${formatMoney(flow.income, flow.incomeUnit)}`
        } else if (name === '买电') {
          return formatEnergyWithUnit(gridImportValue, gridImportDisplay.unit)
        } else if (name === '卖电') {
          return `${formatEnergyWithUnit(gridExportValue, gridExportDisplay.unit)}≈${formatMoney(flow.energies.gridExport * Number(station.price || 0))}`
        } else {
          return formatEnergyWithUnit(loadValue, loadDisplay.unit)
        }
      }

      const powerMap = this.isEmsRealtimeActive
        ? {
          PV: { value: station.power, unit: station.powerStr || 'kW' },
          买电: { value: Math.max(this.emsRealtimeLoadPower - Number(station.power || 0), 0), unit: 'kW' },
          卖电: { value: Math.max(Number(station.power || 0) - this.emsRealtimeLoadPower, 0), unit: 'kW' },
          负载: { value: this.emsRealtimeLoadPower, unit: 'kW' }
        }
        : {
          // 锦浪兜底：psum 恒为 0，familyLoadPower 恒等于 power
          PV: { value: station.power, unit: station.powerStr || 'kW' },
          买电: { value: Math.max(station.psum || 0, 0), unit: station.psumStr || 'kW' },
          卖电: { value: Math.max(-(station.psum || 0), 0), unit: station.psumStr || 'kW' },
          负载: { value: station.familyLoadPower, unit: station.familyLoadPowerStr || 'kW' }
        }
      return ['PV', '买电', '卖电', '负载'].map(name => ({
        name,
        power: formatPowerWithUnit(powerMap[name].value, powerMap[name].unit),
        day: buildRow(name, powerMap[name].value, powerMap[name].unit, 'day'),
        month: buildRow(name, powerMap[name].value, powerMap[name].unit, 'month'),
        year: buildRow(name, powerMap[name].value, powerMap[name].unit, 'year'),
        total: buildRow(name, powerMap[name].value, powerMap[name].unit, 'total')
      }))
    },
    weatherCityText () {
      return this.pickDetailText(this.stationDetail && this.stationDetail.cityStr)
    },
    weatherUpdateText () {
      return (this.stationDetail && this.stationDetail.weatherUpdateDateStr) || '--'
    },
    weatherItems () {
      const station = this.stationDetail || {}
      const tmpUnit = station.tmpUnit || '℃'
      const tmpMin = station.tmpMin
      const tmpMax = station.tmpMax
      let temperatureText = '--'
      if (tmpMin != null && tmpMin !== '' && tmpMax != null && tmpMax !== '') {
        temperatureText = `${tmpMin}${tmpUnit}~${tmpMax}${tmpUnit}`
      } else if (tmpMin != null && tmpMin !== '') {
        temperatureText = `${tmpMin}${tmpUnit}`
      } else if (tmpMax != null && tmpMax !== '') {
        temperatureText = `${tmpMax}${tmpUnit}`
      }

      return [
        { label: '天气', value: this.formatDetailRange(station.condTxtD, station.condTxtN), icon: 'el-icon-sunny' },
        { label: '日出日落', value: this.formatDetailRange(station.sr, station.ss), icon: 'el-icon-sunrise' },
        { label: '温度', value: temperatureText, icon: 'el-icon-odometer' },
        { label: '湿度', value: this.pickDetailText(station.hum), icon: 'el-icon-heavy-rain' },
        { label: '风向', value: this.pickDetailText(station.windDir), icon: 'el-icon-position' },
        { label: '风速', value: this.pickDetailText(station.windSpd), icon: 'el-icon-wind-power' }
      ]
    },
    stationStateText () {
      const state = this.stationDetail && this.stationDetail.state
      if (state == null || state === '') return '--'
      return Number(state) === 1 ? '在线' : '离线'
    },
    capacityText () {
      const station = this.stationDetail || {}
      if (station.capacity == null || station.capacity === '') return '--'
      return formatEnergyWithUnit(station.capacity, station.capacityStr || 'kWp', 2)
    },
    ownerText () {
      return (this.stationDetail && this.stationDetail.mobile)
        ? `${String(this.stationDetail.mobile).slice(0, 1)}**`
        : '--'
    },
    stationAddressText () {
      const station = this.stationDetail || {}
      return [station.regionStr, station.cityStr, station.countyStr, station.addr].filter(Boolean).join(',') || '--'
    },
    emissionItems () {
      const station = this.stationDetail || {}
      const treeValue = station.powerStationNumTree
      const treeUnit = station.powerStationNumTreeUnit || '棵'
      let treeText = '--'
      if (treeValue != null && treeValue !== '') {
        treeText = `${Number(treeValue).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}${treeUnit}`
      }

      return [
        { label: '等效绿植', value: treeText, icon: 'el-icon-grape' },
        { label: 'CO2减排', value: this.formatDetailWeight(station.powerStationAvoidedCo2), icon: 'el-icon-cloudy' },
        { label: '节约标准煤', value: this.formatDetailWeight(station.powerStationAvoidedTce), icon: 'el-icon-box' }
      ]
    },
    inverterOnlineText () {
      return resolveInverterOnlineStatus(this.stationDetail).text
    },
    basicInfoItems () {
      const station = this.stationDetail || {}
      return [
        { label: '电站名称', value: this.pickDetailText(station.stationName) },
        { label: '电站类型', value: this.pickDetailText(station.stationTypeStr || station.typeStr || station.stationTypeName) },
        { label: '组件总容量', value: this.capacityText },
        { label: '组件块数', value: this.pickDetailText(station.module) },
        { label: '每块组件容量', value: this.pickDetailText(station.moduleCapacity || station.perModuleCapacity) },
        { label: '组织编码', value: this.pickDetailText(station.orgCode) },
        { label: '接入平台时间', value: this.pickDetailText(station.fisPowerTimeStr) },
        { label: '并网时间', value: this.pickDetailText(station.fisGenerateTimeStr) },
        { label: '电站创建时间', value: this.pickDetailText(station.createDateStr) },
        { label: '电站地址', value: this.stationAddressText },
        { label: '逆变器在线', value: this.inverterOnlineText }
      ]
    },
    selectedMonthDays () {
      const parts = String(this.runtimeDates.month || '').split('-').map(Number)
      const year = parts[0]
      const month = parts[1]
      if (!year || !month) return 30
      return new Date(year, month, 0).getDate()
    },
    activeRuntime () {
      const prefixMap = { day: '日', month: '月', year: '年' }
      const labelPrefix = prefixMap[this.runtimeType] || '日'

      if (this.runtimeType === 'month') {
        const snapshot = getPeriodSnapshot(this.stationDetail, 'month')
        const summary = summarizeMonthRuntimeRecords(this.runtimeMonthRecords)
        const emsLoadKwh = this.isEmsActive
          ? (this.emsTrendMonth || []).reduce((s, v) => Number.isFinite(v) ? s + v : s, 0)
          : 0
        return this.buildSnapshotPeriodRuntime('月', snapshot, {
          chart: mapMonthRuntimeRecordsToFullMonth(this.runtimeMonthRecords, { daysInMonth: this.selectedMonthDays })
        }, this.runtimeDates.month, summary, emsLoadKwh)
      }

      if (this.runtimeType === 'year') {
        const snapshot = getPeriodSnapshot(this.stationDetail, 'year')
        const summary = summarizeMonthRuntimeRecords(this.runtimeYearRecords)
        const emsLoadKwh = this.isEmsActive
          ? (this.emsTrendYear || []).reduce((s, v) => Number.isFinite(v) ? s + v : s, 0)
          : 0
        return this.buildSnapshotPeriodRuntime('年', snapshot, {
          chart: mapYearRuntimeRecordsToFullYear(this.runtimeYearRecords, { monthsInYear: 12 })
        }, this.runtimeDates.year, summary, emsLoadKwh)
      }

      const dayRecord = findMonthRecordByDay(this.runtimeMonthRecords, this.runtimeDates.day)
      let daySlots = mapDayRuntimeRecordsToFullDay(this.runtimeDayRecords)
      // 日视图负载仅使用 5 分钟粒度功率参数
      daySlots = mergeEmsLoadIntoDaySlots(daySlots, this.emsPowerParamSlots)
      daySlots = markCurrentDaySlotCollecting(daySlots, {
        date: this.runtimeDates.day
      })
      if (hasRuntimeDayRecordData(dayRecord)) {
        const daySummary = summarizeDayRuntimeRecord(dayRecord)
        const result = this.buildMockPeriodRuntime('日', daySummary, {
          chart: daySlots
        }, this.runtimeDates.day, dayRecord)
        // EMS 注入：覆盖买电量 = 总负载 - 光伏
        if (this.isEmsActive) {
          const buyKwh = Math.max(this.emsDayLoadKwh - daySummary.pvEnergyKwh, 0)
          const buyDisplay = formatRuntimeEnergyValue(buyKwh)
          result.buy = formatEnergyWithUnit(buyDisplay.value, buyDisplay.unit)
        }
        return result
      }

      return this.buildEmptyPeriodRuntime('日', daySlots)
    },
    pickerFormat () {
      if (this.runtimeType === 'year') return 'yyyy'
      if (this.runtimeType === 'month') return 'yyyy-MM'
      return 'yyyy-MM-dd'
    }
  },
  watch: {
    runtimeType () {
      this.handleRuntimeChange()
      this._refreshRuntimeFlowCache()
      this.loadRuntimeData()
    },
    dayChartParams: {
      deep: true,
      handler () {
        this.scheduleChartUpdate()
      }
    }
  },
  created () {
    this.resetRuntimeDatesToToday()
  },
  mounted () {
    this.isPageActive = true
    window.addEventListener('resize', this.handleResize)
    this._bootPage()
  },
  activated () {
    if (this.isPageActive) return
    this.isPageActive = true
    // 已有数据时只恢复轮询，不再全量重拉（避免 429）
    if (this.dataReady) {
      this._refreshFlowCache()
      this.startPolling()
      this.scheduleChartUpdate()
    } else {
      this._bootPage()
    }
  },
  deactivated () {
    this.teardownPage()
  },
  beforeRouteLeave (to, from, next) {
    this.teardownPage()
    next()
  },
  beforeDestroy () {
    this.teardownPage()
    window.removeEventListener('resize', this.handleResize)
    if (this.chartUpdateTimer) clearTimeout(this.chartUpdateTimer)
    if (this.donutChartInstance) this.donutChartInstance.dispose()
    if (this.trendChartInstance) this.trendChartInstance.dispose()
    if (this.resizeTimer) clearTimeout(this.resizeTimer)
    this.donutChartInstance = null
    this.trendChartInstance = null
  },
  methods: {
    _refreshFlowCache () {
      const station = this.stationDetail
      if (this.isEmsRealtimeActive) {
        this.cachedFlowDiagram = computeEnergyFlowWithRealLoad(station, this.emsRealtimeLoadPower)
      } else {
        this.cachedFlowDiagram = computeEnergyFlowDiagram(station)
      }
      this.cachedDayEnergyFlow = mapStationToEnergyFlow(station, { period: 'day' })
      this.cachedRuntimeEnergyFlow = mapStationToEnergyFlow(station, { period: this.runtimePeriodKey })
      this.cachedRuntimeEnergyFlow._periodKey = this.runtimePeriodKey
    },
    _refreshRuntimeFlowCache () {
      this.cachedRuntimeEnergyFlow = mapStationToEnergyFlow(this.stationDetail, { period: this.runtimePeriodKey })
      this.cachedRuntimeEnergyFlow._periodKey = this.runtimePeriodKey
    },
    _abortDetailRequest () {
      if (this._detailAbortController) {
        this._detailAbortController.abort()
        this._detailAbortController = null
      }
    },
    _abortRuntimeRequest () {
      if (this.runtimeAbortController) {
        this.runtimeAbortController.abort()
        this.runtimeAbortController = null
      }
    },
    _abortEmsRequest () {
      if (this.emsAbortController) {
        this.emsAbortController.abort()
        this.emsAbortController = null
      }
    },
    _abortRealtimePowerRequest () {
      if (this.realtimePowerAbortController) {
        this.realtimePowerAbortController.abort()
        this.realtimePowerAbortController = null
      }
    },
    teardownPage () {
      this.isPageActive = false
      this.dataReady = false
      this.detailRequestSeq += 1
      this.runtimeRequestSeq += 1
      this.stopPolling()
      this._abortDetailRequest()
      this._abortRuntimeRequest()
      this._abortEmsRequest()
      this._abortPowerParamRequest()
      this._abortRealtimePowerRequest()
      this.clearChartUpdateTimer()
      this.loading = false
      this.runtimeLoading = false
      this.emsPowerParamSlots = []
      this.emsPowerParamDate = ''
      this.emsTrendDayDate = ''
    },
    clearChartUpdateTimer () {
      if (this.chartUpdateTimer) {
        clearTimeout(this.chartUpdateTimer)
        this.chartUpdateTimer = null
      }
    },
    scheduleChartUpdate () {
      if (!this.isPageActive || !this.dataReady) return
      this.clearChartUpdateTimer()
      this.chartUpdateTimer = setTimeout(() => {
        this.chartUpdateTimer = null
        if (!this.isPageActive || !this.dataReady) return
        this.updateDonutChart()
        this.updateTrendChart()
      }, 80)
    },
    beginRuntimeLoading () {
      this.runtimeLoading = true
    },
    endRuntimeLoading () {
      this.runtimeLoading = false
    },
    async _bootPage () {
      if (!this.isPageActive) return
      this.loading = true
      this.beginRuntimeLoading()
      try {
        this.loadStationList()
        // 锦浪 API 限速由 _paceApiCall 保障，EMS 为独立后端不受限
        await this.loadStationDetail(true)
        if (!this.isPageActive) return
        await Promise.all([
          this.loadRuntimeData(true),
          this.fetchEmsLoadData(true)
        ])
        if (!this.isPageActive) return
        this.startPolling()
        await this.$nextTick()
        if (!this.isPageActive) return
        this.initDonutChart()
        this.initTrendChart()
      } finally {
        if (this.isPageActive) {
          this.endRuntimeLoading()
          this.loading = false
        }
      }
    },
    startPolling () {
      this.stopPolling()
      if (!this.isPageActive) return
      this.pollTimer = setInterval(() => {
        if (!this.isPageActive) return
        this.loadStationDetail(true)
        this.fetchEmsLoadData(true)
        this.fetchLatestEmsLoadPower(true)
      }, POLL_INTERVAL)
    },
    stopPolling () {
      if (this.pollTimer) {
        clearInterval(this.pollTimer)
        this.pollTimer = null
      }
    },
    loadStationList () {
      const routeId = this.$route && this.$route.query && this.$route.query.stationId
      if (routeId) this.currentStationId = String(routeId)
    },
    normalizeStationDetail (data) {
      const peeled = peelPhotovoltaicPayload(data)
      if (!peeled || typeof peeled !== 'object' || Array.isArray(peeled)) return null
      if (peeled.stationDetail && typeof peeled.stationDetail === 'object') {
        return peeled.stationDetail
      }
      return peeled.id || peeled.stationName ? peeled : null
    },
    syncStationListFromDetail (detail) {
      if (!detail || !detail.id) {
        this.stationList = []
        return
      }
      this.currentStationId = String(detail.id)
      this.stationList = [{
        id: detail.id,
        stationName: detail.stationName,
        sno: detail.sno,
        state: detail.state,
        inverterCount: detail.inverterCount,
        inverterOnlineCount: detail.inverterOnlineCount
      }]
    },
    pickDetailText (value) {
      if (value === null || value === undefined || value === '') return '--'
      return String(value)
    },
    formatDetailRange (left, right, separator = '~') {
      const leftText = this.pickDetailText(left)
      const rightText = this.pickDetailText(right)
      if (leftText === '--' && rightText === '--') return '--'
      if (leftText === '--') return rightText
      if (rightText === '--') return leftText
      return `${leftText}${separator}${rightText}`
    },
    formatDetailWeight (value) {
      if (value === null || value === undefined || value === '') return '--'
      return this.formatWeight(value)
    },
    resetRuntimeDatesToToday () {
      const now = new Date()
      this.runtimeDates = {
        day: this.formatDate(now, 'day'),
        month: this.formatDate(now, 'month'),
        year: this.formatDate(now, 'year')
      }
      this.pickerValue = this.runtimeDates[this.runtimeType]
    },
    getStationRequestParams () {
      const params = {}
      if (this.currentStationId) params.stationId = this.currentStationId
      const timeZone = this.stationDetail && this.stationDetail.timeZone
      if (timeZone != null && timeZone !== '') params.timeZone = Number(timeZone)
      return params
    },
    normalizeRuntimeRecords (data) {
      const peeled = peelPhotovoltaicPayload(data)
      if (Array.isArray(peeled)) return peeled
      if (peeled && Array.isArray(peeled.records)) return peeled.records
      if (peeled && Array.isArray(peeled.list)) return peeled.list
      return []
    },
    async loadStationDetail (silent = false) {
      if (!this.isPageActive) return
      if (!silent) this.loading = true
      const requestSeq = ++this.detailRequestSeq
      this._abortDetailRequest()
      const controller = new AbortController()
      this._detailAbortController = controller
      try {
        await _paceApiCall()
        const data = await fetchStationDetail(this.getStationRequestParams(), controller.signal)
        _markApiCall()
        if (!this.isPageActive || requestSeq !== this.detailRequestSeq) return
        const detail = this.normalizeStationDetail(data)
        if (detail) {
          this.stationDetail = detail
          this.syncStationListFromDetail(detail)
          this._refreshFlowCache()
          if (!this.dataReady) this.dataReady = true
        }
      } catch (error) {
        if (error && error.name === 'AbortError') return
        if (!this.isPageActive || requestSeq !== this.detailRequestSeq) return
        if (!silent) this.$apiError.notify(error, '加载电站详情失败')
      } finally {
        if (this._detailAbortController === controller) {
          this._detailAbortController = null
        }
        if (this.isPageActive && requestSeq === this.detailRequestSeq && !silent) {
          this.loading = false
        }
      }
    },
    async fetchEmsLoadData (silent = false) {
      if (!this.isPageActive) return
      this._abortEmsRequest()
      const controller = new AbortController()
      this.emsAbortController = controller
      try {
        const data = await fetchDailyLoadPower(EMS_AREA_ID, controller.signal)
        if (!this.isPageActive) return
        if (data && data.todayData) {
          this.emsLoadPower = extractCurrentLoadPower(data.todayData)
          this.emsHourlySlots = expandHourlyToMinuteSlots(data.todayData, 12)
          // 当日累计负载电量：todayData 每小时 kW 求和 = 日 kWh
          this.emsLoadDayEnergy = data.todayData.reduce((sum, v) => {
            const val = parseFloat(v)
            return Number.isFinite(val) ? sum + val : sum
          }, 0)
          if (this.isEmsActive) {
            this._refreshFlowCache()
            // 日视图由 loadRuntimeData 统一控制图表渲染时机，避免功率参数未就绪时
            // fetchEmsLoadData 抢先以小时级数据渲染
            if (this.runtimeType !== 'day') {
              this.scheduleChartUpdate()
            }
          }
        }
        // 拉取 EMS 能耗趋势（日/月/年 kWh）用于能量平衡
        if (this.isPageActive && !controller.signal.aborted) {
          const nowStr = _emsNowTime()
          const trendTypes = ['day', 'month', 'year']
          for (const dt of trendTypes) {
            await _paceApiCall()
            try {
              const trendData = await fetchOverviewTrend(EMS_AREA_ID, dt, nowStr, controller.signal)
              _markApiCall()
              if (Array.isArray(trendData)) {
                const key = dt === 'day' ? 'emsTrendDay' : dt === 'month' ? 'emsTrendMonth' : 'emsTrendYear'
                const normalizedTrend = normalizeTrendValues(trendData)
                if (dt === 'day') {
                  const trendDayDate = nowStr.slice(0, 10)
                  this.emsTrendDay = this.emsTrendDayDate === trendDayDate
                    ? mergeMonotonicSlotValues(this.emsTrendDay, normalizedTrend)
                    : normalizedTrend
                  this.emsTrendDayDate = trendDayDate
                } else {
                  this[key] = normalizedTrend
                }
              }
            } catch (e) {
              if (e && e.name === 'AbortError') return
              // 单个 trend 失败不影响其他
            }
          }
        }
      } catch (error) {
        if (error && error.name === 'AbortError') return
        if (!this.isPageActive) return
        if (!silent) this.$apiError.notify(error, '加载总负载数据失败')
      } finally {
        if (this.emsAbortController === controller) {
          this.emsAbortController = null
        }
      }
    },
    applyLatestEmsLoad (latestLoad, stableSlotPower = null) {
      if (!latestLoad) return
      const incomingTime = new Date(String(latestLoad.time).replace(' ', 'T')).getTime()
      const currentTime = new Date(String(this.emsRealtimeLoadTime).replace(' ', 'T')).getTime()
      const incomingPower = Number(latestLoad.power)
      const stablePower = Number(stableSlotPower)
      if (!Number.isFinite(incomingTime) || !Number.isFinite(incomingPower)) return
      if (Number.isFinite(currentTime) && incomingTime < currentTime) return

      const nextPower = Number.isFinite(stablePower)
        ? Math.max(incomingPower, stablePower)
        : incomingPower
      this.emsRealtimeLoadPower = Number.isFinite(currentTime) && incomingTime === currentTime
        ? Math.max(Number(this.emsRealtimeLoadPower) || 0, nextPower)
        : nextPower
      this.emsRealtimeLoadTime = latestLoad.time
      this._refreshFlowCache()
    },
    async fetchPowerParamForDay (date, silent = false) {
      if (!this.isPageActive || !date) return
      this._abortPowerParamRequest()
      const isSamePowerParamDate = this.emsPowerParamDate === date
      if (!isSamePowerParamDate) {
        this.emsPowerParamSlots = []
        this.emsPowerParamDate = date
      }
      const requestSeq = ++this.powerParamRequestSeq
      const controller = new AbortController()
      this.powerParamAbortController = controller
      try {
        const records = await fetchPowerParam(EMS_AREA_ID, `${date} 00:00:00`, `${date} 23:59:59`, controller.signal)
        if (!this.isPageActive || requestSeq !== this.powerParamRequestSeq) return
        if (Array.isArray(records) && records.length) {
          const today = this.formatDate(new Date(), 'day')
          const completedBefore = date === today
            ? new Date(Date.now() - EMS_SETTLE_DELAY_MS)
            : null
          const fullDaySlots = mapPowerParamToDaySlots(records, { completedBefore })
          this.emsPowerParamSlots = isSamePowerParamDate
            ? mergeMonotonicSlotValues(this.emsPowerParamSlots, fullDaySlots)
            : fullDaySlots
          this.emsPowerParamDate = date
          if (date === today) {
            const latestLoad = resolveLatestPowerParamLoad(records, {
              completedBefore
            })
            if (latestLoad) {
              this.applyLatestEmsLoad(
                latestLoad,
                this.emsPowerParamSlots[latestLoad.slotIndex]
              )
            }
          }
        }
      } catch (error) {
        if (error && error.name === 'AbortError') return
        if (!this.isPageActive || requestSeq !== this.powerParamRequestSeq) return
        if (!silent) this.$apiError.notify(error, '加载实时功率参数失败')
      } finally {
        if (this.powerParamAbortController === controller) {
          this.powerParamAbortController = null
        }
      }
    },
    _abortPowerParamRequest () {
      if (this.powerParamAbortController) {
        this.powerParamAbortController.abort()
        this.powerParamAbortController = null
      }
    },
    async fetchLatestEmsLoadPower (silent = true) {
      if (!this.isPageActive) return
      this._abortRealtimePowerRequest()
      const controller = new AbortController()
      this.realtimePowerAbortController = controller
      const endTime = new Date()
      const completedBefore = new Date(endTime.getTime() - EMS_SETTLE_DELAY_MS)
      const startTime = new Date(endTime.getTime() - EMS_RECENT_WINDOW_MS)
      try {
        const records = await fetchPowerParam(
          EMS_AREA_ID,
          this.formatDateTimeStr(startTime),
          this.formatDateTimeStr(endTime),
          controller.signal
        )
        if (!this.isPageActive || controller.signal.aborted) return
        const today = this.formatDate(endTime, 'day')
        const todayRecords = Array.isArray(records)
          ? records.filter(record => String(record && record.ts).startsWith(today))
          : []
        const latestLoad = resolveLatestPowerParamLoad(records, {
          completedBefore
        })
        let stableLatestPower = null
        if (this.runtimeType === 'day' && this.runtimeDates.day === today) {
          const recentSlots = mapPowerParamToDaySlots(todayRecords, {
            completedBefore
          })
          const currentSlots = this.emsPowerParamDate === today
            ? this.emsPowerParamSlots
            : []
          const nextSlots = mergeMonotonicSlotValues(currentSlots, recentSlots)
          this.emsPowerParamSlots = nextSlots
          this.emsPowerParamDate = today
          stableLatestPower = latestLoad ? nextSlots[latestLoad.slotIndex] : null
          await this.$nextTick()
          if (this.isPageActive && this.runtimeType === 'day' && this.runtimeDates.day === today) {
            this.updateTrendChart()
          }
        }
        if (latestLoad) {
          this.applyLatestEmsLoad(latestLoad, stableLatestPower)
        }
      } catch (error) {
        if (error && error.name === 'AbortError') return
        if (!this.isPageActive) return
        if (!silent) this.$apiError.notify(error, '加载实时负载功率失败')
      } finally {
        if (this.realtimePowerAbortController === controller) {
          this.realtimePowerAbortController = null
        }
      }
    },
    async loadRuntimeData (silent = false) {
      if (!this.isPageActive) return
      const type = this.runtimeType
      const timeKey = this.runtimeDates[type]
      if (!timeKey) return

      const requestSeq = ++this.runtimeRequestSeq
      if (!silent) this.beginRuntimeLoading()
      this._abortRuntimeRequest()
      const controller = new AbortController()
      this.runtimeAbortController = controller
      const signal = controller.signal
      let powerParamPromise = null
      try {
        const params = this.getStationRequestParams()
        if (type === 'day') {
          const monthKey = timeKey.slice(0, 7)
          powerParamPromise = this.fetchPowerParamForDay(timeKey, silent)
          await _paceApiCall()
          const dayData = await fetchStationDayRuntime(timeKey, params, signal)
          _markApiCall()
          if (!this.isPageActive || requestSeq !== this.runtimeRequestSeq) return
          this.runtimeDayRecords = this.normalizeRuntimeRecords(dayData)
          await _paceApiCall()
          const monthData = await fetchStationMonthRuntime(monthKey, params, signal)
          _markApiCall()
          if (!this.isPageActive || requestSeq !== this.runtimeRequestSeq) return
          this.runtimeMonthRecords = this.normalizeRuntimeRecords(monthData)
        } else if (type === 'month') {
          await _paceApiCall()
          const data = await fetchStationMonthRuntime(timeKey, params, signal)
          _markApiCall()
          if (!this.isPageActive || requestSeq !== this.runtimeRequestSeq) return
          this.runtimeMonthRecords = this.normalizeRuntimeRecords(data)
        } else if (type === 'year') {
          await _paceApiCall()
          const data = await fetchStationYearRuntime(timeKey, params, signal)
          _markApiCall()
          if (!this.isPageActive || requestSeq !== this.runtimeRequestSeq) return
          this.runtimeYearRecords = this.normalizeRuntimeRecords(data)
        }
        // 等待功率参数到位后再渲染图表（保证 loading 状态下数据完整）
        if (powerParamPromise) {
          await powerParamPromise
        }
        if (this.isPageActive && requestSeq === this.runtimeRequestSeq) {
          await this.$nextTick()
          if (this.isPageActive && requestSeq === this.runtimeRequestSeq) {
            this.updateDonutChart()
            this.updateTrendChart()
          }
        }
      } catch (error) {
        if (error && error.name === 'AbortError') return
        if (!this.isPageActive || requestSeq !== this.runtimeRequestSeq) return
        if (!silent) this.$apiError.notify(error, '加载运行数据失败')
      } finally {
        if (this.runtimeAbortController === controller) {
          this.runtimeAbortController = null
        }
        if (this.isPageActive && requestSeq === this.runtimeRequestSeq && !silent) {
          this.endRuntimeLoading()
        }
      }
    },
    async refreshCharts () {
      this.loading = true
      try {
        await Promise.all([
          this.loadStationDetail(true),
          this.loadRuntimeData(true)
        ])
      } finally {
        this.loading = false
      }
    },
    toggleTopologyMode () {
      this.topologyMode = this.topologyMode === 'flow' ? 'table' : 'flow'
    },
    handleRuntimeChange () {
      this.pickerValue = this.runtimeDates[this.runtimeType]
    },
    handlePickerChange (value) {
      this.runtimeDates[this.runtimeType] = value
      this.pickerValue = value
      this.loadRuntimeData()
    },
    shiftRuntimeDate (step) {
      const current = this.runtimeDates[this.runtimeType]
      let next = current
      if (this.runtimeType === 'day') {
        const date = new Date(`${current}T00:00:00`)
        date.setDate(date.getDate() + step)
        next = this.formatDate(date, 'day')
      } else if (this.runtimeType === 'month') {
        const date = new Date(`${current}-01T00:00:00`)
        date.setMonth(date.getMonth() + step)
        next = this.formatDate(date, 'month')
      } else if (this.runtimeType === 'year') {
        next = String(Number(current) + step)
      }
      this.runtimeDates[this.runtimeType] = next
      this.pickerValue = next
      this.loadRuntimeData()
    },
    formatDate (date, type) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      if (type === 'year') return String(year)
      if (type === 'month') return `${year}-${month}`
      return `${year}-${month}-${day}`
    },
    formatDateTimeStr (date) {
      const pad = n => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    },
    initDonutChart () {
      if (!this.$refs.donutChart) return
      if (this.donutChartInstance) this.donutChartInstance.dispose()
      this.donutChartInstance = this.$echarts.init(this.$refs.donutChart)
      this.updateDonutChart()
    },
    initTrendChart () {
      if (!this.$refs.trendChart) return
      if (this.trendChartInstance) this.trendChartInstance.dispose()
      this.trendChartInstance = this.$echarts.init(this.$refs.trendChart)
      this.updateTrendChart()
    },
    updateDonutChart () {
      if (!this.donutChartInstance || !this.isPageActive) return
      const data = this.activeRuntime
      const selfUseValue = Math.max(data.selfUseRatio || 0, 0)
      const gridSellValue = Math.max(data.gridSellRatio || 0, 0)
      const emptySlice = selfUseValue <= 0 && gridSellValue <= 0
      this.donutChartInstance.setOption({
        tooltip: { trigger: 'item', formatter: '{b}：{d}%' },
        title: {
          text: data.donutCenter[0],
          subtext: data.donutCenter[1],
          left: 'center',
          top: '38%',
          textStyle: { color: '#666', fontSize: 13, fontWeight: 400 },
          subtextStyle: { color: '#666', fontSize: 13 }
        },
        series: [{
          type: 'pie',
          radius: ['68%', '82%'],
          center: ['50%', '50%'],
          label: { show: false },
          labelLine: { show: false },
          data: emptySlice
            ? [{ name: '暂无数据', value: 1, itemStyle: { color: '#e5e9f2' } }]
            : [
              { name: `${data.labelPrefix}自用`, value: selfUseValue, itemStyle: { color: COLORS.orange } },
              { name: `${data.labelPrefix}并网`, value: gridSellValue, itemStyle: { color: COLORS.red } }
            ]
        }]
      })
    },
    updateTrendChart () {
      if (!this.trendChartInstance || !this.isPageActive) return
      let option = this.getDayChartOption()
      if (this.runtimeType === 'month') option = this.getMonthChartOption()
      if (this.runtimeType === 'year') option = this.getYearChartOption()
      this.trendChartInstance.setOption(option, { notMerge: true, lazyUpdate: false })
    },
    buildEmptyPeriodRuntime (labelPrefix, chart = []) {
      return {
        dateLabel: '',
        labelPrefix,
        chart,
        generation: '--',
        buy: '--',
        selfUse: '--',
        gridSell: '--',
        income: '--',
        fullHours: '--',
        donutCenter: ['光伏发电', '--'],
        selfUseRatio: 0,
        gridSellRatio: 0,
        hasData: false
      }
    },
    buildMockPeriodRuntime (labelPrefix, summary, mockEntry, dateLabel, sourceRecord = null) {
      const pvDisplay = formatRuntimeEnergyValue(summary.pvEnergyKwh)
      const selfUseValue = pvDisplay.unit === 'MWh' ? summary.selfUseEnergyKwh / 1000 : summary.selfUseEnergyKwh
      const gridSellValue = pvDisplay.unit === 'MWh' ? summary.gridSellEnergyKwh / 1000 : summary.gridSellEnergyKwh
      const buyDisplay = formatRuntimeEnergyValue(summary.gridImportKwh)
      const buyValue = buyDisplay.unit === 'MWh' ? summary.gridImportKwh / 1000 : summary.gridImportKwh
      const selfRatio = summary.selfUseRatio.toFixed(1)
      const sellRatio = summary.gridSellRatio.toFixed(1)

      const generation = sourceRecord
        ? formatRecordEnergyAmount(sourceRecord, 'energy')
        : formatEnergyWithUnit(pvDisplay.unit === 'MWh' ? summary.pvEnergyKwh / 1000 : summary.pvEnergyKwh, pvDisplay.unit)
      const buy = sourceRecord
        ? formatRecordEnergyAmount(sourceRecord, 'gridPurchasedEnergy')
        : formatEnergyWithUnit(buyValue, buyDisplay.unit)
      const selfUseEnergy = sourceRecord
        ? formatRecordEnergyAmount(sourceRecord, 'oneSelf')
        : formatEnergyWithUnit(selfUseValue, pvDisplay.unit)
      const gridSellEnergy = sourceRecord
        ? formatRecordEnergyAmount(sourceRecord, 'gridSellEnergy')
        : formatEnergyWithUnit(gridSellValue, pvDisplay.unit)

      const fullHoursText = sourceRecord && sourceRecord.fullHour != null && sourceRecord.fullHour !== ''
        ? `${formatPreciseNumber(sourceRecord.fullHour)}h`
        : `${formatPreciseNumber(summary.fullHours)}h`
      const incomeText = sourceRecord && sourceRecord.money != null && sourceRecord.money !== ''
        ? formatMoney(Number(sourceRecord.money) * (Number(sourceRecord.moneyPec) || 1))
        : formatMoney(summary.income)

      return {
        ...mockEntry,
        dateLabel,
        labelPrefix,
        hasData: true,
        generation,
        buy,
        selfUse: `${selfUseEnergy}(${selfRatio}%)`,
        gridSell: `${gridSellEnergy}(${sellRatio}%)`,
        income: incomeText,
        fullHours: fullHoursText,
        donutCenter: ['光伏发电', generation],
        selfUseRatio: Number(selfRatio),
        gridSellRatio: Number(sellRatio)
      }
    },
    buildSnapshotPeriodRuntime (labelPrefix, snapshot, mockEntry, dateLabel, summaryFromRecords = null, emsLoadKwh = 0) {
      // EMS 真实总负载：月/年从 overviewTrend 累加，日从 getDailyP
      const hasEmsLoad = emsLoadKwh > 0
      const loadKwh = hasEmsLoad ? emsLoadKwh : snapshot.loadEnergy

      const pvDisplay = formatRuntimeEnergyValue(snapshot.pvEnergy)
      const pvValue = pvDisplay.unit === 'MWh' ? snapshot.pvEnergy / 1000 : snapshot.pvEnergy

      const selfUseKwh = Math.min(snapshot.pvEnergy, loadKwh)
      const selfUseDisplay = formatRuntimeEnergyValue(selfUseKwh)
      const selfUseValue = selfUseDisplay.unit === 'MWh' ? selfUseKwh / 1000 : selfUseKwh

      const gridSellKwh = Math.max(snapshot.pvEnergy - loadKwh, 0)
      const gridSellDisplay = formatRuntimeEnergyValue(gridSellKwh)
      const gridSellValue = gridSellDisplay.unit === 'MWh' ? gridSellKwh / 1000 : gridSellKwh

      // 买电 = EMS 负载 - 光伏真实发电（负载超过光伏部分）
      const buyKwh = Math.max(loadKwh - snapshot.pvEnergy, 0)
      const buyDisplay = formatRuntimeEnergyValue(buyKwh)
      const buyValue = buyDisplay.unit === 'MWh' ? buyKwh / 1000 : buyKwh

      const selfRatio = snapshot.pvEnergy > 0 ? ((selfUseKwh / snapshot.pvEnergy) * 100).toFixed(1) : '0.0'
      const sellRatio = snapshot.pvEnergy > 0 ? ((gridSellKwh / snapshot.pvEnergy) * 100).toFixed(1) : '0.0'

      // fullHours：stationDetail 只有日满发小时数，月/年需从 runtime records 汇总
      const fullHoursFromRecords = summaryFromRecords && hasRuntimeSummaryData(summaryFromRecords)
        ? summaryFromRecords.fullHours
        : null
      const fullHoursValue = fullHoursFromRecords != null ? fullHoursFromRecords : snapshot.fullHours
      const fullHoursText = `${formatPreciseNumber(fullHoursValue)}${snapshot.fullHoursStr}`

      return {
        ...mockEntry,
        dateLabel,
        labelPrefix,
        hasData: snapshot.pvEnergy > 0 || hasEmsLoad,
        generation: formatEnergyWithUnit(pvValue, pvDisplay.unit),
        buy: formatEnergyWithUnit(buyValue, buyDisplay.unit),
        selfUse: `${formatEnergyWithUnit(selfUseValue, pvDisplay.unit)}(${selfRatio}%)`,
        gridSell: `${formatEnergyWithUnit(gridSellValue, pvDisplay.unit)}(${sellRatio}%)`,
        income: formatMoney(snapshot.income, snapshot.incomeUnit),
        fullHours: fullHoursText,
        donutCenter: ['光伏发电', formatEnergyWithUnit(pvValue, pvDisplay.unit)],
        selfUseRatio: Number(selfRatio),
        gridSellRatio: Number(sellRatio)
      }
    },
    getDayChartYAxisRange (chartData, params) {
      let maxVal = 0
      let hasGrid = false
      const fieldMap = {
        power: item => (item.power != null ? item.power : item.pv),
        load: item => item.load
      }
      chartData.forEach(item => {
        Object.keys(fieldMap).forEach(key => {
          if (params[key]) {
            const v = Number(fieldMap[key](item))
            if (Number.isFinite(v) && v > maxVal) maxVal = v
          }
        })
        if (params.grid && item.grid != null && Number.isFinite(item.grid) && item.grid > 0) {
          // 电网折线为有向功率，坐标轴范围使用绝对值
          const g = Math.abs(Number(item.grid))
          if (g > maxVal) maxVal = g
        }
      })
      if (maxVal <= 0) maxVal = 300
      const max = maxVal <= 295 ? 295 : Math.ceil((maxVal * 1.06) / 59) * 59
      return { min: -max, max, interval: Math.round(max / 5) }
    },
    formatDayChartTooltip (label, row, params) {
      const timeText = label && label.length === 5 ? `${label}:00` : label
      const dataStatus = row && row.isCollecting
        ? { label: '上报中', text: '本时段数据正在上报' }
        : null
      if (dataStatus) {
        return `<div class="pv-tooltip" style="min-width:210px;box-sizing:border-box;">
          <div class="pv-tooltip-head" style="display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:6px;line-height:1.6;">
            <span style="flex:1 1 auto;white-space:nowrap;">${timeText}</span>
            <span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;flex-shrink:0;">
              <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#f5a623;"></span>${dataStatus.label}
            </span>
          </div>
          <div style="color:#fff;line-height:1.8;">${dataStatus.text}</div>
        </div>`
      }
      const rows = []
      const dotStyle = 'display:inline-block;width:9px;height:9px;margin-right:7px;border-radius:50%;vertical-align:middle;'
      if (params.power) {
        rows.push(`<div class="pv-tooltip-row"><span style="${dotStyle}background:${COLORS.pv};"></span>光伏： ${this.valueText(row.power != null ? row.power : row.pv, 'kW')}</div>`)
      }
      if (params.grid) {
        const gridKw = row.grid != null ? Math.abs(Number(row.grid)) : 0
        const gridDirection = Number(row.gridSigned) < 0 ? '买电' : '卖电'
        const gridText = gridKw > 0
          ? `${gridKw.toLocaleString('zh-CN', { maximumFractionDigits: 3 })}kW（${gridDirection}）`
          : '--'
        rows.push(`<div class="pv-tooltip-row"><span style="${dotStyle}background:${COLORS.cyan};"></span>电网： ${gridText}</div>`)
      }
      if (params.load) {
        rows.push(`<div class="pv-tooltip-row"><span style="${dotStyle}background:#ff9944;"></span>负载： ${this.valueText(row.load, 'kW')}</div>`)
      }
      if (!rows.length) return ''
      return `<div class="pv-tooltip" style="min-width:210px;box-sizing:border-box;">
        <div class="pv-tooltip-head" style="display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:2px;line-height:1.6;">
          <span style="flex:1 1 auto;white-space:nowrap;">${timeText}</span>
          <span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;flex-shrink:0;">
            <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#2d8f16;"></span>在线
          </span>
        </div>${rows.join('')}</div>`
    },
    buildDayChartSeries (chartData, params) {
      // 找到最后一个有实际数据的 index，之后全部置 null 断线
      let lastDataIdx = 0
      for (let i = chartData.length - 1; i >= 0; i--) {
        const item = chartData[i]
        const hasPv = item.power != null || item.pv != null
        const hasGrid = item.grid != null
        if (hasPv || hasGrid) { lastDataIdx = i; break }
      }

      const nullAfterData = (mapper) =>
        chartData.map((item, idx) => idx <= lastDataIdx ? mapper(item) : null)

      const defs = [
        {
          key: 'power',
          name: '光伏',
          color: COLORS.pv,
          data: nullAfterData(item => {
            const val = item.power != null ? item.power : item.pv
            return val != null ? val : null
          }),
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245, 207, 0, 0.50)' },
                { offset: 1, color: 'rgba(245, 207, 0, 0.04)' }
              ]
            }
          }
        },
        {
          key: 'grid',
          name: '电网',
          color: COLORS.cyan,
          data: nullAfterData(item => item.gridSigned != null ? item.gridSigned : null),
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(32, 174, 197, 0.40)' },
                { offset: 1, color: 'rgba(32, 174, 197, 0.03)' }
              ]
            }
          }
        },
        {
          key: 'load',
          name: '负载',
          color: '#ff9944',
          data: nullAfterData(item => item.load != null ? item.load : null),
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255, 153, 68, 0.45)' },
                { offset: 1, color: 'rgba(255, 153, 68, 0.03)' }
              ]
            }
          }
        }
      ]

      const series = defs
        .filter(def => params[def.key])
        .map(def => ({
          type: 'line',
          smooth: true,
          symbol: 'none',
          showSymbol: false,
          name: def.name,
          data: def.data,
          lineStyle: { width: 2, color: def.color },
          areaStyle: def.areaStyle
        }))

      if (chartData.some(item => item && item.isCollecting)) {
        series.push({
          type: 'scatter',
          name: '数据状态',
          data: chartData.map(item => item && item.isCollecting ? 0 : null),
          symbolSize: 1,
          itemStyle: { opacity: 0 },
          emphasis: { disabled: true },
          isDataStatus: true
        })
      }

      return series
    },
    openDayParamDialog () {
      this.dayChartParamsDraft = { ...this.dayChartParams }
      this.dayParamDialogVisible = true
    },
    resetDayChartParams () {
      this.dayChartParamsDraft = { ...DEFAULT_DAY_CHART_PARAMS }
    },
    cancelDayChartParams () {
      this.dayParamDialogVisible = false
    },
    confirmDayChartParams () {
      const draft = this.dayChartParamsDraft
      if (!draft.power && !draft.grid && !draft.load) {
        this.$message.warning('请至少选择一个参数')
        return
      }
      this.dayChartParams = { ...draft }
      this.dayParamDialogVisible = false
    },
    getDayChartOption () {
      const chartData = this.activeRuntime.chart
      const params = this.dayChartParams
      const series = this.buildDayChartSeries(chartData, params)
      const yAxisRange = this.getDayChartYAxisRange(chartData, params)
      return {
        color: [COLORS.pv, COLORS.cyan, '#ff9944'],
        tooltip: {
          trigger: 'axis',
          confine: true,
          backgroundColor: 'rgba(88, 91, 102, 0.68)',
          borderWidth: 0,
          padding: [12, 18],
          textStyle: { color: '#fff', fontSize: 14, fontWeight: 600 },
          extraCssText: 'box-sizing:border-box;max-width:320px;',
          axisPointer: { type: 'cross', lineStyle: { color: COLORS.pv, type: 'dashed' } },
          formatter: tooltipParams => {
            const index = tooltipParams[0] ? tooltipParams[0].dataIndex : 0
            const row = chartData[index] || {}
            const name = tooltipParams[0] ? tooltipParams[0].axisValue : ''
            return this.formatDayChartTooltip(name, row, params)
          }
        },
        legend: {
          bottom: 8,
          data: series.filter(item => !item.isDataStatus).map(item => item.name),
          itemWidth: 16,
          textStyle: { color: '#666' }
        },
        grid: { top: 44, left: 56, right: 28, bottom: 70, containLabel: true },
        xAxis: {
          type: 'category',
          data: chartData.map(item => item.label),
          boundaryGap: false,
          axisTick: { show: true, alignWithLabel: true },
          axisLabel: {
            color: '#777',
            interval: 0,
            formatter: value => (shouldShowDayChartHourLabel(value) ? value : '')
          },
          axisLine: { lineStyle: { color: '#ddd' } }
        },
        yAxis: {
          type: 'value',
          name: 'kW',
          min: yAxisRange.min,
          max: yAxisRange.max,
          interval: yAxisRange.interval,
          nameTextStyle: { color: '#666', padding: [0, 0, 8, 0] },
          splitLine: { lineStyle: { color: '#eee' } },
          axisLabel: { color: '#666' }
        },
        series
      }
    },
    formatComboChartTooltip (row, title, incomeUnit = '元') {
      const fields = [
        { key: 'generation', label: '发电量', color: COLORS.pv, unit: 'kWh' },
        { key: 'sell', label: '卖电', color: '#5b8ec8', unit: 'kWh' },
        { key: 'buy', label: '买电', color: COLORS.red, unit: 'kWh' },
        { key: 'load', label: '负载用电', color: COLORS.orange, unit: 'kWh' },
        { key: 'hours', label: '满发小时数', color: COLORS.blue, unit: 'h' },
        { key: 'income', label: '收益', color: '#f47d0b', unit: incomeUnit }
      ]
      const rows = fields.map(field => `<div><span style="background:${field.color}"></span>${field.label}： ${this.valueText(row[field.key], field.unit)}</div>`).join('')
      return `<div class="pv-tooltip"><div style="margin-bottom:8px">${title}</div>${rows}</div>`
    },
    getMonthChartOption () {
      return this.buildPeriodChartOption({
        periodLabel: this.runtimeDates.month || '2026-06',
        tooltipTitle: row => `${this.runtimeDates.month || '2026-06'}-${row.label}`
      })
    },
    getYearChartOption () {
      return this.buildPeriodChartOption({
        periodLabel: this.runtimeDates.year || '2026',
        tooltipTitle: row => `${this.runtimeDates.year || '2026'}-${row.label}`
      })
    },
    buildPeriodChartOption ({ tooltipTitle }) {
      const chartData = this.activeRuntime.chart
      const yAxisRange = getRuntimeComboYAxisRange(chartData)
      const series = []
      const barDefs = [
        { key: 'generation', name: '发电量', color: COLORS.pv, width: 6 },
        { key: 'sell', name: '卖电', color: '#5b8ec8', width: 6 },
        { key: 'buy', name: '买电', color: COLORS.red, width: 6 },
        { key: 'load', name: '负载用电', color: COLORS.orange, width: 6 }
      ]

      barDefs.forEach(def => {
        if (def.key === 'load' && !hasDistinctLoadMetric(chartData)) return
        if (!hasRuntimeChartMetric(chartData, def.key)) return
        const values = chartData.map(row => row[def.key])
        series.push(this.barSeries(def.name, values, def.color, 1, def.width, '50%'))
      })

      if (hasRuntimeChartMetric(chartData, 'hours')) {
        series.push(this.lineSeries('满发小时数', chartData.map(row => row.hours), COLORS.blue, 2, { symbol: 'circle', symbolSize: 6 }))
      }
      if (hasRuntimeChartMetric(chartData, 'income')) {
        series.push(this.lineSeries('收益', chartData.map(row => row.income), '#f47d0b', 0, { symbol: 'diamond', symbolSize: 8, borderWidth: 2, fillColor: '#f47d0b' }))
      }

      const legendNames = series.map(s => s.name)
      const legendSelected = {}
      legendNames.forEach(name => { legendSelected[name] = true })

      return {
        color: [COLORS.pv, '#5b8ec8', COLORS.red, COLORS.orange, COLORS.blue, '#f47d0b'],
        tooltip: {
          trigger: 'axis',
          confine: true,
          backgroundColor: 'rgba(88, 91, 102, 0.68)',
          borderWidth: 0,
          padding: [14, 16],
          textStyle: { color: '#fff', fontSize: 14, fontWeight: 600 },
          axisPointer: {
            type: 'line',
            lineStyle: { color: 'rgba(255, 153, 68, 0.55)', type: 'dashed' }
          },
          formatter: params => {
            const row = chartData[params[0].dataIndex] || {}
            return this.formatComboChartTooltip(row, tooltipTitle(row))
          }
        },
        legend: {
          bottom: 42,
          data: legendNames,
          selected: legendSelected,
          itemWidth: 18,
          itemHeight: 10,
          textStyle: { color: '#666', fontSize: 13 }
        },
        dataZoom: [
          { type: 'inside', start: 0, end: 100, filterMode: 'filter' },
          {
            type: 'slider',
            start: 0,
            end: 100,
            height: 18,
            bottom: 8,
            showDetail: false,
            borderColor: '#c7d7ef',
            backgroundColor: '#eef3fb',
            fillerColor: 'rgba(255, 159, 50, 0.12)',
            dataBackground: {
              lineStyle: { color: '#b8c8e6' },
              areaStyle: { color: 'rgba(248, 234, 219, 0.35)' }
            }
          }
        ],
        grid: { top: 54, left: 60, right: 70, bottom: 98, containLabel: true },
        xAxis: {
          type: 'category',
          data: chartData.map(item => item.label),
          axisLabel: { color: '#666', fontSize: 13 },
          axisTick: { alignWithLabel: true },
          axisLine: { lineStyle: { color: '#ddd' } }
        },
        yAxis: [
          {
            type: 'value',
            name: '元',
            position: 'left',
            offset: 46,
            min: 0,
            max: yAxisRange.income.max,
            splitNumber: 5,
            nameTextStyle: { color: '#666' },
            splitLine: { show: false },
            axisLabel: { color: '#666' }
          },
          {
            type: 'value',
            name: 'kWh',
            position: 'left',
            min: 0,
            max: yAxisRange.kwh.max,
            splitNumber: 5,
            nameTextStyle: { color: '#666' },
            splitLine: { lineStyle: { color: '#eee' } },
            axisLabel: { color: '#666' }
          },
          {
            type: 'value',
            name: 'h',
            position: 'right',
            min: 0,
            max: yAxisRange.hours.max,
            splitNumber: 5,
            nameTextStyle: { color: '#666' },
            splitLine: { show: false },
            axisLabel: { color: '#666' }
          }
        ],
        series
      }
    },
    barSeries (name, data, color, yAxisIndex, width, barCategoryGap = '40%') {
      const values = Array.isArray(data) ? data : []
      return {
        name,
        type: 'bar',
        yAxisIndex,
        barMinHeight: 0,
        barCategoryGap,
        barGap: '28%',
        barWidth: params => (isRuntimeChartValue(values[params.dataIndex]) ? width : 0),
        data: values.map(value => (isRuntimeChartValue(value) ? toRuntimeChartValue(value) : null)),
        itemStyle: { color, borderRadius: [2, 2, 0, 0] }
      }
    },
    lineSeries (name, data, color, yAxisIndex, symbolOpts = {}) {
      const { symbol = 'circle', symbolSize = 6, borderWidth = 2, fillColor = '#fff' } = symbolOpts
      return {
        name,
        type: 'line',
        yAxisIndex,
        data: data.map(value => toRuntimeChartValue(value)),
        smooth: false,
        connectNulls: false,
        symbol,
        showSymbol: true,
        symbolSize: (_value, params) => (isRuntimeChartValue(params.data) ? symbolSize : 0),
        lineStyle: { color, width: 2 },
        itemStyle: { color: fillColor, borderColor: color, borderWidth }
      }
    },
    valueText (value, unit) {
      if (value == null) return '--'
      const num = Number(value)
      if (!Number.isFinite(num)) return '--'
      return `${num.toLocaleString('zh-CN', { maximumFractionDigits: 3 })}${unit}`
    },
    formatWeight (value) {
      const num = Number(value)
      if (!Number.isFinite(num)) return '--'
      if (num >= 1000) {
        return `${(num / 1000).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}t`
      }
      return `${num.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}kg`
    },
    handleResize () {
      if (this.resizeTimer) clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => {
        if (this.donutChartInstance) this.donutChartInstance.resize()
        if (this.trendChartInstance) this.trendChartInstance.resize()
      }, 80)
    }
  }
}
</script>

<style lang="scss" scoped>
.photovoltaic-page {
  min-height: calc(100vh - 84px);
  padding: 14px;
  background: linear-gradient(180deg, #edf3fb 0%, #f6f8fb 56%, #eef4fb 100%);
  color: #3f4248;
}

.page-layout {
  max-width: 1920px;
  margin: 0 auto;
}

.main-col,
.side-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.station-title {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding-left: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #383c42;

  .station-id {
    font-size: 13px;
    font-weight: 500;
    color: #a0a5ad;
  }
}

.online-dot {
  width: 11px;
  height: 11px;
  display: inline-block;
  border-radius: 50%;
  background: #278a18;
  box-shadow: 0 0 0 3px rgba(39, 138, 24, 0.08);

  &.offline {
    background: #b8bec8;
    box-shadow: 0 0 0 3px rgba(184, 190, 200, 0.12);
  }

  &.small {
    width: 8px;
    height: 8px;
    margin-right: 5px;
  }
}

.glass-card {
  border: 1px solid rgba(220, 227, 236, 0.92);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 2px 10px rgba(29, 45, 72, 0.1);

  ::v-deep .el-card__body {
    padding: 0;
  }
}

.topology-card {
  height: 520px;
  padding: 0 16px 12px;
  position: relative;

  .report-time {
    height: 48px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #777f8a;
    font-size: 13px;

    strong {
      color: #4b4f55;
    }

    .load-bucket-time {
      margin-left: 10px;
    }
  }
}

.topology-wrap {
  height: calc(100% - 48px);
}

.topology-toggle {
  position: absolute;
  right: 22px;
  top: 50%;
  z-index: 3;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: rgba(168, 174, 181, 0.72);
  box-shadow: 0 2px 8px rgba(105, 112, 124, 0.16);
  cursor: pointer;
  transform: translateY(-50%);
  transition: all 0.18s ease;

  i {
    font-size: 22px;
    font-weight: 700;
  }

  &:hover {
    background: #ff9f32;
    transform: translateY(-50%) scale(1.06);
  }

  &.is-table {
    left: 28px;
    right: auto;
  }
}

.topology-table {
  padding: 18px 52px 28px 52px;
  height: calc(100% - 48px);
  box-sizing: border-box;

  ::v-deep .el-table {
    color: #5f646b;
    font-size: 15px;

    th {
      height: 56px;
      background: #f4f6fa;
      color: #2f343b;
      font-size: 16px;
      font-weight: 700;
    }

    td {
      height: 58px;
      background: #fff;
    }

    .el-table__row:nth-child(even) td {
      background: #f6f8fb;
    }
  }
}

.flow-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.node-bg,
.circle-node,
.node-copy {
  &.is-idle {
    opacity: 0.35;
  }
}

.node-bg {
  stroke: none;
}

.pv-bg {
  fill: url(#pvBg);
}

.grid-bg {
  fill: url(#gridBg);
}

.load-bg {
  fill: url(#loadBg);
}

.flow-line {
  fill: none;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;

  &.is-idle {
    opacity: 0.2;
  }
}

.pv-line,
.pv-pulse {
  stroke: #f4c400;
}

.grid-line,
.grid-pulse {
  stroke: #ff7b7b;
}

.load-line,
.load-pulse {
  stroke: #ff9d2e;
}

.motion-arrow {
  filter: url(#softShadow);
  opacity: 0.95;

  path {
    stroke: none;
  }
}

.pv-arrow path {
  fill: #f4c400;
}

.grid-arrow path {
  fill: #ff7b7b;
}

.load-arrow path {
  fill: #ff9d2e;
}

.circle-node {
  .ring-track {
    fill: #fff;
    stroke-width: 2.4;
  }

  .ring-progress {
    fill: none;
    stroke-width: 3.4;
    stroke-linecap: round;
  }
}

.pv-node .ring-track {
  stroke: #f5dd72;
}

.pv-node .ring-progress {
  stroke: #f4c400;
}

.grid-node .ring-track {
  stroke: #ff7b7b;
}

.grid-node .ring-progress {
  stroke: #ff7b7b;
}

.inverter-node .ring-track,
.load-node .ring-track {
  stroke: #ff9d2e;
}

.load-node .ring-progress {
  stroke: #ff9d2e;
}

.topology-icon {
  width: 56px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6d6f73;
  font-size: 30px;
}

.node-title {
  font-size: 16px;
  font-weight: 600;
  fill: #404349;
}

.node-sub {
  font-size: 13px;
  fill: #717883;
}

.node-value,
.power-text {
  font-size: 12px;
  font-weight: 700;
  fill: #5d6168;
}

.runtime-card {
  min-height: 760px;
  overflow: hidden;

  ::v-deep .el-card__header {
    height: 50px;
    padding: 0;
    border-bottom: 1px solid #eef0f4;
  }
}

.runtime-body {
  min-height: 680px;
  position: relative;
}

.runtime-title {
  width: 120px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff4e8 0%, #ffe8cf 100%);
  color: #ff7f12;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.runtime-toolbar {
  height: 64px;
  padding: 0 18px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #eef1f5;
  position: relative;
  background: linear-gradient(180deg, #fbfcfe 0%, #fff 100%);

  .toolbar-btn {
    border-radius: 8px;
    border-color: #dce3ed;
    color: #5f6672;
    background: #fff;

    &:hover,
    &:focus {
      color: #ff8a16;
      border-color: #ffc98a;
      background: #fffaf4;
    }

    &.is-disabled,
    &.is-disabled:hover {
      color: #c0c4cc;
      border-color: #e4e7ed;
      background: #f5f7fa;
    }
  }
}

.date-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  .el-button {
    width: 40px;
    padding-left: 0;
    padding-right: 0;
    border-radius: 8px;
  }
}

.runtime-picker {
  width: 160px;

  ::v-deep .el-input__inner {
    height: 34px;
    line-height: 34px;
    border-radius: 8px;
    text-align: center;
    font-weight: 600;
    color: #60656d;
    padding-left: 8px;
    padding-right: 8px;
  }
}

.runtime-tabs {
  background: #fff;

  ::v-deep .el-tabs__header {
    margin: 0;
  }

  ::v-deep .el-tabs__nav-wrap::after {
    display: none;
  }

  ::v-deep .el-tabs__item {
    height: 34px;
    line-height: 34px;
    margin-left: 8px;
    padding: 0 18px !important;
    border: 1px solid #dce3ed;
    border-radius: 8px;
    color: #555d68;
    transition: all 0.2s ease;
  }

  ::v-deep .el-tabs__item.is-active {
    color: #fff;
    background: #ff8a16;
    border-color: #ff8a16;
    box-shadow: none;
  }

  ::v-deep .el-tabs__active-bar {
    display: none;
  }
}

.param-select {
  width: 108px;
}

::v-deep .day-param-dialog {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(31, 45, 61, 0.12);

  .el-dialog__header {
    padding: 16px 20px 0;
    border-bottom: none;
  }

  .el-dialog__headerbtn {
    top: 14px;
    right: 16px;
  }

  .el-dialog__body {
    padding: 10px 20px 0;
  }

  .el-dialog__footer {
    padding: 10px 20px 14px;
    border-top: 1px solid #ebeef5;
    background: #fafbfc;
  }

  .day-param-confirm {
    background: #ff8a16;
    border-color: #ff8a16;

    &:hover,
    &:focus {
      background: #ff961f;
      border-color: #ff961f;
    }
  }
}

.day-param-dialog-head {
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    color: #2f3440;
    font-size: 17px;
    font-weight: 700;
    line-height: 1.3;
  }

  span {
    color: #8a919c;
    font-size: 13px;
    font-weight: 400;
  }
}

.day-param-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.day-param-dialog-actions {
  display: inline-flex;
  gap: 8px;
}

.day-param-group {
  margin-bottom: 0;
}

.day-param-group-title {
  margin-bottom: 8px;
  color: #909399;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
  text-transform: none;
}

.day-param-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.day-param-option {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover {
    border-color: #d3d7de;
    background: #f7f8fa;
  }

  &.is-checked {
    border-color: #c0c4cc;
    background: linear-gradient(180deg, #f9fafb 0%, #f0f2f5 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  i {
    margin-left: auto;
    color: #c0c4cc;
    font-size: 14px;
  }

  &.is-checked i {
    color: #606266;
  }
}

.day-param-option-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.day-param-option-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.day-param-option-text {
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    color: #30343a;
    font-size: 14px;
    font-weight: 600;
  }

  em {
    color: #9aa1ac;
    font-size: 12px;
    font-style: normal;
  }
}

.runtime-summary {
  padding: 18px 18px 0;
}

.donut-panel,
.stat-panel {
  height: 156px;
  border: 1px solid #e8edf3;
  border-radius: 12px;
  background: linear-gradient(180deg, #fbfcfe 0%, #f5f7fb 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.donut-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.donut-chart {
  width: 144px;
  height: 144px;
}

.donut-legend {
  min-width: 150px;
  p {
    margin: 10px 0;
    color: #666b73;
    font-size: 14px;

    strong {
      display: block;
      margin-top: 4px;
      color: #5f636a;
      font-size: 16px;
    }
  }
}

.legend-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  margin-right: 7px;
  border-radius: 50%;

  &.pv {
    background: #ff9f32;
  }

  &.grid {
    background: #f56c6c;
  }
}

.stat-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 92px;

  div {
    min-width: 140px;
  }

  span {
    display: block;
    margin-bottom: 8px;
    color: #666b73;
    font-size: 15px;
  }

  strong {
    color: #30343a;
    font-size: 20px;
    font-weight: 500;
  }
}

.income-row {
  height: 64px;
  margin: 14px 18px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 48px;
  color: #60656d;
  font-size: 14px;
  border: 1px solid #e8edf3;
  border-radius: 12px;
  background: #fff;

  strong {
    color: #3f444b;
    font-weight: 600;
  }
}

.trend-chart {
  height: 490px;
  width: 100%;
  box-sizing: border-box;
  padding: 0 14px 10px;
}

.side-card {
  padding: 18px 20px;
}

.side-title {
  margin-bottom: 18px;
  color: #333941;
  font-size: 16px;
  font-weight: 700;

  &.with-more {
    display: flex;
    justify-content: space-between;
    align-items: center;

    span:last-child {
      color: #707780;
      font-size: 13px;
      font-weight: 400;
    }
  }
}

.weather-card {
  min-height: 246px;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px 14px;
}

.weather-item {
  display: flex;
  align-items: center;
  gap: 10px;

  .weather-icon {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #f7f8fa;
    color: #72767c;
    font-size: 20px;
  }

  span {
    display: block;
    color: #8a9098;
    font-size: 13px;
  }

  strong {
    color: #3f444b;
    font-size: 13px;
  }
}

.update-time {
  margin-top: 18px;
  color: #a2a8b1;
  font-size: 13px;
}

.station-card {
  min-height: 430px;
}

.station-image-wrap {
  position: relative;
  height: 205px;
  overflow: hidden;
  border-radius: 10px;
  background: #eef1f5;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.04);

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transform: scale(1.01);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 55%, rgba(0, 0, 0, 0.28) 100%);
    pointer-events: none;
  }

  .station-image-badge {
    position: absolute;
    right: 10px;
    bottom: 8px;
    z-index: 1;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.42);
    color: #fff;
    font-size: 12px;
    line-height: 1.6;
  }
}

.station-info {
  margin-top: 10px;

  p {
    margin: 10px 0 4px;
    color: #858b94;
    font-size: 13px;
  }

  strong {
    color: #464b52;
    font-size: 14px;
    font-weight: 500;
  }

  .orange-text {
    color: #ff7f12;
  }
}

.emission-card {
  min-height: 182px;
}

.emission-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 22px 24px;
}

.emission-item {
  display: flex;
  align-items: center;
  gap: 12px;

  i {
    color: #6e7278;
    font-size: 30px;
  }

  span {
    display: block;
    color: #8a9098;
    font-size: 13px;
  }

  strong {
    color: #444951;
    font-size: 14px;
  }
}

.basic-card {
  min-height: 420px;
}

.basic-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}

.basic-item {
  min-width: 0;

  span {
    display: block;
    margin-bottom: 5px;
    color: #8a9098;
    font-size: 13px;
  }

  strong {
    display: block;
    min-height: 18px;
    color: #3f444b;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.35;
    word-break: break-all;
  }
}

::v-deep .pv-tooltip {
  min-width: 210px;
  box-sizing: border-box;

  .pv-tooltip-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 2px;
    line-height: 1.6;
  }

  .pv-tooltip-row {
    line-height: 2;
    white-space: nowrap;
  }
}

@media (max-width: 1500px) {
  .topology-card {
    height: 470px;
  }

  .runtime-card {
    min-height: 700px;
  }

  .trend-chart {
    height: 450px;
  }

  .stat-panel {
    gap: 56px;
  }
}

@media (max-width: 1200px) {
  .side-col {
    margin-top: 14px;
  }
}

@media (max-width: 768px) {
  .photovoltaic-page {
    padding: 10px;
  }

  .station-title {
    flex-wrap: wrap;
    height: auto;
    min-height: 38px;
  }

  .topology-card {
    height: 390px;
    padding: 0 8px 8px;
  }

  .runtime-toolbar {
    height: auto;
    padding: 12px;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .donut-panel,
  .stat-panel {
    height: auto;
    min-height: 140px;
    margin-bottom: 10px;
  }

  .stat-panel {
    gap: 24px;
  }

  .income-row {
    flex-wrap: wrap;
    gap: 12px;
  }

  .trend-chart {
    height: 420px;
  }
}
</style>

<style lang="scss">
.photovoltaic-date-picker {
  .el-picker-panel {
    min-width: auto;
  }
}
</style>
