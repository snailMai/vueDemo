<template>
  <div class="about">
    <h1>支持的api "{}是要输入的内容"</h1>
    <table>
      <tr>
        <td>ID</td>
        <td>API_NAME</td>
        <td>API_PATH</td>
      </tr>
      <tr v-for="item in testUserGlobal">
        <td>{{item.id}}</td>
        <td>{{item.name}}</td>
        <td>{{item.path}}</td>
      </tr>
    </table>
  </div>
</template>


<script>
  // js
  export default {
    name: "TestUser",
    //构造假数据
    data() {
      return {
        testUserGlobal: [
          {
            id: 1,
            name: "COUNTTESTUSER",
            path: 'testuser/number'
          },
          {
            id: 2,
            name: 'ADDTESTUSER',
            path: 'testuser/addTestUser'
          },
          {
            id: 3,
            name: 'DELETETESTUSER',
            path: 'testuser/{}'
          },
          {
            id: 4,
            name: 'UPDATETESTUSER',
            path: 'testuser/updateTestUser/{}'
          },
          {
            id: 5,
            name: 'GETTESTUSERLIST',
            path: 'testuser/allTestUserVue'
          },
          {
            id: 6,
            name: 'GETTESTUSER',
            path: 'testuser/allTestUserVue/{}'
          },
          {
            id: 7,
            name: 'GETTESTUSERBYPAGE',
            path: 'testuser/allTestUserVue/page/{}'
          }
        ]
      }
    }
  }
</script>

