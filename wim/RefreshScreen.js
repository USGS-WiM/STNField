// 03.11.13 -ESM- Created.

/*
	Copyright: 2013 WiM - USGS
	Author: Erik Myers USGS Wisconsin Internet Mapping
	Created: March, 11 2013
*/

define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_Container",
	"dojo/dom",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/ready",
	"dojo/parser",
	"dojo/text!./templates/RefreshScreen.html"
], function(
	declare,
	_WidgetBase, 
	_TemplatedMixin,
	_Container,
	dom,
	domConstruct,
	domStyle,
	ready,
	parser,
	template
) {
     return declare ( "wim/RefreshScreen", [_WidgetBase, _TemplatedMixin], {

	    templateString: template,
	    baseClass: "refreshScreen",
	    attachedMapID: null,
	
		constructor: function(){
			domConstruct.create('img', {
					id: 'refreshScreenGraphic',
					src: 'images/loading_black.gif'
				}, dom.byId('refreshScreen')
			);
		},
		
		postCreate: function() {
			domStyle.set(this.id, 'visibility', 'hidden');
		} 	
     });

     ready(function(){
     	parser.parse();
     });
});
