import { defineConfig } from "vite";
import { resolve } from "path";

const root = resolve(__dirname);

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        about: resolve(root, "about.html"),
        contact: resolve(root, "contact.html"),
        privacy: resolve(root, "privacy-policy.html"),
        articlesIndex: resolve(root, "articles/index.html"),
        article1: resolve(root, "articles/digital-marketing-strategy-small-businesses.html"),
        article2: resolve(root, "articles/seo-for-beginners.html"),
        article3: resolve(root, "articles/how-to-start-online-business.html"),
        article4: resolve(root, "articles/content-marketing-guide.html"),
        article5: resolve(root, "articles/how-to-grow-a-website.html")
      }
    }
  }
});
