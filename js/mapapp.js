
//model: static list of five hard-coded locations
var eateries = [
	{
		name: "Godfather's Pizza",
		lat: 43.138956,
		lng: -95.144857
	},
	{
		name: "Pizza Ranch",
		lat: 43.132592,
		lng: -95.144058
	},
	{
		name: "Toad's Coffee",
		lat: 43.143190,
		lng: -95.145102
	},
	{
		name: "Black Earch Java",
		lat: 43.126499,
		lng: -95.144023
	},
	{
		name: "Chen's Garden",
		lat: 43.141070,
		lng: -95.143736
	},
];

var map;//declare map variable outside of initMap function so that it can be called by other functions
var initialCenter = {lat: 43.1424, lng: -95.1472};//declared so that it can be called later on
var infowindow;//declared so it can be accessed outside of google maps callback initMap function

//variables for ajax request to Foursquare API
var clientId = 'VF4SNN0KHFW5YFAJW25ULH0FQUWZCKNCZ22HNCH0ZQCT5GP2';
var clientSecret = 'EWPKLLNX5JQQMCUSO2EWBX0ZOGSGLHNB5RULXJA5NMRZ0O5K';

//Foursquare API getJSON for one eatery
function getFoursquare(foursquareUrl, eatery) {
	$.getJSON(foursquareUrl, function(data){
		var request = data.response.venues[0];
		//console.log(request);//logs data to determine parsing for additional methods
		eatery.phone = request.contact.formattedPhone;
		var foursquareId = request.id;
		eatery.foursquareLinkUrl = "https://foursquare.com/v/" + foursquareId + "?ref=" + clientId;
		eatery.streetAddress = request.location.formattedAddress[0];
		eatery.cityStateZip = request.location.formattedAddress[1];
		var iconPrefix = request.categories[0].icon.prefix;
		var iconSuffix = request.categories[0].icon.suffix;
		eatery.iconSource = iconPrefix + 'bg_32' + iconSuffix;
	}).error(function(e){//Error function alerts console and gracefully handles infowindow data
		console.log("Foursquare API Failed to Load Data for " + eatery.name);
		eatery.phone = 'Phone Number Unavailable';
		eatery.streetAddress = 'Address Unavailable';
		eatery.cityStateZip = '';
		eatery.foursquareLinkUrl = 'https://foursquare.com/';
		eatery.iconSource = 'images/poweredbyfoursquare.png';
	});
}

//getting Foursquare API data for all eateries
for (var i = 0; i < eateries.length; i++) {
	var foursquareUrl = 'https://api.foursquare.com/v2/venues/search?client_id=' + clientId + '&client_secret=' + clientSecret + '&v=20130815&near=Spencer,IA&query=' + eateries[i].name;
	getFoursquare(foursquareUrl, eateries[i]);
}

//callback function from google map load does everything that can only happen after the google api has loaded
//knockout AppViewModel must be included inside of this function or the viewmodel will not be able to access infowindow
function initMap() {
	//initializes the Map object in the <div> with id='map'
	function initialize() {
		map = new google.maps.Map(document.getElementById('map'), {
			center: initialCenter,//where the map centers initially
			zoom: 14
		});
	}
	initialize();

	//creates InfoWindow object that will be called later when buttons or markers are clicked
	infowindow = new google.maps.InfoWindow();

	//listens for when the info window is closed and restores map center
	google.maps.event.addListener(infowindow, 'closeclick', function(){
		map.setCenter(initialCenter);
	});

	//clickCallback does what you want it to do when you click on the map markers
	clickCallback = function(eatery){
		return function(){
			infowindow.open(map, eatery.marker);
			infowindow.setContent('<img src="' + eatery.iconSource + '"><a href="' + eatery.foursquareLinkUrl + '"><h1>' + eatery.name + '</h1></a><p>' + eatery.phone + '</p><p>' + eatery.streetAddress + '</p><p>' + eatery.cityStateZip + '</p>');
			map.setCenter({lat: eatery.lat + 0.02, lng: eatery.lng});
			eatery.marker.setAnimation(google.maps.Animation.BOUNCE);
  			setTimeout(function() {
  				eatery.marker.setAnimation(null);
  			}, 2800); //stops bouncing animation of marker without making it 'jump' back into place
		};
	};
	//creates Marker objects and adds them to the eateries array
	for (var i = 0; i < eateries.length; i++) {
		eatery = eateries[i];//specifies a single eatery object
		eatery.marker = new google.maps.Marker({//note to future self: make sure Marker is capitalized, like Map or it won't work
			position: {lat: eatery.lat, lng: eatery.lng},
			map: map,
			title: eateries[i].name
		});
		eatery.marker.addListener('click', clickCallback(eatery));
	}

}//end initMap

//error handling for Google Maps API
setTimeout(function(){
	if (typeof google === 'undefined') {
		alert('Google failed to load');//if the google maps API fails to load in 5 sec, alerts error
	}
}, 5000);




//Knockout AppViewModel function
function AppViewModel() {
	self = this;

	self.searchTerm = ko.observable('Search Here');//this is the user-entered search term

	self.searchedEateries = ko.observableArray([]);//this is the array that the button list in view is based on
	


	//initiates the searchedEateries so that the button list
	self.initArray = function() {
		for(var i = 0; i < eateries.length; i++) {
			self.searchedEateries.push(eateries[i]);
		}
	};

	self.initArray();//invoked once at load to build buttons in view

	//empties searchbar on click
	self.emptySearch = function() {
		self.searchTerm('');
		self.searchedEateries.removeAll();
		for (var i = 0; i < eateries.length; i++) {
			self.searchedEateries.push(eateries[i]);
			eateries[i].marker.setMap(map);
		}
	};

	//generates click event for button
	self.updateInfowindow = function(eatery) {
		infowindow.open(map, eatery.marker);
		infowindow.setContent('<img src="' + eatery.iconSource + '"><a href="' + eatery.foursquareLinkUrl + '"><h1>' + eatery.name + '</h1></a><p>' + eatery.phone + '</p><p>' + eatery.streetAddress + '</p><p>' + eatery.cityStateZip + '</p>');
		map.setCenter({lat: eatery.lat + 0.02, lng: eatery.lng});
		eatery.marker.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function() {
				eatery.marker.setAnimation(null);
			}, 2800); //stops bouncing animation of marker without making it 'jump' back into place
	};

	//filters the eateries observable array whenever a search term is submitted
	self.filterSearch = function() {
		self.searchedEateries.removeAll();
		for (var i = 0; i < eateries.length; i++) {
			eateries[i].marker.setMap(null);	
		}
		if (self.searchTerm() === '' || self.searchTerm() ==='Search Here') {
			for (var i = 0; i < eateries.length; i++) {
				self.searchedEateries.push(eateries[i]);
				eateries[i].marker.setMap(map);
			}
		} else {
			for (var i = 0; i < eateries.length; i++) {
				if (eateries[i].name.toLowerCase().indexOf(self.searchTerm().toLowerCase()) > -1) {
					self.searchedEateries.push(eateries[i]);
					eateries[i].marker.setMap(map);
				}
			}
		}
	};

}

ko.applyBindings(new AppViewModel());


