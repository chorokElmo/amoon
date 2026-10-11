import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261011150104 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "amoon_slider_config" ("id" text not null, "slides" jsonb not null, "revision" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "amoon_slider_config_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_amoon_slider_config_deleted_at" ON "amoon_slider_config" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "amoon_slider_image" ("id" text not null, "file_id" text not null, "url" text not null, "mime_type" text not null, "width" integer not null, "height" integer not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "amoon_slider_image_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_amoon_slider_image_deleted_at" ON "amoon_slider_image" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "amoon_slider_config" cascade;`);

    this.addSql(`drop table if exists "amoon_slider_image" cascade;`);
  }

}
