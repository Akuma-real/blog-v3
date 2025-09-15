---
title: 脚本收集
description: 本文介绍了几个关于GNU/Linux系统软件源更换、Docker安装、IP质量检测以及科技lion一键脚本工具的相关脚本。主要涉及中国大陆、中国大陆教育网和海外地区的系统软件源更换，IP质量检测脚本包括多家数据库查询、DNS黑名单查询、IPV4和IPV6检测等。科技lion提供了官网版、GitHub版和国内版三种一键脚本工具。
date: "2024-07-27 23:14:49"
updated: "2024-07-27 15:14:49"
categories: [脚本工具]
tags: [脚本工具, Linux源更换, Docker安装, IP检测, 科技lion脚本]
draft: false
---

## GNU/Linux 更换系统软件源脚本及 Docker 安装脚本

- 中国大陆

```
bash <(curl -sSL https://linuxmirrors.cn/main.sh)
```

- 中国大陆教育网

```
bash <(curl -sSL https://linuxmirrors.cn/main.sh) --edu
```
- 海外地区

```
bash <(curl -sSL https://linuxmirrors.cn/main.sh) --abroad
```

## 融合怪测评脚本
### 融合怪命令

```bash
curl -L https://gitlab.com/spiritysdx/za/-/raw/main/ecs.sh -o ecs.sh && chmod +x ecs.sh && bash ecs.sh
```

### IP质量检测
- IP质量检测，含多家数据库查询，含DNS黑名单查询
- 含 ```IPV4``` 和 ```IPV6``` 检测，含ASN和地址查询

```bash
bash <(wget -qO- bash.spiritlhl.net/ecs-ipcheck)
```

## 科技lion一键脚本工具
- 官网版

```bash
curl -sS -O https://kejilion.pro/kejilion.sh && chmod +x kejilion.sh && ./kejilion.sh
```

- GitHub版

```bash
curl -sS -O https://raw.githubusercontent.com/kejilion/sh/main/kejilion.sh && chmod +x kejilion.sh && ./kejilion.sh
```

- 国内版

```bash
curl -sS -O https://raw.gitmirror.com/kejilion/sh/main/cn/kejilion.sh && chmod +x kejilion.sh && ./kejilion.sh
```

## IP质量体检脚本
- 默认双栈检测

```bash
bash <(curl -Ls IP.Check.Place)
```

- 只检测IPv4结果

```bash
bash <(curl -Ls IP.Check.Place) -4
```

- 只检测IPv6结果

```bash
bash <(curl -Ls IP.Check.Place) -6
```
