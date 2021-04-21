<template>

  <div id="app">
    <div id="nav">
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link> |
    <router-link to="/testuser">testuser</router-link>
          <router-view></router-view>

<!--    <el-container style="height: 500px; border: 1px solid #eee">-->
<!--      <el-aside width="200px" style="background-color: rgb(238, 241, 246)">-->

<!--&lt;!&ndash;        固定方式&ndash;&gt;-->
<!--&lt;!&ndash;        <el-menu :default-openeds="['1']" :default-active="'1-1'">&ndash;&gt;-->

<!--&lt;!&ndash;&lt;!&ndash;          只到二级菜单&ndash;&gt;&ndash;&gt;-->
<!--&lt;!&ndash;          <el-submenu index="1">&ndash;&gt;-->
<!--&lt;!&ndash;            <template slot="title"><i class="el-icon-message"></i>导航一</template>&ndash;&gt;-->
<!--&lt;!&ndash;            <el-menu-item index="1-1">选项1</el-menu-item>&ndash;&gt;-->
<!--&lt;!&ndash;            <el-menu-item index="1-2">选项2</el-menu-item>&ndash;&gt;-->
<!--&lt;!&ndash;          </el-submenu>&ndash;&gt;-->

<!--&lt;!&ndash;          <el-submenu index="2">&ndash;&gt;-->
<!--&lt;!&ndash;            <template slot="title"><i class="el-icon-menu"></i>导航二</template>&ndash;&gt;-->
<!--&lt;!&ndash;            <el-menu-item index="2-1">选项1</el-menu-item>&ndash;&gt;-->
<!--&lt;!&ndash;            <el-menu-item index="2-2">选项2</el-menu-item>&ndash;&gt;-->
<!--&lt;!&ndash;          </el-submenu>&ndash;&gt;-->

<!--&lt;!&ndash;          &lt;!&ndash;          只到三级菜单&ndash;&gt;&ndash;&gt;-->
<!--&lt;!&ndash;          <el-submenu index="3">&ndash;&gt;-->
<!--&lt;!&ndash;            <template slot="title"><i class="el-icon-message"></i>导航三</template>&ndash;&gt;-->
<!--&lt;!&ndash;            <el-menu-item index="3-1">选项1</el-menu-item>&ndash;&gt;-->
<!--&lt;!&ndash;            <el-menu-item index="3-2">选项2</el-menu-item>&ndash;&gt;-->
<!--&lt;!&ndash;            <el-submenu index="3-3">&ndash;&gt;-->
<!--&lt;!&ndash;              <template slot="title"><i class="el-icon-setting"></i>选项3</template>&ndash;&gt;-->
<!--&lt;!&ndash;              <el-menu-item index="3-3-1">选项3-1</el-menu-item>&ndash;&gt;-->
<!--&lt;!&ndash;              <el-menu-item index="3-3-2">选项3-2</el-menu-item>&ndash;&gt;-->
<!--&lt;!&ndash;            </el-submenu>&ndash;&gt;-->
<!--&lt;!&ndash;          </el-submenu>&ndash;&gt;-->

<!--&lt;!&ndash;        </el-menu>&ndash;&gt;-->

<!--&lt;!&ndash;        自动生成aside&ndash;&gt;-->
<!--        <el-menu>-->
<!--          <el-submenu v-for="(item, index) in $router.options.routes" :index="index+''">-->
<!--            <template slot="title"><i class="el-icon-message"></i>{{item.name}}</template>-->
<!--            <el-menu-item v-for="(item2,index2) in item.children" :index="index+'-'+index2">{{item2.name}}</el-menu-item>-->

<!--          </el-submenu>-->
<!--        </el-menu>-->
<!--      </el-aside>-->

<!--      <el-container>-->
<!--        <el-header style="text-align: right; font-size: 12px">-->
<!--          <el-dropdown>-->
<!--            <i class="el-icon-setting" style="margin-right: 15px"></i>-->
<!--            <el-dropdown-menu slot="dropdown">-->
<!--              <el-dropdown-item>查看</el-dropdown-item>-->
<!--              <el-dropdown-item>新增</el-dropdown-item>-->
<!--              <el-dropdown-item>删除</el-dropdown-item>-->
<!--            </el-dropdown-menu>-->
<!--          </el-dropdown>-->
<!--          <span>王小虎</span>-->
<!--        </el-header>-->

<!--        <el-main>-->
<!--          <router-view></router-view>-->
<!--          &lt;!&ndash;          <el-table :data="tableData">&ndash;&gt;-->
<!--          &lt;!&ndash;            <el-table-column prop="date" label="日期" width="140">&ndash;&gt;-->
<!--          &lt;!&ndash;            </el-table-column>&ndash;&gt;-->
<!--          &lt;!&ndash;            <el-table-column prop="name" label="姓名" width="120">&ndash;&gt;-->
<!--          &lt;!&ndash;            </el-table-column>&ndash;&gt;-->
<!--          &lt;!&ndash;            <el-table-column prop="address" label="地址">&ndash;&gt;-->
<!--          &lt;!&ndash;            </el-table-column>&ndash;&gt;-->
<!--          &lt;!&ndash;          </el-table>&ndash;&gt;-->
<!--        </el-main>-->
<!--      </el-container>-->
<!--    </el-container>-->


    </div>
  </div>
</template>

<style>
  .el-header {
    background-color: #B3C0D1;
    color: #333;
    line-height: 60px;
  }

  .el-aside {
    color: #333;
  }


   #app {
     font-family: 'Avenir', Helvetica, Arial, sans-serif;
     -webkit-font-smoothing: antialiased;
     -moz-osx-font-smoothing: grayscale;
     text-align: center;
     color: #2c3e50;
     /*margin-top: 60px;*/
   }

</style>

<script>
  // export default {
  //   data() {
  //     const item = {
  //       date: '2016-05-02',
  //       name: '王小虎',
  //       address: '上海市普陀区金沙江路 1518 弄'
  //     };
  //     return {
  //       tableData: Array(20).fill(item)
  //     }
  //   }
  // };
</script>

#nav {
padding: 30px;
}

#nav a {
font-weight: bold;
color: #2c3e50;
}