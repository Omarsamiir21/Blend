#!/usr/bin/env bash
set -euo pipefail

base="http://127.0.0.1:${BLEND_PORT:-8080}"
ready=$(curl -fsS --retry 12 --retry-delay 2 --retry-connrefused "$base/api/v1/system/health")
jq -e '.status == "ready" and .database == "ready"' <<< "$ready" >/dev/null
curl -fsS "$base/api/v1/system/live" | jq -e '.status == "live"' >/dev/null
page=$(curl -fsS "$base/infrastructure")
grep -q '<div id="root"></div>' <<< "$page"
asset=$(grep -oE 'src="/assets/[^"]+\.js"' <<< "$page" | cut -d '"' -f2)
test -n "$asset"
curl -fsS "$base$asset" >/dev/null
