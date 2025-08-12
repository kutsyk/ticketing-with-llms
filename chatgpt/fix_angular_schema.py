#!/usr/bin/env python3
# fix_angular_schema.py
# Adds missing tsConfig to Angular build target and creates tsconfig.app.json.

import json
from pathlib import Path

root = Path("ticketing-app") / "web"

def load_json(p: Path):
    if not p.exists():
        raise SystemExit(f"Missing {p}. Are you running this from the folder that contains 'ticketing-app/'?")
    return json.loads(p.read_text(encoding="utf-8"))

def save_json(p: Path, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

def patch_angular_json():
    p = root / "angular.json"
    data = load_json(p)

    # locate the first project (usually "web")
    projects = data.get("projects") or {}
    if not projects:
        raise SystemExit("No projects found in web/angular.json")
    proj_name, proj = next(iter(projects.items()))
    arch = proj.setdefault("architect", {})
    build = arch.setdefault("build", {})
    # Angular 17 uses "builder": "@angular-devkit/build-angular:browser"
    build.setdefault("builder", "@angular-devkit/build-angular:browser")
    opts = build.setdefault("options", {})
    # ensure tsConfig is present
    opts.setdefault("tsConfig", "tsconfig.app.json")

    # keep sensible defaults
    opts.setdefault("outputPath", "dist/web")
    opts.setdefault("index", "src/index.html")
    opts.setdefault("main", "src/main.ts")
    opts.setdefault("assets", ["src/favicon.ico", "src/assets"])
    opts.setdefault("styles", ["src/app/styles.css"])

    # production configuration (optional but nice)
    cfgs = build.setdefault("configurations", {})
    prod = cfgs.setdefault("production", {})
    prod.setdefault("optimization", True)
    prod.setdefault("outputHashing", "all")

    save_json(p, data)
    print(f"✔ Patched {p} with tsConfig option")

def ensure_tsconfig_app():
    p = root / "tsconfig.app.json"
    if p.exists():
        print(f"• Exists {p}")
        return
    content = {
        "extends": "./tsconfig.json",
        "compilerOptions": {
            "outDir": "./out-tsc/app",
            "types": []
        },
        "files": ["src/main.ts"],
        "angularCompilerOptions": {
            # Standalone components are default in v17, no extra flags needed.
        }
    }
    save_json(p, content)
    print(f"✔ Created {p}")

def ensure_tsconfig_root():
    p = root / "tsconfig.json"
    if not p.exists():
        # minimal root tsconfig if missing
        content = {
            "compilerOptions": {
                "target": "ES2022",
                "module": "ES2022",
                "moduleResolution": "node",
                "useDefineForClassFields": False,
                "emitDecoratorMetadata": True,
                "experimentalDecorators": True,
                "skipLibCheck": True,
                "lib": ["ES2022", "dom"],
                "types": []
            }
        }
        save_json(p, content)
        print(f"✔ Created {p}")
        return

    data = load_json(p)
    co = data.setdefault("compilerOptions", {})
    libs = set(co.get("lib", []))
    if "dom" not in {l.lower() for l in libs}:
        libs.add("dom")
    if "ES2022" not in libs and "es2022" not in {l for l in libs}:
        libs.add("ES2022")
    co["lib"] = sorted(libs)
    co.setdefault("skipLibCheck", True)
    co.setdefault("moduleResolution", "node")
    co.setdefault("module", "ES2022")
    co.setdefault("target", "ES2022")
    co.setdefault("types", co.get("types", []))
    save_json(p, data)
    print(f"✔ Ensured DOM/ES2022 libs in {p}")

def main():
    ensure_tsconfig_root()
    ensure_tsconfig_app()
    patch_angular_json()
    print("\nNext steps:")
    print("  docker compose build --no-cache web")
    print("  docker compose up")

if __name__ == "__main__":
    main()
