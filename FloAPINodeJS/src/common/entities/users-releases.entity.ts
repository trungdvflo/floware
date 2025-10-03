import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn
} from "typeorm";

@Index("id_release_users", ["release_id"], {})
@Entity("user_release")
export class UserRelease {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "release_id", comment: "ID of Flo app release" })
  release_id: number;

  @Column("int", {
    name: "user_id",
    comment: "ID of group, refer to table Groups",
    unsigned: true,
  })
  user_id: number;

  @Column("double", { name: "created_date", precision: 13, scale: 3 })
  created_date: number;

  // @ManyToOne(() => Releases, (releases) => releases.usersReleases, {
  //   onDelete: "RESTRICT",
  //   onUpdate: "RESTRICT",
  // })
  // @JoinColumn([{ name: "release_id", referencedColumnName: "id" }])
  // release: Releases;
}
