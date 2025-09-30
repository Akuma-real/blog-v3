---
title: use-mcprouter-in-codex
description: 讲述关于 use-mcprouter-in-codex 的实践，并根据 AI、MCP、Codex 给出经验分享与坑位总结。
date: 2025-09-30 11:27:49
updated: 2025-09-30 11:27:49
image: 
categories: [经验分享]
tags: [ai, mcp, codex]
---

# 叠甲，瞎写写的教程，有不合理的地方还望指出

# 一、配置相关环境

*在确保已经安装了 nodejs 和 python 相关环境后*

## 1. 安装 uv

执行下列命令安装 uv

```bash
pip3 install uv
```
## 2. 安装 mcpr-cli

执行下列命令安装 mcpr-cli 服务

```bash
npm install -g mcpr-cli@latest
```

# 二、配置 MCP Router

## 1. 安装 mcp-router

从 https://github.com/mcp-router/mcp-router/releases 下载最新的安装包进行安装。

![7eOSmKg2FXMTEctUbo12uX4dab2NqbSm.webp](https://cdn.nodeimage.com/i/7eOSmKg2FXMTEctUbo12uX4dab2NqbSm.webp)
（截图：MCP Router 安装包下载页面）
## 2. MCP 添加的方法

1. 点击左侧的 ***MCP Servers***
2. 点击右侧的加号，进行 MCP 的添加

![duB7Op8Z1tFC84QzM7QrFy7pn9olrGPI.webp](https://cdn.nodeimage.com/i/duB7Op8Z1tFC84QzM7QrFy7pn9olrGPI.webp)
（截图：添加 MCP Server 入口）

1. 点击 ***Manual***
2. 点击 ***Create Manually***
3. 输入 MCP 的名称，建议命名为 `mcp_servers.xxxxxx`
4. 输入 MCP 的命令，一般为 `npx` 或者其他
5. 输入 MCP 的参数，一般为 MCP 的名称等

![Tb85CNwW7ZyVK6PRwihATGrJJ1o5dL7p.webp](https://cdn.nodeimage.com/i/Tb85CNwW7ZyVK6PRwihATGrJJ1o5dL7p.webp)
（截图：手动创建 MCP Server 表单）

![hnjiqsMaQ36RPZi8Xvv0oBFlGdsGl1Jq.webp](https://cdn.nodeimage.com/i/hnjiqsMaQ36RPZi8Xvv0oBFlGdsGl1Jq.webp)
（截图：示例参数填写）

常见配置示例（Command + Arguments）：

```bash
npx -y @upstash/context7-mcp@latest
npx -y @wonderwhy-er/desktop-commander
npx -y mcp-deepwiki@latest
npx @playwright/mcp@latest
```
提示：
- Windows 下路径分隔符需使用反斜杠并在 TOML 中转义为 `\\`
- 首次使用 `npx` 会下载依赖，耗时与网络相关
- 若命令行权限受限，请以管理员身份运行终端

## 3. 我使用的 MCP 列表

| Server Name | Command | Arguments | Environment Variables | 用途 |
| --- | --- | --- | --- | --- |
| mcp_servers.context7 | npx | -y @upstash/context7-mcp@latest |  | 官方文档聚合与检索 |
| mcp_servers.desktop-commander | npx | -y @wonderwhy-er/desktop-commander |  | 本地文件/进程/搜索/编辑/REPL |
| mcp_servers.mcp-deepwiki | npx | -y mcp-deepwiki@latest |  | 文档仓库补充检索 |
| mcp_servers.playwright | npx | @playwright/mcp@latest |  | 页面自动化与截图校验 |
## 4. 配置与 Codex 的连接

由于 MCP Router 暂未直接内置 Codex 集成，需要手动添加。

1. 点击左侧的 ***MCP APP Integrations***
2. 输入任意你想取的名称，例如 `codex`
3. 点击右侧的 ***Add Custom App*** 进行添加

![QiBVWc8tkxhy6aQ0k2PJ2ToH3Fwjogs5.webp](https://cdn.nodeimage.com/i/QiBVWc8tkxhy6aQ0k2PJ2ToH3Fwjogs5.webp)
（截图：添加自定义 App）

接下来点击新添加的 App：`codex` 下方的 ***How To Use*** 获取 Codex 连接 MCP Router 需要使用的密钥。

![TPlHiLAp5qptR4yZMfBWQBSYckYDPYHY.webp](https://cdn.nodeimage.com/i/TPlHiLAp5qptR4yZMfBWQBSYckYDPYHY.webp)
![8ek68e629SlnmBz8Jj3Zn9W6HKpEEN9t.webp](https://cdn.nodeimage.com/i/8ek68e629SlnmBz8Jj3Zn9W6HKpEEN9t.webp)
（截图：How To Use 页面与令牌展示）

安全提示：
- 切勿在公共仓库或截图中泄露真实令牌
- 建议将令牌保存在系统“用户环境变量”中，避免硬编码
# 三、codex 的配置

首先打开 Codex 的配置目录，一般在 `C:\\Users\\<你的用户名>\\.codex` 目录下

![HtyKGINkOusiQu2BTdKc5fxORxlQV91g.webp](https://cdn.nodeimage.com/i/HtyKGINkOusiQu2BTdKc5fxORxlQV91g.webp)
（截图：Codex 配置目录）

打开 `config.toml`，添加 MCP Router 的配置（提供两种写法，仅需其一）：

方案 A：使用绝对路径（更稳定）

```toml
[mcp_servers.mcp-router]
command = "C:\\Program Files\\nodejs\\node.exe"
args = ["C:\\Users\\<你的用户名>\\AppData\\Roaming\\npm\\node_modules\\mcpr-cli\\dist\\mcpr.js", "connect"]
env = { SystemRoot = "C:\\WINDOWS", COMSPEC = "C:\\WINDOWS\\system32\\cmd.exe", MCPR_TOKEN = "<你的_MCPR_TOKEN>" }
```

方案 B：使用 `node`（更通用，取决于 PATH）

```toml
[mcp_servers.mcp-router]
command = "node"
args = ["C:\\Users\\<你的用户名>\\AppData\\Roaming\\npm\\node_modules\\mcpr-cli\\dist\\mcpr.js", "connect"]
env = { SystemRoot = "C:\\WINDOWS", COMSPEC = "C:\\WINDOWS\\system32\\cmd.exe", MCPR_TOKEN = "<你的_MCPR_TOKEN>" }
```
注意：
- Windows 下反斜杠需写成 `\\` 以便 TOML 正确解析
- `node` 方式需确保 Node 已加入 PATH；否则使用方案 A
- 首次连接会初始化依赖与缓存，耗时与网络相关

# 四、提示词的优化

一个好的提示词可以让 AI 主动使用 MCP。建议在 `C:\\Users\\<你的用户名>\\.codex` 下创建全局 `AGENTS.md`，强调 MCP 的用法与调用策略。

最小可用 AGENTS.md 示例：

```md
# 全局 AGENTS.md（最小示例）
- 工具优先级：桌面指令 > Context7 > DeepWiki > DevTools
- 单轮单工具：每轮最多调用一种外部服务
- 最小必要：搜索/写入范围尽量收敛，避免噪声
- 安全边界：不上传敏感信息；令牌不出现在日志
- 失败降级：首选替代工具；不可用则给出保守答案
- 记录规范：追加“工具调用简报”便于审计
```
# 兼容性与常见问题（FAQ）

- 路径转义：在 TOML 中 Windows 路径请使用 `\\`
- Node 版本：过旧可能导致 `npx`/依赖安装失败，建议 20+
- 首次 `npx`：会下载包到用户缓存目录，耗时与网络相关
- 权限问题：若遇拒绝访问，请以管理员身份运行终端
- Codex 版本：不同版本对 MCP 的支持可能有差异，请关注更新日志

# 参考与声明

- MCP Router: https://github.com/mcp-router/mcp-router
- Codex CLI: https://github.com/OpenAI/codex
