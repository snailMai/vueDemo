import assert from 'node:assert/strict'
import { test } from 'node:test'
import { accessCsrf, checkAccess, signInAccess, signOutAccess, onAccessRequired } from '../src/api/access.js'
import { fetchTodoistTasks, submitTodoist } from '../src/api/todoist.js'

test('共享登录仅使用同源 Cookie 与内存 CSRF，退出通知页面锁定', async t => {
  const calls=[]
  let locked=0
  const unsubscribe=onAccessRequired(()=>locked++)
  t.after(unsubscribe)
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    calls.push({url,options})
    assert.equal(options.credentials,'same-origin')
    if(url.endsWith('/session'))return Response.json({authenticated:false,csrf:'a'.repeat(64)})
    if(url.endsWith('/login'))return Response.json({ok:true,csrf:'b'.repeat(64)})
    return Response.json({ok:true})
  })
  assert.equal(await checkAccess(),false)
  await signInAccess('synthetic-password')
  assert.equal(calls[1].options.headers['X-CSRF-Token'],'a'.repeat(64))
  assert.deepEqual(JSON.parse(calls[1].options.body),{password:'synthetic-password'})
  assert.equal(accessCsrf(),'b'.repeat(64))
  await signOutAccess()
  assert.equal(locked,1)
  assert.equal(accessCsrf(),'')
})

test('任务读取被拒绝会锁定页面，首次提交被拒绝不视为已执行',async t=>{
  t.mock.method(globalThis,'fetch',async()=>Response.json({error:'请先登录'},{status:401}))
  await assert.rejects(fetchTodoistTasks(),e=>e.code==='AUTH_REQUIRED')
  await assert.rejects(submitTodoist({operation:'add',fields:{name:'synthetic'}},'id'),
    e=>e.code==='AUTH_REQUIRED'&&e.notSubmitted&&!e.uncertain)
  await assert.rejects(submitTodoist(null,'id',undefined,true),
    e=>e.code==='AUTH_REQUIRED'&&!e.notSubmitted&&e.uncertain)
})

test('CSRF 拒绝不会重发操作，认证服务错误不会被当成登录成功',async t=>{
  let calls=0
  t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json({code:'CSRF_INVALID'},{status:403})})
  await assert.rejects(submitTodoist({operation:'add',fields:{name:'synthetic'}},'id'),e=>e.notSubmitted&&!e.uncertain)
  assert.equal(calls,1)
  t.mock.method(globalThis,'fetch',async()=>Response.json({ok:true}))
  await assert.rejects(checkAccess(),/响应异常/)
})
