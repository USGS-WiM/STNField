var map, layerArray = [];
var legendLayers = [];
var radioGroupArray = [];
var allLayers;
var identifyParams;
var layersObject = [];
var navToolbar;
var locator;
var sensorsLayer;
var layerDefinitions = [];
var noRecordsQuery, noRecordsQueryTask;
var inCreateMode = false;
var latitude, longitude;
var filterCount;
var nwisFeatureLyr, hwmFilterLyr;
var selectionQueryTask;
var selectionQuery;
var filterDefinition = [];
var lat, lng;
var siteClickURL;
var mapServicesRoot;
var eventList, stateList, countyList, statusList, deploymentList, sensorList, hwmEventList, hwmStateList, hwmCountyList;

require([
	"esri/map",
    "dojo/dom",
    "dojo/on",
    "dojo/_base/Color",
    "esri/geometry/Extent",
    "esri/graphicsUtils",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/WMSLayer",
    "esri/layers/FeatureLayer",
    "esri/geometry/Point",
    "dojo/date/locale",
    "dijit/registry",
    "dojo/_base/array",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/dom-construct",
    "esri/config",
    "esri/dijit/Popup",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/toolbars/navigation",
    "esri/dijit/BasemapGallery",
    "esri/layers/WMSLayerInfo",
    "esri/tasks/IdentifyTask",
	"esri/tasks/IdentifyParameters",
	"esri/urlUtils",
	"esri/geometry/webMercatorUtils",
	"esri/symbols/SimpleLineSymbol",
	"esri/graphic",
	"dojo/request/xhr",
	"esri/dijit/Legend",
    "esri/tasks/locator",
    "dijit/form/CheckBox",
    "dijit/form/RadioButton",
    "dojo/query",
    "dojo/parser",
    "dojo/ready"
], function(
  Map,
  dom,
  on,
  Color,
  Extent,
  graphicsUtils,
  ArcGISDynamicMapServiceLayer,
  WMSLayer,
  FeatureLayer,
  Point,
  locale,
  registry,
  array,
  domAttr,
  domStyle,
  domConstruct,
  esriConfig,
  Popup,
  SimpleMarkerSymbol,
  Navigation,
  BasemapGallery,
  WMSLayerInfo,
  IdentifyTask,
  IdentifyParameters,
  urlUtils,
  webMercatorUtils,
  SimpleLineSymbol,
  Graphic,
  xhr,
  Legend,
  Locator,
  CheckBox,
  RadioButton,
  query,
  parser,
  ready
) {

	allLayers = STNLayers;
	
	esriConfig.defaults.io.proxyUrl = "/STNProxy/proxy.ashx";
	esriConfig.defaults.io.alwaysUseProxy = true;
	//esri.config.defaults.io.corsEnabledServers.push("http://server.arcgisonline.com");
	
	//setup the popup window 
	var popup = new Popup({
	selectionSymbol: new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, new Color([255,0,0]))}, domConstruct.create("div"));
   
	map = new Map("map", {
    	basemap: "topo",
		wrapAround180: true,
		extent: new Extent({xmin:-14284551.845930014,ymin:2700367.3352579884,xmax:-7240115.31917005,ymax:6750918.338144969,spatialReference:{wkid:102100}}), 
        infoWindow: popup,
		slider: true,
		sliderStyle: "large", //use "small" for compact version
		logo:false
	});
	
    navToolbar = new Navigation(map);

    on(map, "load", mapReady);
	
	var basemapGallery = new BasemapGallery({
		showArcGISBasemaps: true,
		map: map
	}, "basemapGallery");
	basemapGallery.startup();
	
  	sensorsLayer = new ArcGISDynamicMapServiceLayer(mapServicesRoot + "/Sensors/MapServer", {"visible":false });
    sensorsLayer.setDisableClientCaching(true);

    hwmFilterLyr = new ArcGISDynamicMapServiceLayer(mapServicesRoot + "/HWMs_forFilter/MapServer", {"visible":false });
    hwmFilterLyr.setDisableClientCaching(true);

    nwisFeatureLyr = new FeatureLayer(mapServicesRoot + "/STN_nwis_rt/MapServer/0", { mode: FeatureLayer.MODE_ONDEMAND, opacity: 0, minScale: 1155582, visible: false, outFields: ["*"]});

	eventList = new FeatureLayer(mapServicesRoot + "/Sensors/MapServer/3", { mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

	stateList = new FeatureLayer(mapServicesRoot + "/Sensors/MapServer/6", { mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

	countyList = new FeatureLayer(mapServicesRoot + "/Sensors/MapServer/7", { mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

	statusList = new FeatureLayer(mapServicesRoot + "/Sensors/MapServer/2", { mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

	deploymentList = new FeatureLayer(mapServicesRoot + "/Sensors/MapServer/4", { mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

	sensorList = new FeatureLayer(mapServicesRoot + "/Sensors/MapServer/5", { mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

	///////

	hwmEventList = new FeatureLayer(mapServicesRoot + "/HWMs_forFilter/MapServer/2", { mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

	hwmStateList = new FeatureLayer(mapServicesRoot + "/HWMs_forFilter/MapServer/3", { mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

	hwmCountyList = new FeatureLayer(mapServicesRoot + "/HWMs_forFilter/MapServer/4", { mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

   var coneTrack = new WMSLayerInfo({
   		name: 'probConeLyr',
   		title: 'Probability Cone and Tracks',
   		transparent: false
   });

   var noaaWMSResourceInfo = {
             extent: new Extent( -127.177734375,17.578125,-65.302734375,52.470703125, {
               wkid: 4326
             }),
             layerInfos: [coneTrack]
   };

   var noaaConeTrackLyr = new WMSLayer("http://nowcoast.noaa.gov/wms/com.esri.wms.Esrimap/wwa", {
   		resourceInfo: noaaWMSResourceInfo,
   		opacity: 0.60,
   		visibleLayers: ['NHC_TRACK_POLY','NHC_TRACK_LIN','NHC_TRACK_PT', 'NHC_TRACK_WWLIN',
   		'NHC_TRACK_PT_72DATE','NHC_TRACK_PT_120DATE','NHC_TRACK_PT_0NAMEDATE', 'NHC_TRACK_PT_MSLPLABELS',
   		'NHC_TRACK_PT_72WLBL','NHC_TRACK_PT_120WLBL','NHC_TRACK_PT_72CAT','NHC_TRACK_PT_120CAT']
   });

   //map.addLayers([noaaConeTrackLyr, nwisFeatureLyr]);

	on(map, "layers-add-result", function(){

		var legendNode = dom.byId("legendDiv");

		var legend = new Legend({
			map:map,
			layerInfos:legendLayers
		}, legendNode );
		legend.startup();
		
		//this counter to track first and last of items in legendLayers
		var i = 0;
		var lastItem = layersObject.length;
		//this forEach loop generates the checkbox toggles for each layer by looping through the legendLayers array (same way the legend element is generated). 
		array.forEach (layersObject, function(layer){
			
			var layerName = layer.title;
			var toggleDiv;

			if (layer.layer != "heading") {
				
				if (layer.toggleType == "radioParent"){
						
					var radioParentCheck = new CheckBox({
						name: "radioParentCheck" + layer.group,
						id: "radioParentCheck_" + layer.group,
						params: {group: layer.group},
						onChange: function(){
							var radChildLayers = [];
							var grp = this.params.group;
							var i, divs;
							array.forEach (layersObject, function (layer){
								if (grp == layer.group && layer.toggleType != "radioParent"  ){
									radChildLayers.push(layer.layer);
								}
							});
							if (!this.checked){
								array.forEach (radChildLayers, function (layer){
									layer.setVisibility(false);
								});	
								divs = query("." + grp);
								for(i = 0; i < divs.length; i++) {
									divs[i].style.display= "none";  
								}
							} 
							if (this.checked){
								divs = query("." + grp);
								for(i = 0; i < divs.length; i++) {
								    divs[i].style.display= "block"; 
								}
								array.forEach (radChildLayers, function (layer){
									if (dom.byId("radioButton"+layer.id).checked) {
										layer.setVisibility(true);
									}
								});
							}
							//Check radio buttons in this group to see what's visible
							//jquery selector to get based on group name and then loop through
							/*var checkLayer = map.getLayer(this.value);
							checkLayer.setVisibility(!checkLayer.visible);
							this.checked = checkLayer.visible;	*/
						}
					});
					toggleDiv = window.document.createElement("div");			
					domConstruct.place(toggleDiv,dom.byId("toggle"), "after" );
					domConstruct.place(radioParentCheck.domNode,toggleDiv,"first");
					domStyle.set(toggleDiv, "paddingLeft", "15px");
					if (i === 0) {
						domStyle.set(toggleDiv, "paddingBottom", "10px");
					} else if (i == lastItem) {
						domStyle.set(toggleDiv, "paddingTop", "10px");
					}
					var radioParentCheckLabel = domConstruct.create('label',{'for':radioParentCheck.name,innerHTML:layerName},radioParentCheck.domNode,"after");
					domConstruct.place("<br/>",radioParentCheckLabel,"after");

				} else if (layer.toggleType == "radio") {
						
					var radioButton = new RadioButton({
						name: layer.group,
						id: "radioButton" + layer.layer.id,
						value:layer.layer.id,
						checked:layer.layer.visible,
						params: {group: layer.group},
						onChange:function(){
							var radioLayer = map.getLayer(this.value);
							var parentID = "radioParentCheck_" + layer.group;

							var checkedEval = (this.checked && registry.byId(parentID).checked) ? true : false;
							radioLayer.setVisibility(checkedEval);
							//(this.checked && registry.byId(parentID).checked) ? radioLayer.setVisibility(true) : radioLayer.setVisibility(false);						
						}
					});
					toggleDiv = window.document.createElement("div");
					domConstruct.place(toggleDiv,dom.byId("toggle"), "after" );
					domConstruct.place(radioButton.domNode,toggleDiv,"first");
					domAttr.set(toggleDiv, "class", radioButton.params.group);
					domStyle.set(toggleDiv, "paddingLeft", "25px");
					domStyle.set(toggleDiv, "display", "none");
					if (i === 0) {
						domStyle.set(toggleDiv, "paddingBottom", "10px");
					} else if (i == lastItem) {
						domStyle.set(toggleDiv, "paddingTop", "10px");
					}
					var radioLabel = domConstruct.create('label',{'for':radioButton.name,innerHTML:layerName},radioButton.domNode,"after");
					domConstruct.place("<br/>",radioLabel,"after");
					
				} else {

					var checkLabel;
					var checkBox = new CheckBox({
						name:"checkBox" + layer.layer.id,
						value:layer.layer.id,
						checked:layer.layer.visible,
						onChange:function(){
							var checkLayer = map.getLayer(this.value);
							checkLayer.setVisibility(!checkLayer.visible);
							this.checked = checkLayer.visible;
							if (allLayers[layerName].wimOptions.includeLegend === true && allLayers[layerName].wimOptions.staticLegendOptions.hasStaticLegend === true) {
								if (checkLayer.visible) {
									$("#" + layer.layer.id + "Legend").show();
								} else {
									$("#" + layer.layer.id + "Legend").hide();
								}
								
							}				
						}
					});
					if (allLayers[layerName].wimOptions.zoomScale) {
						//create the holder for the checkbox and zoom icon
						toggleDiv = window.document.createElement("div");
						domConstruct.place(toggleDiv,dom.byId("toggle"),"after");
						domConstruct.place(checkBox.domNode,toggleDiv,"first");
						checkLabel = domConstruct.create('label',{'for':checkBox.name,innerHTML:layerName},checkBox.domNode,"after");
						var scale = allLayers[layerName].wimOptions.zoomScale;
						var zoomImage = window.document.createElement("div");
						zoomImage.id = 'zoom' + layer.layer.id;
						zoomImage.innerHTML = '<img id="zoomImage" style="height: 18px;width: 18px" src="images/zoom.gif" />';
						on (zoomImage, "click", function () {
							if (map.getScale() > scale) {
								map.setScale(scale);
							}
						});
						domConstruct.place(zoomImage,toggleDiv,"last");
						domStyle.set(checkBox.domNode, "float", "left");
						domStyle.set(toggleDiv, "paddingLeft", "15px");
						domStyle.set(checkLabel, "float", "left");
						domStyle.set(toggleDiv, "paddingTop", "5px");
						domStyle.set(dom.byId("zoomImage"), "paddingLeft", "10px");
						domStyle.set(toggleDiv, "height", "25px");
						if (i === 0) {
							domStyle.set(toggleDiv, "paddingBottom", "10px");
						} else if (i == lastItem) {
							domStyle.set(toggleDiv, "paddingTop", "10px");
						}
						domConstruct.place("<br/>",zoomImage,"after");
					} else {
						toggleDiv = window.document.createElement("div");
						domConstruct.place(toggleDiv,dom.byId("toggle"),"after");
						domConstruct.place(checkBox.domNode,toggleDiv,"first");
						domStyle.set(toggleDiv, "paddingLeft", "15px");
						if (i === 0) {
							domStyle.set(toggleDiv, "paddingBottom", "10px");
						} else if (i == lastItem) {
							domStyle.set(toggleDiv, "paddingTop", "10px");
						}
						checkLabel = domConstruct.create('label',{'for':checkBox.name,innerHTML:layerName},checkBox.domNode,"after");
						domConstruct.place("<br/>",checkLabel,"after");
					}
					
				}
			} else {
				var headingDiv = window.document.createElement("div");
				headingDiv.innerHTML = layer.title;
				domConstruct.place(headingDiv,dom.byId("toggle"),"after");
				domStyle.set(headingDiv, "paddingTop", "10px");
				domStyle.set(headingDiv, "color", "#D3CFBA");
				if (i === 0) {
					domStyle.set(headingDiv, "paddingBottom", "10px");
				} else if (i == lastItem) {
					domStyle.set(headingDiv, "paddingTop", "10px");
				}
			}
			i++;
			//don't miss this iterator!!!!!
		});
		
		//function to handle styling adjustments to the esri legend dijit
		setTimeout(function(){
			$.each($('div[id^="legendDiv_"]'), function (item) {
				for (var layer in allLayers) {
					if (layer == $('#'+item.id+' span').html()) {
						if (allLayers[layer].wimOptions.esriLegendLabel !== undefined && allLayers[layer].wimOptions.esriLegendLabel === false) {
							$('#'+item.id+' table.esriLegendLayerLabel').remove();
						}
					}
				}
			});
			$("#legendDiv").show();
		}, 1000);
		
	});
	
	addAllLayers();
	//calls the addAllLayers function, which really gets the party started.
	
	//Geocoder Reference 
    locator = new Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
    on(locator, "address-to-locations-complete", showResults);

	//begin showSiteResults function for siteid params
	function showSiteResults(featureSet){
			//remove all graphics on the maps graphics layer
	        map.graphics.clear();
	       	map.infoWindow.hide();
			//Performance enhancer - assign featureSet array to a single variable.
			var resultFeatures = featureSet.features;
			//Zoom to the extent of the graphics
			var graphic = resultFeatures[0];
			var mapPoint = new Point(graphic.geometry.x, graphic.geometry.y, map.spatialReference);
			map.centerAndZoom(mapPoint, 15);
			//Refresh the URL with the currently selected parcel
			window.history.pushState(null,null,"?siteid=" + graphic.attributes.SITE_ID);
	}
	//end showSiteResults function for siteid params

	function updateSensorsLayer(){

		var fromDateObject, toDateObject;
		
		layerDefinitions.length = 0;

		//for unknown stupid reason, date fields must come first in the layerDef expression. 
		if (!(registry.byId("fromDate").displayedValue === "")) {

			fromDateObject = registry.byId("fromDate").value;
			var fromDateISO = locale.format(fromDateObject, {datePattern: "yyyy-MM-dd", selector: "date"});

			filterDefinition.push("EVENT_START_DATE >= date '" + fromDateISO + "'");
		} else {
			filterDefinition.push("EVENT_START_DATE LIKE '%'");
		}
		
		if (!(registry.byId("toDate").displayedValue === "")) {

			toDateObject = registry.byId("toDate").value;
			var toDateISO = locale.format(toDateObject, {datePattern: "yyyy-MM-dd", selector: "date"});

			filterDefinition.push("EVENT_END_DATE <= date '" + toDateISO + "'");
		} else {
			filterDefinition.push("EVENT_END_DATE LIKE '%'");
		}

		if (!(registry.byId("eventSelector").value == "All" || registry.byId("eventSelector").value === "")) {
			filterDefinition.push("EVENT_NAME LIKE '" +  registry.byId("eventSelector").value + "'");
		} else {
			filterDefinition.push("EVENT_NAME LIKE '%'");
		}

		if (!(registry.byId("stateSelector").value == "All" || registry.byId("stateSelector").value === "")) {
			filterDefinition.push("STATE LIKE '" +  registry.byId("stateSelector").value + "'");
		} else {
			filterDefinition.push("STATE LIKE '%'");
		}

		if (!(registry.byId("countySelector").value == "All" || registry.byId("countySelector").value === "")) {
			filterDefinition.push("COUNTY LIKE '" +  registry.byId("countySelector").value + "'");
		} else {
			filterDefinition.push("COUNTY LIKE '%'");
		}

		if (!(registry.byId("deploymentSelector").value == "All" || registry.byId("deploymentSelector").value === "")) {
			filterDefinition.push("METHOD LIKE '" +  registry.byId("deploymentSelector").value + "'");
		} else {
			filterDefinition.push("METHOD LIKE '%'");
		}

		if (!(registry.byId("sensorSelector").value == "All" || registry.byId("sensorSelector").value === "")) {
			filterDefinition.push("SENSOR LIKE '" +  registry.byId("sensorSelector").value + "'");
		} else {
			filterDefinition.push("SENSOR LIKE '%'");
		}

		if (!(registry.byId("statusSelector").value == "All" || registry.byId("statusSelector").value === "")) {
			filterDefinition.push("STATUS LIKE '" +  registry.byId("statusSelector").value + "'");
		} else {
			filterDefinition.push("STATUS LIKE '%'");
		}
		
		/*if (filterDefinition.length == 0)
		{
			filterDefinition = ['']; 
		} else {
			filterDefinition = ['((' + filterDefinition.join(") AND (") + '))'];
		}*/
		
		filterDefinition = ['((' + filterDefinition.join(") AND (") + '))'];

		console.log("Filter definition:" + filterDefinition[0]);
		console.log("layer definition updated");		
	}
	//end updateSensorsLayer function

	//begin filterHWMs function
	function filterHWMs(){
		console.log("filterHWMs function fired");

		filterDefinition.length = 0;
		
		if (!(registry.byId("hwmEventSelector").value == "All" || registry.byId("hwmEventSelector").value === "")) {
			filterDefinition.push("EVENT_NAME LIKE '" +  registry.byId("hwmEventSelector").value + "'");
		} else {
			filterDefinition.push("EVENT_NAME LIKE '%'");
		}

		if (!(registry.byId("hwmStateSelector").value == "All" || registry.byId("hwmStateSelector").value === "")) {
			filterDefinition.push("STATE LIKE '" +  registry.byId("hwmStateSelector").value + "'");
		} else {
			filterDefinition.push("STATE LIKE '%'");
		}

		if (!(registry.byId("hwmCountySelector").value == "All" || registry.byId("hwmCountySelector").value === "")) {
			filterDefinition.push("COUNTY LIKE '" +  registry.byId("hwmCountySelector").value + "'");
		} else {
			filterDefinition.push("COUNTY LIKE '%'");
		}

		filterDefinition = ['((' + filterDefinition.join(") AND (") + '))'];

		console.log ("HWM Filter Definition: " + filterDefinition[0]);

		console.log("hwm filter definition updated");
	}
	//end filterHWMs function

	function displayFilterCount () {
		console.log("displayFilterCount function fired");
		domAttr.set("filterCountText", {innerHTML:"Your site selection returned " + filterCount + " results."});
		dom.byId("filterCountIndicator").style.visibility = "visible";
	}

	var clearSelectionsHandler = on(dom.byId("clearButton"), "click", function (){

		filterDefinition.length = 0;
		var blankString = '';
		registry.byId("fromDate").setDisplayedValue(blankString);
		registry.byId("toDate").setDisplayedValue(blankString);
		registry.byId("eventSelector").setDisplayedValue(blankString);
		registry.byId("stateSelector").setDisplayedValue(blankString);
		registry.byId("countySelector").setDisplayedValue(blankString);
		registry.byId("deploymentSelector").setDisplayedValue(blankString);
		registry.byId("sensorSelector").setDisplayedValue(blankString);
		registry.byId("statusSelector").setDisplayedValue(blankString);
		dom.byId("filterCountIndicator").style.visibility = "hidden";
		sensorsLayer.setLayerDefinitions(filterDefinition);
		sensorsLayer.refresh();
		sensorsLayer.setVisibility(false);
		hwmFilterLyr.setLayerDefinitions(filterDefinition);
		hwmFilterLyr.refresh();
		hwmFilterLyr.setVisibility(false);

		var fullExtent = new Extent({"xmin":-15238485.958928764,"ymin":2101101.0335023645,"xmax":-6286181.2061713,"ymax":7350184.639900593,"spatialReference":{"wkid":102100}});
		map.setExtent(fullExtent);

	});

	var clearHWMsHandler = on(dom.byId("hwmClearButton"), "click", function (){

		filterDefinition.length = 0;
		var blankString = '';
		registry.byId("hwmEventSelector").setDisplayedValue(blankString);
		registry.byId("hwmStateSelector").setDisplayedValue(blankString);
		registry.byId("hwmCountySelector").setDisplayedValue(blankString);
		dom.byId("filterCountIndicator").style.visibility = "hidden";
		hwmFilterLyr.setLayerDefinitions(filterDefinition);
		hwmFilterLyr.refresh();
		hwmFilterLyr.setVisibility(false);
		var fullExtent = new Extent({"xmin":-15238485.958928764,"ymin":2101101.0335023645,"xmax":-6286181.2061713,"ymax":7350184.639900593,"spatialReference":{"wkid":102100}});
		map.setExtent(fullExtent);
	});

	require([
	  "esri/tasks/query",
	  "esri/tasks/QueryTask",
	  "dojo/data/ItemFileReadStore",
	  "dojo/store/Memory",
	  "dijit/form/FilteringSelect",
	  "dojo/domReady!"
	], function(
	  Query,
	  QueryTask,
	  ItemFileReadStore,
	  Memory,
	  FilteringSelect
	) {

		

		

		////begin code for single dropdown based on list from table in service//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		var eventFilterValues;
		var eventStore;
		var eventQuery = new Query();
		eventQuery.where = "EVENT_NAME IS NOT null";
		eventList.queryFeatures(eventQuery, function(featureSet) {
	       eventFilterValues = array.map(featureSet.features, function(feature) {
		        return {
		           id: feature.attributes.EVENT_NAME,
		           eventName: feature.attributes.EVENT_NAME
		        };
	        });
		    eventFilterValues.unshift( new Object ({id: "All", eventName: "All"}));	  
			eventStore = new Memory({data: eventFilterValues});
			var eventSelectInput = new FilteringSelect({
			  	id: "eventSelector",
			  	name: "event",
			  	//value: "All",  //this property defines the deafult display on load. the problem is, if someone picks "All", there submit fails because there was no change to the value.
			  	store: eventStore,
			  	required: false,
			  	ignoreCase: true,
			  	fetchProperties: {sort:[{attribute:'eventName', descending:false}]},
			  	searchAttr: "eventName",
			  	onChange: function() {
			  		updateSensorsLayer();
			  	}	
			}, "eventSelector");
			eventSelectInput.startup();
		}); 

		var stateFilterValues;
		var stateStore;
		var stateQuery = new Query();
		stateQuery.where = "STATE IS NOT null";
		stateList.queryFeatures(stateQuery, function(featureSet) {
	        stateFilterValues = array.map(featureSet.features, function(feature) {
		        return {
		          id: feature.attributes.STATE,
		          stateName: feature.attributes.STATE
		        };
	        });
			stateFilterValues.unshift( new Object ({id: "All", stateName: "All"}));
			stateStore = new Memory({data: stateFilterValues});
		    var stateSelectInput = new FilteringSelect({
			  	id: "stateSelector",
			  	name: "state",
			  	store: stateStore,
			  	required: false,
			  	ignoreCase: true,
			  	fetchProperties: {sort:[{attribute:'stateName', descending:false}]},
			  	searchAttr: "stateName",
			  	onChange: function (){
			  		updateSensorsLayer();
			  	}	
		   }, "stateSelector");
		   stateSelectInput.startup();
		}); 

		var countyQuery = new Query();
		var countyStore;
		countyQuery.where = "COUNTY IS NOT null";
		countyList.queryFeatures(countyQuery, function(featureSet) {
		    var countyFilterValues = array.map(featureSet.features, function(feature) {
		        return {
			        id: feature.attributes.COUNTY,	
			        countyName: feature.attributes.COUNTY
		        };
		    });
		    countyFilterValues.unshift( new Object ({id: "All", countyName: "All"}));
		    countyStore = new Memory({data: countyFilterValues});
			var countySelectInput = new FilteringSelect({
			  	id: "countySelector",
			  	name: "county",
			  	store: countyStore,
			  	required: false,
			  	ignoreCase: true,
			  	fetchProperties: {sort:[{attribute:'countyName', descending:false}]},
			  	searchAttr: "countyName",
			  	onChange: function (){
			  		updateSensorsLayer();
			  	}	
	   	    }, "countySelector");
	        countySelectInput.startup();
		}); 

		var statusQuery = new Query();
		var statusStore;
		statusQuery.where = "STATUS IS NOT null";
		statusList.queryFeatures(statusQuery, function(featureSet) {
	        var statusFilterValues = array.map(featureSet.features, function(feature) {
	            return {
		            id: feature.attributes.STATUS,
		            statusName: feature.attributes.STATUS
	            };
	        });
			statusFilterValues.unshift( new Object ({id: "All", statusName: "All"}));
			statusStore = new Memory({data: statusFilterValues});
			var statusSelectInput = new FilteringSelect({
			  	id: "statusSelector",
			  	name: "status",
			  	store: statusStore,
			  	required: false,
			  	ignoreCase: true,
			  	fetchProperties: {sort:[{attribute:'statusName', descending:false}]},
			  	searchAttr: "statusName",
			  	onChange: function (){
			  		updateSensorsLayer();
			  	}	
	   	    }, "statusSelector");
	        statusSelectInput.startup();
		}); 

		var deploymentQuery = new Query();
		var deploymentStore;
		deploymentQuery.where = "METHOD IS NOT null";
		deploymentList.queryFeatures(deploymentQuery, function(featureSet) {
            var deploymentFilterValues = array.map(featureSet.features, function(feature) {
	            return {
	            	id: feature.attributes.METHOD,
		            deploymentName: feature.attributes.METHOD
	            };
            });
			deploymentFilterValues.unshift( new Object ({id: "All", deploymentName: "All"}));
			deploymentStore = new Memory({data: deploymentFilterValues});
			var deploymentSelectInput = new FilteringSelect({
			  	id: "deploymentSelector",
			  	name: "deployment",
			  	store: deploymentStore,
			  	required: false,
			  	ignoreCase: true,
			  	fetchProperties: {sort:[{attribute:'deploymentName', descending:false}]},
			  	searchAttr: "deploymentName",
			  	onChange: function (){
			  		updateSensorsLayer();
			  	}	
	   	    }, "deploymentSelector");
	        deploymentSelectInput.startup();
		});

		var sensorQuery = new Query();
		var sensorStore;
		sensorQuery.where = "SENSOR IS NOT null";
		sensorList.queryFeatures(sensorQuery, function(featureSet) {
	        var sensorFilterValues = array.map(featureSet.features, function(feature) {
		        return {
		        	id: feature.attributes.SENSOR,
			        sensorName: feature.attributes.SENSOR
		        };
	        });
			sensorFilterValues.unshift( new Object ({id: "All", sensorName: "All"}));
			sensorStore = new Memory({data: sensorFilterValues});
			var sensorSelectInput = new FilteringSelect({
			  	id: "sensorSelector",
			  	name: "sensor",
			  	store: sensorStore,
			  	required: false,
			  	ignoreCase: true,
			  	fetchProperties: {sort:[{attribute:'sensorName', descending:false}]},
			  	searchAttr: "sensorName",
			  	onChange: function (){
			  		updateSensorsLayer();
			  	}	
	   	    }, "sensorSelector");
	        sensorSelectInput.startup();
		}); 

		var hwmEventQuery = new Query();
		var hwmEventStore;
		hwmEventQuery.where = "EVENT_NAME IS NOT null";
		hwmEventList.queryFeatures(hwmEventQuery, function(featureSet) {
	        var hwmEventFilterValues = array.map(featureSet.features, function(feature) {
		        return {
		        	id: feature.attributes.EVENT_NAME,
			        hwmEventName: feature.attributes.EVENT_NAME
		        };
	        });
			hwmEventFilterValues.unshift( new Object ({ id: "All", hwmEventName: "All"}));
			hwmEventStore = new Memory({data: hwmEventFilterValues});
			var hwmEventInput = new FilteringSelect({
			  	id: "hwmEventSelector",
			  	name: "hwmEvent",
			  	store: hwmEventStore,
			  	required: false,
			  	ignoreCase: true,
			  	fetchProperties: {sort:[{attribute:'hwmEventName', descending:false}]},
			  	searchAttr: "hwmEventName",
			  	onChange: function (){
			  		filterHWMs();
			  	}	
	   	    }, "hwmEventSelector");
	        hwmEventInput.startup();
		});

		var hwmStateQuery = new Query();
		var hwmStateStore;
		hwmStateQuery.where = "STATE IS NOT null";
		hwmStateList.queryFeatures(hwmStateQuery, function(featureSet) {
	        var hwmStateFilterValues = array.map(featureSet.features, function(feature) {
		        return {
		        	id: feature.attributes.STATE,
			        hwmStateName: feature.attributes.STATE
		        };
	        });
			hwmStateFilterValues.unshift( new Object ({ id: "All", hwmStateName: "All"}));
			hwmStateStore = new Memory({data: hwmStateFilterValues});
			var hwmStateInput = new FilteringSelect({
			  	id: "hwmStateSelector",
			  	name: "hwmState",
			  	store: hwmStateStore,
			  	required: false,
			  	ignoreCase: true,
			  	fetchProperties: {sort:[{attribute:'hwmStateName', descending:false}]},
			  	searchAttr: "hwmStateName",
			  	onChange: function (){
			  		filterHWMs();
			  	}	
	   	    }, "hwmStateSelector");
	        hwmStateInput.startup();
		});

		var hwmCountyQuery = new Query();
		var hwmCountyStore;
		hwmCountyQuery.where = "COUNTY IS NOT null";
		hwmCountyList.queryFeatures(hwmCountyQuery, function(featureSet) {
	        var hwmCountyFilterValues = array.map(featureSet.features, function(feature) {
		        return {
		        	id: feature.attributes.COUNTY,
			        hwmCountyName: feature.attributes.COUNTY
		        };
	        });
			hwmCountyFilterValues.unshift( new Object ({ id: "All", hwmCountyName: "All"}));
			hwmCountyStore = new Memory({data: hwmCountyFilterValues});
			var hwmCountyInput = new FilteringSelect({
			  	id: "hwmCountySelector",
			  	name: "hwmCounty",
			  	store: hwmCountyStore,
			  	required: false,
			  	ignoreCase: true,
			  	fetchProperties: {sort:[{attribute:'hwmCountyName', descending:false}]},
			  	searchAttr: "hwmCountyName",
			  	onChange: function (){
			  		filterHWMs();
			  	}	
	   	    }, "hwmCountySelector");
	        hwmCountyInput.startup();
		});
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		//begin executeSensorFilter function 
		var executeFilterHandler = on(dom.byId("submitButton"), "click", function(){ 

			sensorsLayer.setDisableClientCaching(true);
			sensorsLayer.setLayerDefinitions(filterDefinition);
			sensorsLayer.refresh();
			sensorsLayer.setVisibility(true);
			
			selectionQueryTask = new QueryTask(mapServicesRoot + "/Sensors/MapServer/0");
			selectionQuery = new Query();

			selectionQuery.returnGeometry = true;
			selectionQuery.where = filterDefinition[0];

			selectionQueryTask.execute(selectionQuery,onQueryComplete);

			function onQueryComplete (results){

				var selectionExtent = new graphicsUtils.graphicsExtent(results.features);

				if (results.features.length > 1){
					map.setExtent(selectionExtent, true);
				} else {
					//Zoom to the location of the single returned feature's geometry
					var singleSiteGraphic = results.features[0];
					var location = new Point(singleSiteGraphic.geometry.x, singleSiteGraphic.geometry.y, map.spatialReference);
					map.centerAndZoom(location, 15);
				}
			}
				
			noRecordsQueryTask = new QueryTask(mapServicesRoot + "/Sensors/MapServer/0");
			noRecordsQuery = new Query();
			
			noRecordsQuery.where = filterDefinition[0];

			if (filterDefinition[0] !== "") {
			noRecordsQueryTask.executeForCount(noRecordsQuery, function (count){ 
				//alert("Your filter selection returned " + count + " sites.");
				filterCount = count;
				console.log("Site selection returned "+ count + " results");
				
				displayFilterCount();
			});
			
			}
			console.log("layer definition updated, executed, and extent refreshed");
		});
		//end executeSensorFilter function

		//begin executeHWMFilter function
		var executeHWMFilterHandler = on(dom.byId("hwmSubmitButton"), "click", function () {

			hwmFilterLyr.setDisableClientCaching(true);
			hwmFilterLyr.setLayerDefinitions(filterDefinition);
			hwmFilterLyr.refresh();
			hwmFilterLyr.setVisibility(true);

			selectionQueryTask = new QueryTask(mapServicesRoot + "/HWMs_forFilter/MapServer/0");
			selectionQuery = new Query();

			selectionQuery.returnGeometry = true;
			selectionQuery.where = filterDefinition[0];

			selectionQueryTask.execute(selectionQuery,onQueryComplete);

			function onQueryComplete (results){

				var selectionExtent = new graphicsUtils.graphicsExtent(results.features);

				if (results.features.length > 1){

					selectionExtent = selectionExtent.expand(2.3);
					map.setExtent(selectionExtent, true);

				} else {
					//Zoom to the location of the single returned feature's geometry
					var singleSiteGraphic = results.features[0];
					var location = new Point(singleSiteGraphic.geometry.x, singleSiteGraphic.geometry.y, map.spatialReference);
					map.centerAndZoom(location, 15);
				}
			}
				
			noRecordsQueryTask = new QueryTask(mapServicesRoot + "/HWMs/MapServer/0");
			noRecordsQuery = new Query();
			
			noRecordsQuery.where = filterDefinition[0];

			if (filterDefinition[0] !== "") {
			noRecordsQueryTask.executeForCount(noRecordsQuery, function (count){ 
				//alert("Your filter selection returned " + count + " sites.");
				filterCount = count;
				console.log(count);
				
				displayFilterCount();
			});
			
			}
			console.log("layer definition updated, executed, and extent refreshed");
		});
		//end executeHWMFilters function

		//build query task
	    var queryTask = new QueryTask(mapServicesRoot + "/Sites/MapServer/0");
		//build query filter
	    var siteIDquery = new Query();
	    siteIDquery.returnGeometry = true;
	    siteIDquery.outFields = ["SITE_ID"];
		
		//pass the url parameters for site
		var urlSiteObject = urlUtils.urlToObject(document.location.href);
		
		if (urlSiteObject.query){

			var siteid;
			
			if (urlSiteObject.query.siteid)
				{ siteid = urlSiteObject.query.siteid; }
			if (urlSiteObject.query.lat && urlSiteObject.query.lng ){ 
			
				lat = urlSiteObject.query.lat; 
				lng = urlSiteObject.query.lng; 
				
				var zoomPoint = new Point(lng,lat);
				var convertedPoint = new webMercatorUtils.geographicToWebMercator(zoomPoint);
				
				var pointSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_X, 15, 
					new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 2.5), 
					new Color([0,255,0,0.25]));
				//var pointSymbol = new esri.symbol.PictureMarkerSymbol('images/marieFaceSym.gif', 50, 50);
				var pointGraphic = new Graphic();
				pointGraphic.geometry = convertedPoint;
				pointGraphic.symbol = pointSymbol;
				map.graphics.clear();
				map.graphics.add(pointGraphic);
				map.centerAndZoom(zoomPoint, 15);
			
				//Refresh the URL with the currently selected parcel
				window.history.pushState(null,null,"?lat=" + lat + "&lng=" + lng);
				
			}

		//set query based on the parameters
		var idParam = "SITE_ID = '" + siteid + "'";
		siteIDquery.where = idParam;
		//execute query and call showSiteResults on completion
		queryTask.execute(siteIDquery,showSiteResults);
		}
	});/////end require
	
	//begin toggleCreateMode
	function toggleCreateMode () {
		
		inCreateMode = !inCreateMode;

		if (inCreateMode){
			console.log("Create Mode On");
			dom.byId("createModeIndicator").style.visibility = "visible";
		} else{
			console.log("Create Mode Off");
			dom.byId("createModeIndicator").style.visibility = "hidden";
		}
		
	}
	//end toggleCreateMode
	//begin displayCreateDialog function
	function displayCreateDialog () {
		console.log("displayCreateDialog function fired");
		
		domAttr.set("createDialogCoordinates", {innerHTML:"You have clicked at Latitude " + latitude.toFixed(8) + " and Longitude " + longitude.toFixed(8) +
		" </br>Would you like to create a new site at this location?"});
		
		registry.byId("createDialog").show();

	}
	//end displayCreateDialog function

	// function createSite () {

	// 	parent.CreateWithLatLong(latitude,longitude);
	// 	console.log("check");
		
	// }

	//function to iterate through allLayers array and build array for legend as well as array for adding services based on esri and wim specific options
	function addAllLayers() {

		var radioGroup;
			
		for (var layer in allLayers) {
			if (allLayers[layer].wimOptions.type == "layer") {
				console.log(layer);
				var newLayer;
				if (allLayers[layer].wimOptions.layerType == "agisFeature") {
					newLayer = new FeatureLayer(allLayers[layer].url, allLayers[layer].arcOptions);
				} else if (allLayers[layer].wimOptions.layerType == "agisWMS") {
					newLayer = new WMSLayer(allLayers[layer].url, allLayers[layer].arcOptions);
					/*if (allLayers[layer].wimOptions.includeLegend == true && allLayers[layer].wimOptions.staticLegendOptions.hasStaticLegend == true) {
						var staticLegendImage = dojo.doc.createElement("div");
						staticLegendImage.id = allLayers[layer].arcOptions.id + 'Legend';
						staticLegendImage.innerHTML = '<b style="">' + allLayers[layer].wimOptions.staticLegendOptions.legendTitle + '</b><br/><img style="padding-top: 10px; width: ' + (parseInt($("#explanation").width())-25).toString() + 'px" src="' + allLayers[layer].wimOptions.staticLegendOptions.legendUrl + '" />';
						dojo.place(staticLegendImage,dojo.byId("legendDiv"),"after");
						if (allLayers[layer].arcOptions.visible == false) {
							$("#" + staticLegendImage.id).hide();
						}
					}*/
				} else {
					newLayer = new ArcGISDynamicMapServiceLayer(allLayers[layer].url, allLayers[layer].arcOptions);
					if (allLayers[layer].visibleLayers) {
						newLayer.setVisibleLayers(allLayers[layer].visibleLayers);
					}
				}
				
				//set wim options
				if (allLayers[layer].wimOptions) {
					if (allLayers[layer].wimOptions.includeInLayerList === true) {
						if (allLayers[layer].wimOptions.layerOptions && allLayers[layer].wimOptions.layerOptions.selectorType == "radio" ) {

							radioGroup = allLayers[layer].wimOptions.layerOptions.radioGroup;
							radioGroupArray.push({group: radioGroup, layer:newLayer});

							addToObjects({layer: newLayer, type:"layer", title: layer, toggleType: "radio", group: radioGroup}, allLayers[layer].wimOptions);
							
						} else {
							addToObjects({layer: newLayer, type:"layer", title: layer, toggleType: "checkbox", group: ""}, allLayers[layer].wimOptions);
						}
					}
				} else {
					addToObjects({layer: newLayer, title: layer}, allLayers[layer].wimOptions);
				}
				layerArray.push(newLayer);
			} else if (allLayers[layer].wimOptions.type == "radioParent") {
				
				radioGroup = allLayers[layer].wimOptions.layerOptions.radioGroup;
				radioGroupArray.push({group: radioGroup, layer: null});
				
				layersObject.push({layer:null, type: "radioParent", title: layer, toggleType: "radioParent", group: radioGroup});
				
			} else {
				
				layersObject.push({layer: "heading", title: layer});
				
			}
		}
		
		
		function addToObjects(fullObject, wimOptions) {
			layersObject.push(fullObject); 
			if (wimOptions.includeLegend !== false) {
				legendLayers.push(fullObject); 
			}
		}

		layerArray.push(sensorsLayer);
		layerArray.push(hwmFilterLyr);
		layerArray.push(noaaConeTrackLyr);
		layerArray.push(nwisFeatureLyr);

		map.addLayers(layerArray); 
		
	}


	function mapReady(){

		// var legendNode = dom.byId("legendDiv");

		// var legend = new Legend({
		// 	map:map,
		// 	layerInfos:legendLayers
		// }, legendNode );
		// legend.startup();


		//map.addLayers([layerArray, sensorsLayer, hwmFilterLyr,noaaConeTrackLyr, nwisFeatureLyr]); 

		//domAttr.set(registry.byId("extentSelector"), "initExtent", map.extent)
		
		//Create scale bar programmatically because there are some event listeners that can't be set until the map is created.
		//Just uses a simple div with id "latLngScaleBar" to contain it
		//var latLngBar = new wim.LatLngScale({map: map}, 'latLngScaleBar');

		on(nwisFeatureLyr, "mouse-out", function () {map.infoWindow.hide();});

		on(nwisFeatureLyr, "mouse-over", function(evt) {

			var identifyNWIS = new IdentifyTask(mapServicesRoot + "/STN_nwis_rt/MapServer");
						
				identifyParams = new IdentifyParameters();
				identifyParams.tolerance = 5;
				identifyParams.returnGeometry = true;
				identifyParams.layerIds = [0];
				identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_TOP;
				identifyParams.width = map.width;
				identifyParams.height = map.height;
				identifyParams.geometry = evt.mapPoint;
				identifyParams.mapExtent = map.extent;

				identifyNWIS.execute(identifyParams, function(identifyResults){ 
		
					var gageNO = identifyResults[0].feature.attributes.Name;

					map.infoWindow.setTitle("NWIS Real-Time Layer");
					map.infoWindow.setContent(
						"<b>USGS gage ID: </b>" + gageNO

						);
					map.infoWindow.show(evt.mapPoint,map.getInfoWindowAnchor(evt.screenPoint));
				});
		});

		//toggles visibility of feature layer used for hover ability by tying it to visibility of the nwis dynamic layer
		on(layersObject[14].layer,"visibility-change", function(nwisLyrVisibility) {
			if (nwisLyrVisibility) {
				nwisFeatureLyr.setVisibility(true);
			} else {
				nwisFeatureLyr.setVisibility(false);
			}
		});

		on(map, "click", function(evt) { 
			
			if (inCreateMode === true){
				
				latitude = evt.mapPoint.getLatitude();
				longitude = evt.mapPoint.getLongitude();
				
				console.log(latitude,longitude);
				
				displayCreateDialog();
				
			} else {

			var i;
				for (i=0; i< map.layerIds.length; i++) {
					if (map.layerIds[i].match(/nwisLyr/g) !== null) {
						if (map.getLayer(map.layerIds[i]).visible === true) {
			
							var identifyNwisSite = new IdentifyTask(mapServicesRoot + "/STN_nwis_rt/MapServer");
						
							identifyParams = IdentifyParameters();
							identifyParams.tolerance =5;
							identifyParams.returnGeometry = true;
							identifyParams.layerIds = [0];
							identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
							identifyParams.width = map.width;
							identifyParams.height = map.height;
							identifyParams.geometry = evt.mapPoint;
							identifyParams.mapExtent = map.extent;
							identifyNwisSite.execute(identifyParams, function(identifyResults){ 
					
								var nwisSiteId = identifyResults[0].feature.attributes.Name;
					
									xhr({
										// The URL to request
										url: "/proxies/nwisChartProxy/Default.aspx",
										content: {
											site_no: nwisSiteId,
											chart_param: "00065",
											days_prev_to_current: "7"
											},
											//The method that handles the request's successful result
											//Handle the response any way you'd like!
											load: function(result){
												map.infoWindow.setTitle("USGS Site No:" + nwisSiteId);
												//map.infoWindow.setContent("<img src='" + result +"' width=400/>");
												map.infoWindow.setContent("<a target='_blank' href='http://waterdata.usgs.gov/usa/nwis/uv?site_no="+ nwisSiteId + "'><img src='" + result +"' width=400/></a>");
												map.infoWindow.resize(415, 450);
												map.infoWindow.show(evt.mapPoint,map.getInfoWindowAnchor(evt.screenPoint));
											}
									});
							});	
						}
					}
				}

			
				for (i=0; i< map.layerIds.length; i++) {
					if (map.layerIds[i].match(/sitesLyr/g) !== null) {
						if (map.getLayer(map.layerIds[i]).visible === true) {
							
							var identifyStnSite = new IdentifyTask(mapServicesRoot + "/Sites/MapServer");
					
							identifyParams = new IdentifyParameters();
							identifyParams.tolerance = 5;
							identifyParams.returnGeometry = true;
							identifyParams.layerIds = [0];
							identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
							identifyParams.width = map.width;
							identifyParams.height = map.height;
							identifyParams.geometry = evt.mapPoint;
							identifyParams.mapExtent = map.extent;
							identifyStnSite.execute(identifyParams, function(identifyResults){ 
					
								var stnSiteId = identifyResults[0].feature.attributes.SITE_ID;
								var siteName = identifyResults[0].feature.attributes.SITE_NAME;
					
								map.infoWindow.setTitle(siteName);
								map.infoWindow.setContent("<iframe style='width:100%; height:425px;'  src='"+ siteClickURL + stnSiteId + "'/>");
								map.infoWindow.resize(475, 475);
								map.infoWindow.show(evt.mapPoint,map.getInfoWindowAnchor(evt.screenPoint));
							});
						}
					}
				}
				
				
				for (i=0; i< map.layerIds.length; i++) {
					if (map.layerIds[i].match(/eventSites/g) !== null) {
						if (map.getLayer(map.layerIds[i]).visible === true) {
							
							var identifyEventSite = new IdentifyTask(mapServicesRoot + "/EventSites/MapServer");
					
							identifyParams = new IdentifyParameters();
							identifyParams.tolerance = 5;
							identifyParams.returnGeometry = true;
							identifyParams.layerIds = [0];
							identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
							identifyParams.width = map.width;
							identifyParams.height = map.height;
							identifyParams.geometry = evt.mapPoint;
							identifyParams.mapExtent = map.extent;
							identifyEventSite.execute(identifyParams, function(identifyResults){ 
					
								var stnSiteId = identifyResults[0].feature.attributes.SITE_ID;
								var siteName = identifyResults[0].feature.attributes.SITE_NAME;
					
								map.infoWindow.setTitle(siteName);
								map.infoWindow.setContent("<iframe style='width:100%; height:425px;'  src='" + siteClickURL + stnSiteId + "'/>");
								map.infoWindow.resize(475, 475);
								map.infoWindow.show(evt.mapPoint,map.getInfoWindowAnchor(evt.screenPoint));
							});
						}
					}
				}


				for (i=0; i< map.layerIds.length; i++) {
					if (map.layerIds[i].match(/drLyr/g) !== null) {
						if (map.getLayer(map.layerIds[i]).visible === true) {

							var identifyDRP = new IdentifyTask("http://services.femadata.com/arcgis/rest/services/ExternalAffairs/DisasterReporterService/MapServer/");
							
							identifyParams = new IdentifyParameters();
							identifyParams.tolerance = 5;
							identifyParams.returnGeometry = true;
							identifyParams.layerIds = [0];
							identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
							identifyParams.width = map.width;
							identifyParams.height = map.height;
							identifyParams.geometry = evt.mapPoint;
							identifyParams.mapExtent = map.extent;

							identifyDRP.execute(identifyParams, function(identifyResults){ 
					
								var imageURL = identifyResults[0].feature.attributes.ImageURL;
								var thumbnailURL = identifyResults[0].feature.attributes.ThumbnailURL;
								var title = identifyResults[0].feature.attributes.Title;
								var description = identifyResults[0].feature.attributes.Description;
								var disasterName = identifyResults[0].feature.attributes.DisasterName;
								var disasterType = identifyResults[0].feature.attributes.DisasterType;
								var city = identifyResults[0].feature.attributes.City;
								var state = identifyResults[0].feature.attributes.State;
								var reportDate = identifyResults[0].feature.attributes.ReportDate;
								var photoDate = identifyResults[0].feature.attributes.PhotoDate;

								map.infoWindow.setTitle("FEMA Disater Reporter Photo");
								map.infoWindow.setContent(
									"<b>" + title +  "</b>" +
									"</br><a target='_blank' href='"+ imageURL + "'><img title='Click for full resolution' src='" + thumbnailURL +"'/></a>" +
									"</br><b>" + description +
									"</b></br>Disaster Type:" + disasterType +
									"</br>Disaster Name:" + disasterName +
									"</br>Location:" + city + ", " + state +
									"</br>Report Date:" + reportDate +
									"</br>Photo Date:" + photoDate

								);
								//map.infoWindow.resize(475, 475);
								map.infoWindow.show(evt.mapPoint,map.getInfoWindowAnchor(evt.screenPoint));
							});
				   
							
						}
					}
				}

				for (i=0; i< map.layerIds.length; i++) {
					if (map.layerIds[i].match(/ahpsLyr/g) !== null) {
						if (map.getLayer(map.layerIds[i]).visible === true) {
							
							var identifyAHPS = new IdentifyTask("http://gis.srh.noaa.gov/arcgis/rest/services/ahps_gauges/MapServer");
					
							identifyParams = new IdentifyParameters();
							identifyParams.tolerance = 5;
							identifyParams.returnGeometry = true;
							identifyParams.layerIds = [0];
							identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_TOP;
							identifyParams.width = map.width;
							identifyParams.height = map.height;
							identifyParams.geometry = evt.mapPoint;
							identifyParams.mapExtent = map.extent;
							identifyAHPS.execute(identifyParams, function(identifyResults){ 
					
								var location = identifyResults[0].feature.attributes.location;
								var waterbody = identifyResults[0].feature.attributes.waterbody;
								var gageID = identifyResults[0].feature.attributes.gaugelid;
								var pageURL = identifyResults[0].feature.attributes.url;
								var graphURL = "http://water.weather.gov/resources/hydrographs/" + gageID.toLowerCase() + "_hg.png";
					
								map.infoWindow.setTitle("AHPS Observed");
								map.infoWindow.setContent(
									"<b>Gage ID: </b>" + gageID + 
									"</br><b>Location: </b>" + location +
									"</br><b>Waterbody: </b>" + waterbody +
									"</br><a target='_blank' href='"+ pageURL + "'><img title='Click for details page' width=300 src='" + graphURL +"'/></a>" 
								);
								map.infoWindow.resize(320, 475);
								map.infoWindow.show(evt.mapPoint,map.getInfoWindowAnchor(evt.screenPoint));
							});
						}
					}
				}

				for (i=0; i< map.layerIds.length; i++) {
					if (map.layerIds[i].match(/watchWarnLyr/g) !== null) {
						if (map.getLayer(map.layerIds[i]).visible === true) {
							
							var identifyWatchWarn = new IdentifyTask("http://gis.srh.noaa.gov/ArcGIS/rest/services/watchwarn/MapServer");
					//maybe remove the trailing number
							identifyParams = new IdentifyParameters();
							identifyParams.tolerance = 5;
							identifyParams.returnGeometry = true;
							identifyParams.layerIds = [1];
							identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_TOP;
							identifyParams.width = map.width;
							identifyParams.height = map.height;
							identifyParams.geometry = evt.mapPoint;
							identifyParams.mapExtent = map.extent;
							identifyWatchWarn.execute(identifyParams, function(identifyResults){ 
					
								var type = identifyResults[0].feature.attributes.prod_type;
								var issued = identifyResults[0].feature.attributes.ISSUANCE;
								var expired = identifyResults[0].feature.attributes.EXPIRATION;
								var url = identifyResults[0].feature.attributes.URL;
					
								map.infoWindow.setTitle("NWS Watches/Warnings");
								map.infoWindow.setContent(
									"<b>"+ type +
									"</br>Issued:</b>" + issued +
									"</br><b>Expires:</b>" + expired +
									"</br><a target='_blank' href='"+  url +"'>Alert Text</a>");
								map.infoWindow.show(evt.mapPoint,map.getInfoWindowAnchor(evt.screenPoint));
							});
						}
					}
				}

				
				// function executeQueryTask(evt){
				// 	//Clear the query originally set by the url parameters
				// 	siteIDquery.where = "SITE_ID IS NOT NULL";		
				// 	//Query based on the location clicked
				// 	siteIDquery.geometry = evt.mapPoint;		
				// 	//Execute task and call showSiteResults on completion
				// 	queryTask.execute(siteIDquery, showSiteResults);		
				// }

				// executeQueryTask();	
			}
			//end of else statement
		});
		//end of on click for map


		on(map, "update-end", function () {
				domStyle.set('loadingScreen', 'visibility', 'hidden');
				
				on(map, "update-start", function () {
					domStyle.set('refreshScreen', 'visibility', 'visible');
				});
				
				on(map, "update-end", function () {
					domStyle.set('refreshScreen', 'visibility', 'hidden');
				});
			});
		
		// domStyle.set('loadingScreen', 'opacity', '0.75');
		// var loadingUpdate = on(map, "update-start", function() { 
		// domStyle.set('loadingScreen', 'visibility', 'visible');
		// });
		
		// on(map, "update-end", function (){ 
		// 	domStyle.set('loadingScreen', 'visibility', 'hidden');
		// 	dojo.disconnect(loadingUpdate);
		
		// 	dojo.connect(map, "onUpdateStart",function(){
		// 		dojo.style('refreshScreen', 'visibility', 'visible');
		// 	});
			
		// 	dojo.connect(map, "onUpdateEnd", function(){
		// 		dojo.style('refreshScreen', 'visibility', 'hidden');
		// 	});
		// });

		// on(map, "update-end", function () {
		// 	domStyle.set('loadingScreen', 'visibility', 'hidden');
			
		// 	on(map, "update-start", function () {
		// 		domStyle.set('refreshScreen', 'visibility', 'visible');
		// 	});
			
		// 	on(map, "update-end", function () {
		// 		domStyle.set('refreshScreen', 'visibility', 'hidden');
		// 	});
		// });
	} /////end of mapready

});/////end of parent require statement