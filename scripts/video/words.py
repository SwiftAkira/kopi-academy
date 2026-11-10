"""Print a chapter transcript with timestamps, without the voice-direction tags.
Usage (inside a work directory): python3 ../_engine/words.py [chapter ...]"""
import glob, json, sys
chapters = [int(a) for a in sys.argv[1:]] or sorted(int(f.split('/s')[-1][:-5]) for f in glob.glob('words/s*.json'))
for i in chapters:
    out, intag = [], False
    for w in json.load(open(f'words/s{i}.json'))['words']:
        if w.get('type', 'word') != 'word': continue
        tx = w['text']
        if tx.startswith('[') or intag:
            intag = not tx.rstrip().endswith(']'); continue
        out.append((tx, w['start']))
    print(f'--- ch{i} ({len(out)} words) ---', end='')
    for k, (tx, st) in enumerate(out):
        if k % 10 == 0: print(f'\n[{st:5.1f}] ', end='')
        print(tx, end=' ')
    print()
