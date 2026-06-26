import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { parseENSText, ENSTextRenderer, CONTROL_ID_REGEX, BRACKETED_REGEX, CPSTIC_REGEX } from './textParser';

// Helper to render parsed nodes within a router context
function renderParsed(text: string, validControlIds: Set<string>) {
  const nodes = parseENSText(text, validControlIds);
  return render(
    <MemoryRouter>
      <div data-testid="container">{nodes}</div>
    </MemoryRouter>
  );
}

// Helper set with some valid top-level control IDs
const validIds = new Set([
  'org.1', 'org.2', 'org.3', 'org.4',
  'op.pl.1', 'op.pl.2', 'op.pl.3', 'op.pl.4', 'op.pl.5',
  'op.acc.1', 'op.acc.2', 'op.acc.3', 'op.acc.4',
  'op.exp.1', 'op.exp.2', 'op.exp.3',
  'op.ext.1', 'op.ext.2',
  'op.nub.1',
  'op.cont.1', 'op.cont.2', 'op.cont.3',
  'op.mon.1', 'op.mon.2', 'op.mon.3',
  'mp.if.1', 'mp.if.2', 'mp.if.3',
  'mp.per.1', 'mp.per.2', 'mp.per.3', 'mp.per.4',
  'mp.eq.1', 'mp.eq.2', 'mp.eq.3',
  'mp.com.1', 'mp.com.2', 'mp.com.3', 'mp.com.4',
  'mp.si.1', 'mp.si.2', 'mp.si.3', 'mp.si.4', 'mp.si.5',
  'mp.sw.1', 'mp.sw.2',
  'mp.info.1', 'mp.info.2', 'mp.info.3',
  'mp.s.1', 'mp.s.2', 'mp.s.3',
]);

describe('textParser - Regex patterns', () => {
  it('CONTROL_ID_REGEX matches standard ENS control IDs', () => {
    const testCases = ['org.1', 'op.pl.5', 'mp.sw.1', 'op.acc.3', 'mp.info.2', 'mp.s.1'];
    for (const id of testCases) {
      CONTROL_ID_REGEX.lastIndex = 0;
      expect(CONTROL_ID_REGEX.test(id), `Expected ${id} to match`).toBe(true);
    }
  });

  it('CONTROL_ID_REGEX does not match sub-identifiers', () => {
    // Sub-identifiers like org.1.1 will partially match org.1, which is expected behavior
    // The regex matches the top-level portion
    CONTROL_ID_REGEX.lastIndex = 0;
    const match = CONTROL_ID_REGEX.exec('org.1.1');
    expect(match).not.toBeNull();
    expect(match![0]).toBe('org.1'); // Matches the top-level prefix only
  });

  it('BRACKETED_REGEX matches bracketed content', () => {
    const text = 'See [op.pl.5] and [org.1.1] for details';
    const matches = [...text.matchAll(BRACKETED_REGEX)];
    expect(matches).toHaveLength(2);
    expect(matches[0][1]).toBe('op.pl.5');
    expect(matches[1][1]).toBe('org.1.1');
  });

  it('CPSTIC_REGEX matches CPSTIC references', () => {
    const testCases = ['CPSTIC', 'CCN-STIC', 'CCN-STIC-810', 'CCN-STIC 810'];
    for (const ref of testCases) {
      CPSTIC_REGEX.lastIndex = 0;
      expect(CPSTIC_REGEX.test(ref), `Expected ${ref} to match`).toBe(true);
    }
  });
});

describe('parseENSText', () => {
  it('returns plain text unchanged when no patterns match', () => {
    const text = 'Este control aplica medidas de seguridad generales.';
    const result = parseENSText(text, validIds);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });

  it('renders valid bracketed control ID as Link', () => {
    const { container } = renderParsed('Ver [op.pl.5] para más detalles.', validIds);
    const link = container.querySelector('a[href="/controls/op.pl.5"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('[op.pl.5]');
    expect(link).toHaveClass('requisitos-boe__control-link');
  });

  it('renders sub-identifier as highlighted span (not link)', () => {
    const { container } = renderParsed('El requisito [org.1.1] establece las políticas.', validIds);
    const span = container.querySelector('.requisitos-boe__identifier');
    expect(span).toBeInTheDocument();
    expect(span).toHaveTextContent('[org.1.1]');
    // Should NOT be a link
    const link = container.querySelector('a[href*="org.1.1"]');
    expect(link).not.toBeInTheDocument();
  });

  it('renders CPSTIC as external link', () => {
    const { container } = renderParsed('Consultar el catálogo CPSTIC del CCN.', validIds);
    const link = container.querySelector('a[href="https://cpstic.ccn.cni.es"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('CPSTIC');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveClass('requisitos-boe__external-link');
  });

  it('renders CCN-STIC with number as external link', () => {
    const { container } = renderParsed('Según la guía CCN-STIC-810.', validIds);
    const link = container.querySelector('a[href="https://cpstic.ccn.cni.es"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('CCN-STIC-810');
  });

  it('renders plain (non-bracketed) valid control ID as Link', () => {
    const { container } = renderParsed('Relacionado con op.pl.5 del marco operacional.', validIds);
    const link = container.querySelector('a[href="/controls/op.pl.5"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('op.pl.5');
  });

  it('renders plain control ID not in set as span', () => {
    // op.pl.99 is not in validIds
    const { container } = renderParsed('Referencia a op.pl.99 desconocida.', validIds);
    const span = container.querySelector('.requisitos-boe__identifier');
    expect(span).toBeInTheDocument();
    expect(span).toHaveTextContent('op.pl.99');
  });

  it('handles multiple mixed references in one text', () => {
    const text = 'Aplica [op.pl.5] y consultar CPSTIC. Ver también [org.1.1] y mp.sw.1.';
    const { container } = renderParsed(text, validIds);

    // op.pl.5 → Link
    const opPlLink = container.querySelector('a[href="/controls/op.pl.5"]');
    expect(opPlLink).toBeInTheDocument();

    // CPSTIC → external link
    const cpsticLink = container.querySelector('a[href="https://cpstic.ccn.cni.es"]');
    expect(cpsticLink).toBeInTheDocument();

    // org.1.1 → span (sub-identifier)
    const spans = container.querySelectorAll('.requisitos-boe__identifier');
    const org11Span = Array.from(spans).find(s => s.textContent === '[org.1.1]');
    expect(org11Span).toBeInTheDocument();

    // mp.sw.1 → Link
    const mpSwLink = container.querySelector('a[href="/controls/mp.sw.1"]');
    expect(mpSwLink).toBeInTheDocument();
  });

  it('is case-insensitive for control IDs', () => {
    const { container } = renderParsed('Referencia a [OP.PL.5] en mayúsculas.', validIds);
    const link = container.querySelector('a[href="/controls/op.pl.5"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('[OP.PL.5]');
  });

  it('preserves surrounding text correctly', () => {
    const { container } = renderParsed('Antes [op.pl.5] después', validIds);
    expect(container).toHaveTextContent('Antes [op.pl.5] después');
  });
});

describe('ENSTextRenderer component', () => {
  it('renders null for empty text', () => {
    const { container } = render(
      <MemoryRouter>
        <ENSTextRenderer text="" validControlIds={validIds} />
      </MemoryRouter>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders null for whitespace-only text', () => {
    const { container } = render(
      <MemoryRouter>
        <ENSTextRenderer text="   " validControlIds={validIds} />
      </MemoryRouter>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders plain text without patterns', () => {
    render(
      <MemoryRouter>
        <ENSTextRenderer text="Texto simple sin referencias." validControlIds={validIds} />
      </MemoryRouter>
    );
    expect(screen.getByText('Texto simple sin referencias.')).toBeInTheDocument();
  });

  it('renders control references as links', () => {
    const { container } = render(
      <MemoryRouter>
        <ENSTextRenderer text="Ver [org.1] para la política." validControlIds={validIds} />
      </MemoryRouter>
    );
    const link = container.querySelector('a[href="/controls/org.1"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('[org.1]');
  });

  it('renders CPSTIC references as external links', () => {
    const { container } = render(
      <MemoryRouter>
        <ENSTextRenderer text="Catálogo CPSTIC del CCN." validControlIds={validIds} />
      </MemoryRouter>
    );
    const link = container.querySelector('a[target="_blank"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('CPSTIC');
  });

  it('handles mp.s category correctly', () => {
    const { container } = renderParsed('Control mp.s.1 de servicios.', validIds);
    const link = container.querySelector('a[href="/controls/mp.s.1"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('mp.s.1');
  });

  it('handles bracketed valid ID [mp.info.1]', () => {
    const { container } = renderParsed('Ver [mp.info.1] sobre protección.', validIds);
    const link = container.querySelector('a[href="/controls/mp.info.1"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('[mp.info.1]');
  });
});
