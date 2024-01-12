export default defineNuxtRouteMiddleware((_from, to) => {
  if (to.path === '/healthz') {
    to.path = '/api/healthz' // prevents this middleware from triggering forever
    return navigateTo('/api/healthz')
  }
})
