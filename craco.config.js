const path = require("path");

module.exports = {
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    plugins: {
      remove: ["ForkTsCheckerWebpackPlugin"]
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
        // Use fast eval-cheap-module-source-map for development
        webpackConfig.devtool = "eval-cheap-module-source-map";
      }
      return webpackConfig;
    },
  },
  devServer: (devServerConfig) => {
    // Resolve Webpack Dev Server deprecation warnings
    if (devServerConfig.onBeforeSetupMiddleware || devServerConfig.onAfterSetupMiddleware) {
      const onBefore = devServerConfig.onBeforeSetupMiddleware;
      const onAfter = devServerConfig.onAfterSetupMiddleware;
      delete devServerConfig.onBeforeSetupMiddleware;
      delete devServerConfig.onAfterSetupMiddleware;

      devServerConfig.setupMiddlewares = (middlewares, devServer) => {
        if (onBefore) onBefore(devServer);
        if (onAfter) onAfter(devServer);
        return middlewares;
      };
    }
    return devServerConfig;
  },
};
