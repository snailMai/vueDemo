<template>
    <div>
        <el-table
                :data="tableData"
                border
                style="width: 100%">
            <el-table-column
                    fixed
                    prop="id"
                    label="编号"
                    width="50">
            </el-table-column>
            <el-table-column
                    prop="username"
                    label="姓名"
                    width="120">
            </el-table-column>
            <el-table-column
                    prop="age"
                    label="年龄"
                    width="120">
            </el-table-column>
<!--            fixed="right"  可实现在右边-->
            <el-table-column
                    label="操作"
                    width="100">
                <template slot-scope="scope">
                    <el-button @click="edit(scope.row)" type="text" size="small">修改</el-button>
                    <el-button @click="deleteTestUser(scope.row)" type="text" size="small">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination
                background
                layout="prev, pager, next"
                :page-size="5"
                :total="total"
                @current-change="page">
            <!--            页数 = total / page-size -->
<!--         @current-change="page" 改变时会触发   -->
        </el-pagination>
    </div>
</template>

<script>
    export default {
        methods: {
            // edit方法,新增修改属性
            edit(row) {
                console.log(row);
                this.$router.push({
                    path: '/UpdateTestUser',
                    query:{
                        id : row.id
                    }
                })
            },
            deleteTestUser(row){
                console.log(row);
                const _this = this
                // axios.delete('http://localhost:8081/testuser/' + row.username).then(function(resp){
                axios.delete(this.TESTUSERGLOBAL.DELETETESTUSER + row.username).then(function(resp){
                    if (resp != null){
                        _this.$alert("用户\"" + row.username + "\"删除成功!", '消息', {
                            confirmButtonText: '确定',
                            callback:
                                //_this.$router.push('/TestData')
                                //动态刷新  // js语法
                                window.location.reload()

                        });
                    }else {
                        alert(resp + ':' + 'Update TestUser Failed, please check your input')
                    }
                })
            },
            // page(currentPage){
            //     alert(currentPage)
            // },
            page(currentPage){
                const _this = this
                // console.log("12:" + this.TESTUSERGLOBAL.GETTESTUSERBYPAGE)
                // console.log("23:" + this.TESTUSERGLOBAL.GETTESTUSERBYPAGE.replace("{}", currentPage))
                // axios.get('http://localhost:8081/testuser/allTestUserVue/' + currentPage).then(function (resp) {
                axios.get(this.TESTUSERGLOBAL.GETTESTUSERBYPAGE.replace("{}", currentPage)).then(function (resp) {
                    _this.tableData=resp.data  // 这里边的this指的是回调  this 区分2
                    // _this.total = resp.data.length
                    // console.log(resp.data)
                    // alert(_this.total)
                })
            }
        },
        created(){
            const _this = this
            // 获取所有TestUser个数
            axios.get(this.TESTUSERGLOBAL.COUNTTESTUSER).then(function (resp) {
                // _this.tableData=resp.data  // 这里边的this指的是回调  this 区分2
                // _this.total = resp.data.testUserNumber
                // console.log(resp)
                // alert(_this.total)
                _this.total = resp.data
            })
            //获取第一页
            axios.get(this.TESTUSERGLOBAL.GETTESTUSERBYPAGE.replace("{}", 1)).then(function (resp) {
                _this.tableData=resp.data  // 这里边的this指的是回调  this 区分2

                // _this.total = resp.data.length

                // console.log(resp.data)
            })
        },
        data() {
            return {
                total: null,
                tableData: null
                //     [{
                //     id:1,
                //     username:"test",
                //     age:18
                // },
                //     {
                //         id:2,
                //         username:'test002',
                //         age:23
                //     },
                //     {
                //         id:3,
                //         username:'test003',
                //         age:20
                //     }]
            }
        }
    }
</script>