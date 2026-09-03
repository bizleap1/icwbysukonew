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

        // Enable Webpack 5 Lazy Compilation (Like Vite: compiles only viewed routes on-demand)
        webpackConfig.experiments = {
          ...webpackConfig.experiments,
          lazyCompilation: {
            imports: true,
            entries: false,
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
