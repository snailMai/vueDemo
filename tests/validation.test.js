// 纯函数校验回归：覆盖 UTF-8 字节边界、参数默认值及原始文本保真。
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CIPHER_LIMITS, parsePasswordParameters, validateCipherInput } from '../src/forms/validation.js'

test('密钥、明文和密文按 UTF-8 字节校验上下边界', () => {
  for (const mode of ['encrypt', 'decrypt']) {
    for (const offset of [-1, 0, 1]) {
      const input = { key: 'k'.repeat(CIPHER_LIMITS.key + offset), pwd: 'x' }
      if (offset > 0) assert.throws(() => validateCipherInput(input, mode), /密钥不能超过/)
      else assert.deepEqual(validateCipherInput(input, mode), input)
      const size = CIPHER_LIMITS[mode] + offset
      // 中文密钥恰为 1024 字节，emoji 与 ASCII 组合精确构造正文边界。
      const unicode = { key: '密'.repeat(341) + 'a', pwd: '🔐'.repeat(Math.floor(size / 4)) + 'x'.repeat(size % 4) }
      if (offset > 0) assert.throws(() => validateCipherInput(unicode, mode), /文不能超过/)
      else assert.deepEqual(validateCipherInput(unicode, mode), unicode)
    }
  }
  assert.throws(() => validateCipherInput({ key: '密'.repeat(342), pwd: '' }, 'encrypt'), /密钥不能超过/)
})

test('最大明文和密钥的 JSON 转义仍低于请求体上限', () => {
  const input = { key: '\u0000'.repeat(CIPHER_LIMITS.key), pwd: '\u0000'.repeat(CIPHER_LIMITS.encrypt) }
  assert.deepEqual(validateCipherInput(input, 'encrypt'), input)
  assert.ok(new TextEncoder().encode(JSON.stringify(input)).length < 1024 * 1024)
})

test('密码参数默认值、空值和边界按接口契约解析', () => {
  assert.deepEqual(parsePasswordParameters({}), { num: 0, quantity: 1 })
  assert.deepEqual(parsePasswordParameters({ num: '', quantity: ' ' }), { num: 0, quantity: 1 })
  for (const num of [0, 1, 128]) {
    for (const quantity of [1, 100]) {
      assert.deepEqual(parsePasswordParameters({ num: String(num), quantity: String(quantity) }), { num, quantity })
    }
  }
})

test('拒绝负数、小数、指数、字母、超限和不安全整数', () => {
  for (const num of ['-1', '129', '1.5', '1e2', 'abc', 'Infinity', '9007199254740993']) {
    assert.throws(() => parsePasswordParameters({ num, quantity: 1 }), /密码位数必须是 0～128 之间的整数。/)
  }
  for (const quantity of ['0', '-1', '101', '1.5', '1e2', 'abc']) {
    assert.throws(() => parsePasswordParameters({ num: 8, quantity }), /密码个数必须是 1～100 之间的整数。/)
  }
})

test('加解密输入不 trim，且加密支持空明文', () => {
  assert.deepEqual(validateCipherInput({ key: ' 密钥 ', pwd: '  文本\n' }, 'encrypt'), { key: ' 密钥 ', pwd: '  文本\n' })
  assert.deepEqual(validateCipherInput({ key: 'key', pwd: '' }, 'encrypt'), { key: 'key', pwd: '' })
  assert.deepEqual(validateCipherInput({ key: ' ', pwd: '12345cipher\n' }, 'decrypt'), { key: ' ', pwd: '12345cipher\n' })
})

test('缺失密钥或正文类型无效时失败，解密不接受空密文', () => {
  for (const key of ['', null, undefined, 123]) {
    assert.throws(() => validateCipherInput({ key, pwd: '' }, 'encrypt'), /请输入密钥。/)
  }
  for (const pwd of [null, undefined, 123]) {
    assert.throws(() => validateCipherInput({ key: 'key', pwd }, 'encrypt'))
  }
  assert.throws(() => validateCipherInput({ key: 'key', pwd: '' }, 'decrypt'), /请输入需要解密的密文。/)
})
