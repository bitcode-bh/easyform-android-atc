package com.sky.atc.easyformse;

import android.content.Intent;
import android.os.Bundle;

import androidx.fragment.app.Fragment;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
import com.nareshchocha.databasemanager.Utils.DatabaseManagerSQLite;
import com.nareshchocha.databasemanager.ui.activitys.AndroidDatabaseManager;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;


//To open database of app
@StringFogIgnore
public class DatabaseFragment extends Fragment {

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {

        View rootView = inflater.inflate(R.layout.fragment_database, container,
                false);

        TextInputEditText tiEtDatabasePassword;
        TextInputLayout tilDatabasePassword;
        MaterialButton mbtDatabase;
        tilDatabasePassword = rootView.findViewById(R.id.tilDatabasePassword);
        tiEtDatabasePassword = rootView.findViewById(R.id.tiEtDatabasePassword);
        mbtDatabase = rootView.findViewById(R.id.mbtDatabase);
        mbtDatabase.setOnClickListener(v -> {
            if (tiEtDatabasePassword.getText() != null && tiEtDatabasePassword.getText().toString()
                    .equalsIgnoreCase("sky989844")) {
                DatabaseManagerSQLite.setSqlDB(sqlitewraper.getDatabase());
                Intent dbmanager = new Intent(getActivity(),
                        AndroidDatabaseManager.class);
                startActivity(dbmanager);
            } else {
                tilDatabasePassword.setErrorEnabled(true);
                tilDatabasePassword.setError("Please Enter Correct Password");
            }
        });
        return rootView;
    }
}
