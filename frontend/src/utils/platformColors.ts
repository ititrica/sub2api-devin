/**
 * Centralized platform color definitions.
 *
 * All components that need platform-specific styling should import from here
 * instead of defining their own color mappings. The brand-* utility palette
 * preserves vendor identities independently of the neutral site controls. Platforms registered only on
 * the server (see constants/platformCatalog) use the neutral *_DEFAULT styles.
 */

import { getPlatformSpec } from '@/constants/platformCatalog'

export type Platform =
  | 'anthropic'
  | 'openai'
  | 'antigravity'
  | 'gemini'
  | 'grok'
  | 'kimi'
  | 'zhipu'
  | 'deepseek'
  | 'minimax'
  | 'opencode_go'
  | 'typesafe'
  | 'command_code'
  | 'cline'
  | 'composite'

// ── Badge (bg + text + border, for inline badges with border) ───────
const BADGE: Record<Platform, string> = {
  anthropic: 'bg-brand-orange-500/10 text-brand-orange-600 border-brand-orange-500/30 dark:text-brand-orange-400',
  openai: 'bg-brand-green-500/10 text-brand-green-600 border-brand-green-500/30 dark:text-brand-green-400',
  antigravity: 'bg-brand-purple-500/10 text-brand-purple-600 border-brand-purple-500/30 dark:text-brand-purple-400',
  gemini: 'bg-brand-blue-500/10 text-brand-blue-600 border-brand-blue-500/30 dark:text-brand-blue-400',
  grok: 'bg-brand-zinc-800/10 text-brand-zinc-800 border-brand-zinc-800/30 dark:bg-brand-zinc-500/10 dark:text-brand-zinc-200 dark:border-brand-zinc-500/30',
  kimi: 'bg-brand-pink-500/10 text-brand-pink-600 border-brand-pink-500/30 dark:text-brand-pink-400',
  zhipu: 'bg-brand-indigo-500/10 text-brand-indigo-600 border-brand-indigo-500/30 dark:text-brand-indigo-400',
  deepseek: 'bg-brand-teal-500/10 text-brand-teal-600 border-brand-teal-500/30 dark:text-brand-teal-400',
  minimax: 'bg-brand-rose-500/10 text-brand-rose-600 border-brand-rose-500/30 dark:text-brand-rose-400',
  opencode_go: 'bg-brand-amber-500/10 text-brand-amber-700 border-brand-amber-500/30 dark:text-brand-amber-300',
  typesafe: 'bg-brand-sky-500/10 text-brand-sky-700 border-brand-sky-500/30 dark:text-brand-sky-300',
  command_code: 'bg-brand-neutral-500/10 text-brand-neutral-700 border-brand-neutral-500/30 dark:text-brand-neutral-300',
  cline: 'bg-brand-violet-500/10 text-brand-violet-600 border-brand-violet-500/30 dark:text-brand-violet-400',
  composite: 'bg-brand-cyan-500/10 text-brand-cyan-700 border-brand-cyan-500/30 dark:text-brand-cyan-300',
}
const BADGE_DEFAULT = 'bg-brand-slate-500/10 text-brand-slate-600 border-brand-slate-500/30 dark:text-brand-slate-400'

// ── Light badge (softer bg, no border) ──────────────────────────────
const BADGE_LIGHT: Record<Platform, string> = {
  anthropic: 'bg-brand-orange-500/10 text-brand-orange-600 dark:bg-brand-orange-500/10 dark:text-brand-orange-300',
  openai: 'bg-brand-green-500/10 text-brand-green-600 dark:bg-brand-green-500/10 dark:text-brand-green-300',
  antigravity: 'bg-brand-purple-500/10 text-brand-purple-600 dark:bg-brand-purple-500/10 dark:text-brand-purple-300',
  gemini: 'bg-brand-blue-500/10 text-brand-blue-600 dark:bg-brand-blue-500/10 dark:text-brand-blue-300',
  grok: 'bg-brand-zinc-800/10 text-brand-zinc-800 dark:bg-brand-zinc-500/10 dark:text-brand-zinc-200',
  kimi: 'bg-brand-pink-500/10 text-brand-pink-600 dark:bg-brand-pink-500/10 dark:text-brand-pink-300',
  zhipu: 'bg-brand-indigo-500/10 text-brand-indigo-600 dark:bg-brand-indigo-500/10 dark:text-brand-indigo-300',
  deepseek: 'bg-brand-teal-500/10 text-brand-teal-600 dark:bg-brand-teal-500/10 dark:text-brand-teal-300',
  minimax: 'bg-brand-rose-500/10 text-brand-rose-600 dark:bg-brand-rose-500/10 dark:text-brand-rose-300',
  opencode_go: 'bg-brand-amber-500/10 text-brand-amber-700 dark:bg-brand-amber-500/10 dark:text-brand-amber-300',
  typesafe: 'bg-brand-sky-500/10 text-brand-sky-700 dark:bg-brand-sky-500/10 dark:text-brand-sky-300',
  command_code: 'bg-brand-neutral-500/10 text-brand-neutral-700 dark:bg-brand-neutral-500/10 dark:text-brand-neutral-300',
  cline: 'bg-brand-violet-500/10 text-brand-violet-600 dark:bg-brand-violet-500/10 dark:text-brand-violet-300',
  composite: 'bg-brand-cyan-500/10 text-brand-cyan-700 dark:bg-brand-cyan-500/10 dark:text-brand-cyan-300',
}

// ── Border ──────────────────────────────────────────────────────────
const BORDER: Record<Platform, string> = {
  anthropic: 'border-brand-orange-500/20 dark:border-brand-orange-500/20',
  openai: 'border-brand-green-500/20 dark:border-brand-green-500/20',
  antigravity: 'border-brand-purple-500/20 dark:border-brand-purple-500/20',
  gemini: 'border-brand-blue-500/20 dark:border-brand-blue-500/20',
  grok: 'border-brand-zinc-800/20 dark:border-brand-zinc-500/20',
  kimi: 'border-brand-pink-500/20 dark:border-brand-pink-500/20',
  zhipu: 'border-brand-indigo-500/20 dark:border-brand-indigo-500/20',
  deepseek: 'border-brand-teal-500/20 dark:border-brand-teal-500/20',
  minimax: 'border-brand-rose-500/20 dark:border-brand-rose-500/20',
  opencode_go: 'border-brand-amber-500/20 dark:border-brand-amber-500/20',
  typesafe: 'border-brand-sky-500/20 dark:border-brand-sky-500/20',
  command_code: 'border-brand-neutral-500/20 dark:border-brand-neutral-500/20',
  cline: 'border-brand-violet-500/20 dark:border-brand-violet-500/20',
  composite: 'border-brand-cyan-500/20 dark:border-brand-cyan-500/20',
}
const BORDER_DEFAULT = 'border-gray-200 dark:border-dark-700'

// ── Border strong (higher-contrast platform tint, e.g. plaza group cards) ──
const BORDER_STRONG: Record<Platform, string> = {
  anthropic: 'border-brand-orange-500/35 dark:border-brand-orange-500/30',
  openai: 'border-brand-green-500/35 dark:border-brand-green-500/30',
  antigravity: 'border-brand-purple-500/35 dark:border-brand-purple-500/30',
  gemini: 'border-brand-blue-500/35 dark:border-brand-blue-500/30',
  grok: 'border-brand-zinc-800/35 dark:border-brand-zinc-500/35',
  kimi: 'border-brand-pink-500/35 dark:border-brand-pink-500/30',
  zhipu: 'border-brand-indigo-500/35 dark:border-brand-indigo-500/30',
  deepseek: 'border-brand-teal-500/35 dark:border-brand-teal-500/30',
  minimax: 'border-brand-rose-500/35 dark:border-brand-rose-500/30',
  opencode_go: 'border-brand-amber-500/35 dark:border-brand-amber-500/30',
  typesafe: 'border-brand-sky-500/35 dark:border-brand-sky-500/30',
  command_code: 'border-brand-neutral-500/35 dark:border-brand-neutral-500/30',
  cline: 'border-brand-violet-500/35 dark:border-brand-violet-500/30',
  composite: 'border-brand-cyan-500/35 dark:border-brand-cyan-500/30',
}
const BORDER_STRONG_DEFAULT = 'border-gray-300 dark:border-dark-600'

// ── Accent (single raw color per platform; consumers derive washes/tints
//    from it via CSS color-mix, e.g. plaza paid-price zone) ──
const ACCENT: Record<Platform, string> = {
  anthropic: '#f97316', // orange-500
  openai: '#22c55e', // green-500
  antigravity: '#a855f7', // purple-500
  gemini: '#3b82f6', // blue-500
  grok: '#71717a', // zinc-500
  kimi: '#ec4899', // pink-500
  zhipu: '#6366f1', // indigo-500
  deepseek: '#14b8a6', // teal-500
  minimax: '#f43f5e', // rose-500
  opencode_go: '#f59e0b', // amber-500
  typesafe: '#0ea5e9', // sky-500
  command_code: '#737373', // neutral-500
  cline: '#8b5cf6', // violet-500（Cline 品牌紫 #9F58FA）
  composite: '#06b6d4', // cyan-500
}
const ACCENT_DEFAULT = '#14b8a6' // primary-500 (teal)

// ── Accent bar (solid brand fill) ───────────────────────────────────────────
const ACCENT_BAR: Record<Platform, string> = {
  anthropic: 'bg-brand-orange-500',
  openai: 'bg-brand-emerald-500',
  antigravity: 'bg-brand-purple-500',
  gemini: 'bg-brand-blue-500',
  grok: 'bg-brand-zinc-900',
  kimi: 'bg-brand-pink-500',
  zhipu: 'bg-brand-indigo-500',
  deepseek: 'bg-brand-teal-500',
  minimax: 'bg-brand-rose-500',
  opencode_go: 'bg-brand-amber-500',
  typesafe: 'bg-brand-sky-500',
  command_code: 'bg-brand-neutral-500',
  cline: 'bg-brand-violet-500',
  composite: 'bg-brand-cyan-500',
}
const ACCENT_BAR_DEFAULT = 'bg-gradient-to-r from-primary-400 to-primary-500'

// ── Text (price, icon) ─────────────────────────────────────────────
const TEXT: Record<Platform, string> = {
  anthropic: 'text-brand-orange-600 dark:text-brand-orange-400',
  openai: 'text-brand-emerald-600 dark:text-brand-emerald-400',
  antigravity: 'text-brand-purple-600 dark:text-brand-purple-400',
  gemini: 'text-brand-blue-600 dark:text-brand-blue-400',
  grok: 'text-brand-zinc-800 dark:text-brand-zinc-200',
  kimi: 'text-brand-pink-600 dark:text-brand-pink-400',
  zhipu: 'text-brand-indigo-600 dark:text-brand-indigo-400',
  deepseek: 'text-brand-teal-600 dark:text-brand-teal-400',
  minimax: 'text-brand-rose-600 dark:text-brand-rose-400',
  opencode_go: 'text-brand-amber-700 dark:text-brand-amber-300',
  typesafe: 'text-brand-sky-700 dark:text-brand-sky-300',
  command_code: 'text-brand-neutral-700 dark:text-brand-neutral-300',
  cline: 'text-brand-violet-600 dark:text-brand-violet-400',
  composite: 'text-brand-cyan-700 dark:text-brand-cyan-300',
}
const TEXT_DEFAULT = 'text-primary-600 dark:text-primary-400'

// ── Icon (check mark etc.) ──────────────────────────────────────────
const ICON: Record<Platform, string> = {
  anthropic: 'text-brand-orange-500 dark:text-brand-orange-400',
  openai: 'text-brand-emerald-500 dark:text-brand-emerald-400',
  antigravity: 'text-brand-purple-500 dark:text-brand-purple-400',
  gemini: 'text-brand-blue-500 dark:text-brand-blue-400',
  grok: 'text-brand-zinc-800 dark:text-brand-zinc-200',
  kimi: 'text-brand-pink-500 dark:text-brand-pink-400',
  zhipu: 'text-brand-indigo-500 dark:text-brand-indigo-400',
  deepseek: 'text-brand-teal-500 dark:text-brand-teal-400',
  minimax: 'text-brand-rose-500 dark:text-brand-rose-400',
  opencode_go: 'text-brand-amber-500 dark:text-brand-amber-300',
  typesafe: 'text-brand-sky-500 dark:text-brand-sky-300',
  command_code: 'text-brand-neutral-500 dark:text-brand-neutral-300',
  cline: 'text-brand-violet-500 dark:text-brand-violet-400',
  composite: 'text-brand-cyan-600 dark:text-brand-cyan-300',
}
const ICON_DEFAULT = 'text-primary-500 dark:text-primary-400'

// ── Button (solid bg) ───────────────────────────────────────────────
const BUTTON: Record<Platform, string> = {
  anthropic: 'bg-brand-orange-500 text-white hover:bg-brand-orange-600 active:bg-brand-orange-700 dark:bg-brand-orange-500/80 dark:hover:bg-brand-orange-500',
  openai: 'bg-brand-green-600 text-white hover:bg-brand-green-700 active:bg-brand-green-800 dark:bg-brand-green-600/80 dark:hover:bg-brand-green-600',
  antigravity: 'bg-brand-purple-500 text-white hover:bg-brand-purple-600 active:bg-brand-purple-700 dark:bg-brand-purple-500/80 dark:hover:bg-brand-purple-500',
  gemini: 'bg-brand-blue-500 text-white hover:bg-brand-blue-600 active:bg-brand-blue-700 dark:bg-brand-blue-500/80 dark:hover:bg-brand-blue-500',
  grok: 'bg-brand-zinc-800 text-white hover:bg-brand-zinc-900 active:bg-black dark:bg-brand-zinc-700 dark:hover:bg-brand-zinc-600',
  kimi: 'bg-brand-pink-500 text-white hover:bg-brand-pink-600 active:bg-brand-pink-700 dark:bg-brand-pink-500/80 dark:hover:bg-brand-pink-500',
  zhipu: 'bg-brand-indigo-500 text-white hover:bg-brand-indigo-600 active:bg-brand-indigo-700 dark:bg-brand-indigo-500/80 dark:hover:bg-brand-indigo-500',
  deepseek: 'bg-brand-teal-500 text-white hover:bg-brand-teal-600 active:bg-brand-teal-700 dark:bg-brand-teal-500/80 dark:hover:bg-brand-teal-500',
  minimax: 'bg-brand-rose-500 text-white hover:bg-brand-rose-600 active:bg-brand-rose-700 dark:bg-brand-rose-500/80 dark:hover:bg-brand-rose-500',
  opencode_go: 'bg-brand-amber-500 text-white hover:bg-brand-amber-600 active:bg-brand-amber-700 dark:bg-brand-amber-500/80 dark:hover:bg-brand-amber-500',
  typesafe: 'bg-brand-sky-600 text-white hover:bg-brand-sky-700 active:bg-brand-sky-800 dark:bg-brand-sky-600/80 dark:hover:bg-brand-sky-600',
  command_code: 'bg-brand-neutral-500 text-white hover:bg-brand-neutral-600 active:bg-brand-neutral-700 dark:bg-brand-neutral-500/80 dark:hover:bg-brand-neutral-500',
  cline: 'bg-brand-violet-500 text-white hover:bg-brand-violet-600 active:bg-brand-violet-700 dark:bg-brand-violet-500/80 dark:hover:bg-brand-violet-500',
  composite: 'bg-brand-cyan-700 text-white hover:bg-brand-cyan-800 active:bg-brand-cyan-900 dark:bg-brand-cyan-600 dark:hover:bg-brand-cyan-500',
}
const BUTTON_DEFAULT = 'bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500'

// ── Discount badge ──────────────────────────────────────────────────
const DISCOUNT: Record<Platform, string> = {
  anthropic: 'bg-brand-orange-100 text-brand-orange-700 dark:bg-brand-orange-900/40 dark:text-brand-orange-300',
  openai: 'bg-brand-emerald-100 text-brand-emerald-700 dark:bg-brand-emerald-900/40 dark:text-brand-emerald-300',
  antigravity: 'bg-brand-purple-100 text-brand-purple-700 dark:bg-brand-purple-900/40 dark:text-brand-purple-300',
  gemini: 'bg-brand-blue-100 text-brand-blue-700 dark:bg-brand-blue-900/40 dark:text-brand-blue-300',
  grok: 'bg-brand-zinc-100 text-brand-zinc-800 dark:bg-brand-zinc-800 dark:text-brand-zinc-200',
  kimi: 'bg-brand-pink-100 text-brand-pink-700 dark:bg-brand-pink-900/40 dark:text-brand-pink-300',
  zhipu: 'bg-brand-indigo-100 text-brand-indigo-700 dark:bg-brand-indigo-900/40 dark:text-brand-indigo-300',
  deepseek: 'bg-brand-teal-100 text-brand-teal-700 dark:bg-brand-teal-900/40 dark:text-brand-teal-300',
  minimax: 'bg-brand-rose-100 text-brand-rose-700 dark:bg-brand-rose-900/40 dark:text-brand-rose-300',
  opencode_go: 'bg-brand-amber-100 text-brand-amber-800 dark:bg-brand-amber-900/40 dark:text-brand-amber-300',
  typesafe: 'bg-brand-sky-100 text-brand-sky-800 dark:bg-brand-sky-900/40 dark:text-brand-sky-300',
  command_code: 'bg-brand-neutral-100 text-brand-neutral-800 dark:bg-brand-neutral-900/40 dark:text-brand-neutral-300',
  cline: 'bg-brand-violet-100 text-brand-violet-700 dark:bg-brand-violet-900/40 dark:text-brand-violet-300',
  composite: 'bg-brand-cyan-100 text-brand-cyan-800 dark:bg-brand-cyan-900/40 dark:text-brand-cyan-300',
}
const DISCOUNT_DEFAULT = 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'

// ── Header gradient (subscription confirm) ─────────────────────────
const GRADIENT: Record<Platform, string> = {
  anthropic: 'from-brand-orange-500 to-brand-orange-600',
  openai: 'from-brand-emerald-500 to-brand-emerald-600',
  antigravity: 'from-brand-purple-500 to-brand-purple-600',
  gemini: 'from-brand-blue-500 to-brand-blue-600',
  grok: 'from-brand-zinc-700 to-brand-zinc-900',
  kimi: 'from-brand-pink-500 to-brand-pink-600',
  zhipu: 'from-brand-indigo-500 to-brand-indigo-600',
  deepseek: 'from-brand-teal-500 to-brand-teal-600',
  minimax: 'from-brand-rose-500 to-brand-rose-600',
  opencode_go: 'from-brand-amber-500 to-brand-amber-600',
  typesafe: 'from-brand-sky-500 to-brand-sky-600',
  command_code: 'from-brand-neutral-500 to-brand-neutral-600',
  cline: 'from-brand-violet-500 to-brand-violet-600',
  composite: 'from-brand-slate-600 to-brand-cyan-600',
}
const GRADIENT_DEFAULT = 'from-primary-500 to-primary-600'

// ── Header text (light text on gradient bg) ────────────────────────
const GRADIENT_TEXT: Record<Platform, string> = {
  anthropic: 'text-brand-orange-100',
  openai: 'text-brand-emerald-100',
  antigravity: 'text-brand-purple-100',
  gemini: 'text-brand-blue-100',
  grok: 'text-brand-zinc-100',
  kimi: 'text-brand-pink-100',
  zhipu: 'text-brand-indigo-100',
  deepseek: 'text-brand-teal-100',
  minimax: 'text-brand-rose-100',
  opencode_go: 'text-brand-amber-100',
  typesafe: 'text-brand-sky-100',
  command_code: 'text-brand-neutral-100',
  cline: 'text-brand-violet-100',
  composite: 'text-brand-cyan-100',
}
const GRADIENT_TEXT_DEFAULT = 'text-primary-100'

const GRADIENT_SUBTEXT: Record<Platform, string> = {
  anthropic: 'text-brand-orange-200',
  openai: 'text-brand-emerald-200',
  antigravity: 'text-brand-purple-200',
  gemini: 'text-brand-blue-200',
  grok: 'text-brand-zinc-300',
  kimi: 'text-brand-pink-200',
  zhipu: 'text-brand-indigo-200',
  deepseek: 'text-brand-teal-200',
  minimax: 'text-brand-rose-200',
  opencode_go: 'text-brand-amber-200',
  typesafe: 'text-brand-sky-200',
  command_code: 'text-brand-neutral-200',
  cline: 'text-brand-violet-200',
  composite: 'text-brand-cyan-200',
}
const GRADIENT_SUBTEXT_DEFAULT = 'text-primary-200'

// ── Public API ──────────────────────────────────────────────────────

function isPlatform(p: string): p is Platform {
  return (
    p === 'anthropic' ||
    p === 'openai' ||
    p === 'antigravity' ||
    p === 'gemini' ||
    p === 'grok' ||
    p === 'kimi' ||
    p === 'zhipu' ||
    p === 'deepseek' ||
    p === 'minimax' ||
    p === 'opencode_go' ||
    p === 'typesafe' ||
    p === 'command_code' ||
    p === 'cline' ||
    p === 'composite'
  )
}

export function platformBadgeClass(p: string): string {
  return isPlatform(p) ? BADGE[p] : BADGE_DEFAULT
}

export function platformBadgeLightClass(p: string): string {
  return isPlatform(p) ? BADGE_LIGHT[p] : BADGE_DEFAULT
}

export function platformBorderClass(p: string): string {
  return isPlatform(p) ? BORDER[p] : BORDER_DEFAULT
}

export function platformBorderStrongClass(p: string): string {
  return isPlatform(p) ? BORDER_STRONG[p] : BORDER_STRONG_DEFAULT
}

export function platformAccentColor(p: string): string {
  return isPlatform(p) ? ACCENT[p] : ACCENT_DEFAULT
}

export function platformAccentBarClass(p: string): string {
  return isPlatform(p) ? ACCENT_BAR[p] : ACCENT_BAR_DEFAULT
}

export function platformTextClass(p: string): string {
  return isPlatform(p) ? TEXT[p] : TEXT_DEFAULT
}

export function platformIconClass(p: string): string {
  return isPlatform(p) ? ICON[p] : ICON_DEFAULT
}

export function platformButtonClass(p: string): string {
  return isPlatform(p) ? BUTTON[p] : BUTTON_DEFAULT
}

export function platformDiscountClass(p: string): string {
  return isPlatform(p) ? DISCOUNT[p] : DISCOUNT_DEFAULT
}

export function platformGradientClass(p: string): string {
  return isPlatform(p) ? GRADIENT[p] : GRADIENT_DEFAULT
}

export function platformGradientTextClass(p: string): string {
  return isPlatform(p) ? GRADIENT_TEXT[p] : GRADIENT_TEXT_DEFAULT
}

export function platformGradientSubtextClass(p: string): string {
  return isPlatform(p) ? GRADIENT_SUBTEXT[p] : GRADIENT_SUBTEXT_DEFAULT
}

/** 平台展示名：来自平台清单（后端 domain/platforms.go），新登记的平台同样适用。 */
export function platformLabel(p: string): string {
  if (p === 'composite') return 'Composite'
  return getPlatformSpec(p)?.display_name ?? (p || 'API')
}
