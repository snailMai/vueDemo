## 文件说明
app.vue:启动器
    - 里边写的内容必定会显示.如:<router-link to="/">Home</router-link> 中会先Home
    - <router-view></router-view>  表示route可切换的内容/就是开窗口
route-index.js:映射器(将所需映射到页面)
views:前端界面


## Element UI
vue + Element UI
vue 集成 Element UI
Element UI 后台管理系统主要的标签

```
el-container:构建整个页面框架
    el-aside:构建左侧菜单
        el-menu:左侧菜单内容,常用属性:
            - default-openeds:默认展开的菜单,通过菜单的index值关联
            - default-active:默认选中的菜单,通过菜单的index值关联
            el-submenu:可展开的菜单,常用属性:(可嵌套)
            - index:菜单的下标,文本类型,不能是数值类型
                template:对应el-subment的菜单名
                i:设置菜单图标,通过class属性设置
                    el-icon-message:
                    el-icon-menu:
                    el-icon-setting:
                    (可能还有其它图标,请查询官网)
                el-menu-item:菜单的子节点,不可再展开,常用属性:
                    index:菜单的下标,文本类型,不能是数值类型
```
###Vue router 动态构建左侧菜单

###menu与router绑定
1. <el-menu>标签添加router属性
2. 在页面中添加<router-view>标签,他是一个容器,动态渲染你选择的router
3. <el-menu-item>标签的index值就是要跳转的router





