// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload_main.js')
    }
  })
  //mainWindow.webContents.openDevTools()
  mainWindow.loadFile('index.html')

  // Create the browser window.
  const renderWindow = new BrowserWindow({
    id: "render-window",
    protocol: 'file:',
    slashes: true,
    width: 400,
    height: 225,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload_render.js')
    }
  })
  //renderWindow.webContents.openDevTools()
  renderWindow.loadFile('render.html')

  ipcMain.on('send-render-datas', (event, answersMap) => {
    renderWindow.webContents.send('update-render', answersMap);
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    renderWindow.close();
  })
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
