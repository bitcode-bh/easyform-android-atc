
function send_user_lat_long_customer(lat, long, accuracy, radius) {
    send_user_lat_long_customer_native(lat, long, accuracy, radius);
}

function send_user_lat_long_customer_native(lat, long, accuracy, radius) {
    try {
        loading();
        var siteid = JSON.parse(storage.getItem('siteid'));
        var selected_sitename = JSON.parse(storage.getItem('sitename'));
        var company_id = JSON.parse(storage.getItem('company_id'));
        var site_lat = JSON.parse(storage.getItem('site_lat'));
        var site_long = JSON.parse(storage.getItem('site_long'));
        var accuracy = JSON.parse(storage.getItem('user_accuracy'));
        var radius = JSON.parse(storage.getItem('user_radius'));
        var Support_Details = JSON.parse(storage.getItem('support_refrences1'));

        var param_obj = [];
        param_obj.push({
            'IMEI': imeino,
            'Company_Id': company_id,
            'Username': username,
            'Customer_Unique': selected_sitename,
            'siteid': siteid,
            'Device_Lat': lat,
            'Device_long': long,
            'site_lat': site_lat,
            'site_long': site_long,
            'Accuracy': accuracy,
            'Radius': radius,
            'Support_Details': Support_Details
        });

        cordova.exec(onsuccess_send_user_lat_long_customer, onfail_send_user_lat_long_customer, 'CustomerPageMapsPlugin', 'anAction', param_obj);
    } catch (e) {
        alert1(e + '_send_user_lat_long_customer()');
        loading_hide();
    }
}

// successful sending user lat long to server
function onsuccess_send_user_lat_long_customer(e) {
    try {
        //var myArray = JSON.parse(e.responseText);
        var myArray = JSON.parse(e);
        var status = myArray[0].Status;
        if (status == 1) {
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var task_with_customer = list_data[0].task_with_customer;

            var distance = myArray[0].Distance; // in_out_flag_of_distance
            if (distance == 1) // in radius
            {
                // alert1("user is in site radius...");
                //var new_lat = myArray[0].Lat;
                //var new_long = myArray[0].Long;

                if (task_with_customer == "true") {
                    get_customer_list_from_task_create();
                }
                else {
                    document.getElementById('site_status').innerHTML = 'You are near by site ! <br/> Please press refresh button !';
                    document.getElementById('site_status').style.color = 'green';
                    changeurl("viewcustomerlist_on.html");
                }
            } else {
                // distance = 2
                // alert1("user is out of site radius...");

                if (task_with_customer == "true") { }
                else {
                    document.getElementById('site_status').innerHTML = 'You are still far from site ! <br/> Please contact to Easy Form support team and then press refresh button !';
                    document.getElementById('site_status').style.color = 'red';
                }
            }
        } else {
            var message = myArray[0].message;
            alert1(message);
        }

        enable_back_button();
        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_send_user_lat_long_customer()');
        loading_hide();
    }
}

function onfail_send_user_lat_long_customer(e) {
    // alert1(e + '_FailCallBack_send_user_lat_long');
    //alert1('Internet connection is not available !!!');

    enable_back_button();
    loading_hide();

    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var task_with_customer = list_data[0].task_with_customer;
    if (task_with_customer == "true") {
        get_customer_list_from_task_create();
    }
    else {
        changeurl("viewcustomerlist_on.html");
    }
}
