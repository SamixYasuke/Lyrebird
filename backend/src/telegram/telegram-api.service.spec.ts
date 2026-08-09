import { Test } from '@nestjs/testing';
import { TelegramApiService } from '@/telegram/telegram-api.service';

describe('TelegramApiService', () => {
  let service: TelegramApiService;
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [TelegramApiService],
    }).compile();
    service = module.get(TelegramApiService);
  });

  it('posts the message to the correct bot endpoint', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await service.sendMessage('123:ABC', 42, 'Hello!');

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.telegram.org/bot123:ABC/sendMessage');
    expect(JSON.parse(init.body)).toEqual({
      chat_id: 42,
      text: 'Hello!',
      parse_mode: 'HTML',
    });
  });

  it('sends markdown converted to Telegram HTML', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await service.sendMessage('123:ABC', 42, '**bold** and *italic*');

    const [_, init] = mockFetch.mock.calls[0];
    expect(JSON.parse(init.body).text).toBe(
      '<b>bold</b> and <i>italic</i>',
    );
  });

  it('retries as plain text when Telegram rejects the HTML', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400 });
    mockFetch.mockResolvedValueOnce({ ok: true });

    const sent = await service.sendMessage('123:ABC', 42, '**bold**');

    expect(sent).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [, retryInit] = mockFetch.mock.calls[1];
    expect(JSON.parse(retryInit.body)).toEqual({
      chat_id: 42,
      text: '**bold**',
    });
  });

  it('returns false when the API responds with an error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400 });

    await expect(service.sendMessage('123:ABC', 42, 'Hi')).resolves.toBe(false);
  });

  it('returns false on a network error', async () => {
    mockFetch.mockRejectedValue(new Error('ENOTFOUND'));

    await expect(service.sendMessage('123:ABC', 42, 'Hi')).resolves.toBe(false);
  });

  it('getMe returns ok with the bot username', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, result: { username: 'shop_bot' } }),
    });

    await expect(service.getMe('123:ABC')).resolves.toEqual({
      ok: true,
      username: 'shop_bot',
    });
  });

  it('getMe returns ok:false when the token is invalid', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: false, description: 'Not Found' }),
    });

    await expect(service.getMe('999:INVALID')).resolves.toEqual({ ok: false });
  });

  it('setWebhook posts the URL to the bot endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, result: true }),
    });

    await expect(
      service.setWebhook('123:ABC', 'https://example.com/webhook'),
    ).resolves.toBe(true);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.telegram.org/bot123:ABC/setWebhook');
    expect(JSON.parse(init.body)).toEqual({
      url: 'https://example.com/webhook',
    });
  });

  it('setWebhook returns false when registration fails', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: false }),
    });

    await expect(
      service.setWebhook('123:ABC', 'https://example.com/webhook'),
    ).resolves.toBe(false);
  });

  it('sendChatAction posts typing to the correct bot endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, result: true }),
    });

    await expect(service.sendChatAction('123:ABC', 42)).resolves.toBe(true);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.telegram.org/bot123:ABC/sendChatAction');
    expect(JSON.parse(init.body)).toEqual({ chat_id: 42, action: 'typing' });
  });

  it('sendChatAction returns false on a network error', async () => {
    mockFetch.mockRejectedValue(new Error('ENOTFOUND'));

    await expect(service.sendChatAction('123:ABC', 42)).resolves.toBe(false);
  });
});
