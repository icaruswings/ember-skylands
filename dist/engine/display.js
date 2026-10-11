// Fullscreen must begin inside a user gesture. The viewport layout also works
// when a browser (including iPhone Safari) does not support this API.
export async function enterFullscreen(stage, doc = document) {
  if (doc.fullscreenElement || !stage.requestFullscreen) return false;
  try {
    await stage.requestFullscreen({ navigationUI: 'hide' });
    return true;
  } catch {
    return false;
  }
}

export function protectGameGestures(stage) {
  for (const event of ['contextmenu', 'selectstart', 'dragstart']) {
    stage.addEventListener(event, (e) => e.preventDefault());
  }
}
