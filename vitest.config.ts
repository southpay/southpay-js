import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    __SDK_VERSION__: JSON.stringify("0.0.0-test"),
  },
  test: {
    environment: "happy-dom",
    environmentOptions: {
      happyDOM: {
        settings: {
          disableIframePageLoading: true,
        },
      },
    },
  },
});
