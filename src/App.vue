<template>

  <div id="app">
    <router-link to="/AddTestUser">新增</router-link> |
<!--    <router-link to="/about">修改</router-link> |-->
    <router-link to="/GetTestUser">查询</router-link> |
    <router-link to="/TestUser">一页显示</router-link>

    <div id="nav">
          <router-view></router-view>
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