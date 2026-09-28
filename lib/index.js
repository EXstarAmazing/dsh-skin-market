import { desktopRunner, runPluginCli } from './commands.js';
import { officialDesktopRunner } from './official-desktop.js';
import { resolveProfileDir } from './profile.js';
import { mountRoutes } from './routes.js';
import { createCliRestartScheduler } from './restart.js';
import { detectDshRuntime } from './runtime.js';
export const name = 'dsh-skin-market';
function argvProfile() {
    const index = process.argv.indexOf('--profile');
    return index >= 0 && process.argv[index + 1] !== undefined ? process.argv[index + 1] : undefined;
}
export function apply(ctx, config) {
    ctx.inject(['webServer', 'loader', 'agents'], hostContext => {
        const host = hostContext;
        const desktopProfiles = ctx.get('desktopProfiles');
        const profileContext = ctx.get('profileContext');
        const contextName = typeof profileContext?.name === 'string' ? profileContext.name.trim() : '';
        const contextDir = typeof profileContext?.dir === 'string' ? profileContext.dir.trim() : '';
        // Official Electron Desktop owns its profile through profileContext and
        // pluginManager; its CLI rejects `--profile desktop`. Resolve this branch
        // before the ordinary CLI fallback so actions mutate the visible profile.
        if (desktopProfiles === undefined && config?.profile === undefined && contextName.toLowerCase() === 'desktop' && contextDir !== '') {
            const runner = officialDesktopRunner(() => hostContext.get('pluginManager'));
            host.effect(() => mountRoutes(host, { profile: contextName, profileDir: contextDir, runner, hostKind: 'desktop', runtime: detectDshRuntime() }), 'dsh-skin-market: official Desktop routes');
            return;
        }
        if (desktopProfiles === undefined) {
            const profile = config?.profile ?? (contextName !== '' ? contextName : undefined) ?? argvProfile() ?? 'web';
            const profileDir = config?.profile === undefined && contextDir !== '' ? contextDir : resolveProfileDir(profile);
            const appExit = ctx.get('appExit');
            const restart = appExit === undefined ? undefined : createCliRestartScheduler(appExit);
            host.effect(() => mountRoutes(host, { profile, profileDir, runner: runPluginCli, hostKind: 'dsh', runtime: detectDshRuntime(), restart }), 'dsh-skin-market: routes');
            return;
        }
        hostContext.inject(['desktopPnpm'], desktopContext => {
            const current = desktopProfiles.current;
            const service = desktopContext.desktopPnpm;
            const desktopHost = desktopContext;
            desktopHost.effect(() => mountRoutes(host, { profile: current.name, profileDir: current.dir, runner: desktopRunner(service, current.dir), hostKind: 'desktop', runtime: detectDshRuntime() }), 'dsh-skin-market: desktop routes');
        });
    });
}
export { mountRoutes } from './routes.js';
export { SkinLifecycle } from './lifecycle.js';
