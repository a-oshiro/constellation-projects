import { AddFeeButton } from './AddFeeButton';
import { FeeSectionCard } from './FeeSectionCard';
import { FeeTreatmentField } from './FeeTreatmentField';
import { ManualFeeRow } from './ManualFeeRow';
import type { ManualFee, ManualFees, ManualList } from './feeTabState';

// Figma "Manual fees": a Dealer Fees card (rows, Add Fee, disabled Fee treatment) and an Optional Fees card.
const CARDS_GAP = 24;
const ROWS_GAP = 16;

interface ManualFeesSectionProps {
  fees: ManualFees;
  onAdd: (list: ManualList) => void;
  onUpdate: (list: ManualList, id: string, patch: Partial<Omit<ManualFee, 'id'>>) => void;
  onRemove: (list: ManualList, id: string) => void;
}

export const ManualFeesSection = ({ fees, onAdd, onUpdate, onRemove }: ManualFeesSectionProps) => {
  const rows = (list: ManualList) => fees[list].length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: ROWS_GAP }}>
      {fees[list].map((fee) => (
        <ManualFeeRow
          key={fee.id}
          fee={fee}
          onChange={(patch) => onUpdate(list, fee.id, patch)}
          onRemove={() => onRemove(list, fee.id)}
        />
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: CARDS_GAP, width: '100%' }}>
      <FeeSectionCard
        title="Dealer Fees"
        description="Add your dealership document fee, government fees and any other fees that you must include in your disclosure."
      >
        {rows('dealerFees')}
        <AddFeeButton label="Add Fee" onClick={() => onAdd('dealerFees')} />
        <FeeTreatmentField />
      </FeeSectionCard>
      <FeeSectionCard
        title="Optional Fees"
        description="Optional fees are shown on offers and disclosures only. They are never added to a payment, a financed amount or a total due."
      >
        {rows('optionalFees')}
        <AddFeeButton label="Add Optional Fee" onClick={() => onAdd('optionalFees')} />
      </FeeSectionCard>
    </div>
  );
};
