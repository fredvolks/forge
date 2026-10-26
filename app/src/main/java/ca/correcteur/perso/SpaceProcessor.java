package ca.correcteur.perso;

import android.content.Context;
import android.content.SharedPreferences;
import android.view.inputmethod.InputConnection;
import java.util.*;

/**
 * All spacebar logic is isolated and fault-contained.
 * A failure in learning, preferences or corrections must never close the keyboard.
 */
public final class SpaceProcessor {
    public static final class Result {
        public final CorrectionEngine.Suggestion correction;
        public final boolean wroteSpace;
        Result(CorrectionEngine.Suggestion correction,boolean wroteSpace){
            this.correction=correction;this.wroteSpace=wroteSpace;
        }
    }
    private SpaceProcessor(){}
    public static Result insertSpace(Context context,InputConnection connection,boolean sensitive){
        if(connection==null)return new Result(null,false);
        CorrectionEngine.Suggestion applied=null;
        boolean wroteSpace=false;
        try {
            if(!sensitive&&context!=null){
                CharSequence previous=connection.getTextBeforeCursor(240,0);
                if(previous!=null){
                    String preceding=previous.toString();
                    // Only this keyboard's own user-initiated learning mode may collect words.
                    StyleLearner.observe(context,preceding);
                    SharedPreferences p=context.getSharedPreferences(SettingsActivity.PREFS,Context.MODE_PRIVATE);
                    if(p.getBoolean(SettingsActivity.AUTO,true)){
                        Set<String> preserved=CorrectionEngine.protectedWords(p.getString(SettingsActivity.PROTECTED,""));
                        preserved.addAll(StyleLearner.protectedWords(context));
                        Set<String> ignored=p.getStringSet(SettingsActivity.IGNORED,Collections.emptySet());
                        CorrectionEngine.Suggestion candidate=CorrectionEngine.suggest(preceding,preserved,ignored);
                        if(candidate!=null){
                            boolean batch=false;
                            try{
                                batch=connection.beginBatchEdit();
                                boolean deleted=connection.deleteSurroundingText(candidate.original.length(),0);
                                boolean typed=deleted&&connection.commitText(candidate.replacement,1);
                                if(typed)applied=candidate;
                            }finally{if(batch)connection.endBatchEdit();}
                        }
                    }
                }
            }
        } catch(RuntimeException | LinkageError e){
            if(context!=null)KeyboardDiagnostics.record(context,"Espace",e);
        }
        try {
            wroteSpace=connection.commitText(" ",1);
        } catch(RuntimeException | LinkageError e){
            if(context!=null)KeyboardDiagnostics.record(context,"Écriture espace",e);
        }
        return new Result(applied,wroteSpace);
    }
}
