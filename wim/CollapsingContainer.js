// 12.05.12 - ESM - Added wipeIn/Out Animation on icon click
// 11.09.12 - JB - Added collapsing behavior
// 11.06.12 - JB - CollapsingContainer Dijit

/*
	Copyright: 2012 WiM - USGS
	Author: Jon Baier USGS Wisconsin Internet Mapping
	Created: Novemeber 06, 2012	
*/
define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_OnDijitClickMixin",
	"dojo/fx",
	"dijit/_Container",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/parser",
	"dojo/ready",
	"dojo/text!./templates/CollapsingContainer.html"
], function(
	declare,
	_WidgetBase, 
	_TemplatedMixin,
	_OnDijitClickMixin,
	coreFx,
	_Container,
	domConstruct,
	domStyle,
	parser,
	ready,
	template
) {
     return declare( "wim/CollapsingContainer", [_WidgetBase, _TemplatedMixin], {

     	templateString: template,
     	//declaredClass: "wim/CollapsingContainer",
     	baseClass: "collapsingContainer",
		titleImageUrl: null,
		startCollapsed: false,

	    getContentNode: function() {
		return this.containerNode;
		},
	
		constructor: function() {
			//add here anything that will be executed in the widget initialization.
			console.log("collapsingContainer wijit created");
			
		},	
			
		//new iconClick handler
		_onIconClick: function() {
			if (domStyle.get(this.containerNode, "display") == "none") {
				coreFx.wipeIn({ node: this.containerNode, duration: 300}).play(); //Animate show content
				
			} else {
				 coreFx.wipeOut({node: this.containerNode, duration: 300}).play(); // Animate hide content
				  
			}
		},	
		
		postCreate: function(){
			this.titleNode.innerHTML = this.title;
		
			// add here anything that will be executed in after the DOM is loaded and ready.
			// For example, adding events on the dojo attach points is suitable here.	
			var localTitle = this.title;
					
			// Attach an onclick event on the user name node.		
			/*dojo.connect(this.nameNode, "onclick", function (event) {
				alert("The selected name is: " + localTitle);
			});	*/
			
			if (this.titleImageUrl != null) {
				//Do something here to handle unique images to put before titles
			}


			if (this.startCollapsed == true) {
				this._onIconClick();
			}
		}
     });

	ready(98, function() {
		parser.parse();
	})
});