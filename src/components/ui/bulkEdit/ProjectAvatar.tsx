const FONT = 'Roboto, sans-serif';
const AVATAR_COLORS = ['#473bab', '#0f7b6c', '#b4540a', '#4e6fa8', '#8f4a9c', '#c2473a', '#5a7d2a', '#2b2b33'];

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const colorOf = (key: string) => AVATAR_COLORS[[...key].reduce((h, c) => h + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

/** A project's initials on a colour that is stable per project. `ghost` draws it as a dashed ring, for a project that lacks something. */
export const ProjectAvatar = ({ name, id, size = 24, ring, ghost }: { name: string; id: string; size?: number; ring?: boolean; ghost?: boolean }) => (
  <span aria-hidden="true" style={{
    width: size, height: size, borderRadius: '50%', fontSize: size <= 24 ? 10 : 11, fontWeight: 500, fontFamily: FONT,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box',
    ...(ghost ? { border: '1.5px dashed #b9b5c8', color: '#8c8999' } : { background: colorOf(id), color: '#fff' }),
    ...(ring ? { border: '2px solid #fff' } : {}),
  }}>{initialsOf(name)}</span>
);
