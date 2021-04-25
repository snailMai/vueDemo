<template>
    <!-- html 只允许有一个div -->
    <div>
        <table>
            <tr>
                <td>编号</td>
                <td>名称</td>
                <td>年龄</td>
            </tr>
<!--            <tr>-->
<!--                <td>{{testusers[0].id}}</td>-->
<!--                <td>{{testusers[0].username}}</td>-->
<!--                <td>{{testusers[0].age}}</td>-->
<!--            </tr>-->
            <!-- for -->
            <tr v-for="item in testusers">
                <td>{{item.id}}</td>
                <td>{{item.username}}</td>
                <td>{{item.age}}</td>
            </tr>
        </table>
        {{msg}}
    </div>
</template>


<script>
    // js
    export default {
        name: "TestUser",
        //构造假数据
        data(){
            return{
                msg:"Hello Vue, Testuser.vue",
                testusers:[
                    {
                        id:1,
                        username:"test",
                        age:18
                    },
                    {
                        id:2,
                        username:'test002',
                        age:23
                    },
                    {
                        id:3,
                        username:'test003',
                        age:20
                    },
                    {
                        id:4,
                        username:'test004',
                        age:22
                    },
                    {
                        id:5,
                        username:'test005',
                        age:25
                    }
                ]
            }
        },
        // 初始化操作
        created(){
            // then是回调 url后加 + currentPage
            // this.testuser //这里的this指的是script-data  this 区分1
            const _this = this
            axios.get('http://localhost:8081/testuser/allTestUserVue').then(function (resp) {
                _this.testusers=resp.data  // 这里边的this指的是回调  this 区分2

                // 可以在浏览器F12里边展示内容
                // console.log(resp)
            })
        }
    }
</script>


<style scoped>
/*
css
 */

</style>