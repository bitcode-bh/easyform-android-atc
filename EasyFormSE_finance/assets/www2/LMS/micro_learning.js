
var reelsSwiper;
var reelTouchStartIndex = 0;
function bind_micro_learning_events() {
    //setTimeout(function () {

    if (reelsSwiper) {
        //reelsSwiper.destroy(true, true);
        reelsSwiper.update();
        reelsSwiper.slideTo(0, 0);

        setTimeout(function () {
            playVideo(reelsSwiper.slides[reelsSwiper.activeIndex]);
        }, 100);
    }
    else {
        reelsSwiper = new Swiper('.reels-swiper', {
            direction: 'vertical',
            slidesPerView: 1,
            mousewheel: true, // Allows scrolling via desktop mousewheel
            watchSlidesProgress: true,
            resistanceRatio: 0,
            rewind: true,
            observer: true,
            observeParents: true,
            noSwiping: true,
            noSwipingClass: 'swiper-no-swiping',
            on: {
                init: function () {
                    // Autoplay the first video on load
                    playVideo(this.slides[this.activeIndex]);
                },
                touchStart: function () {
                    reelTouchStartIndex = this.activeIndex;

                    // // Pause all videos immediately when user starts dragging
                    $(".reel-actions, .video-overlay, .video-overlay-sub").css("visibility", "hidden");

                    document.querySelectorAll('.reel-video').forEach(function (video) {
                        video.pause();
                    });
                },
                touchEnd: function () {
                    // Resume active video when user releases
                    $(".reel-actions, .video-overlay, .video-overlay-sub").css("visibility", "visible");

                    if (reelTouchStartIndex == this.slides.length - 1 && this.swipeDirection == "next") {
                        playNextReelOrRestart();
                        return;
                    }

                    playVideo(this.slides[this.activeIndex]);
                },
                slideChangeTransitionEnd: function () {
                    // Play video in the active slide
                    playVideo(this.slides[this.activeIndex]);
                }
            }
        });

    }


    // Helper function to play video and handle errors
    //}, 2000);
}


function pauseAllVideos() {
    // Pause all videos
    document.querySelectorAll('.reel-video').forEach(v => {
        v.pause();
    });
}

var playpause_Timer;
function updateReelPlayPauseButton(slideElement, isPlaying) {

    $("button.reel-play-pause").show();
    clearTimeout(playpause_Timer);
    playpause_Timer = setTimeout(function () {
        $("button.reel-play-pause").hide();
    }, 5000);

    if (!slideElement) return;

    var button = slideElement.querySelector('.reel-play-pause');
    if (!button) return;

    button.classList.toggle('is-playing', isPlaying);
    button.setAttribute('aria-label', isPlaying ? 'Pause video' : 'Play video');
    button.setAttribute('title', isPlaying ? 'Pause video' : 'Play video');
}

function toggleReelPlayback(button, event) {

    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    var slideElement = button.closest('.swiper-slide');
    var video = slideElement && slideElement.querySelector('.reel-video');
    if (!video) return false;

    if (video.paused || video.ended) {
        if (video.ended) {
            video.currentTime = 0;
        }

        video.play().catch(function (error) {
            console.log("Video play prevented", error);
        });
    }
    else {
        video.pause();
    }

    return false;
}

function playNextReelOrRestart() {
    if (!reelsSwiper || reelsSwiper.slides.length == 0) return;

    if (reelsSwiper.activeIndex < reelsSwiper.slides.length - 1) {
        reelsSwiper.slideNext();
    }
    else {
        document.querySelectorAll('.reel-video').forEach(function (video) {
            video.currentTime = 0;
        });
        $(".video-progress-fill").css("width", "0%");
        reelsSwiper.slideTo(0, 0);
        playVideo(reelsSwiper.slides[reelsSwiper.activeIndex]);
    }
}

function playVideo(slideElement) {
    if (!slideElement) return;


    // Pause all videos
    document.querySelectorAll('.reel-video').forEach(v => {
        v.pause();
        //v.currentTime = 0;
        v.onended = null; // Remove previous event
    });

    var video = slideElement.querySelector('.reel-video');
    var progress = slideElement.querySelector('.video-progress-fill');

    if (!video) return;

    if (video) {
        if (video.ended || (video.duration && video.currentTime >= video.duration)) {
            video.currentTime = 0;
            if (progress) {
                progress.style.width = '0%';
            }
        }
        //video.currentTime = 0;
        video.play().catch(function (error) {
            console.log("Auto-play prevented", error);
        });
    }

    video.onplay = function () {
        updateReelPlayPauseButton(slideElement, true);
    };

    video.onpause = function () {
        updateReelPlayPauseButton(slideElement, false);
    };

    video.ontimeupdate = function () {
        if (video.duration) {
            var percentage = (video.currentTime / video.duration) * 100;
            progress.style.width = percentage + '%';
        }
    };

    video.onended = function () {
        updateReelPlayPauseButton(slideElement, false);
        //console.log("Video completed");

        let Ml_id = $(video).parent(".swiper-slide-active").attr("Ml_id");
        let watch_icon = $(video).parent(".swiper-slide-active").find(".action-item").find("i.fa-eye");
        add_user_activitiy(Ml_id, 'WATCH', watch_icon);

        get_ML_question(Ml_id);

        //if (reelsSwiper.activeIndex < reelsSwiper.slides.length - 1) {
        //    // Move to next reel (Next reel is available)
        //    reelsSwiper.slideNext();
        //} else {
        //    // Last reel is completed load more videos if required
        //}
    };
}




var user_activitiy_Array = [];
function get_user_activities() {

    let user_id = JSON.parse(storage.getItem('user_id'));

    var Param_obj = [];
    Param_obj.push({
        "User_ID": user_id
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Micro_Learning_User_Activity', JSON.stringify(Param_obj), function (e) {
        var All_data = e.responseText;
        All_data = JSON.parse(All_data);
        let status = All_data[0]["status"];
        if (status == 1) {
            let data = JSON.parse(All_data[0]["data"]);

            user_activitiy_Array = data;

            //for (let i = 0; i < data.length; i++) {
            //    let Activity_Id = data[i].Activity_Id;
            //    let Ml_Id = data[i].Ml_Id;
            //    let IsLiked = data[i].IsLiked;
            //    let IsDisliked = data[i].IsDisliked;
            //    let Share_Count = data[i].Share_Count;
            //    let Watch_Count = data[i].Watch_Count;
            //}
        }
        else if (status == 2) { }
        else {
            alert(All_data[0]["message"]);
        }

        get_micro_learning_videos();

        loading_hide();
    }, onfail);
    getdata.callOtherDomain();
}

// micro learning video listing
var total_reels = 0;
function get_micro_learning_videos() {

    let role_id_array = localStorage.getItem('role_id_array');

    var Param_obj = [];
    Param_obj.push({
        'Role_Id': role_id_array
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Micro_Learning_Master_RoleWise', JSON.stringify(Param_obj), function (e) {
        var All_data = e.responseText;
        All_data = JSON.parse(All_data);
        let status = All_data[0]["status"];
        if (status == 1) {
            let data = JSON.parse(All_data[0]["data"]);

            if (total_reels == 0) {
                $('#div_Reels')[0].innerHTML = '';
                total_reels = data.lenth;
            }
            else {
                if (data.lenth > total_reels) {
                    $('#div_Reels')[0].innerHTML = '';
                }
            }

            let reelsContent = $('#div_Reels')[0].innerHTML;
            if (reelsContent == '') {
                for (let i = 0; i < data.length; i++) {
                    let Ml_id = data[i].Ml_id;
                    let Title = data[i].Title;
                    let Description = data[i].Description;
                    //let Video_Id = data[i].Video_Id;
                    let Video_Link = data[i].Video_Link;

                    let Total_Likes = data[i].Total_Likes;
                    let Total_Dislikes = data[i].Total_Dislikes;
                    let Total_Shares = data[i].Total_Shares;
                    let Total_Watch_Count = data[i].Total_Watch_Count;

                    let reel_str = '<div class="swiper-slide" Ml_id="' + Ml_id + '">';

                    reel_str += '<div class="video-progress"><div class="video-progress-fill"></div></div>';
                    reel_str += '<video class="reel-video" preload="auto" autoplay playsinline><source src="' + Video_Link + '" type="video/mp4" /></video>';
                    reel_str += '<button type="button" class="reel-play-pause swiper-no-swiping" aria-label="Pause video" title="Pause video" onclick="return toggleReelPlayback(this, event)" ontouchstart="event.stopPropagation()" ontouchend="event.stopPropagation()" onmousedown="event.stopPropagation()"><span class="reel-play-pause-icon" aria-hidden="true"></span></button>';
                    reel_str += '<div class="video-overlay">' + Title + '</div>';
                    reel_str += '<div class="video-overlay-sub">' + Description + '</div>';


                    let like_str = "add_user_activitiy('" + Ml_id + "','LIKE', this)";
                    let dislike_str = "add_user_activitiy('" + Ml_id + "','DISLIKE', this)";
                    let share_str = "share_video_link('" + Ml_id + "','SHARE', this, '" + Video_Link + "')";

                    reel_str += '<div class="reel-actions swiper-no-swiping">';

                    var IsLiked = 0, IsDisliked = 0, Watch_Count = 0, Share_Count = 0;
                    if (user_activitiy_Array.length > 0) {
                        for (let a = 0; a < user_activitiy_Array.length; a++) {
                            let t_Ml_Id = user_activitiy_Array[a].Ml_Id;
                            if (t_Ml_Id == Ml_id) {
                                IsLiked = user_activitiy_Array[a].IsLiked;
                                IsDisliked = user_activitiy_Array[a].IsDisliked;
                                Watch_Count = user_activitiy_Array[a].Watch_Count;
                                Share_Count = user_activitiy_Array[a].Share_Count;
                                break;
                            }
                        }
                    }

                    if (IsLiked == 1) {
                        reel_str += '<div class="action-item"><i class="fa-solid fa-thumbs-up" onclick="' + like_str + '"></i><span>' + Total_Likes + '</span></div>';
                    }
                    else {
                        reel_str += '<div class="action-item"><i class="fa-regular fa-thumbs-up" onclick="' + like_str + '"></i><span>' + Total_Likes + '</span></div>';
                    }

                    // if (IsDisliked == 1) {
                    //     reel_str += '<div class="action-item"><i class="fa-solid fa-thumbs-down" onclick="' + dislike_str + '"></i><span>' + Total_Dislikes + '</span></div>';
                    // }
                    // else {
                    //     reel_str += '<div class="action-item"><i class="fa-regular fa-thumbs-down" onclick="' + dislike_str + '"></i><span>' + Total_Dislikes + '</span></div>';
                    // }

                    if (Share_Count == 1) {
                        reel_str += '<div class="action-item"><i class="fa-solid fa-paper-plane" onclick="' + share_str + '"></i><span>' + Total_Shares + '</span></div>';
                    }
                    else {
                        reel_str += '<div class="action-item"><i class="fa-regular fa-paper-plane" onclick="' + share_str + '"></i><span>' + Total_Shares + '</span></div>';
                    }

                    if (Watch_Count == 1) {
                        reel_str += '<div class="action-item"><i class="fa-solid fa-eye"></i><span>' + Total_Watch_Count + '</span></div></div>';
                    }
                    else {
                        reel_str += '<div class="action-item"><i class="fa-regular fa-eye"></i><span>' + Total_Watch_Count + '</span></div></div>';
                    }

                    reel_str += '</div>';

                    reel_str += '</div>';

                    $('#div_Reels').append(reel_str);
                }
            }

            bind_micro_learning_events();
        }
        else {
            alert("No reel found!");
        }
        loading_hide();
    }, onfail);
    getdata.callOtherDomain();
}


function add_user_activitiy(t_ML_id, activity_type, icon_ele) {

    let isActive = $(icon_ele).hasClass("fa-solid");
    if (isActive) {
        // remove
        var action = "0";

        if (activity_type == "WATCH" || activity_type == "SHARE") {
            // do not call if user has already watched or share this video
            return false;
        }
    }
    else {
        // add
        var action = "1";
    }

    let user_id = JSON.parse(storage.getItem('user_id'));

    var Param_obj = [];
    Param_obj.push({
        "Ml_Id": t_ML_id,
        "Flag": activity_type,
        "Value": action,
        "User_ID": user_id
    });

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_InsertUpdateDelete_Micro_Learning_User_Activity', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {

            let curr_count = $(icon_ele).next("span").text();

            if (action == "0") {
                $(icon_ele).removeClass("fa-solid").addClass("fa-regular");
                curr_count = parseInt(curr_count);
                $(icon_ele).next("span").text(curr_count - 1);
            }
            else {
                $(icon_ele).removeClass("fa-regular").addClass("fa-solid")
                curr_count = parseInt(curr_count);
                $(icon_ele).next("span").text(curr_count + 1);
            }

        }
        else if (status == 2 || status == 3) {
            var message = myArray[0].message;
            alert(message);
        }
    }, onfail);
    getdata.callOtherDomain();
}


var glob_ML_Id, glob_ML_Que_Id;
function get_ML_question(Ml_Id) {

    glob_ML_Id = Ml_Id;

    var Param_obj = [];
    Param_obj.push({
        "Ml_Id": Ml_Id
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Micro_Learning_Questions_Master_by_Ml_Id', JSON.stringify(Param_obj), function (e) {
        var All_data = e.responseText;
        All_data = JSON.parse(All_data);
        let status = All_data[0]["status"];
        if (status == 1) {
            let data = JSON.parse(All_data[0]["data"]);
            let Question_Name = data[0].Question_Name;
            let Valid_Answer = data[0].Valid_Answer;
            let OptionText = data[0].OptionText;

            glob_ML_Que_Id = data[0].Ml_Que_Id;

            $("#ML_Question").text(Question_Name);
            $("#ML_Question").attr("valid_ans", Valid_Answer[0]);

            $("#option0").text(OptionText[0]);
            $("#option1").text(OptionText[1]);
            $("#option2").text(OptionText[2]);
            $("#option3").text(OptionText[3]);

            // Clear previous selection
            $("input[name='quizOption']").prop("checked", false);

            myApp.sheet.open("#pnl_ML_Question");

        }
        else if (status == 2) {
            playNextReelOrRestart();
        }
        else {
            alert(All_data[0]["message"]);
        }

        loading_hide();
    }, onfail);
    getdata.callOtherDomain();
}

function submit_ML_question() {
    let Param_obj = [];

    let user_id = JSON.parse(storage.getItem('user_id'));
    let user_name = JSON.parse(storage.getItem('user_name'));
    let circle_name = JSON.parse(storage.getItem('circle_name'));
    let questionName = $("#ML_Question").text();
    let selectedValue = $('#pnl_ML_Question').find('input[type="radio"][name="ML_Option"]:checked').val();

    if (selectedValue !== undefined) {
        var selectedAns = $("#option" + selectedValue).text();
    }
    else {
        alert("Please select answer!");
        return false;
    }

    Param_obj.push({
        "User_ID": user_id,
        "User_Name": user_name,
        "Ml_Id": glob_ML_Id,
        "Ml_Que_Id": glob_ML_Que_Id,
        "Question_Name": questionName,
        "Ans": selectedAns,
        "Circle": circle_name
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_InsertUpdateDelete_Micro_Learning_Question_Log_Master', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {

            $("#btn_ML_Que_Submit").css("visibility", "hidden");

            // Remove previous classes
            $("#pnl_ML_Question .list li").removeClass("correct-answer incorrect-answer");

            let validAnswer = $("#ML_Question").attr("valid_ans");

            $("input[name='ML_Option']").each(function () {

                var value = $(this).val();
                var option = $("#option" + value);

                if (option.text().trim() === validAnswer) {

                    // Highlight the correct answer
                    $(this).closest("li").addClass("correct-answer");

                } else if ($(this).is(":checked")) {

                    // Highlight only the selected wrong answer
                    $(this).closest("li").addClass("incorrect-answer");
                }
            });

            setTimeout(function () {
                myApp.sheet.close("#pnl_ML_Question");

                $("#btn_ML_Que_Submit").css("visibility", "visible");

                playNextReelOrRestart();
            }, 3000);

        }
        else {
            var message = myArray[0].message;
            alert(message);
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}

function share_video_link(t_ML_id, activity_type, icon_ele, Video_Link) {
    try {

        pauseAllVideos();

        var m_username = $("#txtusername").val();
        if (m_username == "" || m_username == null || m_username == undefined) {
            m_username = "";
        }

        Video_Link = encodeURI(Video_Link);

        var body_str = 'Dear Team,\n\n Please find the video link below for your review:\n\n Video Link:\n ' + Video_Link + '\n\n Kindly review the video and let me know if you encounter any issues or have any feedback.\n\n Thank you.';
        // var mail_str = ' , ' + body_str + ', Video Link for Review';
        // mail_str = encodeURIComponent(mail_str);

        // t_mail_details = decodeURIComponent(mail_str);
        // var mail_array = t_mail_details.split(',');
        // var email = mail_array[0];
        // var body = '';
        // var subject = '';
        // if (mail_array.length > 1) {
        //     body = mail_array[1];
        //     subject = mail_array[2];
        // }

        //body = 'Disclaimer : The content of this application is confidential and intended for the specified recipient only. No User has the authority to conclude any binding contract/inference from the contents of this application. The data contained herein only provides an information regarding the project but not on a real-time basis. The accuracy of the information Vis-à-vis the real-time project progress is not guaranteed. The application users are advised to seek help of the Project Director for any further query that they may have with regards to the project progress. Thank you for your cooperation and understanding.';
        //subject = '';

        var q_jsonobj = [];
        q_jsonobj.push({
            'email': " ",
            'body': body_str,
            'subject': "Video Link for Review"
        });
        cordova.exec(function (e) {
            // success

            playVideo(reelsSwiper.slides[reelsSwiper.activeIndex]);
            add_user_activitiy(t_ML_id, activity_type, icon_ele);

        }, function (e) {
            // onfail

            playVideo(reelsSwiper.slides[reelsSwiper.activeIndex]);
            add_user_activitiy(t_ML_id, activity_type, icon_ele);

        }, 'openMailComposerPlugin', 'anAction', q_jsonobj);

    }
    catch (e) {
        alert1(e + '_share_video_link()')
    }
}
