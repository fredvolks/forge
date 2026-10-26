package ca.correcteur.perso;

import android.app.Instrumentation;
import android.content.Context;
import android.content.Intent;
import android.view.*;
import android.view.inputmethod.*;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.core.app.ActivityScenario;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.*;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class KeyboardInputTest {
    @Test public void repeatedSpacebarTapsDoNotCloseKeyboard() throws Exception {
        Instrumentation inst=InstrumentationRegistry.getInstrumentation();
        Context ctx=inst.getTargetContext();
        UiDevice device=UiDevice.getInstance(inst);
        device.executeShellCommand("ime enable ca.correcteur.perso/.PersonalKeyboardService");
        device.executeShellCommand("ime set ca.correcteur.perso/.PersonalKeyboardService");
        String selected=device.executeShellCommand("settings get secure default_input_method");
        assertTrue("Correcteur must be selected: "+selected,selected.contains("ca.correcteur.perso"));
        KeyboardDiagnostics.clear(ctx);
        ActivityScenario<KeyboardSmokeActivity> scenario=ActivityScenario.launch(KeyboardSmokeActivity.class);
        scenario.onActivity(activity->{
            android.widget.EditText edit=activity.findViewById(R.id.smoke_input);
            if(edit!=null){
                edit.requestFocus();
                edit.post(()->{
                    InputMethodManager imm=(InputMethodManager)activity.getSystemService(Context.INPUT_METHOD_SERVICE);
                    if(imm!=null)imm.showSoftInput(edit,InputMethodManager.SHOW_IMPLICIT);
                });
            }
        });
        assertTrue("Test field must be foreground",
            device.wait(Until.hasObject(By.text("Test du clavier QWERTY sombre")),15000));
        assertTrue("Spacebar should be visible",device.wait(Until.hasObject(By.desc("Touche espace")),15000));
        for(int k=0;k<12;k++){
            UiObject2 space=device.findObject(By.desc("Touche espace"));
            assertNotNull("Spacebar vanished at tap "+k,space);
            space.click();
            Thread.sleep(100);
        }
        assertTrue("Keyboard should remain open",device.hasObject(By.desc("Touche espace")));
        assertEquals("No keyboard error expected","Aucun incident enregistré.",KeyboardDiagnostics.lastError(ctx));
    }

    @Test public void emojiButtonCanOpenAndReturnToLetters() throws Exception {
        Instrumentation inst=InstrumentationRegistry.getInstrumentation();
        Context ctx=inst.getTargetContext();
        UiDevice device=UiDevice.getInstance(inst);
        device.executeShellCommand("ime enable ca.correcteur.perso/.PersonalKeyboardService");
        device.executeShellCommand("ime set ca.correcteur.perso/.PersonalKeyboardService");
        String selected=device.executeShellCommand("settings get secure default_input_method");
        assertTrue("Correcteur must be selected: "+selected,selected.contains("ca.correcteur.perso"));
        KeyboardDiagnostics.clear(ctx);
        ActivityScenario<KeyboardSmokeActivity> scenario=ActivityScenario.launch(KeyboardSmokeActivity.class);
        scenario.onActivity(activity->{
            android.widget.EditText edit=activity.findViewById(R.id.smoke_input);
            if(edit!=null){
                edit.requestFocus();
                edit.post(()->{
                    InputMethodManager imm=(InputMethodManager)activity.getSystemService(Context.INPUT_METHOD_SERVICE);
                    if(imm!=null)imm.showSoftInput(edit,InputMethodManager.SHOW_IMPLICIT);
                });
            }
        });
        assertTrue("Test field must be foreground",
            device.wait(Until.hasObject(By.text("Test du clavier QWERTY sombre")),15000));
        assertTrue(device.wait(Until.hasObject(By.desc("Touche 😀")),15000));
        device.findObject(By.desc("Touche 😀")).click();
        assertTrue("Emoji UI should open",device.wait(Until.hasObject(By.desc("Touche ABC")),10000));
        device.findObject(By.desc("Touche ABC")).click();
        assertTrue("QWERTY layout should return",device.wait(Until.hasObject(By.desc("Touche espace")),10000));
    }
}
