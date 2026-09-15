import { BadRequestException } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogRepository } from '../repositories/audit-log.repository';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let mockRepository: jest.Mocked<Partial<AuditLogRepository>>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      insertMany: jest.fn(),
      getPage: jest.fn(),
      getMany: jest.fn(),
      deleteMany: jest.fn(),
    };

    service = new AuditLogService(
      mockRepository as unknown as AuditLogRepository,
    );
  });

  describe('cleanup', () => {
    it('should throw BadRequestException if retention days < 1', async () => {
      await expect(service.cleanup(0)).rejects.toThrow(BadRequestException);
      await expect(service.cleanup(-5)).rejects.toThrow(BadRequestException);
    });

    it('should call repository.deleteMany with soft: false for hard deletion', async () => {
      (mockRepository.deleteMany as jest.Mock).mockResolvedValue({
        deleted: 15,
      });

      const deleted = await service.cleanup(30);

      expect(deleted).toBe(15);
      expect(mockRepository.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: expect.objectContaining({ $lt: expect.any(Date) }),
        }),
        { soft: false },
      );
    });
  });

  describe('logMany', () => {
    it('should return { n: 0 } when empty array is provided', async () => {
      const result = await service.logMany([]);
      expect(result).toEqual({ n: 0 });
      expect(mockRepository.insertMany).not.toHaveBeenCalled();
    });
  });

  describe('query limit clamping', () => {
    it('should clamp limit within safe bounds (1 - 100)', async () => {
      (mockRepository.getPage as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      await service.getUserActions('user-1', 9999);
      expect(mockRepository.getPage).toHaveBeenCalledWith(
        { userId: 'user-1' },
        expect.objectContaining({ limit: 100 }),
      );

      await service.getUserActions('user-1', -10);
      expect(mockRepository.getPage).toHaveBeenCalledWith(
        { userId: 'user-1' },
        expect.objectContaining({ limit: 100 }),
      );
    });
  });
});
