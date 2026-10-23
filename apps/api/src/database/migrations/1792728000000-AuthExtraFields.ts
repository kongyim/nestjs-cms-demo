import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Apply to an existing CMS database when DB_SYNCHRONIZE=false. */
export class AuthExtraFields1792728000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'phone',
        type: 'varchar',
        length: '30',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'roles',
      new TableColumn({
        name: 'description',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('roles', 'description');
    await queryRunner.dropColumn('users', 'phone');
  }
}
