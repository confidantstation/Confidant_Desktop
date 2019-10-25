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
                            // console.log('attributes----------------', attrs);
                            // console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
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
   
    getOne(uid) {
        // uid type Array
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
                    let f = imap.fetch(uid, {
                        bodies: ''
                    })

                    f.on('message', function (msg, seqno) {
                        let prefix = '#' + seqno;

                        msg.once('attributes', function (attrs) {
                            // console.log('attributes----------------', attrs);
                            // console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
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