import { requestText } from './client.js'

// 加解密字段沿用 key／pwd，只放入 POST 正文；不写入 URL 或控制台。
export function encryptText(input, signal) {
  return requestText('tools/encryption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal
  })
}

// 不裁剪密文或换行，兼容旧接口的 Base64 折行格式。
export function decryptText(input, signal) {
  return requestText('tools/decryption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal
  })
}

// GET 查询只携带长度与数量；生成的密码作为原始文本响应处理。
export function generatePasswords(parameters, signal) {
  const query = new URLSearchParams(parameters)
  return requestText(`tools/get/randompwd?${query}`, { signal })
}
