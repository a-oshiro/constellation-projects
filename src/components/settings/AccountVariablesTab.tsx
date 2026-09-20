import { Breadcrumbs } from '../layout/Breadcrumbs';

/** No real custom-variables persistence layer in this app — same caveat as `ProjectContentsPanel`'s
 * Custom Variables section, whose one CTA variable this mirrors at the account level. */
const ACCOUNT_VARIABLES: { name: string; type: string; defaultValue: string }[] = [
  { name: 'CTA', type: 'Text', defaultValue: 'VIEW INVENTORY' },
];

const colStyle: React.CSSProperties = { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const colHeaderStyle: React.CSSProperties = { ...colStyle, fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#686576', letterSpacing: '0.4px', textTransform: 'uppercase' };
const cellStyle: React.CSSProperties = { ...colStyle, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' };

interface AccountVariablesTabProps {
  accountName: string;
}

export const AccountVariablesTab = ({ accountName }: AccountVariablesTabProps) => (
  <div style={{
    flex: 1, minWidth: 0, background: '#ffffff', borderRadius: 16, overflow: 'hidden',
    display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  }}>
    <div style={{ padding: '10px 16px 0', flexShrink: 0 }}>
      <Breadcrumbs items={['Settings', 'Accounts', accountName, 'Account Variables']} />
    </div>
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
        Account Variables
      </h2>
      <p style={{ margin: '0 0 20px', fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', maxWidth: 560 }}>
        Named values this account's templates can reference in place of hardcoded text, e.g. a shared CTA.
      </p>
      <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, overflow: 'hidden', maxWidth: 640 }}>
        <div style={{ display: 'flex', gap: 12, padding: '8px 12px', background: '#f4f5f6' }}>
          <span style={colHeaderStyle}>Name</span>
          <span style={colHeaderStyle}>Type</span>
          <span style={colHeaderStyle}>Default Value</span>
        </div>
        {ACCOUNT_VARIABLES.map((v) => (
          <div key={v.name} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <span style={cellStyle}>{v.name}</span>
            <span style={cellStyle}>{v.type}</span>
            <span style={cellStyle}>{v.defaultValue}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);
