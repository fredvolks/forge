package ca.kartsetuppro

import android.os.Bundle
import android.os.SystemClock
import android.os.VibrationEffect
import android.os.Vibrator
import android.content.Context
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import java.util.Locale

private fun clock(): Long = SystemClock.elapsedRealtimeNanos()
private fun fmt(ns:Long):String {
 val ms=(ns.coerceAtLeast(0L)+500000L)/1000000L
 return String.format(Locale.CANADA,"%02d:%02d.%03d",ms/60000L,ms/1000L%60L,ms%1000L)
}
private data class Stopwatch(
 val start:Long=0, val last:Long=0, val running:Boolean=false,
 val stopped:Boolean=false, val frozen:Long=0,
 val laps:List<Long> = emptyList(), val warned:Boolean=false, val lead:Int=3
)
class MainActivity:ComponentActivity() {
 override fun onCreate(savedInstanceState:Bundle?) {
  super.onCreate(savedInstanceState)
  window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  setContent { KartApp(this) }
 }
}
@Composable
private fun KartApp(activity:MainActivity) {
 val prefs=remember { activity.getSharedPreferences("kart_prefs",Context.MODE_PRIVATE) }
 val names=remember { mutableStateListOf(*Array(4){i->prefs.getString("pilot_$i",listOf("Jacob #27","Lucas #17","Pilote 3","Pilote 4")[i]) ?: ""}) }
 val slots=remember { mutableStateListOf(*Array(4){Stopwatch()}) }
 val order=remember { mutableStateListOf(0,1,2,3) }
 var tab by remember { mutableStateOf("chrono") }
 var time by remember { mutableLongStateOf(clock()) }
 var track by remember { mutableStateOf(prefs.getString("track","Mirabel") ?: "Mirabel") }
 var sprocket by remember { mutableStateOf(prefs.getString("sprocket","12") ?: "12") }
 var crown by remember { mutableStateOf(prefs.getString("crown","76") ?: "76") }
 var condition by remember { mutableStateOf("Sec") }
 val circuits=listOf("Québec","Mirabel","SH","Tremblant sens 1","Tremblant sens inverse","SC Performance","Trois-Rivières","Château-Richer")
 fun save(key:String,v:String) { prefs.edit().putString(key,v).apply() }
 fun mark(i:Int) {
  order.remove(i)
  order.add(0,i)
 }
 fun vibrate() {
  val device=activity.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
  if(device.hasVibrator()) device.vibrate(VibrationEffect.createOneShot(160,VibrationEffect.DEFAULT_AMPLITUDE))
 }
 LaunchedEffect(Unit) {
  while(true) {
   val now=clock();time=now
   for(i in 0..3) {
    val s=slots[i]
    val reference=s.laps.lastOrNull() ?: continue
    if(s.running&&!s.warned&&reference> s.lead*1_000_000_000L&&now-s.last >=reference-s.lead*1_000_000_000L) {
     slots[i]=s.copy(warned=true)
     vibrate()
    }
   }
   delay(33)
  }
 }
 val colors=darkColorScheme(primary=Color(0xFFF14E50),background=Color(0xFF10141C),surface=Color(0xFF202938))
 MaterialTheme(colorScheme=colors) {
  Scaffold(bottomBar={
   NavigationBar {
    listOf("chrono" to "CHRONO","circuits" to "CIRCUITS","carbu" to "CARBU","pneus" to "PNEUS").forEach { (key,title) ->
     NavigationBarItem(selected=tab==key,onClick={tab=key},icon={Text("●")},label={Text(title)})
    }
   }
  }) { padding ->
   Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(12.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
    Text("🏁 KART SETUP PRO",style=MaterialTheme.typography.headlineSmall)
    Text("Birel ART S8 • Rotax MAX Senior EVO",color=Color.LightGray)
    when(tab) {
     "chrono" -> {
      Button(onClick={
       val now=clock()
       for(i in 0..3) if(!slots[i].running&&!slots[i].stopped) slots[i]=slots[i].copy(start=now,last=now,running=true)
      },modifier=Modifier.fillMaxWidth()) {Text("DÉMARRER LES 4 CHRONOS")}
      order.toList().forEach { i ->
       val s=slots[i]
       Card {
        Column(Modifier.fillMaxWidth().padding(10.dp),verticalArrangement=Arrangement.spacedBy(5.dp)) {
         OutlinedTextField(names[i],{names[i]=it;save("pilot_$i",it)},singleLine=true,label={Text("Pilote #${i+1}")},modifier=Modifier.fillMaxWidth())
         TextButton(onClick={mark(i)}){Text("PASSAGE • ${order.indexOf(i)+1} — ${names[i]}")}
         val elapsed=if(s.running) time-s.last else if(s.stopped) s.frozen else 0L
         Text(fmt(elapsed),style=MaterialTheme.typography.headlineMedium)
         Text("Dernier : ${s.laps.lastOrNull()?.let(::fmt) ?: "—"}     Meilleur : ${s.laps.minOrNull()?.let(::fmt) ?: "—"}")
         Row(horizontalArrangement=Arrangement.spacedBy(8.dp)) {
          Button(onClick={
           val now=clock()
           if(!s.running&&!s.stopped) slots[i]=s.copy(start=now,last=now,running=true)
           else if(s.running) {
            val lap=now-s.last
            if(lap>2_000_000_000L) {slots[i]=s.copy(last=now,laps=s.laps+lap,warned=false);mark(i)}
           }
          },modifier=Modifier.weight(1f)) {Text(if(!s.running&&!s.stopped)"START" else "LAP")}
          OutlinedButton(onClick={
           if(s.running)slots[i]=s.copy(running=false,stopped=true,frozen=clock()-s.last)
           else slots[i]=Stopwatch(lead=s.lead)
          }){Text(if(s.stopped)"RESET" else "STOP")}
         }
         Row {
          Text("Vibration : ${s.lead} s avant",modifier=Modifier.weight(1f))
          TextButton(onClick={slots[i]=s.copy(lead=(s.lead-1).coerceAtLeast(1))}){Text("−")}
          TextButton(onClick={slots[i]=s.copy(lead=(s.lead+1).coerceAtMost(15))}){Text("+")}
         }
        }
       }
      }
      Text("Millièmes affichés. Les vibrations nécessitent que l'application reste ouverte.")
     }
     "circuits" -> {
      Text("Circuits et Rain Gear Advisor",style=MaterialTheme.typography.titleLarge)
      circuits.forEach { c -> FilterChip(selected=track==c,onClick={track=c;save("track",c)},label={Text(c)}) }
      OutlinedTextField(sprocket,{sprocket=it;save("sprocket",it)},label={Text("Pignon moteur")})
      OutlinedTextField(crown,{crown=it;save("crown",it)},label={Text("Couronne sèche")})
      listOf("Sec","Humide","Pluie faible","Pluie moyenne","Pluie abondante").forEach { c ->
       FilterChip(selected=condition==c,onClick={condition=c},label={Text(c)})
      }
      val bumps=mapOf("Sec" to (0..0),"Humide" to (0..1),"Pluie faible" to (1..2),"Pluie moyenne" to (2..4),"Pluie abondante" to (3..6))
      val r=crown.toIntOrNull()
      if(r!=null) {val range=bumps.getValue(condition);Text("Gear sec : $sprocket/$r");Text("Plage d'essai : $sprocket/${r+range.first} à $sprocket/${r+range.last}")}
      Text("Suggestion indicative à valider selon RPM, motricité et état réel de la piste.")
     }
     "carbu" -> {
      Text("Dell'Orto VHSB 34 XS EVO",style=MaterialTheme.typography.titleLarge)
      listOf("Main jet","Needle pin","Position clip","Air screw (tours)","Flotte gauche (mm)","Flotte droite (mm)").forEach { label ->
       var value by remember(label) {mutableStateOf(prefs.getString(label,"") ?: "")}
       OutlinedTextField(value,{value=it;save(label,it)},label={Text(label)},modifier=Modifier.fillMaxWidth())
      }
      Text("Hauteur de flotte : carbu inversé, cuve retirée, plan de joint à patte en laiton. Vérifier conformité Rotax.")
     }
     "pneus" -> {
      Text("Mojo D5 • Pressions PSI",style=MaterialTheme.typography.titleLarge)
      listOf("Avant gauche","Avant droit","Arrière gauche","Arrière droit").forEach { tire ->
       Card {
        Column(Modifier.padding(10.dp)) {
         Text(tire)
         listOf("Froid PSI","Chaud PSI","IR °C").forEach{kind->
          val k="$tire $kind"
          var v by remember(k) {mutableStateOf(prefs.getString(k,"") ?: "")}
          OutlinedTextField(v,{v=it;save(k,it)},label={Text(kind)})
         }
        }
       }
      }
      Text("Import Bluetooth UniPro V2 et MyChron 5 Wi-Fi : non intégré à cette version.")
     }
    }
   }
  }
 }
}
