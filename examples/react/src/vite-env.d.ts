interface ImportMetaEnv {
  readonly VITE_SOUTHPAY_PUBLISHABLE_KEY: string;
  readonly VITE_SOUTHPAY_API_BASE?: string;
  readonly VITE_SOUTHPAY_CHECKOUT_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
