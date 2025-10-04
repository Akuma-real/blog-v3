/**
 * 评论相关 API Composables
 * 统一管理所有评论相关的功能
 */
import { API_CONFIG, useApi } from '~/config/api'
import type { CommentItem, PaginatedResponse } from '~/types/api'

/**
 * 获取评论列表
 * @param path 评论目标路径
 * @param params 分页参数
 */
export function useComments(
  path: MaybeRef<string>,
  params?: MaybeRef<{
    page?: number
    pageSize?: number
  }>,
) {
  const commentPath = computed(() => unref(path))
  const commentParams = computed(() => unref(params))

  const query = computed(() => ({
    target_path: commentPath.value,
    page: commentParams.value?.page || 1,
    pageSize: commentParams.value?.pageSize || 10,
  }))

  return useApi<PaginatedResponse<CommentItem>>(
    API_CONFIG.endpoints.comments,
    {
      query,
      key: computed(() => `comments-${commentPath.value}-${query.value.page}`),
    },
  )
}

/**
 * 获取最新评论
 * @param params 分页参数
 */
export function useLatestComments(params?: MaybeRef<{
  page?: number
  pageSize?: number
}>) {
  const commentParams = computed(() => unref(params))

  const query = computed(() => ({
    page: commentParams.value?.page || 1,
    pageSize: commentParams.value?.pageSize || 10,
  }))

  return useApi<PaginatedResponse<CommentItem>>(
    API_CONFIG.endpoints.commentsLatest,
    { query },
  )
}

/**
 * 发布评论
 * @param data 评论数据
 */
export async function createComment(data: {
  content: string
  nickname: string
  target_path: string
  email?: string
  website?: string
  parent_id?: string
  target_title?: string
  allow_notification?: boolean
}) {
  return await $fetch<{ code: number, message: string, data: CommentItem }>(
    API_CONFIG.endpoints.comments,
    {
      baseURL: API_CONFIG.baseURL,
      method: 'POST',
      body: data,
    },
  )
}

/**
 * 点赞评论
 * @param id 评论ID
 */
export async function likeComment(id: string) {
  return await $fetch<{ code: number, message: string, data: number }>(
    `${API_CONFIG.endpoints.comments}/${id}/like`,
    {
      baseURL: API_CONFIG.baseURL,
      method: 'POST',
    },
  )
}

/**
 * 取消点赞评论
 * @param id 评论ID
 */
export async function unlikeComment(id: string) {
  return await $fetch<{ code: number, message: string, data: number }>(
    `${API_CONFIG.endpoints.comments}/${id}/unlike`,
    {
      baseURL: API_CONFIG.baseURL,
      method: 'POST',
    },
  )
}
