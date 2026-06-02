import { createPaymentIntent } from "./api";
import { resolveConfig } from "./config";
import { mountCheckout } from "./embed";
import { SouthpayError } from "./errors";
import { normalizeAmount } from "./internal/money";
import type {
  CheckoutHandle,
  CreatePaymentIntentParams,
  MountOptions,
  PaymentIntent,
  SouthpayClient,
  SouthpayClientOptions,
} from "./types";

export function SouthPay(publishableKey: string, options?: SouthpayClientOptions): SouthpayClient {
  const config = resolveConfig(publishableKey, options);

  return {
    publishableKey: config.publishableKey,

    paymentIntents: {
      async create(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
        if (!params.currency) {
          throw new SouthpayError("missing_currency", "paymentIntents.create requires a currency");
        }

        const amount = normalizeAmount(params.amount, params.currency);
        const reference = await createPaymentIntent(config, params, amount);

        return { reference };
      },
    },

    checkout: {
      mount(mountOptions: MountOptions): CheckoutHandle {
        return mountCheckout(config, mountOptions);
      },
    },
  };
}
