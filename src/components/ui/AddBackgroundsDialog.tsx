import type { Background, Template } from '../../data/types';
import { PortalPickerDialog } from './PortalPickerDialog';

/** One background on offer, and how many of the selected projects it would reach. */
export interface BackgroundOption {
  background: Background;
  /** What the picture is called: its collection. */
  name: string;
  template: Template;
  /** Projects that have this size and do not have the background yet. */
  reaches: number;
  /** Projects that have this size at all. */
  withSize: number;
  projectCount: number;
}

interface Props {
  options: BackgroundOption[];
  onClose: () => void;
  onAdd: (backgroundIds: string[]) => void;
}

/** The Add Templates dialog, filled with individual backgrounds. A background goes only to the selected
 *  projects that have a template of its size, so there is no "add to all". */
export function AddBackgroundsDialog({ options, onClose, onAdd }: Props) {
  return (
    <PortalPickerDialog
      title="Add Backgrounds" filterLabel="Sizes" emptyText="No backgrounds found."
      info="Only sizes of the selected projects' templates are listed. A background is added to the projects that have a template of its size."
      onClose={onClose} onAdd={onAdd}
      items={options.map((o) => {
        const { template } = o;
        const partial = o.reaches < o.projectCount;
        return {
          id: o.background.id, title: o.name, subtitle: `Image | ${template.width} x ${template.height}`,
          preview: { src: o.background.url, width: template.width, height: template.height },
          tags: [template.brand, 'background'], folder: `${template.brand} Global Backgrounds`,
          group: `${template.width} x ${template.height}`,
          note: {
            partial,
            text: partial
              ? `Reaches ${o.reaches} of ${o.projectCount} projects \u2014 only those with a ${template.width} x ${template.height} template`
              : `Reaches all ${o.projectCount} project${o.projectCount === 1 ? '' : 's'}`,
          },
        };
      })}
    />
  );
}
