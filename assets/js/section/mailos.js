class mailos {
    constructor() {
        this.Imap = require('imap')
        this.MailParser = require("mailparser").MailParser
        this.fs = require("fs")
        this.list = []
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
        let _this = this
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

                        msg.once('attributes', function (attrs) {

                            let key = attrs.uid + ""
                            attrs['seqno'] = prefix
                            mlist[key] = attrs
                        });



                        msg.once('end', function () {
                            console.log(seqno + '完成');
                            //console.log(mlist)
                            _this.list = mlist
                        });
                        // end f
                    });

                    f.once('error', function (err) {
                        console.log('抓取出现错误: ' + err);
                    });
                    f.once('end', function () {
                        console.log(_this.list)
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
            console.log('this.list', this.list)
            console.log('关闭邮箱');
        });

        imap.connect();

    }


}



function getMail(user, password) {
    // 获取最新十封邮件
    let Imap = require('imap')
    //let MailParser = require("mailparser").MailParser
    //let fs = require("fs")
    let inspect = require('util').inspect;
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
            if (err) throw err;
            //拉取最新 10条邮件
            let seq = box.messages.total - 3
            let seq1 = [`${seq}:*`]
            let f = imap.seq.fetch(seq1, {
                bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
                struct: true
            });
            f.on('message', function (msg, seqno) {

                console.log('Message #%d', seqno);
                let prefix = '(#' + seqno + ') ';


                msg.on('body', function (stream, info) {
                    let buffer = '';
                    stream.on('data', function (chunk) {
                        buffer += chunk.toString('utf8');
                    });
                    stream.once('end', function () {
                        console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
                    });

                });
                msg.once('attributes', function (attrs) {
                    let attr = inspect(attrs, false, 8)
                    console.log(prefix + 'Attributes: %s', attr);
                    console.log(attrs.uid)
                    getMailUid(attrs.uid)
                });
                msg.once('end', function () {
                    console.log(prefix + 'Finished');
                });
            });
            f.once('error', function (err) {
                console.log('Fetch error: ' + err);
            });
            f.once('end', function () {
                console.log('Done fetching all messages!');
                imap.end();
            });
        });
    });

    imap.once('error', function (err) {
        console.log(err);
    });

    imap.once('end', function () {
        console.log('Connection ended');
    });

    imap.connect();

    // end getMail
}

function getMailUid(uid) {
    // 获取最新十封邮件
    let Imap = require('imap')
    let MailParser = require("mailparser").MailParser
    let fs = require("fs")

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
                        console.log(prefix + "-邮件头信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                        console.log(headers)

                        console.log("邮件主题: " + headers.get('subject'));
                        console.log("发件人: " + headers.get('from').text);
                        if (headers.get('to')) {
                            console.log("收件人: " + headers.get('to').text);
                        } else {
                            console.log("收件人: " + '');
                        }
                        //console.log(headers.get('dkim-signature'))

                        setMailHeader(uid, headers)
                    });

                    //邮件内容
                    let file = 0
                    mailparser.on("data", function (data) {

                        let text32 = getHtmlText(data, uid)
                        console.log(uid + "-邮件data内容>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                        console.log(data)
                        if (data.release) {
                            let rel = data.release()
                            console.table(rel)
                        }
                        if (data.type === 'text') { //邮件正文
                            console.log(uid + "-邮件text内容信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                            //console.log(data);
                            //console.log("邮件内容: " + data.html);
                            console.log('html->', text32)
                        }
                        if (data.type === 'attachment') { //附件
                            console.log("邮件附件信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                            console.log("附件名称:" + data.filename); //打印附件的名称
                            //data.content.pipe(fs.createWriteStream(data.filename));//保存附件到当前目录下
                            //data.release();
                            file++
                        }
                        setMailBody(uid, text32, file)

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

//控制邮箱如果显示，及以取内容前32个字符
function getHtmlText(str, uid) {
    let html
    if (str.html && str.html.indexOf('newconfidant') > 0) {
        html = str.html
        str = str.html
        console.log('html-=-=-=-==')
        console.log(html)
        let n = html.indexOf('<span')
        let strAes = html.substr(0, n)
        console.log(strAes)
        let ks = WinAES.sodiumGet(strAes)
        let ka = '4x2fHgATrmWCiL9soNsJ9XnsGwEkfA5DKzHIwBU3d6HkbDgCQSpnaOIYILMAhwZU8Ex620Wr/6GyWudTaXwKmg=='
        let en = WinAES.Decrypt(ka, ks.substr(0, 16))
        // alert(en)
        // console.log(ks)
        // alert(ks)
        // ks.then((res) => {
        //     let en = WinAES.Decrypt(ka, res.substr(0, 16))
        //     alert(en)
        //     return res
        // }).then((res) => {
        //     alert(res)
        // })

        str = en || str

        console.log(str)
        console.log('END sodiumGet---->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>-----')
    } else {
        if (str.html) {
            str = str.html
            html = $(str).find('tr').text() || $(str).find('div').text() || $(str).find('p').text()
        } else {
            str = str.textAsHtml || str.text
            html = $(str).text()
        };

    }

    $('.inbox-content').append(`<div class="email-uid emHtml${uid}" uid="${uid}">${str}</div>`);

    html = html.replace(/\s+/g, ' ');
    if (html[0] == " ") {
        html = html.substr(1, 33)
    } else {
        html = html.substr(0, 32)
    }



    return html
}

function setMailBody(uid, text, file) {
    let html = $('#list-emall section').find('.list-emallDiv')
    let str = ''
    if (file > 0) {
        str = `<p class="font12">Figure out what<span class="annex"><em>${file}</em><img
        src="assets/img/Search/tabbar_attach_unselected.png"></span></p>
        <p class="font12">${getGBK32(text)}</p>`
    } else {
        str = `<p class="font12">${getGBK32(text)}</p>`
    }
    console.log('setMailBody--------------')
    console.log(html)
    html.each(function () {
        let _this = $(this)
        let id = _this.attr('uid')
        if (id == uid) {
            console.log('each uid', uid)
            _this.find('.emallDivB').append(str)


        }
    })
}


// 设置邮箱列表（导航)


function setMailHeader(uid, headers) {

   
    console.log(`setMailHeader-----------`)
    console.log("邮件主题: " + headers.get('subject'));
    console.log("发件人: " + headers.get('from').text);
    let to = headers.get('to')
    if (headers.get('to')) {
        console.log("收件人: " + headers.get('to').text);
        to = headers.get('to').text
    } else {
        console.log("收件人: " + '');
        to = ''
    }
    let date = moment(headers.get('date')).format('MM-DD');
    console.log("发件日期: " + date);
    let from = headers.get('from').text
    let fromImg = from.substr(0, 1)
    let subject = headers.get('subject')



    subject = getGBK32(subject)

    let html = `<div class="list-emallDiv emuid${uid}" uid="${uid}">
    <div class="emallDivA jusCenter">
        <div class="fromImg">${fromImg}</div>
    </div>
        <div class="emallDivB">
            <p class="font12"><span class='subject'>${subject}</span><span class="time date">${date}</span></p>
            <p style="display:none"><span class="to">${to}</span><span class="from">${from}</span></p>
        </div>
    </div>`
    $('#list-emall section').prepend(html)
    // let seqClass = $list.find(`seq${seq}`)
    // if (seqClass) {
    //     seqClass.html(html)
    // } else {
    //     $list.append(html)
    // }
}

function getGBK32(str) {
    let gbk = getBLen(str)
    console.log('gbk', gbk)
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


