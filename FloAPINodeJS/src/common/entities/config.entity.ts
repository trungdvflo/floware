import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
@Index("uniq_on_group_and_key", ["group", "key"], {})
@Entity("config")

export class Config{
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("varchar", {
    name: "group",
    length: 100,
  })
  group: string;

  @Column("varchar", {
    name: "key",
    length: 100,
  })
  key: string;

  @Column("varchar", {
    name: "value",
    length: 5000,
  })
  value: string;
}
