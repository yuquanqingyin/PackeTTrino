import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const runtimeVersion = "v22.23.3";
const runtimeName = `node-${runtimeVersion}-win-x64`;
const cache = join(root, "tmp", "student-runtime");
const runtimeZip = join(cache, runtimeName + ".zip");
const checksums = join(cache, "SHASUMS256.txt");
const psQuote = value => "'" + value.replaceAll("'", "''") + "'";
const runPowerShell = command => execFileSync("powershell.exe", [
    "-NoProfile", "-NonInteractive", "-Command", "$ErrorActionPreference = 'Stop'; " + command,
], { stdio: "inherit", windowsHide: true });

if (process.platform !== "win32") throw new Error("请在 Windows 教师电脑上生成此单机包。");
await mkdir(cache, { recursive: true });
for (const [target, name] of [[runtimeZip, runtimeName + ".zip"], [checksums, "SHASUMS256.txt"]]) {
    if (existsSync(target)) continue;
    console.log(`下载官方便携运行程序：${name}`);
    execFileSync("curl.exe", ["-L", "--fail", "--max-time", "180", "--silent", "--show-error",
        `https://nodejs.org/dist/${runtimeVersion}/${name}`, "-o", target], {
        stdio: "inherit", windowsHide: true,
    });
}
const hashLine = (await readFile(checksums, "utf8")).split(/\r?\n/)
    .find(line => line.trim().split(/\s+/)[1] === runtimeName + ".zip");
const expected = hashLine?.trim().split(/\s+/)[0];
const actual = createHash("sha256").update(await readFile(runtimeZip)).digest("hex");
if (!expected || actual !== expected) throw new Error("运行程序 SHA-256 校验失败，请重新下载官方文件。");
const runtimeRoot = join(cache, runtimeName);
// Expand the verified archive each time, instead of trusting an earlier extracted executable.
runPowerShell(`Expand-Archive -LiteralPath ${psQuote(runtimeZip)} -DestinationPath ${psQuote(cache)} -Force`);

const vite = join(root, "node_modules", "vite", "bin", "vite.js");
if (!existsSync(vite)) throw new Error("教师电脑尚未安装构建依赖，请先运行 npm.cmd install。");
console.log("构建当前项目，包括已有的教学修改……");
execFileSync(process.execPath, [vite, "build"], { cwd: root, stdio: "inherit", windowsHide: true });
execFileSync(process.execPath, [join(root, "scripts", "copy-static.mjs")], {
    cwd: root, stdio: "inherit", windowsHide: true,
});

const packageName = "PackeTTrino_学生单机版_Windows64";
const buildId = new Date().toISOString().replace(/[-:.TZ]/g, "");
const destination = join(root, "tmp", "student-packages", buildId, packageName);
const output = join(root, "outputs", packageName + ".zip");
for (const directory of ["app", "launcher", "runtime", "学生实验手册", "源代码"]) {
    await mkdir(join(destination, directory), { recursive: true });
}
await cp(join(root, "dist"), join(destination, "app"), { recursive: true });
await cp(join(runtimeRoot, "node.exe"), join(destination, "runtime", "node.exe"));
await cp(join(runtimeRoot, "LICENSE"), join(destination, "runtime", "Node.js-LICENSE.txt"));
await cp(join(root, "scripts", "student-server.cjs"), join(destination, "launcher", "server.cjs"));
await cp(join(root, "LICENSE"), join(destination, "LICENSE.txt"));

// Keep the original editable web source alongside the release.
for (const name of ["index.html", "src", "styles", "animations", "scripts", "docker",
    "package.json", "pnpm-lock.yaml", "README.md", "LICENSE", "eslint.config.mjs", "jsconfig.json",
    "STANDALONE.zh-CN.md", "DEPLOYMENT.zh-CN.md", "Dockerfile", "compose.yaml", "compose.school.yaml", ".dockerignore"]) {
    await cp(join(root, name), join(destination, "源代码", name), { recursive: true });
}
// Original asset files already live in app/assets. Avoid duplicating large tutorial GIFs.
await writeFile(join(destination, "源代码", "还原网页资源.cjs"), `const fs = require("node:fs");
const path = require("node:path");
fs.cpSync(path.join(__dirname, "..", "app", "assets"), path.join(__dirname, "assets"), { recursive: true });
console.log("网页资源已还原到源代码/assets，可按 README 构建项目。");
`, "utf8");
await writeFile(join(destination, "源代码", "还原网页资源.cmd"), String.raw`@echo off
chcp 65001 >nul
cd /d "%~dp0"
"..\runtime\node.exe" ".\还原网页资源.cjs"
pause
`.replaceAll("\n", "\r\n"), "utf8");
await writeFile(join(destination, "源代码", "资源说明.txt"), "\ufeff网页源代码的原始资源共用同一练习包内的 app/assets 文件夹，以减少压缩包体积。\r\n如需单独构建源码，先双击本目录的“还原网页资源.cmd”，或将 ../app/assets 复制为当前目录下的 assets 文件夹。\r\n其余源码、样式、动画脚本、构建脚本和许可证均在当前目录。\r\n", "utf8");

function removeOnlineFonts(text) {
    return text
        .replace(/@import\s+url\(\s*(['"])https:\/\/fonts\.googleapis\.com\/.*?\1\s*\)\s*;/g, "")
        .replace(/@import\s*(['"])https:\/\/fonts\.googleapis\.com\/.*?\1\s*;/g, "");
}
async function makeOffline(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const file = join(directory, entry.name);
        if (entry.isDirectory()) await makeOffline(file);
        else if (entry.name.endsWith(".css")) {
            await writeFile(file, removeOnlineFonts(await readFile(file, "utf8")), "utf8");
        }
    }
}
await makeOffline(join(destination, "app"));
await makeOffline(join(destination, "源代码", "styles"));

const handbookRoot = join(root, "outputs", "网络实验手册_分课版");
let handbookCount = 0;
if (existsSync(handbookRoot)) {
    for (const name of await readdir(handbookRoot)) {
        if (!/^实验\d{2}_.+_学生操作手册\.docx$/.test(name)) continue;
        await cp(join(handbookRoot, name), join(destination, "学生实验手册", name));
        handbookCount++;
    }
}
const report = "初中生虚拟网络实验报告_学生填空版.docx";
if (existsSync(join(root, "outputs", report))) {
    await cp(join(root, "outputs", report), join(destination, "学生实验手册", report));
}

const launcher = String.raw`@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title PackeTTrino 学生网络实验
if not exist ".\runtime\node.exe" (
  echo 运行程序缺失。请完整解压压缩包，再双击本文件。
  pause
  exit /b 1
)
if not exist ".\launcher\server.cjs" (
  echo 启动文件缺失。请完整解压压缩包，再双击本文件。
  pause
  exit /b 1
)
".\runtime\node.exe" ".\launcher\server.cjs" %*
if errorlevel 1 pause
`;
await writeFile(join(destination, "开始网络实验.cmd"), launcher.replaceAll("\n", "\r\n"), "utf8");

const instructions = `PackeTTrino 学生单机练习包（Windows 10/11，64 位）

开始练习
1. 右键压缩包，选择“全部解压”，将全部文件解压到同一个文件夹。
2. 打开解压后的文件夹，双击“开始网络实验.cmd”。
3. 浏览器会自动打开练习页面。若没有打开，请复制启动窗口中的地址到 Edge 或 Chrome。
4. 练习期间保留启动窗口。它只供本机使用，不需要管理员权限，不用安装 Node.js、Python 或 Docker。

保存与交作业
网页不会自动保存实验。刷新页面、关闭浏览器或退出程序前，请点击底部“下载”保存 .ptt 文件。
默认文件名是 red.ptt，建议改为“班级_姓名_实验01.ptt”，并保留 .ptt 后缀。
下次启动后，点击底部“上传文件”，选择之前的 .ptt，再点击“载入网络”。
载入会替换当前工作区。作业一般提交 .ptt 文件、实验报告和关键结果截图。
保存内容主要是拓扑与设备配置，动态缓存和数据包过程需要重新运行实验。
下载的作业通常在浏览器的“下载”文件夹中；移动练习包时记得另外备份作业。

结束练习
先保存 .ptt，再关闭浏览器页面和启动窗口。也可以在启动窗口按 Ctrl+C。
再次双击启动时，可载入保存的 .ptt 继续练习。

离线使用
核心网络实验可在断网时运行，字体使用系统自带字体。
DNS 服务器默认不启用“递归 DNS 查询”。断网时请保持关闭，并使用模拟 DNS 区域记录。
软件中的网站和 Linux 终端属于网络模拟，不是真实公网浏览器或 Linux 虚拟机。

文件说明
开始网络实验.cmd：双击启动。
先读我.html：在浏览器中阅读这份说明。
学生实验手册：${handbookCount} 份学生操作手册及可用的报告模板，不含教师答案。
手册为 .docx 格式，需要现有的 Word/WPS 等软件阅读；运行模拟器不需要这些软件。
app、launcher、runtime：程序文件，请保留在原来的位置。
源代码：对应网页源代码和打包脚本，普通练习无需打开。
LICENSE.txt、runtime/Node.js-LICENSE.txt：软件及运行程序的许可证。

常见问题
不要在压缩包预览窗口里直接双击启动，也不要只复制启动文件。
浏览器未自动打开：复制启动窗口显示的网址，通常为 http://127.0.0.1:18765 。
重复启动：如果原来的程序仍在运行，将打开同一网址；请保留原来的启动窗口。
端口被占用：程序会尝试其他端口，以启动窗口显示的网址为准。
页面空白：确认已完整解压，然后按 Ctrl+F5 刷新；旧浏览器请改用 Windows 自带 Edge。
学生电脑须为 Windows 10/11 64 位，并允许运行普通桌面程序；此包不适用于 Windows 7、32 位系统或 macOS。

本包由 PackeTTrino 当前教学版本构建，保留原作者署名与许可证。
构建时间：${new Date().toISOString()}
便携运行程序：Node.js ${runtimeVersion} Windows x64（来源 nodejs.org，已核对 SHA-256）。
`;
await writeFile(join(destination, "使用说明.txt"), "\ufeff" + instructions.replaceAll("\n", "\r\n"), "utf8");
const escaped = instructions.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await writeFile(join(destination, "先读我.html"), `<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PackeTTrino 学生练习说明</title><style>
body{max-width:840px;margin:40px auto;padding:0 24px;color:#17334b;background:#f7fafc;font:16px/1.9 "Microsoft YaHei",system-ui,sans-serif}
h1{font-size:28px}pre{font:inherit;white-space:pre-wrap;background:white;border:1px solid #dbe4ec;border-radius:12px;padding:24px}
</style><h1>解压 → 双击启动 → 开始练习</h1><pre>${escaped}</pre></html>`, "utf8");
await writeFile(join(destination, "构建信息.json"), JSON.stringify({
    builtAt: new Date().toISOString(), platform: "win32-x64", runtimeVersion,
    runtimeArchiveSha256: actual, offlineFonts: true, studentHandbooks: handbookCount,
}, null, 2), "utf8");

await mkdir(dirname(output), { recursive: true });
console.log("正在生成学生压缩包……");
runPowerShell(`Compress-Archive -LiteralPath ${psQuote(destination)} -DestinationPath ${psQuote(output)} -CompressionLevel Optimal -Force`);
console.log(`完成：${output}`);
console.log(`大小：${((await stat(output)).size / 1024 / 1024).toFixed(1)} MB`);
console.log(`解压后的程序目录：${destination}`);
