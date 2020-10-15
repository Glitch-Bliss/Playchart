
const fs = require('fs');
const path = require('path');
const os = require('os');
const { electron, ipcRenderer } = require('electron');
const { serialize, deserialize } = require('v8');
const { dialog } = require('electron').remote;
const generateIdFromLabel = (label) => {
  let id = label.replace(/\s+/g, '');
  return id.toLowerCase();
}

let answersMap = {};

// Thanks to https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
const createNode = (htmlCode) => {
  var template = document.createElement('template');
  htmlCode = htmlCode.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = htmlCode;
  return template.content.firstChild;
}

const instantiateForm = (jsonForm, filledForm = null) => {
  const form = require(`.\\${jsonForm}`);
  /*
  * Cleaning of previous values
  */
  form_chart.innerHTML = "";
  let buttons = document.querySelectorAll(".menu_button");
  if (buttons.length > 0) {
    for (button of buttons) {
      button.parentNode.removeChild(button);
    }
  }

  /**
   * We extract elements from form and then clean it
   */
  let formElement = document.getElementById("form_chart");
  let menu = document.getElementById("menu");
  let sectionElement = "<section class='form_section'><article class='answers'></article></section>";
  let questionElement = `<div class='answer' data-answer='' data-section=''><input type='checkbox' name='' value='' id='' /><label for=''></label><div>`;

  /**
   * We browse all form questions to dynamically create form elements
   */
  let isFirst = true;
  for (let question of form.questions) {
    let newSection = createNode(sectionElement);
    let sectionId = generateIdFromLabel(question.label);
    newSection.id = sectionId;

    //We generate menu
    let tabButton = createNode(`<button class="menu_button"><span>${question.label.toUpperCase()}</span></button>`);
    tabButton.dataset.sectionTarget = sectionId;

    if (isFirst) {
      tabButton.classList.add("selected");
      isFirst = false;
    }

    tabButton.addEventListener('click', (event) => {
      for (section of document.getElementsByClassName("form_section")) {
        section.classList.remove("active");
      }

      for (section of document.getElementsByClassName("menu_button")) {
        section.classList.remove("selected");
      }

      let sectionButton = event.currentTarget;
      sectionButton.classList.add("selected");

      let target = document.getElementById(sectionButton.dataset.sectionTarget);
      target.classList.add("active");
    });

    menu.insertAdjacentElement('beforeend', tabButton);

    for (let answer of question.answers) {
      let newAnswer = createNode(questionElement);
      newAnswer.dataset.answer = JSON.stringify(answer);
      newAnswer.dataset.section = question.label;
      let label = newAnswer.getElementsByTagName("label")[0];
      let input = newAnswer.getElementsByTagName("input")[0];
      let id = generateIdFromLabel(answer.label);
      label.setAttribute("for", id);
      label.innerText = answer.label;
      input.name = answer.label;
      input.id = id;
      input.value = answer.value;
      newSection.getElementsByClassName("answers")[0].appendChild(newAnswer);

      if (filledForm) {
        if (filledForm[question.label]) {
          if (filledForm[question.label].some((item) => item.label == answer.label)) {
            input.checked = true;
          }
        }
      }

      /**
       * We selected, we fill a map with the answer object
       */
      const DTSAnswer = JSON.parse(newAnswer.dataset.answer);
      const DTSSection = newAnswer.dataset.section;
      input.addEventListener("click", (event) => {
        if (!input.checked && answersMap[DTSSection]) {
          answersMap[DTSSection] = answersMap[DTSSection].filter((item) => item != DTSAnswer);
        } else {
          if (!answersMap[DTSSection]) {
            answersMap[DTSSection] = [];
          }
          answersMap[DTSSection].push(DTSAnswer)
        }
      });
    }

    formElement.appendChild(newSection);
  }

  //We set the first section active by default
  document.getElementsByClassName("form_section")[0].classList.add("active");

  // Behavior of save button
  saveButton.addEventListener("click", (event) => {
    dialog.showSaveDialog({
      buttonLabel: 'Sauvegarder',
      filters: [{ name: 'Fichiers de type Playchart', extensions: ['playchart'] }],
      property: ['createDirectory', 'showOverwriteConfirmation']
    }).then(path => {
      if (path && path.filePath) {

        const chartPath = path.filePath;
        let data = JSON.stringify({ formName: jsonForm, answersMap: answersMap });

        fs.writeFile(chartPath, data, (error) => {
          let options = {};
          try {
            if (error) throw error
            options = {
              type: 'info',
              title: 'Information',
              message: `La charte ${chartPath} a bien été sauvegardée.`
            }
          } catch (error) {
            console.log(`Erreur lors de la sauvegarde de ${chartPath}: `, error)
            options = {
              type: 'error',
              title: 'Erreur d\'enregistrement',
              message: `La charte n'à PAS été sauvegardée. \n Message : ${error}`
            }
          } finally {
            dialog.showMessageBox(options, (index) => { });
          }
        })
      }
    })
    event.preventDefault();
  });

}

// Object gathering all answers in logical map
window.addEventListener('DOMContentLoaded', () => {

  ipcRenderer.on('init', (event, formType) => {    
    instantiateForm(formType);
  });

  // Behavior of open button  
  openButton.addEventListener("click", (event) => {
    dialog.showOpenDialog({
      buttonLabel: 'Ouvrir',
      filters: [{ name: 'Fichiers de type Playchart', extensions: ['playchart'] }],
      property: ['openFile']
    }).then(result => {
      try {
        let openedFile = fs.readFileSync(result.filePaths[0]);
        let jsonData = JSON.parse(openedFile);

        instantiateForm(jsonData.formName, jsonData.answersMap);
        answersMap = jsonData.answersMap;

      } catch (error) {
        console.log(`Erreur lors de l'ouverture de ${result.filePaths[0]}`, error)
        const options = {
          type: 'error',
          title: 'Erreur d\'ouverture',
          message: `Erreur lors de l'ouverture de ${result.filePaths[0]}\n Message : ${error}`
        }
        dialog.showMessageBox(options, (index) => { });
      }
    })
    event.preventDefault();
  });

  // We trigger service for PDF generation
  renderButton.addEventListener("click", (event) => {
    ipcRenderer.send('send-render-datas', answersMap)
    event.preventDefault();
  });

  // We go back to welcome screen
  backButton.addEventListener("click", (event) => {
    ipcRenderer.send('back-to-welcome')
    event.preventDefault();
  });

})
