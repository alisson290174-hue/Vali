import { isBackupFile } from './backup';

describe('isBackupFile', () => {
  it('aceita um backup valido com itens', () => {
    expect(
      isBackupFile({
        formatVersion: 1,
        exportedAt: '2026-09-15T00:00:00.000Z',
        items: [{ item: 'Leite', expiryDate: '20/09/2026' }],
      })
    ).toBe(true);
  });

  it('aceita um backup valido sem itens', () => {
    expect(isBackupFile({ formatVersion: 1, exportedAt: '2026-09-15T00:00:00.000Z', items: [] })).toBe(true);
  });

  it('rejeita quando formatVersion nao e numero', () => {
    expect(isBackupFile({ formatVersion: '1', items: [] })).toBe(false);
  });

  it('rejeita quando items nao e um array', () => {
    expect(isBackupFile({ formatVersion: 1, items: 'nada' })).toBe(false);
  });

  it('rejeita quando um item nao tem nome ou data de vencimento', () => {
    expect(isBackupFile({ formatVersion: 1, items: [{ item: 'Leite' }] })).toBe(false);
    expect(isBackupFile({ formatVersion: 1, items: [{ expiryDate: '20/09/2026' }] })).toBe(false);
  });

  it('rejeita valores que nao sao objetos', () => {
    expect(isBackupFile(null)).toBe(false);
    expect(isBackupFile(undefined)).toBe(false);
    expect(isBackupFile('backup')).toBe(false);
    expect(isBackupFile(42)).toBe(false);
    expect(isBackupFile([])).toBe(false);
  });
});
