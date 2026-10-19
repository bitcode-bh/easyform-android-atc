
var kyff_filter_checksheet_data;
function get_filter_checksheet_id() {
    try {
        loading();
        myApp.popup('.popup-KYFF');
        var feature_id = '1093';
        var company_id = JSON.parse(storage.getItem('company_id'));

        var Getflowdata = [];
        Getflowdata.push({ "key": "cm_IsDelete", "value": 0 }, { "key": "ffm_IsDelete", "value": 0 }, { "key": "ffm_flow_id", "value": 0 }, { "key": "cm_company_id", "value": company_id }, { "key": "cfm_company_feature_id", "value": feature_id }, { "key": "cm_checksheet_type_id", "value": 9 });

        var getdata = new Webservicecall_REST(global_wcf_url + 'Common/ChecksheetWithFilter', JSON.stringify(Getflowdata), onsuccess_get_filter_checksheet_id, onfail_get_filter_checksheet_id);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + '_get_filter_checksheet_id()');
        loading_hide();
    }
}
function onsuccess_get_filter_checksheet_id(e) {
    try {
        var result = e.responseText;
        var myData = eval('' + result + '');
        var status = myData[0].status;
        if (status == 1) {
            //var myArray = JSON.parse(myData[0].message);

            var data = myData[0].data;
            if (data == "" || data == null || data == undefined) {
                var myArray = JSON.parse(myData[0].message);
            }
            else {
                var myArray = JSON.parse(data);
            }

            get_kyff_filter_checksheet_details(myArray[0].id);
        }
        else {
            alert1("checksheet id not found, please assign filter checksheet for this menu !");
            loading_hide();
        }
    }
    catch (e) {
        alert1(e + '_onsuccess_get_filter_checksheet_id()');
        loading_hide();
    }
}

function onfail_get_filter_checksheet_id(e) {
    alert1(e + '_onfail_get_filter_checksheet_id()');
    loading_hide();
}
function get_kyff_filter_checksheet_details(checksheet_id) {
    try {
        if (checksheet_id == 0) {
            alert1("checksheet id is 0");
        }
        else {
            var company_id = JSON.parse(storage.getItem('company_id'));
            var Getchecksheetdata = [];
            Getchecksheetdata.push({
                Checksheet_type_id: 9,
                Company_id: company_id,
                Checksheet_id: checksheet_id
            });

            var auth1 = [];
            auth1.push({
                'username': '',
                'u_c': ''
            });

            var Getchecksheetdata_json = JSON.stringify(Getchecksheetdata);
            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_GetdataForEditChecksheet', JSON.stringify(Getchecksheetdata_json), onsuccess_get_kyff_filter_checksheet_details, onfail_get_kyff_filter_checksheet_details);
            getdata.callOtherDomain();
        }
    }
    catch (e) {
        alert1(e + '_get_checksheet_details()');
        loading_hide();
    }
}
function onsuccess_get_kyff_filter_checksheet_details(e) {
    try {
        var result = e.responseText;
        var myData = eval('' + result + '');
        var status = myData[0].status;
        //var myArray = myData[0].str[0].AllData;
        //myArray = JSON.parse(myArray);

        var data = myData[0].data;
        if (data == "" || data == null || data == undefined) {
            var myArray = myData[0].str[0].AllData;
            myArray = JSON.parse(myArray);
        }
        else {
            myData = JSON.parse(data);
            var myArray = myData[0].AllData;
            myArray = JSON.parse(myArray);
        }

        var check_type = myArray[0].step_data[0].Checksheet_id;
        var data = myArray[0].step_data[0].step[0].data;
        localStorage.setItem("check_type", check_type);
        storage.setItem('check_type', JSON.stringify(check_type));

        localStorage.setItem("checksheet_data", JSON.stringify(data));
        localStorage.setItem("checksheet_AllData", JSON.stringify(myArray));
        localStorage.setItem("checksheet_type_filter", '9');
        kyff_filter_checksheet_data = JSON.stringify(myArray);

        read_dynamic_checksheet("", check_type, "", data, "", 9, 0);
        //check_n_show_search_button();
    }
    catch (e) {
        alert1(e);
        loading_hide();
    }
}
function onfail_get_kyff_filter_checksheet_details(e) {
    alert1(e + '_onfail_get_checksheet_details()');
    loading_hide();
}

// Search Filter Where Condition
var OFFSET = 0;
var FETCH = 50;
function get_kyff_filter_survey_json() {
    try {
        var arr = localStorage.getItem('checksheet_data');
        var AllData = localStorage.getItem('checksheet_AllData');
        var filter_button_Data = JSON.parse(kyff_filter_checksheet_data);
        localStorage.setItem('checksheet_AllData', JSON.stringify(filter_button_Data));
        validate_and_submit_surveydata(1, 9, JSON.parse(arr));

        if (Validation_True == 0) {
            loading();
            var company_id = JSON.parse(storage.getItem('company_id'));
            var Condition_Data_1_new = JSON.parse(localStorage.getItem('checksheet_AllData'));
            try {
                Condition_Data_1_new[0].Filter_button[0].limit[0].offset = OFFSET;
                Condition_Data_1_new[0].Filter_button[0].limit[0].fetch = FETCH;
            }
            catch (e) {
                Condition_Data_1_new[0].Filter_button[0].LIMIT[0].OFFSET = OFFSET;
                Condition_Data_1_new[0].Filter_button[0].LIMIT[0].FETCH = FETCH;
            }
            Condition_Data_1_new = JSON.stringify(Condition_Data_1_new[0].Filter_button);

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Dynamic_Condition_Work_Porgress_JS', JSON.stringify(Param_obj), onsuccess_get_survey_json, onfail_get_survey_json);
            getdata.callOtherDomain();
        }
    }
    catch (e) {
        alert1(e + '_get_survey_json()');
        loading_hide();
    }
}

function onsuccess_get_survey_json(e) {
    try {
        var result = e.responseText;
        var myData = JSON.parse(result);
        var status = myData[0].Status;
        if (status == 1) {
            loading();

            var data = myData[0].data;
            if (data == "" || data == null || data == undefined) {
            }
            else {
                myData = JSON.parse(data);
            }

            var full_query = myData[0].Data;
            var param_obj = [];
            param_obj.push({
                'filterwhere': full_query
            });

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_GetDynamicDataByDynamicSelection', JSON.stringify(param_obj), onsuccess_bind_grid, onfail_bind_grid);
            getdata.callOtherDomain();
        }
    }
    catch (e) {
        alert1(e + '_onsuccess_get_survey_json()');
        loading_hide();
    }
}

function onfail_get_survey_json(e) {
    alert1(e + '_onfail_get_survey_json()');
    loading_hide();
}

function onsuccess_bind_grid(e) {
    var result = e.responseText;
    var myData = JSON.parse(result);
    var status = myData[0].Status;
}

function onfail_bind_grid(e) {
    alert1(e + '_onfail_bind_grid');
}


