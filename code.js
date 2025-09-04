var cc = DataStudioApp.createCommunityConnector();

var apiKey = "Replace with your api key"; 
var districts = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Monaragala", "Ratnapura", "Kegalle"
];

/**
 * Defines authentication type.
 * This connector does not require authentication.
 */
function getAuthType() {
  var AuthTypes = cc.AuthType;
  return cc
    .newAuthTypeResponse()
    .setAuthType(AuthTypes.NONE)
    .build();
}

/**
 * Defines the configuration parameters for the connector.
 */
function getConfig(request) {
  var config = cc.getConfig();
  
  config.newInfo()
    .setId('instructions')
    .setText('Select a Sri Lankan district to fetch weather data.');
  
  var districtSelector = config.newSelectSingle()
    .setId('district')
    .setName('Choose a district')
    .setHelpText('Select a Sri Lankan district for weather data');

  districts.forEach(function(city) {
    districtSelector.addOption(config.newOptionBuilder().setLabel(city).setValue(city));
  });

  return config.build();
}

/**
 * Defines the schema of the data.
 */
function getFields(request) {
  var fields = cc.getFields();
  var types = cc.FieldType;
  
  fields.newDimension().setId("date").setName("Date").setType(types.YEAR_MONTH_DAY);
  fields.newDimension().setId("time").setName("Time").setType(types.TEXT);
  fields.newDimension().setId("district").setName("District").setType(types.TEXT);
  fields.newMetric().setId("temperature").setName("Temperature (°C)").setType(types.NUMBER);
  fields.newMetric().setId("humidity").setName("Humidity (%)").setType(types.NUMBER);
  fields.newDimension().setId("description").setName("Weather Description").setType(types.TEXT);

  return fields;
}

function getSchema(request) {
  var fields = getFields(request).build();
  return { schema: fields };
}

/**
 * Fetches weather data from the OpenWeather API.
 */
function getData(request) {
  var requestedFieldIds = request.fields.map(function(field) {
    return field.name;
  });
  var requestedFields = getFields().forIds(requestedFieldIds);

  var selectedDistrict = request.configParams.district;
  var url = `https://api.openweathermap.org/data/2.5/weather?q=${selectedDistrict},LK&appid=${apiKey}&units=metric`;

  var response = UrlFetchApp.fetch(url);
  var json = JSON.parse(response.getContentText());

  var now = new Date();
  var date = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
  var time = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss");

  var values = [];
  
  if (requestedFieldIds.includes("date")) {
    values.push(date);
  }
  if (requestedFieldIds.includes("time")) {
    values.push(time);
  }
  if (requestedFieldIds.includes("district")) {
    values.push(json.name);
  }
  if (requestedFieldIds.includes("temperature")) {
    values.push(json.main.temp);
  }
  if (requestedFieldIds.includes("humidity")) {
    values.push(json.main.humidity);
  }
  if (requestedFieldIds.includes("description")) {
    values.push(json.weather[0].description);
  }

  return {
    schema: requestedFields.build(),
    rows: [{ values: values }]
  };
}
