#include <jni.h>
#include <string>
#include <ctime>
#include <sys/stat.h>
#include <cstdio>
#include <cerrno>
#include <unistd.h>
#include <sys/system_properties.h>
#include <mntent.h>

#include <pthread.h>
#include <sys/socket.h>
#include <stdio.h>
#include <fcntl.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <android/log.h>
#include <unistd.h>
#include <errno.h>

#include <jni.h>
#include <string.h>
#include <fcntl.h>
#include <pthread.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <android/log.h>
#include <unistd.h>

#define ANDROID_OS_BUILD_TAGS "ro.build.tags"                     // Comma-separated tags describing the build, like "unsigned,debug".


extern "C" JNIEXPORT jstring JNICALL
Java_com_sky_atc_easyformse_datautils_CheckAuthOfApplication_stringFromJNI(
        JNIEnv *env,
        jclass clazz) {
    std::string raminit = "RM/5zTBNzQbkDtzMmzCDkq2nydE=\n";
    return env->NewStringUTF(raminit.c_str());
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_sky_atc_easyformse_datautils_CheckAuthOfApplication_getEmail(
        JNIEnv *env,
        jclass clazz) {
    std::string raminit = "nitin.thakor@skyproductivity.com";
    return env->NewStringUTF(raminit.c_str());
}

extern "C"
JNIEXPORT jboolean JNICALL
Java_com_sky_atc_easyformse_datautils_CheckAuthOfApplication_isCheckRoot(JNIEnv *env, jclass clazz) {
    return true;
}
extern "C"
JNIEXPORT jboolean JNICALL
Java_com_sky_atc_easyformse_datautils_CheckAuthOfApplication_isCheckDebug(JNIEnv *env, jclass clazz) {
    return false;
}

extern "C"
JNIEXPORT jboolean JNICALL
Java_com_sky_atc_easyformse_datautils_CheckAuthOfApplication_isFridaServer(JNIEnv *env, jclass clazz) {
    struct sockaddr_in sa;

    memset(&sa, 0, sizeof(sa));
    sa.sin_family = AF_INET;
    sa.sin_port = htons(27047);
    inet_aton("127.0.0.1", &(sa.sin_addr));
    int sock = socket(AF_INET, SOCK_STREAM, 0);

    if (connect(sock, (struct sockaddr *) &sa, sizeof sa) != -1) {
        return true;
    }
    return false;
}



extern "C" JNIEXPORT int JNICALL
Java_com_sky_atc_easyformse_datautils_RootUtils_checkRootAccessMethod1(JNIEnv *env, jclass clazz) {
    // TODO: implement checkRootAccessMethod1()
    int result = access("/system/app/Superuser.apk",F_OK);

//    ANDROID_LOGV( "File Access Result %d\n", result);

    int len;
    char build_tags[PROP_VALUE_MAX]; // PROP_VALUE_MAX from <sys/system_properties.h>.
    len = __system_property_get(ANDROID_OS_BUILD_TAGS, build_tags); // On return, len will equal (int)strlen(model_id).
    if(strcmp(build_tags,"test-keys") == 0){
//        ANDROID_LOGV( "Device has test keys\n", build_tags);
        result = 0;
    }
//    ANDROID_LOGV( "File Access Result %s\n", build_tags);
    return result;
}

extern "C"
JNIEXPORT int JNICALL
Java_com_sky_atc_easyformse_datautils_RootUtils_checkRootAccessMethod2(JNIEnv *env, jclass clazz) {
    // TODO: implement checkRootAccessMethod2()
    //which command is enabled only after Busy box is installed on a rooted device
    //Outpput of which command is the path to su file. On a non rooted device , we will get a null/ empty path
    //char* cmd = const_cast<char *>"which su";
    FILE* pipe = popen("which su", "r");
    if (!pipe) return -1;
    char buffer[128];
    std::string resultCmd = "";
    while(!feof(pipe)) {
        if(fgets(buffer, 128, pipe) != NULL)
            resultCmd += buffer;
    }
    pclose(pipe);

    const char *cstr = resultCmd.c_str();
    int result = -1;
    if(cstr == NULL || (strlen(cstr) == 0)){
//        ANDROID_LOGV( "Result of Which command is Null");
    }else{
        result = 0;
//        ANDROID_LOGV( "Result of Which command %s\n", cstr);
    }
    return result;
}

extern "C"
JNIEXPORT int JNICALL
Java_com_sky_atc_easyformse_datautils_RootUtils_checkRootAccessMethod3(JNIEnv *env, jclass clazz) {
    // TODO: implement checkRootAccessMethod3()
    int len;
    char build_tags[PROP_VALUE_MAX]; // PROP_VALUE_MAX from <sys/system_properties.h>.
    int result = -1;
    len = __system_property_get(ANDROID_OS_BUILD_TAGS, build_tags); // On return, len will equal (int)strlen(model_id).
    if(len >0 && strstr(build_tags,"test-keys") != NULL){
//        ANDROID_LOGV( "Device has test keys\n", build_tags);
        result = 0;
    }

    return result;
}

const char * const MG_SU_PATH[] = {
        "/data/local/",
        "/data/local/bin/",
        "/data/local/xbin/",
        "/sbin/",
        "/system/bin/",
        "/system/bin/.ext/",
        "/system/bin/failsafe/",
        "/system/sd/xbin/",
        "/su/xbin/",
        "/su/bin/",
        "/magisk/.core/bin/",
        "/system/usr/we-need-root/",
        "/system/xbin/",
        0
};

const char * const MG_EXPOSED_FILES[] = {
        "/system/lib/libxposed_art.so",
        "/system/lib64/libxposed_art.so",
        "/data/local/tmp/frida-server",
        "/system/xposed.prop",
        "/cache/recovery/xposed.zip",
        "/system/framework/XposedBridge.jar",
        "/system/bin/app_process64_xposed",
        "/system/bin/app_process32_xposed",
        "/magisk/xposed/system/lib/libsigchain.so",
        "/magisk/xposed/system/lib/libart.so",
        "/magisk/xposed/system/lib/libart-disassembler.so",
        "/magisk/xposed/system/lib/libart-compiler.so",
        "/system/bin/app_process32_orig",
        "/system/bin/app_process64_orig",
        0
};

const char * const MG_READ_ONLY_PATH[] = {
        "/system",
        "/system/bin",
        "/system/sbin",
        "/system/xbin",
        "/vendor/bin",
        "/sbin",
        "/etc",
        0
};

// The user-visible version string. E.g., "1.0" or "3.4b5".
const char *const ANDROID_OS_BUILD_VERSION_RELEASE = "ro.build.version.release";
// The internal value used by the underlying source control to represent this build.
const char *const ANDROID_OS_BUILD_VERSION_INCREMENTAL = "ro.build.version.incremental";
// The current development codename, or the string "REL" if this is a release build.
const char *const ANDROID_OS_BUILD_VERSION_CODENAME = "ro.build.version.codename";
// The user-visible SDK version of the framework.
const char *const ANDROID_OS_BUILD_VERSION_SDK = "ro.build.version.sdk";

// * The end-user-visible name for the end product.
const char *const ANDROID_OS_BUILD_MODEL = "ro.product.model";
// The manufacturer of the product/hardware.
const char *const ANDROID_OS_BUILD_MANUFACTURER = "ro.product.manufacturer";
// The name of the underlying board, like= "goldfish".
const char *const ANDROID_OS_BUILD_BOARD = "ro.product.board";
// The brand (e.g., carrier) the software is customized for, if any.
const char *const ANDROID_OS_BUILD_BRAND = "ro.product.brand";
// The name of the industrial design.
const char *const ANDROID_OS_BUILD_DEVICE = "ro.product.device";
// The name of the overall product.
const char *const ANDROID_OS_BUILD_PRODUCT = "ro.product.name";
// The name of the hardware (from the kernel command line or /proc).
const char *const ANDROID_OS_BUILD_HARDWARE = "ro.hardware";
// The name of the instruction set (CPU type + ABI convention) of native code.
const char *const ANDROID_OS_BUILD_CPU_ABI = "ro.product.cpu.abi";
// The name of the second instruction set (CPU type + ABI convention) of native code.
const char *const ANDROID_OS_BUILD_CPU_ABI2 = "ro.product.cpu.abi2";

// A build ID string meant for displaying to the user.
const char *const ANDROID_OS_BUILD_DISPLAY = "ro.build.display.id";
const char *const ANDROID_OS_BUILD_HOST = "ro.build.host";
const char *const ANDROID_OS_BUILD_USER = "ro.build.user";
// Either a changelist number, or a label like= "M4-rc20".
const char *const ANDROID_OS_BUILD_ID = "ro.build.id";
// The type of build, like= "user" or= "eng".
const char *const ANDROID_OS_BUILD_TYPE = "ro.build.type";
// Comma-separated tags describing the build, like= "unsigned,debug".
//const char *const ANDROID_OS_BUILD_TAGS = "ro.build.tags";

// A string that uniquely identifies this build. 'BRAND/PRODUCT/DEVICE:RELEASE/ID/VERSION.INCREMENTAL:TYPE/TAGS'.
const char *const ANDROID_OS_BUILD_FINGERPRINT = "ro.build.fingerprint";

const char *const ANDROID_OS_SECURE = "ro.secure";

const char *const ANDROID_OS_DEBUGGABLE = "ro.debuggable";
const char *const ANDROID_OS_SYS_INITD = "sys.initd";
const char *const ANDROID_OS_BUILD_SELINUX = "ro.build.selinux";
//see https://android.googlesource.com/platform/system/core/+/master/adb/services.cpp#86
const char *const SERVICE_ADB_ROOT = "service.adb.root";

struct mntent *getMntent(FILE *fp, struct mntent *e, char *buf, int buf_len) {

    while (fgets(buf, buf_len, fp) != NULL) {
        // Entries look like "/dev/block/vda /system ext4 ro,seclabel,relatime,data=ordered 0 0".
        // That is: mnt_fsname mnt_dir mnt_type mnt_opts mnt_freq mnt_passno.
        int fsname0, fsname1, dir0, dir1, type0, type1, opts0, opts1;
        if (sscanf(buf, " %n%*s%n %n%*s%n %n%*s%n %n%*s%n %d %d",
                   &fsname0, &fsname1, &dir0, &dir1, &type0, &type1, &opts0, &opts1,
                   &e->mnt_freq, &e->mnt_passno) == 2) {
            e->mnt_fsname = &buf[fsname0];
            buf[fsname1] = '\0';
            e->mnt_dir = &buf[dir0];
            buf[dir1] = '\0';
            e->mnt_type = &buf[type0];
            buf[type1] = '\0';
            e->mnt_opts = &buf[opts0];
            buf[opts1] = '\0';
            return e;
        }
    }
    return NULL;
}


bool isPresentMntOpt(const struct mntent *pMnt, const char *pOpt) {
    char *token = pMnt->mnt_opts;
    const char *end = pMnt->mnt_opts + strlen(pMnt->mnt_opts);
    const size_t optLen = strlen(pOpt);
    while (token != NULL) {
        const char *tokenEnd = token + optLen;
        if (tokenEnd > end) break;
        if (memcmp(token, pOpt, optLen) == 0 &&
            (*tokenEnd == '\0' || *tokenEnd == ',' || *tokenEnd == '=')) {
            return true;
        }
        token = strchr(token, ',');
        if (token != NULL) {
            token++;
        }
    }
    return false;
}

static char *concat2str(const char *pString1, const char *pString2) {
    char *result;
    size_t lengthBuffer = 0;

    lengthBuffer = strlen(pString1) +
                   strlen(pString2) + 1;
    result = static_cast<char *>(malloc(lengthBuffer));
    if (result == NULL) {
//        GR_LOGW("malloc failed\n");
        return NULL;
    }
    memset(result, 0, lengthBuffer);
    strcpy(result, pString1);
    strcat(result, pString2);
    return result;
}

static bool
isBadPropertyState(const char *key, const char *badValue, bool isObligatoryProperty, bool isExact) {
    if (badValue == NULL) {
//        GR_LOGE("badValue may not be NULL");
        return false;
    }
    if (key == NULL) {
//        GR_LOGE("key may not be NULL");
        return false;
    }
    char value[PROP_VALUE_MAX + 1];
    int length = __system_property_get(key, value);
    bool result = false;
    /* A length 0 value indicates that the property is not defined */
    if (length > 0) {
//        GR_LOGI("property:[%s]==[%s]", key, value);
        if (isExact) {
            if (strcmp(value, badValue) == 0) {
//                GR_LOGW("bad value[%s] equals to [%s] in the property [%s]", value, badValue, key);
                result = true;
            }
        } else {
            if (strlen(value) >= strlen(badValue) && strstr(value, badValue) != NULL) {
//                GR_LOGW("bad value[%s] found in [%s] in the property [%s]", value, badValue, key);
                result = true;
            }
        }
    } else {
//        GR_LOGI("[%s] property not found", key);
        if (isObligatoryProperty) {
            result = true;
        }
    }
    return result;
}

bool isDetectedTestKeys() {
    const char *TEST_KEYS_VALUE = "test-keys";
    return isBadPropertyState(ANDROID_OS_BUILD_TAGS, TEST_KEYS_VALUE, true, false);
}

bool isDetectedDevKeys() {
    const char *DEV_KEYS_VALUE = "dev-keys";
    return isBadPropertyState(ANDROID_OS_BUILD_TAGS, DEV_KEYS_VALUE, true, false);
}

bool isNotFoundReleaseKeys() {
    const char *RELEASE_KEYS_VALUE = "release-keys";
    return !isBadPropertyState(ANDROID_OS_BUILD_TAGS, RELEASE_KEYS_VALUE, false, true);
}

bool isFoundWrongPathPermission() {

    bool result = false;
    FILE *file = fopen("/proc/mounts", "r");
    char mntent_strings[BUFSIZ];
    if (file == NULL) {
//        GR_LOGE("setmntent");
        return result;
    }

    struct mntent ent = {0};
    while (NULL != getMntent(file, &ent, mntent_strings, sizeof(mntent_strings))) {
        for (size_t i = 0; MG_READ_ONLY_PATH[i]; i++) {
            if (strcmp((&ent)->mnt_dir, MG_READ_ONLY_PATH[i]) == 0 &&
                isPresentMntOpt(&ent, "rw")) {
//                GR_LOGI("%s %s %s %s\n", (&ent)->mnt_fsname, (&ent)->mnt_dir, (&ent)->mnt_opts,
//                        (&ent)->mnt_type);
                result = true;
                break;
            }
        }
        memset(&ent, 0, sizeof(ent));
    }
    fclose(file);
    return result;
}


bool isFoundDangerousProps() {
    const char *BAD_DEBUGGABLE_VALUE = "1";
    const char *BAD_SECURE_VALUE = "0";
    const char *BAD_SYS_INITD_VALUE = "1";
    const char *BAD_SERVICE_ADB_ROOT_VALUE = "1";

    bool result = isBadPropertyState(ANDROID_OS_DEBUGGABLE, BAD_DEBUGGABLE_VALUE, true, true) ||
                  isBadPropertyState(SERVICE_ADB_ROOT, BAD_SERVICE_ADB_ROOT_VALUE, false, true) ||
                  isBadPropertyState(ANDROID_OS_SECURE, BAD_SECURE_VALUE, true, true) ||
                  isBadPropertyState(ANDROID_OS_SYS_INITD, BAD_SYS_INITD_VALUE, false, true);

    return result;
}

bool isPermissiveSelinux() {
    const char *BAD_VALUE = "0";
    return isBadPropertyState(ANDROID_OS_BUILD_SELINUX, BAD_VALUE, false, false);
}

bool isSuExists() {
    char buf[BUFSIZ];
    char *str = NULL;
    char *temp = NULL;
    size_t size = 1;  // start with size of 1 to make room for null terminator
    size_t strlength;

    FILE *pipe = popen("which su", "r");
    if (pipe == NULL) {
//        GR_LOGI("pipe is null");
        return false;
    }

    while (fgets(buf, sizeof(buf), pipe) != NULL) {
        strlength = strlen(buf);
        temp = static_cast<char *>(realloc(str, size + strlength));  // allocate room for the buf that gets appended
        if (temp == NULL) {
            // allocation error
//            GR_LOGE("Error (re)allocating memory");
            pclose(pipe);
            if (str != NULL) {
                free(str);
            }
            return false;
        } else {
            str = temp;
        }
        strcpy(str + size - 1, buf);
        size += strlength;
    }
    pclose(pipe);
//    GR_LOGW("A size of the result from pipe is [%zu], result:\n [%s] ", size, str);
    if (str != NULL) {
        free(str);
    }
    return size > 1 ? true : false;
}

static bool isAccessedFile(const char *path) {
    int result = access(path, F_OK);
//    GR_LOGV("[%s] has been accessed with result: [%d]", path, result);
    return result == 0 ? true : false;
}

static bool isFoundBinaryFromArray(const char *const *array, const char *binary) {
    for (size_t i = 0; array[i]; ++i) {
        char *checkedPath = concat2str(array[i], binary);
        if (checkedPath == NULL) { // malloc failed
            return false;
        }
        bool result = isAccessedFile(checkedPath);
        free(checkedPath);
        if (result) {
            return result;
        }
    }
    return false;
}

bool isAccessedSuperuserApk() {
    return isAccessedFile("/system/app/Superuser.apk");
}

bool isFoundResetprop() {
    return isAccessedFile("/data/magisk/resetprop");
}

bool isFoundSuBinary() {
    return isFoundBinaryFromArray(MG_SU_PATH, "su");
}

bool isFoundBusyboxBinary() {
    return isFoundBinaryFromArray(MG_SU_PATH, "busybox");
}

bool isFoundXposed() {
    for (size_t i = 0; MG_EXPOSED_FILES[i]; ++i) {
        bool result = isAccessedFile(MG_EXPOSED_FILES[i]);
        if (result) {
            return result;
        }
    }
    return false;
}

bool isFoundHooks() {
    bool result = false;
    pid_t pid = getpid();
    char maps_file_name[512];
    sprintf(maps_file_name, "/proc/%d/maps", pid);
//    GR_LOGI("try to open [%s]", maps_file_name);
    const size_t line_size = BUFSIZ;
    char *line = static_cast<char *>(malloc(line_size));
    if (line == NULL) {
        return result;
    }
    FILE *fp = fopen(maps_file_name, "r");
    if (fp == NULL) {
        free(line);
        return result;
    }
    memset(line, 0, line_size);
    const char *substrate = "com.saurik.substrate";
    const char *xposed = "XposedBridge.jar";
    while (fgets(line, line_size, fp) != NULL) {
        const size_t real_line_size = strlen(line);
        if ((real_line_size >= strlen(substrate) && strstr(line, substrate) != NULL) ||
            (real_line_size >= strlen(xposed) && strstr(line, xposed) != NULL)) {
//            GR_LOGI("found in [%s]: [%s]", maps_file_name, line);
            result = true;
            break;
        }
    }
    free(line);
    fclose(fp);
    return result;
}


extern "C" JNIEXPORT jboolean JNICALL
Java_com_sky_atc_easyformse_datautils_MeatGrinder_isDetectedTestKeys(JNIEnv *env, jclass clazz) {
    // TODO: implement isDetectedTestKeys()
    return (jboolean) isDetectedTestKeys();
}


extern "C" JNIEXPORT jboolean JNICALL
Java_com_sky_atc_easyformse_datautils_MeatGrinder_isDetectedDevKeys(JNIEnv *env, jclass clazz) {
    // TODO: implement isDetectedDevKeys()
    return (jboolean) isDetectedDevKeys();
}


extern "C" JNIEXPORT jboolean JNICALL
Java_com_sky_atc_easyformse_datautils_MeatGrinder_isNotFoundReleaseKeys(JNIEnv *env, jclass thiz) {
    // TODO: implement isNotFoundReleaseKeys()
    return (jboolean) isNotFoundReleaseKeys();
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_sky_atc_easyformse_datautils_MeatGrinder_isFoundDangerousProps(JNIEnv *env, jclass thiz) {
    // TODO: implement isFoundDangerousProps()
    return (jboolean) isFoundDangerousProps();
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_sky_atc_easyformse_datautils_MeatGrinder_isPermissiveSelinux(JNIEnv *env, jobject thiz) {
    // TODO: implement isPermissiveSelinux()
    return (jboolean) isPermissiveSelinux();
}


extern "C" JNIEXPORT jboolean JNICALL
Java_com_sky_atc_easyformse_datautils_MeatGrinder_isSuExists(JNIEnv *env, jclass thiz) {
    // TODO: implement isSuExists()
    return (jboolean) isSuExists();
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_sky_atc_easyformse_datautils_MeatGrinder_isAccessedSuperuserApk(JNIEnv *env,
                                                                         jclass thiz) {
    // TODO: implement isAccessedSuperuserApk()
    return (jboolean) isAccessedSuperuserApk();
}


extern "C" JNIEXPORT jboolean JNICALL
Java_com_sky_atc_easyformse_datautils_MeatGrinder_isFoundSuBinary(JNIEnv *env, jclass thiz) {
    // TODO: implement isFoundSuBinary()
    return (jboolean) isFoundSuBinary();
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_sky_atc_easyformse_datautils_MeatGrinder_isFoundBusyboxBinary(JNIEnv *env, jclass thiz) {
    // TODO: implement isFoundBusyboxBinary()
    return (jboolean) isFoundBusyboxBinary();
}


extern "C" JNIEXPORT jboolean JNICALL
Java_com_sky_atc_easyformse_datautils_MeatGrinder_isFoundXposed(JNIEnv *env, jclass thiz) {
    // TODO: implement isFoundXposed()
    return (jboolean) isFoundXposed();
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_sky_atc_easyformse_datautils_MeatGrinder_isFoundResetprop(JNIEnv *env, jclass thiz) {
    // TODO: implement isFoundResetprop()
    return (jboolean) isFoundResetprop();
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_sky_atc_easyformse_datautils_MeatGrinder_isFoundWrongPathPermission(JNIEnv *env,
                                                                             jclass thiz) {
    // TODO: implement isFoundWrongPathPermission()
    return (jboolean) isFoundWrongPathPermission();
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_sky_atc_easyformse_datautils_MeatGrinder_isFoundHooks(JNIEnv *env, jclass thiz) {
    // TODO: implement isFoundHooks()
      return (jboolean) isFoundHooks();
}


