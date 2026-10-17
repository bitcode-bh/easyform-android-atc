package com.sky.atc.easyformse.jobshedulers;

import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.Context;
import android.os.Build;
import androidx.annotation.RequiresApi;


import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import static android.content.Context.JOB_SCHEDULER_SERVICE;
@StringFogIgnore
public class Util {
    // schedule the start of the service every 10 - 30 seconds
    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    public static void scheduleJob(Context context) {
        ComponentName serviceComponent = new ComponentName(context, TestJobService.class);
        JobInfo.Builder builder = new JobInfo.Builder(0, serviceComponent);
        builder.setMinimumLatency(10000); // wait at least
        builder.setOverrideDeadline(3 * 10000); // maximum delay
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
//            builder.setPeriodic(1000,5000);
        }

        //builder.setRequiredNetworkType(JobInfo.NETWORK_TYPE_UNMETERED); // require unmetered network
        //builder.setRequiresDeviceIdle(true); // device should be idle
        //builder.setRequiresCharging(false); // we don't care if the device is charging or not
//        JobScheduler jobScheduler = context.getSystemService(JobScheduler.class);
        JobScheduler jobScheduler = (JobScheduler) context.getSystemService(JOB_SCHEDULER_SERVICE);
        jobScheduler.schedule(builder.build());
    }

}