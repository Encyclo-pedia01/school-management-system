"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconSearch, IconWallet } from "@/components/Icons";
import { HBars, TrendChart } from "@/components/Charts";
import { Field, Select, TextInput } from "@/components/forms";
import { Avatar, Badge, Card, Empty, Modal, Progress, SectionCard, StatCard } from "@/components/ui";
import {
  activeStudents,
  balanceFor,
  billedFor,
  classById,
  collectionsByMonth,
  feeStatus,
  feeTotals,
  fullName,
  money,
  moneyCompact,
  monthShort,
  paidFor,
  shortDate,
} from "@/lib/derive";
import { useApp } from "@/lib/store";
import { compactMoney, useIsPhone } from "@/lib/useMedia";

export default function FeesPage() {
  const { state, persona } = useApp();
  if (persona.role === "parent") return <FamilyFees />;
  return <AdminFees />;
}

function AdminFees() {
  const { state, recordPayment, toast } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("owing");
  const [payFor, setPayFor] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Mobile Money");

  const totals = feeTotals(state);
  const phone = useIsPhone();
  const sym = state.school.currencySymbol || "GH₵";
  const cash = (v: number) => (phone ? compactMoney(v, sym) : money(v));
  const months = collectionsByMonth(state);
  const levels = state.levels.length ? state.levels : (["Preschool", "Primary", "JHS"] as const);

  const rows = useMemo(() => {
    const term = q.toLowerCase();
    return activeStudents(state)
      .filter((s) => (term ? (fullName(s) + s.admissionNo).toLowerCase().includes(term) : true))
      .map((s) => ({ s, billed: billedFor(state, s), paid: paidFor(state, s.id), status: feeStatus(state, s), bal: balanceFor(state, s) }))
      .filter((r) => {
        if (filter === "all") return true;
        if (filter === "owing") return r.status !== "Paid";
        if (filter === "paid") return r.status === "Paid";
        return r.status === "Part paid";
      })
      .sort((a, b) => b.bal - a.bal);
  }, [state, q, filter]);

  const byLevel = levels.map((lvl) => {
    const list = activeStudents(state).filter((s) => classById(state, s.classId)?.level === lvl);
    const billed = list.reduce((a, s) => a + billedFor(state, s), 0);
    const paid = list.reduce((a, s) => a + Math.min(paidFor(state, s.id), billedFor(state, s)), 0);
    return { label: lvl, value: Math.round((paid / Math.max(1, billed)) * 100) };
  });

  const openPay = (id: string) => {
    const st = state.students.find((s) => s.id === id);
    if (!st) return;
    setPayFor(id);
    setAmount(String(balanceFor(state, st) || ""));
  };

  const submit = () => {
    const amt = Number(amount);
    if (!payFor || !amt || amt <= 0) return toast("Enter a valid amount", "warn");
    recordPayment(payFor, amt, method);
    const st = state.students.find((s) => s.id === payFor);
    setPayFor(null);
    setAmount("");
    toast(`${money(amt)} received from ${st ? fullName(st) : "pupil"}`);
  };

  if (!activeStudents(state).length)
    return (
      <div className="fade-in">
        <div className="page-head">
          <div><h1 className="page-title">Fees & payments</h1><div className="page-sub">No pupils on roll yet</div></div>
        </div>
        <SectionCard title="Nothing to bill yet" sub="Admit pupils and set your fees per level in School setup">
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <Link href="/students" className="btn btn-primary btn-sm">Admit a pupil</Link>
            <Link href="/settings" className="btn btn-ghost btn-sm">Set fees</Link>
          </div>
        </SectionCard>
      </div>
    );

  const filterChips = (
    <div className="chip-toggle chip-scroll">
      {[{ id: "owing", label: "Owing" }, { id: "part", label: "Part paid" }, { id: "paid", label: "Paid" }, { id: "all", label: "All" }].map((o) => (
        <button key={o.id} className={filter === o.id ? "on" : ""} onClick={() => setFilter(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );

  /* phones open on the balance register itself, the way attendance opens on the register */
  const phoneRegister = (
    <Card className="phone-register">
      <div className="card-pad" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12 }}>
        <div className="search">
          <IconSearch size={16} />
          <input placeholder="Search pupil or admission no…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ marginTop: 9 }}>{filterChips}</div>
        <div style={{ marginTop: 9, fontSize: 11.5, fontWeight: 800, color: "var(--muted)" }}>
          {rows.length} pupils · {totals.arrearsCount} owing · {money(totals.outstanding)} outstanding
        </div>
      </div>
      <div className="fee-list">
        {rows.slice(0, 60).map((r) => (
          <div className="fee-row" key={r.s.id}>
            <Avatar name={fullName(r.s)} size={36} />
            <div className="fee-body">
              <div className="fee-nm">{fullName(r.s)}</div>
              <div className="fee-sm">{classById(state, r.s.classId)?.name ?? "—"} · {r.s.admissionNo}</div>
              {r.paid > 0 && (
                <Progress pct={r.billed ? Math.round((r.paid / r.billed) * 100) : 0} color={r.bal === 0 ? "var(--green)" : "var(--orange)"} height={5} />
              )}
            </div>
            <div className="fee-right">
              <div className={r.bal === 0 ? "fee-bal paid" : "fee-bal"}>{r.bal === 0 ? "Paid" : money(r.bal)}</div>
              <button className="btn btn-primary btn-sm" onClick={() => openPay(r.s.id)} disabled={r.bal === 0}>
                Record
              </button>
            </div>
          </div>
        ))}
      </div>
      {rows.length === 0 && <Empty title="Nothing here" sub="No pupils match this filter — try 'All'." />}
    </Card>
  );

  const kpiGrid = (
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <StatCard label="Billed this term" value={cash(totals.billed)} icon={<IconWallet size={17} />} trendLabel={`${activeStudents(state).length} pupils invoiced`} />
        <StatCard label="Collected" value={cash(totals.collected)} icon={<IconWallet size={17} />} tone="#16a34a" soft="#e8f8ee" trendLabel={`${totals.rate}% collection rate`} />
        <StatCard label="Outstanding" value={cash(totals.outstanding)} icon={<IconWallet size={17} />} tone="#dc2626" soft="#fdeceb" trendLabel="Across all classes" />
        <StatCard label="Receipts issued" value={state.payments.length} icon={<IconWallet size={17} />} tone="#7c3aed" soft="#f2ecfe" trendLabel="This term to date" />
      </div>

  );

  const chartGrid = (
      <div className="grid g-dash" style={{ marginBottom: 16 }}>
        <SectionCard title="Collections by month" sub="Current term">
          {months.length ? (
            <TrendChart
              data={months.map((m) => ({ label: monthShort(m.month), value: m.total }))}
              formatter={moneyCompact}
              color="#2563eb"
              height={172}
            />
          ) : (
            <Empty title="No payments yet" sub="Record a payment to start the trend." />
          )}
        </SectionCard>
        <SectionCard title="Collection rate by level" sub="Share of invoiced fees received">
          <HBars data={byLevel} max={100} suffix="%" color="#f97316" />
          <div className="divider" />
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
            Fees are set per level in School setup; part payments are recorded against the balance.
          </div>
        </SectionCard>
      </div>

  );

  const registerCard = (
      <Card>
        <div className="card-pad filter-bar" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="search" style={{ maxWidth: 300, flex: 1 }}>
            <IconSearch size={16} />
            <input placeholder="Search pupil or admission no…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {filterChips}
          <span className="badge badge-orange" style={{ marginLeft: "auto" }}>{rows.length} pupils</span>
        </div>

        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Pupil</th>
                <th>Class</th>
                <th className="num-right">Billed</th>
                <th className="num-right">Paid</th>
                <th className="num-right">Balance</th>
                <th>Progress</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((r) => (
                <tr key={r.s.id}>
                  <td>
                    <span className="cell-person">
                      <Avatar name={fullName(r.s)} size={30} />
                      <span>
                        <span className="nm" style={{ fontSize: 12.5 }}>{fullName(r.s)}</span>
                        <span className="sm">{r.s.admissionNo}</span>
                      </span>
                    </span>
                  </td>
                  <td><span className="badge badge-grey">{classById(state, r.s.classId)?.name ?? "—"}</span></td>
                  <td className="num-right mono">{money(r.billed)}</td>
                  <td className="num-right mono" style={{ color: "var(--green)", fontWeight: 800 }}>{money(r.paid)}</td>
                  <td className="num-right mono" style={{ fontWeight: 900, color: r.bal ? "var(--red)" : "var(--muted-2)" }}>{money(r.bal)}</td>
                  <td style={{ minWidth: 110 }}>
                    <Progress pct={r.billed ? Math.round((r.paid / r.billed) * 100) : 0} color={r.bal === 0 ? "var(--green)" : "var(--orange)"} height={7} />
                  </td>
                  <td>
                    <Badge tone={r.status === "Paid" ? "badge-green" : r.status === "Part paid" ? "badge-amber" : "badge-red"}>{r.status}</Badge>
                  </td>
                  <td className="num-right">
                    <button className="btn btn-ghost btn-sm" onClick={() => openPay(r.s.id)} disabled={r.bal === 0}>Record</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <Empty title="Nothing here" sub="No pupils match this filter — try 'All'." />}
      </Card>
  );

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1 className="page-title">Fees & payments</h1>
          <div className="page-sub">
            {activeStudents(state).length} pupils on roll · {totals.arrearsCount} with a balance · {money(totals.outstanding)} outstanding
          </div>
        </div>
        <div className="head-actions">
          <Link href="/settings" className="btn btn-ghost">Fee structure</Link>
          <button className="btn btn-primary" onClick={() => openPay(rows[0]?.s.id ?? activeStudents(state)[0].id)}>
            <IconWallet size={15} /> Record payment
          </button>
        </div>
      </div>

      {phone ? (
        <>
          {phoneRegister}
          {kpiGrid}
          {chartGrid}
        </>
      ) : (
        <>
          {kpiGrid}
          {chartGrid}
          {registerCard}
        </>
      )}

      <div style={{ marginTop: 16 }}>
        <SectionCard title="Recent receipts" sub="Latest payments recorded" bodyPad={false}>
          {state.payments.length ? (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>Receipt</th><th>Pupil</th><th>Date</th><th>Method</th><th className="num-right">Amount</th></tr>
                </thead>
                <tbody>
                  {[...state.payments].sort((a, b) => b.date.localeCompare(a.date) || b.receiptNo.localeCompare(a.receiptNo)).slice(0, 8).map((p) => {
                    const st = state.students.find((s) => s.id === p.studentId);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 800 }}>{p.receiptNo}</td>
                        <td>{st ? fullName(st) : "—"}</td>
                        <td style={{ color: "var(--muted)", fontWeight: 700 }}>{shortDate(p.date)}</td>
                        <td><span className="badge badge-blue">{p.method}</span></td>
                        <td className="num-right mono" style={{ fontWeight: 900 }}>{money(p.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "0 20px 18px" }}><Empty title="No receipts yet" /></div>
          )}
        </SectionCard>
      </div>

      <Modal
        open={!!payFor}
        onClose={() => setPayFor(null)}
        title="Record a fee payment"
        sub={
          payFor
            ? `${fullName(state.students.find((s) => s.id === payFor)!)} · balance ${money(balanceFor(state, state.students.find((s) => s.id === payFor)!))}`
            : ""
        }
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setPayFor(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>Record & issue receipt</button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Amount">
            <TextInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Method">
            <Select value={method} onChange={setMethod} options={["Mobile Money", "Cash", "Bank Transfer", "Cheque"].map((m) => ({ value: m, label: m }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

function FamilyFees() {
  const { state, persona } = useApp();
  const ids = persona.childrenIds;
  const kids = ids.map((id) => state.students.find((s) => s.id === id)).filter(Boolean) as NonNullable<ReturnType<typeof state.students.find>>[];

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1 className="page-title">School fees</h1>
          <div className="page-sub">Payments appear here as soon as the bursary records them</div>
        </div>
      </div>

      {kids.length === 0 ? (
        <SectionCard title="No pupils linked"><Empty title="Nothing to show" /></SectionCard>
      ) : (
        <>
          <div className="grid g-2" style={{ marginBottom: 16 }}>
            {kids.map((k) => {
              const billed = billedFor(state, k);
              const paid = paidFor(state, k.id);
              const bal = balanceFor(state, k);
              const payments = state.payments.filter((p) => p.studentId === k.id).sort((a, b) => b.date.localeCompare(a.date));
              return (
                <Card key={k.id} className="card-pad">
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <Avatar name={fullName(k)} size={42} square />
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 15 }}>{fullName(k)}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>{classById(state, k.classId)?.name ?? "—"}</div>
                    </div>
                    <Badge tone={bal === 0 ? "badge-green" : "badge-red"}>{bal === 0 ? "Fully paid" : `${money(bal)} due`}</Badge>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9, margin: "14px 0" }}>
                    <Mini label="Billed" value={money(billed)} />
                    <Mini label="Paid" value={money(paid)} tone="var(--green)" />
                    <Mini label="Balance" value={money(bal)} tone={bal ? "var(--red)" : "var(--green)"} />
                  </div>
                  <Progress pct={billed ? Math.round((paid / billed) * 100) : 0} color={bal ? "var(--orange)" : "var(--green)"} height={9} />

                  <div className="divider" />
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Payment history</div>
                  {payments.length ? (
                    payments.map((p) => (
                      <div key={p.id} className="list-row" style={{ padding: "7px 0" }}>
                        <span className="badge badge-blue">{p.method}</span>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{shortDate(p.date)}</div>
                        <div style={{ marginLeft: "auto", fontWeight: 900 }}>{money(p.amount)}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 700 }}>No payments recorded yet.</div>
                  )}
                </Card>
              );
            })}
          </div>

          <SectionCard title="How to pay" sub="Contact the school bursary to arrange payment">
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)", lineHeight: 1.7 }}>
              {state.school.phone && <>Call the school office on <strong style={{ color: "var(--ink)" }}>{state.school.phone}</strong>.<br /></>}
              {state.school.email && <>Or email <strong style={{ color: "var(--ink)" }}>{state.school.email}</strong>.</>}
              <br />
              A receipt is issued for every payment and appears above immediately.
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div style={{ background: "var(--cream-2)", borderRadius: 12, padding: "8px 11px" }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 900, marginTop: 2, color: tone ?? "var(--ink)" }}>{value}</div>
    </div>
  );
}
