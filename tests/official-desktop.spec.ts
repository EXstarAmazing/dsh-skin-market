import { describe, expect, it, vi } from 'vitest'
import { officialDesktopRunner, type OfficialPluginManagerLike } from '../src/official-desktop.ts'

describe('official Desktop runner', () => {
  it('installs through the profile plugin manager without enabling the bundle first', async () => {
    const installBundle = vi.fn(async () => ({ changed: 'applied' }))
    const manager: OfficialPluginManagerLike = { installBundle, removeBundle: vi.fn(async () => ({ changed: 'applied' })) }
    const runner = officialDesktopRunner(() => manager)

    const result = await runner.installPlugin!(
      'desktop',
      { packageName: 'dsh-theme-endfield', packageVersion: '1.0.1', receiptId: 'receipt-1' },
    )

    expect(result.exitCode).toBe(0)
    expect(installBundle).toHaveBeenCalledWith('dsh-theme-endfield@1.0.1', { enabled: false, requestId: 'receipt-1' })
  })

  it('routes remove through the same manager and surfaces manager failures', async () => {
    const removeBundle = vi.fn(async () => ({ changed: 'failed', error: { message: 'profile is locked' } }))
    const manager: OfficialPluginManagerLike = { installBundle: vi.fn(), removeBundle }
    const runner = officialDesktopRunner(() => manager)

    const result = await runner('desktop', ['remove', 'dsh-theme-endfield'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('profile is locked')
    expect(removeBundle).toHaveBeenCalledWith('dsh-theme-endfield')
  })

  it('cancels a manager-owned install when the market operation is aborted', async () => {
    let resolveInstall!: (value: unknown) => void
    const cancelInstall = vi.fn(async () => ({ cancelled: true }))
    const installBundle = vi.fn(() => new Promise<unknown>(resolve => { resolveInstall = resolve }))
    const manager: OfficialPluginManagerLike = { installBundle, removeBundle: vi.fn(), cancelInstall }
    const runner = officialDesktopRunner(() => manager)
    const controller = new AbortController()
    const operation = runner.installPlugin!(
      'desktop',
      { packageName: 'dsh-theme-endfield', packageVersion: '1.0.1', receiptId: 'receipt-2' },
      { signal: controller.signal },
    )

    controller.abort()
    expect(cancelInstall).toHaveBeenCalledWith('receipt-2')
    resolveInstall({ cancelled: true })
    await expect(operation).resolves.toMatchObject({ exitCode: 0, aborted: true })
  })

  it('fails closed when the official manager is unavailable', async () => {
    const runner = officialDesktopRunner(() => undefined)
    const result = await runner('desktop', ['remove', 'dsh-theme-endfield'])
    expect(result.exitCode).toBeNull()
    expect(result.stderr).toContain('pluginManager')
  })
})
