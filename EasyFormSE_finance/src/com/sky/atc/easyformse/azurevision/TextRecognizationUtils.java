package com.sky.atc.easyformse.azurevision;

import android.app.Activity;
import android.app.AlertDialog;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

import com.sky.atc.easyformse.R;


public class TextRecognizationUtils {

    public static String finalTextString = "";
    public static String detectedText = " ";
    public static String inputType = "";
    private static TexRecognizationListener texRecognizationListener;

    public TextRecognizationUtils() {
    }


    public View getRectangleView() {
        return rectangleView;
    }

    public void setRectangleView(View rectangleView) {
        this.rectangleView = rectangleView;
    }

    public View getLeftView() {
        return leftView;
    }

    public void setLeftView(View leftView) {
        this.leftView = leftView;
    }

    public View getRightView() {
        return rightView;
    }

    public void setRightView(View rightView) {
        this.rightView = rightView;
    }

    public View getTopView() {
        return topView;
    }

    public void setTopView(View topView) {
        this.topView = topView;
    }

    public View getBottomView() {
        return bottomView;
    }

    public void setBottomView(View bottomView) {
        this.bottomView = bottomView;
    }

    private View rectangleView;
    private View leftView;
    private View rightView;
    private View topView;
    private View bottomView;

    public static void showEnterManualAlertDialog(final Activity activity, final boolean isSelected, final String selectedText, final TextView readingTextView) {

        finalTextString = selectedText;
        ComputerVisionDetection.writeLogToFile("Called", "showEnterManualAlertDialog");

        if (isSelected) {
            inputType = "auto";
        } else {
            inputType = "manual";
        }

        final AlertDialog dialogBuilder = new AlertDialog.Builder(activity).create();
        final LayoutInflater inflater = activity.getLayoutInflater();
        final View dialogView = inflater.inflate(R.layout.custom_text_rec_dialog, null);

        final EditText editText = dialogView.findViewById(R.id.edt_manualtext);
        Button button1 = dialogView.findViewById(R.id.buttonSubmit);
        Button button2 = dialogView.findViewById(R.id.buttonCancle);
        Button button3 = dialogView.findViewById(R.id.buttonEntreManual);
        final TextView txtSelected = dialogView.findViewById(R.id.txt_selected);
        final TextView txtTitle = dialogView.findViewById(R.id.txt_dialogtitle);
        final RadioGroup radioGroup = dialogView.findViewById(R.id.decimal_radio);

        if (isSelected) {
            try {
                double number = Double.parseDouble(selectedText);
                if (number % 1 != 0) {
                    radioGroup.setVisibility(View.GONE);
                } else {
                    radioGroup.setVisibility(View.VISIBLE);
                }
                readingTextView.setText(finalTextString);
            } catch (Exception e) {
                radioGroup.setVisibility(View.GONE);
                e.printStackTrace();
            }
        } else {
            radioGroup.setVisibility(View.GONE);
        }

        radioGroup.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup radioGroup, int i) {
                RadioButton radioButton = dialogView.findViewById(i);

                if (null != radioButton && i > -1) {
                    Log.d("##RADIO_BUTTON", radioButton.getText().toString());
                    if (radioButton.getText().toString().equalsIgnoreCase("One decimal")) {
                        if (selectedText.length() > 5) {
                            finalTextString = selectedText.substring(0, selectedText.length() - 1) + "." + selectedText.substring(selectedText.length() - 1);
                        } else {
                            double selectdFloat = Double.parseDouble(selectedText) / 10;
                            finalTextString = String.valueOf(selectdFloat);
                        }
                        txtSelected.setText(finalTextString);
                    } else if (radioButton.getText().toString().equalsIgnoreCase("Two decimal")) {
                        if (selectedText.length() > 5) {
                            finalTextString = selectedText.substring(0, selectedText.length() - 2) + "." + selectedText.substring(selectedText.length() - 2);
                        } else {
                            double selectdFloat = Double.parseDouble(selectedText) / 100;
                            finalTextString = String.valueOf(selectdFloat);
                        }
                        txtSelected.setText(finalTextString);
                    } else if (radioButton.getText().toString().equalsIgnoreCase("No decimal")) {
                        finalTextString = selectedText;
                        txtSelected.setText(finalTextString);
                    }
                }
                readingTextView.setText(finalTextString);
            }
        });

        if (isSelected) {
            txtSelected.setVisibility(View.VISIBLE);
            txtSelected.setText(selectedText);
            editText.setVisibility(View.GONE);
            // button3.setVisibility(View.VISIBLE);
            txtTitle.setText("SELECTED VALUE");
        } else {
            txtTitle.setText("MANUAL VALUE");
        }

        button1.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                ComputerVisionDetection.writeLogToFile("Submit Called" + finalTextString, "showEnterManualAlertDialog");
                if (isSelected) {
                    dialogBuilder.dismiss();
                    txtSelected.setText(selectedText);
                    texRecognizationListener.onSubmitButtonClick();
                } else {
                    String selectedText = editText.getText().toString();
                    if (!selectedText.equalsIgnoreCase("")) {
                        dialogBuilder.dismiss();
                        showEnterManualAlertDialog(activity, true, selectedText, readingTextView);
                        inputType = "manual";
                        readingTextView.setText(selectedText);
                        texRecognizationListener.onSubmitButtonClick();
                    } else {
                        Toast.makeText(activity, "Please enter value first", Toast.LENGTH_SHORT).show();
                    }
                }
            }
        });
        button2.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // DO SOMETHINGS
                dialogBuilder.dismiss();
            }
        });
        button3.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // DO SOMETHINGS
                dialogBuilder.dismiss();
                showEnterManualAlertDialog(activity, false, null, readingTextView);
            }
        });
        dialogBuilder.setView(dialogView);
        dialogBuilder.show();
    }

    public static void setIntialValues(TexRecognizationListener texRecognizationListener1) {
        inputType = "";
        finalTextString = "";
        detectedText = " ";
        texRecognizationListener = texRecognizationListener1;
    }
}
