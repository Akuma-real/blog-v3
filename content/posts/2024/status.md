---
title: 一个status项目推荐
description: 本教程介绍如何使用Docker、Cloudflare账号和服务器来监控服务器的运行状态。首先需要下载项目并新建Cloudflare KV和Worker。设置好环境变量后，可以选择安装配置duplicati监控备份状态。最后，通过Uptimerobot来进行进一步的服务器监控配置，包括API申请和监控名称配置。
date: "2024-08-02 23:08:12"
updated: "2024-08-02 15:08:12"
categories: [运维部署]
tags: [状态监控, Cloudflare KV, Uptimerobot, Docker, 服务器监控]
draft: false
---

[Demo](https://status.mcenjoy.cn)

### 简单一个原理图

![img](https://cdn.sa.net/2024/08/02/L54viynsxEeXaZk.png)

### 需要准备的东西

1. Cloudflare 账号
2. 最少一台需要监控的服务器
3. 服务器安装好 Docker

### 教程开始

#### 下载项目

请前往 [release](https://github.com/mcoo/status/releases) 自行下载

#### 新建 Cloudflare KV

![img](https://cdn.sa.net/2024/08/02/imnCtoPuhrw9Zzx.png)
这里需要设置两个值：

- `backup` 设置为 `{}`
- `errors` 设置为 `[]`

#### 新建 Cloudlfare Worker

设置环境变量，请设置到 `制作` 里面，不要搞到 `预览` 中
![img](https://cdn.sa.net/2024/08/02/3eMEglC2twhIYdb.png)

| 变量名称          | 说明                                  |
| ----------------- | ------------------------------------- |
| BACKUP_HTTP_TOKEN | 回调备份结果时用于鉴权                |
| TOKEN             | Uptimebot 的 API token 【readonly 就行】 |
| INFO              | 自定义的一些信息，看下方              |

INFO 的一个例子：

```json
{
	"name": "Enjoy",
	"rtl": true,
	"avatar": "https://cdn.linux.do/user_avatar/linux.do/mcenjoy/288/80800_2.png",
	"desc": "一个喜欢研究的宅，欢迎各位大佬交流。<br /><a style='--n-text-color: #63e2b7; --n-bezier: cubic-bezier(.4, 0, .2, 1);' href='https://linux.do/u/mcenjoy/summary' class='n-a'>@mcenjoy [LINUX.DO]</a><br /><a class='n-a' style='--n-text-color: #63e2b7; --n-bezier: cubic-bezier(.4, 0, .2, 1);' href='https://www.nodeseek.com/space/15759'>@mcenjoy [NS]</a>"
}
```

rtl 为下方状态条由右向左显示
![img](https://cdn.sa.net/2024/08/02/RJSPxwvepLWBk8n.png)
然后绑定第二步的 KV 设置名称为 `STATUS`

#### 安装配置 duplicati 【这里若不需要监控备份的状态可以跳过本步骤】

这里用的 docker-compose，端口反代什么的需要自行设置，网上应该有，不行问问 GPT

```yml
  backup:
    image: lscr.io/linuxserver/duplicati:latest
    environment:
      - PUID=0
      - PGID=0
      - TZ=Asia/Shanghai
      - CLI_ARGS= #optional
    volumes:
      - ./duplicati/config:/config # 存放duplicat的i配置文件
      - ./duplicati/backups:/backups
      - ../app:/source
    restart: unless-stopped
```

配置完备份任务后，设置 > 默认选项 > 以文本形式编辑，注意配置你自己的 `URL` 和 `BACKUP_HTTP_TOKEN`
![img](https://cdn.sa.net/2024/08/02/BN2ZQgi9b3dcAj5.png)

```ini
--send-http-level=All
--send-http-url=https://status.mcenjoy.cn/api/backup?token=<BACKUP_HTTP_TOKEN>
--send-http-verb=POST
--send-http-result-output-format=Json
```

### Uptimerobot 配置

1. [API 申请](https://old.uptimerobot.com/dashboard)
2. 监控名称配置
   ![img](https://cdn.sa.net/2024/08/02/m2uXzqpQBj5RW7C.png)

举个例子 `监控站${国家:us}${标签:info|Cloudflare Worker}${类别:应用}`

- 最后展示在页面上的名称是排除所有 `${}` 的内容，也就是 `监控站`
- `${国家:us}` 为配置前面的国家标识 [国家列表](https://flagicons.lipis.dev/)
- `${标签:info|Cloudflare Worker}` 显示在下面的标签
- `${类别:应*用}` 可自行配置类别*