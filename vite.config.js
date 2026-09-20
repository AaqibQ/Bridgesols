import { defineConfig } from "vite";
import { resolve } from "path";

const root = resolve(__dirname);

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        about: resolve(root, "about.html"),
        services: resolve(root, "services.html"),
        tools: resolve(root, "tools/index.html"),
        toolWordCounter: resolve(root, "tools/word-counter.html"),
        toolMetaLengthChecker: resolve(root, "tools/meta-length-checker.html"),
        contact: resolve(root, "contact.html"),
        privacy: resolve(root, "privacy-policy.html"),
        articlesIndex: resolve(root, "articles/index.html"),
        article1: resolve(root, "articles/digital-marketing-strategy-small-businesses.html"),
        article2: resolve(root, "articles/seo-for-beginners.html"),
        article3: resolve(root, "articles/how-to-start-online-business.html"),
        article4: resolve(root, "articles/content-marketing-guide.html"),
        article5: resolve(root, "articles/how-to-grow-a-website.html"),
        article6: resolve(root, "articles/digital-marketing-small-business-pakistan.html"),
        article7: resolve(root, "articles/starting-online-business-uae-dubai.html"),
        article8: resolve(root, "articles/us-small-business-digital-marketing-benchmarks-2026.html"),
        article9: resolve(root, "articles/local-seo-guide-google-business-profile.html"),
        article10: resolve(root, "articles/keyword-research-for-beginners.html"),
        article11: resolve(root, "articles/google-analytics-4-for-beginners.html"),
        article12: resolve(root, "articles/email-marketing-for-small-businesses.html"),
        article13: resolve(root, "articles/whatsapp-business-sales-guide.html"),
        article14: resolve(root, "articles/freelancing-from-pakistan-international-clients.html"),
        article15: resolve(root, "articles/video-marketing-for-small-businesses.html")
      }
    }
  }
});
