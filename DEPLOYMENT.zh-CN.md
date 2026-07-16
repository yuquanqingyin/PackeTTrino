# PackeTTrino 机房 Docker 部署指南

该部署方式由教师机统一提供网页服务。学生端只需要浏览器，不需要安装 Node.js、pnpm 或 Docker。

## 一、教师机准备

- Windows：安装并启动 Docker Desktop。
- Linux：安装并启动 Docker Engine，以及 Docker Compose 插件。
- 确保教师机和学生机位于能够互相访问的局域网内。

## 二、启动服务

在项目目录执行：

```powershell
docker compose up -d --build
```

查看运行状态：

```powershell
docker compose ps
```

教师机本机可以访问：

```text
http://127.0.0.1:8080
```

## 三、允许学生访问

在教师机运行 `ipconfig`，找到机房局域网网卡的 IPv4 地址。假设教师机地址为 `192.168.1.100`，学生访问：

```text
http://192.168.1.100:8080
```

如果 Windows 防火墙拦截访问，请使用管理员 PowerShell 放行 TCP 8080 端口：

```powershell
New-NetFirewallRule -DisplayName "PackeTTrino 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
```

如果仍无法访问，请检查机房交换机、无线 AP 或 VLAN 是否启用了终端隔离。

## 四、常用管理命令

查看日志：

```powershell
docker compose logs -f
```

停止服务：

```powershell
docker compose down
```

代码更新后重新构建：

```powershell
docker compose up -d --build
```

如果 8080 端口已被占用，可以临时改用 8090：

```powershell
$env:PACKTTRINO_PORT=8090
docker compose up -d --build
```

此时学生访问 `http://教师机IP:8090`。

## 五、部署行为说明

- 每位学生的拓扑和操作状态保存在各自浏览器页面中，不会互相影响。
- 容器只提供静态网页，不保存学生数据；学生需要使用项目的下载功能自行保存 `.ptt` 文件。
- 现有公网递归 DNS 功能仍由学生浏览器直接请求 Google DNS API，并不是由教师机容器代为查询。
- 如果机房不能访问 Google，建议关闭“递归 DNS 查询”，使用模拟 DNS 区域记录完成离线实验。
- Docker 部署不会让模拟浏览器访问真实百度等公网网站；HTTP、TCP 和路由仍然在项目拓扑中模拟。

