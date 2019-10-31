const {
    BrowserWindow
} = require('electron').remote
const {ipcRenderer} = require('electron')
const path = require('path')

const newWindowBtn = document.getElementById('sendEmail')


newWindowBtn.addEventListener('click', (event) => {
    const modalPath = path.join('file://', __dirname, '../../html/windows/modal.html')
    ipcRenderer.send('open-information-dialog')
    let win = new BrowserWindow({
        width: 760,
        height: 600,
        frame: false
    })

   
    win.on('close', () => {
        win = null
    })
    win.loadURL(modalPath)
    win.show()
})



ipcRenderer.on('information-dialog-selection', (event, index) => {
    // let message = 'You selected '
    // if (index === 0) message += 'yes.'
    // else message += 'no.'
    document.getElementById('sendEmail').innerHTML = index
  })

