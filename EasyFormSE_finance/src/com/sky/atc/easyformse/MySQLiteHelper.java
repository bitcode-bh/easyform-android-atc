package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.content.ContentValues;
import android.content.Context;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.database.SQLException;
import android.util.Log;

import com.sky.atc.easyformse.download.DownloadUtils;

import net.sqlcipher.database.SQLiteDatabase;
import net.sqlcipher.database.SQLiteOpenHelper;

import java.util.ArrayList;

import io.michaelrocks.paranoid.Obfuscate;


//Main Database Creation class
@Obfuscate
public class MySQLiteHelper extends SQLiteOpenHelper {

    private static final String DATABASE_NAME = "location.db";
    private static final int DATABASE_VERSION = 73;
    private static final String DATABASE_CREATE0 = " CREATE TABLE Login_Master (username TEXT,password TEXT, u_c TEXT, imei TEXT, company_id INTEGER,user_id INTEGER,appid TEXT,servermilli TEXT,devicetype TEXT,appversion TEXT,main_milli,sub_milli,main_id,sub_id) ;";

    // Database creation sql statement
    private static final String DATABASE_CREATE1 = " CREATE TABLE APP_states (ITEAM TEXT,VALUE TEXT);";
    private static final String DATABASE_CREATE3 = " CREATE TABLE location_log (_id INTEGER PRIMARY KEY,username TEXT,cellid TEXT,lac TEXT,lat TEXT,lon TEXT,date TEXT,date_s TEXT,accuracy TEXT,provider Text,IS_SEND NUMERIC,IS_LOC NUMERIC,filename TEXT,address TEXT,wait_time_s TEXT,wait_time TEXT,speed TEXT );";
    private static final String DATABASE_index5 = "  CREATE INDEX location_log_lat_lon ON location_log (lat,lon);";
    private static final String DATABASE_CREATE20 = " CREATE TABLE total_file(filename TEXT,fileid TEXT,d_url TEXT,is_download TEXT,m_date TEXT,m_milli TEXT);";
    private static final String DATABASE_CREATE21 = " CREATE TABLE geofence(_id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT,fileid TEXT,place TEXT,lon TEXT,lat TEXT,radius TEXT,date TEXT,place_name TEXT,is_reg TEXT);";
    private static final String DATABASE_CREATE13 = " CREATE TABLE checksheet(_id INTEGER PRIMARY KEY AUTOINCREMENT,checksheetid INTEGER,c_name TEXT,c_type INTEGER,data TEXT,buttons TEXT,step TEXT,subcategory TEXT,date TEXT,millisecond LONG,step_short_name TEXT,stepid INTEGER);";
    private static final String DATABASE_CREATE14 = " CREATE TABLE task_master(tid INTEGER PRIMARY KEY AUTOINCREMENT,p_tid INTEGER,p_server_task_id INTEGER,task_id TEXT,server_task_id INTEGER,flag TEXT,user_id INTEGER,username TEXT,rate FLOAT,siteid TEXT,site_flag TEXT,server_task_flag TEXT,site_name TEXT,site_address TEXT,percentage FLOAT,survey_date TEXT,lat FLOAT,long FLOAT,inspect_count INTEGER,checksheetid INTEGER,height FLOAT,display_siteid TEXT,step INTEGER,status INTEGER,upload_date TEXT,updateddate TEXT,millisecond TEXT, end_of_date TEXT, data TEXT,tower_type TEXT,moduleid TEXT,module_name TEXT,moduledef TEXT,srnumber TEXT, global_var TEXT,is_down_complete TEXT,Dynamic_Globalvar TEXT,punch_flag TEXT, in_ms TEXT,out_ms TEXT,duration TEXT,is_delete_photo TEXT,survey_ms TEXT,is_delete_log TEXT,initialstatus TEXT,edit_global_var TEXT,is_delete_sub TEXT,list_html TEXT,islogdown TEXT DEFAULT 0,que_milli TEXT DEFAULT 0,que_id TEXT DEFAULT 0,edit_flag TEXT DEFAULT 0,p_udf_id TEXT DEFAULT 0,match_temp_id TEXT DEFAULT 0,p_match_temp_id TEXT DEFAULT 0,is_valid_log TEXT,notiflag TEXT DEFAULT 0,tripflag TEXT DEFAULT 0,is_online TEXT DEFAULT 0, response_status TEXT,columndata TEXT);";
    private static final String DATABASE_CREATE15 = " CREATE TABLE User_Define_Flow_Master_change(f_id INTEGER PRIMARY KEY AUTOINCREMENT,id INTEGER,rollid INTEGER,flow_name TEXT,flow_name1 TEXT,type TEXT,flow_id INTEGER,p_id INTEGER,level_position INTEGER,data TEXT,company_id INTEGER,millisecond TEXT,isflag INTEGER,task_millisecond TEXT);";
    private static final String DATABASE_CREATE42 = " CREATE TABLE User_Define_Flow_Master(f_id INTEGER PRIMARY KEY AUTOINCREMENT,id INTEGER,rollid INTEGER,flow_name TEXT,flow_name1 TEXT,type TEXT,flow_id INTEGER,p_id INTEGER,level_position INTEGER,data TEXT,company_id INTEGER,millisecond LONG,isflag INTEGER,main_sid TEXT,task_millisecond LONG,sub_sid TEXT,sub_task_millisecond LONG,main_que_id TEXT,main_que_millisecond LONG,sub_que_id TEXT,sub_que_millisecond LONG,matchcondition TEXT,is_delete TEXT);";
    private static final String DATABASE_CREATE29 = " CREATE TABLE p_master(pid INTEGER PRIMARY KEY AUTOINCREMENT,tid INTEGER, que_id INTEGER, checksheetid INTEGER, p_name TEXT,p_url TEXT,p_key TEXT,p_value TEXT,p_type TEXT,flag TEXT,Ph_id TEXT,it_id TEXT,millisecond TEXT,match_temp_id TEXT DEFAULT 0,que_name TEXT);";
    private static final String DATABASE_CREATE30 = " CREATE TABLE f_master(fid INTEGER PRIMARY KEY AUTOINCREMENT,c_id INTEGER,c_type INTEGER,tid INTEGER,f_name TEXT,f_data TEXT,f_key TEXT,f_value TEXT,f_type TEXT,flag TEXT,step TEXT, lat TEXT, long TEXT, millisecond TEXT,match_temp_id TEXT DEFAULT 0);";
    private static final String DATABASE_CREATE31 = " CREATE TABLE track_master(_id INTEGER PRIMARY KEY,cellid TEXT,lac TEXT,c_lat TEXT,c_lon TEXT,date TEXT,date_s TEXT,c_accuracy TEXT,provider Text,IS_SEND NUMERIC,IS_LOC NUMERIC,filename TEXT,address TEXT,lat TEXT,lon TEXT,accuracy  TEXT,username TEXT,speed TEXT,tripflag TEXT,locationtime TEXT,waypoint TEXT,waypoint_type TEXT);";
    private static final String DATABASE_CREATE34 = " CREATE TABLE track_master_new(_id INTEGER PRIMARY KEY,cellid TEXT,lac TEXT,c_lat TEXT,c_lon TEXT,date TEXT,date_s TEXT,c_accuracy TEXT,provider Text,IS_SEND NUMERIC,IS_LOC NUMERIC,filename TEXT,address TEXT,lat TEXT,lon TEXT,accuracy TEXT,username TEXT,speed TEXT);";
    private static final String DATABASE_CREATE33 = " CREATE TABLE task_master_history(tid_n INTEGER PRIMARY KEY AUTOINCREMENT,tid INTEGER,p_tid INTEGER,p_server_task_id INTEGER,task_id TEXT,server_task_id INTEGER,flag TEXT,user_id INTEGER,username TEXT,rate FLOAT,siteid TEXT,site_flag TEXT,server_task_flag TEXT,site_name TEXT,site_address TEXT,percentage FLOAT,survey_date TEXT,lat FLOAT,long FLOAT,inspect_count INTEGER,checksheetid INTEGER,height FLOAT,display_siteid TEXT,step INTEGER,status INTEGER,upload_date TEXT,updateddate TEXT,millisecond TEXT, end_of_date TEXT, data TEXT,tower_type TEXT,moduleid TEXT,module_name TEXT,moduledef TEXT,srnumber TEXT, global_var TEXT,Dynamic_Globalvar TEXT,punch_flag TEXT, in_ms TEXT,out_ms TEXT,duration TEXT,is_delete_photo TEXT,survey_ms TEXT,is_delete_log TEXT,initialstatus TEXT,edit_global_var TEXT,is_delete_sub TEXT,list_html TEXT,islogdown TEXT DEFAULT 0,que_milli TEXT DEFAULT 0,que_id TEXT DEFAULT 0,edit_flag TEXT DEFAULT 0,p_udf_id TEXT DEFAULT 0,match_temp_id TEXT DEFAULT 0,entry_type TEXT DEFAULT 0,local_milli TEXT DEFAULT 0,role_id TEXT DEFAULT 0,old_status INTEGER);";
    private static final String DATABASE_CREATE32 = " CREATE TABLE refrence_master(n_lat TEXT,n_lon TEXT,accuracy  TEXT);";
    private static final String DATABASE_CREATE35 = " CREATE TABLE download_counter(_id INTEGER PRIMARY KEY AUTOINCREMENT,counter INTEGER,status TEXT,counter_name TEXT,total_count INTEGER, globalcounter INTEGER);";
    private static final String DATABASE_CREATE40 = " CREATE TABLE product_master(_id INTEGER PRIMARY KEY AUTOINCREMENT, prod_code TEXT, prod_name TEXT, prod_point INTEGER, prod_price FLOAT);";
    private static final String DATABASE_CREATE22 = " CREATE TABLE geoalert(id INTEGER PRIMARY KEY AUTOINCREMENT,transition TEXT,Geoid TEXT,transitionType INTEGER,send TEXT,d_date TEXT,c_date TEXT  );";
    private static final String DATABASE_CREATE24 = " CREATE TABLE gp_total( _id INTEGER PRIMARY KEY AUTOINCREMENT,g_ontime TEXT,g_offtime TEXT,gp_ontime TEXT,gp_offtime TEXT,phone_on TEXT,phone_off TEXT ,battery TEXT,send TEXT,path TEXT,title TEXT,username TEXt,gp_duration TEXT,gprs_duration TEXT,phone_duration TEXT,date TEXT,appstop TEXT,appstart TEXT,appduration TEXT);";
    private static final String DATABASE_CREATE23 = " CREATE TABLE gpsrec( ID TEXT,g_ontime TEXT,g_offtime TEXT,gp_ontime TEXT,gp_offtime TEXT,phone_on TEXT,phone_off TEXT,battery INTEGER,date TEXT);";
    private static final String DATABASE_CREATE11 = " CREATE TABLE gcm_server(_id INTEGER PRIMARY KEY AUTOINCREMENT,gid TEXT,username TEXT,version TEXT,flag TEXT,date TEXT,imei TEXT,company_id INTEGER);";
    private static final String DATABASE_CREATE12 = " CREATE TABLE flow_master(_id INTEGER PRIMARY KEY AUTOINCREMENT,moduleid INTEGER,company_id INTEGER,module_name TEXT,millisecond LONG, checksheet_id INTEGER, data TEXT);";
    private static final String DATABASE_CREATE17 = " CREATE TABLE lat_plug(_id INTEGER PRIMARY KEY AUTOINCREMENT,tid INTEGER,sid INTEGER,step INTEGER,chkid INTEGER,s_lat TEXT,s_lon TEXT,d_lat TEXT,d_lon TEXT,issend TEXT,isshort TEXT,sh_path TEXT,ac_path TEXT,isacc TEXT,dv_eve TEXT,min_milli TEXT,max_milli TEXT,way_point TEXT,odometer_point TEXT,Event TEXT,iseve  TEXT,isdv_eve TEXT,trip_status TEXT,ETA TEXT,site_name TEXT,unique_trip_id TEXT,last_upload_ms TEXT,trip_shflag TEXT,llat TEXT,llon TEXT,s_lat_eta TEXT,s_lon_eta TEXT,distance TEXT,fused_ac TEXT,etaflag TEXT,serviceoutage_flag TEXT DEFAULT 0,match_temp_id TEXT DEFAULT 0);";
    private static final String DATABASE_CREATE2 = " CREATE TABLE pdf(p_id INTEGER PRIMARY KEY AUTOINCREMENT,path text,is_send TEXT,tid INTEGER,que_id INTEGER,checksheetid INTEGER,username TEXT,name TEXT);"; // p_id,s_id,path,o_name,name
    private static final String DATABASE_CREATE5 = " CREATE TABLE Events(_id INTEGER PRIMARY KEY AUTOINCREMENT,Event_strt text,Event_end TEXT,username TEXT,Event_type TEXT,is_send TEXT,lat TEXT,lon TEXT,th_s TEXT,duration TEXT,battery TEXT,timezone TEXT,utcstart TEXT,utcend TEXT,imei TEXT,appid TEXT,userid TEXT,maxviolation TEXT DEFAULT 0, tid TEXT);"; // p_id,s_id,path,o_name,name
    private static final String DATABASE_CREATE6 = " CREATE TABLE Events_check(_id INTEGER PRIMARY KEY AUTOINCREMENT,username text,Event_name text,confidence TEXT,time TEXT,time1 TEXT,is_send TEXT);"; // p_id,s_id,path,o_name,name
    private static final String DATABASE_CREATE7 = " CREATE TABLE Thresold(_id INTEGER PRIMARY KEY AUTOINCREMENT,speed text,normal_acc text,normal_deacc TEXT,hard_acc TEXT,hard_deacc TEXT,gap_milli TEXT);"; // p_id,s_id,path,o_name,name
    private static final String DATABASE_CREATE8 = " CREATE TABLE Features(_id INTEGER PRIMARY KEY AUTOINCREMENT,istrip text,isact_track TEXT,isloc_track TEXT,loc_polling_time TEXT,loc_accuracy TEXT);"; // p_id,s_id,path,o_name,name
    private static final String DATABASE_CREATE18 = " CREATE TABLE video(_id INTEGER PRIMARY KEY AUTOINCREMENT, tid INTEGER, que_id INTEGER, checksheetid INTEGER, p_name TEXT, or_path text, con_path text,type text,issend_track TEXT,chunk_number TEXT,offset TEXT,totalbyte TEXT,CompanyId TEXT,CustomerUniq TEXT,Ph_id TEXT,it_id TEXT,millisecond TEXT,step_No TEXT,size TEXT,upload_type TEXT,base_path TEXT,actual_name TEXT,sharepoint_url TEXT,match_temp_id TEXT DEFAULT 0,que_name TEXT);"; // p_id,s_id,path,o_name,name
    private static final String DATABASE_CREATE19 = " CREATE TABLE download_video(_id INTEGER PRIMARY KEY AUTOINCREMENT,sid INTEGER, tid INTEGER, que_id INTEGER, checksheetid INTEGER, p_name TEXT, or_path text, con_path text,isdown_track TEXT,chunk_number TEXT,offset TEXT,totalbyte TEXT,CompanyId TEXT,CustomerUniq TEXT,Ph_id TEXT,it_id TEXT,millisecond TEXT,progress TEXT,download_id TEXT,download_url TEXT,upload_type TEXT,base_path TEXT,actual_name TEXT,sharepoint_url TEXT,parent_task_id INTEGER DEFAULT 0);"; // p_id,s_id,path,o_name,name
    private static final String DATABASE_CREATE25 = " CREATE TABLE download_test(_id INTEGER PRIMARY KEY AUTOINCREMENT,data TEXT);"; // p_id,s_id,path,o_name,name
    private static final String DATABASE_CREATE41 = " CREATE TABLE upload_file_clone(uid INTEGER PRIMARY KEY AUTOINCREMENT,tid INTEGER,Siteid TEXT,chckid INTEGER,servertaskid INTEGER,stepid INTEGER,ques_id INTEGER,fid INTEGER,f_name TEXT, f_data TEXT, f_key TEXT, f_type TEXT,p_name TEXT,pid INTEGER, ERROR TEXT,type TEXT,username TEXT,flag TEXT,time TEXT,SERVER_Error TEXT,status INTEGER);";
    private static final String DATABASE_CREATE43 = " CREATE TABLE act_master(uid INTEGER PRIMARY KEY AUTOINCREMENT,act_state INTEGER,tripid TEXT,starttime TEXT, stoptime TEXT,path TEXT,flag TEXT);";
    private static final String DATABASE_CREATE44 = " CREATE TABLE punch_master(pnid INTEGER PRIMARY KEY AUTOINCREMENT,tid INTEGER,millisecond TEXT,UTCmillisecond TEXT,username TEXT,userid TEXT,appid TEXT,lat TEXT,lon TEXT,gprs TEXT,gps TEXT,address TEXT,punch_flag TEXT,punch_upload_flag TEXT,match_temp_id TEXT DEFAULT 0);";
    private static final String DATABASE_CREATE45 = " CREATE TABLE fake_location (id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT,user_id INTEGER,appid TEXT,appversion TEXT,milliseonds TEXT,flag TEXT) ;";
    private static final String DATABASE_CREATE46 = " CREATE TABLE geofence_tracking (id INTEGER PRIMARY KEY AUTOINCREMENT,place_id TEXT,latitude TEXT,longitude TEXT,milisecond TEXT,duration TEXT,radius TEXT,flow_id INTEGER) ;";
    private static final String DATABASE_CREATE47 = " CREATE TABLE geofence_user_tracking_detail (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT,place_id TEXT,in_time TEXT,out_time TEXT,duration TEXT,is_send TEXT,appid TEXT,flowid TEXT,service_outage TEXT);";
    private static final String DATABASE_INDEX_DOWNLOAD_COUNTER = "CREATE INDEX index_download_counter_id ON download_counter (_id)";
    private static final String DATABASE_CREATE48 = " CREATE TABLE Task_master_revert (id INTEGER PRIMARY KEY AUTOINCREMENT,tid INTEGER,p_tid INTEGER,server_task_id INTEGER,p_server_task_id INTEGER,username TEXT,old_status INTEGER,revert_status INTEGER,revert_type TEXT,millisecond TEXT);";
    private static final String DATABASE_CREATE49 = " CREATE TABLE delete_old_task (id INTEGER PRIMARY KEY AUTOINCREMENT,udf_id INTEGER,role_id INTEGER,flow_id INTEGER,allowstatus TEXT,isoffline TEXT);";
    private static final String DATABASE_CREATE50 = " CREATE TABLE meterreading (id INTEGER PRIMARY KEY AUTOINCREMENT,detectedtext TEXT,sid TEXT,checksheetid TEXT,queid TEXT,detectiontype TEXT,imgpath TEXT,orpath TEXT,Unique_id TEXT,hasResponse INTEGER);";
    private static final String DATABASE_CREATE51 = "CREATE TABLE deleted_task (id INTEGER PRIMARY KEY AUTOINCREMENT,tid INTEGER,server_task_id INTEGER,dataTime TEXT);";
    private static final String DATABASE_CREATE52 = " CREATE TABLE Thresold_New(_id INTEGER PRIMARY KEY AUTOINCREMENT,threshold_id INTEGER,speed text,normal_acc text,normal_deacc TEXT,hard_acc TEXT,hard_deacc TEXT,gap_milli TEXT,speed_violation_time TEXT ,territory TEXT ,vehicle_type TEXT ,millisecond TEXT);"; // p_id,s_id,path,o_name,name

    private static final String DATABASE_CREATE53 = " CREATE TABLE download_live_url(_id INTEGER PRIMARY KEY AUTOINCREMENT,video_url_id INTEGER,live_url text,download_url_path text);";

    //---------------Indexing-----------//
    private static final String DATABASE_INDEX_USER_DEFINE_FLOW_MASTER = "CREATE INDEX index_User_Define_Flow_Master_id ON User_Define_Flow_Master (id)";
    private static final String DATABASE_INDEX_USER_DEFINE_FLOW_MASTER2 = "CREATE INDEX index_User_Define_Flow_Master_typef ON User_Define_Flow_Master (type,flow_id)";
    private static final String DATABASE_INDEX_USER_DEFINE_FLOW_MASTER3 = "CREATE INDEX index_User_Define_Flow_Master_flow ON User_Define_Flow_Master (flow_id)";
    private static final String DATABASE_INDEX_CHECKSHEET = "CREATE INDEX index_checksheet_step ON checksheet (checksheetid,step)";
    private static final String DATABASE_INDEX_FLOW_MASTER = "CREATE INDEX index_flow_master_moduleid ON flow_master (moduleid)";
    private static final String DATABASE_INDEX_TASK_MASTER1 = "CREATE INDEX index_task_master_servertid ON task_master (server_task_id)";
    private static final String DATABASE_INDEX_TASK_MASTER2 = "CREATE INDEX index_task_master_user_servertflag ON task_master (username,server_task_flag)";
    private static final String DATABASE_INDEX_TASK_MASTER3 = "CREATE INDEX index_task_master_user_sflag ON task_master (username,site_flag)";
    private static final String DATABASE_INDEX_TASK_MASTER4 = "CREATE INDEX index_task_master_flag ON task_master (flag)";
    private static final String DATABASE_INDEX_TASK_MASTER5 = "CREATE INDEX index_task_master_select_list ON task_master (moduleid,username,is_down_complete,status,p_tid)";
    private static final String DATABASE_INDEX_F_MASTER1 = "CREATE INDEX index_f_master_tsc ON f_master (tid,step,c_id)";
    private static final String DATABASE_INDEX_F_MASTER2 = "CREATE INDEX index_f_master_flag ON f_master (flag)";
    private static final String DATABASE_INDEX_F_MASTER3 = "CREATE INDEX index_f_master_select_list ON f_master (c_id,step)";
    private static final String DATABASE_INDEX_LOCATION_LOG1 = "CREATE INDEX index_location_log_is_send ON location_log (IS_SEND)";
    private static final String DATABASE_INDEX_LOCATION_LOG2 = "CREATE INDEX index_location_log_lat_lon ON location_log (lat,lon)";
    private static final String DATABASE_INDEX_P_MASTER = "CREATE INDEX index_p_master_flag ON p_master (flag)";
    private static String versionName;

    public MySQLiteHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase database) {
        database.execSQL(DATABASE_CREATE0);
        database.execSQL(DATABASE_CREATE1);
        database.execSQL(DATABASE_CREATE3);
        database.execSQL(DATABASE_CREATE2);
        database.execSQL(DATABASE_CREATE5);
        database.execSQL(DATABASE_CREATE7);
        database.execSQL(DATABASE_CREATE8);
        database.execSQL(DATABASE_CREATE18);

        database.execSQL(DATABASE_CREATE12);
        database.execSQL(DATABASE_index5);
        database.execSQL(DATABASE_CREATE20);
        database.execSQL(DATABASE_CREATE21);
        database.execSQL(DATABASE_CREATE29);
        database.execSQL(DATABASE_CREATE30);
        database.execSQL(DATABASE_CREATE31);
        database.execSQL(DATABASE_CREATE32);
        database.execSQL(DATABASE_CREATE41);

        database.execSQL(DATABASE_CREATE6);
        database.execSQL(DATABASE_CREATE35);

        database.execSQL(DATABASE_CREATE17);
        database.execSQL(DATABASE_CREATE40);
        database.execSQL(DATABASE_CREATE15);
        database.execSQL(DATABASE_CREATE22);
        database.execSQL(DATABASE_CREATE24);
        database.execSQL(DATABASE_CREATE23);
        database.execSQL(DATABASE_CREATE11);
        database.execSQL(DATABASE_CREATE13);
        database.execSQL(DATABASE_CREATE14);
        database.execSQL(DATABASE_CREATE33);
        database.execSQL(DATABASE_CREATE34);
        database.execSQL(DATABASE_CREATE19);
        database.execSQL(DATABASE_CREATE25);
        database.execSQL(DATABASE_CREATE42);
        database.execSQL(DATABASE_CREATE43);

        database.execSQL(DATABASE_CREATE44);
        database.execSQL(DATABASE_CREATE45);
        database.execSQL(DATABASE_CREATE46);
        database.execSQL(DATABASE_CREATE47);
        database.execSQL(DATABASE_CREATE48);
        database.execSQL(DATABASE_CREATE49);
        database.execSQL(DATABASE_CREATE50);
        database.execSQL(DATABASE_CREATE51);
        database.execSQL(DATABASE_CREATE52);
        database.execSQL(DATABASE_CREATE53);


        //--------Indexing--------//

        database.execSQL(DATABASE_INDEX_DOWNLOAD_COUNTER);
        database.execSQL(DATABASE_INDEX_USER_DEFINE_FLOW_MASTER);
        database.execSQL(DATABASE_INDEX_USER_DEFINE_FLOW_MASTER2);
        database.execSQL(DATABASE_INDEX_USER_DEFINE_FLOW_MASTER3);


        database.execSQL(DATABASE_INDEX_CHECKSHEET);

        database.execSQL(DATABASE_INDEX_FLOW_MASTER);

        database.execSQL(DATABASE_INDEX_TASK_MASTER1);
        database.execSQL(DATABASE_INDEX_TASK_MASTER2);
        database.execSQL(DATABASE_INDEX_TASK_MASTER3);
        database.execSQL(DATABASE_INDEX_TASK_MASTER4);
        database.execSQL(DATABASE_INDEX_TASK_MASTER5);


        database.execSQL(DATABASE_INDEX_F_MASTER1);
        database.execSQL(DATABASE_INDEX_F_MASTER2);
        database.execSQL(DATABASE_INDEX_F_MASTER3);

        database.execSQL(DATABASE_INDEX_LOCATION_LOG1);
        database.execSQL(DATABASE_INDEX_LOCATION_LOG2);

        database.execSQL(DATABASE_INDEX_P_MASTER);


        try {
            versionName = context.getPackageManager()
                    .getPackageInfo(context.getPackageName(), 0).versionName;
        } catch (PackageManager.NameNotFoundException e) {
            ////e.printStackTrace()();
        }


        database.execSQL("INSERT INTO download_counter VALUES(1,0,'1','chechsheet',0,0);");
        database.execSQL("INSERT INTO download_counter VALUES(2,0,'1','task_master',0,0);");
        database.execSQL("INSERT INTO download_counter VALUES(3,0,'1','user_define',0,0);");
        database.execSQL("INSERT INTO download_counter VALUES(4,0,'1','flow_master',0,0);");
        database.execSQL("INSERT INTO download_counter VALUES(5,0,'1','flow_counter',0,0);");

        database.execSQL("INSERT INTO gcm_server VALUES(1,'0','0','0','0','0','0',0);");
        database.execSQL("INSERT INTO Thresold VALUES(1,'0','0','0','0','0','0');");
        database.execSQL("INSERT INTO Features VALUES(1,'0','0','0','0','0');");


        database.execSQL("INSERT INTO gpsrec( ID,g_ontime,g_offtime,gp_ontime,gp_offtime,phone_on,phone_off,battery) VALUES('1','0','0','0','0','0','0',0);");
        database.execSQL("INSERT INTO Login_Master VALUES('0','0','0','0','0',0,'0','0','android','" + versionName.toString() + "','0','0','0','0');");
        database.execSQL("INSERT INTO refrence_master(n_lat,n_lon,accuracy) VALUES('0','0','0');");


        database.execSQL("INSERT INTO APP_states VALUES('SEND_DATA_COUNTER','1');");
        database.execSQL("INSERT INTO APP_states VALUES('SEND_DATA_THRESHOLD','1');");
        database.execSQL("INSERT INTO APP_states VALUES('GET_LAT_LONG_TIMER','15');");
        database.execSQL("INSERT INTO APP_states VALUES('IS_FIRST','0');");
        database.execSQL("INSERT INTO APP_states VALUES('is_location','1');");
        database.execSQL("INSERT INTO APP_states VALUES('pin','1234');");
        database.execSQL("INSERT INTO APP_states VALUES('f_id','');");
        database.execSQL("INSERT INTO APP_states VALUES('location','');");
        database.execSQL("INSERT INTO APP_states VALUES('status','');");
        database.execSQL("INSERT INTO APP_states VALUES('send','0');");
        database.execSQL("INSERT INTO APP_states VALUES('ap_s','0');");
        database.execSQL("INSERT INTO APP_states VALUES('fl_j','0');");
        database.execSQL("INSERT INTO APP_states VALUES('in_f','0');");
        database.execSQL("INSERT INTO APP_states VALUES('ph_s','0');");
        database.execSQL("INSERT INTO APP_states VALUES('surveydata','0');");
        database.execSQL("INSERT INTO APP_states VALUES('imei','0');");
        database.execSQL("INSERT INTO APP_states VALUES('site_distance','500');");
        database.execSQL("INSERT INTO APP_states VALUES('download_flag','0');");
        database.execSQL("INSERT INTO APP_states VALUES('nick','0');");
        database.execSQL("INSERT INTO APP_states VALUES('user_flow','0');");

        database.execSQL("INSERT INTO APP_states VALUES('gps','0');");
        database.execSQL("INSERT INTO APP_states VALUES('ph_s','0');");
        database.execSQL("INSERT INTO APP_states VALUES('admin','0');");
        database.execSQL("INSERT INTO APP_states VALUES('backup','0');");

        database.execSQL("INSERT INTO APP_states VALUES('count','0');");
        database.execSQL("INSERT INTO APP_states VALUES('firstConnect','0');");

        database.execSQL("INSERT INTO product_master(prod_code,prod_name,prod_point,prod_price) VALUES('P001','Product 1','5','5');");
        database.execSQL("INSERT INTO product_master(prod_code,prod_name,prod_point,prod_price) VALUES('P002','Product 2','10','10');");
        database.execSQL("INSERT INTO product_master(prod_code,prod_name,prod_point,prod_price) VALUES('P003','Product 3','7','15');");
        database.execSQL("INSERT INTO product_master(prod_code,prod_name,prod_point,prod_price) VALUES('P004','Product 4','8','20');");
        database.execSQL("INSERT INTO product_master(prod_code,prod_name,prod_point,prod_price) VALUES('P005','Product 5','12','25');");

    }

    @Override
    public void onUpgrade(SQLiteDatabase database, int oldVersion,
                          int newVersion) {

        if (oldVersion < 9) {
            database.execSQL("INSERT INTO gpsrec( ID,g_ontime,g_offtime,gp_ontime,gp_offtime,phone_on,phone_off,battery) VALUES('1','0','0','0','0','0','0',0);");
            database.execSQL("ALTER TABLE p_master ADD COLUMN checksheetid INTEGER");
            database.execSQL("ALTER TABLE task_master ADD COLUMN global_var TEXT");
            database.execSQL("UPDATE p_master SET p_master.checksheetid = task_master.checksheetid from task_master INNER JOIN p_master ON task_master.tid = p_master.tid ");
        }
        if (oldVersion < 10) {
            database.execSQL("INSERT INTO APP_states VALUES('count','0');");
            database.execSQL("INSERT INTO APP_states VALUES('firstConnect','0');");
        }
        if (oldVersion < 11) {

            database.execSQL("ALTER TABLE f_master ADD COLUMN  long TEXT");
            database.execSQL("ALTER TABLE f_master ADD COLUMN lat TEXT");
            database.execSQL("ALTER TABLE f_master ADD COLUMN  millisecond TEXT");
        }

        if (oldVersion < 16) {
            database.execSQL("ALTER TABLE p_master ADD COLUMN  millisecond TEXT");
        }
        if (oldVersion < 17) {
            database.execSQL("ALTER TABLE Features  ADD COLUMN  loc_polling_time TEXT");
            database.execSQL("ALTER TABLE Features  ADD COLUMN  loc_accuracy TEXT");
            database.execSQL("ALTER TABLE Login_Master  ADD COLUMN  user_id INTEGER");
            database.execSQL("ALTER TABLE User_Define_Flow_Master  ADD COLUMN  isflag INTEGER");
            database.execSQL("ALTER TABLE User_Define_Flow_Master  ADD COLUMN  task_millisecond TEXT");
            database.execSQL("INSERT INTO download_counter VALUES(5,0,'1','flow_counter',0,0);");


        }
        if (oldVersion < 18) {
            database.execSQL(DATABASE_CREATE41);
            database.execSQL("ALTER TABLE gcm_server  ADD COLUMN  company_id INTEGER");

        }
        if (oldVersion < 19) {

            database.execSQL("ALTER TABLE lat_plug  ADD COLUMN  dv_eve TEXT");
            database.execSQL("ALTER TABLE lat_plug  ADD COLUMN  isdv_eve TEXT");

        }
        if (oldVersion < 15) {
            database.execSQL("DROP TABLE IF EXISTS lat_plug");
            database.execSQL(DATABASE_CREATE17);
            database.execSQL("DROP TABLE IF EXISTS gcm_server");
            database.execSQL(DATABASE_CREATE11);
            database.execSQL("INSERT INTO gcm_server VALUES(1,'0','0','0','0','0','0');");
            database.execSQL("ALTER TABLE location_log ADD COLUMN  speed TEXT");
            database.execSQL("ALTER TABLE track_master ADD COLUMN  speed TEXT");
            database.execSQL(DATABASE_CREATE5);
            database.execSQL(DATABASE_CREATE6);
            database.execSQL(DATABASE_CREATE7);
            database.execSQL(DATABASE_CREATE8);

            database.execSQL("INSERT INTO Thresold VALUES(1,'0','0','0','0','0','0');");
            database.execSQL("INSERT INTO Features VALUES(1,'0','0','0');");
        }


        if (oldVersion < 20) {
            database.execSQL("DROP TABLE IF EXISTS video");
            database.execSQL(" CREATE TABLE video(_id INTEGER PRIMARY KEY AUTOINCREMENT, tid INTEGER, que_id INTEGER, checksheetid INTEGER, p_name TEXT, or_path text, con_path text,type text,issend_track TEXT,chunk_number TEXT,offset TEXT,totalbyte TEXT,CompanyId TEXT,CustomerUniq TEXT,Ph_id TEXT,it_id TEXT,millisecond TEXT,step_No TEXT,size TEXT);");
            database.execSQL("DROP TABLE IF EXISTS download_video");
            database.execSQL(" CREATE TABLE download_video(_id INTEGER PRIMARY KEY AUTOINCREMENT,sid INTEGER, tid INTEGER, que_id INTEGER, checksheetid INTEGER, p_name TEXT, or_path text, con_path text,isdown_track TEXT,chunk_number TEXT,offset TEXT,totalbyte TEXT,CompanyId TEXT,CustomerUniq TEXT,Ph_id TEXT,it_id TEXT,millisecond TEXT,progress TEXT,download_id TEXT,download_url TEXT);");

        }

        if (oldVersion < 21) {

            database.execSQL("ALTER TABLE Login_Master ADD COLUMN  appid TEXT");
            database.execSQL("ALTER TABLE User_Define_Flow_Master ADD COLUMN  main_sid TEXT");
            database.execSQL("ALTER TABLE User_Define_Flow_Master ADD COLUMN  sub_sid TEXT");
            database.execSQL("ALTER TABLE User_Define_Flow_Master ADD COLUMN  sub_task_millisecond TEXT");
            database.execSQL("ALTER TABLE User_Define_Flow_Master ADD COLUMN  main_que_id TEXT");
            database.execSQL("ALTER TABLE User_Define_Flow_Master ADD COLUMN  main_que_millisecond TEXT");
            database.execSQL("ALTER TABLE User_Define_Flow_Master ADD COLUMN  sub_que_id TEXT");
            database.execSQL("ALTER TABLE User_Define_Flow_Master ADD COLUMN  sub_que_millisecond TEXT");
            database.execSQL("ALTER TABLE task_master ADD COLUMN  is_down_complete TEXT");
            database.execSQL("ALTER TABLE checksheet ADD COLUMN  step_short_name TEXT");


        }

        if (oldVersion < 22) {

            try {
                versionName = context.getPackageManager()
                        .getPackageInfo(context.getPackageName(), 0).versionName;
            } catch (PackageManager.NameNotFoundException e) {
                ////e.printStackTrace()();
            }

            database.execSQL("DROP TABLE IF EXISTS Login_Master");
            database.execSQL("CREATE TABLE Login_Master (username TEXT,password TEXT, u_c TEXT, imei TEXT, company_id INTEGER,user_id INTEGER,appid TEXT);");
            database.execSQL("INSERT INTO Login_Master VALUES('0','0','0','0','0',0,'0');");

        }


        if (oldVersion < 23) {

            database.execSQL("ALTER TABLE task_master ADD COLUMN  Dynamic_Globalvar TEXT");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN  Dynamic_Globalvar TEXT");

        }

        if (oldVersion < 24) {
            database.execSQL(DATABASE_CREATE44);
        }

        if (oldVersion < 25) {
            database.execSQL("ALTER TABLE Login_Master ADD COLUMN  servermilli TEXT");

            ContentValues cv = new ContentValues();
            cv.put("servermilli", 0);
            database.update("Login_Master", cv, null, null);
//            database.execSQL("INSERT INTO Login_Master VALUES('0','0','0','0','0',0,'0','0');");

        }

        if (oldVersion < 26) {

            database.execSQL("ALTER TABLE task_master_history ADD COLUMN punch_flag TEXT");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN in_ms TEXT");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN out_ms TEXT");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN duration TEXT");

            database.execSQL("ALTER TABLE task_master ADD COLUMN punch_flag TEXT");
            database.execSQL("ALTER TABLE task_master ADD COLUMN in_ms TEXT");
            database.execSQL("ALTER TABLE task_master ADD COLUMN out_ms TEXT");
            database.execSQL("ALTER TABLE task_master ADD COLUMN duration TEXT");

            //database.execSQL("INSERT INTO Login_Master VALUES('0','0','0','0','0',0,'0','0');");
        }

        if (oldVersion < 27) {


            try {
                versionName = context.getPackageManager()
                        .getPackageInfo(context.getPackageName(), 0).versionName;
            } catch (PackageManager.NameNotFoundException e) {
                ////e.printStackTrace()();
            }

            database.execSQL("ALTER TABLE Login_Master ADD COLUMN devicetype TEXT");
            database.execSQL("ALTER TABLE Login_Master ADD COLUMN appversion TEXT");

            ContentValues cv = new ContentValues();
            cv.put("devicetype", "android");
            cv.put("appversion", versionName.toString());
            database.update("Login_Master", cv, null, null);
            database.execSQL("ALTER TABLE task_master ADD COLUMN is_delete_photo TEXT");
            database.execSQL("ALTER TABLE task_master ADD COLUMN survey_ms TEXT");

        }
        if (oldVersion < 28) {


            database.execSQL("ALTER TABLE download_video ADD COLUMN upload_type TEXT");
            database.execSQL("ALTER TABLE download_video ADD COLUMN base_path TEXT");
            database.execSQL("ALTER TABLE download_video ADD COLUMN actual_name TEXT");
            database.execSQL("ALTER TABLE download_video ADD COLUMN sharepoint_url TEXT");
        }
        if (oldVersion < 29) {

            database.execSQL("ALTER TABLE lat_plug ADD COLUMN  trip_status TEXT");
            database.execSQL("ALTER TABLE lat_plug ADD COLUMN  ETA TEXT");
            database.execSQL("ALTER TABLE lat_plug ADD COLUMN  site_name TEXT");
            database.execSQL("ALTER TABLE lat_plug ADD COLUMN  unique_trip_id TEXT");
            database.execSQL("ALTER TABLE lat_plug ADD COLUMN  last_upload_ms TEXT");
            database.execSQL("ALTER TABLE lat_plug ADD COLUMN  trip_shflag TEXT");
            database.execSQL("ALTER TABLE lat_plug ADD COLUMN  llat TEXT");
            database.execSQL("ALTER TABLE lat_plug ADD COLUMN  llon TEXT");
        }
        if (oldVersion < 30) {

            database.execSQL("ALTER TABLE task_master ADD COLUMN  is_delete_log TEXT");
        }

        if (oldVersion < 31) {

            try {
                database.execSQL("ALTER TABLE task_master ADD COLUMN initialstatus TEXT");
            } catch (Exception e) {

            }


            database.execSQL("ALTER TABLE gp_total ADD COLUMN appstop TEXT");
            database.execSQL("ALTER TABLE gp_total ADD COLUMN appstart TEXT");
            database.execSQL("ALTER TABLE gp_total ADD COLUMN appduration TEXT");
            database.execSQL("DROP TABLE IF EXISTS fake_location");
            database.execSQL(DATABASE_CREATE45);
        }
        if (oldVersion < 32) {
            database.execSQL("ALTER TABLE lat_plug ADD COLUMN s_lon_eta TEXT");
            database.execSQL("ALTER TABLE lat_plug ADD COLUMN s_lat_eta TEXT");
        }
        if (oldVersion < 33) {

            database.execSQL("ALTER TABLE Events ADD COLUMN duration  TEXT");
            database.execSQL("ALTER TABLE Events ADD COLUMN battery TEXT");
            database.execSQL("ALTER TABLE Events ADD COLUMN timezone  TEXT");
            database.execSQL("ALTER TABLE Events ADD COLUMN utcstart TEXT");
            database.execSQL("ALTER TABLE Events ADD COLUMN utcend TEXT");
            database.execSQL("ALTER TABLE Events ADD COLUMN imei TEXT");
            database.execSQL("ALTER TABLE Events ADD COLUMN appid TEXT");
            database.execSQL("ALTER TABLE Events ADD COLUMN userid TEXT");
            database.execSQL("ALTER TABLE lat_plug ADD COLUMN distance TEXT");

        }
        if (oldVersion < 34) {

            database.execSQL(DATABASE_CREATE46);
            database.execSQL(DATABASE_CREATE47);
        }
        if (oldVersion < 35) {

            try {
                database.execSQL("ALTER TABLE task_master ADD COLUMN  is_delete_log TEXT");
                database.execSQL("ALTER TABLE lat_plug ADD COLUMN  llat TEXT");
                database.execSQL("ALTER TABLE lat_plug ADD COLUMN  llon TEXT");
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        if (oldVersion < 36) {

            try {
                database.execSQL("ALTER TABLE task_master ADD COLUMN  is_delete_log TEXT");
            } catch (Exception e) {

            }
            try {
                database.execSQL("ALTER TABLE lat_plug ADD COLUMN  llat TEXT");
                database.execSQL("ALTER TABLE lat_plug ADD COLUMN  llon TEXT");
            } catch (Exception e) {

            }
        }
        if (oldVersion < 37) {

            database.execSQL("ALTER TABLE track_master ADD COLUMN  tripflag TEXT");
        }

        if (oldVersion < 38) {

            database.execSQL("ALTER TABLE lat_plug ADD COLUMN  fused_ac TEXT");
        }

        if (oldVersion < 39) {

            database.execSQL("ALTER TABLE track_master ADD COLUMN  locationtime TEXT");
        }

        if (oldVersion < 40) {

            database.execSQL("ALTER TABLE lat_plug ADD COLUMN  etaflag TEXT");
        }

        if (oldVersion < 41) {


            database.execSQL("ALTER TABLE video ADD COLUMN  upload_type TEXT");
            database.execSQL("ALTER TABLE video ADD COLUMN  base_path TEXT");
            database.execSQL("ALTER TABLE video ADD COLUMN  actual_name TEXT");
            database.execSQL("ALTER TABLE video ADD COLUMN  sharepoint_url TEXT");
        }

        if (oldVersion < 42) {

            database.execSQL("ALTER TABLE task_master ADD COLUMN  edit_global_var TEXT");
        }

        if (oldVersion < 43) {

            database.execSQL("ALTER TABLE download_video ADD COLUMN  parent_task_id INTEGER");
        }

        if (oldVersion < 44) {

            database.execSQL("ALTER TABLE task_master ADD COLUMN  is_delete_sub TEXT");
        }
        if (oldVersion < 45) {

            database.execSQL("ALTER TABLE task_master ADD COLUMN  list_html TEXT");
        }
        if (oldVersion < 46) {

            database.execSQL("ALTER TABLE checksheet ADD COLUMN  stepid TEXT");

            database.execSQL("ALTER TABLE User_Define_Flow_Master ADD COLUMN  matchcondition TEXT");
            database.execSQL("ALTER TABLE task_master ADD COLUMN  islogdown TEXT");
            database.execSQL("ALTER TABLE task_master ADD COLUMN  que_milli TEXT");
            database.execSQL("ALTER TABLE task_master ADD COLUMN  que_id TEXT");
            database.execSQL("ALTER TABLE Login_master ADD COLUMN  main_milli TEXT DEFAULT 0");
            database.execSQL("ALTER TABLE Login_Master ADD COLUMN  sub_milli TEXT DEFAULT 0");
            database.execSQL("ALTER TABLE Login_Master ADD COLUMN  main_id TEXT DEFAULT 0");
            database.execSQL("ALTER TABLE Login_Master ADD COLUMN  sub_id TEXT DEFAULT 0");
        }

        if (oldVersion < 47) {
            database.execSQL("ALTER TABLE task_master ADD COLUMN  edit_flag TEXT DEFAULT 0");
        }

        if (oldVersion < 48) {
            database.execSQL("ALTER TABLE lat_plug ADD COLUMN  serviceoutage_flag TEXT DEFAULT 0");
        }

        if (oldVersion < 49) {
            database.execSQL("ALTER TABLE checksheet RENAME TO tmp");
            database.execSQL("ALTER TABLE User_Define_Flow_Master RENAME TO tmp1");
            database.execSQL("ALTER TABLE flow_master RENAME TO tmp2");

            database.execSQL("CREATE TABLE checksheet(_id INTEGER PRIMARY KEY AUTOINCREMENT, checksheetid INTEGER,c_name TEXT, c_type INTEGER,\n" +
                    " data TEXT,buttons TEXT,step TEXT, subcategory TEXT, date TEXT, millisecond LONG, step_short_name TEXT,\n" +
                    " stepid INTEGER)");

            database.execSQL("CREATE TABLE User_Define_Flow_Master(f_id INTEGER PRIMARY KEY AUTOINCREMENT,id INTEGER,rollid INTEGER,flow_name TEXT," +
                    "flow_name1 TEXT,type TEXT,flow_id INTEGER,p_id INTEGER,level_position INTEGER,data TEXT,company_id INTEGER," +
                    "millisecond LONG,isflag INTEGER,main_sid TEXT,task_millisecond LONG,sub_sid TEXT,sub_task_millisecond LONG," +
                    "main_que_id TEXT,main_que_millisecond LONG,sub_que_id TEXT,sub_que_millisecond LONG,matchcondition TEXT)");

            database.execSQL("CREATE TABLE flow_master(_id INTEGER PRIMARY KEY AUTOINCREMENT,moduleid INTEGER," +
                    "company_id INTEGER,module_name TEXT,millisecond LONG, checksheet_id INTEGER, data TEXT)");

            database.execSQL("INSERT INTO checksheet(checksheetid, c_name, c_type, data, buttons, step, subcategory,date, millisecond, step_short_name, stepid)SELECT checksheetid, c_name, c_type, data, buttons, step, subcategory,date, millisecond, step_short_name, stepid FROM tmp");

            database.execSQL("INSERT INTO User_Define_Flow_Master(id , rollid, flow_name, flow_name1, type, flow_id, p_id, level_position ,data ,company_id ,millisecond ,isflag ,main_sid ,task_millisecond ,sub_sid ,sub_task_millisecond ,main_que_id ,main_que_millisecond ,sub_que_id ,sub_que_millisecond ,matchcondition) SELECT id ,rollid ,flow_name ,flow_name1 ,type ,flow_id ,p_id ,level_position ,data ,company_id ,millisecond ,isflag ,main_sid ,task_millisecond ,sub_sid ,sub_task_millisecond ,main_que_id ,main_que_millisecond ,sub_que_id ,sub_que_millisecond ,matchcondition FROM tmp1");

            database.execSQL("INSERT INTO flow_master(moduleid,company_id ,module_name ,millisecond , checksheet_id , data )SELECT moduleid ,company_id ,module_name ,millisecond , checksheet_id , data FROM tmp2");


            database.execSQL("DROP TABLE tmp");
            database.execSQL("DROP TABLE tmp1");
            database.execSQL("DROP TABLE tmp2");
        }

        if (oldVersion < 50) {
            database.execSQL("ALTER TABLE task_master ADD COLUMN  p_udf_id TEXT");
        }

        if (oldVersion < 51) {
            database.execSQL("ALTER TABLE f_master ADD COLUMN match_temp_id TEXT DEFAULT 0");
            database.execSQL("ALTER TABLE p_master ADD COLUMN  match_temp_id TEXT DEFAULT 0");
            database.execSQL("ALTER TABLE task_master ADD COLUMN  match_temp_id TEXT DEFAULT 0");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN  is_delete_photo TEXT");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN  is_delete_log TEXT");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN  initialstatus TEXT");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN  edit_global_var TEXT");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN  is_delete_sub TEXT");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN  list_html TEXT");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN  islogdown TEXT DEFAULT 0");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN  que_milli TEXT DEFAULT 0");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN  que_id TEXT DEFAULT 0");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN  edit_flag TEXT DEFAULT 0");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN  p_udf_id TEXT DEFAULT 0");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN  match_temp_id TEXT DEFAULT 0");
            database.execSQL("ALTER TABLE video ADD COLUMN  match_temp_id TEXT DEFAULT 0");
            database.execSQL("ALTER TABLE punch_master ADD COLUMN  match_temp_id TEXT DEFAULT 0");
            database.execSQL("ALTER TABLE lat_plug ADD COLUMN  match_temp_id TEXT DEFAULT 0");
        }
        if (oldVersion < 52) {
            database.execSQL("ALTER TABLE task_master ADD COLUMN p_match_temp_id TEXT DEFAULT 0");
        }
        if (oldVersion < 53) {
            database.execSQL("ALTER TABLE task_master ADD COLUMN is_valid_log TEXT");
        }
        if (oldVersion < 54) {
            database.execSQL("ALTER TABLE task_master ADD COLUMN notiflag TEXT DEFAULT 0");
        }
        if (oldVersion < 55) {
            database.execSQL("ALTER TABLE task_master ADD COLUMN tripflag TEXT DEFAULT 0");
        }

        if (oldVersion < 56) {
            database.execSQL("ALTER TABLE User_Define_Flow_Master ADD COLUMN is_delete TEXT");
        }

        if (oldVersion < 57) {
            database.execSQL("ALTER TABLE task_master ADD COLUMN is_online TEXT DEFAULT 0");
        }
        if (oldVersion < 58) {
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN entry_type TEXT DEFAULT 0");
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN local_milli TEXT DEFAULT 0");
        }
        if (oldVersion < 59) {
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN role_id TEXT DEFAULT 0");
        }
        if (oldVersion < 60) {
            database.execSQL(DATABASE_CREATE48);
        }
        if (oldVersion < 61) {
            database.execSQL("ALTER TABLE task_master_history ADD COLUMN old_status INTEGER");
        }
        if (oldVersion < 62) {
            database.execSQL("ALTER TABLE Events ADD COLUMN maxviolation TEXT DEFAULT 0");
        }
        if (oldVersion < 63) {
            database.execSQL("ALTER TABLE task_master ADD COLUMN response_status TEXT");
        }
        if (oldVersion < 64) {
            database.execSQL("ALTER TABLE p_master ADD COLUMN que_name TEXT");
            database.execSQL("ALTER TABLE video ADD COLUMN que_name TEXT");
        }
        if (oldVersion < 65) {
            database.execSQL("ALTER TABLE Events ADD COLUMN tid TEXT");
        }
        if (oldVersion < 66) {
            database.execSQL(DATABASE_CREATE49);
            DownloadUtils.setDeletetaskflag("1");
        }
        if (oldVersion < 67) {
            database.execSQL(DATABASE_CREATE50);
        }
        /*if (oldVersion < 68) {
            database.execSQL("ALTER TABLE meterreading ADD COLUMN Unique_id TEXT");
            database.execSQL("ALTER TABLE meterreading ADD COLUMN hasResponse INTEGER");
        }*/
        if (oldVersion < 68) {
            database.execSQL(DATABASE_CREATE51);
        }

        if(oldVersion < 69)
        {
            boolean columnExists = isColumnExists(database, "task_master", "columndata");
            if (columnExists) {
                Log.d("columnExists", String.valueOf(columnExists));
            } else {
                database.execSQL("ALTER TABLE task_master ADD COLUMN columndata TEXT");
            }
        }

        if(oldVersion < 70)
        {
            database.execSQL("ALTER TABLE track_master ADD COLUMN waypoint TEXT");
        }

        if(oldVersion < 71)
        {
            database.execSQL("ALTER TABLE track_master ADD COLUMN waypoint_type TEXT");
        }
        if (oldVersion < 72) {
            database.execSQL(DATABASE_CREATE52);
        }

        if(oldVersion < 73){
            database.execSQL(DATABASE_CREATE53);
        }


    }


    public boolean isColumnExists(SQLiteDatabase db, String tableName, String columnName) {
        Cursor cursor = db.rawQuery("PRAGMA table_info(" + tableName + ")", null);
        try {
            int nameIndex = cursor.getColumnIndexOrThrow("name");
            while (cursor.moveToNext()) {
                String currentColumnName = cursor.getString(nameIndex);
                if (currentColumnName.equalsIgnoreCase(columnName)) {
                    return true;
                }
            }
        } finally {
            cursor.close();
        }
        return false;
    }

    public ArrayList<Cursor> getData(String Query) {
        // get writable database
//        SQLiteDatabase sqlDB = this.getWritableDatabase("sky989844");
        String PACKAGE_NAME = context.getPackageName();
        SQLiteDatabase sqlDB;

        if (PACKAGE_NAME.equalsIgnoreCase("com.easyform.atcpv") || PACKAGE_NAME.equalsIgnoreCase("com.easyform.ciat")) {

            try {
                sqlDB = this.getWritableDatabase("sky989844");
            } catch (Exception e) {
                Log.d("##AAA", e.getMessage());
                sqlDB = this.getWritableDatabase("");
            }

        } else {

            sqlDB = this.getWritableDatabase("sky989844");
        }


        String[] columns = new String[]{"mesage"};
        // an array list of cursor to save two cursors one has results from the
        // query
        // other cursor stores error message if any errors are triggered
        ArrayList<Cursor> alc = new ArrayList<Cursor>(2);
        MatrixCursor Cursor2 = new MatrixCursor(columns);
        alc.add(null);
        alc.add(null);

        try {
            String maxQuery = Query;
            // execute the query results will be save in Cursor c
            Cursor c = sqlDB.rawQuery(maxQuery, null);

            // add value to cursor2
            Cursor2.addRow(new Object[]{"Success"});

            alc.set(1, Cursor2);
            if (null != c && c.getCount() > 0) {

                alc.set(0, c);
                c.moveToFirst();

                return alc;
            }
            return alc;
        } catch (SQLException sqlEx) {
            Log.d("printing exception", sqlEx.getMessage());
            // if any exceptions are triggered save the error message to cursor
            // an return the arraylist
            Cursor2.addRow(new Object[]{"" + sqlEx.getMessage()});
            alc.set(1, Cursor2);
            return alc;
        } catch (Exception ex) {
            Log.d("printing exception", ex.getMessage());
            // if any exceptions are triggered save the error message to cursor
            // an return the arraylist
            Cursor2.addRow(new Object[]{"" + ex.getMessage()});
            alc.set(1, Cursor2);
            return alc;
        }

    }
}
