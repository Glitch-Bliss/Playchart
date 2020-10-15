// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

function createWindow() {

    var image = __dirname + '/assets/app-icon.png';

    // Create the browser window.
    const introWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true,
        icon: image,
        webPreferences: {
            enableRemoteModule: true,
            preload: path.join(__dirname, 'preload_intro.js')
        }
    })
    //mainWindow.webContents.openDevTools()
    introWindow.loadFile('intro.html')

    ipcMain.on('open-main', (event, formType) => {

        // Create the browser window.
        const renderWindow = new BrowserWindow({
            id: "render-window",
            protocol: 'file:',
            slashes: true,
            width: 400,
            height: 225,
            show: false,
            autoHideMenuBar: true,
            webPreferences: {
                enableRemoteModule: true,
                preload: path.join(__dirname, 'preload_render.js')
            }
        })
        //renderWindow.webContents.openDevTools()
        renderWindow.loadFile('render.html');

        ipcMain.on('send-render-datas', (event, answersMap) => {
            renderWindow.webContents.send('update-render', answersMap);
        });

        // Create the browser window.
        const mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            show: true,
            icon: image,
            autoHideMenuBar: true,
            webPreferences: {
                enableRemoteModule: true,
                preload: path.join(__dirname, 'preload_main.js'),
            }
        })
        // mainWindow.webContents.openDevTools()
        mainWindow.loadFile('index.html').then(() => {
            mainWindow.webContents.send("init", formType);
            introWindow.close();
        });

        // Emitted when the window is closed.
        mainWindow.on('closed', () => {
            renderWindow.close();
        })

        ipcMain.on('back-to-welcome', (event, formType) => {
            app.relaunch();
            try {
                //Trigger harmless exception
                app.exit();
            } catch (ex) {
                console.log("Exception soulevée lors de la fermeture de l'application quand retour arrière :");
                console.log(ex);
            }
        });

    });
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.