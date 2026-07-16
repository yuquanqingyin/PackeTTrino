# PackeTTrino

## 基于网页的纯 JavaScript 网络模拟器

由 Amín Pérez 开发，始于 2025 年。

PackeTTrino 是一款完全使用原生 JavaScript、HTML 和 CSS 构建的交互式网络模拟器，无需外部前端框架。你可以用它设计、模拟并实时分析计算机网络，学习网络协议、路由以及设备通信。

## 主要功能

- 自定义网络拓扑，可添加 PC、交换机、路由器及多种服务器
- 支持 DHCP、DNS、TCP/IP、ICMP、ARP 等协议
- 自动路由和实时数据包传输动画
- 内置 Linux 风格终端、网页浏览器和数据包分析器
- 可配置的防火墙规则及实时反馈
- ARP、MAC、路由、DNS 缓存和 DHCP 租约状态表
- 浅色与深色主题

## 可用网络组件

- PC 和工作站
- 交换机
- 路由器
- DHCP 服务器
- DHCP 中继代理
- DNS 服务器
- Apache2 Web 服务器

## 环境要求

- Node.js 20.19+ 或 22.12+
- pnpm 10+
- 支持 ES6+ 的现代浏览器

## 启动项目

```bash
pnpm install
pnpm dev
```

打开终端显示的本地地址（通常为 `http://localhost:5173`）。

### Windows 提示：找不到 pnpm

项目也可以直接使用 Node.js 自带的 npm。在 PowerShell 中如果 `npm` 被脚本执行策略拦截，请显式调用 `.cmd` 文件：

```powershell
npm.cmd install
npm.cmd run dev
```

如果依赖已经安装，只需执行：

```powershell
npm.cmd run dev
```

也可以通过 Corepack 使用项目指定的 pnpm 版本，无需全局安装：

```powershell
corepack pnpm install
corepack pnpm dev
```

生产构建及本地预览：

```bash
pnpm build
pnpm preview
```

## 使用方法

1. 从底部工具栏把设备拖到工作区。
2. 将设备拖到交换机上建立连接。
3. 单击设备配置 IP 地址、子网掩码、网关等属性。
4. 使用动画控件查看数据包传输过程。
5. 查看路由表、ARP 表、DNS 表和 DHCP 租约表，了解网络状态。
6. 右键单击设备可打开终端和更多工具。

![PackeTTrino 界面](https://github.com/user-attachments/assets/0876157d-8527-45b8-bf6f-0bfe4fe8b291)

## 项目背景

本项目最初作为网络计算机系统管理专业的毕业设计开发，所有主要功能均以原生 Web 技术自行实现。

## 关键词

`网络模拟器`、`JavaScript 网络实验`、`计算机网络教学`、`Packet Tracer 替代方案`、`DHCP`、`DNS`、`TCP/IP`、`防火墙配置`
