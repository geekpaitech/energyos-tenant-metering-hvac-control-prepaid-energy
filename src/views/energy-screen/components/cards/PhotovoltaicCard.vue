<template>
  <energy-panel title="光伏电站信息">
    <div class="pv-info">
      <dl>
        <div><dt>电站名称</dt><dd>{{ data.name }}</dd></div>
        <div>
          <dt>状态</dt>
          <dd>
            <i v-if="data.online !== null" class="online-dot" :class="{ offline: !data.online }" />
            {{ data.online === null ? '--' : (data.online ? '在线' : '离线') }}
          </dd>
        </div>
        <div><dt>装机容量</dt><dd>{{ data.capacity }}</dd></div>
        <div><dt>逆变器</dt><dd>{{ data.inverter }}</dd></div>
        <div><dt>电站地址</dt><dd class="is-address">{{ data.address }}</dd></div>
      </dl>
      <img
        v-if="data.available"
        class="solar-preview"
        src="https://wu-cloud.oss-cn-shanghai.aliyuncs.com/web-file/nandu.png"
        alt="南都广场光伏电站"
      >
      <div v-else class="solar-preview solar-preview--empty" aria-label="暂无光伏电站图片">
        <energy-icon name="solar" />
        <span>暂无电站图片</span>
      </div>
    </div>
  </energy-panel>
</template>

<script>
import EnergyPanel from '../EnergyPanel.vue'
import EnergyIcon from '../EnergyIcon.vue'

export default {
  name: 'EnergyPhotovoltaicCard',
  components: { EnergyPanel, EnergyIcon },
  props: { data: { type: Object, required: true } }
}
</script>
