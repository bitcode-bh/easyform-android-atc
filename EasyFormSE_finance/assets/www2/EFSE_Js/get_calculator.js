/*
 type = 0 (set value) ==== value = class name (print answer) currenty not setting type 0 from checksheet
 type = 1 (get value) ==== value = class name
 type = 2 (static value) ==== 2 (any static number) 
 type = 3 (operator) ==== (+ , - , * , / , %)
 */

//---new dev for ATC [atc.bb - 03052021]
function auto_calculation_for_multiple_calc(t_Type17_class_Array) {
    try {
        if (t_Type17_class_Array.length > 0) {
            var type4_found = t_Type17_class_Array[0][0];
            var type17_box_classes = t_Type17_class_Array[0][1];
            var t_new_id = t_Type17_class_Array[0][2];
            var t_paramData = t_Type17_class_Array[0][3];
            var t_type17_dep_obj = t_Type17_class_Array[0][4];

            var paramData = [];
            paramData.push({
                'new_id': t_new_id,
                'miscData': t_paramData,
                'dependency': t_type17_dep_obj,
                'target_div': curr_target_div
            });

            var misc_data = JSON.parse(t_paramData);
            var comparision = misc_data[0].comparision;

            for (c1 = 0; c1 < type17_box_classes.length; c1++) {
                var type17_box_class = type17_box_classes[c1];

                $("." + type17_box_class + "").css("display", "block");

                if (curr_target_div == "" || curr_target_div == null || curr_target_div == undefined) {
                    var number_box_id = $("." + type17_box_class + " :input").attr("id");
                }
                else {
                    var number_box_id = $("#" + curr_target_div + " ." + type17_box_class + " :input").attr("id");
                }

                var nobox_id = document.getElementById(number_box_id);
                nobox_id.addEventListener("input", function () {                            //bind input event for cell value total [atc.bb - 03052021]
                    get_value_from_other_step(encodeURIComponent(JSON.stringify(paramData)));
                }, false);

                if (comparision == "" || comparision == null || comparision == undefined || comparision.length == 0) { }
                else {
                    nobox_id.addEventListener("change", function () {                       //bind change event for cell value comparision [atc.bb- 03052021]
                        get_value_from_other_step(encodeURIComponent(JSON.stringify(paramData)));
                    }, false);
                }
            }

            var t_paramData = JSON.stringify(paramData);
            get_value_from_other_step(encodeURIComponent(t_paramData));

            if (t_Type17_class_Array.length != 0) {
                t_Type17_class_Array.shift();
                auto_calculation_for_multiple_calc(t_Type17_class_Array)
            }
        }
    }
    catch (e) {
        alert1(e + '_auto_calculation_for_multiple_calc');
    }
}

function get_value_from_other_step(paramData_t) {
    try {
        var parsed_paramData = itemObj._checkStrObj(decodeURIComponent(paramData_t));  		// check_item
        var temp_calc_counter = parsed_paramData[0].new_id;
        var paramData = parsed_paramData[0].miscData;
        var dependency = parsed_paramData[0].dependency;
        var target_div = parsed_paramData[0].target_div;

        storage.setItem('newdiv_id_Calc', JSON.stringify(temp_calc_counter));
        storage.setItem('Calc_data', JSON.stringify(paramData));
        var parsed_paramData = itemObj._checkStrObj(paramData);  		// check_item
        var calc_type4_array = [];
        for (i = 0; i < parsed_paramData.length; i++) {
            var type = parsed_paramData[i].type;
            var value = parsed_paramData[i].value;
            if (type == 4) {
                value = itemObj._checkStrObj(value);  		// check_item
                calc_type4_array.push(value);
            }
        }

        if (calc_type4_array.length > 0) {
            storage.setItem('calc_type4_array', JSON.stringify(calc_type4_array));
            get_last_step_data_type17(calc_type4_array);
        } else {
            get_numbers_and_calculate(temp_calc_counter, paramData, dependency, target_div);
        }
    } catch (e) {
        alert1(e + '_get_value_from_other_step()');
    }
}

function get_numbers_and_calculate(temp_calc_counter, paramData, dependency, target_div) {
    try {
        var parsed_paramData = itemObj._checkStrObj(paramData);  		// check_item

        var answer = 0;
        var control_val = 0;
        var op = '';
        var number = "default";
        var decimal_points = 0;
        var comp_op = "";
        var comp_val = "";
        var comparision_obj = [];

        for (i = 0; i < parsed_paramData.length; i++) {
            var type = parsed_paramData[i].type;
            var value = parsed_paramData[i].value;

            if (type == 0) {
                comparision_obj = parsed_paramData[i].comparision;
                if (comparision_obj == "" || comparision_obj == null || comparision_obj == undefined || comparision_obj.length == 0) { }
                else {
                    comp_op = comparision_obj[0].op;
                    comp_val = comparision_obj[0].value;
                }
            }
            else if (type == 1) {
                number = '';
                // value from numeric box (current step)

                if (target_div == "" || target_div == null || target_div == undefined) {
                    var numeric_box_id = $("." + value + " :input").attr("id");
                    if (numeric_box_id == '' || numeric_box_id == null || numeric_box_id == undefined) {
                        numeric_box_id = $("." + value + " select").attr("id");
                    }
                }
                else {
                    var numeric_box_id = $("#" + target_div + " ." + value + " :input").attr("id");
                }

                var is_visible = $("#" + numeric_box_id).is(":visible");
                var type12_is_hide = $("#" + numeric_box_id).attr('is_hide')
                number = $("#" + numeric_box_id + "").val();

                if (is_visible || type12_is_hide == "true") {
                    //auto calculate nbmr if field is visible or hidden by is_hide true [haresh1.vt - 06052021]
                    if (number == '' || number == null || number == undefined || number == '--- Select Values ---') {
                        $('.' + value + '').css({ "border": "solid 1px red" });
                        break;
                    } else {
                        $('.' + value + '').css({ "border": "none" });
                    }
                    control_val = parseFloat(number);

                    //New Development for ATC battery bank [atc.bbtest1 - 29042021]
                    if ((comp_op == "" && comp_val == "") || comparision_obj.length == 0) { }
                    else {
                        if (comp_op == "less than") {
                            if (control_val <= comp_val) {
                                control_val = 1;
                            }
                            else {
                                control_val = 0;
                            }
                        }
                        else if (comp_op == "greater than") {
                            if (control_val >= comp_val) {
                                control_val = 1;
                            }
                            else {
                                control_val = 0;
                            }
                        }
                    }

                    if (i == 1) {
                        // default addition first time
                        answer = answer + control_val;
                    } else {
                        answer = calculate_two_numbers(answer, op, control_val);
                    }
                }
                else {
                    number = 0;
                }
            } else if (type == 2) {
                // static value
                control_val = parseFloat(value);
                if (i == 1) {
                    // default addition first time
                    answer = answer + control_val;
                } else {
                    answer = calculate_two_numbers(answer, op, control_val);
                }
            } else if (type == 3) {
                // operator
                op = value;
            } else if (type == 4) {
                // value from numeric box (other checksheet/step)
                value = itemObj._checkStrObj(value);  		// check_item
                number = value[0].ans;
                control_val = parseFloat(number);
                if (i == 1) {
                    // default addition first time
                    answer = answer + control_val;
                } else {
                    answer = calculate_two_numbers(answer, op, control_val);
                }
            } else if (type == 5) {
                // decimal points
                decimal_points = parseInt(value);
            }
        }
        if (number === '' || number == null || number == undefined) {                   // added '===' to restrict 0
            // alert1("Please enter required value to calculate !");
            $("#txt_Calc_" + temp_calc_counter + "").val('');
        } else {
            if (decimal_points == 0) {
                answer = parseFloat(answer);

                var t_ans = answer.toString();
                if (t_ans.includes('.')) {
                    $("#txt_Calc_" + temp_calc_counter + "").val(answer.toFixed(2));
                }
                else {
                    $("#txt_Calc_" + temp_calc_counter + "").val(answer);
                }

            } else {
                $("#txt_Calc_" + temp_calc_counter + "").val(answer.toFixed(decimal_points));
            }

            if (answer == "" || answer == null || answer == undefined || answer == "NaN") { }
            else {
                $("#txt_Calc_" + temp_calc_counter + "").addClass('mk_vibrate');
                setTimeout(function () {
                    $("#txt_Calc_" + temp_calc_counter + "").removeClass('mk_vibrate');
                }, 500);
            }

            //show/hide submit btn if total is (</>) than any value for ATC battery bank [atc.bbtest1 - 29042021]
            if (dependency == "" || dependency == null || dependency == undefined) { }
            else {
                show_hide_Element(encodeURIComponent(dependency), target_div);
            }

            // fire event for filling end calendar - atctesting (09122020)
            var event = $("#txt_Calc_" + temp_calc_counter + "").attr("oninput");
            if (event == "" || event == null || event == undefined) { }
            else {
                $("#txt_Calc_" + temp_calc_counter + "").attr("ondrag", event);
                $("#txt_Calc_" + temp_calc_counter + "").trigger("ondrag");
            }
        }

        if (press_calc_Array.length > 0) {
            press_calc_Array.splice(0, 1);
            call_calc_click(press_calc_Array);
        } else {
            loading_hide();
        }
    } catch (e) {
        alert1(e + '_get_numbers_and_calculate()');
        loading_hide();
    }
}

// calculating two numbers based on operator
function calculate_two_numbers(num1, op, num2) {
    try {

        num1 = parseFloat(num1);
        num2 = parseFloat(num2);

        if (op == '+') {
            var result = num1 + num2;
        } else if (op == '-') {
            var result = num1 - num2;
        } else if (op == '*') {
            var result = num1 * num2;
        } else if (op == '/') {
            var result = num1 / num2;
        } else if (op == '%') {
            var result = (num1 * num2) / 100;
        }
        return result;
    } catch (e) {
        alert1(e + '_calculate_two_numbers()');
    }
}

// get targeted step data from native
function get_last_step_data_type17(calc_type4_array) {
    try {
        var calc_type4_data = calc_type4_array[0];
        var check_type = calc_type4_data[0].checksheet_id;
        var step = calc_type4_data[0].step_id;
        var type17_que_id = calc_type4_data[0].que_id;
        var type17_index = calc_type4_data[0].index;
        storage.setItem('type17_que_id', JSON.stringify(type17_que_id));
        storage.setItem('type17_index', JSON.stringify(type17_index));
        var t_id = JSON.parse(storage.getItem('tid'));

        var query = "select f_data from f_master where tid = '" + t_id + "' and c_id = '" + check_type + "' and step = '" + step + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "0"
        });
        cordova.exec(onsuccess_get_last_step_data_type17, onfail_get_last_step_data_type17, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_last_step_data_type17()');
        loading_hide();
    }
}

// onsuccess get last step data
function onsuccess_get_last_step_data_type17(e) {
    try {
        var myArray = JSON.parse(e);
        var data = myArray[0].data;
        var type17_que_id = JSON.parse(storage.getItem('type17_que_id'));
        var type17_index = JSON.parse(storage.getItem('type17_index'));
        for (i = 0; i < data.length; i++) {
            var que_id = data[i].que_id;
            if (que_id == type17_que_id) {
                var answer = data[i].ans[0];
                break;
            }
        }

        var Calc_data = itemObj._checkStrObj(storage.getItem('Calc_data'));  		// check_item
        Calc_data = itemObj._checkStrObj(Calc_data);  		// check_item


        var t_value_array = itemObj._checkStrObj(Calc_data[type17_index].value);  		// check_item
        t_value_array[0].ans = answer;
        Calc_data[type17_index].value = JSON.stringify(t_value_array);
        Calc_data = JSON.stringify(Calc_data);

        // Calc_data[type17_index].value[0].ans = answer;
        storage.setItem('Calc_data', JSON.stringify(Calc_data));
        var calc_type4_array = itemObj._checkStrObj(storage.getItem('calc_type4_array'));  		// check_item
        calc_type4_array.shift();
        if (calc_type4_array.length > 0) {
            storage.setItem('calc_type4_array', JSON.stringify(calc_type4_array));
            get_last_step_data_type17(calc_type4_array)
        } else {
            var temp_calc_counter = itemObj._checkStrObj(storage.getItem('newdiv_id_Calc'));  		// check_item
            //Calc_data = JSON.stringify(Calc_data);
            get_numbers_and_calculate(temp_calc_counter, Calc_data);
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_last_step_data_type17()');
        loading_hide();
    }
}

// onfail get last step data
function onfail_get_last_step_data_type17(e) {
    // alert1(e + '_onfail_get_last_step_data_type17()');
    alert1("Required step data is not available !");
    loading_hide();
}

// ////////----------New eqution calculator start------------------/////////////
// var eq_str = '(20+25)-10+(3+5)';
// var eq_str = '870+(3*0.03)';
// var eq_str = '869.04+((1007-991)*0.03)';
// var eq_str = '(870.57-870)/0.03';
// var eq_str = '((869.13-869.04)/0.03)+991';
// var eq_str = '(({&abc}>-869.04)/0.03)+991';
// var eq_str = '869.04+(({&abc&}-991)*0.03)';
// var eq_str = '(2+15*2)-10+(3+5)';
// var eq_str = '(20*2+15*2)-10+(3+5)';
// var eq_str = '(20/2+15*2)-10+(3+5)';
// var eq_str = '2+3*4';
// var eq_str = '(2+3)*4';
// var eq_str = '10-(4-2)';
// var eq_str = '12/3+3';
// var eq_str = '12/(3+3)';
// var eq_str = '12/2*3';
// var eq_str = '12/2/3';
// var eq_str = '12+(100%10)';
// var eq_str = '10-{&abc&}';
// var eq_str = 'if[<#weight_cls#>,=,YES]' - count all YES answer belongs to weight_cls (in radio, dropdown, checkbox)
// var eq_str = 'if[<#weight_cls#>,1=,YES]' - count all answer belongs to weight_cls that has not selected YES (in radio, dropdown, checkbox)

var end_bracket_outer = 0;
var temp_result = 0;
var Type17_Autofill_Textbox_Array = []; // type17 classes
var act_eq_str = "";

function extract_calculator_data(paramData) {
    try {
        //loading();
        ans_type = 'number';
        var parsed_paramData = itemObj._checkStrObj(decodeURIComponent(paramData));  		// check_item

        for (i = 0; i < parsed_paramData.length; i++) {
            var temp_calc_counter = parsed_paramData[i].new_id;
            curr_calc_counter = temp_calc_counter;
            var eq_str = parsed_paramData[i].eq_str;
            std_rng_equation = parsed_paramData[i].std_rng_test;
            act_eq_str = eq_str;
            check_for_other_step_values(temp_calc_counter, eq_str);
        }
    } catch (e) {
        alert1(e + '_extract_calculator_data()');
        loading_hide();
    }
}

// [ = other step
// [{"checksheet_id":6549,"step_id":1,"que_id":16,"index":3,"ans":""}]
// { = class value {@abc@}
// ( = equation (5+2)
// < = inbuilt function log<10>
// if[ = condition

// check step value is exist or not
function check_for_other_step_values(temp_calc_counter, eq_str) {
    try {
        var n = eq_str.indexOf("if[");
        if (n == -1) {
            // if condition not exist
            var n = eq_str.indexOf("[");
            if (n == -1) {
                // other step value not exist
                check_for_required_values(temp_calc_counter, eq_str);
            } else {
                // other step value exist
                get_last_step_data_type17_eq(temp_calc_counter, eq_str);
            }
        } else {
            // if condition exist
            calculate_weightage_for_if(temp_calc_counter, eq_str);
        }
    } catch (e) {
        alert1(e + '_check_for_other_step_values()');
        loading_hide();
    }
}

// calculate weightage for if condition (radio/dropdown/checkbox)
function calculate_weightage_for_if(temp_calc_counter, eq_str) {
    try {
        var start_bracket = eq_str.indexOf("if[");
        var end_bracket = eq_str.indexOf("]", start_bracket);
        var block_str = eq_str.substring(start_bracket, end_bracket + 1);
        var inner_block_str = block_str.substring(3, block_str.length - 1);
        var if_data = inner_block_str.split(',');
        var class_str = if_data[0];
        var class_name = class_str.substring(2, class_str.length - 2);

        var op = if_data[1];
        var check_ans = if_data[2];
        var elements_Array = document.getElementsByClassName(class_name);
        var sum = 0;
        var blank_ans = 0;
        for (i = 0; i < elements_Array.length; i++) {
            var parent_id = elements_Array[i].id;
            //var tag_name = $("#" + parent_id + " :nth-child(2)").prop('tagName');
            var t_parent_id = parent_id.substring(4);
            var tag_name = $("#" + t_parent_id + "").prop('tagName');

            if (tag_name == 'SELECT' || tag_name == 'OPTION') {
                var child_id = $("#" + parent_id + "").find("select").attr("id");
                var ele_ans = $("#" + child_id + " :selected").text();
                if (ele_ans == '' || ele_ans == null || ele_ans == undefined || ele_ans == "--- Select Values ---" || ele_ans == "--- Select ---") {
                    blank_ans++;

                    $("#" + parent_id + "").css({
                        "border": "solid 1px red"
                    });

                    autoscroll_form_on_submit("#" + parent_id + "");

                    break;
                } else {
                    if (op == "=") {
                        if (ele_ans == check_ans) {
                            var weightage = parseFloat($("#" + child_id + " :selected").attr('alt'));
                            sum = sum + weightage;
                        }
                    } else if (op == "!=") {
                        if (ele_ans != check_ans) {
                            var weightage = parseFloat($("#" + child_id + " :selected").attr('alt'));
                            sum = sum + weightage;
                        }
                    }
                }
            } else {
                //var ele_type = $("#" + parent_id + " :nth-child(2)").prop('type');
                var t_parent_id = $("#" + parent_id + "").find("input").attr("id");
                var ele_type = $("#" + t_parent_id + "").prop('type');
                if (ele_type == 'radio') {
                    //var group_name = $("#" + parent_id + " :nth-child(2)").prop('name');
                    var group_name = $("#" + t_parent_id + "").prop('name');
                    var ele_ans = $('input[name=' + group_name + ']:checked').val();
                    if (ele_ans == '' || ele_ans == null || ele_ans == undefined) {
                        blank_ans++;

                        $("#" + parent_id + "").css({
                            "border": "solid 1px red"
                        });

                        autoscroll_form_on_submit("#" + parent_id + "");

                        break;
                    } else {
                        if (op == "=") {
                            if (ele_ans == check_ans) {
                                var weightage = parseFloat($('input[name=' + group_name + ']:checked').attr('alt'));
                                sum = sum + weightage;
                            }
                        } else if (op == "!=") {
                            if (ele_ans != check_ans) {
                                var weightage = parseFloat($('input[name=' + group_name + ']:checked').attr('alt'));
                                sum = sum + weightage;
                            }
                        }
                    }
                } else if (ele_type == 'checkbox') {
                    //var group_name = $("#" + parent_id + " :nth-child(2)").prop('name');
                    var t_parent_id = $("#" + parent_id + "").find("input").attr("id");
                    var group_name = $("#" + t_parent_id + "").prop('name');
                    var checkbox = document.getElementsByName(group_name);
                    var checked_box = 0;
                    var ele_ans_Array = [];
                    for (j = 0; j < checkbox.length; j++) {
                        if (checkbox[j].checked) {
                            var weightage = parseFloat(checkbox[j].alt);
                            ele_ans_Array.push([checkbox[j].value, weightage]);
                            checked_box++;
                        }
                    }

                    if (checked_box == 0) {
                        blank_ans++;

                        $("#" + parent_id + "").css({
                            "border": "solid 1px red"
                        });

                        autoscroll_form_on_submit("#" + parent_id + "");

                        break;
                    } else {
                        if (op == "=") {
                            for (e = 0; e < ele_ans_Array.length; e++) {
                                var ele_ans = ele_ans_Array[e][0];
                                if (ele_ans == check_ans) {
                                    var weightage = parseFloat(ele_ans_Array[e][1]);
                                    sum = sum + weightage;
                                }
                            }
                        } else if (op == "!=") {
                            for (e = 0; e < ele_ans_Array.length; e++) {
                                var ele_ans = ele_ans_Array[e][0];
                                if (ele_ans != check_ans) {
                                    var weightage = parseFloat(ele_ans_Array[e][1]);
                                    sum = sum + weightage;
                                }
                            }
                        }
                    }
                }
            }
        }

        if (blank_ans == 0) {
            eq_str = eq_str.replace(block_str, sum);
            check_for_pending_calculation(temp_calc_counter, eq_str, sum);
        } else {
            //alert1("Please fill required fields! (weightage elements)");
            loading_hide();
        }
    } catch (e) {
        alert1(e + '_calculate_weightage_for_if()');
        loading_hide();
    }
}

// check required value is exist or not
var ans_type = 'number';
function check_for_required_values(temp_calc_counter, eq_str) {
    try {
        var n = eq_str.search("{");
        if (n == -1) {
            // required class value not exist
            calculate_equation_with_bracket(temp_calc_counter, eq_str);
        } else {
            // required class value exist
            var req_value_found = 0;
            for (i = 0; i < eq_str.length; i++) {
                var t_char = eq_str[i];
                if (t_char == "{") {
                    var start_at = eq_str.indexOf("{", i);
                    var end_at = eq_str.indexOf("}", i);
                    var inner_eq_class_str_all = eq_str.substring(start_at,
                        (end_at + 1));
                    var sub_get_value = inner_eq_class_str_all.substring(2,
                        inner_eq_class_str_all.length - 2);

                    //var where_box_id = $("." + sub_get_value + " :input[type=number]").attr("id");
                    //if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
                    //    where_box_id = $("." + sub_get_value + " select").attr("id");
                    //    if (where_box_id.indexOf('dynddl') != -1) {
                    //        var new_get_value = $("#" + where_box_id + " :selected").text();
                    //    }
                    //    else {
                    //        var new_get_value = $("#" + where_box_id + "").val();
                    //    }
                    //}
                    //else if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
                    //    where_box_id = $("." + sub_get_value + " :input[type=text]").attr("id");
                    //    var new_get_value = $("#" + where_box_id + "").val();
                    //    var cal_date = new Date(new_get_value);
                    //    new_get_value = cal_date.getTime();
                    //    ans_type = 'date';
                    //}
                    //else {
                    //    var new_get_value = $("#" + where_box_id + "").val();
                    //}

                    var where_box_id = $("." + sub_get_value + " :input[type=number]").attr("id");
                    if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {

                        // check for text box
                        where_box_id = $("." + sub_get_value + " :input[type=text]").attr("id");

                        if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
                            // possible dropdown 
                            where_box_id = $("." + sub_get_value + " select").attr("id");

                            if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {

                                // check for radio box
                                where_box_id = $("." + sub_get_value + " :input[type=radio]").attr("id");
                                if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
                                    // check for trip control
                                    where_box_id = $("." + sub_get_value + " #trip_info_tbl").attr("id");

                                    if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
                                        // type22 grand total
                                        //var new_get_value = $("." + sub_get_value + "").find("td[id^='sum_']").last().text();


                                        // check for type 22 sum value
                                        where_box_id = $("td." + sub_get_value + "").attr("id");

                                        if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
                                            // type22 grand total (when there is single sum value exist)
                                            var new_get_value = $("." + sub_get_value + "").find("td[id^='sum_']").last().text();
                                        }
                                        else {
                                            //type22 sum value (where there are multiple sum value exist)
                                            var new_get_value = $("#" + where_box_id + "").text();
                                        }
                                    }
                                    else {
                                        //trip actual distance
                                        var new_get_value = $("#trip_info_tbl > tbody > tr > td").html();
                                        if (new_get_value == "Actual Path is missing.") {
                                            new_get_value = "0.00";
                                        }
                                    }
                                }
                                else {
                                    // get radio weightage
                                    let rdo_group_name = $("#" + where_box_id + "").attr("name");
                                    var new_get_value = $('input[name=' + rdo_group_name + ']:checked').attr('alt');
                                }
                            }
                            else {
                                if (where_box_id.indexOf('dynddl') != -1) {
                                    // type30 dropdown
                                    var new_get_value = $("#" + where_box_id + " :selected").text();
                                    if (isNaN(new_get_value)) {
                                        //date in type30
                                        var cal_date = new Date(new_get_value);
                                        new_get_value = cal_date.getTime();
                                        ans_type = 'date';
                                    }
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
                                new_get_value = convert_fix_format_date_on_submit(new_get_value, mode);

                                if (mode == "time") {
                                    new_get_value = "2025/06/18 " + new_get_value;
                                }

                                var cal_date = new Date(new_get_value);
                                var new_get_value = cal_date.getTime();
                                ans_type = 'date';
                            }
                        }
                    }
                    else {
                        // numeric found
                        //var is_visible = $("#" + where_box_id).is(":visible");                //(commented for UrbanJungle Order Generate checksheet and Selected Credit Policy is "Monthly Credit" then error "Invalid Amount" is coming coz of hidden calc by dep_class [20082021])
                        //var cntrl_is_hide = $("#" + where_box_id).attr('is_hide');
                        //if (is_visible || cntrl_is_hide == "true") {
                        //    //calculate nbmr if field is visible or hidden by is_hide true [urbanJungle - 16082021]
                        //    var new_get_value = $("#" + where_box_id + "").val();
                        //}
                        //else {
                        //    //if field is hiiden by class then consider it as 0 [urbanJungle - 16082021]
                        //    var new_get_value = 0;
                        //}

                        var new_get_value = $("#" + where_box_id + "").val();
                        if (new_get_value == "" || new_get_value == null || new_get_value == undefined) {

                            // ATC 20122021
                            var is_visible = $("#" + where_box_id).is(":visible");
                            if (is_visible) {
                                //calculate nbmr if field is visible with blank field
                                //new_get_value = " ";
                                new_get_value = "0";                                                //added "0" for eq_str (10+1+5+7+50+ +2+2) lead managment [FT-28052025]
                                $("#txt_Calc_" + temp_calc_counter + "").val('');
                            }
                            else {
                                // if field is hiiden then consider it as 0
                                new_get_value = 0;
                            }

                        }
                        else {

                            var is_string = typeof new_get_value;
                            if (is_string != "string") {                //changes for urbanJungle [18082021]
                                new_get_value = new_get_value.toString();
                            }
                            if (new_get_value.length > 1) {
                                new_get_value = new_get_value.replace(/^0+/, '');
                            }

                            new_get_value = parseFloat(new_get_value);
                        }
                    }

                    // need to put to specific if else 25102021
                    //new_get_value = parseFloat(new_get_value);                  //====changes for urbanJungle [22102021]

                    if (new_get_value === '' || new_get_value == null || new_get_value == undefined || new_get_value == '--- Select Values ---') {
                        //numeric 0 is considerd as blank string in comparision---[11062020]
                        req_value_found++;
                    }

                    eq_str = eq_str.replace(inner_eq_class_str_all, new_get_value);

                    var n = eq_str.search("{");
                    if (n == -1) {
                        // required value not exist
                        break;
                    }
                }
            }

            if (req_value_found > 0) {
                ///////-----auto click calc on type20 ddl list row click(05122019)--------////////////
                if (auto_click_calc_type == "invoice_type20_autofill") {
                    press_calc_Array.splice(0, 1);
                    call_calc_click(press_calc_Array);
                }
                else {
                    $('.' + sub_get_value + '').css({
                        "border": "solid 1px red"
                    });
                    //alert1("Please fill required fields! (class elements)");
                }
                loading_hide();
            } else {
                $('.' + sub_get_value + '').css({
                    "border": "none"
                });
                check_for_required_values(temp_calc_counter, eq_str);
            }
        }
    } catch (e) {
        alert1(e + '_check_for_required_values()');
        loading_hide();
    }
}

// check for brackets and calculate it
function calculate_equation_with_bracket(temp_calc_counter, eq_str) {
    try {
        if (eq_str.indexOf('(') > -1) {
            // brackets available
            var start_bracket = eq_str.lastIndexOf("(");
            var end_bracket = eq_str.indexOf(")", start_bracket);
            var inner_eq_string = eq_str.substring((start_bracket + 1),
                end_bracket);
            if (inner_eq_string.indexOf('<') > -1) {
                // math functions exist
                if (inner_eq_string.indexOf('pi<>') > -1) {
                    // PI exist
                    var start_bracket = inner_eq_string.indexOf("pi<>");
                    var end_bracket = inner_eq_string.indexOf(">",
                        start_bracket);
                    var inner_eq_string = inner_eq_string.substring(
                        start_bracket, end_bracket + 1);
                    var main_result = calculate_math_functions(inner_eq_string);
                    var result = main_result[0];
                    var block_str = main_result[1];
                } else {
                    // PI not exist
                    var op_found = isOperatorExist(inner_eq_string);
                    if (op_found == 0) {
                        // operator not exist
                        // var start_bracket = inner_eq_string.indexOf("<");
                        // var end_bracket = inner_eq_string.indexOf(">",
                        // start_bracket);
                        // var block_str =
                        // inner_eq_string.substring((start_bracket
                        // + 1), end_bracket);
                        var main_result = calculate_math_functions(inner_eq_string);
                        var result = main_result[0];
                        var block_str = main_result[1];
                    } else {
                        // operator exist
                        var start_bracket = inner_eq_string.indexOf("<");
                        var end_bracket = inner_eq_string.indexOf(">",
                            start_bracket);
                        var block_str = inner_eq_string.substring(
                            (start_bracket + 1), end_bracket);
                        var result = check_and_calculate_equation(inner_eq_string);
                    }
                }
            } else {
                // math function not exist
                var op_found = isOperatorExist(inner_eq_string);
                if (op_found == 0) {
                    // operator not exist AND single value in bracket
                    var block_str = eq_str.substring(start_bracket,
                        (end_bracket + 1));
                    var result = eq_str.substring((start_bracket + 1),
                        (end_bracket));
                } else {
                    // operator exist
                    var block_str = eq_str.substring(start_bracket,
                        (end_bracket + 1));
                    var result = check_and_calculate_equation(inner_eq_string);
                }
            }
        } else {
            // brackets not available
            if (eq_str.indexOf('<') > -1) {
                if (eq_str.indexOf('pi<>') > -1) {
                    // PI exist
                    var start_bracket = eq_str.indexOf("pi<>");
                    var end_bracket = eq_str.indexOf(">", start_bracket);
                    var inner_eq_string = eq_str.substring(start_bracket,
                        end_bracket);
                    var main_result = calculate_math_functions(inner_eq_string);
                    var result = main_result[0];
                    var block_str = main_result[1];
                } else {
                    // PI not exist
                    var op_found = isOperatorExist(eq_str);
                    if (op_found == 0) {
                        // operator not exist
                        var main_result = calculate_math_functions(eq_str);
                        var result = main_result[0];
                        var block_str = main_result[1];
                    } else {
                        // operator exist
                        var start_bracket = eq_str.indexOf("<");
                        var end_bracket = eq_str.indexOf(">", start_bracket);
                        var inner_eq_string = eq_str.substring(
                            (start_bracket + 1), end_bracket);
                        var block_str = inner_eq_string;
                        var result = check_and_calculate_equation(inner_eq_string);
                    }
                }
            } else {
                // math functions not exist
                var result = check_and_calculate_equation(eq_str);
                var start_bracket = 0;
                var block_str = eq_str.substring(start_bracket, end_bracket_outer);
            }
        }
        if (result === "" || result == null || result == undefined) {                       //numeric 0 is considerd as blank string in comparision
            if (press_calc_Array.length > 0) {
                press_calc_Array.splice(0, 1);
                call_calc_click(press_calc_Array);
            } else {
                loading_hide();
            }
        }
        else {
            eq_str = eq_str.replace(block_str, result);
            check_for_pending_calculation(temp_calc_counter, eq_str, result);
        }
    } catch (e) {
        alert1(e + '_calculate_equation_with_bracket()');
        loading_hide();
    }
}

function calculate_math_functions(input_str) {
    try {
        if (input_str.indexOf('log<') > -1) {
            // log10 available
            var start_bracket = input_str.indexOf("log<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var log_number = block_str.substring((start_bracket + 4),
                end_bracket);
            log_number = parseFloat(log_number);
            var result = Math.log(log_number);
        } else if (input_str.indexOf('log2<') > -1) {
            // log10 available
            var start_bracket = input_str.indexOf("log2<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var log_number = block_str.substring((start_bracket + 5),
                end_bracket);
            log_number = parseFloat(log_number);
            var result = Math.log2(log_number);
        } else if (input_str.indexOf('log10<') > -1) {
            // log10 available
            var start_bracket = input_str.indexOf("log10<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var log_number = block_str.substring((start_bracket + 6),
                end_bracket);
            log_number = parseFloat(log_number);
            var result = Math.log10(log_number);
        } else if (input_str.indexOf('int<') > -1) {
            // log10 available
            var start_bracket = input_str.indexOf("int<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var log_number = block_str.substring((start_bracket + 4),
                end_bracket);
            var result = parseInt(log_number);
        } else if (input_str.indexOf('asin<') > -1) {
            // asin (Returns the arcsine of x, in radians) available
            var start_bracket = input_str.indexOf("asin<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var log_number = block_str.substring((start_bracket + 5),
                end_bracket);
            log_number = parseFloat(log_number);
            var result = Math.asin(log_number);
        } else if (input_str.indexOf('sin<') > -1) {
            // sin available
            var start_bracket = input_str.indexOf("sin<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var log_number = block_str.substring((start_bracket + 4),
                end_bracket);
            log_number = parseFloat(log_number);
            var result = Math.sin(log_number);
        } else if (input_str.indexOf('acos<') > -1) {
            // acos (Returns the arccosine of x, in radians) available
            var start_bracket = input_str.indexOf("acos<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var log_number = block_str.substring((start_bracket + 5),
                end_bracket);
            log_number = parseFloat(log_number);
            var result = Math.acos(log_number);
        } else if (input_str.indexOf('cos<') > -1) {
            // cos available
            var start_bracket = input_str.indexOf("cos<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var log_number = block_str.substring((start_bracket + 4),
                end_bracket);
            log_number = parseFloat(log_number);
            var result = Math.cos(log_number);
        } else if (input_str.indexOf('atan2<') > -1) {
            // atan2 (Returns the arctangent of the quotient of its arguments)
            // available
            var start_bracket = input_str.indexOf("atan2<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var comma_char = block_str.indexOf(",", start_bracket);
            var x = block_str.substring((start_bracket + 6), comma_char);
            var y = block_str.substring((comma_char + 1),
                (block_str.length - 1));
            x = parseFloat(x);
            y = parseFloat(y);
            var result = Math.atan2(x, y);
        } else if (input_str.indexOf('atan<') > -1) {
            // atan (Returns the arctangent of x as a numeric value between
            // -PI/2
            // and PI/2 radians) available
            var start_bracket = input_str.indexOf("atan<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var log_number = block_str.substring((start_bracket + 5),
                end_bracket);
            log_number = parseFloat(log_number);
            var result = Math.atan(log_number);
        } else if (input_str.indexOf('tan<') > -1) {
            // tan(tangent) available
            var start_bracket = input_str.indexOf("tan<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var log_number = block_str.substring((start_bracket + 4),
                end_bracket);
            log_number = parseFloat(log_number);
            var result = Math.tan(log_number);
        } else if (input_str.indexOf('abs<') > -1) {
            // abs(absolute) available
            var start_bracket = input_str.indexOf("abs<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var log_number = block_str.substring((start_bracket + 4),
                end_bracket);
            log_number = parseFloat(log_number);
            var result = Math.abs(log_number);
        } else if (input_str.indexOf('exp<') > -1) {
            // exp (E(x) where x=log_number) available
            var start_bracket = input_str.indexOf("exp<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var log_number = block_str.substring((start_bracket + 4),
                end_bracket);
            log_number = parseFloat(log_number);
            var result = Math.exp(log_number);
        } else if (input_str.indexOf('min<') > -1) {
            // min (minimum) available
            var start_bracket = input_str.indexOf("min<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var array_str = block_str.substring((start_bracket + 4),
                end_bracket);
            var array = array_str.split(",");
            for (var i = 0; i < array.length; i++) {
                array[i] = parseFloat(array[i]);
            }
            array.sort(function (a, b) {
                return a - b
            });
            var result = array[0];
        } else if (input_str.indexOf('max<') > -1) {
            // max (maximum) available
            var start_bracket = input_str.indexOf("max<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var array_str = block_str.substring((start_bracket + 4),
                end_bracket);
            var array = array_str.split(",");
            for (var i = 0; i < array.length; i++) {
                array[i] = parseFloat(array[i]);
            }
            array.sort(function (a, b) {
                return a - b
            });
            var result = array[array.length - 1];
        } else if (input_str.indexOf('pow<') > -1) {
            // power available
            var start_bracket = input_str.indexOf("pow<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var comma_char = block_str.indexOf(",", start_bracket);
            var x = block_str.substring((start_bracket + 4), comma_char);
            var y = block_str.substring((comma_char + 1),
                (block_str.length - 1));
            x = parseFloat(x);
            y = parseFloat(y);
            var result = Math.pow(x, y);
        } else if (input_str.indexOf('sqrt<') > -1) {
            // sqrt (Square Root) available
            var start_bracket = input_str.indexOf("sqrt<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var log_number = block_str.substring((start_bracket + 5),
                end_bracket);
            log_number = parseFloat(log_number);
            var result = Math.sqrt(log_number);
        } else if (input_str.indexOf('sumsq<') > -1) {
            // sumsq (Sum Square) available
            var start_bracket = input_str.indexOf("sumsq<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var array_str = block_str.substring((start_bracket + 6),
                end_bracket);
            var array = array_str.split(",");
            for (var i = 0; i < array.length; i++) {
                array[i] = parseFloat(array[i]);
            }
            var total = 0;
            for (s = 0; s < array.length; s++) {
                total += array[s] * array[s];
            }
            var result = total;
        } else if (input_str.indexOf('round<') > -1) {
            // round (Rounds x to the nearest integer) available
            var start_bracket = input_str.indexOf("round<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var log_number = block_str.substring((start_bracket + 6),
                end_bracket);
            log_number = parseFloat(log_number);
            var result = Math.round(log_number);
        } else if (input_str.indexOf('floor<') > -1) {
            // floor (Returns x, rounded downwards to the nearest integer)
            // available
            var start_bracket = input_str.indexOf("floor<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var log_number = block_str.substring((start_bracket + 6),
                end_bracket);
            log_number = parseFloat(log_number);
            var result = Math.floor(log_number);
        } else if (input_str.indexOf('ceil<') > -1) {
            // ceil (Returns x, rounded upwards to the nearest integer)
            // available
            var start_bracket = input_str.indexOf("ceil<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var log_number = block_str.substring((start_bracket + 5),
                end_bracket);
            log_number = parseFloat(log_number);
            var result = Math.ceil(log_number);
        } else if (input_str.indexOf('pi<>') > -1) {
            // PI (PI) available
            var start_bracket = input_str.indexOf("pi<>");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var result = Math.PI;
        } else if (input_str.indexOf('dist<') > -1) {
            // dist (distance between two latlong) available
            var start_bracket = input_str.indexOf("dist<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var array_str = block_str.substring((start_bracket + 5),
                end_bracket);
            var array = array_str.split(",");
            for (var i = 0; i < array.length; i++) {
                array[i] = parseFloat(array[i]);
            }
            var lat1 = array[0];
            var lon1 = array[1];
            var lat2 = array[2];
            var lon2 = array[3];
            var result = getDistanceFromLatLonInMeter(lat1, lon1, lat2, lon2);
        } else if (input_str.indexOf('azim<') > -1) {
            // azim (Azimuth) available
            var start_bracket = input_str.indexOf("azim<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var array_str = block_str.substring((start_bracket + 5),
                end_bracket);
            var array = array_str.split(",");
            for (var i = 0; i < array.length; i++) {
                array[i] = parseFloat(array[i]);
            }
            var lat1 = array[0];
            var lon1 = array[1];
            var lat2 = array[2];
            var lon2 = array[3];
            var result = Calculate_Azimuth(lat1, lon1, lat2, lon2);
        } else if (input_str.indexOf('alt<') > -1) {
            // azim (Azimuth) available
            var start_bracket = input_str.indexOf("alt<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var array_str = block_str.substring((start_bracket + 4),
                end_bracket);
            var array = array_str.split(",");
            for (var i = 0; i < array.length; i++) {
                array[i] = parseFloat(array[i]);
            }
            var lat1 = array[0];
            var lon1 = array[1];
            var lat2 = array[2];
            var lon2 = array[3];
            var result = Calculate_Altitude(lat1, lon1, lat2, lon2);
        } else if (input_str.indexOf('fix<') > -1) {
            // fix (decimal point) available
            var start_bracket = input_str.indexOf("fix<");
            var end_bracket = input_str.indexOf(">", start_bracket);
            var block_str = input_str.substring(start_bracket,
                (end_bracket + 1));
            var array_str = block_str.substring((start_bracket + 4),
                end_bracket);
            var array = array_str.split(",");
            var log_number = array[0];
            var dec_point = parseInt(array[1]);
            var result = parseFloat(log_number).toFixed(dec_point);
        }

        // /////////

        var main_result = [result, block_str];
        return main_result;
    } catch (e) {
        alert1(e + '_calculate_math_functions()');
        loading_hide();
    }
}

// check if more calculation is pending or not
function check_for_pending_calculation(temp_calc_counter, eq_str, result) {
    try {
        // check for any operator exist or not
        var math_found = 0;
        var bracket_found = 0;
        if (eq_str.indexOf('(') > -1) {
            math_found = 1;
        }
        if (eq_str.indexOf('<') > -1) {
            bracket_found = 1;
        }
        var op_found = isOperatorExist(eq_str);
        if (op_found == 0 && math_found == 0 && bracket_found == 0) {
            // operator/math/bracket not exist
            // alert1("final answer: " + result);

            if (ans_type == 'date') {
                let temp_result = result / (1000 * 60 * 60 * 24);
                if (temp_result < 1) {
                    // result is < 1 day so convert it to the hours instead of days - mk - 18062025
                    result = result / (1000 * 60 * 60);
                }
                else if (temp_result > 365) {
                    // result is > 1 year so convert it to the years instead of days - mk - 22122025
                    result = temp_result / 365;
                    result = Math.floor(result);
                }
                else {
                    result = temp_result;
                }
            }

            if (result === "" || result == null || result == undefined || result == "NaN") { }                  //added === for calc ans 0 comaparison in urbanJungle [22102021]
            else {

                if (act_eq_str.indexOf('fix<') > -1) {
                    // decimal point defined in equation string

                    if (ans_type == 'date') {
                        // apply fix logic on result in case of date control calculation 09122021

                        var start_bracket = act_eq_str.indexOf(",");
                        var end_bracket = act_eq_str.indexOf(">", start_bracket);
                        var block_str = act_eq_str.substring(start_bracket + 1, end_bracket);
                        var dec_point = parseInt(block_str);
                         if (isNaN(dec_point)) {
                            dec_point = 2;
                        }
                        var result = parseFloat(result).toFixed(dec_point);
                        result = parseFloat(result);
                    }
                }
                else {
                    result = parseFloat(result);

                    if (ans_type != 'date') {
                        // static 2 decimal point
                        result = result.toFixed(2);
                    }
                }

                $("#txt_Calc_" + temp_calc_counter + "").val(result);

                $("#txt_Calc_" + temp_calc_counter + "").addClass('mk_vibrate');
                setTimeout(function () {
                    $("#txt_Calc_" + temp_calc_counter + "").removeClass('mk_vibrate');
                }, 500);
            }

            // fire event for filling end calendar - atctesting (09122020)
            var event = $("#txt_Calc_" + temp_calc_counter + "").attr("oninput");
            if (event == "" || event == null || event == undefined) { }
            else {
                $("#txt_Calc_" + temp_calc_counter + "").attr("ondrag", event);
                $("#txt_Calc_" + temp_calc_counter + "").trigger("ondrag");
            }

            if (std_rng_equation == '' || std_rng_equation == null || std_rng_equation == undefined) {
                if (press_calc_Array.length > 0) {
                    press_calc_Array.splice(0, 1);
                    call_calc_click(press_calc_Array);
                } else {
                    loading_hide();
                }
            } else {
                Set_Answer_of_type17_in_other(result);
            }
        } else {
            // operator exist
            calculate_equation_with_bracket(temp_calc_counter, eq_str);
        }
    } catch (e) {
        alert1(e + '_check_for_pending_calculation()');
        loading_hide();
    }
}

// calcualte eqautions
function check_and_calculate_equation(input_str) {
    try {
        if (input_str.indexOf('<') > -1) {
            // < available = int<0.940529999999999*60>
            input_str = remove_math_function_name_from_input_str(input_str);
        }

        var dollar_found = 0;
        var dollar_str = '';
        if (input_str.indexOf('$$$') > -1) {
            // '$$$' value exist (when other checklist required step data not exist)

            dollar_found = 1;
            dollar_str = input_str;
            input_str = input_str.split("$$$+$$$").join("0+0");
            input_str = input_str.split("$$$-$$$").join("0-0");
            input_str = input_str.split("$$$*$$$").join("1*1");
            input_str = input_str.split("$$$/$$$").join("1/1");
            input_str = input_str.split("$$$%$$$").join("1%1");

            input_str = input_str.split("$$$ + $$$").join("0 + 0");
            input_str = input_str.split("$$$ - $$$").join("0 - 0");
            input_str = input_str.split("$$$ * $$$").join("1 * 1");
            input_str = input_str.split("$$$ / $$$").join("1 / 1");
            input_str = input_str.split("$$$ % $$$").join("1 % 1");

            if (input_str.indexOf('$$$') > -1) {
                var op_index = input_str.indexOf("$$$");
                var op = input_str[op_index - 1];
                if (op == '+' || op == '-') {
                    input_str = input_str.split("$$$").join("0");
                }
                else {
                    input_str = input_str.split("$$$").join("1");
                }
            }
        }

        var result = 0;
        var first_no = '';
        var op = '';
        var second_no = '';
        var blank_found = 0;

        for (i = 0; i < input_str.length; i++) {
            var t_char = input_str[i];

            if (t_char == " ") {
                blank_found++;
                break;
            }
        }

        if (blank_found == 0) {
            for (i = 0; i < input_str.length; i++) {
                var t_char = input_str[i];

                if (t_char == " ") {
                    blank_found++;
                    break;
                }

                var char_check = isCharDigit(t_char);
                if (char_check == true || t_char == '.') {
                    if (op == '') {
                        first_no = first_no + t_char;
                    } else {
                        second_no = second_no + t_char;
                    }
                } else {
                    if (op == '') {
                        if (input_str.indexOf('*') > -1) {
                            // precedence calculation exist
                            if (t_char == '*' || op == '*' || t_char == '/'
                                || op == '/' || t_char == '%' || op == '%') {
                                op = t_char;
                            } else {
                                first_no = '';
                                op = '';
                                second_no = '';
                            }
                        } else {
                            // precedence calculation not exist
                            op = t_char;
                        }
                    } else {
                        // we have two numbers and a operator already
                        break;
                    }
                }
            }
        }

        if (blank_found == 0) {

            end_bracket_outer = end_bracket_outer + i;

            if (second_no == '') {
                op = '+';
                second_no = '0';
            }

            first_no = parseFloat(first_no).toFixed(2);
            second_no = parseFloat(second_no).toFixed(2);

            result = calculate_two_numbers(first_no, op, second_no);

            temp_result = result;

            var temp_str = "" + first_no + "" + op + "" + second_no + "";
            var temp_str_new = input_str.replace(temp_str, result);

            //try {
            //    var ddl_filled_check = temp_str_new.includes('--- Select ---');
            //}
            //catch (e) {
            if (temp_str_new.indexOf("--- Select ---") > -1 || temp_str_new.indexOf("--- Choose Value ---") > -1 || temp_str_new.indexOf("Select Value") > -1) {
                var ddl_filled_check = true;
            }
            else {
                var ddl_filled_check = false;
            }
            //}

            if (ddl_filled_check == true) {
                alert1("Please select value in dropdown!");
                temp_result = "";
            }
            else {
                var op_found = isOperatorExist(temp_str_new);
                if (op_found > 0) {
                    // operator exist (when multi operator exist)
                    end_bracket_outer = input_str.length;
                    eval("var result_new = " + temp_str_new);
                    temp_str_new = input_str.replace(input_str, result_new);
                    temp_result = temp_str_new;
                    // check_and_calculate_equation(temp_str_new);
                }

                if (dollar_found == 1) {
                    end_bracket_outer = dollar_str.length;
                }
            }
            return temp_result;
        }
        else {
            return "";
        }
    } catch (e) {
        alert1(e + '_check_and_calculate_equation()');
        loading_hide();
    }
}

// check given character is numeric or not
function isCharDigit(n) {
    return n > -1;
}

// check for any operator exist or not
function isOperatorExist(eq_str) {
    try {
        var op_found = 0;
        var index = 0;
        for (i = 0; i < eq_str.length; i++) {
            var t_char = eq_str[i];
            if (t_char == '+' || t_char == '-' || t_char == '*' || t_char == '/' || t_char == '%') {

                // 02062020 handle negative value for mathematical equation (round<-29.4342345>)
                if (i > 0 && t_char == '-') {
                    var prev_char = eq_str[i - 1];
                    if (prev_char == '<') { }
                    else {
                        op_found++;
                    }
                }
                else {
                    op_found++;
                }
                index = i;
            }
        }
        if (index == 0) {
            return 0;
        } else {
            return op_found;
        }
    } catch (e) {
        alert1(e + '_isOperatorExist()');
        loading_hide();
    }
}

// remove math funcions name from string
function remove_math_function_name_from_input_str(input_str) {
    try {
        if (input_str.indexOf('int<') > -1) {
            input_str = input_str.replace('int<', '');
        }
        if (input_str.indexOf('sin<') > -1) {
            input_str = input_str.replace('sin<', '');
        }
        if (input_str.indexOf('cos<') > -1) {
            input_str = input_str.replace('cos<', '');
        }
        if (input_str.indexOf('>') > -1) {
            input_str = input_str.replace('>', '');
        }
        return input_str;
    } catch (e) {
        alert1(e + '_remove_math_function_name_from_input_str()');
        loading_hide();
    }
}

// /------------ calculating distance start ----------/////////
// Get distance between two point in Meters
function getDistanceFromLatLonInMeter(lat1, lon1, lat2, lon2) {
    try {
        var R = 6371000; // Radius of the earth in meters
        var dLat = deg2rad(lat2 - lat1); // deg2rad below
        var dLon = deg2rad(lon2 - lon1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in meters
        return d;
    } catch (e) {
        alert1(e + '_getDistanceFromLatLonInMeter()');
        loading_hide();
    }
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
// /------------ calculating distance end ----------/////////

// ///////--------- calculating azimuth start--------------------/////////////
function Calculate_Azimuth(lat1, lon1, lat2, lon2) {
    try {
        var elv = 0;
        var a = {
            'lat': lat1,
            'lon': lon1,
            'elv': elv
        };
        var b = {
            'lat': lat2,
            'lon': lon2,
            'elv': elv
        };
        var oblate = true;
        var ap = LocationToPoint(a, oblate);
        var bp = LocationToPoint(b, oblate);
        var br = RotateGlobe(b, a, bp.radius, ap.radius);
        if (br.z * br.z + br.y * br.y > 1.0e-6) {
            var theta = Math.atan2(br.z, br.y) * 180.0 / Math.PI;
            var azimuth = 90.0 - theta;
            if (azimuth < 0.0) {
                azimuth += 360.0;
            }
            if (azimuth > 360.0) {
                azimuth -= 360.0;
            }
            azimuth = azimuth.toFixed(4);
            return azimuth;
        } else {
            return 0;
        }
    } catch (e) {
        alert1(e + '_Calculate_Azimuth()');
        loading_hide();
    }
}

function EarthRadiusInMeters(latitudeRadians) // latitude is geodetic, i.e.
// that reported by GPS
{
    try {
        var a = 6378137.0; // equatorial radius in meters
        var b = 6356752.3; // polar radius in meters
        var cos = Math.cos(latitudeRadians);
        var sin = Math.sin(latitudeRadians);
        var t1 = a * a * cos;
        var t2 = b * b * sin;
        var t3 = a * cos;
        var t4 = b * sin;
        return Math.sqrt((t1 * t1 + t2 * t2) / (t3 * t3 + t4 * t4));
    } catch (e) {
        alert1(e + '_EarthRadiusInMeters()');
        loading_hide();
    }
}

function GeocentricLatitude(lat) {
    try {
        var e2 = 0.00669437999014;
        var clat = Math.atan((1.0 - e2) * Math.tan(lat));
        return clat;
    } catch (e) {
        alert1(e + '_GeocentricLatitude()');
        loading_hide();
    }
}

function LocationToPoint(c, oblate) {
    try {
        // Convert (lat, lon, elv) to (x, y, z).
        var lat = c.lat * Math.PI / 180.0;
        var lon = c.lon * Math.PI / 180.0;
        var radius = oblate ? EarthRadiusInMeters(lat) : 6371009;
        var clat = oblate ? GeocentricLatitude(lat) : lat;

        var cosLon = Math.cos(lon);
        var sinLon = Math.sin(lon);
        var cosLat = Math.cos(clat);
        var sinLat = Math.sin(clat);
        var x = radius * cosLon * cosLat;
        var y = radius * sinLon * cosLat;
        var z = radius * sinLat;

        var cosGlat = Math.cos(lat);
        var sinGlat = Math.sin(lat);

        var nx = cosGlat * cosLon;
        var ny = cosGlat * sinLon;
        var nz = sinGlat;

        x += c.elv * nx;
        y += c.elv * ny;
        z += c.elv * nz;

        return {
            'x': x,
            'y': y,
            'z': z,
            'radius': radius,
            'nx': nx,
            'ny': ny,
            'nz': nz
        };
    } catch (e) {
        alert1(e + '_LocationToPoint()');
        loading_hide();
    }
}

function RotateGlobe(b, a, bradius, aradius, oblate) {
    try {
        // Get modified coordinates of 'b' by rotating the globe so that 'a' is
        // at
        // lat=0, lon=0.
        var br = {
            'lat': b.lat,
            'lon': (b.lon - a.lon),
            'elv': b.elv
        };
        var brp = LocationToPoint(br, oblate);

        var alat = -a.lat * Math.PI / 180.0;
        if (oblate) {
            alat = GeocentricLatitude(alat);
        }
        var acos = Math.cos(alat);
        var asin = Math.sin(alat);

        var bx = (brp.x * acos) - (brp.z * asin);
        var by = brp.y;
        var bz = (brp.x * asin) + (brp.z * acos);

        return {
            'x': bx,
            'y': by,
            'z': bz,
            'radius': bradius
        };
    } catch (e) {
        alert1(e + '_RotateGlobe()');
        loading_hide();
    }
}

// ///////--------- calculating azimuth end --------------------/////////////

// ///////--------- calculating altitude start --------------------/////////////

function Calculate_Altitude(lat1, lon1, lat2, lon2) {
    try {
        var elv = 0;
        var a = {
            'lat': lat1,
            'lon': lon1,
            'elv': elv
        };
        var b = {
            'lat': lat2,
            'lon': lon2,
            'elv': elv
        };
        var oblate = true;
        var ap = LocationToPoint(a, oblate);
        var bp = LocationToPoint(b, oblate);

        var bma = NormalizeVectorDiff(bp, ap);
        if (bma != null) {
            var altitude = 90.0 - (180.0 / Math.PI)
                * Math.acos(bma.x * ap.nx + bma.y * ap.ny + bma.z * ap.nz);
            altitude = altitude.toFixed(4);
            return altitude;
        } else {
            return 0;
        }
    } catch (e) {
        alert1(e + '_Calculate_Altitude()');
        loading_hide();
    }
}

function NormalizeVectorDiff(b, a) {
    try {
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var dz = b.z - a.z;
        var dist2 = dx * dx + dy * dy + dz * dz;
        if (dist2 == 0) {
            return null;
        }
        var dist = Math.sqrt(dist2);
        return {
            'x': (dx / dist),
            'y': (dy / dist),
            'z': (dz / dist),
            'radius': 1.0
        };
    } catch (e) {
        alert1(e + '_NormalizeVectorDiff()');
        loading_hide();
    }
}

// ///////--------- calculating altitude end --------------------/////////////

// ------- take value from other step start ---------------//////////
// get targeted step data from native
function get_last_step_data_type17_eq(temp_calc_counter, eq_str) {
    try {
        var start_bracket = eq_str.indexOf("[");
        var end_bracket = eq_str.indexOf("]", start_bracket);
        var inner_json_string = eq_str
            .substring(start_bracket, end_bracket + 1);
        var inner_array_str = inner_json_string.substring(1,
            inner_json_string.length - 1);

        var calc_type4_data = inner_array_str.split(',');
        for (i = 0; i < calc_type4_data.length; i++) {
            calc_type4_data[i] = parseInt(calc_type4_data[i]);
        }

        var checksheet_type = calc_type4_data[0]; // checksheet_type = 0,3,5
        var check_type = calc_type4_data[1]; // check_type = checksheet_id
        var step = calc_type4_data[2];
        var type17_que_id = calc_type4_data[3];

        storage.setItem('type17_calc_counter', JSON.stringify(temp_calc_counter));
        storage.setItem('type17_checksheet_type', JSON.stringify(checksheet_type));
        storage.setItem('type17_que_id', JSON.stringify(type17_que_id));
        storage.setItem('type17_eq_str', JSON.stringify(eq_str));
        storage.setItem('type17_block_str', JSON.stringify(inner_json_string));
        var t_id = JSON.parse(storage.getItem('tid'));

        var query = "select f_data from f_master where tid = '" + t_id + "' and c_id = '" + check_type + "' and step = '" + step + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "0"
        });
        cordova.exec(onsuccess_get_last_step_data_type17_eq, onfail_get_last_step_data_type17_eq, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_last_step_data_type17_eq()');
        loading_hide();
    }
}

// onsuccess get last step data
function onsuccess_get_last_step_data_type17_eq(e) {
    try {
        var myArray = JSON.parse(e);
        var data = myArray[0].data;
        data = itemObj._checkStrObj(data);  		// check_item

        //var checksheet_type = JSON.parse(storage.getItem('type17_checksheet_type'));
        //if (checksheet_type == 3 || checksheet_type == 5) {
        //    data = itemObj._checkStrObj(data);  		// check_item
        //}

        var type17_que_id = JSON.parse(storage.getItem('type17_que_id'));
        for (i = 0; i < data.length; i++) {
            var que_id = data[i].que_id;
            if (que_id == type17_que_id) {
                var type = data[i].type;
                if (type == '8') {
                    var cal_ans = data[i].ans[0];
                    var cal_date = new Date(cal_ans);
                    if (cal_date == "Invalid Date") {
                        cal_ans = "2025/06/18 " + cal_ans;
                        cal_date = new Date(cal_ans);
                        var answer = cal_date.getTime();
                    }
                    else {
                        var answer = cal_date.getTime();
                    }
                }
                else {
                    var answer = data[i].ans[0];
                }

                if (answer === '' || answer == null || answer == undefined) {
                    answer = " ";
                }
                else {
                    var is_string = typeof answer;
                    if (is_string != "string") {                //changes for urbanJungle [18082021]
                        answer = answer.toString();
                    }
                    answer = answer.replace(/^0+/, '');
                    answer = parseFloat(answer);
                }
                break;
            }
        }

        var temp_calc_counter = JSON.parse(storage.getItem('type17_calc_counter'));
        var eq_str = JSON.parse(storage.getItem('type17_eq_str'));
        var block_str = JSON.parse(storage.getItem('type17_block_str'));
        eq_str = eq_str.replace(block_str, answer);
        check_for_other_step_values(temp_calc_counter, eq_str);
    } catch (e) {
        alert1(e + '_onsuccess_get_last_step_data_type17_eq()');
        loading_hide();
    }
}

// onfail get last step data
function onfail_get_last_step_data_type17_eq(e) {
    // alert1(e + '_onfail_get_last_step_data_type17_eq()');
    var temp_calc_counter = JSON.parse(storage.getItem('type17_calc_counter'));
    var eq_str = JSON.parse(storage.getItem('type17_eq_str'));
    var answer = check_for_multiple_checksheet_calculation(eq_str);
    if (answer == '$$$') {
        var block_str = JSON.parse(storage.getItem('type17_block_str'));
        eq_str = eq_str.replace(block_str, '$$$$$');    // $$$$$ will replaced with $$$
        check_for_other_step_values(temp_calc_counter, eq_str);
    }
    else {
        alert1("Required step data is not available !");
        loading_hide();
    }
}

function check_for_multiple_checksheet_calculation(eq_str) {
    try {
        var req_step_count = eq_str.split('[').length - 1;
        var start_c = 0;
        var checksheet_id = 0;
        var other_chk_found = 0;
        for (s = 0; s < req_step_count; s++) {
            var start_bracket = eq_str.indexOf("[", start_c);
            var end_bracket = eq_str.indexOf("]", start_bracket);
            start_c = end_bracket + 1;
            var inner_json_string = eq_str.substring(start_bracket, end_bracket + 1);
            var inner_array_str = inner_json_string.substring(1, inner_json_string.length - 1);

            var calc_type4_data = inner_array_str.split(',');
            for (i = 0; i < calc_type4_data.length; i++) {
                calc_type4_data[i] = parseInt(calc_type4_data[i]);
            }

            var check_type = calc_type4_data[1]; // check_type = checksheet_id
            if (checksheet_id == 0) {
                checksheet_id = check_type;
            }

            if (check_type != checksheet_id) {
                other_chk_found = 1;
                break;
            }
        }
        if (other_chk_found == 0) {
            // single checksheet exist
            return '$$$';
        }
        else {
            //multiple checksheet exist
            return 'multistep';
        }
    } catch (e) {
        alert1(e + '_check_for_multiple_checksheet_calculation()');
        loading_hide();
    }
}
// ------- take value from other step end ---------------//////////

// ////////----------New eqution calculator end ------------------/////////////

// ------------(Forward Reference) ----- fill data in f_master or other class
// --------//

var std_rng_equation;
var result_store;
var lat_long_json = [];

function Set_Answer_of_type17_in_other(result_display) {
    try {
        result_store = result_display;
        var range_json = itemObj._checkStrObj(std_rng_equation);  		// check_item
        var range1_json_target = range_json[0].target;
        var range1_json_range = range_json[0].range;
        for (var aqu_r = 0; aqu_r < range1_json_range.length; aqu_r++) {
            var json_p = itemObj._checkStrObj(range1_json_range[aqu_r]);  		// check_item
            var equ_start = json_p["start"];
            var equ_end = json_p["end"];
            var equ_text = '';

            equ_start = parseInt(equ_start);
            equ_end = parseInt(equ_end);

            if (result_display >= equ_start && result_display <= equ_end) {
                equ_text = json_p["text"];
                break;
            }
        }

        if (range1_json_target.length == 1) {
            var str_class = range1_json_target[0];
            //var str_class_temp = str_class.substring(1, str_class.length - 1);
            var str_class_temp = str_class;
            var type17_class_id = $("." + str_class_temp + "").attr("id");
            var type17_type_id = $("#" + type17_class_id + " :input").attr("id");
            var type17_class_chk_type = $("#" + type17_class_id + " :input").attr('type');

            $("." + str_class_temp + "").show();
            if (type17_class_chk_type == "radio") {
                var radio_test_name = $("#" + type17_class_id + " :input").attr('name');
                var radio_group = document.getElementsByName(radio_test_name);

                for (var r_g_type17 = 0; r_g_type17 < radio_group.length; r_g_type17++) {
                    var type17_radio_value = radio_group[r_g_type17].value;
                    if (type17_radio_value == equ_text) {
                        radio_group[r_g_type17].checked = true;
                    } else {
                        radio_group[r_g_type17].checked = false;
                    }
                }
            } else {
                //if (equ_text == '' || equ_text == undefined || equ_text == null) {
                //    $("#" + type17_type_id + "").val('');
                //} else {
                //    $("#" + type17_type_id + "").val(equ_text);
                //}


                // for "Flint" project logic
                if (equ_text == '' || equ_text == undefined || equ_text == null) { } else {
                    var curr_filled_value = $("#" + type17_type_id + "").val();
                    if (curr_filled_value == "RED" && (equ_text == "Amber" || equ_text == "Green")) { }
                    else if (curr_filled_value == "Amber" && equ_text == "Green") { }
                    else {
                        $("#" + type17_type_id + "").val(equ_text);
                    }
                }
                $("." + str_class_temp + "").show();
                ////

            }

            if (press_calc_Array.length > 0) {
                press_calc_Array.splice(0, 1);
                call_calc_click(press_calc_Array);
            } else {
                loading_hide();
            }
        } else {
            var calc_checksheet_type = range1_json_target[0];
            var calc_checksheet_id = range1_json_target[1];
            var calc_checksheet_step = range1_json_target[2];
            var t_id = JSON.parse(storage.getItem('tid'));

            var query = "select f_data from f_master where c_id = '" + calc_checksheet_id + "' and c_type = '" + calc_checksheet_type + "'  and tid = '" + t_id + "' and step = '" + calc_checksheet_step + "'";
            // alert1(query);
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "0"
            });
            cordova.exec(Onsuccess_of_f_master_get_f_data_type17, Onfail_of_f_master_get_f_data_type17, 'SqlitePlugin', 'showValues', q_jsonobj);
        }
        loading_hide();
    } catch (e) {
        alert1(e + "_Set_Answer_of_type17_in_other");
    }

}

function Onsuccess_of_f_master_get_f_data_type17(e) {
    try {
        loading_hide();
        var checksheet_table = JSON.parse(e);
        if (checksheet_table.length > 0) {
            var range_json = itemObj._checkStrObj(std_rng_equation);  		// check_item
            var range1_json_target = range_json[0].target;
            var range1_json_range = range_json[0].range;

            for (var aqu_r = 0; aqu_r < range1_json_range.length; aqu_r++) {
                var json_p = itemObj._checkStrObj(range1_json_range[aqu_r]);  		// check_item
                var equ_start = json_p["start"];
                var equ_end = json_p["end"];
                var equ_text = '';

                if (result_store >= equ_start && result_store <= equ_end) {
                    equ_text = json_p["text"];
                    break;
                }
            }

            var calc_checksheet_type = range1_json_target[0];
            var calc_checksheet_id = range1_json_target[1];
            var calc_checksheet_step = range1_json_target[2];
            var calc_checksheet_qid = range1_json_target[3];
            var t_id = JSON.parse(storage.getItem('tid'));

            var up_json_f_data = checksheet_table[0].data;
            for (var k = 0; k < up_json_f_data.length; k++) {
                if (up_json_f_data[k].que_id == calc_checksheet_qid) {
                    up_json_f_data[k].ans[0] = equ_text;
                }
            }
            checksheet_table[0].data = up_json_f_data;
            checksheet_table = JSON.stringify(checksheet_table);
            var date_s = new Date();
            var time = date_s.getTime();
            var query = "UPDATE f_master SET millisecond='" + time + "', f_data = '" + checksheet_table + "' where tid = '" + t_id + "' and c_id = '" + calc_checksheet_id + "' and step = '" + calc_checksheet_step + "'";
            // alert1(query)
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                q: "0",
                tid: t_id
            });
            cordova.exec(Onsuccess_update_FM_f_data_type17, Onfail_update_FM_f_data_type17, 'SqlitePlugin', 'insertValuse', q_jsonobj);
        }
    } catch (e) {
        alert1(e + "_Onsuccess_of_f_master_get_f_data_type17")
    }
}

function Onfail_of_f_master_get_f_data_type17(e) {
    // alert1(e + "_Onfail_of_f_master_get_f_data_type17");
    loading_hide();
    cordova.exec(Onsuccess_get_lat_long_17, Onfail_get_lat_long_17, 'maulik',
        'nck', ["ds"]);

}

function Onsuccess_update_FM_f_data_type17(e) {
    try {
        std_rng_equation = '';
        result_store = '';
        lat_long_json = [];
        Type17_again_call_for_next_equation();
    } catch (e) {
        alert1(e + "_Onsuccess_update_FM_f_data_type17");
    }
}
function Onfail_update_FM_f_data_type17(e) {
    std_rng_equation = '';
    result_store = '';
    lat_long_json = [];
    alert1(e + "_Onfail_update_FM_f_data_type17");
    Type17_again_call_for_next_equation();
}

function Onsuccess_get_lat_long_17(e1) {
    try {
        lat_long_json = JSON.parse(e1);
        var lat = lat_long_json[0].lat;
        var lon = lat_long_json[0].lon;
        var address = lat_long_json[0].address;
        var accuracy = lat_long_json[0].accuracy;
        var imei = lat_long_json[0].imei;
        var gps = lat_long_json[0].gps;
        var gprs = lat_long_json[0].gprs;
        var diff_time = lat_long_json[0].diff_time;

        insert_data_in_f_master_for_type17();
    } catch (e1) {
        alert1(e1 + "__Onsuccess_get_lat_long_17");
    }
}
function Onfail_get_lat_long_17(e1) {
    try {
        insert_data_in_f_master_for_type17();
    } catch (e1) {
        alert1(e1 + "_Onfail_get_lat_long_17")
    }
}

function insert_data_in_f_master_for_type17() {
    try {
        var range_json = itemObj._checkStrObj(std_rng_equation);  		// check_item
        var range1_json_target = range_json[0].target;
        var range1_json_range = range_json[0].range;

        for (var aqu_r = 0; aqu_r < range1_json_range.length; aqu_r++) {
            var equ_start = range1_json_range[aqu_r].start;
            var equ_end = range1_json_range[aqu_r].end;

            var equ_text = '';
            if (result_store >= equ_start && result_store <= equ_end) {
                equ_text = range1_json_range[aqu_r].text;
                break;
            }
        }

        var calc_checksheet_type = range1_json_target[0];
        var calc_checksheet_id = range1_json_target[1];
        var calc_checksheet_step = range1_json_target[2];
        var calc_checksheet_qid = range1_json_target[3];

        var query = "select * from checksheet where checksheetid = '" + calc_checksheet_id + "' and step = '" + calc_checksheet_step + "' and  c_type = '" + calc_checksheet_type + "'";
        // alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1" // 1 for selecting values from table in json
        });
        cordova.exec(Onsuccess_get_data_from_checksheetMaster_for_type17, Onfail_get_data_from_checksheetMaster_for_type17, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + "_insert_data_in_f_master_for_type17");
    }
}

function Onsuccess_get_data_from_checksheetMaster_for_type17(e) {
    try {
        var Calc_data_json = JSON.parse(e);
        if (Calc_data_json.length > 0) {
            var Calc_data = itemObj._checkStrObj(Calc_data_json[0].data);  		// check_item

            var range_json = itemObj._checkStrObj(std_rng_equation);  		// check_item
            var range1_json_target = range_json[0].target;
            var range1_json_range = range_json[0].range;

            for (var aqu_r = 0; aqu_r < range1_json_range.length; aqu_r++) {
                var json_p = itemObj._checkStrObj(range1_json_range[aqu_r]);  		// check_item

                var equ_start = json_p["start"];
                var equ_end = json_p["end"];
                var equ_text = '';
                if (result_store >= equ_start && result_store <= equ_end) {
                    equ_text = json_p["text"];
                    break;
                }
            }

            var Subcatogory = Calc_data_json[0].subcategory;
            var imei_new = Calc_data_json[0].imei;
            var buttons = itemObj._checkStrObj(Calc_data_json[0].buttons);  		// check_item
            var date = Calc_data_json[0].date;
            var millisecond = Calc_data_json[0].millisecond;
            var checksheetid = Calc_data_json[0].checksheetid;
            var c_name = Calc_data_json[0].c_name;
            var step = Calc_data_json[0].step;

            var calc_checksheet_type = range1_json_target[0];
            var calc_checksheet_id = range1_json_target[1];
            var calc_checksheet_step = range1_json_target[2];
            var calc_checksheet_qid = range1_json_target[3];

            for (var k = 0; k < Calc_data.length; k++) {
                if (Calc_data[k].que_id == calc_checksheet_qid) {
                    Calc_data[k].ans[0] = equ_text;
                    // alert1(Calc_data[k].ans[0]);
                    // Calc_data[k].value = equ_text;
                }
            }

            var heading = curr_survey_data["heading"];
            var step = curr_survey_data["step"];
            var check_type = curr_survey_data["check_type"];
            var task_id = curr_survey_data["t_id"];
            var server_task_id = curr_survey_data["server_task_id"];
            var site_id = curr_survey_data["siteid"];
            var data = curr_survey_data["json"];

            var date_s = new Date();
            var date = date_s.getTime();
            var time = date_s.getTime();
            var f_name = imei_new + "_" + time;
            var t_id = JSON.parse(storage.getItem('tid'));

            var lat = lat_long_json[0].lat;
            var lon = lat_long_json[0].lon;
            var address = lat_long_json[0].address;
            var accuracy = lat_long_json[0].accuracy;
            var imei = lat_long_json[0].imei;
            var gps = lat_long_json[0].gps;
            var gprs = lat_long_json[0].gprs;
            var diff_time = lat_long_json[0].diff_time;

            var udf_id = JSON.parse(storage.getItem('udf_id'));

            var company_id = JSON.parse(storage.getItem('company_id'));
            var flow_id = JSON.parse(storage.getItem('wayflow'));;
            var flow_name = JSON.parse(storage.getItem('wayflow_name'));
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var match_temp_id = list_data[0].match_temp_id;
            if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
                match_temp_id = "";
            }

            var Cal_f_data_json = [];
            Cal_f_data_json.push({
                taskid: t_id,
                servertaskid: server_task_id,
                siteid: site_id,
                stepid: calc_checksheet_step,
                category: wayflow,
                imei: imei,
                username: username,
                u_c: uniqcode,
                subcategory: heading,
                date: date,
                date_s: date_s,
                address: address,
                lat: lat,
                long1: lon,
                gps: gps, // 0 = off, 1 = on
                accuracy: accuracy,
                diff_time: diff_time,
                check_type: calc_checksheet_id,
                data: Calc_data,
                buttons: buttons,
                udf_id: udf_id,
                CompanyId: company_id,
                FlowId: flow_id,
                FlowName: flow_name,
                match_temp_id: match_temp_id
            });
            Cal_f_data_json = JSON.stringify(Cal_f_data_json);

            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var match_temp_id = list_data[0].match_temp_id;
            if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
                match_temp_id = "";
            }

            var query = "INSERT INTO f_master (c_id, c_type, tid ,f_name, f_data, f_key, f_value, f_type, flag, step, lat, long, millisecond, match_temp_id) VALUES('"
                + calc_checksheet_id + "','" + calc_checksheet_type + "','" + t_id + "','" + f_name + "','" + Cal_f_data_json + "', 's','" + calc_checksheet_id + "','text/plain','0','"
                + calc_checksheet_step + "', '" + lat + "', '" + lon + "', '" + millisecond + "', '" + match_temp_id + "');";

            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                q: "0",
                tid: t_id
            });
            cordova.exec(Onsuccess_after_f_master_inserted_type17, Onfail_after_f_master_inserted_type17, 'SqlitePlugin', 'insertValuse', q_jsonobj);
        }
        else {
            std_rng_equation = '';                      //changes for submit btn click issue (bh.audit) [25102021]
            result_store = '';
            lat_long_json = [];
            Type17_again_call_for_next_equation();
        }
    }
    catch (e) {
        alert1(e + "_Onsuccess_get_data_from_checksheetMaster_for_type17");
    }
}

function Onfail_get_data_from_checksheetMaster_for_type17(e) {
    alert1(e + "_Onfail_get_data_from_checksheetMaster_for_type17");
}

function Onsuccess_after_f_master_inserted_type17(e) {
    try {
        std_rng_equation = '';
        result_store = '';
        lat_long_json = [];
        Type17_again_call_for_next_equation();
    } catch (e) {
        alert1(e + "_Onsuccess_after_f_master_inserted_type17");
    }
}

function Onfail_after_f_master_inserted_type17(e) {
    std_rng_equation = '';
    result_store = '';
    lat_long_json = [];
    Type17_again_call_for_next_equation();
    alert1(e + "_Onfail_after_f_master_inserted_type17");
}

function Type17_again_call_for_next_equation() {
    try {
        if (press_calc_Array.length > 0) {
            press_calc_Array.splice(0, 1);
            call_calc_click(press_calc_Array);
        } else {
            loading_hide();
        }
    } catch (e) {
        alert1(e + "_Type17_again_call_for_next_equation");
    }
}
// ////////----------New eqution calculator end ------------------/////////////
