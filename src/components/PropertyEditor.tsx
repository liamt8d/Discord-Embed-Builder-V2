import { uid } from '../lib/utils';

interface Props {
  node: any | null;
  onChange: (patch: any) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

// ─── sub-editors ──────────────────────────────────────────────────────────────

const TEXT_LIMIT = 4000;

function TextEditor({ node, onChange }: { node: any; onChange: (p: any) => void }) {
  const len = (node.content ?? '').length;
  const over = len > TEXT_LIMIT;
  const warn = !over && len > TEXT_LIMIT * 0.85;
  return (
    <div className="props-section">
      <Field label="Contenido">
        <textarea value={node.content ?? ''} rows={6} onChange={e => onChange({ content: e.target.value })}
          style={over ? { borderColor: '#ed4245' } : warn ? { borderColor: '#fcc419' } : undefined} />
        <div style={{ textAlign: 'right', fontSize: 11, marginTop: 3,
          color: over ? '#ed4245' : warn ? '#fcc419' : '#5c5f66' }}>
          {len} / {TEXT_LIMIT}{over ? ' — límite superado' : ''}
        </div>
      </Field>
    </div>
  );
}

function DividerEditor({ node, onChange }: { node: any; onChange: (p: any) => void }) {
  return (
    <div className="props-section">
      <Field label="Espaciado">
        <select value={node.spacing ?? 1} onChange={e => onChange({ spacing: Number(e.target.value) })}>
          <option value={1}>Normal (1)</option>
          <option value={2}>Grande (2)</option>
        </select>
      </Field>
      <Field label="Línea visible">
        <select value={node.divider ? 'true' : 'false'} onChange={e => onChange({ divider: e.target.value === 'true' })}>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>
      </Field>
    </div>
  );
}

function ThumbnailEditor({ node, onChange }: { node: any; onChange: (p: any) => void }) {
  return (
    <div className="props-section">
      <Field label="URL de imagen">
        <input value={node.media?.url ?? ''} placeholder="https://..." onChange={e => onChange({ media: { url: e.target.value } })} />
      </Field>
      <Field label="Descripción (alt)">
        <input value={node.description ?? ''} onChange={e => onChange({ description: e.target.value || null })} />
      </Field>
    </div>
  );
}

function SectionEditor({ node, onChange }: { node: any; onChange: (p: any) => void }) {
  const acc = node.accessory;
  return (
    <div className="props-section">
      <div className="props-title">Accesorio</div>
      <div className="row">
        <button className={`btn-secondary ${!acc ? 'btn-primary' : ''}`} onClick={() => onChange({ accessory: undefined })}>Ninguno</button>
        <button className={`btn-secondary ${acc?.type === 11 ? 'btn-primary' : ''}`}
          onClick={() => onChange({ accessory: { _id: uid(), type: 11, media: { url: '' }, description: null, spoiler: false } })}>Thumbnail</button>
        <button className={`btn-secondary ${acc?.type === 2 ? 'btn-primary' : ''}`}
          onClick={() => onChange({ accessory: { _id: uid(), type: 2, style: 1, label: 'Button', custom_id: `btn_${uid()}` } })}>Botón</button>
      </div>
      {acc && <small>Selecciona el accesorio en el árbol para editarlo.</small>}
    </div>
  );
}

function GalleryEditor({ node, onChange }: { node: any; onChange: (p: any) => void }) {
  const items: any[] = node.items ?? [];
  const setItem = (i: number, patch: any) => {
    const next = items.map((it: any, j: number) => j === i ? { ...it, ...patch } : it);
    onChange({ items: next });
  };
  const addItem = () => onChange({ items: [...items, { media: { url: '' }, spoiler: false }] });
  const removeItem = (i: number) => onChange({ items: items.filter((_: any, j: number) => j !== i) });

  return (
    <div className="props-section">
      <div className="row">
        <div className="props-title grow">Imágenes ({items.length}/10)</div>
        {items.length < 10 && <button className="btn-secondary" style={{ fontSize: 12, padding: '3px 8px' }} onClick={addItem}>+ Agregar</button>}
      </div>
      <div className="gallery-items">
        {items.map((it: any, i: number) => (
          <div key={i} className="gallery-item">
            <div className="gallery-item-header">
              <span>Imagen {i + 1}</span>
              <button className="btn-icon" style={{ color: '#c0392b' }} onClick={() => removeItem(i)}>✕</button>
            </div>
            <Field label="URL">
              <input value={it.media?.url ?? ''} placeholder="https://..." onChange={e => setItem(i, { media: { url: e.target.value } })} />
            </Field>
            <Field label="Descripción">
              <input value={it.description ?? ''} onChange={e => setItem(i, { description: e.target.value || undefined })} />
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
}

function ButtonEditor({ node, onChange }: { node: any; onChange: (p: any) => void }) {
  const STYLES = [
    { v: 1, label: 'Primary', bg: '#5865f2' },
    { v: 2, label: 'Secondary', bg: '#4e5058' },
    { v: 3, label: 'Success', bg: '#2d7d46' },
    { v: 4, label: 'Danger', bg: '#c0392b' },
    { v: 5, label: 'Link', bg: '#4e5058' },
  ];
  return (
    <div className="props-section">
      <Field label="Texto">
        <input value={node.label ?? ''} onChange={e => onChange({ label: e.target.value })} />
      </Field>
      <Field label="Estilo">
        <div className="row wrap">
          {STYLES.map(s => (
            <button key={s.v}
              style={{ background: s.bg, color: '#fff', padding: '4px 10px', fontSize: 12, opacity: node.style === s.v ? 1 : .45 }}
              onClick={() => onChange({ style: s.v })}>{s.label}</button>
          ))}
        </div>
      </Field>
      {node.style === 5
        ? <Field label="URL"><input value={node.url ?? ''} placeholder="https://..." onChange={e => onChange({ url: e.target.value, custom_id: undefined })} /></Field>
        : <Field label="Custom ID"><input value={node.custom_id ?? ''} onChange={e => onChange({ custom_id: e.target.value })} /></Field>
      }
      <Field label="Emoji (nombre)">
        <input value={node.emoji?.name ?? ''} placeholder="🎮 o nombre_emoji" onChange={e => onChange({ emoji: e.target.value ? { name: e.target.value } : undefined })} />
      </Field>
      <Field label="Deshabilitado">
        <select value={node.disabled ? 'true' : 'false'} onChange={e => onChange({ disabled: e.target.value === 'true' })}>
          <option value="false">No</option>
          <option value="true">Sí</option>
        </select>
      </Field>
    </div>
  );
}

const SEL_TYPE_INFO: Record<number, { label: string; hint: string }> = {
  3: { label: '≡ Texto (opciones custom)', hint: 'El usuario elige de una lista de opciones que tú defines.' },
  5: { label: '👤 Usuarios', hint: 'Muestra miembros del servidor para seleccionar.' },
  6: { label: '🎭 Roles', hint: 'Muestra roles del servidor. El bot puede asignar/quitar roles con la interacción.' },
  7: { label: '💬 Menciones', hint: 'Usuarios y roles combinados.' },
  8: { label: '# Canales', hint: 'Muestra canales del servidor para seleccionar.' },
};

function SelectMenuEditor({ node, onChange }: { node: any; onChange: (p: any) => void }) {
  const opts: any[] = node.options ?? [];
  const setOpt = (i: number, patch: any) => onChange({ options: opts.map((o: any, j: number) => j === i ? { ...o, ...patch } : o) });
  const addOpt = () => onChange({ options: [...opts, { label: 'Opción', value: `opt_${uid()}` }] });
  const removeOpt = (i: number) => onChange({ options: opts.filter((_: any, j: number) => j !== i) });
  const info = SEL_TYPE_INFO[node.type] ?? SEL_TYPE_INFO[3];
  const isString = node.type === 3;

  return (
    <div className="props-section">
      {/* Type selector */}
      <Field label="Tipo de select">
        <select value={node.type} onChange={e => onChange({ type: Number(e.target.value), options: [] })}>
          {Object.entries(SEL_TYPE_INFO).map(([t, { label }]) => (
            <option key={t} value={t}>{label}</option>
          ))}
        </select>
      </Field>
      <div style={{ background: 'rgba(88,101,242,.12)', borderRadius: 4, padding: '6px 10px', fontSize: 12, color: '#b5bac1', lineHeight: 1.4 }}>
        ℹ️ {info.hint}
        {(node.type === 6) && <><br/><strong style={{ color: '#57f287' }}>El bot necesita código para asignar/quitar roles al interactuar.</strong></>}
      </div>

      <Field label="Custom ID">
        <input value={node.custom_id ?? ''} onChange={e => onChange({ custom_id: e.target.value })} />
      </Field>
      <Field label="Placeholder">
        <input value={node.placeholder ?? ''} placeholder={isString ? 'Seleccionar…' : 'Seleccionar ' + (node.type === 6 ? 'rol…' : node.type === 5 ? 'usuario…' : '…')}
          onChange={e => onChange({ placeholder: e.target.value })} />
      </Field>
      <div className="row">
        <div className="field grow"><label>Mín.</label><input type="number" min={0} max={25} value={node.min_values ?? 1} onChange={e => onChange({ min_values: Number(e.target.value) })} /></div>
        <div className="field grow"><label>Máx.</label><input type="number" min={1} max={25} value={node.max_values ?? 1} onChange={e => onChange({ max_values: Number(e.target.value) })} /></div>
      </div>

      {/* String select options */}
      {isString && (
        <>
          <div className="row">
            <div className="props-title grow">Opciones ({opts.length}/25)</div>
            {opts.length < 25 && <button className="btn-secondary" style={{ fontSize: 12, padding: '3px 8px' }} onClick={addOpt}>+ Agregar</button>}
          </div>
          {!opts.length && <small style={{ color: '#ed4245' }}>⚠ Necesita al menos 1 opción para enviarse.</small>}
          <div className="options-list">
            {opts.map((o: any, i: number) => (
              <div key={i} className="option-item">
                <div className="option-item-header">
                  <span>Opción {i + 1}</span>
                  <button className="btn-icon" style={{ color: '#c0392b', opacity: 1, pointerEvents: 'auto' }} onClick={() => removeOpt(i)}>✕</button>
                </div>
                <Field label="Label"><input value={o.label ?? ''} onChange={e => setOpt(i, { label: e.target.value })} /></Field>
                <Field label="Value"><input value={o.value ?? ''} onChange={e => setOpt(i, { value: e.target.value })} /></Field>
                <Field label="Descripción"><input value={o.description ?? ''} onChange={e => setOpt(i, { description: e.target.value || undefined })} /></Field>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ActionRowEditor({ node, onChange }: { node: any; onChange: (p: any) => void }) {
  const kids: any[] = node.components ?? [];
  const hasButtons = kids.some((c: any) => c.type === 2);
  const hasSel = kids.some((c: any) => [3,5,6,7,8].includes(c.type));
  const conflict = hasButtons && hasSel;

  return (
    <div className="props-section">
      {conflict && (
        <div style={{ background: 'rgba(192,57,43,.2)', borderRadius: 4, padding: '6px 10px', fontSize: 12, color: '#ed4245' }}>
          ⚠ No puede tener botones y select menu al mismo tiempo. Elimina uno de los tipos.
        </div>
      )}
      <small>Usa el "+" en el árbol para agregar botones o select menus.</small>
      <small style={{ marginTop: 4 }}>
        Regla: máx. 5 botones <strong>OR</strong> 1 select menu por Action Row.
      </small>
    </div>
  );
}

function ContainerEditor({ node, onChange }: { node: any; onChange: (p: any) => void }) {
  const hexVal = node.accent_color != null ? '#' + node.accent_color.toString(16).padStart(6, '0') : '#000000';

  return (
    <div className="props-section">
      <Field label="Accent color">
        <div className="row">
          <input type="color" value={hexVal}
            onChange={e => onChange({ accent_color: parseInt(e.target.value.replace('#', ''), 16) })} />
          <button className="btn-secondary" style={{ fontSize: 12, padding: '3px 8px' }} onClick={() => onChange({ accent_color: null })}>Sin color</button>
        </div>
      </Field>
      <Field label="Spoiler">
        <select value={node.spoiler ? 'true' : 'false'} onChange={e => onChange({ spoiler: e.target.value === 'true' })}>
          <option value="false">No</option>
          <option value="true">Sí</option>
        </select>
      </Field>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function PropertyEditor({ node, onChange }: Props) {
  if (!node) {
    return <div className="props-empty">Selecciona un componente para editarlo.</div>;
  }

  const SEL_TYPES = [3, 5, 6, 7, 8];
  const typeName = {
    10: 'Texto', 14: 'Divider', 9: 'Section', 11: 'Thumbnail', 12: 'Gallery',
    2: 'Button', 3: 'Select Menu', 5: 'User Select', 6: 'Role Select',
    7: 'Mention Select', 8: 'Channel Select', 1: 'Action Row', 17: 'Container',
  }[node.type as number] ?? `Tipo ${node.type}`;

  return (
    <div>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #3f4147', color: '#b5bac1', fontSize: 12 }}>
        Editando: <strong style={{ color: '#dbdee1' }}>{typeName}</strong>
      </div>
      {node.type === 10 && <TextEditor node={node} onChange={onChange} />}
      {node.type === 14 && <DividerEditor node={node} onChange={onChange} />}
      {node.type === 11 && <ThumbnailEditor node={node} onChange={onChange} />}
      {node.type === 9  && <SectionEditor node={node} onChange={onChange} />}
      {node.type === 12 && <GalleryEditor node={node} onChange={onChange} />}
      {node.type === 2  && <ButtonEditor node={node} onChange={onChange} />}
      {SEL_TYPES.includes(node.type) && <SelectMenuEditor node={node} onChange={onChange} />}
      {node.type === 1  && <ActionRowEditor node={node} onChange={onChange} />}
      {node.type === 17 && <ContainerEditor node={node} onChange={onChange} />}
    </div>
  );
}
