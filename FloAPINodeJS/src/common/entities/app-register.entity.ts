import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("app_register")
export class AppRegister {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "app_reg_id", length: 255 })
  app_reg_id: string;

  @Column("varchar", { name: "app_alias", length: 255 })
  app_alias: string;

  @Column("double", { name: "created_date", precision: 13, scale: 3 })
  created_date: number;

  @Column("double", {
    name: "updated_date",
    nullable: true,
    precision: 13,
    scale: 3,
  })
  updated_date: number | null;

  @Column("varchar", { name: "email_register", length: 255 })
  email_register: string;

  @Column("varchar", { name: "app_name", length: 255 })
  app_name: string;
}
