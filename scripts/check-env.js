/**
 * 开发环境检查脚本
 * 在 pnpm dev 之前自动执行，确保开发环境正确配置
 *
 * 检查项：
 * 1. Node.js 版本
 * 2. pnpm 版本
 * 3. 依赖安装状态
 */

import { execSync } from "child_process";
import { existsSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// 颜色输出
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m"
};

const log = {
  info: msg => console.log(`${colors.blue}[检查]${colors.reset} ${msg}`),
  success: msg => console.log(`${colors.green}[通过]${colors.reset} ${msg}`),
  warn: msg => console.log(`${colors.yellow}[警告]${colors.reset} ${msg}`),
  error: msg => console.log(`${colors.red}[错误]${colors.reset} ${msg}`)
};

// 版本比较
function versionGte(current, required) {
  const c = current.split(".").map(Number);
  const r = required.split(".").map(Number);
  for (let i = 0; i < Math.max(c.length, r.length); i++) {
    const cv = c[i] || 0;
    const rv = r[i] || 0;
    if (cv > rv) return true;
    if (cv < rv) return false;
  }
  return true;
}

// 获取命令输出
function getCommandOutput(cmd) {
  try {
    return execSync(cmd, { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

// 主检查流程
function checkEnvironment() {
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  billing-system 开发环境检查");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  let hasError = false;

  // 1. 检查 Node.js 版本
  const nodeVersion = process.version.replace("v", "");
  const requiredNode = "20.19.0";

  if (versionGte(nodeVersion, requiredNode)) {
    log.success(`Node.js v${nodeVersion} (要求 >= v${requiredNode})`);
  } else {
    log.error(`Node.js 版本过低: v${nodeVersion} (要求 >= v${requiredNode})`);
    hasError = true;
  }

  // 2. 检查 pnpm 版本
  const pnpmVersion = getCommandOutput("pnpm -v");
  const requiredPnpm = "9";

  if (pnpmVersion && versionGte(pnpmVersion, requiredPnpm)) {
    log.success(`pnpm v${pnpmVersion} (要求 >= v${requiredPnpm})`);
  } else {
    log.error(
      `pnpm 版本问题: ${pnpmVersion || "未安装"} (要求 >= v${requiredPnpm})`
    );
    hasError = true;
  }

  // 3. 检查依赖安装状态
  const nodeModulesPath = resolve(rootDir, "node_modules");
  const packageJsonPath = resolve(rootDir, "package.json");

  if (!existsSync(nodeModulesPath)) {
    log.warn("依赖未安装，正在安装...");
    try {
      execSync("pnpm install", { cwd: rootDir, stdio: "inherit" });
      log.success("依赖安装完成");
    } catch {
      log.error("依赖安装失败");
      hasError = true;
    }
  } else {
    // 检查 package.json 是否比 node_modules 新
    const packageJsonMtime = statSync(packageJsonPath).mtimeMs;
    const nodeModulesMtime = statSync(nodeModulesPath).mtimeMs;

    if (packageJsonMtime > nodeModulesMtime) {
      log.warn("package.json 已更新，正在同步依赖...");
      try {
        execSync("pnpm install", { cwd: rootDir, stdio: "inherit" });
        log.success("依赖同步完成");
      } catch {
        log.error("依赖同步失败");
        hasError = true;
      }
    } else {
      log.success("依赖已是最新状态");
    }
  }

  console.log("");

  if (hasError) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    log.error("环境检查未通过，请修复上述问题");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    process.exit(1);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log.success("环境检查通过，启动开发服务器...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
}

checkEnvironment();
