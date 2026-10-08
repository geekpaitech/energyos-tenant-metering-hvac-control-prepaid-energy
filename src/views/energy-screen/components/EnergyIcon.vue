<template>
  <svg class="energy-icon" viewBox="0 0 64 64" aria-hidden="true">
    <g v-if="name === 'bolt'">
      <path d="M36 4 14 36h16l-4 24 24-34H34z" fill="currentColor" />
    </g>
    <g v-else-if="name === 'solar'">
      <circle cx="48" cy="14" r="7" fill="none" stroke="currentColor" stroke-width="3" />
      <path d="M48 2v5M48 21v5M36 14h5M55 14h5" stroke="currentColor" stroke-width="2" />
      <path d="m13 23 32 0 7 23H7zM14 31h34M11 39h39M24 23l-3 23M35 23l3 23M29 46v9M19 56h22" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
    </g>
    <g v-else-if="name === 'pie'">
      <path d="M29 8a24 24 0 1 0 27 27H29z" fill="currentColor" opacity=".9" />
      <path d="M35 5v24h24A24 24 0 0 0 35 5Z" fill="currentColor" opacity=".38" />
    </g>
    <g v-else-if="name === 'yuan'" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
      <path d="m17 10 15 20 15-20M32 30v25M17 32h30M17 43h30" />
    </g>
    <g v-else-if="name === 'growth'" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 49 24 34l10 9 20-25" stroke-width="6" />
      <path d="M42 18h12v12" stroke-width="5" />
      <path d="M13 54V43M25 54V39M37 54V34M49 54V27" stroke-width="5" />
    </g>
    <g v-else-if="name === 'investment'">
      <path d="M16 21c2-8 9-13 16-13s14 5 16 13c5 4 9 11 9 19 0 12-10 19-25 19S7 52 7 40c0-8 4-15 9-19Z" fill="currentColor" opacity=".9" />
      <path d="M23 8c3 3 6 4 9 4s6-1 9-4" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round" />
      <path d="m24 27 8 10 8-10M32 37v14M24 39h16M25 46h14" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
    <g v-else-if="name === 'percentage'" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round">
      <circle cx="20" cy="19" r="7" />
      <circle cx="44" cy="45" r="7" />
      <path d="m47 12-30 40" />
    </g>
    <g v-else-if="name === 'savings'" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="38" cy="22" r="12" stroke-width="4" />
      <path d="m33 16 5 6 5-6M38 22v10M33 24h10" stroke-width="3" />
      <path d="M7 46c8-7 14-7 22-1h13c5 0 7 6 2 9H26" stroke-width="4" />
      <path d="M7 45v12h12l8-3" stroke-width="4" />
    </g>
    <g v-else-if="name === 'flow-arrow'" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m10 16 16 16-16 16M32 16l16 16-16 16" />
    </g>
    <g v-else-if="name === 'monitor' || name === 'cabinet'">
      <rect x="10" y="10" width="44" height="34" rx="3" fill="none" stroke="currentColor" stroke-width="4" />
      <path d="M20 18h24v18H20zM27 44v8M37 44v8M22 53h20" fill="none" stroke="currentColor" stroke-width="3" />
    </g>
    <g v-else-if="name === 'leaf'">
      <path d="M53 9C29 10 11 22 12 43c13 5 31 0 38-16 3-7 3-13 3-18Z" fill="currentColor" opacity=".9" />
      <path d="M12 54c9-15 18-24 31-32M26 36c0-6 2-11 5-15M29 35c6 0 11-2 15-5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </g>
    <g v-else-if="name === 'tower'">
      <path d="M32 5 17 56M32 5l15 51M14 56h36M22 38h20M19 26h26M24 16h16M10 18h44M15 11l17 7 17-7" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
    </g>
    <g v-else-if="name === 'air'">
      <rect x="7" y="14" width="50" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="4" />
      <path d="M15 24h34M18 33h28M17 47c0 5-4 5-4 10M31 47c0 5-4 5-4 10M45 47c0 5-4 5-4 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </g>
    <g v-else-if="name === 'building'">
      <path d="M8 55V25h18v30M26 55V9h22v46M48 55V31h9v24M4 55h56" fill="none" stroke="currentColor" stroke-width="4" />
      <path d="M33 17h4M33 26h4M33 35h4M14 33h5M14 42h5" stroke="currentColor" stroke-width="3" />
    </g>
    <g v-else-if="name === 'shop'" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 22V14a4 4 0 0 1 4-4h40a4 4 0 0 1 4 4v8" stroke-width="4" />
      <path d="M5 22h54l-4 8H9Z" stroke-width="3" />
      <path d="M11 30v22h42V30" stroke-width="4" />
      <path d="M22 52v-12h20v12" stroke-width="3" />
      <path d="M14 18v-2M22 18v-2M30 18v-2M38 18v-2M46 18v-2" stroke-width="3" />
    </g>
    <g v-else-if="name === 'bulb'">
      <path d="M19 27a13 13 0 1 1 25 0c-1 5-5 7-7 11H26c-2-4-6-6-7-11ZM26 44h12M28 51h8" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
      <path d="M32 4V0M12 12 8 8M52 12l4-4M10 30H4M60 30h-6" stroke="currentColor" stroke-width="3" />
    </g>
    <g v-else-if="name === 'water' || name === 'drop'">
      <path d="M32 5C25 17 13 30 13 42a19 19 0 0 0 38 0C51 30 39 17 32 5Z" fill="currentColor" opacity=".85" />
      <path d="M23 43c1 6 5 9 11 10" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round" />
    </g>
    <g v-else-if="name === 'transformer'">
      <rect x="10" y="13" width="44" height="40" rx="5" fill="none" stroke="currentColor" stroke-width="4" />
      <path d="M19 13V7M32 13V7M45 13V7M19 24h26M22 34h20M26 43h12" stroke="currentColor" stroke-width="3" />
    </g>
    <g v-else-if="name === 'inverter'" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <rect x="10" y="8" width="44" height="48" rx="5" stroke-width="4" />
      <path d="M18 20h28M18 44h28" stroke-width="3" />
      <path d="M18 32c4-7 8-7 12 0s8 7 12 0" stroke-width="3.5" />
    </g>
    <g v-else-if="name === 'charger'">
      <path d="M15 7h29v49H15zM22 14h15v12H22zM44 17h7l5 8v20c0 5-7 5-7 0V31" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" />
      <path d="m31 31-7 11h7l-2 9 10-14h-7z" fill="currentColor" />
    </g>
    <g v-else-if="name === 'coal'">
      <path d="M9 23h46l-5 24H15zM18 23l7-10h14l8 10M18 52a5 5 0 1 0 10 0M39 52a5 5 0 1 0 10 0" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" />
      <path d="m23 22 5-9 6 9 5-8 5 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
    </g>
    <text v-else-if="name === 'co2'" x="32" y="39" text-anchor="middle" fill="currentColor" font-size="21" font-weight="800">CO₂</text>
    <g v-else-if="name === 'cloud'">
      <circle cx="40" cy="16" r="7" fill="#ffc326" />
      <path d="M18 48h29a10 10 0 0 0 1-20 16 16 0 0 0-30-2 11 11 0 0 0 0 22Z" fill="currentColor" />
    </g>
    <g v-else-if="name === 'thermometer'">
      <path d="M27 10a6 6 0 0 1 12 0v29a12 12 0 1 1-12 0z" fill="none" stroke="currentColor" stroke-width="4" />
      <path d="M33 20v25" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
    </g>
    <g v-else-if="name === 'wind'">
      <path d="M6 21h34c10 0 10-12 2-12-5 0-7 3-7 6M6 33h45c9 0 9 13 0 13-5 0-7-3-7-6M6 45h23" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
    </g>
    <g v-else-if="name === 'warning'">
      <path d="M32 7 59 56H5z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" />
      <path d="M32 23v16M32 47v2" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
    </g>
    <g v-else-if="name === 'smoke'" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <rect x="14" y="22" width="36" height="28" rx="5" stroke-width="4" />
      <path d="M22 30h20M22 36h20M22 42h12" stroke-width="3" />
      <circle cx="32" cy="14" r="5" stroke-width="3" />
      <path d="M27 11h10M22 14c-3 0-5-3-3-6M42 14c3 0 5-3 3-6" stroke-width="2.5" />
    </g>
    <g v-else-if="name === 'flood'" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <rect x="8" y="14" width="48" height="22" rx="3" stroke-width="4" />
      <path d="M16 50h32" stroke-width="4" />
      <path d="M16 50c3-7 7-7 10 0s7 7 10 0 7-7 10 0" stroke-width="3" />
      <circle cx="32" cy="25" r="3" />
    </g>
    <g v-else-if="name === 'load'" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="32" cy="32" r="22" stroke-width="4" />
      <path d="M32 14v18l12 7" stroke-width="4" />
      <path d="M14 32a18 18 0 0 0 36 0" stroke-width="3" stroke-dasharray="3 4" />
    </g>
    <g v-else-if="name === 'peak-temperature'" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 6h22v32a11 11 0 1 1-22 0z" stroke-width="4" />
      <path d="M28 14h8v22a8 8 0 1 1-8 0z" stroke-width="3" />
      <circle cx="32" cy="46" r="3" fill="currentColor" />
      <path d="M32 6V2M16 6c-3-3 0-7 5-5M48 6c3-3 0-7-5-5" stroke-width="2.5" />
    </g>
    <g v-else-if="name === 'ground'" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M32 8 16 16v16l16 8 16-8V16z" stroke-width="4" />
      <path d="M32 8v32M16 16l16 8 16-8" stroke-width="3" />
      <path d="M28 50h8M26 56h12" stroke-width="3" />
    </g>
    <g v-else-if="name === 'residual'" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M32 8a14 14 0 0 1 14 14v8a14 14 0 1 1-28 0v-8A14 14 0 0 1 32 8Z" stroke-width="4" />
      <path d="M22 40c-3 3-7 5-11 5M42 40c3 3 7 5 11 5" stroke-width="3" />
      <path d="M28 26c0-3 2-5 4-5s4 2 4 5-4 7-4 11" stroke-width="3" />
      <circle cx="32" cy="40" r="2" fill="currentColor" />
    </g>
    <circle v-else cx="32" cy="32" r="22" fill="none" stroke="currentColor" stroke-width="4" />
  </svg>
</template>

<script>
export default {
  name: 'EnergyIcon',
  props: { name: { type: String, default: '' } }
}
</script>
