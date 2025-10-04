/**
 * API 响应类型定义
 * 注意: API 返回的字段名使用 snake_case
 */

// 基础响应结构
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页响应
export interface PaginatedResponse<T> {
  list: T[] // API 使用 list 而不是 items
  total: number
  page: number
  pageSize: number
  totalPages?: number
}

// ============ 文章相关类型 ============

// 文章分类
export interface PostCategoryResponse {
  id: string
  name: string
  slug?: string
  description?: string
  sort?: number
}

// 文章标签
export interface PostTagResponse {
  id: string
  name: string
  slug?: string
  color?: string
}

// 文章列表项 (API 实际返回的字段)
export interface ArticleListItem {
  id: string
  abbrlink?: string
  title: string
  summaries?: string[] // API 返回的是数组
  content_md?: string
  content_html?: string
  cover_url?: string
  top_img_url?: string
  post_categories?: PostCategoryResponse[]
  post_tags?: PostTagResponse[]
  created_at: string
  updated_at: string
  home_sort?: number // 首页排序
  pin_sort?: number // 置顶排序
  view_count?: number
  word_count?: number
  reading_time?: number
  status?: string
  copyright?: boolean
  copyright_author?: string
  copyright_author_href?: string
  copyright_url?: string
  primary_color?: string
  is_primary_color_manual?: boolean
  ip_location?: string
}

// 简化的文章响应(用于上下文文章)
export interface SimpleArticleResponse {
  id: string
  abbrlink?: string
  title: string
  summaries?: string[]
  cover_url?: string
  top_img_url?: string
  created_at: string
  updated_at: string
}

// 文章详情响应（包含上下文）
export interface ArticleDetailResponse {
  // 文章详情字段都是扁平的,不是嵌套在 article 字段里
  id: string
  abbrlink?: string
  title: string
  summaries?: string[]
  content_md: string
  content_html: string
  cover_url?: string
  top_img_url?: string
  post_categories?: PostCategoryResponse[]
  post_tags?: PostTagResponse[]
  created_at: string
  updated_at: string
  home_sort?: number
  pin_sort?: number
  view_count?: number
  word_count?: number
  reading_time?: number
  status?: string
  copyright?: boolean
  copyright_author?: string
  copyright_author_href?: string
  copyright_url?: string
  primary_color?: string
  is_primary_color_manual?: boolean
  ip_location?: string
  // 上下文文章
  prev_article?: SimpleArticleResponse | null
  next_article?: SimpleArticleResponse | null
  related_articles?: SimpleArticleResponse[]
}

// 归档摘要响应
export interface ArchiveSummary {
  year: number
  month: number
  count: number
}

// ============ 友链相关类型 ============

// 友链分类
export interface LinkCategoryDTO {
  id: number
  name: string
  slug?: string
  description?: string
  sort_order?: number
}

// 友链标签
export interface LinkTagDTO {
  id: number
  name: string
  slug?: string
  color?: string
}

// 友链项 (API 实际返回的字段)
export interface LinkDTO {
  id: number
  name: string
  url: string
  logo?: string
  siteshot?: string // 网站截图
  description?: string
  category?: LinkCategoryDTO | null
  tag?: LinkTagDTO | null // 单个标签 - 可用于表示技术栈
  status?: string // 'PENDING' | 'APPROVED' | 'REJECTED'
  sort_order?: number
  skip_health_check?: boolean
}

// 友链申请请求(前台提交)
export interface ApplyLinkRequest {
  name: string
  url: string
  logo?: string
  description?: string
}

// ============ 评论相关类型 ============

// 评论用户信息(本地存储使用)
export interface CommentUser {
  nickname: string
  email: string
  website?: string
  allowNotification?: boolean
}

// 评论项（API 返回的实际字段 - dto.Response）
export interface CommentItem {
  id: string
  nickname: string // 昵称
  email_md5: string // 邮箱 MD5，用于生成头像
  website?: string
  content: string // Markdown 原文
  content_html: string // HTML 渲染后的内容
  created_at: string
  like_count: number
  is_admin_comment: boolean
  pinned_at?: string | null // 置顶时间，非空表示已置顶
  parent_id?: string | null
  reply_to_nick?: string // 回复对象的昵称
  target_path: string // 评论所属路径
  target_title?: string // 目标页面标题
  total_children: number // 子评论总数
  children?: CommentItem[] // 嵌套的子评论
  // 仅管理员可见字段
  email?: string
  ip_address?: string
  ip_location?: string
  user_agent?: string
  status?: number
}

// 创建评论请求 (dto.CreateRequest)
export interface CreateCommentRequest {
  content: string
  nickname: string
  target_path: string
  email?: string
  website?: string
  parent_id?: string
  target_title?: string
  allow_notification?: boolean
}

// ============ 站点相关类型 ============

// 社交图标项
export interface SocialBarItem {
  icon?: string
  text?: string
  title?: string
  url?: string
  link?: string
}

// 社交栏配置
export interface SocialBarConfig {
  left?: SocialBarItem[]
  right?: SocialBarItem[]
  items?: SocialBarItem[]
}

// 站点配置 (根据 API 实际返回的字段)
export interface SiteConfig {
  // 站点基本信息
  APP_NAME?: string
  SUB_TITLE?: string
  SITE_DESCRIPTION?: string
  SITE_URL?: string
  LOGO_URL?: string
  ICON_URL?: string
  USER_AVATAR?: string

  // 社交图标配置
  socialBar?: SocialBarConfig | SocialBarItem[]

  // 友链申请自定义代码
  FRIEND_LINK_APPLY_CUSTOM_CODE_HTML?: string

  // 其他配置字段(根据需要扩展)
  [key: string]: any
}

// 访问统计 (model.VisitorStatistics)
export interface VisitorStatistics {
  today_views: number // 今日访问
  today_visitors: number // 今日人数
  yesterday_views: number // 昨日访问
  yesterday_visitors: number // 昨日人数
  month_views: number // 最近月访问
  year_views: number // 最近年访问
}

// 页面内容
export interface PageContent {
  id: string
  title: string
  content?: string
  htmlContent?: string
  slug: string
  created_at?: string
  updated_at?: string
}

// ============ 兼容性别名 ============
// 保留旧的类型名称以兼容现有代码

export type LinkItem = LinkDTO
export type LinkCategory = LinkCategoryDTO
export type BasicStats = VisitorStatistics

