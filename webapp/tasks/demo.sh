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

# I `npm run dev` gjør src/lib/demo-chaos.ts DELETE treg, og lar omtrent hver
# tredje feile med 500. Her vil vi se API-et, ikke kaoset, så alle curl-kall i
# skriptet sender headeren som skrur det av. Kommandoene som vises, er uendret.
curl() { command curl -H "x-demo-chaos: off" "$@"; }

# Cookie-filene curl logger inn med (steg 2). `-c` lagrer cookien serveren
# setter, `-b` sender den med. Ligger i /tmp, og slettes når skriptet er ferdig.
ADMIN=/tmp/demo-admin.txt
BRUKER=/tmp/demo-bruker.txt
trap 'rm -f "$ADMIN" "$BRUKER"' EXIT

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
echo "== 2. Logg inn: serveren setter en cookie =="
step "curl -s $BASE/api/me"
# -i viser headerne. Se etter Set-Cookie og Location i svaret.
step "curl -i -c $ADMIN -d 'user=kari&admin=on' $BASE/login"
step "curl -s -b $ADMIN $BASE/api/me"
step "curl -s -o /dev/null -c $BRUKER -d 'user=ola' $BASE/login"
step "curl -s -b $BRUKER $BASE/api/me"

echo
echo "== 2b. Uten gyldig cookie slipper du ikke inn =="
# Riktig form, men uten signatur. Serveren stoler ikke på den.
step "curl -s $BASE/api/me -H 'Cookie: session=kari:admin'"
step "curl -i $BASE/profile"

echo
echo "== 3. Lesing er åpen =="
step "curl -s $BASE/api/tasks"
step "curl -s '$BASE/api/tasks?completed=false&limit=1'"
step "curl -s '$BASE/api/tasks?q=lese'"
step "curl -i '$BASE/api/tasks?limit=tull'"

# Plukker ut id-en til første oppgave, så resten av demoen har noe å jobbe med.
ID=$(curl -s "$BASE/api/tasks" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Bruker ID=$ID i resten av demoen."

step "curl -s $BASE/api/tasks/$ID"
step "curl -i $BASE/api/tasks/finnesikke"

echo
echo "== 4. Relations: én bruker med oppgavene sine =="
step "curl -s $BASE/api/users/1/tasks"
step "curl -s $BASE/api/users/me/tasks -b $ADMIN"
step "curl -i $BASE/api/users/me/tasks"
step "curl -i $BASE/api/users/999/tasks"

echo
echo "== 5. Skriving krever innlogging =="
step "curl -i -X POST $BASE/api/tasks -H 'content-type: application/json' -d '{\"title\":\"Skrive obligen\"}'"
step "curl -i -X POST $BASE/api/tasks -H 'content-type: application/json' -b $ADMIN -d '{\"title\":\"Skrive obligen\"}'"

echo
echo "== 6. Validering =="
step "curl -i -X POST $BASE/api/tasks -H 'content-type: application/json' -b $ADMIN -d '{\"title\":\"\"}'"
step "curl -i -X POST $BASE/api/tasks -H 'content-type: application/json' -b $ADMIN -d 'ikke json'"

echo
echo "== 7. Endring og handlinger =="
step "curl -i -X PUT $BASE/api/tasks/$ID -H 'content-type: application/json' -b $ADMIN -d '{\"title\":\"Nytt navn\"}'"
step "curl -i -X PUT $BASE/api/tasks/$ID -H 'content-type: application/json' -b $ADMIN -d '{}'"
step "curl -i -X PUT $BASE/api/tasks/$ID -H 'content-type: application/json' -b $ADMIN -d '{\"dueDate\":null}'"
step "curl -i -X POST $BASE/api/tasks/$ID/complete -b $ADMIN"
step "curl -i -X POST $BASE/api/tasks/$ID/tulle -b $ADMIN"
step "curl -i $BASE/api/tasks/$ID/complete"

echo
echo "== 8. Sletting krever admin =="
step "curl -i -X DELETE $BASE/api/tasks/$ID"
step "curl -i -X DELETE $BASE/api/tasks/$ID -b $BRUKER"
step "curl -i -X DELETE $BASE/api/tasks/$ID -b $ADMIN"
step "curl -i -X DELETE $BASE/api/tasks/$ID -b $ADMIN"

echo
echo "Ferdig. Kjør 'npm run seed' for å nullstille databasen."
