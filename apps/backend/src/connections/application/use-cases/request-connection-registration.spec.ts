import { beforeEach, describe, expect, it } from 'vitest';
import { FakeConnectionEventPublisher } from '../../../../test/fakes/fake-connection-event.publisher.js';
import { InMemoryConnectionRepository } from '../../../../test/fakes/in-memory-connection.repository.js';
import { CPF_MARIA } from '../../../../test/fakes/builders.js';
import { InvalidConnectionError } from '../../domain/domain.error.js';
import { RequestConnectionRegistration } from './request-connection-registration.js';

const input = {
  storeId: 'loja-centro',
  device: { macAddress: 'aa:bb:cc:dd:ee:ff', type: 'smartphone' },
  visitor: { name: 'Maria Souza', cpf: CPF_MARIA, email: 'maria@email.com' },
};

describe('RequestConnectionRegistration', () => {
  let publisher: FakeConnectionEventPublisher;
  let useCase: RequestConnectionRegistration;

  beforeEach(() => {
    publisher = new FakeConnectionEventPublisher();
    const repository = new InMemoryConnectionRepository([
      { id: 'loja-centro', name: 'Centro', city: 'Curitiba' },
    ]);
    useCase = new RequestConnectionRegistration(publisher, repository, () => 'id-fixo');
  });

  it('publica a conexão e devolve o id', async () => {
    const result = await useCase.execute(input);

    expect(result).toEqual({ id: 'id-fixo' });
    expect(publisher.published).toHaveLength(1);
    expect(publisher.published[0].device.macAddress).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('usa a hora atual quando connectedAt não vem', async () => {
    const before = Date.now();
    await useCase.execute(input);
    expect(publisher.published[0].connectedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('não publica quando a loja não existe', async () => {
    await expect(useCase.execute({ ...input, storeId: 'loja-fantasma' })).rejects.toThrow(
      'loja loja-fantasma não existe',
    );
    expect(publisher.published).toHaveLength(0);
  });

  it('não publica conexão inválida', async () => {
    await expect(
      useCase.execute({ ...input, device: { macAddress: 'invalido', type: 'smartphone' } }),
    ).rejects.toBeInstanceOf(InvalidConnectionError);
    expect(publisher.published).toHaveLength(0);
  });
});
