import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "ar-quiz",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-03",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    env: {
      ASSETS: bindings.assets(),

      NEXT_PUBLIC_SUPABASE_URL:
        "https://olpuvhthinugqhmlhmul.supabase.co",

      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        "sb_publishable_pUm3CzAi3UV4NUx2YSRc6A_2fyuF30o",
    },
  }),
});