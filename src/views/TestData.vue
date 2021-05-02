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
                    <el-button @click="handleClick(scope.row)" type="text" size="small">查看</el-button>
                    <el-button type="text" size="small">编辑</el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination
                background
                layout="prev, pager, next"
                page-size="5"
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
            handleClick(row) {
                console.log(row);
            },
            // page(currentPage){
            //     alert(currentPage)
            // },
            page(currentPage){
                const _this = this
                axios.get('http://localhost:8081/testuser/allTestUserVue/' + currentPage).then(function (resp) {
                    _this.tableData=resp.data  // 这里边的this指的是回调  this 区分2
                    // _this.total = resp.data.length
                    // console.log(resp.data)
                    // alert(_this.total)
                })
            }
        },
        created(){
            const _this = this
            axios.get('http://localhost:8081/testuser/number').then(function (resp) {
                // _this.tableData=resp.data  // 这里边的this指的是回调  this 区分2
                // _this.total = resp.data.testUserNumber
                // console.log(resp)
                // alert(_this.total)
                _this.total = resp.data
            })
            axios.get('http://localhost:8081/testuser/allTestUserVue/1').then(function (resp) {
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