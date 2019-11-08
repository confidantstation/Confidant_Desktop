//引入 electron-settings 模块来 定义全局变量
const settings = require('electron-settings');
//二维码插件
const jsQR = require("jsqr");

//设置自加1 变量msgid
if (!settings.get('msgid')) {
    settings.set('msgid', 1)
} else {
    if (settings.get('msgid') < 50) {
        settings.set('msgid', 50)
    }
}

/* 暂存代码区
settings.set('msgid', settings.get('msgid') + 1)
*/
// winWS 全局的ws
window.winWS = ""
let QRcode, CircleQRcode, WinAES
//设置登录状态，方便之后的email.js 模块启动
settings.set('status', 0);



$(function () {

    $(".ImportBtnAccount").click(function () {
        //导入账户
        require('./assets/js/imports');
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
                    } else {
                        alert('请导入你的私钥')
                    }


                }
                img.src = objUrl;

            }
        });

    });
    $('.ImportBtnCircle').click(function () {
        //导入圈子
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

                        ASE.getserverip()
                        let privateKey = toPrivateKey(QRcode[1])
                        let publicKey = privateKey.slice(-32);

                        let ts1 = [-64, 18, 65, -98, 95, 105, 80, 8, 106, 78, -81, 94, -56, -115, 27, -108, 67, 3, 57, 97, 72, -78, 90, 19, -79, -55, 26, -93, -109, -104, 16, -96]
                        let ts2 = [192, 18, 65, 158, 95, 105, 80, 8, 106, 78, 175, 94, 200, 141, 27, 148, 67, 3, 57, 97, 72, 178, 90, 19, 177, 201, 26, 163, 147, 152, 16, 160]
                        
                        let ts3 = tobase64('wBJBnl9pUAhqTq9eyI0blEMDOWFIsloTsckao5OYEKA=', 'reset')
                        let ts4 = tobase64(publicKey)
                        console.log(ts3)
                        //debugger;

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

                        let data = settings.get('wsdata') || 0

                        if (data) {
                            ws = new WebSocket(`wss://${data.ServerHost}:${data.ServerPort}`, "lws-minimal");
                        } else {
                            alert('wsdata 不存在！')
                            ws = new WebSocket('wss://47.244.138.61:18006', "lws-minimal");
                        }
                        ws.onopen = function () {
                            let str = settings.get('app')
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
                                    Sign: 1,
                                    DataFileVersion: 6,
                                    NickName: datas.NickName
                                }
                                let app1 = {
                                    appid: 'MIFI',
                                    timestamp: new Date().getTime(),
                                    apiversion: 6,
                                    msgid: settings.get('msgid') + 1,
                                    offset: 0,
                                    more: 0
                                }
                                app1.params = str1
                                console.log('app1----------------------', app1)
                                settings.set('login', app1)
                                settings.set('UserId', str1.UserId)
                                //ws.close();
                                $('#logBoxA').hide();
                                $('#logBoxB').show();


                            }
                        };

                        ws.onclose = function () {
                            // 关闭 websocket
                            console.log('ws onclose')
                        };

                    } else {
                        alert('请导入你的圈子')
                    }

                }
                img.src = objUrl;

            }
        });

    });



    const {
        remote
    } = require('electron');
    $('.ImportBtnLogin').click(function () {
        /* 邮件配置测试*/
        let setMail = $(this).attr('rel') || 'loginHtml';

        //选择圈子登录
        let app = settings.get('login')
        let privateKey = toPrivateKey(QRcode[1])

        let ASE = new aesjs(CircleQRcode[1])
        let tp = ASE.sodium(app.timestamp, privateKey)
        WinAES = ASE

        app.params.Sign = tobase64(tp)
        app = JSON.stringify(app)
        console.log('app login', app)
        //alert("登录...");

        let data = settings.get('wsdata') || 0

        if (data) {
            ws = new WebSocket(`wss://${data.ServerHost}:${data.ServerPort}`, "lws-minimal");
        } else {
            alert('wsdata 不存在！')
            ws = new WebSocket('wss://47.244.138.61:18006', "lws-minimal");
        }

        ws.onopen = function () {
            ws.send(app);
        }
        ws.onmessage = function (evt) {
            //alert('接收消息成功...')
            console.log('接收消息成功...', evt)
            console.log('data...', evt.data)
            let data = JSON.parse(evt.data)
            console.log('data', data)
            if (data.retcode == 225) {

                hideInbox(setMail)
                // if(setMail==='setEmail'){
                //     $('#logBoxC').show()
                //     hideInbox(setMail)
                //     settings.set('status', 'setEmail');
                // }else{
                //     $('#logBoxC,#emailHtml').show()

                //     settings.set('status', 'login');
                // }

                remote.getCurrentWindow().setSize(1032, 600)
                //remote.getCurrentWindow().maximize()
                remote.getCurrentWindow().center()


                require('./assets/js/section/email.js');

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

})