package com.sky.atc.easyformse;


import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.lifecycle.Lifecycle;
import androidx.viewpager2.adapter.FragmentStateAdapter;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

@StringFogIgnore
public class TabsPagerAdapter extends FragmentStateAdapter {

    public TabsPagerAdapter(@NonNull FragmentManager fragmentManager, @NonNull Lifecycle lifecycle) {
        super(fragmentManager, lifecycle);
    }

    @NonNull
    @Override
    public Fragment createFragment(int position) {
        // Hardcoded in this order, you'll want to use lists and make sure the titles match
        switch (position) {
            case 0:
                // Top Rated fragment activity
                return new SecurityFragment();
            case 1:
                // Games fragment activity
                return new DatabaseFragment();
            case 2:
                // Movies fragment activity
                return new BackupFragment();
            case 3:
                // Setting fragment activity
                return new SettingFragment();
        }
        return new SecurityFragment();
    }

    @Override
    public int getItemCount() {
        // Hardcoded, use lists
        return 4;
    }
}