let ignoreOutsideInteraction = false
let resetTimerId = null

export function markWidgetDetailOutsideInteractionIgnored() {
  ignoreOutsideInteraction = true

  if (resetTimerId !== null) {
    window.clearTimeout(resetTimerId)
  }

  resetTimerId = window.setTimeout(() => {
    ignoreOutsideInteraction = false
    resetTimerId = null
  }, 0)
}

export function shouldIgnoreWidgetDetailOutsideInteraction() {
  return ignoreOutsideInteraction
}
