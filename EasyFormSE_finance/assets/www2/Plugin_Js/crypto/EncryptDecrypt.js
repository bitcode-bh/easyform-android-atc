function EncryptData(PlainText, Passcode) {
    //var PlainText = document.getElementById('TextOriginal').value;
    //var encryptData = document.getElementById('TextEncryptedJS');

    try {
        //Creating the Vector Key
        var iv = CryptoJS.enc.Hex.parse('a06d2b772feaaee60b85c97f51a03246');                //Encoding the Password in from UTF8 to byte array
        var Pass = CryptoJS.enc.Utf8.parse(Passcode);                //Encoding the Salt in from UTF8 to byte array
        var Salt = CryptoJS.enc.Utf8.parse("536b7950726f64756374697669747943727974696f6e");               //Creating the key in PBKDF2 format to be used during the encryption
        var key128Bits1000Iterations = CryptoJS.PBKDF2(Pass.toString(CryptoJS.enc.Utf8), Salt, { keySize: 128 / 32, iterations: 1000 });

        //Encrypting the string contained in cipherParams using the PBKDF2 key
        var encrypted = CryptoJS.AES.encrypt(PlainText, key128Bits1000Iterations, { mode: CryptoJS.mode.CBC, iv: iv, padding: CryptoJS.pad.Pkcs7 });
        return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
    }
    //Malformed UTF Data due to incorrect password
    catch (err) {
        return "";
    }
}

function decrypt(transitmessage, Passcode) {
    var iv = CryptoJS.enc.Hex.parse('a06d2b772feaaee60b85c97f51a03246');                //Encoding the Password in from UTF8 to byte array
    var Pass = CryptoJS.enc.Utf8.parse(Passcode);                //Encoding the Salt in from UTF8 to byte array
    var Salt = CryptoJS.enc.Utf8.parse("536b7950726f64756374697669747943727974696f6e");               //Creating the key in PBKDF2 format to be used during the encryption
    var key128Bits1000Iterations = CryptoJS.PBKDF2(Pass.toString(CryptoJS.enc.Utf8), Salt, { keySize: 128 / 32, iterations: 1000 });


    //var key = CryptoJS.PBKDF2(Passcode, salt, {
    //    keySize: keySize / 32,
    //    iterations: iterations
    //});

    var decrypted = CryptoJS.AES.decrypt(transitmessage, key128Bits1000Iterations, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC

    })
    return decrypted.toString(CryptoJS.enc.Utf8);
}