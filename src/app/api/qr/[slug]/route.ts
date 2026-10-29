import { prisma } from "@/lib/prisma";
import { requireRestaurantAccess, jsonError } from "@/lib/tenant";
import { tableUrl } from "@/lib/utils";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: { tables: { where: { active: true }, orderBy: { label: "asc" } } },
    });
    if (!restaurant) {
      return Response.json({ error: "No encontrado" }, { status: 404 });
    }
    await requireRestaurantAccess(restaurant.id);

    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "json";
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${url.protocol}//${url.host}`;

    const cards = await Promise.all(
      restaurant.tables.map(async (t) => {
        const link = tableUrl(slug, t.code, base);
        const dataUrl = await QRCode.toDataURL(link, {
          width: 512,
          margin: 1,
          color: { dark: "#0B6E4F", light: "#FFFFFF" },
        });
        return { table: t, url: link, qrDataUrl: dataUrl };
      })
    );

    if (format === "pdf") {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const cols = 2;
      const rows = 3;
      const cardW = 90;
      const cardH = 85;
      const marginX = 15;
      const marginY = 15;
      let i = 0;

      for (const card of cards) {
        if (i > 0 && i % (cols * rows) === 0) doc.addPage();
        const idx = i % (cols * rows);
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = marginX + col * (cardW + 10);
        const y = marginY + row * (cardH + 8);

        doc.setDrawColor(11, 110, 79);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, y, cardW, cardH, 3, 3, "S");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(11, 110, 79);
        doc.text(restaurant.name, x + cardW / 2, y + 10, { align: "center" });
        doc.setFontSize(16);
        doc.setTextColor(232, 93, 4);
        doc.text(card.table.label, x + cardW / 2, y + 20, { align: "center" });
        doc.addImage(card.qrDataUrl, "PNG", x + 20, y + 25, 50, 50);
        doc.setFontSize(7);
        doc.setTextColor(80);
        doc.text("Escanea o acerca tu teléfono (NFC)", x + cardW / 2, y + 80, {
          align: "center",
        });
        i += 1;
      }

      const buf = Buffer.from(doc.output("arraybuffer"));
      return new Response(buf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="tapmenu-${slug}-mesas.pdf"`,
        },
      });
    }

    return Response.json({ restaurant: { name: restaurant.name, slug }, cards });
  } catch (e) {
    return jsonError(e);
  }
}
