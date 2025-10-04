/**
 * 评论用户信息管理
 * 使用 localStorage 持久化保存用户信息
 */
import type { CommentUser } from '~/types/api'

const STORAGE_KEY = 'comment-user-info'

/**
 * 从 localStorage 读取用户信息
 */
function loadUserInfo(): Partial<CommentUser> {
  if (import.meta.server)
    return {}

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  }
  catch (error) {
    console.error('Failed to load user info:', error)
    return {}
  }
}

/**
 * 保存用户信息到 localStorage
 */
function saveUserInfo(info: Partial<CommentUser>) {
  if (import.meta.server)
    return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
  }
  catch (error) {
    console.error('Failed to save user info:', error)
  }
}

/**
 * 管理点赞状态
 */
const LIKES_STORAGE_KEY = 'comment-likes'

export function useCommentLikes() {
  const likedComments = ref<Set<string>>(new Set())

  // 从 localStorage 加载已点赞的评论
  onMounted(() => {
    if (import.meta.client) {
      try {
        const stored = localStorage.getItem(LIKES_STORAGE_KEY)
        if (stored) {
          likedComments.value = new Set(JSON.parse(stored))
        }
      }
      catch (error) {
        console.error('Failed to load liked comments:', error)
      }
    }
  })

  // 保存到 localStorage
  function saveLikes() {
    if (import.meta.client) {
      try {
        localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(Array.from(likedComments.value)))
      }
      catch (error) {
        console.error('Failed to save liked comments:', error)
      }
    }
  }

  function isLiked(commentId: string) {
    return likedComments.value.has(commentId)
  }

  function toggleLike(commentId: string) {
    if (likedComments.value.has(commentId)) {
      likedComments.value.delete(commentId)
    }
    else {
      likedComments.value.add(commentId)
    }
    saveLikes()
  }

  return {
    likedComments: readonly(likedComments),
    isLiked,
    toggleLike,
  }
}

/**
 * 管理评论用户信息
 */
export function useCommentUser() {
  const userInfo = ref<Partial<CommentUser>>(loadUserInfo())

  // 更新用户信息
  function updateUserInfo(info: Partial<CommentUser>) {
    userInfo.value = { ...userInfo.value, ...info }
    saveUserInfo(userInfo.value)
  }

  // 清除用户信息
  function clearUserInfo() {
    userInfo.value = {}
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return {
    userInfo: readonly(userInfo),
    updateUserInfo,
    clearUserInfo,
  }
}
