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

## 六、本机构建验证，学校下载同一个镜像

学校无需再构建一遍项目。推荐流程为：本机构建并测试 → 上传镜像仓库 → 学校下载并运行 → 学生机实际访问验收。

登录同一个 Docker Hub 账号不会自动同步本地镜像，必须先执行 `docker push`。公开镜像通常不需要登录即可下载；私有镜像需要在学校使用有下载权限的账号登录。不要把账号密码写进部署文件。

以下示例按学校使用 Linux 容器、Intel/AMD 64 位 CPU（`linux/amd64`）编写。Windows 教师机使用 Docker Desktop 的 Linux 容器模式即可构建这种镜像；学校 Linux 服务器不需要 Docker Desktop，只需 Docker Engine 和 Compose 插件。如果学校是 ARM 服务器，请改为 `linux/arm64` 并测试对应平台，或者制作包含两种架构的多平台镜像。Windows Server 也必须有能够运行 Linux 容器的环境，例如 Linux 虚拟机里的 Docker Engine。

### 本项目的实际场景：Win11 本机 → Win10 学校机

两边都采用 Docker Desktop 的 Linux 容器模式时，可以使用同一个 `linux/amd64` 镜像，学校无需重新构建。Docker Desktop 可以通过 WSL 2 提供 Linux 运行环境；Windows 的版本号不决定需要使用 Windows 容器镜像。本项目的 Node Alpine 构建镜像和 Nginx Alpine 运行镜像都属于 Linux 镜像。

学校只需在提供网页服务的那台 Win10 电脑准备 Docker Desktop 和 WSL 2。其余学生机仍然只需要浏览器，不需要安装 Docker 或 WSL。

在安装前，先确认学校电脑的系统版本、内存和虚拟化条件。当前 Docker 安装文档列出的 Windows 10 条件包括：64 位、22H2（内部版本 19045）、WSL 2.1.5 或更新版本、至少 8 GB 内存，以及 BIOS/UEFI 中启用硬件虚拟化。同时，Docker 文档声明只支持仍在微软服务周期内的 Windows 版本，因此需要核对学校 Win10 的具体版本、服务状态和计划安装的 Docker Desktop 版本，不能仅凭“Win10”判断可用。

可以先在学校 PowerShell 中查看：

```powershell
Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber,OSArchitecture
wsl --version
```

Docker Desktop 启动就绪后检查：

```powershell
docker version
docker info --format '{{.OSType}}'
```

第一条应同时显示 Client 和 Server，第二条应输出 `linux`。两边的镜像迁移步骤相同：在 Win11 构建、运行并验证后，上传到仓库或导出 `.tar`；在 Win10 下载或导入，再启动学校部署配置。学校最后通过一台学生机验证 `http://学校机局域网IP:8080` 可访问。Win10 的防火墙需要允许对应端口。

Windows 普通桌面电脑作为网页服务器时，需要保持开机、禁用课堂期间的自动睡眠，并保持 Docker Desktop 运行。只使用 `restart: unless-stopped` 不会让 Docker Desktop 在无人登录时自动启动；如需持续服务，还要验证学校机重启、登录和 Docker Desktop 启动后的完整恢复过程。

参考：[Docker Desktop Windows 安装要求](https://docs.docker.com/desktop/setup/install/windows-install/)、[WSL 2 后端](https://docs.docker.com/desktop/features/wsl/)。

### 1. 教师本机构建并验证

先启动 Docker Desktop，确认 `docker version` 同时显示 Client 和 Server。然后在项目目录执行：

```powershell
docker build --platform linux/amd64 -t packttrino-zh:2026-10-07 .
docker run -d --name packttrino-test -p 127.0.0.1:8080:80 packttrino-zh:2026-10-07
docker inspect --format '{{.State.Health.Status}}' packttrino-test
```

如果 8080 已被其他服务占用，测试时将映射改为 `127.0.0.1:8090:80`，浏览器访问对应端口。健康检查可能先显示 `starting`，约 30 秒后再检查，预期为 `healthy`。

打开 `http://127.0.0.1:8080`，确认设备工具栏、拖放设备、两台 PC 的 ping、实验下载与重新载入正常。容器健康检查只检查网页服务是否响应，不能替代这些功能检查。

镜像版本号可自行指定，发布每个新版本时使用新标签，避免覆盖已验证的旧版本。

### 2. 上传到 Docker Hub

在 Docker Hub 中创建名为 `packttrino-zh` 的镜像仓库，并确认希望使用公开还是私有仓库。将下列命令中的 `yourname` 替换为自己的 Docker Hub 用户名，然后执行：

```powershell
docker login
docker tag packttrino-zh:2026-10-07 yourname/packttrino-zh:2026-10-07
docker push yourname/packttrino-zh:2026-10-07
```

上传的是已测试的同一个镜像，不会在这里重新构建。镜像中的网页代码可以被有下载权限的人查看，因此不要将凭据放入网页源码。构建会排除 `outputs` 和 `tmp` 中的教学资料、单机包和临时文件。

### 3. 学校只下载并运行

将本项目的 `compose.school.yaml` 复制到学校服务器一个单独的部署目录。在同目录新建名为 `.env` 的文本文件，写入：

```dotenv
PACKTTRINO_IMAGE=yourname/packttrino-zh:2026-10-07
PACKTTRINO_PORT=8080
```

将 `yourname` 替换为实际用户名。私有仓库先在学校服务器执行 `docker login`；公开仓库通常可以直接下载。

在此部署目录执行：

```bash
docker compose -f compose.school.yaml pull
docker compose -f compose.school.yaml up -d --no-build
docker compose -f compose.school.yaml ps
```

学校不用复制项目源码，也不用安装 Node.js 或 pnpm。这个文件只有 `image`，没有 `build`，因此不会在学校重新构建。

学生访问 `http://学校服务器IP:8080`。按照前文放行端口，确认路由、VLAN 和终端隔离设置允许学生访问服务器。重启后，Docker 服务需要自动启动，容器的 `unless-stopped` 策略才会恢复服务。

### 4. 到学校仍需实际验收

本机成功说明镜像在已测试的平台上可用；学校的 Docker 环境、网络和浏览器仍要验证。

- 服务器查看容器状态为 `healthy`，本机能打开网页。
- 至少一台学生机使用服务器的局域网 IP 打开网页，工具栏和设备图标显示完整。
- 在学生机完成两台 PC 的 ping，并下载 `.ptt`，刷新后上传、载入，确认拓扑与配置恢复。
- 同时打开第二台学生机，确认两个浏览器的实验互不影响。
- 如果服务器要持续提供服务，确认 Docker 已配置开机启动，并验证服务器重启后仍可访问。

这些检查通过后再发全班网址。Docker 不会自动开放学校防火墙或消除 VLAN 隔离。

## 七、无法访问 Docker Hub：U 盘离线导入

在教师机上，将已经构建并验证的镜像保存为文件：

```powershell
docker save -o outputs/packttrino-2026-10-07-linux-amd64.tar packttrino-zh:2026-10-07
```

将该 `.tar` 和 `compose.school.yaml` 一起带到学校。在已经装好 Docker 的学校服务器上执行：

```bash
docker load -i packttrino-2026-10-07-linux-amd64.tar
```

在部署目录的 `.env` 中使用本地镜像名：

```dotenv
PACKTTRINO_IMAGE=packttrino-zh:2026-10-07
PACKTTRINO_PORT=8080
```

然后启动，不尝试联网拉取：

```bash
docker compose -f compose.school.yaml up -d --no-build --pull never
docker compose -f compose.school.yaml ps
```

此方案无需 Docker Hub 账号，也无需服务器联网下载应用镜像。镜像文件包含运行所需的镜像层，学校仍需预先准备好 Docker Engine 和 Compose，并满足平台及网络条件。

建议将离线镜像文件作为课堂部署的备用方案。学生浏览器中的公网递归 DNS 查询仍需要外网；离线时保持关闭即可进行模拟 DNS 实验。

官方参考：[构建、上传和下载镜像](https://docs.docker.com/get-started/tutorials/run-an-app/)、[镜像导出](https://docs.docker.com/reference/cli/docker/image/save/)、[镜像导入](https://docs.docker.com/reference/cli/docker/image/load/)、[平台兼容性](https://docs.docker.com/build/building/multi-platform/)。
