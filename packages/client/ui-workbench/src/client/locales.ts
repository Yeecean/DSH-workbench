/** Localized Workbench UI dictionaries for all shipped Harness languages. */

import { p2En, p2Zh } from './locales/p2.ts'

/** Translation namespace used by all Workbench UI components. */
export const WORKBENCH_LOCALE_NS = 'workbench' as const

/** English Workbench locale dictionary (baseline key set). */
export const en = {
  'mode.switcher.ariaLabel': 'Workbench mode switcher',
  'mode.work': 'Work',
  'mode.code': 'Code',
  'preset.focus': 'Focus',
  'preset.build': 'Build',
  'preset.review': 'Review',
  'preset.debug': 'Debug',
  'inspector.toggle': 'Inspector',
  'inspector.title.work': 'Work Inspector',
  'inspector.title.code': 'Code Overview',
  'inspector.close': 'Close inspector',
  'inspector.section.mode': 'Workspace Mode',
  'inspector.section.session': 'Active Session',
  'inspector.section.workspace': 'Workspace & Surfaces',
  'inspector.session.emptyTitle': 'Ready for a new task',
  'inspector.session.emptyBody': 'Compose a prompt to start a session, or switch to Code mode to inspect files and run commands.',
  'inspector.session.status.idle': 'Idle',
  'inspector.session.status.running': 'Running',
  'inspector.session.status.waiting': 'Waiting',
  'inspector.session.idLabel': 'Session ID',
  'inspector.workspace.none': 'No workspace directory selected',
  'inspector.action.openFiles': 'Workspace Files',
  'inspector.action.openTerminal': 'Terminal',
  'inspector.action.openBrowser': 'Browser Preview',
  'inspector.action.openSettings': 'Workbench Appearance & Theme',
  'inspector.hint.files': 'Files',
  'inspector.hint.terminal': 'Terminal',
  'inspector.hint.browser': 'Browser',
  'inspector.hint.theme': 'Theme',
  'inspector.switchToCode': 'Switch to Code',
  'inspector.switchToWork': 'Switch to Work',
  'inspector.workspace.readOnlyNote': 'File previews & diff views are read-only via Host workspace access; edit via session tools or native editor.',
  'settings.group.title': 'Workbench & Liquid Glass',
  'settings.group.desc': 'Configure default Work/Code startup mode, accent material, reduced transparency, motion, and persisted JSON themes.',
  'settings.defaultMode.title': 'Default Startup Mode',
  'settings.defaultMode.desc': 'Choose whether new windows open in Work or Code layout. Switching modes preserves your active session.',
  'settings.accent.title': 'Accent Material',
  'settings.accent.desc': 'Select an Apple-inspired accent palette or apply a validated Custom JSON theme layer.',
  'settings.accent.blue': 'Blue',
  'settings.accent.graphite': 'Graphite',
  'settings.accent.amber': 'Amber',
  'settings.accent.custom': 'Custom',
  'settings.reducedTransparency.title': 'Reduce Transparency',
  'settings.reducedTransparency.desc': 'Replace translucent Liquid Glass blur with solid high-contrast chrome surfaces.',
  'settings.reducedMotion.title': 'Reduce Motion',
  'settings.reducedMotion.desc': 'Minimize spring and opacity transitions across Workbench headers and panels.',
  'settings.customTheme.title': 'Custom Theme JSON',
  'settings.customTheme.desc': 'Import, validate, and persist a constrained token override JSON across launches.',
  'settings.customTheme.toggleOpen': 'Edit JSON',
  'settings.customTheme.toggleClose': 'Hide JSON',
  'settings.customTheme.apply': 'Validate & Apply',
  'settings.customTheme.sample': 'Load Sample',
  'settings.customTheme.export': 'Export Active',
  'settings.customTheme.reset': 'Reset',
  'settings.customTheme.statusApplied': 'Custom theme applied and persisted: {name}',
  'settings.customTheme.statusReset': 'Custom theme cleared.',
  'settings.customTheme.error.empty': 'Theme JSON cannot be empty.',
  'settings.customTheme.error.tooLarge': 'Theme JSON exceeds the 32 KB limit.',
  'settings.customTheme.error.invalidJson': 'Syntax error: enter valid JSON.',
  'settings.customTheme.error.notObject': 'Top-level theme JSON must be an object.',
  'settings.customTheme.error.invalidName': 'Theme name must be a non-empty string under 64 characters.',
  'settings.customTheme.error.invalidAppearance': 'Appearance must be "light", "dark", or "both".',
  'settings.customTheme.error.missingTokens': 'Theme JSON must include a "tokens" object.',
  'settings.customTheme.error.emptyTokens': 'The "tokens" object must define at least one supported key.',
  'settings.customTheme.error.unsupportedToken': 'Unsupported theme token: {token}',
  'settings.customTheme.error.invalidTokenValue': 'Invalid CSS value for token "{token}". Use hex, rgb/rgba, hsl/hsla, oklch, color-mix, or px.',
  ...p2En,
} as const

/** Union of valid translation keys in the `workbench` namespace. */
export type WorkbenchKey = keyof typeof en

/** Simplified Chinese Workbench locale dictionary. */
export const zh: Record<WorkbenchKey, string> = {
  'mode.switcher.ariaLabel': '工作台模式切换',
  'mode.work': 'Work',
  'mode.code': 'Code',
  'preset.focus': 'Focus',
  'preset.build': 'Build',
  'preset.review': 'Review',
  'preset.debug': 'Debug',
  'inspector.toggle': '检查器',
  'inspector.title.work': '任务检查器',
  'inspector.title.code': '代码概览',
  'inspector.close': '关闭检查器',
  'inspector.section.mode': '工作台模式',
  'inspector.section.session': '当前会话',
  'inspector.section.workspace': '工作区与原生面板',
  'inspector.session.emptyTitle': '准备开始新任务',
  'inspector.session.emptyBody': '输入目标即可启动新任务，或切换至 Code 模式浏览文件与运行终端。',
  'inspector.session.status.idle': '空闲',
  'inspector.session.status.running': '运行中',
  'inspector.session.status.waiting': '等待确认',
  'inspector.session.idLabel': '会话 ID',
  'inspector.workspace.none': '尚未选择工作区目录',
  'inspector.action.openFiles': '工作区文件',
  'inspector.action.openTerminal': '打开终端',
  'inspector.action.openBrowser': '浏览器预览',
  'inspector.action.openSettings': '外观与主题设置',
  'inspector.hint.files': '文件',
  'inspector.hint.terminal': '终端',
  'inspector.hint.browser': '浏览器',
  'inspector.hint.theme': '主题',
  'inspector.switchToCode': '切换到 Code',
  'inspector.switchToWork': '切换到 Work',
  'inspector.workspace.readOnlyNote': '工作区文件预览与 Diff 审阅保持只读；修改通过会话工具或外部编辑器执行。',
  'settings.group.title': '工作台与 Liquid Glass 外观',
  'settings.group.desc': '配置默认 Work/Code 启动模式、强调色材质、降低透明度、减弱动态效果及持久化自定义 JSON 主题。',
  'settings.defaultMode.title': '默认启动模式',
  'settings.defaultMode.desc': '选择启动时默认进入 Work 或 Code 布局；切换模式不会丢失当前会话。',
  'settings.accent.title': '强调色材质',
  'settings.accent.desc': '选择预设强调色，或启用经严格校验的自定义 JSON 主题层。',
  'settings.accent.blue': '海蓝',
  'settings.accent.graphite': '石墨',
  'settings.accent.amber': '琥珀',
  'settings.accent.custom': '自定义',
  'settings.reducedTransparency.title': '降低透明度',
  'settings.reducedTransparency.desc': '关闭液态玻璃模糊效果，使用实色高对比度界面表面。',
  'settings.reducedMotion.title': '减弱动态效果',
  'settings.reducedMotion.desc': '减少顶栏、检查器与浮层的弹性过渡动画。',
  'settings.customTheme.title': '自定义主题 JSON',
  'settings.customTheme.desc': '严格校验并持久化导入的主题 token 配置，重启桌面端后自动恢复。',
  'settings.customTheme.toggleOpen': '编辑 JSON',
  'settings.customTheme.toggleClose': '收起 JSON',
  'settings.customTheme.apply': '校验并应用',
  'settings.customTheme.sample': '加载示例',
  'settings.customTheme.export': '导出当前配置',
  'settings.customTheme.reset': '恢复默认',
  'settings.customTheme.statusApplied': '已校验并持久化应用主题：{name}',
  'settings.customTheme.statusReset': '已清除自定义主题。',
  'settings.customTheme.error.empty': '主题 JSON 不能为空。',
  'settings.customTheme.error.tooLarge': '主题 JSON 大小不能超过 32 KB。',
  'settings.customTheme.error.invalidJson': 'JSON 语法错误，请检查引号或逗号。',
  'settings.customTheme.error.notObject': '主题 JSON 顶层必须是对象。',
  'settings.customTheme.error.invalidName': '主题名称必须为 1–64 个字符的非空字符串。',
  'settings.customTheme.error.invalidAppearance': 'appearance 字段仅支持 "light"、"dark" 或 "both"。',
  'settings.customTheme.error.missingTokens': '主题 JSON 必须包含 "tokens" 对象。',
  'settings.customTheme.error.emptyTokens': '"tokens" 至少需要包含一个受支持的 token 键。',
  'settings.customTheme.error.unsupportedToken': '不支持的主题 token：{token}',
  'settings.customTheme.error.invalidTokenValue': 'token "{token}" 的 CSS 取值无效，仅允许安全颜色或 px 长度。',
  ...p2Zh,
}

/** Japanese Workbench locale fallback dictionary. */
export const ja: Record<WorkbenchKey, string> = {
  ...en,
  'mode.switcher.ariaLabel': 'ワークベンチモード切替',
  'inspector.toggle': 'インスペクタ',
  'inspector.title.work': 'ワークインスペクタ',
  'inspector.title.code': 'コード概要',
  'inspector.close': 'インスペクタを閉じる',
  'settings.group.title': 'ワークベンチと Liquid Glass',
}

/** Spanish Workbench locale fallback dictionary. */
export const es: Record<WorkbenchKey, string> = {
  ...en,
  'mode.switcher.ariaLabel': 'Selector de modo Workbench',
  'inspector.toggle': 'Inspector',
  'settings.group.title': 'Workbench y Liquid Glass',
}

/** French Workbench locale fallback dictionary. */
export const fr: Record<WorkbenchKey, string> = {
  ...en,
  'mode.switcher.ariaLabel': 'Sélecteur de mode Workbench',
  'inspector.toggle': 'Inspecteur',
  'settings.group.title': 'Workbench et Liquid Glass',
}

/** German Workbench locale fallback dictionary. */
export const de: Record<WorkbenchKey, string> = {
  ...en,
  'mode.switcher.ariaLabel': 'Workbench-Moduswechsel',
  'inspector.toggle': 'Inspektor',
  'settings.group.title': 'Workbench und Liquid Glass',
}

/** Russian Workbench locale fallback dictionary. */
export const ru: Record<WorkbenchKey, string> = {
  ...en,
  'mode.switcher.ariaLabel': 'Переключатель режима Workbench',
  'inspector.toggle': 'Инспектор',
  'settings.group.title': 'Workbench и Liquid Glass',
}

/** Portuguese Workbench locale fallback dictionary. */
export const pt: Record<WorkbenchKey, string> = {
  ...en,
  'mode.switcher.ariaLabel': 'Seletor de modo Workbench',
  'inspector.toggle': 'Inspetor',
  'settings.group.title': 'Workbench e Liquid Glass',
}
