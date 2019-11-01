const moment = require('moment');

function getObjectURL(file) {
    var url = null;
    if (window.createObjectURL != undefined) { // basic
        url = window.createObjectURL(file);
    } else if (window.URL != undefined) { // mozilla(firefox)
        url = window.URL.createObjectURL(file);
    } else if (window.webkitURL != undefined) { // webkit or chrome
        url = window.webkitURL.createObjectURL(file);
    }
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
        return encrypted.ciphertext.toString().toUpperCase();
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
        console.log('ID USN', this.Decrypt(k))
        return this.getaseid(this.Decrypt(k)).RID
    }
    getserverip() {
        return request(`https://pprouter.online:9001/v1/pprmap/Check?rid=${this.getrid()}`)
            .then((req) => {
                console.log('getserverip---set wsdata', req)
                settings.set('wsdata', req.data)
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
    async initSodium(){
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
    sodiumGet(str) {
        /*
        @params(str,privateKey)
        @str 需要解密的字符串
        @publicKey 公钥
        @return 解密后的消息
        */

        const sodium = _sodium;
        let key = `Cgguqfmkj4+0wCN+5GN1D3ygLILCd8IL0O/8mtNzaVKHC2TDV3bCdeafUQLwZX9V4w0VgZ7VGU0j8ZMVChIC1QOtlU6RLOpC+WYkjM0prYc=`
        console.log('START sodiumGet---->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>-----')
        let sd = settings.get('sodium')
        console.log(sd)

        let arr = toNewconfidantObj(str)
      
        key = arr.sodiumKey[0]
       
        let privateKey = getUnit8SKPK(sd.privateKey)
        let publicKey = getUnit8SKPK(sd.publicKey)


        console.log('privateKey', privateKey)

        let sk = sodium.crypto_sign_ed25519_sk_to_curve25519(privateKey);
        let pk = sodium.crypto_sign_ed25519_pk_to_curve25519(publicKey);

        let k2 = toPrivateKey(key)
        console.log('k2', k2)
        console.log('sk', sk)


        let ks = sodium.crypto_box_seal_open(k2, pk, sk)
        console.log('ks', ks)
        console.log('string', dataToString(ks))
        ks = dataToString(ks)
        console.log('END sodiumGet---->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>-----')
        return ks
    }
}


function getNewconfidantkeyid(str) {
    let len 
    if (str.indexOf('newconfidantkey')===0) {
       len = 'newconfidantkey'.length
    }else if(str.indexOf('newconfidantuserid')===0){
       len = 'newconfidantuserid'.length
    }
    return str.substr(len)
  }

  function splitNewconfidant(str) {
    let arr = str.split('&&')
    let obj = {
      emailName: arr[0].split('##'),
      sodiumKey: arr[1].split('##')
    }
    return obj
  }

  function toNewconfidantObj(str) {

    let $str = $(`<div>${str}</div>`)
    let span = $str.find('span')

    let id1 = span.eq(0).attr('id')
    let id2 = span.eq(1).attr('id')

    let newconfidantkey = getNewconfidantkeyid(id1)
    let newconfidantuserid = getNewconfidantkeyid(id2)

    let {emailName,sodiumKey} = splitNewconfidant(newconfidantkey)
   
    return {
      newconfidantkey,
      newconfidantuserid,
      emailName,
      sodiumKey
    }
  }

function getUnit8SKPK(k) {
    // 从setting.get 取值后使用这个函数转换成uint8数组
    return new Uint8Array(Object.values(k))
}

function toPrivateKey(d) {
    let arr = new Uint8Array(Buffer.from(d, 'base64'))
    return arr
}

function dataToString(d) {
    return Buffer.from(d, 'hex').toString()
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
        let bf = Buffer.from(d, 'base64');
        console.log('bfbfbf', bf)
        //arr = new Int8Array(bf)
        return toPrivateKey(d)
    }

    arr = Buffer.from(d, 'hex').toString("base64");
    return arr
}

function getMail(user, password) {
    let nub = 0,
        btn = 0
    const Imap = require('imap')
    const MailParser = require("mailparser").MailParser
    const fs = require("fs")
    const inspect = require('util').inspect;
    let imap = new Imap({
        user: '345632828@qq.com', //你的邮箱账号
        password: 'cjdfhabfwwaicbbd', //你的邮箱密码
        host: 'imap.qq.com', //邮箱服务器的主机地址
        port: 993, //邮箱服务器的端口地址
        tls: true, //使用安全传输协议
        tlsOptions: {
            rejectUnauthorized: false
        } //禁用对证书有效性的检查
    });

    function openInbox(cb) {
        imap.openBox('INBOX', true, cb);
    }

    imap.once('ready', function () {

        openInbox(function (err, box) {
            console.log("打开邮箱")

            if (err) throw err;
            let Arr = [
                ['HEADER', 'SUBJECT', '3']
            ]
            //Arr = [ 'UNSEEN',['SUBJECT', 'BAE'] ]
            //[ ['OR', 'UNSEEN', ['SINCE', 'April 20, 2010'] ] ]
            Arr = ['ALL', ['SINCE', 'Sept 16, 2019']]
            //Arr = [ ['OR', 'UNSEEN',['SINCE', 'Sept 8, 2019'] ] ]
            imap.search(Arr, function (err, results) {
                if (btn == 0) {
                    imap.delFlags(results, '\\Flagged', function (fat) {
                        console.log('还原标星邮件')
                        console.log(fat)
                    });
                } else if (btn == 1) {
                    imap.setFlags(results, '\\Flagged', function (fat) {
                        console.log('标星邮件')
                        console.log(fat)
                    });
                } else if (btn == 3) {
                    // imap.move(results,'INBOX',function(rf){
                    //   console.log(rf)
                    // });
                    imap.setFlags(results, '\\Deleted', function (fat) {
                        console.log('删除邮件')
                        console.log(fat)
                    });
                }

                //搜寻2017-05-20以后未读的邮件

                if (err) throw err;

                let f = imap.fetch(results, {
                    bodies: '',
                    uid: 611
                }); //抓取邮件（默认情况下邮件服务器的邮件是未读状态）

                f.on('message', function (msg, seqno) {
                    let prefix = '(#' + seqno + ') ';
                    let mailparser = new MailParser();

                    msg.on('body', function (stream, info) {
                        stream.pipe(mailparser); //将为解析的数据流pipe到mailparser
                        console.log('mailparser', mailparser)
                        let mailList = ""

                        msg.once('attributes', function (attrs) {
                            console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
                            //console.log(attrs);
                        });

                        mailparser.on("headers", function (headers) {
                            let str = {
                                subject: headers.get('subject') || 0,
                                from: headers.get('from') && headers.get('from').text,
                                to: headers.get('to') && headers.get('to').text
                            }

                            //console.log('headers',headers)
                            console.log("邮件头信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                            console.log("邮件主题: " + str.subject);
                            console.log("发件人: " + str.from);
                            console.log("收件人: " + str.to);
                            nub++
                            console.log('nub', nub)

                        });

                        //邮件内容
                        mailparser.on("data", function (data) {
                            if (data.type === 'text') { //邮件正文
                                // console.log("邮件内容信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                                // console.log("邮件内容: " + data.html);
                                //$('.email-from').html(data.html)
                                let html = $('.inbox-content').html();
                                html = html + data.html
                                $('.inbox-content').html(html)
                            }
                            // if (data.type === 'attachment') {//附件
                            //   console.log("邮件附件信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                            //   console.log("附件名称:"+data.filename);//打印附件的名称
                            //   data.content.pipe(fs.createWriteStream(data.filename));//保存附件到当前目录下
                            //   data.release();
                            // }
                        });

                    });



                    msg.once('end', function () {
                        console.log(seqno + '完成');
                    });
                });

                f.once('error', function (err) {
                    console.log('抓取出现错误: ' + err);
                });
                f.once('end', function () {
                    console.log('所有邮件抓取完成!');
                    imap.end();
                });
            });
            // end search
        });
    });

    imap.once('error', function (err) {
        console.log(err);
    });

    imap.once('end', function () {
        console.log('关闭邮箱');
    });

    imap.connect();
}

class mailos2 {
    constructor() {
        this.Imap = require('imap')
        this.MailParser = require("mailparser").MailParser
        this.fs = require("fs")
    }
    geta() {
        alert(1)
    }
    init() {
        const Imap = this.Imap
        return new Imap({
            user: '345632828@qq.com', //你的邮箱账号
            password: 'cjdfhabfwwaicbbd', //你的邮箱密码
            host: 'imap.qq.com', //邮箱服务器的主机地址
            port: 993, //邮箱服务器的端口地址
            tls: true, //使用安全传输协议
            tlsOptions: {
                rejectUnauthorized: false
            } //禁用对证书有效性的检查
        });

    }

    getlist() {
        let imap = this.init()
        const MailParser = this.MailParser
        let mlist = []
        const fs = this.fs

        function openInbox(cb) {
            imap.openBox('INBOX', true, cb);
        }


        imap.once('ready', function () {

            openInbox(function (err, box) {
                console.log("打开邮箱")

                if (err) throw err;
                let Arr = ['ALL', ['SINCE', 'Oct 22, 2019']]

                imap.search(Arr, function (err, results) {
                    if (err) throw err;
                    let f = imap.fetch(results, {
                        bodies: ''
                    })

                    f.on('message', function (msg, seqno) {
                        let prefix = '#' + seqno;

                        const mailparser = new MailParser();

                        msg.on('body', function (stream, info) {

                            stream.pipe(mailparser); //将为解析的数据流pipe到mailparser
                            //console.log('mailparser', mailparser)

                            msg.once('attributes', function (attrs) {
                                // console.log('attributes----------------', attrs);
                                // console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
                                let key = attrs.uid + ""
                                attrs['seqno'] = prefix
                                mlist[key] = attrs
                            });

                            mailparser.on("headers", function (headers) {
                                let str = {
                                    subject: headers.get('subject') || 0,
                                    from: headers.get('from') && headers.get('from').text,
                                    to: headers.get('to') && headers.get('to').text,
                                    date: headers.get('date'),
                                }

                                console.log("邮件头信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                                console.log("邮件主题: " + str.subject);
                                console.log("发件人: " + str.from);
                                console.log("收件人: " + str.to);
                                str.date = moment(str.date).format('YYYY-MM-DD HH:mm:ss');
                                console.log("时间：" + str.date);
                                // let html = $('.inbox').html()
                                // html = html + `<p>${str.subject}--${str.date}</p>`
                                // $('.inbox').html(html)
                            });

                            //邮件内容
                            mailparser.on("data", function (data) {

                                if (data.type === 'text') { //邮件正文
                                    console.log("邮件内容信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                                    //console.log(data.html);
                                    let $tr = $(data.html).find('tr')
                                    let txt = $tr.eq(0).text()
                                    txt = txt.replace(/^\s*|\s*$/g, "");
                                    console.log(txt.substr(0, 132))
                                    let html = $('.inbox-content').html();
                                    html = html + data.html
                                    $('.inbox-content').html(html)

                                }
                                // if (data.type === 'attachment') {//附件
                                //   console.log("邮件附件信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                                //   console.log("附件名称:"+data.filename);//打印附件的名称
                                //   data.content.pipe(fs.createWriteStream(data.filename));//保存附件到当前目录下
                                //   data.release();
                                // }
                            });

                        });



                        msg.once('end', function () {
                            console.log(seqno + '完成');
                            console.log(mlist)
                        });
                        // end f
                    });

                    f.once('error', function (err) {
                        console.log('抓取出现错误: ' + err);
                    });
                    f.once('end', function () {
                        console.log('所有邮件抓取完成!');


                        imap.end();
                    });
                });
                // end search
            });
            // end ready
        });

        imap.once('error', function (err) {
            console.log(err);
        });

        imap.once('end', function () {
            console.log('关闭邮箱');
        });

        imap.connect();
    }
}