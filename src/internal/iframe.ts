export function resolveContainer(target: string | HTMLElement | undefined): HTMLElement | null {
  if (!target) return null;
  if (typeof target === "string") return document.querySelector<HTMLElement>(target);
  return target;
}

export function createIframe(
  origin: string,
  reference: string,
  minHeight: number,
): HTMLIFrameElement {
  const params = new URLSearchParams({ embed: "1", origin: window.location.origin });
  const iframe = document.createElement("iframe");
  iframe.src = `${origin}/${encodeURIComponent(reference)}?${params.toString()}`;
  iframe.title = "Secure crypto checkout";
  iframe.allow = "clipboard-write; payment; accelerometer; camera";
  iframe.style.width = "100%";
  iframe.style.border = "0";
  iframe.style.display = "block";
  iframe.style.minHeight = `${minHeight}px`;
  iframe.style.transition = "height 0.2s ease";
  return iframe;
}

export function createModal(iframe: HTMLIFrameElement, onClose: () => void): HTMLElement {
  const overlay = document.createElement("div");
  overlay.setAttribute("data-southpay-modal", "");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:2147483646;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px;background:rgba(15,23,42,0.6);";

  const panel = document.createElement("div");
  panel.style.cssText =
    "position:relative;width:100%;max-width:460px;margin:auto;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 24px 60px rgba(0,0,0,0.35);";

  const close = document.createElement("button");
  close.type = "button";
  close.setAttribute("aria-label", "Close checkout");
  close.textContent = "×";
  close.style.cssText =
    "position:absolute;top:8px;right:8px;z-index:1;width:32px;height:32px;border:0;border-radius:9999px;background:rgba(15,23,42,0.06);color:#0f172a;font-size:20px;line-height:1;cursor:pointer;";
  close.addEventListener("click", onClose);

  iframe.style.minHeight = "560px";
  panel.append(close, iframe);
  overlay.append(panel);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) onClose();
  });
  return overlay;
}
