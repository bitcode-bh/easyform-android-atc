var is_chartchange_flag = 0, chart_counter = 0, prev_dashboard_id, is_elem_dragged = false, is_name_changed = false, is_deffltr_change_flag = 0;
var glb_pivot_config = [], trend_dashboard_array = [];

get_dashboard = () => {

    var role_id = JSON.parse(storage.getItem('role_id'));

    var Param_obj = [];
    Param_obj.push({
        'Role_id': role_id,
    });

    //loading('Loading Dashboard');
    var getdata = new Webservicecall_REST(global_wcf_url + 'Select_Dashboard_Id', JSON.stringify(Param_obj), function (e) {
        try {
            var All_data = e.responseText;
            All_data = JSON.parse(All_data);
            var status = All_data[0].status;
            var message = All_data[0].message;
            if (status == 1) {
                $('#div_new_dashboard').show();
                $('#toggle_chart_tbl').show();
                $('#ddl_dashboard_list').show();
                $('#div_old_dashboard').css('height', '60%');

                var data = All_data[0].data;
                if (data == '' || data == null || data == undefined) {
                    alert('Getting response blank');
                }
                else {
                    let dashboard_data = JSON.parse(data);

                    var data = [];
                    for (let d = 0; d < dashboard_data.length; d++) {
                        let user_id = dashboard_data[d].user_id;
                        if (user_id == '' || user_id == null || user_id == undefined) {
                            data.push(dashboard_data[d]);
                        }
                        else {
                            data.unshift(dashboard_data[d]);
                        }
                    }

                    $('#ddl_dashboard_list').empty();
                    for (let i = 0; i < data.length; i++) {
                        var dashboard_id = data[i].Dashborad_id;
                        var dashboard_pagename = data[i].Page_name;
                        var dashboard_user_id = data[i].user_id;

                        if (dashboard_user_id == '' || dashboard_user_id == null || dashboard_user_id == undefined) {
                            var dashboard_type = 'Admin';
                        }
                        else {
                            var dashboard_type = 'User';
                        }

                        let opt_str = '<option value="' + dashboard_id + '" user_id="' + dashboard_user_id + '">' + dashboard_pagename + '(' + dashboard_type + ')</option>';
                        $('#ddl_dashboard_list').append(opt_str);
                    }
                    let selected_dashboard_id = $('#ddl_dashboard_list').val();
                    prev_dashboard_id = selected_dashboard_id;
                    is_chartchange_flag = 0;

                    $('#ddl_dashboard_list').unbind('change');
                    $('#ddl_dashboard_list').bind('change', function (e) {
                        let flag_dashboard = '';
                        if ($('#div_vertical_dashboard').css('display') == 'block') {
                            flag_dashboard = 'report';
                        }

                        let selected_dashboard_id = $(this).val();
                        get_dashboard_config_data(selected_dashboard_id, flag_dashboard);
                    });

                    $('.cls_pagename_opt').unbind('click');
                    $(".cls_pagename_opt").click(function (e) {
                        e.stopPropagation();
                    });

                    $('#toggle_chart_tbl').find('i').unbind('click');
                    $('#toggle_chart_tbl button').click(function (e) {
                        $(this).siblings().removeClass('view_type_active');
                        $(this).addClass('view_type_active');

                        let check_view = $('#toggle_chart_tbl').find('.view_type_active').attr('view_type');
                        if (check_view == 'chart_view') {
                            $('.apexcharts-canvas').show();
                            $('.tbl_container').hide();
                            $('.cls_card_filter_items').show();
                            $('.cls_card_aggregate_fun').show();
                        }
                        else {
                            $('.apexcharts-canvas').hide();

                            $('.menucard').find('.tbl_container').each(function () {
                                if ($(this).html() == '') {
                                    $(this).hide();
                                }
                                else {
                                    $(this).show();
                                }
                            });

                            $('.cls_card_filter_items').hide();
                            $('.cls_card_aggregate_fun').hide();
                        }

                        $('.menucard').each(function () {
                            let chart_data = $(this).find('input[type="hidden"]').attr('dashboard_count');
                            if (chart_data == '' || chart_data == null || chart_data == undefined) { }
                            else {
                                chart_data = JSON.parse(decodeURIComponent(chart_data));
                                let chart_aggregate_datalng = chart_data[0].aggregate_data.length;
                                let chart_json = $(this).find('input[type="hidden"]').val();
                                chart_json = JSON.parse(decodeURIComponent(chart_json));
                                let chart_type = chart_json.type;
                                if (chart_aggregate_datalng > 500 || chart_type == 'pivot') {
                                    $(this).find('.tbl_container').show();
                                    $(this).find('.cls_card_filter_items').hide();
                                    $(this).find('.cls_card_aggregate_fun').hide();
                                }
                                else {
                                    $(this).find('.cls_tochange_view').each(function () {
                                        $(this).removeClass('view_type_active');
                                        if (check_view == 'chart_view') {
                                            if ($(this).hasClass('cls_chart_view') == true) {
                                                $(this).addClass('view_type_active');
                                            }
                                        }
                                        else {
                                            if ($(this).hasClass('cls_tbl_view') == true) {
                                                $(this).addClass('view_type_active');
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    });

                    $('#btn_add_chart').unbind('click');
                    $('#btn_add_chart').click(function () {
                        $('.chart_type').parent().siblings().find('.chart_type').removeClass('chart_active');
                        $('.chart_type').parent().siblings().find('.chart_type:first-child').eq(0).addClass('chart_active');
                        open_popover_mdlchart('Insert');
                    });

                    $('#btn_dashboard_copy').unbind('click');
                    $('#btn_dashboard_copy').click(function () {
                        copy_existing_dashboard();
                    });

                    let flag_dashboard = '';
                    if ($('#div_vertical_dashboard').css('display') == 'block') {
                        flag_dashboard = 'report';
                    }

                    get_dashboard_config_data(selected_dashboard_id, flag_dashboard);
                }
                loading_hide();
            }
            else {
                $("#noti_Attendance2").css("height", "35px");
                $('#div_old_dashboard').css('height', '100%');
                $('#div_new_dashboard').css('display', 'none');
                $('#toggle_chart_tbl').hide();
                $('#ddl_dashboard_list').hide();
                $('#div_dashboard_config').find('.cls_pagename_opt').hide();
            }
            loading_hide();

            if (status == 3) {
                mk_notify(message);
            }
        }
        catch (e) {
            alert(e + '_get_dashboard()');
            loading_hide();
        }
    }, function (e) {
        // api not found in other urls
        $("#noti_Attendance2").css("height", "35px");
        $('#div_old_dashboard').css('height', '100%');
        $('#div_new_dashboard').css('display', 'none');
        $('#toggle_chart_tbl').hide();
        $('#ddl_dashboard_list').hide();
        $('#div_dashboard_config').find('.cls_pagename_opt').hide();
        loading_hide();
    });
    getdata.callOtherDomain();
}

get_vertical_dashboard = (flag_dashboard) => {
    $('#div_trip_list').hide();
    $('#div_page_content').hide();
    dashboard_id = $('#ddl_dashboard_list').val();
    get_dashboard_config_data(dashboard_id, flag_dashboard);
}

get_dashboard_config_data = (dashboard_id, flag_dashboard) => {
    menu_arry = [];
    trend_dashboard_array = [];
    prev_dashboard_id = dashboard_id;
    created_dttm = '';
    updated_dttm = '';

    if (flag_dashboard == 'report') {
        $('#div_vertical_dashboard').show();
        $('#div_dashboard_config').show();
    }
    else {
        $('#div_dashboard_config').hide();
    }
    $('#dashboard_container').empty();
    $('#dashboard_page_Content .swiper-wrapper').empty();

    let user_id = $('#ddl_dashboard_list option:selected').attr('user_id');
    if (user_id == '' || user_id == null || user_id == undefined) {
        $('#btn_add_chart').css('display', 'none');
        $('#user_dashboard_mail').css('display', 'none');
        $('#preview_dashboard_onmail').css('display', 'none');

        if (flag_dashboard == 'report') {
            $('#div_dashboard_config').find('.cls_pagename_opt').hide();
            $('#div_dashboard_config').find('.cls_add_new_dashboard').show();
        }
    }
    else {
        $('#btn_add_chart').css('display', 'flex');
        $('#user_dashboard_mail').css('display', 'inline-block');

        if (flag_dashboard == 'report') {
            $('#div_dashboard_config').find('.cls_pagename_opt').show();
            $('#div_dashboard_config').find('.cls_add_new_dashboard').show();
        }
    }

    var Param_obj = [];
    Param_obj.push({
        'Dashboard_id': dashboard_id,
    });

    //loading('Loading Dashboard');
    var getdata = new Webservicecall_REST(global_wcf_url + 'Select_DashboardMaster', JSON.stringify(Param_obj), function (e) {
        try {
            var All_data = e.responseText;
            All_data = JSON.parse(All_data);
            var status = All_data[0].status;
            var message = All_data[0].message;
            if (status == 1) {
                var data = All_data[0].data;
                if (data == '' || data == null || data == undefined) { }
                else {
                    data = JSON.parse(data);
                    created_dttm = data[0].Create_DTTM;
                    created_dttm = convert_datetime_by_format(created_dttm, 'datetime');
                    created_dttm = convert_fix_format_date_on_submit(created_dttm, 'datetime');
                    $('#ddl_dashboard_list option:selected').attr('created_dttm', created_dttm);

                    updated_dttm = data[0].Update_DTTM;
                    if (updated_dttm == '' || updated_dttm == null || updated_dttm == undefined) { }
                    else {
                        updated_dttm = convert_datetime_by_format(updated_dttm, 'datetime');
                        updated_dttm = convert_fix_format_date_on_submit(updated_dttm, 'datetime');
                        $('#ddl_dashboard_list option:selected').attr('updated_dttm', updated_dttm);
                    }

                    let chk_dashboard_mail = data[0].dashboard_email;
                    if (chk_dashboard_mail == '' || chk_dashboard_mail == null || chk_dashboard_mail == undefined) {
                        $('#chk_userdashboard_mail').prop('checked', false);
                        $('#preview_dashboard_onmail').css('display', 'none');
                        $('#mail_config').css('display', 'none');
                    }
                    else {
                        chk_dashboard_mail = chk_dashboard_mail.toLowerCase();
                        if (chk_dashboard_mail == 'true') {
                            $('#chk_userdashboard_mail').prop('checked', true);
                            if (user_id == '' || user_id == null || user_id == undefined) {
                                $('#preview_dashboard_onmail').css('display', 'none');
                                $('#mail_config').css('display', 'none');
                            }
                            else {
                                $('#preview_dashboard_onmail').css('display', 'inline-block');
                                $('#mail_config').css('display', 'inline-block');
                            }

                            $('#hdn_dashboard_mail_config').val('');
                            let Escalation_interval = data[0].Escalation_interval;
                            if (Escalation_interval == '' || Escalation_interval == null || Escalation_interval == undefined) { }
                            else {
                                $('#hdn_dashboard_mail_config').val(Escalation_interval);
                            }
                        }
                        else {
                            $('#chk_userdashboard_mail').prop('checked', false);
                            $('#preview_dashboard_onmail').css('display', 'none');
                            $('#mail_config').css('display', 'none');
                        }
                    }

                    var new_dashboard_menuarray = data[0].Data;
                    //$('#dashboard_page_Content .active').empty();
                    chart_counter = 0;

                    // check for udf exist or deleted
                    //new_dashboard_menuarray = JSON.parse(new_dashboard_menuarray);
                    //let udf_id_array = [];
                    //$("ul#side-menu li").each(function () {
                    //    var menu_url = $(this).find('a').attr('href');
                    //    if (menu_url.indexOf("EF_Port_App1.aspx") > -1) {
                    //        var menu_udf_id = $(this).find('a').attr('udf_id');
                    //        udf_id_array.push(menu_udf_id);
                    //    }
                    //});

                    //for (let i = 0; i < new_dashboard_menuarray.length; i++) {
                    //    let udf_id = new_dashboard_menuarray[i].udf_id;
                    //    if (udf_id_array.indexOf(udf_id) > -1) { }
                    //    else {
                    //        new_dashboard_menuarray.splice(i, 1);
                    //        i = 0;
                    //    }
                    //}

                    new_dashboard_structure(JSON.stringify(new_dashboard_menuarray), dashboard_id, '', '', '', '', '', '', flag_dashboard);
                    $('.home_page .card:first-child').css('height', '100%');
                }
            }
            else {
                mk_notify(message);
            }
        }
        catch (e) {
            alert(e + '_get_dashboard_config_data()');
        }
        loading_hide();
    }, onfail_request);
    getdata.callOtherDomain();
}

sortArrayByTwoProperties = (array, prop1, asc1 = true) => {
    return array.sort((a, b) => (
        (asc1 ? a[prop1] - b[prop1] : b[prop1] - a[prop1])
    ));
}

new_dashboard_structure = (new_dashboard_menuarray, dashboard_id, chart_flag, chart_index, dashboard_count_ary, card_view, flag_view, calendar_data, flag_dashboard) => {
    try {
        var dashboard_menu_array = JSON.parse(new_dashboard_menuarray);

        dashboard_menu_array = JSON.parse(dashboard_menu_array);
        dashboard_menu_array = sortArrayByTwoProperties(dashboard_menu_array, "position", true);

        if (chart_index === '' || chart_index == null || chart_index == undefined || chart_index == 'undefined') { }
        else {
            var new_chart_counter = chart_counter;
            chart_counter = chart_index;
        }

        $('#div_page_content br').css('display', 'none');
        for (var i = 0; i < dashboard_menu_array.length; i++) {
            var chart_menu_str = '';
            if (flag_dashboard == '' || flag_dashboard == null || flag_dashboard == undefined) {
                chart_menu_str += '<div class="swiper-slide">';
            }

            var menu_title = dashboard_menu_array[i].title;
            var udf_id = dashboard_menu_array[i].udf_id;

            var submenu_lng = dashboard_menu_array[i].submenu;
            var chart_type = dashboard_menu_array[i].type;
            var chart_style = dashboard_menu_array[i].style;
            if (chart_style == '' || chart_style == null || chart_style == undefined) { }
            else {
                var chart_top = chart_style[0].top;
                var chart_left = chart_style[0].left;
                var chart_width = chart_style[0].width;
                var chart_height = chart_style[0].height;
            }
            var column_data = dashboard_menu_array[i].columndata;
            if (column_data == "" || column_data == null || column_data == undefined) {
                column_data = [];
            }
            var columndata = [], aggregate_str = '', chk_icon_str = 1;
            for (let c = 0; c < column_data.length; c++) {
                let checksheetID = column_data[c].checksheetID;
                let checksheet_type = column_data[c].checksheet_type;
                let step = column_data[c].step;
                let qid = column_data[c].qid;
                let header = column_data[c].header;
                let ctrl_type = column_data[c].ctrl_type;
                let system_var = column_data[c].system_var;
                if (system_var == '' || system_var == null || system_var == undefined) {
                    system_var = '';
                }
                let aggregate_fun = column_data[c].aggregate_fun;
                let group_date_type = column_data[c].group_date_type;
                if (group_date_type == '' || group_date_type == null || group_date_type == undefined) {
                    group_date_type = 'month';
                }

                let txt_prefix = column_data[c].prefix;
                let percentage = column_data[c].percentage;
                let custom_header = column_data[c].custom_header;

                let pivotRow = column_data[c].pivotRow;
                let pivotCol = column_data[c].pivotCol;

                columndata.push({
                    group_date_type: group_date_type,
                    checksheetID: checksheetID,
                    checksheet_type: checksheet_type,
                    step: step,
                    qid: qid,
                    header: header,
                    custom_header: custom_header,
                    ctrl_type: ctrl_type,
                    aggregate_fun: aggregate_fun,
                    system_var: system_var,
                    pivotRow: pivotRow,
                    pivotCol: pivotCol,
                    prefix: txt_prefix,
                    percentage: percentage
                });

                if (aggregate_fun == 'sum' || aggregate_fun == 'min' || aggregate_fun == 'max' || aggregate_fun == 'avg') {
                    aggregate_str += 'Number indicates <span style="color: gray;font-weight: bold;">' + aggregate_fun + '</span> of <span style="color: gray;font-weight: bold;">' + header + '</span>';
                    chk_icon_str = 0;
                }
            }
            dashboard_menu_array[i].columndata = columndata;
            var submenu = dashboard_menu_array[i].submenu;

            if (submenu.length > 0) {
                let tab_json = $('#hdn_' + udf_id).val();
                if (tab_json == '' || tab_json == null || tab_json == undefined) { }
                else {
                    let new_submenu = [];
                    tab_json = JSON.parse(decodeURIComponent(tab_json));
                    for (let t = 0; t < tab_json.length; t++) {
                        let tab_name = tab_json[t].tab_name;
                        let tab_id = tab_json[t].tab_id;
                        new_submenu.push({
                            tab_id: tab_id,
                            tab_name: tab_name
                        });
                    }
                    dashboard_menu_array[i].submenu = new_submenu;
                }
            }

            if (chart_type == '') {
                var gradient_color = 'linear-gradient(90deg,rgb(60, 184, 120,0.90),rgb(60, 184, 120))';
                var back_clr = 'rgb(60, 184, 120)';

                var menu_icon_str = '<td style="width:65px;vertical-align: middle;">';
                if (chart_type == '' && chk_icon_str == 0) { }
                else {
                    var menu_icon = dashboard_menu_array[i].icon_base64;
                    if (menu_icon == '' || menu_icon == null || menu_icon == undefined) {
                        var icon_base64_str = $('a[udf_id="' + udf_id + '"]').find('.child').attr('src');
                        if (icon_base64_str == '' || icon_base64_str == null || icon_base64_str == undefined) {
                            icon_base64_str = $('a[udf_id="' + udf_id + '"]').find('i').attr('class');
                            if (icon_base64_str == '' || icon_base64_str == null || icon_base64_str == undefined) {
                                menu_icon_str += '<i class="fa fa-sitemap fa-5x child"></i>';
                            }
                            else {
                                menu_icon_str += '<i class="' + icon_base64_str + ' fa-5x child"></i>';
                            }
                        }
                        else {
                            menu_icon_str += '<img class="child card_icon_img" src="' + icon_base64_str + '" />';
                        }
                    }
                    else {
                        if (menu_icon.indexOf('data:image/') > -1) {
                            menu_icon_str += '<img class="child card_icon_img" src="' + menu_icon + '" />';
                        }
                        else {
                            menu_icon_str += '<i class="fa fa-' + menu_icon + ' fa-5x child"></i>';
                        }
                    }
                }
                menu_icon_str += '</td>';
            }
            else if (chart_type == 'pivot') {
                var gradient_color = 'none';
            }

            let def_fltr_arry = dashboard_menu_array[i].default_filter;
            var def_fltr_str = '', def_fltr_tooltip = '';
            if (def_fltr_arry == '' || def_fltr_arry == null || def_fltr_arry == undefined) { }
            else {
                if (def_fltr_arry.length > 0) {
                    def_fltr_tooltip += '<table class="tbl_user_tooltip" cellspacing=0 id="tooltip_tbl_id" style="width:100%"><tr colspan="2"><td>Default Filter:</td></tr><tr><th><u>Fields Name</u></th><th><u>Value</u></th></tr>';
                    for (let d = 0; d < def_fltr_arry.length; d++) {
                        let def_fltr_val = def_fltr_arry[d].value;
                        let ctrl_type = def_fltr_arry[d].ctrl_type;
                        if (ctrl_type == 8) {
                            let calendar_type = def_fltr_arry[d].calendar_type;
                            let cal_value = [];
                            if (calendar_type == 'is_before' || calendar_type == 'is_after' || calendar_type == 'is_between') { }
                            else {
                                cal_value = get_date_as_per_condition(calendar_type);
                                if (def_fltr_val == '' || def_fltr_val == null || def_fltr_val == undefined) {
                                    def_fltr_arry[d]['value'] = cal_value;
                                    def_fltr_val = cal_value;
                                }
                                else {
                                    if (calendar_type == 'is_before' || calendar_type == 'is_after' || calendar_type == 'is_between') { }
                                    else {
                                        def_fltr_arry[d]['value'] = cal_value;
                                        def_fltr_val = cal_value;
                                    }
                                }
                            }
                        }

                        let search_str = '';
                        for (let v = 0; v < def_fltr_val.length; v++) {
                            if (ctrl_type == 8) {
                                let calendar_type = def_fltr_arry[d].calendar_type;
                                if (calendar_type == 'is_before' || calendar_type == 'is_after' || calendar_type == 'is_between') {
                                    if (v == def_fltr_val.length - 1) {
                                        search_str = search_str + def_fltr_val[v];
                                    }
                                    else {
                                        search_str = search_str + def_fltr_val[v] + ',';
                                    }
                                }
                                else {
                                    search_str = calendar_type.replace(/_/g, " ");
                                }
                            }
                            else {
                                if (v == def_fltr_val.length - 1) {
                                    search_str = search_str + def_fltr_val[v];
                                }
                                else {
                                    search_str = search_str + def_fltr_val[v] + ',';
                                }
                            }
                        }
                        let def_fltr_col_name = def_fltr_arry[d].columnName;
                        def_fltr_tooltip += '<tr><td><b>' + def_fltr_col_name + ':</b></td><td>' + search_str + '</td></tr>';

                        def_fltr_str += '<span style="color:gray;font-size:12px;font-weight:bold;background-color:white;padding:2px;border-radius: 5px 0px 0px 5px;">' + def_fltr_col_name + ': </span>';
                        def_fltr_str += '<span class="badge badge-light mr-1" style="font-weight:600;color:gray;background-color:white;padding:3px;border-radius:0px 5px 5px 0px;" data="' + encodeURIComponent(JSON.stringify(def_fltr_arry[d])) + '">' + search_str.toString() + '</span> ';
                    }
                    def_fltr_tooltip += '</table>';
                    var encode_tooltip = encodeURIComponent(def_fltr_tooltip);
                }
            }

            //let chart_width_left = compaired_dttm_for_convert_width_left(chart_width, chart_left);

            let pivot_config = dashboard_menu_array[0].pivot_config;
            if (pivot_config == '' || pivot_config == null || pivot_config == undefined) {
                var pivot_type = 'Table';
            }
            else {
                var pivot_type = pivot_config[0].pivot_type;
            }

            if (chart_type == 'pivot' && (pivot_type != 'Horizontal Stacked Bar Chart' || chart_counter != '_')) {
                card_view = '';
            }

            var chart_view_active = '', tbl_view_active = '';
            if (card_view == '' || card_view == null || card_view == undefined) {
                chart_view_active = 'view_type_active';
            }
            else {
                if (card_view == 'table_view') {
                    tbl_view_active = 'view_type_active';
                }
                else {
                    chart_view_active = 'view_type_active';
                }
            }

            let user_id = $('#ddl_dashboard_list option:selected').attr('user_id');
            if (user_id == '' || user_id == null || user_id == undefined) {
                var courser_style = 'not-allowed';
            }
            else {
                if (flag_view == 'preview') {
                    var courser_style = 'not-allowed';
                }
                else {
                    var courser_style = 'move';
                }
            }

            if (chart_type == 'bar') {
                var img_str = '<div class="cls_ghost_image shimmer-overlay"><img src="images/Charts/barchart.png"></div>';
            }
            else if (chart_type == 'pie') {
                var img_str = '<div class="cls_ghost_image shimmer-overlay"><img src="images/Charts/piechart.jpg"></div>';
            }
            else if (chart_type == 'column') {
                var img_str = '<div class="cls_ghost_image shimmer-overlay"><img src="images/Charts/columnchart1.jpg"></div>';
            }
            else if (chart_type == 'donut') {
                var img_str = '<div class="cls_ghost_image shimmer-overlay"><img src="images/Charts/donutchart.png" style="width: 70%;height: 70%;margin-top: 50px;"></div>';
            }
            else if (chart_type == 'stackbar') {
                var img_str = '<div class="cls_ghost_image shimmer-overlay"><img src="images/Charts/stackbarchart.png"></div>';
            }
            else if (chart_type == 'stackcolumn') {
                var img_str = '<div class="cls_ghost_image shimmer-overlay"><img src="images/Charts/stackcolumnchart.png"></div>';
            }
            else if (chart_type == 'line') {
                var img_str = '<div class="cls_ghost_image shimmer-overlay"><img src="images/Charts/linechart.jpg"></div>';
            }
            else {
                var img_str = '<div class="spinner-border text-secondary" role="status"><span class="sr-only">Loading...</span></div>';
            }

            if (flag_dashboard == 'report') {
                chart_height += 'px';
            }
            else {
                chart_height = '88%';
            }

            let str_max_icon = '';
            let menucard_preview = '';
            if (chart_counter == '_') {
                str_max_icon = '<button type="button" class="cls_max_preview"><i class="fa fa-window-maximize" aria-hidden="true" title="Maximize Preview"></i></button>';
                menucard_preview = 'cls_menucard_preview';
            }

            let tab_id = dashboard_menu_array[i].tab_id;
            var param = "open_popover_mdlchart('Update'," + chart_counter + ");";
            var tooltip_param = "show_deffltr_tooltip_on_mouseover('" + encode_tooltip + "',event)";
            if (chart_type == 'bar' || chart_type == 'pie' || chart_type == 'donut' || chart_type == 'column' || chart_type == 'stackbar' || chart_type == 'stackcolumn' || chart_type == 'line') {
                // Multi tab UI (Pie/Donut/Bar/Column/Stackbar/Stackcolumn/Line)
                chart_menu_str += '<div id="menucardid_' + chart_counter + '" class="menucard chart_grid ' + menucard_preview + '" card_name="' + menu_title + '" onmouseover="onmouseover_show_options(this);" onmouseout="onmouseout_hide_options(this);" style="height:' + chart_height + ';cursor:' + courser_style + '" udf_id="' + udf_id + '">';
                chart_menu_str += '<div id="card_filter_' + chart_counter + '" class="cls_card_filter_items">' + def_fltr_str + '</div>';   //onmousemove="' + tooltip_param + '" onmouseout="hide_tooltip_on_mouseout()"
                chart_menu_str += '<div id="card_aggregate_' + chart_counter + '" class="cls_card_aggregate_fun">' + aggregate_str + '</div>';
                if (flag_view == 'preview') {
                    chart_menu_str += str_max_icon;
                }
                else {
                    chart_menu_str += '<i class="fa fa-table cls_tbl_view cls_tochange_view ' + tbl_view_active + '" aria-hidden="true" title="Table View"></i>';
                    chart_menu_str += '<i class="fa fa-bar-chart cls_chart_view cls_tochange_view ' + chart_view_active + '" aria-hidden="true" title="Chart View"></i>';

                    if (flag_dashboard == 'report') {
                        if (submenu.length > 0) { }
                        else {
                            chart_menu_str += '<i class="fa fa-filter cls_filter_chart" aria-hidden="true" title="Filter" filter_tab_id="' + tab_id + '"></i>';
                        }
                        chart_menu_str += '<i class="fa fa-cog chart_toolbar" aria-hidden="true" onclick="' + param + '" title="Settings"></i>';
                        chart_menu_str += '<i class="fa fa-times delete_chart" aria-hidden="true" title="Remove card"></i>';
                    }
                    chart_menu_str += '<div class="tbl_container"></div>';
                }
                chart_menu_str += img_str;
                chart_menu_str += '<div class="cls_no_data_found"><span class="cls_card_name"></span><span>No Data Available to Show!</span></div>';
                chart_menu_str += '<input type="hidden" id="hdn_menucardid_' + chart_counter + '" value="' + encodeURIComponent(JSON.stringify(dashboard_menu_array[i])) + '" />';
                chart_menu_str += '</div>';
            }
            else {
                // Single tab UI (Counter tab)
                chart_menu_str += '<div id="menucardid_' + chart_counter + '" class="single_tab menucard ' + menucard_preview + '" card_name="' + menu_title + '" onmouseover="onmouseover_show_options(this);" onmouseout="onmouseout_hide_options(this);" style="height:' + chart_height + ';background:' + gradient_color + ';" udf_id="' + udf_id + '"><span class="dot"></span>';
                chart_menu_str += '<div id="card_filter_' + chart_counter + '" class="cls_card_filter_items">' + def_fltr_str + '</div>'; //  onmousemove="' + tooltip_param + '" onmouseout="hide_tooltip_on_mouseout()"
                chart_menu_str += '<div id="card_aggregate_' + chart_counter + '" class="cls_card_aggregate_fun">' + aggregate_str + '</div>';
                if (flag_view == 'preview') {
                    if (chart_type == 'pivot') {
                        chart_menu_str += '<div class="tbl_container"></div>';
                    }
                    chart_menu_str += str_max_icon;
                }
                else {
                    chart_menu_str += '<i class="fa fa-table cls_tbl_view cls_tochange_view ' + tbl_view_active + '" aria-hidden="true" title="Table View"></i>';
                    chart_menu_str += '<i class="fa fa-bar-chart cls_chart_view cls_tochange_view ' + chart_view_active + '" aria-hidden="true" title="Chart View"></i>';

                    if (flag_dashboard == 'report') {
                        chart_menu_str += '<i class="fa fa-filter cls_filter_chart" aria-hidden="true" title="Filter" filter_tab_id="' + tab_id + '"></i>';
                        chart_menu_str += '<i class="fa fa-cog chart_toolbar" aria-hidden="true" onclick="' + param + '" title="Settings"></i>';
                        chart_menu_str += '<i class="fa fa-times delete_chart" aria-hidden="true" title="Remove card"></i>';
                    }
                    chart_menu_str += '<div class="tbl_container"></div>';
                }
                if (chart_type == '') {
                    chart_menu_str += '<table style="width:100%;height:100%;" class="single_tab_card"><tr>' + menu_icon_str + '<td style="vertical-align: middle;"><h3 class="mt-2 txt_menu_name">' + menu_title + '</h3></td><td style="width:105px"><h3 class="huge tab_count" id="task_count_' + chart_counter + '" style="color:' + back_clr + ';"></h3><h3 class="huge trend_count" id="trend_count_' + chart_counter + '"></h3></td></tr></table>';
                }

                chart_menu_str += '<div class="cls_no_data_found"><span class="cls_card_name"></span><span>No Data Available to Show!</span></div>';
                chart_menu_str += '<input type="hidden" id="hdn_menucardid_' + chart_counter + '" value="' + encodeURIComponent(JSON.stringify(dashboard_menu_array[i])) + '" />';
                chart_menu_str += '<div class="spinner-border text-secondary" role="status"><span class="sr-only">Loading...</span></div>';
                chart_menu_str += '</div>';
            }

            if (flag_dashboard == '' || flag_dashboard == null || flag_dashboard == undefined) {
                chart_menu_str += '</div>';
            }

            if (flag_view == 'preview') {
                $('#preview_card').append(chart_menu_str);

                if (chart_type == 'pivot' && column_data.length == 0) {
                    if ($('#container_pvttbl_row span').length < 1) {
                        $('#menucardid_' + chart_counter).find('.tbl_container').empty();
                        draw_pivot_without_data(chart_counter, udf_id);
                        $('#menucardid_' + chart_counter).find(".text-secondary").hide();
                        $('#menucardid_' + chart_counter).find(".cls_ghost_image").hide();
                        $('#menucardid_' + chart_counter).find('.tbl_container').show();
                    }
                }
                chart_counter = new_chart_counter;
            }
            else {
                //$('#dashboard_container').append(chart_menu_str);
                if (flag_dashboard == 'report') {
                    $('#dashboard_container').append(chart_menu_str);

                    if (chart_flag == 'Update') {
                        var divs = $('#dashboard_container div[id^="menucardid_"]');
                        var ordered = divs.sort(function (a, b) {
                            var compA = $(a).attr('id').toUpperCase();
                            var compB = $(b).attr('id').toUpperCase();
                            return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
                        })
                        //empty the main div and re-append the ordered divs
                        $('#dashboard_container').empty().append(ordered)
                    }
                }
                else {
                    $('#dashboard_page_Content .swiper-wrapper').append(chart_menu_str);
                }

                dashboard_menu_array[i]['counter'] = chart_counter;

                if (chart_type == 'pivot' && column_data.length == 0) {
                    if ($('#container_pvttbl_row span').length < 1) {
                        $('#menucardid_' + chart_counter).find('.tbl_container').empty();
                        draw_pivot_without_data(chart_counter, udf_id);
                        $('#menucardid_' + chart_counter).find(".text-secondary").hide();
                        $('#menucardid_' + chart_counter).find(".cls_ghost_image").hide();
                        $('#menucardid_' + chart_counter).find('.tbl_container').show();
                    }
                }

                if (chart_flag == 'Update') {
                    chart_counter = new_chart_counter;
                }
                else {
                    chart_counter++;
                }
            }
        }

        if (flag_dashboard == 'report') { }
        else {
            myApp.swiper('.swiper-container', {
                pagination: '.swiper-pagination',
                paginationHide: false,
                paginationClickable: true,
                nextButton: '.swiper-button-next',
                prevButton: '.swiper-button-prev',
            });
        }

        if (dashboard_count_ary == '' || dashboard_count_ary == null || dashboard_count_ary == undefined) {
            // get counter at first time draw charts
            get_chart_counter(JSON.stringify(dashboard_menu_array), dashboard_id, card_view, flag_dashboard);
        }
        else {
            // When resize chart than direct draw chart
            dashboard_count_ary = JSON.parse(decodeURIComponent(dashboard_count_ary));
            let aggregate_data_lng = dashboard_count_ary[0].aggregate_data.length;
            let resizable_counter = dashboard_menu_array[0].counter;

            let pivot_config = dashboard_menu_array[0].pivot_config;
            if (pivot_config == '' || pivot_config == null || pivot_config == undefined) {
                var pivot_type = 'Table';
            }
            else {
                var pivot_type = pivot_config[0].pivot_type;
            }

            if (aggregate_data_lng > 500 || chart_type == 'pivot' && (pivot_type != 'Horizontal Stacked Bar Chart' || resizable_counter == '_')) {


                $('#menucardid_' + resizable_counter).find('.apexcharts-canvas').hide();
                $('#menucardid_' + resizable_counter).find('.cls_card_filter_items').hide();
                $('#menucardid_' + resizable_counter).find('.cls_card_aggregate_fun').hide();

                $('#menucardid_' + resizable_counter).find('.cls_tochange_view').removeClass('view_type_active');
                $('#menucardid_' + resizable_counter).find('.cls_tbl_view').addClass('view_type_active');

                render_table(dashboard_count_ary, JSON.stringify(dashboard_menu_array[0]));

                if ($('#menucardid_' + resizable_counter).find('.tbl_container').html() == '') {
                    $('#menucardid_' + resizable_counter).find('.tbl_container').hide();
                }
                else {
                    $('#menucardid_' + resizable_counter).find('.tbl_container').show();
                }
                $('#hdn_menucardid_' + resizable_counter).attr('dashboard_count', encodeURIComponent(JSON.stringify(dashboard_count_ary)));
            }
            else {
                render_dashboard(dashboard_count_ary, JSON.stringify(dashboard_menu_array), flag_dashboard);
                render_table(dashboard_count_ary, JSON.stringify(dashboard_menu_array[0]));

                if (card_view == 'table_view') {
                    $('.cls_card_filter_items').hide();
                    $('#menucardid_' + resizable_counter).find('.apexcharts-canvas').hide();
                    if ($('#menucardid_' + resizable_counter).find('.tbl_container').html() == '') {
                        $('#menucardid_' + resizable_counter).find('.tbl_container').hide();
                    }
                    else {
                        $('#menucardid_' + resizable_counter).find('.tbl_container').show();
                    }
                    $('#menucardid_' + resizable_counter).find('.cls_card_filter_items').hide();
                    $('#menucardid_' + resizable_counter).find('.cls_card_aggregate_fun').hide();
                }
                else {
                    $('.cls_card_filter_items').show();
                    $('#menucardid_' + resizable_counter).find('.tbl_container').hide();
                    $('#menucardid_' + resizable_counter).find('.apexcharts-canvas').show();
                    $('#menucardid_' + resizable_counter).find('.cls_card_filter_items').show();
                    $('#menucardid_' + resizable_counter).find('.cls_card_aggregate_fun').show();
                }
            }

            if (calendar_data == '' || calendar_data == null || calendar_data == undefined) { }
            else {
                calendar_data = JSON.parse(decodeURIComponent(calendar_data));
                set_trend_count(calendar_data, dashboard_menu_array);
            }
        }

        if (flag_view == 'preview') { }
        else {
            $('.single_tab').unbind('click');
        }
        $('.single_tab').click(function (e) {
            e.stopPropagation();
            if (flag_view == 'preview') { }
            else {
                if (is_elem_dragged) {
                    is_elem_dragged = false;
                    return;
                }
                let obj = e.currentTarget;
                let card_hdn_json = $(obj).find('input[type="hidden"]').val();
                card_hdn_json = JSON.parse(decodeURIComponent(card_hdn_json));
                let chart_type = card_hdn_json.type;
                if (chart_type == 'pivot') { }
                else {
                    let udf_id = $(obj).attr('udf_id');
                    let tab_id = card_hdn_json.tab_id;
                    var def_fltr_array = card_hdn_json.default_filter;
                    var url_array = [];
                    if (def_fltr_array == '' || def_fltr_array == null || def_fltr_array == undefined) { }
                    else {
                        if (def_fltr_array.length > 0) {
                            // Also apply default filter on single tab's counter columndata 
                            for (let d = 0; d < def_fltr_array.length; d++) {
                                let def_fltr_val = def_fltr_array[d].value;
                                let ctrl_type = def_fltr_array[d].ctrl_type;
                                if (ctrl_type == 8) {
                                    let calendar_type = def_fltr_array[d].calendar_type;
                                    let cal_value = [];
                                    if (calendar_type == 'is_before' || calendar_type == 'is_after' || calendar_type == 'is_between') { }
                                    else {
                                        cal_value = get_date_as_per_condition(calendar_type);
                                        if (def_fltr_val == '' || def_fltr_val == null || def_fltr_val == undefined) {
                                            def_fltr_array[d]['value'] = cal_value;
                                            def_fltr_val = cal_value;
                                        }
                                        else {
                                            def_fltr_val = cal_value;
                                        }
                                    }
                                }

                                let def_header = def_fltr_array[d].columnName;
                                let equation = def_fltr_array[d].Equation;
                                url_array.push({
                                    [def_header]: def_fltr_val,
                                    'Equation': equation
                                });
                            }
                            //url_array = JSON.stringify(url_array);
                        }
                    }

                    var udf_json = $('#hdn_' + udf_id + '').val();
                    udf_json = JSON.parse(decodeURIComponent(udf_json));
                    let tab_index = 0;
                    for (let t = 0; t < udf_json.length; t++) {
                        var t_tab_id = udf_json[t].tab_id;
                        if (t_tab_id == tab_id) {
                            tab_index = t;
                            break;
                        }
                    }

                    url_array = JSON.stringify(url_array);
                    storage.setItem('av', url_array);

                    let chart_click_json = $('li[udf_id="' + udf_id + '"]').attr('chart_click_json');
                    chart_click_json = decodeURIComponent(chart_click_json);
                    if (chart_click_json == '' || chart_click_json == null || chart_click_json == undefined) { }
                    else {
                        chart_click_json = JSON.parse(chart_click_json);
                        var flow_name = chart_click_json[0].flow_name;
                        var flow_id = chart_click_json[0].flow_id;
                        var type = chart_click_json[0].type;
                        var role_id = chart_click_json[0].role_id;

                        if (is_chartchange_flag == 1) {
                            let confirm_val = confirm("Do you want to redirect on task listing?");
                            if (confirm_val == true) {
                                is_chartchange_flag = 0;
                                redirect_on_module_click(flow_name, udf_id, flow_id, type, role_id, 'redirect_on_chart', tab_index);
                            }
                        }
                        else {
                            redirect_on_module_click(flow_name, udf_id, flow_id, type, role_id, 'redirect_on_chart', tab_index);
                        }
                    }
                }
            }
        });

        $('.single_tab').mousemove(function (e) {
            is_elem_dragged == true;
        });

        $('.cls_filter_chart').unbind('click');
        $('.cls_filter_chart').click(function (e) {
            e.stopPropagation();
            let elem = e.target;

            myApp.popup('.popup-advance-search-online');
            $('#tbl_advance_colSearch').empty();
            open_adv_fltr_popup_for_charts('btn_click', 'Update', 'outer_filter', elem);
        });

        $('.cls_tochange_view').click(function (e) {
            e.stopPropagation();
            let elem = e.target;

            let chart_data = $(elem).siblings('input[type=hidden]').attr('dashboard_count');
            if (chart_data == '' || chart_data == null || chart_data == undefined) { }
            else {
                chart_data = JSON.parse(decodeURIComponent(chart_data));
                let chart_aggregate_lng = chart_data[0].aggregate_data.length;
                if (chart_aggregate_lng > 500) {
                    if ($(elem).hasClass('cls_chart_view') == true) {
                        alert('Data is too long to display in chart.');
                    }
                    $(elem).siblings('.apexcharts-canvas').hide();
                    $(elem).siblings('.tbl_container').show();
                    $(elem).siblings('.cls_card_filter_items').hide();
                }
                else {
                    $(elem).siblings().removeClass('view_type_active');
                    $(elem).addClass('view_type_active');
                    if ($(elem).siblings('.tbl_container').html() == '') { }
                    else {
                        if ($(elem).hasClass('cls_chart_view') == true) {
                            $(elem).siblings('.apexcharts-canvas').show();
                            $(elem).siblings('.tbl_container').hide();
                            $(elem).siblings('.cls_card_filter_items').show();
                            $(elem).siblings('.cls_card_aggregate_fun').show();
                        }
                        else {
                            $(elem).siblings('.apexcharts-canvas').hide();
                            $(elem).siblings('.tbl_container').show();
                            $(elem).siblings('.cls_card_filter_items').hide();
                            $(elem).siblings('.cls_card_aggregate_fun').hide();
                        }
                    }
                }
            }
        });

        $('.cls_max_preview').unbind('click');
        $('.cls_max_preview').click(function (e) {
            var elem = e.target;
            if ($(elem).hasClass('cls_max_preview')) {
                if ($(elem).parent().hasClass('cls_max_card')) {
                    $(elem).find('i').removeClass('fa-window-minimize').addClass('fa-window-maximize');
                    $(elem).parent().removeClass('cls_max_card');
                    $(elem).find('i').css('vertical-align', 'middle');
                }
                else {
                    $(elem).find('i').removeClass('fa-window-maximize').addClass('fa-window-minimize');
                    $(elem).parent().addClass('cls_max_card');
                    $(elem).find('i').css('vertical-align', 'super');
                }
            }
            else {
                if ($(elem).parent().parent().hasClass('cls_max_card')) {
                    $(elem).removeClass('fa-window-minimize').addClass('fa-window-maximize');
                    $(elem).parent().parent().removeClass('cls_max_card');
                    $(elem).css('vertical-align', 'middle');
                }
                else {
                    $(elem).removeClass('fa-window-maximize').addClass('fa-window-minimize');
                    $(elem).parent().parent().addClass('cls_max_card');
                    $(elem).css('vertical-align', 'super');
                }
            }
        });

        $('.chart_toolbar').click(function (e) {
            e.stopPropagation();
        });

        $('.delete_chart').unbind('click');
        $('.delete_chart').click(function (e) {
            e.stopPropagation();

            let confirm_val = confirm("Do you want to delete this chart?");
            if (confirm_val == true) {
                var elem = e.target;
                $(elem).parent().remove();
                is_chartchange_flag = 1;
                let dashboard_name = $('#ddl_dashboard_list').val();
                create_update_userdashboard(dashboard_name, 'notrefresh_chart');
            }
        });

    }
    catch (e) {
        alert(e + '_new_dashboard_structure()');
    }
}

get_chart_counter = (dashboard_menu_array, dashboard_id, card_view, flag_dashboard) => {
    try {
        var dashboard_menu_array = JSON.parse(dashboard_menu_array);
        if (dashboard_menu_array.length > 0) {
            // if user_id found
            var company_id = JSON.parse(storage.getItem('company_id'));
            company_id = company_id.replace(/"/g, "");

            var urlParams = new URLSearchParams(window.location.search);
            var get_userid = urlParams.get('user_id');
            if (get_userid == "" || get_userid == null || get_userid == undefined) {
                var sys_var_Array = [];

                // system variables
                var user_id = JSON.parse(storage.getItem('user_id'));
                var user_name = JSON.parse(storage.getItem('user_name'));
                var role_id = JSON.parse(storage.getItem('role_id'));
                var role_name = JSON.parse(storage.getItem('role_name'));
                var circle_id = JSON.parse(storage.getItem('circle_id'));
                var circle_name = JSON.parse(storage.getItem('circle_array'));
                if (circle_name.indexOf(",") > -1) {
                    circle_name = '\'' + circle_name.split(',').join('\',\'') + '\'';
                }

                sys_var_Array.push({ "key": "<#company_id#>", "value": company_id, "ans": company_id });
                sys_var_Array.push({ "key": "<#user_id#>", "value": user_id, "ans": user_id });
                sys_var_Array.push({ "key": "<#user_name#>", "value": user_name, "ans": user_name });
                sys_var_Array.push({ "key": "<#role_id#>", "value": role_id, "ans": role_id });
                sys_var_Array.push({ "key": "<#role_name#>", "value": role_name, "ans": role_name });
                sys_var_Array.push({ "key": "<#circle_id#>", "value": circle_id, "ans": circle_id });
                sys_var_Array.push({ "key": "<#circle_name#>", "value": circle_name, "ans": circle_name });

            }
            else {
                var sys_var_Array = window.localStorage.getItem('system_var');
                sys_var_Array = JSON.parse(sys_var_Array);
            }

            //var company_id = '1840';
            //var sys_var_Array = '[{"key":"<#company_id#>","value":"1840","ans":"1840"},{"key":"<#user_id#>","value":"57859","ans":"57859"},{"key":"<#user_name#>","value":"priyanka.galani","ans":"priyanka.galani"},{"key":"<#role_id#>","value":"6950","ans":"6950"},{"key":"<#role_name#>","value":"Employee","ans":"Employee"},{"key":"<#circle_id#>","value":"20394","ans":"20394"},{"key":"<#circle_name#>","value":"General","ans":"General"}]}]';

            if (dashboard_id == '' || dashboard_id == null || dashboard_id == undefined) {
                dashboard_id = $('#ddl_dashboard_list').val();
            }

            dashboard_menu_array[0]['Company_id'] = company_id;
            dashboard_menu_array[0]['system_var'] = sys_var_Array;

            var chart_type = dashboard_menu_array[0].type;
            if (chart_type == '') {
                let trend_obj = dashboard_menu_array[0].calendar_data;
                if (trend_obj == '' || trend_obj == null || trend_obj == undefined) { }
                else {
                    let calendar_type = trend_obj[0].calendar_type;
                    let cal_value = get_date_as_per_condition(calendar_type);
                    dashboard_menu_array[0].calendar_data[0]['value'] = cal_value;
                    trend_dashboard_array.push(dashboard_menu_array[0]);

                    let def_filter = dashboard_menu_array[0].default_filter;
                    def_filter.push(trend_obj[0]);
                    dashboard_menu_array[0].default_filter = def_filter;
                }
            }

            if (chart_type == 'line') {
                get_chart_counter_for_linechart(dashboard_menu_array, dashboard_id, card_view, flag_dashboard);
            }
            else {
                let flag_api_call = 0;
                if (chart_type == '') {
                    let previous_count = dashboard_menu_array[0].previous_count;
                    let current_count = dashboard_menu_array[0].current_count;
                    let chart_counter = dashboard_menu_array[0].counter;
                    let columndata = dashboard_menu_array[0].columndata;
                    if (columndata.length > 0) {
                        var aggr_fun = columndata[0].aggregate_fun;
                    }

                    if ((previous_count == '' || previous_count == null || previous_count == undefined) && (current_count == '' || current_count == null || current_count == undefined)) {
                        flag_api_call = 0;
                    }
                    else {
                        flag_api_call = 1;
                        dashboard_menu_array.shift();
                        get_chart_counter(JSON.stringify(dashboard_menu_array));
                        get_counter_by_aggregtion(previous_count, current_count, aggr_fun, chart_counter);
                    }
                }

                if (flag_api_call == 0) {

                    var Param_obj = [];
                    Param_obj.push(dashboard_menu_array[0]);

                    // loading('Loading Dashboard');
                    var getdata = new Webservicecall_REST(global_wcf_url + 'Dashboard_count_new', JSON.stringify(Param_obj), function (e) {
                        var All_data = e.responseText;
                        All_data = JSON.parse(All_data);
                        var status = All_data[0].status;
                        var message = All_data[0].message;
                        if (status == 1) {
                            var data = All_data[0]["data"];
                            if (data == '' || data == null || data == undefined) { }
                            else {
                                if (data instanceof Object) { }
                                else {
                                    data = JSON.parse(data);
                                }

                                let resizable_counter = dashboard_menu_array[0].counter;
                                let aggregate_data_lng = data[0].aggregate_data.length;

                                let pivot_config = dashboard_menu_array[0].pivot_config;
                                if (pivot_config == '' || pivot_config == null || pivot_config == undefined) {
                                    var pivot_type = 'Table';
                                }
                                else {
                                    var pivot_type = pivot_config[0].pivot_type;
                                }
                                if (aggregate_data_lng > 500 || chart_type == 'pivot' && (pivot_type != 'Horizontal Stacked Bar Chart' || resizable_counter == '_')) {
                                    $('#menucardid_' + resizable_counter).find('.apexcharts-canvas').hide();
                                    $('#menucardid_' + resizable_counter).find('.cls_card_filter_items').hide();
                                    $('#menucardid_' + resizable_counter).find('.cls_card_aggregate_fun').hide();

                                    $('#menucardid_' + resizable_counter).find('.cls_tochange_view').removeClass('view_type_active');
                                    $('#menucardid_' + resizable_counter).find('.cls_tbl_view').addClass('view_type_active');
                                    $('#menucardid_' + resizable_counter).find('.cls_tochange_view').css('pointer', 'none');

                                    render_table(data, JSON.stringify(dashboard_menu_array[0]));

                                    if ($('#menucardid_' + resizable_counter).find('.tbl_container').html() == '') {
                                        $('#menucardid_' + resizable_counter).find('.tbl_container').hide();
                                    }
                                    else {
                                        $('#menucardid_' + resizable_counter).find('.tbl_container').show();
                                    }
                                    $('#hdn_menucardid_' + resizable_counter).attr('dashboard_count', encodeURIComponent(JSON.stringify(data)));
                                }
                                else {
                                    render_dashboard(data, JSON.stringify(dashboard_menu_array), flag_dashboard);
                                    render_table(data, JSON.stringify(dashboard_menu_array[0]));

                                    if (card_view == '' || card_view == null || card_view == undefined) {
                                        let check_view = $('#toggle_chart_tbl').find('.view_type_active').attr('view_type');
                                        if (check_view == 'chart_view') {
                                            $('#menucardid_' + resizable_counter).find('.apexcharts-canvas').show();
                                            $('#menucardid_' + resizable_counter).find('.tbl_container').hide();
                                            $('#menucardid_' + resizable_counter).find('.cls_card_filter_items').show();
                                            $('#menucardid_' + resizable_counter).find('.cls_card_aggregate_fun').show();
                                        }
                                        else {
                                            $('#menucardid_' + resizable_counter).find('.apexcharts-canvas').hide();
                                            $('.menucard').find('.tbl_container').each(function () {
                                                if ($(this).html() == '') {
                                                    $(this).hide();
                                                }
                                                else {
                                                    $(this).show();
                                                }
                                            });
                                            $('#menucardid_' + resizable_counter).find('.cls_card_filter_items').hide();
                                        }
                                    }
                                    else {
                                        if (card_view == 'table_view') {
                                            if ($('#menucardid_' + resizable_counter).find('.tbl_container').html() == '') {
                                                $('#menucardid_' + resizable_counter).find('.tbl_container').hide();
                                            }
                                            else {
                                                $('#menucardid_' + resizable_counter).find('.tbl_container').show();
                                            }

                                            $('#menucardid_' + resizable_counter).find('.apexcharts-canvas').hide();
                                            $('#menucardid_' + resizable_counter).find('.cls_card_filter_items').hide();
                                            $('#menucardid_' + resizable_counter).find('.cls_card_aggregate_fun').hide();
                                        }
                                        else {
                                            $('#menucardid_' + resizable_counter).find('.tbl_container').hide();
                                            $('#menucardid_' + resizable_counter).find('.apexcharts-canvas').show();
                                            $('#menucardid_' + resizable_counter).find('.cls_card_filter_items').show();
                                            $('#menucardid_' + resizable_counter).find('.cls_card_aggregate_fun').show();
                                        }
                                    }
                                }
                            }
                            dashboard_menu_array.shift();
                            get_chart_counter(JSON.stringify(dashboard_menu_array), '', '', flag_dashboard);
                        }
                        else if (status == 3) {
                            mk_notify(message);
                            loading_hide();
                            dashboard_menu_array.shift();
                            get_chart_counter(JSON.stringify(dashboard_menu_array), '', '', flag_dashboard);
                        }
                        else {
                            mk_notify(message);
                            loading_hide();
                        }

                        if (dashboard_menu_array.length == 0) {
                            if (trend_dashboard_array.length > 0) {
                                get_prev_trend_count(flag_dashboard);
                            }
                        }
                    }, onfail_request);
                    getdata.callOtherDomain();
                }
            }
        }
    }
    catch (e) {
        alert(e + '_get_chart_counter');
    }
}

// used for counter card only
get_counter_by_aggregtion = (previous_count_title, current_count_title, aggr_fun, chart_counter) => {

    var previous_count = $('div[card_name="' + previous_count_title + '"]').find('.tab_count').text();
    var current_count = $('div[card_name="' + current_count_title + '"]').find('.tab_count').text();

    if (previous_count == '' || previous_count == null || previous_count == undefined || current_count == '' || current_count == null || current_count == undefined) {
        setTimeout(function () {
            get_counter_by_aggregtion(previous_count, current_count, aggr_fun, chart_counter);
        }, 2000);
    }
    else {
        previous_count = previous_count.replaceAll(',', '');
        current_count = current_count.replaceAll(',', '');

        previous_count = parseInt(previous_count);
        current_count = parseInt(current_count);

        let value = '';
        if (aggr_fun == 'sum') {
            value = previous_count + current_count;
        }
        else if (aggr_fun == 'min') {
            if (previous_count > current_count) {
                value = current_count;
            }
            else {
                value = previous_count;
            }
        }
        else if (aggr_fun == 'max') {
            if (previous_count > current_count) {
                value = previous_count;
            }
            else {
                value = current_count;
            }
        }
        else if (aggr_fun == 'avg') {
            value = (previous_count + current_count) / 2;
        }
        else {
            value = (current_count / previous_count) * 100;
            value = value.toFixed(2) + '%';
        }

        $('#menucardid_' + chart_counter).find('.tab_count').text(value);
    }
}

render_table = (chart_counter_array, new_dashboard_menu_array) => {
    try {
        let dashboard_menu_array = JSON.parse(new_dashboard_menu_array);
        let chart_aggregate_data = chart_counter_array[0].aggregate_data;
        var chart_count_array = chart_counter_array[0].cont_;
        let t_id = dashboard_menu_array.tab_id;
        let submenu = dashboard_menu_array.submenu;
        let col_data_array = dashboard_menu_array.columndata;
        let counter = dashboard_menu_array.counter;
        let card_title = dashboard_menu_array.title;
        let udf_id = dashboard_menu_array.udf_id;
        let chart_type = dashboard_menu_array.type;
        let def_filter = dashboard_menu_array.default_filter;

        let num_format_obj = new Intl.NumberFormat('en-IN');

        if (chart_type == 'pivot') {
            let pivot_config = dashboard_menu_array.pivot_config;
            if (pivot_config == '' || pivot_config == null || pivot_config == undefined) {
                var pivot_type = 'Table';
            }
            else {
                var pivot_type = pivot_config[0].pivot_type;
                var pivot_aggregator = pivot_config[0].pivot_aggregator;
                if (pivot_aggregator == '' || pivot_aggregator == null || pivot_aggregator == undefined) {
                    pivot_aggregator = 'Integer Sum';
                }
            }
        }

        var tbl_str = '';
        if ((chart_aggregate_data == '' || chart_aggregate_data == null || chart_aggregate_data == undefined) && (submenu.length == 0 && chart_count_array[0] == 0)) {
            $('#menucardid_' + counter).find('.cls_no_data_found').show();
            if (chart_type == 'pivot') {
                $('#menucardid_' + counter).find('.cls_no_data_found').css('z-index', '2');
                $('#menucardid_' + counter).find('.cls_no_data_found').css('position', 'relative');
                $('#menucardid_' + counter).find('.cls_no_data_found').css('margin-top', '100px');

                let str = '<span class="apexcharts-title-text cls_pivot_span" title="' + card_title + '">' + card_title + '</span>';
                $('#menucardid_' + counter).append(str);

            }
        }
        else if ((chart_aggregate_data == '' || chart_aggregate_data == null || chart_aggregate_data == undefined) || t_id == '') {
            let total = 0;

            if (submenu.length > 0) {
                tbl_str += '<span class="span_total_record">Total Records: ' + submenu.length + '</span>';
            }
            else {
                tbl_str += '<span class="span_total_record">Total Records: 1</span>';
            }

            tbl_str += '<table class="table mk_table"><thead style="position: sticky;top: -1px;z-index: 99;background-color: lightgrey;"><tr><th colspan="2" style="text-align: center;font-size: 15px;background-color: white;">' + card_title + '</th></tr><tr><th>X-axis</th><th>Count</th></tr></thead><tbody>';
            if (submenu.length > 0) {
                // Multiple tab (All UDF)
                for (let s = 0; s < submenu.length; s++) {
                    var tab_name = submenu[s].tab_name;
                    var tab_id = submenu[s].tab_id;

                    for (let c = 0; c < chart_counter_array.length; c++) {
                        var chart_tab_id = chart_counter_array[c].Tab_id;
                        if (tab_id == chart_tab_id) {
                            var multi_tab_count = chart_counter_array[c].cont_[0];
                            total += multi_tab_count;
                            break;
                        }
                    }
                    let tr_param = "redirect_on_chart_click('" + card_title + "','" + tab_name + "','','" + counter + "')";
                    tbl_str += '<tr onclick="' + tr_param + '"><td>' + tab_name + '</td><td>' + multi_tab_count + '</td></tr>';
                }
            }
            else {
                // Single tab without groupby (counter tab)
                if ((chart_aggregate_data == '' || chart_aggregate_data == null || chart_aggregate_data == undefined) && col_data_array.length > 0) { }
                else {
                    var tab_name = dashboard_menu_array.title;
                    var multi_tab_count = chart_counter_array[0].cont_[0];

                    multi_tab_count = num_format_obj.format(multi_tab_count);

                    tbl_str += '<tr><td>' + tab_name + '</td><td>' + multi_tab_count + '</td></tr>';
                    total += multi_tab_count;
                }
            }

            tbl_str += '<tr><td>Total</td><td>' + total + '</td></tr>';
            tbl_str += '</tbody><table>';
        }
        else if ((chart_aggregate_data != '' || chart_aggregate_data != null || chart_aggregate_data != undefined) && chart_type == 'pivot' && (pivot_type != 'Horizontal Stacked Bar Chart' || counter == '_')) {
            let aggr_col_array = [], groupby_col_array = [], pivot_tbl_data = [], pivotRow_array = [], pivotCol_array = [], sub_menu_array = [];

            $('#menucardid_' + counter).find('.tbl_container').empty();
            $('#hdn_menucardid_' + counter).val(encodeURIComponent(JSON.stringify(dashboard_menu_array)));
            for (let c = 0; c < col_data_array.length; c++) {
                let col_header = col_data_array[c].header;
                let aggregate_fun = col_data_array[c].aggregate_fun;
                let custom_header = col_data_array[c].custom_header;

                if (aggregate_fun == 'group_by') {
                    groupby_col_array.push(col_header);
                }
                else {
                    aggr_col_array.push({
                        header: col_header,
                        custom_header: custom_header
                    });
                }

                let pivotRow = col_data_array[c].pivotRow;
                let pivotCol = col_data_array[c].pivotCol;
                if (pivotRow == true) {
                    if (aggregate_fun == 'group_by') {
                        pivotRow_array.push(col_header);
                    }
                    else {
                        if (pivotRow_array.indexOf('Indice') == -1) {
                            pivotRow_array.push('Indice');
                        }
                    }
                }
                else if (pivotCol == true) {
                    if (aggregate_fun == 'group_by') {
                        pivotCol_array.push(col_header);
                    }
                    else {
                        if (pivotCol_array.indexOf('Indice') == -1) {
                            pivotCol_array.push('Indice');
                        }
                    }
                }
            }

            for (let d = 0; d < chart_aggregate_data.length; d++) {
                if (aggr_col_array.length == 0) {
                    let col_val = chart_aggregate_data[d].value;

                    pivot_tbl_data.push({
                        'Value': col_val,
                    });

                    for (let b = 0; b < groupby_col_array.length; b++) {
                        let col_name = groupby_col_array[b];
                        let col_val = chart_aggregate_data[d][col_name]

                        pivot_tbl_data[d][col_name] = col_val;
                    }
                }
                else {
                    for (let a = 0; a < aggr_col_array.length; a++) {
                        let col_name = aggr_col_array[a].header;
                        let col_val = chart_aggregate_data[d][col_name];

                        col_name = aggr_col_array[a].custom_header;
                        if (col_name == '' || col_name == null || col_name == undefined) {
                            col_name = aggr_col_array[a].header;
                        }

                        pivot_tbl_data.push({
                            'Value': col_val,
                            'Indice': col_name,
                        });

                        for (let b = 0; b < groupby_col_array.length; b++) {
                            let col_name = groupby_col_array[b];
                            let col_val = chart_aggregate_data[d][col_name];

                            Object.entries(pivot_tbl_data[pivot_tbl_data.length - 1][col_name] = col_val);
                        }
                    }
                }
            }

            if ('#menucardid_' + counter == '#menucardid__') { }
            else {
                menu_arry.push(dashboard_menu_array);
            }

            let str = '<span class="apexcharts-title-text cls_pivot_span" title="' + card_title + '">' + card_title + '</span>';
            $('#menucardid_' + counter).append(str);

            let pivot_config = dashboard_menu_array.pivot_config;
            if (pivot_config == '' || pivot_config == null || pivot_config == undefined) {
                var pivot_type = 'Table';
            }
            else {
                var pivot_type = pivot_config[0].pivot_type;
            }

            let HiddenAttributes = [];
            stdRendererNames = ["Table", "Table Barchart", "Heatmap", "Row Heatmap", "Col Heatmap"];
            let wrappedRenderers = $.extend($.pivotUtilities.renderers, $.pivotUtilities.plotly_renderers);

            let chart_id = '#menucardid_' + counter;
            let pvtOpts = {
                hiddenAttributes: HiddenAttributes,
                renderers: wrappedRenderers,
                rendererName: pivot_type,
                vals: ['Value'],
                rows: pivotRow_array,
                cols: pivotCol_array,
                aggregatorName: pivot_aggregator,
                onRefresh: function (config) {
                    onPivotTableRefresh(config, chart_id);
                },
                rendererOptions: {
                    table: {
                        clickCallback: function (e, value, filters, pivotData) {
                            let click_menu = card_title;
                            if (counter != '_') {
                                let curr_obj = $(e)[0].target;
                                if ($(curr_obj).hasClass('pvtGrandTotal')) { }
                                else {
                                    //redirect pivot cell click     || $(curr_obj).hasClass('colTotal')
                                    redirect_tab_using_pivot_table(filters, click_menu, counter);
                                }
                            }
                        }
                    }
                }
            }
            $('#menucardid_' + counter + ' .tbl_container').pivotUI(pivot_tbl_data, pvtOpts);

            if (def_filter.length == 0) {
                $('#menucardid_' + counter + ' .tbl_container .pvtUi').css('margin-top', '25px');
                $('#menucardid_' + counter + ' .cls_card_filter_items').css('top', '0px');
            }
            else {
                $('#menucardid_' + counter + ' .cls_card_filter_items').css('top', '22px');
                $('#menucardid_' + counter).find('.cls_card_filter_items').show();
                $('#menucardid_' + counter + ' .tbl_container .pvtUi').css('margin-top', '40px');
            }

            $('#menucardid_' + counter + ' .tbl_container').css('cursor', 'default');

            $('#menucardid_' + counter + ' .tbl_container .pvtUi .pvtUnused li').each(function () {
                let elem_deleted = $(this).find('.pvtAttr').text();
                if (elem_deleted.indexOf('Value') > -1) {
                    $(this).css('display', 'none');
                }
            });

            setTimeout(function () {
                // show vertical total for only one row 08112024 PG
                if ($('#menucardid_' + counter + ' .tbl_container .pvtUi .pvtVal').length == 0) {
                    $('#menucardid_' + counter + ' .tbl_container .pvtUi .pvtRowTotalLabel').attr('style', 'display:block !important');
                    $('#menucardid_' + counter + ' .tbl_container .pvtUi .rowTotal').attr('style', 'display:block !important');
                    $('#menucardid_' + counter + ' .tbl_container .pvtUi .pvtGrandTotal').attr('style', 'display:block !important');
                    let th_height = $('#menucardid_' + counter + ' table.pvtTable tbody tr th').css('height');
                    $('#menucardid_' + counter + ' table.pvtTable tbody tr td').css('height', th_height);
                }

                $('.pvtTable').on('touchmove', function (e) {
                    e.stopPropagation();
                });
            }, 100);

            let row_param = 'add_new_pivot_row_column(' + udf_id + ',"' + counter + '")';
            let row_btn = "<button type='button' id='btn_add_row' class='btn-primary form-control' onclick='" + row_param + "' title='Add Groupby Column'>Add Groupby</button>";
            $('#menucardid_' + counter + ' .tbl_container .pvtUi .pvtUnused').prepend(row_btn);

            if (counter == '_') {
                $('#menucardid_' + counter + ' .tbl_container .pvtUi .pvtAttr').each(function () {
                    let chk_txt = $(this).contents().first().text();
                    if (chk_txt == 'Indice') {
                        $(this).attr('title', 'Aggregation columns');
                    }
                    else {
                        $(this).attr('title', 'Groupby columns');
                    }
                });
            }
            else {
                $('#menucardid_' + counter).find('.pvtUiCell').css('display', 'none');        // hide config option from dashboard
                $('#menucardid_' + counter).find('.pvtHorizList').parent().css('display', 'none');
            }
        }
        else if ((chart_aggregate_data != '' || chart_aggregate_data != null || chart_aggregate_data != undefined) && (chart_type == '' && col_data_array.length == 1)) {
            // single tab with aggregation function
            var aggr_col_data = [];
            for (let i = 0; i < col_data_array.length; i++) {
                let aggregate_name = col_data_array[i].aggregate_fun;
                if (aggregate_name == 'sum' || aggregate_name == 'min' || aggregate_name == 'max' || aggregate_name == 'avg') {
                    aggr_col_data.push(col_data_array[i]);
                }
            }

            let total = 0, total1 = 0;
            let aggregate_fun = aggr_col_data[0].aggregate_fun;
            var tab_name = aggr_col_data[0].header;
            tbl_str += '<span class="span_total_record">Total Records: ' + chart_aggregate_data.length + '</span>';
            tbl_str += '<table class="table mk_table"><thead style="position: sticky;top: -1px;z-index: 99;background-color: lightgrey;"><tr><th colspan="3" style="text-align: center;font-size: 15px;background-color: white;">' + card_title + '</th></tr><tr><th>' + tab_name + '</th><th style="text-transform: capitalize;">' + aggregate_fun + '</th><th>Count</th></tr></thead><tbody>';
            for (let j = 0; j < chart_aggregate_data.length; j++) {
                var tab_val = chart_aggregate_data[j].value;
                if (tab_val == '' || tab_val == null || tab_val == undefined) {
                    tab_val = 0;
                }
                else {
                    tab_val = parseInt(tab_val);
                }
                total = tab_val;

                let aggregate_val = parseInt(chart_aggregate_data[j][tab_name]);
                aggregate_val = num_format_obj.format(aggregate_val);

                total1 = aggregate_val;

                let tr_param = "redirect_on_chart_click('" + card_title + "','" + tab_name + "','','" + counter + "')";
                tbl_str += '<tr onclick="' + tr_param + '"><td>' + tab_name + '</td><td>' + aggregate_val + '</td><td>' + tab_val + '</td></tr>';
            }
            tbl_str += '<tr><td>Total</td><td>' + total1 + '</td><td>' + total + '</td></tr>';
            tbl_str += '</tbody><table>';
        }
        else {
            // Single tab with groupby
            var aggr_col_data = [];
            var col_data = [];

            if (chart_type == 'line') {
                if (col_data_array == '' || col_data_array == null || col_data_array == undefined) {
                    let cal_data = dashboard_menu_array.calendar_data;
                    if (cal_data.length > 0) {
                        let checksheetID = cal_data.checksheetID;
                        let checksheet_type = cal_data.checksheet_type;
                        let ctrl_type = cal_data.ctrl_type;
                        let group_date_type = cal_data.group_date_type;
                        let header = cal_data.columnName;
                        let qid = cal_data.qid;
                        let step = cal_data.step;

                        let cal_obj = [];
                        cal_obj.push({
                            'aggregate_fun': 'group_by',
                            'checksheetID': checksheetID,
                            'checksheet_type': checksheet_type,
                            'ctrl_type': ctrl_type,
                            'group_date_type': group_date_type,
                            'header': header,
                            'qid': qid,
                            'step': step,
                            'system_var': ''
                        });
                        col_data_array = cal_obj;
                    }
                }
            }

            for (let i = 0; i < col_data_array.length; i++) {
                let aggregate_name = col_data_array[i].aggregate_fun;
                if (aggregate_name == 'group_by') {
                    col_data.push(col_data_array[i]);
                }
                else if (aggregate_name == 'sum' || aggregate_name == 'min' || aggregate_name == 'max' || aggregate_name == 'avg') {
                    aggr_col_data.push(col_data_array[i]);
                }
            }

            if (col_data.length == 1 || aggr_col_data.length == 1) {
                // Single tab with 1 groupby & 1 aggregate function 
                let total = 0, total1 = 0;
                if (aggr_col_data == '' || aggr_col_data == null || aggr_col_data == undefined) {
                    // groupby
                    tbl_str += '<span class="span_total_record">Total Records: ' + chart_aggregate_data.length + '</span>';
                    tbl_str += '<table class="table mk_table" style=><thead style="position: sticky;top: -1px;z-index: 99;background-color: lightgrey;"><tr><th colspan="2" style="text-align: center;font-size: 15px;background-color: white;">' + card_title + '</th></tr><tr><th>' + col_data[0].header + '</th><th>Count</th></tr></thead><tbody>';
                    for (let j = 0; j < chart_aggregate_data.length; j++) {
                        var tab_name = chart_aggregate_data[j][col_data[0].header];
                        var tab_val = parseInt(chart_aggregate_data[j].value);
                        total += parseInt(tab_val);
                        let tr_param = "redirect_on_chart_click('" + card_title + "','" + tab_name + "','','" + counter + "')";
                        tbl_str += '<tr onclick="' + tr_param + '"><td>' + tab_name + '</td><td>' + tab_val + '</td></tr>';
                    }
                    tbl_str += '<tr><td>Total</td><td>' + total + '</td></tr>';
                }
                else {
                    //  groupby & aggregate function
                    let aggregate_fun = aggr_col_data[0].aggregate_fun;
                    tbl_str += '<span class="span_total_record">Total Records: ' + chart_aggregate_data.length + '</span>';
                    tbl_str += '<table class="table mk_table"><thead style="position: sticky;top: -1px;z-index: 99;background-color: lightgrey;"><tr><th colspan="3" style="text-align: center;font-size: 15px;background-color: white;">' + card_title + '</th></tr><tr><th>' + col_data[0].header + '</th><th style="text-transform: capitalize;">' + aggr_col_data[0].header + ' - ' + aggregate_fun + '</th><th>Count</th></tr></thead><tbody>';
                    for (let j = 0; j < chart_aggregate_data.length; j++) {
                        var tab_name = chart_aggregate_data[j][col_data[0].header];
                        var tab_val = parseInt(chart_aggregate_data[j].value);
                        total += parseInt(tab_val);

                        let col_header = aggr_col_data[0].header;
                        let aggregate_val = parseInt(chart_aggregate_data[j][col_header]);

                        total1 += parseInt(aggregate_val);

                        let tr_param = "redirect_on_chart_click('" + card_title + "','" + tab_name + "','','" + counter + "')";
                        tbl_str += '<tr onclick="' + tr_param + '"><td>' + tab_name + '</td><td>' + aggregate_val + '</td><td>' + tab_val + '</td></tr>';
                    }
                    tbl_str += '<tr><td>Total</td><td>' + total1 + '</td><td>' + total + '</td></tr>';
                }
                tbl_str += '</tbody><table>';
            }
            else {
                // Single tab with 2 groupby (stackbar/stackcolumn)
                let X_Array = [];
                for (j = 0; j < chart_aggregate_data.length; j++) {
                    let submenu_name = chart_aggregate_data[j][col_data[0].header];
                    if (X_Array.includes(submenu_name) == true) { }
                    else {
                        X_Array.push(submenu_name);
                    }
                }

                let series_Array = [];
                for (let y = 0; y < chart_aggregate_data.length; y++) {
                    let submenu_name = chart_aggregate_data[y][col_data[0].header];

                    for (let c = 1; c < col_data.length; c++) {
                        let GB_name = chart_aggregate_data[y][col_data[c].header];
                        let GB_val = parseInt(chart_aggregate_data[y].value);

                        let found = 0;
                        for (let s = 0; s < series_Array.length; s++) {
                            var t_name = series_Array[s].name;
                            if (GB_name == t_name) {
                                found++;
                            }
                        }

                        if (found == 0) {
                            // name not found
                            let data_Array = [];
                            let x_index = X_Array.indexOf(submenu_name);
                            for (let x = 0; x < X_Array.length; x++) {
                                if (x == x_index) {
                                    data_Array.push(GB_val);
                                }
                                else {
                                    data_Array.push(0);
                                }
                            }

                            let t_series_obj = {
                                name: GB_name,
                                data: data_Array
                            }
                            series_Array.push(t_series_obj);
                        }
                        else {
                            // name found
                            for (let s = 0; s < series_Array.length; s++) {
                                let t_name = series_Array[s].name;
                                if (t_name == GB_name) {
                                    let x_index = X_Array.indexOf(submenu_name);
                                    series_Array[s].data[x_index] = GB_val;
                                    break;
                                }
                            }
                        }
                    }
                }

                let colspan_val = series_Array.length + 2;
                tbl_str += '<span class="span_total_record">Total Records: ' + X_Array.length + '</span>';
                tbl_str += '<table class="table mk_table"><thead style="position: sticky;top: -1px;z-index: 99;background-color: lightgrey;"><tr><th colspan="' + colspan_val + '" style="text-align: center;font-size: 15px;background-color: white;">' + card_title + '</th></tr><tr><th colspan="' + colspan_val + '" style="text-align: center;">' + col_data[1].header + '</th></tr><tr rowspan="2"><th>' + col_data[0].header + '</th>';
                tbl_str += '';
                for (let t = 0; t < series_Array.length; t++) {
                    let y_axis = series_Array[t].name;

                    let th_param = "redirect_on_chart_click('" + card_title + "', '" + y_axis + "', 'legend', '" + counter + "')";
                    tbl_str += '<th onclick="' + th_param + '">' + y_axis + '</th>';
                }
                tbl_str += '<th>Total</th></tr></thead><tbody>';

                for (let c = 0; c < X_Array.length; c++) {
                    tbl_str += '<tr>';
                    let row_name = X_Array[c];

                    let td_param = "redirect_on_chart_click('" + card_title + "', '" + row_name + "', 'label', '" + counter + "')";
                    tbl_str += '<td onclick="' + td_param + '">' + row_name + '</td>';

                    let val_total = 0;
                    for (let t = 0; t < series_Array.length; t++) {
                        let data_val = series_Array[t].data[c];
                        let click_bar_str = series_Array[t].name;

                        let cursor_style = '';
                        if (data_val == 0) {
                            cursor_style = 'cursor:not-allowed;';
                        }
                        let all_td_param = "redirect_on_chart_click('" + card_title + "', '" + row_name + "', '" + click_bar_str + "','" + counter + "')";
                        tbl_str += '<td onclick="' + all_td_param + '" style="' + cursor_style + '">' + data_val + '</td>';
                        val_total += data_val;
                    }
                    tbl_str += '<td>' + val_total + '</td>';
                    tbl_str += '</tr>';
                }

                tbl_str += '<tr>';
                tbl_str += '<td>Total</td>';
                let total = 0;
                for (let t = 0; t < series_Array.length; t++) {
                    let data_val = series_Array[t].data.reduce((a, b) => a + b, 0);
                    tbl_str += '<td>' + data_val + '</td>';
                    total += data_val;
                }
                tbl_str += '<td>' + total + '</td>';
                tbl_str += '</tr>';
                tbl_str += '</tbody><table>';
            }
        }

        $('#menucardid_' + counter).find(".text-secondary").hide();
        $('#menucardid_' + counter).find(".cls_ghost_image").hide();
        if ((chart_aggregate_data != '' || chart_aggregate_data != null || chart_aggregate_data != undefined) && chart_type == 'pivot') {
            $('#menucardid_' + counter).find(".tbl_container").hide();
        }
        else {
            $('#menucardid_' + counter).find('.tbl_container').show();
            $('#menucardid_' + counter).find('.tbl_container').empty();
            $('#menucardid_' + counter).find('.tbl_container').append(tbl_str);
        }
        loading_hide();
    }
    catch (e) {
        alert(e + '_render_table');
    }
}

render_dashboard = (data, new_dashboard_menu_array, flag_dashboard) => {
    var dashboard_menu_array = JSON.parse(new_dashboard_menu_array);
    var chart_aggregate_data = data[0].aggregate_data;
    var chart_count_array = data[0].cont_;

    var submenu = dashboard_menu_array[0].submenu;
    var chart_tab_id = dashboard_menu_array[0].tab_id;
    var chart_udf_id = dashboard_menu_array[0].udf_id;

    var chart_type = dashboard_menu_array[0].type;
    var dashboard_counter = dashboard_menu_array[0].counter;
    var card_title = dashboard_menu_array[0].title;
    var column_data = dashboard_menu_array[0].columndata;

    if (chart_type == 'line') {
        if (column_data == '' || column_data == null || column_data == undefined) {
            let cal_data = dashboard_menu_array[0].calendar_data;
            if (cal_data.length > 0) {
                let checksheetID = cal_data[0].checksheetID;
                let checksheet_type = cal_data[0].checksheet_type;
                let ctrl_type = cal_data[0].ctrl_type;
                let group_date_type = cal_data[0].group_date_type;
                let header = cal_data[0].columnName;
                let qid = cal_data[0].qid;
                let step = cal_data[0].step;

                let cal_obj = [];
                cal_obj.push({
                    'aggregate_fun': 'group_by',
                    'checksheetID': checksheetID,
                    'checksheet_type': checksheet_type,
                    'ctrl_type': ctrl_type,
                    'group_date_type': group_date_type,
                    'header': header,
                    'qid': qid,
                    'step': step,
                    'system_var': ''
                });
                dashboard_menu_array[0].columndata = cal_obj;
            }
        }
    }

    if ((chart_aggregate_data == '' || chart_aggregate_data == null || chart_aggregate_data == undefined) && (submenu.length == 0 && chart_count_array[0] == 0 && chart_type != '')) {
        // No Data Found
        $('#menucardid_' + dashboard_counter).find('.cls_no_data_found').show();
        $('#menucardid_' + dashboard_counter).find(".text-secondary").hide();
        $('#menucardid_' + dashboard_counter).find(".cls_ghost_image").hide();
        let card_top = $('#menucardid_' + dashboard_counter).find('.cls_no_data_found')[0].offsetTop - 9;
        let card_left = $('#menucardid_' + dashboard_counter).find('.cls_no_data_found')[0].offsetLeft - 14;

        $('#menucardid_' + dashboard_counter).find('.cls_no_data_found .cls_card_name').css('margin-top', '-' + card_top + 'px');
        $('#menucardid_' + dashboard_counter).find('.cls_no_data_found .cls_card_name').css('margin-left', '-' + card_left + 'px');
        $('#menucardid_' + dashboard_counter).find('.cls_no_data_found .cls_card_name').append(card_title);

    }
    else if (submenu.length == 0 && chart_aggregate_data.length == 0) {
        // Single tab(Counter tab)
        var tab_id = data[0].Tab_id;
        var udf_id = data[0].udf_id;
        if (chart_tab_id == tab_id && chart_udf_id == udf_id) {
            if (chart_count_array == '' || chart_count_array == null || chart_count_array == undefined) { }
            else {

                let num_format_obj = new Intl.NumberFormat('en-US');
                var tab_count = chart_count_array[0];
                if (tab_count == '' || tab_count == null || tab_count == undefined) {
                    tab_count = 0;
                }
                if (Number.isInteger(tab_count) == true) { }
                else {
                    tab_count = Number(tab_count.toFixed(2))
                }
                tab_count = num_format_obj.format(tab_count);

                $('#menucardid_' + dashboard_counter).find(".tbl_container").hide();
                $('#menucardid_' + dashboard_counter).find(".text-secondary").hide();
                $('#menucardid_' + dashboard_counter).find(".cls_ghost_image").hide();
                $('#menucardid_' + dashboard_counter).find('.tab_count').text(tab_count);
            }
        }
        loading_hide();
    }
    else if ((chart_aggregate_data != '' || chart_aggregate_data != null || chart_aggregate_data != undefined) && (chart_type == '')) {
        // Single tab with aggregation function
        var tab_id = data[0].Tab_id;
        var udf_id = data[0].udf_id;
        if (chart_tab_id == tab_id && chart_udf_id == udf_id) {
            let header = column_data[0].header;

            let num_format_obj = new Intl.NumberFormat('en-US');
            tab_count = data[0].aggregate_data[0][header];
            if (tab_count == '' || tab_count == null || tab_count == undefined) {
                tab_count = 0;
            }
            var tab_count = parseInt(tab_count);
            if (Number.isInteger(tab_count) == true) { }
            else {
                tab_count = Number(tab_count.toFixed(2))
            }
            tab_count = num_format_obj.format(tab_count);

            $('#menucardid_' + dashboard_counter).find(".tbl_container").hide();
            $('#menucardid_' + dashboard_counter).find(".text-secondary").hide();
            $('#menucardid_' + dashboard_counter).find(".cls_ghost_image").hide();
            $('#menucardid_' + dashboard_counter).find('.tab_count').text(tab_count);
        }
        loading_hide();
    }
    else {
        // Multiple tab (Draw chart for all udf and Single tab with groupby)
        chart_initialize(JSON.stringify(data), JSON.stringify(dashboard_menu_array[0]), dashboard_counter, flag_dashboard);
    }
    $('#hdn_menucardid_' + dashboard_counter).attr('dashboard_count', encodeURIComponent(JSON.stringify(data)));
}

// Chart render for multi tab or group by
chart_initialize = (chart_counter_json, dashboard_menu_array, chart_count, flag_dashboard) => {
    try {
        var sub_menu_array = [];

        var chart_counter_json = JSON.parse(chart_counter_json);
        var dashboard_menu_array = JSON.parse(dashboard_menu_array);

        var submenu = dashboard_menu_array.submenu;
        var chart_type = dashboard_menu_array.type;
        var menu_title = dashboard_menu_array.title;

        if (flag_dashboard == 'report') {
            let style_json = dashboard_menu_array.style;
            var chart_height = style_json[0].height;
        }
        else {
            var chart_height = '85%';
        }

        var t_id = dashboard_menu_array.tab_id;
        var def_fltr_array = dashboard_menu_array.default_filter;

        var udf_id = chart_counter_json[0].udf_id;
        var chart_aggregate_data = chart_counter_json[0].aggregate_data;

        var role_id = JSON.parse(storage.getItem('role_id'));

        let pivot_config = dashboard_menu_array.pivot_config;
        if (pivot_config == '' || pivot_config == null || pivot_config == undefined) {
            var pivot_type = 'Table';
        }
        else {
            var pivot_type = pivot_config[0].pivot_type;
        }

        if ((chart_aggregate_data == '' || chart_aggregate_data == null || chart_aggregate_data == undefined) && t_id == '') {
            // Multiple tab (All UDF)
            for (let s = 0; s < submenu.length; s++) {
                var tab_name = submenu[s].tab_name;
                var tab_id = submenu[s].tab_id;
                var role_name = $('#side-menu').find('a[udf_id="' + udf_id + '"]').parent().attr('role_name');
                var check_tab_id = check_tabid_duplication(tab_id, submenu, s, menu_title, role_name);

                let found_flag = 0;
                for (let c = 0; c < chart_counter_json.length; c++) {
                    var chart_tab_id = chart_counter_json[c].Tab_id;
                    if (tab_id == chart_tab_id) {
                        if (check_tab_id == '') {
                            var multi_tab_count = 0;
                        }
                        else {
                            var multi_tab_count = chart_counter_json[c].cont_[0];
                        }

                        found_flag = 1;
                        break;
                    }
                }

                if (found_flag == 1) {
                    var submenu_url = $('a[udf_id="' + udf_id + '"]').attr('href');
                    let obj1 = $('a[udf_id="' + udf_id + '"]').parent();
                    let menu_counter = $('#side-menu').find(obj1).index();
                    sub_menu_array.push({
                        "menu": tab_name,
                        "count": multi_tab_count,
                        "udf_id": udf_id,
                        "url": submenu_url,
                        "role_id": role_id,
                        "font_color": '',
                        "index": menu_counter,
                        "tab_index": s,
                    });
                }
            }
            submenu = sub_menu_array;
            dashboard_menu_array.submenu = sub_menu_array;
        }
        else {
            // single tab with groupby
            var column_data = dashboard_menu_array.columndata;
            var col_header_array = [];
            var flag_aggregate = 0, aggregate_count = 0;
            for (let c = 0; c < column_data.length; c++) {
                var aggregate_function = column_data[c].aggregate_fun;
                if (aggregate_function == 'group_by') {
                    col_header_array.push({
                        'header': column_data[c].header,
                        'ctrl_type': column_data[c].ctrl_type,
                        'group_date_type': column_data[c].group_date_type
                    });
                }
                else {
                    flag_aggregate = 1;
                    aggregate_count++;
                    var aggregate_col_name = column_data[c].header;
                }
            }

            for (let a = 0; a < chart_aggregate_data.length; a++) {

                if (flag_aggregate == 0) {
                    // value for group by
                    var aggregate_col_count = chart_aggregate_data[a].value;
                }
                else {
                    // value for aggregation function
                    var aggregate_col_count = chart_aggregate_data[a][aggregate_col_name];
                }
                aggregate_col_count = parseFloat(aggregate_col_count);

                var url_array = [];

                if (column_data.length > 0) {
                    // Group by on single column data Pie/Bar/Column/Stackbar/Stackcolumn
                    for (c = 0; c < col_header_array.length; c++) {
                        var col_header = col_header_array[c].header;
                        var aggregate_col = chart_aggregate_data[a][col_header_array[0].header];

                        var col_h = [];
                        let column_ctrl_type = col_header_array[c].ctrl_type;
                        let equation = '';
                        if (column_ctrl_type == 8) {
                            let aggregate_col_name = chart_aggregate_data[a][col_header];
                            equation = 'BETWEEN';
                            let group_date = col_header_array[c].group_date_type;
                            if (aggregate_col_name == '' || aggregate_col_name == null || aggregate_col_name == undefined) { }
                            else {
                                col_h = get_date_for_redirection(group_date, aggregate_col_name);
                            }
                        }
                        else {
                            equation = 'IN';
                            col_h.push(chart_aggregate_data[a][col_header]);
                        }

                        url_array.push({
                            [col_header]: col_h,
                            'Equation': equation
                        });
                    }
                }

                // default filter apply for pie/donut/bar/column/stackbar/stackcolumn
                if (def_fltr_array == '' || def_fltr_array == null || def_fltr_array == undefined) { }
                else {
                    if (def_fltr_array.length > 0) {
                        // Also apply default filter on single tab's counter columndata 
                        for (let d = 0; d < def_fltr_array.length; d++) {
                            let def_header = def_fltr_array[d].columnName;

                            let def_fltr_flag = 0;
                            for (u = 0; u < url_array.length; u++) {
                                if (def_header == Object.keys(url_array[u])[0]) {
                                    if (chart_type != 'line') {
                                        url_array.splice(u, 1);
                                        def_fltr_flag = 0;
                                    }
                                    else {
                                        def_fltr_flag = 1;
                                    }
                                }
                            }

                            if (def_fltr_flag == 0) {
                                let def_id_ary = def_fltr_array[d].id;
                                let equation = def_fltr_array[d].Equation;

                                let def_ctrl_type = def_fltr_array[d].ctrl_type;
                                if (def_ctrl_type == 8) {
                                    equation = 'BETWEEN';
                                }
                                let def_val_ary = [];
                                def_val_ary = def_fltr_array[d].value;

                                url_array.push({
                                    [def_header]: def_val_ary,
                                    'Equation': equation
                                });
                            }
                        }
                    }
                }

                url_array = encodeURIComponent(JSON.stringify(url_array));
                var submenu_url = $('a[udf_id="' + udf_id + '"]').attr('href');
                submenu_url = submenu_url + "&av=" + url_array;
                let obj1 = $('a[udf_id="' + udf_id + '"]').parent();
                let menu_counter = $('#side-menu').find(obj1).index();

                if (aggregate_col == '' || aggregate_col == null || aggregate_col == undefined) {
                    console.log(JSON.stringify(chart_aggregate_data[a]));
                }
                else {
                    sub_menu_array.push({
                        "menu": aggregate_col,
                        "count": aggregate_col_count,
                        "udf_id": udf_id,
                        "url": submenu_url,
                        "role_id": role_id,
                        "font_color": '',
                        "index": menu_counter,
                        "tab_index": a,
                        "GB_obj": chart_aggregate_data[a],    // Group by object for group by on multiple column
                        'flag_aggregate': flag_aggregate
                    });
                }
            }
            submenu = sub_menu_array;
            dashboard_menu_array.submenu = sub_menu_array;
        }

        if ('#menucardid_' + chart_count == '#menucardid__') { }
        else {
            menu_arry.push(dashboard_menu_array);
        }

        var t_title_array = [];
        var t_count_array = [];

        // submenu is found     
        if (submenu.length >= 1) {
            // draw chart for multiple tabs for single udf
            let X_Array = [];
            if (chart_type == 'stackbar' || chart_type == 'stackcolumn' || (chart_type == 'pivot' && pivot_type == 'Horizontal Stacked Bar Chart')) {
                for (j = 0; j < submenu.length; j++) {
                    var submenu_name = submenu[j].menu;
                    if (X_Array.includes(submenu_name) == true) { }
                    else {
                        X_Array.push(submenu_name);
                    }
                }
            }

            let series_Array = [];

            for (j = 0; j < submenu.length; j++) {
                var submenu_name = submenu[j].menu;
                var count = submenu[j].count;
                if (Number.isInteger(count) == true) { }
                else {
                    count = Number(count.toFixed(2))
                }

                var udf_id = submenu[j].udf_id;
                udf_id = parseInt(udf_id);
                var web_test_url = submenu[j].url;
                var t_role_id = submenu[j].role_id;
                var t_index = submenu[j].index;
                if (chart_type == 'stackbar' || chart_type == 'stackcolumn' || (chart_type == 'pivot' && pivot_type == 'Horizontal Stacked Bar Chart' && aggregate_count == 0)) {
                    let flag_aggregate = submenu[j].flag_aggregate;
                    var GB_obj = submenu[j].GB_obj;
                    for (let c = 1; c < col_header_array.length; c++) {
                        var GB_name = GB_obj[col_header_array[c].header];
                        let GB_val;
                        if (flag_aggregate == 1) {
                            GB_val = count;
                        }
                        else {
                            GB_val = GB_obj.value;
                        }

                        let found = 0;
                        for (let s = 0; s < series_Array.length; s++) {
                            var t_name = series_Array[s].name;
                            if (GB_name == t_name) {
                                found++;
                            }
                        }
                        if (found == 0) {
                            // name not found
                            let data_Array = [];
                            let x_index = X_Array.indexOf(submenu_name);
                            for (let x = 0; x < X_Array.length; x++) {
                                if (x == x_index) {
                                    data_Array.push(GB_val);
                                }
                                else {
                                    data_Array.push(0);
                                }
                            }

                            if (GB_name == '' || GB_name == null || GB_name == undefined) {
                                console.log(JSON.stringify(GB_obj));
                            }
                            else {
                                let t_series_obj = {
                                    name: GB_name,
                                    data: data_Array
                                }
                                series_Array.push(t_series_obj);
                            }
                        }
                        else {
                            // name found
                            for (let s = 0; s < series_Array.length; s++) {
                                let t_name = series_Array[s].name;
                                if (t_name == GB_name) {
                                    let x_index = X_Array.indexOf(submenu_name);
                                    series_Array[s].data[x_index] = GB_val;
                                    break;
                                }
                            }
                        }
                    }
                }
                else if (chart_type == 'pivot' && pivot_type == 'Horizontal Stacked Bar Chart' && aggregate_count > 1) {
                    if (aggregate_count > 1) {
                        col_header_array = [];
                        for (let c = 0; c < column_data.length; c++) {
                            var aggregate_function = column_data[c].aggregate_fun;
                            if (aggregate_function == 'group_by') { }
                            else {
                                col_header_array.push({
                                    'header': column_data[c].header,
                                    'ctrl_type': column_data[c].ctrl_type,
                                    'group_date_type': column_data[c].group_date_type
                                });
                            }
                        }
                    }

                    var GB_obj = submenu[j].GB_obj;
                    for (let c = 0; c < col_header_array.length; c++) {
                        var GB_name = col_header_array[c].header;
                        let GB_val;
                        if (aggregate_count > 1) {
                            GB_val = GB_obj[col_header_array[c].header];
                        }
                        else {
                            GB_val = GB_obj.value;
                        }


                        let found = 0;
                        for (let s = 0; s < series_Array.length; s++) {
                            var t_name = series_Array[s].name;
                            if (GB_name == t_name) {
                                found++;
                            }
                        }
                        if (found == 0) {
                            // name not found
                            let data_Array = [];
                            let x_index = X_Array.indexOf(submenu_name);
                            for (let x = 0; x < X_Array.length; x++) {
                                if (x == x_index) {
                                    data_Array.push(GB_val);
                                }
                                else {
                                    data_Array.push(0);
                                }
                            }

                            if (GB_name == '' || GB_name == null || GB_name == undefined) {
                                console.log(JSON.stringify(GB_obj));
                            }
                            else {
                                let t_series_obj = {
                                    name: GB_name,
                                    data: data_Array
                                }
                                series_Array.push(t_series_obj);
                            }
                        }
                        else {
                            // name found
                            for (let s = 0; s < series_Array.length; s++) {
                                let t_name = series_Array[s].name;
                                if (t_name == GB_name) {
                                    let x_index = X_Array.indexOf(submenu_name);
                                    series_Array[s].data[x_index] = GB_val;
                                    break;
                                }
                            }
                        }
                    }
                }
                else {
                    t_count_array.push(count);
                    t_title_array.push(submenu_name);
                    tab_count_array = t_count_array;
                }
            }

            if (chart_type == 'line') {
                var line_name = dashboard_menu_array.calendar_data[0].columnName;
            }

            if (chart_type == 'stackbar' || chart_type == 'stackcolumn' || (chart_type == 'pivot' && pivot_type == 'Horizontal Stacked Bar Chart')) {
                t_count_array = series_Array;
                t_title_array = X_Array;
                tab_count_array = X_Array;
            }

            // if tab count not found add image
            var chart_id = '#menucardid_' + chart_count;
            if (tab_count_array == "" || tab_count_array == null || tab_count_array == undefined) { }
            else {

                // check tab count if any count in zero
                if (t_count_array == "" || t_count_array == null || t_count_array == undefined) { }
                else {
                    var check_tab_count = ifAnyNonZero(t_count_array);
                    if (check_tab_count == true) {
                        if (chart_type == 'pie') {
                            var offset = -55;
                        }
                    }
                    else {
                        var offset = -20;
                    }
                }

                if (chart_type == 'bar' || chart_type == 'column') {
                    if (t_count_array.length == 1) {
                        var datalabel_color = '#fff';
                    }
                    else {
                        let max_elem_val = Math.max.apply(null, t_count_array);
                        let min_elem_val = Math.min.apply(null, t_count_array);
                        let diff_val = max_elem_val - min_elem_val;
                        if (diff_val > 30) {
                            var datalabel_color = '#000';
                        }
                        else {
                            var datalabel_color = '#fff';
                        }
                    }
                }

                if (chart_type == 'stackbar' || (chart_type == 'pivot' && pivot_type == 'Horizontal Stacked Bar Chart')) {
                    var stackchart_type = true;
                }
                else {
                    var stackchart_type = false;
                }

                // draw chart for web app
                var data = 'data' + t_index;
                var options = 'options' + t_index;
                var chart = 'chart' + t_index;

                if (menu_title.length > 45) {
                    var title_size = '12px';
                }
                else {
                    var title_size = '14px';
                }

                if (t_title_array.length >= 21) {
                    var color_array = getRandomColor(t_title_array.length);
                }
                else {
                    var color_array = ['#00A3FB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#00D9DF', '#EF5E29', '#9acd32', '#db7093', '#AA2222', '#3cb371', '#db7093', '#483d8b', '#00fa9a', '#008080', '#7cfc00', '#dda0dd', '#4169e1', '#ee82ee', '#9acd32', '#E62F22'];
                }

                if (chart_type == 'bar') {
                    // BarChart option
                    options = {
                        series: [{
                            data: t_count_array
                        }],
                        chart: {
                            events: {
                                dataPointSelection: (event, chartContext, config) => {
                                    // Click event on bar
                                    if (chart_id == '#menucardid__') {
                                        // not bind click event for preview card
                                    }
                                    else {
                                        var menu_str = config.w.config.labels[config.dataPointIndex];
                                        menu_str = menu_str.toString();
                                        var t_tab_name = menu_str.trim();
                                        var click_menu = config.w.config.title.text;
                                        redirect_on_chart_click(click_menu, t_tab_name, '', chart_count)
                                    }
                                },
                                legendClick: (chartContext, seriesIndex, config) => {
                                    // Click event on legends
                                    if (chart_id == '#menucardid__') {
                                        // not bind click event for preview card
                                    }
                                    else {
                                        var menu_str = config.config.labels[seriesIndex];
                                        menu_str = menu_str.toString();
                                        var t_tab_name = menu_str.trim();
                                        var click_menu = config.config.title.text;
                                        redirect_on_chart_click(click_menu, t_tab_name, '', chart_count)
                                    }
                                }
                            },
                            width: '100%',
                            //height: chart_height,
                            height: return_dynamic_chart_height(chart_height, t_title_array, chart_id, chart_type),
                            type: 'bar'
                        },
                        colors: color_array,
                        title: {
                            text: menu_title,
                            align: 'left',
                            style: {
                                color: 'black',
                            }
                        },
                        plotOptions: {
                            bar: {
                                barHeight: '100%',
                                distributed: true,
                                horizontal: true,
                                dataLabels: {
                                    position: 'center',
                                    offset: offset
                                },
                            },
                        },
                        labels: t_title_array,
                        style: {
                            fontSize: '8px',
                            fontWeight: 500,
                            fontSize: title_size,
                        },
                        dataLabels: {
                            formatter: (val, { seriesIndex, w }) => numFormatter(val),
                            enabled: true,
                            style: {
                                colors: [datalabel_color],
                                style: { fontSize: '13px', fontWeight: 'none' }
                            },
                            dropShadow: {
                                enabled: true,
                                left: 2,
                                top: 2,
                                opacity: 0.1
                            }
                        },
                        responsive: [{
                            breakpoint: 480,
                            options: {
                                chart: {
                                    width: '100%'
                                },
                                legend: {
                                    position: 'bottom',
                                    height: '50px',
                                }
                            }
                        }],
                        tooltip: {
                            theme: 'dark',
                            y: {
                                title: {
                                    formatter: () => { return '' }
                                }
                            }
                        }
                    };
                }
                else if (chart_type == 'column') {
                    options = {
                        series: [{
                            data: t_count_array
                        }],
                        chart: {
                            events: {
                                dataPointSelection: (event, chartContext, config) => {
                                    // Click event on column
                                    if (chart_id == '#menucardid__') {
                                        // not bind click event for preview card
                                    }
                                    else {
                                        var menu_str = config.w.config.labels[config.dataPointIndex];
                                        menu_str = menu_str.toString();
                                        var t_tab_name = menu_str.trim();

                                        var click_menu = config.w.config.title.text;
                                        redirect_on_chart_click(click_menu, t_tab_name, '', chart_count)
                                    }
                                },
                                legendClick: (chartContext, seriesIndex, config) => {
                                    // Click event on column legends
                                    if (chart_id == '#menucardid__') {
                                        // not bind click event for preview card
                                    }
                                    else {
                                        var menu_str = config.config.labels[seriesIndex];
                                        menu_str = menu_str.toString();
                                        var t_tab_name = menu_str.trim();
                                        var click_menu = config.config.title.text;
                                        redirect_on_chart_click(click_menu, t_tab_name, '', chart_count)
                                    }
                                }
                            },
                            height: chart_height,
                            type: 'bar'
                        },
                        colors: color_array,
                        title: {
                            text: menu_title,
                            align: 'left',
                            style: {
                                color: 'black',
                            }
                        },
                        plotOptions: {
                            bar: {
                                distributed: true,
                                dataLabels: {
                                    position: 'center',
                                },
                            }
                        },
                        labels: t_title_array,
                        dataLabels: {
                            formatter: (val, { seriesIndex, w }) => numFormatter(val),
                            offsetY: 0,
                            style: {
                                colors: [datalabel_color]
                            },
                            dropShadow: {
                                enabled: true,
                                left: 2,
                                top: 2,
                                opacity: 0.1
                            }
                        },
                        legend: {
                            show: true,
                        },
                        xaxis: {
                            labels: {
                                show: false,
                            }
                        },
                        tooltip: {
                            theme: 'dark',
                            y: {
                                title: {
                                    formatter: () => { return '' }
                                }
                            }
                        }
                    };
                }
                else if (chart_type == 'stackbar' || chart_type == 'stackcolumn' || (chart_type == 'pivot' && pivot_type == 'Horizontal Stacked Bar Chart')) {
                    options = {
                        series: t_count_array,
                        chart: {
                            events: {
                                dataPointSelection: (event, chartContext, config) => {
                                    // Click event on Stack (bar & column)
                                    if (chart_id == '#menucardid__') {
                                        // not bind click event for preview card
                                    }
                                    else {
                                        var menu_str = config.w.config.labels[config.dataPointIndex];
                                        var click_bar_str = config.w.config.series[config.seriesIndex].name;
                                        click_bar_str = click_bar_str.toString().trim();
                                        menu_str = menu_str.toString();
                                        var t_tab_name = menu_str.trim();
                                        var click_menu = config.w.config.title.text;
                                        redirect_on_chart_click(click_menu, t_tab_name, click_bar_str, chart_count)
                                    }
                                },
                                legendClick: (chartContext, seriesIndex, config) => {
                                    // Click event on legends
                                    if (chart_id == '#menucardid__') {
                                        // not bind click event for preview card
                                    }
                                    else {
                                        var click_bar_str = config.config.series[seriesIndex].name;
                                        click_bar_str = click_bar_str.toString().trim();
                                        var click_menu = config.config.title.text;
                                        redirect_on_chart_click(click_menu, click_bar_str, 'legend', chart_count)
                                    }
                                },
                                xAxisLabelClick: function (event, chartContext, config) {
                                    // Click event on Xaxis labels
                                    if (chart_id == '#menucardid__') {
                                        // not bind click event for preview card
                                    }
                                    else {
                                        var click_bar_str = config.config.labels[config.labelIndex];
                                        click_bar_str = click_bar_str.toString().trim();
                                        var click_menu = config.config.title.text;
                                        redirect_on_chart_click(click_menu, click_bar_str, 'label', chart_count)
                                    }
                                }
                            },
                            type: 'bar',
                            //height: chart_height,
                            height: return_dynamic_chart_height(chart_height, t_title_array, chart_id, chart_type),
                            stacked: true,
                            /*stackType: '100%'*/
                        },
                        labels: t_title_array,
                        colors: color_array,
                        plotOptions: {
                            bar: {
                                barHeight: '100%',
                                horizontal: stackchart_type,
                                dataLabels: {
                                    total: { //  Display total count at the end of bar
                                        enabled: false,
                                        offsetX: 0,
                                        style: {
                                            fontSize: '13px',
                                            fontWeight: 900
                                        }
                                    }
                                }
                            },
                        },
                        stroke: {
                            width: 1,
                            colors: ['#fff']
                        },
                        title: {
                            text: menu_title
                        },
                        xaxis: {
                            categories: t_title_array,
                        },
                        yaxis: {
                            title: {
                                text: undefined
                            },
                        },
                        tooltip: {
                            theme: 'dark',
                            x: {
                                show: false
                            },
                            y: {
                                title: {
                                    formatter: (val) => { return val },
                                }
                            }
                        },
                        fill: {
                            opacity: 1
                        },
                        responsive: [{
                            breakpoint: 480,
                            options: {
                                chart: {
                                    width: '100%'
                                },
                                legend: {
                                    position: 'bottom'
                                }
                            }
                        }],
                        legend: {
                            position: 'bottom',
                            onItemClick: { toggleDataSeries: false },
                        },
                        dataLabels: {
                            formatter: (val, { seriesIndex, w }) => numFormatter(val),
                            dropShadow: {
                                enabled: true,
                                left: 2,
                                top: 2,
                                opacity: 0.1
                            }
                        }
                    };

                    let percentage = 'false';
                    if (chart_type == 'pivot' && pivot_type == 'Horizontal Stacked Bar Chart') {
                        percentage = 'true';
                    }

                    if (percentage == 'true') {
                        options.chart['stackType'] = '100%';
                        options.dataLabels.formatter = '';
                    }
                }
                else if (chart_type == 'donut') {
                    // DonutChart option
                    options = {
                        series: t_count_array,
                        chart: {
                            events: {
                                dataPointSelection: (event, chartContext, config) => {
                                    // Click event on donut & lagends
                                    if (chart_id == '#menucardid__') {
                                        // not bind click event for preview card
                                    }
                                    else {
                                        var menu_str = config.w.config.labels[config.dataPointIndex];
                                        menu_str = menu_str.toString();
                                        var t_tab_name = menu_str.trim();
                                        var click_menu = config.w.config.title.text;
                                        redirect_on_chart_click(click_menu, t_tab_name, '', chart_count)
                                    }
                                }
                            },
                            width: '100%',
                            height: chart_height,
                            type: 'donut'
                        },
                        colors: color_array,
                        title: {
                            text: menu_title,
                            align: 'left',
                            style: {
                                color: 'black'
                            }
                        },
                        stroke: {
                            show: false,
                        },
                        legend: {
                            width: '40%',
                            height: '90%',
                            position: "left",
                            formatter: (seriesName, opts) => { return [seriesName, " - ", numFormatter(opts.w.globals.series[opts.seriesIndex])] }
                        },
                        labels: t_title_array,
                        style: {
                            fontSize: '8px',
                            fontWeight: 500,
                            fontSize: title_size
                        },
                        dataLabels: {
                            formatter: (val, { seriesIndex, w }) => numFormatter(w.config.series[seriesIndex]),
                            style: { fontSize: '13px', fontWeight: 'none' }
                        },
                        plotOptions: {
                            pie: {
                                donut: {
                                    size: '50%'
                                }
                            }
                        },
                        responsive: [{
                            breakpoint: 480,
                            options: {
                                chart: {
                                    width: '100%'
                                },
                                legend: {
                                    position: 'left',
                                }
                            }
                        }],
                        tooltip: {
                            x: {
                                show: false
                            },
                            y: {
                                title: {
                                    formatter: (val) => { return val },
                                }
                            }
                        }
                    };
                }
                else if (chart_type == 'pie') {
                    // PieChart option
                    options = {
                        series: t_count_array,
                        chart: {
                            events: {
                                dataPointSelection: (event, chartContext, config) => {
                                    // Click event on pie & lagends
                                    if (chart_id == '#menucardid__') {
                                        // not bind click event for preview card
                                    }
                                    else {
                                        var menu_str = config.w.config.labels[config.dataPointIndex];
                                        menu_str = menu_str.toString();
                                        var t_tab_name = menu_str.trim();
                                        var click_menu = config.w.config.title.text;
                                        redirect_on_chart_click(click_menu, t_tab_name, '', chart_count)
                                    }
                                }
                            },
                            width: '100%',
                            height: chart_height,
                            type: 'pie'
                        },
                        colors: color_array,
                        title: {
                            text: menu_title,
                            align: 'left',
                            style: {
                                color: 'black'
                            }
                        },
                        stroke: {
                            show: false,
                        },
                        legend: {
                            width: '40%',
                            height: '90%',
                            position: "left",
                            formatter: (seriesName, opts) => { return [seriesName, " - ", numFormatter(opts.w.globals.series[opts.seriesIndex])] }
                        },
                        labels: t_title_array,
                        style: {
                            fontSize: '8px',
                            fontWeight: 500,
                            fontSize: title_size
                        },
                        dataLabels: {
                            formatter: (val, { seriesIndex, w }) => numFormatter(w.config.series[seriesIndex]),
                            style: { fontSize: '13px', fontWeight: 'none' }
                        },
                        plotOptions: {
                            pie: {
                                dataLabels: {
                                    offset: offset,
                                    position: 'center'
                                },
                            }
                        },
                        responsive: [{
                            breakpoint: 480,
                            options: {
                                chart: {
                                    width: '100%'
                                },
                                legend: {
                                    position: 'left',
                                }
                            }
                        }],
                        tooltip: {
                            x: {
                                show: false
                            },
                            y: {
                                title: {
                                    formatter: (val) => { return val },
                                }
                            }
                        }
                    };
                }
                else if (chart_type == 'line') {
                    options = {
                        series: [{
                            name: line_name,
                            data: t_count_array
                        }],
                        chart: {
                            events: {
                                xAxisLabelClick: function (event, chartContext, config) {
                                    // Click event on Xaxis labels
                                    if (chart_id == '#menucardid__') {
                                        // not bind click event for preview card
                                    }
                                    else {
                                        var click_bar_str = config.globals.categoryLabels[config.labelIndex];
                                        click_bar_str = click_bar_str.toString().trim();
                                        var click_menu = config.config.title.text;
                                        redirect_on_chart_click(click_menu, click_bar_str, '', chart_count)
                                    }
                                }
                            },
                            height: chart_height,
                            type: 'area',
                            zoom: {
                                enabled: false
                            }
                        },
                        dataLabels: {
                            formatter: (val, { seriesIndex, w }) => numFormatter(val),
                            enabled: true,
                            dropShadow: {
                                enabled: true,
                                left: 2,
                                top: 2,
                                opacity: 0.1
                            }
                        },
                        stroke: {
                            curve: 'straight'
                        },
                        title: {
                            text: menu_title,
                            align: 'left',
                            style: {
                                color: 'black'
                            }
                        },
                        grid: {
                            row: {
                                opacity: 0.5
                            },
                        },
                        xaxis: {
                            categories: t_title_array,
                        },
                        tooltip: {
                            x: {
                                show: false
                            },
                            y: {
                                title: {
                                    formatter: (val) => { return val },
                                }
                            }
                        }
                    };
                }

                $(chart_id).find(".tbl_container").hide();
                $(chart_id).find(".text-secondary").hide();
                $(chart_id).find(".cls_ghost_image").hide();
                $(chart_id).find(".cls_no_data_found").hide();
                var chart = new ApexCharts(document.querySelector(chart_id), options);
                chart.render();

                let def_fltr_arry = dashboard_menu_array.default_filter;
                if (def_fltr_arry == '' || def_fltr_arry == null || def_fltr_arry == undefined) {
                    if (aggregate_col_name == '' || aggregate_col_name == undefined || aggregate_col_name == null) { }
                    else {
                        if (chart_type == 'pie' || chart_type == 'donut') {
                            $(chart_id).find('.cls_card_aggregate_fun').css('top', '20px');
                            $(chart_id).find('.apx-legend-position-left').css('top', '40px');
                            $(chart_id).find('.apexcharts-graphical').attr('transform', 'translate(150, 15)');
                        }
                    }
                }
                else {
                    if (def_fltr_arry.length > 0 && (chart_type == 'pie' || chart_type == 'donut')) {
                        if (aggregate_col_name == '' || aggregate_col_name == undefined || aggregate_col_name == null) {
                            $(chart_id).find('.apx-legend-position-left').css('top', '40px');
                            $(chart_id).find('.apexcharts-graphical').attr('transform', 'translate(150, 15)');
                        }
                        else {
                            $(chart_id).find('.apx-legend-position-left').css('top', '50px');
                            $(chart_id).find('.apexcharts-graphical').attr('transform', 'translate(150, 30)');
                        }
                    }
                }
            }
        }

        loading_hide();
    }
    catch (e) {
        alert(e + '_chart_initialize');
        loading_hide();
    }
}

//applicable for bar chart only
return_dynamic_chart_height = (t_chart_height, chart_title_array, chart_id, chart_type) => {
    if ((chart_type == "bar" || chart_type == 'stackbar') && chart_title_array.length > 6) {
        var dynamic_chart_height = chart_title_array.length * 35;
        if (dynamic_chart_height < t_chart_height) {
            var dynamic_chart_height = t_chart_height;
        }
        else {
            $(chart_id).css({
                'overflow-y': 'auto',
                'overflow-x': 'hidden'
            });
        }
    }
    else {
        var dynamic_chart_height = t_chart_height;
    }
    return dynamic_chart_height;
}


open_popover_mdlchart = (chart_mode, chart_index) => {
    glb_pivot_config = [];

    myApp.popup('.popup-chart-config');

    $('#barchart').empty();
    $('#piechart').empty();
    $('#donutchart').empty();
    $('#columnchart').empty();
    $('#stackbar').empty();
    $('#stackcolumn').empty();
    $('#line').empty();
    $('#ddl_udf_name').empty();
    $('#ddl_aggregate_column').empty();
    $(".div-filtered-item").empty();

    $('#txt_source_name').val('');
    $('#txt_card_position').val('');
    $('#start_date').val('');
    $('#end_date').val('');

    $('.cls_aggr_fun').show();
    $('#ddl_aggregate_column').hide();
    $('.cls_groupby1').hide();
    $('.cls_groupby2').hide();
    $('.cls_trends').hide();
    $('.cls_trends_opt').hide();
    $('.cls_pvttbl').hide();

    $('#chk_trends_view').prop('checked', false);

    $('#ddl_linechart_opt').val('this_month');
    $('#ddl_milestone_opt').val('week');

    $('#preview_card').empty();
    $('#preview_card_alert').css('display', 'none');
    $('#card_title').empty();
    $('#card_alert').empty();

    $('#mdl_add_pvttbl_col').css('display', 'none');
    $('#container_pvttbl_row').empty();

    $('#ddl_aggregate_data').empty();
    var aggregate_str = '<option value="count">Count</option>';
    $('#ddl_aggregate_data').append(aggregate_str);

    $('#ddl_previous_count').empty();
    $('#ddl_current_count').empty();
    $('.cls_percentage_count').hide();

    // BarChart option
    var bar_opt = {
        series: [{
            data: [10, 20, 30, 40]
        }],
        chart: {
            width: 115,
            height: 110,
            type: 'bar',
        },
        title: {
            text: '',
        },
        plotOptions: {
            bar: {
                barHeight: '100%',
                distributed: true,
                horizontal: true,
                dataLabels: {
                    position: 'center',
                    offset: -40
                }
            },
        },
        labels: ['Pending', 'Pending for approval', 'Completed', 'Deleted'],
        style: {
            fontSize: '8px',
            fontWeight: 500,
            fontSize: '12px',
        },
        legend: {
            show: false,
        },
        dataLabels: {
            enabled: false,
        },
        yaxis: {
            labels: {
                show: false,
            }
        },
        xaxis: {
            labels: {
                show: false,
            }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                legend: {
                    position: 'bottom'
                }
            }
        }],
        tooltip: {
            theme: 'dark',
            y: {
                title: {
                    formatter: () => { return '' }
                }
            }
        }
    };
    var barchart = new ApexCharts(document.querySelector("#barchart"), bar_opt);
    barchart.render();

    // PieChart option
    var pie_opt = {
        series: [10, 20, 30, 40],
        chart: {
            width: 115,
            height: 100,
            type: 'pie',
        },
        title: {

            align: 'left',
            style: {
                color: 'black',
            }
        },
        stroke: {
            show: false,
            curve: 'smooth',
            lineCap: 'butt',
            colors: "#03111E",
            width: 2,
            dashArray: 0,
        },
        legend: {
            width: 210,
            show: false,
            position: "left",
            formatter: (seriesName, opts) => { return [seriesName, " - ", opts.w.globals.series[opts.seriesIndex]] }
        },
        labels: ['Pending', 'Pending for approval', 'Completed', 'Deleted'],
        style: {
            fontSize: '8px',
            fontWeight: 500,
            fontSize: '12px'
        },
        dataLabels: {
            enabled: false,
            formatter: (val, { seriesIndex, w }) => w.config.series[seriesIndex],
            style: { fontSize: '10px', fontWeight: 'none' }
        },
        plotOptions: {
            pie: {
                dataLabels: {
                    offset: -15
                },
            }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                legend: {
                    position: 'bottom'
                }
            }
        }],
        tooltip: {
            x: {
                show: false
            },
            y: {
                title: {
                    formatter: (val) => { return val },
                }
            }
        }
    };
    var piechart = new ApexCharts(document.querySelector("#piechart"), pie_opt);
    piechart.render();

    // DonutChart option
    var donut_opt = {
        series: [10, 20, 30, 40],
        chart: {
            width: 115,
            height: 100,
            type: 'donut',
        },
        title: {

            align: 'left',
            style: {
                color: 'black',
            }
        },
        stroke: {
            show: false,
            curve: 'smooth',
            lineCap: 'butt',
            colors: "#03111E",
            width: 2,
            dashArray: 0,
        },
        legend: {
            width: 210,
            show: false,
            position: "left",
            formatter: (seriesName, opts) => { return [seriesName, " - ", opts.w.globals.series[opts.seriesIndex]] }
        },
        labels: ['Pending', 'Pending for approval', 'Completed', 'Deleted'],
        style: {
            fontSize: '8px',
            fontWeight: 500,
            fontSize: '12px'
        },
        dataLabels: {
            enabled: false,
            formatter: (val, { seriesIndex, w }) => w.config.series[seriesIndex],
            style: { fontSize: '10px', fontWeight: 'none' }
        },
        plotOptions: {
            donut: {
                dataLabels: {
                    offset: -15
                },
            }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                legend: {
                    position: 'bottom'
                }
            }
        }],
        tooltip: {
            x: {
                show: false
            },
            y: {
                title: {
                    formatter: (val) => { return val },
                }
            }
        }
    };
    var donutchart = new ApexCharts(document.querySelector("#donutchart"), donut_opt);
    donutchart.render();

    // ColumnChart Option
    var column_opt = {
        series: [{
            data: [40, 30, 20, 10]
        }],
        chart: {
            width: 115,
            height: 110,
            type: 'bar'
        },
        title: {
            text: '',
            align: 'left',
            style: {
                color: 'black',
            }
        },
        plotOptions: {
            bar: {
                distributed: true,
                dataLabels: {
                    position: 'center',
                },
            }
        },
        labels: ['Pending', 'Pending for approval', 'Completed', 'Deleted'],
        dataLabels: {
            offsetY: 0,
            enabled: false,
        },
        legend: {
            show: false,
        },
        yaxis: {
            labels: {
                show: false,
            }
        },
        xaxis: {
            labels: {
                show: false,
            }
        },
        tooltip: {
            theme: 'dark',
            y: {
                title: {
                    formatter: () => { return '' }
                }
            }
        }
    };
    var columnchart = new ApexCharts(document.querySelector("#columnchart"), column_opt);
    columnchart.render();

    // StackBarChart Option
    var stackbar_opt = {
        series: [{
            name: 'PRODUCT A',
            data: [30, 55, 41, 50]
        }, {
            name: 'PRODUCT B',
            data: [13, 23, 20, 8]
        }, {
            name: 'PRODUCT C',
            data: [20, 17, 15, 15]
        }, {
            name: 'PRODUCT D',
            data: [25, 10, 25, 13]
        }],
        chart: {
            width: 115,
            height: 110,
            type: 'bar',
            stacked: true,
        },
        labels: ['Pending', 'Pending for approval', 'Completed', 'Deleted'],
        plotOptions: {
            bar: {
                barHeight: '100%',
                horizontal: true,
                distributed: true,
                dataLabels: {
                    total: {
                        enabled: false,
                        offsetX: -40,
                        style: {
                            fontSize: '13px',
                            fontWeight: 900
                        }
                    }
                }
            },
        },
        stroke: {
            width: 1,
            colors: ['#fff']
        },
        title: {
            text: ''
        },
        xaxis: {
            labels: {
                show: false,
            }
        },
        yaxis: {
            title: {
                text: undefined
            },
            labels: {
                show: false,
            }
        },
        tooltip: {
            theme: 'dark',
            x: {
                show: false
            },
            y: {
                title: {
                    formatter: (val) => { return val },
                }
            }
        },
        fill: {
            opacity: 1
        },
        responsive: [{
            breakpoint: 480,
            options: {
                legend: {
                    position: 'bottom'
                }
            }
        }],
        legend: {
            position: 'bottom',
            show: false,
        },
        dataLabels: {
            enabled: false,
        }
    };
    var stackbarchart = new ApexCharts(document.querySelector("#stackbar"), stackbar_opt);
    stackbarchart.render();

    // StackColumnChart Option
    var stackcol_opt = {
        series: [{
            name: 'PRODUCT A',
            data: [30, 55, 41, 50]
        }, {
            name: 'PRODUCT B',
            data: [13, 23, 20, 8]
        }, {
            name: 'PRODUCT C',
            data: [20, 17, 15, 15]
        }, {
            name: 'PRODUCT D',
            data: [25, 10, 25, 13]
        }],
        chart: {
            width: 115,
            height: 110,
            type: 'bar',
            stacked: true,
        },
        labels: ['Pending', 'Pending for approval', 'Completed', 'Deleted'],
        plotOptions: {
            bar: {
                barHeight: '100%',
                horizontal: false,
                distributed: true,
                dataLabels: {
                    total: {
                        enabled: false,
                        offsetX: -40,
                        style: {
                            fontSize: '13px',
                            fontWeight: 900
                        }
                    }
                }
            },
        },
        stroke: {
            width: 1,
            colors: ['#fff']
        },
        title: {
            text: ''
        },
        xaxis: {
            labels: {
                show: false,
            }
        },
        yaxis: {
            title: {
                text: undefined
            },
            labels: {
                show: false,
            }
        },
        tooltip: {
            theme: 'dark',
            x: {
                show: false
            },
            y: {
                title: {
                    formatter: (val) => { return val },
                }
            }
        },
        fill: {
            opacity: 1
        },
        responsive: [{
            breakpoint: 480,
            options: {
                legend: {
                    position: 'bottom'
                }
            }
        }],
        legend: {
            position: 'bottom',
            show: false,
        },
        dataLabels: {
            enabled: false,
        }
    };
    var stackbarchart = new ApexCharts(document.querySelector("#stackcolumn"), stackcol_opt);
    stackbarchart.render();

    // LineChart Option
    var line_opt = {
        series: [{
            name: "Desktops",
            data: [10, 41, 35, 30, 49, 62, 69, 91, 50, 125, 135, 90]
        }],
        chart: {
            width: 115,
            height: 110,
            type: 'area',
            zoom: {
                enabled: false
            }
        },
        title: {
            text: '',
        },
        plotOptions: {
            bar: {
                barHeight: '100%',
                distributed: true,
                horizontal: true,
                dataLabels: {
                    position: 'center',
                    offset: -40
                }
            },
        },
        style: {
            fontSize: '8px',
            fontWeight: 500,
            fontSize: '12px',
        },
        legend: {
            show: false,
        },
        dataLabels: {
            enabled: false,
        },
        yaxis: {
            labels: {
                show: false,
            }
        },
        xaxis: {
            labels: {
                show: false,
            },
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        },
        responsive: [{
            breakpoint: 480,
            options: {
                legend: {
                    position: 'bottom'
                }
            }
        }],
        tooltip: {
            theme: 'dark',
            y: {
                title: {
                    formatter: () => { return '' }
                }
            }
        }
    };
    var linechart = new ApexCharts(document.querySelector("#line"), line_opt);
    linechart.render();

    // Fill udfname ddl
    var udfname_str = '';
    udfname_str += '<option value="Select Source Name">Select Source Name</option>';
    $('#ddl_udf_name').append(udfname_str);
    $('#module_list li').each(function (e) {
        let param_click = $(this).attr('onclick');
        if (param_click.includes('redirect_on_module_click') == true) {
            var udf_name = $(this).attr('udf_name');
            udf_name = udf_name.trim();
            var udf_id = $(this).attr('udf_id');
            udfname_str = '<option value="' + udf_id + '" udf_name style="background-color:gray;color:white;">' + udf_name + '(Udf)</option>';
            $('#ddl_udf_name').append(udfname_str);

            var hdn_tab_json = $('#hdn_' + udf_id).val();
            if (hdn_tab_json == '' || hdn_tab_json == null || hdn_tab_json == undefined) {
                var col_name_str = '';
                col_name_str += '<option value="Select Column Name">Select Column Name</option>';
                $('#ddl_groupby1').empty();
                $('#ddl_groupby1').append(col_name_str);
                $('#ddl_groupby2').empty();
                $('#ddl_groupby2').append(col_name_str);
            }
            else {
                hdn_tab_json = JSON.parse(decodeURIComponent(hdn_tab_json));
                for (let i = 0; i < hdn_tab_json.length; i++) {
                    var access_type = hdn_tab_json[i].access_type;
                    var survey_mode = hdn_tab_json[i].survey_mode;
                    if ((access_type == 'both' || access_type == 'web_app' || access_type == 'dashboard') && survey_mode == 'online') {
                        var tab_name = hdn_tab_json[i].tab_name;
                        var tab_id = hdn_tab_json[i].tab_id;
                        if (tab_name == '' || tab_name == null || tab_name == undefined) { }
                        else {
                            tabname_str = '<option udf_id="' + udf_id + '" value="' + tab_id + '">' + tab_name + '(Tab)</option>';
                            $('#ddl_udf_name').append(tabname_str);
                        }
                    }
                }
            }
        }
    });

    //Fill columndata ddl for groupby
    var col_name_str = '';
    col_name_str += '<option value="Select Column Name">Select Column Name</option>';
    $('#ddl_groupby1').empty();
    $('#ddl_groupby1').append(col_name_str);
    $('#ddl_groupby2').empty();
    $('#ddl_groupby2').append(col_name_str);
    $('#aggregate_column').empty();
    $('#aggregate_column').append(col_name_str);
    $('#ddl_pvttbl_opt').empty();
    $('#ddl_pvttbl_opt').append(col_name_str);

    var prev_udf_val = $('#ddl_udf_name').val();
    var prev_udf_name = $('#txt_source_name').val();
    var prev_groupby_val1 = $('#ddl_groupby1').val();
    var prev_groupby_val2 = $('#ddl_groupby2').val();

    $('#ddl_udf_name').unbind('change');
    $('#ddl_udf_name').on('change', function (e) {

        $('#ddl_aggregate_data').empty();
        $('#ddl_aggregate_column').empty();
        $('#ddl_groupby1').empty();
        $('#ddl_groupby2').empty();
        $('#ddl_trends').empty();
        $('#ddl_pvttbl_opt').empty();

        $('.cls_aggr_fun').show();
        $('.cls_percentage_count').hide();
        $('.cls_groupby1').hide();
        $('.cls_groupby2').hide();
        $('.cls_trends').hide();
        $('.cls_trends_opt').hide();
        $('.cls_pvttbl').hide();

        if (is_deffltr_change_flag == 1 && $('.div-filtered-item .badge').length != 0) {
            var confirm_val = confirm("Your configuration may be lost. Are you sure, you want to go ahead?");

            let udf_name = $('#ddl_udf_name option:selected').text();
            if (udf_name.includes('(Udf)') == true) {
                udf_name = udf_name.split('(Udf)');
            }
            else if (udf_name.includes('(Tab)') == true) {
                udf_name = udf_name.split('(Tab)');
            }
            udf_name = udf_name[0];

            if (udf_name == 'Select Source Name') {
                $('#txt_source_name').val('');
            }
            prev_udf_name = $('#txt_source_name').val();

            if (confirm_val == true) {
                prev_udf_val = $('#ddl_udf_name').val();
                $('.div-filtered-item').empty();
                $('#txt_source_name').val(udf_name);
                $('#txt_source_name').trigger('input');
                $('#btn_aply_def_fltr').trigger('click');
            }
            else {
                $('#ddl_udf_name').val(prev_udf_val);
                $('#ddl_groupby1').val(prev_groupby_val1);
                $('#ddl_groupby2').val(prev_groupby_val2);
                $('#txt_source_name').val(prev_udf_name);
            }
        }
        else {
            prev_udf_val = $('#ddl_udf_name').val();
            prev_udf_name = $('#txt_source_name').val();
            let udf_name = $('#ddl_udf_name option:selected').text();
            if (udf_name == 'Select Source Name') {
                $('#txt_source_name').val('');
            }
            else {
                if (udf_name.includes('(Udf)') == true) {
                    udf_name = udf_name.split('(Udf)');
                }
                else if (udf_name.includes('(Tab)') == true) {
                    udf_name = udf_name.split('(Tab)');
                }
                udf_name = udf_name[0];
                $('#txt_source_name').val(udf_name);
            }
        }

        var col_name_str = '';
        col_name_str += '<option value="Select Column Name">Select Column Name</option>';
        $('#ddl_aggregate_column').append(col_name_str);
        $('#ddl_groupby1').append(col_name_str);
        $('#ddl_groupby2').append(col_name_str);
        $('#ddl_trends').append(col_name_str);
        $('#ddl_pvttbl_opt').append(col_name_str);

        var udf_id = $('#ddl_udf_name option:selected').attr('udf_id');
        var selected_tab_id = $('#ddl_udf_name').val();
        if (udf_id == '' || udf_id == null || udf_id == undefined) {
            udf_id = selected_tab_id;
            var hdn_tab_json = $('#hdn_' + udf_id).val();
            if (hdn_tab_json == '' || hdn_tab_json == null || hdn_tab_json == undefined) { }
            else {
                hdn_tab_json = JSON.parse(decodeURIComponent(hdn_tab_json));
                if (hdn_tab_json.length == 1) {
                    selected_tab_id = hdn_tab_json[0].tab_id;
                }
            }
        }

        var hdn_tab_json = $('#hdn_' + udf_id).val();
        if (hdn_tab_json == '' || hdn_tab_json == null || hdn_tab_json == undefined) { }
        else {
            hdn_tab_json = JSON.parse(decodeURIComponent(hdn_tab_json));
            for (let i = 0; i < hdn_tab_json.length; i++) {
                var tab_id = hdn_tab_json[i].tab_id;
                if (selected_tab_id == tab_id) {
                    $('.td_def_fltr').show();

                    let chart_type = $('.chart_active .card-footer span').html();
                    if (chart_type == 'BAR' || chart_type == 'PIE' || chart_type == 'DONUT' || chart_type == 'COLUMN') {
                        $('.cls_groupby1').show();
                    }
                    else if (chart_type == 'STACKBAR' || chart_type == 'STACKCOLUMN') {
                        $('.cls_groupby1').show();
                        $('.cls_groupby2').show();
                    }

                    var col_data = hdn_tab_json[i].columndata;
                    var query_type = hdn_tab_json[i].query_type;
                    for (let j = 0; j < col_data.length; j++) {
                        var ctrl_type = col_data[j].ctrl_type;
                        let checksheetID = col_data[j].checksheetID;
                        let checksheet_type = col_data[j].checksheet_type;
                        let step = col_data[j].step;
                        let qid = col_data[j].qid;
                        let header = col_data[j].header;
                        let sys_var = col_data[j].system_var;
                        if (sys_var == '' || sys_var == null || sys_var == undefined) {
                            sys_var = '';
                        }
                        let group_date_type = 'month';
                        let aggregate_fun = 'group_by';
                        var column_data = [];
                        column_data.push({
                            group_date_type: group_date_type,
                            checksheetID: checksheetID,
                            checksheet_type: checksheet_type,
                            step: step,
                            qid: qid,
                            header: header,
                            ctrl_type: ctrl_type,
                            aggregate_fun: aggregate_fun,
                            system_var: sys_var
                        });

                        if (ctrl_type == 2 || ctrl_type == 3 || ctrl_type == 8 || ctrl_type == 20 || (ctrl_type == 1 && query_type == 'view') || sys_var == 'Status_Name') {
                            col_name_str = '<option value="' + header + '" columndata="' + encodeURIComponent(JSON.stringify(column_data)) + '">' + header + '</option>';
                            $('#ddl_groupby1').append(col_name_str);
                            $('#ddl_groupby2').append(col_name_str);
                            $('#ddl_pvttbl_row').append(col_name_str);
                            $('#ddl_pvttbl_col').append(col_name_str);
                        }
                        else if (ctrl_type == 4 || ctrl_type == 12 || ctrl_type == 17) {
                            col_name_str = '<option value="' + header + '" columndata="' + encodeURIComponent(JSON.stringify(column_data)) + '">' + header + '</option>';
                            $('#ddl_aggregate_column').append(col_name_str);
                        }

                        if (ctrl_type == 8) {
                            let calendar_obj = [];
                            calendar_obj.push({
                                "columnName": header,
                                'id': '',
                                "queId": qid,
                                "Equation": 'BETWEEN',
                                "calendar_type": 'this_month',
                                "group_date_type": 'weeek',
                                "system_var": '',
                                "checksheetID": checksheetID,
                                "checksheet_type": checksheet_type,
                                "qid": qid,
                                'ctrl_type': ctrl_type,
                                'step': step,
                            });

                            trd_opt_str = '<option value="' + header + '" calendar_data="' + encodeURIComponent(JSON.stringify(calendar_obj)) + '">' + header + '</option>';
                            $('#ddl_trends').append(trd_opt_str);
                        }
                    }

                    break;
                }
            }
        }

        var aggregate_column_lng = $('#ddl_aggregate_column option').length - 1;
        var aggregate_str = '<option value="count">Count</option>';
        if (aggregate_column_lng > 0) {
            aggregate_str += '<option value="sum">Sum</option><option value="min">Min</option><option value="max">Max</option><option value="avg">Avg</option><option value="percentage">Percentage</option>';
        }
        $('#ddl_aggregate_data').append(aggregate_str);

        if (confirm_val == false) {
            $('#ddl_groupby1').val(prev_groupby_val1);
            $('#ddl_groupby2').val(prev_groupby_val2);
        }

        let groupby_lng1 = $('#ddl_groupby1 option').length;
        let groupby_lng2 = $('#ddl_groupby2 option').length;
        if ((groupby_lng1 < 1 || groupby_lng2 < 1) && $('#ddl_udf_name').attr('udf_id') != undefined) {
            alert('No column found for group by. It will work with specific controls like radio, dropdown, checkbox, calendar etc.');
        }

        let chart_type = $('.chart_active .card-footer span').html();
        if (chart_type == 'COUNTER' || chart_type == 'LINE') {
            if ($('#ddl_trends option').length > 1) {
                if (chart_type == 'LINE') {
                    $('.cls_trends_opt').show();
                    $('#ddl_trend_group').hide();
                    if ($('#ddl_linechart_opt').val() == 'is_between') {
                        $('.cls_line_datepicker').show();
                    }
                    else {
                        $('.cls_line_datepicker').hide();
                    }
                    $('.cls_linechart_opt').show();
                }
                else {
                    $('#chk_trends_view').prop('checked', false);
                    $('.cls_trends').show();
                    $('.cls_trends_opt').hide();
                    $('#ddl_trend_group').show();
                    $('.div-datepicker1').hide();
                    $('.cls_linechart_opt').hide();
                    $('.cls_percentage_count').show();
                }
            }
            else {
                if (chart_type == 'LINE') {
                    $('.cls_trends_opt').show();
                    $('#ddl_trend_group').hide();
                    if ($('#ddl_linechart_opt').val() == 'is_between') {
                        $('.cls_line_datepicker').show();
                    }
                    else {
                        $('.cls_line_datepicker').hide();
                    }
                    $('.cls_linechart_opt').show();
                }
                else {
                    $('#ddl_trend_group').show();
                    $('.div-datepicker1').hide();
                    $('.cls_linechart_opt').hide();
                    $('.cls_percentage_count').show();
                }
            }
        }
        else if (chart_type == 'PIVOT') {
            $('.cls_aggr_fun').hide();
            $('.cls_pvttbl').show();
            $('#container_pvttbl_row').empty();
        }

        setTimeout(function (e) {
            add_new_chart(chart_mode, '_', 'preview');
        }, 200);

    });

    //bind chart type for selection
    $('.chart_type').unbind('click');
    $('.chart_type').on('click', function (e) {
        var obj = $(e)[0].currentTarget;
        $(obj).siblings().removeClass('chart_active');
        $(obj).parent().siblings().find('.chart_type').removeClass('chart_active');
        $(obj).addClass('chart_active');

        let chart_type = $(obj).find('.card-footer span').text();
        let udf_name = $('#ddl_udf_name').val();
        let udf_id = $('#ddl_udf_name option:selected').attr('udf_id');

        if (udf_name == 'Select Source Name') { }
        else {
            var opt_lng = $('#ddl_udf_name').find('option[udf_id=' + udf_name + ']').length;
        }

        $('.cls_aggr_fun').show();
        $('.cls_groupby1').hide();
        $('.cls_groupby2').hide();
        $('.cls_trends').hide();
        $('.cls_trends_opt').hide();
        $('.cls_pvttbl').hide();
        $('.cls_percentage_count').hide();

        if (chart_type == 'COUNTER' || chart_type == 'LINE') {
            if (udf_name == 'Select Source Name') { }
            else if ((udf_id == '' || udf_id == null || udf_id == undefined) && opt_lng > 1) { }
            else {
                $('#ddl_trends').attr('style', '');
                if ($('#ddl_trends option').length > 1) {
                    if (chart_type == 'LINE') {
                        $('.cls_trends_opt').show();
                        $('.cls_linechart_opt').show();
                        $('#ddl_trend_group').hide();
                        if ($('#ddl_linechart_opt').val() == 'is_between') {
                            $('.cls_line_datepicker').show();
                        }
                        else {
                            $('.cls_line_datepicker').hide();
                        }
                    }
                    else {
                        $('.cls_trends').show();
                        let trnd_chk = $('#chk_trends_view').prop('checked');
                        if (trnd_chk == true) {
                            $('.cls_trends_opt').show();
                            $('#ddl_trends').attr('style', 'width:64%;margin-right:4px;');
                        }
                        else {
                            $('.cls_trends_opt').hide();
                        }
                        $('#ddl_trend_group').show();
                        $('.cls_linechart_opt').hide();
                        $('.cls_line_datepicker').hide();
                        $('.cls_percentage_count').show();
                    }
                }
                else {
                    if (chart_type == 'LINE') {
                        $('.cls_trends_opt').show();
                        $('#ddl_trend_group').hide();
                        $('.cls_linechart_opt').show();
                        if ($('#ddl_linechart_opt').val() == 'is_between') {
                            $('.cls_line_datepicker').show();
                        }
                        else {
                            $('.cls_line_datepicker').hide();
                        }
                    }
                    else {
                        $('#ddl_trend_group').show();
                        $('.cls_linechart_opt').hide();
                        $('.cls_line_datepicker').hide();
                        $('.cls_percentage_count').show();
                    }
                }
            }
        }
        else if (chart_type == 'BAR' || chart_type == 'PIE' || chart_type == 'DONUT' || chart_type == 'COLUMN') {
            if (udf_name == 'Select Source Name') { }
            else if ((udf_id == '' || udf_id == null || udf_id == undefined) && opt_lng > 1) { }
            else {
                $('.cls_groupby1').show();
            }
        }
        else if (chart_type == 'STACKBAR' || chart_type == 'STACKCOLUMN') {
            if (udf_name == 'Select Source Name') { }
            else if ((udf_id == '' || udf_id == null || udf_id == undefined) && opt_lng > 1) { }
            else {
                $('.cls_groupby1').show();
                $('.cls_groupby2').show();
            }
        }
        else if (chart_type == 'PIVOT') {
            $('.cls_aggr_fun').hide();
            if (udf_name == 'Select Source Name') { }
            else {
                $('.cls_pvttbl').show();
            }
        }

        add_new_chart(chart_mode, '_', 'preview');
    });

    $('#txt_source_name').unbind('input');
    $('#txt_source_name').on('input', function (e) {
        let obj = e.target;
        let card_title = $(obj).val();
        $('#menucardid__ .txt_menu_name').html(card_title);
        $('#menucardid__ .apexcharts-title-text').html(card_title);
        $('#card_title').html(card_title);
    });

    $('#ddl_aggregate_data').unbind('change');
    $('#ddl_aggregate_data').on('change', function (e) {
        var obj = e.currentTarget;
        var aggregate_Val = $(obj).val();
        $('#ddl_aggregate_data').attr('style', '');
        if (aggregate_Val != 'count') {
            $('#ddl_aggregate_data').attr('style', 'width:34%;margin-right:4px;');
            $('#ddl_aggregate_column').show();
        }
        else {
            $('#ddl_aggregate_column').hide();
        }

        add_new_chart(chart_mode, '_', 'preview');
    });

    $('#ddl_aggregate_column').unbind('change');
    $('#ddl_aggregate_column').on('change', function () {
        add_new_chart(chart_mode, '_', 'preview');
    });

    let count_card_str = '';
    count_card_str = '<option value="select card">Select Card</option>';
    $('#ddl_previous_count').append(count_card_str);
    $('#ddl_current_count').append(count_card_str);
    $('.single_tab').each(function () {
        let hdn_card_json = $(this).find('input[type="hidden"]').val();
        if (hdn_card_json == '' || hdn_card_json == null || hdn_card_json == undefined) { }
        else {
            hdn_card_json = JSON.parse(decodeURIComponent(hdn_card_json));
            let chart_type = hdn_card_json.type;
            let card_id = $(this).find('input[type="hidden"]').attr('id');
            card_id = card_id.split('_')
            let chart_counter = card_id[2];

            //let previous_count = hdn_card_json.previous_count;
            //let current_count = hdn_card_json.current_count;
            //if ((previous_count == '' || previous_count == null || previous_count == undefined) && (current_count == '' || current_count == null || current_count == undefined)) {
            if (chart_counter == chart_index || chart_type != '') { }
            else {
                let card_name = hdn_card_json.title;
                count_card_str = '<option value="' + card_name + '">' + card_name + '</option>';
                $('#ddl_previous_count').append(count_card_str);
                $('#ddl_current_count').append(count_card_str);
            }
            //}
        }
    });

    $('#ddl_groupby1').unbind('change');
    $('#ddl_groupby1').on('change', function (e) {
        $('#ddl_groupby1').attr('style', '');
        let obj = e.target;
        let col_data = $(obj).find('option:selected').attr('columndata');
        $('#ddl_group_date_type1').hide();
        if (col_data == '' || col_data == null || col_data == undefined) { }
        else {
            col_data = JSON.parse(decodeURIComponent(col_data));
            let ctrl_type = col_data[0].ctrl_type;
            $('#ddl_group_date_type1').val('month');
            if (ctrl_type == 8) {
                $('#ddl_groupby1').attr('style', 'width:64%;margin-right:4px;');
                $('#ddl_group_date_type1').show();
            }
        }

        add_new_chart(chart_mode, '_', 'preview');
    });

    $('#ddl_groupby2').unbind('change');
    $('#ddl_groupby2').on('change', function (e) {
        $('#ddl_groupby2').attr('style', '');
        let obj = e.target;
        let col_data = $(obj).find('option:selected').attr('columndata');
        $('#ddl_group_date_type2').hide();
        if (col_data == '' || col_data == null || col_data == undefined) { }
        else {
            col_data = JSON.parse(decodeURIComponent(col_data));
            let ctrl_type = col_data[0].ctrl_type;
            $('#ddl_group_date_type2').val('month');
            if (ctrl_type == 8) {
                $('#ddl_groupby2').attr('style', 'width:64%;margin-right:4px;');
                $('#ddl_group_date_type2').show();
            }
        }

        add_new_chart(chart_mode, '_', 'preview');
    });

    $('#ddl_group_date_type1').unbind('change');
    $('#ddl_group_date_type1').on('change', function () {
        add_new_chart(chart_mode, '_', 'preview');
    });

    $('#ddl_group_date_type2').unbind('change');
    $('#ddl_group_date_type2').on('change', function () {
        add_new_chart(chart_mode, '_', 'preview');
    });

    $('#ddl_trends').unbind('change');
    $('#ddl_trends').on('change', function () {
        add_new_chart(chart_mode, '_', 'preview');
    });

    $('#ddl_trend_group').unbind('change');
    $('#ddl_trend_group').on('change', function () {
        add_new_chart(chart_mode, '_', 'preview');
    });

    $('#chk_trends_view').unbind('change');
    $('#chk_trends_view').on('change', function () {
        $('#ddl_trends').attr('style', '');
        let trnd_chk = $('#chk_trends_view').prop('checked');
        if (trnd_chk == true) {
            $('#ddl_trends').attr('style', 'width:64%;margin-right:4px;');
            $('.cls_trends_opt').show();
        }
        else {
            $('.cls_trends_opt').hide();
        }
        $('#ddl_trend_group').show();
        $('.cls_linechart_opt').hide();
        $('.cls_line_datepicker').hide();

        add_new_chart(chart_mode, '_', 'preview');
    });

    $('#ddl_linechart_opt').unbind('change');
    $('#ddl_linechart_opt').on('change', function () {

        let ddl_val = $(this).val();
        if (ddl_val == 'is_between') {
            $('.cls_line_datepicker').show();
        }
        else {
            $('.cls_line_datepicker').hide();
            add_new_chart(chart_mode, '_', 'preview');
        }
    });

    $('#ddl_milestone_opt').unbind('change');
    $('#ddl_milestone_opt').on('change', function () {
        add_new_chart(chart_mode, '_', 'preview');
    });

    var datetime_format = localStorage.getItem("dateFormat");
    var datetime_format_ary = datetime_format.split(" ");

    var date_format = datetime_format_ary[0];
    myApp.calendar({
        input: '#start_date',
        dateFormat: date_format
    });

    myApp.calendar({
        input: '#end_date',
        dateFormat: date_format
    });

    $('#start_date').unbind('change');
    $('#start_date').on('change', function () {
        let start_date = $('#start_date').val();
        let end_date = $('#end_date').val();
        if (start_date == '' || end_date == '') { }
        else {
            add_new_chart(chart_mode, '_', 'preview');
        }
    });

    $('#end_date').unbind('change');
    $('#end_date').on('change', function () {
        let start_date = $('#start_date').val();
        let end_date = $('#end_date').val();
        if (start_date == '' || end_date == '') { }
        else {
            add_new_chart(chart_mode, '_', 'preview');
        }
    });

    $('#btn_create_chart').unbind('click');
    $('#btn_create_chart').on('click', function () {
        add_new_chart(chart_mode, chart_index);
    });

    $('#btn_add_pvt_aggrcol').unbind('click');
    $('#btn_add_pvt_aggrcol').on('click', function () {
        add_pivot_aggregate_column(chart_mode);
    });

    $('#btn_advanced_search').unbind('click');
    $('#btn_advanced_search').on('click', function () {
        open_adv_fltr_popup_for_charts('btn_click', chart_mode); return false;
    });

    if (chart_mode == 'Update') {
        var chart_hdnjson = $('#hdn_menucardid_' + chart_index).val();
        if (chart_hdnjson == '' || chart_hdnjson == null || chart_hdnjson == undefined) { }
        else {
            chart_hdnjson = JSON.parse(decodeURIComponent(chart_hdnjson));
            var udf_id = chart_hdnjson.udf_id;
            var tab_id = chart_hdnjson.tab_id;
            if (tab_id == '' || tab_id == null || tab_id == undefined) {
                tab_id = 'Select Tab Name';
            }
            var selected_chart_type = chart_hdnjson.type;
            if (selected_chart_type == '') {
                selected_chart_type = 'counter';
            }
            selected_chart_type = selected_chart_type.toUpperCase();
            var column_data = chart_hdnjson.columndata;

            var menu_title = chart_hdnjson.title;
            var default_filter_array = chart_hdnjson.default_filter;
            var calendar_data = chart_hdnjson.calendar_data;
            var position = chart_hdnjson.position;
            if (position == '' || position == null || position == undefined) {
                position = '';
            }

            var selected_type = chart_hdnjson.selected_type;

            var pivot_config = chart_hdnjson.pivot_config;
            if (pivot_config == '' || pivot_config == null || pivot_config == undefined) {
                pivot_config = [];
            }
            glb_pivot_config = pivot_config;

            let previous_count = chart_hdnjson.previous_count;
            let current_count = chart_hdnjson.current_count;
            if ((previous_count == '' || previous_count == null || previous_count == undefined) && (current_count == '' || current_count == null || current_count == undefined)) { }
            else {
                $('#ddl_previous_count').val(previous_count);
                $('#ddl_current_count').val(current_count);
            }
        }

        let udf_name = $('#ddl_udf_name option:selected').text();

        if (selected_chart_type == 'COUNTER' || selected_chart_type == 'LINE') {
            //single counter
            $('#ddl_udf_name').val(tab_id);
            if ($('#ddl_udf_name option:selected').text() == menu_title) { }
            else {
                if (selected_type == 'udf_name') {
                    $('#ddl_udf_name').val(udf_id);
                }
            }
        }
        else {
            if (column_data.length > 0 || selected_chart_type == 'PIVOT') {
                // give groupby
                $('#ddl_udf_name').val(tab_id);
                if ($('#ddl_udf_name option:selected').text() == menu_title) { }
                else {
                    if (selected_type == 'udf_name') {
                        $('#ddl_udf_name').val(udf_id);
                    }
                }
            }
            else {
                // all udf
                $('#ddl_udf_name').val(udf_id);
            }
        }

        prev_udf_val = $('#ddl_udf_name').val();
        $('.chart_type').siblings().removeClass('chart_active');
        $('.chart_type').each(function () {
            let chart_type = $(this).find('.card-footer span').text();
            if (chart_type == selected_chart_type) {
                $(this).addClass('chart_active');
            }
        });

        $('#ddl_udf_name').trigger('change');
        if (column_data.length > 0) {
            for (let i = 0; i < column_data.length; i++) {
                var header = column_data[i].header;
                var custom_header = column_data[i].custom_header;
                if (custom_header == '' || custom_header == null || custom_header == undefined) {
                    custom_header = header;
                }
                var group_date_type_val = column_data[i].group_date_type;
                var aggregate_data = column_data[i].aggregate_fun;
                var ctrl_type = column_data[i].ctrl_type;
                if (aggregate_data == 'group_by') {
                    if (selected_chart_type == 'PIVOT') {
                        $('.cls_aggr_fun').hide();
                        $('.cls_pvttbl').show();
                        let edit_param = "add_new_pivot_row_column(" + udf_id + ",'_','edit',this);";
                        let delete_param = "$(this).parent().remove();add_new_chart('update', '_', 'preview');";
                        let str = '<span class="badge badge-dark mr-1" columndata="' + encodeURIComponent(JSON.stringify(column_data[i])) + '"   title="' + aggregate_data + '">' + header + ' <i class="fa fa-pencil-square-o mr-0 ml-1" style="color:white !important;display:none;" onclick="' + edit_param + '"></i><i class="fa fa-times mr-0 ml-1" onclick="' + delete_param + '"></i></span>';
                        $('#container_pvttbl_row').append(str);
                    }
                    else {
                        $('#ddl_groupby1').attr('style', '');
                        $('#ddl_groupby2').attr('style', '');
                        if ($('#ddl_groupby1').val() == 'Select Column Name') {
                            $('#ddl_groupby1').val(header);
                            $('.cls_groupby1').show();

                            if (ctrl_type == 8) {
                                $('#ddl_groupby1').attr('style', 'width:64%;margin-right:4px;');
                                $('#ddl_group_date_type1').show();
                                $('#ddl_group_date_type1').val(group_date_type_val);
                            }
                            else {
                                $('#ddl_group_date_type1').hide();
                            }
                        }
                        else {
                            $('#ddl_groupby2').val(header);
                            $('.cls_groupby2').show();

                            if (ctrl_type == 8) {
                                $('#ddl_groupby2').attr('style', 'width:64%;margin-right:4px;');
                                $('#ddl_group_date_type2').show();
                                $('#ddl_group_date_type2').val(group_date_type_val);
                            }
                            else {
                                $('#ddl_group_date_type2').hide();
                            }
                        }
                    }
                }
                else {
                    if (selected_chart_type == 'PIVOT') {
                        $('.cls_aggr_fun').hide();
                        $('.cls_pvttbl').show();

                        if (aggregate_data == 'group_by') {
                            var av_tooltip = aggregate_data;
                            var edit_param = "add_new_pivot_row_column(" + udf_id + ",'_', 'edit', this)";
                            var edit_display_style = 'display:none;';
                        }
                        else {
                            let tlp_cust_header = '';
                            if (header != custom_header) {
                                tlp_cust_header = ', Header : ' + header + ', Custom header : ' + custom_header;
                            }
                            var av_tooltip = 'Aggregate function : ' + aggregate_data + '' + tlp_cust_header;
                            var edit_param = "add_pivot_aggregate_column('Update','edit',this);";
                            var edit_display_style = 'display:inline-block;';
                        }

                        let delete_param = "$(this).parent().remove();add_new_chart('update', '_', 'preview');";
                        let str = '<span class="badge badge-dark mr-1" columndata="' + encodeURIComponent(JSON.stringify(column_data[i])) + '"   title="' + av_tooltip + '" style="background-color: #343a407d;">' + custom_header + ' <i class="fa fa-pencil-square-o mr-0 ml-1" style="color:white !important;' + edit_display_style + '" onclick="' + edit_param + '"></i><i class="fa fa-times mr-0 ml-1" onclick="' + delete_param + '"></i></span>';
                        $('#container_pvttbl_row').append(str);
                    }
                    else {
                        $('#ddl_aggregate_data').val(aggregate_data);
                        $('#ddl_aggregate_column').val(header);
                        if (aggregate_data != 'count') {
                            $('#ddl_aggregate_column').show();
                        }
                    }
                }
            }
        }
        prev_groupby_val1 = $('#ddl_groupby1').val();
        prev_groupby_val2 = $('#ddl_groupby2').val();
        $('#txt_source_name').val(menu_title);
        $('#txt_card_position').val(position);
        prev_udf_name = menu_title;

        if (calendar_data == '' || calendar_data == null || calendar_data == undefined) { }
        else {
            if (calendar_data.length > 0) {
                let trend_col = calendar_data[0].columnName;
                let trend_date_type = calendar_data[0].calendar_type;
                let group_date_type = calendar_data[0].group_date_type;
                $('#ddl_trends').val(trend_col);

                $('.cls_groupby1').hide();
                $('.cls_groupby2').hide();

                if (selected_chart_type == 'LINE') {
                    $('.cls_trends_opt').show();
                    $('#ddl_trend_group').hide();
                    $('#ddl_linechart_opt').show();

                    if (trend_date_type == 'is_between') {
                        let val1 = calendar_data[0].value[0];
                        let val2 = calendar_data[0].value[1];
                        $('.div-datepicker1').show();
                        $('#start_date').val(val1);
                        $('#end_date').val(val2);
                    }
                    else {
                        $('.div-datepicker1').hide();
                    }

                    $('#ddl_milestone_opt').show();
                    $('#ddl_linechart_opt').val(trend_date_type);
                    $('#ddl_milestone_opt').val(group_date_type);
                }
                else {
                    $('#chk_trends_view').prop('checked', true);
                    $('.cls_trends_opt').show();
                    $('#ddl_trend_group').val(trend_date_type);
                    $('#ddl_linechart_opt').hide();
                    $('.div-datepicker1').hide();
                    $('#ddl_milestone_opt').hide();
                }
            }
            else {
                $('#chk_trends_view').prop('checked', false);
                $('.cls_trends_opt').hide();
            }
        }

        if (default_filter_array == '' || default_filter_array == null || default_filter_array == undefined) { }
        else {
            if (default_filter_array.length > 0) {
                $('.td_def_fltr').css('display', 'inline-block');
                var str = '';
                //var str = '<span class="mr-1 text-dark">Filter By:</span>';
                for (let i = 0; i < default_filter_array.length; i++) {
                    var def_val_ary = default_filter_array[i].value;
                    if (def_val_ary == '' || def_val_ary == null || def_val_ary == undefined) {
                        let time_condition = default_filter_array[i].calendar_type;
                        def_val_ary = get_date_as_per_condition(time_condition);
                        default_filter_array[i]['value'] = def_val_ary;
                    }
                    let search_str = '';
                    if (def_val_ary == '' || def_val_ary == null || def_val_ary == undefined) { }
                    else {
                        for (let j = 0; j < def_val_ary.length; j++) {
                            if (j == def_val_ary.length - 1) {
                                search_str = search_str + def_val_ary[j];
                            }
                            else {
                                search_str = search_str + def_val_ary[j] + ',';
                            }
                        }
                    }

                    let col_name = default_filter_array[i].columnName;
                    let search_obj_str = JSON.stringify(default_filter_array[i]);
                    search_obj_str = encodeURIComponent(search_obj_str);
                    str += '<div class="label-default cursor-pointer d-inline" style="background-color: white;border: solid 1px #aaa;margin: 2px 10px 0px 0px;border-radius: 0.25rem;font-size: 12px;padding: 1px 5px;">';
                    str += '<span class="mr-1" style="color:gray;font-size:12px;font-weight:bold;">' + col_name + ': </span>';
                    str += '<span class="badge badge-light mr-1" data="' + search_obj_str + '">' + search_str.toString() + '</span>';
                    str += '</div>';
                }
                $(".div-filtered-item").empty();
                $(".div-filtered-item").append(str);

                //$('#btn_aply_def_fltr').trigger('click');
                display_selected_filter_data(default_filter_array);
            }
        }
        is_deffltr_change_flag = 1;
    }
    else {
        //set the position of card
        let position_array = [];
        $('#dashboard_container input[type="hidden"]').each(function () {
            let hdn_dashboard_array = $(this).val();
            if (hdn_dashboard_array == '' || hdn_dashboard_array == null || hdn_dashboard_array == undefined) { }
            else {
                hdn_dashboard_array = JSON.parse(decodeURIComponent(hdn_dashboard_array));
                let position = hdn_dashboard_array.position;
                position = parseInt(position);
                position_array.push(position);
            }
        });
        let max_position = Math.max.apply(null, position_array);
        $('#txt_card_position').val(max_position + 1);
    }
}

add_new_chart = (chart_mode, chart_index, flag_view) => {
    try {
        if (flag_view == 'preview') {
            $('#preview_card').empty();
        }

        var source_name = $('#txt_source_name').val();
        var tab_id = 'Select Tab Name';
        var udf_id = $('#ddl_udf_name option:selected').attr('udf_id');
        if (udf_id == '' || udf_id == null || udf_id == undefined) {
            // for all udf name select
            udf_id = $('#ddl_udf_name').val();
            var tab_name = 'All Tabs';
        }
        else {
            // select tab name
            tab_id = $('#ddl_udf_name').val();
        }

        var group_by1 = $('#ddl_groupby1:visible').val();
        var group_by2 = $('#ddl_groupby2:visible').val();
        var ddl_tabname_lng = $('#ddl_udf_name').find('option[udf_id="' + udf_id + '"]').length;

        var chart_type = $('#div_charttype .chart_active').find('.card-footer span').text();
        chart_type = chart_type.toLowerCase();
        if (chart_type == 'counter') {
            chart_type = '';
        }

        if (ddl_tabname_lng == 1) {
            tab_id = $('#ddl_udf_name').find('option[udf_id="' + udf_id + '"]').val();
        }
        $('#card_title').empty();
        $('#card_alert').empty();
        if (source_name == 'Select Source Name' || source_name == '' || source_name == null || source_name == undefined) {
            if (flag_view == 'preview') {
                $('#preview_card_alert').attr('style', 'display:block !important');
                $('#preview_card').css('display', 'none');
                $('#card_title').append(source_name);
                $('#card_alert').append('Please select source name.');
                //let style_padding = parseInt($('#card_alert')[0].offsetHeight / 2) - 10;
                //$('#card_alert').css('padding-top', style_padding + 'px');
                $('#preview_card_alert').addClass('mk_vibrate');
            }
            else {
                alert('Please select source name.');
            }
        }
        else if (chart_type == 'line' && $('#ddl_trends option').length < 2) {
            if (flag_view == 'preview') {
                $('#preview_card_alert').attr('style', 'display:block !important');
                $('#preview_card').css('display', 'none');
                $('#card_title').append(source_name);
                $('#card_alert').append('No date column found!');
                //let style_padding = parseInt($('#card_alert')[0].offsetHeight / 2) - 10;
                //$('#card_alert').css('padding-top', style_padding + 'px');
                $('#preview_card_alert').addClass('mk_vibrate');
            }
            else {
                alert('No date column found!');
            }
        }
        else if (chart_type == 'line' && ($('#ddl_trends').val() == 'Select Column Name')) {
            if (flag_view == 'preview') {
                $('#preview_card_alert').attr('style', 'display:block !important');
                $('#preview_card').css('display', 'none');
                $('#card_title').append(source_name);
                $('#card_alert').append('Required Date column for line chart!');
                //let style_padding = parseInt($('#card_alert')[0].offsetHeight / 2) - 10;
                //$('#card_alert').css('padding-top', style_padding + 'px');
                $('#preview_card_alert').addClass('mk_vibrate');
            }
            else {
                alert('Required Date column for line chart!');
            }
        }
        else if ((group_by1 == '' || group_by1 == null || group_by1 == undefined || group_by1 == 'Select Column Name') && (chart_type == 'bar' || chart_type == 'pie' || chart_type == 'donut' || chart_type == 'column') && tab_id != 'Select Tab Name') {   //
            // chart should be bar/pie/column
            if (flag_view == 'preview') {
                $('#preview_card_alert').attr('style', 'display:block !important');
                $('#preview_card').css('display', 'none');
                $('#card_title').append(source_name);
                $('#card_alert').append('Required X-axis for bar/pie/donut/column chart!');
                //let style_padding = parseInt($('#card_alert')[0].offsetHeight / 2) - 10;
                //$('#card_alert').css('padding-top', style_padding + 'px');
                $('#preview_card_alert').addClass('mk_vibrate');
            }
            else {
                alert('Required X-axis for bar/pie/donut/column chart!');
            }
        }
        else if (((group_by2 == '' || group_by2 == null || group_by2 == undefined || group_by2 == 'Select Column Name') || (group_by1 == '' || group_by1 == null || group_by1 == undefined || group_by1 == 'Select Column Name')) && (chart_type == 'stackbar' || chart_type == 'stackcolumn') && (ddl_tabname_lng >= 2 && tab_id == 'Select Tab Name')) {
            // chart should be stackbar/stackcolumn
            if (flag_view == 'preview') {
                $('#preview_card_alert').attr('style', 'display:block !important');
                $('#preview_card').css('display', 'none');
                $('#card_title').append(source_name);
                $('#card_alert').append('Please select bar/pie/donut/column chart, it is required when more than one tabs are available!');
                //let style_padding = parseInt($('#card_alert')[0].offsetHeight / 2) - 10;
                //$('#card_alert').css('padding-top', style_padding + 'px');
                $('#preview_card_alert').addClass('mk_vibrate');
            }
            else {
                alert('Please select bar/pie/donut/column chart, it is required when more than one tabs are available!');
            }
        }
        else if (((group_by2 == '' || group_by2 == null || group_by2 == undefined || group_by2 == 'Select Column Name') || (group_by1 == '' || group_by1 == null || group_by1 == undefined || group_by1 == 'Select Column Name')) && (chart_type == 'stackbar' || chart_type == 'stackcolumn')) {
            // chart should be stackbar/stackcolumn
            if (flag_view == 'preview') {
                $('#preview_card_alert').attr('style', 'display:block !important');
                $('#preview_card').css('display', 'none');
                $('#card_title').append(source_name);
                $('#card_alert').append('Required X-axis & Y-axis for stackbar/stackcolumn chart!');
                //let style_padding = parseInt($('#card_alert')[0].offsetHeight / 2) - 10;
                //$('#card_alert').css('padding-top', style_padding + 'px');
                $('#preview_card_alert').addClass('mk_vibrate');
            }
            else {
                alert('Required X-axis & Y-axis for stackbar/stackcolumn chart!');
            }
        }
        else if ((group_by1 == '' || group_by1 == null || group_by1 == undefined || group_by1 == 'Select Column Name') && (group_by2 == '' || group_by2 == null || group_by2 == undefined || group_by2 == 'Select Column Name') && (chart_type == '') && (ddl_tabname_lng >= 2 && tab_id == 'Select Tab Name')) {   /// 
            if (flag_view == 'preview') {
                $('#preview_card_alert').attr('style', 'display:block !important');
                $('#preview_card').css('display', 'none');
                $('#card_title').append(source_name);
                $('#card_alert').append('Please select bar/pie/donut/column chart, it is required when more than one tabs are available!');
                //let style_padding = parseInt($('#card_alert')[0].offsetHeight / 2) - 10;
                //$('#card_alert').css('padding-top', style_padding + 'px');
                $('#preview_card_alert').addClass('mk_vibrate');
            }
            else {
                alert('Please select bar/pie/donut/column chart, it is required when more than one tabs are available!');
            }
        }
        else if (chart_type == 'pivot' && (ddl_tabname_lng >= 2 && tab_id == 'Select Tab Name')) {
            if (flag_view == 'preview') {
                $('#preview_card_alert').attr('style', 'display:block !important');
                $('#preview_card').css('display', 'none');
                $('#card_title').append(source_name);
                //$('#card_alert').append('Please select bar/pie/donut/column chart, it is required when more than one tabs are available!');
                //let style_padding = parseInt($('#card_alert')[0].offsetHeight / 2) - 10;
                //$('#card_alert').css('padding-top', style_padding + 'px');
                $('#preview_card_alert').addClass('mk_vibrate');
            }
            else {
                alert('Please select bar/pie/donut/column chart, it is required when more than one tabs are available!');
            }
        }
        else {
            if (flag_view == 'preview') {
                $('#preview_card_alert').attr('style', 'display:none !important');
                $('#preview_card').css('display', 'block');
            }
            else {
                is_chartchange_flag = 1;
                myApp.closeModal('.popup-chart-config');
                //$('#mdl_def_fltr_chart').modal('hide');
                $('#dashboard_page_Content').scrollTop(0);
                $('.td_def_fltr').css('display', 'none');
            }

            var columndata = [];
            if (chart_type == 'pivot') { }
            else {
                var aggregate_fun = $('#ddl_aggregate_data').val();
                if (aggregate_fun != 'count') {
                    let aggregate_coldata = $('#ddl_aggregate_column:visible option:selected').attr('columndata');
                    if (aggregate_coldata == '' || aggregate_coldata == null || aggregate_coldata == undefined) { }
                    else {
                        aggregate_coldata = JSON.parse(decodeURIComponent(aggregate_coldata));
                        aggregate_coldata[0].aggregate_fun = aggregate_fun;
                        columndata.push(aggregate_coldata[0]);
                    }
                }
            }

            var col1 = $('#ddl_groupby1:visible option:selected').attr('columndata');
            var col2 = $('#ddl_groupby2:visible option:selected').attr('columndata');
            if (col1 == '' || col1 == null || col1 == undefined) { }
            else {
                col1 = JSON.parse(decodeURIComponent(col1));
                let group_date_type_val = $('#ddl_group_date_type1').val();
                col1[0].group_date_type = group_date_type_val;
                columndata.push(col1[0]);
            }

            if (col2 == '' || col2 == null || col2 == undefined) { }
            else {
                col2 = JSON.parse(decodeURIComponent(col2));
                let group_date_type_val = $('#ddl_group_date_type2').val();
                col2[0].group_date_type = group_date_type_val;
                columndata.push(col2[0]);
            }

            if (chart_type == 'pivot') {
                $('#container_pvttbl_row span').each(function () {
                    let pvt_col = $(this).attr('columndata');
                    pvt_col = JSON.parse(decodeURIComponent(pvt_col));
                    columndata.push(pvt_col);
                });
                columndata = sortArrayByTwoProperties(columndata, "pvt_index", true);
            }

            var submenu = [];
            if (tab_name == 'All Tabs' && (col1 == 'Select Column Name' || col1 == '' || col1 == null || col1 == undefined) && (col2 == 'Select Column Name' || col1 == '' || col1 == null || col1 == undefined)) {
                if (ddl_tabname_lng == 1) {
                    var menu_tab_id = $('#ddl_udf_name').find('option[udf_id="' + udf_id + '"]').val();
                }
                else {
                    var menu_tab_id = '';
                    $('#ddl_udf_name').find('option[udf_id="' + udf_id + '"]').each(function () {
                        let tab_id = $(this).val();
                        if (tab_id == 'Select Tab Name') { }
                        else {
                            let tab_name = $(this).text();
                            submenu.push({
                                'tab_id': tab_id,
                                'tab_name': tab_name
                            });
                        }
                    });
                }
            }
            else {
                var menu_tab_id = tab_id;
            }

            var menu_title = source_name;

            let selected_type = 'udf_name';
            if ($('#ddl_udf_name option:selected').attr('udf_name') == undefined) {
                selected_type = 'tab_name';
            }

            var style = [];
            if (flag_view == 'preview') {
                style.push({
                    'top': 0,
                    'left': 0,
                    'width': 40,
                    'height': 163
                });
            }
            else {
                if (chart_mode == 'Update') {
                    var chart_hdnjson = $('#hdn_menucardid_' + chart_index).val();
                    if (chart_hdnjson == '' || chart_hdnjson == null || chart_hdnjson == undefined) { }
                    else {
                        chart_hdnjson = JSON.parse(decodeURIComponent(chart_hdnjson));
                        style = chart_hdnjson.style;
                    }

                    for (m = 0; m < menu_arry.length; m++) {
                        let menu_chart_count = menu_arry[m].counter;
                        if (menu_chart_count == chart_index) {
                            menu_arry.splice(m, 1);
                            break;
                        }
                    }
                }
                else {
                    // Add new card at bottom of container
                    var card_top = 0, card_left = 0, chart_top_array = [], chart_bottom_array = [];

                    //if ($('#dashboard_container .menucard').length == 0) { }
                    //else {
                    //    $('#dashboard_container .menucard').each(function () {
                    //        var find_top = $(this)[0].offsetTop;
                    //        chart_top_array.push(find_top);
                    //    });

                    //    var max_top = Math.max.apply(null, chart_top_array);

                    //    $('#dashboard_container .menucard').each(function () {
                    //        let find_left = $(this)[0].offsetLeft;
                    //        var find_top = $(this)[0].offsetTop;

                    //        let find_right = jQuery(this).css('right');
                    //        if (find_right.indexOf('px') > -1) {
                    //            find_right = find_right.replaceAll('px', '');
                    //        }
                    //        find_right = parseInt(find_right);

                    //        var height = $(this)[0].clientHeight;
                    //        var width = $(this)[0].clientWidth;
                    //        let parentWidth = $(this).parent()[0].clientWidth;
                    //        var chart_left = parseInt((100 * find_left) / parentWidth);

                    //        if (find_top >= max_top) {
                    //            if (chart_left < 32 && (find_right > 429 && find_right < 1294)) {
                    //                // check for add 2nd card
                    //                card_top = find_top;
                    //                card_left = width + find_left + 10;
                    //                card_left = (100 * card_left) / parentWidth;
                    //            }
                    //            else if ((chart_left >= 32 && chart_left < 65) && (find_right > 350 && find_right < 460)) {
                    //                // check for add 3rd card
                    //                card_top = find_top;
                    //                card_left = width + find_left + 10;
                    //                card_left = (100 * card_left) / parentWidth;
                    //            }
                    //            else {
                    //                // add new card at bottom
                    //                card_top = height + find_top + 5;
                    //                card_left = 0;
                    //            }
                    //        }
                    //    });
                    //}

                    //let check_flag = check_for_convert_width_or_left();
                    let check_flag = true;
                    if (check_flag == true) {
                        var chart_width = 32;  // value in %
                    }
                    else {
                        var chart_width = 425;   // value in px
                    }

                    style.push({
                        'top': card_top,  // value in px
                        'left': card_left,
                        'width': chart_width,
                        'height': 163  // value in px
                    });
                }
            }

            var default_filter_array = [];
            $('.filtered-items-outer').find('.badge').each(function () {
                var search_obj = $(this).attr('data');
                search_obj = JSON.parse(decodeURIComponent(search_obj));
                let ctrl_type = search_obj.ctrl_type;
                if (ctrl_type == 8) {
                    let calendar_type = search_obj.calendar_type;
                    if (calendar_type == 'is_before' || calendar_type == 'is_after' || calendar_type == 'is_between') { }
                    else {
                        delete search_obj['value'];
                    }
                }
                default_filter_array.push(search_obj);
            });

            var trend_obj = [];
            let calendar_data = $('#ddl_trends:visible option:selected').attr('calendar_data');
            if (calendar_data == '' || calendar_data == null || calendar_data == undefined) { }
            else {
                calendar_data = JSON.parse(decodeURIComponent(calendar_data));
                if (chart_type == 'line') {
                    var group_date_type = $('#ddl_milestone_opt').val();
                    var calendar_type = $('#ddl_linechart_opt').val();

                    calendar_data[0].group_date_type = group_date_type;

                    if (calendar_type == 'is_between') {
                        calendar_data[0]['value'] = get_date_as_per_condition(calendar_type);
                    }
                }
                else {
                    var calendar_type = $('#ddl_trend_group').val();
                }

                calendar_data[0].calendar_type = calendar_type;
                trend_obj.push(calendar_data[0]);
            }

            let position = $('#txt_card_position').val();
            let pivot_config = [];
            let pivot_type = $('#menucardid__ .pvtRenderer').val();
            let pivot_aggregator = $('#menucardid__ .pvtAggregator').val();
            if (pivot_type == '' || pivot_type == null || pivot_type == undefined) {
                if (glb_pivot_config == '' || glb_pivot_config == null || glb_pivot_config == undefined) { }
                else {
                    pivot_config = glb_pivot_config;
                }
            }
            else {
                pivot_config.push({
                    pivot_type: pivot_type,
                    pivot_aggregator: pivot_aggregator
                });
            }

            let previous_count = $('#ddl_previous_count').val();
            let current_count = $('#ddl_current_count').val();
            if (previous_count == 'select card' && current_count == 'select card') {
                previous_count = undefined;
                current_count = undefined;
            }

            var dashboard_menuarray = [];
            dashboard_menuarray.push({
                'tab_id': menu_tab_id,
                'default_filter': default_filter_array,
                'calendar_data': calendar_data,
                'title': menu_title,
                'submenu': submenu,
                'udf_id': udf_id,
                'icon_base64': '',
                'type': chart_type,
                'style': style,
                'columndata': columndata,
                'counter': chart_index,
                'position': position,
                'selected_type': selected_type,
                'pivot_config': pivot_config,
                'previous_count': previous_count,
                'current_count': current_count
            });

            let dashboard_id = $('#ddl_dashboard_list').val();

            let card_view;
            if (flag_view == 'preview') { }
            else {
                if (chart_mode == 'Update') {
                    card_view = $('#menucardid_' + chart_index).find('.view_type_active').hasClass('cls_tbl_view');
                    $('#menucardid_' + chart_index).remove();
                }
                else {
                    chart_mode = 'dragdrop';
                    card_view = false;
                }
            }

            if (card_view == true) {
                card_view = 'table_view';
            }
            else {
                card_view = 'chart_view';
            }

            let new_dashboard_menuarray = JSON.stringify(dashboard_menuarray);
            new_dashboard_structure(JSON.stringify(new_dashboard_menuarray), dashboard_id, chart_mode, chart_index, '', card_view, flag_view, '', 'report');

            if (flag_view == 'preview') {
                setTimeout(function () {
                    $('#menucardid__').addClass('mk_vibrate');
                }, 500);
            }
            else {
                $('#ddl_groupby1').val('Select Column Name');
                $('#ddl_groupby2').val('Select Column Name');
                $('#ddl_group_date_type1').val('month');
                $('#ddl_group_date_type2').val('month');

                $('#ddl_udf_name').empty();
                $('#ddl_groupby1').empty();
                $('#ddl_groupby2').empty();
                $('.div-filtered-item').empty();
                setTimeout(function () {
                    let dashboard_name = $('#ddl_dashboard_list option:selected').text();
                    if (dashboard_name.includes('(User)') == true) {
                        dashboard_name = dashboard_name.split('(User)');
                    }
                    else if (dashboard_name.includes('(Admin)') == true) {
                        dashboard_name = dashboard_name.split('(Admin)');
                    }
                    dashboard_name = dashboard_name[0];

                    create_update_userdashboard(dashboard_name, 'notrefresh_chart'); //, 'notrefresh_chart'
                }, 1000);
            }
        }

        if (flag_view == 'preview') {
            setTimeout(function () {
                $('#menucardid__').removeClass('mk_vibrate');
                $('#preview_card_alert').removeClass('mk_vibrate');
            }, 700);
        }
    }
    catch (e) {
        alert(e + '_add_new_chart');
    }
}

edit_selected_dashboard_page = () => {
    is_name_changed = true;
    let page_name = $('#ddl_dashboard_list option:selected').text();
    if (page_name.includes('(User)') == true) {
        page_name = page_name.split('(User)');
    }
    else if (page_name.includes('(Admin)') == true) {
        page_name = page_name.split('(Admin)');
    }
    page_name = page_name[0];

    let tab_dashboard_id = $('#ddl_dashboard_list').val();
    var dashboard_name = prompt('Please enter dashboard name:', page_name);
    if (dashboard_name == null) { }
    else if (dashboard_name == '' || dashboard_name == undefined) {
        alert('Please enter dashboard name');
    }
    else {
        $('#ddl_dashboard_list option:selected').text(dashboard_name + '(User)');
        $('#ddl_dashboard_list').val(tab_dashboard_id);
        create_update_userdashboard(dashboard_name, 'notrefresh_chart');
    }
}

// Deleting dashboard page 04042024 PG
delete_selected_dashboard_page = () => {
    let confirm_delete = confirm("Are you sure, you want to deleting this dashboard?");
    if (confirm_delete == true) {
        let delete_dashboard_id = $('#ddl_dashboard_list').val();

        var Param_obj = [];
        Param_obj.push({
            'Dashboard_id': delete_dashboard_id,
            'flag': 'Delete'
        });

        //loading('Deleting Dashboard');
        var getdata = new Webservicecall_REST(global_wcf_url + 'InsertUpdateDelete_DashboardMaster', JSON.stringify(Param_obj), function (e) {
            try {
                var All_data = e.responseText;
                All_data = JSON.parse(All_data);
                var status = All_data[0].status;
                var message = All_data[0].message;
                if (status == 1) {
                    mk_notify('Dashboard has been deleted successfully');
                    //get_dashboard();
                    changeurl('selection.html');
                }
                else {
                    mk_notify(message);
                }
            }
            catch (e) {
                alert(e + '_delete_selected_dashboard_page()');
            }
            loading_hide();
        }, onfail_request);
        getdata.callOtherDomain();
    }
}

add_new_dashboard = () => {
    var page_name = prompt('Please enter dashboard name:');
    if (page_name == null) { }
    else if (page_name == '' || page_name == undefined) {
        alert('Please enter dashboard name');
    }
    else {
        let user_id = storage.getItem('user_id');
        let str = '<option value="0" user_id="' + user_id + '">' + page_name + '(User)</option>';
        $('#ddl_dashboard_list').prepend(str);
        $('#ddl_dashboard_list').val('0');
        $('#dashboard_container').empty();

        create_update_userdashboard(page_name, '');
    }
}

copy_existing_dashboard = () => {
    try {
        var page_name = prompt('Please enter dashboard name:');
        if (page_name == null) { }
        else if (page_name == '' || page_name == undefined) {
            alert('Please enter dashboard name');
        }
        else {
            let role_id = JSON.parse(storage.getItem('role_id'));
            var chart_json = [];
            $('#dashboard_container').find('input[id^="hdn_menucardid_"]').each(function () {
                var hdn_json = $(this).val();
                if (hdn_json == '' || hdn_json == null || hdn_json == undefined) { }
                else {
                    hdn_json = decodeURIComponent(hdn_json);
                    hdn_json = JSON.parse(hdn_json);
                    var icon_base64 = hdn_json.icon_base64;
                    if (icon_base64.indexOf('data:image/') > -1) {
                        hdn_json.icon_base64 = '';
                    }
                    delete hdn_json['counter'];

                    chart_json.push(hdn_json);
                }
            });

            var Param_obj = [];
            Param_obj.push({
                'Dashboard_id': 0,
                'Page_name': page_name,
                'Role_id': role_id,
                'Data': chart_json,
                'dashboard_email': 'true',
                'flag': 'Insert'
            });

            var getdata = new Webservicecall_REST(global_wcf_url + 'InsertUpdateDelete_userwise_Dashboard_Master', JSON.stringify(Param_obj), function (e) {

                var All_data = e.responseText;
                All_data = JSON.parse(All_data);
                var status = All_data[0].status;
                var message = All_data[0].message;
                if (status == 1) {
                    mk_notify('Dashboard has been copied successfully');
                    get_dashboard();
                }
                else {
                    mk_notify(message);
                }
                loading_hide();
            }, onfail_request);
            getdata.callOtherDomain();
        }
    }
    catch (e) {
        alert(e + '_copy_existing_dashboard');
    }
}

create_update_userdashboard = (page_name, flag_chart) => {
    try {
        is_chartchange_flag = 1;
        var flag_final_save = 0;
        var ms = 0;
        if (page_name == '' || page_name == null || page_name == undefined) {
            var page_name = $('#ddl_dashboard_list option:selected').text();

            if (page_name.includes('(User)') == true) {
                page_name = page_name.split('(User)');
            }
            else if (page_name.includes('(Admin)') == true) {
                page_name = page_name.split('(Admin)');
            }
            page_name = page_name[0];
        }

        var role_id = JSON.parse(storage.getItem('role_id'));
        var dashboard_id = $('#ddl_dashboard_list').val();
        var user_id = $('#ddl_dashboard_list option:selected').attr('user_id');
        if ((user_id == '' || user_id == null || user_id == undefined || user_id == 'undefined')) {
            var flag_chartconfig = 'Insert';
            flag_chart = '';
            is_chartchange_flag = 0;
            var isConfirm = confirm("Do you want to save your changes as a new dashboard?");
            if (isConfirm == true) {
                var page_name = prompt('Please enter new dashboard name:');
                if (page_name == null) {
                    flag_final_save = 0;
                }
                else if (page_name == '' || page_name == undefined) {
                    alert('Please enter new dashboard name');
                    flag_final_save = 0;
                }
                else {
                    flag_final_save = 1;
                }
            }
        }
        else {
            if (dashboard_id == '' || dashboard_id == null || dashboard_id == undefined || dashboard_id == '0') {
                var flag_chartconfig = 'Insert';
                flag_chart = '';
            }
            else {
                var flag_chartconfig = 'Update';
            }
            flag_final_save = 1;
        }

        if (flag_final_save == 1) {
            //var chart_top_left_css = return_sort_top_left_css();

            var chart_json = [];
            $('#dashboard_container').find('input[id^="hdn_menucardid_"]').each(function () {
                var hdn_json = $(this).val();
                var card_counter = $(this).parent().attr('id');
                card_counter = card_counter.split('_');
                card_counter = card_counter[1];
                if (hdn_json == '' || hdn_json == null || hdn_json == undefined) { }
                else {
                    hdn_json = decodeURIComponent(hdn_json);
                    hdn_json = JSON.parse(hdn_json);
                    var icon_base64 = hdn_json.icon_base64;
                    if (icon_base64.indexOf('data:image/') > -1) {
                        hdn_json.icon_base64 = '';
                    }
                    delete hdn_json['counter'];

                    // temporary conversion of chart width & left 
                    //var style = hdn_json.style;

                    // Convert width px to %
                    //let chart_width = $(this).parent().width();
                    //let parentWidth = $(this).parent().parent()[0].clientWidth;
                    //chart_width = ((100 * chart_width) / parentWidth);
                    //style[0].width = chart_width;

                    // Convert left px to %
                    //let chart_left = $(this).parent().css('left');
                    //if (chart_left.indexOf('px') > -1) {
                    //    chart_left = chart_left.replaceAll('px', '');
                    //    var leftInPercentage = ((100 * chart_left) / parentWidth);
                    //    style[0].left = leftInPercentage;
                    //}

                    //hdn_json.style = style;

                    var def_fltr_obj = hdn_json.default_filter;
                    if (def_fltr_obj == '' || def_fltr_obj == null || def_fltr_obj == undefined) { }
                    else {
                        for (let d = 0; d < def_fltr_obj.length; d++) {
                            let ctrl_type = def_fltr_obj[d].ctrl_type;
                            if (ctrl_type == 8) {
                                let calendar_type = def_fltr_obj[d].calendar_type;
                                if (calendar_type == 'is_before' || calendar_type == 'is_after' || calendar_type == 'is_between') { }
                                else {
                                    delete def_fltr_obj[d]['value'];
                                }
                            }
                        }
                        hdn_json.default_filter = def_fltr_obj;
                    }

                    ////dynamically set card position
                    //for (let p = 0; p < chart_top_left_css.length; p++) {
                    //    let css_counter = chart_top_left_css[p].counter;
                    //    if (card_counter == css_counter) {
                    //        hdn_json.position = p + 1;
                    //        break;
                    //    }
                    //}
                    //$(this).val(encodeURIComponent(JSON.stringify(hdn_json)));
                    chart_json.push(hdn_json);
                }
            });

            let chk_dashboard_mail = 'true', Escalation_interval = [];
            if (flag_chartconfig == 'Insert') {
                chk_dashboard_mail = 'true';
            }
            else {
                //chk_dashboard_mail = $('#chk_userdashboard_mail')[0].checked;
                //chk_dashboard_mail = chk_dashboard_mail.toString();

                if (chk_dashboard_mail == 'true') {
                    let esc_val = $('#hdn_dashboard_mail_config').val();
                    if (esc_val == '' || esc_val == null || esc_val == undefined) { }
                    else {
                        Escalation_interval = JSON.parse(esc_val);
                    }
                }


            }

            var Param_obj = [];
            Param_obj.push({
                'Dashboard_id': dashboard_id,
                'Page_name': page_name,
                'Role_id': role_id,
                'Data': chart_json,
                'dashboard_email': chk_dashboard_mail,
                'Escalation_interval': Escalation_interval,
                'flag': flag_chartconfig
            });

            if (flag_chartconfig == 'Insert') {
                //loading('Creating User Dashboard');
            }

            var getdata = new Webservicecall_REST(global_wcf_url + 'InsertUpdateDelete_userwise_Dashboard_Master', JSON.stringify(Param_obj), function (e) {
                try {
                    var All_data = e.responseText;
                    All_data = JSON.parse(All_data);
                    var status = All_data[0].status;
                    var message = All_data[0].message;
                    if (status == 1) {
                        if (flag_chart == 'notrefresh_chart') { }
                        else {
                            if (flag_chartconfig == 'Insert') {
                                //mk_notify('Dashboard has been created successfully');
                                get_dashboard();
                            }
                            else {
                                //mk_notify('Dashboard has been updated successfully');
                                //get_dashboard_config_data(dashboard_id);
                                get_vertical_dashboard('report');
                            }
                        }
                    }
                    else {
                        mk_notify(message);
                    }
                }
                catch (e) {
                    alert(e + '_create_update_userdashboard_inner()');
                }
                loading_hide();
            }, onfail_request);
            getdata.callOtherDomain();
        }
    }
    catch (e) {
        alert(e + '_create_update_userdashboard()')
    }
}

// Compared date when create ui (draw chart UI)
var res_change_date = '2024/04/25 18:24:00';   // Responsive change date
compaired_dttm_for_convert_width_left = (chart_width, chart_left) => {
    let compaired_date;
    let created_dttm = $('#dashboard_page_tab').find('li:first-child .tab-link').attr('created_dttm');
    let updated_dttm = $('#dashboard_page_tab').find('li:first-child .tab-link').attr('updated_dttm');
    if ((created_dttm == '' || created_dttm == null || created_dttm == undefined) && (updated_dttm == '' || updated_dttm == null || updated_dttm == undefined)) {
        compaired_date = new Date();
        compaired_date = convert_fix_format_date_on_submit(compaired_date, 'datetime');
    }
    else if (updated_dttm == '' || updated_dttm == null || updated_dttm == undefined) {
        compaired_date = created_dttm;
    }
    else {
        compaired_date = updated_dttm;
    }

    if (compaired_date > res_change_date) {
        chart_width = chart_width + '%';
        chart_left = chart_left + '%';
    }
    else {
        chart_width = chart_width + 'px';
        chart_left = chart_left + 'px';
    }

    let str = 'width:' + chart_width + ';left:' + chart_left + ';';
    return str;
}

onmouseover_show_options = (elem) => {
    let dashboard_user_id = $('#ddl_dashboard_list option:selected').attr('user_id');
    if (dashboard_user_id == '' || dashboard_user_id == null || dashboard_user_id == undefined) {
        $(elem).find('.chart_toolbar').attr('style', 'display:none !important');
        $(elem).find('.delete_chart').attr('style', 'display:none !important');
        $(elem).find('.cls_filter_chart').attr('style', 'display:none !important');
    }
    else {
        $(elem).find('.chart_toolbar').attr('style', 'display:inline-block !important');
        $(elem).find('.delete_chart').attr('style', 'display:inline-block !important');
        $(elem).find('.cls_filter_chart').attr('style', 'display:inline-block !important');
    }
    $(elem).find('.cls_chart_view').attr('style', 'display:inline-block !important');
    $(elem).find('.cls_tbl_view').attr('style', 'display:inline-block !important');

    let hdn_card_json = $(elem).find('input[type="hidden"]').val();
    if (hdn_card_json == '' || hdn_card_json == null || hdn_card_json == undefined) { }
    else {
        hdn_card_json = JSON.parse(decodeURIComponent(hdn_card_json));
        let chart_type = hdn_card_json.type;
        if (chart_type == 'pivot') {
            $(elem).find('.cls_tochange_view').unbind('click');
            $(elem).find('.cls_tochange_view').css('cursor', 'not-allowed');
        }
    }

    if ($(elem).find('.cls_no_data_found').css('display') == 'block') {
        $(elem).find('.cls_chart_view').attr('style', 'display:none !important');
        $(elem).find('.cls_tbl_view').attr('style', 'display:none !important');
    }
}

onmouseout_hide_options = (elem) => {
    $(elem).find('.chart_toolbar').attr('style', 'display:none');
    $(elem).find('.delete_chart').attr('style', 'display:none');
    $(elem).find('.cls_chart_view').attr('style', 'display:none');
    $(elem).find('.cls_tbl_view').attr('style', 'display:none');
    $(elem).find('.cls_filter_chart').attr('style', 'display:none');
}

get_date_as_per_condition = (time_condition) => {

    var today_dt_obj = new Date();
    var mode = "date";
    var today_dt = convert_datetime_by_format(today_dt_obj, mode);

    if (time_condition == 'select') { }
    else if (time_condition == 'anytime') { }
    else if (time_condition == 'today') {
        // current date
        var value = convert_fix_format_date_on_submit(today_dt, mode);
    }
    else if (time_condition == 'yesterday') {
        // current date to previous day
        var yesterday_dt = today_dt_obj.setDate(today_dt_obj.getDate() - 1);
        yesterday_dt = new Date(yesterday_dt);
        var new_yesterday_dt = convert_datetime_by_format(yesterday_dt, mode);

        var value = convert_fix_format_date_on_submit(new_yesterday_dt, mode);
    }
    else if (time_condition == 'this_week') {
        // current week
        var curr = new Date;
        var firstday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 1));
        var lastday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 7));

        var value1 = convert_fix_format_date_on_submit(firstday, mode);
        var value2 = convert_fix_format_date_on_submit(lastday, mode);
    }
    else if (time_condition == 'last_week') {
        // last week
        var d = new Date();
        var to = d.setTime(d.getTime() - (d.getDay() ? d.getDay() : 7) * 24 * 60 * 60 * 1000);
        var from = d.setTime(d.getTime() - 6 * 24 * 60 * 60 * 1000);

        var lastday = new Date(to);
        var firstday = new Date(from);

        var value1 = convert_fix_format_date_on_submit(firstday, mode);
        var value2 = convert_fix_format_date_on_submit(lastday, mode);
    }
    else if (time_condition == 'last_7_days') {
        // current date to week
        var value2 = convert_fix_format_date_on_submit(today_dt, mode);

        var firstday = today_dt_obj.setDate(today_dt_obj.getDate() - 7);
        firstday = new Date(firstday);
        var new_firstday = convert_datetime_by_format(firstday, mode);

        var value1 = convert_fix_format_date_on_submit(new_firstday, mode);
    }
    else if (time_condition == 'last_to_last_7_days') {
        // current date to previous 7 days to  last previous 7 days
        var today = convert_fix_format_date_on_submit(today_dt, mode);

        var last_7_days = today_dt_obj.setDate(today_dt_obj.getDate() - 7);
        last_7_days = new Date(last_7_days);
        var new_firstday = convert_datetime_by_format(last_7_days, mode);

        var value2 = convert_fix_format_date_on_submit(new_firstday, mode);

        var last_to_last_7_days = last_7_days.setDate(last_7_days.getDate() - 7);
        last_to_last_7_days = new Date(last_to_last_7_days);
        var new_lastday = convert_datetime_by_format(last_to_last_7_days, mode);

        var value1 = convert_fix_format_date_on_submit(new_lastday, mode);
    }
    else if (time_condition == 'this_month') {
        // current month
        var firstday = new Date(today_dt_obj.getFullYear(), today_dt_obj.getMonth(), 1);
        firstday = convert_datetime_by_format(firstday, mode);
        var lastday = new Date(today_dt_obj.getFullYear(), today_dt_obj.getMonth() + 1, 0);
        lastday = convert_datetime_by_format(lastday, mode);

        var value1 = convert_fix_format_date_on_submit(firstday, mode);
        var value2 = convert_fix_format_date_on_submit(lastday, mode);
    }
    else if (time_condition == 'last_month') {
        // previous month
        var firstday = new Date(today_dt_obj.getFullYear(), today_dt_obj.getMonth() - 1, 1);
        firstday = convert_datetime_by_format(firstday, mode);
        var lastday = new Date(today_dt_obj.getFullYear(), today_dt_obj.getMonth(), 0);
        lastday = convert_datetime_by_format(lastday, mode);

        var value1 = convert_fix_format_date_on_submit(firstday, mode);
        var value2 = convert_fix_format_date_on_submit(lastday, mode);
    }
    else if (time_condition == 'last_30_days') {
        // current date to previous 30 days
        var value2 = convert_fix_format_date_on_submit(today_dt, mode);

        var firstday = today_dt_obj.setDate(today_dt_obj.getDate() - 30);
        firstday = new Date(firstday);
        var new_firstday = convert_datetime_by_format(firstday, mode);

        var value1 = convert_fix_format_date_on_submit(new_firstday, mode);
    }
    else if (time_condition == 'last_to_last_30_days') {
        // current date to previous 30 days to  last previous 30 days
        var today = convert_fix_format_date_on_submit(today_dt, mode);

        var last_30_day = today_dt_obj.setDate(today_dt_obj.getDate() - 31);
        last_30_day = new Date(last_30_day);
        var new_firstday = convert_datetime_by_format(last_30_day, mode);

        var value2 = convert_fix_format_date_on_submit(new_firstday, mode);

        var last_to_last_30_days = last_30_day.setDate(last_30_day.getDate() - 29);
        last_to_last_30_days = new Date(last_to_last_30_days);
        var new_lastday = convert_datetime_by_format(last_to_last_30_days, mode);

        var value1 = convert_fix_format_date_on_submit(new_lastday, mode);
    }
    else if (time_condition == 'this_quarter') {
        // current quarter
        var quarter = Math.floor((today_dt_obj.getMonth() / 3));
        var firstday_obj = new Date(today_dt_obj.getFullYear(), quarter * 3, 1);
        var firstday = convert_datetime_by_format(firstday_obj, mode);
        var lastday = new Date(firstday_obj.getFullYear(), firstday_obj.getMonth() + 3, 0);
        lastday = convert_datetime_by_format(lastday, mode);

        var value1 = convert_fix_format_date_on_submit(firstday, mode);
        var value2 = convert_fix_format_date_on_submit(lastday, mode);
    }
    else if (time_condition == 'last_quarter') {
        // previous quarter
        var quarter = Math.floor((today_dt_obj.getMonth() / 3));
        quarter = quarter - 1;
        var firstday_obj = new Date(today_dt_obj.getFullYear(), quarter * 3, 1);
        var firstday = convert_datetime_by_format(firstday_obj, mode);
        var lastday = new Date(firstday_obj.getFullYear(), firstday_obj.getMonth() + 3, 0);
        lastday = convert_datetime_by_format(lastday, mode);

        var value1 = convert_fix_format_date_on_submit(firstday, mode);
        var value2 = convert_fix_format_date_on_submit(lastday, mode);
    }
    else if (time_condition == 'last_90_days') {
        // current date to previous quarter(90days)
        var value2 = convert_fix_format_date_on_submit(today_dt, mode);

        var firstday = today_dt_obj.setDate(today_dt_obj.getDate() - 90);
        firstday = new Date(firstday);
        var new_firstday = convert_datetime_by_format(firstday, mode);

        var value1 = convert_fix_format_date_on_submit(new_firstday, mode);
    }
    else if (time_condition == 'last_to_last_90_days') {
        // current date to previous quarter(90days) to  last previous quarter(90days)
        var today = convert_fix_format_date_on_submit(today_dt, mode);

        var last_90_day = today_dt_obj.setDate(today_dt_obj.getDate() - 90);
        last_90_day = new Date(last_90_day);
        var new_firstday = convert_datetime_by_format(last_90_day, mode);

        var value2 = convert_fix_format_date_on_submit(new_firstday, mode);

        var last_to_last_90_days = last_90_day.setDate(last_90_day.getDate() - 90);
        last_to_last_90_days = new Date(last_to_last_90_days);
        var new_lastday = convert_datetime_by_format(last_to_last_90_days, mode);

        var value1 = convert_fix_format_date_on_submit(new_lastday, mode);

    }
    else if (time_condition == 'this_year') {
        // current year
        var firstday = new Date(today_dt_obj.getFullYear(), 0, 1, 0, 0, 0);
        firstday = convert_datetime_by_format(firstday, mode);
        var lastday = new Date(today_dt_obj.getFullYear(), 11, 31, 0, 0, 0);
        lastday = convert_datetime_by_format(lastday, mode);

        var value1 = convert_fix_format_date_on_submit(firstday, mode);
        var value2 = convert_fix_format_date_on_submit(lastday, mode);
    }
    else if (time_condition == 'last_year') {
        // previous year
        var firstday = new Date(today_dt_obj.getFullYear() - 1, 0, 1, 0, 0, 0);
        firstday = convert_datetime_by_format(firstday, mode);
        var lastday = new Date(today_dt_obj.getFullYear() - 1, 11, 31, 0, 0, 0);
        lastday = convert_datetime_by_format(lastday, mode);

        var value1 = convert_fix_format_date_on_submit(firstday, mode);
        var value2 = convert_fix_format_date_on_submit(lastday, mode);
    }
    else if (time_condition == 'last_365_days') {
        // current date to previous 365 days
        var firstday = today_dt_obj.setFullYear(today_dt_obj.getFullYear() - 1);
        firstday = new Date(firstday);
        var new_firstday = convert_datetime_by_format(firstday, mode);

        var value1 = convert_fix_format_date_on_submit(new_firstday, mode);
        var value2 = convert_fix_format_date_on_submit(today_dt, mode);
    }
    else if (time_condition == 'is_between') {
        var firstday = $('#start_date').val();
        firstday = convert_datetime_by_format(firstday, mode);
        var lastday = $('#end_date').val();
        lastday = convert_datetime_by_format(lastday, mode);

        var value1 = convert_fix_format_date_on_submit(firstday, mode);
        var value2 = convert_fix_format_date_on_submit(lastday, mode);
    }
    else if (time_condition == 'is_before_today') {
        // current date to previous days(infinate)
        var value1 = '1920/01/01';
        var value2 = convert_fix_format_date_on_submit(today_dt, mode);
    }
    else if (time_condition == 'is_after_today') {
        // current date to next days(infinate)
        var value1 = convert_fix_format_date_on_submit(today_dt, mode);
        var value2 = '3020/01/01';
    }

    if (time_condition == 'today' || time_condition == 'yesterday') {
        var value1 = value + " 00:00";
        var value2 = value + " 23:59";
    }
    else {
        value1 = value1 + " 00:00";
        value2 = value2 + " 23:59";
    }

    let date_val = [];
    date_val.push(value1);
    date_val.push(value2);
    return date_val;
}

get_date_for_redirection = (group_date, aggregate_col) => {
    group_date = group_date.toLowerCase();
    if (aggregate_col.indexOf('Q') > -1 && group_date == 'quarter') {
        let aggregate_date = aggregate_col.split('-');
        let year = aggregate_date[0];
        if (aggregate_date[1] == 'Q1') {
            aggregate_col = year + '/01/01';
        }
        else if (aggregate_date[1] == 'Q2') {
            aggregate_col = year + '/04/01';
        }
        else if (aggregate_date[1] == 'Q3') {
            aggregate_col = year + '/07/01';
        }
        else {
            aggregate_col = year + '/10/01';
        }
    }
    else if (aggregate_col.indexOf('W') > -1 && group_date == 'week') {
        let aggregate_date = aggregate_col.split('-');
        let year = aggregate_date[0];
        let week = aggregate_date[1].split('W');
        let week_num = parseInt(week[1]);

        let day_num = 1 + (week_num - 1) * 7;
        aggregate_col = new Date(year, 0, day_num);
    }

    var today_dt_obj = new Date(aggregate_col);
    var mode = 'date';
    var today_dt = convert_datetime_by_format(today_dt_obj, mode);

    var value = '', value1 = '', value2 = '', col_h = [];
    if (group_date == 'day') {
        value = convert_fix_format_date_on_submit(today_dt, mode);
    }
    else if (group_date == 'week') {
        var curr = today_dt_obj;
        var firstday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 1));
        var lastday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 7));

        var value1 = convert_fix_format_date_on_submit(firstday, mode);
        var value2 = convert_fix_format_date_on_submit(lastday, mode);
    }
    else if (group_date == 'month') {
        var firstday = new Date(today_dt_obj.getFullYear(), today_dt_obj.getMonth(), 1);
        firstday = convert_datetime_by_format(firstday, mode);
        var lastday = new Date(today_dt_obj.getFullYear(), today_dt_obj.getMonth() + 1, 0);
        lastday = convert_datetime_by_format(lastday, mode);

        var value1 = convert_fix_format_date_on_submit(firstday, mode);
        var value2 = convert_fix_format_date_on_submit(lastday, mode);
    }
    else if (group_date == 'quarter') {
        var quarter = Math.floor((today_dt_obj.getMonth() / 3));
        var firstday_obj = new Date(today_dt_obj.getFullYear(), quarter * 3, 1);
        var firstday = convert_datetime_by_format(firstday_obj, mode);
        var lastday = new Date(firstday_obj.getFullYear(), firstday_obj.getMonth() + 3, 0);
        lastday = convert_datetime_by_format(lastday, mode);

        var value1 = convert_fix_format_date_on_submit(firstday, mode);
        var value2 = convert_fix_format_date_on_submit(lastday, mode);
    }
    else if (group_date == 'year') {
        var firstday = new Date(today_dt_obj.getFullYear(), 0, 1, 0, 0, 0);
        firstday = convert_datetime_by_format(firstday, mode);
        var lastday = new Date(today_dt_obj.getFullYear(), 11, 31, 0, 0, 0);
        lastday = convert_datetime_by_format(lastday, mode);

        var value1 = convert_fix_format_date_on_submit(firstday, mode);
        var value2 = convert_fix_format_date_on_submit(lastday, mode);
    }

    if (group_date == 'day') {
        value1 = value + " 00:00";
        value2 = value + " 23:59";
    }
    else {
        value1 = value1 + " 00:00";
        value2 = value2 + " 23:59";
    }
    col_h.push(value1);
    col_h.push(value2);

    return col_h;
}

check_tabid_duplication = (tab_id, all_tab_json, index, menu_title, role_name) => {
    var tab_id_count = 0;
    for (let t = 0; t < index; t++) {
        let tabid = all_tab_json[t].tab_id;
        if (tab_id == tabid) {
            tab_id_count++;
        }
    }

    if (tab_id_count < 1) { }
    else {
        tab_id = '';
        let user_id = $('#dashboard_page_tab li').find('.active').attr('user_id');
        if (user_id == '' || user_id == null || user_id == undefined) {
            alert('Duplicate tab id found for "' + menu_title + '" card.  Please go to flow navigation and redrag source from udf  listing for "' + role_name + '" role.');
        }
        else {
            alert('Duplicate tab id found for "' + menu_title + '" card.  Reselect source from udf listing for "' + role_name + '" role.');
        }
    }
    return tab_id;
}

ifAnyNonZero = (array) => {
    var chk_val = 0;
    for (var i = 0; i < array.length; ++i) {
        if (array[i] > 0) {
            chk_val++;
        }
    }
    // check only only count grater than zero
    if (chk_val > 1) {
        return false;
    }
    else {
        return true;
    };
}

getRandomColor = (n) => {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    var colors = [];
    for (var j = 0; j < n; j++) {
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        colors.push(color);
        color = '#';
    }
    return colors;
}

// ----------- Counter with trend chart -------

get_prev_trend_count = (flag_dashboard) => {
    try {
        if (trend_dashboard_array.length > 0) {
            let cal_type = trend_dashboard_array[0].calendar_data[0].calendar_type;
            if (cal_type == 'today') {
                trend_dashboard_array[0].calendar_data[0].calendar_type = 'yesterday';
                let cal_val = get_date_as_per_condition('yesterday');
                trend_dashboard_array[0].calendar_data[0]['value'] = cal_val;
            }
            else if (cal_type == 'this_week') {
                trend_dashboard_array[0].calendar_data[0].calendar_type = 'last_week';
                let cal_val = get_date_as_per_condition('last_week');
                trend_dashboard_array[0].calendar_data[0]['value'] = cal_val;
            }
            else if (cal_type == 'this_month') {
                trend_dashboard_array[0].calendar_data[0].calendar_type = 'last_month';
                let cal_val = get_date_as_per_condition('last_month');
                trend_dashboard_array[0].calendar_data[0]['value'] = cal_val;
            }
            else if (cal_type == 'this_quarter') {
                trend_dashboard_array[0].calendar_data[0].calendar_type = 'last_quarter';
                let cal_val = get_date_as_per_condition('last_quarter');
                trend_dashboard_array[0].calendar_data[0]['value'] = cal_val;
            }
            else if (cal_type == 'this_year') {
                trend_dashboard_array[0].calendar_data[0].calendar_type = 'last_year';
                let cal_val = get_date_as_per_condition('last_year');
                trend_dashboard_array[0].calendar_data[0]['value'] = cal_val;
            }
            else if (cal_type == 'last_30_days') {
                trend_dashboard_array[0].calendar_data[0].calendar_type = 'last_to_last_30_days';
                let cal_val = get_date_as_per_condition('last_to_last_30_days');
                trend_dashboard_array[0].calendar_data[0]['value'] = cal_val;
            }
            else if (cal_type == 'last_7_days') {
                trend_dashboard_array[0].calendar_data[0].calendar_type = 'last_to_last_7_days';
                let cal_val = get_date_as_per_condition('last_to_last_7_days');
                trend_dashboard_array[0].calendar_data[0]['value'] = cal_val;
            }
            else if (cal_type == 'last_90_days') {
                trend_dashboard_array[0].calendar_data[0].calendar_type = 'last_to_last_90_days';
                let cal_val = get_date_as_per_condition('last_to_last_90_days');
                trend_dashboard_array[0].calendar_data[0]['value'] = cal_val;
            }

            var Param_obj = [];
            Param_obj.push(trend_dashboard_array[0]);

            //loading('Loading Dashboard');
            var getdata = new Webservicecall_REST(global_wcf_url + 'Dashboard_count_new', JSON.stringify(Param_obj), function (e) {
                var All_data = e.responseText;
                All_data = JSON.parse(All_data);
                var status = All_data[0].status;
                var message = All_data[0].message;
                if (status == 1) {
                    var data = All_data[0]["data"];
                    if (data == '' || data == null || data == undefined) { }
                    else {
                        if (data instanceof Object) { }
                        else {
                            data = JSON.parse(data);
                        }

                        set_trend_count(data, trend_dashboard_array);

                    }
                    trend_dashboard_array.shift();
                    get_prev_trend_count(flag_dashboard);

                    if (trend_dashboard_array.length == 0) {
                        loading_hide();
                    }
                }
                else if (status == 3) {
                    mk_notify(message);
                    loading_hide();
                    trend_dashboard_array.shift();
                    get_chart_counter(JSON.stringify(trend_dashboard_array), '', '', flag_dashboard);
                }
                else {
                    mk_notify(message);
                    loading_hide();
                }
            }, onfail_request);
            getdata.callOtherDomain();
        }
    }
    catch (e) {
        alert(e + '_get_prev_trend_count');
    }
}

set_trend_count = (data, trend_dashboard_array) => {
    if (trend_dashboard_array.length > 0) {
        let dashboard_counter = trend_dashboard_array[0].counter;
        let this_count = $('#task_count_' + dashboard_counter).html();
        this_count = parseInt(this_count);
        let last_count = data[0].cont_[0];

        if (last_count == 0) {
            var trend_count = 100;
        }
        else {
            var trend_count = ((this_count - last_count) / last_count) * 100;
        }

        var tooltip_count = this_count - last_count;
        if (tooltip_count > 0) {
            tooltip_count = '+' + tooltip_count;
        }

        trend_count = trend_count.toFixed(1);
        $('#menucardid_' + dashboard_counter).find('.trend_count').attr('title', '' + tooltip_count + ' (Previous Count = ' + last_count + ')');
        if (trend_count > 0 || trend_count == 0.0) {
            $('#menucardid_' + dashboard_counter).find('.trend_count').attr('style', 'color: rgb(56 142 60);');
            $('#menucardid_' + dashboard_counter).find('.trend_count').html('<i class="fa fa-arrow-up" aria-hidden="true"></i>' + trend_count + '%');
        }
        else {
            $('#menucardid_' + dashboard_counter).find('.trend_count').attr('style', 'color:rgb(244, 67, 54);');
            $('#menucardid_' + dashboard_counter).find('.trend_count').html('<i class="fa fa-arrow-down" aria-hidden="true"></i>' + trend_count + '%');
        }
        $('#hdn_menucardid_' + dashboard_counter).attr('calendar_count', encodeURIComponent(JSON.stringify(data)));
    }
}

// ----------- Counter with trend chart end -------

// ----------- Counter with line chart -------

get_chart_counter_for_linechart = (dashboard_menu_array, dashboard_id, card_view, flag_dashboard) => {

    let chart_type = dashboard_menu_array[0].type;
    let calendar_data = dashboard_menu_array[0].calendar_data;

    if (chart_type != 'line' || (calendar_data == '' || calendar_data == null || calendar_data == undefined)) { }
    else {
        let checksheetID = calendar_data[0].checksheetID;
        let checksheet_type = calendar_data[0].checksheet_type;
        let ctrl_type = calendar_data[0].ctrl_type;

        let calendar_type = calendar_data[0].calendar_type;
        if (calendar_type == 'is_between') {
            var cal_val = calendar_data[0].value;
        }
        else {
            var cal_val = get_date_as_per_condition(calendar_type);
        }

        let group_date_type = calendar_data[0].group_date_type;

        let header = calendar_data[0].columnName;
        let qid = calendar_data[0].qid;
        let step = calendar_data[0].step;

        let cal_obj = [];
        cal_obj.push({
            'aggregate_fun': 'group_by',
            'checksheetID': checksheetID,
            'checksheet_type': checksheet_type,
            'ctrl_type': ctrl_type,
            'group_date_type': group_date_type,
            'header': header,
            'qid': qid,
            'step': step,
            'system_var': ''
        });

        let def_fltr_obj = [];
        def_fltr_obj.push({
            'Equation': 'BETWEEN',
            'calendar_type': calendar_type,
            'checksheetID': checksheetID,
            'checksheet_type': checksheet_type,
            'columnName': header,
            'ctrl_type': ctrl_type,
            'id': '',
            'qid': qid,
            'queId': qid,
            'step': step,
            'system_var': '',
            'value': cal_val,
        });

        dashboard_menu_array[0].columndata.push(cal_obj[0]);
        dashboard_menu_array[0].default_filter.push(def_fltr_obj[0]);

        var Param_obj = [];
        Param_obj.push(dashboard_menu_array[0]);

        //loading('Loading Dashboard');
        var getdata = new Webservicecall_REST(global_wcf_url + 'Dashboard_count_new', JSON.stringify(Param_obj), function (e) {
            var All_data = e.responseText;
            All_data = JSON.parse(All_data);
            var status = All_data[0].status;
            var message = All_data[0].message;
            if (status == 1) {
                var data = All_data[0]["data"];
                if (data == '' || data == null || data == undefined) { }
                else {
                    if (data instanceof Object) { }
                    else {
                        data = JSON.parse(data);
                    }

                    render_dashboard(data, JSON.stringify(dashboard_menu_array), flag_dashboard);
                    render_table(data, JSON.stringify(dashboard_menu_array[0]));

                    let resizable_counter = dashboard_menu_array[0].counter;
                    if (card_view == '' || card_view == null || card_view == undefined) {
                        let check_view = $('#toggle_chart_tbl').find('.view_type_active').attr('view_type');
                        if (check_view == 'chart_view') {
                            $('#menucardid_' + resizable_counter).find('.apexcharts-canvas').show();
                            $('#menucardid_' + resizable_counter).find('.tbl_container').hide();
                            $('#menucardid_' + resizable_counter).find('.cls_card_filter_items').show();
                            $('#menucardid_' + resizable_counter).find('.cls_card_aggregate_fun').show();
                        }
                        else {
                            $('#menucardid_' + resizable_counter).find('.apexcharts-canvas').hide();
                            $('#dashboard_page_Content .active').find('.tbl_container').each(function () {
                                if ($(this).html() == '') {
                                    $(this).hide();
                                }
                                else {
                                    $(this).show();
                                }
                            });
                            $('#menucardid_' + resizable_counter).find('.cls_card_filter_items').hide();
                        }
                    }
                    else {
                        if (card_view == 'table_view') {
                            if ($('#menucardid_' + resizable_counter).find('.tbl_container').html() == '') {
                                $('#menucardid_' + resizable_counter).find('.tbl_container').hide();
                            }
                            else {
                                $('#menucardid_' + resizable_counter).find('.tbl_container').show();
                            }

                            $('#menucardid_' + resizable_counter).find('.apexcharts-canvas').hide();
                            $('#menucardid_' + resizable_counter).find('.cls_card_filter_items').hide();
                            $('#menucardid_' + resizable_counter).find('.cls_card_aggregate_fun').hide();
                        }
                        else {
                            $('#menucardid_' + resizable_counter).find('.tbl_container').hide();
                            $('#menucardid_' + resizable_counter).find('.apexcharts-canvas').show();
                            $('#menucardid_' + resizable_counter).find('.cls_card_filter_items').show();
                            $('#menucardid_' + resizable_counter).find('.cls_card_aggregate_fun').show();
                        }
                    }
                }
                dashboard_menu_array.shift();
                get_chart_counter(JSON.stringify(dashboard_menu_array), '', '', flag_dashboard);
            }
            else if (status == 3) {
                mk_notify(message);
                loading_hide();
                dashboard_menu_array.shift();
                get_chart_counter(JSON.stringify(dashboard_menu_array), '', '', flag_dashboard);
            }
            else {
                mk_notify(message);
                loading_hide();
            }
        }, onfail_request);
        getdata.callOtherDomain();
    }
}

// -------------- Counter with line chart end ------------


// --------------------------- Pivot chart --------------

onPivotTableRefresh = (pivotConfig, chart_id) => {
    let card_json = $(chart_id).find('input[type="hidden"]').val();
    if (card_json == '' || card_json == null || card_json == undefined) { }
    else {
        card_json = JSON.parse(decodeURIComponent(card_json));
        var columndata = card_json.columndata;
    }

    for (let r = 0; r < pivotConfig.rows.length; r++) {
        for (let c = 0; c < columndata.length; c++) {
            if (pivotConfig.rows[r] == 'Indice') {
                let aggregate_data = columndata[c].aggregate_fun;
                if (aggregate_data == 'group_by') { }
                else {
                    if ('pivotCol' in columndata[c]) {
                        columndata[c].pivotCol = false;
                    }
                    columndata[c].pivotRow = true;
                    columndata[c].pvt_index = r;
                }
            }
            else {
                if (pivotConfig.rows[r] == columndata[c].header) {
                    if ('pivotCol' in columndata[c]) {
                        columndata[c].pivotCol = false;
                    }
                    columndata[c].pivotRow = true;
                    columndata[c].pvt_index = r;
                }
            }
        }
    }

    for (let r = 0; r < pivotConfig.cols.length; r++) {

        for (let c = 0; c < columndata.length; c++) {
            if (pivotConfig.cols[r] == 'Indice') {
                let aggregate_data = columndata[c].aggregate_fun;
                if (aggregate_data == 'group_by') { }
                else {
                    if ('pivotRow' in columndata[c]) {
                        columndata[c].pivotRow = false;
                    }
                    columndata[c].pivotCol = true;
                    columndata[c].pvt_index = r;
                }
            }
            else {
                if (pivotConfig.cols[r] == columndata[c].header) {
                    if ('pivotRow' in columndata[c]) {
                        columndata[c].pivotRow = false;
                    }
                    columndata[c].pivotCol = true;
                    columndata[c].pvt_index = r;
                }
            }
        }
    }

    if (columndata == '' || columndata == null || columndata == undefined) { }
    else {
        for (let c = 0; c < columndata.length; c++) {
            let col_header = columndata[c].header;
            let aggregate_fun = columndata[c].aggregate_fun;
            if (aggregate_fun == 'group_by') {
                if (pivotConfig.cols.indexOf(col_header) == -1 && pivotConfig.rows.indexOf(col_header) == -1) {
                    columndata[c].pivotRow = undefined;
                    columndata[c].pivotCol = undefined;
                }
            }
            else {
                if (pivotConfig.cols.indexOf('Indice') == -1 && pivotConfig.rows.indexOf('Indice') == -1) {
                    columndata[c].pivotRow = undefined;
                    columndata[c].pivotCol = undefined;
                }
            }
        }
        card_json.columndata = columndata;
    }

    $(chart_id).find('input[type="hidden"]').val(encodeURIComponent(JSON.stringify(card_json)));

    $(chart_id).find('input[type="hidden"]').attr('pivotrows', JSON.stringify(pivotConfig.rows));
    $(chart_id).find('input[type="hidden"]').attr('pivotcols', JSON.stringify(pivotConfig.cols));

    if (chart_id == '#menucardid__') {
        $('#container_pvttbl_row span').each(function () {
            let pvt_col_name = $(this).text().trim();
            let pvt_col = $(this).attr('columndata');
            pvt_col = JSON.parse(decodeURIComponent(pvt_col));

            for (let c = 0; c < columndata.length; c++) {
                let div_col_header = columndata[c].custom_header;
                if (div_col_header == '' || div_col_header == null || div_col_header == undefined) {
                    div_col_header = columndata[c].header;
                }
                if (div_col_header == pvt_col_name) {
                    $(this).attr('columndata', encodeURIComponent(JSON.stringify(columndata[c])));
                }
            }
        });
    }
    // commented for stop updating dashboard on pivot render by outside 07012025 PG
    //else {
    //    //$(chart_id).remove();
    //    let chart_index = chart_id.split('_');
    //    chart_index = chart_index[2];

    //    let user_id = $('#dashboard_page_tab').find('li .active').attr('user_id');
    //    if (user_id == '' || user_id == null || user_id == undefined) { }
    //    else {
    //        let page_name = $('#dashboard_page_tab li').find('.active span').html();
    //        create_update_userdashboard(page_name, 'notrefresh_chart');
    //    }
    //}


    // Concat string TZS - mk - 17102024
    if (columndata == '' || columndata == null || columndata == undefined) { }
    else {
        let company_id = localStorage.getItem('company_id');
        for (let c = 0; c < columndata.length; c++) {
            let col_header = columndata[c].header;
            let aggregate_fun = columndata[c].aggregate_fun;
            let ctrl_type = columndata[c].ctrl_type;
            if (aggregate_fun == 'sum') {

                let is_update = 0;

                var percentage = columndata[c].percentage;
                var txt_prefix = columndata[c].prefix;
                if (txt_prefix == '' || txt_prefix == null || txt_prefix == undefined) {
                    //if (company_id == '1838') {
                    //    txt_prefix = 'TZS';
                    //    percentage = "true";
                    //}
                    //else {
                    //    txt_prefix = '';
                    //}

                    txt_prefix = '';
                }
                else {
                    is_update = 1;
                }

                if (percentage == "true") {
                    is_update = 1;
                }

                if (is_update == 1) {
                    $(chart_id).find('.pvtTable tbody tr').each(function (rowIndex) {
                        $(this).find("td.pvtVal,td.pvtTotal").each(function (colIndex) {
                            let cellValue = $(this).text();

                            //console.log(`Row: ${rowIndex}, Column: ${colIndex}, Value: ${cellValue}`);

                            // let cellValue = $(this).html();
                            if (cellValue == "" || cellValue == null || cellValue == undefined || cellValue == "0") { }
                            else {
                                let colTotal = $(chart_id).find('.pvtTable tbody tr:last-child').find("td.colTotal[data-for='col" + colIndex + "']").text();

                                if (colTotal == "" || colTotal == null || colTotal == undefined) {
                                    // in case single column (total column) found in the table
                                    colTotal = $(chart_id).find('.pvtTable tbody tr:last-child').find("td.pvtGrandTotal").text();
                                }

                                let cellValue_t = cellValue.replaceAll(",", "");
                                cellValue_t = parseInt(cellValue_t);
                                let colTotal_t = colTotal.replaceAll(",", "");

                                colTotal_t = parseInt(colTotal_t);

                                if (percentage == "true") {
                                    let per = (cellValue_t / colTotal_t) * 100;
                                    per = per.toFixed(2);
                                    per = "<br><span style='color:red'>(" + per + "%)</span>";

                                    if ($(this).hasClass("colTotal")) {
                                        var new_val = txt_prefix + " " + cellValue + "";
                                    }
                                    else {
                                        var new_val = txt_prefix + " " + cellValue + " " + per + "";
                                    }
                                }
                                else {
                                    var new_val = txt_prefix + " " + cellValue + "";
                                }
                                $(this).html(new_val);
                            }
                        });
                    });
                }

                break;
            }
            else if ((aggregate_fun == 'min' || aggregate_fun == 'max') && ctrl_type == 1) {
                setTimeout(function () {
                    // find any varchar column with aggregation function than remove horizontal & vertical total column 07032025 PG
                    $(chart_id).find('.pvtUi .pvtTotalLabel').attr('style', 'display:none !important');
                    $(chart_id).find('.pvtUi .pvtTotal').attr('style', 'display:none !important');
                    $(chart_id).find('.pvtUi .pvtGrandTotal').attr('style', 'display:none !important');
                }, 200);
            }
        }
    }
}

draw_pivot_without_data = (chart_index, udf_id) => {
    if ('#menucardid_' + chart_index == '#menucardid__') { }
    else {
        menu_arry.push(dashboard_menu_array);
    }

    let card_title = $('#ddl_udf_name option:selected').text();
    let str = '<span class="apexcharts-title-text cls_pivot_span" title="' + card_title + '">' + card_title + '</span>';
    $('#menucardid_' + chart_index).append(str);

    let HiddenAttributes = [], pivot_tbl_data = [];
    stdRendererNames = ["Table", "Table Barchart", "Heatmap", "Row Heatmap", "Col Heatmap"];
    let wrappedRenderers = $.extend($.pivotUtilities.renderers, $.pivotUtilities.plotly_renderers);

    let chart_id = '#menucardid_' + chart_index;
    let pvtOpts = {
        hiddenAttributes: HiddenAttributes,
        renderers: wrappedRenderers,
        vals: ['Value'],
        rows: '',
        cols: '',
        aggregatorName: 'Integer Sum',
        onRefresh: function (config) {
            onPivotTableRefresh(config, chart_id);
        }
    }

    $('#menucardid_' + chart_index + ' .tbl_container').pivotUI(pivot_tbl_data, pvtOpts);
    $('#menucardid_' + chart_index + ' .tbl_container .pvtUi').css('margin-top', '25px');

    $('#menucardid_' + chart_index + ' .tbl_container .pvtUi .pvtUnused li').each(function () {
        let elem_deleted = $(this).find('.pvtAttr').text();
        if (elem_deleted.indexOf('Value') > -1) {
            $(this).css('display', 'none');
        }
    });

    let row_param = 'add_new_pivot_row_column(' + udf_id + ',"' + chart_index + '")';
    let row_btn = "<button type='button' id='btn_add_row' class='btn-primary form-control' onclick='" + row_param + "'>Add Groupby</button>";
    $('#menucardid_' + chart_index + ' .tbl_container .pvtUi .pvtUnused').prepend(row_btn);

    if (chart_index == '_') { }
    else {
        $('#menucardid_' + chart_index).find('.pvtUiCell').css('display', 'none');        // hide config option from dashboard
    }
}

add_pivot_aggregate_column = (chart_mode, column_mode, obj) => {
    $('#ddl_pvttbl_aggrcol').val('Select Aggregation');

    if (column_mode == 'edit') {
        $('#btn_pivot_add_col').html('Update');
    }
    else {
        $('#btn_pivot_add_col').html('Add');
    }

    $('#mdl_add_pvttbl_col').css('display', 'inline-block');

    $('#txt_aggre_prefix').val('');
    $('#txt_edit_hrader').val('');
    $('#ddl_percentage').val('false');

    let hdn_chart_json = $('#hdn_menucardid__').val();
    if (hdn_chart_json == '' || hdn_chart_json == null || hdn_chart_json == undefined) { }
    else {
        hdn_chart_json = JSON.parse(decodeURIComponent(hdn_chart_json));
        //var columndata = hdn_chart_json.columndata;
        var t_id = hdn_chart_json.tab_id;
    }

    $('#ddl_pvttbl_col').empty();
    let ddl_str = '<option value="Select Column">Select Column</option>';
    $('#ddl_pvttbl_col').append(ddl_str);

    let udf_id = $('#ddl_udf_name option:selected').attr('udf_id');
    if (udf_id == '' || udf_id == null || udf_id == undefined) {
        udf_id = $('#ddl_udf_name').val();
    }
    var tab_json = $('#hdn_' + udf_id).val();
    if (tab_json == '' || tab_json == null || tab_json == undefined) { }
    else {
        tab_json = JSON.parse(decodeURIComponent(tab_json));
        if (tab_json.length == 1) {
            var t_id = tab_json[0].tab_id;
        }

        for (let t = 0; t < tab_json.length; t++) {
            let tab_id = tab_json[t].tab_id;

            if (tab_id == t_id) {
                let col_data = tab_json[t].columndata;
                for (let c = 0; c < col_data.length; c++) {
                    let header = col_data[c].header;

                    let checksheetID = col_data[c].checksheetID;
                    let checksheet_type = col_data[c].checksheet_type;
                    let step = col_data[c].step;
                    let qid = col_data[c].qid;
                    let ctrl_type = col_data[c].ctrl_type;
                    let sys_var = col_data[c].system_var;
                    if (sys_var == '' || sys_var == null || sys_var == undefined) {
                        sys_var = '';
                    }
                    let aggregate_fun = col_data[c].aggregate_fun;
                    if (aggregate_fun == '' || aggregate_fun == null || aggregate_fun == undefined) {
                        aggregate_fun = 'group_by'
                    }
                    let group_date_type = col_data[c].group_date_type;
                    if (group_date_type == '' || group_date_type == null || group_date_type == undefined) {
                        group_date_type = 'month';
                    }

                    var column_data = [];
                    column_data.push({
                        group_date_type: group_date_type,
                        checksheetID: checksheetID,
                        checksheet_type: checksheet_type,
                        step: step,
                        qid: qid,
                        header: header,
                        ctrl_type: ctrl_type,
                        aggregate_fun: aggregate_fun,
                        system_var: sys_var
                    });

                    if (ctrl_type == 4 || ctrl_type == 12 || ctrl_type == 17 || ctrl_type == 1) {
                        let col_name_str = '<option value="' + header + '" columndata="' + encodeURIComponent(JSON.stringify(column_data)) + '">' + header + '</option>';
                        $('#ddl_pvttbl_col').append(col_name_str);
                    }
                }
            }
        }
    }

    if (column_mode == 'edit') {
        var edit_col_data = $(obj).parent().attr('columndata');
        edit_col_data = JSON.parse(decodeURIComponent(edit_col_data));

        let aggregate_fun = edit_col_data.aggregate_fun;
        let header = edit_col_data.header;
        let custom_header = edit_col_data.custom_header;
        let prefix = edit_col_data.prefix;
        let percentage = edit_col_data.percentage;
        if (percentage == '' || percentage == null || percentage == undefined) {
            percentage = 'false';
        }

        $('#ddl_pvttbl_aggrcol').val(aggregate_fun);
        $('#ddl_pvttbl_col').val(header);
        $('#txt_edit_hrader').val(custom_header);
        $('#txt_aggre_prefix').val(prefix);
        $('#ddl_percentage').val(percentage);
    }

    $('#btn_pivot_cancel_col').unbind('click');
    $('#btn_pivot_cancel_col').on('click', function () {
        $('#mdl_add_pvttbl_col').css('display', 'none');
    });

    $('#btn_pivot_add_col').unbind('click');
    $('#btn_pivot_add_col').on('click', function () {
        let chart_type = $('.chart_active .card-footer span').html();
        if (chart_type == 'PIVOT') {
            let col_data = $('#ddl_pvttbl_col option:selected').attr('columndata');
            let opt_val = $('#ddl_pvttbl_col').val();
            let aggregate_fun = $('#ddl_pvttbl_aggrcol').val();
            let txt_prefix = $('#txt_aggre_prefix').val();
            let custom_header = $('#txt_edit_hrader').val();
            let percentage = $('#ddl_percentage').val();

            if (aggregate_fun == 'Select Aggregation') {
                alert('Please select aggregation function');
            }
            else if (opt_val == 'Select Column') {
                alert('Please select column name');
            }
            else {

                var chk_col_flag = 0;
                var col_name_inc = 0;

                //check aggregation function 'count' given to any column 
                var chk_count_flag = 0;
                $('#container_pvttbl_row span').each(function () {

                    chk_count_flag = 0;
                    let span_col_data = $(this).attr('columndata');
                    span_col_data = JSON.parse(decodeURIComponent(span_col_data));
                    let span_aggregate_fun = span_col_data.aggregate_fun;
                    if (span_aggregate_fun == 'count' && aggregate_fun == 'count') {
                        chk_count_flag = 1;
                        return false;
                    }
                });

                $('#container_pvttbl_row span').each(function () {
                    let is_skip = 0;
                    let span_col_data = $(this).attr('columndata');
                    span_col_data = JSON.parse(decodeURIComponent(span_col_data));
                    let span_aggregate_fun = span_col_data.aggregate_fun;
                    let span_col_name = span_col_data.header;

                    if (column_mode == 'edit') {
                        let edit_header = edit_col_data.header;
                        let edit_aggr_fun = edit_col_data.aggregate_fun;

                        if (edit_header == span_col_name && edit_aggr_fun == span_aggregate_fun) {
                            is_skip = 1;
                        }
                    }

                    if (is_skip == 0) {
                        chk_col_flag = 0;

                        if (chk_count_flag == 1) {
                            chk_col_flag = 1;
                            col_name_inc = 0;
                            alert('Already applied "' + aggregate_fun + '" aggregation function for "' + span_col_name + '" column');
                            return false;
                        }
                        else {
                            if ((span_col_name.indexOf(opt_val)) > -1) {
                                if (span_aggregate_fun == aggregate_fun) {
                                    chk_col_flag = 1;
                                    col_name_inc = 0;
                                    alert('Already applied "' + aggregate_fun + '" aggregation function for "' + opt_val + '" column');
                                    return false;
                                }
                                else {
                                    col_name_inc++;
                                }
                            }
                        }
                    }
                });

                if (chk_col_flag == 0) {
                    if (col_name_inc == 0) { }
                    else {
                        opt_val += col_name_inc;
                    }
                    col_data = JSON.parse(decodeURIComponent(col_data));
                    col_data[0].aggregate_fun = aggregate_fun;
                    col_data[0].header = opt_val;
                    col_data[0].percentage = percentage;
                    col_data[0].custom_header = custom_header;
                    if (custom_header == '' || custom_header == null || custom_header == undefined) {
                        custom_header = opt_val
                    }

                    if (aggregate_fun == 'group_by') {
                        var av_tooltip = aggregate_data;
                        var edit_param = "add_new_pivot_row_column(" + udf_id + ",'_', 'edit', this)";
                        var edit_display_style = 'display:none;';
                    }
                    else {
                        let tlp_cust_header = '';
                        if (opt_val != custom_header) {
                            tlp_cust_header = ', Header : ' + opt_val + ', Custom header : ' + custom_header;
                        }
                        var av_tooltip = 'Aggregate function : ' + aggregate_fun + '' + tlp_cust_header;
                        var edit_param = "add_pivot_aggregate_column('Update','edit',this);";
                        var edit_display_style = 'display:inline-block;';
                    }

                    if (txt_prefix == '' || txt_prefix == null || txt_prefix == undefined || aggregate_fun == 'group_by') { }
                    else {
                        col_data[0].prefix = txt_prefix;
                    }
                    let delete_param = "$(this).parent().remove();add_new_chart('update', '_', 'preview');";
                    if (column_mode == 'edit') {
                        $(obj).parent().attr('columndata', encodeURIComponent(JSON.stringify(col_data[0])));
                        $(obj).parent().attr('title', av_tooltip);
                        $(obj).parent().html(custom_header + ' <i class="fa fa-pencil-square-o mr-0 ml-1" style="color:white !important;' + edit_display_style + '" onclick="' + edit_param + '"></i><i class="fa fa-times mr-0 ml-1" onclick="' + delete_param + '"></i>');
                    }
                    else {
                        var str = '<span class="badge badge-dark mr-1" columndata="' + encodeURIComponent(JSON.stringify(col_data[0])) + '" title="' + av_tooltip + '" style="background-color: #343a407d;">' + custom_header + ' <i class="fa fa-pencil-square-o mr-0 ml-1" style="color:white !important;' + edit_display_style + '" onclick="' + edit_param + '"></i><i class="fa fa-times mr-0 ml-1" onclick="' + delete_param + '"></i></span>';
                        $('#container_pvttbl_row').append(str);
                    }

                    $('#ddl_pvttbl_aggrcol').val('Select Aggregation');
                    $('#ddl_pvttbl_col').val('Select Column');

                    add_new_chart(chart_mode, '_', 'preview');
                }

                $('#txt_aggre_prefix').val('');
                $('#txt_edit_hrader').val('');

                if (column_mode == 'edit') {
                    $('#mdl_add_pvttbl_col').css('display', 'none');
                }
            }
        }
    });

    $('#ddl_pvttbl_col').unbind('change');
    $('#ddl_pvttbl_col').on('change', function () {
        $('#txt_edit_hrader').val('');
        let col_header = $(this).val();
        if (col_header == 'Select Column') { }
        else {
            $('#txt_edit_hrader').val(col_header);
        }
    });
}

add_new_pivot_row_column = (udf_id, counter) => {
    $('#menucardid_' + counter + ' .cls_add_pvttbl_row_col').remove();
    let hdn_chart_json = $('#hdn_menucardid_' + counter).val();
    if (hdn_chart_json == '' || hdn_chart_json == null || hdn_chart_json == undefined) { }
    else {
        hdn_chart_json = JSON.parse(decodeURIComponent(hdn_chart_json));
        var columndata = hdn_chart_json.columndata;
        var t_id = hdn_chart_json.tab_id;
    }

    let li_str = '<div class="cls_add_pvttbl_row_col">';
    li_str += '<button type="button" id="btn_pivot_col_add" class="btn-primary form-control">Apply</button>';
    li_str += '<button type="button" id="btn_pivot_col_cancel" class="btn-primary form-control">Cancel</button>';
    li_str += '<ul>';
    let tab_json = $('#hdn_' + udf_id).val();
    if (tab_json == '' || tab_json == null || tab_json == undefined) { }
    else {
        tab_json = JSON.parse(decodeURIComponent(tab_json));
        for (let t = 0; t < tab_json.length; t++) {
            let tab_id = tab_json[t].tab_id;

            if (tab_id == t_id) {
                let col_data = tab_json[t].columndata;
                var query_type = tab_json[t].query_type;
                for (let c = 0; c < col_data.length; c++) {
                    let header = col_data[c].header;
                    let col_flag = 0;
                    for (let cd = 0; cd < columndata.length; cd++) {
                        let col_header = columndata[cd].header;
                        if (col_header == header) {
                            col_flag = 1;
                            break;
                        }
                    }

                    if (col_flag == 0) {
                        let checksheetID = col_data[c].checksheetID;
                        let checksheet_type = col_data[c].checksheet_type;
                        let step = col_data[c].step;
                        let qid = col_data[c].qid;
                        let ctrl_type = col_data[c].ctrl_type;
                        let sys_var = col_data[c].system_var;
                        if (sys_var == '' || sys_var == null || sys_var == undefined) {
                            sys_var = '';
                        }
                        let aggregate_fun = col_data[c].aggregate_fun;
                        if (aggregate_fun == '' || aggregate_fun == null || aggregate_fun == undefined) {
                            aggregate_fun = 'group_by'
                        }
                        let group_date_type = col_data[c].group_date_type;
                        if (group_date_type == '' || group_date_type == null || group_date_type == undefined) {
                            group_date_type = 'month';
                        }

                        var column_data = [];
                        column_data.push({
                            group_date_type: group_date_type,
                            checksheetID: checksheetID,
                            checksheet_type: checksheet_type,
                            step: step,
                            qid: qid,
                            header: header,
                            ctrl_type: ctrl_type,
                            aggregate_fun: aggregate_fun,
                            system_var: sys_var
                        });

                        if (ctrl_type == 2 || ctrl_type == 3 || ctrl_type == 4 || ctrl_type == 8 || ctrl_type == 20 || (ctrl_type == 1 && query_type == 'view') || sys_var == 'Status_Name') {
                            li_str += '<input type="checkbox" columndata="' + encodeURIComponent(JSON.stringify(column_data)) + '" value="' + header + '" class="cls_pvt_chk" />' + header;
                        }

                        if (ctrl_type == 8) {
                            li_str += '<select class="cls_pvt_aggr_col chart_config_elem"><option val="day">Day</option><option val="week">Week</option><option val="month" selected>Month</option><option val="quarter">Quarter</option><option val="year">Year</option></select></br>';
                        }
                        else if (ctrl_type == 2 || ctrl_type == 3 || ctrl_type == 4 || ctrl_type == 20 || (ctrl_type == 1 && query_type == 'view') || sys_var == 'Status_Name') {
                            li_str += '</br>';
                        }
                    }
                }
            }
        }
    }
    li_str += '</ul>';
    li_str += '</div>';

    $('#menucardid_' + counter + ' .tbl_container').append(li_str);
    $('#menucardid_' + counter + ' .cls_add_pvttbl_row_col').show();

    // click on cancel btn for hide div add new column
    $('#btn_pivot_col_cancel').unbind('click');
    $('#btn_pivot_col_cancel').on('click', function () {
        if ($('.cls_add_pvttbl_row_col').css('display') == 'block') {
            $('.cls_add_pvttbl_row_col').hide();
        }
        else {
            $('.cls_add_pvttbl_row_col').show();
        }
    });

    // click on apply btn to add new data for draw pivot
    $('#btn_pivot_col_add').unbind('click');
    $('#btn_pivot_col_add').on('click', function () {
        var dashboard_json = [];
        if ($('.cls_pvt_chk:checked').length == 0) {
            alert('Please select at least 1 column');
        }
        else {
            $('.cls_add_pvttbl_row_col ul .cls_pvt_chk').each(function () {
                let is_checked = $(this).prop('checked');
                if (is_checked == true) {
                    let chk_val = $(this).val();

                    let chk_columndata = $(this).attr('columndata');
                    chk_columndata = JSON.parse(decodeURIComponent(chk_columndata));

                    let ctrl_type = chk_columndata[0].ctrl_type;
                    if (ctrl_type == 8) {
                        let selected_date_type = $(this).next('select').val();
                        chk_columndata[0].group_date_type = selected_date_type;
                    }

                    hdn_chart_json.columndata.push(chk_columndata[0]);

                    if (counter == '_') {
                        let aggregate_data = chk_columndata[0].aggregate_fun;

                        if (aggregate_data == 'group_by') {
                            var av_tooltip = aggregate_data;
                            var edit_param = "add_new_pivot_row_column(" + udf_id + ",'_', 'edit', this)";

                        }
                        else {
                            var av_tooltip = 'Aggregate function : ' + aggregate_data;
                            var edit_param = "add_pivot_aggregate_column('Update','edit',this);";
                        }

                        let delete_param = "$(this).parent().remove();add_new_chart('update', '_', 'preview');";
                        let str = '<span class="badge badge-dark mr-1" columndata="' + encodeURIComponent(JSON.stringify(chk_columndata[0])) + '" title="' + av_tooltip + '">' + chk_val + ' <i class="fa fa-pencil-square-o mr-0 ml-1" style="color:white !important;display:none;" onclick="' + edit_param + '"></i><i class="fa fa-times mr-0 ml-1" onclick="' + delete_param + '"></i></span>';
                        $('#container_pvttbl_row').append(str);
                    }
                }
            });

            if ('counter' in hdn_chart_json) { }
            else {
                hdn_chart_json.counter = counter;
            }
            $('#hdn_menucardid_' + counter).val(encodeURIComponent(JSON.stringify(hdn_chart_json)));
            dashboard_json.push(hdn_chart_json);
            hdn_chart_json = JSON.stringify(dashboard_json);
            $('.cls_add_pvttbl_row_col').hide();
            let dashboard_id = $('#ddl_dashboard_list').val();
            get_chart_counter(hdn_chart_json, dashboard_id, 'table_view');

            if (counter == '_') { }
            else {
                let page_name = $('#dashboard_page_tab li').find('.active span').html();
                create_update_userdashboard(page_name, 'notrefresh_chart');
            }

            for (m = 0; m < menu_arry.length; m++) {
                let menu_chart_count = menu_arry[m].counter;
                if (menu_chart_count == counter) {
                    menu_arry.splice(m, 1);
                    break;
                }
            }
        }
    });

    //checked/unchecked checkbox 
    $('.cls_pvt_chk').unbind('change');
    $('.cls_pvt_chk').on('change', function () {
        let columndata = $(this).attr('columndata');
        columndata = JSON.parse(decodeURIComponent(columndata));
        let ctrl_type = columndata[0].ctrl_type;
        if (ctrl_type == 8) {
            if ($(this).prop('checked') == true) {
                $(this).next('select').attr('style', 'display:inline-block !important');
            }
            else {
                $(this).next('select').attr('style', 'display:none');
            }
        }
    });
}

redirect_tab_using_pivot_table = (pvt_filter_ary, click_menu, selected_chart_counter) => {
    for (var dd = 0; dd < menu_arry.length; dd++) {
        var title = menu_arry[dd].title;
        let chart_counter = menu_arry[dd].counter;
        if (click_menu == title && chart_counter == selected_chart_counter) {
            //var sub_menu = menu_arry[dd].submenu;
            let tab_id = menu_arry[dd].tab_id;
            let web_udf_id = menu_arry[dd].udf_id;

            var col_header_array = [];
            var column_data = menu_arry[dd].columndata;
            if (column_data == '' || column_data == null || column_data == undefined) { }
            else {
                for (let c = 0; c < column_data.length; c++) {
                    var aggregate_function = column_data[c].aggregate_fun;
                    if (aggregate_function == 'group_by') {
                        col_header_array.push({
                            'header': column_data[c].header,
                            'ctrl_type': column_data[c].ctrl_type,
                            'group_date_type': column_data[c].group_date_type
                        });
                    }
                }
            }

            let obj_pvt_filter_keys = [];
            obj_pvt_filter_keys = Object.keys(pvt_filter_ary);

            var url_array = [];
            for (let o = 0; o < obj_pvt_filter_keys.length; o++) {
                let header = obj_pvt_filter_keys[o];
                if (header == 'Indice') { }
                else {
                    for (let p = 0; p < col_header_array.length; p++) {
                        let col_header = col_header_array[p].header;

                        if (header == col_header) {
                            let col_val = pvt_filter_ary[col_header];

                            var tab_header_ary = [];
                            var equation = '';
                            var ctrl_type = col_header_array[p].ctrl_type;

                            if (ctrl_type == 8) {
                                equation = 'BETWEEN';

                                let group_date = col_header_array[p].group_date_type;
                                tab_header_ary = get_date_for_redirection(group_date, col_val);
                            }
                            else {
                                equation = 'IN';
                                tab_header_ary.push(col_val);
                            }

                            url_array.push({
                                [col_header]: tab_header_ary,
                                'Equation': equation
                            });
                        }
                    }
                }
            }

            var udf_json = $('#hdn_' + web_udf_id + '').val();
            udf_json = JSON.parse(decodeURIComponent(udf_json));
            var tab_index = 0;
            if (udf_json.length == 1) {
                // If single tab & give groupby
            }
            else {
                // If multiple tab 
                if (tab_id == '' || tab_id == null || tab_id == undefined) {
                    // All UDF
                }
                else {
                    // Give groupby to single tab of multi tab
                    for (let t = 0; t < udf_json.length; t++) {
                        var t_tab_id = udf_json[t].tab_id;
                        if (t_tab_id == tab_id) {
                            tab_index = t
                        }
                    }
                }
            }

            url_array = JSON.stringify(url_array);
            storage.setItem('av', url_array);

            let chart_click_json = $('li[udf_id="' + web_udf_id + '"]').attr('chart_click_json');
            chart_click_json = decodeURIComponent(chart_click_json);
            if (chart_click_json == '' || chart_click_json == null || chart_click_json == undefined) { }
            else {
                chart_click_json = JSON.parse(chart_click_json);
                let flow_name = chart_click_json[0].flow_name;
                let flow_id = chart_click_json[0].flow_id;
                let type = chart_click_json[0].type;
                let role_id = chart_click_json[0].role_id;

                redirect_on_module_click(flow_name, web_udf_id, flow_id, type, role_id, 'redirect_on_chart', tab_index);
            }
            break;
        }
    }
}

// ----------- Pivot chart end -------


// -------------- Chart Click Redirect ------------------
redirect_on_chart_click = (click_menu, click_bar_str, flag_axis, selected_chart_counter) => {

    for (var dd = 0; dd < menu_arry.length; dd++) {
        var title = menu_arry[dd].title;
        let chart_counter = menu_arry[dd].counter;
        if (click_menu == title && chart_counter == selected_chart_counter) {
            var sub_menu = menu_arry[dd].submenu;
            var tab_id = menu_arry[dd].tab_id;
            var chart_type = menu_arry[dd].chart_type;
            if (chart_type == '' || chart_type == null || chart_type == undefined) {
                chart_type = menu_arry[dd].type;
            }

            let pivot_config = menu_arry[dd].pivot_config;
            if (pivot_config == '' || pivot_config == null || pivot_config == undefined) {
                var pivot_type = 'Table';
            }
            else {
                var pivot_type = pivot_config[0].pivot_type;
            }

            if (flag_axis == 'legend' || flag_axis == 'label') {
                // click on legend & label of stackbar/stackcolumn chart
                var col_header_array = [];
                var column_data = menu_arry[dd].columndata;
                if (column_data == '' || column_data == null || column_data == undefined) { }
                else {
                    for (let c = 0; c < column_data.length; c++) {
                        var aggregate_function = column_data[c].aggregate_fun;
                        if (aggregate_function == 'group_by') {
                            col_header_array.push({
                                'header': column_data[c].header,
                                'ctrl_type': column_data[c].ctrl_type,
                                'group_date_type': column_data[c].group_date_type
                            });
                        }
                    }
                }
            }

            for (let a = 0; a < sub_menu.length; a++) {
                if (flag_axis == 'legend' || flag_axis == 'label') {
                    var GB_obj = sub_menu[a].GB_obj;
                    for (let c = 0; c < col_header_array.length; c++) {
                        if (flag_axis == 'legend') {
                            var tab_header = GB_obj[col_header_array[c].header];
                        }
                        else {
                            var tab_header = GB_obj[col_header_array[0].header];
                        }
                    }
                }
                else {
                    var tab_header = sub_menu[a].menu;
                }

                if (click_bar_str == tab_header) {
                    var url_array = [];
                    var web_url = sub_menu[a].url;
                    var web_udf_id = sub_menu[a].udf_id
                    if (flag_axis == 'legend' || flag_axis == 'label') {
                        var column_data = menu_arry[dd].columndata;
                        if (column_data == '' || column_data == null || column_data == undefined) {
                            var hdn_data = $("#hdn_" + web_udf_id + "").val();
                            hdn_data = decodeURIComponent(hdn_data);
                            Json_hdn_data = JSON.parse(hdn_data);
                            let col_data = Json_hdn_data[0].columndata;
                            for (let c = 0; c < col_data.length; c++) {
                                var aggregate_function = col_data[c].aggregate_fun;
                                if (aggregate_function == 'group_by') {
                                    flag_aggregate_fun = 1;
                                    col_header_array.push(col_data[c].header);
                                }
                            }
                            var tab_header_ary = [];
                            if (flag_axis == 'legend') {
                                tab_header_ary.push(GB_obj.H1);
                                var col_header = col_header_array[1];
                            }
                            else {
                                tab_header_ary.push(GB_obj.H0);
                                var col_header = col_header_array[0];
                            }
                        }
                        else {
                            for (let c = 0; c < col_header_array.length; c++) {
                                if (flag_axis == 'legend') {
                                    var col_header = col_header_array[c].header;
                                }
                                else {
                                    var col_header = col_header_array[0].header;
                                }
                                if (col_header_array[c].header == col_header) {
                                    var tab_header_ary = [];
                                    var equation = '';
                                    var ctrl_type = col_header_array[c].ctrl_type;

                                    if (ctrl_type == 8) {
                                        equation = 'BETWEEN';
                                        aggregate_col = GB_obj[col_header];

                                        let group_date = col_header_array[c].group_date_type;
                                        tab_header_ary = get_date_for_redirection(group_date, aggregate_col);
                                    }
                                    else {
                                        equation = 'IN';
                                        var tab_header = GB_obj[col_header];
                                        tab_header_ary.push(tab_header);
                                    }
                                }
                            }
                        }

                        url_array.push({
                            [col_header]: tab_header_ary,
                            'Equation': equation
                        });

                        // default filter apply for pie/donut/bar/column/stackbar/stackcolumn
                        var def_fltr_array = menu_arry[dd].default_filter;
                        if (def_fltr_array == '' || def_fltr_array == null || def_fltr_array == undefined) { }
                        else {
                            // Also apply default filter on single tab's counter columndata 
                            for (let d = 0; d < def_fltr_array.length; d++) {
                                let def_header = def_fltr_array[d].columnName;

                                let def_fltr_flag = 0;
                                for (u = 0; u < url_array.length; u++) {
                                    if (def_header == Object.keys(url_array[u])[0]) {
                                        if (menu_arry[dd].type != 'line') {
                                            url_array.splice(u, 1);
                                            def_fltr_flag = 0;
                                        }
                                        else {
                                            def_fltr_flag = 1;
                                        }
                                    }
                                }

                                if (def_fltr_flag == 0) {
                                    let def_id_ary = def_fltr_array[d].id
                                    var def_val_ary = def_fltr_array[d].value;
                                    let equation = def_fltr_array[d].Equation;
                                    let ctrl_type = def_fltr_array[d].ctrl_type;
                                    if (ctrl_type == 8) {
                                        equation = 'BETWEEN';
                                    }

                                    var def_val = [];
                                    for (let c = 0; c < def_val_ary.length; c++) {
                                        let def_value = def_val_ary[c];
                                        def_val.push(def_value);
                                    }

                                    url_array.push({
                                        [def_header]: def_val,
                                        'Equation': equation
                                    });
                                }
                            }
                        }

                        var click_bartab_flag = 0;
                    }
                    else {
                        if (chart_type == 'stackbar' || chart_type == 'stackcolumn' || (chart_type == 'pivot' && pivot_type == 'Horizontal Stacked Bar Chart')) {
                            let column_data = menu_arry[dd].columndata;
                            let col_header_array = [], aggregate_count = 0;
                            for (let c = 0; c < column_data.length; c++) {
                                if (column_data[c].aggregate_fun == 'group_by') {
                                    col_header_array.push(column_data[c].header);
                                }
                                else {
                                    aggregate_count++;
                                }
                            }

                            if (aggregate_count > 1) {
                                col_header_array = [];
                                for (let c = 0; c < column_data.length; c++) {
                                    if (column_data[c].aggregate_fun == 'group_by') { }
                                    else {
                                        col_header_array.push(column_data[c].header);
                                    }
                                }
                            }

                            var GB_obj = sub_menu[a].GB_obj;
                            if (chart_type == 'pivot' && pivot_type == 'Horizontal Stacked Bar Chart') {
                                var click_bartab_flag = 1;
                                for (let c = 0; c < col_header_array.length; c++) {
                                    if (aggregate_count > 1) {
                                        var tab_header = col_header_array[c];
                                    }
                                    else {
                                        var tab_header = GB_obj[col_header_array[c]];
                                    }

                                    if (flag_axis == tab_header) {
                                        var web_url = sub_menu[a].url;
                                        var web_udf_id = sub_menu[a].udf_id
                                        click_bartab_flag = 0;
                                    }
                                }
                            }
                            else {
                                for (let c = 1; c < col_header_array.length; c++) {
                                    var tab_header = GB_obj[col_header_array[c]];
                                    var click_bartab_flag = 1;
                                    if (flag_axis == tab_header) {
                                        var web_url = sub_menu[a].url;
                                        var web_udf_id = sub_menu[a].udf_id
                                        click_bartab_flag = 0;
                                    }
                                }
                            }
                        }
                        else {
                            var web_url = sub_menu[a].url;
                            var web_udf_id = sub_menu[a].udf_id
                            click_bartab_flag = 0;
                        }

                        let click_url = web_url;
                        if (click_url == '' || click_url == null || click_url == undefined) { }
                        else {
                            click_url = click_url.split('av=');
                            url_array = click_url[1];
                            if (url_array == '' || url_array == null || url_array == undefined) { }
                            else {
                                url_array = JSON.parse(decodeURIComponent(url_array));
                            }
                        }
                    }

                    if (click_bartab_flag == 0) {
                        var udf_json = $('#hdn_' + web_udf_id + '').val();
                        udf_json = JSON.parse(decodeURIComponent(udf_json));
                        var tab_index = 0;
                        if (udf_json.length == 1) {
                            // If single tab & give groupby
                        }
                        else {
                            // If multiple tab 
                            if (tab_id == '' || tab_id == null || tab_id == undefined) {
                                // All UDF
                                tab_index = a;
                            }
                            else {
                                // Give groupby to single tab of multi tab
                                for (let t = 0; t < udf_json.length; t++) {
                                    var t_tab_id = udf_json[t].tab_id;
                                    if (t_tab_id == tab_id) {
                                        tab_index = t
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
            }

            url_array = JSON.stringify(url_array);
            storage.setItem('av', url_array);

            let chart_click_json = $('li[udf_id="' + web_udf_id + '"]').attr('chart_click_json');
            chart_click_json = decodeURIComponent(chart_click_json);
            if (chart_click_json == '' || chart_click_json == null || chart_click_json == undefined) { }
            else {
                chart_click_json = JSON.parse(chart_click_json);
                let flow_name = chart_click_json[0].flow_name;
                let flow_id = chart_click_json[0].flow_id;
                let type = chart_click_json[0].type;
                let role_id = chart_click_json[0].role_id;

                redirect_on_module_click(flow_name, web_udf_id, flow_id, type, role_id, 'redirect_on_chart', tab_index);
            }
            break;
        }
    }
}


// ------------ Advance filter ----------
open_adv_fltr_popup_for_charts = (t_flag, chart_mode, flag_filter, outer_filter_elem) => {
    try {
        if (t_flag == "btn_click") {
            myApp.popup('.popup-advance-search-online');
        }

        var filtered_items = $(".filtered-items-outer .div-filtered-item span.badge").length;
        $("#tbl_advance_colSearch").empty();

        let udf_id = $('#ddl_udf_name option:selected').attr('udf_id');
        if (udf_id == '' || udf_id == null || udf_id == undefined) {
            udf_id = $('#ddl_udf_name option:selected').val();
        }

        if (flag_filter == 'outer_filter') {
            let filter_udf_id = $(outer_filter_elem).parent().attr('udf_id');
            udf_id = filter_udf_id;
        }

        let deffltr_flag = 0;
        var hdn_tab_json = $('#hdn_' + udf_id).val();
        if (hdn_tab_json == '' || hdn_tab_json == null || hdn_tab_json == undefined) { }
        else {
            hdn_tab_json = JSON.parse(decodeURIComponent(hdn_tab_json));
            if (hdn_tab_json.length == 1) {
                deffltr_flag = 1;
                var col_data = hdn_tab_json[0].columndata;
            }
            else {
                let selected_tab_id = $('#ddl_udf_name').val();
                if (flag_filter == 'outer_filter') {
                    let filter_tab_id = $(outer_filter_elem).attr('filter_tab_id');
                    selected_tab_id = filter_tab_id;
                }
                for (let i = 0; i < hdn_tab_json.length; i++) {
                    var tab_id = hdn_tab_json[i].tab_id;
                    if (selected_tab_id == tab_id) {
                        deffltr_flag = 1;
                        var col_data = hdn_tab_json[i].columndata;
                        break;
                    }
                }
            }

            if (deffltr_flag == 1) {
                var chk_json = JSON.stringify(col_data);
                var str = get_filter_controls_from_template_json(chk_json);
                $("#tbl_advance_colSearch").append(str);
            }

            //display_saved_adv_filter();
        }

        if (flag_filter == 'outer_filter') {
            var filter_orderby_obj = [];
            $(outer_filter_elem).parent().find('.cls_card_filter_items .badge').each(function () {
                var filter_orderby_data = $(this).attr('data');
                if (filter_orderby_data == null || filter_orderby_data == '' || filter_orderby_data == undefined || filter_orderby_data == "undefined") { }
                else {
                    filter_orderby_data = decodeURIComponent(filter_orderby_data);
                    filter_orderby_obj.push(JSON.parse(filter_orderby_data));
                    display_selected_filter_data(filter_orderby_obj);
                }
            });
        }
        else {
            if (filtered_items > 0) {
                var filter_orderby_obj = [];
                check_ary = 1;
                $('.div-filtered-item ').find('.badge').each(function () {
                    var filter_orderby_data = $(this).attr('data');
                    if (filter_orderby_data == null || filter_orderby_data == '' || filter_orderby_data == undefined || filter_orderby_data == "undefined") { }
                    else {
                        filter_orderby_data = decodeURIComponent(filter_orderby_data);
                        filter_orderby_obj.push(JSON.parse(filter_orderby_data));
                        display_selected_filter_data(filter_orderby_obj);
                    }
                });
            }
        }

        $("#btn_apply_fltr").unbind('click');
        $("#btn_apply_fltr").on('click', function () {
            aply_fltr_on_counter_tab(chart_mode, outer_filter_elem);
        });

        $("#btn_clear_fltr").unbind('click');
        $("#btn_clear_fltr").on('click', function () {
            reset_input_search_data();
        });
    }
    catch (e) {
        alert1(e + '_open_adv_fltr_popup_for_charts()');
    }
}

get_filter_controls_from_template_json = (checksheet_obj) => {
    var str = '';
    var columndata_Array = JSON.parse(checksheet_obj);

    for (var c = 0; c < columndata_Array.length; c++) {
        var is_hide = columndata_Array[c].is_hide;
        if (is_hide == "true") { }
        else {
            var header = columndata_Array[c].header;
            var coldata_obj = columndata_Array[c];
            coldata_obj = JSON.stringify(coldata_obj);
            coldata_obj = encodeURIComponent(coldata_obj);
            var param_onchange = "display_filter_condition_as_per_cntrl_type('" + coldata_obj + "', this, '" + c + "')";

            var ctrl_type = columndata_Array[c].ctrl_type;
            var system_var = columndata_Array[c].system_var;
            if (system_var == "Status_Name") {
                var value_Array = columndata_Array[c].value;
                if (value_Array == "" || value_Array == null || value_Array == undefined) {
                    value_Array = [];
                }
            }

            var type_icon_str = "fa-pencil-square-o";
            if (ctrl_type == 1) {
                type_icon_str = "fa-pencil-square-o";
            }
            else if (ctrl_type == 4) {
                type_icon_str = "fa-square-o";
            }
            else if (ctrl_type == 8 || system_var == "CreateDTTM" || system_var == "survey_date") {
                type_icon_str = "fa-calendar";
            }
            else if (ctrl_type == 2 || ctrl_type == 3 || ctrl_type == 6 || (system_var == "Status_Name" && value_Array.length > 0)) {
                type_icon_str = "fa-chevron-down";
            }
            else if (ctrl_type == 20) {
                type_icon_str = "fa-chevron-down";

                var Query_type = columndata_Array[c].Query_type;

                if (Query_type == "RowQuery") {
                    continue;
                }
            }

            str += '<li>';
            str += '<label class="label-checkbox item-content">';
            str += '<input type="checkbox" class="form-check-input" value="' + header + '" onchange="' + param_onchange + '" name="' + coldata_obj + '" index="' + c + '">';
            str += '<div class="item-media">';
            str += '<i class="icon icon-form-checkbox"></i>';
            str += '</div>';
            str += '<div class="item-inner">';
            str += '<div class="item-title">' + header + '</div>';
            str += '</div>';
            str += '<div class="div-cntrl-icon"><i class="fa ' + type_icon_str + ' fltr-cntrl-icon"></i></div>';
            str += '</label>';
            str += '<div class="fltr-cndtn-outer" id="div_fltr_cndtn_' + c + '" style="display:block;">';
            str += '</div>';
            str += '</li>';
        }
    }

    return str;
}

aply_fltr_on_counter_tab = (chart_mode, outer_filter_elem) => {
    is_deffltr_change_flag = 1;
    let search_obj = get_column_seach_obj();
    myApp.closeModal(".popup-advance-search-online");

    if (outer_filter_elem == '' || outer_filter_elem == null || outer_filter_elem == undefined) {
        add_new_chart(chart_mode, '_', 'preview');
    }
    else {

        let hdn_chart_json = $(outer_filter_elem).parent().find('input[type="hidden"]').val();
        hdn_chart_json = JSON.parse(decodeURIComponent(hdn_chart_json));
        hdn_chart_json.default_filter = search_obj;

        def_fltr_arry = search_obj;
        $(outer_filter_elem).parent().find('.cls_card_filter_items').empty();
        var def_fltr_str = '', def_fltr_tooltip = '';
        if (def_fltr_arry == '' || def_fltr_arry == null || def_fltr_arry == undefined) { }
        else {
            if (def_fltr_arry.length > 0) {
                def_fltr_tooltip += '<table class="tbl_user_tooltip" cellspacing=0 id="tooltip_tbl_id" style="width:100%"><tr colspan="2"><td>Temporary Filter:</td></tr><tr><th><u>Fields Name</u></th><th><u>Value</u></th></tr>';
                for (let d = 0; d < def_fltr_arry.length; d++) {
                    let def_fltr_val = def_fltr_arry[d].value;
                    let ctrl_type = def_fltr_arry[d].ctrl_type;
                    if (ctrl_type == 8) {
                        let calendar_type = def_fltr_arry[d].calendar_type;
                        let cal_value = [];
                        if (calendar_type == 'is_before' || calendar_type == 'is_after' || calendar_type == 'is_between') { }
                        else {
                            cal_value = get_date_as_per_condition(calendar_type);
                            if (def_fltr_val == '' || def_fltr_val == null || def_fltr_val == undefined) {
                                def_fltr_arry[d]['value'] = cal_value;
                                def_fltr_val = cal_value;
                            }
                            else {
                                def_fltr_val = cal_value;
                            }
                        }
                    }

                    let search_str = '';
                    for (let v = 0; v < def_fltr_val.length; v++) {
                        if (ctrl_type == 8) {
                            let calendar_type = def_fltr_arry[d].calendar_type;
                            if (calendar_type == 'is_before' || calendar_type == 'is_after' || calendar_type == 'is_between') {
                                if (v == def_fltr_val.length - 1) {
                                    search_str = search_str + def_fltr_val[v];
                                }
                                else {
                                    search_str = search_str + def_fltr_val[v] + ',';
                                }
                            }
                            else {
                                search_str = calendar_type.replace(/_/g, " ");
                            }
                        }
                        else {
                            if (v == def_fltr_val.length - 1) {
                                search_str = search_str + def_fltr_val[v];
                            }
                            else {
                                search_str = search_str + def_fltr_val[v] + ',';
                            }
                        }
                    }
                    let def_fltr_col_name = def_fltr_arry[d].columnName;
                    def_fltr_tooltip += '<tr><td><b>' + def_fltr_col_name + ':</b></td><td>' + search_str + '</td></tr>';

                    def_fltr_str += '<span style="color:gray;font-size:12px;font-weight:bold;background-color:white;padding:2px;border-radius: 5px 0px 0px 5px;">' + def_fltr_col_name + ': </span>';
                    def_fltr_str += '<span class="badge badge-light mr-1" style="font-weight:600;color:gray;background-color:white;padding:3px;border-radius:0px 5px 5px 0px;" data="' + encodeURIComponent(JSON.stringify(def_fltr_arry[d])) + '">' + search_str.toString() + '</span> ';
                }
                def_fltr_tooltip += '</table>';
                let encode_tooltip = encodeURIComponent(def_fltr_tooltip);
                var tooltip_param = "show_deffltr_tooltip_on_mouseover('" + encode_tooltip + "',event)";
                $(outer_filter_elem).parent().find('.cls_card_filter_items').attr('onmousemove', tooltip_param);
                $(outer_filter_elem).parent().find('.cls_card_filter_items').append(def_fltr_str);
            }
        }

        let card_id = $(outer_filter_elem).parent().attr('id');
        let card_counter = card_id.split('_');
        card_counter = card_counter[1];
        hdn_chart_json['counter'] = card_counter;

        let dashboard_menu_array = [];
        dashboard_menu_array.push(hdn_chart_json);
        let dashboard_id = $('#dashboard_page_tab .active').attr('dashboard_id');
        let card_view = $(outer_filter_elem).parent().find('.view_type_active').hasClass('cls_tbl_view');
        if (card_view == true) {
            card_view = 'table_view';
        }
        else {
            card_view = 'chart_view';
        }
        $(outer_filter_elem).parent().find('.apexcharts-canvas').remove();

        for (m = 0; m < menu_arry.length; m++) {
            let menu_chart_count = menu_arry[m].counter;
            if (menu_chart_count == card_counter) {
                menu_arry.splice(m, 1);
                break;
            }
        }

        get_chart_counter(JSON.stringify(dashboard_menu_array), dashboard_id, card_view, 'report');
    }
}

get_column_seach_obj = () => {
    try {
        var search_obj = [];
        //var str = '<span class="mr-1 align-middle text-dark">Filter By:</span>';
        var str = '';

        //var len = $("#tbl_advance_colSearch td input.form-check-input:checked").length;
        $("#tbl_advance_colSearch li input[type='checkbox']:checked").each(function () {
            var coldata_obj = $(this).attr('name');
            coldata_obj = decodeURIComponent(coldata_obj);
            coldata_obj = JSON.parse(coldata_obj);
            var coldata_index = $(this).attr('index');
            var eqn_str = $(this).parents('li').find(".fltr-cndtn-inner").find(".fltr-cndtn-eqn").val();
            eqn_str = eqn_str.toUpperCase();

            var cntrl_type = coldata_obj.ctrl_type;
            var cntrl_qid = coldata_obj.qid;
            var checksheetID = coldata_obj.checksheetID;
            var checksheet_type = coldata_obj.checksheet_type;
            if (checksheet_type == "" || checksheet_type == null || checksheet_type == undefined) {
                checksheet_type = "0";
            }


            var system_var = coldata_obj.system_var;
            if (system_var == "Status_Name") {
                var value_Array = coldata_obj.value;
                if (value_Array == "" || value_Array == null || value_Array == undefined) {
                    value_Array = [];
                }
            }

            if (cntrl_type == 2 || cntrl_type == 3 || cntrl_type == 6) {
                var Con_Array = coldata_obj.value;
                if (Con_Array == "" || Con_Array == null || Con_Array == undefined) {
                    Con_Array = [];
                    cntrl_type = 1;             //if value key is blank in columndara then consider it as textbox
                }
            }
            else if (cntrl_type == 20) {
                var Con_Array = coldata_obj.value_new;
                if (Con_Array == "" || Con_Array == null || Con_Array == undefined) {
                    Con_Array = [];
                    cntrl_type = 1;             //if value_new key is blank in columndara then consider it as textbox
                }
            }

            if (cntrl_type == 20 || cntrl_type == 2 || cntrl_type == 3 || cntrl_type == 6 || (system_var == "Status_Name" && value_Array.length > 0)) {
                var search_str = $(this).parents('li').find(".fltr-cndtn-inner").find("#fltr_val_ddl_" + coldata_index + "").val();

                if (cntrl_type == 20) {
                    try {
                        search_str = decodeURIComponent(search_str);
                    }
                    catch (e) {
                        search_str = $(this).parents('li').find(".fltr-cndtn-inner").find("#fltr_val_ddl_" + coldata_index + "").val();
                    }
                }

            }
            else if (cntrl_type == 8 || system_var == "CreateDTTM" || system_var == "survey_date") {
                var type8_val = $("#fltr_date_ddl_" + coldata_index + " option:selected").attr('name');
                if (type8_val == "is_between") {
                    var start_date = $("#dt_tp_Start_" + coldata_index + "").val();
                    start_date = convert_fix_format_date_on_submit(start_date, 'date');
                    var end_date = $("#dt_tp_End_" + coldata_index + "").val();
                    end_date = convert_fix_format_date_on_submit(end_date, 'date');
                    var search_str = [start_date + ' 00:00', end_date + ' 23:59'];
                }
                else if (type8_val == "is_before") {
                    var date_range = $("#dt_tp_Start_" + coldata_index + "").val();
                    date_range = convert_fix_format_date_on_submit(date_range, 'date');
                    var search_str = ['01/01/1920 00:00', date_range + ' 23:59'];
                }
                else if (type8_val == "is_after") {
                    var date_range = $("#dt_tp_Start_" + coldata_index + "").val();
                    date_range = convert_fix_format_date_on_submit(date_range, 'date');
                    var search_str = [date_range + ' 00:00', '3020/01/01 23:59'];
                }
                else {
                    var search_str = $(this).parents('li').find(".fltr-cndtn-inner").find("#lbl_tp_info_" + coldata_index + "").text();
                    search_str = search_str.split(' - ');
                    var date1 = search_str[0];
                    date1 = convert_fix_format_date_on_submit(date1, 'datetime');
                    var date2 = search_str[1];
                    date2 = convert_fix_format_date_on_submit(date2, 'datetime');
                    search_str[0] = date1;
                    search_str[1] = date2;
                }
            }
            else if (cntrl_type == 4 && eqn_str == "BETWEEN") {
                var search_str = [];
                var numeric_cntrl = $(this).parents('li').find(".fltr-cndtn-inner").find(".cls-ctrl-ans");
                $(numeric_cntrl).each(function () {
                    var num_val = $(this).val();
                    search_str.push(num_val);
                })
            }
            else {
                var search_str = $(this).parents('li').find(".fltr-cndtn-inner").find(".cls-ctrl-ans").val();
            }

            if (search_str == "" || search_str == null || search_str == undefined || search_str == "--- Select ---") { // for filter textbox or dropdown value str 30092022
                alert("Please Select Value or Enter value");
                return false;
            }

            if (Array.isArray(search_str)) { }
            else {
                search_str = [search_str];
            }

            if (type8_val == "" || type8_val == null || type8_val == undefined) {
                type8_val = "";
            }

            var sys_var = "";
            if (cntrl_qid == 0 & cntrl_type == 1) {
                if (checksheettype == '5') {
                    sys_var = 'task_id';
                }
                else if (checksheettype == '3') {
                    sys_var = 'customer_id';
                }
                else if (checksheettype == '7') {
                    sys_var = 'user_id';
                }
                else {
                    // in case of udf with view
                    sys_var = header;
                }
            }
            else if (cntrl_qid == 0 & cntrl_type == 8) {
                sys_var = header;
            }
            else if (cntrl_qid == 0 & cntrl_type == 0 && checksheetID == 0 && qid == 0) {
                // sys_var = header;
                sys_var = system_var;
            }

            var col_name = $(this).val();
            search_obj.push({
                "columnName": col_name,
                'id': search_str,
                "value": search_str,
                "Equation": eqn_str,
                "calendar_type": type8_val,
                "queId": cntrl_qid,
                "system_var": sys_var,
                "checksheetID": checksheetID,
                "checksheet_type": checksheet_type,
                "qid": cntrl_qid,
                "ctrl_type": cntrl_type,
            });

            //changes for saved filter [17122021]
            var adv_search_obj = {
                "columnName": col_name,
                'id': search_str,
                "value": search_str,
                "Equation": eqn_str,
                "calendar_type": type8_val,
                "queId": cntrl_qid,
                "system_var": sys_var,
                "checksheetID": checksheetID,
                "checksheet_type": checksheet_type,
                "qid": cntrl_qid,
                "ctrl_type": cntrl_type,
            };
            var search_obj_str = JSON.stringify(adv_search_obj);
            search_obj_str = encodeURIComponent(search_obj_str);
            //str += '<span class="badge badge-dark mr-1" data="' + search_obj_str + '">' + col_name + ': ' + search_str + '</span>'
            //str += '<span class="badge badge-dark mr-1" data="' + search_obj_str + '">' + col_name + '</span>'
            str += '<div class="label-default cursor-pointer d-inline" style="background-color: white;border: solid 1px #aaa;margin: 2px 10px 0px 0px;border-radius: 0.25rem;font-size: 12px;padding: 1px 5px;">';
            str += '<span class="mr-1" style="color:gray;font-size:12px;font-weight:bold;">' + col_name + ': </span>';
            str += '<span class="badge badge-light mr-1" data="' + search_obj_str + '">' + search_str.toString() + '</span>';
            str += '</div>';
        });

        $(".div-filtered-item").empty();
        $(".div-filtered-item").append(str);

        return search_obj;
    }
    catch (e) {
        alert1(e + '_get_column_seach_obj()');
    }
}

reset_input_search_data = () => {
    try {
        $("#tbl_advance_colSearch li input[type='checkbox']").each(function () {
            $(this).prop('checked', false);
        });
        $(".fltr-cndtn-outer").hide();
        $(".div-delete-filter").hide();
        $("#ddl_OrderBy").val(ddl_orderby);
        $("#ddl_OrderType").val(ddl_order_type);

        // filter with forward backward 23012023
        localStorage.setItem('searchCol_obj', "");

        //get_list_of_pm_sites_by_search_online('', 'clear_filter');
    }
    catch (e) {
        alert1(e + '_reset_input_search_data()');
    }
}

close_type20_dropdown_popup = () => {
    myApp.closeModal(".popup-type20-dropdown");

    if (F7_device == 'android' || F7_device == 'ios') {
        //popup UI issue in iOS
        $(".popup-type20-dropdown").hide();
    }

    $("select[id^=ddl_search_type20_]").prop("disabled", true);
}

display_selected_filter_data = (filter_field_obj) => {
    check_ary = 1;
    var str = '';
    $("#tbl_advance_colSearch li input.form-check-input").each(function () {
        var coldata_obj = $(this).attr('name');
        coldata_obj = decodeURIComponent(coldata_obj);
        coldata_obj = JSON.parse(coldata_obj);
        var coldata_index = $(this).attr('index');
        var col_name = $(this).val();
        for (var i = 0; i < filter_field_obj.length; i++) {
            var filtered_col_name = filter_field_obj[i].columnName;

            if (col_name == filtered_col_name) {
                $(this).prop('checked', true);
                $(this).trigger('onchange');

                var filtered_col_id = filter_field_obj[i].id;
                var filtered_col_val = filter_field_obj[i].value;
                var filtered_col_Eqn = filter_field_obj[i].Equation;
                $(this).parents('li').find(".fltr-cndtn-inner").find(".fltr-cndtn-eqn").val(filtered_col_Eqn);

                var cntrl_type = coldata_obj.ctrl_type;
                var system_var = coldata_obj.system_var;
                if (system_var == "Status_Name") {
                    var value_Array = coldata_obj.value;
                    if (value_Array == "" || value_Array == null || value_Array == undefined) {
                        value_Array = [];
                    }
                }

                if (cntrl_type == 20 || cntrl_type == 2 || cntrl_type == 3 || cntrl_type == 6 || (system_var == "Status_Name" && value_Array.length > 0)) {
                    setTimeout(function () {

                        for (f = 0; f < filtered_col_val.length; f++) {
                            var t_filtered_col_id = filtered_col_id[f];
                            var t_filtered_col_val = filtered_col_val[f];
                            var option_exist = $("#fltr_val_ddl_" + coldata_index + "").find("option[value='" + t_filtered_col_val + "']");
                            if (option_exist.length == 0) {
                                // filtered answer is not found in searchable dropdown
                                var option = "<option value='" + t_filtered_col_val + "' name='" + t_filtered_col_id + "'>" + t_filtered_col_val + "</option>";
                                $("#fltr_val_ddl_" + coldata_index + "").append(option);
                                //$("#fltr_val_ddl_" + coldata_index + "").selectpicker('refresh');
                            }
                        }

                        //$("#fltr_val_ddl_" + coldata_index + "").selectpicker('val', filtered_col_val);
                        //$("#fltr_val_ddl_" + coldata_index + "").selectpicker('refresh');
                        $("#fltr_val_ddl_" + coldata_index + "").parent().trigger('onchange');

                        set_dropdown_data_filter(filtered_col_val[0], coldata_index, '');
                    }, 500);
                }
                else if (cntrl_type == 8 || system_var == "CreateDTTM" || system_var == "survey_date") {
                    var filtered_calendar_type = filter_field_obj[i].calendar_type;
                    $("#fltr_date_ddl_" + coldata_index + " option[name='" + filtered_calendar_type + "']").prop('selected', true);
                    $("#dt_tp_Start_" + coldata_index + "").hide().parent().hide();
                    $("#dt_tp_End_" + coldata_index + "").hide().parent().hide();

                    if (filtered_calendar_type == "is_between") {
                        $("#dt_tp_Start_" + coldata_index + "").show().parent().show();
                        $("#dt_tp_End_" + coldata_index + "").show().parent().show();
                        var date1 = filtered_col_val[0];
                        date1 = date1.split(' ');
                        date1 = date1[0];
                        var final_date1 = convert_datetime_by_format(date1, "datetime");
                        var date2 = filtered_col_val[1];
                        date2 = date2.split(' ');
                        date2 = date2[0];
                        var final_date2 = convert_datetime_by_format(date2, "datetime");
                        $("#dt_tp_Start_" + coldata_index + "").val(final_date1);
                        $("#dt_tp_End_" + coldata_index + "").val(final_date2);
                        initialize_datepicker(final_date1, '#dt_tp_Start_' + coldata_index + '');
                        initialize_datepicker(final_date2, '#dt_tp_End_' + coldata_index + '');
                        $(this).parents('li').find(".fltr-cndtn-inner").find("#lbl_tp_info_" + coldata_index + "").text('');
                    }
                    else if (filtered_calendar_type == "is_before") {
                        $("#dt_tp_Start_" + coldata_index + "").show().parent().show();
                        var date1 = filtered_col_val[1];
                        date1 = date1.split(' ');
                        date1 = date1[0];
                        var final_date1 = convert_datetime_by_format(date1, "datetime");
                        $("#dt_tp_Start_" + coldata_index + "").val(final_date1);
                        initialize_datepicker(final_date1, '#dt_tp_Start_' + coldata_index + '');
                        $(this).parents('li').find(".fltr-cndtn-inner").find("#lbl_tp_info_" + coldata_index + "").text('');
                    }
                    else if (filtered_calendar_type == "is_after") {
                        $("#dt_tp_Start_" + coldata_index + "").show().parent().show();
                        var date1 = filtered_col_val[0];
                        date1 = date1.split(' ');
                        date1 = date1[0];
                        var final_date1 = convert_datetime_by_format(date1, "datetime");
                        $("#dt_tp_Start_" + coldata_index + "").val(final_date1);
                        initialize_datepicker(final_date1, '#dt_tp_Start_' + coldata_index + '');
                        $(this).parents('li').find(".fltr-cndtn-inner").find("#lbl_tp_info_" + coldata_index + "").text('');
                    }
                    else {
                        var final_date1 = '', final_date2 = '';
                        var date1 = filtered_col_val[0];
                        if (date1 == '' || date1 == null || date1 == undefined) { }
                        else {
                            var final_date1 = convert_datetime_by_format(date1, "datetime");
                        }

                        var date2 = filtered_col_val[1];
                        if (date2 == '' || date2 == null || date2 == undefined) { }
                        else {
                            final_date2 = convert_datetime_by_format(date2, "datetime");
                        }

                        filtered_col_val = final_date1 + ' - ' + final_date2;
                        $(this).parents('li').find(".fltr-cndtn-inner").find("#lbl_tp_info_" + coldata_index + "").text(filtered_col_val);
                    }
                }
                else {
                    $(this).parents('li').find(".fltr-cndtn-inner").find("input").val(filtered_col_val);
                }

                //changes for saved filter [17122021]
                var adv_search_obj = {
                    "columnName": filtered_col_name,
                    "id": filtered_col_id,
                    "value": filtered_col_val,
                    "Equation": filtered_col_Eqn
                };

                var search_obj_str = JSON.stringify(adv_search_obj);
                search_obj_str = encodeURIComponent(search_obj_str);
                str += '<span class="badge badge-dark mr-1" data="' + search_obj_str + '">' + filtered_col_name + '</span>';
            }
        }
    });
}

ResizeBox = (e) => {
    var ele = e.target;
    var t = ele.scrollTop;
    ele.scrollTop = 0
    if (t > 0) {
        ele.style.height = (ele.offsetHeight + t) + "px";
    }
}