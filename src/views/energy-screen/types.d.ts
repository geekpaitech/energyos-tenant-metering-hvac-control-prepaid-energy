export interface EnergyKpi {
  key: string
  label: string
  value: number | null
  digits: number
  unit: string
  prefix?: string
  noteLabel: string
  note: string
  icon: string
  tone: string
}

export interface EnergySeriesItem {
  name: string
  value: number | null
  percent: number
  color: string
}

export interface EnergyTrend {
  total: number | null
  dates: string[]
  usage: Array<number | null>
  fee: Array<number | null>
}

export interface EnergyFlowSource {
  title: string
  icon: string
  energy: number | null
  cost?: number | null
  power?: number | null
}

export interface EnergyFlowDestination {
  key: string
  title: string
  icon: string
  usage: number | null
  percent: number
  tone: string
}

export interface EnergyMetric {
  label: string
  value: number | string | null
  unit: string
  icon: string
  tone?: string
}

export interface DeviceStatusItem extends EnergyMetric { value: number | null; tone: string }

export interface EnergyScreenOverview {
  weather: { text: string; temperature: string }
  kpis: EnergyKpi[]
  left: {
    trend: EnergyTrend
    structure: { total: number | null; items: EnergySeriesItem[] }
    costs: { total: number | null; items: EnergySeriesItem[] }
  }
  flow: {
    grid: EnergyFlowSource
    photovoltaic: EnergyFlowSource
    center: { title: string; purchased: number | null; generated: number | null }
    destinations: EnergyFlowDestination[]
    totalLoad: number | null
    realtimePower: number | null
  }
  right: {
    photovoltaic: { available: boolean; name: string; online: boolean | null; capacity: string; inverter: string; address: string }
    deviceStatus: DeviceStatusItem[]
  }
  footer: {
    assets: EnergyMetric[]
    achievements: EnergyMetric[]
    environment: EnergyMetric[]
  }
}
