/*@preserve 
    Copyright 2012 USGS WiM
*/

/*@preserve
    Author: Nick Estes
    Created: October 25, 2012
*/

// 06.19.13 - NE - Updated to include map scale in the latLngScaleBar wimjit. Reworked property so only the map object is needed.
define([
	"esri/map",
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_OnDijitClickMixin",
	"dijit/_Container",
	"dojo/on",
	"dojo/dom",
	"dojo/dom-construct",
	"dojo/ready",
	"dojo/parser",
	"dojo/dom-style",
	"esri/geometry/webMercatorUtils",
	"dojo/text!./templates/LatLngScale.html"
], function(
	Map,
	declare,
	_WidgetBase,
	_TemplatedMixin,
	_OnDijitClickMixin, 
	_Container,
	on,
	dom,
	domConstruct,
	ready,
	parser,
	domStyle,
	webMercatorUtils,
	template
) {
     return declare( "wim/LatLngScale", [_WidgetBase, _TemplatedMixin], {

     	templateString: template,
     	//declaredClass: "LatLngScale",
	    baseClass: "latLngScale",
	    map: null,

		constructor: function () {

			console.log("LatLngScale wijit created");
	        
	    },

	    
		_onScaleChange: function () {
			        
			this.containerNode.innerHTML = "Map Scale: 1:" + this.map.getScale().toFixed(0);
			        
		},

	    postCreate: function () {
			
	        if (this.map != null) {
				
				//This code centers teh lat/lng box in the mapper after load due to different size screens.
				var domNode = this;
				
				var theMap = this.map;
				
				var bodyWidth = domStyle.get(document.body, "width");
				
				//Fires scale update on LatLngScale wimjit when zoom level is changed in map.
				on(theMap, "zoom-end", function() {

					domNode._onScaleChange();
				});

				// theMap.on("zoom-end", function (){
				// 	domNode._onScaleChange();
				// })
			
				var center = domStyle.get(theMap.container, "width") / 2;
				var llsWidth = domStyle.get(this.id, "width") / 2;
				domStyle.set(this.id, 'left', center - llsWidth + "px");
				
				//Set initial scale value
				domNode.containerNode.innerHTML = "Map Scale: 1:" + theMap.getScale().toFixed(0);

	        	on(theMap, "mouse-move", function (evt) {
	                if (evt.mapPoint != null) {
	                    var mp = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);
						domNode.textNode.innerHTML = "Lat: " + mp.y.toFixed(4) + ", Lng: " + mp.x.toFixed(4);
						
						if (bodyWidth != domStyle.get(document.body, "width")) {
							var center = domStyle.get(theMap.container, "width") / 2;
	        				var llsWidth = domStyle.get(domNode.id, "width") / 2;
	        				domStyle.set(domNode.id, 'left', center - llsWidth + "px");
	        				bodyWidth = domStyle.get(document.body, "width");
						}
					}
	            });
	            
	            /*dojo.connect(document.body, "resize", function (evt) {
	                var center = dojo.style(theMap.container, "width") / 2;
	        		var llsWidth = dojo.style(domNode.id, "width") / 2;
	        		dojo.style(domNode.id, 'left', center - llsWidth + "px");
	            });*/
			} else {
	            console.log('map property is null');
	        }
	    }	    
    });

	ready(99,function () {
		parser.parse;
	});

});