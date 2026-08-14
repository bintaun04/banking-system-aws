from typing import Optional, Union

from sqlalchemy.orm import Session

from app.models import AuditLog


def create_audit_log(
    db: Session,
    user_id: Optional[int],
    action: str,
    resource: Optional[str] = None,
    resource_id: Optional[Union[str, int]] = None,
    ip_address: Optional[str] = None,
    description: Optional[str] = None,
):
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=(
            str(resource_id)
            if resource_id is not None
            else None
        ),
        ip_address=ip_address,
        description=description,
    )

    db.add(audit_log)

    return audit_log