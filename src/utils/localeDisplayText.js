import { pinyin } from 'pinyin-pro'
import { ZH_EN_BUSINESS_PHRASES } from '@/lang/zhEnBusinessPhrases'

const SORTED_BUSINESS_PHRASES = [...ZH_EN_BUSINESS_PHRASES].sort(
  (a, b) => b.zh.length - a.zh.length
)

export function hasCJK (str) {
  return /[\u4e00-\u9fff]/.test(String(str || ''))
}

/** 中文 → 紧凑拼音（无调），非中文原样返回 */
export function toPinyinCompact (str) {
  const s = String(str || '').trim()
  if (!s || !hasCJK(s)) return s
  try {
    const out = pinyin(s, { toneType: 'none' })
    return String(out || s)
      .toLowerCase()
      .replace(/\s+/g, '')
  } catch (e) {
    return s
  }
}

export function ellipsisMiddle (str, maxLen = 18) {
  const s = String(str || '')
  if (s.length <= maxLen) return s
  const keep = Math.max(1, maxLen - 3)
  return `${s.slice(0, keep)}...`
}

/**
 * 英文界面：动态中文（租户名等）→ 拼音并截断；中文界面原样
 */
export function displayDynamicZhInEn (name, locale, maxLen = 18) {
  if (locale !== 'en') return name == null ? '' : String(name)
  const s = String(name || '').trim()
  if (!s) return ''
  if (!hasCJK(s)) return ellipsisMiddle(s, maxLen)
  return ellipsisMiddle(toPinyinCompact(s), maxLen)
}

/**
 * 英文界面：先替换业务词典中的中文词组，再对剩余连续汉字做紧凑拼音（用户自定义名等）
 */
export function applyBusinessGlossaryThenPinyinCjk (text, maxLen = 200) {
  let s = String(text == null ? '' : text).trim()
  if (!s) return ''
  for (const { zh, en } of SORTED_BUSINESS_PHRASES) {
    if (!zh || !en) continue
    if (s.includes(zh)) s = s.split(zh).join(en)
  }
  s = s.replace(/\s+/g, ' ').trim()
  if (!hasCJK(s)) return ellipsisMiddle(s, maxLen)
  s = s.replace(/[\u4e00-\u9fff]+/g, (chunk) => toPinyinCompact(chunk))
  return ellipsisMiddle(s, maxLen)
}

/**
 * 中文界面原样；英文界面：词典 + 剩余拼音（用于电价方案名、绑定展示名等）
 */
export function displayBizHybrid (text, locale, maxLen = 48) {
  if (locale !== 'en') return text == null ? '' : String(text)
  const raw = String(text || '').trim()
  if (!raw) return ''
  if (!hasCJK(raw)) return ellipsisMiddle(raw, maxLen)
  return applyBusinessGlossaryThenPinyinCjk(raw, maxLen)
}

/** 顶栏/下拉头像首字：英文界面 CJK 名取拼音首字母，否则取首个字符 */
export function avatarInitial (name, locale) {
  const s = String(name || '').trim()
  if (!s) return '?'
  if (locale !== 'en') return s.charAt(0)
  if (!hasCJK(s)) return s.charAt(0).toUpperCase()
  const py = toPinyinCompact(s)
  if (!py) return '?'
  return String(py).charAt(0).toUpperCase()
}
