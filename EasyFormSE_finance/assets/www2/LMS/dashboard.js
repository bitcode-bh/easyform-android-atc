

function get_dashboard_data() {

    $("#dv_Dashboard_List").empty();
    var Param_obj = [];

    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Dashboard', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {
            let data = myArray[0]["data"];
            data = JSON.parse(data);

            for (let m = 0; m < data.length; m++) {
                let Module_Name = data[m].Module_Name;
                let Skill_Name = data[m].Skill_Name;
                let SubmittedDate = data[m].SubmittedDate;

                let Achieve_Percentage = data[m].Achieve_Percentage;
                if (Achieve_Percentage == "" || Achieve_Percentage == null || Achieve_Percentage == undefined) {
                    Achieve_Percentage = "0";
                }
                else {
                    Achieve_Percentage = Math.round(Achieve_Percentage);
                }

                let Achieve_Score = data[m].Achieve_Score;
                let Total_Score = data[m].Total_Score;
                let Rank = data[m].Rank;

                let str = '<div class="sample-module-card">';
                str += '<div class="sample-module-card-body">';
                str += '<span class="sample-rank-tag">' + Rank + '</span>';
                str += '<div class="sample-module-title">' + Module_Name + '</div>';
                str += '<div class="sample-module-desc">' + Skill_Name + '</div>';
                str += '<div class="sample-module-meta">';
                str += '<div class="sample-module-lessons">';
                str += '<span class="sample-module-help"><i class="fa-solid fa-star-half-stroke"></i></span>';
                str += '<span class="sample-lession-count">Score: ' + Achieve_Score + '/' + Total_Score + '</span>';
                str += '<span><i class="fa-regular fa-calendar-check"></i></span>';
                str += '<span>' + SubmittedDate + '</span>';
                str += '</div>';
                str += '<div class="sample-module-percent">' + Achieve_Percentage + '%</div>';
                str += '</div>';
                str += '<div class="sample-module-progress"><span style="width:' + Achieve_Percentage + '%"></span></div>';
                str += '</div>';
                str += '</div>';

                $("#dv_Dashboard_List").append(str);
            }
        }
        loading_hide();

    }, onfail);
    getdata.callOtherDomain();

}