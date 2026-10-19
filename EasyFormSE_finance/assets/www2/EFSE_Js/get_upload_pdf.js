function get_pdf_report(item_id, t_new_id, DynamicPdfTypeId) {
    try {
        //myApp.popup('.popup-type27');
        //$('#popup_inner_div_type27_F7 object').remove();

        var server_task_id = JSON.parse(storage.getItem('server_task_id'));
        var company_id = JSON.parse(storage.getItem('company_id'));
        
        let domain_url = JSON.parse(storage.getItem('global_url'));
        //if ((domain_url.indexOf("login.easyform.in") > -1 && company_id != 1842) ||  pdf_view_type == "html_preview_pdf") {

        var check_pdf = check_type_for_pdf_report();                   //check if PDF report should be old or new [FT-24072024]

        if (check_pdf == "new") {
            storage.setItem('pdf_id', JSON.stringify(item_id));
            var siteid = JSON.parse(storage.getItem('siteid'));
            redirect_page_pdf_preview(server_task_id, siteid, "checksheet");
        }
        else {
            //loading();
            $('a.button-fill').addClass('li_disabled');
            storage.setItem('pdf_id', JSON.stringify(item_id));
            storage.setItem('pdf_new_id', JSON.stringify(t_new_id));
            storage.setItem('pdf_typeid', JSON.stringify(DynamicPdfTypeId));

            var username = JSON.parse(storage.getItem('username'));
            var uniqcode = JSON.parse(storage.getItem('uniqcode'));

            var Param_obj = [];
            Param_obj.push({
                'taskid': server_task_id,
                'DynamicPdfTypeId': DynamicPdfTypeId
            });

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_PDF_Creation_WSapi', JSON.stringify(Param_obj), onsuccess_get_pdf_report, onfail_get_pdf_report);
            getdata.callOtherDomain();
        }

    } catch (e) {
        alert1(e + '_get_pdf_report()');
        loading_hide();
    }
}

function onsuccess_get_pdf_report(e) {
    try {
        var Data_Json = e.responseText;
        Data_Json = eval('(' + Data_Json + ')');
        var Status = Data_Json[0].status;
        if (Status == 1) {
            //var PDF_path = Data_Json[0].message;

            var data = Data_Json[0].data;
            if (data == "" || data == null || data == undefined) {
                var PDF_path = Data_Json[0].message;
            }
            else {
                var PDF_path = data;
            }

            PDF_path = PDF_path.replace(/\\/g, "/");
            var pdf_new_id = JSON.parse(storage.getItem('pdf_new_id'));
            //var embed_str = '<object data="https://docs.google.com/gview?embedded=true&url='
            //		+ PDF_path + '" width="100%" height="100%"></object>';

            // var embed_str = '<iframe
            // src="https://docs.google.com/gview?embedded=true&url='
            // + PDF_path + '" width="100%" height="100%"></iframe>';

            //$('#popup_inner_div_type27_F7').append(embed_str);

            var user_id = JSON.parse(storage.getItem('user_id'));
            var uniqcode = JSON.parse(storage.getItem('uniqcode'));
            PDF_path = PDF_path + '&ud=' + user_id + '&uc=' + uniqcode;

            var pdf_id = JSON.parse(storage.getItem('pdf_id'));
            var answer = [];
            answer.push(PDF_path);

            //var curr_form_flag = form_flag;
            //if (curr_form_flag == 0) {
            //    // normal form
            //    jsonObj_old[pdf_id].ans = answer;
            //} else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
            //    // type22 form
            //    jsonObj_type22[pdf_id].ans = answer;
            //} else if (curr_form_flag == 2 || curr_form_flag == 3) {
            //    // type23 form
            //    jsonObj_type23[pdf_id].ans = answer;
            //}

            var curr_form_flag = form_flag;
            if (curr_form_flag == 0 || curr_form_flag == 6 || curr_form_flag == 7) {
                let task_create_popup = $('.popup-new-task-create.modal-in:visible');
                if (task_create_popup.length > 0) {
                    //new task create popup [FT-08052025]
                    jsonObj_task_add[pdf_id].ans = answer;
                }
                else {
                    // normal form
                    jsonObj_old[pdf_id].ans = answer;
                }
            } else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
                // type22 form
                jsonObj_type22[pdf_id].ans = answer;
            } else if (curr_form_flag == 2 || curr_form_flag == 3) {
                // type23 form
                jsonObj_type23[pdf_id].ans = answer;
            }

            myApp.closeModal('.popup-type27');
            $('a.button-fill').removeClass('li_disabled');
            Download_PDFFile(PDF_path, '');
        } else {
            var message = Data_Json[0].message;
            alert1(message);
            onfail_get_pdf_report();
        }
        //    loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_get_pdf_report()');
        loading_hide();
    }
}

function onfail_get_pdf_report(e) {
    $("#popup_inner_div_type27").hide();
    $("#popup_error_div_type27").show();
    loading_hide();
}

function retry_get_pdf_report() {
    var t_new_id = JSON.parse(storage.getItem('pdf_new_id'));
    var DynamicPdfTypeId = JSON.parse(storage.getItem('pdf_typeid'));
    var pdf_id = JSON.parse(storage.getItem('pdf_id'));
    get_pdf_report(pdf_id, t_new_id, DynamicPdfTypeId);
}

function bind_pdf_in_survey(PDF_path) {
    try {
        if (PDF_path == "" || PDF_path == null || PDF_path == undefined) {
            alert1("PDF was not generated");
        } else {
            $("#popup_error_div_type27").hide();
            $("#popup_outer_div_type27").show();
            $("#popup_inner_div_type27").show();
            $('#popup_inner_div_type27 object').remove();

            var embed_str = '<object data="https://docs.google.com/gview?embedded=true&url='
                + PDF_path + '" width="100%" height="100%"></object>';
            $('#popup_inner_div_type27').append(embed_str);
            loading_hide();
        }
    } catch (e) {
        alert1(e + '_bind_pdf_in_survey()');
        loading_hide();
    }
}

function Download_PDFFile(t_path, t_filename) {
    try {

        if (t_filename == "" || t_filename == null || t_filename == undefined) {
            t_filename = "";
        }
        var q_jsonobj = [];
        q_jsonobj.push({
            path: t_path,
            name: t_filename
        });
        cordova.exec(onsuccess_Download_PDFFile, onfail_Download_PDFFile, 'pdf_download', 'anAction', q_jsonobj);
    } catch (e) {
        alert1(e + '_Download_PDFFile()');
    }
}

function onsuccess_Download_PDFFile(e) {
    // user has pressed back
    $('a.button-fill').removeClass('li_disabled');
}

function onfail_Download_PDFFile(e) {
    loading_hide();
}



//function view_pdf_ios(t_path) {
//    var q_jsonobj = [];
//    q_jsonobj.push({
//        'path': t_path
//    });
//    cordova.exec(onsuccess_view_pdf_ios, onfail_view_pdf_ios, 'pdfview', 'anAction', q_jsonobj);

//}
//function onsuccess_view_pdf_ios(e) { }
//function onfail_view_pdf_ios(e) { }
