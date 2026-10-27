// 定时自动任务的纯计算逻辑：周期类型、下次执行时间、规则描述与倒计时。
// 与后端 RecurringTasks 的时间口径一致：一律北京时间（UTC+8，无夏令时）。
// 本模块不发起请求、不读写存储，页面状态由视图维护（当前为内存演示数据）。

const BEIJING_OFFSET_MS = 8 * 3600 * 1000

function pad(n) {
  return String(n).padStart(2, '0')
}

function bjParts(date) {
  const t = new Date(date.getTime() + BEIJING_OFFSET_MS)
  return {
    y: t.getUTCFullYear(),
    m: t.getUTCMonth() + 1,
    d: t.getUTCDate(),
    hh: t.getUTCHours(),
    mm: t.getUTCMinutes(),
    weekday: t.getUTCDay(),
  }
}

function bjDate(y, m, d, hh = 0, mm = 0) {
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - BEIJING_OFFSET_MS)
}

export const WEEKDAYS = Object.freeze(['周日', '周一', '周二', '周三', '周四', '周五', '周六'])

export const SCHEDULE_KINDS = Object.freeze([
  { kind: 'daily', label: '每天' },
  { kind: 'weekly', label: '每周' },
  { kind: 'monthly-day', label: '每月某日' },
  { kind: 'monthly-two', label: '每月两期' },
])

export const PRIORITIES = Object.freeze(['P0', 'P1', 'P2', 'P3'])

export function scheduleKindLabel(kind) {
  return SCHEDULE_KINDS.find((k) => k.kind === kind)?.label ?? '每天'
}

export function fmtDateTime(date) {
  const p = bjParts(date)
  return `${p.y}-${pad(p.m)}-${pad(p.d)} ${pad(p.hh)}:${pad(p.mm)}`
}

function matchesDay(schedule, p) {
  switch (schedule.kind) {
    case 'daily':
      return true
    case 'weekly':
      return Array.isArray(schedule.weekdays) && schedule.weekdays.includes(p.weekday)
    case 'monthly-day':
      return p.d === schedule.day
    case 'monthly-two':
      return p.d === 1 || p.d === 15
    default:
      return false
  }
}

function timeParts(time) {
  const [hh, mm] = String(time || '10:00').split(':').map(Number)
  return { hh: hh || 0, mm: mm || 0 }
}

// 从 from（不含）起向后 370 天内的第一次触发时间；找不到返回 null。
export function nextRun(schedule, from) {
  const { hh, mm } = timeParts(schedule.time)
  const start = bjParts(from)
  for (let i = 0; i <= 370; i += 1) {
    const p = bjParts(new Date(Date.UTC(start.y, start.m - 1, start.d + i) - BEIJING_OFFSET_MS))
    if (!matchesDay(schedule, p)) continue
    const candidate = bjDate(p.y, p.m, p.d, hh, mm)
    if (candidate.getTime() > from.getTime()) return candidate
  }
  return null
}

export function describeSchedule(schedule) {
  const time = schedule.time || '10:00'
  switch (schedule.kind) {
    case 'daily':
      return `每天 ${time}`
    case 'weekly': {
      const days = (schedule.weekdays || [])
        .slice()
        .sort()
        .map((w) => WEEKDAYS[w] ?? '')
        .filter(Boolean)
        .join('、')
      return `每周 ${days || '—'} ${time}`
    }
    case 'monthly-day':
      return `每月 ${schedule.day} 日 ${time}`
    case 'monthly-two':
      return `每月 1 日 / 15 日 ${time}`
    default:
      return '—'
  }
}

export function formatCountdown(target, now) {
  let ms = target.getTime() - now.getTime()
  if (ms <= 0) return '已到期'
  const d = Math.floor(ms / (24 * 3600 * 1000))
  ms -= d * 24 * 3600 * 1000
  const h = Math.floor(ms / (3600 * 1000))
  ms -= h * 3600 * 1000
  const min = Math.floor(ms / (60 * 1000))
  const s = Math.floor((ms - min * 60 * 1000) / 1000)
  if (d > 0) return `${d} 天 ${h} 小时`
  if (h > 0) return `${h} 小时 ${min} 分`
  if (min > 0) return `${min} 分 ${pad(s)} 秒`
  return `${s} 秒`
}

export function validateSchedule(schedule) {
  if (!schedule || !SCHEDULE_KINDS.some((k) => k.kind === schedule.kind)) return false
  if (!/^\d{1,2}:\d{2}$/.test(schedule.time || '')) return false
  const { hh, mm } = timeParts(schedule.time)
  if (hh > 23 || mm > 59) return false
  if (schedule.kind === 'weekly')
    return Array.isArray(schedule.weekdays) && schedule.weekdays.length > 0 && schedule.weekdays.every((w) => w >= 0 && w <= 6)
  if (schedule.kind === 'monthly-day') return Number.isInteger(schedule.day) && schedule.day >= 1 && schedule.day <= 28
  return true
}

// 内置演示任务：与线上实际生成的周期任务一致——工资转移、工资调整、半月写作、每周写作。
export function seedRecurringTasks(now = new Date()) {
  const created = now.toISOString()
  return [
    {
      id: 'seed-weekly-writing',
      name: '每周写作',
      schedule: { kind: 'weekly', weekdays: [1], time: '10:00' },
      priority: 'P1',
      note: '周期标识 weekly-writing；与公众号文章任务相关，按周独立记录，不自动发布。',
      builtin: true,
      createdAt: created,
    },
    {
      id: 'seed-transfer',
      name: '工资转移',
      schedule: { kind: 'monthly-day', day: 10, time: '10:00' },
      priority: 'P1',
      note: '仅生成待办，不自动执行资金转账。',
      builtin: true,
      createdAt: created,
    },
    {
      id: 'seed-adjustment',
      name: '工资调整',
      schedule: { kind: 'monthly-day', day: 15, time: '10:00' },
      priority: 'P1',
      note: '与每月 10 日的工资转移任务独立，仅生成待办。',
      builtin: true,
      createdAt: created,
    },
    {
      id: 'seed-writing',
      name: '半月写作',
      schedule: { kind: 'monthly-two', time: '10:00' },
      priority: 'P1',
      note: '每月 1 日和 15 日各记录一次，不自动发布。',
      builtin: true,
      createdAt: created,
    },
  ]
}
