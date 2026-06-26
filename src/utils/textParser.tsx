import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Regex to match ENS control IDs in plain text (not bracketed).
 * Matches patterns like: org.1, op.pl.5, mp.sw.1, op.acc.3
 */
const CONTROL_ID_REGEX =
  /\b(org|op\.pl|op\.acc|op\.exp|op\.ext|op\.nub|op\.cont|op\.mon|mp\.if|mp\.per|mp\.eq|mp\.com|mp\.si|mp\.sw|mp\.info|mp\.s)\.\d+\b/gi;

/**
 * Regex to match bracketed content like [op.pl.5], [org.1.1]
 */
const BRACKETED_REGEX = /\[([^\]]+)\]/g;

/**
 * Regex to match CPSTIC and CCN-STIC references.
 */
const CPSTIC_REGEX = /\b(CPSTIC|CCN-STIC[-\s]?\d*)\b/gi;

/** The official CPSTIC catalog URL */
const CPSTIC_URL = 'https://cpstic.ccn.cni.es';

/** Map of known CCN-STIC guide numbers to their URLs */
const CCN_STIC_GUIDE_URLS: Record<string, string> = {
  '800': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '801': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '802': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '803': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '804': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '805': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '806': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '807': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '808': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '809': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '810': 'https://cpstic.ccn.cni.es',
  '811': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '812': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '813': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '815': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '816': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '817': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '819': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '823': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '824': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '835': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
  '836': 'https://www.ccn.cni.es/index.php/es/menu-guias-ccn-stic-es',
};

/**
 * Returns the URL for a CCN-STIC guide number, or generic series URL if unknown.
 */
function getCCNGuideUrl(guideNumber: string): string {
  return CCN_STIC_GUIDE_URLS[guideNumber] ?? CCN_STIC_GUIDE_URLS['800'];
}

/**
 * Combined regex that matches all patterns we want to process.
 * Uses alternation to capture:
 * 1. Bracketed content [op.pl.5]
 * 2. CPSTIC keyword
 * 3. CCN-STIC-NNN (full form)
 * 4. Short guide references like "la 808", "guía 804" (only known 8xx numbers)
 * 5. Plain ENS control IDs
 */
function buildCombinedRegex(): RegExp {
  return /(\[[^\]]+\])|\b(CPSTIC)\b|\b(CCN-STIC[-\s]?\d*)\b|\b(?:la|guía|guia)\s+(8\d{2})\b|\b(org|op\.pl|op\.acc|op\.exp|op\.ext|op\.nub|op\.cont|op\.mon|mp\.if|mp\.per|mp\.eq|mp\.com|mp\.si|mp\.sw|mp\.info|mp\.s)\.\d+\b/gi;
}

/**
 * Parses ENS text and returns an array of ReactNode elements with:
 * - Valid control references rendered as <Link> elements
 * - Sub-identifiers rendered as highlighted <span> elements
 * - CPSTIC/CCN-STIC references rendered as external <a> elements
 * - Plain text rendered as-is
 */
export function parseENSText(
  text: string,
  validControlIds: Set<string>
): ReactNode[] {
  const combinedRegex = buildCombinedRegex();
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add any plain text before this match
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const fullMatch = match[0];
    const bracketedContent = match[1]; // Group 1: bracketed like [op.pl.5]
    const cpsticMatch = match[2]; // Group 2: CPSTIC keyword
    const ccnSticFull = match[3]; // Group 3: CCN-STIC-NNN (full form)
    const shortGuideNum = match[4]; // Group 4: short ref number (e.g., "808" from "la 808")
    const controlPrefix = match[5]; // Group 5: control prefix (from plain ID match)

    if (bracketedContent) {
      // Bracketed content like [op.pl.5] or [org.1.1]
      const innerText = bracketedContent.slice(1, -1); // Remove brackets
      const normalizedId = innerText.toLowerCase();

      if (validControlIds.has(normalizedId)) {
        // Valid control reference → render as Link
        nodes.push(
          <Link
            key={`link-${keyCounter++}`}
            to={`/controls/${normalizedId}`}
            className="requisitos-boe__control-link"
          >
            {fullMatch}
          </Link>
        );
      } else {
        // Sub-identifier or unknown → render as highlighted span
        nodes.push(
          <span
            key={`span-${keyCounter++}`}
            className="requisitos-boe__identifier"
          >
            {fullMatch}
          </span>
        );
      }
    } else if (cpsticMatch) {
      // CPSTIC keyword → link to CPSTIC catalog
      nodes.push(
        <a
          key={`ext-${keyCounter++}`}
          href={CPSTIC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="requisitos-boe__external-link"
          title="Catálogo de Productos y Servicios STIC (CPSTIC)"
        >
          {fullMatch}
        </a>
      );
    } else if (ccnSticFull) {
      // CCN-STIC-NNN full form → link to specific guide
      const numMatch = ccnSticFull.match(/\d+/);
      const guideNum = numMatch ? numMatch[0] : '';
      const url = guideNum ? getCCNGuideUrl(guideNum) : CCN_STIC_GUIDE_URLS['800'];
      const title = guideNum ? `Guía CCN-STIC-${guideNum}` : 'Serie CCN-STIC del ENS';
      nodes.push(
        <a
          key={`ext-${keyCounter++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="requisitos-boe__external-link"
          title={title}
        >
          {fullMatch}
        </a>
      );
    } else if (shortGuideNum) {
      // Short guide reference like "la 808", "guía 804"
      const url = getCCNGuideUrl(shortGuideNum);
      nodes.push(
        <a
          key={`ext-${keyCounter++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="requisitos-boe__external-link"
          title={`Guía CCN-STIC-${shortGuideNum}`}
        >
          {fullMatch}
        </a>
      );
    } else if (controlPrefix) {
      // Plain control ID like op.pl.5 (not bracketed)
      const normalizedId = fullMatch.toLowerCase();

      if (validControlIds.has(normalizedId)) {
        // Valid control reference → render as Link
        nodes.push(
          <Link
            key={`link-${keyCounter++}`}
            to={`/controls/${normalizedId}`}
            className="requisitos-boe__control-link"
          >
            {fullMatch}
          </Link>
        );
      } else {
        // Not a valid top-level ID → render as highlighted span
        nodes.push(
          <span
            key={`span-${keyCounter++}`}
            className="requisitos-boe__identifier"
          >
            {fullMatch}
          </span>
        );
      }
    }

    lastIndex = combinedRegex.lastIndex;
  }

  // Add any remaining plain text after the last match
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  // If no matches were found, return the original text
  if (nodes.length === 0) {
    nodes.push(text);
  }

  return nodes;
}

/**
 * Component that renders ENS text with interactive references.
 * - Control IDs in the validControlIds set → <Link> for navigation
 * - Sub-identifiers not in the set → <span> with highlight
 * - CPSTIC/CCN-STIC references → external <a> link
 */
interface ENSTextRendererProps {
  text: string;
  validControlIds: Set<string>;
}

export function ENSTextRenderer({ text, validControlIds }: ENSTextRendererProps) {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const nodes = parseENSText(text, validControlIds);
  return <>{nodes}</>;
}

// Export regexes for testing
export { CONTROL_ID_REGEX, BRACKETED_REGEX, CPSTIC_REGEX };
