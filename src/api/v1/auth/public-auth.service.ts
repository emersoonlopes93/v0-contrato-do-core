import { PublicAuthRepository } from '@/src/adapters/prisma/repositories/public-auth-repository';
import { PasswordService } from '@/src/core/auth/password';
import type {
  PublicSignupRequest,
  PublicSignupResponse,
} from '@/src/types/public-auth';

export class PublicAuthService {
  private readonly repo = new PublicAuthRepository();

  async signup(input: PublicSignupRequest): Promise<PublicSignupResponse> {
    const email = input.email.trim();
    const password = input.password;
    const tenantName = input.tenantName.trim();
    const tenantSlug = input.tenantSlug.trim();

    if (
      email.length === 0 ||
      password.length === 0 ||
      tenantName.length === 0 ||
      tenantSlug.length === 0
    ) {
      throw new Error('INVALID_SIGNUP_PAYLOAD');
    }

    const passwordValidation = PasswordService.validateStrength(password);
    if (!passwordValidation.valid) {
      const firstError = passwordValidation.errors[0] ?? 'Invalid password';
      throw new Error(firstError);
    }

    const slugTaken = await this.repo.isTenantSlugTaken(tenantSlug);
    if (slugTaken) {
      throw new Error('TENANT_SLUG_TAKEN');
    }

    const passwordHash = await PasswordService.hash(password);

    const created = await this.repo.createTenantWithOwner({
      tenantName,
      tenantSlug,
      email,
      passwordHash,
    });

    const response: PublicSignupResponse = {
      success: true,
      tenant: {
        id: created.tenantId,
        slug: created.tenantSlug,
        name: tenantName,
      },
      user: {
        id: created.userId,
        email,
        role: 'owner',
      },
    };

    return response;
  }
}

