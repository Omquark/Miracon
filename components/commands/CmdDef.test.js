const { Command, Commands } = require('./CmdDef');

describe('CmdDef definitions', () => {
  it('exports a valid default command shape', () => {
    expect(Command).toMatchObject({
      name: expect.any(String),
      description: expect.any(String),
      roles: expect.any(Array),
      blacklistRoles: expect.any(Array),
      requirePassword: expect.any(Boolean),
      enabled: expect.any(Boolean),
      required: expect.any(Array),
      optional: expect.any(Array),
    });
  });

  it('exports command definitions with consistent core fields', () => {
    expect(Array.isArray(Commands)).toBe(true);
    expect(Commands.length).toBeGreaterThan(0);

    Commands.forEach((command) => {
      expect(command).toMatchObject({
        name: expect.any(String),
        description: expect.any(String),
        roles: expect.any(Array),
        blacklistRoles: expect.any(Array),
        requirePassword: expect.any(Boolean),
        enabled: expect.any(Boolean),
      });
    });
  });
});
