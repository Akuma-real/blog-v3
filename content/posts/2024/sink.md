---
title: Sink部署记录
description: 本教程详细介绍了如何将 Sink 链接缩短工具部署到 Cloudflare Pages 上。步骤包括 Fork 仓库、创建 Cloudflare Pages 项目、配置环境变量、命名空间和 Workers AI 绑定、绑定 Analytics Engine 以及重新部署的过程。每个步骤都配有图示，确保用户可以顺利完成部署。
date: "2024-09-14 20:20:27"
updated: "2024-09-14 12:20:27"
categories: [运维部署]
tags: [Sink, Cloudflare Pages, 链接缩短, 部署教程, KV存储]
draft: false
---

## Sink 部署教程：如何将 Sink 部署到 Cloudflare Pages 上

本教程将为你详细讲解如何将 Sink 链接缩短工具部署到 Cloudflare Pages 上。我们将一步步指导你完成整个过程，包括仓库的 fork、Cloudflare Pages 项目创建、环境变量配置、KV 命名空间绑定等操作。每一步都附有详细的步骤说明和图片，帮助你顺利完成部署。

---

### 步骤 1：Fork 仓库

1. 将仓库 Fork 到你的个人 GitHub 账户中。

   点击**Create fork**

   ======》[点我Fork](https://github.com/ccbikai/Sink/fork)《======
   ![Fork 仓库](https://cdn.sa.net/2024/09/14/qXuiCxPGybThf87.png)

---

### 步骤 2：创建 Cloudflare Pages 项目

1. 登录到**Cloudflare Dashboard**,导航到 **Workers 和 Pages** 选项卡，点击 **创建** 按钮。

   ![创建 Cloudflare Pages 项目](https://cdn.sa.net/2024/09/14/DC7B3PeZQXWlUqO.png)

2. 选择**Pages** 选项卡，点击**连接到Git**

   ![选择pages选项卡](https://cdn.sa.net/2024/09/14/epKwJosjV6LrgTc.png)

   ![Git项目](https://cdn.sa.net/2024/09/14/tkjpYuziJMVOSgZ.png)

3. 选择 **Nuxt.js** 作为预设，Cloudflare 会自动检测到项目的配置。

4. 配置环境变量

   - `NUXT_SITE_TOKEN`: 必须超过 8 个字符，为你的登陆密码。
   - `NUXT_CF_ACCOUNT_ID`: [查找你的账户 ID](https://www.nodeseek.com/jump?to=https%3A%2F%2Fdevelopers.cloudflare.com%2Ffundamentals%2Fsetup%2Ffind-account-and-zone-ids%2F)。
   - `NUXT_CF_API_TOKEN`: [创建 Cloudflare API 令牌](https://www.nodeseek.com/jump?to=https%3A%2F%2Fdevelopers.cloudflare.com%2Ffundamentals%2Fapi%2Fget-started%2Fcreate-token%2F)。该令牌应至少具有 `Account.Account Analytics` 权限。

   ![](https://cdn.sa.net/2024/09/14/YESzbgqdUmrIRFe.png)

   当以上步骤都配置完毕之后，点击**保存并部署**，之后点击**取消部署**
   ![cancel-build](https://cdn.sa.net/2024/09/14/QsWTI6Jg9xfjo7U.png)

   点击**继续处理项目**

   ![image-20240914195744250](https://cdn.sa.net/2024/09/14/UoZAnFe9h1yOslz.png)

---

### 步骤 3：配置 KV 命名空间和其他绑定

部署开始后，我们还需要在 Cloudflare Pages 中进行一些额外的配置：

1. 到KV创建一个命名空间
   ![image-20240914200856876](https://cdn.sa.net/2024/09/14/eckvpm64dGt1JVb.png)

1. KV名称随意

   ![image-20240914201013546](https://cdn.sa.net/2024/09/14/vT9D4JFeAINyQ6d.png)

---

### 步骤 4：KV 命名空间绑定

1. 在 **KV** 中，绑定一个 KV 命名空间并将其命名为 `KV`。

   ![image-20240914201427255](https://cdn.sa.net/2024/09/14/ql9cu2AFYZSTCIU.png)

---

### 步骤 5：Workers AI 绑定（可选）

1. 如果你希望使用 AI 生成短链接功能，导航到 **Workers AI Bindings**，绑定 `AI` 变量到 Workers AI Catalog。

   ![image-20240914201551723](https://cdn.sa.net/2024/09/14/Tw7nJvy9RhsufDU.png)

---

### 步骤 6：Analytics Engine 绑定

1. 绑定 Cloudflare Analytics Engine。将 `ANALYTICS` 变量绑定到 Sink 数据集，并确保已为你的 Cloudflare 账户启用了 Analytics Engine Beta 版。

   ![image-20240914201654389](https://cdn.sa.net/2024/09/14/vIVa5Ub6oG1hpDr.png)

---

### 步骤 7：重新部署

1. 所有绑定完成后，回到 **部署**，点击**···**，点击**重试部署**。

   ![image-20240914201751830](https://cdn.sa.net/2024/09/14/L98oajYndEyb5AQ.png)

2. 重新部署后，项目将正常运行
