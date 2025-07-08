package com.nareshchocha.databasemanager.models;

import java.util.List;

/**
 * Created by NareshChocha on 3/29/2022.
 *
 * @author NareshChocha
 */
public class TableData {
    int rowsCount = 0;
    List<List<String>> rowList;

    public TableData() {
        this.rowList = null;
    }

    public TableData(int rowsCount, List<List<String>> rowList) {
        this.rowsCount = rowsCount;
        this.rowList = rowList;
    }

    public int getRowsCount() {
        return rowsCount;
    }

    public List<List<String>> getRowList() {
        return rowList;
    }
}
