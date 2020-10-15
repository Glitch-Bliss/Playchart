
const fs = require('fs');
const path = require('path');
const os = require('os');
const { electron, ipcRenderer } = require('electron');
const { remote } = require('electron');
const { BrowserWindow } = remote;
const { dialog } = require('electron').remote;


window.addEventListener('DOMContentLoaded', () => {

  // We trigger service for PDF generation
  for (template of document.querySelectorAll(".template")) {
    template.addEventListener("click", (event) => {
      console.info(template);
      let formType = template.dataset.form;
      ipcRenderer.send('open-main', formType);
      event.preventDefault();
    });
  }

})
