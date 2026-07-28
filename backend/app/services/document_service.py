from app.core.config import settings
from app.models.document import Document
from app.schemas.document import DocumentOut

DOCUMENTS_SUBDIR = "documents"


def to_document_out(doc: Document) -> DocumentOut:
    return DocumentOut(
        id=doc.id,
        title=doc.title,
        original_filename=doc.original_filename,
        file_url=f"{settings.API_V1_PREFIX}/uploads/{DOCUMENTS_SUBDIR}/{doc.stored_filename}",
        page_url=f"{settings.PUBLIC_SITE_BASE_URL}/documents/{doc.id}",
        created_at=doc.created_at,
    )
