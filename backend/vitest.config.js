const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
