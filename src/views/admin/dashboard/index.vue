<template>
  <div class="office-root">
    <div class="panel panel-tl">
      <div class="panel-header">
        <div class="panel-title"><span class="title-accent" style="background:#1677ff"></span>极派科技</div>
        <div class="badge-online"><span class="pulse-dot"></span>{{ members.length }} 在线</div>
      </div>
      <div class="panel-body phaser-wrap" ref="phaserWrap"></div>
    </div>
    <div class="panel panel-tr">
      <div class="panel-header">
        <div class="panel-title"><span class="title-accent" style="background:#faad14"></span>系统日志</div>
        <div class="live-badge"><span class="live-dot"></span>LIVE</div>
      </div>
      <div class="panel-body log-body" ref="logBody">
        <div v-for="(l, i) in logLines" :key="i" class="log-row">
          <span class="log-time">{{ l.time }}</span>
          <span class="log-icon" :class="'lc-' + l.type">{{ icons[l.type] }}</span>
          <span class="log-msg">{{ l.msg }}</span>
        </div>
        <div class="log-row">
          <span class="log-time">{{ nowTime }}</span>
          <span class="log-icon lc-info">$</span>
          <span class="log-cursor"></span>
        </div>
      </div>
    </div>
    <div class="panel panel-bl">
      <div class="panel-header">
        <div class="panel-title"><span class="title-accent" style="background:#52c41a"></span>在线成员</div>
        <span class="panel-tag">{{ members.length }} 人</span>
      </div>
      <div class="panel-body members-body">
        <div v-for="(m, i) in members" :key="m.name" class="mrow" :class="{ last: i === members.length - 1 }">
          <div class="mavatar" :style="{ background: m.color + '18', color: m.color, borderColor: m.color + '35' }">{{ m.name[0] }}
          </div>
          <div class="minfo">
            <div class="mtop"><span class="mname">{{ m.name }}</span><span class="mrole">{{ m.role }}</span></div>
            <div class="mdoing">{{ m.doing }}</div>
          </div>
          <div class="mbadge" :class="'bs-' + m.status">{{ stxt[m.status] }}</div>
        </div>
      </div>
    </div>
    <div class="panel panel-br">
      <div class="panel-header">
        <div class="panel-title"><span class="title-accent" style="background:#722ed1"></span>系统监控</div>
        <span class="panel-tag">实时</span>
      </div>
      <div class="panel-body monitor-body">
        <div class="stat-grid">
          <div class="stat-card" v-for="s in stats" :key="s.label">
            <div class="sv" :style="{ color: s.color }">{{ s.val }}</div>
            <div class="sl">{{ s.label }}</div>
          </div>
        </div>
        <div class="bar-list">
          <div v-for="m in bars" :key="m.label" class="bar-item">
            <div class="bh"><span class="bl">{{ m.label }}</span><span class="bv" :style="{ color: m.color }">{{ m.val
                }}</span></div>
            <div class="bt">
              <div class="bf" :style="{ width: m.pct + '%', background: m.color }"></div>
            </div>
          </div>
        </div>
        <div class="spark-area"><canvas ref="spark"></canvas></div>
      </div>
    </div>
  </div>
</template>

<script>
import Phaser from 'phaser'

export default {
  name: 'AdminDashboard',
  data () {
    return {
      game: null,
      nowTime: '',
      logLines: [
        { time: '09:00:00', type: 'ok', msg: '系统启动完成' },
        { time: '09:00:02', type: 'info', msg: '加载地图: my-office.tmj' },
        { time: '09:00:03', type: 'ok', msg: '地图加载完成 40×30 tiles' },
        { time: '09:00:04', type: 'ok', msg: 'WebSocket 连接成功' },
        { time: '09:00:05', type: 'dim', msg: '8 名成员已上线' },
        { time: '09:15:00', type: 'info', msg: '晨会开始 - 会议室' },
        { time: '09:30:00', type: 'ok', msg: '晨会结束，开始工作' }
      ],
      icons: { ok: '✓', info: '→', warn: '△', dim: '·', err: '✕' },
      members: [
        { name: '男1', role: '前端开发', doing: '编写Vue组件...', status: 'online', color: '#1677ff' },
        { name: '男2', role: '后端开发', doing: '调试API接口', status: 'online', color: '#0958d9' },
        { name: '男3', role: '测试工程师', doing: '编写自动化测试', status: 'online', color: '#1677ff' },
        { name: '男4', role: '运维工程师', doing: '监控服务器状态', status: 'online', color: '#0958d9' },
        { name: '女1', role: 'UI设计师', doing: '设计新版组件库', status: 'online', color: '#eb2f96' },
        { name: '女2', role: '产品经理', doing: '整理需求文档', status: 'busy', color: '#c41d7f' },
        { name: 'Boss1', role: 'CTO', doing: '代码审查中...', status: 'busy', color: '#722ed1' },
        { name: 'Boss2', role: 'CEO', doing: '战略规划会议', status: 'busy', color: '#531dab' }
      ],
      stxt: { online: '在线', busy: '忙碌', away: '离开' },
      stats: [
        { label: 'CPU', val: '—', color: '#1677ff' },
        { label: '内存', val: '—', color: '#52c41a' },
        { label: '网络', val: '—', color: '#722ed1' },
        { label: '磁盘', val: '—', color: '#faad14' }
      ],
      bars: [
        { label: 'CPU', val: '0%', pct: 0, color: '#1677ff' },
        { label: '内存', val: '0%', pct: 0, color: '#52c41a' },
        { label: '网络', val: '0%', pct: 0, color: '#722ed1' }
      ],
      cv: 42,
      mv: 61,
      nv: 38,
      hist: { cpu: [], mem: [], net: [] },
      timers: [],
      sceneDescriptions: []
    }
  },
  computed: {
    sidebarOpened () { return this.$store?.getters?.sidebar?.opened ?? true }
  },
  watch: {
    sidebarOpened () {
      ;[0, 100, 200, 350, 500].forEach(ms => {
        const t = setTimeout(() => this.resizeGame(), ms)
        if (Array.isArray(this.timers)) this.timers.push(t)
      })
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.initGame()
      this.startMonitor()
      this.startClock()
    })
  },
  beforeDestroy () {
    this.timers.forEach(t => { clearInterval(t); clearTimeout(t) })
    if (this.ro) this.ro.disconnect()
    window.removeEventListener('resize', this.resizeGame)
    if (this.game) { this.game.destroy(true); this.game = null }
  },
  methods: {
    addLog (type, msg) {
      const now = new Date()
      const p = v => String(v).padStart(2, '0')
      const time = `${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`
      this.logLines.push({ time, type, msg })
      if (this.logLines.length > 50) this.logLines.shift()
    },

    resizeGame () {
      const wrap = this.$refs.phaserWrap
      if (!wrap || !this.game) return
      const W = wrap.clientWidth; const H = wrap.clientHeight
      if (!W || !H) return
      const MW = 1280; const MH = 960
      const scale = Math.min(W / MW, H / MH)
      const cw = Math.floor(MW * scale)
      const ch = Math.floor(MH * scale)
      const ox = Math.floor((W - cw) / 2)
      const oy = Math.floor((H - ch) / 2)
      const cvs = wrap.querySelector('canvas')
      if (cvs) {
        cvs.style.width = cw + 'px'
        cvs.style.height = ch + 'px'
        cvs.style.position = 'absolute'
        cvs.style.left = ox + 'px'
        cvs.style.top = oy + 'px'
      }
      this.game.scale.resize(cw, ch)
      const scene = this.game.scene.getScene('Office')
      if (scene) {
        const zoom = Math.min(cw / MW, ch / MH)
        scene.cameras.main.setZoom(zoom)
        scene.cameras.main.centerOn(MW / 2, MH / 2)
      }
    },

    initGame () {
      const wrap = this.$refs.phaserWrap
      if (!wrap) return
      const MW = 1280; const MH = 960; const TILE = 32

      // 角色映射表
      const CHAR_DEFS = {
        male1: { key: 'male1', prefix: 'Adam', name: '男1' },
        male2: { key: 'male2', prefix: 'Alex', name: '男2' },
        male3: { key: 'male3', prefix: 'Bob', name: '男3' },
        male4: { key: 'male4', prefix: 'Adam', name: '男4' },
        female1: { key: 'female1', prefix: 'Amelia', name: '女1' },
        female2: { key: 'female2', prefix: 'Amelia', name: '女2' },
        boss1: { key: 'boss1', prefix: 'Alex', name: 'Boss1' },
        boss2: { key: 'boss2', prefix: 'Bob', name: 'Boss2' }
      }

      // 可行走区域定义（避免桌子、墙壁等障碍物）
      // 基于地图分析的关键坐标点
      const WALKABLE_ZONES = {
        // 左区办公区域过道
        leftZone: { xMin: 8, xMax: 18, yMin: 8, yMax: 28 },
        // 中区走廊
        corridor: { xMin: 19, xMax: 21, yMin: 8, yMax: 28 },
        // 右区办公区域
        rightZone: { xMin: 22, xMax: 32, yMin: 8, yMax: 28 },
        // 左老板办公室
        leftOffice: { xMin: 22, xMax: 28, yMin: 20, yMax: 24 },
        // 右老板办公室
        rightOffice: { xMin: 32, xMax: 38, yMin: 20, yMax: 24 },
        // 会议室
        meetingRoom: { xMin: 8, xMax: 18, yMin: 8, yMax: 14 },
        // 休息区
        restArea: { xMin: 32, xMax: 38, yMin: 8, yMax: 14 }
      }

      class OfficeScene extends Phaser.Scene {
        constructor () { super({ key: 'Office' }) }

        preload () {
          this.load.tilemapTiledJSON('map', '/rpg/my-office.tmj')
          this.load.image('interiors', '/rpg/Interiors_free_32x32.png')
          this.load.image('roombuilder', '/rpg/Room_Builder_Office_32x32.png')
          this.load.image('modern', '/rpg/Modern_Office_Black_Shadow_32x32.png')

          // 加载角色精灵图
          Object.values(CHAR_DEFS).forEach(({ key, prefix }) => {
            this.load.spritesheet(`${key}_run`, `/rpg/Characters_free/${prefix}_run_16x16.png`, {
              frameWidth: 16, frameHeight: 32
            })
            this.load.spritesheet(`${key}_idle_sheet`, `/rpg/Characters_free/${prefix}_idle_16x16.png`, {
              frameWidth: 16, frameHeight: 32
            })
            this.load.spritesheet(`${key}_sit`, `/rpg/Characters_free/${prefix}_sit_16x16.png`, {
              frameWidth: 16, frameHeight: 32
            })
          })

          this.load.on('loaderror', (file) => {
            console.error('加载失败:', file.key, file.src)
          })
        }

        create () {
          // ── 地图加载 ──
          const map = this.make.tilemap({ key: 'map' })
          const ts = [
            map.addTilesetImage('interiors', 'interiors'),
            map.addTilesetImage('roombuilder', 'roombuilder'),
            map.addTilesetImage('modern', 'modern')
          ]

          // 创建地图层
          const floorLayer = map.createLayer('Floor', ts, 0, 0)
          const wallLayer = map.createLayer('Wall', ts, 0, 0)
          const furnitureLayer = map.createLayer('Furniture', ts, 0, 0)
          const decoLayer = map.createLayer('Deco', ts, 0, 0)

          // 设置碰撞
          wallLayer.setCollisionByExclusion([-1, 0])
          furnitureLayer.setCollisionByExclusion([-1, 0])

          this.wallLayer = wallLayer
          this.furnitureLayer = furnitureLayer

          // ── 动画定义 ──
          const createAnims = (key) => {
            const FRAMES_PER_ROW = 6

            // 行走动画
            const getFrames = (row, sheet) => {
              const start = row * FRAMES_PER_ROW
              return [start + 1, start + 2, start + 3, start + 4].map(f => ({ key: sheet, frame: f }))
            }

            // 创建四方向行走动画
            if (!this.anims.exists(`${key}_right`)) {
              this.anims.create({ key: `${key}_right`, frames: getFrames(0, `${key}_run`), frameRate: 8, repeat: -1 })
            }
            if (!this.anims.exists(`${key}_up`)) {
              this.anims.create({ key: `${key}_up`, frames: getFrames(1, `${key}_run`), frameRate: 8, repeat: -1 })
            }
            if (!this.anims.exists(`${key}_left`)) {
              this.anims.create({ key: `${key}_left`, frames: getFrames(2, `${key}_run`), frameRate: 8, repeat: -1 })
            }
            if (!this.anims.exists(`${key}_down`)) {
              this.anims.create({ key: `${key}_down`, frames: getFrames(3, `${key}_run`), frameRate: 8, repeat: -1 })
            }

            // 站立动画 - 使用idle贴图的第0帧（面向下）
            if (!this.anims.exists(`${key}_idle`)) {
              this.anims.create({
                key: `${key}_idle`,
                frames: [{ key: `${key}_idle_sheet`, frame: 18 }], // 第3行第0帧 = 面向下
                frameRate: 1,
                repeat: 0
              })
            }

            // 四方向站立动画
            if (!this.anims.exists(`${key}_idle_right`)) {
              this.anims.create({ key: `${key}_idle_right`, frames: [{ key: `${key}_idle_sheet`, frame: 0 }], frameRate: 1, repeat: 0 })
            }
            if (!this.anims.exists(`${key}_idle_up`)) {
              this.anims.create({ key: `${key}_idle_up`, frames: [{ key: `${key}_idle_sheet`, frame: 6 }], frameRate: 1, repeat: 0 })
            }
            if (!this.anims.exists(`${key}_idle_left`)) {
              this.anims.create({ key: `${key}_idle_left`, frames: [{ key: `${key}_idle_sheet`, frame: 12 }], frameRate: 1, repeat: 0 })
            }
            if (!this.anims.exists(`${key}_idle_down`)) {
              this.anims.create({ key: `${key}_idle_down`, frames: [{ key: `${key}_idle_sheet`, frame: 18 }], frameRate: 1, repeat: 0 })
            }

            // 坐下动画
            if (!this.anims.exists(`${key}_sit_right`)) {
              this.anims.create({ key: `${key}_sit_right`, frames: [{ key: `${key}_sit`, frame: 0 }], frameRate: 1, repeat: 0 })
            }
            if (!this.anims.exists(`${key}_sit_up`)) {
              this.anims.create({ key: `${key}_sit_up`, frames: [{ key: `${key}_sit`, frame: 6 }], frameRate: 1, repeat: 0 })
            }
            if (!this.anims.exists(`${key}_sit_left`)) {
              this.anims.create({ key: `${key}_sit_left`, frames: [{ key: `${key}_sit`, frame: 12 }], frameRate: 1, repeat: 0 })
            }
            if (!this.anims.exists(`${key}_sit_down`)) {
              this.anims.create({ key: `${key}_sit_down`, frames: [{ key: `${key}_sit`, frame: 18 }], frameRate: 1, repeat: 0 })
            }
          }

          Object.keys(CHAR_DEFS).forEach(key => createAnims(key))

          // ── 创建角色 ──
          // 关键修复：调整所有角色的初始位置，确保不在桌子上
          const mkChar = (key, tx, ty, options = {}) => {
            const { interactive = false, facing = 'down', sitting = false } = options

            // 使用idle贴图创建精灵
            const sprite = this.physics.add.sprite(
              tx * TILE + 16,
              ty * TILE + 16 - 8, // 稍微向上偏移，让脚对齐地面
              `${key}_idle_sheet`
            )

            sprite.setScale(2)
            sprite.setOrigin(0.5, 0.85) // 锚点靠近底部，确保脚踩在地上
            sprite.setDepth(100 + ty) // 基于Y坐标的深度排序
            sprite.charKey = key
            sprite.facing = facing
            sprite.isSitting = sitting

            // 设置初始动画
            if (sitting) {
              sprite.play(`${key}_sit_${facing}`)
            } else {
              sprite.play(`${key}_idle_${facing}`)
            }

            // 碰撞体设置 - 只在脚部
            sprite.body.setSize(10, 8)
            sprite.body.setOffset(3, 24)
            sprite.body.setCollideWorldBounds(true)

            // 与墙壁和家具碰撞
            if (this.wallLayer) this.physics.add.collider(sprite, this.wallLayer)
            if (this.furnitureLayer) this.physics.add.collider(sprite, this.furnitureLayer)

            if (interactive) {
              sprite.setInteractive()
              sprite.on('pointerdown', () => {
                sprite.setTint(0x00ff00)
                setTimeout(() => sprite.clearTint(), 200)
              })
            }

            return sprite
          }

          // ========== 修复后的角色位置 ==========

          // 右区工位 - 坐在椅子上（面向桌子）
          this.male1 = mkChar('male1', 23, 10, { facing: 'up', sitting: true }) // 右上工位1
          this.male2 = mkChar('male2', 26, 10, { facing: 'up', sitting: true }) // 右上工位2

          // 左区工位 - 坐在椅子上
          this.male3 = mkChar('male3', 11, 10, { facing: 'up', sitting: true, interactive: true }) // 左上工位（玩家控制）
          this.male4 = mkChar('male4', 14, 10, { facing: 'up', sitting: true }) // 左中工位

          // 女性角色 - 修复：放在过道，不在桌子上
          // 原位置(14,26)和(15,26)在桌子上，改为过道位置
          this.female1 = mkChar('female1', 12, 18, { facing: 'right' }) // 左区过道
          this.female2 = mkChar('female2', 16, 18, { facing: 'left' }) // 左区过道另一侧

          // Boss - 修复：放在办公室内，桌子后面
          // 左办公室：从(25,23)改为(24,22)，确保在桌子后面
          this.boss1 = mkChar('boss1', 24, 22, { facing: 'down', sitting: true })
          // 右办公室：从(35,23)改为(34,22)
          this.boss2 = mkChar('boss2', 34, 22, { facing: 'down', sitting: true })

          // 角色集合
          this.allChars = [this.male1, this.male2, this.male3, this.male4, this.female1, this.female2, this.boss1, this.boss2]

          // 键盘控制
          this.cursors = this.input.keyboard.createCursorKeys()
          this.controlledChar = this.male3
          this.controlledKey = 'male3'

          // 剧本控制的角色（排除玩家控制的角色）
          this.scriptChars = this.allChars.filter(c => c !== this.controlledChar)

          // ── 摄像机设置 ──
          this.physics.world.setBounds(0, 0, MW, MH)
          this.cameras.main.setBounds(0, 0, MW, MH)
          this.cameras.main.setZoom(1)
          this.cameras.main.centerOn(MW / 2, MH / 2)

          // ── 场景调度系统 ──
          this.sceneIndex = 0
          this.sceneTimer = null
          this.scenes = this._buildScenes()
          this._runScene(0)
        }

        // ── 场景剧本系统 ──
        _buildScenes () {
          return [
            // 场景0: 早晨工作 - 所有人坐在工位上打字
            {
              name: '早晨工作',
              duration: 6000,
              setup: (scene) => {
                scene._log('info', '早晨工作时段 - 全员就位')
                // 右区工位
                scene._typeLoop(scene.male1, 'male1', 'up')
                scene._typeLoop(scene.male2, 'male2', 'up')
                // 左区工位
                scene._typeLoop(scene.male3, 'male3', 'up')
                scene._typeLoop(scene.male4, 'male4', 'up')
                // 女性角色在过道走动
                scene._walkPath(scene.female1, 'female1', [
                  { tx: 12, ty: 18 },
                  { tx: 15, ty: 18 },
                  { tx: 15, ty: 22 },
                  { tx: 12, ty: 22 }
                ], null, true) // true = 循环
                scene._walkPath(scene.female2, 'female2', [
                  { tx: 16, ty: 18 },
                  { tx: 13, ty: 18 },
                  { tx: 13, ty: 22 },
                  { tx: 16, ty: 22 }
                ], null, true)
                // Boss在办公室
                scene.boss1.play('boss1_idle_down')
                scene.boss2.play('boss2_idle_down')
              }
            },

            // 场景1: Boss1 出门巡视 - 修复穿墙问题
            {
              name: 'Boss1巡视',
              duration: 10000,
              setup: (scene) => {
                scene._log('warn', 'CTO 离开办公室巡视团队')
                // 修复：Boss从办公桌走到门口，然后出门
                // 左办公室门口在 (25, 19)
                scene._walkPath(scene.boss1, 'boss1', [
                  { tx: 24, ty: 22 }, // 从办公桌起身
                  { tx: 24, ty: 20 }, // 走到门口前
                  { tx: 25, ty: 20 }, // 到门口
                  { tx: 25, ty: 18 }, // 走出门到走廊
                  { tx: 20, ty: 18 }, // 走到中区
                  { tx: 20, ty: 12 }, // 走到左区
                  { tx: 15, ty: 12 } // 查看左区工位
                ], () => {
                  scene._log('ok', 'CTO 正在检查代码质量')
                  scene.boss1.play('boss1_idle_down')
                  // 3秒后返回
                  scene.time.delayedCall(3000, () => {
                    scene._walkPath(scene.boss1, 'boss1', [
                      { tx: 20, ty: 12 },
                      { tx: 20, ty: 18 },
                      { tx: 25, ty: 18 },
                      { tx: 25, ty: 20 },
                      { tx: 24, ty: 20 },
                      { tx: 24, ty: 22 }
                    ], () => {
                      scene._log('ok', 'CTO 返回办公室')
                      scene.boss1.play('boss1_idle_down')
                    })
                  })
                })
              }
            },

            // 场景2: Boss2 出门巡视
            {
              name: 'Boss2巡视',
              duration: 10000,
              setup: (scene) => {
                scene._log('warn', 'CEO 离开办公室巡视')
                // 右办公室门口在 (35, 19)
                scene._walkPath(scene.boss2, 'boss2', [
                  { tx: 34, ty: 22 }, // 从办公桌起身
                  { tx: 34, ty: 20 }, // 走到门口前
                  { tx: 35, ty: 20 }, // 到门口
                  { tx: 35, ty: 18 }, // 走出门到走廊
                  { tx: 30, ty: 18 }, // 走到中区
                  { tx: 30, ty: 12 }, // 走到右区
                  { tx: 28, ty: 12 } // 查看右区工位
                ], () => {
                  scene._log('ok', 'CEO 正在了解项目进度')
                  scene.boss2.play('boss2_idle_down')
                  scene.time.delayedCall(3000, () => {
                    scene._walkPath(scene.boss2, 'boss2', [
                      { tx: 30, ty: 12 },
                      { tx: 30, ty: 18 },
                      { tx: 35, ty: 18 },
                      { tx: 35, ty: 20 },
                      { tx: 34, ty: 20 },
                      { tx: 34, ty: 22 }
                    ], () => {
                      scene._log('ok', 'CEO 返回办公室')
                      scene.boss2.play('boss2_idle_down')
                    })
                  })
                })
              }
            },

            // 场景3: 午休时间 - 大家去休息区
            {
              name: '午休时间',
              duration: 8000,
              setup: (scene) => {
                scene._log('info', '午休时间 - 大家去休息区')
                // 所有人起身去休息区
                scene._walkPath(scene.male1, 'male1', [
                  { tx: 23, ty: 10 },
                  { tx: 23, ty: 14 },
                  { tx: 35, ty: 14 },
                  { tx: 35, ty: 10 }
                ], () => {
                  scene.male1.play('male1_idle_down')
                })
                scene._walkPath(scene.male2, 'male2', [
                  { tx: 26, ty: 10 },
                  { tx: 26, ty: 14 },
                  { tx: 36, ty: 14 },
                  { tx: 36, ty: 10 }
                ], () => {
                  scene.male2.play('male2_idle_down')
                })
                scene._walkPath(scene.male4, 'male4', [
                  { tx: 14, ty: 10 },
                  { tx: 14, ty: 14 },
                  { tx: 34, ty: 14 },
                  { tx: 34, ty: 10 }
                ], () => {
                  scene.male4.play('male4_idle_down')
                })
                // 女性角色去倒水
                scene._walkPath(scene.female1, 'female1', [
                  { tx: 12, ty: 18 },
                  { tx: 20, ty: 18 },
                  { tx: 20, ty: 10 }
                ], () => {
                  scene.female1.play('female1_idle_up')
                  scene._log('dim', '女1 在茶水间')
                })
                scene._walkPath(scene.female2, 'female2', [
                  { tx: 16, ty: 18 },
                  { tx: 20, ty: 18 },
                  { tx: 20, ty: 12 }
                ], () => {
                  scene.female2.play('female2_idle_down')
                })
              }
            },

            // 场景4: 会议时间 - 去会议室
            {
              name: '团队会议',
              duration: 8000,
              setup: (scene) => {
                scene._log('info', '团队会议开始 - 前往会议室')
                // 所有人去会议室
                const meetingPoints = [
                  { tx: 10, ty: 10 }, { tx: 12, ty: 10 }, { tx: 14, ty: 10 },
                  { tx: 10, ty: 12 }, { tx: 12, ty: 12 }, { tx: 14, ty: 12 }
                ]
                const chars = [scene.male1, scene.male2, scene.male3, scene.male4, scene.female1, scene.female2]
                chars.forEach((char, i) => {
                  const target = meetingPoints[i]
                  scene._walkPath(char, char.charKey, [
                    { tx: Math.floor(char.x / TILE), ty: Math.floor(char.y / TILE) },
                    { tx: 20, ty: Math.floor(char.y / TILE) },
                    { tx: 20, ty: target.ty },
                    { tx: target.tx, ty: target.ty }
                  ], () => {
                    char.play(`${char.charKey}_idle_down`)
                  })
                })
                // Boss们也去
                scene._walkPath(scene.boss1, 'boss1', [
                  { tx: 24, ty: 22 },
                  { tx: 25, ty: 22 },
                  { tx: 25, ty: 18 },
                  { tx: 20, ty: 18 },
                  { tx: 20, ty: 11 },
                  { tx: 16, ty: 11 }
                ], () => {
                  scene.boss1.play('boss1_idle_down')
                  scene._log('ok', 'CTO 主持晨会')
                })
                scene._walkPath(scene.boss2, 'boss2', [
                  { tx: 34, ty: 22 },
                  { tx: 35, ty: 22 },
                  { tx: 35, ty: 18 },
                  { tx: 20, ty: 18 },
                  { tx: 20, ty: 11 },
                  { tx: 18, ty: 11 }
                ], () => {
                  scene.boss2.play('boss2_idle_down')
                })
              }
            },

            // 场景5: 下午工作 - 回到工位
            {
              name: '下午工作',
              duration: 6000,
              setup: (scene) => {
                scene._log('info', '下午工作时间 - 回到工位')
                // 所有人回到工位
                scene._walkPath(scene.male1, 'male1', [
                  { tx: 10, ty: 10 },
                  { tx: 20, ty: 10 },
                  { tx: 23, ty: 10 }
                ], () => {
                  scene.male1.play('male1_sit_up')
                })
                scene._walkPath(scene.male2, 'male2', [
                  { tx: 12, ty: 10 },
                  { tx: 20, ty: 10 },
                  { tx: 26, ty: 10 }
                ], () => {
                  scene.male2.play('male2_sit_up')
                })
                scene._walkPath(scene.male3, 'male3', [
                  { tx: 14, ty: 10 },
                  { tx: 20, ty: 10 },
                  { tx: 11, ty: 10 }
                ], () => {
                  scene.male3.play('male3_sit_up')
                })
                scene._walkPath(scene.male4, 'male4', [
                  { tx: 10, ty: 12 },
                  { tx: 20, ty: 12 },
                  { tx: 14, ty: 10 }
                ], () => {
                  scene.male4.play('male4_sit_up')
                })
                scene._walkPath(scene.female1, 'female1', [
                  { tx: 12, ty: 12 },
                  { tx: 20, ty: 12 },
                  { tx: 12, ty: 18 }
                ], () => {
                  scene.female1.play('female1_idle_right')
                })
                scene._walkPath(scene.female2, 'female2', [
                  { tx: 14, ty: 12 },
                  { tx: 20, ty: 12 },
                  { tx: 16, ty: 18 }
                ], () => {
                  scene.female2.play('female2_idle_left')
                })
                // Boss回办公室
                scene._walkPath(scene.boss1, 'boss1', [
                  { tx: 16, ty: 11 },
                  { tx: 20, ty: 11 },
                  { tx: 20, ty: 18 },
                  { tx: 25, ty: 18 },
                  { tx: 25, ty: 20 },
                  { tx: 24, ty: 20 },
                  { tx: 24, ty: 22 }
                ], () => {
                  scene.boss1.play('boss1_sit_down')
                })
                scene._walkPath(scene.boss2, 'boss2', [
                  { tx: 18, ty: 11 },
                  { tx: 20, ty: 11 },
                  { tx: 20, ty: 18 },
                  { tx: 35, ty: 18 },
                  { tx: 35, ty: 20 },
                  { tx: 34, ty: 20 },
                  { tx: 34, ty: 22 }
                ], () => {
                  scene.boss2.play('boss2_sit_down')
                })
              }
            },

            // 场景6: 代码审查 - 男2去男1工位
            {
              name: '代码审查',
              duration: 6000,
              setup: (scene) => {
                scene._log('warn', '代码审查请求 - 后端找前端')
                scene._walkPath(scene.male2, 'male2', [
                  { tx: 26, ty: 10 },
                  { tx: 26, ty: 12 },
                  { tx: 24, ty: 12 },
                  { tx: 24, ty: 10 }
                ], () => {
                  scene.male2.play('male2_idle_left')
                  scene._log('ok', '正在讨论API接口设计')
                  scene.time.delayedCall(3000, () => {
                    scene._walkPath(scene.male2, 'male2', [
                      { tx: 24, ty: 10 },
                      { tx: 26, ty: 10 }
                    ], () => {
                      scene.male2.play('male2_sit_up')
                    })
                  })
                })
              }
            },

            // 场景7: 下班准备
            {
              name: '下班准备',
              duration: 5000,
              setup: (scene) => {
                scene._log('info', '下班时间临近 - 整理工作')
                // 大家起身活动
                this.scriptChars.forEach(char => {
                  if (char._typeTween) {
                    char._typeTween.stop()
                    char._typeTween = null
                  }
                  char.play(`${char.charKey}_idle_down`)
                })
                // 女性角色去整理东西
                scene._walkPath(scene.female1, 'female1', [
                  { tx: 12, ty: 18 },
                  { tx: 12, ty: 14 },
                  { tx: 10, ty: 14 }
                ], () => {
                  scene.female1.play('female1_idle_down')
                })
                scene._walkPath(scene.female2, 'female2', [
                  { tx: 16, ty: 18 },
                  { tx: 16, ty: 14 },
                  { tx: 18, ty: 14 }
                ], () => {
                  scene.female2.play('female2_idle_down')
                })
              }
            }
          ]
        }

        _log (type, msg) {
          // 通过Vue实例发送日志
          const vue = this.game.registry.get('vue')
          if (vue) vue.addLog(type, msg)
        }

        _runScene (idx) {
          const s = this.scenes[idx]
          if (!s) return

          // 停止所有剧本角色的移动和动画
          this.scriptChars.forEach(c => {
            c.setVelocity(0)
            if (c._walkCheckEvent) {
              c._walkCheckEvent.remove()
              c._walkCheckEvent = null
            }
            if (c._typeTween) {
              c._typeTween.stop()
              c._typeTween = null
            }
          })

          s.setup(this)

          this.sceneTimer = this.time.delayedCall(s.duration, () => {
            this._runScene((idx + 1) % this.scenes.length)
          })
        }

        _walkPath (sprite, key, path, onDone, loop = false) {
          if (!path || path.length === 0) {
            if (onDone) onDone()
            return
          }

          const walkNext = (index) => {
            if (index >= path.length) {
              if (loop) {
                walkNext(0)
              } else if (onDone) {
                onDone()
              }
              return
            }

            const next = path[index]
            this._walkTo(sprite, key, next.tx, next.ty, () => {
              walkNext(index + 1)
            })
          }

          walkNext(0)
        }

        _walkTo (sprite, key, tx, ty, onDone) {
          const targetX = tx * TILE + 16
          const targetY = ty * TILE + 16 - 8
          const speed = 90

          // 停止打字动画
          if (sprite._typeTween) {
            sprite._typeTween.stop()
            sprite._typeTween = null
          }

          const dx = targetX - sprite.x
          const dy = targetY - sprite.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 4) {
            sprite.setVelocity(0)
            if (onDone) onDone()
            return
          }

          // 选择动画方向
          let anim
          if (Math.abs(dx) > Math.abs(dy)) {
            anim = dx > 0 ? `${key}_right` : `${key}_left`
            sprite.facing = dx > 0 ? 'right' : 'left'
          } else {
            anim = dy > 0 ? `${key}_down` : `${key}_up`
            sprite.facing = dy > 0 ? 'down' : 'up'
          }
          sprite.play(anim, true)

          const vx = (dx / dist) * speed
          const vy = (dy / dist) * speed
          sprite.setVelocity(vx, vy)

          // 移除旧的事件
          if (sprite._walkCheckEvent) {
            sprite._walkCheckEvent.remove()
          }

          // 每帧检查是否到达
          sprite._walkCheckEvent = this.time.addEvent({
            delay: 30,
            loop: true,
            callback: () => {
              const cx = targetX - sprite.x
              const cy = targetY - sprite.y
              const currentDist = Math.sqrt(cx * cx + cy * cy)

              if (currentDist < 5) {
                sprite.setVelocity(0)
                sprite.setPosition(targetX, targetY)
                if (sprite._walkCheckEvent) {
                  sprite._walkCheckEvent.remove()
                  sprite._walkCheckEvent = null
                }
                if (onDone) onDone()
              } else {
                // 更新方向和速度
                const ndx = targetX - sprite.x
                const ndy = targetY - sprite.y
                const nd = Math.sqrt(ndx * ndx + ndy * ndy)

                let nanim
                if (Math.abs(ndx) > Math.abs(ndy)) {
                  nanim = ndx > 0 ? `${key}_right` : `${key}_left`
                } else {
                  nanim = ndy > 0 ? `${key}_down` : `${key}_up`
                }
                sprite.play(nanim, true)
                sprite.setVelocity((ndx / nd) * speed, (ndy / nd) * speed)
              }
            }
          })
        }

        // 打字动画（小幅上下抖动）
        _typeLoop (sprite, key, dir = 'down') {
          sprite.play(`${key}_${dir}`, true)
          sprite.setVelocity(0)
          if (sprite._typeTween) sprite._typeTween.stop()

          sprite._typeTween = this.tweens.add({
            targets: sprite,
            y: sprite.y - 1,
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          })
        }

        update () {
          // 深度排序 - 根据Y坐标
          if (this.allChars) {
            this.allChars.forEach(c => {
              c.setDepth(100 + Math.floor(c.y))
            })
          }

          // 玩家控制
          if (!this.cursors || !this.controlledChar) return
          const speed = 120
          const char = this.controlledChar
          const key = this.controlledKey

          // 停止自动移动
          if (char._walkCheckEvent) {
            char._walkCheckEvent.remove()
            char._walkCheckEvent = null
          }
          if (char._typeTween) {
            char._typeTween.stop()
            char._typeTween = null
          }

          char.setVelocity(0)

          let moved = false
          if (this.cursors.left.isDown) {
            char.setVelocityX(-speed)
            char.play(`${key}_left`, true)
            char.facing = 'left'
            moved = true
          } else if (this.cursors.right.isDown) {
            char.setVelocityX(speed)
            char.play(`${key}_right`, true)
            char.facing = 'right'
            moved = true
          } else if (this.cursors.up.isDown) {
            char.setVelocityY(-speed)
            char.play(`${key}_up`, true)
            char.facing = 'up'
            moved = true
          } else if (this.cursors.down.isDown) {
            char.setVelocityY(speed)
            char.play(`${key}_down`, true)
            char.facing = 'down'
            moved = true
          }

          if (!moved) {
            char.setVelocity(0)
            char.play(`${key}_idle_${char.facing}`, true)
          }
        }
      }

      this.game = new Phaser.Game({
        type: Phaser.AUTO,
        width: MW,
        height: MH,
        parent: wrap,
        backgroundColor: '#f7f9ff',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false
          }
        },
        scene: [OfficeScene],
        pixelArt: true,
        roundPixels: true,
        scale: { mode: Phaser.Scale.NONE }
      })

      // 注册Vue实例供场景使用
      this.game.registry.set('vue', this)

      this.game.events.once('ready', () => {
        const t = setTimeout(() => this.resizeGame(), 50)
        if (Array.isArray(this.timers)) this.timers.push(t)
      })
      this.ro = new ResizeObserver(() => this.resizeGame())
      this.ro.observe(wrap)
      window.addEventListener('resize', this.resizeGame, { passive: true })
      ;[0, 200, 500].forEach(ms => {
        const t = setTimeout(() => this.resizeGame(), ms)
        if (Array.isArray(this.timers)) this.timers.push(t)
      })
    },

    startMonitor () {
      const MAX = 50
      const tick = () => {
        this.cv = Math.min(95, Math.max(5, this.cv + (Math.random() - 0.5) * 10))
        this.mv = Math.min(85, Math.max(40, this.mv + (Math.random() - 0.5) * 6))
        this.nv = Math.min(90, Math.max(5, this.nv + (Math.random() - 0.5) * 14))
        const cv = Math.round(this.cv); const mv = Math.round(this.mv); const nv = Math.round(this.nv)
        const bw = Math.round(this.nv * 8.5)
        this.stats[0].val = cv + '%'; this.stats[1].val = mv + '%'
        this.stats[2].val = bw + ' kb/s'; this.stats[3].val = Math.round(this.nv * 0.4) + '%'
        this.bars[0].val = cv + '%'; this.bars[0].pct = cv
        this.bars[1].val = mv + '%'; this.bars[1].pct = mv
        this.bars[2].val = bw + ' kb/s'; this.bars[2].pct = nv
        if (!this.hist) this.hist = { cpu: [], mem: [], net: [] }
        const vals = { cpu: this.cv, mem: this.mv, net: this.nv }
          ;['cpu', 'mem', 'net'].forEach(k => {
          this.hist[k].push(vals[k])
          if (this.hist[k].length > MAX) this.hist[k].shift()
        })
        this.drawSpark()
      }
      tick()
      this.timers.push(setInterval(tick, 900))
    },

    drawSpark () {
      const cvs = this.$refs.spark
      if (!cvs) return
      const ctx = cvs.getContext('2d')
      const W = cvs.offsetWidth; const H = cvs.offsetHeight
      if (!W || !H) return
      cvs.width = W; cvs.height = H; ctx.clearRect(0, 0, W, H)
      const MAX = 50
      if (!this.hist) return
      const sets = [
        { d: this.hist.cpu, c: '#1677ff', l: 'CPU' },
        { d: this.hist.mem, c: '#52c41a', l: 'MEM' },
        { d: this.hist.net, c: '#722ed1', l: 'NET' }
      ]
      sets.forEach(({ d, c }) => {
        if (d.length < 2) return
        ctx.beginPath(); ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.85
        d.forEach((v, i) => {
          const x = (i / (MAX - 1)) * W; const y = H - (v / 100) * (H - 8) - 4
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        ctx.stroke(); ctx.globalAlpha = 1
      })
      sets.forEach(({ c, l }, i) => {
        ctx.fillStyle = c; ctx.fillRect(6 + i * 52, 5, 10, 3)
        ctx.fillStyle = '#8c8c8c'; ctx.font = '10px sans-serif'; ctx.fillText(l, 18 + i * 52, 13)
      })
    },

    startClock () {
      const tick = () => {
        const n = new Date(); const p = v => String(v).padStart(2, '0')
        this.nowTime = `${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`
        this.$nextTick(() => {
          const b = this.$refs.logBody
          if (b) b.scrollTop = b.scrollHeight
        })
      }
      tick()
      this.timers.push(setInterval(tick, 1000))
    }
  }
}
</script>

<style lang="scss" scoped>
.office-root {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 60fr 40fr;
  width: 100%;
  height: 100%;
  gap: 10px;
  padding: 10px;
  background: #f0f2f5;
  box-sizing: border-box;
  overflow: hidden;
  min-height: 0;
}

.panel {
  background: #fff;
  border-radius: 8px;
  border: 0.5px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .04);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 40px;
  border-bottom: 0.5px solid #f0f0f0;
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #1a1a2e;
}

.title-accent {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  flex-shrink: 0;
}

.panel-tag {
  font-size: 11px;
  color: #8c8c8c;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.panel-body {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  position: relative;
}

.badge-online {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #389e0d;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  padding: 2px 8px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #52c41a;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1
  }

  50% {
    opacity: .3
  }
}

.phaser-wrap {
  background: #f7f9ff;
  position: relative;
}

.live-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #ff4d4f;
  font-weight: 500;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff4d4f;
  animation: pulse 1.2s ease-in-out infinite;
}

.log-body {
  padding: 8px 14px;
  overflow-y: auto;
  font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
  font-size: 12px;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #e8e8e8;
    border-radius: 2px;
  }
}

.log-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 2px 0;
  line-height: 1.8;
}

.log-time {
  font-size: 11px;
  color: #c0c0c0;
  flex-shrink: 0;
  min-width: 56px;
}

.log-icon {
  font-size: 12px;
  flex-shrink: 0;
  min-width: 12px;

  &.lc-ok {
    color: #52c41a;
  }

  &.lc-info {
    color: #1677ff;
  }

  &.lc-warn {
    color: #faad14;
  }

  &.lc-dim {
    color: #d9d9d9;
  }

  &.lc-err {
    color: #ff4d4f;
  }
}

.log-msg {
  color: #434343;
  font-size: 12px;
}

.log-cursor {
  display: inline-block;
  width: 7px;
  height: 13px;
  background: #1677ff;
  border-radius: 1px;
  vertical-align: text-bottom;
  animation: blink 1s step-end infinite;
}

@keyframes blink {

  0%,
  100% {
    opacity: 1
  }

  50% {
    opacity: 0
  }
}

.members-body {
  overflow-y: auto;
  padding: 2px 0;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #e8e8e8;
    border-radius: 2px;
  }
}

.mrow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 16px;
  border-bottom: 0.5px solid #f5f5f5;
  transition: background .15s;

  &:hover {
    background: #fafafa;
  }

  &.last {
    border-bottom: none;
  }
}

.mavatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
  border: 1.5px solid transparent;
}

.minfo {
  flex: 1;
  min-width: 0;
}

.mtop {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mname {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a2e;
}

.mrole {
  font-size: 11px;
  color: #8c8c8c;
}

.mdoing {
  font-size: 11px;
  color: #595959;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mbadge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  flex-shrink: 0;

  &.bs-online {
    color: #389e0d;
    background: #f6ffed;
    border: 1px solid #b7eb8f;
  }

  &.bs-busy {
    color: #cf1322;
    background: #fff1f0;
    border: 1px solid #ffa39e;
  }

  &.bs-away {
    color: #d46b08;
    background: #fff7e6;
    border: 1px solid #ffd591;
  }
}

.monitor-body {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  flex-shrink: 0;
}

.stat-card {
  background: #fafafa;
  border-radius: 6px;
  padding: 6px 10px;
  border: 0.5px solid #f0f0f0;
}

.sv {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
}

.sl {
  font-size: 10px;
  color: #8c8c8c;
  margin-top: 1px;
}

.bar-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.bh {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
}

.bl {
  font-size: 11px;
  color: #8c8c8c;
}

.bv {
  font-size: 11px;
  font-weight: 500;
}

.bt {
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.bf {
  height: 100%;
  border-radius: 2px;
  transition: width .4s ease;
}

.spark-area {
  flex: 1;
  min-height: 0;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
