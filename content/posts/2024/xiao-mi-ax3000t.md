---
title: 小米AX3000T刷机
description: 本文介绍了如何为路由器开启并固化SSH功能的步骤。首先，通过访问路由器管理页面获取Stok变量，然后通过命令提示符解锁SSH并获取密码。接着，通过MobaXterm连接路由器的SSH，并执行自启脚本来软固化SSH，这个过程包括了两个方法：在线和离线。完成这些之后，需要执行额外的命令来硬固化SSH，确保每次重启后SSH功能依然可用。最后，提醒每次升级或重置固件后都需要重新开启SSH。
date: "2024-05-29 17:50:13"
updated: "2024-05-29 09:50:13"
categories: [硬件刷机]
tags: [小米路由器, AX3000T, 路由器刷机, SSH配置, 固件修改]
draft: false
---

## 步骤 1: 获取 Stok 变量

1. 打开 Chrome 浏览器。
2. 登录到路由器的管理页面，通常地址为 `http://192.168.31.1/`。
3. 在浏览器的地址栏中查找 Stok 变量的值，此值将用于后续的 SSH 解锁命令。

例如：
```
http://192.168.31.1/cgi-bin/luci/;stok=030b24d39b1a4a549aa12dac23c52313/web/home#router
```

则 `Stok=030b24d39b1a4a549aa12dac23c52313`

**注：每次路由器重启，stok 值都会改变。**

## 步骤 2: 解锁 SSH

1. 打开命令提示符（cmd），依次输入以下命令，注意将 `token` 替换为第一步中获得的实际 Stok 值：

```sh
curl -X POST http://192.168.31.1/cgi-bin/luci/;stok=token/api/misystem/arn_switch -d "open=1&model=1&level=%0Anvram%20set%20ssh_en%3D1%0A"
```
```sh
curl -X POST http://192.168.31.1/cgi-bin/luci/;stok=token/api/misystem/arn_switch -d "open=1&model=1&level=%0Anvram%20commit%0A"
```
```sh
curl -X POST http://192.168.31.1/cgi-bin/luci/;stok=token/api/misystem/arn_switch -d "open=1&model=1&level=%0Ased%20-i%20's%2Fchannel%3D.*%2Fchannel%3D%22debug%22%2Fg'%20%2Fetc%2Finit.d%2Fdropbear%0A"
```
```sh
curl -X POST http://192.168.31.1/cgi-bin/luci/;stok=token/api/misystem/arn_switch -d "open=1&model=1&level=%0A%2Fetc%2Finit.d%2Fdropbear%20start%0A"
```

## 步骤3: 获取SSH密码

1. 访问 [https://miwifi.dev/ssh](https://miwifi.dev/ssh)
2. 输入你的路由器序列号（SN）。序列号可在路由器背部找到，或者通过路由器的管理界面查看。
3. 系统将显示SSH密码。

## 步骤4: 软固化SSH

通过MobaXterm连接路由器的ssh后，执行以下指令（执行后会自动把ssh密码改成admin）：

```sh
nvram set ssh_en=1
nvram set telnet_en=1
nvram set uart_en=1
nvram set boot_wait=on
nvram commit
sed -i 's/channel=.*/channel="debug"/g' /etc/init.d/dropbear
/etc/init.d/dropbear restart
echo -e 'admin\nadmin' | passwd root
```

路由器重启后，dropbear文件会恢复成未修改以前的样子，因此要添加一个自启脚本，路由器每次启动，都会自动执行脚本，修改dropbear文件，开启ssh。
此步骤有两种方法，一种是在线获取脚本，一种离线手动创建脚本，二选一即可。

### 在线方法

```sh
mkdir /data/auto_ssh && cd /data/auto_ssh
curl -O [文件下载链接]
chmod +x auto_ssh.sh
./auto_ssh.sh install
```

### 离线方法

```sh
mkdir /data/auto_ssh && cd /data/auto_ssh
vi auto_ssh.sh
```

此时进入了vi编辑器，首先将下面脚本内容复制到剪切板：

```sh
#!/bin/sh

auto_ssh_dir="/data/auto_ssh"
host_key="/etc/dropbear/dropbear_rsa_host_key"
host_key_bk="${auto_ssh_dir}/dropbear_rsa_host_key"

unlock() {
    # Restore the host key.
    [ -f $host_key_bk ] && ln -sf $host_key_bk $host_key

    # Enable telnet, ssh, uart and boot_wait.
    [ "$(nvram get telnet_en)" = 0 ] && nvram set telnet_en=1 && nvram commit
    [ "$(nvram get ssh_en)" = 0 ] && nvram set ssh_en=1 && nvram commit
    [ "$(nvram get uart_en)" = 0 ] && nvram set uart_en=1 && nvram commit
    [ "$(nvram get boot_wait)" = "off" ]  && nvram set boot_wait=on && nvram commit

    [ "`uci -c /usr/share/xiao **  get xiao ** _version.version.CHANNEL`" != 'stable' ] && {
        uci -c /usr/share/xiao **  set xiao ** _version.version.CHANNEL='stable' 
        uci -c /usr/share/xiao **  commit xiao ** _version.version 2>/dev/null
    }

    channel=`/sbin/uci get /usr/share/xiao ** /xiao ** _version.version.CHANNEL`
    if [ "$channel" = "release" ]; then
        sed -i 's/channel=.*/channel="debug"/g' /etc/init.d/dropbear
    fi

    if [ -z "$(pidof dropbear)" -o -z "$(netstat -ntul | grep :22)" ]; then
        /etc/init.d/dropbear restart 2>/dev/null
        /etc/init.d/dropbear enable
    fi
}

install() {
    # unlock SSH.
    unlock

    # host key is empty, restart dropbear to generate the host key.
    [ -s $host_key ] || /etc/init.d/dropbear restart 2>/dev/null

    # Backup the host key.
    if [ ! -s $host_key_bk ]; then
        i=0
        while [ $i -le 30 ]
        do
            if [ -s $host_key ]; then
                cp -f $host_key $host_key_bk 2>/dev/null
                break
            fi
            let i++
            sleep 1s
        done
    fi

    # Add script to system autostart
    uci set firewall.auto_ssh=include
    uci set firewall.auto_ssh.type='script'
    uci set firewall.auto_ssh.path="${auto_ssh_dir}/auto_ssh.sh"
    uci set firewall.auto_ssh.enabled='1'
    uci commit firewall
    echo -e "\033[32m SSH unlock complete. \033[0m"
}

uninstall() {
    # Remove scripts from system autostart
    uci delete firewall.auto_ssh
    uci commit firewall
    echo -e "\033[33m SSH unlock has been removed. \033[0m"
}

main() {
    [ -z "$1" ] && unlock && return
    case "$1" in
    install)
        install
        ;;
    uninstall)
        uninstall
        ;;
    *)
        echo -e "\033[31m Unknown parameter: $1 \033[0m"
        return 1
        ;;
    esac
}

main "$@"
```

复制好后，回到vi编辑界面，按下 `i` 进入编辑模式，然后按下 `CTRL+SHIFT+V` 粘贴完成后，按一下 `ESC`，再输入 `:wq`，回车即可。注意是英文的:

确认没有问题后，执行下面的指令：

```sh
chmod +x auto_ssh.sh
./auto_ssh.sh install
```

## 步骤5: 硬固化SSH

通过MobaXterm连接路由器的ssh后，执行以下指令（执行后会自动重启）：

```sh
zz=$(dd if=/dev/zero bs=1 count=2 2>/dev/null) ; printf '\xA5\x5A%c%c' $zz $zz | mtd write - crash
reboot
```

等待路由器重启后，重新连接ssh，并执行以下指令（执行后会自动重启）：

```sh
nvram set ssh_en=1
nvram set telnet_en=1
nvram set uart_en=1
nvram set boot_wait=on
nvram commit
bdata set ssh_en=1
bdata set telnet_en=1
bdata set uart_en=1
bdata set boot_wait=on
bdata commit
reboot
```

等待路由器重启后，重新连接ssh，并执行以下指令（执行后会自动重启）：

```sh
mtd erase crash
reboot
```

等待路由器重启后，重新连接ssh，固化完成。

## 注意事项

每次升级固件或重置固件后，都需要先telnet，再在telnet中开启ssh。

具体方法为：

1. 使用MobaXterm通过telnet连接路由器，用户名为 `root`，密码为初始密码，输入后即可登入路由器telnet后台。
2. 通过telnet开启ssh，并修改root密码为admin：

```sh
sed -i '/flg_ssh=`nvram get ssh_en`/{:loop; N; /\n.*channel=`\/sbin\/uci get \/usr\/share\/xiao ** \/xiao ** _version.version.CHANNEL`\n.*return 0\n.*fi/!b loop; d}' /etc/init.d/dropbear
/etc/init.d/dropbear restart
echo -e 'admin\nadmin' | passwd root
```

3. 使用MobaXterm通过ssh连接路由器，用户名为 `root`，密码为 `admin`，输入后即可登入路由器ssh后台，登入后再做一遍步骤4软固化即可。

4. 自定义密码：

```sh
echo -e '你的密码\n你的密码' | passwd root
```
```器，用户名为 root，密码为初始密码，输入后即可登入路由器 telnet 后台。
2. 通过 telnet 开启 ssh，并修改 root 密码为 admin：

```sh
sed -i '/flg_ssh=`nvram get ssh_en`/{:loop; N; /\n.*channel=`\/sbin\/uci get \/usr\/share\/xiao ** \/xiao ** _version.version.CHANNEL`\n.*return 0\n.*fi/!b loop; d}' /etc/init.d/dropbear
/etc/init.d/dropbear restart
echo -e 'admin\nadmin' | passwd root
```

3. 使用 MobaXterm 通过 ssh 连接路由器，用户名为 root，密码为 admin，输入后即可登入路由器 ssh 后台，登入后再做一遍步骤 4 软固化即可。
4. 自定义密码：

```sh
echo -e '你的密码\n你的密码' | passwd root
```