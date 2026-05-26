import { Tooltip as MuiTooltip, tooltipClasses } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { TooltipProps as MuiTooltipProps } from '@mui/material';

const StyledTooltip = styled(({ className, ...props }: MuiTooltipProps) => (
  <MuiTooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: 'rgba(97,97,97,0.9)',
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 500,
    lineHeight: '14px',
    borderRadius: 4,
    padding: '4px 8px',
    letterSpacing: 0,
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: 'rgba(97,97,97,0.9)',
  },
});

export type TooltipProps = MuiTooltipProps;

export const Tooltip = (props: MuiTooltipProps) => (
  <StyledTooltip arrow {...props} />
);
