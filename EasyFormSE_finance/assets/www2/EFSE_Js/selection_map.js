
get_user_latlong_for_map = () => {
    cordova.exec(function (e) {

        var myArray = JSON.parse(e);
        if (myArray[0].lat == "" || myArray[0].lat == undefined || myArray[0].lat == null) {
            var lat = "0";
        } else {
            var lat = myArray[0].lat;
        }
        if (myArray[0].lon == "" || myArray[0].lon == undefined || myArray[0].lon == null) {
            var long = "0";
        } else {
            var long = myArray[0].lon;
        }
        initialize_map(lat, long);

    }, onfail, 'maulik', 'nck', ["ds"]);
}
function initialize_map(u_lat, u_long) {

    $('#div_map').show();
    $('#div_old_dashboard').css('height', '60%');

    //directionsDisplay = new google.maps.DirectionsRenderer();
    //geocoder = new google.maps.Geocoder();
    var myLocation = new google.maps.LatLng(u_lat, u_long);
    var mapOptions = {
        zoom: 15,
        center: myLocation,
        streetViewControl: false
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    //directionsDisplay.setMap(map);
    //google.maps.event.addListener(map, 'mousemove', function (ev) {
    //    var lat = ev.latLng.lat();
    //    var lng = ev.latLng.lng();
    //    $('#map_coordinate').html(lat.toString().substring(0, 9) + ' - ' + lng.toString().substring(0, 9));
    //});

    //google.maps.event.addListener(map, "click", (event) => {
    //    if (show_flag >= 2) {
    //        click_flag = 0;
    //    } else if (click_flag == 1) {
    //        addMarker(event.latLng, map);
    //    }
    //    else {

    //    }
    //});

    u_lat = parseFloat(u_lat);
    u_long = parseFloat(u_long);
    marker1 = new google.maps.Marker({
        position: new google.maps.LatLng(u_lat, u_long),
        map: map,
        label: {
            text: username,
            className: "map-label"
        },
        icon: {
            url: "images/location.png",
            labelOrigin: new google.maps.Point(10, 40)     // left , top
            //origin: new google.maps.Point(0, 0),
            //anchor: new google.maps.Point(0, 32),
        },

    });

    get_customer_data(u_lat, u_long)

}

function get_customer_data(u_lat, u_long) {
    //var Param_obj = [];
    //var RowQueryText = PageDetailsArray[0].Customer[0].querytext;
    //var RowQueryData = PageDetailsArray[0].Customer[0].querydata;
    //RowQueryData = pass_required_values_to_querystring(RowQueryData, 'site');

    let company_id = JSON.parse(storage.getItem('company_id'));
    let user_id = JSON.parse(storage.getItem('user_id'));

    var RowQueryText = "POP_CustomerGlobalMap_New";
    var RowQueryData = [
        { "key": "@company_id", "value": company_id },
        { "key": "@user_id", "value": user_id },
        { "key": "@millisecond", "value": 0 },
        { "key": "@lat", "value": u_lat },
        { "key": "@lon", "value": u_long },
        { "key": "@radius", "value": 5 }
    ];

    var Param_obj = [];
    Param_obj.push({
        'RowQueryName': RowQueryText,
        'RowQueryWhere': RowQueryData,
        "CompanyId": company_id
    });

    var getdata = new Webservicecall_REST(global_wcf_url + 'rowquerydatafetch', JSON.stringify(Param_obj), function (e) {
        var res_text = e.responseText;
        var result = eval('(' + res_text + ')');
        var message = result[0].message;
        var status = result[0].status;
        if (status == 1) {

            var customer_json = result[0].data_array;

            let cust_len = customer_json.length;

            //mk_notify(cust_len + " sites found.");

            const locations = [];
            for (let s = 0; s < cust_len; s++) {
                var site_name = customer_json[s].name;
                //add_new_site(customer_json[s]);
                var lat = customer_json[s].lat;
                var lng = customer_json[s].lon;

                locations.push({
                    lat: lat,
                    lng: lng,
                });
            }

            //renderMarkersInBatches(locations);
            renderMarkersInClusters(locations);


        }
    }, onfail);
    getdata.callOtherDomain();
}

function renderMarkersInBatches(locations) {
    let index = 0;
    let batchSize = locations.length;
    let delay = 1000;
    function processBatch() {
        const batch = locations.slice(index, index + batchSize);
        batch.forEach(pos => {
            new google.maps.Marker({ position: pos, map });
        });
        index += batchSize;
        if (index < locations.length) {
            setTimeout(processBatch, delay);
        }
    }
    processBatch();
}

function renderMarkersInClusters(locations) {
    // Convert locations to marker instances
    const markers = locations.map((position) => new google.maps.Marker({ position, map }));

    // Use MarkerClusterer for performance
    new markerClusterer.MarkerClusterer({ map, markers });
}

function add_new_site(t_customer_json) {
    //var site_id = t_customer_json.id;
    var site_name = t_customer_json.name;
    var lat = t_customer_json.lat;
    var lng = t_customer_json.lon;
    var cust_id = t_customer_json.id;

    //var site_Icon = L.icon({
    //    iconUrl: 'images/location.png',
    //    iconAnchor: [22, 20],
    //    iconSize: [30, 30]
    //});

    //var option_obj = [];;
    //option_obj['icon'] = site_Icon;
    //option_obj['title'] = site_name;
    //option_obj['type'] = 'site';
    //option_obj['cust_id'] = cust_id;
    //option_obj['entity_type'] = t_customer_json["type"];   // customer/task

    //var popup = '<b>' + site_name + '</b>';
    //var m = L.marker([lat, lng], option_obj).bindPopup(popup);
    //m.addTo(map);
    let c_lat = parseFloat(lat);
    let c_long = parseFloat(lng);
    marker1 = new google.maps.Marker({
        position: new google.maps.LatLng(c_lat, c_long),
        map: map,
        label: {
            text: site_name,
            className: "map-label"
        },
        icon: {
            url: "images/location.png",
            labelOrigin: new google.maps.Point(10, 40)     // left , top
            //origin: new google.maps.Point(0, 0),
            //anchor: new google.maps.Point(0, 32),
        },

    });
}