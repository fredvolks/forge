package ca.correcteur.perso;
import android.app.Activity;
import android.content.*;
import android.graphics.Color;
import android.os.Bundle;
import android.provider.Settings;
import android.view.*;
import android.view.inputmethod.InputMethodManager;
import android.widget.*;
import java.util.*;

public final class SettingsActivity extends Activity {
    static final String PREFS="correcteur_settings", AUTO="auto", PROTECTED="protected", IGNORED="ignored";
    private LinearLayout root;
    private int dp(int n){return (int)(n*getResources().getDisplayMetrics().density+0.5f);}
    private TextView text(String value,int size){
        TextView t=new TextView(this);t.setText(value);t.setTextSize(size);
        t.setTextColor(Color.rgb(42,66,53));t.setPadding(0,dp(7),0,dp(7));return t;
    }
    private void button(String title,Runnable action){
        Button b=new Button(this);b.setAllCaps(false);b.setText(title);
        root.addView(b,new LinearLayout.LayoutParams(-1,dp(54)));
        b.setOnClickListener(v->action.run());
    }
    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        ScrollView scroll=new ScrollView(this);
        scroll.setBackgroundColor(Color.rgb(248,250,247));
        root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(20),dp(28),dp(20),dp(24));
        scroll.addView(root);setContentView(scroll);
        root.addView(text("Correcteur Perso",31));
        root.addView(text("Ton français, à ta façon. • Prototype 0.1",16));
        root.addView(text("1. Activer le clavier Android",20));
        root.addView(text("Active Correcteur Perso, puis choisis-le comme clavier. Tu peux revenir à Samsung à tout moment.",15));
        button("Ouvrir les paramètres du clavier",()->startActivity(new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS)));
        button("Choisir Correcteur Perso",()->{
            InputMethodManager imm=(InputMethodManager)getSystemService(Context.INPUT_METHOD_SERVICE);
            if(imm!=null)imm.showInputMethodPicker();
        });
        root.addView(text("2. Correction prudente",20));
        Switch sw=new Switch(this);sw.setText("Corriger automatiquement à l'espace");
        sw.setChecked(getSharedPreferences(PREFS,MODE_PRIVATE).getBoolean(AUTO,true));
        sw.setOnCheckedChangeListener((v,b)->getSharedPreferences(PREFS,MODE_PRIVATE).edit().putBoolean(AUTO,b).apply());
        root.addView(sw);
        root.addView(text("3. Mes mots à préserver",20));
        root.addView(text("Sépare les mots avec des virgules. Les expressions québécoises courantes sont protégées par défaut.",14));
        EditText protectedInput=new EditText(this);protectedInput.setMinLines(3);
        protectedInput.setText(getSharedPreferences(PREFS,MODE_PRIVATE).getString(PROTECTED,
            "pis, pk, ak, fak, faque, tsé, ben, chu, jsuis, jveux, jpeux, tbn, criss, esti, tabarnak, asteur, pantoute, mettons, pcq"));
        root.addView(protectedInput);
        button("Enregistrer mes mots",()->{
            getSharedPreferences(PREFS,MODE_PRIVATE).edit().putString(PROTECTED,protectedInput.getText().toString()).apply();
            Toast.makeText(this,"Mots enregistrés",Toast.LENGTH_SHORT).show();
        });
        root.addView(text("4. Apprentissage local",20));
        root.addView(text("Après deux annulations d'une même correction, elle ne sera plus imposée.",14));
        button("Effacer les exceptions apprises",()->{
            android.content.SharedPreferences p=getSharedPreferences(PREFS,MODE_PRIVATE);
            android.content.SharedPreferences.Editor edit=p.edit().remove(IGNORED);
            for(String key:p.getAll().keySet())if(key.startsWith("undo_"))edit.remove(key);
            edit.apply();Toast.makeText(this,"Apprentissage réinitialisé",Toast.LENGTH_SHORT).show();
        });
        root.addView(text("Confidentialité : aucune permission Internet. Ce prototype ne stocke pas les messages. Les champs de mot de passe ne sont pas corrigés.",14));
    }
}
