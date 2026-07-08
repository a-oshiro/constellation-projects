import { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Add } from '@mui/icons-material';
import { Breadcrumbs } from '../layout/Breadcrumbs';
import { ManageWorkflowDialog } from './ManageWorkflowDialog';
import { StatusChip, AccountsChip } from './WorkflowChips';
import { BMW_ACCOUNT_IDS, ALL_ACCOUNT_IDS } from './workflowTypes';
import type { WorkflowStepConfig, OfferReplacementWorkflow } from './workflowTypes';

const GitForkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
    <path d="M9 9.75V12M9 9.75C9 9.33579 8.66421 9 8.25 9H5.625C5.21079 9 4.875 8.66421 4.875 8.25V6M9 9.75C9 9.33579 9.33579 9 9.75 9H12.375C12.7892 9 13.125 8.66421 13.125 8.25V6M6.9375 4.125C6.9375 5.26409 6.01409 6.1875 4.875 6.1875C3.73591 6.1875 2.8125 5.26409 2.8125 4.125C2.8125 2.98591 3.73591 2.0625 4.875 2.0625C6.01409 2.0625 6.9375 2.98591 6.9375 4.125ZM15.1875 4.125C15.1875 5.26409 14.2641 6.1875 13.125 6.1875C11.9859 6.1875 11.0625 5.26409 11.0625 4.125C11.0625 2.98591 11.9859 2.0625 13.125 2.0625C14.2641 2.0625 15.1875 2.98591 15.1875 4.125ZM11.0625 13.875C11.0625 15.0141 10.1391 15.9375 9 15.9375C7.86091 15.9375 6.9375 15.0141 6.9375 13.875C6.9375 12.7359 7.86091 11.8125 9 11.8125C10.1391 11.8125 11.0625 12.7359 11.0625 13.875Z" stroke="#473BAB" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

// ── Mock workflows — the three examples from the Figma reference ───────────────

const STANDARD_WORKFLOW_STEPS: WorkflowStepConfig[] = [
  {
    id: 'wf-1-step-1',
    name: 'Same YMMT',
    replacementMethod: 'same-ymmt',
    filters: [
      { id: 'wf-1-step-1-f1', filterKey: 'offer-type', label: 'Offer Type', value: 'Same Offer Type' },
      { id: 'wf-1-step-1-f2', filterKey: 'total-price-tolerance', label: 'Total Price Tolerance', value: '+- $1,000' },
    ],
    strategy: ['Highest PVI', 'Largest Inventory', 'Days in lot', 'Total Price'],
  },
  {
    id: 'wf-1-step-2',
    name: 'Same Price Point',
    replacementMethod: 'different-ymmt',
    filters: [
      { id: 'wf-1-step-2-f1', filterKey: 'offer-type', label: 'Offer Type', value: 'Same Offer Type' },
      { id: 'wf-1-step-2-f2', filterKey: 'total-price-tolerance', label: 'Total Price Tolerance', value: '+- $1,000' },
    ],
    strategy: ['Closest Total Price', 'Highest PVI', 'Largest Inventory', 'Days in lot'],
  },
  {
    id: 'wf-1-step-3',
    name: 'Same Monthly Payment',
    replacementMethod: 'different-ymmt',
    filters: [
      { id: 'wf-1-step-3-f1', filterKey: 'offer-type', label: 'Offer Type', value: 'Same Offer Type' },
      { id: 'wf-1-step-3-f2', filterKey: 'monthly-payment-tolerance', label: 'Monthly Payment Tolerance', value: '+- $100' },
    ],
    strategy: ['Closest Monthly Payment', 'Highest PVI', 'Largest Inventory', 'Days in lot'],
  },
];

const HIGH_END_BRANDS_STEPS: WorkflowStepConfig[] = [
  {
    id: 'wf-2-step-1',
    name: 'Same Trim Match',
    replacementMethod: 'same-ymmt',
    filters: [
      { id: 'wf-2-step-1-f1', filterKey: 'trim-level', label: 'Trim Level', value: 'Same Trim' },
    ],
    strategy: ['Highest PVI', 'Total Price'],
  },
  {
    id: 'wf-2-step-2',
    name: 'Nearby Inventory Match',
    replacementMethod: 'different-ymmt',
    filters: [
      { id: 'wf-2-step-2-f1', filterKey: 'mileage', label: 'Mileage', value: '+/- 10,000 mi' },
    ],
    strategy: ['Largest Inventory', 'Days in lot'],
  },
];

const SPECIALS_EVENTS_STEPS: WorkflowStepConfig[] = [
  {
    id: 'wf-3-step-1',
    name: 'Same Offer Window',
    replacementMethod: 'same-ymmt',
    filters: [
      { id: 'wf-3-step-1-f1', filterKey: 'year', label: 'Year', value: 'Same Year' },
    ],
    strategy: ['Highest PVI'],
  },
  {
    id: 'wf-3-step-2',
    name: 'Flexible Match',
    replacementMethod: 'different-ymmt',
    filters: [
      { id: 'wf-3-step-2-f1', filterKey: 'offer-type', label: 'Offer Type', value: 'Different Offer Type' },
    ],
    strategy: ['Total Price', 'Days in lot'],
  },
];

const INITIAL_WORKFLOWS: OfferReplacementWorkflow[] = [
  {
    id: 'wf-1',
    name: 'Standard Workflow',
    steps: STANDARD_WORKFLOW_STEPS,
    accountIds: ALL_ACCOUNT_IDS.slice(0, 42),
    status: 'active',
  },
  {
    id: 'wf-2',
    name: 'High end brands',
    steps: HIGH_END_BRANDS_STEPS,
    accountIds: BMW_ACCOUNT_IDS.slice(0, 12),
    status: 'active',
  },
  {
    id: 'wf-3',
    name: 'Specials events',
    steps: SPECIALS_EVENTS_STEPS,
    accountIds: ALL_ACCOUNT_IDS.slice(3, 45),
    status: 'active',
  },
];

const emptyDraft = (): Omit<OfferReplacementWorkflow, 'id'> => ({
  name: '',
  accountIds: [],
  status: 'active',
  steps: [],
});

// ── Small building blocks ────────────────────────────────────────────────────

function ManageWorkflowButton({ onClick }: { onClick?: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '4px 14px', borderRadius: 100,
        border: '1px solid rgba(99,86,225,0.5)', background: 'transparent',
        color: '#473bab', fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
        letterSpacing: '0.46px', cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      <GitForkIcon />
      Manage Workflow
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export const OfferReplacementWorkflowTab = () => {
  const [workflows, setWorkflows] = useState<OfferReplacementWorkflow[]>(INITIAL_WORKFLOWS);
  const [manageDialog, setManageDialog] = useState<{
    id: string | null;
    workflow: Omit<OfferReplacementWorkflow, 'id'>;
  } | null>(null);

  const openForRow = (workflow: OfferReplacementWorkflow) => {
    setManageDialog({
      id: workflow.id,
      workflow: { name: workflow.name, accountIds: workflow.accountIds, status: workflow.status, steps: workflow.steps },
    });
  };

  const openForNew = () => {
    setManageDialog({ id: null, workflow: emptyDraft() });
  };

  const handleDialogSave = (workflow: Omit<OfferReplacementWorkflow, 'id'>) => {
    if (!manageDialog) return;
    if (manageDialog.id) {
      const id = manageDialog.id;
      setWorkflows((prev) => prev.map((w) => (w.id === id ? { id, ...workflow } : w)));
    } else {
      setWorkflows((prev) => [...prev, { id: `wf-${Date.now()}`, ...workflow }]);
    }
    setManageDialog(null);
  };

  return (
    <div className="flex h-full flex-1 min-w-0" style={{ gap: 16 }}>
      {/* ── Main panel — workflow table ─────────────────────────────── */}
      <div
        style={{
          flex: 1, minWidth: 0, background: '#ffffff', borderRadius: 16,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ padding: '10px 16px 12px', flexShrink: 0 }}>
          <div style={{ marginBottom: 6 }}>
            <Breadcrumbs items={['Settings', 'Offer Replacement Workflow']} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', margin: 0 }}>
              Offer Replacement Workflow
            </h1>
            <button
              onClick={openForNew}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 16px 6px 12px', borderRadius: 100,
                border: 'none', background: '#473bab', color: '#ffffff',
                fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
                letterSpacing: '0.4px', cursor: 'pointer',
              }}
            >
              <Add style={{ fontSize: 18 }} />
              New Workflow
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {['Name', 'Steps', 'Accounts', 'Status', ''].map((col) => (
                    <TableCell
                      key={col || 'actions'}
                      sx={{ fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', borderBottom: '1px solid #f0f0f0' }}
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {workflows.map((wf) => (
                  <TableRow
                    key={wf.id}
                    hover
                    onClick={() => openForRow(wf)}
                    sx={{
                      cursor: 'pointer',
                      '& td': { borderBottom: '1px solid #f0f0f0' },
                    }}
                  >
                    <TableCell sx={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
                      {wf.name}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
                      {wf.steps.length}
                    </TableCell>
                    <TableCell>
                      <AccountsChip count={wf.accountIds.length} />
                    </TableCell>
                    <TableCell>
                      <StatusChip status={wf.status} />
                    </TableCell>
                    <TableCell align="right">
                      <ManageWorkflowButton
                        onClick={(e) => {
                          e.stopPropagation();
                          openForRow(wf);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>

      {manageDialog && (
        <ManageWorkflowDialog
          workflow={manageDialog.workflow}
          onClose={() => setManageDialog(null)}
          onSave={handleDialogSave}
        />
      )}
    </div>
  );
};
