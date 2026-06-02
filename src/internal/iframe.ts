import {
  CLOSE_CLASS,
  CLOSE_CSS,
  FRAME_CLASS,
  FRAME_CSS,
  type FrameRule,
  OVERLAY_CLASS,
  OVERLAY_CSS,
  PANEL_CLASS,
  PANEL_CSS,
  createFrameRule,
  ensureStylesheet,
} from "./styles";

export function resolveContainer(target: string | HTMLElement | undefined): HTMLElement | null {
  if (!target) return null;
  if (typeof target === "string") return document.querySelector<HTMLElement>(target);
  return target;
}

export interface Frame {
  readonly iframe: HTMLIFrameElement;
  readonly usesClasses: boolean;
  setHeight(px: number): void;
  clearMinHeight(): void;
  destroy(): void;
}

export function createIframe(
  origin: string,
  reference: string,
  minHeight: number,
  nonce?: string,
): Frame {
  const params = new URLSearchParams({ embed: "1", origin: window.location.origin });
  const iframe = document.createElement("iframe");
  iframe.src = `${origin}/${encodeURIComponent(reference)}?${params.toString()}`;
  iframe.title = "Secure crypto checkout";
  iframe.allow = "payment; clipboard-write";
  iframe.setAttribute(
    "sandbox",
    "allow-scripts allow-forms allow-same-origin allow-popups allow-top-navigation-by-user-activation",
  );

  const rule = nonce ? toFrameRule(nonce, minHeight) : null;
  if (rule) {
    iframe.classList.add(FRAME_CLASS, rule.className);
    return {
      iframe,
      usesClasses: true,
      setHeight: rule.setHeight,
      clearMinHeight: rule.clearMinHeight,
      destroy: rule.destroy,
    };
  }

  iframe.style.cssText = `${FRAME_CSS}min-height:${minHeight}px;`;
  return {
    iframe,
    usesClasses: false,
    setHeight(px: number): void {
      iframe.style.height = `${px}px`;
    },
    clearMinHeight(): void {
      iframe.style.minHeight = "0px";
    },
    destroy(): void {},
  };
}

function toFrameRule(nonce: string, minHeight: number): FrameRule | null {
  const sheet = ensureStylesheet(nonce);
  return sheet ? createFrameRule(sheet, minHeight) : null;
}

export interface Modal {
  readonly element: HTMLElement;
  destroy(): void;
}

export function createModal(
  iframe: HTMLIFrameElement,
  onClose: () => void,
  useClasses: boolean,
): Modal {
  const previouslyFocused = document.activeElement as HTMLElement | null;

  const overlay = document.createElement("div");
  overlay.setAttribute("data-southpay-modal", "");

  const panel = document.createElement("div");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "Checkout");

  const close = document.createElement("button");
  close.type = "button";
  close.setAttribute("aria-label", "Close checkout");
  close.textContent = "×";

  if (useClasses) {
    overlay.classList.add(OVERLAY_CLASS);
    panel.classList.add(PANEL_CLASS);
    close.classList.add(CLOSE_CLASS);
  } else {
    overlay.style.cssText = OVERLAY_CSS;
    panel.style.cssText = PANEL_CSS;
    close.style.cssText = CLOSE_CSS;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") onClose();
  }

  close.addEventListener("click", onClose);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) onClose();
  });
  document.addEventListener("keydown", onKeydown, true);

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  panel.append(close, iframe);
  overlay.append(panel);
  document.body.append(overlay);
  close.focus();

  return {
    element: overlay,
    destroy(): void {
      document.removeEventListener("keydown", onKeydown, true);
      document.body.style.overflow = previousOverflow;
      overlay.remove();
      previouslyFocused?.focus?.();
    },
  };
}
