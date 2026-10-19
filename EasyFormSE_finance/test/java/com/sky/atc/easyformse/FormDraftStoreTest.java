package com.sky.atc.easyformse;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import static org.junit.Assert.*;

public class FormDraftStoreTest {
    private JSONObject context() throws Exception {
        return new JSONObject().put("company","1").put("user","2").put("server","https://example.invalid/api/").put("flow","3").put("task","4").put("checksheet","5").put("step","1").put("kind","form").put("schema","[{\"que_id\":1,\"type\":1}]");
    }
    @Test public void scopeIsStableAndDoesNotExposeIdentifiers() throws Exception {
        String key=FormDraftStore.scope(context());assertEquals(64,key.length());assertEquals(key,FormDraftStore.scope(context()));assertTrue(key.matches("[a-f0-9]{64}"));
    }
    @Test public void identityAndSchemaChangesCannotShareDrafts() throws Exception {
        String original=FormDraftStore.scope(context());
        for(String name:new String[]{"company","user","server","flow","task","checksheet","step","kind","schema"}) {
            JSONObject next=context();next.put(name,name.equals("server")?"https://other.invalid/":name.equals("kind")?"task":name.equals("schema")?"[]":"99");assertNotEquals(name,original,FormDraftStore.scope(next));
        }
    }
    @Test public void incompleteOrInvalidIdentityIsRejected() throws Exception {
        for(String name:new String[]{"company","user","server","flow","task","checksheet","step","kind","schema"}) {JSONObject next=context();next.remove(name);try{FormDraftStore.scope(next);fail(name);}catch(Exception expected){}}
        for(String name:new String[]{"company","user","flow","checksheet","step"}) {JSONObject next=context().put(name,"null");try{FormDraftStore.scope(next);fail(name);}catch(Exception expected){}}
        try{FormDraftStore.scope(context().put("server","file:///other"));fail();}catch(IllegalArgumentException expected){}
    }
    @Test public void literalFieldDataIsAcceptedWithoutStrippingQuotes() throws Exception {
        JSONArray fields=new JSONArray().put(new JSONObject().put("field","10").put("revision",4).put("data",new JSONObject().put("ans",new JSONArray().put("Worker's \"photo\""))));
        FormDraftStore.validate(fields,false);assertEquals("Worker's \"photo\"",fields.getJSONObject(0).getJSONObject("data").getJSONArray("ans").getString(0));
    }
    @Test public void duplicateIdsAndUnsafeRevisionsAreRejectedAtomically() throws Exception {
        JSONObject field=new JSONObject().put("field","1").put("revision",1).put("data",new JSONObject());
        try{FormDraftStore.validate(new JSONArray().put(field).put(field),false);fail();}catch(IllegalArgumentException expected){}
        for(long revision:new long[]{0,-1,9007199254740992L}) {try{FormDraftStore.validate(new JSONArray().put(new JSONObject(field.toString()).put("revision",revision)),false);fail();}catch(IllegalArgumentException expected){}}
        try{FormDraftStore.validate(new JSONArray().put(new JSONObject(field.toString()).put("field","1'); DROP TABLE x;")),false);fail();}catch(IllegalArgumentException expected){}
    }
    @Test public void acknowledgementsNeedOnlyFieldAndRevision() throws Exception {
        FormDraftStore.validate(new JSONArray().put(new JSONObject().put("field","22:1").put("revision",9)),true);
        try{FormDraftStore.validate(new JSONArray().put(new JSONObject().put("field","22:1").put("revision",9)),false);fail();}catch(Exception expected){}
    }
}
