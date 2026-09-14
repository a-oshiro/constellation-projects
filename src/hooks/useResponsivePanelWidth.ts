import { useEffect, useState } from 'react';

const WIDE_BREAKPOINT = 1700;
const BASE_WIDTH = 360;
const WIDE_WIDTH = 400;

const widthForViewport = () => (window.innerWidth > WIDE_BREAKPOINT ? WIDE_WIDTH : BASE_WIDTH);

/** Shared width for the Alert dialog's right-hand panels (History/Recipients/Offers/Offer Editor):
 * 360px normally, 400px once the viewport is wider than 1700px. */
export function useResponsivePanelWidth(): number {
  const [width, setWidth] = useState(widthForViewport);

  useEffect(() => {
    const onResize = () => setWidth(widthForViewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return width;
}
