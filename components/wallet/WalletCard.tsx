"use client";

import { Eye, EyeOff, ArrowUpRight } from "lucide-react";
import { RondoBrand } from "@/components/brand/RondoBrand";
import styles from "./WalletCard.module.css";

interface WalletCardProps {
  balanceCentavos: number;
  hidden: boolean;
  onToggleVisibility: () => void;
}

/** A visual wallet pass, not an issued payment card. */
export function WalletCard({ balanceCentavos, hidden, onToggleVisibility }: WalletCardProps) {
  const balance = new Intl.NumberFormat("en-PH", {
    style: "currency", currency: "PHP", minimumFractionDigits: 2,
  }).format(balanceCentavos / 100);

  return (
    <section className={styles.card} aria-label="Rondo wallet card">
      <div className={styles.top}>
        <RondoBrand surface="dark" className="h-7 w-28" />
        <ArrowUpRight size={30} className={styles.mark} aria-hidden />
      </div>
      <div className={styles.balance}>
        <div className={styles.labelRow}>
          <span className={styles.label}>Available balance</span>
          <button type="button" onClick={onToggleVisibility} className={styles.visibility}
            aria-label={hidden ? "Show balance" : "Hide balance"} aria-pressed={hidden}>
            {hidden ? <EyeOff size={19} aria-hidden /> : <Eye size={19} aria-hidden />}
          </button>
        </div>
        <p className={`${styles.amount} ${balanceCentavos < 0 ? styles.negative : ""}`} aria-live="polite">
          {hidden ? <span aria-label="Balance hidden">••••••</span> : balance}
        </p>
      </div>
      <div className={styles.bottom}>
        <span className={styles.label}>Rondo wallet</span>
        <span className={styles.embossed} aria-hidden>RONDO</span>
      </div>
    </section>
  );
}
