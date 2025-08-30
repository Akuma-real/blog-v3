import type { NitroConfig } from 'nitropack'
import type { FeedEntry } from './app/types/feed'
import redirectList from './redirects.json'

export { zhCN as dateLocale } from 'date-fns/locale/zh-CN'

// 存储 nuxt.config 和 app.config 共用的配置
// 此处为启动时需要的配置，启动后可变配置位于 app/app.config.ts
const blogConfig = {
	title: '六月墨语',
	subtitle: '愿你历经千帆，归来仍是少年！',
	// 长 description 利好于 SEO
	description: '这是我的个人博客，用于记录学习过程和生活感悟。网站基于 Nuxt + Nuxt Content 构建，界面简洁，内容丰富，欢迎访问和交流。',
	author: {
		name: '鬼鬼Sama',
		avatar: 'https://cdn.sa.net/2024/08/05/omBuQf58hF1HdSA.jpg',
		email: 'admin@june.ink',
		homepage: 'https://june.ink/',
	},
	copyright: {
		abbr: 'CC BY-NC-SA 4.0',
		name: '署名-非商业性使用-相同方式共享 4.0 国际',
		url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans',
	},
	favicon: 'https://cdn.sa.net/2025/08/19/4mziltdO59SvHgJ.png',
	language: 'zh-CN',
	timeEstablished: '2021-07-18',
	timezone: 'Asia/Shanghai',
	url: 'https://blog.june.ink/',

	defaultCategory: ['未分类'],

	feed: {
		limit: 50,
		enableStyle: true,
	},

	// 在 URL 中隐藏的路径前缀
	hideContentPrefixes: ['/posts'],

	imageDomains: [
		// 自动启用本域名的 Nuxt Image
		'cdn.sa.net',
		// '7.isyangs.cn',
	],

	// 禁止搜索引擎收录的路径
	robotsNotIndex: ['/preview', '/previews/*'],

	scripts: [
		// 自己部署的 Umami 统计服务
		{ 'src': 'https://umami.june.ink/script.js', 'data-website-id': '51ccb730-0c38-454e-b685-fe1e146d7f09', 'defer': true },
		// 自己网站的 Cloudflare Insights 统计服务
		// { 'src': 'https://static.cloudflareinsights.com/beacon.min.js', 'data-cf-beacon': '{"token": "97a4fe32ed8240ac8284e9bffaf03962"}', 'defer': true },
		// Twikoo 评论系统
		{ src: 'https://registry.npmmirror.com/twikoo/1.6.44/files/dist/twikoo.min.js', defer: true },
	],

	// 自己部署的 Twikoo 服务
	twikoo: {
		envId: 'https://twikoo.june.ink/',
		preload: 'https://twikoo.june.ink/',
	},
}

// 用于生成 OPML 和友链页面配置
export const myFeed = <FeedEntry>{
	author: blogConfig.author.name,
	sitenick: '摸鱼处',
	title: blogConfig.title,
	desc: blogConfig.subtitle || blogConfig.description,
	link: blogConfig.url,
	feed: new URL('/atom.xml', blogConfig.url).toString(),
	icon: blogConfig.favicon,
	avatar: blogConfig.author.avatar,
	archs: ['Nuxt', 'Vercel'],
	date: blogConfig.timeEstablished,
	comment: '这是我自己',
}

// 将旧页面永久重定向到新页面
const redirectRouteRules = Object.entries(redirectList)
	.reduce<NitroConfig['routeRules']>((acc, [from, to]) => {
		acc![from] = { redirect: { to, statusCode: 301 } }
		return acc
	}, {})

// https://nitro.build/config#routerules
// 使用 EdgeOne 部署时，需要同步更新 edgeone.json
// @keep-sorted
export const routeRules = <NitroConfig['routeRules']>{
	...redirectRouteRules,
	'/api/stats': { prerender: true, headers: { 'Content-Type': 'application/json' } },
	'/atom.xml': { prerender: true, headers: { 'Content-Type': 'application/xml' } },
	'/favicon.ico': { redirect: { to: blogConfig.favicon } },
	'/zhilu.opml': { prerender: true, headers: { 'Content-Type': 'application/xml' } },
}

export default blogConfig
