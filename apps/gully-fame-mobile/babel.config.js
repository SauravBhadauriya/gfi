module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
          alias: {
            "@": "./src",
            "@api": "./src/api",
            "@assets": "./src/assets",
            "@components": "./src/components",
            "@contexts": "./src/contexts",
            "@features": "./src/features",
            "@hooks": "./src/hooks",
            "@navigation": "./src/navigation",
            "@screens": "./src/screens",
            "@store": "./src/store",
            "@styles": "./src/styles",
            "@types": "./src/types",
            "@utils": "./src/utils",
            "@constants": "./constants",
            "@modules": "./src/modules",
          },
        },
      ],
      // Strip console.log/info/debug from production bundles. Errors and warnings stay
      // so crash diagnostics still work.
      ...(process.env.NODE_ENV === "production"
        ? [["transform-remove-console", { exclude: ["error", "warn"] }]]
        : []),
      'react-native-reanimated/plugin',
    ],
  };
};