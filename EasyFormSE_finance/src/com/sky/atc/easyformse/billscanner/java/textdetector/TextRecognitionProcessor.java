/*
 * Copyright 2020 Google LLC. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.sky.atc.easyformse.billscanner.java.textdetector;

import static com.sky.atc.easyformse.billscanner.java.textdetector.TextGraphic.textInterface;
import static java.lang.Math.max;
import static java.lang.Math.min;

import android.app.Activity;
import android.content.Context;
import android.graphics.Point;
import android.graphics.RectF;
import android.util.Log;
import android.view.Display;

import androidx.annotation.NonNull;

import com.sky.atc.easyformse.billscanner.FrameMetadata;
import com.sky.atc.easyformse.billscanner.GraphicOverlay;
import com.sky.atc.easyformse.billscanner.MySuperAppApplication;
import com.sky.atc.easyformse.billscanner.java.VisionProcessorBase;
import com.google.android.gms.tasks.Task;
import com.google.mlkit.common.MlKitException;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.Text.Line;
import com.google.mlkit.vision.text.Text.TextBlock;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;


import java.nio.ByteBuffer;

/** Processor for the text detector demo. */
public class TextRecognitionProcessor extends VisionProcessorBase<Text> {

  private static final String TAG = "TextRecProcessor";

  private final TextRecognizer textRecognizer;
  public float postScaleWidthOffset;
  public float postScaleHeightOffset;
  public float scaleFactor = 1.0f;
  Context context;
  public int drawcount = 1;
  public int textdraw = 1;

  public TextRecognitionProcessor(Context context) {
    super(context);
    this.context = context;
    textRecognizer = TextRecognition.getClient();
  }

  @Override
  public void processByteBuffer(ByteBuffer data, FrameMetadata frameMetadata, GraphicOverlay graphicOverlay) throws MlKitException {

  }


  @Override
  public void stop() {
    super.stop();
  //  textRecognizer.close();
  }

  @Override
  protected Task<Text> detectInImage(InputImage image) {
    return null;
  }

  @Override
  protected void onSuccess(@NonNull Text text, @NonNull GraphicOverlay graphicOverlay) {
    Log.d(TAG, "On-device Text detection successful");
    String alltext = text.getText();
    logExtrasForTesting(text);

    graphicOverlay.add(new TextGraphic(graphicOverlay, text));
  }

  private void logExtrasForTesting(Text text) {
    if (text != null) {

      if(drawcount == 1){

        for (TextBlock textBlock : text.getTextBlocks()) {
          // Renders the text at the bottom of the box.
          for (Line line : textBlock.getLines()) {
            // Draws the bounding box around the TextBlock.
            RectF rect = new RectF(line.getBoundingBox());
            // If the image is flipped, the left will be translated to right, and the right to left.
            float x0 = translateX(rect.left);
            float x1 = translateX(rect.right);
            rect.left = min(x0, x1);
            rect.right = max(x0, x1);
            rect.top = translateY(rect.top);
            rect.bottom = translateY(rect.bottom);

//        textInterface.callback(line.getText(),rect.left,rect.top-STROKE_WIDTH);
            Log.d("TEXTLINE",line.getText() + " = " +x0+ " = "+rect.bottom);
//            textInterface.callback(line.getText(),x0,rect.bottom,0);
            if(MySuperAppApplication.getTextorentity().equalsIgnoreCase("1")){
              if(textdraw == 1)
              textInterface.callback(text.getText(),x0,rect.bottom,0);
            }else {
              textInterface.callback(line.getText(),x0,rect.bottom,0);
            }
            textdraw = 2;

//        canvas.drawText(line.getText(), rect.left, rect.top - STROKE_WIDTH, textPaint);

          }
        }

        drawcount = 2;
      }


//      Log.v(MANUAL_TESTING_LOG, "Detected text has : " + text.getTextBlocks().size() + " blocks");
//      for (int i = 0; i < text.getTextBlocks().size(); ++i) {
//        List<Line> lines = text.getTextBlocks().get(i).getLines();
//        Log.v(MANUAL_TESTING_LOG, String.format("Detected text block %d has %d lines", i, lines.size()));
//        for (int j = 0; j < lines.size(); ++j) {
//          List<Element> elements = lines.get(j).getElements();
//          Log.v(MANUAL_TESTING_LOG, String.format("Detected text line %d has %d elements", j, elements.size()));
//          for (int k = 0; k < elements.size(); ++k) {
//            Element element = elements.get(k);
//            Log.v(MANUAL_TESTING_LOG, String.format("Detected text element %d says: %s", k, element.getText()));
//            Log.v(MANUAL_TESTING_LOG, String.format("Detected text element %d has a bounding box: %s", k, element.getBoundingBox().flattenToString()));
//            Log.v(MANUAL_TESTING_LOG, String.format("Expected corner point size is 4, get %d", element.getCornerPoints().length));
//            for (Point point : element.getCornerPoints()) {
//              Log.v(MANUAL_TESTING_LOG, String.format("Corner point for element %d is located at: x - %d, y = %d", k, point.x, point.y));
//            }
//          }
//        }
//      }
    }
  }

  @Override
  protected void onFailure(@NonNull Exception e) {
    Log.w(TAG, "Text detection failed." + e);
  }

  public float translateX(float x) {
    boolean isImageFlipped = false;
//
//    DisplayMetrics displayMetrics = new DisplayMetrics();
//    WindowManager wm = (WindowManager) MySuperAppApplication.getContext().getSystemService(Context.WINDOW_SERVICE); // the results will be higher than using the activity context object or the getWindowManager() shortcut
//    wm.getDefaultDisplay().getMetrics(displayMetrics);

    Display display =((Activity) context).getWindowManager().getDefaultDisplay();
    Point size  = new Point();
    display.getSize(size);
//
//    int width = displayMetrics.widthPixels;
//    int height = displayMetrics.heightPixels;

    int width = size.x;
    int height = size.y;

    if (isImageFlipped) {
      return width - (scale(x) - postScaleWidthOffset);
    } else {
      return scale(x) - postScaleWidthOffset;
    }
  }

  public float scale(float imagePixel) {
    return (float) (imagePixel * scaleFactor);
  }

  public float translateY(float y) {
    return scale(y) - postScaleHeightOffset;
  }

}
