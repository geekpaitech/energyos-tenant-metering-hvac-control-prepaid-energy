const TEXT = '#d8e9ff'
const MUTED = '#83a6c8'
const GRID = 'rgba(42, 112, 176, 0.18)'

function cssNumber (name, fallback) {
  if (typeof window === 'undefined') return fallback
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name)
  const number = Number.parseFloat(value)
  return Number.isFinite(number) ? number : fallback
}

function chartTypeTokens () {
  return {
    axis: cssNumber('--energy-font-chart-axis', 11),
    legend: cssNumber('--energy-font-chart-legend', 12),
    body: cssNumber('--energy-font-body', 12),
    caption: cssNumber('--energy-font-caption', 11)
  }
}

function createTooltip (trigger, fontSize) {
  return {
    trigger,
    backgroundColor: 'rgba(2, 20, 43, 0.96)',
    borderColor: 'rgba(20, 139, 238, 0.55)',
    borderWidth: 1,
    padding: [8, 11],
    textStyle: { color: '#edf7ff', fontSize },
    extraCssText: 'box-shadow:0 8px 24px rgba(0,7,22,.45);'
  }
}

function comma (value, digits = 2) {
  if (value === null || value === undefined || value === '') return '--'
  const number = Number(value)
  if (!Number.isFinite(number)) return '--'
  return number.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })
}

export function createTrendOption (data, period = 'day') {
  const type = chartTypeTokens()
  const scale = values => {
    const chartValues = (values || [])
      .filter(value => value !== null && value !== undefined && value !== '')
      .map(Number)
      .filter(Number.isFinite)
    const rawMax = chartValues.length ? Math.max(...chartValues) : 1
    const magnitude = Math.pow(10, Math.max(0, Math.floor(Math.log10(rawMax))))
    const max = Math.max(4, Math.ceil((rawMax * 1.16) / magnitude) * magnitude)
    return { max, interval: max / 4 }
  }
  const usageScale = scale(data.usage)
  const feeScale = scale(data.fee)
  const axisLabel = value => value === 0 ? '0' : value >= 1000 ? `${Number((value / 1000).toFixed(1))}k` : Number(value.toFixed(1))
  const tooltip = {
    ...createTooltip('axis', type.body),
    formatter: params => {
      const list = Array.isArray(params) ? params : [params]
      if (!list.length) return ''
      return [list[0].axisValueLabel || list[0].name]
        .concat(list.map(item => `${item.marker}${item.seriesName}&nbsp;&nbsp;<b>${comma(item.value)}</b>${item.seriesIndex === 0 ? ' 度' : ' 元'}`))
        .join('<br/>')
    }
  }

  // 动态柱宽：月数据多时收窄
  const dataCount = Math.max((data.usage || []).length, 1)
  let barWidth = 22
  if (period === 'month') barWidth = Math.max(8, Math.min(14, Math.floor(360 / dataCount)))
  else if (period === 'year') barWidth = Math.max(12, Math.min(22, Math.floor(300 / dataCount)))

  const isScrollable = period === 'month' && dataCount > 10

  const option = {
    animationDuration: 900,
    color: ['#0e83ff', '#1ed8c3'],
    tooltip,
    legend: {
      top: 0,
      left: 0,
      itemWidth: 18,
      itemHeight: 3,
      itemGap: 24,
      textStyle: { color: TEXT, fontSize: type.legend },
      data: ['用电量（度）', '用电费用（元）']
    },
    grid: { left: 40, right: 26, top: 34, bottom: isScrollable ? 42 : 28 },
    xAxis: {
      type: 'category',
      data: data.dates,
      axisLine: { lineStyle: { color: 'rgba(69,131,190,.42)' } },
      axisTick: { show: false },
      axisLabel: { color: MUTED, fontSize: type.axis, rotate: dataCount > 15 ? 30 : 0 }
    },
    yAxis: [
      {
        type: 'value',
        min: 0,
        max: usageScale.max,
        interval: usageScale.interval,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: MUTED, fontSize: type.axis, formatter: axisLabel },
        splitLine: { lineStyle: { color: GRID, type: 'dashed' } }
      },
      {
        type: 'value',
        min: 0,
        max: feeScale.max,
        interval: feeScale.interval,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: MUTED, fontSize: type.axis, formatter: axisLabel },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '用电量（度）',
        type: 'bar',
        barWidth,
        data: data.usage,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 1,
            x2: 0,
            y2: 0,
            colorStops: [
              { offset: 0, color: 'rgba(3,68,147,.2)' },
              { offset: 0.58, color: '#0874dc' },
              { offset: 1, color: '#26bcff' }
            ]
          },
          shadowBlur: 8,
          shadowColor: 'rgba(0,135,255,.36)'
        }
      },
      {
        name: '用电费用（元）',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: data.fee,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2, color: '#17d7c2', shadowBlur: 8, shadowColor: 'rgba(23,215,194,.5)' },
        itemStyle: { color: '#8affee', borderColor: '#0bb3aa', borderWidth: 2 }
      }
    ]
  }

  // 月视图 超过 10 条数据：启用底部滑块 + 鼠标拖拽
  if (isScrollable) {
    const endPercent = Math.min(100, Math.round((10 / dataCount) * 100))
    option.dataZoom = [
      {
        type: 'slider',
        bottom: 6,
        height: 16,
        start: 100 - endPercent,
        end: 100,
        borderColor: 'rgba(69,131,190,.35)',
        backgroundColor: 'rgba(6,26,52,.55)',
        fillerColor: 'rgba(20,120,220,.28)',
        handleStyle: { color: '#1682e2', borderColor: '#0c5ea3' },
        textStyle: { color: '#83a6c8', fontSize: 10 }
      },
      { type: 'inside' }
    ]
  }

  return option
}

export function createStructureOption (data) {
  const type = chartTypeTokens()
  const valueByName = data.items.reduce((map, item) => {
    map[item.name] = item
    return map
  }, {})
  return {
    color: data.items.map(item => item.color),
    tooltip: {
      ...createTooltip('item', type.body),
      formatter: params => `${params.name}<br/>${comma(params.value)} 度（${params.percent}%）`
    },
    legend: {
      orient: 'vertical',
      right: '3%',
      top: 'middle',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 18,
      icon: 'circle',
      textStyle: {
        color: TEXT,
        fontSize: type.legend,
        lineHeight: 22,
        rich: {
          name: { color: '#eef7ff', fontSize: type.legend + 1, fontWeight: 700, lineHeight: 20 },
          pct: { color: '#ffffff', fontSize: type.legend + 3, fontWeight: 700, padding: [0, 0, 0, 16], lineHeight: 20 },
          value: { color: MUTED, fontSize: type.caption, lineHeight: 18, padding: [2, 0, 0, 0] }
        }
      },
      formatter: name => {
        const item = valueByName[name]
        return `{name|${name}}{pct|${item.percent}%}\n{value|${comma(item.value)} 度}`
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['53%', '76%'],
        center: ['27%', '53%'],
        startAngle: 90,
        label: {
          show: true,
          position: 'center',
          formatter: `{label|总用电量}\n{value|${comma(data.total)} 度}`,
          rich: {
            label: { color: MUTED, fontSize: type.caption, lineHeight: 18, padding: [0, 0, 3, 0] },
            value: { color: '#f2f8ff', fontSize: type.legend + 1, fontWeight: 700, lineHeight: 20, padding: [3, 0, 0, 0] }
          }
        },
        labelLine: { show: false },
        itemStyle: { borderColor: '#05203d', borderWidth: 2, shadowBlur: 8, shadowColor: 'rgba(0,112,255,.26)' },
        data: data.items.map(item => ({ name: item.name, value: item.value }))
      }
    ]
  }
}

export function createCostOption (data) {
  const type = chartTypeTokens()
  return {
    color: data.items.map(item => item.color),
    tooltip: {
      ...createTooltip('item', type.body),
      formatter: params => `${params.name}<br/>¥${comma(params.value)}`
    },
    series: [
      {
        type: 'pie',
        radius: ['54%', '76%'],
        center: ['50%', '50%'],
        label: { show: false },
        labelLine: { show: false },
        itemStyle: { borderColor: '#05203d', borderWidth: 1 },
        data: data.items
          .filter(item => item.value !== null && item.value !== undefined && Number.isFinite(Number(item.value)))
          .map(item => ({ name: item.name, value: Number(item.value) }))
      }
    ]
  }
}
