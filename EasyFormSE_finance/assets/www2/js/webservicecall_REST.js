
// new CoreApiCall function
var req_count = 0;
function Webservicecall_REST(url1, params, sucesscallback, failcallback, catchback, settimeout, is_type30) {
    //var timeout = 1120000;
    var timeout = 180000;        // 3 minute
    if (settimeout != null) {
        timeout = settimeout;
    }

    var is_catch = 0;
    if (catchback != null) {
        is_catch = 1;
    }

    var timer1;

    var isIE8 = false;
    var invocation = createCrossDomainRequest();

    var url = url1;

    function createCrossDomainRequest(url, handler) {
        var request;
        if (isIE8) {
            request = new window.XDomainRequest();
        }
        else {
            request = new XMLHttpRequest();
        }
        return request;
    }

    this.callOtherDomain = function () {
        if (invocation) {
            if (isIE8) {
                invocation = new XDomainRequest();
                invocation.load = function () { sucesscallback(invocation); };
                invocation.onerror = function () { failcallback("Network Error Please try again"); };
                invocation.onprogress = function () { };
                invocation.open("POST", url);
                invocation.send(params);
            }
            else {

                if (is_catch == 0) {
                    invocation.open("POST", url, true);

                    if (is_type30 == "true") {
                        invocation.setRequestHeader('Accept', 'application/text');
                        invocation.setRequestHeader('Content-Type', 'application/text');
                    }
                    else {
                        invocation.setRequestHeader('Accept', 'application/json');
                        invocation.setRequestHeader('Content-Type', 'application/json');
                    }

                }
                else {
                    invocation.withCredentials = true;
                    invocation.open("POST", url, true);
                    invocation.setRequestHeader('cache-control', 'no-cache')
                }
                // added for wcf web service [10/11/2017]
                var data = JSON.parse(params);
                if (data == '' || data == null || data == undefined) { }
                else {

                    var username = JSON.parse(storage.getItem('username'));;
                    var u_c = JSON.parse(storage.getItem('uniqcode'));
                    var user_id = JSON.parse(storage.getItem('user_id'));
                    var auth1 = [];
                    auth1.push({
                        'username': username,
                        'u_c': u_c,
                        'user_id': user_id
                    });

                    let t_auth = data[0].auth1;
                    if (t_auth == '' || t_auth == null || t_auth == undefined) {
                        params = JSON.parse(params);
                        params[0]['auth1'] = auth1;
                        params = JSON.stringify(params);
                    }

                    invocation.setRequestHeader('auth1', JSON.stringify(auth1[0]));

                    var feature_id = localStorage.getItem('company_feature_id');
                    var role_id = JSON.parse(storage.getItem('role_id'));
                    var match_temp_id = localStorage.getItem('match_temp_id');

                    if (role_id == "" || role_id == null || role_id == undefined) {
                        role_id = "0";
                    }
                    if (match_temp_id == '' || match_temp_id == null || match_temp_id == undefined) {
                        match_temp_id = '';
                    }

                    invocation.setRequestHeader('Company_Feature_Id', feature_id);
                    invocation.setRequestHeader('Role_Id', role_id);
                    invocation.setRequestHeader('matchId', match_temp_id);

                    // for aadhar
                    var mock_response_name = localStorage.getItem('mock-response-name');
                    if (mock_response_name == "" || mock_response_name == null || mock_response_name == undefined) { }
                    else {
                        invocation.setRequestHeader('x-mock-response-name', mock_response_name);
                    }

                    // for bank
                    var Authorization = localStorage.getItem('Authorization');
                    if (Authorization == "" || Authorization == null || Authorization == undefined) { }
                    else {
                        invocation.setRequestHeader('Authorization', Authorization);
                    }

                }

                //if (F7_device == "ios") {
                //    clearTimeout(timer1);
                //    req_count = 0;

                //    var q_jsonobj = [];
                //    q_jsonobj.push({
                //        url: url1,
                //        Company_Feature_Id: feature_id,
                //        Role_Id: role_id,
                //        matchId: match_temp_id,
                //        params: params
                //    });
                //    cordova.exec(sucesscallback, failcallback, 'FrontWebserviceCall', 'anAction', q_jsonobj);
                //}
                //else {
                    invocation.onreadystatechange = handler;
                    invocation.send(params);
                //}
            }
            //timer1 = setTimeout(networkerror, timeout);

            // retry last request for 3 times in case of network timeout 06042023 
            timer1 = setTimeout(function () {
                if (req_count >= 3) {
                    networkerror();
                    clearTimeout(timer1);
                    req_count = 0;
                }
                else {
                    req_count++;
                    invocation.abort();
                    mk_notify("Network Timeout! Retrying...");
                    var t_getdata = new Webservicecall_REST(url1, params, sucesscallback, failcallback);
                    t_getdata.callOtherDomain();
                }
            }, timeout);
        }
        else {
            failcallback("No Invocation TookPlace At All");
        }
    }

    function networkerror() {
        invocation.abort();
        failcallback('Network Time Out');
    }

    function handler(evtXHR) {
        //alert(invocation.readyState);
        if (invocation.readyState == 4) {
            //alert(invocation.status);

            clearTimeout(timer1);
            //req_count = 0;

            if (invocation.status == 200) {
                req_count = 0;

                var myArray = JSON.parse(invocation.responseText);

                if (Array.isArray(myArray)) {
                    var status = myArray[0].status;
                }
                else {
                    // for aadhar verification testing
                    var status = 1;
                }

                if (status == "4") {
                    loading_hide();
                    alert(myArray[0].message);
                    storage.setItem('rm_mili', JSON.stringify(''));
                    storage.setItem('crash_status', JSON.stringify('0'));
                    changeurl("Login.html");

                } else if (status == 11 && myArray[0].message == 'Validation Error') {
                    var validationerror = myArray[0].data;
                    var validationerrorparse = JSON.parse(validationerror);
                    var validationmsg = "";
                    var error = "";
                    for (var v = 0; v < validationerrorparse.length; v++) {
                        if (Array.isArray(validationerrorparse[v]["error"])) {

                            error = validationerrorparse[v]["error"][0];

                        } else {

                            error = validationerrorparse[v]["error"];
                        }
                        if (v == (validationerrorparse.length - 1)) {
                            validationmsg += error;
                        } else {
                            validationmsg += error + ' ; ';
                        }
                    }

                    alert("Validation Error " + validationmsg);
                    loading_hide();
                }
                //else if (status == "5") {
                //    var feature_id = localStorage.getItem('company_feature_id');
                //    servicemap(url1, feature_id);
                //}
                else {
                    if (status == "5") {
                        var feature_id = localStorage.getItem('company_feature_id');
                        alert("Mapping Not Found: Feature Id: " + feature_id + ' URL: ' + url1);
                        loading_hide();
                    }

                    if (status == 3) {
                        vibrate_device();
                    }
                    sucesscallback(invocation);
                }
            }
            else {

                //var Authorization = localStorage.getItem('Authorization');
                //if (Authorization == "" || Authorization == null || Authorization == undefined) {
                //    failcallback("Network Error Please try again");
                //}
                //else {
                //    failcallback(invocation);
                //}

                if (req_count >= 3) {
                    // final failed

                    req_count = 0;

                    var Authorization = localStorage.getItem('Authorization');
                    if (Authorization == "" || Authorization == null || Authorization == undefined) {
                        failcallback("Network Error Please try again");
                    }
                    else {
                        failcallback(invocation);
                    }

                }
                else {
                    // retry last request for 3 times in case of network failed - mk - 29012026 

                    req_count++;
                    invocation.abort();
                    //mk_notify("Network Failed! Retrying...");
                    var t_getdata = new Webservicecall_REST(url1, params, sucesscallback, failcallback);
                    t_getdata.callOtherDomain();
                }


                
            }
        }
    }

}



































// old rest function 28092020
function Webservicecall_REST1(url1, params, sucesscallback, failcallback, catchback, settimeout) {
    //alert('Webservicecall');
    var timeout = 1120000;
    if (settimeout != null) {
        //alert('set timeout');
        timeout = settimeout;
    }
    var is_catch = 0;
    if (catchback != null) {
        is_catch = 1;
    }

    var timer1;
    // var isIE8 = window.XDomainRequest ? true : false;
    var isIE8 = false;
    var invocation = createCrossDomainRequest();

    var url = url1;

    function createCrossDomainRequest(url, handler) {
        var request;
        if (isIE8) {
            request = new window.XDomainRequest();
        }
        else {
            request = new XMLHttpRequest();
        }
        return request;
    }

    this.callOtherDomain = function () {
        if (invocation) {
            if (isIE8) {
                invocation = new XDomainRequest();
                invocation.load = function () { sucesscallback(invocation); };
                invocation.onerror = function () { failcallback("Network Error Please try again"); };
                invocation.onprogress = function () { };
                invocation.open("POST", url);
                invocation.send(params);
                //                invocation.onload = outputResult;
                //                invocation.open("POST", url, true);
                //                invocation.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                //                invocation.onreadystatechange = handler;
                //                invocation.send(params);
            }
            else {

                // invocation.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

                //invocation.setRequestHeader('catch-control', 'no-cache')
                // invocation.setRequestHeader('Content-Type', 'text/plain');

                if (is_catch == 0) {
                    invocation.open("POST", url, true);
                    invocation.setRequestHeader('Accept', 'application/json');
                }
                else {
                    invocation.withCredentials = true;
                    invocation.open("POST", url, true);
                    invocation.setRequestHeader('cache-control', 'no-cache')
                }
                // added for wcf web service [10/11/2017]
                var data = JSON.parse(params);
                if (data == '' || data == null || data == undefined) { }
                else {
                    var auth1 = data[0].auth1;
                    if (auth1 == '' || auth1 == null || auth1 == undefined) {
                        var username = JSON.parse(storage.getItem('username'));;
                        var u_c = JSON.parse(storage.getItem('uniqcode'));
                        var user_id = JSON.parse(storage.getItem('user_id'));
                        var auth1 = [];
                        auth1.push({
                            'username': username,
                            'u_c': u_c,
                            'user_id': user_id
                        });

                        params = JSON.parse(params);
                        params[0]['auth1'] = auth1;
                        params = JSON.stringify(params);
                        invocation.setRequestHeader('auth1', JSON.stringify(auth1[0]));
                    }
                    else {
                        invocation.setRequestHeader('auth1', JSON.stringify(auth1[0]));
                    }

                    var feature_id = localStorage.getItem('company_feature_id');
                    var role_id = JSON.parse(storage.getItem('role_id'));
                    var match_temp_id = localStorage.getItem('match_temp_id');
                    invocation.setRequestHeader('Company_Feature_Id', feature_id);
                    invocation.setRequestHeader('Role_Id', role_id);
                    invocation.setRequestHeader('matchId', match_temp_id);
                }

                if (F7_device == "ios") {
                    var q_jsonobj = [];
                    q_jsonobj.push({
                        url: url1,
                        Company_Feature_Id: feature_id,
                        Role_Id: role_id,
                        matchId: match_temp_id,
                        params: params
                    });
                    cordova.exec(sucesscallback, failcallback, 'FrontWebserviceCall', 'anAction', q_jsonobj);
                }
                else {
                    invocation.onreadystatechange = handler;
                    invocation.send(params);
                }

            }
            timer1 = setTimeout(networkerror, timeout);
        }
        else {
            failcallback("No Invocation TookPlace At All");
        }
    }

    function networkerror() {
        invocation.abort();
        failcallback('Network Time Out');
    }

    function handler(evtXHR) {
        //alert(invocation.readyState);
        if (invocation.readyState == 4) {
            //alert(invocation.status);
            clearTimeout(timer1);
            if (invocation.status == 200) {

                var myArray = JSON.parse(invocation.responseText);
                var status = myArray[0].status;
                if (status == "4") {
                    loading_hide();
                    alert("Authentication failed !");
                    setTimeout(function () {
                        window.location.href = "Login.html";
                    }, 2000);
                }
                else if (status == 11 && myArray[0].message == 'Validation Error') {
                    loading_hide();
                    var validationerror = myArray[0].data;
                    var validationerrorparse = JSON.parse(validationerror);
                    var validationmsg = "";
                    var error = "";
                    for (var v = 0; v < validationerrorparse.length; v++) {
                        if (Array.isArray(validationerrorparse[v]["error"])) {

                            error = validationerrorparse[v]["error"][0];

                        } else {

                            error = validationerrorparse[v]["error"];
                        }
                        if (v == (validationerrorparse.length - 1)) {
                            validationmsg += error;
                        } else {
                            validationmsg += error + ' ; ';
                        }
                    }

                    alert("Validation Error " + validationmsg);
                }
                else if (status == "5") {
                    var feature_id = localStorage.getItem('company_feature_id');
                    servicemap(url1, feature_id);
                }
                else {
                    sucesscallback(invocation);
                }

                //outputResult();
            }
            else {
                failcallback("Network Error Please try again");
            }
        }
    }

}




function servicemap(url, featureid1) {
    var us = url.split('/');
    var f = us[us.length - 1];
    var Getflowdata = [];
    Getflowdata.push(
        {
            'key': 'servicename',
            'value': f
        },
        {
            'key': 'comapny_feature_id',
            'value': featureid1
        }
    );
    var getdata1 = new Webservicecall_REST(global_wcf_url + 'Common/servicemap', JSON.stringify(Getflowdata), onsuccess_sm, onfail_sm);
    getdata1.callOtherDomain();
}
function onsuccess_sm(invocation1) {
    loading_hide();
    var checksheet_Master = invocation1.responseText;
    checksheet_Master = eval('(' + checksheet_Master + ')');
    var message = checksheet_Master[0].data;
    var status = checksheet_Master[0].status;
    if (status == 1) {
        alert("Please reload");
    }
    else {
        alert(message);
    }
}
function onfail_sm(e) {
    loading_hide();
    alert(e + "onfail_sm network error");
}