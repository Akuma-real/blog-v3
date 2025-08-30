---
title: 解决CentOS 7生命周期结束后的yum源问题
description: CentOS 7于2024年6月30日正式停止支持，导致默认yum源失效。本文提供三种有效解决方案，包括替换repo文件、修改现有配置和切换到CentOS Vault存档库，帮助用户继续使用yum进行软件包管理，同时建议及时迁移到受支持的Linux发行版
date: 2024-08-05 15:14:00
updated: 2024-08-05 15:14:00
# image:
# type: story
categories: [Linux运维, 系统管理]
tags: [CentOS, yum源, 系统维护, Linux, 服务器运维, 软件包管理, CentOS7, EOL]
---

# 解决CentOS 7生命周期结束后的yum源问题

自2024年6月30日起，CentOS 7的生命周期正式结束，这意味着官方将不再对其进行支持和维护。对于使用CentOS 7的用户而言，这不仅意味着安全更新的停止，还意味着默认的yum源将无法再使用。如果您在使用yum命令安装或更新软件包时遇到404错误或"Could not resolve host: mirrorlist.centos.org; Unknown error"的提示，那么很有可能是因为yum源已经失效。

为了解决这个问题，本文将介绍几种更换yum源的方法，并提供相关操作步骤，帮助您顺利过渡。同时，我们也建议及时更换操作系统，以保持系统的安全性和稳定性。

# 方法一：通过替换yum配置文件

这种方法通过下载新的repo文件替换现有文件，步骤简单且易于执行。

## 步骤1：使用wget命令下载新的repo文件

    wget -O /etc/yum.repos.d/CentOS-Base.repo http://file.kangle.cccyun.cn/repo/Centos-7.repo

或

    curl -o /etc/yum.repos.d/CentOS-Base.repo http://file.kangle.cccyun.cn/repo/Centos-7.repo

这一步将新的repo文件下载到指定目录，替换现有的yum配置文件。

## 步骤2：重建yum缓存

    yum clean all

    yum makecache

清理yum缓存并重新生成缓存，以确保新的源配置生效。

# 方法二：通过修改现有yum配置文件

这种方法通过直接编辑现有的yum配置文件，将yum源指向CentOS Vault存档库。

## 步骤1：注释掉现有的mirrorlist配置

    sudo sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-*

这一步将yum配置文件中的mirrorlist条目注释掉，使其不再使用官方镜像列表。

## 步骤2：启用baseurl指向CentOS Vault

    sudo sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*

这一步将注释掉的baseurl修改为启用状态，并将其指向CentOS Vault存档库。

## 步骤3：重建yum缓存

    yum clean all

    yum makecache

清理yum缓存并重新生成缓存，以确保新的源配置生效。

# 方法三：通过编辑现有repo文件

这种方法类似于方法二，但提供了更为详细和具体的编辑步骤。

## 步骤1：替换mirror.centos.org为vault.centos.org

    sed -i s/mirror.centos.org/vault.centos.org/g /etc/yum.repos.d/*.repo

这一步将所有repo文件中的mirror.centos.org替换为vault.centos.org。

## 步骤2：启用baseurl

    sed -i s/^#.*baseurl=http/baseurl=http/g /etc/yum.repos.d/*.repo

将注释掉的baseurl修改为启用状态。

## 步骤3：注释掉mirrorlist

    sed -i s/^mirrorlist=http/#mirrorlist=http/g /etc/yum.repos.d/*.repo

将所有repo文件中的mirrorlist条目注释掉。

## 步骤4：重建yum缓存

    yum clean all

    yum makecache

清理yum缓存并重新生成缓存，以确保新的源配置生效。

# 小结

这三种方法在实现目标上是相同的，但具体实现过程和细节有所不同。方法一通过下载新的repo文件替换现有文件，操作简单快捷；方法二通过直接编辑现有文件，灵活且易于控制；方法三提供了更为详细的编辑步骤，适合对配置文件有更高要求的用户。

建议：及时更换操作系统

虽然通过更换yum源可以继续使用CentOS 7一段时间，但这只是暂时的解决方案。随着时间的推移，使用过期系统会带来越来越多的安全隐患和兼容性问题。因此，我们强烈建议您考虑升级到新的操作系统版本或迁移到其他受支持的Linux发行版，如Debian 12、CentOS 9 Stream、Rocky Linux或AlmaLinux。

更换到受支持的系统不仅能确保您继续获得最新的安全更新和技术支持，还能让您的系统保持在一个稳定和高效的运行状态。Debian 12作为一个稳健且广受欢迎的Linux发行版，是一个值得考虑的选择。它提供了长期支持和丰富的软件包资源，适合各种服务器和桌面应用场景。

# 参考文献

1.  [CentOS Vault](http://vault.centos.org)
    
2.  [CentOS7停止维护后如何修复yum源](https://bbs.naixi.net/forum.php?mod=viewthread&tid=35&highlight=centos)
    
3.  [解决CentOS 7停止更新支持后yum源失效](https://blog.cccyun.cn/post-530.html)