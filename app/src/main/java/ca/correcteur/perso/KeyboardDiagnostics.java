package ca.correcteur.perso;

import android.content.Context;
import android.content.SharedPreferences;

/** Diagnostics intentionally contain no keystrokes, typed text, field names or app IDs. */
public final class KeyboardDiagnostics {
    private KeyboardDiagnostics(){}
    static void record(Context ctx,String phase,Throwable error){
        if(ctx==null)return;
        try {
            String category=error.getClass().getSimpleName();
            if(category.length()>42)category=category.substring(0,42);
            ctx.getSharedPreferences(SettingsActivity.PREFS,Context.MODE_PRIVATE)
                .edit().putString("last_keyboard_error",phase+" : "+category)
                .putLong("last_keyboard_error_at",System.currentTimeMillis())
                .apply();
        } catch(RuntimeException ignored){}
    }
    static String lastError(Context ctx){
        try {
            SharedPreferences p=ctx.getSharedPreferences(SettingsActivity.PREFS,Context.MODE_PRIVATE);
            String detail=p.getString("last_keyboard_error",null);
            return detail==null?"Aucun incident enregistré.":"Dernier incident : "+detail;
        }catch(RuntimeException ex){return "Diagnostic indisponible.";}
    }
    static void clear(Context ctx){
        ctx.getSharedPreferences(SettingsActivity.PREFS,Context.MODE_PRIVATE).edit()
            .remove("last_keyboard_error").remove("last_keyboard_error_at").apply();
    }
}
