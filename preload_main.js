
const fs = require('fs');
const path = require('path');
const os = require('os');
const { electron, ipcRenderer, dialog } = require('electron');

// Thanks to https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
const createNode = (htmlCode) => {
  var template = document.createElement('template');
  htmlCode = htmlCode.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = htmlCode;
  return template.content.firstChild;
}

const answersMap = new Map();

const form = require('./form.json');
const { serialize } = require('v8');
window.addEventListener('DOMContentLoaded', () => {
  /**
   * We extract elements from form and then clean it
   */
  let formElement = document.getElementById("form_chart");
  let sectionElement = "<fieldset class='form_section'></fieldset>";
  let questionElement = "<div class='answer' data-answer='' data-section=''><input type='checkbox' name='' value='' id='' /><label for=''></label></div>";
  let legendElement = "<legend class='legend'></legend>";

  /**
   * We browse all form questions to dynamically create form elements
   */
  for (let question of form.questions) {
    let newSection = createNode(sectionElement);
    let legend = createNode(legendElement);
    legend.innerText = question.label;
    newSection.appendChild(legend);

    for (let answer of question.answers) {
      let newAnswer = createNode(questionElement);
      newAnswer.dataset.answer = JSON.stringify(answer);
      newAnswer.dataset.section = question.label;
      let label = newAnswer.getElementsByTagName("label")[0];
      let input = newAnswer.getElementsByTagName("input")[0];
      label.setAttribute("for", answer.label);
      label.innerText = answer.label;
      input.name = answer.label;
      input.id = answer.label;
      input.value = answer.value;
      newSection.appendChild(newAnswer);

      /**
       * We selected, we fill a map with the answer object
       */
      input.addEventListener("click", (event) => {
        const answer = JSON.parse(newAnswer.dataset.answer);
        const section = newAnswer.dataset.section;

        if (!input.checked) {
          answersMap.get(section).delete(answer);
        } else {
          if (!answersMap.get(section)) {
            answersMap.set(section, new Set());
          }
          answersMap.get(section).add(answer);
        }
      });
    }

    formElement.appendChild(newSection);
  }

  renderButton.addEventListener("click", (event) => {    
    ipcRenderer.send('send-render-datas', serialize(answersMap));
    event.preventDefault();
  });

})
