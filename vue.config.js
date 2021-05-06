// 当前作用是打包用

module.exports = {
    publicPath : './',
    assetsDir: 'static', // 静态资源保存路径
    outputDir: 'dist', // 打包后生成的文件夹
    lintOnSave: false,
    productionSourceMap: false,  // 取消错误日志
    runtimeCompiler: true, // 实时编译
    // chainWebpack: () => { },

    devServer: {  // 配置服务器
        port: 8080, // 端口号
        open: true, // 自动打开浏览器
        https: false,  // 关闭https请求
        overlay:{
            warnings: true,
            errors: true
        }
    }

}
//     devServer: { // vue工程服务配置
//     open: true,
//         proxy: { // 代理配置，将请求转发到后台的接口
//         '/api': {
//             target: 'http://www.ccocc.co',
//                 changeOrigin: true, // 开启跨域
//                 ws: true,
//                 pathRewrite: {
//                 '^/api': '' // 重写路径
//             }
//         }
//     }
// }
// }

