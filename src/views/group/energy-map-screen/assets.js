import map from './assets/group-map-terrain.png'
import suwang from './assets/suwang-night.png'
import wusong from './assets/wusong-night.png'
import tayun from './assets/tayun-night.png'
import nandu from '../nandu-energy-screen/assets/nandu-night-scene-v2.png'
import { screenConfig } from '../nandu-energy-screen/data'

export const mapImage = map
export const scenes = { nandu, suwang, wusong, tayun }
export function projectConfig (project) {
  const landmarks = project.scene === 'nandu' ? screenConfig.landmarks : [
    { id: 'tower', label: project.shortName, x: 48, y: 43, labelX: 32, labelY: 32, leader: [[40, 34], [48, 43]] },
    { id: 'entrance', label: '项目入口', x: 51, y: 78, labelX: 55, labelY: 67, leader: [[59, 69], [51, 78]] }
  ]
  return { ...screenConfig, projectName: project.name, title: `${project.shortName}智慧能源管理大屏`, sceneSource: scenes[project.scene], hasPv: project.hasPv, landmarks }
}
