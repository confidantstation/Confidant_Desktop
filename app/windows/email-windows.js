const {
    BrowserWindow
} = require('electron').remote
const {
    ipcRenderer
} = require('electron')
const path = require('path')
const settings = require('electron-settings');
// const newWindowBtn = document.getElementById('sendEmail')
// newWindowBtn.addEventListener('click', (event) => {

// })

$('#sendEmail').click(function () {

    let uid = $(this).parent().attr('uid')
    settings.set('uid', uid)

    const modalPath = path.join('file://', __dirname, '../../html/windows/modal.html?a=1&b=2')
    ipcRenderer.send('open-information-dialog')
    let win = new BrowserWindow({
        width: 760,
        height: 600,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        }
    })

    win.on('close', () => {
        win = null
    })
    win.loadURL(modalPath)

    win.webContents.on('did-finish-load', function () {
        win.webContents.send('dataJsonPort', 'dataJson');
    });

    win.show()
    win.webContents.openDevTools();

    win.on('information-dialog-selection', () => {
        win = null
    })

})


ipcRenderer.on('information-dialog-selection', (event, index) => {


    let uid = settings.get('uid')
    document.getElementById('sendEmail').innerHTML = index + uid
})