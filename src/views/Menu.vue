<template>
    <el-container style="height: 1500px; border: 1px solid #eee">
        <el-aside width="250px" style="background-color: rgb(238, 241, 246)">

            <!--        固定方式-->
            <!--        <el-menu :default-openeds="['1']" :default-active="'1-1'">-->

            <!--&lt;!&ndash;          只到二级菜单&ndash;&gt;-->
            <!--          <el-submenu index="1">-->
            <!--            <template slot="title"><i class="el-icon-message"></i>导航一</template>-->
            <!--            <el-menu-item index="1-1">选项1</el-menu-item>-->
            <!--            <el-menu-item index="1-2">选项2</el-menu-item>-->
            <!--          </el-submenu>-->

            <!--          <el-submenu index="2">-->
            <!--            <template slot="title"><i class="el-icon-menu"></i>导航二</template>-->
            <!--            <el-menu-item index="2-1">选项1</el-menu-item>-->
            <!--            <el-menu-item index="2-2">选项2</el-menu-item>-->
            <!--          </el-submenu>-->

            <!--          &lt;!&ndash;          只到三级菜单&ndash;&gt;-->
            <!--          <el-submenu index="3">-->
            <!--            <template slot="title"><i class="el-icon-message"></i>导航三</template>-->
            <!--            <el-menu-item index="3-1">选项1</el-menu-item>-->
            <!--            <el-menu-item index="3-2">选项2</el-menu-item>-->
            <!--            <el-submenu index="3-3">-->
            <!--              <template slot="title"><i class="el-icon-setting"></i>选项3</template>-->
            <!--              <el-menu-item index="3-3-1">选项3-1</el-menu-item>-->
            <!--              <el-menu-item index="3-3-2">选项3-2</el-menu-item>-->
            <!--            </el-submenu>-->
            <!--          </el-submenu>-->

            <!--        </el-menu>-->

            <!--        自动生成aside-->
            <el-menu router :default-openeds="['0']">
                <!--  打开和关闭下拉框,是通过index来判断的  -->
                <!--  item是对象,index是下标,这两个顺序不能变 //绑定index //index就是遍历出来的数字:0,1,2... -->
                <el-submenu v-for="(item, index) in $router.options.routes" :index="index+''">
                    <template slot="title"><i class="el-icon-message"></i>{{item.name}}</template>
                    <!--  <el-menu-item>标签的index值就是要跳转的router  -->
                    <el-menu-item v-for="item2 in item.children" :index="item2.path" :class="$route.path===item2.path?'is-active':''">{{item2.name}}</el-menu-item>

                </el-submenu>
            </el-menu>
        </el-aside>

        <el-container>
            <el-header style="text-align: right; font-size: 12px">
                <el-dropdown>
                    <i class="el-icon-setting" style="margin-right: 15px"></i>
                    <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item>查看</el-dropdown-item>
                        <el-dropdown-item>新增</el-dropdown-item>
                        <el-dropdown-item>删除</el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
                <span>王小虎</span>
            </el-header>

            <el-main>
                <router-view></router-view>
                <!--          <el-table :data="tableData">-->
                <!--            <el-table-column prop="date" label="日期" width="140">-->
                <!--            </el-table-column>-->
                <!--            <el-table-column prop="name" label="姓名" width="120">-->
                <!--            </el-table-column>-->
                <!--            <el-table-column prop="address" label="地址">-->
                <!--            </el-table-column>-->
                <!--          </el-table>-->
            </el-main>
        </el-container>
    </el-container>
</template>

<script>
    export default {
        name: "index"
    }
</script>

<style scoped>

</style>