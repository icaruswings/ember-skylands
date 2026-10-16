/** Hold lifetime shared by the stick, camera and action buttons.
 * Native touches keep their original target when a finger leaves the control;
 * their active-touch list also recovers missed pointer/capture release events.
 * Mouse and pen keep pointer capture, with window-level release as a fallback.
 */
export function bindHold(element, { start, move = () => {}, end }) {
  const pointers = new Set(),
    touches = new Set();
  const nativeTouch = 'ontouchstart' in window;
  const releasePointer = (pointerId) => {
    if (!pointers.delete(pointerId)) return;
    end({ pointerId });
    try {
      element.releasePointerCapture?.(pointerId);
    } catch {}
  };
  element.addEventListener('pointerdown', (e) => {
    if (nativeTouch && e.pointerType === 'touch') return;
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    if (start(e) === false) return;
    pointers.add(e.pointerId);
    try {
      element.setPointerCapture(e.pointerId);
    } catch {}
  });
  const releasedButtons = (e) => {
    if (e.buttons === 0) releasePointer(e.pointerId);
  };
  element.addEventListener('pointermove', (e) => {
    releasedButtons(e);
    if (pointers.has(e.pointerId)) move(e);
  });
  const pointerEnd = (e) => releasePointer(e.pointerId);
  for (const event of ['pointerup', 'pointercancel']) {
    element.addEventListener(event, pointerEnd);
    window.addEventListener(event, pointerEnd, true);
  }
  element.addEventListener('lostpointercapture', pointerEnd);
  window.addEventListener('pointermove', releasedButtons, true);

  if (nativeTouch) {
    const id = (touch) => `touch:${touch.identifier}`;
    const point = (touch) => ({
      pointerId: id(touch),
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    const reconcile = (e) => {
      const remaining = new Set(Array.from(e.touches || [], id));
      for (const pointerId of touches)
        if (!remaining.has(pointerId)) {
          touches.delete(pointerId);
          end({ pointerId });
        }
    };
    element.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        reconcile(e);
        for (const touch of e.changedTouches) {
          if (start(point(touch)) !== false) touches.add(id(touch));
        }
      },
      { passive: false },
    );
    element.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        reconcile(e);
        for (const touch of e.changedTouches) if (touches.has(id(touch))) move(point(touch));
      },
      { passive: false },
    );
    // Capture observes the browser's full touch list before other UI handlers.
    for (const event of ['touchstart', 'touchmove', 'touchend', 'touchcancel'])
      document.addEventListener(event, reconcile, { capture: true, passive: true });
  }
  return () => {
    for (const pointerId of pointers) releasePointer(pointerId);
    for (const pointerId of touches) end({ pointerId });
    touches.clear();
  };
}
