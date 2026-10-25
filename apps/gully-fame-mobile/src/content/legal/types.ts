/** One paragraph or bullet of a legal document, as written in the PDF. */
export type LegalBlock = { t: "p" | "b"; x: string };

/** A numbered section (or FAQ item) of a legal document. */
export type LegalSection = {
  number: string;
  heading: string;
  body: LegalBlock[];
};
