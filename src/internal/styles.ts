export const OVERLAY_CSS =
  "position:fixed;inset:0;z-index:2147483646;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px;background:rgba(15,23,42,0.6);";
export const PANEL_CSS =
  "position:relative;width:100%;max-width:460px;margin:auto;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 24px 60px rgba(0,0,0,0.35);";
export const CLOSE_CSS =
  "position:absolute;top:8px;right:8px;z-index:1;width:32px;height:32px;border:0;border-radius:9999px;background:rgba(15,23,42,0.06);color:#0f172a;font-size:20px;line-height:1;cursor:pointer;";
export const FRAME_CSS = "width:100%;border:0;display:block;transition:height 0.2s ease;";

export const OVERLAY_CLASS = "southpay-overlay";
export const PANEL_CLASS = "southpay-panel";
export const CLOSE_CLASS = "southpay-close";
export const FRAME_CLASS = "southpay-frame";

let styleEl: HTMLStyleElement | null = null;
let frameCounter = 0;

export function ensureStylesheet(nonce: string): CSSStyleSheet | null {
  if (styleEl?.isConnected) return styleEl.sheet ?? null;

  const style = document.createElement("style");
  style.setAttribute("data-southpay", "");
  style.nonce = nonce;
  style.textContent =
    `.${OVERLAY_CLASS}{${OVERLAY_CSS}}` +
    `.${PANEL_CLASS}{${PANEL_CSS}}` +
    `.${CLOSE_CLASS}{${CLOSE_CSS}}` +
    `.${FRAME_CLASS}{${FRAME_CSS}}`;
  document.head.append(style);
  styleEl = style;
  return style.sheet ?? null;
}

export interface FrameRule {
  className: string;
  setHeight(px: number): void;
  clearMinHeight(): void;
  destroy(): void;
}

export function createFrameRule(sheet: CSSStyleSheet, minHeight: number): FrameRule | null {
  const className = `${FRAME_CLASS}-${++frameCounter}`;
  let rule: CSSStyleRule;
  try {
    const index = sheet.insertRule(
      `.${className}{min-height:${minHeight}px;}`,
      sheet.cssRules.length,
    );
    rule = sheet.cssRules[index] as CSSStyleRule;
  } catch {
    return null;
  }
  return {
    className,
    setHeight(px: number): void {
      rule.style.height = `${px}px`;
    },
    clearMinHeight(): void {
      rule.style.minHeight = "0px";
    },
    destroy(): void {
      for (let i = 0; i < sheet.cssRules.length; i++) {
        if (sheet.cssRules[i] === rule) {
          sheet.deleteRule(i);
          return;
        }
      }
    },
  };
}
