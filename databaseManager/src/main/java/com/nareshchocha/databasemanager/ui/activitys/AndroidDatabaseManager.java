package com.nareshchocha.databasemanager.ui.activitys;

import android.content.res.ColorStateList;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.LinearLayout;
import android.widget.TableRow;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.widget.NestedScrollView;
import androidx.lifecycle.Observer;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.snackbar.Snackbar;
import com.google.android.material.textfield.TextInputLayout;
import com.nareshchocha.databasemanager.R;
import com.nareshchocha.databasemanager.Utils.DialogUtils;
import com.nareshchocha.databasemanager.databinding.DialogItemViewBinding;
import com.nareshchocha.databasemanager.databinding.ManagerDatabaseAndroidBinding;
import com.nareshchocha.databasemanager.models.MessageData;
import com.nareshchocha.databasemanager.viewmodels.DatabaseManagerViewModel;

import java.util.ArrayList;
import java.util.List;

import io.michaelrocks.paranoid.Obfuscate;

/**
 * before staring this activity set DatabaseManagerSQLite.setSqlDB( SQLiteDatabase );
 */
@Obfuscate
public class AndroidDatabaseManager extends AppCompatActivity {
    ManagerDatabaseAndroidBinding managerDatabaseAndroidBinding;
    DatabaseManagerViewModel databaseManagerViewModel;


    List<String> tableNameList = new ArrayList<String>();
    //an array adapter with above created arraylist
    ArrayAdapter<String> tableNamesAdapter;
    ArrayAdapter<String> crudOperationAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        managerDatabaseAndroidBinding = ManagerDatabaseAndroidBinding.inflate(getLayoutInflater());
        setContentView(managerDatabaseAndroidBinding.getRoot());
        databaseManagerViewModel = new ViewModelProvider(this).get(DatabaseManagerViewModel.class);
        initUi();
        setObserves();
    }


    private void initUi() {
        tableNamesAdapter = new ArrayAdapter<>(this, android.R.layout.simple_dropdown_item_1line, tableNameList);
        //set the Adapter to select_table spinner
        managerDatabaseAndroidBinding.acTvTableNames.setAdapter(tableNamesAdapter);
        managerDatabaseAndroidBinding.acTvTableNames.setKeyListener(null);
        managerDatabaseAndroidBinding.acTvTableNames.setOnItemClickListener((parent, view, position, id) -> addViewTableData(tableNameList.get(position)));
        List<String> crudOperationList = new ArrayList<String>();
        crudOperationList.add("Add New Row To This Table");
        crudOperationList.add("Delete This Table");
        crudOperationList.add("Drop This Table");
        crudOperationAdapter = new ArrayAdapter<>(this, android.R.layout.simple_dropdown_item_1line, crudOperationList);

        managerDatabaseAndroidBinding.acTvCRUD.setAdapter(crudOperationAdapter);
        managerDatabaseAndroidBinding.acTvCRUD.setKeyListener(null);
        managerDatabaseAndroidBinding.acTvCRUD.setOnItemClickListener((parent, view, position, id) -> {
            String tableName = managerDatabaseAndroidBinding.acTvTableNames.getText().toString();
            if (position == 0) {
                List<String> columnNamesList = databaseManagerViewModel.getColumnNames(managerDatabaseAndroidBinding.acTvTableNames.getText().toString());
                NestedScrollView nestedScrollViewRootView = createDialogUI(columnNamesList, false);
                DialogUtils.createTableDialog(AndroidDatabaseManager.this, "Add New Row in " + tableName, nestedScrollViewRootView,
                        (dialog, which) -> {
                            dialog.dismiss();
                            managerDatabaseAndroidBinding.acTvCRUD.setText("");
                            managerDatabaseAndroidBinding.getRoot().requestFocus();
                            String query = getQueryFromView(nestedScrollViewRootView, tableName, TypeDialog.INSERT);
                            databaseManagerViewModel.getRunCustomQuery(query);
                            new Handler().postDelayed(() -> databaseManagerViewModel.getSelectData(tableName), 1000);
                        }, (dialog, which) -> {
                            dialog.dismiss();
                            managerDatabaseAndroidBinding.acTvCRUD.setText("");
                            managerDatabaseAndroidBinding.getRoot().requestFocus();
                        }, "Add Row", "cancel");
            } else if (position == 1) {    // an alert dialog to confirm user selection
                if (!isFinishing()) {

                    DialogUtils.createDeleteTableDialog(AndroidDatabaseManager.this, tableName,
                            (dialog, which) -> {
                                dialog.dismiss();
                                managerDatabaseAndroidBinding.acTvCRUD.setText("");
                                managerDatabaseAndroidBinding.getRoot().requestFocus();
                                String query = "Delete  from " + tableName;
                                databaseManagerViewModel.runQuery(query);
                                new Handler().postDelayed(() -> databaseManagerViewModel.getSelectData(tableName), 1000);
                            }, (dialog, which) -> {
                                dialog.dismiss();
                                managerDatabaseAndroidBinding.acTvCRUD.setText("");
                                managerDatabaseAndroidBinding.getRoot().requestFocus();
                            });
                }
            }

            //when user selects to drop the table the below code in if block will be executed
            // if (mSpinnerCUD.getSelectedItem().toString().equals("Drop this table")) {
            else if (position == 2) {
                if (!isFinishing()) {
                    // when user confirms by clicking on yes we drop the table by executing drop table query
                    DialogUtils.createDropTableDialog(AndroidDatabaseManager.this, tableName,
                            (dialog, which) -> {
                                dialog.dismiss();
                                managerDatabaseAndroidBinding.acTvCRUD.setText("");
                                managerDatabaseAndroidBinding.getRoot().requestFocus();
                                managerDatabaseAndroidBinding.acTvTableNames.setText("");
                                managerDatabaseAndroidBinding.getRoot().requestFocus();
                                String query = "DROP TABLE IF EXISTS " + tableName;
                                databaseManagerViewModel.runQuery(query);
                                new Handler().postDelayed(this::recreate, 1000);
                            }, (dialog, which) -> {
                                dialog.dismiss();
                                managerDatabaseAndroidBinding.acTvCRUD.setText("");
                                managerDatabaseAndroidBinding.getRoot().requestFocus();
                            });
                }
            }
        });

        managerDatabaseAndroidBinding.tlRootTableView.setHorizontalFadingEdgeEnabled(false);
        managerDatabaseAndroidBinding.tlRootTableView.setHorizontalScrollBarEnabled(true);

        managerDatabaseAndroidBinding.mbtNext.setOnClickListener(v -> {
            if (!databaseManagerViewModel.nextButton(managerDatabaseAndroidBinding.acTvTableNames.getText().toString()
                    , Integer.parseInt(managerDatabaseAndroidBinding.mtvRowCount.getText().toString()))) {
                Snackbar.make(managerDatabaseAndroidBinding.getRoot(), "This is The Last Page", Snackbar.LENGTH_SHORT)
                        .show();
            }
        });
        managerDatabaseAndroidBinding.mbtPrevious.setOnClickListener(v -> {
            if (!databaseManagerViewModel.previousButton(managerDatabaseAndroidBinding.acTvTableNames.getText().toString())) {
                Snackbar.make(managerDatabaseAndroidBinding.getRoot(), "This is The First Page", Snackbar.LENGTH_SHORT)
                        .show();
            }
        });
        managerDatabaseAndroidBinding.mbtCustomQuery.setOnClickListener(v -> {
            databaseManagerViewModel.resetStartingRow();
            isCustomQuery = true;
            managerDatabaseAndroidBinding.acTvTableNames.setText("");
            managerDatabaseAndroidBinding.llSelectData.setVisibility(View.GONE);
            managerDatabaseAndroidBinding.llCustomQuery.setVisibility(View.VISIBLE);
            managerDatabaseAndroidBinding.tiEtQuery.requestFocus();
        });
        managerDatabaseAndroidBinding.mbtSubmitQuery.setOnClickListener(v -> {
            if (managerDatabaseAndroidBinding.tiEtQuery.getText() != null && !managerDatabaseAndroidBinding.tiEtQuery.getText().toString().equalsIgnoreCase("")) {
                databaseManagerViewModel.getRunCustomQuery(managerDatabaseAndroidBinding.tiEtQuery.getText().toString());
            }
        });
    }

    enum TypeDialog {
        INSERT,
        UPDATE,
        DELETE
    }

    private String getQueryFromView(NestedScrollView nestedScrollViewRootView, String tableName, TypeDialog typeDialog) {
        StringBuilder columnList = new StringBuilder();
        StringBuilder columnValueList = new StringBuilder();
        StringBuilder updateQueryData = new StringBuilder();
        LinearLayout linearLayout = (LinearLayout) nestedScrollViewRootView.getChildAt(0);
        if (linearLayout != null) {
            for (int n = 0; n < linearLayout.getChildCount(); n++) {
                DialogItemViewBinding dialogItemViewBinding = DialogItemViewBinding.bind(linearLayout.getChildAt(n));
                if (dialogItemViewBinding != null) {
                    if (typeDialog == TypeDialog.INSERT) {
                        columnList.append(dialogItemViewBinding.tilItem.getHint());
                        columnList.append(",");
                        columnValueList.append("'" + dialogItemViewBinding.tiEtItem.getText() + "'");
                        columnValueList.append(",");
                    } else if (typeDialog == TypeDialog.UPDATE) {
                        if (n == 0) {
                            columnList.append(dialogItemViewBinding.tilItem.getHint());
                            columnList.append(",");
                            columnValueList.append("'" + dialogItemViewBinding.tiEtItem.getText() + "'");
                            columnValueList.append(",");
                        }
                        updateQueryData.append(dialogItemViewBinding.tilItem.getHint() + "=" + "'" + dialogItemViewBinding.tiEtItem.getText() + "'");
                        updateQueryData.append(",");
                    } else if (typeDialog == TypeDialog.DELETE) {
                        if (n == 0) {
                            columnList.append(dialogItemViewBinding.tilItem.getHint());
                            columnList.append(",");
                            columnValueList.append("'" + dialogItemViewBinding.tiEtItem.getText() + "'");
                            columnValueList.append(",");
                        }
                    }
                }
            }
        }
        // Log.d("columnList : ", columnList.toString());
        //   Log.d("columnValueList : ", columnValueList.toString());
        String query = "";
        if (typeDialog == TypeDialog.INSERT) {
            query = "INSERT INTO " + tableName + " (" + columnList.substring(0, columnList.toString().length() - 1)
                    + ") VALUES (" + columnValueList.substring(0, columnValueList.toString().length() - 1) + ")";
        } else if (typeDialog == TypeDialog.UPDATE) {
            query = "UPDATE " + tableName + " SET " + updateQueryData.substring(0, updateQueryData.toString().length() - 1) +
                    " WHERE " + columnList.substring(0, columnList.toString().length() - 1) + "=" + columnValueList.substring(0, columnValueList.toString().length() - 1);
        } else if (typeDialog == TypeDialog.DELETE) {
            query = "DELETE FROM " + tableName +
                    " WHERE " + columnList.substring(0, columnList.toString().length() - 1) + "=" + columnValueList.substring(0, columnValueList.toString().length() - 1);
        }
        Log.d("Query : ", query);

        return query;
    }

    private NestedScrollView createDialogUI(List<String> columnNamesList, boolean isReadOnly) {
        NestedScrollView nestedScrollView = new NestedScrollView(AndroidDatabaseManager.this);
        LinearLayout linearLayout = new LinearLayout(AndroidDatabaseManager.this);
        linearLayout.setOrientation(LinearLayout.VERTICAL);
        nestedScrollView.setPadding(20, 10, 20, 10);
        linearLayout.setPadding(15, 10, 15, 10);
        for (int n = 0; n < columnNamesList.size(); n++) {
            linearLayout.addView(createEditTextUI(columnNamesList.get(n), "", isReadOnly));
        }
        nestedScrollView.addView(linearLayout);
        return nestedScrollView;
    }

    private NestedScrollView createUpdateOrDeleteDialogUI(TableRow tableRow, List<String> columnNamesList, boolean isReadOnly) {
        NestedScrollView nestedScrollView = new NestedScrollView(AndroidDatabaseManager.this);
        LinearLayout linearLayout = new LinearLayout(AndroidDatabaseManager.this);
        linearLayout.setOrientation(LinearLayout.VERTICAL);
        nestedScrollView.setPadding(20, 10, 20, 10);
        linearLayout.setPadding(15, 10, 15, 10);
        for (int n = 0; n < columnNamesList.size(); n++) {
            String columnValue = ((TextView) ((LinearLayout) tableRow.getChildAt(n)).getChildAt(0)).getText().toString();
            linearLayout.addView(createEditTextUI(columnNamesList.get(n), columnValue + "", isReadOnly));
        }
        nestedScrollView.addView(linearLayout);
        return nestedScrollView;
    }

    private TextInputLayout createEditTextUI(String columnName, String columnValue, boolean isReadOnly) {
        DialogItemViewBinding dialogItemViewBinding = DialogItemViewBinding.inflate(getLayoutInflater());
        dialogItemViewBinding.tilItem.setHint(columnName);
        if (!columnValue.equalsIgnoreCase("")) {
            dialogItemViewBinding.tiEtItem.setText(columnValue);
        }
        if (isReadOnly) {
            dialogItemViewBinding.tiEtItem.setKeyListener(null);
        }
        return dialogItemViewBinding.getRoot();
    }

    boolean isCustomQuery = false;
    ColorStateList oldColors;

    private void setObserves() {
        databaseManagerViewModel.tableNameListLiveData.observe(this, tableNameList -> {
            if (tableNameList != null && tableNameList.size() > 0) {
                //add names of the table to tableNames array list
                this.tableNameList.clear();
                this.tableNameList.addAll(tableNameList);
                if (tableNamesAdapter != null) {
                    tableNamesAdapter.notifyDataSetChanged();
                }
            } else {
                databaseManagerViewModel.writeLogs(" tableNameList is null or empty ", "tableNameListLiveData observe");
            }
        });
        databaseManagerViewModel.errorSuccessMessageLiveData.observe(this, messageData -> {
            if (oldColors == null) {
                oldColors = managerDatabaseAndroidBinding.mtvMessages.getTextColors();
            }
            if (messageData.isError()) {
                managerDatabaseAndroidBinding.mtvMessages.setTextColor(Color.RED);
            } else {
                managerDatabaseAndroidBinding.mtvMessages.setTextColor(oldColors);
            }
            if (!messageData.getMessage().equalsIgnoreCase("")) {
                managerDatabaseAndroidBinding.mtvMessages.setText(messageData.getMessage());
            } else {
                managerDatabaseAndroidBinding.mtvMessages.setText(getString(R.string.messages_text));
            }
        });
        databaseManagerViewModel.tableDataLiveData.observe(this, tableData -> {
            if (!isCustomQuery) {
                managerDatabaseAndroidBinding.tilCRUD.setVisibility(View.VISIBLE);
                managerDatabaseAndroidBinding.mtvRowCount.setText(String.valueOf(tableData.getRowsCount()));
                addColumns(databaseManagerViewModel.getColumnNames(managerDatabaseAndroidBinding.acTvTableNames.getText().toString()));
                if (tableData.getRowList() != null && tableData.getRowList().size() > 0) {
                    if (tableData.getRowsCount() > 10) {
                        managerDatabaseAndroidBinding.llButtons.setVisibility(View.VISIBLE);
                    } else {
                        managerDatabaseAndroidBinding.llButtons.setVisibility(View.GONE);
                    }
                    for (int n = 0; n < tableData.getRowList().size(); n++) {
                        managerDatabaseAndroidBinding.tlRootTableView.addView(databaseManagerViewModel.createDataRowUI(tableData.getRowList().get(n),
                                AndroidDatabaseManager.this,
                                v -> {
                                    String tableName = managerDatabaseAndroidBinding.acTvTableNames.getText().toString();
                                    NestedScrollView nestedScrollViewRootView = createUpdateOrDeleteDialogUI((TableRow) v, databaseManagerViewModel.getColumnNames(tableName), false);
                                    DialogUtils.createUpdateOrDeleteTableDialog(AndroidDatabaseManager.this, "Update OR Delete This Row in " + tableName, nestedScrollViewRootView,
                                            (dialog, which) -> {
                                                dialog.dismiss();
                                                String query = getQueryFromView(nestedScrollViewRootView, tableName, TypeDialog.UPDATE);
                                                databaseManagerViewModel.getRunCustomQuery(query);
                                                new Handler().postDelayed(() -> databaseManagerViewModel.getSelectData(tableName), 1000);
                                            }, (dialog, which) -> {
                                                dialog.dismiss();
                                            }, (dialog, which) -> {
                                                dialog.dismiss();
                                                String query = getQueryFromView(nestedScrollViewRootView, tableName, TypeDialog.DELETE);
                                                databaseManagerViewModel.getRunCustomQuery(query);
                                                new Handler().postDelayed(() -> databaseManagerViewModel.getSelectData(tableName), 1000);
                                            }, "Update", "cancel", "Delete");
                                }));
                    }
                } else {
                    managerDatabaseAndroidBinding.llButtons.setVisibility(View.GONE);
                    int count = ((TableRow) managerDatabaseAndroidBinding.tlRootTableView.getChildAt(managerDatabaseAndroidBinding.tlRootTableView.getChildCount() - 1)).getChildCount();
                    managerDatabaseAndroidBinding.tlRootTableView.addView(databaseManagerViewModel.createEmptyTableUI(count, AndroidDatabaseManager.this));
                }
            } else {
                if (managerDatabaseAndroidBinding.tiEtQuery.getText() != null && !managerDatabaseAndroidBinding.tiEtQuery.getText().toString().equalsIgnoreCase("")) {
                    managerDatabaseAndroidBinding.llSelectData.setVisibility(View.VISIBLE);
                    managerDatabaseAndroidBinding.tilCRUD.setVisibility(View.GONE);
                    managerDatabaseAndroidBinding.mtvRowCount.setText(String.valueOf(tableData.getRowsCount()));
                    List<String> columnNamesList = databaseManagerViewModel.getColumnNamesFromCustomQuery(managerDatabaseAndroidBinding.tiEtQuery.getText().toString());
                    addColumns(columnNamesList);
                    if (tableData.getRowList() != null && tableData.getRowList().size() > 0) {
                        for (int n = 0; n < tableData.getRowList().size(); n++) {
                            managerDatabaseAndroidBinding.tlRootTableView.addView(databaseManagerViewModel.createDataRowUI(tableData.getRowList().get(n), AndroidDatabaseManager.this, v -> {
                                NestedScrollView nestedScrollViewRootView = createUpdateOrDeleteDialogUI((TableRow) v, columnNamesList, true);
                                DialogUtils.createUpdateOrDeleteTableDialog(AndroidDatabaseManager.this, "Row Data", nestedScrollViewRootView,
                                        (dialog, which) -> {
                                            dialog.dismiss();
                                        }, null, null,
                                        "Ok", "", "");
                            }));
                        }
                    } else {
                        int count = ((TableRow) managerDatabaseAndroidBinding.tlRootTableView.getChildAt(managerDatabaseAndroidBinding.tlRootTableView.getChildCount() - 1)).getChildCount();
                        managerDatabaseAndroidBinding.tlRootTableView.addView(databaseManagerViewModel.createEmptyTableUI(count, AndroidDatabaseManager.this));
                    }
                }
            }
        });
    }

    private void addViewTableData(String tableName) {
        isCustomQuery = false;
        managerDatabaseAndroidBinding.llCustomQuery.setVisibility(View.GONE);
        managerDatabaseAndroidBinding.llSelectData.setVisibility(View.VISIBLE);
        addColumnsData(tableName);
    }

    private void addColumnsData(String tableName) {
        databaseManagerViewModel.resetStartingRow();
        databaseManagerViewModel.getSelectData(tableName);
    }

    private void addColumns(List<String> columnNamesList) {
        managerDatabaseAndroidBinding.tlRootTableView.removeAllViews();
        managerDatabaseAndroidBinding.tlRootTableView.addView(databaseManagerViewModel.createColumnsUI(columnNamesList, this));
    }
}
