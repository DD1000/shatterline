# Historical: the cloud workspace used this to turn the artifact-format file into the standalone index.html. Not needed now that index.html is edited directly.
import sys
art, out = sys.argv[1], sys.argv[2]
head = open('/home/claude/live/gh_index.html', encoding='utf-8').read().split('\n')[0]
L = open(art, encoding='utf-8').read().split('\n')
assert L[0].startswith('<!doctype html><html><head><meta charset=utf8>'), L[0][:60]
i = L.index('</style>')
res = [head] + L[1:i+1] + ['</head><body>'] + L[i+1:]
open(out, 'w', encoding='utf-8').write('\n'.join(res))
print('standalone', out, len('\n'.join(res)))
