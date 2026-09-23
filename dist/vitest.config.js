"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
const dotenv_1 = __importDefault(require("dotenv"));
// Pre-load .env file into process.env before test files load
dotenv_1.default.config();
exports.default = (0, config_1.defineConfig)({
    test: {
        globals: true,
        environment: "node",
    },
});
