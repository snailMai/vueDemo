// 与后端字段额度一致，按 UTF-8 字节而非 JavaScript 字符串长度判断。
export const CIPHER_LIMITS = { key: 1024, encrypt: 64 * 1024, decrypt: 128 * 1024 }
const encoder = new TextEncoder()

/** 加密允许空明文，解密要求非空密文；密钥和正文均不做 trim 或截断。 */
export function validateCipherInput(input, mode) {
  if (typeof input.key !== 'string' || input.key.length === 0) {
    throw new Error('请输入密钥。')
  }
  if (typeof input.pwd !== 'string' || (mode === 'decrypt' && input.pwd.length === 0)) {
    throw new Error('请输入需要解密的密文。')
  }
  if (encoder.encode(input.key).length > CIPHER_LIMITS.key) {
    throw new Error('密钥不能超过 1 KiB（UTF-8 字节）。')
  }
  const limit = mode === 'decrypt' ? CIPHER_LIMITS.decrypt : CIPHER_LIMITS.encrypt
  if (encoder.encode(input.pwd).length > limit) {
    throw new Error(`${mode === 'decrypt' ? '密文不能超过 128' : '明文不能超过 64'} KiB（UTF-8 字节）。`)
  }
  return { key: input.key, pwd: input.pwd }
}

/** 空参数采用接口默认值，非空参数必须是范围内的十进制非负整数。 */
export function parsePasswordParameters(input) {
  function integer(value, fallback, min, max, label) {
    const text = String(value ?? '').trim()
    if (text === '') return fallback
    const number = Number(text)
    // Number 本身会接受指数、小数等写法，正则与安全整数检查共同收紧输入。
    if (!/^\d+$/.test(text) || !Number.isSafeInteger(number) || number < min || number > max) {
      throw new Error(`${label}必须是 ${min}～${max} 之间的整数。`)
    }
    return number
  }

  return {
    num: integer(input.num, 0, 0, 128, '密码位数'),
    quantity: integer(input.quantity, 1, 1, 100, '密码个数')
  }
}
