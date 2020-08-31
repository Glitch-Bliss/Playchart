
const fs = require('fs');
const path = require('path');
const os = require('os');
const { electron, ipcRenderer } = require('electron');
const { remote } = require('electron');
const { deserialize } = require('v8');
const { BrowserWindow } = remote;


window.addEventListener('DOMContentLoaded', () => {

  ipcRenderer.on('update-render', (event, serializedMap) => {

    let answersMap = deserialize(serializedMap);

    let results = document.createElement("section");
    results.id = "results";
    document.body.insertBefore(results, document.getElementById('anchor'));

    for (let entry of answersMap) {
      let title = document.createElement("h2");
      title.innerText = entry[0];
      results.appendChild(title);

      let answers = entry[1];
      for (let answer of answers) {
        let answerLabel = document.createElement("p");
        answerLabel.innerHTML = answer.label;
        results.appendChild(answerLabel);
      }
    }

    const dialog = require('electron').remote.dialog;

    dialog.showSaveDialog({
      buttonLabel: 'Enluminer',
      filters: [{ name: 'Fichiers de type PDF je vous prie', extensions: ['pdf'] }],
      property: ['createDirectory', 'showOverwriteConfirmation']
    }).then(path => {
      if (path && path.filePath) {

        const pdfPath = path.filePath;
        let win = BrowserWindow.fromId(remote.getCurrentWindow().id);

        win.webContents.printToPDF({}).then(data => {
          fs.writeFile(pdfPath, data, (error) => {
            if (error) throw error
            console.log(`Wrote PDF successfully to ${pdfPath}`)

            const options = {
              type: 'info',
              title: 'Information',
              message: `La charte de jeu ${pdfPath} a bien été générée. Ainsi ai-je parlé.`
            }
            dialog.showMessageBox(options, (index) => { });
          })
        }).catch(error => {
          console.log(`Failed to write PDF to ${pdfPath}: `, error)
        })
      }

    })

  })
})
