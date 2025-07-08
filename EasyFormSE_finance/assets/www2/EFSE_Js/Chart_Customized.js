
var glob_indexval;
var glob_chartname;

function chart_function(chart_data_array) {
    // this.ChartData_Array = [];
    //this.DyID = 0;

    if (chart_data_array.length > 0) {
        this.ChartData_Array = chart_data_array;

        //this.DyID = parseInt(chart_data_array.length);
    } else {
        alert1("Array is Blank");
        this.ChartData_Array = [];
    }
}

var chart_email_count = 0;
chart_function.prototype = {
    /// Chart Draw function ///
    Draw_Chart: function () {
        if (typeof this.ChartData_Array != "undefined" && this.ChartData_Array != null && this.ChartData_Array.length > 0) {
            var msg = this.ChartData_Array;
            var msgleng = this.ChartData_Array.length % 2;
            // var dynamicID = this.DyID + parseInt(this.ChartData_Array.length);
            if (msgleng == 0) {
                for (var m = 0; m < msg.length; m++) {
                    DyID++;
                    var titel_for_custmize_chart = msg[m]["chart_label"];
                    var chart_id_custom = msg[m]["chart_id"];
                    var chart_data = "";
                    try {
                        chart_data = eval('(' + msg[m]["chart_json"] + ')');
                    } catch (e) {
                        chart_data = msg[m]["chart_json"];
                    }

                    var chart_css = msg[m]["chart_css"];
                    var chart_email = chart_css[0]["email"];
                    var chart_filter = chart_css[0]["filter"];
                    var chart_email_str = '';
                    if (chart_email == '0') {
                        chart_email_str = 'display: none;';
                    }
                    else {
                        chart_email_count++;
                    }

                    var chart_filter_str = '';
                    if (chart_filter == '0') {
                        chart_filter_str = 'display: none;';
                    }

                    var newdiv = "";
                    if ((m % 2) == 0) {
                        newdiv += '<div class="chart_main"  id="Chart_Row_Col_' + DyID + '">';
                        newdiv += '<div class="chart_main" >';
                        newdiv += '<div class="panel-primary" style="height: auto !important;min-height: 273px" id="div_barchart_extra_' + DyID + '">';
                        newdiv += '<div class="panel-heading">' + titel_for_custmize_chart;
                        newdiv += '<div id="div_mail_view_' + DyID + '" style="position: absolute;top: 0;right: 20%;padding: 0px 15px;cursor: pointer; ' + chart_email_str + '" ><input type="hidden" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="mail_' + DyID + '" onclick="mail_view_function(div_mail_view_' + DyID + ',table_id_' + DyID + ',email_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-envelope fa-fw fa-2x"></i></div>';
                        newdiv += '<div id="div_table_view_' + DyID + '" class="div_table_view"><input type="hidden" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" onclick="table_view_function(div_table_view_' + DyID + ',table_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-table fa-fw fa-2x"></i></div>';
                        newdiv += '<div id="div_max_map_info_extra_' + DyID + '" class="div_max_map_info_extra" style="' + chart_filter_str + '">';
                        newdiv += '<input type="hidden" name="0" value=\'' + JSON.stringify(msg[m]["checksheet_json"]) + '\'/>';
                        //newdiv += '<img id="img_max_map_info_extra_' + DyID + '" src="images/info_gear.png" class="info_gear" name="0" onclick="show_max_map_details_dynamic_chart(img_max_map_info_extra_' + DyID + ',div_max_map_info_extra_' + DyID + ',' + msg[m]["chart_type"] + ',div_form_pie_extra_' + DyID + ',chart_id_' + DyID + ',div_table_view_' + DyID + ',table_id_' + DyID + ',' + chart_id_custom + ')" />';
                        newdiv += '<i class="fa fa-filter" id="img_max_map_info_extra_' + DyID + '" name="0" onclick="show_max_map_details_dynamic_chart(img_max_map_info_extra_' + DyID + ',div_max_map_info_extra_' + DyID + ',' + msg[m]["chart_type"] + ',div_form_pie_extra_' + DyID + ',chart_id_' + DyID + ',div_table_view_' + DyID + ',table_id_' + DyID + ',' + chart_id_custom + ')"></i>';
                        newdiv += '<div id="div_form_pie_extra_' + DyID + '" class="div_form_pie_extra"></div>';
                        newdiv += '</div>';
                        newdiv += '</div>';
                        newdiv += '<div id="chart_id_' + DyID + '" class="panel-body" style="margin: 0 !important;"></div>';
                        newdiv += '<div id="table_id_' + DyID + '" class="panel-body" style="max-height:200px;overflow:auto;margin: 0 !important;display:none"></div>';
                        newdiv += '<div id="email_id_' + DyID + '" class="panel-body" style="width:98%; padding-bottom:5px; font-size:10pt; display:none"><table style="width:100%"><td style="width:15px">Email </td><td style="padding:0 5px"><input type="text" id="txtemail' + DyID + '" class="form-control" style="height:25px; border:1px solid #ccc" /></td><td><a class="button button-fill button-raised" style="height:25px; line-height:25px; min-width:initial" onclick="btnsubmitemail_pre(\'' + DyID + '\',\'' + titel_for_custmize_chart + '\')">Send</a></td></table><input id="hdn_chart_' + DyID + '" type="hidden" /><input id="hdn_table_' + DyID + '" type="hidden" /></div>';
                        newdiv += '</div></div></div>';
                        $("#dynamic_chart").append(newdiv);


                        if (msg[m]["chart_type"] == "1") {
                            var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                            var chart = new google.visualization.PieChart(document.getElementById("chart_id_" + DyID));

                            chart.draw(dt1, {
                                title: titel_for_custmize_chart,
                                pieHole: 0.3,
                            });
                        } else if (msg[m]["chart_type"] == "2") {
                            var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                            var chart = new google.visualization.ColumnChart(document.getElementById("chart_id_" + DyID));
                            chart.draw(dt1, {
                                title: titel_for_custmize_chart,
                                chartArea: { width: '60%', height: '65%' },
                                isStacked: true
                            });
                        } else if (msg[m]["chart_type"] == "3") {
                            $("#div_table_view_" + DyID).hide();
                            $("#div_max_map_info_extra_" + DyID).hide();
                            var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                            var chart = new google.visualization.AnnotationChart(document.getElementById("chart_id_" + DyID));
                            chart.draw(dt1, {
                                title: titel_for_custmize_chart,
                                displayAnnotations: true

                            });
                        } else if (msg[m]["chart_type"] == "4") {
                            $("#div_table_view_" + DyID).hide();
                            $("#div_max_map_info_extra_" + DyID).hide();
                            var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                            var chart = new google.visualization.Table(document.getElementById("chart_id_" + DyID));
                            chart.draw(dt1, {
                                title: titel_for_custmize_chart,
                                displayAnnotations: true
                            });
                        }
                        else if (msg[m]["chart_type"] == "5") {
                            //$("#div_table_view_" + DyID).hide();
                            //$("#div_max_map_info_extra_" + DyID).hide();
                            var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                            var chart = new google.visualization.Table(document.getElementById("chart_id_" + DyID));
                            chart.draw(dt1, {
                                title: titel_for_custmize_chart,
                                displayAnnotations: true
                            });
                        }
                    } else {
                        newdiv += '<div class="chart_main" style="padding-right: 15px !important">';
                        newdiv += ' <div class="panel-primary" style="height: auto !important;min-height: 273px" id="div_barchart_extra_' + DyID + '">';
                        newdiv += '<div class="panel_heading navbar">' + titel_for_custmize_chart;
                        newdiv += '<div id="div_mail_view_' + DyID + '" style="position: absolute;top: 0%;right: 20%;padding: 0px 15px;cursor: pointer; ' + chart_email_str + '" ><input type="hidden" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="mail_' + DyID + '" onclick="mail_view_function(div_mail_view_' + DyID + ',table_id_' + DyID + ',email_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-envelope fa-fw fa-2x" ></i></div>';
                        newdiv += '<div id="div_table_view_' + DyID + '" class="div_table_view"" onclick="table_view_function(div_table_view_' + DyID + ',table_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')"><input type="hidden" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" class="fa fa-table fa-fw fa-2x"></i></div>';
                        newdiv += '<div id="div_max_map_info_extra_' + DyID + '"class="div_max_map_info_extra" style="' + chart_filter_str + '">';
                        newdiv += '<input type="hidden" name="0" value=\'' + JSON.stringify(msg[m]["checksheet_json"]) + '\'/>';
                        // newdiv += '<img id="img_max_map_info_extra_' + DyID + '" src="images/info_gear.png" class="info_gear" name="0" onclick="show_max_map_details_dynamic_chart(img_max_map_info_extra_' + DyID + ',div_max_map_info_extra_' + DyID + ',' + msg[m]["chart_type"] + ',div_form_pie_extra_' + DyID + ',chart_id_' + DyID + ',div_table_view_' + DyID + ',table_id_' + DyID + ',' + chart_id_custom + ')" />';
                        newdiv += '<i class="fa fa-filter" id="img_max_map_info_extra_' + DyID + '" name="0" onclick="show_max_map_details_dynamic_chart(img_max_map_info_extra_' + DyID + ',div_max_map_info_extra_' + DyID + ',' + msg[m]["chart_type"] + ',div_form_pie_extra_' + DyID + ',chart_id_' + DyID + ',div_table_view_' + DyID + ',table_id_' + DyID + ',' + chart_id_custom + ')"></i>';
                        newdiv += '<div id="div_form_pie_extra_' + DyID + '" class="div_form_pie_extra"></div>';
                        newdiv += '</div>';
                        newdiv += '</div>';
                        newdiv += '<div id="chart_id_' + DyID + '" class="panel-body" style="margin: 0 !important;"></div>';
                        newdiv += '<div id="table_id_' + DyID + '" class="panel-body" style="max-height:200px;overflow:auto;margin: 0 !important;display:none"></div>';
                        newdiv += '<div id="email_id_' + DyID + '" class="panel-body" style="width:98%; padding-bottom:5px; font-size:10pt; display:none"><table style="width:100%"><td style="width:15px">Email </td><td style="padding:0 5px"><input type="text" id="txtemail' + DyID + '" class="form-control" style="height:25px; border:1px solid #ccc" /></td><td><a class="button button-fill button-raised" style="height:25px; line-height:25px; min-width:initial" onclick="btnsubmitemail_pre(\'' + DyID + '\',\'' + titel_for_custmize_chart + '\')">Send</a></td></table><input id="hdn_chart_' + DyID + '" type="hidden" /><input id="hdn_table_' + DyID + '" type="hidden" /></div>';
                        newdiv += '</div></div>';

                        $("#Chart_Row_Col_" + (DyID - 1)).append(newdiv);
                        // var titel_for_custmize_chart = msg[m]["chart_label"];

                        if (msg[m]["chart_type"] == "1") {
                            var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                            var chart = new google.visualization.PieChart(document.getElementById("chart_id_" + DyID));

                            chart.draw(dt1, {
                                title: titel_for_custmize_chart,
                                pieHole: 0.3,
                            });
                        } else if (msg[m]["chart_type"] == "2") {
                            var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                            var chart = new google.visualization.ColumnChart(document.getElementById("chart_id_" + DyID));
                            chart.draw(dt1, {
                                title: titel_for_custmize_chart,
                                chartArea: { width: '60%', height: '65%' },
                                isStacked: true
                            });
                        } else if (msg[m]["chart_type"] == "3") {
                            $("#div_table_view_" + DyID).hide();
                            $("#div_max_map_info_extra_" + DyID).hide();
                            var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                            var chart = new google.visualization.AnnotationChart(document.getElementById("chart_id_" + DyID));
                            chart.draw(dt1, {
                                title: titel_for_custmize_chart,
                                displayAnnotations: true

                            });
                        } else if (msg[m]["chart_type"] == "4") {
                            $("#div_table_view_" + DyID).hide();
                            $("#div_max_map_info_extra_" + DyID).hide();
                            var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                            var chart = new google.visualization.AnnotationChart(document.getElementById("chart_id_" + DyID));
                            chart.draw(dt1, {
                                title: titel_for_custmize_chart,
                                displayAnnotations: true

                            });
                        }
                    }

                }

            } else {
                //scond

                for (var m = 0; m < msg.length; m++) {
                    DyID++;
                    var newdiv = "";
                    var titel_for_custmize_chart = msg[m]["chart_label"];
                    var chart_id_custom = msg[m]["chart_id"];
                    var chart_data = "";
                    try {
                        chart_data = eval('(' + msg[m]["chart_json"] + ')');
                    } catch (e) {
                        chart_data = msg[m]["chart_json"];
                    }

                    var chart_css = msg[m]["chart_css"];
                    var chart_email = chart_css[0]["email"];
                    var chart_filter = chart_css[0]["filter"];
                    var chart_email_str = '';
                    if (chart_email == '0') {
                        chart_email_str = 'display: none;';
                    }
                    var chart_filter_str = '';
                    if (chart_filter == '0') {
                        chart_filter_str = 'display: none;';
                    }

                    if (m == (msg.length - 1)) {
                        newdiv += '<div class="chart_main"  id="Chart_Row_Col_' + DyID + '">';
                        newdiv += '<div class="col-lg-12">';
                        //newdiv += ' <div class="panel panel-primary" style="height: auto !important;min-height: 273px" id="div_barchart_extra_' + DyID + '">';
                        newdiv += ' <div class="panel-primary" id="div_barchart_extra_' + DyID + '">';
                        newdiv += ' <div class="panel_heading navbar">' + titel_for_custmize_chart;
                        newdiv += '<div id="div_mail_view_' + DyID + '" style="position: absolute;top: 0%;right: 20%;padding: 0px 15px;cursor: pointer; ' + chart_email_str + '" ><input type="hidden" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="mail_' + DyID + '" onclick="mail_view_function(div_mail_view_' + DyID + ',table_id_' + DyID + ',email_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-envelope fa-fw fa-2x" ></i></div>';
                        newdiv += '<div id="div_table_view_' + DyID + '" class="div_table_view"><input type="hidden" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" onclick="table_view_function(div_table_view_' + DyID + ',table_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-table fa-fw fa-2x"></i></div>';
                        newdiv += '<div id="div_max_map_info_extra_' + DyID + '" class="div_max_map_info_extra" style="' + chart_filter_str + '">';
                        newdiv += '<input type="hidden" name="0" value=\'' + JSON.stringify(msg[m]["checksheet_json"]) + '\'/>';
                        //      newdiv += '<i class="fa fa-cog fa-fw fa-2x" id="img_max_map_info_extra_' + DyID + '" style="width: 32px; height: 32px; float: right; cursor: pointer; transition: 1s" name="0" onclick="show_max_map_details_dynamic_chart(img_max_map_info_extra_' + DyID + ',div_max_map_info_extra_' + DyID + ',' + msg[m]["chart_type"] + ',div_form_pie_extra_' + DyID + ',chart_id_' + DyID + ',div_table_view_' + DyID + ',table_id_' + DyID + ')"></i>';
                        //  newdiv += '<img id="img_max_map_info_extra_' + DyID + '" src="images/info_gear.png" class="info_gear" name="0" onclick="show_max_map_details_dynamic_chart(img_max_map_info_extra_' + DyID + ',div_max_map_info_extra_' + DyID + ',' + msg[m]["chart_type"] + ',div_form_pie_extra_' + DyID + ',chart_id_' + DyID + ',div_table_view_' + DyID + ',table_id_' + DyID + ',' + chart_id_custom + ')" />';
                        newdiv += '<i class="fa fa-filter" id="img_max_map_info_extra_' + DyID + '" name="0" onclick="show_max_map_details_dynamic_chart(img_max_map_info_extra_' + DyID + ',div_max_map_info_extra_' + DyID + ',' + msg[m]["chart_type"] + ',div_form_pie_extra_' + DyID + ',chart_id_' + DyID + ',div_table_view_' + DyID + ',table_id_' + DyID + ',' + chart_id_custom + ')"></i>';
                        newdiv += '<div id="div_form_pie_extra_' + DyID + '" class="div_form_pie_extra"></div>';
                        newdiv += '</div>';
                        newdiv += '</div>';
                        newdiv += '<div id="chart_id_' + DyID + '" class="panel-body" style="margin: 0 !important;"></div>';
                        newdiv += '<div id="table_id_' + DyID + '" class="panel-body" style="max-height:200px;overflow:auto;margin: 0 !important;display:none"></div>';
                        newdiv += '<div id="email_id_' + DyID + '" class="panel-body" style="width:98%; padding-bottom:5px; font-size:10pt; display:none"><table style="width:100%"><td style="width:15px">Email </td><td style="padding:0 5px"><input type="text" id="txtemail' + DyID + '" class="form-control" style="height:25px; border:1px solid #ccc" /></td><td><a class="button button-fill button-raised" style="height:25px; line-height:25px; min-width:initial" onclick="btnsubmitemail_pre(\'' + DyID + '\',\'' + titel_for_custmize_chart + '\')">Send</a></td></table><input id="hdn_chart_' + DyID + '" type="hidden" /><input id="hdn_table_' + DyID + '" type="hidden" /></div>';
                        newdiv += '</div></div></div>';
                        $("#dynamic_chart").append(newdiv);

                        //var titel_for_custmize_chart = msg[m]["chart_label"];
                        if (msg[m]["chart_type"] == "1") {

                            var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                            var chart = new google.visualization.PieChart(document.getElementById("chart_id_" + DyID));

                            chart.draw(dt1, {
                                title: titel_for_custmize_chart,
                                pieHole: 0.3,
                            });
                        } else if (msg[m]["chart_type"] == "2") {
                            var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                            var chart = new google.visualization.ColumnChart(document.getElementById("chart_id_" + DyID));
                            chart.draw(dt1, {
                                //title: titel_for_custmize_chart,
                                // width: "100%",
                                axes: {
                                    x: {
                                        0: { side: 'top', label: 'White to move' } // Top x-axis.
                                    }
                                },
                                hAxis: {
                                    direction: -1,
                                    slantedText: true,
                                    slantedTextAngle: 45,
                                    textStyle: {
                                        fontSize: 12 // or the number you want
                                    }
                                },
                                legend: { position: 'top', maxLines: 3 },
                                // width: "2000",
                                height: "450",
                                chartArea: { width: '80%', height: '60%' },
                                isStacked: true,
                            });
                        } else if (msg[m]["chart_type"] == "3") {
                            $("#div_table_view_" + DyID).hide();
                            $("#div_max_map_info_extra_" + DyID).hide();
                            var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                            var chart = new google.visualization.AnnotationChart(document.getElementById("chart_id_" + DyID));
                            chart.draw(dt1, {
                                title: titel_for_custmize_chart,
                                displayAnnotations: true

                            });
                        } else if (msg[m]["chart_type"] == "4") {
                            $("#div_table_view_" + DyID).hide();
                            $("#div_max_map_info_extra_" + DyID).hide();
                            var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                            var chart = new google.visualization.AnnotationChart(document.getElementById("chart_id_" + DyID));
                            chart.draw(dt1, {
                                title: titel_for_custmize_chart,
                                displayAnnotations: true

                            });
                        }



                    } else {
                        if ((m % 2) == 0) {
                            newdiv += '<div class="chart_main" id="Chart_Row_Col_' + DyID + '">';
                            newdiv += '<div class="col-lg-5">';
                            newdiv += ' <div class="panel-primary" style="height: auto !important;min-height: 273px" id="div_barchart_extra_' + DyID + '">';
                            newdiv += ' <div class="panel_heading navbar">' + titel_for_custmize_chart;
                            newdiv += '<div id="div_mail_view_' + DyID + '" style="position: absolute;top: 0%;right:20%;padding: 0px 15px;cursor: pointer; ' + chart_email_str + '" ><input type="hidden" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="mail_' + DyID + '" onclick="mail_view_function(div_mail_view_' + DyID + ',table_id_' + DyID + ',email_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-envelope fa-fw fa-2x"></i></div>';
                            newdiv += '<div id="div_table_view_' + DyID + '" class="div_table_view"><input type="hidden" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" onclick="table_view_function(div_table_view_' + DyID + ',table_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-table fa-fw fa-2x"></i></div>';
                            newdiv += '<div id="div_max_map_info_extra_' + DyID + '"class="div_max_map_info_extra" style="' + chart_filter_str + '">';
                            newdiv += '<input type="hidden" name="0" value=\'' + JSON.stringify(msg[m]["checksheet_json"]) + '\'/>';
                            // newdiv += '<img id="img_max_map_info_extra_' + DyID + '" src="images/info_gear.png" class="info_gear" name="0" onclick="show_max_map_details_dynamic_chart(img_max_map_info_extra_' + DyID + ',div_max_map_info_extra_' + DyID + ',' + msg[m]["chart_type"] + ',div_form_pie_extra_' + DyID + ',chart_id_' + DyID + ',div_table_view_' + DyID + ',table_id_' + DyID + ',' + chart_id_custom + ')" />';
                            newdiv += '<i class="fa fa-filter" id="img_max_map_info_extra_' + DyID + '" name="0" onclick="show_max_map_details_dynamic_chart(img_max_map_info_extra_' + DyID + ',div_max_map_info_extra_' + DyID + ',' + msg[m]["chart_type"] + ',div_form_pie_extra_' + DyID + ',chart_id_' + DyID + ',div_table_view_' + DyID + ',table_id_' + DyID + ',' + chart_id_custom + ')" />';
                            newdiv += '<div id="div_form_pie_extra_' + DyID + '" class="div_form_pie_extra"></div>';
                            newdiv += '</div>';
                            newdiv += '</div>';
                            newdiv += '<div id="chart_id_' + DyID + '" class="panel-body" style="margin: 0 !important;"></div>';
                            newdiv += '<div id="table_id_' + DyID + '" class="panel-body" style="max-height:200px;overflow:auto;margin: 0 !important;display:none"></div>';
                            newdiv += '<div id="email_id_' + DyID + '" class="panel-body" style="width:98%; padding-bottom:5px; font-size:10pt; display:none"><table style="width:100%"><td style="width:15px">Email </td><td style="padding:0 5px"><input type="text" id="txtemail' + DyID + '" class="form-control" style="height:25px; border:1px solid #ccc" /></td><td><a class="button button-fill button-raised" style="height:25px; line-height:25px; min-width:initial" onclick="btnsubmitemail_pre(\'' + DyID + '\',\'' + titel_for_custmize_chart + '\')">Send</a></td></table><input id="hdn_chart_' + DyID + '" type="hidden" /><input id="hdn_table_' + DyID + '" type="hidden" /></div>';
                            newdiv += '</div></div></div>';
                            $("#dynamic_chart").append(newdiv);

                            // var titel_for_custmize_chart = msg[m]["chart_label"];
                            if (msg[m]["chart_type"] == "1") {
                                var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                                var chart = new google.visualization.PieChart(document.getElementById("chart_id_" + DyID));

                                chart.draw(dt1, {
                                    title: titel_for_custmize_chart,
                                    pieHole: 0.3,
                                });
                            } else if (msg[m]["chart_type"] == "2") {
                                var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                                var chart = new google.visualization.ColumnChart(document.getElementById("chart_id_" + DyID));
                                chart.draw(dt1, {

                                    title: titel_for_custmize_chart,
                                    chartArea: { width: '60%', height: '65%' },
                                    isStacked: true,
                                });
                            } else if (msg[m]["chart_type"] == "3") {
                                $("#div_table_view_" + DyID).hide();
                                $("#div_max_map_info_extra_" + DyID).hide();
                                var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                                var chart = new google.visualization.AnnotationChart(document.getElementById("chart_id_" + DyID));
                                chart.draw(dt1, {
                                    title: titel_for_custmize_chart,
                                    displayAnnotations: true

                                });
                            } else if (msg[m]["chart_type"] == "4") {
                                $("#div_table_view_" + DyID).hide();
                                $("#div_max_map_info_extra_" + DyID).hide();
                                var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                                var chart = new google.visualization.AnnotationChart(document.getElementById("chart_id_" + DyID));
                                chart.draw(dt1, {
                                    title: titel_for_custmize_chart,
                                    displayAnnotations: true

                                });
                            }
                        } else {
                            newdiv += '<div class="col-lg-7">';
                            newdiv += ' <div class="panel-primary" style="height: auto !important;min-height: 273px" id="div_barchart_extra_' + DyID + '">';
                            newdiv += ' <div class="panel_heading navbar">' + titel_for_custmize_chart;
                            newdiv += '<div id="div_mail_view_' + DyID + '" style="position: absolute;top: 0%;right: 20%;padding: 0px 15px;cursor: pointer; ' + chart_email_str + '" ><input type="hidden" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="mail_' + DyID + '" onclick="mail_view_function(div_mail_view_' + DyID + ',table_id_' + DyID + ',email_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-envelope fa-fw fa-2x"></i></div>';
                            newdiv += '<div id="div_table_view_' + DyID + '" class="div_table_view"><input type="hidden" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" onclick="table_view_function(div_table_view_' + DyID + ',table_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-table fa-fw fa-2x"></i></div>';
                            newdiv += '<div id="div_max_map_info_extra_' + DyID + '" class="div_max_map_info_extra" style="' + chart_filter_str + '">';
                            newdiv += '<input type="hidden" name="0" value=\'' + JSON.stringify(msg[m]["checksheet_json"]) + '\'/>';
                            //newdiv += '<img id="img_max_map_info_extra_' + DyID + '" src="images/info_gear.png" class="info_gear" name="0" onclick="show_max_map_details_dynamic_chart(img_max_map_info_extra_' + DyID + ',div_max_map_info_extra_' + DyID + ',' + msg[m]["chart_type"] + ',div_form_pie_extra_' + DyID + ',chart_id_' + DyID + ',div_table_view_' + DyID + ',table_id_' + DyID + ',' + chart_id_custom + ')" />';
                            newdiv += '<i class="fa fa-filter" id="img_max_map_info_extra_' + DyID + '" name="0" onclick="show_max_map_details_dynamic_chart(img_max_map_info_extra_' + DyID + ',div_max_map_info_extra_' + DyID + ',' + msg[m]["chart_type"] + ',div_form_pie_extra_' + DyID + ',chart_id_' + DyID + ',div_table_view_' + DyID + ',table_id_' + DyID + ',' + chart_id_custom + ')"></i>';
                            newdiv += '<div id="div_form_pie_extra_' + DyID + '" class="div_form_pie_extra"></div>';
                            newdiv += '</div>';
                            newdiv += '</div>';
                            newdiv += '<div id="chart_id_' + DyID + '" class="panel-body" style="margin: 0 !important;"></div>';
                            newdiv += '<div id="table_id_' + DyID + '" class="panel-body" style="overflow:auto;max-height:200px;margin: 0 !important;display:none"></div>';
                            newdiv += '<div id="email_id_' + DyID + '" class="panel-body" style="width:98%; padding-bottom:5px; font-size:10pt; display:none"><table style="width:100%"><td style="width:15px">Email </td><td style="padding:0 5px"><input type="text" id="txtemail' + DyID + '" class="form-control" style="height:25px; border:1px solid #ccc" /></td><td><a class="button button-fill button-raised" style="height:25px; line-height:25px; min-width:initial" onclick="btnsubmitemail_pre(\'' + DyID + '\',\'' + titel_for_custmize_chart + '\')">Send</a></td></table><input id="hdn_chart_' + DyID + '" type="hidden" /><input id="hdn_table_' + DyID + '" type="hidden" /></div>';
                            newdiv += '</div></div>';

                            $("#Chart_Row_Col_" + (DyID - 1)).append(newdiv);
                            //var titel_for_custmize_chart = msg[m]["chart_label"];
                            if (msg[m]["chart_type"] == "1") {
                                var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                                var chart = new google.visualization.PieChart(document.getElementById("chart_id_" + DyID));
                                chart.draw(dt1, {
                                    title: titel_for_custmize_chart,
                                    pieHole: 0.3,
                                });
                            } else if (msg[m]["chart_type"] == "2") {
                                var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                                var chart = new google.visualization.ColumnChart(document.getElementById("chart_id_" + DyID));
                                chart.draw(dt1, {
                                    title: titel_for_custmize_chart,
                                    chartArea: { width: '60%', height: '65%' },
                                    isStacked: true,
                                });
                            } else if (msg[m]["chart_type"] == "3") {
                                $("#div_table_view_" + DyID).hide();
                                $("#div_max_map_info_extra_" + DyID).hide();
                                var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                                var chart = new google.visualization.AnnotationChart(document.getElementById("chart_id_" + DyID));
                                chart.draw(dt1, {
                                    title: titel_for_custmize_chart,
                                    displayAnnotations: true

                                });
                            } else if (msg[m]["chart_type"] == "4") {
                                $("#div_table_view_" + DyID).hide();
                                $("#div_max_map_info_extra_" + DyID).hide();
                                var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                                var chart = new google.visualization.AnnotationChart(document.getElementById("chart_id_" + DyID));
                                chart.draw(dt1, {
                                    title: titel_for_custmize_chart,
                                    displayAnnotations: true

                                });
                            }
                        }//end
                    }
                    //DyID++;
                }

            }

        } else {
            alert1("Array is Blank");
        }

        enable_back_button();
    },
    /// Chart Draw End ////
    ColwiseChart: function () {
        var width_total = [];
        if (typeof this.ChartData_Array != "undefined" && this.ChartData_Array != null && this.ChartData_Array.length > 0) {
            var msg = this.ChartData_Array;
            // var msgleng = this.ChartData_Array.length % 2;
            // var dynamicID = this.DyID + parseInt(this.ChartData_Array.length);
            // if (msgleng == 0) {

            for (var m = 0; m < msg.length; m++) {
                DyID++;
                var titel_for_custmize_chart = msg[m]["chart_label"];
                var chart_id_custom = msg[m]["chart_id"];
                var chart_options = msg[m]["chart_options"];
                var chart_data = "";
                try {
                    chart_data = eval('(' + msg[m]["chart_json"] + ')');
                } catch (e) {
                    chart_data = msg[m]["chart_json"];
                }

                var chart_css = msg[m]["chart_css"];
                var chart_css_json = JSON.stringify(chart_css);
                var chart_width = chart_css[0]["width"];

                var chart_email = chart_css[0]["email"];
                var chart_filter = chart_css[0]["filter"];
                var chart_email_str = '';
                if (chart_email == '0') {
                    chart_email_str = 'display: none;';
                }
                else {
                    chart_email_count++;
                }

                var chart_filter_str = '';
                if (chart_filter == '0') {
                    chart_filter_str = 'display: none;';
                }

                var width_main = 0;
                if (m === 0) {
                    width_total.push(chart_width);
                } else {
                    width_main = parseInt(width_total[m - 1]) + parseInt(chart_width);
                }


                var chart_height = chart_css[0]["height"];
                var newdiv = "";
                if (width_main === 12) {

                    newdiv += '<div  class="col-lg-' + chart_width + '" >';
                    if (chart_css[0]["height"] === "") {
                        newdiv += '<div class="panel-primary" data-jsonp=\'' + JSON.stringify(msg[m]) + '\' style="height: auto !important;min-height: 273px" id="div_barchart_extra_' + DyID + '">';
                    } else {
                        newdiv += '<div class="panel-primary" data-jsonp=\'' + JSON.stringify(msg[m]) + '\' id="div_barchart_extra_' + DyID + '">';
                    }
                    newdiv += '<div class="panel_heading navbar">' + titel_for_custmize_chart;

                    // newdiv += '<div id="div_table_view_' + DyID + '" style="position: absolute;top: 0%;right: 15%;padding: 10px 15px;width: 10%;cursor: pointer;" onclick="table_view_function(div_table_view_' + DyID + ',table_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')"><input type="hidden" class="table_new" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" class="fa fa-table fa-fw fa-2x"></i></div>';
                    // newdiv += '<div id="div_max_map_info_extra_' + DyID + '" style="position: absolute; width: 45px; height: 43px; background-color: White; border-radius: 5px; top: 0%; right: 3%; padding: 4px 7px; border: 1px solid #ccc; transition: 1s; overflow: hidden">';
                    if (chart_width == "6" || chart_width == "7") {
                        newdiv += '<div id="div_excel_table_view_' + DyID + '" style="position: absolute;top: 1.9%;right: 2%;padding: 0px 0px;width: 3%;cursor: pointer;" onclick="table_excel_function(chart_id_' + DyID + ')"><input type="hidden" class="excel_new" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" class="fa fa-file-excel-o fa-fw fa-2x" style="color:white !important"></i></div>';
                        newdiv += '<div id="div_mail_view_' + DyID + '" style="position: absolute;top: 0;right: 20%;padding: 0px 15px;cursor: pointer; ' + chart_email_str + '" ><input type="hidden" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="mail_' + DyID + '" onclick="mail_view_function(div_mail_view_' + DyID + ',table_id_' + DyID + ',email_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-envelope fa-fw fa-2x"></i></div>';
                        newdiv += '<div id="div_table_view_' + DyID + '" class="div_table_view"><input type="hidden" class="table_new" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" onclick="table_view_function(div_table_view_' + DyID + ',table_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-table fa-fw fa-2x"></i></div>';
                        newdiv += '<div id="div_max_map_info_extra_' + DyID + '" class="div_max_map_info_extra" style="' + chart_filter_str + '">';
                    } else if (chart_width == "12") {
                        newdiv += '<div id="div_excel_table_view_' + DyID + '" style="position: absolute;top: 1.9%;right: 2%;padding: 0px 0px;width: 3%;cursor: pointer;" onclick="table_excel_function(chart_id_' + DyID + ')"><input type="hidden" class="excel_new" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" class="fa fa-file-excel-o fa-fw fa-2x" style="color:white !important"></i></div>';
                        newdiv += '<div id="div_mail_view_' + DyID + '" style="position: absolute;top: 0;right: 20%;padding: 0px 15px;cursor: pointer; ' + chart_email_str + '" ><input type="hidden" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="mail_' + DyID + '" onclick="mail_view_function(div_mail_view_' + DyID + ',table_id_' + DyID + ',email_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-envelope fa-fw fa-2x"></i></div>';
                        newdiv += '<div id="div_table_view_' + DyID + '" class="div_table_view"><input type="hidden" class="table_new" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" onclick="table_view_function(div_table_view_' + DyID + ',table_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-table fa-fw fa-2x"></i></div>';
                        newdiv += '<div id="div_max_map_info_extra_' + DyID + '" class="div_max_map_info_extra" style="' + chart_filter_str + '">';

                    } else {
                        newdiv += '<div id="div_excel_table_view_' + DyID + '" style="position: absolute;top: 1.9%;right: 2%;padding: 0px 0px;width: 3%;cursor: pointer;" onclick="table_excel_function(chart_id_' + DyID + ')"><input type="hidden" class="excel_new" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" class="fa fa-file-excel-o fa-fw fa-2x" style="color:white !important"></i></div>';
                        newdiv += '<div id="div_mail_view_' + DyID + '" style="position: absolute;top: 0;right: 20%;padding: 0px 15px;cursor: pointer; ' + chart_email_str + '" ><input type="hidden" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="mail_' + DyID + '" onclick="mail_view_function(div_mail_view_' + DyID + ',table_id_' + DyID + ',email_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-envelope fa-fw fa-2x"></i></div>';
                        newdiv += '<div id="div_table_view_' + DyID + '"class="div_table_view"><input type="hidden" class="table_new" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" onclick="table_view_function(div_table_view_' + DyID + ',table_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-table fa-fw fa-2x"></i></div>';
                        newdiv += '<div id="div_max_map_info_extra_' + DyID + '" class="div_max_map_info_extra" style="' + chart_filter_str + '">';

                    }

                    newdiv += '<input type="hidden" name="0" value=\'' + JSON.stringify(msg[m]["checksheet_json"]) + '\'/>';
                    // newdiv += '<img id="img_max_map_info_extra_' + DyID + '" src="images/info_gear.png" class="info_gear" name="0" onclick="show_max_map_details_dynamic_chart(img_max_map_info_extra_' + DyID + ',div_max_map_info_extra_' + DyID + ',' + msg[m]["chart_type"] + ',div_form_pie_extra_' + DyID + ',chart_id_' + DyID + ',div_table_view_' + DyID + ',table_id_' + DyID + ',' + chart_id_custom + ',hidden_option_id_' + DyID + ')" />';
                    newdiv += '<i class="fa fa-filter" id="img_max_map_info_extra_' + DyID + '" name="0" onclick="show_max_map_details_dynamic_chart(img_max_map_info_extra_' + DyID + ',div_max_map_info_extra_' + DyID + ',' + msg[m]["chart_type"] + ',div_form_pie_extra_' + DyID + ',chart_id_' + DyID + ',div_table_view_' + DyID + ',table_id_' + DyID + ',' + chart_id_custom + ',hidden_option_id_' + DyID + ')"></i>';
                    newdiv += '<div id="div_form_pie_extra_' + DyID + '" class="div_form_pie_extra"></div>';
                    newdiv += '</div>';
                    newdiv += '</div>';
                    newdiv += '<div><input type="hidden" id="hidden_option_id_' + DyID + '" class="hidden_option" value=\'' + JSON.stringify(msg[m]["chart_options"]) + '\' /></div>';
                    newdiv += '<div id="chart_id_' + DyID + '" class="panel-body" style="margin: 0 !important;"></div>';
                    newdiv += '<div id="table_id_' + DyID + '" class="panel-body" style="max-height:200px;overflow:auto;margin: 0 !important;display:none"></div>';
                    newdiv += '<div id="email_id_' + DyID + '" class="panel-body" style="width:98%; padding-bottom:5px; font-size:10pt; display:none"><table style="width:100%"><td style="width:15px">Email </td><td style="padding:0 5px"><input type="text" id="txtemail' + DyID + '" class="form-control" style="height:25px; border:1px solid #ccc" /></td><td><a class="button button-fill button-raised" style="height:25px; line-height:25px; min-width:initial" onclick="btnsubmitemail_pre(\'' + DyID + '\',\'' + titel_for_custmize_chart + '\')">Send</a></td></table><input id="hdn_chart_' + DyID + '" type="hidden" /><input id="hdn_table_' + DyID + '" type="hidden" /></div>';
                    newdiv += '</div></div></div>';
                    // $("#dynamic_chart").append(newdiv);
                    $('#Chart_Row_Col_' + (DyID - 1)).append(newdiv);

                }
                else {
                    newdiv += '<div class="chart_main"  id="Chart_Row_Col_' + DyID + '" data-css=\'' + chart_css_json + '\'>';
                    newdiv += '<div class="col-lg-' + chart_width + '" >';
                    //newdiv += '<div class="panel panel-primary" style="height: auto !important;min-height: 273px" id="div_barchart_extra_' + DyID + '">';
                    if (chart_css[0]["height"] === "") {
                        newdiv += '<div class="panel-primary" data-jsonp=\'' + JSON.stringify(msg[m]) + '\' style="height: auto !important;min-height: 280px" id="div_barchart_extra_' + DyID + '">';
                    } else {
                        newdiv += '<div class="panel-primary" data-jsonp=\'' + JSON.stringify(msg[m]) + '\' id="div_barchart_extra_' + DyID + '">';
                    }
                    newdiv += '<div class="panel_heading navbar">' + titel_for_custmize_chart;
                    if (chart_width == "6" || chart_width == "7") {
                        newdiv += '<div id="div_excel_table_view_' + DyID + '" style="position: absolute;top: 1.9%;right: 2%;padding: 0px 0px;width: 3%;cursor: pointer;" onclick="table_excel_function(chart_id_' + DyID + ')"><input type="hidden" class="excel_new" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" class="fa fa-file-excel-o fa-fw fa-2x" style="color:white !important"></i></div>';
                        newdiv += '<div id="div_mail_view_' + DyID + '" style="position: absolute;top: 0;right: 20%;padding: 0px 15px;cursor: pointer; ' + chart_email_str + '" ><input type="hidden" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="mail_' + DyID + '" onclick="mail_view_function(div_mail_view_' + DyID + ',table_id_' + DyID + ',email_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-envelope fa-fw fa-2x"></i></div>';
                        newdiv += '<div id="div_table_view_' + DyID + '"class="div_table_view"><input type="hidden" class="table_new" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" onclick="table_view_function(div_table_view_' + DyID + ',table_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-table fa-fw fa-2x"></i></div>';
                        newdiv += '<div id="div_max_map_info_extra_' + DyID + '" class="div_max_map_info_extra" style="' + chart_filter_str + '">';
                    } else if (chart_width == "12") {
                        //
                        newdiv += '<div id="div_excel_table_view_' + DyID + '" style="position: absolute;top: 1.9%; right: 7%; padding: 0px 0px;width: 3%;cursor: pointer;" onclick="table_excel_function(chart_id_' + DyID + ')"><input type="hidden" class="excel_new" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" class="fa fa-file-excel-o fa-fw fa-2x" style="color:white !important; display:none"></i></div>';
                        newdiv += '<div id="div_mail_view_' + DyID + '" style="position: absolute;top: 0;right: 20%;padding: 0px 15px;cursor: pointer; ' + chart_email_str + '" ><input type="hidden" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="mail_' + DyID + '" onclick="mail_view_function(div_mail_view_' + DyID + ',table_id_' + DyID + ',email_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-envelope fa-fw fa-2x"></i></div>';
                        newdiv += '<div id="div_table_view_' + DyID + '"class="div_table_view"><input type="hidden" class="table_new" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" onclick="table_view_function(div_table_view_' + DyID + ',table_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-table fa-fw fa-2x"></i></div>';
                        newdiv += '<div id="div_max_map_info_extra_' + DyID + '" class="div_max_map_info_extra" style="' + chart_filter_str + '">';

                    } else {
                        newdiv += '<div id="div_excel_table_view_' + DyID + '" style="position: absolute;top: 1.9%;right: 2%;padding: 0px 0px;width: 3%;cursor: pointer;" onclick="table_excel_function(chart_id_' + DyID + ')"><input type="hidden" class="excel_new" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" class="fa fa-file-excel-o fa-fw fa-2x" style="color:white !important"></i></div>';
                        newdiv += '<div id="div_mail_view_' + DyID + '" style="position: absolute;top: 0;right: 20%;padding: 0px 15px;cursor: pointer; ' + chart_email_str + '" ><input type="hidden" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="mail_' + DyID + '" onclick="mail_view_function(div_mail_view_' + DyID + ',table_id_' + DyID + ',email_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-envelope fa-fw fa-2x"></i></div>';
                        newdiv += '<div id="div_table_view_' + DyID + '"class="div_table_view"><input type="hidden" class="table_new" value=\'' + encodeURIComponent(JSON.stringify(chart_data)) + '\' name="0" /><i id="icon_' + DyID + '" onclick="table_view_function(div_table_view_' + DyID + ',table_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')" class="fa fa-table fa-fw fa-2x"></i></div>';
                        newdiv += '<div id="div_max_map_info_extra_' + DyID + '" class="div_max_map_info_extra" style="' + chart_filter_str + '">';

                    }
                    newdiv += '<input type="hidden" name="0" value=\'' + JSON.stringify(msg[m]["checksheet_json"]) + '\'/>';
                    // newdiv += '<img id="img_max_map_info_extra_' + DyID + '" src="images/info_gear.png" class="info_gear" name="0" onclick="show_max_map_details_dynamic_chart(img_max_map_info_extra_' + DyID + ',div_max_map_info_extra_' + DyID + ',' + msg[m]["chart_type"] + ',div_form_pie_extra_' + DyID + ',chart_id_' + DyID + ',div_table_view_' + DyID + ',table_id_' + DyID + ',' + chart_id_custom + ',hidden_option_id_' + DyID + ')" />';
                    newdiv += '<i class="fa fa-filter" id="img_max_map_info_extra_' + DyID + '" name="0" onclick="show_max_map_details_dynamic_chart(img_max_map_info_extra_' + DyID + ',div_max_map_info_extra_' + DyID + ',' + msg[m]["chart_type"] + ',div_form_pie_extra_' + DyID + ',chart_id_' + DyID + ',div_table_view_' + DyID + ',table_id_' + DyID + ',' + chart_id_custom + ',hidden_option_id_' + DyID + ')"></i>';
                    newdiv += '<div id="div_form_pie_extra_' + DyID + '" class="div_form_pie_extra"></div>';
                    newdiv += '</div>';
                    newdiv += '</div>';
                    newdiv += '<div><input type="hidden" id="hidden_option_id_' + DyID + '" class="hidden_option" value=\'' + JSON.stringify(msg[m]["chart_options"]) + '\' /></div>';
                    newdiv += '<div id="chart_id_' + DyID + '" class="panel-body" style="margin: 0 !important"></div>';
                    if (chart_width == "12") {
                        // long chart
                        newdiv += '<div id="table_id_' + DyID + '" class="panel-body" style="max-height:200px;overflow:auto !important;display:none"></div>';
                    }
                    else {
                        newdiv += '<div id="table_id_' + DyID + '" class="panel-body" style="max-height:200px;overflow:auto;margin: 0 !important;display:none"></div>';
                    }
                    newdiv += '<div id="email_id_' + DyID + '" class="panel-body" style="width:98%; padding-bottom:5px; font-size:10pt; display:none"><table style="width:100%"><td style="width:15px">Email </td><td style="padding:0 5px"><input type="text" id="txtemail' + DyID + '" class="form-control" style="height:25px; border:1px solid #ccc" /></td><td><a class="button button-fill button-raised" style="height:25px; line-height:25px; min-width:initial" onclick="btnsubmitemail_pre(\'' + DyID + '\',\'' + titel_for_custmize_chart + '\')">Send</a></td></table><input id="hdn_chart_' + DyID + '" type="hidden" /><input id="hdn_table_' + DyID + '" type="hidden" /></div>';
                    newdiv += '</div></div></div>';
                    $("#dynamic_chart").append(newdiv);
                }

                //chart_options[0].height = '400'; 
                //chart_options[0].hAxis['slantedText'] = 'true';
                //chart_options[0].hAxis['slantedTextAngle'] = 90;

                if (msg[m]["chart_type"] == "1") {
                    $("#div_excel_table_view_" + DyID).remove();
                    var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                    var chart = new google.visualization.PieChart(document.getElementById("chart_id_" + DyID));

                    chart.draw(dt1, chart_options[0]);
                } else if (msg[m]["chart_type"] == "2") {
                    $("#div_excel_table_view_" + DyID).remove();
                    var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                    var chart = new google.visualization.ColumnChart(document.getElementById("chart_id_" + DyID));
                    chart.draw(dt1, chart_options[0]);
                } else if (msg[m]["chart_type"] == "3") {
                    $("#div_excel_table_view_" + DyID).remove();
                    $("#div_table_view_" + DyID).remove();
                    $("#div_max_map_info_extra_" + DyID).remove();
                    var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                    var chart = new google.visualization.AnnotationChart(document.getElementById("chart_id_" + DyID));
                    chart.draw(dt1, chart_options[0]);
                }
                else if (msg[m]["chart_type"] == "4") {
                    $("#div_excel_table_view_" + DyID).remove();
                    $("#div_table_view_" + DyID).remove();
                    $("#div_max_map_info_extra_" + DyID).remove();
                    var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                    var chart = new google.visualization.Table(document.getElementById("chart_id_" + DyID));
                    chart.draw(dt1, chart_options[0]);

                }
                else if (msg[m]["chart_type"] == "5") {
                    $("#div_table_view_" + DyID).remove();
                    //$("#div_max_map_info_extra_" + DyID).remove();

                    var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                    var chart = new google.visualization.Table(document.getElementById("chart_id_" + DyID));
                    chart.draw(dt1, chart_options[0]);

                }
            }

            //alert1("chart_email: " + chart_email);
            if (chart_email != 0 && chart_email_count > 1) {
                $("#btn_sendAll").show();
            }

            var main_hieght = $('html, body').height();
            var find_row = $("#dynamic_chart").find(".chart_main");
            if (find_row.length > 0) {
                for (var r = 0; r < find_row.length; r++) {

                    //// collapsible chart
                    //var find_col = $(find_row[r]).find(".panel-primary");
                    //for (var c = 0; c < find_col.length; c++) {
                    //    $(find_col[c]).attr('ondblclick', 'toggle_chart_divs(this)');

                    //    var obj = find_col[c];
                    //    var heading_div = $(obj).find(".panel_heading");
                    //    $(heading_div[0]).addClass('fa fa-expand');

                    //    var primary_div_id = $(obj).attr('id');
                    //    var body_divs = $(obj).find(".panel-body");
                    //    for (d = 0; d < body_divs.length; d++) {
                    //        var bdy_div = $(body_divs[d]).attr('id');
                    //        $('#' + bdy_div + '').addClass('noVisible');
                    //        $('#' + primary_div_id + '').addClass('noHeight');


                    //        $('#' + bdy_div + '').css('border', '2px solid red');
                    //        $('#' + primary_div_id + '').css('border', '2px solid green');
                    //    }
                    //}
                    //////

                    var css_js = find_row[r].dataset.css;
                    var css_parse = JSON.parse(css_js);
                    var height_cs = css_parse[0]["height"];
                    if (height_cs != "") {
                        var aply_h = (parseInt(main_hieght) * parseInt(height_cs)) / 100;
                        var plus_h = (parseInt(aply_h) + 100);
                        var find_col = $(find_row[r]).find(".panel-primary");
                        for (var c = 0; c < find_col.length; c++) {
                            // $(find_col[c]).css("height", "auto");
                            // $(find_col[c]).css("min-height", parseInt(aply_h));
                            if (plus_h != 507) {
                                $(find_col[c]).attr('style', 'max-height: ' + plus_h + 'px !important;height:auto !important');
                            }
                            var find_body = $(find_col[c]).find(".panel-body");
                            var panal_bodyid = find_body[0];
                            var main_json_draw = find_col[c].dataset.jsonp;
                            var parse_json = eval('(' + main_json_draw + ')');
                            var chart_type = parse_json["chart_type"];
                            var chart_option_actual = parse_json["chart_options"];

                            if (chart_type != '5') {
                                chart_option_actual[0]["height"] = parseInt(aply_h);
                            }

                            var chart_option_tc = JSON.stringify(chart_option_actual);
                            var hidden_op = $(find_row[r]).find(".hidden_option");
                            $(hidden_op[0]).val(chart_option_tc);
                            // var chart_id_custom = parse_json["chart_id"];
                            var chart_data = "";
                            try {
                                chart_data = eval('(' + parse_json["chart_json"] + ')');
                            } catch (e) {
                                chart_data = parse_json["chart_json"];
                            }
                            if (chart_type == "1") {
                                $("#div_excel_table_view_" + DyID).remove();
                                var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                                var chart = new google.visualization.PieChart(panal_bodyid);

                                chart.draw(dt1, chart_option_actual[0]);
                            } else if (chart_type == "2") {
                                $("#div_excel_table_view_" + DyID).remove();
                                var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                                var chart = new google.visualization.ColumnChart(panal_bodyid);
                                chart.draw(dt1, chart_option_actual[0]);
                            } else if (chart_type == "3") {
                                $("#div_excel_table_view_" + DyID).remove();
                                // $("#div_table_view_" + DyID).hide();
                                // $("#div_max_map_info_extra_" + DyID).hide();
                                var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                                var chart = new google.visualization.AnnotationChart(panal_bodyid);
                                chart.draw(dt1, chart_option_actual[0]);
                            } else if (chart_type == "4") {
                                //$("#div_excel_table_view_" + DyID).hide();
                                $("#div_table_view_" + DyID).hide();
                                $("#div_max_map_info_extra_" + DyID).hide();
                                var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                                var chart = new google.visualization.Table(panal_bodyid);
                                chart.draw(dt1, chart_option_actual[0]);
                                // table_view_function(div_table_view_' + DyID + ',table_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')
                            } else if (chart_type == "5") {
                                $("#div_table_view_" + DyID).hide();
                                //$("#div_max_map_info_extra_" + DyID).hide();
                                var dt1 = new google.visualization.DataTable(chart_data[0], 0.6);
                                var chart = new google.visualization.Table(panal_bodyid);
                                chart.draw(dt1, chart_option_actual[0]);
                                // table_view_function(div_table_view_' + DyID + ',table_id_' + DyID + ',chart_id_' + DyID + ',icon_' + DyID + ',' + msg[m]["chart_type"] + ')
                            }

                        }

                    }
                }
            }

            loading_hide();
            hide_chart_after_bind();
        } else {
            alert1("Array is Blank");
        }

        enable_back_button();
    }

}

var actual_hieght = 0;

function show_max_map_details_dynamic_chart(imgtag, divtag, charttype, divformtag, chart_maindiv_draw, tbl_main_div, tbl_draw, chart_id_, hd_option) {
    //$('body').css('overflow', 'hidden').on('touchmove', function (e) {
    //    e.preventDefault();
    //});

    myApp.popup('.popup-filter_info');

    this.img_tag_id = imgtag;
    this.div_tag_id = divtag;
    this.divformtag_id = divformtag;
    var main_div_id = chart_maindiv_draw;

    //document.getElementById(divformtag.id).scrollIntoView();

    // alert1("div:" + document.getElementById(img_tag_id.id).outerHTML);

    var find_hidden_val = $(divtag).find("input[type=hidden]");
    var hd_val = $(find_hidden_val[0]).val();
    var hd_name = find_hidden_val[0].name;
    if (hd_val != "") {
        var json_main_p = JSON.parse(hd_val)
        // var json_p_hd = JSON.parse(json_main_p);
        var json_p_hd = json_main_p;
        // var status = json_p_hd[0].status;
        if (json_p_hd[0]["Filter_button"]) {
            var myArray = json_p_hd[0]["step_data"];
            var check_type = myArray[0].Checksheet_id;
            var data = myArray[0].step[0].data;
            var isOpen = $(imgtag).attr("name");
            var flag_chk = 0;
            var flag_chksht = 0;

            isOpen = "0";   // static 0 because closing popup using close button 
            if (isOpen == "0") {
                // $(divtag).scroll(100);
                //$('body').css('overflow', 'hidden').on('touchmove', function (e) {
                //    e.preventDefault();
                //});
                localStorage.setItem("check_type", check_type);
                //console.log("1st check_type = " + check_type);
                localStorage.setItem("checksheet_data", JSON.stringify(data));
                //console.log("1st data = " + JSON.stringify(data));
                localStorage.setItem("checksheet_AllData", JSON.stringify(json_p_hd));
                //console.log("1st checksheet_AllData = " + JSON.stringify(myArray));
                localStorage.setItem("checksheet_AllData_fix", JSON.stringify(json_p_hd));
                //console.log("1st checksheet_AllData_fix = " + JSON.stringify(myArray));
                localStorage.setItem("checksheet_type_filter", '9');
                storage.setItem('checksheet_type_filter', JSON.stringify('9'));

                //$(imgtag).css("transform", "rotate(90deg)");
                $(divtag).css("width", "450px");
                $(divtag).css("height", "395px");
                $(divtag).css("max-height", "395px");
                $(divtag).css("overflow-y", "auto");
                $(divtag).css("z-index", "99");
                $(imgtag).attr("name", "1");
                $("#filter_data").empty();
                //$("#filter_data").append(divformtag);
                //$(divformtag).append('<div id="container_div" style="color: black"></div>');
                //$(divformtag).append('<div style="text-align:center"><input type="button" class="btn btn-primary" id="btn_id" value="Submit" onclick="get_survey_json_Chart_Custmize(' + charttype + ',' + main_div_id.id + ',' + imgtag.id + ',' + divtag.id + ',' + divformtag.id + ',' + tbl_main_div.id + ',' + tbl_draw.id + ',' + chart_id_ + ',' + hd_option.id + ')"/></div>');
                $("#filter_data").append('<div id="container_div" style="color: black; padding:0px 10px"></div>');
                //  $("#filter_data").append('<div style="text-align:center"><input type="button" class="btn btn-primary" id="btn_id" value="Submit" onclick="get_survey_json_Chart_Custmize(' + charttype + ',' + main_div_id.id + ',' + imgtag.id + ',' + divtag.id + ',' + divformtag.id + ',' + tbl_main_div.id + ',' + tbl_draw.id + ',' + chart_id_ + ',' + hd_option.id + ')"/></div>');
                $("#filter_data").append('<div style="text-align:center"><a class="button button-fill button-raised form-btn" id="btn_id" onclick="get_survey_json_Chart_Custmize(' + charttype + ',' + main_div_id.id + ',' + imgtag.id + ',' + divtag.id + ',' + divformtag.id + ',' + tbl_main_div.id + ',' + tbl_draw.id + ',' + chart_id_ + ',' + hd_option.id + ')">Submit</a></div>');
                //$("#filter_data").append(imgtag);
                //$("#filter_data").append(divtag);
                storage.setItem('check_type', JSON.stringify(check_type));

                //if (hd_name == "0") {
                read_dynamic_checksheet("", check_type, "", data, "", 9, 0, "yes");
                //    find_hidden_val[0].name = 1;
                //} else {
                //    read_dynamic_surveydata_main("", check_type, "", data, "", 9, 0, "yes");
                //}

                $("#lbl_flow_path").css("display", "none");
                // $("#dynamic_chart").append('<div id="bacgr" style="position:fixed;background: rgba(0,0,0,.6); bottom: 0; color: #fff; left: 0; right: 0; top: 0; z-index: 10;"></div>');
                var elmnt = document.getElementById(divformtag.id);

                //var elmnt = document.getElementById("Chart_Row_Col_1");
                var y = elmnt.scrollHeight;
                var main_y = 0;
                var new_1 = getPos(divformtag);
                var pos_json = JSON.stringify(new_1);
                var axis_y = new_1["y"];
                if (axis_y < 460) {
                    main_y = axis_y / 2;
                } else {
                    main_y = (y * 2) + 100;
                }

                // alert1("Axis-y = " + axis_y);
                //alert1("Hieght = " + y);
                // alert1("ScrollTop = " + main_y);
                //$('html, body').css("overflow", "auto");
                var hight = $('html, body').height();
                actual_hieght = hight;
                //var main_hieght = parseInt(hight) + 50;
                //$('html, body').height(main_hieght);
                //setTimeout(function () {

                //    $('html, body').animate({
                //        scrollTop: main_y
                //    }, 300);
                //}, 10);



            } else {
                /////--------COLSE-------/////////////
                //$(imgtag).css("transform", "rotate(0deg)");
                $(divtag).css("width", "48px");
                $(divtag).css("height", "43px");
                $(divtag).css("z-index", "0");
                $(divtag).css("overflow-y", "hidden");
                $(imgtag).attr("name", "0");

                $("#bacgr").remove();
                $(divformtag).html("");
                //if (actual_hieght != 0) {
                //    $('html, body').height(actual_hieght - 50);
                //}
            }

        } else {
            alert1("Please Create Checksheet(" + json_p_hd[0]["step_data"][0]["Cust_form_Header"] + ") For Where Condtion...");
        }
    } else {
        alert1("This Chart Filter Checksheet Not Available");
    }

}

function getPos(el) {
    // yay readability
    for (var lx = 0, ly = 0;
        el != null;
        lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
    return { x: lx, y: ly };
}

function get_survey_json_Chart_Custmize(e_chart_type, main_chart_id, imgdiv, divtag, divformid, chart_id_m, tbldivmain, chart_id_new_, hd_op) {

    var arr = localStorage.getItem('checksheet_data');
    var AllData = localStorage.getItem('checksheet_AllData');
    var filter_button_Data = JSON.parse(localStorage.getItem('checksheet_AllData_fix'));
    localStorage.setItem('checksheet_AllData', JSON.stringify(filter_button_Data));
    validate_and_submit_surveydata(1, 9, JSON.parse(arr));
    if (Validation_True == 0) {
        var Filter_Jason;
        var Where_Jason;
        var Alldata_s = JSON.parse(AllData);
        Alldata_s[0]["step_data"][0]["step"][0]["data"] = ap_json[0]["data"];
        var Filter_Jason_string = JSON.stringify(ap_json);
        if (Filter_Jason_string != "[]" && Filter_Jason_string != undefined && Filter_Jason_string != "undefined") {
            loading();
            var Filter_Jason_eval = eval('(' + Filter_Jason_string + ')');

            var Filter_Jason_Filter_button = Filter_Jason_eval[0].data;

            var Where_Jason_eval = JSON.parse(localStorage.getItem("checksheet_AllData"));
            var Where_Jason_Filter_button = Where_Jason_eval[0].Filter_button[0];
            var push_array_t = Where_Jason_eval[0].Push_array;

            var Condition_Data_Str = encodeURIComponent(JSON.stringify(Where_Jason_Filter_button));
            var qs_array = pass_required_values_to_querystring_filter(Condition_Data_Str, push_array_t, ap_json[0].data);
            Condition_Data_Str = qs_array[0];
            var ref_valid = qs_array[1];

            if (ref_valid > 0) {
                loading_hide();
                alert1("Please enter required value!");
            }
            else {
                var Condition_Data = JSON.parse(Condition_Data_Str);

                var counter = 0;


                var Condition_Data_1_new = '[' + JSON.stringify(Condition_Data) + ']'

                var getdata = [];
                getdata.push({
                    "Chart_Type": e_chart_type,
                    "company_id": Session_companyid,
                    "Chart_Data": Condition_Data_1_new,
                    "company_feature_id": 0,
                    "feature_id": 0,
                    "role_id": Session_RoleID,
                    "where": Condition_Data_1_new,
                    "chart_id": chart_id_new_,
                    "checksheet_id": chart_checksheet_id
                });

                //alert1(Condition_Data_1_new);
                //alert1(JSON.stringify(getdata));

                var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Charts_20171219', JSON.stringify(getdata), function (inv) {
                    try {
                        var Pivot_Data = inv.responseText;
                        var JSOn_dp_old = JSON.parse(Pivot_Data);
                        if (JSOn_dp_old[0]["status"] == 1) {

                            var data = Data_Json[0].data;
                            if (data == "" || data == null || data == undefined) {
                                var msg = JSON.parse(JSOn_dp_old[0]["message"]);
                            }
                            else {
                                var msg = JSON.parse(data);
                            }

                            var hidde_cal = $(chart_id_m).find("input[type=hidden]");
                            $(hidde_cal[0]).val(encodeURIComponent(JSON.stringify(msg[0]["chart_json"])));
                            var hidden_opt = $(hd_op).val();
                            var hd_json = JSON.parse(hidden_opt);
                            //chart.draw(dt1, hidden_opt[0]);
                            if (msg[0]["chart_type"] == "1") {

                                var dt1 = new google.visualization.DataTable(msg[0]["chart_json"][0], 0.6);
                                var chart = new google.visualization.PieChart(document.getElementById(main_chart_id.id));
                                chart.draw(dt1, hd_json[0]);
                            } else if (msg[0]["chart_type"] == "2") {
                                var dt1 = new google.visualization.DataTable(msg[0]["chart_json"][0], 0.6);
                                var chart = new google.visualization.ColumnChart(document.getElementById(main_chart_id.id));
                                //var hidden_opt = JSON.parse(hd_op);
                                chart.draw(dt1, hd_json[0]);
                            } else if (msg[0]["chart_type"] == "5") {
                                var dt1 = new google.visualization.DataTable(msg[0]["chart_json"][0], 0.6);
                                var chart = new google.visualization.Table(document.getElementById(main_chart_id.id));
                                //var hidden_opt = JSON.parse(hd_op);
                                chart.draw(dt1, hd_json[0]);
                            }

                            var isOpen = $(imgdiv).attr("name");
                            if (isOpen != "0") {
                                //$(imgdiv).css("transform", "rotate(0deg)");
                                $(divtag).css("width", "48px");
                                $(divtag).css("height", "43px");
                                $(divtag).css("z-index", "0");
                                $(divtag).css("overflow-y", "hidden");
                                $(imgdiv).attr("name", "0");
                                $("#bacgr").remove();
                                $(divformid).html("");
                                //if (actual_hieght != 0) {
                                //    $('html, body').height(actual_hieght - 50);
                                //    //  $('html, body').css("overflow-y", "auto");
                                //}
                                var find_hidden_val = $(divtag).find("input[type=hidden]");
                                $(find_hidden_val[0]).val(JSON.stringify(Alldata_s));
                            }

                        } else {
                            alert1(JSOn_dp_old[0]["message"]);
                        }

                        loading_hide();
                        myApp.closeModal('.popup-filter_info');
                    } catch (e) {
                        alert1(e);
                        loading_hide();
                    }

                }, onfail);
                getdata.callOtherDomain();
            }
        }
        else {
            loading_hide();
        }
    }
}

function table_view_function(divid, tblid, chartdiv, iconid, charttype) {
    var divmain_h = $(divid).find("input[type=hidden]");
    var hidden_val = $(divmain_h[0]).val();
    var hidden_name = divmain_h[0].name;
    if (hidden_name == "0") {
        var tbl_decode = decodeURIComponent(hidden_val);
        var tbl_p = JSON.parse(tbl_decode);
        var cols = tbl_p[0]["cols"];
        var rows = tbl_p[0]["rows"];
        var newdiv = "<table class='table table-striped table-bordered table-hover' style='overflow:auto'><thead><tr>";

        if (charttype == 1) {
            var div_str = chartdiv.id;
            var start_no = div_str.lastIndexOf("_");
            var chart_no = parseInt(div_str.substring((start_no + 1), div_str.length));
            var sib_divs = $('#' + div_str + '').siblings('.panel_heading');
            var char_header = $.trim(sib_divs[0].innerText);
            if (chart_no > 3) {
                newdiv += "<tr><th>" + char_header + "</th><th>Total</th></tr>";
            }
            else {
                newdiv += "<tr><th>" + cols[0]["label"] + "</th><th>Total</th></tr>";
            }
            var sum = 0;
            for (var i = 0; i < rows.length; i++) {
                newdiv += "<tr><td>" + rows[i]["c"][0]["v"] + "</td><td>" + rows[i]["c"][1]["v"] + "</td></tr>";
                var value = parseInt(rows[i]["c"][1]["v"]);
                if (!isNaN(value)) {
                    sum = sum + value;
                }
            }
            newdiv += "<tr><th>Grand Total</th><th>" + sum + "</th></tr>";
        }
        else {
            for (var c = 0; c < cols.length; c++) {
                newdiv += "<th>" + cols[c]["label"] + "</th>";
            }
            newdiv += "<th>Total Count</th></thead></tr>";
            for (var r = 0; r < rows.length; r++) {
                newdiv += "<tr>";
                var row_c = rows[r]["c"];
                var number_count = 0;
                for (var rc = 0; rc < row_c.length; rc++) {
                    newdiv += "<td>" + row_c[rc]["v"] + "</td>";
                    if (!isNaN(row_c[rc]["v"])) {
                        number_count += parseInt(row_c[rc]["v"]);
                    }
                }
                newdiv += "<td>" + number_count + "</td></tr>";
            }
        }

        newdiv += "</table>";
        $(tblid).append(newdiv);
        $(chartdiv).hide();
        $(tblid).show();
        $(iconid).removeClass("fa fa-table fa-fw fa-2x");
        if (charttype == "1") {
            $(iconid).addClass("fa fa-pie-chart fa-fw fa-2x");
        } else {
            $(iconid).addClass("fa fa-bar-chart fa-fw fa-2x");
        }
        divmain_h[0].name = "1";
    } else {
        $(tblid).html("");
        $(chartdiv).show();
        $(tblid).hide();
        if (charttype == "1") {
            $(iconid).removeClass("fa fa-pie-chart fa-fw fa-2x");

        } else {
            $(iconid).removeClass("fa fa-bar-chart fa-fw fa-2x");
        }

        $(iconid).addClass("fa fa-table fa-fw fa-2x");
        divmain_h[0].name = "0";
    }
}

function table_excel_function(chartdiv) {
    var find_tbl = $(chartdiv).find(".google-visualization-table-table");
    tableToExcel(find_tbl[0], "Excel");
}

var tableToExcel = (function () {
    var uri = 'data:application/vnd.ms-excel;base64,'
        , template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><meta http-equiv="content-type" content="text/plain; charset=UTF-8"/></head><body><table>{table}</table></body></html>'
        , base64 = function (s) { return window.btoa(unescape(encodeURIComponent(s))) }
        , format = function (s, c) { return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; }) }
    return function (table, name) {
        if (!table.nodeType) table = document.getElementById(table)
        var ctx = { worksheet: name || 'Worksheet', table: table.innerHTML }
        window.location.href = uri + base64(format(template, ctx))
    }
})();


// ---- Email -------

var svg_tag;
var svg;
function mail_view_function(divid, tblid, emailid, chartdiv, iconid, charttype) {
    try {

        // new popup start
        if (all_mail_Array.length == 0) {
            myApp.popup('.popup-email');
        }
        var div_str = chartdiv.id;
        var sib_divs = $('#' + div_str + '').siblings('.panel-heading');
        if (sib_divs.length == 0) {
            sib_divs = $('#' + div_str + '').siblings('.panel_heading');
        }
        var char_header = $.trim(sib_divs[0].innerText);
        glob_chartname = char_header;
        // new popup end

        var table = tblid.id;
        var chart = chartdiv.id;
        var email = emailid.id;
        var check_id = $("#" + email).show();

        svg = chartdiv.id;
        var s = svg.split('_');
        var as = s.length - 1;
        var indexval = s[as];

        glob_indexval = indexval;   //new

        $("#hdn_chart_" + indexval).val("");
        $("#hdn_table_" + indexval).val("");
        svg_to_png(chart, indexval, divid, tblid, chartdiv, iconid, charttype);
    }
    catch (e) {
        alert1(e + '_mail_view_function()');
    }
}

// improved image quality
var canvas = document.createElement("canvas");
function svg_to_png(container, indexval_, divid, tblid, chartdiv, iconid, charttype) {
    try {
        if (charttype == "5") {
            //$(chartdiv).hide();
            var table = chartdiv.id;  //  
            ConvertToImage(table, indexval_, divid, tblid, chartdiv, iconid, charttype);
        }
        else {
            $(chartdiv).show();
            var wrapper = document.getElementById(container);
            var svg = wrapper.querySelector("svg");

            if (typeof window.XMLSerializer != "undefined") {
                var svgData = (new XMLSerializer()).serializeToString(svg);
            } else if (typeof svg.xml != "undefined") {
                var svgData = svg.xml;
            }
            var svgSize = svg.getBoundingClientRect();
            canvas.width = svgSize.width * 8;
            canvas.height = svgSize.height * 8;
            var ctx = canvas.getContext("2d");
            ctx.drawSvg(svgData, 0, 0, canvas.width, canvas.height);

            //var img = document.createElement("img");
            //img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))));
            //img.onload = function () {
            //  var imgsrc = canvas.toDataURL("image/png");
            $("#hdn_chart_" + indexval_).val(canvas.toDataURL("image/png"));
            //$(chartdiv).hide();
            wrapper = null, svg = null, svgData = null, svgSize = null, ctx = null;

            if ($('#' + tblid.id).css('display') == 'none') {
                table_view_function_new(divid, tblid, chartdiv, iconid, charttype);
            }
            else {
                $(chartdiv).hide();
                table_view_function_new(divid, tblid, chartdiv, iconid, charttype);
            }
            var table = tblid.id;
            ConvertToImage(table, indexval_, divid, tblid, chartdiv, iconid, charttype);
        }
        //};
    }
    catch (e) {
        alert1(e + '_svg_to_png()');
    }
}

function table_view_function_new(divid, tblid, chartdiv, iconid, charttype) {
    var divmain_h = $(divid).find("input[type=hidden]");
    var hidden_val = $(divmain_h[0]).val();
    var hidden_name = divmain_h[0].name;
    if (hidden_name == "0") {
        var idof_nxt = divid.nextSibling.id;
        var sa = $("#" + idof_nxt).find("img");
        var saas = $(sa).attr("id");
        $("#" + saas).css("pointer-events", "none");
        $("#" + saas).css("opacity", "0.5");

        var idof_pre = divid.id;
        var sa1 = $("#" + idof_pre).find("i");
        var saas1 = $(sa1).attr("id");
        $("#" + saas1).css("pointer-events", "none");
        $("#" + saas1).css("opacity", "0.5");

        var tbl_decode = decodeURIComponent(hidden_val);
        var tbl_p = JSON.parse(tbl_decode);
        var cols = tbl_p[0]["cols"];
        var rows = tbl_p[0]["rows"];
        var newdiv = "<table class='table table-striped table-bordered table-hover' style='overflow:auto'><thead><tr>";
        if (charttype == 1) {
            var div_str = chartdiv.id;
            var start_no = div_str.lastIndexOf("_");
            var chart_no = parseInt(div_str.substring((start_no + 1), div_str.length));
            var sib_divs = $('#' + div_str + '').siblings('.panel-heading');
            if (sib_divs.length == 0) {
                sib_divs = $('#' + div_str + '').siblings('.panel_heading');
            }
            var char_header = $.trim(sib_divs[0].innerText);
            if (chart_no > 3) {
                newdiv += "<tr><th>" + char_header + "</th><th>Total</th></tr>";
            }
            else {
                newdiv += "<tr><th>" + cols[0]["label"] + "</th><th>Total</th></tr>";
            }
            var sum = 0;
            for (var i = 0; i < rows.length; i++) {
                newdiv += "<tr><td>" + rows[i]["c"][0]["v"] + "</td><td>" + rows[i]["c"][1]["v"] + "</td></tr>";
                var value = parseInt(rows[i]["c"][1]["v"]);
                if (!isNaN(value)) {
                    sum = sum + value;
                }
            }
            newdiv += "<tr><th>Grand Total</th><th>" + sum + "</th></tr>";
        }
        else {

            for (var c = 0; c < cols.length; c++) {
                newdiv += "<th>" + cols[c]["label"] + "</th>";
            }
            newdiv += "<th>Total Count</th></thead></tr>";
            for (var r = 0; r < rows.length; r++) {
                newdiv += "<tr>";
                var row_c = rows[r]["c"];
                var number_count = 0;
                for (var rc = 0; rc < row_c.length; rc++) {
                    newdiv += "<td>" + row_c[rc]["v"] + "</td>";
                    if (!isNaN(row_c[rc]["v"])) {
                        number_count += parseInt(row_c[rc]["v"]);
                    }
                }
                newdiv += "<td>" + number_count + "</td></tr>";
            }
        }
        newdiv += "</table>";
        $(tblid).append(newdiv);
        $(tblid).show();
        $(iconid).removeClass("fa fa-table fa-fw fa-2x");
        if (charttype == "1") {
            $(iconid).addClass("fa fa-pie-chart fa-fw fa-2x");
        } else {
            $(iconid).addClass("fa fa-bar-chart fa-fw fa-2x");
        }
        divmain_h[0].name = "1";
    } else {
        var idof_nxt = divid.nextSibling.id;
        var sa = $("#" + idof_nxt).find("img");
        var saas = $(sa).attr("id");
        $("#" + saas).css("pointer-events", "");
        $("#" + saas).css("opacity", "");
        $(tblid).html("");
        $(tblid).hide();
        if (charttype == "1") {
            $(iconid).removeClass("fa fa-pie-chart fa-fw fa-2x");
        } else {
            $(iconid).removeClass("fa fa-bar-chart fa-fw fa-2x");
        }
        $(iconid).addClass("fa fa-table fa-fw fa-2x");
        divmain_h[0].name = "0";

        if (all_mail_Array.length != 0) {
            send_mail_repeat();   // send all mail code
        }
    }
}

function ConvertToImage(btnExport, indexval_, divid, tblid, chartdiv, iconid, charttype) {
    var wrapper = document.getElementById(btnExport);
    var table = wrapper.querySelector("table");
    var data;
    var aryAry;// = data;
    var tbl_id = wrapper.id;

    if (charttype == "5") { }
    else {
        $("#" + tbl_id).hide();
    }

    if (charttype == 1) {
        data = parseTable(table);
    } else {
        data = parseTable_(table);
        var thead = data[0]["thbody"];
        var tbody = data[0]["tbody"];
        var arr_dt = [];
        arr_dt.push(thead[0]);
        for (var i = 0, l = tbody.length; i < l; i++) {
            var n = 0, o = tbody[i];
            for (var q in o) {
                n++;
            }
            if (n > 0) {
                arr_dt.push(o);
            }
        }
        data = arr_dt;
    }

    var aryAry = data;//JSON.stringify(data);
    var a = aryAry, r = [];
    for (var i = 0, l = a.length; i < l; i++) {
        var n = 0, o = a[i];
        for (var q in o) {
            n++;
        }
        if (n > 0) {
            r.push(o);
        }
    }

    $("#hdn_table_" + indexval_).val(JSON.stringify(r));
    if (charttype == "5") { } else {
        table_view_function_new(divid, tblid, chartdiv, iconid, charttype);
    }
}

function btnsubmitemail_pre() {
    btnsubmitemail(glob_indexval, glob_chartname);
}

function btnsubmitemail(indexval, chartname) {
    loading();
    //var email = document.getElementById('txtemail');
    //var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    //if (!filter.test(email.value)) {
    //    alert1('Please enter valid email address !');
    //    email.focus;
    //    return false;
    //} else {
    var gbase64_val = $("#hdn_chart_" + indexval).val();
    var gbase64_tblval = $("#hdn_table_" + indexval).val();

    var mail_val = $("#txtemail").val();
    if (mail_val == '' || mail_val == null || mail_val == undefined) {
        alert1("Please enter email id !");
        loading_hide();
    }
    else {
        var circle_name = localStorage.getItem('chart_circle_name');
        var getdata = [];
        getdata.push({
            "mailid": mail_val,
            "chartimgbase64": gbase64_val,
            "tableimgbase64": gbase64_tblval,
            "chartname": chartname,
            "Circle": circle_name
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Create_Pdf_For_Chart_JS', JSON.stringify(getdata), img_base64_, onfail);
        getdata.callOtherDomain();
    }
    function img_base64_(ex) {
        try {
            var response = ex.responseText;
            var myArray = JSON.parse(response);
            var status = myArray[0].status;
            loading_hide();
            if (status == 1) {
                alert1("PDF has been sent to " + mail_val + " !");
            }
            else {
                var message = myArray[0].message;
                alert1(message);
            }
            //$("#txtemail").val('');
            myApp.closeModal('.popup-email');
        } catch (e) {
            alert1("Error");
        }
    }
    function onfail(e) {
        alert1(e);
        loading_hide();
    }
    //}
}









// mk
var all_mail_Array = [];
var curr_pdf_file;
var total_progress_cnt = 0;
var sent_all_mail_count = 0;
function send_all_mail() {
    try {
        loading();
        all_mail_Array = [];
        curr_pdf_file = '';
        var find_row = $("#dynamic_chart").find(".chart_main");
        var chart_collapse = localStorage.getItem('chart_collapse');
        if (find_row.length > 0) {
            for (var r = 0; r < find_row.length; r++) {
                var find_col = $(find_row[r]).find(".panel-primary");
                for (var c = 0; c < find_col.length; c++) {
                    var obj = find_col[c];
                    var heading_div = $(obj).find(".panel_heading");
                    var chart_header = $.trim(heading_div[0].innerText);

                    // show charts if close in page load
                    var primary_div_id = $(obj).attr('id');
                    var body_divs = $(obj).find(".panel-body");
                    for (d = 0; d < body_divs.length; d++) {
                        var bdy_div = $(body_divs[d]).attr('id');
                        var class_flag = $('#' + bdy_div + '').hasClass("noVisible");
                        if (class_flag == true) {
                            $('#' + bdy_div + '').removeClass('noVisible');
                            $('#' + primary_div_id + '').removeClass('noHeight');
                        }
                    }
                    ///////



                    all_mail_Array.push({
                        'indexval': r + 1,
                        'chartname': chart_header
                    });
                    break;
                }
            }
        }

        if (sent_all_mail_count == 0) {
            create_base64_repeat();
        }
        else {
            send_mail_repeat();
        }
        total_progress_cnt = all_mail_Array.length;
        myApp.setProgressbar('#chart_progressbar', 0);
        $('#lbl_mail_counter').text('0 %');
        $('#lbl_curr_total').text('0 / ' + total_progress_cnt);
    }
    catch (e) {
        alert1(e + '_send_all_mail()');
    }
}

function create_base64_repeat() {
    try {
        var indexval = all_mail_Array[0].indexval;
        var onclick_eve = $('#mail_' + indexval + '').attr('onclick');
        if (onclick_eve == '' || onclick_eve == null || onclick_eve == undefined) { }
        else {
            $('#mail_' + indexval + '').trigger('onclick');
        }
    }
    catch (e) {
        alert1(e + '_create_base64_repeat()');
    }
}

function send_mail_repeat() {
    try {
        var mail_val = $("#txtemailAll").val();
        if (mail_val == '' || mail_val == null || mail_val == undefined) {
            alert1("Please enter email id !");
            loading_hide();
        }
        else {
            var indexval = all_mail_Array[0].indexval;
            var chartname = all_mail_Array[0].chartname;
            var gbase64_val = $("#hdn_chart_" + indexval).val();
            var gbase64_tblval = $("#hdn_table_" + indexval).val();
            //$("#hdn_chart_" + indexval).val("");
            //$("#hdn_table_" + indexval).val("");

            // hide charts if open in page load
            var obj = $('#div_barchart_extra_' + indexval);
            var primary_div_id = $(obj).attr('id');
            var body_divs = $(obj).find(".panel-body");
            for (d = 0; d < body_divs.length; d++) {
                var bdy_div = $(body_divs[d]).attr('id');
                var class_flag = $('#' + bdy_div + '').hasClass("noVisible");
                if (class_flag == false) {
                    $('#' + bdy_div + '').addClass('noVisible');
                    $('#' + primary_div_id + '').addClass('noHeight');
                }
            }
            ///////

            if (all_mail_Array.length == 1) {
                var MailFlag = 1;
            }
            else {
                var MailFlag = 0;
            }

            var circle_name = localStorage.getItem('chart_circle_name');
            var user_id = JSON.parse(storage.getItem('user_id'));
            var getdata = [];
            getdata.push({
                "mailid": mail_val,
                "chartimgbase64": gbase64_val,
                "tableimgbase64": gbase64_tblval,
                "chartname": chartname,
                "MailFlag": MailFlag,
                "OldFileName": curr_pdf_file,
                "userid": user_id,
                "Circle": circle_name
            });

            var auth = [];
            auth.push({
                "username": username,
                "u_c": uniqcode
            });

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Create_Pdf_For_Chart_New_AllMail', JSON.stringify(getdata), onsuccess_send_mail_repeat, onfail_send_mail_repeat);
            getdata.callOtherDomain();
        }
    }
    catch (e) {
        alert1(e + '_send_mail_repeat()');
    }
}

function onsuccess_send_mail_repeat(ex) {
    try {
        var response = ex.responseText;
        var myArray = JSON.parse(response);
        var status = myArray[0].status;
        if (status == 1) {

            var data = myArray[0].data;
            if (data == "" || data == null || data == undefined) {
                var filename = myArray[0].message;
            }
            else {
                var filename = JSON.parse(data);
            }

            curr_pdf_file = filename;
            all_mail_Array.shift();
            if (F7_device == 'android') {
                myApp.closeModal('.popup-email');   // other popup
            }

            var curr_progress_cnt = total_progress_cnt - all_mail_Array.length;
            var progress = (100 / total_progress_cnt) * (curr_progress_cnt);
            myApp.setProgressbar('#chart_progressbar', progress);
            progress = Math.round(progress);
            if (progress > 100) {
                progress = 100;
            }
            $('#lbl_mail_counter').text(progress + ' %');
            $('#lbl_curr_total').text(curr_progress_cnt + ' / ' + total_progress_cnt);

            if (all_mail_Array.length > 0) {
                // create_base64_repeat();

                if (sent_all_mail_count == 0) {
                    create_base64_repeat();
                }
                else {
                    setTimeout(function () {
                        send_mail_repeat();
                    }, 300);
                }
            }
            else {
                loading_hide();
                $('#lbl_mail_counter').text('100 %');
                $('#lbl_curr_total').text(total_progress_cnt + ' / ' + total_progress_cnt);
                var mail_val = $("#txtemailAll").val();
                alert1("PDF has been sent to " + mail_val + " !");
                $('[id^=table_id_]').hide();
                $('[id^=chart_id_]').show();
                myApp.closeModal('.popup-emailAll');
                sent_all_mail_count++;
            }
        }
        else {
            loading_hide();
            var message = myArray[0].message;
            alert1(message);
        }
    } catch (e) {
        alert1(e + '_onsuccess_send_mail_repeat()');
    }
}
function onfail_send_mail_repeat(e) {
    alert1(e);
    loading_hide();
}




























































///unused code
//function svg_to_png_old(container, indexval_, divid, tblid, chartdiv, iconid, charttype) {
//    try {
//        //alert1("container");
//        var wrapper = document.getElementById(container);
//        //var svg = container;
//        var svg = wrapper.querySelector("svg");
//        //var svg = wrapper.querySelector("table");
//        if (typeof window.XMLSerializer != "undefined") {
//            var svgData = (new XMLSerializer()).serializeToString(svg);
//        } else if (typeof svg.xml != "undefined") {
//            var svgData = svg.xml;
//        }

//        var canvas = document.createElement("canvas");
//        var svgSize = svg.getBoundingClientRect();
//        canvas.width = svgSize.width;
//        canvas.height = svgSize.height;
//        var ctx = canvas.getContext("2d");

//        var img = document.createElement("img");
//        img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))));
//        //alert1("img load");

//        img.onload = function () {
//            // alert1("load");
//            ctx.drawImage(img, 0, 0);
//            var imgsrc = canvas.toDataURL("image/png");
//            var chk_val = $("#hdn_chart_" + indexval_).val(imgsrc);
//            //$("#" + container).hide();
//            //if (chk_val == "") {
//            table_view_function_new(divid, tblid, chartdiv, iconid, charttype);
//            var table = tblid.id;
//            ConvertToImage(table, indexval_, divid, tblid, chartdiv, iconid, charttype);
//            //}

//            //var a = document.createElement("a");
//            //a.download = container + ".png";
//            //a.href = imgsrc;
//            //a.click();
//        };
//    }
//    catch (e) {
//        alert1(e + "_svg_to_png()");
//    }
//}
