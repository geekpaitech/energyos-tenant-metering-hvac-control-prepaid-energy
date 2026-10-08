import { expect } from 'chai'
import { createDemoSnapshot, loadScreenSnapshot, percentage, screenConfig } from '@/views/group/nandu-energy-screen/data'
import { getScreenLayout, mapSceneLandmarks } from '@/views/group/nandu-energy-screen/layout'

describe('Nandu energy screen presentation data', () => {
  it('reconciles today totals separately from the monthly snapshot', () => {
    const { energy } = createDemoSnapshot()
    expect(energy.tenantToday + energy.commonToday).to.equal(energy.projectToday)
    expect(energy.projectToday).to.be.lessThan(energy.total)
  })

  it('reconciles the device drilldown with all headline and type counts', () => {
    const { devices, deviceRecords } = createDemoSnapshot()
    expect(deviceRecords.length).to.equal(devices.total)
    expect(new Set(deviceRecords.map(device => device.id)).size).to.equal(devices.total)
    expect(deviceRecords.filter(device => device.status === 'offline').length).to.equal(devices.offline)
    devices.types.forEach(type => {
      const records = deviceRecords.filter(device => device.type === type.key)
      expect(records.length).to.equal(type.total)
      expect(records.filter(device => device.status !== 'offline').length).to.equal(type.online)
    })
    const ac = deviceRecords.filter(device => device.type === 'ac')
    expect(ac.filter(device => device.status === 'online').length).to.equal(devices.airConditioning.running)
    expect(ac.filter(device => device.status === 'standby').length).to.equal(devices.airConditioning.standby)
  })

  it('reconciles PV zones and fee categories with their summary totals', () => {
    const { photovoltaic, finance } = createDemoSnapshot()
    ;['generated', 'selfUse', 'exported'].forEach(key => expect(photovoltaic.zones.reduce((sum, zone) => sum + zone[key], 0)).to.equal(photovoltaic[key]))
    ;['receivable', 'received'].forEach(key => expect(finance.categories.reduce((sum, category) => sum + category[key], 0)).to.equal(finance[key]))
    expect(finance.received + finance.outstanding).to.equal(finance.receivable)
  })

  it('fills desktop windows without letterbox margins at several aspect ratios', () => {
    ;[[1920, 1080], [1672, 941], [1440, 900], [1366, 768], [1920, 900], [2560, 1080]].forEach(([width, height]) => {
      const layout = getScreenLayout(width, height)
      expect(layout.stageWidth * layout.scale).to.be.closeTo(width, 0.01)
      expect(layout.stageHeight * layout.scale).to.be.closeTo(height, 0.01)
      expect(layout.renderedWidth).to.be.at.least(layout.sceneWidth)
      expect(layout.renderedHeight).to.be.at.least(layout.sceneHeight)
      const mapped = mapSceneLandmarks(screenConfig.landmarks, layout)
      mapped.forEach(item => expect(item.leader[item.leader.length - 1]).to.deep.equal([item.x, item.y]))
    })
  })

  it('uses readable scrolling cards in narrow tall windows', () => {
    const layout = getScreenLayout(640, 790)
    expect(layout.compact).to.equal(true)
    expect(layout.scale).to.equal(1)
    expect(layout.stageWidth).to.equal(640)
  })

  it('balances the same electricity across supply and usage scopes', () => {
    const { energy, photovoltaic } = createDemoSnapshot()
    expect(energy.gridImport + photovoltaic.selfUse).to.equal(energy.total)
    expect(energy.tenant + energy.common).to.equal(energy.total)
    expect(energy.indoor + energy.airConditioning).to.equal(energy.tenant)
  })

  it('keeps exported solar generation out of on-site consumption', () => {
    const { energy, photovoltaic } = createDemoSnapshot()
    expect(photovoltaic.selfUse + photovoltaic.exported).to.equal(photovoltaic.generated)
    expect(energy.gridImport + photovoltaic.generated - energy.total).to.equal(photovoltaic.exported)
    expect(photovoltaic.selfUsePercent).to.equal(84.9)
  })

  it('reconciles device and air conditioner status totals', () => {
    const { devices } = createDemoSnapshot()
    expect(devices.online + devices.offline).to.equal(devices.total)
    const ac = devices.airConditioning
    expect(ac.running + ac.standby + ac.offline).to.equal(ac.total)
    expect(devices.onlinePercent).to.equal(97.6)
  })

  it('reconciles receivables and collection percentage', () => {
    const { finance } = createDemoSnapshot()
    expect(finance.received + finance.outstanding).to.equal(finance.receivable)
    expect(finance.collectionPercent).to.equal(96)
  })

  it('returns independent demo snapshots without a manager ID or external service', async () => {
    const first = await loadScreenSnapshot()
    first.energy.total = -1
    first.trend[0].value = -1
    const second = await loadScreenSnapshot()
    expect(second.mode).to.equal('demo')
    expect(second.energy.total).to.equal(286600)
    expect(second.trend[0].value).to.equal(12100)
    expect(second).not.to.have.property('managerId')
  })

  it('uses seven complete days before the partial snapshot day', () => {
    const { trend } = createDemoSnapshot()
    expect(trend.map(point => point.date)).to.deep.equal(['09/10', '09/11', '09/12', '09/13', '09/14', '09/15', '09/16'])
    expect(trend.every(point => point.value >= 0)).to.equal(true)
  })

  it('does not render NaN or Infinity when a denominator is empty', () => {
    expect(percentage(0, 0)).to.equal(0)
  })

  it('keeps landmark anchors and leader endpoints in the same scene coordinate system', () => {
    screenConfig.landmarks.forEach(item => {
      expect(item.leader[item.leader.length - 1]).to.deep.equal([item.x, item.y])
      expect(item.x).to.be.within(0, 100)
      expect(item.y).to.be.within(0, 100)
    })
  })
})
