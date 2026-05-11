import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPayrollByPeriod } from "@/lib/services/reports";
import { buildPayrollXlsx } from "@/lib/services/exports";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const start = sp.get("from");
  const end = sp.get("to");
  const period = sp.get("period") ?? (start ? start.slice(0, 7) : "");

  if (!start || !end) {
    return NextResponse.json(
      { error: "from и to обязательны" },
      { status: 400 },
    );
  }

  const supabase = createClient();
  const entries = await getPayrollByPeriod(supabase, start, end);
  const buf = buildPayrollXlsx({ period, start, end, entries });

  return new NextResponse(buf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="payroll-${period}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
