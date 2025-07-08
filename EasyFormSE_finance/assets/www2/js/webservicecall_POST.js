function Webservicecall_POST(url1, params, sucesscallback, failcallback, settimeout) {
    //alert('Webservicecall');
    var timeout = 120000;
    if (settimeout != null) {
        //alert('set timeout');
        timeout = settimeout;
    }

    var timer1;
    var isIE8 = window.XDomainRequest ? true : false;
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
                // alert('callOtherDomain if IE8');
                //invocation.onload = outputResult;
                //invocation.open("GET", url, true);
                //invocation.send(null);

                invocation.onload = outputResult;
                invocation.open("POST", url, true);
                invocation.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                try {
                    invocation.setRequestHeader('uname', username);
                    invocation.setRequestHeader('u_c', uniqcode);
                } catch (e) { }
                invocation.onreadystatechange = handler;
                invocation.send(params);
            }
            else {
                //alert('callOtherDomain else');
                //invocation.open('GET', url, true);
                //invocation.onreadystatechange = handler;
                //invocation.send(null);
                invocation.open("POST", url, true);
                invocation.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

                try {
                    invocation.setRequestHeader('uname', username);
                    invocation.setRequestHeader('u_c', uniqcode);
                } catch (e) { }

                invocation.onreadystatechange = handler;
                invocation.send(params);
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

                sucesscallback(invocation);
                //outputResult();
            }
            else {
                failcallback("Network Error Please try again");
            }
        }
    }

}



function Webservicecall_WCF(url1, params, sucesscallback, failcallback, settimeout) {
    //alert('Webservicecall');
    var timeout = 120000;
    if (settimeout != null) {
        //alert('set timeout');
        timeout = settimeout;
    }

    var timer1;
    var isIE8 = window.XDomainRequest ? true : false;
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
                // alert('callOtherDomain if IE8');
                //invocation.onload = outputResult;
                //invocation.open("GET", url, true);
                //invocation.send(null);

                invocation.onload = outputResult;
                invocation.open("POST", url, true);
                invocation.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                try {
                    invocation.setRequestHeader('uname', username);
                    invocation.setRequestHeader('u_c', uniqcode);
                } catch (e) { }
                invocation.onreadystatechange = handler;
                invocation.send(params);
            }
            else {
                //alert('callOtherDomain else');
                //invocation.open('GET', url, true);
                //invocation.onreadystatechange = handler;
                //invocation.send(null);
                invocation.open("POST", url, true);
                invocation.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                try {
                    invocation.setRequestHeader('uname', username);
                    invocation.setRequestHeader('u_c', uniqcode);
                } catch (e) { }

                // added for wcf web service [21/08/2018]
                var data = JSON.parse(params);
                if (data == '' || data == null || data == undefined) { }
                else {
                    var auth1 = data[0].auth1;
                    if (auth1 == '' || auth1 == null || auth1 == undefined) { }
                    else {
                        invocation.setRequestHeader('auth1', JSON.stringify(auth1[0]));
                    }
                }

                invocation.onreadystatechange = handler;
                invocation.send(params);
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

                sucesscallback(invocation);
                //outputResult();
            }
            else {
                failcallback("Network Error Please try again");
            }
        }
    }

}