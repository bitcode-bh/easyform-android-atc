
// change password
var resonceuc = "";

function randomString(length) {
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

function change_password() {
    try {
        resonceuc = randomString(10);
        var old_pass = $('#txt_oldpass').val();
        var new_pass = $('#txt_newpass').val();
        var re_pass = $('#txt_retypepass').val();
        if (old_pass == '' || old_pass == null || old_pass == undefined || new_pass == '' || new_pass == null || new_pass == undefined
            || re_pass == '' || re_pass == null || re_pass == undefined) {
            alert1("Please enter all the values !")
        } else {
            //var formula = "^(?=.*[A-Z])(?=.*[!@#$&*_])(?=.*[0-9])(?=.*[a-z]).{8,10}$";
            var formula = "^(?=.*[A-Z])(?=.*[@#$&*_])(?=.*[0-9])(?=.*[a-z]).{8,20}$";

            //var formula = "^[a-z0-9._@]{5,25}$";                                  //this regex is only for atc-testing [24032020]

            var regex = new RegExp(formula);
            var new_pass_reg = regex.test(new_pass);

            if (new_pass_reg == true) {
                if (new_pass == re_pass) {
                    var hash = CryptoJS.SHA256(new_pass);
                    var pass_code = hash.toString(CryptoJS.enc.Base64);
                    var hash_old = CryptoJS.SHA256(old_pass);
                    var pass_code_old = hash_old.toString(CryptoJS.enc.Base64);
                    var hash_new = CryptoJS.SHA256(new_pass);
                    var pass_code_new = hash_new.toString(CryptoJS.enc.Base64);

                    loading();
                    var param_obj = [];
                    param_obj.push({
                        'old_pass': pass_code_old,
                        'new_pass': pass_code_new,
                        'passcode': pass_code,
                        'ruc': resonceuc
                    });
                    //alert1(JSON.stringify(param_obj))

                    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_ChangePassword_New', JSON.stringify(param_obj), onsuccess_change_password, onfail_change_password);
                    getdata.callOtherDomain();
                } else {
                    alert1("New password and Re-Type password are not matched!");
                }
            }
            else {
                alert1("Password must contain 8 to 20 characters, including lowercase letters and numbers and some special characters are allowed.");
            }
        }
    } catch (e) {
        alert1(e + '_change_password()');
        loading_hide();
    }
}

function onsuccess_change_password(e) {
    try {
        var myArray = JSON.parse(e.responseText);
        var status = myArray[0].status;
        if (status == 1) {
            alert1("Password has been changed successfully !");
            storage.setItem('rm_username', JSON.stringify(''));
            storage.setItem('rm_password', JSON.stringify(''));
            storage.setItem('rm_mili', JSON.stringify(''));
            changeurl("Login.html");
        } else {
            var message = myArray[0].message;
            alert1("Server: " + message);
        }
        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_change_password()');
        loading_hide();
    }
}

function onfail_change_password(e) {
    alert1(e);
    loading_hide();
}


















//function onsuccess_change_password(e) {
//    try {
//        var myArray = JSON.parse(e.responseText);
//        var uniqnumber = myArray[0]['uniqnumber'];
//        var hashtoken = myArray[0]['hashtoken'];
//        var uniqcodekey = uniqcode;
//        if (resonceuc != '') {
//            var tokencheck = resonceuc + uniqnumber + uniqcodekey;
//            resonceuc = '';
//            uniqnumber = '';
//            uniqcodekey = '';
//            var hash256 = CryptoJS.SHA256(tokencheck);
//            var hashbase64 = hash256.toString();
//            if (hashtoken == hashbase64) {
//                var status = myArray[0].status;
//                if (status == 1) {
//                    alert1("Password has been changed successfully !");
//                    storage.setItem('rm_username', JSON.stringify(''));
//                    storage.setItem('rm_password', JSON.stringify(''));
//                    storage.setItem('rm_mili', JSON.stringify(''));
//                    changeurl("Login.html");
//                } else {
//                    var message = myArray[0].data;
//                    alert1(message);
//                }
//            } else {
//                alert1("Responce Tempering.Password is not change");
//                changeurl("Login.html");
//            }
//        } else {
//            alert1("Responce Tempering.Password is not change");
//            changeurl("Login.html");
//        }

//        loading_hide();
//    } catch (e) {
//        alert1(e + '_onsuccess_change_password()');
//        loading_hide();
//    }
//}