#!/bin/bash

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB_ICONS="${PROJECT_ROOT}/../public/icons"
MINIAPP_ICONS="${PROJECT_ROOT}/src/assets/icons"
TAB_ICONS="${PROJECT_ROOT}/src/assets/tab-icons"

mkdir -p "$MINIAPP_ICONS" "$TAB_ICONS"

if [ ! -d "$WEB_ICONS" ]; then
  echo "Error: Web icons directory not found at $WEB_ICONS"
  exit 1
fi

echo "Copying all icons from public/icons/ to miniapp/src/assets/icons/..."
cp "$WEB_ICONS"/*.png "$MINIAPP_ICONS/"
echo "Copied $(ls "$MINIAPP_ICONS"/*.png | wc -l) icons."

echo "Creating TabBar icon pairs..."

cp "$WEB_ICONS/book.png"      "$TAB_ICONS/learn.png"
cp "$WEB_ICONS/book.png"      "$TAB_ICONS/learn-active.png"

cp "$WEB_ICONS/swords.png"    "$TAB_ICONS/exam.png"
cp "$WEB_ICONS/swords.png"    "$TAB_ICONS/exam-active.png"

cp "$WEB_ICONS/x-circle.png"  "$TAB_ICONS/mistakes.png"
cp "$WEB_ICONS/x-circle.png"  "$TAB_ICONS/mistakes-active.png"

cp "$WEB_ICONS/user.png"      "$TAB_ICONS/profile.png"
cp "$WEB_ICONS/user.png"      "$TAB_ICONS/profile-active.png"

echo "TabBar icons created:"
ls -1 "$TAB_ICONS"

echo "Done! Icons prepared for the WeChat mini program."
