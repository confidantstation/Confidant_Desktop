const {
    app,
    BrowserWindow,
    Menu
} = require('electron')
const glob = require('glob')
const path = require('path')
app.commandLine.appendSwitch('ignore-certificate-errors')
// 保持对window对象的全局引用，如果不这么做的话，当JavaScript对象被
// 垃圾回收的时候，window对象将会自动的关闭
let win, debug

debug = {
    log: 0,
    width: 1300,
    height: 800,
}
if (debug.log === 0) {
    debug.width = 300;
    debug.height = 400;
}

//是否打开debug 调试
// debug.log = 0

//载入所有进程间通信的JS
loadIpcMain()

function createWindow() {
    // 创建浏览器窗口。
    win = new BrowserWindow({
        width: debug.width || 300,
        height: debug.height || 400,
        frame: false,
        resizable: false,
        setMovable: true,
        transparent: true,
        alwaysOnTop: false,
        webPreferences: {
            nodeIntegration: true
        }
    })

    //   Menu.setApplicationMenu(null)

    // 加载index.html文件
    win.loadFile('index.html')

    // 打开开发者工具
    if (debug.log) {
        win.maximize()
        win.webContents.openDevTools()
    }


    // 当 window 被关闭，这个事件会被触发。
    win.on('closed', () => {
        // 取消引用 window 对象，如果你的应用支持多窗口的话，
        // 通常会把多个 window 对象存放在一个数组里面，
        // 与此同时，你应该删除相应的元素。
        win = null
    })
}

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', createWindow)

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // 在macOS上，当单击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (win === null) {
        createWindow()
    }
})

const remoteObj = {
    name: '1st',
};

const getRemoteObject = (event) => {
    // 一秒后修改 remoteObj.name 的值
    // 并通知渲染进程重新打印一遍 remoteObj 对象
    setTimeout(() => {
        remoteObj.name = 'modified name';
        win.webContents.send('modified');
    }, 3000);

    return remoteObj;
}

// 挂载方法到 app 模块上，供 remote 模块使用
app.getRemoteObject = getRemoteObject;



function loadIpcMain() {
    const files = glob.sync(path.join(__dirname, 'app/main-process/**/*.js'))
    files.forEach((file) => {
        require(file)
    })
}