import { WifiConnection, type WifiConnectionProps } from '../../domain/wifi-connection.js';
import type { ConnectionRepository } from '../ports/connection.repository.js';

// Chamado pelo consumer da fila. Recrio a entidade pra rodar as regras de novo,
// porque não dá pra confiar 100% no que chega numa mensagem.
export class SaveConnection {
  constructor(private readonly repository: ConnectionRepository) {}

  async execute(input: WifiConnectionProps): Promise<void> {
    await this.repository.save(WifiConnection.create(input));
  }
}
