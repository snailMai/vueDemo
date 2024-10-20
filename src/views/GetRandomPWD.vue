
<template>
<!--    model用来绑定数据，rule是用来绑定校验规则,ref,传递参数 -->
    <el-form style="width: 60%" :model="ruleForm" :rules="rules" ref="ruleForm" label-width="100px" class="demo-ruleForm">
<!--el-form-item元素的prop属性绑定字段名name，表单验证时，就会验证el-input元素绑定的变量ruleForm.name的值是否符合验证规则-->
<!--ruleForm 获取 prop传入的信息-->
        <el-form-item label="密码位数" prop="num">
            <el-input v-model="ruleForm.num"></el-input>
        </el-form-item>
        <el-form-item label="密码个数" prop="quantity">
            <el-input v-model="ruleForm.quantity"></el-input>
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
                    num: '',
                    quantity: '',
                },
                rules: {
                    num: [
                        // required是否必须，message提示信息（不填时），trigger什么时候触发，blur，焦点不在这一行时
                        { required: false, message: '用户名不能为空', trigger: 'blur' },
                        { min: 1, max: 100, message: '长度在 0 到 100 个字符', trigger: 'blur' }
                    ],
                    quantity: [
                        // required是否必须，message提示信息（不填时），trigger什么时候触发，blur，焦点不在这一行时
                        { required: false, message: '用户名不能为空', trigger: 'blur' },
                        { min: 1, max: 20, message: '长度在 0 到 20 个字符', trigger: 'blur' }
                    ]
                }
            };
        },
        methods: {
            test(){
                // console.log(this.ruleForm)
                // alert(this.ruleForm) 只会输出对象
                alert(this.ruleForm.num)
            },
            submitForm(formName) {
                const _this = this // 箭头函数可以使用this
                // this.$refs[formName] 获取formName内容
                this.$refs[formName].validate((valid) => {
                    if (valid) {
                        // console.log(this.ruleForm)
                        // alert('submit!');get
                        
                        axios.get(this.TESTUSERGLOBAL.GETRANDOMPASSWORD + "?num=" + this.ruleForm.num + "&quantity=" + this.ruleForm.quantity).then(function (resp) {
                        // axios.post('http://localhost:8081/testuser/addTestUser/', this.ruleForm).then(function (resp) {
                            // var tableData=resp.data  // 这里边的this指的是回调  this 区分2

                            // resp.data.replace(/\n/g, '<br/>$1')
                            // this.text = resp.data.replace(/\n/g, '<br>');
                            // alert(resp.data) 会换行, 但是不能复制
                            // _this.$alert(resp.data 能复制,但不能换行

                            if (resp != null){
                                _this.$alert(resp.data, '结果', {
                                    confirmButtonText: '确定',
                                });
                                // alert(resp.data)
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