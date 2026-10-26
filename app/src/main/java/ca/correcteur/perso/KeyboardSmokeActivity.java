package ca.correcteur.perso;

import android.app.Activity;
import android.os.Bundle;
import android.view.inputmethod.InputMethodManager;
import android.content.Context;
import android.widget.*;
import android.graphics.Color;
import android.view.*;

public final class KeyboardSmokeActivity extends Activity {
    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        LinearLayout area=new LinearLayout(this);
        area.setBackgroundColor(Color.rgb(22,22,25));
        area.setPadding(32,44,32,44);
        area.setOrientation(LinearLayout.VERTICAL);
        TextView label=new TextView(this);
        label.setText("Test du clavier QWERTY sombre");
        label.setTextColor(Color.WHITE);
        label.setTextSize(21);
        area.addView(label);
        EditText input=new EditText(this);
        input.setTextColor(Color.WHITE);
        input.setId(R.id.smoke_input);
        input.setSingleLine(false);
        input.setMinLines(3);
        input.setHint("Tape ici pour tester Espace et les émojis");
        input.setHintTextColor(Color.GRAY);
        area.addView(input,new LinearLayout.LayoutParams(-1,-2));
        setContentView(area);
        input.requestFocus();
        input.postDelayed(()->{
            InputMethodManager imm=(InputMethodManager)getSystemService(Context.INPUT_METHOD_SERVICE);
            if(imm!=null)imm.showSoftInput(input,InputMethodManager.SHOW_IMPLICIT);
        },250);
    }
}
