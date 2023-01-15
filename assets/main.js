// ------------- State

let selectedCountries = new Set()
let futureCountries = new Set()

// ------------- Amcharsts

const root = am5.Root.new("chartdiv");
root.setThemes([
  am5themes_Animated.new(root),
]);
const chart = root.container.children.push(
  am5map.MapChart.new(root, {
    projection: am5map.geoNaturalEarth1(),
    panX: "rotateX",
    panY: "none",
    minZoomLevel: 1,
    maxZoomLevel: 1,
  })
);

const polygonSeries = chart.series.push(
  am5map.MapPolygonSeries.new(root, {
    geoJSON: am5geodata_worldLow
  })
);


polygonSeries.mapPolygons.template.setAll({
  stroke: am5.color(0xffffff),
  strokeWidth: 1,
  fillOpacity: 1.0,
  fill: am5.color(0xCCCCCC),

  tooltipText: "{name}",
  templateField: "polygonSettings",
  interactive: true,
});


const continents = {
  "AF": 0,
  "AN": 1,
  "AS": 2,
  "EU": 3,
  "NA": 4,
  "OC": 5,
  "SA": 6,
}
const colors = am5.ColorSet.new(root, {});


function getContinent(countryID) {
  const country = am5geodata_data_countries2[countryID];
  return continents[country.continent_code]
}

function getColorForCountry(countryID) {
  const continent = getContinent(countryID)
  return colors.getIndex(continent)
}

function getDataFromCountries(countryIDs) {
  return countryIDs.map(countryID => {
    let color = getColorForCountry(countryID)
    if (futureCountries.has(countryID)) {
      color = am5.color(0xFF3C38)
    }
    return {
      id: countryID,
      polygonSettings: {
        fill: color,
      },
    }
  })
}

polygonSeries.mapPolygons.template.states.create("hover", {
  fillOpacity: 0.5,
});

polygonSeries.mapPolygons.template.events.on("click", function(ev) {
  const initialHash = window.location.hash

  let countryID = ev.target.dataItem.get("id");

  const e = ev.originalEvent

  let countryList = selectedCountries
  if (e.metaKey) {
    countryList = futureCountries
  }

  if (countryList.has(countryID)) {
    countryList.delete(countryID);
  } else {
    countryList.add(countryID);
  }

  updateURLFromCountries()

  const newHash = window.location.hash
  if (initialHash === newHash) {
    // In cases where they are different, the refresh map is already triggered by the history listener
    refreshMap()
  }
});

function refreshMap() {
  const selectedCountriesArray = Array.from(selectedCountries)
  const futureCountriesArray = Array.from(futureCountries)
  polygonSeries.data.setAll(getDataFromCountries(selectedCountriesArray.concat(futureCountriesArray)))
}

function highlightAllCountries() {
  // Set up data for countries
  const data = [];
  for(let id in am5geodata_data_countries2) {
    if (am5geodata_data_countries2.hasOwnProperty(id)) {
      data.push({
        id: id,
        polygonSettings: {
          fill: getColorForCountry(id),
        }
      });
    }
  }
  polygonSeries.data.setAll(data);
}


// -------------- Public Methods


function doClear() {
  selectedCountries.clear()
  futureCountries.clear()
  updateURLFromCountries()
  refreshMap()
}

function doUndo() {
  history.back();
}

function doRedo() {
  history.forward();
}

function doDownload() {
  console.error("TODO")

}


// -------------- State manipulation

function updateCountriesFromURL() {
  let fragment = window.location.hash;
  if (fragment.startsWith('#')) {
    fragment = fragment.slice(1)
  }
  const selectedCountriesArray = fragment.split(',').filter(d => d.length == 2)
  selectedCountries = new Set(selectedCountriesArray)
}

function updateURLFromCountries() {
  const selectedCountriesArray = Array.from(selectedCountries)
  const fragment = selectedCountriesArray.join(',')
  window.location.hash = fragment;
}

window.addEventListener('hashchange', function (a, b, c, d) {
    updateCountriesFromURL()
    refreshMap();
});



// -------------- Initialization

function init() {
  const exporting = am5plugins_exporting.Exporting.new(root, {
    menu: am5plugins_exporting.ExportingMenu.new(root, {}),
    pngOptions: {
      quality: 0.8,
      maintainPixelRatio: true
    }
  });

  updateCountriesFromURL();
  refreshMap()
}

init();
