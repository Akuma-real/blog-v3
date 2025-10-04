<script setup lang="ts">
const props = defineProps<{
	targetPath: string
	targetTitle?: string
	parentId?: string
	replyToNick?: string
}>()

const emit = defineEmits<{
	success: []
	cancel: []
}>()

const { userInfo, updateUserInfo } = useCommentUser()

// 表单数据
const form = reactive({
	nickname: userInfo.value.nickname || '',
	email: userInfo.value.email || '',
	website: userInfo.value.website || '',
	content: '',
	allowNotification: userInfo.value.allowNotification ?? true,
})

// 表单状态
const submitting = ref(false)
const error = ref('')
const showAdvanced = ref(false)

// 字数统计
const contentLength = computed(() => form.content.trim().length)
const maxLength = 1000

// 表单验证
const isValid = computed(() => {
	return form.nickname.trim().length >= 2
		&& form.nickname.trim().length <= 50
		&& contentLength.value >= 1
		&& contentLength.value <= maxLength
})

// 提交评论
async function handleSubmit() {
	if (!isValid.value || submitting.value)
		return

	error.value = ''
	submitting.value = true

	try {
		// 保存用户信息
		updateUserInfo({
			nickname: form.nickname.trim(),
			email: form.email.trim(),
			website: form.website.trim(),
			allowNotification: form.allowNotification,
		})

		// 提交评论
		const response = await createComment({
			content: form.content.trim(),
			nickname: form.nickname.trim(),
			target_path: props.targetPath,
			target_title: props.targetTitle,
			email: form.email.trim() || undefined,
			website: form.website.trim() || undefined,
			parent_id: props.parentId || undefined,
			allow_notification: form.allowNotification,
		})

		if (response.code === 200) {
			// 清空评论内容
			form.content = ''
			// 触发成功事件
			emit('success')
		}
		else {
			error.value = response.message || '发布失败，请重试'
		}
	}
	catch (err: any) {
		console.error('提交评论失败:', err)
		error.value = err.message || '发布失败，请重试'
	}
	finally {
		submitting.value = false
	}
}

// 取消回复
function handleCancel() {
	emit('cancel')
}
</script>

<template>
<div class="comment-form" :class="{ 'is-reply': parentId }">
	<div v-if="replyToNick" class="reply-hint">
		回复 @{{ replyToNick }}
	</div>

	<form @submit.prevent="handleSubmit">
		<!-- 评论内容 -->
		<div class="form-group">
			<textarea
				v-model="form.content"
				class="form-textarea"
				:placeholder="parentId ? '写下你的回复...' : '写下你的评论...'"
				rows="4"
				:maxlength="maxLength"
			/>
			<div class="textarea-footer">
				<span class="char-count" :class="{ 'is-limit': contentLength > maxLength * 0.9 }">
					{{ contentLength }}/{{ maxLength }}
				</span>
			</div>
		</div>

		<!-- 基础信息 -->
		<div class="form-row">
			<div class="form-group">
				<input
					v-model="form.nickname"
					type="text"
					class="form-input"
					placeholder="昵称 *"
					required
					minlength="2"
					maxlength="50"
				>
			</div>
			<div class="form-group">
				<input
					v-model="form.email"
					type="email"
					class="form-input"
					placeholder="邮箱（可选）"
				>
			</div>
		</div>

		<!-- 高级选项 -->
		<div class="advanced-toggle">
			<button
				type="button"
				class="toggle-btn"
				@click="showAdvanced = !showAdvanced"
			>
				{{ showAdvanced ? '收起' : '更多选项' }}
			</button>
		</div>

		<div v-show="showAdvanced" class="advanced-options">
			<div class="form-group">
				<input
					v-model="form.website"
					type="url"
					class="form-input"
					placeholder="个人网站（可选）"
				>
			</div>
			<div class="form-group form-checkbox">
				<label>
					<input v-model="form.allowNotification" type="checkbox">
					<span>接收邮件通知</span>
				</label>
			</div>
		</div>

		<!-- 错误提示 -->
		<div v-if="error" class="form-error">
			{{ error }}
		</div>

		<!-- 提交按钮 -->
		<div class="form-actions">
			<button
				v-if="parentId"
				type="button"
				class="btn btn-secondary"
				:disabled="submitting"
				@click="handleCancel"
			>
				取消
			</button>
			<button
				type="submit"
				class="btn btn-primary"
				:disabled="!isValid || submitting"
			>
				{{ submitting ? '发布中...' : '发布评论' }}
			</button>
		</div>
	</form>
</div>
</template>

<style lang="scss" scoped>
.comment-form {
	margin: 2rem 0;
	padding: 1.5rem;
	background-color: var(--c-bg-2);
	border-radius: 0.5rem;

	&.is-reply {
		margin: 1rem 0;
		padding: 1rem;
		background-color: var(--c-bg-3);
	}
}

.reply-hint {
	margin-bottom: 1rem;
	font-size: 0.9rem;
	color: var(--c-text-2);
}

.form-group {
	margin-bottom: 1rem;
}

.form-textarea,
.form-input {
	width: 100%;
	padding: 0.75rem;
	border: 1px solid var(--c-border);
	border-radius: 0.375rem;
	background-color: var(--c-bg-1);
	color: var(--c-text-1);
	font-size: 0.95rem;
	font-family: inherit;
	transition: border-color 0.2s, box-shadow 0.2s;

	&:focus {
		outline: none;
		border-color: var(--c-primary);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: var(--c-text-3);
	}
}

.form-textarea {
	resize: vertical;
	min-height: 100px;
	font-family: var(--font-monospace);
}

.textarea-footer {
	display: flex;
	justify-content: flex-end;
	margin-top: 0.25rem;
}

.char-count {
	font-size: 0.75rem;
	color: var(--c-text-3);

	&.is-limit {
		color: var(--c-warning, #f59e0b);
	}
}

.form-row {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
}

.advanced-toggle {
	margin-bottom: 1rem;
}

.toggle-btn {
	padding: 0;
	border: none;
	background: none;
	color: var(--c-primary);
	font-size: 0.875rem;
	cursor: pointer;
	transition: opacity 0.2s;

	&:hover {
		opacity: 0.8;
	}
}

.advanced-options {
	margin-bottom: 1rem;
	padding-top: 1rem;
	border-top: 1px solid var(--c-border);
}

.form-checkbox {
	label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	input[type="checkbox"] {
		width: auto;
		margin: 0;
	}

	span {
		font-size: 0.9rem;
		color: var(--c-text-2);
	}
}

.form-error {
	margin-bottom: 1rem;
	padding: 0.75rem;
	background-color: rgba(239, 68, 68, 0.1);
	border: 1px solid rgba(239, 68, 68, 0.3);
	border-radius: 0.375rem;
	color: var(--c-error, #ef4444);
	font-size: 0.875rem;
}

.form-actions {
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
}

.btn {
	padding: 0.625rem 1.25rem;
	border: none;
	border-radius: 0.375rem;
	font-size: 0.95rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.btn-primary {
	background-color: var(--c-primary);
	color: white;

	&:not(:disabled):hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	&:not(:disabled):active {
		transform: translateY(0);
	}
}

.btn-secondary {
	background-color: var(--c-bg-3);
	color: var(--c-text-2);
	border: 1px solid var(--c-border);

	&:not(:disabled):hover {
		background-color: var(--c-bg-2);
	}
}
</style>
