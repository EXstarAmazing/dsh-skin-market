import type { Context } from '@deepseek-ai/cordis'
import { desktopRunner, runPluginCli, type DesktopPnpmLike } from './commands.ts'
import { officialDesktopRunner, type OfficialPluginManagerLike } from './official-desktop.ts'
import { resolveProfileDir } from './profile.ts'
import { mountRoutes, type SkinMarketHost } from './routes.ts'
import { createCliRestartScheduler } from './restart.ts'
import { detectDshRuntime } from './runtime.ts'

export const name = 'dsh-skin-market'
export interface Config { profile?: string }

interface DesktopProfilesLike { current: { name: string; dir: string } }
interface ProfileContextLike { name?: unknown; dir?: unknown }
interface EffectHost extends SkinMarketHost {
  effect(callback: () => (() => void | Promise<void>), label: string): void
}

function argvProfile(): string | undefined {
  const index = process.argv.indexOf('--profile')
  return index >= 0 && process.argv[index + 1] !== undefined ? process.argv[index + 1] : undefined
}

export function apply(ctx: Context, config?: Config): void {
  ctx.inject(['webServer', 'loader', 'agents'], hostContext => {
    const host = hostContext as unknown as EffectHost
    const desktopProfiles = ctx.get('desktopProfiles') as DesktopProfilesLike | undefined
    const profileContext = ctx.get('profileContext') as ProfileContextLike | undefined
    const contextName = typeof profileContext?.name === 'string' ? profileContext.name.trim() : ''
    const contextDir = typeof profileContext?.dir === 'string' ? profileContext.dir.trim() : ''
    // Official Electron Desktop owns its profile through profileContext and
    // pluginManager; its CLI rejects `--profile desktop`. Resolve this branch
    // before the ordinary CLI fallback so actions mutate the visible profile.
    if (desktopProfiles === undefined && config?.profile === undefined && contextName.toLowerCase() === 'desktop' && contextDir !== '') {
      const runner = officialDesktopRunner(() => hostContext.get('pluginManager') as OfficialPluginManagerLike | undefined)
      host.effect(
        () => mountRoutes(host, { profile: contextName, profileDir: contextDir, runner, hostKind: 'desktop', runtime: detectDshRuntime() }),
        'dsh-skin-market: official Desktop routes',
      )
      return
    }
    if (desktopProfiles === undefined) {
      const profile = config?.profile ?? (contextName !== '' ? contextName : undefined) ?? argvProfile() ?? 'web'
      const profileDir = config?.profile === undefined && contextDir !== '' ? contextDir : resolveProfileDir(profile)
      const appExit = ctx.get('appExit') as ((code: number) => void) | undefined
      const restart = appExit === undefined ? undefined : createCliRestartScheduler(appExit)
      host.effect(() => mountRoutes(host, { profile, profileDir, runner: runPluginCli, hostKind: 'dsh', runtime: detectDshRuntime(), restart }), 'dsh-skin-market: routes')
      return
    }
    hostContext.inject(['desktopPnpm'], desktopContext => {
      const current = desktopProfiles.current
      const service = (desktopContext as unknown as { desktopPnpm: DesktopPnpmLike }).desktopPnpm
      const desktopHost = desktopContext as unknown as EffectHost
      desktopHost.effect(
        () => mountRoutes(host, { profile: current.name, profileDir: current.dir, runner: desktopRunner(service, current.dir), hostKind: 'desktop', runtime: detectDshRuntime() }),
        'dsh-skin-market: desktop routes',
      )
    })
  })
}

export { mountRoutes } from './routes.ts'
export { SkinLifecycle } from './lifecycle.ts'
