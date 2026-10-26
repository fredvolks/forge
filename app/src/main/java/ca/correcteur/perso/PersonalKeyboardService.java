package ca.correcteur.perso;

import android.content.*;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.inputmethodservice.InputMethodService;
import android.text.InputType;
import android.view.*;
import android.view.inputmethod.*;
import android.widget.*;
import androidx.emoji2.emojipicker.EmojiPickerView;
import java.util.*;

/**
 * Prototype QWERTY inspired by a familiar Samsung-style arrangement.
 * Not Samsung Keyboard and does not embed Samsung proprietary code.
 */
public final class PersonalKeyboardService extends InputMethodService {
    private static final int BASE=Color.rgb(20,20,22), KEY=Color.rgb(55,55,59);
    private static final int SPECIAL=Color.rgb(35,35,39), INK=Color.rgb(247,247,250);
    private LinearLayout root;
    private TextView status;
    private boolean shift=true, symbols=false, emoji=false, sensitive=false;
    private CorrectionEngine.Suggestion last;
    private String lastWithSpace;
    private int dp(int v){return (int)(v*getResources().getDisplayMetrics().density+.5f);}
    @Override public void onStartInput(EditorInfo info, boolean restarting){
        super.onStartInput(info,restarting);
        shift=true;symbols=false;emoji=false;last=null;lastWithSpace=null;
        sensitive=isSensitive(info);
        StyleLearner.finishIfDue(this);
        if(root!=null)draw();
    }
    private boolean isSensitive(EditorInfo info){
        if(info==null)return true;
        if((info.imeOptions&EditorInfo.IME_FLAG_NO_PERSONALIZED_LEARNING)!=0)return true;
        int cls=info.inputType&InputType.TYPE_MASK_CLASS;
        int variation=info.inputType&InputType.TYPE_MASK_VARIATION;
        if(cls==InputType.TYPE_CLASS_PHONE||cls==InputType.TYPE_CLASS_NUMBER||cls==InputType.TYPE_CLASS_DATETIME)return true;
        if(cls!=InputType.TYPE_CLASS_TEXT)return true;
        return variation==InputType.TYPE_TEXT_VARIATION_PASSWORD ||
            variation==InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD ||
            variation==InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD ||
            variation==InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS ||
            variation==InputType.TYPE_TEXT_VARIATION_WEB_EMAIL_ADDRESS ||
            variation==InputType.TYPE_TEXT_VARIATION_URI;
    }
    @Override public View onCreateInputView(){
        root=new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BASE);
        root.setPadding(dp(2),dp(5),dp(2),dp(7));
        draw();
        return root;
    }
    private LinearLayout row(int height){
        LinearLayout line=new LinearLayout(this);
        line.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,dp(height));
        lp.bottomMargin=dp(2);
        root.addView(line,lp);
        return line;
    }
    private String[] accents(char ch){
        switch(ch){
            case 'a':return new String[]{"à","â","ä","á"};
            case 'e':return new String[]{"é","è","ê","ë"};
            case 'i':return new String[]{"î","ï","í"};
            case 'o':return new String[]{"ô","ö","ó"};
            case 'u':return new String[]{"ù","û","ü","ú"};
            case 'c':return new String[]{"ç"};
            case 'n':return new String[]{"ñ"};
            default:return new String[0];
        }
    }
    private void key(LinearLayout line,String label,float weight,boolean secondary,
                     int textSize,Runnable action,String[] longOptions){
        TextView key=new TextView(this);
        key.setText(label);
        key.setGravity(Gravity.CENTER);
        key.setTextSize(textSize);
        key.setTextColor(INK);
        key.setTypeface(Typeface.DEFAULT,Typeface.NORMAL);
        GradientDrawable background=new GradientDrawable();
        background.setColor(secondary?SPECIAL:KEY);
        background.setCornerRadius(dp(7));
        key.setBackground(background);
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,-1,weight);
        p.setMargins(dp(2),dp(2),dp(2),dp(2));
        line.addView(key,p);
        key.setContentDescription(label.equals("Français (CA)")?"Touche espace":"Touche "+label);
        key.setOnClickListener(v->{
            v.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP);
            try { action.run(); }
            catch(RuntimeException | LinkageError e){
                KeyboardDiagnostics.record(this,"touche",e);
                try{refresh();}catch(RuntimeException | LinkageError ignored){}
            }
        });
        if(longOptions!=null&&longOptions.length>0)
            key.setOnLongClickListener(v->{
                PopupMenu popup=new PopupMenu(this,key);
                for(String s:longOptions){
                    final String accent=shift?s.toUpperCase(Locale.CANADA_FRENCH):s;
                    popup.getMenu().add(accent).setOnMenuItemClickListener(item->{type(accent);return true;});
                }
                popup.show();
                return true;
            });
    }
    private void letterRow(String letters, int height){
        LinearLayout line=row(height);
        for(char c:letters.toCharArray()){
            String letter=String.valueOf(shift?Character.toUpperCase(c):c);
            key(line,letter,1,false,21,()->letter(letter),accents(c));
        }
    }
    private void draw(){
        if(root==null)return;
        root.removeAllViews();
        LinearLayout top=row(38);
        key(top,"✦",.65f,true,18,()->showSettings(),null);
        status=new TextView(this);
        status.setTextSize(13);
        status.setTextColor(INK);
        status.setGravity(Gravity.CENTER_VERTICAL);
        status.setPadding(dp(10),0,0,0);
        top.addView(status,new LinearLayout.LayoutParams(0,-1,5));
        key(top,"⚙",.7f,true,18,()->showSettings(),null);
        refresh();
        if(emoji){
            LinearLayout nav=row(43);
            key(nav,"ABC",1f,true,16,()->{emoji=false;draw();},null);
            key(nav,"⌫",.7f,true,19,this::backspace,null);
            EmojiPickerView picker=new EmojiPickerView(this);
            picker.setEmojiGridColumns(9);
            picker.setOnEmojiPickedListener(item->{
                InputConnection ic=getCurrentInputConnection();
                if(ic!=null)ic.commitText(item.getEmoji(),1);
                last=null;lastWithSpace=null;refresh();
            });
            root.addView(picker,new LinearLayout.LayoutParams(-1,dp(240)));
            return;
        }
        if(!symbols){
            LinearLayout numbers=row(35);
            for(char n:"1234567890".toCharArray()){
                String value=String.valueOf(n);
                key(numbers,value,1,false,16,()->type(value),null);
            }
            letterRow("qwertyuiop",49);
            letterRow("asdfghjkl",49);
            LinearLayout lower=row(49);
            key(lower,"⇧",1.4f,true,21,()->{shift=!shift;draw();},null);
            for(char c:"zxcvbnm".toCharArray()){
                String value=String.valueOf(shift?Character.toUpperCase(c):c);
                key(lower,value,1,false,21,()->letter(value),accents(c));
            }
            key(lower,"⌫",1.4f,true,21,this::backspace,null);
        }else{
            for(String lineText:new String[]{"1234567890","@#$%&-+()/","*\"':;!?_=[]"}){
                LinearLayout line=row(49);
                for(char c:lineText.toCharArray()){
                    String s=String.valueOf(c);
                    key(line,s,1,false,19,()->type(s),null);
                }
            }
        }
        LinearLayout bottom=row(52);
        key(bottom,symbols?"ABC":"!#1",1.15f,true,15,()->{symbols=!symbols;shift=false;draw();},null);
        key(bottom,"😀",.9f,true,21,()->{emoji=true;draw();},null);
        key(bottom,",",.55f,false,19,()->type(","),null);
        key(bottom,"Français (CA)",4.1f,false,14,this::space,null);
        key(bottom,".",.55f,false,19,()->type("."),null);
        key(bottom,"↵",1.25f,true,23,this::enter,null);
    }
    private void showSettings(){
        Intent i=new Intent(this,SettingsActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(i);
    }
    private void letter(String s){type(s);if(shift){shift=false;draw();}}
    private void type(String s){
        InputConnection ic=getCurrentInputConnection();
        if(ic==null)return;
        ic.commitText(s,1);
        last=null;lastWithSpace=null;refresh();
    }
    private void space(){
        InputConnection ic=getCurrentInputConnection();
        if(ic==null)return;
        last=null;lastWithSpace=null;
        SpaceProcessor.Result result=SpaceProcessor.insertSpace(this,ic,sensitive);
        if(result.correction!=null){
            last=result.correction;
            lastWithSpace=result.correction.replacement+" ";
        }
        refresh();
    }
    private void backspace(){
        InputConnection ic=getCurrentInputConnection();
        if(ic==null)return;
        CharSequence selected=ic.getSelectedText(0);
        if(selected!=null&&selected.length()>0)ic.commitText("",1);
        else ic.deleteSurroundingText(1,0);
        last=null;lastWithSpace=null;refresh();
    }
    private void undo(){
        InputConnection ic=getCurrentInputConnection();
        if(ic==null||last==null||lastWithSpace==null)return;
        CharSequence existing=ic.getTextBeforeCursor(lastWithSpace.length(),0);
        if(existing!=null&&existing.toString().equals(lastWithSpace)){
            ic.beginBatchEdit();
            ic.deleteSurroundingText(lastWithSpace.length(),0);
            ic.commitText(last.original+" ",1);
            ic.endBatchEdit();
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
        if(sensitive){status.setText("Saisie privée");status.setOnClickListener(null);}
        else if(last!=null){
            status.setText("↶ Annuler : "+last.replacement);
            status.setOnClickListener(v->undo());
        }else{
            int state=StyleLearner.state(this);
            if(state==StyleLearner.SAMPLING)
                status.setText("Apprentissage : "+StyleLearner.remainingHours(this)+" h");
            else if(state==StyleLearner.READY&&StyleLearner.enabled(this))
                status.setText("Profil personnel ✓");
            else status.setText("Correcteur Perso · Français (CA)");
            status.setOnClickListener(null);
        }
    }
    private void enter(){
        InputConnection ic=getCurrentInputConnection();
        if(ic==null)return;
        EditorInfo info=getCurrentInputEditorInfo();
        int action=info==null?EditorInfo.IME_ACTION_NONE:info.imeOptions&EditorInfo.IME_MASK_ACTION;
        if(action==EditorInfo.IME_ACTION_DONE||action==EditorInfo.IME_ACTION_GO||
           action==EditorInfo.IME_ACTION_SEARCH||action==EditorInfo.IME_ACTION_SEND||
           action==EditorInfo.IME_ACTION_NEXT)ic.performEditorAction(action);
        else{ic.commitText("\n",1);shift=true;draw();}
    }
}
