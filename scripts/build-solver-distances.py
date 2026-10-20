#!/usr/bin/env python3
"""Build the solver's independent country-boundary distance model.

Use a temporary environment; the website has no Python/runtime GIS dependency:
  python3 -m venv /tmp/originle-solver-venv
  /tmp/originle-solver-venv/bin/pip install numpy==2.4.4 scipy==1.17.1 shapely==2.1.2
  /tmp/originle-solver-venv/bin/python scripts/build-solver-distances.py

Optional: --source /path/to/the/pinned.geojson --report /path/to/report.json
The downloaded or cached source must have the pinned SHA-256 below. Natural
Earth's data is public domain: https://www.naturalearthdata.com/about/terms-of-use/

Each polygon ring is sampled along great-circle segments at <=2 km intervals.
The matrix stores the nearest spherical distance between these boundary
samples, rounded to kilometres. Intersecting country geometries have distance
zero. Sampling adds at most one spacing interval to the distance between the
model's continuous rings; map generalization and footprint choices are separate
errors. This is not the official game's distance matrix or a capital-distance
model. No puzzle, answer, guest, database or current date is an input.
"""

import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import urllib.request

import numpy as np
from scipy.spatial import cKDTree
from shapely import make_valid
from shapely.geometry import shape
from shapely.prepared import prep


SOURCE_COMMIT = "f1890d9f152c896d250a77557a5751a93d494776"
SOURCE_URL = f"https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{SOURCE_COMMIT}/geojson/ne_10m_admin_0_countries.geojson"
SOURCE_SHA256 = "239eec57ac17f100a11e2536cffc56752c318b50ae765b0918ff7aab4ce8f255"
SOURCE_PAGE = "https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/"
LICENSE_URL = "https://www.naturalearthdata.com/about/terms-of-use/"
EARTH_RADIUS_KM = 6371.0088
SAMPLE_SPACING_KM = 2

# ISO_A2_EH has multiple features for these codes. Choose the primary country
# feature, retaining every polygon inside it. Separately listed dependencies,
# leases and disputed islands are not silently merged into a sovereign country.
PRIMARY_ADM0 = {"AU": "AUS", "BR": "BRA", "FR": "FRA", "KZ": "KAZ"}


def polygon_rings(geometry):
    if geometry["type"] == "Polygon":
        yield from geometry["coordinates"]
    elif geometry["type"] == "MultiPolygon":
        for polygon in geometry["coordinates"]:
            yield from polygon
    else:
        raise ValueError(f"Unsupported country geometry: {geometry['type']}")


def boundary_samples(geometry):
    chunks = []
    for ring in polygon_rings(geometry):
        radians = np.deg2rad(np.asarray(ring, dtype=float)[:, :2])
        lon, lat = radians[:, 0], radians[:, 1]
        xyz = np.column_stack((np.cos(lat) * np.cos(lon), np.cos(lat) * np.sin(lon), np.sin(lat)))
        chunks.append(xyz[:-1])
        angles = np.arccos(np.clip(np.sum(xyz[:-1] * xyz[1:], axis=1), -1, 1))
        steps = np.maximum(1, np.ceil(angles * EARTH_RADIUS_KM / SAMPLE_SPACING_KM).astype(int))
        for index in np.nonzero(steps > 1)[0]:
            angle = angles[index]
            fractions = np.arange(1, steps[index], dtype=float) / steps[index]
            # Spherical interpolation handles islands on both sides of the date line.
            left = np.sin((1 - fractions) * angle) / math.sin(angle)
            right = np.sin(fractions * angle) / math.sin(angle)
            chunks.append(left[:, None] * xyz[index] + right[:, None] * xyz[index + 1])
    result = np.unique(np.vstack(chunks), axis=0)
    if not len(result):
        raise ValueError("A country has no boundary samples")
    return result


def build(source_bytes, countries):
    source = json.loads(source_bytes)
    by_code = {}
    for feature in source["features"]:
        by_code.setdefault(feature["properties"]["ISO_A2_EH"], []).append(feature)

    samples, geometries, prepared, feature_records = [], [], [], []
    for country in countries:
        code = country["code"]
        matches = by_code.get(code, [])
        if code in PRIMARY_ADM0:
            matches = [f for f in matches if f["properties"]["ADM0_A3"] == PRIMARY_ADM0[code]]
        if len(matches) != 1:
            raise ValueError(f"Expected exactly one primary feature for {code}, got {len(matches)}")
        feature = matches[0]
        geometry = shape(feature["geometry"])
        repaired = not geometry.is_valid
        if repaired:
            geometry = make_valid(geometry)
        geometries.append(geometry)
        prepared.append(prep(geometry))
        samples.append(boundary_samples(feature["geometry"]))
        feature_records.append({"code": code, "adm0": feature["properties"]["ADM0_A3"], "sourceName": feature["properties"]["ADMIN"], "sampleCount": len(samples[-1]), "topologyRepairedForIntersection": repaired})

    trees = [cKDTree(points) for points in samples]
    rows = []
    for index, points in enumerate(samples):
        row = []
        for other in range(index + 1, len(samples)):
            if prepared[index].intersects(geometries[other]):
                distance = 0
            else:
                # Query the smaller cloud; chord distance is monotone with the
                # shortest great-circle distance on the sphere, including at 180°.
                query, tree = (points, trees[other]) if len(points) <= len(samples[other]) else (samples[other], trees[index])
                chord = float(np.min(tree.query(query, k=1, workers=1)[0]))
                distance = round(2 * EARTH_RADIUS_KM * math.asin(min(1, chord / 2)))
            row.append(distance)
        rows.append(row)
        if index % 10 == 0 or index == len(samples) - 1:
            print(f"Built {index + 1}/{len(samples)} country rows", flush=True)
    return rows, feature_records


def main():
    repo = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--output", type=Path, default=repo / "src/data/solver-distances.ts")
    args = parser.parse_args()
    data = args.source.read_bytes() if args.source else urllib.request.urlopen(SOURCE_URL, timeout=90).read()
    if hashlib.sha256(data).hexdigest() != SOURCE_SHA256:
        raise ValueError("Source hash differs from the reviewed Natural Earth data")
    countries_text = (repo / "src/data/countries.ts").read_text()
    countries = [json.loads(row) for row in re.findall(r"^  (\{.+\}),?$", countries_text, re.MULTILINE)]
    if len(countries) != 197 or len({c["code"] for c in countries}) != 197:
        raise ValueError("The solver requires all 197 current guess-country codes")
    rows, features = build(data, countries)
    codes = [c["code"] for c in countries]
    values = [value for row in rows for value in row]
    if len(values) != 197 * 196 // 2 or any(not 0 <= value <= math.pi * EARTH_RADIUS_KM for value in values):
        raise ValueError("Invalid model matrix")
    metadata = {"version": "5.1.2", "sourceUrl": SOURCE_URL, "sourcePage": SOURCE_PAGE, "sourceCommit": SOURCE_COMMIT, "sourceSha256": SOURCE_SHA256, "license": "Public domain", "licenseUrl": LICENSE_URL, "countryCount": len(codes), "sampleSpacingKm": SAMPLE_SPACING_KM, "earthRadiusKm": EARTH_RADIUS_KM, "matrixSha256": hashlib.sha256(json.dumps(rows, separators=(",", ":")).encode()).hexdigest()}
    content = "/**\n * Generated by scripts/build-solver-distances.py.\n * Natural Earth v5.1.2 (public domain), 1:10m primary country polygons.\n * Approximate spherical boundary distances; not official game values or capital distances.\n * Rows hold the upper triangle: row i, offset j-i-1 is the distance for i < j.\n */\n"
    content += "export const SOLVER_DATA_META = " + json.dumps(metadata, separators=(",", ":")) + " as const;\n\n"
    content += "export const SOLVER_CODES = " + json.dumps(codes, separators=(",", ":")) + " as const;\n\n"
    content += "export const SOLVER_DISTANCE_ROWS: readonly (readonly number[])[] = [\n"
    content += "\n".join("  " + json.dumps(row, separators=(",", ":")) + "," for row in rows)
    content += "\n];\n"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(content)
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps({"metadata": metadata, "features": features, "pairs": len(values), "zeroPairs": sum(v == 0 for v in values), "positivePairs": sum(v > 0 for v in values), "maximumKm": max(values), "minimumPositiveKm": min(v for v in values if v > 0), "sourceBytes": len(data), "outputBytes": len(content.encode()), "footprintPolicy": "Primary Natural Earth country feature per ISO_A2_EH; retain all its parts, omit separately listed dependencies, leases and disputed islands."}, indent=2) + "\n")
    print(f"Wrote {args.output}: {len(codes)} countries, {len(values)} distances, {len(content.encode())} bytes", flush=True)


if __name__ == "__main__":
    main()
