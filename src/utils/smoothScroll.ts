function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/**
 * Animates `container.scrollTop` to center `target` within it, using a manual rAF loop with an
 * ease-in/out curve. Native `scrollIntoView({behavior:'smooth'})` was found to stall partway through
 * long scrolls in some environments, so this gives full control over the animation.
 */
export function scrollElementIntoViewCentered(container: HTMLElement, target: HTMLElement, duration = 500): void {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const startScrollTop = container.scrollTop;
  const desiredScrollTop = targetRect.top - containerRect.top + startScrollTop - (containerRect.height - targetRect.height) / 2;
  const maxScrollTop = container.scrollHeight - container.clientHeight;
  const endScrollTop = Math.max(0, Math.min(desiredScrollTop, maxScrollTop));
  const delta = endScrollTop - startScrollTop;

  if (Math.abs(delta) < 1) return;

  const startTime = performance.now();
  const step = (now: number) => {
    const progress = Math.min((now - startTime) / duration, 1);
    container.scrollTop = startScrollTop + delta * easeInOutQuad(progress);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
