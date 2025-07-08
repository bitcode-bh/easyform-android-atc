package com.nareshchocha.databasemanager.Utils;

import android.database.Cursor;
import android.database.MatrixCursor;
import android.util.Log;

import net.sqlcipher.database.SQLiteDatabase;

import java.util.ArrayList;

public class DatabaseManagerSQLite {

    private static SQLiteDatabase sqlDB;

    public static void setSqlDB(SQLiteDatabase sqlDB) {
        DatabaseManagerSQLite.sqlDB = sqlDB;
    }

    public ArrayList<Cursor> getData(String Query) {
        if (sqlDB != null) {
            // get writable database

            // an array list of cursor to save two cursors one has results from the
            // query
            // other cursor stores error message if any errors are triggered
            ArrayList<Cursor> queryCursorList = new ArrayList<Cursor>(2);

            queryCursorList.add(null);
            queryCursorList.add(null);
            try {
                // execute the query results will be save in Cursor c
                Cursor successCursor = sqlDB.rawQuery(Query, null);
                if (null != successCursor) {
                    queryCursorList.set(0, successCursor);
                    return queryCursorList;
                }
                return queryCursorList;
            } catch (Exception sqlEx) {
                Log.d("printing exception", sqlEx.toString());
                // if any exceptions are triggered save the error message to cursor
                // an return the arraylist
                String[] columns = new String[]{"message"};
                MatrixCursor errorCursor = new MatrixCursor(columns);
                errorCursor.addRow(new Object[]{sqlEx.toString()});
                queryCursorList.set(1, errorCursor);
                return queryCursorList;
            }
        } else {
            return null;
        }
    }

}