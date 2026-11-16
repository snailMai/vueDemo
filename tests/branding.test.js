import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('品牌与浏览器页签统一使用扳手图标', () => {
  const layout = readFileSync(new URL('../src/layouts/ToolLayout.vue', import.meta.url), 'utf8')
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  assert.match(layout, /import wrenchIcon from '\.\.\/assets\/wrench\.png'/)
  assert.match(layout, /<span class="brand-symbol" aria-hidden="true"><img :src="wrenchIcon" alt=""><\/span>/)
  assert.doesNotMatch(layout, /brand-symbol[^>]*>＋/)
  assert.match(html, /<link rel="icon" href="\/favicon\.ico" sizes="any">/)
})

test('扳手资源有效，页签图标包含六种尺寸', () => {
  const png = readFileSync(new URL('../src/assets/wrench.png', import.meta.url))
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(png.readUInt32BE(16), 196)
  assert.equal(png.readUInt32BE(20), 196)

  const ico = readFileSync(new URL('../public/favicon.ico', import.meta.url))
  assert.equal(ico.readUInt16LE(0), 0)
  assert.equal(ico.readUInt16LE(2), 1)
  assert.equal(ico.readUInt16LE(4), 6)
})
