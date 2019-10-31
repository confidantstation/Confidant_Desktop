const {BrowserWindow} = require('electron').remote
const path = require('path')

const newWindowBtn = document.getElementById('sendEmail')

newWindowBtn.addEventListener('click', (event) => {
  const modalPath = path.join('file://', __dirname, '../../../html/windows/modal.html')
  let win = new BrowserWindow({ width: 400, height: 320 })

  win.on('close', () => { win = null })
  win.loadURL(modalPath)
  win.show()
})
