
var DEFAULT_TYPE30 = 100;
var OFFSET_TYPE30 = 0;                  // from where to start
var FETCH_TYPE30 = DEFAULT_TYPE30;      // how many from start

function get_dynddl_data_onclick(t_new_id, t_own_id, dep_only, type20_id) {
    try {

        // specific case - Bank Rejection (type20 + autofill + type30) - mk - 22102024
        if (type20_id == "" || type20_id == null || type20_id == undefined) { }
        else {
            let curr_ondrag = $("#ddl_search_type20_" + type20_id + "").attr("ondrag");
            if (curr_ondrag == "" || curr_ondrag == null || curr_ondrag == undefined) { }
            else {
                var Condition_Data_Str = $('#hdn_condition_data_' + type20_id + '').val();
                var Condition_Data = JSON.parse(decodeURIComponent(Condition_Data_Str));
                var value_new = Condition_Data[0].value_new;
                var Fill_Data_str = value_new[0].Fill_Data;
                if (Fill_Data_str == "" || Fill_Data_str == null || Fill_Data_str == undefined) { }
                else {
                    get_data_from_selected_option(type20_id);
                }
            }
        }

        var obj_val = $('#hdn_dynddl_' + t_new_id + '').val();
        var dynddlObj = JSON.parse(obj_val);
        var t_new_id = dynddlObj.new_id;
        var view_type = dynddlObj.view_type;
        if (view_type == "dropdownview") {
            if (t_own_id == "" || t_own_id == null || t_own_id == undefined) { }
            else {
                var confirm_text = $('#' + t_own_id + ' option:selected').attr('confirm_text');
                if (confirm_text == '' || confirm_text == null || confirm_text == undefined) {
                    var user_choice = false;
                    // fire type30 in case user confirm ok or cancel
                    var dependency = $('#' + t_own_id + '').attr('dependency');
                    if (dependency == "" || dependency == null || dependency == undefined || dependency == "undefined") {
                        //alert1("Dependency is not available!");
                    }
                    else {
                        dependency = JSON.parse(dependency);
                        t_own_id = t_own_id.replace("dynddl_", "");

                        if (dep_only != "dependency_only") {
                            $('#dynddl_' + t_new_id + ' option:gt(0)').remove();
                        }
                        else {
                            // PRI deployment > create bank rejection module > create task -- 20022025
                            if (dependency.length == 1) {
                                user_choice = true;    //  Lease status = TER/ACT
                            }
                        }

                        fire_T30_dependency(t_own_id, view_type, dependency, user_choice, confirm_text);
                    }
                }
                else {
                    //var user_choice = confirm(confirm_text);
                    //if (user_choice == false) {
                    //    $('#' + t_own_id + '').val('0');
                    //}

                    //confirm box btn text changes [09092021]
                    var Oktext = $('#' + t_own_id + ' option:selected').attr('Oktext');
                    var Canceltext = $('#' + t_own_id + ' option:selected').attr('Canceltext');
                    //var myApp_new = new Framework7({
                    //    modalTitle: "",
                    //    modalButtonOk: Oktext,
                    //    modalButtonCancel: Canceltext
                    //});

                    setTimeout(function () {
                        $(".modal-button").hide();
                        $(".modal-button-bold").hide();
                    }, 100);


                    setTimeout(function () {
                        $(".modal-button").html(Canceltext).show();
                        $(".modal-button-bold").html(Oktext).show();
                    }, 300);

                    //vibrate_device();
                    //myApp_new.confirm(confirm_text,
                    myApp.confirm(confirm_text,
                        function () {
                            //==========OK btn click===========
                            user_choice = true;

                            // fire type30 in case user confirm ok or cancel
                            var dependency = $('#' + t_own_id + '').attr('dependency');
                            if (dependency == "" || dependency == null || dependency == undefined || dependency == "undefined") {
                                alert1("Dependency is not available!");
                            }
                            else {
                                dependency = JSON.parse(dependency);
                                t_own_id = t_own_id.replace("dynddl_", "");
                                fire_T30_dependency(t_own_id, view_type, dependency, user_choice, confirm_text);
                            }
                        },
                        function () {
                            //=======Cancel btn click========
                            user_choice = false;
                            $('#' + t_own_id + '').val('0');

                            // fire type30 in case user confirm ok or cancel
                            var dependency = $('#' + t_own_id + '').attr('dependency');
                            if (dependency == "" || dependency == null || dependency == undefined || dependency == "undefined") {
                                alert1("Dependency is not available!");
                            }
                            else {
                                dependency = JSON.parse(dependency);
                                t_own_id = t_own_id.replace("dynddl_", "");
                                fire_T30_dependency(t_own_id, view_type, dependency, user_choice, confirm_text);
                            }
                        }
                    );

                    setTimeout(function () {
                        // Change the modal title
                        $('.modal.modal-in .modal-title').text('Confirm');
                    }, 10);
                }
            }

            if (dep_only != "dependency_only") {
                // don't call for leaf node
                var ddlObj = new MkDynDDL();
                ddlObj._getData(dynddlObj);
            }
        }
        else {
            var ddlObj = new MkDynDDL();
            ddlObj._getData(dynddlObj);
        }
    }
    catch (e) {
        alert1(e + '_get_dynddl_data_onclick()');
    }
}

var Type30_dynddl_Array_Global;
function refresh_dyndll_type30_onchange() {
    var obj = localStorage.getItem('Type30_dynddl_Array');
    Type30_dynddl_Array_Global = JSON.parse(obj);
    check_n_call_type30_service();
}
function check_n_call_type30_service() {
    if (Type30_dynddl_Array_Global == "" || Type30_dynddl_Array_Global == null || Type30_dynddl_Array_Global == undefined) { }
    else {
        if (Type30_dynddl_Array_Global.length > 0) {
            var dynddlObj = Type30_dynddl_Array_Global[0];
            var t_new_id = dynddlObj.new_id;
            if ($("#div_dynddl_" + t_new_id + "").hasClass("force_hide")) {
                // searchable is hidden with task dependency

                Type30_dynddl_Array_Global.shift();
                if (Type30_dynddl_Array_Global.length > 0) {
                    check_n_call_type30_service();
                }
            }
            else {
                var ddlObj = new MkDynDDL();
                ddlObj._getData(dynddlObj);
            }
        }
    }
}


var MkDynDDL = function () { };
MkDynDDL.prototype = {
    _getData: function (dynddlObj) {
        var url = dynddlObj.url;
        var view_type = dynddlObj.view_type;
        var company_id = JSON.parse(storage.getItem('company_id'));
        var server_task_id = JSON.parse(storage.getItem('server_task_id'));
        if (server_task_id == "" || server_task_id == null || server_task_id == undefined || server_task_id == '0') {
            server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
        }

        // custom development for atc (diesel filling checksheet)
        var SiteId = $("#ddl_search_type20_0_4456_48").val();
        if (SiteId == '' || SiteId == null || SiteId == undefined) {
            var SiteId = $("#ddl_search_type20_0_4458_27").val();
        }

        //var RowQueryData = [{ "key": "location", "value": "<@cls_location@>" }];
        //var RowQueryData = PageDetailsArray[0].Customer[0].querydata;

        if (view_type == 'textview' || view_type == 'numericview') {
            var self_value = $('#dynddl_txt_' + dynddlObj.new_id + '').val();
            if (self_value == "" || self_value == null || self_value == undefined) {
                var ref_valid = 1;
            }
            else {
                var RowQueryData = dynddlObj.RowQueryWhere;
                var qs_array = pass_required_values_to_querystring_dynddl(RowQueryData, '#dynddl_txt_' + dynddlObj.new_id + '');

                RowQueryData = qs_array[0];
                var ref_valid = qs_array[1];

                if (RowQueryData == "" || RowQueryData == null || RowQueryData == undefined) {
                    RowQueryData = [];
                }
                RowQueryData.push({ "key": "self", "value": self_value });
            }
        }
        else {
            var RowQueryData = dynddlObj.RowQueryWhere;
            var qs_array = pass_required_values_to_querystring_dynddl(RowQueryData, '');

            RowQueryData = qs_array[0];
            var ref_valid = qs_array[1];
        }

        if (ref_valid > 0) {
            //alert1("Please enter required value!");
        } else {
            var que_id = dynddlObj.que_id;
            var old_OFFSET_TYPE30 = OFFSET_TYPE30;

            var ddl_len = $("#dynddl_" + dynddlObj.new_id + " option").length;
            OFFSET_TYPE30 = ddl_len - 1;

            var PrevStatus = '';
            var param_obj = [];
            param_obj.push({
                company_id: company_id,
                ServerTaskId: server_task_id,
                SiteId: SiteId,
                PrevStatus: PrevStatus,
                RowQueryWhere: RowQueryData,
                que_id: que_id,
                objectname: dynddlObj.objectname,
                objectclass: dynddlObj.objectclass,
                OFFSET: OFFSET_TYPE30,
                FETCH: FETCH_TYPE30
            });

            //alert1(JSON.stringify(param_obj))
            loading();

            if (url.includes(".svc")) {
                var is_atc_type30 = "true";
            } else {
                var is_atc_type30 = "false";
            }

            var getdata = new Webservicecall_REST(url, JSON.stringify(param_obj),
                function (e) {
                    // success
                    try {
                        var Data_Json = e.responseText;
                        Data_Json = eval('(' + Data_Json + ')');

                        if (Array.isArray(Data_Json)) {
                            Data_Json = Data_Json[0];
                        }

                        //alert1(JSON.stringify(Data_Json))

                        var t_new_id = dynddlObj.new_id;

                        var status = Data_Json.status;
                        if (status == 1 || status == "" || status == null || status == undefined) {

                            var outer_res_op = dynddlObj.outer_response;
                            var inner_res_op = dynddlObj.inner_response;

                            var outer_respnse = Data_Json[outer_res_op];
                            if (outer_respnse == "" || outer_respnse == null || outer_respnse == undefined) {
                                outer_respnse = [];
                            }

                            if (view_type == 'dropdownview') {

                                // store dependency for onchange fire 17022021
                                var dependency = Data_Json['dependency'];
                                if (dependency == '' || dependency == null || dependency == undefined) {
                                    dependency = Data_Json['Dependency'];
                                }
                                if (dependency == '' || dependency == null || dependency == undefined) {
                                    dependency = [];
                                }
                                $('#dynddl_' + t_new_id + '').attr('dependency', JSON.stringify(dependency));

                                $('#dynddl_' + t_new_id + ' option:gt(0)').remove();
                                $('#type30_ddl_list').empty();

                                var len = outer_respnse.length;
                                for (var i = 0; i < len; i++) {
                                    var text = outer_respnse[i][inner_res_op];
                                    var value = outer_respnse[i]["Id"];
                                    if (value == "" || value == null || value == undefined) {
                                        value = text;
                                    }
                                    var confirm_str = outer_respnse[i]["confirm_text"];
                                    if (confirm_str == "" || confirm_str == null || confirm_str == undefined) {
                                        confirm_str = "";
                                    }
                                    var Oktext = outer_respnse[i]["Oktext"];
                                    if (Oktext == "" || Oktext == null || Oktext == undefined) {
                                        Oktext = "OK";
                                    }
                                    var Canceltext = outer_respnse[i]["Canceltext"];
                                    if (Canceltext == "" || Canceltext == null || Canceltext == undefined) {
                                        Canceltext = "CANCEL";
                                    }
                                    var onchange_str = $('#dynddl_' + t_new_id + '').attr("onchange");
                                    if (onchange_str == "" || onchange_str == null || onchange_str == undefined) {
                                        $('#dynddl_' + t_new_id + '').attr("onchange", "get_dynddl_data_onclick('" + t_new_id + "','dynddl_" + t_new_id + "','dependency_only');");
                                    }

                                    if (len == 1) {
                                        var op_str = "<option selected='selected' value='" + value + "' confirm_text='" + confirm_str + "' Oktext='" + Oktext + "' Canceltext='" + Canceltext + "'>" + text + "</option>";
                                    }
                                    else {
                                        var op_str = "<option value='" + value + "' confirm_text='" + confirm_str + "' Oktext='" + Oktext + "' Canceltext='" + Canceltext + "'>" + text + "</option>";
                                    }

                                    $('#dynddl_' + t_new_id + '').append(op_str);

                                    // add list item in type30 popup
                                    var param = "get_data_from_selected_option_type30('" + value + "', '" + t_new_id + "')";
                                    var li_txt = '<li class="item-content" onclick="' + param + '" value="' + value + '">';
                                    li_txt += '<div class="item-inner"><div class="item-title">' + text + '</div>';
                                    li_txt += '</div></li>';
                                    $('#type30_ddl_list').append(li_txt);

                                    if (len == 1) {
                                        setTimeout(function (e) {
                                            get_data_from_selected_option_type30(value, t_new_id);
                                        }, 500, t_new_id);
                                    }

                                }
                                //$('#dynddl_' + t_new_id + '').parent('div').attr('onclick', '');
                                //$('#div_dynddl_' + t_new_id + '').attr('onclick', '');

                                // make blank all child dropdowns when refresh current type30 20012022
                                var childArray = $("#dynddl_" + t_new_id + "").attr("childArray");
                                if (childArray == "" || childArray == null || childArray == undefined) {
                                    childArray = [];
                                }
                                else {
                                    childArray = JSON.parse(childArray);
                                }
                                for (c = 0; c < childArray.length; c++) {
                                    var child_id = childArray[c];
                                    $('#dynddl_' + child_id + ' option:gt(0)').remove();
                                    $("#div_dynddl_" + child_id + "").removeAttr('name');
                                }

                                Type30_dynddl_Array_Global.shift();
                                if (Type30_dynddl_Array_Global.length > 0) {
                                    check_n_call_type30_service();
                                }
                                else {
                                    fill_child_for_filled_type30();
                                }
                            }
                            else if (view_type == 'textview' || view_type == 'numericview') {

                                var confirm_text = Data_Json['confirm_text'];
                                if (confirm_text == '' || confirm_text == null || confirm_text == undefined) {
                                    var user_choice = true;
                                    if (view_type == 'textview' || view_type == 'numericview') {
                                        var value = outer_respnse[0][inner_res_op];
                                        if (value == "TRUE") {
                                            user_choice = false;
                                        }

                                        // if getting message from server than display alert and make textbox blank - atctesting 18062021
                                        var message = outer_respnse[0]["message"];
                                        if (message == "" || message == null || message == undefined) { }
                                        else {
                                            alert1(message);
                                            $('#dynddl_txt_' + t_new_id + '').val('');
                                        }

                                    }

                                    var dependency = Data_Json['dependency'];
                                    if (dependency == '' || dependency == null || dependency == undefined) {
                                        dependency = Data_Json['Dependency'];
                                    }
                                    if (dependency == '' || dependency == null || dependency == undefined) {
                                        dependency = [];
                                    }
                                    fire_T30_dependency(t_new_id, view_type, dependency, user_choice, confirm_text);
                                }
                                else {
                                    //user_choice = confirm(confirm_text);
                                    //if (user_choice == false) {
                                    //    $('#dynddl_txt_' + t_new_id + '').val('');
                                    //}
                                    var Oktext = Data_Json['Oktext'];
                                    if (Oktext == "" || Oktext == null || Oktext == undefined) {
                                        Oktext = "OK";
                                    }
                                    var Canceltext = Data_Json['Canceltext'];
                                    if (Canceltext == "" || Canceltext == null || Canceltext == undefined) {
                                        Canceltext = "CANCEL";
                                    }

                                    //var myApp_new = new Framework7({
                                    //    modalTitle: "",
                                    //    modalButtonOk: Oktext,
                                    //    modalButtonCancel: Canceltext
                                    //});

                                    setTimeout(function () {
                                        $(".modal-button").hide();
                                        $(".modal-button-bold").hide();
                                    }, 100);


                                    setTimeout(function () {
                                        $(".modal-button").html(Canceltext).show();
                                        $(".modal-button-bold").html(Oktext).show();
                                    }, 300);

                                    //vibrate_device();
                                    //myApp_new.confirm(confirm_text,
                                    myApp.confirm(confirm_text,
                                        function () {
                                            //==========OK btn click===========
                                            user_choice = true;

                                            // fire type30 in case user confirm ok or cancel
                                            var dependency = Data_Json['dependency'];
                                            if (dependency == '' || dependency == null || dependency == undefined) {
                                                dependency = Data_Json['Dependency'];
                                            }
                                            if (dependency == '' || dependency == null || dependency == undefined) {
                                                dependency = [];
                                            }
                                            fire_T30_dependency(t_new_id, view_type, dependency, user_choice, confirm_text);
                                        },
                                        function () {
                                            //=======Cancel btn click========
                                            user_choice = false;
                                            $('#dynddl_txt_' + t_new_id + '').val('');

                                            // fire type30 in case user confirm ok or cancel
                                            var dependency = Data_Json['dependency'];
                                            if (dependency == '' || dependency == null || dependency == undefined) {
                                                dependency = Data_Json['Dependency'];
                                            }
                                            if (dependency == '' || dependency == null || dependency == undefined) {
                                                dependency = [];
                                            }
                                            fire_T30_dependency(t_new_id, view_type, dependency, user_choice, confirm_text);
                                        }
                                    );

                                    setTimeout(function () {
                                        // Change the modal title
                                        $('.modal.modal-in .modal-title').text('Confirm');
                                    }, 10);
                                }

                            }
                            else {
                                // tableview
                                var message = Data_Json[0].message;
                                message = JSON.parse(message);
                                var tr_len = message.length;
                                var str = '';
                                for (i = 0; i < tr_len; i++) {
                                    var statusname = message[i].statusname;
                                    var date = message[i].date;
                                    str += '<tr><td nowrap style="padding:3px 5px; font-weight:bold">' + statusname + '</td><td nowrap style="padding:3px 5px">' + date + '</td></tr>';
                                }
                                $('#tbl_dynddl_' + t_new_id).append(str);
                            }

                            ///// type30 autofill below textbox - 21072021
                            var con_autofill_data = dynddlObj.autofill_data;   // configured autofill data in type30 control
                            var autofill_data = Data_Json['autofill_data'];
                            if (autofill_data == "" || autofill_data == null || autofill_data == undefined) {
                                autofill_data = [];
                            }

                            // configured autofill
                            for (caf = 0; caf < con_autofill_data.length; caf++) {
                                var fieldname = con_autofill_data[caf].fieldname;

                                // autofill data from response
                                var field_found = 0;
                                for (af = 0; af < autofill_data.length; af++) {
                                    var t_fieldname = autofill_data[af].fieldname;
                                    if (fieldname == t_fieldname) {
                                        var ans = autofill_data[af].ans;
                                        field_found++;
                                        break;
                                    }
                                }

                                if (field_found > 0) {
                                    var classname = con_autofill_data[caf].classname;
                                    autofill_data_by_class(classname, ans);
                                }
                            }
                            ////////


                        }
                        else {
                            alert1(Data_Json.message);


                            if (view_type == 'dropdownview') {
                                $('#dynddl_' + t_new_id + '').val('0');

                                Type30_dynddl_Array_Global.shift();
                                if (Type30_dynddl_Array_Global.length > 0) {
                                    check_n_call_type30_service();
                                }
                            }
                            else if (view_type == 'textview' || view_type == 'numericview') {
                                $('#dynddl_txt_' + t_new_id + '').val('');
                            }
                        }

                        if (view_type == 'dropdownview') {
                            // single selection pratap project 24072023 mk
                            setTimeout(function () {
                                $("#dynddl_" + t_new_id + "").trigger("onchange");
                            }, 100, t_new_id);
                        }
                        loading_hide();
                    }
                    catch (e) {
                        alert1(e + '_MkDynDDL_getData_onsuccess()');

                        loading_hide();
                        if (view_type == 'dropdownview') {
                            Type30_dynddl_Array_Global.shift();
                            if (Type30_dynddl_Array_Global.length > 0) {
                                check_n_call_type30_service();
                            }
                        }

                    }
                    /////////

                },
                function (e) {
                    // fail
                    loading_hide();

                    var user_choice = confirm("Network Error! Do you want to retry?");
                    if (user_choice == true) {
                        get_dynddl_data_onclick(dynddlObj.new_id);
                    }
                    else {
                        $('#dynddl_txt_' + dynddlObj.new_id + '').val('');
                    }

                    if (view_type == 'dropdownview') {
                        Type30_dynddl_Array_Global.shift();
                        if (Type30_dynddl_Array_Global.length > 0) {
                            check_n_call_type30_service();
                        }
                    }

                }, null, null, is_atc_type30
            );
            getdata.callOtherDomain();
        }
    }
};

function fire_T30_dependency(t_new_id, view_type, dependency, user_choice, confirm_text) {
    var data = [];
    if (dependency.length > 0) {
        for (j = 0; j < dependency.length; j++) {
            var dep_type = dependency[j].dep_type;
            var dep_ans = dependency[j].dep_ans;
            var dep_class = dependency[j].dep_class;

            if (user_choice == true) {
                if (view_type == 'dropdownview') {
                    var dep_ans = dependency[j].dep_ans;
                }
                else if (view_type == 'textview' || view_type == 'numericview') {
                    var dep_ans = $('#dynddl_txt_' + t_new_id + '').val();
                }
            }
            else {
                var dep_ans = 'xyz';
            }

            data.push({
                ele_id: t_new_id,
                ele_type: '30',
                dep_ans: dep_ans,
                dep_class: dep_class,
                dep_type: dep_type,
                view_type: view_type
            });
        }

        var paramData = JSON.stringify(data);
        if (dependency[0].dep_type == 0) {
            change_validation_by_dep_type_0(encodeURIComponent(paramData));
        } else if (dependency[0].dep_type == 1) {
            show_hide_Element(encodeURIComponent(paramData));
        } else if (dependency[0].dep_type == 2) {
            set_global_show_hide_class(encodeURIComponent(paramData));
        } else if (dependency[0].dep_type == 4) {
            show_hide_element_by_match_class_element(encodeURIComponent(paramData))
        } else if (dependency[0].dep_type == 5) {
            copy_paste_value_by_class(encodeURIComponent(paramData))
        }

        if (confirm_text == "" || confirm_text == null || confirm_text == undefined) {
            //var a = $('#dynddl_' + t_new_id + '').parents('.cntrl_main_div').siblings(".without_confirm:first");;
            //$('#dynddl_' + t_new_id + '').parents('.cntrl_main_div').siblings(".without_confirm:first").show();

            var ans = $('#dynddl_' + t_new_id + '').val();
            if (ans == "1" || ans == "2" || ans == "3" || ans == "4" || ans == "5" || ans == "6" || ans == "7" || ans == "8" || ans == "9" || ans == "10" || ans == "11" || ans == "12") {

                var checksheet_id = curr_survey_data["check_type"];


                type30_comoon_hide_show_elements(checksheet_id, t_new_id);


            }
        }


        $('#div_dynddl_' + t_new_id + '').attr('name', JSON.stringify(data));
    }
}

function type30_comoon_hide_show_elements(checksheet_id, t_new_id) {

    // for 1st 6 type30 dropdowns
    if (t_new_id == "0_" + checksheet_id + "_73" || t_new_id == "0_" + checksheet_id + "_55") {
        $(".without_confirm_airtel").show();
    }
    else if (t_new_id == "0_" + checksheet_id + "_74" || t_new_id == "0_" + checksheet_id + "_59") {
        $(".without_confirm_vil").show();
    }
    else if (t_new_id == "0_" + checksheet_id + "_75" || t_new_id == "0_" + checksheet_id + "_62") {
        $(".without_confirm_rjil").show();
    }
    else if (t_new_id == "0_" + checksheet_id + "_76" || t_new_id == "0_" + checksheet_id + "_65") {
        $(".without_confirm_bsnl").show();
    }
    else if (t_new_id == "0_" + checksheet_id + "_34" || t_new_id == "0_" + checksheet_id + "_40") {
        $(".without_confirm_ttsl").show();
    }
    else if (t_new_id == "0_" + checksheet_id + "_37" || t_new_id == "0_" + checksheet_id + "_39") {
        $(".without_confirm_tcl").show();
    }

    // 2nd 6 type30 dropdowns 12012022
    else if (t_new_id == "0_" + checksheet_id + "_394") {
        $(".without_confirm_airtel1").show();
    }
    else if (t_new_id == "0_" + checksheet_id + "_410") {
        $(".without_confirm_vil1").show();
    }
    else if (t_new_id == "0_" + checksheet_id + "_415") {
        $(".without_confirm_rjil1").show();
    }
    else if (t_new_id == "0_" + checksheet_id + "_424") {
        $(".without_confirm_bsnl1").show();
    }
    else if (t_new_id == "0_" + checksheet_id + "_435") {
        $(".without_confirm_ttsl1").show();
    }
    else if (t_new_id == "0_" + checksheet_id + "_441") {
        $(".without_confirm_tcl1").show();
    }

    // ATC UAT handling 13/07/2023 
    //if (global_wcf_url.includes("https://atcmwfm-uat.americantower.com")) {

    if (checksheet_id == 8187) {
        // Energy Reading (AP) 17082023
        //            if (t_new_id == "0_" + checksheet_id + "_215") {
        //                $(".without_confirm_airtel0").show();
        //            }
        //            else if (t_new_id == "0_" + checksheet_id + "_238") {
        //                $(".without_confirm_vil0").show();
        //            }
        //            else if (t_new_id == "0_" + checksheet_id + "_260") {
        //                $(".without_confirm_rjil0").show();
        //            }
        //            else if (t_new_id == "0_" + checksheet_id + "_282") {
        //                $(".without_confirm_bsnl0").show();
        //            }

        if (t_new_id == "0_" + checksheet_id + "_212") {
            $(".without_confirm_airtel0").show();
        }
        else if (t_new_id == "0_" + checksheet_id + "_293") {
            $(".without_confirm_vil0").show();
        }
        else if (t_new_id == "0_" + checksheet_id + "_257") {
            $(".without_confirm_rjil0").show();
        }
        else if (t_new_id == "0_" + checksheet_id + "_279") {
            $(".without_confirm_bsnl0").show();
        }
    }
    else {
        if (t_new_id == "0_" + checksheet_id + "_235") {
            $(".without_confirm_airtel0").show();
        }
        else if (t_new_id == "0_" + checksheet_id + "_262") {
            $(".without_confirm_vil0").show();
        }
        else if (t_new_id == "0_" + checksheet_id + "_284") {
            $(".without_confirm_rjil0").show();
        }
        else if (t_new_id == "0_" + checksheet_id + "_305") {
            $(".without_confirm_bsnl0").show();
        }
    }
    //}

}


// rebuild row query array by getting system variable
function pass_required_values_to_querystring_dynddl(t_RowQueryWhereArray, type30_id) {
    try {
        var ref_valid = 0;
        for (i = 0; i < t_RowQueryWhereArray.length; i++) {
            var get_value = t_RowQueryWhereArray[i].value;
            var value_type = get_value.substring(2, 1);
            var sub_get_value = get_value.substring(2, get_value.length - 2);
            if (value_type == "#") {
                // system value
                var company_id = JSON.parse(storage.getItem('company_id'));
                var user_id = JSON.parse(storage.getItem('user_id'));
                var module_id = JSON.parse(window.storage.getItem('wayflow'));
                var module_name = JSON.parse(window.storage.getItem('wayflow_name'));
                var role_id = JSON.parse(storage.getItem('role_id'));
                var role_name = JSON.parse(storage.getItem('role_name'));
                var circle_id = JSON.parse(storage.getItem('circle_id'));
                var circle_name = JSON.parse(storage.getItem('circle_name'));
                var server_task_id = JSON.parse(storage.getItem('server_task_id'));

                var curr_all_data_20 = [];
                curr_all_data_20["task_id"] = server_task_id;
                curr_all_data_20["company_id"] = company_id;
                curr_all_data_20["user_id"] = user_id;
                curr_all_data_20["module_id"] = module_id;
                curr_all_data_20["module_name"] = module_name;
                curr_all_data_20["role_id"] = role_id;
                curr_all_data_20["role_name"] = role_name;
                curr_all_data_20["circle_id"] = circle_id;
                curr_all_data_20["circle_name"] = circle_name;

                var type20_columndata = JSON.parse(storage.getItem('type20_columndata'));
                if (type20_columndata == '' || type20_columndata == null || type20_columndata == undefined) { }
                else {
                    for (c = 0; c < type20_columndata.length; c++) {
                        var key = type20_columndata[c].header;
                        var value = type20_columndata[c].ans;
                        curr_all_data_20[key] = value;
                    }
                }

                var new_get_value = curr_all_data_20[sub_get_value];
            }
            else if (value_type == "@") {
                var where_box_id = $("." + sub_get_value + " :input[type=number]").attr("id");
                if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {

                    // check for text box
                    where_box_id = $("." + sub_get_value + " :input[type=text]").attr("id");

                    if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
                        // possible dropdown 
                        where_box_id = $("." + sub_get_value + " select").attr("id");

                        if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
                            // possible OCR image 
                            where_box_id = $("." + sub_get_value + " img[id^='cbtn_']").attr("id");

                            if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
                                //trip actual distance
                                var new_get_value = $("#trip_info_tbl > tbody > tr > td").html();
                            }
                            else {
                                // image (selected text)
                                var new_get_value = $("#" + where_box_id + "").attr("detected_text");
                                $("#" + where_box_id + "").attr("trigger_id", type30_id);
                            }
                        }
                        else {
                            if (where_box_id.indexOf('dynddl') != -1) {
                                // type30 dropdown
                                var new_get_value = $("#" + where_box_id + " :selected").text();
                                if (new_get_value == "" || new_get_value == null || new_get_value == undefined || new_get_value == "--- Choose Value ---") {
                                    new_get_value = $("#" + where_box_id + "").attr("default_value");
                                }
                            }
                            else if (where_box_id.indexOf('ddl_search_type20') != -1) {
                                // type20 dropdown
                                var new_get_value = $("#" + where_box_id + " :selected").text();
                            }
                            else {
                                // normal dropdown
                                var new_get_value = $("#" + where_box_id + "").val();
                            }
                        }
                    }
                    else {
                        if (where_box_id.indexOf('txt_') != -1) {
                            // text box found
                            var new_get_value = $("#" + where_box_id + "").val();
                        }
                        else {
                            // calendar found
                            var new_get_value = $("#" + where_box_id + "").val();

                            var mode = $("#" + where_box_id + "").attr("data-field");
                            if (mode == "time") {
                                new_get_value = "2025/06/18 " + new_get_value;
                                var cal_date = new Date(new_get_value);
                                new_get_value = cal_date.getTime();
                            }
                            //var cal_date = new Date(new_get_value);
                            //var new_get_value = cal_date.getTime();
                        }
                    }
                }
                else {
                    // numeric found
                    var new_get_value = $("#" + where_box_id + "").val();
                }
            }

            if (new_get_value == "" || new_get_value == null || new_get_value == undefined || new_get_value == "--- Choose Value ---" ||
                new_get_value == "Select Value" || new_get_value == "--- Select ---") {
                ref_valid++;
                break;
            }
            t_RowQueryWhereArray[i].value = new_get_value;
        }
        var qs_array = [t_RowQueryWhereArray, ref_valid];
        return qs_array;
    } catch (e) {
        loading_hide();
    }
}

function show_hide_Element_type30(paramData) {
    try {
        var parsed_paramData = JSON.parse(decodeURIComponent(paramData));
        for (i = 0; i < parsed_paramData.length; i++) {
            var ele_id = parsed_paramData[i].ele_id;
            var ele_type = parsed_paramData[i].ele_type;
            var dep_ans = parsed_paramData[i].dep_ans;
            var dep_class = parsed_paramData[i].dep_class;
            $("." + dep_class + "").css("display", "none");
            $('div .' + dep_class + ' *').removeClass('st_depen_hide'); // for_calculator
        }
        for (i = 0; i < parsed_paramData.length; i++) {
            var ele_id = parsed_paramData[i].ele_id;
            var ele_type = parsed_paramData[i].ele_type;
            var dep_ans = parsed_paramData[i].dep_ans;
            var dep_class = parsed_paramData[i].dep_class;
            var ele_answer = $('#dynddl_' + ele_id + ' :selected').text();

            if (ele_answer == dep_ans) {
                $("." + dep_class + "").css("display", "block");
            }

            try {
                var ele_obj = $('#dynddl_' + ele_id + ' :selected').val();
                ele_obj = JSON.parse(ele_obj);
                var priority = ele_obj.Priority;
                var check_type = JSON.parse(storage.getItem('check_type'));
                var text_id = "txt_0_" + check_type + '_36';
                $('#' + text_id + '').val(priority);
                $('#' + text_id + '').attr('disabled', 'disabled');
            }
            catch (e) { }
        }
    }
    catch (e) {
        alert1(e + '_show_hide_Element_type30()');
    }
}


// autofill data from type30 response - 21072021


function get_data_from_selected_option_type30(t_val, t_new_id) {
    myApp.closeModal(".popup-type30-dropdown");
    $('#dynddl_' + t_new_id + '').val(t_val);
    var onchange = $('#dynddl_' + t_new_id + '').attr("onchange");
    if (onchange == "" || onchange == null || onchange == undefined) { }
    else {
        // in case of dependency fire 19012022
        $('#dynddl_' + t_new_id + '').trigger("onchange");
    }
}


// set childArray for filled type30 10032022
function fill_child_for_filled_type30() {
    var Type30_dynddl_Array_Filled = localStorage.getItem("Type30_dynddl_Array_Filled");
    if (Type30_dynddl_Array_Filled == "" || Type30_dynddl_Array_Filled == null || Type30_dynddl_Array_Filled == undefined) {
        Type30_dynddl_Array_Filled = [];
    }
    else {
        Type30_dynddl_Array_Filled = JSON.parse(Type30_dynddl_Array_Filled);
    }

    for (x = 0; x < Type30_dynddl_Array_Filled.length; x++) {
        var t_new_id = Type30_dynddl_Array_Filled[x].new_id;

        if ($("#div_dynddl_" + t_new_id + "").hasClass("force_hide")) { }
        else {
            var RowQueryWhere = Type30_dynddl_Array_Filled[x].RowQueryWhere;
            if (RowQueryWhere == '' || RowQueryWhere == null || RowQueryWhere == undefined) { }
            else {
                // bind type30 call [with class value required]
                for (e = 0; e < RowQueryWhere.length; e++) {
                    var get_value = RowQueryWhere[e]['value'];
                    if (get_value == '' || get_value == null || get_value == undefined) { }
                    else {
                        var value_type = get_value.substring(2, 1);
                        var sub_get_value = get_value.substring(2, get_value.length - 2);
                        if (value_type == "@") {
                            var where_box_id = $("." + sub_get_value + " :input[type=number]").attr("id");
                            if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
                                // check for text box
                                where_box_id = $("." + sub_get_value + " :input[type=text]").attr("id");
                                if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
                                    // possible dropdown
                                    where_box_id = $("." + sub_get_value + " select").attr("id");
                                    if (where_box_id == '' || where_box_id == null || where_box_id == undefined) { }
                                    else {
                                        //var onchange_str = $("#" + where_box_id + "").attr("onchange");
                                        //if (onchange_str == "" || onchange_str == null || onchange_str == undefined) {
                                        //    $("#" + where_box_id + "").attr("onchange", "get_dynddl_data_onclick('" + t_new_id + "','" + where_box_id + "');");
                                        //}

                                        // add child elements to parent attribute 20012022
                                        var childArray = $("#" + where_box_id + "").attr("childArray");
                                        if (childArray == "" || childArray == null || childArray == undefined) {
                                            childArray = [];
                                        }
                                        else {
                                            childArray = JSON.parse(childArray);
                                        }

                                        childArray.push(t_new_id);
                                        $("#" + where_box_id + "").attr("childArray", JSON.stringify(childArray));
                                    }
                                }
                                else {
                                    // text box found
                                    $("#" + where_box_id + "").attr("onfocusout", "get_dynddl_data_onclick('" + t_new_id + "');");
                                }
                            }
                            else {
                                // numeric found
                                $("#" + where_box_id + "").attr("onfocusout", "get_dynddl_data_onclick('" + t_new_id + "');");
                            }
                        }
                    }
                }
            }
        }
    }

    /////////
}
