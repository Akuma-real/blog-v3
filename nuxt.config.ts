import type { NitroConfig } from 'nitropack'
import process from 'node:process'
import ci from 'ci-info'
import blogConfig from './blog.config'
import packageJson from './package.json'
import redirectList from './redirects.json'

// 此处配置无需修改
export default defineNuxtConfig({
	// 确保启用 SSR 模式（Vercel/EdgeOne 都支持）
	ssr: true,

	app: {
		head: {
			meta: [
				{ name: 'author', content: [blogConfig.author.name, blogConfig.author.email].filter(Boolean).join(', ') },
				// 此处为元数据的生成器标识，不建议修改
				{ 'name': 'generator', 'content': packageJson.name, 'data-github-repo': packageJson.homepage, 'data-version': packageJson.version },
				{ name: 'mobile-web-app-capable', content: 'yes' },
			],
			link: [
				{ rel: 'icon', href: blogConfig.favicon },
				{ rel: 'alternate', type: 'application/atom+xml', href: '/atom.xml' },
				{ rel: 'preconnect', href: blogConfig.twikoo.preload },
				{ rel: 'stylesheet', href: 'https://lib.baomitu.com/KaTeX/0.16.9/katex.min.css', media: 'print', onload: 'this.media="all"' },
				// "InterVariable", "Inter", "InterDisplay"
				{ rel: 'stylesheet', href: 'https://rsms.me/inter/inter.css', media: 'print', onload: 'this.media="all"' },
				// "JetBrains Mono", 思源黑体 "Noto Sans SC", 思源宋体 "Noto Serif SC"
				{ rel: 'preconnect', href: 'https://fonts.gstatic.cn', crossorigin: '' },
				{ rel: 'stylesheet', href: 'https://fonts.googleapis.cn/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Noto+Sans+SC:wght@100..900&family=Noto+Serif+SC:wght@200..900&display=swap', media: 'print', onload: 'this.media="all"' },
				// 小米字体 "MiSans"
				{ rel: 'stylesheet', href: 'https://cdn-font.hyperos.mi.com/font/css?family=MiSans:100,200,300,400,450,500,600,650,700,900:Chinese_Simplify,Latin&display=swap', media: 'print', onload: 'this.media="all"' },
			],
			templateParams: {
				separator: '|',
			},
			titleTemplate: `%s %separator ${blogConfig.title}`,
			script: blogConfig.scripts,
		},
		rootAttrs: {
			id: 'z-root',
		},
	},

	compatibilityDate: '2024-08-03',

	components: [
		{ path: '~/components/partial', prefix: 'Z' },
		{ path: '~/components/zhilu', prefix: 'Zhilu', global: true },
		{ path: '~/components/content', global: true }, // MDC 组件（保留用于 Key 等）
		'~/components',
	],

	css: [
		'@/assets/css/animation.scss',
		'@/assets/css/article.scss',
		'@/assets/css/color.scss',
		'@/assets/css/font.scss',
		'@/assets/css/main.scss',
		'@/assets/css/reusable.scss',
	],

	features: {
		inlineStyles: false,
	},

	// @keep-sorted
	routeRules: {
		...Object.entries(redirectList)
			.reduce<NitroConfig['routeRules']>((acc, [from, to]) => {
				acc![from] = { redirect: { to, statusCode: 308 } }
				return acc
			}, {}),
		'/api/stats': { prerender: true, headers: { 'Content-Type': 'application/json' } },
		'/atom.xml': { prerender: true, headers: { 'Content-Type': 'application/xml' } },
		'/favicon.ico': { redirect: { to: blogConfig.favicon } },
		'/zhilu.opml': { prerender: true, headers: { 'Content-Type': 'application/xml' } },
	},

	nitro: {
		preset: 'static',
		prerender: {
			// SPA fallback for EdgeOne Pages
			failOnError: false,
			crawlLinks: true,
			routes: ['/'],
		},
	},

	runtimeConfig: {
		public: {
			buildTime: new Date().toISOString(),
			nodeVersion: process.version,
			platform: process.platform,
			arch: process.arch,
			ci: process.env.TENCENTCLOUD_RUNENV === 'SCF' ? 'EdgeOne' : ci.name || '',
			// API 基础 URL，可通过环境变量 NUXT_PUBLIC_API_BASE_URL 覆盖
			apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8091',
		},
	},

	vite: {
		css: {
			preprocessorOptions: {
				scss: {
					additionalData: '@use "@/assets/css/_variable.scss" as *;',
				},
			},
		},
		define: {
			/** 在生产环境启用 Vue DevTools */
			// __VUE_PROD_DEVTOOLS__: 'true',
			/** 在生产环境启用 Vue 水合不匹配详情 */
			// __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true',
		},
		server: {
			allowedHosts: true,
		},
	},

	// @keep-sorted
	modules: [
		'@dxup/nuxt',
		// '@nuxt/content', // 已改用 API，可选择性保留用于其他内容
		'@nuxt/icon',
		'@nuxt/image',
		'@nuxtjs/color-mode',
		'@nuxtjs/seo',
		'@pinia/nuxt',
		'@vueuse/nuxt',
		'unplugin-yaml/nuxt',
	],

	colorMode: {
		preference: 'system',
		fallback: 'light',
		classSuffix: '',
	},

	// 如果不再需要 Nuxt Content，可以删除此配置
	// content: {
	// 	build: {
	// 		markdown: {
	// 			highlight: false,
	// 			// @keep-sorted
	// 			remarkPlugins: {
	// 				'remark-math': {},
	// 				'remark-music': {},
	// 				'remark-reading-time': {},
	// 			},
	// 			// @keep-sorted
	// 			rehypePlugins: {
	// 				'rehype-katex': {},
	// 			},
	// 			toc: { depth: 4, searchDepth: 4 },
	// 		},
	// 	},
	// 	experimental: {
	// 		sqliteConnector: 'native',
	// 	},
	// },

	hooks: {
		'ready': () => {
			console.info(`
================================
${packageJson.name} ${packageJson.version}
${packageJson.homepage}
API 模式已启用 - SSR 支持
================================
`)
		},
		// 如果不再需要 Nuxt Content，可以删除此 hook
		// 'content:file:afterParse': (ctx) => {
		// 	const permalink = ctx.content.permalink as string
		// 	if (permalink) {
		// 		ctx.content.path = permalink
		// 		return
		// 	}
		// 	// 在 URL 中隐藏文件路由自动生成的 /posts 路径前缀
		// 	if (blogConfig.article.hidePostPrefix) {
		// 		const realPath = ctx.content.path as string | undefined
		// 		ctx.content.path = realPath?.replace(/^\/posts/, '')
		// 	}
		// },
	},

	icon: {
		customCollections: [
			{ prefix: 'zi', dir: './app/assets/icons' },
		],
	},

	image: {
		// Netlify 需要特殊处理
		provider: process.env.NUXT_IMAGE_PROVIDER,
		format: ['avif', 'webp'],
	},

	linkChecker: {
		// @keep-sorted
		skipInspections: [
			'no-baseless',
			'no-non-ascii-chars',
			'no-uppercase-chars',
		],
	},

	robots: {
		disableNuxtContentIntegration: true,
		disallow: blogConfig.article.robotsNotIndex,
	},

	site: {
		name: blogConfig.title,
		url: blogConfig.url,
		defaultLocale: blogConfig.language,
	},
})
