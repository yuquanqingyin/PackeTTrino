/* Local launcher for the portable Windows student package. Uses Node.js built-ins only. */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const HOST = "127.0.0.1";
const DEFAULT_PORT = 18765;
const STATUS_PATH = "/_packttrino_status";
const APP_ID = "PackeTTrino-student-portable";
const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
    ".txt": "text/plain; charset=utf-8",
};

function inside(root, target) {
    const relative = path.relative(root, target);
    return relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative);
}

function sendText(response, status, message) {
    response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(message);
}

function createServer(appRoot, packageRoot) {
    const root = fs.realpathSync(appRoot);
    return http.createServer(async (request, response) => {
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Referrer-Policy", "no-referrer");
        // Only serve local browser requests; the package is not a classroom server.
        if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/i.test(request.headers.host || "")) {
            sendText(response, 403, "仅支持本机访问。");
            return;
        }
        if (request.method !== "GET" && request.method !== "HEAD") {
            response.setHeader("Allow", "GET, HEAD");
            sendText(response, 405, "不支持此请求方式。");
            return;
        }
        let pathname;
        try {
            pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
        } catch {
            sendText(response, 400, "地址格式错误。");
            return;
        }
        if (pathname === STATUS_PATH) {
            const body = JSON.stringify({ app: APP_ID, folder: packageRoot, pid: process.pid });
            response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
            response.end(request.method === "HEAD" ? undefined : body);
            return;
        }
        if (pathname.includes("\0") || pathname.includes("\\") || pathname.includes(":")) {
            sendText(response, 403, "无法访问此文件。");
            return;
        }
        let file = path.resolve(root, "." + pathname);
        if (!inside(root, file)) {
            sendText(response, 403, "无法访问此文件。");
            return;
        }
        try {
            if ((await fs.promises.stat(file)).isDirectory()) file = path.join(file, "index.html");
            file = await fs.promises.realpath(file);
            if (!inside(root, file)) {
                sendText(response, 403, "无法访问此文件。");
                return;
            }
            const stat = await fs.promises.stat(file);
            if (!stat.isFile()) {
                sendText(response, 404, "找不到此文件。");
                return;
            }
            response.writeHead(200, {
                "Content-Type": MIME_TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
                "Content-Length": stat.size,
            });
            if (request.method === "HEAD") {
                response.end();
                return;
            }
            const stream = fs.createReadStream(file);
            stream.on("error", () => response.destroy());
            response.on("close", () => stream.destroy());
            stream.pipe(response);
        } catch (error) {
            sendText(response, error.code === "ENOENT" || error.code === "ENOTDIR" ? 404 : 500,
                "无法读取网页文件。请确认已将整个压缩包解压到同一个文件夹。");
        }
    });
}

function getRunningPackage(port) {
    return new Promise(resolve => {
        const request = http.get({ host: HOST, port, path: STATUS_PATH, timeout: 500 }, response => {
            let body = "";
            response.setEncoding("utf8");
            response.on("data", chunk => {
                body += chunk;
                if (body.length > 8192) request.destroy();
            });
            response.on("end", () => {
                try { resolve(JSON.parse(body)); } catch { resolve(null); }
            });
            response.on("error", () => resolve(null));
        });
        request.on("timeout", () => request.destroy());
        request.on("error", () => resolve(null));
    });
}

function openBrowser(url) {
    // Windows' existing default browser; no shell strings or installed tools needed.
    const child = spawn("rundll32.exe", ["url.dll,FileProtocolHandler", url], {
        windowsHide: true, detached: true, stdio: "ignore",
    });
    child.on("error", () => console.log("浏览器未自动打开，请复制上面的地址到 Edge 或 Chrome。"));
    child.unref();
}

function listen(server, port) {
    return new Promise((resolve, reject) => {
        const onError = error => reject(error);
        server.once("error", onError);
        server.listen(port, HOST, () => {
            server.removeListener("error", onError);
            resolve();
        });
    });
}

async function start({ packageRoot = path.resolve(__dirname, ".."), port = DEFAULT_PORT, noOpen = false } = {}) {
    if (!Number.isInteger(port) || port < 1024 || port > 65515) {
        throw new Error("启动端口必须为 1024 到 65515 之间的整数。");
    }
    const folder = fs.realpathSync(packageRoot);
    const appRoot = path.join(folder, "app");
    if (!fs.existsSync(path.join(appRoot, "index.html"))) {
        throw new Error("网页文件缺失。请先完整解压练习包，再双击“开始网络实验.cmd”。");
    }
    for (let candidate = port; candidate < port + 20; candidate++) {
        const running = await getRunningPackage(candidate);
        const url = `http://${HOST}:${candidate}`;
        if (running?.app === APP_ID && running.folder === folder) {
            console.log(`练习程序已经启动：${url}\n请保留原来的启动窗口。`);
            if (!noOpen) openBrowser(url);
            return { server: null, url, reused: true };
        }
        const server = createServer(appRoot, folder);
        try {
            await listen(server, candidate);
        } catch (error) {
            server.close();
            if (error.code === "EADDRINUSE" || error.code === "EACCES") continue;
            throw error;
        }
        console.log("PackeTTrino 学生单机练习\n");
        console.log(`练习页面：${url}`);
        console.log("浏览器没有自动打开时，请把上面的地址复制到 Edge 或 Chrome。\n");
        console.log("练习期间请保留这个窗口；关闭窗口或按 Ctrl+C 可以退出。");
        console.log("退出、刷新页面前，请在网页中点击“下载”保存 .ptt 作业文件。");
        console.log("保存作业后，下次可通过“载入”继续练习。\n");
        if (!noOpen) openBrowser(url);
        const stop = () => {
            server.close();
            server.closeAllConnections();
        };
        process.once("SIGINT", stop);
        process.once("SIGTERM", stop);
        return { server, url, reused: false };
    }
    throw new Error("本机可用端口不足，请关闭其他练习窗口后重试。");
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const portIndex = args.indexOf("--port");
    start({
        port: portIndex < 0 ? DEFAULT_PORT : Number(args[portIndex + 1]),
        noOpen: args.includes("--no-open"),
    }).catch(error => {
        console.error(`\n启动失败：${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = { createServer, start, DEFAULT_PORT, STATUS_PATH };
