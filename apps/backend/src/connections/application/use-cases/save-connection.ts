import { WifiConnection, type WifiConnectionProps } from '../../domain/wifi-connection.js';
import type { ConnectionRepository } from '../ports/connection.repository.js';

export class SaveConnection {
  constructor(private readonly repository: ConnectionRepository) {}

  async execute(input: WifiConnectionProps): Promise<void> {
    await this.repository.save(WifiConnection.create(input));
  }
}
