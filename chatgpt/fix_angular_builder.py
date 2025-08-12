#!/usr/bin/env python3
# fix_angular_builder.py
# Ensures the Angular web app has the builder + CLI so "build-angular:browser" works.

import json
from pathlib import Path

root = Path("ticketing-app") / "web"
pkg_path = root / "package.json"
lock_path = root / "package-lock.json"

if not pkg_path.exists():
    raise SystemExit(f"Can't find {pkg_path}. Run this from the folder that contains 'ticketing-app/'.")

pkg = json.loads(pkg_path.read_text(encoding="utf-8"))

deps = pkg.setdefault("dependencies", {})
dev = pkg.setdefault("devDependencies", {})

# Ensure core Angular deps (won't downgrade if you already have newer)
defaults_deps = {
    "@angular/animations": "^17.3.0",
    "@angular/common": "^17.3.0",
    "@angular/compiler": "^17.3.0",
    "@angular/core": "^17.3.0",
    "@angular/forms": "^17.3.0",
    "@angular/platform-browser": "^17.3.0",
    "@angular/platform-browser-dynamic": "^17.3.0",
    "@angular/router": "^17.3.0",
    "@angular/material": "^17.3.0",
    "@angular/cdk": "^17.3.0",
    "rxjs": "^7.8.1",
    "tslib": "^2.6.2",
    "zone.js": "^0.14.4"
}
for k, v in defaults_deps.items():
    deps.setdefault(k, v)

# Ensure builder + CLI in devDependencies
dev.setdefault("@angular-devkit/build-angular", "^17.3.0")
dev.setdefault("@angular/cli", "^17.3.0")
dev.setdefault("@angular/compiler-cli", "^17.3.0")
dev.setdefault("typescript", "^5.4.5")

pkg_path.write_text(json.dumps(pkg, indent=2) + "\n", encoding="utf-8")
print(f"✔ Patched {pkg_path}")

# Create a minimal lockfile so Docker 'npm ci' doesn't complain if you don't have one locally
if not lock_path.exists():
    lock = {"name": pkg.get("name", "web"), "lockfileVersion": 3, "requires": True, "packages": {}}
    lock_path.write_text(json.dumps(lock, indent=2) + "\n", encoding="utf-8")
    print(f"✔ Created placeholder {lock_path}")
else:
    print(f"• Lockfile exists: {lock_path}")

print("\nNext steps:")
print("  docker compose build --no-cache web")
print("  docker compose up")
