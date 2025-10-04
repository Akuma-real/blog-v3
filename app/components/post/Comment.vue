<script setup lang="ts">
import type { CommentItem } from '~/types/api'

const route = useRoute()
const post = inject<any>('post') // 从父组件获取文章信息

// 响应式参数
const currentPage = ref(1)
const pageSize = 10

const params = computed(() => ({
	page: currentPage.value,
	pageSize,
}))

// 从后端 API 获取评论
const { data: commentResponse, pending, error, refresh } = await useComments(
	computed(() => route.path),
	params,
)

const comments = computed(() => commentResponse.value?.data?.list || [])
const total = computed(() => commentResponse.value?.data?.total || 0)
const totalPages = computed(() => Math.ceil(total.value / pageSize))

// 点赞管理
const { isLiked, toggleLike } = useCommentLikes()
const likingComments = ref<Set<string>>(new Set())

// 回复管理
const replyingTo = ref<string | null>(null)

// 加载更多评论
function loadMore() {
	if (currentPage.value < totalPages.value) {
		currentPage.value++
	}
}

// 格式化时间
function formatDate(dateStr: string) {
	const date = new Date(dateStr)
	return date.toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	})
}

// 生成 Gravatar 头像 URL
function getAvatarUrl(emailMd5: string, nickname: string) {
	if (emailMd5) {
		return `https://cravatar.cn/avatar/${emailMd5}?s=80&d=identicon`
	}
	return `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&size=80`
}

// 发布评论成功
async function handleCommentSuccess() {
	// 重置回复状态
	replyingTo.value = null
	// 刷新评论列表
	await refresh()
}

// 点击回复按钮
function handleReply(commentId: string) {
	replyingTo.value = replyingTo.value === commentId ? null : commentId
}

// 取消回复
function handleCancelReply() {
	replyingTo.value = null
}

// 点赞/取消点赞
async function handleLike(comment: CommentItem) {
	if (likingComments.value.has(comment.id))
		return

	likingComments.value.add(comment.id)

	try {
		const wasLiked = isLiked(comment.id)
		const response = wasLiked
			? await unlikeComment(comment.id)
			: await likeComment(comment.id)

		if (response.code === 200) {
			toggleLike(comment.id)
			// 更新本地点赞数
			comment.like_count = response.data
		}
	}
	catch (err) {
		console.error('点赞操作失败:', err)
	}
	finally {
		likingComments.value.delete(comment.id)
	}
}
</script>

<template>
<section class="z-comment">
	<h3 class="text-creative">
		评论区
	</h3>

	<!-- 主评论表单 -->
	<PostCommentForm
		:target-path="route.path"
		:target-title="post?.title"
		@success="handleCommentSuccess"
	/>

	<div v-if="pending" class="tk-loading">
		<p>评论加载中...</p>
	</div>
	<div v-else-if="error" class="tk-error">
		<p>评论加载失败，请稍后重试</p>
	</div>
	<div v-else-if="comments.length === 0" class="tk-empty">
		<p>暂无评论，快来发表第一条评论吧~</p>
	</div>
	<div v-else class="tk-comments">
		<!-- 评论列表 -->
		<div v-for="comment in comments" :key="comment.id" class="tk-comment-item">
			<div class="tk-avatar">
				<img :src="getAvatarUrl(comment.email_md5, comment.nickname)" :alt="comment.nickname">
			</div>
			<div class="tk-main">
				<div class="tk-row">
					<div class="tk-meta">
						<strong class="tk-nick">{{ comment.nickname }}</strong>
						<span v-if="comment.is_admin_comment" class="tk-admin-badge">博主</span>
						<span v-if="comment.pinned_at" class="tk-pinned-badge">置顶</span>
						<span class="tk-time">{{ formatDate(comment.created_at) }}</span>
					</div>
				</div>
				<div class="tk-content" v-html="comment.content_html" />
				<div class="tk-footer">
					<button
						class="tk-action-btn"
						:class="{ 'is-liked': isLiked(comment.id) }"
						:disabled="likingComments.has(comment.id)"
						@click="handleLike(comment)"
					>
						<span class="icon">{{ isLiked(comment.id) ? '❤️' : '🤍' }}</span>
						<span v-if="comment.like_count > 0">{{ comment.like_count }}</span>
					</button>
					<button class="tk-action-btn" @click="handleReply(comment.id)">
						<span class="icon">💬</span>
						回复
					</button>
					<a v-if="comment.website" :href="comment.website" target="_blank" rel="nofollow noopener" class="tk-website">🔗 网站</a>
				</div>

				<!-- 回复表单 -->
				<PostCommentForm
					v-if="replyingTo === comment.id"
					:target-path="route.path"
					:target-title="post?.title"
					:parent-id="comment.id"
					:reply-to-nick="comment.nickname"
					@success="handleCommentSuccess"
					@cancel="handleCancelReply"
				/>

				<!-- 子评论 -->
				<div v-if="comment.children && comment.children.length > 0" class="tk-replies">
					<div v-for="reply in comment.children" :key="reply.id" class="tk-comment-item">
						<div class="tk-avatar">
							<img :src="getAvatarUrl(reply.email_md5, reply.nickname)" :alt="reply.nickname">
						</div>
						<div class="tk-main">
							<div class="tk-row">
								<div class="tk-meta">
									<strong class="tk-nick">{{ reply.nickname }}</strong>
									<span v-if="reply.is_admin_comment" class="tk-admin-badge">博主</span>
									<span v-if="reply.reply_to_nick" class="tk-reply-to">
										回复 @{{ reply.reply_to_nick }}
									</span>
									<span class="tk-time">{{ formatDate(reply.created_at) }}</span>
								</div>
							</div>
							<div class="tk-content" v-html="reply.content_html" />
							<div class="tk-footer">
								<button
									class="tk-action-btn"
									:class="{ 'is-liked': isLiked(reply.id) }"
									:disabled="likingComments.has(reply.id)"
									@click="handleLike(reply)"
								>
									<span class="icon">{{ isLiked(reply.id) ? '❤️' : '🤍' }}</span>
									<span v-if="reply.like_count > 0">{{ reply.like_count }}</span>
								</button>
								<button class="tk-action-btn" @click="handleReply(reply.id)">
									<span class="icon">💬</span>
									回复
								</button>
								<a v-if="reply.website" :href="reply.website" target="_blank" rel="nofollow noopener" class="tk-website">🔗 网站</a>
							</div>

							<!-- 回复的回复表单 -->
							<PostCommentForm
								v-if="replyingTo === reply.id"
								:target-path="route.path"
								:target-title="post?.title"
								:parent-id="comment.id"
								:reply-to-nick="reply.nickname"
								@success="handleCommentSuccess"
								@cancel="handleCancelReply"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 加载更多 -->
		<div v-if="currentPage < totalPages" class="tk-load-more">
			<button @click="loadMore">
				加载更多评论 ({{ comments.length }}/{{ total }})
			</button>
		</div>
	</div>
</section>
</template>

<style lang="scss" scoped>
.z-comment {
	margin: 3rem 1rem;

	> h3 {
		margin-top: 3rem;
		font-size: 1.25rem;
	}
}

.tk-loading,
.tk-error,
.tk-empty {
	margin: 2em 0;
	padding: 2em;
	text-align: center;
	color: var(--c-text-3);
	background-color: var(--c-bg-2);
	border-radius: 0.5rem;
}

.tk-error {
	color: var(--c-error, #f56);
}

.tk-comments {
	margin: 2em 0;
}

.tk-comment-item {
	display: flex;
	gap: 1rem;
	margin: 1.5rem 0;
	padding: 1rem;
	background-color: var(--c-bg-2);
	border-radius: 0.5rem;
	transition: background-color 0.2s;

	&:hover {
		background-color: var(--c-bg-3);
	}
}

.tk-avatar {
	flex-shrink: 0;

	img {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
	}
}

.tk-main {
	flex: 1;
	min-width: 0;
}

.tk-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.5rem;
}

.tk-meta {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-wrap: wrap;
}

.tk-nick {
	font-family: var(--font-creative);
	font-size: 1rem;
	color: var(--c-text-1);
}

.tk-admin-badge,
.tk-pinned-badge {
	display: inline-block;
	padding: 0.1em 0.4em;
	font-size: 0.7rem;
	border-radius: 0.25rem;
	font-weight: bold;
}

.tk-admin-badge {
	background-color: var(--c-primary, #3b82f6);
	color: white;
}

.tk-pinned-badge {
	background-color: var(--c-warning, #f59e0b);
	color: white;
}

.tk-reply-to {
	font-size: 0.85rem;
	color: var(--c-text-2);
}

.tk-time {
	font-size: 0.7rem;
	color: var(--c-text-3);
}

.tk-content {
	margin-top: 0.5rem;
	font-size: 0.95rem;
	line-height: 1.6;
	color: var(--c-text-2);
	word-wrap: break-word;

	:deep(p) {
		margin: 0.2em 0;
	}

	:deep(pre) {
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		overflow-x: auto;
	}

	:deep(img) {
		max-width: 100%;
		border-radius: 0.5em;
	}

	:deep(a) {
		color: var(--c-primary);
		text-decoration: underline;
	}

	:deep(blockquote) {
		margin: 0.5em 0;
		padding: 0.2em 0.5em;
		border-inline-start: 4px solid var(--c-border);
		border-radius: 4px;
		background-color: var(--c-bg-2);
		font-size: 0.9rem;
	}
}

.tk-footer {
	margin-top: 0.5rem;
	display: flex;
	align-items: center;
	gap: 1rem;
	font-size: 0.8rem;
	color: var(--c-text-3);
}

.tk-action-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.5rem;
	border: none;
	background: none;
	color: var(--c-text-3);
	font-size: 0.8rem;
	cursor: pointer;
	border-radius: 0.25rem;
	transition: all 0.2s;

	&:hover:not(:disabled) {
		background-color: var(--c-bg-3);
		color: var(--c-text-2);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	&.is-liked {
		color: var(--c-primary);

		.icon {
			animation: heartBeat 0.3s;
		}
	}

	.icon {
		font-size: 1em;
	}
}

@keyframes heartBeat {
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.2);
	}
}

.tk-website {
	color: var(--c-primary);
	text-decoration: none;
	transition: opacity 0.2s;

	&:hover {
		opacity: 0.8;
	}
}

.tk-replies {
	margin-top: 1rem;
	padding-left: 1rem;
	border-left: 2px solid var(--c-border);

	.tk-comment-item {
		background-color: transparent;

		&:hover {
			background-color: var(--c-bg-2);
		}
	}

	.tk-avatar img {
		width: 36px;
		height: 36px;
	}
}

.tk-load-more {
	margin: 2rem 0;
	text-align: center;

	button {
		padding: 0.75rem 1.5rem;
		background-color: var(--c-primary);
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			opacity: 0.9;
			transform: translateY(-2px);
		}

		&:active {
			transform: translateY(0);
		}
	}
}
</style>
