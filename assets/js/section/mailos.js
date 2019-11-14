let nub = 0
function getMail(obj, total) {
    // tag 默认值为Inbox  取值范围 = 'Inbox Node Starred Drafts Sent Spam Trash'
    // 获取最新十封邮件
    let Imap = require('imap')
    let inspect = require('util').inspect;

    const settings = require('electron-settings');

    let uidList =  {} ||settings.get('uidList')
    //let MailParser = require("mailparser").MailParser
    //let fs = require("fs")

    // settings.set('IMAP', {
    //     Email: "18670723672@163.com",
    //     Password: "operactionwall3",
    //     host: "imap.163.com"
    // })


    const setIMAP = {
        Email,
        Password,
        host
    } = obj || settings.get('IMAP')

   
    // let imap = new Imap({
    //     user: Email || '345632828@qq.com',
    //     password: Password || 'cjdfhabfwwaicbbd',
    //     host: host || 'imap.qq.com',
    //     port: 993, //邮箱服务器的端口地址
    //     tls: true, //使用安全传输协议
    //     tlsOptions: {
    //         rejectUnauthorized: false
    //     } //禁用对证书有效性的检查
    // });
    let imap = new Imap({
        user: Email,
        password: Password,
        host: host || 'imap.qq.com',
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
        settings.set('mail_status', 'ready')
       
        //保存配置邮箱参数
        settings.set('IMAP', { Email, Password, host })

        if (obj) {
            // $('.mailLogin,.max-modal').show();
        }
        if(total){
            nub = nub +10
            settings.set('total',{Email:nub})
        }
        openInbox(function (err, box) {
            if (err) throw err;
            //拉取最新 10条邮件
            let seq;
            // if(settings.get('messagesTotal')){
            //     seq = settings.get('messagesTotal') -1
            //     settings.set('messagesTotal',seq)
            // }else{
            //      seq = box.messages.total - 3
            //      settings.set('messagesTotal',seq)
            // }
            // -10 有错误，下周排除
            if(total){
                let n =  settings.get('total').Email
                seq = box.messages.total -  n
               
            }else{
                seq = box.messages.total - 10
            }
            


            let seq1 = [`${seq}:*`]
            let f = imap.seq.fetch(seq1, {
                bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
                struct: true
            });
            f.on('message', function (msg, seqno) {

                //console.log('Message #%d', seqno);
                let prefix = '(#' + seqno + ') ';

                msg.on('body', function (stream, info) {
                    let buffer = '';
                    stream.on('data', function (chunk) {
                        buffer += chunk.toString('utf8');
                    });
                    stream.once('end', function () {
                        // console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
                    });

                });
                msg.once('attributes', function (attrs) {
                    let attr = inspect(attrs, false, 8)
                    // console.log(prefix + 'Attributes: %s', attr);
                    // console.log(attrs.uid)
                    // 获得指定UID的邮件
                    //getMailUid(attrs.uid, setIMAP)
                  
                    let uid = attrs.uid
                    if (!uidList[uid]) {
                        uidList[uid] = uid
                        //settings.set('uidList', uidList)
                        getMailUid(attrs.uid, setIMAP)
                    }
                });
                msg.once('end', function () {
                    // console.log(prefix + 'Finished');
                });
            });
            f.once('error', function (err) {
                settings.set('mail_status', 'f error')
                $('.error').find('error-text').text()
                $('.error').show()
                console.log('Fetch error: ' + err);
                alert('邮箱异常登录，请稍后重试')
            });
            f.once('end', function () {
                settings.set('mail_status', 'f end')
                console.log('Done fetching all messages!');
                imap.end();
            });
        });
    });

    imap.once('error', function (err) {
        // settings.set('mail_status', 'error')
        // $('.error').find('.error-text').text('f error')
        // $('.error').show()
        alert('邮件账号或密码不正确，请重新配置')
        console.log(err);
    });

    imap.once('end', function () {
        settings.set('mail_status', 'end')
        console.log('Connection ended');
    });

    imap.connect();



}

let userlist = []

function getMailUid(uid, setIMAP) {
    // 获取最新十封邮件
    let Imap = require('imap')
    let MailParser = require("mailparser").MailParser
    let fs = require("fs")
    let {
        Email,
        Password,
        host
    } = setIMAP

    let imap = new Imap({
        user: Email,
        password: Password,
        host: host,
        port: 993,
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


            if (err) throw err;

            let f = imap.fetch(uid, {
                bodies: ''
            }); //抓取邮件（默认情况下邮件服务器的邮件是未读状态）

            f.on('message', function (msg, seqno) {
                let prefix = '#' + seqno;
                let mailparser = new MailParser();

                msg.on('body', function (stream, info) {

                    stream.pipe(mailparser); //将为解析的数据流pipe到mailparser

                    //邮件头内容
                    mailparser.on("headers", function (headers) {
                        // console.log(prefix + "-邮件头信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                        // console.log(headers)

                        // console.log("邮件主题: " + headers.get('subject'));
                        // console.log("发件人: " + headers.get('from').text);
                        if (headers.get('to')) {
                            //console.log("收件人: " + headers.get('to').text);
                            to = headers.get('to').text
                            if ($('.myEmail').attr('rel') !== 'setName') {
                                try {
                                    to = to.split(',')
                                    if (to[0].indexOf('<') > -1) {
                                        let name = to[0].match(/\<(.+?)\>/g)

                                        $('.myEmail').text(name[0]).attr('rel', 'setName')
                                        $('.fromImg2').text(name[0].substr(0, 1))
                                    } else {
                                        $('.myEmail').text(to[0]).attr('rel', 'setName')
                                        $('.fromImg2').text(to[0].substr(0, 1))
                                    }

                                } catch (error) {
                                    console.log(error)
                                }

                            }
                        } else {
                            console.log("收件人: " + '');
                        }
                        //console.log(headers.get('dkim-signature'))
                        try {
                            setMailHeader(uid, headers)
                        } catch (error) {
                            console.log(error)
                        }
                       
                        console.log(userlist)
                        settings.set('userlist', userlist)

                    });

                    //邮件内容
                    let file = 0;
                    mailparser.on("data", function (data) {

                        let text32 = ""
                        try {
                            text32 = getHtmlText(data, uid);
                        } catch (error) {
                            console.log(error)
                        }

                        console.log(uid + "-邮件data内容>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                        console.log(data);
                        if (data.release) {
                            let rel = data.release()
                            console.table(rel)
                        };
                        if (data.type === 'text') { //邮件正文
                            console.log(uid + "-邮件text内容信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                            //console.log(data);
                            //console.log("邮件内容: " + data.html);
                            console.log('html->', text32)
                        };
                        if (data.type === 'attachment') { //附件
                            console.log("邮件附件信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                            console.log("附件名称:" + data.filename); //打印附件的名称
                            //data.content.pipe(fs.createWriteStream(data.filename));//保存附件到当前目录下
                            //data.release();
                            file++
                        };
                        //setMailBody(uid, text32, file);

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
    });

    imap.once('error', function (err) {

        console.log(err);
    });

    imap.once('end', function () {
        console.log('关闭邮箱');
    });

    imap.connect();
}

//控制邮箱显示，及以取内容前32个字符 存储邮件
let $inbox = $('.inbox-content')

function getHtmlText(str, uid) {

    if (Object.prototype.toString.call(str.html || str.textAsHtml) !== '[object String]') {
        console.log('getHtmlText(str, uid) 第一个参数不是字符串')
        return ''
    };
    let html;
    if (str.html.indexOf('newconfidantcontent') > 0) {
        str.html = $(str.html).attr('id');
    };
    if (str.html.indexOf('newconfidant') > 0 && str.html.indexOf('newconfidantcontent') < 0) {

        html = str.html;
        str = str.html;
        console.log('html-=-=-=-==');
        console.log(html);
        let n = html.indexOf('<span');
        let strAes = html.substr(0, n);
        console.log('strAes', strAes);

        let ks = WinAES.sodiumGet(html);
        let ka = strAes;
        let en = WinAES.Decrypt(ka, ks.substr(0, 16));

        str = en || str

        console.log('str', str)
        console.log('END sodiumGet---->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>-----')
    } else {
        if (str.html) {
            str = str.html;
            let $str = $(str);


            if ($str.length === 0) {
                return ''
            } else {
                html = $str.find('tr').text() || $(str).find('div').text() || $(str).find('p').text()
            };

        } else {
            str = str.textAsHtml || str.text
            html = $(str).text()
        };

    };

    uid = uid || "";
    str = str || "";

    //let instr = `<div class="email-uid emHtml${uid}" uid="${uid}">${str}</div>`;
    let inhtml = `<object type="text/html" data="new.html" style="width:vw;height:100vh;background:#fff;display:block"  class="email-uid emHtml${uid}" uid="${uid}">${str}</object>`
    $inbox.append(inhtml);


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
    console.log(html)
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

// 设置邮箱列表（导航) .section-scroll

function setMailHeader(uid, headers) {
    /*
    JSON.stringify(from) == {"value":[{"address":"lagou@mail.lagoujobs.com","name":"拉勾网"}],"html":""
    */
   
    
    console.log(`setMailHeader-----------`)
    console.log("邮件主题: " + headers.get('subject'));
    console.log("发件人: " + headers.get('from').text);
    console.log("收件人: " + headers.get('to').text);
    let date = moment(headers.get('date')).format('MM-DD');
    console.log("发件日期: " + date);

    let fromObj = headers.get('from');
    let toObj = headers.get('to');
    if (Object.prototype.toString.call(toObj) === "[object Object]") {
        toObj = JSON.stringify(toObj)
    }
    if (Object.prototype.toString.call(fromObj) === "[object Object]") {
        fromObj = JSON.stringify(fromObj)
    }

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


    userlist.push({
        from,
        date,
        subject,
        to
    })

    let $uid = $(`.emuid${uid}`)
    if ($uid.length > 0) {
        $(`.emuid${uid}`).html(html)
    } else {
        $('#section-scrollDiv').prepend(html)
    }



}

function sortEmail(html) {


}

function getGBK32(str) {
    if (str == "") return ""
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