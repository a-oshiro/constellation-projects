import { createContext, useContext, useState } from 'react';

// ── Toggle this to show or hide the Test Script widget ────────────────────────
export const SHOW_TEST_WIDGET = true;
// ─────────────────────────────────────────────────────────────────────────────

export const WIDGET_EXPANDED_WIDTH = 240;
export const WIDGET_COLLAPSED_WIDTH = 52;

interface TestWidgetContextValue {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  widgetWidth: number;
}

const TestWidgetContext = createContext<TestWidgetContextValue>({
  expanded: true,
  setExpanded: () => {},
  widgetWidth: WIDGET_EXPANDED_WIDTH,
});

export function TestWidgetProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <TestWidgetContext.Provider
      value={{
        expanded,
        setExpanded,
        widgetWidth: SHOW_TEST_WIDGET
          ? (expanded ? WIDGET_EXPANDED_WIDTH : WIDGET_COLLAPSED_WIDTH)
          : 0,
      }}
    >
      {children}
    </TestWidgetContext.Provider>
  );
}

export function useTestWidget() {
  return useContext(TestWidgetContext);
}
