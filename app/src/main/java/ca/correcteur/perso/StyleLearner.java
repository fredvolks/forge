package ca.correcteur.perso;

import android.content.Context;
import android.content.SharedPreferences;
import android.text.TextUtils;
import org.json.JSONObject;
import org.json.JSONArray;
import java.util.*;
import java.util.regex.*;

/** Local opt-in one-day style sample; only word frequencies, never messages. */
public final class StyleLearner {
    static final int OFF=0, SAMPLING=1, READY=2;
    private static final String STATE="style_state", START="style_start", COUNTS="style_counts",
        PROFILE="style_profile", ENABLED="style_enabled", TOTAL="style_total";
    private static final long DAY=24L*60*60*1000;
    private static final Pattern WORD=Pattern.compile("(?iu)^([\\p{L}][\\p{L}']{1,17})$");
    private static final Locale FR=Locale.CANADA_FRENCH;
    private StyleLearner(){}
    private static SharedPreferences prefs(Context c){
        return c.getSharedPreferences(SettingsActivity.PREFS, Context.MODE_PRIVATE);
    }
    static void start(Context c){
        prefs(c).edit().putInt(STATE,SAMPLING).putLong(START,System.currentTimeMillis())
            .putString(COUNTS,"{}").putString(PROFILE,"[]").putBoolean(ENABLED,false)
            .putInt(TOTAL,0).apply();
    }
    static void erase(Context c){
        prefs(c).edit().remove(STATE).remove(START).remove(COUNTS).remove(PROFILE)
            .remove(ENABLED).remove(TOTAL).apply();
    }
    static int state(Context c){finishIfDue(c);return prefs(c).getInt(STATE,OFF);}
    static long remainingHours(Context c){
        if(state(c)!=SAMPLING)return 0;
        long until=prefs(c).getLong(START,0)+DAY-System.currentTimeMillis();
        return Math.max(0,(until+3599999)/3600000);
    }
    static int sampled(Context c){return prefs(c).getInt(TOTAL,0);}
    static boolean enabled(Context c){return state(c)==READY&&prefs(c).getBoolean(ENABLED,true);}
    static void enable(Context c, boolean on){prefs(c).edit().putBoolean(ENABLED,on).apply();}
    private static Map<String,Integer> counts(String json){
        HashMap<String,Integer> map=new HashMap<>();
        try{
            JSONObject obj=new JSONObject(json);
            Iterator<String> iter=obj.keys();
            while(iter.hasNext()){
                String key=iter.next();
                if(WORD.matcher(key).matches())map.put(key,Math.max(0,obj.optInt(key)));
            }
        }catch(Exception ignored){}
        return map;
    }
    static void observe(Context c, String before){
        if(state(c)!=SAMPLING||before==null||before.isEmpty())return;
        int split=Math.max(before.lastIndexOf(' '),Math.max(before.lastIndexOf('\n'),before.lastIndexOf('\t')));
        String token=before.substring(split+1);
        // Avoid e-mail, URL and identifier fragments. No text from sensitive fields.
        if(token.contains("@")||token.contains(".")||token.contains("/")||
            token.contains(":")||token.contains("#")||token.contains("_"))return;
        token=token.toLowerCase(FR);
        if(!WORD.matcher(token).matches())return;
        SharedPreferences p=prefs(c);
        Map<String,Integer> map=counts(p.getString(COUNTS,"{}"));
        if(map.size()>=250&&!map.containsKey(token))return;
        map.put(token,Math.min(10000,map.getOrDefault(token,0)+1));
        JSONObject json=new JSONObject();
        for(Map.Entry<String,Integer> entry:map.entrySet()){
            try{json.put(entry.getKey(),entry.getValue());}catch(Exception ignored){}
        }
        p.edit().putString(COUNTS,json.toString())
            .putInt(TOTAL,Math.min(100000,p.getInt(TOTAL,0)+1)).apply();
    }
    static void finishIfDue(Context c){
        SharedPreferences p=prefs(c);
        if(p.getInt(STATE,OFF)!=SAMPLING)return;
        long start=p.getLong(START,0);
        if(start==0||System.currentTimeMillis()-start<DAY)return;
        Map<String,Integer> map=counts(p.getString(COUNTS,"{}"));
        ArrayList<String> chosen=new ArrayList<>();
        for(Map.Entry<String,Integer> entry:map.entrySet())
            if(entry.getValue()>=3&&!CorrectionEngine.isKnownCorrection(entry.getKey()))
                chosen.add(entry.getKey());
        chosen.sort((a,b)->{
            int diff=Integer.compare(map.get(b),map.get(a));
            return diff!=0?diff:a.compareTo(b);
        });
        JSONArray list=new JSONArray();
        for(int i=0;i<Math.min(80,chosen.size());i++)list.put(chosen.get(i));
        p.edit().putInt(STATE,READY).putString(PROFILE,list.toString())
            .remove(COUNTS).putBoolean(ENABLED,true).apply();
    }
    static Set<String> protectedWords(Context c){
        HashSet<String> out=new HashSet<>();
        if(!enabled(c))return out;
        try{
            JSONArray a=new JSONArray(prefs(c).getString(PROFILE,"[]"));
            for(int i=0;i<a.length();i++){
                String w=a.optString(i,"");
                if(WORD.matcher(w).matches())out.add(w);
            }
        }catch(Exception ignored){}
        return out;
    }
    static String profilePreview(Context c){
        ArrayList<String> p=new ArrayList<>(protectedWords(c));
        Collections.sort(p);
        return p.isEmpty()?"Aucun mot supplémentaire à protéger.":TextUtils.join(", ",p);
    }
}
