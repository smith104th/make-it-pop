// What Daphi says. "Ahre" = just kidding / lol. "¿Ubicás?" = you know? / get it?
export const LINES = {
  idle: [
    'One more round and I go back to work. Ahre.',
    "I'm on a call. Ahre, no.",
    'This is research, ¿ubicás?',
    'Merging is basically branding. ¿Ubicás?',
    'Client call at 4. Plenty of time. Ahre.',
    'Mate first, then briefs. ¿Ubicás?',
    'Five minutes. Ahre.',
  ],
  start: ['Hi. I play these between calls. Now you do too. Ahre.'],
  merge: ['Nice.', 'Divino.', 'That one.', 'Clean.', 'Ok, ok.'],
  bigMerge: ['Portfolio piece. ¿Ubicás?', "Look at that. Ahre, I'm crying.", "That's going on the site.", 'Kerned to perfection.'],
  max: ['Max level. Frame it.', 'Nothing left to merge. Perfection, ahre.'],
  deliver: [
    'Delivered. Invoice sent. Ahre.',
    'Another happy client, ¿ubicás?',
    'Launched. Next.',
    'They said "obsessed." Ahre.',
    'Paid on time? Ahre, no.',
    'Client approved round one. Suspicious.',
  ],
  sticky: [
    'New feedback just landed. ¿Ubicás lo que pide?',
    '"Make it pop." Again. Ahre.',
    'The client has notes.',
    'Circling back, apparently.',
    'Per their last email. ¿Ubicás?',
  ],
  stickyClear: ['Feedback addressed. Ahre.', 'Handled. ¿Ubicás?', 'Resolved in v2.', 'They loved it. Obviously.'],
  ahre: ['AHRE.', 'Ahre. Next.', 'Feedback? Ahre.'],
  noAhre: ['No ahres left. Merge next to the notes, ¿ubicás?'],
  noStickies: ['Nothing to laugh off yet. Ahre.'],
  noMate: ['Out of mate. ¿Ubicás?', 'No mate, no briefs. Ahre.'],
  full: ['The desk is full. Merge or archive, ¿ubicás?', 'No room. Ahre.'],
  locked: ['That one has client notes on it. Merge right next to it.'],
  levelUp: ["We're growing. Ahre, scary.", 'Bigger studio, bigger clients. ¿Ubicás?'],
  archive: ['Archived. It comes back as a trend in five years.', 'Into the archive. Ahre.'],
  room: ['New room. We are so back.', 'The studio grows. ¿Ubicás?'],
  note: ['Read the note literally. ¿Ubicás?', 'Clients say things. Do them. Ahre.'],
};

let last = '';
export function line(key) {
  const pool = LINES[key] || LINES.idle;
  let s = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1) while (s === last) s = pool[Math.floor(Math.random() * pool.length)];
  last = s;
  return s;
}
