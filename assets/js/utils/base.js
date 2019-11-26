const moment = require('moment');

function getObjectURL(file) {
    let url = window.webkitURL.createObjectURL(file)
    return url;
}


function parseJSON(response) {
    return response.json();
}

function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
        return response;
    }

    const error = new Error(response.statusText);
    error.response = response;
    throw error;
}

function request(url, options) {
    return window.fetch(url, options)
        .then(checkStatus)
        .then(parseJSON)
        .then(data => ({
            data
        }))
        .catch(err => ({
            err
        }));
}

function randomPassword(size, n) {
    //生成随机数 位数为size 如果n值大于0则返回带大小写的随机数
    var seed = new Array('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'm', 'n', 'p', 'Q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        '2', '3', '4', '5', '6', '7', '8', '9'
    ); //数组
    seedlength = seed.length; //数组长度
    var createPassword = '';
    for (i = 0; i < size; i++) {
        j = Math.floor(Math.random() * seedlength);
        createPassword += seed[j];
    }
    if (n) {
        return createPassword
    }
    return createPassword.toLowerCase()
}


const CryptoJS = require('crypto-js');
const _sodium = require('libsodium-wrappers');
class aesjs {
    constructor(asetxt) {
        this.asetxt = asetxt || 0
        this.key = CryptoJS.enc.Utf8.parse("welcometoqlc0101"); //十六位十六进制数作为密钥
        this.iv = CryptoJS.enc.Utf8.parse('AABBCCDDEEFFGGHH'); //十六位十六进制数作为密钥偏移量
        this.CryptoJS = CryptoJS;
    }
    Decrypt(word, k) {
        let CryptoJS = this.CryptoJS //必须放在头一行 k 必须用 CryptoJS.enc.Utf8.parse 转化一下
        // AES 解密
        let key = this.key
        if (k) {
            key = CryptoJS.enc.Utf8.parse(k)
        }

        let iv = this.iv
        let decrypt = CryptoJS.AES.decrypt(word, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        let decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);

        return decryptedStr.toString();
    }
    Encrypt(word, k) {
        let CryptoJS = this.CryptoJS //必须放在头一行 k 必须用 CryptoJS.enc.Utf8.parse 转化一下
        //ASE 加密
        let key = this.key
        if (k) {
            key = CryptoJS.enc.Utf8.parse(k)
        }
        let iv = this.iv

        let srcs = CryptoJS.enc.Utf8.parse(word);
        let encrypted = CryptoJS.AES.encrypt(srcs, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        encrypted = encrypted.ciphertext.toString().toUpperCase();
        let encryptedHexStr = CryptoJS.enc.Hex.parse(encrypted);
        return CryptoJS.enc.Base64.stringify(encryptedHexStr)
    }
    getaseid(n) {
        n = this.asetxt || n
        n = this.Decrypt(n)
        return {
            ID: n.substr(0, 6),
            RID: n.substr(6, 76),
            USN: n.substr(76, 32),
            O: n
        }
    }
    getrid(k) {
        k = this.asetxt || k
        //console.log('ID USN', this.Decrypt(k))
        return this.getaseid(this.Decrypt(k)).RID
    }
    getserverip() {


        return request(`https://pprouter.online:9001/v1/pprmap/Check?rid=${this.getrid()}`)
            .then((req) => {

                //console.log('getserverip---set wsdata', req)

                return req.data

            })

    }
    getws() {
        let data = settings.get('wsdata') || 0
        let ws;
        if (data) {
            ws = new WebSocket(`wss://${data.ServerHost}:${data.ServerPort}`, "lws-minimal");
        } else {
            ws = new WebSocket('wss://47.244.138.61:18006', "lws-minimal");
        }
        return ws
    }
    async initSodium() {
       
        if (!_sodium) {
            await _sodium.ready;
        }
    }
    sodium(timestamp, privateKey) {
        /*
        @params(timestamp, privateKey)
        @timestamp date
        @privateKey 私钥
        @return timestamp的签名
        */
        
        const sodium = _sodium;
        let tp = sodium.crypto_sign(sodium.from_string(`${timestamp}`), privateKey)
        return tp
    }
    from_string(str) {
        const sodium = _sodium;
        return sodium.from_string(str)
    }
    to_string(str) {
        const sodium = _sodium;
        return sodium.to_string(str)
    }
    sodiumGet(str, k) {
        /*
        @params(str,privateKey)
        @str 需要解密的字符串
        @publicKey 公钥
        @return 解密后的消息
        */

        const sodium = _sodium;
        let key = k || this.key
        //console.log('START sodiumGet---->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>-----')
        let sd = settings.get('sodium')
        //console.log(sd)

        let arr = toNewconfidantObj(str)

        key = arr.emailName[0]['key']

        let privateKey = getUnit8SKPK(sd.privateKey)
        let publicKey = getUnit8SKPK(sd.publicKey)

        //console.log('privateKey', privateKey)

        let sk = sodium.crypto_sign_ed25519_sk_to_curve25519(privateKey);
        let pk = sodium.crypto_sign_ed25519_pk_to_curve25519(publicKey);


        let k2 = toPrivateKey(key)
        //console.log('k2', k2)
        //console.log('解密私钥sk1', sk)

        let ks = ""
        try {
            ks = sodium.crypto_box_seal_open(k2, pk, sk)
        } catch (err) {
            //console.log(err)
        }

        // console.log('ks', ks)
        // console.log('string', dataToString(ks))
        // console.log('from_string', sodium.from_string(ks))
        // console.log('to_string', sodium.to_string(ks))
        ks = dataToString(ks)
        //console.log('END sodiumGet---->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>-----')
        return ks
    }
    crypto_sign_ed25519_sk_to_curve25519(privateKey) {
        const sodium = _sodium;
        let sk = sodium.crypto_sign_ed25519_sk_to_curve25519(privateKey);
        return sk
    }
    crypto_sign_ed25519_pk_to_curve25519(publicKey) {
        const sodium = _sodium;
        let pk = sodium.crypto_sign_ed25519_pk_to_curve25519(publicKey);
        return pk
    }
    crypto_box_seal(key, Pubkey) {
        /*
           @params(key, Pubkey)
           @key {string | Unit8Array}
        */

        const sodium = _sodium;
        let sd = settings.get('sodium')
        // let privateKey = getUnit8SKPK(sd.privateKey)
        let publicKey = getUnit8SKPK(sd.publicKey)
        if (Pubkey) {
            publicKey = Pubkey
        }
        // let sk = sodium.crypto_sign_ed25519_sk_to_curve25519(privateKey);
        if (Object.prototype.toString.call(publicKey) === '[object String]') {
            publicKey = getUnit8SKPK(publicKey)
        }
        let pk = sodium.crypto_sign_ed25519_pk_to_curve25519(publicKey);

        // let k = new Uint8Array(Buffer.from(key))
        let ks = ""
        try {
            ks = sodium.crypto_box_seal(key, pk)
        } catch (err) {
            console.log('<<<<<<<<<<<<<<<<<<<err>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
            console.log(err)

        }

        // let ks2 = sodium.crypto_box_seal_open(ks, pk, sk)

        return ks
    }
    crypto_box_seal_open() {
        const sodium = _sodium;
        let key = "jPWhxw36S+W425TgadLMnQDTiOmNOgwY4mxPZD5Mk7U="
        console.log('START sodiumGet---->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>-----')
        let sd = settings.get('sodium')

        let privateKey = getUnit8SKPK(sd.privateKey)
        let publicKey = getUnit8SKPK(sd.publicKey)

        let sk = sodium.crypto_sign_ed25519_sk_to_curve25519(privateKey);
        let pk = sodium.crypto_sign_ed25519_pk_to_curve25519(publicKey);

        let k2 = toPrivateKey(key)
        //console.log('k2', k2)
        //console.log('sk', sk)


        let ks = sodium.crypto_box_seal_open(k2, pk, sk)
        //console.log('ks', ks)
        //console.log('string', dataToString(ks))
        ks = dataToString(ks)
        //console.log('END sodiumGet---->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>-----')
        return ks
    }
}


function getNewconfidantkeyid(str) {

    if (Object.prototype.toString.call(str) !== '[object String]') return 'getNewconfidantkeyid err 参数类型错误'
    let len
    if (str.indexOf('newconfidantkey') === 0) {
        len = 'newconfidantkey'.length
    } else if (str.indexOf('newconfidantuserid') === 0) {
        len = 'newconfidantuserid'.length
    }
    return str.substr(len)
}

function splitNewconfidant(str) {
    if (Object.prototype.toString.call(str) !== "[object String]") return ['splitNewconfidant err', '参数类型错误']
    let arr = str.split('##')
    let arr2 = []
    for (let i in arr) {
        let str = arr[i].split('&&')
        arr2.push({
            name: str[0],
            key: str[1]
        })
    }
    return arr2
}

function sendMailAES(To, ws) {
    console.log(ws)
    console.log(WinAES)
    console.log(settings.get('msgid'))
    console.log(settings.get('sodium'))

    let sodiumKey = settings.get('sodium')
    // kuangzihui@163.com
    let str = {
        "Action": "CheckmailUkey",
        "Unum": 1,
        "Users": window.btoa(To),
        "Type": 1
    }

    //console.log(getUnit8SKPK(sodiumKey.privateKey))

    let app = {
        appid: 'MIFI',
        timestamp: new Date().getTime(),
        apiversion: 6,
        msgid: settings.get('msgid') + 1,
        offset: 0,
        more: 0
    }

    let tp = WinAES.sodium(app.timestamp, getUnit8SKPK(sodiumKey.privateKey))

    app.Sign = tobase64(tp)
    app.params = str
    app = JSON.stringify(app)
    ws.send(app)
}

function toNewconfidantObj(str) {

    let $str = $(`<div>${str}</div>`)
    let span = $str.find('span')

    let id1 = span.eq(0).attr('id')
    let id2 = span.eq(1).attr('id')

    let newconfidantkey = getNewconfidantkeyid(id1)
    let newconfidantuserid = getNewconfidantkeyid(id2)

    let splitNew = splitNewconfidant(newconfidantkey)

    return {
        newconfidantkey,
        newconfidantuserid,
        emailName: splitNew
    }
}

function toNewconfidantHtml(text, key, uid) {
    /* 返回加密后的html
     *
     * @param  {text}       
     * @param  {key} 
     * @param  {uid} 
     * @return {html}           
     */
    let html = `${text}
  <span style='display:none' id='newconfidantkey${key}'></span>
  <span style='display:none' id='newconfidantuserid${uid}'></span>
  <div myconfidantbegin=''><br /><br /><br /><span>Sent from MyConfidant, the app for encrypted email.</span></div>`
    return html
}

function getUnit8SKPK(k) {
    // 从setting.get 取值后使用这个函数转换成uint8数组
    return new Uint8Array(Object.values(k))
}

function toPrivateKey(d) {
    //base64 解码再转化成 Uint8Array数组
    let arr
    if (Object.prototype.toString.call(d) === "[object String]") {
        try {
            arr = new Uint8Array(Buffer.from(d, 'base64'))
        } catch (error) {
            console.log(error)
            return new Uint8Array()
        }
    } else {
        return new Uint8Array()
    }

    return arr
}

function dataToString(d) {
    // 等同于 Encrypt 方法最后二句的作用
    let re
    try {
        re = Buffer.from(d, 'hex').toString()
    } catch (error) {
        return ""
    }
    return re
}

function sendString(obj, ASE) {
    let str = {
        "Action": "Recovery",
        "RouteId": rd.RID,
        "UserSn": rd.USN,
        "Pubkey": publicKey,
    }

    str = obj

    let app = {
        appid: 'MIFI',
        timestamp: new Date().getTime(),
        apiversion: 6,
        msgid: settings.get('msgid') + 1,
        offset: 0,
        more: 0
    }


    let tp = ASE.sodium(app.timestamp, privateKey)

    app.Sign = tobase64(tp)
    app.params = str
    console.log('set app str')
}

function tobase64(d, k) {
    let type = Object.prototype.toString.call(d)
    let arr = []
    if (type == '[object Number]') {
        d = d + ''
    }
    if (k == 'string') {
        arr = Buffer.from(d, 'hex')
        return arr
    }
    if (k == 'reset') {

        let arr2 = []
        console.log('tobase64 reset', arr)
        for (let i in arr) {
            if (arr[i] > 128) {
                arr2.push(arr[i] - 256)
            } else {
                arr2.push(arr[i])
            }
        }
        console.log('tobase64 reset', arr2)

        return arr2
    }
    if (k == 'get') {
        d = getUnit8SKPK(d)
    }

    arr = Buffer.from(d, 'hex').toString("base64");
    return arr
}



function getNodemailerService(id) {
    let arr = ["Gmail", "163", "QQ", "QQEX", "Outlook365", "iCloud"]
    let arr2 = ["@qq.com", "@163.com"]
    let name = getHost(id)
    let obj = {
        "QQMailbox": "QQEX",
        "163Mail": "163",
        "Gmail": "Gmail",
        "Outlook, Hotmail, live": "Outlook365",
        "iCloud": "iCloud",
        "QQMail": "QQ"
    }
    let email = settings.get('IMAP').Email
    let reName = settings.get('mailConfigre')
    return reName
}
// 切换邮箱服务器
function getHost(name, email) {


    let mailName = ["QQMailbox", "QQMail", "163Mail", "Gmail", "Outlook, Hotmail, live", "iCloud", "Other (IMAP)"]
    switch (name) {
        case 'QQMailbox':
            settings.set('mailConfigre', {
                nodemailerService: 'QQex',
                imapHost: 'imap.exmail.qq.com',
                type: 1,
            });
            return 'imap.exmail.qq.com'
            break;
        case 'QQMail':
            settings.set('mailConfigre', {
                nodemailerService: 'QQ',
                imapHost: 'imap.qq.com',
                type: 2
            });
            return 'imap.qq.com'
            break;
        case '163Mail':
            settings.set('mailConfigre', {
                nodemailerService: '163',
                imapHost: 'imap.163.com',
                type: 3
            });
            return 'imap.163.com'
            break;
        default:
            return 0
    }
}



/* 控制函数，主要控制各种组件之间的显示和隐藏 */
function hideInbox(id) {
    $('#logBoxB').hide();
    if (id === 'setEmailHtml') {
        settings.set('status', 'setEmailHtml')
        hideMenu('.nav')
        $('#logBoxC').css({'display':'flex'})
        $(`#${id},#logBoxC`).show()

    } else if (id === 'loginHtml') {
        settings.set('status', 'loginHtml')
        $('#logBoxC').css({'display':'flex'})
        $(`#${id},#logBoxC,#emailHtml,#new-emall`).show()
        getMail();

    } else if (id === 'setEmailHtmlLogin') {
        settings.set('status', 'setEmailHtmlLogin')
        $('#setEmailHtml,.mailLogin,.max-modal').hide()
        $('.nav,#emailHtml,#new-emall').show()

    } else if (id === '') {

    } else if (id === '') {

    } else if (id === '') {

    } else if (id === '') {

    } else if (id === '') {

    } else if (id === '') {

    }

    settings.set('status', id);
}

function hideMenu(h) {
    $(`#new-emall,${h}`).hide()
}

//保存邮件配置信息
function saveEmail(emObj) {
    let { Email, Password, host } = emObj
    let lastImap = settings.get('IMAP')
    if (!lastImap) {
        getMail({ Email, Password, host,save:1 }, null, null, 2);
        //$('#setMailForm')[0].reset()  

    } else if (lastImap.Email !== Email) {

        getMail({ Email, Password, host,save:1 }, null, null, 2)
        // $('#setMailForm')[0].reset()

    } else {

        getMail({ Email, Password, host,save:1 }, null, null, 2)
        //alert('请忽重复配置邮箱')
        console.log('mailLoginBtn click,请忽重复配置邮箱')
    }

}



function mailNameArraytoBase64(to) {

    if (Object.prototype.toString.call(to) === '[object Array]') {
        let tob = to.map(function (v) {
            return window.btoa(v)
        })
        return tob.join(',')
    } else {
        return false
    }
}

function sendMail(To, ws) {

    let sodiumKey = settings.get('sodium')
    //可测试的邮件地址 345632828@qq.com,kuangzihui@163.com
    let str = {
        Action: "CheckmailUkey",
        Unum: To.length,
        Users: mailNameArraytoBase64(To),
        Type: 1
    }

    console.log(getUnit8SKPK(sodiumKey.privateKey))

    let app = {
        appid: 'MIFI',
        timestamp: new Date().getTime(),
        apiversion: 6,
        msgid: settings.get('msgid') + 1,
        offset: 0,
        more: 0
    }

    let tp = AES.sodium(app.timestamp, getUnit8SKPK(sodiumKey.privateKey))

    app.Sign = tobase64(tp)
    app.params = str
    app = JSON.stringify(app)
    ws.send(app)
}


//加密邮件 字符拼接函数
function toNewconfidantHtml(text, key, uid) {
    /* 返回加密后的html
     *
     * @param  {text}       
     * @param  {key} 
     * @param  {uid} 
     * @return {html}           
     */
    let keys = toNewconfidantkeyString(key)


    let html = `${text}<span style='display:none' id='newconfidantkey${keys}'></span><span style='display:none' id='newconfidantuserid${uid}'></span><div newmyconfidantbegin=''><br /><br /><br /><span>Sent from MyConfidant, the app for encrypted email.</span></div>`
    return html
}

//加密邮件 主函数
function sendMailEncrypt(arr, html) {

    let rand = randomPassword(32)
    let text = AES.Encrypt(html, rand.substr(0, 16))
    let PubKey = toPrivateKey(arr[0].PubKey)
    // rand =''
    let uid = settings.get('UserId')
    let std = AES.crypto_box_seal(rand, PubKey)
    std = tobase64(std)

    let keyArr = arr.map((x) => {
        let key = AES.crypto_box_seal(rand, toPrivateKey(x.PubKey))
        //console.log(key)

        key = tobase64(key)
        let name = x.User
        return { name, key }

    })
    //console.log(keyArr)
    // let keys = toNewconfidantkeyString(keyArr)


    let NewconfidantHtml = toNewconfidantHtml(text, keyArr, uid);

    // let ks = AES.sodiumGet(NewconfidantHtml, rand)
    // let en = AES.Decrypt(text, ks.substr(0, 16))
    //console.log('NewconfidantHtml', NewconfidantHtml)
    return NewconfidantHtml
}

//加密邮件 字符拼接函数二
function toNewconfidantkeyString(arr) {
    let str = ''
    for (let i in arr) {
        let s = `${arr[i].name}&&${arr[i].key}`
        if (str === '') {
            str = str + s
        } else {
            str = str + '##' + s
        }
    }
    return str
}



