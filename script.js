const mapContainer = document.querySelector(".map");
const list = document.querySelector(".workouts");
const rem = Number.parseInt(
  getComputedStyle(document.querySelector(":root")).fontSize
);

const ids = [];

class Workout {
  constructor(type, distance, duration) {
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
    this.type = type;
    this.date = new Date();
    this.distance = distance;
    this.duration = duration;
    this.avrSpeed = distance / duration;
  }
}

class App {
  #userPosition;
  #targetMap;
  #popupOpts = {
    autoClose: false,
    closeOnClick: false,
    closeOnEscapeKey: false,
    offset: [0, -20],
    minHeight: rem * 3,
    minWidth: rem * 12,
  };

  constructor() {
    this._getUserPosition();
  }

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
    console.log(coordinates);
    this.#targetMap = L.map("map").setView(coordinates, 15);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#targetMap);

    this._markerRender(
      this.#targetMap,
      coordinates,
      "./initposicon.png",
      "Your current position"
    );
  }

  _markerRender(targetMap, coords, url, popupContent) {
    const marker = L.marker(coords, {
      icon: L.icon({
        iconUrl: url,
        iconAnchor: [16, 32],
      }),
    }).addTo(targetMap);

    // adding popup to a marker

    this._popupRender(marker, this.#popupOpts, popupContent);
  }

  _popupRender(targetMarker, options, content) {
    targetMarker.bindPopup(L.popup(options).setContent(content)).openPopup();
  }

  _showForm() {}

  _addingWorkout() {}
}

const appInstance = new App();
