import type { LifestyleItem } from '../../data/lifestyle';
import { PortalPickerDialog } from './PortalPickerDialog';

interface Props {
  /** The lifestyle media no selected project carries yet. */
  items: LifestyleItem[];
  onClose: () => void;
  onAdd: (ids: string[]) => void;
}

/** The Add Templates dialog, filled with lifestyle images and videos. */
export function AddLifestyleDialog({ items, onClose, onAdd }: Props) {
  return (
    <PortalPickerDialog
      title="Add Lifestyle" filterLabel="Vehicles" emptyText="Every lifestyle item is already on the list."
      info="Lifestyle media shows a specific vehicle, so it is matched to offers of that model."
      onClose={onClose} onAdd={onAdd}
      items={items.map((l) => ({
        id: l.id, title: l.name,
        subtitle: `${l.width} x ${l.height} | ${l.kind === 'video' ? 'Video' : 'Image'}`,
        preview: { src: l.poster, width: l.width, height: l.height, video: l.kind === 'video' },
        tags: ['BMW', 'lifestyle'], folder: 'BMW Global Lifestyle', group: l.model,
      }))}
    />
  );
}
