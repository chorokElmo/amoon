import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261011170635 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "amoon_theme_settings" ("id" text not null, "draft" jsonb null, "published" jsonb null, "revision" integer not null default 0, "published_revision" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "amoon_theme_settings_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_amoon_theme_settings_deleted_at" ON "amoon_theme_settings" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "amoon_theme_settings" cascade;`);
  }

}
