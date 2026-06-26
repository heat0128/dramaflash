// Browsers' <track> element only understands WebVTT, not SRT.
// This converts an .srt file's text into valid .vtt text.
export function srtToVtt(srt: string): string {
  let body = srt.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  // SRT timestamps use a comma for milliseconds (00:00:01,000);
  // VTT uses a dot (00:00:01.000).
  body = body.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
  return 'WEBVTT\n\n' + body
}
