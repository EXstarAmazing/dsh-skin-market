import { describe, expect, it } from 'vitest'
import { MARKET_CLI_COMMAND, MARKET_DESKTOP_INPUT, MARKET_PROMPT, MARKET_REPOSITORY, MARKET_WEB_COMMAND, skinCommand, skinPrompt } from '../site/prompts.ts'

describe('static catalog prompts', () => {
  it('generates the platform installation prompt', () => {
    expect(MARKET_PROMPT).toContain(MARKET_REPOSITORY)
    expect(MARKET_CLI_COMMAND).toContain(MARKET_WEB_COMMAND)
    expect(MARKET_CLI_COMMAND).toContain(MARKET_DESKTOP_INPUT)
    expect(MARKET_CLI_COMMAND).not.toContain('--profile desktop')
    expect(MARKET_PROMPT).toContain('判断是 Web 版还是官方 Desktop')
    expect(MARKET_PROMPT).toContain('无法判断就先问我')
    expect(MARKET_PROMPT).toContain('不要执行 dsh plugin --profile desktop')
    expect(MARKET_PROMPT).toContain('不要替我安装其他皮肤')
  })

  it('asks the agent to install the selected skin through the market', () => {
    const prompt = skinPrompt('https://github.com/example/dsh-skin')
    expect(prompt).toContain('请安装这个固定版本的 DSH 皮肤：https://github.com/example/dsh-skin')
    expect(prompt).toContain('判断是 Web 版还是官方 Desktop')
    expect(prompt).toContain('不要执行 dsh plugin --profile desktop')
    expect(prompt).toContain('设置 → 皮肤市场')
    expect(prompt).toContain('必须先检查冲突再安装')
    expect(prompt).toContain('停在安装前')
  })

  it('adds a review-first guard to unverified skin prompts', () => {
    const prompt = skinPrompt('https://github.com/example/dsh-skin', false)

    expect(prompt).toContain('请安装这个固定版本的 DSH 皮肤：https://github.com/example/dsh-skin')
    expect(prompt).toContain('先只读检查仓库')
    expect(prompt).toContain('等待我确认后再安装')
    expect(prompt).toContain('不要直接安装')
  })

  it('generates a command for the catalog-pinned skin target', () => {
    const target = `github:example/dsh-skin#${'a'.repeat(40)}`
    const command = skinCommand(target)

    expect(command).toBe([
      '# Web 版',
      `dsh plugin --profile web add "${target}"`,
      '',
      '# 官方桌面版：不要在终端执行；在桌面应用「设置 → 皮肤市场」中打开该皮肤并安装',
    ].join('\n'))
    expect(command).not.toContain('--profile desktop')
  })

  it('copies subdirectory skins as a direct pnpm add', () => {
    const target = `github:example/dsh-skin#${'a'.repeat(40)}&path:/packages/skin`
    expect(skinCommand(target)).toBe([
      '# Web 版',
      `pnpm add "${target}" --dir "$HOME/.dsh/profiles/web"`,
      `pnpm add "${target}" --dir "$env:USERPROFILE\\.dsh\\profiles\\web"`,
      '',
      '# 官方桌面版：不要在终端执行；在桌面应用「设置 → 皮肤市场」中打开该皮肤并安装',
    ].join('\n'))
  })
})
