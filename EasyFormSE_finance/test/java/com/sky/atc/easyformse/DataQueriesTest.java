package com.sky.atc.easyformse;

import org.json.JSONObject;
import org.junit.Test;
import static org.junit.Assert.*;

public class DataQueriesTest {
    private static final String[] NAMES = {"flowMapping", "taskByTid", "taskCountByFlag", "pendingUploads"};

    @Test public void everyQueryIsFixedTextWithOnePlaceholderPerDeclaredValue() {
        for (String name : NAMES) {
            DataQueries.Query query = DataQueries.find(name);
            assertFalse(name, query.sql.contains("'"));
            assertFalse(name, query.sql.contains(";"));
            assertFalse(name, query.sql.contains("--"));
            int placeholders = query.sql.length() - query.sql.replace("?", "").length();
            assertEquals(name, query.names.length, placeholders);
            assertTrue(name, query.sql.startsWith("SELECT "));
        }
    }

    @Test public void aQueryWithNoValuesTakesNoArguments() throws Exception {
        DataQueries.Query query = DataQueries.find("pendingUploads");
        assertEquals(0, DataQueries.bind(query, null).length);
        assertEquals(0, DataQueries.bind(query, new JSONObject()).length);
        try { DataQueries.bind(query, new JSONObject().put("flag", "1")); fail(); } catch (IllegalArgumentException expected) { }
    }

    @Test public void unknownOrMissingNamesAreRefused() {
        for (String name : new String[]{null, "", "nothing", "flowMapping;", "FLOWMAPPING"}) {
            try { DataQueries.find(name); fail(String.valueOf(name)); } catch (IllegalArgumentException expected) { }
        }
    }

    @Test public void numbersMustBeNumbersAndAreBoundNotJoined() throws Exception {
        DataQueries.Query query = DataQueries.find("taskByTid");
        assertArrayEquals(new String[]{"7"}, DataQueries.bind(query, new JSONObject().put("tid", "7")));
        assertArrayEquals(new String[]{"7"}, DataQueries.bind(query, new JSONObject().put("tid", 7)));
        for (String bad : new String[]{"7 OR 1=1", "7'; DROP TABLE task_master; --", "", "1e5", "0x10", "seven", "12345678901234567890"}) {
            try { DataQueries.bind(query, new JSONObject().put("tid", bad)); fail(bad); } catch (IllegalArgumentException expected) { }
        }
    }

    @Test public void textValuesAreAcceptedAsLiteralsButBounded() throws Exception {
        DataQueries.Query query = DataQueries.find("taskCountByFlag");
        assertArrayEquals(new String[]{"it's 'quoted'; --"}, DataQueries.bind(query, new JSONObject().put("flag", "it's 'quoted'; --")));
        try { DataQueries.bind(query, new JSONObject().put("flag", new String(new char[513]).replace('\0', 'a'))); fail(); } catch (IllegalArgumentException expected) { }
    }

    @Test public void missingExtraAndStructuredValuesAreRefused() throws Exception {
        DataQueries.Query query = DataQueries.find("flowMapping");
        for (JSONObject bad : new JSONObject[]{null, new JSONObject(), new JSONObject().put("moduleid", JSONObject.NULL),
                new JSONObject().put("moduleid", "5").put("extra", "1"), new JSONObject().put("moduleid", new JSONObject().put("a", 1)),
                new JSONObject().put("other", "5")}) {
            try { DataQueries.bind(query, bad); fail(String.valueOf(bad)); } catch (IllegalArgumentException expected) { }
        }
    }
}
