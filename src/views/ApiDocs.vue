<!-- @format -->
<template>
  <div class="markdown-viewer">
      <div class="menu">
          <el-tree :data="tree" :default-expand-all="true" @node-click="scrollToSection"></el-tree>
      </div>
      <div class="html-body" v-html="htmlContent" />
  </div>
</template>

<script>
import {ref, onMounted, onBeforeUnmount, nextTick, reactive, toRefs} from 'vue'
export default {
  name: 'MarkdownViewer',

  setup() {
      const state = reactive({
          tree: [],
      })


      let htmlContent = ref('')

      onMounted(async () => {
          // window.addEventListener('beforeunload', handleBeforeUnload);
          // https://ebc-cloud.oss-cn-shanghai.aliyuncs.com/ebc-img/openApi_202408071709.md

          try {
              const res = await fetch(
                  'https://wu-cloud.oss-cn-shanghai.aliyuncs.com/doc/api_iot_console.html',
              )

              htmlContent.value = await res.text()

              await nextTick()
              // 存储级别ID
              let parentIdList = []
              let arr = []
              const qeyry = [...document.querySelectorAll(' h2, h3, h4, h5, h6')]
              qeyry.forEach((element, index) => {
                  let item = element.innerText
                  // 判断级别 并 －1 为存储下标
                  let length = item ? (item.indexOf('.') !== -1 ? item.split('.').length - 1 : 0) : -1
                  if (length !== -1) {
                      // 父级Id
                      let parentId = ''

                      let id = 10000 + index
                      let label = item

                      if (length === 0) {
                          // 判断 如果当前标题级别为0 且 存储中 0级别有值 那么重置存储级别ID
                          parentIdList = [id]
                          parentId = 0
                      } else {
                          parentIdList[length] = id
                          parentId = parentIdList[length - 1]
                      }

                      arr.push({
                          id,
                          label,
                          parentId,
                      })
                  }
              })
              let tree = []
              arr.forEach(item => {
                  if (item.parentId === 0) {
                      tree.push(convertTreeData(arr, item))
                  }
              })
              state.tree = tree
          } catch (error) {
              console.error('加载 HTML 文件失败', error)
          }
      })

      onBeforeUnmount(() => {
          // console.log('触发')
          // window.removeEventListener('beforeunload', handleBeforeUnload);
      })

      const handleBeforeUnload = event => {
          // 兼容性处理
          const message = '您确定要离开此页面吗？'
          event.preventDefault() // 标准规范
          event.returnValue = message // 兼容浏览器
          return message // 旧版浏览器
      }

      // 重置tree数据
      const convertTreeData = (arr, node) => {
          for (let i = 0; i < arr.length; i++) {
              if (arr[i].parentId === node.id) {
                  const res = convertTreeData(arr, arr[i])
                  if (node.children) {
                      node.children.push(res)
                  } else {
                      node.children = [res]
                  }
              }
          }
          return node
      }

      // 点击跳转
      const scrollToSection = row => {
          let section = row.label

          const el = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].find(element => {
              return element.innerText === section
          })
          if (el) {
              el.scrollIntoView({behavior: 'smooth'})
          }
      }

      return {
          ...toRefs(state),
          htmlContent,
          scrollToSection,
      }
  },
}
</script>

<style lang="scss">
.clear-float {
  visibility: hidden;
  opacity: 0;
  width: 100%;
  height: 1px;
}
.markdown-viewer {
  width: 100%;
  display: flex;
  background: #fff;
  position: relative;
  .menu {
      position: fixed;
      top: 110px;
      width: 400px;
      font-size: 30px;
      left: 30px;
      height: 85vh;
      overflow: hidden;
      cursor: pointer;
  }
  .menu:hover {
      overflow-y: scroll;
  }
}

.html-body {
  width: calc(100% - 400px);
  margin-left: 400px;
}
</style>