import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("user_group", ["user_id", "group_id"], {})
@Entity("group_user")
export class GroupsUser {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "user_id", unsigned: true })
  user_id: number;

  @Column("varchar", { length: 255})
  username: string;

  @Column("int", { name: "group_id", nullable: true })
  group_id: number | null;

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
