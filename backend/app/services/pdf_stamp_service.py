import io

import qrcode
from pypdf import PdfReader, PdfWriter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

QR_SIZE_PT = 90  # taxminan 3.2 sm — chop etilganda skanerlash uchun yetarli
MARGIN_PT = 20


def stamp_pdf_with_qr(pdf_bytes: bytes, qr_url: str) -> bytes:
    """Berilgan PDF'ning 1-sahifasi o'ng-yuqori burchagiga `qr_url`ni ko'rsatuvchi QR
    kodni chizib (overlay) qo'shadi va yangi PDF baytlarini qaytaradi.

    QR — reportlab yordamida sahifa o'lchamiga mos alohida bir sahifali PDF sifatida
    chiziladi, so'ng pypdf shu overlay'ni asl 1-sahifaga birlashtiradi (merge_page).
    Reportlab o'zi mavjud PDF'ni tahrirlay olmaydi — shuning uchun ikkala kutubxona
    birga ishlatiladi.
    """
    qr_img = qrcode.make(qr_url)
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)

    reader = PdfReader(io.BytesIO(pdf_bytes))
    first_page = reader.pages[0]
    page_width = float(first_page.mediabox.width)
    page_height = float(first_page.mediabox.height)

    overlay_buffer = io.BytesIO()
    c = canvas.Canvas(overlay_buffer, pagesize=(page_width, page_height))
    x = page_width - QR_SIZE_PT - MARGIN_PT
    y = page_height - QR_SIZE_PT - MARGIN_PT
    c.drawImage(ImageReader(qr_buffer), x, y, width=QR_SIZE_PT, height=QR_SIZE_PT, mask="auto")
    c.save()
    overlay_buffer.seek(0)

    overlay_reader = PdfReader(overlay_buffer)
    first_page.merge_page(overlay_reader.pages[0])

    writer = PdfWriter()
    writer.add_page(first_page)
    for page in reader.pages[1:]:
        writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()
