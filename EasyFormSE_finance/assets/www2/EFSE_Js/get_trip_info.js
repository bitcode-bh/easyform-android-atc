

function get_trip_info(elem) {
    try {
        loading();
        $('#trip_info_tbl tr').not(':first').remove();

        if (elem == "" || elem == null || elem == undefined) {
            var task_id = JSON.parse(storage.getItem('server_task_id'));
        }
        else {
            var task_id = $(elem).val();
        }

        var Param_obj = [];
        Param_obj.push({
            'task_id': task_id
        });
        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Get_Shortest_Path_Master_SingleTrip', JSON.stringify(Param_obj), onsuccess_get_trip_info, onfail_get_trip_info);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + 'get_trip_info()');
    }
}

function onsuccess_get_trip_info(invocation1) {
    try {
        var Data_Json = invocation1.responseText;
        Data_Json = eval('(' + Data_Json + ')');
        var Status = Data_Json[0].status;
        //var message = Data_Json[0].message;

        if (Status == 1) {
            //message = JSON.parse(message);

            var data = Data_Json[0].data;
            if (data == "" || data == null || data == undefined) {
                var message = eval('(' + Data_Json[0].message + ')');
            }
            else {
                var message = JSON.parse(data);
            }

            var row_str = '';
            for (i = 0; i < message.length; i++) {
                var actual_distance = message[i].actual_distance;
                actual_distance = (actual_distance / 1000).toFixed(2);

                var shortest_distance = message[i].shortest_distance;
                shortest_distance = (shortest_distance / 1000).toFixed(2);

                var actual_path = message[i].actual_path;
                actual_path = JSON.parse(actual_path);

                if (actual_path.length > 0) {
                    var start_point = actual_path[0].address;
                    var end_point = actual_path[actual_path.length - 1].address;

                    if (shortest_distance == "" || shortest_distance == null || shortest_distance == undefined) {
                        shortest_distance = '00.00';
                    }
                    if (actual_distance == "" || actual_distance == null || actual_distance == undefined) {
                        actual_distance = '00.00';
                    }

                    if (start_point == "" || start_point == null || start_point == undefined) {
                        start_point = 'N/A';
                    }
                    if (end_point == "" || end_point == null || end_point == undefined) {
                        end_point = 'N/A';
                    }

                    row_str += '<tr><td style="padding: 2px 4px;">' + actual_distance + '</td><td style="padding: 2px 4px;">' + shortest_distance + '</td><td style="padding: 2px 4px;">' + start_point + '</td><td style="padding: 2px 4px;">' + end_point + '</td></tr>';
                }
                else {
                    row_str += '<tr><td colspan=4>Actual Path is missing.</td></tr>';
                }
            }
            //$('#trip_info_tbl thead tr th').css('padding', '2px 4px');
        }
        else {
            row_str += '<tr><td colspan=4>Trip not found.</td></tr>';
        }
        $('#trip_info_tbl').append(row_str);
        loading_hide();
    }
    catch (e) {
        alert1(e + 'onsuccess_get_trip_info');
    }
}

function onfail_get_trip_info(e) {
    loading_hide();
    //alert1(e + 'onfail_get_trip_info');
}



function auto_start_trip_on_attendane_task_create(t_tid) {
    myApp.showPreloader('Initializing Trip...');
    var locObj = new MkLocation();
    locObj._getLocation(function (e) {
        temp_location_Array = e;
        start_stop_trip_on_attendace(0, t_tid);
    });
}

// trip start from notification click (on task create)
function start_stop_trip_on_attendace(trip_status, t_tid) {
    try {
        storage.setItem('crash_status', JSON.stringify('7'));               //when app is killed before start/stop trip
        localStorage.setItem('trip_status', trip_status);

        if (btnJsonObj.length > 0) {
            // buttons are available in task form (task created from notification)
            var stillviolation_event = curr_survey_data["stillviolation_event"];
        }
        else {
            // buttons are not available in task form (task created from notification)
            var AttendanceJson = JSON.parse(localStorage.getItem('AttendanceJson'));
            var stillviolation_event = AttendanceJson[0].stillviolation_event;
        }

        if (stillviolation_event == "" || stillviolation_event == null || stillviolation_event == undefined) {
            stillviolation_event = "false";
        }

        let trip_vehicle_type = localStorage.getItem('trip_vehicle_type');
        if (trip_vehicle_type == "" || trip_vehicle_type == null || trip_vehicle_type == undefined) {
            trip_vehicle_type = "";
        }

        var q_jsonobj = [];
        q_jsonobj.push({
            'trip_status': trip_status,
            'tid': t_tid,
            'odometer_point': [],
            'ETA': "false",
            'stillviolation_event': stillviolation_event,
            'vehicle_type': trip_vehicle_type
        });
        //alert1(JSON.stringify(q_jsonobj));

        cordova.exec(function (e) {
            // success

            storage.setItem('crash_status', JSON.stringify('0'));
            myApp.hidePreloader();

            localStorage.setItem('trip_status', '0');
            localStorage.setItem('trip_tid', t_tid);
            localStorage.setItem('trip_ser_task_id', '0');

            var uniqcode = storage.getItem('uniqcode');
            if (uniqcode == "" || uniqcode == null || uniqcode == undefined) {
                changeurl("login.html");
            }
            else {
                changeurl("selection.html");
            }

        }, function (e) {
            // onfail

            storage.setItem('crash_status', JSON.stringify('0'));
            myApp.hidePreloader();

        }, 'TripPlugin', 'anAction', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_start_stop_trip_on_attendace()');
    }
}

