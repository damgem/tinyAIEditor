const startupTime = new Date()

const handler = eventHandler(() => ({
  status: 'healthy',
  time: new Date(),
  startupTime,
  nuxtAppVersion: useRuntimeConfig().version || 'unknown'
}))

export type HealthCheckData = Awaited<ReturnType<typeof handler>>
export default handler
