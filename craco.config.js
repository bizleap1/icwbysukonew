const path = require("path");

module.exports = {
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    plugins: {
      remove: ["ForkTsCheckerWebpackPlugin", "ESLintWebpackPlugin"]
    },
    configure: (webpackConfig, { env }) => {
      if (env === "development") {
        // Enable Webpack 5 persistent filesystem cache for ultra-fast startup
        webpackConfig.cache = {
          type: "filesystem",
          buildDependencies: {
            config: [__filename],
          },
        };


        // Use fast source maps for instantaneous rebuilds
        webpackConfig.devtool = "eval-cheap-module-source-map";

        // Optimization for fast dev bundling
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          removeAvailableModules: false,
          removeEmptyChunks: false,
          splitChunks: false,
        };
      }
      return webpackConfig;
    },
  },
  devServer: (devServerConfig) => {
    const originalSetupMiddlewares = devServerConfig.setupMiddlewares;
    const onBefore = devServerConfig.onBeforeSetupMiddleware;
    const onAfter = devServerConfig.onAfterSetupMiddleware;
    delete devServerConfig.onBeforeSetupMiddleware;
    delete devServerConfig.onAfterSetupMiddleware;

    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      if (onBefore) onBefore(devServer);

      if (devServer && devServer.app) {
        devServer.app.get("/sitemap.xml", async (req, res) => {
          try {
            const sitemapHandler = require("./api/sitemap");
            return await sitemapHandler(req, res);
          } catch (err) {
            res.status(500).send("<!-- Sitemap generation error -->");
          }
        });

        devServer.app.get("/robots.txt", (req, res) => {
          const fs = require("fs");
          const path = require("path");
          const robotsPath = path.resolve(__dirname, "public", "robots.txt");
          if (fs.existsSync(robotsPath)) {
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            return res.send(fs.readFileSync(robotsPath, "utf-8"));
          }
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.send("User-agent: *\nAllow: /\n\nSitemap: https://www.indiancorporatewear.com/sitemap.xml\n");
        });
      }

      if (originalSetupMiddlewares) {
        middlewares = originalSetupMiddlewares(middlewares, devServer);
      }
      if (onAfter) onAfter(devServer);
      return middlewares;
    };
    return devServerConfig;
  },
};
