import { beforeEach, describe, expect, it } from 'vitest';
import { connectionProps } from '../../../../test/fakes/builders.js';
import { InMemoryConnectionRepository } from '../../../../test/fakes/in-memory-connection.repository.js';
import { SaveConnection } from './save-connection.js';

describe('SaveConnection', () => {
  let repository: InMemoryConnectionRepository;
  let useCase: SaveConnection;

  beforeEach(() => {
    repository = new InMemoryConnectionRepository();
    useCase = new SaveConnection(repository);
  });

  it('salva a conexão', async () => {
    const props = connectionProps();
    await useCase.execute(props);
    expect(repository.items.get(props.id)?.storeId).toBe('loja-centro');
  });

  it('não duplica quando a mesma mensagem chega duas vezes', async () => {
    const props = connectionProps();
    await useCase.execute(props);
    await useCase.execute(props);
    expect(repository.items.size).toBe(1);
  });
});
