// const BASEHOST = 'http://localhost:8081';
const BASEHOST = 'http://45.78.60.3:8081/myBlog';


// path
// testuser
const ADDTESTUSER = 'testuser/addTestUser';
const DELETETESTUSER = 'testuser/{}'
const UPDATETESTUSER = 'testuser/updateTestUser/{}'
const GETTESTUSERLIST = 'testuser/allTestUserVue';
const GETTESTUSER = 'testuser/allTestUserVue/{}';
const GETTESTUSERBYPAGE = 'testuser/allTestUserVue/page/{}'
const COUNTTESTUSER = 'testuser/number';


// tools
const ENCRYPTION = 'tools/encryption';
const DECRYPTION = 'tools/decryption';
const GETRANDOMPASSWORD = 'tools/get/randompwd';

// 一定要注意eport, 不然找不到
export default {
    BASEHOST,
    ADDTESTUSER,
    DELETETESTUSER,
    UPDATETESTUSER,
    GETTESTUSERLIST,
    GETTESTUSER,
    GETTESTUSERBYPAGE,
    COUNTTESTUSER,
    ENCRYPTION,
    DECRYPTION,
    GETRANDOMPASSWORD
}

