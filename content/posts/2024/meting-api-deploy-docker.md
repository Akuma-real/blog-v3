---
title: Meting-API Docker 部署指南
description: 本文提供了如何使用Docker和Docker Compose安装和配置Meting-API服务的指南。首先，需创建包含Docker配置文件的项目文件夹和Docker Compose文件。然后，在终端中运行Docker Compose命令来启动Meting-API容器。此外，还提供了关于如何配置反向代理和如何处理常见问题（如修改端口和查看日志）的信息。
date: "2024-04-29 16:45:57"
updated: "2024-04-29 08:45:57"
categories: [运维部署]
tags: [Meting-API, Docker, Docker Compose, 容器部署, 音乐API]
draft: false
---

## 前置要求

确保您的系统已安装以下软件：

- Docker
- Docker Compose

您可以访问 Docker 官网来获取安装指南。

## 设置项目

### 1. 创建项目文件夹

首先，在您希望的位置创建一个新的文件夹，这将用于存放 Docker 配置文件：

```bash
mkdir meting-api
cd meting-api
```

### 2. 创建 Docker Compose 文件

在 `meting-api` 文件夹中，创建一个名为 `docker-compose.yml` 的文件，并粘贴以下内容：

```yaml
version: '3.8'

services:
  meting:
    image: intemd/meting-api:latest
    container_name: meting
    ports:
      - '3000:3000'
    restart: always
```

![](https://cdn.sa.net/2024/04/29/vxjnITVgeUYJCB1.png)
这个配置定义了使用 `intemd/meting-api:latest` 镜像的一个服务。服务将映射 3000 端口到容器的 3000 端口，并设置为始终重新启动。

### 3. 保存文件

确保 `docker-compose.yml` 文件已经正确保存。

## 运行 Docker Compose

在包含 `docker-compose.yml` 文件的目录中，打开终端或命令行工具，运行以下命令来启动您的 Meting-API 容器：

```bash
docker-compose up -d
```

该命令会在后台启动 Meting-API 服务。

## 配置反向代理规则

在你的反向代理配置文件中加入以下的规则

```
location /meting/ {
    proxy_pass http://localhost:3000/;
    proxy_set_header X-Forwarded-Host $scheme://$host:$server_port/meting;
}
```

![](https://cdn.sa.net/2024/04/29/QNKjtHrW9P4Zpnf.png)

## 常见问题解答

### 修改端口号

如果您需要改变容器对外的端口，只需修改 `docker-compose.yml` 中的 `ports` 部分。例如，将端口改为 `4000:3000`。

### 查看容器日志

要查看容器的日志，可以使用以下命令：

```bash
docker-compose logs
```

[Github](https://github.com/xizeyoupan/Meting-API)
