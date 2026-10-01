#!/usr/bin/env python3
"""Make the claude.ai artifact version of the game from index.html.

index.html (what GitHub Pages serves) is the source of truth. This writes:
  dist/index.html        a copy of index.html
  dist/shatterline.html  the same game without the page wrapper (no doctype/html/head/body),
                         which is the format the Claude Artifact tool publishes
Run from the repo root:  python3 tools/export_artifact.py
"""
import shutil, sys
src = open('index.html', encoding='utf-8').read()
lines = src.split('\n')
if '</head><body>' not in lines:
    sys.exit('index.html: expected a line that is exactly </head><body>')
body = lines[1:]                     # line 1 is the standalone page head (doctype, meta tags, icon)
body.remove('</head><body>')
out = '\n'.join(body)
end = out.rfind('</script>')
open('dist/shatterline.html', 'w', encoding='utf-8').write(out[:end + len('</script>')] + '\n')
shutil.copyfile('index.html', 'dist/index.html')
print('wrote dist/shatterline.html and dist/index.html')
