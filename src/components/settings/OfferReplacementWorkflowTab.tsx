import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, FormControl, InputLabel, Select, MenuItem, Autocomplete, TextField,
  RadioGroup, FormControlLabel, Radio,
} from '@mui/material';
import { Add, Close, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { Breadcrumbs } from '../layout/Breadcrumbs';
import { AppTextField } from '../ui/AppTextField';
import { ManageWorkflowDialog } from './ManageWorkflowDialog';
import { APPROVAL_REQUIREMENTS } from './workflowTypes';
import type { WorkflowStepConfig, ApprovalRequirement } from './workflowTypes';

const GitForkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
    <path d="M9 9.75V12M9 9.75C9 9.33579 8.66421 9 8.25 9H5.625C5.21079 9 4.875 8.66421 4.875 8.25V6M9 9.75C9 9.33579 9.33579 9 9.75 9H12.375C12.7892 9 13.125 8.66421 13.125 8.25V6M6.9375 4.125C6.9375 5.26409 6.01409 6.1875 4.875 6.1875C3.73591 6.1875 2.8125 5.26409 2.8125 4.125C2.8125 2.98591 3.73591 2.0625 4.875 2.0625C6.01409 2.0625 6.9375 2.98591 6.9375 4.125ZM15.1875 4.125C15.1875 5.26409 14.2641 6.1875 13.125 6.1875C11.9859 6.1875 11.0625 5.26409 11.0625 4.125C11.0625 2.98591 11.9859 2.0625 13.125 2.0625C14.2641 2.0625 15.1875 2.98591 15.1875 4.125ZM11.0625 13.875C11.0625 15.0141 10.1391 15.9375 9 15.9375C7.86091 15.9375 6.9375 15.0141 6.9375 13.875C6.9375 12.7359 7.86091 11.8125 9 11.8125C10.1391 11.8125 11.0625 12.7359 11.0625 13.875Z" stroke="#473BAB" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkflowStatus = 'active' | 'inactive';

type ConfigMethod = 'prompt-based' | 'rules-workflow';

interface OfferReplacementWorkflow {
  id: string;
  name: string;
  steps: WorkflowStepConfig[];
  accountIds: string[];
  status: WorkflowStatus;
  approvalRequirement: ApprovalRequirement;
  configMethod: ConfigMethod;
}

const CONFIG_METHOD_LABELS: Record<ConfigMethod, string> = {
  'prompt-based': 'Prompt-Based',
  'rules-workflow': 'Rules-Based',
};

interface DealerAccount {
  id: string;
  name: string;
  brand: 'BMW' | 'Honda' | 'Toyota';
}

// ── Mock accounts — dealerships across the US, mixed brands ────────────────────

const ACCOUNTS: DealerAccount[] = [
  { id: 'acc-1', name: 'Advantage BMW Midtown', brand: 'BMW' },
  { id: 'acc-2', name: 'BMW of Akron', brand: 'BMW' },
  { id: 'acc-3', name: 'BMW of Annapolis', brand: 'BMW' },
  { id: 'acc-4', name: 'BMW of Bloomington', brand: 'BMW' },
  { id: 'acc-5', name: 'BMW of Columbia', brand: 'BMW' },
  { id: 'acc-6', name: 'BMW of Devon', brand: 'BMW' },
  { id: 'acc-7', name: 'BMW of El Cajon', brand: 'BMW' },
  { id: 'acc-8', name: 'BMW of Fresno', brand: 'BMW' },
  { id: 'acc-9', name: 'BMW of Georgetown', brand: 'BMW' },
  { id: 'acc-10', name: 'BMW of Houston North', brand: 'BMW' },
  { id: 'acc-11', name: 'BMW of Ontario', brand: 'BMW' },
  { id: 'acc-12', name: 'BMW of Palm Springs', brand: 'BMW' },
  { id: 'acc-13', name: 'BMW of Rockville', brand: 'BMW' },
  { id: 'acc-14', name: 'BMW of Sterling', brand: 'BMW' },
  { id: 'acc-15', name: 'BMW of Tucson', brand: 'BMW' },
  { id: 'acc-16', name: 'Honda of Austin', brand: 'Honda' },
  { id: 'acc-17', name: 'Honda of Bellevue', brand: 'Honda' },
  { id: 'acc-18', name: 'Honda of Charlotte', brand: 'Honda' },
  { id: 'acc-19', name: 'Honda of Chicago', brand: 'Honda' },
  { id: 'acc-20', name: 'Honda of Columbus', brand: 'Honda' },
  { id: 'acc-21', name: 'Honda of Denver', brand: 'Honda' },
  { id: 'acc-22', name: 'Honda of Downtown LA', brand: 'Honda' },
  { id: 'acc-23', name: 'Honda of Kirkland', brand: 'Honda' },
  { id: 'acc-24', name: 'Honda of Miami', brand: 'Honda' },
  { id: 'acc-25', name: 'Honda of Nashua', brand: 'Honda' },
  { id: 'acc-26', name: 'Honda of Ocala', brand: 'Honda' },
  { id: 'acc-27', name: 'Honda of Pasadena', brand: 'Honda' },
  { id: 'acc-28', name: 'Honda of Seattle', brand: 'Honda' },
  { id: 'acc-29', name: 'Honda of Slidell', brand: 'Honda' },
  { id: 'acc-30', name: 'Honda of Superstition Springs', brand: 'Honda' },
  { id: 'acc-31', name: 'Toyota of Bellevue', brand: 'Toyota' },
  { id: 'acc-32', name: 'Toyota of Boerne', brand: 'Toyota' },
  { id: 'acc-33', name: 'Toyota of Cedar Park', brand: 'Toyota' },
  { id: 'acc-34', name: 'Toyota of Clermont', brand: 'Toyota' },
  { id: 'acc-35', name: 'Toyota of Dallas', brand: 'Toyota' },
  { id: 'acc-36', name: 'Toyota of Denton', brand: 'Toyota' },
  { id: 'acc-37', name: 'Toyota of Greenville', brand: 'Toyota' },
  { id: 'acc-38', name: 'Toyota of Nashville', brand: 'Toyota' },
  { id: 'acc-39', name: 'Toyota of Orlando', brand: 'Toyota' },
  { id: 'acc-40', name: 'Toyota of Portland', brand: 'Toyota' },
  { id: 'acc-41', name: 'Toyota of Renton', brand: 'Toyota' },
  { id: 'acc-42', name: 'Toyota of Sacramento', brand: 'Toyota' },
  { id: 'acc-43', name: 'Toyota of Santa Fe', brand: 'Toyota' },
  { id: 'acc-44', name: 'Toyota of Tampa Bay', brand: 'Toyota' },
  { id: 'acc-45', name: 'Toyota of Whittier', brand: 'Toyota' },
];

const BMW_ACCOUNT_IDS = ACCOUNTS.filter((a) => a.brand === 'BMW').map((a) => a.id);
const ALL_ACCOUNT_IDS = ACCOUNTS.map((a) => a.id);

const accountById = (id: string) => ACCOUNTS.find((a) => a.id === id);

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
    approvalRequirement: 'request-approval',
    configMethod: 'rules-workflow',
  },
  {
    id: 'wf-2',
    name: 'High end brands',
    steps: HIGH_END_BRANDS_STEPS,
    accountIds: BMW_ACCOUNT_IDS.slice(0, 12),
    status: 'active',
    approvalRequirement: 'request-approval',
    configMethod: 'rules-workflow',
  },
  {
    id: 'wf-3',
    name: 'Specials events',
    steps: SPECIALS_EVENTS_STEPS,
    accountIds: ALL_ACCOUNT_IDS.slice(3, 45),
    status: 'active',
    approvalRequirement: 'request-approval',
    configMethod: 'rules-workflow',
  },
];

const emptyDraft = (): Omit<OfferReplacementWorkflow, 'id'> => ({
  name: '',
  accountIds: [],
  status: 'active',
  approvalRequirement: 'request-approval',
  configMethod: 'rules-workflow',
  steps: [],
});

const DEFAULT_PROMPT_TEXT = `Scan the account's inventory for all offers marked "Out of Stock" and replace each with an active, in-stock offer from the same account, following this priority order:
1) Match the same YMMT (Year, Make, Model, Trim) as the out-of-stock vehicle
2) Require the same offer type (Lease, Finance, Purchase, etc.) as the original
3) Among qualifying candidates, prioritize the highest PVI (Price Vehicle Indicator) score while keeping MSRP within ±$500 of the original offer's MSRP
4) As a final tiebreaker, prefer the vehicle with the longest time on lot

If no candidate meets all criteria, apply fallbacks in order: first relax the MSRP tolerance, then broaden the search to a different trim within the same Make/Model. If still no eligible replacement exists after exhausting all fallbacks, pause the affected offer and send an email notification to the owners of the Project and the Offers Task associated with that out-of-stock offer.`;

// ── Small building blocks ────────────────────────────────────────────────────

function StatusChip({ status }: { status: WorkflowStatus }) {
  const active = status === 'active';
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px 3px 6px', borderRadius: 8,
        background: active ? '#e8f5e9' : '#f0f2f4',
        color: active ? '#1b5e20' : '#686576',
        fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400, letterSpacing: '0.4px',
        whiteSpace: 'nowrap',
      }}
    >
      {active ? <CheckCircle style={{ fontSize: 14 }} /> : <RadioButtonUnchecked style={{ fontSize: 14 }} />}
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function AccountsChip({ count }: { count: number }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 8px', borderRadius: 8,
        background: '#f0f2f4', color: '#1f1d25',
        fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, letterSpacing: '0.17px',
        whiteSpace: 'nowrap',
      }}
    >
      {count} Accounts
    </span>
  );
}

const radioSx = {
  color: '#9c99a9',
  padding: '4px',
  '&.Mui-checked': { color: '#473bab' },
};

function ManageWorkflowButton({ onClick, fullWidth }: { onClick?: (e: React.MouseEvent) => void; fullWidth?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '4px 14px', borderRadius: 100,
        border: '1px solid rgba(99,86,225,0.5)', background: 'transparent',
        color: '#473bab', fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
        letterSpacing: '0.46px', cursor: 'pointer', whiteSpace: 'nowrap',
        width: fullWidth ? '100%' : undefined,
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<OfferReplacementWorkflow, 'id'>>(emptyDraft());
  const [promptText, setPromptText] = useState(DEFAULT_PROMPT_TEXT);
  const [manageDialog, setManageDialog] = useState<{
    workflowName: string;
    steps: WorkflowStepConfig[];
    onSave: (steps: WorkflowStepConfig[]) => void;
  } | null>(null);

  const selectedWorkflow = selectedId ? workflows.find((w) => w.id === selectedId) ?? null : null;

  const currentApprovalRequirement = APPROVAL_REQUIREMENTS.find((a) => a.value === draft.approvalRequirement);

  useEffect(() => {
    if (selectedWorkflow) {
      setDraft({
        name: selectedWorkflow.name,
        accountIds: selectedWorkflow.accountIds,
        status: selectedWorkflow.status,
        approvalRequirement: selectedWorkflow.approvalRequirement,
        configMethod: selectedWorkflow.configMethod,
        steps: selectedWorkflow.steps,
      });
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const openForRow = (workflow: OfferReplacementWorkflow) => {
    setSelectedId(workflow.id);
    setDraft({
      name: workflow.name, accountIds: workflow.accountIds, status: workflow.status,
      approvalRequirement: workflow.approvalRequirement, configMethod: workflow.configMethod, steps: workflow.steps,
    });
    setPromptText(DEFAULT_PROMPT_TEXT);
    setPanelOpen(true);
  };

  const openForNew = () => {
    setSelectedId(null);
    setDraft(emptyDraft());
    setPromptText(DEFAULT_PROMPT_TEXT);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedId(null);
    setDraft(emptyDraft());
    setPromptText(DEFAULT_PROMPT_TEXT);
  };

  const handleSave = () => {
    if (selectedId) {
      setWorkflows((prev) => prev.map((w) => (w.id === selectedId ? { ...w, ...draft } : w)));
    } else {
      const newWorkflow: OfferReplacementWorkflow = {
        id: `wf-${Date.now()}`,
        ...draft,
      };
      setWorkflows((prev) => [...prev, newWorkflow]);
    }
    closePanel();
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
                  {['Name', 'Replacement Method', 'Approval Requirement', 'Accounts', 'Status'].map((col) => (
                    <TableCell
                      key={col}
                      sx={{ fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', borderBottom: '1px solid #f0f0f0' }}
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {workflows.map((wf) => {
                  const isSelected = panelOpen && selectedId === wf.id;
                  return (
                    <TableRow
                      key={wf.id}
                      hover
                      onClick={() => openForRow(wf)}
                      sx={{
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(99,86,225,0.08)' : 'transparent',
                        '& td': { borderBottom: '1px solid #f0f0f0' },
                      }}
                    >
                      <TableCell sx={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
                        {wf.name}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
                        {CONFIG_METHOD_LABELS[wf.configMethod]}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
                        {APPROVAL_REQUIREMENTS.find((a) => a.value === wf.approvalRequirement)?.label ?? wf.approvalRequirement}
                      </TableCell>
                      <TableCell>
                        <AccountsChip count={wf.accountIds.length} />
                      </TableCell>
                      <TableCell>
                        <StatusChip status={wf.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>

      {/* ── Right panel — Edit Workflow Configurations ──────────────── */}
      {panelOpen && (
        <div
          className="flex flex-col shrink-0 overflow-hidden"
          style={{ width: 320, background: '#ffffff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0,
          }}>
            <span style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
              Edit Workflow Configurations
            </span>
            <IconButton size="small" onClick={closePanel} sx={{ padding: '4px' }}>
              <Close style={{ fontSize: 18, color: '#686576' }} />
            </IconButton>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AppTextField
              label="Workflow Name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />

            <FormControl size="small" fullWidth>
              <InputLabel sx={{ fontSize: 13 }}>Status</InputLabel>
              <Select
                label="Status"
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as WorkflowStatus }))}
                renderValue={(value) => <StatusChip status={value as WorkflowStatus} />}
                sx={{ fontSize: 14 }}
              >
                <MenuItem value="active"><StatusChip status="active" /></MenuItem>
                <MenuItem value="inactive"><StatusChip status="inactive" /></MenuItem>
              </Select>
            </FormControl>

            <div>
              <FormControl size="small" fullWidth>
                <InputLabel sx={{ fontSize: 13 }}>Approval Requirement</InputLabel>
                <Select
                  label="Approval Requirement"
                  value={draft.approvalRequirement}
                  onChange={(e) => setDraft((d) => ({ ...d, approvalRequirement: e.target.value as ApprovalRequirement }))}
                  sx={{ fontSize: 14 }}
                >
                  {APPROVAL_REQUIREMENTS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 14 }}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {currentApprovalRequirement && (
                <div style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', marginTop: 6 }}>
                  {currentApprovalRequirement.helper}
                </div>
              )}
            </div>

            <Autocomplete
              multiple
              size="small"
              limitTags={3}
              options={ACCOUNTS}
              getOptionLabel={(opt) => opt.name}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              value={draft.accountIds.map(accountById).filter((a): a is DealerAccount => !!a)}
              onChange={(_, newValue) => setDraft((d) => ({ ...d, accountIds: newValue.map((a) => a.id) }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Accounts"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: 13 },
                    '& .MuiOutlinedInput-input': { fontSize: 14 },
                    '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#473bab' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#473bab' },
                  }}
                />
              )}
            />

            <div>
              <RadioGroup
                row
                value={draft.configMethod}
                onChange={(e) => setDraft((d) => ({ ...d, configMethod: e.target.value as ConfigMethod }))}
                style={{ marginBottom: 12 }}
              >
                <FormControlLabel
                  value="prompt-based"
                  control={<Radio size="small" sx={radioSx} />}
                  label="Prompt-Based"
                  sx={{ '& .MuiFormControlLabel-label': { fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' } }}
                />
                <FormControlLabel
                  value="rules-workflow"
                  control={<Radio size="small" sx={radioSx} />}
                  label="Rules-Based"
                  sx={{ '& .MuiFormControlLabel-label': { fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' } }}
                />
              </RadioGroup>

              {draft.configMethod === 'prompt-based' ? (
                <TextField
                  label="Prompt"
                  multiline
                  minRows={4}
                  fullWidth
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: 13 },
                    '& .MuiOutlinedInput-input': { fontSize: 14 },
                    '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#473bab' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#473bab' },
                  }}
                />
              ) : (
                <ManageWorkflowButton
                  fullWidth
                  onClick={() => {
                    setManageDialog({
                      workflowName: draft.name || 'New Workflow',
                      steps: draft.steps,
                      onSave: (steps) => setDraft((d) => ({ ...d, steps })),
                    });
                  }}
                />
              )}
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
            padding: '12px 16px', borderTop: '1px solid #f0f0f0', flexShrink: 0,
          }}>
            <button
              onClick={closePanel}
              style={{
                padding: '6px 20px', borderRadius: 100,
                border: '1px solid #473bab', background: 'transparent',
                color: '#473bab', fontSize: 14, fontWeight: 500,
                fontFamily: 'Roboto, sans-serif', cursor: 'pointer', letterSpacing: '0.4px',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!draft.name.trim()}
              style={{
                padding: '6px 20px', borderRadius: 100,
                border: 'none', background: draft.name.trim() ? '#473bab' : '#cac9cf',
                color: '#ffffff', fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
                cursor: draft.name.trim() ? 'pointer' : 'default', letterSpacing: '0.4px',
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {manageDialog && (
        <ManageWorkflowDialog
          workflowName={manageDialog.workflowName}
          initialSteps={manageDialog.steps}
          onClose={() => setManageDialog(null)}
          onSave={(steps) => {
            manageDialog.onSave(steps);
            setManageDialog(null);
          }}
        />
      )}
    </div>
  );
};
