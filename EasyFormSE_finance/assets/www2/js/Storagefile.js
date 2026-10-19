function storageFile_android() {

    try {
       // alert("storag123");
        // var myvalue;

        this.setItem = function (name, value) {
           // alert("value_js_set =" + value);

            var xmlString = $.jStorage.set(name, JSON.parse(value));
            if (name === 'list_json' && window.AppShell) AppShell.flowChanged(value);
           // var xmlString = $.jStorage.set(name,value);
           // alert("naejs = " + xmlString);
            var filePath = name;
            //alert(filePath);
            //alert("varaibal Name =" + filePath + ",value=" + xmlString);

        }

        this.getItem = function (name) {
            var filePath = name;
           // alert("getnamejs = " + name);
            var value = $.jStorage.get(name);
            var finalreturn = JSON.stringify(value);
            //alert("value_js_get = " + finalreturn);
            return finalreturn;

        }


    }
    catch (e) {
        alert(e);
    }

}
//window.localStorage = new storageFile();

if (black_berry == 0) {
    //alert("hi");
    var storage = new storageFile_android();
}
