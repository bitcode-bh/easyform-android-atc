// update checksheet lat long to server
function send_user_lat_long_checksheet(lat, long, accuracy, radius) {
    try {
        loading();
        var selected_sitename = JSON.parse(storage.getItem('sitename'));
        var server_task_id = JSON.parse(storage.getItem('server_task_id'));
        var company_id = JSON.parse(storage.getItem('company_id'));

        var geo_checksheet_id = JSON
            .parse(storage.getItem('geo_checksheet_id'));
        var geo_checksheet_name = JSON.parse(storage
            .getItem('geo_checksheet_name'));
        var ref_check_type = JSON.parse(storage.getItem('ref_check_type'));
        var ref_checksheet_id = JSON
            .parse(storage.getItem('ref_checksheet_id'));
        var lat_que_id = JSON.parse(storage.getItem('lat_que_id'));
        var long_que_id = JSON.parse(storage.getItem('long_que_id'));

        var checklist_geo_data = [];
        checklist_geo_data.push({
            'geo_checksheet_id': geo_checksheet_id,
            'geo_checksheet_name': geo_checksheet_name,
            'ref_checksheet_id': ref_checksheet_id,
            'ref_check_type': ref_check_type,
            'lat_que_id': lat_que_id,
            'long_que_id': long_que_id
        });

        var param_obj = [];
        param_obj.push({
            'IMEI': imeino,
            'Company_Id': company_id,
            'Username': username,
            'Customer_Unique': selected_sitename,
            'Task_Id': server_task_id,
            'Device_Lat': lat,
            'Device_long': long,
            'Accuracy': accuracy,
            'Radius': radius,
            'Data': checklist_geo_data
        });

        var appversion = JSON.parse(storage.getItem('appversion'));
        var auth = [];
        auth.push({
            "username": username,
            "devicetype": F7_device,
            "appid": "",
            "u_c": uniqcode,
            "appversion": appversion
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Show_Checksheet_At_Geofence', JSON.stringify(param_obj), onsuccess_send_user_lat_long_checksheet, onfail_send_user_lat_long_checksheet);
        getdata.callOtherDomain();
    } catch (e) {
        alert1(e + '_send_user_lat_long_checksheet()');
        loading_hide();
    }
}

// successful sending user lat long to server
function onsuccess_send_user_lat_long_checksheet(e) {
    try {
        var myArray = JSON.parse(e.responseText);
        var status = myArray[0].Status;
        if (status == 1) {

            var data = myArray[0].data;
            if (data == "" || data == null || data == undefined) {
            }
            else {
                myArray = JSON.parse(data);
            }

            var distance = myArray[0].Distance; // in_out_flag_of_distance
            if (distance == 1) // in radius
            {
                // alert1("user is in site radius...");
                document.getElementById('site_status').innerHTML = 'You are near by checksheet ! <br/> Please press refresh button !';
                document.getElementById('site_status').style.color = 'green';
                var new_lat = myArray[0].Lat;
                var new_long = myArray[0].Long;
                update_checksheet_lat_long(new_lat, new_long);
            } else {
                // distance = 2
                // alert1("user is out of site radius...");
                document.getElementById('site_status').innerHTML = 'You are still far from checksheet ! <br/> Please contact to Easy Form support team and then press refresh button !';
                document.getElementById('site_status').style.color = 'red';
            }
        } else {
            var message = myArray[0].message;
            alert1(message);
        }

        enable_back_button();
        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_send_user_lat_long_checksheet()');
        loading_hide();
    }
}

// update site lat long natively by server site lat long
function update_checksheet_lat_long(new_lat, new_long) {
    try {
        var t_id = JSON.parse(storage.getItem('tid'));
        var step = 1;
        var check_type = JSON.parse(storage.getItem('ref_checksheet_id'));
        var lat_que_id = JSON.parse(storage.getItem('lat_que_id'));
        var long_que_id = JSON.parse(storage.getItem('long_que_id'));
        var ref_check_type = JSON.parse(storage.getItem('ref_check_type'));
        if (ref_check_type == 5) {
            var t_finaljsonobj = JSON
                .parse(storage.getItem('cl_geo_task_json'));
        } else {
            var t_finaljsonobj = JSON.parse(storage
                .getItem('cl_geo_customer_json'));
        }

        var data = JSON.parse(t_finaljsonobj[0].data);

        for (k = 0; k < data.length; k++) {
            if (lat_que_id == data[k].que_id) {
                data[k].ans = new_lat;
                break;
            }
        }
        for (k1 = 0; k1 < data.length; k1++) {
            if (long_que_id == data[k1].que_id) {
                data[k1].ans = new_long;
                break;
            }
        }

        data = JSON.stringify(data);
        t_finaljsonobj[0].data = data;
        var fileData = JSON.stringify(t_finaljsonobj);
        if (ref_check_type == 5) {
            storage.setItem('cl_geo_task_json', JSON.stringify(t_finaljsonobj));
        } else {
            storage.setItem('cl_geo_customer_json', JSON
                .stringify(t_finaljsonobj));
        }

        var date_s = new Date();
        var time = date_s.getTime();
        var query = "UPDATE f_master SET millisecond='" + time
            + "', flag='1', f_data = '" + fileData + "' where tid = '"
            + t_id + "' and c_id = '" + check_type + "' and step = '"
            + step + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: t_id
        });
        cordova.exec(onsuccess_update_checksheet_lat_long,
            onfail_update_checksheet_lat_long, 'SqlitePlugin',
            'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_update_checksheet_lat_long()');
        loading_hide();
    }
}

// successful update lat long natively
function onsuccess_update_checksheet_lat_long(e) {
    try {
        // alert1("Site lat long has been refreshed !");
        changeurl("viewsitelist_pm_grouplist.html");
        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_update_checksheet_lat_long()');
        loading_hide();
    }
}

function onfail_send_user_lat_long_checksheet(e) {
    // alert1(e + '_FailCallBack_send_user_lat_long');
    alert1('Internet connection is not available !!!');
    loading_hide();
}

function onfail_update_checksheet_lat_long(e) {
    alert1(e + '_onfail_update_checksheet_lat_long()');
    loading_hide();
}