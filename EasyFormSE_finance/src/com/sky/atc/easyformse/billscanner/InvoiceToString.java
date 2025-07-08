package com.sky.atc.easyformse.billscanner;

import android.annotation.SuppressLint;
import android.graphics.Typeface;
import android.os.Bundle;
import android.text.Spannable;
import android.text.style.StyleSpan;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TableLayout;
import android.widget.TableRow;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.sky.atc.easyformse.R;


public class InvoiceToString extends AppCompatActivity {
   private static LinearLayout root;
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_image);

        String text = getIntent().getStringExtra("TEXT");
        String pointx = getIntent().getStringExtra("POINTX");
        String pointy = getIntent().getStringExtra("POINTY");


        root = (LinearLayout) findViewById(R.id.root1);
        ScrollView scrollView = (ScrollView) findViewById(R.id.scrollView);
        LinearLayout.LayoutParams dim=new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.MATCH_PARENT);
       TableLayout layout=new TableLayout(this);
       layout.setLayoutParams(dim);
        TableRow tableRow=new TableRow(this);
        tableRow.setLayoutParams(layout.getLayoutParams());

        for(int i=0;i<1000;i++)
        {
            TextView t = new TextView(this);
            t.setLayoutParams(layout.getLayoutParams());
            t.setX(Float.parseFloat(pointx));
            t.setY(Float.parseFloat(pointy));
            t.setText(text);
            t.setTextSize(5);


//            tableLayout.addView();
            Spannable spannable= (Spannable) t.getText();
            t.getAutoLinkMask();
            root.addView(t);

            t.setOnClickListener(new View.OnClickListener() {
                @SuppressLint("ResourceType")
                @Override
                public void onClick(View v) {
                    TextView b = (TextView) v;
                    String buttonText = b.getText().toString();
                    Spannable spannable= (Spannable) b.getText();
                    spannable.setSpan(new StyleSpan(Typeface.BOLD_ITALIC),0,100, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
//                    SpannableString spn= SpannableString.valueOf(b.getText().toString());
//                    spn.setSpan(new StyleSpan(Typeface.BOLD_ITALIC),0,100, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
                    Toast.makeText(getApplicationContext(), spannable.toString(), Toast.LENGTH_LONG).show();
                }
            });

            this.setContentView(scrollView);

        }

    }

}

