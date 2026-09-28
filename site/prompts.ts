import { createDshPluginAddCommand, createInstallCommand } from '../src/install-command.ts'

export const MARKET_REPOSITORY = 'https://github.com/kingOfSoySauce/dsh-skin-market'
export const MARKET_PUBLIC_URL = 'https://kingofsoysauce.github.io/dsh-skin-market/'
export const MARKET_WEB_COMMAND = createDshPluginAddCommand('dsh-skin-market@latest')
export const MARKET_DESKTOP_INPUT = 'dsh-skin-market@latest'
export const MARKET_CLI_COMMAND = [
  '# Web 版',
  MARKET_WEB_COMMAND,
  '',
  '# 官方桌面版：不要在终端执行；在桌面应用「插件 → 添加插件」中输入并启用',
  MARKET_DESKTOP_INPUT,
].join('\n')
export const CLI_INSTALL_WARNING = '安装前请确保已关闭其他皮肤插件，避免全局样式冲突；也可以复制提示词，让 Agent 先检查冲突再安装。'

export const MARKET_PROMPT = `请安装 dsh-skin-market。先运行 dsh --version，并根据当前宿主和实际 profile 的 package.json/bundles 判断是 Web 版还是官方 Desktop；无法判断就先问我。

- Web 版：先检查冲突，再执行 ${MARKET_WEB_COMMAND}。
- 官方 Desktop：不要执行 dsh plugin --profile desktop；在桌面应用「插件 → 添加插件」中输入 ${MARKET_DESKTOP_INPUT} 并启用。

安装前只读检查当前宿主实际 profile，发现其他皮肤插件就列出并停下；没有冲突才安装。安装后验证同一 profile 中有 dsh-skin-market 的依赖和 bundle，并告诉我重启哪个宿主、从哪里打开「皮肤市场」。不要替我安装其他皮肤。

仓库：${MARKET_REPOSITORY}`

export function skinPrompt(repository: string, compatibilityVerified = true, installTarget?: string): string {
  const target = installTarget ?? repository
  const compatibilityStep = compatibilityVerified
    ? ''
    : '\n1. 维护者尚未声明可验证的 DSH 兼容范围。先只读检查仓库，确认它兼容当前 DSH Web 版本并核对安装方式；先告诉我结论和风险，等待我确认后再安装，不要直接安装。\n'
  return `请安装这个固定版本的 DSH 皮肤：${repository}
- 固定安装目标：${target}
- Web 固定安装命令：${createInstallCommand(target)}
${compatibilityStep}
先运行 dsh --version，并根据当前宿主和实际 profile 判断是 Web 版还是官方 Desktop；无法判断就先问我。
- Web 版：按下面的冲突检查执行固定安装命令。
- 官方 Desktop：不要执行 dsh plugin --profile desktop；在桌面应用「设置 → 皮肤市场」中打开该皮肤并安装。市场里没有该皮肤时先告诉我，不要修改 profile。

必须先检查冲突再安装：
1. Web 版只读检查 web profile 的 package.json（dependencies 与 dsh.profile.bundles）、profile 的 cordis.patch.yml 和 $DSH_HOME/cordis.patch.yml（如有）。
2. 从当前启用的 bundles 中识别其他皮肤、主题或外观插件；排除 @deepseek-ai/dsh-base、@deepseek-ai/dsh-web-app、dsh-skin-market 和本次目标仓库或 package。读取候选 package.json 的名称、描述、dsh.client/dsh.bundle 声明，必要时再读 README。
3. 发现其他已启用的皮肤插件时，列出它们并停在安装前，提醒我先停用；未经我确认不得修改 profile，也不得执行安装。
4. 没有冲突时，明确说“未检测到其他已启用的皮肤插件”；Web 才执行上面的固定安装命令，官方 Desktop 只在「设置 → 皮肤市场」中安装。
5. 安装后验证对应 profile 的 dependencies、bundle 和目标 package 的 dsh.client/dsh.bundle 声明及 loader 注册项；缺失则报告失败。
6. 告诉我如何重启当前 DSH 宿主。不要替我安装、停用或卸载其他皮肤。`
}

export function skinCommand(installTarget: string): string {
  return [
    '# Web 版',
    createInstallCommand(installTarget),
    '',
    '# 官方桌面版：不要在终端执行；在桌面应用「设置 → 皮肤市场」中打开该皮肤并安装',
  ].join('\n')
}
