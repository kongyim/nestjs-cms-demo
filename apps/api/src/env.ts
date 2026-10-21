import { config } from 'dotenv';
import { resolve } from 'node:path';

// Both src/ (development) and dist/ (production) live three levels below root.
config({ path: resolve(__dirname, '../../../.env') });
