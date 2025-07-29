<template>
    <div @click="click">
      <svg
        :class="{'is-active':isFullscreen}"
        class="screenfull-svg"
        t="1492500959545"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="2069"
        width="16"
        height="16"
      >
        <path d="M333.493443 428.647617 428.322206 333.832211 262.572184 168.045297 168.045297 262.572184Z" p-id="2070" />
        <path d="M855.954703 761.427816 761.427816 855.954703 595.677794 690.167789 690.506557 595.352383Z" p-id="2071" />
        <path d="M690.506557 428.647617 855.954703 262.572184 761.427816 168.045297 595.677794 333.832211Z" p-id="2072" />
        <path d="M333.493443 595.352383 428.322206 690.167789 262.572184 855.954703 168.045297 761.427816Z" p-id="2073" />
      </svg>
    </div>
  </template>

<script>
export default {
  name: 'Screenfull',
  data () {
    return {
      isFullscreen: false
    }
  },
  mounted () {
    document.addEventListener('fullscreenchange', this.change)
    document.addEventListener('mozfullscreenchange', this.change)
    document.addEventListener('webkitfullscreenchange', this.change)
    document.addEventListener('msfullscreenchange', this.change)
  },
  beforeDestroy () {
    document.removeEventListener('fullscreenchange', this.change)
    document.removeEventListener('mozfullscreenchange', this.change)
    document.removeEventListener('webkitfullscreenchange', this.change)
    document.removeEventListener('msfullscreenchange', this.change)
  },
  methods: {
    click () {
      if (this.isFullscreen) {
        this.exit()
      } else {
        this.request()
      }
    },
    request () {
      const element = document.documentElement
      if (element.requestFullscreen) {
        element.requestFullscreen()
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen()
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen()
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen()
      }
    },
    exit () {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
    },
    change () {
      this.isFullscreen = !!(
        document.fullscreenElement ||
          document.mozFullScreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
      )
    }
  }
}
</script>

  <style scoped>
  .screenfull-svg {
    display: inline-block;
    cursor: pointer;
    fill: #5a5e66;
    width: 20px;
    height: 20px;
    vertical-align: 10px;
  }
  </style>
