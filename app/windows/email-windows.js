$(function () {
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

    // 回复邮件
    $('#sendEmail').click(function () {

        let uid = $(this).parent().attr('uid')
        settings.set('emuid', uid)

        const modalPath = path.join('file://', __dirname, '../../html/windows/Reply.html?a=1&b=2')
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

        let $em = $(`.emuid${uid}`)
        let to = $em.find('.to').text()
        let from =$em.find('.from').text()
        let subject =$em.find('.subject').text()
        let date =$em.find('.date').text()
        let html = $(`.emHtml${uid}`).parent().html()
        let obj = {
           to,
           from,
           subject,
           date,
           html,
        }
        obj = JSON.stringify(obj)
        //console.log('obj',obj)
        
        win.webContents.on('did-finish-load', function () {
            win.webContents.send('Reply', obj);
        });

        win.show()
        win.webContents.openDevTools();

        win.on('information-dialog-selection', () => {
            win = null
        })

    })


    ipcRenderer.on('information-dialog-selection', (event, index) => {

       // document.getElementById('sendEmail').innerHTML = index
        
        
    })


    $('#NewEmail').click(function () {

        let uid = $(this).parent().attr('uid')
        settings.set('uid', uid)

        const modalPath = path.join('file://', __dirname, '../../html/windows/NewEmail.html?a=1&b=2')
        
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
        let obj = {
            a :1,
            b:2,
        }
        obj = JSON.stringify(obj)
        win.webContents.on('did-finish-load', function () {
            win.webContents.send('NewEmail', obj);
        });

        win.show()
        //关掉窗口调试功能 写邮件
        //win.webContents.openDevTools();

        win.on('information-dialog-selection', () => {
            win = null
        })

    })
})