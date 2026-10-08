import { expect } from 'chai'
import {
  buildParkingScreenDto,
  buildPropertyScreenDto,
  scopeToBizType
} from '@/views/group-screen/utils/screenQuery'

describe('group screen query', () => {
  it('keeps 商办 as the fallback scope', () => {
    expect(scopeToBizType()).to.equal(2)
    expect(buildPropertyScreenDto()).to.include({ bizType: 2 })
  })

  it('omits bizType only for 全部', () => {
    expect(scopeToBizType('全部')).to.equal(null)
    expect(buildPropertyScreenDto({ scope: '全部' })).to.not.have.property('bizType')
    expect(buildParkingScreenDto({ scope: '全部' })).to.not.have.property('bizType')
    expect(buildPropertyScreenDto({ scope: '全部', period: '今日' })).to.not.have.property('bizType')
  })

  it('maps supported scopes to backend bizType values', () => {
    expect(scopeToBizType('产业园')).to.equal(1)
    expect(scopeToBizType('商办')).to.equal(2)
    expect(scopeToBizType('公寓')).to.equal(3)
  })
})
