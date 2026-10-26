package ca.correcteur.perso;
import java.util.*;
import java.util.regex.*;

public final class CorrectionEngine {
    private static final Locale FR = Locale.CANADA_FRENCH;
    private static final Pattern WORD = Pattern.compile("([\\p{L}']+)$", Pattern.UNICODE_CHARACTER_CLASS);
    private static final Pattern SES = Pattern.compile("(?iu)(?<![\\p{L}'])(ses|ces|cest|c'est)\\s+(ou|quoi|pas|moi)(?![\\p{L}'])$");
    private static final Pattern OUBLIE = Pattern.compile("(?iu)(?<![\\p{L}'])j'ai\\s+(oublier)$");
    public static final class Suggestion {
        final String original, replacement;
        Suggestion(String old, String fresh) { original=old; replacement=fresh; }
    }
    private static final Map<String,String> DICT = new HashMap<>();
    private static final Set<String> QUEBEC = new HashSet<>(Arrays.asList(
        "pis","pk","ak","fak","faque","tsé","ben","chu","jsuis","jveux",
        "jpeux","tbn","criss","esti","tabarnak","asteur","pantoute","mettons","pcq","lol","mdr"));
    static {
        String[][] pairs={
            {"jai","j'ai"},{"jais","j'ai"},{"cest","c'est"},{"jaimerais","j'aimerais"},
            {"jutilise","j'utilise"},{"jutikise","j'utilise"},{"jecris","j'écris"},
            {"jespere","j'espère"},{"jetais","j'étais"},{"quon","qu'on"},
            {"quil","qu'il"},{"quils","qu'ils"},{"dabord","d'abord"},
            {"daccord","d'accord"},{"ca","ça"},{"etre","être"},{"deja","déjà"},
            {"tres","très"},{"apres","après"},{"meme","même"},
            {"cle","clé"},{"cles","clés"},{"interet","intérêt"},
            {"horraire","horaire"},{"acceuil","accueil"},{"francais","français"},
            {"cafe","café"},{"fenetre","fenêtre"},{"telephone","téléphone"},
            {"ecran","écran"},{"reglage","réglage"},{"reglages","réglages"}};
        for(String[] pair:pairs) DICT.put(pair[0],pair[1]);
    }
    private CorrectionEngine() {}
    private static String withCase(String old, String fresh) {
        if(old.equals(old.toUpperCase(FR)) && old.length()>1) return fresh.toUpperCase(FR);
        if(!old.isEmpty() && Character.isUpperCase(old.charAt(0)))
            return Character.toUpperCase(fresh.charAt(0))+fresh.substring(1);
        return fresh;
    }
    private static Suggestion change(String old, String fresh, Set<String> ignored) {
        if(old.equals(fresh) || (ignored!=null && ignored.contains(old.toLowerCase(FR)))) return null;
        return new Suggestion(old,fresh);
    }
    public static Set<String> protectedWords(String csv) {
        Set<String> s=new HashSet<>(QUEBEC);
        if(csv!=null) for(String token:csv.split("[,;\\n]+")) {
            String t=token.trim().toLowerCase(FR);
            if(!t.isEmpty() && t.length()<=40) s.add(t);
        }
        return s;
    }
    public static Suggestion suggest(String before, Set<String> protectedWords, Set<String> ignored) {
        if(before==null || before.isEmpty()) return null;
        Matcher m=SES.matcher(before);
        if(m.find()) {
            String old=m.group(0);
            String fresh=withCase(m.group(1),"c'est")+" "+
                    (m.group(2).equalsIgnoreCase("ou")?withCase(m.group(2),"où"):m.group(2));
            return change(old,fresh,ignored);
        }
        m=OUBLIE.matcher(before);
        if(m.find() && (protectedWords==null || !protectedWords.contains(m.group(1).toLowerCase(FR))))
            return change(m.group(1),withCase(m.group(1),"oublié"),ignored);
        m=WORD.matcher(before);
        if(!m.find()) return null;
        String old=m.group(1),lower=old.toLowerCase(FR);
        if(QUEBEC.contains(lower) || (protectedWords!=null && protectedWords.contains(lower))) return null;
        String fresh=DICT.get(lower);
        return fresh==null?null:change(old,withCase(old,fresh),ignored);
    }
}
