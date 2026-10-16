package com.sky.atc.easyformse.camera;

import org.json.*;
import org.junit.Test;
import java.io.IOException;
import static org.junit.Assert.*;

public class AiPhotoProcessorTest {
    private String reply(String text) throws Exception {
        JSONObject part = new JSONObject().put("text", text);
        return new JSONObject().put("candidates", new JSONArray().put(new JSONObject().put("content",
                new JSONObject().put("parts", new JSONArray().put(part))))).toString();
    }
    private void rejects(String reply, String message) {
        IOException error = assertThrows(IOException.class, () -> AiPhotoProcessor.validationText(reply));
        assertTrue(error.getMessage(), error.getMessage().contains(message));
    }
    @Test public void keepsPassAndFailAsServerDecisions() throws Exception {
        assertEquals("PASS", AiPhotoProcessor.validationText(reply("PASS")));
        assertEquals("FAIL", AiPhotoProcessor.validationText(reply("FAIL")));
    }
    @Test public void acceptsArrayResultsWithoutDiscardingThePhoto() throws Exception {
        JSONArray result = new JSONArray(AiPhotoProcessor.validationText(reply("```json\n[{\"Q1\":\"FAIL\"},{\"Q2\":{\"Result\":\"PASS\"}}]\n```")));
        assertEquals("FAIL", result.getJSONObject(0).getString("Q1"));
        assertEquals("PASS", result.getJSONObject(1).getJSONObject("Q2").getString("Result"));
    }
    @Test public void retainsCompleteLongMultiQuestionResult() throws Exception {
        JSONObject result = new JSONObject();
        for (int i = 1; i <= 30; i++) result.put("Q" + i, new JSONObject().put("Result", "FAIL").put("reason", "No qualifying PPE is visible"));
        assertTrue(result.toString().length() > 500);
        JSONObject decoded = new JSONObject(AiPhotoProcessor.validationText(reply(result.toString())));
        assertEquals(30, decoded.length()); assertEquals("FAIL", decoded.getJSONObject("Q30").getString("Result"));
    }
    @Test public void acceptsQuotedAndSingleArrayTransportWrappers() throws Exception {
        String json = reply("FAIL");
        String quoted = new JSONArray().put(json).toString();
        assertEquals("FAIL", AiPhotoProcessor.validationText(quoted.substring(1, quoted.length() - 1)));
        assertEquals("FAIL", AiPhotoProcessor.validationText("[" + json + "]"));
    }
    @Test public void concatenatesAnswerPartsAndSkipsThinkingText() throws Exception {
        JSONObject response = new JSONObject(reply(""));
        JSONArray parts = response.getJSONArray("candidates").getJSONObject(0).getJSONObject("content").getJSONArray("parts");
        parts.put(new JSONObject().put("thought", true).put("text", "reasoning"));
        parts.put(new JSONObject().put("text", "FA")); parts.put(new JSONObject().put("text", "IL"));
        assertEquals("FAIL", AiPhotoProcessor.validationText(response.toString()));
    }
    @Test public void enforcesServerRejectionsAndAttemptLimits() {
        rejects("{\"status\":\"error\",\"message\":\"Maximum capture attempts reached\"}", "Maximum capture attempts reached");
        rejects("[{\"status\":\"error\",\"message\":\"Photo does not belong to this task\"}]", "Photo does not belong to this task");
        rejects("{\"status\":\"error\",\"message\":\"\"}", "could not process");
        rejects("{\"error\":{\"message\":\"Quota exceeded\"}}", "Quota exceeded");
    }
    @Test public void rejectsBlockedEmptyAndMalformedReplies() throws Exception {
        rejects(null, "did not return"); rejects("", "did not return");
        rejects("{\"candidates\":[]}", "usable result");
        rejects("{\"promptFeedback\":{\"blockReason\":\"SAFETY\"}}", "usable result");
        rejects(reply("{\"Q1\":"), "unreadable result");
        rejects(reply(""), "usable result");
    }
}
