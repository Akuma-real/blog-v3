import type { Nav, NavItem } from '~/types/nav'
import blogConfig from '~~/blog.config'

// 图标查询：https://yesicon.app/ph
// 图标插件：https://marketplace.visualstudio.com/items?itemName=antfu.iconify

// @keep-sorted
export default defineAppConfig({
	// 将 blog.config 中的配置项复制到 appConfig，方便调用
	...blogConfig,

	article: {
		categories: <{ [category: string]: { icon: string, color?: string } }>{
			经验分享: { icon: 'ph:mouse-bold', color: '#3af' },
			杂谈: { icon: 'ph:chat-bold', color: '#3ba' },
			生活: { icon: 'ph:shooting-star-bold', color: '#f77' },
			代码: { icon: 'ph:code-bold', color: '#77f' },
			[blogConfig.content.defaultCategory]: { icon: 'ph:folder-dotted-bold' },
		},
		defaultCategoryIcon: 'ph:folder-bold',
		/** 分类排序方式，键为排序字段，值为显示名称 */
		order: {
			date: '创建日期',
			updated: '更新日期',
			// title: '标题',
		},
	},

	content: {
		/** 代码块自动折叠触发行数 */
		codeblockCollapsibleRows: 16,
		/** 文章开头摘要 */
		excerpt: {
			animation: true,
			caret: '_',
		},
	},

	// @keep-sorted
	footer: {
		/** 页脚版权信息，支持 <br> 换行等 HTML 标签 */
		copyright: `© ${new Date().getFullYear()} ${blogConfig.author.name}`,
		/** 侧边栏底部图标导航 */
		iconNav: [
			{ icon: 'ph:house-bold', text: '个人主页', url: blogConfig.author.homepage },
			// { icon: 'ri:qq-line', text: 'QQ群（请替换）', url: '#' },
			{ icon: 'ph:github-logo-bold', text: 'Akuma-real', url: '#' },
			{ icon: 'ph:rss-simple-bold', text: 'Atom订阅', url: '/atom.xml' },
		] satisfies NavItem[],
		/** 页脚站点地图 */
		nav: [
			{
				title: '探索',
				items: [
					{ icon: 'ph:rss-simple-bold', text: 'Atom订阅', url: '/atom.xml' },
				],
			},
			{
				title: '社交',
				items: [
					{ icon: 'ph:github-logo-bold', text: 'Akuma-real', url: '#' },
					// { icon: 'ri:qq-line', text: 'QQ群（请替换）', url: '#' },
					{ icon: 'ph:envelope-simple-bold', text: blogConfig.author.email, url: `mailto:${blogConfig.author.email}` },
				],
			},
			{
				title: '信息',
				items: [
					{ icon: 'simple-icons:nuxtdotjs', text: 'Nuxt开源博客主题', url: 'https://github.com/L33Z22L11/blog-v3' },
					{ icon: 'ph:certificate-bold', text: '苏ICP备2024096744号-2', url: '#' },
				],
			},
		] satisfies Nav,
	},

	/** 左侧栏顶部 Logo */
	header: {
		logo: 'https://cdn.sa.net/2024/08/05/omBuQf58hF1HdSA.jpg',
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

	stats: {
		/** 归档页面每年标题对应的年龄 */
		birthYear: 2000,
		/** blog-stats widget 的预置文本 */
		wordCount: '约1万',
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
