import type { ConnectionEventPublisher } from '../../src/connections/application/ports/connection-event.publisher.js';
import { WifiConnection } from '../../src/connections/domain/wifi-connection.js';

export class FakeConnectionEventPublisher implements ConnectionEventPublisher {
  readonly published: WifiConnection[] = [];

  async publishRegistered(connection: WifiConnection): Promise<void> {
    this.published.push(connection);
  }
}
