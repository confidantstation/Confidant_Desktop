const heartBeat = {
  timeout: 60000, // 1分钟
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
      var message = {
        'data': {
          'type': '95001', // 事件类型编码
          'info': '{}', // 消息主体内容,业务组件自定义,可为空字符串或JSON字符串
          'time': new Date().getTime(), // 时间
          'deviceId': '', // 设备编码
          'traceId': '', // 染色ID
          'spanId': '0', // 日志ID
          'terminalID': '' // 前端页面的终端编码（唯一），可为空串
        }
      }
      ws.send(JSON.stringify(message))//数据格式这里默认是字符串，是字符串还是JSON格式看你们的后台开发而定
      self.serverTimeoutObj = setTimeout(function () {
        ws.onclose()
      }, self.timeout)
    }, this.timeout)
  }
}



/** webSocket 请求封装 */
function InitWebSocket (wsuri) {
  this.wsuri = wsuri// webSocket的请求地址
  this.lockReconnect = false // 避免重连的机制
  this.HeartCheck = heartBeat
  
  this.try = null// 尝试重连
  this.heartBeatClock = null// 心跳连接的setTimeout函数
  var _this = this
 
  this.initWebSocket = function () { // 重启一个新的webSockt
    _this.websocket = new WebSocket(_this.wsuri)
    _this.websocket.onmessage = function (e) {
      const redata = e.data
      // 一旦收到数据不管是甚么数据，说明活着
      // this.HeartCheck.start(this.websocket)
      if (parseInt(redata.data.type, 10) === 95001) {
        _this.HeartCheck.reset(_this.websocket)// 发送心跳信息
      }
      _this.onmessage(redata) //调用用户自定义的数据处理方式
    }
    _this.websocket.onclose = function (e) {
      console.log('WebSocket连接关闭')
      clearTimeout(_this.try)
      _this.try = setTimeout(() => {
        _this.reconnectWebSocket()
      }, 5000)
    }
    _this.websocket.onopen = function () {
      console.log('WebSocket连接成功2222222')
      _this.HeartCheck.start(_this.websocket)
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
  this.initWebSocket()
  return this
}
 
InitWebSocket.prototype.onopen = function () {}
InitWebSocket.prototype.onmessage = function () {}// 便于外部重新定义方法处理数据
InitWebSocket.prototype.send = function (data) {
  this.websocket.send(data)
}

