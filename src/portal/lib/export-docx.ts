// A minimal .docx writer — enough for "this e-mail as an editable document":
// headings, paragraphs with bold runs, and inline PNGs.
//
// Why .docx and not a Google Doc directly: creating a file in someone's Drive
// needs OAuth, and this app holds no Google credentials. Drive converts .docx on
// upload (or File → Open), text stays editable and the images come through — so
// the download IS the Google Doc, one step later. HTML export was the other
// candidate and loses images: Docs' importer drops data: URIs.
//
// A .docx is a zip of XML parts. The four below are the minimum Word and Google
// Docs both accept, plus one media file per image.

import JSZip from "jszip";

export type DocRun = { text: string; bold?: boolean };
export type DocBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; runs: DocRun[] }
  | { type: "image"; png: Uint8Array; width: number; height: number };

// Word measures in EMUs — 914400 per inch, and CSS pixels are 96 per inch.
const EMU_PER_PX = 9525;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// xml:space="preserve" or Word eats the spaces around bold runs.
const runXml = (r: DocRun) =>
  `<w:r>${r.bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${esc(r.text)}</w:t></w:r>`;

const paragraphXml = (runs: DocRun[]) =>
  `<w:p>${runs.length ? runs.map(runXml).join("") : ""}</w:p>`;

const headingXml = (text: string) =>
  `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr>${runXml({ text })}</w:p>`;

/** An inline image, sized in points off its pixel dimensions so it lands at the
 *  same size it had on screen. `id` numbers both the relationship and the shape. */
function imageXml(id: number, width: number, height: number) {
  const cx = Math.round(width * EMU_PER_PX);
  const cy = Math.round(height * EMU_PER_PX);
  return (
    `<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Picture ${id}"/>` +
    `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="image${id}.png"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="rId${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`
  );
}

/** Build the .docx bytes. */
export async function buildDocx(blocks: DocBlock[]): Promise<Blob> {
  const zip = new JSZip();
  const images: { id: number; png: Uint8Array }[] = [];
  let nextId = 1;

  const body = blocks
    .map((b) => {
      if (b.type === "heading") return headingXml(b.text);
      if (b.type === "paragraph") return paragraphXml(b.runs);
      const id = nextId++;
      images.push({ id, png: b.png });
      return imageXml(id, b.width, b.height);
    })
    .join("");

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Default Extension="png" ContentType="image/png"/>` +
      `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
      `</Types>`,
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rIdDoc" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
      `</Relationships>`,
  );

  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      images
        .map(
          (i) =>
            `<Relationship Id="rId${i.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${i.id}.png"/>`,
        )
        .join("") +
      `</Relationships>`,
  );

  for (const i of images) zip.file(`word/media/image${i.id}.png`, i.png);

  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<w:document ` +
      `xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ` +
      `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
      `xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ` +
      `xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
      `xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
      `<w:body>${body}</w:body></w:document>`,
  );

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
