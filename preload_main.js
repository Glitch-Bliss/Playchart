
const fs = require('fs');
const path = require('path');
const os = require('os');
const { electron, ipcRenderer, dialog } = require('electron');
const form = require('./form.json');
const { serialize } = require('v8');

const generateIdFromLabel = (label) => {
  let id = label.replace(/\s+/g, '');
  return id.toLowerCase();
}

// Thanks to https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
const createNode = (htmlCode) => {
  var template = document.createElement('template');
  htmlCode = htmlCode.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = htmlCode;
  return template.content.firstChild;
}

// Object gathering all answers in logical map
const answersMap = new Map();
window.addEventListener('DOMContentLoaded', () => {
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
  for (let question of form.questions) {
    let newSection = createNode(sectionElement);
    let sectionId = generateIdFromLabel(question.label);
    newSection.id = sectionId;
    // let legend = newSection.getElementsByClassName("legend")[0];
    // legend.innerText = question.label;

    //We generate menu
    let tabButton = createNode(`<button class="menu_button"><span>${question.label.toUpperCase()}</span></button>`);
    tabButton.dataset.sectionTarget = sectionId;

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

      /**
       * We selected, we fill a map with the answer object
       */
      const DTSAnswer = JSON.parse(newAnswer.dataset.answer);
      const DTSSection = newAnswer.dataset.section;
      input.addEventListener("click", (event) => {
        if (!input.checked) {
          answersMap.get(DTSSection).delete(DTSAnswer);
        } else {
          if (!answersMap.get(DTSSection)) {
            answersMap.set(DTSSection, new Set());
          }
          answersMap.get(DTSSection).add(DTSAnswer);
        }
      });
    }

    formElement.appendChild(newSection);
  }

  //We set the first section active by default
  document.getElementsByClassName("form_section")[0].classList.add("active");

  // We trigger service for PDF generation
  renderButton.addEventListener("click", (event) => {
    ipcRenderer.send('send-render-datas', serialize(answersMap));
    event.preventDefault();
  });

})
