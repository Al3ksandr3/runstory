"use strict";

// helper variables
// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May','June','July','August','September','October', 'November','December']
const ids = [];
const formHidder = document.querySelector(".form-hidder");
const formHint = document.querySelector(".form-hidder--hint");
const discard = document.querySelector(".discard");
const discardBtn = document.querySelector(".discard--btn");
//

const mapContainer = document.querySelector(".map");
const workoutsPane = document.querySelector(".workouts");
const rem = Number.parseInt(
  getComputedStyle(document.querySelector(":root")).fontSize
);

const distanceInput = document.querySelector(".distance");
const durationInput = document.querySelector(".duration");
const dateInput = document.querySelector(".date");

const workoutForm = document.querySelector(".workout-form");
const formSubmitBtn = document.querySelector(".workout-form--submitbtn");

const notes = document.querySelector(".workout-notes");

const workoutList = document.querySelector(".workouts-list--main");

class Workout {
  constructor(distance, duration, date) {
    const newId = Math.floor(Math.random() * 1_000_000);
    while (true) {
      if (ids.includes(newId)) {
        newId = Math.floor(Math.random() * 1_000_000);
      } else {
        this.id = newId;
        ids.push(newId);
        break;
      }
    }
    this.date = new Date(date.year, date.month - 1, date.day);
    this.distance = distance;
    this.duration = duration;
    this.avrSpeed = distance / duration;
  }
}

class App {
  #userPosition;
  #targetMap;
  #mapEvent;
  #popupOpts = {
    autoClose: false,
    closeOnClick: false,
    closeOnEscapeKey: false,
    offset: [0, -20],
    minHeight: rem * 2,
    minWidth: rem * 10,
  };
  #notesArea;
  #notesText;
  #editBtn;
  #submitBtn;
  #notes;

  constructor() {
    // getting use position

    this._getUserPosition();

    // creating textarea for notes

    this.#notesArea = document.createElement("textarea");
    this.#notesArea.rows = "10";
    this.#notesArea.cols = "70";
    this.#notesArea.classList.add("workout-notes--textarea", "hidden");
    notes.appendChild(this.#notesArea);

    this.#submitBtn = document.createElement("button");
    this.#submitBtn.classList.add("submitBtn", "hidden");
    this.#submitBtn.textContent = "Submit";

    this.#submitBtn.addEventListener("click", this._renderNotesText.bind(this));

    notes.appendChild(this.#submitBtn);

    // creating paragraph for notes

    this.#notesText = document.createElement("p");
    this.#notesText.className = "workout-notes--text";
    notes.appendChild(this.#notesText);

    this.#editBtn = document.createElement("button");
    this.#editBtn.classList.add("editBtn");
    this.#editBtn.textContent = "Edit";

    this.#editBtn.addEventListener("click", this._renderNotesArea.bind(this));

    notes.appendChild(this.#editBtn);

    // adding event listeners to form and and discard button

    workoutForm.addEventListener(
      "submit",
      function (submitE) {
        submitE.preventDefault();
        if (
          this._validateInput(distanceInput.value, distanceInput) &&
          this._validateInput(durationInput.value, durationInput) &&
          this._validateInput(dateInput.value, dateInput)
        ) {
          discard.style.display = "none";
          this._generateWorkout();
        }
      }.bind(this)
    );

    discardBtn.addEventListener(
      "click",
      function (clickE) {
        this.#mapEvent = undefined;
        discard.style.display = "none";
        formHidder.style.height = "100%";
        formHint.style.display = "block";
        distanceInput.value = "";
        durationInput.value = "";
        dateInput.value = "";
      }.bind(this)
    );

    // checking notes content in the local storage

    window.localStorage.getItem("notes") === null
      ? (this.#notes = "")
      : (this.#notes = JSON.parse(window.localStorage.getItem("notes")));

    this.#notesText.innerText = this.#notes;
  }

  //
  // Geolocation position request
  //

  _getUserPosition() {
    navigator.geolocation.getCurrentPosition(
      this._gettingUserPosition.bind(this),
      this._userPositionError.bind(this)
    );
  }

  //
  // Geolocation position success
  //

  _gettingUserPosition(geolocationPosition) {
    this.#userPosition = geolocationPosition.coords;
    const { latitude, longitude } = this.#userPosition;
    this._renderingMap(latitude, longitude);
  }

  //
  // Geolocation position error
  //

  _userPositionError(geolocationPositionError) {
    alert(
      `Sorry, browser was not able to detect your location. Error message: ${geolocationPositionError.message}`
    );
    this.#userPosition = null;
  }

  //
  // Leaflet map render
  //
  _renderingMap(...coordinates) {
    this.#targetMap = L.map("map").setView(coordinates, 15);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#targetMap);

    this._markerRender(
      this.#targetMap,
      coordinates,
      "./initposicon.png",
      "Your current position",
      this.#popupOpts
    );

    this.#targetMap.addEventListener(
      "click",
      function (mapE) {
        this.#mapEvent = mapE;
        workoutForm.style.border = "0.4rem solid gold";
        formHidder.style.height = "0%";
        formHint.style.display = "none";
        discard.style.display = "flex";
        distanceInput.focus();

        setTimeout(() => {
          workoutForm.style.border = "none";
        }, 300);
      }.bind(this)
    );
  }

  //
  // RunStory marker render
  //

  _markerRender(targetMap, coords, url, popupContent, popupOptions, storyRun) {
    const marker = L.marker(coords, {
      icon: L.icon({
        iconUrl: url,
        iconAnchor: [16, 32],
      }),
    }).addTo(targetMap);

    // adding popup to a marker

    this._popupRender(marker, popupContent, popupOptions, storyRun);
  }

  //
  // RunStory popup render
  //

  _popupRender(targetMarker, content, options, runStory) {
    const popup = L.popup(options).setContent(content);

    popup.addEventListener("add", function () {
      const wrapper = this._wrapper;
      const tip = this._tip;
      if (runStory) {
        wrapper.classList.add("runStory--wrapper--tip");
        tip.classList.add("runStory--wrapper--tip");
      }
    });
    targetMarker.bindPopup(popup).openPopup();
  }

  //
  // Notes textarea
  //

  _renderNotesArea(clickE) {
    this.#notesArea.value = this.#notes;

    this.#notesText.classList.add("hidden");
    this.#editBtn.classList.add("hidden");

    this.#notesArea.classList.remove("hidden");
    this.#submitBtn.classList.remove("hidden");

    this.#notesArea.focus();
  }

  //
  // Notes text
  //

  _renderNotesText(clickE) {
    this.#notes = this.#notesArea.value;
    this.#notesText.innerText = this.#notes;

    this.#notesText.classList.remove("hidden");
    this.#editBtn.classList.remove("hidden");

    this.#notesArea.classList.add("hidden");
    this.#submitBtn.classList.add("hidden");

    // window.localStorage.setItem("notes", JSON.stringify(this.#notes));
  }

  //
  // RunStory data generation
  //

  _generateWorkout() {
    const dateSeparator = dateInput.value.split("-");

    const date = {
      year: dateSeparator[0],
      month: dateSeparator[1],
      day: dateSeparator[2],
    };

    const workout = new Workout(distanceInput.value, durationInput.value, date);

    workoutList.insertAdjacentHTML(
      "afterbegin",
      this._generateListItem(workout)
    );

    distanceInput.value = "";
    durationInput.value = "";
    dateInput.value = "";

    dateInput.blur();

    discard.style.display = "none";
    formHidder.style.height = "100%";
    formHint.style.display = "block";

    const { lat, lng } = this.#mapEvent.latlng;
    this._markerRender(
      this.#targetMap,
      [lat, lng],
      "./assets/runStory.png",
      `RunStory on ${
        months[workout.date.getMonth()]
      } ${workout.date.getDate()}, ${workout.date.getFullYear()}`,
      this.#popupOpts,
      true
    );
  }

  //
  // Adding RunStory to the list
  //

  _generateListItem(runstory) {
    return `<li class="runstory">
    <h4 class="runstory--header">Runstory on ${
      months[runstory.date.getMonth()]
    } ${runstory.date.getDate()}, ${runstory.date.getFullYear()}:</h4>
    <div class="runstory--content">
      <span class="runstory--datapiece">
        <img
          class="runstory--datapiece--icon"
          src="./assets/runner.png"
          alt="Icon of runner."
        />
        <p class="runstory--datapiece--number">${runstory.distance}</p>
        <p class="runstory--datapiece--unit">km</p>
      </span>
      <span class="runstory--datapiece margin">
        <img
          class="runstory--datapiece--icon"
          src="./assets/clock.png"
          alt="Icon of clock."
        />
        <p class="runstory--datapiece--number">${runstory.duration}</p>
        <p class="runstory--datapiece--unit">min</p>
      </span>
      <span class="runstory--datapiece expanded margin">
        <img
          class="runstory--datapiece--icon"
          src="./assets/speedometer.png"
          alt="Icon of speedometer"
        />
        <p class="runstory--datapiece--number">${runstory.avrSpeed.toFixed(
          1
        )}</p>
        <p class="runstory--datapiece--unit">km/min</p>
      </span>
    </div>
    </li>
    `;
  }

  _validateInput(val, element) {
    if (element.type === "date")
      return val.length === 0 ? this._showErrorPopup(element) : true;
    return isNaN(Number(val)) || val.length === 0
      ? this._showErrorPopup(element)
      : true;
  }

  _showErrorPopup(element) {
    const closestPar = element.closest(".workout-form--labels");
    let fieldName = element.classList[1];
    fieldName = fieldName[0].toUpperCase() + fieldName.slice(1);

    const fieldType = element.type;

    const errorText = `Please, input ${
      fieldType === "date"
        ? ` your RunStory date in the "${fieldName}" field.`
        : `positive numeric value in the "${fieldName}" field.`
    }`;

    closestPar.insertAdjacentHTML(
      "beforeend",
      `<span class="validation-error">
    <img
      class="validation-error--icon"
      src="./assets/close.png"
      alt="Close icon"
    />
    <p class="validation-error--text">${errorText}</p>
    <span class="validation-error--pointer"></span>
  </span>`
    );
    element.value = "";
    element.focus();
    setTimeout(() => {
      const errorMessage = document.querySelector(".validation-error");
      errorMessage.style.opacity = "0";
      setTimeout(() => {
        errorMessage.remove();
      }, 1100);
    }, 2000);

    return;
  }
}

const appInstance = new App();
