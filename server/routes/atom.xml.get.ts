import { XMLBuilder } from 'fast-xml-parser'
import blogConfig from '~~/blog.config'
import { version } from '~~/package.json'
import { getIsoDatetime } from '~/utils/time'
import { API_CONFIG } from '~/config/api'

const runtimeConfig = useRuntimeConfig()

const builder = new XMLBuilder({
	attributeNamePrefix: '$',
	cdataPropName: '$',
	format: true,
	ignoreAttributes: false,
	textNodeName: '_',
})

function renderContent(post: any, siteUrl: string) {
	return [
		post.cover && `<img src="${post.cover}" />`,
		post.description && `<p>${post.description}</p>`,
		`<a class="view-full" href="${new URL(post.path, siteUrl).toString()}" target="_blank">点击查看全文</a>`,
	].join(' ')
}

export default defineEventHandler(async (_event) => {
	// 从 API 获取站点配置
	const siteConfigResponse = await $fetch<any>(
		'/api/public/site-config',
		{
			baseURL: API_CONFIG.baseURL,
		},
	)
	const siteConfig = siteConfigResponse.data || {}

	// 使用 API 配置或回退到默认配置
	const siteUrl = siteConfig.SITE_URL || blogConfig.url
	const siteName = siteConfig.APP_NAME || blogConfig.title
	const siteSubtitle = siteConfig.SUB_TITLE || blogConfig.subtitle
	const siteDescription = siteConfig.SITE_DESCRIPTION || blogConfig.description
	const authorName = siteConfig.frontDesk?.siteOwner?.name || blogConfig.author.name
	const authorEmail = siteConfig.frontDesk?.siteOwner?.email || blogConfig.author.email
	const authorAvatar = siteConfig.USER_AVATAR ? new URL(siteConfig.USER_AVATAR, siteUrl).toString() : blogConfig.author.avatar
	const siteIcon = siteConfig.ICON_URL ? new URL(siteConfig.ICON_URL, siteUrl).toString() : blogConfig.favicon

	// 从 API 获取文章列表
	const response = await $fetch<any>(
		API_CONFIG.endpoints.articles,
		{
			baseURL: API_CONFIG.baseURL,
			query: {
				pageSize: blogConfig.feed.limit,
				sortBy: 'updated_at',
				sortOrder: 'desc',
			},
		},
	)

	const articles = response.data?.list || []

	const entries = articles.map((article: any) => ({
		id: new URL(`/${article.abbrlink || article.id}`, siteUrl).toString(),
		title: article.title ?? '',
		updated: getIsoDatetime(article.updated_at),
		author: { name: article.author || authorName },
		content: {
			$type: 'html',
			$: renderContent({
				cover: article.cover,
				description: article.summaries?.[0] || '',
				path: `/${article.abbrlink || article.id}`,
			}, siteUrl),
		},
		link: { $href: new URL(`/${article.abbrlink || article.id}`, siteUrl).toString() },
		summary: article.summaries?.[0] || '',
		category: { $term: article.post_categories?.[0]?.name },
		published: getIsoDatetime(article.created_at),
	}))

	const feed = {
		$xmlns: 'http://www.w3.org/2005/Atom',
		id: siteUrl,
		title: siteName,
		updated: runtimeConfig.public.buildTime,
		description: siteDescription, // RSS 2.0
		author: {
			name: authorName,
			email: authorEmail,
			uri: siteUrl,
		},
		link: [
			{ $href: new URL('/atom.xml', siteUrl).toString(), $rel: 'self' },
			{ $href: siteUrl, $rel: 'alternate' },
		],
		language: blogConfig.language, // RSS 2.0
		generator: {
			$uri: 'https://github.com/L33Z22L11/blog-v3',
			$version: version,
			_: 'Zhilu Blog',
		},
		icon: siteIcon,
		logo: authorAvatar, // Ratio should be 2:1
		rights: `© ${new Date().getFullYear()} ${authorName}`,
		subtitle: siteSubtitle || siteDescription,
		entry: entries,
	}

	return builder.build({
		'?xml': { $version: '1.0', $encoding: 'UTF-8' },
		'?xml-stylesheet': blogConfig.feed.enableStyle ? { $type: 'text/xsl', $href: '/assets/atom.xsl' } : undefined,
		feed,
	})
})
