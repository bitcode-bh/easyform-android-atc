
function check_report() {
    var report_name = localStorage.getItem('report_name');
    if (report_name == "KYFF") {
        get_KYFF_report_data();
    }
    else if (report_name == "tech_rep") {
        get_technician_report_data();
    }
    else if (report_name == "live_alarm") {
        get_live_alram_report_data();
    }
}

// know your field force (KYFF)
function get_KYFF_report_data() {
    try {
        loading();
        var user_id = JSON.parse(storage.getItem('user_id'));
        var paramObj = [];
        paramObj.push({
            'User_Id': user_id
        });

        var auth = [];
        auth.push({
            'username': username,
            'u_c': uniqcode
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Select_KYFF', JSON.stringify(paramObj), onsuccess_get_KYFF_report_data, onfail_kyff);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + '_get_KYFF_report_data()');
        loading_hide();
    }
}
function onsuccess_get_KYFF_report_data(e) {
    try {
        var result = e.responseText;
        var myArray = eval('' + result + '');
        var status = myArray[0].status;
        if (status == 1) {
            $("#div_role_count").empty();
            $("#tbl_UserData").empty();
            //var userData = JSON.parse(myArray[0].data);

            var data = myArray[0].data;
            if (data == "" || data == null || data == undefined) {
                var userData = JSON.parse(myArray[0].data);
            }
            else {
                data = JSON.parse(data);
                var userData = JSON.parse(data[0].data);
            }

            var th_str = '<tr><th>No.</th><th>UserName</th><th>Role</th><th>ContactNo</th><th>Email-ID</th></tr>';
            $("#tbl_UserData").append(th_str);
            var last_role = userData[0].Rolename;;
            var last_role_count = 0;
            var role_Array = [];
            var len = userData.length;
            for (i = 0; i < len; i++) {
                var username = userData[i].Username;
                var rolename = userData[i].Rolename;
                var contactno = userData[i].ContactNo;
                var email = userData[i].EmailId;
                var tr_str = '<tr><td>' + (i + 1) + '</td><td>' + username + '</td><td>' + rolename + '</td><td>' + contactno + '</td><td>' + email + '</td></tr>';
                $("#tbl_UserData").append(tr_str);

                if (last_role != rolename) {
                    role_Array.push([last_role, last_role_count]);
                    last_role = rolename;
                    last_role_count = 1;
                }
                else {
                    last_role_count++;
                }
            }
            role_Array.push([last_role, last_role_count]);

            var chip_str = '';
            var len1 = role_Array.length;
            for (j = 0; j < len1; j++) {
                var param = "autoscroll_table_on_click('" + role_Array[j][0] + "')";
                chip_str += '<div class="chip" style="border: 1px solid rgba(0,0,0,.12); background: none; margin-right:5px" onclick="' + param + '"><div class="chip-media bg-f7">';
                chip_str += '<i class="icon material-icons">' + role_Array[j][1] + '</i></div><div class="chip-label">' + role_Array[j][0] + '</div></div>';
            }
            $("#div_role_count").append(chip_str);
        }
        else {
            alert1(myArray[0].message);
        }
        loading_hide();
    }
    catch (e) {
        alert1(e + '_onsuccess_get_KYFF_report_data()');
        loading_hide();
    }
}

// Technician Report (Morning-evening report)
function get_technician_report_data() {
    try {
        loading();
        var paramObj = [];
        paramObj.push({
            'SuperwiserName': username,
            'Report_Name': 'technician_report'
        });

        var auth = [];
        auth.push({
            'username': username,
            'u_c': uniqcode
        });

        var getdata = new Webservicecall_POST(global_url + 'UserWebService.asmx/Get_Dynamic_TV_Report', 'data=' + encodeURIComponent(JSON.stringify(paramObj)) + '&auth1=' + encodeURIComponent(JSON.stringify(auth)), onsuccess_get_technician_report_data, onfail_kyff);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + '_get_technician_report_data()');
        loading_hide();
    }
}
function onsuccess_get_technician_report_data(e) {
    try {
        var result = e.responseText;
        var myArray = eval('' + result + '');
        var status = myArray[0].status;
        if (status == 1) {
            $("#div_role_count").empty();
            $("#tbl_UserData").empty();
            var th_str = '<tr><th rowspan="3">No.</th><th rowspan="3">Technician Name</th><th colspan="6">Report Submitted</th></tr>';
            th_str += '<tr><th colspan="2">Today</th><th colspan="2">Yesterday</th><th colspan="2">Day Before Yesterday</th></tr>';
            th_str += '<tr><th>Morning</th><th>Evening</th><th>Morning</th><th>Evening</th><th>Morning</th><th>Evening</th></tr>';
            $("#tbl_UserData").append(th_str);
            var userData = JSON.parse(myArray[0].data);
            var len = userData.length;
            for (i = 0; i < len; i++) {
                var Techname = userData[i].Techname;
                var M_T = userData[i].MORNING_TODAY;
                var E_T = userData[i].EVENING_TODAY;
                var M_Y = userData[i].MORNING_YESTERSDAY;
                var E_Y = userData[i].EVENING_YESTERSDAY;
                var M_D_B_Y = userData[i].MORNING_DAY_BEFOR_YESTERSDAY;
                var E_D_B_Y = userData[i].EVENING_DAY_BEFOR_YESTERSDAY;

                if (M_T == 1) { M_T = 'Yes' } else { M_T = 'No' };
                if (E_T == 1) { E_T = 'Yes' } else { E_T = 'No' };
                if (M_Y == 1) { M_Y = 'Yes' } else { M_Y = 'No' };
                if (E_Y == 1) { E_Y = 'Yes' } else { E_Y = 'No' };
                if (M_D_B_Y == 1) { M_D_B_Y = 'Yes' } else { M_D_B_Y = 'No' };
                if (E_D_B_Y == 1) { E_D_B_Y = 'Yes' } else { E_D_B_Y = 'No' };

                var tr_str = '<tr><td>' + (i + 1) + '</td><td>' + Techname + '</td><td>' + M_T + '</td><td>' + E_T + '</td><td>' + M_Y + '</td><td>' + E_Y + '</td><td>' + M_D_B_Y + '</td><td>' + E_D_B_Y + '</td></tr>';
                $("#tbl_UserData").append(tr_str);
            }
        }
        else {
            alert1(myArray[0].message);
        }
        loading_hide();
    }
    catch (e) {
        alert1(e + '_onsuccess_get_technician_report_data()');
        loading_hide();
    }
}

// Live Alarm Report
function get_live_alram_report_data() {
    try {
        loading();
        var paramObj = [];
        paramObj.push({
            'SuperwiserName': username,
            'Report_Name': 'live_alarm'
        });

        var auth = [];
        auth.push({
            'username': username,
            'u_c': uniqcode
        });

        var getdata = new Webservicecall_POST(global_url + 'UserWebService.asmx/Get_Dynamic_TV_Report', 'data=' + encodeURIComponent(JSON.stringify(paramObj)) + '&auth1=' + encodeURIComponent(JSON.stringify(auth)), onsuccess_get_live_alram_report_data, onfail_kyff);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + '_get_live_alram_report_data()');
        loading_hide();
    }
}
function onsuccess_get_live_alram_report_data(e) {
    try {
        var result = e.responseText;
        var myArray = eval('' + result + '');
        var status = myArray[0].status;
        if (status == 1) {
            $("#div_role_count").empty();
            $("#tbl_UserData").empty();
            var th_str = '<tr><th rowspan="2">No.</th><th rowspan="2">Technician Name</th><th colspan="4">Type</th><th colspan="3">Criticality</th><th colspan="2">Status</th></tr>';
            th_str += '<tr><th>DG_ON_LOAD</th><th>BATTERY_ON_LOAD</th><th>DG_FAIL_TO_START</th><th>AC_MAINS_FAIL</th><th>MINOR</th><th>MAJOR</th><th>CRITICAL</th><th>OPEN</th><th>CLOSED</th></tr>';
            $("#tbl_UserData").append(th_str);
            var userData = JSON.parse(myArray[0].data);
            var len = userData.length;
            for (i = 0; i < len; i++) {
                var Techname = userData[i].Techname;
                var D_O_L = userData[i].DG_ON_LOAD;
                var B_O_L = userData[i].BATTERY_ON_LOAD;
                var D_F_T_S = userData[i].DG_FAIL_TO_START;
                var A_M_F = userData[i].AC_MAINS_FAIL;
                var MINOR = userData[i].MINOR;
                var MAJOR = userData[i].MAJOR;
                var CRITICAL = userData[i].CRITICAL;
                var OPEN = userData[i].OPEN;
                var CLOSED = userData[i].CLOSED;

                var tr_str = '<tr><td>' + (i + 1) + '</td><td>' + Techname + '</td><td>' + D_O_L + '</td><td>' + B_O_L + '</td><td>' + D_F_T_S + '</td><td>' + A_M_F + '</td><td>' + MINOR + '</td><td>' + MAJOR + '</td><td>' + CRITICAL + '</td><td>' + OPEN + '</td><td>' + CLOSED + '</td></tr>';
                $("#tbl_UserData").append(tr_str);
            }
        }
        else {
            alert1(myArray[0].message);
        }
        loading_hide();
    }
    catch (e) {
        alert1(e + '_onsuccess_get_live_alram_report_data()');
        loading_hide();
    }
}


function onfail_kyff(e) {
    alert1('Network error, Please try again...!');
    loading_hide();
}

function autoscroll_table_on_click(role_name) {
    var ele_top = $("#tbl_UserData").find("tr:contains('" + role_name + "')").offset().top;
    $('#div_role_count').parents('.page-content').animate({
        scrollTop: ele_top - 52
    }, 20);
}

