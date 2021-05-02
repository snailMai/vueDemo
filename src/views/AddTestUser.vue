
<template>
<!--    model用来绑定数据，rule是用来绑定校验规则,ref,传递参数 -->
    <el-form style="width: 60%" :model="ruleForm" :rules="rules" ref="ruleForm" label-width="100px" class="demo-ruleForm">
<!--el-form-item元素的prop属性绑定字段名name，表单验证时，就会验证el-input元素绑定的变量ruleForm.name的值是否符合验证规则-->
<!--ruleForm 获取 prop传入的信息-->
        <el-form-item label="用户名称" prop="username">
            <el-input v-model="ruleForm.username"></el-input>
        </el-form-item>
        <el-form-item label="年龄" prop="age">
            <el-input v-model="ruleForm.age"></el-input>
        </el-form-item>

        <el-form-item>
            <el-button type="primary" @click="submitForm('ruleForm')">创建</el-button>
            <el-button @click="resetForm('ruleForm')">重置</el-button>
            <el-button @click="test">test</el-button>
        </el-form-item>
    </el-form>
</template>


<script>
    export default {
        data() {
            return {
                ruleForm: {
                    username: '',  // ''填入就是默认值
                    age: ''
                },
                rules: {
                    username: [
                        // required是否必须，message提示信息（不填时），trigger什么时候触发，blur，焦点不在这一行时
                        { required: true, message: '用户名不能为空', trigger: 'blur' },
                        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
                    ],
                    age: [
                        { required: true, message: '用户年龄不能为空', trigger: 'blur' },
                        { min: 1, max: 3, message: '长度在 1 到 3 个字符', trigger: 'blur' }
                    ]
                }
            };
        },
        methods: {
            test(){
                // console.log(this.ruleForm)
                // alert(this.ruleForm) 只会输出对象
                alert(this.ruleForm.username + " : " + this.ruleForm.age)
            },
            submitForm(formName) {
                const _this = this // 箭头函数可以使用this
                // this.$refs[formName] 获取formName内容
                this.$refs[formName].validate((valid) => {
                    if (valid) {
                        // console.log(this.ruleForm)
                        // alert('submit!');
                        axios.post('http://localhost:8081/testuser/addTestUser/', this.ruleForm).then(function (resp) {
                            // this.tableData=resp.data  // 这里边的this指的是回调  this 区分2

                            // loading: true   // 加载,暂时是失败的
                            console.log(resp)
                            if (resp != null){
                                _this.$alert("用户\"" + _this.ruleForm.username + "\"添加成功!", '消息', {
                                    confirmButtonText: '确定',
                                    callback: action => {
                                        _this.$router.push('/TestData')
                                    }
                                });
                                // _this.$message('添加成功')  // 只在界面上方显示'添加成功'
                                // alert('Create TestUser success')
                                // _this.$router.push('/testuser')  // 跳转到/testuser
                            }else {
                                alert('Create TestUser Failed, please check your input')
                            }

                        })
                    } else {
                        console.log('error submit!!');
                        alert('please check your input')
                        // return false;
                    }
                });
            },
            resetForm(formName) {
                this.$refs[formName].resetFields();
            }
        }
    }
</script>