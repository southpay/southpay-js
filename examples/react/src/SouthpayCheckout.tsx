import type { CheckoutCallbacks, CheckoutHandle, SouthpayClient } from "@southpay/js";
import { useEffect, useRef } from "react";

type CommonProps = CheckoutCallbacks & { southpay: SouthpayClient; minHeight?: number };
type ReferenceProps = CommonProps & { reference: string };
type CreateProps = CommonProps & { amount: string; currency: string };

export type SouthpayCheckoutProps = ReferenceProps | CreateProps;

export function SouthpayCheckout(props: SouthpayCheckoutProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  const key = "reference" in props ? props.reference : `${props.amount}:${props.currency}`;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const current = propsRef.current;
    const callbacks: CheckoutCallbacks = {
      onReady: () => propsRef.current.onReady?.(),
      onStatusChange: (event) => propsRef.current.onStatusChange?.(event),
      onCompleted: (event) => propsRef.current.onCompleted?.(event),
      onFailed: (event) => propsRef.current.onFailed?.(event),
      onExpired: (event) => propsRef.current.onExpired?.(event),
      onError: (error) => propsRef.current.onError?.(error),
    };

    let handle: CheckoutHandle | null = null;
    let cancelled = false;

    function render(reference: string) {
      if (cancelled) return;
      handle = current.southpay.checkout.mount({
        reference,
        container,
        minHeight: current.minHeight,
        ...callbacks,
      });
    }

    if ("reference" in current) {
      render(current.reference);
    } else {
      current.southpay.paymentIntents
        .create({ amount: current.amount, currency: current.currency })
        .then((intent) => render(intent.reference))
        .catch((error) => console.error("paymentIntents.create failed", error));
    }

    return () => {
      cancelled = true;
      handle?.unmount();
    };
  }, [key]);

  return <div ref={containerRef} />;
}
