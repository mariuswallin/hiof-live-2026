#!/usr/bin/env bash
#
# Demo av API-et i src/worker.tsx. Kjør fra prosjektmappa:
#
#   npm run dev          i ett vindu
#   npm run seed         så databasen er i kjent tilstand
#   ./demo.sh            i et annet vindu
#
# Skriver ut hver kommando før den kjøres, og venter på ENTER mellom hvert
# steg. Trykk ctrl-c for å hoppe av.
#
# Annen port:  BASE=http://localhost:5199 ./demo.sh
set -u

BASE="${BASE:-http://localhost:5173}"

# Kjører én kommando: viser den først, så resultatet.
step() {
  printf '\n\033[1;36m$ %s\033[0m\n' "$1"
  eval "$1"
  printf '\n\033[2m— ENTER for neste —\033[0m'
  read -r _
}

echo "Demo mot $BASE"

echo
echo "== 1. En åpen rute =="
step "curl -s $BASE/api/status"

echo
echo "== 2. Hvem tror serveren at jeg er? =="
step "curl -s $BASE/api/me"
step "curl -s $BASE/api/me -H 'x-demo-user: bruker'"
step "curl -s $BASE/api/me -H 'x-demo-user: admin'"

echo
echo "== 3. Lesing er åpen =="
step "curl -s $BASE/api/tasks"

# Plukker ut id-en til første oppgave, så resten av demoen har noe å jobbe med.
ID=$(curl -s "$BASE/api/tasks" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Bruker ID=$ID i resten av demoen."

step "curl -s $BASE/api/tasks/$ID"
step "curl -i $BASE/api/tasks/finnesikke"

echo
echo "== 4. Relations: én bruker med oppgavene sine =="
step "curl -s $BASE/api/users/1/tasks"
step "curl -s $BASE/api/users/me/tasks -H 'x-demo-user: admin'"
step "curl -i $BASE/api/users/me/tasks"
step "curl -i $BASE/api/users/999/tasks"

echo
echo "== 5. Skriving krever innlogging =="
step "curl -i -X POST $BASE/api/tasks -H 'content-type: application/json' -d '{\"title\":\"Skrive obligen\"}'"
step "curl -i -X POST $BASE/api/tasks -H 'content-type: application/json' -H 'x-demo-user: admin' -d '{\"title\":\"Skrive obligen\"}'"

echo
echo "== 6. Validering =="
step "curl -i -X POST $BASE/api/tasks -H 'content-type: application/json' -H 'x-demo-user: admin' -d '{\"title\":\"\"}'"
step "curl -i -X POST $BASE/api/tasks -H 'content-type: application/json' -H 'x-demo-user: admin' -d 'ikke json'"

echo
echo "== 7. Endring og handlinger =="
step "curl -i -X PUT $BASE/api/tasks/$ID -H 'content-type: application/json' -H 'x-demo-user: admin' -d '{\"title\":\"Nytt navn\"}'"
step "curl -i -X POST $BASE/api/tasks/$ID/complete -H 'x-demo-user: admin'"
step "curl -i -X POST $BASE/api/tasks/$ID/tulle -H 'x-demo-user: admin'"
step "curl -i $BASE/api/tasks/$ID/complete"

echo
echo "== 8. Sletting krever admin =="
step "curl -i -X DELETE $BASE/api/tasks/$ID"
step "curl -i -X DELETE $BASE/api/tasks/$ID -H 'x-demo-user: bruker'"
step "curl -i -X DELETE $BASE/api/tasks/$ID -H 'x-demo-user: admin'"
step "curl -i -X DELETE $BASE/api/tasks/$ID -H 'x-demo-user: admin'"

echo
echo "Ferdig. Kjør 'npm run seed' for å nullstille databasen."
