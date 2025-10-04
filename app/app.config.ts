import type { Nav, NavItem } from '~/types/nav'
import blogConfig from '~~/blog.config'
import { version } from '~~/package.json'

// 图标查询：https://yesicon.app/ph
// 图标插件：https://marketplace.visualstudio.com/items?itemName=antfu.iconify

// @keep-sorted
export default defineAppConfig({
	// 将 blog.config 中的配置项复制到 appConfig，方便调用
	...blogConfig,

	component: {
		alert: {
			/** 默认使用卡片风格还是扁平风格 */
			defaultStyle: 'card' as 'card' | 'flat',
		},

		codeblock: {
			/** 代码块触发折叠的行数 */
			triggerRows: 32,
			/** 代码块折叠后的行数 */
			collapsedRows: 16,
		},

		/** 文章开头摘要 */
		excerpt: {
			animation: true,
			caret: '_',
		},

		stats: {
			/** 归档页面每年标题对应的年龄 */
			birthYear: 2003,
			/** blog-stats widget 的预置文本 */
			wordCount: '约10万',
		},
	},

	// @keep-sorted
	footer: {
		/** 页脚版权信息，支持 <br> 换行等 HTML 标签 */
		copyright: `© ${new Date().getFullYear()} ${blogConfig.author.name}`,

		/**
		 * API 页脚导航的图标映射表（精确匹配）
		 * 键可以是链接标题或 URL，值是对应的图标
		 * 如果 API 返回的链接在这里找不到，会使用默认图标 ph:link-bold
		 */
		apiIconMapping: {
			// 按标题精确匹配（推荐）
			'站点地图': 'ph:map-trifold-bold',
			'十年之约': 'ph:certificate-bold',
			'开往': 'ph:subway-bold',
			'文档': 'ph:book-bold',
			'源码': 'ph:github-logo-bold',
			'更新日志': 'ph:newspaper-bold',
			'小空调': 'ph:fan-bold',
			'相册集': 'ph:images-bold',
			'音乐馆': 'ph:music-note-bold',
			'隐私协议': 'ph:shield-check-bold',
			'Cookies': 'ph:cookie-bold',
			'版权协议': 'ph:copyright-bold',
			'主页': 'ph:house-bold',
			'框架': 'ph:code-bold',

			// 按 URL 精确匹配（作为备选）
			'/atom.xml': 'ph:rss-simple-bold',
			'/update': 'ph:newspaper-bold',
			'/album': 'ph:images-bold',
			'/music': 'ph:music-note-bold',
		} as Record<string, string>,

		/** 侧边栏底部图标导航 */
		iconNav: [
			{ icon: 'ph:house-bold', text: '个人主页', url: blogConfig.author.homepage },
			{ icon: 'ri:qq-line', text: '交流群: 169994096', url: 'https://jq.qq.com/?_wv=1027&k=lQfNSeEd' },
			{ icon: 'ph:github-logo-bold', text: 'GitHub: L33Z22L11', url: 'https://github.com/L33Z22L11' },
			{ icon: 'ph:rss-simple-bold', text: 'Atom订阅', url: '/atom.xml' },
			{ icon: 'ph:subway-bold', text: '开往', url: 'https://www.travellings.cn/go-by-clouds.html' },
		] satisfies NavItem[],

		/**
		 * API socialBar 图标名称映射表 - 完整版
		 * 将 API 返回的图标名称（如 iconfont 的 anzhiyu-icon-xxx）映射到 Iconify 图标
		 *
		 * 图标库参考：
		 * - Phosphor: https://phosphoricons.com/ (前缀 ph:)
		 * - Simple Icons: https://simpleicons.org/ (前缀 simple-icons:)
		 * - Remix Icon: https://remixicon.com/ (前缀 ri:)
		 */
		socialBarIconMapping: {
			// === A-C ===
			'anzhiyu-icon-angle-double-down': 'ph:caret-double-down-bold',
			'anzhiyu-icon-angle-double-left': 'ph:caret-double-left-bold',
			'anzhiyu-icon-angle-double-right': 'ph:caret-double-right-bold',
			'anzhiyu-icon-angle-down': 'ph:caret-down-bold',
			'anzhiyu-icon-angle-left': 'ph:caret-left-bold',
			'anzhiyu-icon-angle-right': 'ph:caret-right-bold',
			'anzhiyu-icon-angles-right': 'ph:carets-right-bold',
			'anzhiyu-icon-anzhiyu': 'ph:fish-bold',
			'anzhiyu-icon-arrow-down': 'ph:arrow-down-bold',
			'anzhiyu-icon-arrow-left': 'ph:arrow-left-bold',
			'anzhiyu-icon-arrow-right': 'ph:arrow-right-bold',
			'anzhiyu-icon-arrow-rotate-right': 'ph:arrow-clockwise-bold',
			'anzhiyu-icon-arrow-up': 'ph:arrow-up-bold',
			'anzhiyu-icon-arrows-left-right': 'ph:arrows-left-right-bold',
			'anzhiyu-icon-arrows-rotate': 'ph:arrows-clockwise-bold',
			'anzhiyu-icon-artstation': 'simple-icons:artstation',
			'anzhiyu-icon-backward': 'ph:skip-back-bold',
			'anzhiyu-icon-bars': 'ph:list-bold',
			'anzhiyu-icon-bilibili': 'simple-icons:bilibili',
			'anzhiyu-icon-bolt': 'ph:lightning-bold',
			'anzhiyu-icon-book': 'ph:book-bold',
			'anzhiyu-icon-book-open': 'ph:book-open-bold',
			'anzhiyu-icon-box-archive': 'ph:archive-bold',
			'anzhiyu-icon-bullhorn': 'ph:megaphone-bold',
			'anzhiyu-icon-calendar-alt': 'ph:calendar-bold',
			'anzhiyu-icon-calendar-days': 'ph:calendar-bold',
			'anzhiyu-icon-caret-left': 'ph:caret-left-bold',
			'anzhiyu-icon-chart-line': 'ph:chart-line-bold',
			'anzhiyu-icon-chevron-left': 'ph:caret-left-bold',
			'anzhiyu-icon-chevron-right': 'ph:caret-right-bold',
			'anzhiyu-icon-circle-arrow-right': 'ph:arrow-circle-right-bold',
			'anzhiyu-icon-circle-arrow-up-right-1': 'ph:arrow-up-right-bold',
			'anzhiyu-icon-circle-check': 'ph:check-circle-bold',
			'anzhiyu-icon-circle-dot': 'ph:circle-bold',
			'anzhiyu-icon-circle-half-stroke': 'ph:moon-stars-bold',
			'anzhiyu-icon-circle-info': 'ph:info-bold',
			'anzhiyu-icon-circle-minus': 'ph:minus-circle-bold',
			'anzhiyu-icon-circle-plus': 'ph:plus-circle-bold',
			'anzhiyu-icon-circle-xmark': 'ph:x-circle-bold',
			'anzhiyu-icon-clock': 'ph:clock-bold',
			'anzhiyu-icon-comment-medical': 'ph:first-aid-kit-bold',
			'anzhiyu-icon-comment-sms': 'ph:chat-centered-text-bold',
			'anzhiyu-icon-comments': 'ph:chats-bold',
			'anzhiyu-icon-copy': 'ph:copy-bold',
			'anzhiyu-icon-copyright': 'ph:copyright-bold',
			'anzhiyu-icon-copyright-line': 'ph:copyright-bold',
			'anzhiyu-icon-creative-commons-by-line': 'simple-icons:creativecommons',
			'anzhiyu-icon-creative-commons-nc-line': 'simple-icons:creativecommons',
			'anzhiyu-icon-creative-commons-nd-line': 'simple-icons:creativecommons',
			'anzhiyu-icon-cube': 'ph:cube-bold',

			// === D-F ===
			'anzhiyu-icon-dice': 'ph:dice-six-bold',
			'anzhiyu-icon-dice-d20': 'ph:dice-six-bold',
			'anzhiyu-icon-dove': 'ph:bird-bold',
			'anzhiyu-icon-download': 'ph:download-bold',
			'anzhiyu-icon-envelope': 'ph:envelope-simple-bold',
			'anzhiyu-icon-eye-outline': 'ph:eye-bold',
			'anzhiyu-icon-facebook': 'ph:facebook-logo-bold',
			'anzhiyu-icon-facebook1': 'ph:facebook-logo-bold',
			'anzhiyu-icon-fan': 'ph:fan-bold',
			'anzhiyu-icon-file-lines': 'ph:file-text-bold',
			'anzhiyu-icon-file-word': 'ph:file-doc-bold',
			'anzhiyu-icon-fire': 'ph:fire-bold',
			'anzhiyu-icon-fish': 'ph:fish-bold',
			'anzhiyu-icon-folder-open': 'ph:folder-open-bold',
			'anzhiyu-icon-font': 'ph:text-aa-bold',
			'anzhiyu-icon-forward': 'ph:skip-forward-bold',
			'anzhiyu-icon-fw-eye': 'ph:eye-bold',
			'anzhiyu-icon-fw-fire': 'ph:fire-bold',

			// === G-I ===
			'anzhiyu-icon-gear': 'ph:gear-bold',
			'anzhiyu-icon-github': 'ph:github-logo-bold',
			'anzhiyu-icon-grip-vertical': 'ph:dots-six-vertical-bold',
			'anzhiyu-icon-hand-heart-fill': 'ph:hand-heart-bold',
			'anzhiyu-icon-hashtag': 'ph:hash-bold',
			'anzhiyu-icon-heartbeat': 'ph:heartbeat-bold',
			'anzhiyu-icon-heartbeat-bold': 'ph:heartbeat-bold',
			'anzhiyu-icon-history': 'ph:clock-counter-clockwise-bold',
			'anzhiyu-icon-hourglass-start': 'ph:hourglass-bold',
			'anzhiyu-icon-house-chimney': 'ph:house-bold',
			'anzhiyu-icon-images': 'ph:images-bold',
			'anzhiyu-icon-inbox': 'ph:tray-bold',
			'anzhiyu-icon-instagram': 'simple-icons:instagram',

			// === J-L ===
			'anzhiyu-icon-jike': 'ph:link-bold',
			'anzhiyu-icon-keyboard': 'ph:keyboard-bold',
			'anzhiyu-icon-language': 'ph:translate-bold',
			'anzhiyu-icon-lightbulb': 'ph:lightbulb-bold',
			'anzhiyu-icon-link': 'ph:link-bold',
			'anzhiyu-icon-list-ul': 'ph:list-bullets-bold',
			'anzhiyu-icon-location-dot': 'ph:map-pin-bold',

			// === M-P ===
			'anzhiyu-icon-magnifying-glass': 'ph:magnifying-glass-bold',
			'anzhiyu-icon-message': 'ph:chat-bold',
			'anzhiyu-icon-moon': 'ph:moon-bold',
			'anzhiyu-icon-music': 'ph:music-note-bold',
			'anzhiyu-icon-paper-plane': 'ph:paper-plane-tilt-bold',
			'anzhiyu-icon-paste': 'ph:clipboard-bold',
			'anzhiyu-icon-pause': 'ph:pause-bold',
			'anzhiyu-icon-pencil': 'ph:pencil-bold',
			'anzhiyu-icon-plant-fill': 'ph:plant-bold',
			'anzhiyu-icon-play': 'ph:play-bold',

			// === Q-R ===
			'anzhiyu-icon-qq': 'ri:qq-line',
			'anzhiyu-icon-qrcode': 'ph:qr-code-bold',
			'anzhiyu-icon-radio': 'ph:radio-bold',
			'anzhiyu-icon-repeat': 'ph:repeat-bold',
			'anzhiyu-icon-rocket': 'ph:rocket-bold',
			'anzhiyu-icon-rss': 'ph:rss-simple-bold',

			// === S ===
			'anzhiyu-icon-scissors': 'ph:scissors-bold',
			'anzhiyu-icon-shapes': 'ph:shapes-bold',
			'anzhiyu-icon-shoe-prints': 'ph:footprints-bold',
			'anzhiyu-icon-shuffle': 'ph:shuffle-bold',
			'anzhiyu-icon-sign-out-alt': 'ph:sign-out-bold',
			'anzhiyu-icon-spinner': 'ph:spinner-bold',
			'anzhiyu-icon-square-poll-vertical': 'ph:chart-bar-bold',
			'anzhiyu-icon-stopwatch': 'ph:stopwatch-bold',
			'anzhiyu-icon-stream': 'ph:flow-arrow-bold',

			// === T-Z ===
			'anzhiyu-icon-tag': 'ph:tag-bold',
			'anzhiyu-icon-tags': 'ph:tags-bold',
			'anzhiyu-icon-thumbs-up': 'ph:thumbs-up-bold',
			'anzhiyu-icon-thumbtack': 'ph:push-pin-bold',
			'anzhiyu-icon-tiktok': 'simple-icons:tiktok',
			'anzhiyu-icon-train': 'ph:train-bold',
			'anzhiyu-icon-triangle-exclamation': 'ph:warning-bold',
			'anzhiyu-icon-twitter': 'ph:twitter-logo-bold',
			'anzhiyu-icon-universal-access': 'ph:wheelchair-bold',
			'anzhiyu-icon-warning': 'ph:warning-bold',
			'anzhiyu-icon-weibo': 'simple-icons:sinaweibo',
			'anzhiyu-icon-window-restore': 'ph:window-bold',
			'anzhiyu-icon-xmark': 'ph:x-bold',

			// === 中文图标名称 ===
			'anzhiyu-icon-三明治': 'ph:hamburger-bold',
			'anzhiyu-icon-弹幕': 'ph:chats-bold',
			'anzhiyu-icon-总览': 'ph:squares-four-bold',
			'anzhiyu-icon-灯泡': 'ph:lightbulb-bold',
			'anzhiyu-icon-灵感': 'ph:lightbulb-filament-bold',
		} as Record<string, string>,
		/** 页脚站点地图 */
		nav: [
			{
				title: '探索',
				items: [
					{ icon: 'ph:rss-simple-bold', text: 'Atom订阅', url: '/atom.xml' },
					{ icon: 'ph:subway-bold', text: '开往', url: 'https://www.travellings.cn/' },
				],
			},
			{
				title: '社交',
				items: [
					{ icon: 'ph:github-logo-bold', text: 'L33Z22L11', url: 'https://github.com/L33Z22L11' },
					{ icon: 'ri:qq-line', text: '群: 169994096', url: 'https://jq.qq.com/?_wv=1027&k=lQfNSeEd' },
					{ icon: 'ph:envelope-simple-bold', text: blogConfig.author.email, url: `mailto:${blogConfig.author.email}` },
				],
			},
			{
				title: '信息',
				items: [
					{ icon: 'simple-icons:nuxtdotjs', text: `主题: Clarity ${version}`, url: 'https://github.com/L33Z22L11/blog-v3' },
					{ icon: 'ph:swatches-bold', text: '主题和组件文档', url: '/theme' },
					{ icon: 'ph:certificate-bold', text: '陕ICP备2025072742号-3', url: 'https://beian.miit.gov.cn/' },
				],
			},
		] satisfies Nav,
	},

	/** 左侧栏顶部 Logo */
	header: {
		logo: 'https://weavatar.com/avatar/47c0f2e82b76d9b10eb3023df9e02e4e3fdbeaf5b74b842063f207971e7fbe7b?s=160',
		/** 展示标题文本，否则展示纯 Logo */
		showTitle: true,
		subtitle: blogConfig.subtitle,
		emojiTail: ['📄', '🦌', '🙌', '🐟', '🏖️'],
	},

	/** 左侧栏导航 */
	nav: [
		{
			title: '',
			items: [
				{ icon: 'ph:files-bold', text: '文章', url: '/' },
				{ icon: 'ph:link-bold', text: '友链', url: '/link' },
				{ icon: 'ph:archive-bold', text: '归档', url: '/archive' },
			],
		},
	] satisfies Nav,

	pagination: {
		perPage: 10,
		/** 默认排序方式，需要是 this.article.order 中的键名 */
		sortOrder: 'date' as const,
		/** 允许（普通/预览/归档）文章列表正序，开启后排序方式左侧图标可切换顺序 */
		allowAscending: false,
	},

	themes: {
		light: {
			icon: 'ph:sun-bold',
			tip: '浅色模式',
		},
		system: {
			icon: 'ph:monitor-bold',
			tip: '跟随系统',
		},
		dark: {
			icon: 'ph:moon-bold',
			tip: '深色模式',
		},
	},
})
