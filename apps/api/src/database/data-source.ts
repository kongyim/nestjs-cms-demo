import '../env';
import { createAuthDataSource } from '@nestjs-cms/auth';
import { authConfig } from '../auth.config';
import { AuthExtraFields1792728000000 } from './migrations/1792728000000-AuthExtraFields';

const { dataSource } = createAuthDataSource(authConfig, {
  migrations: [AuthExtraFields1792728000000],
});
// Migration CLI must never auto-synchronize before applying reviewed changes.
dataSource.setOptions({ synchronize: false });
export default dataSource;
