<template>

  <div id="app">
    <div id="nav">
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link> |
    <router-link to="/testuser">testuser</router-link>
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