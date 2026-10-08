import { expect } from 'chai'
import { PROJECTS, createGroupModel, aggregateSnapshots } from '@/views/group/energy-map-screen/data'
import { ENERGY_SCREEN_MANAGER_IDS } from '@/views/energy-screen/config'
import { percentage } from '@/views/group/nandu-energy-screen/data'

describe('Group energy map snapshot reconciliation', () => {
  const model = createGroupModel()
  it('includes exactly the managers already configured in the energy screen', () => {
    expect(PROJECTS.map(p => p.id).sort()).to.deep.equal([...ENERGY_SCREEN_MANAGER_IDS].sort())
    expect(PROJECTS.filter(p => p.scene)).to.have.length(4)
  })
  model.projects.forEach(project => {
    it(`reconciles energy, devices and fees for ${project.name}`, () => {
      const { energy: e, photovoltaic: pv, devices: d, finance: f, deviceRecords } = project.snapshot
      expect(e.total).to.equal(e.tenant + e.common)
      expect(e.total).to.equal(e.gridImport + pv.selfUse)
      expect(e.tenant).to.equal(e.indoor + e.airConditioning)
      expect(e.projectToday).to.equal(e.tenantToday + e.commonToday)
      expect(pv.generated).to.equal(pv.selfUse + pv.exported)
      expect(pv.zones.reduce((n, z) => n + z.generated, 0)).to.equal(pv.generated)
      expect(d.online + d.offline).to.equal(d.total)
      expect(deviceRecords.length).to.equal(d.total)
      expect(deviceRecords.filter(r => r.status === 'offline').length).to.equal(d.offline)
      d.types.forEach(type => {
        expect(deviceRecords.filter(r => r.type === type.key)).to.have.length(type.total)
        expect(deviceRecords.filter(r => r.type === type.key && r.status === 'offline')).to.have.length(type.offline)
      })
      expect(f.received + f.outstanding).to.equal(f.receivable)
      expect(f.categories.reduce((n, c) => n + c.received, 0)).to.equal(f.received)
      expect(d.onlinePercent).to.equal(percentage(d.online, d.total))
    })
  })
  ;['all', 'office', 'industrial'].forEach(business => {
    it(`aggregates ${business} from its children without double counting`, () => {
      const children = model.projects.filter(p => business === 'all' || p.business === business).map(p => p.snapshot)
      const group = aggregateSnapshots(children)
      ;[['energy', 'total'], ['energy', 'tenantWater'], ['devices', 'total'], ['finance', 'received'], ['finance', 'receivable']].forEach(([section, key]) => {
        expect(group[section][key]).to.equal(children.reduce((n, p) => n + p[section][key], 0))
      })
      expect(group.devices.onlinePercent).to.equal(percentage(group.devices.online, group.devices.total))
      expect(group.finance.collectionPercent).to.equal(percentage(group.finance.received, group.finance.receivable))
      expect(new Set(group.deviceRecords.map(r => r.id)).size).to.equal(group.devices.total)
      expect(new Set(group.events.map(r => r.id)).size).to.equal(group.events.length)
      group.trend.forEach((point, i) => expect(point.value).to.equal(children.reduce((n, p) => n + p.trend[i].value, 0)))
      if (business === 'industrial') expect(group.photovoltaic.generated).to.equal(0)
    })
  })
  it('produces deterministic data and does not mutate child snapshots when aggregating', () => {
    const before = JSON.stringify(model.projects)
    aggregateSnapshots(model.projects.map(p => p.snapshot))
    expect(JSON.stringify(model.projects)).to.equal(before)
    expect(createGroupModel()).to.deep.equal(model)
  })
})
