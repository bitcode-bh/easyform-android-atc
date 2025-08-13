package com.sky.atc.easyformse.download;

import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.sqlitewraper;

import io.michaelrocks.paranoid.Obfuscate;

@Obfuscate
class DownloadConstant {

    //Download URL And Method
    static final String DOWNLOAD_URL = sqlitewraper.context.getResources().getString(R.string.TASKDOWNLOADURL);
    static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.DOWNLOADWCFURL);
    static final String METHOD_COUNTER = "Offline_Download_Totalcounter_For_Multi_Role";
//    static final String METHOD_COUNTER_TASK = "Wcf_NewDownloadStreamming_Service_TaskCount";

    static final String METHOD_COUNTER_TASK = "Wcf_NewDownloadStreamming_Service_TaskCount_FlowidList";
    static final String METHOD_USERDEFINE_FLOWMASTER = "Wcf_offline_download_User_Define_Flow_Master_with_multi_role";
    // NEW URL FOR USERDEFINE FLOWMASTER   new url  replace for download time remove space in databse 04-04-2024
    static final String METHOD_USERDEFINE_FLOWMASTER_NEW = "Wcf_offline_download_User_Define_Flow_Master_with_multi_role_new";
    static final String METHOD_CHECKSHEET = "Offline_Download_Checksheet_Master";
//    static final String METHOD_FLOWMASTER = "Offline_Download_Checksheet_Flow_Master"; //old webservice
    static final String METHOD_FLOWMASTER = "Offline_Download_Checksheet_Flow_Master_AppId";
    static final String METHOD_TASKUPDATE_USERSWAP = "Wcf_Off_Download_task_master_After_UserSwap_UpdateTask_HV";
    static final String METHOD_TASKDOWNLOAD_AFTERUSERSWAP = "Wcf_Off_Download_task_master_After_UserSwap_HV_New";
    static final String METHOD_THRESHOLD_NEW = "download_company_threshold_master";
}
