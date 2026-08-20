package com.sky.atc.easyformse;

import android.graphics.Bitmap;
import android.media.MediaMetadataRetriever;
import android.util.Base64;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Pull one JPEG frame from a lesson/reel video on-device so CMS does not have
 * to upload a separate thumbnail. Cached under the app cache dir.
 */
@StringFogIgnore
public class LmsVideoThumbPlugin extends CordovaPlugin {

    private static final int MAX_WIDTH = 480;
    private static final int JPEG_QUALITY = 70;
    private static final long FRAME_US = 1_000_000L;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext)
            throws JSONException {
        if (!"getThumb".equals(action)) {
            return false;
        }
        JSONObject obj = args.optJSONObject(0);
        if (obj == null) {
            callbackContext.error("missing args");
            return true;
        }
        final String id = obj.optString("id", "");
        final String url = obj.optString("url", "");
        if (url == null || url.length() == 0) {
            callbackContext.error("missing url");
            return true;
        }

        cordova.getThreadPool().execute(new Runnable() {
            @Override
            public void run() {
                try {
                    String dataUrl = extractOrCached(id, url);
                    if (dataUrl == null || dataUrl.length() == 0) {
                        callbackContext.error("empty frame");
                    } else {
                        callbackContext.success(dataUrl);
                    }
                } catch (Exception e) {
                    callbackContext.error(e.getMessage() != null ? e.getMessage() : "thumb failed");
                }
            }
        });
        return true;
    }

    private String extractOrCached(String id, String url) throws Exception {
        File dir = new File(cordova.getActivity().getCacheDir(), "lms_thumbs");
        if (!dir.exists() && !dir.mkdirs()) {
            throw new Exception("thumb dir");
        }
        File out = new File(dir, safeName(id, url) + ".jpg");
        if (out.isFile() && out.length() > 32) {
            return toDataUrl(readFile(out));
        }

        MediaMetadataRetriever retriever = new MediaMetadataRetriever();
        Bitmap bmp = null;
        try {
            if (url.startsWith("file://")) {
                retriever.setDataSource(url.substring("file://".length()));
            } else {
                Map<String, String> headers = new HashMap<String, String>();
                headers.put("User-Agent", "EasyFormLMS-Thumb/1.0");
                retriever.setDataSource(url, headers);
            }
            bmp = retriever.getFrameAtTime(FRAME_US, MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
            if (bmp == null) {
                bmp = retriever.getFrameAtTime(0, MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
            }
            if (bmp == null) {
                throw new Exception("no frame");
            }
            bmp = scale(bmp);
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            if (!bmp.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, bos)) {
                throw new Exception("compress");
            }
            byte[] bytes = bos.toByteArray();
            FileOutputStream fos = new FileOutputStream(out);
            try {
                fos.write(bytes);
            } finally {
                fos.close();
            }
            return toDataUrl(bytes);
        } finally {
            if (bmp != null) {
                bmp.recycle();
            }
            try {
                retriever.release();
            } catch (Exception ignored) {
            }
        }
    }

    private static Bitmap scale(Bitmap src) {
        int w = src.getWidth();
        int h = src.getHeight();
        if (w <= MAX_WIDTH || w <= 0) {
            return src;
        }
        int nh = Math.max(1, (int) ((h * (long) MAX_WIDTH) / w));
        Bitmap scaled = Bitmap.createScaledBitmap(src, MAX_WIDTH, nh, true);
        if (scaled != src) {
            src.recycle();
        }
        return scaled;
    }

    private static String safeName(String id, String url) {
        String raw = (id != null ? id : "") + "|" + (url != null ? url : "");
        int h = 0;
        for (int i = 0; i < raw.length(); i++) {
            h = (h * 31) + raw.charAt(i);
        }
        return Integer.toHexString(h);
    }

    private static byte[] readFile(File f) throws Exception {
        byte[] buf = new byte[(int) f.length()];
        FileInputStream in = new FileInputStream(f);
        try {
            int off = 0;
            while (off < buf.length) {
                int n = in.read(buf, off, buf.length - off);
                if (n < 0) {
                    break;
                }
                off += n;
            }
        } finally {
            in.close();
        }
        return buf;
    }

    private static String toDataUrl(byte[] jpeg) {
        return "data:image/jpeg;base64," + Base64.encodeToString(jpeg, Base64.NO_WRAP);
    }
}
