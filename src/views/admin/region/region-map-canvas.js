/**
 * 从底图边缘采样画布底色（不改 PNG，仅用于与 map-stage 对齐）
 */
function median (values) {
  const sorted = values.slice().sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function rgbToHex (r, g, b) {
  return `#${[r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`
}

export function sampleMapCanvasBackground (img, fallback = '#F2F2F2', options = {}) {
  if (!img || !img.naturalWidth || !img.naturalHeight) return fallback

  try {
    const w = img.naturalWidth
    const h = img.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return fallback

    ctx.drawImage(img, 0, 0, w, h)

    const inset = Math.max(2, Math.floor(Math.min(w, h) * 0.003))
    const points = []

    if (options.cornersOnly) {
      points.push(
        [inset, inset],
        [w - inset - 1, inset],
        [inset, h - inset - 1],
        [w - inset - 1, h - inset - 1]
      )
    } else {
      const stepX = Math.max(8, Math.floor(w / 12))
      const stepY = Math.max(8, Math.floor(h / 12))

      for (let x = inset; x < w - inset; x += stepX) {
        points.push([x, inset], [x, h - inset - 1])
      }
      for (let y = inset; y < h - inset; y += stepY) {
        points.push([inset, y], [w - inset - 1, y])
      }
    }

    const rs = []
    const gs = []
    const bs = []
    for (const [x, y] of points) {
      const { data } = ctx.getImageData(x, y, 1, 1)
      if (data.length >= 4 && data[3] < 128) continue
      rs.push(data[0])
      gs.push(data[1])
      bs.push(data[2])
    }

    if (!rs.length) return fallback
    return rgbToHex(median(rs), median(gs), median(bs))
  } catch (e) {
    return fallback
  }
}

/**
 * 透明底图：按不透明区域计算内容包围盒（仅展示层 resetView 用）
 * @returns {{ x: number, y: number, w: number, h: number } | null}
 */
export function measureMapContentBounds (img, alphaThreshold = 128) {
  if (!img || !img.naturalWidth || !img.naturalHeight) return null

  try {
    const w = img.naturalWidth
    const h = img.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null

    ctx.drawImage(img, 0, 0, w, h)
    const { data } = ctx.getImageData(0, 0, w, h)
    const step = Math.max(1, Math.floor(Math.min(w, h) / 400))

    let minX = w
    let minY = h
    let maxX = 0
    let maxY = 0
    let found = false

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4
        if (data[i + 3] >= alphaThreshold) {
          found = true
          if (x < minX) minX = x
          if (y < minY) minY = y
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
        }
      }
    }

    if (!found) return null

    const pad = Math.max(2, Math.floor(Math.min(w, h) * 0.01))
    minX = Math.max(0, minX - pad)
    minY = Math.max(0, minY - pad)
    maxX = Math.min(w - 1, maxX + pad)
    maxY = Math.min(h - 1, maxY + pad)

    return {
      x: minX,
      y: minY,
      w: maxX - minX + 1,
      h: maxY - minY + 1
    }
  } catch (e) {
    return null
  }
}
