<template>
  <span class="nandu-icon" :style="iconStyle" aria-hidden="true" />
</template>

<script>
const files = require.context('../assets/icons', false, /\.svg$/)
export default {
  name: 'NanduScreenIcon',
  props: { name: { type: String, required: true } },
  computed: {
    iconStyle () {
      const key = `./${this.name}.svg`
      if (!files.keys().includes(key)) return {}
      const asset = files(key)
      const url = asset.default || asset
      return { maskImage: `url("${url}")`, WebkitMaskImage: `url("${url}")` }
    }
  }
}
</script>

<style scoped>
.nandu-icon { display: inline-block; width: 1em; height: 1em; flex: 0 0 auto; background-color: currentColor; mask-size: contain; mask-repeat: no-repeat; mask-position: center; -webkit-mask-size: contain; -webkit-mask-repeat: no-repeat; -webkit-mask-position: center; }
</style>
