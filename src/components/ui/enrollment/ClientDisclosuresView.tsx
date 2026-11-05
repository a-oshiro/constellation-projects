import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Button, IconButton } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import { disclosureSubmissionNotificationId } from '../../../data/enrollmentSettings';
import type { DisclosureBlock, EnrollmentSettings } from '../../../data/enrollmentSettings';
import { useNotifications } from '../../../context/notifications';
import { useSnackbar } from '../../../context/SnackbarContext';
import { HeaderTag, MaskedIcon } from './DisclosureUi';
import {
  BODY2_SECONDARY_STYLE, CONTAINED_MEDIUM_BUTTON_SX, SECTION_CARD_STYLE, TEXT_MEDIUM_BUTTON_SX,
} from './disclosureStyles';
import type { TagTone } from './disclosureStyles';
import chevronTopIcon from '../../../assets/icons/disclosures/chevron-top-small.svg';
import refreshIcon from '../../../assets/icons/disclosures/refresh.svg';

/**
 * The Disclosures page as a client user sees it (Figma: "Client + Internal User Workflow"): just the raw
 * disclosure text per type — no snippet or templates. Edits stay local until "Submit Disclosures", which
 * hands the changed types to Constellation for review and notifies internal users. While a submission is
 * pending the text is locked; "Cancel Submission" takes it back.
 */

interface ClientDisclosuresViewProps {
  settings: EnrollmentSettings;
  onChange: (patch: Partial<EnrollmentSettings>) => void;
  accountId: string;
  accountName: string;
}

const CLIENT_STATUS_TAGS: Partial<Record<DisclosureBlock['clientStatus'], { label: string; tone: TagTone }>> = {
  submitted: { label: 'Submitted', tone: 'gray' },
  updates_requested: { label: 'Updates Requested', tone: 'orange' },
  applied: { label: 'Applied to offers', tone: 'green' },
};

const TEXTAREA_STYLE: CSSProperties = {
  width: '100%', minHeight: 140, boxSizing: 'border-box', resize: 'vertical', padding: '8px 10px',
  border: '1px solid rgba(0,0,0,0.23)', borderRadius: 4, outline: 'none',
  fontFamily: 'Roboto, sans-serif', fontSize: 12, lineHeight: 1.43, letterSpacing: '0.17px', color: '#1f1d25',
};

export const ClientDisclosuresView = ({ settings, onChange, accountId, accountName }: ClientDisclosuresViewProps) => {
  const { notify, dismiss } = useNotifications();
  const { showSnackbar } = useSnackbar();
  const disclosures = settings.disclosures;

  const [drafts, setDrafts] = useState<Record<string, string>>(() => Object.fromEntries(disclosures.map((d) => [d.id, d.text])));
  const [expandedId, setExpandedId] = useState<DisclosureBlock['id'] | null>(
    () => (disclosures.find((d) => d.clientStatus === 'updates_requested') ?? disclosures.find((d) => d.text.trim() !== ''))?.id ?? 'lease',
  );

  const draftOf = (d: DisclosureBlock) => drafts[d.id] ?? d.text;
  const changed = disclosures.filter((d) => draftOf(d).trim() !== d.text.trim());
  const canSubmit = changed.some((d) => draftOf(d).trim() !== '');
  const pending = disclosures.some((d) => d.clientStatus === 'submitted');
  const everSubmitted = disclosures.some((d) => d.clientStatus !== 'none');

  const handleSubmit = () => {
    const next = disclosures.map((d): DisclosureBlock => {
      if (!changed.includes(d)) return d;
      const text = draftOf(d);
      // A cleared disclosure is withdrawn rather than submitted.
      if (text.trim() === '') return { ...d, text: '', template: null, clientStatus: 'none' };
      return {
        ...d, text, template: null, includeInSnippet: true, addedBy: 'client', clientStatus: 'submitted',
        clientStatusBeforeSubmit: d.clientStatus === 'submitted' ? d.clientStatusBeforeSubmit : d.clientStatus,
      };
    });
    onChange({ disclosures: next });
    notify({
      id: disclosureSubmissionNotificationId(accountId),
      audience: 'internal',
      source: 'Disclosure Builder',
      title: 'New Client-Submitted Disclosure. Snippet generation pending.',
      tags: ['Client Settings', accountName],
      href: `/settings/accounts/${accountId}/enrollment-fees-disclosures`,
    });
    setExpandedId(null);
  };

  const handleCancelSubmission = () => {
    onChange({
      disclosures: disclosures.map((d) => (
        d.clientStatus === 'submitted' ? { ...d, clientStatus: d.clientStatusBeforeSubmit ?? 'none', clientStatusBeforeSubmit: undefined } : d
      )),
    });
    dismiss(disclosureSubmissionNotificationId(accountId));
    showSnackbar({ message: 'Submission canceled.' });
  };

  const handleDiscard = () => setDrafts(Object.fromEntries(disclosures.map((d) => [d.id, d.text])));

  let footer: ReactNode;
  if (pending) {
    footer = (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '6px 8px 6px 16px', borderRadius: 8,
        background: '#e5f2fa', color: '#01579b', fontSize: 12, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.17px',
      }}>
        <InfoOutlined style={{ fontSize: 20, color: '#0288d1' }} />
        <span style={{ flex: 1, minWidth: 0 }}>Disclosure submitted. A Constellation team member was notified to review it.</span>
        <Button variant="text" onClick={handleCancelSubmission} sx={{ ...TEXT_MEDIUM_BUTTON_SX, fontSize: 13 }}>
          Cancel Submission
        </Button>
      </div>
    );
  } else {
    footer = (
      <>
        <p style={{ ...BODY2_SECONDARY_STYLE, flex: 1, minWidth: 0 }}>
          {everSubmitted ? 'Add or edit disclosures and submit for Constellation review.' : 'Add disclosures and submit for Constellation review.'}
        </p>
        {everSubmitted && (
          <Button
            variant="text"
            disabled={changed.length === 0}
            onClick={handleDiscard}
            sx={{ ...TEXT_MEDIUM_BUTTON_SX, '&.Mui-disabled': { color: 'rgba(17,16,20,0.38)' } }}
          >
            Discard Changes
          </Button>
        )}
        <Button
          variant="contained"
          disableElevation
          disabled={!canSubmit}
          onClick={handleSubmit}
          startIcon={everSubmitted ? <MaskedIcon src={refreshIcon} size={20} color="currentColor" /> : undefined}
          sx={CONTAINED_MEDIUM_BUTTON_SX}
        >
          {everSubmitted ? 'Resubmit Disclosures' : 'Submit Disclosures'}
        </Button>
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {disclosures.map((d) => {
          const expanded = expandedId === d.id;
          const tag = CLIENT_STATUS_TAGS[d.clientStatus];
          const toggle = () => setExpandedId((prev) => (prev === d.id ? null : d.id));
          return (
            <div key={d.id} style={{ ...SECTION_CARD_STYLE, gap: 12 }}>
              <div
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                onClick={toggle}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 30, cursor: 'pointer', outline: 'none' }}
              >
                <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px', lineHeight: 1.57 }}>
                  {d.label}
                </span>
                {tag && <HeaderTag {...tag} />}
                <span style={{ flex: 1 }} />
                <IconButton aria-label={expanded ? `Collapse ${d.label}` : `Expand ${d.label}`} tabIndex={-1} sx={{ padding: '5px' }}>
                  <img
                    src={chevronTopIcon}
                    width={20}
                    height={20}
                    alt=""
                    style={{ transform: expanded ? 'none' : 'rotate(180deg)', transition: 'transform 0.15s ease' }}
                  />
                </IconButton>
              </div>
              {expanded && (
                <textarea
                  aria-label={`${d.label} disclosure`}
                  value={draftOf(d)}
                  readOnly={pending}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [d.id]: e.target.value }))}
                  placeholder={`Paste your ${d.label} disclosure here.`}
                  style={{ ...TEXTAREA_STYLE, background: pending ? '#f9fafa' : '#ffffff' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Stays pinned to the bottom of the page's scroll area, like the internal view's snippet actions. */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 2, margin: '0 -16px', marginTop: 'auto',
        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
        background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.12)',
      }}>
        {footer}
      </div>
    </div>
  );
};
