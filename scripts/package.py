#!/usr/bin/env python3
"""Create a clean GitHub source archive without runtime state or dependencies."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import zipfile


EXCLUDED_DIRECTORIES = {
    '.git', '.agents', '.codex', '.aws', 'node_modules', '.next', '.venv', 'venv',
    '__pycache__', 'runtime', '.cache', '.pytest_cache', '.mypy_cache', '.ruff_cache',
    'dist', 'build', 'out', 'coverage', 'htmlcov', 'test-results', 'playwright-report',
}
EXCLUDED_SUFFIXES = {'.pyc', '.pyo', '.log', '.tmp', '.bak', '.zip', '.pem', '.key', '.tsbuildinfo'}
MANIFEST_NAME = 'PACKAGE_MANIFEST.json'
SECRET_PATTERNS = (
    re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    re.compile(rb'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'),
    re.compile(rb'\b(?:ghp_|github_pat_)[A-Za-z0-9_]{30,}\b'),
    re.compile(rb'\bsk-[A-Za-z0-9_-]{24,}\b'),
)


def publishable(relative: Path) -> bool:
    if any(part in EXCLUDED_DIRECTORIES for part in relative.parts):
        return False
    name = relative.name
    if name == MANIFEST_NAME or name.startswith('.env') and name != '.env.example':
        return False
    if relative.parts[:3] == ('backend', 'app', 'data'):
        return False
    if relative.suffix in EXCLUDED_SUFFIXES or re.search(r'\.(?:sqlite3|db)(?:-|$)', name):
        return False
    return not name.endswith('.zip.sha256') and name != '.DS_Store'


def collect(root: Path):
    entries = []
    for path in sorted(root.rglob('*')):
        relative = path.relative_to(root)
        if not publishable(relative):
            continue
        if path.is_symlink():
            raise ValueError(f'Remove symbolic link before packaging: {relative}')
        if not path.is_file():
            continue
        data = path.read_bytes()
        if len(data) > 95 * 1024 * 1024:
            raise ValueError(f'File too large for this source distribution: {relative}')
        if any(pattern.search(data) for pattern in SECRET_PATTERNS):
            raise ValueError(f'Potential secret found; inspect locally: {relative}')
        entries.append((path, relative, data))
    return entries


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=root.parent / 'attackpilot-standalone.zip')
    args = parser.parse_args()
    output = args.output.resolve()
    if output == root or root in output.parents:
        parser.error('Choose an output path outside the source directory.')
    entries = collect(root)
    manifest = {
        'format_version': 1,
        'project': 'AttackPilot standalone',
        'files': [
            {'path': relative.as_posix(), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
            for _, relative, data in entries
        ],
    }
    manifest_data = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode()
    (root / MANIFEST_NAME).write_bytes(manifest_data)
    output.parent.mkdir(parents=True, exist_ok=True)
    prefix = 'attackpilot-standalone/'
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for _, relative, data in entries:
            item = zipfile.ZipInfo(prefix + relative.as_posix(), date_time=(2026, 1, 1, 0, 0, 0))
            item.external_attr = 0o100644 << 16
            archive.writestr(item, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
        archive.writestr(prefix + MANIFEST_NAME, manifest_data)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    output.with_suffix(output.suffix + '.sha256').write_text(f'{digest}  {output.name}\n')
    print(json.dumps({'archive': str(output), 'files': len(entries) + 1, 'bytes': output.stat().st_size,
                      'sha256': digest}, ensure_ascii=False))


if __name__ == '__main__':
    main()
