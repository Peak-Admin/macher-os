import { describe, expect, it } from 'vitest';
import { ORB_ZUSTAENDE, orbFuer, orbText } from './orb-zustand';

describe('Orb-Zustand aus Absicht oder Gateway-Aktion', () => {
  it('ordnet die Absichten dem passenden Zustand zu', () => {
    expect(orbFuer('invoice.list')).toBe('sucht');
    expect(orbFuer('search')).toBe('sucht');
    expect(orbFuer('location.find')).toBe('sucht');
    expect(orbFuer('employee.availability')).toBe('sucht');
    expect(orbFuer('job.missing')).toBe('prueft');
    expect(orbFuer('offer.calculate')).toBe('prueft');
    expect(orbFuer('message.send')).toBe('schreibt');
    expect(orbFuer('offer.prepare_followup')).toBe('schreibt');
    expect(orbFuer('invoice.remind')).toBe('schreibt');
    expect(orbFuer('offer.create_draft')).toBe('formt');
    expect(orbFuer('invoice.create_draft')).toBe('formt');
    expect(orbFuer('offer.prepare_from_request')).toBe('formt');
    expect(orbFuer('task.create')).toBe('formt');
    expect(orbFuer('reminder.create')).toBe('formt');
    expect(orbFuer('task.list')).toBe('sucht');
    expect(orbFuer('job.finish')).toBe('verknuepft');
    expect(orbFuer('employee.schedule')).toBe('verknuepft');
    expect(orbFuer('job.prepare_schedule')).toBe('verknuepft');
    expect(orbFuer('datev.export')).toBe('verbindet');
    expect(orbFuer('import.kunden')).toBe('verbindet');
    expect(orbFuer('help')).toBe('denkt');
    expect(orbFuer('time.track')).toBe('arbeitet');
  });

  it('Sprache → hört zu, ohne Absicht → denkt nach', () => {
    expect(orbFuer('invoice.list', 'sprache')).toBe('hoert');
    expect(orbFuer(undefined)).toBe('denkt');
  });

  it('jeder Zustand hat einen Statustext – nie nur die Animation', () => {
    for (const z of ORB_ZUSTAENDE) expect(orbText(z)).toMatch(/^Macher .+ …$/);
  });
});
