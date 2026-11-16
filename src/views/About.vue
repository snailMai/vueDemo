<template>
  <!-- 首页只提供工具入口，不加载私人会话或待办内容。 -->
  <section class="page home-page">
    <!-- 首页使用紧凑单行标题与竖向卡片，说明过长时省略而不撑高卡片。 -->
    <header class="home-head">
      <div class="home-title">
        <p class="eyebrow">YOUR EVERYDAY TOOLS</p>
        <h1>小工具，<span class="accent">解决手边的小事。</span></h1>
      </div>
      <p class="page-description">文本、密码、待办与文件同步，选择一个工具即刻开始。</p>
    </header>
    <div class="tool-cards">
      <RouterLink to="/ToolsCryption" class="tool-card">
        <div class="card-top"><span class="card-icon" aria-hidden="true">Aa</span><span class="card-number">01</span></div>
        <h2>文本加解密</h2>
        <p>加密或还原文本，保留完整内容与换行。</p>
        <span class="card-action">打开工具 <span aria-hidden="true">↗</span></span>
      </RouterLink>
      <RouterLink to="/GetRandomPWD" class="tool-card">
        <div class="card-top"><span class="card-icon password-icon" aria-hidden="true">＊</span><span class="card-number">02</span></div>
        <h2>随机密码</h2>
        <p>自定义位数和数量，一次生成多条密码。</p>
        <span class="card-action">打开工具 <span aria-hidden="true">↗</span></span>
      </RouterLink>
      <RouterLink to="/Todoist" class="tool-card">
        <div class="card-top"><span class="card-icon" aria-hidden="true">✓</span><span class="card-number">03</span></div>
        <h2>Todoist</h2>
        <p>添加、修改任务，或输出全部待办。</p>
        <span class="card-action">打开工具 <span aria-hidden="true">↗</span></span>
      </RouterLink>
      <RouterLink to="/Transfer" class="tool-card">
        <div class="card-top"><span class="card-icon" aria-hidden="true">⇄</span><span class="card-number">04</span></div>
        <h2>电脑手机同步</h2>
        <p>在电脑与手机间同步文本和文件。</p>
        <span class="card-action">打开工具 <span aria-hidden="true">↗</span></span>
      </RouterLink>
    </div>
    <p class="privacy-note">加解密会将输入发送给本站服务处理，请在可信的 HTTPS 页面使用。</p>
  </section>
</template>

<style>
/* 只收紧首页；其他工具页继续使用全站原有尺寸。 */
.home-page .home-head .eyebrow { margin-bottom: 12px; }
.home-page h1 { font-size: 30px; line-height: 1.4; white-space: nowrap; }
.home-page .home-head .page-description { margin: 12px 0 0; font-size: 13px; line-height: 1.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.home-page .tool-cards { margin-top: 28px; gap: 16px; }
.home-page .tool-card { padding: 20px 22px; }
.home-page .card-top { margin-bottom: 14px; }
.home-page .card-icon { width: 38px; height: 38px; border-radius: 10px; font-size: 19px; }
.home-page .password-icon { font-size: 28px; }
.home-page .tool-card h2 { margin-bottom: 8px; font-size: 18px; }
.home-page .tool-card p { font-size: 12px; line-height: 1.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.home-page .card-action { padding-top: 16px; }
.home-page .privacy-note { margin-top: 16px; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

@media (min-width: 701px) {
  .home-page { padding: 36px 40px; }
}

@media (max-width: 700px) {
  .home-page { padding: 24px 20px 32px; }
  .home-page h1 { font-size: clamp(22px, 6vw, 24px); }
  .home-page .home-head .page-description { font-size: 12px; }
  .home-page .tool-cards { margin-top: 24px; gap: 14px; }
  .home-page .tool-card { padding: 18px 20px; }
}
</style>

