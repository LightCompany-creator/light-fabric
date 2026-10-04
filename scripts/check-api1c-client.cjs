// Проверка боевого клиента на подставном fetch: то, что нельзя увидеть на заглушке.
const { Api1CClient, Api1CError, Api1COfflineError, basicAuthHeader } = require("../.tmp/api1c-check/client.js");

const calls = [];
function fakeFetch(responder) {
  return async (url, init) => {
    calls.push({ url, method: init.method, headers: init.headers, body: init.body });
    const r = responder(url, init);
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      text: async () => r.body ?? "",
    };
  };
}
const make = (responder, baseUrl = "/buh/hs/lf/v1") =>
  new Api1CClient({ baseUrl, getAuthHeader: () => basicAuthHeader("цех_литейка", "пароль"), fetchImpl: fakeFetch(responder) });

const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "OK  " : "FAIL"} ${name}${extra ? "  | " + extra : ""}`);
async function fails(fn) {
  try { await fn(); return null; } catch (e) { return e; }
}

(async () => {
  // 1. относительный адрес сервиса (приложение на том же хосте, что и 1С)
  await make(() => ({ status: 200, body: '{"ok":true,"api":"1.0"}' })).ping();
  check("относительный адрес разворачивается", calls.at(-1).url === "http://localhost/buh/hs/lf/v1/ping", calls.at(-1).url);

  // 2. логин в UTF-8
  const auth = Buffer.from(calls.at(-1).headers.Authorization.slice(6), "base64").toString("utf8");
  check("логин кириллицей уходит в UTF-8", auth === "цех_литейка:пароль", auth);

  // 3. 401 с HTML от IIS
  let e = await fails(() => make(() => ({ status: 401, body: "<html><body>401 - Unauthorized</body></html>" })).me());
  check("401 без JSON", e instanceof Api1CError && e.httpStatus === 401 && e.isUserFacing, e && e.message);

  // 4. 403 простым текстом от платформы
  e = await fails(() => make(() => ({ status: 403, body: "Недостаточно прав для использования ресурса с данным HTTP методом" })).reopenShift("x", "y"));
  check("403 без JSON", e instanceof Api1CError && e.code === "forbidden" && e.isUserFacing, e && e.message);

  // 5. 404 с HTML
  e = await fails(() => make(() => ({ status: 404, body: "<html>Not Found</html>" })).getShift("нет-такой"));
  check("404 без JSON", e instanceof Api1CError && e.code === "not_found", e && e.message);

  // 6. 400 validation со списком нарушений
  const validation = JSON.stringify({ ok: false, error: { code: "validation", message: "Строка 1: нет продукции", details: [
    { section: "outputs", row: 1, field: "product_id", message: "Строка 1: нет продукции" },
    { section: "outputs", row: 3, field: "employee_id", message: "Строка 3: сотрудник не из цеха" } ] } });
  e = await fails(() => make(() => ({ status: 400, body: validation })).closeShift("s1", { version: "7" }));
  check("validation отдаёт все нарушения", e instanceof Api1CError && e.validationMessages.length === 2, e && e.validationMessages.join(" / "));

  // 7. close: без ключа идемпотентности, с If-Match, пустое тело
  const c = calls.at(-1);
  check("close без Idempotency-Key", !("Idempotency-Key" in c.headers) && c.headers["If-Match"] === "7" && c.body === "{}", JSON.stringify({ body: c.body, ifMatch: c.headers["If-Match"] }));

  // 8. close: ответ с accounting pending
  const closeBody = JSON.stringify({ ok: true, shift: { id: "s1", status: "closed", closed_at: "2026-10-04T22:40:00", version: "9" },
    accounting: { status: "pending", message: "Недостаточно остатка", documents: { production_report: null, payroll: null } } });
  const closed = await make(() => ({ status: 200, body: closeBody })).closeShift("s1");
  check("close читает accounting", closed.accounting.status === "pending" && closed.shift.version === "9");

  // 9. GET смены: и документом как есть, и в обёртке
  const doc = { id: "s1", number: "ЛФ-1", status: "open", version: "3", workers: [], outputs: [], products: [], materials: [] };
  const plain = await make(() => ({ status: 200, body: JSON.stringify(doc) })).getShift("s1");
  const wrapped = await make(() => ({ status: 200, body: JSON.stringify({ ok: true, shift: doc }) })).getShift("s1");
  check("GET смены: оба вида ответа", plain.number === "ЛФ-1" && wrapped.number === "ЛФ-1");

  // 10. перемещение: ключ идемпотентности уходит и повторяется
  const tr = { id: "t1", number: "1", status: "open", version: "1", lines: [] };
  const client = make(() => ({ status: 201, body: JSON.stringify(tr) }));
  await client.createTransfer({ from_workshop_id: "a", to_workshop_id: "b", date: "2026-10-04", lines: [] }, "key-1");
  await client.createTransfer({ from_workshop_id: "a", to_workshop_id: "b", date: "2026-10-04", lines: [] }, "key-1");
  check("ключ перемещения повторяется", calls.at(-1).headers["Idempotency-Key"] === "key-1" && calls.at(-2).headers["Idempotency-Key"] === "key-1");

  // 11. шлюз лежит: 502 с HTML считается отсутствием связи
  e = await fails(() => make(() => ({ status: 502, body: "<html>Bad Gateway</html>" })).me());
  check("502 как «нет связи»", e instanceof Api1COfflineError);

  // 12. полный адрес по-прежнему работает
  await make(() => ({ status: 200, body: '{"ok":true}' }), "https://srv.example/buh/hs/lf/v1/").ping();
  check("полный адрес", calls.at(-1).url === "https://srv.example/buh/hs/lf/v1/ping", calls.at(-1).url);

  console.log(results.join("\n"));
  if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);
})();
