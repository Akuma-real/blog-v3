/**
 * 构建后触发腾讯云 EdgeOne(TEO) 刷新缓存脚本
 * 依赖：tencentcloud-sdk-nodejs-teo >= 4.0.3
 * 环境变量：
 * - TENCENTCLOUD_SECRET_ID
 * - TENCENTCLOUD_SECRET_KEY
 * - TEO_ZONE_ID
 * - TEO_PURGE_TYPE (可选：purge_prefix | purge_url | purge_host | purge_all；默认 purge_prefix)
 * - TEO_PURGE_TARGETS (多个用逗号、空格或换行分隔；purge_all 可留空)
 */

import tencentcloud from 'tencentcloud-sdk-nodejs-teo'

type PurgeType = 'purge_prefix' | 'purge_url' | 'purge_host' | 'purge_all'

function parseTargets(raw?: string): string[] {
  if (!raw) return []
  return raw
    .split(/[\s,]+/)
    .map(s => s.trim())
    .filter(Boolean)
}

function getEnv(name: string): string | undefined {
  return process.env[name]
}
async function main() {
  const secretId = getEnv('TENCENTCLOUD_SECRET_ID')
  const secretKey = getEnv('TENCENTCLOUD_SECRET_KEY')
  const zoneId = getEnv('TEO_ZONE_ID')
  const typeRaw = (getEnv('TEO_PURGE_TYPE') || 'purge_prefix').toLowerCase() as PurgeType
  const targets = parseTargets(getEnv('TEO_PURGE_TARGETS'))

  const missing = ['TENCENTCLOUD_SECRET_ID', 'TENCENTCLOUD_SECRET_KEY', 'TEO_ZONE_ID'].filter(n => !getEnv(n))
  if (missing.length > 0) {
    console.log(`[CDN] 未配置必要环境变量（${missing.join(', ')}），跳过刷新。`)
    return
  }

  if (typeRaw !== 'purge_all' && targets.length === 0) {
    console.log('[CDN] 未提供 TEO_PURGE_TARGETS，且 TEO_PURGE_TYPE 非 purge_all，跳过刷新。')
    return
  }

  const clientConfig = {
    credential: { secretId, secretKey },
    region: '',
    profile: { httpProfile: { endpoint: 'teo.tencentcloudapi.com' } },
  }

  let client: any
  try {
    // @ts-ignore - CJS 默认导出
    const TeoClient = (tencentcloud as any)?.teo?.v20220901?.Client
    if (!TeoClient) throw new Error('无法加载 TEO 客户端，请确认依赖已安装')
    client = new TeoClient(clientConfig)
  }
  catch (e: any) {
    console.error('[CDN] 初始化 TEO 客户端失败：', e?.message ?? e)
    process.exit(1)
  }

  const params: any = { ZoneId: zoneId, Type: typeRaw }
  if (typeRaw !== 'purge_all') params.Targets = targets

  console.log('[CDN] 触发刷新任务：', JSON.stringify(params, null, 2))

  try {
    const data = await client.CreatePurgeTask(params)
    const taskId = (data && (data.TaskId || data.Response?.TaskId)) || JSON.stringify(data)
    console.log('[CDN] 刷新任务已提交：', taskId)
  }
  catch (err: any) {
    console.error('[CDN] 刷新任务失败：', err?.message ?? err)
    process.exit(1)
  }
}
void main()
