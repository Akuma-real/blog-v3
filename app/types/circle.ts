// Circle圈子页面相关类型定义

export interface StatisticalData {
	friends_num: number
	active_num: number
	error_num: number
	article_num: number
	last_updated_time: string
}

export interface ArticleData {
	floor: number
	title: string
	created: string
	updated: string
	link: string
	author: string
	avatar: string
}

export interface CircleData {
	statistical_data: StatisticalData
	article_data: ArticleData[]
}
