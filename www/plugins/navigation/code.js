/* known bugs:
 * - by clicking on "clear" button last element of via not removed
 * - inverting route gives out errors
 * - home and destination icons are not yet changed when inverting the route
 * - drag and drop of the icons doesn't work yet
 */

var navigation_toolbox;
var myroute=new route();

var home_style={
    externalGraphic: 'plugins/navigation/home.png',
    graphicWidth: 26,
    graphicHeight: 22,
    graphicXOffset: -13,
    graphicYOffset: -22
  };
var via_style={
    externalGraphic: 'plugins/navigation/via.png',
    graphicWidth: 25,
    graphicHeight: 22,
    graphicXOffset: -16,
    graphicYOffset: -22
  };
var destination_style={
    externalGraphic: 'plugins/navigation/destination.png',
    graphicWidth: 23,
    graphicHeight: 23,
    graphicXOffset: -4,
    graphicYOffset: -23
  };

function navigation_point(lon, lat, style) {
  this.inheritFrom=geo_object;
  this.inheritFrom();
  this.type="marker";

  // name
  this.name=function() {
    return lat.toFixed(5)+", "+lon.toFixed(5);
  }

  // geo_center
  this.geo_center=function() {
    return this.feature;
  }

  // remove
  this.remove=function() {
    drag_layer.unselect(this.feature);
    drag_layer.removeFeatures([this.feature]);
  }

  // constructor
  this.lon=parseFloat(lon);
  this.lat=parseFloat(lat);
  //this.id="";

  var pos = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject())
  var geo = new OpenLayers.Geometry.Point(pos.lon, pos.lat);
  this.feature = new OpenLayers.Feature.Vector(geo, 0, style);
  drag_layer.addFeatures([this.feature]);
  this.feature.ob=this;
}

function route() {
  this.via=new Array();
  this.route_type="car";
  this.route_type_modifier="";
  
  //changes route type
  this.change_route_type=function(){
    this.travel_with=this.value;
    calculate_route();
  }

  //inverts route
  this.invert=function(){
    var temp=this.home;
    this.home=this.destination;
    this.destination=temp;
    this.via.reverse();
    navigation_toolboxtext();
    calculate_route();
  }
  /*
  this.show=function(){
    
  }
  this.hide=function(){

  }

  this.finish_drag=function(pos){
    alert("fertig");
  }
  
  this.next_drag=function(pos){
    alert("test");

  */

  //removes the route
  this.remove=function(){
    this.remove_home();
    this.remove_destination();
    for(var i=0;i<this.via.length;i++){
      this.remove_via(i);
    }
  }

  //sets your home point
  this.set_home=function(point) {
    if(this.home) {
      this.home.remove();
    }
    this.home=point;

    navigation_toolboxtext();
  }

  //sets your destination point
  this.set_destination=function(point) {
    if(this.destination) {
      this.destination.remove();
    }
    this.destination=point;

    navigation_toolboxtext();
  }

  //adds a via point to the via array
  this.add_via=function(point) {
    this.via.push(point);

    navigation_toolboxtext();
  }

 
  //removes the i-th point from the via array
  this.remove_via=function(i){
    this.via[i].remove();
    this.via.splice(i, 1);
  }
}

function navigation_set_home(pos) {
  navigation_toolbox.activate(1);
  myroute.set_home(new navigation_point(pos.lon, pos.lat, home_style));

  navigation_update_url();
}

function navigation_add_via(pos) {
  navigation_toolbox.activate(1);
  myroute.add_via(new navigation_point(pos.lon, pos.lat, via_style));

  navigation_update_url();
}

function navigation_set_destination(pos) {
  navigation_toolbox.activate(1);
  myroute.set_destination(new navigation_point(pos.lon, pos.lat, destination_style));

  navigation_update_url();
}

function navigation_update_url() {

  location.hash="#navigation="+myroute.home.lon+myroute.home.lat;
}

var anzeige;
function nav_show(route) {
  if(anzeige){
    anzeige.hide();
  }
  anzeige=route;
  route.show();
}

var nav=new navigation_cloudmade();

function calculate_route(){
  if(myroute.home && myroute.destination && (myroute.home.geometry.toString() != myroute.destination.geometry.toString())) {
    nav.get_route({ start_point: myroute.home.geometry, transit_points: myroute.via, end_point: myroute.destination.geometry, route_type: myroute.route_type, route_type_modifier: myroute.route_type_modifier}, nav_show);
  }
}

function navigation_toolboxtext() {
  var utm=new OpenLayers.Projection("EPSG:4326");

  var starttext=document.getElementById("navigation_starttext");
  dom_clean(starttext);
  if(!(myroute.home && myroute.destination)) {
    dom_create_append_text(starttext, lang("navigation:toolbox_help"));
  }

  var nav_table=document.getElementById("navigation_points");
  dom_clean(nav_table);

  // home
  var tr=dom_create_append(nav_table, "tr");

  var td=dom_create_append(tr, "td");
  var img=dom_create_append(td, "img");
  img.src="plugins/navigation/icon_home.png";

  var td=dom_create_append(tr, "td");
  if(!myroute.home) {
    dom_create_append_text(td, lang("navigation:home"));
  }
  else {
    dom_create_append_text(td, myroute.home.name());
  }

  // via
  var tr=dom_create_append(nav_table, "tr");

  var td=dom_create_append(tr, "td");
  var img=dom_create_append(td, "img");
  img.src="plugins/navigation/icon_via.png";

  var td=dom_create_append(tr, "td");
  if(myroute.via.length==0) {
    var div=dom_create_append(td, "div");
    dom_create_append_text(div, lang("navigation:via"));
  }
  else {
    for(var i=0; i<myroute.via.length; i++) {
      var div=dom_create_append(td, "div");
      dom_create_append_text(div, myroute.via[i].name());
    }
  }

  // destination
  var tr=dom_create_append(nav_table, "tr");

  var td=dom_create_append(tr, "td");
  var img=dom_create_append(td, "img");
  img.src="plugins/navigation/icon_destination.png";

  var td=dom_create_append(tr, "td");
  if(!myroute.destination) {
    dom_create_append_text(td, lang("navigation:destination"));
  }
  else {
    dom_create_append_text(td, myroute.destination.name());
  }
}

function navigation_init() {
  navigation_toolbox=new toolbox({
    icon: "plugins/navigation/icon.png",
    icon_title: "navigation",
    weight: -3,
  });
  register_toolbox(navigation_toolbox);

  if(plugins_loaded("contextmenu")) {
    contextmenu_add("plugins/navigation/icon_home.png", lang("navigation:set_home"), navigation_set_home);
    contextmenu_add("plugins/navigation/icon_via.png", lang("navigation:add_via"), navigation_add_via);
    contextmenu_add("plugins/navigation/icon_destination.png", lang("navigation:set_destination"), navigation_set_destination);
  }

  this.toolbox_content=dom_create_append(navigation_toolbox.content, "div");
  this.toolbox_content.className="navigation";

  var title=dom_create_append(this.toolbox_content, "h1");
  dom_create_append_text(title, lang("navigation:toolbox_title"));

  var help=dom_create_append(this.toolbox_content, "div");
  help.id="navigation_starttext";

  var table=dom_create_append(this.toolbox_content, "table");
  table.id="navigation_points";

  var select=dom_create_append(this.toolbox_content, "select");
  select.onchange=myroute.change_route_type;

  for(var i=0; i<navigation_cloudmade_travelwith.length; i++) {
    var option=dom_create_append(select, "option");
    option.value=navigation_cloudmade_travelwith[i].id;
    dom_create_append_text(option, lang("navigation_cloudmade:"+navigation_cloudmade_travelwith[i].id));
  }

  var button=dom_create_append(this.toolbox_content, "button");
  button.onclick=myroute.invert;
  dom_create_append_text(button, lang("navigation:invert"));

  var button=dom_create_append(this.toolbox_content, "button");
  button.onclick=myroute.remove;
  dom_create_append_text(button, lang("navigation:remove"));

  //var text = "<img src='plugins/navigation/icon_home.png' onclick='alert(home.lon + \"|\" + home.lat)'> <span id='navigation_hometext'></span><br/><img src='plugins/navigation/icon_via.png'> <span id='navigation_viatext' style='display:inline-block; padding-top:7px;'></span><br/><img src='plugins/navigation/icon_destination.png'> <span id='navigation_destinationtext'></span><br/><br/>

  navigation_toolboxtext();
}

function navigation_info(chapters, ob) {
  if(ob.geo_center()) {
    // set home
    var a=document.createElement("a");
    a.onclick=navigation_set_home.bind(this, ob.geo_center());
    dom_create_append_text(a, lang("navigation:set_home"));

    var entry={
      head: 'actions',
      weight: 9,
      content: [ a ]
    };

    chapters.push(entry);

    // set destination
    var a=document.createElement("a");
    a.onclick=navigation_set_destination.bind(this, ob.geo_center());
    dom_create_append_text(a, lang("navigation:set_destination"));

    var entry={
      head: 'actions',
      weight: 9,
      content: [ a ]
    };

    chapters.push(entry);
  }
}

register_hook("init", navigation_init);
register_hook("info", navigation_info);
