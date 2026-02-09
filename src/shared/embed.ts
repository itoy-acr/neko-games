export function postHeightToParent() {
  // Optional: let parent page auto-resize iframe height.
  // Parent must listen to message events.
  const h = document.documentElement.scrollHeight;
  window.parent?.postMessage({ type: "kaplay-iframe-height", height: h }, "*");
}
