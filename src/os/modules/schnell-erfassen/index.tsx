import { defineModul } from '@core/modul';
import { SchnellErfassen } from './Schnell';

export default defineModul({
  id: 'schnell-erfassen',
  titel: 'Schnell erfassen',
  bereich: 'heute',
  beschreibung: 'Fotos, Sprache, Zeiten, Material oder Notizen in wenigen Sekunden erfassen.',
  icon: 'kamera',
  gewicht: 80,
  navigation: 'versteckt',
  global: SchnellErfassen,
});
