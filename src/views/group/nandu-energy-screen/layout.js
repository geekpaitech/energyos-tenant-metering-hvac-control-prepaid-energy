// Keep the UI proportional while expanding the stage to the actual window edges.
export function getScreenLayout (width, height, imageWidth = 1672, imageHeight = 941) {
  const compact = width < 1100 && width / height < 1.35
  const scale = compact ? 1 : Math.min(width / 1920, height / 1080)
  const stageWidth = compact ? width : width / scale
  const stageHeight = compact ? height : height / scale
  const sceneWidth = compact ? width - 24 : stageWidth
  const sceneHeight = compact ? 380 : stageHeight
  const cover = Math.max(sceneWidth / imageWidth, sceneHeight / imageHeight) * (compact ? 1 : 1.08)
  const renderedWidth = imageWidth * cover
  const renderedHeight = imageHeight * cover
  return { compact, scale, stageWidth, stageHeight, sceneWidth, sceneHeight, renderedWidth, renderedHeight, offsetX: (sceneWidth - renderedWidth) / 2, offsetY: (sceneHeight - renderedHeight) / 2 }
}

export function mapSceneLandmarks (landmarks, layout) {
  const x = value => (layout.offsetX + value / 100 * layout.renderedWidth) / layout.sceneWidth * 100
  const y = value => (layout.offsetY + value / 100 * layout.renderedHeight) / layout.sceneHeight * 100
  return landmarks.map(item => ({
    ...item,
    x: x(item.x),
    y: y(item.y),
    labelX: layout.compact ? Math.max(2, Math.min(x(item.labelX), 70)) : x(item.labelX),
    labelY: layout.compact ? y(item.labelY) : Math.min(y(item.labelY), (layout.sceneHeight - 324) / layout.sceneHeight * 100),
    leader: item.leader.map(point => [x(point[0]), y(point[1])])
  }))
}
