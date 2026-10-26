package ca.correcteur.perso;
import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.os.Bundle;
import android.provider.Settings;
import android.view.*;
import android.view.inputmethod.InputMethodManager;
import android.widget.*;

public final class SettingsActivity extends Activity {
    static final String PREFS="correcteur_settings", AUTO="auto", PROTECTED="protected", IGNORED="ignored";
    private LinearLayout root;
    private TextView learning;
    private Switch profileSwitch;
    private int dp(int n){return (int)(n*getResources().getDisplayMetrics().density+0.5f);}
    private TextView text(String value,int size){
        TextView t=new TextView(this);t.setText(value);t.setTextSize(size);
        t.setTextColor(Color.rgb(42,53,64));t.setPadding(0,dp(7),0,dp(7));return t;
    }
    private void button(String value,Runnable click){
        Button b=new Button(this);b.setAllCaps(false);b.setText(value);
        root.addView(b,new LinearLayout.LayoutParams(-1,dp(55)));
        b.setOnClickListener(v->click.run());
    }
    @Override protected void onResume(){super.onResume();refresh();}
    private void refresh(){
        if(learning==null)return;
        int state=StyleLearner.state(this);
        if(state==StyleLearner.OFF)learning.setText("Inactif : aucun mot analysé.");
        else if(state==StyleLearner.SAMPLING)learning.setText("Analyse locale en cours : "+
            StyleLearner.remainingHours(this)+" h restantes · "+StyleLearner.sampled(this)+
            " mots observés. Le clavier doit être utilisé.");
        else learning.setText("Profil 24 h créé · "+StyleLearner.sampled(this)+
            " mots observés.\nMots préservés : "+StyleLearner.profilePreview(this));
        if(profileSwitch!=null){
            profileSwitch.setEnabled(state==StyleLearner.READY);
            profileSwitch.setChecked(StyleLearner.enabled(this));
        }
    }
    @Override public void onCreate(Bundle saved){
        super.onCreate(saved);
        ScrollView scroll=new ScrollView(this);scroll.setBackgroundColor(Color.rgb(247,249,252));
        root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(20),dp(24),dp(20),dp(30));
        scroll.addView(root);setContentView(scroll);
        root.addView(text("Correcteur Perso",30));
        root.addView(text("QWERTY · Français québécois · Version 0.2",16));
        root.addView(text("1. Activer ton clavier",19));
        root.addView(text("Clavier inspiré de la disposition Samsung QWERTY. Il s'agit d'un clavier distinct, pas d'une modification du clavier Samsung.",14));
        button("Ouvrir les paramètres de clavier",()->startActivity(new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS)));
        button("Choisir Correcteur Perso",()->{
            InputMethodManager imm=(InputMethodManager)getSystemService(Context.INPUT_METHOD_SERVICE);
            if(imm!=null)imm.showInputMethodPicker();
        });
        root.addView(text("2. Correction automatique",19));
        Switch sw=new Switch(this);sw.setText("Corriger les fautes connues en appuyant sur Espace");
        sw.setChecked(getSharedPreferences(PREFS,MODE_PRIVATE).getBoolean(AUTO,true));
        sw.setOnCheckedChangeListener((v,on)->getSharedPreferences(PREFS,MODE_PRIVATE).edit().putBoolean(AUTO,on).apply());
        root.addView(sw);
        root.addView(text("3. Mes expressions à garder",19));
        root.addView(text("Exemples : pis, fak, pk, ak, tsé. Ajoute tes mots séparés par une virgule.",14));
        EditText words=new EditText(this);words.setMinLines(3);
        words.setText(getSharedPreferences(PREFS,MODE_PRIVATE).getString(PROTECTED,
            "pis, pk, ak, fak, faque, tsé, ben, chu, jsuis, jveux, jpeux, tbn, criss, esti, tabarnak, asteur, pantoute, mettons, pcq"));
        root.addView(words);
        button("Enregistrer mes mots",()->{
            getSharedPreferences(PREFS,MODE_PRIVATE).edit().putString(PROTECTED,words.getText().toString()).apply();
            Toast.makeText(this,"Expressions enregistrées",Toast.LENGTH_SHORT).show();
        });
        root.addView(text("4. Analyse de mon style pendant 24 h",19));
        root.addView(text("Facultative. Seuls les mots isolés et leur nombre d'utilisations sont sauvegardés localement, avec une limite de 250 mots. Aucune conversation complète, aucun compte connecté, aucun envoi Internet. Les mots de passe, courriels et champs sensibles sont exclus.",14));
        learning=text("",15);root.addView(learning);
        button("Commencer / recommencer les 24 h",()->new AlertDialog.Builder(this)
            .setTitle("Autoriser l'apprentissage local?")
            .setMessage("Pendant 24 heures, Correcteur Perso comptera les mots isolés quand tu utilises CE clavier. Les mots les plus fréquents serviront à préserver ta façon d'écrire. Recommencer supprime l'ancien profil.")
            .setNegativeButton("Annuler",null)
            .setPositiveButton("Commencer",(d,w)->{StyleLearner.start(this);refresh();}).show());
        profileSwitch=new Switch(this);profileSwitch.setText("Activer les mots appris");
        profileSwitch.setOnCheckedChangeListener((v,on)->{
            StyleLearner.enable(this,on);
            if(learning!=null)refresh();
        });
        root.addView(profileSwitch);
        button("Supprimer les données apprises",()->new AlertDialog.Builder(this)
            .setTitle("Effacer les observations?")
            .setMessage("Supprimer entièrement la journée d'analyse et le profil appris? Les mots enregistrés manuellement sont conservés.")
            .setNegativeButton("Annuler",null)
            .setPositiveButton("Effacer",(d,w)->{StyleLearner.erase(this);refresh();}).show());
        root.addView(text("5. Émojis",19));
        root.addView(text("Touche 😀 sur le clavier : catalogue AndroidX d'émojis, catégories, variantes de couleurs de peau et favoris récents du sélecteur.",14));
        root.addView(text("6. Réinitialisation des corrections refusées",19));
        root.addView(text("Après deux annulations d'une même correction, le clavier n'impose plus celle-ci.",14));
        button("Effacer les corrections refusées",()->{
            android.content.SharedPreferences p=getSharedPreferences(PREFS,MODE_PRIVATE);
            android.content.SharedPreferences.Editor e=p.edit().remove(IGNORED);
            for(String k:p.getAll().keySet())if(k.startsWith("undo_"))e.remove(k);
            e.apply();Toast.makeText(this,"Historique des refus effacé",Toast.LENGTH_SHORT).show();
        });
        root.addView(text("Prototype hors ligne : aucune permission Internet. L'apprentissage est désactivé par défaut; le profil se finalise lorsque tu ouvres le clavier ou les Réglages après les 24 heures.",13));
        refresh();
    }
}
