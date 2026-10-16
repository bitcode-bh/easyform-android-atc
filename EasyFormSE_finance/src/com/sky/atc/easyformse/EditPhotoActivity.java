package com.sky.atc.easyformse;

import android.app.Activity;
import android.app.Dialog;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.*;
import android.view.*;
import android.widget.*;
import androidx.exifinterface.media.ExifInterface;
import com.sky.atc.easyformse.annotation.AnnotationDocument;
import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.*;

/** Keeps the existing photo_path input and status result contract. */
public class EditPhotoActivity extends Activity {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final AnnotationDocument document = new AnnotationDocument();
    private FrameLayout root;
    private LinearLayout toolbar;
    private DrawingViewEditphoto drawing;
    private Bitmap preview;
    private volatile File source;
    private volatile boolean downloaded, destroyed;
    private boolean saving, loaded;
    private int selectedColor, tint = Color.rgb(8, 12, 24);
    private View controlTint;
    private int controlArea;
    private float drawWidth, eraseWidth;
    private int bottomInset;
    private PopupWindow panel;
    private static final int[] COMMON_COLORS = {Color.RED, 0xffffca28, 0xff43a047, 0xff2196f3, Color.WHITE, Color.BLACK};
    private static final String[] COLOR_NAMES = {"Red", "Yellow", "Green", "Blue", "White", "Black"};
    private final Runnable persistSettings = this::writeSettings;
    private ProgressBar progress;
    private final List<ImageButton> buttons = new ArrayList<>();
    private ImageButton undo, redo, color, draw, erase;
    private final Runnable hidePanel = () -> { if (panel != null) panel.dismiss(); };

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        immersive();
        android.content.SharedPreferences preferences = getSharedPreferences("annotation_editor", MODE_PRIVATE);
        selectedColor = preferences.getInt("color", Color.RED);
        drawWidth = preferences.getFloat("draw_width", 6);
        eraseWidth = preferences.getFloat("erase_width", 20);
        boolean commonColor = false;
        for (int value : COMMON_COLORS) if (value == selectedColor) commonColor = true;
        if (!commonColor) selectedColor = Color.RED;
        controlArea = getResources().getDimensionPixelSize(R.dimen.camera_control_area_bottom);
        root = new FrameLayout(this); root.setBackgroundColor(tint); setContentView(root);
        progress = new ProgressBar(this);
        FrameLayout.LayoutParams loading = new FrameLayout.LayoutParams(dp(48), dp(48), Gravity.CENTER);
        root.addView(progress, loading);
        View topTint = new View(this); topTint.setBackgroundResource(R.color.camera_overlay_tint);
        root.addView(topTint, new FrameLayout.LayoutParams(-1, getResources().getDimensionPixelSize(R.dimen.camera_control_area_top), Gravity.TOP));
        controlTint = new View(this); controlTint.setBackgroundResource(R.color.camera_overlay_tint);
        root.addView(controlTint, new FrameLayout.LayoutParams(-1, controlArea, Gravity.BOTTOM));
        toolbar = new LinearLayout(this); toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setPadding(0, 0, 0, 0); toolbar.setElevation(0);
        FrameLayout.LayoutParams bar = new FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM);
        bar.setMargins(dp(6), 0, dp(6), dp(18)); root.addView(toolbar, bar);
        toolbar.setBackgroundColor(Color.TRANSPARENT); buildToolbar(); setBusy(true);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            bottomInset = insets.getStableInsetBottom();
            if (Build.VERSION.SDK_INT >= 29) bottomInset = Math.max(bottomInset, insets.getMandatorySystemGestureInsets().bottom);
            FrameLayout.LayoutParams params = (FrameLayout.LayoutParams) toolbar.getLayoutParams();
            params.bottomMargin = bottomInset + dp(18); toolbar.setLayoutParams(params);
            layoutControlArea(); return insets;
        });
        root.requestApplyInsets();
        String path = getIntent().getStringExtra("photo_path");
        if (path == null || path.trim().isEmpty()) { failLoad("No image was supplied."); return; }
        worker.execute(() -> load(path));
    }
    private void layoutControlArea() {
        FrameLayout.LayoutParams tintParams = (FrameLayout.LayoutParams) controlTint.getLayoutParams();
        tintParams.height = controlArea + bottomInset; controlTint.setLayoutParams(tintParams);
        if (drawing != null) {
            FrameLayout.LayoutParams imageParams = (FrameLayout.LayoutParams) drawing.getLayoutParams();
            imageParams.bottomMargin = 0; drawing.setLayoutParams(imageParams);
        }
    }
    private void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }
    @Override public void onWindowFocusChanged(boolean focus) { super.onWindowFocusChanged(focus); if (focus) immersive(); }
    private int dp(float value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private GradientDrawable glass(int value, int alpha) {
        GradientDrawable shape = new GradientDrawable(); shape.setColor((value & 0xffffff) | (alpha << 24));
        shape.setCornerRadius(dp(26)); shape.setStroke(dp(1), 0x55ffffff); return shape;
    }
    private void buildToolbar() {
        toolbar.removeAllViews(); buttons.clear();
        float available = getResources().getDisplayMetrics().widthPixels / getResources().getDisplayMetrics().density - 12;
        boolean compact = available < 8 * 48;
        LinearLayout tools = toolbar;
        if (compact) {
            HorizontalScrollView scroll = new HorizontalScrollView(this); scroll.setHorizontalScrollBarEnabled(false);
            tools = new LinearLayout(this); scroll.addView(tools);
            toolbar.addView(scroll, new LinearLayout.LayoutParams(0, -2, 1));
        }
        boolean labels = false;
        undo = tool(tools, R.drawable.annotation_undo, "Undo", labels, compact, () -> { document.undo(); drawing.historyChanged(); });
        redo = tool(tools, R.drawable.annotation_redo, "Redo", labels, compact, () -> { document.redo(); drawing.historyChanged(); });
        color = tool(tools, R.drawable.annotation_color, "Color", labels, compact, this::showColors);
        draw = tool(tools, R.drawable.annotation_draw, "Draw", labels, compact, () -> select(DrawingViewEditphoto.Tool.DRAW));
        erase = tool(tools, R.drawable.annotation_erase, "Eraser", labels, compact, () -> select(DrawingViewEditphoto.Tool.ERASE));
        tool(tools, R.drawable.annotation_thickness, "Thickness", labels, compact, this::showThickness);
        tool(tools, R.drawable.annotation_clear, "Clear", labels, compact, () -> confirm("Clear all annotations?", "This will remove all drawings from the image. You can undo this action.", "Clear All", () -> { document.clear(); drawing.historyChanged(); }));
        ImageButton save = tool(toolbar, R.drawable.annotation_save, "Save", labels, compact, this::save);
        updateTools();
    }
    private ImageButton tool(LinearLayout parent, int icon, String label, boolean labels, boolean fixed, Runnable action) {
        LinearLayout cell = new LinearLayout(this); cell.setOrientation(LinearLayout.VERTICAL); cell.setGravity(Gravity.CENTER); cell.setMinimumWidth(dp(48));
        parent.addView(cell, fixed ? new LinearLayout.LayoutParams(dp(48), -2) : new LinearLayout.LayoutParams(0, -2, 1));
        ImageButton button = new ImageButton(this); button.setPadding(dp(10), dp(10), dp(10), dp(10));
        if (icon != 0) button.setImageResource(icon);
        button.setColorFilter(Color.WHITE); button.setAlpha(1f);
        button.setContentDescription(label); button.setBackgroundColor(Color.TRANSPARENT);
        cell.addView(button, new LinearLayout.LayoutParams(dp(48), dp(48)));
        button.setOnClickListener(v -> { if (loaded && !saving) action.run(); }); buttons.add(button);
        if (labels) { TextView text = new TextView(this); text.setText(label); text.setTextSize(11); text.setTextColor(Color.WHITE); text.setPadding(0, dp(4), 0, 0); cell.addView(text); }
        return button;
    }
    private GradientDrawable circle(int value) { GradientDrawable drawable = new GradientDrawable(); drawable.setShape(GradientDrawable.OVAL); drawable.setColor(value); drawable.setStroke(dp(1), 0x55ffffff); return drawable; }
    private void updateTools() {
        if (color == null) return;
        color.setContentDescription(String.format(Locale.ROOT, "Color #%06X", selectedColor & 0xffffff));
        if (drawing != null) {
            undo.setEnabled(!saving && document.canUndo()); undo.setAlpha(1f);
            redo.setEnabled(!saving && document.canRedo()); redo.setAlpha(1f);
            draw.setSelected(drawing.getTool() == DrawingViewEditphoto.Tool.DRAW);
            draw.setContentDescription(draw.isSelected() ? "Draw, selected" : "Draw");
            erase.setSelected(drawing.getTool() == DrawingViewEditphoto.Tool.ERASE);
            erase.setContentDescription(erase.isSelected() ? "Eraser, selected" : "Eraser");
        }
    }
    private void setBusy(boolean busy) {
        progress.setVisibility(busy ? View.VISIBLE : View.GONE);
        for (ImageButton button : buttons) { button.setEnabled(!busy); button.setAlpha(1f); }
        if (drawing != null) drawing.setEnabled(!busy); if (!busy) updateTools();
    }
    private void select(DrawingViewEditphoto.Tool tool) {
        if (drawing.getTool() == tool) { showThickness(); return; }
        hidePanel.run(); drawing.setTool(tool); drawing.setThickness(tool == DrawingViewEditphoto.Tool.ERASE ? eraseWidth : drawWidth); updateTools();
    }
    private void load(String path) {
        Bitmap bitmap = null;
        try {
            File file;
            if (path.startsWith("https://") || path.startsWith("content://")) {
                file = File.createTempFile("annotation-source-", ".image", getCacheDir()); source = file; downloaded = true;
                URLConnection connection = path.startsWith("https://") ? new URL(path).openConnection() : null;
                if (connection != null) { connection.setConnectTimeout(15000); connection.setReadTimeout(30000); }
                try (InputStream input = connection != null ? connection.getInputStream() : getContentResolver().openInputStream(Uri.parse(path)); OutputStream output = new FileOutputStream(file)) {
                    if (input == null) throw new IOException("Image unavailable");
                    byte[] buffer = new byte[16384]; int count; long total = 0; long deadline = SystemClock.elapsedRealtime() + 45000;
                    while ((count = input.read(buffer)) != -1) { if (destroyed || SystemClock.elapsedRealtime() > deadline) throw new IOException("Image loading canceled or timed out"); total += count; if (total > 64L * 1024 * 1024) throw new IOException("Image file is too large"); output.write(buffer, 0, count); }
                } finally { if (connection instanceof HttpURLConnection) ((HttpURLConnection) connection).disconnect(); }
            } else file = new File(path.startsWith("file://") ? Uri.parse(path).getPath() : path);
            source = file;
            BitmapFactory.Options bounds = new BitmapFactory.Options(); bounds.inJustDecodeBounds = true; BitmapFactory.decodeFile(file.getPath(), bounds);
            if (bounds.outWidth <= 0 || bounds.outHeight <= 0) throw new IOException("Unsupported image");
            BitmapFactory.Options options = new BitmapFactory.Options(); options.inSampleSize = 1;
            while (Math.max(bounds.outWidth, bounds.outHeight) / options.inSampleSize > 2048) options.inSampleSize *= 2;
            bitmap = orient(BitmapFactory.decodeFile(file.getPath(), options), file);
            final Bitmap ready = bitmap;
            handler.post(() -> {
                if (destroyed) { ready.recycle(); return; }
                preview = ready;
                toolbar.setBackgroundColor(Color.TRANSPARENT);
                drawing = new DrawingViewEditphoto(this, ready, document);
                drawing.setColor(selectedColor); drawing.setThickness(drawWidth);
                if (getIntent().getBooleanExtra("view_only", false)) drawing.setTool(DrawingViewEditphoto.Tool.NAVIGATE);
                drawing.onChange(this::updateTools); root.addView(drawing, 0, new FrameLayout.LayoutParams(-1, -1));
                layoutControlArea(); loaded = true; setBusy(false);
            });
        } catch (Exception | OutOfMemoryError error) {
            if (bitmap != null && !bitmap.isRecycled()) bitmap.recycle();
            handler.post(() -> failLoad("Unable to open this image. Please try a smaller or valid image."));
        }
    }
    private int darker(int value) { return Color.rgb((int)(Color.red(value) * .65), (int)(Color.green(value) * .65), (int)(Color.blue(value) * .65)); }
    static Bitmap orient(Bitmap bitmap, File file) throws IOException { return com.sky.atc.easyformse.camera.CameraImages.orient(bitmap,file); }
    private void failLoad(String message) { if (destroyed) return; com.sky.atc.easyformse.camera.AppCameraDialog.show(this,"Unable to open image",message,"OK",false,()->{setResult(RESULT_CANCELED);finish();}); }
    private void save() {
        if (saving || !loaded) return;
        hidePanel.run(); saving = true; setBusy(true);
        final List<AnnotationDocument.Command> commands = document.snapshot();
        worker.execute(() -> {
            Bitmap full = null, layer = null; File output = null;
            try {
                BitmapFactory.Options options = new BitmapFactory.Options(); options.inMutable = true; options.inPreferredConfig = Bitmap.Config.ARGB_8888;
                full = orient(BitmapFactory.decodeFile(source.getPath(), options), source);
                layer = Bitmap.createBitmap(full.getWidth(), full.getHeight(), Bitmap.Config.ARGB_8888);
                DrawingViewEditphoto.render(new Canvas(layer), commands, full.getWidth(), full.getHeight());
                new Canvas(full).drawBitmap(layer, null, new RectF(0, 0, full.getWidth(), full.getHeight()), null);
                File folder = new File(getFilesDir(), "annotated_photos"); if (!folder.isDirectory() && !folder.mkdirs()) throw new IOException("Unable to create output folder");
                output = File.createTempFile("IMG-", ".jpeg", folder);
                try (OutputStream stream = new FileOutputStream(output)) { if (!full.compress(Bitmap.CompressFormat.JPEG, 100, stream)) throw new IOException("Unable to encode image"); }
                // Preserve the existing caller's 5 MB upload contract; never silently resize.
                if (output.length() >= 5000L * 1024) throw new IOException("Image exceeds the existing 5 MB upload limit. Original resolution was preserved.");
                final File saved = output;
                handler.post(() -> {
                    if (destroyed) { saved.delete(); return; }
                    com.sky.atc.easyformse.datautils.MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
                    pref.putString("photo_path", saved.getAbsolutePath()); pref.commit();
                    Intent result = new Intent().putExtra("status", saved.getAbsolutePath()); setResult(RESULT_OK, result);
                    saving = false; finish();
                });
            } catch (Exception | OutOfMemoryError error) {
                if (output != null) output.delete();
                final String message = error instanceof OutOfMemoryError ? "Not enough memory to save at original resolution." : error.getMessage();
                handler.post(() -> { if (!destroyed) { saving = false; setBusy(false); com.sky.atc.easyformse.camera.AppCameraDialog.show(this,"Unable to save image",message,"OK",false,()->{}); } });
            } finally { if (layer != null) layer.recycle(); if (full != null) full.recycle(); }
        });
    }
    private void showPanel(View content, int height) {
        hidePanel.run(); panel = new PopupWindow(content, Math.min(root.getWidth() - dp(24), dp(340)), dp(height), true);
        panel.setBackgroundDrawable(glass(darker(tint), 245)); panel.setOutsideTouchable(true); panel.setElevation(dp(8));
        panel.setOnDismissListener(() -> handler.removeCallbacks(hidePanel));
        panel.showAtLocation(root, Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL, 0, bottomInset + toolbar.getHeight() + dp(24));
    }
    private LinearLayout panelBody(String title) {
        LinearLayout body = new LinearLayout(this); body.setOrientation(LinearLayout.VERTICAL); body.setPadding(dp(16), dp(12), dp(16), dp(12));
        TextView heading = text(title, 16); body.addView(heading); return body;
    }
    private TextView text(String value, int size) { TextView view = new TextView(this); view.setText(value); view.setTextColor(Color.WHITE); view.setTextSize(size); return view; }
    private void showThickness() {
        boolean erasing = drawing.getTool() == DrawingViewEditphoto.Tool.ERASE;
        LinearLayout body = panelBody(erasing ? "Eraser thickness" : "Draw thickness");
        StrokePreview sample = new StrokePreview(this); body.addView(sample, new LinearLayout.LayoutParams(-1, dp(32)));
        SeekBar slider = new SeekBar(this); slider.setMax(63); slider.setProgress(Math.round(erasing ? eraseWidth : drawWidth) - 1);
        body.addView(slider); slider.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            public void onProgressChanged(SeekBar bar, int value, boolean user) { if (erasing) eraseWidth = value + 1; else drawWidth = value + 1; drawing.setThickness(value + 1); sample.invalidate(); remember(); }
            public void onStartTrackingTouch(SeekBar bar) { handler.removeCallbacks(hidePanel); }
            public void onStopTrackingTouch(SeekBar bar) { handler.postDelayed(hidePanel, 4000); }
        });
        showPanel(body, 142); handler.removeCallbacks(hidePanel); handler.postDelayed(hidePanel, 8000);
    }
    private class StrokePreview extends View {
        final Paint brush = new Paint(Paint.ANTI_ALIAS_FLAG);
        StrokePreview(android.content.Context context) { super(context); }
        @Override protected void onDraw(Canvas canvas) { brush.setColor(drawing.getTool() == DrawingViewEditphoto.Tool.ERASE ? Color.WHITE : selectedColor); brush.setStrokeCap(Paint.Cap.ROUND); brush.setStrokeWidth(dp(drawing.getTool() == DrawingViewEditphoto.Tool.ERASE ? eraseWidth : drawWidth)); canvas.drawLine(dp(24), getHeight()/2f, getWidth()-dp(24), getHeight()/2f, brush); }
    }
    private void setColor(int value) {
        selectedColor = value; drawing.setColor(value); updateTools(); remember();
    }
    private void remember() { handler.removeCallbacks(persistSettings); handler.postDelayed(persistSettings, 250); }
    private void writeSettings() {
        getSharedPreferences("annotation_editor", MODE_PRIVATE).edit().putInt("color", selectedColor).putFloat("draw_width", drawWidth).putFloat("erase_width", eraseWidth).apply();
    }
    private void showColors() {
        hidePanel.run();
        LinearLayout row = new LinearLayout(this); row.setGravity(Gravity.CENTER);
        for (int i = 0; i < COMMON_COLORS.length; i++) {
            final int value = COMMON_COLORS[i];
            FrameLayout target = new FrameLayout(this);
            row.addView(target, new LinearLayout.LayoutParams(0, dp(48), 1));
            View dot = new View(this); GradientDrawable shape = circle(value);
            shape.setStroke(dp(selectedColor == value ? 2 : 1), selectedColor == value ? Color.WHITE : 0x88999999);
            dot.setBackground(shape); target.addView(dot, new FrameLayout.LayoutParams(dp(20), dp(20), Gravity.CENTER));
            target.setContentDescription(COLOR_NAMES[i] + (selectedColor == value ? ", selected" : ""));
            target.setOnClickListener(v -> { setColor(value); hidePanel.run(); });
        }
        panel = new PopupWindow(row, Math.min(root.getWidth() - dp(24), dp(288)), dp(48), true);
        panel.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(Color.TRANSPARENT));
        panel.setOutsideTouchable(true); panel.setElevation(0);
        panel.showAtLocation(root, Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL, 0, bottomInset + toolbar.getHeight() + dp(22));
    }
    private void confirm(String title, String message, String positive, Runnable action) {
        hidePanel.run(); com.sky.atc.easyformse.camera.AppCameraDialog.show(this,title,message,positive,true,action);
    }
    @Override public void onBackPressed() {
        if (saving) return;
        if (document.isDirty()) confirm("Discard annotations?", "Your unsaved drawings will be lost.", "Discard", () -> { setResult(RESULT_CANCELED); finish(); });
        else { setResult(RESULT_CANCELED); finish(); }
    }
    @Override public void onConfigurationChanged(Configuration config) { super.onConfigurationChanged(config); hidePanel.run(); buildToolbar(); setBusy(!loaded || saving); }
    @Override protected void onDestroy() {
        destroyed = true; hidePanel.run(); handler.removeCallbacks(hidePanel); handler.removeCallbacks(persistSettings); writeSettings(); worker.shutdown();
        if (drawing != null) drawing.release(); if (preview != null) preview.recycle();
        // Delete downloaded sources only after queued save/load work has finished.
        if (downloaded) new Thread(() -> { try { worker.awaitTermination(60, TimeUnit.SECONDS); } catch (InterruptedException error) { Thread.currentThread().interrupt(); } if (worker.isTerminated() && source != null) source.delete(); }, "annotation-cleanup").start();
        super.onDestroy();
    }
}
