---
title: 如何在Linux与Windows上部署FRP服务端
description: 本文介绍了如何在Linux和Windows系统上部署FRP服务端。Linux部分包括安装Docker和Docker Compose，创建FRPs的安装目录，编写docker-compose.yml和frps.toml配置文件，最后启动FRP服务端的Docker容器。Windows部分则涉及下载FRP，解压FRP压缩包，修改frps.toml配置文件，以及编写和运行启动脚本。
date: "2024-02-23 23:07:06"
updated: "2024-02-23 15:07:06"
categories: [运维部署]
tags: [FRP, 内网穿透, Docker, 服务端部署, 远程访问]
draft: false
---

## 在Linux系统部署FRP服务端

### 1. Docker和Docker Compose的安装

为了确保FRP服务端的灵活部署和管理，首先需要安装Docker和Docker Compose。Docker提供了容器化技术，而Docker Compose则方便我们管理容器。安装命令如下：

```bash
bash <(curl -sSL [https://linuxmirrors.cn/docker.sh](https://linuxmirrors.cn/other/))
```

这条命令会从Linux镜像网站下载并安装Docker，简化了安装过程。

### 2. 创建FRPs的安装目录

接下来，我们需要创建一个目录，用于存放FRP服务端的相关文件。执行以下命令：

```bash
mkdir -p /root/data/docker/frps
```

```bash
cd /root/data/docker/frps
```

### 3. 编写docker-compose.yml配置文件

Docker Compose通过YAML文件定义多容器的Docker应用。我们需要创建并编辑docker-compose.yml文件，定义FRP服务端的容器配置：

```yaml
version: '3.3'

services:

frps:

restart: always

network\_mode: host

volumes:

  - './frps.toml:/etc/frp/frps.toml'

container\_name: frps

image: snowdreamtech/frps
```

这个配置文件指示Docker Compose如何部署FRP服务端容器。

### 4. 编写frps.toml配置文件

FRP服务端的配置通过frps.toml文件进行。我们需要创建这个文件并填入必要的配置信息：

```toml
[common]

bind\_port= 5443

kcp\_bind\_port = 5443

dashboard\_user= 请修改此处

dashboard\_pwd= 请修改此处

dashboard\_port= 请修改此处

token = 请修改此处
```

请确保替换配置文件中的占位符（“请修改此处”）为实际的值。

### 5. 启动FRP服务端的Docker容器

配置文件准备好之后，就可以启动FRP服务端的Docker容器了：

```bash
docker-compose up -d
```

这条命令会以后台模式启动容器。

## 在Windows系统部署FRP服务端

### 1. 下载FRP

根据你的Windows系统架构（32位或64位），从FRP的GitHub仓库下载相应版本的FRP。

### 2. 解压FRP压缩包

将下载的FRP压缩包解压到适合的目录，比如 `C:\frp`。

### 3. 修改frps.toml配置文件

在FRP解压目录中找到或新建frps.toml配置文件，填写服务器端配置信息。

### 4. 编写启动脚本

在FRP目录下创建一个名为start.bat的批处理文件，内容如下：

```bat
cmd /k "frps.exe -c frps.toml"
```

双击运行start.bat批处理文件，即可启动FRP服务端。
