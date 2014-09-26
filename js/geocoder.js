//Add Geocoder

function enterKeyLocate (e) {
  var keynum;
  
  if(window.event) // IE
  {
	  keynum = e.keyCode;
  } 
  else if(e.which) // Netscape/Firefox/Opera
  {
	  keynum = e.which;
  }
  
  if (keynum == 13) {
	  locate()
  }
}

function locate() {
    map.graphics.clear();
    var address = {"SingleLine":dojo.byId("geocode").value};
    locator.outSpatialReference= map.spatialReference;
    locator.addressToLocations(address,["Loc_name"]);
}

function showResults(candidates) {

  require([
  "esri/symbols/SimpleMarkerSymbol",
  "esri/InfoTemplate",
  "esri/graphic",
  "dojo/_base/Color",
  "dojo/_base/array"
  ], function(
    SimpleMarkerSymbol,
    InfoTemplate,
    Graphic,
    Color,
    array
  ) {

      //var candidate;
      //var symbol = new SimpleMarkerSymbol();
      var infoTemplate = new InfoTemplate("Location", "Address: ${address}<br />Score: ${score}<br />Source locator: ${locatorName}");

      //symbol.setStyle(SimpleMarkerSymbol.STYLE_SQUARE);
      //symbol.setColor(new Color([153,0,51,0.75]));

      var geom;
     
      array.every(candidates.addresses, function(candidate){
        if (candidate.score > 80) {
          var attributes = { address: candidate.address, score:candidate.score, locatorName:candidate.attributes.Loc_name };  
          geom = candidate.location;
          var graphic = new Graphic(geom, null, attributes, infoTemplate);
          //add a graphic to the map at the geocoded location
          map.graphics.add(graphic);
                     
          return false; //break out of loop after one candidate with score greater  than 80 is found.
        }
      });

      if(geom !== undefined){
        map.centerAndZoom(geom,13);
      }
  });

}