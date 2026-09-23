<template>
  <section class="page home-page">
    <p class="eyebrow">YOUR EVERYDAY TOOLS</p>
    <h1>小工具，<br><span class="accent">解决手边的小事。</span></h1>
    <p class="page-description">处理一段文本，或生成一组随机密码。<br>选择一个工具，即刻开始。</p>
    <div class="tool-cards">
      <RouterLink to="/ToolsCryption" class="tool-card">
        <div class="card-top"><span class="card-icon" aria-hidden="true">Aa</span><span class="card-number">01</span></div>
        <h2>文本加解密</h2>
        <p>使用密钥加密文本，或还原已有密文。支持保留完整文本与换行。</p>
        <span class="card-action">打开工具 <span aria-hidden="true">↗</span></span>
      </RouterLink>
      <RouterLink to="/GetRandomPWD" class="tool-card">
        <div class="card-top"><span class="card-icon password-icon" aria-hidden="true">＊</span><span class="card-number">02</span></div>
        <h2>随机密码</h2>
        <p>自定义密码位数与生成数量，一次生成多条，按行查看和复制。</p>
        <span class="card-action">打开工具 <span aria-hidden="true">↗</span></span>
      </RouterLink>
    </div>
    <p class="privacy-note">加解密会将输入发送给本站服务处理，请在可信的 HTTPS 页面使用。</p>
  </section>
</template>
