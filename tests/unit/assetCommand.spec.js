import { expect } from 'chai'
import { createPortfolio, aggregatePortfolio, kpisFor, reportFor, TABS, PERIODS } from '@/views/group/asset-command/model'
import { ENERGY_SCREEN_MANAGER_IDS } from '@/views/energy-screen/config'

describe('Asset command mock business reconciliation', () => {
  const projects = createPortfolio()
  it('uses the configured six projects and keeps the four actual scene references', () => {
    expect(projects.map(p => p.id).sort()).to.deep.equal([...ENERGY_SCREEN_MANAGER_IDS].sort())
    expect(projects.filter(p => p.scene)).to.have.length(4)
    expect(TABS.map(t => t.id)).to.deep.equal(['overview', 'energy', 'power', 'air', 'light', 'parking', 'charge'])
  })
  PERIODS.forEach(period => {
    ;['all', 'office', 'industrial'].forEach(type => {
      it(`reconciles ${period.id} / ${type} across energy, fees and equipment states`, () => {
        const list = projects.filter(p => type === 'all' || p.business === type)
        const m = aggregatePortfolio(list, period.id)
        expect(m.kwh).to.equal(m.grid + m.self)
        expect(m.kwh).to.equal(m.tenant + m.common)
        expect(m.pv).to.equal(m.self + m.exported)
        expect(m.fees).to.equal(m.received + m.outstanding)
        expect(m.revenue).to.equal(m.received + m.parkingIncome + m.chargeIncome)
        expect(m.lights).to.equal(m.lightOn + m.lightOff + m.lightFault)
        expect(m.plugs).to.equal(m.charging + m.chargeIdle + m.chargeFault)
        expect(m.devices).to.equal(m.online + m.offline)
        expect(m.ac).to.equal(m.acRun + m.acStandby + m.acOffline)
        ;['kwh', 'tenant', 'water', 'fees', 'received', 'parkingIncome', 'chargeIncome'].forEach(key => {
          expect(m[key]).to.equal(list.reduce((total, p) => total + aggregatePortfolio([p], period.id)[key], 0))
        })
        TABS.forEach(tab => {
          expect(kpisFor(tab.id, m)).to.have.length(6)
          const report = reportFor(tab.id, m, list, period.id)
          report.series.forEach(s => {
            expect(s.values).to.have.length(report.labels.length)
            expect(s.values.every(Number.isFinite)).to.equal(true)
          })
        })
      })
    })
    it(`reconciles revenue trend totals and cumulative receipts for ${period.id}`, () => {
      const m = aggregatePortfolio(projects, period.id)
      ;['parking', 'charge'].forEach(tab => {
        const report = reportFor(tab, m, projects, period.id)
        const sum = report.series[0].values.reduce((a, b) => a + b, 0) * 10000
        expect(sum).to.be.closeTo(m[tab === 'parking' ? 'parkingIncome' : 'chargeIncome'], 0.01)
        expect(new Set(report.labels).size).to.equal(report.labels.length)
      })
      const fee = reportFor('energy', m, projects, period.id, 'fees').series[0].values
      expect(fee[fee.length - 1] * 10000).to.be.closeTo(m.received, 5)
      expect(fee.every((value, i) => i === 0 || value >= fee[i - 1])).to.equal(true)
    })
  })
  it('does not invent PV supply for projects without a connected array', () => {
    const list = projects.filter(p => !p.hasPv)
    const m = aggregatePortfolio(list)
    expect(m.pv).to.equal(0)
    const r = reportFor('energy', m, list, 'month')
    expect(r.series[1].values.every(v => v === 0)).to.equal(true)
    expect(r.series[0].values).to.deep.equal(r.series[2].values)
  })
  it('keeps current equipment counts independent of the financial period', () => {
    const month = aggregatePortfolio(projects, 'month')
    const year = aggregatePortfolio(projects, 'year')
    ;['devices', 'online', 'lights', 'plugs', 'rooms', 'spaces', 'balance'].forEach(key => expect(month[key]).to.equal(year[key]))
    expect(year.kwh).to.be.greaterThan(month.kwh)
  })
})
