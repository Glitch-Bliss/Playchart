
const fs = require('fs');
const path = require('path');
const os = require('os');
const { electron, ipcRenderer } = require('electron');
const { remote } = require('electron');
const { deserialize } = require('v8');
const { BrowserWindow } = remote;


window.addEventListener('DOMContentLoaded', () => {

  ipcRenderer.on('update-render', (event, serializedMap) => {

    // We empty previous results 
    document.getElementById('results').innerHTML = "";

    let answersMap = deserialize(serializedMap);
    let results = document.getElementById("results");    

    console.info(answersMap);

    for (let entry of answersMap) {
      if (entry[1].size > 0) {
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
    }

    const dialog = require('electron').remote.dialog;
    dialog.showSaveDialog({
      buttonLabel: 'Sauvegarder PDF',
      filters: [{ name: 'Fichiers de type PDF', extensions: ['pdf'] }],
      property: ['createDirectory', 'showOverwriteConfirmation']
    }).then(path => {
      if (path && path.filePath) {

        const pdfPath = path.filePath;
        let win = BrowserWindow.fromId(remote.getCurrentWindow().id);

        win.webContents.printToPDF({
          headerFooter: {
            title: "Charte de jeu",
            url: ""
          },
          printBackground: true
        }).then(data => {

          fs.writeFile(pdfPath, data, (error) => {
            try {
              if (error) throw error
              const options = {
                type: 'info',
                title: 'Information',
                message: `La charte de jeu ${pdfPath} a bien été générée.`
              }
              dialog.showMessageBox(options, (index) => { });
            } catch (error) {
              console.log(`Failed to write PDF to ${pdfPath}: `, error)
              const options = {
                type: 'error',
                title: 'Erreur de génération',
                message: `Le PDF n'a pu être généré. Le fichier est peut-être ouvert ? \n Message : ${error}`
              }
              dialog.showMessageBox(options, (index) => { });
            }
          })
        })
      }
    })
  })

})
