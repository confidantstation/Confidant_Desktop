//引入 electron-settings 模块来 定义全局变量
const settings = require('electron-settings');
//二维码插件
const jsQR = require("jsqr");

//设置自加1 变量msgid
if (settings.get('msgid') < 1) {
    settings.set('msgid', 1)
}

//settings.set('CircleQRcode',{})
//settings.set('circle', {})
if (!settings.get('circle')) {
    settings.set('circle', {})
}


/* 暂存代码区
settings.set('msgid', settings.get('msgid') + 1)
*/
// winWS 全局的ws
window.winWS = ""
let QRcode, CircleQRcode, WinAES
//设置登录状态，方便之后的email.js 模块启动
settings.set('status', 0);
settings.set('wsdata', 0)
let testdata = settings.get('wsdata');
console.log(testdata)
settings.set('IMAP', "")

// settings.set('arr',[1,2,3,4,5,6])

// let a1 = settings.get('arr')
// console.log(a1)
// console.log(a1[0])

// a1.push('jjjjj')
// console.log(a1)


$(function () {
    // 退出
    $('.footerQuit').click(function () {
        window.close()
    });


    //导入账户 存储功能
    if (settings.get('QRcode')) {

        let initAesjs = new aesjs()
        initAesjs.initSodium() // 初始化  aesjs

        let getqrc = settings.get('QRcode')
        console.log(getqrc)
        if (Object.prototype.toString.call(getqrc.data) === "[object String]") {
            QRcode = getqrc.data.split(',')
            console.log(QRcode[0])
            console.log(QRcode[0] == 'type_3')
            if (QRcode[0] == 'type_3') {
                $('#logBox').hide();
                $('#logBoxA').show();
                let username = window.atob(QRcode[3])
                settings.set('username', username)
                $('.usernameSpan').text(username)
            } else {
                $('#logBox,#logBoxA').show()
                alert('请导入你的私钥')
            }
        }

    }

    $(".ImportBtnAccount").click(function () {
        //导入账户

        let _this = $(this)
        let canvas = document.getElementById("logBoxCanvas")
        let ctx = canvas.getContext("2d")
        $("#upload").click(); //隐藏了input:file样式后，点击头像就可以本地上传
        $("#upload").on("change", function () {
            let objUrl = getObjectURL(this.files[0]); //获取图片的路径，该路径不是图片在本地的路径
            if (objUrl) {
                _this.attr("src", objUrl); //将图片路径存入src中，显示出图片
                let img = new Image();
                img.onload = function () {
                    // 将图片画到canvas上面上去！

                    ctx.drawImage(img, 0, 0, 400, 400);
                    let imgData = ctx.getImageData(0, 0, 400, 400);
                    console.log(imgData)
                    // const code = jsQR(imgData, 400, 400);
                    const code = jsQR(imgData.data, 400, 400);

                    console.log('QRcode', code)

                    settings.set('QRcode', code); // 获得二维码的code
                    QRcode = code.data.split(',')
                    console.log(QRcode[0])
                    console.log(QRcode[0] == 'type_3')
                    if (QRcode[0] == 'type_3') {
                        $('#logBox').hide();
                        $('#logBoxA').show();
                        let username = window.atob(QRcode[3])
                        settings.set('username', username)
                        $('.usernameSpan').text(username)
                    } else {
                        alert('请导入你的私钥')
                    }


                }
                img.src = objUrl;

            }
        });

    });


    // 导入圈子存储功能-函数
    function setcircle(val, status) {

        let arr = settings.get('circle');

        if (Object.prototype.toString.call(arr) === "[object Object]") {

            let usn = val.params.UserSn
            let name = val.params.RouterName
            if (Object.prototype.toString.call(name) === "[object String]") {
                name = window.atob(name)
            } else {
                name = "Undefined"
            }

            $('.modalMt').attr('usn', usn)
            arr[usn] = val
            settings.set('UserId', usn)
            settings.set('circle', arr);
            if (status) {
                for (let i in arr) {
                    let $usn = $(`.u${usn}`)
                    if ($usn.length === 0) {
                        $('.modalMt').prepend(`<p class="u${usn}" usn="${usn}">${name.substr(0,12)}</p>`)
                        $('.mt-text').text(`${name.substr(0,12)}`)
                    }
                }
            } else {
                showMtlist(arr, name)
            }

        }

    }

    function showMtlist(d, name) {
        // if (!d[s]) {
        //     $('.modalMt').prepend(`<p class="u${s}" usn="${s}">${s.substr(0,12)}</p>`)
        // }
        for (let s in d) {
            let name = d[s].params.RouterName
            name = window.atob(name)
            $('.modalMt').prepend(`<p class="u${s}" usn="${s}">${name.substr(0,12)}</p>`)
        }
        $('.mt-text').text($('.modalMt').find('p').eq(0).text())
    }

    // 导入圈子存储功能

    CircleQRcode = settings.get('CircleQRcode')

    if (Object.prototype.toString.call(CircleQRcode) === "[object Object]") {
        try {
            CircleQRcode = CircleQRcode.data.split(',')
            if (CircleQRcode[0] == 'type_1') {

                let ASE = new aesjs(CircleQRcode[1])
                ASE.initSodium()
                let rd = ASE.getaseid()

                let data // set wsdata
                data = ASE.getserverip()

                data.then((req) => {
                    return req
                }).then((req) => {


                    settings.set('wsdata', req)
                    let wsdata = req
                    let privateKey = toPrivateKey(QRcode[1])
                    let publicKey = privateKey.slice(-32);

                    let ts1 = [-64, 18, 65, -98, 95, 105, 80, 8, 106, 78, -81, 94, -56, -115, 27, -108, 67, 3, 57, 97, 72, -78, 90, 19, -79, -55, 26, -93, -109, -104, 16, -96]
                    let ts2 = [192, 18, 65, 158, 95, 105, 80, 8, 106, 78, 175, 94, 200, 141, 27, 148, 67, 3, 57, 97, 72, 178, 90, 19, 177, 201, 26, 163, 147, 152, 16, 160]

                    let ts3 = tobase64('wBJBnl9pUAhqTq9eyI0blEMDOWFIsloTsckao5OYEKA=', 'reset')

                    console.log(ts3)

                    let ts6 = ASE.from_string(ts2)

                    //let ts3 = ASE.crypto_box_seal('aaa',ts2)

                    publicKey = tobase64(publicKey)
                    console.log('CircleQRcode ', CircleQRcode)
                    console.log('toPrivateKey ', QRcode)
                    console.log('privateKey', privateKey)
                    console.log('publicKey', publicKey)
                    //设置密钥
                    settings.set('sodium', {
                        privateKey,
                        publicKey: toPrivateKey(publicKey),

                    })

                    let str = {
                        "Action": "Recovery",
                        "RouteId": rd.RID,
                        "UserSn": rd.USN,
                        "Pubkey": publicKey,
                    }

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
                    settings.set('app', app);

                    //let data = settings.get('wsdata') || 0

                    if (Object.prototype.toString.call(wsdata) === '[object Object]') {
                        console.log(`wss://${wsdata.ServerHost}:${wsdata.ServerPort}`)
                        ws = new WebSocket(`wss://${wsdata.ServerHost}:${wsdata.ServerPort}`, "lws-minimal");

                        ws.onopen = function () {
                            let str = app || settings.get('app')
                            str.msgid = settings.get('msgid')
                            str = JSON.stringify(str)
                            console.log('send app ', str)
                            ws.send(str);
                            //alert("数据发送中...");

                        };


                        ws.onmessage = function (evt) {
                            //alert('接收消息成功...')
                            console.log('接收消息成功...', evt)
                            console.log('data...', evt.data)
                            let data = JSON.parse(evt.data)
                            console.log('data', data)
                            if (data.params.RetCode === 0) {
                                let datas = data.params

                                let str1 = {
                                    Action: "Login",
                                    RouteId: datas.RouteId,
                                    UserSn: datas.UserSn,
                                    UserId: datas.UserId,
                                    RouterName: datas.RouterName,
                                    Sign: 1,
                                    DataFileVersion: 6,
                                    NickName: datas.NickName
                                }
                                let circle1 = {
                                    appid: 'MIFI',
                                    timestamp: new Date().getTime(),
                                    apiversion: 6,
                                    msgid: settings.get('msgid') + 1,
                                    offset: 0,
                                    more: 0
                                }
                                circle1.params = str1
                                console.log('circle----------------------', circle1)
                                settings.set('circle1', circle1)

                                setcircle(circle1);


                                $('#logBoxA').hide();
                                $('#logBoxB').show();
                                ws.close()

                            }
                        };

                        ws.onclose = function () {
                            // 关闭 websocket
                            console.log('ws onclose')
                        };
                    } else {
                        alert('wsdata 不存在！进入模拟测试环节')
                        $('#logBoxA').hide();
                        $('#logBoxB').show();

                    }
                })

            } else {
                alert('请导入你的圈子')
            }
        } catch (error) {
            console.log(error)
        }

        settings.set('msgid', settings.get('msgid') + 1)
    }
    console.table(CircleQRcode)

    // 导入圈子 本地存储


    $('.footerImpor').click(function () {
        $('.ImportBtnCircle').click()
    })
    $('.ImportBtnCircle').click(function () {
        //导入圈子
        settings.set('msgid', settings.get('msgid') + 1)
        let _this = $(this)
        let privateKey = toPrivateKey(QRcode[1])
        let name = window.atob(QRcode[3])
        let UserSn = QRcode[2]
        console.log('privateKey', privateKey)
        console.log('name', name)
        console.log('UserSn', UserSn)

        let canvas = document.getElementById("logBoxCanvasA")
        let ctx = canvas.getContext("2d")
        $("#uploadA").click(); //隐藏了input:file样式后，点击头像就可以本地上传
        $("#uploadA").on("change", function () {

            let objUrl = getObjectURL(this.files[0]); //获取图片的路径，该路径不是图片在本地的路径
            if (objUrl) {
                _this.attr("src", objUrl); //将图片路径存入src中，显示出图片
                let img = new Image();
                img.onload = function () {
                    // 将图片画到canvas上面上去！

                    ctx.drawImage(img, 0, 0, 400, 400);
                    let imgData = ctx.getImageData(0, 0, 400, 400);
                    console.log(imgData)
                    // const code = jsQR(imgData, 400, 400);
                    const code = jsQR(imgData.data, 400, 400);

                    console.log('CircleQRcode', code)

                    settings.set('CircleQRcode', code); // 获得二维码的code
                    CircleQRcode = code.data.split(',')
                    console.log('CircleQRcode[0]', CircleQRcode[0])
                    console.log(CircleQRcode[0] == 'type_1')
                    if (CircleQRcode[0] == 'type_1') {

                        let ASE = new aesjs(CircleQRcode[1])
                        ASE.initSodium()
                        let rd = ASE.getaseid()

                        console.log('206 getaseid', rd)
                        console.log(rd.O)
                        console.log('ID', rd.ID)
                        console.log('RID', rd.RID)
                        console.log('RID', rd.RID.length)
                        console.log('USN', rd.USN)
                        console.log('USN', rd.USN.length)

                        let data // set wsdata
                        data = ASE.getserverip()

                        data.then((req) => {
                            return req
                        }).then((req) => {

                            settings.set('wsdata', req)
                            let wsdata = req
                            let privateKey = toPrivateKey(QRcode[1])
                            let publicKey = privateKey.slice(-32);

                            let ts1 = [-64, 18, 65, -98, 95, 105, 80, 8, 106, 78, -81, 94, -56, -115, 27, -108, 67, 3, 57, 97, 72, -78, 90, 19, -79, -55, 26, -93, -109, -104, 16, -96]
                            let ts2 = [192, 18, 65, 158, 95, 105, 80, 8, 106, 78, 175, 94, 200, 141, 27, 148, 67, 3, 57, 97, 72, 178, 90, 19, 177, 201, 26, 163, 147, 152, 16, 160]

                            let ts3 = tobase64('wBJBnl9pUAhqTq9eyI0blEMDOWFIsloTsckao5OYEKA=', 'reset')

                            console.log(ts3)

                            let ts6 = ASE.from_string(ts2)

                            //let ts3 = ASE.crypto_box_seal('aaa',ts2)

                            publicKey = tobase64(publicKey)
                            console.log('CircleQRcode ', CircleQRcode)
                            console.log('toPrivateKey ', QRcode)
                            console.log('privateKey', privateKey)
                            console.log('publicKey', publicKey)
                            //设置密钥
                            settings.set('sodium', {
                                privateKey,
                                publicKey: toPrivateKey(publicKey),

                            })

                            let str = {
                                "Action": "Recovery",
                                "RouteId": rd.RID,
                                "UserSn": rd.USN,
                                "Pubkey": publicKey,
                            }

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
                            settings.set('app', app);

                            //let data = settings.get('wsdata') || 0

                            if (Object.prototype.toString.call(wsdata) === '[object Object]') {
                                console.log(`wss://${wsdata.ServerHost}:${wsdata.ServerPort}`)

                                let ws = new WebSocket(`wss://${wsdata.ServerHost}:${wsdata.ServerPort}`, "lws-minimal");

                                ws.onopen = function () {
                                    let str = app || settings.get('app')
                                    str.msgid = settings.get('msgid')
                                    str = JSON.stringify(str)
                                    console.log('send app ', str)
                                    ws.send(str);
                                    //alert("数据发送中...");

                                };


                                ws.onmessage = function (evt) {
                                    //alert('接收消息成功...')
                                    console.log('接收消息成功...', evt)
                                    console.log('data...', evt.data)
                                    let data = JSON.parse(evt.data)
                                    console.log('data', data)
                                    if (data.params.RetCode === 0) {
                                        let datas = data.params
                                        let str1 = {
                                            Action: "Login",
                                            RouteId: datas.RouteId,
                                            UserSn: datas.UserSn,
                                            UserId: datas.UserId,
                                            RouterName: datas.RouterName,
                                            Sign: 1,
                                            DataFileVersion: 6,
                                            NickName: datas.NickName
                                        }
                                        let circle1 = {
                                            appid: 'MIFI',
                                            timestamp: new Date().getTime(),
                                            apiversion: 6,
                                            msgid: settings.get('msgid') + 1,
                                            offset: 0,
                                            more: 0
                                        }
                                        circle1.params = str1
                                        console.log('circle----------------------', circle1)
                                        settings.set('circle1', circle1)

                                        setcircle(circle1, 1);


                                        $('#logBoxA').hide();
                                        $('#logBoxB').show();
                                        ws.close()

                                    }
                                };

                                ws.onclose = function () {
                                    // 关闭 websocket
                                    console.log('ws onclose')
                                };
                            } else {
                                alert('wsdata 不存在！进入模拟测试环节')
                                $('#logBoxA').hide();
                                $('#logBoxB').show();

                            }
                        })

                    } else {
                        alert('请导入你的圈子')
                    }
                    // then 结束
                }
                img.src = objUrl;

            }
            // end click
        });

    });



    const {
        remote
    } = require('electron');
    $('.ImportBtnLogin').click(function () {
        /* 邮件配置测试*/
        //debugger;
        let setMail = '';
        let IMAP = settings.get('IMAP')

        if (IMAP) {
            setMail = 'loginHtml'
        } else {
            setMail = 'setEmailHtml'
        }

        //选择圈子登录
        let usn = $('.modalMt').attr('usn')
        let circleArr = settings.get('circle') || []
        app = circleArr[usn]
        let privateKey = toPrivateKey(QRcode[1])

        let ASE = new aesjs(CircleQRcode[1])
        let tp = ASE.sodium(app.timestamp, privateKey)
        WinAES = ASE

        app.params.Sign = tobase64(tp)
        app = JSON.stringify(app)
        console.log('app login', app)
        //alert("登录...");

        let wsdata = settings.get('wsdata') || 0

        let ws = new WebSocket(`wss://${wsdata.ServerHost}:${wsdata.ServerPort}`, "lws-minimal");

        ws.onopen = function () {
            ws.send(app);
        }
        ws.onmessage = function (evt) {
            //alert('接收消息成功...')
            console.log('接收消息成功...', evt)
            console.log('data...', evt.data)
            let data = JSON.parse(evt.data)
            console.log('data', data)
            if (data.retcode > 0) {

                hideInbox(setMail)

                remote.getCurrentWindow().setSize(1032, 600)
                //remote.getCurrentWindow().maximize()
                remote.getCurrentWindow().center()

               
                ws.close();

            }
            if (data.params) {
                let params = data.params
                if (params.Action === "CheckmailUkey") {
                    console.log('CheckmailUkey')
                }
            }

        }

        ws.onclose = function () {
            // 关闭 websocket
            console.log('ws onclose')
        };
    })



    //切换圈子
    $('.mt').click(function () {
        $('.modalMt').toggle();
    })

    $(document).on('click', '.modalMt p', function () {
        let usn = $(this).attr('usn')
        $('.modalMt').attr('usn', usn).hide()
        $('.mt-text').text($(this).text())
    })

})