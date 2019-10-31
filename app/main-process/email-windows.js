const {
    ipcMain,
} = require('electron')


ipcMain.on('open-information-dialog', (event) => {
    
    event.sender.send('information-dialog-selection', 'main')
  
})



