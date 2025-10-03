import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("release_id", ["release_id", "group_id"], { unique: true })
@Entity("release_group")
export class ReleasesGroup {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", {
    name: "release_id",
    comment: "ID of Flo app release",
    unsigned: true,
  })
  release_id: number;

  @Column("int", {
    name: "group_id",
    nullable: true,
    comment: 'The ID of the group, refer to the table "groups"\t',
    unsigned: true,
  })
  group_id: number | null;

  @Column("double", { name: "created_date", precision: 13, scale: 3 })
  createdDate: number;

  @Column("double", {
    name: "updated_date",
    nullable: true,
    precision: 13,
    scale: 3,
  })
  updated_date: number | null;
}
