#!/usr/bin/env bash
# scripts/verify-phase2.sh — local Phase 2 gate. Run from the repo root.
# A production-build failure is FATAL; lint/format findings are reported as
# informational debt (they never block this script). Safe to run on mobile
# shells (Termux) or CI. Does NOT modify any files.
set -u
cd "$(dirname "$0")/.." || exit 1
[ -f package.json ] && [ -f vite.config.ts ] || { echo "Run from the clipiq-ai repo root."; exit 2; }

red=$'\033[31m'; grn=$'\033[32m'; ylw=$'\033[33m'; rst=$'\033[0m'
fail=0

echo "== [1/5] node --check api/**/*.js =="
api_ok=1
while IFS= read -r f; do
  node --check "$f" 2>/tmp/nc.err || { echo "  FAIL $f"; cat /tmp/nc.err; api_ok=0; fail=1; }
done < <(find api -name '*.js' -type f 2>/dev/null)
[ "$api_ok" -eq 1 ] && echo "${grn}api syntax OK${rst}" || echo "${red}api syntax FAIL${rst}"

echo "== [2/5] .env.example coverage =="
env_ok=1
for v in PORT VITE_API_URL VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY; do
  grep -qE "^${v}=" .env.example || { echo "  missing assignment: $v"; env_ok=0; fail=1; }
done
[ "$env_ok" -eq 1 ] && echo "${grn}.env.example OK${rst}" || echo "${red}.env.example FAIL${rst}"

echo "== [3/5] production build (fatal on failure) =="
if npm run build >/tmp/clipiq_build.log 2>&1; then
  echo "${grn}vite build OK${rst}"
else
  echo "${red}vite build FAIL${rst}"; tail -30 /tmp/clipiq_build.log; exit 1
fi

echo "== [4/5] eslint (informational debt) =="
if [ -f eslint.config.js ]; then
  npm run lint >/tmp/clipiq_lint.log 2>&1; lc=$?
  errs=$(grep -oE "[0-9]+ error" /tmp/clipiq_lint.log | tail -1)
  warns=$(grep -oE "[0-9]+ warning" /tmp/clipiq_lint.log | tail -1)
  echo "  eslint exit=$lc | ${errs:-0 errors} / ${warns:-0 warnings} (backlog; not fatal)"
else
  echo "${red}no eslint.config.js${rst}"; fail=1
fi

echo "== [5/5] prettier --check (informational) =="
if [ -f .prettierrc ] || [ -f .prettierrc.json ] || [ -f prettier.config.js ]; then
  if npm run format:check >/tmp/clipiq_fmt.log 2>&1; then
    echo "${grn}prettier: all formatted${rst}"
  else
    echo "${ylw}prettier: some files need formatting (run: npm run format, then commit separately)${rst}"
  fi
else
  echo "${red}no prettier config${rst}"; fail=1
fi

echo "== git status (uncommitted Phase 2 work) =="
git status --short

if [ "$fail" -eq 0 ]; then echo "${grn}VERIFY_PHASE2_PASS${rst}"; else echo "${red}VERIFY_PHASE2_FAIL${rst}"; fi
exit "$fail"
