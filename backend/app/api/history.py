
from fastapi import APIRouter, HTTPException

from backend.app.services.history_service import (
    get_all_history,
    get_history_by_id,
    delete_history,
)


router = APIRouter(
    prefix="/api/v1/history",
    tags=["Repository History"],
)


@router.get("/")
async def list_history():
    return {
        "total": len(get_all_history()),
        "history": get_all_history(),
    }


@router.get("/{scan_id}")
async def read_history(scan_id: int):
    record = get_history_by_id(scan_id)

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="History record not found.",
        )

    return record


@router.delete("/{scan_id}")
async def remove_history(scan_id: int):
    deleted = delete_history(scan_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="History record not found.",
        )

    return {
        "message": "History record deleted successfully.",
        "id": scan_id,
    }
