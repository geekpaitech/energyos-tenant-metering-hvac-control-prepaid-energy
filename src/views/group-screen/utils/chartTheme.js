export const CHART_COLORS = ['#62A8D0', '#7AD6D4', '#B9B07C', '#857EC1', '#A9C9DF']
export const ENERGY_COLORS = ['#62A8D0', '#7AD6D4', '#B9B07C', '#A9C9DF']
export const TENANT_COLORS = ['#A9C9DF', '#62A8D0']
export const COLLECT_COLOR = '#7AD6D4'
export const COLLECT_TRACK = 'rgba(18, 52, 86, 0.58)'

export const CHART_LABEL = '#DBE2EC'
export const CHART_SUB = '#A9C9DF'
export const CHART_TEXT = '#E6F2FF'

/** 图表数字字体：Bahnschrift 首选（Win10/11 内置），与设计系统 $ds-font-num 一致 */
export const CHART_NUM_FONT = 'Bahnschrift, "DIN Alternate", "Roboto Condensed", "Segoe UI", Arial, sans-serif'

export const darkTooltip = {
  backgroundColor: 'rgba(8, 28, 55, 0.96)',
  borderColor: 'rgba(109, 193, 192, 0.22)',
  textStyle: { color: CHART_TEXT, fontSize: 12 },
  padding: [8, 12],
  extraCssText: 'box-shadow: 0 8px 18px rgba(4,14,30,0.18);'
}

/** 双层科技环 + 外轨 */
export function techDonutSeries (data, center, radius = ['58%', '72%'], opts = {}) {
  const outer = opts.outerRadius || ['74%', '76%']
  return [
    {
      type: 'pie',
      radius: outer,
      center,
      silent: true,
      label: { show: false },
      labelLine: { show: false },
      itemStyle: { color: 'rgba(98,168,208,0.1)', borderColor: 'rgba(109,193,192,0.22)', borderWidth: 1 },
      data: [{ value: 1 }]
    },
    {
      type: 'pie',
      radius,
      center,
      silent: true,
      label: { show: false },
      labelLine: { show: false },
      itemStyle: {
        shadowBlur: 2,
        shadowColor: 'rgba(109,193,192,0.12)'
      },
      data
    }
  ]
}

export function ringSeries (data, centerText, centerSub) {
  return {
    type: 'pie',
    radius: ['66%', '80%'],
    center: ['50%', '50%'],
    silent: true,
    label: {
      show: true,
      position: 'center',
      formatter: centerSub
        ? `{a|${centerText}}\n{b|${centerSub}}`
        : `{a|${centerText}}`,
      rich: {
        a: { fontSize: 17, fontWeight: 700, color: CHART_TEXT, lineHeight: 20, textShadowColor: '#7491BA', textShadowBlur: 3 },
        b: { fontSize: 11, color: CHART_SUB, padding: [3, 0, 0, 0] }
      }
    },
    labelLine: { show: false },
    data
  }
}

export function donutSeries (data, opts = {}) {
  return {
    type: 'pie',
    radius: opts.radius || ['52%', '68%'],
    center: opts.center || ['50%', '50%'],
    label: {
      show: true,
      color: CHART_LABEL,
      fontSize: 10,
      formatter: '{b}\n{d}%'
    },
    labelLine: {
      length: 5,
      length2: 8,
      lineStyle: { color: 'rgba(109, 193, 192, 0.22)' }
    },
    itemStyle: { shadowBlur: 2, shadowColor: 'rgba(30,95,148,0.1)' },
    data
  }
}

/** 租户/公区能耗拆分 — 厚渐变环 + 内盘微光 + 装饰细圈 + 中心字 */
export function buildTenantSplitOption (tenantPct, opts = {}) {
  const tenant = Math.min(100, Math.max(0, Number(tenantPct) || 0))
  const remainder = Math.max(100 - tenant, 0)
  const hasBoth = tenant > 0.5 && remainder > 0.5
  const isFullTenant = remainder <= 0.05
  const isFullPublic = tenant <= 0.05
  const displayPct = tenant >= 99.95 ? '100' : (Number.isInteger(tenant) ? String(tenant) : tenant.toFixed(1))
  const center = opts.center || ['50%', '50%']
  const ringR = opts.ringRadius || ['56%', '70%']
  const hubRadius = opts.hubRadius || ['0%', '41%']

  const hubGradient = {
    type: 'radial',
    x: 0.5,
    y: 0.46,
    r: 0.78,
    colorStops: [
      { offset: 0, color: 'rgba(122, 214, 212, 0.12)' },
      { offset: 0.5, color: 'rgba(18, 52, 86, 0.24)' },
      { offset: 1, color: 'rgba(8, 25, 52, 0.02)' }
    ]
  }

  const tenantArcGradient = {
    type: 'linear',
    x: 0,
    y: 0.15,
    x2: 1,
    y2: 0.85,
    colorStops: [
      { offset: 0, color: '#5291B6' },
      { offset: 0.38, color: '#62A8D0' },
      { offset: 0.72, color: '#A9C9DF' },
      { offset: 1, color: '#E6F2FF' }
    ]
  }

  const publicArcColor = remainder > 0.5
    ? {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 1,
      y2: 1,
      colorStops: [
        { offset: 0, color: 'rgba(82, 145, 182, 0.3)' },
        { offset: 1, color: 'rgba(169, 201, 223, 0.18)' }
      ]
    }
    : 'rgba(12, 36, 68, 0.55)'

  const centerLabel = {
    show: true,
    position: 'center',
    formatter: `{a|${displayPct}}{b|%}\n{c|租户占比}`,
    rich: {
      a: {
        fontSize: 16,
        fontWeight: 700,
        color: '#F6FAFF',
        fontFamily: CHART_NUM_FONT,
        lineHeight: 20,
        textShadowColor: 'rgba(109, 193, 192, 0.28)',
        textShadowBlur: 6
      },
      b: {
        fontSize: 9.5,
        fontWeight: 600,
        color: 'rgba(219, 226, 236, 0.9)',
        padding: [0, 0, 0, 1]
      },
      c: {
        fontSize: 9.5,
        color: 'rgba(219, 226, 236, 0.88)',
        padding: [3, 0, 0, 0],
        lineHeight: 12,
        letterSpacing: 0.6
      }
    }
  }

  const tenantSliceStyle = {
    color: tenantArcGradient,
    borderRadius: hasBoth ? 6 : 0,
    borderWidth: (isFullTenant || isFullPublic) ? 0 : 1,
    shadowBlur: 6,
    shadowColor: 'rgba(109, 193, 192, 0.22)',
    shadowOffsetY: 0
  }

  const publicSliceStyle = {
    color: publicArcColor,
    borderRadius: hasBoth ? 6 : 0,
    borderWidth: (isFullTenant || isFullPublic) ? 0 : 1
  }

  let ringData
  if (isFullTenant) {
    ringData = [{ name: '租户', value: 1, itemStyle: tenantSliceStyle }]
  } else if (isFullPublic) {
    ringData = [{ name: '公区', value: 1, itemStyle: publicSliceStyle }]
  } else {
    ringData = [
      { name: '租户', value: tenant, itemStyle: tenantSliceStyle },
      { name: '公区', value: remainder, itemStyle: publicSliceStyle }
    ]
  }

  const decorRing = (radius, borderColor) => ({
    type: 'pie',
    radius,
    center,
    startAngle: 90,
    silent: true,
    label: { show: false },
    labelLine: { show: false },
    data: [{
      value: 1,
      itemStyle: {
        color: 'transparent',
        borderColor,
        borderWidth: 1
      }
    }]
  })

  return {
    tooltip: {
      ...darkTooltip,
      trigger: 'item',
      formatter (params) {
        if (!params.name || params.seriesIndex !== 3) return ''
        const val = params.name === '租户' ? tenant : remainder
        return `${params.name}：${val % 1 === 0 ? val : val.toFixed(1)}%`
      }
    },
    series: [
      {
        ...decorRing(['70%', '70.5%'], 'rgba(109, 193, 192, 0.16)'),
        z: 0
      },
      {
        ...decorRing(['51%', '51.5%'], 'rgba(169, 201, 223, 0.1)'),
        z: 0
      },
      {
        type: 'pie',
        radius: hubRadius,
        center,
        silent: true,
        z: 1,
        label: { show: false },
        labelLine: { show: false },
        data: [{ value: 1, itemStyle: { color: hubGradient } }]
      },
      {
        type: 'pie',
        radius: ringR,
        center,
        startAngle: 90,
        clockwise: true,
        z: 2,
        padAngle: hasBoth ? 2.5 : 0,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: (isFullTenant || isFullPublic)
          ? { borderWidth: 0 }
          : {
            borderColor: 'rgba(8, 25, 52, 0.42)',
            borderWidth: 1
          },
        data: ringData
      },
      {
        type: 'pie',
        radius: ['0%', '0%'],
        center,
        silent: true,
        z: 10,
        label: centerLabel,
        labelLine: { show: false },
        data: [{ value: 1, itemStyle: { color: 'transparent' } }]
      }
    ]
  }
}

export function donutWithTotal (data, centerText, centerSub, opts = {}) {
  const center = opts.center || ['50%', '50%']
  const radius = opts.radius || ['52%', '68%']
  const totalSize = opts.totalSize || 15
  const subSize = opts.subSize || 10
  return [
    ...techDonutSeries(data, center, radius),
    {
      type: 'pie',
      radius: ['0%', '0%'],
      center,
      label: {
        show: true,
        position: 'center',
        formatter: centerSub
          ? `{a|${centerText}}\n{b|${centerSub}}`
          : `{a|${centerText}}`,
        rich: {
          a: { fontSize: totalSize, fontWeight: 700, color: CHART_TEXT, fontFamily: CHART_NUM_FONT, lineHeight: 18, textShadowColor: '#7491BA', textShadowBlur: 2 },
          b: {
            fontSize: subSize,
            fontWeight: opts.subWeight || 400,
            color: opts.subColor || CHART_SUB,
            lineHeight: opts.subLineHeight || subSize + 2,
            textShadowColor: opts.subTextShadowColor || 'transparent',
            textShadowBlur: opts.subTextShadowBlur || 0
          }
        }
      },
      data: [{ value: 1, itemStyle: { color: 'transparent' } }]
    }
  ]
}

export function neonLineSeries (name, data, color = '#5291B6') {
  return {
    name,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 5,
    showSymbol: true,
    data,
    itemStyle: {
      color,
      borderColor: 'rgba(230, 242, 255, 0.82)',
      borderWidth: 1,
      shadowBlur: 3,
      shadowColor: 'rgba(109,193,192,0.18)'
    },
    lineStyle: {
      color,
      width: 2,
      shadowColor: 'rgba(109,193,192,0.16)',
      shadowBlur: 3
    },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(122,214,212,0.14)' },
          { offset: 0.55, color: 'rgba(98,168,208,0.05)' },
          { offset: 1, color: 'rgba(98,168,208,0)' }
        ]
      }
    }
  }
}

export function glowBarSeries (categories, values, color = '#5291B6') {
  return {
    type: 'bar',
    data: values.map(v => ({
      value: v,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 1,
          x2: 0,
          y2: 0,
          colorStops: [
            { offset: 0, color: 'rgba(18,52,86,0.18)' },
            { offset: 0.6, color: color },
            { offset: 1, color: 'rgba(230,242,255,0.78)' }
          ]
        },
        shadowBlur: 4,
        shadowColor: 'rgba(109,193,192,0.16)'
      }
    })),
    barWidth: '42%',
    showBackground: true,
    backgroundStyle: { color: 'rgba(14, 34, 67, 0.36)' }
  }
}
