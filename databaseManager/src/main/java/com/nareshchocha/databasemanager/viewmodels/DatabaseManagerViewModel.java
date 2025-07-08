package com.nareshchocha.databasemanager.viewmodels;

import android.content.Context;
import android.database.Cursor;
import android.graphics.Color;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TableRow;
import android.widget.TextView;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.nareshchocha.databasemanager.R;
import com.nareshchocha.databasemanager.Utils.DatabaseManagerSQLite;
import com.nareshchocha.databasemanager.Utils.LogDatabaseManagerUtils;
import com.nareshchocha.databasemanager.databinding.EmptyTableRowUiBinding;
import com.nareshchocha.databasemanager.models.MessageData;
import com.nareshchocha.databasemanager.models.TableData;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import io.michaelrocks.paranoid.Obfuscate;

/**
 * Created by NareshChocha on 3/28/2022.
 *
 * @author NareshChocha
 */
@Obfuscate
public class DatabaseManagerViewModel extends ViewModel {
    static final String TAG = "DatabaseManagerViewModel";
    ExecutorService executor = Executors.newFixedThreadPool(4);
    private final MutableLiveData<List<String>> _tableNameListLiveData = new MutableLiveData<List<String>>();
    public LiveData<List<String>> tableNameListLiveData = _tableNameListLiveData;

    private final MutableLiveData<MessageData> _errorSuccessMessageLiveData = new MutableLiveData<MessageData>(new MessageData(false, ""));
    public LiveData<MessageData> errorSuccessMessageLiveData = _errorSuccessMessageLiveData;

    private final MutableLiveData<TableData> _tableDataLiveData = new MutableLiveData<TableData>();
    public LiveData<TableData> tableDataLiveData = _tableDataLiveData;

    //a static class to save cursor,table values etc which is used by functions to share data in the program.
    static class indexInfo {
        public static int numberOfPages = 0;
        public static int numberOfRowPages = 10;
        public static int currentPage = 0;
        public static int startingRow = 0;
    }

    DatabaseManagerSQLite dbm;

    TableRow.LayoutParams tableRowParams;

    public DatabaseManagerViewModel() {
        dbm = new DatabaseManagerSQLite();
        tableRowParams = new TableRow.LayoutParams(TableRow.LayoutParams.WRAP_CONTENT, TableRow.LayoutParams.WRAP_CONTENT);
        tableRowParams.setMargins(0, 0, 2, 0);
        getTableNames();
    }

    public void getTableNames() {
        executor.execute(() -> {
            ArrayList<String> tableNameList = new ArrayList<String>();
            // a query which returns a cursor with the list of tables in the database.We use this cursor to populate spinner in the first row
            ArrayList<Cursor> TableNameCursorList = dbm.getData("SELECT name _id FROM sqlite_master WHERE type ='table'");
            //the first cursor has results of the query
            Cursor cursorResult = TableNameCursorList.get(0);
            //the second cursor has error messages
            Cursor cursorError = TableNameCursorList.get(1);

            if (cursorResult != null) {
                cursorResult.moveToFirst();
                do {
                    //add names of the table to tablenames array list
                    tableNameList.add(cursorResult.getString(0));
                } while (cursorResult.moveToNext());
                cursorResult.close();
            } else {
                if (cursorError != null) {
                    cursorError.moveToLast();
                    String msg = cursorError.getString(0);
                    Log.d("Message from sql = ", msg);
                    cursorError.close();
                }
            }
            _tableNameListLiveData.postValue(tableNameList);
        });
    }


    public void writeLogs(String error, String classAndMethod) {
        executor.execute(() -> LogDatabaseManagerUtils.writeDatabaseManagersLogToFile(error, classAndMethod));
    }

    //get columnNames of the empty tables and save them in a array list
    public List<String> getColumnNames(String tableName) {
        List<String> columnNamesList = new ArrayList<String>();
        List<Cursor> cursorColumnNamesList = dbm.getData("PRAGMA table_info(" + tableName + ")");
        Cursor cursorResult = cursorColumnNamesList.get(0);
        if (cursorResult != null) {
            cursorResult.moveToFirst();
            do {
                columnNamesList.add(cursorResult.getString(1));
            } while (cursorResult.moveToNext());
        } else {
            writeLogs("cursorResult is null", "getColumnNames :" + TAG);
        }
        return columnNamesList;
    }

    public TableRow createColumnsUI(List<String> columnNamesList, Context context) {
        TableRow tableRowColumnNames = new TableRow(context);
        tableRowColumnNames.setBackgroundColor(Color.BLACK);
        tableRowColumnNames.setPadding(2, 2, 0, 2);
        for (int k = 0; k < columnNamesList.size(); k++) {
            LinearLayout llCellView = new LinearLayout(context);
            llCellView.setBackgroundColor(Color.WHITE);
            llCellView.setLayoutParams(tableRowParams);
            TextView tvColumnName = new TextView(context);
            tvColumnName.setPadding(4, 4, 4, 4);
            tvColumnName.setText(columnNamesList.get(k));
            tvColumnName.setTextColor(Color.parseColor("#000000"));
            llCellView.addView(tvColumnName);
            tableRowColumnNames.addView(llCellView);
        }
        return tableRowColumnNames;
    }

    public void resetStartingRow() {
        indexInfo.startingRow = 0;
    }

    public boolean previousButton(String tableName) {
        if (indexInfo.startingRow > 0) {
            indexInfo.startingRow -= indexInfo.numberOfRowPages;
            getSelectData(tableName);
            return true;
        } else {
            return false;
        }
    }

    public boolean nextButton(String tableName, int totalCount) {
        if ((indexInfo.startingRow + indexInfo.numberOfRowPages) < totalCount) {
            indexInfo.startingRow += indexInfo.numberOfRowPages;
            getSelectData(tableName);
            return true;
        } else {
            return false;
        }
    }

    public void getSelectData(String tableName) {
        executor.execute(() -> {
            String Query2 = "select * from " + tableName;
            ArrayList<Cursor> SelectedTableCursorList = dbm.getData(Query2);
            int counts = 0;
            if (SelectedTableCursorList.get(0) != null) {
                counts = SelectedTableCursorList.get(0).getCount();
                SelectedTableCursorList.get(0).close();
            }
            Query2 += " limit " + indexInfo.startingRow + "," + (indexInfo.startingRow + indexInfo.numberOfRowPages);
            Log.e(TAG, Query2);
            SelectedTableCursorList = dbm.getData(Query2);
            Cursor selectedTableCursorResult = SelectedTableCursorList.get(0);
            Cursor selectedTableCursorError = SelectedTableCursorList.get(1);

            if (selectedTableCursorResult != null) {
                if (selectedTableCursorResult.getCount() > 0) {
                    _errorSuccessMessageLiveData.postValue(new MessageData(false, ""));
                    indexInfo.numberOfPages = (counts / indexInfo.numberOfRowPages) + 1;
                    selectedTableCursorResult.moveToFirst();
                    indexInfo.currentPage = 1;

                    List<List<String>> rowList = new ArrayList<>();
                    int currentrow = 0;
                    do {
                        List<String> columnList = new ArrayList<>();
                        for (int j = 0; j < selectedTableCursorResult.getColumnCount(); j++) {
                            columnList.add("" + selectedTableCursorResult.getString(j));
                        }
                        rowList.add(columnList);
                        currentrow = currentrow + 1;
                    } while (selectedTableCursorResult.moveToNext() && currentrow < indexInfo.numberOfRowPages);
                    _tableDataLiveData.postValue(new TableData(counts, rowList));
                } else {
                    //if the cursor returned from the database is empty we show that table is empty
                    _errorSuccessMessageLiveData.postValue(new MessageData(true, "No Data Found"));
                    _tableDataLiveData.postValue(new TableData());
                }
                selectedTableCursorResult.close();
            } else {
                if (selectedTableCursorError != null) {
                    selectedTableCursorError.moveToLast();
                    _errorSuccessMessageLiveData.postValue(new MessageData(true, "" + selectedTableCursorError.getString(0)));
                    _tableDataLiveData.postValue(new TableData());
                    selectedTableCursorError.close();
                }
            }
        });
    }

    public void getRunCustomQuery(String query) {
        executor.execute(() -> {
            ArrayList<Cursor> SelectedTableCursorList = dbm.getData(query);
            Log.e(TAG, query);
            Cursor selectedTableCursorResult = SelectedTableCursorList.get(0);
            Cursor selectedTableCursorError = SelectedTableCursorList.get(1);
            if (selectedTableCursorResult != null) {
                if (selectedTableCursorResult.getCount() > 0) {
                    int counts = SelectedTableCursorList.get(0).getCount();
                    _errorSuccessMessageLiveData.postValue(new MessageData(false, ""));
                    selectedTableCursorResult.moveToFirst();
                    List<List<String>> rowList = new ArrayList<>();

                    do {
                        List<String> columnList = new ArrayList<>();
                        for (int j = 0; j < selectedTableCursorResult.getColumnCount(); j++) {
                            columnList.add("" + selectedTableCursorResult.getString(j));
                        }
                        rowList.add(columnList);

                    } while (selectedTableCursorResult.moveToNext());
                    _tableDataLiveData.postValue(new TableData(counts, rowList));
                } else {
                    //if the cursor returned from the database is empty we show that table is empty
                    _errorSuccessMessageLiveData.postValue(new MessageData(true, "No Data Found"));
                    _tableDataLiveData.postValue(new TableData());
                }
                selectedTableCursorResult.close();
            } else {
                if (selectedTableCursorError != null) {
                    selectedTableCursorError.moveToLast();
                    _errorSuccessMessageLiveData.postValue(new MessageData(true, "" + selectedTableCursorError.getString(0)));
                    _tableDataLiveData.postValue(new TableData());
                    selectedTableCursorError.close();
                }
            }
        });
    }

    public void runQuery(String query) {
        executor.execute(() -> {
            ArrayList<Cursor> SelectedTableCursorList = dbm.getData(query);
            Log.e(TAG, query);
            Cursor selectedTableCursorResult = SelectedTableCursorList.get(0);
            Cursor selectedTableCursorError = SelectedTableCursorList.get(1);
            if (selectedTableCursorResult != null) {
                if (selectedTableCursorResult.getCount() > 0) {
                    int counts = SelectedTableCursorList.get(0).getCount();
                    _errorSuccessMessageLiveData.postValue(new MessageData(false, "suss" + counts));
                } else {
                    //if the cursor returned from the database is empty we show that table is empty
                    //_errorSuccessMessageLiveData.postValue(new MessageData(true, "No Data Found"));

                }
                selectedTableCursorResult.close();
            } else {
                if (selectedTableCursorError != null) {
                    selectedTableCursorError.moveToLast();
                    _errorSuccessMessageLiveData.postValue(new MessageData(true, "" + selectedTableCursorError.getString(0)));
                    selectedTableCursorError.close();
                }
            }
        });
    }

    //get columnNames of the empty tables and save them in a array list
    public List<String> getColumnNamesFromCustomQuery(String query) {
        List<String> columnNamesList = new ArrayList<String>();
        ArrayList<Cursor> SelectedTableCursorList = dbm.getData(query);
        Log.e(TAG, query);
        Cursor selectedTableCursorResult = SelectedTableCursorList.get(0);
        Cursor selectedTableCursorError = SelectedTableCursorList.get(1);
        if (selectedTableCursorResult != null) {
            for (int k = 0; k < selectedTableCursorResult.getColumnCount(); k++) {
                columnNamesList.add("" + selectedTableCursorResult.getColumnName(k));
            }
            selectedTableCursorResult.close();
        } else {
            if (selectedTableCursorError != null) {
                selectedTableCursorError.moveToLast();
                _errorSuccessMessageLiveData.postValue(new MessageData(true, "" + selectedTableCursorError.getString(0)));
                selectedTableCursorError.close();
            }
        }
        return columnNamesList;
    }


    public TableRow createColumnsProgressBar(int spanCount, Context context) {
        TableRow tableRowColumnNames = new TableRow(context);
        tableRowColumnNames.setBackgroundColor(Color.BLACK);
        tableRowColumnNames.setPadding(2, 2, 0, 2);

        LinearLayout llCellView = new LinearLayout(context);
        llCellView.setBackgroundColor(Color.WHITE);
        llCellView.setLayoutParams(tableRowParams);

        TableRow.LayoutParams layoutParams = new TableRow.LayoutParams();
        layoutParams.span = spanCount;
        llCellView.setLayoutParams(layoutParams);

        ProgressBar pbProgress = new ProgressBar(context);
        pbProgress.setPadding(4, 4, 4, 4);

        llCellView.addView(pbProgress);
        tableRowColumnNames.addView(llCellView);

        return tableRowColumnNames;
    }


    public TableRow createEmptyTableUI(int spanCount, Context context) {
        EmptyTableRowUiBinding tableRowUiBinding = EmptyTableRowUiBinding.inflate(LayoutInflater.from(context));
        TableRow.LayoutParams layoutParams = (TableRow.LayoutParams) tableRowUiBinding.mtvCell.getLayoutParams();
        layoutParams.span = spanCount;
        tableRowUiBinding.mtvCell.setLayoutParams(layoutParams);
        tableRowUiBinding.mtvCell.setText(R.string.table_is_empty);
        tableRowUiBinding.mtvCell.setTextColor(Color.RED);
        return tableRowUiBinding.getRoot();
    }


    public TableRow createDataRowUI(List<String> columnList, Context context, View.OnClickListener dataTableRowOnClick) {
        TableRow dataTableRow = new TableRow(context);
        dataTableRow.setBackgroundColor(Color.BLACK);
        dataTableRow.setPadding(2, 2, 2, 2);

        for (int j = 0; j < columnList.size(); j++) {
            LinearLayout llCellView = new LinearLayout(context);
            llCellView.setBackgroundColor(Color.WHITE);
            llCellView.setLayoutParams(tableRowParams);
            TextView tvColumnView = new TextView(context);

            tvColumnView.setText("" + columnList.get(j));
            tvColumnView.setTextColor(Color.parseColor("#000000"));
            tvColumnView.setPadding(0, 0, 4, 3);
            llCellView.addView(tvColumnView);
            dataTableRow.addView(llCellView);
        }
        dataTableRow.setOnClickListener(dataTableRowOnClick);
        return dataTableRow;
    }

}
