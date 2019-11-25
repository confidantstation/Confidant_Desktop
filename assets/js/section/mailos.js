let nub = 0;
// 设置邮箱列表（导航) .section-scroll
let $sectionScrollDiv = $('#section-scrollDiv')
let $inboxSection = $('#inbox-section')

function SaveEmailConf(conf) {

    let wsdata = settings.get('wsdata') || 0
    console.log(WinAES)

    let sodium = settings.get('sodium');
    console.log(sodium)
    console.log(tobase64(sodium.publicKey, 'get'))

    const config = settings.get('mailConfigre');
    const {
        Email,
        Password,
        host
    } = conf;

    if (!config) {
        //alert('mailConfigre undefined')
        return 'mailConfigre undefined'
    }

    let Type = config.type

    let str = {
        Action: "SaveEmailConf",
        Version: 1,
        Caller: 0,
        Type,
        User: window.btoa(Email),
        Config: "test",
        Userkey: sodium.publicKeyString,
    }

    let app = {
        appid: 'MIFI',
        timestamp: new Date().getTime(),
        apiversion: 6,
        msgid: settings.get('msgid') + 1,
        offset: 0,
        more: 0
    }

    let privateKey = getUnit8SKPK(sodium.privateKey)
    let tp = WinAES.sodium(app.timestamp, privateKey)

    app.Sign = tobase64(tp)
    app.params = str

    console.log('set app str')


    // try {
    //     $('.myEmail').text(Email)
    //     $('.fromImg2,.userLogoMenu').text(Email.substr(0, 1))

    // } catch (error) {
    //     console.log(error)
    // }
    // 配置主用户头像
    $('.fromImg2,.userLogoMenu').text(Email.substr(0, 1))

    let obj = settings.get('db_email') || {}

    let data = JSON.stringify(conf)


    let li = `<li id='db_${Email}' data='${data}'>
                <div class="spanA">
                    <div class="centerDiv fromImg2" style="color: #fff;">
                    ${Email.substr(0, 1)}
                    </div>
                </div>
                <div class="spanB myEmail">${Email}</div>
                <div class="spanC" style="display:none"><img src="assets/img/tabbar_hook.png"></div>
            </li>`
    let li2 = `<li id='db_${Email}' data='${data}'>
                    <div class="spanA">
                        <div class="centerDiv fromImg2" style="color: #fff;">
                        ${Email.substr(0, 1)}
                        </div>
                    </div>
                    <div class="spanB myEmail">${Email}</div>
                    <div class="spanC"><img src="assets/img/tabbar_hook.png"></div>
                </li>`

    obj[Email] = li
    let ul = ''

    for (let i in obj) {
        obj[i] = obj[i].replace('<img src="assets/img/tabbar_hook.png">', "")

    }

    for (let i in obj) {
        if (i == nowEmail) {
            obj[Email] = li2
        }
        ul += obj[i]
    }

    $('#db_listEmail').html(ul)

    settings.set('db_email', obj)
    hideInbox('setEmailHtmlLogin')
};

function imapSearch(imap) {}

function setmax(max, min) {
    let s = max - min
    let arr = []
    for (let i = 0; i + min <= max; i++) {
        let x = min + i
        arr.push(x)
    }
    return arr
}

let userlist = []
let noRepeat = {}
let emhead = {}
let emlist = {}
let seps = []

function getMail(obj, total, setTotal, notifNub) {
    /**
     * getMail, returning null.
     *
     * @param  {object} obj  保存邮件账号密码等信息
     * @param  {number} total  用于指定滚动时拉取的邮件和函数外定义的nub配合使用
     * @param  {number} setTotal 设置需要拉取多少封邮件,设置此参数时请把total设置成null,同时控制正确登录时候系统提示的内容
     * @param  {number} notifNub  用于指定需要弹出的提示
     */
    // tag 默认值为Inbox  取值范围 = 'Inbox Node Starred Drafts Sent Spam Trash'
    // 获取最新十封邮件
    const Imap = require('imap')
    const fs = require("fs")    
    const inspect = require('util').inspect;
    const MailParser = require("mailparser").MailParser
    const settings = require('electron-settings');

    const setIMAP = {
        Email,
        Password,
        host,
        nowEmail
    } =  settings.get('IMAP') || obj



    let imap = new Imap({
        user: Email,
        password: Password,
        host: host,
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

        //保存配置邮箱参数
        if (notifNub == 1) {
            const log1 = notif({
                title: '你好，' + Email,
                body: '邮件已切换'
            })
        }
        if (notifNub == 2) {
            const log2 = notif({
                title: '你好，' + Email,
                body: '邮件配置成功'
            })
        }

        if (nowEmail) {
            settings.set('nowEmail', nowEmail)
            $('#db_listEmail').attr('now', nowEmail)
        } else {
            nowEmail = Email
        }

        settings.set('IMAP', {
            Email,
            Password,
            host,
            status: 'ready',
            nowEmail
        })
        //判断用户是否配置过邮箱
        SaveEmailConf({
            Email,
            Password,
            host,
            nowEmail
        })
        if (total) {
            nub = nub + total
            settings.set('total', {
                Email: nub
            })
        }
        if (setTotal) {
            settings.set('total', {
                Email: setTotal
            })
        };

        openInbox(function (err, box) {

            console.log("打开邮箱")
            //$('.max-modal2').show()
            console.log('max-modal.show()')
            if (err) throw err;

            //         if (err) throw err;
            //拉取最新 10条邮件

            let ntl, seq
            if (total) {
                ntl = settings.get('total').Email
                seq = box.messages.total - ntl

            } else if (setTotal) {
                ntl = settings.get('total').Email
                seq = box.messages.total - ntl
            } else {
                seq = box.messages.total - 10
                ntl = 10
            }
           

            //seq = box.messages.total - 4

            let seq1 = [`${seq}:*`]
            console.log('seq1', seq1)

            // let f = imap.seq.fetch(seq1, {
            //     bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
            //     struct: true
            // });


            let k = 0;
            console.log('box.messages.total', box.messages.total)
            //imap.search(['ALL'], function (err, results) {//搜寻2017-05-20以后未读的邮件

            // console.log(results)
            // console.log(results.pop() )
            // let max = results.pop()  // 邮件最大值
            // let seq1 = [`${seq}:*`]  // 邮件最小值
            // if (err) throw err;
            // let xm = setmax(max,box.messages.total)
            // xm = xm.slice(-10)
           
            if(total){
                seq1 = [seq]
            }
            if(Object.prototype.toString.call(obj)==="[object Number]"){
                seq1 = [obj]
            }
            let f = imap.seq.fetch(seq1, {
                bodies: ''
              
            });


            f.on('message', function (msg, seqno) {

                var mailparser = new MailParser();

                msg.on('body', function (stream, info) {

                    stream.pipe(mailparser); //将为解析的数据流pipe到mailparser

                    //邮件头内容
                    mailparser.on("headers", function (headers) {
                        console.log(info.seqno)
                       
                        if (!noRepeat[info.seqno]) {
                            try {
                                console.log('setMailHeader', info.seqno)
                                setMailHeader(info.seqno, headers,total)
                            } catch (error) {

                            }
                        }
                        noRepeat[info.seqno] = 1
                    });

                    //邮件内容

                    mailparser.on("data", function (data) {

                        

                        if (data.type === 'text') { //邮件正文
                            console.log("邮件内容信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                            //console.log("邮件内容: " + data.html);
                            try {
                                let text32 = getHtmlText(data, info.seqno);
                            } catch (error) {
    
                            }
                        }
                        // if (data.type === 'attachment') {//附件
                        //     console.log("邮件附件信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                        //     console.log("附件名称:"+data.filename);//打印附件的名称
                        //     data.content.pipe(fs.createWriteStream(data.filename));//保存附件到当前目录下
                        //     data.release();
                        // }
                    });

                });
                msg.once('end', function () {
                    // console.log(seqno + '完成');
                    // let emarr = settings.get('emhead', emhead)
                    // console.log(emarr[seqno])
                });
            });
            f.once('error', function (err) {
                console.log('抓取出现错误: ' + err);
            });
            f.once('end', function () {
                console.log('所有邮件抓取完成!');
                //$('.max-modal2').hide()
                // let emarr = settings.get('emhead', emhead)
                // console.log(emarr)
                imap.end();
            });
            //});
        });
    });

    imap.once('error', function (err) {

        console.log(err);
        $('.mailLogin').hide()
        const logs = notif({
            title: '错误提示',
            body: '邮箱异常登录，请输入正确的用户名和密码'
        })
    });

    imap.once('end', function () {

        console.log('Connection ended');
        $('.max-modal').hide()
    });

    imap.connect();
}





//控制邮箱显示，及以取内容前32个字符 存储邮件
let $inbox = $('.inbox-content')

function getHtmlText(str, uid) {

    if(uid === 658){
        debugger
    }
   
    // html 用来返回邮件文本内容的文本，在邮件列表栏，一般显示前16个字符
    // console.log(Object.prototype.toString.call(str.html))
    // console.log(str)

    if (Object.prototype.toString.call(str) !== '[object Object]') {
        console.log('getHtmlText(str, uid) 第一个参数不是对象')
        return ''
    }
    let html;

    str.html = str.html || str.textAsHtml;
    if (Object.prototype.toString.call(str.html) !== '[object String]') {
        str.html = ""
    }
    if (str.html.indexOf('newconfidantcontent') > 0) {
        str.html = $(`<div>${str.html}</div>`).find('span:last').attr('id')
        if (Object.prototype.toString.call(str.html) !== '[object String]') {
            str.html = ""
        }
        let shtml = str.html.replace('newconfidantcontent', '')
        console.log(shtml)
        str.html = window.atob(shtml)

    };
    if (str.html.indexOf('newconfidantpass') > 0 && str.html.indexOf('newconfidantcontent') < 0) {
        html = '请手动解密'
        str = `<div style='padding:30px;'>请手动解密</div>`

    } else if (str.html.indexOf('newconfidant') > 0 && str.html.indexOf('newconfidantcontent') < 0) {

        html = str.html;
        str = str.html;
        // console.log('html-=-=-=-==');
        // console.log(html);
        let n = html.indexOf('<span');
        let strAes = html.substr(0, n);
        // console.log('strAes', strAes);

        let ks = WinAES.sodiumGet(html);
        let ka = strAes;
        let en = WinAES.Decrypt(ka, ks.substr(0, 16));

        str = en || str

        // console.log('str', str)
        console.log('END sodiumGet---->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>-----')
    } else {
        if (str.html) {
            str = str.html;
            let $str = $(str);
            if (str) {
                html = str
            }

            // if ($str.length === 0) {
            //     return ''
            // } else {
            //     html = $str.find('tr').text() || $(str).find('div').text() || $(str).find('p').text()
            // };

        } else {
            str = str.textAsHtml || str.text
            html = $(str).text()
        };

    };

    uid = uid || "";
    str = str || "";


    //let instr = `<div class="email-uid emHtml${uid}" uid="${uid}">${str}</div>`;
    let inhtml = `<object type="text/html" data="${'_uid' + uid + window.btoa(uid)}.html"  class="email-uid emHtml${uid}" uid="${uid}">${str}</object>`
    //$inbox.append(inhtml);

    //$inbox.html(inhtml)
    let $emHtml = $inbox.find(`.emHtml${uid}`)
    if ($emHtml.length) {
        $emHtml.html(str)
    } else {
        $inbox.append(inhtml);
    };

    html = html.replace(/\s+/g, ' ');
    if (html[0] == " ") {
        html = html.substr(1, 33);
    } else {
        html = html.substr(0, 32);
    };

    return html
}

function setMailBody(uid, text, file) {
    let html = $('#list-emall section').find('.list-emallDiv')
    let str = ''
    if (file > 0) {
        str = `<p class="font12">Figure out what<span class="annex"><em>${file || ""}</em><img
        src="assets/img/Search/tabbar_attach_unselected.png"></span></p>
        <p class="font12">${getGBK32(text) || ""}</p>`
    } else {
        str = `<p class="font12">${getGBK32(text) || ""}</p>`
    }
    console.log('setMailBody--------------')
    //console.log(html)
    html.each(function () {
        let _this = $(this)
        let id = _this.attr('uid')
        if (id == uid) {
            //console.log('each uid', uid)
            if (_this.find('.emallDivB p').length > 0) {
                _this.find('.emallDivB').html(str)
            } else {
                try {
                    _this.find('.emallDivB').append(str)
                } catch (error) {
                    console.log(error)
                }
            }


        }
    })
}


function setMailHeader(uid, headers,add) {
    /*
    JSON.stringify(from) == {"value":[{"address":"lagou@mail.lagoujobs.com","name":"拉勾网"}],"html":""
    */


    console.log(`setMailHeader-----------uid=` + uid)
    console.log("邮件主题: " + headers.get('subject'));
    console.log("发件人: " + headers.get('from').text);
    console.log("收件人: " + headers.get('to').text);
    console.log("收件人value: " + headers.get('to').value);
    //console.log(headers);
    let date = moment(headers.get('date')).format('MM-DD HH:mm:ss');
    console.log("发件日期: " + date);

    //let fromObj = headers.get('from');
    let toObj = headers.get('to') || "";
    let to = headers.get('to').text
    // if (Object.prototype.toString.call(toObj) === "[object Object]") {
    //     toObj = JSON.stringify(toObj)
    // }
    // if (Object.prototype.toString.call(fromObj) === "[object Object]") {
    //     fromObj = JSON.stringify(fromObj)
    // }

    let from = headers.get('from').text
    if (from.length) {
        from = from.split("<")[0]
    }
    let fromImg = from.substr(0, 1)
    let subject = headers.get('subject')
    subject = getGBK32(subject)

    let html = `<div class="list-emallDiv emuid${uid}" uid="${uid}">
    <div class="emallDivA jusCenter">
        <div class="fromImg">${fromImg}</div>
    </div>
        <div class="emallDivB">
            <p class="font12"><span class="from">${from}</span><span class="time date">${date}</span></p>
            <p class="font12"><span class='subject'>${subject}</span><span class="to" style="display:none">${to}</span></p>
            <p class="font12"><span class="annex" style="display:none"><em></em><img src="assets/img/Search/tabbar_attach_unselected.png"></span></p>
        <p class="font12"></p>
        </div>
    </div>`
    // 排序显示

    // html2 用于向 $(`.emuid${uid}`) 重新插入列表
    let html2 = `<div class="emallDivA jusCenter">
        <div class="fromImg">${fromImg}</div>
    </div>
        <div class="emallDivB">
            <p class="font12"><span class="from">${from}</span><span class="time date">${date}</span></p>
            <p class="font12"><span class='subject'>${subject}</span><span class="to" style="display:none">${to}</span></p>
            <p class="font12"><span class="annex" style="display:none"><em></em><img src="assets/img/Search/tabbar_attach_unselected.png"></span></p>
        <p class="font12"></p>
        </div>`


    userlist.push({
        toObj,
        from,
        date,
        subject,
        to,
        setHtml: html
    });

    emhead[uid] = html;
    settings.set('emhead', emhead)
    let $uid = $inboxSection.find(`.emuid${uid}`);

    if ($uid.length > 0) {
        $uid.html(html2)
    } else {
        if(add){
            $sectionScrollDiv.append(html)
        }else{
            $sectionScrollDiv.prepend(html)
        }
       

    };
}

function sortEmail(html) {


}

function mailHtmlDecrypt(){

}

function getGBK32(str) {
    if (!objcall(str, 'str')) return ""
    let gbk = getBLen(str)
    //console.log('gbk', gbk)
    let ask = str.length
    let strb = ""
    let d = '...'

    if (gbk > ask) {
        strb = str.substr(0, 16)
    } else {
        strb = str.substr(0, 30)
    }
    if (str.length != strb.length) {
        strb += d
    }
    return strb
}

function getBLen(str) {

    var len = 0;
    for (var i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 127 || str.charCodeAt(i) == 94) {
            len += 2;
        } else {
            len++;
        }
    }
    return len;
}

function notif(obj) {
    const notificaton = {
        title: obj.title || '错误提示',
        body: obj.body || 'notif配置参数不正确请,请看文档配置'
    }
    const log = new window.Notification(notificaton.title, notificaton)
    return log
}