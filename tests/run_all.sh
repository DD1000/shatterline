#!/bin/bash
# Runs every test against the root index.html. Screenshots go to shots/ (ignored by git).
# Usage (from anywhere):  bash tests/run_all.sh          add --slow to also run labrun.js (plays two full labs)
cd "$(dirname "$0")/.."
mkdir -p shots
fail=0
for t in tests/*.js; do
  b=$(basename "$t" .js)
  if [ "$b" = labrun ] && [ "$1" != --slow ]; then continue; fi
  out=$(node "$t" shots 2>&1); code=$?
  bad=$(echo "$out" | grep -iE 'PAGEERROR|FAIL|Error' | grep -v '^no errors$' | head -3)
  if [ $code -ne 0 ] || [ -n "$bad" ]; then echo "FAIL $b"; echo "$bad" | sed 's/^/    /'; fail=1; else echo "ok   $b"; fi
done
exit $fail
