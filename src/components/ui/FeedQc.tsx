import { useState } from 'react';
import { Button, Checkbox, FormControlLabel } from '@mui/material';
import { useSnackbar } from '../../context/SnackbarContext';

const DownloadIcon = () => (
  <svg width={12} height={15} viewBox="0 0 12.25 15.25" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.875 0.875V4.625C6.875 5.03921 7.21079 5.375 7.625 5.375H11.375M3.5 11.75V10.25M6.125 11.75V8M8.75 11.75V9.5M1.25 0.5H6.56434C6.76325 0.5 6.95402 0.579018 7.09467 0.71967L11.5303 5.15533C11.671 5.29598 11.75 5.48675 11.75 5.68566V14C11.75 14.4142 11.4142 14.75 11 14.75H1.25C0.835786 14.75 0.5 14.4142 0.5 14V1.25C0.5 0.835786 0.835786 0.5 1.25 0.5Z"
      stroke="white"
      strokeLinecap="round"
    />
  </svg>
);

/** "Feed QC" control cluster — CSV export plus the campaign feed's QC approval checkbox. */
export const FeedQc = () => {
  const [approved, setApproved] = useState(false);
  const { showSnackbar } = useSnackbar();

  const handleApprovalChange = (checked: boolean) => {
    setApproved(checked);
    showSnackbar({
      message: checked ? 'Campaign feed contents approved.' : 'Campaign feed approval revoked.',
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: '#f4f5f6',
        borderRadius: 12,
        padding: '4px 8px',
      }}
    >
      <Button
        variant="contained"
        disableElevation
        size="small"
        startIcon={<DownloadIcon />}
        sx={{
          background: '#473bab',
          color: '#ffffff',
          borderRadius: '100px',
          padding: '4px 10px',
          fontSize: 13,
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 500,
          lineHeight: '22px',
          letterSpacing: '0.46px',
          textTransform: 'none',
          whiteSpace: 'nowrap',
          '&:hover': { background: '#3d3396', boxShadow: 'none' },
        }}
      >
        Download CSV Feed
      </Button>
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={approved}
            onChange={(e) => handleApprovalChange(e.target.checked)}
          />
        }
        label="Feed QC Approved"
        sx={{
          margin: 0,
          whiteSpace: 'nowrap',
          '& .MuiFormControlLabel-label': {
            fontSize: 12,
            fontFamily: 'Roboto, sans-serif',
            color: '#1f1d25',
            letterSpacing: '0.17px',
            lineHeight: 1.43,
          },
        }}
      />
    </div>
  );
};
