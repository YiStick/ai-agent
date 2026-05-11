import type { AppType } from '@repo/api'
import { BizCode, type ApiResponse, type PingRequest, type PingResponse } from '@repo/contracts'
import { Card, CardContent } from '@repo/ui/card'
import { hc, type InferResponseType } from 'hono/client'
import { getWebServerEnv } from '../src/env.server'

const rpcPayload: PingRequest = {
  name: 'web',
}

type PingRpcResponse = InferResponseType<
  ReturnType<typeof hc<AppType>>['rpc']['system']['ping']['$post']
>

async function getPingResponse(): Promise<PingRpcResponse> {
  const { API_BASE_URL: apiBaseUrl } = getWebServerEnv()
  const client = hc<AppType>(apiBaseUrl)

  try {
    const response = await client.rpc.system.ping.$post({
      json: rpcPayload,
    })

    return await response.json()
  } catch (error) {
    return {
      ok: false,
      error: {
        code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
        message: error instanceof Error ? error.message : 'API request failed',
      },
      meta: {
        requestId: 'unavailable',
        timestamp: new Date().toISOString(),
      },
    } satisfies ApiResponse<PingResponse>
  }
}

export default async function Home() {
  const env = getWebServerEnv()
  const pingResult = await getPingResponse()
  const requestBody = JSON.stringify(rpcPayload, null, 2)
  const responseBody = JSON.stringify(pingResult, null, 2)

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,124,255,0.22),_transparent_32%),linear-gradient(180deg,_rgba(17,24,39,0.96),_rgba(10,15,30,1))] px-6 py-10 text-content-primary">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:items-start">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-300">
              Typed RPC verification
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-content-primary sm:text-5xl">
                Shared request and response contract
              </h1>
              <p className="max-w-2xl text-base leading-7 text-content-secondary">
                首页直接通过 <code className="rounded bg-white/8 px-2 py-1 text-content-primary">hc&lt;AppType&gt;()</code> 调用 API，
                用同一份 contract 验证请求参数、响应结构和错误码是否已经串到一起。
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-content-secondary">
              <span className="rounded-full border border-border-default bg-surface-overlay px-3 py-1.5">
                POST /rpc/system/ping
              </span>
              <span className="rounded-full border border-border-default bg-surface-overlay px-3 py-1.5">
                {pingResult.ok ? 'ok=true' : `code=${pingResult.error.code}`}
              </span>
              <span className="rounded-full border border-border-default bg-surface-overlay px-3 py-1.5">
                APP_ENV: {env.APP_ENV}
              </span>
              <span className="rounded-full border border-border-default bg-surface-overlay px-3 py-1.5">
                API_BASE_URL: {env.API_BASE_URL}
              </span>
            </div>
          </div>

          <Card className="overflow-hidden border-brand-500/20 bg-surface-overlay shadow-lg shadow-brand-900/25">
            <CardContent className="space-y-4 p-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-300">
                  Verification scope
                </p>
                <p className="text-sm leading-6 text-content-secondary">
                  检查共享请求类型、共享响应类型、统一异常码，以及 Hono RPC 的类型推导是否同时生效。
                </p>
              </div>
              <div className="grid gap-3 text-sm text-content-secondary">
                <div className="rounded-2xl border border-border-default bg-surface-panel/80 p-4">
                  PingRequest 来自共享包，前后端共用同一份入参定义。
                </div>
                <div className="rounded-2xl border border-border-default bg-surface-panel/80 p-4">
                  PingResponse 和 ApiResponse 统一了成功与失败 envelope。
                </div>
                <div className="rounded-2xl border border-border-default bg-surface-panel/80 p-4">
                  AppType 驱动 RPC 路径、请求体和返回值的真实推导。
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="py-2">
          <Card className="overflow-hidden border border-border-default bg-surface-overlay shadow-md">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-content-secondary">
                  RPC validation
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-content-primary">
                  Shared request and response contract
                </h2>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border-default bg-surface-panel/70 p-4">
                  <p className="text-sm font-medium text-content-primary">Request</p>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all text-xs leading-6 text-content-secondary">
                    {requestBody}
                  </pre>
                </div>

                <div className="rounded-2xl border border-border-default bg-surface-panel/70 p-4">
                  <p className="text-sm font-medium text-content-primary">Response</p>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all text-xs leading-6 text-content-secondary">
                    {responseBody}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
