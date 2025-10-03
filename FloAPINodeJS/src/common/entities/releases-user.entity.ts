import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("release_id", ["release_id", "user_id"], { unique: true })
@Entity("release_user")
export class ReleasesUser {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "release_id", unsigned: true })
  release_id: number;

  @Column("int", { name: "user_id", unsigned: true })
  user_id: number;

  @Column("double", { name: "created_date", precision: 13, scale: 3 })
  created_date: number;

  @Column("double", {
    name: "updated_date",
    nullable: true,
    precision: 13,
    scale: 3,
  })
  updated_date: number | null;
}
