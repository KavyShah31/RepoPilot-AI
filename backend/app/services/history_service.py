
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from fastapi.encoders import jsonable_encoder


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATABASE_DIR = PROJECT_ROOT / "data"
DATABASE_PATH = DATABASE_DIR / "repopilot.db"


def get_connection():
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row

    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS scan_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_type TEXT NOT NULL,
                repo_url TEXT NOT NULL,
                repository TEXT NOT NULL,
                created_at TEXT NOT NULL,
                result_json TEXT NOT NULL
            )
        """)

        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_history_created_at
            ON scan_history(created_at)
        """)


def save_analysis(analysis_type, repo_url, result):
    result_data = jsonable_encoder(result)

    repository = (
        result_data.get("repository")
        or result_data.get("full_name")
        or repo_url.rstrip("/").split("/")[-1]
    )

    created_at = datetime.now(timezone.utc).isoformat()

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO scan_history (
                analysis_type,
                repo_url,
                repository,
                created_at,
                result_json
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                analysis_type,
                repo_url,
                repository,
                created_at,
                json.dumps(result_data),
            ),
        )

        return cursor.lastrowid


def get_all_history():
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT
                id,
                analysis_type,
                repo_url,
                repository,
                created_at
            FROM scan_history
            ORDER BY id DESC
            """
        ).fetchall()

    return [dict(row) for row in rows]


def get_history_by_id(scan_id):
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT *
            FROM scan_history
            WHERE id = ?
            """,
            (scan_id,),
        ).fetchone()

    if row is None:
        return None

    record = dict(row)
    record["result"] = json.loads(record.pop("result_json"))

    return record


def delete_history(scan_id):
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM scan_history WHERE id = ?",
            (scan_id,),
        )

        return cursor.rowcount > 0


initialize_database()
