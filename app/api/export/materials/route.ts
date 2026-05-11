import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMaterialsReport } from "@/lib/services/reports";
import { buildMaterialsXlsx } from "@/lib/services/exports";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const start = sp.get("from");
  const end = sp.get("to");
  if (!start || !end) {
    return NextResponse.json(
      { error: "from и to обязательны" },
      { status: 400 },
    );
  }

  const supabase = createClient();
  const entries = await getMaterialsReport(supabase, start, end);
  const buf = buildMaterialsXlsx({ start, end, entries });

  return new NextResponse(buf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="materials-${start}_${end}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
