/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const Module = require("node:module");

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad.apply(this, arguments);
};
