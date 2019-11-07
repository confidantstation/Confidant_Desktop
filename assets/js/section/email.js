
$(function () {
    let status = settings.get('status')
    if (status === 'loginHtml') {
        getMail();
    }else if(status === 'setEmailHtml'){

    }


    $(document).on('click', '.list-emallDiv', function () {

        let data = settings.get('wsdata') || 0
        let ws
        if (data) {
            ws = new WebSocket(`wss://${data.ServerHost}:${data.ServerPort}`, "lws-minimal");
        } else {
            alert('wsdata 不存在！')
            ws = new WebSocket('wss://47.244.138.61:18006', "lws-minimal");
        }

        ws.onopen = function () {
            sendMailAES('345632828@qq.com',ws)
        }
        ws.onmessage = function (evt) {
            //alert('接收消息成功...')
            console.log('接收消息成功...', evt)
            console.log('data...', evt.data)
            let data = JSON.parse(evt.data)
            console.log('data', data)
            if(data.params){
                let params = data.params
                if(params.Action ==="CheckmailUkey"){
                    settings.set('CheckmailUkey', data);
                }

            }

        }

        ws.onclose = function () {
            // 关闭 websocket
            console.log('ws onclose')
        };

        let uid = $(this).attr('uid')
        console.log('list uid', uid)
        $('.inbox-emall footer').hide()
        $('.email-uid').hide()
        $('.email-uid').each(function () {
            let id = $(this).attr('uid')
            if (id == uid) {
                $(this).show()
                $('.inbox-emall footer').show().attr('uid', uid)
            }
        })

       
    });
    $('.list-search').click(function () {
        getMail()
    })
})

function sendMailAES(To,ws){
    console.log(ws)
    console.log(WinAES)
    console.log(settings.get('msgid'))
    console.log(settings.get('sodium'))

    let sodiumKey = settings.get('sodium')
    // kuangzihui@163.com
    let str = {
        "Action": "CheckmailUkey",
        "Unum": 1,
        "Users":window.btoa(To) ,
        "Type": 1
    }

    console.log(getUnit8SKPK(sodiumKey.privateKey) )

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