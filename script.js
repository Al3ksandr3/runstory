const listItem = `<li class="runstory">
<h4 class="runstory--header">Runstory</h4>
<div class="runstory--content">
  <span class="runstory--datapiece">
    <img
      class="runstory--datapiece--icon"
      src="./assets/runner.png"
      alt="Icon of runner."
    />
    <p class="runstory--datapiece--number">21</p>
    <p class="runstory--datapiece--unit">km</p>
  </span>
  <span class="runstory--datapiece margin">
    <img
      class="runstory--datapiece--icon"
      src="./assets/clock.png"
      alt="Icon of clock."
    />
    <p class="runstory--datapiece--number">21</p>
    <p class="runstory--datapiece--unit">min</p>
  </span>
  <span class="runstory--datapiece margin">
    <img
      class="runstory--datapiece--icon"
      src="./assets/speedometer.png"
      alt="Icon of speedometer"
    />
    <p class="runstory--datapiece--number">21</p>
    <p class="runstory--datapiece--unit">km/min</p>
  </span>
</div>
</li>
`;

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

const ids = [];

class Workout {
  constructor(distance, duration) {
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
    this.date = new Date();
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
  #distanceFieldStatus;
  #durationFieldStatus;
  #dateFieldStatus = true;

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

    this._popupRender(marker, popupOptions, popupContent);
  }

  _popupRender(targetMarker, options, content) {
    targetMarker.bindPopup(L.popup(options).setContent(content)).openPopup();
  }

  _addingWorkout() {}

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
    const { lat, lng } = this.#mapEvent.latlng;
    this._markerRender(
      this.#targetMap,
      [lat, lng],
      "./initposicon.png",
      "You clicked here",
      this.#popupOpts
    );
  }
}

const appInstance = new App();
