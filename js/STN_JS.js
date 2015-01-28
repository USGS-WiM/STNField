// Blake Draper 2013
dojo.require("esri.map");
dojo.require("esri.arcgis.utils");
dojo.require("esri.dijit.Popup");
dojo.require("esri.dijit.Legend");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.graphic");
dojo.require("esri.layers.wms");
dojo.require("esri.config");

dojo.require("esri.virtualearth.VETiledLayer");
dojo.require("esri.tasks.locator");
dojo.require("esri.tasks.query");

dojo.require("dojox.grid.DataGrid");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dojo.date.stamp");

dojo.require("dijit.TitlePane");
dojo.require("dijit.Tooltip");
dojo.require("dijit.Toolbar");
dojo.require("dijit.Menu");
dojo.require("dijit.TooltipDialog");

dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");

dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.RadioButton");
dojo.require("dijit.form.DateTextBox");
dojo.require("dijit.form.ComboBox");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.DropDownButton");
dojo.require("dijit.form.FilteringSelect");
dojo.require("dijit.Dialog");

dojo.require("wim.ExtentNav");
dojo.require("wim.LatLngScale");
dojo.require("wim.CollapsingContainer");
dojo.require("wim.RefreshScreen");
dojo.require("wim.LoadingScreen");

      
var map, layerArray = [];
var mapLayers = [];
var legendLayers = [];
var radioGroupArray = [];
var allLayers;
var identifyTask, identifyParams;

var layersObject = [];

var navToolbar;
var locator;
//var locator2;

var eventStore;
var statusStore;

var sitesLayer;
var eventSitesLayer;
var sensorsLayer;
var layerDefinitions = [];
var noRecordsQuery;

var inCreateMode = false;

var createDialog;

var latitude, longitude;

var selectionExtent;

var filterCount;

var evt;

//var nwisFeatureLyr;

var currentRadParCheck;

var selectionQueryTask;
var selectionQuery;
var EventListResponse = false;

var filterDefinition = [];


      
function init() {

	allLayers = STNLayers;
	
	esri.config.defaults.io.proxyUrl = "/STNProxy/proxy.ashx";
	esri.config.defaults.io.alwaysUseProxy = true;
	//esri.config.defaults.io.corsEnabledServers.push("http://server.arcgisonline.com");
	
	//setup the popup window 
	var popup = new esri.dijit.Popup({
	selectionSymbol: new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, new dojo.Color([255,0,0]))}, dojo.create("div"));
   
	map = new esri.Map("map", {
    	basemap: "topo",
		wrapAround180: true,
		extent: new esri.geometry.Extent({"xmin":-14284551.845930014,"ymin":2700367.3352579884,"xmax":-7240115.31917005,"ymax":6750918.338144969,"spatialReference":{wkid:3857}}),
        infoWindow: popup,
		slider: true,
		sliderStyle: "large", //use "small" for compact version
		logo:false
	});
	
    navToolbar = new esri.toolbars.Navigation(map);
	
    dojo.connect(map, "onLoad", mapReady);
	
	var basemapGallery = new esri.dijit.BasemapGallery({
		showArcGISBasemaps: true,
		map: map
	}, "basemapGallery");
	basemapGallery.startup();
	
	dojo.connect(basemapGallery, "onError", function(msg) {console.log("Basemap gallery failed")});
	
	dojo.connect(basemapGallery,"onSelectionChange",function(){
		
  		dojo.byId("dijit_TitlePane_0_titleBarNode")._onTitleClick;
		console.log("check");
		
	});

	//end allLayers object
	//dojo.connect(map, "onClick", executeSiteIdentifyTask);
  	sensorsLayer = new esri.layers.ArcGISDynamicMapServiceLayer(mapServicesRoot + "/Sensors/MapServer", {"visible":false });
    sensorsLayer.setDisableClientCaching(true);

    hwmFilterLyr = new esri.layers.ArcGISDynamicMapServiceLayer(mapServicesRoot + "/HWMs_forFilter/MapServer", {"visible":false });
    hwmFilterLyr.setDisableClientCaching(true);

    //nwisFeatureLyr = new esri.layers.FeatureLayer(mapServicesRoot + "/STN_nwis_rt/MapServer/0", { mode: esri.layers.FeatureLayer.MODE_ONDEMAND, opacity: 0, minScale: 1155582, visible: false, outFields: ["*"]});

	///////begin existing dropdown populate code
	var eventList = new esri.layers.FeatureLayer(mapServicesRoot + "/Sensors/MapServer/3", { mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

	var statusList = new esri.layers.FeatureLayer(mapServicesRoot + "/Sensors/MapServer/2", { mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

	var deploymentList = new esri.layers.FeatureLayer(mapServicesRoot + "/Sensors/MapServer/4", { mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

	var sensorList = new esri.layers.FeatureLayer(mapServicesRoot + "/Sensors/MapServer/5", { mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

	var stateList = new esri.layers.FeatureLayer(mapServicesRoot + "/Sensors/MapServer/6", { mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

	var countyList = new esri.layers.FeatureLayer(mapServicesRoot + "/Sensors/MapServer/7", { mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

	///////

	var hwmEventList = new esri.layers.FeatureLayer(mapServicesRoot + "/HWMs_forFilter/MapServer/2", { mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

	var hwmStateList = new esri.layers.FeatureLayer(mapServicesRoot + "/HWMs_forFilter/MapServer/3", { mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

	var hwmCountyList = new esri.layers.FeatureLayer(mapServicesRoot + "/HWMs_forFilter/MapServer/4", { mode: esri.layers.FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});

   var coneTrack = new esri.layers.WMSLayerInfo({
   		name: 'probConeLyr',
   		title: 'Probability Cone and Tracks',
   		transparent: false
   });

   var noaaWMSResourceInfo = {
             extent: new esri.geometry.Extent( -127.177734375,17.578125,-65.302734375,52.470703125, {
               wkid: 4326
             }),
             layerInfos: [coneTrack]
           };

   var noaaConeTrackLyr = new esri.layers.WMSLayer("http://nowcoast.noaa.gov/wms/com.esri.wms.Esrimap/wwa", {
   		resourceInfo: noaaWMSResourceInfo,
   		opacity: 0.60,
   		visibleLayers: ['NHC_TRACK_POLY','NHC_TRACK_LIN','NHC_TRACK_PT', 'NHC_TRACK_WWLIN',
   		'NHC_TRACK_PT_72DATE','NHC_TRACK_PT_120DATE','NHC_TRACK_PT_0NAMEDATE', 'NHC_TRACK_PT_MSLPLABELS',
   		'NHC_TRACK_PT_72WLBL','NHC_TRACK_PT_120WLBL','NHC_TRACK_PT_72CAT','NHC_TRACK_PT_120CAT']
   });
   // map.addLayers([noaaConeTrackLyr, nwisFeatureLyr]);
   //////line above disabled because nwisFeatureLyr is causing basemaps to not load on init
	map.addLayers([noaaConeTrackLyr]);

	////begin code for single dropdown based on list from table in service
	var eventQuery = new esri.tasks.Query();
	eventQuery.where = "EVENT_NAME IS NOT null";
	
	eventList.queryFeatures(eventQuery, function(featureSet) {
          var eventFilterValues = dojo.map(featureSet.features, function(feature) {
            return {
              eventName: feature.attributes.EVENT_NAME
            };
          });
		  
		  eventFilterValues.unshift( new Object ({eventName: " All"}));
		  
		  var eventDataItems = {
		  	identifier: 'eventName',
			label: 'eventName',
			items: eventFilterValues
		  };
		   
		  eventStore = new dojo.data.ItemFileReadStore({
		  	data: eventDataItems
		  });
		  
		  dijit.byId("eventSelectInput").set("store", eventStore);

	}); 
	var stateQuery = new esri.tasks.Query();
	stateQuery.where = "STATE IS NOT null";
	
	stateList.queryFeatures(stateQuery, function(featureSet) {
          var stateFilterValues = dojo.map(featureSet.features, function(feature) {
            return {
              stateOption: feature.attributes.STATE
            };
          });
		  
		  stateFilterValues.unshift( new Object ({stateOption: " All"}));
		  
		  var stateDataItems = {
		  	identifier: 'stateOption',
			label: 'stateOption',
			items: stateFilterValues
		  };
		   
		  stateStore = new dojo.data.ItemFileReadStore({
		  	data: stateDataItems
		  });
		  
		  dijit.byId("stateSelectInput").set("store", stateStore);

	}); 
	var countyQuery = new esri.tasks.Query();
	countyQuery.where = "COUNTY IS NOT null";
	
	countyList.queryFeatures(countyQuery, function(featureSet) {
          var countyFilterValues = dojo.map(featureSet.features, function(feature) {
            return {
              countyOption: feature.attributes.COUNTY
            };
          });
		  
		  countyFilterValues.unshift( new Object ({countyOption: " All"}));
		  
		  var countyDataItems = {
		  	identifier: 'countyOption',
			label: 'countyOption',
			items: countyFilterValues
		  };
		   
		  countyStore = new dojo.data.ItemFileReadStore({
		  	data: countyDataItems
		  });
		  
		  dijit.byId("countySelectInput").set("store", countyStore);

	}); 
	var statusQuery = new esri.tasks.Query();
	statusQuery.where = "STATUS IS NOT null";
	
	statusList.queryFeatures(statusQuery, function(featureSet) {
          var statusFilterValues = dojo.map(featureSet.features, function(feature) {
            return {
              statusOption: feature.attributes.STATUS
            };
          });
		  
		  statusFilterValues.unshift( new Object ({statusOption: " All"}));
		  
		  var statusDataItems = {
		  	identifier: 'statusOption',
			label: 'statusOption',
			items: statusFilterValues
		  };
		   
		  statusStore = new dojo.data.ItemFileReadStore({
		  	data: statusDataItems
		  });
		  
		  dijit.byId("statusSelectInput").set("store", statusStore);

	}); 
	var deploymentQuery = new esri.tasks.Query();
	deploymentQuery.where = "METHOD IS NOT null";
	
	deploymentList.queryFeatures(deploymentQuery, function(featureSet) {
          var deploymentFilterValues = dojo.map(featureSet.features, function(feature) {
            return {
              deploymentOption: feature.attributes.METHOD
            };
          });
		  
		  deploymentFilterValues.unshift( new Object ({deploymentOption: " All"}));
		  
		  var deploymentDataItems = {
		  	identifier: 'deploymentOption',
			label: 'deploymentOption',
			items: deploymentFilterValues
		  };
		   
		  deploymentStore = new dojo.data.ItemFileReadStore({
		  	data: deploymentDataItems
		  });
		  
		  dijit.byId("deploymentSelectInput").set("store", deploymentStore);

	}); 
	var sensorQuery = new esri.tasks.Query();
	sensorQuery.where = "SENSOR IS NOT null";
	
	sensorList.queryFeatures(sensorQuery, function(featureSet) {
          var sensorFilterValues = dojo.map(featureSet.features, function(feature) {
            return {
              sensorOption: feature.attributes.SENSOR
            };
          });
		  
		  sensorFilterValues.unshift( new Object ({sensorOption: " All"}));
		  
		  var sensorDataItems = {
		  	identifier: 'sensorOption',
			label: 'sensorOption',
			items: sensorFilterValues
		  };
		   
		  sensorStore = new dojo.data.ItemFileReadStore({
		  	data: sensorDataItems
		  });
		  
		  dijit.byId("sensorSelectInput").set("store", sensorStore);

	}); 



	var hwmEventQuery = new esri.tasks.Query();
	hwmEventQuery.where = "EVENT_NAME IS NOT null";
	
	hwmEventList.queryFeatures(eventQuery, function(featureSet) {
          var eventFilterValues = dojo.map(featureSet.features, function(feature) {
            return {
              eventName: feature.attributes.EVENT_NAME
            };
          });
		  
		  eventFilterValues.unshift( new Object ({eventName: " All"}));
		  
		  var eventDataItems = {
		  	identifier: 'eventName',
			label: 'eventName',
			items: eventFilterValues
		  };
		   
		  eventStore = new dojo.data.ItemFileReadStore({
		  	data: eventDataItems
		  });
		  
		  dijit.byId("hwmEventSelectInput").set("store", eventStore);

	}); 
	var hwmStateQuery = new esri.tasks.Query();
	hwmStateQuery.where = "STATE IS NOT null";
	
	hwmStateList.queryFeatures(stateQuery, function(featureSet) {
          var stateFilterValues = dojo.map(featureSet.features, function(feature) {
            return {
              stateOption: feature.attributes.STATE
            };
          });
		  
		  stateFilterValues.unshift( new Object ({stateOption: " All"}));
		  
		  var stateDataItems = {
		  	identifier: 'stateOption',
			label: 'stateOption',
			items: stateFilterValues
		  };
		   
		  stateStore = new dojo.data.ItemFileReadStore({
		  	data: stateDataItems
		  });
		  
		  dijit.byId("hwmStateSelectInput").set("store", stateStore);

	}); 
	var hwmCountyQuery = new esri.tasks.Query();
	hwmCountyQuery.where = "COUNTY IS NOT null";
	
	hwmCountyList.queryFeatures(countyQuery, function(featureSet) {
          var countyFilterValues = dojo.map(featureSet.features, function(feature) {
            return {
              countyOption: feature.attributes.COUNTY
            };
          });
		  
		  countyFilterValues.unshift( new Object ({countyOption: " All"}));
		  
		  var countyDataItems = {
		  	identifier: 'countyOption',
			label: 'countyOption',
			items: countyFilterValues
		  };
		   
		  countyStore = new dojo.data.ItemFileReadStore({
		  	data: countyDataItems
		  });
		  
		  dijit.byId("hwmCountySelectInput").set("store", countyStore);

	}); 


 	
	dojo.connect(map,'onLayersAddResult',function(results){
		//$("#legendDiv").hide();

		var legend = new esri.dijit.Legend({
			map:map,
			layerInfos:legendLayers
		},"legendDiv");
		legend.startup();
		
		//this counter to track first and last of items in legendLayers
		var i = 0;
		var lastItem = layersObject.length;
		//this forEach loop generates the checkbox toggles for each layer by looping through the legendLayers array (same way the legend element is generated). 
		dojo.forEach (layersObject, function(layer){
			
			var layerName = layer.title;
				
			
			if (layer.layer != "heading") {
				
				if (layer.toggleType == "radioParent"){
						
					var radioParentCheck = new dijit.form.CheckBox({
						name: "radioParentCheck" + layer.group,
						id: "radioParentCheck_" + layer.group,
						params: {group: layer.group},
						onChange: function(evt){
							var radChildLayers = [];
							var grp = this.params.group;
							dojo.forEach (layersObject, function (layer){
								if (grp == layer.group && layer.toggleType != "radioParent"  ){
									radChildLayers.push(layer.layer);
								}
							});
							if (!this.checked){
								dojo.forEach (radChildLayers, function (layer){
									layer.setVisibility(false);
								});	
								var divs = dojo.query("." + grp);
								for(var i = 0; i < divs.length; i++) {
									divs[i].style.display= "none";  
								}
							} 
							if (this.checked){
								var divs = dojo.query("." + grp);
								for(var i = 0; i < divs.length; i++) {
								    divs[i].style.display= "block"; 
								}
								dojo.forEach (radChildLayers, function (layer){
									if (dojo.byId("radioButton"+layer.id).checked) {
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
					var toggleDiv = dojo.doc.createElement("div");			
					dojo.place(toggleDiv,dojo.byId("toggle"), "after" );
					dojo.place(radioParentCheck.domNode,toggleDiv,"first");
					dojo.setStyle(toggleDiv, "paddingLeft", "15px");
					if (i == 0) {
						dojo.setStyle(toggleDiv, "paddingBottom", "10px");
					} else if (i == lastItem) {
						dojo.setStyle(toggleDiv, "paddingTop", "10px");
					}
					var radioParentCheckLabel = dojo.create('label',{'for':radioParentCheck.name,innerHTML:layerName},radioParentCheck.domNode,"after");
					dojo.place("<br/>",radioParentCheckLabel,"after");

				} else if (layer.toggleType == "radio") {
						
					var radioButton = new dijit.form.RadioButton({
						name: layer.group,
						id: "radioButton" + layer.layer.id,
						value:layer.layer.id,
						checked:layer.layer.visible,
						params: {group: layer.group},
						onChange:function(evt){
							var radioLayer = map.getLayer(this.value);
							var parentID = "radioParentCheck_" + layer.group;
							(this.checked && dijit.byId(parentID).checked) ? radioLayer.setVisibility(true) : radioLayer.setVisibility(false);						
						}
					});
					var toggleDiv = dojo.doc.createElement("div");
					dojo.place(toggleDiv,dojo.byId("toggle"), "after" );
					dojo.place(radioButton.domNode,toggleDiv,"first");
					dojo.setAttr(toggleDiv, "class", radioButton.params.group);
					dojo.setStyle(toggleDiv, "paddingLeft", "25px");
					dojo.setStyle(toggleDiv, "display", "none");
					if (i == 0) {
						dojo.setStyle(toggleDiv, "paddingBottom", "10px");
					} else if (i == lastItem) {
						dojo.setStyle(toggleDiv, "paddingTop", "10px");
					}
					var radioLabel = dojo.create('label',{'for':radioButton.name,innerHTML:layerName},radioButton.domNode,"after");
					dojo.place("<br/>",radioLabel,"after");
					
				} else {
					
					var checkBox = new dijit.form.CheckBox({
						name:"checkBox" + layer.layer.id,
						value:layer.layer.id,
						checked:layer.layer.visible,
						onChange:function(evt){
							var checkLayer = map.getLayer(this.value);
							checkLayer.setVisibility(!checkLayer.visible);
							this.checked = checkLayer.visible;
							if (allLayers[layerName].wimOptions.includeLegend == true && allLayers[layerName].wimOptions.staticLegendOptions.hasStaticLegend == true) {
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
						var toggleDiv = dojo.doc.createElement("div");
						dojo.place(toggleDiv,dojo.byId("toggle"),"after");
						dojo.place(checkBox.domNode,toggleDiv,"first");
						var checkLabel = dojo.create('label',{'for':checkBox.name,innerHTML:layerName},checkBox.domNode,"after");
						var scale = allLayers[layerName].wimOptions.zoomScale;
						var zoomImage = dojo.doc.createElement("div");
						zoomImage.id = 'zoom' + layer.layer.id;
						zoomImage.innerHTML = '<img id="zoomImage" style="height: 18px;width: 18px" src="images/zoom.gif" />';
						dojo.connect(zoomImage, "click", function() {
							if (map.getScale() > scale) {
								map.setScale(scale);;
							}
						});
						dojo.place(zoomImage,toggleDiv,"last");
						dojo.setStyle(checkBox.domNode, "float", "left");
						dojo.setStyle(toggleDiv, "paddingLeft", "15px");
						dojo.setStyle(checkLabel, "float", "left");
						dojo.setStyle(toggleDiv, "paddingTop", "5px");
						dojo.setStyle(dojo.byId("zoomImage"), "paddingLeft", "10px");
						dojo.setStyle(toggleDiv, "height", "25px");
						if (i == 0) {
							dojo.setStyle(toggleDiv, "paddingBottom", "10px");
						} else if (i == lastItem) {
							dojo.setStyle(toggleDiv, "paddingTop", "10px");
						}
						dojo.place("<br/>",zoomImage,"after");
					} else {
						var toggleDiv = dojo.doc.createElement("div");
						dojo.place(toggleDiv,dojo.byId("toggle"),"after");
						dojo.place(checkBox.domNode,toggleDiv,"first");
						dojo.setStyle(toggleDiv, "paddingLeft", "15px");
						if (i == 0) {
							dojo.setStyle(toggleDiv, "paddingBottom", "10px");
						} else if (i == lastItem) {
							dojo.setStyle(toggleDiv, "paddingTop", "10px");
						}
						var checkLabel = dojo.create('label',{'for':checkBox.name,innerHTML:layerName},checkBox.domNode,"after");
						dojo.place("<br/>",checkLabel,"after");
					}
					
				}
			} else {
				var headingDiv = dojo.doc.createElement("div");
				headingDiv.innerHTML = layer.title;
				dojo.place(headingDiv,dojo.byId("toggle"),"after");
				dojo.setStyle(headingDiv, "paddingTop", "10px");
				dojo.setStyle(headingDiv, "color", "#D3CFBA");
				if (i == 0) {
					dojo.setStyle(headingDiv, "paddingBottom", "10px");
				} else if (i == lastItem) {
					dojo.setStyle(headingDiv, "paddingTop", "10px");
				}
			}
			i++;
			//don't miss this iterator!!!!!
		});
		
		//function to handle styling adjustments to the esri legend dijit
		setTimeout(function(){
			$.each($('div[id^="legendDiv_"]'), function (index, item) {
				for (layer in allLayers) {
					if (layer == $('#'+item.id+' span').html()) {
						if (allLayers[layer].wimOptions.esriLegendLabel !== undefined && allLayers[layer].wimOptions.esriLegendLabel == false) {
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
    locator = new esri.tasks.Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
    dojo.connect(locator, "onAddressToLocationsComplete", showGeocodeResults);
}
//end of init function


//begin showSiteResults function for siteid params
function showSiteResults(featureSet){
		//remove all graphics on the maps graphics layer
        map.graphics.clear();
       	map.infoWindow.hide();
		//Performance enhancer - assign featureSet array to a single variable.
		var resultFeatures = featureSet.features;
		//Zoom to the extent of the graphics
		var graphic = resultFeatures[0];
		var mapPoint = new esri.geometry.Point(graphic.geometry.x, graphic.geometry.y, map.spatialReference);
		map.centerAndZoom(mapPoint, 15)	
		//Refresh the URL with the currently selected parcel
		window.history.pushState(null,null,"?siteid=" + graphic.attributes.SITE_ID);
}
//end showSiteResults function for siteid params
//begin updateSensorsLayer function
function updateSensorsLayer(filterParams){
	
	console.log("updateSensorsLayer function fired");
	
	//layerDefinitions.length = 0;
	filterDefinition.length = 0;

	//for unknown stupid reason, date fields must come first in the layerDef expression. 
	if (!(dijit.byId("fromDate").displayedValue == "")) {

		var fromDateObject = dijit.byId("fromDate").value;
		var fromDateISO = dojo.date.locale.format(fromDateObject, {datePattern: "yyyy-MM-dd", selector: "date"})

		filterDefinition.push("EVENT_START_DATE >= date '" + fromDateISO + "'");
	} else {
		filterDefinition.push("EVENT_START_DATE LIKE '%'");
	}
	
	if (!(dijit.byId("toDate").displayedValue == "")) {

		var toDateObject = dijit.byId("toDate").value;
		var toDateISO = dojo.date.locale.format(fromDateObject, {datePattern: "yyyy-MM-dd", selector: "date"})

		filterDefinition.push("EVENT_END_DATE <= date '" + toDateISO + "'");
	} else {
		filterDefinition.push("EVENT_END_DATE LIKE '%'");
	}

	if (!(dijit.byId("eventSelectInput").value == " All" || dijit.byId("eventSelectInput").value == "")) {
		filterDefinition.push("EVENT_NAME LIKE '" +  dijit.byId("eventSelectInput").value + "'");
	} else {
		filterDefinition.push("EVENT_NAME LIKE '%'");
	}

	if (!(dijit.byId("stateSelectInput").value == " All" || dijit.byId("stateSelectInput").value == "")) {
		filterDefinition.push("STATE LIKE '" +  dijit.byId("stateSelectInput").value + "'");
	} else {
		filterDefinition.push("STATE LIKE '%'");
	}

	if (!(dijit.byId("countySelectInput").value == " All" || dijit.byId("countySelectInput").value == "")) {
		filterDefinition.push("COUNTY LIKE '" +  dijit.byId("countySelectInput").value + "'");
	} else {
		filterDefinition.push("COUNTY LIKE '%'");
	}

	if (!(dijit.byId("deploymentSelectInput").value == " All" || dijit.byId("deploymentSelectInput").value == "")) {
		filterDefinition.push("METHOD LIKE '" +  dijit.byId("deploymentSelectInput").value + "'");
	} else {
		filterDefinition.push("METHOD LIKE '%'");
	}

	if (!(dijit.byId("sensorSelectInput").value == " All" || dijit.byId("sensorSelectInput").value == "")) {
		filterDefinition.push("SENSOR LIKE '" +  dijit.byId("sensorSelectInput").value + "'");
	} else {
		filterDefinition.push("SENSOR LIKE '%'");
	}

	if (!(dijit.byId("statusSelectInput").value == " All" || dijit.byId("statusSelectInput").value == "")) {
		filterDefinition.push("STATUS LIKE '" +  dijit.byId("statusSelectInput").value + "'");
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

	console.log(filterDefinition[0]);
	console.log("layer definition updated");
	
}
//end updateSensorsLayer function

//begin filterHWMs function
function filterHWMs(filterParams){
	console.log("filterSensors function fired");

	filterDefinition.length = 0;
	
	if (!(dijit.byId("hwmEventSelectInput").value == " All" || dijit.byId("hwmEventSelectInput").value == "")) {
		filterDefinition.push("EVENT_NAME LIKE '" +  dijit.byId("hwmEventSelectInput").value + "'");
	} else {
		filterDefinition.push("EVENT_NAME LIKE '%'");
	}

	if (!(dijit.byId("hwmStateSelectInput").value == " All" || dijit.byId("hwmStateSelectInput").value == "")) {
		filterDefinition.push("STATE LIKE '" +  dijit.byId("hwmStateSelectInput").value + "'");
	} else {
		filterDefinition.push("STATE LIKE '%'");
	}

	if (!(dijit.byId("hwmCountySelectInput").value == " All" || dijit.byId("hwmCountySelectInput").value == "")) {
		filterDefinition.push("COUNTY LIKE '" +  dijit.byId("hwmCountySelectInput").value + "'");
	} else {
		filterDefinition.push("COUNTY LIKE '%'");
	}

	filterDefinition = ['((' + filterDefinition.join(") AND (") + '))'];

	console.log (filterDefinition[0]);

	console.log("filter definition updated");
}
//end filterHWMs function


function displayFilterCount () {
	console.log("displayFilterCount function fired");
	
	dojo.attr("filterCountText", {innerHTML:"Your site selection returned " + filterCount + " results."});
	
	dojo.byId("filterCountIndicator").style.visibility = "visible";

}

function clearSelections(){

	filterDefinition.length = 0;

	//dojo.connect(dijit.byId("eventSelectInput"),"displayedValue", "");

	var blankString = '';

	dijit.byId("fromDate").setDisplayedValue(blankString);
	dijit.byId("toDate").setDisplayedValue(blankString);
	dijit.byId("eventSelectInput").setDisplayedValue(blankString);
	dijit.byId("stateSelectInput").setDisplayedValue(blankString);
	dijit.byId("countySelectInput").setDisplayedValue(blankString);
	dijit.byId("deploymentSelectInput").setDisplayedValue(blankString);
	dijit.byId("sensorSelectInput").setDisplayedValue(blankString);
	dijit.byId("statusSelectInput").setDisplayedValue(blankString);

	dijit.byId("hwmEventSelectInput").setDisplayedValue(blankString);
	dijit.byId("hwmStateSelectInput").setDisplayedValue(blankString);
	dijit.byId("hwmCountySelectInput").setDisplayedValue(blankString);

	dojo.byId("filterCountIndicator").style.visibility = "hidden";

	sensorsLayer.setLayerDefinitions(filterDefinition);
	sensorsLayer.refresh();
	sensorsLayer.setVisibility(false);

	hwmFilterLyr.setLayerDefinitions(filterDefinition);
	hwmFilterLyr.refresh();
	hwmFilterLyr.setVisibility(false);


	/*////may not need this
	for (var i = 0; i < legendLayers.length; i++) {
		if (legendLayers[i].layer != null){
			legendLayers[i].layer.setLayerDefinitions(filterDefinition);
		}
	};
	//////end may not need this*/

	var fullExtent = new esri.geometry.Extent({"xmin":-15238485.958928764,"ymin":2101101.0335023645,"xmax":-6286181.2061713,"ymax":7350184.639900593,"spatialReference":{"wkid":102100}});
	map.setExtent(fullExtent);

}
//begin executeSensorFilter function
function executeSensorFilter (evt) {


	var onQueryComplete = function(returnedPointFeatureSet){

		var featureSet = returnedPointFeatureSet || {};
		var features = featureSet.features || [];

		if (features.length == 0) {
			alert("Your filter returned no results.");
			return;
		}

		var extent = esri.graphicsExtent(features);

		sensorsLayer.setDisableClientCaching(true);
		sensorsLayer.setLayerDefinitions(filterDefinition);
		sensorsLayer.refresh();
		sensorsLayer.setVisibility(true);

		if(!extent && features.length > 0) {
			// esri.getExtent returns null for a single point, so we'll build the extent by hand
			var point = features[0];
			var location = new esri.geometry.Point(point.geometry.x, point.geometry.y, map.spatialReference);
			map.centerAndZoom(location, 15)
		}

		if ( isNaN(extent.xmin) && isNaN(extent.ymin) && isNaN(extent.xmax) && isNaN(extent.ymax)) {
			var point = features[0];
			var location = new esri.geometry.Point(point.geometry.x, point.geometry.y, map.spatialReference);
			map.centerAndZoom(location, 15)
		}

		if(extent) {
			map.setExtent(extent);
		}

	};
	
	selectionQueryTask = new esri.tasks.QueryTask(mapServicesRoot + "/Sensors/MapServer/0");
	selectionQuery = new esri.tasks.Query();

	selectionQuery.returnGeometry = true;
	selectionQuery.where = filterDefinition[0];

	selectionQueryTask.execute(selectionQuery, onQueryComplete);

	noRecordsQueryTask = new esri.tasks.QueryTask(mapServicesRoot + "/STN/Sensors/MapServer/0");
	noRecordsQuery = new esri.tasks.Query();
	
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
}
//end executeSensorFilter function

//begin executeHWMFilter function
function executeHWMFilter (evt) {

	/*for (var i = 0; i < legendLayers.length; i++) {

		if ((legendLayers[i].layer != null) && (legendLayers[i].layer.id = "HWMs")){

			legendLayers[i].layer.setDisableClientCaching(true);
			legendLayers[i].layer.setLayerDefinitions(filterDefinition);
			legendLayers[i].layer.refresh();
		}
	};*/

	hwmFilterLyr.setDisableClientCaching(true);
	hwmFilterLyr.setLayerDefinitions(filterDefinition);
	hwmFilterLyr.refresh();
	hwmFilterLyr.setVisibility(true);

	selectionQueryTask = new esri.tasks.QueryTask(mapServicesRoot + "/HWMs_forFilter/MapServer/0");
	selectionQuery = new esri.tasks.Query();

	selectionQuery.returnGeometry = true;
	selectionQuery.where = filterDefinition[0];

	selectionQueryTask.execute(selectionQuery,onQueryComplete);

	function onQueryComplete (results){

		var selectionExtent = new esri.graphicsExtent(results.features);

		if (results.features.length > 1){

			selectionExtent = selectionExtent.expand(2.3);
			map.setExtent(selectionExtent, true);

		} else {
			//Zoom to the location of the single returned feature's geometry
			var singleSiteGraphic = results.features[0];
			var location = new esri.geometry.Point(singleSiteGraphic.geometry.x, singleSiteGraphic.geometry.y, map.spatialReference);
			map.centerAndZoom(location, 15);
		}
	}

	function selectionQueryError(error){
		console.log(error);
	};
		
	noRecordsQueryTask = new esri.tasks.QueryTask(mapServicesRoot + "/HWMs/MapServer/0");
	noRecordsQuery = new esri.tasks.Query();
	
	noRecordsQuery.where = filterDefinition[0];

	if (filterDefinition[0] != "") {
	noRecordsQueryTask.executeForCount(noRecordsQuery, function (count){ 
		//alert("Your filter selection returned " + count + " sites.");
		filterCount = count;
		console.log(count);
		
		displayFilterCount();
	});
	
	}
	console.log("layer definition updated, executed, and extent refreshed");
}
//end executeHWMFilters function














//begin toggleCreateMode
function toggleCreateMode (evt) {
	
	inCreateMode = !inCreateMode;

	if (inCreateMode){
		console.log("Create Mode On");
		dojo.byId("createModeIndicator").style.visibility = "visible";
	} else{
		console.log("Create Mode Off");
		dojo.byId("createModeIndicator").style.visibility = "hidden";
	}
	
}
//end toggleCreateMode
//begin displayCreateDialog function
function displayCreateDialog () {
	console.log("displayCreateDialog function fired");
	
	dojo.attr("createDialogCoordinates", {innerHTML:"You have clicked at Latitude " + latitude.toFixed(8) + " and Longitude " + longitude.toFixed(8) +
	" </br>Would you like to create a new site at this location?"});
	
	dijit.byId("createDialog").show();

}
//end displayCreateDialog function

function createSite () {

	parent.CreateWithLatLong(latitude,longitude);
	console.log("check");
	
}

//function to iterate through allLayers array and build array for legend as well as array for adding services based on esri and wim specific options
function addAllLayers() {
		
	for (layer in allLayers) {
		if (allLayers[layer].wimOptions.type == "layer") {
			console.log(layer);
			var newLayer;
			if (allLayers[layer].wimOptions.layerType == "agisFeature") {
				newLayer = new esri.layers.FeatureLayer(allLayers[layer].url, allLayers[layer].arcOptions);
			} else if (allLayers[layer].wimOptions.layerType == "agisWMS") {
				newLayer = new esri.layers.WMSLayer(allLayers[layer].url, allLayers[layer].arcOptions);
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
				newLayer = new esri.layers.ArcGISDynamicMapServiceLayer(allLayers[layer].url, allLayers[layer].arcOptions);
				if (allLayers[layer].visibleLayers) {
					newLayer.setVisibleLayers(allLayers[layer].visibleLayers);
				}
			}
			
			//set wim options
			if (allLayers[layer].wimOptions) {
				if (allLayers[layer].wimOptions.includeInLayerList == true) {
					if (allLayers[layer].wimOptions.layerOptions && allLayers[layer].wimOptions.layerOptions.selectorType == "radio" ) {

						radioGroup = allLayers[layer].wimOptions.layerOptions.radioGroup;
						radioGroupArray.push({group: radioGroup, layer:newLayer});

						addToObjects({layer: newLayer, type:"layer", title: layer, toggleType: "radio", group: radioGroup}, allLayers[layer].wimOptions)
						
					} else {
						addToObjects({layer: newLayer, type:"layer", title: layer, toggleType: "checkbox", group: ""}, allLayers[layer].wimOptions)
					}
				}
			} else {
				addToObjects({layer: newLayer, title: layer}, allLayers[layer].wimOptions)
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
		if (wimOptions.includeLegend != false) {
			legendLayers.push(fullObject); 
		}
	}

	map.addLayers(layerArray);
	map.addLayers([sensorsLayer, hwmFilterLyr]); 
	
}


function mapReady(map){

	dijit.byId("extentSelector").set("initExtent", map.extent);
	
	//Create scale bar programmatically because there are some event listeners that can't be set until the map is created.
	//Just uses a simple div with id "latLngScaleBar" to contain it
	var latLngBar = new wim.LatLngScale({map: map}, 'latLngScaleBar');

	//dojo.connect(nwisFeatureLyr, "onMouseOut", function() {map.infoWindow.hide();} );
    //
	//dojo.connect(nwisFeatureLyr, "onMouseOver", function(evt) {
    //
	//	var identifyNWIS = new esri.tasks.IdentifyTask(mapServicesRoot + "/STN_nwis_rt/MapServer");
	//
	//		identifyParams = new esri.tasks.IdentifyParameters();
	//		identifyParams.tolerance = 5;
	//		identifyParams.returnGeometry = true;
	//		identifyParams.layerIds = [0];
	//		identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_TOP;
	//		identifyParams.width = map.width;
	//		identifyParams.height = map.height;
	//		identifyParams.geometry = evt.mapPoint;
	//		identifyParams.mapExtent = map.extent;
    //
	//		identifyNWIS.execute(identifyParams, function(identifyResults){
	//
	//			var gageNO = identifyResults[0].feature.attributes.Name;
    //
	//			map.infoWindow.setTitle("NWIS Real-Time Layer");
	//			map.infoWindow.setContent(
	//				"<b>USGS gage ID: </b>" + gageNO
    //
	//				);
	//			map.infoWindow.show(evt.mapPoint,map.getInfoWindowAnchor(evt.screenPoint));
	//		});
    //
	//})

	//toggles visibility of feature layer used for hover ability by tying it to visibility of the nwis dynamic layer
	//dojo.connect(layersObject[14].layer, "onVisibilityChange", function(nwisLyrVisibility) {
    //
	//	if (nwisLyrVisibility) {
	//		nwisFeatureLyr.setVisibility(true)
	//	} else {
	//		nwisFeatureLyr.setVisibility(false)
	//	}
    //
    //
	//});

	dojo.connect(map, "onClick", function(evt) {
		
		if (inCreateMode == true){
			
			 latitude = evt.mapPoint.getLatitude();
			 longitude = evt.mapPoint.getLongitude();
			
			console.log(latitude,longitude);
			
			displayCreateDialog();
			
		} else {
		
		for (var i=0; i< map.layerIds.length; i++) {
			if (map.layerIds[i].match(/nwisLyr/g) != null) {
				if (map.getLayer(map.layerIds[i]).visible == true) {
	
					var identifyNwisSite = new esri.tasks.IdentifyTask(mapServicesRoot + "/STN_nwis_rt/MapServer");
				
					identifyParams = new esri.tasks.IdentifyParameters();
					identifyParams.tolerance =5;
					identifyParams.returnGeometry = true;
					identifyParams.layerIds = [0];
					identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
					identifyParams.width = map.width;
					identifyParams.height = map.height;
					identifyParams.geometry = evt.mapPoint;
					identifyParams.mapExtent = map.extent;
					identifyNwisSite.execute(identifyParams, function(identifyResults){ 
			
						var nwisSiteId = identifyResults[0].feature.attributes.Name;
			
							dojo.xhrGet({
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

	
		for (var i=0; i< map.layerIds.length; i++) {
			if (map.layerIds[i].match(/sitesLyr/g) != null) {
				if (map.getLayer(map.layerIds[i]).visible == true) {
					
					var identifyStnSite = new esri.tasks.IdentifyTask(mapServicesRoot + "/Sites/MapServer");
			
					identifyParams = new esri.tasks.IdentifyParameters();
					identifyParams.tolerance = 5;
					identifyParams.returnGeometry = true;
					identifyParams.layerIds = [0];
					identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
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
		
		
		for (var i=0; i< map.layerIds.length; i++) {
			if (map.layerIds[i].match(/eventSites/g) != null) {
				if (map.getLayer(map.layerIds[i]).visible == true) {
					
					var identifyStnSite = new esri.tasks.IdentifyTask(mapServicesRoot + "/STN/EventSites/MapServer");
			
					identifyParams = new esri.tasks.IdentifyParameters();
					identifyParams.tolerance = 5;
					identifyParams.returnGeometry = true;
					identifyParams.layerIds = [0];
					identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
					identifyParams.width = map.width;
					identifyParams.height = map.height;
					identifyParams.geometry = evt.mapPoint;
					identifyParams.mapExtent = map.extent;
					identifyStnSite.execute(identifyParams, function(identifyResults){ 
			
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


		for (var i=0; i< map.layerIds.length; i++) {
			if (map.layerIds[i].match(/drLyr/g) != null) {
				if (map.getLayer(map.layerIds[i]).visible == true) {

					var identifyDRP = new esri.tasks.IdentifyTask("http://services.femadata.com/arcgis/rest/services/ExternalAffairs/DisasterReporterService/MapServer/");
					
					identifyParams = new esri.tasks.IdentifyParameters();
					identifyParams.tolerance = 5;
					identifyParams.returnGeometry = true;
					identifyParams.layerIds = [0];
					identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
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

		for (var i=0; i< map.layerIds.length; i++) {
			if (map.layerIds[i].match(/ahpsLyr/g) != null) {
				if (map.getLayer(map.layerIds[i]).visible == true) {
					
					var identifyAHPS = new esri.tasks.IdentifyTask("http://gis.srh.noaa.gov/arcgis/rest/services/ahps_gauges/MapServer");
			
					identifyParams = new esri.tasks.IdentifyParameters();
					identifyParams.tolerance = 5;
					identifyParams.returnGeometry = true;
					identifyParams.layerIds = [0];
					identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_TOP;
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

		for (var i=0; i< map.layerIds.length; i++) {
			if (map.layerIds[i].match(/watchWarnLyr/g) != null) {
				if (map.getLayer(map.layerIds[i]).visible == true) {
					
					var identifyWatchWarn = new esri.tasks.IdentifyTask("http://gis.srh.noaa.gov/ArcGIS/rest/services/watchwarn/MapServer");
			//maybe remove the trailing number
					identifyParams = new esri.tasks.IdentifyParameters();
					identifyParams.tolerance = 5;
					identifyParams.returnGeometry = true;
					identifyParams.layerIds = [1];
					identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_TOP;
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

		
		function executeQueryTask(evt){
			//Clear the query originally set by the url parameters
			siteIDquery.where = "SITE_ID IS NOT NULL";		
			//Query based on the location clicked
			siteIDquery.geometry = evt.mapPoint;		
			//Execute task and call showSiteResults on completion
			queryTask.execute(siteIDquery, showSiteResults);		
		}

		executeQueryTask();	

		}
		//end of else statement
	});
	//end of on click for map
	//build query task
    queryTask = new esri.tasks.QueryTask(mapServicesRoot + "/Sites/MapServer/0");
	//build query filter
    siteIDquery = new esri.tasks.Query();
    siteIDquery.returnGeometry = true;
    siteIDquery.outFields = ["SITE_ID"];
	
	//pass the url parameters for site
	var urlSiteObject = esri.urlToObject(document.location.href);
	
		if (urlSiteObject.query){
			
			if (urlSiteObject.query.siteid)
				{ id = urlSiteObject.query.siteid; }
			if (urlSiteObject.query.lat && urlSiteObject.query.lng ){ 
			
				lat = urlSiteObject.query.lat; 
				lng = urlSiteObject.query.lng; 
				
				var zoomPoint = new esri.geometry.Point(lng,lat);
				var convertedPoint = new esri.geometry.geographicToWebMercator(zoomPoint);
				
				var pointSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_X, 15, 
					new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 2.5), 
					new dojo.Color([0,255,0,0.25]));

				//var pointSymbol = new esri.symbol.PictureMarkerSymbol('images/marieFaceSym.gif', 50, 50);
				
				var pointGraphic = new esri.Graphic();
				pointGraphic.geometry = convertedPoint;
				pointGraphic.symbol = pointSymbol;
				map.graphics.clear();
				map.graphics.add(pointGraphic);
				map.centerAndZoom(zoomPoint, 15)
			
				//Refresh the URL with the currently selected parcel
				window.history.pushState(null,null,"?lat=" + lat + "&lng=" + lng);
				
			}

		//set query based on the parameters
		var idParam = "SITE_ID = '" + id + "'";
		siteIDquery.where = idParam;
	
		//execute query and call showSiteResults on completion
		queryTask.execute(siteIDquery,showSiteResults);
	
		}
	
	dojo.style('loadingScreen', 'opacity', '0.75');
	var loadingUpdate = dojo.connect(map,"onUpdateStart",function(){
	dojo.style('loadingScreen', 'visibility', 'visible');
	});
	
	dojo.connect(map,"onUpdateEnd",function(){
		dojo.style('loadingScreen', 'visibility', 'hidden');
		dojo.disconnect(loadingUpdate);
	
		dojo.connect(map, "onUpdateStart",function(){
			dojo.style('refreshScreen', 'visibility', 'visible');
		});
		
		dojo.connect(map, "onUpdateEnd", function(){
			dojo.style('refreshScreen', 'visibility', 'hidden');
		});
	
	});
		
 		
}
dojo.ready(init);