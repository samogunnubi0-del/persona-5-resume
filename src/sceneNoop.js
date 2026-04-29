/** Used when WebGL/Three can’t start — keeps audio + DOM UI working. */
export const noopSceneController = {
  setHoverGlitch: () => {},
  triggerShatter: () => {},
  triggerKeyholeTransition: () => {},
  setMouse: () => {},
  setScrollProgress: () => {},
  onResize: () => {},
  dispose: () => {}
}
