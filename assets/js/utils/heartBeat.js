

const heartBeat = {
  timeout: 30000, // 1分钟
  timeoutObj: null,
  serverTimeoutObj: null,
  reset: function (ws) {
    clearTimeout(this.timeoutObj)
    clearTimeout(this.serverTimeoutObj)
    this.start(ws)
  },
  start: function (ws) {

    console.log('start')
    var self = this
    this.timeoutObj && clearTimeout(this.timeoutObj)
    this.serverTimeoutObj && clearTimeout(this.serverTimeoutObj)
    this.timeoutObj = setTimeout(function () {
      // 这里发送一个心跳，后端收到后，返回一个心跳消息，
      // onmessage拿到返回的心跳就说明连接正常

      let user = settings.get('userConfige');

      let app = {
        appid: 'MIFI',
        timestamp: new Date().getTime(),
        apiversion: 6,
        msgid: settings.get('msgid') + 1,
        offset: 0,
        more: 0,
        params: {
          "Action": "HeartBeat",
          "UserId": user.UserId,
          "Active": 0,
        }
      }


      let privateKey = toPrivateKey(QRcode[1])

      let tp = WinAES.sodium(app.timestamp, privateKey)

      app.Sign = tobase64(tp)
      app = JSON.stringify(app)
      console.log('app login', app)


      ws.send(app)//数据格式这里默认是字符串，是字符串还是JSON格式看你们的后台开发而定
      self.serverTimeoutObj = setTimeout(function () {
        ws.onclose()
      }, self.timeout)
    }, this.timeout)
  }
}






/** webSocket 请求封装 */
function InitWebSocket(wsuri) {
  this.wsuri = wsuri || 0// webSocket的请求地址
  this.lockReconnect = false // 避免重连的机制
  this.HeartCheck = heartBeat
  this.status = 0
  this.try = null// 尝试重连
  this.heartBeatClock = null// 心跳连接的setTimeout函数
  var _this = this

  this.initWebSocket = function () { // 重启一个新的webSockt
   
      if (Object.prototype.toString.call(_this.wsuri) === "[object String]") {
        _this.websocket = new WebSocket(_this.wsuri, "lws-minimal")
        _this.status = 'start'
      } else {
        let data = settings.get('wsdata') || 0
        if (data) {
          _this.websocket = new WebSocket(`wss://${data.ServerHost}:${data.ServerPort}`, "lws-minimal");
          _this.status = 'start'
        } else {
          alert('initWebSocket wsdata 不存在！')
          return false
        }
      }
   

    _this.websocket.onmessage = function (e) {

      const redata = e.data
      console.log(e)
      // 一旦收到数据不管是甚么数据，说明活着
      // this.HeartCheck.start(this.websocket)
      if (e) {
        _this.HeartCheck.reset(_this.websocket)// 发送心跳信息
      }
      _this.onmessage(redata)    //调用用户自定义的数据处理方式
    }
    _this.websocket.onclose = function (e) {
      console.log('WebSocket连接关闭')
      clearTimeout(_this.try)
      _this.try = setTimeout(() => {
        _this.reconnectWebSocket()
      }, 5000)
    }
    _this.websocket.onopen = function () {
      console.log('WebSocket连接成功')
      _this.HeartCheck.start(_this.websocket)
      let type = Object.prototype.toString.call(_this.onopen)
      console.log(type)

      _this.onopen()
    }
    // 连接发生错误的回调方法
    _this.websocket.onerror = function () {
      console.log('WebSocket连接发生错误')
      clearTimeout(_this.try)
      _this.try = setTimeout(() => {
        _this.reconnectWebSocket()
      }, 5000)
    }
  }
  this.reconnectWebSocket = function () {
    console.log('connect again')
    // this.log = '重连中:' + datePattern(new Date(), 'yyyy-MM-dd HH:mm:ss')
    if (_this.lockReconnect) {
      return
    };
    _this.lockReconnect = true
    // 没连接上会一直重连，设置延迟避免请求过多
    _this.heartBeatClock && clearTimeout(this.heartBeatClock)
    _this.heartBeatClock = setTimeout(() => {
      _this.initWebSocket()
      _this.lockReconnect = false
    }, 5000)
  }
  this.getAppStr = function (str, ) {
    let user = settings.get('userConfige');

    let msgid = settings.get('msgid') + 1;
    let params = str || {}
    settings.set('msgid', msgid);
    let app = {
      appid: 'MIFI',
      timestamp: new Date().getTime(),
      apiversion: 6,
      msgid,
      offset: 0,
      more: 0,
      params,
    }


    let privateKey = toPrivateKey(QRcode[1])

    let tp = WinAES.sodium(app.timestamp, privateKey)

    app.Sign = tobase64(tp)
    app = JSON.stringify(app)
    console.log('app login', app)
    return app
  }
  this.initWebSocket()
  return this
};

function objcall(val,str){

  let type =  Object.prototype.toString.call(val)
  if(!str){
    return type
  }
  if(Object.prototype.toString.call(str)==="[object String]"){
    str = str.charAt(0).toUpperCase() + str.slice(1)
  }else{
    console.log( '第二个参数必须是字符串')
    return '第二个参数必须是字符串'
  }
  type = type.slice(7)
  if(type.indexOf(str)>0){
    return true
  }
  return false
}

