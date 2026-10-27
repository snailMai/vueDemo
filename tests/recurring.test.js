import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  describeSchedule,
  formatCountdown,
  nextRun,
  seedRecurringTasks,
  validateSchedule,
} from '../src/lib/recurring.js'

const at = (iso) => new Date(iso)
const fmt = (d) => d.toLocaleString('sv-SE').slice(0, 16)

test('各周期类型的下次执行时间（北京时间口径）', () => {
  const now = at('2026-10-26T12:00:00+08:00')
  assert.equal(fmt(nextRun({ kind: 'monthly-day', day: 10, time: '10:00' }, now)), '2026-11-10 10:00')
  assert.equal(fmt(nextRun({ kind: 'monthly-day', day: 15, time: '10:00' }, now)), '2026-11-15 10:00')
  assert.equal(fmt(nextRun({ kind: 'monthly-two', time: '10:00' }, now)), '2026-11-01 10:00')
  assert.equal(fmt(nextRun({ kind: 'daily', time: '08:30' }, now)), '2026-10-27 08:30')
  assert.equal(fmt(nextRun({ kind: 'weekly', weekdays: [1, 5], time: '09:00' }, now)), '2026-10-30 09:00')
  // 触发时刻之后同一天不再命中，顺延到下一周期。
  assert.equal(fmt(nextRun({ kind: 'daily', time: '09:00' }, at('2026-10-26T09:00:00+08:00'))), '2026-10-27 09:00')
  assert.equal(fmt(nextRun({ kind: 'monthly-day', day: 31, time: '10:00' }, now)), '2026-10-31 10:00') // 仅大月命中
})

test('规则描述覆盖四种周期类型', () => {
  assert.equal(describeSchedule({ kind: 'daily', time: '10:00' }), '每天 10:00')
  assert.equal(describeSchedule({ kind: 'weekly', weekdays: [1, 5], time: '09:00' }), '每周 周一、周五 09:00')
  assert.equal(describeSchedule({ kind: 'monthly-day', day: 10, time: '10:00' }), '每月 10 日 10:00')
  assert.equal(describeSchedule({ kind: 'monthly-two', time: '10:00' }), '每月 1 日 / 15 日 10:00')
})

test('周期设置校验：合法通过，非法拒绝', () => {
  assert.equal(validateSchedule({ kind: 'daily', time: '10:00' }), true)
  assert.equal(validateSchedule({ kind: 'weekly', weekdays: [0, 6], time: '08:00' }), true)
  assert.equal(validateSchedule({ kind: 'weekly', weekdays: [], time: '08:00' }), false)
  assert.equal(validateSchedule({ kind: 'monthly-day', day: 28, time: '10:00' }), true)
  assert.equal(validateSchedule({ kind: 'monthly-day', day: 29, time: '10:00' }), false)
  assert.equal(validateSchedule({ kind: 'daily', time: '25:00' }), false)
  assert.equal(validateSchedule({ kind: 'daily', time: 'abc' }), false)
  assert.equal(validateSchedule({ kind: 'unknown', time: '10:00' }), false)
})

test('倒计时按天／小时／分钟／秒分级', () => {
  const now = at('2026-10-26T10:00:00+08:00')
  assert.equal(formatCountdown(at('2026-10-30T10:00:00+08:00'), now), '4 天 0 小时')
  assert.equal(formatCountdown(at('2026-10-26T12:30:00+08:00'), now), '2 小时 30 分')
  assert.equal(formatCountdown(at('2026-10-26T10:05:00+08:00'), now), '5 分 00 秒')
  assert.equal(formatCountdown(at('2026-10-26T10:00:30+08:00'), now), '30 秒')
  assert.equal(formatCountdown(at('2026-10-26T09:00:00+08:00'), now), '已到期')
})

test('内置种子任务与线上实际周期任务一致（含每周写作）', () => {
  const seeds = seedRecurringTasks(at('2026-10-26T12:00:00+08:00'))
  assert.equal(seeds.length, 4)
  assert.deepEqual(seeds.map((s) => s.name).sort(), ['每周写作', '半月写作', '工资调整', '工资转移'].sort())
  assert.ok(seeds.every((s) => s.builtin && s.priority === 'P1'))
  const weekly = seeds.find((s) => s.name === '每周写作')
  assert.deepEqual(weekly.schedule, { kind: 'weekly', weekdays: [1], time: '10:00' })
})

test('定时任务通过按钮弹窗内嵌在 todoist 页面，没有独立路由', () => {
  const source = readFileSync(new URL('../src/views/Todoist.vue', import.meta.url), 'utf8')
  assert.match(source, /RecurringPanel/)
  assert.match(source, /openRecurring/)
  assert.match(source, /showRecurring/)
  assert.match(source, /recurring-mask/)
  assert.match(source, /定时任务/)
  assert.doesNotMatch(source, /RecurringTasks\.vue/)
})

test('定时任务弹窗支持增删改查操作', () => {
  const source = readFileSync(new URL('../src/components/RecurringPanel.vue', import.meta.url), 'utf8')
  assert.match(source, /添加任务/)
  assert.match(source, /修改选中/)
  assert.match(source, /删除选中/)
  assert.match(source, /updateRecurringTask/)
  assert.match(source, /演示数据/)
})
