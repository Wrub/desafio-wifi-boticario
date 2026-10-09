import { z } from 'zod';

// Aceita AA:BB:CC:DD:EE:FF ou AA-BB-CC-DD-EE-FF
export const MAC_ADDRESS_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;

export const DEVICE_TYPES = ['smartphone', 'tablet', 'laptop', 'other'] as const;
export const deviceTypeSchema = z.enum(DEVICE_TYPES);
export type DeviceType = z.infer<typeof deviceTypeSchema>;

export const deviceSchema = z.object({
  macAddress: z.string().regex(MAC_ADDRESS_REGEX, 'MAC inválido, use o formato AA:BB:CC:DD:EE:FF'),
  type: deviceTypeSchema,
  os: z.string().trim().min(1).max(40).optional(),
});
export type Device = z.infer<typeof deviceSchema>;

// Celular BR: DDD + 9 dígitos, com ou sem +55 e pontuação
export const PHONE_REGEX = /^(\+?55\s?)?\(?[1-9]{2}\)?\s?\d{5}[-\s]?\d{4}$/;

// Dados que o cliente preenche no captive portal do Wi-Fi.
export const visitorSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(120),
  phone: z.string().trim().regex(PHONE_REGEX, 'Celular inválido, use DDD + 9 dígitos'),
  cpf: z
    .string()
    .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, 'CPF deve ter 11 dígitos')
    .optional(),
  email: z.email('E-mail inválido').max(160),
});
export type Visitor = z.infer<typeof visitorSchema>;

export const registerConnectionSchema = z.object({
  storeId: z.string().trim().min(1, 'storeId é obrigatório').max(64),
  device: deviceSchema,
  visitor: visitorSchema,
  connectedAt: z.iso.datetime({ offset: true }).optional(),
});
export type RegisterConnectionRequest = z.infer<typeof registerConnectionSchema>;

export const registerConnectionResponseSchema = z.object({
  id: z.uuid(),
});
export type RegisterConnectionResponse = z.infer<typeof registerConnectionResponseSchema>;

// Mensagem que vai pro RabbitMQ (API -> consumer)
export const connectionRegisteredEventSchema = z.object({
  id: z.uuid(),
  storeId: z.string().min(1),
  device: deviceSchema,
  visitor: visitorSchema,
  connectedAt: z.iso.datetime({ offset: true }),
});
export type ConnectionRegisteredEvent = z.infer<typeof connectionRegisteredEventSchema>;

export const CONNECTION_REGISTERED_PATTERN = 'connection.registered';
