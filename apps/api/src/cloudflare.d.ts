declare namespace Cloudflare {
  interface GlobalProps {
    mainModule: typeof import('./index')
  }

  interface TestEnv {
    APP_ENV: 'test'
  }

  interface ProductionEnv {
    APP_ENV: 'production'
  }

  interface Env {
    APP_ENV: 'test' | 'production' | 'development'
  }
}

interface CloudflareBindings extends Cloudflare.Env {}
