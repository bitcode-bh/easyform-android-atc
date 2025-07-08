function FillFlow() {
    loading_show();
    var comp = Compny_id;

    var Param_obj = [];
    Param_obj.push({ 'key': 'isdelete', 'value': 0 }, { 'key': 'company_id', 'value': comp });

    var getdata = new Webservicecall_REST(global_wcf_url + 'Common/Flow', JSON.stringify(Param_obj), updateuniquecode_android101, onfail101);
    getdata.callOtherDomain();
}
function updateuniquecode_android101(invocation1) {
    var Company_Data = invocation1.responseText;
    Company_Data = eval('(' + Company_Data + ')');
    var Option_Item = '<ul id="a" class="list-group checked-list-box list-unstyled loc_per_ul"></ul>';
    $("#flow_check").append(Option_Item);
    //var message1 = Company_Data[0].message;

    var data = Company_Data[0].data;
    if (data == "" || data == null || data == undefined) {
        var message1 = JSON.parse(Company_Data[0].message);
    }
    else {
        var message1 = JSON.parse(data);
    }

    if (message1 != "Data Not Exists.") {
        //message1 = eval('(' + message1 + ')');

        //Option_Item += "<li class='list-group-item' data-color='info' onclick='selectflowfilterchecksheet(0)' value='0'>User/Customer</li>";
        for (j = 0; j < message1.length; j++) {
            // Option_Item += "<li class='list-group-item' data-color='info' onclick='flowwisechecksheet(" + message1[j].id + ")' value='" + message1[j].id + "'>" + message1[j].name + "</li>";
            var listItem = "<li class='list-group-item' data-color='info'><div><input id='checkbox_" + j + "' value='" + message1[j].id + "' class='checkbox-custom' name='myCheckbox' type='checkbox' onclick='flowwisechecksheet(" + message1[j].id + ",checkbox_" + j + ")'><label for='checkbox_" + j + "' style='font-size:11px' class='checkbox-custom-label'>" + message1[j].name + "</label></div></li>";
            $("#a").append(listItem);
        }
        // Option_Item += "</ul>";
        // $("#flow_check").append(Option_Item);
        // checkbox_custom();
    } else {
        // Option_Item += "<li class='list-group-item' data-color='info' onclick='selectflowfilterchecksheet(0)' value='0'>User/Customer</li>";
        // Option_Item += "</ul>";
        // $("#flow_check").append(Option_Item);
        //// checkbox_custom();
        alert1(message1);
    }
    loading_hide();
}
function onfail101(e) {
    loading_hide();
    alert1('M - ' + e);
}

var json_checksheet;
var checksheet_name_json = [];
var checksheet_id_json = [];
var checksheet_type_id_json = [];

var lbl_Counter = 0;
var lbl_step_Counter = 0;
var que_Counter = 0;
var que_item_Counter = 1;
var item_Counter = 0;
var txt_Counter = 0;
var rdo_Counter = 0;
var ddl_Counter = 0;
var txtno_Counter = 0;

var chk_Counter = 0;
var cbtn_Counter = 0;
var cal_Counter = 0;
var sign_counter = 0;
var Calcul_Counter = 0;
var Barcode_Counter = 0;

var chk_iddyn = 0;
var main_id_dyn = 0;

var txt_json = [];
var txt_chkid = 0;

var flow_id_chk_delet = "";
function flowwisechecksheet(flowid, chkid) {
    try {
        var checkid = $(chkid).prop('checked');
        if (checkid == true) {
            flow_id_chk_delet = flowid;
            var Getchecksheetdata = [];
            Getchecksheetdata.push({
                Checksheet_type_id: 1,
                Company_id: Compny_id,
                Flow_Id: flowid
            })
            var Getchecksheetdata_json = JSON.stringify(Getchecksheetdata);
            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_GetAlldataForPDF', JSON.stringify(param_obj), Onsuccess_Get_All_Checksheet, Onfail_chk);
            getdata.callOtherDomain();
        } else {
            $("#flowid_0_" + flowid).remove();
        }

    }
    catch (e) {
        alert1(e);
    }
}

function Onfail_chk(ex) {
    alert1(ex);
}
function Onsuccess_Get_All_Checksheet(e) {
    try {
        var all_checksheet_data_json = e.responseText;
        var all_checksheet_data_json_parse = (JSON.parse(all_checksheet_data_json));

        var data = all_checksheet_data_json_parse[0].data;
        if (data == "" || data == null || data == undefined) {
            var ksks = all_checksheet_data_json_parse[0].str;
        }
        else {
            var ksks = JSON.parse(data);
        }

        Append_Checksheet_List(ksks)
    }
    catch (e) {
        alert1(e);
    }
    //  return false;
}

function Append_Checksheet_List(nikki2) {

    var jsonObj_temp_kd = []
    var chsheetwisejson = [];
    chksheet_list_li = "";

    jsonObj_temp_kd = JSON.parse(JSON.stringify(nikki2));

    var chechskheet_li_id = 0;

    var Option_Item = '<ul id="flowid_0_' + flow_id_chk_delet + '" class="list-group list-unstyled loc_per_ul"></ul>';
    $("#Checksheet_check").append(Option_Item);
    for (k = 0; k < jsonObj_temp_kd.length; k++) {
        chsheetwisejson.push(JSON.stringify(jsonObj_temp_kd[k]));
        var chksheetid = jsonObj_temp_kd[k].Checksheet_id;
        var chksheetname = jsonObj_temp_kd[k].Checksheetname;

        var listItem = "<li class='list-group-item'><div><input  onclick='ChecksheetJSONRead(" + JSON.stringify(encodeURIComponent(chsheetwisejson[k])) + ",this)' id='checkboxChk_main_" + k + "' value='" + chksheetid + "|" + flow_id_chk_delet + "' class='checkbox-custom' name='myCheckbox' type='checkbox'><label for='checkboxChk_main_" + k + "' class='checkbox-custom-label' style='font-size:11px'>" + chksheetname + "</label></div></li>";

        $("#flowid_0_" + flow_id_chk_delet).append(listItem);
        chechskheet_li_id++;
    }
}


function ChecksheetJSONRead(elem, element_id) {
    var checkid = $(element_id).prop('checked');
    if (checkid == true) {
        var nikki3_ = JSON.parse(decodeURIComponent(elem));

        var ksks = JSON.stringify(nikki3_);

        var nikki3 = [];

        nikki3.push(JSON.parse(ksks));
        for (var ck = 0; ck < 2; ck++) {
            Que_Header_get_(nikki3, ck, element_id);
        }
    } else {
        $("." + element_id.id).remove();
        //$('#main_0' + element_id.id).remove();
        //$('#main_1' + element_id.id).remove();
    }


}
var ulandli = 0;
function Que_Header_get_(nikki3, chk, checksheetid_delete) {
    var chkdivid = "";
    var s_flw = checksheetid_delete.value;
    var split_flw = s_flw.split("|");
    var flow_id_s = split_flw[1];

    if (chk == 0) {
        chkdivid = "question_id";
    } else {
        chkdivid = "barchart_div";
    }

    que_header_name = $("#Que_Header").val()

    var jsonObj_temp = [];

    jsonObj_temp = JSON.parse(JSON.stringify(nikki3));

    jsonObj = [];

    newdiv = "";
    chksheet_list_li = "";
    report_List_li = "";
    validation_mode = "true";
    curr_mode = "select";
    curr_is_update = "yes";

    chkbx = "";

    txtno_chkid = 0;
    margin_top = 5;

    var read_item_Counter = 0;
    var jsonObj_Array = [];
    var chechskheet_li_id = 0;

    var checksheet_counter = 1001;

    sum_div = "";



    try {

        for (k = 0; k < jsonObj_temp.length; k++) {


            var chsht_id = jsonObj_temp[k].Checksheet_id;
            var chk_type = jsonObj_temp[k].Checksheet_type_id;
            var chsht_name = jsonObj_temp[k].Checksheetname;
            var Alldata1 = jsonObj_temp[k].AllData;
            var Alldata1_array = JSON.parse(Alldata1);
            var stepdata1 = Alldata1_array[0].step_data;
            var length1 = stepdata1.length;

            var chksheet_name_json_sample = '{"Check_Type": "' + chk_type + '", "Ques_Id": "200", "PDF_Header": "' + chsht_name + '","Checksheet_id":"' + chsht_id + '","Type": "101","ImagePath":"","FlowID":"' + flow_id_s + '"}';

            checksheet_name_json.push(chsht_name);
            checksheet_id_json.push(chsht_id);
            checksheet_type_id_json.push(chk_type);
            //   newdiv += '<div class="alert alert-success" style="height: 1%; box-shadow: 2px 1px 5px; background-color: #E8B23E;;border-color: #6230DD; margin-bottom: 10px;" id="div_lbl_' + lbl_Counter + '" onmouseover=' + param + '><input type="hidden" id="hdf_' + item_Counter + '"><span style="  margin-top: -1%;position: absolute; font-family: monospace;">Checksheet Name - ' + chsht_name + ' </span><div style="width:25px; height:25px; margin-top: -2%;   margin-left: 97%; display: inline-block; position:relative;border-style: double;"><input id="' + txt_chkid + '" placeholder="' + chsht_id + '" type="checkbox" onchange="myFunction(this);" class="myCheck" name="vehicle_' + checksheet_counter + '" style="width:19px; height:19px;  margin-top: 0%;" value="' + checksheet_name_json + '"></div></div>'

            // newdiv += '<div class="alert alert-success" style="height: auto; box-shadow: 2px 1px 5px; background-color: #E8B23E;;border-color: #6230DD; margin-bottom: 10px;" id="div_lbl_' + lbl_Counter + '" ><input type="hidden" class="hidden" id="hdf_chkname_' + chk_iddyn + '" value =\'' + chksheet_name_json_sample + '\'><span style="  margin-top: -1%;position: relative; font-family: monospace;">Checksheet Name - ' + chsht_name + ' </span><div style="width:25px; height:25px; margin-top: -4%;   margin-left: 93%; display: none; position:relative;"><button type="button" id="btn_con_' + main_id_dyn + '" class="btn btn-info btn-circle" name="hdf_chkname_' + chk_iddyn + '" onclick="myFunction(this);"><i class="fa fa-plus"></i></button><input id="chk_con_' + main_id_dyn + '" placeholder="' + chsht_id + '" type="checkbox" onchange="myFunction(this);" class="myCheck" name="hdf_chkname_' + chk_iddyn + '" style="width:19px; height:19px;  margin-top: 0%; display:none;" value="' + checksheet_name_json + '"></div></div>'
            newdiv += '<div class="' + checksheetid_delete.id + '"><div style="padding: 5px;margin-bottom: 5px;border: 1px solid transparent;border-radius: 4px;;height: auto; box-shadow: 2px 1px 5px; background-color: rgba(204, 154, 129, 0);border-color: #6230DD; margin-bottom: 5px;" id="div_lbl_' + lbl_Counter + '" ><input type="hidden" class="hidden" id="hdf_chkname_' + chk_iddyn + '" value =\'' + chksheet_name_json_sample + '\'><span style="  margin-top: -1%;position: relative; font-family: monospace;">CheckList - ' + chsht_name + ' </span></div>';

            lbl_Counter++
            que_Counter++;
            item_Counter++;
            que_item_Counter = 0;

            stepname_ = [];

            for (i = 0; i < length1; i++) {
                // stepname_ = [];
                var innerstep1 = stepdata1[i].step;
                var data1 = innerstep1[0].data;
                var length2 = data1.length;
                var is_deleted = innerstep1[0].is_deleted;
                stepname_.push(innerstep1[0].subcategory);
                if (is_deleted == 0) {
                    var tempjsonObj = [];
                    for (j = 0; j < length2; j++) {
                        var innderdata = data1[j];

                        tempjsonObj.push(innderdata);

                    }

                    jsonObj_Array.push(tempjsonObj);

                }

            }

            main_id_dyn++;
            chk_iddyn++;
        }
        // alert1(JSON.stringify(jsonObj_Array));

        checksheet_counter++;

    }
    catch (e) {
        alert1(e);
    }
    var step_counter = 1;
    for (h = 0; h < jsonObj_Array.length; h++) {

        var jsonObj = jsonObj_Array[h];

        var step_name_json_sample = '{"Check_Type": "' + chk_type + '", "Ques_Id": "' + h + '", "PDF_Header": "' + stepname_[h] + '","Checksheet_id":"' + chsht_id + '","Type": "102","ImagePath":"","FlowID":"' + flow_id_s + '"}';

        newdiv += '<div style="padding: 5px;margin-bottom: 5px;border: 1px solid transparent;border-radius: 4px;;height: auto; box-shadow: 2px 1px 5px; background-color: rgba(204, 154, 129, 0);border-color: #6230DD; margin-bottom: 5px;" id="div_step_' + lbl_step_Counter + '" ><input type="hidden" class="hidden" id="hdf_step' + chk_iddyn + '" value =\'' + step_name_json_sample + '\'><span style="  margin-top: -1%;position: relative; font-family: monospace;"> Step - ' + stepname_[h] + '</span></div>'
        lbl_step_Counter++;
        main_id_dyn++;
        chk_iddyn++;
        for (i = 0; i < jsonObj.length; i++) {
            var form_name_json_sample = '{"Check_Type": "' + chk_type + '", "Ques_Id": "' + jsonObj[i].que_id + '", "PDF_Header": "' + jsonObj[i].Excel_Header + '","Checksheet_id":"' + chsht_id + '","Type": "103","ImagePath":"","FlowID":"' + flow_id_s + '"}';
            var type_name_json_sample = "";
            if ((jsonObj[i].type == 5) || (jsonObj[i].type == 8) || (jsonObj[i].type == 9)) {
                type_name_json_sample = '{"Check_Type": "' + chk_type + '", "Ques_Id": "' + jsonObj[i].que_id + '", "PDF_Header": "' + jsonObj[i].value + '","Checksheet_id":"' + chsht_id + '","Type": "' + jsonObj[i].type + '","value":"","FlowID":"' + flow_id_s + '"}';
            }
            else {
                if ((jsonObj[i].type == 2) || (jsonObj[i].type == 3) || (jsonObj[i].type == 6)) {
                    var rdo_Array_l = jsonObj[i].value;
                    var value_js = [];
                    for (var rd = 0; rd < rdo_Array_l.length; rd++) {
                        value_js.push('"' + rdo_Array_l[rd] + '"');
                    }
                    type_name_json_sample = '{"Check_Type": "' + chk_type + '", "Ques_Id": "' + jsonObj[i].que_id + '", "PDF_Header": "' + jsonObj[i].Excel_Header + '","Checksheet_id":"' + chsht_id + '","Type": "' + jsonObj[i].type + '","value":[' + value_js + '],"FlowID":"' + flow_id_s + '"}';
                } else {
                    type_name_json_sample = '{"Check_Type": "' + chk_type + '", "Ques_Id": "' + jsonObj[i].que_id + '", "PDF_Header": "' + jsonObj[i].Excel_Header + '","Checksheet_id":"' + chsht_id + '","Type": "' + jsonObj[i].type + '","value":"' + jsonObj[i].value + '","FlowID":"' + flow_id_s + '"}';
                }
            }
            // Question Start
            if (jsonObj[i].type == 0) {           //is_deleted = 0 means not removed

                newdiv += '<div style="padding: 5px;margin-bottom: 5px;border: 1px solid transparent;border-radius: 4px;;height: auto; box-shadow: 2px 1px 5px; background-color: rgba(204, 154, 129, 0);border-color: #6230DD; margin-bottom: 5px;" id="div_lbl_' + lbl_Counter + '" ><input type="hidden" class="hidden" id="hdf_form' + chk_iddyn + '" value=\'' + form_name_json_sample + '\'><span style="  margin-top: -1%;position: relative; font-family: monospace;">FormName-' + jsonObj[i].value + '</span></div>'
                lbl_Counter++
                que_Counter++;
                item_Counter++;
                que_item_Counter = 0;
            }
            // Radio Button
            else if (jsonObj[i].type == 2 && jsonObj[i].prop[0].is_deleted == 0 && jsonObj[i].prop[0].searchkey == 1) {
                var rdo_Array = jsonObj[i].value;
                txt_json.push(jsonObj[i]);
                newdiv += "<ul class='list-unstyled loc_per_ul12_" + ulandli + "'><li ><div><input onclick='ChecksheetJSONRead_checksheet(" + JSON.stringify(encodeURIComponent(type_name_json_sample)) + "," + chkdivid + ",checkboxChk_" + ulandli + ")' id='checkboxChk_" + ulandli + "' value='" + type_name_json_sample + "' style='position: relative' class='checkbox-custom' name='myCheckbox' type='checkbox'><label for='checkboxChk_" + ulandli + "' class='checkbox-custom-label'>";

                for (var r = 0; r < rdo_Array.length; r++) {
                    newdiv = newdiv + '<input disabled="disabled" type="radio" style="width:25px; height:25px; margin-left:5%" name="rdogroup_' + rdo_Counter + '" id="rdo_' + rdo_Counter + '_' + r + '" value=' + rdo_Array[r] + '><label class="radiobutton" style=" margin-top: 1%; position: relative;display:inline-block" id="rdo_lbl_' + rdo_Counter + '_' + r + '">' + rdo_Array[r] + '</label>';
                }
                newdiv = newdiv + "</label></div></li></ul>";
                rdo_Counter++;
                txt_chkid++;
                item_Counter++;
                que_item_Counter++;
                ulandli++;
            }
            // Select Drop Down
            else if (jsonObj[i].type == 3 && jsonObj[i].prop[0].is_deleted == 0 && jsonObj[i].prop[0].searchkey == 1) {
                var ddl_Array = jsonObj[i].value;
                newdiv += "<ul class='list-unstyled loc_per_ul12_" + ulandli + "'><li><div><input onclick='ChecksheetJSONRead_checksheet(" + JSON.stringify(encodeURIComponent(type_name_json_sample)) + "," + chkdivid + ",checkboxChk_" + ulandli + ")' id='checkboxChk_" + ulandli + "' value='" + type_name_json_sample + "' style='position: relative' class='checkbox-custom' name='myCheckbox' type='checkbox'><label for='checkboxChk_" + ulandli + "' class='checkbox-custom-label'><select disabled='disabled' id='ddl_" + ddl_Counter + "'><option>-Select Values-</option>";
                for (var j = 0; j < ddl_Array.length; j++) {
                    newdiv += "<option value=" + ddl_Array[j] + ">" + ddl_Array[j] + "</option>";
                }
                newdiv = newdiv + '</select></label></div></li></ul>';
                ddl_Counter++;
                txt_chkid++;
                item_Counter++;
                que_item_Counter++;
                ulandli++;
            }
            // Numeric Text Box
            else if (jsonObj[i].type == 4 && jsonObj[i].prop[0].is_deleted == 0 && jsonObj[i].prop[0].searchkey == 1) {
                newdiv += "<ul class='list-unstyled loc_per_ul12_" + ulandli + "'><li><div><input onclick='ChecksheetJSONRead_checksheet(" + JSON.stringify(encodeURIComponent(type_name_json_sample)) + "," + chkdivid + ",checkboxChk_" + ulandli + ")' id='checkboxChk_" + ulandli + "' value='" + type_name_json_sample + "' class='checkbox-custom' style='position: relative' name='myCheckbox' type='checkbox'><label for='checkboxChk_" + ulandli + "' class='checkbox-custom-label'><input disabled='disabled' style='width: 78%' type='number' id='txtno_" + txtno_Counter + "' placeholder='" + jsonObj[i].value + "' name='numericText'></label></div></li></ul>";
                txt_chkid++;
                txtno_Counter++;
                txtno_Counter++;
                item_Counter++;
                que_item_Counter++;
                ulandli++;
            }
            // Label
            else if (jsonObj[i].type == 5 && jsonObj[i].prop[0].is_deleted == 0) {
                txt_json.push(jsonObj[i]);
                newdiv += "<ul class='list-unstyled loc_per_ul12_" + ulandli + "'><li><div><label for='checkboxChk_" + ulandli + "' class='checkbox-custom-label'>" + jsonObj[i].value + "</label></div></li></ul>";
                txt_chkid++;
                lbl_Counter++;
                item_Counter++;
                que_item_Counter++;
                ulandli++;
            }
            // Check Box
            else if (jsonObj[i].type == 6 && jsonObj[i].prop[0].is_deleted == 0 && jsonObj[i].prop[0].searchkey == 1) {
                var chk_Array = jsonObj[i].value;
                txt_json.push(jsonObj[i]);
                newdiv += "<ul class='list-unstyled loc_per_ul12_" + ulandli + "'><li><div><input onclick='ChecksheetJSONRead_checksheet(" + JSON.stringify(encodeURIComponent(type_name_json_sample)) + "," + chkdivid + ",checkboxChk_" + ulandli + ")' id='checkboxChk_" + ulandli + "' value='" + type_name_json_sample + "' style='position: relative' class='checkbox-custom' name='myCheckbox' type='checkbox'><label for='checkboxChk_" + ulandli + "' class='checkbox-custom-label'>";
                for (var c = 0; c < chk_Array.length; c++) {
                    newdiv = newdiv + '<input disabled="disabled" type="checkbox" name="chkgroup_' + chk_Counter + '" id="chk_' + chk_Counter + '_' + c + '" value="' + chk_Array[c] + '" style="width: 25px; height: 25px; margin-left:12%; margin-right:1%"><label style="display:inline-block" id="chk_lbl_' + chk_Counter + '_' + c + '">' + chk_Array[c] + '</label><br />';
                }
                newdiv = newdiv + '</label></div></li></ul>';
                chk_Counter++;
                txt_chkid++;
                item_Counter++;
                que_item_Counter++;
                ulandli++;
            }
            // Question End
            else if (jsonObj[i].type == 10 && jsonObj[i].prop[0].is_deleted == 0) {
                // newdiv += '</div>';
                item_Counter++;
            }

            main_id_dyn++;
            chk_iddyn++;

        }

        step_counter++;

    }

    curr_mode = "new";
    curr_is_update = "no";

    var checksheetnumer = 1;

    newdiv += '</div>';
    if (chk == 0) {
        $("#question_id").append(newdiv);
    } else {
        $("#barchart_div").append(newdiv);
    }
    // return false;
}
var div_config = 0;
function ChecksheetJSONRead_checksheet(json_chk, chkdivid, licrentid) {
    try {
        // number_box_popup();
        var checkid = $(licrentid).prop('checked');
        if (checkid == true) {
            $("#config_data").html("");
            if (chkdivid.id == "question_id") {
                $("#question_id").find("input[type=checkbox]").each(function () {
                    if (this.id == licrentid.id) {
                        this.checked = true;
                    } else {
                        this.checked = false;
                    }
                });
            }
            var main_json = decodeURIComponent(json_chk);
            var parse_main = JSON.parse(main_json);
            if (parse_main["Type"] == 4) {
                number_box_popup(licrentid, parse_main, chkdivid);
            } else {
                var newdiv_chk_new_pre = '<div id="final_' + licrentid.id + '" style="padding: 5px;margin-bottom: 5px;border: 1px solid transparent;border-radius: 4px;;height: auto; box-shadow: 2px 1px 5px; background-color: rgba(204, 154, 129, 0);border-color: #6230DD; margin-bottom: 5px;" id="div_config_set' + div_config + '" ><input type="hidden" class="hidden" id="hdf_config' + chk_iddyn + '" value =\'' + main_json + '\'><span style="  margin-top: -1%;position: relative; font-family: monospace;">' + parse_main["PDF_Header"] + '</span></div>'

                if (chkdivid.id == "question_id") {
                    $("#config_data").append(newdiv_chk_new_pre);
                    $("#config_data").show();
                    $("#config_data_bar").hide();
                } else {
                    $("#config_data_bar").append(newdiv_chk_new_pre);
                    $("#config_data").hide();
                    $("#config_data_bar").show();
                }

                div_config++;
            }
        } else {

            $('#final_' + licrentid.id).remove();
        }

    } catch (e) {
        alert1(e);
    }
    // return false;
}
var flagset = 0;
function peichar_event() {
    flagset = 0;
}
function barchart_event() {
    flagset = 1;
}
function checksheet_onseccess(ex) {
    var Company_Data = ex.responseText;
    Company_Data = eval('(' + Company_Data + ')');
    //var Option_Item = '<table>';
    $("#chksheetflow").html("");
    var message1 = Company_Data[0].message;
    if (message1 != "Data Not Exists.") {
        message1 = eval('(' + message1 + ')');
        if (message1.length > 0) {
            var new_div = "<thead><tr>";
            var header = Object.keys(message1[0]);
            new_div += "<th>Edit</th>";
            for (var h = 0; h < header.length; h++) {
                // if (header[h] != "Status") {
                if (h == (header.length - 1))
                    new_div += "<th>" + header[h] + "</th>";
                else
                    new_div += "<th>" + header[h] + "</th>";
                //  }
            }
            new_div += "</tr></thead>";

            for (var r = 0; r < message1.length; r++) {
                new_div += "<tr><td><input type='image' src='/images/edit.png' onclick='return GetSelectedRow_For_Filter(this)'/></td>";
                for (var hh = 0; hh < header.length; hh++) {

                    new_div += "<td>" + message1[r][header[hh]] + "</td>";

                }
                new_div += "</tr>";
            }

            $("#chksheetflow").append(new_div);

        }
    } else {
        alert1(message1);
    }
    loading_hide();
}
function GetSelectedRow_For_Filter(lnk) {
    try {
        loading_show();
        checksheetid_ = "";
        var row = lnk.parentNode.parentNode;
        var rowIndex = row.rowIndex - 1;
        // var customerId = row.cells[2].innerHTML;
        var city = row.cells[1].innerHTML;
        checksheetid_ = city;
        // window.location.href = "CreateChecksheet_new_maulik_edit.aspx?Checksheet_id=" + checksheetid_;
        Get_All_Checksheet(checksheetid_);
        //alert1("RowIndex: " + city + " checksheetid_: " + customerId);
        //loading_hide();
        return false;
    } catch (e) {
        alert1(e);
        loading_hide();
    }
}
function main_chart_preiveiw() {
    //google.charts.setOnLoadCallback(chart_preview);
    google.load('visualization', '1', { packages: ['corechart', 'bar'], callback: chart_preview });
    //  chart_preview();
}
function chart_preview() {
    try {
        if (flagset == 0) {
            var div_config_id = $("#config_data").find("input[type=hidden]");
            var main_json = [];
            if (div_config_id.length > 0) {
                for (var p = 0; p < div_config_id.length; p++) {
                    var data_json = $(div_config_id[p]).val();
                    main_json.push(data_json);
                }
                var main_parse = JSON.parse(main_json[0]);
                var value = main_parse["value"];
                var lablstring = [];
                var rows_lbl = [];
                for (var t = 0; t < value.length; t++) {
                    lablstring.push({ "id": "", "label": value[t], "pattern": "", "type": "string" })
                }
                for (var tr = 0; tr < value.length; tr++) {
                    rows_lbl.push({ "c": [{ "v": value[tr], "f": null }, { "v": 3, "f": null }] })
                }
                var jsonData = {
                    "cols": lablstring,
                    "rows": rows_lbl
                }

                var data = new google.visualization.DataTable(jsonData);

                // Instantiate and draw our chart, passing in some options.
                var chart = new google.visualization.PieChart(document.getElementById('chart_div'));
                chart.draw(data, { title: main_parse["PDF_Header"] });
            } else {
                alert1("Please Select Checksheet column.");
            }
        } else if (flagset == 1) {
            var div_config_id = $("#config_data_bar").find("input[type=hidden]");
            var main_json = [];
            var lablstring = [];
            if (div_config_id.length > 0) {
                for (var p = 0; p < div_config_id.length; p++) {
                    var data_json = $(div_config_id[p]).val();
                    main_json.push(data_json);
                    // var data_parse = JSON.parse(data_json);
                    // lablstring.push({ "id": "", "label": data_parse["PDF_Header"], "pattern": "", "type": "number" })
                }
                //var rows_lbl = [];
                var all_value = [];
                for (var m = 0; m < main_json.length; m++) {
                    var main_parse = JSON.parse(main_json[m]);
                    var value = main_parse["value"];

                    for (var tr = 0; tr < value.length; tr++) {
                        // c_s.push({ "v": value[tr], "f": 20 });
                        all_value.push(value[tr]);
                    }

                }
                var clous_hd = array_check_and_duplicate(all_value);
                lablstring.push({ "id": "", "label": "Questions", "pattern": "", "type": "string" });
                for (var cl = 0; cl < clous_hd.length; cl++) {
                    lablstring.push({ "id": "", "label": clous_hd[cl], "pattern": "", "type": "number" });
                }
                var row_json = create_json_for(main_json, clous_hd);
                //  google.charts.setOnLoadCallback(function () {
                //var jsonData = {
                //    "cols": lablstring,
                //    "rows": row_json
                //}

                var json_data = {
                    "cols": lablstring,
                    "rows": row_json
                }
                var data = new google.visualization.DataTable(json_data);


                var options = {
                    title: 'Speed Tests Results',
                    isStacked: true
                };

                var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));

                chart.draw(data, options);

                //var data = new google.visualization.DataTable(jsonData);

                //var options = {
                //    title: 'Speed Tests Results',
                //    isStacked: true
                //};

                //var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));

                //chart.draw(data, options);
                // });
                //var chart = new google.visualization.PieChart(document.getElementById('chart_div'));
                // chart.draw(data, { title: main_parse["PDF_Header"] });
            } else {
                alert1("Please Select Checksheet column.");
            }
        }
    } catch (e) {
        alert1(e);
    }
}

function config_function() {
    //  $( "#li_config" ).tabs( "option", "active", # );

    $("#config_div123").addClass("active in");
    $("#preview").removeClass("active in");
}

function array_check_and_duplicate(aaray_old) {
    var seen = {};
    var out = [];
    var len = aaray_old.length;
    var j = 0;
    for (var i = 0; i < len; i++) {
        var item = aaray_old[i];
        if (seen[item] !== 1) {
            seen[item] = 1;
            out[j++] = item;
        }
    }
    return out;
}

function create_json_for(main_json, column_json) {
    var v_js = [];
    for (var m = 0; m < main_json.length; m++) {
        var parse_js = JSON.parse(main_json[m]);
        var value_js = parse_js["value"];
        var q_js = [];
        q_js.push({
            "v": parse_js["PDF_Header"],
            "f": null
        })
        for (var c = 0; c < value_js.length; c++) {
            var flag = 0;
            for (var v = 0; v < column_json.length; v++) {
                if (column_json[v] === value_js[c]) {
                    q_js.push({
                        "v": 5,
                        "f": null
                    })
                    flag = 0;
                    break;

                } else {
                    flag++;
                    //q_js.push({
                    //    "v": 0,
                    //    "f": null
                    //})
                }
            }
            if (flag != 0) {
                q_js.push({
                    "v": 0,
                    "f": null
                })
            }
        }
        v_js.push({
            "c": q_js
        })
    }
    return v_js;
}

function final_submit() {
    try {

        var div_config_id = $("#config_data").find("input[type=hidden]");
        var div_config_id_second = $("#config_data_bar").find("input[type=hidden]");
        var main_json_p = [];
        var chart_type = 0;
        if (flagset == 0) {
            if (div_config_id.length > 0) {
                for (var p = 0; p < div_config_id.length; p++) {
                    var data_json = $(div_config_id[p]).val();
                    var json_parse = JSON.parse(data_json);
                    main_json_p.push(json_parse);
                }
                if (flagset == 0) {
                    chart_type = 1;
                } else {
                    chart_type = 2;
                }
                var final_json = [];
                final_json.push({
                    "chart_type": chart_type,
                    "select": main_json_p
                })

                role_popup(JSON.stringify(final_json));
            }
        } else {
            if (div_config_id_second.length > 0) {
                for (var p = 0; p < div_config_id_second.length; p++) {
                    var data_json = $(div_config_id_second[p]).val();
                    var json_parse = JSON.parse(data_json);
                    main_json_p.push(json_parse);
                }
                if (flagset == 0) {
                    chart_type = 1;
                } else {
                    chart_type = 2;
                }
                var final_json = [];
                final_json.push({
                    "chart_type": chart_type,
                    "select": main_json_p
                })

                role_popup(JSON.stringify(final_json));
            }
        }
    } catch (e) {
        alert1(e);
    }
}

function number_box_popup(licrentid, json_main_num, maindiv_id) {
    try {
        var modaldiv = '<div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">  <div class="modal-dialog" role="document">';

        modaldiv += '<div class="modal-dialog modal-md">';

        modaldiv += '<div class="modal-content">';
        modaldiv += '<div class="modal-header" style="background-color: #435a6f;color:white;border-radius:3px"><button onclick="remove_licheck(' + licrentid.id + ')" type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title" id="myModalLabel">Input Limit for Chart</h4></div>';
        modaldiv += '<div class="modal-body">';
        modaldiv += '<div><table class="table"><tr><td>Min Value</td><td><input type="number" id="txtnum_min" class="form-control"/></td></tr><tr><td>Max Value</td><td><input type="number" id="txtnum_max" class="form-control"/></td></tr><tr><td colspan="2"  style="text-align:center"><input type="button" id="btn_add" class="btn btn-primary" value="Add" onclick="add_value()" /></td></tr></table></div>';
        modaldiv += '<div><table class="table" id="tbl_min_max"><tr><td>Min Value</td><td>Max Value</td><td></td></table></div>';
        modaldiv += '</div>';
        modaldiv += '<div class="modal-footer" style="background-color:rgba(184, 185, 185, 0.15)">';
        modaldiv += '<input type="button" id="btn_num_submit" class="btn btn-primary" value="Submit" onclick="add_numberbox_limit(\'' + encodeURIComponent(JSON.stringify(json_main_num)) + '\',' + licrentid.id + ',' + maindiv_id.id + ')" />';
        modaldiv += '<button type="button" class="btn btn-default" data-dismiss="modal" onclick="remove_licheck(' + licrentid.id + ')">Close</button>';
        modaldiv += '</div></div></div></div>';

        $("#div_trigger_pop").append(modaldiv);

        $("#myModal").modal({
            backdrop: 'static',
            keyboard: false
        });
    } catch (e) {
        alert1(e);
    }
}

function remove_licheck(li_remove) {
    try {
        $(li_remove).prop("checked", false);

    } catch (e) {
        alert1(e);
    }
}

function add_value() {
    try {
        var minval = $("#txtnum_min").val();
        var maxval = $("#txtnum_max").val();
        var flage_set = 0;
        $("#tbl_min_max").find("input[type=hidden]").each(function () {

            var parse_value = JSON.parse(this.value);
            var max_value = parse_value[0]["maxval"];
            var min_value = parse_value[0]["minval"];
            if ((min_value == minval || max_value == minval) || (min_value == maxval || max_value == maxval)) {
                flage_set++;
            }

        });

        if (flage_set == 0) {

            if (minval != "" && maxval != "") {
                if (minval < maxval) {
                    var json_p = [];
                    json_p.push({
                        "minval": minval,
                        "maxval": maxval
                    })

                    var newdiv = "<tr><td>" + minval + "</td><td>" + maxval + "</td><td><input type='hidden' value='" + JSON.stringify(json_p) + "'/><img src='Images/EF_Images/remove_table_cell.png' style='width: 20px; margin-left: 1.5%' onclick='$(this).parent().parent().remove();' /></td></tr>";
                    $("#tbl_min_max").append(newdiv);
                    $("#txtnum_min").val("");
                    $("#txtnum_max").val("");
                } else {
                    alert1("Min value is grater then max value..");
                }

            } else {
                alert1("Please fill Min and Max Value..")
            }
        } else {
            alert1("Insert Value using befor..");
        }

    } catch (e) {
        alert1(e);
    }
}

function add_numberbox_limit(json_main_st, lichekid, maindivid_s) {
    try {
        var json_parse_m = JSON.parse(decodeURIComponent(json_main_st))
        var limit_json = [];
        $("#tbl_min_max").find("input[type=hidden]").each(function () {

            var parse_value = JSON.parse(this.value);
            var max_value = parse_value[0]["maxval"];
            var min_value = parse_value[0]["minval"];
            limit_json.push({
                "minval": min_value,
                "maxval": max_value
            })

        });

        json_parse_m["Limit"] = limit_json;

        var main_json_p = JSON.stringify(json_parse_m);
        var newdiv_chk_new_pre = '<div id="final_' + lichekid.id + '" style="padding: 5px;margin-bottom: 5px;border: 1px solid transparent;border-radius: 4px;;height: auto; box-shadow: 2px 1px 5px; background-color: rgba(204, 154, 129, 0);border-color: #6230DD; margin-bottom: 5px;" id="div_config_set' + div_config + '" ><input type="hidden" class="hidden" id="hdf_config' + chk_iddyn + '" value =\'' + main_json_p + '\'><span style="  margin-top: -1%;position: relative; font-family: monospace;">' + json_parse_m["PDF_Header"] + '</span></div>'

        if (maindivid_s.id == "question_id") {
            $("#config_data").append(newdiv_chk_new_pre);
            $("#config_data").show();
            $("#config_data_bar").hide();
        } else {
            $("#config_data_bar").append(newdiv_chk_new_pre);
            $("#config_data").hide();
            $("#config_data_bar").show();
        }

        div_config++;

        $('#myModal').modal('hide');
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();
    } catch (e) {
        alert1(e);
    }

}

function role_popup(json_main_role) {
    try {
        $("#div_trigger_pop").html("");
        var modaldiv = '<div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">  <div class="modal-dialog" role="document">';

        modaldiv += '<div class="modal-dialog modal-md">';

        modaldiv += '<div class="modal-content">';
        modaldiv += '<div class="modal-header" style="background-color: #435a6f;color:white;border-radius:3px"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title" id="myModalLabel">Input Limit for Chart</h4></div>';
        modaldiv += '<div class="modal-body">';
        modaldiv += '<div><table class="table"><tr><td>Select Role</td><td><select id="drp_role" class="form-control"></select></td></tr>';
        // modaldiv += '<div><table class="table" id="tbl_min_max"><tr><td>Min Value</td><td>Max Value</td><td></td></table></div>';
        modaldiv += '<tr><td>Chart Lable</td><td><input type="text" class="form-control" id="txt_lbl_for_chart"/></td></tr>';
        modaldiv += '<tr><td>Width</td><td><select id="txt_width_for_chart" class="form-control"><option value="0">Select</option><option value="5">5</option><option value="7">7</option><option value="12">12</option></select></td></tr>';
        modaldiv += '<tr><td>Height</td><td><input type="number" class="form-control" id="txt_height_for_chart"/></td></tr></table></div>';
        modaldiv += '</div>';
        modaldiv += '<div class="modal-footer" style="background-color:rgba(184, 185, 185, 0.15)">';
        modaldiv += '<input type="button" id="btn_num_submit" class="btn btn-primary" value="Submit" onclick="add_role_limit(\'' + encodeURIComponent(JSON.stringify(json_main_role)) + '\')" />';
        modaldiv += '<button type="button" class="btn btn-default" data-dismiss="modal" >Close</button>';
        modaldiv += '</div></div></div></div>';

        $("#div_trigger_pop").append(modaldiv);

        $("#myModal").modal({
            backdrop: 'static',
            keyboard: false
        });

        var Param_obj = [];
        Param_obj.push({ 'key': 'isdelete', 'value': 0 }, { 'key': 'company_id', 'value': Compny_id });

        var getdata_old_step = new Webservicecall_REST(global_wcf_url + 'Common/Role', JSON.stringify(Param_obj), function (invocation1) {

            var Company_Data = invocation1.responseText;

            Company_Data = eval('(' + Company_Data + ')');
            var Option_Item = "";

            var Option_Item1 = "<option value='0'>--Select Role--</option>";
            //var message1 = Company_Data[0].message;
            //message1 = eval('(' + message1 + ')');

            var data = Company_Data[0].data;
            if (data == "" || data == null || data == undefined) {
                var message1 = JSON.parse(Company_Data[0].message);
            }
            else {
                var message1 = JSON.parse(data);
            }

            for (j = 0; j < message1.length; j++) {
                Option_Item += "<option value=" + message1[j].id + ">" + message1[j].name + "</option>";
            }

            $("#drp_role").append(Option_Item1);
            $("#drp_role").append(Option_Item);


        }, onfail_user_authentication);
        getdata_old_step.callOtherDomain();

    } catch (e) {
        alert1(e);
    }
}
function onfail_user_authentication(e) { alert1(e); }
var checksheet_name_for_flt = "";
var Main_Final_JSON = "";
function add_role_limit(json_main_st) {
    try {
        checksheet_name_for_flt = "";
        Main_Final_JSON = json_main_st;
        var json_parse_m = JSON.parse(JSON.parse(decodeURIComponent(json_main_st)));
        var role_id = $("#drp_role").val();
        var chart_lbl = $("#txt_lbl_for_chart").val();
        var width = $("#txt_width_for_chart").val();
        var Height = $("#txt_height_for_chart").val();
        if (role_id != "0" && chart_lbl != "" && width != "0" && Height != "") {
            checksheet_name_for_flt = chart_lbl + "_FilterChecksheet";
            var circle_obj = { "item_id": 2, "que_id": 4, "type": 20, "Excel_Header": "CIRCLE", "value": ["CIRCLE"], "ans": [""], "prop": [{ "searchkey": 0, "valid": "true", "is_deleted": 0, "name": "CIRCLE", "class1": [""], "misc_data": [{ "type": 6, "value": "[{\"FROM\":[{\"Table_Name\":\"User_Master\"}],\"JoinTableName\":\"No InnerJoin\",\"Checksheet_id\":\"1298\",\"ColumName\":[{\"type\":\"Json\",\"subdata\":[{\"Checksheet_Type\":\"7\",\"Checksheet_Id\":\"1298\",\"Task_Id\":\"\",\"Ques_Id\":\"17\",\"Header\":\"Circle\",\"Equation\":\"LIKE\",\"Value_1\":\"\",\"Value_2\":\"\",\"Type\":\"string\",\"Select\":\"[{\\\"Simple\\\":[{\\\"Table_Name\\\": \\\"USER_SUB_MASTER\\\",\\\"Column_Name\\\": \\\"USER_ID\\\",\\\"AS\\\": \\\"USER ID S\\\"},{\\\"Table_Name\\\": \\\"USER_SUB_MASTER\\\",\\\"Column_Name\\\": \\\"VALUESTRING\\\",\\\"AS\\\": \\\"Circle\\\"}]}]\",\"OrderBy\":\"VALUESTRING\",\"classname\":\"\"}]}],\"where\":[{\"And\":[{\"Json\":[],\"Table\":[{\"Checksheet_Id\":\"1298\",\"Table_Name\":\"User_Master\",\"Column_Name\":\"checksheet_id\",\"Equation\":\"EQUAL TO\",\"Value_1\":\"1298\",\"Value_2\":\"\",\"Type\":\"int\",\"type_text_or_id\":\"id\"},{\"Checksheet_Id\":\"1298\",\"Table_Name\":\"User_Master\",\"Column_Name\":\"user_id\",\"Equation\":\"EQUAL TO\",\"Value_1\":\"<#user_id#>\",\"Value_2\":\"\",\"Type\":\"int\",\"classname\":\"\",\"Select\":\"[{\\\"Simple\\\":[{\\\"Table_Name\\\": \\\"USER_MASTER\\\",\\\"Column_Name\\\": \\\"USER_ID\\\",\\\"AS\\\": \\\"USER ID\\\"},{\\\"Table_Name\\\": \\\"USER_MASTER\\\",\\\"Column_Name\\\": \\\"user_id\\\",\\\"AS\\\": \\\"user_id\\\"}]}]\",\"Header\":\"user_id\",\"OrderBy\":\"user_id\",\"type_text_or_id\":\"id\"}]}],\"Or\":[{\"Json\":[],\"Table\":[]}]}],\"Fill_Data\":[],\"orderby\":\"VALUESTRING\",\"show_orderby\":\"Circle\",\"order_type\":\"asc\",\"limit\":\"1000\",\"push_data\":[{\"push_array\":[{\"value\":\"<#user_id#>\",\"type\":\"id\"}],\"window_style\":\"popup\",\"view_style\":\"dropdownview\"}],\"columndata\":[]}]" }] }], "dependency": [{ "dep_type": "", "dep_ans": "", "dep_item_id": "", "dep_class": "" }] };

            var seachble_str = new search_str(circle_obj, function (e) {

                var rt_cicle_obj = JSON.stringify(e);
                var Customerstring = '[{"item_id":0,"que_id":0,"type":0,"Excel_Header":"Filter Form","value":["Filter Form"],"ans":[""],"prop":[{"searchkey":0,"valid":"true","is_deleted":0,"name":"","class1":[""],"misc_data":[{"type":50,"value":""}]}],"dependency":[{"dep_type":"","dep_ans":"","dep_item_id":"","dep_class":""}]},{"item_id":1,"que_id":3,"Excel_Header":"","type":5,"value":["CIRCLE"],"ans":[""],"prop":[{"searchkey":0,"valid":"true","is_deleted":0,"name":"CIRCLE","class1":[""],"misc_data":[{"type":50,"value":""}]}],"dependency":[{"dep_type":"","dep_ans":"","dep_item_id":"","dep_class":""}]},' + rt_cicle_obj + ',{"item_id":5,"que_id":10,"Excel_Header":"","type":5,"value":["STARTDATE"],"ans":[""],"prop":[{"searchkey":0,"valid":"true","is_deleted":0,"name":"STARTDATE","class1":[""],"misc_data":[{"type":50,"value":""}]}],"dependency":[{"dep_type":"","dep_ans":"","dep_item_id":"","dep_class":""}]},{"item_id":6,"que_id":11,"type":8,"Excel_Header":"STARTDATE","value":["STARTDATE"],"ans":[""],"prop":[{"searchkey":0,"valid":"true","is_deleted":0,"name":"STARTDATE","class1":[],"misc_data":[{"type":50,"value":"[{\"mode\":\"date\",\"main_class\":\"\",\"target_on\":\"date\",\"ref_class\":\"\",\"minDate\":\"\",\"maxDate\":\"\",\"minTime\":\"\",\"maxTime\":\"\",\"before_days\":\"0\",\"gap_days\":\"0\",\"before_hours\":\"0\",\"gap_hours\":\"0\",\"tat_type\":\"none\"}]","default_value":[""]}]}],"dependency":[{"dep_type":"","dep_ans":"","dep_item_id":"","dep_class":""}]},{"item_id":7,"que_id":12,"Excel_Header":"","type":5,"value":["ENDDATE"],"ans":[""],"prop":[{"searchkey":0,"valid":"true","is_deleted":0,"name":"ENDDATE","class1":[""],"misc_data":[{"type":50,"value":""}]}],"dependency":[{"dep_type":"","dep_ans":"","dep_item_id":"","dep_class":""}]},{"item_id":8,"que_id":13,"type":8,"Excel_Header":"ENDDATE","value":["ENDDATE"],"ans":[""],"prop":[{"searchkey":0,"valid":"true","is_deleted":0,"name":"ENDDATE","class1":[],"misc_data":[{"type":50,"value":"[{\"mode\":\"date\",\"main_class\":\"\",\"target_on\":\"date\",\"ref_class\":\"\",\"minDate\":\"\",\"maxDate\":\"\",\"minTime\":\"\",\"maxTime\":\"\",\"before_days\":\"0\",\"gap_days\":\"0\",\"before_hours\":\"0\",\"gap_hours\":\"0\",\"tat_type\":\"none\"}]","default_value":[""]}]}],"dependency":[{"dep_type":"","dep_ans":"","dep_item_id":"","dep_class":""}]},{"item_id":9,"que_id":2,"type":10,"Excel_Header":"","value":[""],"ans":[""],"prop":[{"searchkey":0,"valid":"true","is_deleted":0,"name":"","class1":[""],"misc_data":[{"type":50,"value":""}]}],"dependency":[{"dep_type":"","dep_ans":"","dep_item_id":"","dep_class":""}]}]';

                var btn_json_final = [];
                var inner_step = [];
                var outer_step = [];
                var main_smpl_json = [];
                var new_js = [];
                ////-------new-----///////////////
                inner_step.push({
                    stepid: 1,
                    server_stepid: 0,
                    subcategory: "Filter",
                    data: new_js,
                    buttons: btn_json_final,
                    is_updated: "0",
                    is_deleted: "0"
                });

                outer_step.push({

                    Form_Type: 9,
                    Customerid: Compny_id,
                    Checksheet_id: 0,
                    Cust_form_Header: checksheet_name_for_flt,
                    Description: "text",
                    step: inner_step,

                });


                main_smpl_json.push({

                    step_data: outer_step,
                    deleted_step: []

                });

                ///////-------end---------/////////

                var kdkdk = JSON.stringify(main_smpl_json);
                var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_InsertQuestionMaster_New', JSON.stringify(main_smpl_json), onsuccess_new_chk, Onfail_Get_All_Checksheet);
                getdata.callOtherDomain();
            });

            seachble_str.mainfunction();
        }
    } catch (e) {
        alert1(e);
    }
}

function onsuccess_new_chk(e) {
    try {
        loading_show();
        var status_parse = JSON.parse(e.responseText);

        var status = status_parse[0].status;
        if (status == 1) {

            //var chkid = status_parse[0].id;

            var data = JSON.parse(status_parse[0].data);
            if (data == "" || data == null || data == undefined) {
                var chkid = JSON.parse(status_parse[0].id);
            }
            else {
                var chkid = data[0].id;
            }

            var inner_step = [];
            var outer_step = [];
            var main_smpl_json = [];
            var main_json = [];

            var user_circle = { "item_id": 2, "que_id": 4, "type": 20, "Excel_Header": "CIRCLE", "value": ["CIRCLE"], "ans": [""], "prop": [{ "searchkey": 0, "valid": "true", "is_deleted": 0, "name": "CIRCLE", "class1": [""], "misc_data": [{ "type": 6, "value": "[{\"FROM\":[{\"Table_Name\":\"User_Master\"}],\"JoinTableName\":\"No InnerJoin\",\"Checksheet_id\":\"1298\",\"ColumName\":[{\"type\":\"Json\",\"subdata\":[{\"Checksheet_Type\":\"7\",\"Checksheet_Id\":\"1298\",\"Task_Id\":\"\",\"Ques_Id\":\"17\",\"Header\":\"Circle\",\"Equation\":\"LIKE\",\"Value_1\":\"\",\"Value_2\":\"\",\"Type\":\"string\",\"Select\":\"[{\\\"Simple\\\":[{\\\"Table_Name\\\": \\\"USER_SUB_MASTER\\\",\\\"Column_Name\\\": \\\"USER_ID\\\",\\\"AS\\\": \\\"USER ID S\\\"},{\\\"Table_Name\\\": \\\"USER_SUB_MASTER\\\",\\\"Column_Name\\\": \\\"VALUESTRING\\\",\\\"AS\\\": \\\"Circle\\\"}]}]\",\"OrderBy\":\"VALUESTRING\",\"classname\":\"\"}]}],\"where\":[{\"And\":[{\"Json\":[],\"Table\":[{\"Checksheet_Id\":\"1298\",\"Table_Name\":\"User_Master\",\"Column_Name\":\"checksheet_id\",\"Equation\":\"EQUAL TO\",\"Value_1\":\"1298\",\"Value_2\":\"\",\"Type\":\"int\",\"type_text_or_id\":\"id\"},{\"Checksheet_Id\":\"1298\",\"Table_Name\":\"User_Master\",\"Column_Name\":\"user_id\",\"Equation\":\"EQUAL TO\",\"Value_1\":\"<#user_id#>\",\"Value_2\":\"\",\"Type\":\"int\",\"classname\":\"\",\"Select\":\"[{\\\"Simple\\\":[{\\\"Table_Name\\\": \\\"USER_MASTER\\\",\\\"Column_Name\\\": \\\"USER_ID\\\",\\\"AS\\\": \\\"USER ID\\\"},{\\\"Table_Name\\\": \\\"USER_MASTER\\\",\\\"Column_Name\\\": \\\"user_id\\\",\\\"AS\\\": \\\"user_id\\\"}]}]\",\"Header\":\"user_id\",\"OrderBy\":\"user_id\",\"type_text_or_id\":\"id\"}]}],\"Or\":[{\"Json\":[],\"Table\":[]}]}],\"Fill_Data\":[],\"orderby\":\"VALUESTRING\",\"show_orderby\":\"Circle\",\"order_type\":\"asc\",\"limit\":\"1000\",\"push_data\":[{\"push_array\":[{\"value\":\"<#user_id#>\",\"type\":\"id\"}],\"window_style\":\"popup\",\"view_style\":\"dropdownview\"}],\"columndata\":[]}]" }] }], "dependency": [{ "dep_type": "", "dep_ans": "", "dep_item_id": "", "dep_class": "" }] };

            var seachble_str = new search_str(user_circle, function (e) {

                var rt_cicle_obj = JSON.stringify(e);

                var Customerstring = '[{"item_id":0,"que_id":0,"type":0,"Excel_Header":"Filter Form","value":["Filter Form"],"ans":[""],"prop":[{"searchkey":0,"valid":"true","is_deleted":0,"name":"","class1":[""],"misc_data":[{"type":50,"value":""}]}],"dependency":[{"dep_type":"","dep_ans":"","dep_item_id":"","dep_class":""}]},{"item_id":1,"que_id":3,"Excel_Header":"","type":5,"value":["CIRCLE"],"ans":[""],"prop":[{"searchkey":0,"valid":"true","is_deleted":0,"name":"CIRCLE","class1":[""],"misc_data":[{"type":50,"value":""}]}],"dependency":[{"dep_type":"","dep_ans":"","dep_item_id":"","dep_class":""}]},' + rt_cicle_obj + ',{"item_id":5,"que_id":10,"Excel_Header":"","type":5,"value":["STARTDATE"],"ans":[""],"prop":[{"searchkey":0,"valid":"true","is_deleted":0,"name":"STARTDATE","class1":[""],"misc_data":[{"type":50,"value":""}]}],"dependency":[{"dep_type":"","dep_ans":"","dep_item_id":"","dep_class":""}]},{"item_id":6,"que_id":11,"type":8,"Excel_Header":"STARTDATE","value":["STARTDATE"],"ans":[""],"prop":[{"searchkey":0,"valid":"true","is_deleted":0,"name":"STARTDATE","class1":[],"misc_data":[{"type":50,"value":"[{\\"mode\\":\\"date\\",\\"main_class\\":\\"\\",\\"target_on\\":\\"date\\",\\"ref_class\\":\\"\\",\\"minDate\\":\\"\\",\\"maxDate\\":\\"\\",\\"minTime\\":\\"\\",\\"maxTime\\":\\"\\",\\"before_days\\":\\"0\\",\\"gap_days\\":\\"0\\",\\"before_hours\\":\\"0\\",\\"gap_hours\\":\\"0\\",\\"tat_type\\":\\"none\\"}]","default_value":[""]}]}],"dependency":[{"dep_type":"","dep_ans":"","dep_item_id":"","dep_class":""}]},{"item_id":7,"que_id":12,"Excel_Header":"","type":5,"value":["ENDDATE"],"ans":[""],"prop":[{"searchkey":0,"valid":"true","is_deleted":0,"name":"ENDDATE","class1":[""],"misc_data":[{"type":50,"value":""}]}],"dependency":[{"dep_type":"","dep_ans":"","dep_item_id":"","dep_class":""}]},{"item_id":8,"que_id":13,"type":8,"Excel_Header":"ENDDATE","value":["ENDDATE"],"ans":[""],"prop":[{"searchkey":0,"valid":"true","is_deleted":0,"name":"ENDDATE","class1":[],"misc_data":[{"type":50,"value":"[{\\"mode\\":\\"date\\",\\"main_class\\":\\"\\",\\"target_on\\":\\"date\\",\\"ref_class\\":\\"\\",\\"minDate\\":\\"\\",\\"maxDate\\":\\"\\",\\"minTime\\":\\"\\",\\"maxTime\\":\\"\\",\\"before_days\\":\\"0\\",\\"gap_days\\":\\"0\\",\\"before_hours\\":\\"0\\",\\"gap_hours\\":\\"0\\",\\"tat_type\\":\\"none\\"}]","default_value":[""]}]}],"dependency":[{"dep_type":"","dep_ans":"","dep_item_id":"","dep_class":""}]},{"item_id":9,"que_id":2,"type":10,"Excel_Header":"","value":[""],"ans":[""],"prop":[{"searchkey":0,"valid":"true","is_deleted":0,"name":"","class1":[""],"misc_data":[{"type":50,"value":""}]}],"dependency":[{"dep_type":"","dep_ans":"","dep_item_id":"","dep_class":""}]}]';


                var new_js = JSON.parse(Customerstring);
                Ques_count = 19;   /////-maulik------//////
                // alert1("Edit=" + Ques_count)
                var question_Counter = Ques_count;
                inner_step.push({
                    stepid: 1,
                    server_stepid: 0,
                    subcategory: "Filter",
                    data: new_js,
                    //  buttons: "",
                    is_updated: "0",
                    is_deleted: "0"
                });

                outer_step.push({

                    Form_Type: 9,
                    Customerid: Compny_id,
                    Checksheet_id: chkid,
                    Cust_form_Header: checksheet_name_for_flt,
                    Description: "text",
                    step: inner_step,
                    Ques_Count: Ques_count

                });


                main_smpl_json.push({

                    step_data: outer_step,
                    deleted_step: []
                });

                var kdkdk = JSON.stringify(main_smpl_json);
                var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_InsertQuestionMaster_New', JSON.stringify(main_smpl_json), onsuccess_Final_submit, Onfail_Get_All_Checksheet);
                getdata.callOtherDomain();
            }, chkid);

            seachble_str.mainfunction();
        } else {
            alert1(status_parse[0]["message"]);
            loading_hide();
        }
        loading_hide();
    } catch (ex) {
        alert1(ex);
        loading_hide();
    }
}

function Onfail_Get_All_Checksheet(ex) {
    loading_hide();
    alert1(ex);
}

function onsuccess_Final_submit(esx) {
    try {
        loading_show();
        var status_parse = JSON.parse(esx.responseText);

        var status = status_parse[0].status;
        if (status == 1) {
            //var chkid = status_parse[0].id;

            var data = JSON.parse(status_parse[0].data);
            if (data == "" || data == null || data == undefined) {
                var chkid = JSON.parse(status_parse[0].id);
            }
            else {
                var chkid = data[0].id;
            }

            var role_id = $("#drp_role").val();
            var chart_lbl = $("#txt_lbl_for_chart").val();
            var width = $("#txt_width_for_chart").val();
            var Height = $("#txt_height_for_chart").val();
            var chart_css = [];
            chart_css.push({
                "width": width,
                "height": Height
            })
            var json_parse_m = JSON.parse(JSON.parse(decodeURIComponent(Main_Final_JSON)));
            json_parse_m[0]["role_id"] = role_id;
            json_parse_m[0]["company_feature_id"] = featuer_id;
            json_parse_m[0]["company_id"] = Compny_id;
            json_parse_m[0]["user_id"] = Session_Userid;
            json_parse_m[0]["Chart_Header"] = chart_lbl;
            json_parse_m[0]["Checksheet_id"] = chkid;
            json_parse_m[0]["Chart_Css"] = chart_css;

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Custom_chart', JSON.stringify(json_parse_m), chart_success, onfail_user_authentication);
            getdata.callOtherDomain();
        } else {
            loading_hide();
        }

    } catch (e) {
        loading_hide();
        alert1(e);
    }
}

function chart_success(invoice) {
    try {
        var Company_Data = invoice.responseText;
        var json_respo = JSON.parse(Company_Data);
        if (json_respo[0].status == "1") {

            $('#myModal').modal('hide');
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();

            var data = json_respo[0].data;
            if (data == "" || data == null || data == undefined) {
                var message = json_respo[0].message;
            }
            else {
                var message = data;
            }

            alert1(message);
        }
        else {
            alert1(json_respo[0].message);
        }
    } catch (ex) {
        alert1(ex);
    }
}