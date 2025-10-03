import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn
} from "typeorm";

@Index("unique_release_id", ["base_release_id", "destination_release_id"], {
  unique: true,
})
@Index("status", ["status"], {})
@Index("destination_release_id", ["destination_release_id"], {})
@Index("base_release_id", ["base_release_id"], {})
@Index("app_id", ["appId"], {})
@Entity("platform_release_push_notification")
export class PlatformReleasePushNotification {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { name: "app_id", length: 255 })
  appId: string;

  @Column("int", { name: "base_release_id" })
  base_release_id: number;

  @Column("int", { name: "destination_release_id" })
  destination_release_id: number;

  @Column("varchar", { name: "title", length: 128 })
  title: string;

  @Column("varchar", { name: "message", length: 512 })
  message: string;

  @Column("varchar", { name: "url_download", length: 512 })
  url_download: string;

  @Column("tinyint", {
    name: "force_update",
    nullable: true,
    unsigned: true,
    default: () => "'0'",
  })
  force_update: number | null;

  @Column("tinyint", {
    name: "status",
    nullable: true,
    unsigned: true,
    default: () => "'1'",
  })
  status: number | null;

  @Column("double", {
    name: "created_date",
    precision: 13,
    scale: 3,
    default: () => "'0.000'",
  })
  created_date: number;

  @Column("double", {
    name: "updated_date",
    precision: 13,
    scale: 3,
    default: () => "'0.000'",
  })
  updated_date: number;

  // @ManyToOne(
  //   () => Releases,
  //   (releases) => releases.platformReleasePushNotifications,
  //   { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  // )
  // @JoinColumn([{ name: "base_release_id", referencedColumnName: "id" }])
  // baseRelease: Releases;

  // @ManyToOne(
  //   () => Releases,
  //   (releases) => releases.platformReleasePushNotifications2,
  //   { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  // )
  // @JoinColumn([{ name: "destination_release_id", referencedColumnName: "id" }])
  // destinationRelease: Releases;
}
