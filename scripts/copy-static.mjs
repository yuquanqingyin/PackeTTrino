import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "dist");

await mkdir(output, { recursive: true });

for (const directory of ["animations", "assets", "src"]) {
    await cp(resolve(root, directory), resolve(output, directory), {
        recursive: true,
        force: true,
    });
}

console.log("已将传统脚本和运行时资源复制到 dist。");
