import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { FileAttachmentEntity } from "../models/file-attachment.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(FileAttachmentEntity)
export class FileAttachmentRepository extends BaseRepository<FileAttachmentEntity> {
}