---
title: 一个status项目推荐
description: 一个基于Cloudflare Worker和UptimeRobot的服务状态监控项目推荐，支持Docker部署和备份监控
date: 2024-08-02 09:05:00
updated: 2024-08-02 09:05:00
# image:
# type: story
categories: [项目推荐, 服务器运维]
tags: [status, 监控, Cloudflare, Docker, UptimeRobot, 服务器监控, 项目推荐]
---

[Demo](https://status.mcenjoy.cn)

# 简单一个原理图

![1d4630b1a8a008e59392883bf60667f7.png](https://cdn.sa.net/2024/08/02/L54viynsxEeXaZk.png)

# 需要准备的东西

1.  Cloudflare 账号
    
2.  最少一台需要监控的服务器
    
3.  服务器安装好 Docker
    

# 教程开始

## 下载项目

请前往 [release](https://github.com/mcoo/status/releases) 自行下载

## 新建 Cloudflare KV

![9bdac21372d9b809f0676a088fde9bf4.png](https://cdn.sa.net/2024/08/02/imnCtoPuhrw9Zzx.png)

这里需要设置两个值：

- `backup` 设置为 `{}`

- `errors` 设置为 `[]`

## 新建 Cloudlfare Worker

设置环境变量

![de86b2f94d988b3287d2ff285dc97695.png](https://cdn.sa.net/2024/08/02/3eMEglC2twhIYdb.png)

|     |     |
| --- | --- |
| 变量名称 | 说明  |
| BACKUP_HTTP_TOKEN | 回调备份结果时用于鉴权 |
| TOKEN | Uptimebot 的 API token 【readonly 就行】 |
| INFO | 自定义的一些信息，看下方 |

INFO 的一个例子：

    {
        "name": "Enjoy",
        "rtl": true,
        "avatar": "https://cdn.linux.do/user_avatar/linux.do/mcenjoy/288/80800_2.png",
        "desc": "一个喜欢研究的宅，欢迎各位大佬交流。<br /><a style='--n-text-color: #63e2b7; --n-bezier: cubic-bezier(.4, 0, .2, 1);' href='https://linux.do/u/mcenjoy/summary' class='n-a'>@mcenjoy [LINUX.DO]</a><br /><a class='n-a' style='--n-text-color: #63e2b7; --n-bezier: cubic-bezier(.4, 0, .2, 1);' href='https://www.nodeseek.com/space/15759'>@mcenjoy [NS]</a>"
    }

rtl 为下方状态条由右向左显示

![b49cffe1f17d43fecd89f093fdf6d98c.png](https://cdn.sa.net/2024/08/02/RJSPxwvepLWBk8n.png)

然后绑定第二步的 KV 设置名称为 `STATUS`

## 安装配置 duplicati 【这里若不需要监控备份的状态可以跳过本步骤】

这里用的 docker-compose，端口反代什么的需要自行设置，网上应该有，不行问问 GPT

      backup:
        image: lscr.io/linuxserver/duplicati:latest
        environment:
          - PUID=0
          - PGID=0
          - TZ=Asia/Shanghai
          - CLI_ARGS= #optional
        volumes:
          - ./duplicati/config:/config # 存放duplicati的配置文件
          - ./duplicati/backups:/backups
          - ../app:/source
        restart: unless-stopped

配置完备份任务后，设置 > 默认选项 > 以文本形式编辑，注意配置你自己的 `URL` 和 `BACKUP_HTTP_TOKEN`

![6bf944e763273e79fa3d93ed853f440c.png](https://cdn.sa.net/2024/08/02/BN2ZQgi9b3dcAj5.png)

    --send-http-level=All
    --send-http-url=https://status.mcenjoy.cn/api/backup?token=<BACKUP_HTTP_TOKEN>
    --send-http-verb=POST
    --send-http-result-output-format=Json

# Uptimerobot 配置

1.  [API 申请](https://old.uptimerobot.com/dashboard)
    
2.  监控名称配置
    

![df78edae3e876a8bce8b9785a3f399d3.png](https://cdn.sa.net/2024/08/02/m2uXzqpQBj5RW7C.png)

举个例子 `监控站${国家:us}${标签:info|Cloudflare Worker}${类别:应用}`

- 最后展示在页面上的名称是排除所有 `${}` 的内容，也就是 `监控站`

- `${国家:us}` 为配置前面的国家标识 [国家列表](https://flagicons.lipis.dev/)

- `${标签:info|Cloudflare Worker}` 显示在下面的标签

- `${类别:应用}` 可自行配置类别