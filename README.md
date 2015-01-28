# STNField
Code base for the STN Field map, aka, the map in the map tab of STNWeb.


##Testing/QA/QC 

####The Layers
 
Please turn on and turn off (using checkboxes) each layer. Some layers only appear at a certain scale level. Those are indicated by the magnifying glass icon. ![zoom icon](https://raw.githubusercontent.com/USGS-WiM/STNField/master/images/zoom.gif)   Click the magnifying glass for each layer that has one to automatically zoom to that level. The icon does not have a zoom-to-extent function, only scale. For most of the layers, it is bets to test in an area with data, like coastal Florida. You still may have to pan around to see data. 

####Features to click
**The following layers have a built in action triggered by a click on a feature. Please try each:**

**STN Sites:** should return a large tabbed popup with Site details and buttons with other app functions

**AHPS Gages:** should show a large popup with a hydrograph

**Real-Time NWIS sites:** should show a large popup with a hydrograph 

**NWS Watches and Warnings:** popup with alert info and link to full text


#### Sensor Filter

Try a few filter combinations using the Sensor Filter section. The sites that match the filter will be highlighted by a yellow diamond. The extent of the map should also reset to the sites returned. A filter with no results will show no highlighted sites and the extent will not change. 

