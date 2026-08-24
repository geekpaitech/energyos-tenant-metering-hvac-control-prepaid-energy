<template>
  <div class="car-wrapper">
    <div v-if="!enableDistributionDiagram" class="empty-page">
      <i class="el-icon-data-analysis empty-icon"></i>
      <div class="empty-title">暂无数据</div>
      <div class="empty-desc">配电图数据暂未接入</div>
    </div>
    <template v-else>
      <div class="demo-badge">
      <div class="demo-badge-content">
        <div class="demo-icon">
          <i class="el-icon-view"></i>
        </div>
        <div class="demo-text">
          <div class="demo-title">即将开放</div>
          <div class="demo-subtitle">COMING SOON</div>
        </div>
        <div class="demo-pulse"></div>
      </div>
      <div class="demo-tag">
        <i class="el-icon-info"></i>
       当前为模拟数据
      </div>
    </div>
    <div ref="carContainer" class="car-wrapper-1"></div>
    <el-dialog
      :title="fCircuitname"
      :close-on-click-modal="false"
      :visible.sync="showTableModal"
      class="anjineng-modal anjineng-table-modal"
      width="80%"
      :modal="false"
      @open="ininDialog"
    >
      <!-- 一级Tab -->
      <el-tabs v-model="activeName" type="card" style="padding-top: 20px;">
        <!-- 日原始数据 -->
        <el-tab-pane label="电压" name="first">
          <el-table
            :data="tableData['0']"
            border
            :highlight-current-row="true"
            :header-cell-style="{background:'#FFF', color: '#999'}"
            :row-style="{background:'#f2f2f2', color: '#999'}"
            style="width: 100%;"
            height="calc(100vh - 420px)"
          >
            <el-table-column align="center" prop="paramsName" label="参数名称" />
            <el-table-column align="center" prop="fValue" label="最新值" />
            <el-table-column align="center" label="当日极值">
              <el-table-column align="center" label="最大值">
                <el-table-column align="center" prop="max" label="数值" />
                <el-table-column align="center" prop="maxTime" label="发生时间" />
              </el-table-column>
              <el-table-column align="center" label="最小值">
                <el-table-column align="center" prop="min" label="数值" />
                <el-table-column align="center" prop="minTime" label="发生时间" />
              </el-table-column>
            </el-table-column>
            <el-table-column align="center" prop="avg" label="平均值" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="电流" name="second">
          <el-table
            :data="tableData['1']"
            border
            :highlight-current-row="true"
            :header-cell-style="{background:'#FFF', color: '#999'}"
            :row-style="{background:'#f2f2f2', color: '#999'}"
            style="width: 100%;"
            height="calc(100vh - 320px)"
          >
            <el-table-column align="center" prop="paramsName" label="参数名称" />
            <el-table-column align="center" prop="fValue" label="最新值" />
            <el-table-column align="center" label="当日极值">
              <el-table-column align="center" label="最大值">
                <el-table-column align="center" prop="max" label="数值" />
                <el-table-column align="center" prop="maxTime" label="发生时间" />
              </el-table-column>
              <el-table-column align="center" label="最小值">
                <el-table-column align="center" prop="min" label="数值" />
                <el-table-column align="center" prop="minTime" label="发生时间" />
              </el-table-column>
            </el-table-column>
            <el-table-column align="center" prop="avg" label="平均值" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="功率" name="third">
          <el-table
            :data="tableData['2']"
            border
            :highlight-current-row="true"
            :header-cell-style="{background:'#FFF', color: '#999'}"
            :row-style="{background:'#f2f2f2', color: '#999'}"
            style="width: 100%;"
            height="calc(100vh - 320px)"
          >
            <el-table-column align="center" prop="paramsName" label="参数名称" />
            <el-table-column align="center" prop="fValue" label="最新值" />
            <el-table-column align="center" label="当日极值">
              <el-table-column align="center" label="最大值">
                <el-table-column align="center" prop="max" label="数值" />
                <el-table-column align="center" prop="maxTime" label="发生时间" />
              </el-table-column>
              <el-table-column align="center" label="最小值">
                <el-table-column align="center" prop="min" label="数值" />
                <el-table-column align="center" prop="minTime" label="发生时间" />
              </el-table-column>
            </el-table-column>
            <el-table-column align="center" prop="avg" label="平均值" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="电能" name="four">
          <el-table
            :data="tableData['3']"
            border
            :highlight-current-row="true"
            :header-cell-style="{background:'#FFF', color: '#999'}"
            :row-style="{background:'#f2f2f2', color: '#999'}"
            style="width: 100%;"
            height="calc(100vh - 320px)"
          >
            <el-table-column align="center" prop="paramsName" label="参数名称" />
            <el-table-column align="center" prop="fValue" label="最新值" />
            <el-table-column align="center" label="当日极值">
              <el-table-column align="center" label="最大值">
                <el-table-column align="center" prop="max" label="数值" />
                <el-table-column align="center" prop="maxTime" label="发生时间" />
              </el-table-column>
              <el-table-column align="center" label="最小值">
                <el-table-column align="center" prop="min" label="数值" />
                <el-table-column align="center" prop="minTime" label="发生时间" />
              </el-table-column>
            </el-table-column>
            <el-table-column align="center" prop="avg" label="平均值" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="不平衡度" name="five">
          <el-table
            :data="tableData['4']"
            border
            :highlight-current-row="true"
            :header-cell-style="{background:'#FFF', color: '#999'}"
            :row-style="{background:'#f2f2f2', color: '#999'}"
            style="width: 100%;"
            height="calc(100vh - 320px)"
          >
            <el-table-column align="center" prop="paramsName" label="参数名称" />
            <el-table-column align="center" prop="fValue" label="最新值" />
            <el-table-column align="center" label="当日极值">
              <el-table-column align="center" label="最大值">
                <el-table-column align="center" prop="max" label="数值" />
                <el-table-column align="center" prop="maxTime" label="发生时间" />
              </el-table-column>
              <el-table-column align="center" label="最小值">
                <el-table-column align="center" prop="min" label="数值" />
                <el-table-column align="center" prop="minTime" label="发生时间" />
              </el-table-column>
            </el-table-column>
            <el-table-column align="center" prop="avg" label="平均值" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="当月最大需量" name="six">
          <el-table
            :data="tableData['5']"
            border
            :highlight-current-row="true"
            :header-cell-style="{background:'#FFF', color: '#999'}"
            :row-style="{background:'#f2f2f2', color: '#999'}"
            style="width: 100%;"
            height="calc(100vh - 320px)"
          >
            <el-table-column align="center" prop="paramsName" label="参数名称" />
            <el-table-column align="center" prop="fValue" label="最新值" />
            <el-table-column align="center" label="当日极值">
              <el-table-column align="center" label="最大值">
                <el-table-column align="center" prop="max" label="数值" />
                <el-table-column align="center" prop="maxTime" label="发生时间" />
              </el-table-column>
              <el-table-column align="center" label="最小值">
                <el-table-column align="center" prop="min" label="数值" />
                <el-table-column align="center" prop="minTime" label="发生时间" />
              </el-table-column>
            </el-table-column>
            <el-table-column align="center" prop="avg" label="平均值" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
    </template>
  </div>
</template>

<script>
import Konva from 'konva'
import { mapGetters } from 'vuex'
import svgData from './svgInfo.json'
import currentData from './currentVal.json'
export default {
  data () {
    return {
      SOURCE: require('@/assets/images/floors/test02.svg'), // diagram.svg
      konvaStage: null,
      layer: null,
      svgLayer: null,
      tooltipLayer: null,
      tooltip: null,
      svgWidth: 1588,
      svgHeight: 1123,
      svgInfo: svgData,
      currentData: currentData,
      svgScale: 1,
      showTableModal: false,
      activeName: 'first',
      fCircuitname: '进线',
      timer: '',
      tableData: {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: []
      },
      paramsMap: {
        Ua: { type: '0', name: 'A相电压' },
        Ub: { type: '0', name: 'B相电压' },
        Uc: { type: '0', name: 'C相电压' },
        Uab: { type: '0', name: 'AB线电压' },
        Ubc: { type: '0', name: 'BC线电压' },
        Uca: { type: '0', name: 'CA线电压' },
        Ia: { type: '1', name: 'A相电流' },
        Ib: { type: '1', name: 'B相电流' },
        Ic: { type: '1', name: 'C相电流' },
        P: { type: '2', name: '有功功率' },
        Q: { type: '2', name: '无功功率' },
        S: { type: '2', name: '视在功率' },
        PF: { type: '2', name: '功率因数' },
        EPI: { type: '3', name: '正向有功总电能' }
      }
    }
  },
  computed: {
    ...mapGetters(['currentManager']),
    enableDistributionDiagram () {
      const name =
        (this.currentManager && (this.currentManager.managerName || this.currentManager.name)) ||
        ''
      return String(name).includes('数字物宇')
    }
    // svgScale () {
    //   const containerWidth = this.$refs.svgEnergyContainer?.offsetWidth || this.svgWidth
    //   return containerWidth / this.svgWidth // 基于SVG原始宽度1149计算
    // }
  },
  watch: {
    enableDistributionDiagram: {
      immediate: true,
      handler (enabled) {
        if (enabled) {
          this.$nextTick(() => this.initKonva())
        } else {
          window.removeEventListener('resize', this.applyScale)
          if (this.konvaStage) {
            this.konvaStage.destroy()
            this.konvaStage = null
          }
        }
      }
    }
  },
  mounted () {
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.applyScale)
    if (this.konvaStage) {
      this.konvaStage.destroy()
    }
  },
  methods: {
    ininDialog () {
      this.setDialog()
    },
    async initKonva () {
      // 销毁旧实例
      if (this.konvaStage) {
        this.konvaStage.destroy()
        window.removeEventListener('resize', this.applyScale)
      }
      // 获取容器实际尺寸
      const container = this.$refs.carContainer
      const containerWidth = container.offsetWidth
      const containerHeight = container.offsetHeight
      this.konvaStage = new Konva.Stage({
        container: container,
        width: containerWidth,
        height: containerHeight
        // draggable: true
      })
      this.layer = new Konva.Layer()
      this.konvaStage.add(this.layer)

      await this.loadKonvaSvg()
      await this.setSVG()
      // this.initDeviceGroups() // 初始化设备分组
      // this.addTooltip()
      this.$nextTick(() => {
        window.addEventListener('resize', this.applyScale)
        // this.applyScale()
      })
      this.konvaStage.batchDraw()
    },
    async loadKonvaSvg () {
      try {
        const konvaImage = await new Promise((resolve, reject) => {
          Konva.Image.fromURL(this.SOURCE.default, (img) => {
            img ? resolve(img) : reject(new Error('图片加载失败'))
          })
        })

        // 获取原始SVG尺寸
        const naturalSize = {
          w: konvaImage.image().naturalWidth,
          h: konvaImage.image().naturalHeight
        }
        this.svgWidth = naturalSize.w
        this.svgHeight = naturalSize.h
        const scale = this.svgScale

        // 应用缩放并定位
        konvaImage
          .width(naturalSize.w * scale)
          .height(naturalSize.h * scale)
          .position({ x: 0, y: 0 })
          .draggable(false)

        this.layer.add(konvaImage)
        this.layer.batchDraw()

        // 触发尺寸更新
        this.$nextTick(() => {
          window.dispatchEvent(new Event('resize'))
        })
      } catch (error) {
        console.error('图片加载失败:', error)
        this.$message.error('楼层图纸加载失败')
      }
    },
    async setSVG () {
      try {
      // 加载SVG文件内容
        const response = await fetch(this.SOURCE.default)
        const svgText = await response.text()

        // 创建SVG DOM解析器
        const parser = new DOMParser()
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')

        // 创建Konva组并设置初始缩放
        this.svgLayer = new Konva.Layer()
        const svgGroup = new Konva.Group({
          scaleX: this.svgScale,
          scaleY: this.svgScale
        })

        // 解析路径元素
        const pathDoc = svgDoc
        // console.log(pathDoc, 'pathDoc===')
        // console.log(this.svgInfo, 'svgInfo==')

        pathDoc.querySelectorAll('g').forEach(g => {
          // console.log(g.id, 'g.id===')
          const gItem = this.svgInfo.filter(item => item.fCircuitid === g.id)

          if (gItem.length) {
            // console.log(gItem, 'gItem==')
            if (gItem[0].meterParamValues.length) {
              if (g.id !== '051200010023') {
                this.addText(g, gItem[0].meterParamValues, svgGroup, g.id)
              }

              // const pos = g.getPointerPosition()
              // // 转换为原始SVG坐标系
              // const rawX = pos.x / this.svgScale
              // const rawY = pos.y / this.svgScale
              // console.log(rawX, rawY, '===')
              // const arr = gItem[0].meterParamValues
              // arr.forEach(txt => {
              //   // let label = txt.fParamcode;
              //   // let val = txt.fValuejoinunit;
              //   // var simpleText = new Konva.Text({
              //   //   x: ,
              //   //   y: ,
              //   //   text: label+': '+val,
              //   //   fontSize: 30,
              //   //   fontFamily: 'Calibri',
              //   //   fill: 'green'
              //   // });
              // })
            }
            // console.log(gItem[0].meterParamValues, 'gItem===')
            // console.log(g, 'g=====')
          }
        })

        // pathDoc.querySelectorAll('path').forEach(path => {
        //   // console.log(path, 'text===')
        //   var svgPath = new Konva.Path({
        //     id: path.id,
        //     data: path.getAttribute('d'),
        //     fill: path.getAttribute('fill'),
        //     stroke: path.getAttribute('stroke'),
        //     strokeWidth: parseFloat(path.getAttribute('stroke-width') || 0.48),
        //     lineJoin: path.getAttribute('stroke-linejoin'),
        //     lineCap: path.getAttribute('stroke-linecap'),
        //     miterLimit: path.getAttribute('stroke-miterlimit'),
        //     listening: true, // 启用事件监听
        //     hitStrokeWidth: 10, // 扩大点击区域
        //     name: 'svgPath' // 添加可识别名称
        //     // opacity: 0.6, // 透明度(0-1)
        //     // shadowColor: 'this.getTemperatureColor(tempData.temperature)', // 阴影颜色
        //     // shadowBlur: 10,

        //   })
        //   svgGroup.add(svgPath)
        // })

        // 解析矩形元素

        // pathDoc.querySelectorAll('rect').forEach(rect => {
        //   svgGroup.add(new Konva.Rect({
        //     id: rect.id,
        //     x: parseFloat(rect.getAttribute('x')),
        //     y: parseFloat(rect.getAttribute('y')),
        //     width: parseFloat(rect.getAttribute('width')),
        //     height: parseFloat(rect.getAttribute('height')),
        //     fill: rect.getAttribute('fill')
        //     // stroke: '#C1DD6E',
        //     // strokeWidth: 0.48
        //   }))
        // })

        // pathDoc.querySelectorAll('path').forEach(path => {
        //   var svgPath = new Konva.Path({
        //     id: path.id,
        //     data: path.getAttribute('d'),
        //     fill: path.getAttribute('fill'),
        //     stroke: path.getAttribute('stroke'),
        //     strokeWidth: parseFloat(path.getAttribute('stroke-width') || 0.48),
        //     lineJoin: path.getAttribute('stroke-linejoin'),
        //     lineCap: path.getAttribute('stroke-linecap'),
        //     miterLimit: path.getAttribute('stroke-miterlimit'),
        //     listening: true, // 启用事件监听
        //     hitStrokeWidth: 10, // 扩大点击区域
        //     name: 'svgPath' // 添加可识别名称
        //     // opacity: 0.6, // 透明度(0-1)
        //     // shadowColor: 'this.getTemperatureColor(tempData.temperature)', // 阴影颜色
        //     // shadowBlur: 10,

        //   })
        //   svgGroup.add(svgPath)
        // })
        // svgGroup.on('mousemove', (e) => {
        //   const id = e.target.attrs.id
        //   // const temp = this.svgLayer.findOne('#' + id)

        //   var shape = e.target
        //   const fillColor = e.target.attrs.fill
        //   if (shape && fillColor) {
        //     console.log(id, e.target.attrs.fill, 'click===')
        //     const pos = e.target.getStage().getPointerPosition()
        //     // 转换为原始SVG坐标系
        //     const rawX = pos.x / this.svgScale
        //     const rawY = pos.y / this.svgScale
        //     // var mousePos = e.target.getStage().getPointerPosition()
        //     // var x = mousePos.x
        //     // var y = mousePos.y - 5
        //     this.updateTooltip(rawX, rawY, fillColor, id)
        //     this.tooltipLayer.batchDraw()
        //   }
        // })
        // svgGroup.on('mouseout', (e) => {
        //   this.tooltip.hide()
        //   this.tooltipLayer.draw()
        // })

        // 将组添加到图层
        this.svgLayer.destroyChildren()
        this.svgLayer.add(svgGroup)
        this.konvaStage.add(this.svgLayer)
        this.konvaStage.batchDraw()

        // 触发尺寸更新
        this.$nextTick(() => {
          window.dispatchEvent(new Event('resize'))
        })
      } catch (error) {
        console.error('SVG加载失败:', error)
        this.$message.error('楼层图纸加载失败，请检查文件路径')
      }
    },
    addText (xml, arr, svgGroup, gId) {
      // console.log(gId, 'gId===')
      // var simpleText = new Konva.Text({
      //   x: 100,
      //   y: 100,
      //   text: '测试测试00000000',
      //   fontSize: 8,
      //   fontFamily: 'Calibri',
      //   fill: 'green'
      // })
      // svgGroup.add(simpleText)
      let rectX = 0
      let rectY = 0
      // console.log(arr.length, 'arr.length===')

      xml.querySelectorAll('path').forEach((path, index) => {
        const name = path.getAttribute('data-name')
        const nameArr = arr.filter(item => item.fParamcode === name)
        if (nameArr.length) {
          const [_, x, y] = path.getAttribute('d').match(/M([\d.]+)\s+([\d.]+)/)
          // console.log(path, x, y, 'path==')

          if (index === 0) {
            rectX = parseFloat(x)
            rectY = parseFloat(y)
            let rect = null
            // console.log(gId, 'gId===')
            if (gId === '051200010021') { // 051200010021 进线柜
              // console.log(rectX, rectY, '进线柜rectY===')
              rect = new Konva.Rect({
                x: rectX - 4,
                y: rectY - 42,
                // stroke: '#555',
                // strokeWidth: 1,
                fill: '#fff',
                width: 100,
                height: 76,
                id: gId
              })
              svgGroup.add(rect)
            } else if (gId === '0512000100230000') { // 051200010023 无功补偿柜
              // console.log('无功补偿柜===')
              // console.log(rectX, rectY, '无功补偿柜rectY===')
              rect = new Konva.Rect({
                x: rectX,
                y: rectY,
                fill: '#fff',
                width: 116,
                height: 76,
                stroke: '#555',
                strokeWidth: 1,
                id: gId
                // fill: 'green'
              })
              svgGroup.add(rect)
            } else {
              rect = new Konva.Rect({
                x: rectX,
                y: rectY - 10,
                fill: '#fff',
                width: 40,
                height: 60,
                id: gId
                // stroke: '#555',
                // strokeWidth: 1,
                // fill: 'green'
              })
              svgGroup.add(rect)
            }
            // rect && svgGroup.add(rect)
          }
          var simpleText = new Konva.Text({
            x: x,
            y: y,
            text: name + ': ' + nameArr[0].fValuejoinunit,
            fontSize: 7,
            fontFamily: 'Calibri',
            fill: path.getAttribute('fill'),
            id: gId
          })
          svgGroup.add(simpleText)
        }
      })
      svgGroup.on('click', (e) => {
        console.log(e.target.attrs, 'e.target.attrs==')
        this.showTableModal = true

        // this.fCircuitname = c.fCircuitname;
      })
    },
    setDialog () {
      console.log(this.currentData, 'this.currentData===')
      this.tableData = {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: []
      }
      for (let index = 0; index < this.currentData.length; index++) {
        const item = this.currentData[index]
        const vType = item.fParamCode
        item.paramsName = this.paramsMap[vType].name
        this.tableData[this.paramsMap[vType].type].push(item)
      }
    },
    updateTooltip (x, y, fillColor, id) {
      let text = ''
      if (fillColor === '#89BC6F') {
        text = '可用车位'
      } else if (fillColor === '#89BC6F') {
        text = '不可用车位'
      } else if (fillColor === '#2D2D2D' || fillColor === '#89BC6F') {
        text = '充电桩车位'
      } else if (fillColor === '#808080' || fillColor === '#89BC6F') {
        text = '残障车位'
      } else if (fillColor === '#F0A49E' || fillColor === '#89BC6F') {
        text = '不可用车位'
      }
      // hello world\n丙类厂房
      if (text) {
        text = id + '\n' + text
        this.tooltip.getText().text(text)
        this.tooltip.position({
          x: x,
          y: y
        })
        this.tooltip.show()
      }
    },
    addTooltip () {
      this.tooltipLayer = new Konva.Layer()
      this.tooltip = new Konva.Label({
        x: 500,
        y: 400,
        opacity: 0.75,
        visible: false,
        listening: false
      })

      this.tooltip.add(
        new Konva.Tag({
          fill: 'black',
          pointerDirection: 'down',
          pointerWidth: 10,
          pointerHeight: 10,
          lineJoin: 'round',
          shadowColor: 'black',
          shadowBlur: 10,
          shadowOffsetX: 10,
          shadowOffsetY: 10,
          shadowOpacity: 0.5
        })
      )
      this.tooltip.add(
        new Konva.Text({
          text: '',
          fontFamily: 'Calibri',
          fontSize: 18,
          padding: 5,
          fill: 'white'
        })
      )
      this.tooltipLayer.add(this.tooltip)
      this.konvaStage.add(this.tooltipLayer)
      this.tooltipLayer.draw()
    }
  }
}
</script>
<style lang="scss" scoped>
.car-wrapper {
  width: 100%;
  height: 100vh;
  .car-wrapper-1 {
    width: 100%;
    height: 100vh;
  }
}

.empty-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.empty-icon {
  font-size: 64px;
  color: #c0c4cc;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 16px;
  color: #303133;
  margin-bottom: 6px;
}

.empty-desc {
  font-size: 13px;
  color: #909399;
}

.demo-badge {
  position: fixed;
  right: 30px;
  top: 55%;
  transform: translateY(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: slideInRight 0.5s ease-out;

  .demo-badge-content {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    padding: 14px 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow:
      0 10px 40px rgba(59, 130, 246, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1) inset,
      0 0 30px rgba(59, 130, 246, 0.4);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg,
          transparent 30%,
          rgba(255, 255, 255, 0.1) 50%,
          transparent 70%);
      animation: shimmer 3s infinite;
    }

    .demo-icon {
      width: 36px;
      height: 36px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);

      i {
        animation: pulse 2s ease-in-out infinite;
      }
    }

    .demo-text {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .demo-title {
        font-size: 15px;
        font-weight: 700;
        color: white;
        letter-spacing: 0.5px;
      }

      .demo-subtitle {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.8);
        font-weight: 600;
        letter-spacing: 1px;
      }
    }

    .demo-pulse {
      width: 8px;
      height: 8px;
      background: #fbbf24;
      border-radius: 50%;
      position: relative;
      animation: pulse-dot 2s ease-in-out infinite;

      &::before {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 2px solid #fbbf24;
        border-radius: 50%;
        animation: pulse-ring 2s ease-in-out infinite;
      }
    }
  }

  .demo-tag {
    background: rgba(59, 130, 246, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(59, 130, 246, 0.3);
    padding: 8px 14px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #2563eb;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.15);

    i {
      font-size: 14px;
    }
  }
}
</style>
