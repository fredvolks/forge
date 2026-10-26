package ca.correcteur.perso;
import android.content.*;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.inputmethodservice.InputMethodService;
import android.text.InputType;
import android.view.*;
import android.view.inputmethod.*;
import android.widget.*;
import java.util.*;

public final class PersonalKeyboardService extends InputMethodService {
    private static final int BG=Color.rgb(223,231,224), INK=Color.rgb(41,62,45);
    private LinearLayout keyboard;
    private TextView status;
    private boolean shift=true,symbols=false,secure=false;
    private CorrectionEngine.Suggestion last;
    private String lastWithSpace;
    private int dp(float n){return (int)(n*getResources().getDisplayMetrics().density+.5f);}
    @Override public void onStartInput(EditorInfo info,boolean restarting){
        super.onStartInput(info,restarting);
        shift=true;symbols=false;last=null;lastWithSpace=null;secure=isSensitive(info);
        if(keyboard!=null)draw();
    }
    private boolean isSensitive(EditorInfo info){
        if(info==null)return true;
        int cls=info.inputType&InputType.TYPE_MASK_CLASS;
        int var=info.inputType&InputType.TYPE_MASK_VARIATION;
        return cls==InputType.TYPE_CLASS_TEXT &&
            (var==InputType.TYPE_TEXT_VARIATION_PASSWORD ||
             var==InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD ||
             var==InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD) ||
             cls==InputType.TYPE_CLASS_NUMBER && var==InputType.TYPE_NUMBER_VARIATION_PASSWORD;
    }
    @Override public View onCreateInputView(){
        keyboard=new LinearLayout(this);keyboard.setOrientation(LinearLayout.VERTICAL);
        keyboard.setBackgroundColor(BG);keyboard.setPadding(dp(2),dp(4),dp(2),dp(5));
        draw();return keyboard;
    }
    private LinearLayout row(){
        LinearLayout r=new LinearLayout(this);r.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(51));p.bottomMargin=dp(3);
        keyboard.addView(r,p);return r;
    }
    interface LongPress {void run();}
    private void key(LinearLayout r,String title,float width,boolean special,Runnable press,LongPress longPress){
        TextView b=new TextView(this);b.setText(title);b.setTextSize(title.equals("espace")?13:20);
        b.setGravity(Gravity.CENTER);b.setTextColor(INK);
        GradientDrawable shape=new GradientDrawable();
        shape.setColor(special?Color.rgb(184,200,185):Color.WHITE);
        shape.setCornerRadius(dp(5));b.setBackground(shape);
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,-1,width);
        p.setMargins(dp(2),dp(2),dp(2),dp(2));r.addView(b,p);
        b.setOnClickListener(v->press.run());
        if(longPress!=null)b.setOnLongClickListener(v->{longPress.run();return true;});
    }
    private void letters(String letters){
        LinearLayout r=row();
        for(char c:letters.toCharArray()){
            String s=String.valueOf(shift?Character.toUpperCase(c):c);
            String accent=null;
            switch(c){
                case 'e':accent=shift?"É":"é";break;
                case 'a':accent=shift?"À":"à";break;
                case 'u':accent=shift?"Ù":"ù";break;
                case 'c':accent=shift?"Ç":"ç";break;
                case 'i':accent=shift?"Î":"î";break;
                case 'o':accent=shift?"Ô":"ô";break;
            }
            final String alternative=accent;
            key(r,s,1,false,()->letter(s),alternative==null?null:()->letter(alternative));
        }
    }
    private void draw(){
        if(keyboard==null)return;
        keyboard.removeAllViews();
        LinearLayout toolbar=new LinearLayout(this);toolbar.setGravity(Gravity.CENTER_VERTICAL);
        status=new TextView(this);status.setTextColor(INK);status.setTextSize(14);
        status.setPadding(dp(12),0,0,0);status.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.addView(status,new LinearLayout.LayoutParams(0,dp(39),1));
        TextView cog=new TextView(this);cog.setText("⚙");cog.setTextSize(22);
        cog.setTextColor(INK);cog.setGravity(Gravity.CENTER);
        toolbar.addView(cog,new LinearLayout.LayoutParams(dp(45),dp(39)));
        cog.setOnClickListener(v->{
            Intent i=new Intent(this,SettingsActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);startActivity(i);
        });
        keyboard.addView(toolbar);refresh();
        if(!symbols){
            letters("azertyuiop");letters("qsdfghjklm");
            LinearLayout r=row();key(r,"⇧",1.25f,true,()->{shift=!shift;draw();},null);
            for(char c:"wxcvbn".toCharArray()){
                String s=String.valueOf(shift?Character.toUpperCase(c):c);
                key(r,s,1,false,()->letter(s),null);
            }
            key(r,"⌫",1.35f,true,this::backspace,null);
        }else{
            for(String chars:new String[]{"1234567890","@#$%&-+()/"}){
                LinearLayout r=row();
                for(char c:chars.toCharArray()){String s=String.valueOf(c);key(r,s,1,false,()->insert(s),null);}
            }
            LinearLayout r=row();
            for(String s:new String[]{"*","\"","'",":",";","!","?"})
                key(r,s,1,false,()->insert(s),null);
            key(r,"⌫",1.35f,true,this::backspace,null);
        }
        LinearLayout bottom=row();
        key(bottom,symbols?"ABC":"?123",1.3f,true,()->{symbols=!symbols;shift=false;draw();},null);
        key(bottom,",",.6f,false,()->insert(","),null);
        key(bottom,"'",.6f,false,()->insert("'"),null);
        key(bottom,"🌐",.8f,true,()->{
            InputMethodManager imm=(InputMethodManager)getSystemService(Context.INPUT_METHOD_SERVICE);
            if(imm!=null)imm.showInputMethodPicker();
        },null);
        key(bottom,"espace",4f,false,this::space,null);
        key(bottom,".",.6f,false,()->insert("."),null);
        key(bottom,"↵",1f,true,this::enter,null);
    }
    private void letter(String s){insert(s);if(shift){shift=false;draw();}}
    private void insert(String s){
        InputConnection ic=getCurrentInputConnection();if(ic==null)return;
        ic.commitText(s,1);last=null;refresh();
    }
    private void space(){
        InputConnection ic=getCurrentInputConnection();if(ic==null)return;
        last=null;
        boolean auto=getSharedPreferences(SettingsActivity.PREFS,MODE_PRIVATE)
             .getBoolean(SettingsActivity.AUTO,true);
        if(auto&&!secure){
            CharSequence before=ic.getTextBeforeCursor(240,0);
            if(before!=null){
                android.content.SharedPreferences p=getSharedPreferences(SettingsActivity.PREFS,MODE_PRIVATE);
                Set<String> protectedWords=CorrectionEngine.protectedWords(p.getString(SettingsActivity.PROTECTED,""));
                Set<String> ignored=p.getStringSet(SettingsActivity.IGNORED,Collections.emptySet());
                CorrectionEngine.Suggestion s=CorrectionEngine.suggest(before.toString(),protectedWords,ignored);
                if(s!=null){
                    ic.beginBatchEdit();
                    ic.deleteSurroundingText(s.original.length(),0);
                    ic.commitText(s.replacement,1);
                    ic.endBatchEdit();
                    last=s;lastWithSpace=s.replacement+" ";
                }
            }
        }
        ic.commitText(" ",1);refresh();
    }
    private void backspace(){
        InputConnection ic=getCurrentInputConnection();if(ic==null)return;
        CharSequence selected=ic.getSelectedText(0);
        if(selected!=null && selected.length()>0)ic.commitText("",1);
        else ic.deleteSurroundingText(1,0);
        last=null;refresh();
    }
    private void undo(){
        InputConnection ic=getCurrentInputConnection();
        if(ic==null||last==null||lastWithSpace==null)return;
        CharSequence before=ic.getTextBeforeCursor(lastWithSpace.length(),0);
        if(before!=null&&before.toString().equals(lastWithSpace)){
            ic.beginBatchEdit();ic.deleteSurroundingText(lastWithSpace.length(),0);
            ic.commitText(last.original+" ",1);ic.endBatchEdit();
            android.content.SharedPreferences prefs=getSharedPreferences(SettingsActivity.PREFS,MODE_PRIVATE);
            String key="undo_"+last.original.toLowerCase(Locale.CANADA_FRENCH);
            int count=prefs.getInt(key,0)+1;
            android.content.SharedPreferences.Editor e=prefs.edit().putInt(key,count);
            if(count>=2){
                Set<String> ignored=new HashSet<>(prefs.getStringSet(SettingsActivity.IGNORED,Collections.emptySet()));
                ignored.add(last.original.toLowerCase(Locale.CANADA_FRENCH));
                e.putStringSet(SettingsActivity.IGNORED,ignored);
            }
            e.apply();
        }
        last=null;lastWithSpace=null;refresh();
    }
    private void refresh(){
        if(status==null)return;
        if(secure){status.setText("Saisie privée");status.setOnClickListener(null);}
        else if(last!=null){status.setText("↶ Annuler : "+last.replacement);status.setOnClickListener(v->undo());}
        else{status.setText("Correcteur Perso · FR-CA");status.setOnClickListener(null);}
    }
    private void enter(){
        InputConnection ic=getCurrentInputConnection();if(ic==null)return;
        EditorInfo info=getCurrentInputEditorInfo();
        int action=info==null?EditorInfo.IME_ACTION_NONE:info.imeOptions&EditorInfo.IME_MASK_ACTION;
        if(action==EditorInfo.IME_ACTION_DONE||action==EditorInfo.IME_ACTION_GO||
           action==EditorInfo.IME_ACTION_SEARCH||action==EditorInfo.IME_ACTION_SEND||
           action==EditorInfo.IME_ACTION_NEXT)ic.performEditorAction(action);
        else{ic.commitText("\n",1);shift=true;draw();}
    }
}
