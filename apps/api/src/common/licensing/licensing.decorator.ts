import { SetMetadata } from '@nestjs/common';

export const LICENSE_MODULE_KEY = 'license_module';

export const RequiresLicense = (module: string) =>
  SetMetadata(LICENSE_MODULE_KEY, module);
