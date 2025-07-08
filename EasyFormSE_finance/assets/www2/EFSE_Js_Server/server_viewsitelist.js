
// Get list of completed sites from server
function get_list_of_completed_sites() {
    try {
        loading();
        $("#txtsearch").val("");
        $("#site_list").empty();
        $('#btn_Create_Task').hide();
        var selected_module_id = JSON.parse(storage.getItem('wayflow'));
        var getdataarray = [];
        getdataarray.push({
            'user_name': username,
            'u_c': uniqcode,
            'module_id': selected_module_id, // this is flow id
            'input': "", // "" for all sites
            'limit': limit_range
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Get_Completed_Task_By_Module', JSON.stringify(getdataarray), onsuccess_get_list_of_completed_sites, onfail_get_list_of_completed_sites);
        getdata.callOtherDomain();
    } catch (e) {
        alert1(e + '_get_list_of_completed_sites()');
        loading_hide();
    }
}

// serarch site list
function search_completed_site_list() {
    limit_range = default_range; // set default range limit
    query_type = 2; // search site listing
    get_list_of_completed_sites_by_search();
}

// Get list of completed sites by search from server
function get_list_of_completed_sites_by_search() {
    // alert1("Getting site list by search...");
    try {
        var search_keyword = $("#txtsearch").val();
        if (search_keyword != "") {
            $("#txtsearch").val("");
            $("#site_list").empty();
            var selected_module_id = JSON.parse(storage.getItem('wayflow'));
            if (selected_module_id == 0) {
                alert1("Please select module !");
            } else {
                loading();
                var getdataarray = [];
                getdataarray.push({
                    'user_name': username,
                    'u_c': uniqcode,
                    'module_id': selected_module_id, // this is flow id
                    'input': search_keyword,
                    'limit': limit_range
                });

                var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Get_Completed_Task_By_Module', JSON.stringify(getdataarray), onsuccess_get_list_of_completed_sites, onfail_get_list_of_completed_sites);
                getdata.callOtherDomain();
            }
        } else {
            alert1("Please enter search keyword !");
        }
        enable_back_button();
        loading_hide();
    } catch (e) {
        alert1(e + '_get_list_of_completed_sites_by_search()');
        loading_hide();
    }
}

// onsuccess get list of completed sites
function onsuccess_get_list_of_completed_sites(e) {
    try {
        var result = eval('(' + e.responseText + ')');
        var status = result[0].status;
        $("#site_list").empty();
        if (status == 1) {
            //var myArray = JSON.parse(result[0].message);

            var data = result[0].data;
            if (data == "" || data == null || data == undefined) {
                var myArray = JSON.parse(result[0].message);
            }
            else {
                var myArray = JSON.parse(data);
            }

            $("#tabCount_Comp").html(myArray.length);
            $("#tabCount_Comp").addClass('numberCircle');
            for (var i = 0; i < myArray.length; i++) {
                var param = "Generate_PDFFile('" + myArray[i].task_id + "')";
                var list_item = '<li onclick ="' + param + '"><a href="#" class="item-link item-content">';
                list_item += '<div class="item-inner item-no-pad"><div class="item-title">';
                list_item += '<label style="font-size:11pt; font-weight:bold">' + myArray[i].customeruniq + '</label><br />';
                list_item += '<label style="font-size:9pt">' + myArray[i].address + '</label><br />';
                list_item += '<label style="font-size:8pt">' + myArray[i].surveydate + '</label>';
                list_item += '</div><div class="item-after"><div class="item-icon"><img src="images/pdf_type27.png" style="width:35px; height:35px"></div></div></div></a>';
                list_item += '</li>';
                $("#site_list").append(list_item);
            }

            var li_length = $("#site_list > li").length;
            if (li_length >= limit_range) {
                $(".op-show-btns").show();
                $("#btn_SeeAll").show();
                $("#btn_SeeMore").show();
            }
            else {
                $(".op-show-btns").hide();
                $("#btn_SeeAll").hide();
                $("#btn_SeeMore").hide();
            }
        } else {
            $("#tabCount_Comp").html(0);
            $("#tabCount_Comp").addClass('numberCircle');
            var list_item = '<li><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">No Record Found !</div></div></a></li>';
            $("#site_list").append(list_item);
        }
        enable_back_button();
        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_get_list_of_completed_sites()');
        $("#tabCount_Comp").html(0);
        $("#tabCount_Comp").addClass('numberCircle');
        var list_item = '<li><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">No Record Found !</div></div></a></li>';
        $("#site_list").append(list_item);
        loading_hide();
    }
}

// download latest site from server on refresh button click through select query
function refresh_completed_site_list() {
    limit_range = default_range; // set default range limit
    query_type = 1; // regular site listing
    get_list_of_completed_sites();
}

// ////// onfail part
function onfail_get_list_of_completed_sites(e) {
    $("#tabCount_Comp").html(0);
    $("#tabCount_Comp").addClass('numberCircle');
    var list_item = '<li><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">Network Error !</div></div></a></li>';
    $("#site_list").append(list_item);
    enable_back_button();
    loading_hide();
}

// ///////////

function Generate_PDFFile(server_task_id) {
    try {
        var module_id = JSON.parse(storage.getItem('wayflow'));
        var username = JSON.parse(storage.getItem('username'));
        var uniqcode = JSON.parse(storage.getItem('uniqcode'));

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);

        var circlewise_pdf = list_data[0].circlewise_pdf;
        if (circlewise_pdf == "" || circlewise_pdf == null || circlewise_pdf == undefined) {
            var DynamicPdfTypeId = list_data[0].pdf_type;
        }
        else {
            var circle_column = circlewise_pdf[0].circle_column;
            var pdf_data = circlewise_pdf[0].pdf_data;

            var columndata_str = $('#lst_sys_var_' + server_task_id + '').val();
            var columndata_Array = JSON.parse(decodeURIComponent(columndata_str));
            var circle_name = '';
            for (c = 0; c < columndata_Array.length; c++) {
                var key = columndata_Array[c].header;
                if (key == circle_column) {
                    circle_name = columndata_Array[c].ans;
                    break;
                }
            }

            if (circle_name == "") {
                alert("Circle column not found in columndata!");
            }
            else {
                for (p = 0; p < pdf_data.length; p++) {
                    var circle = pdf_data[p].circle;
                    if (circle == circle_name) {
                        var DynamicPdfTypeId = pdf_data[p].pdf_type;
                        break;
                    }
                }
            }
        }

        if (DynamicPdfTypeId == "" || DynamicPdfTypeId == null || DynamicPdfTypeId == undefined) {
            alert("DynamicPdfTypeId is not found!");
        }
        else {
            loading();

            var pdf_is_main = list_data[0].pdf_is_main;
            if (pdf_is_main == "" || pdf_is_main == null || pdf_is_main == undefined) {
                pdf_is_main = "false";
            }

            var Param_obj = [];
            Param_obj.push({
                'taskid': server_task_id,
                'Flow_Id': module_id,
                'DynamicPdfTypeId': DynamicPdfTypeId,
                'pdf_is_main': pdf_is_main
            });

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_PDF_Creation_WSapi', JSON.stringify(Param_obj), onsuccess_Generate_PDFFile, onfail_Generate_PDFFile);
            getdata.callOtherDomain();
        }
    } catch (e) {
        alert1(e + '_Generate_PDFFile()');
        loading_hide();
    }
}
function onsuccess_Generate_PDFFile(e) {
    try {
        var result = e.responseText;
        var myData = eval('' + result + '');
        var status = myData[0].status;
        if (status == 1) {

            var data = myData[0].data;
            if (data == "" || data == null || data == undefined) {
                var message = myData[0].message;
            }
            else {
                var message = data;
            }

            var path = message;

            var user_id = JSON.parse(storage.getItem('user_id'));
            var uniqcode = JSON.parse(storage.getItem('uniqcode'));
            path = path + '&ud=' + user_id + '&uc=' + uniqcode;

            loading_hide();
            Download_PDFFile(path);
        } else {
            alert1('Error In PDF Createtion Report.');
            loading_hide();
        }
    } catch (e) {
        alert1(e + '_onsuccess_Generate_PDFFile()');
    }
}
function onfail_Generate_PDFFile(e) {
    alert1("Network Error !");
    loading_hide();
}

function Download_PDFFile(t_path) {
    try {
        var q_jsonobj = [];
        q_jsonobj.push({
            path: t_path,
            name: ""
        });
        cordova.exec(onsuccess_Download_PDFFile, onfail_Download_PDFFile, 'pdf_download', 'anAction', q_jsonobj);
    } catch (e) {
        alert1(e + '_Download_PDFFile()');
    }
}

function onsuccess_Download_PDFFile(e) {
    // user has pressed back
}

function onfail_Download_PDFFile(e) {
    alert1("Network Error !");
    loading_hide();
}
