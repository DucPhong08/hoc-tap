import { BadRequestException } from '@nestjs/common';
import { RoleConditionDto } from '@/modules/roles/dto/role-condition.dto';
import { ConditionQueryPipe } from './request-condition.pipe';

describe('ConditionQueryPipe', () => {
  const pipe = new ConditionQueryPipe(RoleConditionDto);

  it('returns an empty condition when the query is missing', async () => {
    await expect(pipe.transform(undefined)).resolves.toEqual({});
  });

  it('keeps valid whitelisted fields', async () => {
    await expect(
      pipe.transform('{"code":"admin","name":"Administrator"}'),
    ).resolves.toMatchObject({ code: 'admin', name: 'Administrator' });
  });

  it.each([undefined, '{}'])(
    'rejects a missing or empty required condition: %s',
    async (value) => {
      const requiredPipe = new ConditionQueryPipe(RoleConditionDto, true);

      await expect(requiredPipe.transform(value)).rejects.toThrow(
        BadRequestException,
      );
    },
  );

  it('rejects non-whitelisted fields instead of producing an empty filter', async () => {
    await expect(pipe.transform('{"unknown":"value"}')).rejects.toThrow(
      BadRequestException,
    );
  });

  it.each(['invalid-json', '[]', 'null', '"code"'])(
    'rejects invalid condition input %s',
    async (value) => {
      await expect(pipe.transform(value)).rejects.toThrow(BadRequestException);
    },
  );
});
