package com.sky.atc.easyformse;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.database.Cursor;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.AdapterView.OnItemSelectedListener;
import android.widget.TableLayout;
import android.widget.TableRow;
import android.widget.TableRow.LayoutParams;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.widget.NestedScrollView;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textview.MaterialTextView;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

// Database Manager class for View of Database android
@StringFogIgnore
public class AndroidDatabaseManager extends AppCompatActivity {

    // root Views
    NestedScrollView mainScrollview;
    LinearLayout mainLinearLayout, llRecordCountRow, llNextPreviousRow;
    Spinner mSpinnerSelectTable, mSpinnerCUD;
    LinearLayout.LayoutParams llRecordCountLP;
    EditText etCustomQuery;
    MaterialButton btnPrevious, btnNext, btnCustomQuery, btnSubmitQuery;
    MaterialTextView tvRecordCount, tvHelpText, tvMessagesShow;
    HorizontalScrollView hsv;
    TableLayout tableLayout;
    TableRow.LayoutParams tableRowParams;


    // main Database object
    MySQLiteHelper dbm;

    //a static class to save cursor,table values etc which is used by functions to share data in the program.
    static class indexInfo {
        public static int numberOfPages = 0;
        public static int numberOfRowPages = 10;
        public static int currentPage = 0;
        public static Cursor maincursor;
        public static boolean isEmpty;
        public static boolean isCustomQuery;
    }


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createRootUI();
        //all required layouts are created dynamically and added to the main scrollview
        setContentView(mainScrollview);
        //int below line Change the text 'yourCustomSqlHelper' with your custom sqlitehelper class name
        dbm = new MySQLiteHelper(this);
        initUI();
        //when user enter a custom query in text view and clicks on submit query button
        //display results in tablelayout
        btnSubmitQuery.setOnClickListener(v -> {
            btnCustomQuery.setVisibility(View.GONE);
            String customQuery = etCustomQuery.getText().toString();
            Log.d("query", customQuery);
            //pass the query to getdata method and get results
            ArrayList<Cursor> listCursor = dbm.getData(customQuery);
            Cursor successCursor = listCursor.get(0);
            Cursor errorCursor = listCursor.get(1);
            if (errorCursor == null) {
                return;
            }
            errorCursor.moveToLast();

            // if the query returns results display the results in table layout
            if (errorCursor.getString(0).equalsIgnoreCase("Success")) {
                tvMessagesShow.setBackgroundColor(Color.parseColor("#2ecc71"));
                if (successCursor != null) {
                    btnNext.setVisibility(View.VISIBLE);
                    btnPrevious.setVisibility(View.VISIBLE);
                    tvMessagesShow.setText("Query Executed successfully.Number of rows returned :" + successCursor.getCount());
                    if (successCursor.getCount() > 0) {
                        indexInfo.maincursor = successCursor;
                        if (customQuery.toLowerCase().startsWith("select")) {
                            refreshTable(1, "");
                        } else {
                            successCursor.close();
                            tableLayout.removeAllViews();
                            //  mSpinnerSelectTable.setSelection(0);
                        }
                    }
                } else {
                    if (customQuery.toLowerCase().startsWith("select")) {
                        indexInfo.maincursor = successCursor;
                        btnNext.setVisibility(View.VISIBLE);
                        btnPrevious.setVisibility(View.VISIBLE);
                        String tableName;
                        try {
                            tableName = customQuery.toLowerCase().split("from")[1].trim().split(" ")[0];
                        } catch (Exception e) {
                            e.printStackTrace();
                            tableName = "";
                        }
                        refreshTable(1, tableName);
                        tvMessagesShow.setText("Query Executed successfully.Number of rows returned : 0");
                    } else {
                        tvMessagesShow.setText("Query Executed successfully.Number of rows returned :" + errorCursor.getCount());
                    }
                }

            } else {
                //if there is any error we displayed the error message at the bottom of the screen
                tvMessagesShow.setBackgroundColor(Color.parseColor("#e74c3c"));
                tvMessagesShow.setText("Error:" + errorCursor.getString(0));
            }
            errorCursor.close();
        });
        //layout parameters for each row in the table
        tableRowParams = new TableRow.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
        tableRowParams.setMargins(0, 0, 2, 0);

        addSpinnerSelectTableAdapter();
        // when a table names is selecte display the table contents
        mSpinnerSelectTable.setOnItemSelectedListener(new OnItemSelectedListener() {

            @Override
            public void onItemSelected(AdapterView<?> parent,
                                       View view, int position, long id) {
                if (position == 0 && !indexInfo.isCustomQuery) {
                    llRecordCountRow.setVisibility(View.GONE);
                    hsv.setVisibility(View.GONE);
                    llNextPreviousRow.setVisibility(View.GONE);
                    mSpinnerCUD.setVisibility(View.GONE);
                    tvHelpText.setVisibility(View.GONE);
                    tvMessagesShow.setVisibility(View.GONE);
                    etCustomQuery.setVisibility(View.GONE);
                    btnSubmitQuery.setVisibility(View.GONE);
                    btnCustomQuery.setVisibility(View.GONE);
                } else if (position != 0) {
                    llRecordCountRow.setVisibility(View.VISIBLE);
                    mSpinnerCUD.setVisibility(View.VISIBLE);
                    tvHelpText.setVisibility(View.VISIBLE);
                    etCustomQuery.setVisibility(View.GONE);
                    btnSubmitQuery.setVisibility(View.GONE);
                    btnCustomQuery.setVisibility(View.VISIBLE);
                    hsv.setVisibility(View.VISIBLE);
                    tvMessagesShow.setVisibility(View.VISIBLE);
                    llNextPreviousRow.setVisibility(View.VISIBLE);

                    //displaying the content of the table which is selected in the select_table spinner
                    Log.d("selected table name is", "" + tableNameList.get(position));

                    //removes any data if present in the table layout
                    tableLayout.removeAllViews();

                    addSpinnerCUDAdapter();

                    String Query2 = "select * from " + tableNameList.get(position);
                    Log.d("", "" + Query2);

                    //getting contents of the table which user selected from the select_table spinner
                    ArrayList<Cursor> SelectedTableCursorList = dbm.getData(Query2);
                    final Cursor selectedTableCursorResult = SelectedTableCursorList.get(0);
                    final Cursor selectedTableCursorError = SelectedTableCursorList.get(1);
                    //saving cursor to the static indexinfo class which can be resued by the other functions
                    indexInfo.maincursor = selectedTableCursorResult;
                    // if the cursor returned form the database is not null we display the data in table layout

                    if (selectedTableCursorResult != null) {
                        tvMessagesShow.setBackgroundColor(Color.parseColor("#FFFFFF"));
                        tvMessagesShow.setTextColor(Color.parseColor("#000000"));
                        tvMessagesShow.setText("Error Messages will be displayed here");
                        if (selectedTableCursorResult.getCount() == 0) {
                            //if the cursor returned from the database is empty we show that table is empty
                            tvMessagesShow.setTextColor(Color.parseColor("#FF0000"));
                            tvMessagesShow.setText("No Data Found");
                            tvHelpText.setVisibility(View.GONE);
                            tableLayout.removeAllViews();
                            //getColumnNamesOld();
                            // added Columns in to tableLayout
                            List<String> columnNamesList = getColumnNames(tableNameList.get(position));
                            tableLayout.addView(createColumnsUI(columnNamesList));

                            tableLayout.addView(createEmptyTableUI(columnNamesList.size()));
                            tvRecordCount.setText("" + 0);
                        } else {
                            int counts = selectedTableCursorResult.getCount();
                            indexInfo.isEmpty = false;
                            Log.d("counts", "" + counts);
                            tvRecordCount.setText("" + counts);

                            addSpinnerCUDItemSelectedListener(selectedTableCursorResult, tableNameList.get(position));
                            //display the first row of the table with column names of the table selected by the user
                            List<String> columnNamesList = getColumnNames(tableNameList.get(position));
                            tableLayout.addView(createColumnsUI(columnNamesList));
                            selectedTableCursorResult.moveToFirst();

                            //after displaying columnnames in the first row  we display data in the remaining columns
                            //the below paginatetbale function will display the first 10 tuples of the tables
                            //the remaining tuples can be viewed by clicking on the next button
                            createPageTableDataUI(selectedTableCursorResult, tableNameList.get(position));
                        }
                    } else {
                        //tvMessagesShow.setText("Error Messages will be displayed here");
                        if (selectedTableCursorError != null) {
                            selectedTableCursorError.moveToLast();
                            tvMessagesShow.setTextColor(Color.parseColor("#FF0000"));
                            tvMessagesShow.setText(selectedTableCursorError.getString(0));
                        }
                    }
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> arg0) {
            }
        });
    }

    // creating UI Start *******************************************************************************

    private void createRootUI() {
        mainScrollview = new NestedScrollView(this);
        //the main linear layout to which all tables spinners etc will be added.In this activity every element is created dynamically  to avoid using xml file
        mainLinearLayout = new LinearLayout(this);
        mainLinearLayout.setOrientation(LinearLayout.VERTICAL);
        mainLinearLayout.setBackgroundColor(Color.WHITE);
        mainLinearLayout.setScrollContainer(true);
        NestedScrollView.LayoutParams llSelectTableRowLP = new NestedScrollView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        llSelectTableRowLP.setMargins(10, 10, 10, 10);
        mainLinearLayout.setLayoutParams(llSelectTableRowLP);
        mainScrollview.addView(mainLinearLayout);
    }

    private void initUI() {
        // add table select View to main Root View
        mainLinearLayout.addView(createSelectTableUI());
        mainLinearLayout.addView(createRecordCountUI());
        mainLinearLayout.addView(createCustomQueryUI());
        mainLinearLayout.addView(createSubmitQueryUI());
        addCUDAndHelperTextUI();
        mainLinearLayout.addView(createHorizontalScrollViewUI());
        mainLinearLayout.addView(createNextPreviousRowUI());
        addErrorTextViewUI();
        mainLinearLayout.addView(createCustomQueryButtonUI());
    }

    private LinearLayout createSelectTableUI() {
        //the first row of layout which has a text view and spinner
        LinearLayout llSelectTableRow = new LinearLayout(this);
        llSelectTableRow.setPadding(5, 0, 5, 0);
        LinearLayout.LayoutParams llSelectTableRowLP = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT);
        llSelectTableRowLP.weight = 1;
        llSelectTableRowLP.topMargin = 10;
        llSelectTableRowLP.bottomMargin = 10;

        TextView tvTableText = new TextView(this);
        tvTableText.setText("Select Table: ");
        tvTableText.setTextSize(22);
        llSelectTableRowLP.weight = 0.8f;
        tvTableText.setLayoutParams(llSelectTableRowLP);
        mSpinnerSelectTable = new Spinner(this);
        llSelectTableRowLP.weight = 1.2f;
        mSpinnerSelectTable.setLayoutParams(llSelectTableRowLP);

        llSelectTableRow.addView(tvTableText);
        llSelectTableRow.addView(mSpinnerSelectTable);
        return llSelectTableRow;
    }

    private LinearLayout createRecordCountUI() {
        //the second row of the layout which shows number of records in the table selected by user
        llRecordCountRow = new LinearLayout(this);
        llRecordCountRow.setPadding(0, 10, 0, 10);
        llRecordCountLP = new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT);
        llRecordCountLP.weight = 1;
        TextView recordsText = new TextView(this);
        recordsText.setText("No. Of Records : ");
        recordsText.setTextSize(20);
        recordsText.setLayoutParams(llRecordCountLP);
        tvRecordCount = new MaterialTextView(this);
        tvRecordCount.setTextSize(20);
        tvRecordCount.setLayoutParams(llRecordCountLP);
        llRecordCountRow.addView(recordsText);
        llRecordCountRow.addView(tvRecordCount);
        return llRecordCountRow;
    }

    private EditText createCustomQueryUI() {
        //A button which generates a text view from which user can write custome queries
        etCustomQuery = new EditText(this);
        etCustomQuery.setVisibility(View.GONE);
        etCustomQuery.setHint("Enter Your Query here and Click on Submit Query Button .Results will be displayed below");
        return etCustomQuery;
    }

    private Button createSubmitQueryUI() {
        btnSubmitQuery = new MaterialButton(this);
        btnSubmitQuery.setVisibility(View.GONE);
        btnSubmitQuery.setText("Submit Query");
        LinearLayout.LayoutParams llSubmitQueryLP = new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT);
        llSubmitQueryLP.setMargins(10, 5, 10, 10);
        //btnSubmitQuery.setBackgroundColor(Color.parseColor("#BAE7F6"));
        btnSubmitQuery.setLayoutParams(llSubmitQueryLP);
        return btnSubmitQuery;
    }

    private void addCUDAndHelperTextUI() {
        tvHelpText = new MaterialTextView(this);
        tvHelpText.setText("Click on the row below to update values or delete the tuple");
        tvHelpText.setPadding(0, 5, 0, 5);
        tvHelpText.setTextAlignment(View.TEXT_ALIGNMENT_CENTER);
        // the spinner which gives user a option to add new row , drop or delete table
        mSpinnerCUD = new Spinner(this);
        mainLinearLayout.addView(mSpinnerCUD);
        mainLinearLayout.addView(tvHelpText);
    }

    private HorizontalScrollView createHorizontalScrollViewUI() {
        //the horizontal scroll view for table if the table content doesnot fit into screen
        hsv = new HorizontalScrollView(AndroidDatabaseManager.this);
        //the main table layout where the content of the sql tables will be displayed when user selects a table
        tableLayout = new TableLayout(AndroidDatabaseManager.this);
        tableLayout.setHorizontalScrollBarEnabled(true);
        hsv.addView(tableLayout);
        hsv.setPadding(0, 10, 0, 10);
        hsv.setScrollbarFadingEnabled(false);
        hsv.setScrollBarStyle(View.SCROLLBARS_OUTSIDE_INSET);
        return hsv;
    }

    private LinearLayout createNextPreviousRowUI() {
        //the third layout which has buttons for the pagination of content from database
        llNextPreviousRow = new LinearLayout(this);
        btnPrevious = new MaterialButton(this);
        btnPrevious.setText("Previous");
        //  btnPrevious.setBackgroundColor(Color.parseColor("#BAE7F6"));
        llRecordCountLP.setMargins(10, 2, 10, 10);
        btnPrevious.setLayoutParams(llRecordCountLP);
        btnNext = new MaterialButton(this);
        btnNext.setText("Next");
        // btnNext.setBackgroundColor(Color.parseColor("#BAE7F6"));
        btnNext.setLayoutParams(llRecordCountLP);
        TextView tvblank = new TextView(this);
        tvblank.setLayoutParams(llRecordCountLP);
        llNextPreviousRow.setPadding(0, 10, 0, 10);
        llNextPreviousRow.addView(btnPrevious);
        llNextPreviousRow.addView(tvblank);
        llNextPreviousRow.addView(btnNext);
        return llNextPreviousRow;
    }

    private void addErrorTextViewUI() {
        //the text view at the bottom of the screen which displays error or success messages after a query is executed
        tvMessagesShow = new MaterialTextView(this);
        tvMessagesShow.setPadding(10, 10, 10, 10);

        tvMessagesShow.setText("Error Messages will be displayed here");
        tvMessagesShow.setTextSize(18);
        tvMessagesShow.setTextAlignment(View.TEXT_ALIGNMENT_CENTER);
        mainLinearLayout.addView(tvMessagesShow);
    }

    private MaterialButton createCustomQueryButtonUI() {
        btnCustomQuery = new MaterialButton(this);
        btnCustomQuery.setText("Custom Query");
        LinearLayout.LayoutParams llCustomQueryLP = new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT);
        llCustomQueryLP.setMargins(10, 10, 10, 10);
        //btnCustomQuerySubmit.setBackgroundColor(Color.parseColor("#BAE7F6"));
        btnCustomQuery.setLayoutParams(llCustomQueryLP);
        btnCustomQuery.setOnClickListener(v -> {
            //set drop down to custom Query
            indexInfo.isCustomQuery = true;
            tableLayout.removeAllViews();
            llRecordCountRow.setVisibility(View.GONE);
            mSpinnerCUD.setVisibility(View.GONE);
            tvHelpText.setVisibility(View.GONE);
            etCustomQuery.setVisibility(View.VISIBLE);
            btnSubmitQuery.setVisibility(View.VISIBLE);
            mSpinnerSelectTable.setSelection(0);
            btnCustomQuery.setVisibility(View.GONE);
            btnNext.setVisibility(View.GONE);
            btnPrevious.setVisibility(View.GONE);
        });
        return btnCustomQuery;
    }

    // creating UI End *******************************************************************************

    private TableRow createColumnsUI(List<String> columnNamesList) {
        TableRow tableRowColumnNames = new TableRow(this);
        tableRowColumnNames.setBackgroundColor(Color.BLACK);
        tableRowColumnNames.setPadding(2, 2, 0, 2);
        for (int k = 0; k < columnNamesList.size(); k++) {
            LinearLayout llCellView = new LinearLayout(AndroidDatabaseManager.this);
            llCellView.setBackgroundColor(Color.WHITE);
            llCellView.setLayoutParams(tableRowParams);
            TextView tvColumnName = new TextView(this);
            tvColumnName.setPadding(4, 4, 4, 4);
            tvColumnName.setText(columnNamesList.get(k));
            tvColumnName.setTextColor(Color.parseColor("#000000"));
            llCellView.addView(tvColumnName);
            tableRowColumnNames.addView(llCellView);
        }
        return tableRowColumnNames;
    }

    ArrayList<String> tableNameList = new ArrayList<String>();
    //an array adapter with above created arraylist
    ArrayAdapter<String> tableNamesAdapter;

    private void addSpinnerCUDItemSelectedListener(Cursor resultCursor, String tableName) {
        //the spinnertable has the 3 items to drop , delete , add row to the table selected by the user
        //here we handle the 3 operations.
        mSpinnerCUD.setOnItemSelectedListener((new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parentView, View selectedItemView, int position, long id) {


                ((TextView) parentView.getChildAt(0)).setTextColor(Color.rgb(0, 0, 0));
                //when user selects to drop the table the below code in if block will be executed
                if (mSpinnerCUD.getSelectedItem().toString().equals("Drop this table")) {
                    // an alert dialog to confirm user selection
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (!isFinishing()) {

                                new AlertDialog.Builder(AndroidDatabaseManager.this)
                                        .setTitle("Are you sure ?")
                                        .setMessage("Pressing yes will remove " + tableName + " table from database")
                                        .setPositiveButton("yes",
                                                new DialogInterface.OnClickListener() {
                                                    // when user confirms by clicking on yes we drop the table by executing drop table query
                                                    public void onClick(DialogInterface dialog, int which) {

                                                        String Query6 = "Drop table " + tableName;
                                                        ArrayList<Cursor> aldropt = dbm.getData(Query6);
                                                        Cursor tempc = aldropt.get(1);
                                                        tempc.moveToLast();
                                                        Log.d("Drop table Mesage", tempc.getString(0));
                                                        if (tempc.getString(0).equalsIgnoreCase("Success")) {
                                                            tvMessagesShow.setBackgroundColor(Color.parseColor("#2ecc71"));
                                                            tvMessagesShow.setText(tableName + "Dropped successfully");
                                                            restartActivity();
                                                        } else {
                                                            //if there is any error we displayd the error message at the bottom of the screen
                                                            tvMessagesShow.setBackgroundColor(Color.parseColor("#e74c3c"));
                                                            tvMessagesShow.setText("Error:" + tempc.getString(0));
                                                            mSpinnerCUD.setSelection(0);
                                                        }
                                                    }
                                                })
                                        .setNegativeButton("No",
                                                new DialogInterface.OnClickListener() {
                                                    public void onClick(DialogInterface dialog, int which) {
                                                        mSpinnerCUD.setSelection(0);
                                                    }
                                                })
                                        .create().show();
                            }
                        }
                    });

                }
                //when user selects to drop the table the below code in if block will be executed
                if (mSpinnerCUD.getSelectedItem().toString().equals("Delete this table")) {    // an alert dialog to confirm user selection
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (!isFinishing()) {

                                new AlertDialog.Builder(AndroidDatabaseManager.this)
                                        .setTitle("Are you sure?")
                                        .setMessage("Clicking on yes will delete all the contents of " + tableName + " table from database")
                                        .setPositiveButton("yes",
                                                new DialogInterface.OnClickListener() {

                                                    // when user confirms by clicking on yes we drop the table by executing delete table query
                                                    public void onClick(DialogInterface dialog, int which) {
                                                        String Query7 = "Delete  from " + tableName;
                                                        Log.d("delete table query", Query7);
                                                        ArrayList<Cursor> aldeletet = dbm.getData(Query7);
                                                        Cursor tempc = aldeletet.get(1);
                                                        tempc.moveToLast();
                                                        Log.d("Delete table Mesage", tempc.getString(0));
                                                        if (tempc.getString(0).equalsIgnoreCase("Success")) {
                                                            tvMessagesShow.setBackgroundColor(Color.parseColor("#2ecc71"));
                                                            tvMessagesShow.setText(tableName + " table content deleted successfully");
                                                            indexInfo.isEmpty = true;
                                                            refreshTable(0, tableName);
                                                        } else {
                                                            tvMessagesShow.setBackgroundColor(Color.parseColor("#e74c3c"));
                                                            tvMessagesShow.setText("Error:" + tempc.getString(0));
                                                            mSpinnerCUD.setSelection(0);
                                                        }
                                                    }
                                                })
                                        .setNegativeButton("No",
                                                new DialogInterface.OnClickListener() {
                                                    public void onClick(DialogInterface dialog, int which) {
                                                        mSpinnerCUD.setSelection(0);
                                                    }
                                                })
                                        .create().show();
                            }
                        }
                    });

                }

                //when user selects to add row to the table the below code in if block will be executed
                if (mSpinnerCUD.getSelectedItem().toString().equals("Add row to this table")) {
                    //we create a layout which has textviews with column names of the table and edittexts where
                    //user can enter value which will be inserted into the datbase.
                    final LinkedList<TextView> addnewrownames = new LinkedList<TextView>();
                    final LinkedList<EditText> addnewrowvalues = new LinkedList<EditText>();
                    final ScrollView addrowsv = new ScrollView(AndroidDatabaseManager.this);
                    //Cursor c4 = indexInfo.maincursor;
                    if (indexInfo.isEmpty) {
                        List<String> columnNamesList = getColumnNames(tableNameList.get(position));
                        for (int i = 0; i < columnNamesList.size(); i++) {
                            String cname = columnNamesList.get(i);
                            TextView tv = new TextView(getApplicationContext());
                            tv.setText(cname);
                            addnewrownames.add(tv);
                            EditText et = new EditText(getApplicationContext());
                            addnewrowvalues.add(et);
                        }

                    } else {
                        for (int i = 0; i < resultCursor.getColumnCount(); i++) {
                            String cname = resultCursor.getColumnName(i);
                            TextView tv = new TextView(getApplicationContext());
                            tv.setText(cname);
                            addnewrownames.add(tv);

                        }
                        for (int i = 0; i < addnewrownames.size(); i++) {
                            EditText et = new EditText(getApplicationContext());
                            addnewrowvalues.add(et);
                        }
                    }
                    final RelativeLayout addnewlayout = new RelativeLayout(AndroidDatabaseManager.this);
                    RelativeLayout.LayoutParams addnewparams = new RelativeLayout.LayoutParams(RelativeLayout.LayoutParams.WRAP_CONTENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
                    addnewparams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
                    for (int i = 0; i < addnewrownames.size(); i++) {
                        TextView tv = addnewrownames.get(i);
                        EditText et = addnewrowvalues.get(i);

                        tv.setTextColor(Color.parseColor("#000000"));

                        et.setBackgroundColor(Color.parseColor("#F2F2F2"));
                        et.setTextColor(Color.parseColor("#000000"));
                        LinearLayout ll = new LinearLayout(AndroidDatabaseManager.this);
                        LinearLayout.LayoutParams tvl = new LinearLayout.LayoutParams(0, 100);
                        tvl.weight = 1;
                        ll.addView(tv, tvl);
                        ll.addView(et, tvl);

                        Log.d("Edit Text Value", "" + et.getText().toString());

                        RelativeLayout.LayoutParams rll = new RelativeLayout.LayoutParams(RelativeLayout.LayoutParams.MATCH_PARENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
                        rll.addRule(RelativeLayout.BELOW, ll.getId() - 1);
                        rll.setMargins(0, 20, 0, 0);
                        addnewlayout.addView(ll, rll);

                    }
                    addnewlayout.setBackgroundColor(Color.WHITE);
                    addrowsv.addView(addnewlayout);
                    Log.d("Button Clicked", "");
                    //the above form layout which we have created above will be displayed in an alert dialog
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (!isFinishing()) {
                                new AlertDialog.Builder(AndroidDatabaseManager.this)
                                        .setTitle("values")
                                        .setCancelable(false)
                                        .setView(addrowsv)
                                        .setPositiveButton("Add",
                                                new DialogInterface.OnClickListener() {
                                                    // after entering values if user clicks on add we take the values and run a insert query
                                                    public void onClick(DialogInterface dialog, int which) {

                                                        //tableLayout.removeAllViews();
                                                        //trigger select table listener to be triggerd
                                                        String Query4 = "Insert into " + tableName + " (";
                                                        for (int i = 0; i < addnewrownames.size(); i++) {

                                                            TextView tv = addnewrownames.get(i);
                                                            tv.getText().toString();
                                                            if (i == addnewrownames.size() - 1) {

                                                                Query4 = Query4 + tv.getText().toString();

                                                            } else {
                                                                Query4 = Query4 + tv.getText().toString() + ", ";
                                                            }
                                                        }
                                                        Query4 = Query4 + " ) VALUES ( ";
                                                        for (int i = 0; i < addnewrownames.size(); i++) {
                                                            EditText et = addnewrowvalues.get(i);
                                                            et.getText().toString();

                                                            if (i == addnewrownames.size() - 1) {

                                                                Query4 = Query4 + "'" + et.getText().toString() + "' ) ";
                                                            } else {
                                                                Query4 = Query4 + "'" + et.getText().toString() + "' , ";
                                                            }


                                                        }
                                                        //this is the insert query which has been generated
                                                        Log.d("Insert Query", Query4);
                                                        ArrayList<Cursor> altc = dbm.getData(Query4);
                                                        Cursor tempc = altc.get(1);
                                                        tempc.moveToLast();
                                                        Log.d("Add New Row", tempc.getString(0));
                                                        if (tempc.getString(0).equalsIgnoreCase("Success")) {
                                                            tvMessagesShow.setBackgroundColor(Color.parseColor("#2ecc71"));
                                                            tvMessagesShow.setText("New Row added succesfully to " + tableName);
                                                            refreshTable(0, tableName);
                                                        } else {
                                                            tvMessagesShow.setBackgroundColor(Color.parseColor("#e74c3c"));
                                                            tvMessagesShow.setText("Error:" + tempc.getString(0));
                                                            mSpinnerCUD.setSelection(0);
                                                        }

                                                    }
                                                })
                                        .setNegativeButton("close",
                                                new DialogInterface.OnClickListener() {
                                                    public void onClick(DialogInterface dialog, int which) {
                                                        mSpinnerCUD.setSelection(0);
                                                    }
                                                })
                                        .create().show();
                            }
                        }
                    });
                }
            }

            public void onNothingSelected(AdapterView<?> arg0) {
            }
        }));
    }

    private void addSpinnerCUDAdapter() {
        ArrayList<String> spinnertablevalues = new ArrayList<String>();
        spinnertablevalues.add("Click here to change this table");
        spinnertablevalues.add("Add row to this table");
        spinnertablevalues.add("Delete this table");
        spinnertablevalues.add("Drop this table");
        ArrayAdapter<String> spinnerArrayAdapter = new ArrayAdapter<String>(getApplicationContext(), android.R.layout.simple_spinner_dropdown_item, spinnertablevalues);
        spinnerArrayAdapter.setDropDownViewResource(android.R.layout.simple_spinner_item);

        // a array adapter which add values to the spinner which helps in user making changes to the table
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(AndroidDatabaseManager.this,
                android.R.layout.simple_spinner_item, spinnertablevalues) {

            public View getView(int position, View convertView, ViewGroup parent) {
                View v = super.getView(position, convertView, parent);

                v.setBackgroundColor(Color.WHITE);
                TextView adap = (TextView) v;
                adap.setTextSize(20);

                return adap;
            }

            public View getDropDownView(int position, View convertView, ViewGroup parent) {
                View v = super.getDropDownView(position, convertView, parent);

                v.setBackgroundColor(Color.WHITE);

                return v;
            }
        };

        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        mSpinnerCUD.setAdapter(adapter);
    }

    private void addSpinnerSelectTableAdapter() {
        // a query which returns a cursor with the list of tables in the database.We use this cursor to populate spinner in the first row
        ArrayList<Cursor> TableNameCursorList = dbm.getData("SELECT name _id FROM sqlite_master WHERE type ='table'");
        //the first cursor has results of the query
        Cursor cursorResult = TableNameCursorList.get(0);

        //the second cursor has error messages
        Cursor cursorError = TableNameCursorList.get(1);

        if (cursorError != null) {
            cursorError.moveToLast();
            String msg = cursorError.getString(0);
            Log.d("Message from sql = ", msg);
            cursorError.close();
        }
        if (cursorResult != null) {
            cursorResult.moveToFirst();
            tableNameList.add("click here");
            do {
                //add names of the table to tablenames array list
                tableNameList.add(cursorResult.getString(0));
            } while (cursorResult.moveToNext());
            cursorResult.close();
        }

        tableNamesAdapter = new ArrayAdapter<String>(this,
                android.R.layout.simple_spinner_item, tableNameList) {

            public View getView(int position, View convertView, ViewGroup parent) {
                View v = super.getView(position, convertView, parent);
                v.setBackgroundColor(Color.WHITE);
                TextView adap = (TextView) v;
                adap.setTextSize(20);
                return adap;
            }


            public View getDropDownView(int position, View convertView, ViewGroup parent) {
                View v = super.getDropDownView(position, convertView, parent);

                v.setBackgroundColor(Color.WHITE);

                return v;
            }
        };
        tableNamesAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        if (tableNamesAdapter != null) {
            //set the adpater to select_table spinner
            mSpinnerSelectTable.setAdapter(tableNamesAdapter);
        }
    }

    //get columnNames of the empty tables and save them in a array list
    public List<String> getColumnNames(Cursor columnCursor) {
        List<String> columnNamesList = new ArrayList<String>();
        for (int k = 0; k < columnCursor.getColumnCount(); k++) {
            columnNamesList.add("" + columnCursor.getColumnName(k));
        }
        return columnNamesList;
    }

    //get columnNames of the empty tables and save them in a array list
    public List<String> getColumnNames(String tableName) {
        List<String> columnNamesList = new ArrayList<String>();
        List<Cursor> cursorColumnNamesList = dbm.getData("PRAGMA table_info(" + tableName + ")");
        Cursor cursorResult = cursorColumnNamesList.get(0);
        indexInfo.isEmpty = true;
        if (cursorResult != null) {
            indexInfo.isEmpty = true;
            cursorResult.moveToFirst();
            do {
                columnNamesList.add(cursorResult.getString(1));
            } while (cursorResult.moveToNext());
        }
        return columnNamesList;
    }

    //displays alert dialog from which use can update or delete a row
    public void updateDeletePopup(List<String> columnValueList, String tableName) {
        Cursor c2 = indexInfo.maincursor;
        // a spinner which gives options to update or delete the row which user has selected
        ArrayList<String> spinnerArray = new ArrayList<String>();
        spinnerArray.add("Click Here to Change this row");
        spinnerArray.add("Update this row");
        spinnerArray.add("Delete this row");

        //create a layout with text values which has the column names and
        //edit texts which has the values of the row which user has selected
        final LinkedList<TextView> columnames = new LinkedList<TextView>();
        final LinkedList<EditText> columvalues = new LinkedList<EditText>();

        for (int i = 0; i < c2.getColumnCount(); i++) {
            String cname = c2.getColumnName(i);
            TextView tv = new TextView(getApplicationContext());
            tv.setText(cname);
            columnames.add(tv);

        }
        for (int i = 0; i < columnames.size(); i++) {
            String cv = columnValueList.get(i);
            EditText et = new EditText(getApplicationContext());
            columnValueList.add(cv);
            et.setText(cv);
            columvalues.add(et);
        }

        int lastrid = 0;
        // all text views , edit texts are added to this relative layout lp
        final RelativeLayout lp = new RelativeLayout(AndroidDatabaseManager.this);
        lp.setBackgroundColor(Color.WHITE);
        RelativeLayout.LayoutParams lay = new RelativeLayout.LayoutParams(RelativeLayout.LayoutParams.WRAP_CONTENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
        lay.addRule(RelativeLayout.ALIGN_PARENT_TOP);

        final ScrollView updaterowsv = new ScrollView(AndroidDatabaseManager.this);
        LinearLayout lcrud = new LinearLayout(AndroidDatabaseManager.this);

        LinearLayout.LayoutParams paramcrudtext = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);

        paramcrudtext.setMargins(0, 20, 0, 0);

        //spinner which displays update , delete options
        final Spinner crud_dropdown = new Spinner(getApplicationContext());

        ArrayAdapter<String> crudadapter = new ArrayAdapter<String>(AndroidDatabaseManager.this,
                android.R.layout.simple_spinner_item, spinnerArray) {

            public View getView(int position, View convertView, ViewGroup parent) {
                View v = super.getView(position, convertView, parent);

                v.setBackgroundColor(Color.WHITE);
                TextView adap = (TextView) v;
                adap.setTextSize(20);

                return adap;
            }


            public View getDropDownView(int position, View convertView, ViewGroup parent) {
                View v = super.getDropDownView(position, convertView, parent);

                v.setBackgroundColor(Color.WHITE);

                return v;
            }
        };


        crudadapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);

        crud_dropdown.setAdapter(crudadapter);
        lcrud.setId(299);
        lcrud.addView(crud_dropdown, paramcrudtext);

        RelativeLayout.LayoutParams rlcrudparam = new RelativeLayout.LayoutParams(RelativeLayout.LayoutParams.MATCH_PARENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
        rlcrudparam.addRule(RelativeLayout.BELOW, lastrid);

        lp.addView(lcrud, rlcrudparam);
        for (int i = 0; i < columnames.size(); i++) {
            TextView tv = columnames.get(i);
            EditText et = columvalues.get(i);
            int t = i + 100;
            int k = i + 200;
            int lid = i + 300;

            tv.setId(t);
            tv.setTextColor(Color.parseColor("#000000"));
            et.setBackgroundColor(Color.parseColor("#F2F2F2"));

            et.setTextColor(Color.parseColor("#000000"));
            et.setId(k);
            Log.d("text View Value", "" + tv.getText().toString());
            final LinearLayout ll = new LinearLayout(AndroidDatabaseManager.this);
            ll.setBackgroundColor(Color.parseColor("#FFFFFF"));
            ll.setId(lid);
            LinearLayout.LayoutParams lpp = new LinearLayout.LayoutParams(0, 100);
            lpp.weight = 1;
            tv.setLayoutParams(lpp);
            et.setLayoutParams(lpp);
            ll.addView(tv);
            ll.addView(et);

            Log.d("Edit Text Value", "" + et.getText().toString());

            RelativeLayout.LayoutParams rll = new RelativeLayout.LayoutParams(RelativeLayout.LayoutParams.MATCH_PARENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
            rll.addRule(RelativeLayout.BELOW, ll.getId() - 1);
            rll.setMargins(0, 20, 0, 0);
            lastrid = ll.getId();
            lp.addView(ll, rll);

        }

        updaterowsv.addView(lp);
        //after the layout has been created display it in a alert dialog  
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (!isFinishing()) {
                    new AlertDialog.Builder(AndroidDatabaseManager.this)
                            .setTitle("values")
                            .setView(updaterowsv)
                            .setCancelable(false)
                            .setPositiveButton("Ok",
                                    new DialogInterface.OnClickListener() {

                                        //this code will be executed when user changes values of edit text or spinner and clicks on ok button
                                        public void onClick(DialogInterface dialog, int which) {

                                            //get spinner value
                                            String spinner_value = crud_dropdown.getSelectedItem().toString();

                                            //it he spinner value is update this row get the values from
                                            //edit text fields generate a update query and execute it
                                            if (spinner_value.equalsIgnoreCase("Update this row")) {
                                                String Query3 = "UPDATE " + tableName + " SET ";

                                                for (int i = 0; i < columnames.size(); i++) {
                                                    TextView tvc = columnames.get(i);
                                                    EditText etc = columvalues.get(i);

                                                    if (!etc.getText().toString().equals("null")) {

                                                        Query3 = Query3 + tvc.getText().toString() + " = ";

                                                        if (i == columnames.size() - 1) {

                                                            Query3 = Query3 + "'" + etc.getText().toString() + "'";

                                                        } else {

                                                            Query3 = Query3 + "'" + etc.getText().toString() + "' , ";

                                                        }
                                                    }

                                                }
                                                Query3 = Query3 + " where ";
                                                for (int i = 0; i < columnames.size(); i++) {
                                                    TextView tvc = columnames.get(i);
                                                    if (!columnValueList.get(i).equals("null")) {

                                                        Query3 = Query3 + tvc.getText().toString() + " = ";

                                                        if (i == columnames.size() - 1) {

                                                            Query3 = Query3 + "'" + columnValueList.get(i) + "' ";

                                                        } else {
                                                            Query3 = Query3 + "'" + columnValueList.get(i) + "' and ";
                                                        }

                                                    }
                                                }
                                                Log.d("Update Query", Query3);
                                                //dbm.getData(Query3);
                                                ArrayList<Cursor> aluc = dbm.getData(Query3);
                                                Cursor tempc = aluc.get(1);
                                                tempc.moveToLast();
                                                Log.d("Update Mesage", tempc.getString(0));

                                                if (tempc.getString(0).equalsIgnoreCase("Success")) {
                                                    tvMessagesShow.setBackgroundColor(Color.parseColor("#2ecc71"));
                                                    tvMessagesShow.setText(tableName + " table Updated Successfully");
                                                    refreshTable(0, tableName);
                                                } else {
                                                    tvMessagesShow.setBackgroundColor(Color.parseColor("#e74c3c"));
                                                    tvMessagesShow.setText("Error:" + tempc.getString(0));
                                                }
                                            }
                                            //it he spinner value is delete this row get the values from
                                            //edit text fields generate a delete query and execute it

                                            if (spinner_value.equalsIgnoreCase("Delete this row")) {

                                                String Query5 = "DELETE FROM " + tableName + " WHERE ";

                                                for (int i = 0; i < columnames.size(); i++) {
                                                    TextView tvc = columnames.get(i);
                                                    if (!columnValueList.get(i).equals("null")) {

                                                        Query5 = Query5 + tvc.getText().toString() + " = ";

                                                        if (i == columnames.size() - 1) {

                                                            Query5 = Query5 + "'" + columnValueList.get(i) + "' ";

                                                        } else {
                                                            Query5 = Query5 + "'" + columnValueList.get(i) + "' and ";
                                                        }

                                                    }
                                                }
                                                Log.d("Delete Query", Query5);

                                                dbm.getData(Query5);

                                                ArrayList<Cursor> aldc = dbm.getData(Query5);
                                                Cursor tempc = aldc.get(1);
                                                tempc.moveToLast();
                                                Log.d("Update Mesage", tempc.getString(0));

                                                if (tempc.getString(0).equalsIgnoreCase("Success")) {
                                                    tvMessagesShow.setBackgroundColor(Color.parseColor("#2ecc71"));
                                                    tvMessagesShow.setText("Row deleted from " + tableName + " table");
                                                    refreshTable(0, tableName);
                                                } else {
                                                    tvMessagesShow.setBackgroundColor(Color.parseColor("#e74c3c"));
                                                    tvMessagesShow.setText("Error:" + tempc.getString(0));
                                                }
                                            }
                                        }

                                    })
                            .setNegativeButton("close",
                                    new DialogInterface.OnClickListener() {
                                        public void onClick(DialogInterface dialog, int which) {

                                        }
                                    })
                            .create().show();
                }
            }
        });
    }

    public void restartActivity() {
        startActivity(getIntent());
        finish();
    }

    public void refreshTable(int d, String tableName) {
        Cursor c3 = null;
        tableLayout.removeAllViews();
        if (d == 0) {
            String Query8 = "select * from " + tableName;
            ArrayList<Cursor> alc3 = dbm.getData(Query8);
            c3 = alc3.get(0);
            //saving cursor to the static indexinfo class which can be resued by the other functions
            indexInfo.maincursor = c3;
        }
        if (d == 1) {
            c3 = indexInfo.maincursor;
        }
        // if the cursor returened form tha database is not null we display the data in table layout
        llRecordCountRow.setVisibility(View.VISIBLE);
        if (c3 != null) {
            int counts = c3.getCount();
            llRecordCountRow.setVisibility(View.VISIBLE);
            tvRecordCount.setText("" + counts);
            tableLayout.addView(createColumnsUI(getColumnNames(c3)));
            c3.moveToFirst();
            //after displaying column names in the first row  we display data in the remaining columns
            //the below paginate table function will display the first 10 tuples of the tables
            //the remaining tuples can be viewed by clicking on the next button
            createPageTableDataUI(c3, tableName);
        } else {

            tvRecordCount.setText("0");
            List<String> columnNamesList = getColumnNames(tableName);
            tableLayout.addView(createColumnsUI(columnNamesList));
            tableLayout.addView(createEmptyTableUI(columnNamesList.size()));
            tvRecordCount.setText("" + 0);
        }
    }

    private TableRow createEmptyTableUI(int spanCount) {
        TableRow emptyTableRow = new TableRow(getApplicationContext());
        emptyTableRow.setBackgroundColor(Color.BLACK);
        emptyTableRow.setPadding(3, 1, 3, 3);

        LinearLayout llCellView = new LinearLayout(AndroidDatabaseManager.this);
        llCellView.setBackgroundColor(Color.WHITE);
        llCellView.setLayoutParams(tableRowParams);

        TableRow.LayoutParams layoutParams = new TableRow.LayoutParams();
        layoutParams.span = spanCount;
        llCellView.setLayoutParams(layoutParams);

        TextView tvTableColumn = new TextView(getApplicationContext());
        tvTableColumn.setPadding(4, 4, 4, 4);
        tvTableColumn.setText("   Table   Is   Empty   ");
        tvTableColumn.setTextSize(30);
        tvTableColumn.setTextColor(Color.RED);

        llCellView.addView(tvTableColumn);
        emptyTableRow.addView(llCellView);
        return emptyTableRow;
    }

    //the function which displays tuples from database in a table layout
    public void createPageTableDataUI(Cursor resultCursor, String tableName) {

        indexInfo.numberOfPages = (resultCursor.getCount() / indexInfo.numberOfRowPages) + 1;
        indexInfo.currentPage = 1;
        resultCursor.moveToFirst();
        int currentrow = 0;
        //display the first 10 tuples of the table selected by user
        do {
            tableLayout.addView(createDataRowUI(resultCursor, tableName));
            currentrow = currentrow + 1;
        } while (resultCursor.moveToNext() && currentrow < indexInfo.numberOfRowPages);


        // when user clicks on the previous button update the table with the previous 10 tuples from the database
        btnPrevious.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                int tobestartindex = (indexInfo.currentPage - 2) * indexInfo.numberOfRowPages;

                //if the tbale layout has the first 10 tuples then toast that this is the first page
                if (indexInfo.currentPage == 1) {
                    Toast.makeText(getApplicationContext(), "This is the first page", Toast.LENGTH_SHORT).show();
                } else {
                    indexInfo.currentPage = indexInfo.currentPage - 1;
                    resultCursor.moveToPosition(tobestartindex);

                    boolean decider = true;
                    for (int i = 1; i < tableLayout.getChildCount(); i++) {
                        TableRow tableRow = (TableRow) tableLayout.getChildAt(i);


                        if (decider) {
                            tableRow.setVisibility(View.VISIBLE);
                            for (int j = 0; j < tableRow.getChildCount(); j++) {
                                LinearLayout llcolumn = (LinearLayout) tableRow.getChildAt(j);
                                TextView columsView = (TextView) llcolumn.getChildAt(0);

                                columsView.setText("" + resultCursor.getString(j));

                            }
                            decider = !resultCursor.isLast();
                            if (!resultCursor.isLast()) {
                                resultCursor.moveToNext();
                            }
                        } else {
                            tableRow.setVisibility(View.GONE);
                        }

                    }
                    Log.d("index =", "" + tobestartindex);
                }
            }
        });

        // when user clicks on the next button update the table with the next 10 tuples from the database
        btnNext.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                //if there are no tuples to be shown toast that this the last page
                if (indexInfo.currentPage >= indexInfo.numberOfPages) {
                    Toast.makeText(getApplicationContext(), "This is the last page", Toast.LENGTH_SHORT).show();
                } else {
                    indexInfo.currentPage = indexInfo.currentPage + 1;
                    boolean decider = true;


                    for (int i = 1; i < tableLayout.getChildCount(); i++) {
                        TableRow tableRow = (TableRow) tableLayout.getChildAt(i);


                        if (decider) {
                            tableRow.setVisibility(View.VISIBLE);
                            for (int j = 0; j < tableRow.getChildCount(); j++) {
                                LinearLayout llcolumn = (LinearLayout) tableRow.getChildAt(j);
                                TextView columsView = (TextView) llcolumn.getChildAt(0);

                                columsView.setText("" + resultCursor.getString(j));

                            }
                            decider = !resultCursor.isLast();
                            if (!resultCursor.isLast()) {
                                resultCursor.moveToNext();
                            }
                        } else {
                            tableRow.setVisibility(View.GONE);
                        }
                    }
                }
            }
        });

    }

    private TableRow createDataRowUI(Cursor cursorResultData, String tableName) {
        TableRow dataTableRow = new TableRow(this);
        dataTableRow.setBackgroundColor(Color.BLACK);
        dataTableRow.setPadding(2, 2, 2, 2);

        for (int j = 0; j < cursorResultData.getColumnCount(); j++) {
            LinearLayout llCellView = new LinearLayout(this);
            llCellView.setBackgroundColor(Color.WHITE);
            llCellView.setLayoutParams(tableRowParams);
            TextView tvColumnView = new TextView(getApplicationContext());

            tvColumnView.setText("" + cursorResultData.getString(j));
            tvColumnView.setTextColor(Color.parseColor("#000000"));
            tvColumnView.setPadding(0, 0, 4, 3);
            llCellView.addView(tvColumnView);
            dataTableRow.addView(llCellView);
        }
        //we create listener for each table row when clicked a alert dialog will be displayed
        //from where user can update or delete the row
        dataTableRow.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
                List<String> columnValueList = new ArrayList<String>();
                for (int i = 0; i < cursorResultData.getColumnCount(); i++) {
                    LinearLayout llcolumn = (LinearLayout) dataTableRow.getChildAt(i);
                    TextView tc = (TextView) llcolumn.getChildAt(0);

                    String cv = tc.getText().toString();
                    columnValueList.add(cv);

                }
                //the below function will display the alert dialog
                if (!tableName.equalsIgnoreCase("")) {
                    updateDeletePopup(columnValueList, tableName);
                } else {
                    Toast.makeText(AndroidDatabaseManager.this, "click not available in customQuery", Toast.LENGTH_SHORT).show();
                }
            }
        });

        return dataTableRow;
    }
}
