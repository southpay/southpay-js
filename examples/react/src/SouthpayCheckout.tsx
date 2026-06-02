import {
  type CheckoutCallbacks,
  type CheckoutHandle,
  createCheckout,
  mount,
} from "@southpay/js";
import { useEffect, useRef } from "react";

type CommonProps = CheckoutCallbacks & { minHeight?: number };
type ReferenceProps = CommonProps & { reference: string };
type CreateProps = CommonProps & { amount: number; currency: string };

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
    };

    let handle: CheckoutHandle | null = null;
    let cancelled = false;

    if ("reference" in current) {
      handle = mount({
        reference: current.reference,
        container,
        minHeight: current.minHeight,
        ...callbacks,
      });
    } else {
      createCheckout({
        amount: current.amount,
        currency: current.currency,
        container,
        minHeight: current.minHeight,
        ...callbacks,
      })
        .then((created) => {
          if (cancelled) created.unmount();
          else handle = created;
        })
        .catch((error) => console.error("createCheckout failed", error));
    }

    return () => {
      cancelled = true;
      handle?.unmount();
    };
  }, [key]);

  return <div ref={containerRef} />;
}
