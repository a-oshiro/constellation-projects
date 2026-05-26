import React from 'react';
import { NavigateNext } from '@mui/icons-material';

interface BreadcrumbsProps {
  items: string[];
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const isFirst = i === 0;

        return (
          <React.Fragment key={item}>
            <span
              style={{
                fontSize: isFirst || isLast ? 11 : 12,
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 400,
                color: isLast ? '#1f1d25' : '#686576',
                letterSpacing: isFirst || isLast ? '0.4px' : '0.17px',
                lineHeight: isFirst || isLast ? 1.66 : 1.43,
                cursor: isLast ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {item}
            </span>
            {!isLast && (
              <NavigateNext style={{ fontSize: 14, color: '#9e9e9e', flexShrink: 0 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
