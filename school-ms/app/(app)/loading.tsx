import { SkRows, SkStats } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 18 }}>
        <span className="sk" style={{ display: "block", width: 110, height: 9, borderRadius: 8 }} />
        <span className="sk" style={{ display: "block", width: "42%", height: 24, borderRadius: 10, marginTop: 10 }} />
        <span className="sk" style={{ display: "block", width: "28%", height: 10, borderRadius: 8, marginTop: 9 }} />
      </div>
      <SkStats />
      <div style={{ height: 16 }} />
      <div className="card card-pad">
        <SkRows rows={7} />
      </div>
    </div>
  );
}
