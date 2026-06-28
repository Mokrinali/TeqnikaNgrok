"""
Migration script: TeknikaTabeli2 (LiteDB) → TeqnikaNgrok (PostgreSQL)

Usage:
    1. Start TeknikaTabeli2, log in as admin, open:  http://localhost:PORT/export-data
    2. Save that JSON file as  export.json  (same folder as this script)
    3. Make sure PostgreSQL is running (docker compose up -d db)
    4. Run:  python migrate.py [export.json] [postgres_url]

Default postgres_url: postgresql://postgres:Teknika2024!@localhost:5432/teknika
(If running inside Docker network, replace localhost with 'db')
"""

import asyncio
import json
import sys
from datetime import datetime, date
from pathlib import Path


# ── helpers ───────────────────────────────────────────────────────────────────

def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    # ASP.NET serializes as "2024-01-15T10:30:00" or with timezone suffix
    value = value.rstrip('Z')
    for fmt in ('%Y-%m-%dT%H:%M:%S.%f', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M'):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    raise ValueError(f"Cannot parse datetime: {value!r}")


def parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return parse_dt(value).date()


# ── main ──────────────────────────────────────────────────────────────────────

async def migrate(json_path: str, db_url: str) -> None:
    try:
        import asyncpg
    except ImportError:
        print("ERROR: asyncpg not installed.  Run:  pip install asyncpg")
        sys.exit(1)

    data = json.loads(Path(json_path).read_text(encoding='utf-8'))

    # asyncpg expects  postgresql://...  not  postgresql+asyncpg://...
    conn_str = db_url.replace('+asyncpg', '').replace('postgresql', 'postgresql', 1)

    print(f"Connecting to: {conn_str.split('@')[-1]}")
    conn = await asyncpg.connect(conn_str)

    try:
        async with conn.transaction():

            # ── 1. Construction Sites ─────────────────────────────────────────
            sites = data.get('sites', [])
            print(f"  sites        : {len(sites)}")
            for s in sites:
                await conn.execute("""
                    INSERT INTO construction_sites (id, name, code, is_active, created_at)
                    VALUES ($1,$2,$3,$4,$5)
                    ON CONFLICT (id) DO NOTHING
                """, s['id'], s['name'], s['code'], s['isActive'],
                    parse_dt(s.get('createdAt')))

            # ── 2. Work Types ─────────────────────────────────────────────────
            work_types = data.get('workTypes', [])
            print(f"  work_types   : {len(work_types)}")
            for w in work_types:
                await conn.execute("""
                    INSERT INTO work_types (id, name, default_price, is_active, created_at)
                    VALUES ($1,$2,$3,$4,$5)
                    ON CONFLICT (id) DO NOTHING
                """, w['id'], w['name'], float(w.get('defaultPrice', 0)),
                    w['isActive'], parse_dt(w.get('createdAt')))

            # ── 3. Contractors ────────────────────────────────────────────────
            contractors = data.get('contractors', [])
            print(f"  contractors  : {len(contractors)}")
            for c in contractors:
                await conn.execute("""
                    INSERT INTO contractors
                        (id, contractor_type, contractor_mode, name, id_code,
                         phone, plate_number, notes, created_at, is_active, site_id)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                    ON CONFLICT (id) DO NOTHING
                """, c['id'], c['contractorType'], c['contractorMode'],
                    c['name'], c['idCode'],
                    c.get('phone'), c.get('plateNumber'), c.get('notes'),
                    parse_dt(c.get('createdAt')), c['isActive'], c['siteId'])

            # ── 4. Equipment ──────────────────────────────────────────────────
            equipment = data.get('equipment', [])
            print(f"  equipment    : {len(equipment)}")
            for e in equipment:
                await conn.execute("""
                    INSERT INTO equipment
                        (id, name, type, plate_number, daily_rate,
                         contractor_id, created_at, is_active, notes)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                    ON CONFLICT (id) DO NOTHING
                """, e['id'], e['name'], e.get('type'), e.get('plateNumber'),
                    float(e['dailyRate']), e['contractorId'],
                    parse_dt(e.get('createdAt')), e['isActive'], e.get('notes'))

            # ── 5. Equipment Logs ─────────────────────────────────────────────
            logs = data.get('logs', [])
            print(f"  logs         : {len(logs)}")
            for log in logs:
                await conn.execute("""
                    INSERT INTO equipment_logs
                        (id, equipment_id, equipment_name, plate_number,
                         contractor_id, contractor_name, daily_rate,
                         entry_timestamp, exit_timestamp,
                         entry_photo_url, exit_photo_url,
                         verification_code, created_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
                    ON CONFLICT (id) DO NOTHING
                """, log['id'],
                    log['equipmentId'], log['equipmentName'], log.get('plateNumber'),
                    log['contractorId'], log['contractorName'], float(log['dailyRate']),
                    parse_dt(log['entryTimestamp']), parse_dt(log.get('exitTimestamp')),
                    log.get('entryPhotoUrl'), log.get('exitPhotoUrl'),
                    log.get('verificationCode', ''),
                    parse_dt(log.get('createdAt')))

            # ── 6. Trip Logs ──────────────────────────────────────────────────
            trip_logs = data.get('tripLogs', [])
            print(f"  trip_logs    : {len(trip_logs)}")
            for t in trip_logs:
                await conn.execute("""
                    INSERT INTO trip_logs
                        (id, contractor_id, contractor_name, plate_number,
                         work_type_id, work_type_name, date,
                         trip_count, price_per_trip, notes, created_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                    ON CONFLICT (id) DO NOTHING
                """, t['id'],
                    t['contractorId'], t['contractorName'], t.get('plateNumber'),
                    t['workTypeId'], t['workTypeName'],
                    parse_date(t.get('date')),
                    t['tripCount'], float(t['pricePerTrip']),
                    t.get('notes'), parse_dt(t.get('createdAt')))

            # ── 7. Reset PostgreSQL sequences so new inserts don't conflict ───
            for table, seq in [
                ('construction_sites', 'construction_sites_id_seq'),
                ('work_types',         'work_types_id_seq'),
                ('contractors',        'contractors_id_seq'),
                ('equipment',          'equipment_id_seq'),
                ('equipment_logs',     'equipment_logs_id_seq'),
                ('trip_logs',          'trip_logs_id_seq'),
            ]:
                await conn.execute(f"""
                    SELECT setval('{seq}', COALESCE((SELECT MAX(id) FROM {table}), 1))
                """)

        print("\nMigration complete!")

    finally:
        await conn.close()


if __name__ == '__main__':
    json_file = sys.argv[1] if len(sys.argv) > 1 else 'export.json'
    db_url    = sys.argv[2] if len(sys.argv) > 2 else \
                'postgresql://postgres:Teknika2024!@localhost:5432/teknika'

    if not Path(json_file).exists():
        print(f"ERROR: {json_file} not found.")
        print("  1. Open TeknikaTabeli2, log in as admin")
        print("  2. Go to  /export-data")
        print("  3. Save the page as export.json next to this script")
        sys.exit(1)

    asyncio.run(migrate(json_file, db_url))
