import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RequisitosBOE } from './RequisitosBOE';

/**
 * Helper to render RequisitosBOE inside a MemoryRouter context
 * (needed because ENSTextRenderer may render <Link> elements)
 */
function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('RequisitosBOE', () => {
  it('renders the section header in Spanish', () => {
    renderWithRouter(<RequisitosBOE requisitosBase="Texto de ejemplo." />);

    expect(screen.getByText('Requisitos (BOE)')).toBeInTheDocument();
  });

  it('renders the full requisitos text', () => {
    const text = 'La política de seguridad deberá ser aprobada por el órgano superior.';
    renderWithRouter(<RequisitosBOE requisitosBase={text} />);

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('splits text into paragraphs on double newlines', () => {
    const text = 'Primer párrafo.\n\nSegundo párrafo.';
    const { container } = renderWithRouter(<RequisitosBOE requisitosBase={text} />);

    const paragraphs = container.querySelectorAll('.requisitos-boe__paragraph');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveTextContent('Primer párrafo.');
    expect(paragraphs[1]).toHaveTextContent('Segundo párrafo.');
  });

  it('splits text into paragraphs on single newlines', () => {
    const text = 'Línea uno.\nLínea dos.\nLínea tres.';
    const { container } = renderWithRouter(<RequisitosBOE requisitosBase={text} />);

    const paragraphs = container.querySelectorAll('.requisitos-boe__paragraph');
    expect(paragraphs).toHaveLength(3);
  });

  it('highlights requirement identifiers in brackets as spans (sub-identifiers)', () => {
    // [org.1.1] is a sub-identifier (not a top-level control_id) so it stays as <span>
    const text = 'El requisito [org.1.1] establece las políticas.';
    const { container } = renderWithRouter(<RequisitosBOE requisitosBase={text} />);

    const identifier = container.querySelector('.requisitos-boe__identifier');
    expect(identifier).toBeInTheDocument();
    expect(identifier).toHaveTextContent('[org.1.1]');
  });

  it('highlights multiple sub-identifiers in the same paragraph', () => {
    // [org.1.1] and [op.pl.2.1] are sub-identifiers, not top-level controls
    const text = 'Los requisitos [org.1.1] y [op.pl.2.1] son obligatorios.';
    const { container } = renderWithRouter(<RequisitosBOE requisitosBase={text} />);

    const identifiers = container.querySelectorAll('.requisitos-boe__identifier');
    expect(identifiers).toHaveLength(2);
    expect(identifiers[0]).toHaveTextContent('[org.1.1]');
    expect(identifiers[1]).toHaveTextContent('[op.pl.2.1]');
  });

  it('renders valid control references as links', () => {
    // [op.pl.5] is a top-level control_id that exists in the dataset
    const text = 'Consulte el control [op.pl.5] para más información.';
    const { container } = renderWithRouter(<RequisitosBOE requisitosBase={text} />);

    const link = container.querySelector('a.requisitos-boe__control-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('[op.pl.5]');
    expect(link).toHaveAttribute('href', '/controls/op.pl.5');
  });

  it('renders CPSTIC references as external links', () => {
    const text = 'Se recomienda consultar el catálogo CPSTIC del CCN.';
    const { container } = renderWithRouter(<RequisitosBOE requisitosBase={text} />);

    const link = container.querySelector('a.requisitos-boe__external-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('CPSTIC');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute(
      'href',
      'https://cpstic.ccn.cni.es'
    );
  });

  it('shows empty state message when requisitosBase is empty', () => {
    renderWithRouter(<RequisitosBOE requisitosBase="" />);

    expect(
      screen.getByText('No se dispone de texto de requisitos para este control.')
    ).toBeInTheDocument();
  });

  it('shows empty state message when requisitosBase is whitespace only', () => {
    renderWithRouter(<RequisitosBOE requisitosBase="   " />);

    expect(
      screen.getByText('No se dispone de texto de requisitos para este control.')
    ).toBeInTheDocument();
  });

  it('uses controlId for accessible section labelling', () => {
    const { container } = renderWithRouter(
      <RequisitosBOE requisitosBase="Texto." controlId="op.pl.1" />
    );

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'requisitos-boe-op.pl.1');

    const heading = container.querySelector('#requisitos-boe-op\\.pl\\.1');
    expect(heading).toBeInTheDocument();
  });

  it('renders text without identifiers as plain content', () => {
    const text = 'Texto sin identificadores en corchetes.';
    const { container } = renderWithRouter(<RequisitosBOE requisitosBase={text} />);

    const identifiers = container.querySelectorAll('.requisitos-boe__identifier');
    expect(identifiers).toHaveLength(0);
    const links = container.querySelectorAll('.requisitos-boe__control-link');
    expect(links).toHaveLength(0);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
