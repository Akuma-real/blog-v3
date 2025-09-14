---
title: Ubuntu 18.04中如何关闭ROS智能小车AP模式及连接Wi-Fi
description: 本文介绍了如何通过编辑 NetworkManager 配置文件来关闭 ROS 智能小车的 AP 模式，并连接到指定的 Wi-Fi 网络。步骤包括修改配置文件中的 [keyfile] 部分，重启 NetworkManager，检查无线网络接口状态，并使用特定命令连接到 Wi-Fi。若连接后网络状态异常，建议重启网络管理器或计算机。
date: "2023-06-13 21:32:30"
updated: "2023-06-13 13:32:30"
categories: [Linux教程]
tags: [Ubuntu 18.04, Wi-Fi配置, NetworkManager, ROS智能小车, 网络管理]
draft: false
---

## 步骤 1：编辑 NetworkManager 配置文件

打开终端并输入以下命令：

```bash

sudo nano /etc/NetworkManager/NetworkManager.conf

```

## 步骤 2：添加或修改 [keyfile] 部分

在配置文件中找到 `[keyfile]` 部分，或者如果没有找到，则创建一个。然后添加或修改以下行：

```plaintext
unmanaged-devices=none
```

这将允许 NetworkManager 管理所有设备。

## 步骤 3：保存更改并关闭文件

按 `Ctrl + X` 保存更改并关闭文件。

## 步骤 4：重启 NetworkManager

在终端中执行以下命令以重启 NetworkManager：

```bash
sudo systemctl restart NetworkManager
```

## 步骤 5：检查无线网络接口状态

使用以下命令检查无线网络接口（如 `wlan0`）的状态：

```bash
nmcli device status
```

此时，无线网络接口应显示为 “disconnected” 或 “unmanaged”。

## 步骤 6：连接到指定 Wi-Fi

使用以下命令连接到指定 Wi-Fi，将 `<Wi-Fi名称>` 和 `<密码>` 替换为你的 Wi-Fi 名称和密码：

```bash
nmcli device wifi connect <Wi-Fi名称> password <密码>
```

## 步骤 7：重新检查无线网络接口状态

再次使用以下命令检查无线网络接口的状态：

```bash
nmcli device status
```

如果无线网卡状态不是 “connected” 或 “disconnected”，请尝试重启网络管理器或重新启动计算机。

现在，成功关闭了 ROS 智能小车的 AP 模式，并连接到了指定的 Wi-Fi 网络。