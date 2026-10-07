const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");
const { createServer, start, DEFAULT_PORT, STATUS_PATH } = require("./student-server.cjs");

// Fixtures stay in the workspace and use names found on students' Windows computers.
async function fixture(t) {
    const parent = path.resolve(__dirname, "..", "tmp", "student-launcher-tests");
    await fs.mkdir(parent, { recursive: true });
    const folder = await fs.mkdtemp(path.join(parent, "中文 空格-"));
    const appRoot = path.join(folder, "app");
    await fs.mkdir(path.join(appRoot, "assets"), { recursive: true });
    await fs.writeFile(path.join(appRoot, "index.html"), "<html lang=zh-CN>学生实验</html>");
    await fs.writeFile(path.join(appRoot, "assets", "界面.css"), "body{color:red}");
    await fs.writeFile(path.join(folder, "private.txt"), "not-a-web-resource");
    return { folder, appRoot };
}

function request(port, pathname, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request({ host: "127.0.0.1", port, path: pathname, ...options }, res => {
            let body = "";
            res.setEncoding("utf8");
            res.on("data", chunk => { body += chunk; });
            res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
        });
        req.on("error", reject);
        req.end();
    });
}

async function listening(t, appRoot, folder) {
    const server = createServer(appRoot, folder);
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    return { server, port: server.address().port };
}

test("serves an extracted package in a Chinese path with spaces", async t => {
    const { folder, appRoot } = await fixture(t);
    const { port } = await listening(t, appRoot, folder);
    const page = await request(port, "/");
    assert.equal(page.status, 200);
    assert.match(page.body, /学生实验/);
    assert.match(page.headers["content-type"], /text\/html/);
    assert.equal(page.headers["cache-control"], "no-store");
    const stylesheet = await request(port, "/assets/" + encodeURIComponent("界面.css"));
    assert.equal(stylesheet.status, 200);
    assert.match(stylesheet.headers["content-type"], /text\/css/);
    const head = await request(port, "/", { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(head.body, "");
});

test("does not expose other package files or accept non-local hosts", async t => {
    const { folder, appRoot } = await fixture(t);
    const { port } = await listening(t, appRoot, folder);
    for (const pathname of ["/..%2fprivate.txt", "/%2e%2e%5cprivate.txt", "/C:%5cWindows", "/%00"]) {
        const response = await request(port, pathname);
        assert.equal(response.status, 403, pathname);
        assert.doesNotMatch(response.body, /not-a-web-resource/);
    }
    assert.equal((await request(port, "/missing.js")).status, 404);
    assert.equal((await request(port, "/%XX")).status, 400);
    assert.equal((await request(port, "/", { method: "POST" })).status, 405);
    assert.equal((await request(port, "/", { headers: { Host: "example.com" } })).status, 403);
    const status = JSON.parse((await request(port, STATUS_PATH)).body);
    assert.equal(status.folder, await fs.realpath(folder));
});

test("uses the next port when busy and reuses the same running package", async t => {
    const { folder, appRoot } = await fixture(t);
    const { port } = await listening(t, appRoot, "a different package");
    const result = await start({ packageRoot: folder, port, noOpen: true });
    assert.equal(result.reused, false);
    assert.ok(result.server.address().port > port);
    assert.equal(result.server.address().address, "127.0.0.1");
    t.after(() => new Promise(resolve => result.server.close(resolve)));
    const second = await start({ packageRoot: folder, port, noOpen: true });
    assert.equal(second.reused, true);
    assert.equal(second.url, result.url);
    assert.equal(second.server, null);
});

test("reports incomplete extraction and invalid ports clearly", async t => {
    const { folder } = await fixture(t);
    await fs.rename(path.join(folder, "app", "index.html"), path.join(folder, "app", "other.html"));
    await assert.rejects(start({ packageRoot: folder, noOpen: true }), /完整解压/);
    await assert.rejects(start({ packageRoot: folder, port: NaN, noOpen: true }), /启动端口/);
    assert.equal(DEFAULT_PORT, 18765);
});
