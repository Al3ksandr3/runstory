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
    minHeight: rem * 3,
    minWidth: rem * 12,
  };
  #notesArea;
  #notesText;
  #editBtn;
  #submitBtn;
  #notes;
  #distanceField;
  #durationField;
  #dateField;
  #focusedField;

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

    // adding event listeners to form and separate input fields

    workoutForm.addEventListener(
      "submit",
      function (submitE) {
        submitE.preventDefault();

        this._generateWorkout();
      }.bind(this)
    );

    discardBtn.addEventListener(
      "click",
      function (clickE) {
        this.#mapEvent = undefined;
        discard.style.display = "none";
        formHidder.style.height = "100%";
        formHint.style.display = "block";
      }.bind(this)
    );

    // [distanceInput, durationInput, dateInput].forEach((element) => {
    //   element.addEventListener(
    //     "focus",
    //     function (focusE) {
    //       this.#focusedField = focusE.target;
    //     }.bind(this)
    //   );
    // });

    // document.addEventListener(
    //   "keypress",
    //   function (keyPressE) {
    //     this.#focusedField.value = this.#focusedField.value + keyPressE.key;
    //     console.log(distanceInput.value);
    //   }.bind(this)
    // );

    // checking notes in the local storage

    window.localStorage.getItem("notes") === null
      ? (this.#notes = "")
      : (this.#notes = JSON.parse(window.localStorage.getItem("notes")));

    this.#notesText.innerText = this.#notes;
  }

  //
  // Methods start from here
  //

  _getUserPosition() {
    navigator.geolocation.getCurrentPosition(
      this._gettingUserPosition.bind(this),
      this._userPositionError.bind(this)
    );
  }

  _gettingUserPosition(geolocationPosition) {
    this.#userPosition = geolocationPosition.coords;
    const { latitude, longitude } = this.#userPosition;
    this._renderingMap(latitude, longitude);
  }

  _userPositionError(geolocationPositionError) {
    alert(
      `Sorry, browser was not able to detect your location. Error message: ${geolocationPositionError.message}`
    );
    this.#userPosition = null;
  }

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

  _markerRender(targetMap, coords, url, popupContent, popupOptions) {
    const marker = L.marker(coords, {
      icon: L.icon({
        iconUrl: url,
        iconAnchor: [16, 32],
      }),
    }).addTo(targetMap);

    // adding popup to a marker

    this._popupRender(marker, popupContent, popupOptions);
  }

  _popupRender(targetMarker, content, options) {
    targetMarker.bindPopup(L.popup(options).setContent(content)).openPopup();
  }

  _renderNotesArea(clickE) {
    this.#notesArea.value = this.#notes;

    this.#notesText.classList.add("hidden");
    this.#editBtn.classList.add("hidden");

    this.#notesArea.classList.remove("hidden");
    this.#submitBtn.classList.remove("hidden");

    this.#notesArea.focus();
  }

  _renderNotesText(clickE) {
    this.#notes = this.#notesArea.value;
    this.#notesText.innerText = this.#notes;

    this.#notesText.classList.remove("hidden");
    this.#editBtn.classList.remove("hidden");

    this.#notesArea.classList.add("hidden");
    this.#submitBtn.classList.add("hidden");

    window.localStorage.setItem("notes", JSON.stringify(this.#notes));
  }

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
    formHidder.style.height = "100%";
    formHint.style.display = "block";

    const { lat, lng } = this.#mapEvent.latlng;
    this._markerRender(
      this.#targetMap,
      [lat, lng],
      "./initposicon.png",
      "You clicked here",
      this.#popupOpts
    );
  }

  _generateListItem(runstory) {
    return `<li class="runstory">
    <h4 class="runstory--header">Runstory on ${
      months[runstory.date.getMonth()]
    } ${runstory.date.getDate()}, ${runstory.date.getFullYear()}</h4>
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
      <span class="runstory--datapiece margin">
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
}

const appInstance = new App();
