
<template>
<!--    model用来绑定数据，rule是用来绑定校验规则,ref,传递参数 -->
    <el-form style="width: 60%" :model="ruleForm" :rules="rules" ref="ruleForm" label-width="100px" class="demo-ruleForm">
<!--el-form-item元素的prop属性绑定字段名name，表单验证时，就会验证el-input元素绑定的变量ruleForm.name的值是否符合验证规则-->
<!--ruleForm 获取 prop传入的信息-->
        <el-form-item label="密钥" prop="key">
            <el-input v-model="ruleForm.key"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="pwd">
            <el-input v-model="ruleForm.pwd"></el-input>
        </el-form-item>

        <el-form-item>
            <el-button type="primary" @click="submitForm('ruleForm')">加密</el-button>
            <el-button type="primary" @click="submitFormDec('ruleForm')">解密</el-button>
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
                    key: '',  // ''填入就是默认值
                    pwd: ''
                },
                rules: {
                    key: [
                        // required是否必须，message提示信息（不填时），trigger什么时候触发，blur，焦点不在这一行时
                        { required: true, message: '加密密钥不能为空', trigger: 'blur' },
                        // { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
                    ],
                    pwd: [
                        { required: true, message: '加密/解密的密码不能为空', trigger: 'blur' },
                        // { min: 1, max: 3, message: '长度在 1 到 3 个字符', trigger: 'blur' }
                    ]
                }
            };
        },
        methods: {
            test(){
                // console.log(this.ruleForm)
                // alert(this.ruleForm) 只会输出对象
                alert(this.ruleForm.key + " : " + this.ruleForm.pwd)
            },
            submitForm(formName) {
                const _this = this // 箭头函数可以使用this
                // this.$refs[formName] 获取formName内容
                this.$refs[formName].validate((valid) => {
                    if (valid) {
                        // console.log(this.ruleForm)
                        // alert('submit!');
                        // axios.post('http://localhost:8081/tools/encryption', this.ruleForm).then(function (resp) {
                        axios.post(this.TESTUSERGLOBAL.ENCRYPTION, this.ruleForm).then(function (resp) {
                        // axios.post('http://localhost:8081/testuser/addTestUser/', this.ruleForm).then(function (resp) {
                            // this.tableData=resp.data  // 这里边的this指的是回调  this 区分2

                            // loading: true   // 加载,暂时是失败的
                            if (resp != null){
                                _this.$alert(resp.data, '加密结果', {
                                    confirmButtonText: '确定',
                                    // callback: action => {
                                    //     _this.$router.push('/GetTestUser')
                                    // }
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
            },submitFormDec(formName) {
                const _this = this // 箭头函数可以使用this
                // this.$refs[formName] 获取formName内容
                this.$refs[formName].validate((valid) => {
                    if (valid) {
                        // console.log(this.ruleForm)
                        // alert('submit!');
                        axios.post('http://localhost:8081/tools/decryption', this.ruleForm).then(function (resp) {
                        // axios.post(this.TESTUSERGLOBAL.ENCRYPTION, this.ruleForm).then(function (resp) {
                        // axios.post('http://localhost:8081/testuser/addTestUser/', this.ruleForm).then(function (resp) {
                            // this.tableData=resp.data  // 这里边的this指的是回调  this 区分2

                            // loading: true   // 加载,暂时是失败的
                            if (resp != null){
                                _this.$alert(resp.data, '解密结果', {
                                    confirmButtonText: '确定',
                                    // callback: action => {
                                    //     _this.$router.push('/GetTestUser')
                                    // }
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