import type { PluginRunner } from './commands.ts';
/**
 * The official Electron Desktop host owns profile mutations through this
 * Remote. Keep the shape structural so the market does not take a runtime
 * dependency on the Desktop application package.
 */
export interface OfficialPluginManagerLike {
    installBundle(spec: string, options?: Record<string, unknown>): Promise<unknown>;
    removeBundle(name: string): Promise<unknown>;
    cancelInstall?(requestId: string): Promise<unknown>;
}
/**
 * Adapt the official Desktop plugin manager to the market's existing runner.
 * The manager is looked up for every operation because its Remote is owned by
 * the current Cordis generation and may not survive a profile switch.
 */
export declare function officialDesktopRunner(getManager: () => OfficialPluginManagerLike | undefined): PluginRunner;
