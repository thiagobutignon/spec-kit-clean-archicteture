/**
 * Unit tests for scope-extractor utility
 */

import { describe, it, expect } from 'vitest';
import { extractScope, isValidScope } from './scope-extractor';

describe('extractScope', () => {
  describe('explicit layer folders', () => {
    it('should extract domain from path', () => {
      expect(extractScope('product-catalog/src/features/product/domain/models/product.ts')).toBe('domain');
      expect(extractScope('src/domain/entities/user.ts')).toBe('domain');
      expect(extractScope('packages/core/domain/value-objects/email.ts')).toBe('domain');
    });

    it('should extract data from path', () => {
      expect(extractScope('product-catalog/src/features/product/data/usecases/create-product.ts')).toBe('data');
      expect(extractScope('src/data/repositories/user-repository.ts')).toBe('data');
      expect(extractScope('libs/shared/data/protocols/cache-protocol.ts')).toBe('data');
    });

    it('should extract infra from path', () => {
      expect(extractScope('product-catalog/src/features/product/infra/database/postgres-adapter.ts')).toBe('infra');
      expect(extractScope('src/infra/http/axios-client.ts')).toBe('infra');
      expect(extractScope('packages/backend/infra/cache/redis-cache.ts')).toBe('infra');
    });

    it('should extract infra from infrastructure folder', () => {
      expect(extractScope('src/infrastructure/database/connection.ts')).toBe('infra');
      expect(extractScope('apps/api/infrastructure/messaging/rabbitmq.ts')).toBe('infra');
    });

    it('should extract presentation from path', () => {
      expect(extractScope('product-catalog/src/features/product/presentation/controllers/product-controller.ts')).toBe('presentation');
      expect(extractScope('src/presentation/components/Button.tsx')).toBe('presentation');
      expect(extractScope('apps/web/presentation/pages/Home.tsx')).toBe('presentation');
    });

    it('should extract main from path', () => {
      expect(extractScope('product-catalog/src/features/product/main/factories/product-factory.ts')).toBe('main');
      expect(extractScope('src/main/composition/user-composition.ts')).toBe('main');
      expect(extractScope('packages/server/main/config/app.ts')).toBe('main');
    });
  });

  describe('pattern-based detection', () => {
    it('should detect domain from models folder', () => {
      expect(extractScope('src/features/user/models/user.ts')).toBe('domain');
      expect(extractScope('libs/core/models/product.ts')).toBe('domain');
    });

    it('should detect domain from entities folder', () => {
      expect(extractScope('src/features/order/entities/order.ts')).toBe('domain');
      expect(extractScope('packages/domain/entities/customer.ts')).toBe('domain');
    });

    it('should detect domain from value-objects folder', () => {
      expect(extractScope('src/features/user/value-objects/email.ts')).toBe('domain');
      expect(extractScope('libs/shared/value-objects/money.ts')).toBe('domain');
    });

    it('should detect data from usecases folder', () => {
      expect(extractScope('src/features/user/usecases/create-user.ts')).toBe('data');
      expect(extractScope('packages/app/use-cases/authenticate-user.ts')).toBe('data');
    });

    it('should detect infra from repositories folder', () => {
      expect(extractScope('src/features/user/repositories/user-repository.ts')).toBe('infra');
      expect(extractScope('libs/database/repositories/product-repo.ts')).toBe('infra');
    });

    it('should detect infra from adapters folder', () => {
      expect(extractScope('src/features/payment/adapters/stripe-adapter.ts')).toBe('infra');
      expect(extractScope('packages/integrations/adapters/email-adapter.ts')).toBe('infra');
    });

    it('should detect presentation from controllers folder', () => {
      expect(extractScope('src/features/user/controllers/user-controller.ts')).toBe('presentation');
      expect(extractScope('apps/api/controllers/auth-controller.ts')).toBe('presentation');
    });

    it('should detect presentation from components folder', () => {
      expect(extractScope('src/features/ui/components/Button.tsx')).toBe('presentation');
      expect(extractScope('packages/web/components/Header.tsx')).toBe('presentation');
    });

    it('should detect main from factories folder', () => {
      expect(extractScope('src/features/user/factories/user-factory.ts')).toBe('main');
      expect(extractScope('apps/server/factories/database-factory.ts')).toBe('main');
    });

    it('should detect main from composition folder', () => {
      expect(extractScope('src/features/auth/composition/auth-composition.ts')).toBe('main');
      expect(extractScope('packages/core/composition/app-composition.ts')).toBe('main');
    });
  });

  describe('edge cases', () => {
    it('should return core for empty path', () => {
      expect(extractScope('')).toBe('core');
    });

    it('should return core for root level files', () => {
      expect(extractScope('index.ts')).toBe('core');
      expect(extractScope('config.ts')).toBe('core');
    });

    it('should return core when no layer detected', () => {
      expect(extractScope('src/utils/helpers.ts')).toBe('core');
      expect(extractScope('libs/shared/types.ts')).toBe('core');
      expect(extractScope('packages/common/constants.ts')).toBe('core');
    });

    it('should handle Windows paths', () => {
      expect(extractScope('C:\\projects\\app\\src\\domain\\models\\user.ts')).toBe('domain');
      expect(extractScope('D:\\code\\backend\\src\\data\\usecases\\create.ts')).toBe('data');
    });

    it('should handle mixed path separators', () => {
      expect(extractScope('src/features\\user/domain\\models/user.ts')).toBe('domain');
      expect(extractScope('libs\\core/data/repositories\\repo.ts')).toBe('data');
    });

    it('should handle paths with spaces', () => {
      expect(extractScope('my project/src/domain/models/user.ts')).toBe('domain');
      expect(extractScope('src/my feature/data/usecases/create.ts')).toBe('data');
    });

    it('should handle paths with special characters', () => {
      expect(extractScope('src/features/@core/domain/models/user.ts')).toBe('domain');
      expect(extractScope('packages/$shared/data/protocols/cache.ts')).toBe('data');
    });

    it('should be case insensitive for layer detection', () => {
      expect(extractScope('src/DOMAIN/models/user.ts')).toBe('domain');
      expect(extractScope('src/Data/usecases/create.ts')).toBe('data');
      expect(extractScope('src/INFRASTRUCTURE/database/db.ts')).toBe('infra');
    });

    it('should prioritize explicit layer folder over pattern', () => {
      // Has both /domain/ and /models/ - should pick domain from explicit folder
      expect(extractScope('src/domain/models/user.ts')).toBe('domain');
      // Has both /data/ and /repositories/ - should pick data from explicit folder
      expect(extractScope('src/data/repositories/user-repo.ts')).toBe('data');
    });

    it('should handle UNC paths', () => {
      expect(extractScope('//server/share/project/src/domain/models/user.ts')).toBe('domain');
      expect(extractScope('\\\\server\\share\\src\\data\\usecases\\create.ts')).toBe('data');
    });
  });
});

describe('isValidScope', () => {
  it('should return true for valid scopes', () => {
    expect(isValidScope('domain')).toBe(true);
    expect(isValidScope('data')).toBe(true);
    expect(isValidScope('infra')).toBe(true);
    expect(isValidScope('presentation')).toBe(true);
    expect(isValidScope('main')).toBe(true);
    expect(isValidScope('core')).toBe(true);
  });

  it('should return false for invalid scopes', () => {
    expect(isValidScope('invalid')).toBe(false);
    expect(isValidScope('Domain')).toBe(false); // case sensitive
    expect(isValidScope('infrastructure')).toBe(false); // full word not accepted
    expect(isValidScope('')).toBe(false);
    expect(isValidScope('business')).toBe(false);
    expect(isValidScope('ui')).toBe(false);
  });
});