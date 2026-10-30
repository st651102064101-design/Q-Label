'use strict';
// Correct the withdrawn v0.515 measurement, including stale renderer saves.
function correctMedia(media, printer) {
  if (printer !== 'Zebra ZT411 (600 dpi)' || !media) return media;
  if (Number(media.width_mm) === 25 && Number(media.height_mm) === 51.5 && Number(media.pitch_width_mm) === 27.5 && Number(media.pitch_height_mm) === 53) media={...media,width_mm:72,pitch_width_mm:74.5,fit:'fill'};
  return media;
}
function correctSettings(settings) {
  if (!settings.printerMedia) return settings;
  return {...settings, printerMedia:Object.fromEntries(Object.entries(settings.printerMedia).map(([printer,media])=>[printer,correctMedia(media,printer)]))};
}
module.exports={correctMedia,correctSettings};
