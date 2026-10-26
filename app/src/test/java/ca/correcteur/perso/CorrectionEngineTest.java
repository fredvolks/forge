package ca.correcteur.perso;

import org.junit.Test;
import static org.junit.Assert.*;
import java.util.Collections;
import java.util.Set;

public class CorrectionEngineTest {
    private CorrectionEngine.Suggestion correct(String input){
        return CorrectionEngine.suggest(input,CorrectionEngine.protectedWords(null),Collections.emptySet());
    }
    @Test public void correctsAccentsAndApostrophes(){
        assertEquals("j'ai",correct("jai").replacement);
        assertEquals("c'est",correct("cest").replacement);
        assertEquals("clé",correct("cle").replacement);
        assertTrue(CorrectionEngine.protectedWords("québécois").contains("québécois"));
    }
    @Test public void protectsQuebecVocabularyAndContext(){
        assertNull(correct("pis"));
        assertNull(correct("fak"));
        assertNull(correct("ses amis"));
        assertNull(correct("ces belles choses"));
    }
    @Test public void hasSimpleHomophoneContext(){
        assertEquals("c'est où",correct("cest ou").replacement);
        assertEquals("c'est pas",correct("ses pas").replacement);
    }
    @Test public void conservesExplicitExceptions(){
        Set<String> protectedWords=CorrectionEngine.protectedWords("jai");
        assertNull(CorrectionEngine.suggest("jai",protectedWords,Collections.emptySet()));
        assertNull(CorrectionEngine.suggest("jai",Collections.emptySet(),Collections.singleton("jai")));
    }
    @Test public void emptyOrUnexpectedInputDoesNotThrow(){
        for(String s:new String[]{""," ","🤣","a","bonjour","école","id123"})
            assertNull(correct(s));
    }
    @Test public void fixesVerbAfterAlreadyCorrectedApostrophe(){
        assertEquals("oublié",correct("j'ai oublier").replacement);
    }
}
