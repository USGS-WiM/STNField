
define([
  "dojo/_base/declare",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_OnDijitClickMixin",
  "dijit/_Container",
  "dojo/on",
  "dojo/dom",
  "dijit/registry",
  "dojo/dom-construct",
  "dojo/ready",
  "dojo/parser",
  "dojo/text!./templates/ExtentNav.html"
], function(
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _OnDijitClickMixin,
  _Container,
  on,
  dom,
  registry,
  domConstruct,
  ready,
  parser,
  template
) {

    return declare( "wim/ExtentNav", [_WidgetBase, _TemplatedMixin, _OnDijitClickMixin], {

      templateString: template,
      //declaredClass: "wim/ExtentNav",
      baseClass: "extentNav",
      attachedMapID: null,
      initExtent: null,

      constructor: function() {

        console.log("extentNav wimjit created");
      },
  
      postCreate: function() {

        // on(navToolbar, "extent-history-change", extentHistoryChangeHandler);
        
        // function extentHistoryChangeHandler() {
        //   registry.byId("back").disabled = navToolbar.isFirstExtent(dom.byId(map));
        //   registry.byId("fwd").disabled = navToolbar.isLastExtent(dom.byId(map));
        // }    
      },
       
      _onBackClick: function() {
        navToolbar.zoomToPrevExtent();
      },
      
      _onFwdClick: function () {
        navToolbar.zoomToNextExtent();
      },
      
      _onFullClick: function () {
       map.setExtent(this.initExtent); 
      }


    });

    ready( 1000, function() {
      parser.parse();
    })

});