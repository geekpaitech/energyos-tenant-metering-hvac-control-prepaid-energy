<template>
  <transition name="region-floor-load">
    <div v-if="visible" class="region-floor-load" role="status" aria-live="polite">
      <div class="region-floor-load__card">
        <div class="region-floor-load__visual" aria-hidden="true">
          <svg
            class="region-floor-load__iso"
            viewBox="0 0 120 88"
            width="120"
            height="88"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="60" cy="78" rx="34" ry="6" fill="#0170FE" opacity=".08" />

            <g class="iso-floor iso-floor--3">
              <path class="iso-left" d="M28 52 L60 70 L60 76 L28 58 Z" />
              <path class="iso-right" d="M60 70 L92 52 L92 58 L60 76 Z" />
              <path class="iso-top" d="M28 52 L60 34 L92 52 L60 70 Z" />
            </g>
            <g class="iso-floor iso-floor--2">
              <path class="iso-left" d="M28 40 L60 58 L60 64 L28 46 Z" />
              <path class="iso-right" d="M60 58 L92 40 L92 46 L60 64 Z" />
              <path class="iso-top" d="M28 40 L60 22 L92 40 L60 58 Z" />
            </g>
            <g class="iso-floor iso-floor--1">
              <path class="iso-left" d="M28 28 L60 46 L60 52 L28 34 Z" />
              <path class="iso-right" d="M60 46 L92 28 L92 34 L60 52 Z" />
              <path class="iso-top" d="M28 28 L60 10 L92 28 L60 46 Z" />
              <path
                class="iso-pin"
                d="M60 18 v6 M57 21 h6"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </g>
          </svg>
        </div>

        <p class="region-floor-load__title">
          <span class="region-floor-load__tag">{{ floorLabel }}</span>
          {{ title }}
        </p>

        <div class="region-floor-load__dots" aria-hidden="true">
          <span /><span /><span />
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'RegionFloorLoading',
  props: {
    visible: { type: Boolean, default: false },
    floorLabel: { type: String, default: '' },
    title: { type: String, default: '正在载入楼层平面图' }
  }
}
</script>

<style lang="scss" scoped>
.region-floor-load {
  position: absolute;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(238, 240, 245, .78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  pointer-events: all;
  cursor: wait;
}

.region-floor-load__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 32px 22px;
  background: rgba(255, 255, 255, .96);
  border-radius: 14px;
  border: 1px solid rgba(1, 112, 254, .08);
  box-shadow: 0 12px 40px rgba(1, 112, 254, .1), 0 2px 8px rgba(0, 0, 0, .04);
  min-width: 220px;
}

.region-floor-load__visual {
  margin-bottom: 18px;
}

.region-floor-load__iso {
  display: block;
  overflow: visible;
}

.iso-top {
  fill: #f0f6ff;
  stroke: #0170FE;
  stroke-width: 1.2;
  stroke-linejoin: round;
}

.iso-left {
  fill: #d6e8ff;
  stroke: #0170FE;
  stroke-width: 1;
  stroke-linejoin: round;
  opacity: .85;
}

.iso-right {
  fill: #b8d9ff;
  stroke: #0170FE;
  stroke-width: 1;
  stroke-linejoin: round;
  opacity: .9;
}

.iso-pin {
  stroke: #0170FE;
  opacity: 0;
  animation: iso-pin-in 1.8s ease-in-out infinite;
}

.iso-floor {
  transform-origin: 60px 50px;
  animation: iso-floor-rise 1.8s ease-in-out infinite;

  &--1 {
    animation-delay: 0s;
    .iso-top { animation: iso-top-glow 1.8s ease-in-out infinite; }
  }
  &--2 { animation-delay: .2s; opacity: .92; }
  &--3 { animation-delay: .4s; opacity: .78; }
}

@keyframes iso-floor-rise {
  0%, 100% { transform: translateY(2px); opacity: .72; }
  35%, 55% { transform: translateY(-2px); opacity: 1; }
}

@keyframes iso-top-glow {
  0%, 100% { fill: #f0f6ff; }
  40%, 55% { fill: #dcecff; }
}

@keyframes iso-pin-in {
  0%, 25%, 100% { opacity: 0; transform: translateY(2px); }
  45%, 70% { opacity: 1; transform: translateY(0); }
}

.region-floor-load__title {
  margin: 0;
  font-size: 13px;
  color: #606266;
  letter-spacing: .2px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.region-floor-load__tag {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 700;
  color: #0170FE;
  background: rgba(1, 112, 254, .08);
  border-radius: 20px;
  line-height: 1.4;
}

.region-floor-load__dots {
  display: flex;
  gap: 6px;
  margin-top: 14px;

  span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #0170FE;
    opacity: .28;
    animation: iso-dot 1.2s ease-in-out infinite;

    &:nth-child(2) { animation-delay: .15s; }
    &:nth-child(3) { animation-delay: .3s; }
  }
}

@keyframes iso-dot {
  0%, 80%, 100% { opacity: .22; transform: scale(.85); }
  40% { opacity: 1; transform: scale(1); }
}

.region-floor-load-enter-active,
.region-floor-load-leave-active {
  transition: opacity .22s ease;
}
.region-floor-load-enter,
.region-floor-load-leave-to {
  opacity: 0;
}
</style>
